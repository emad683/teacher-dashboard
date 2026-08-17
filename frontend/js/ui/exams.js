import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { closeModal } from './modals.js';
import { viewStudent } from './students.js';

export function renderExamsTableForStudent(student) {
    const tbody = document.querySelector('#student-exams-table tbody');
    tbody.innerHTML = '';
    
    if(student.exams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد امتحانات مسجلة</td></tr>';
    }

    student.exams.forEach(e => {
        const perc = Math.round((e.score / e.max) * 100);
        const badgeClass = perc >= 75 ? 'badge-success' : (perc >= 50 ? 'badge-warning' : 'badge-danger');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${e.date}</td>
            <td>${e.name}</td>
            <td>${e.score} من ${e.max}</td>
            <td><span class="badge ${badgeClass}">${perc}%</span></td>
            <td class="print-hide">
                <button class="btn btn-sm btn-outline text-primary" onclick="openEditExamModal(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteExam(${e.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function openEditExamModal(examId) {
    const student = appData.students.find(s => s.id === appData.currentStudentView);
    if(!student) return;
    const exam = student.exams.find(e => e.id === examId);
    if(!exam) return;
    
    document.getElementById('edit-exam-id').value = examId;
    document.getElementById('edit-exam-score').value = exam.score;
    document.getElementById('edit-exam-score').max = exam.max;
    
    document.getElementById('modal-edit-exam').classList.add('show');
}

export function deleteExam(examId) {
    if(confirm('هل تريد حذف هذه الدرجة؟')) {
        const student = appData.students.find(s => s.id === appData.currentStudentView);
        student.exams = student.exams.filter(e => e.id !== examId);
        saveData();
        viewStudent(appData.currentStudentView);
    }
}

export function renderExamsInit() {
    const newExamGradeSelect = document.getElementById('new-exam-grade');
    const entryExamGradeSelect = document.getElementById('entry-exam-grade');
    
    newExamGradeSelect.innerHTML = '<option value="">اختر المستوى...</option>';
    entryExamGradeSelect.innerHTML = '<option value="">اختر المستوى أولاً...</option>';
    
    [1, 2, 3].forEach(g => {
        newExamGradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
        entryExamGradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
    });
    
    document.getElementById('bulk-exam-container').classList.add('hidden');
    document.getElementById('create-exam-form').reset();
    document.getElementById('entry-exam-select').innerHTML = '<option value="">اختر الامتحان...</option>';
    document.getElementById('entry-exam-select').disabled = true;
    document.getElementById('entry-group-select').innerHTML = '<option value="">اختر المجموعة...</option>';
    document.getElementById('entry-group-select').disabled = true;
}

export function loadBulkStudentsTable() {
    const grade = parseInt(document.getElementById('entry-exam-grade').value);
    const examId = parseInt(document.getElementById('entry-exam-select').value);
    const groupId = parseInt(document.getElementById('entry-group-select').value);
    const container = document.getElementById('bulk-exam-container');
    const tbody = document.querySelector('#exam-entry-table tbody');
    tbody.innerHTML = '';
    
    if (!grade || !examId || !groupId) {
        container.classList.add('hidden');
        return;
    }
    
    const targetStudents = appData.students.filter(s => s.groupId === groupId);
    
    if(targetStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">لا يوجد طلاب في هذه المجموعة</td></tr>';
    } else {
        targetStudents.forEach(s => {
            const existingExam = s.exams.find(ex => ex.name === appData.globalExams.find(e => e.id === examId).name);
            const defaultVal = existingExam ? existingExam.score : 0;
            
            tbody.innerHTML += `
                <tr data-student-id="${s.id}">
                    <td>#${s.internalGroupId||s.id}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>
                        <input type="number" class="form-control bulk-score-input" value="${defaultVal}" min="0" style="width: 150px;">
                    </td>
                </tr>
            `;
        });
    }
    
    container.classList.remove('hidden');
}

export function filterExamStudents() {
    const input = document.getElementById('exam-search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#exam-entry-table tbody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

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
