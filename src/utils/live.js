import { getCurrentSession, isTeacher } from './session.js';
import { subscribeSession, subscribeToolEntries } from './storage.js';
import { subscribeToSession } from '../services/sessionService.js';

let routeCleanups = [];

export function clearRouteSubscriptions() {
    routeCleanups.forEach((cleanup) => {
        try {
            cleanup();
        } catch (error) {
            console.error('Error cleaning route subscription:', error);
        }
    });
    routeCleanups = [];
}

export function registerRouteSubscription(cleanup) {
    if (typeof cleanup === 'function') {
        routeCleanups.push(cleanup);
    }
}

export function initLiveSessionSync() {
    const session = getCurrentSession();
    if (!session) return;

    if (session.id && session.join_code) {
        registerRouteSubscription(
            subscribeToSession(session.id, refreshRoute)
        );
        return;
    }

    let isFirstPayload = true;
    registerRouteSubscription(
        subscribeSession(session.code, () => {
            if (isFirstPayload) {
                isFirstPayload = false;
                return;
            }

            refreshRoute();
        })
    );
}

export function initTeacherToolLiveSync(toolName) {
    if (!isTeacher()) return;

    const session = getCurrentSession();
    if (!session) return;

    let isFirstPayload = true;
    registerRouteSubscription(
        subscribeToolEntries(session.code, toolName, () => {
            if (isFirstPayload) {
                isFirstPayload = false;
                return;
            }

            refreshRoute();
        })
    );
}

function refreshRoute() {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}
