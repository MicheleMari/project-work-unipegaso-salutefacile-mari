const API_BASE = window.API_BASE || 'http://127.0.0.1:8000/api';

function authHeaders() {
    const token = window.API_TOKEN || window.DEV_API_TOKEN || localStorage.getItem('SF_API_TOKEN') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchDepartmentsFromApi() {
    const res = await fetch(`${API_BASE}/references/departments`, { headers: { ...authHeaders() } });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
    }
    const json = await res.json();
    const data = json.data ?? json;
    return Array.isArray(data) ? data : [];
}

async function fetchDepartmentsFallback() {
    const departmentsUrl = new URL('../data/departments.json', import.meta.url);
    const res = await fetch(departmentsUrl);
    if (!res.ok) return [];
    return res.json();
}

async function fetchDepartments() {
    try {
        return await fetchDepartmentsFromApi();
    } catch (error) {
        console.warn('Departments API unavailable, fallback to static JSON:', error);
        return fetchDepartmentsFallback();
    }
}

async function fetchCadastral() {
    const cadastralUrl = new URL('../data/cadastral.json', import.meta.url);
    const res = await fetch(cadastralUrl);
    if (!res.ok) {
        throw new Error('Impossibile caricare dati catastali');
    }
    return res.json();
}

export async function loadReferenceData() {
    const [departmentsList, cadastralLines] = await Promise.all([
        fetchDepartments(),
        fetchCadastral()
    ]);

    return { departmentsList, cadastralLines };
}
