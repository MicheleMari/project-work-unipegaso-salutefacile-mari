import oidcConfig from '../config/oidcConfig.js';

const TOKEN_KEY = 'SF_OIDC_TOKEN';
const STATE_KEY = 'SF_OIDC_STATE';
const VERIFIER_KEY = 'SF_OIDC_VERIFIER';

function base64UrlEncode(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(hash);
}

function createCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
}

function storeToken(token) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}

function loadToken() {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

function isTokenValid(token) {
    if (!token || !token.access_token || !token.expires_at) return false;
    const now = Math.floor(Date.now() / 1000);
    return now < token.expires_at - 60; // 1 minuto di margine
}

function clearAuthState() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(VERIFIER_KEY);
}

async function exchangeCode(code, verifier) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: oidcConfig.clientId,
        redirect_uri: oidcConfig.redirectUri,
        code_verifier: verifier,
    });
    if (oidcConfig.audience) body.append('audience', oidcConfig.audience);
    const res = await fetch(oidcConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) {
        throw new Error(`Token exchange failed: ${res.status}`);
    }
    const json = await res.json();
    const expiresAt = Math.floor(Date.now() / 1000) + (json.expires_in || 3600);
    return { ...json, expires_at: expiresAt };
}

async function refreshToken(refreshToken) {
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: oidcConfig.clientId,
    });
    if (oidcConfig.audience) body.append('audience', oidcConfig.audience);
    const res = await fetch(oidcConfig.tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    });
    if (!res.ok) return null;
    const json = await res.json();
    const expiresAt = Math.floor(Date.now() / 1000) + (json.expires_in || 3600);
    return { ...json, expires_at: expiresAt };
}

export async function ensureAuthenticated() {
    // 1) Verifica se esiste un token valido
    let token = loadToken();
    if (isTokenValid(token)) {
        return token;
    }

    // 2) Gestisce il callback di redirect
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem(STATE_KEY);
    if (code && state && storedState && state === storedState) {
        const verifier = localStorage.getItem(VERIFIER_KEY);
        clearAuthState();
        token = await exchangeCode(code, verifier);
        storeToken(token);
        // Pulisce l'URL
        window.history.replaceState({}, document.title, window.location.pathname);
        return token;
    }

    // 3) Prova il refresh
    if (token && token.refresh_token) {
        const refreshed = await refreshToken(token.refresh_token);
        if (refreshed) {
            storeToken(refreshed);
            return refreshed;
        }
    }

    // 4) Esegue il redirect al login (PKCE)
    const verifier = createCodeVerifier();
    const challenge = await sha256(verifier);
    const newState = base64UrlEncode(crypto.getRandomValues(new Uint8Array(16)));
    localStorage.setItem(VERIFIER_KEY, verifier);
    localStorage.setItem(STATE_KEY, newState);

    const authParams = new URLSearchParams({
        response_type: 'code',
        client_id: oidcConfig.clientId,
        redirect_uri: oidcConfig.redirectUri,
        scope: oidcConfig.scopes,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: newState,
    });
    if (oidcConfig.audience) authParams.append('audience', oidcConfig.audience);

    const authUrl = `${oidcConfig.authorizationEndpoint}?${authParams.toString()}`;
    window.location.assign(authUrl);
    return null;
}

export function getAccessToken() {
    const token = loadToken();
    if (!token || !token.access_token) {
        throw new Error('Token mancante');
    }
    return token.access_token;
}
