// Definiamo i colori usati per i filtri per generare la safelist
const filterColors = ["medical", "slate", "amber", "purple", "indigo", "fuchsia", "green", "red"];
const safeListClasses = filterColors.flatMap(c => [
    `bg-${c}-600`,
    `text-${c}-600`,
    `border-${c}-600`,
    `border-${c}-200`,
    `hover:bg-${c}-50`
]);

// Classi usate in markup generato a runtime (es. pulsante Nuovo Accesso/Registra)
const runtimeButtonClasses = [
    "bg-medical-700",
    "hover:bg-medical-800",
    "text-white",
    "border-medical-800/60",
    "shadow-lg",
    "active:scale-95",
    "rounded-lg",
    "px-6",
    "py-2.5",
    "font-semibold"
];

const config = {
    safelist: [
        ...safeListClasses,
        ...runtimeButtonClasses,
        "bg-white", 
        "shadow-md",
        "bg-red-500", "bg-orange-500", "bg-green-500", "bg-slate-300", // Barre statistiche
        "text-red-600", "text-orange-600", "text-green-600", "text-slate-600"
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                serif: ['Merriweather', 'serif'],
            },
            colors: {
                medical: { 50: '#f0f9ff', 100: '#e0f2fe', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e' },
                obi: { light: '#f3e8ff', main: '#9333ea', text: '#581c87' } 
            },
            animation: { 'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }
        }
    }
};

// Compatibilità: se caricato via CDN (window.tailwind) o via Node (module.exports)
if (typeof tailwind !== 'undefined') {
    tailwind.config = config;
}
if (typeof module !== 'undefined') {
    module.exports = config;
}
