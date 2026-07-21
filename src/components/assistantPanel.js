import { escapeHtml } from "../utils/escapeHtml.js";

/**
 * Renders the assistant panel component for student/teacher stage views.
 * @param {Object} options
 * @param {boolean} options.enabled
 * @param {'student' | 'teacher'} options.role
 * @param {number} [options.usesCount=0]
 * @returns {string}
 */
export function renderAssistantPanel({ enabled, role = "student", usesCount = 0 } = {}) {
  if (!enabled) return "";

  const isMaxedOut = usesCount >= 3;

  if (role === "student") {
    return `
      <div class="assistant-panel animate-fade-in" style="margin-top: var(--space-xl); padding: var(--space-md); border: 1px solid var(--color-gold); border-radius: var(--radius-md); background: rgba(255,255,255,0.02);">
        <div class="assistant-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-sm);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--color-gold); font-size: 1.2rem;">✦</span>
            <strong style="font-size: var(--text-md);">Ayuda de Paideia · modelo gratuito</strong>
          </div>
          <span class="badge badge--olive">${usesCount}/3 ayudas usadas</span>
        </div>

        ${
          isMaxedOut
            ? `<p class="hint" style="color: var(--color-gold); font-style: italic;">Ya usaste las tres ayudas disponibles en esta etapa. Continúa con tu respuesta o consulta al docente.</p>`
            : `
              <p class="hint" style="margin-bottom: var(--space-md);">Selecciona una ayuda orientadora para guiar tu análisis sin recibir la respuesta final:</p>
              <div class="assistant-actions" style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button type="button" class="btn btn--outline btn--sm assist-btn" data-intent="hint">💡 Dame una pista</button>
                <button type="button" class="btn btn--outline btn--sm assist-btn" data-intent="rephrase">🔄 Explícalo de otra forma</button>
                <button type="button" class="btn btn--outline btn--sm assist-btn" data-intent="example">📝 Muéstrame un ejemplo parecido</button>
              </div>
            `
        }

        <div id="assistant-response-area" style="margin-top: var(--space-md); display: none;"></div>

        <p style="font-size: var(--text-xs); color: var(--obsidian-soft); margin-top: var(--space-md); border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
          Esta ayuda puede equivocarse. Contrástala con la actividad y con tu docente.
        </p>
      </div>
    `;
  }

  return `
    <div class="assistant-panel animate-fade-in" style="margin-top: var(--space-md);">
      <button type="button" class="btn btn--ghost btn--sm assist-btn" data-intent="rewrite_instruction">
        ✨ Hacer más clara la instrucción
      </button>
      <div id="assistant-response-area" style="margin-top: var(--space-sm); display: none;"></div>
    </div>
  `;
}

/**
 * Renders formatted assistant response.
 * @param {import('../domain/aiSchemas').UserAssistance} assistance
 * @returns {string}
 */
export function renderAssistantResponse(assistance) {
  if (!assistance) return "";
  const msg = escapeHtml(assistance.message);
  const next = escapeHtml(assistance.nextAction);
  const model = escapeHtml(assistance.model);

  return `
    <div class="assistant-response-box" style="padding: var(--space-md); background: rgba(255,255,255,0.05); border-left: 3px solid var(--color-gold); border-radius: var(--radius-sm); margin-top: var(--space-sm);">
      <p style="font-size: var(--text-sm); line-height: 1.5;">${msg}</p>
      <div style="margin-top: 8px; font-size: var(--text-xs); color: var(--color-gold); font-weight: 600;">
        👉 Siguiente paso: ${next}
      </div>
      <div style="margin-top: 6px; font-size: 11px; color: var(--obsidian-soft);">
        Respuesta por ${model} (modelo gratuito)
      </div>
    </div>
  `;
}

/**
 * Renders error message for assistant failure without recommending paid fallback.
 * @param {string} errorCode
 * @returns {string}
 */
export function renderAssistantError(errorCode) {
  let message = "No se pudo obtener la ayuda en este momento. La actividad continúa normalmente.";
  if (errorCode === "FREE_MODEL_UNAVAILABLE") {
    message = "No hay un modelo gratuito disponible en este momento. Continúa con tu respuesta o consulta al docente.";
  }

  return `
    <div class="assistant-error-box" style="padding: var(--space-sm); background: rgba(255,100,100,0.1); border: 1px solid var(--terracotta); border-radius: var(--radius-sm); margin-top: var(--space-sm); color: #ff9999; font-size: var(--text-sm);">
      ⚠ ${escapeHtml(message)}
    </div>
  `;
}
