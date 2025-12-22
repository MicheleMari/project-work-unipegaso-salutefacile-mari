export const lockScreen = () => `
<!-- LOCK SCREEN OVERLAY -->
    <div id="lock-screen" class="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col items-center justify-center hidden text-white no-print">
        <div class="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl w-full max-w-sm text-center">
            <div class="mb-6 flex justify-center">
                <div class="w-20 h-20 bg-medical-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <i data-lucide="lock" class="w-10 h-10 text-white"></i>
                </div>
            </div>
            <h2 class="text-2xl font-bold mb-1">Terminale Bloccato</h2>
            <p class="text-slate-300 text-sm mb-6">Inserisci PIN per sbloccare</p>
            
            <form data-role="lock-form" class="space-y-4">
                <input type="password" id="lock-pin" maxlength="4" class="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-medical-500 placeholder-white/20" placeholder="••••" autofocus>
                <button type="submit" class="w-full bg-medical-600 hover:bg-medical-500 text-white font-bold py-3 rounded-lg transition-all shadow-lg active:scale-95">SBLOCCA</button>
                <p id="lock-error" class="hidden text-xs text-red-300 font-medium">PIN errato. Riprova.</p>
            </form>
            <p class="mt-4 text-xs text-slate-400">PIN Demo: 1234</p>
        </div>
    </div>
`;
