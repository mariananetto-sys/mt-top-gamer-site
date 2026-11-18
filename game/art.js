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
    q: '#2a2a36', Q: '#4a4a5c',
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
  // camisa preta com faixas vermelha e azul (cores da logo do MGP)
  const BODY_S = [
    '..kqQrruuqqk....',
    '..kqqrruuqqksk..',
    '..kqqrruuqqk....',
  ];
  const BODY_S_JUMP = [
    '..kqQrruuqqkssk.',
    '..kqqrruuqqkk...',
    '..kqqrruuqqk....',
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
    '..kkqqrruuqqkk..',
    '...kqqrruuqqk...',
    '...kqqrruuqqk...',
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
    '..kkqqqqqqqqkk..',
    '.kqQqrrqquuqqqk.',
    '.kqQrrrqquuuqqk.',
    '.kqqrrqqqquuqqk.',
    '.kkqqrqqqquqqkk.',
    '.ksqqqrqquqqqsk.',
    '.kssqqqrruqqqssk',
    '..kkqqqrruqqkk..',
    '..kPPPPPPPPPPk..',
    '..kppppppppppk..',
  ];
  const TORSO_B_JUMP = [
    '..kkqqqqqqqqkkss',
    '.kqQqrrqquuqqksk',
    '.kqQrrrqquuuqkk.',
    '.kqqrrqqqquuqqk.',
    '.kkqqrqqqquqqqk.',
    '.ksqqqrqquqqqqk.',
    '.kssqqqrruqqqqk.',
    '..kkqqqrruqqkk..',
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
    dark: { h: '#ff724e', H: '#833649', r: '#b23e62', u: '#522c5e', b: '#4e2a63', d: '#2b1c40', q: '#281c3d', Q: '#68436c', s: '#bb7181', S: '#7e425c', p: '#4e355a', P: '#24172d' },
    cd: { q: '#f4f4ff', Q: '#ffffff', r: '#ff8a3d', u: '#9b4dff', b: '#9b4dff', p: '#3a1f6e', P: '#24104a' },
    s0: { h: '#ff5ab4', H: '#b0249a', b: '#ffffff', r: '#ffffff', q: '#ff5ab4', Q: '#ffb0e0', u: '#ffe14f', p: '#b0249a', P: '#6a0f5c' },
    s1: { h: '#5ff3ff', H: '#1aa0c0', b: '#ffffff', r: '#ffffff', q: '#5ff3ff', Q: '#c0ffff', u: '#ff5ab4', p: '#1a6aa0', P: '#0f3a6a' },
    s2: { h: '#a6ff5a', H: '#4cb020', b: '#ffffff', r: '#ffffff', q: '#a6ff5a', Q: '#e0ffc0', u: '#2f7bff', p: '#2a7a20', P: '#164a10' },
    s3: { h: '#ffffff', H: '#ffb02e', b: '#e8402e', r: '#ffd23f', q: '#ffffff', Q: '#ffffff', u: '#e8402e', p: '#e8402e', P: '#9c2318' },
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

  const GUARD_BODY = [
    '......kkkk......',
    '.....kggGgk.....',
    '....kggggGgk....',
    '....kssksGgk....',
    '....kssssGkk....',
    '.....kSSsk..k...',
    '....kRrrk..kgk..',
    '...kRRrrkk.kgk..',
    '...krrYgggkkGk..',
    '..krrrgggggksk..',
    '..krrkggYggkk...',
    '..kCkkGgggGk....',
    '...kqkkGGGk.....',
    '...kqk.kGk......',
  ];
  ENEMY.guard = [
    ['..kqqk..kqk.....', '..kkkk..kkk.....'],
    ['....kqqk.kqk....', '....kkkk.kkk....'],
  ].map((legs) => both(fromRows([...GUARD_BODY, ...legs], { ...BASE, R: '#c47958', r: '#8b3d39', g: '#c2b39c', G: '#746b6b', Y: '#e8ab52' }, 16)));

  // Bola de metal com parafusos (rola e não morre pisando)
  ENEMY.ball = [0, 1, 2, 3].map((f) => {
    const c = mk(16, 16), x = c.getContext('2d');
    const cx = 7.5, cy = 7.5, r = 7.5;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const d = Math.hypot(i - cx, j - cy);
      if (d > r) continue;
      const lit = (cx - i) + (cy - j);
      x.fillStyle = d > r - 1 ? '#1a1020' : lit > 5 ? '#e4e9f5' : lit > 0 ? '#aab2c6' : lit > -5 ? '#7d8599' : '#555c70';
      x.fillRect(i, j, 1, 1);
    }
    for (let n = 0; n < 4; n++) {
      const a = (n * Math.PI) / 2 + (f * Math.PI) / 8;
      const bx = Math.round(cx + Math.cos(a) * 4.6 - 1), by = Math.round(cy + Math.sin(a) * 4.6 - 1);
      x.fillStyle = '#1a1020'; x.fillRect(bx, by, 3, 3);
      x.fillStyle = '#c9a23a'; x.fillRect(bx, by, 2, 2);
    }
    x.fillStyle = '#3a3f52'; x.fillRect(2, 7, 12, 1);
    return c;
  });

  // Caranguejo pixel (garras para cima: não dá pra pisar)
  const CRAB_BODY = [
    '...kRkkkkkkRk...',
    '...kRRRRRRRRk...',
    '..kRRRwkRwkRRk..',
    '..kRRRRRRRRRRk..',
    '...kRRRRRRRRk...',
    '..k.k.k..k.k.k..',
    '.k..k.k..k.k..k.',
  ];
  ENEMY.crab = [
    both(fromRows(pad(['..k..........k..', '.kRk........kRk.', '.kRRk.k..k.kRRk.', '..kRk.w..w.kRk..', ...CRAB_BODY], 16), BASE, 16)),
    both(fromRows(pad(['.kk..........kk.', 'kRRk........kRRk', 'kRRk........kRRk', '.kRk........kRk.', '..kRk.k..k.kRk..', '..kRkkw..wkkRk..', ...CRAB_BODY.slice(1)], 16), BASE, 16)),
  ];
  ENEMY.fish = both(fromRows(PAD, { ...BASE, c: '#2f7bff', C: '#1a4ab0', y: '#ffd23f', u: '#ff5ab4' }, 16));

  // Amigos (NPCs)
  const PERSON = (hair, shirt, shirt2) => fromRows([
    '.....kkkkkk.....',
    '....k' + hair.repeat(6) + 'k....',
    '...k' + hair.repeat(8) + 'k...',
    '...k' + hair + 'ssssss' + hair + 'k...',
    '...k' + hair + 'skssks' + hair + 'k...',
    '....ksssSssk....',
    '.....kssssk.....',
    '....k' + shirt.repeat(6) + 'k....',
    '...k' + shirt + shirt + shirt2 + shirt + shirt + shirt2 + shirt + shirt + 'k...',
    '...ks' + shirt.repeat(6) + 'sk...',
    '....k' + shirt.repeat(6) + 'k....',
    '....kppkkppk....',
    '....kppk.kppk...',
    '...knnk..knnk...',
    '...kkkk..kkkk...',
    '................',
  ], { ...BASE, v: '#8a5aff', V: '#5a2ab0', g: '#3bd16f', G: '#1f8a3a', m: '#ff5ab4', M: '#c02a80', c: '#2fe0ff', C: '#1a8ab0' }, 16);
  // Babs Mary: cabelo laranja, moletom roxo com capuz e olhos verdes
  const BABS = fromRows([
    '.....kkkkkk.....',
    '....kvvvvvvk....',
    '...kvoooooovk...',
    '..kvoooooooovk..',
    '..kvossssssovk..',
    '..kvoswLswLsvk..',
    '..kvossssSssvk..',
    '..kvoosrrssovk..',
    '...kvoossssovk..',
    '...kvvvyyvvvk...',
    '..kvvvvyyvvvvk..',
    '..ksvvvvvvvvsk..',
    '...kvvvvvvvvk...',
    '...kPPPkkPPPk...',
    '...kPPk..kPPk...',
    '...knnk..knnk...',
  ], { ...BASE, v: '#8a3ad6', o: '#ff8a2a', L: '#2fc85a', y: '#ffd23f', P: '#2a1f55' }, 16);
  // Miguel: cabelo castanho escuro, comprido e cacheado, e um sorrisão
  const MIGUEL = fromRows([
    '....kkkkkkkk....',
    '...kddDddDddk...',
    '..kdDddddddDdk..',
    '..kddssssssddk..',
    '.kdDdskssksdDdk.',
    '.kddssssSssddk..',
    '.kdDdsswwwsdDdk.',
    '.kddDdsssssdDdk.',
    '..kdddkkkkdddk..',
    '..kdDkooooOkDdk.',
    '...kooooooooook.',
    '..ksoooooooosk..',
    '...kuuuuuuuuk...',
    '...kuuukkuuuk...',
    '...kuuk..kuuk...',
    '...knnk..knnk...',
  ], { ...BASE, s: '#f4c8a0', S: '#d49a72', o: '#ff8a3d', O: '#c95a1a', u: '#2f5ab0', d: '#2e1c12', D: '#5a3820' }, 16);
  const AXO = fromRows(pad([
    '.m.m........m.m.',
    '..mmm.kkkk.mmm..',
    '...mkPPPPPPkm...',
    '....kPkPPkPk....',
    '...kPPPPPPPPk...',
    '...kPPPmmPPPk...',
    '....kPPPPPPk....',
    '...kPPPPPPPPkk..',
    '..kPPPPPPPPPPPk.',
    '..kPPkPPPPkPPk..',
    '...kk.kkkk.kk...',
  ], 16), { ...BASE, P: '#ffaacc', m: '#ff5ab4' }, 16);
  const PS2 = fromRows(pad([
    '..kkkkkkkkkkkk..',
    '.kGGGGGGGGGGGGk.',
    '.kqqqqqqqqqqqqk.',
    '.kqwkqqqqqwkqqk.',
    '.kqqqqqqqqqqqqk.',
    '.kqqqkkkkkqqqqk.',
    '.kQQQQQQQQQQQQk.',
    '.kqqqqqqqqqqqqk.',
    '.kqeqqqqqqqqqqk.',
    '.kqqqqqqqqqqqqk.',
    '..kkkkkkkkkkkk..',
    '..kk........kk..',
  ], 16), BASE, 16);
  // RafaRL: cabelo loiro em chanel com franja e batom vermelho
  const RAFAEL = fromRows([
    '.....kkkkkk.....',
    '....kyyyyyyk....',
    '...kyyYyyYyyk...',
    '...kyyyyyyyyk...',
    '..kyysssssssyk..',
    '..kyskssskssyk..',
    '..kyssssSsssyk..',
    '..kyysssrrssyk..',
    '..kyyykssssyyk..',
    '...kyywwwwyyk...',
    '..kwwwwwwwwwwk..',
    '..ksswwwwwwssk..',
    '...kqqqqqqqqk...',
    '...kqqqkkqqqk...',
    '...kssk..kssk...',
    '...knnk..knnk...',
  ], { ...BASE, y: '#ffe28a', Y: '#e8c25a', r: '#e8402e', q: '#2a2a36' }, 16);
  // Scott: cabelo comprido, camiseta de banda por cima das mangas claras e jeans.
  const SCOTT = fromRows([
    '.....kkkkkk.....',
    '...kkYYYYYYk....',
    '..kYYYyYYYYYk...',
    '..kYyyyYYsYYyk..',
    '..kYyyYssssYyk..',
    '..kYyYskssksYk..',
    '..kYyYsssSssYk..',
    '..kYYYssrssYYk..',
    '.kYYyksssskyYk..',
    '.kYykrCCCCrkyYk.',
    '.kYkwwrryrwwkYk.',
    '..kkgkrrrrkgkk..',
    '...kskuuuuksk...',
    '....kuuppuk.....',
    '....kuk.kuk.....',
    '...kwwk.kwwk....',
  ], { ...BASE, y: '#d39a62', Y: '#8f553e', r: '#873239', C: '#592636', u: '#456184', p: '#303f61' }, 16);
  // Jackson: carinha rosa e redondo de bermuda azul
  const JACKSON = fromRows([
    '................',
    '.....kkkkkk.....',
    '....kmmmmmmk....',
    '...kmmmmmmmmk...',
    '...kmwkmmwkmk...',
    '...kmmmmmmmmk...',
    '..kmmmkkkkmmmk..',
    '..kmmmmmmmmmmk..',
    '.kmmmmmmmmmmmmk.',
    '.kmmmmmmmmmmmmk.',
    '..kuuuuuuuuuuk..',
    '..kuuuuuuuuuuk..',
    '...kmmk..kmmk...',
    '...kmmk..kmmk...',
    '..knnnk..knnnk..',
    '..kkkkk..kkkkk..',
  ], { ...BASE, m: '#ff9ab0', u: '#2f7bff' }, 16);
  const NPC = {
    rafael: both(RAFAEL), scott: both(SCOTT), jackson: both(JACKSON),
    axo: both(AXO), ps2: both(PS2), babs: both(BABS), miguel: both(MIGUEL),
    discord: both(PERSON('d', 'v', 'V')),
    inscrito: both(PERSON('n', 'g', 'G')),
    crowd: ['v', 'g', 'm', 'c'].map((c) => both(PERSON(c === 'm' ? 'd' : 'n', c, c.toUpperCase()))),
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
    mgpStudio: { g1: '#302a54', g2: '#211c3e', g3: '#544673', t1: '#c36def', t2: '#77429d', tL: '#fed5ff', br: '#624e93', brL: '#ab82cf', brD: '#3e2f67', mo: '#1b1934', hd: '#3c355f', hdL: '#856d9f', hdD: '#282143', semi: 'metal', style: 'plate' },
    mgpWorkshop: { g1: '#535056', g2: '#38363e', g3: '#72676b', t1: '#e7a451', t2: '#8b5838', tL: '#ffdc85', br: '#976b4c', brL: '#cfa276', brD: '#694a40', mo: '#37283a', hd: '#735f58', hdL: '#a88b71', hdD: '#4a3a40', semi: 'metal', style: 'plate' },
    mgpCanopy: { g1: '#396250', g2: '#254b46', g3: '#638366', t1: '#a5bf46', t2: '#66863c', tL: '#e2ee91', br: '#635d40', brL: '#a59b59', brD: '#3a4b39', mo: '#263a35', hd: '#486350', hdL: '#80a477', hdD: '#304238', semi: 'wood', style: 'stone' },
    mgpRidge: { g1: '#9c5367', g2: '#733a58', g3: '#ca7782', t1: '#64d6c1', t2: '#3d8fa1', tL: '#e8f7c3', br: '#9c5e7f', brL: '#d987a2', brD: '#623d6a', mo: '#422e57', hd: '#73516e', hdL: '#c7849c', hdD: '#523958', semi: 'wood', style: 'bands' },
    sonicHills: { g1: '#bb692d', g2: '#8d461d', g3: '#e6984f', t1: '#4bd940', t2: '#238c3a', tL: '#c2fc74', br: '#c67431', brL: '#faab59', brD: '#85441d', mo: '#512c22', hd: '#b47a35', hdL: '#f9be65', hdD: '#784923', semi: 'wood', style: 'checker' },
    grotto: { g1: '#1d746e', g2: '#104c58', g3: '#409b8f', t1: '#6cdfa4', t2: '#327f70', tL: '#c8fbc1', br: '#41667e', brL: '#89b6b7', brD: '#214155', mo: '#073743', hd: '#315d69', hdL: '#6baba3', hdD: '#254251', semi: 'cloud', style: 'stone' },
    monotomias: { g1: '#353049', g2: '#21172d', g3: '#59506e', t1: '#d06c49', t2: '#692c48', tL: '#ffd083', br: '#864964', brL: '#df897b', brD: '#4f2a47', mo: '#21152c', hd: '#4b3351', hdL: '#94717f', hdD: '#23182f', semi: 'metal', style: 'plate' },
    roofs: { g1: '#a47154', g2: '#754a40', g3: '#d19768', t1: '#e9ad73', t2: '#a86244', tL: '#ffe0a0', br: '#944f3b', brL: '#db9060', brD: '#613037', mo: '#563740', hd: '#917260', hdL: '#ddab7d', hdD: '#65433e', semi: 'wood', style: 'stone' },
    snowCity: { g1: '#41466c', g2: '#262d50', g3: '#67658b', t1: '#eff8ff', t2: '#aabfe9', tL: '#ffffff', br: '#5a4b75', brL: '#9483a6', brD: '#3e375a', mo: '#222440', hd: '#4e6281', hdL: '#98b3d1', hdD: '#263853', semi: 'metal', style: 'stone' },
    bat: { g1: '#2a1a40', g2: '#1a0e2c', g3: '#3e2a5c', t1: '#b48aff', t2: '#6a3ab0', tL: '#e8d8ff', br: '#4a2a7a', brL: '#8a6ac8', brD: '#24104a', mo: '#0c0618', hd: '#3a2a5a', hdL: '#7a64a8', hdD: '#1a1030', semi: 'metal', style: 'plate' },
    live: { g1: '#1a1030', g2: '#0e0820', g3: '#2a1a50', t1: '#ff3bd6', t2: '#8a2ab0', tL: '#ffb0f4', br: '#3a2a7a', brL: '#7a5af0', brD: '#1a0a40', mo: '#0a0414', hd: '#2a1a50', hdL: '#6a4aa0', hdD: '#140a28', semi: 'metal', style: 'plate' },
    snow: { g1: '#9cc4e8', g2: '#7aa8d6', g3: '#e0f0ff', t1: '#ffffff', t2: '#c8dcf0', tL: '#ffffff', br: '#6a9ad8', brL: '#b8d8ff', brD: '#3a5a9a', mo: '#1a2a4a', hd: '#8ab0d8', hdL: '#e0f0ff', hdD: '#4a6a9a', semi: 'cloud', style: 'sand' },
    city: { g1: '#2a2440', g2: '#1a1630', g3: '#3a3458', t1: '#2fe0ff', t2: '#1a7ab0', tL: '#c0f8ff', br: '#4a3a7a', brL: '#7a6ab8', brD: '#24184a', mo: '#0c0818', hd: '#3a3458', hdL: '#6a64a0', hdD: '#1a1630', semi: 'metal', style: 'plate' },
    desert: { g1: '#e8a95a', g2: '#c98a3e', g3: '#f6c88a', t1: '#f8d49a', t2: '#e0b070', tL: '#fff0d0', br: '#d07a3a', brL: '#f0a868', brD: '#8a4a1a', mo: '#4a2410', hd: '#c88a4a', hdL: '#f0c080', hdD: '#7a4a1a', semi: 'wood', style: 'sand' },
    beach: { g1: '#f2d38a', g2: '#d9b26a', g3: '#fff0c0', t1: '#ffe9a8', t2: '#e8c27a', tL: '#ffffff', br: '#e07a4a', brL: '#ffb08a', brD: '#9a4a2a', mo: '#5a2a14', hd: '#d9a05a', hdL: '#ffd9a0', hdD: '#8a5a2a', semi: 'palm', style: 'sand' },
    fair: { g1: '#2a2f5a', g2: '#1a1d3a', g3: '#3a4078', t1: '#2fe0ff', t2: '#1a8ab0', tL: '#c0f8ff', br: '#5a3aa0', brL: '#8a6ae0', brD: '#2e1a60', mo: '#0c0a20', hd: '#4a4f80', hdL: '#8a90c8', hdD: '#22264a', semi: 'metal', style: 'plate' },
    sea: { g1: '#c9a86a', g2: '#a08050', g3: '#e8cc90', t1: '#ff7aa8', t2: '#c94a7a', tL: '#ffc0d8', br: '#4a8ab0', brL: '#8ac8e8', brD: '#24506a', mo: '#0c2030', hd: '#5a7a9a', hdL: '#9ab8d8', hdD: '#2a4060', semi: 'wood', style: 'sand' },
    edit: { g1: '#2b2b33', g2: '#1c1c22', g3: '#3a3a46', t1: '#7a5cff', t2: '#4a2ab0', tL: '#c0b0ff', br: '#3a8aff', brL: '#8ab8ff', brD: '#1a4ab0', mo: '#0c0c14', hd: '#44444f', hdL: '#7a7a8a', hdD: '#22222a', semi: 'metal', style: 'plate' },
    buffer: { g1: '#22222c', g2: '#14141a', g3: '#34343f', t1: '#ffffff', t2: '#9aa0b8', tL: '#ffffff', br: '#44444f', brL: '#7a7a8a', brD: '#22222a', mo: '#0c0c14', hd: '#3a3a46', hdL: '#7a7a8a', hdD: '#1c1c22', semi: 'metal', style: 'plate' },
    tropical: { g1: '#c4691f', g2: '#8e4513', g3: '#e8913f', t1: '#3fd04a', t2: '#1f9a34', tL: '#b8f78a', br: '#d0632a', brL: '#f7a064', brD: '#8a3812', mo: '#3e1606', hd: '#c27a3e', hdL: '#f0b070', hdD: '#7a4418', semi: 'wood', style: 'bands' },
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
      } else if (th.style === 'sand') {
        x.fillStyle = th.g1; x.fillRect(0, 0, 16, 16);
        const r = rng(23);
        for (let i = 0; i < 14; i++) { x.fillStyle = i % 3 ? th.g2 : th.g3; x.fillRect((r() * 15) | 0, (r() * 15) | 0, 1, 1); }
        if (top) { x.fillStyle = th.t2; x.fillRect(0, 3, 16, 2); x.fillStyle = th.t1; x.fillRect(0, 0, 16, 3); x.fillStyle = th.tL; x.fillRect(0, 0, 16, 1); for (let i = 3; i < 16; i += 6) x.fillRect(i, 1, 2, 1); }
      } else if (th.style === 'bands' || th.style === 'checker') {
        if (th.style === 'checker') {
          x.fillStyle = th.g1; x.fillRect(0, 0, 16, 16);
          x.fillStyle = th.g2; x.fillRect(8, 0, 8, 8); x.fillRect(0, 8, 8, 8);
          x.fillStyle = th.g3; x.fillRect(0, 8, 8, 1); x.fillRect(8, 0, 8, 1);
        } else {
          for (let j = 0; j < 16; j++) { x.fillStyle = Math.floor(j / 4) % 2 ? th.g2 : th.g1; x.fillRect(0, j, 16, 1); }
        }
        x.fillStyle = th.g3; [[3, 1], [11, 2], [7, 9], [14, 10], [1, 13]].forEach(([a, b]) => x.fillRect(a, b, 2, 1));
        x.fillStyle = th.g2; [[6, 5], [12, 6], [2, 14]].forEach(([a, b]) => x.fillRect(a, b, 1, 1));
        if (top) {
          x.fillStyle = th.t1; x.fillRect(0, 0, 16, 5);
          x.fillStyle = th.t2;
          for (let i = 0; i < 16; i++) { const h = 5 + [2, 3, 2, 1][i % 4]; x.fillRect(i, 5, 1, h - 5); }
          x.fillStyle = th.tL; x.fillRect(0, 0, 16, 1);
          for (let i = 1; i < 16; i += 4) { x.fillRect(i, 1, 1, 2); x.fillRect(i + 1, 1, 1, 1); }
          x.fillStyle = '#ffffff'; x.fillRect(6, 2, 1, 1);
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
      } else if (th.semi === 'palm') {
        x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 5);
        x.fillStyle = '#2fbf3a'; x.fillRect(0, 1, 16, 3);
        x.fillStyle = '#8ef06a'; x.fillRect(0, 1, 16, 1);
        x.fillStyle = '#1f8a2a'; for (let i = 1; i < 16; i += 4) x.fillRect(i, 4, 2, 3);
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
    // esteiras rolantes (4 quadros de animação)
    S.conv = [0, 1, 2, 3].map((f) => {
      const c = mk(16, 16), x = c.getContext('2d');
      x.fillStyle = '#1a1020'; x.fillRect(0, 0, 16, 16);
      x.fillStyle = '#5a6078'; x.fillRect(0, 1, 16, 6);
      x.fillStyle = '#9aa3bd'; x.fillRect(0, 1, 16, 1);
      x.fillStyle = '#ffd23f'; for (let i = -4; i < 16; i += 4) { const ox = i + f; x.fillRect(ox, 3, 2, 1); x.fillRect(ox + 1, 4, 2, 1); x.fillRect(ox, 5, 2, 1); }
      x.fillStyle = th.g1; x.fillRect(0, 8, 16, 8);
      x.fillStyle = '#3a3f52'; [3, 12].forEach((cx) => { x.fillRect(cx - 2, 10, 4, 4); });
      return c;
    });
    S.water = [0, 1].map((f) => {
      const c = mk(16, 16), x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 16); g.addColorStop(0, '#3aa8f0'); g.addColorStop(1, '#1a5fb8');
      x.fillStyle = g; x.fillRect(0, 2, 16, 14);
      for (let i = 0; i < 16; i++) { const wy = 2 + Math.round(Math.sin((i + f * 8) / 16 * Math.PI * 2)); x.fillStyle = '#e8f8ff'; x.fillRect(i, wy - 1, 1, 1); x.fillStyle = '#8fd8ff'; x.fillRect(i, wy, 1, 2); }
      x.fillStyle = 'rgba(220,245,255,0.55)'; x.fillRect((f * 5 + 3) % 13, 8, 3, 1); x.fillRect((f * 7 + 9) % 13, 12, 2, 1);
      return c;
    });
    tileCache[name] = S;
    return S;
  }

  // ----------------------------------------------------------- CENÁRIOS
  const SONIC = (() => {
    const head = [
      '......kkk.........',
      '.....kuuk.kk......',
      '..kkkkUukkuuk.....',
      '...kuuuuuuusuk....',
      '....kuuuuuuuwk....',
      '.kkkuuuuuuuwwgk...',
      '..kuuuuuuuuwwkk...',
      '...kuuuuuuUssskkk.',
      '....kkuuussSsssk..',
      '...kuuuukkssssk...',
      '....kkkuuUkkk.....',
      '......kuusuk......',
      '....kkwwuwuk......',
      '...kwwkkusuk......',
    ];
    const feet = [
      ['.....kuukkuk......', '....kuuk..kukk....', '..kkrrk...kwrrkk..', '..kwwwk...kwwwwk..'],
      ['......kukkuk......', '......kuukkuuk....', '....kkwrrk..krkk..', '....kwwwwk..kwwk..'],
    ];
    const palette = { ...BASE, u: '#287aff', U: '#1842a3', s: '#ffbd80', g: '#36c483' };
    const run = feet.map((frame) => both(fromRows([...head, ...frame], palette, 18)));
    const idle = both(fromRows([...head, '......kuukuk......', '......kuk.kuk.....', '.....krrk.krrk....', '.....kwwk.kwwk....'], palette, 18));
    const ball = Array.from({ length: 8 }, (_, frame) => {
      const c = mk(16, 16), x = c.getContext('2d');
      for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
        const dx = px - 7.5, dy = py - 7.5, r = Math.hypot(dx, dy);
        if (r > 8) continue;
        const twist = 0.8 * r + 2 * Math.atan2(dy, dx) - frame * Math.PI / 4;
        x.fillStyle = r > 7 ? '#10204f' : Math.sin(twist) > 0.58 ? '#acfcff' : Math.sin(twist) > -0.26 ? '#3eb3ff' : '#164ed2';
        x.fillRect(px, py, 1, 1);
      }
      return c;
    });
    return { idle, run, ball };
  })();

  const props = {
    venue: (() => {
      const c = mk(112, 67), x = c.getContext('2d');
      for (const [color, px, py, w, h] of [
        ['#27243d', 4, 6, 104, 61], ['#49405c', 8, 9, 96, 58], ['#40334f', 28, 20, 56, 47],
        ['#d4e6ff', 1, 3, 110, 4], ['#eef8ff', 6, 1, 101, 3], ['#a4b7df', 5, 7, 101, 3],
        ['#39223d', 9, 17, 94, 20], ['#d27d90', 11, 19, 90, 16], ['#472d50', 16, 22, 80, 10],
        ['#2b2640', 39, 44, 34, 23], ['#d99897', 42, 47, 28, 20], ['#573a56', 53, 47, 6, 20],
        ['#7f6292', 10, 46, 18, 13], ['#7f6292', 84, 46, 18, 13],
        ['#edb8a5', 12, 48, 14, 9], ['#edb8a5', 86, 48, 14, 9],
      ]) { x.fillStyle = color; x.fillRect(px, py, w, h); }
      x.fillStyle = '#ffdcad';
      for (let px = 13; px < 101; px += 4) { x.fillRect(px, 19, 1, 1); x.fillRect(px, 34, 1, 1); }
      x.font = 'bold 8px monospace'; x.textAlign = 'center'; x.textBaseline = 'top';
      x.fillText('CASA DE SHOWS', 56, 22);
      return c;
    })(),
    hay: (() => {
      const c = mk(32, 11), x = c.getContext('2d'), random = rng(31);
      for (const [color, px, py, w, h] of [
        ['#4c3434', 0, 8, 32, 3], ['#694134', 2, 5, 28, 5], ['#a46936', 3, 3, 26, 6],
        ['#de9b47', 6, 1, 20, 7], ['#f6ca65', 10, 0, 11, 4], ['#f6ca65', 5, 3, 9, 2],
      ]) { x.fillStyle = color; x.fillRect(px, py, w, h); }
      for (let i = 0; i < 30; i++) {
        x.fillStyle = i % 2 ? '#f8d77e' : '#ac723b';
        x.fillRect(7 + Math.floor(random() * 18), 3 + Math.floor(random() * 6), 2 + Math.floor(random() * 4), 1);
      }
      return c;
    })(),
    tram: (() => {
      const c = mk(48, 17), x = c.getContext('2d');
      for (const [color, px, py, w, h] of [
        ['#25304d', 2, 2, 44, 13], ['#25304d', 0, 6, 48, 7], ['#e9f7ff', 4, 0, 40, 3],
        ['#d4e6ff', 1, 2, 46, 2], ['#a94c56', 2, 4, 44, 9], ['#db6670', 2, 9, 44, 2],
        ['#692e4b', 4, 12, 40, 2], ['#26293f', 9, 14, 8, 3], ['#26293f', 31, 14, 8, 3],
        ['#ffdd99', 1, 9, 2, 2], ['#ffdd99', 45, 9, 2, 2],
      ]) { x.fillStyle = color; x.fillRect(px, py, w, h); }
      for (let wx = 5; wx < 42; wx += 9) {
        x.fillStyle = '#613a52'; x.fillRect(wx, 4, 7, 5);
        x.fillStyle = '#ffdcb1'; x.fillRect(wx + 1, 5, 5, 3);
        x.fillStyle = '#c88685'; x.fillRect(wx + 4, 5, 1, 3);
      }
      return c;
    })(),
  };

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

  function palmTree(x, px, py, h) {
    for (let i = 0; i < h; i += 3) { x.fillStyle = (i / 3) % 2 ? '#8a5a2a' : '#b07a3a'; x.fillRect(px + Math.round(Math.sin(i / 10) * 3), py - i, 4, 3); }
    const tx = px + Math.round(Math.sin(h / 10) * 3) + 2, ty = py - h;
    x.fillStyle = '#1f9a34';
    [[-1, 0], [1, 0], [-1, 0.6], [1, 0.6], [0, -1]].forEach(([dx, dy]) => { for (let k = 0; k < 14; k++) x.fillRect(tx + dx * k - 1, ty + Math.round(dy * k + (k * k) / 16), 3, 2); });
    x.fillStyle = '#3fd04a'; [-1, 1].forEach((dx) => { for (let k = 0; k < 10; k++) x.fillRect(tx + dx * k, ty - 1 + Math.round((k * k) / 16), 2, 1); });
    x.fillStyle = '#6b3a1e'; x.fillRect(tx - 2, ty + 2, 3, 3); x.fillRect(tx + 1, ty + 3, 3, 3);
  }

  // névoa leve antes da camada mais próxima (dá sensação de distância)
  const HAZE = {
    bat: 'rgba(40,10,70,0.18)', tropical: 'rgba(190,230,255,0.16)', title: 'rgba(190,230,255,0.16)', grass: 'rgba(200,235,255,0.16)',
    beach: 'rgba(255,220,180,0.14)', sky: 'rgba(255,200,230,0.12)', cave: 'rgba(8,6,26,0.25)', castle: 'rgba(30,5,10,0.22)',
    fair: 'rgba(20,10,50,0.2)', sea: 'rgba(20,70,150,0.2)', snow: 'rgba(220,235,255,0.14)', city: 'rgba(60,20,80,0.16)', desert: 'rgba(255,220,170,0.14)',
  };
  const wrapX = (v, span) => ((v % span) + span) % span;
  function bird(ctx, x, y, t) {
    const up = (t >> 3) % 2;
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(Math.round(x) - 3, Math.round(y) - up, 3, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - up, 3, 1); ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  // detalhes animados de cada cenário
  function animExtras(ctx, name, camX, t, W, H) {
    if (name === 'tropical' || name === 'sonicHills' || name === 'title' || name === 'grass' || name === 'beach') {
      for (let i = 0; i < 3; i++) bird(ctx, wrapX(i * 140 + t * (0.35 + i * 0.08) - camX * 0.1, 460) - 40, 36 + i * 14 + Math.sin(t * 0.03 + i) * 4, t + i * 5);
    } else if (name === 'cave') {
      for (let i = 0; i < 7; i++) {
        const x = wrapX(i * 83 - camX * 0.2, W + 40) - 20, y = 120 + ((i * 37) % 60), a = 0.12 + 0.1 * Math.sin(t * 0.05 + i * 1.3);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 18); g.addColorStop(0, i % 2 ? `rgba(95,214,255,${a})` : `rgba(255,90,180,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 18, y - 18, 36, 36);
      }
    } else if (name === 'sky') {
      for (let i = 0; i < 26; i++) { if ((t + i * 13) % 90 < 60) { ctx.fillStyle = i % 4 ? 'rgba(255,255,255,0.8)' : '#ffd23f'; ctx.fillRect(wrapX(i * 47 - camX * 0.04, W), (i * 29) % 70 + 4, 1, 1); } }
    } else if (name === 'grotto') {
      for (let i = 0; i < 21; i++) {
        const px = wrapX(i * 73 - camX * (0.23 + (i % 2) * 0.14) + Math.sin(t * 0.026 + i) * 6, W);
        const py = 192 - ((t * (0.17 + i % 4 * 0.06) + i * 31) % 88);
        ctx.fillStyle = i % 3 ? 'rgba(114,235,190,0.62)' : 'rgba(236,163,246,0.72)';
        ctx.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
    } else if (name === 'castle') {
      for (let i = 0; i < 16; i++) { const life = (t * (0.6 + (i % 4) * 0.15) + i * 37) % H; ctx.fillStyle = i % 3 ? 'rgba(255,140,40,0.75)' : 'rgba(255,220,90,0.85)'; ctx.fillRect(Math.round(wrapX(i * 61 - camX * 0.5 + Math.sin((t + i * 20) * 0.03) * 6, W)), Math.round(H - life), 1, 2); }
    } else if (name === 'fair') {
      const off = -camX * 0.6;
      ctx.fillStyle = '#0c0a1c';
      for (let x = 0; x < W + 64; x += 2) { const sx = wrapX(x + off, W + 64) - 32; const yy = 14 + Math.round(Math.sin((x / 64) * Math.PI) * 10); ctx.fillRect(Math.round(sx), yy, 2, 1); }
      for (let x = 8; x < W + 64; x += 16) { const sx = wrapX(x + off, W + 64) - 32; const yy = 15 + Math.round(Math.sin((x / 64) * Math.PI) * 10); const on = ((x / 16 + (t >> 4)) % 3); ctx.fillStyle = ['#ff5ab4', '#ffd23f', '#2fe0ff'][on]; ctx.fillRect(Math.round(sx) - 1, yy + 1, 3, 3); }
    } else if (name === 'bat') {
      // morcegos voando na frente da lua
      for (let i = 0; i < 7; i++) {
        const x = wrapX(i * 67 + t * (0.5 + (i % 3) * 0.25) - camX * 0.15, W + 40) - 20, y = 30 + (i * 23) % 70 + Math.sin(t * 0.06 + i) * 6, up = ((t >> 3) + i) % 2;
        ctx.fillStyle = '#05020c'; ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 2);
        ctx.fillRect(Math.round(x) - 5, Math.round(y) - up, 4, 1); ctx.fillRect(Math.round(x) + 2, Math.round(y) - up, 4, 1);
        ctx.fillRect(Math.round(x) - 6, Math.round(y) + 1 - up * 2, 2, 1); ctx.fillRect(Math.round(x) + 5, Math.round(y) + 1 - up * 2, 2, 1);
      }
    } else if (name === 'roofs') {
      for (let i = 0; i < 5; i++) bird(ctx, wrapX(i * 60 + t * 0.37 - camX * 0.13, W + 60) - 30, 45 + i * 5 + Math.sin(t * 0.04 + i) * 7, t + i * 4);
      ctx.fillStyle = 'rgba(255,218,161,0.45)';
      for (let i = 0; i < 16; i++) {
        const x = wrapX(i * 73 + t * 0.32 - camX * 0.62, W);
        const y = 96 + (i * 37) % 84 + Math.sin(t * 0.033 + i) * 5;
        ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    } else if (name === 'snowCity') {
      for (let i = 0; i < 52; i++) {
        const z = i % 3, x = wrapX(i * 59 + t * (0.22 + z * 0.15) + Math.sin(t * 0.025 + i) * 5 - camX * (0.14 + 0.12 * z), W);
        const y = (i * 37 + t * (0.35 + z * 0.28)) % H;
        ctx.fillStyle = ['#b0c5f0', '#e3edff', '#ffffff'][z];
        ctx.fillRect(Math.round(x), Math.floor(y), z === 2 ? 2 : 1, z === 2 ? 2 : 1);
      }
    } else if (name === 'snow') {
      for (let k = 0; k < 3; k++) for (let x = 0; x < W; x += 2) { const y = 22 + k * 11 + Math.sin(x * 0.018 + t * 0.012 + k * 1.7) * 9; ctx.fillStyle = k === 1 ? 'rgba(120,200,255,0.09)' : 'rgba(80,255,170,0.10)'; ctx.fillRect(x, Math.round(y), 2, 16); }
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 46; i++) { const x = wrapX(i * 53 + Math.sin(t * 0.02 + i) * 8 - camX * (0.3 + (i % 3) * 0.15), W), y = (t * (0.35 + (i % 4) * 0.15) + i * 37) % H; ctx.fillRect(Math.round(x), Math.round(y), i % 5 ? 1 : 2, i % 5 ? 1 : 2); }
    } else if (name === 'city') {
      for (let i = 0; i < 6; i++) { const x = wrapX(i * 83 - camX * 0.3, W + 60) - 30, y = H - 74 - (i % 3) * 14, a = 0.55 + 0.45 * Math.sin(t * 0.15 + i * 2); ctx.fillStyle = i % 2 ? `rgba(255,90,180,${a})` : `rgba(47,224,255,${a})`; ctx.fillRect(Math.round(x), y, 16, 5); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(Math.round(x) + 2, y + 2, 12, 1); }
    } else if (name === 'desert') {
      for (let i = 0; i < 2; i++) { const x = wrapX(t * (0.9 + i * 0.4) + i * 200 - camX * 0.5, W + 40) - 20, y = H - 30 - Math.abs(Math.sin(t * 0.08 + i)) * 6, a = t * 0.1 + i; ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), 5, a, a + 5); ctx.stroke(); ctx.beginPath(); ctx.arc(Math.round(x), Math.round(y), 3, a + 2, a + 6); ctx.stroke(); }
    } else if (name === 'sea') {
      ctx.fillStyle = 'rgba(10,40,100,0.55)';
      for (let i = 0; i < 9; i++) { const x = wrapX(i * 31 + t * 0.4 - camX * 0.3, W + 120) - 60 + (i % 3) * 8, y = 70 + (i % 3) * 7 + Math.sin(t * 0.04 + i) * 2; ctx.fillRect(Math.round(x), Math.round(y), 5, 2); ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 2, 4); }
    }
  }

  function rooftops(w, h, near) {
    const c = mk(w, h), x = c.getContext('2d'), random = rng(near ? 84 : 25);
    const base = h - (near ? 53 : 65);
    const masonry = near ? ['#744650', '#94565b', '#ab6a62'] : ['#a45f65', '#b37372', '#d08a7a'];
    const rim = near ? '#d89477' : '#dc947e', shadow = near ? '#563646' : '#975968';
    for (let bx = 0; bx < w;) {
      const bw = 22 + Math.floor(random() * 24), top = base - Math.floor(random() * 37);
      const type = Math.floor(random() * 4);
      x.fillStyle = masonry[type % masonry.length]; x.fillRect(bx, top, bw, h - top);
      x.fillStyle = shadow; x.fillRect(bx + bw - 5, top, 5, h - top);
      x.fillStyle = rim; x.fillRect(bx, top, bw, 2);
      if (type === 0) {
        const center = bx + Math.floor(bw / 2);
        for (let dy = 0; dy < 16; dy++) {
          const radius = Math.round(Math.sqrt(1 - (1 - dy / 16) ** 2) * (bw / 2 - 2));
          x.fillStyle = masonry[dy < 3 ? 2 : 1]; x.fillRect(center - radius, top - 16 + dy, radius * 2, 1);
          if (radius > 3) { x.fillStyle = shadow; x.fillRect(center + radius - 4, top - 16 + dy, 4, 1); }
        }
        x.fillStyle = rim; x.fillRect(center, top - 21, 1, 6);
      } else if (type === 1) {
        const center = bx + Math.floor(bw / 2);
        x.fillStyle = masonry[0]; x.fillRect(center - 5, top - 30, 10, 30);
        x.fillStyle = shadow; x.fillRect(center + 2, top - 29, 3, 29);
        x.fillStyle = rim; x.fillRect(center - 6, top - 25, 12, 2); x.fillRect(center - 5, top - 31, 10, 2);
        x.fillStyle = masonry[0]; x.fillRect(center - 2, top - 35, 4, 5);
      } else {
        x.fillStyle = masonry[0];
        for (let col = bx + 2; col + 4 < bx + bw; col += 8) x.fillRect(col, top - 4, 4, 5);
      }
      if (near && type === 3) {
        x.fillStyle = '#4c2d40'; x.fillRect(bx + 4, top + 5, 12, 24);
        x.fillStyle = '#a44454'; x.fillRect(bx + 5, top + 6, 10, 21);
        x.fillStyle = '#e8b077'; x.fillRect(bx + 5, top + 8, 10, 1);
        x.fillRect(bx + 9, top + 13, 2, 8);
      }
      for (let wy = top + 11; wy < h; wy += 15) {
        for (let wx = bx + 5; wx + 4 < bx + bw - 4; wx += 11) {
          x.fillStyle = shadow; x.fillRect(wx, wy + 1, 5, 7); x.fillRect(wx + 1, wy, 3, 1);
          if (near && random() < 0.26) { x.fillStyle = '#e9a873'; x.fillRect(wx + 1, wy + 2, 3, 4); }
        }
      }
      bx += bw + 3;
    }
    return c;
  }

  function snowPeaks(w, h) {
    const c = mk(w, h), x = c.getContext('2d');
    const random = rng(91);
    const peaks = [[42, 68, 54], [152, 43, 76], [260, 83, 62], [390, 47, 81], [497, 78, 58]];
    for (const [center, top, radius] of peaks) {
      for (let y = top; y < h; y++) {
        const depth = y - top;
        const left = Math.floor(center - Math.min(radius, depth * 0.60) + Math.sin(depth * 0.23) * 3);
        const right = Math.ceil(center + Math.min(radius, depth * 0.85) + Math.sin(depth * 0.18) * 2);
        const mid = Math.min(right, center + Math.floor(depth * 0.13));
        const snowEdge = 32 + Math.cos(y * 0.34) * 7 + random() * 5;
        x.fillStyle = depth < snowEdge ? '#e0dcf4' : '#7989b5'; x.fillRect(left, y, mid - left, 1);
        x.fillStyle = depth < snowEdge + 8 ? '#acb4dd' : '#546491'; x.fillRect(mid, y, right - mid, 1);
      }
    }
    // Rocha quadriculada nas encostas, sob a linha de neve.
    x.globalCompositeOperation = 'source-atop';
    for (let y = 113; y < h; y += 8) for (let px = 0; px < w; px += 8) {
      if ((px / 8 + Math.floor(y / 8)) % 2) {
        x.fillStyle = 'rgba(44,45,99,0.16)'; x.fillRect(px, y, 8, 8);
      }
    }
    const foothills = ridge(w, h, '#617a9e', 56, [[15, 3, 2], [9, 7, 1]]);
    x.globalCompositeOperation = 'source-over'; x.drawImage(foothills, 0, 0);
    return c;
  }

  function winterStreet(w, h) {
    const c = mk(w, h), x = c.getContext('2d'), random = rng(62);
    const fronts = ['#383d66', '#51405f', '#41496c', '#534666'];
    const signs = ['DISCOS', 'CAFÉ', 'ARCADE', 'SHOW'];
    for (let bx = 0, i = 0; bx <= w - 25; i++) {
      const bw = Math.min(w - bx, 28 + Math.floor(random() * 26));
      const shop = i % 3 === 0, top = h - (shop ? 78 : 100) - Math.floor(random() * 20);
      const front = fronts[i % fronts.length];
      x.fillStyle = '#2b3050'; x.fillRect(bx + 2, top + 2, bw, h - top);
      x.fillStyle = front; x.fillRect(bx, top, bw - 3, h - top);
      x.fillStyle = '#9bafd5'; x.fillRect(bx - 1, top - 2, bw, 3);
      x.fillStyle = '#d9e3f9'; x.fillRect(bx, top - 3, bw - 3, 2);
      for (let wy = top + 12; wy < h - 48; wy += 16) {
        for (let wx = bx + 6; wx < bx + bw - 11; wx += 12) {
          x.fillStyle = '#272b4d'; x.fillRect(wx - 1, wy - 1, 7, 10);
          x.fillStyle = random() < 0.42 ? '#f7be9e' : '#7d84ac'; x.fillRect(wx, wy, 5, 7);
          x.fillStyle = front; x.fillRect(wx + 2, wy, 1, 7); x.fillRect(wx, wy + 3, 5, 1);
        }
      }
      if (shop) {
        x.fillStyle = '#302743'; x.fillRect(bx + 2, h - 60, bw - 7, 14);
        x.font = 'bold 7px monospace'; x.textAlign = 'center'; x.textBaseline = 'top';
        x.fillStyle = '#ffb3b8'; x.fillText(signs[(i / 3) % signs.length], bx + Math.floor((bw - 3) / 2), h - 56, bw - 10);
        x.fillStyle = '#c4d6f0'; x.fillRect(bx + 1, h - 46, bw - 5, 2);
        x.fillStyle = '#886076'; x.fillRect(bx + 1, h - 44, bw - 5, 4);
        x.fillStyle = '#ffce9d'; x.fillRect(bx + 5, h - 36, bw - 13, 13);
        x.fillStyle = front; x.fillRect(bx + Math.floor(bw / 2), h - 36, 2, 13);
      }
      if (i % 2 === 0) {
        const pole = bx + bw + 1, lamp = h - 56;
        x.fillStyle = '#2a2b48'; x.fillRect(pole, lamp, 2, 56); x.fillRect(pole - 4, lamp, 8, 4);
        x.fillStyle = '#ffdaae'; x.fillRect(pole - 3, lamp + 2, 6, 3);
      }
      bx += bw + 6;
    }
    return c;
  }

  function mgpScenery(name, W, H, layerWidth) {
    const far = mk(layerWidth, H), front = mk(layerWidth, H);
    const f = far.getContext('2d'), x = front.getContext('2d');
    const random = rng(93);
    const box = (ctx, color, px, y, w, h) => { ctx.fillStyle = color; ctx.fillRect(px, y, w, h); };
    let sky, extra = null;
    if (name === 'mgpStudio') {
      sky = gradient(W, H, [[0,'#130f32'],[.67,'#3b205b'],[1,'#785080']]);
      for (let px = 0; px < layerWidth; px += 128) {
        box(f, '#2b1b48', px + 5, 45, 112, 137);
        box(f, '#503064', px + 7, 47, 108, 2);
        for (let y = 60; y < 160; y += 15) box(f, '#38204e', px + 7, y, 108, 1);
        box(x, '#170f29', px + 23, 30, 80, 58);
        box(x, '#6f507f', px + 24, 31, 78, 2);
        box(x, '#2d244c', px + 27, 35, 72, 46);
        const colors = ['#d0a4e4','#75c8e4','#9fdbb1','#df85b9','#bc546f','#8278cb'];
        if (px % 256 === 0) {
          colors.forEach((c,i) => box(x, c, px + 29 + 11*i, 38, 11, 31));
        } else {
          box(x, '#302744', px + 29, 38, 66, 31);
          for (let i = 0; i < 27; i++) {
            const a = Math.round(2 + Math.abs(Math.sin(i * 1.12) * Math.sin(i * .39)) * 25);
            box(x, i % 6 === 0 ? '#e89bc6' : '#76d1c6', px + 33 + i * 2, 54 - Math.floor(a / 2), 1, a);
          }
        }
        box(x, '#191a34', px + 29, 69, 66, 8);
        box(x, '#ffcb8c', px + 91, 80, 3, 2);
        box(x, '#271733', px + 17, 0, 3, 144);
        box(x, '#65496b', px + 18, 0, 1, 98);
      }
    } else if (name === 'mgpWorkshop') {
      sky = gradient(W, H, [[0,'#26203c'],[.6,'#6f4350'],[1,'#c07961']]);
      for (let px = 0; px < layerWidth; px += 128) {
        box(f, '#4b3346', px + 9, 74, 109, 118);
        box(f, '#a76657', px + 22, 84, 79, 60);
        for (let column = 0; column < 5; column++) {
          const start = px + 24 + column * 15;
          box(f, '#f8c781', start, 87, 12, 52);
          box(f, '#c69068', start + 7, 87, 5, 52);
        }
        box(f, '#583f49', px + 20, 105, 82, 3);
        box(x, '#37293c', px, 15, 128, 6);
        box(x, '#ad765b', px, 15, 128, 1);
        box(x, '#4c3948', px + 15, 18, 2, 19+(px/128%2)*18);
        const cy = 46 + (px/128%2)*18, cx = px + 21;
        for (let i=0;i<10;i++) {
          const a = i*Math.PI/5;
          box(x, '#5f4b56', cx+Math.round(Math.cos(a)*13)-2, cy+Math.round(Math.sin(a)*13)-2, 5, 5);
        }
        blob(x,cx,cy,12,'#715961');
        blob(x,cx,cy,5,'#372d40');
        box(x, '#3a2b3d', px + 75, 160, 36, 32);
        box(x, '#966b55', px + 76, 161, 34, 2);
        for (let i=0;i<6;i++) box(x, i%2 ? '#a67956' : '#573e46', px+78+i*5, 166, 5, 5);
      }
    } else if (name === 'mgpCanopy') {
      sky = gradient(W, H, [[0,'#254c50'],[.69,'#7f9a68'],[1,'#ced083']]);
      f.drawImage(ridge(layerWidth,H,'#658a65',103,[[19,2,1],[14,6,.4]]),0,0);
      for (let i=0;i<16;i++) {
        const px=Math.round(i*32+random()*25), y=71+Math.round(random()*54);
        box(f,'#466f58',px,y,7,H-y);
        blob(f,px+3,y,12+Math.round(random()*11),'#567c59');
      }
      for (let i=0;i<7;i++) {
        const px=27+i*73, b=94+Math.round(random()*34);
        box(x,'#305549',px,b,7,H-b);
        box(x,'#638362',px+1,b,2,H-b);
        for (let j=0;j<5;j++) {
          const c=j%2 ? '#4c7757' : '#3e684e';
          blob(x,px+Math.round((random()-.5)*35),b-Math.round(random()*24),10+Math.floor(random()*14),c);
        }
        box(x,'#62946c',px-13,b+5,16,2);
        for(let j=0;j<3;j++) {
          const bx=px-12+j*4, by=b+7+j%2;
          box(x,'#b2b953',bx,by,2,4);
          box(x,'#efcf70',bx+1,by+3,3,2);
          box(x,'#f1dc82',bx+3,by+2,1,2);
        }
      }
    } else {
      sky = gradient(W, H, [[0,'#382959'],[.57,'#ba6983'],[1,'#f1ad89']]);
      extra = mk(W,H);
      blob(extra.getContext('2d'),W*.74,58,23,'#ffeab6');
      for(let px=0;px<layerWidth;px+=96){
        const peak = 65 + Math.round(random()*24);
        for(let y=peak;y<H;y++){
          const w=Math.min(58,Math.round((y-peak)*.56));
          box(f,'#825f8c',px+48-w,y,w*2+1,1);
          box(f,'#a6799a',px+48-w,y,w+1,1);
          if(y-peak<17) box(f,'#f0b3b3',px+48-w,y,w*2+1,1);
        }
      }
      x.drawImage(ridge(layerWidth,H,'#704966',54,[[13,3,.8],[6,9,.2]]),0,0);
      for(let px=12;px<layerWidth;px+=84){
        box(x,'#4a3957',px,138,3,56);
        box(x,'#4a3957',px-7,137,16,2);
        box(x,'#8a7193',px+1,139,1,32);
        box(x,'#e2c789',px-3,141,3,2);
      }
    }
    return { sky, extra, layers: [[far,.17,0],[front,.46,0]] };
  }

  const MGP_THEMES = new Set(['mgpStudio','mgpWorkshop','mgpCanopy','mgpRidge']);
  const bgCache = {};
  function background(name, W, H) {
    const key = name + W + 'x' + H;
    if (bgCache[key]) return bgCache[key];
    if (name === 'live') {
      bgCache[key] = { draw(ctx) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgba(8,0,24,0.22)'; ctx.fillRect(0, 0, W, H); } };
      return bgCache[key];
    }
    const LW = 512;
    let layers = [], sky, extra = null;
    if (MGP_THEMES.has(name)) {
      ({sky, extra, layers} = mgpScenery(name, W, H, LW));
    } else if (name === 'grotto') {
      sky = gradient(W, H, [[0, '#071c37'], [0.42, '#18415b'], [1, '#256962']]);
      const far = ridge(LW, H, '#17304a', 84, [[34, 3, 0.8], [13, 9, 1.6]], true);
      const cave = mk(LW, H), x = cave.getContext('2d');
      const random = rng(23);
      for (let px = 0; px < LW; px += 23) {
        const w = 7 + Math.round(random() * 13), h = 21 + Math.round(random() * 54);
        const ly = 177 + Math.round(random() * 18);
        for (let y = 0; y < h; y++) {
          const span = Math.min(w, 2 + Math.floor(y * 0.38));
          x.fillStyle = px % 3 ? '#246b75' : '#665d99'; x.fillRect(px, ly - h + y, span, 1);
          x.fillStyle = px % 3 ? '#62ceb3' : '#b08cda'; x.fillRect(px, ly - h + y, 1, 1);
          x.fillStyle = '#154d68'; x.fillRect(px + span - 3, ly - h + y + 1, 3, 1);
        }
      }
      const falls = mk(LW, H), f = falls.getContext('2d');
      f.fillStyle = '#226f8a'; f.fillRect(54, 20, 24, 164); f.fillRect(328, 24, 36, 163);
      for (let i = 0; i < 12; i++) {
        f.fillStyle = i % 3 ? '#43a0ac' : '#87d9cc';
        f.fillRect(54 + i * 2, 24 + i % 4, 1, 156 - i % 7);
        f.fillRect(328 + i * 3, 38 - i % 6, 1, 141 + i % 6);
      }
      f.fillStyle = '#83d6be'; f.fillRect(40, 181, 51, 3); f.fillRect(318, 182, 60, 3);
      layers = [[falls, 0.19, 0], [far, 0.23, 0], [cave, 0.41, 0]];
    } else if (name === 'monotomias') {
      sky = gradient(W, H, [[0, '#140c29'], [0.52, '#4a2450'], [1, '#100e24']]);
      extra = mk(W, H);
      const x = extra.getContext('2d'), mid = Math.round(W / 2);
      const light = x.createRadialGradient(mid, 92, 15, mid, 92, 145);
      light.addColorStop(0, '#9c4f64'); light.addColorStop(1, 'rgba(67,38,83,0)');
      x.fillStyle = light; x.fillRect(12, 0, W - 24, H);
      for (let i = 0; i < 7; i++) {
        const px = 28 + i * 53;
        x.fillStyle = '#2d1b37'; x.fillRect(px, 28, 11, 162);
        x.fillStyle = '#6a4764'; x.fillRect(px + 2, 28, 2, 162);
        x.fillStyle = '#c67a69'; x.fillRect(px - 4, 113, 19, 2);
      }
      x.strokeStyle = '#c17c68'; x.lineWidth = 2; x.strokeRect(mid - 61, 46, 122, 76);
      x.strokeStyle = '#65405f'; x.strokeRect(mid - 57, 50, 114, 68);
      x.fillStyle = '#ffd082';
      for (let y = 65; y < 103; y += 4) {
        const span = Math.min(y - 64, 104 - y);
        x.fillRect(mid - span, y, span * 2 + 1, 2);
      }
    } else if (name === 'grass') {
      sky = gradient(W, H, [[0, '#4fb8ff'], [1, '#c8f0ff']]);
      const far = ridge(LW, H, '#8cbde6', 78, [[16, 2, 0.3], [9, 5, 1.1], [4, 11, 2]]);
      { const x = far.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#eaf6ff'; x.fillRect(0, H - 100, LW, 10); }
      const clouds = mk(LW, H); { const x = clouds.getContext('2d'); [[40, 34, 1], [170, 58, 0.8], [290, 28, 1.1], [420, 50, 0.9]].forEach(([cx, cy, s]) => cloud(x, cx, cy, s, '#ffffff', '#d6efff')); }
      const near = ridge(LW, H, '#58c25e', 44, [[14, 3, 0.5], [7, 7, 2.0]]);
      { const x = near.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#46a84f'; for (let i = 0; i < LW; i += 12) for (let j = H - 60; j < H; j += 10) x.fillRect(i + ((j / 10) % 2) * 6, j, 2, 2); }
      extra = mk(W, H); { const x = extra.getContext('2d'); const glow = x.createRadialGradient(W * 0.2, 40, 4, W * 0.2, 40, 60); glow.addColorStop(0, 'rgba(255,250,210,0.9)'); glow.addColorStop(1, 'rgba(255,240,170,0)'); x.fillStyle = glow; x.fillRect(0, 0, W * 0.5, 110); blob(x, W * 0.2, 40, 11, '#fffbe0'); }
      layers = [[far, 0.12, 0], [clouds, 0.2, 0.15], [near, 0.35, 0]];
    } else if (name === 'tropical' || name === 'title' || name === 'sonicHills') {
      const sonic = name === 'sonicHills';
      sky = gradient(W, H, [[0, '#1f7fff'], [0.62, '#8fd8ff'], [0.63, '#2a8ff0'], [1, '#1a6ad0']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d'); const hz = Math.round(H * 0.63);
        const r = rng(3);
        for (let i = 0; i < 40; i++) { x.fillStyle = r() > 0.5 ? '#bfe8ff' : '#6fc0ff'; x.fillRect((r() * W) | 0, hz + 2 + ((r() * (H - hz)) | 0), 3 + ((r() * 10) | 0), 1); }
      }
      const clouds = mk(LW, H); { const x = clouds.getContext('2d'); [[60, 30, 1.1], [220, 50, 0.8], [360, 24, 1.2], [470, 58, 0.7]].forEach(([cx, cy, s]) => cloud(x, cx, cy, s, '#ffffff', '#cfeeff')); }
      // montanhas com faixas e cachoeiras
      const far = ridge(LW, H, '#2f9a5a', 96, [[18, 2, 0.6], [10, 5, 1.7], [5, 13, 0.4]]);
      { const x = far.getContext('2d'); x.globalCompositeOperation = 'source-atop';
        for (let j = H - 110; j < H; j += 8) { x.fillStyle = (j / 8) % 2 ? '#24804a' : '#2f9a5a'; x.fillRect(0, j, LW, 4); }
      }
      // cachoeiras: saem perto dos picos da montanha e são animadas (desenhadas atrás dos morros)
      const farTop = (i) => H - Math.round(96 + 18 * Math.sin((i / LW) * Math.PI * 4 + 0.6) + 10 * Math.sin((i / LW) * Math.PI * 10 + 1.7) + 5 * Math.sin((i / LW) * Math.PI * 26 + 0.4));
      const falls = [[30, 150], [200, 320], [360, 480]].map(([a, b]) => { let best = a; for (let i = a; i < b; i++) if (farTop(i) < farTop(best)) best = i; return { x: best + 6, top: farTop(best + 6) + 10 }; });
      const drawFalls = (ctx, camX, t) => {
        for (const f of falls) {
          let sx = -Math.round((camX * 0.15) % LW) + f.x; if (sx > W) sx -= LW; if (sx < -20) sx += LW;
          if (sx < -12 || sx > W + 4) continue;
          const top = f.top - 6, bottom = H - 36;
          // fenda escura no pico de onde a água sai
          ctx.fillStyle = 'rgba(20,70,50,0.55)'; ctx.fillRect(sx + 1, top - 2, 5, 3);
          for (let y = top; y < bottom; y++) {
            const d = y - top, w = d < 6 ? 3 + Math.floor(d / 2) : 7 + (d > 40 ? 1 : 0), x0 = sx + 4 - Math.ceil(w / 2);
            for (let c = 0; c < w; c++) {
              const edge = c === 0 || c === w - 1;
              const streak = !edge && ((y - Math.floor(t * (1.4 + (c % 3) * 0.35)) + c * 13 + f.x) % 17 + 17) % 17 < 6;
              ctx.fillStyle = edge ? 'rgba(110,190,235,0.75)' : streak ? 'rgba(255,255,255,0.95)' : 'rgba(185,230,255,0.72)';
              ctx.fillRect(x0 + c, y, 1, 1);
            }
          }
          // laguinho e espuma no pé da montanha
          ctx.fillStyle = 'rgba(90,170,230,0.85)'; ctx.fillRect(sx - 7, bottom, 22, 3); ctx.fillRect(sx - 4, bottom + 3, 16, 2);
          ctx.fillStyle = 'rgba(200,240,255,0.9)'; ctx.fillRect(sx - 7, bottom, 22, 1);
          for (let i = 0; i < 5; i++) { const ph = (t * 0.08 + i * 1.3); const r = 2 + Math.round((Math.sin(ph) + 1) * 1.2); blob(ctx, sx + 4 + (i - 2) * 4, bottom - 1 - r / 2, r, 'rgba(255,255,255,0.8)'); }
        }
      };
      // morros arredondados com palmeiras
      const near = ridge(LW, H, '#3cc34f', 44, [[12, 3, 0.2], [7, 8, 2.4]]);
      { const x = near.getContext('2d');
        x.globalCompositeOperation = 'source-atop';
        for (let j = H - 70; j < H; j += 6) { x.fillStyle = (j / 6) % 2 ? '#c4691f' : '#8e4513'; x.fillRect(0, j + 20, LW, 3); }
        x.globalCompositeOperation = 'source-over';
        if (sonic) {
          // A volta quadriculada é parte da paisagem das colinas.
          const cx = 222, cy = H - 61;
          for (let dy = -27; dy <= 27; dy++) for (let dx = -27; dx <= 27; dx++) {
            const r = Math.hypot(dx, dy);
            if (r < 19 || r > 27) continue;
            x.fillStyle = r > 25 ? '#56da46' : (Math.floor((dx + 27) / 5) + Math.floor((dy + 27) / 5)) % 2 ? '#ad591f' : '#d79240';
            x.fillRect(cx + dx, cy + dy, 1, 1);
          }
        }
        const palm = (px, py, h) => {
          for (let i = 0; i < h; i += 3) { x.fillStyle = (i / 3) % 2 ? '#8a5a2a' : '#b07a3a'; x.fillRect(px + Math.round(Math.sin(i / 10) * 2), py - i, 4, 3); }
          const tx = px + Math.round(Math.sin(h / 10) * 2) + 2, ty = py - h;
          x.fillStyle = '#1f9a34';
          [[-1, 0], [1, 0], [-1, 0.6], [1, 0.6], [0, -1]].forEach(([dx, dy]) => { for (let k = 0; k < 12; k++) x.fillRect(tx + dx * k - 1, ty + Math.round(dy * k + (k * k) / 14), 3, 2); });
          x.fillStyle = '#3fd04a'; [[-1, 0], [1, 0]].forEach(([dx]) => { for (let k = 0; k < 9; k++) x.fillRect(tx + dx * k, ty - 1 + Math.round((k * k) / 14), 2, 1); });
        };
        [[40, 26], [150, 34], [300, 22], [420, 30]].forEach(([px, h]) => { let top = H; for (let j = 0; j < H; j++) { if (x.getImageData(px + 1, j, 1, 1).data[3] > 0) { top = j; break; } } palm(px, top + 2, h); });
      }
      { const x = extra.getContext('2d'); const sx = W * 0.78, sy = 46;
        const glow = x.createRadialGradient(sx, sy, 4, sx, sy, 70); glow.addColorStop(0, 'rgba(255,250,210,0.9)'); glow.addColorStop(0.25, 'rgba(255,240,170,0.45)'); glow.addColorStop(1, 'rgba(255,240,170,0)');
        x.fillStyle = glow; x.fillRect(sx - 70, sy - 70, 140, 140); blob(x, sx, sy, 13, '#fffbe0'); }
      const dist = ridge(LW, H, '#7ab8e8', 108, [[22, 1, 0.3], [12, 3, 1.4], [6, 7, 2.2]]);
      { const x = dist.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#e8f6ff'; for (let i = 0; i < LW; i++) { const top = H - (108 + 22 * Math.sin((i / LW) * Math.PI * 2 + 0.3) + 12 * Math.sin((i / LW) * Math.PI * 6 + 1.4) + 6 * Math.sin((i / LW) * Math.PI * 14 + 2.2)); x.fillRect(i, Math.round(top), 1, 5); } }
      layers = [[dist, 0.05, 0], [clouds, 0.08, 0.1], [far, 0.15, 0, drawFalls], [near, 0.35, 0]];
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
    } else if (name === 'beach') {
      sky = gradient(W, H, [[0, '#ff7a59'], [0.45, '#ffc46b'], [0.6, '#ffe7a8'], [0.61, '#2a8ff0'], [1, '#1f6ad8']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d'); const cx = W * 0.3, cy = H * 0.6, r = 34;
        for (let j = -r; j <= 0; j++) { const w = Math.round(Math.sqrt(r * r - j * j)); if (j < -6 || Math.floor(-j / 4) % 2 === 0) { x.fillStyle = '#fff3b0'; x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2, 1); } }
        const rr = rng(8); for (let i = 0; i < 46; i++) { x.fillStyle = rr() > 0.5 ? '#ffe0a0' : '#8ac8ff'; x.fillRect((rr() * W) | 0, (H * 0.62 + rr() * H * 0.38) | 0, 3 + ((rr() * 9) | 0), 1); }
      }
      const clouds = mk(LW, H); { const x = clouds.getContext('2d'); [[80, 40, 1], [300, 26, 1.2], [450, 60, 0.7]].forEach(([cx, cy, s]) => cloud(x, cx, cy, s, '#ffd6b0', '#ffb88a')); }
      const isl = ridge(LW, H, '#e8a86a', 70, [[10, 2, 0.4], [6, 5, 1.2]]);
      { const x = isl.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#f2c88a'; x.fillRect(0, H - 70, LW, 8); }
      const palms = mk(LW, H); { const x = palms.getContext('2d'); [[30, 60], [190, 70], [340, 54], [470, 66]].forEach(([px, h]) => palmTree(x, px, H - 2, h)); }
      { const x = extra.getContext('2d'); const bx = W * 0.62, by = Math.round(H * 0.6) - 1;
        x.fillStyle = '#5a3a5a'; x.fillRect(bx, by - 3, 16, 3); x.fillRect(bx + 2, by, 12, 1); x.fillRect(bx + 7, by - 14, 1, 11);
        x.fillStyle = '#fff3e0'; for (let j = 0; j < 9; j++) x.fillRect(bx + 8, by - 13 + j, Math.ceil(j * 0.7), 1); }
      layers = [[clouds, 0.06, 0.08], [isl, 0.15, 0], [palms, 0.45, 0]];
    } else if (name === 'fair') {
      sky = gradient(W, H, [[0, '#0a0620'], [1, '#2a1450']]);
      const stands = mk(LW, H); {
        const x = stands.getContext('2d'); const r = rng(14);
        for (let sx = 0; sx < LW; sx += 64) {
          const h = 70 + ((r() * 40) | 0); x.fillStyle = '#16122e'; x.fillRect(sx + 4, H - h, 56, h);
          x.fillStyle = ['#e8402e', '#2f7bff', '#ffd23f', '#3bd16f', '#ff5ab4'][(sx / 64) % 5]; x.fillRect(sx + 4, H - h, 56, 8);
          const g = x.createLinearGradient(0, H - h + 14, 0, H - h + 44); g.addColorStop(0, '#5a8aff'); g.addColorStop(1, '#2a3a8a');
          x.fillStyle = '#05040c'; x.fillRect(sx + 12, H - h + 12, 40, 30); x.fillStyle = g; x.fillRect(sx + 14, H - h + 14, 36, 26);
          x.fillStyle = 'rgba(255,255,255,0.5)'; x.fillRect(sx + 18, H - h + 20, 10, 2); x.fillRect(sx + 18, H - h + 26, 22, 2);
        }
      }
      const crowd = mk(LW, H); { const x = crowd.getContext('2d'); const r = rng(77); for (let i = 0; i < LW; i += 7) { const h = 14 + ((r() * 8) | 0); x.fillStyle = '#0c0a1c'; x.fillRect(i, H - h, 6, h); x.fillRect(i + 1, H - h - 4, 4, 4); } }
      layers = [[stands, 0.2, 0], [crowd, 0.45, 0]];
    } else if (name === 'sea') {
      sky = gradient(W, H, [[0, '#2a8fe0'], [0.5, '#1a5ab0'], [1, '#0c2a6a']]);
      const weed = ridge(LW, H, '#1a4a8a', 60, [[20, 3, 0.2], [12, 11, 1.4], [8, 29, 0.8]]);
      const coral = mk(LW, H); { const x = coral.getContext('2d'); const r = rng(31); for (let i = 0; i < 16; i++) { const cx = (r() * LW) | 0, h = 20 + ((r() * 30) | 0); x.fillStyle = r() > 0.5 ? '#ff7aa8' : '#ffb04a'; for (let j = 0; j < h; j++) x.fillRect(cx + Math.round(Math.sin(j / 5) * 3), H - j, 3, 1); x.fillRect(cx - 4, H - h, 11, 3); } }
      layers = [[weed, 0.15, 0], [coral, 0.4, 0]];
    } else if (name === 'edit') {
      sky = gradient(W, H, [[0, '#101018'], [1, '#1c1c28']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d');
        x.fillStyle = '#05050a'; x.fillRect(W / 2 - 90, 34, 180, 90); x.fillStyle = '#2a2a3a'; x.fillRect(W / 2 - 92, 32, 184, 2);
        ['#e8402e', '#ffd23f', '#3bd16f', '#2fe0ff', '#2f7bff', '#ff5ab4', '#ffffff'].forEach((c, i) => { x.fillStyle = c; x.fillRect(W / 2 - 86 + i * 25, 38, 25, 60); });
        x.fillStyle = '#1a1a24'; x.fillRect(W / 2 - 86, 98, 175, 22);
      }
      const tracks = mk(LW, H); { const x = tracks.getContext('2d'); const r = rng(5); const cols = ['#3a8aff', '#3bd16f', '#9b4dff', '#ff8a3d'];
        for (let tr = 0; tr < 4; tr++) { const y = H - 92 + tr * 18; x.fillStyle = '#16161e'; x.fillRect(0, y, LW, 14); for (let cx = 0; cx < LW;) { const w = 30 + ((r() * 60) | 0); x.fillStyle = cols[tr]; x.fillRect(cx + 2, y + 2, w - 4, 10); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(cx + 2, y + 2, w - 4, 2); cx += w + ((r() * 14) | 0); } } }
      { const x = tracks.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(14,14,22,0.68)'; x.fillRect(0, 0, LW, H); }
      layers = [[tracks, 0.3, 0]];
    } else if (name === 'roofs') {
      sky = gradient(W, H, [[0, '#59446a'], [0.42, '#d9806e'], [0.77, '#ffd29a'], [1, '#e29070']]);
      extra = mk(W, H);
      const sun = extra.getContext('2d');
      const sx = Math.round(W * 0.76), sy = 102;
      const light = sun.createRadialGradient(sx, sy, 4, sx, sy, 62);
      light.addColorStop(0, '#ffedaa'); light.addColorStop(1, 'rgba(255,190,122,0)');
      sun.fillStyle = light; sun.fillRect(sx - 62, sy - 62, 124, 124);
      blob(sun, sx, sy, 24, '#fff0b9');
      const hills = ridge(LW, H, '#bd7b7a', 78, [[17, 2, 1], [9, 5, 3], [5, 8, 0.5]]);
      layers = [[hills, 0.10, 0], [rooftops(LW, H, false), 0.23, 0], [rooftops(LW, H, true), 0.48, 0]];
    } else if (name === 'snowCity') {
      sky = gradient(W, H, [[0, '#222755'], [0.42, '#4c5690'], [0.74, '#af91b7'], [1, '#e2aac3']]);
      extra = mk(W, H);
      const moon = extra.getContext('2d');
      blob(moon, Math.round(W * 0.77), 56, 16, '#fff0dc');
      const distant = ridge(LW, H, '#697bb3', 103, [[43, 3, 0.1], [22, 7, 0.9], [9, 13, 2.5]]);
      const skyline = mk(LW, H), x = skyline.getContext('2d');
      for (const px of [112, 370]) {
        x.fillStyle = '#364164'; x.fillRect(px, 89, 5, 100); x.fillRect(px + 2, 59, 2, 30);
        x.fillRect(px - 7, 90, 20, 5); x.fillRect(px - 4, 95, 14, 2);
        x.fillStyle = '#9aa5c8'; x.fillRect(px - 6, 90, 18, 1);
        x.fillStyle = '#f3a99e'; x.fillRect(px + 2, 59, 2, 2);
      }
      layers = [[distant, 0.08, 0], [snowPeaks(LW, H), 0.17, 0], [skyline, 0.30, 0], [winterStreet(LW, H), 0.46, 0]];
    } else if (name === 'snow') {
      sky = gradient(W, H, [[0, '#0e1a4a'], [0.55, '#3a5aa8'], [1, '#a8c8f0']]);
      extra = mk(W, H); { const x = extra.getContext('2d'); const r = rng(9); for (let i = 0; i < 60; i++) { x.fillStyle = r() > 0.8 ? '#ffffff' : 'rgba(255,255,255,0.6)'; x.fillRect((r() * W) | 0, (r() * H * 0.45) | 0, 1, 1); } }
      const far = ridge(LW, H, '#e8f0ff', 112, [[24, 2, 0.4], [14, 5, 1.2], [7, 11, 2.1]]);
      { const x = far.getContext('2d'); x.globalCompositeOperation = 'source-atop'; for (let j = H - 80; j < H; j += 6) { x.fillStyle = (j / 6) % 2 ? '#c8d8f0' : '#dbe6f8'; x.fillRect(0, j, LW, 3); } }
      const pines = mk(LW, H); {
        const x = pines.getContext('2d'); const r = rng(21);
        for (let i = 0; i < 30; i++) {
          const px = (r() * LW) | 0, base = H - 34 - ((r() * 22) | 0), s = 0.7 + r() * 0.6;
          x.fillStyle = '#4a3020'; x.fillRect(px - 1, base, 3, 6);
          for (let k = 0; k < 4; k++) { const w = Math.round((13 - k * 3) * s), y0 = base - Math.round((k * 6 + 7) * s); for (let j = 0; j < Math.round(8 * s); j++) { const hw = Math.round(w * (j / (8 * s))); x.fillStyle = '#1f4a3a'; x.fillRect(px - hw, y0 + j, hw * 2 + 1, 1); x.fillStyle = '#ffffff'; if (j % 4 === 3) x.fillRect(px - hw, y0 + j, 2, 1); } }
          x.fillStyle = '#ffffff'; x.fillRect(px - 1, base - Math.round(31 * s), 3, 2);
        }
      }
      const near = ridge(LW, H, '#ffffff', 38, [[10, 3, 0.5], [6, 9, 1.7]]);
      { const x = near.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#d8e6f5'; x.fillRect(0, H - 18, LW, 18); }
      layers = [[far, 0.08, 0], [pines, 0.22, 0], [near, 0.4, 0]];
    } else if (name === 'city') {
      sky = gradient(W, H, [[0, '#0b0620'], [0.6, '#3a1a5a'], [1, '#ff7a5a']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d'); const r = rng(4);
        for (let i = 0; i < 50; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; x.fillRect((r() * W) | 0, (r() * H * 0.5) | 0, 1, 1); }
        blob(x, W * 0.8, 40, 16, '#fff6d8'); x.fillStyle = '#e8dcb8'; x.fillRect(W * 0.8 - 6, 34, 4, 3); x.fillRect(W * 0.8 + 3, 44, 5, 3);
      }
      const town = (seed, base, top, body, win, lit) => {
        const c = mk(LW, H), x = c.getContext('2d'), r = rng(seed);
        for (let bx = 0; bx < LW;) {
          const w = 20 + ((r() * 26) | 0), h = base + ((r() * top) | 0);
          x.fillStyle = body; x.fillRect(bx, H - h, w, h);
          for (let wy = H - h + 6; wy < H - 6; wy += 7) for (let wx = bx + 4; wx < bx + w - 4; wx += 6) { if (r() < lit) { x.fillStyle = r() > 0.3 ? win : '#7cf0ff'; x.fillRect(wx, wy, 3, 3); } }
          if (r() > 0.6) { x.fillStyle = body; x.fillRect(bx + (w >> 1), H - h - 10, 1, 10); x.fillStyle = '#ff3b3b'; x.fillRect(bx + (w >> 1) - 1, H - h - 12, 3, 2); }
          bx += w + ((r() * 4) | 0);
        }
        return c;
      };
      layers = [[town(7, 70, 60, '#1c1838', '#6a5aa0', 0.25), 0.12, 0], [town(13, 40, 50, '#120e26', '#ffd27a', 0.4), 0.3, 0]];
    } else if (name === 'desert') {
      sky = gradient(W, H, [[0, '#ff9a4a'], [0.5, '#ffd27a'], [1, '#fff0c0']]);
      extra = mk(W, H); { const x = extra.getContext('2d'); const sx = W * 0.3, sy = H * 0.42; const g = x.createRadialGradient(sx, sy, 10, sx, sy, 90); g.addColorStop(0, 'rgba(255,250,200,0.8)'); g.addColorStop(1, 'rgba(255,240,180,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); blob(x, sx, sy, 36, '#fff2b0'); }
      const mesas = mk(LW, H); { const x = mesas.getContext('2d'); [[40, 70, 60], [200, 90, 46], [360, 60, 70]].forEach(([mx, w, h]) => { x.fillStyle = '#c8743a'; for (let j = 0; j < h; j++) { const hw = Math.round(w / 2 + j * 0.25); x.fillRect(mx - hw, H - 40 - h + j, hw * 2, 1); } x.fillStyle = '#e08a4a'; x.fillRect(mx - w / 2, H - 40 - h, w, 3); for (let j = 8; j < h; j += 10) { x.fillStyle = '#b0622e'; x.fillRect(mx - w / 2, H - 40 - h + j, w, 1); } }); }
      const mid = ridge(LW, H, '#f0b870', 52, [[10, 3, 0.9], [5, 7, 0.2]]);
      const near = ridge(LW, H, '#f6c88a', 30, [[8, 4, 1.4], [4, 9, 0.6]]);
      { const x = near.getContext('2d'); const r = rng(33); for (let i = 0; i < 7; i++) { const cx = (r() * LW) | 0, h = 14 + ((r() * 12) | 0), b = H - 22; x.fillStyle = '#2f7a3e'; x.fillRect(cx, b - h, 4, h); x.fillRect(cx - 5, b - h + 5, 5, 3); x.fillRect(cx - 5, b - h, 3, 6); x.fillRect(cx + 4, b - h + 8, 5, 3); x.fillRect(cx + 7, b - h + 3, 3, 6); x.fillStyle = '#4a9a5a'; x.fillRect(cx + 1, b - h, 1, h); } }
      layers = [[mesas, 0.08, 0], [mid, 0.2, 0], [near, 0.38, 0]];
    } else if (name === 'bat') {
      sky = gradient(W, H, [[0, '#07031a'], [0.6, '#2a1050'], [1, '#5a2a8a']]);
      extra = mk(W, H); {
        const x = extra.getContext('2d'); const r = rng(17);
        for (let i = 0; i < 70; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; x.fillRect((r() * W) | 0, (r() * H * 0.55) | 0, 1, 1); }
        const mx = W * 0.72, my = 52; const g = x.createRadialGradient(mx, my, 10, mx, my, 70); g.addColorStop(0, 'rgba(255,240,180,0.55)'); g.addColorStop(1, 'rgba(255,240,180,0)');
        x.fillStyle = g; x.fillRect(mx - 70, my - 70, 140, 140); blob(x, mx, my, 26, '#fff4c8'); x.fillStyle = '#e8dca8'; x.fillRect(mx - 9, my - 6, 5, 4); x.fillRect(mx + 6, my + 6, 7, 4); x.fillRect(mx - 2, my + 12, 4, 3);
      }
      const towers = (seed, base, top, body, win) => {
        const c = mk(LW, H), x = c.getContext('2d'), r = rng(seed);
        for (let bx = 0; bx < LW;) {
          const w = 16 + ((r() * 22) | 0), h = base + ((r() * top) | 0);
          x.fillStyle = body; x.fillRect(bx, H - h, w, h);
          for (let j = 0; j < 10; j++) { const hw = Math.round((w / 2) * (1 - j / 10)); x.fillRect(bx + w / 2 - hw, H - h - j, hw * 2, 1); }
          x.fillRect(bx + (w >> 1), H - h - 18, 1, 8);
          for (let wy = H - h + 8; wy < H - 8; wy += 10) if (r() < 0.5) { x.fillStyle = win; x.fillRect(bx + (w >> 1) - 1, wy, 3, 5); x.fillStyle = body; }
          bx += w + 2 + ((r() * 6) | 0);
        }
        return c;
      };
      layers = [[towers(5, 80, 60, '#1a0e30', '#b48aff'), 0.1, 0], [towers(9, 44, 50, '#0c0618', '#ffd27a'), 0.28, 0]];
    } else if (name === 'buffer') {
      sky = gradient(W, H, [[0, '#0a0a10'], [1, '#22222c']]);
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
        layers.forEach(([img, f, drift, after], i) => {
          if (i === layers.length - 1 && HAZE[name]) { ctx.fillStyle = HAZE[name]; ctx.fillRect(0, 0, W, H); }
          let off = -Math.round((camX * f + t * drift) % LW);
          if (off > 0) off -= LW;
          for (let x = off; x < W; x += LW) ctx.drawImage(img, x, 0);
          if (after) after(ctx, camX, t);
        });
        animExtras(ctx, name, camX, t, W, H);
        if (name === 'boss') {
          const r = rng(Math.floor(t / 6));
          for (let i = 0; i < 6; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,90,180,0.18)' : 'rgba(47,224,255,0.16)'; ctx.fillRect((r() * W) | 0, (r() * H * 0.6) | 0, (8 + r() * 60) | 0, (2 + r() * 6) | 0); }
        }
        if (name === 'edit') { const span = W + 40, ph = ((((t * 0.6 - camX * 0.3) % span) + span) % span) - 20; /* a linha anda presa à trilha do fundo, não à tela */ ctx.fillStyle = '#ff3b3b'; ctx.fillRect(Math.round(ph), 0, 2, H); ctx.fillRect(Math.round(ph) - 3, 0, 8, 6); }
        if (name === 'sea') {
          ctx.fillStyle = 'rgba(255,255,255,0.06)'; for (let i = 0; i < 5; i++) { const bx = ((i * 90 - camX * 0.1 + t * 0.2) % (W + 80)) - 40; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 30, 0); ctx.lineTo(bx + 80, H); ctx.lineTo(bx + 40, H); ctx.fill(); }
          ctx.fillStyle = 'rgba(220,240,255,0.7)'; for (let i = 0; i < 18; i++) { const px = ((i * 71 - camX * 0.5) % W + W) % W; const py = H - ((t * (0.4 + (i % 3) * 0.2) + i * 37) % H); ctx.fillRect(Math.round(px), Math.round(py), 2, 2); }
        }
        if (name === 'buffer') {
          for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; const k = ((i - Math.floor(t / 5)) % 12 + 12) % 12; ctx.fillStyle = 'rgba(255,255,255,' + (0.04 + (k / 12) * 0.16) + ')'; ctx.fillRect(Math.round(W / 2 + Math.cos(a) * 70 - 6), Math.round(96 + Math.sin(a) * 70 - 6), 12, 12); }
          ctx.fillStyle = 'rgba(255,255,255,0.04)'; for (let j = 0; j < H; j += 3) ctx.fillRect(0, j, W, 1);
        }
        if (name === 'fair') { for (let i = 0; i < 4; i++) { const a = Math.sin(t * 0.02 + i * 1.7) * 0.5; ctx.fillStyle = ['rgba(47,224,255,0.07)', 'rgba(255,90,180,0.07)', 'rgba(255,210,63,0.07)', 'rgba(59,209,111,0.07)'][i]; ctx.beginPath(); const bx = 40 + i * 100; ctx.moveTo(bx, H); ctx.lineTo(bx + Math.sin(a) * 300 - 20, 0); ctx.lineTo(bx + Math.sin(a) * 300 + 30, 0); ctx.fill(); } }
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

  return { HERO, ENEMY, ITEM, NPC, SONIC, props, tiles, background, THEMES, mk, rng };
})();
