import os

js_dir = "js"
os.makedirs(os.path.join(js_dir, "api"), exist_ok=True)
os.makedirs(os.path.join(js_dir, "ui"), exist_ok=True)
os.makedirs(os.path.join(js_dir, "state"), exist_ok=True)
os.makedirs(os.path.join(js_dir, "utils"), exist_ok=True)

with open("script.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

def get_lines(start, end):
    return "".join(lines[start-1:end])

# 1. config.js
config_code = """export const gradeNames = {
    1: "الصف الأول الثانوي",
    2: "الصف الثاني الثانوي",
    3: "الصف الثالث الثانوي"
};
"""
with open(os.path.join(js_dir, "config.js"), "w", encoding="utf-8") as f:
    f.write(config_code)

# 2. state/appState.js
state_code = """export let appData = {
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
"""
with open(os.path.join(js_dir, "state", "appState.js"), "w", encoding="utf-8") as f:
    f.write(state_code)

# 3. utils/helpers.js
helpers_code = """import { appData } from '../state/appState.js';

""" + get_lines(173, 176) + "\n" + get_lines(267, 272) + "\n" + get_lines(1393, 1399)
helpers_code = helpers_code.replace("function updateDateDisplay", "export function updateDateDisplay")
helpers_code = helpers_code.replace("function calculatePerformance", "export function calculatePerformance")
helpers_code = helpers_code.replace("function getGroupPerformance", "export function getGroupPerformance")
with open(os.path.join(js_dir, "utils", "helpers.js"), "w", encoding="utf-8") as f:
    f.write(helpers_code)

# 4. api/apiService.js
api_code = """import { appData, setAppData } from '../state/appState.js';
import { updateDateDisplay } from '../utils/helpers.js';
import { updateDashboardStats } from '../ui/dashboard.js';

""" + get_lines(27, 60) + "\n    updateDashboardStats();\n    updateDateDisplay();\n}\n\n" + get_lines(65, 81)
api_code = api_code.replace("async function initData", "export async function initData")
api_code = api_code.replace("async function saveData", "export async function saveData")
api_code = api_code.replace("appData = data;", "setAppData(data);")
with open(os.path.join(js_dir, "api", "apiService.js"), "w", encoding="utf-8") as f:
    f.write(api_code)

# 5. ui/dashboard.js
dash_code = """import { appData, setAppData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance, getGroupPerformance } from '../utils/helpers.js';

""" + get_lines(199, 219) + "\n\n" + get_lines(1408, 1434)
dash_code += "\nexport function renderDashboard() {\n    updateDashboardStats();\n    renderWeakestGroups();\n" + get_lines(224, 264)
dash_code = dash_code.replace("function updateDashboardStats", "export function updateDashboardStats")
dash_code = dash_code.replace("function renderWeakestGroups", "export function renderWeakestGroups")
with open(os.path.join(js_dir, "ui", "dashboard.js"), "w", encoding="utf-8") as f:
    f.write(dash_code)

# 6. ui/groups.js
groups_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { openModal, closeModal } from './modals.js';
import { navigateTo } from './navigation.js';
import { getGroupPerformance } from '../utils/helpers.js';
import { saveData } from '../api/apiService.js';
import { renderStudents } from './students.js';

""" + get_lines(275, 289) + "\n" + get_lines(291, 294) + "\n" + get_lines(1520, 1567) + "\n" + get_lines(325, 330) + "\n" + get_lines(455, 474) + "\n" + get_lines(476, 487) + "\n" + get_lines(489, 492)
groups_code = groups_code.replace("function renderGroupsTabs", "export function renderGroupsTabs")
groups_code = groups_code.replace("function renderGroups(", "export function renderGroups(")
groups_code = groups_code.replace("renderGroupsGrid = function()", "export function renderGroupsGrid()")
groups_code = groups_code.replace("function deleteGroup", "export function deleteGroup")
groups_code = groups_code.replace("function filterStudentsByGroup", "export function filterStudentsByGroup")
groups_code = groups_code.replace("document.getElementById('btn-add-group').addEventListener", "export function initGroups() {\n  document.getElementById('sort-groups')?.addEventListener('change', () => renderGroupsGrid());\n  document.getElementById('btn-add-group')?.addEventListener")
groups_code = groups_code.replace("renderGroupsGrid();\n});", "renderGroupsGrid();\n  });\n")
groups_code = groups_code.replace("document.getElementById('group-form')?.addEventListener", "  document.getElementById('group-form')?.addEventListener")
groups_code = groups_code.replace("renderGroupsGrid();\n});", "renderGroupsGrid();\n  });\n}")
with open(os.path.join(js_dir, "ui", "groups.js"), "w", encoding="utf-8") as f:
    f.write(groups_code)

# 7. ui/students.js
students_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance } from '../utils/helpers.js';
import { saveData } from '../api/apiService.js';
import { renderExamsTableForStudent } from './exams.js';
import { renderStudentPayments } from './payments.js';
import { renderStudentAttendanceHistory } from './attendance.js';
import { navigateTo } from './navigation.js';
import { renderDashboard } from './dashboard.js';
import { renderPayments } from './payments.js';

""" + get_lines(498, 504) + "\n" + get_lines(1440, 1515) + "\n" + get_lines(567, 573) + "\n" + get_lines(575, 585) + "\n" + get_lines(640, 649) + "\n" + get_lines(651, 679) + "\n" + get_lines(681, 704)
students_code = students_code.replace("function populateGradeFilters", "export function populateGradeFilters")
students_code = students_code.replace("renderStudents = function", "export function renderStudents")
students_code = students_code.replace("function deleteStudent", "export function deleteStudent")
students_code = students_code.replace("function deleteAllStudents", "export function deleteAllStudents")
students_code = students_code.replace("function prepareAddStudentForm", "export function prepareAddStudentForm")
students_code = students_code.replace("function viewStudent", "export function viewStudent")
students_code += """
export function initStudents() {
    document.getElementById('filter-grade')?.addEventListener('change', () => renderStudents());
    document.getElementById('search-student')?.addEventListener('input', () => renderStudents());
    document.getElementById('sort-students')?.addEventListener('change', () => renderStudents());
    document.getElementById('filter-unpaid')?.addEventListener('change', () => renderStudents());
    document.getElementById('student-grade')?.addEventListener('change', (e) => {
        const grade = parseInt(e.target.value);
        const groupSelect = document.getElementById('student-group');
        groupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
        if (grade) {
            const groups = appData.groups.filter(g => g.grade === grade);
            groups.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.id;
                opt.innerText = g.name;
                groupSelect.appendChild(opt);
            });
            groupSelect.disabled = false;
        } else {
            groupSelect.disabled = true;
        }
    });
}
"""
with open(os.path.join(js_dir, "ui", "students.js"), "w", encoding="utf-8") as f:
    f.write(students_code)

# 8. ui/payments.js
payments_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { viewStudent } from './students.js';
import { closeModal } from './modals.js';

""" + get_lines(587, 618) + "\n" + get_lines(794, 821) + "\n" + get_lines(823, 831) + "\n" + get_lines(856, 863) + "\n" + get_lines(1572, 1637) + "\n" + get_lines(1127, 1171) + "\n" + get_lines(1639, 1645)
payments_code = payments_code.replace("function changePaymentStatus(", "export function changePaymentStatus(")
payments_code = payments_code.replace("function renderStudentPayments", "export function renderStudentPayments")
payments_code = payments_code.replace("function openManualPaymentModal", "export function openManualPaymentModal")
payments_code = payments_code.replace("function deletePayment(", "export function deletePayment(")
payments_code = payments_code.replace("renderPayments = function", "export function renderPayments")
payments_code = payments_code.replace("function changePaymentStatusForMonth", "export function changePaymentStatusForMonth")
payments_code = payments_code.replace("function deletePaymentGlobal", "export function deletePaymentGlobal")
payments_code += """
export function initPayments() {
    document.getElementById('payment-grade-filter')?.addEventListener('change', renderPayments);
    document.getElementById('sort-payments')?.addEventListener('change', renderPayments);
    document.getElementById('manual-payment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('manual-payment-amount').value);
        let monthStr = document.getElementById('manual-payment-month').value;
        if(!monthStr) {
            const d = new Date();
            monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        appData.payments.push({
            id: Date.now(),
            studentId: appData.currentStudentView,
            amount: amount,
            date: `${monthStr}-01T12:00:00.000Z`
        });
        saveData();
        closeModal('modal-manual-payment');
        viewStudent(appData.currentStudentView);
        if(document.getElementById('page-payments').classList.contains('hidden') === false) renderPayments();
    });
}
"""
with open(os.path.join(js_dir, "ui", "payments.js"), "w", encoding="utf-8") as f:
    f.write(payments_code)

# 9. ui/levels.js
levels_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { navigateTo } from './navigation.js';

""" + get_lines(1174, 1199) + "\n" + get_lines(1201, 1208)
levels_code = levels_code.replace("function renderLevels", "export function renderLevels")
levels_code = levels_code.replace("function saveGradePrice", "export function saveGradePrice")
levels_code += """
export function initLevels() {
    document.getElementById('update-prices-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        appData.gradePrices[1] = parseFloat(document.getElementById('price-grade-1').value) || 0;
        appData.gradePrices[2] = parseFloat(document.getElementById('price-grade-2').value) || 0;
        appData.gradePrices[3] = parseFloat(document.getElementById('price-grade-3').value) || 0;
        saveData();
        alert('تم حفظ التسعيرة الجديدة بنجاح');
    });
}
"""
with open(os.path.join(js_dir, "ui", "levels.js"), "w", encoding="utf-8") as f:
    f.write(levels_code)

# 10. ui/progress.js
progress_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';

""" + get_lines(1211, 1224) + "\n" + get_lines(1226, 1258) + "\n" + get_lines(1277, 1285) + "\n" + get_lines(1287, 1292)
progress_code = progress_code.replace("function renderProgressTabs", "export function renderProgressTabs")
progress_code = progress_code.replace("function renderProgress(", "export function renderProgress(")
progress_code = progress_code.replace("function toggleTask", "export function toggleTask")
progress_code = progress_code.replace("function deleteTask", "export function deleteTask")
progress_code += """
export function initProgress() {
    document.getElementById('add-task-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const grade = appData.currentProgressGrade;
        const input = document.getElementById('new-task-title');
        const title = input.value.trim();
        if(!title) return;
        if(!appData.progress[grade]) appData.progress[grade] = [];
        const newId = appData.progress[grade].length > 0 ? Math.max(...appData.progress[grade].map(t => t.id)) + 1 : 1;
        appData.progress[grade].push({ id: newId, title, done: false });
        input.value = '';
        saveData();
        renderProgress();
    });
}
"""
with open(os.path.join(js_dir, "ui", "progress.js"), "w", encoding="utf-8") as f:
    f.write(progress_code)

# 11. ui/exams.js
exams_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { closeModal } from './modals.js';
import { viewStudent } from './students.js';

""" + get_lines(706, 730) + "\n" + get_lines(732, 743) + "\n" + get_lines(761, 768) + "\n" + get_lines(870, 888) + "\n" + get_lines(947, 982) + "\n" + get_lines(1026, 1033)
exams_code = exams_code.replace("function renderExamsTableForStudent", "export function renderExamsTableForStudent")
exams_code = exams_code.replace("function openEditExamModal", "export function openEditExamModal")
exams_code = exams_code.replace("function deleteExam", "export function deleteExam")
exams_code = exams_code.replace("function renderExamsInit", "export function renderExamsInit")
exams_code = exams_code.replace("function loadBulkStudentsTable", "export function loadBulkStudentsTable")
exams_code = exams_code.replace("function filterExamStudents", "export function filterExamStudents")
exams_code += """
export function initExams() {
    document.getElementById('edit-exam-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const examId = parseInt(document.getElementById('edit-exam-id').value);
        const score = parseFloat(document.getElementById('edit-exam-score').value);
        const student = appData.students.find(s => s.id === appData.currentStudentView);
        if(!student) return;
        const exam = student.exams.find(ex => ex.id === examId);
        if(!exam) return;
        exam.score = score;
        saveData();
        closeModal('modal-edit-exam');
        viewStudent(appData.currentStudentView);
    });
    
    document.getElementById('create-exam-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const grade = parseInt(document.getElementById('new-exam-grade').value);
        const name = document.getElementById('new-exam-name').value;
        const max = parseFloat(document.getElementById('new-exam-max').value);
        if(!grade || !name || isNaN(max)) return;
        const newId = appData.globalExams.length > 0 ? Math.max(...appData.globalExams.map(ex => ex.id)) + 1 : 1;
        appData.globalExams.push({
            id: newId, grade: grade, name: name, max: max, date: new Date().toISOString().split('T')[0]
        });
        saveData();
        alert('تم إنشاء الامتحان بنجاح. يمكنك الآن رصد الدرجات له.');
        document.getElementById('create-exam-form').reset();
        const selectedGradeForEntry = parseInt(document.getElementById('entry-exam-grade').value);
        if(selectedGradeForEntry === grade) {
            document.getElementById('entry-exam-grade').dispatchEvent(new Event('change'));
        }
    });

    document.getElementById('entry-exam-grade')?.addEventListener('change', (e) => {
        const grade = parseInt(e.target.value);
        const examSelect = document.getElementById('entry-exam-select');
        const groupSelect = document.getElementById('entry-group-select');
        document.getElementById('bulk-exam-container').classList.add('hidden');
        examSelect.innerHTML = '<option value="">اختر الامتحان...</option>';
        groupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
        if (!grade) { examSelect.disabled = true; groupSelect.disabled = true; return; }
        const gradeExams = appData.globalExams.filter(ex => ex.grade === grade);
        gradeExams.forEach(ex => { examSelect.innerHTML += `<option value="${ex.id}">${ex.name} (من ${ex.max})</option>`; });
        const gradeGroups = appData.groups.filter(g => g.grade === grade);
        gradeGroups.forEach(g => { groupSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`; });
        examSelect.disabled = false; groupSelect.disabled = false;
    });

    document.getElementById('entry-exam-select')?.addEventListener('change', loadBulkStudentsTable);
    document.getElementById('entry-group-select')?.addEventListener('change', loadBulkStudentsTable);

    document.getElementById('btn-save-bulk-exam')?.addEventListener('click', () => {
        const examId = parseInt(document.getElementById('entry-exam-select').value);
        const globalExam = appData.globalExams.find(ex => ex.id === examId);
        if(!globalExam) return;
        const rows = document.querySelectorAll('#exam-entry-table tbody tr[data-student-id]');
        if(rows.length === 0) return;
        rows.forEach(row => {
            const studentId = parseInt(row.getAttribute('data-student-id'));
            const scoreInput = row.querySelector('.bulk-score-input');
            if(!scoreInput) return;
            const score = parseFloat(scoreInput.value) || 0;
            const student = appData.students.find(s => s.id === studentId);
            if(!student) return;
            const existingExamIndex = student.exams.findIndex(ex => ex.name === globalExam.name);
            if (existingExamIndex !== -1) {
                student.exams[existingExamIndex].score = score;
                student.exams[existingExamIndex].max = globalExam.max;
            } else {
                const newExamId = student.exams.length > 0 ? Math.max(...student.exams.map(e => e.id)) + 1 : 1;
                student.exams.push({ id: newExamId, name: globalExam.name, date: new Date().toISOString().split('T')[0], score: score, max: globalExam.max });
            }
        });
        saveData();
        alert('تم حفظ جميع الدرجات بنجاح!');
    });
}
"""
with open(os.path.join(js_dir, "ui", "exams.js"), "w", encoding="utf-8") as f:
    f.write(exams_code)


# 12. ui/attendance.js
attendance_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { renderPayments } from './payments.js';

""" + get_lines(343, 351) + "\n" + get_lines(393, 430) + "\n" + get_lines(432, 440) + "\n" + get_lines(442, 453) + "\n" + get_lines(770, 792)
attendance_code = attendance_code.replace("function renderAttendanceGroups", "export function renderAttendanceGroups")
attendance_code = attendance_code.replace("function renderAttendanceTable", "export function renderAttendanceTable")
attendance_code = attendance_code.replace("function toggleAttendance", "export function toggleAttendance")
attendance_code = attendance_code.replace("function openManualPaymentModalFor", "export function openManualPaymentModalFor")
attendance_code = attendance_code.replace("function renderStudentAttendanceHistory", "export function renderStudentAttendanceHistory")
attendance_code += """
export function initAttendance() {
    document.getElementById('attendance-grade-filter')?.addEventListener('change', (e) => {
        const grade = parseInt(e.target.value);
        const groupSelect = document.getElementById('attendance-group-filter');
        groupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
        if(grade) {
            const groups = appData.groups.filter(g => g.grade === grade);
            groups.forEach(g => { groupSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`; });
            groupSelect.disabled = false;
        } else {
            groupSelect.disabled = true;
        }
        document.getElementById('attendance-students-container').classList.add('hidden');
    });

    document.getElementById('attendance-group-filter')?.addEventListener('change', () => {
        document.getElementById('attendance-students-container').classList.add('hidden');
    });

    document.getElementById('btn-load-attendance')?.addEventListener('click', () => {
        const groupId = parseInt(document.getElementById('attendance-group-filter').value);
        const date = document.getElementById('attendance-date').value;
        if(!groupId || !date) { alert('الرجاء اختيار المجموعة وتحديد التاريخ أولاً'); return; }
        let session = appData.attendance.find(a => a.groupId === groupId && a.date === date);
        if (!session) {
            session = { id: Date.now(), groupId: groupId, date: date, records: {} };
            appData.attendance.push(session);
            saveData(); 
        }
        renderAttendanceTable(groupId, session);
    });
}
"""
with open(os.path.join(js_dir, "ui", "attendance.js"), "w", encoding="utf-8") as f:
    f.write(attendance_code)

# 13. ui/printing.js
printing_code = """import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance } from '../utils/helpers.js';
import { openModal } from './modals.js';

""" + get_lines(1663, 1666) + "\n"
printing_code = printing_code.replace("function printReport", "export function printReport")
printing_code += """
export function initPrinting() {
    document.getElementById('print-target')?.addEventListener('change', (e) => {
        const val = e.target.value;
        const wrapper = document.getElementById('print-group-wrapper');
        if(val === 'group') {
            const groupSelect = document.getElementById('print-group');
            groupSelect.innerHTML = '';
            appData.groups.forEach(g => {
                groupSelect.innerHTML += `<option value="${g.id}">${gradeNames[g.grade]} - ${g.name}</option>`;
            });
            wrapper.classList.remove('hidden');
        } else {
            wrapper.classList.add('hidden');
        }
    });

    document.getElementById('btn-execute-print')?.addEventListener('click', () => {
        const target = document.getElementById('print-target').value;
        let studentsToPrint = [];
        let title = "تقرير الطلاب";
        
        if (target === 'all') {
            studentsToPrint = appData.students;
        } else if (target.startsWith('grade-')) {
            const grade = parseInt(target.split('-')[1]);
            studentsToPrint = appData.students.filter(s => s.grade === grade);
            title = `تقرير طلاب ${gradeNames[grade]}`;
        } else if (target === 'group') {
            const groupId = parseInt(document.getElementById('print-group').value);
            studentsToPrint = appData.students.filter(s => s.groupId === groupId);
            const group = appData.groups.find(g => g.id === groupId);
            title = `تقرير مجموعة: ${group ? group.name : ''}`;
        }
        
        const cols = {
            id: document.getElementById('print-col-id').checked,
            name: true,
            grade: document.getElementById('print-col-grade').checked,
            phone: document.getElementById('print-col-phone').checked,
            perf: document.getElementById('print-col-perf').checked,
            payment: document.getElementById('print-col-payment').checked,
            attendance: document.getElementById('print-col-attendance').checked
        };
        
        const container = document.getElementById('print-container');
        let html = `
            <div class="print-header">
                <h1>${title}</h1>
                <p>العدد الإجمالي: ${studentsToPrint.length} طالب</p>
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <table class="table">
                <thead>
                    <tr>
                        ${cols.id ? '<th>الكود</th>' : ''}
                        <th>اسم الطالب</th>
                        ${cols.grade ? '<th>الصف / المجموعة</th>' : ''}
                        ${cols.phone ? '<th>الهاتف</th>' : ''}
                        ${cols.perf ? '<th>التقييم</th>' : ''}
                        ${cols.payment ? '<th>الدفع</th>' : ''}
                        ${cols.attendance ? '<th>آخر حضور</th>' : ''}
                    </tr>
                </thead>
                <tbody>
        `;
        
        studentsToPrint.forEach(s => {
            const group = appData.groups.find(g => g.id === s.groupId);
            let attendanceStr = '-';
            if(cols.attendance && group) {
                const groupSessions = appData.attendance.filter(a => a.groupId === group.id);
                if(groupSessions.length > 0) {
                    groupSessions.sort((a,b) => new Date(b.date) - new Date(a.date));
                    const status = groupSessions[0].records[s.id];
                    attendanceStr = status === 'present' ? 'حاضر' : (status === 'absent' ? 'غائب' : 'لم يسجل');
                }
            }
            let paymentStr = s.paymentStatus === 'paid' ? 'دفع' : (s.paymentStatus === 'special' ? 'معفى' : 'لم يدفع');
            html += `
                <tr>
                    ${cols.id ? `<td>#${s.internalGroupId || s.id}</td>` : ''}
                    <td><strong>${s.name}</strong></td>
                    ${cols.grade ? `<td>${gradeNames[s.grade]} - ${group ? group.name : ''}</td>` : ''}
                    ${cols.phone ? `<td>${s.phone1}</td>` : ''}
                    ${cols.perf ? `<td>${calculatePerformance(s)}%</td>` : ''}
                    ${cols.payment ? `<td>${paymentStr}</td>` : ''}
                    ${cols.attendance ? `<td>${attendanceStr}</td>` : ''}
                </tr>
            `;
        });
        
        html += `</tbody></table>`;
        container.innerHTML = html;
        document.getElementById('modal-print').classList.remove('show');
        window.print();
    });
}
"""
with open(os.path.join(js_dir, "ui", "printing.js"), "w", encoding="utf-8") as f:
    f.write(printing_code)

# 14. ui/auth.js
auth_code = """import { initData } from '../api/apiService.js';
import { navigateTo } from './navigation.js';

""" + get_lines(116, 170)
auth_code = "export function initAuth() {\n" + auth_code + "\n}\n"
with open(os.path.join(js_dir, "ui", "auth.js"), "w", encoding="utf-8") as f:
    f.write(auth_code)

# 15. ui/navigation.js
nav_code = """import { renderDashboard } from './dashboard.js';
import { renderGroups } from './groups.js';
import { renderStudents, prepareAddStudentForm } from './students.js';
import { renderPayments } from './payments.js';
import { renderLevels } from './levels.js';
import { renderProgress } from './progress.js';
import { renderExamsInit } from './exams.js';
import { renderAttendanceGroups } from './attendance.js';

""" + get_lines(86, 113) + "\n" + get_lines(178, 187)
nav_code = nav_code.replace("function navigateTo", "export function navigateTo")
nav_code = nav_code.replace("document.getElementById('btn-mobile-menu')", "export function initNavigation() {\n  document.getElementById('btn-mobile-menu')")
nav_code += "\n}\n"
with open(os.path.join(js_dir, "ui", "navigation.js"), "w", encoding="utf-8") as f:
    f.write(nav_code)


# 16. ui/modals.js
modals_code = """export function openModal(id) { document.getElementById(id).classList.add('show'); }
export function closeModal(id) { document.getElementById(id).classList.remove('show'); document.getElementById(id).classList.add('hidden'); }
export function initModals() {
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('show');
            e.target.closest('.modal').classList.add('hidden');
        });
    });
}
"""
with open(os.path.join(js_dir, "ui", "modals.js"), "w", encoding="utf-8") as f:
    f.write(modals_code)

# 17. main.js
main_code = """import { initData } from './api/apiService.js';
import { initAuth } from './ui/auth.js';
import { initNavigation } from './ui/navigation.js';
import { initModals } from './ui/modals.js';
import { initGroups } from './ui/groups.js';
import { initStudents } from './ui/students.js';
import { initPayments } from './ui/payments.js';
import { initLevels } from './ui/levels.js';
import { initProgress } from './ui/progress.js';
import { initExams } from './ui/exams.js';
import { initAttendance } from './ui/attendance.js';
import { initPrinting } from './ui/printing.js';

// Make functions global for inline onclick handlers in HTML
import { deleteGroup, filterStudentsByGroup } from './ui/groups.js';
import { viewStudent, deleteStudent, deleteAllStudents } from './ui/students.js';
import { changePaymentStatusForMonth, deletePaymentGlobal, openManualPaymentModal, deletePayment } from './ui/payments.js';
import { saveGradePrice } from './ui/levels.js';
import { toggleTask, deleteTask } from './ui/progress.js';
import { openEditExamModal, deleteExam, filterExamStudents } from './ui/exams.js';
import { toggleAttendance, openManualPaymentModalFor } from './ui/attendance.js';
import { printReport } from './ui/printing.js';
import { navigateTo } from './ui/navigation.js';

window.deleteGroup = deleteGroup;
window.filterStudentsByGroup = filterStudentsByGroup;
window.viewStudent = viewStudent;
window.deleteStudent = deleteStudent;
window.deleteAllStudents = deleteAllStudents;
window.changePaymentStatusForMonth = changePaymentStatusForMonth;
window.deletePaymentGlobal = deletePaymentGlobal;
window.openManualPaymentModal = openManualPaymentModal;
window.deletePayment = deletePayment;
window.saveGradePrice = saveGradePrice;
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.openEditExamModal = openEditExamModal;
window.deleteExam = deleteExam;
window.filterExamStudents = filterExamStudents;
window.toggleAttendance = toggleAttendance;
window.openManualPaymentModalFor = openManualPaymentModalFor;
window.printReport = printReport;
window.navigateTo = navigateTo;

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initNavigation();
    initModals();
    initGroups();
    initStudents();
    initPayments();
    initLevels();
    initProgress();
    initExams();
    initAttendance();
    initPrinting();
    
    // Check if user is already logged in
    const token = sessionStorage.getItem('token');
    if (token) {
        document.getElementById('page-login').classList.remove('active');
        document.getElementById('page-login').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        document.getElementById('display-teacher-id').innerText = `@${sessionStorage.getItem('username')}`;
        
        initData().then(() => {
            navigateTo('page-dashboard');
        });
    }
});
"""
with open(os.path.join(js_dir, "main.js"), "w", encoding="utf-8") as f:
    f.write(main_code)

print("Split script executed successfully!")
