// Admin authentication and data fetching
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const errorMsg = document.getElementById('admin-login-error');
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.role !== 'admin') {
                errorMsg.innerText = 'هذا الحساب ليس لديه صلاحيات الإدارة';
                errorMsg.style.display = 'block';
                return;
            }
            
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('adminUsername', data.username);
            
            document.getElementById('page-login').classList.remove('active');
            document.getElementById('page-login').classList.add('hidden');
            document.getElementById('app-layout').classList.remove('hidden');
            document.getElementById('admin-name').innerText = data.username;
            
            fetchUsers();
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

document.getElementById('btn-admin-logout').addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminUsername');
    window.location.reload();
});

// Modals
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('show');
    });
});

// Fetch Users
async function fetchUsers() {
    const token = sessionStorage.getItem('adminToken');
    if (!token) return;

    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const users = await response.json();
            renderUsers(users);
        } else if (response.status === 401 || response.status === 403) {
            alert('انتهت الجلسة، يرجى تسجيل الدخول مجدداً');
            document.getElementById('btn-admin-logout').click();
        }
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

function renderUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${u.id}</td>
            <td><strong>${u.username}</strong></td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-success'}">${u.role === 'admin' ? 'مدير' : 'معلم'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline text-primary" onclick="editUser(${u.id}, '${u.username}', '${u.role}')"><i class="fas fa-edit"></i> تعديل</button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteUser(${u.id})"><i class="fas fa-trash"></i> حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Create/Update User
document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('adminToken');
    const id = document.getElementById('edit-user-id').value;
    const username = document.getElementById('user-username').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    
    const url = id ? `/api/admin/users/${id}` : '/api/admin/users';
    const method = id ? 'PUT' : 'POST';
    
    const body = { username, role };
    if (password) body.password = password; // Only send if updating password or new user

    try {
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        if (response.ok) {
            closeModal('modal-user');
            fetchUsers();
            document.getElementById('user-form').reset();
            document.getElementById('edit-user-id').value = '';
        } else {
            const data = await response.json();
            alert(data.error || 'حدث خطأ');
        }
    } catch (err) {
        alert('حدث خطأ في الاتصال');
    }
});

window.editUser = function(id, username, role) {
    document.getElementById('user-modal-title').innerText = 'تعديل مستخدم';
    document.getElementById('edit-user-id').value = id;
    document.getElementById('user-username').value = username;
    document.getElementById('user-password').value = ''; // Leave blank
    document.getElementById('user-role').value = role;
    
    // Require password only for new users
    document.getElementById('user-password').required = false;
    openModal('modal-user');
};

document.querySelector('.admin-actions .btn-primary').addEventListener('click', () => {
    document.getElementById('user-modal-title').innerText = 'إضافة مستخدم جديد';
    document.getElementById('user-form').reset();
    document.getElementById('edit-user-id').value = '';
    document.getElementById('user-password').required = true;
});

window.deleteUser = async function(id) {
    if(!confirm('هل أنت متأكد من حذف هذا المستخدم وبياناته بالكامل؟')) return;
    
    const token = sessionStorage.getItem('adminToken');
    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            fetchUsers();
        } else {
            const data = await response.json();
            alert(data.error || 'حدث خطأ');
        }
    } catch (err) {
        alert('حدث خطأ في الاتصال');
    }
};

// Check if already logged in
window.onload = () => {
    const token = sessionStorage.getItem('adminToken');
    const username = sessionStorage.getItem('adminUsername');
    if (token) {
        document.getElementById('page-login').classList.remove('active');
        document.getElementById('page-login').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        document.getElementById('admin-name').innerText = username;
        fetchUsers();
    }
};
