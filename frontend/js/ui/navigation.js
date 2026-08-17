import { renderDashboard } from './dashboard.js';
import { renderGroups } from './groups.js';
import { renderStudents, prepareAddStudentForm } from './students.js';
import { renderPayments } from './payments.js';
import { renderLevels } from './levels.js';
import { renderProgress } from './progress.js';
import { renderExamsInit } from './exams.js';
import { renderAttendanceGroups } from './attendance.js';

export function navigateTo(pageId) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
            document.getElementById('current-page-title').innerText = link.querySelector('span').innerText;
        }
    });

    if (pageId === 'page-dashboard') renderDashboard();
    if (pageId === 'page-groups') renderGroups();
    if (pageId === 'page-students') renderStudents();
    if (pageId === 'page-add-student') prepareAddStudentForm();
    if (pageId === 'page-payments') renderPayments();
    if (pageId === 'page-levels') renderLevels();
    if (pageId === 'page-progress') renderProgress();
    if (pageId === 'page-exams') renderExamsInit();
    if (pageId === 'page-attendance') {
        renderAttendanceGroups();
        document.getElementById('attendance-date').value = new Date().toISOString().split('T')[0];
    }

    document.querySelector('.sidebar').classList.remove('open');
}

export function initNavigation() {
  document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

}
