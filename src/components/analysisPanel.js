import { escapeHtml } from "../utils/escapeHtml.js";

/**
 * Renders the full pedagogical analysis panel for teachers.
 * @param {import('../domain/aiSchemas').StageAnalysis} analysis
 * @param {Object} [meta]
 * @returns {string}
 */
export function renderAnalysisPanel(analysis, meta = {}) {
  if (!analysis) return "";

  const summary = escapeHtml(analysis.summary || "");
  const usedModel = escapeHtml(meta.usedModel || "Modelo gratuito");
  const readinessStatus = analysis.readiness?.status || "intervene";
  const readinessRationale = escapeHtml(analysis.readiness?.rationale || "");

  const patternsHtml = (analysis.patterns || [])
    .map((p) => {
      const label = escapeHtml(p.label);
      const desc = escapeHtml(p.description);
      const evidenceHtml = (p.evidence || [])
        .map(
          (e) => `
          <div class="evidence-item" style="margin-top: 6px; padding: 8px; background: rgba(255,255,255,0.03); border-left: 3px solid var(--color-gold); border-radius: 4px;">
            <p style="font-size: var(--text-xs); font-style: italic;">"${escapeHtml(e.excerpt)}"</p>
          </div>
        `
        )
        .join("");

      return `
        <div class="pattern-card" style="padding: var(--space-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: var(--space-md);">
          <h4 style="font-size: var(--text-md); font-weight: 700; color: var(--color-gold);">${label}</h4>
          <p style="font-size: var(--text-sm); margin-top: 4px;">${desc}</p>
          <div class="evidence-section" style="margin-top: 8px;">
            <strong style="font-size: var(--text-xs); color: var(--obsidian-soft);">Evidencias:</strong>
            ${evidenceHtml}
          </div>
        </div>
      `;
    })
    .join("");

  const limitationsHtml = (analysis.limitations || [])
    .map((lim) => `<li style="font-size: var(--text-sm); color: var(--obsidian-soft);">${escapeHtml(lim)}</li>`)
    .join("");

  const optionsHtml = (analysis.options || [])
    .map((opt) => {
      const key = escapeHtml(opt.key);
      const title = escapeHtml(opt.title);
      const rationale = escapeHtml(opt.rationale);
      const act = opt.activity;

      return `
        <div class="option-card" data-option-key="${key}" style="padding: var(--space-md); border: 2px solid var(--color-gold); border-radius: var(--radius-md); margin-bottom: var(--space-lg); background: rgba(255,255,255,0.02);">
          <h4 style="font-size: var(--text-lg); font-weight: 700; color: var(--color-gold);">${title}</h4>
          <p style="font-size: var(--text-sm); margin: 6px 0 var(--space-md);">${rationale}</p>
          
          <div class="option-preview" style="padding: var(--space-sm); background: rgba(0,0,0,0.2); border-radius: var(--radius-sm); margin-bottom: var(--space-md);">
            <strong style="font-size: var(--text-xs); color: var(--color-gold);">Estructura propuesta:</strong>
            <p style="font-size: var(--text-sm); font-weight: 600; margin-top: 2px;">${escapeHtml(act.title)}</p>
            <p style="font-size: var(--text-xs); margin-top: 2px;">${escapeHtml(act.prompt)}</p>
          </div>

          <button type="button" class="btn btn--gold btn--full activate-option-btn" data-key="${key}">
            Activar esta propuesta pedagógica
          </button>
        </div>
      `;
    })
    .join("");

  return `
    <div class="analysis-panel animate-fade-in">
      <header class="analysis-header" style="margin-bottom: var(--space-lg); display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="font-size: var(--text-2xl); font-weight: 700;">Análisis Pedagógico de Clase</h3>
          <p style="font-size: var(--text-xs); color: var(--color-gold); margin-top: 2px;">Procesado mediante ${usedModel}</p>
        </div>
        <span class="badge ${readinessStatus === 'advance' ? 'badge--olive' : 'badge--gold'}">
          ${readinessStatus === 'advance' ? 'Listo para avanzar' : 'Intervención recomendada'}
        </span>
      </header>

      <section class="analysis-summary-section" style="margin-bottom: var(--space-lg);">
        <h4 style="font-size: var(--text-md); font-weight: 700; margin-bottom: 6px;">Resumen pedagógico</h4>
        <p style="font-size: var(--text-base); line-height: 1.6;">${summary}</p>
        <p style="font-size: var(--text-sm); font-style: italic; color: var(--color-gold); margin-top: 8px;">"${readinessRationale}"</p>
      </section>

      <section class="analysis-patterns-section" style="margin-bottom: var(--space-lg);">
        <h4 style="font-size: var(--text-md); font-weight: 700; margin-bottom: var(--space-sm);">Patrones observados</h4>
        ${patternsHtml}
      </section>

      ${limitationsHtml ? `
        <section class="analysis-limitations-section" style="margin-bottom: var(--space-lg);">
          <h4 style="font-size: var(--text-md); font-weight: 700; margin-bottom: 6px;">Límites del análisis</h4>
          <ul style="padding-left: 20px;">${limitationsHtml}</ul>
        </section>
      ` : ''}

      <section class="analysis-options-section" style="margin-top: var(--space-xl);">
        <h3 style="font-size: var(--text-xl); font-weight: 700; margin-bottom: var(--space-md); color: var(--color-gold);">Opciones para continuar</h3>
        ${optionsHtml}
      </section>
    </div>
  `;
}
