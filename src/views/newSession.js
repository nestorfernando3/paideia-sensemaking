// ==========================================================================
// PAIDEIA Sensemaking — New Session View
// El docente crea una sesión de clase pedagógicamente suficiente
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { createSensemakingSession } from '../services/sessionService.js';
import { setCurrentSession } from '../utils/session.js';
import { parseCreateSessionInput } from '../domain/sessionSchemas.js';
import { getOnlineSessionErrorMessage } from '../utils/online-errors.js';

export function renderNewSession() {
  return `
    ${renderHeader()}
    <main class="page">
      <a class="back-nav" href="#/">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver
      </a>

      <div class="tool-view">
        <div class="tool-view__header animate-fade-in">
          <div class="tool-view__greek-letter">✦</div>
          <h2 class="tool-view__name">Nueva Sesión Sensemaking</h2>
          <p class="tool-view__concept">Configura la experiencia pedagógica de la clase</p>
        </div>

        <form id="session-form" class="animate-slide-up">
          <div class="input-group">
            <label for="display-name">Nombre del docente</label>
            <input type="text" id="display-name" class="input" placeholder="Ej: Prof. María Delgado" required />
          </div>

          <div class="input-group">
            <label for="grade-level">Grado</label>
            <input type="text" id="grade-level" class="input" placeholder="Ej: 9° A" required />
          </div>

          <div class="input-group">
            <label for="topic">Tema de la clase</label>
            <input type="text" id="topic" class="input" placeholder="Ej: Actos de habla y fuerza ilocutiva" required />
          </div>

          <div class="input-group">
            <label for="learning-objective">Objetivo de aprendizaje</label>
            <textarea id="learning-objective" class="input" rows="2" placeholder="Diferenciar entre lo que se dice literalmente, la intención del hablante y el efecto en el oyente" required></textarea>
          </div>

          <div class="input-group">
            <label for="success-criteria">Criterio de éxito</label>
            <textarea id="success-criteria" class="input" rows="2" placeholder="El estudiante identifica el acto ilocutivo implícito en situaciones cotidianas" required></textarea>
          </div>

          <div class="input-group">
            <label for="initial-question">Pregunta inicial</label>
            <textarea id="initial-question" class="input" rows="3" placeholder="Si un docente dice '¿Pueden cerrar la puerta?', ¿está haciendo una pregunta o una petición?" required></textarea>
          </div>

          <div class="ai-config-box" style="margin-top: var(--space-lg); padding: var(--space-md); border: 1px solid var(--color-border); border-radius: var(--radius-md);">
            <h3 style="margin-bottom: var(--space-sm);">Configuración de asistencia e IA gratuita</h3>
            
            <label class="checkbox-label" style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px; cursor: pointer;">
              <input type="checkbox" id="allow-free-ai" />
              <span>Habilitar ayudas individuales con modelos gratuitos externos</span>
            </label>

            <div id="individual-ai-notice" class="hint" style="display: none; margin-bottom: 16px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
              <p>Las solicitudes de ayuda se procesarán con un modelo externo gratuito. No escribas nombres, correos, teléfonos ni información sensible.</p>
              <p style="margin-top: 4px;">Algunos proveedores gratuitos pueden retener o usar contenido desidentificado para mejorar sus modelos. El texto libre aún puede revelar identidad; no escribas datos personales.</p>
            </div>

            <label class="checkbox-label" style="display: flex; gap: 8px; align-items: flex-start; margin-bottom: 12px; cursor: pointer;">
              <input type="checkbox" id="allow-collective-ai" />
              <span>Habilitar análisis colectivo externo con modelos gratuitos</span>
            </label>

            <div id="collective-ai-notice" class="hint" style="display: none; margin-bottom: 16px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 4px;">
              <p>OpenCode Zen procesará datos desidentificados minimizados tras redacción y seudónimos efímeros. Se requiere consentimiento individual y atestación docente.</p>
            </div>

            <div id="attestation-group" style="display: none; margin-top: 12px;">
              <label class="checkbox-label" style="display: flex; gap: 8px; align-items: flex-start; cursor: pointer; color: var(--color-gold);">
                <input type="checkbox" id="teacher-attestation" />
                <span>Atestiguo que la institución aprobó proveedor, modelos y retención, y que obtendré las autorizaciones y asentimientos aplicables</span>
              </label>
            </div>
          </div>

          <button type="submit" class="btn btn--gold btn--lg btn--full" style="margin-top: var(--space-lg);">
            Crear sesión sensemaking
          </button>
        </form>
      </div>
    </main>
  `;
}

export function initNewSession() {
  const form = document.getElementById('session-form');
  if (!form) return;

  const freeAiCheckbox = document.getElementById('allow-free-ai');
  const collectiveAiCheckbox = document.getElementById('allow-collective-ai');
  const attestationGroup = document.getElementById('attestation-group');
  const teacherAttestation = document.getElementById('teacher-attestation');
  const individualNotice = document.getElementById('individual-ai-notice');
  const collectiveNotice = document.getElementById('collective-ai-notice');

  if (freeAiCheckbox && individualNotice) {
    freeAiCheckbox.addEventListener('change', () => {
      individualNotice.style.display = freeAiCheckbox.checked ? 'block' : 'none';
    });
  }

  if (collectiveAiCheckbox && collectiveNotice && attestationGroup) {
    collectiveAiCheckbox.addEventListener('change', () => {
      const isChecked = collectiveAiCheckbox.checked;
      collectiveNotice.style.display = isChecked ? 'block' : 'none';
      attestationGroup.style.display = isChecked ? 'block' : 'none';
      if (!isChecked && teacherAttestation) {
        teacherAttestation.checked = false;
      }
    });
  }

  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const displayName = document.getElementById('display-name').value;
    const gradeLevel = document.getElementById('grade-level').value;
    const topic = document.getElementById('topic').value;
    const learningObjective = document.getElementById('learning-objective').value;
    const successCriteria = document.getElementById('success-criteria').value;
    const initialQuestion = document.getElementById('initial-question').value;

    const allowFreeAiAssistance = freeAiCheckbox?.checked || false;
    const allowCollectiveExternalAi = collectiveAiCheckbox?.checked || false;
    const teacherAttestsAuthorization = teacherAttestation?.checked || false;

    try {
      const input = parseCreateSessionInput({
        displayName,
        gradeLevel,
        topic,
        learningObjective,
        successCriteria,
        initialQuestion,
        allowFreeAiAssistance,
        allowCollectiveExternalAi,
        teacherAttestsAuthorization,
      });

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creando sesión...';
      }

      const initialActivity = {
        type: 'open_response',
        title: 'Interpretación inicial',
        prompt: input.initialQuestion,
        responseLabel: 'Explica qué se dice y qué intenta hacer quien habla',
        maxLength: 1200,
      };

      const session = await createSensemakingSession({
        displayName: input.displayName,
        gradeLevel: input.gradeLevel,
        topic: input.topic,
        learningObjective: input.learningObjective,
        successCriteria: input.successCriteria,
        allowFreeAiAssistance: input.allowFreeAiAssistance,
        aiDisclosureVersion: input.allowFreeAiAssistance ? 'v1.0' : null,
        allowCollectiveExternalAi: input.allowCollectiveExternalAi,
        collectiveAiNoticeVersion: input.allowCollectiveExternalAi ? 'v1.0' : null,
        teacherAttestsAuthorization: input.teacherAttestsAuthorization,
        initialActivity,
      });

      setCurrentSession(session, 'teacher');
      window.location.hash = `/session/${session.join_code}`;
    } catch (error) {
      console.error(error);
      alert(getOnlineSessionErrorMessage(error, 'crear la sesión'));
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Crear sesión sensemaking';
      }
    }
  });
}
