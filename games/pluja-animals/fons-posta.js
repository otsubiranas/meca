/* Fons pixel art "posta de sol" per a Pluja d'animals.
   Es munta dins de #game-area, darrere dels animals. Sense dependències.
   Ús: <script src="fons-posta.js"></script> abans de <script src="game.js"></script> */
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
