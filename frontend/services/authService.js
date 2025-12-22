const TOKEN_KEY = 'SF_API_TOKEN';
const USER_KEY = 'SF_USER_CTX';

const roleProfiles = {
    admin: { canCreate: true, canReferto: true, canAssignAll: true },
    operatore: { canCreate: true, canReferto: false, canAssignAll: true },
    dottore: { canCreate: false, canReferto: true, canAssignAll: false },
};

export function loadSession() {
    const token = localStorage.getItem(TOKEN_KEY);
    const userRaw = localStorage.getItem(USER_KEY);
    if (!token || !userRaw) return null;
    try {
        const user = JSON.parse(userRaw);
        return { token, user, permissions: computePermissions(user) };
    } catch (e) {
        return null;
    }
}

export function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.API_TOKEN = token;
    window.USER_CTX = user;
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    delete window.API_TOKEN;
    delete window.USER_CTX;
}

export function computePermissions(user) {
    const defaults = roleProfiles[user?.role] || roleProfiles.operatore;
    return { ...defaults, department: user?.department || null, role: user?.role || 'operatore', name: user?.name || '' };
}

export function getCurrentUser() {
    const session = loadSession();
    return session ? { ...session.user, permissions: session.permissions } : null;
}
