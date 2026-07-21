// ==========================================================================
// PAIDEIA — Home View
// Dashboard principal + acceso a guías + historial
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { renderToolCard, getToolsByPhase } from '../components/toolCard.js';
import { staggerChildren } from '../utils/animations.js';
import { getSessions } from '../utils/storage.js';

function getRecentSessions() {
  try {
    const sessions = getSessions();
    if (!sessions) return [];
    return Object.values(sessions)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5);
  } catch { return []; }
}

export function renderHome() {
  const phases = [
    { key: 'before', label: 'Antes de la clase', icon: '⏮' },
    { key: 'during', label: 'Durante la clase', icon: '⏯' },
    { key: 'after', label: 'Después de la clase', icon: '⏭' },
  ];

  const homeNav = `
    <nav class="home-nav" aria-label="Navegación principal">
      <a href="#/" class="home-nav__link home-nav__link--active">Inicio</a>
      <a href="#/guia-estudiante" class="home-nav__link">Guía del Estudiante</a>
      <a href="#/guia-docente" class="home-nav__link">Guía del Docente</a>
      <a href="mailto:nestor.del@pca.edu.co?subject=Paideia%20-%20Contacto" class="home-nav__link">Contacto</a>
    </nav>
  `;

  let toolGridHtml = '';
  phases.forEach(phase => {
    const tools = getToolsByPhase(phase.key);
    toolGridHtml += `
      <div class="tool-grid--label">
        <span>${phase.icon} ${phase.label}</span>
      </div>
      ${tools.map(t => renderToolCard(t)).join('')}
    `;
  });

  // Recent sessions
  const recentSessions = getRecentSessions();
  let historyHtml = '';
  if (recentSessions.length > 0) {
    const items = recentSessions.map(s => {
      const date = s.createdAt ? new Date(s.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '';
      const statusBadge = s.active
        ? '<span class="badge badge--olive" style="font-size: 0.6rem;">● Activa</span>'
        : '<span class="badge badge--gold" style="font-size: 0.6rem;">Finalizada</span>';
      return `
        <a href="#/session/${s.code}" class="history-item">
          <div class="history-item__code">${s.code}</div>
          <div class="history-item__info">
            <span class="history-item__topic">${s.topic || 'Sin tema'}</span>
            <span class="history-item__date">${date} ${statusBadge}</span>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="history-item__arrow"><path d="M9 18l6-6-6-6"/></svg>
        </a>
      `;
    }).join('');

    historyHtml = `
      <section class="section" style="margin-top: var(--space-2xl);">
        <h3 class="section-title">
          <span>🕓</span> Sesiones recientes
        </h3>
        <div class="history-list">
          ${items}
        </div>
      </section>
    `;
  }

  return `
    ${renderHeader()}
    <main class="page">
      ${homeNav}
      <div class="home-hero animate-fade-in">
        <div class="home-hero__eyebrow">
          <span class="badge badge--gold">Paideia</span>
          <span class="home-hero__meta">Παιδεία · el camino hacia la formación integral</span>
        </div>
        <h1>El cultivo de la excelencia académica.</h1>
        <p class="home-hero__lede">
          Bienvenido al Liceo Digital de Paideia. Un espacio diseñado para la reflexión,
          la enseñanza magistral y el aprendizaje riguroso.
        </p>
      </div>

      <div class="content-container content-container--home" style="margin-bottom: var(--space-2xl);">
        <div class="actions-grid">
          <a class="action-card animate-card-enter stagger-1" href="#/join">
            <div class="action-card__icon">🎓</div>
            <h3>Soy estudiante</h3>
            <p>Unirse a una clase con código</p>
            <span class="action-card__cta action-card__cta--outline">Unirse</span>
          </a>

          <a class="action-card animate-card-enter stagger-2" href="#/new-session">
            <div class="action-card__icon">🍎</div>
            <h3>Soy docente</h3>
            <p>Crear nueva sesión</p>
            <span class="action-card__cta action-card__cta--gold">Crear sesión</span>
          </a>
        </div>

        <div class="home-secondary-actions">
          <a href="#/new-session" class="link-subtle">
            Crear otra sesión docente
          </a>
          <a href="#/guia-docente" class="btn btn--ghost btn--sm">
            📖 Guía del Docente
          </a>
          <a href="#/guia-estudiante" class="btn btn--ghost btn--sm">
            🎓 Guía del Estudiante
          </a>
        </div>

        <div class="home-contact">
          <span class="home-contact__label">Contacto directo</span>
          <div class="home-contact__links">
            <a
              class="home-contact__link"
              href="mailto:nestor.del@pca.edu.co?subject=Paideia%20-%20Contacto"
            >
              nestor.del@pca.edu.co
            </a>
            <a
              class="home-contact__link"
              href="https://wa.me/573128752012"
              target="_blank"
              rel="noreferrer noopener"
            >
              WhatsApp: +57 312 875 2012
            </a>
          </div>
        </div>
      </div>

      <div class="divider--short divider"></div>

      <section class="section">
        <div class="tool-grid" id="tool-grid">
          ${toolGridHtml}
        </div>
      </section>

      ${historyHtml}

      <div class="meander meander--subtle"></div>

      <footer class="footer">
        Eudaimonia · εὐδαιμονία · el florecimiento del ser a través del conocimiento
      </footer>
    </main>
  `;
}

export function initHome() {
  setTimeout(() => staggerChildren('#tool-grid .tool-card', 60), 100);
}
