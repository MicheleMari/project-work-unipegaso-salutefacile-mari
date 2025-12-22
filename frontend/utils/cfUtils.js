export function parseCF(cf, cityMap) {
    if (!cf || cf.length !== 16) return null;
    const normalized = cf.toUpperCase();
    const yPart = normalized.substr(6, 2);
    const mPart = normalized.substr(8, 1);
    const dPart = normalized.substr(9, 2);
    const cCode = normalized.substr(11, 4);
    const months = { A: 0, B: 1, C: 2, D: 3, E: 4, H: 5, L: 6, M: 7, P: 8, R: 9, S: 10, T: 11 };
    const y = parseInt(yPart, 10);
    const m = months[mPart];
    let d = parseInt(dPart, 10);
    let gender = 'M';
    if (d > 40) { d -= 40; gender = 'F'; }
    const currentYear = new Date().getFullYear();
    const fullYear = (y <= (currentYear % 100)) ? 2000 + y : 1900 + y;
    const birthDate = new Date(fullYear, m, d);
    if (isNaN(birthDate.getTime())) return null;
    const cityEntry = cityMap && cityMap[cCode];
    let cityName = `Comune (Cod. ${cCode})`;
    if (cityEntry) {
        if (typeof cityEntry === 'string') {
            cityName = cityEntry;
        } else if (cityEntry.comune) {
            cityName = cityEntry.provincia ? `${cityEntry.comune} (${cityEntry.provincia})` : cityEntry.comune;
        }
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return {
        birthDate: birthDate.toLocaleDateString('it-IT'),
        gender: gender === 'M' ? 'Maschio' : 'Femmina',
        cityCode: cCode,
        cityName,
        age
    };
}
