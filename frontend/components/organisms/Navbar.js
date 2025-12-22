export const navbar = () => `
<!-- Top Navigation Bar -->
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center gap-2 sm:gap-3">
                    <div class="hidden sm:block">
                        <img src="frontend/media/icons/mainLogo.png" alt="SaluteFacile" class="h-10 w-auto object-contain" />
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    
                    <!-- AUTO LOCK TIMER -->
                    <div class="hidden md:flex flex-col items-end mr-2" title="Tempo al blocco automatico">
                         <div class="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                            <i data-lucide="lock-clock" class="w-3 h-3"></i>
                            <span id="auto-lock-timer">15 min 0 sec</span>
                        </div>
                    </div>

                    <!-- PRIVACY TOGGLE -->
                    <button data-action="toggle-privacy" id="privacy-btn" class="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-medical-600 transition-colors relative group" title="Privacy Mode (Occhio Discreto)">
                        <i id="privacy-icon" data-lucide="eye" class="w-5 h-5"></i>
                        <span class="absolute top-0 right-0 w-2 h-2 bg-slate-300 rounded-full" id="privacy-dot"></span>
                    </button>
                    
                    <div class="h-6 w-px bg-slate-200 mx-1"></div>

                    <div class="hidden sm:flex flex-col items-end mr-4">
                        <span id="current-time" class="text-sm font-mono text-slate-600 font-medium">--:--:--</span>
                        <div class="flex items-center gap-1.5"><span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span><span class="text-xs text-green-600 font-bold uppercase">Online</span></div>
                    </div>
                    <div class="relative">
                        <button id="user-menu-btn" class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 hover:border-medical-300 transition">
                            <div class="h-8 w-8 rounded-full bg-medical-100 border border-medical-200 flex items-center justify-center text-medical-700 font-bold text-sm" id="user-avatar">--</div>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
                        </button>
                        <div id="user-menu" class="hidden absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                            <button data-action="logout" class="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                <i data-lucide="log-out" class="w-4 h-4"></i>
                                Esci
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>
`;
