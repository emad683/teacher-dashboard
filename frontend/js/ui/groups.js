import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { openModal, closeModal } from './modals.js';
import { navigateTo } from './navigation.js';
import { getGroupPerformance } from '../utils/helpers.js';
import { saveData } from '../api/apiService.js';
import { renderStudents } from './students.js';

export function renderGroupsTabs() {
    const tabsContainer = document.getElementById('groups-grade-tabs');
    tabsContainer.innerHTML = '';
    [1, 2, 3].forEach(grade => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${appData.currentGradeView === grade ? 'active' : ''}`;
        btn.innerText = gradeNames[grade];
        btn.onclick = () => {
            appData.currentGradeView = grade;
            renderGroupsTabs();
            renderGroupsGrid();
        };
        tabsContainer.appendChild(btn);
    });
}

export function renderGroups() {
    renderGroupsTabs();
    renderGroupsGrid();
}

const origRenderGroupsGrid = renderGroupsGrid;
export function renderGroupsGrid() {
    const grid = document.getElementById('groups-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    let filtered = appData.groups;
    if(appData.currentGradeView !== 'all') {
        filtered = filtered.filter(g => g.grade === appData.currentGradeView);
    }
    
    const sortVal = document.getElementById('sort-groups')?.value || 'name-asc';
    filtered.sort((a, b) => {
        if(sortVal === 'name-asc') return a.name.localeCompare(b.name, 'ar');
        if(sortVal === 'name-desc') return b.name.localeCompare(a.name, 'ar');
        if(sortVal === 'perf-desc') return getGroupPerformance(b.id) - getGroupPerformance(a.id);
        if(sortVal === 'perf-asc') return getGroupPerformance(a.id) - getGroupPerformance(b.id);
        return 0;
    });

    if(filtered.length === 0) {
        grid.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">لا توجد مجموعات مسجلة.</p>';
        return;
    }

    filtered.forEach(g => {
        const studentCount = appData.students.filter(s => s.groupId === g.id).length;
        const perf = getGroupPerformance(g.id);
        const badgeClass = perf >= 75 ? 'text-success' : (perf >= 50 ? 'text-warning' : 'text-danger');
        
        const card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML = `
            <h4>${g.name}</h4>
            <div class="group-meta">
                <span><i class="fas fa-layer-group"></i> ${gradeNames[g.grade]}</span>
                <span><i class="far fa-clock"></i> ${g.schedule}</span>
                <span><i class="fas fa-users"></i> ${studentCount} طالب</span>
                <span class="${badgeClass}"><i class="fas fa-chart-line"></i> تقييم المجموعة: ${perf}%</span>
            </div>
            <div class="flex-between mt-3">
                <button class="btn btn-sm btn-primary" onclick="filterStudentsByGroup(${g.id})">الطلاب</button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteGroup(${g.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        grid.appendChild(card);
    });
}

export function initGroups() {
  document.getElementById('sort-groups')?.addEventListener('change', () => renderGroupsGrid());
  document.getElementById('btn-add-group')?.addEventListener('click', () => {
    document.getElementById('group-grade-val').value = appData.currentGradeView;
    document.getElementById('group-name').value = '';
    document.getElementById('group-schedule').value = '';
    openModal('modal-group');
});

  document.getElementById('group-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const grade = parseInt(document.getElementById('group-grade-val').value);
    
    if (!appData.gradePrices[grade] || appData.gradePrices[grade] <= 0) {
        alert('لا يمكنك إضافة مجموعة في هذا الصف لأنك لم تقم بتحديد سعر الشهر له. يرجى الذهاب لصفحة "المستويات" وتحديد سعر الشهر أولاً.');
        closeModal('modal-group');
        navigateTo('page-levels');
        return;
    }

    const name = document.getElementById('group-name').value;
    const schedule = document.getElementById('group-schedule').value;
    
    const newId = appData.groups.length > 0 ? Math.max(...appData.groups.map(g => g.id)) + 1 : 1;
    appData.groups.push({ id: newId, grade, name, schedule });
    saveData();
    closeModal('modal-group');
    renderGroupsGrid();
  })};


export function deleteGroup(id) {
    const studentsInGroup = appData.students.filter(s => s.groupId === id);
    if(studentsInGroup.length > 0) {
        alert("لا يمكن حذف المجموعة لأنها تحتوي على طلاب. قم بنقلهم أو حذفهم أولاً.");
        return;
    }
    if(confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
        appData.groups = appData.groups.filter(g => g.id !== id);
        saveData();
        renderGroupsGrid();
    }
}

export function filterStudentsByGroup(groupId) {
    navigateTo('page-students');
    renderStudents(groupId);
}
