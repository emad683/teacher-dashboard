import { appData, setAppData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { calculatePerformance, getGroupPerformance } from '../utils/helpers.js';

export function updateDashboardStats() {
    const totalStudents = appData.students.length;
    let totalScore = 0;
    let totalMax = 0;
    let pendingPayments = 0;

    appData.students.forEach(s => {
        if (!s.paymentStatus) pendingPayments++;
        s.exams.forEach(e => {
            totalScore += e.score;
            totalMax += e.max;
        });
    });

    const avgPerf = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

    document.getElementById('stat-total-students').innerText = totalStudents;
    document.getElementById('stat-avg-performance').innerText = `${avgPerf}%`;
    document.getElementById('stat-pending-payments').innerText = pendingPayments;
    document.getElementById('stat-total-groups').innerText = appData.groups.length;
}


export function renderWeakestGroups() {
    const tbody = document.querySelector('#weak-groups-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    
    [1, 2, 3].forEach(grade => {
        const gradeGroups = appData.groups.filter(g => g.grade === grade);
        if(gradeGroups.length > 0) {
            let weakest = gradeGroups[0];
            let minPerf = getGroupPerformance(weakest.id);
            
            gradeGroups.forEach(g => {
                const p = getGroupPerformance(g.id);
                if(p < minPerf) { minPerf = p; weakest = g; }
            });
            
            const badgeClass = minPerf >= 75 ? 'badge-success' : (minPerf >= 50 ? 'badge-warning' : 'badge-danger');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${gradeNames[grade]}</td>
                <td><strong>${weakest.name}</strong></td>
                <td><span class="badge ${badgeClass}">${minPerf}%</span></td>
            `;
            tbody.appendChild(tr);
        }
    });
}

export function renderDashboard() {
    updateDashboardStats();
    renderWeakestGroups();
    const tbody = document.querySelector('#recent-students-table tbody');
    tbody.innerHTML = '';
    const recent = [...appData.students].reverse().slice(0, 5);
    
    if(recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">لا يوجد طلاب مضافين</td></tr>';
    }

    recent.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${s.id}</td>
            <td><strong>${s.name}</strong></td>
            <td>${gradeNames[s.grade]}</td>
            <td><span class="badge badge-success">${calculatePerformance(s)}%</span></td>
        `;
        tbody.appendChild(tr);
    });

    // Progress Summary
    const progressContainer = document.getElementById('dashboard-progress-container');
    progressContainer.innerHTML = '';
    
    [1, 2, 3].forEach(grade => {
        const tasks = appData.progress[grade] || [];
        const completed = tasks.filter(t => t.done).length;
        const total = tasks.length;
        const perc = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        progressContainer.innerHTML += `
            <div style="margin-bottom: 1.5rem;">
                <div class="flex-between mb-2">
                    <strong>${gradeNames[grade]}</strong>
                    <span class="text-muted">${perc}% (${completed}/${total})</span>
                </div>
                <div style="height: 10px; background-color: var(--border); border-radius: 5px; overflow: hidden;">
                    <div style="height: 100%; width: ${perc}%; background-color: var(--primary); transition: width 0.3s;"></div>
                </div>
            </div>
        `;
    })};
