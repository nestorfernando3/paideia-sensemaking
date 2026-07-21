import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: null,
  subscribeSession: vi.fn(),
  subscribeToSession: vi.fn(),
}));

vi.mock('../../src/utils/session.js', () => ({
  getCurrentSession: () => mocks.session,
  isTeacher: () => false,
}));
vi.mock('../../src/utils/storage.js', () => ({
  subscribeSession: mocks.subscribeSession,
  subscribeToolEntries: vi.fn(),
}));
vi.mock('../../src/services/sessionService.js', () => ({
  subscribeToSession: mocks.subscribeToSession,
}));

import { clearRouteSubscriptions, initLiveSessionSync } from '../../src/utils/live.js';

describe('sincronización realtime de sesión', () => {
  beforeEach(() => {
    clearRouteSubscriptions();
    vi.clearAllMocks();
    mocks.subscribeSession.mockReturnValue(vi.fn());
    mocks.subscribeToSession.mockReturnValue(vi.fn());
  });

  it('usa ps_sessions para una sesión sensemaking', () => {
    mocks.session = { id: 'session-1', join_code: 'ABC123' };
    initLiveSessionSync();
    expect(mocks.subscribeToSession).toHaveBeenCalledWith('session-1', expect.any(Function));
    expect(mocks.subscribeSession).not.toHaveBeenCalled();
  });

  it('conserva el fallback clásico para sesiones legacy', () => {
    mocks.session = { code: 'ABCD' };
    initLiveSessionSync();
    expect(mocks.subscribeSession).toHaveBeenCalledWith('ABCD', expect.any(Function));
    expect(mocks.subscribeToSession).not.toHaveBeenCalled();
  });
});
