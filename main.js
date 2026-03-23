// JavaScript logic moved from main.html

// Each option is now an object: { name, weight, color }
const options = [
    { name: "title", weight: 1, color: generateRandomColor() }
];

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let startAngle = 0;
let spinning = false;
let spinTimeout = null;
let spinAngle = 0;
let spinVelocity = 0;
let editMode = true;  // Start in edit mode

function generateRandomColor() {
    const h = Math.floor(Math.random() * 26) + 40;  // 40-65
    const s = Math.floor(Math.random() * 41) + 50;  // 50-90
    const l = Math.floor(Math.random() * 61) + 20;  // 20-80
    return `hsl(${h}, ${s}%, ${l}%)`;
}

function getTotalWeight() {
    return options.reduce((sum, opt) => sum + Number(opt.weight || 0), 0);
}

function calculatePercents() {
    const totalWeight = getTotalWeight();
    if (totalWeight === 0) return;
    options.forEach(opt => {
        opt.percent = Number(((opt.weight / totalWeight) * 100).toFixed(2));
    });

    // Fix tiny rounding drift to ensure exactly 100
    let diff = Number((100 - options.reduce((sum, opt) => sum + opt.percent, 0)).toFixed(2));
    if (Math.abs(diff) >= 0.01 && options.length > 0) {
        options[0].percent = Number((options[0].percent + diff).toFixed(2));
    }
}

function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 180;
    const numOptions = options.length;
    if (numOptions === 0) return;

    let angle = startAngle;
    for (let i = 0; i < numOptions; i++) {
        const arc = 2 * Math.PI * (options[i].percent / 100);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.closePath();
        ctx.fillStyle = options[i].color;  // Use the option's random color
        ctx.fill();
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#222";
        ctx.font = "18px Arial";
        ctx.fillText(options[i].name, radius - 10, 10);  // Removed percentage from wheel
        ctx.restore();
        angle += arc;
    }
    // Draw pointer
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + radius - 10);
    ctx.lineTo(centerX + 15, centerY + radius + 20);
    ctx.lineTo(centerX - 15, centerY + radius + 20);
    ctx.closePath();
    ctx.fillStyle = "#222";
    ctx.fill();
}

function updateOptionsList() {
    const listDiv = document.getElementById('optionsList');
    listDiv.innerHTML = '';

    // Add Edit/Save button
    const modeBtn = document.createElement('button');
    modeBtn.textContent = editMode ? 'Save' : 'Edit';
    modeBtn.className = 'btn';
    modeBtn.onclick = () => {
        editMode = !editMode;
        updateOptionsList();
        drawWheel();
    };
    listDiv.appendChild(modeBtn);

    options.forEach((opt, idx) => {
        const span = document.createElement('span');
        span.className = 'option-item';
        span.style.display = 'block';
        span.style.margin = '10px auto';
        span.style.backgroundColor = opt.color;  // Set background to the option's color
        span.style.color = 'white';  // White text for contrast
        span.style.padding = '5px 10px';  // Add padding for better visibility
        span.style.borderRadius = '5px';  // Rounded corners

        if (editMode) {
            // Editable mode: inputs for name and weight, remove button

            // Name input
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = opt.name;
            nameInput.onchange = (e) => {
                opt.name = e.target.value.trim();
                saveOptions();
                drawWheel();
            };
            span.appendChild(nameInput);

            // Weight input
            const input = document.createElement('input');
            input.type = 'number';
            input.min = 0;
            input.value = opt.weight;
            input.style.width = '50px';
            input.onchange = (e) => {
                let val = parseFloat(e.target.value);
                if (isNaN(val) || val < 0) val = 0;
                opt.weight = val;
                calculatePercents();
                updateOptionsList();
                drawWheel();
            };
            span.appendChild(input);

            // Percentage label
            const percentLabel = document.createElement('span');
            percentLabel.textContent = ` (${opt.percent.toFixed(2)}%) `;
            span.appendChild(percentLabel);

            // Remove button
            const btn = document.createElement('span');
            btn.className = 'remove-btn';
            btn.textContent = '×';
            btn.onclick = () => {
                options.splice(idx, 1);
                calculatePercents();
                updateOptionsList();
                drawWheel();
            };
            span.appendChild(btn);
        } else {
            // Display mode: spans for name and weight, no remove

            // Name span
            const nameSpan = document.createElement('span');
            nameSpan.textContent = `${opt.name} `;
            span.appendChild(nameSpan);

            // Weight span (showing percentage)
            const weightSpan = document.createElement('span');
            weightSpan.textContent = `(${opt.percent.toFixed(2)}%) `;
            span.appendChild(weightSpan);
        }

        listDiv.appendChild(span);
    });
    // After updating the list, save to localStorage
    saveOptions();
}

function addOption() {
    const input = document.getElementById('optionInput');
    const value = input.value.trim();
    if (!value) return;

    // Match all quoted strings: "item1" "item2"
    const matches = value.match(/"([^"]+)"/g);
    let items = [];
    if (matches) {
        items = matches.map(m => m.slice(1, -1));
    } else {
        // fallback: treat as single item if no quotes
        items = [value];
    }

    // Filter out duplicates
    items = items.filter(item => !options.some(opt => opt.name === item));

    if (items.length > 0) {
        // Add with default weight of 1 and random color
        items.forEach(item => options.push({ name: item, weight: 1, color: generateRandomColor() }));
        calculatePercents();
        input.value = '';
        updateOptionsList();
        drawWheel();
    }
}

document.getElementById('optionInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') addOption();
});

function spinWheel() {
    if (spinning || options.length === 0) return;
    spinning = true;
    document.getElementById('result').textContent = '';
    document.getElementById('spinBtn').disabled = true;
    spinVelocity = Math.random() * 0.3 + 0.25;
    const spinStartTime = Date.now();
    const spinDurationInput = document.getElementById('spinDurationInput');
    const spinDuration = spinDurationInput ? parseInt(spinDurationInput.value, 10) * 1000 : 7000;
    animateSpin(spinStartTime, spinDuration);
}

function animateSpin(spinStartTime, spinDuration) {
    const elapsed = Date.now() - spinStartTime;
    
    if (elapsed < spinDuration) {
        // Calculate friction based on remaining time
        const remainingTime = spinDuration - elapsed;
        spinVelocity = Math.max(0.002, (remainingTime / spinDuration) * 0.3);
        
        spinAngle += spinVelocity;
        startAngle = spinAngle;
        drawWheel();
        spinTimeout = requestAnimationFrame(() => animateSpin(spinStartTime, spinDuration));
    } else {
        spinning = false;
        document.getElementById('spinBtn').disabled = false;
        // showResult();
    }
}

// function showResult() {
//     let angle = (2 * Math.PI - (startAngle % (2 * Math.PI))) % (2 * Math.PI);
//     // Find which option the angle lands on
//     let acc = 0;
//     for (let i = 0; i < options.length; i++) {
//         const arc = 2 * Math.PI * (options[i].percent / 100);
//         if (angle >= acc && angle < acc + arc) {
//             document.getElementById('result').textContent = `Result: ${options[i].name}`;
//             return;
//         }
//         acc += arc;
//     }
//     // Fallback
//     if (options.length > 0)
//         document.getElementById('result').textContent = `Result: ${options[0].name}`;
// }

// Load options from localStorage or use default
const savedOptions = localStorage.getItem('wheelOptions');
if (savedOptions) {
    options.length = 0; // Clear default
    const parsed = JSON.parse(savedOptions);
    // Ensure each has a color, generate if missing
    parsed.forEach(opt => {
        if (!opt.color) opt.color = generateRandomColor();
        options.push(opt);
    });
}

function saveOptions() {
    localStorage.setItem('wheelOptions', JSON.stringify(options));
}

// Load saved inputs
const savedDuration = localStorage.getItem('spinDuration');
if (savedDuration) document.getElementById('spinDurationInput').value = savedDuration;

const savedOptionInput = localStorage.getItem('optionInput');
if (savedOptionInput) document.getElementById('optionInput').value = savedOptionInput;

// Save inputs on change
document.getElementById('spinDurationInput').addEventListener('change', (e) => {
    localStorage.setItem('spinDuration', e.target.value);
});

document.getElementById('optionInput').addEventListener('input', (e) => {
    localStorage.setItem('optionInput', e.target.value);
});

// Clear button functionality
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire list? This action cannot be undone.')) {
        options.length = 0; // Clear all options
        calculatePercents();
        updateOptionsList();
        drawWheel();
        saveOptions();
    }
});

// Initial draw
calculatePercents();
updateOptionsList();
drawWheel();

// Download button functionality
document.getElementById('downloadBtn').addEventListener('click', () => {
    const data = options.map(opt => `"${opt.name}"-"${opt.weight}"`).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wheel_options.txt';
    a.click();
    URL.revokeObjectURL(url);
});

// Load file functionality
document.getElementById('loadFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const newOptions = [];

        for (const line of lines) {
            const parts = line.split('-');
            if (parts.length === 2) {
                const name = parts[0].replace(/"/g, '').trim();
                const weight = parseFloat(parts[1].replace(/"/g, '').trim());
                if (name && !isNaN(weight) && weight > 0) {
                    newOptions.push({ name, weight, color: generateRandomColor() });
                }
            }
        }

        if (newOptions.length > 0) {
            options.length = 0; // Clear current options
            options.push(...newOptions);
            calculatePercents();
            updateOptionsList();
            drawWheel();
            saveOptions();
        } else {
            alert('Invalid file format. Expected "name"-"weight" per line.');
        }
    };
    reader.readAsText(file);
});

function applyBackgroundUrl(url) {
    if (url && url.trim()) {
        document.body.style.backgroundImage = `url('${url}')`;
        localStorage.setItem('backgroundURL', url);
    } else {
        document.body.style.backgroundImage = '';
        localStorage.removeItem('backgroundURL');
    }
}

// on load
const savedBackgroundUrl = localStorage.getItem('backgroundURL');
if (savedBackgroundUrl) {
    applyBackgroundUrl(savedBackgroundUrl);
}

// button actions
document.getElementById('setBackgroundBtn').addEventListener('click', () => {
    const current = localStorage.getItem('backgroundURL') || '';
    const url = prompt('Enter background image URL', current);
    if (url !== null) {
        applyBackgroundUrl(url);
    }
});

document.getElementById('resetBackgroundBtn').addEventListener('click', () => {
    if (confirm('Reset background image to default?')) {
        applyBackgroundUrl('');
    }
});