import { appData } from '../state/appState.js';
import { gradeNames } from '../config.js';
import { saveData } from '../api/apiService.js';
import { navigateTo } from './navigation.js';

export function renderLevels() {
    const list = document.getElementById('levels-list');
    list.innerHTML = '';
    [1, 2, 3].forEach(grade => {
        const students = appData.students.filter(s => s.grade === grade).length;
        const groups = appData.groups.filter(g => g.grade === grade).length;
        const currentPrice = appData.gradePrices[grade] || 0;
        
        list.innerHTML += `
            <li style="padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h4 style="margin-bottom: 0.25rem;">${gradeNames[grade]}</h4>
                    <span class="text-muted" style="font-size: 0.9rem;">إجمالي المقيدين: ${students} طالب في ${groups} مجموعة</span>
                </div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <label style="margin: 0; white-space: nowrap;">سعر الشهر:</label>
                        <input type="number" id="price-input-${grade}" class="form-control" value="${currentPrice}" style="width: 100px; padding: 0.2rem;" min="0">
                        <button class="btn btn-sm btn-success" onclick="saveGradePrice(${grade})">حفظ السعر</button>
                    </div>
                    <button class="btn btn-outline text-primary" onclick="appData.currentGradeView=${grade}; navigateTo('page-groups');">إدارة المجوعات</button>
                </div>
            </li>
        `;
    });
}

export function saveGradePrice(grade) {
    const priceInput = document.getElementById(`price-input-${grade}`).value;
    if (priceInput !== "") {
        appData.gradePrices[grade] = parseFloat(priceInput);
        saveData();
        alert('تم حفظ السعر بنجاح!');
    }
}

export function initLevels() {
    document.getElementById('update-prices-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        appData.gradePrices[1] = parseFloat(document.getElementById('price-grade-1').value) || 0;
        appData.gradePrices[2] = parseFloat(document.getElementById('price-grade-2').value) || 0;
        appData.gradePrices[3] = parseFloat(document.getElementById('price-grade-3').value) || 0;
        saveData();
        alert('تم حفظ التسعيرة الجديدة بنجاح');
    });
}
