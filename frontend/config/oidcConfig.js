const defaultConfig = {
    issuer: 'http://127.0.0.1:8080',
    authorizationEndpoint: 'http://127.0.0.1:8080/authorize',
    tokenEndpoint: 'http://127.0.0.1:8080/oauth/token',
    clientId: 'salutefacile-spa',
    redirectUri: window.location.origin,
    scopes: 'openid profile email offline_access',
    audience: 'salutefacile-api',
};

// Sovrascrivibile tramite window.OIDC_CONFIG se definito prima di questo script
const cfg = { ...defaultConfig, ...(window.OIDC_CONFIG || {}) };

export default cfg;
