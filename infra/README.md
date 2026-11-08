# Infraestructura AWS — Amishi Backend

Este documento te guía desde cero hasta tener el backend FastAPI corriendo en AWS,
con deploys automáticos por entorno. Si vienes del backend en Lambda, ve directo a
[Migración desde Lambda](#migración-desde-lambda-sin-cortar-el-sitio).

---

## Cómo funciona todo junto

```
Tu código (repo GitHub)
        │
        ├─► merge a develop ──► GitHub Actions ──► EC2 QA   (cuenta AWS DEV)
        │
        └─► merge a master  ──► GitHub Actions ──► EC2 PROD (cuenta AWS PROD)
```

El frontend vive en **Vercel** y llama al backend a través de `API_URL`. El backend
es FastAPI corriendo en una instancia **EC2 `t4g.nano`** (ARM, 512 MB) que está
siempre encendida:

```
visitante ─► Vercel ─► https://API_URL ─► Caddy :443 ─► uvicorn 127.0.0.1:8000 ─► S3
```

- **Caddy** termina HTTPS y obtiene el certificado de Let's Encrypt solo.
- **uvicorn** solo escucha en `127.0.0.1`; no es accesible desde internet.
- **systemd** mantiene ambos procesos vivos y los reinicia si se caen.
- El catálogo (`catalog.json`), las imágenes subidas y el hash de la contraseña se
  guardan en **S3**. El disco de la instancia no es fuente de verdad: si la
  instancia se recrea, los datos siguen ahí.
- Los secretos (`ADMIN_PASSWORD`, `SECRET_KEY`…) se guardan en **SSM Parameter
  Store** como `SecureString` y la instancia los lee en cada deploy.
- No hay puerto 22 abierto. Los deploys usan **SSM Run Command**: GitHub Actions
  sube un zip a S3 y le pide a la instancia que lo instale.

### Por qué una instancia y no Lambda

Lambda se apaga cuando no hay visitas. La siguiente visita espera a que Python,
FastAPI y boto3 arranquen (1–4 s con 256 MB), y con poco tráfico eso pasa casi
siempre: la navegación se sentía cortada. Una instancia chica siempre encendida
responde en milisegundos.

### Costo mensual por cuenta (us-east-1)

| Recurso | USD/mes |
|---|---|
| EC2 `t4g.nano` (créditos de CPU en modo `standard`, sin cargos sorpresa) | ~3.07 |
| Disco gp3 de 8 GB | ~0.64 |
| IPv4 pública (Elastic IP; AWS cobra todas las IPv4 públicas desde 2024) | ~3.65 |
| S3, SSM Parameter Store (estándar) y Run Command | ~0 |
| **Total** | **~7.40** |

QA y producción son cuentas separadas, así que el total es ~USD 15/mes con ambas
encendidas. El presupuesto de alerta (`monthly_budget_usd`) está en USD 10 por
cuenta. Si una cuenta todavía tiene la capa gratuita de 12 meses, la IPv4
pública es gratis.

### Qué es Terraform y por qué lo usamos

Terraform es una herramienta que crea y gestiona infraestructura en la nube a
partir de archivos de configuración (los `.tf` en `infra/terraform/`). En vez de
hacer clic en la consola de AWS para crear recursos, los describes en código y
Terraform los crea, actualiza o elimina según sea necesario.

El **tfstate** es el archivo donde Terraform guarda el estado actual de los recursos
que creó. Lo guardamos en S3 con versionado y bloqueo nativo mediante
`use_lockfile` (no en el repo), para que tanto tú localmente como GitHub Actions
lean el mismo estado y no dupliquen recursos.

### Archivos de esta carpeta

| Archivo | Para qué |
|---|---|
| `terraform/ec2.tf` | Instancia, Elastic IP, security group y parámetros SSM |
| `terraform/iam.tf` | Rol de la instancia (S3 + SSM) |
| `terraform/lambda.tf`, `terraform/api_gateway.tf` | Backend antiguo, solo mientras dura la migración |
| `terraform/tests/` | `terraform test` con provider simulado (sin credenciales) |
| `systemd/` | Unidades de uvicorn y Caddy, y el `Caddyfile` |
| `scripts/deploy_backend.sh` | Empaqueta el backend, lo sube a S3 y lo instala vía SSM |
| `scripts/server_install.sh` | Corre en la instancia: prepara swap, Python 3.12, Caddy y reinicia |
| `iam/` | Políticas del usuario `amishi-deploy` de cada cuenta |

---

## Prerequisitos

```bash
aws --version        # AWS CLI >= 2.x
terraform --version  # Terraform >= 1.10
python3 --version    # Python >= 3.12
```

Si no tienes el AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
Si no tienes Terraform: https://developer.hashicorp.com/terraform/install

La configuración asume la región `us-east-1` y que cada cuenta conserva su **VPC
por defecto** (todas las cuentas AWS la traen).

---

## FASE 0 — Preparar el repositorio (una sola vez)

### Crear la rama `develop`

Los workflows de GitHub Actions se disparan en push a `develop` (QA) y `master` (prod).

```bash
git checkout master
git pull origin master
git checkout -b develop
git push origin develop
```

### Proteger las ramas en GitHub

Ve a **Settings → Branches → Add branch ruleset** y en `develop` y `master`:

- Require a pull request before merging
- Require status checks → `pytest` y `terraform test` (workflow `test-backend.yml`)

```
feature/xxx ──► PR a develop ──► tests pasan ──► merge ──► deploy QA automático
develop     ──► PR a master  ──► tests pasan ──► merge ──► deploy PROD automático
```

---

## FASE 1 — Configurar tu máquina y las cuentas (una sola vez)

### Paso 1: Usuario IAM de deploy en cada cuenta

En cada cuenta AWS crea un usuario IAM dedicado para los deploys. **Nunca uses el
usuario root ni tus credenciales personales de admin.**

1. Consola AWS → **IAM → Policies → Create policy → JSON**, pega el archivo de la
   cuenta y guárdala como `amishi-deploy-policy`:
   - DEV: `infra/iam/amishi-deploy-policy-dev.json`
   - PROD: `infra/iam/amishi-deploy-policy-prod.json`

   Tiene que ser una política administrada: como política *inline* no cabe
   (AWS limita las inline de un usuario a 2.048 caracteres).
2. **IAM → Users → Create user**, nombre `amishi-deploy`, y en permisos
   **Attach policies directly** → `amishi-deploy-policy`.
3. **Security credentials → Create access key** (tipo CLI) y guarda ambas claves.

Las políticas permiten crear la instancia (`ec2:*` limitado a `us-east-1`), pasar
solo el rol `amishi[-qa]-api-role` a EC2, administrar los parámetros
`/amishi[-qa]/*` y ejecutar comandos SSM en las instancias de la cuenta.

> **Si el usuario ya existía (backend en Lambda):** reemplaza su política por la
> versión actual de `infra/iam/` en **ambas** cuentas antes del próximo deploy.
> Si en IAM → Users → `amishi-deploy` → Permissions la política aparece como
> *Customer managed*: ábrela → Edit → pestaña JSON → pega el archivo completo →
> Save. Si aparece como *Customer inline*, crea la política administrada del
> paso 1, adjúntala al usuario y recién entonces borra la inline. Sin esto,
> Terraform falla al crear la instancia con `UnauthorizedOperation`.

### Paso 2: Perfiles AWS locales

```bash
aws configure --profile amishi-dev    # claves de la cuenta DEV, región us-east-1
aws configure --profile amishi-prod   # claves de la cuenta PROD, región us-east-1

aws sts get-caller-identity --profile amishi-dev
aws sts get-caller-identity --profile amishi-prod
```

### Paso 3: Bucket del tfstate (bootstrap)

Una vez por cuenta. Los nombres de S3 son globales: si recibes
`BucketAlreadyExists`, añade un sufijo y actualiza `terraform/backends/*.tfbackend`.

```bash
aws s3 mb s3://amishi-tfstate-dev --region us-east-1 --profile amishi-dev
aws s3api put-bucket-versioning --bucket amishi-tfstate-dev \
    --versioning-configuration Status=Enabled --profile amishi-dev

aws s3 mb s3://amishi-tfstate-prod --region us-east-1 --profile amishi-prod
aws s3api put-bucket-versioning --bucket amishi-tfstate-prod \
    --versioning-configuration Status=Enabled --profile amishi-prod
```

---

## FASE 2 — Primer deploy local (QA)

Hacerlo una vez desde tu máquina confirma que todo funciona antes de depender del CI.

### Paso 4: Variables de Terraform

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.qa.tfvars
```

Edita `terraform.qa.tfvars` (está en `.gitignore`):

```hcl
aws_region   = "us-east-1"
project_name = "amishi"
environment  = "qa"
aws_profile  = "amishi-dev"

admin_email    = "admin@amishi.cl"
admin_password = "una-contrasena-de-prueba"
secret_key     = "salida de: python3 -c \"import secrets; print(secrets.token_hex(32))\""
cors_origins   = "https://amishi-qa.vercel.app"

# Vacío = https://<ip-con-guiones>.sslip.io (funciona sin configurar DNS)
api_domain = ""

# false si es una cuenta nueva sin backend Lambda que conservar
legacy_lambda_enabled = false
```

Con `legacy_lambda_enabled = true` necesitas antes `bash infra/scripts/build_lambda.sh`.

### Paso 5: Crear la infraestructura

```bash
cd infra/terraform
terraform init -backend-config=backends/qa.tfbackend
terraform plan  -var-file=terraform.qa.tfvars
terraform apply -var-file=terraform.qa.tfvars
cd ../..
```

Al terminar verás, entre otros:

```
api_url         = "https://3-91-10-20.sslip.io"
api_public_ip   = "3.91.10.20"
api_instance_id = "i-0abc..."
```

### Paso 6: Instalar el backend en la instancia

```bash
AWS_PROFILE=amishi-dev AWS_REGION=us-east-1 bash infra/scripts/deploy_backend.sh
```

El primer deploy tarda 3–5 minutos (instala swap, Python 3.12 y Caddy); los
siguientes, alrededor de un minuto. Si algo falla, el script muestra la salida de
la instancia y, si había una versión anterior, la deja corriendo.

### Paso 7: Verificar

```bash
curl https://3-91-10-20.sslip.io/api/productos
```

---

## FASE 3 — Primer deploy local (producción)

Igual que la fase 2 con `terraform.prod.tfvars` (`environment = "prod"`,
`aws_profile = "amishi-prod"`, credenciales reales):

```bash
cd infra/terraform
terraform init -backend-config=backends/prod.tfbackend -reconfigure
terraform apply -var-file=terraform.prod.tfvars
cd ../..
AWS_PROFILE=amishi-prod AWS_REGION=us-east-1 bash infra/scripts/deploy_backend.sh
```

`-reconfigure` evita que Terraform reutilice el backend de QA al cambiar de cuenta.

---

## FASE 4 — Automatizar con GitHub Actions

Cada merge a `develop` o `master` ejecuta: `terraform apply` → `deploy_backend.sh`
(zip a S3 + SSM) → verificación de `API_URL/api/productos`.

### Paso 8: Secrets

**Settings → Environments** → entornos `qa` y `Production` → **Environment secrets**:

| Secret (qa) | Secret (Production) | Valor |
|---|---|---|
| `AWS_ACCESS_KEY_ID_DEV` | `AWS_ACCESS_KEY_ID_PROD` | Access key de `amishi-deploy` |
| `AWS_SECRET_ACCESS_KEY_DEV` | `AWS_SECRET_ACCESS_KEY_PROD` | Secret correspondiente |
| `AWS_REGION_DEV` | `AWS_REGION_PROD` | `us-east-1` |
| `ADMIN_EMAIL_DEV` | `ADMIN_EMAIL_PROD` | Email del admin |
| `ADMIN_PASSWORD_DEV` | `ADMIN_PASSWORD_PROD` | Contraseña inicial del admin |
| `SECRET_KEY_DEV` | `SECRET_KEY_PROD` | Mismo valor que en el tfvars |
| `CORS_ORIGINS_QA` | `CORS_ORIGINS_PROD` | URL de Vercel del entorno |

### Paso 9: Variables (opcionales)

En los mismos entornos → **Environment variables**:

| Variable | Valor | Efecto |
|---|---|---|
| `API_DOMAIN` | ej. `api.amishi.cl` | Dominio propio para la API. Vacío = `sslip.io` |
| `LEGACY_LAMBDA_ENABLED` | `false` | Destruye Lambda y API Gateway (ver migración) |

---

## FASE 5 — Conectar Vercel

En Vercel → **Settings → Environment Variables** → `API_URL`:

- Preview (rama `develop`): `api_url` de la cuenta DEV.
- Production: `api_url` de la cuenta PROD.

**Después de cambiar `API_URL` hay que redesplegar** (Deployments → último deploy →
Redeploy): `next.config.ts` lee `API_URL` al compilar para los rewrites de `/api/*`.

### Dominio propio (opcional)

`sslip.io` funciona sin DNS, pero un dominio propio es más estable:

1. En el DNS de `amishi.cl`, crea un registro **A** `api` → `api_public_ip`.
2. Define la variable `API_DOMAIN=api.amishi.cl` en el entorno de GitHub.
3. Haz merge para redesplegar: Caddy pide el certificado para el nuevo dominio.
4. Cambia `API_URL` en Vercel a `https://api.amishi.cl` y redespliega.

---

## Migración desde Lambda (sin cortar el sitio)

Mientras Vercel apunte a API Gateway, Lambda debe seguir existiendo. Por eso
`legacy_lambda_enabled` vale `true` por defecto y los recursos antiguos conviven
con la instancia. Por entorno (primero QA, después producción):

1. **Actualiza la política IAM** de `amishi-deploy` (paso 1). Sin esto el deploy falla.
2. **Haz merge** a `develop` (o `master`). El workflow crea la instancia junto a
   Lambda, instala el backend y muestra `API_URL para Vercel: https://…`.
   El sitio sigue funcionando con Lambda.
3. **Prueba la API nueva:** `curl https://…/api/productos` debe devolver el catálogo.
   Los datos son los mismos: ambos backends leen el mismo bucket.
4. **Cambia `API_URL` en Vercel** a esa URL y **redespliega**. Desde aquí el sitio usa
   la instancia: se acaban los arranques en frío.
5. **Prueba el sitio y el admin** (login, editar un producto, subir una imagen).
6. **Apaga Lambda:** define `LEGACY_LAMBDA_ENABLED=false` en el entorno de GitHub y
   vuelve a ejecutar el workflow (Actions → Deploy Backend → Re-run). Terraform
   destruye Lambda, API Gateway y su rol.

**Rollback:** hasta el paso 6, basta con volver `API_URL` de Vercel a la URL de API
Gateway (`terraform output api_gateway_url`) y redesplegar.

### Limpieza final (cuando QA y producción ya corren sin Lambda)

Cuando ambos entornos tienen `LEGACY_LAMBDA_ENABLED=false` aplicado, borra en un
mismo PR:

- `infra/terraform/lambda.tf` y `infra/terraform/api_gateway.tf` (incluidos sus bloques `moved`)
- los outputs `api_gateway_url` y `lambda_function_name` de `outputs.tf`
- la variable `legacy_lambda_enabled`, el paso "Build legacy Lambda package" y el
  `-var legacy_lambda_enabled` de ambos workflows
- `infra/scripts/build_lambda.sh` y sus entradas en `.gitignore`
- `mangum` de `requirements.txt` y el bloque `handler = Mangum(app)` de `backend/main.py`
- las sentencias `LambdaDeployment`, `ApiGatewayDeployment`, `PassOnlyAmishiRoleToLambda`,
  `CloudWatchLogs` y el ARN `*-lambda-role` de las políticas en `infra/iam/`

---

## Operación del día a día

```
git checkout develop
git commit -m "feat: nueva funcionalidad"
git push origin develop        # ──► deploy automático a QA
# verificar en Vercel Preview

git checkout master
git merge develop
git push origin master         # ──► deploy automático a producción
```

### Ver logs o entrar a la instancia

No hay SSH. Con el [plugin de Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html):

```bash
aws ssm start-session --target <api_instance_id> --profile amishi-prod

sudo journalctl -u amishi-api -n 100 --no-pager   # logs de FastAPI
sudo journalctl -u caddy -n 100 --no-pager        # logs de HTTPS
sudo systemctl restart amishi-api
```

Para eso el usuario que abre la sesión necesita `ssm:StartSession`; el usuario
`amishi-deploy` no lo tiene a propósito. Usa tu usuario administrador.

### Probar la infraestructura sin AWS

```bash
cd infra/terraform
terraform init -backend=false
terraform test
```

---

## Troubleshooting

**`UnauthorizedOperation` o `AccessDenied` en `terraform apply`**
La política de `amishi-deploy` no está actualizada. Ver paso 1.

**`La instancia no se registró en SSM tras 10 minutos`**
La instancia necesita salida a internet para hablar con SSM. Revisa que esté en la
VPC por defecto con IP pública y que el rol `amishi[-qa]-api-role` tenga
`AmazonSSMManagedInstanceCore`.

**El deploy dice `API OK` pero la URL pública no responde**
Caddy no pudo obtener el certificado. Casi siempre es el DNS: el registro A de
`API_DOMAIN` todavía no apunta a `api_public_ip`, o no ha propagado. Revisa
`journalctl -u caddy`.

**El sitio muestra el catálogo vacío después de cambiar `API_URL`**
Vercel no se redesplegó, o `CORS_ORIGINS` no incluye la URL de Vercel.

**`Error: Backend configuration changed`**
Cambiaste de cuenta sin `-reconfigure`:
```bash
terraform init -backend-config=backends/qa.tfbackend -reconfigure
```

**GitHub Actions falla en `terraform init`**
Verifica los secrets `AWS_ACCESS_KEY_ID_*` / `AWS_SECRET_ACCESS_KEY_*` del entorno.
