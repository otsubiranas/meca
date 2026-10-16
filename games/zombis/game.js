(() => {
  const KEYS = ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ñ"];
  const MAX_ARROWS = 2;
  const ARROW_SPEED = 1100;      // px/s
  const ARROW_H = 56;
  const DANGER_BOTTOM = 70;      // distància de la línia de perill respecte al terra

  const game = document.getElementById("game");
  const zombiesLayer = document.getElementById("zombies");
  const arrowsLayer = document.getElementById("arrows");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best-score");
  const finalEl = document.getElementById("final-score");
  const startScreen = document.getElementById("start-screen");
  const gameOverScreen = document.getElementById("game-over");
  const keyButtons = [...document.querySelectorAll(".keyboard button")];

  let zombies = [];
  let arrows = [];
  let score = 0;
  let best = 0;
  let running = false;
  let lastTime = 0;
  let spawnTimer = 0;
  let nextId = 1;

  try { best = parseInt(localStorage.getItem("mecazombis-best") || "0", 10) || 0; } catch (e) {}
  bestEl.textContent = best;

  // Zombi original dibuixat a mà (SVG)
  const ZOMBIE_SVG = `
  <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg" stroke="#1c1c1c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <g class="aura">
      <path d="M40 4 C66 2 76 30 72 60 C76 90 62 106 40 106 C16 106 4 90 8 60 C4 30 16 6 40 4Z" fill="rgba(255,217,46,.35)" stroke="#ffd92e" stroke-width="5"/>
    </g>
    <!-- espasa vermella -->
    <rect x="4" y="52" width="9" height="46" rx="3" transform="rotate(-18 8 75)" fill="#e0242b"/>
    <!-- cames -->
    <rect x="28" y="82" width="10" height="20" fill="#8a5a2b"/>
    <rect x="42" y="82" width="10" height="20" fill="#8a5a2b"/>
    <rect x="26" y="98" width="13" height="7" fill="#3b2d8f"/>
    <rect x="41" y="98" width="13" height="7" fill="#3b2d8f"/>
    <!-- cos -->
    <path d="M24 56 L56 56 L58 86 L22 86Z" fill="#6b3fa0"/>
    <path d="M30 70 l5 -3 M44 76 l5 2" stroke="#3a1f5c"/>
    <rect x="22" y="76" width="36" height="6" fill="#e07a1f"/>
    <!-- braços -->
    <rect x="12" y="58" width="11" height="24" fill="#3f9a4a"/>
    <rect x="57" y="58" width="11" height="24" fill="#3f9a4a"/>
    <path d="M60 82 l0 10" stroke="#e0242b" stroke-width="3"/>
    <!-- cap -->
    <ellipse cx="40" cy="34" rx="22" ry="24" fill="#3f9a4a"/>
    <path d="M24 20 q16 -10 32 0" fill="none"/>
    <!-- cosits de cabell trencat -->
    <path d="M26 14 l4 -8 l4 8 M36 11 l5 -9 l4 9 M47 13 l6 -7 l2 10" fill="#5a5a3a"/>
    <!-- punts de sutura -->
    <path d="M20 30 L36 36 M23 36 l3 -5 M29 38 l3 -5" fill="none"/>
    <!-- ulls i boca -->
    <circle cx="33" cy="32" r="7" fill="#fff"/>
    <circle cx="35" cy="33" r="2.6" fill="#1c1c1c"/>
    <path d="M48 28 l8 8 M56 28 l-8 8" fill="none"/>
    <path d="M30 46 q10 8 20 0 q-10 4 -20 0Z" fill="#e0242b"/>
    <path d="M34 47 l1 3 M40 49 l0 3 M46 47 l-1 3" fill="none" stroke-width="1.6"/>
    <circle cx="25" cy="42" r="2" fill="#e07a1f" stroke="none"/>
    <circle cx="54" cy="44" r="2" fill="#e07a1f" stroke="none"/>
    <!-- línies de pudor -->
    <g class="stink" fill="none" stroke="#2fbf6b" stroke-width="3">
      <path d="M2 20 q-4 8 0 14 q4 6 0 12"/>
      <path d="M78 10 q-5 9 0 16 q5 7 0 14"/>
      <path d="M78 66 q-4 8 0 14 q4 6 0 12"/>
    </g>
  </svg>`;

  // Si poses el teu propi dibuix a la mateixa carpeta com a "zombi.png",
  // el joc el farà servir en lloc del zombi SVG.
  const CUSTOM_IMAGE = "zombi.png";
  let useCustomImage = false;
  const probe = new Image();
  probe.onload = () => { useCustomImage = true; };
  probe.src = CUSTOM_IMAGE;

  function gameSize() {
    return { w: game.clientWidth, h: game.clientHeight };
  }
  function zombieHeight() {
    return window.innerWidth <= 600 ? 80 : 100;
  }

  function setScore(v) {
    score = v;
    scoreEl.textContent = v;
  }

  function spawnZombie() {
    const { h } = gameSize();
    const zh = zombieHeight();
    // columnes lliures (cap zombi massa a prop de dalt)
    const free = [];
    for (let c = 0; c < KEYS.length; c++) {
      const top = zombies.filter(z => z.col === c).reduce((m, z) => Math.min(m, z.y), Infinity);
      if (top > zh * 1.3) free.push(c);
    }
    if (!free.length) return;
    const col = free[Math.floor(Math.random() * free.length)];

    const el = document.createElement("div");
    el.className = "zombie";
    el.style.left = (col * 10) + "%";
    el.innerHTML = `<span class="key-tag">${KEYS[col].toUpperCase()}</span>
      ${useCustomImage ? `<img class="zombie-img" src="${CUSTOM_IMAGE}" alt="" draggable="false">` : ZOMBIE_SVG}
      <i class="fly f1"></i><i class="fly f2"></i><i class="fly f3"></i>`;
    zombiesLayer.appendChild(el);

    const speed = 38 + Math.min(score, 80) * 1.6 + Math.random() * 14;  // px/s
    const z = { id: nextId++, col, y: -zh, speed, el, targeted: false, h: zh };
    zombies.push(z);
    render(z);
  }

  function render(z) {
    z.el.style.transform = `translateY(${z.y}px)`;
  }

  function fire(key) {
    if (!running) return;
    const col = KEYS.indexOf(key);
    if (col < 0) return;
    const btn = keyButtons.find(b => b.dataset.key === key);
    flash(btn, "pressed");

    if (arrows.length >= MAX_ARROWS) { flash(btn, "nope"); return; }

    // zombi més baix d'aquesta columna que encara no té un raig assignat
    let target = null;
    for (const z of zombies) {
      if (z.col !== col || z.targeted || z.y < -z.h * 0.5) continue;
      if (!target || z.y > target.y) target = z;
    }
    if (!target) { flash(btn, "nope"); return; }

    target.targeted = true;
    const { h } = gameSize();
    const el = document.createElement("div");
    el.className = "blast";
    el.style.left = (col * 10) + "%";
    el.innerHTML = "<i></i>";
    arrowsLayer.appendChild(el);
    const a = { y: h - 46 - ARROW_H, el, target };
    arrows.push(a);
    el.style.transform = `translateY(${a.y}px)`;
  }

  function flash(btn, cls) {
    if (!btn) return;
    btn.classList.add(cls);
    setTimeout(() => btn.classList.remove(cls), 110);
  }

  function killZombie(z) {
    zombies = zombies.filter(o => o !== z);
    z.el.classList.add("dying");
    setTimeout(() => z.el.remove(), 350);
    setScore(score + 1);
  }

  function update(dt) {
    const { h } = gameSize();
    const dangerY = h - DANGER_BOTTOM;

    // zombis
    for (const z of zombies) {
      z.y += z.speed * dt;
      render(z);
      if (z.y + z.h >= dangerY) { endGame(); return; }
    }

    // raigs
    for (const a of arrows) {
      a.y -= ARROW_SPEED * dt;
      a.el.style.transform = `translateY(${a.y}px)`;
      const t = a.target;
      if (a.y <= t.y + t.h * 0.7) {
        a.done = true;
        if (zombies.includes(t)) killZombie(t);
      }
    }
    arrows = arrows.filter(a => {
      if (a.done) a.el.remove();
      return !a.done;
    });

    // aparició de zombis
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnZombie();
      spawnTimer = Math.max(0.55, 1.7 - score * 0.025) * (0.8 + Math.random() * 0.5);
    }
  }

  function loop(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    update(dt);
    if (running) requestAnimationFrame(loop);
  }

  function startGame() {
    zombiesLayer.innerHTML = "";
    arrowsLayer.innerHTML = "";
    zombies = [];
    arrows = [];
    setScore(0);
    spawnTimer = 0.4;
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    running = true;
    lastTime = performance.now();
    game.focus();
    requestAnimationFrame(loop);
  }

  function endGame() {
    running = false;
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem("mecazombis-best", String(best)); } catch (e) {}
    }
    finalEl.textContent = score;
    gameOverScreen.classList.remove("hidden");
  }

  document.getElementById("start-button").addEventListener("click", startGame);
  document.getElementById("restart-button").addEventListener("click", startGame);

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (!running && (k === "enter" || k === " ")) {
      e.preventDefault();
      startGame();
      return;
    }
    if (KEYS.includes(k)) {
      e.preventDefault();
      fire(k);
    }
  });

  keyButtons.forEach(b => b.addEventListener("click", () => fire(b.dataset.key)));
})();
