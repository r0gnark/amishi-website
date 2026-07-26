# Copia este archivo a terraform.tfvars y completa los valores reales.
# NUNCA hagas commit de terraform.tfvars — contiene secretos.
#
# Copia para QA:   cp terraform.tfvars.example terraform.qa.tfvars
# Copia para prod: cp terraform.tfvars.example terraform.prod.tfvars

aws_region   = "us-east-1"
project_name = "amishi"

# "qa" para la cuenta dev, "prod" para la cuenta prod
environment = "prod"

# Perfil AWS local (el que corresponde a la cuenta de este entorno).
# Dejar vacío en CI — las credenciales las inyecta GitHub Actions.
# En local: configura los perfiles con `aws configure --profile amishi-dev`
aws_profile = "amishi-prod"   # o "amishi-prod" para prod

# CMS credentials
admin_email    = "admin@amishi.cl"
admin_password = "cambiar-en-produccion"

# JWT signing key — generar con: python3 -c "import secrets; print(secrets.token_hex(32))"
secret_key = "genera-un-secreto-largo-y-aleatorio"

# Orígenes CORS del frontend Vercel (separados por coma)
cors_origins = "https://amishi-qa.vercel.app"
