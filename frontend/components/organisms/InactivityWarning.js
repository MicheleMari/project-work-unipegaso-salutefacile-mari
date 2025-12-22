export const inactivityWarning = () => `
<!-- INACTIVITY WARNING BANNER -->
    <div id="inactivity-warning" class="fixed top-0 left-0 w-full bg-amber-500 text-white z-[90] py-2 px-4 text-center font-bold text-sm shadow-md hidden flex items-center justify-center gap-2 transform transition-transform duration-300 -translate-y-full no-print">
        <i data-lucide="alert-circle" class="w-4 h-4"></i>
        <span>Attenzione: Blocco automatico tra <span id="warning-countdown">30</span> secondi. Muovi il mouse per annullare.</span>
    </div>
`;
