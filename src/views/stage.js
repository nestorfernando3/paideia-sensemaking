// ==========================================================================
// PAIDEIA Sensemaking — Stage View
// Vista de etapa activa con renderizado declarativo, asistente e IA gratuita
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { renderActivity } from '../components/activityRenderer.js';
import {
  renderAssistantPanel,
  renderAssistantResponse,
  renderAssistantError,
} from '../components/assistantPanel.js';
import {
  getSensemakingSession,
  listStageRuns,
  activateStage,
  createTransferStage,
  submitStageResponse,
  subscribeToSession,
  getCurrentMembership,
} from '../services/sessionService.js';
import { requestUserAssistance } from '../services/aiService.js';
import { getCurrentRole, isTeacher } from '../utils/session.js';
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
  let membership = null;

  try {
    [session, stageRuns, membership] = await Promise.all([
      getSensemakingSession(sessionId),
      listStageRuns(sessionId),
      getCurrentMembership(sessionId),
    ]);
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

  const role = getCurrentRole() || 'student';
  const teacher = isTeacher();
  const isActive = stageRun.status === 'active';
  const aiEnabled = Boolean(
    session.allow_free_ai_assistance && membership?.free_ai_consent_at
  );
  const initialStage = stageRuns.find((stage) => stage.stage_kind === 'initial_response');

  const activityHtml = renderActivity(stageRun.activity_spec);
  const assistantHtml = renderAssistantPanel({
    enabled: aiEnabled,
    role: teacher ? 'teacher' : 'student',
    usesCount: 0,
  });

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

      ${teacher ? `
        <section class="animate-slide-up" style="margin-top: var(--space-lg);">
          ${activityHtml}
          ${isActive && stageRun.stage_kind === 'initial_response' ? `
            <a class="btn btn--gold btn--lg" style="margin-top: var(--space-lg);" href="#/session/${sessionId}/analysis/${stageRun.id}">
              Analizar respuestas con IA gratuita
            </a>
          ` : ''}
          ${isActive && stageRun.stage_kind === 'intervention' ? `
            <form id="transfer-stage-form" style="margin-top: var(--space-xl);">
              <div class="input-group">
                <label for="transfer-case">Caso nuevo para verificar transferencia</label>
                <textarea id="transfer-case" class="input" rows="3" maxlength="1200" required placeholder="Escribe un caso diferente que exija aplicar lo aprendido"></textarea>
              </div>
              <button type="submit" class="btn btn--gold btn--lg">Crear y activar transferencia</button>
            </form>
          ` : ''}
          ${isActive && stageRun.stage_kind === 'transfer' && initialStage ? `
            <a class="btn btn--gold btn--lg" style="margin-top: var(--space-lg);" href="#/session/${sessionId}/comparison/${initialStage.id}/${stageRun.id}">
              Comparar aprendizaje antes/después
            </a>
          ` : ''}
        </section>
      ` : `
        <form id="stage-response-form" class="animate-slide-up" style="margin-top: var(--space-lg);">
          ${activityHtml}

          <div style="margin-top: var(--space-xl); display: flex; justify-content: space-between; align-items: center;">
            <div id="response-status" style="font-size: var(--text-sm); color: var(--color-gold);"></div>
            <button type="submit" class="btn btn--gold btn--lg" id="submit-response-btn" ${!isActive ? 'disabled' : ''}>
              Enviar respuesta
            </button>
          </div>
        </form>
      `}

      ${assistantHtml}
    </div>
  `;

  // Assistant button click handlers
  const assistButtons = contentEl.querySelectorAll('.assist-btn');
  const responseArea = contentEl.querySelector('#assistant-response-area');

  assistButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const intent = btn.getAttribute('data-intent');
      if (!intent) return;

      btn.disabled = true;
      if (responseArea) {
        responseArea.style.display = 'block';
        responseArea.innerHTML = '<p class="hint">Consultando modelo gratuito...</p>';
      }

      try {
        const assistance = await requestUserAssistance({
          sessionId,
          stageRunId: stageRun.id,
          intent,
        });

        if (responseArea) {
          responseArea.innerHTML = renderAssistantResponse(assistance);
        }
      } catch (err) {
        console.error(err);
        if (responseArea) {
          responseArea.innerHTML = renderAssistantError(err?.message || 'ERROR');
        }
      } finally {
        btn.disabled = false;
      }
    });
  });

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

  const transferForm = document.getElementById('transfer-stage-form');
  if (transferForm) {
    transferForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const caseText = document.getElementById('transfer-case')?.value.trim();
      if (!caseText) return;

      const button = transferForm.querySelector('button[type="submit"]');
      if (button) {
        button.disabled = true;
        button.textContent = 'Activando transferencia...';
      }

      try {
        const transferStage = await createTransferStage({
          sessionId,
          activitySpec: {
            type: 'transfer_justification',
            title: 'Verificación de transferencia',
            prompt: 'Aplica las tres dimensiones del acto de habla al caso nuevo.',
            caseText,
            fields: [
              { key: 'said', label: 'Qué se dijo' },
              { key: 'intended', label: 'Qué se intentó hacer' },
              { key: 'effect', label: 'Qué efecto produjo' },
              { key: 'justification', label: 'Explica por qué' },
            ],
          },
        });
        await activateStage(transferStage.id);
        window.location.hash = `/session/${sessionId}/stage/${transferStage.id}`;
      } catch (err) {
        console.error(err);
        alert(getOnlineSessionErrorMessage(err, 'crear la transferencia'));
        if (button) {
          button.disabled = false;
          button.textContent = 'Crear y activar transferencia';
        }
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
        await submitStageResponse({
          sessionId,
          stageRunId: stageRun.id,
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
