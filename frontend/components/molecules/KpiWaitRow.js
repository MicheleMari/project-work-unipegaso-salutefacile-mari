export const kpiWaitRow = ({ id, label, dotClass, barClass }) => {
    return `
        <div class="flex items-center justify-between text-xs pt-1">
            <span class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full ${dotClass}"></div> ${label}</span>
            <span id="kpi-wait-${id}" class="font-mono font-bold text-slate-700">-- min</span>
        </div>
        <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div id="kpi-bar-${id}" class="${barClass} h-1.5 rounded-full" style="width: 0%"></div>
        </div>
    `;
};
