import { escapeHtml } from "../utils/escapeHtml.js";

/**
 * Renders individual process matrix for teacher observation.
 * Shows participation per student and stage without assigning grades or static labels.
 * @param {Object} input
 * @param {Array<{ user_id: string, display_name: string, role: string }>} input.members
 * @param {Array<{ id: string, stage_kind: string, sequence_number: number }>} input.stageRuns
 * @param {Array<{ stage_run_id: string, user_id: string, payload: unknown }>} input.responses
 * @returns {string}
 */
export function renderProcessMatrix({ members = [], stageRuns = [], responses = [] } = {}) {
  const students = members.filter((m) => m.role === "student");
  const sortedStages = [...stageRuns].sort((a, b) => a.sequence_number - b.sequence_number);

  const responseMap = new Map();
  for (const resp of responses) {
    responseMap.set(`${resp.stage_run_id}:${resp.user_id}`, resp.payload);
  }

  const stageHeaders = sortedStages
    .map(
      (s) => `
      <th style="padding: 10px; text-align: center; border-bottom: 2px solid var(--color-gold); font-size: var(--text-xs);">
        Etapa ${s.sequence_number}<br/><span style="font-weight: 400; opacity: 0.8;">${escapeHtml(s.stage_kind)}</span>
      </th>
    `
    )
    .join("");

  const rows = students
    .map((stu) => {
      const studentName = escapeHtml(stu.display_name);
      const cells = sortedStages
        .map((s) => {
          const payload = responseMap.get(`${s.id}:${stu.user_id}`);
          let statusText = "Sin respuesta";
          let badgeClass = "badge--olive";

          if (payload) {
            statusText = "Respondió";
            badgeClass = "badge--gold";
          }

          return `
            <td style="padding: 10px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <span class="badge ${badgeClass}" style="font-size: 11px;">${statusText}</span>
            </td>
          `;
        })
        .join("");

      return `
        <tr>
          <td style="padding: 10px; font-weight: 600; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: var(--text-sm);">${studentName}</td>
          ${cells}
        </tr>
      `;
    })
    .join("");

  return `
    <div class="process-matrix-container animate-fade-in" style="margin-top: var(--space-xl); padding: var(--space-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: rgba(255,255,255,0.02);">
      <h3 style="font-size: var(--text-lg); font-weight: 700; color: var(--color-gold); margin-bottom: var(--space-xs);">Matriz de Proceso Individual</h3>
      <p style="font-size: var(--text-xs); color: var(--obsidian-soft); margin-bottom: var(--space-md);">Seguimiento cualitativo del avance en la secuencia pedagógica.</p>

      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid var(--color-gold); font-size: var(--text-xs);">Estudiante</th>
              ${stageHeaders}
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${sortedStages.length + 1}" style="padding: 16px; text-align: center; color: var(--obsidian-soft);">No hay estudiantes registrados aún en la sesión.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
