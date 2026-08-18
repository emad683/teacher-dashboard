import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance } from '../utils/helpers.js';
import { saveData } from '../api/apiService.js';
import { renderExamsTableForStudent } from './exams.js';
import { renderStudentPayments } from './payments.js';
import { renderStudentAttendanceHistory } from './attendance.js';
import { navigateTo } from './navigation.js';
import { renderDashboard } from './dashboard.js';
import { renderPayments } from './payments.js';

export function populateGradeFilters() {
    const filter = document.getElementById('filter-grade');
    filter.innerHTML = '<option value="all">كل المستويات</option>';
    [1, 2, 3].forEach(g => {
        filter.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
    });
}

const origRenderStudents = renderStudents;
export function renderStudents(forceGroupId = null) {
    if(document.getElementById('filter-grade').options.length <= 1) populateGradeFilters();
    
    const tbody = document.querySelector('#students-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    const filterGrade = document.getElementById('filter-grade').value;
    const filterGroup = document.getElementById('filter-group')?.value || 'all';
    const search = document.getElementById('search-student').value.toLowerCase();
    const sortVal = document.getElementById('sort-students')?.value || 'id-asc';
    const unpaidOnly = document.getElementById('filter-unpaid')?.checked || false;
    
    let filtered = appData.students;
    
    if (forceGroupId) {
        filtered = filtered.filter(s => s.groupId === forceGroupId);
    } else {
        if (filterGrade !== 'all') {
            filtered = filtered.filter(s => s.grade === parseInt(filterGrade));
        }
        if (filterGroup !== 'all') {
            filtered = filtered.filter(s => s.groupId === parseInt(filterGroup));
        }
        if (search) {
            filtered = filtered.filter(s => s.name.toLowerCase().includes(search));
        }
        if (unpaidOnly) {
            filtered = filtered.filter(s => s.paymentStatus !== 'paid' && s.paymentStatus !== 'special');
        }
    }
    
    // Sort
    filtered.sort((a, b) => {
        if(sortVal === 'id-asc') return (a.internalGroupId||a.id) - (b.internalGroupId||b.id);
        if(sortVal === 'id-desc') return (b.internalGroupId||b.id) - (a.internalGroupId||a.id);
        if(sortVal === 'name-asc') return a.name.localeCompare(b.name, 'ar');
        if(sortVal === 'name-desc') return b.name.localeCompare(a.name, 'ar');
        if(sortVal === 'score-desc') return calculatePerformance(b) - calculatePerformance(a);
        return 0;
    });

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">لم يتم العثور على طلاب</td></tr>';
    }

    filtered.forEach(s => {
        const group = appData.groups.find(g => g.id === s.groupId);
        let attendanceBadge = '';
        
        if (forceGroupId) {
            const groupSessions = appData.attendance.filter(a => a.groupId === forceGroupId);
            if (groupSessions.length > 0) {
                groupSessions.sort((a,b) => new Date(b.date) - new Date(a.date));
                const latestSession = groupSessions[0];
                const status = latestSession.records[s.id] === 'present' ? 'present' : 'absent';
                if (status === 'present') {
                    attendanceBadge = `<br><span class="badge badge-success" style="font-size:0.7rem; padding: 2px 4px;">حاضر (آخر حصة)</span>`;
                } else {
                    attendanceBadge = `<br><span class="badge badge-danger" style="font-size:0.7rem; padding: 2px 4px;">غائب (آخر حصة)</span>`;
                }
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.internalGroupId || s.id}</td>
            <td><strong>${s.name}</strong></td>
            <td>${gradeNames[s.grade]}<br><small class="text-muted">${group ? group.name : ''}</small>${attendanceBadge}</td>
            <td>${s.phone1}</td>
            <td>${calculatePerformance(s)}%</td>
            <td>
                <button class="btn btn-sm btn-outline text-primary" onclick="viewStudent(${s.id})" title="عرض الملف"><i class="fas fa-user"></i></button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteStudent(${s.id})" title="حذف الطالب"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function deleteStudent(id) {
    if(confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) {
        appData.students = appData.students.filter(s => s.id !== id);
        saveData();
        renderStudents();
    }
}

export async function deleteAllStudents() {
    if(confirm('هل أنت متأكد من أنك تريد حذف جميع الطلاب من الموقع تماماً؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        appData.students = [];
        appData.payments = [];
        saveData();
        appData.students = [];
        appData.payments = [];
        appData.attendance = [];
        appData.globalExams = [];
        
        if (appData.progress) {
            for (let grade in appData.progress) {
                appData.progress[grade].forEach(task => {
                    task.done = false;
                });
            }
        }
        await saveData();
        alert('تم تفريغ بيانات الطلاب، المدفوعات، الحضور، والامتحانات، مع الاحتفاظ بالمجموعات وإلغاء تحديد المهام.');
        window.location.reload();
    }
}

export function prepareAddStudentForm() {
    document.getElementById('student-form').reset();
    document.getElementById('student-group').disabled = true;
    
    const gradeSelect = document.getElementById('student-grade');
    gradeSelect.innerHTML = '<option value="">اختر المستوى...</option>';
    [1, 2, 3].forEach(g => {
        gradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
    });
}

document.getElementById('student-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customPriceInput = document.getElementById('student-custom-price').value;
    
    const studentData = {
        name: document.getElementById('student-name').value,
        grade: parseInt(document.getElementById('student-grade').value),
        groupId: parseInt(document.getElementById('student-group').value),
        phone1: document.getElementById('parent-phone-1').value,
        phone2: document.getElementById('parent-phone-2').value || "",
        customPrice: customPriceInput ? parseFloat(customPriceInput) : null,
        paymentStatus: 'unpaid' // unpaid, paid, special
    };

    const groupStudents = appData.students.filter(s => s.groupId === studentData.groupId);
    const internalGroupId = groupStudents.length > 0 ? Math.max(...groupStudents.map(s => s.internalGroupId || 0)) + 1 : 1;
    
    const newId = appData.students.length > 0 ? Math.max(...appData.students.map(s => s.id)) + 1 : 1;
    appData.students.push({
        id: newId,
        internalGroupId: internalGroupId,
        ...studentData,
        exams: []
    });

    saveData();
    navigateTo('page-students');
});

// --- Student Details ---
export function viewStudent(id) {
    appData.currentStudentView = id;
    const s = appData.students.find(st => st.id === id);
    const group = appData.groups.find(g => g.id === s.groupId);
    
    document.getElementById('detail-name').innerText = s.name;
    const displayId = s.internalGroupId || s.id; 
    document.getElementById('detail-meta').innerText = `رقم: ${displayId} | ${gradeNames[s.grade]} - ${group ? group.name : ''}`;
    
    document.getElementById('detail-phone-1').innerText = s.phone1;
    document.getElementById('detail-phone-2').innerText = s.phone2 || 'لا يوجد';

    const perf = calculatePerformance(s);
    document.getElementById('detail-performance-val').innerText = `${perf}%`;
    
    const passedExams = s.exams.filter(e => (e.score / e.max) >= 0.75).length;
    document.getElementById('detail-passed-exams').innerText = `${passedExams} من ${s.exams.length}`;

    renderExamsTableForStudent(s);
    renderStudentPayments(s);
    renderStudentAttendanceHistory(s);
    navigateTo('page-student-details');
}

export function initStudents() {
    document.getElementById('filter-grade')?.addEventListener('change', (e) => {
        const grade = e.target.value;
        const groupFilter = document.getElementById('filter-group');
        if (groupFilter) {
            groupFilter.innerHTML = '<option value="all">كل المجموعات</option>';
            if (grade !== 'all') {
                const groups = appData.groups.filter(g => g.grade === parseInt(grade));
                groups.forEach(g => {
                    groupFilter.innerHTML += `<option value="${g.id}">${g.name}</option>`;
                });
            }
        }
        renderStudents();
    });
    document.getElementById('filter-group')?.addEventListener('change', () => renderStudents());
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
