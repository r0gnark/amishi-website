# Infraestructura AWS — Amishi Backend

Este documento te guía desde cero hasta tener el backend FastAPI corriendo en AWS,
con deploys automáticos por entorno. Está pensado para ejecutarse en orden, una sola vez.

---

## Cómo funciona todo junto

```
Tu código (repo GitHub)
        │
        ├─► merge a develop ──► GitHub Actions ──► Lambda QA  (cuenta AWS DEV)
        │
        └─► merge a master  ──► GitHub Actions ──► Lambda PROD (cuenta AWS PROD)
                                      │
                               (pausa para aprobar)
```

El frontend vive en **Vercel** y llama al backend a través de la URL que expone
**API Gateway**. API Gateway es básicamente una puerta de entrada pública que
recibe las peticiones HTTP y las pasa a tu función **Lambda** (donde corre FastAPI).
Los datos del catálogo se guardan en **S3** (en lugar del filesystem local).

### Por qué dos cuentas AWS y no dos entornos en una cuenta

Tener cuentas separadas significa aislamiento total: un error en QA, una mala
configuración de permisos, o un script que borra recursos por error, nunca puede
afectar producción. Es la práctica estándar en equipos que manejan datos reales.

### Por qué Lambda y no EC2

| | Lambda | EC2 (t4g.nano) |
|---|---|---|
| Costo con poco tráfico | ~$0/mes | ~$3.5/mes (aunque no haya visitas) |
| Mantenimiento del servidor | Ninguno | Parches, actualizaciones, SSH |
| Escala automáticamente | Sí | No |
| Tiempo de arranque | ~200ms en frío | Siempre encendido |

Para un catálogo de productos con tráfico moderado, Lambda es la opción correcta.

### Qué es Terraform y por qué lo usamos

Terraform es una herramienta que crea y gestiona infraestructura en la nube a
partir de archivos de configuración (los `.tf` en `infra/terraform/`). En vez de
hacer clic en la consola de AWS para crear recursos, los describes en código y
Terraform los crea, actualiza o elimina según sea necesario.

El **tfstate** es el archivo donde Terraform guarda el estado actual de los recursos
que creó. Lo guardamos en S3 con versionado y bloqueo nativo mediante
`use_lockfile` (no en el repo), para que tanto tú localmente como GitHub Actions
lean el mismo estado y no dupliquen recursos.

---

## Prerequisitos

Antes de empezar, asegúrate de tener instalado:

```bash
# AWS CLI
aws --version        # necesitas >= 2.x

# Terraform
terraform --version  # necesitas >= 1.6

# Python (para los tests y build del Lambda)
python3 --version    # necesitas >= 3.12
```

Si no tienes el AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
Si no tienes Terraform: https://developer.hashicorp.com/terraform/install

---

## FASE 0 — Preparar el repositorio (una sola vez)

### Crear la rama `develop`

Los workflows de GitHub Actions se disparan en push a `develop` (QA) y `master` (prod).
Si `develop` no existe, el pipeline de QA nunca se activa.

```bash
git checkout master
git pull origin master
git checkout -b develop
git push origin develop
```

### Proteger las ramas en GitHub

Ve a **Settings → Branches → Add branch ruleset** y configura:

**Rama `develop`:**
- Require a pull request before merging
- Require status checks → selecciona el check `pytest` (del workflow `test-backend.yml`)

**Rama `master`:**
- Require a pull request before merging
- Require status checks → selecciona el check `pytest`

Esto garantiza que ningún código llegue a QA ni a prod sin pasar los tests.

El flujo de trabajo queda así:

```
feature/xxx ──► PR a develop ──► tests pasan ──► merge ──► deploy QA automático
develop     ──► PR a master  ──► tests pasan ──► merge ──► deploy PROD (con aprobación manual)
```

---

## FASE 1 — Configurar tu máquina (una sola vez)

### Paso 1: Obtener las credenciales de cada cuenta AWS

En cada una de tus dos cuentas AWS necesitas crear un usuario IAM dedicado para
los deploys. **Nunca uses el usuario root ni tus credenciales personales de admin.**

Para cada cuenta:
1. Entra a la consola de AWS → **IAM → Users → Create user**
2. Nombre sugerido: `amishi-deploy`
3. En "Permissions", adjunta la política correspondiente a la cuenta:
   - DEV: `infra/iam/amishi-deploy-policy-dev.json`
   - PROD: `infra/iam/amishi-deploy-policy-prod.json`

Estas políticas limitan `iam:PassRole` al rol Lambda de cada cuenta y usan las
acciones reales de AWS Budgets (`ModifyBudget` y `ViewBudget`).

4. Una vez creado, ve a **Security credentials → Create access key** (tipo: CLI)
5. Guarda el `Access Key ID` y el `Secret Access Key` — los verás una sola vez

Haz esto **en ambas cuentas** antes de continuar.

---

### Paso 2: Configurar perfiles AWS locales

Un perfil nombrado es simplemente un alias que guarda las credenciales de una
cuenta. Así puedes tener dos cuentas en tu máquina sin mezclarlas.

```bash
# Configura el perfil para la cuenta DEV
aws configure --profile amishi-dev
```

El CLI te pedirá:
```
AWS Access Key ID:     <pega el Access Key de la cuenta DEV>
AWS Secret Access Key: <pega el Secret Key de la cuenta DEV>
Default region name:   us-east-1
Default output format: json
```

```bash
# Repite para la cuenta PROD
aws configure --profile amishi-prod
```

Verifica que cada perfil apunta a la cuenta correcta:
```bash
aws sts get-caller-identity --profile amishi-dev
# Deberías ver el Account ID de tu cuenta DEV

aws sts get-caller-identity --profile amishi-prod
# Deberías ver el Account ID de tu cuenta PROD
```

---

### Paso 3: Crear la infraestructura de estado de Terraform (bootstrap)

Terraform necesita guardar en algún lugar el registro de los recursos que creó
(llamado "tfstate"). Lo guardamos en S3 y activamos el bloqueo nativo del estado.

Estos recursos se crean **una sola vez por cuenta** y nunca los toca Terraform
(son el fundamento sobre el que trabaja).

> **Por qué los nombres de bucket pueden chocar entre cuentas distintas:**
> A diferencia de Lambda o IAM (que son privados a tu cuenta), los nombres
> de S3 son globalmente únicos en todo AWS — compartidos entre millones de cuentas
> del mundo, como dominios de internet. `amishi-tfstate-dev` y `amishi-tfstate-prod`
> son suficientemente específicos y es muy improbable que ya existan.
> Si aún así recibes `BucketAlreadyExists`, añade un sufijo cualquiera (ej: `amishi-tfstate-dev-2025`).

```bash
# ── CUENTA DEV ─────────────────────────────────────────────────────────────

# Crear el bucket que guardará el tfstate
aws s3 mb s3://amishi-tfstate-dev --region us-east-1 --profile amishi-dev

# Activar versionado (permite recuperar estados anteriores si algo sale mal)
aws s3api put-bucket-versioning \
    --bucket amishi-tfstate-dev \
    --versioning-configuration Status=Enabled \
    --profile amishi-dev

echo "Bootstrap DEV listo"
```

```bash
# ── CUENTA PROD ────────────────────────────────────────────────────────────

aws s3 mb s3://amishi-tfstate-prod --region us-east-1 --profile amishi-prod

aws s3api put-bucket-versioning \
    --bucket amishi-tfstate-prod \
    --versioning-configuration Status=Enabled \
    --profile amishi-prod

echo "Bootstrap PROD listo"
```

> Los comandos usan `--profile` explícito en lugar de `export AWS_PROFILE`
> para evitar confusiones si hay otras variables de entorno activas.

---

## FASE 2 — Primer deploy local (QA)

Hacer el primer deploy desde tu máquina te permite verificar que todo funciona
antes de configurar el CI. Solo necesitas hacerlo una vez; después todo corre
desde GitHub Actions.

### Paso 4: Preparar las variables de entorno de Terraform

```bash
# Desde la raíz del repositorio
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.qa.tfvars
```

Edita `terraform.qa.tfvars` con los valores reales para QA:

```hcl
aws_region   = "us-east-1"
project_name = "amishi"
environment  = "qa"
aws_profile  = "amishi-dev"   # el perfil que configuraste en el paso 2

admin_email    = "admin@amishi.cl"
admin_password = "una-contrasena-de-prueba"

# Genera un secreto con: python3 -c "import secrets; print(secrets.token_hex(32))"
secret_key = "pega-aqui-el-secreto-generado"

# Deja vacío por ahora; lo actualizarás con la URL de Vercel QA después
cors_origins = ""
```

### Paso 5: Construir el paquete Lambda

Este script empaqueta el código del backend junto con sus dependencias Python
en un archivo `.zip` que AWS Lambda puede ejecutar.

```bash
bash infra/scripts/build_lambda.sh
# Output esperado: "==> Listo: infra/lambda_package.zip (X.XM)"
```

### Paso 6: Inicializar Terraform para QA

```bash
cd infra/terraform

# Conecta Terraform con el tfstate en la cuenta DEV
# Esto descarga los plugins de AWS y lee el estado actual (vacío la primera vez)
terraform init -backend-config=backends/qa.tfbackend
```

### Paso 7: Ver qué va a crear Terraform (plan)

```bash
terraform plan -var-file=terraform.qa.tfvars
```

Terraform imprimirá una lista de recursos que va a crear. En el primer deploy
deberías ver algo como `Plan: 12 to add, 0 to change, 0 to destroy`. Revisa que
los nombres de los recursos incluyan el sufijo `-qa`.

### Paso 8: Aplicar (crear la infraestructura)

```bash
terraform apply -var-file=terraform.qa.tfvars
```

Terraform pedirá confirmación. Escribe `yes`. El proceso tarda 1-2 minutos.

Al terminar verás:

```
Outputs:
api_gateway_url    = "https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com"
lambda_function_name = "amishi-qa-api"
s3_bucket_name    = "amishi-qa-catalog"
```

**Guarda la `api_gateway_url`** — la necesitas para conectar Vercel.

### Paso 9: Verificar que el backend responde

```bash
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/api/productos
# Debería responder: {"products": []}
```

---

## FASE 3 — Primer deploy local (producción)

Repite los pasos 4-8 para producción. La diferencia clave es el perfil AWS y
el archivo de backend.

```bash
# Crear variables para prod
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.prod.tfvars
# Editar: environment=prod, aws_profile=amishi-prod, credenciales reales

# Empaquetar (si no lo hiciste ya)
bash infra/scripts/build_lambda.sh

cd infra/terraform

# -reconfigure es necesario al cambiar de cuenta para que Terraform
# no intente reutilizar el backend de QA
terraform init -backend-config=backends/prod.tfbackend -reconfigure

terraform plan  -var-file=terraform.prod.tfvars
terraform apply -var-file=terraform.prod.tfvars
```

---

## FASE 4 — Automatizar con GitHub Actions

A partir de aquí no necesitas correr Terraform manualmente. Cada merge a
`develop` o `master` lanza el pipeline automáticamente.

### Paso 10: Configurar los secrets en GitHub

Ve a tu repositorio → **Settings → Secrets and variables → Actions → New repository secret**

Crea estos 14 secrets dentro de los GitHub Environments `qa` y `Production`:

**Para la cuenta DEV (entorno QA):**

| Secret | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID_DEV` | Access Key del usuario `amishi-deploy` de la cuenta DEV |
| `AWS_SECRET_ACCESS_KEY_DEV` | Secret correspondiente |
| `AWS_REGION_DEV` | `us-east-1` (o la región que uses) |
| `ADMIN_EMAIL_DEV` | Email del admin para QA |
| `ADMIN_PASSWORD_DEV` | Contraseña del admin para QA |
| `SECRET_KEY_DEV` | El mismo `secret_key` que pusiste en `terraform.qa.tfvars` |
| `CORS_ORIGINS_QA` | URL de tu proyecto Vercel QA (ej: `https://amishi-qa.vercel.app`) |

**Para la cuenta PROD:**

| Secret | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID_PROD` | Access Key del usuario `amishi-deploy` de la cuenta PROD |
| `AWS_SECRET_ACCESS_KEY_PROD` | Secret correspondiente |
| `AWS_REGION_PROD` | `us-east-1` |
| `ADMIN_EMAIL_PROD` | Email del admin real |
| `ADMIN_PASSWORD_PROD` | Contraseña del admin real (usa una segura) |
| `SECRET_KEY_PROD` | El mismo `secret_key` que pusiste en `terraform.prod.tfvars` |
| `CORS_ORIGINS_PROD` | URL de tu proyecto Vercel prod (ej: `https://amishi.vercel.app`) |

### Paso 11: Entornos de GitHub

El workflow de `develop` usa el environment `qa` y el de `master` usa
`Production`. Sin reglas de aprobación, ambos despliegues comienzan
automáticamente después del merge. Puedes añadir reviewers a `Production` más
adelante si deseas una aprobación manual.

### Paso 12: Verificar que el CI funciona

```bash
# Haz un cambio pequeño (ej. un comentario en backend/main.py) y pushea a develop
git checkout develop
git commit --allow-empty -m "test: verificar pipeline QA"
git push origin develop
```

Ve a tu repositorio → **Actions** y verás el workflow `Deploy Backend — QA`
ejecutándose. Debería completar en ~3-4 minutos.

---

## FASE 5 — Conectar el frontend Vercel con el backend AWS

### Paso 13: Configurar API_URL en Vercel

La URL del output de Terraform (`api_gateway_url`) es la dirección pública de
tu backend. Vercel la necesita para saber dónde enviar las peticiones del frontend.

1. Entra a [vercel.com](https://vercel.com) → tu proyecto.
2. En **Settings → Environments → Production → Branch Tracking**, selecciona
   `master`.
3. En **Settings → Environment Variables**, configura `API_URL`:
   - Preview, rama `develop`: URL de API Gateway de la cuenta AWS DEV.
   - Production: URL de API Gateway de la cuenta AWS PROD.

La integración Git de Vercel crea un Preview con cada push a `develop` y un
deployment de Production con cada push a `master`.

---

## Operación del día a día

Una vez configurado todo, el flujo normal es:

```
# Desarrollar y probar en local
git checkout develop
git commit -m "feat: nueva funcionalidad"
git push origin develop
# ──► GitHub Actions despliega automáticamente a QA (cuenta DEV)
# ──► Verificas en https://amishi-qa.vercel.app

# Cuando QA está validado, mergeas a master
git checkout master
git merge develop
git push origin master
# ──► GitHub Actions despliega automáticamente a producción (cuenta PROD)
```

---

## Troubleshooting

**`Error: S3 bucket already exists`**
El nombre `amishi-tfstate` ya está tomado globalmente. Cambia el nombre en
`backends/qa.tfbackend` y `backends/prod.tfbackend` (ej: `amishi-tfstate-2025`).

**`Error: Backend configuration changed`**
Ocurre al cambiar entre la cuenta DEV y PROD sin `-reconfigure`. Solución:
```bash
terraform init -backend-config=backends/qa.tfbackend -reconfigure
```

**El Lambda devuelve 502 Bad Gateway**
Suele ser un error en el código Python. Revisa los logs en CloudWatch:
```bash
aws logs tail /aws/lambda/amishi-qa-api --follow --profile amishi-dev
```

**`ModuleNotFoundError` en Lambda**
El zip no incluye las dependencias. Vuelve a ejecutar `build_lambda.sh` y
asegúrate de que `requirements.txt` está completo, luego re-aplica con Terraform.

**GitHub Actions falla en `terraform init`**
Verifica que los secrets `AWS_ACCESS_KEY_ID_DEV` / `AWS_SECRET_ACCESS_KEY_DEV`
estén configurados correctamente y que el usuario IAM tenga acceso a S3.
