// ==========================================================================
// PAIDEIA Sensemaking — Analysis View
// Vista docente para solicitar y revisar el análisis pedagógico
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { renderAnalysisPanel } from '../components/analysisPanel.js';
import { runStageAnalysis, createInterventionFromOption } from '../services/aiService.js';
import { getSensemakingSession, activateStage } from '../services/sessionService.js';
import { getOnlineSessionErrorMessage } from '../utils/online-errors.js';

export function renderAnalysis(sessionId, stageRunId) {
  return `
    ${renderHeader()}
    <main class="page">
      <div id="analysis-loading" style="text-align: center; padding: var(--space-2xl);">
        <p>Realizando análisis pedagógico de la etapa...</p>
      </div>
      <div id="analysis-content" class="animate-fade-in" style="display: none;"></div>
    </main>
  `;
}

export async function initAnalysis(sessionId, stageRunId) {
  const loadingEl = document.getElementById('analysis-loading');
  const contentEl = document.getElementById('analysis-content');
  if (!contentEl) return;

  let session = null;
  let analysisResult = null;

  try {
    session = await getSensemakingSession(sessionId);
    analysisResult = await runStageAnalysis({ sessionId, stageRunId });
  } catch (err) {
    console.error(err);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="error">${getOnlineSessionErrorMessage(err, 'realizar el análisis pedagógico')}</p>`;
    }
    return;
  }

  if (loadingEl) loadingEl.style.display = 'none';
  contentEl.style.display = 'block';

  const panelHtml = renderAnalysisPanel(analysisResult.analysis, {
    usedModel: analysisResult.usedModel,
  });

  contentEl.innerHTML = `
    <div class="tool-view">
      <header class="tool-view__header">
        <a class="back-nav" href="#/session/${session?.join_code || sessionId}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al panel de clase
        </a>
      </header>

      ${panelHtml}
    </div>
  `;

  // Attach option activation event listeners
  const buttons = contentEl.querySelectorAll('.activate-option-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.getAttribute('data-key');
      const option = analysisResult.analysis.options.find((o) => o.key === key);
      if (!option) return;

      btn.disabled = true;
      btn.textContent = 'Activando intervención...';

      try {
        const newStage = await createInterventionFromOption({
          sessionId,
          sourceStageRunId: stageRunId,
          optionKey: option.key,
          activitySpec: option.activity,
        });

        await activateStage(newStage.id);
        window.location.hash = `/session/${sessionId}/stage/${newStage.id}`;
      } catch (err) {
        console.error(err);
        alert(getOnlineSessionErrorMessage(err, 'activar la propuesta pedagógica'));
        btn.disabled = false;
        btn.textContent = 'Activar esta propuesta pedagógica';
      }
    });
  });
}
