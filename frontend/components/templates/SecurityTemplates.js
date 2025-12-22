export function permissionDeniedTemplate() {
    return `
    <div class="min-h-screen bg-slate-900 text-white flex items-center justify-center px-6">
        <div class="max-w-xl w-full bg-slate-800/70 border border-slate-700 rounded-2xl shadow-2xl p-10 space-y-6 text-center">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
                <i data-lucide="shield-off" class="w-8 h-8"></i>
            </div>
            <div>
                <p class="text-xs uppercase tracking-[0.3em] text-red-300/80 font-bold">Accesso negato</p>
                <h1 class="text-3xl font-bold mt-2">Permission Denied</h1>
                <p class="text-sm text-slate-300 mt-2">L'origine o l'indirizzo non è autorizzato ad accedere a questa applicazione. Contatta l'amministratore o utilizza una rete consentita.</p>
            </div>
            <div class="flex items-center justify-center gap-3 text-xs text-slate-400">
                <span class="inline-flex items-center gap-1"><i data-lucide="lock" class="w-4 h-4"></i>Sicurezza attiva</span>
                <span class="inline-flex items-center gap-1"><i data-lucide="shield" class="w-4 h-4"></i>Contatta supporto</span>
            </div>
        </div>
    </div>
    `;
}

export function notFoundTemplate() {
    return `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-6">
        <div class="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-lg p-10 text-center space-y-5">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                <i data-lucide="map-pin-off" class="w-8 h-8"></i>
            </div>
            <div>
                <p class="text-xs uppercase tracking-[0.3em] text-slate-400 font-semibold">Pagina non trovata</p>
                <h1 class="text-3xl font-bold text-slate-900 mt-2">404 — Not Found</h1>
                <p class="text-sm text-slate-600 mt-2">La risorsa richiesta non esiste o non è più disponibile. Verifica l'URL o torna alla dashboard.</p>
            </div>
            <div class="flex items-center justify-center gap-3">
                <a href="/" class="px-4 py-2 bg-medical-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-medical-700 transition-colors">Torna alla Home</a>
                <button type="button" id="sf-retry-btn" class="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:border-medical-200 transition-colors">Riprova</button>
            </div>
        </div>
    </div>
    `;
}
