import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';

export function renderProgressTabs() {
    const tabsContainer = document.getElementById('progress-grade-tabs');
    tabsContainer.innerHTML = '';
    [1, 2, 3].forEach(grade => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${appData.currentProgressGrade === grade ? 'active' : ''}`;
        btn.innerText = gradeNames[grade];
        btn.onclick = () => {
            appData.currentProgressGrade = grade;
            renderProgress();
        };
        tabsContainer.appendChild(btn);
    });
}

export function renderProgress() {
    renderProgressTabs();
    const grade = appData.currentProgressGrade;
    const tasks = appData.progress[grade] || [];
    
    const completed = tasks.filter(t => t.done).length;
    const total = tasks.length;
    const perc = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('progress-bar-fill').style.width = `${perc}%`;
    document.getElementById('progress-text').innerText = `تم إنجاز ${perc}% (${completed} من ${total} دروس/مهام)`;
    
    const list = document.getElementById('tasks-list');
    list.innerHTML = '';
    
    if(tasks.length === 0) {
        list.innerHTML = '<p class="text-muted text-center py-4">لم يتم إضافة مهام/دروس لهذا المنهج بعد.</p>';
    }

    tasks.forEach(t => {
        list.innerHTML += `
            <li class="task-item ${t.done ? 'completed' : ''}">
                <div class="flex-between w-100" style="width: 100%;">
                    <span>${t.title}</span>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''} onchange="toggleTask(${t.id})">
                        <button class="btn-icon text-danger" style="font-size: 1rem;" onclick="deleteTask(${t.id})"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            </li>
        `;
    });
}

export function toggleTask(id) {
    const grade = appData.currentProgressGrade;
    const task = appData.progress[grade].find(t => t.id === id);
    if(task) {
        task.done = !task.done;
        saveData();
        renderProgress();
    }
}

export function deleteTask(id) {
    const grade = appData.currentProgressGrade;
    appData.progress[grade] = appData.progress[grade].filter(t => t.id !== id);
    saveData();
    renderProgress();
}

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
