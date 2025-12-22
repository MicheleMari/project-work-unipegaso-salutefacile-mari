import { appMarkup } from './components/appMarkup.js';
import { initApp, registerGlobalHandlers } from './app/handlers.js';
import { renderLoginPage, bindLoginHandlers } from './auth/loginPage.js';
import { loadSession } from './services/authService.js';

const appRoot = document.getElementById('app');

function boot() {
    if (!appRoot) return;
    const session = loadSession();
    if (!session) {
        renderLoginPage(appRoot);
        bindLoginHandlers(appRoot, () => window.location.reload());
        return;
    }

    window.API_TOKEN = session.token;
    window.USER_CTX = session.user;
    document.body.className = 'bg-slate-50 text-slate-800 antialiased selection:bg-medical-100 selection:text-medical-900';
    appRoot.innerHTML = appMarkup;
    registerGlobalHandlers();
    void initApp();
}

boot();
