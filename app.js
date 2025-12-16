// Utility functions
function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || {};
}

function setUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem('currentUser');
}

function setCurrentUser(username) {
    localStorage.setItem('currentUser', username);
}

function getUserData() {
    const users = getUsers();
    const currentUser = getCurrentUser();
    if (!currentUser || !users[currentUser]) return { incomes: [], expenses: [] };
    return users[currentUser].data || { incomes: [], expenses: [] };
}

function setUserData(data) {
    const users = getUsers();
    const currentUser = getCurrentUser();
    if (currentUser) {
        users[currentUser].data = data;
        setUsers(users);
    }
}

function checkAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser && !window.location.pathname.includes('login') && !window.location.pathname.includes('signup')) {
        window.location.href = 'login.html';
    }
}

function formatCurrency(amount) {
    return '₹' + amount.toFixed(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

// Login functionality
function handleLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const users = getUsers();
        const errorEl = document.getElementById('error');

        if (users[username] && users[username].password === password) {
            setCurrentUser(username);
            window.location.href = 'index.html';
        } else {
            errorEl.textContent = 'Invalid username or password';
        }
    });
}

// Signup functionality
function handleSignup() {
    const form = document.getElementById('signupForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const users = getUsers();
        const errorEl = document.getElementById('error');

        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            return;
        }

        if (users[username]) {
            errorEl.textContent = 'Username already exists';
            return;
        }

        users[username] = { password, email, phone, data: { incomes: [], expenses: [] } };
        setUsers(users);
        window.location.href = 'login.html';
    });
}

// Dashboard functionality
function loadDashboard() {
    const data = getUserData();
    const totalIncome = data.incomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
    const totalExpense = data.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpense').textContent = formatCurrency(totalExpense);

    // Recent transactions
    const allTransactions = [
        ...data.incomes.map(inc => ({ ...inc, type: 'income' })),
        ...data.expenses.map(exp => ({ ...exp, type: 'expense' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    const transactionsEl = document.getElementById('recentTransactions');
    transactionsEl.innerHTML = '';

    allTransactions.forEach(trans => {
        const item = document.createElement('div');
        item.className = `transaction-item ${trans.type}`;
        item.innerHTML = `
            <div>
                <strong>${trans.name || trans.category}</strong>
                <p>${trans.category} - ${formatDate(trans.date)}</p>
            </div>
            <div class="amount">${trans.type === 'income' ? '+' : '-'}${formatCurrency(trans.amount)}</div>
        `;
        transactionsEl.appendChild(item);
    });
}

// Add Income functionality
function handleAddIncome() {
    const form = document.getElementById('incomeForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const data = getUserData();

        data.incomes.push({
            amount,
            category,
            date: new Date().toISOString()
        });

        setUserData(data);
        document.getElementById('success').textContent = 'Income added successfully!';
        form.reset();
        setTimeout(() => window.location.href = 'index.html', 1000);
    });
}

// Add Expense functionality
function handleAddExpense() {
    const form = document.getElementById('expenseForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const data = getUserData();

        data.expenses.push({
            id: Date.now(),
            name,
            amount,
            category,
            date: new Date().toISOString()
        });

        setUserData(data);
        document.getElementById('success').textContent = 'Expense added successfully!';
        form.reset();
        setTimeout(() => window.location.href = 'index.html', 1000);
    });
}

// Records functionality
function loadRecords() {
    const data = getUserData();
    let expenses = data.expenses;

    function renderRecords() {
        const recordsEl = document.getElementById('recordsList');
        recordsEl.innerHTML = '';

        expenses.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'record-item';
            item.innerHTML = `
                <div>
                    <strong>${exp.name}</strong>
                    <p>${exp.category} - ${formatDate(exp.date)}</p>
                </div>
                <div>
                    <span>${formatCurrency(exp.amount)}</span>
                    <button class="delete-btn" data-id="${exp.id}">Delete</button>
                </div>
            `;
            recordsEl.appendChild(item);
        });

        document.getElementById('totalCount').textContent = expenses.length;
    }

    renderRecords();

    // Filter functionality
    document.getElementById('filterBtn').addEventListener('click', function() {
        const dateFilter = document.getElementById('dateFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;

        expenses = data.expenses.filter(exp => {
            const dateMatch = !dateFilter || exp.date.startsWith(dateFilter);
            const categoryMatch = !categoryFilter || exp.category === categoryFilter;
            return dateMatch && categoryMatch;
        });

        renderRecords();
    });

    // Delete functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            data.expenses = data.expenses.filter(exp => exp.id !== id);
            setUserData(data);
            loadRecords(); // Reload
        }
    });
}

// Profile functionality
function loadProfile() {
    const currentUser = getCurrentUser();
    const users = getUsers();
    const user = users[currentUser];

    if (user) {
        document.getElementById('username').textContent = currentUser;
        document.getElementById('email').textContent = user.email;
        document.getElementById('phone').textContent = user.phone;
    }

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}

// Initialize based on page
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();

    const path = window.location.pathname;
    if (path.includes('login.html')) {
        handleLogin();
    } else if (path.includes('signup.html')) {
        handleSignup();
    } else if (path.includes('index.html')) {
        loadDashboard();
    } else if (path.includes('income.html')) {
        handleAddIncome();
    } else if (path.includes('expense.html')) {
        handleAddExpense();
    } else if (path.includes('records.html')) {
        loadRecords();
    } else if (path.includes('profile.html')) {
        loadProfile();
    }
});
