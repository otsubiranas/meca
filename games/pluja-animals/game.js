const gameArea = document.getElementById("game-area");
const input = document.getElementById("word-input");

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const bestScoreElement = document.getElementById("best-score");

const messageElement = document.getElementById("message");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const finalScoreElement = document.getElementById("final-score");


/* =========================
   CONFIGURACIÓ
========================= */

let score = 0;
let lives = 3;
let level = 1;

let gameRunning = false;

let animals = [];

let lastTime = 0;
let spawnTimer = 0;

let animationFrame;


/* =========================
   ANIMALS
========================= */

const animalLevels = [

    // NIVELL 1
    [
        {
            name: "gat",
            color: "#f2a65a"
        },
        {
            name: "gos",
            color: "#9b7653"
        },
        {
            name: "vaca",
            color: "#eeeeee"
        },
        {
            name: "gall",
            color: "#e76f51"
        },
        {
            name: "peix",
            color: "#4ea8de"
        }
    ],

    // NIVELL 2
    [
        {
            name: "ovella",
            color: "#ffffff"
        },
        {
            name: "cavall",
            color: "#8d5524"
        },
        {
            name: "conill",
            color: "#d8c3a5"
        },
        {
            name: "granota",
            color: "#65a30d"
        },
        {
            name: "tortuga",
            color: "#588157"
        }
    ],

    // NIVELL 3
    [
        {
            name: "elefant",
            color: "#9ca3af"
        },
        {
            name: "girafa",
            color: "#e9b949"
        },
        {
            name: "guineu",
            color: "#e76f51"
        },
        {
            name: "esquirol",
            color: "#a16207"
        },
        {
            name: "papallona",
            color: "#c084fc"
        }
    ],

    // NIVELL 4
    [
        {
            name: "hipopòtam",
            color: "#9f8f9f"
        },
        {
            name: "rinoceront",
            color: "#737373"
        },
        {
            name: "orangutan",
            color: "#b45309"
        },
        {
            name: "salamandra",
            color: "#ef4444"
        },
        {
            name: "llangardaix",
            color: "#65a30d"
        }
    ],

    // NIVELL 5
    [
        {
            name: "ornitorinc",
            color: "#78716c"
        },
        {
            name: "hipopòtam",
            color: "#9f8f9f"
        },
        {
            name: "rinoceront",
            color: "#737373"
        },
        {
            name: "llangardaix",
            color: "#65a30d"
        },
        {
            name: "salamandra",
            color: "#ef4444"
        }
    ]

];


/* =========================
   MILLOR PUNTUACIÓ
========================= */

let bestScore = Number(
    localStorage.getItem("plujaAnimalsBestScore")
) || 0;

bestScoreElement.textContent = bestScore;


/* =========================
   PIXEL ART
========================= */

const pixelAnimals = {

    gat: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "101101",
        "011110"
    ],

    gos: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "101101",
        "011110"
    ],

    vaca: [
        "011110",
        "111111",
        "110011",
        "111111",
        "101101",
        "111111",
        "011110"
    ],

    peix: [
        "001100",
        "011110",
        "111111",
        "111111",
        "011110",
        "001100"
    ],

    gall: [
        "001000",
        "011100",
        "111110",
        "011111",
        "011110",
        "110011",
        "011110"
    ],

    ovella: [
        "011110",
        "111111",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    cavall: [
        "001110",
        "011111",
        "111111",
        "110011",
        "111110",
        "011110",
        "001100"
    ],

    conill: [
        "010010",
        "110011",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    granota: [
        "110011",
        "111111",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    tortuga: [
        "001100",
        "011110",
        "111111",
        "111111",
        "110011",
        "011110",
        "001100"
    ],

    elefant: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "011110",
        "011000"
    ],

    girafa: [
        "001100",
        "011110",
        "011110",
        "111111",
        "110011",
        "011110",
        "001100"
    ],

    guineu: [
        "100001",
        "110011",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    esquirol: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    papallona: [
        "110011",
        "111111",
        "011110",
        "111111",
        "011110",
        "111111",
        "001100"
    ],

    hipopòtam: [
        "011110",
        "111111",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    rinoceront: [
        "001110",
        "011111",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    orangutan: [
        "011110",
        "111111",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    salamandra: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    llangardaix: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ],

    ornitorinc: [
        "001100",
        "011110",
        "111111",
        "110011",
        "111111",
        "011110",
        "001100"
    ]

};


/* =========================
   CREAR PIXEL ART
========================= */

function createPixelAnimal(animal) {

    const pixels = pixelAnimals[animal.name];

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute("width", "60");
    svg.setAttribute("height", "60");
    svg.setAttribute("viewBox", "0 0 60 60");

    svg.classList.add("pixel-animal");

    pixels.forEach((row, y) => {

        [...row].forEach((pixel, x) => {

            if (pixel === "1") {

                const rect = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "rect"
                );

                rect.setAttribute("x", x * 8);
                rect.setAttribute("y", y * 8);

                rect.setAttribute("width", "8");
                rect.setAttribute("height", "8");

                rect.setAttribute(
                    "fill",
                    animal.color
                );

                svg.appendChild(rect);
            }

        });

    });

    return svg;
}


/* =========================
   CREAR ANIMAL
========================= */

function createAnimal() {

    const availableAnimals =
        animalLevels[Math.min(level - 1, animalLevels.length - 1)];

    const animal =
        availableAnimals[
            Math.floor(Math.random() * availableAnimals.length)
        ];

    const element = document.createElement("div");

    element.classList.add("falling-animal");

    const word = document.createElement("div");

    word.classList.add("animal-word");
    word.textContent = animal.name;

    const pixelArt =
        createPixelAnimal(animal);

    element.appendChild(word);
    element.appendChild(pixelArt);

    const maxX =
        gameArea.clientWidth - 120;

    const x =
        Math.max(
            10,
            Math.random() * maxX
        );

    element.style.left = `${x}px`;
    element.style.top = "-100px";

    gameArea.appendChild(element);

    animals.push({
        name: animal.name,
        element: element,
        y: -100,
        speed: getFallSpeed()
    });
}


/* =========================
   VELOCITAT
========================= */

function getFallSpeed() {

    return 45 + (level - 1) * 10;
}


/* =========================
   ACTUALITZAR NIVELL
========================= */

function updateLevel() {

    level =
        Math.floor(score / 5) + 1;

    levelElement.textContent = level;
}


/* =========================
   ACTUALITZAR VIDES
========================= */

function updateLives() {

    livesElement.textContent =
        "❤️".repeat(lives) +
        "🖤".repeat(3 - lives);
}


/* =========================
   ACTUALITZAR PUNTUACIÓ
========================= */

function updateScore() {

    scoreElement.textContent = score;

    updateLevel();
}


/* =========================
   COMPROVAR INPUT
========================= */

input.addEventListener("input", () => {

    if (!gameRunning) return;

    const typed =
        input.value.toLowerCase().trim();

    if (!typed) {

        animals.forEach(animal => {

            animal.element
                .querySelector(".animal-word")
                .classList.remove("match");

        });

        return;
    }


    animals.forEach(animal => {

        const wordElement =
            animal.element.querySelector(".animal-word");

        if (animal.name.startsWith(typed)) {

            wordElement.classList.add("match");

        } else {

            wordElement.classList.remove("match");

        }

    });


    const match =
        animals.find(
            animal => animal.name === typed
        );


    if (match) {

        destroyAnimal(match);

        score++;

        updateScore();

        input.value = "";

        messageElement.textContent =
            "Molt bé! +1 punt 🐾";

    }

});


/* =========================
   ELIMINAR ANIMAL
========================= */

function destroyAnimal(animal) {

    animal.element.remove();

    animals =
        animals.filter(
            item => item !== animal
        );
}


/* =========================
   PERDRE VIDA
========================= */

function loseLife(animal) {

    destroyAnimal(animal);

    lives--;

    updateLives();

    messageElement.textContent =
        "Un animal ha arribat a terra!";

    if (lives <= 0) {

        endGame();

    }
}


/* =========================
   BUCLE DEL JOC
========================= */

function gameLoop(timestamp) {

    if (!gameRunning) return;

    const delta =
        (timestamp - lastTime) / 1000;

    lastTime = timestamp;

    spawnTimer += delta;


    const spawnDelay =
        Math.max(
            0.7,
            1.8 - level * 0.12
        );


    if (spawnTimer >= spawnDelay) {

        createAnimal();

        spawnTimer = 0;
    }


    animals.forEach(animal => {

        animal.y +=
            animal.speed * delta;

        animal.element.style.top =
            `${animal.y}px`;


        if (
            animal.y >
            gameArea.clientHeight - 100
        ) {

            loseLife(animal);

        }

    });


    animationFrame =
        requestAnimationFrame(gameLoop);
}


/* =========================
   COMENÇAR
========================= */

function startGame() {

    score = 0;
    lives = 3;
    level = 1;

    animals.forEach(animal => {
        animal.element.remove();
    });

    animals = [];

    updateScore();
    updateLives();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    input.disabled = false;
    input.value = "";

    input.focus();

    messageElement.textContent =
        "Escriu els noms dels animals!";

    gameRunning = true;

    lastTime = performance.now();
    spawnTimer = 0;

    cancelAnimationFrame(animationFrame);

    animationFrame =
        requestAnimationFrame(gameLoop);
}


/* =========================
   FINAL DE LA PARTIDA
========================= */

function endGame() {

    gameRunning = false;

    cancelAnimationFrame(animationFrame);

    input.disabled = true;

    finalScoreElement.textContent =
        score;

    if (score > bestScore) {

        bestScore = score;

        localStorage.setItem(
            "plujaAnimalsBestScore",
            bestScore
        );

        bestScoreElement.textContent =
            bestScore;
    }

    gameOverScreen.classList.remove("hidden");
}


/* =========================
   BOTONS
========================= */

startButton.addEventListener(
    "click",
    startGame
);

restartButton.addEventListener(
    "click",
    startGame
);


/* =========================
   TECLA ENTER
========================= */

input.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        event.preventDefault();

    }

});
