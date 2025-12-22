export const filterChip = ({ label, filter, color, className }) => {
    return `<button data-action="filter-table" data-filter="${filter}" data-color="${color}" class="filter-chip px-3 py-1 rounded-full text-xs border transition-all ${className}">${label}</button>`;
};
