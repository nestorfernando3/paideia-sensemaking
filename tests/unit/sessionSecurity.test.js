import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { supabase } from '../../src/utils/supabase.js';
import { deriveUserRole, getCurrentRole, setCurrentSession } from '../../src/utils/session.js';

vi.mock('../../src/utils/supabase.js', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

describe('seguridad del acceso docente', () => {
  beforeEach(() => vi.clearAllMocks());

  it('no confía en un rol de sessionStorage para sesiones sensemaking', async () => {
    setCurrentSession({ id: 'session-1', join_code: 'ABC123' }, 'student');
    sessionStorage.setItem('paideia_current_role', 'teacher');
    expect(getCurrentRole()).toBeNull();

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'denied' } }),
    });

    expect(await deriveUserRole('session-1')).toBeNull();
    expect(getCurrentRole()).toBeNull();

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { role: 'teacher' }, error: null }),
    });
    expect(await deriveUserRole('session-1')).toBe('teacher');
    expect(getCurrentRole()).toBe('teacher');
  });

  it('la ruta docente heredada no contiene formulario de contraseña', () => {
    const source = readFileSync(`${process.cwd()}/src/views/teacherJoin.js`, 'utf8');
    expect(source).not.toMatch(/type=["']password["']/i);
    expect(source).not.toMatch(/teacher-password/i);
    expect(source).not.toMatch(/password\s*!==/i);
  });
});
