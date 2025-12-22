export function createAppointment({ id, paziente_nome, cf, stato, data_visita, priorita = 'none', dottore = '-', parametri = '-', indirizzo, citta, telefono, email, referto }) {
    return {
        id,
        paziente_nome,
        cf,
        stato,
        data_visita,
        priorita,
        dottore,
        parametri,
        indirizzo,
        citta,
        telefono,
        email,
        referto
    };
}
