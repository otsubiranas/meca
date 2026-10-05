const gameArea = document.getElementById("gameArea");
const typingInput = document.getElementById("typingInput");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const bestScoreEl = document.getElementById("bestScore");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const finalScoreEl = document.getElementById("finalScore");
const finalBestEl = document.getElementById("finalBest");


// ======================================================
// CONFIGURACIÓ DEL SPRITESHEET
// ======================================================

const SPRITESHEET = "animals.png";

const COLUMNS = 8;
const ROWS = 5;


// ======================================================
// ANIMALS
// ======================================================

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


// ======================================================
// NIVELLS
// ======================================================

// NIVELLS 1-5: només noms SENSE accents

const levelAnimals = {
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
        "granota",
        "tortuga",
        "cabra",
        "lloro",
        "zebra"
    ],

    3: [
        "elefant",
        "girafa",
        "guineu",
        "esquirol",
        "gallina",
        "abella",
        "tigre",
        "llop"
    ],

    4: [
        "hipopòtam",
        "serp",
        "ratpenat",
        "mussol",
        "cocodril",
        "papallona",
        "cranc",
        "colom"
    ],

    5: [
        "ornitorinc",
        "salamandra",
        "rinoceront",
        "orangutan",
        "llangardaix",
        "dromedari",
        "goril·la"
    ],

    // NIVELL 6: TOTS ELS ANIMALS AMB ACCENT

    6: [
        "ós",
        "dofí",
        "ànec",
        "lleó",
        "ratolí",
        "cérvol",
        "eriçó",
        "pingüí"
    ]
};


// ======================================================
// ESTAT DEL JOC
// ======================================================

let score = 0;
let level = 1;
let lives = 3;

let gameRunning = false;
let lastSpawn = 0;
let animationFrame = null;

let fallingAnimals = [];

let bestScore = Number(
    localStorage.getItem("plujaAnimalsBestScore") || 0
);

bestScoreEl.textContent = bestScore;


// ======================================================
// FUNCIONS
// ======================================================

function getAnimalByName(name) {
    return animals.find(animal => animal.name === name);
}


function getAvailableAnimals() {
    let available = [];

    for (let i = 1; i <= level; i++) {
        if (levelAnimals[i]) {
            available.push(...levelAnimals[i]);
        }
    }

    return available;
}


function getRandomAnimal() {
    const availableNames = getAvailableAnimals();

    const randomName =
        availableNames[
            Math.floor(Math.random() * availableNames.length)
        ];

    return getAnimalByName(randomName);
}


// ======================================================
// CREAR ANIMAL
// ======================================================

function spawnAnimal() {
    const animal = getRandomAnimal();

    if (!animal) return;

    const element = document.createElement("div");

    element.className = "falling-animal";

    const sprite = document.createElement("div");

    sprite.className = "animal-sprite";

    sprite.style.backgroundImage =
        `url("${SPRITESHEET}")`;

    sprite.style.backgroundSize =
        `${COLUMNS * 100}% ${ROWS * 100}%`;

    sprite.style.backgroundPosition =
        `${animal.col * (100 / (COLUMNS - 1))}% ${animal.row * (100 / (ROWS - 1))}%`;

    const word = document.createElement("div");

    word.className = "animal-word";
    word.textContent = animal.name;

    element.appendChild(sprite);
    element.appendChild(word);

    const areaWidth = gameArea.clientWidth;

    const animalWidth = 110;

    const x = Math.max(
        10,
        Math.random() * (areaWidth - animalWidth - 10)
    );

    element.style.left = `${x}px`;
    element.style.top = "-130px";

    gameArea.appendChild(element);

    const fallingAnimal = {
        element,
        animal,
        x,
        y: -130,
        speed: getFallSpeed()
    };

    fallingAnimals.push(fallingAnimal);
}


// ======================================================
// VELOCITAT
// ======================================================

function getFallSpeed() {
    return 0.8 + (level - 1) * 0.18;
}


// ======================================================
// INTERVAL DE SPAWN
// ======================================================

function getSpawnInterval() {
    return Math.max(
        650,
        1500 - (level - 1) * 130
    );
}


// ======================================================
// ACTUALITZAR JOC
// ======================================================

function updateGame(timestamp) {

    if (!gameRunning) return;

    if (!lastSpawn) {
        lastSpawn = timestamp;
    }

    if (
        timestamp - lastSpawn >=
        getSpawnInterval()
    ) {
        spawnAnimal();
        lastSpawn = timestamp;
    }


    for (let i = fallingAnimals.length - 1; i >= 0; i--) {

        const falling = fallingAnimals[i];

        falling.y += falling.speed;

        falling.element.style.transform =
            `translateY(${falling.y}px)`;


        const bottom =
            falling.y + falling.element.offsetHeight;


        if (bottom >= gameArea.clientHeight) {

            falling.element.remove();

            fallingAnimals.splice(i, 1);

            loseLife();
        }
    }


    animationFrame =
        requestAnimationFrame(updateGame);
}


// ======================================================
// PERDRE VIDA
// ======================================================

function loseLife() {

    lives--;

    livesEl.textContent = lives;

    gameArea.classList.remove("life-lost");

    void gameArea.offsetWidth;

    gameArea.classList.add("life-lost");


    if (lives <= 0) {
        endGame();
    }
}


// ======================================================
// COMPROVAR NIVELL
// ======================================================

function checkLevel() {

    const newLevel =
        Math.min(6, Math.floor(score / 5) + 1);

    if (newLevel > level) {

        level = newLevel;

        levelEl.textContent = level;

        gameArea.classList.remove("level-up");

        void gameArea.offsetWidth;

        gameArea.classList.add("level-up");
    }
}


// ======================================================
// ACTUALITZAR PARAULA ESCRITA
// ======================================================

function updateMatches() {

    const typed =
        typingInput.value.toLowerCase().trim();


    fallingAnimals.forEach(falling => {

        const word =
            falling.animal.name.toLowerCase();

        if (
            typed.length > 0 &&
            word.startsWith(typed)
        ) {
            falling.element.classList.add(
                "typing-match"
            );
        } else {
            falling.element.classList.remove(
                "typing-match"
            );
        }
    });
}


// ======================================================
// ESCRIURE
// ======================================================

typingInput.addEventListener(
    "input",
    () => {

        updateMatches();

        const typed =
            typingInput.value.toLowerCase().trim();

        if (!typed) return;


        const matchingAnimal =
            fallingAnimals.find(
                falling =>
                    falling.animal.name.toLowerCase() === typed
            );


        if (matchingAnimal) {

            matchingAnimal.element.classList.add(
                "animal-correct"
            );

            setTimeout(() => {
                matchingAnimal.element.remove();
            }, 120);


            fallingAnimals =
                fallingAnimals.filter(
                    falling =>
                        falling !== matchingAnimal
                );


            score++;

            scoreEl.textContent = score;


            if (score > bestScore) {

                bestScore = score;

                bestScoreEl.textContent =
                    bestScore;

                localStorage.setItem(
                    "plujaAnimalsBestScore",
                    bestScore
                );
            }


            checkLevel();

            typingInput.value = "";

            updateMatches();
        }
    }
);


// ======================================================
// COMENÇAR JOC
// ======================================================

function startGame() {

    score = 0;
    level = 1;
    lives = 3;

    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = lives;

    fallingAnimals.forEach(
        falling => falling.element.remove()
    );

    fallingAnimals = [];

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    typingInput.value = "";

    gameRunning = true;

    lastSpawn = 0;

    typingInput.focus();

    animationFrame =
        requestAnimationFrame(updateGame);
}


// ======================================================
// FINALITZAR JOC
// ======================================================

function endGame() {

    gameRunning = false;

    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }

    finalScoreEl.textContent = score;
    finalBestEl.textContent = bestScore;

    gameOverScreen.classList.remove("hidden");
}


// ======================================================
// BOTONS
// ======================================================

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);
