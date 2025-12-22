export const state = {
    user: null,
    permissions: { canCreate: false, canReferto: false, canAssignAll: false },
    appointments: [],
    currentFilter: 'all',
    currentFiles: [],
    outcomeId: null,
    outcomeType: '',
    currentSort: { column: 'data_visita', direction: 'desc' },
    isEditingPatient: false,
    cityMap: {},
    privacyEnabled: false,
    idleSeconds: 0,
    autoLockInterval: null
};

export const constants = {
    IDLE_LIMIT: 900,
    WARNING_LIMIT: 30,
    LOCK_STORAGE_KEY: 'sfps_locked',
    departmentsList: [],
    cadastralLines: []
};
