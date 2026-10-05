(() => {
  "use strict";

  // ------------------------------------------------------------
  // MECazombis
  // Joc infinit de mecanografia.
  //
  // Per substituir les imatges:
  // 1. Canvia ZOMBIE_VISUAL i ARROW_VISUAL per <img src="...">.
  // 2. O modifica simplement aquests dos valors.
  // La mecànica del joc no depèn de les imatges.
  // ------------------------------------------------------------

  const KEYS = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"];

  const CONFIG = {
    zombieSpeed: 55,          // píxels/segon
    maxArrows: 2,
    firstSpawnDelay: 850,     // ms
    minimumSpawnDelay: 220,   // ms
    spawnAcceleration: 16,    // ms menys per cada zombi eliminat
    arrowSpeed: 520,          // píxels/segon
    dangerBottom: 72
  };

  // Visuals de prova. Es poden substituir per imatges.
  const ZOMBIE_VISUAL = "🧟";
  const ARROW_VISUAL = "🏹";

  const game = document.getElementById("game");
  const zombiesLayer = document.getElementById("zombies");
  const arrowsLayer = document.getElementById("arrows");
  const scoreElement = document.getElementById("score");
  const startScreen = document.getElementById("start-screen");
  const gameOverScreen = document.getElementById("game-over");
  const finalScoreElement = document.getElementById("final-score");
  const startButton = document.getElementById("start-button");
  const restartButton = document.getElementById("restart-button");
  const keyboardButtons = [...document.querySelectorAll(".keyboard button")];

  let zombies = [];
  let arrows = [];
  let score = 0;
  let running = false;
  let animationFrame = null;
  let lastTime = 0;
  let nextZombieId = 1;
  let spawnTimer = null;

  function columnX(column) {
    return ((column + 0.5) / KEYS.length) * 100;
  }

  function getSpawnDelay() {
    return Math.max(
      CONFIG.minimumSpawnDelay,
      CONFIG.firstSpawnDelay - score * CONFIG.spawnAcceleration
    );
  }

  function getDangerY() {
    return game.clientHeight - CONFIG.dangerBottom;
  }

  function createZombie() {
    if (!running) return;

    const column = Math.floor(Math.random() * KEYS.length);

    const element = document.createElement("div");
    element.className = "zombie";
    element.innerHTML = `
      <div class="zombie-visual">${ZOMBIE_VISUAL}</div>
      <div class="zombie-key">${KEYS[column].toUpperCase()}</div>
    `;

    const zombie = {
      id: nextZombieId++,
      key: KEYS[column],
      column,
      x: columnX(column),
      y: -45,
      element
    };

    zombies.push(zombie);
    zombiesLayer.appendChild(element);
    renderZombie(zombie);
  }

  function renderZombie(zombie) {
    zombie.element.style.left = `${zombie.x}%`;
    zombie.element.style.top = `${zombie.y}px`;
  }

  function createArrow(key) {
    if (!running || arrows.length >= CONFIG.maxArrows) return;

    const column = KEYS.indexOf(key);
    if (column === -1) return;

    const element = document.createElement("div");
    element.className = "arrow";
    element.innerHTML = `<div class="arrow-visual">${ARROW_VISUAL}</div>`;

    const arrow = {
      key,
      column,
      x: columnX(column),
      y: getDangerY() - 18,
      element
    };

    arrows.push(arrow);
    arrowsLayer.appendChild(element);
    renderArrow(arrow);
  }

  function renderArrow(arrow) {
    arrow.element.style.left = `${arrow.x}%`;
    arrow.element.style.top = `${arrow.y}px`;
  }

  function removeArrow(arrow) {
    const index = arrows.indexOf(arrow);
    if (index !== -1) arrows.splice(index, 1);
    arrow.element.remove();
  }

  function killZombie(zombie) {
    const index = zombies.indexOf(zombie);
    if (index === -1) return;

    zombies.splice(index, 1);
    zombie.element.remove();

    score++;
    scoreElement.textContent = score;
    scheduleNextSpawn();
  }

  function shoot(key) {
    createArrow(key);
  }

  function update(dt) {
    // Els zombis baixen a velocitat constant.
    for (const zombie of [...zombies]) {
      zombie.y += CONFIG.zombieSpeed * dt;
      renderZombie(zombie);

      if (zombie.y >= getDangerY()) {
        endGame();
        return;
      }
    }

    // Les fletxes pugen.
    for (const arrow of [...arrows]) {
      arrow.y -= CONFIG.arrowSpeed * dt;
      renderArrow(arrow);

      // La fletxa elimina el primer zombi que troba
      // a la seva columna. "Primer" = el més avall.
      const targets = zombies
        .filter(zombie => zombie.column === arrow.column && zombie.y < arrow.y)
        .sort((a, b) => b.y - a.y);

      if (targets.length > 0) {
        killZombie(targets[0]);
        removeArrow(arrow);
        continue;
      }

      if (arrow.y < -80) {
        removeArrow(arrow);
      }
    }
  }

  function gameLoop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    update(dt);
    animationFrame = requestAnimationFrame(gameLoop);
  }

  function scheduleNextSpawn() {
    clearTimeout(spawnTimer);

    if (!running) return;

    spawnTimer = setTimeout(() => {
      createZombie();
      scheduleNextSpawn();
    }, getSpawnDelay());
  }

  function clearGame() {
    clearTimeout(spawnTimer);

    for (const zombie of zombies) {
      zombie.element.remove();
    }

    for (const arrow of arrows) {
      arrow.element.remove();
    }

    zombies = [];
    arrows = [];
  }

  function startGame() {
    cancelAnimationFrame(animationFrame);
    clearGame();

    score = 0;
    scoreElement.textContent = "0";
    lastTime = 0;
    running = true;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    game.focus();

    // Un zombi apareix des del principi.
    createZombie();
    scheduleNextSpawn();

    animationFrame = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    if (!running) return;

    running = false;
    clearTimeout(spawnTimer);
    cancelAnimationFrame(animationFrame);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove("hidden");
  }

  function pressKey(key) {
    key = key.toLowerCase();

    if (!KEYS.includes(key)) return;

    const button = keyboardButtons.find(
      button => button.dataset.key === key
    );

    if (button) {
      button.classList.add("active");
      setTimeout(() => button.classList.remove("active"), 90);
    }

    if (running) {
      shoot(key);
    }
  }

  document.addEventListener("keydown", event => {
    // Evita que Alt, Ctrl, etc. interfereixin.
    if (event.ctrlKey || event.altKey || event.metaKey) return;

    const key = event.key.toLowerCase();

    if (KEYS.includes(key)) {
      event.preventDefault();
      pressKey(key);
    }

    // Enter permet començar/recomençar.
    if (event.key === "Enter" && !running) {
      event.preventDefault();
      startGame();
    }
  });

  keyboardButtons.forEach(button => {
    button.addEventListener("click", () => {
      pressKey(button.dataset.key);
      game.focus();
    });
  });

  startButton.addEventListener("click", startGame);
  restartButton.addEventListener("click", startGame);

  window.addEventListener("resize", () => {
    for (const zombie of zombies) renderZombie(zombie);
    for (const arrow of arrows) renderArrow(arrow);
  });
})();
