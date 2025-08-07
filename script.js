// =================================================================================
// --- ECOGAME RELOADED - SCRIPT PRINCIPAL ---
// =================================================================================

// --- MANEJO DE LA CARGA INICIAL ---
window.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.getElementById('loading-screen');
    const mainContent = document.getElementById('main-content');
    const loadingProgress = document.querySelector('.loading-progress');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress > 100) progress = 100;
        loadingProgress.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
            }, 500);
        }
    }, 200);
});

// --- NAVEGACIÓN Y UTILIDADES ---
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        // La función de scroll ya está en el HTML, esto es para el estado activo
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 68, // Altura del header
            behavior: 'smooth'
        });
    }
}

// --- SINTETIZADOR DE SONIDO (Tone.js) ---
const synth = new Tone.Synth().toDestination();
const sounds = {
    correct: 'C5',
    incorrect: 'G3',
    click: 'C4',
    plant: 'E4'
};
function playSound(sound) {
    if (window.Tone) {
        synth.triggerAttackRelease(sounds[sound], "8n");
    }
}

// =================================================================================
// --- ESTRUCTURA DE LOS MINIJUEGOS ---
// =================================================================================
const scenarios = [
    {
        type: 'quiz',
        icon: "fa-shower",
        title: "Ducha Inteligente",
        description: "¿Cuál es la forma más eco-amigable de ducharse?",
        choices: [
            { text: "Ducha rápida de 5 minutos", effect: { eco: 10, water: 10, energy: 0 }, correct: true, feedback: "¡Exacto! Ahorrar agua y tiempo es clave." },
            { text: "Baño de inmersión relajante", effect: { eco: -10, water: -25, energy: -5 }, correct: false, feedback: "Relajante, pero gasta muchísima más agua y energía." },
            { text: "Ducha larga con agua muy caliente", effect: { eco: -5, water: -15, energy: -10 }, correct: false, feedback: "El agua caliente consume mucha energía. ¡Cuidado!" }
        ]
    },
    {
        type: 'lights-out',
        icon: "fa-lightbulb",
        title: "¡Apagá la Luz!",
        description: "Las luces se encienden solas. ¡Apágalas rápido antes de que se acabe el tiempo para ahorrar energía!",
        duration: 15,
        baseEnergyLoss: 15
    },
    {
        type: 'drag-drop-recycle',
        icon: "fa-recycle",
        title: "Maestro del Reciclaje",
        description: "Arrastrá cada residuo al contenedor correcto. ¡Demostrá que sabés separar!",
        items: [
            { id: 'item1', icon: 'fa-bottle-water', category: 'recycle' },
            { id: 'item2', icon: 'fa-apple-whole', category: 'organic' },
            { id: 'item3', icon: 'fa-keyboard', category: 'ewaste' },
            { id: 'item4', icon: 'fa-newspaper', category: 'recycle' },
            { id: 'item5', icon: 'fa-car-battery', category: 'ewaste' }
        ],
        bins: [
            { id: 'recycle', name: 'Reciclables', icon: 'fa-box-archive' },
            { id: 'organic', name: 'Orgánicos', icon: 'fa-seedling' },
            { id: 'ewaste', name: 'Electrónicos', icon: 'fa-plug-circle-xmark' }
        ]
    },
    {
        type: 'planter-game',
        icon: "fa-tree",
        title: "Reforestación Rápida",
        description: "El planeta necesita más árboles. ¡Plantá todos los que puedas en 15 segundos haciendo clic en la tierra!",
        duration: 15
    },
    {
        type: 'quiz',
        icon: "fa-plug",
        title: "Consumo Fantasma",
        description: "Terminaste de cargar tu celular. ¿Qué hacés con el cargador?",
        choices: [
            { text: "Lo desenchufo de la pared", effect: { eco: 5, water: 0, energy: 5 }, correct: true, feedback: "¡Muy bien! Así se evita el consumo 'fantasma' de energía." },
            { text: "Lo dejo enchufado, es más cómodo", effect: { eco: -5, water: 0, energy: -10 }, correct: false, feedback: "Aunque no esté cargando, sigue consumiendo un poco de energía." }
        ]
    }
];

// =================================================================================
// --- LÓGICA CENTRAL DEL JUEGO ---
// =================================================================================
let gameState = {};
const elements = {
    eco: document.getElementById('eco-points'),
    water: document.getElementById('water-level'),
    energy: document.getElementById('energy-level'),
    progressNumber: document.getElementById('progress-number'),
    progressTotal: document.getElementById('progress-total'),
    progressFill: document.getElementById('game-progress-fill'),
    scenarioCard: document.getElementById('scenario-card')
};

function initGame() {
    gameState = { eco: 100, water: 100, energy: 100, current: 0, completed: false };
    elements.progressTotal.textContent = scenarios.length;
    updateStats();
    renderIntro();
}

function startGame() {
    playSound('click');
    gameState.current = 0;
    gameState.completed = false;
    renderScenario();
}

function renderIntro() {
    elements.scenarioCard.innerHTML = `
        <div class="scenario-image"><i class="fas fa-earth-americas"></i></div>
        <h3>Bienvenido al EcoChallenge</h3>
        <p>Cada minijuego pondrá a prueba tus conocimientos y reflejos. Tus decisiones afectarán los recursos del planeta. ¿Estás listo?</p>
        <div class="choices">
            <button class="btn btn-primary" onclick="startGame()"><i class="fas fa-play"></i> Comenzar Aventura</button>
        </div>`;
    updateProgress();
}

// --- Router principal que renderiza el minijuego correspondiente ---
function renderScenario() {
    if (gameState.current >= scenarios.length) {
        renderGameEnd();
        return;
    }
    const scenario = scenarios[gameState.current];
    elements.scenarioCard.style.opacity = 0;

    setTimeout(() => {
        updateProgress();
        switch (scenario.type) {
            case 'quiz': renderQuiz(scenario); break;
            case 'drag-drop-recycle': renderRecycleGame(scenario); break;
            case 'planter-game': renderPlanterGame(scenario); break;
            case 'lights-out': renderLightsOutGame(scenario); break;
        }
        elements.scenarioCard.style.opacity = 1;
    }, 400);
}

// --- Renderizadores de Minijuegos ---

function renderQuiz(scenario) {
    elements.scenarioCard.innerHTML = `
        <div class="scenario-image"><i class="fas ${scenario.icon}"></i></div>
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <div class="choices"></div>`;
    
    const container = elements.scenarioCard.querySelector('.choices');
    scenario.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn';
        btn.innerHTML = `<i class="far fa-circle"></i> ${choice.text}`;
        btn.onclick = () => handleQuizChoice(choice, scenario.choices);
        container.appendChild(btn);
    });
}

function renderRecycleGame(scenario) {
    elements.scenarioCard.innerHTML = `
        <div class="scenario-image"><i class="fas ${scenario.icon}"></i></div>
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <div class="recycle-game-container">
            <div class="items-to-drag"></div>
            <div class="drop-zones"></div>
        </div>`;

    const itemsContainer = elements.scenarioCard.querySelector('.items-to-drag');
    const binsContainer = elements.scenarioCard.querySelector('.drop-zones');
    let correctDrops = 0;
    let totalItems = scenario.items.length;
    
    scenario.items.forEach(item => {
        const itemEl = document.createElement('i');
        itemEl.id = item.id;
        itemEl.className = `fas ${item.icon} draggable-item`;
        itemEl.draggable = true;
        itemEl.dataset.category = item.category;
        itemsContainer.appendChild(itemEl);
    });
    
    scenario.bins.forEach(bin => {
        const binEl = document.createElement('div');
        binEl.className = 'recycle-bin';
        binEl.dataset.binId = bin.id;
        binEl.innerHTML = `<h4>${bin.name}</h4><i class="fas ${bin.icon}"></i>`;
        binsContainer.appendChild(binEl);
    });

    const draggables = document.querySelectorAll('.draggable-item');
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => draggable.classList.add('dragging'));
        draggable.addEventListener('dragend', () => draggable.classList.remove('dragging'));
    });

    binsContainer.querySelectorAll('.recycle-bin').forEach(bin => {
        bin.addEventListener('dragover', e => { e.preventDefault(); bin.classList.add('drag-over'); });
        bin.addEventListener('dragleave', () => bin.classList.remove('drag-over'));
        bin.addEventListener('drop', e => {
            e.preventDefault();
            bin.classList.remove('drag-over');
            const draggable = document.querySelector('.dragging');
            if (!draggable || bin.contains(draggable)) return;

            const isCorrect = draggable.dataset.category === bin.dataset.binId;
            playSound(isCorrect ? 'correct' : 'incorrect');
            bin.classList.add(isCorrect ? 'correct-drop' : 'incorrect-drop');
            if (isCorrect) correctDrops++;
            
            draggable.draggable = false;
            draggable.style.cursor = 'not-allowed';
            bin.appendChild(draggable);
            
            if (binsContainer.querySelectorAll('.draggable-item').length === totalItems) {
                const score = (correctDrops / totalItems);
                const effect = { eco: Math.round(score * 15), water: 0, energy: 0 };
                const feedbackText = `Clasificaste ${correctDrops} de ${totalItems} correctamente. ${score > 0.7 ? '¡Excelente trabajo!' : '¡Podemos mejorar!'}`;
                completeMinigame(effect, { text: feedbackText, correct: score > 0.7 });
            }
        });
    });
}

function renderPlanterGame(scenario) {
    elements.scenarioCard.innerHTML = `
        <div class="scenario-image"><i class="fas ${scenario.icon}"></i></div>
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <div class="faucet-timer">${scenario.duration}</div>
        <div class="planter-container"></div>`;

    const container = elements.scenarioCard.querySelector('.planter-container');
    const timerEl = elements.scenarioCard.querySelector('.faucet-timer');
    let timeLeft = scenario.duration;
    let treesPlanted = 0;
    let gameActive = true;
    const intervals = [];

    for (let i = 0; i < 24; i++) { // Create a 6x4 grid
        const plot = document.createElement('div');
        plot.className = 'earth-plot';
        plot.onclick = () => {
            if (plot.classList.contains('planted') || !gameActive) return;
            playSound('plant');
            plot.classList.add('planted');
            plot.innerHTML = '<i class="fas fa-tree"></i>';
            treesPlanted++;
        };
        container.appendChild(plot);
    }

    const endGame = () => {
        gameActive = false;
        intervals.forEach(clearInterval);
        
        const ecoPointsGained = treesPlanted; // 1 tree = 1 eco point
        const effect = { eco: ecoPointsGained, water: 0, energy: 0 };
        const feedbackText = `¡Tiempo! Lograste plantar ${treesPlanted} árboles. ¡El planeta te lo agradece!`;
        
        completeMinigame(effect, { text: feedbackText, correct: treesPlanted > 10 });
    };

    intervals.push(setInterval(() => {
        if (!gameActive) return;
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000));
}


function renderLightsOutGame(scenario) {
    elements.scenarioCard.innerHTML = `
        <div class="scenario-image"><i class="fas ${scenario.icon}"></i></div>
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
        <div class="faucet-timer">${scenario.duration}</div>
        <div class="lights-out-container"></div>`;

    const container = elements.scenarioCard.querySelector('.lights-out-container');
    const timerEl = elements.scenarioCard.querySelector('.faucet-timer');
    let timeLeft = scenario.duration;
    let lightsOff = 0;
    
    for (let i = 0; i < 9; i++) {
        const switchEl = document.createElement('div');
        switchEl.className = 'light-switch';
        switchEl.dataset.id = i;
        switchEl.innerHTML = `<i class="fas fa-lightbulb"></i>`;
        switchEl.onclick = () => {
            if (switchEl.classList.contains('on')) {
                playSound('click');
                lightsOff++;
                switchEl.classList.remove('on');
            }
        };
        container.appendChild(switchEl);
    }

    const switches = container.querySelectorAll('.light-switch');
    const gameInterval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * switches.length);
        switches[randomIndex].classList.add('on');
    }, 700);
    
    const timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(gameInterval);
            clearInterval(timerInterval);
            const energyLost = Math.round(scenario.baseEnergyLoss * (1 - (lightsOff / 15))); // Estimación
            const effect = { eco: 0, water: 0, energy: -energyLost };
            const feedbackText = `¡Se acabó el tiempo! Apagaste ${lightsOff} luces.`;
            completeMinigame(effect, { text: feedbackText, correct: lightsOff > 10 });
        }
    }, 1000);
}

// --- Manejadores y Funciones de Estado ---

function handleQuizChoice(choice, allChoices) {
    playSound(choice.correct ? 'correct' : 'incorrect');
    const buttons = elements.scenarioCard.querySelectorAll('.choice-btn');
    buttons.forEach(btn => {
        btn.disabled = true;
        const choiceData = allChoices.find(c => btn.innerText.includes(c.text));
        if (choiceData) {
            btn.classList.add(choiceData.correct ? "correct" : "incorrect");
            btn.querySelector('i').className = choiceData.correct ? 'fas fa-check-circle' : 'fas fa-times-circle';
        }
    });
    document.activeElement.classList.add('selected');
    completeMinigame(choice.effect, { text: choice.feedback, correct: choice.correct });
}

function completeMinigame(effect, feedback) {
    if (gameState.completed) return;

    // Actualizar estado
    gameState.eco = Math.max(0, Math.min(200, gameState.eco + (effect.eco || 0)));
    gameState.water = Math.max(0, Math.min(200, gameState.water + (effect.water || 0)));
    gameState.energy = Math.max(0, Math.min(200, gameState.energy + (effect.energy || 0)));
    
    // Mostrar feedback visual
    const feedbackEl = document.createElement('div');
    feedbackEl.className = `feedback-modal ${feedback.correct ? 'correct' : 'incorrect'}`;
    feedbackEl.innerHTML = `
        <i class="fas ${feedback.correct ? 'fa-check-circle' : 'fa-times-circle'}"></i>
        <p>${feedback.text}</p>`;
    elements.scenarioCard.appendChild(feedbackEl);
    
    // Avanzar al siguiente escenario
    setTimeout(() => {
        gameState.current++;
        renderScenario();
    }, 2500);
}

function renderGameEnd() {
    gameState.completed = true;
    updateProgress();
    let finalMessage = "¡Buen trabajo! Cada pequeña acción cuenta.";
    if (gameState.eco >= 130) {
        finalMessage = "¡Excelente! Sos un verdadero campeón del medio ambiente.";
    } else if (gameState.eco < 90) {
        finalMessage = "Hay espacio para mejorar. ¡Seguí intentando y aprendiendo!";
    }

    elements.scenarioCard.style.opacity = 0;
    setTimeout(() => {
        elements.scenarioCard.innerHTML = `
            <div class="scenario-image"><i class="fas fa-trophy"></i></div>
            <h3>¡Desafío Completado!</h3>
            <p>${finalMessage}</p>
            <div class="final-scores">
                <p><strong>Puntaje Eco:</strong> ${gameState.eco}</p>
                <p><strong>Agua:</strong> ${gameState.water}%</p>
                <p><strong>Energía:</strong> ${gameState.energy}%</p>
            </div>
            <div class="choices" style="margin-top:25px">
                <button class="btn btn-primary" onclick="initGame()"><i class="fas fa-redo"></i> Jugar de Nuevo</button>
            </div>`;
        elements.scenarioCard.style.opacity = 1;
    }, 400);
}

function updateStats() {
    elements.eco.textContent = gameState.eco;
    elements.water.textContent = `${gameState.water}%`;
    elements.energy.textContent = `${gameState.energy}%`;
}

function updateProgress() {
    const progress = gameState.completed ? gameState.current : gameState.current;
    elements.progressNumber.textContent = progress;
    elements.progressFill.style.width = `${(progress / scenarios.length) * 100}%`;
    updateStats();
}

// =================================================================================
// --- ANIMACIÓN DE DATOS REALES ---
// =================================================================================
function animateRealData() {
    const counters = document.querySelectorAll('.real-data-number');
    const speed = 200; // Velocidad de la animación

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;

            const inc = target / speed;

            if (count < target) {
                const newCount = count + inc;
                // Manejar decimales para números como 1.15
                if (target.toString().includes('.')) {
                    counter.innerText = newCount.toFixed(2);
                } else {
                    counter.innerText = Math.ceil(newCount);
                }
                setTimeout(updateCount, 10);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    });
}

const realDataSection = document.getElementById('real-data');
const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateRealData();
            observer.unobserve(entry.target); // Para que la animación se ejecute solo una vez
        }
    });
}, { threshold: 0.5 }); // Se dispara cuando el 50% de la sección es visible

observer.observe(realDataSection);


// =================================================================================
// --- GRÁFICOS (Chart.js) ---
// =================================================================================
function renderCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = '#bdc3c7';

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#ecf0f1' } } }
    };

    new Chart(document.getElementById('water-chart').getContext('2d'), {
        type: 'pie',
        data: { labels: ['Agricultura', 'Industria', 'Doméstico'], datasets: [{ data: [70, 20, 10], backgroundColor: ['#2ecc71', '#f1c40f', '#3498db'], borderWidth: 0 }] },
        options: chartOptions
    });

    new Chart(document.getElementById('energy-chart').getContext('2d'), {
        type: 'bar',
        data: { labels: ['Fósiles', 'Renovables', 'Nuclear'], datasets: [{ label: 'Generación Global', data: [75, 20, 5], backgroundColor: ['#e74c3c', '#2ecc71', '#f39c12'] }] },
        options: { ...chartOptions, scales: { y: { beginAtZero: true, ticks: { color: '#bdc3c7' } }, x: { ticks: { color: '#bdc3c7' } } } }
    });

    new Chart(document.getElementById('recycle-chart').getContext('2d'), {
        type: 'doughnut',
        data: { labels: ['Desechado', 'Incinerado', 'Reciclado'], datasets: [{ data: [55, 25, 20], backgroundColor: ['#c0392b', '#f39c12', '#2ecc71'], borderWidth: 0 }] },
        options: { ...chartOptions, cutout: '70%' }
    });
}

// --- INICIALIZACIÓN ---
window.addEventListener('load', () => {
    if(typeof Chart !== 'undefined') {
        renderCharts();
    }
    initGame();
});
