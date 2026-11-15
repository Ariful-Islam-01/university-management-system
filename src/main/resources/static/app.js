/**
 * University Management System - Frontend Application Logic
 * Technology: Plain HTML5, CSS3, Vanilla JavaScript (ES6+)
 * Frameworks: None (Zero external dependencies)
 * Session Authentication & Spring Security CSRF
 */

(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Application State
    // -------------------------------------------------------------------------
    let currentUser = null;          // { email: string, role: string }
    let csrfToken = '';              // X-CSRF-TOKEN value
    let csrfHeaderName = 'X-CSRF-TOKEN';
    let pendingDeleteAction = null;  // Callback for confirmation modal

    // In-memory cache of current resource records for edit population
    const state = {
        admins: [],
        teachers: [],
        students: []
    };

    // -------------------------------------------------------------------------
    // DOM Elements Cache
    // -------------------------------------------------------------------------
    const dom = {
        alertContainer: document.getElementById('alert-container'),
        loginView: document.getElementById('login-view'),
        dashboardView: document.getElementById('dashboard-view'),
        loginForm: document.getElementById('login-form'),
        loginEmail: document.getElementById('login-email'),
        loginPassword: document.getElementById('login-password'),
        loginEmailError: document.getElementById('login-email-error'),
        loginPasswordError: document.getElementById('login-password-error'),
        btnLogin: document.getElementById('btn-login'),
        btnLogout: document.getElementById('btn-logout'),
        userEmailDisplay: document.getElementById('user-email-display'),
        userRoleBadge: document.getElementById('user-role-badge'),

        // Navigation & Sidebar
        navItems: document.querySelectorAll('.nav-item'),
        navAdmins: document.getElementById('nav-admins'),
        navTeachers: document.getElementById('nav-teachers'),
        navStudents: document.getElementById('nav-students'),
        tabPanels: document.querySelectorAll('.tab-panel'),

        // Summary Cards
        cardAdmins: document.getElementById('card-admins'),
        cardTeachers: document.getElementById('card-teachers'),
        cardStudents: document.getElementById('card-students'),
        countAdmins: document.getElementById('count-admins'),
        countTeachers: document.getElementById('count-teachers'),
        countStudents: document.getElementById('count-students'),

        // Live RBAC Inspector
        btnTestAdminsApi: document.getElementById('btn-test-admins-api'),
        btnTestTeachersApi: document.getElementById('btn-test-teachers-api'),
        btnTestStudentsApi: document.getElementById('btn-test-students-api'),
        rbacTestOutput: document.getElementById('rbac-test-output'),
        rbacTestResult: document.getElementById('rbac-test-result'),

        // Admin Management
        adminForm: document.getElementById('admin-form'),
        adminFormTitle: document.getElementById('admin-form-title'),
        adminId: document.getElementById('admin-id'),
        adminName: document.getElementById('admin-name'),
        adminEmail: document.getElementById('admin-email'),
        adminNameError: document.getElementById('admin-name-error'),
        adminEmailError: document.getElementById('admin-email-error'),
        btnAdminSubmit: document.getElementById('btn-admin-submit'),
        btnAdminCancel: document.getElementById('btn-admin-cancel'),
        btnRefreshAdmins: document.getElementById('btn-refresh-admins'),
        adminsTableBody: document.getElementById('admins-table-body'),

        // Teacher Management
        teacherForm: document.getElementById('teacher-form'),
        teacherFormTitle: document.getElementById('teacher-form-title'),
        teacherId: document.getElementById('teacher-id'),
        teacherName: document.getElementById('teacher-name'),
        teacherEmail: document.getElementById('teacher-email'),
        teacherDepartment: document.getElementById('teacher-department'),
        teacherAccountSection: document.getElementById('teacher-account-section'),
        teacherCreateAccount: document.getElementById('teacher-create-account'),
        teacherPasswordFields: document.getElementById('teacher-password-fields'),
        teacherPassword: document.getElementById('teacher-password'),
        teacherConfirmPassword: document.getElementById('teacher-confirm-password'),
        teacherPasswordError: document.getElementById('teacher-password-error'),
        teacherConfirmPasswordError: document.getElementById('teacher-confirm-password-error'),
        teacherNameError: document.getElementById('teacher-name-error'),
        teacherEmailError: document.getElementById('teacher-email-error'),
        teacherDepartmentError: document.getElementById('teacher-department-error'),
        btnTeacherSubmit: document.getElementById('btn-teacher-submit'),
        btnTeacherCancel: document.getElementById('btn-teacher-cancel'),
        btnRefreshTeachers: document.getElementById('btn-refresh-teachers'),
        teachersTableBody: document.getElementById('teachers-table-body'),

        // Student Management
        studentForm: document.getElementById('student-form'),
        studentFormTitle: document.getElementById('student-form-title'),
        studentId: document.getElementById('student-id'),
        studentName: document.getElementById('student-name'),
        studentEmail: document.getElementById('student-email'),
        studentDepartment: document.getElementById('student-department'),
        studentAccountSection: document.getElementById('student-account-section'),
        studentCreateAccount: document.getElementById('student-create-account'),
        studentPasswordFields: document.getElementById('student-password-fields'),
        studentPassword: document.getElementById('student-password'),
        studentConfirmPassword: document.getElementById('student-confirm-password'),
        studentPasswordError: document.getElementById('student-password-error'),
        studentConfirmPasswordError: document.getElementById('student-confirm-password-error'),
        studentNameError: document.getElementById('student-name-error'),
        studentEmailError: document.getElementById('student-email-error'),
        studentDepartmentError: document.getElementById('student-department-error'),
        btnStudentSubmit: document.getElementById('btn-student-submit'),
        btnStudentCancel: document.getElementById('btn-student-cancel'),
        btnRefreshStudents: document.getElementById('btn-refresh-students'),
        studentsTableBody: document.getElementById('students-table-body'),

        // Confirmation Modal
        confirmModal: document.getElementById('confirm-modal'),
        confirmModalTitle: document.getElementById('confirm-modal-title'),
        confirmModalMessage: document.getElementById('confirm-modal-message'),
        btnConfirmCancel: document.getElementById('btn-confirm-cancel'),
        btnConfirmOk: document.getElementById('btn-confirm-ok')
    };

    // -------------------------------------------------------------------------
    // Alerts / Notification Banner
    // -------------------------------------------------------------------------
    function showAlert(message, type = 'info', duration = 4500) {
        if (!dom.alertContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;

        const textSpan = document.createElement('span');
        textSpan.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'alert-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.onclick = () => alert.remove();

        alert.appendChild(textSpan);
        alert.appendChild(closeBtn);
        dom.alertContainer.appendChild(alert);

        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentElement) {
                    alert.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    alert.style.opacity = '0';
                    alert.style.transform = 'translateX(20px)';
                    setTimeout(() => alert.remove(), 300);
                }
            }, duration);
        }
    }

    // -------------------------------------------------------------------------
    // CSRF & API Fetch Wrapper
    // -------------------------------------------------------------------------
    async function fetchCsrfToken() {
        try {
            const res = await fetch('/api/auth/csrf', {
                method: 'GET',
                credentials: 'same-origin'
            });
            if (res.ok) {
                const data = await res.json();
                if (data.token) {
                    csrfToken = data.token;
                    csrfHeaderName = data.headerName || 'X-CSRF-TOKEN';
                }
            }
        } catch (err) {
            console.warn('Unable to refresh CSRF token:', err);
        }
    }

    /**
     * Centralized HTTP Request Handler
     * Attaches CSRF tokens, credentials: 'same-origin', and handles HTTP status codes.
     */
    async function apiRequest(url, options = {}) {
        options.credentials = 'same-origin';
        options.headers = options.headers || {};

        const method = (options.method || 'GET').toUpperCase();
        const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        if (isStateChanging) {
            if (!csrfToken) {
                await fetchCsrfToken();
            }
            if (csrfToken) {
                options.headers[csrfHeaderName] = csrfToken;
            }
            if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(options.body);
            }
        }

        try {
            const response = await fetch(url, options);

            // Handle Global HTTP Status Codes
            if (response.status === 401) {
                // If an API endpoint returns 401 while on dashboard, user session expired
                if (currentUser && !url.includes('/api/auth/login')) {
                    showAlert('Session expired or unauthorized. Please sign in again.', 'warning');
                    currentUser = null;
                    showLoginView();
                }
            } else if (response.status === 403) {
                showAlert('Access Forbidden (403): Your role is not permitted to perform this action.', 'error');
            } else if (response.status === 404) {
                showAlert('Record not found (404).', 'warning');
            } else if (response.status === 500) {
                showAlert('Server error (500). Please try again later.', 'error');
            }

            return response;
        } catch (networkError) {
            showAlert('Network error: Unable to connect to backend server.', 'error');
            throw networkError;
        }
    }

    // -------------------------------------------------------------------------
    // View Management
    // -------------------------------------------------------------------------
    function showLoginView() {
        dom.dashboardView.style.display = 'none';
        dom.loginView.style.display = 'flex';
        dom.loginForm.reset();
        clearValidationErrors();
    }

    function showDashboardView() {
        dom.loginView.style.display = 'none';
        dom.dashboardView.style.display = 'flex';
        updateUserHeader();
        applyRbac(currentUser ? currentUser.role : '');
        switchTab('overview');
        refreshAccessibleData();
    }

    function updateUserHeader() {
        if (!currentUser) return;
        dom.userEmailDisplay.textContent = currentUser.email || 'Authenticated User';
        dom.userRoleBadge.textContent = currentUser.role || 'ROLE_UNKNOWN';

        // Badge styling based on role
        dom.userRoleBadge.className = 'badge badge-role';
        if (currentUser.role === 'ROLE_ADMIN') {
            dom.userRoleBadge.style.backgroundColor = '#e0e7ff';
            dom.userRoleBadge.style.color = '#3730a3';
        } else if (currentUser.role === 'ROLE_TEACHER') {
            dom.userRoleBadge.style.backgroundColor = '#ccfbf1';
            dom.userRoleBadge.style.color = '#0f766e';
        } else if (currentUser.role === 'ROLE_STUDENT') {
            dom.userRoleBadge.style.backgroundColor = '#d1fae5';
            dom.userRoleBadge.style.color = '#065f46';
        }
    }

    // -------------------------------------------------------------------------
    // Role-Based Access Control (RBAC) Visibility
    // -------------------------------------------------------------------------
    function applyRbac(role) {
        const isAdmin = role === 'ROLE_ADMIN';
        const isTeacher = role === 'ROLE_TEACHER';
        const isStudent = role === 'ROLE_STUDENT';

        // Sidebar Navigation visibility
        dom.navAdmins.style.display = isAdmin ? 'inline-flex' : 'none';
        dom.navTeachers.style.display = (isAdmin || isTeacher) ? 'inline-flex' : 'none';
        dom.navStudents.style.display = (isAdmin || isStudent) ? 'inline-flex' : 'none';

        // Dashboard Summary Cards visibility
        dom.cardAdmins.style.display = isAdmin ? 'flex' : 'none';
        dom.cardTeachers.style.display = (isAdmin || isTeacher) ? 'flex' : 'none';
        dom.cardStudents.style.display = (isAdmin || isStudent) ? 'flex' : 'none';

        // Account creation section in Teacher and Student forms (ROLE_ADMIN only, create mode)
        if (dom.teacherAccountSection) {
            dom.teacherAccountSection.style.display = (isAdmin && !dom.teacherId.value) ? 'block' : 'none';
        }
        if (dom.studentAccountSection) {
            dom.studentAccountSection.style.display = (isAdmin && !dom.studentId.value) ? 'block' : 'none';
        }
    }

    function switchTab(tabName) {
        dom.navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        dom.tabPanels.forEach(panel => {
            if (panel.id === `tab-${tabName}`) {
                panel.style.display = 'block';
                panel.classList.add('active');
            } else {
                panel.style.display = 'none';
                panel.classList.remove('active');
            }
        });

        // Trigger resource fetch on tab switch
        if (tabName === 'admins' && currentUser && currentUser.role === 'ROLE_ADMIN') {
            loadAdmins();
        } else if (tabName === 'teachers' && currentUser && (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_TEACHER')) {
            loadTeachers();
        } else if (tabName === 'students' && currentUser && (currentUser.role === 'ROLE_ADMIN' || currentUser.role === 'ROLE_STUDENT')) {
            loadStudents();
        }
    }

    function refreshAccessibleData() {
        if (!currentUser) return;
        const role = currentUser.role;
        if (role === 'ROLE_ADMIN') {
            loadAdmins();
            loadTeachers();
            loadStudents();
        } else if (role === 'ROLE_TEACHER') {
            loadTeachers();
        } else if (role === 'ROLE_STUDENT') {
            loadStudents();
        }
    }

    // -------------------------------------------------------------------------
    // Authentication Operations
    // -------------------------------------------------------------------------
    async function checkCurrentSession() {
        try {
            await fetchCsrfToken();
            const res = await apiRequest('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.email && data.role) {
                    currentUser = { email: data.email, role: data.role };
                    showDashboardView();
                    return;
                }
            }
        } catch (e) {
            // Unauthenticated on start is normal
        }
        showLoginView();
    }

    async function handleLoginSubmit(event) {
        event.preventDefault();
        clearValidationErrors();

        const email = dom.loginEmail.value.trim();
        const password = dom.loginPassword.value;

        let hasError = false;
        if (!email) {
            dom.loginEmailError.textContent = 'Email address is required.';
            hasError = true;
        } else if (!isValidEmail(email)) {
            dom.loginEmailError.textContent = 'Please enter a valid email address.';
            hasError = true;
        }

        if (!password) {
            dom.loginPasswordError.textContent = 'Password is required.';
            hasError = true;
        }

        if (hasError) return;

        dom.btnLogin.disabled = true;
        dom.btnLogin.textContent = 'Signing in...';

        try {
            await fetchCsrfToken();

            const res = await apiRequest('/api/auth/login', {
                method: 'POST',
                body: { email, password }
            });

            if (res.ok) {
                const data = await res.json();
                currentUser = {
                    email: data.email || email,
                    role: data.role
                };
                showAlert('Login successful! Welcome to the University Management System.', 'success');
                showDashboardView();
            } else if (res.status === 401) {
                showAlert('Invalid email or password. Please try again.', 'error');
                dom.loginPassword.value = '';
                dom.loginPassword.focus();
            } else if (res.status === 400) {
                const errData = await res.json().catch(() => ({}));
                showAlert(errData.error || 'Invalid credentials format.', 'error');
            } else {
                showAlert(`Sign in failed with HTTP status ${res.status}.`, 'error');
            }
        } catch (err) {
            showAlert('Login request failed. Check server connection.', 'error');
        } finally {
            dom.btnLogin.disabled = false;
            dom.btnLogin.textContent = 'Sign In';
        }
    }

    async function handleLogout() {
        dom.btnLogout.disabled = true;
        try {
            const res = await apiRequest('/api/auth/logout', { method: 'POST' });
            if (res.ok) {
                showAlert('You have been signed out successfully.', 'info');
            }
        } catch (err) {
            console.warn('Logout request failed:', err);
        } finally {
            currentUser = null;
            dom.btnLogout.disabled = false;
            showLoginView();
        }
    }

    // -------------------------------------------------------------------------
    // CRUD: Admins Resource (/api/admins)
    // -------------------------------------------------------------------------
    async function loadAdmins() {
        try {
            const res = await apiRequest('/api/admins');
            if (res.ok) {
                const data = await res.json();
                state.admins = Array.isArray(data) ? data : [];
                dom.countAdmins.textContent = state.admins.length;
                renderAdminsTable(state.admins);
            } else {
                dom.adminsTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Unable to load administrators (HTTP ${res.status}).</td></tr>`;
            }
        } catch (e) {
            dom.adminsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Error loading administrators.</td></tr>';
        }
    }

    function renderAdminsTable(admins) {
        if (!admins.length) {
            dom.adminsTableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No admin records found. Add one above.</td></tr>';
            return;
        }

        dom.adminsTableBody.innerHTML = admins.map(admin => `
            <tr>
                <td><strong>#${escapeHtml(admin.id)}</strong></td>
                <td>${escapeHtml(admin.name)}</td>
                <td><code>${escapeHtml(admin.email)}</code></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" onclick="window.umsApp.editAdmin(${admin.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="window.umsApp.confirmDelete('admin', ${admin.id}, '${escapeJs(admin.name)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async function handleAdminSubmit(e) {
        e.preventDefault();
        dom.adminNameError.textContent = '';
        dom.adminEmailError.textContent = '';

        const id = dom.adminId.value.trim();
        const name = dom.adminName.value.trim();
        const email = dom.adminEmail.value.trim();

        let hasError = false;
        if (!name) {
            dom.adminNameError.textContent = 'Name is required.';
            hasError = true;
        }
        if (!email) {
            dom.adminEmailError.textContent = 'Email is required.';
            hasError = true;
        } else if (!isValidEmail(email)) {
            dom.adminEmailError.textContent = 'Enter a valid email address.';
            hasError = true;
        }
        if (hasError) return;

        dom.btnAdminSubmit.disabled = true;
        const isEditing = Boolean(id);
        const url = isEditing ? `/api/admins/${id}` : '/api/admins';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const res = await apiRequest(url, {
                method,
                body: { name, email }
            });

            if (res.ok || res.status === 201) {
                showAlert(`Admin ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
                resetAdminForm();
                loadAdmins();
            } else if (res.status === 400) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Validation Error: ${err.error || 'Invalid fields'}`, 'error');
            } else if (res.status === 409) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Conflict: ${err.error || 'Email already in use'}`, 'warning');
            }
        } finally {
            dom.btnAdminSubmit.disabled = false;
        }
    }

    function editAdmin(id) {
        const admin = state.admins.find(a => a.id === id);
        if (!admin) return;

        dom.adminId.value = admin.id;
        dom.adminName.value = admin.name || '';
        dom.adminEmail.value = admin.email || '';
        dom.adminFormTitle.textContent = `Edit Admin #${admin.id}`;
        dom.btnAdminSubmit.textContent = 'Update Admin';
        dom.btnAdminCancel.style.display = 'inline-flex';
        dom.adminName.focus();
    }

    function resetAdminForm() {
        dom.adminForm.reset();
        dom.adminId.value = '';
        dom.adminNameError.textContent = '';
        dom.adminEmailError.textContent = '';
        dom.adminFormTitle.textContent = 'Add New Admin';
        dom.btnAdminSubmit.textContent = 'Save Admin';
        dom.btnAdminCancel.style.display = 'none';
    }

    // -------------------------------------------------------------------------
    // CRUD: Teachers Resource (/api/teachers)
    // -------------------------------------------------------------------------
    async function loadTeachers() {
        try {
            const res = await apiRequest('/api/teachers');
            if (res.ok) {
                const data = await res.json();
                state.teachers = Array.isArray(data) ? data : [];
                dom.countTeachers.textContent = state.teachers.length;
                renderTeachersTable(state.teachers);
            } else {
                dom.teachersTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Unable to load teachers (HTTP ${res.status}).</td></tr>`;
            }
        } catch (e) {
            dom.teachersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Error loading teachers.</td></tr>';
        }
    }

    function renderTeachersTable(teachers) {
        if (!teachers.length) {
            dom.teachersTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No teacher records found. Add one above.</td></tr>';
            return;
        }

        dom.teachersTableBody.innerHTML = teachers.map(teacher => `
            <tr>
                <td><strong>#${escapeHtml(teacher.id)}</strong></td>
                <td>${escapeHtml(teacher.name)}</td>
                <td><code>${escapeHtml(teacher.email)}</code></td>
                <td><span class="badge" style="background:#f1f5f9; color:#334155;">${escapeHtml(teacher.department)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" onclick="window.umsApp.editTeacher(${teacher.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="window.umsApp.confirmDelete('teacher', ${teacher.id}, '${escapeJs(teacher.name)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async function handleTeacherSubmit(e) {
        e.preventDefault();
        dom.teacherNameError.textContent = '';
        dom.teacherEmailError.textContent = '';
        dom.teacherDepartmentError.textContent = '';
        if (dom.teacherPasswordError) dom.teacherPasswordError.textContent = '';
        if (dom.teacherConfirmPasswordError) dom.teacherConfirmPasswordError.textContent = '';

        const id = dom.teacherId.value.trim();
        const name = dom.teacherName.value.trim();
        const email = dom.teacherEmail.value.trim();
        const department = dom.teacherDepartment.value.trim();

        let hasError = false;
        if (!name) {
            dom.teacherNameError.textContent = 'Name is required.';
            hasError = true;
        }
        if (!email) {
            dom.teacherEmailError.textContent = 'Email is required.';
            hasError = true;
        } else if (!isValidEmail(email)) {
            dom.teacherEmailError.textContent = 'Enter a valid email address.';
            hasError = true;
        }
        if (!department) {
            dom.teacherDepartmentError.textContent = 'Department is required.';
            hasError = true;
        }

        const isEditing = Boolean(id);
        const wantsAccount = !isEditing && currentUser && currentUser.role === 'ROLE_ADMIN'
                && dom.teacherCreateAccount && dom.teacherCreateAccount.checked;
        let password = '';
        let confirmPassword = '';

        if (wantsAccount) {
            password = dom.teacherPassword.value;
            confirmPassword = dom.teacherConfirmPassword.value;

            if (!password) {
                dom.teacherPasswordError.textContent = 'Password is required.';
                hasError = true;
            }
            if (!confirmPassword) {
                dom.teacherConfirmPasswordError.textContent = 'Confirm password is required.';
                hasError = true;
            } else if (password !== confirmPassword) {
                dom.teacherConfirmPasswordError.textContent = 'Passwords do not match.';
                hasError = true;
            }
        }

        if (hasError) return;

        dom.btnTeacherSubmit.disabled = true;
        const url = isEditing ? `/api/teachers/${id}` : '/api/teachers';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = { name, email, department };
        if (wantsAccount) {
            payload.createAccount = true;
            payload.password = password;
            payload.confirmPassword = confirmPassword;
        }

        try {
            const res = await apiRequest(url, {
                method,
                body: payload
            });

            if (res.ok || res.status === 201) {
                const successMsg = wantsAccount ?
                        'Teacher profile and login account (ROLE_TEACHER) created successfully!' :
                        `Teacher ${isEditing ? 'updated' : 'created'} successfully!`;
                showAlert(successMsg, 'success');
                resetTeacherForm();
                loadTeachers();
            } else if (res.status === 400) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Validation Error: ${err.error || 'Invalid fields'}`, 'error');
            } else if (res.status === 403) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Access Denied: ${err.error || 'Only administrators can create login accounts.'}`, 'error');
            } else if (res.status === 409) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Conflict: ${err.error || 'Email already in use'}`, 'warning');
            }
        } finally {
            dom.btnTeacherSubmit.disabled = false;
        }
    }

    function editTeacher(id) {
        const teacher = state.teachers.find(t => t.id === id);
        if (!teacher) return;

        dom.teacherId.value = teacher.id;
        dom.teacherName.value = teacher.name || '';
        dom.teacherEmail.value = teacher.email || '';
        dom.teacherDepartment.value = teacher.department || '';
        dom.teacherFormTitle.textContent = `Edit Teacher #${teacher.id}`;
        dom.btnTeacherSubmit.textContent = 'Update Teacher';
        dom.btnTeacherCancel.style.display = 'inline-flex';

        // Hide account creation section in edit mode
        if (dom.teacherAccountSection) dom.teacherAccountSection.style.display = 'none';
        if (dom.teacherCreateAccount) dom.teacherCreateAccount.checked = false;
        if (dom.teacherPasswordFields) dom.teacherPasswordFields.style.display = 'none';

        dom.teacherName.focus();
    }

    function resetTeacherForm() {
        dom.teacherForm.reset();
        dom.teacherId.value = '';
        dom.teacherNameError.textContent = '';
        dom.teacherEmailError.textContent = '';
        dom.teacherDepartmentError.textContent = '';
        if (dom.teacherPasswordError) dom.teacherPasswordError.textContent = '';
        if (dom.teacherConfirmPasswordError) dom.teacherConfirmPasswordError.textContent = '';
        if (dom.teacherPassword) dom.teacherPassword.value = '';
        if (dom.teacherConfirmPassword) dom.teacherConfirmPassword.value = '';
        if (dom.teacherCreateAccount) dom.teacherCreateAccount.checked = false;
        if (dom.teacherPasswordFields) dom.teacherPasswordFields.style.display = 'none';

        // Show account creation section if logged in as ADMIN
        if (dom.teacherAccountSection) {
            dom.teacherAccountSection.style.display = (currentUser && currentUser.role === 'ROLE_ADMIN') ? 'block' : 'none';
        }

        dom.teacherFormTitle.textContent = 'Add New Teacher';
        dom.btnTeacherSubmit.textContent = 'Save Teacher';
        dom.btnTeacherCancel.style.display = 'none';
    }

    // -------------------------------------------------------------------------
    // CRUD: Students Resource (/api/students)
    // -------------------------------------------------------------------------
    async function loadStudents() {
        try {
            const res = await apiRequest('/api/students');
            if (res.ok) {
                const data = await res.json();
                state.students = Array.isArray(data) ? data : [];
                dom.countStudents.textContent = state.students.length;
                renderStudentsTable(state.students);
            } else {
                dom.studentsTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Unable to load students (HTTP ${res.status}).</td></tr>`;
            }
        } catch (e) {
            dom.studentsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Error loading students.</td></tr>';
        }
    }

    function renderStudentsTable(students) {
        if (!students.length) {
            dom.studentsTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No student records found. Add one above.</td></tr>';
            return;
        }

        dom.studentsTableBody.innerHTML = students.map(student => `
            <tr>
                <td><strong>#${escapeHtml(student.id)}</strong></td>
                <td>${escapeHtml(student.name)}</td>
                <td><code>${escapeHtml(student.email)}</code></td>
                <td><span class="badge" style="background:#f1f5f9; color:#334155;">${escapeHtml(student.department)}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary btn-sm" onclick="window.umsApp.editStudent(${student.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="window.umsApp.confirmDelete('student', ${student.id}, '${escapeJs(student.name)}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async function handleStudentSubmit(e) {
        e.preventDefault();
        dom.studentNameError.textContent = '';
        dom.studentEmailError.textContent = '';
        dom.studentDepartmentError.textContent = '';
        if (dom.studentPasswordError) dom.studentPasswordError.textContent = '';
        if (dom.studentConfirmPasswordError) dom.studentConfirmPasswordError.textContent = '';

        const id = dom.studentId.value.trim();
        const name = dom.studentName.value.trim();
        const email = dom.studentEmail.value.trim();
        const department = dom.studentDepartment.value.trim();

        let hasError = false;
        if (!name) {
            dom.studentNameError.textContent = 'Name is required.';
            hasError = true;
        }
        if (!email) {
            dom.studentEmailError.textContent = 'Email is required.';
            hasError = true;
        } else if (!isValidEmail(email)) {
            dom.studentEmailError.textContent = 'Enter a valid email address.';
            hasError = true;
        }
        if (!department) {
            dom.studentDepartmentError.textContent = 'Department is required.';
            hasError = true;
        }

        const isEditing = Boolean(id);
        const wantsAccount = !isEditing && currentUser && currentUser.role === 'ROLE_ADMIN'
                && dom.studentCreateAccount && dom.studentCreateAccount.checked;
        let password = '';
        let confirmPassword = '';

        if (wantsAccount) {
            password = dom.studentPassword.value;
            confirmPassword = dom.studentConfirmPassword.value;

            if (!password) {
                dom.studentPasswordError.textContent = 'Password is required.';
                hasError = true;
            }
            if (!confirmPassword) {
                dom.studentConfirmPasswordError.textContent = 'Confirm password is required.';
                hasError = true;
            } else if (password !== confirmPassword) {
                dom.studentConfirmPasswordError.textContent = 'Passwords do not match.';
                hasError = true;
            }
        }

        if (hasError) return;

        dom.btnStudentSubmit.disabled = true;
        const url = isEditing ? `/api/students/${id}` : '/api/students';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = { name, email, department };
        if (wantsAccount) {
            payload.createAccount = true;
            payload.password = password;
            payload.confirmPassword = confirmPassword;
        }

        try {
            const res = await apiRequest(url, {
                method,
                body: payload
            });

            if (res.ok || res.status === 201) {
                const successMsg = wantsAccount ?
                        'Student profile and login account (ROLE_STUDENT) created successfully!' :
                        `Student ${isEditing ? 'updated' : 'created'} successfully!`;
                showAlert(successMsg, 'success');
                resetStudentForm();
                loadStudents();
            } else if (res.status === 400) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Validation Error: ${err.error || 'Invalid fields'}`, 'error');
            } else if (res.status === 403) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Access Denied: ${err.error || 'Only administrators can create login accounts.'}`, 'error');
            } else if (res.status === 409) {
                const err = await res.json().catch(() => ({}));
                showAlert(`Conflict: ${err.error || 'Email already in use'}`, 'warning');
            }
        } finally {
            dom.btnStudentSubmit.disabled = false;
        }
    }

    function editStudent(id) {
        const student = state.students.find(s => s.id === id);
        if (!student) return;

        dom.studentId.value = student.id;
        dom.studentName.value = student.name || '';
        dom.studentEmail.value = student.email || '';
        dom.studentDepartment.value = student.department || '';
        dom.studentFormTitle.textContent = `Edit Student #${student.id}`;
        dom.btnStudentSubmit.textContent = 'Update Student';
        dom.btnStudentCancel.style.display = 'inline-flex';

        // Hide account creation section in edit mode
        if (dom.studentAccountSection) dom.studentAccountSection.style.display = 'none';
        if (dom.studentCreateAccount) dom.studentCreateAccount.checked = false;
        if (dom.studentPasswordFields) dom.studentPasswordFields.style.display = 'none';

        dom.studentName.focus();
    }

    function resetStudentForm() {
        dom.studentForm.reset();
        dom.studentId.value = '';
        dom.studentNameError.textContent = '';
        dom.studentEmailError.textContent = '';
        dom.studentDepartmentError.textContent = '';
        if (dom.studentPasswordError) dom.studentPasswordError.textContent = '';
        if (dom.studentConfirmPasswordError) dom.studentConfirmPasswordError.textContent = '';
        if (dom.studentPassword) dom.studentPassword.value = '';
        if (dom.studentConfirmPassword) dom.studentConfirmPassword.value = '';
        if (dom.studentCreateAccount) dom.studentCreateAccount.checked = false;
        if (dom.studentPasswordFields) dom.studentPasswordFields.style.display = 'none';

        // Show account creation section if logged in as ADMIN
        if (dom.studentAccountSection) {
            dom.studentAccountSection.style.display = (currentUser && currentUser.role === 'ROLE_ADMIN') ? 'block' : 'none';
        }

        dom.studentFormTitle.textContent = 'Add New Student';
        dom.btnStudentSubmit.textContent = 'Save Student';
        dom.btnStudentCancel.style.display = 'none';
    }

    // -------------------------------------------------------------------------
    // Delete Confirmation Dialog
    // -------------------------------------------------------------------------
    function confirmDelete(resourceType, id, recordName) {
        dom.confirmModalTitle.textContent = `Confirm Delete (${resourceType.toUpperCase()})`;
        dom.confirmModalMessage.textContent = `Are you sure you want to permanently delete "${recordName}" (ID #${id})?`;

        pendingDeleteAction = async () => {
            const endpoint = `/api/${resourceType}s/${id}`;
            const res = await apiRequest(endpoint, { method: 'DELETE' });
            if (res.status === 204 || res.ok) {
                showAlert(`${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} record deleted successfully.`, 'success');
                if (resourceType === 'admin') loadAdmins();
                if (resourceType === 'teacher') loadTeachers();
                if (resourceType === 'student') loadStudents();
            }
        };

        dom.confirmModal.style.display = 'flex';
    }

    function closeModal() {
        dom.confirmModal.style.display = 'none';
        pendingDeleteAction = null;
    }

    // -------------------------------------------------------------------------
    // Live RBAC Inspector Demonstration
    // -------------------------------------------------------------------------
    async function testEndpointAuthorization(url) {
        dom.rbacTestOutput.style.display = 'block';
        dom.rbacTestResult.textContent = `Testing request: GET ${url}...\nAuthorization: Current Session Cookie`;

        try {
            const start = performance.now();
            const res = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin'
            });
            const elapsed = Math.round(performance.now() - start);

            let bodyPreview = '';
            try {
                const json = await res.json();
                bodyPreview = JSON.stringify(json, null, 2);
            } catch (e) {
                bodyPreview = await res.text();
            }

            const statusText = res.status === 200 ? '200 OK (Authorized)' :
                               res.status === 403 ? '403 Forbidden (RBAC Access Denied by Spring Security)' :
                               res.status === 401 ? '401 Unauthorized (Authentication Required)' :
                               `${res.status} ${res.statusText}`;

            dom.rbacTestResult.textContent =
                `ENDPOINT: GET ${url}\n` +
                `STATUS:   ${statusText}\n` +
                `LATENCY:  ${elapsed} ms\n` +
                `ROLE:     ${currentUser ? currentUser.role : 'Unauthenticated'}\n\n` +
                `RESPONSE BODY:\n${bodyPreview.substring(0, 500)}${bodyPreview.length > 500 ? '\n... (truncated)' : ''}`;

            if (res.status === 200) {
                showAlert(`Endpoint ${url} returned 200 OK for your role (${currentUser.role}).`, 'success', 3000);
            } else if (res.status === 403) {
                showAlert(`Backend RBAC Enforcement Verified: Endpoint ${url} returned 403 Forbidden for role (${currentUser.role}).`, 'warning', 4500);
            }
        } catch (err) {
            dom.rbacTestResult.textContent = `Request failed: ${err.message}`;
        }
    }

    // -------------------------------------------------------------------------
    // Utilities & Sanitization
    // -------------------------------------------------------------------------
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function clearValidationErrors() {
        if (dom.loginEmailError) dom.loginEmailError.textContent = '';
        if (dom.loginPasswordError) dom.loginPasswordError.textContent = '';
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeJs(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"');
    }

    // -------------------------------------------------------------------------
    // Initialization & Event Binding
    // -------------------------------------------------------------------------
    function init() {
        // Form submissions
        dom.loginForm.addEventListener('submit', handleLoginSubmit);
        dom.adminForm.addEventListener('submit', handleAdminSubmit);
        dom.teacherForm.addEventListener('submit', handleTeacherSubmit);
        dom.studentForm.addEventListener('submit', handleStudentSubmit);

        // Cancel Edit buttons
        dom.btnAdminCancel.addEventListener('click', resetAdminForm);
        dom.btnTeacherCancel.addEventListener('click', resetTeacherForm);
        dom.btnStudentCancel.addEventListener('click', resetStudentForm);

        // Account creation checkbox toggle listeners
        if (dom.teacherCreateAccount) {
            dom.teacherCreateAccount.addEventListener('change', () => {
                const show = dom.teacherCreateAccount.checked;
                if (dom.teacherPasswordFields) dom.teacherPasswordFields.style.display = show ? 'flex' : 'none';
                if (!show) {
                    if (dom.teacherPassword) dom.teacherPassword.value = '';
                    if (dom.teacherConfirmPassword) dom.teacherConfirmPassword.value = '';
                    if (dom.teacherPasswordError) dom.teacherPasswordError.textContent = '';
                    if (dom.teacherConfirmPasswordError) dom.teacherConfirmPasswordError.textContent = '';
                }
            });
        }

        if (dom.studentCreateAccount) {
            dom.studentCreateAccount.addEventListener('change', () => {
                const show = dom.studentCreateAccount.checked;
                if (dom.studentPasswordFields) dom.studentPasswordFields.style.display = show ? 'flex' : 'none';
                if (!show) {
                    if (dom.studentPassword) dom.studentPassword.value = '';
                    if (dom.studentConfirmPassword) dom.studentConfirmPassword.value = '';
                    if (dom.studentPasswordError) dom.studentPasswordError.textContent = '';
                    if (dom.studentConfirmPasswordError) dom.studentConfirmPasswordError.textContent = '';
                }
            });
        }

        // Refresh buttons
        dom.btnRefreshAdmins.addEventListener('click', loadAdmins);
        dom.btnRefreshTeachers.addEventListener('click', loadTeachers);
        dom.btnRefreshStudents.addEventListener('click', loadStudents);

        // Logout
        dom.btnLogout.addEventListener('click', handleLogout);

        // Navigation Tabs
        dom.navItems.forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                if (tab) switchTab(tab);
            });
        });

        // Confirmation Modal actions
        dom.btnConfirmCancel.addEventListener('click', closeModal);
        dom.btnConfirmOk.addEventListener('click', async () => {
            if (pendingDeleteAction) {
                dom.btnConfirmOk.disabled = true;
                try {
                    await pendingDeleteAction();
                } finally {
                    dom.btnConfirmOk.disabled = false;
                    closeModal();
                }
            }
        });

        // Live RBAC Inspector Buttons
        dom.btnTestAdminsApi.addEventListener('click', () => testEndpointAuthorization('/api/admins'));
        dom.btnTestTeachersApi.addEventListener('click', () => testEndpointAuthorization('/api/teachers'));
        dom.btnTestStudentsApi.addEventListener('click', () => testEndpointAuthorization('/api/students'));

        // Expose editing and deletion handlers on window for HTML table buttons
        window.umsApp = {
            editAdmin,
            editTeacher,
            editStudent,
            confirmDelete
        };

        // Check if an existing session is valid on initial page load
        checkCurrentSession();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
