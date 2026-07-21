# Paideia Sensemaking — Build Week Submission

## Información General

- **Categoría:** Educación / Evaluación Formativa
- **Nombre:** Paideia Sensemaking
- **Repositorio:** `nestorfernando3/paideia-sensemaking`
- **Despliegue:** `https://nestorfernando3.github.io/paideia-sensemaking/`
- **Session ID Feedback:** `80238be9-ac49-48f2-a123-17f62364a22a`

## Procedencia y Desarrollo

- **Construido con:** Codex usando GPT-5.6 durante la fase de desarrollo.
- **Runtime Desplegado:** Separado y 100% Free-Only. Las tres funciones en producción (`analyze_stage`, `compare_learning`, `assist_user`) invocan únicamente modelos gratuitos prevalidados de OpenCode Zen (`nemotron-3-ultra-free`, `deepseek-v4-flash-free`, `mimo-v2.5-free`).
- **Resguardo de Costos:** Nunca se llama a GPT-5.6, OpenAI ni a ningún modelo pago en tiempo de ejecución. Si la allowlist se agota, el sistema degrada a `FREE_MODEL_UNAVAILABLE` y la clase continúa manualmente.

## Características Clave

1. **Orquestación de Aula en Tiempo Real:** El docente crea la sesión, activa etapas y los dispositivos de los estudiantes se sincronizan automáticamente.
2. **Interpretación Pedagógica en 3 Columnas:** Análisis colectivo de actos de habla identificando lo dicho, la intención implícita y el efecto producido.
3. **Privacidad Rigurosa:** Consentimiento informado opt-in individual y colectivo, minimización, redacción de PII, seudónimos efímeros y purga automática de datos en 24h.
4. **Verificación de Transferencia:** Evaluación comparativa antes/después frente a un caso nuevo.

## Instrucciones de Prueba

1. **Modo Docente:**
   - Crear una nueva sesión en `/new-session` ingresando tema (ej: "Actos de habla") y pregunta inicial.
   - Activar la etapa inicial y compartir el código de 6 caracteres.
   - Invocación de `analyze_stage` para recibir resumen, patrones y propuestas de intervención.
2. **Modo Estudiante:**
   - Ingresar en `/join` con el código de 6 caracteres y responder la actividad.
   - Solicitar pistas u orientaciones contextuales gratuitas con la ayuda de Paideia.

## Verificación Técnica

- Pruebas Unitarias Vitest: 48/48 PASS
- Pruebas Deno Edge Function: 15/15 PASS
- Pruebas pgTAP: 103/103 PASS
- Compilación Vite: Exit code 0
