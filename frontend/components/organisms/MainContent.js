import { filterChip } from '../molecules/FilterChip.js';
import { filterDivider } from '../molecules/FilterDivider.js';
import { kpiCodeTile } from '../molecules/KpiCodeTile.js';
import { kpiWaitRow } from '../molecules/KpiWaitRow.js';

export const mainContent = () => {
    const filterChips = [
        { label: 'Tutti', filter: 'all', color: 'slate', className: 'font-medium shadow-sm' },
        { divider: true },
        { label: 'Accettazione', filter: 'Registrato', color: 'slate', className: 'font-bold uppercase' },
        { label: 'Attesa Visita', filter: 'In Attesa Visita', color: 'amber', className: 'font-bold uppercase' },
        { label: 'In Visita', filter: 'In Visita', color: 'purple', className: 'font-bold uppercase' },
        { label: 'Attesa Esiti', filter: 'Attesa Esiti', color: 'indigo', className: 'font-bold uppercase' },
        { label: 'O.B.I.', filter: 'OBI', color: 'fuchsia', className: 'font-bold uppercase' },
        { divider: true },
        { label: 'Dimessi', filter: 'Dimesso', color: 'green', className: 'font-bold uppercase' },
        { label: 'Ricoverati', filter: 'Ricoverato', color: 'red', className: 'font-bold uppercase' }
    ];

    const kpiCodeTiles = [
        { id: 'red', label: 'Rosso', containerClass: 'bg-red-50 border-red-100', dotClass: 'bg-red-500', labelClass: 'text-red-700', valueClass: 'text-red-800' },
        { id: 'orange', label: 'Arancio', containerClass: 'bg-orange-50 border-orange-100', dotClass: 'bg-orange-500', labelClass: 'text-orange-700', valueClass: 'text-orange-800' },
        { id: 'green', label: 'Verde', containerClass: 'bg-green-50 border-green-100', dotClass: 'bg-green-500', labelClass: 'text-green-700', valueClass: 'text-green-800' },
        { id: 'white', label: 'Bianco', containerClass: 'bg-slate-50 border-slate-200', dotClass: 'bg-slate-400', labelClass: 'text-slate-600', valueClass: 'text-slate-800' }
    ];

    const kpiWaitRows = [
        { id: 'orange', label: 'Codice Arancione', dotClass: 'bg-orange-500', barClass: 'bg-orange-400' },
        { id: 'green', label: 'Codice Verde', dotClass: 'bg-green-500', barClass: 'bg-green-400' },
        { id: 'white', label: 'Codice Bianco', dotClass: 'bg-slate-400', barClass: 'bg-slate-300' }
    ];

    const filtersMarkup = filterChips.map((chip) => {
        if (chip.divider) return filterDivider();
        return filterChip(chip);
    }).join('');

    const kpiTilesMarkup = kpiCodeTiles.map(kpiCodeTile).join('');
    const kpiWaitMarkup = kpiWaitRows.map(kpiWaitRow).join('');

    return `
<!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-print">
        
        <!-- Header -->
        <div class="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Pronto Soccorso</h2>
                <p class="mt-1 text-sm text-slate-500">Gestione flusso pazienti: Triage, Visita, Osservazione e Esito.</p>
            </div>
            <button data-action="open-booking" style="background: linear-gradient(135deg, #0369a1, #0284c7); color: #fff;" class="w-full sm:w-auto bg-medical-700 hover:bg-medical-800 text-white px-6 py-2.5 rounded-lg shadow-lg flex items-center justify-center gap-2 font-semibold active:scale-95 transition-all border border-medical-800/60 sf-primary-btn">
                <i data-lucide="user-plus" class="w-5 h-5"></i>
                Nuovo Accesso
            </button>
        </div>

        <!-- KPI Section -->
        <div class="kpi-section grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <!-- KPI 1: Accessi Odierni -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <!-- Header (Always Visible) -->
                <div class="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 select-none" data-action="toggle-kpi" data-kpi="kpi-1">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-medical-50 text-medical-600 rounded-lg">
                            <i data-lucide="users" class="w-5 h-5"></i>
                        </div>
                        <h3 class="text-sm font-semibold text-slate-500 uppercase tracking-wide">Registrati Oggi</h3>
                    </div>
                    <i id="kpi-chevron-kpi-1" data-lucide="chevron-down" class="w-5 h-5 text-slate-400 transition-transform duration-300 transform rotate-180"></i>
                </div>
                
                <!-- Content (Collapsible) -->
                <div id="kpi-content-kpi-1" class="transition-all duration-500 ease-in-out max-h-40 opacity-100">
                    <div class="p-5 pt-0 relative">
                        <div class="absolute right-0 top-0 p-4 opacity-5 pointer-events-none">
                            <i data-lucide="bar-chart-2" class="w-20 h-20 text-medical-600"></i>
                        </div>
                        <div class="flex items-baseline gap-2 mt-2">
                            <span id="kpi-total-today" class="text-3xl font-bold text-slate-900 sensitive-data">--</span>
                            <span class="text-xs text-green-600 font-medium flex items-center gap-0.5"><i data-lucide="trending-up" class="w-3 h-3"></i> +12%</span>
                        </div>
                        <button data-action="open-stats" class="text-xs text-medical-600 mt-3 flex items-center gap-1 hover:underline font-medium relative z-10">
                            <i data-lucide="pie-chart" class="w-3 h-3"></i> Vedi statistiche avanzate
                        </button>
                    </div>
                </div>
            </div>

            <!-- KPI 2: Pazienti Presenti per Codice -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <div class="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 select-none" data-action="toggle-kpi" data-kpi="kpi-2">
                    <div class="flex items-center gap-2">
                        <i data-lucide="activity" class="w-4 h-4 text-slate-400"></i>
                        <h3 class="text-xs font-bold text-slate-500 uppercase">Presenti per Codice</h3>
                    </div>
                    <i id="kpi-chevron-kpi-2" data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-300 transform rotate-180"></i>
                </div>

                <div id="kpi-content-kpi-2" class="transition-all duration-500 ease-in-out max-h-64 opacity-100">
                    <div class="p-4 pt-0">
                        <div class="grid grid-cols-2 gap-3 mt-2">
                            ${kpiTilesMarkup}
                        </div>
                    </div>
                </div>
            </div>

            <!-- KPI 3: Tempi di Attesa Stimati -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                <div class="p-4 flex justify-between items-center cursor-pointer bg-slate-50/50 select-none" data-action="toggle-kpi" data-kpi="kpi-3">
                    <div class="flex items-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4 text-slate-400"></i>
                        <h3 class="text-xs font-bold text-slate-500 uppercase">Attesa Stimata</h3>
                    </div>
                    <i id="kpi-chevron-kpi-3" data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform duration-300 transform rotate-180"></i>
                </div>

                <div id="kpi-content-kpi-3" class="transition-all duration-500 ease-in-out max-h-64 opacity-100">
                    <div class="p-4 pt-0 space-y-2 mt-2">
                        ${kpiWaitMarkup}
                    </div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="filters-section space-y-4 mb-8">
            <div class="relative max-w-xl">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i data-lucide="search" class="w-5 h-5 text-slate-400"></i></div>
                <input type="text" id="search-input" data-role="search-input" class="block w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-medical-500 outline-none text-sm shadow-sm" placeholder="Cerca per nome, CF o ID...">
            </div>
            <div class="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
                <div class="flex flex-nowrap gap-2 items-center min-w-max pb-2" id="filter-container">
                    ${filtersMarkup}
                </div>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 select-none">
                            <th data-action="sort-table" data-sort="paziente_nome" class="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition group">Paziente <span id="sort-icon-paziente_nome"></span></th>
                            <th class="px-6 py-4 font-semibold">Codice & Parametri</th>
                            <th class="px-6 py-4 font-semibold">Medico/Fase</th>
                            <th data-action="sort-table" data-sort="data_visita" class="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition group">Ingresso <span id="sort-icon-data_visita"></span></th>
                            <th data-action="sort-table" data-sort="stato" class="px-6 py-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition group">Stato Attuale <span id="sort-icon-stato"></span></th>
                            <th class="px-6 py-4 font-semibold text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody id="appointments-body" class="divide-y divide-slate-100 text-sm"></tbody>
                </table>
            </div>
            <div id="appointments-mobile-container" class="md:hidden p-4 space-y-4 bg-slate-50/50"></div>
        </div>
    </main>
`;
};
