# Sesión actual

> Plantilla: rellena al empezar una feature. Al cerrar la sesión, mueve el
> contenido a `progress/history.md` y deja solo esta plantilla.

## Feature en curso

- **ID:** 25
- **Nombre:** Infraestructura de producción AWS y Vercel
- **Inicio:** 2026-07-26
- **Estado:** en progreso

## Plan breve

1. Adaptar imágenes y catálogo a almacenamiento S3 persistente.
2. Añadir límites de API Gateway, Lambda y presupuesto.
3. Validar y aplicar Terraform en AWS.
4. Configurar Vercel y verificar producción.
5. Automatizar `develop` → Vercel Preview/AWS DEV y `master` → Vercel/AWS PROD.

## Cambios realizados

- Auditoría completada: perfiles AWS disponibles; Vercel CLI ausente.
- Detectado `terraform.qa.tfvars` con valores de ejemplo y entorno incorrecto.
- Detectados permisos IAM insuficientes para inspección y bootstrap de Terraform.
- Vercel autenticado y proyecto existente `amishi-website` enlazado.
- Bucket `amishi-tfstate-prod` creado con versionado; falta permiso para verificar/aplicar bloqueo público.
- Imágenes administradas adaptadas a S3 y paquete Lambda generado (30 MB).
- Rate limit 2 req/s, ráfaga 10, concurrencia 2 y presupuesto mensual de US$5 declarados.
- Workflows separados por rama y cuenta, con secretos de GitHub por environment.
- Bucket de estado `amishi-tfstate-dev` creado; falta completar su endurecimiento.
- Vercel confirmado conectado al repo; su rama de producción aún figura como `main`.
- AWS DEV desplegado: API Gateway `z9i07b0fa8`, Lambda `amishi-qa-api` y
  bucket privado/versionado `amishi-qa-catalog`.
- `API_URL` de Vercel Preview quedó sobrescrita específicamente para `develop`
  con la API de DEV.
- Smoke test DEV: catálogo 62 productos/6 categorías; login, biblioteca, carga
  S3 y render público de imagen respondieron correctamente.
- Plan DEV idempotente sin cambios. PROD quedó sin recursos destructivos
  pendientes; el próximo merge sólo actualizará el código Lambda.
- El primer workflow posterior al merge falló antes del apply porque CI usaba
  Terraform 1.6, incompatible con `use_lockfile`; se actualizó a Terraform
  1.15.8 y se elevó el requisito mínimo a 1.10.
- El deploy de producción ahora espera el resultado exitoso de `Test Backend`
  en `master` y hace checkout del SHA exacto que fue probado.

## Verificación

- [x] `pytest` — 54 passed
- [x] `npm test` — 4 passed
- [x] `npm run lint`
- [x] `npm run build`
- [x] `./init.sh` final

## Notas / bloqueos

- Sin bloqueos activos.
