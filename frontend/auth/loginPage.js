import { saveSession } from '../services/authService.js';

const devProfiles = [
    { label: 'Admin', token: 'dev-admin-token', user: { role: 'admin', name: 'Dev Admin', department: 'Direzione', id: 1 } },
    { label: 'Operatore PS', token: 'dev-operatore-token', user: { role: 'operatore', name: 'Dev Operatore', department: 'PS', id: 2 } },
    { label: 'Dottore (Ginecologia)', token: 'dev-dottore-token', user: { role: 'dottore', name: 'Dr. Rossi', department: 'Ginecologia', id: 3 } },
];

export function renderLoginPage(root) {
    const cards = devProfiles.map((p) => `
        <button data-token="${p.token}" class="login-card group bg-white/60 hover:bg-white border border-slate-200 hover:border-medical-300 shadow-sm hover:shadow-md rounded-2xl p-4 flex items-center justify-between transition-all w-full text-left">
            <div>
                <p class="text-xs uppercase text-slate-400 font-semibold">Accesso rapido</p>
                <h3 class="text-lg font-bold text-slate-900">${p.label}</h3>
                <p class="text-sm text-slate-500">${p.user.department}</p>
            </div>
            <div class="h-10 w-10 rounded-full bg-medical-50 text-medical-700 border border-medical-100 flex items-center justify-center font-bold group-hover:bg-medical-600 group-hover:border-medical-700 transition-colors">
                ${p.label.substring(0, 2).toUpperCase()}
            </div>
        </button>
    `).join('');

    root.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center px-4">
        <div class="max-w-xl w-full">
            <div class="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                <div class="p-8 space-y-6">
                    <div class="space-y-2 text-center">
                        <p class="text-xs uppercase tracking-widest text-medical-600 font-semibold">Accesso Operatori</p>
                        <img src="frontend/media/icons/mainLogo.png" alt="SaluteFacile" class="h-16 w-auto mx-auto object-contain" />
                        <p class="text-sm text-slate-500">Seleziona un profilo di test oppure incolla un token OIDC/Static.</p>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-slate-700">Token Bearer</label>
                        <div class="flex gap-2">
                            <input id="manual-token" type="text" placeholder="Incolla token..." class="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500" />
                            <button id="manual-login" class="px-4 py-3 rounded-xl bg-medical-600 text-white font-semibold hover:bg-medical-700 transition [background:linear-gradient(90deg,#0ea5e9,#0284c7)]">Accedi</button>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <p class="text-xs uppercase text-slate-400 font-semibold">Oppure scegli un profilo rapido</p>
                        <div class="grid gap-3">
                            ${cards}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function bindLoginHandlers(root, onLogin) {
    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.login-card');
        if (!btn) return;
        const token = btn.dataset.token;
        const profile = devProfiles.find((p) => p.token === token);
        if (profile) {
            saveSession(profile.token, profile.user);
            onLogin(profile);
        }
    });

    const manualBtn = root.querySelector('#manual-login');
    const manualInput = root.querySelector('#manual-token');
    if (manualBtn && manualInput) {
        manualBtn.addEventListener('click', () => {
            const token = manualInput.value.trim();
            if (!token) return;
            const user = { role: 'operatore', name: 'Token User', department: 'PS' };
            saveSession(token, user);
            onLogin({ token, user });
        });
    }
}
