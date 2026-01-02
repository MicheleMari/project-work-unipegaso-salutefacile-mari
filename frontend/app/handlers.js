import { state, constants } from '../state/appState.js';
import { fetchAppointmentsFromApi, createAppointmentApi, updateAppointmentApi } from '../services/appointmentsService.js';
import { createAppointment } from '../models/appointment.js';
import { validateBookingForm, validateTriageForm } from '../validators/formValidators.js';
import { addAppointment, addFile, clearFiles, removeFile, setAppointments, setFilter, setSort, updateAppointment } from './actions.js';
import { renderTable, toggleKPICard, toggleMobileCard, updateFilterButtons, updateKPIs } from './ui.js';
import { parseCF } from '../utils/cfUtils.js';
import { loadReferenceData } from '../services/dataLoader.js';
import { fetchInvestigations } from '../services/investigationsService.js';
import { escapeHtml, safeText } from '../utils/sanitize.js';
import { loadSession, computePermissions, clearSession } from '../services/authService.js';
export async function initApp() {
    const session = loadSession();
    if (session) {
        state.user = session.user;
        state.permissions = session.permissions;
    }
    await loadData();
    applyRoleUiRules();
    fetchAppointments();
    setupDragDrop();
    initCadastralMap();
    setInterval(() => document.getElementById('current-time').innerText = new Date().toLocaleTimeString('it-IT'), 1000);
    document.body.addEventListener('click', closeAllCustomSelects);
    bindUIEvents();
    bindExamCardClicks();

    startAutoLockTimer();
    ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => {
        document.addEventListener(evt, resetIdleTimer);
    });

    if (localStorage.getItem(constants.LOCK_STORAGE_KEY) === '1') {
        lockApp();
    }
}

function applyRoleUiRules() {
    const role = state.user?.role || 'operatore';
    document.body.dataset.role = role;
    const addBtn = document.querySelector('[data-action="open-booking"]');
    if (addBtn && !state.permissions.canCreate) {
        addBtn.classList.add('hidden');
    }

    const reportButtons = document.querySelectorAll('[data-action="open-report-editor"]');
    if (!state.permissions.canReferto) {
        reportButtons.forEach((btn) => btn.classList.add('opacity-60'));
    }

    const roleBadge = document.getElementById('user-role');
    const avatar = document.getElementById('user-avatar');
    const initial = computeInitials(state.user?.name || '');
    if (roleBadge) roleBadge.innerText = initial;
    if (avatar) avatar.innerText = initial;

    if (role === 'dottore') {
        const filters = document.querySelectorAll('#filter-container [data-filter]');
        const allowed = ['all', 'Accertamenti Richiesti', 'Richiamo Visita Specialistica', 'Attesa Referto Specialistico', 'Valutazione Ulteriori Visite', 'Ricoverato', 'Refertato'];
        filters.forEach((f) => {
            const val = f.dataset.filter;
            if (!allowed.includes(val)) {
                f.classList.add('hidden');
            }
        });
    }
}

function computeInitials(name) {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '--';
    const first = parts[0].charAt(0).toUpperCase();
    const last = (parts.length > 1 ? parts[parts.length - 1] : parts[0]).charAt(0).toUpperCase();
    return `${first}${last}`;
}

function toggleUserMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('user-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
}

function closeUserMenuOnBlur(event) {
    const menu = document.getElementById('user-menu');
    const btn = document.getElementById('user-menu-btn');
    if (!menu || !btn) return;
    if (!menu.contains(event.target) && !btn.contains(event.target)) {
        menu.classList.add('hidden');
    }
}

function logoutUser() {
    clearSession();
    window.location.reload();
}

function bindUIEvents() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => handleSearch());
    }

    const lockForm = document.querySelector('[data-role="lock-form"]');
    if (lockForm) {
        lockForm.addEventListener('submit', handleUnlock);
    }
    const lockInput = document.getElementById('lock-pin');
    if (lockInput) {
        lockInput.addEventListener('input', handleLockPinInput);
    }

    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBooking);
    }

    const triageForm = document.getElementById('triage-form');
    if (triageForm) {
        triageForm.addEventListener('submit', handleTriageSubmit);
    }
    const investigationsForm = document.getElementById('investigations-form');
    if (investigationsForm) {
        investigationsForm.addEventListener('submit', handleInvestigationsSubmit);
    }

    const newReportForm = document.querySelector('[data-role="new-report-form"]');
    if (newReportForm) {
        newReportForm.addEventListener('submit', handleNewReportSubmit);
    }

    const fileUploadInput = document.querySelector('[data-role="file-upload-input"]');
    if (fileUploadInput) {
        fileUploadInput.addEventListener('change', handleFileSelect);
    }

    const userMenuBtn = document.getElementById('user-menu-btn');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', toggleUserMenu);
    }

    document.addEventListener('click', handleActionClick);
    document.addEventListener('click', handleStopPropagation, true);
    document.addEventListener('keyup', handleRoleKeyup);
    document.addEventListener('click', closeUserMenuOnBlur);
}

async function loadData() {
    try {
        const [references, investigations] = await Promise.all([
            loadReferenceData(),
            fetchInvestigations().catch((err) => {
                console.warn('Investigations fetch failed:', err);
                return [];
            })
        ]);
        const { departmentsList, cadastralLines } = references;
        constants.departmentsList = departmentsList;
        constants.cadastralLines = cadastralLines;
        state.investigations = Array.isArray(investigations) ? investigations : [];
        renderInvestigationsList();
        // Applica la privacy già al primo caricamento (es. dopo un refresh)
        applyPrivacyStyles(state.privacyEnabled);
    } catch (error) {
        console.warn(error);
    }
}

function bindExamCardClicks() {
    const syncCardState = (checkbox) => {
        const card = checkbox.closest('.exam-item');
        if (card) {
            card.classList.toggle('selected', checkbox.checked);
            const shell = card.querySelector('.exam-card');
            if (shell) {
                shell.classList.toggle('ring-2', checkbox.checked);
                shell.classList.toggle('ring-medical-500', checkbox.checked);
                shell.classList.toggle('border-medical-500', checkbox.checked);
                shell.classList.toggle('bg-medical-50', checkbox.checked);
            }
        }
    };

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.exam-item');
        if (!card) return;
        const checkbox = card.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        if (event.target === checkbox) {
            syncCardState(checkbox);
            return;
        }
        event.preventDefault();
        checkbox.checked = !checkbox.checked;
        syncCardState(checkbox);
    });

    document.addEventListener('change', (event) => {
        const checkbox = event.target.matches('input[name="exams"]') ? event.target : null;
        if (!checkbox) return;
        syncCardState(checkbox);
    });
}

function titleCaseAddress(val) {
    if (!val) return '';
    return String(val).replace(/\b([A-Za-zÀ-ÿ])([A-Za-zÀ-ÿ]*)/g, (match, first, rest) => {
        const word = first + rest;
        const upperWord = word.toUpperCase();
        // Mantieni acronimi brevi già maiuscoli (es. BA)
        if (word.length <= 3 && word === upperWord) return upperWord;
        return first.toUpperCase() + rest.toLowerCase();
    });
}

function sanitizeAppointment(data) {
    return {
        ...data,
        safeName: safeText(data.paziente_nome || ''),
        safeCf: escapeHtml(data.cf || ''),
        safePriorita: escapeHtml(data.priorita || ''),
        safeStato: safeText(data.stato || ''),
        safeParametri: safeText(data.parametri || '-', '-'),
        safeDottore: safeText(data.dottore || '-', '-'),
        // fallback a residence_address per record provenienti direttamente dal backend e title-case
        safeIndirizzo: safeText(titleCaseAddress(data.indirizzo || data.residence_address || 'N/D'), 'N/D'),
        safeCitta: safeText(data.citta || '', ''),
        safeEmail: safeText(data.email || '', ''),
        safeTelefono: safeText(data.telefono || '', ''),
        safeRefertoEsito: safeText(data?.referto?.esito || '--', '--'),
        safeRefertoTerapia: safeText(data?.referto?.terapia || '--', '--'),
    };
}

function renderInvestigationsList() {
    const container = document.getElementById('investigations-list');
    if (!container) return;
    const items = Array.isArray(state.investigations) ? state.investigations : [];

    if (!items.length) {
        container.innerHTML = '<div class="col-span-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">Nessun accertamento configurato</div>';
        return;
    }

    const palette = ['red', 'blue', 'amber', 'emerald', 'purple', 'pink', 'orange', 'slate'];
    container.innerHTML = items.map((item, idx) => {
        const color = palette[idx % palette.length];
        const safeTitle = escapeHtml(item.title || `Accertamento ${item.id}`);
        return `<label class="cursor-pointer block relative group exam-item">
            <input type="checkbox" name="exams" value="${item.id}" data-label="${safeTitle}" class="peer sr-only">
            <div class="exam-card p-3 rounded-lg border-2 border-slate-100 flex items-center gap-3 transition-all hover:bg-slate-50">
                <span class="exam-check shrink-0" aria-hidden="true"></span>
                <div class="w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center shrink-0"><i data-lucide="clipboard-list" class="w-4 h-4"></i></div>
                <span class="font-bold text-slate-700 text-xs">${safeTitle}</span>
            </div>
        </label>`;
    }).join('');
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function handleActionClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.dataset.action;
    if (action === 'open-booking' && !state.permissions.canCreate) {
        showToast('Azione non consentita per il tuo ruolo');
        return;
    }
    if (action === 'open-report-editor' && !state.permissions.canReferto) {
        showToast('Solo visualizzazione consentita');
        openReport(parseInt(target.dataset.id, 10));
        return;
    }
    if (action === 'logout') {
        logoutUser();
        return;
    }
    switch (action) {
        case 'open-booking':
            openBookingModal();
            break;
        case 'toggle-privacy':
            togglePrivacy();
            break;
        case 'open-stats':
            openStatsModal();
            break;
        case 'open-investigations':
            openInvestigationsModal(parseInt(target.dataset.id, 10));
            break;
        case 'toggle-inv-card': {
            const bodyId = target.dataset.target;
            const body = bodyId ? document.getElementById(bodyId) : null;
            if (body) {
                const isOpen = body.classList.contains('open');
                const content = body.querySelector('.accordion-inner') || body;
                if (isOpen) {
                    const currentHeight = content.scrollHeight;
                    body.style.maxHeight = `${currentHeight}px`;
                    requestAnimationFrame(() => {
                        body.classList.remove('open');
                        body.style.maxHeight = '0px';
                    });
                    body.addEventListener('transitionend', () => {
                        body.style.maxHeight = '0px';
                    }, { once: true });
                } else {
                    const startHidden = body.style.maxHeight === '' || body.style.maxHeight === '0px';
                    if (startHidden) {
                        body.style.maxHeight = '0px';
                    }
                    body.classList.add('open');
                    const targetHeight = content.scrollHeight || content.offsetHeight || body.scrollHeight;
                    requestAnimationFrame(() => { body.style.maxHeight = `${targetHeight}px`; });
                    body.addEventListener('transitionend', () => {
                        if (body.classList.contains('open')) {
                            body.style.maxHeight = '';
                        }
                    }, { once: true });
                }
                const icon = target.querySelector('[data-lucide], svg.lucide');
                if (icon) {
                    icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
                    icon.style.transition = 'transform 0.25s ease';
                }
            }
            break;
        }
        case 'toggle-kpi':
            toggleKPICard(target.dataset.kpi);
            break;
        case 'filter-table':
            filterTable(target.dataset.filter);
            break;
        case 'sort-table':
            sortTable(target.dataset.sort);
            break;
        case 'close-modal':
            closeModal(target.dataset.modal);
            break;
        case 'toggle-edit-patient':
            if (state.isEditingPatient) {
                savePatientDetails();
            } else {
                toggleEditPatient();
            }
            break;
        case 'copy-cf':
            copyToClipboard(target.dataset.target);
            break;
        case 'toggle-select':
            toggleCustomSelect(target.dataset.select);
            break;
        case 'select-option':
            selectCustomOption(target.dataset.select, target.dataset.value, target.dataset.display);
            break;
        case 'open-patient':
            openPatientDetails(parseInt(target.dataset.id, 10));
            break;
        case 'open-triage':
            openTriageModal(parseInt(target.dataset.id, 10));
            break;
        case 'open-visit':
            openVisitModal(parseInt(target.dataset.id, 10));
            break;
        case 'open-report-editor':
            openNewReportModal(parseInt(target.dataset.id, 10));
            break;
        case 'confirm-visit':
            confirmVisitAssignment();
            break;
        case 'update-status':
            updateStatusFromModal(target.dataset.status);
            break;
        case 'save-patient':
            savePatientDetails();
            break;
        case 'open-outcome':
            openOutcomeModal(parseInt(target.dataset.id, 10), target.dataset.type);
            break;
        case 'confirm-outcome':
            confirmOutcome();
            break;
        case 'open-report':
            openReport(parseInt(target.dataset.id, 10));
            break;
        case 'toggle-mobile-card':
            toggleMobileCard(parseInt(target.dataset.id, 10));
            break;
        case 'print-report':
            window.print();
            break;
        case 'show-assignment':
            showAssignment(parseInt(target.dataset.id, 10));
            break;
        case 'trigger-file-upload': {
            const input = document.getElementById('file-upload');
            if (input) input.click();
            break;
        }
        case 'remove-attachment':
            removeAttachment(parseInt(target.dataset.index, 10));
            break;
        default:
            break;
    }
}

function handleStopPropagation(event) {
    const target = event.target.closest('[data-action="stop-propagation"]');
    if (target) {
        event.stopPropagation();
    }
}

function handleRoleKeyup(event) {
    const target = event.target;
    if (target.matches('[data-role="custom-select-search"]')) {
        filterCustomOptions(target);
        return;
    }
    if (target.matches('[data-role="exams-search"]')) {
        filterExams(target);
    }
}

        // --- BLOCCO AUTOMATICO ---
        function formatIdleTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins} min ${secs} sec`;
        }

        function startAutoLockTimer() {
            if(state.autoLockInterval) clearInterval(state.autoLockInterval);
            state.autoLockInterval = setInterval(() => {
                const lockScreen = document.getElementById('lock-screen');
                if(!lockScreen.classList.contains('hidden')) return; // già bloccato

                state.idleSeconds++;
                const remaining = constants.IDLE_LIMIT - state.idleSeconds;
                
                // Aggiorna il timer sullo schermo
                const timerDisplay = document.getElementById('auto-lock-timer');
                if(timerDisplay) timerDisplay.innerText = formatIdleTime(remaining);

                // Gestione del banner di avviso
                const warningBanner = document.getElementById('inactivity-warning');
                const warningSpan = document.getElementById('warning-countdown');
                if (state.idleSeconds >= constants.IDLE_LIMIT - constants.WARNING_LIMIT) {
                    if (warningBanner.classList.contains('hidden')) {
                        warningBanner.classList.remove('hidden');
                        setTimeout(() => warningBanner.classList.remove('-translate-y-full'), 10);
                    }
                    if (warningSpan) warningSpan.innerText = remaining;
                }

                // Quando scade il tempo blocca l'app
                if (state.idleSeconds >= constants.IDLE_LIMIT) {
                    lockApp();
                }
            }, 1000);
        }

        function resetIdleTimer() {
            const lockScreen = document.getElementById('lock-screen');
            if(!lockScreen.classList.contains('hidden')) return; // non azzerare se bloccato
            
            state.idleSeconds = 0;
            const timerDisplay = document.getElementById('auto-lock-timer');
            if(timerDisplay) timerDisplay.innerText = formatIdleTime(constants.IDLE_LIMIT);
            
            // Nascondi l'avviso
            const warningBanner = document.getElementById('inactivity-warning');
            if (!warningBanner.classList.contains('hidden')) {
                warningBanner.classList.add('-translate-y-full');
                setTimeout(() => warningBanner.classList.add('hidden'), 300);
            }
        }

        function lockApp() {
            document.getElementById('lock-screen').classList.remove('hidden');
            document.getElementById('inactivity-warning').classList.add('hidden');
            document.getElementById('lock-pin').value = '';
            const error = document.getElementById('lock-error');
            if (error) error.classList.add('hidden');
            localStorage.setItem(constants.LOCK_STORAGE_KEY, '1');
        }

        function attemptUnlock(pin, { silent = false } = {}) {
            // PIN demo: 0000 o 1234
            if (pin === '1234' || pin === '0000') {
                const error = document.getElementById('lock-error');
                if (error) error.classList.add('hidden');
                document.getElementById('lock-screen').classList.add('hidden');
                localStorage.removeItem(constants.LOCK_STORAGE_KEY);
                resetIdleTimer();
                return true;
            }

            if (!silent) {
                const error = document.getElementById('lock-error');
                if (error) error.classList.remove('hidden');
                document.getElementById('lock-pin').value = '';
            }
            return false;
        }

        function handleLockPinInput(e) {
            const { value } = e.target;
            const error = document.getElementById('lock-error');
            if (error) error.classList.add('hidden');
            if (value.length === 4) {
                attemptUnlock(value, { silent: true });
            }
        }

        function handleUnlock(e) {
            e.preventDefault();
            const pin = document.getElementById('lock-pin').value;
            attemptUnlock(pin);
        }

        // --- MODALITÀ PRIVACY ---
        function applyPrivacyStyles(isEnabled) {
            const body = document.body;
            const icon = document.getElementById('privacy-icon');
            const dot = document.getElementById('privacy-dot');
            const btn = document.getElementById('privacy-btn');
            const sensitiveNodes = document.querySelectorAll('.sensitive-data');

            if (isEnabled) {
                body.classList.add('privacy-active');
                sensitiveNodes.forEach((node) => {
                    node.style.filter = 'blur(6px)';
                    node.style.userSelect = 'none';
                });
                if (icon) icon.setAttribute('data-lucide', 'eye-off');
                if (dot) dot.className = "absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse";
                if (btn) btn.classList.add('text-medical-600', 'bg-medical-50');
            } else {
                body.classList.remove('privacy-active');
                sensitiveNodes.forEach((node) => {
                    node.style.filter = '';
                    node.style.userSelect = '';
                });
                if (icon) icon.setAttribute('data-lucide', 'eye');
                if (dot) dot.className = "absolute top-0 right-0 w-2 h-2 bg-slate-300 rounded-full";
                if (btn) btn.classList.remove('text-medical-600', 'bg-medical-50');
            }
            lucide.createIcons();
        }

        function togglePrivacy() {
            state.privacyEnabled = !state.privacyEnabled;
            applyPrivacyStyles(state.privacyEnabled);
            showToast(state.privacyEnabled ? "Privacy Mode Attivata" : "Privacy Mode Disattivata");
        }

        function initCadastralMap() {
            const lines = constants.cadastralLines || [];
            lines.forEach((line) => {
                if (!line) return;
                if (typeof line === 'string') {
                    const trimmed = line.trim();
                    if (!trimmed) return;
                    const parts = trimmed.split(/\s+/);
                    if (parts.length < 3) return;
                    const code = parts[0];
                    const firstSpace = trimmed.indexOf(' ');
                    const lastParen = trimmed.lastIndexOf('(');
                    const lastClosedParen = trimmed.lastIndexOf(')');
                    if (firstSpace > -1 && lastParen > -1 && lastClosedParen > lastParen) {
                        state.cityMap[code] = trimmed.substring(firstSpace + 1, lastClosedParen + 1).trim();
                    }
                    return;
                }
                if (line.codice && line.comune) {
                    state.cityMap[line.codice] = {
                        comune: line.comune,
                        provincia: line.provincia || ''
                    };
                }
            });
        }
        function filterExams(input) { const filter = input.value.toLowerCase(); document.querySelectorAll('.exam-item').forEach(item => item.style.display = item.innerText.toLowerCase().includes(filter) ? "" : "none"); }
function toggleCustomSelect(id) { 
    const c = document.getElementById(id); 
    if(!c.classList.contains('disabled')) { 
        const options = c.querySelector('.custom-select-options');
        const isOpen = c.classList.contains('open');
        closeAllCustomSelects(null); 
        if(!isOpen) { 
            c.classList.add('open'); 
            if (options) options.classList.remove('hidden');
        }
    } 
}
function filterCustomOptions(input) { const f = input.value.toLowerCase(); input.closest('.custom-select-options').querySelectorAll('.custom-options-list > div').forEach(o => o.style.display = o.innerText.toLowerCase().includes(f) ? "" : "none"); }
function selectCustomOption(id, val, txt) { 
    const c = document.getElementById(id); 
    c.querySelector('input[type="hidden"]').value = val; 
    const s = c.querySelector('.custom-select-trigger span'); 
    s.innerText = txt; 
    s.classList.add('text-slate-900'); 
    c.classList.remove('open'); 
    const options = c.querySelector('.custom-select-options');
    if (options) options.classList.add('hidden');
    event.stopPropagation(); 
}
function closeAllCustomSelects(e) { document.querySelectorAll('.custom-select-container').forEach(s => { if(e && s.contains(e.target)) return; s.classList.remove('open'); s.querySelectorAll('.custom-select-options').forEach(o => o.classList.add('hidden')); }); }
        function setupDragDrop() { const dz = document.getElementById('drop-zone'); if(!dz) return; ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(e => dz.addEventListener(e, (ev) => { ev.preventDefault(); ev.stopPropagation(); })); ['dragenter', 'dragover'].forEach(e => dz.addEventListener(e, () => dz.classList.add('drag-over'))); ['dragleave', 'drop'].forEach(e => dz.addEventListener(e, () => dz.classList.remove('drag-over'))); dz.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files)); }
        function handleFileSelect(e) { handleFiles(e.target.files); }
        function handleFiles(files) {
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            ([...files]).forEach(f => {
                if (!allowedTypes.includes(f.type)) { showToast('Tipo file non consentito'); return; }
                if (f.size > maxSize) { showToast('File troppo grande (max 5MB)'); return; }
                const meta = { name: f.name, type: f.type, size: f.size };
                const r = new FileReader();
                r.onloadend = () => { addFile({ ...meta, data: r.result }); renderPreviews(); };
                r.readAsDataURL(f);
            });
        }
        function renderPreviews() { const c = document.getElementById('attachments-preview-grid'); c.innerHTML = state.currentFiles.map((f, i) => `<div class="relative bg-slate-50 border rounded p-2 text-xs flex flex-col items-center text-center"><button data-action="remove-attachment" data-index="${i}" class="absolute top-1 right-1 text-red-500"><i data-lucide="x" class="w-3 h-3"></i></button><i data-lucide="file" class="w-6 h-6 text-slate-400 mb-1"></i><span class="truncate w-full font-bold">${escapeHtml(f.name)}</span></div>`).join(''); lucide.createIcons(); }
        function removeAttachment(index) { removeFile(index); renderPreviews(); }
        function copyToClipboard(id) { const el = document.getElementById(id); if(el) { navigator.clipboard.writeText(el.value).then(() => showToast("Copiato negli appunti!")); } }

        // --- LOGICA TABELLA E DATI ---
        async function fetchAppointments() {
            try {
                const list = await fetchAppointmentsFromApi();
                setAppointments(list);
            } catch (error) {
                console.warn('Backend non raggiungibile:', error);
                showToast('Backend non raggiungibile, riprova più tardi');
            }
            renderTable();
            updateFilterButtons('all');
            updateKPIs();
        }

        // --- MODALE STATISTICHE ---
        function openStatsModal() {
            const counts = { red: 0, orange: 0, green: 0, white: 0 }; let discharged = 0; let admitted = 0; const deptCounts = {};
            state.appointments.forEach(a => {
                if (counts[a.priorita] !== undefined) counts[a.priorita]++;
                if (a.stato === 'Dimesso') discharged++;
                if (a.stato === 'Ricoverato') admitted++;
                const deptMatch = a.dottore.match(/\((.*?)\)/);
                if (deptMatch && deptMatch[1]) { const dept = deptMatch[1]; deptCounts[dept] = (deptCounts[dept] || 0) + 1; }
            });
            const total = state.appointments.length || 1;
            const codesContainer = document.getElementById('stats-codes-chart'); codesContainer.innerHTML = '';
            const colorMap = { red: {label: 'Rosso', bg: 'bg-red-500'}, orange: {label: 'Arancione', bg: 'bg-orange-500'}, green: {label: 'Verde', bg: 'bg-green-500'}, white: {label: 'Bianco', bg: 'bg-slate-300'} };
            for (const [code, count] of Object.entries(counts)) {
                const pct = Math.round((count / total) * 100); const conf = colorMap[code];
                codesContainer.innerHTML += `<div><div class="flex justify-between text-xs mb-1"><span class="font-bold text-slate-700">${escapeHtml(conf.label)}</span><span class="font-mono text-slate-500">${count} (${pct}%)</span></div><div class="w-full bg-slate-100 rounded-full h-2"><div class="${conf.bg} h-2 rounded-full" style="width: ${pct}%"></div></div></div>`;
            }
            document.getElementById('stats-discharged').innerText = discharged; document.getElementById('stats-admitted').innerText = admitted;
            const admissionRate = (admitted + discharged) > 0 ? Math.round((admitted / (admitted + discharged)) * 100) : 0;
            document.getElementById('stats-admission-rate').innerText = `${admissionRate}%`;
            const deptsContainer = document.getElementById('stats-departments-list'); deptsContainer.innerHTML = '';
            const sortedDepts = Object.entries(deptCounts).sort((a,b) => b[1] - a[1]).slice(0, 6);
            if (sortedDepts.length === 0) { deptsContainer.innerHTML = '<span class="text-xs text-slate-400 italic col-span-3">Nessun dato reparto disponibile.</span>'; } 
            else { sortedDepts.forEach(([dept, count]) => { const safeDept = escapeHtml(dept); deptsContainer.innerHTML += `<div class="bg-slate-50 p-3 rounded border border-slate-100 text-center"><div class="text-xs text-slate-500 uppercase font-bold truncate" title="${safeDept}">${safeDept}</div><div class="text-xl font-bold text-medical-600">${count}</div></div>`; }); }
            toggleModal('stats-modal', true);
        }
        function filterTable(f) { setFilter(f); updateFilterButtons(f); renderTable(); }
        function sortTable(c) { const direction = (state.currentSort.column === c && state.currentSort.direction === 'asc') ? 'desc' : 'asc'; setSort(c, direction); renderTable(); }
        function handleSearch() { renderTable(); }
        
        function openBookingModal() { 
            const form = document.getElementById('booking-form');
            if (form) form.reset(); 
            const defaultPriority = document.querySelector('input[name="booking_priority"][value="green"]');
            if (defaultPriority) defaultPriority.checked = true;
            toggleModal('booking-modal', true); 
        }
        async function handleBooking(e) { 
            e.preventDefault(); 
            if (!state.permissions.canCreate) { showToast('Non puoi creare nuovi accessi'); return; }
            const form = e.currentTarget; 
            if (!validateBookingForm(form)) return; 
            const name = document.getElementById('p_name').value;
            const surname = document.getElementById('p_surname').value;
            const payload = { 
                paziente_nome: `${name} ${surname}`.trim(),
                name,
                surname,
                cf: document.getElementById('p_cf').value, 
                priorita: document.querySelector('input[name="booking_priority"]:checked')?.value || 'green',
                stato: 'Registrato', 
                data_visita: new Date().toISOString(),
                parametri: document.getElementById('p_reason').value || null
            };
            try {
                const saved = await createAppointmentApi(payload);
                addAppointment(saved);
            } catch (error) {
                console.warn('Create appointment offline:', error);
                const local = createAppointment({ ...payload, id: Date.now() });
                addAppointment(local);
                showToast('Backend non raggiungibile, registrazione solo locale');
            }
            closeModal('booking-modal'); 
            filterTable('all'); 
        showToast('Paziente registrato'); 
        updateKPIs(); 
    }
function prefillInvestigations(selected = []) {
    const ids = new Set(
        (selected || [])
            .map((item) => item?.investigation_id ?? item?.id ?? item)
            .map((val) => parseInt(val, 10))
            .filter((id) => Number.isInteger(id) && id > 0)
    );
    const checkboxes = document.querySelectorAll('input[name="exams"]');
    checkboxes.forEach((el) => {
        const id = parseInt(el.value, 10);
        const isChecked = ids.has(id);
        el.checked = isChecked;
        const card = el.closest('.exam-item');
        if (card) {
            card.classList.toggle('selected', isChecked);
            const shell = card.querySelector('.exam-card');
            if (shell) {
                shell.classList.toggle('ring-2', isChecked);
                shell.classList.toggle('ring-medical-500', isChecked);
                shell.classList.toggle('border-medical-500', isChecked);
                shell.classList.toggle('bg-medical-50', isChecked);
            }
        }
    });
}
    function openTriageModal(id) { const a=state.appointments.find(x=>x.id===id); document.getElementById('triage_id').value=id; document.getElementById('triage-patient-name').innerText=a.paziente_nome; document.getElementById('triage-form').reset(); renderInvestigationsList(); prefillInvestigations(a?.investigations || []); toggleModal('triage-modal', true); }
    async function handleTriageSubmit(e) { 
        e.preventDefault(); 
        const form = e.currentTarget; 
        if (!validateTriageForm(form)) return; 
        const id=parseInt(document.getElementById('triage_id').value); 
        const selectedExams = [...form.querySelectorAll('input[name=\"exams\"]:checked')];
        const exams = selectedExams.map((el) => el.dataset.label || el.value).join(', ') || 'Nessuno';
        const investigationIds = selectedExams.map((el) => parseInt(el.value, 10)).filter((val) => Number.isInteger(val) && val > 0);
        const valOrEmpty = (inputId) => document.getElementById(inputId)?.value || '';
        const vitals = `PA:${valOrEmpty('v_pa')} FC:${valOrEmpty('v_fc')} SpO2:${valOrEmpty('v_spo2')} TC:${valOrEmpty('v_tc')}`;
        const existing = state.appointments.find(x => x.id === id);
        const payload = { stato: 'Accertamenti Richiesti', priorita: existing?.priorita || 'green', parametri: `${vitals} | Esami: ${exams}`, investigations: investigationIds };
        let updated;
        try {
            const saved = await updateAppointmentApi(id, payload);
            updated = updateAppointment(id, saved);
        } catch (error) {
                console.warn('Triage update offline:', error);
                updated = updateAppointment(id, payload);
                showToast('Backend non raggiungibile, salvataggio locale');
            }
            if (updated) { closeModal('triage-modal'); filterTable('all'); showToast('Codice assegnato, accertamenti richiesti e parametri registrati'); updateKPIs(); } 
        }
        function renderInvestigationsRows(a) {
            const container = document.getElementById('investigations-rows');
            if (!container) return;
            const items = Array.isArray(a?.investigations) ? a.investigations : [];
            if (!items.length) {
                container.innerHTML = '<div class="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">Nessun accertamento registrato per questo paziente.</div>';
                return;
            }
            container.innerHTML = items.map((item, idx) => {
                const invId = item.investigation_id || item.id || idx + 1;
                const bodyId = `inv-body-${invId}`;
                const status = (item.outcome || item.notes || item.attachment_path) ? 'Refertato' : 'In corso';
                const statusClass = status === 'Refertato' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200';
                const safeTitle = escapeHtml(item.title || `Accertamento ${invId}`);
                const attachment = item.attachment_path ? `<a href="${escapeHtml(item.attachment_path)}" target="_blank" class="text-indigo-600 text-xs font-semibold underline">Apri referto</a>` : '<span class="text-xs text-slate-400">Nessun file</span>';
                const outcomeVal = escapeHtml(item.outcome || '');
                const notesVal = escapeHtml(item.notes || '');
                return `<div class="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden" data-investigation-id="${invId}">
                    <button type="button" data-action="toggle-inv-card" data-target="${bodyId}" class="w-full flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50 text-left">
                        <div>
                            <div class="flex items-center gap-2">
                                <h4 class="font-bold text-slate-800 text-sm">${safeTitle}</h4>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform" aria-hidden="true"></i>
                            </div>
                            <p class="text-xs text-slate-500">${escapeHtml(item.description || '')}</p>
                        </div>
                        <span class="px-2 py-1 rounded text-[11px] font-bold ${statusClass} shrink-0">${status}</span>
                    </button>
                    <div id="${bodyId}" class="accordion-body">
                        <div class="accordion-inner px-4 pb-4 pt-2 space-y-3 border-t border-slate-100">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Esito sintetico
                                    <input type="text" class="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" data-field="outcome" value="${outcomeVal}">
                                </label>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    URL/Path referto
                                    <input type="text" class="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" data-field="attachment" value="${escapeHtml(item.attachment_path || '')}" placeholder="https://... o percorso file">
                                </label>
                            </div>
                            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Note / Referto testuale
                                <textarea rows="2" class="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" data-field="notes">${notesVal}</textarea>
                            </label>
                            <div class="text-xs">${attachment}</div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        function openInvestigationsModal(id) {
            const a = state.appointments.find((x) => x.id === id);
            if (!a) return;
            document.getElementById('inv_encounter_id').value = id;
            const nameEl = document.getElementById('inv-patient-name');
            if (nameEl) nameEl.innerText = a.paziente_nome || '--';
            renderInvestigationsRows(a);
            lucide.createIcons();
            const bodies = document.querySelectorAll('#investigations-rows .accordion-body');
            bodies.forEach((body) => {
                body.classList.remove('open');
                body.style.maxHeight = '0px';
            });
            const icons = document.querySelectorAll('#investigations-rows [data-action=\"toggle-inv-card\"] [data-lucide], #investigations-rows [data-action=\"toggle-inv-card\"] svg.lucide');
            icons.forEach((icon) => {
                icon.style.transform = 'rotate(0deg)';
                icon.style.transition = 'transform 0.25s ease';
            });
            toggleModal('investigations-modal', true);
        }

        async function handleInvestigationsSubmit(e) {
            e.preventDefault();
            const form = e.currentTarget;
            const id = parseInt(document.getElementById('inv_encounter_id').value, 10);
            if (!Number.isInteger(id)) return;
            const cards = [...form.querySelectorAll('[data-investigation-id]')];
            const items = cards.map((card) => {
                const invId = parseInt(card.dataset.investigationId, 10);
                const outcome = card.querySelector('[data-field="outcome"]')?.value?.trim() || null;
                const notes = card.querySelector('[data-field="notes"]')?.value?.trim() || null;
                const attachment = card.querySelector('[data-field="attachment"]')?.value?.trim() || null;
                return {
                    investigation_id: invId,
                    outcome,
                    notes,
                    attachment_path: attachment
                };
            }).filter((item) => Number.isInteger(item.investigation_id) && item.investigation_id > 0);

            const existing = state.appointments.find((x) => x.id === id);
            const payload = {
                stato: existing?.stato || 'Accertamenti Richiesti',
                investigations: items
            };
            let updated;
            try {
                const saved = await updateAppointmentApi(id, payload);
                updated = updateAppointment(id, saved);
            } catch (error) {
                console.warn('Investigations update offline:', error);
                updated = updateAppointment(id, { investigations: items, stato: payload.stato });
                showToast('Backend non raggiungibile, salvataggio locale');
            }
            if (updated) {
                showToast('Accertamenti aggiornati');
                closeModal('investigations-modal');
                filterTable('all');
                updateKPIs();
            }
        }
        
        function openPatientDetails(id) {
            const a = state.appointments.find(x => x.id === id); if (!a) return; 
            state.isEditingPatient = true; toggleEditPatient({ silent: true }); 
            document.getElementById('pd-name').value = a.paziente_nome; document.getElementById('pd-id').innerText = `ID: ${a.id}`; document.getElementById('pd-cf').value = a.cf;
            const initials = a.paziente_nome.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase(); document.getElementById('pd-avatar').innerText = initials;
            const parsedData = parseCF(a.cf, state.cityMap);
            if (parsedData) { document.getElementById('pd-dob').value = parsedData.birthDate; document.getElementById('pd-gender').value = parsedData.gender; document.getElementById('pd-gender-display').innerText = parsedData.gender; document.getElementById('pd-age').value = `${parsedData.age} anni`; document.getElementById('pd-birthplace').value = parsedData.cityName; } 
            else { document.getElementById('pd-dob').value = "N/D"; document.getElementById('pd-gender').value = "Maschio"; document.getElementById('pd-gender-display').innerText = "Maschio"; document.getElementById('pd-age').value = "--"; document.getElementById('pd-birthplace').value = "N/D"; }
            const resValue = titleCaseAddress([a.indirizzo, a.citta].filter(Boolean).join(' - ') || "Non Specificato");
            const addrInput = document.getElementById('pd-address');
            if (addrInput) addrInput.value = resValue;
            document.getElementById('pd-phone').value = a.telefono || "Non Specificato"; document.getElementById('pd-email').value = a.email || "Non Specificato";
            toggleModal('patient-details-modal', true); lucide.createIcons();
        }
        function toggleEditPatient({ silent = false } = {}) {
            state.isEditingPatient = !state.isEditingPatient; const inputs = document.querySelectorAll('#patient-details-modal input'); const customSelects = document.querySelectorAll('#patient-details-modal .custom-select-container'); const icon = document.getElementById('pd-edit-icon'); const saveBtn = document.getElementById('pd-save-btn');
            inputs.forEach(input => { if (state.isEditingPatient) { input.removeAttribute('readonly'); input.classList.remove('bg-transparent', 'border-transparent'); input.classList.add('bg-slate-50', 'border-slate-200'); } else { input.setAttribute('readonly', 'true'); input.classList.add('bg-transparent', 'border-transparent'); input.classList.remove('bg-slate-50', 'border-slate-200'); } });
            customSelects.forEach(sel => { const trigger = sel.querySelector('.custom-select-trigger'); if (state.isEditingPatient) { sel.classList.remove('disabled'); trigger.classList.remove('bg-transparent', 'border-transparent'); trigger.classList.add('bg-slate-50', 'border-slate-200'); } else { sel.classList.add('disabled'); trigger.classList.add('bg-transparent', 'border-transparent'); trigger.classList.remove('bg-slate-50', 'border-slate-200'); } });
            if (state.isEditingPatient) { icon.setAttribute('data-lucide', 'save'); icon.parentElement.classList.add('text-green-400'); icon.parentElement.classList.remove('text-slate-300'); saveBtn.classList.remove('hidden'); } else { icon.setAttribute('data-lucide', 'pen-line'); icon.parentElement.classList.remove('text-green-400'); icon.parentElement.classList.add('text-slate-300'); saveBtn.classList.add('hidden'); if (!silent) { showToast("Dati anagrafici aggiornati"); } } lucide.createIcons();
        }

        async function savePatientDetails() {
            const idText = document.getElementById('pd-id').innerText || '';
            const id = parseInt(idText.replace('ID:','').trim(), 10);
            const existing = state.appointments.find(x => x.id === id);
            if (!existing) { showToast('Paziente non trovato'); return; }

            const cleanField = (val, placeholder = '') => {
                const trimmed = (val || '').trim();
                if (!trimmed || trimmed === placeholder) return null;
                return trimmed;
            };

            const payload = {
                paziente_nome: cleanField(document.getElementById('pd-name').value),
                cf: cleanField(document.getElementById('pd-cf').value),
                indirizzo: cleanField(document.getElementById('pd-address').value, 'Non Specificato'),
                citta: null,
                telefono: cleanField(document.getElementById('pd-phone').value, 'Non Specificato'),
                email: cleanField(document.getElementById('pd-email').value, 'Non Specificato'),
                priorita: existing.priorita,
                stato: existing.stato,
                data_visita: existing.data_visita,
                parametri: existing.parametri,
                dottore: existing.dottore,
            };

            let updated;
            try {
                const saved = await updateAppointmentApi(id, payload, 'PATCH');
                updated = updateAppointment(id, saved);
                // Aggiorna la modale con i valori restituiti dal backend
                document.getElementById('pd-name').value = saved.paziente_nome;
                document.getElementById('pd-cf').value = saved.cf;
                document.getElementById('pd-address').value = titleCaseAddress(saved.indirizzo || '');
                document.getElementById('pd-phone').value = saved.telefono || '';
                document.getElementById('pd-email').value = saved.email || '';
                // Forza sync con backend per avere cf aggiornato e altri campi server-side
                const list = await fetchAppointmentsFromApi();
                setAppointments(list);
                const refreshed = list.find((item) => item.id === id);
                if (refreshed) {
                    updateAppointment(id, refreshed);
                    document.getElementById('pd-name').value = refreshed.paziente_nome;
                    document.getElementById('pd-cf').value = refreshed.cf;
                    document.getElementById('pd-address').value = titleCaseAddress(refreshed.indirizzo || '');
                    document.getElementById('pd-phone').value = refreshed.telefono || '';
                    document.getElementById('pd-email').value = refreshed.email || '';
                }
            } catch (error) {
                console.warn('Patient update failed:', error);
                showToast('Errore aggiornamento anagrafica');
                return;
            }

            if (updated) {
                toggleEditPatient();
                showToast('Anagrafica aggiornata');
                renderTable();
            }
        }

        // Autocomplete indirizzo rimosso: inserimento manuale

        function openVisitModal(id) { const a=state.appointments.find(x=>x.id===id); document.getElementById('visit_assign_id').value=id; document.getElementById('visit-patient-name').innerText=a.paziente_nome; const disp = document.getElementById('visit_specialty_display'); disp.innerText = "Seleziona Reparto..."; disp.classList.remove('text-slate-900'); document.getElementById('visit_specialty').value = ""; const search = document.querySelector('#visit-specialty-container input[type="text"]'); if(search) search.value = ""; toggleModal('visit-assignment-modal', true); lucide.createIcons(); }
        async function confirmVisitAssignment() { 
            const id=parseInt(document.getElementById('visit_assign_id').value); 
            const spec=document.getElementById('visit_specialty').value; 
            if(!spec){ alert("Seleziona un reparto"); return; }
            const payload = { stato:'Richiamo Visita Specialistica', dottore:`Dr. Assegnato (${spec})` };
            let updated;
            try {
                const saved = await updateAppointmentApi(id, payload);
                updated = updateAppointment(id, saved);
            } catch (error) {
                console.warn('Visit assignment offline:', error);
                updated = updateAppointment(id, payload);
                showToast('Backend non raggiungibile, salvataggio locale');
            }
            if(updated){ closeModal('visit-assignment-modal'); renderTable(); showToast(`Richiamo visita specialistica: ${spec}`); }
        }
        function openNewReportModal(id) { 
            const a=state.appointments.find(x=>x.id===id); 
            document.getElementById('nr_id').value=id; 
            document.getElementById('nr-patient-name').innerText=a.paziente_nome; 
            document.getElementById('nr_signature').value=a.dottore; 
            clearFiles(); 
            renderPreviews(); 
            const fields = ['nr_outcome','nr_therapy','nr_signature'];
            fields.forEach((fid) => {
                const el = document.getElementById(fid);
                if (!el) return;
                if (!state.permissions.canReferto) {
                    el.setAttribute('readonly', 'true');
                    el.classList.add('bg-slate-100');
                } else {
                    el.removeAttribute('readonly');
                    el.classList.remove('bg-slate-100');
                }
            });
            const submit = document.querySelector('#new-report-form button[type=\"submit\"]');
            if (submit) submit.classList.toggle('hidden', !state.permissions.canReferto);
            toggleModal('new-report-modal', true); 
        }
        async function updateStatusFromModal(st) { 
            const id=parseInt(document.getElementById('nr_id').value); 
            let updated;
            try {
                const saved = await updateAppointmentApi(id, { stato: st });
                updated = updateAppointment(id, saved);
            } catch (error) {
                console.warn('Status update offline:', error);
                updated = updateAppointment(id, { stato: st });
                showToast('Backend non raggiungibile, salvataggio locale');
            }
            if(updated){ closeModal('new-report-modal'); renderTable(); showToast('Stato: '+st); } 
        }
        async function handleNewReportSubmit(e) { 
            e.preventDefault(); 
            if (!state.permissions.canReferto) { showToast('Non puoi refertare con il tuo ruolo'); return; }
            const id=parseInt(document.getElementById('nr_id').value); 
            const payload = { referto: { esito:document.getElementById('nr_outcome').value, terapia:document.getElementById('nr_therapy').value, allegati:[...state.currentFiles] }, stato: 'Refertato' };
            let updated;
            try {
                const saved = await updateAppointmentApi(id, payload);
                updated = updateAppointment(id, saved);
            } catch (error) {
                console.warn('Report save offline:', error);
                updated = updateAppointment(id, payload);
                showToast('Backend non raggiungibile, salvataggio locale');
            }
            if(updated){ closeModal('new-report-modal'); filterTable('all'); showToast('Referto salvato'); } 
        }

        function generateDocumentTemplate(title, patient, contentHtml, footerHtml) {
            const safe = sanitizeAppointment(patient);
            const today = new Date().toLocaleDateString('it-IT');
            const now = new Date().toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'});
            return `
                <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6"><div class="flex items-center gap-4"><div class="h-16 w-16 bg-slate-900 text-white flex items-center justify-center rounded"><i data-lucide="activity" class="w-10 h-10"></i></div><div><h1 class="text-2xl font-serif font-bold text-slate-900 uppercase leading-none">SaluteFacile</h1><p class="text-sm font-serif text-slate-600">Azienda Ospedaliera Regionale</p><p class="text-xs uppercase tracking-widest text-slate-500 mt-1">Dipartimento di Emergenza e Accettazione</p></div></div><div class="text-right"><h2 class="text-xl font-bold uppercase text-slate-800">${escapeHtml(title)}</h2><p class="text-sm font-mono text-slate-500">ID Prat: ${escapeHtml(patient.id)}</p><p class="text-xs text-slate-400 mt-1">Stampato: ${today} ${now}</p></div></div>
                <div class="mb-6 border border-slate-300 rounded bg-slate-50 p-4"><h3 class="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-200 pb-1">Anagrafica Paziente</h3><div class="grid grid-cols-2 gap-4 text-sm"><div><span class="block text-[10px] uppercase text-slate-400">Paziente</span><span class="font-bold text-lg text-slate-900 block">${safe.safeName}</span></div><div><span class="block text-[10px] uppercase text-slate-400">Codice Fiscale</span><span class="font-mono font-bold text-slate-800 tracking-wider">${safe.safeCf}</span></div><div><span class="block text-[10px] uppercase text-slate-400">Data e Luogo di Nascita</span><span class="text-slate-700">${escapeHtml(parseCF(patient.cf, state.cityMap)?.birthDate || '--')} - ${escapeHtml(parseCF(patient.cf, state.cityMap)?.cityName || '--')}</span></div><div><span class="block text-[10px] uppercase text-slate-400">Residenza</span><span class="text-slate-700">${safe.safeIndirizzo} - ${safe.safeCitta}</span></div></div></div>
                <div class="mb-8">${contentHtml}</div>
                <div class="mt-auto pt-12 flex justify-between items-end border-t border-slate-200"><div class="text-xs text-slate-400 italic">Documento generato digitalmente da SaluteFacile PS Management.<br>Valido agli effetti di legge.</div>${footerHtml}</div>`;
        }

        function openOutcomeModal(id, type) {
            const a = state.appointments.find(x => x.id === id); if(!a) return; state.outcomeId = id; state.outcomeType = type;
            const safe = sanitizeAppointment(a);
            const pMap = { 'red': 'ROSSO', 'orange': 'ARANCIONE', 'green': 'VERDE', 'white': 'BIANCO' }; const title = (type === 'ricovero') ? "VERBALE DI RICOVERO DA PS" : "VERBALE DI DIMISSIONE";
            const triageSection = `<div class="mb-6"><h3 class="text-sm font-bold text-slate-900 uppercase mb-2 border-b-2 border-slate-100 pb-1">Dati Triage & Ingresso</h3><div class="grid grid-cols-4 gap-4 text-sm mb-2"><div><span class="text-[10px] text-slate-400 block">Data/Ora Ingresso</span><span class="font-mono">${escapeHtml(new Date(a.data_visita).toLocaleString())}</span></div><div><span class="text-[10px] text-slate-400 block">Codice Priorità</span><span class="font-bold uppercase">${escapeHtml(pMap[a.priorita] || 'N/A')}</span></div><div class="col-span-2"><span class="text-[10px] text-slate-400 block">Parametri Vitali</span><span class="font-mono">${safe.safeParametri}</span></div></div></div>`;
            const visitSection = `<div class="mb-6"><h3 class="text-sm font-bold text-slate-900 uppercase mb-2 border-b-2 border-slate-100 pb-1">Referto Medico</h3><div class="space-y-4"><div><span class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Esame Obiettivo & Diagnosi</span><div class="text-sm text-slate-900 bg-slate-50 p-3 rounded border border-slate-100 italic min-h-[60px]">${safe.safeRefertoEsito}</div></div><div><span class="text-[10px] font-bold text-slate-500 uppercase block mb-1">Terapia / Prescrizioni</span><div class="text-sm text-slate-900">${safe.safeRefertoTerapia}</div></div></div></div>`;
            let outcomeSection = ''; let footerSection = '';
            if (type === 'ricovero') {
                const opts = constants.departmentsList.map(d => `<div data-action="select-option" data-select="discharge-dept-container" data-value="${d.name}" data-display="${d.name}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"><div class="w-8 h-8 rounded-full bg-${d.color}-100 text-${d.color}-600 flex items-center justify-center group-hover:bg-${d.color}-600 group-hover:text-white transition-colors"><i data-lucide="${d.icon}" class="w-4 h-4"></i></div><span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">${escapeHtml(d.name)}</span></div>`).join('');
                outcomeSection = `<div class="bg-red-50 border border-red-100 p-4 rounded mb-6 print:border-black print:bg-white print:border-2"><h3 class="text-sm font-bold text-red-800 uppercase mb-3 print:text-black">Disposizione di Ricovero</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="no-print"><span class="text-xs font-bold text-red-600 uppercase block mb-1">Seleziona Reparto</span><div class="relative custom-select-container" id="discharge-dept-container"><input type="hidden" id="discharge_dept_select" value=""><button type="button" data-action="toggle-select" data-select="discharge-dept-container" class="custom-select-trigger w-full flex items-center justify-between px-4 py-3 bg-white border border-red-200 rounded-xl text-slate-700 font-medium hover:border-red-400 focus:ring-2 focus:ring-red-500 transition-all shadow-sm"><span class="flex items-center gap-3"><span class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i data-lucide="building" class="w-4 h-4"></i></span><span id="discharge_dept_display" class="text-sm">Seleziona Reparto...</span></span><i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 chevron transition-transform duration-200"></i></button><div class="custom-select-options bg-white rounded-xl mt-2 p-1 shadow-xl border border-slate-200"><div class="p-2 border-b border-slate-100 sticky top-0 bg-white z-10"><div class="relative"><i data-lucide="search" class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400"></i><input type="text" placeholder="Cerca..." data-role="custom-select-search" data-select="discharge-dept-container" data-action="stop-propagation" class="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"></div></div><div class="custom-options-list">${opts}</div></div></div></div><div class="hidden print:block"><span class="text-sm font-bold">Reparto di Destinazione:</span><div class="border-b border-dotted border-black w-full h-8 mt-2"></div></div></div></div>`;
                footerSection = `<div class="text-center shrink-0"><p class="text-sm font-bold text-slate-900 mb-8">${safe.safeDottore}</p><div class="h-px bg-slate-400 w-48 mx-auto mb-1"></div><p class="text-[10px] text-slate-400 italic">Firma del Medico Accettante</p></div>`;
                document.getElementById('btn-confirm-discharge').innerText = "Conferma Ricovero"; document.getElementById('btn-confirm-discharge').className = "bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2";
            } else {
                outcomeSection = `<div class="bg-green-50 border border-green-100 p-4 rounded mb-6 print:bg-white print:border-black print:border-2"><h3 class="text-sm font-bold text-green-800 uppercase mb-2 print:text-black">Esito: Dimissione a Domicilio</h3><p class="text-sm text-slate-700">Il paziente viene dimesso con affidamento al Medico Curante.</p>${a.priorita === 'white' ? '<div class="mt-3 text-xs font-bold text-slate-600 border border-slate-300 p-2 inline-block">⚠️ PRESTAZIONE SOGGETTA A TICKET</div>' : ''}</div>`;
                footerSection = `<div class="text-center shrink-0"><p class="text-sm font-bold text-slate-900 mb-8">${safe.safeDottore}</p><div class="h-px bg-slate-400 w-48 mx-auto mb-1"></div><p class="text-[10px] text-slate-400 italic">Firma del Medico Dimettente</p></div>`;
                document.getElementById('btn-confirm-discharge').innerText = "Conferma Dimissione"; document.getElementById('btn-confirm-discharge').className = "bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2";
            }
            document.getElementById('discharge-content').innerHTML = generateDocumentTemplate(title, a, triageSection + visitSection + outcomeSection, footerSection);
            toggleModal('discharge-modal', true); lucide.createIcons();
        }

        function openReport(id) {
            const a = state.appointments.find(x => x.id === id); if(!a || !a.referto) return;
            const safe = sanitizeAppointment(a);
            const pMap = { 'red': 'ROSSO', 'orange': 'ARANCIONE', 'green': 'VERDE', 'white': 'BIANCO' };
            const title = "COPIA REFERTO DI PRONTO SOCCORSO";
            const contentHtml = `<div class="mb-6"><h3 class="text-sm font-bold text-slate-900 uppercase mb-2 border-b-2 border-slate-100 pb-1">Dati Triage</h3><div class="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-2 rounded print:bg-white print:border print:border-gray-200"><div><span class="text-[10px] text-slate-400 block">Codice</span><span class="font-bold uppercase">${escapeHtml(pMap[a.priorita])}</span></div><div class="col-span-2"><span class="text-[10px] text-slate-400 block">Note Triage</span><span>${safe.safeParametri}</span></div></div></div><div class="mb-6"><h3 class="text-sm font-bold text-slate-900 uppercase mb-2 border-b-2 border-slate-100 pb-1">Dettaglio Clinico</h3><div class="space-y-4"><div><span class="text-xs font-bold text-slate-500 uppercase">Diagnosi / Esito</span><p class="text-sm text-slate-900 mt-1">${safe.safeRefertoEsito}</p></div><div><span class="text-xs font-bold text-slate-500 uppercase">Terapia Prescritta</span><p class="text-sm text-slate-900 mt-1">${safe.safeRefertoTerapia}</p></div></div></div><div class="mt-8 border-t border-slate-200 pt-4"><p class="text-sm"><strong>Stato attuale pratica:</strong> ${safe.safeStato}</p></div>`;
            const footerHtml = `<div class="text-center shrink-0"><p class="text-sm font-bold text-slate-900 mb-8">${safe.safeDottore}</p><div class="h-px bg-slate-400 w-48 mx-auto mb-1"></div><p class="text-[10px] text-slate-400 italic">Firma del Medico</p></div>`;
            document.getElementById('report-content').innerHTML = generateDocumentTemplate(title, a, contentHtml, footerHtml);
            toggleModal('report-modal', true); lucide.createIcons();
        }

        function toggleModal(id, show) { const m=document.getElementById(id); const b=document.getElementById('modal-backdrop'); if(show){ b.classList.remove('hidden'); m.classList.remove('hidden'); setTimeout(()=>{b.classList.remove('opacity-0'); m.querySelector('div').classList.add('scale-100');},10); } else { b.classList.add('opacity-0'); m.querySelector('div').classList.remove('scale-100'); setTimeout(()=>{m.classList.add('hidden'); b.classList.add('hidden');},300); } }
        function closeModal(id) { toggleModal(id, false); }
        function showToast(m) { const t=document.createElement('div'); t.className="bg-slate-800 text-white px-4 py-2 rounded fixed bottom-4 right-4 z-50 shadow"; t.innerText=m; document.body.appendChild(t); setTimeout(()=>t.remove(),3000); }
        function showAssignment(id) {
            const a = state.appointments.find(x => x.id === id);
            if (!a) return;
            if (a.doctor_department) {
                showToast(`Specialista: ${a.dottore || 'N/D'} (${a.doctor_department})`);
            } else {
                const operator = a.dottore || state.user?.name || 'Operatore PS';
                showToast(`Pronto Soccorso: ${operator}`);
            }
        }
        
        async function confirmOutcome() {
            let payload = { stato: 'Dimesso' };
            if (state.outcomeType === 'ricovero') {
                const dept = document.getElementById('discharge_dept_select').value;
                if(!dept) { alert("Seleziona un reparto"); return; }
                payload = { stato: 'Ricoverato' };
                showToast(`Ricovero in ${dept}`);
            } else {
                showToast('Paziente dimesso');
            }

            let updated;
            try {
                const saved = await updateAppointmentApi(state.outcomeId, payload);
                updated = updateAppointment(state.outcomeId, saved);
            } catch (error) {
                console.warn('Outcome update offline:', error);
                updated = updateAppointment(state.outcomeId, payload);
                showToast('Backend non raggiungibile, salvataggio locale');
            }

            if (updated) {
                closeModal('discharge-modal');
                filterTable('all');
                updateKPIs();
            }
        }

export function registerGlobalHandlers() {
    Object.assign(window, {
        closeAllCustomSelects,
        handleUnlock,
        togglePrivacy,
        openBookingModal,
        toggleKPICard,
        openStatsModal,
        filterTable,
        sortTable,
        handleSearch,
        handleBooking,
        openTriageModal,
        handleTriageSubmit,
        openPatientDetails,
        toggleEditPatient,
        openVisitModal,
        confirmVisitAssignment,
        openNewReportModal,
        updateStatusFromModal,
        handleNewReportSubmit,
        openOutcomeModal,
        openReport,
        openInvestigationsModal,
        toggleModal,
        closeModal,
        showToast,
        removeAttachment,
        confirmOutcome,
        filterCustomOptions,
        filterExams,
        toggleCustomSelect,
        selectCustomOption,
        copyToClipboard,
        handleFileSelect
    });
}
