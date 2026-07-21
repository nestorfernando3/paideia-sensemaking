import { renderHeader } from '../components/header.js';
import { escapeHtml } from '../utils/escapeHtml.js';

const DEMO_CODE = 'PAI421';

const initialState = () => ({
  step: 'teacher',
  session: null,
  initialResponse: '',
  analysis: null,
  interventionResponse: null,
});

let state = initialState();

export function createSimulatedAnalysis() {
  return {
    simulated: true,
    summary: 'La respuesta distingue el enunciado literal de la petición, pero todavía necesita hacer explícito el efecto esperado en quien escucha.',
    columns: [
      ['Lo dicho', '¿Pueden cerrar la puerta?'],
      ['Intención', 'Pedir que alguien cierre la puerta.'],
      ['Efecto esperado', 'Que una persona se levante y la cierre.'],
    ],
    intervention: {
      type: 'three_column',
      title: 'Separar lo dicho, la intención y el efecto',
      prompt: 'Analiza: “Está muy oscuro aquí”.',
    },
  };
}

export function renderDemo() {
  return `
    ${renderHeader()}
    <main class="page">
      <a class="back-nav" href="#/">← Volver al inicio</a>
      <div id="demo-content" class="tool-view animate-fade-in"></div>
    </main>
  `;
}

function progress() {
  const steps = ['Sesión docente', 'Respuesta', 'Análisis simulado', 'Tres columnas', 'Cierre'];
  const current = ['teacher', 'student', 'analysis', 'intervention', 'complete'].indexOf(state.step);
  return `
    <div aria-label="Progreso del demo" style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:var(--space-xl);">
      ${steps.map((label, index) => `<span class="badge ${index <= current ? 'badge--gold' : 'badge--olive'}">${index + 1}. ${label}</span>`).join('')}
    </div>
  `;
}

function teacherStep() {
  return `
    ${progress()}
    <div class="tool-view__header">
      <span class="badge badge--aegean">Demo local · sin integraciones externas</span>
      <h1 class="tool-view__name">Crea la sesión docente</h1>
      <p class="tool-view__concept">Los campos vienen listos para presentar: basta con continuar.</p>
    </div>
    <form id="demo-teacher-form">
      <div class="input-group"><label for="demo-teacher">Docente</label><input class="input" id="demo-teacher" value="Profa. Marta" required /></div>
      <div class="input-group"><label for="demo-topic">Tema</label><input class="input" id="demo-topic" value="Actos de habla" required /></div>
      <div class="input-group"><label for="demo-question">Situación inicial</label><textarea class="input" id="demo-question" rows="3" required>En clase, la docente dice: “¿Pueden cerrar la puerta?”. ¿Qué está haciendo con sus palabras?</textarea></div>
      <button class="btn btn--gold btn--lg btn--full" type="submit">Crear sesión demo</button>
    </form>
  `;
}

function studentStep() {
  return `
    ${progress()}
    <div class="tool-view__header">
      <span class="badge badge--gold">Sesión activa · ${DEMO_CODE}</span>
      <h1 class="tool-view__name">Respuesta estudiantil</h1>
      <p class="tool-view__concept">${escapeHtml(state.session.topic)} · docente: ${escapeHtml(state.session.teacher)}</p>
    </div>
    <div style="padding:var(--space-md); border-left:4px solid var(--color-gold); margin-bottom:var(--space-lg);">
      <strong>Situación</strong><p>${escapeHtml(state.session.question)}</p>
    </div>
    <form id="demo-student-form">
      <div class="input-group"><label for="demo-response">Respuesta de Laura</label><textarea class="input" id="demo-response" rows="5" required>Aunque parece una pregunta, la docente está pidiendo que alguien cierre la puerta.</textarea></div>
      <button class="btn btn--gold btn--lg btn--full" type="submit">Enviar respuesta</button>
    </form>
  `;
}

function analysisStep() {
  return `
    ${progress()}
    <div class="tool-view__header">
      <span class="badge badge--terracotta">Análisis simulado</span>
      <h1 class="tool-view__name">Lectura pedagógica para la docente</h1>
      <p class="tool-view__concept">Resultado fijo de demostración; no usa IA ni envía datos fuera del navegador.</p>
    </div>
    <div style="padding:var(--space-lg); border:1px solid var(--color-border); border-radius:var(--radius-md); margin-bottom:var(--space-lg);">
      <p><strong>Respuesta observada:</strong> “${escapeHtml(state.initialResponse)}”</p>
      <p style="margin-top:var(--space-md);"><strong>Interpretación:</strong> ${state.analysis.summary}</p>
    </div>
    <div class="three-column-grid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:var(--space-md); margin-bottom:var(--space-xl);">
      ${state.analysis.columns.map(([title, value]) => `<article style="padding:var(--space-md); border:1px solid var(--color-border); border-radius:var(--radius-md);"><strong>${title}</strong><p>${value}</p></article>`).join('')}
    </div>
    <button id="activate-intervention" class="btn btn--gold btn--lg btn--full">Activar intervención de tres columnas</button>
  `;
}

function interventionStep() {
  return `
    ${progress()}
    <div class="tool-view__header">
      <span class="badge badge--gold">Intervención activa</span>
      <h1 class="tool-view__name">${state.analysis.intervention.title}</h1>
      <p class="tool-view__concept">${state.analysis.intervention.prompt}</p>
    </div>
    <form id="demo-intervention-form">
      <div class="three-column-grid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:var(--space-md);">
        <div class="input-group"><label for="demo-said">Qué se dijo</label><textarea class="input" id="demo-said" rows="4" required>Está muy oscuro aquí.</textarea></div>
        <div class="input-group"><label for="demo-intended">Qué se intentó hacer</label><textarea class="input" id="demo-intended" rows="4" required>Pedir indirectamente que enciendan la luz.</textarea></div>
        <div class="input-group"><label for="demo-effect">Qué efecto produjo</label><textarea class="input" id="demo-effect" rows="4" required>Una estudiante encendió la luz.</textarea></div>
      </div>
      <button class="btn btn--gold btn--lg btn--full" type="submit">Entregar intervención</button>
    </form>
  `;
}

function completeStep() {
  return `
    ${progress()}
    <div class="tool-view__header">
      <span class="badge badge--olive">Flujo completado</span>
      <h1 class="tool-view__name">La evidencia quedó lista para conversar</h1>
      <p class="tool-view__concept">Paideia organiza la respuesta; la docente conserva la decisión pedagógica.</p>
    </div>
    <div class="three-column-grid" style="display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:var(--space-md); margin-bottom:var(--space-xl);">
      ${Object.entries(state.interventionResponse).map(([label, value]) => `<article style="padding:var(--space-md); border:1px solid var(--color-border); border-radius:var(--radius-md);"><strong>${label}</strong><p>${escapeHtml(value)}</p></article>`).join('')}
    </div>
    <button id="restart-demo" class="btn btn--outline btn--lg btn--full">Reiniciar demo</button>
  `;
}

function renderCurrentStep() {
  const content = document.getElementById('demo-content');
  if (!content) return;

  const views = {
    teacher: teacherStep,
    student: studentStep,
    analysis: analysisStep,
    intervention: interventionStep,
    complete: completeStep,
  };
  content.innerHTML = views[state.step]();

  document.getElementById('demo-teacher-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.session = {
      teacher: document.getElementById('demo-teacher').value.trim(),
      topic: document.getElementById('demo-topic').value.trim(),
      question: document.getElementById('demo-question').value.trim(),
    };
    state.step = 'student';
    renderCurrentStep();
  });

  document.getElementById('demo-student-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.initialResponse = document.getElementById('demo-response').value.trim();
    state.analysis = createSimulatedAnalysis();
    state.step = 'analysis';
    renderCurrentStep();
  });

  document.getElementById('activate-intervention')?.addEventListener('click', () => {
    state.step = 'intervention';
    renderCurrentStep();
  });

  document.getElementById('demo-intervention-form')?.addEventListener('submit', (event) => {
    event.preventDefault();
    state.interventionResponse = {
      'Qué se dijo': document.getElementById('demo-said').value.trim(),
      'Qué se intentó hacer': document.getElementById('demo-intended').value.trim(),
      'Qué efecto produjo': document.getElementById('demo-effect').value.trim(),
    };
    state.step = 'complete';
    renderCurrentStep();
  });

  document.getElementById('restart-demo')?.addEventListener('click', () => {
    state = initialState();
    renderCurrentStep();
  });
}

export function initDemo() {
  state = initialState();
  renderCurrentStep();
}
