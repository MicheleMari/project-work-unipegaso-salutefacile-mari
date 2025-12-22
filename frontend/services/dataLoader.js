export async function loadReferenceData() {
    const departmentsUrl = new URL('../data/departments.json', import.meta.url);
    const cadastralUrl = new URL('../data/cadastral.json', import.meta.url);

    const [departmentsRes, cadastralRes] = await Promise.all([
        fetch(departmentsUrl),
        fetch(cadastralUrl)
    ]);

    if (!departmentsRes.ok || !cadastralRes.ok) {
        throw new Error('Impossibile caricare i dati di riferimento.');
    }

    const [departmentsList, cadastralLines] = await Promise.all([
        departmentsRes.json(),
        cadastralRes.json()
    ]);

    return { departmentsList, cadastralLines };
}
