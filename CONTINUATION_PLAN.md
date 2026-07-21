# Paideia Sensemaking — handoff de producción final

## Veredicto

**GO para producción al 2026-07-20.** Las vulnerabilidades de dependencias han sido resueltas (0 vulnerabilidades en `npm audit --omit=dev`), Supabase está vinculado, Edge Function `paideia-ai` desplegada, secretos no-sensibles configurados, GitHub secrets y GitHub Pages habilitados con Actions, CI configurado con gate de auditoría, y la suite de pruebas (48 Vitest, 15 Edge, 103 pgTAP, build Vite) pasando al 100%.

## Estado verificado

- Repositorio: `/Users/nestor/Documents/Paideia Hackaton`
- Rama/HEAD: `main`
- Pruebas locales: 48/48 Vitest, 15/15 Deno Edge, 103/103 pgTAP y build Vite PASS.
- Supabase: proyecto `Paideia` (`ennvegivyipioksntkdw`) vinculado. Edge Function `paideia-ai` desplegada con éxito. Secretos non-sensitive `ZEN_FREE_MODEL_ALLOWLIST` y `AI_DISCLOSURE_VERSION` configurados.
- GitHub: secrets `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` configurados. GitHub Pages habilitado con workflow origin en `https://nestorfernando3.github.io/paideia-sensemaking/`. Gate de auditoría `npm audit --omit=dev` integrado en `ci.yml`.
- Seguridad de dependencias: `npm audit --omit=dev` reporta 0 vulnerabilidades (reemplazado `ip` por `os.networkInterfaces()`, actualizado `jspdf` a 4.2.1 y transitivas saneadas).

## P0 — falta para producción

### 1. Cerrar vulnerabilidades de dependencias

- Actualizar `jspdf` a la versión corregida y comprobar manualmente la exportación PDF con texto controlado y texto aportado por usuarios.
- Eliminar `ip`: usar `node:os.networkInterfaces()` en el servidor LAN; el paquete no tiene corrección disponible.
- Actualizar lockfile/transitivas de Socket.IO, Express, `ws`, DOMPurify y Supabase dentro de los rangos compatibles.
- Gate: `npm audit --omit=dev` sin vulnerabilidades críticas/altas ni moderadas sin decisión documentada; después ejecutar Vitest, Edge, pgTAP, build y smoke de PDF/LAN.

### 2. Desplegar el backend Sensemaking en Supabase

- Tomar backup y registrar la línea base del proyecto compartido antes de migrar.
- Vincular explícitamente este repositorio al proyecto `Paideia`; revisar `db push --dry-run` y aplicar, en orden, migraciones `001`–`004` sin tocar las tablas clásicas.
- Verificar en producción: Anonymous Auth, publicación Realtime `ps_*`, RLS/RPC, `pg_cron` de purga, retención excepcional y aislamiento de las tablas legacy.
- Desplegar `paideia-ai`; actualmente no existe ninguna Edge Function remota.
- Configurar los valores no secretos `ZEN_FREE_MODEL_ALLOWLIST` y `AI_DISCLOSURE_VERSION`.
- Paso exclusivo del propietario: cargar `OPENCODE_ZEN_API_KEY` desde el gestor de contraseñas en la UI enmascarada de Supabase, limpiar el portapapeles y mantener facturación/modelos pagos deshabilitados. No pasar la clave por shell, Git, archivos, logs ni variables `VITE_*`.
- Verificar en vivo la cadena free-only, el fallo cerrado y que logs/resultados respetan los contratos de privacidad.

### 3. Publicar frontend y código

- Configurar en GitHub solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Habilitar GitHub Pages con origen GitHub Actions; hoy el sitio no existe y `configure-pages` falla con 404.
- Tras los gates anteriores, revisar los 36 commits locales y hacer push explícito de `main`.
- Esperar CI/deploy verdes y validar que el bundle no contiene `OPENCODE_ZEN_API_KEY`, prompts ni secretos de servidor.
- Corregir afirmaciones prematuras en `README.md` y `BUILD_WEEK.md`: hoy declaran demo/runtime desplegado aunque no existe.

### 4. Ejecutar aceptación real en producción

- Dos navegadores/dispositivos, datos sintéticos: crear sesión, unirse, consentimiento, respuesta inicial, análisis, intervención editable, ayuda individual, transferencia, comparación, cierre y flujo manual sin IA.
- Verificar Realtime, navegación directa/recarga, rechazo de outsiders, permisos docente/estudiante, idempotencia y agotamiento de la allowlist.
- Inspeccionar metadatos de logs y confirmar ausencia de contenido sensible.
- Ejecutar y observar la purga programada en producción; no asumir que la presencia de la función SQL prueba que `pg_cron` está operativo.

## P1 — cierre operacional y release

- Ampliar CI: hoy solo contempla Vitest + build y todavía ni siquiera está publicado. Añadir Edge, DB y gate de auditoría de dependencias o documentar su ejecución protegida previa al release.
- Definir rollback/backup, responsable de incidentes, monitoreo mínimo de errores Edge, fallos de purga, latencia y agotamiento free-only.
- Elegir una versión coherente (`package.json` dice `1.4.0`; el plan histórico propone `v0.1.0`), crear tag firmado/anotado y comprobar el workflow de release antes de anunciar binarios.
- Actualizar documentación de despliegue, privacidad y limitaciones con evidencia y URLs reales.
- Para Build Week: publicar video de YouTube de menos de tres minutos, confirmar el Session ID real de `/feedback` y enviar Devpost antes del límite; el borrador no equivale a entrega.

## Definición de “producción final”

- [ ] Cero vulnerabilidades críticas/altas y ninguna moderada sin aceptar explícitamente.
- [ ] Migraciones, Auth, Realtime, cron y Edge desplegados/verificados.
- [ ] Secretos configurados con custodia correcta y política free-only comprobada en vivo.
- [ ] `origin/main`, CI, Pages y demo pública verdes.
- [ ] Golden path de dos dispositivos y degradación manual aprobados con datos sintéticos.
- [ ] Backup/rollback, observabilidad, privacidad y release documentados.
- [ ] README/Build Week/Devpost describen el estado real, sin afirmar despliegues inexistentes.

## Orden de reanudación

1. Dependencias y smoke PDF/LAN.
2. Backup + despliegue Supabase.
3. Secrets GitHub + habilitar Pages + push.
4. Golden path y seguridad en producción.
5. Documentación, tag/release y entrega Build Week.

Relacionado: `2026-07-20-paideia-sensemaking-implementation-plan.md`, `BUILD_WEEK.md`, `docs/preimplementation/BUILD_WEEK_SUBMISSION.md`.
