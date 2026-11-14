'use strict';
// =====================================================================
//  ARTE DO JOGO — tudo em pixel art desenhado por código (sem imagens
//  externas). Personagem baseado no Matheus: chapéu de palha, camisa
//  colorida (amarelo / vermelho / azul, as cores do banner do canal).
// =====================================================================
window.ART = (() => {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const rng = (seed) => () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const BASE = {
    k: '#1a1020', h: '#ffcf3a', H: '#e0891c', b: '#d8342c', d: '#3a2418', s: '#f2b27c', S: '#c9824f',
    r: '#e8402e', y: '#ffd23f', u: '#2f7bff', w: '#ffffff', p: '#2b3486', P: '#1a1f55', n: '#6b3a1e',
    v: '#8a3ad6', V: '#4e1d8c', g: '#b3b9d1', G: '#6b7190', R: '#ff3b3b', c: '#e8402e', C: '#9c2318',
    Y: '#d99a00', L: '#3bd16f', o: '#ff9f1c', e: '#2fe0ff', m: '#ff5ab4',
  };

  function fromRows(rows, pal, w) {
    w = w || Math.max(...rows.map((r) => r.length));
    const c = mk(w, rows.length), x = c.getContext('2d');
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < w; i++) {
        const ch = row[i];
        if (!ch || ch === '.') continue;
        const col = pal[ch];
        if (!col) continue;
        x.fillStyle = col; x.fillRect(i, j, 1, 1);
      }
    }
    return c;
  }
  function flipX(src) {
    const c = mk(src.width, src.height), x = c.getContext('2d');
    x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0);
    return c;
  }
  const both = (c) => ({ r: c, l: flipX(c) });
  const pad = (rows, total) => [...Array(Math.max(0, total - rows.length)).fill(''), ...rows];

  // ------------------------------------------------------------------ HERÓI
  const HEAD_S = [
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhhk...',
    '...kbbbbbbbbk...',
    '.kkhhhhhhhhhhkk.',
    'kHHHHHHHHHHHHHHk',
    '.kkddsssskssk...',
    '..kdsssssskssk..',
    '...kkSsssssk....',
  ];
  const BODY_S = [
    '..kuyyrryyuk....',
    '..kuyyrryyuksk..',
    '..krruuyyrrk....',
  ];
  const BODY_S_JUMP = [
    '..kuyyrryyukssk.',
    '..kuyyrryyukk...',
    '..krruuyyrrk....',
  ];
  const LEGS_S = {
    idle: ['..kppppppppk....', '..kpppkkpppk....', '..knnnk.knnnk...', '..kkkkk.kkkkk...'],
    walkA: ['..kppppppppk....', '.kpppk..kpppk...', 'knnnk....knnnk..', 'kkkkk....kkkkk..'],
    walkB: ['..kppppppppk....', '...kppppppk.....', '...knnnnnnk.....', '...kkkkkkkk.....'],
    jump: ['..kppppppppk....', '..kpppk.kpppppk.', '.knnnk...knnnk..', '.kkkk....kkkk...'],
  };
  const DIE = [
    '....kkkkkkkk....',
    '...khhhhhhhhk...',
    '..khhhhhhhhhhk..',
    '..kbbbbbbbbbbk..',
    'kkhhhhhhhhhhhhkk',
    'kHHHHHHHHHHHHHHk',
    'skkddssssssddkks',
    'sk.dskksskksd.ks',
    'sk.dssssssssd.ks',
    '.sk.kSskkSsk.ks.',
    '..kkuyyrryyukk..',
    '...kuyyrryyuk...',
    '...krruuyyrrk...',
    '...kppppppppk...',
    '..knnnk..knnnk..',
    '..kkkkk..kkkkk..',
  ];
  const HEAD_B = [
    '.....kkkkkk.....',
    '....khhhhhhk....',
    '...khhhhhhhhk...',
    '..khhhhhhhhhhk..',
    '..kbbbbbbbbbbk..',
    '.kkhhhhhhhhhhkk.',
    'kHHHHHHHHHHHHHHk',
    '.kkkddddddddkk..',
    '..kddsssskssk...',
    '..kdssssskssk...',
    '..kdssssssssSk..',
    '..kdsssssskSk...',
    '...kkSssssk.....',
  ];
  const TORSO_B = [
    '..kkuuyyrryykk..',
    '.kuuuyyrrryyuuk.',
    '.kuuyyyrrryyyuk.',
    '.kurryyyuuyyrrk.',
    '.kkrryyuuuyyrkk.',
    '.ksrrryuuuyrrrsk',
    '.kssyyrruurryssk',
    '..kkyyrruurrkk..',
    '..kPPPPPPPPPPk..',
    '..kppppppppppk..',
  ];
  const TORSO_B_JUMP = [
    '..kkuuyyrryykkss',
    '.kuuuyyrrryyuksk',
    '.kuuyyyrrryyykk.',
    '.kurryyyuuyyrrk.',
    '.kkrryyuuuyyrrk.',
    '.ksrrryuuuyrrrk.',
    '.kssyyrruurryyk.',
    '..kkyyrruurrkk..',
    '..kPPPPPPPPPPk..',
    '..kppppppppppk..',
  ];
  const LEGS_B = {
    idle: ['..kppppppppppk..', '..kppppkkppppk..', '..kppppk.kpppk..', '..kpppk..kpppk..', '..kpppk..kpppk..', '..kpppk..kpppk..', '.knnnnk..knnnnk.', '.knnnnk..knnnnk.', '.kkkkkk..kkkkkk.'],
    walkA: ['..kppppppppppk..', '.kpppppkkppppk..', '.kppppk..kppppk.', 'kppppk....kpppk.', 'kpppk......kppk.', 'kpppk......kppk.', 'knnnk.....knnnk.', 'knnnk.....knnnk.', 'kkkkk.....kkkkk.'],
    walkB: ['..kppppppppppk..', '...kppppppppk...', '...kpppppppk....', '....kppppppk....', '....kpppppk.....', '....kpppppk.....', '...knnnnnnk.....', '...knnnnnnk.....', '...kkkkkkkk.....'],
    jump: ['..kppppppppppk..', '..kppppkkpppppk.', '..kpppk..kppppk.', '.kpppk....kpppk.', '.kpppk.....kpppk', 'knnnk......knnnk', 'knnnk......knnnk', 'kkkkk......kkkkk', '................'],
  };

  const HERO_PALS = {
    n: {},
    cd: { r: '#ffffff', y: '#ff8a3d', u: '#9b4dff', b: '#9b4dff', p: '#3a1f6e', P: '#24104a' },
    s0: { h: '#ff5ab4', H: '#b0249a', b: '#ffffff', r: '#ffffff', y: '#ff5ab4', u: '#ffe14f', p: '#b0249a', P: '#6a0f5c' },
    s1: { h: '#5ff3ff', H: '#1aa0c0', b: '#ffffff', r: '#ffffff', y: '#5ff3ff', u: '#ff5ab4', p: '#1a6aa0', P: '#0f3a6a' },
    s2: { h: '#a6ff5a', H: '#4cb020', b: '#ffffff', r: '#ffffff', y: '#a6ff5a', u: '#2f7bff', p: '#2a7a20', P: '#164a10' },
    s3: { h: '#ffffff', H: '#ffb02e', b: '#e8402e', r: '#ffd23f', y: '#ffffff', u: '#e8402e', p: '#e8402e', P: '#9c2318' },
  };
  const HERO = {};
  for (const [name, over] of Object.entries(HERO_PALS)) {
    const pal = { ...BASE, ...over };
    const s = {}, b = {};
    for (const f of ['idle', 'walkA', 'walkB', 'jump']) {
      s[f] = both(fromRows([...HEAD_S, ...(f === 'jump' ? BODY_S_JUMP : BODY_S), ...LEGS_S[f]], pal, 16));
      b[f] = both(fromRows([...HEAD_B, ...(f === 'jump' ? TORSO_B_JUMP : TORSO_B), ...LEGS_B[f]], pal, 16));
    }
    s.die = both(fromRows(DIE, pal, 16));
    HERO[name] = { s, b };
  }

  // -------------------------------------------------------------- INIMIGOS
  // Bug do Lag (anda e pode ser pisado)
  const BUG_TOP = [
    '..k..........k..',
    '...k........k...',
    '....kkkkkkkk....',
    '...kvvvvvvvvk...',
    '..kvkkkvvkkkvk..',
    '.kvkwwvvvvkwwvk.',
    '.kvkkwvvvvkkwvk.',
    '.kvvvvvvvvvvvvk.',
    '.kvVvvvvvvvvVvk.',
    'kvVVVvvvvvvVVVvk',
    'kvVVVVVVVVVVVVvk',
    '.kVVVVVVVVVVVVk.',
    '..kkkkkkkkkkkk..',
  ];
  const BUG_LEGS = [
    ['..k.k..kk..k.k..', '.k..k..kk..k..k.', 'k...k......k...k'],
    ['...k.k.kk.k.k...', '...k.k.kk.k.k...', '..k..k....k..k..'],
  ];
  const BUG_FLAT = ['.kkkkkkkkkkkkkk.', 'kvkwvvvvvvkwvvvk', 'kvVVVVVVVVVVVVvk', '.kkkkkkkkkkkkkk.'];

  // Cartucho bravo (vira casco quando pisado)
  const CART_TOP = [
    '..kkkkkkkkkkkk..',
    '..kGkGkGkGkGGk..',
    '..kggggggggggk..',
    '..kgrrrrrrrrgk..',
    '..kgkkrrrrkkgk..',
    '..kgwkrrrwkrgk..',
    '..kgwwrrrwwrgk..',
    '..kgrrrrrrrrgk..',
    '..kgryyyyyyrgk..',
    '..kgrrrrrrrrgk..',
    '..kggggggggggk..',
    '..kgGgGgGgGggk..',
    '..kkkkkkkkkkkk..',
  ];
  const CART_SHELL = CART_TOP.map((r, i) => (i === 4 ? '..kgrrrrrrrrgk..' : i === 5 ? '..kgkkrrrkkrgk..' : i === 6 ? '..kgrrrrrrrrgk..' : r));
  const CART_LEGS = [
    ['...kk......kk...', '..knnk....knnk..', '..kkkk....kkkk..'],
    ['....kk....kk....', '...knnk..knnk...', '...kkkk..kkkk...'],
  ];

  // Controle voador
  const PAD = [
    '..kkkkkkkkkkkk..',
    '.kcccccccccccck.',
    'kcckckwcckwcyck.',
    'kckkkcwcckwcuyk.',
    'kcckccccccccuck.',
    'kccccCkkkkCcccck',
    'kcccck....kcccck',
    '.kkkk......kkkk.',
  ];

  // Glitch espinhento (não dá pra pisar)
  const SPIKY = [
    '...k...kk...k...',
    '...kk.kRRk.kk...',
    '....kkRRRRkk....',
    '.kk.kRRRRRRk.kk.',
    '..kkRRRRRRRRkk..',
    '...kRwwRRwwRk...',
    'kkkRRwkRRkwRRkkk',
    '..kRRRRRRRRRRk..',
    '..kRRkkkkkkRRk..',
    '.kkRRkwkwkkRRkk.',
    '...kRRRRRRRRk...',
    '..kkRRRRRRRRkk..',
    '.kk.kRRRRRRk.kk.',
    '....kkRRRRkk....',
    '...kk.kkkk.kk...',
    '...k........k...',
  ];

  const ENEMY = {
    bug: [both(fromRows([...BUG_TOP, ...BUG_LEGS[0]], BASE, 16)), both(fromRows([...BUG_TOP, ...BUG_LEGS[1]], BASE, 16))],
    bugFlat: both(fromRows(pad(BUG_FLAT, 16), BASE, 16)),
    cart: [both(fromRows([...CART_TOP, ...CART_LEGS[0]], BASE, 16)), both(fromRows([...CART_TOP, ...CART_LEGS[1]], BASE, 16))],
    shell: both(fromRows(pad(CART_SHELL, 16), BASE, 16)),
    pad: both(fromRows(PAD, BASE, 16)),
    spiky: both(fromRows(SPIKY, { ...BASE, w: '#ffffff' }, 16)),
    spikyGlitch: both(fromRows(SPIKY, { ...BASE, R: '#2fe0ff', w: '#ff5ab4' }, 16)),
  };

  // ----------------------------------------------------------------- ITENS
  const HEART = [
    '..kkkk....kkkk..',
    '.kRRRRk..kRRRRk.',
    'kRRwwRRkkRRRRRRk',
    'kRwwRRRRRRRRRRRk',
    'kRwRRRRRRRRRRRRk',
    'kRRRRRRRRRRRRRRk',
    '.kRRRRRRRRRRRRk.',
    '..kRRRRRRRRRRk..',
    '...kRRRRRRRRk...',
    '....kRRRRRRk....',
    '.....kRRRRk.....',
    '......kRRk......',
    '.......kk.......',
  ];
  const STAR = [
    '.......kk.......',
    '......kyyk......',
    '......kyyk......',
    '.....kyyyyk.....',
    'kkkkkkyyyykkkkkk',
    'kyyyyyyyyyyyyyyk',
    '.kyyykyyyykyyyk.',
    '..kyykyyyykyyk..',
    '...kyyyyyyyyk...',
    '...kyyyyyyyyk...',
    '..kyyyyyyyyyyk..',
    '..kyyyykkyyyyk..',
    '.kyyyk....kyyyk.',
    '.kyk........kyk.',
    '.kk..........kk.',
  ];
  const ITEM = {
    turbo: fromRows(pad(PAD, 15), { ...BASE, c: '#ffd23f', C: '#d99a00', y: '#e8402e', u: '#2f7bff' }, 16),
    life: fromRows(pad(HEART, 15), BASE, 16),
    star: ['#ffd23f', '#ff8fd8', '#7cf0ff', '#a6ff5a'].map((c) => fromRows(pad(STAR, 16), { ...BASE, y: c }, 16)),
    heartSmall: fromRows([
      '.kk.kk.', 'kRRkRRk', 'kRwRRRk', 'kRRRRRk', '.kRRRk.', '..kRk..', '...k...',
    ], BASE, 7),
  };

  // Ficha (moeda do jogo) girando
  function coinFrames(big) {
    const halves = [6, 4, 2, 1];
    return halves.map((a) => {
      const c = mk(16, 16), x = c.getContext('2d');
      const ry = big ? 7 : 6, cy = 8;
      for (let yy = -ry; yy <= ry; yy++) {
        const e = Math.max(a === 1 ? 1 : 0, Math.round(a * Math.sqrt(Math.max(0, 1 - (yy / (ry + 0.5)) ** 2))));
        x.fillStyle = '#1a1020'; x.fillRect(8 - e - 1, cy + yy, e * 2 + 2, 1);
      }
      x.fillRect(8 - 1, cy - ry - 1, 2, 1); x.fillRect(8 - 1, cy + ry + 1, 2, 1);
      for (let yy = -ry + 1; yy <= ry - 1; yy++) {
        const e = Math.round(a * Math.sqrt(Math.max(0, 1 - (yy / (ry + 0.5)) ** 2)));
        x.fillStyle = '#ffc531'; x.fillRect(8 - e, cy + yy, e * 2, 1);
        if (e > 1) { x.fillStyle = '#c98a00'; x.fillRect(8 + e - 1, cy + yy, 1, 1); x.fillStyle = '#fff3b0'; x.fillRect(8 - e, cy + yy, 1, 1); }
      }
      if (a >= 4) { x.fillStyle = '#c98a00'; x.fillRect(7, cy - 3, 2, 7); x.fillStyle = '#fff3b0'; x.fillRect(7, cy - 3, 1, 1); }
      if (a === 1) { x.fillStyle = '#ffc531'; x.fillRect(7, cy - ry + 1, 2, ry * 2 - 1); }
      return c;
    });
  }
  ITEM.coin = coinFrames(false);

  // Disco (power-up) e disco arremessado
  function disc(size, rot) {
    const c = mk(size, size), x = c.getContext('2d');
    const r = size / 2 - 0.5, cx = size / 2 - 0.5;
    const rainbow = ['#ff5ab4', '#ffd23f', '#7cf0ff', '#a6ff5a'];
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const dx = i - cx, dy = j - cx, d = Math.hypot(dx, dy);
      if (d > r) continue;
      let col = d > r - 1 ? '#1a1020' : '#dfe6f5';
      const ang = Math.atan2(dy, dx) + rot;
      if (d <= r - 1 && d > r * 0.45) {
        const band = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (band < 0.9) col = rainbow[Math.floor(d) % 4];
        else if (band > 3.2 && band < 3.7) col = '#ffffff';
      }
      if (d <= r * 0.32) col = d <= r * 0.16 ? '#1a1020' : '#9aa3bd';
      x.fillStyle = col; x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  ITEM.cd = disc(14, 0);
  ITEM.disc = [0, 1.57, 3.14, 4.71].map((r) => disc(9, r));

  // Bola de fogo e orb glitch
  function ball(size, cols) {
    const c = mk(size, size), x = c.getContext('2d'), cx = size / 2 - 0.5;
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      const d = Math.hypot(i - cx, j - cx);
      if (d > size / 2) continue;
      x.fillStyle = d < size * 0.18 ? cols[0] : d < size * 0.34 ? cols[1] : cols[2];
      x.fillRect(i, j, 1, 1);
    }
    return c;
  }
  ITEM.fire = [ball(8, ['#fff6b0', '#ffcf3a', '#ff5a1f']), ball(8, ['#ffffff', '#ffb02e', '#e8340f'])];
  ITEM.orb = [ball(10, ['#ffffff', '#ff5ab4', '#7a1aa0']), ball(10, ['#ffffff', '#2fe0ff', '#1a4aa0'])];

  // ----------------------------------------------------------------- TILES
  const THEMES = {
    grass: { g1: '#c66a2c', g2: '#9a4818', g3: '#e48a48', t1: '#46c84f', t2: '#2c9338', tL: '#a4f27c', br: '#d0632a', brL: '#f7a064', brD: '#8a3812', mo: '#3e1606', hd: '#c27a3e', hdL: '#f0b070', hdD: '#7a4418', semi: 'wood', style: 'dirt' },
    cave: { g1: '#3a4c88', g2: '#24315e', g3: '#5468aa', t1: '#5fd6ff', t2: '#2f8fc0', tL: '#c8f6ff', br: '#3f74d4', brL: '#7fb0ff', brD: '#1e3f8a', mo: '#0b1430', hd: '#4f62a0', hdL: '#8a9ee0', hdD: '#26336a', semi: 'wood', style: 'dirt' },
    sky: { g1: '#8a5fc4', g2: '#5f3d94', g3: '#a984e0', t1: '#7cf0c4', t2: '#3fbf92', tL: '#d4fff0', br: '#e26aa0', brL: '#ffa8cf', brD: '#9a3468', mo: '#4a1030', hd: '#b07ad8', hdL: '#dcb4ff', hdD: '#6a3c96', semi: 'cloud', style: 'dirt' },
    castle: { g1: '#4c4c62', g2: '#33334a', g3: '#6c6c86', t1: '#8a8aa6', t2: '#5c5c78', tL: '#b8b8d0', br: '#7a2c3c', brL: '#b0506a', brD: '#4a1424', mo: '#160810', hd: '#5c5c74', hdL: '#9a9ab8', hdD: '#2c2c40', semi: 'metal', style: 'stone' },
    boss: { g1: '#2c1652', g2: '#1c0c38', g3: '#45247a', t1: '#ff3bd6', t2: '#8a2ab0', tL: '#ffb0f4', br: '#5a2ea0', brL: '#8a5af0', brD: '#2e1060', mo: '#0c0420', hd: '#3a2070', hdL: '#7a50d0', hdD: '#1a0838', semi: 'metal', style: 'plate' },
  };

  const MINI = { M: ['101', '111', '111', '101', '101'], T: ['111', '010', '010', '010', '010'] };
  function miniText(x, str, px, py, col) {
    x.fillStyle = col;
    [...str].forEach((ch, n) => MINI[ch].forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') x.fillRect(px + n * 4 + i, py + j, 1, 1); })));
  }
  function crop(src, sx, sy, w, h) { const c = mk(w, h); c.getContext('2d').drawImage(src, sx, sy, w, h, 0, 0, w, h); return c; }

  const tileCache = {};
  function tiles(name) {
    if (tileCache[name]) return tileCache[name];
    const th = THEMES[name], S = {};
    const ground = (top) => {
      const c = mk(16, 16), x = c.getContext('2d');
      if (th.style === 'dirt') {
        x.fillStyle = th.g1; x.fillRect(0, 0, 16, 16);
        const r = rng(11);
        for (let i = 0; i < 9; i++) { x.fillStyle = th.g2; x.fillRect((r() * 14) | 0, (r() * 14) | 0, 2, 2); }
        for (let i = 0; i < 6; i++) { x.fillStyle = th.g3; x.fillRect((r() * 15) | 0, (r() * 15) | 0, 1, 1); }
        if (top) {
          x.fillStyle = th.t2; x.fillRect(0, 0, 16, 6);
          for (let i = 0; i < 16; i += 2) x.fillRect(i, 6, 1, i % 4 === 0 ? 2 : 1);
          x.fillStyle = th.t1; x.fillRect(0, 0, 16, 4);
          for (let i = 1; i < 16; i += 4) x.fillRect(i, 4, 2, 1);
          x.fillStyle = th.tL; x.fillRect(0, 0, 16, 1);
          for (let i = 2; i < 16; i += 5) x.fillRect(i, 1, 1, 1);
        }
      } else if (th.style === 'stone') {
        x.fillStyle = th.mo; x.fillRect(0, 0, 16, 16);
        const stone = (sx, sy, w, h) => {
          x.fillStyle = th.g1; x.fillRect(sx, sy, w, h);
          x.fillStyle = th.g3; x.fillRect(sx, sy, w, 1); x.fillRect(sx, sy, 1, h);
          x.fillStyle = th.g2; x.fillRect(sx, sy + h - 1, w, 1); x.fillRect(sx + w - 1, sy, 1, h);
        };
        stone(0, 0, 16, 8); stone(-8, 8, 16, 8); stone(8, 8, 16, 8);
        if (top) { x.fillStyle = th.t1; x.fillRect(0, 0, 16, 2); x.fillStyle = th.tL; x.fillRect(0, 0, 16, 1); }
      } else {
        x.fillStyle = th.g1; x.fillRect(0, 0, 16, 16);
        x.fillStyle = th.g3; x.fillRect(0, 0, 16, 1); x.fillRect(0, 0, 1, 16);
        x.fillStyle = th.g2; x.fillRect(0, 15, 16, 1); x.fillRect(15, 0, 1, 16);
        x.fillStyle = th.hdL; [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
        x.fillStyle = th.g2; x.fillRect(5, 7, 6, 2);
        if (top) { x.fillStyle = th.t1; x.fillRect(0, 0, 16, 2); x.fillStyle = th.tL; x.fillRect(0, 0, 16, 1); }
      }
      return c;
    };
    S.groundTop = ground(true); S.ground = ground(false);

    { // tijolo
      const c = mk(16, 16), x = c.getContext('2d');
      x.fillStyle = th.mo; x.fillRect(0, 0, 16, 16);
      for (let row = 0; row < 4; row++) {
        const off = row % 2 ? 4 : 0;
        for (let bx = -8; bx < 16; bx += 8) {
          const sx = bx + off, sy = row * 4;
          x.fillStyle = th.br; x.fillRect(sx, sy, 7, 3);
          x.fillStyle = th.brL; x.fillRect(sx, sy, 7, 1);
          x.fillStyle = th.brD; x.fillRect(sx + 6, sy + 1, 1, 2);
        }
      }
      S.brick = c;
    }
    // bloco surpresa (com ícone de "play")
    S.q = ['#ffc531', '#ffd65c', '#ffe68f'].map((base) => {
      const c = mk(16, 16), x = c.getContext('2d');
      x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#b86e00'; x.fillRect(1, 1, 14, 14);
      x.fillStyle = base; x.fillRect(1, 1, 13, 13);
      x.fillStyle = '#fff3c4'; x.fillRect(1, 1, 13, 1); x.fillRect(1, 1, 1, 13);
      x.fillStyle = '#b86e00'; [[3, 3], [12, 3], [3, 12], [12, 12]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
      for (let j = 0; j < 9; j++) {
        const w = 5 - Math.abs(j - 4);
        x.fillStyle = '#7a1a10'; x.fillRect(7, 4 + j, w, 1);
        x.fillStyle = '#e8402e'; x.fillRect(6, 3 + j, w, 1);
      }
      return c;
    });
    { // bloco usado
      const c = mk(16, 16), x = c.getContext('2d');
      x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#7a4a26'; x.fillRect(1, 1, 14, 14);
      x.fillStyle = '#9a6236'; x.fillRect(1, 1, 13, 13);
      x.fillStyle = '#5a3418'; [[3, 3], [12, 3], [3, 12], [12, 12]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
      S.used = c;
    }
    { // bloco duro
      const c = mk(16, 16), x = c.getContext('2d');
      x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = th.hd; x.fillRect(1, 1, 14, 14);
      x.fillStyle = th.hdL; x.fillRect(1, 1, 14, 2); x.fillRect(1, 1, 2, 14);
      x.fillStyle = th.hdD; x.fillRect(1, 13, 14, 2); x.fillRect(13, 1, 2, 14);
      x.fillStyle = th.hdD; x.fillRect(5, 5, 6, 1); x.fillRect(5, 5, 1, 6);
      x.fillStyle = th.hdL; x.fillRect(5, 10, 6, 1); x.fillRect(10, 5, 1, 6);
      S.hard = c;
    }
    { // base da barra de fogo
      const c = mk(16, 16), x = c.getContext('2d');
      x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#5a2418'; x.fillRect(1, 1, 14, 14);
      x.fillStyle = '#8a3a20'; x.fillRect(1, 1, 14, 1); x.fillRect(1, 1, 1, 14);
      x.fillStyle = '#ff7a2a'; x.fillRect(6, 6, 4, 4);
      S.fire = c;
    }
    { // plataforma vazada
      const c = mk(16, 16), x = c.getContext('2d');
      if (th.semi === 'wood') {
        x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 6);
        x.fillStyle = '#c98a4a'; x.fillRect(0, 1, 16, 4);
        x.fillStyle = '#f0c080'; x.fillRect(0, 1, 16, 1);
        x.fillStyle = '#7a4a20'; x.fillRect(7, 1, 1, 4); x.fillRect(15, 1, 1, 4);
        x.fillStyle = '#5a3418'; x.fillRect(2, 6, 2, 3); x.fillRect(11, 6, 2, 3);
      } else if (th.semi === 'cloud') {
        const blob = (cx, cy, r, col) => { x.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(cx - w, cy + j, w * 2, 1); } };
        blob(4, 5, 4, '#ffd6ec'); blob(12, 5, 4, '#ffd6ec');
        blob(4, 4, 4, '#ffffff'); blob(12, 4, 4, '#ffffff'); blob(8, 3, 4, '#ffffff');
        x.fillStyle = '#ffffff'; x.fillRect(0, 0, 16, 1);
      } else {
        x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 6);
        x.fillStyle = '#9aa0b8'; x.fillRect(0, 1, 16, 4);
        x.fillStyle = '#d0d4e4'; x.fillRect(0, 1, 16, 1);
        x.fillStyle = '#1a1020'; for (let i = 2; i < 16; i += 4) x.fillRect(i, 3, 2, 1);
      }
      S.semi = c;
    }
    // cartucho gigante (pilar)
    {
      const labels = ['#e8402e', '#2f7bff', '#25b35a'];
      const body = mk(32, 16), bx = body.getContext('2d');
      bx.fillStyle = '#1a1020'; bx.fillRect(0, 0, 32, 16);
      bx.fillStyle = '#8d93ad'; bx.fillRect(1, 0, 30, 16);
      bx.fillStyle = '#b9bfd6'; bx.fillRect(2, 0, 3, 16);
      bx.fillStyle = '#5f6580'; bx.fillRect(26, 0, 4, 16);
      bx.fillStyle = '#737990'; for (let gx = 9; gx < 25; gx += 4) bx.fillRect(gx, 0, 1, 16);
      S.pillarBody = [crop(body, 0, 0, 16, 16), crop(body, 16, 0, 16, 16)];
      S.pillarCap = labels.map((lab) => {
        const cap = mk(32, 16), x = cap.getContext('2d');
        x.fillStyle = '#1a1020'; x.fillRect(0, 0, 32, 16);
        x.fillStyle = '#8d93ad'; x.fillRect(1, 1, 30, 15);
        x.fillStyle = '#b9bfd6'; x.fillRect(1, 1, 30, 1); x.fillRect(2, 1, 3, 15);
        x.fillStyle = '#5f6580'; x.fillRect(26, 2, 4, 14);
        x.fillStyle = '#5f6580'; for (let gx = 6; gx < 26; gx += 3) x.fillRect(gx, 2, 1, 3);
        x.fillStyle = '#1a1020'; x.fillRect(5, 6, 22, 10);
        x.fillStyle = lab; x.fillRect(6, 7, 20, 9);
        x.fillStyle = '#ffffff'; x.fillRect(6, 7, 20, 2);
        miniText(x, 'MT', 12, 10, '#ffd23f');
        return [crop(cap, 0, 0, 16, 16), crop(cap, 16, 0, 16, 16)];
      });
    }
    { // espinhos
      const c = mk(16, 16), x = c.getContext('2d');
      for (let s = 0; s < 2; s++) {
        const ox = s * 8;
        for (let j = 0; j < 10; j++) {
          const hw = Math.ceil((j + 1) * 4 / 10);
          x.fillStyle = '#1a1020'; x.fillRect(ox + 4 - hw - 1 + 1, 4 + j, hw * 2, 1);
          if (hw > 1) {
            x.fillStyle = '#eef0f8'; x.fillRect(ox + 4 - hw + 1, 4 + j, hw - 1, 1);
            x.fillStyle = '#8a8fa8'; x.fillRect(ox + 4, 4 + j, hw - 1, 1);
          }
        }
      }
      x.fillStyle = '#4a4e66'; x.fillRect(0, 14, 16, 2);
      S.spikes = c;
    }
    { // lava animada
      S.lava = (() => {
        const c = mk(16, 16), x = c.getContext('2d');
        x.fillStyle = '#ff5a1f'; x.fillRect(0, 0, 16, 16);
        x.fillStyle = '#d8340f'; [[2, 3], [9, 6], [5, 11], [12, 13], [13, 2]].forEach(([a, b]) => x.fillRect(a, b, 2, 1));
        x.fillStyle = '#ffb02e'; [[6, 2], [11, 9], [1, 14]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
        return c;
      })();
      S.lavaTop = [0, 1, 2, 3].map((f) => {
        const c = mk(16, 16), x = c.getContext('2d');
        for (let i = 0; i < 16; i++) {
          const wy = 4 + Math.round(Math.sin(((i + f * 4) / 16) * Math.PI * 2) * 1.5);
          x.fillStyle = '#fff3a0'; x.fillRect(i, wy, 1, 1);
          x.fillStyle = '#ffcf3a'; x.fillRect(i, wy + 1, 1, 2);
          x.fillStyle = '#ff5a1f'; x.fillRect(i, wy + 3, 1, 16 - wy - 3);
        }
        x.fillStyle = '#d8340f'; x.fillRect(4, 11, 2, 1); x.fillRect(11, 13, 2, 1);
        return c;
      });
    }
    tileCache[name] = S;
    return S;
  }

  // ----------------------------------------------------------- CENÁRIOS
  function gradient(w, h, stops) {
    const c = mk(w, h), x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    return c;
  }
  function ridge(w, h, color, base, waves, fromTop) {
    const c = mk(w, h), x = c.getContext('2d');
    x.fillStyle = color;
    for (let i = 0; i < w; i++) {
      let v = base;
      waves.forEach(([a, k, ph]) => { v += a * Math.sin((i / w) * Math.PI * 2 * k + ph); });
      v = Math.max(0, Math.round(v));
      if (fromTop) x.fillRect(i, 0, 1, v); else x.fillRect(i, h - v, 1, v);
    }
    return c;
  }
  function blob(x, cx, cy, r, col) {
    x.fillStyle = col;
    for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2, 1); }
  }
  function cloud(x, cx, cy, s, main, shade) {
    blob(x, cx - 10 * s, cy + 2, 8 * s, shade); blob(x, cx + 10 * s, cy + 2, 8 * s, shade);
    blob(x, cx - 10 * s, cy, 8 * s, main); blob(x, cx + 10 * s, cy, 8 * s, main); blob(x, cx, cy - 5 * s, 11 * s, main);
  }

  const bgCache = {};
  function background(name, W, H) {
    const key = name + W + 'x' + H;
    if (bgCache[key]) return bgCache[key];
    const LW = 512;
    let layers = [], sky, extra = null;
    if (name === 'grass' || name === 'title') {
      sky = gradient(W, H, [[0, '#4fb8ff'], [1, '#c8f0ff']]);
      const far = ridge(LW, H, '#8cbde6', 78, [[16, 2, 0.3], [9, 5, 1.1], [4, 11, 2]]);
      { const x = far.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#eaf6ff'; x.fillRect(0, H - 100, LW, 10); }
      const clouds = mk(LW, H); { const x = clouds.getContext('2d'); [[40, 34, 1], [170, 58, 0.8], [290, 28, 1.1], [420, 50, 0.9]].forEach(([cx, cy, s]) => cloud(x, cx, cy, s, '#ffffff', '#d6efff')); }
      const near = ridge(LW, H, '#58c25e', 44, [[14, 3, 0.5], [7, 7, 2.0]]);
      { const x = near.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#46a84f'; for (let i = 0; i < LW; i += 12) for (let j = H - 60; j < H; j += 10) x.fillRect(i + ((j / 10) % 2) * 6, j, 2, 2); }
      layers = [[far, 0.12, 0], [clouds, 0.2, 0.15], [near, 0.35, 0]];
    } else if (name === 'cave') {
      sky = gradient(W, H, [[0, '#07061a'], [1, '#1b1446']]);
      const far = ridge(LW, H, '#15113a', 90, [[30, 4, 0.2], [14, 9, 1.4], [6, 23, 0.7]]);
      { const x = far.getContext('2d'); const r = rng(5); for (let i = 0; i < 18; i++) { const cx = (r() * LW) | 0, cy = (H - 40 - r() * 60) | 0; x.fillStyle = r() > 0.5 ? '#5fd6ff' : '#ff5ab4'; x.fillRect(cx, cy - 3, 1, 7); x.fillRect(cx - 1, cy - 1, 3, 3); x.fillStyle = '#ffffff'; x.fillRect(cx, cy, 1, 1); } }
      const stal = ridge(LW, H, '#221c52', 26, [[10, 9, 0], [9, 17, 1], [6, 31, 2]], true);
      layers = [[far, 0.15, 0], [stal, 0.3, 0]];
    } else if (name === 'sky') {
      sky = gradient(W, H, [[0, '#6a4cff'], [0.55, '#ff86c2'], [1, '#ffd27a']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d'); const cx = W * 0.72, cy = H * 0.58, r = 46;
        for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); const yy = cy + j; if (j > 8 && Math.floor((j - 8) / 5) % 2 === 1) continue; x.fillStyle = j < 0 ? '#fff2a8' : '#ffd060'; x.fillRect(Math.round(cx - w), Math.round(yy), w * 2, 1); }
      }
      const far = mk(LW, H); { const x = far.getContext('2d'); [[60, 50, 1.4], [250, 80, 1.1], [400, 40, 1.3]].forEach(([cx, cy, s]) => cloud(x, cx, cy, s, '#ffc2dc', '#f7a8cc')); }
      const isl = mk(LW, H); { const x = isl.getContext('2d'); [[90, 120, 34], [300, 100, 26], [450, 135, 20]].forEach(([cx, cy, w]) => { x.fillStyle = '#9a6ad0'; for (let j = 0; j < w; j++) { const hw = Math.round(w * (1 - j / w)); x.fillRect(cx - hw, cy + j, hw * 2, 1); } x.fillStyle = '#b48ae6'; x.fillRect(cx - w, cy - 3, w * 2, 3); }); }
      const near = ridge(LW, H, '#ffffff', 28, [[8, 5, 0.3], [5, 13, 1.1]]);
      { const x = near.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#ffd6ec'; x.fillRect(0, H - 14, LW, 14); }
      layers = [[far, 0.08, 0.05], [isl, 0.2, 0], [near, 0.4, 0]];
    } else if (name === 'castle') {
      sky = gradient(W, H, [[0, '#12050c'], [1, '#3a0d18']]);
      const wall = mk(LW, H); {
        const x = wall.getContext('2d'); x.fillStyle = '#200a14'; x.fillRect(0, 0, LW, H);
        x.fillStyle = '#2c0f1c'; for (let j = 0; j < H; j += 8) { x.fillRect(0, j, LW, 1); for (let i = (j / 8) % 2 ? 0 : 8; i < LW; i += 16) x.fillRect(i, j, 1, 8); }
        for (let wx = 40; wx < LW; wx += 128) {
          const g = x.createLinearGradient(0, 60, 0, 140); g.addColorStop(0, '#ffcf4a'); g.addColorStop(1, '#ff5a1f');
          x.fillStyle = '#0c0306'; x.fillRect(wx - 2, 58, 36, 86); x.fillStyle = g; x.fillRect(wx, 72, 32, 70);
          for (let j = 0; j < 14; j++) { const hw = Math.round(Math.sqrt(16 * 16 - (14 - j) * (14 - j) * 1.3)); x.fillRect(wx + 16 - hw, 60 + j, hw * 2, 1); }
          x.fillStyle = '#0c0306'; x.fillRect(wx + 15, 60, 2, 82); x.fillRect(wx, 100, 32, 2);
        }
      }
      const cols = mk(LW, H); {
        const x = cols.getContext('2d');
        for (let cx = 90; cx < LW; cx += 160) {
          x.fillStyle = '#14040a'; x.fillRect(cx, 0, 26, H);
          x.fillStyle = '#26101a'; x.fillRect(cx + 2, 0, 3, H);
          x.fillStyle = '#9c1a30'; x.fillRect(cx - 6, 36, 38, 54);
          for (let i = 0; i < 38; i += 2) x.fillRect(cx - 6 + i, 90, 2, (i / 2) % 2 ? 6 : 3);
          x.fillStyle = '#d4283f'; x.fillRect(cx - 6, 36, 38, 3);
          x.fillStyle = '#ffd23f'; [[5, 50, 'M'], [19, 50, 'T']].forEach(([ox, oy, ch]) => MINI[ch].forEach((row, j) => [...row].forEach((b, i) => { if (b === '1') x.fillRect(cx - 6 + ox + i * 3, oy + j * 3, 3, 3); })));
        }
      }
      layers = [[wall, 0.25, 0], [cols, 0.5, 0]];
    } else if (name === 'boss') {
      sky = gradient(W, H, [[0, '#0a0318'], [1, '#2a0a4a']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d'); const hz = 110;
        x.strokeStyle = 'rgba(255,43,214,0.35)'; x.lineWidth = 1;
        for (let i = -12; i <= 12; i++) { x.beginPath(); x.moveTo(W / 2 + i * 8, hz); x.lineTo(W / 2 + i * 48, H); x.stroke(); }
        for (let j = 0; j < 8; j++) { const yy = Math.round(hz + Math.pow(j / 8, 1.8) * (H - hz)); x.fillStyle = 'rgba(255,43,214,0.35)'; x.fillRect(0, yy, W, 1); }
        x.fillStyle = 'rgba(47,224,255,0.08)'; for (let j = 0; j < H; j += 3) x.fillRect(0, j, W, 1);
      }
    }
    const res = {
      draw(ctx, camX, t) {
        ctx.drawImage(sky, 0, 0);
        if (extra) ctx.drawImage(extra, 0, 0);
        for (const [img, f, drift] of layers) {
          let off = -Math.round((camX * f + t * drift) % LW);
          if (off > 0) off -= LW;
          for (let x = off; x < W; x += LW) ctx.drawImage(img, x, 0);
        }
        if (name === 'boss') {
          const r = rng(Math.floor(t / 6));
          for (let i = 0; i < 6; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,90,180,0.18)' : 'rgba(47,224,255,0.16)'; ctx.fillRect((r() * W) | 0, (r() * H * 0.6) | 0, (8 + r() * 60) | 0, (2 + r() * 6) | 0); }
        }
        if (name === 'cave') {
          ctx.fillStyle = 'rgba(200,246,255,0.5)';
          for (let i = 0; i < 14; i++) { const px = ((i * 97 - camX * 0.3 + t * 0.15 * ((i % 3) + 1)) % W + W) % W; const py = ((i * 53 + t * 0.2 * ((i % 2) + 1)) % H); ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
        }
        if (name === 'castle') {
          const g = ctx.createLinearGradient(0, H - 60, 0, H); g.addColorStop(0, 'rgba(255,90,31,0)'); g.addColorStop(1, 'rgba(255,90,31,0.35)');
          ctx.fillStyle = g; ctx.fillRect(0, H - 60, W, 60);
        }
      },
    };
    bgCache[key] = res;
    return res;
  }

  return { HERO, ENEMY, ITEM, tiles, background, THEMES, mk, rng };
})();
