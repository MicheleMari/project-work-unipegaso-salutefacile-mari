export function createAppointment({ id, paziente_nome, cf, stato, data_visita, priorita = 'none', dottore = '-', doctor_id = null, doctor_department = null, parametri = '-', indirizzo, citta, telefono, email, referto }) {
    return {
        id,
        paziente_nome,
        cf,
        stato,
        data_visita,
        priorita,
        dottore,
        doctor_id,
        doctor_department,
        parametri,
        indirizzo,
        citta,
        telefono,
        email,
        referto
    };
}
