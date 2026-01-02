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

function normalizeAttachmentPayload(raw = {}) {
    const source = typeof raw === 'object' ? raw : {};
    const storagePathRaw = source.storage_path ?? source.path ?? source.attachment_path ?? source.attachmentUrl ?? '';
    const storagePath = typeof storagePathRaw === 'string' ? storagePathRaw.trim() : String(storagePathRaw || '').trim();
    if (!storagePath) {
        if (typeof raw === 'string') {
            const trimmed = raw.trim();
            return trimmed ? { storage_path: trimmed } : null;
        }
        return null;
    }
    const sizeRaw = source.size_bytes ?? source.size ?? null;
    const sizeBytes = Number.isFinite(sizeRaw) ? Number(sizeRaw) : (sizeRaw ? parseInt(sizeRaw, 10) : null);
    return {
        id: source.id ?? source.attachment_id ?? null,
        storage_path: storagePath,
        original_name: source.original_name ?? source.filename ?? source.name ?? null,
        mime_type: source.mime_type ?? source.mime ?? null,
        size_bytes: sizeBytes,
    };
}

function normalizePayload(payload = {}, { applyDefaults = false } = {}) {
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
        arrival_at: payload.data_visita ?? payload.arrival_at ?? (applyDefaults ? new Date().toISOString() : undefined),
        state: payload.stato ?? payload.state ?? (applyDefaults ? 'Registrato' : undefined),
        symptoms: payload.parametri ?? payload.symptoms ?? payload.reason ?? null,
        notes: payload.notes ?? null,
    };
    // Non sovrascrivere il codice priorità esistente se non è stato esplicitamente passato
    if (Object.prototype.hasOwnProperty.call(payload, 'priorita') || Object.prototype.hasOwnProperty.call(payload, 'priority') || applyDefaults) {
        encounter.priority = payload.priorita ?? payload.priority ?? (applyDefaults ? 'green' : undefined);
    }

    const investigations = Array.isArray(payload.investigations)
        ? payload.investigations
            .map((val) => {
                if (typeof val === 'number') {
                    const num = parseInt(val, 10);
                    return Number.isInteger(num) && num > 0 ? { investigation_id: num } : null;
                }
                if (val && typeof val === 'object') {
                    const invId = parseInt(val.investigation_id ?? val.id ?? 0, 10);
                    if (!Number.isInteger(invId) || invId <= 0) return null;
                    const attachmentSource = val.attachment ?? {
                        attachment_path: val.attachment_path ?? val.attachmentUrl ?? null,
                        original_name: val.attachment_name ?? null,
                        mime_type: val.attachment_mime ?? null,
                        size_bytes: val.attachment_size ?? null,
                    };
                    const attachment = normalizeAttachmentPayload(attachmentSource);
                    return {
                        investigation_id: invId,
                        outcome: val.outcome ?? null,
                        notes: val.notes ?? null,
                        attachment,
                    };
                }
                return null;
            })
            .filter(Boolean)
        : null;

    const body = { patient, encounter };
    const patientFields = [patient.name, patient.surname, patient.fiscal_code, patient.full_name, patient.address, patient.city, patient.phone, patient.email];
    const hasPatientInput = patientFields.some((v) => v !== undefined && v !== null && String(v).trim() !== '');
    if (!hasPatientInput) {
        delete body.patient;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'investigations')) {
        body.investigations = investigations ?? [];
    }
    return body;
}

function toLegacy(encounter = {}) {
    const patient = encounter.patient || {};
    const investigations = Array.isArray(encounter.investigations)
        ? encounter.investigations.map((inv) => {
            const attachment = normalizeAttachmentPayload(inv.attachment ?? inv);
            return {
                ...inv,
                attachment,
                attachment_path: attachment?.storage_path || inv.attachment_path || null,
            };
        })
        : [];
    return {
        id: encounter.id,
        paziente_nome: patient.full_name || '',
        cf: patient.cf || '',
        priorita: encounter.priority || 'green',
        stato: encounter.state || 'Registrato',
        data_visita: encounter.arrival_at || new Date().toISOString(),
        dottore: encounter.doctor_name || '-',
        doctor_id: encounter.doctor_id || null,
        doctor_department: encounter.doctor_department || null,
        parametri: encounter.symptoms || '-',
        // backend restituisce residence_address: preserviamo compatibilità legacy su "indirizzo"
        indirizzo: patient.address || patient.residence_address || null,
        citta: patient.city || null,
        telefono: patient.phone || null,
        email: patient.email || null,
        referto: encounter.notes ? { esito: encounter.notes, terapia: '', allegati: [] } : null,
        investigations,
    };
}

export async function fetchAppointmentsFromApi() {
    const data = await request(RESOURCE, { method: 'GET' });
    return Array.isArray(data) ? data.map(toLegacy) : [];
}

export async function createAppointmentApi(payload) {
    const body = normalizePayload(payload, { applyDefaults: true });
    const saved = await request(RESOURCE, { method: 'POST', body: JSON.stringify(body) });
    return toLegacy(saved);
}

export async function updateAppointmentApi(id, payload, method = 'PATCH') {
    const body = normalizePayload(payload, { applyDefaults: false });
    const saved = await request(`${RESOURCE}/${id}`, { method, body: JSON.stringify(body) });
    return toLegacy(saved);
}

export async function deleteAppointmentApi(id) {
    return request(`${RESOURCE}/${id}`, { method: 'DELETE' });
}

export async function uploadAttachmentApi(file) {
    const tokenHeaders = authHeaders();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/ps/uploads`, {
        method: 'POST',
        headers: { ...tokenHeaders },
        body: formData,
    });
    const text = await res.text();
    if (!res.ok) {
        const message = text || `Upload fallito (HTTP ${res.status})`;
        throw new Error(message);
    }
    const json = JSON.parse(text || '{}');
    return json.data ?? json;
}

// mantenuta compatibilità con export default
export default {
    fetchAppointmentsFromApi,
    createAppointmentApi,
    updateAppointmentApi,
    uploadAttachmentApi,
    deleteAppointmentApi,
};
