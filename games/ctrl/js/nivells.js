/* Ctrl+Virus — missions
   Marques del text inicial:
   |  cursor     ‹ › selecció     [_] forat     {v:PARAULA} paraula infectada
   {h:CODI} virus invisible (es troba amb Ctrl+F)     {g:paraula} paraula brossa     ¤ virus d'una sola lletra
   Colors dels virus: 0 verd, 1 lila, 2 groc, 3 vermell, 4 blau */

const Z1 = '1. Bloc de notes';
const Z2 = '2. Moure\'s pel text';
const Z3 = '3. Processador de textos';
const Z4 = '4. Nucli del sistema';

// ---------- ajudes per a les missions ----------
function eixam(st, n) {
  const z = J.zona(); const w = z.clientWidth, h = z.clientHeight;
  st.eixam = [];
  for (let k = 0; k < n; k++) {
    const el = J.slime(k % 5, 'eixam');
    el.style.left = (30 + Math.random() * (w - 120)) + 'px';
    el.style.top = (30 + Math.random() * (h - 110)) + 'px';
    el.style.width = (36 + Math.random() * 26) + 'px';
    el.style.animationDelay = (-Math.random() * 3) + 's';
    el.style.animationDuration = (2 + Math.random() * 2) + 's';
    st.eixam.push(el);
  }
}
function llancaXarxa(st) {
  const z = J.zona();
  const x = document.createElement('img'); x.src = 'img/icones/xarxa.png'; x.className = 'xarxa-gran';
  z.appendChild(x); setTimeout(() => x.remove(), 1100);
  const els = st.eixam; st.eixam = [];
  J.engabia(els.length, []);
  setTimeout(() => els.forEach((el, k) => setTimeout(() => { el.classList.remove('eixam'); J.cap_a_gabia(el); }, k * 40)), 550);
}

const CONCEPTES = { C: 'Copiar', X: 'Retallar', V: 'Enganxar', Z: 'Desfer', A: 'Seleccionar-ho tot', S: 'Desar', F: 'Cercar', P: 'Imprimir', B: 'Negreta', I: 'Cursiva', U: 'Subratllat' };

const NIVELLS = [
  // ===================== ZONA 1 =====================
  {
    id: 'plaga', zona: Z1, titol: 'La plaga', color: 0, finestra: 'Bloc de notes - informe.txt', pistes: 'tecles', final: 'S', icona: 'A',
    intro: [['ALERTA: un eixam de virus ha entrat al bloc de notes!', 'virus'], ['Són massa per caçar-los d\'un en un.'], ['Llança la xarxa, que ho atrapa tot: Ctrl+A.']],
    text: '|INFORME SECRET DE L\'ESCOLA\n\nAquest ordinador guarda els treballs de tota la classe.\nSi el perdem, haurem de tornar a escriure-ho tot!',
    objectiu: 'INFORME SECRET DE L\'ESCOLA\n\nAquest ordinador guarda els treballs de tota la classe.\nSi el perdem, haurem de tornar a escriure-ho tot!',
    tasques: [{ e: 'A', txt: 'Llança la xarxa i atrapa tot l\'eixam' }],
    inici(st) { eixam(st, 14); J.so('virus'); },
    accio(t, st) { if (t === 'A' && st.eixam.length) { llancaXarxa(st); J.msg('Eixam atrapat! La xarxa selecciona tot el document.', 'be'); } },
    extra: st => !st.eixam.length,
  },
  {
    id: 'esborrall', zona: Z1, titol: 'L\'Esborrall', color: 3, finestra: 'Bloc de notes - llista.txt', pistes: 'tecles', final: 'S', icona: 'Z',
    intro: [['El virus Esborrall es menja línies senceres!', 'virus'], ['Quan en faci desaparèixer una, tira el rellotge enrere: Ctrl+Z.'], ['Has de ser ràpid: tens 6 segons.']],
    text: '|Llista de material per a l\'excursió:\nL\'Aina porta el projector.\nEn Pau porta els cables.\nLa Jana porta les piles.\nEn Marc porta la memòria USB.',
    objectiu: 'Llista de material per a l\'excursió:\nL\'Aina porta el projector.\nEn Pau porta els cables.\nLa Jana porta les piles.\nEn Marc porta la memòria USB.',
    tasques: [{ e: 'Z', txt: 'Desfés el mal que faci l\'Esborrall (3 atacs)' }],
    inici(st) {
      st.atacs = 0; st.actiu = false; st.usades = [];
      st.ataca = () => {
        const linies = J.plain().split('\n');
        const opcions = [1, 2, 3, 4].filter(k => !st.usades.includes(k));
        const n = opcions[Math.floor(Math.random() * opcions.length)]; st.usades.push(n);
        let a = 0; for (let k = 0; k < n; k++) a += linies[k].length + 1;
        const p = J.posDe(a);
        st.el = J.slime(3); st.el.style.left = Math.max(4, p.x + 6) + 'px'; st.el.style.top = (p.y - 34) + 'px';
        J.so('virus');
        J.later(() => {
          J.pushUndo();
          J.doc.splice(a, linies[n].length);
          J.cur = a; J.anc = null;
          J.efecte('infectat'); J.so('virus2');
          J.msg('L\'Esborrall s\'ha menjat una línia!', 'virus');
          st.actiu = true; st.tard = false;
          st.tancaCompte = J.compte(6, () => { st.tard = true; J.error('Z', 'Massa tard! Però encara ho pots desfer amb Ctrl+Z.'); });
          J.render(); J.comprova();
        }, 900);
      };
      J.later(st.ataca, 3000);
    },
    accio(t, st) {
      if (t === 'Z' && st.actiu && J.textOK()) {
        st.actiu = false; st.atacs++;
        if (st.tancaCompte) st.tancaCompte();
        const el = st.el; el.style.transition = 'all .6s'; el.style.transform = 'rotate(540deg) scale(.2)'; el.style.opacity = '0'; setTimeout(() => el.remove(), 650);
        if (st.atacs < 3) { J.msg(st.tard ? 'Línia recuperada.' : 'Rebobinat a temps! La línia ha tornat.', 'be'); J.later(st.ataca, 2500); }
        else J.msg('L\'Esborrall s\'ha rendit i ha fugit!', 'be');
      }
    },
    extra: st => st.atacs >= 3,
  },
  {
    id: 'forats', zona: Z1, titol: 'Forats', color: 1, finestra: 'Bloc de notes - virus.txt', pistes: 'tecles', final: 'S', icona: 'C', autoForat: true,
    intro: [['El virus Lila s\'ha menjat paraules i ha deixat forats.', 'virus'], ['Copia la paraula seleccionada amb la fotocopiadora: Ctrl+C.'], ['Després omple cada forat amb el pot de cola: Ctrl+V. El cursor ja salta sol al forat.']],
    text: 'Paraula perduda: ‹virus›\nUn [_] és un programa dolent.\nAquest [_] es copia sol.\nCap [_] no podrà amb nosaltres!',
    objectiu: 'Paraula perduda: virus\nUn virus és un programa dolent.\nAquest virus es copia sol.\nCap virus no podrà amb nosaltres!',
    tasques: [{ e: 'C', txt: 'Copia la paraula seleccionada' }, { e: 'V', txt: 'Enganxa-la a cada forat (3)' }],
  },
  {
    id: 'gabia', zona: Z1, titol: 'Engabia\'ls', color: 2, finestra: 'Bloc de notes - notes.txt', pistes: 'tecles', final: 'S', icona: 'X', autoVirus: true,
    intro: [['Virus Groc detectat dins de les paraules!', 'virus'], ['Les tisores (Ctrl+X) els retallen i els tanquen a la gàbia.'], ['Cada virus ja està seleccionat. Retalla\'ls tots.']],
    text: 'Els {v:GLOP} ordinadors de l\'escola {v:BLURP} funcionen molt bé.\nAvui farem {v:XAFF} un treball {v:ÑIC} de ciències.',
    objectiu: 'Els ordinadors de l\'escola funcionen molt bé.\nAvui farem un treball de ciències.',
    tasques: [{ e: 'X', txt: 'Retalla i engabia cada virus (4)' }],
  },
  {
    id: 'ordre', img: 'blocnotes', zona: Z1, titol: 'Ordre!', color: 4, finestra: 'Bloc de notes - passos.txt', pistes: 'tecles', final: 'S', icona: 'V', permetTallar: true,
    passos: [
      { sel: '3. Escriu la contrasenya.\n', abans: '4. Obre el navegador.', ok: '2. Tria el teu usuari.\n3. Escriu la contrasenya.\n4.' },
      { sel: '6. Desa la feina.\n', abans: null, ok: '5. Fes el treball.\n6. Desa la feina.' },
    ],
    intro: [['El virus Blau ha barrejat els passos!', 'virus'], ['Retalla la línia seleccionada (Ctrl+X): el cursor anirà al lloc on toca.'], ['Allà, enganxa-la amb Ctrl+V. Quan estigui ordenat, desa amb Ctrl+S.']],
    text: 'Passos per fer un treball a l\'ordinador:\n1. Obre l\'ordinador.\n3. Escriu la contrasenya.\n2. Tria el teu usuari.\n4. Obre el navegador.\n6. Desa la feina.\n5. Fes el treball.\n',
    objectiu: 'Passos per fer un treball a l\'ordinador:\n1. Obre l\'ordinador.\n2. Tria el teu usuari.\n3. Escriu la contrasenya.\n4. Obre el navegador.\n5. Fes el treball.\n6. Desa la feina.',
    tasques: [{ e: 'X', txt: 'Retalla la línia mal posada' }, { e: 'V', txt: 'Enganxa-la al seu lloc' }],
    inici() { J.efecte('infectat'); },
  },

  // ===================== ZONA 2 =====================
  {
    id: 'salts', img: 'terminal', zona: Z2, titol: 'Salta paraules', color: 0, finestra: 'Bloc de notes - consells.txt', pistes: 'tecles', final: 'S', icona: 'X',
    intro: [['Ara els virus no surten seleccionats. Els hauràs de caçar tu.', 'virus'], ['Ctrl + fletxa salta d\'una paraula a l\'altra.'], ['Afegeix-hi Shift per seleccionar paraules senceres i retalla-les.']],
    text: '|La mecanografia {v:GRRR} ens ajuda a escriure {v:MIAM} més ràpid.\nCal posar els dits {v:PLOF} a la fila central.',
    objectiu: 'La mecanografia ens ajuda a escriure més ràpid.\nCal posar els dits a la fila central.',
    tasques: [
      { tecles: ['Ctrl', '→'], txt: 'Salta paraula a paraula fins al virus' },
      { tecles: ['Ctrl', 'Shift', '→'], txt: 'Selecciona la paraula infectada' },
      { e: 'X', txt: 'Engabia-la (3 virus)' },
    ],
  },
  {
    id: 'lletres', img: 'lletra', zona: Z2, titol: 'Lletra a lletra', color: 1, finestra: 'Bloc de notes - ordinador.txt', pistes: 'tecles', final: 'S', icona: 'X',
    intro: [['Virus diminuts amagats entre les lletres!', 'virus'], ['Posa el cursor just al costat del virus.'], ['Shift + fletxa selecciona una sola lletra. Després, tisores.']],
    text: '|L\'ordi¤nador té un tecla¤t i una pan¤talla.\nEl rato¤lí avui descansa.',
    objectiu: 'L\'ordinador té un teclat i una pantalla.\nEl ratolí avui descansa.',
    tasques: [
      { tecles: ['Ctrl', '→'], txt: 'Apropa\'t ràpid al virus' },
      { tecles: ['Shift', '→'], txt: 'Selecciona només el virus' },
      { e: 'X', txt: 'Engabia\'l (4 virus)' },
    ],
  },
  {
    id: 'brossa', img: 'goma', zona: Z2, titol: 'Paraules brossa', color: 2, finestra: 'Bloc de notes - diari.txt', pistes: 'tecles', final: 'S', icona: 'Z',
    intro: [['El virus Groc ha escopit paraules brossa pel text.', 'virus'], ['La brossa no és un virus: es pot esborrar.'], ['Posa el cursor just després de la brossa i prem Ctrl + Retrocés: esborra la paraula sencera.']],
    text: '|Avui {g:blablà} hem après {g:patatum} a fer servir {g:nyeee} les dreceres de teclat.\nSón {g:xof} molt útils!',
    objectiu: 'Avui hem après a fer servir les dreceres de teclat.\nSón molt útils!',
    tasques: [
      { tecles: ['Ctrl', '→'], txt: 'Salta fins al final de la brossa' },
      { tecles: ['Ctrl', 'Retrocés'], txt: 'Esborra la paraula brossa (4)' },
    ],
  },
  {
    id: 'barreja', img: 'document', zona: Z2, titol: 'Frases barrejades', color: 4, finestra: 'Bloc de notes - impressora.txt', pistes: 'tecles', final: 'S', icona: 'V', permetTallar: true,
    intro: [['El virus Blau ha tornat a barrejar frases!', 'virus'], ['Des del principi d\'una línia, Shift + ↓ selecciona la línia sencera.'], ['Retalla-la, mou el cursor amb les fletxes i enganxa-la on toca.']],
    text: '|Com fer servir la impressora:\nDesprés, prem el botó verd.\nPrimer, connecta el cable.\nTot seguit, posa-hi paper.\nAl final, prem imprimir.\nLlavors, tria el document.\n',
    objectiu: 'Com fer servir la impressora:\nPrimer, connecta el cable.\nDesprés, prem el botó verd.\nTot seguit, posa-hi paper.\nLlavors, tria el document.\nAl final, prem imprimir.',
    tasques: [
      { tecles: ['↓'], txt: 'Baixa fins a la línia mal posada' },
      { tecles: ['Shift', '↓'], txt: 'Selecciona la línia sencera' },
      { e: 'X', txt: 'Retalla-la' },
      { e: 'V', txt: 'Enganxa-la al seu lloc' },
    ],
    inici() { J.efecte('infectat'); },
  },

  // ===================== ZONA 3 =====================
  {
    id: 'format', zona: Z3, titol: 'Descolorit', color: 1, finestra: 'Processador de textos - normes.doc', pistes: 'icones', final: 'S', processador: true, icona: 'B',
    intro: [['El virus Descolorit ha esborrat tot el format!', 'virus'], ['Les paraules marcades indiquen quin format necessiten: B, I o U.'], ['Selecciona cada tros i torna-li el format. Si t\'equivoques, repeteix la drecera i el format es treu.']],
    text: '|NORMES DE L\'AULA D\'INFORMÀTICA\nNo mengis mai davant de l\'ordinador.\nDesa sempre la feina abans de plegar.\nLa contrasenya és secreta.',
    objectiu: 'NORMES DE L\'AULA D\'INFORMÀTICA\nNo mengis mai davant de l\'ordinador.\nDesa sempre la feina abans de plegar.\nLa contrasenya és secreta.',
    formats: [
      { text: 'NORMES DE L\'AULA D\'INFORMÀTICA', attr: 'b' },
      { text: 'mai', attr: 'u' },
      { text: 'sempre', attr: 'i' },
      { text: 'secreta', attr: 'b' },
    ],
    tasques: [
      { tecles: ['Ctrl', 'Shift', '→'], txt: 'Selecciona la paraula' },
      { e: 'B', txt: 'Negreta' }, { e: 'I', txt: 'Cursiva' }, { e: 'U', txt: 'Subratllat' },
    ],
    inici(st) { st.el = J.slime(1); st.el.style.right = '20px'; st.el.style.bottom = '20px'; st.el.style.width = '90px'; },
    accio(t, st) {
      setTimeout(() => {
        if (J.ready && st.el) { const el = st.el; st.el = null; el.style.transition = 'all .8s'; el.style.transform = 'translateY(-400px) rotate(200deg)'; el.style.opacity = '0'; J.msg('Format recuperat! El Descolorit fuig.', 'be'); }
      }, 60);
    },
  },
  {
    id: 'amagats', zona: Z3, titol: 'Virus invisibles', color: 0, finestra: 'Processador de textos - internet.doc', pistes: 'icones', final: 'S', processador: true, icona: 'F',
    intro: [['L\'escàner detecta 3 virus invisibles: K7Q, Z3X i B9W.', 'virus'], ['Eina nova: la lupa (Ctrl+F). Escriu el codi del virus i prem Enter.'], ['Quan aparegui, ja estarà seleccionat: engabia\'l.']],
    text: '|Consells per navegar segurs:\nNo diguis mai la teva contrasenya {h:K7Q} a ningú.\nSi una pàgina et fa por, tanca-la i avisa un adult.\nNo descarreguis {h:Z3X} programes sense permís.\nPensa abans de publicar {h:B9W} una foto.',
    objectiu: 'Consells per navegar segurs:\nNo diguis mai la teva contrasenya a ningú.\nSi una pàgina et fa por, tanca-la i avisa un adult.\nNo descarreguis programes sense permís.\nPensa abans de publicar una foto.',
    tasques: [{ e: 'F', txt: 'Cerca els codis <b>K7Q</b>, <b>Z3X</b> i <b>B9W</b> (escriu-ne un i prem Enter)' }, { e: 'X', txt: 'Engabia cada virus que trobis (3)' }],
  },
  {
    id: 'lladre', zona: Z3, titol: 'El lladre de fitxers', color: 3, finestra: 'Processador de textos - vacuna.doc', pistes: 'icones', final: 'P', processador: true, icona: 'S', extraS: true,
    intro: [['Estàs escrivint la vacuna antivirus… i el virus Lladre la vol robar!', 'virus'], ['Cada vegada que s\'acosti, desa el document (disquet): queda tancat a la caixa forta.'], ['Engabia també els virus del text. Al final, imprimeix la vacuna.']],
    text: '|VACUNA ANTIVIRUS 1.0\nIngredient 1: dreceres {v:GRUNY} de teclat.\nIngredient 2: dits {v:BLEC} a la fila central.\nIngredient 3: molta paciència.',
    objectiu: 'VACUNA ANTIVIRUS 1.0\nIngredient 1: dreceres de teclat.\nIngredient 2: dits a la fila central.\nIngredient 3: molta paciència.',
    tasques: [{ e: 'S', txt: 'Desa quan s\'acosti el Lladre (3 vegades)' }, { e: 'X', txt: 'Engabia els virus del text (2)' }],
    inici(st) {
      st.rep = 0;
      st.ve = () => {
        const z = J.zona();
        const el = J.slime(3); el.style.width = '80px';
        el.style.left = (z.clientWidth - 90) + 'px'; el.style.top = (z.clientHeight - 110) + 'px';
        const et = document.createElement('div'); et.className = 'etiqueta-slime'; et.textContent = 'LLADRE'; el.appendChild(et);
        st.lladre = el; J.so('virus');
        J.msg('Ve el Lladre! Desa ràpid!', 'virus');
        requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = 'left 7s linear'; el.style.left = '10px'; }));
        st.robat = J.later(() => {
          J.error('S', 'El Lladre s\'ha endut una còpia de la vacuna! Desa abans que arribi.');
          el.style.transition = 'all .5s'; el.style.top = '-120px'; setTimeout(() => el.remove(), 600);
          st.lladre = null; J.later(st.ve, 3500);
        }, 7000);
      };
      J.later(st.ve, 3500);
    },
    accio(t, st) {
      if (t === 'S') {
        if (st.lladre) {
          J.cancel(st.robat);
          const z = J.zona(); const img = document.createElement('img'); img.src = 'img/icones/caixaforta.png'; img.className = 'caixa-forta'; z.appendChild(img); setTimeout(() => img.remove(), 1000);
          const el = st.lladre; st.lladre = null;
          el.style.transition = 'all .6s ease-out'; el.style.left = (z.clientWidth + 100) + 'px'; el.style.transform = 'rotate(360deg)';
          setTimeout(() => el.remove(), 650);
          st.rep++;
          if (st.rep < 3) { J.msg(`Vacuna tancada a la caixa forta! (${st.rep}/3)`, 'be'); J.later(st.ve, 4500); }
          else J.msg('El Lladre s\'ha rendit!', 'be');
        } else J.msg(J.textOK() ? 'Document desat.' : 'Desat. Però encara hi ha virus al text!', J.textOK() ? '' : 'alerta');
      }
    },
    extra: st => st.rep >= 3,
  },

  // ===================== ZONA 4: BOSS =====================
  {
    id: 'rei', img: 'bitxo', zona: Z4, titol: 'El Virus Rei', color: 3, finestra: 'C:\\SISTEMA\\NUCLI.EXE', pistes: 'res', final: null,
    intro: [['Has arribat al nucli del sistema. Aquí viu el Virus Rei.', 'virus'], ['El seu escut mostra una eina i què fa. Fes servir la drecera d\'aquella eina per trencar-lo.'], ['Aquí no hi ha pistes de tecles. Demostra que ets un hacker de veritat!']],
    tasques: [{ txt: 'Trenca els 12 escuts del Virus Rei', icona: 'bitxo' }],
    boss: {
      tecla(l, st) {
        if (st.mort) return;
        if (l === st.escut) {
          st.vida--; st.cops++;
          J.so('engabiat'); J.einaVoladora(l);
          const e = document.querySelector('.arena .escut'); e.classList.add('trenca');
          const r = document.querySelector('.arena .rei'); r.classList.remove('cop'); void r.offsetWidth; r.classList.add('cop');
          st.pinta();
          if (st.vida <= 0) {
            st.mort = true; J.so('nivell');
            J.msg('El Virus Rei s\'ha desfet en mil bocins!', 'be');
            r.style.transition = 'all 1s'; r.style.transform = 'scale(0) rotate(720deg)';
            setTimeout(() => J.completa(), 1300);
          } else setTimeout(() => st.nou(), 350);
        } else if (J.EINES[l]) {
          J.error(st.escut, `Aquesta eina no trenca l'escut. Mira bé la icona!`);
        } else J.avis('Aquesta drecera no és cap eina de la caixa.');
      },
    },
    inici(st) {
      const z = J.zona();
      const a = document.createElement('div'); a.className = 'arena';
      a.innerHTML = `<div class="vida"></div><div class="slime rei" style="--c:3"><img class="corona" src="img/icones/bitxo.png" alt=""></div><div class="escut"></div><div class="concepte"></div><div class="temps"><div></div></div>`;
      z.appendChild(a);
      st.vida = 12; st.cops = 0; st.mort = false; st.escut = null;
      const eines = ['C', 'X', 'V', 'Z', 'A', 'S', 'F', 'P', 'B', 'I', 'U'];
      let color = 3;
      st.pinta = () => { a.querySelector('.vida').innerHTML = Array.from({ length: 12 }, (_, k) => `<i class="${k < st.vida ? '' : 'buit'}"></i>`).join(''); };
      st.nou = () => {
        if (st.mort) return;
        let e; do { e = eines[Math.floor(Math.random() * eines.length)]; } while (e === st.escut);
        st.escut = e;
        color = (color + 1) % 5; a.querySelector('.rei').style.setProperty('--c', color);
        const esc = a.querySelector('.escut'); esc.classList.remove('trenca'); esc.innerHTML = J.iconaHTML(e);
        a.querySelector('.concepte').textContent = CONCEPTES[e];
        st.durada = Math.max(3, 7 - st.cops * 0.35) * 1000; st.ini = Date.now();
        const id = ++st.torn;
        const bucle = () => {
          if (st.mort || id !== st.torn) return;
          const r = 1 - (Date.now() - st.ini) / st.durada;
          a.querySelector('.temps div').style.width = Math.max(0, r * 100) + '%';
          if (r <= 0) { J.error(st.escut, 'L\'escut ha aguantat i el Virus Rei t\'ha atacat!'); J.efecte('infectat'); st.nou(); return; }
          J.later(bucle, 80);
        };
        bucle();
      };
      st.torn = 0;
      st.pinta();
      J.later(st.nou, 2400);
    },
  },
];
