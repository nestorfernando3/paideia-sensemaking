# Política de Privacidad y Gobierno de IA en Paideia Sensemaking

## Principios de Privacidad y Tratamiento de Datos

1. **Minimización de Datos y Cero Identificadores Persistentes:**
   - La plataforma nunca envía nombres de estudiantes, correos electrónicos, teléfonos ni códigos institucionales a los modelos de inteligencia artificial.
   - Cada solicitud sustituye los identificadores por seudónimos aleatorios efímeros (`learner_01`, `learner_02`, etc.) que existen únicamente en memoria durante la ejecución de la función y no se persisten en base de datos ni logs.

2. **Redacción de PII y Truncamiento Automático:**
   - Todas las respuestas del aula son procesadas por un filtro de redacción automática antes de salir del servidor para reemplazar patrones de correo electrónico (`[EMAIL]`) y teléfono (`[PHONE]`).
   - El texto libre se trunca automáticamente a un máximo de 2000 caracteres por entrada.

3. **Advertencia de Privacidad de Modelos Gratuitos (OpenCode Zen):**
   - Paideia Sensemaking opera exclusivamente con modelos gratuitos autorizados de la allowlist de OpenCode Zen (`nemotron-3-ultra-free`, `deepseek-v4-flash-free`, `mimo-v2.5-free`).
   - **Nota sobre proveedores gratuitos:** Algunos proveedores de modelos gratuitos pueden retener o utilizar interacciones desidentificadas para entrenamiento y mejora de sus sistemas. Debido a que el texto libre escrito por los usuarios aún podría revelar la identidad, se advierte explícitamente a docentes y estudiantes no ingresar datos personales sensibles.

4. **Consentimiento y Atestación Institucional Separados:**
   - **Asistencia Individual (`assist_user`):** Requiere que el docente habilite la función al crear la sesión y que cada estudiante acepte el aviso de asistencia individual.
   - **Análisis Colectivo Externo (`analyze_stage` y `compare_learning`):** Comienza desactivado por defecto. Requiere:
     a) Atestación docente explícita de aprobación institucional.
     b) Consentimiento separado, versionado y reversible por cada participante.
   - Las respuestas de participantes sin consentimiento o con consentimiento retirado permanecen disponibles en el flujo local de la clase, pero son excluidas de todo payload enviado a modelos externos.

5. **Política de Purga y Logs Seguros:**
   - Los logs de ejecución del servidor registran únicamente metadatos operativos (`operation`, `selectedModel`, `effectiveModel`, `fallbackIndex`, `isFreeModel`, `status`, `inputHash` y `noticeVersion`). Nunca se registran prompts, respuestas, salidas de modelos ni alias.
   - Todas las respuestas, resultados de IA y extractos se purgan automáticamente de la base de datos a más tardar 24 horas después del cierre de la sesión, salvo que exista una obligación institucional documentada.

6. **Degradación Segura sin Modelos Pagos (`FREE_MODEL_UNAVAILABLE`):**
   - Si la cadena de modelos gratuitos no está disponible o falla la prevalidación de costo cero, la plataforma devuelve el estado `FREE_MODEL_UNAVAILABLE`.
   - La clase continúa en modo manual sin IA. Paideia Sensemaking **nunca** realiza llamadas a GPT-5.6, OpenAI ni a ningún modelo pago.
