const API_BASE = window.API_BASE || 'http://127.0.0.1:8000/api';
const RESOURCE = '/references/investigations';

function authHeaders() {
    const token = window.API_TOKEN || window.DEV_API_TOKEN || localStorage.getItem('SF_API_TOKEN') || '';
    if (!token) {
        throw new Error('Nessun access token disponibile per caricare gli accertamenti');
    }
    return { Authorization: `Bearer ${token}` };
}

export async function fetchInvestigations() {
    const res = await fetch(`${API_BASE}${RESOURCE}`, { headers: { ...authHeaders() } });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data ?? [];
}

export default { fetchInvestigations };
