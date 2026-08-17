import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { viewStudent } from './students.js';
import { closeModal } from './modals.js';

export function changePaymentStatus(id, newStatus) {
    const student = appData.students.find(s => s.id === id);
    if (!student) return;

    const oldStatus = student.paymentStatus;
    student.paymentStatus = newStatus;

    const price = student.customPrice ? student.customPrice : (appData.gradePrices[student.grade] || 0);

    // If changing to 'paid' from something else, record payment
    if (newStatus === 'paid' && oldStatus !== 'paid') {
        const paymentId = appData.payments.length > 0 ? Math.max(...appData.payments.map(p => p.id)) + 1 : 1;
        appData.payments.push({
            id: paymentId,
            studentId: id,
            amount: price,
            date: new Date().toISOString() // Full timestamp
        });
    } 
    // If changing from 'paid' to something else, remove the latest payment for this student (cancellation)
    else if (oldStatus === 'paid' && newStatus !== 'paid') {
        // Find latest payment for this student and remove it
        const paymentsReverse = [...appData.payments].reverse();
        const latestPayment = paymentsReverse.find(p => p.studentId === id);
        if (latestPayment) {
            appData.payments = appData.payments.filter(p => p.id !== latestPayment.id);
        }
    }

    saveData();
    renderPayments();
}

export function renderStudentPayments(student) {
    const tbody = document.querySelector('#student-payments-table tbody');
    tbody.innerHTML = '';
    
    const studentPayments = appData.payments.filter(p => p.studentId === student.id).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if(studentPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا توجد مدفوعات مسجلة</td></tr>';
        return;
    }
    
    studentPayments.forEach(p => {
        const d = new Date(p.date);
        const monthKey = p.targetMonth || `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const formattedDate = d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
        const notesStr = p.notes ? `<br><small class="text-muted">${p.notes}</small>` : '';
        
        tbody.innerHTML += `
            <tr>
                <td dir="ltr">${formattedDate}</td>
                <td>${monthKey} ${notesStr}</td>
                <td>${p.amount} ج.م</td>
                <td>
                    <button class="btn btn-sm btn-outline text-danger" onclick="deletePayment(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

export function openManualPaymentModal() {
    document.getElementById('modal-manual-payment').classList.remove('hidden');
    document.getElementById('modal-manual-payment').classList.add('show');
    const d = new Date();
    document.getElementById('manual-payment-month').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const student = appData.students.find(s => s.id === appData.currentStudentView);
    const actualPrice = student.customPrice !== null ? student.customPrice : (appData.gradePrices[student.grade] || 0);
    document.getElementById('manual-payment-amount').value = actualPrice;
}

export function deletePayment(paymentId) {
    if(confirm('هل أنت متأكد من حذف هذا السجل المالي؟ سيؤثر هذا على إيراداتك.')) {
        appData.payments = appData.payments.filter(p => p.id !== paymentId);
        saveData();
        viewStudent(appData.currentStudentView);
        if(document.getElementById('page-payments').classList.contains('hidden') === false) renderPayments();
    }
}

const origRenderPayments = renderPayments;
export function renderPayments() {
    const monthInput = document.getElementById('payment-month-filter');
    const searchInput = document.getElementById('payment-search-input')?.value.toLowerCase() || '';
    const gradeSelect = document.getElementById('payment-grade-filter');
    
    if (!monthInput) return;
    
    if (!monthInput.value) {
        const d = new Date();
        monthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    const selectedMonth = monthInput.value;
    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const isCurrentMonth = selectedMonth === currentMonth;

    if (gradeSelect && gradeSelect.options.length <= 1) {
        gradeSelect.innerHTML = '<option value="all">كل المستويات</option>';
        [1, 2, 3].forEach(g => {
            gradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
        });
    }
    const selectedGrade = gradeSelect ? gradeSelect.value : 'all';

    const tbody = document.querySelector('#payments-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

    let filteredStudents = appData.students;
    if (selectedGrade !== 'all') {
        filteredStudents = filteredStudents.filter(s => s.grade === parseInt(selectedGrade));
    }
    if (searchInput) {
        filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(searchInput));
    }

    filteredStudents.forEach(s => {
        const group = appData.groups.find(g => g.id === s.groupId);
        
        const hasPaid = appData.payments.some(p => p.studentId === s.id && (p.targetMonth === selectedMonth || p.date.startsWith(selectedMonth)));
        
        let statusBadge = hasPaid ? '<span class="badge badge-success">تم الدفع</span>' : '<span class="badge badge-danger">غير مدفوع</span>';
        if (s.paymentStatus === 'special') statusBadge = '<span class="badge badge-primary">خصم خاص</span>';

        const btnClass = hasPaid ? 'btn-danger' : 'btn-success';
        const btnText = hasPaid ? 'إلغاء الدفع' : 'دفع';
        const newStatus = hasPaid ? 'unpaid' : 'paid';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.internalGroupId || s.id}</td>
            <td><strong>${s.name}</strong></td>
            <td>${group ? group.name : '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm ${btnClass}" onclick="changePaymentStatusForMonth(${s.id}, '${newStatus}', '${selectedMonth}', ${isCurrentMonth})">${btnText}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    let totalRev = 0;
    let todayRev = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    appData.payments.forEach(p => {
        const pMonth = p.targetMonth || p.date.substring(0, 7);
        if (pMonth === selectedMonth) totalRev += p.amount;
        if (p.date.split('T')[0] === todayStr) todayRev += p.amount;
    });

    const monthEl = document.getElementById('stat-revenue-month');
    const todayEl = document.getElementById('stat-revenue-today');
    if (monthEl) monthEl.innerText = totalRev + ' ج.م';
    if (todayEl) todayEl.innerText = todayRev + ' ج.م';
}

export function changePaymentStatusForMonth(id, newStatus, monthStr, isCurrentMonth) {
    const student = appData.students.find(s => s.id === id);
    if (!student) return;

    const price = student.customPrice !== null ? student.customPrice : (appData.gradePrices[student.grade] || 0);

    if (isCurrentMonth) {
        student.paymentStatus = newStatus;
    }

    if (newStatus === 'paid') {
        appData.payments.push({
            id: Date.now(),
            studentId: id,
            amount: price,
            date: new Date().toISOString(),
            targetMonth: monthStr
        });
    } else {
        // Remove past payments for that month
        appData.payments = appData.payments.filter(p => !(p.studentId === id && (p.targetMonth === monthStr || p.date.startsWith(monthStr))));
    }

    saveData();
    renderPayments();
}

export function deletePaymentGlobal(id) {
    if(confirm('هل أنت متأكد من حذف هذه الدفعة نهائياً؟')) {
        appData.payments = appData.payments.filter(p => p.id !== id);
        saveData();
        renderPayments();
    }
}

export function initPayments() {
    document.getElementById('payment-grade-filter')?.addEventListener('change', renderPayments);
    document.getElementById('sort-payments')?.addEventListener('change', renderPayments);
    document.getElementById('manual-payment-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('manual-payment-amount').value);
        let monthStr = document.getElementById('manual-payment-month').value;
        const notes = document.getElementById('manual-payment-notes')?.value || '';
        if(!monthStr) {
            const d = new Date();
            monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
        
        const student = appData.students.find(s => s.id === appData.currentStudentView);
        if (student) {
            student.paymentStatus = 'paid';
        }

        appData.payments.push({
            id: Date.now(),
            studentId: appData.currentStudentView,
            amount: amount,
            date: new Date().toISOString(),
            targetMonth: monthStr,
            notes: notes
        });
        saveData();
        closeModal('modal-manual-payment');
        
        // Update views depending on where we are
        if (!document.getElementById('page-attendance').classList.contains('hidden')) {
            document.getElementById('btn-load-attendance')?.click();
        } else {
            viewStudent(appData.currentStudentView);
        }
        
        if(!document.getElementById('page-payments').classList.contains('hidden')) {
            renderPayments();
        }
    });
}
