import { describe, expect, it } from 'vitest';
import { createSimulatedAnalysis, initDemo, renderDemo } from '../../src/views/demo.js';

describe('demo guiado de Build Week', () => {
  it('expone un análisis simulado que propone la intervención de tres columnas', () => {
    const analysis = createSimulatedAnalysis();

    expect(analysis.simulated).toBe(true);
    expect(analysis.intervention.type).toBe('three_column');
    expect(analysis.columns.map(([title]) => title)).toEqual([
      'Lo dicho',
      'Intención',
      'Efecto esperado',
    ]);
  });

  it('recorre sesión, respuesta, análisis e intervención en el navegador', () => {
    document.body.innerHTML = renderDemo();
    initDemo();

    document.getElementById('demo-teacher-form').dispatchEvent(new Event('submit'));
    document.getElementById('demo-student-form').dispatchEvent(new Event('submit'));
    expect(document.body.textContent).toContain('Análisis simulado');

    document.getElementById('activate-intervention').click();
    document.getElementById('demo-intervention-form').dispatchEvent(new Event('submit'));
    expect(document.body.textContent).toContain('Flujo completado');
  });
});
