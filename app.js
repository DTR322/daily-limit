// 1. Объект со стандартными (дефолтными) значениями для первого запуска
const DEFAULT_SETTINGS = {
    income: 60000,
    rent: 25000,      // Чуть снизил, чтобы было реалистичнее для регионального города
    utilities: 3000,
    food: 15000,
    transport: 1500,
    credits: 0,       // Лучше 0 по умолчанию, не у всех есть кредиты
    savings: 10       // 10% реалистичнее для старта, чем 20%
};

const form = document.getElementById('budget-form');
const savingsSlider = document.getElementById('savings');
const savingsValue = document.getElementById('savings-value');

// Обновление значения слайдера при перетаскивании
savingsSlider.addEventListener('input', (e) => {
    savingsValue.textContent = e.target.value;
});

// 2. Улучшенная загрузка данных
function loadSettings() {
    const saved = localStorage.getItem('daylimit-settings');

    // Если данные есть в памяти — берем их. Если нет — берем стандартные.
    const data = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;

    // Заполняем поля значениями (они гарантированно не будут пустыми)
    document.getElementById('income').value = data.income;
    document.getElementById('rent').value = data.rent;
    document.getElementById('utilities').value = data.utilities;
    document.getElementById('food').value = data.food;
    document.getElementById('transport').value = data.transport;
    document.getElementById('credits').value = data.credits;
    document.getElementById('savings').value = data.savings;

    // Синхронизируем текст рядом со слайдером
    savingsValue.textContent = data.savings;
}

// 3. Сохранение данных (твой код отличный, оставляем как есть)
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const settings = {
        income: parseFloat(document.getElementById('income').value) || 0,
        rent: parseFloat(document.getElementById('rent').value) || 0,
        utilities: parseFloat(document.getElementById('utilities').value) || 0,
        food: parseFloat(document.getElementById('food').value) || 0,
        transport: parseFloat(document.getElementById('transport').value) || 0,
        credits: parseFloat(document.getElementById('credits').value) || 0,
        savings: parseFloat(document.getElementById('savings').value) || 0,
        savingsUsed: 0 // Инициализируем долг/использование накоплений нулем
    };

    localStorage.setItem('daylimit-settings', JSON.stringify(settings));
    window.location.href = 'main.html';
});

// Запуск при загрузке страницы
loadSettings();