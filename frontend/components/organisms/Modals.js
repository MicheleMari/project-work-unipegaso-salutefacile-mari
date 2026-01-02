import { modalHeader } from '../molecules/ModalHeader.js';

export const modals = () => `
<!-- === MODALI === -->

    <!-- STATS MODAL -->
    <div id="stats-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-xl w-full max-w-4xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] transform scale-95 transition-all">
            <div class="bg-slate-800 p-6 flex justify-between items-center shrink-0 rounded-t-xl text-white">
                <div><h3 class="text-xl font-bold">Statistiche Giornaliere</h3><p class="text-slate-400 text-sm">Analisi flusso pazienti Pronto Soccorso</p></div>
                <button data-action="close-modal" data-modal="stats-modal" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <div class="p-6 bg-slate-50 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Distribution by Code -->
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 class="text-sm font-bold text-slate-800 uppercase mb-4">Accessi per Codice</h4>
                        <div id="stats-codes-chart" class="space-y-3">
                            <!-- Populated by JS -->
                        </div>
                    </div>

                    <!-- Outcome Distribution -->
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h4 class="text-sm font-bold text-slate-800 uppercase mb-4">Esiti Clinici</h4>
                        <div class="flex items-center justify-center h-48 gap-8">
                            <div class="text-center">
                                <div class="text-3xl font-bold text-green-600 mb-1" id="stats-discharged">0</div>
                                <div class="text-xs uppercase font-bold text-slate-400">Dimissioni</div>
                            </div>
                            <div class="w-px h-24 bg-slate-200"></div>
                            <div class="text-center">
                                <div class="text-3xl font-bold text-red-600 mb-1" id="stats-admitted">0</div>
                                <div class="text-xs uppercase font-bold text-slate-400">Ricoveri</div>
                            </div>
                        </div>
                        <div class="text-center mt-4">
                            <span class="text-xs text-slate-500">Tasso di Ricovero: <strong id="stats-admission-rate">0%</strong></span>
                        </div>
                    </div>

                    <!-- Top Departments -->
                    <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                        <h4 class="text-sm font-bold text-slate-800 uppercase mb-4">Reparti più Sollecitati (Ricoveri/Consulenze)</h4>
                        <div id="stats-departments-list" class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <!-- Populated by JS -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 0. NUOVA MODALE ANAGRAFICA PAZIENTE -->
    <div id="patient-details-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col transform scale-95 transition-all">
            <div class="bg-slate-700 p-6 flex justify-between items-center shrink-0 rounded-t-xl text-white">
                <div><h3 class="text-xl font-bold">Anagrafica Paziente</h3><p class="text-slate-300 text-xs">Dettagli amministrativi</p></div>
                <div class="flex items-center gap-2">
                    <button data-action="toggle-edit-patient" class="p-2 text-slate-300 hover:text-white hover:bg-slate-600 rounded-full transition-all" title="Modifica Dati">
                        <i id="pd-edit-icon" data-lucide="pen-line" class="w-5 h-5"></i>
                    </button>
                    <button data-action="close-modal" data-modal="patient-details-modal" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                </div>
            </div>
            <div class="p-6 bg-white rounded-b-xl space-y-6 overflow-y-auto max-h-[80vh]">
                <!-- Intestazione con Avatar e Nome Editabile -->
                <div class="flex items-center gap-4 border-b border-slate-100 pb-6">
                    <div id="pd-avatar" class="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-2xl font-bold border-2 border-white shadow-sm shrink-0 sensitive-data">
                        <!-- Initials via JS -->
                    </div>
                    <div class="w-full">
                        <label class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nominativo</label>
                        <input type="text" id="pd-name" readonly class="block w-full text-2xl font-bold text-slate-900 bg-transparent border-b-2 border-transparent focus:border-medical-500 focus:outline-none transition-all placeholder-slate-300 sensitive-data" placeholder="Nome Cognome">
                        <span id="pd-id" class="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded mt-1 inline-block">ID: --</span>
                    </div>
                </div>

                <!-- Griglia Dati -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                    <div class="col-span-1 sm:col-span-2">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Codice Fiscale</label>
                        <div class="flex items-center gap-2">
                            <input type="text" id="pd-cf" readonly class="block w-full px-3 py-2 bg-transparent border border-transparent rounded-lg font-mono text-slate-800 font-bold tracking-wide text-lg focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all sensitive-data">
                            <button data-action="copy-cf" data-target="pd-cf" class="p-2 text-slate-400 hover:text-medical-600 hover:bg-slate-50 rounded-lg transition-colors shrink-0" title="Copia"><i data-lucide="copy" class="w-4 h-4"></i></button>
                        </div>
                    </div>

                    <div class="field-container">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Data di Nascita</label>
                        <div class="relative">
                            <i data-lucide="calendar" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                            <input type="text" id="pd-dob" readonly class="block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all sensitive-data">
                        </div>
                    </div>

                    <div class="field-container">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sesso</label>
                        <div class="relative custom-select-container disabled" id="pd-gender-container">
                            <i data-lucide="user" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400 z-10 pointer-events-none"></i>
                            <input type="hidden" id="pd-gender" value="Maschio">
                            <button type="button" data-action="toggle-select" data-select="pd-gender-container" class="custom-select-trigger block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium text-left focus:outline-none transition-all flex justify-between items-center" aria-expanded="false">
                                <span id="pd-gender-display">Maschio</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 chevron transition-transform duration-200 ml-2"></i>
                            </button>
                            <div class="custom-select-options bg-white rounded-xl mt-2 p-1 border border-slate-200 shadow-lg hidden">
                                <div class="custom-options-list">
                                    <div data-action="select-option" data-select="pd-gender-container" data-value="Maschio" data-display="Maschio" class="p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-sm font-medium text-slate-700">Maschio</div>
                                    <div data-action="select-option" data-select="pd-gender-container" data-value="Femmina" data-display="Femmina" class="p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors text-sm font-medium text-slate-700">Femmina</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="field-container">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Età</label>
                        <div class="relative">
                            <i data-lucide="hourglass" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                            <input type="text" id="pd-age" readonly class="block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all">
                        </div>
                    </div>

                    <div class="field-container">
                         <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Comune Nascita</label>
                         <div class="relative">
                            <i data-lucide="map-pin" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                            <input type="text" id="pd-birthplace" readonly class="block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all sensitive-data">
                        </div>
                    </div>

                    <div class="col-span-1 sm:col-span-2 border-t border-slate-100 pt-4 mt-2 space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div class="sm:col-span-1">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Telefono</label>
                                <div class="relative">
                                    <i data-lucide="phone" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                                    <input type="text" id="pd-phone" readonly value="+39 333 1234567" class="block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all sensitive-data">
                                </div>
                            </div>
                            <div class="sm:col-span-2">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                                <div class="relative">
                                    <i data-lucide="mail" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                                    <input type="text" id="pd-email" readonly value="email@esempio.it" class="block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all sensitive-data">
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Residenza</label>
                            <div class="relative">
                                <i data-lucide="home" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                                <input type="text" id="pd-address" readonly value="Via Roma, 10 - 00100 Roma (RM)" class="block w-full pl-9 pr-3 py-2 bg-transparent border border-transparent rounded-lg text-slate-800 font-medium focus:bg-slate-50 focus:border-medical-500 focus:ring-2 focus:ring-medical-200 outline-none transition-all sensitive-data" autocomplete="off">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="pt-6 flex justify-end gap-3">
                    <button data-action="close-modal" data-modal="patient-details-modal" class="text-slate-500 hover:bg-slate-100 px-4 py-2.5 rounded-lg text-sm font-bold">Chiudi</button>
                    <button id="pd-save-btn" data-action="save-patient" style="background-color:#0284c7;color:#fff;" class="hidden bg-medical-600 hover:bg-medical-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all">Salva Modifiche</button>
                </div>
            </div>
        </div>
    </div>

    <!-- ... existing modals (1, 2, Visit Assignment, Report, Discharge, Report View) ... -->
    <!-- 1. NUOVA ACCETTAZIONE -->
    <div id="modal-backdrop" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 hidden transition-opacity opacity-0 no-print"></div>
    <div id="booking-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 flex flex-col max-h-[95vh] transform scale-95 transition-all">
            ${modalHeader({
                title: 'Nuovo Accesso',
                subtitle: 'Registrazione anagrafica al Triage',
                containerClass: 'bg-slate-800 p-6 flex justify-between items-start shrink-0 rounded-t-xl text-white',
                subtitleClass: 'text-slate-300 text-xs',
                closeClass: 'text-slate-300 hover:text-white',
                closeModalId: 'booking-modal'
            })}
            <form id="booking-form" data-role="booking-form" class="p-6 space-y-5 overflow-y-auto bg-white rounded-b-xl">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="space-y-1"><label class="block text-sm font-medium text-slate-700">Nome</label><input type="text" id="p_name" required class="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"></div>
                    <div class="space-y-1"><label class="block text-sm font-medium text-slate-700">Cognome</label><input type="text" id="p_surname" required class="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"></div>
                </div>
                <div class="space-y-1"><label class="block text-sm font-medium text-slate-700">Codice Fiscale</label><input type="text" id="p_cf" class="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none font-mono uppercase"></div>
                <div>
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Codice Priorità</h4>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer block relative group">
                            <input type="radio" name="booking_priority" value="red" class="peer sr-only">
                            <div class="p-3 rounded-lg border-2 border-slate-100 flex items-center gap-3 transition-all peer-checked:border-red-600 peer-checked:bg-red-50 peer-checked:shadow-md peer-checked:scale-[1.02]">
                                <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center"><i data-lucide="siren" class="w-4 h-4"></i></div>
                                <span class="font-bold text-slate-800">Rosso <span class="text-xs font-normal text-slate-500 block">Emergenza</span></span>
                            </div>
                        </label>
                        <label class="cursor-pointer block relative group">
                            <input type="radio" name="booking_priority" value="orange" class="peer sr-only">
                            <div class="p-3 rounded-lg border-2 border-slate-100 flex items-center gap-3 transition-all peer-checked:border-orange-500 peer-checked:bg-orange-50 peer-checked:shadow-md peer-checked:scale-[1.02]">
                                <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><i data-lucide="flame" class="w-4 h-4"></i></div>
                                <span class="font-bold text-slate-800">Arancione <span class="text-xs font-normal text-slate-500 block">Indifferibile</span></span>
                            </div>
                        </label>
                        <label class="cursor-pointer block relative group">
                            <input type="radio" name="booking_priority" value="green" class="peer sr-only" checked>
                            <div class="p-3 rounded-lg border-2 border-slate-100 flex items-center gap-3 transition-all peer-checked:border-green-600 peer-checked:bg-green-50 peer-checked:shadow-md peer-checked:scale-[1.02]">
                                <div class="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><i data-lucide="check-circle" class="w-4 h-4"></i></div>
                                <span class="font-bold text-slate-800">Verde <span class="text-xs font-normal text-slate-500 block">Urgenza Minore</span></span>
                            </div>
                        </label>
                        <label class="cursor-pointer block relative group">
                            <input type="radio" name="booking_priority" value="white" class="peer sr-only">
                            <div class="p-3 rounded-lg border-2 border-slate-100 flex items-center gap-3 transition-all peer-checked:border-slate-400 peer-checked:bg-slate-100 peer-checked:shadow-md peer-checked:scale-[1.02]">
                                <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center"><i data-lucide="user" class="w-4 h-4"></i></div>
                                <span class="font-bold text-slate-800">Bianco <span class="text-xs font-normal text-slate-500 block">Non Urgente</span></span>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="space-y-1"><label class="block text-sm font-medium text-slate-700">Motivo Accesso (Sintomi)</label><textarea id="p_reason" rows="2" class="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-medical-500 outline-none"></textarea></div>
                <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" data-action="close-modal" data-modal="booking-modal" class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Annulla</button>
                    <button type="submit" style="background: linear-gradient(135deg, #0369a1, #0284c7); color: #fff;" class="bg-medical-700 hover:bg-medical-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg border border-medical-800/60 w-full sm:w-auto sf-primary-btn">Registra</button>
                </div>
            </form>
        </div>
    </div>

    <!-- 2. FASE 1: TRIAGE -->
    <div id="triage-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-xl w-full max-w-2xl border border-slate-200 flex flex-col max-h-[90vh] transform scale-95 transition-all">
            ${modalHeader({
                title: 'Accertamenti Preventivi',
                subtitle: 'Paziente: <span id=\"triage-patient-name\" class=\"text-white font-medium sensitive-data\">--</span>',
                containerClass: 'bg-slate-800 p-6 flex justify-between items-center shrink-0 rounded-t-xl text-white',
                subtitleClass: 'text-slate-400 text-sm',
                closeClass: 'text-slate-400 hover:text-white',
                closeModalId: 'triage-modal'
            })}
            <form id="triage-form" data-role="triage-form" class="p-6 space-y-6 overflow-y-auto bg-white rounded-b-xl">
                <input type="hidden" id="triage_id">
                
                <div>
                    <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primi Accertamenti</h4>
                    <div class="relative mb-3">
                        <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i>
                        <input type="text" data-role="exams-search" placeholder="Cerca esame..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medical-500">
                    </div>
                    <div id="investigations-list" class="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                        <div class="col-span-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                            Caricamento accertamenti...
                        </div>
                    </div>
                </div>
                
                <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" data-action="close-modal" data-modal="triage-modal" class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Annulla</button>
                    <button type="submit" class="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg">Conferma</button>
                </div>
            </form>
        </div>
    </div>

    <!-- VISIT ASSIGNMENT MODAL -->
    <div id="visit-assignment-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col transform scale-95 transition-all">
            <div class="bg-amber-500 p-6 flex justify-between items-start shrink-0 rounded-t-xl text-white">
                <div><h3 class="text-xl font-bold">Assegnazione Visita</h3><p class="text-amber-100 text-xs">Paziente in attesa</p></div>
                <button data-action="close-modal" data-modal="visit-assignment-modal" class="text-white/80 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <div class="p-6 space-y-4 bg-white rounded-b-xl">
                <input type="hidden" id="visit_assign_id">
                <p class="text-sm text-slate-600">Seleziona l'ambulatorio o la specialità a cui assegnare il paziente <strong id="visit-patient-name" class="sensitive-data"></strong>.</p>
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Reparto/Specialità</label>
                    
                    <!-- CUSTOM SELECT COMPONENT -->
                    <div class="relative custom-select-container" id="visit-specialty-container">
                        <input type="hidden" id="visit_specialty" value="">
                        <!-- Trigger Button -->
                        <button type="button" data-action="toggle-select" data-select="visit-specialty-container" class="custom-select-trigger w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-white hover:border-amber-300 focus:ring-2 focus:ring-amber-500 transition-all shadow-sm">
                            <span class="flex items-center gap-3">
                                <span class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center"><i data-lucide="stethoscope" class="w-4 h-4"></i></span>
                                <span id="visit_specialty_display" class="text-sm">Seleziona Reparto...</span>
                            </span>
                            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 chevron transition-transform duration-200"></i>
                        </button>
                        <!-- Dropdown Options -->
                        <div class="custom-select-options bg-white rounded-xl mt-2 p-1">
                            <!-- SEARCH BAR -->
                            <div class="p-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                                <div class="relative">
                                    <i data-lucide="search" class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400"></i>
                                    <input type="text" placeholder="Cerca..." data-role="custom-select-search" data-select="visit-specialty-container" data-action="stop-propagation" class="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                                </div>
                            </div>
                            <!-- Options List -->
                            <div class="custom-options-list">
                                <div data-action="select-option" data-select="visit-specialty-container" data-value="Medicina Generale PS" data-display="Medicina Generale PS" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors"><i data-lucide="activity" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Medicina Generale PS</span>
                                </div>
                                <div data-action="select-option" data-select="visit-specialty-container" data-value="Cardiologia" data-display="Cardiologia" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <div class="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors"><i data-lucide="heart-pulse" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Cardiologia</span>
                                </div>
                                <div data-action="select-option" data-select="visit-specialty-container" data-value="Chirurgia Generale" data-display="Chirurgia Generale" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors"><i data-lucide="scissors" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Chirurgia Generale</span>
                                </div>
                                <div data-action="select-option" data-select="visit-specialty-container" data-value="Ortopedia" data-display="Ortopedia" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors"><i data-lucide="bone" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Ortopedia</span>
                                </div>
                                <div data-action="select-option" data-select="visit-specialty-container" data-value="Neurologia" data-display="Neurologia" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors"><i data-lucide="brain" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Neurologia</span>
                                </div>
                                 <div data-action="select-option" data-select="visit-specialty-container" data-value="Pediatria" data-display="Pediatria" class="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                                    <div class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors"><i data-lucide="baby" class="w-4 h-4"></i></div>
                                    <span class="text-sm font-medium text-slate-700 group-hover:text-slate-900">Pediatria</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
                <div class="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" data-action="close-modal" data-modal="visit-assignment-modal" class="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium">Annulla</button>
                    <button type="button" data-action="confirm-visit" class="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg">Assegna</button>
                </div>
            </div>
        </div>
    </div>

    <!-- 3. FASE 2 & 3: REFERTO/VISITA -->
    <div id="new-report-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-xl w-full max-w-4xl border border-slate-200 flex flex-col max-h-[95vh] h-full sm:h-auto transform scale-95 transition-all">
            <div class="bg-slate-800 p-6 flex justify-between items-center shrink-0 rounded-t-xl text-white">
                <div><h3 class="text-xl font-bold">Gestione Clinica & Referto</h3><p class="text-slate-400 text-sm">Paziente: <span id="nr-patient-name" class="text-white font-medium sensitive-data">--</span></p></div>
                <button data-action="close-modal" data-modal="new-report-modal" class="text-slate-400 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <form id="new-report-form" data-role="new-report-form" class="flex-1 overflow-y-auto flex flex-col bg-white">
                <input type="hidden" id="nr_id">
                <div class="p-6 space-y-6 flex-1">
                    <div><h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Esito / Diario Clinico</h4><textarea id="nr_outcome" required rows="4" class="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Descrivere diagnosi..."></textarea></div>
                    <div><h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Terapia Somministrata/Prescritta</h4><textarea id="nr_therapy" required rows="3" class="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Farmaci somministrati..."></textarea></div>
                    <div><h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Esami & Consulenze</h4>
                        <div id="drop-zone" class="drop-zone border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50" data-action="trigger-file-upload">
                            <i data-lucide="cloud-upload" class="w-8 h-8 text-slate-400 mb-2"></i><p class="text-sm text-slate-700">Clicca o trascina qui referti</p><input type="file" id="file-upload" class="hidden" multiple data-role="file-upload-input">
                        </div>
                        <div id="attachments-preview-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 empty:hidden"></div>
                    </div>
                </div>
                <div class="bg-slate-50 p-6 border-t border-slate-200 mt-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div class="w-full sm:w-1/2"><label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Medico</label><div class="relative"><i data-lucide="pen-tool" class="absolute left-3 top-2.5 w-4 h-4 text-slate-400"></i><input type="text" id="nr_signature" readonly class="bg-white border border-slate-200 text-slate-800 text-sm rounded-lg block w-full pl-10 p-2.5 font-serif italic font-bold"></div></div>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button type="button" data-action="update-status" data-status="Attesa Referto Specialistico" class="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2.5 rounded-lg text-sm font-bold border border-amber-200">Attesa Referto Spec.</button>
                        <button type="button" data-action="update-status" data-status="Valutazione Ulteriori Visite" class="bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-700 px-4 py-2.5 rounded-lg text-sm font-bold border border-fuchsia-200">Valutare altre visite</button>
                        <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2"><i data-lucide="save" class="w-4 h-4"></i> Chiudi Referto</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- 4. FASE 4: ESITO (DIMISSIONE/RICOVERO) -->
    <div id="discharge-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none">
        <div class="pointer-events-auto bg-white rounded-none w-full max-w-4xl shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto paper-shadow flex flex-col transform scale-95 transition-all">
            <div id="discharge-content" class="document-paper bg-white p-8"></div>
            <div class="bg-slate-100 p-6 border-t border-slate-200 flex justify-between items-center shrink-0 no-print modal-footer">
                <button data-action="close-modal" data-modal="discharge-modal" class="px-6 py-2.5 text-slate-600 hover:bg-white rounded-lg text-sm font-bold border border-transparent hover:border-slate-300">Indietro</button>
                <div class="flex gap-3"><button data-action="print-report" class="bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"><i data-lucide="printer" class="w-4 h-4"></i> Stampa</button><button id="btn-confirm-discharge" data-action="confirm-outcome" class="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2">Conferma Uscita</button></div>
            </div>
        </div>
    </div>

    <!-- Modale Semplice Visualizza Referto (Read Only) -->
    <div id="report-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden pointer-events-none no-print">
        <div class="pointer-events-auto bg-white rounded-none w-full max-w-3xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto transform scale-95 transition-all">
            <div class="p-6 border-b border-slate-200 bg-slate-50 flex justify-between no-print"><h2 class="font-serif font-bold text-xl">Visualizza Referto</h2><button data-action="close-modal" data-modal="report-modal" class="text-slate-400 modal-close-btn"><i data-lucide="x" class="w-6 h-6"></i></button></div>
            <div id="report-content" class="p-8 space-y-4 document-paper bg-white"></div>
            <div class="p-6 bg-slate-50 border-t flex justify-end no-print modal-footer"><button data-action="print-report" class="bg-medical-700 text-white px-4 py-2 rounded text-sm font-bold flex gap-2"><i data-lucide="printer" class="w-4 h-4"></i> Stampa</button></div>
        </div>
    </div>

    <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 no-print"></div>
`;
