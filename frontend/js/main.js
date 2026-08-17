import { initData } from './api/apiService.js';
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
