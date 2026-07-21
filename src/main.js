// ==========================================================================
// PAIDEIA Sensemaking — Main Application
// SPA Router + App Initialization
// ==========================================================================

import { renderHome, initHome } from './views/home.js';
import { renderNewSession, initNewSession } from './views/newSession.js';
import { renderStudentJoin, initStudentJoin } from './views/student.js';
import { renderSession, initSession } from './views/session.js';
import { renderStage, initStage } from './views/stage.js';
import { renderAnalysis, initAnalysis } from './views/analysis.js';
import { renderComparison, initComparison } from './views/comparison.js';
import { renderGnosis, initGnosis } from './views/gnosis.js';
import { renderEikasia, initEikasia } from './views/eikasia.js';
import { renderAporia, initAporia } from './views/aporia.js';
import { renderNoesis, initNoesis } from './views/noesis.js';
import { renderMethexis, initMethexis } from './views/methexis.js';
import { renderLogos, initLogos } from './views/logos.js';
import { renderAnamnesis, initAnamnesis } from './views/anamnesis.js';
import { renderGuiaDocente, initGuiaDocente } from './views/guia-docente.js';
import { renderGuiaEstudiante, initGuiaEstudiante } from './views/guia-estudiante.js';
import { renderTeacherJoin, initTeacherJoin } from './views/teacherJoin.js';
import { renderDemo, initDemo } from './views/demo.js';
import { clearRouteSubscriptions } from './utils/live.js';

const app = document.getElementById('app');

// ── Router ────────────────────────────────────────────────────────────────
const routes = {
    '/': { render: renderHome, init: initHome },
    '/new-session': { render: renderNewSession, init: initNewSession },
    '/join': { render: renderStudentJoin, init: initStudentJoin },
    '/teacher-join': { render: renderTeacherJoin, init: initTeacherJoin },
    '/demo': { render: renderDemo, init: initDemo },
    '/guia-docente': { render: renderGuiaDocente, init: initGuiaDocente },
    '/guia-estudiante': { render: renderGuiaEstudiante, init: initGuiaEstudiante },
};

const toolRoutes = {
    gnosis: { render: renderGnosis, init: initGnosis },
    eikasia: { render: renderEikasia, init: initEikasia },
    aporia: { render: renderAporia, init: initAporia },
    noesis: { render: renderNoesis, init: initNoesis },
    methexis: { render: renderMethexis, init: initMethexis },
    logos: { render: renderLogos, init: initLogos },
    anamnesis: { render: renderAnamnesis, init: initAnamnesis },
};

function getRoute() {
    const hash = window.location.hash.slice(1) || '/';
    return hash.split('?')[0]; // Remove query params
}

function navigate() {
    clearRouteSubscriptions();
    const path = getRoute();

    // Static routes
    if (routes[path]) {
        app.innerHTML = routes[path].render();
        if (routes[path].init) routes[path].init();
        window.scrollTo(0, 0);
        return;
    }

    // Comparison route: /session/:sessionId/comparison/:initialStageRunId/:transferStageRunId
    const comparisonMatch = path.match(/^\/session\/([0-9a-f-]+)\/comparison\/([0-9a-f-]+)\/([0-9a-f-]+)$/i);
    if (comparisonMatch) {
        const [, sessionId, initialStageRunId, transferStageRunId] = comparisonMatch;
        app.innerHTML = renderComparison(sessionId, initialStageRunId, transferStageRunId);
        initComparison(sessionId, initialStageRunId, transferStageRunId);
        window.scrollTo(0, 0);
        return;
    }

    // Analysis route: /session/:sessionId/analysis/:stageRunId
    const analysisMatch = path.match(/^\/session\/([0-9a-f-]+)\/analysis\/([0-9a-f-]+)$/i);
    if (analysisMatch) {
        const [, sessionId, stageRunId] = analysisMatch;
        app.innerHTML = renderAnalysis(sessionId, stageRunId);
        initAnalysis(sessionId, stageRunId);
        window.scrollTo(0, 0);
        return;
    }

    // Stage route: /session/:sessionId/stage/:stageRunId
    const stageMatch = path.match(/^\/session\/([0-9a-f-]+)\/stage\/([0-9a-f-]+)$/i);
    if (stageMatch) {
        const [, sessionId, stageRunId] = stageMatch;
        app.innerHTML = renderStage(sessionId, stageRunId);
        initStage(sessionId, stageRunId);
        window.scrollTo(0, 0);
        return;
    }

    // Session route: /session/:code
    const sessionMatch = path.match(/^\/session\/([a-z0-9-]+)$/i);
    if (sessionMatch) {
        app.innerHTML = renderSession(sessionMatch[1].toUpperCase());
        initSession();
        window.scrollTo(0, 0);
        return;
    }

    // Tool route: /tool/:toolId
    const toolMatch = path.match(/^\/tool\/(\w+)$/);
    if (toolMatch && toolRoutes[toolMatch[1]]) {
        const toolRoute = toolRoutes[toolMatch[1]];
        app.innerHTML = toolRoute.render();
        if (toolRoute.init) toolRoute.init();
        window.scrollTo(0, 0);
        return;
    }

    // 404
    app.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
      <div class="empty-state">
        <div class="empty-state__icon">Ω</div>
        <p class="empty-state__text">Página no encontrada</p>
        <a href="#/" class="btn btn--outline" style="margin-top: var(--space-lg);">
          Volver al inicio
        </a>
      </div>
    </div>
  `;
}

// ── Initialize ────────────────────────────────────────────────────────────
window.addEventListener('hashchange', navigate);
if (window.location.hash) {
    navigate();
} else {
    window.location.hash = '/';
}
