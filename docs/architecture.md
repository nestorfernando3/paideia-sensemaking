# Paideia Sensemaking — Arquitectura del Sistema

## Descripción General

Paideia Sensemaking es una extensión independiente de Paideia orientada a la evaluación formativa y el sentido pedagógico en tiempo real en aulas de Lengua Castellana de educación secundaria.

## Componentes Principales

```
+-----------------------------------------------------------------------+
|                         Navegador del Usuario                         |
|   (SPA Modular Vite + JS Vanilla, CSS Tokens, HTML Semántico)        |
+-------------------+-----------------------------------+---------------+
                    |                                   |
                    | Autenticación Anónima             | Invocación Edge
                    | Realtime / Postgres RLS           | Function
                    v                                   v
+-----------------------------------+   +-------------------------------+
|         Supabase Database         |   |     Supabase Edge Function    |
|       (Tablas ps_*, RLS, RPC)      |   |         (paideia-ai)          |
+-----------------------------------+   +---------------+---------------+
                                                        |
                                                        | Free-only Allowlist
                                                        v
                                        +-------------------------------+
                                        |       OpenCode Zen API        |
                                        |   (nemotron-3-ultra-free,     |
                                        |    deepseek-v4-flash-free,    |
                                        |    mimo-v2.5-free)            |
                                        +-------------------------------+
```

## Flujo de Datos y Gobierno de IA

1. **Selección Pre-Vuelo de Modelos Gratuitos:**
   - La Edge Function cruza dos snapshots de metadatos (disponibilidad en `opencode.ai/zen/v1/models` y costo cero en `models.dev/api.json`).
   - Se filtran con la allowlist ordenada del servidor y la tabla pública de confirmación de precio de Zen.
   - Si no existen modelos elegibles, devuelve `FREE_MODEL_UNAVAILABLE` sin emitir inferencias.

2. **Aislamiento y Gobierno:**
   - El cliente envía únicamente IDs (`sessionId`, `stageRunId`) e intenciones.
   - Servidor recupera datos autorizados, minimiza, redacta PII (`[EMAIL]`, `[PHONE]`), trunca y aplica seudónimos efímeros aleatorios (`learner_01`, `learner_02`).
   - Los datos del aula se delimitan entre `BEGIN_DATA` y `END_DATA` en el prompt con instrucción estricta de no seguir comandos en los datos.

3. **Orquestación en Aula:**
   - Transiciones de etapa gestionadas por RPC definidores de seguridad `ps_activate_stage`.
   - Suscripción Realtime a `ps_sessions` y `ps_responses` para sincronización instantánea entre dispositivos.
