export function validateBookingForm(form) {
    if (!form) return false;
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    return true;
}

export function validateTriageForm(form) {
    if (!form) return false;
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    return true;
}
