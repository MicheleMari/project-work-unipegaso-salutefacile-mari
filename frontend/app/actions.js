import { state } from '../state/appState.js';

export function setAppointments(list) {
    state.appointments = list;
}

export function addAppointment(appointment) {
    state.appointments.unshift(appointment);
}

export function updateAppointment(id, updater) {
    const appointment = state.appointments.find((item) => item.id === id);
    if (!appointment) return null;
    if (typeof updater === 'function') {
        updater(appointment);
    } else if (updater && typeof updater === 'object') {
        Object.assign(appointment, updater);
    }
    return appointment;
}

export function setFilter(filter) {
    state.currentFilter = filter;
}

export function setSort(column, direction) {
    state.currentSort = { column, direction };
}

export function clearFiles() {
    state.currentFiles = [];
}

export function addFile(file) {
    state.currentFiles.push(file);
}

export function removeFile(index) {
    state.currentFiles.splice(index, 1);
}
