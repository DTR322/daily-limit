const form = document.getElementById('budget-form');
const savingsSlider = document.getElementById('savings');
const savingsValue = document.getElementById('savings-value');

// Обновление значения слайдера
savingsSlider.addEventListener('input', (e) => {
    savingsValue.textContent = e.target.value;
});

// Загрузка сохраненных данных
function loadSettings() {
    const saved = localStorage.getItem('daylimit-settings');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('income').value = data.income || '';
        document.getElementById('rent').value = data.rent || '';
        document.getElementById('utilities').value = data.utilities || '';
        document.getElementById('food').value = data.food || '';
        document.getElementById('transport').value = data.transport || '';
        document.getElementById('credits').value = data.credits || '';
        document.getElementById('savings').value = data.savings || 20;
        savingsValue.textContent = data.savings || 20;
    }
}

// Сохранение данных
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const settings = {
        income: parseFloat(document.getElementById('income').value) || 0,
        rent: parseFloat(document.getElementById('rent').value) || 0,
        utilities: parseFloat(document.getElementById('utilities').value) || 0,
        food: parseFloat(document.getElementById('food').value) || 0,
        transport: parseFloat(document.getElementById('transport').value) || 0,
        credits: parseFloat(document.getElementById('credits').value) || 0,
        savings: parseFloat(document.getElementById('savings').value) || 0
    };

    localStorage.setItem('daylimit-settings', JSON.stringify(settings));
    alert('Данные сохранены!');
    console.log('Settings:', settings);
});

// Инициализация
loadSettings();