# Paideia Sensemaking — handoff de producción final

## Veredicto

**NO-GO para producción al 2026-07-20.** El despliegue estático y la seguridad de dependencias ya se corrigieron, pero el flujo Sensemaking no puede funcionar en producción: las migraciones `ps_*` no están aplicadas y falta `OPENCODE_ZEN_API_KEY`.

## Corregido y verificado

- Git: `main`, `origin/main` y HEAD están sincronizados en `39a7ded`; worktree limpio antes de actualizar este handoff.
- Dependencias: `npm audit --omit=dev` reporta 0 vulnerabilidades. `jspdf` está en `4.2.1`, `ip` fue eliminado y las transitivas afectadas quedaron actualizadas.
- Pruebas locales: 48/48 Vitest, 15/15 Deno Edge, 103/103 pgTAP y build Vite PASS.
- GitHub: CI y deploy Pages del commit `39a7ded` pasan; `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están configurados.
- Sitio público: `https://nestorfernando3.github.io/paideia-sensemaking/` responde HTTP 200 y sus assets JS/CSS responden 200.
- Supabase: el repositorio está vinculado y la Edge Function `paideia-ai` está ACTIVE.

## P0 — aún falta

### 1. Aplicar y verificar migraciones productivas

- Las tablas clásicas `sessions` y `tool_entries` responden 200, pero las seis tablas Sensemaking (`ps_sessions`, `ps_members`, `ps_stage_runs`, `ps_responses`, `ps_ai_runs`, `ps_teacher_decisions`) responden **404 / `PGRST205`** desde el mismo bundle productivo.
- Esto demuestra que las migraciones `001`–`004` no están aplicadas o no están expuestas en producción. Los clientes llaman directamente a esas tablas, por lo que el golden path está bloqueado.
- Tomar backup/baseline del proyecto compartido, resolver el permiso del rol CLI, ejecutar `db push --dry-run`, aplicar `001`–`004` y verificar RLS/RPC, Realtime y `pg_cron` sin alterar tablas clásicas.
- La comprobación `supabase migration list --linked` falla actualmente porque la cuenta no puede alterar el rol temporal `cli_login_postgres`; corregir permisos o verificar el historial desde el Dashboard antes de migrar.

### 2. Configurar el secreto de IA

- `paideia-ai` está desplegada, pero la lista remota de secretos no contiene `OPENCODE_ZEN_API_KEY`.
- El código devuelve `OPENCODE_ZEN_API_KEY_NOT_CONFIGURED` si falta, así que análisis, comparación y asistencia no pueden completarse.
- Paso exclusivo del propietario: cargar la clave desde el gestor de contraseñas en la UI enmascarada de Supabase, limpiar el portapapeles y confirmar facturación/modelos pagos deshabilitados. No pasarla por shell, Git, archivos, logs, Codex ni variables `VITE_*`.

### 3. Ejecutar aceptación real

- Después de los dos puntos anteriores: golden path en dos dispositivos con datos sintéticos, flujo manual sin IA, RLS/roles/outsider, Realtime, idempotencia, allowlist agotada, logs sin contenido y purga programada observada.
- Hasta que esta prueba pase, un workflow verde solo acredita compilación/despliegue estático, no funcionamiento productivo.

## P1 — calidad de release

- [x] **Modo LAN corregido y verificado**: `server/index.mjs` ahora espera la promesa de `selfsigned.generate()` y devuelve URLs `https://` en `/api/info`. Servidor HTTPS arranca limpiamente en puerto 3000.
- [x] **CI Ampliado**: `.github/workflows/ci.yml` incluye `denoland/setup-deno@v2` y ejecuta tanto Vitest (48/48) como Deno Edge (15/15) en el pipeline de GitHub Actions junto con el gate de auditoría `npm audit --omit=dev` y el build.
- Corregir el handoff/README/Build Week después de la aceptación; no declarar “runtime desplegado” antes de verificar schema, clave y golden path.
- Definir backup/rollback, monitoreo de Edge/purga/free-only, versión/tag y release. No hay releases publicados.
- Completar video, `/feedback` y envío final de Devpost si siguen dentro del alcance Build Week.

## Definición de terminado

- [x] Dependencias sin vulnerabilidades y suites locales verdes.
- [x] `origin/main`, CI (Vitest + Edge), Pages y assets públicos verdes.
- [x] Modo LAN corregido y verificado con HTTPS nativo.
- [ ] Migraciones `ps_*`, Auth, Realtime, RLS/RPC y cron verificados en producción.
- [ ] `OPENCODE_ZEN_API_KEY` custodiada y política free-only comprobada en vivo.
- [ ] Golden path de dos dispositivos y degradación manual aprobados.
- [ ] Backup/rollback, observabilidad, documentación y tag/release cerrados.

## Orden de reanudación

1. Backup + permisos CLI + migraciones `001`–`004`.
2. Carga del secreto Zen por el propietario.
3. Golden path y seguridad en producción.
4. Corregir/excluir LAN y cerrar CI operacional.
5. Documentación, tag/release y entrega Build Week.

Relacionado: `2026-07-20-paideia-sensemaking-implementation-plan.md`, `BUILD_WEEK.md`, `docs/preimplementation/BUILD_WEEK_SUBMISSION.md`.
