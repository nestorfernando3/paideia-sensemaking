// ==========================================================================
// PAIDEIA — Header Component
// ==========================================================================

import { getCurrentSession, getCurrentRole, generateGreekCode } from '../utils/session.js';

import { backend } from '../utils/backend.js';

export function renderHeader() {
  const session = getCurrentSession();
  const role = getCurrentRole();
  const logoUrl = `${import.meta.env.BASE_URL}paideia-logo.png`;

  let sessionHtml = '';
  if (session) {
    const sessionCode = session.join_code || session.code;
    const greekCode = generateGreekCode(sessionCode);
    const roleLabel = role === 'teacher' ? 'Docente' : role === 'student' ? 'Estudiante' : 'Verificando acceso…';
    const roleBadgeClass = role === 'teacher' ? 'badge--gold' : role === 'student' ? 'badge--aegean' : 'badge--olive';
    const isActive = session.active ?? session.status !== 'ended';
    sessionHtml = `
      <div class="header__session">
        <span class="badge ${roleBadgeClass}" style="font-size: 0.6rem; padding: 2px 8px;">${roleLabel}</span>
        ${isActive ?
        '<span class="live-badge"><span class="live-badge__dot"></span> En sesión</span>' :
        '<span class="badge badge--olive" style="font-size: 0.6rem; padding: 2px 8px;">Finalizada</span>'}
        <span class="header__session-code" title="${greekCode}">${sessionCode}</span>
      </div>
    `;
  }

  // Local Mode Indicator
  let modeHtml = '';
  if (backend.mode === 'LOCAL') {
    modeHtml = `<span class="badge badge--olive" style="font-size: 0.6rem; padding: 2px 6px; margin-right: var(--space-sm);">📡 MODO LOCAL</span>`;
  }

  // Navigate to session if in one, otherwise home
  const homeHash = session ? `/session/${session.join_code || session.code}` : '/';

  return `
    <header class="header">
      <a class="header__brand" href="#${homeHash}">
        <span class="brand-mark header__logo" aria-hidden="true">
          <img src="${logoUrl}" alt="Logo de Paideia" decoding="async" />
        </span>
        <div style="display: flex; flex-direction: column; gap: 2px;">
          <div style="display: flex; align-items: center; gap: var(--space-sm); flex-wrap: wrap;">
            <span class="header__title">Paideia</span>
            ${modeHtml}
          </div>
          <span class="header__subtitle">Παιδεία · formación integral</span>
        </div>
      </a>
      ${sessionHtml}
    </header>
  `;
}
