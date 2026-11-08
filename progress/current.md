# Sesión actual

> Plantilla: rellena al empezar una feature. Al cerrar la sesión, mueve el
> contenido a `progress/history.md` y deja solo esta plantilla.

## Feature en curso

- **ID:** 27
- **Nombre:** always_on_ec2_backend — Backend siempre encendido en t4g.nano
- **Inicio:** 2026-11-08 19:20 (UTC-3)
- **Estado:** in_progress (código completo; falta el primer deploy real en AWS)

## Plan breve

1. Instancia `t4g.nano` ARM (Amazon Linux 2023) con Elastic IP, security group
   80/443 sin SSH e instance profile S3 + SSM.
2. Uvicorn en `127.0.0.1:8000` y Caddy con HTTPS automático, ambos con systemd.
3. Secretos en SSM Parameter Store (SecureString), no en `user_data` ni en el repo.
4. Deploy desde GitHub Actions: zip del backend a S3 y `ssm send-command`.
5. Lambda y API Gateway conviven (`legacy_lambda_enabled`) hasta cambiar
   `API_URL` en Vercel; luego se destruyen.

## Cambios realizados

- `infra/terraform/ec2.tf`: instancia, EIP, SG, parámetros SSM (`env`, `domain`),
  subnet por defecto en una AZ que ofrece `t4g.nano`, créditos de CPU `standard`.
- `infra/terraform/iam.tf`: rol de instancia (S3 + `AmazonSSMManagedInstanceCore`).
- `lambda.tf` / `api_gateway.tf`: detrás de `legacy_lambda_enabled` (default `true`)
  con bloques `moved`; el zip solo se lee si está activo.
- `s3.tf`: expiración de `releases/` a 30 días. Presupuesto de alerta a USD 10.
- `infra/systemd/`: `amishi-api.service`, `caddy.service`, `Caddyfile`.
- `infra/scripts/server_install.sh`: swap, Python 3.12, Caddy 2.11.9 (SHA-512
  verificado), release con venv propia, health check y rollback automático.
- `infra/scripts/deploy_backend.sh`: bundle, S3, SSM Run Command y verificación.
- Workflows QA/prod: deploy por SSM; variables `API_DOMAIN` y `LEGACY_LAMBDA_ENABLED`.
- `test-backend.yml`: job `terraform test` (fmt, validate, test con provider simulado).
- Políticas IAM de `amishi-deploy` ampliadas (EC2, instance profile, SSM).
- Docs: `infra/README.md` reescrito, `architecture.md`, `verification.md`, README.

## Verificación

- `./init.sh` verde: pytest 65/65 (5 nuevos en `tests/test_server_config.py`).
- `terraform fmt`, `validate` y `terraform test` (2 escenarios) verdes; mutación
  del escape de secretos detectada por el test.
- Simulación completa en contenedor `amazonlinux:2023` con systemd (x86_64; el
  Docker local no emula arm64): `deploy_backend.sh` → `server_install.sh` instala
  Python 3.12, arranca uvicorn (usuario `amishi`) y Caddy (usuario `caddy`);
  `/api/productos` devuelve 62 productos; contraseña con `"`, `$` y `\` llega
  intacta; segundo deploy idempotente; release rota hace rollback y falla el job.
- Memoria medida: uvicorn ~60 MB + Caddy ~50 MB.

## Notas / bloqueos

- **Pendiente manual (usuario):** actualizar la política IAM de `amishi-deploy` en
  ambas cuentas, primer deploy, cambiar `API_URL` en Vercel y redesplegar, luego
  `LEGACY_LAMBDA_ENABLED=false`. Pasos en `infra/README.md` → "Migración desde Lambda".
- No verificado contra AWS real: creación de la instancia, registro en SSM y
  certificado de Let's Encrypt. Tampoco el binario arm64 de Caddy ejecutándose
  (solo su checksum).
- Costo real ~USD 7.40/mes por cuenta: AWS cobra la IPv4 pública (~3.65).
- La limpieza de `lambda.tf`, `api_gateway.tf`, `build_lambda.sh` y `mangum`
  se hace tras apagar Lambda en ambos entornos (lista en `infra/README.md`).
