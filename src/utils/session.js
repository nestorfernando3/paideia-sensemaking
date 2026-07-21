// ==========================================================================
// PAIDEIA — Session Manager
// Gestión de sesiones de clase y membresías de Paideia Sensemaking
// ==========================================================================

import { createSession, getSession, updateSession, getSessionAsync } from './storage.js';
import { supabase } from './supabase.js';

// Generate a 4-letter Greek-themed code (classic fallback)
const GREEK_LETTERS = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
const LATIN_MAP = 'ABGDEZHTIKLMNXOPRSTYFCQW';

export function generateCode() {
    let code = '';
    for (let i = 0; i < 4; i++) {
        const idx = Math.floor(Math.random() * LATIN_MAP.length);
        code += LATIN_MAP[idx];
    }
    return code;
}

export function generateGreekCode(latinCode) {
    return latinCode.split('').map(char => {
        const idx = LATIN_MAP.indexOf(char);
        return idx >= 0 ? GREEK_LETTERS[idx] : char;
    }).join('');
}

export async function startSession(topic, activeTools) {
    const code = generateCode();
    const session = {
        code,
        topic,
        activeTools,
        createdAt: new Date().toISOString(),
        active: true,
        tools: {},
    };
    return createSession(session);
}

// Synchronous join (local only — for fallback)
export function joinSession(code) {
    const session = getSession(code.toUpperCase());
    if (!session) return null;
    return session;
}

// Async join — checks Supabase first, then local fallback
export async function joinSessionAsync(code) {
    const session = await getSessionAsync(code.toUpperCase());
    if (!session) return null;
    return session;
}

export async function endSession(code) {
    return updateSession(code, { active: false, endedAt: new Date().toISOString() });
}

// ── Persistent session state ──────────────────────────────────────────────
const SESSION_KEY = 'paideia_current_session';
const ROLE_KEY = 'paideia_current_role';
const STUDENT_NAME_KEY = 'paideia_student_name';
const STUDENT_ID_KEY = 'paideia_student_id';

export function setCurrentSession(session, role) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    if (role) {
        sessionStorage.setItem(ROLE_KEY, role);
    }
}

export function getCurrentSession() {
    try {
        const data = sessionStorage.getItem(SESSION_KEY);
        if (!data) return null;
        const session = JSON.parse(data);
        const fresh = getSession(session.code || session.join_code);
        if (fresh) {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
            return fresh;
        }
        return session;
    } catch {
        return null;
    }
}

export function getCurrentRole() {
    return sessionStorage.getItem(ROLE_KEY) || null;
}

/**
 * Derives user's actual role in a session directly from database ps_members table.
 * @param {string} sessionId
 * @returns {Promise<'teacher' | 'student' | null>}
 */
export async function deriveUserRole(sessionId) {
    if (!supabase || !sessionId) return getCurrentRole();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return getCurrentRole();

        const { data, error } = await supabase
            .from('ps_members')
            .select('role')
            .eq('session_id', sessionId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (error || !data) return getCurrentRole();
        sessionStorage.setItem(ROLE_KEY, data.role);
        return data.role;
    } catch {
        return getCurrentRole();
    }
}

export function isTeacher() {
    return getCurrentRole() === 'teacher';
}

export function clearCurrentSession() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    sessionStorage.removeItem(STUDENT_NAME_KEY);
    sessionStorage.removeItem(STUDENT_ID_KEY);
}

// ── Student identity ──────────────────────────────────────────────────────
export function setStudentName(name) {
    sessionStorage.setItem(STUDENT_NAME_KEY, name);
}

export function getStudentName() {
    return sessionStorage.getItem(STUDENT_NAME_KEY) || 'Anónimo';
}

export function getStudentId() {
    let id = sessionStorage.getItem(STUDENT_ID_KEY);
    if (!id) {
        id = 'stu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(STUDENT_ID_KEY, id);
    }
    return id;
}
