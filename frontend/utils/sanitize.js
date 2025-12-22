export function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/`/g, '&#96;');
}

export function safeText(value = '', fallback = '-') {
    const str = (value === null || value === undefined || value === '') ? fallback : value;
    return escapeHtml(str);
}
