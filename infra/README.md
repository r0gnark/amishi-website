# Infraestructura AWS — Amishi Backend

Este documento te guía desde cero hasta tener el backend FastAPI corriendo en AWS,
con deploys automáticos a producción.

---

## Cómo funciona todo junto

```
Tu código (repo GitHub)
        │
        ├─► merge a develop ──► GitHub Actions ──► solo tests (pytest + terraform test)
        │
        └─► merge a master  ──► GitHub Actions ──► EC2 única (cuenta AWS PROD)
```

No hay una segunda instancia para QA. `develop` comprueba el código; el único
backend de AWS vive en la cuenta de producción y se actualiza al mergear a
`master`. Así no se paga otra EC2 ni otra IPv4 pública.

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

Hay una sola cuenta encendida (producción), así que el total es ~USD 7.40/mes.
El presupuesto de alerta (`monthly_budget_usd`) está en USD 10. Si la cuenta
todavía tiene la capa gratuita de 12 meses, la IPv4 pública es gratis. La cuenta
DEV no debe tener instancia: ver [Dar de baja la cuenta DEV](#dar-de-baja-la-cuenta-dev-qa).

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

En `develop` y en `master` corren los tests. Solo un push a `master` crea o
actualiza la instancia en AWS.

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
feature/xxx ──► PR a develop ──► tests pasan ──► merge ──► sin cambios en AWS
develop     ──► PR a master  ──► tests pasan ──► merge ──► deploy PROD automático
```

---

## FASE 1 — Configurar tu máquina y las cuentas (una sola vez)

### Paso 1: Usuario IAM de deploy en la cuenta de producción

En la cuenta PROD crea un usuario IAM dedicado para los deploys. **Nunca uses el
usuario root ni tus credenciales personales de admin.** La cuenta DEV solo hace
falta si todavía tiene infraestructura vieja que destruir.

1. Consola AWS → **IAM → Policies → Create policy → JSON**, pega
   `infra/iam/amishi-deploy-policy-prod.json` y guárdala como `amishi-deploy-policy`.
   (`infra/iam/amishi-deploy-policy-dev.json` queda solo para el `terraform destroy`
   de la cuenta DEV.)

   Tiene que ser una política administrada: como política *inline* no cabe
   (AWS limita las inline de un usuario a 2.048 caracteres).
2. **IAM → Users → Create user**, nombre `amishi-deploy`, y en permisos
   **Attach policies directly** → `amishi-deploy-policy`.
3. **Security credentials → Create access key** (tipo CLI) y guarda ambas claves.

Las políticas permiten crear la instancia (`ec2:*` limitado a `us-east-1`), pasar
solo el rol `amishi[-qa]-api-role` a EC2, administrar los parámetros
`/amishi[-qa]/*` y ejecutar comandos SSM en las instancias de la cuenta.

> **Si el usuario ya existía:** reemplaza su política por la versión actual de
> `infra/iam/amishi-deploy-policy-prod.json`. Ya no incluye permisos de Lambda,
> API Gateway ni CloudWatch Logs: el backend antiguo fue eliminado.
> Si en IAM → Users → `amishi-deploy` → Permissions la política aparece como
> *Customer managed*: ábrela → Edit → pestaña JSON → pega el archivo completo →
> Save. Si aparece como *Customer inline*, crea la política administrada del
> paso 1, adjúntala al usuario y recién entonces borra la inline. Sin esto,
> Terraform falla al crear la instancia con `UnauthorizedOperation`.

### Paso 2: Perfiles AWS locales

```bash
aws configure --profile amishi-prod   # claves de la cuenta PROD, región us-east-1
aws sts get-caller-identity --profile amishi-prod

# Solo para dar de baja lo que haya quedado en la cuenta DEV:
aws configure --profile amishi-dev
aws sts get-caller-identity --profile amishi-dev
```

### Paso 3: Bucket del tfstate (bootstrap)

Una vez por cuenta. Los nombres de S3 son globales: si recibes
`BucketAlreadyExists`, añade un sufijo y actualiza `terraform/backends/*.tfbackend`.

```bash
aws s3 mb s3://amishi-tfstate-prod --region us-east-1 --profile amishi-prod
aws s3api put-bucket-versioning --bucket amishi-tfstate-prod \
    --versioning-configuration Status=Enabled --profile amishi-prod
```

El bucket `amishi-tfstate-dev` solo existe si ya se creó la cuenta DEV. No lo
borres antes del `terraform destroy` de esa cuenta: ahí está el estado.

---

## FASE 2 — Primer deploy local (producción)

Una sola vez, en la cuenta PROD, antes de depender del CI.

### Paso 4: Variables de Terraform

```bash
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.prod.tfvars
```

Edita `terraform.prod.tfvars` (está en `.gitignore`):

```hcl
aws_region   = "us-east-1"
project_name = "amishi"
environment  = "prod"
aws_profile  = "amishi-prod"

admin_email    = "admin@amishi.cl"
admin_password = "una-contrasena-real"
secret_key     = "salida de: python3 -c \"import secrets; print(secrets.token_hex(32))\""
cors_origins   = "https://amishi.vercel.app"

# Vacío = https://<ip-con-guiones>.sslip.io (funciona sin configurar DNS)
api_domain = ""
```

### Paso 5: Crear la infraestructura

```bash
cd infra/terraform
terraform init -backend-config=backends/prod.tfbackend
terraform plan  -var-file=terraform.prod.tfvars
terraform apply -var-file=terraform.prod.tfvars
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
AWS_PROFILE=amishi-prod AWS_REGION=us-east-1 bash infra/scripts/deploy_backend.sh
```

El primer deploy tarda 3–5 minutos (instala swap, Python 3.12 y Caddy); los
siguientes, alrededor de un minuto. Si algo falla, el script muestra la salida de
la instancia y, si había una versión anterior, la deja corriendo.

### Paso 7: Verificar

```bash
curl https://3-91-10-20.sslip.io/api/productos
```

---

## FASE 3 — Automatizar con GitHub Actions

Un merge a `develop` solo corre tests. Un merge a `master`, cuando `Test Backend`
termina en verde, ejecuta: `terraform apply` → `deploy_backend.sh` (zip a S3 + SSM)
→ verificación de `API_URL/api/productos`.

### Paso 8: Secrets

**Settings → Environments → Production → Environment secrets**:

| Secret | Valor |
|---|---|
| `AWS_ACCESS_KEY_ID_PROD` | Access key de `amishi-deploy` en la cuenta PROD |
| `AWS_SECRET_ACCESS_KEY_PROD` | Secret correspondiente |
| `AWS_REGION_PROD` | `us-east-1` |
| `ADMIN_EMAIL_PROD` | Email del admin |
| `ADMIN_PASSWORD_PROD` | Contraseña inicial del admin |
| `SECRET_KEY_PROD` | Mismo valor que en el tfvars |
| `CORS_ORIGINS_PROD` | URL de Vercel de producción (y la de preview, si el preview usa esta API) |

### Paso 9: Variables (opcionales)

En el entorno **Production** → **Environment variables**:

| Variable | Valor | Efecto |
|---|---|---|
| `API_DOMAIN` | ej. `api.amishi.cl` | Dominio propio para la API. Vacío = `sslip.io` |

---

## FASE 4 — Conectar Vercel

En Vercel → **Settings → Environment Variables** → `API_URL`, el mismo valor
(`api_url` de la cuenta PROD) en Preview y en Production. El preview de `develop`
habla con el mismo backend: un cambio en el admin de un preview escribe el
catálogo real.

**Después de cambiar `API_URL` hay que redesplegar** (Deployments → último deploy →
Redeploy): `next.config.ts` lee `API_URL` al compilar para los rewrites de `/api/*`.

### Dominio propio (opcional)

`sslip.io` funciona sin DNS, pero un dominio propio es más estable:

1. En el DNS de `amishi.cl`, crea un registro **A** `api` → `api_public_ip`.
2. Define la variable `API_DOMAIN=api.amishi.cl` en el entorno de GitHub.
3. Haz merge para redesplegar: Caddy pide el certificado para el nuevo dominio.
4. Cambia `API_URL` en Vercel a `https://api.amishi.cl` y redespliega.

---

## Dar de baja la cuenta DEV (QA)

Hazlo cuando esta rama ya esté en `develop`. Si el workflow `Deploy Backend — QA`
sigue en `develop`, el próximo push vuelve a crear la instancia.

Terraform solo borra lo que está en el estado de `amishi-tfstate-dev`. El bucket
de catálogo tiene versionado y no se vacía solo: hay que vaciarlo antes, o
`terraform destroy` se detiene en `BucketNotEmpty`.

1. Perfil de la cuenta DEV (el del paso 2) y un `terraform.qa.tfvars` con
   `environment = "qa"` y `aws_profile = "amishi-dev"`. Los secretos pueden ser
   los que usaste al crear QA; Terraform los exige para leer la configuración,
   no para conservar la instancia.

2. Vacía el bucket de catálogo (incluye versiones):

```bash
BUCKET=amishi-qa-catalog
PROFILE=amishi-dev

aws s3api list-object-versions --bucket "$BUCKET" --profile "$PROFILE" \
  --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' --output json \
  > /tmp/amishi-qa-versions.json
aws s3api delete-objects --bucket "$BUCKET" --profile "$PROFILE" \
  --delete file:///tmp/amishi-qa-versions.json

aws s3api list-object-versions --bucket "$BUCKET" --profile "$PROFILE" \
  --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' --output json \
  > /tmp/amishi-qa-markers.json
aws s3api delete-objects --bucket "$BUCKET" --profile "$PROFILE" \
  --delete file:///tmp/amishi-qa-markers.json
```

Si `delete-objects` responde que `Objects` está vacío, ese paso ya no tiene nada
que borrar. Con más de 1000 versiones, repite el listado.

3. Destruye el resto:

```bash
cd infra/terraform
terraform init -backend-config=backends/qa.tfbackend -reconfigure
terraform plan -destroy -var-file=terraform.qa.tfvars
terraform destroy -var-file=terraform.qa.tfvars
```

El plan debe listar la instancia `amishi-qa-api`, su Elastic IP, el security
group, el rol, el bucket `amishi-qa-catalog`, los parámetros SSM y, si seguían
en el estado, la Lambda y API Gateway. Si aparece algo de la cuenta PROD
(`amishi-api` sin el sufijo `-qa`), cancela: el backend de Terraform no es el
de DEV.

4. En la consola de la cuenta DEV, confirma que no quedan EC2, Elastic IP,
   Lambda ni API Gateway. El usuario IAM `amishi-deploy` no genera costo.
   El bucket `amishi-tfstate-dev` tampoco, salvo el almacenamiento del estado:
   bórralo solo después del destroy, cuando ya no vayas a volver a correr
   Terraform contra esa cuenta.

---

## Operación del día a día

```
git checkout develop
git commit -m "feat: nueva funcionalidad"
git push origin develop        # ──► solo tests; AWS no cambia

# cuando los tests están verdes y el cambio está listo:
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
