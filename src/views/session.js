// ==========================================================================
// PAIDEIA Sensemaking — Active Session View
// Vista de sesión activa (docente y estudiante)
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { getToolById } from '../components/toolCard.js';
import { getCurrentSession, getCurrentRole, isTeacher, setCurrentSession, generateGreekCode, clearCurrentSession, endSession, getStudentName, deriveUserRole } from '../utils/session.js';
import { getSession, getAllToolEntriesAsync } from '../utils/storage.js';
import { getSensemakingSession } from '../services/sessionService.js';
import { staggerChildren } from '../utils/animations.js';
import { backend } from '../utils/backend.js';
import { getOnlineSessionErrorMessage } from '../utils/online-errors.js';
import { initLiveSessionSync } from '../utils/live.js';

export function renderSession(code) {
  let session = getCurrentSession();
  const joinCode = session?.join_code || session?.code;

  if (!session || joinCode !== code) {
    session = getSession(code);
    if (session) {
      const existingRole = getCurrentRole();
      setCurrentSession(session, existingRole || 'student');
    }
  }

  if (!session) {
    return `
      ${renderHeader()}
      <main class="page">
        <div class="empty-state" style="min-height: 60vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
          <div class="empty-state__icon">Ω</div>
          <p class="empty-state__text">Sesión no encontrada</p>
          <p style="color: var(--obsidian-soft); margin-top: var(--space-sm); font-size: var(--text-sm);">
            El código <strong>${code}</strong> no corresponde a ninguna sesión activa.
          </p>
          <a href="#/" class="btn btn--outline" style="margin-top: var(--space-lg);">
            Volver al inicio
          </a>
        </div>
      </main>
    `;
  }

  const sessionCode = session.join_code || session.code || code;
  const greekCode = generateGreekCode(sessionCode.slice(0, 4));
  const activeTools = (session.activeTools || ['sensemaking']).map(id => getToolById(id)).filter(Boolean);
  const role = getCurrentRole();
  const studentName = role === 'student' ? getStudentName() : null;
  const featuredTool = activeTools.find(tool => tool.id === 'gnosis') || activeTools[0] || null;
  const dashboardTools = featuredTool
    ? [featuredTool, ...activeTools.filter(tool => tool.id !== featuredTool.id)]
    : activeTools;
  const toolCards = dashboardTools.map((tool, index) => renderSessionModuleCard(tool, {
    featured: index === 0,
    dark: tool.id === 'logos',
    order: index + 1,
  })).join('');

  return `
    ${renderHeader()}
    <main class="page">
      <div class="session-dashboard animate-fade-in">
        <header class="session-dashboard__hero">
          <div class="session-dashboard__top">
            <div class="session-dashboard__eyebrow">
              <span class="badge ${session.status === 'ended' || session.active === false ? 'badge--olive' : 'badge--gold'}">
                ${session.status === 'ended' || session.active === false ? '<span>⏹</span> Sesión finalizada' : '<span class="live-badge__dot"></span> Sesión activa'}
              </span>
              ${role === 'teacher' ? `<span class="badge badge--aegean">Docente</span>` : `<span class="badge badge--aegean">Estudiante</span>`}
            </div>

            <div class="session-code-display session-code-display--panel">
              <span class="session-code-display__label">Código de acceso</span>
              <span class="session-code-display__code">${sessionCode}</span>
              <span class="session-code-display__greek">${greekCode}</span>
            </div>
          </div>

          <div class="session-dashboard__content">
            <h1 class="session-dashboard__title">${session.topic || 'Sesión activa'}</h1>
            ${session.grade_level ? `<p style="font-size: var(--text-sm); color: var(--color-gold); margin-top: 4px;">Grado: ${session.grade_level}</p>` : ''}
            ${role === 'student' && studentName ? `
              <p class="session-dashboard__subtitle">👋 Hola, <strong>${studentName}</strong>. Avanza por la actividad cuando el docente active cada etapa.</p>
            ` : `
              <p class="session-dashboard__subtitle">Comparte este código con tus estudiantes para que entren al flujo pedagógico.</p>
            `}
          </div>

          <div class="session-dashboard__actions">
            ${role === 'teacher' ? `
              <button class="btn btn--ghost btn--sm" id="share-session-btn">
                Compartir enlace
              </button>
              <button class="btn btn--ghost btn--sm" id="show-qr-btn">
                Mostrar QR
              </button>
            ` : ''}
          </div>

          ${role === 'teacher' ? `
            <div id="qr-container" class="session-dashboard__qr" style="${backend.mode === 'LOCAL' ? 'display: block' : 'display: none'};">
              <canvas id="qr-canvas"></canvas>
              <p class="session-hero__micro">Los estudiantes escanean este código para unirse</p>
            </div>
          ` : ''}
        </header>

        <section class="session-dashboard__modules">
          <div class="session-dashboard__label">
            <span>✦</span>
            <span>Módulos activos</span>
          </div>
          <div class="session-dashboard__grid" id="session-tools">
            ${toolCards}
          </div>
        </section>

        <section class="session-dashboard__waiting">
          <div class="session-dashboard__waiting-copy">
            <p class="session-dashboard__waiting-title">Esperando respuestas de los estudiantes...</p>
            <p class="session-dashboard__waiting-subtitle">${role === 'teacher' ? 'Observa la participación y activa las etapas del proceso.' : 'Espera a que el docente habilite el siguiente momento.'}</p>
          </div>
        </section>

        <div class="session-actions">
          ${role === 'teacher' && session.status !== 'ended' ? `
            <button class="btn btn--ghost" id="end-session-btn" style="color: var(--terracotta);">
              ⏹ Finalizar sesión
            </button>
          ` : ''}
          <a href="#/" class="btn btn--ghost" id="leave-session-btn">
            ← Salir de la sesión
          </a>
        </div>
      </div>
    </main>
  `;
}

function renderSessionModuleCard(tool, { featured = false, dark = false, order = 1 } = {}) {
  const classes = [
    'session-module-card',
    featured ? 'session-module-card--featured' : '',
    dark ? 'session-module-card--dark' : '',
  ].filter(Boolean).join(' ');

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][Math.max(0, order - 1)] || `${order}`;

  return `
    <a class="${classes}" href="#/tool/${tool.id}" aria-label="${tool.name} · ${tool.greek}">
      <span class="session-module-card__watermark" aria-hidden="true">${tool.letter}</span>
      <div class="session-module-card__meta">
        <span class="session-module-card__kicker">Módulo ${roman}</span>
        <h3 class="session-module-card__title">${tool.name}</h3>
        <span class="session-module-card__subtitle">${tool.greek}</span>
      </div>
      <p class="session-module-card__description">${tool.description}</p>
      <span class="session-module-card__cta">${tool.verb} →</span>
    </a>
  `;
}

export async function initSession() {
  initLiveSessionSync();
  staggerChildren('#session-tools .session-module-card', 80);

  const session = getCurrentSession();
  if (session && session.id) {
    await deriveUserRole(session.id);
  }

  const endBtn = document.getElementById('end-session-btn');
  if (endBtn) {
    endBtn.addEventListener('click', async () => {
      const s = getCurrentSession();
      if (!s) return;
      if (confirm('¿Estás seguro de que deseas finalizar la sesión?')) {
        try {
          await endSession(s.join_code || s.code);
          clearCurrentSession();
          window.location.hash = '/';
        } catch (error) {
          console.error(error);
          alert(getOnlineSessionErrorMessage(error, 'finalizar la sesión'));
        }
      }
    });
  }

  const leaveBtn = document.getElementById('leave-session-btn');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearCurrentSession();
      window.location.hash = '/';
    });
  }

  const shareBtn = document.getElementById('share-session-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const s = getCurrentSession();
      if (!s) return;
      const code = s.join_code || s.code;

      const baseUrl = backend.networkUrl || window.location.origin;
      const url = `${baseUrl}${window.location.pathname}#/join`;
      const text = `Únete a mi clase de Paideia con el código: ${code}\n${url}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: 'Paideia — Únete a la sesión', text });
        } catch { /* user cancelled */ }
      } else {
        await navigator.clipboard.writeText(text);
        shareBtn.textContent = '✓ Copiado';
        setTimeout(() => { shareBtn.textContent = 'Compartir enlace'; }, 2000);
      }
    });
  }
}
