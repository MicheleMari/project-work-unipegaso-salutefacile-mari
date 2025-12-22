export const kpiCodeTile = ({ id, label, containerClass, dotClass, labelClass, valueClass }) => {
    return `
        <div class="flex items-center justify-between ${containerClass} p-2 rounded border">
            <div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full ${dotClass}"></div><span class="text-xs font-bold ${labelClass}">${label}</span></div>
            <span id="kpi-count-${id}" class="font-mono font-bold ${valueClass} text-lg">0</span>
        </div>
    `;
};
