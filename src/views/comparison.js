// ==========================================================================
// PAIDEIA Sensemaking — Comparison View
// Vista docente para comparar etapa inicial y etapa de transferencia
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { renderProcessMatrix } from '../components/processMatrix.js';
import { runLearningComparison } from '../services/aiService.js';
import {
  getSensemakingSession,
  listSessionMembers,
  listSessionResponses,
  listStageRuns,
} from '../services/sessionService.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { getOnlineSessionErrorMessage } from '../utils/online-errors.js';
import { deriveUserRole, getCurrentRole } from '../utils/session.js';

export function renderComparison(sessionId, initialStageRunId, transferStageRunId) {
  return `
    ${renderHeader()}
    <main class="page">
      <div id="comparison-loading" style="text-align: center; padding: var(--space-2xl);">
        <p>Realizando análisis comparativo de aprendizaje...</p>
      </div>
      <div id="comparison-content" class="animate-fade-in" style="display: none;"></div>
    </main>
  `;
}

export async function initComparison(sessionId, initialStageRunId, transferStageRunId) {
  const loadingEl = document.getElementById('comparison-loading');
  const contentEl = document.getElementById('comparison-content');
  if (!contentEl) return;

  const previousRole = getCurrentRole();
  const verifiedRole = await deriveUserRole(sessionId);
  if (verifiedRole !== previousRole) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  let session = null;
  let members = [];
  let stageRuns = [];
  let responses = [];
  let comparisonResult = null;

  try {
    session = await getSensemakingSession(sessionId);
    members = await listSessionMembers(sessionId);
    [stageRuns, responses] = await Promise.all([
      listStageRuns(sessionId),
      listSessionResponses(sessionId),
    ]);
    comparisonResult = await runLearningComparison({
      sessionId,
      initialStageRunId,
      transferStageRunId,
    });
  } catch (err) {
    console.error(err);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="error">${getOnlineSessionErrorMessage(err, 'realizar la comparación pedagógica')}</p>`;
    }
    return;
  }

  if (loadingEl) loadingEl.style.display = 'none';
  contentEl.style.display = 'block';

  const comp = comparisonResult.comparison;
  const summary = escapeHtml(comp.summary || "");
  const recStatus = comp.recommendation?.status || "advance";
  const recRationale = escapeHtml(comp.recommendation?.rationale || "");
  const usedModel = escapeHtml(comparisonResult.usedModel || "Modelo gratuito");

  const changesHtml = (comp.observedChanges || [])
    .map(
      (c) => `
      <div style="padding: var(--space-md); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
        <strong style="color: var(--color-gold); font-size: var(--text-md);">${escapeHtml(c.label)}</strong>
        <p style="font-size: var(--text-sm); margin-top: 4px;">${escapeHtml(c.description)}</p>
      </div>
    `
    )
    .join("");

  const diffsHtml = (comp.persistentDifficulties || [])
    .map(
      (d) => `
      <div style="padding: var(--space-md); border: 1px solid var(--terracotta); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
        <strong style="color: var(--terracotta); font-size: var(--text-md);">${escapeHtml(d.label)}</strong>
        <p style="font-size: var(--text-sm); margin-top: 4px;">${escapeHtml(d.description)}</p>
      </div>
    `
    )
    .join("");

  const matrixHtml = renderProcessMatrix({
    members,
    stageRuns,
    responses,
  });

  contentEl.innerHTML = `
    <div class="tool-view">
      <header class="tool-view__header">
        <a class="back-nav" href="#/session/${session?.join_code || sessionId}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al panel de clase
        </a>
      </header>

      <div class="comparison-panel animate-fade-in" style="margin-top: var(--space-md);">
        <header style="margin-bottom: var(--space-lg); display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="font-size: var(--text-2xl); font-weight: 700;">Comparación de Aprendizaje (Antes / Después)</h3>
            <p style="font-size: var(--text-xs); color: var(--color-gold); margin-top: 2px;">Procesado mediante ${usedModel}</p>
          </div>
          <span class="badge ${recStatus === 'advance' ? 'badge--olive' : 'badge--gold'}">
            Recomendación: ${recStatus === 'advance' ? 'Avanzar al siguiente tema' : 'Reforzar concepto'}
          </span>
        </header>

        <section style="margin-bottom: var(--space-lg);">
          <h4 style="font-size: var(--text-md); font-weight: 700; margin-bottom: 6px;">Resumen de evolución conceptual</h4>
          <p style="font-size: var(--text-base); line-height: 1.6;">${summary}</p>
          <p style="font-size: var(--text-sm); font-style: italic; color: var(--color-gold); margin-top: 8px;">"${recRationale}"</p>
        </section>

        <section style="margin-bottom: var(--space-lg);">
          <h4 style="font-size: var(--text-md); font-weight: 700; margin-bottom: var(--space-sm); color: var(--color-gold);">Cambios observados</h4>
          ${changesHtml || '<p class="hint">No se registraron cambios significativos.</p>'}
        </section>

        ${diffsHtml ? `
          <section style="margin-bottom: var(--space-lg);">
            <h4 style="font-size: var(--text-md); font-weight: 700; margin-bottom: var(--space-sm); color: var(--terracotta);">Dificultades que persisten</h4>
            ${diffsHtml}
          </section>
        ` : ''}

        ${matrixHtml}
      </div>
    </div>
  `;
}
