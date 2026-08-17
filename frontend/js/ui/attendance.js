import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { renderPayments } from './payments.js';

export function renderAttendanceGroups() {
    const gradeSelect = document.getElementById('attendance-grade-filter');
    if(gradeSelect.options.length <= 1) {
        gradeSelect.innerHTML = '<option value="">اختر الصف...</option>';
        [1, 2, 3].forEach(g => {
            gradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
        });
    }
}

export function renderAttendanceTable(groupId, session) {
    const container = document.getElementById('attendance-students-container');
    const tbody = document.querySelector('#attendance-table tbody');
    tbody.innerHTML = '';
    
    const students = appData.students.filter(s => s.groupId === groupId);
    if(students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا يوجد طلاب في هذه المجموعة</td></tr>';
    } else {
        let presentCount = 0;
        let absentCount = 0;
        
        students.forEach(s => {
            const status = session.records[s.id] === 'present' ? 'present' : 'absent';
            if (status === 'present') presentCount++;
            else absentCount++;
            
            const d = new Date();
            const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const hasPaidThisMonth = appData.payments.some(p => p.studentId === s.id && (p.targetMonth === currentMonthStr || p.date.startsWith(currentMonthStr)));

            const paymentBtn = hasPaidThisMonth
                ? `<button class="btn btn-sm btn-success" disabled><i class="fas fa-check"></i> تم الدفع</button>`
                : `<button class="btn btn-sm btn-outline text-success" onclick="quickPayForAttendance(${s.id})"><i class="fas fa-money-bill"></i> دفع سريع</button>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${s.internalGroupId || s.id}</td>
                <td><strong>${s.name}</strong></td>
                <td>
                    <button class="btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-danger'}" onclick="toggleAttendance(${session.id}, ${s.id})">
                        ${status === 'present' ? '<i class="fas fa-check"></i> حاضر' : '<i class="fas fa-times"></i> غائب'}
                    </button>
                </td>
                <td>${paymentBtn}</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('attendance-stats').innerText = `${presentCount} حاضر / ${absentCount} غائب`;
    }
    container.classList.remove('hidden');
}

export function toggleAttendance(sessionId, studentId) {
    const session = appData.attendance.find(a => a.id === sessionId);
    if(session) {
        const current = session.records[studentId];
        session.records[studentId] = current === 'present' ? 'absent' : 'present';
        saveData();
        renderAttendanceTable(session.groupId, session);
    }
}

export function quickPayForAttendance(studentId) {
    const student = appData.students.find(s => s.id === studentId);
    if (!student) return;

    const d = new Date();
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const hasPaidThisMonth = appData.payments.some(p => p.studentId === student.id && (p.targetMonth === monthStr || p.date.startsWith(monthStr)));

    if (hasPaidThisMonth) return;
    
    student.paymentStatus = 'paid';
    const price = student.customPrice !== null ? student.customPrice : (appData.gradePrices[student.grade] || 0);
    
    appData.payments.push({
        id: Date.now(),
        studentId: studentId,
        amount: price,
        date: d.toISOString(),
        targetMonth: monthStr,
        notes: 'دفع سريع من سجل الحضور'
    });
    
    saveData();
    // Refresh attendance table
    const groupId = parseInt(document.getElementById('attendance-group-filter').value);
    const dateStr = document.getElementById('attendance-date').value;
    if(groupId && dateStr) {
        const session = appData.attendance.find(a => a.groupId === groupId && a.date === dateStr);
        if (session) {
            renderAttendanceTable(groupId, session);
        }
    }
    // Update global revenue
    if(!document.getElementById('page-payments').classList.contains('hidden')) {
        renderPayments();
    }
}

export function renderStudentAttendanceHistory(student) {
    const tbody = document.querySelector('#student-attendance-table tbody');
    tbody.innerHTML = '';
    
    const groupSessions = appData.attendance.filter(a => a.groupId === student.groupId);
    if(groupSessions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="text-center text-muted">لا يوجد سجل حضور مسجل</td></tr>';
        return;
    }
    
    groupSessions.sort((a,b) => new Date(b.date) - new Date(a.date));
    
    groupSessions.forEach(session => {
        const status = session.records[student.id] === 'present' ? 'present' : 'absent';
        const badge = status === 'present' ? '<span class="badge badge-success">حاضر</span>' : '<span class="badge badge-danger">غائب</span>';
        tbody.innerHTML += `
            <tr>
                <td>${session.date}</td>
                <td>${badge}</td>
            </tr>
        `;
    });
}

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
