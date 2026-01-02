import { state } from '../state/appState.js';
import { safeText, escapeHtml } from '../utils/sanitize.js';

const priorityMeta = {
    red: {
        label: 'Rosso',
        badge: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm',
        menu: 'hover:ring-red-100',
        dot: 'bg-red-500',
    },
    orange: {
        label: 'Arancione',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm',
        menu: 'hover:ring-amber-100',
        dot: 'bg-orange-500',
    },
    green: {
        label: 'Verde',
        badge: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm',
        menu: 'hover:ring-emerald-100',
        dot: 'bg-emerald-500',
    },
    white: {
        label: 'Bianco',
        badge: 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-200 shadow-sm',
        menu: 'hover:ring-slate-100',
        dot: 'bg-slate-400',
    },
};

function renderPrioritySelector(app, { compact = false } = {}) {
    const meta = priorityMeta[app.priorita] || priorityMeta.green;
    const buttonClasses = compact ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs';

    return `
        <div class="relative priority-selector inline-block" data-id="${escapeHtml(app.id)}">
            <button type="button" data-action="open-priority-popup" data-id="${escapeHtml(app.id)}"
                class="flex items-center gap-2 rounded-full border border-slate-200 bg-white text-slate-800 font-bold shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-150 ${buttonClasses}">
                <span class="px-2 py-0.5 rounded-full ${meta.badge} flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-white/80"></span>
                    ${meta.label}
                </span>
                <span class="text-[11px] uppercase tracking-wide text-slate-400">Cambia</span>
                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 transition-transform"></i>
            </button>
        </div>
    `;
}

export function updateWaitTimeBar(color, minutes, max) {
    const el = document.getElementById(`kpi-wait-${color}`);
    const bar = document.getElementById(`kpi-bar-${color}`);
    if (el && bar) {
        el.innerText = `${minutes} min`;
        const percentage = Math.min((minutes / max) * 100, 100);
        bar.style.width = `${percentage}%`;
    }
}

export function updateKPIs() {
    const today = new Date().toLocaleDateString();
    const todayCount = state.appointments.filter(a => new Date(a.data_visita).toLocaleDateString() === today).length;
    document.getElementById('kpi-total-today').innerText = todayCount;

    const activePatients = state.appointments.filter(a => a.stato !== 'Dimesso' && a.stato !== 'Ricoverato');
    const counts = { red: 0, orange: 0, green: 0, white: 0 };
    activePatients.forEach(a => { if (counts[a.priorita] !== undefined) counts[a.priorita]++; });

    document.getElementById('kpi-count-red').innerText = counts.red;
    document.getElementById('kpi-count-orange').innerText = counts.orange;
    document.getElementById('kpi-count-green').innerText = counts.green;
    document.getElementById('kpi-count-white').innerText = counts.white;

    const waitTimes = { orange: 20 + (counts.orange * 10), green: 45 + (counts.green * 15), white: 90 + (counts.white * 20) };
    updateWaitTimeBar('orange', waitTimes.orange, 120);
    updateWaitTimeBar('green', waitTimes.green, 240);
    updateWaitTimeBar('white', waitTimes.white, 360);
}

export function updateFilterButtons(activeFilter) {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        const filter = btn.getAttribute('data-filter');
        const color = btn.getAttribute('data-color');
        btn.className = btn.className.replace(/\b(bg|text|border|hover:bg|shadow)-(medical|slate|amber|purple|indigo|fuchsia|green|red|white)(-\d+)?\b/g, '').trim();
        btn.classList.add('transition-all');
        if (filter === activeFilter) {
            btn.classList.add(`bg-${color}-600`, 'text-white', `border-${color}-600`, 'shadow-md');
        } else {
            btn.classList.add('bg-white', `text-${color}-600`, `border-${color}-200`, `hover:bg-${color}-50`);
        }
    });
}

export function renderTable() {
    const tbody = document.getElementById('appointments-body');
    const mobileContainer = document.getElementById('appointments-mobile-container');
    tbody.innerHTML = '';
    mobileContainer.innerHTML = '';
    document.querySelectorAll('th span[id^="sort-icon-"]').forEach(el => el.innerHTML = '');
    const activeIcon = document.getElementById(`sort-icon-${state.currentSort.column}`);
    if (activeIcon) {
        activeIcon.innerHTML = state.currentSort.direction === 'asc'
            ? `<i data-lucide="arrow-up" class="w-3 h-3 inline ml-1"></i>`
            : `<i data-lucide="arrow-down" class="w-3 h-3 inline ml-1"></i>`;
    }

    let filtered = state.appointments.filter(a => {
        const s = document.getElementById('search-input').value.toLowerCase();
        const matchSearch = !s || a.paziente_nome.toLowerCase().includes(s) || a.cf.toLowerCase().includes(s);
        const matchFilter = state.currentFilter === 'all' || a.stato === state.currentFilter || a.priorita === state.currentFilter;
        return matchSearch && matchFilter;
    });

    filtered.sort((a, b) => {
        let valA = a[state.currentSort.column];
        let valB = b[state.currentSort.column];
        if (state.currentSort.column === 'data_visita') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        }
        if (valA < valB) return state.currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return state.currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 italic">Nessun paziente trovato.</td></tr>`;
        mobileContainer.innerHTML = `<div class="p-8 text-center text-slate-400 italic">Nessun paziente trovato.</div>`;
        return;
    }

    const limits = { red: 0, orange: 15, green: 60, white: 120 };
    const now = new Date();

    filtered.forEach(app => {
        const safeName = safeText(app.paziente_nome);
        const safeDoctor = safeText(app.dottore);
        const safeParams = safeText(app.parametri || '-', '-');
        const safeDoctorDept = safeText(app.doctor_department || '', '');
        const safeState = safeText(app.stato);
        const safeId = escapeHtml(app.id);
        const arrival = new Date(app.data_visita);
        const diffMins = Math.floor((now - arrival) / 60000);
        let isLate = false;
        if (app.stato !== 'Dimesso' && app.stato !== 'Ricoverato' && limits[app.priorita] !== undefined && diffMins > limits[app.priorita]) {
            isLate = true;
        }

        let badgeClass = 'bg-slate-100 text-slate-600';
        if (app.stato === 'Accertamenti Richiesti') badgeClass = 'bg-indigo-100 text-indigo-700 border border-indigo-200';
        else if (app.stato === 'Richiamo Visita Specialistica') badgeClass = 'bg-purple-100 text-purple-700 border border-purple-200';
        else if (app.stato === 'Attesa Referto Specialistico') badgeClass = 'bg-amber-100 text-amber-700 border border-amber-200';
        else if (app.stato === 'Valutazione Ulteriori Visite') badgeClass = 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200';
        else if (app.stato === 'Refertato') badgeClass = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
        else if (app.stato === 'Ricoverato') badgeClass = 'bg-red-100 text-red-800 border border-red-200';
        else if (app.stato === 'Dimesso') badgeClass = 'bg-green-50 text-green-800 border border-green-200';

        let actions = '';
        if (app.stato === 'Registrato') actions = `<button data-action="open-triage" data-id="${safeId}" class="w-full bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 shadow-sm">Accertamenti Preventivi</button>`;
        else if (app.stato === 'Accertamenti Richiesti') actions = `<button data-action="open-visit" data-id="${safeId}" class="w-full bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-amber-600 shadow-sm">Richiama Specialista</button>`;
        else if (app.stato === 'Richiamo Visita Specialistica') actions = `<button data-action="open-report-editor" data-id="${safeId}" class="w-full bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-purple-700 shadow-sm">Gestisci/Referta</button>`;
        else if (app.stato === 'Attesa Referto Specialistico' || app.stato === 'Valutazione Ulteriori Visite') actions = `<button data-action="open-report-editor" data-id="${safeId}" class="w-full bg-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm">Aggiorna Esito</button>`;
        else if (app.stato === 'Refertato') actions = `<div class="flex gap-2"><button data-action="open-outcome" data-id="${safeId}" data-type="dimissione" class="flex-1 bg-green-600 text-white px-2 py-1.5 rounded text-xs font-bold hover:bg-green-700 shadow-sm">Dimetti</button><button data-action="open-outcome" data-id="${safeId}" data-type="ricovero" class="flex-1 bg-red-600 text-white px-2 py-1.5 rounded text-xs font-bold hover:bg-red-700 shadow-sm">Ricovera</button></div>`;
        else actions = `<button data-action="open-report" data-id="${safeId}" class="w-full bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-white shadow-sm">Vedi Storico</button>`;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 border-b border-slate-50";

        const alertIcon = isLate ? `<span class="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded text-[10px] font-bold ml-2 animate-pulse" title="Tempo di attesa sopra soglia"><i data-lucide="alert-triangle" class="w-3 h-3"></i> Ritardo</span>` : '';

        tr.innerHTML = `
            <td class="px-6 py-4 align-top">
                <div data-action="open-patient" data-id="${safeId}" class="font-bold text-slate-900 cursor-pointer hover:text-medical-600 hover:underline transition-colors decoration-medical-500 decoration-2 underline-offset-2 sensitive-data" title="Apri anagrafica">${safeName}</div>
                <div class="text-xs text-slate-400 font-mono">ID: ${safeId}</div>
            </td>
            <td class="px-6 py-4 align-top">${renderPrioritySelector(app)}<div class="text-xs text-slate-500 mt-1">${safeParams}</div></td>
            <td class="px-6 py-4 align-top text-sm">
                <button data-action="show-assignment" data-id="${safeId}" class="text-xs font-bold px-2 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 transition">
                    ${app.doctor_department ? 'Specialista' : 'Pronto Soccorso'}
                </button>
                ${app.doctor_department ? `<div class="text-xs text-slate-500 mt-1">${safeDoctorDept || ''}</div>` : ''}
            </td>
            <td class="px-6 py-4 align-top text-xs font-mono text-slate-500">
                ${new Date(app.data_visita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                <div class="mt-1">${alertIcon}</div>
            </td>
            <td class="px-6 py-4 align-top text-center">
                ${app.stato === 'Accertamenti Richiesti'
                    ? `<button data-action="open-investigations" data-id="${safeId}" class="inline-block px-2 py-1 rounded text-xs font-bold ${badgeClass} hover:shadow-sm transition">` +
                      `${safeState}</button>`
                    : `<span class="inline-block px-2 py-1 rounded text-xs font-bold ${badgeClass}">${safeState}</span>`}
            </td>
            <td class="px-6 py-4 align-top text-right w-[160px]">${actions}</td>
        `;
        tbody.appendChild(tr);

        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3";
        card.innerHTML = `
            <div class="p-4 flex justify-between items-center relative z-10 bg-white cursor-pointer select-none" data-action="toggle-mobile-card" data-id="${safeId}">
                <div class="absolute top-0 right-0 p-2 opacity-5 pointer-events-none"><i data-lucide="activity" class="w-24 h-24"></i></div>
                
                <div class="flex-1 pr-2">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-900 text-lg sensitive-data">${safeName}</span>
                        ${isLate ? '<i data-lucide="alert-triangle" class="w-4 h-4 text-red-500"></i>' : ''}
                    </div>
                    <div class="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>ID: ${safeId}</span>
                        <span>•</span>
                        <span>${new Date(app.data_visita).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-1.5">
                    ${renderPrioritySelector(app, { compact: true })}
                    <div class="flex items-center gap-1 text-slate-400">
                        ${app.stato === 'Accertamenti Richiesti'
                            ? `<button data-action="open-investigations" data-id="${safeId}" class="text-[10px] font-bold uppercase tracking-wider underline decoration-indigo-500 decoration-2">${safeState}</button>`
                            : `<span class="text-[10px] font-bold uppercase tracking-wider">${safeState}</span>`}
                        <i id="chevron-${safeId}" data-lucide="chevron-down" class="w-4 h-4 transition-transform duration-300"></i>
                    </div>
                </div>
            </div>

            <div id="card-content-${safeId}" class="max-h-0 overflow-hidden transition-all duration-500 ease-in-out opacity-50">
                <div class="px-4 pb-4 pt-0 bg-white relative z-10 border-t border-slate-50">
                    <div class="grid grid-cols-2 gap-3 text-sm text-slate-600 my-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div class="col-span-2 flex justify-between items-center border-b border-slate-200 pb-2 mb-1">
                            <span class="text-[10px] uppercase text-slate-400 font-bold">Dettagli Clinici</span>
                            <button data-action="open-patient" data-id="${safeId}" class="text-xs font-bold text-medical-600 hover:underline">Anagrafica</button>
                        </div>
                        <div><span class="text-[10px] uppercase text-slate-400 font-bold block">Medico</span><span class="truncate block">${safeDoctor}</span></div>
                        <div><span class="text-[10px] uppercase text-slate-400 font-bold block">Parametri</span><span class="truncate block">${safeParams}</span></div>
                    </div>
                    <div class="space-y-2">
                        ${actions}
                    </div>
                </div>
            </div>
        `;
        mobileContainer.appendChild(card);
    });
    lucide.createIcons();
}

export function toggleMobileCard(id) {
    const content = document.getElementById(`card-content-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
        content.classList.remove('opacity-100');
        content.classList.add('opacity-50');
        chevron.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.remove('opacity-50');
        content.classList.add('opacity-100');
        chevron.style.transform = 'rotate(180deg)';
    }
}

export function toggleKPICard(id) {
    const content = document.getElementById(`kpi-content-${id}`);
    const chevron = document.getElementById(`kpi-chevron-${id}`);
    if (content.style.maxHeight === '0px') {
        content.style.maxHeight = content.scrollHeight + "px";
        content.classList.remove('opacity-0');
        content.classList.add('opacity-100');
        chevron.style.transform = 'rotate(180deg)';
    } else {
        if (!content.style.maxHeight) content.style.maxHeight = content.scrollHeight + "px";
        setTimeout(() => {
            content.style.maxHeight = '0px';
            content.classList.remove('opacity-100');
            content.classList.add('opacity-0');
            chevron.style.transform = 'rotate(0deg)';
        }, 10);
    }
}
