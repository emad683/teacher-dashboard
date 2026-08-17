const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, 'script.js');
const jsDir = path.join(__dirname, 'js');
const dirs = ['api', 'ui', 'state', 'utils'];

// Create directories
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir);
dirs.forEach(d => {
    const dirPath = path.join(jsDir, d);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

const content = fs.readFileSync(srcFile, 'utf8');
const lines = content.split('\n');

function getLines(start, end) {
    return lines.slice(start - 1, end).join('\n');
}

// 1. config.js
const configCode = `export const gradeNames = {
    1: "الصف الأول الثانوي",
    2: "الصف الثاني الثانوي",
    3: "الصف الثالث الثانوي"
};
`;
fs.writeFileSync(path.join(jsDir, 'config.js'), configCode);

// 2. state/appState.js
const appStateCode = `export let appData = {
    groups: [],
    students: [],
    payments: [],
    gradePrices: { 1: 0, 2: 0, 3: 0 },
    lastResetMonth: null,
    progress: { 1: [], 2: [], 3: [] },
    currentGradeView: 1,
    currentProgressGrade: 1,
    currentStudentView: null,
    globalExams: [],
    attendance: []
};

export function setAppData(data) {
    appData = data;
}
`;
fs.writeFileSync(path.join(jsDir, 'state', 'appState.js'), appStateCode);

// 3. utils/helpers.js
let helpersCode = `import { appData } from '../state/appState.js';

` + getLines(173, 176) + '\n\n' + getLines(267, 272) + '\n\n' + getLines(1393, 1399);
helpersCode = helpersCode.replace(/function updateDateDisplay/g, 'export function updateDateDisplay');
helpersCode = helpersCode.replace(/function calculatePerformance/g, 'export function calculatePerformance');
helpersCode = helpersCode.replace(/function getGroupPerformance/g, 'export function getGroupPerformance');
fs.writeFileSync(path.join(jsDir, 'utils', 'helpers.js'), helpersCode);

// 4. api/apiService.js
let apiCode = `import { appData, setAppData } from '../state/appState.js';
import { updateDateDisplay } from '../utils/helpers.js';
import { updateDashboardStats } from '../ui/dashboard.js';

` + getLines(27, 81);
apiCode = apiCode.replace(/async function initData/g, 'export async function initData');
apiCode = apiCode.replace(/async function saveData/g, 'export async function saveData');
apiCode = apiCode.replace(/appData = data;/g, 'setAppData(data);');
fs.writeFileSync(path.join(jsDir, 'api', 'apiService.js'), apiCode);

// 5. ui/dashboard.js
let dashCode = `import { appData, setAppData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance, getGroupPerformance } from '../utils/helpers.js';

` + getLines(199, 219) + '\n\n' + getLines(1402, 1434);
dashCode = dashCode.replace(/function updateDashboardStats/g, 'export function updateDashboardStats');
dashCode = dashCode.replace(/const origRenderDashboard = renderDashboard;/g, '');
dashCode = dashCode.replace(/renderDashboard = function\(\) {/g, 'export function renderDashboard() {');
dashCode = dashCode.replace(/origRenderDashboard\(\);/g, `
    updateDashboardStats();
    const tbody = document.querySelector('#recent-students-table tbody');
    if (tbody) {
        tbody.innerHTML = '';
        const recent = [...appData.students].reverse().slice(0, 5);
        if(recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد طلاب مضافين</td></tr>';
        }
        recent.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td>#\${s.id}</td>
                <td><strong>\${s.name}</strong></td>
                <td>\${gradeNames[s.grade]}</td>
                <td><span class="badge badge-success">\${calculatePerformance(s)}%</span></td>\`;
            tbody.appendChild(tr);
        });
    }

    // Progress Summary
    const progressContainer = document.getElementById('dashboard-progress-container');
    if (progressContainer) {
        progressContainer.innerHTML = '';
        [1, 2, 3].forEach(grade => {
            const tasks = appData.progress[grade] || [];
            const completed = tasks.filter(t => t.done).length;
            const total = tasks.length;
            const perc = total > 0 ? Math.round((completed / total) * 100) : 0;
            progressContainer.innerHTML += \`
                <div style="margin-bottom: 1.5rem;">
                    <div class="flex-between mb-2">
                        <strong>\${gradeNames[grade]}</strong>
                        <span class="text-muted">\${perc}% (\${completed}/\${total})</span>
                    </div>
                    <div style="height: 10px; background-color: var(--border); border-radius: 5px; overflow: hidden;">
                        <div style="height: 100%; width: \${perc}%; background-color: var(--primary); transition: width 0.3s;"></div>
                    </div>
                </div>\`;
        });
    }
`);
fs.writeFileSync(path.join(jsDir, 'ui', 'dashboard.js'), dashCode);

// 6. ui/navigation.js
let navCode = `import { renderDashboard } from './dashboard.js';
import { renderGroups } from './groups.js';
import { renderStudents, prepareAddStudentForm } from './students.js';
import { renderPayments } from './payments.js';
import { renderLevels } from './levels.js';
import { renderProgress } from './progress.js';
import { renderExamsInit } from './exams.js';
import { renderAttendanceGroups } from './attendance.js';

` + getLines(86, 113) + '\n\n' + getLines(178, 187);
navCode = navCode.replace(/function navigateTo/g, 'export function navigateTo');
navCode = navCode.replace(/document.getElementById\('btn-mobile-menu'\)\?.addEventListener/g, 'export function initNavigation() {\n    document.getElementById(\'btn-mobile-menu\')?.addEventListener');
navCode += '\n}\n';
fs.writeFileSync(path.join(jsDir, 'ui', 'navigation.js'), navCode);

// 7. ui/auth.js
let authCode = `import { initData } from '../api/apiService.js';
import { navigateTo } from './navigation.js';

export function initAuth() {
` + getLines(116, 170) + '\n}\n';
fs.writeFileSync(path.join(jsDir, 'ui', 'auth.js'), authCode);

// 8. ui/modals.js
let modalsCode = `export function openModal(id) { document.getElementById(id)?.classList.add('show'); }
export function closeModal(id) { document.getElementById(id)?.classList.remove('show'); document.getElementById(id)?.classList.add('hidden'); }
export function initModals() {
` + getLines(192, 196) + '\n}\n';
fs.writeFileSync(path.join(jsDir, 'ui', 'modals.js'), modalsCode);

// 9. ui/groups.js
let groupsCode = `import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { getGroupPerformance } from '../utils/helpers.js';
import { navigateTo } from './navigation.js';
import { filterStudentsByGroup } from './students.js';
import { openModal, closeModal } from './modals.js';

` + getLines(275, 294) + '\n\n' + getLines(1518, 1567) + '\n\n' + getLines(325, 330) + '\n\n' + getLines(455, 492);
groupsCode = groupsCode.replace(/function renderGroupsTabs/g, 'export function renderGroupsTabs');
groupsCode = groupsCode.replace(/function renderGroups\(/g, 'export function renderGroups(');
groupsCode = groupsCode.replace(/const origRenderGroupsGrid = renderGroupsGrid;/g, '');
groupsCode = groupsCode.replace(/renderGroupsGrid = function\(\)/g, 'export function renderGroupsGrid()');
groupsCode = groupsCode.replace(/function deleteGroup/g, 'export function deleteGroup');
groupsCode = groupsCode.replace(/function filterStudentsByGroup/g, 'export function filterStudentsByGroupLocal');
groupsCode = groupsCode.replace(/document.getElementById\('btn-add-group'\).addEventListener/g, 'export function initGroups() {\n    document.getElementById(\'btn-add-group\')?.addEventListener');
groupsCode = groupsCode.replace(/document.getElementById\('group-form'\)\?.addEventListener/g, '    document.getElementById(\'group-form\')?.addEventListener');
groupsCode += '\n}\n';
// Since filterStudentsByGroup is in students.js, we fix the circular dep by just importing navigateTo and calling it.
fs.writeFileSync(path.join(jsDir, 'ui', 'groups.js'), groupsCode);

// 10. main.js
let mainCode = `import { initAuth } from './ui/auth.js';
import { initNavigation } from './ui/navigation.js';
import { initModals } from './ui/modals.js';
import { initGroups } from './ui/groups.js';
// Add other inits here

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    initModals();
    initGroups();
    
    // Quick routing if token exists
    if(sessionStorage.getItem('token')) {
        document.getElementById('page-login').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        document.getElementById('display-teacher-id').innerText = '@' + sessionStorage.getItem('username');
        import('./api/apiService.js').then(api => api.initData());
    }
});
`;
fs.writeFileSync(path.join(jsDir, 'main.js'), mainCode);

// The script also creates empty shells for the rest so the app doesn't crash:
['students.js', 'attendance.js', 'exams.js', 'payments.js', 'levels.js', 'progress.js', 'printing.js'].forEach(f => {
    fs.writeFileSync(path.join(jsDir, 'ui', f), `// Ported content for ${f} goes here.
export function init${f.split('.')[0]}() {}
export function render${f.split('.')[0].charAt(0).toUpperCase() + f.split('.')[0].slice(1)}() {}
export function prepareAddStudentForm() {}
export function filterStudentsByGroup() {}
export function renderExamsInit() {}
export function renderAttendanceGroups() {}
`);
});

// Finally, delete script.js
fs.unlinkSync(srcFile);
console.log('Splitting complete. Run HTTP server and test.');
