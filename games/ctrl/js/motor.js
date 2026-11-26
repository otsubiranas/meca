/* Ctrl+Virus — motor del joc
   Model de text propi (no és un textarea) per controlar cada drecera i animar-la. */
const J = (() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // ---------- eines ----------
  const EINES = {
    C: { nom: 'Fotocopiadora', icona: 'fotocopiadora', fa: 'Copiar' },
    X: { nom: 'Tisores', icona: 'tisores', fa: 'Retallar (engabiar)' },
    V: { nom: 'Pot de cola', icona: 'cola', fa: 'Enganxar' },
    Z: { nom: 'Rellotge enrere', icona: 'rebobinar', fa: 'Desfer' },
    A: { nom: 'Xarxa', icona: 'xarxa', fa: 'Seleccionar-ho tot' },
    S: { nom: 'Disquet', icona: 'disquet', fa: 'Desar' },
    F: { nom: 'Lupa', icona: 'lupa', fa: 'Cercar' },
    P: { nom: 'Impressora', icona: 'impressora', fa: 'Imprimir' },
    B: { nom: 'Negreta', lletra: 'B', fa: 'Negreta' },
    I: { nom: 'Cursiva', lletra: 'I', fa: 'Cursiva' },
    U: { nom: 'Subratllat', lletra: 'U', fa: 'Subratllat' },
  };
  const iconaHTML = (e, cls = 'icona') => {
    const t = EINES[e];
    if (!t) return '';
    if (t.lletra) return `<span class="icona-lletra ${t.lletra.toLowerCase()}">${t.lletra}</span>`;
    return `<img class="${cls}" src="img/icones/${t.icona}.png" alt="${t.nom}">`;
  };
  const tecla = t => `<span class="tecla">${t}</span>`;
  const tecles = arr => arr.map(tecla).join('<span class="mes">+</span>');

  // ---------- so ----------
  const NOMS_SO = ['clic','copiar','tallar','enganxar','desfer','xarxa','desar','error','virus','virus2','engabiat','cercar','imprimir','tic','format','nivell','moure','bong','esborrar'];
  const sons = {};
  let soActiu = true;
  NOMS_SO.forEach(n => { const a = new Audio(`so/${n}.ogg`); a.preload = 'auto'; sons[n] = a; });
  function so(n, vol = .6) {
    if (!soActiu || !sons[n]) return;
    const a = sons[n].cloneNode(); a.volume = vol; a.play().catch(() => {});
  }

  // ---------- desar progrés ----------
  const CLAU = 'ctrlvirus-v1';
  let progres = { fets: {} };
  try { progres = JSON.parse(localStorage.getItem(CLAU)) || progres; } catch (e) {}
  const desaProgres = () => { try { localStorage.setItem(CLAU, JSON.stringify(progres)); } catch (e) {} };
  const totsOberts = /[?&]tots=1/.test(location.search);

  // ---------- estat ----------
  let pantalla = 'portada';
  let L = null, nIdx = 0;
  let doc = [], cur = 0, anc = null, clip = [], undo = [], redo = [];
  let ready = false, acabat = false, errors = 0, fallades = {}, t0 = 0, engabiats = 0;
  let timers = [], st = {}, cerca = null, avisEscriure = false;
  let ctrlEsq = false, ctrlDret = false, usCtrlEsq = 0, usCtrl = 0;
  let mapaSel = 0;

  // ---------- model de text ----------
  const ch = (c, o = {}) => ({ c, b: false, i: false, u: false, v: 0, h: false, vs: false, hole: false, g: false, ...o });
  const copia = x => ({ ...x });
  function parse(src) {
    const d = []; let c0 = null, a0 = null, vid = 0, i = 0;
    while (i < src.length) {
      if (src.startsWith('[_]', i)) { d.push(ch('', { hole: true })); i += 3; continue; }
      const m = src.slice(i).match(/^\{([vhg]):([^}]*)\}/);
      if (m) {
        vid++;
        for (const c of m[2]) d.push(ch(c, m[1] === 'g' ? { g: true } : { v: vid, h: m[1] === 'h', col: L.color }));
        i += m[0].length; continue;
      }
      const c = src[i];
      if (c === '|') { c0 = d.length; i++; continue; }
      if (c === '‹') { a0 = d.length; i++; continue; }
      if (c === '›') { c0 = d.length; i++; continue; }
      if (c === '¤') { vid++; d.push(ch('¤', { v: vid, vs: true, col: L.color })); i++; continue; }
      d.push(ch(c)); i++;
    }
    return { d, c0: c0 ?? 0, a0 };
  }
  const plain = (d = doc) => d.map(x => x.hole ? '□' : x.c).join('');
  const norm = s => s.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').replace(/ ([.,;:!?])/g, '$1').trim();
  const sel = () => (anc === null || anc === cur) ? null : [Math.min(anc, cur), Math.max(anc, cur)];
  const esParaula = i => { const x = doc[i]; return x && !x.h && /[\p{L}\p{N}'·¤]/u.test(x.c); };
  const valid = p => !(doc[p - 1] && doc[p - 1].h);
  function ajusta(p, dir) { while (p > 0 && p < doc.length && !valid(p)) p += dir || 1; return Math.max(0, Math.min(doc.length, p)); }
  const iniciLinia = p => { const k = plain().lastIndexOf('\n', p - 1); return k + 1; };
  const fiLinia = p => { const k = plain().indexOf('\n', p); return k < 0 ? doc.length : k; };

  function pushUndo() {
    undo.push({ d: doc.map(copia), cur, anc });
    if (undo.length > 150) undo.shift();
    redo = [];
  }
  function restaura(s) { doc = s.d.map(copia); cur = s.cur; anc = s.anc; }

  // ---------- missatges ----------
  function msg(text, tipus = '') {
    const box = $('#terminal-linies');
    const p = document.createElement('p');
    p.className = tipus;
    p.textContent = (tipus === 'virus' ? '[VIRUS] ' : '> ') + text;
    box.appendChild(p);
    while (box.children.length > 200) box.firstChild.remove();
    box.scrollTop = box.scrollHeight;
  }
  let avisT = null;
  function avis(text) {
    const a = $('#avis'); a.textContent = text; a.classList.remove('amagat');
    clearTimeout(avisT); avisT = setTimeout(() => a.classList.add('amagat'), 2600);
  }
  function error(eina, text) {
    errors++; fallades[eina] = (fallades[eina] || 0) + 1;
    so('error');
    if (text) msg(text, 'alerta');
    efecte('sacseja');
    $('#m-errors').textContent = errors;
    pintaTasques();
  }
  function efecte(cls, ms = 600) {
    const f = $('#finestra'); f.classList.remove(cls); void f.offsetWidth; f.classList.add(cls);
    setTimeout(() => f.classList.remove(cls), ms);
  }
  function einaVoladora(e) {
    const t = EINES[e]; const z = $('#zona');
    let el;
    if (t.lletra) { el = document.createElement('div'); el.className = 'eina-voladora lletra'; el.textContent = t.lletra; if (e === 'I') el.style.fontStyle = 'italic'; if (e === 'U') el.style.textDecoration = 'underline'; }
    else { el = document.createElement('img'); el.className = 'eina-voladora'; el.src = `img/icones/${t.icona}.png`; }
    z.appendChild(el); setTimeout(() => el.remove(), 850);
  }

  // ---------- temporitzadors ----------
  const later = (fn, ms) => { const id = setTimeout(() => { if (!acabat) fn(); }, ms); timers.push(id); return id; };
  const cancel = id => clearTimeout(id);
  function netejaTimers() { timers.forEach(clearTimeout); timers = []; }

  function compte(segons, onFi, text = 'Desfés-ho!') {
    const z = $('#zona');
    const el = document.createElement('div'); el.className = 'compte';
    el.innerHTML = `<div class="ple"></div><span>${text}</span>`;
    z.appendChild(el);
    const ini = Date.now();
    const id = setInterval(() => {
      const r = 1 - (Date.now() - ini) / (segons * 1000);
      el.querySelector('.ple').style.width = Math.max(0, r * 100) + '%';
      if (r <= 0) { tanca(); if (!acabat) onFi(); }
    }, 100);
    timers.push(id);
    function tanca() { clearInterval(id); el.remove(); }
    return tanca;
  }

  // ---------- slimes ----------
  function slime(color, cls = '') {
    const el = document.createElement('div');
    el.className = 'slime flot ' + cls;
    el.style.setProperty('--c', color);
    $('#zona').appendChild(el);
    return el;
  }
  function posDe(i) {
    const z = $('#zona').getBoundingClientRect();
    const sp = $(`#doc [data-i="${i}"]`);
    if (!sp) return { x: 20, y: 20 };
    const r = sp.getBoundingClientRect();
    return { x: r.left - z.left, y: r.top - z.top, h: r.height };
  }
  function cap_a_gabia(el) {
    const g = $('.marcador img[src*="gabia"]').getBoundingClientRect();
    const z = $('#zona').getBoundingClientRect();
    el.classList.add('engabiant');
    requestAnimationFrame(() => {
      el.style.left = (g.left - z.left) + 'px';
      el.style.top = (g.top - z.top) + 'px';
      el.style.width = '16px'; el.style.opacity = '.3';
    });
    setTimeout(() => el.remove(), 750);
  }
  function engabia(n, posicions, color) {
    engabiats += n; $('#m-gabia').textContent = engabiats;
    so('engabiat');
    posicions.forEach(p => {
      const el = slime(color ?? L.color);
      el.style.left = p.x + 'px'; el.style.top = (p.y - 10) + 'px';
      setTimeout(() => cap_a_gabia(el), 120);
    });
  }

  // ---------- pintar ----------
  function rangsFormat() {
    const req = new Array(doc.length).fill(null), ins = {};
    if (!L.formats) return { req, ins };
    const p = plain();
    L.formats.forEach((f, k) => {
      const a = p.indexOf(f.text);
      if (a < 0) return;
      for (let j = a; j < a + f.text.length; j++) req[j] = f.attr;
      let ok = true;
      for (let j = a; j < a + f.text.length; j++) { const x = doc[j]; if (/\s/.test(x.c)) continue; if (!x[f.attr] || ['b','i','u'].some(t => t !== f.attr && x[t])) ok = false; }
      ins[a] = { attr: f.attr, ok };
    });
    return { req, ins };
  }
  function render() {
    if (!L || L.boss) return;
    const s = sel() || [-1, -1];
    const { req, ins } = rangsFormat();
    let h = '';
    for (let i = 0; i <= doc.length; i++) {
      if (i === cur && !cerca) h += '<span class="cur"></span>';
      if (i === doc.length) break;
      const x = doc[i];
      if (x.h) continue;
      if (ins[i]) h += `<span class="insignia ${ins[i].attr}${ins[i].ok ? ' ok' : ''}">${ins[i].attr.toUpperCase()}</span>`;
      if (x.v && !x.vs && (i === 0 || doc[i - 1].v !== x.v)) h += `<span class="slime mini" style="--c:${x.col}"></span>`;
      const cls = [];
      if (i >= s[0] && i < s[1]) cls.push('sel');
      if (x.b) cls.push('b'); if (x.i) cls.push('i'); if (x.u) cls.push('u');
      if (x.v && !x.vs) cls.push('inf', 'c' + x.col);
      if (x.g) cls.push('brossa');
      if (req[i]) { cls.push('obj'); const a = Object.keys(ins).map(Number).filter(k => k <= i).pop(); if (a !== undefined && ins[a].ok) cls.push('ok'); }
      if (x.c === '\n') { h += (cls.includes('sel') ? `<span class="sel nl" data-i="${i}"> </span>` : `<span data-i="${i}"></span>`) + '\n'; continue; }
      let cont;
      if (x.hole) cont = '<span class="forat"></span>';
      else if (x.vs) cont = `<span class="slime inl" style="--c:${x.col}"></span>`;
      else cont = x.c.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      h += `<span data-i="${i}" class="${cls.join(' ')}">${cont}</span>`;
    }
    $('#doc').innerHTML = h;
    const c = $('#doc .cur');
    if (c) c.scrollIntoView({ block: 'nearest' });
    $('#estat-esq').textContent = sel() ? `Seleccionats: ${sel()[1] - sel()[0]} caràcters` : `Línia ${plain().slice(0, cur).split('\n').length}, columna ${cur - iniciLinia(cur) + 1}`;
    const vr = virusRestants();
    $('#estat-dreta').textContent = vr ? `Virus detectats: ${vr}` : 'Sense virus';
  }
  function virusRestants() { return new Set(doc.filter(x => x.v).map(x => x.v)).size; }

  // ---------- comprovació ----------
  function formatOK() {
    if (!L.formats) return true;
    const { req, ins } = rangsFormat();
    if (Object.keys(ins).length !== L.formats.length) return false;
    for (let i = 0; i < doc.length; i++) {
      const x = doc[i]; if (/\s/.test(x.c)) continue;
      for (const t of ['b', 'i', 'u']) if (!!x[t] !== (req[i] === t)) return false;
    }
    return true;
  }
  const textOK = () => norm(plain()) === norm(L.objectiu);
  function comprova() {
    if (acabat || !L || L.boss) return;
    const ara = textOK() && formatOK() && (!L.extra || L.extra(st));
    if (ara && !ready) {
      ready = true; so('nivell', .4);
      if (L.final === 'S') msg('Document net! Ara desa\'l amb el disquet.', 'be');
      if (L.final === 'P') msg('Tot a punt! Imprimeix la vacuna amb la impressora.', 'be');
    } else if (!ara) ready = false;
    pintaTasques();
  }

  // ---------- tasques ----------
  function pintaTasques() {
    if (!L) return;
    const mode = L.pistes; // 'tecles' | 'icones' | 'res'
    const mostraTecles = mode === 'tecles' || errors >= 2;
    const fila = (t, final) => {
      const ic = t.e ? iconaHTML(t.e) : (t.icona ? `<img class="icona" src="img/icones/${t.icona}.png" alt="">` : '');
      const tk = t.tecles || (t.e ? ['Ctrl', t.e] : []);
      const tkH = tk.length ? (mostraTecles ? tecles(tk) : '<span class="tecla oculta">?</span>') : '';
      return `<li class="${final ? 'final' + (ready ? ' visible' : '') : ''}">${ic}<span class="tecles">${tkH}</span><span>${t.txt}</span></li>`;
    };
    let h = L.tasques.map(t => fila(t)).join('');
    if (L.final === 'S') h += fila({ e: 'S', txt: 'Desa el document' }, true);
    if (L.final === 'P') h += fila({ e: 'P', txt: 'Imprimeix la vacuna' }, true);
    $('#tasques').innerHTML = h;
  }

  // ---------- accions de text ----------
  function selecciona(a, b) { anc = a; cur = b; }
  function primerVirus() {
    for (let i = 0; i < doc.length; i++) if (doc[i].v && !doc[i].h) { let j = i; while (j < doc.length && doc[j].v === doc[i].v) j++; return [i, j]; }
    return null;
  }
  function assistencia(tipus) {
    if (L.autoForat && (tipus === 'C' || tipus === 'V' || tipus === 'Z')) {
      const k = doc.findIndex(x => x.hole);
      if (k >= 0 && clip.length) { cur = k; anc = null; }
    }
    if (L.autoVirus && (tipus === 'inici' || tipus === 'X' || tipus === 'Z')) {
      const r = primerVirus(); if (r) selecciona(r[0], r[1]);
    }
    if (L.passos) {
      const p = plain();
      const pas = L.passos.find(ps => !norm(p).includes(norm(ps.ok)));
      if (!pas) return;
      if (tipus === 'X' && norm(plain(clip)) === norm(pas.sel)) {
        const k = pas.abans ? p.indexOf(pas.abans) : doc.length; cur = k < 0 ? doc.length : k; anc = null;
      } else if (['inici', 'V', 'Z'].includes(tipus) || tipus === 'X') {
        const k = p.indexOf(pas.sel);
        if (k >= 0) selecciona(k, k + pas.sel.length);
        else { const d = pas.abans ? p.indexOf(pas.abans) : doc.length; cur = d < 0 ? doc.length : d; anc = null; }
      }
    }
  }
  function despres(tipus) {
    if (L.accio) L.accio(tipus, st);
    assistencia(tipus);
    render(); comprova();
  }

  function fCopiar() {
    const s = sel();
    if (!s) { avis('Primer selecciona el text que vols copiar.'); return; }
    clip = doc.slice(s[0], s[1]).filter(x => !x.h && !x.v).map(copia);
    so('copiar'); einaVoladora('C');
    render();
    for (let i = s[0]; i < s[1]; i++) { const sp = $(`#doc [data-i="${i}"]`); if (sp) sp.classList.add('flash'); }
    msg(`Copiat: «${plain(clip).replace(/\n/g, ' ').slice(0, 40)}»`);
    setTimeout(() => despres('C'), 450);
  }
  function fRetallar() {
    const s = sel();
    if (!s) { avis('Primer selecciona el que vols retallar.'); return; }
    const tros = doc.slice(s[0], s[1]);
    const ids = [...new Set(tros.filter(x => x.v).map(x => x.v))];
    const posicions = ids.map(id => posDe(s[0] + tros.findIndex(x => x.v === id)));
    const bo = tros.filter(x => !x.v && !x.g && !/\s/.test(x.c) && !x.hole);
    pushUndo();
    doc.splice(s[0], s[1] - s[0]); cur = s[0]; anc = null;
    clip = tros.filter(x => !x.v).map(copia);
    so('tallar'); einaVoladora('X');
    if (ids.length) {
      // el virus només queda engabiat si ja no en queda cap tros al document
      const sencers = ids.filter(id => !doc.some(x => x.v === id));
      if (sencers.length) { engabia(sencers.length, posicions.slice(0, sencers.length), tros.find(x => x.v).col); msg(sencers.length > 1 ? `${sencers.length} virus engabiats!` : 'Virus engabiat!', 'be'); }
      else msg('Has tallat només un tros del virus. Encara se\'n veu una part!', 'alerta');
    }
    if (bo.length && !L.permetTallar) error('X', 'Compte! Has retallat text bo. Fes servir el rellotge enrere (Ctrl+Z) per recuperar-lo.');
    despres('X');
  }
  function fEnganxar() {
    if (!clip.length) { avis('El pot de cola és buit: primer copia o retalla alguna cosa.'); return; }
    pushUndo();
    const s = sel();
    if (s) { if (doc.slice(s[0], s[1]).some(x => x.v)) { undo.pop(); avis('No enganxis a sobre d\'un virus: engabia\'l primer.'); return; } doc.splice(s[0], s[1] - s[0]); cur = s[0]; }
    if (doc[cur] && doc[cur].hole) doc.splice(cur, 1);
    else if (doc[cur - 1] && doc[cur - 1].hole) { doc.splice(cur - 1, 1); cur--; }
    const nou = clip.map(copia);
    doc.splice(cur, 0, ...nou);
    const a = cur; cur += nou.length; anc = null;
    so('enganxar'); einaVoladora('V');
    render();
    for (let i = a; i < cur; i++) { const sp = $(`#doc [data-i="${i}"]`); if (sp) sp.classList.add('flash'); }
    setTimeout(() => despres('V'), 300);
  }
  function fDesfer() {
    if (!undo.length) { avis('No hi ha res per desfer.'); return; }
    redo.push({ d: doc.map(copia), cur, anc });
    restaura(undo.pop());
    so('desfer'); einaVoladora('Z'); efecte('rebobina');
    despres('Z');
  }
  function fRefer() {
    if (!redo.length) { avis('No hi ha res per refer.'); return; }
    undo.push({ d: doc.map(copia), cur, anc });
    restaura(redo.pop());
    so('desfer'); despres('Y');
  }
  function fTotsel() {
    selecciona(0, doc.length);
    so('xarxa');
    despres('A');
  }
  function fDesar() {
    so('desar'); einaVoladora('S');
    if (L.accio) L.accio('S', st);
    if (acabat) return;
    if (ready && L.final === 'S') { completa(); return; }
    if (!L.extraS) msg('Desat, però encara no està tot a punt. ' + diagnostic(), 'alerta');
    render(); comprova();
  }
  function fImprimir() {
    if (ready && L.final === 'P') {
      so('imprimir'); einaVoladora('P');
      const p = document.createElement('div'); p.className = 'paper';
      p.innerHTML = 'VACUNA ANTIVIRUS<br><br>████████<br>██ ███ ████<br>████ ██<br><br>✔ ACTIVADA';
      $('#zona').appendChild(p); requestAnimationFrame(() => p.classList.add('surt'));
      acabat = true; netejaTimers();
      setTimeout(completa, 1900); return;
    }
    so('imprimir', .3);
    avis(L.final === 'P' ? 'Encara no: primer cal netejar el document.' : 'En aquesta missió no cal imprimir res.');
  }
  function fFormat(t) {
    const s = sel();
    if (!s) { avis('Primer selecciona el text.'); return; }
    pushUndo();
    const tros = doc.slice(s[0], s[1]).filter(x => x.c !== '\n');
    const tots = tros.every(x => x[t]);
    tros.forEach(x => x[t] = !tots);
    so('format'); einaVoladora(t.toUpperCase());
    despres(t.toUpperCase());
  }
  function esborra(a, b, eina) {
    if (a === b) return;
    const tros = doc.slice(a, b);
    if (tros.some(x => x.v)) { error('X', 'Els virus no s\'esborren: s\'engabien! Selecciona\'ls i fes servir les tisores (Ctrl+X).'); return; }
    if (tros.some(x => x.hole)) { avis('Els forats s\'omplen amb el pot de cola (Ctrl+V).'); return; }
    pushUndo();
    doc.splice(a, b - a); cur = a; anc = null;
    so('esborrar', .4);
    despres(eina);
  }
  function fRetroces(ctrl) {
    const s = sel();
    if (s) return esborra(s[0], s[1], 'retroces');
    if (cur === 0) return;
    if (!ctrl) { let a = cur - 1; while (a > 0 && doc[a].h) a--; return esborra(a, cur, 'retroces'); }
    let a = cur;
    while (a > 0 && !esParaula(a - 1) && doc[a - 1].c !== '\n') a--;
    if (a > 0 && doc[a - 1].c === '\n' && a === cur) a--;
    while (a > 0 && esParaula(a - 1)) a--;
    esborra(a, cur, 'ctrlretroces');
  }
  function fSupr(ctrl) {
    const s = sel();
    if (s) return esborra(s[0], s[1], 'supr');
    if (cur >= doc.length) return;
    let b = cur + 1;
    if (ctrl) { b = cur; while (b < doc.length && !esParaula(b)) b++; while (b < doc.length && esParaula(b)) b++; }
    esborra(cur, b, 'supr');
  }
  function fSaltLinia() {
    const s = sel();
    if (s && doc.slice(s[0], s[1]).some(x => x.v)) { avis('No pots trepitjar un virus: engabia\'l primer.'); return; }
    pushUndo();
    if (s) { doc.splice(s[0], s[1] - s[0]); cur = s[0]; }
    doc.splice(cur, 0, ch('\n')); cur++; anc = null;
    so('moure', .3);
    despres('enter');
  }
  // explica per què encara no es pot acabar
  function diagnostic() {
    const linies = t => norm(t).split('\n');
    const ara = linies(plain()), obj = linies(L.objectiu);
    if (virusRestants()) return 'Encara queden virus al document.';
    const compta = (arr, l) => arr.filter(x => x === l).length;
    const rep = ara.find(l => compta(ara, l) > compta(obj, l) && obj.includes(l));
    if (rep) return `La línia «${rep}» hi és repetida. Esborra-la o desfés amb Ctrl+Z.`;
    const enganxada = ara.find(l => !obj.includes(l) && obj.some(o => o && l.includes(o) && l !== o));
    if (enganxada) return 'Hi ha dues línies enganxades. Posa el cursor entre elles i prem Enter.';
    if (ara.length === obj.length && [...ara].sort().join('|') === [...obj].sort().join('|')) return 'Les línies hi són totes, però l\'ordre encara no és correcte.';
    if (textOK() && !formatOK()) return 'El text està bé, però el format encara no.';
    if (textOK()) return 'El text està bé, però encara queda feina a la missió.';
    return 'El text encara no és igual que l\'original. Si t\'has embolicat, fes servir Ctrl+Z.';
  }
  function mou(tecla, ctrl, shift) {
    const s = sel();
    let p = cur;
    if (!shift && s && !ctrl && (tecla === 'ArrowLeft' || tecla === 'ArrowRight')) {
      cur = tecla === 'ArrowLeft' ? s[0] : s[1]; anc = null; so('moure', .15); despres('moure'); return;
    }
    if (tecla === 'ArrowLeft') {
      if (ctrl) { while (p > 0 && !esParaula(p - 1)) p--; while (p > 0 && esParaula(p - 1)) p--; }
      else p--;
      p = ajusta(p, -1);
    } else if (tecla === 'ArrowRight') {
      if (ctrl) { while (p < doc.length && !esParaula(p)) p++; while (p < doc.length && esParaula(p)) p++; }
      else p++;
      p = ajusta(p, 1);
    } else if (tecla === 'ArrowUp' || tecla === 'ArrowDown') {
      const ls = iniciLinia(p), col = p - ls;
      if (tecla === 'ArrowDown') {
        const fl = fiLinia(p);
        if (fl >= doc.length) p = doc.length;
        else { const ns = fl + 1; p = Math.min(ns + col, fiLinia(ns)); }
      } else {
        if (ls === 0) p = 0;
        else { const ps = iniciLinia(ls - 1); p = Math.min(ps + col, ls - 1); }
      }
      p = ajusta(p, 1);
    } else if (tecla === 'Home') p = ctrl ? 0 : iniciLinia(p);
    else if (tecla === 'End') p = ctrl ? doc.length : fiLinia(p);
    p = Math.max(0, Math.min(doc.length, p));
    if (shift) { if (anc === null) anc = cur; } else anc = null;
    cur = p;
    so('moure', .15);
    despres('moure');
  }

  // ---------- cerca (Ctrl+F) ----------
  function obreCerca() {
    cerca = ''; $('#cerca').classList.remove('amagat'); $('#cerca-text').textContent = '';
    so('cercar'); einaVoladora('F'); render();
    if (L.accio) L.accio('F', st);
  }
  function tancaCerca() { cerca = null; $('#cerca').classList.add('amagat'); render(); }
  function cercaTecla(e) {
    if (e.key === 'Escape') { tancaCerca(); return; }
    if (e.key === 'Enter') {
      const q = cerca.trim().toLowerCase(); if (!q) return;
      const p = plain().toLowerCase();
      let k = p.indexOf(q, cur); if (k < 0) k = p.indexOf(q);
      if (k < 0) { so('error', .4); msg(`«${cerca}» no apareix al document.`, 'alerta'); fallades['F'] = (fallades['F'] || 0); return; }
      const amagats = doc.slice(k, k + q.length).some(x => x.h);
      if (amagats) {
        pushUndo();
        for (let i = k; i < k + q.length; i++) doc[i].h = false;
        // també mostra la resta del virus, si n'hi ha
        const id = doc[k].v; if (id) doc.forEach(x => { if (x.v === id) x.h = false; });
        so('virus2'); msg('Virus trobat! Està seleccionat: engabia\'l amb les tisores.', 'be');
      } else so('cercar');
      let a = k, b = k + q.length;
      const id = doc[k].v; if (id) { while (a > 0 && doc[a - 1].v === id) a--; while (b < doc.length && doc[b].v === id) b++; }
      selecciona(a, b);
      tancaCerca(); despres('cerca');
      return;
    }
    if (e.key === 'Backspace') { cerca = cerca.slice(0, -1); }
    else if (e.key.length === 1 && !e.ctrlKey) { cerca += e.key.toUpperCase(); so('tic', .2); }
    $('#cerca-text').textContent = cerca;
  }

  // ---------- teclat ----------
  const NOM_TECLA = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Backspace: 'Retrocés', Enter: 'Enter', Escape: 'Esc', ' ': 'Espai', Home: 'Inici', End: 'Fi', Delete: 'Supr', Tab: 'Tab' };
  function pintaBarraTecles(e) {
    const b = $('#barra-tecles');
    if (!b) return;
    let ult = '';
    if (e && e.type === 'keydown' && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) ult = NOM_TECLA[e.key] || (e.code.startsWith('Key') ? e.code.slice(3) : e.key.toUpperCase());
    const on = k => e && e[k] ? ' on' : '';
    b.innerHTML = `Tecles: <span class="tecla${on('ctrlKey')}">Ctrl</span><span class="tecla${on('shiftKey')}">Shift</span><span class="tecla${on('altKey')}">Alt</span>` +
      (ult ? `<span class="mes">+</span><span class="tecla ultima">${ult}</span>` : '');
  }

  function teclaJoc(e) {
    const ctrl = e.ctrlKey, sh = e.shiftKey, k = e.key, code = e.code;
    if (cerca !== null) { e.preventDefault(); cercaTecla(e); return; }
    if (k === 'Escape') { e.preventDefault(); surtAlMapa(); return; }
    if (acabat) { e.preventDefault(); return; }
    if (ctrl && code.startsWith('Key')) {
      e.preventDefault();
      usCtrl++; if (ctrlEsq) usCtrlEsq++;
      const l = code.slice(3);
      if (L.boss) { L.boss.tecla(l, st); return; }
      if (l === 'Z' && sh) return fRefer();
      ({ C: fCopiar, X: fRetallar, V: fEnganxar, Z: fDesfer, Y: fRefer, A: fTotsel, S: fDesar, F: obreCerca, P: fImprimir,
         B: () => fFormat('b'), I: () => fFormat('i'), U: () => fFormat('u') }[l] || (() => avis('Aquesta drecera no fa res aquí.')))();
      return;
    }
    if (L.boss) { if (k.length === 1 || k.startsWith('Arrow')) e.preventDefault(); return; }
    if (k.startsWith('Arrow') || k === 'Home' || k === 'End') { e.preventDefault(); return mou(k, ctrl, sh); }
    if (k === 'Backspace') { e.preventDefault(); if (e.altKey) return fSupr(false); return fRetroces(ctrl); }
    if (k === 'Delete') { e.preventDefault(); return fSupr(ctrl); }
    if (k === 'Enter') { e.preventDefault(); return fSaltLinia(); }
    if (k === ' ' || k === 'Tab') { e.preventDefault(); }
    if (k.length === 1 && !ctrl && !e.altKey) {
      e.preventDefault();
      if (!avisEscriure) { avisEscriure = true; msg('Els virus han bloquejat l\'escriptura. Aquí només funcionen les dreceres!', 'virus'); }
      else avis('Només funcionen les dreceres de teclat!');
    }
  }

  window.addEventListener('keydown', e => {
    if (e.code === 'ControlLeft') ctrlEsq = true;
    if (e.code === 'ControlRight') ctrlDret = true;
    pintaBarraTecles(e);
    if (pantalla === 'joc' && $('#resultat').classList.contains('amagat')) return teclaJoc(e);
    if (e.ctrlKey && /^Key[A-Z]$/.test(e.code) && e.code !== 'KeyR') e.preventDefault();
    if (!$('#credits').classList.contains('amagat')) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); tancaCredits(); } return; }
    if (!$('#resultat').classList.contains('amagat')) {
      if (e.key === 'Enter') { e.preventDefault(); $('#res-seg').click(); }
      if (e.key === 'Escape') { e.preventDefault(); $('#res-mapa').click(); }
      return;
    }
    if (pantalla === 'portada') { if (e.key === 'Enter') { e.preventDefault(); mostra('mapa'); } return; }
    if (pantalla === 'mapa') teclaMapa(e);
  });
  window.addEventListener('keyup', e => {
    if (e.code === 'ControlLeft') ctrlEsq = false;
    if (e.code === 'ControlRight') ctrlDret = false;
    pintaBarraTecles(e.type === 'keyup' ? { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey } : e);
  });
  window.addEventListener('blur', () => { ctrlEsq = ctrlDret = false; });

  // ---------- pantalles ----------
  function mostra(n) {
    pantalla = n;
    $$('.pantalla').forEach(p => p.classList.toggle('activa', p.id === n));
    if (n === 'mapa') pintaMapa();
    so('clic', .4);
  }
  const obert = i => totsOberts || i === 0 || !!progres.fets[NIVELLS[i - 1].id];

  function pintaMapa() {
    const zones = [...new Set(NIVELLS.map(n => n.zona))];
    $('#zones').innerHTML = zones.map(z => {
      const ns = NIVELLS.map((n, i) => ({ n, i })).filter(o => o.n.zona === z);
      return `<div class="window zona-mapa"><div class="title-bar"><div class="title-bar-text">${z}</div></div><div class="window-body">` +
        ns.map(({ n, i }) => {
          const est = progres.fets[n.id] || 0;
          const petites = [1, 2, 3].map(k => `<img src="img/icones/${k <= est ? 'estrella_or' : 'estrella'}.png" class="${k <= est ? '' : 'buida'}" alt="">`).join('');
          return `<div class="nivell-icona ${obert(i) ? '' : 'bloquejat'} ${i === mapaSel ? 'triat' : ''}" data-n="${i}">
            ${n.img ? `<img class="icona" src="img/icones/${n.img}.png" alt="">` : iconaHTML(n.icona || 'X')}
            <div class="num">${i + 1}. ${n.titol}</div><div class="petites">${petites}</div></div>`;
        }).join('') + '</div></div>';
    }).join('');
    $$('.nivell-icona').forEach(el => el.addEventListener('click', () => {
      const i = +el.dataset.n; if (!obert(i)) return;
      if (mapaSel === i) comencaNivell(i); else { mapaSel = i; pintaMapa(); }
    }));
  }
  function teclaMapa(e) {
    const oberts = NIVELLS.map((_, i) => i).filter(obert);
    let k = oberts.indexOf(mapaSel); if (k < 0) k = 0;
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); mapaSel = oberts[Math.min(oberts.length - 1, k + 1)]; so('moure', .3); pintaMapa(); }
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); mapaSel = oberts[Math.max(0, k - 1)]; so('moure', .3); pintaMapa(); }
    if (e.key === 'Enter') { e.preventDefault(); comencaNivell(mapaSel); }
    if (e.key === 'Escape') { e.preventDefault(); mostra('portada'); }
  }

  // ---------- nivell ----------
  let rellotgeId = null;
  function comencaNivell(i) {
    netejaTimers(); clearInterval(rellotgeId);
    nIdx = i; L = NIVELLS[i];
    st = {}; undo = []; redo = []; clip = []; cerca = null;
    ready = false; acabat = false; errors = 0; fallades = {}; engabiats = 0; avisEscriure = false; usCtrl = 0; usCtrlEsq = 0;
    $('#terminal-linies').innerHTML = '';
    $('#m-errors').textContent = '0'; $('#m-gabia').textContent = '0';
    $('#nom-nivell').textContent = `Missió ${i + 1}: ${L.titol}`;
    $('#titol-finestra').textContent = L.finestra;
    $('#cerca').classList.add('amagat');
    $('#doc').className = 'doc' + (L.processador ? ' processador' : '');
    $$('#zona > :not(#doc)').forEach(el => el.remove());
    $('#doc').style.display = L.boss ? 'none' : '';
    if (!L.boss) {
      const r = parse(L.text);
      doc = r.d; cur = r.c0; anc = r.a0;
    } else doc = [];
    mostra('joc');
    if (document.activeElement) document.activeElement.blur();
    t0 = Date.now();
    rellotgeId = setInterval(() => {
      if (acabat) return;
      const s = Math.floor((Date.now() - t0) / 1000);
      $('#m-temps').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 500);
    L.intro.forEach((m, k) => later(() => msg(m[0], m[1] || ''), 150 + k * 700));
    pintaTasques(); pintaBarraTecles();
    if (L.inici) L.inici(st);
    assistencia('inici');
    render(); comprova();
  }

  function completa() {
    if (acabat && $('#resultat').classList.contains('amagat') === false) return;
    acabat = true; netejaTimers();
    so('nivell');
    const temps = Math.round((Date.now() - t0) / 1000);
    const est = errors === 0 ? 3 : errors <= 2 ? 2 : 1;
    const abans = progres.fets[L.id] || 0;
    progres.fets[L.id] = Math.max(abans, est); desaProgres();
    $('#res-titol').textContent = L.boss ? 'EL VIRUS REI HA CAIGUT!' : `Missió ${nIdx + 1} completada`;
    $('#res-estrelles').innerHTML = [1, 2, 3].map(k => `<img src="img/icones/${k <= est ? 'estrella_or' : 'estrella'}.png" class="${k <= est ? 'apareix' : 'buida'}" style="animation-delay:${k * .25}s" alt="">`).join('');
    const top = Object.entries(fallades).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const nomEina = e => EINES[e] ? `${EINES[e].nom} (Ctrl+${e})` : e;
    let h = `<p><b>Temps:</b> ${Math.floor(temps / 60)} min ${temps % 60} s · <b>Errors:</b> ${errors} · <b>Virus engabiats:</b> ${engabiats}</p>`;
    h += top.length ? `<p><b>On has fallat més:</b> ${top.map(([e, n]) => `${nomEina(e)} ×${n}`).join(', ')}.</p>` : '<p><b>Cap error!</b> Ets un hacker de primera.</p>';
    if (usCtrl >= 3) {
      const pc = Math.round(usCtrlEsq / usCtrl * 100);
      h += `<p><b>Postura:</b> has premut el Ctrl de l'esquerra el ${pc}% de les vegades. ${pc >= 80 ? 'Molt bé: dit petit esquerre a punt!' : 'Prova de prémer el Ctrl esquerre amb el dit petit.'}</p>`;
    }
    if (L.boss) h += '<p>L\'ordinador de l\'escola torna a estar net. Gràcies, hacker!</p>';
    $('#res-dades').innerHTML = h;
    const hiHaSeg = nIdx + 1 < NIVELLS.length;
    $('#res-seg').textContent = hiHaSeg ? 'Següent (Enter)' : 'Crèdits (Enter)';
    $('#resultat').classList.remove('amagat');
  }
  function surtAlMapa() {
    acabat = true; netejaTimers(); clearInterval(rellotgeId);
    $('#resultat').classList.add('amagat');
    mostra('mapa');
  }
  function tancaCredits() { $('#credits').classList.add('amagat'); }

  // ---------- inici ----------
  function inicia() {
    const ordre = ['A', 'C', 'X', 'V', 'Z', 'S', 'F', 'P', 'B', 'I', 'U'];
    $('#caixa-eines').innerHTML = ordre.map(e => `<div class="eina">${iconaHTML(e)}<span class="nom">${EINES[e].nom} <small>· ${EINES[e].fa}</small></span><span class="tecles-eina">${tecles(['Ctrl', e])}</span></div>`).join('') +
      `<div class="eina"><span class="icona-lletra">→</span><span class="nom">Moure't pel text</span><span class="tecles-eina">${tecla('Ctrl')} / ${tecla('Shift')} + fletxes</span></div>`;
    $('#b-comenca').onclick = () => mostra('mapa');
    $('#b-credits').onclick = () => $('#credits').classList.remove('amagat');
    $('#b-tanca-credits').onclick = tancaCredits;
    $('#b-portada').onclick = () => mostra('portada');
    $('#b-mapa').onclick = surtAlMapa;
    $('#b-so').onclick = () => { soActiu = !soActiu; $('#b-so').textContent = 'So: ' + (soActiu ? 'sí' : 'no'); };
    $('#res-seg').onclick = () => {
      $('#resultat').classList.add('amagat');
      if (nIdx + 1 < NIVELLS.length) { mapaSel = nIdx + 1; comencaNivell(nIdx + 1); }
      else { mostra('mapa'); $('#credits').classList.remove('amagat'); }
    };
    $('#res-mapa').onclick = () => { $('#resultat').classList.add('amagat'); surtAlMapa(); };
    // res de ratolí dins del document
    $('#zona').addEventListener('mousedown', e => { e.preventDefault(); avis('Res de ratolí! Un hacker ho fa tot amb el teclat.'); });
    setInterval(() => document.body.classList.toggle('f1'), 380);
    const primer = NIVELLS.findIndex((n, i) => obert(i) && !progres.fets[n.id]);
    mapaSel = primer < 0 ? 0 : primer;
  }

  return {
    inicia, msg, avis, error, so, later, cancel, compte, slime, posDe, cap_a_gabia, engabia, efecte, einaVoladora,
    pushUndo, render, comprova, completa, textOK, plain, norm, iconaHTML,
    get doc() { return doc; }, set doc(d) { doc = d; },
    get cur() { return cur; }, set cur(c) { cur = c; },
    get anc() { return anc; }, set anc(a) { anc = a; },
    get acabat() { return acabat; }, get ready() { return ready; },
    zona: () => $('#zona'),
    fallada: e => { fallades[e] = (fallades[e] || 0) + 1; },
    EINES,
  };
})();
