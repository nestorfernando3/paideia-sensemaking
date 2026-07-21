import { escapeHtml } from "../utils/escapeHtml.js";

/**
 * Renders declarative activity specification into HTML form fields.
 * @param {import('../domain/activitySchemas').ActivitySpec} activitySpec
 * @param {Object} [existingPayload]
 * @returns {string}
 */
export function renderActivity(activitySpec, existingPayload = {}) {
  if (!activitySpec) return "";

  const title = escapeHtml(activitySpec.title || "");
  const prompt = escapeHtml(activitySpec.prompt || "");

  if (activitySpec.type === "open_response") {
    const responseLabel = escapeHtml(activitySpec.responseLabel || "Tu respuesta");
    const maxLength = activitySpec.maxLength || 1200;
    const value = escapeHtml(existingPayload.response || existingPayload.answer || "");

    return `
      <div class="activity-container animate-fade-in">
        <h3 class="activity-title" style="font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-xs);">${title}</h3>
        <p class="activity-prompt" style="font-size: var(--text-base); color: var(--color-gold); margin-bottom: var(--space-md);">${prompt}</p>
        
        <div class="input-group">
          <label for="open-response-input">${responseLabel}</label>
          <textarea
            id="open-response-input"
            name="response"
            class="input"
            rows="5"
            maxlength="${maxLength}"
            placeholder="Escribe tu respuesta pedagógica aquí..."
            required
          >${value}</textarea>
          <span class="hint" style="text-align: right; display: block; margin-top: 4px;">Máximo ${maxLength} caracteres</span>
        </div>
      </div>
    `;
  }

  if (activitySpec.type === "three_column") {
    const columns = activitySpec.columns || [
      { key: "said", label: "Qué se dijo" },
      { key: "intended", label: "Qué se intentó hacer" },
      { key: "effect", label: "Qué efecto produjo" },
    ];

    const fieldsHtml = columns
      .map((col) => {
        const key = col.key;
        const label = escapeHtml(col.label);
        const val = escapeHtml(existingPayload[key] || "");
        return `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label for="col-${key}">${label}</label>
            <textarea
              id="col-${key}"
              name="${key}"
              class="input"
              rows="3"
              placeholder="Desarrolla esta dimensión..."
              required
            >${val}</textarea>
          </div>
        `;
      })
      .join("");

    return `
      <div class="activity-container animate-fade-in">
        <h3 class="activity-title" style="font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-xs);">${title}</h3>
        <p class="activity-prompt" style="font-size: var(--text-base); color: var(--color-gold); margin-bottom: var(--space-md);">${prompt}</p>
        
        <div class="three-column-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: var(--space-md);">
          ${fieldsHtml}
        </div>
      </div>
    `;
  }

  if (activitySpec.type === "transfer_justification") {
    const caseText = escapeHtml(activitySpec.caseText || "");
    const fields = activitySpec.fields || [
      { key: "said", label: "Qué se dijo" },
      { key: "intended", label: "Qué se intentó hacer" },
      { key: "effect", label: "Qué efecto produjo" },
      { key: "justification", label: "Explica por qué" },
    ];

    const fieldsHtml = fields
      .map((col) => {
        const key = col.key;
        const label = escapeHtml(col.label);
        const val = escapeHtml(existingPayload[key] || "");
        return `
          <div class="input-group" style="margin-bottom: var(--space-md);">
            <label for="field-${key}">${label}</label>
            <textarea
              id="field-${key}"
              name="${key}"
              class="input"
              rows="${key === "justification" ? 4 : 2}"
              placeholder="Escribe tu análisis..."
              required
            >${val}</textarea>
          </div>
        `;
      })
      .join("");

    return `
      <div class="activity-container animate-fade-in">
        <h3 class="activity-title" style="font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-xs);">${title}</h3>
        <div class="case-card" style="padding: var(--space-md); background: rgba(255,255,255,0.04); border-left: 4px solid var(--color-gold); border-radius: var(--radius-sm); margin-bottom: var(--space-md);">
          <strong style="color: var(--color-gold); display: block; margin-bottom: 4px;">Caso de análisis:</strong>
          <p style="font-size: var(--text-base); font-style: italic;">${caseText}</p>
        </div>

        <div class="transfer-fields">
          ${fieldsHtml}
        </div>
      </div>
    `;
  }

  return `<p class="error">Tipo de actividad no reconocido.</p>`;
}
