const SPRITESHEET = "animals.png";

const COLUMNS = 8;
const ROWS = 5;

const animals = [
    // Fila 1
    { name: "gat", col: 0, row: 0 },
    { name: "gos", col: 1, row: 0 },
    { name: "cavall", col: 2, row: 0 },
    { name: "vaca", col: 3, row: 0 },
    { name: "conill", col: 4, row: 0 },
    { name: "porc", col: 5, row: 0 },
    { name: "ovella", col: 6, row: 0 },
    { name: "lloro", col: 7, row: 0 },

    // Fila 2
    { name: "abella", col: 0, row: 1 },
    { name: "gallina", col: 1, row: 1 },
    { name: "cabra", col: 2, row: 1 },
    { name: "ànec", col: 3, row: 1 },
    { name: "ós", col: 4, row: 1 },
    { name: "ratolí", col: 5, row: 1 },
    { name: "peix", col: 6, row: 1 },
    { name: "guineu", col: 7, row: 1 },

    // Fila 3
    { name: "colom", col: 0, row: 2 },
    { name: "mico", col: 1, row: 2 },
    { name: "oca", col: 2, row: 2 },
    { name: "lleó", col: 3, row: 2 },
    { name: "tigre", col: 4, row: 2 },
    { name: "elefant", col: 5, row: 2 },
    { name: "girafa", col: 6, row: 2 },
    { name: "zebra", col: 7, row: 2 },

    // Fila 4
    { name: "serp", col: 0, row: 3 },
    { name: "granota", col: 1, row: 3 },
    { name: "tortuga", col: 2, row: 3 },
    { name: "mussol", col: 3, row: 3 },
    { name: "ratpenat", col: 4, row: 3 },
    { name: "llop", col: 5, row: 3 },
    { name: "cérvol", col: 6, row: 3 },
    { name: "esquirol", col: 7, row: 3 },

    // Fila 5
    { name: "eriçó", col: 0, row: 4 },
    { name: "pingüí", col: 1, row: 4 },
    { name: "foca", col: 2, row: 4 },
    { name: "dofí", col: 3, row: 4 },
    { name: "cranc", col: 4, row: 4 },
    { name: "pop", col: 5, row: 4 },
    { name: "papallona", col: 6, row: 4 },
    { name: "cocodril", col: 7, row: 4 }
];


// ─────────────────────────────
// NIVELLS
// ─────────────────────────────

const levels = {
    1: [
        "gat",
        "gos",
        "vaca",
        "porc",
        "peix",
        "oca",
        "foca",
        "pop"
    ],

    2: [
        "ovella",
        "cavall",
        "conill",
        "cabra",
        "lloro",
        "zebra",
        "abella",
        "gallina"
    ],

    3: [
        "elefant",
        "girafa",
        "guineu",
        "tigre",
        "llop",
        "serp",
        "granota",
        "mussol"
    ],

    4: [
        "tortuga",
        "ratpenat",
        "cocodril",
        "papallona",
        "cranc",
        "colom",
        "esquirol"
    ],

    5: [
        "cavall",
        "elefant",
        "papallona",
        "cocodril",
        "ratpenat",
        "esquirol"
    ],

    // TOTS els animals amb accent
    6: [
        "ànec",
        "ós",
        "ratolí",
        "lleó",
        "cérvol",
        "eriçó",
        "pingüí",
        "dofí"
    ]
};


// ─────────────────────────────
// ELEMENTS HTML
// ─────────────────────────────

const gameArea = document.getElementById("gameArea");
const typingInput = document.getElementById("typingInput");

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const bestScoreElement = document.getElementById("bestScore");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const finalScore = document.getElementById("finalScore");
const finalBest = document.getElementById("finalBest");


// ─────────────────────────────
// ESTAT DEL JOC
// ─────────────────────────────

let score = 0;
let level = 1;
let lives = 3;

let gameRunning = false;
let lastTime = 0;
let spawnTimer = 0;

let fallingAnimals = [];

let bestScore = Number(
    localStorage.getItem("plujaAnimalsBestScore") || 0
);

bestScoreElement.textContent = bestScore;


// ─────────────────────────────
// ANIMALS DISPONIBLES
// ─────────────────────────────

function getAvailableAnimals() {
    let available = [];

    for (let i = 1; i <= level; i++) {
        if (levels[i]) {
            available.push(...levels[i]);
        }
    }

    return available;
}


function getAnimalByName(name) {
    return animals.find(animal => animal.name === name);
}


// ─────────────────────────────
// CREAR ANIMAL
// ─────────────────────────────

function spawnAnimal() {

    const availableNames = getAvailableAnimals();

    if (availableNames.length === 0) {
        return;
    }

    const randomName =
        availableNames[
            Math.floor(Math.random() * availableNames.length)
        ];

    const animal = getAnimalByName(randomName);

    if (!animal) {
        return;
    }

    const element = document.createElement("div");

    element.className = "falling-animal";

    const sprite = document.createElement("div");

    sprite.className = "animal-sprite";

    sprite.style.backgroundImage = `url("${SPRITESHEET}")`;

    sprite.style.backgroundSize = `${COLUMNS * 100}% ${ROWS * 100}%`;

    sprite.style.backgroundPosition =
        `${(animal.col / (COLUMNS - 1)) * 100}% ` +
        `${(animal.row / (ROWS - 1)) * 100}%`;

    const word = document.createElement("div");

    word.className = "animal-word";
    word.textContent = animal.name;

    element.appendChild(sprite);
    element.appendChild(word);

    const areaWidth = gameArea.clientWidth;

    const maxX = Math.max(0, areaWidth - 120);

    const x = Math.random() * maxX;

    element.style.left = `${x}px`;
    element.style.top = "-130px";

    gameArea.appendChild(element);

    fallingAnimals.push({
        element,
        name: animal.name,
        y: -130,
        speed: getFallSpeed()
    });
}


// ─────────────────────────────
// VELOCITAT
// ─────────────────────────────

function getFallSpeed() {

    const baseSpeed = 45;

    return baseSpeed + (level - 1) * 12;
}


// ─────────────────────────────
// INTERVAL DE CREACIÓ
// ─────────────────────────────

function getSpawnInterval() {

    return Math.max(
        650,
        1500 - (level - 1) * 130
    );
}


// ─────────────────────────────
// ACTUALITZAR JOC
// ─────────────────────────────

function updateGame(timestamp) {

    if (!gameRunning) {
        return;
    }

    const deltaTime =
        Math.min(timestamp - lastTime, 50) / 1000;

    lastTime = timestamp;

    spawnTimer += deltaTime * 1000;

    if (spawnTimer >= getSpawnInterval()) {

        spawnAnimal();

        spawnTimer = 0;
    }


    const areaHeight = gameArea.clientHeight;

    for (let i = fallingAnimals.length - 1; i >= 0; i--) {

        const animal = fallingAnimals[i];

        animal.y += animal.speed * deltaTime;

        animal.element.style.transform =
            `translateY(${animal.y}px)`;


        if (animal.y > areaHeight - 20) {

            removeAnimal(i);

            loseLife();
        }
    }

    updateHighlights();

    requestAnimationFrame(updateGame);
}


// ─────────────────────────────
// ELIMINAR ANIMAL
// ─────────────────────────────

function removeAnimal(index) {

    const animal = fallingAnimals[index];

    if (!animal) {
        return;
    }

    animal.element.remove();

    fallingAnimals.splice(index, 1);
}


// ─────────────────────────────
// VIDES
// ─────────────────────────────

function loseLife() {

    lives--;

    livesElement.textContent = lives;

    gameArea.classList.remove("life-lost");

    void gameArea.offsetWidth;

    gameArea.classList.add("life-lost");


    if (lives <= 0) {
        endGame();
    }
}


// ─────────────────────────────
// ESCRIURE
// ─────────────────────────────

typingInput.addEventListener("input", () => {

    if (!gameRunning) {
        return;
    }

    const typed = typingInput.value.trim().toLowerCase();

    updateHighlights();

    if (!typed) {
        return;
    }

    const index = fallingAnimals.findIndex(
        animal => animal.name.toLowerCase() === typed
    );

    if (index !== -1) {

        const animal = fallingAnimals[index];

        animal.element.classList.add("animal-correct");

        score++;

        scoreElement.textContent = score;

        removeAnimal(index);

        typingInput.value = "";

        checkLevel();
    }
});


// ─────────────────────────────
// DESTACAR ANIMALS
// ─────────────────────────────

function updateHighlights() {

    const typed =
        typingInput.value.trim().toLowerCase();

    fallingAnimals.forEach(animal => {

        if (
            typed &&
            animal.name.toLowerCase().startsWith(typed)
        ) {

            animal.element.classList.add("typing-match");

        } else {

            animal.element.classList.remove("typing-match");
        }
    });
}


// ─────────────────────────────
// NIVELL
// ─────────────────────────────

function checkLevel() {

    const newLevel =
        Math.min(6, Math.floor(score / 5) + 1);

    if (newLevel > level) {

        level = newLevel;

        levelElement.textContent = level;

        gameArea.classList.remove("level-up");

        void gameArea.offsetWidth;

        gameArea.classList.add("level-up");
    }
}


// ─────────────────────────────
// INICIAR
// ─────────────────────────────

function startGame() {

    score = 0;
    level = 1;
    lives = 3;

    gameRunning = true;

    lastTime = performance.now();
    spawnTimer = 0;

    scoreElement.textContent = score;
    levelElement.textContent = level;
    livesElement.textContent = lives;

    gameOverScreen.classList.add("hidden");
    startScreen.classList.add("hidden");

    fallingAnimals.forEach(animal => {
        animal.element.remove();
    });

    fallingAnimals = [];

    typingInput.value = "";
    typingInput.focus();

    requestAnimationFrame(updateGame);
}


// ─────────────────────────────
// FINALITZAR
// ─────────────────────────────

function endGame() {

    gameRunning = false;

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "plujaAnimalsBestScore",
            bestScore
        );
    }

    bestScoreElement.textContent = bestScore;

    finalScore.textContent = score;
    finalBest.textContent = bestScore;

    gameOverScreen.classList.remove("hidden");

    typingInput.blur();
}


// ─────────────────────────────
// BOTONS
// ─────────────────────────────

startButton.addEventListener("click", startGame);

restartButton.addEventListener("click", startGame);
