// ==========================================================================
// PAIDEIA — Legacy Teacher Join View
// El acceso docente se verifica por membresía en Supabase, nunca por clave local.
// ==========================================================================

import { renderHeader } from '../components/header.js';
export function renderTeacherJoin() {
    return `
    ${renderHeader()}
    <main class="page">
      <a class="back-nav" href="#/">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Volver
      </a>

      <div class="tool-view">
        <div class="tool-view__header animate-fade-in">
          <div class="tool-view__greek-letter">Ω</div>
          <h2 class="tool-view__name">Acceso docente seguro</h2>
          <p class="tool-view__concept">El rol docente se valida con tu sesión y membresía en línea</p>
        </div>

        <div class="animate-slide-up" style="text-align: center;">
          <p>Continúa por el flujo Sensemaking. La base de datos habilitará los controles docentes únicamente si eres miembro docente de la sesión.</p>
          <a href="#/new-session" class="btn btn--gold btn--lg btn--full" style="margin-top: var(--space-lg);">
            Ir a sesiones Sensemaking
          </a>
        </div>
      </div>
    </main>
  `;
}

export function initTeacherJoin() {
    // La ruta se conserva para enlaces antiguos; no autentica ni asigna roles.
}
