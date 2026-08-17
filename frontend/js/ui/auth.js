export function initAuth() {
import { initData } from '../api/apiService.js';
import { navigateTo } from './navigation.js';

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if(data.role === 'admin') {
                window.location.href = '/admin'; // Redirect admins to admin dashboard
                return;
            }
            
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('username', data.username);
            sessionStorage.setItem('role', data.role);
            
            document.getElementById('page-login').classList.remove('active');
            document.getElementById('page-login').classList.add('hidden');
            document.getElementById('app-layout').classList.remove('hidden');
            document.getElementById('display-teacher-id').innerText = `@${data.username}`;
            
            await initData();
            navigateTo('page-dashboard');
            errorMsg.style.display = 'none';
        } else {
            errorMsg.innerText = data.error || 'بيانات الدخول غير صحيحة';
            errorMsg.style.display = 'block';
        }
    } catch (err) {
        errorMsg.innerText = 'حدث خطأ في الاتصال بالسيرفر';
        errorMsg.style.display = 'block';
    }
});

document.getElementById('btn-logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
    
    document.getElementById('app-layout').classList.add('hidden');
    document.getElementById('page-login').classList.remove('hidden');
    document.getElementById('page-login').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('login-error').style.display = 'none';
});

}
