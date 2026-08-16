// --- State Management & Mock Data ---
let appData = {
    groups: [],
    students: [],
    payments: [],
    gradePrices: { 1: 0, 2: 0, 3: 0 },
    lastResetMonth: null,
    progress: {
        1: [],
        2: [],
        3: []
    },
    currentGradeView: 1,
    currentProgressGrade: 1,
    currentStudentView: null
};

const gradeNames = {
    1: "الصف الأول الثانوي",
    2: "الصف الثاني الثانوي",
    3: "الصف الثالث الثانوي"
};

// Initialize from API
async function initData() {
    const token = sessionStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch('/api/user/data', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data) {
                appData = data;
                if(!appData.progress) appData.progress = {1:[], 2:[], 3:[]};
                if(!appData.gradePrices) appData.gradePrices = {1:0, 2:0, 3:0};
                if(!appData.payments) appData.payments = [];
                if(!appData.globalExams) appData.globalExams = [];
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

async function saveData() {
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



// --- Navigation & SPA Logic ---
function navigateTo(pageId) {
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

    document.querySelector('.sidebar').classList.remove('open');
}

// --- Authentication ---
document.getElementById('login-form').addEventListener('submit', async (e) => {
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

document.getElementById('btn-logout').addEventListener('click', () => {
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

// --- UI Helpers ---
function updateDateDisplay() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('ar-EG', options);
}

document.getElementById('btn-mobile-menu').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo(link.dataset.page);
    });
});

// --- Modals ---
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.remove('show');
    });
});

// --- Dashboard ---
function updateDashboardStats() {
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

function renderDashboard() {
    updateDashboardStats();
    
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
    });
}

function calculatePerformance(student) {
    if (!student.exams || student.exams.length === 0) return 0;
    let score = 0, max = 0;
    student.exams.forEach(e => { score += e.score; max += e.max; });
    return max > 0 ? Math.round((score / max) * 100) : 0;
}

// --- Groups & Grades ---
function renderGroupsTabs() {
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

function renderGroups() {
    renderGroupsTabs();
    renderGroupsGrid();
}

function renderGroupsGrid() {
    const grade = appData.currentGradeView;
    const grid = document.getElementById('groups-grid');
    grid.innerHTML = '';
    
    const groups = appData.groups.filter(g => g.grade === grade);
    if(groups.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">لا توجد مجموعات لهذا المستوى حالياً.</p>';
    }

    groups.forEach(g => {
        const studentCount = appData.students.filter(s => s.groupId === g.id).length;
        const div = document.createElement('div');
        div.className = 'group-card';
        div.innerHTML = `
            <h4>${g.name}</h4>
            <div class="group-meta">
                <span><i class="far fa-clock"></i> ${g.schedule}</span>
                <span><i class="fas fa-users"></i> ${studentCount} طالب</span>
            </div>
            <div class="flex-between mt-3">
                <button class="btn btn-sm btn-outline text-primary" onclick="filterStudentsByGroup(${g.id})">عرض الطلاب</button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteGroup(${g.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        grid.appendChild(div);
    });
}

document.getElementById('btn-add-group').addEventListener('click', () => {
    document.getElementById('group-grade-val').value = appData.currentGradeView;
    document.getElementById('group-name').value = '';
    document.getElementById('group-schedule').value = '';
    openModal('modal-group');
});

document.getElementById('group-form').addEventListener('submit', (e) => {
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
});

function deleteGroup(id) {
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

function filterStudentsByGroup(groupId) {
    navigateTo('page-students');
    renderStudents(groupId);
}

// --- Students List ---
document.getElementById('filter-grade').addEventListener('change', () => renderStudents());
document.getElementById('search-student').addEventListener('input', () => renderStudents());

function populateGradeFilters() {
    const filter = document.getElementById('filter-grade');
    filter.innerHTML = '<option value="all">كل المستويات</option>';
    [1, 2, 3].forEach(g => {
        filter.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
    });
}

function renderStudents(forceGroupId = null) {
    if(document.getElementById('filter-grade').options.length <= 1) populateGradeFilters();
    
    const tbody = document.querySelector('#students-table tbody');
    tbody.innerHTML = '';
    
    const filterGrade = document.getElementById('filter-grade').value;
    const search = document.getElementById('search-student').value.toLowerCase();
    
    let filtered = appData.students;
    
    if (forceGroupId) {
        filtered = filtered.filter(s => s.groupId === forceGroupId);
    } else {
        if (filterGrade !== 'all') {
            filtered = filtered.filter(s => s.grade === parseInt(filterGrade));
        }
        if (search) {
            filtered = filtered.filter(s => s.name.toLowerCase().includes(search));
        }
    }

    if(filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">لم يتم العثور على طلاب</td></tr>';
    }

    filtered.forEach(s => {
        const group = appData.groups.find(g => g.id === s.groupId);
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>#${s.internalGroupId || s.id}</td>
            <td><strong>${s.name}</strong></td>
            <td>${gradeNames[s.grade]}<br><small class="text-muted">${group ? group.name : ''}</small></td>
            <td>${s.phone1}</td>
            <td>${calculatePerformance(s)}%</td>
            <td>
                <button class="btn btn-sm btn-outline text-primary" onclick="viewStudent(${s.id})" title="عرض الملف"><i class="fas fa-user"></i></button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteStudent(${s.id})" title="حذف الطالب"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function deleteStudent(id) {
    if(confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) {
        appData.students = appData.students.filter(s => s.id !== id);
        saveData();
        renderStudents();
    }
}

function deleteAllStudents() {
    if(confirm('هل أنت متأكد من أنك تريد حذف جميع الطلاب من الموقع تماماً؟ هذا الإجراء لا يمكن التراجع عنه!')) {
        appData.students = [];
        appData.payments = [];
        saveData();
        renderDashboard();
        renderStudents();
        renderPayments();
        alert('تم حذف جميع الطلاب بنجاح.');
    }
}

function changePaymentStatus(id, newStatus) {
    const student = appData.students.find(s => s.id === id);
    if (!student) return;

    const oldStatus = student.paymentStatus;
    student.paymentStatus = newStatus;

    const price = student.customPrice ? student.customPrice : (appData.gradePrices[student.grade] || 0);

    // If changing to 'paid' from something else, record payment
    if (newStatus === 'paid' && oldStatus !== 'paid') {
        const paymentId = appData.payments.length > 0 ? Math.max(...appData.payments.map(p => p.id)) + 1 : 1;
        appData.payments.push({
            id: paymentId,
            studentId: id,
            amount: price,
            date: new Date().toISOString() // Full timestamp
        });
    } 
    // If changing from 'paid' to something else, remove the latest payment for this student (cancellation)
    else if (oldStatus === 'paid' && newStatus !== 'paid') {
        // Find latest payment for this student and remove it
        const paymentsReverse = [...appData.payments].reverse();
        const latestPayment = paymentsReverse.find(p => p.studentId === id);
        if (latestPayment) {
            appData.payments = appData.payments.filter(p => p.id !== latestPayment.id);
        }
    }

    saveData();
    renderPayments();
}

// --- Add Student ---
document.getElementById('student-grade').addEventListener('change', (e) => {
    const grade = parseInt(e.target.value);
    const groupSelect = document.getElementById('student-group');
    groupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
    
    if (grade) {
        const groups = appData.groups.filter(g => g.grade === grade);
        groups.forEach(g => {
            const opt = document.createElement('option');
            opt.value = g.id;
            opt.innerText = g.name;
            groupSelect.appendChild(opt);
        });
        groupSelect.disabled = false;
    } else {
        groupSelect.disabled = true;
    }
});

function prepareAddStudentForm() {
    document.getElementById('student-form').reset();
    document.getElementById('student-group').disabled = true;
    
    const gradeSelect = document.getElementById('student-grade');
    gradeSelect.innerHTML = '<option value="">اختر المستوى...</option>';
    [1, 2, 3].forEach(g => {
        gradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
    });
}

document.getElementById('student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const customPriceInput = document.getElementById('student-custom-price').value;
    
    const studentData = {
        name: document.getElementById('student-name').value,
        grade: parseInt(document.getElementById('student-grade').value),
        groupId: parseInt(document.getElementById('student-group').value),
        phone1: document.getElementById('parent-phone-1').value,
        phone2: document.getElementById('parent-phone-2').value || "",
        customPrice: customPriceInput ? parseFloat(customPriceInput) : null,
        paymentStatus: 'unpaid' // unpaid, paid, special
    };

    const groupStudents = appData.students.filter(s => s.groupId === studentData.groupId);
    const internalGroupId = groupStudents.length > 0 ? Math.max(...groupStudents.map(s => s.internalGroupId || 0)) + 1 : 1;
    
    const newId = appData.students.length > 0 ? Math.max(...appData.students.map(s => s.id)) + 1 : 1;
    appData.students.push({
        id: newId,
        internalGroupId: internalGroupId,
        ...studentData,
        exams: []
    });

    saveData();
    navigateTo('page-students');
});

// --- Student Details ---
function viewStudent(id) {
    appData.currentStudentView = id;
    const s = appData.students.find(st => st.id === id);
    const group = appData.groups.find(g => g.id === s.groupId);
    
    document.getElementById('detail-name').innerText = s.name;
    const displayId = s.internalGroupId || s.id; 
    document.getElementById('detail-meta').innerText = `رقم: ${displayId} | ${gradeNames[s.grade]} - ${group ? group.name : ''}`;
    
    document.getElementById('detail-phone-1').innerText = s.phone1;
    document.getElementById('detail-phone-2').innerText = s.phone2 || 'لا يوجد';

    const perf = calculatePerformance(s);
    document.getElementById('detail-performance-val').innerText = `${perf}%`;
    
    const passedExams = s.exams.filter(e => (e.score / e.max) >= 0.75).length;
    document.getElementById('detail-passed-exams').innerText = `${passedExams} من ${s.exams.length}`;

    renderExamsTableForStudent(s);
    renderStudentPayments(s);
    navigateTo('page-student-details');
}

function renderExamsTableForStudent(student) {
    const tbody = document.querySelector('#student-exams-table tbody');
    tbody.innerHTML = '';
    
    if(student.exams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا توجد امتحانات مسجلة</td></tr>';
    }

    student.exams.forEach(e => {
        const perc = Math.round((e.score / e.max) * 100);
        const badgeClass = perc >= 75 ? 'badge-success' : (perc >= 50 ? 'badge-warning' : 'badge-danger');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${e.date}</td>
            <td>${e.name}</td>
            <td>${e.score} من ${e.max}</td>
            <td><span class="badge ${badgeClass}">${perc}%</span></td>
            <td class="print-hide">
                <button class="btn btn-sm btn-outline text-primary" onclick="openEditExamModal(${e.id})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-outline text-danger" onclick="deleteExam(${e.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openEditExamModal(examId) {
    const student = appData.students.find(s => s.id === appData.currentStudentView);
    if(!student) return;
    const exam = student.exams.find(e => e.id === examId);
    if(!exam) return;
    
    document.getElementById('edit-exam-id').value = examId;
    document.getElementById('edit-exam-score').value = exam.score;
    document.getElementById('edit-exam-score').max = exam.max;
    
    document.getElementById('modal-edit-exam').classList.remove('hidden');
}

document.getElementById('edit-exam-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const examId = parseInt(document.getElementById('edit-exam-id').value);
    const score = parseFloat(document.getElementById('edit-exam-score').value);
    
    const student = appData.students.find(s => s.id === appData.currentStudentView);
    if(!student) return;
    const exam = student.exams.find(ex => ex.id === examId);
    if(!exam) return;
    
    exam.score = score;
    saveData();
    closeModal('modal-edit-exam');
    viewStudent(appData.currentStudentView);
});

function deleteExam(examId) {
    if(confirm('هل تريد حذف هذه الدرجة؟')) {
        const student = appData.students.find(s => s.id === appData.currentStudentView);
        student.exams = student.exams.filter(e => e.id !== examId);
        saveData();
        viewStudent(appData.currentStudentView);
    }
}

function renderStudentPayments(student) {
    const tbody = document.querySelector('#student-payments-table tbody');
    tbody.innerHTML = '';
    
    const studentPayments = appData.payments.filter(p => p.studentId === student.id).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    if(studentPayments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">لا توجد مدفوعات مسجلة</td></tr>';
        return;
    }
    
    studentPayments.forEach(p => {
        const d = new Date(p.date);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        const formattedDate = d.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' });
        
        tbody.innerHTML += `
            <tr>
                <td dir="ltr">${formattedDate}</td>
                <td>${monthKey}</td>
                <td>${p.amount} ج.م</td>
                <td>
                    <button class="btn btn-sm btn-outline text-danger" onclick="deletePayment(${p.id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
}

function openManualPaymentModal() {
    document.getElementById('modal-manual-payment').classList.remove('hidden');
    const d = new Date();
    document.getElementById('manual-payment-month').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const student = appData.students.find(s => s.id === appData.currentStudentView);
    const actualPrice = student.customPrice !== null ? student.customPrice : (appData.gradePrices[student.grade] || 0);
    document.getElementById('manual-payment-amount').value = actualPrice;
}

document.getElementById('manual-payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('manual-payment-amount').value);
    let monthStr = document.getElementById('manual-payment-month').value;
    
    if(!monthStr) {
        const d = new Date();
        monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    
    appData.payments.push({
        id: Date.now(),
        studentId: appData.currentStudentView,
        amount: amount,
        date: `${monthStr}-01T12:00:00.000Z` // Link to that month
    });
    
    saveData();
    closeModal('modal-manual-payment');
    viewStudent(appData.currentStudentView);
    if(document.getElementById('page-payments').classList.contains('hidden') === false) renderPayments();
});

function deletePayment(paymentId) {
    if(confirm('هل أنت متأكد من حذف هذا السجل المالي؟ سيؤثر هذا على إيراداتك.')) {
        appData.payments = appData.payments.filter(p => p.id !== paymentId);
        saveData();
        viewStudent(appData.currentStudentView);
        if(document.getElementById('page-payments').classList.contains('hidden') === false) renderPayments();
    }
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

// --- Global Exams & Bulk Entry Page ---
function renderExamsInit() {
    const newExamGradeSelect = document.getElementById('new-exam-grade');
    const entryExamGradeSelect = document.getElementById('entry-exam-grade');
    
    newExamGradeSelect.innerHTML = '<option value="">اختر المستوى...</option>';
    entryExamGradeSelect.innerHTML = '<option value="">اختر المستوى أولاً...</option>';
    
    [1, 2, 3].forEach(g => {
        newExamGradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
        entryExamGradeSelect.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`;
    });
    
    document.getElementById('bulk-exam-container').classList.add('hidden');
    document.getElementById('create-exam-form').reset();
    document.getElementById('entry-exam-select').innerHTML = '<option value="">اختر الامتحان...</option>';
    document.getElementById('entry-exam-select').disabled = true;
    document.getElementById('entry-group-select').innerHTML = '<option value="">اختر المجموعة...</option>';
    document.getElementById('entry-group-select').disabled = true;
}

document.getElementById('create-exam-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const grade = parseInt(document.getElementById('new-exam-grade').value);
    const name = document.getElementById('new-exam-name').value;
    const max = parseFloat(document.getElementById('new-exam-max').value);
    
    if(!grade || !name || isNaN(max)) return;
    
    const newId = appData.globalExams.length > 0 ? Math.max(...appData.globalExams.map(ex => ex.id)) + 1 : 1;
    appData.globalExams.push({
        id: newId,
        grade: grade,
        name: name,
        max: max,
        date: new Date().toISOString().split('T')[0]
    });
    
    saveData();
    alert('تم إنشاء الامتحان بنجاح. يمكنك الآن رصد الدرجات له.');
    document.getElementById('create-exam-form').reset();
    
    // Refresh the entry dropdown if the same grade is selected
    const selectedGradeForEntry = parseInt(document.getElementById('entry-exam-grade').value);
    if(selectedGradeForEntry === grade) {
        document.getElementById('entry-exam-grade').dispatchEvent(new Event('change'));
    }
});

document.getElementById('entry-exam-grade').addEventListener('change', (e) => {
    const grade = parseInt(e.target.value);
    const examSelect = document.getElementById('entry-exam-select');
    const groupSelect = document.getElementById('entry-group-select');
    document.getElementById('bulk-exam-container').classList.add('hidden');
    
    examSelect.innerHTML = '<option value="">اختر الامتحان...</option>';
    groupSelect.innerHTML = '<option value="">اختر المجموعة...</option>';
    
    if (!grade) {
        examSelect.disabled = true;
        groupSelect.disabled = true;
        return;
    }
    
    const gradeExams = appData.globalExams.filter(ex => ex.grade === grade);
    gradeExams.forEach(ex => {
        examSelect.innerHTML += `<option value="${ex.id}">${ex.name} (من ${ex.max})</option>`;
    });
    
    const gradeGroups = appData.groups.filter(g => g.grade === grade);
    gradeGroups.forEach(g => {
        groupSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
    
    examSelect.disabled = false;
    groupSelect.disabled = false;
});

function loadBulkStudentsTable() {
    const grade = parseInt(document.getElementById('entry-exam-grade').value);
    const examId = parseInt(document.getElementById('entry-exam-select').value);
    const groupId = parseInt(document.getElementById('entry-group-select').value);
    const container = document.getElementById('bulk-exam-container');
    const tbody = document.querySelector('#exam-entry-table tbody');
    tbody.innerHTML = '';
    
    if (!grade || !examId || !groupId) {
        container.classList.add('hidden');
        return;
    }
    
    const targetStudents = appData.students.filter(s => s.groupId === groupId);
    
    if(targetStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">لا يوجد طلاب في هذه المجموعة</td></tr>';
    } else {
        targetStudents.forEach(s => {
            const existingExam = s.exams.find(ex => ex.name === appData.globalExams.find(e => e.id === examId).name);
            const defaultVal = existingExam ? existingExam.score : 0;
            
            tbody.innerHTML += `
                <tr data-student-id="${s.id}">
                    <td>#${s.internalGroupId||s.id}</td>
                    <td><strong>${s.name}</strong></td>
                    <td>
                        <input type="number" class="form-control bulk-score-input" value="${defaultVal}" min="0" style="width: 150px;">
                    </td>
                </tr>
            `;
        });
    }
    
    container.classList.remove('hidden');
}

document.getElementById('entry-exam-select').addEventListener('change', loadBulkStudentsTable);
document.getElementById('entry-group-select').addEventListener('change', loadBulkStudentsTable);

document.getElementById('btn-save-bulk-exam').addEventListener('click', () => {
    const examId = parseInt(document.getElementById('entry-exam-select').value);
    const globalExam = appData.globalExams.find(ex => ex.id === examId);
    
    if(!globalExam) return;
    
    const rows = document.querySelectorAll('#exam-entry-table tbody tr[data-student-id]');
    if(rows.length === 0) return;
    
    rows.forEach(row => {
        const studentId = parseInt(row.getAttribute('data-student-id'));
        const scoreInput = row.querySelector('.bulk-score-input');
        if(!scoreInput) return;
        
        const score = parseFloat(scoreInput.value) || 0;
        const student = appData.students.find(s => s.id === studentId);
        if(!student) return;
        
        const existingExamIndex = student.exams.findIndex(ex => ex.name === globalExam.name);
        
        if (existingExamIndex !== -1) {
            student.exams[existingExamIndex].score = score;
            student.exams[existingExamIndex].max = globalExam.max;
        } else {
            const newExamId = student.exams.length > 0 ? Math.max(...student.exams.map(e => e.id)) + 1 : 1;
            student.exams.push({
                id: newExamId,
                name: globalExam.name,
                date: new Date().toISOString().split('T')[0],
                score: score,
                max: globalExam.max
            });
        }
    });
    
    saveData();
    alert('تم حفظ جميع الدرجات بنجاح!');
});

function filterExamStudents() {
    const input = document.getElementById('exam-search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#exam-entry-table tbody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(input) ? '' : 'none';
    });
}

// --- Payments ---
document.getElementById('payment-grade-filter').addEventListener('change', renderPayments);

function renderPayments() {
    const filter = document.getElementById('payment-grade-filter');
    const monthFilter = document.getElementById('payment-month-filter');
    const searchInput = document.getElementById('payment-search-input').value.toLowerCase();

    if(filter.options.length <= 1) {
        filter.innerHTML = '<option value="all">كل المستويات</option>';
        [1, 2, 3].forEach(g => { filter.innerHTML += `<option value="${g}">${gradeNames[g]}</option>`; });
    }

    if (!monthFilter.value) {
        // Set default month to current
        const d = new Date();
        monthFilter.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    const selectedMonth = monthFilter.value; // format: "YYYY-MM"
    const isCurrentMonth = selectedMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    // Calculate Totals
    const todayStr = new Date().toISOString().split('T')[0];
    let todayTotal = 0;
    let monthTotal = 0;
    
    appData.payments.forEach(p => {
        const pDate = new Date(p.date);
        const pMonthKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (p.date.startsWith(todayStr)) todayTotal += p.amount;
        if (pMonthKey === selectedMonth) monthTotal += p.amount;
    });

    document.getElementById('stat-revenue-today').innerText = todayTotal + ' ج.م';
    document.getElementById('stat-revenue-month').innerText = monthTotal + ' ج.م';

    const gradeVal = filter.value;
    const tbody = document.querySelector('#payments-table tbody');
    tbody.innerHTML = '';

    let list = appData.students;
    if(gradeVal !== 'all') {
        list = list.filter(s => s.grade === parseInt(gradeVal));
    }
    if (searchInput) {
        list = list.filter(s => s.name.toLowerCase().includes(searchInput) || (s.internalGroupId && s.internalGroupId.toString().includes(searchInput)));
    }

    if(list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">لا يوجد بيانات لعرضها</td></tr>';
    }

    list.forEach(s => {
        const group = appData.groups.find(g => g.id === s.groupId);
        const defaultPrice = appData.gradePrices[s.grade] || 0;
        const actualPrice = s.customPrice !== null ? s.customPrice : defaultPrice;
        
        let displayStatus = 'unpaid';
        if (isCurrentMonth) {
            displayStatus = s.paymentStatus || 'unpaid';
        } else {
            // Check past month payments
            const hasPaid = appData.payments.some(p => p.studentId === s.id && p.date.startsWith(selectedMonth));
            displayStatus = hasPaid ? 'paid' : 'unpaid';
        }
        
        let badgeColor = displayStatus === 'paid' ? 'success' : (displayStatus === 'special' ? 'warning' : 'danger');
        let statusText = displayStatus === 'paid' ? 'تم الدفع' : (displayStatus === 'special' ? 'حالة خاصة' : 'غير مسدد');
        
        tbody.innerHTML += `
            <tr>
                <td>#${s.internalGroupId || s.id}</td>
                <td>
                    <strong>${s.name}</strong><br>
                    <small class="text-muted">المطلوب: ${actualPrice} ج.م</small>
                </td>
                <td>${group ? group.name : ''}</td>
                <td><span class="badge badge-${badgeColor}">${statusText}</span></td>
                <td>
                    <select class="form-control" style="width: auto; display: inline-block; padding: 0.2rem;" onchange="changePaymentStatusForMonth(${s.id}, this.value, '${selectedMonth}', ${isCurrentMonth})">
                        <option value="unpaid" ${displayStatus === 'unpaid' ? 'selected' : ''}>غير مسدد</option>
                        <option value="paid" ${displayStatus === 'paid' ? 'selected' : ''}>دفع</option>
                        <option value="special" ${displayStatus === 'special' ? 'selected' : ''}>حالة خاصة</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

function changePaymentStatusForMonth(id, newStatus, monthStr, isCurrentMonth) {
    const student = appData.students.find(s => s.id === id);
    if (!student) return;

    const price = student.customPrice !== null ? student.customPrice : (appData.gradePrices[student.grade] || 0);

    if (isCurrentMonth) {
        const oldStatus = student.paymentStatus;
        student.paymentStatus = newStatus;

        if (newStatus === 'paid' && oldStatus !== 'paid') {
            appData.payments.push({
                id: Date.now(),
                studentId: id,
                amount: price,
                date: new Date().toISOString()
            });
        } 
        else if (oldStatus === 'paid' && newStatus !== 'paid') {
            const paymentsReverse = [...appData.payments].reverse();
            const latestPayment = paymentsReverse.find(p => p.studentId === id && p.date.startsWith(monthStr));
            if (latestPayment) {
                appData.payments = appData.payments.filter(p => p.id !== latestPayment.id);
            }
        }
    } else {
        // Changing past month
        if (newStatus === 'paid') {
            appData.payments.push({
                id: Date.now(),
                studentId: id,
                amount: price,
                // Add it to the 1st of the past month, but keep track of actual creation time if needed.
                // For simplicity, date is set to the requested month.
                date: `${monthStr}-01T12:00:00.000Z`
            });
        } else {
            // Remove past payments for that month
            appData.payments = appData.payments.filter(p => !(p.studentId === id && p.date.startsWith(monthStr)));
        }
    }

    saveData();
    renderPayments();
}

// --- Levels ---
function renderLevels() {
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

function saveGradePrice(grade) {
    const priceInput = document.getElementById(`price-input-${grade}`).value;
    if (priceInput !== "") {
        appData.gradePrices[grade] = parseFloat(priceInput);
        saveData();
        alert('تم حفظ السعر بنجاح!');
    }
}

// --- Curriculum Progress ---
function renderProgressTabs() {
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

function renderProgress() {
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

document.getElementById('add-task-form').addEventListener('submit', (e) => {
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

function toggleTask(id) {
    const grade = appData.currentProgressGrade;
    const task = appData.progress[grade].find(t => t.id === id);
    if(task) {
        task.done = !task.done;
        saveData();
        renderProgress();
    }
}

function deleteTask(id) {
    const grade = appData.currentProgressGrade;
    appData.progress[grade] = appData.progress[grade].filter(t => t.id !== id);
    saveData();
    renderProgress();
}

// --- Printing Logic ---
function printReport(type) {
    const printContainer = document.getElementById('print-container');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('ar-EG', options);
    let html = '';

    if (type === 'profile') {
        const s = appData.students.find(st => st.id === appData.currentStudentView);
        const group = appData.groups.find(g => g.id === s.groupId);
        const perf = calculatePerformance(s);
        
        html = `
            <div class="print-header">
                <h1>ملف الطالب الأكاديمي</h1>
                <p>تم استخراج التقرير في ${dateStr}</p>
            </div>
            <div style="margin-bottom: 30px;">
                <h2>${s.name}</h2>
                <p><strong>الرقم:</strong> ${s.internalGroupId || s.id} | <strong>المستوى:</strong> ${gradeNames[s.grade]} | <strong>المجموعة:</strong> ${group ? group.name : ''}</p>
                <p><strong>أرقام ولي الأمر:</strong> ${s.phone1} ${s.phone2 ? ' - ' + s.phone2 : ''}</p>
                <p><strong>الأداء العام:</strong> ${perf}% | <strong>حالة الدفع الشهري:</strong> ${s.paymentStatus ? 'مسدد' : 'متأخر'}</p>
            </div>
            <h3>نتائج الامتحانات</h3>
            <table class="table">
                <thead><tr><th>التاريخ</th><th>الامتحان</th><th>الدرجة</th><th>النسبة</th></tr></thead>
                <tbody>
                    ${s.exams.length === 0 ? '<tr><td colspan="4" style="text-align:center;">لا يوجد بيانات</td></tr>' : 
                    s.exams.map(e => `
                        <tr>
                            <td>${e.date}</td>
                            <td>${e.name}</td>
                            <td>${e.score} من ${e.max}</td>
                            <td>${Math.round((e.score/e.max)*100)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } 
    else if (type === 'payments') {
        const unpaid = appData.students.filter(s => !s.paymentStatus);
        html = `
            <div class="print-header">
                <h1>تقرير المتأخرات المادية</h1>
                <p>تم استخراج التقرير في ${dateStr}</p>
            </div>
            <div class="print-summary">
                <span>إجمالي الطلاب المتأخرين: ${unpaid.length} طالب</span>
            </div>
            <table class="table">
                <thead><tr><th>اسم الطالب</th><th>هاتف ولي الأمر</th><th>المستوى والمجموعة</th></tr></thead>
                <tbody>
                    ${unpaid.map(s => {
                        const g = appData.groups.find(gr => gr.id === s.groupId);
                        return `<tr>
                            <td>${s.name}</td>
                            <td>${s.phone1}</td>
                            <td>${gradeNames[s.grade]} - ${g ? g.name : ''}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    }
    else if (type === 'grades' || type === 'roster') {
        const title = type === 'grades' ? 'التقرير الشامل للدرجات والأداء' : 'كشف بيانات الطلاب المجمع';
        html = `
            <div class="print-header">
                <h1>${title}</h1>
                <p>تم استخراج التقرير في ${dateStr}</p>
            </div>
            <div class="print-summary">
                <span>إجمالي الطلاب المقيدين: ${appData.students.length} طالب</span>
            </div>
            <table class="table">
                <thead><tr><th>الرقم</th><th>اسم الطالب</th><th>المستوى والمجموعة</th>${type === 'grades' ? '<th>متوسط الأداء</th>' : '<th>أرقام التواصل</th>'}</tr></thead>
                <tbody>
                    ${appData.students.map(s => {
                        const g = appData.groups.find(gr => gr.id === s.groupId);
                        const displayId = s.internalGroupId || s.id;
                        return `<tr>
                            <td>${displayId}</td>
                            <td>${s.name}</td>
                            <td>${gradeNames[s.grade]} - ${g ? g.name : ''}</td>
                            ${type === 'grades' ? `<td>${calculatePerformance(s)}%</td>` : `<td>${s.phone1}</td>`}
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    printContainer.innerHTML = html;
    window.print();
}

console.log("Teacher System Loaded - Arabic Version RTL");