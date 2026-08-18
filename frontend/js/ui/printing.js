import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance } from '../utils/helpers.js';
import { openModal } from './modals.js';

export function printReport(type) {
    // Override the old print buttons to open modal
    document.getElementById('modal-print').classList.add('show');
}


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
                
        // Give the DOM a tiny moment to hide the modal before triggering the browser's print dialog
        setTimeout(() => {
            window.print();
        }, 300);
    });
}
