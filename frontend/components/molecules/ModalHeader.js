export const modalHeader = ({ title, subtitle, containerClass, subtitleClass, closeClass, closeModalId }) => {
    return `
        <div class="${containerClass}">
            <div><h3 class="text-xl font-bold">${title}</h3><p class="${subtitleClass}">${subtitle}</p></div>
            <button data-action="close-modal" data-modal="${closeModalId}" class="${closeClass}"><i data-lucide="x" class="w-6 h-6"></i></button>
        </div>
    `;
};
