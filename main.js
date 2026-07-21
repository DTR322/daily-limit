// === СОСТОЯНИЕ ===
let settings = null;
let transactions = [];
let selectedCategory = null;

// === УТИЛИТЫ ===
function formatMoney(amount) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount))) + ' ₽';
}

function getDaysWord(n) {
    const abs = Math.abs(n) % 100;
    const n1 = abs % 10;
    if (abs > 10 && abs < 20) return 'дней';
    if (n1 > 1 && n1 < 5) return 'дня';
    if (n1 === 1) return 'день';
    return 'дней';
}

function getMonthKey() {
    const today = new Date();
    return `daylimit-transactions-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function isToday(dateStr) {
    const today = new Date().toDateString();
    return new Date(dateStr).toDateString() === today;
}

// === ДАННЫЕ ===
function loadSettings() {
    const saved = localStorage.getItem('daylimit-settings');
    if (!saved) {
        window.location.href = 'index.html';
        return null;
    }
    const data = JSON.parse(saved);
    if (data.savingsUsed === undefined) {
        data.savingsUsed = 0;
        localStorage.setItem('daylimit-settings', JSON.stringify(data));
    }
    return data;
}

function saveSettings() {
    localStorage.setItem('daylimit-settings', JSON.stringify(settings));
}

function loadTransactions() {
    const saved = localStorage.getItem(getMonthKey());
    transactions = saved ? JSON.parse(saved) : [];
}

function saveTransactions() {
    localStorage.setItem(getMonthKey(), JSON.stringify(transactions));
}

// === РАСЧЁТЫ ===
function calculateLimit() {
    if (!settings) {
        return {
            fixedExpenses: 0,
            plannedSavings: 0,
            savingsUsed: 0,
            freeMoney: 0,
            actualSavings: 0,
            debt: 0,
            baseBudget: 0,
            daysRemaining: 0,
            dailyLimit: 0,
            totalSpentMonth: 0,
            totalSpentToday: 0,
            remainingToday: 0
        };
    }

    const fixedExpenses = settings.rent + settings.utilities + settings.food + settings.transport + settings.credits;
    const plannedSavings = settings.income * settings.savings / 100;
    const savingsUsed = settings.savingsUsed || 0;

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate();

    const totalSpentMonth = transactions.reduce((sum, t) => sum + t.amount, 0);
    const baseBudget = settings.income - fixedExpenses;

    const freeMoney = Math.max(0, baseBudget - plannedSavings - totalSpentMonth + savingsUsed);
    const actualSavings = Math.max(0, plannedSavings - savingsUsed);
    const debt = Math.max(0, totalSpentMonth - baseBudget);

    const dailyLimit = daysRemaining > 0 ? freeMoney / daysRemaining : 0;

    const totalSpentToday = transactions
        .filter(t => isToday(t.date))
        .reduce((sum, t) => sum + t.amount, 0);

    const remainingToday = dailyLimit - totalSpentToday;

    return {
        fixedExpenses,
        plannedSavings,
        savingsUsed,
        freeMoney,
        actualSavings,
        debt,
        baseBudget,
        daysRemaining,
        dailyLimit,
        totalSpentMonth,
        totalSpentToday,
        remainingToday
    };
}

// === АВТОМАТИЧЕСКАЯ ЦЕПОЧКА СПИСАНИЯ ===
function applySpendingChain(transaction) {
    transactions.unshift(transaction);

    const fixedExpenses = settings.rent + settings.utilities + settings.food + settings.transport + settings.credits;
    const baseBudget = settings.income - fixedExpenses;
    const plannedSavings = settings.income * settings.savings / 100;
    const totalSpentMonth = transactions.reduce((sum, t) => sum + t.amount, 0);

    const requiredSavingsUsed = totalSpentMonth - (baseBudget - plannedSavings);

    if (requiredSavingsUsed > 0) {
        settings.savingsUsed = Math.min(requiredSavingsUsed, plannedSavings);
    } else {
        settings.savingsUsed = 0;
    }

    saveSettings();
    saveTransactions();
    render();
}

// === ОБРАТНАЯ ЦЕПОЧКА (при удалении) ===
function reverseSpendingChain(transactionIndex) {
    transactions.splice(transactionIndex, 1);

    const fixedExpenses = settings.rent + settings.utilities + settings.food + settings.transport + settings.credits;
    const baseBudget = settings.income - fixedExpenses;
    const plannedSavings = settings.income * settings.savings / 100;
    const totalSpentMonth = transactions.reduce((sum, t) => sum + t.amount, 0);

    const requiredSavingsUsed = totalSpentMonth - (baseBudget - plannedSavings);

    if (requiredSavingsUsed > 0) {
        settings.savingsUsed = Math.min(requiredSavingsUsed, plannedSavings);
    } else {
        settings.savingsUsed = 0;
    }

    saveSettings();
    saveTransactions();
    render();
}

// === ОТОБРАЖЕНИЕ ===
function render() {
    const data = calculateLimit();

    const displayLimit = Math.max(0, data.remainingToday);
    document.getElementById('daily-limit').textContent = formatMoney(displayLimit);
    document.getElementById('limit-hint').textContent =
        `До зарплаты ${data.daysRemaining} ${getDaysWord(data.daysRemaining)}`;

    const card = document.getElementById('limit-card');
    card.classList.remove('warning', 'danger', 'overspent');

    if (data.remainingToday < 0) {
        card.classList.add('overspent');
    } else if (data.remainingToday < 500) {
        card.classList.add('danger');
    } else if (data.remainingToday < 1500) {
        card.classList.add('warning');
    }

    const progress = data.dailyLimit > 0 ? Math.min((data.totalSpentToday / data.dailyLimit) * 100, 100) : 0;
    const progressFill = document.getElementById('progress-fill');
    progressFill.style.width = progress + '%';
    progressFill.classList.remove('warning', 'danger');
    if (data.remainingToday < 0 || progress > 80) progressFill.classList.add('danger');
    else if (progress > 50) progressFill.classList.add('warning');

    document.getElementById('progress-text').textContent =
        `${formatMoney(data.totalSpentToday)} / ${formatMoney(data.dailyLimit)}`;

    document.getElementById('days-remaining').textContent = data.daysRemaining;
    document.getElementById('free-money').textContent = formatMoney(data.freeMoney);

    const savingsEl = document.getElementById('savings-amount');
    const savingsLabel = savingsEl.nextElementSibling;
    savingsEl.classList.remove('debt');

    if (data.debt > 0) {
        savingsEl.textContent = '-' + formatMoney(data.debt);
        savingsEl.classList.add('debt');
        savingsLabel.textContent = 'долг';
    } else {
        savingsEl.textContent = formatMoney(data.actualSavings);
        savingsLabel.textContent = 'накопления';
    }

    renderTransactions();
}

function renderTransactions() {
    const list = document.getElementById('transactions-list');
    const todayTransactions = transactions.filter(t => isToday(t.date));

    if (todayTransactions.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💸</div>
                <div class="empty-title">Пока нет трат</div>
            </div>
        `;
        return;
    }

    list.innerHTML = todayTransactions.map((t) => {
        const realIndex = transactions.indexOf(t);
        return `
            <div class="transaction">
                <div class="transaction-left">
                    <div class="transaction-icon">${t.name.split(' ')[0]}</div>
                    <div>
                        <div class="transaction-name">${t.name.split(' ').slice(1).join(' ') || t.name}</div>
                        <div class="transaction-time">${new Date(t.date).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount">-${formatMoney(t.amount)}</div>
                    <button class="delete-btn" data-index="${realIndex}">×</button>
                </div>
            </div>
        `;
    }).join('');

    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            reverseSpendingChain(index);
        });
    });
}

// === МОДАЛКИ ===
const modal = document.getElementById('modal');
const addBtn = document.getElementById('add-btn');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const customInput = document.getElementById('custom-amount');

if (!modal || !addBtn || !saveBtn) {
    console.error('Не найдены элементы модалки!');
}

function openModal() {
    if (!modal) return;
    modal.classList.remove('hidden');
    selectedCategory = null;
    if (customInput) customInput.value = '';
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
}

function closeModal() {
    if (!modal) return;
    modal.classList.add('hidden');
}

if (addBtn) addBtn.addEventListener('click', openModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
if (modal) {
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);
}

document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedCategory = {
            name: btn.dataset.name,
            amount: parseFloat(btn.dataset.amount)
        };
        if (customInput) customInput.value = '';
        document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    });
});

if (saveBtn) {
    saveBtn.addEventListener('click', () => {
        let transaction = null;

        if (customInput && customInput.value && parseFloat(customInput.value) > 0) {
            transaction = {
                name: '💳 Покупка',
                amount: parseFloat(customInput.value),
                date: new Date().toISOString()
            };
        } else if (selectedCategory) {
            transaction = {
                name: selectedCategory.name,
                amount: selectedCategory.amount,
                date: new Date().toISOString()
            };
        }

        if (transaction) {
            closeModal();
            applySpendingChain(transaction);
        }
    });
}

const clearBtn = document.getElementById('clear-btn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        const todayTransactions = transactions.filter(t => isToday(t.date));
        if (todayTransactions.length === 0) return;
        if (confirm('Очистить все траты за сегодня?')) {
            const todayIndices = transactions
                .map((t, i) => isToday(t.date) ? i : -1)
                .filter(i => i !== -1)
                .reverse();

            todayIndices.forEach(index => reverseSpendingChain(index));
        }
    });
}

// === ИНИЦИАЛИЗАЦИЯ ===
settings = loadSettings();
if (settings) {
    loadTransactions();
    render();
} else {
    console.error('Settings не загружены!');
}