# Checkpoints — Estado final correcto

> Lista de comprobación objetiva. El revisor marca cada ítem al evaluar una feature.
> Una feature solo se aprueba si todos los checkpoints aplicables están en `[x]`.

## Entorno y arnés

- [ ] **C1** — `./init.sh` termina con `[OK] Entorno listo`.
- [ ] **C2** — `feature_list.json` tiene exactamente una feature en `in_progress`
  (la que se está revisando) o ninguna si ya está `done`.
- [ ] **C3** — `progress/current.md` documenta qué se hizo en la sesión.

## Calidad de código

- [ ] **C4** — Respeta las capas de `docs/architecture.md` (sin I/O en routers directamente).
- [ ] **C5** — Respeta `docs/conventions.md` (snake_case, imports ordenados, errores nombrados).
- [ ] **C6** — Sin credenciales hardcodeadas ni archivos `.env` commiteados.
- [ ] **C7** — Sin `print()` de debug ni TODOs sin contexto.

## Pruebas y arranque

- [ ] **C8** — `pytest` pasa al 100 % (tests nuevos para código nuevo en `backend/` y routers).
- [ ] **C9** — `uvicorn backend.main:app` arranca sin errores si la feature toca `backend/`.
- [ ] **C10** — Los criterios de `acceptance` en `feature_list.json` para la feature
  están todos cumplidos (el revisor los enumera uno a uno).

## Seguridad (aplicable desde feature 4 en adelante)

- [ ] **C11** — Rutas `/api/admin/*` rechazan peticiones sin token JWT válido (401).
- [ ] **C12** — Endpoints de escritura bajo `/api/admin/` no exponen datos sensibles
  en respuestas de error.
