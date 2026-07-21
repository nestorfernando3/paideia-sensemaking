import { beforeEach, describe, expect, it } from 'vitest';
import { renderHeader } from '../../src/components/header.js';
import { clearCurrentSession, setCurrentSession } from '../../src/utils/session.js';

describe('header de sesión', () => {
  beforeEach(clearCurrentSession);

  it('renderiza una sesión sensemaking activa mientras verifica el rol', () => {
    setCurrentSession({ id: 'session-1', join_code: 'ABC123', status: 'active' });

    const html = renderHeader();

    expect(html).toContain('href="#/session/ABC123"');
    expect(html).toContain('title="ΑΒΧ123">ABC123</span>');
    expect(html).toContain('Verificando acceso…');
    expect(html).toContain('En sesión');
    expect(html).not.toContain('Estudiante');
  });
});
