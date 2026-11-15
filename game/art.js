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
  // Rafael: cabelo loiro em chanel com franja e batom vermelho
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
  // Scott: cabelo loiro espetado, olhar cansado, camisa branca e gravata
  const SCOTT = fromRows([
    '.k..k.kk.k..k...',
    '..kykyyykyyk....',
    '..kyyyyyyyyyk...',
    '.kyyYyyyYyyyyk..',
    '..kyssssssssyk..',
    '..kysqqssqqsyk..',
    '..kysskssksssk..',
    '...kssssSsssk...',
    '....kssrrssk....',
    '...kwwwkkwwwk...',
    '..kwwwwkkwwwwk..',
    '..kswwwkkwwwsk..',
    '...kqqqkkqqqk...',
    '...kqqqkkqqqk...',
    '...kqqk..kqqk...',
    '...knnk..knnk...',
  ], { ...BASE, y: '#f4e6a8', Y: '#d8c27a', q: '#1a1a24' }, 16);
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
      } else if (th.style === 'bands') {
        for (let j = 0; j < 16; j++) { x.fillStyle = Math.floor(j / 4) % 2 ? th.g2 : th.g1; x.fillRect(0, j, 16, 1); }
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
    tropical: 'rgba(190,230,255,0.16)', title: 'rgba(190,230,255,0.16)', grass: 'rgba(200,235,255,0.16)',
    beach: 'rgba(255,220,180,0.14)', sky: 'rgba(255,200,230,0.12)', cave: 'rgba(8,6,26,0.25)', castle: 'rgba(30,5,10,0.22)',
    fair: 'rgba(20,10,50,0.2)', sea: 'rgba(20,70,150,0.2)',
  };
  const wrapX = (v, span) => ((v % span) + span) % span;
  function bird(ctx, x, y, t) {
    const up = (t >> 3) % 2;
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(Math.round(x) - 3, Math.round(y) - up, 3, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - up, 3, 1); ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
  // detalhes animados de cada cenário
  function animExtras(ctx, name, camX, t, W, H) {
    if (name === 'tropical' || name === 'title' || name === 'grass' || name === 'beach') {
      for (let i = 0; i < 3; i++) bird(ctx, wrapX(i * 140 + t * (0.35 + i * 0.08) - camX * 0.1, 460) - 40, 36 + i * 14 + Math.sin(t * 0.03 + i) * 4, t + i * 5);
    } else if (name === 'cave') {
      for (let i = 0; i < 7; i++) {
        const x = wrapX(i * 83 - camX * 0.2, W + 40) - 20, y = 120 + ((i * 37) % 60), a = 0.12 + 0.1 * Math.sin(t * 0.05 + i * 1.3);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 18); g.addColorStop(0, i % 2 ? `rgba(95,214,255,${a})` : `rgba(255,90,180,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(x - 18, y - 18, 36, 36);
      }
    } else if (name === 'sky') {
      for (let i = 0; i < 26; i++) { if ((t + i * 13) % 90 < 60) { ctx.fillStyle = i % 4 ? 'rgba(255,255,255,0.8)' : '#ffd23f'; ctx.fillRect(wrapX(i * 47 - camX * 0.04, W), (i * 29) % 70 + 4, 1, 1); } }
    } else if (name === 'castle') {
      for (let i = 0; i < 16; i++) { const life = (t * (0.6 + (i % 4) * 0.15) + i * 37) % H; ctx.fillStyle = i % 3 ? 'rgba(255,140,40,0.75)' : 'rgba(255,220,90,0.85)'; ctx.fillRect(Math.round(wrapX(i * 61 - camX * 0.5 + Math.sin((t + i * 20) * 0.03) * 6, W)), Math.round(H - life), 1, 2); }
    } else if (name === 'fair') {
      const off = -camX * 0.6;
      ctx.fillStyle = '#0c0a1c';
      for (let x = 0; x < W + 64; x += 2) { const sx = wrapX(x + off, W + 64) - 32; const yy = 14 + Math.round(Math.sin((x / 64) * Math.PI) * 10); ctx.fillRect(Math.round(sx), yy, 2, 1); }
      for (let x = 8; x < W + 64; x += 16) { const sx = wrapX(x + off, W + 64) - 32; const yy = 15 + Math.round(Math.sin((x / 64) * Math.PI) * 10); const on = ((x / 16 + (t >> 4)) % 3); ctx.fillStyle = ['#ff5ab4', '#ffd23f', '#2fe0ff'][on]; ctx.fillRect(Math.round(sx) - 1, yy + 1, 3, 3); }
    } else if (name === 'sea') {
      ctx.fillStyle = 'rgba(10,40,100,0.55)';
      for (let i = 0; i < 9; i++) { const x = wrapX(i * 31 + t * 0.4 - camX * 0.3, W + 120) - 60 + (i % 3) * 8, y = 70 + (i % 3) * 7 + Math.sin(t * 0.04 + i) * 2; ctx.fillRect(Math.round(x), Math.round(y), 5, 2); ctx.fillRect(Math.round(x) - 2, Math.round(y) - 1, 2, 4); }
    }
  }

  const bgCache = {};
  function background(name, W, H) {
    const key = name + W + 'x' + H;
    if (bgCache[key]) return bgCache[key];
    const LW = 512;
    let layers = [], sky, extra = null;
    if (name === 'grass') {
      sky = gradient(W, H, [[0, '#4fb8ff'], [1, '#c8f0ff']]);
      const far = ridge(LW, H, '#8cbde6', 78, [[16, 2, 0.3], [9, 5, 1.1], [4, 11, 2]]);
      { const x = far.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#eaf6ff'; x.fillRect(0, H - 100, LW, 10); }
      const clouds = mk(LW, H); { const x = clouds.getContext('2d'); [[40, 34, 1], [170, 58, 0.8], [290, 28, 1.1], [420, 50, 0.9]].forEach(([cx, cy, s]) => cloud(x, cx, cy, s, '#ffffff', '#d6efff')); }
      const near = ridge(LW, H, '#58c25e', 44, [[14, 3, 0.5], [7, 7, 2.0]]);
      { const x = near.getContext('2d'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#46a84f'; for (let i = 0; i < LW; i += 12) for (let j = H - 60; j < H; j += 10) x.fillRect(i + ((j / 10) % 2) * 6, j, 2, 2); }
      extra = mk(W, H); { const x = extra.getContext('2d'); const glow = x.createRadialGradient(W * 0.2, 40, 4, W * 0.2, 40, 60); glow.addColorStop(0, 'rgba(255,250,210,0.9)'); glow.addColorStop(1, 'rgba(255,240,170,0)'); x.fillStyle = glow; x.fillRect(0, 0, W * 0.5, 110); blob(x, W * 0.2, 40, 11, '#fffbe0'); }
      layers = [[far, 0.12, 0], [clouds, 0.2, 0.15], [near, 0.35, 0]];
    } else if (name === 'tropical' || name === 'title') {
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

  return { HERO, ENEMY, ITEM, NPC, tiles, background, THEMES, mk, rng };
})();
