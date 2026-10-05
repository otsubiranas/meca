(() => {
  "use strict";

  /*
   * ============================================================
   * MECazombis
   * ============================================================
   *
   * 10 columnes:
   * A S D F G H J K L Ñ
   *
   * Mecànica:
   * - Els zombis apareixen des de dalt.
   * - Els zombis baixen a velocitat constant.
   * - En prémer una tecla surt una fletxa DES DE BAIX.
   * - La fletxa puja visible per la seva columna.
   * - La fletxa NO mata cap zombi fins que hi impacta.
   * - Quan hi ha impacte:
   *      -> desapareix el zombi
   *      -> desapareix la fletxa
   *      -> +1 punt
   * - Només hi pot haver 2 fletxes alhora.
   * - La freqüència de zombis augmenta amb la puntuació.
   * - Si un zombi arriba a la línia vermella -> Game Over.
   */

  // ------------------------------------------------------------
  // CONFIGURACIÓ
  // ------------------------------------------------------------

  const KEYS = [
    "a",
    "s",
    "d",
    "f",
    "g",
    "h",
    "j",
    "k",
    "l",
    "ñ"
  ];

  const CONFIG = {

    // Velocitat dels zombis en píxels/segon.
    zombieSpeed: 55,

    // Màxim de fletxes simultànies.
    maxArrows: 2,

    // Temps inicial entre aparicions.
    firstSpawnDelay: 900,

    // Límit mínim entre aparicions.
    minimumSpawnDelay: 220,

    // Cada zombi eliminat redueix el temps d'aparició.
    spawnAcceleration: 16,

    // Velocitat de les fletxes.
    arrowSpeed: 520,

    // Alçada ocupada per la zona inferior.
    dangerBottom: 72,

    // Distància màxima perquè considerem que hi ha impacte.
    // Aquest valor fa que l'impacte sigui visible però segur.
    collisionDistance: 32
  };


  // ------------------------------------------------------------
  // GRÀFICS
  // ------------------------------------------------------------
  //
  // De moment fem servir emojis per poder provar el joc.
  //
  // Més endavant pots canviar-los per imatges:
  //
  // const ZOMBIE_VISUAL =
  //   '<img src="images/zombie.png" alt="">';
  //
  // const ARROW_VISUAL =
  //   '<img src="images/arrow.png" alt="">';
  //

  const ZOMBIE_VISUAL = "🧟";
  const ARROW_VISUAL = "🏹";


  // ------------------------------------------------------------
  // ELEMENTS HTML
  // ------------------------------------------------------------

  const game = document.getElementById("game");

  const zombiesLayer =
    document.getElementById("zombies");

  const arrowsLayer =
    document.getElementById("arrows");

  const scoreElement =
    document.getElementById("score");

  const startScreen =
    document.getElementById("start-screen");

  const gameOverScreen =
    document.getElementById("game-over");

  const finalScoreElement =
    document.getElementById("final-score");

  const startButton =
    document.getElementById("start-button");

  const restartButton =
    document.getElementById("restart-button");

  const keyboardButtons = [
    ...document.querySelectorAll(".keyboard button")
  ];


  // ------------------------------------------------------------
  // ESTAT DEL JOC
  // ------------------------------------------------------------

  let zombies = [];
  let arrows = [];

  let score = 0;

  let running = false;

  let animationFrame = null;

  let lastTime = 0;

  let nextZombieId = 1;

  let spawnTimer = null;


  // ------------------------------------------------------------
  // POSICIÓ DE LES COLUMNES
  // ------------------------------------------------------------

  function columnX(column) {

    return (
      ((column + 0.5) / KEYS.length) * 100
    );

  }


  // ------------------------------------------------------------
  // LÍNIA DE PERILL
  // ------------------------------------------------------------

  function getDangerY() {

    return (
      game.clientHeight -
      CONFIG.dangerBottom
    );

  }


  // ------------------------------------------------------------
  // FREQÜÈNCIA DELS ZOMBIS
  // ------------------------------------------------------------

  function getSpawnDelay() {

    const delay =
      CONFIG.firstSpawnDelay -
      score * CONFIG.spawnAcceleration;

    return Math.max(
      CONFIG.minimumSpawnDelay,
      delay
    );

  }


  // ------------------------------------------------------------
  // CREAR UN ZOMBI
  // ------------------------------------------------------------

  function createZombie() {

    if (!running) {
      return;
    }


    // Escollim una de les 10 columnes.
    const column =
      Math.floor(
        Math.random() * KEYS.length
      );


    const element =
      document.createElement("div");

    element.className = "zombie";


    element.innerHTML = `
      <div class="zombie-visual">
        ${ZOMBIE_VISUAL}
      </div>

      <div class="zombie-key">
        ${KEYS[column].toUpperCase()}
      </div>
    `;


    const zombie = {

      id: nextZombieId++,

      key: KEYS[column],

      column: column,

      x: columnX(column),

      // Comença fora de la pantalla.
      y: -50,

      element: element

    };


    zombies.push(zombie);

    zombiesLayer.appendChild(element);


    renderZombie(zombie);

  }


  // ------------------------------------------------------------
  // DIBUIXAR ZOMBI
  // ------------------------------------------------------------

  function renderZombie(zombie) {

    zombie.element.style.left =
      `${zombie.x}%`;

    zombie.element.style.top =
      `${zombie.y}px`;

  }


  // ------------------------------------------------------------
  // CREAR UNA FLETXA
  // ------------------------------------------------------------

  function createArrow(key) {

    // No podem tenir més de dues fletxes.
    if (!running) {
      return;
    }

    if (arrows.length >= CONFIG.maxArrows) {
      return;
    }


    const column =
      KEYS.indexOf(key);


    if (column === -1) {
      return;
    }


    const element =
      document.createElement("div");

    element.className = "arrow";


    element.innerHTML = `
      <div class="arrow-visual">
        ${ARROW_VISUAL}
      </div>
    `;


    /*
     * IMPORTANT:
     *
     * La fletxa neix ABAIX de tot.
     *
     * No busquem cap zombi aquí.
     * No hi ha cap impacte en crear-la.
     */

    const arrow = {

      key: key,

      column: column,

      x: columnX(column),

      // Comença just per sobre de la línia de perill.
      y: getDangerY() - 25,

      element: element

    };


    arrows.push(arrow);

    arrowsLayer.appendChild(element);


    renderArrow(arrow);

  }


  // ------------------------------------------------------------
  // DIBUIXAR FLETXA
  // ------------------------------------------------------------

  function renderArrow(arrow) {

    arrow.element.style.left =
      `${arrow.x}%`;

    arrow.element.style.top =
      `${arrow.y}px`;

  }


  // ------------------------------------------------------------
  // ELIMINAR FLETXA
  // ------------------------------------------------------------

  function removeArrow(arrow) {

    const index =
      arrows.indexOf(arrow);


    if (index !== -1) {

      arrows.splice(
        index,
        1
      );

    }


    if (arrow.element) {

      arrow.element.remove();

    }

  }


  // ------------------------------------------------------------
  // MATAR ZOMBI
  // ------------------------------------------------------------

  function killZombie(zombie) {

    const index =
      zombies.indexOf(zombie);


    if (index === -1) {

      return;

    }


    zombies.splice(
      index,
      1
    );


    zombie.element.remove();


    // +1 punt.
    score++;


    scoreElement.textContent =
      score;


    /*
     * Cada eliminació accelera la freqüència
     * d'aparició dels zombis.
     */

    scheduleNextSpawn();

  }


  // ------------------------------------------------------------
  // DISPARAR
  // ------------------------------------------------------------

  function shoot(key) {

    createArrow(key);

  }


  // ------------------------------------------------------------
  // COMPROVAR IMPACTE
  // ------------------------------------------------------------

  function findCollision(arrow) {

    /*
     * Busquem només zombis:
     *
     * 1. de la mateixa columna
     * 2. que estiguin físicament molt a prop
     *
     * Això és molt important:
     *
     * NO fem:
     *
     *     zombie.y < arrow.y
     *
     * perquè això provocaria l'impacte instantani.
     */

    const possibleTargets =
      zombies
        .filter((zombie) => {

          if (
            zombie.column !==
            arrow.column
          ) {

            return false;

          }


          const distance =
            Math.abs(
              zombie.y -
              arrow.y
            );


          return (
            distance <=
            CONFIG.collisionDistance
          );

        });


    if (
      possibleTargets.length === 0
    ) {

      return null;

    }


    /*
     * Si hi ha diversos zombis a prop,
     * escollim el més proper a la fletxa.
     */

    possibleTargets.sort(
      (a, b) => {

        const distanceA =
          Math.abs(
            a.y -
            arrow.y
          );

        const distanceB =
          Math.abs(
            b.y -
            arrow.y
          );

        return (
          distanceA -
          distanceB
        );

      }
    );


    return possibleTargets[0];

  }


  // ------------------------------------------------------------
  // ACTUALITZAR EL JOC
  // ------------------------------------------------------------

  function update(dt) {

    if (!running) {

      return;

    }


    // ==========================================================
    // 1. MOUC ELS ZOMBIS
    // ==========================================================

    /*
     * TOTS els zombis continuen baixant
     * independentment de les fletxes.
     */

    for (
      const zombie
      of [...zombies]
    ) {

      zombie.y +=
        CONFIG.zombieSpeed * dt;


      renderZombie(zombie);


      // Ha arribat a terra?
      if (
        zombie.y >=
        getDangerY()
      ) {

        endGame();

        return;

      }

    }


    // ==========================================================
    // 2. MOUC LES FLETXES
    // ==========================================================

    for (
      const arrow
      of [...arrows]
    ) {

      /*
       * La fletxa puja CONTÍNUAMENT.
       *
       * Això fa visible el trajecte.
       */

      arrow.y -=
        CONFIG.arrowSpeed * dt;


      renderArrow(arrow);


      // ========================================================
      // 3. BUSQUEM IMPACTE
      // ========================================================

      const target =
        findCollision(arrow);


      if (target) {

        /*
         * NOMÉS ARA hi ha impacte.
         *
         * Primer desapareix el zombi.
         * Després desapareix la fletxa.
         * I finalment augmentem la puntuació.
         */

        killZombie(target);

        removeArrow(arrow);

        continue;

      }


      // ========================================================
      // 4. SI LA FLETXA SURT PER DALT, DESAPAREIX
      // ========================================================

      if (
        arrow.y < -100
      ) {

        removeArrow(arrow);

      }

    }

  }


  // ------------------------------------------------------------
  // BUCLE PRINCIPAL
  // ------------------------------------------------------------

  function gameLoop(timestamp) {

    if (!running) {

      return;

    }


    if (!lastTime) {

      lastTime =
        timestamp;

    }


    /*
     * dt = segons des de l'últim frame.
     *
     * Limitem el valor perquè el joc no faci
     * salts enormes si la finestra es bloqueja
     * temporalment.
     */

    const dt =
      Math.min(
        (timestamp - lastTime) / 1000,
        0.05
      );


    lastTime =
      timestamp;


    update(dt);


    if (running) {

      animationFrame =
        requestAnimationFrame(
          gameLoop
        );

    }

  }


  // ------------------------------------------------------------
  // PROGRAMAR EL SEGÜENT ZOMBI
  // ------------------------------------------------------------

  function scheduleNextSpawn() {

    clearTimeout(
      spawnTimer
    );


    if (!running) {

      return;

    }


    spawnTimer =
      setTimeout(
        () => {

          createZombie();

          scheduleNextSpawn();

        },
        getSpawnDelay()
      );

  }


  // ------------------------------------------------------------
  // NETEJAR PARTIDA
  // ------------------------------------------------------------

  function clearGame() {

    clearTimeout(
      spawnTimer
    );


    for (
      const zombie
      of zombies
    ) {

      zombie.element.remove();

    }


    for (
      const arrow
      of arrows
    ) {

      arrow.element.remove();

    }


    zombies = [];

    arrows = [];

  }


  // ------------------------------------------------------------
  // COMENÇAR PARTIDA
  // ------------------------------------------------------------

  function startGame() {

    cancelAnimationFrame(
      animationFrame
    );


    clearGame();


    score = 0;


    scoreElement.textContent =
      "0";


    lastTime = 0;


    running = true;


    startScreen.classList.add(
      "hidden"
    );


    gameOverScreen.classList.add(
      "hidden"
    );


    game.focus();


    /*
     * Zombi immediat.
     */

    createZombie();


    /*
     * I comencem a programar
     * les següents aparicions.
     */

    scheduleNextSpawn();


    animationFrame =
      requestAnimationFrame(
        gameLoop
      );

  }


  // ------------------------------------------------------------
  // FINAL DE PARTIDA
  // ------------------------------------------------------------

  function endGame() {

    if (!running) {

      return;

    }


    running = false;


    clearTimeout(
      spawnTimer
    );


    cancelAnimationFrame(
      animationFrame
    );


    finalScoreElement.textContent =
      score;


    gameOverScreen.classList.remove(
      "hidden"
    );

  }


  // ------------------------------------------------------------
  // PRÉMER UNA TECLA
  // ------------------------------------------------------------

  function pressKey(key) {

    key =
      key.toLowerCase();


    if (
      !KEYS.includes(key)
    ) {

      return;

    }


    /*
     * Animació del teclat virtual.
     */

    const button =
      keyboardButtons.find(
        (button) =>
          button.dataset.key === key
      );


    if (button) {

      button.classList.add(
        "active"
      );


      setTimeout(
        () => {

          button.classList.remove(
            "active"
          );

        },
        90
      );

    }


    /*
     * Només disparem si la partida està activa.
     */

    if (running) {

      shoot(key);

    }

  }


  // ------------------------------------------------------------
  // TECLAT FÍSIC
  // ------------------------------------------------------------

  document.addEventListener(
    "keydown",
    (event) => {

      /*
       * No volem interferir amb
       * Ctrl / Alt / Cmd.
       */

      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
      ) {

        return;

      }


      const key =
        event.key.toLowerCase();


      /*
       * Una de les 10 tecles?
       */

      if (
        KEYS.includes(key)
      ) {

        event.preventDefault();

        pressKey(key);

      }


      /*
       * Enter = començar/recomençar.
       */

      if (
        event.key === "Enter" &&
        !running
      ) {

        event.preventDefault();

        startGame();

      }

    }
  );


  // ------------------------------------------------------------
  // TECLAT VIRTUAL
  // ------------------------------------------------------------

  keyboardButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          pressKey(
            button.dataset.key
          );

          game.focus();

        }
      );

    }
  );


  // ------------------------------------------------------------
  // BOTÓ COMENÇAR
  // ------------------------------------------------------------

  startButton.addEventListener(
    "click",
    () => {

      startGame();

    }
  );


  // ------------------------------------------------------------
  // BOTÓ REINICIAR
  // ------------------------------------------------------------

  restartButton.addEventListener(
    "click",
    () => {

      startGame();

    }
  );


  // ------------------------------------------------------------
  // REDIMENSIONAR LA FINESTRA
  // ------------------------------------------------------------

  window.addEventListener(
    "resize",
    () => {

      for (
        const zombie
        of zombies
      ) {

        renderZombie(zombie);

      }


      for (
        const arrow
        of arrows
      ) {

        renderArrow(arrow);

      }

    }
  );

})();
