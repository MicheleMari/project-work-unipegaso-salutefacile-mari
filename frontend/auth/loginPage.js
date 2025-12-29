import { saveSession, login } from '../services/authService.js';

const devProfiles = [
    { label: 'Operatore PS', email: 'ops@ospedale.test', password: 'ops123', department: 'PS' },
    { label: 'Specialista (Cardiologia)', email: 'cardio@ospedale.test', password: 'spec123', department: 'Cardiologia' },
    { label: 'Specialista (Ortopedia)', email: 'orto@ospedale.test', password: 'spec123', department: 'Ortopedia' },
];

export function renderLoginPage(root) {
    const cards = devProfiles.map((p) => `
        <button data-email="${p.email}" data-password="${p.password}" class="login-card group bg-white/60 hover:bg-white border border-slate-200 hover:border-medical-300 shadow-sm hover:shadow-md rounded-xl px-3 py-2.5 flex items-center justify-between transition-all w-full text-left">
            <div>
                <p class="text-xs uppercase text-slate-400 font-semibold">Accesso rapido</p>
                <h3 class="text-lg font-bold text-slate-900">${p.label}</h3>
                <p class="text-sm text-slate-500">${p.department}</p>
            </div>
            <div class="h-10 w-10 rounded-full bg-medical-50 text-medical-700 border border-medical-100 flex items-center justify-center font-bold group-hover:bg-medical-600 group-hover:border-medical-700 transition-colors">
                ${p.label.substring(0, 2).toUpperCase()}
            </div>
        </button>
    `).join('');

    root.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex items-center justify-center px-4 overflow-hidden">
        <div class="max-w-md w-full">
            <div class="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div class="p-5 space-y-4">
                    <div class="space-y-2 text-center">
                        <p class="text-xs uppercase tracking-widest text-medical-600 font-semibold">Accesso Operatori</p>
                        <img src="frontend/media/icons/mainLogo.png" alt="SaluteFacile" class="h-12 w-auto mx-auto object-contain" />
                        <p class="text-sm text-slate-500">Accedi con le credenziali della tabella utenti o usa i profili di test.</p>
                    </div>
                    <div class="space-y-2">
                        <label class="text-sm font-semibold text-slate-700">Email e Password</label>
                        <div class="flex flex-col gap-2">
                            <input id="login-email" type="email" placeholder="email@ospedale.test" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500" />
                            <input id="login-password" type="password" placeholder="Password" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-medical-500" />
                            <button id="manual-login" class="px-4 py-2.5 rounded-xl bg-medical-600 text-white font-semibold hover:bg-medical-700 transition [background:linear-gradient(90deg,#0ea5e9,#0284c7)]">Accedi</button>
                            <p id="login-error" class="text-sm text-red-600 font-semibold hidden">Errore: controlla email o password.</p>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <button type="button" id="toggle-quick" class="w-full flex items-center justify-between text-xs uppercase text-slate-500 font-semibold hover:text-medical-600 transition">
                            <span class="flex items-center gap-1"><i id="quick-static-chevron" data-lucide="chevrons-down" class="w-3 h-3 text-medical-600 transition-transform duration-300"></i> Oppure scegli un profilo rapido</span>
                            <i id="quick-chevron" data-lucide="chevron-down" class="w-4 h-4 text-slate-500 transition-transform duration-300"></i>
                        </button>
                        <div id="quick-container" class="grid gap-2 max-h-0 overflow-hidden transition-all duration-400 ease-in-out opacity-0">
                            ${cards}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    if (window.lucide) {
        window.lucide.createIcons();
    }
}

export function bindLoginHandlers(root, onLogin) {
    root.addEventListener('click', (e) => {
        const btn = e.target.closest('.login-card');
        if (!btn) return;
        const email = btn.dataset.email;
        const password = btn.dataset.password;
        if (!email || !password) return;
        handleLogin(email, password, onLogin);
    });

    const manualBtn = root.querySelector('#manual-login');
    const emailInput = root.querySelector('#login-email');
    const passInput = root.querySelector('#login-password');
    const quickToggle = root.querySelector('#toggle-quick');
    const quickContainer = root.querySelector('#quick-container');
    const quickChevron = root.querySelector('#quick-chevron');
    const staticChevron = root.querySelector('#quick-static-chevron');
    if (quickToggle && quickContainer && quickChevron) {
        quickToggle.addEventListener('click', () => {
            const isOpen = quickContainer.classList.contains('open');
            if (isOpen) {
                quickContainer.style.maxHeight = '0px';
                quickContainer.classList.remove('open');
                quickContainer.classList.add('opacity-0');
                quickChevron.style.transform = 'rotate(0deg)';
                if (staticChevron) staticChevron.style.transform = 'rotate(0deg)';
            } else {
                const fullHeight = quickContainer.scrollHeight;
                quickContainer.style.maxHeight = `${fullHeight}px`;
                quickContainer.classList.add('open');
                quickContainer.classList.remove('opacity-0');
                quickChevron.style.transform = 'rotate(180deg)';
                if (staticChevron) staticChevron.style.transform = 'rotate(180deg)';
            }
            setTimeout(() => {
                if (quickContainer.classList.contains('open')) {
                    quickContainer.style.maxHeight = `${quickContainer.scrollHeight}px`;
                } else {
                    quickContainer.style.maxHeight = '0px';
                    quickChevron.style.transform = 'rotate(0deg)';
                    if (staticChevron) staticChevron.style.transform = 'rotate(0deg)';
                }
            }, 10);
        });
    }
    if (manualBtn && emailInput && passInput) {
        manualBtn.addEventListener('click', () => {
            const email = emailInput.value.trim();
            const password = passInput.value;
            if (!email || !password) return;
            handleLogin(email, password, onLogin);
        });
    }
}

async function handleLogin(email, password, onLogin) {
    try {
        const session = await login(email, password);
        const err = document.getElementById('login-error');
        if (err) err.classList.add('hidden');
        onLogin(session);
    } catch (err) {
        const errBox = document.getElementById('login-error');
        const msg = (err && err.message) ? err.message.replace(/^\{"error":"?|\"?\}$/g, '') : 'Errore di login';
        if (errBox) {
            errBox.textContent = msg;
            errBox.classList.remove('hidden');
        } else {
            console.error(msg);
        }
    }
}
