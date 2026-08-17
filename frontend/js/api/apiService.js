import { appData, setAppData } from '../state/appState.js';
import { updateDateDisplay } from '../utils/helpers.js';
import { updateDashboardStats } from '../ui/dashboard.js';

export async function initData() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch('/api/user/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data) {
                setAppData(data);
                appData.globalExams = appData.globalExams || [];
                appData.attendance = appData.attendance || [];
                if(!appData.progress) appData.progress = {1:[], 2:[], 3:[]};
                if(!appData.gradePrices) appData.gradePrices = {1:0, 2:0, 3:0};
                if(!appData.payments) appData.payments = [];
            } else {
                await saveData();
            }
        }
        
        // Automatic Monthly Reset
        const currentMonthKey = new Date().getFullYear() + '-' + new Date().getMonth();
        if (appData.lastResetMonth !== currentMonthKey) {
            appData.students.forEach(s => {
                s.paymentStatus = 'unpaid';
            });
            appData.lastResetMonth = currentMonthKey;
            await saveData();
        }

    } catch (err) {
        console.error('Error fetching data:', err);
    }

    updateDashboardStats();
    updateDateDisplay();
}

export async function saveData() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
        await fetch('/api/user/data', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(appData)
        });
    } catch (err) {
        console.error('Error saving data:', err);
    }
    updateDashboardStats();
}
