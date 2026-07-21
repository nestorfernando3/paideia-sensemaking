// ==========================================================================
// PAIDEIA Sensemaking — Stage View
// Vista de etapa activa con renderizado declarativo y envío de respuestas
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { renderActivity } from '../components/activityRenderer.js';
import {
  getSensemakingSession,
  listStageRuns,
  activateStage,
  submitStageResponse,
  subscribeToSession,
} from '../services/sessionService.js';
import { getCurrentRole, isTeacher, getStudentId } from '../utils/session.js';
import { getOnlineSessionErrorMessage } from '../utils/online-errors.js';

export function renderStage(sessionId, stageRunId) {
  return `
    ${renderHeader()}
    <main class="page">
      <div id="stage-loading" style="text-align: center; padding: var(--space-2xl);">
        <p>Cargando etapa pedagógica...</p>
      </div>
      <div id="stage-content" class="animate-fade-in" style="display: none;"></div>
    </main>
  `;
}

export async function initStage(sessionId, stageRunId) {
  const loadingEl = document.getElementById('stage-loading');
  const contentEl = document.getElementById('stage-content');
  if (!contentEl) return;

  let session = null;
  let stageRuns = [];

  try {
    session = await getSensemakingSession(sessionId);
    stageRuns = await listStageRuns(sessionId);
  } catch (err) {
    console.error(err);
    if (loadingEl) {
      loadingEl.innerHTML = `<p class="error">${getOnlineSessionErrorMessage(err, 'cargar la etapa')}</p>`;
    }
    return;
  }

  if (!session) {
    if (loadingEl) loadingEl.innerHTML = `<p class="empty-state__text">Sesión no encontrada</p>`;
    return;
  }

  const stageRun = stageRuns.find((s) => s.id === stageRunId) || stageRuns[0];
  if (!stageRun) {
    if (loadingEl) loadingEl.innerHTML = `<p class="empty-state__text">Etapa no encontrada</p>`;
    return;
  }

  const role = getCurrentRole();
  const teacher = isTeacher();
  const isActive = stageRun.status === 'active';

  const activityHtml = renderActivity(stageRun.activity_spec);

  if (loadingEl) loadingEl.style.display = 'none';
  contentEl.style.display = 'block';

  contentEl.innerHTML = `
    <div class="tool-view">
      <header class="tool-view__header">
        <a class="back-nav" href="#/session/${session.join_code || session.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Volver al panel de clase
        </a>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-md);">
          <div>
            <span class="badge ${isActive ? 'badge--gold' : 'badge--olive'}">
              ${isActive ? 'Etapa activa en el aula' : 'Etapa ' + stageRun.status}
            </span>
            <h2 style="font-size: var(--text-2xl); font-weight: 700; margin-top: 4px;">Etapa ${stageRun.sequence_number}: ${stageRun.stage_kind}</h2>
          </div>
          ${teacher && !isActive ? `
            <button id="activate-stage-btn" class="btn btn--gold">
              ⚡ Activar para la clase
            </button>
          ` : ''}
        </div>
      </header>

      <form id="stage-response-form" class="animate-slide-up" style="margin-top: var(--space-lg);">
        ${activityHtml}

        <div style="margin-top: var(--space-xl); display: flex; justify-content: space-between; align-items: center;">
          <div id="response-status" style="font-size: var(--text-sm); color: var(--color-gold);"></div>
          <button type="submit" class="btn btn--gold btn--lg" id="submit-response-btn" ${!isActive && !teacher ? 'disabled' : ''}>
            Enviar respuesta
          </button>
        </div>
      </form>
    </div>
  `;

  // Realtime subscription to session active_stage_run_id changes for students
  if (!teacher) {
    subscribeToSession(sessionId, (change) => {
      const newActiveStage = change.new?.active_stage_run_id;
      if (newActiveStage && newActiveStage !== stageRunId) {
        window.location.hash = `/session/${sessionId}/stage/${newActiveStage}`;
      }
    });
  }

  // Teacher activate stage button
  const activateBtn = document.getElementById('activate-stage-btn');
  if (activateBtn) {
    activateBtn.addEventListener('click', async () => {
      activateBtn.disabled = true;
      activateBtn.textContent = 'Activando...';
      try {
        await activateStage(stageRun.id);
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert(getOnlineSessionErrorMessage(err, 'activar la etapa'));
        activateBtn.disabled = false;
        activateBtn.textContent = '⚡ Activar para la clase';
      }
    });
  }

  // Response form submit
  const form = document.getElementById('stage-response-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = {};
      for (const [key, value] of formData.entries()) {
        payload[key] = value.toString().trim();
      }

      const statusEl = document.getElementById('response-status');
      const submitBtn = document.getElementById('submit-response-btn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
      }

      try {
        const userId = getStudentId();
        await submitStageResponse({
          sessionId,
          stageRunId: stageRun.id,
          userId,
          payload,
        });

        if (statusEl) statusEl.textContent = '✓ Respuesta enviada con éxito';
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Actualizar respuesta';
        }
      } catch (err) {
        console.error(err);
        if (statusEl) statusEl.textContent = '❌ Error al enviar respuesta';
        alert(getOnlineSessionErrorMessage(err, 'guardar tu respuesta'));
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enviar respuesta';
        }
      }
    });
  }
}
