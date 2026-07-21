// ==========================================================================
// PAIDEIA Sensemaking — Student Join View
// El estudiante se une a una sesión mediante RPC o código local
// ==========================================================================

import { renderHeader } from '../components/header.js';
import { joinSensemakingSession } from '../services/sessionService.js';
import { joinSessionAsync, setCurrentSession, setStudentName, getStudentId } from '../utils/session.js';
import { getOnlineSessionErrorMessage } from '../utils/online-errors.js';

export function renderStudentJoin() {
  return `
    ${renderHeader()}
    <main class="page">
      <div class="tool-view">
        <div class="tool-view__header animate-fade-in">
          <div class="tool-view__greek-letter" style="font-size: var(--text-5xl);">Π</div>
          <h2 class="tool-view__name">Únete a una sesión</h2>
          <p class="tool-view__concept">Ingresa el código de 6 caracteres de tu clase</p>
        </div>

        <form id="join-form" class="animate-card-enter stagger-2">
          <div class="input-group">
            <label for="code">Código de sesión</label>
            <input
              type="text"
              id="code"
              class="input"
              placeholder="Ej: ABCDEF"
              maxlength="6"
              style="text-align: center; font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase;"
              required
              autocomplete="off"
              inputmode="text"
            />
          </div>

          <div id="join-error" class="join-error" style="display: none;">
            <span class="join-error__icon">⚠</span>
            <span id="join-error-text">Sesión no encontrada. Verifica el código e intenta de nuevo.</span>
          </div>

          <div id="join-loading" style="display: none; text-align: center; padding: var(--space-lg);">
            <div class="loading-dots" style="display: flex; justify-content: center; gap: 6px;">
              <span class="loading-dot" style="width:8px;height:8px;border-radius:50%;background:var(--gold);animation:bounceSoft 1s ease-in-out infinite;"></span>
              <span class="loading-dot" style="width:8px;height:8px;border-radius:50%;background:var(--gold);animation:bounceSoft 1s ease-in-out 0.15s infinite;"></span>
              <span class="loading-dot" style="width:8px;height:8px;border-radius:50%;background:var(--gold);animation:bounceSoft 1s ease-in-out 0.3s infinite;"></span>
            </div>
            <p style="font-size: var(--text-sm); color: var(--obsidian-soft); margin-top: var(--space-sm);">Uniéndote a la sesión...</p>
          </div>

          <div id="join-success" style="display: none; text-align: center; padding: var(--space-lg);">
            <div style="font-size: var(--text-3xl); color: var(--olive);">✓</div>
            <p style="font-size: var(--text-sm); color: var(--olive); margin-top: var(--space-xs); font-weight: 600;">¡Te has unido a la sesión!</p>
          </div>

          <div class="input-group">
            <label for="student-name">Tu nombre (para identificarte en el aula)</label>
            <input type="text" id="student-name" class="input" placeholder="Ej: Ana Lucía" required />
          </div>

          <button type="submit" class="btn btn--gold btn--lg btn--full" id="join-btn">
            Entrar a la sesión
          </button>

          <div style="text-align: center; margin-top: var(--space-lg);">
            <a href="#/" class="btn btn--ghost">
              Volver al inicio
            </a>
          </div>
        </form>
      </div>
    </main>
  `;
}

export function initStudentJoin() {
  const form = document.getElementById('join-form');
  if (!form) return;

  const codeInput = document.getElementById('code');
  if (codeInput) {
    codeInput.focus();
    codeInput.addEventListener('input', () => {
      codeInput.value = codeInput.value.toUpperCase();
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('code').value.trim().toUpperCase();
    const name = document.getElementById('student-name').value.trim() || 'Estudiante';

    const loadingEl = document.getElementById('join-loading');
    const errorEl = document.getElementById('join-error');
    const errorText = document.getElementById('join-error-text');
    const joinBtn = document.getElementById('join-btn');

    if (errorEl) errorEl.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'block';
    if (joinBtn) {
      joinBtn.disabled = true;
      joinBtn.textContent = 'Buscando...';
    }

    let session = null;

    try {
      if (code.length === 6) {
        session = await joinSensemakingSession(code, name);
      } else {
        session = await joinSessionAsync(code);
      }
    } catch (error) {
      console.error(error);
      if (loadingEl) loadingEl.style.display = 'none';
      if (joinBtn) {
        joinBtn.disabled = false;
        joinBtn.textContent = 'Entrar a la sesión';
      }
      if (errorText) {
        errorText.textContent = getOnlineSessionErrorMessage(error, 'unirte a la sesión');
      }
      if (errorEl) errorEl.style.display = 'flex';
      return;
    }

    if (loadingEl) loadingEl.style.display = 'none';
    if (joinBtn) {
      joinBtn.disabled = false;
      joinBtn.textContent = 'Entrar a la sesión';
    }

    if (!session) {
      if (errorEl) {
        errorEl.style.display = 'flex';
        errorEl.classList.remove('shake');
        void errorEl.offsetWidth;
        errorEl.classList.add('shake');
      }
      return;
    }

    if (errorEl) errorEl.style.display = 'none';

    const successEl = document.getElementById('join-success');
    if (successEl) {
      successEl.style.display = 'block';
      successEl.classList.add('animate-fade-in');
    }

    setCurrentSession(session, 'student');
    setStudentName(name);
    getStudentId();

    const joinCode = session.join_code || session.code || code;

    setTimeout(() => {
      window.location.hash = `/session/${joinCode}`;
    }, 500);
  });
}
