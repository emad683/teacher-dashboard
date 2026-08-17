export let appData = {
    groups: [], students: [], payments: [],
    gradePrices: { 1: 0, 2: 0, 3: 0 },
    lastResetMonth: null,
    progress: { 1: [], 2: [], 3: [] },
    currentGradeView: 1, currentProgressGrade: 1, currentStudentView: null,
    globalExams: [], attendance: []
};
export function setAppData(data) {
    if (data) {
        Object.assign(appData, data);
        appData.globalExams = appData.globalExams || [];
        appData.attendance = appData.attendance || [];
        if(!appData.progress) appData.progress = {1:[], 2:[], 3:[]};
        if(!appData.gradePrices) appData.gradePrices = {1:0, 2:0, 3:0};
        if(!appData.payments) appData.payments = [];
    }
}
