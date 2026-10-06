/* =====================================================
   FONS PIXEL ART DE POSTA DE SOL
   Si falla, el joc continua igualment.
   Ajustos ràpids a CONFIG.
   ===================================================== */
try {
(function () {
  var CONFIG = {
    mida: 6,     // mida de cada "píxel" en píxels de pantalla (8 = més chunky, 4 = més fi)
    sol: 4,      // files de píxels que tapa la franja fosca del terra (25px / 6 ≈ 4)
    cicle: 120,  // segons que dura el cicle (el sol baixa i torna a pujar)
    fps: 24      // fps baixos = moviment més "pixel art"
  };

  var host = document.getElementById('game-area') || document.body;
  var cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:absolute;left:0;bottom:0;z-index:0;pointer-events:none;' +
    'image-rendering:pixelated;image-rendering:crisp-edges;';
  host.insertBefore(cv, host.firstChild);
  var ctx = cv.getContext('2d');
  var W, H, HZ, img;

  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function css(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }
  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function rect(x, y, w, h) { ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function rows(cx, cy, r, skip, fn) {
    for (var dy = -r; dy <= r; dy++) {
      if (skip && skip(dy)) continue;
      if (fn) fn(dy);
      var w = Math.floor(Math.sqrt(r * r - dy * dy + 0.5));
      rect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  }
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  // A = posta de sol daurada, B = capvespre
  var SKY_A = ['#2b1b5a', '#7a2f7a', '#d9455f', '#ff8a3d', '#ffd36b'].map(hex);
  var SKY_B = ['#0c0928', '#241448', '#552068', '#b0386a', '#ff6a4a'].map(hex);
  var HILL = [
    [hex('#8a4a8a'), hex('#46285f')],
    [hex('#5a2f6a'), hex('#2b1b4c')],
    [hex('#2e1c46'), hex('#150f2e')]
  ];
  var LAYERS = [
    { base: 0, amp: 8, f: 0.045, v: 1.5 },
    { base: 7, amp: 10, f: 0.06, v: 3 },
    { base: 15, amp: 9, f: 0.09, v: 6 }
  ];
  var stars, clouds, birds, grass;

  function setup() {
    var M = CONFIG.mida;
    var cw = host.clientWidth || innerWidth, ch = host.clientHeight || innerHeight;
    W = Math.max(40, Math.ceil(cw / M));
    H = Math.max(40, Math.ceil(ch / M));
    HZ = Math.floor(H * 0.6);
    cv.width = W; cv.height = H;
    cv.style.width = W * M + 'px';
    cv.style.height = H * M + 'px';
    ctx.imageSmoothingEnabled = false;
    img = ctx.createImageData(W, H);
    seed = 7;
    stars = []; clouds = []; birds = []; grass = [];
    var i;
    for (i = 0; i < 46; i++) stars.push({ x: rnd(), y: rnd() * 0.55, p: rnd() * 6, big: rnd() > 0.85 });
    for (i = 0; i < 5; i++) clouds.push({ x: rnd() * (W + 60), y: 6 + rnd() * (HZ * 0.55), w: 14 + rnd() * 20, v: 1.5 + rnd() * 3 });
    for (i = 0; i < 4; i++) birds.push({ x: rnd() * W, y: 8 + rnd() * HZ * 0.4, v: 5 + rnd() * 4, p: rnd() * 6 });
    for (i = 0; i < Math.ceil(W / 2); i++) grass.push(3 + Math.floor(rnd() * 5));
  }

  function drawSky(t) {
    var stops = [], i;
    for (i = 0; i < 5; i++) stops.push(mix(SKY_A[i], SKY_B[i], t));
    var N = 12, bands = [];
    for (i = 0; i < N; i++) {
      var p = (i / (N - 1)) * 4, k = Math.min(3, Math.floor(p));
      bands.push(mix(stops[k], stops[k + 1], p - k));
    }
    var d = img.data, limit = HZ + 8;
    for (var y = 0; y < H; y++) {
      var f = Math.min(y, limit) / limit * (N - 1), k0 = Math.floor(f), fr = f - k0;
      for (var x = 0; x < W; x++) {
        var th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        var c = bands[Math.min(N - 1, fr > th ? k0 + 1 : k0)];
        var o = (y * W + x) * 4;
        d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawStars(t, time) {
    if (t < 0.45) return;
    var a = Math.min(1, (t - 0.45) / 0.35);
    ctx.fillStyle = '#fff6d8';
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.globalAlpha = a * (0.45 + 0.55 * Math.sin(time * 2 + s.p));
      rect(s.x * W, s.y * H, 1, 1);
      if (s.big) { rect(s.x * W - 1, s.y * H, 3, 1); rect(s.x * W, s.y * H - 1, 1, 3); }
    }
    ctx.globalAlpha = 1;
  }

  function drawSun(t) {
    var e = t * t * (3 - 2 * t);
    var cx = Math.round(W * 0.5 + (t - 0.5) * 10);
    var cy = Math.round((HZ - 24) + e * 34);
    var r = 12;
    var gap = function (dy) { return dy >= 3 && (dy % 4 === 0 || (dy > 7 && dy % 4 === 1)); };
    ctx.fillStyle = '#ffb347';
    ctx.globalAlpha = 0.14; rows(cx, cy, r + 8);
    ctx.globalAlpha = 0.2; rows(cx, cy, r + 4);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe27a';
    rows(cx, cy, r, gap);
    ctx.fillStyle = '#ff9a3c';
    for (var dy = 2; dy <= r; dy++) {
      if (gap(dy)) continue;
      var w = Math.floor(Math.sqrt(r * r - dy * dy + 0.5));
      rect(cx - w, cy + dy, 2 * w + 1, 1);
    }
  }

  function drawClouds(t, time) {
    var c = mix([255, 176, 130], [150, 80, 140], t);
    var sh = mix(c, [90, 40, 100], 0.45);
    for (var i = 0; i < clouds.length; i++) {
      var q = clouds[i], span = W + q.w * 2;
      var x = ((q.x + time * q.v) % span) - q.w;
      ctx.fillStyle = css(c);
      rect(x + q.w * 0.25, q.y - 2, q.w * 0.45, 2);
      rect(x, q.y, q.w, 2);
      ctx.fillStyle = css(sh);
      rect(x + 2, q.y + 2, q.w - 4, 1);
    }
  }

  function drawBirds(t, time) {
    ctx.fillStyle = css(mix([60, 25, 60], [8, 6, 20], t));
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var x = Math.round(((b.x + time * b.v) % (W + 20)) - 10);
      var y = Math.round(b.y + Math.sin(time * 0.8 + b.p) * 3);
      var up = Math.floor(time * 4 + b.p) % 2 === 0;
      rect(x, y, 1, 1);
      rect(x - 1, y + (up ? -1 : 0), 1, 1); rect(x - 2, y + (up ? -2 : 1), 1, 1);
      rect(x + 1, y + (up ? -1 : 0), 1, 1); rect(x + 2, y + (up ? -2 : 1), 1, 1);
    }
  }

  function drawHills(t, time) {
    for (var L = 0; L < LAYERS.length; L++) {
      var ly = LAYERS[L];
      ctx.fillStyle = css(mix(HILL[L][0], HILL[L][1], t));
      for (var x = 0; x < W; x++) {
        var a = (x + time * ly.v) * ly.f;
        var h = ly.amp * (0.5 + 0.5 * Math.sin(a)) + ly.amp * 0.5 * Math.sin(a * 2.3 + L * 1.7 + 1);
        var top = Math.round(HZ + ly.base - h);
        rect(x, top, 1, H - top);
      }
    }
  }

  function drawGrass(t, time) {
    var B = H - CONFIG.sol;
    ctx.fillStyle = css(mix([26, 14, 40], [8, 6, 20], t));
    rect(0, B, W, H - B);
    for (var i = 0; i < grass.length; i++) {
      var h = grass[i];
      var sway = Math.round(Math.sin(time * 1.6 + i * 0.45) * 1.2);
      rect(i * 2, B - h, 2, h);
      rect(i * 2 + sway, B - h - 1, 2, 1);
    }
  }

  var t0 = performance.now(), last = 0, step = 1000 / CONFIG.fps;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < step) return;
    last = now;
    var time = (now - t0) / 1000;
    var t = 0.5 - 0.5 * Math.cos((time / CONFIG.cicle) * Math.PI * 2);
    drawSky(t);
    drawStars(t, time);
    drawSun(t);
    drawClouds(t, time);
    drawBirds(t, time);
    drawHills(t, time);
    drawGrass(t, time);
  }

  setup();
  if (window.ResizeObserver) new ResizeObserver(setup).observe(host);
  else addEventListener('resize', setup);
  requestAnimationFrame(frame);
})();
} catch (error) {
    console.error("Fons de posta de sol:", error);
}


// =====================================================
// PLUJA D'ANIMALS – LÒGICA DEL JOC
// =====================================================

const SPRITESHEET = "animals.png";
const COLUMNS = 8;
const ROWS = 5;

// ─────────────────────────────
// ANIMALS DEL SPRITESHEET
// ─────────────────────────────

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
    1: ["gat", "gos", "vaca", "porc", "peix", "oca", "pop", "mico"],
    2: ["foca", "cabra", "lloro", "zebra", "ovella", "abella", "gallina", "colom"],
    3: ["cavall", "conill", "guineu", "tigre", "llop", "serp", "granota", "mussol"],
    4: ["tortuga", "ratpenat", "cranc", "esquirol", "elefant", "girafa", "cocodril", "papallona"],
    // Nivell 5: paraules més llargues
    5: ["ratpenat", "esquirol", "elefant", "cocodril", "papallona", "tortuga", "gallina", "conill"],
    // Nivell 6: animals amb accent
    6: ["ànec", "ós", "ratolí", "lleó", "cérvol", "eriçó", "pingüí", "dofí"]
};

// ─────────────────────────────
// ELEMENTS HTML
// ─────────────────────────────

const gameArea = document.getElementById("game-area");
const typingInput = document.getElementById("word-input");

const scoreElement = document.getElementById("score");
const levelElement = document.getElementById("level");
const livesElement = document.getElementById("lives");
const bestScoreElement = document.getElementById("best-score");

const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");

const finalScore = document.getElementById("final-score");

if (
    !gameArea || !typingInput || !scoreElement || !levelElement ||
    !livesElement || !bestScoreElement || !startScreen ||
    !gameOverScreen || !startButton || !restartButton || !finalScore
) {
    console.error("Pluja d'animals: falta algun element HTML.");
}

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

// ─────────────────────────────
// RÈCORD
// ─────────────────────────────

let bestScore = 0;
try {
    bestScore = Number(localStorage.getItem("plujaAnimalsBestScore") || 0);
} catch (e) { /* localStorage no disponible */ }
bestScoreElement.textContent = bestScore;

// ─────────────────────────────
// ANIMALS DISPONIBLES
// ─────────────────────────────

function getAvailableAnimals() {
    let available = [];
    for (let i = 1; i <= level; i++) {
        if (levels[i]) available.push(...levels[i]);
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
    if (availableNames.length === 0) return;

    const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
    const animal = getAnimalByName(randomName);
    if (!animal) return;

    const element = document.createElement("div");
    element.className = "falling-animal";

    // Sprite
    const sprite = document.createElement("div");
    sprite.className = "animal-sprite";
    sprite.style.backgroundImage = `url("${SPRITESHEET}")`;
    sprite.style.backgroundSize = `${COLUMNS * 100}% ${ROWS * 100}%`;
    sprite.style.backgroundPosition =
        `${(animal.col / (COLUMNS - 1)) * 100}% ` +
        `${(animal.row / (ROWS - 1)) * 100}%`;

    // Nom
    const word = document.createElement("div");
    word.className = "animal-word";
    word.textContent = animal.name;

    element.appendChild(sprite);
    element.appendChild(word);

    // Posició inicial
    const maxX = Math.max(0, gameArea.clientWidth - 120);
    element.style.left = `${Math.random() * maxX}px`;
    element.style.top = "-130px";

    gameArea.appendChild(element);

    fallingAnimals.push({
        element: element,
        name: animal.name,
        y: 0,
        speed: getFallSpeed()
    });
}

// ─────────────────────────────
// VELOCITAT I INTERVAL
// ─────────────────────────────

function getFallSpeed() {
    return 35;
}

function getSpawnInterval() {
    return Math.max(1500, 2100 - (level - 1) * 100);
}

// ─────────────────────────────
// BUCLE DEL JOC
// ─────────────────────────────

function updateGame(timestamp) {
    if (!gameRunning) return;

    const deltaTime = Math.min(timestamp - lastTime, 50) / 1000;
    lastTime = timestamp;

    // Crear animals
    spawnTimer += deltaTime * 1000;
    if (spawnTimer >= getSpawnInterval()) {
        spawnAnimal();
        spawnTimer = 0;
    }

    // Fer caure animals
    const areaHeight = gameArea.clientHeight;

    for (let i = fallingAnimals.length - 1; i >= 0; i--) {
        const animal = fallingAnimals[i];

        animal.y += animal.speed * deltaTime;
        animal.element.style.transform = `translateY(${animal.y}px)`;

        // Ha arribat a terra
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
    if (!animal) return;
    animal.element.remove();
    fallingAnimals.splice(index, 1);
}

// ─────────────────────────────
// VIDES
// ─────────────────────────────

function updateLivesDisplay() {
    livesElement.textContent = "❤️".repeat(Math.max(0, lives));
}

function loseLife() {
    lives--;
    updateLivesDisplay();

    gameArea.classList.remove("life-lost");
    void gameArea.offsetWidth;
    gameArea.classList.add("life-lost");

    if (lives <= 0) endGame();
}

// ─────────────────────────────
// ESCRIURE
// ─────────────────────────────

typingInput.addEventListener("input", () => {
    if (!gameRunning) return;

    const typed = typingInput.value.trim().toLowerCase();

    updateHighlights();

    if (!typed) return;

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
    const typed = typingInput.value.trim().toLowerCase();

    fallingAnimals.forEach(animal => {
        if (typed && animal.name.toLowerCase().startsWith(typed)) {
            animal.element.classList.add("typing-match");
        } else {
            animal.element.classList.remove("typing-match");
        }
    });
}

// ─────────────────────────────
// CANVI DE NIVELL
// ─────────────────────────────

function checkLevel() {
    const newLevel = Math.min(6, Math.floor(score / 5) + 1);

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

    scoreElement.textContent = "0";
    levelElement.textContent = "1";
    updateLivesDisplay();

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    // Eliminar animals antics
    fallingAnimals.forEach(animal => animal.element.remove());
    fallingAnimals = [];

    typingInput.value = "";
    typingInput.disabled = false;
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
        try {
            localStorage.setItem("plujaAnimalsBestScore", bestScore);
        } catch (e) { /* localStorage no disponible */ }
    }

    bestScoreElement.textContent = bestScore;
    finalScore.textContent = score;

    gameOverScreen.classList.remove("hidden");

    typingInput.disabled = true;
    typingInput.blur();
}

// ─────────────────────────────
// BOTONS
// ─────────────────────────────

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
