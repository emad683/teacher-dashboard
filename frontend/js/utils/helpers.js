import { appData } from '../state/appState.js';

export function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG', options);
}

export function calculatePerformance(student) {
    if (!student.exams || student.exams.length === 0) return 0;
    let score = 0, max = 0;
    student.exams.forEach(e => { score += e.score; max += e.max; });
    return max > 0 ? Math.round((score / max) * 100) : 0;
}

export function getGroupPerformance(groupId) {
    const students = appData.students.filter(s => s.groupId === groupId);
    if(students.length === 0) return 0;
    let totalPerf = 0;
    students.forEach(s => { totalPerf += calculatePerformance(s); });
    return Math.round(totalPerf / students.length);
}
