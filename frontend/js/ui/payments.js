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
    const monthSelect = document.getElementById('filter-payment-month');
    const sortVal = document.getElementById('sort-payments')?.value || 'date-desc';
    const gradeSelect = document.getElementById('payment-grade-filter');
    const selectedGrade = gradeSelect ? parseInt(gradeSelect.value) : 0;
    
    // populate months
    const months = [...new Set(appData.payments.map(p => {
        if(p.targetMonth) return p.targetMonth;
        const d = new Date(p.date);
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    }))].sort().reverse();

    if(monthSelect.options.length <= 1) {
        monthSelect.innerHTML = '<option value="all">كل الشهور</option>';
        months.forEach(m => {
            monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
        });
        if(months.length > 0) monthSelect.value = months[0];
    }
    
    const selectedMonth = monthSelect.value;
    
    let filtered = appData.payments;
    
    if (selectedGrade) {
        filtered = filtered.filter(p => {
            const s = appData.students.find(st => st.id === p.studentId);
            return s && s.grade === selectedGrade;
        });
    }

    if(selectedMonth !== 'all') {
        filtered = filtered.filter(p => {
            const m = p.targetMonth || (new Date(p.date).getFullYear() + '-' + String(new Date(p.date).getMonth() + 1).padStart(2, '0'));
            return m === selectedMonth;
        });
    }
    
    filtered.sort((a,b) => {
        if(sortVal === 'date-desc') return new Date(b.date) - new Date(a.date);
        if(sortVal === 'date-asc') return new Date(a.date) - new Date(b.date);
        if(sortVal === 'amount-desc') return b.amount - a.amount;
        return 0;
    });

    const tbody = document.querySelector('#payments-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    let totalRev = 0;
    let todayRev = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    filtered.forEach(p => {
        totalRev += p.amount;
        const d = new Date(p.date);
        if(d.toISOString().split('T')[0] === todayStr) todayRev += p.amount;
        
        const s = appData.students.find(st => st.id === p.studentId);
        const notesStr = p.notes ? `<br><small class="text-muted">${p.notes}</small>` : '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.toLocaleString('ar-EG')}</td>
            <td>${s ? s.name : 'طالب محذوف'} ${notesStr}</td>
            <td>${p.amount} ج.م</td>
            <td>
                <button class="btn btn-sm btn-outline text-danger" onclick="deletePaymentGlobal(${p.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-revenue-month').innerText = totalRev + ' ج.م';
    document.getElementById('stat-revenue-today').innerText = todayRev + ' ج.م';
}

export function changePaymentStatusForMonth(id, newStatus, monthStr, isCurrentMonth) {
    const student = appData.students.find(s => s.id === id);
    if (!student) return;

    const price = student.customPrice !== null ? student.customPrice : (appData.gradePrices[student.grade] || 0);

    if (isCurrentMonth) {
        const oldStatus = student.paymentStatus;
        student.paymentStatus = newStatus;

        if (newStatus === 'paid' && oldStatus !== 'paid') {
            appData.payments.push({
                id: Date.now(),
                studentId: id,
                amount: price,
                date: new Date().toISOString()
            });
        } 
        else if (oldStatus === 'paid' && newStatus !== 'paid') {
            const paymentsReverse = [...appData.payments].reverse();
            const latestPayment = paymentsReverse.find(p => p.studentId === id && p.date.startsWith(monthStr));
            if (latestPayment) {
                appData.payments = appData.payments.filter(p => p.id !== latestPayment.id);
            }
        }
    } else {
        // Changing past month
        if (newStatus === 'paid') {
            appData.payments.push({
                id: Date.now(),
                studentId: id,
                amount: price,
                // Add it to the 1st of the past month, but keep track of actual creation time if needed.
                // For simplicity, date is set to the requested month.
                date: `${monthStr}-01T12:00:00.000Z`
            });
        } else {
            // Remove past payments for that month
            appData.payments = appData.payments.filter(p => !(p.studentId === id && p.date.startsWith(monthStr)));
        }
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
