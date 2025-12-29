const API_BASE = window.API_BASE || 'http://127.0.0.1:8000/api';
const RESOURCE = '/ps/encounters';

function authHeaders() {
    const token = window.API_TOKEN || window.DEV_API_TOKEN || localStorage.getItem('SF_API_TOKEN') || '';
    if (!token) {
        throw new Error('Nessun access token disponibile: effettua login OIDC oppure imposta window.DEV_API_TOKEN/window.API_TOKEN o localStorage.SF_API_TOKEN per uso static dev');
    }
    return { Authorization: `Bearer ${token}` };
}

function request(path, options = {}) {
    const tokenHeaders = authHeaders();
    return fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...tokenHeaders, ...(options.headers || {}) },
        ...options
    }).then(async (res) => {
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
        }
        const json = await res.json();
        return json.data ?? json;
    });
}

function normalizePayload(payload = {}) {
    // Accetta payload legacy (paziente_nome, cf, data_visita, stato, priorita, parametri, dottore, indirizzo, citta, telefono, email)
    // e lo adatta al nuovo contratto { patient: {...}, encounter: {...} }
    const fullName = payload.paziente_nome ?? payload.full_name ?? '';
    let name = payload.name ?? '';
    let surname = payload.surname ?? '';
    if ((!name || !surname) && fullName) {
        const parts = fullName.trim().split(/\s+/);
        name = name || parts.shift() || '';
        surname = surname || parts.join(' ');
    }

    const patient = {
        name,
        surname,
        full_name: `${name} ${surname}`.trim(),
        cf: payload.cf ?? payload.codice_fiscale ?? payload.fiscal_code ?? '',
        fiscal_code: payload.cf ?? payload.codice_fiscale ?? payload.fiscal_code ?? '',
        address: payload.indirizzo ?? payload.address ?? payload.residence_address ?? null,
        residence_address: payload.indirizzo ?? payload.address ?? payload.residence_address ?? null,
        city: payload.citta ?? payload.city ?? null,
        phone: payload.telefono ?? payload.phone ?? null,
        email: payload.email ?? payload.mail ?? null,
    };

    const encounter = {
        arrival_at: payload.data_visita ?? payload.arrival_at ?? new Date().toISOString(),
        state: payload.stato ?? payload.state ?? 'Registrato',
        priority: payload.priorita ?? payload.priority ?? 'green',
        symptoms: payload.parametri ?? payload.symptoms ?? payload.reason ?? null,
        notes: payload.notes ?? null,
    };

    return { patient, encounter };
}

function toLegacy(encounter = {}) {
    const patient = encounter.patient || {};
    return {
        id: encounter.id,
        paziente_nome: patient.full_name || '',
        cf: patient.cf || '',
        priorita: encounter.priority || 'green',
        stato: encounter.state || 'Registrato',
        data_visita: encounter.arrival_at || new Date().toISOString(),
        dottore: encounter.doctor_name || '-',
        parametri: encounter.symptoms || '-',
        indirizzo: patient.address || null,
        citta: patient.city || null,
        telefono: patient.phone || null,
        email: patient.email || null,
        referto: encounter.notes ? { esito: encounter.notes, terapia: '', allegati: [] } : null,
    };
}

export async function fetchAppointmentsFromApi() {
    const data = await request(RESOURCE, { method: 'GET' });
    return Array.isArray(data) ? data.map(toLegacy) : [];
}

export async function createAppointmentApi(payload) {
    const body = normalizePayload(payload);
    const saved = await request(RESOURCE, { method: 'POST', body: JSON.stringify(body) });
    return toLegacy(saved);
}

export async function updateAppointmentApi(id, payload, method = 'PATCH') {
    const body = normalizePayload(payload);
    const saved = await request(`${RESOURCE}/${id}`, { method, body: JSON.stringify(body) });
    return toLegacy(saved);
}

export async function deleteAppointmentApi(id) {
    return request(`${RESOURCE}/${id}`, { method: 'DELETE' });
}

// mantenuta compatibilità con export default
export default {
    fetchAppointmentsFromApi,
    createAppointmentApi,
    updateAppointmentApi,
    deleteAppointmentApi,
};
