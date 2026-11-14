'use strict';
// =====================================================================
//  MATHEUS TOP GAMER — A AVENTURA 100% GAMER
//  Jogo de plataforma 2D. Motor, física, inimigos, chefão e telas.
// =====================================================================
(() => {
  const W = 384, H = 224, T = 16;
  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  const { HERO, ENEMY, ITEM } = ART;
  let S = 1;

  // ------------------------------------------------------------ TELA
  const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) document.body.classList.add('is-touch');
  function resize() {
    const top = document.querySelector('.g-top');
    const full = !!document.fullscreenElement;
    const portrait = window.innerHeight > window.innerWidth;
    const ctrlH = isTouch && portrait ? 210 : 0;
    const availW = Math.min(window.innerWidth - (full ? 0 : 16), 1600);
    const availH = window.innerHeight - (full || !top ? 0 : top.offsetHeight) - ctrlH - (full ? 0 : 16);
    let w = availW, h = (w * H) / W;
    if (h > availH) { h = Math.max(140, availH); w = (h * W) / H; }
    cv.style.width = Math.floor(w) + 'px';
    cv.style.height = Math.floor(h) + 'px';
    const dpr = window.devicePixelRatio || 1;
    S = Math.max(1, Math.min(6, Math.ceil((w * dpr) / W)));
    cv.width = W * S; cv.height = H * S;
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  document.addEventListener('fullscreenchange', resize);

  // ------------------------------------------------------------ SAVE
  const SAVE_KEY = 'mtgame.v1';
  let save = { unlocked: 1, best: 0, muted: false };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = { ...save, ...s }; } catch (e) { /* sem storage */ }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* sem storage */ } }
  AUDIO.setMuted(!!save.muted);

  // ------------------------------------------------------------ ENTRADA
  const KMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump', KeyK: 'jump', KeyX: 'run', KeyJ: 'run', ShiftLeft: 'run', ShiftRight: 'run',
    Enter: 'start', Escape: 'start', KeyP: 'start',
  };
  const kb = {}, touch = {}, pad = {};
  const I = {}, prev = {};
  const BTN = ['left', 'right', 'up', 'down', 'jump', 'run', 'start'];
  let audioReady = false;
  function wakeAudio() {
    if (!audioReady) { AUDIO.init(); audioReady = true; }
    AUDIO.resume();
  }
  window.addEventListener('keydown', (e) => {
    wakeAudio();
    if (e.code === 'KeyM') { toggleMute(); return; }
    const k = KMAP[e.code];
    if (k) { kb[k] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => { const k = KMAP[e.code]; if (k) { kb[k] = false; e.preventDefault(); } });
  window.addEventListener('blur', () => { for (const k in kb) kb[k] = false; for (const k in touch) touch[k] = false; });

  // controles de toque
  document.querySelectorAll('[data-k]').forEach((el) => {
    const k = el.dataset.k;
    const on = (e) => { e.preventDefault(); wakeAudio(); touch[k] = true; el.classList.add('on'); if (el.setPointerCapture) try { el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } };
    const off = (e) => { e.preventDefault(); touch[k] = false; el.classList.remove('on'); };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('lostpointercapture', off);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  const dpad = document.getElementById('dpad');
  if (dpad) {
    const set = (e) => {
      const r = dpad.getBoundingClientRect();
      const rx = (e.clientX - r.left) / r.width;
      touch.left = rx < 0.45; touch.right = rx > 0.55;
      dpad.dataset.dir = touch.left ? 'l' : touch.right ? 'r' : '';
    };
    const clear = () => { touch.left = touch.right = false; dpad.dataset.dir = ''; };
    dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); wakeAudio(); try { dpad.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } set(e); });
    dpad.addEventListener('pointermove', (e) => { if (touch.left || touch.right || e.buttons) set(e); });
    dpad.addEventListener('pointerup', clear);
    dpad.addEventListener('pointercancel', clear);
    dpad.addEventListener('lostpointercapture', clear);
  }
  // clique / toque nos menus do canvas
  let click = null;
  cv.addEventListener('pointerdown', (e) => {
    wakeAudio();
    const r = cv.getBoundingClientRect();
    click = { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  });

  function pollPad() {
    for (const k of BTN) pad[k] = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp) continue;
      const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      pad.left = pad.left || b(14) || ax < -0.4;
      pad.right = pad.right || b(15) || ax > 0.4;
      pad.up = pad.up || b(12) || ay < -0.6;
      pad.down = pad.down || b(13) || ay > 0.6;
      pad.jump = pad.jump || b(0) || b(1);
      pad.run = pad.run || b(2) || b(3) || b(7);
      pad.start = pad.start || b(9);
      if (Object.values(pad).some(Boolean)) wakeAudio();
    }
  }
  function pollInput() {
    pollPad();
    for (const k of BTN) {
      const v = !!(kb[k] || touch[k] || pad[k]);
      I[k + 'P'] = v && !prev[k];
      I[k] = v;
      prev[k] = v;
    }
    I.selP = I.jumpP || I.startP;
  }

  function toggleMute() {
    save.muted = !save.muted;
    AUDIO.setMuted(save.muted);
    persist();
    const b = document.getElementById('btn-mute');
    if (b) { b.textContent = save.muted ? '🔇' : '🔊'; b.setAttribute('aria-pressed', String(save.muted)); }
  }
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) { muteBtn.textContent = save.muted ? '🔇' : '🔊'; muteBtn.addEventListener('click', () => { wakeAudio(); toggleMute(); muteBtn.blur(); }); }
  const fullBtn = document.getElementById('btn-full');
  if (fullBtn) fullBtn.addEventListener('click', () => {
    const el = document.querySelector('.g-stage');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    fullBtn.blur();
  });

  // avatar do Matheus em pixel art para a tela de título
  let avatar = null;
  { const img = new Image(); img.onload = () => {
      const c = ART.mk(48, 48), x = c.getContext('2d');
      x.imageSmoothingEnabled = true; x.drawImage(img, 0, 0, 48, 48);
      const d = x.getImageData(0, 0, 48, 48);
      for (let i = 0; i < d.data.length; i += 4) for (let j = 0; j < 3; j++) d.data[i + j] = Math.round(d.data[i + j] / 36) * 36;
      x.putImageData(d, 0, 0);
      avatar = c;
    }; img.src = 'assets/avatar.jpg'; }

  // ------------------------------------------------------------ ESTADO
  const G = {
    state: 'title', stateT: 0, t: 0, levelIdx: 0, score: 0, coins: 0, lives: 5, power: 0, time: 300, timeAcc: 0,
    L: null, map: null, mw: 0, ents: [], items: [], shots: [], parts: [], pops: [], bumps: [],
    cam: 0, look: 0, shake: 0, check: null, freeze: 0, freezeKind: '', menuSel: 0, menuRects: [], hurry: false,
    boss: null, goal: null, tallyDone: false, tallyT: 0, flash: 0,
  };
  let P = null;

  const SOLID = new Set(['#', 'B', 'M', 'X', '[', ']', '?', '1', '*', 'E', 'F']);
  function tileAt(tx, ty) {
    if (tx < 0 || tx >= G.mw) return 'X';
    if (ty < 0 || ty >= 14) return '.';
    return G.map[ty][tx];
  }
  const solidAt = (tx, ty) => SOLID.has(tileAt(tx, ty));
  function setTile(tx, ty, c) { if (tx >= 0 && tx < G.mw && ty >= 0 && ty < 14) G.map[ty][tx] = c; }
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function collideX(e) {
    e.hitL = e.hitR = false;
    const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w - 0.01) / T);
      for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { e.x = tx * T - e.w; e.vx = 0; e.hitR = true; return; }
    } else if (e.vx < 0) {
      const tx = Math.floor(e.x / T);
      for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { e.x = (tx + 1) * T; e.vx = 0; e.hitL = true; return; }
    }
  }
  function collideY(e, prevBottom) {
    e.onGround = false;
    const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
    if (e.vy > 0) {
      const ty = Math.floor((e.y + e.h - 0.01) / T);
      for (let tx = x0; tx <= x1; tx++) {
        const c = tileAt(tx, ty);
        if (SOLID.has(c) || (c === '=' && prevBottom != null && prevBottom <= ty * T + 1)) {
          e.y = ty * T - e.h; e.vy = 0; e.onGround = true; return null;
        }
      }
    } else if (e.vy < 0) {
      const ty = Math.floor(e.y / T);
      const hits = [];
      for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) hits.push(tx);
      if (hits.length) { e.y = (ty + 1) * T; e.vy = 0; return { ty, hits }; }
    }
    return null;
  }

  // ------------------------------------------------------------ FASES
  function spawn(d) {
    const bx = d.x * T, by = (d.y + 1) * T;
    const base = { t: 0, vx: 0, vy: 0, dir: -1, active: false };
    switch (d.type) {
      case 'g': return { ...base, kind: 'g', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true };
      case 's': return { ...base, kind: 's', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true };
      case 'b': return { ...base, kind: 'b', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true, roll: 0, stun: 0 };
      case 'k': return { ...base, kind: 'k', x: bx + 1, y: by - 15, w: 14, h: 15, enemy: true, state: 'walk', shellT: 0, kickT: 0 };
      case 'f': return { ...base, kind: 'f', x: bx + 1, y: by - 12, w: 14, h: 12, enemy: true, baseY: by - 12 };
      case 'mph': return { ...base, kind: 'mp', plat: true, active: true, axis: 'x', x: bx, y: d.y * T, w: 48, h: 8, a: bx, b: bx + d.range * T, dir: 1, speed: 0.8, dx: 0, dy: 0 };
      case 'mpv': return { ...base, kind: 'mp', plat: true, active: true, axis: 'y', x: bx, y: d.y * T, w: 48, h: 8, a: d.y * T, b: (d.y + d.range) * T, dir: 1, speed: 0.7, dx: 0, dy: 0 };
      case 'fall': return { ...base, kind: 'fall', plat: true, active: true, x: bx, y: d.y * T, w: 32, h: 8, timer: 0, falling: false, dx: 0, dy: 0 };
      case 'spring': return { ...base, kind: 'spring', plat: true, active: true, bounce: true, x: bx, y: by - 16, w: 16, h: 16, comp: 0, dx: 0, dy: 0 };
      case 'K': return { ...base, kind: 'K', active: true, x: bx + 4, y: by - 32, w: 8, h: 32, tx: d.x, ty: d.y, on: false, wave: 0 };
      case 'G': return { ...base, kind: 'G', active: true, x: bx, y: by - 48, w: 32, h: 48 };
      case 'fb': return { ...base, kind: 'fb', active: true, x: bx, y: d.y * T, w: 16, h: 16, cx: bx + 8, cy: d.y * T + 8, ang: Math.PI / 2, speed: d.speed || 0.03, len: d.len || 5 };
      case 'boss': return { ...base, kind: 'boss', active: true, x: bx - 14, y: -60, w: 44, h: 36, hp: 12, maxHp: 12, state: 'intro', face: -1, inv: 0, landed: false, last: '' };
      default: return null;
    }
  }

  function loadLevel(idx, fromCheck) {
    const def = LEVELS.list[idx]();
    G.L = def; G.levelIdx = idx;
    G.map = def.rows.map((r) => r.slice()); G.mw = def.w;
    G.ents = []; G.items = []; G.shots = []; G.parts = []; G.pops = []; G.bumps = []; G.boss = null; G.goal = null;
    for (const d of def.ents) { const e = spawn(d); if (!e) continue; G.ents.push(e); if (e.kind === 'boss') G.boss = e; if (e.kind === 'G') G.goal = e; }
    let start = def.start;
    if (fromCheck && G.check && G.check.level === idx) {
      start = { x: G.check.x, y: G.check.y };
      for (const e of G.ents) if (e.kind === 'K' && e.tx <= G.check.x) e.on = true;
    } else if (G.check && G.check.level !== idx) G.check = null;
    P = { x: start.x * T + 2, y: (start.y + 1) * T - 15, w: 12, h: 15, vx: 0, vy: 0, face: 1, onGround: false, power: 0, inv: 0, star: 0,
      coyote: 0, jumpBuf: 0, anim: 0, combo: 0, dead: false, pit: false, onPlat: null, cdCool: 0, prevBottom: 0, hidden: false, skid: false };
    setPower(G.power);
    G.time = def.time; G.timeAcc = 0; G.hurry = false; G.freeze = 0; G.shake = 0; G.flash = 0;
    G.tallyDone = false; G.look = 0;
    G.cam = clamp(P.x + P.w / 2 - W / 2, 0, G.mw * T - W);
    AUDIO.setTempo(1);
    if (idx + 1 > save.unlocked) { save.unlocked = idx + 1; persist(); }
  }
  function setPower(n) {
    if (n > 0 && P.h === 15) { P.h = 30; P.y -= 15; }
    if (n === 0 && P.h === 30) { P.h = 15; P.y += 15; }
    P.power = n;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function newGame(idx) {
    G.score = 0; G.coins = 0; G.lives = 5; G.power = 0; G.check = null;
    loadLevel(idx, false);
    toState('intro');
    AUDIO.stopMusic(); AUDIO.sfx('start');
  }
  function toState(s) { G.state = s; G.stateT = 0; G.menuSel = 0; G.menuRects = []; showOverlay(s === 'ending'); }

  // ------------------------------------------------------------ PONTOS
  function pop(txt, x, y, color) { G.pops.push({ txt: String(txt), x, y, t: 0, color: color || '#ffffff' }); }
  function addScore(n, x, y) { G.score += n; if (x != null) pop(n, x, y); }
  function oneUp(x, y) { G.lives++; AUDIO.sfx('oneup'); pop('1UP', x, y, '#a6ff5a'); }
  function collectCoin(x, y) {
    G.coins++; G.score += 200; AUDIO.sfx('coin');
    for (let i = 0; i < 4; i++) G.parts.push({ type: 'spark', x, y, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2, life: 18, color: '#fff3b0' });
    if (G.coins >= 100) { G.coins -= 100; oneUp(x, y - 8); }
  }
  const STOMP = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
  function comboScore(x, y) {
    P.combo++;
    if (P.combo > STOMP.length) { oneUp(x, y); return; }
    addScore(STOMP[P.combo - 1], x, y);
  }

  // ------------------------------------------------------------ JOGADOR
  function hurtPlayer() {
    if (P.inv > 0 || P.star > 0 || P.dead || G.state !== 'play') return;
    if (P.power === 2) { P.power = 1; P.inv = 120; AUDIO.sfx('powerdown'); G.freeze = 24; G.freezeKind = 'flash'; }
    else if (P.power === 1) { setPower(0); P.inv = 120; AUDIO.sfx('powerdown'); G.freeze = 36; G.freezeKind = 'shrink'; }
    else killPlayer(false);
  }
  function killPlayer(pit) {
    if (P.dead || G.state !== 'play') return;
    P.dead = true; P.pit = pit; P.vx = 0; P.vy = 0; P.star = 0; P.onPlat = null;
    setPower(0);
    G.power = 0;
    AUDIO.stopMusic(); AUDIO.sfx('die');
    toState('dying');
  }
  function powerUp(to, x, y) {
    if (to === 3) { P.star = 600; AUDIO.sfx('powerup'); AUDIO.music('star'); addScore(1000, x, y); return; }
    if (P.power >= to) { addScore(1000, x, y); AUDIO.sfx('powerup'); return; }
    const wasSmall = P.power === 0;
    setPower(to);
    G.freeze = wasSmall ? 40 : 24; G.freezeKind = wasSmall ? 'grow' : 'flash';
    AUDIO.sfx('powerup'); addScore(1000, x, y);
  }
  function cornerCorrect(p) {
    const ty = Math.floor(p.y / T), x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 1) / T);
    if (x0 === x1) return;
    const s0 = solidAt(x0, ty), s1 = solidAt(x1, ty);
    if (s0 && !s1) { const ov = (x0 + 1) * T - p.x; if (ov <= 5) p.x += ov; }
    else if (s1 && !s0) { const ov = p.x + p.w - x1 * T; if (ov <= 5) p.x -= ov; }
  }

  function updatePlayer() {
    const p = P;
    if (p.inv > 0) p.inv--;
    if (p.star > 0) {
      p.star--;
      if (G.t % 3 === 0) G.parts.push({ type: 'spark', x: p.x + Math.random() * p.w, y: p.y + Math.random() * p.h, vx: 0, vy: -0.3, life: 16, color: ['#ffd23f', '#ff8fd8', '#7cf0ff'][G.t % 3] });
      if (p.star === 0) AUDIO.music(G.L.song);
    }
    if (p.cdCool > 0) p.cdCool--;
    if (p.onPlat) { p.x += p.onPlat.dx; p.y = p.onPlat.y - p.h; }

    const jumpHeld = I.jump || I.up, jumpPressed = I.jumpP || I.upP;
    const run = I.run;
    const max = run ? 2.6 : 1.45;
    const acc = p.onGround ? (run ? 0.1 : 0.08) : 0.07;
    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    p.skid = false;
    if (dir !== 0) {
      p.face = dir;
      if (p.onGround && Math.sign(p.vx) === -dir && Math.abs(p.vx) > 0.8) {
        p.vx += dir * 0.2; p.skid = true;
        if (G.t % 4 === 0) G.parts.push({ type: 'dust', x: p.x + p.w / 2, y: p.y + p.h - 2, vx: -dir * 0.3, vy: -0.3, life: 14 });
      } else if (p.vx * dir < max) p.vx = dir > 0 ? Math.min(p.vx + acc, max) : Math.max(p.vx - acc, -max);
    } else {
      const fr = p.onGround ? 0.1 : 0.02;
      p.vx = Math.abs(p.vx) <= fr ? 0 : p.vx - Math.sign(p.vx) * fr;
    }
    if (Math.abs(p.vx) > max) p.vx -= Math.sign(p.vx) * Math.min(0.06, Math.abs(p.vx) - max);

    if (jumpPressed) p.jumpBuf = 7; else if (p.jumpBuf > 0) p.jumpBuf--;
    if (p.onGround) p.coyote = 6; else if (p.coyote > 0) p.coyote--;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = Math.min(p.vy, -(5.7 + Math.abs(p.vx) * 0.25));
      p.onGround = false; p.coyote = 0; p.jumpBuf = 0; p.onPlat = null;
      AUDIO.sfx(p.power ? 'jumpBig' : 'jump');
    }
    p.vy += p.vy < 0 && jumpHeld ? 0.2 : 0.42;
    if (p.vy > 6.5) p.vy = 6.5;

    if (p.power === 2 && I.runP && p.cdCool === 0 && G.shots.filter((s) => s.kind === 'disc').length < 2) {
      G.shots.push({ kind: 'disc', x: p.x + (p.face > 0 ? p.w : -8), y: p.y + 8, w: 8, h: 8, vx: p.face * 4.2, vy: 1.5, t: 0 });
      p.cdCool = 10; AUDIO.sfx('cd');
    }

    p.prevBottom = p.y + p.h;
    const wasAir = !p.onGround;
    const fallV = p.vy;
    p.x += p.vx; collideX(p);
    p.y += p.vy;
    if (p.vy < 0) cornerCorrect(p);
    const hit = collideY(p, p.prevBottom);
    if (hit) {
      const cx = Math.floor((p.x + p.w / 2) / T);
      const tx = hit.hits.includes(cx) ? cx : hit.hits[0];
      bumpTile(tx, hit.ty);
    }
    p.onPlat = null;
    if (p.vy >= 0) {
      for (const pl of G.ents) {
        if (!pl.plat || pl.gone) continue;
        // a mola funciona pisando de cima ou só andando até ela
        if (pl.bounce && p.x + p.w > pl.x + 3 && p.x < pl.x + pl.w - 3 && p.y + p.h >= pl.y && p.y + p.h <= pl.y + pl.h + 1) {
          p.y = pl.y - p.h; p.vy = -8.6; pl.comp = 12; AUDIO.sfx('spring'); p.onGround = false; p.combo = 0; p.coyote = 0; p.jumpBuf = 0;
          break;
        }
        if (pl.bounce) continue;
        if (p.x + p.w > pl.x + 1 && p.x < pl.x + pl.w - 1 && p.y + p.h >= pl.y && p.prevBottom <= pl.y + 3) {
          if (pl.bounce) {
            p.y = pl.y - p.h; p.vy = jumpHeld ? -8.6 : -6.2; pl.comp = 12; AUDIO.sfx('spring'); p.onGround = false; p.combo = 0;
            break;
          }
          p.y = pl.y - p.h; p.vy = 0; p.onGround = true; p.onPlat = pl; pl.stood = true;
        }
      }
    }
    if (p.onGround) {
      p.combo = 0;
      if (wasAir && fallV > 3) for (let i = 0; i < 3; i++) G.parts.push({ type: 'dust', x: p.x + p.w / 2 + (i - 1) * 5, y: p.y + p.h - 2, vx: (i - 1) * 0.5, vy: -0.2, life: 14 });
    }
    // fichas, espinhos e lava
    const x0 = Math.floor((p.x + 1) / T), x1 = Math.floor((p.x + p.w - 2) / T);
    const y0 = Math.floor((p.y + 1) / T), y1 = Math.floor((p.y + p.h - 1) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = tileAt(tx, ty);
      if (c === 'o') { setTile(tx, ty, '.'); collectCoin(tx * T + 8, ty * T + 8); }
      else if (c === '^' && p.y + p.h > ty * T + 9 && p.x + p.w - 3 > tx * T + 2 && p.x + 3 < tx * T + 14) { if (P.inv === 0 && !P.star) { hurtPlayer(); if (!P.dead) P.vy = -4.5; } }
      else if (c === '~' && p.y + p.h > ty * T + 6) { killPlayer(true); return; }
    }
    if (p.y > H + 8) { killPlayer(true); return; }
    p.anim = p.onGround ? p.anim + Math.abs(p.vx) * 0.11 : p.anim;
  }

  function bumpTile(tx, ty) {
    const c = tileAt(tx, ty), big = P.power > 0;
    const cx = tx * T, cy = ty * T;
    let bumped = true;
    if (c === '?') { setTile(tx, ty, 'E'); G.parts.push({ type: 'coin', x: cx, y: cy - 16, vy: -5, life: 30 }); G.coins++; G.score += 200; AUDIO.sfx('coin'); if (G.coins >= 100) { G.coins -= 100; oneUp(cx, cy - 20); } }
    else if (c === 'M') { setTile(tx, ty, 'E'); spawnItem(P.power === 0 ? 'turbo' : 'cd', tx, ty); }
    else if (c === '1') { setTile(tx, ty, 'E'); spawnItem('life', tx, ty); }
    else if (c === '*') { setTile(tx, ty, 'E'); spawnItem('star', tx, ty); }
    else if (c === 'B') {
      if (big) {
        setTile(tx, ty, '.');
        const col = ART.THEMES[G.L.theme].br;
        [[-1.4, -5], [1.4, -5], [-1, -3], [1, -3]].forEach(([vx, vy], i) => G.parts.push({ type: 'debris', x: cx + (i % 2) * 8 + 4, y: cy + (i > 1 ? 8 : 0) + 4, vx, vy, life: 70, color: col }));
        G.score += 50; AUDIO.sfx('brick'); bumped = false;
      } else AUDIO.sfx('bump');
    } else { AUDIO.sfx('bump'); bumped = false; }
    if (bumped) G.bumps.push({ tx, ty, t: 0 });
    // derruba inimigos e pega fichas em cima do bloco
    for (const e of G.ents) {
      if (!e.enemy || e.dying || !e.active) continue;
      if (e.x + e.w > cx && e.x < cx + T && Math.abs(e.y + e.h - cy) <= 3) { flipKill(e); addScore(100, e.x, e.y); }
    }
    for (const it of G.items) if (it.x + it.w > cx && it.x < cx + T && Math.abs(it.y + it.h - cy) <= 3) { it.vy = -4; it.dir = it.x + it.w / 2 < cx + 8 ? -1 : 1; }
    if (tileAt(tx, ty - 1) === 'o') { setTile(tx, ty - 1, '.'); G.parts.push({ type: 'coin', x: cx, y: cy - 16, vy: -5, life: 30 }); collectCoin(cx + 8, cy - 8); }
  }

  // ------------------------------------------------------------ ITENS
  function spawnItem(kind, tx, ty) {
    G.items.push({ kind, x: tx * T + 1, y: ty * T + 2, w: 14, h: 14, vx: 0, vy: 0, dir: 1, rise: 16, t: 0 });
    AUDIO.sfx('appear');
  }
  function updateItems() {
    for (const it of G.items) {
      it.t++;
      if (it.rise > 0) { it.y -= 1; it.rise--; continue; }
      if (it.kind === 'turbo' || it.kind === 'life') { it.vx = it.dir * 1.0; it.vy = Math.min(it.vy + 0.35, 6); }
      else if (it.kind === 'star') { it.vx = it.dir * 1.3; it.vy = Math.min(it.vy + 0.25, 6); }
      else { it.vx = 0; it.vy = Math.min(it.vy + 0.35, 6); }
      it.x += it.vx; collideX(it);
      if (it.hitL) it.dir = 1; if (it.hitR) it.dir = -1;
      const pb = it.y + it.h; it.y += it.vy; collideY(it, pb);
      if (it.kind === 'star' && it.onGround) it.vy = -4.5;
      if (it.y > H + 20) it.gone = true;
      if (!P.dead && overlap(it, P)) {
        it.gone = true;
        if (it.kind === 'turbo') powerUp(1, it.x, it.y);
        else if (it.kind === 'cd') powerUp(2, it.x, it.y);
        else if (it.kind === 'star') powerUp(3, it.x, it.y);
        else if (it.kind === 'life') oneUp(it.x, it.y);
      }
    }
    G.items = G.items.filter((i) => !i.gone);
  }

  // ------------------------------------------------------------ INIMIGOS
  function flipKill(e) {
    if (e.kind === 'boss') return;
    e.dying = 'flip'; e.vy = -3.5; e.vx = (e.x < P.x ? -0.8 : 0.8); e.enemy = false;
    AUDIO.sfx('kick');
  }
  function stompBounce() { P.vy = I.jump || I.up ? -6.2 : -3.8; P.onGround = false; P.coyote = 0; P.onPlat = null; }

  function touchPlayer(e) {
    const p = P;
    if (p.dead || G.state !== 'play' || !overlap(p, e)) return;
    if (p.star > 0) { flipKill(e); comboScore(e.x, e.y); return; }
    const stomp = p.vy > 0 && p.prevBottom <= e.y + 6;
    if (e.kind === 'k') {
      if (e.state === 'walk') {
        if (stomp) { e.state = 'shell'; e.shellT = 0; e.vx = 0; p.y = e.y - p.h; stompBounce(); AUDIO.sfx('stomp'); comboScore(e.x, e.y); }
        else hurtPlayer();
      } else if (e.state === 'shell') {
        e.state = 'slide'; e.dir = p.x + p.w / 2 < e.x + e.w / 2 ? 1 : -1; e.kickT = 14; AUDIO.sfx('kick'); addScore(400, e.x, e.y);
        if (stomp) { p.y = e.y - p.h; stompBounce(); }
      } else if (e.state === 'slide' && e.kickT === 0) {
        if (stomp) { e.state = 'shell'; e.shellT = 0; p.y = e.y - p.h; stompBounce(); AUDIO.sfx('stomp'); comboScore(e.x, e.y); }
        else hurtPlayer();
      }
      return;
    }
    if (e.kind === 'b') {
      if (stomp) { p.y = e.y - p.h; stompBounce(); e.stun = 120; AUDIO.sfx('bump'); for (let i = 0; i < 4; i++) G.parts.push({ type: 'spark', x: e.x + 7, y: e.y, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 2, life: 14, color: '#ffd23f' }); }
      else if (e.stun === 0) hurtPlayer();
      return;
    }
    if (stomp && e.kind !== 's') {
      p.y = e.y - p.h; stompBounce(); AUDIO.sfx('stomp'); comboScore(e.x, e.y);
      if (e.kind === 'g') { e.dying = 'flat'; e.dt = 30; e.enemy = false; }
      else { e.dying = 'flip'; e.vy = 0; e.vx = 0; e.enemy = false; }
    } else hurtPlayer();
  }

  function walker(e, speed, ledge) {
    e.vx = e.dir * speed;
    e.vy = Math.min(e.vy + 0.35, 6);
    e.x += e.vx; collideX(e);
    if (e.hitL) e.dir = 1; else if (e.hitR) e.dir = -1;
    const pb = e.y + e.h; e.y += e.vy; collideY(e, pb);
    if (ledge && e.onGround) {
      const fx = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
      const below = tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
      if (!SOLID.has(below) && below !== '=') e.dir *= -1;
    }
    if (e.y > H + 16) e.gone = true;
  }

  function updateEnemy(e) {
    e.t++;
    if (e.dying === 'flat') { if (--e.dt <= 0) e.gone = true; return; }
    if (e.dying === 'flip') { e.vy += 0.3; e.x += e.vx; e.y += e.vy; if (e.y > H + 24) e.gone = true; return; }
    if (e.kind === 'g') walker(e, 0.5, false);
    else if (e.kind === 's') walker(e, 0.55, false);
    else if (e.kind === 'b') {
      if (e.stun > 0) { e.stun--; e.vx = 0; e.vy = Math.min(e.vy + 0.35, 6); const pb = e.y + e.h; e.y += e.vy; collideY(e, pb); }
      else {
        if (e.t % 40 === 0) e.dir = P.x < e.x ? -1 : 1;
        walker(e, 1.05, false);
        e.roll += e.vx;
      }
    }
    else if (e.kind === 'k') {
      if (e.kickT > 0) e.kickT--;
      if (e.state === 'walk') walker(e, 0.45, true);
      else if (e.state === 'shell') {
        e.shellT++; e.vx = 0; e.vy = Math.min(e.vy + 0.35, 6); const pb = e.y + e.h; e.y += e.vy; collideY(e, pb);
        if (e.shellT > 360) { e.state = 'walk'; e.dir = P.x < e.x ? -1 : 1; }
      } else {
        e.vx = e.dir * 3.6; e.vy = Math.min(e.vy + 0.35, 6);
        e.x += e.vx; collideX(e);
        if (e.hitL || e.hitR) { e.dir *= -1; if (Math.abs(e.x - G.cam - W / 2) < W) AUDIO.sfx('bump'); }
        const pb = e.y + e.h; e.y += e.vy; collideY(e, pb);
        if (e.y > H + 16) e.gone = true;
      }
    } else if (e.kind === 'f') {
      e.x -= 0.45;
      e.y = e.baseY + Math.sin(e.t * 0.045) * 18;
    }
    touchPlayer(e);
  }

  function enemyVsEnemy() {
    const list = G.ents.filter((e) => e.enemy && e.active && !e.dying);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (a.dying || b.dying || !overlap(a, b)) continue;
      const aS = a.kind === 'k' && a.state === 'slide', bS = b.kind === 'k' && b.state === 'slide';
      if (aS && bS) { flipKill(a); flipKill(b); }
      else if (aS) { flipKill(b); comboScore(b.x, b.y); }
      else if (bS) { flipKill(a); comboScore(a.x, a.y); }
      else if (a.kind !== 'f' && b.kind !== 'f') {
        if (a.x < b.x) { a.dir = -1; b.dir = 1; } else { a.dir = 1; b.dir = -1; }
      }
    }
  }

  // ------------------------------------------------------------ OBJETOS
  function updatePlatform(e) {
    const ox = e.x, oy = e.y;
    if (e.kind === 'mp') {
      if (e.axis === 'x') { e.x += e.dir * e.speed; if (e.x >= e.b) { e.x = e.b; e.dir = -1; } if (e.x <= e.a) { e.x = e.a; e.dir = 1; } }
      else { e.y += e.dir * e.speed; if (e.y >= e.b) { e.y = e.b; e.dir = -1; } if (e.y <= e.a) { e.y = e.a; e.dir = 1; } }
    } else if (e.kind === 'fall') {
      if (e.stood && !e.falling) e.timer++;
      if (e.timer > 28) e.falling = true;
      if (e.falling) { e.vy = Math.min(e.vy + 0.25, 5); e.y += e.vy; if (e.y > H + 20) e.gone = true; }
    } else if (e.kind === 'spring') { if (e.comp > 0) e.comp--; }
    e.stood = false;
    e.dx = e.x - ox; e.dy = e.y - oy;
  }

  function updateObject(e) {
    e.t++;
    if (e.kind === 'K') {
      if (!e.on && overlap(P, e)) {
        e.on = true; G.check = { level: G.levelIdx, x: e.tx, y: e.ty }; AUDIO.sfx('check');
        for (let i = 0; i < 10; i++) G.parts.push({ type: 'spark', x: e.x + 4, y: e.y + 4, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, life: 30, color: '#ffd23f' });
      }
    } else if (e.kind === 'G') {
      if (G.state === 'play' && P.x + P.w > e.x + 6 && P.y + P.h > e.y) levelClear();
    } else if (e.kind === 'fb') {
      e.ang += e.speed;
      if (P.dead) return;
      for (let i = 1; i < e.len; i++) {
        const bx = e.cx + Math.cos(e.ang) * i * 8, by = e.cy + Math.sin(e.ang) * i * 8;
        if (bx + 3 > P.x + 2 && bx - 3 < P.x + P.w - 2 && by + 3 > P.y + 2 && by - 3 < P.y + P.h - 1) { hurtPlayer(); break; }
      }
    }
  }

  // ------------------------------------------------------------ TIROS
  function updateShots() {
    for (const s of G.shots) {
      s.t++;
      if (s.kind === 'disc') {
        s.vy = Math.min(s.vy + 0.35, 5);
        s.x += s.vx; collideX(s);
        if (s.hitL || s.hitR) { s.gone = true; poof(s.x + 4, s.y + 4); continue; }
        const pb = s.y + s.h; s.y += s.vy; collideY(s, pb);
        if (s.onGround) s.vy = -3.2;
        if (s.x < G.cam - 16 || s.x > G.cam + W + 16 || s.y > H || s.t > 200) { s.gone = true; continue; }
        for (const e of G.ents) {
          if (e.enemy && e.active && !e.dying && overlap(s, e)) { flipKill(e); addScore(200, e.x, e.y); s.gone = true; poof(s.x + 4, s.y + 4); break; }
          if (e.kind === 'boss' && G.boss && !['intro', 'dying'].includes(e.state) && overlap(s, e)) { s.gone = true; poof(s.x + 4, s.y + 4); if (e.inv === 0) bossDamage(e, 1, 20); break; }
        }
        for (const o of G.shots) if (o.kind === 'orb' && !o.gone && overlap(s, o)) { o.gone = true; s.gone = true; poof(o.x + 5, o.y + 5); }
      } else if (s.kind === 'orb') {
        s.vy += 0.15; s.x += s.vx; s.y += s.vy;
        if (solidAt(Math.floor((s.x + 5) / T), Math.floor((s.y + 8) / T)) && s.vy > 0) { s.gone = true; poof(s.x + 5, s.y + 5); continue; }
        if (s.y > H + 10 || s.x < -20 || s.x > G.mw * T + 20) s.gone = true;
        if (!P.dead && overlap(s, P)) hurtPlayer();
      } else if (s.kind === 'wave') {
        s.x += s.vx; collideX(s);
        if (s.hitL || s.hitR) { s.gone = true; poof(s.x + 6, s.y + 6); continue; }
        if (!P.dead && overlap(s, P)) hurtPlayer();
      }
    }
    G.shots = G.shots.filter((s) => !s.gone);
  }
  function poof(x, y) { for (let i = 0; i < 5; i++) G.parts.push({ type: 'spark', x, y, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5, life: 14, color: '#ffffff' }); }

  // ------------------------------------------------------------ CHEFÃO
  function bossState(b, s) { b.state = s; b.t = 0; }
  function bossDamage(b, n, inv) {
    b.hp -= n; b.inv = inv || 50; G.shake = 8; AUDIO.sfx('bossHit'); addScore(n * 500, b.x + 16, b.y);
    if (b.hp <= 0) {
      b.hp = 0; bossState(b, 'dying'); AUDIO.stopMusic(); P.inv = 9999;
      G.shots = G.shots.filter((s) => s.kind === 'disc');
    }
  }
  function updateBoss(b) {
    b.t++;
    if (b.inv > 0) b.inv--;
    const p = P, enr = b.hp <= b.maxHp / 2;
    const face = p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1;
    if (b.state === 'dying') {
      b.vx = 0; G.shake = 3;
      if (b.t % 7 === 0) { G.parts.push({ type: 'boom', x: b.x + Math.random() * b.w, y: b.y + Math.random() * b.h, r: 0, life: 22 }); if (b.t % 14 === 0) AUDIO.sfx('boom'); }
      if (b.t === 150) {
        b.gone = true; G.flash = 20; AUDIO.sfx('boom'); addScore(10000, b.x + 10, b.y);
        for (let i = 0; i < 30; i++) G.parts.push({ type: 'spark', x: b.x + b.w / 2, y: b.y + b.h / 2, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7, life: 40, color: ['#ff5ab4', '#2fe0ff', '#ffd23f'][i % 3] });
        toState('victory'); AUDIO.sfx('clear');
      }
      return;
    }
    if (b.state === 'intro') {
      b.vy = Math.min(b.vy + 0.4, 8); const pb = b.y + b.h; b.y += b.vy;
      if (b.y > 0) collideY(b, pb);
      if (b.onGround && !b.landed) { b.landed = true; b.t = 0; G.shake = 24; AUDIO.sfx('thud'); }
      if (b.landed && b.t > 110) { bossState(b, 'walk'); AUDIO.music('boss'); }
      return;
    }
    // física
    b.vy = Math.min(b.vy + 0.4, 8);
    b.x += b.vx; collideX(b);
    const pb = b.y + b.h; b.y += b.vy; collideY(b, pb);

    switch (b.state) {
      case 'walk':
        b.face = face; b.vx = face * (enr ? 1.1 : 0.7);
        if (b.t > (enr ? 70 : 110)) {
          const opts = ['tele', 'crouch', 'mouth'].filter((o) => o !== b.last);
          const pick = opts[Math.floor(Math.random() * opts.length)];
          b.last = pick; bossState(b, pick);
        }
        break;
      case 'tele':
        b.vx = 0; b.face = face;
        if (b.t > (enr ? 28 : 45)) { bossState(b, 'charge'); AUDIO.sfx('dash'); }
        break;
      case 'charge':
        b.vx = b.face * (enr ? 5 : 4);
        if (G.t % 3 === 0) G.parts.push({ type: 'dust', x: b.x + (b.face > 0 ? 0 : b.w), y: b.y + b.h - 2, vx: -b.face * 0.5, vy: -0.4, life: 16 });
        if (b.hitL || b.hitR) { bossState(b, 'stun'); G.shake = 18; AUDIO.sfx('thud'); b.vx = -b.face * 1.4; b.vy = -3; }
        break;
      case 'stun':
        if (b.onGround) b.vx *= 0.85;
        if (b.t > (enr ? 85 : 115)) bossState(b, 'walk');
        break;
      case 'crouch':
        b.vx = 0; b.face = face;
        if (b.t > 22) { bossState(b, 'jump'); b.vy = enr ? -8.4 : -7.6; b.vx = clamp((p.x - b.x - 16) / 52, -3.2, 3.2); }
        break;
      case 'jump':
        if (b.onGround && b.t > 4) {
          G.shake = 16; AUDIO.sfx('thud'); b.vx = 0;
          const sp = enr ? 3 : 2.4;
          G.shots.push({ kind: 'wave', x: b.x - 12, y: b.y + b.h - 12, w: 12, h: 12, vx: -sp, vy: 0, t: 0 });
          G.shots.push({ kind: 'wave', x: b.x + b.w, y: b.y + b.h - 12, w: 12, h: 12, vx: sp, vy: 0, t: 0 });
          bossState(b, 'walk');
        }
        break;
      case 'mouth':
        b.vx = 0; b.face = face;
        if (b.t === 26) {
          const n = enr ? 5 : 3;
          for (let i = 0; i < n; i++) G.shots.push({ kind: 'orb', x: b.x + (b.face > 0 ? b.w : -6), y: b.y + 14, w: 10, h: 10, vx: b.face * (1.1 + i * 0.75), vy: -4.2 - (i % 2) * 0.8, t: 0 });
          AUDIO.sfx('orb');
        }
        if (b.t > 64) bossState(b, 'walk');
        break;
      default: break;
    }
    // contato com o jogador
    if (!p.dead && overlap(p, b)) {
      const stomp = p.vy > 0 && p.prevBottom <= b.y + 10;
      if (stomp) {
        p.y = b.y - p.h; p.vy = -6.6; p.onGround = false;
        if (b.inv === 0) bossDamage(b, b.state === 'stun' ? 3 : 1); else AUDIO.sfx('stomp');
      } else if (p.star > 0) { if (b.inv === 0) bossDamage(b, 1); }
      else hurtPlayer();
    }
  }

  // ------------------------------------------------------------ FIM DE FASE
  function levelClear() {
    toState('clear');
    AUDIO.stopMusic(); AUDIO.sfx('clear');
    P.star = 0; P.inv = 0; G.tallyDone = false;
  }
  function nextLevel() {
    G.power = P.power; G.check = null;
    const n = G.levelIdx + 1;
    if (n >= LEVELS.list.length) { toState('ending'); return; }
    loadLevel(n, false);
    toState('intro');
  }

  // ------------------------------------------------------------ PARTÍCULAS
  function updateParts() {
    for (const q of G.parts) {
      q.life--;
      if (q.type === 'debris') { q.vy += 0.3; q.x += q.vx; q.y += q.vy; }
      else if (q.type === 'coin') { q.vy += 0.35; q.y += q.vy; if (q.life === 1) pop(200, q.x, q.y); }
      else if (q.type === 'boom') q.r += 1.2;
      else if (q.type === 'confetti') { q.vy = Math.min(q.vy + 0.05, 1.5); q.x += q.vx + Math.sin(q.life * 0.1) * 0.4; q.y += q.vy; if (q.y > H) { q.y = -4; q.life = 400; } }
      else { q.x += q.vx || 0; q.y += q.vy || 0; }
    }
    G.parts = G.parts.filter((q) => q.life > 0);
    for (const s of G.pops) { s.t++; s.y -= 0.6; }
    G.pops = G.pops.filter((s) => s.t < 45);
    for (const b of G.bumps) b.t++;
    G.bumps = G.bumps.filter((b) => b.t < 10);
  }

  // ------------------------------------------------------------ MUNDO
  function updateCamera() {
    G.look += (P.face * 28 - G.look) * 0.04;
    const target = P.x + P.w / 2 - W / 2 + G.look;
    G.cam += (target - G.cam) * 0.12;
    G.cam = clamp(G.cam, 0, G.mw * T - W);
  }
  function updateWorld() {
    if (G.freeze > 0) { G.freeze--; return; }
    G.t++;
    if (G.shake > 0) G.shake--;
    if (G.flash > 0) G.flash--;
    G.timeAcc++;
    if (G.timeAcc >= 60) {
      G.timeAcc = 0; G.time--;
      if (G.time === 100 && !G.hurry) { G.hurry = true; AUDIO.sfx('hurry'); AUDIO.setTempo(1.2); }
      if (G.time <= 0) { G.time = 0; killPlayer(false); return; }
    }
    for (const e of G.ents) if (!e.active && e.x < G.cam + W + 32 && e.x + e.w > G.cam - 64) e.active = true;
    for (const e of G.ents) if (e.plat && !e.gone) updatePlatform(e);
    updatePlayer();
    if (G.state !== 'play') return;
    for (const e of G.ents) {
      if (!e.active || e.gone || e.plat) continue;
      if (e.kind === 'boss') updateBoss(e);
      else if (e.enemy || e.dying) updateEnemy(e);
      else updateObject(e);
      if (e.enemy && e.x < G.cam - W * 1.5) e.gone = true;
    }
    enemyVsEnemy();
    updateItems();
    updateShots();
    updateParts();
    G.ents = G.ents.filter((e) => !e.gone);
    if (G.boss && G.boss.gone) G.boss = null;
    updateCamera();
  }

  // ------------------------------------------------------------ MENUS
  function menu(items) {
    if (I.upP || I.leftP) { G.menuSel = (G.menuSel + items.length - 1) % items.length; AUDIO.sfx('select'); }
    if (I.downP || I.rightP) { G.menuSel = (G.menuSel + 1) % items.length; AUDIO.sfx('select'); }
    if (click) {
      const i = G.menuRects.findIndex((r) => click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h);
      if (i >= 0) { G.menuSel = i; items[i].act(); click = null; return; }
    }
    if (I.selP) items[G.menuSel].act();
  }
  function titleItems() {
    const items = [{ label: 'JOGAR', act: () => newGame(0) }];
    if (save.unlocked > 1) items.push({ label: 'CONTINUAR: ' + (save.unlocked >= 5 ? 'CHEFÃO' : 'FASE ' + save.unlocked), act: () => newGame(Math.min(save.unlocked, 5) - 1) });
    items.push({ label: 'SOM: ' + (save.muted ? 'DESLIGADO' : 'LIGADO'), act: () => { toggleMute(); AUDIO.sfx('select'); } });
    return items;
  }
  const pauseItems = [
    { label: 'CONTINUAR', act: () => { toState('play'); AUDIO.music(P.star > 0 ? 'star' : (G.boss && G.boss.state === 'intro' ? '' : G.L.song)); } },
    { label: 'SAIR PARA O MENU', act: () => { toState('title'); AUDIO.music('title'); } },
  ];
  const overItems = [
    { label: 'TENTAR DE NOVO', act: () => { G.lives = 5; G.score = 0; G.coins = 0; G.power = 0; G.check = null; loadLevel(G.levelIdx, false); toState('intro'); AUDIO.sfx('start'); } },
    { label: 'MENU', act: () => { toState('title'); AUDIO.music('title'); } },
  ];

  // ------------------------------------------------------------ UPDATE
  function update() {
    pollInput();
    G.stateT++;
    switch (G.state) {
      case 'title':
        G.t++;
        if (audioReady && AUDIO.current !== 'title') AUDIO.music('title');
        menu(titleItems());
        break;
      case 'intro':
        if (G.stateT > 150 || (G.stateT > 40 && I.selP)) {
          toState('play');
          if (!G.L.boss) AUDIO.music(G.L.song);
        }
        break;
      case 'play':
        if (I.startP) { toState('pause'); AUDIO.stopMusic(); AUDIO.sfx('pause'); break; }
        updateWorld();
        break;
      case 'pause':
        menu(pauseItems);
        break;
      case 'dying':
        G.t++;
        updateParts();
        if (!P.pit) {
          if (G.stateT === 30) P.vy = -5.5;
          if (G.stateT > 30) { P.vy += 0.28; P.y += P.vy; }
        }
        if (G.stateT >= 180) {
          G.lives--;
          if (G.lives <= 0) {
            save.best = Math.max(save.best, G.score); persist();
            toState('gameover'); AUDIO.sfx('gameover');
          } else { loadLevel(G.levelIdx, true); toState('intro'); }
        }
        break;
      case 'clear': {
        G.t++;
        updateParts();
        const goal = G.goal;
        if (!P.hidden) {
          P.vx = 1.2; P.face = 1; P.vy = Math.min(P.vy + 0.42, 6);
          P.x += P.vx; collideX(P); const pb = P.y + P.h; P.y += P.vy; collideY(P, pb);
          P.anim += 0.13;
          if (goal && P.x + P.w / 2 >= goal.x + 16) { P.hidden = true; G.flash = 6; }
          if (G.stateT > 240) P.hidden = true;
        } else if (G.stateT > 70 && !G.tallyDone) {
          if (G.time > 0) { const d = Math.min(G.time, 2); G.time -= d; G.score += d * 50; if (G.stateT % 3 === 0) AUDIO.sfx('tick'); }
          else { G.tallyDone = true; G.tallyT = G.stateT; }
        }
        if (G.tallyDone && G.stateT - G.tallyT > 80) nextLevel();
        updateCamera();
        break;
      }
      case 'victory':
        G.t++;
        updateParts();
        if (G.stateT > 260) {
          save.best = Math.max(save.best, G.score); save.unlocked = 5; persist();
          toState('ending'); AUDIO.music('ending');
          for (let i = 0; i < 70; i++) G.parts.push({ type: 'confetti', x: Math.random() * W, y: Math.random() * H - H, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random(), life: 400, color: ['#ffd23f', '#e8402e', '#2f7bff', '#3bd16f', '#ff5ab4'][i % 5] });
        }
        break;
      case 'gameover':
        if (G.stateT > 60) menu(overItems);
        break;
      case 'ending':
        G.t++;
        updateParts();
        if (G.stateT > 120 && I.selP) { toState('title'); AUDIO.music('title'); }
        break;
      default: break;
    }
    click = null;
  }

  // ------------------------------------------------------------ DESENHO
  const R = (v) => Math.round(v);
  function rect(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(R(x), R(y), w, h); }
  function img(c, x, y, flipY) {
    if (!flipY) { ctx.drawImage(c, R(x), R(y)); return; }
    ctx.save(); ctx.translate(R(x), R(y) + c.height); ctx.scale(1, -1); ctx.drawImage(c, 0, 0); ctx.restore();
  }
  // a fonte pixel não tem acentos em maiúsculas bonitos: tira os acentos
  const plain = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  function text(str, x, y, o = {}) {
    str = plain(str);
    const size = o.size || 8;
    ctx.font = `${size}px "Press Start 2P", monospace`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'top';
    if (o.outline) {
      ctx.fillStyle = o.outline;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1], [2, 2], [1, 2], [2, 1]]) ctx.fillText(str, x + dx, y + dy);
    } else if (o.shadow !== false) { ctx.fillStyle = o.shadow || '#000'; ctx.fillText(str, x + 1, y + 1); }
    ctx.fillStyle = o.color || '#fff';
    ctx.fillText(str, x, y);
  }
  const pad0 = (n, l) => String(Math.max(0, Math.floor(n))).padStart(l, '0');

  function heroSprite(p, forceSize) {
    const pal = p.star > 0 ? 's' + ((G.t >> 2) % 4) : p.power === 2 ? 'cd' : 'n';
    let big = p.power > 0;
    if (forceSize != null) big = forceSize;
    const set = HERO[pal][big && !p.dead ? 'b' : 's'];
    let f = 'idle';
    if (p.dead) f = 'die';
    else if (!p.onGround) f = 'jump';
    else if (Math.abs(p.vx) > 0.15) f = Math.floor(p.anim) % 2 ? 'walkB' : 'walkA';
    const s = f === 'die' ? set.die : set[f];
    return s[p.face > 0 ? 'r' : 'l'];
  }
  function drawPlayer() {
    const p = P;
    if (p.hidden) return;
    if (p.inv > 0 && !p.dead && (G.t >> 1) % 2 && G.state === 'play' && p.inv < 9000) return;
    let force = null;
    if (G.freeze > 0 && (G.freezeKind === 'grow' || G.freezeKind === 'shrink')) {
      force = ((G.freeze >> 2) % 2 === 0) === (G.freezeKind === 'grow');
    }
    const s = heroSprite(p, force);
    if (G.freeze > 0 && G.freezeKind === 'flash' && (G.freeze >> 1) % 2) { ctx.globalAlpha = 0.5; }
    img(s, p.x - 2, p.y + p.h - s.height);
    ctx.globalAlpha = 1;
  }

  function drawTiles() {
    const ts = ART.tiles(G.L.theme);
    const qf = [0, 0, 0, 0, 1, 2, 1, 0][(G.t >> 3) % 8];
    const lf = (G.t >> 3) % 4;
    const x0 = Math.max(0, Math.floor(G.cam / T) - 1), x1 = Math.min(G.mw - 1, x0 + W / T + 2);
    for (let ty = 0; ty < 14; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = G.map[ty][tx];
      if (c === '.') continue;
      let im = null, oy = 0;
      for (const b of G.bumps) if (b.tx === tx && b.ty === ty) oy = -Math.round(Math.sin((b.t / 10) * Math.PI) * 5);
      switch (c) {
        case '#': im = tileAt(tx, ty - 1) === '#' ? ts.ground : ts.groundTop; break;
        case 'B': case '*': im = ts.brick; break;
        case '?': case 'M': case '1': im = ts.q[qf]; break;
        case 'E': im = ts.used; break;
        case 'X': im = ts.hard; break;
        case '=': im = ts.semi; break;
        case 'F': im = ts.fire; break;
        case '[': im = tileAt(tx, ty - 1) === '[' ? ts.pillarBody[0] : ts.pillarCap[Math.floor(tx / 2) % 3][0]; break;
        case ']': im = tileAt(tx, ty - 1) === ']' ? ts.pillarBody[1] : ts.pillarCap[Math.floor((tx - 1) / 2) % 3][1]; break;
        case '^': im = ts.spikes; break;
        case '~': im = tileAt(tx, ty - 1) === '~' ? ts.lava : ts.lavaTop[lf]; break;
        case 'o': im = ITEM.coin[[0, 1, 2, 3, 2, 1][(G.t >> 3) % 6]]; break;
        default: break;
      }
      if (im) ctx.drawImage(im, tx * T, ty * T + oy);
    }
  }

  function drawEnemy(e) {
    const flipY = e.dying === 'flip';
    const dx = e.x - 1, by = e.y + e.h;
    const face = (pair) => (e.dir > 0 ? pair.l : pair.r);
    if (e.kind === 'g') {
      if (e.dying === 'flat') { img(ENEMY.bugFlat.r, dx, by - 16); return; }
      img(face(ENEMY.bug[(e.t >> 3) & 1]), dx, by - 16, flipY);
    } else if (e.kind === 'k') {
      if (e.state === 'walk' && !flipY) img(face(ENEMY.cart[(e.t >> 3) & 1]), dx, by - 16);
      else { const shake = e.state === 'shell' && e.shellT > 290 ? ((e.t >> 1) % 2 ? 1 : -1) : 0; img(ENEMY.shell.r, dx + shake, by - 16, flipY); }
    } else if (e.kind === 'f') {
      const flap = (e.t >> 3) & 1;
      if (!flipY) {
        rect('#1a1020', dx - 1, e.y - (flap ? 3 : 0), 6, 6); rect('#ffffff', dx, e.y + 1 - (flap ? 3 : 0), 4, 4);
        rect('#1a1020', dx + 11, e.y - (flap ? 3 : 0), 6, 6); rect('#ffffff', dx + 12, e.y + 1 - (flap ? 3 : 0), 4, 4);
      }
      img(face(ENEMY.pad), dx, e.y + 4, flipY);
    } else if (e.kind === 'b') {
      const fr = ENEMY.ball[((Math.floor(e.roll / 3) % 4) + 4) % 4];
      const shake = e.stun > 0 && e.stun < 30 ? ((e.t >> 1) % 2 ? 1 : -1) : 0;
      img(fr, dx + shake, by - 16, flipY);
      if (!flipY) {
        const ex = R(dx + 5 + e.dir * 2 + shake), ey = R(by - 11);
        rect('#1a1020', ex, ey, 6, 6); rect(e.stun > 0 ? '#6b7190' : '#ff3b3b', ex + 1, ey + 1, 4, 4);
        if (e.stun > 0) rect('#1a1020', ex + 1, ey + 3, 4, 1); else rect('#ffffff', ex + 1, ey + 1, 1, 1);
        if (e.stun > 0) for (let i = 0; i < 2; i++) { const a = e.t * 0.15 + i * 3.1; rect('#ffd23f', dx + 7 + Math.cos(a) * 7, by - 19 + Math.sin(a) * 2, 2, 2); }
      }
    } else if (e.kind === 's') {
      const glitch = (e.t % 50) < 5;
      img(glitch ? ENEMY.spikyGlitch.r : ((e.t >> 4) & 1 ? ENEMY.spiky.l : ENEMY.spiky.r), dx + (glitch ? 2 : 0), by - 16, flipY);
    }
  }

  function drawObject(e) {
    const th = G.L.theme, ts = ART.tiles(th);
    if (e.kind === 'mp') { for (let i = 0; i < 3; i++) ctx.drawImage(ts.semi, R(e.x) + i * 16, R(e.y)); }
    else if (e.kind === 'fall') {
      const sx = e.timer > 0 && !e.falling ? ((G.t >> 1) % 2 ? 1 : -1) : 0;
      for (let i = 0; i < 2; i++) {
        const x = e.x + i * 16 + sx;
        rect('#1a1020', x, e.y, 16, 9); rect('#ff9f1c', x + 1, e.y + 1, 14, 7); rect('#ffd27a', x + 1, e.y + 1, 14, 1);
        rect('#b85a00', x + 5, e.y + 2, 1, 3); rect('#b85a00', x + 6, e.y + 4, 2, 1); rect('#b85a00', x + 11, e.y + 3, 1, 3);
      }
    } else if (e.kind === 'spring') {
      const h = e.comp > 0 ? 9 : 16, y = e.y + 16 - h;
      rect('#1a1020', e.x + 1, y, 14, 4); rect('#e8402e', e.x + 2, y + 1, 12, 2);
      for (let j = y + 4; j < e.y + 13; j += 2) { rect('#1a1020', e.x + 3, j, 10, 2); rect('#d0d4e4', e.x + 4, j, 8, 1); }
      rect('#1a1020', e.x + 1, e.y + 13, 14, 3); rect('#2f7bff', e.x + 2, e.y + 13, 12, 2);
    } else if (e.kind === 'K') {
      rect('#1a1020', e.x + 2, e.y, 4, 32); rect('#d0d4e4', e.x + 3, e.y + 1, 2, 31);
      rect('#1a1020', e.x, e.y + 28, 8, 4); rect('#6b7190', e.x + 1, e.y + 29, 6, 2);
      if (e.on) {
        const wv = (G.t >> 3) % 2;
        rect('#1a1020', e.x + 5, e.y + 1, 14, 10); rect('#ffd23f', e.x + 5, e.y + 2, 13 - wv, 8);
        rect('#e8402e', e.x + 8, e.y + 4, 2, 4); rect('#e8402e', e.x + 12, e.y + 4, 2, 4); rect('#e8402e', e.x + 10, e.y + 5, 2, 1);
      } else { rect('#1a1020', e.x + 5, e.y + 18, 11, 8); rect('#8a8fa8', e.x + 5, e.y + 19, 10, 6); }
      rect('#ffd23f', e.x + 3, e.y - 2, 2, 2);
    } else if (e.kind === 'G') drawArcade(e);
    else if (e.kind === 'fb') {
      for (let i = 1; i < e.len; i++) img(ITEM.fire[((G.t >> 2) + i) & 1], e.cx + Math.cos(e.ang) * i * 8 - 4, e.cy + Math.sin(e.ang) * i * 8 - 4);
    }
  }
  function drawArcade(e) {
    const x = R(e.x), y = R(e.y);
    rect('#1a1020', x, y, 32, 48); rect('#2f7bff', x + 1, y + 1, 30, 46); rect('#1f56c0', x + 26, y + 1, 5, 46);
    rect('#1a1020', x + 3, y + 3, 26, 10); rect('#e8402e', x + 4, y + 4, 24, 8);
    text('MT', x + 16, y + 4, { color: '#ffd23f', align: 'center', shadow: '#7a1a10' });
    rect('#1a1020', x + 4, y + 15, 24, 15);
    const lit = G.state === 'clear' && P.hidden;
    rect(lit && (G.t >> 2) % 2 ? '#3a4cff' : '#0b1033', x + 5, y + 16, 22, 13);
    for (let i = 0; i < 4; i++) rect(['#ffd23f', '#ff5ab4', '#2fe0ff', '#3bd16f'][i], x + 7 + ((G.t / 2 + i * 5) % 18), y + 18 + i * 3, 2, 2);
    rect('#1a1020', x + 2, y + 31, 28, 6); rect('#e0e4f4', x + 3, y + 32, 26, 4);
    rect('#1a1020', x + 9, y + 27, 2, 5); rect('#e8402e', x + 8, y + 25, 4, 3);
    rect('#ffd23f', x + 18, y + 33, 3, 2); rect('#e8402e', x + 23, y + 33, 3, 2);
    rect('#1a1020', x + 12, y + 39, 8, 6); rect('#ff9f1c', x + 13, y + 40, 6, 4); rect('#1a1020', x + 15, y + 41, 2, 2);
    if (G.state === 'play' && (G.t >> 4) % 2) text('FIM', x + 16, y - 11, { color: '#ffd23f', align: 'center' });
  }

  function drawItems(rising) {
    for (const it of G.items) {
      if ((it.rise > 0) !== rising) continue;
      let s;
      if (it.kind === 'turbo') s = ITEM.turbo;
      else if (it.kind === 'cd') s = ITEM.cd;
      else if (it.kind === 'life') s = ITEM.life;
      else s = ITEM.star[(G.t >> 2) % 4];
      img(s, it.x - 1 + (it.kind === 'cd' ? 1 : 0), it.y + it.h - s.height);
    }
  }

  function drawBoss(b) {
    if (b.inv > 0 && (G.t >> 1) % 2 && b.state !== 'dying') return;
    const x = R(b.x + (b.state === 'tele' ? ((G.t >> 1) % 2 ? 1 : -1) : 0)), y = R(b.y + (b.state === 'crouch' ? 4 : 0));
    const enr = b.hp <= b.maxHp / 2;
    const main = enr ? '#c0306a' : '#7a3ad6', dark = enr ? '#6a1038' : '#3e1a80', light = enr ? '#ff7ab4' : '#b48aff';
    const ph = ['walk', 'charge'].includes(b.state) ? (G.t >> 2) & 1 : 0;
    for (let i = 0; i < 3; i++) {
      const lx = x + 7 + i * 12, ly = y + 27 + ((i + ph) % 2);
      rect('#1a1020', lx, ly, 4, 9); rect('#2a2a3a', lx + 1, ly + 1, 2, 7); rect('#1a1020', lx - 1, y + 34, 6, 2);
    }
    for (let j = 0; j < 26; j++) {
      const hw = Math.round(21 * Math.sqrt(1 - Math.pow((25 - j) / 26, 2)));
      rect('#1a1020', x + 22 - hw - 1, y + 4 + j, hw * 2 + 2, 1);
      rect(j < 4 ? light : j > 20 ? dark : main, x + 22 - hw, y + 4 + j, hw * 2, 1);
    }
    rect('#1a1020', x + 1, y + 29, 42, 2);
    rect(dark, x + 21, y + 5, 2, 24);
    rect(light, x + 10, y + 9, 7, 2); rect(light, x + 8, y + 12, 3, 2);
    const gl = (G.t % 40) < 4;
    rect(gl ? '#2fe0ff' : '#ff5ab4', x + 28, y + 12, 5, 3); rect(gl ? '#ff5ab4' : '#2fe0ff', x + 13, y + 19, 4, 2);
    // cabeça-monitor
    const hx = b.face < 0 ? x - 6 : x + 32, hy = y + 9;
    rect('#1a1020', hx, hy, 18, 16); rect('#4a4a5e', hx + 1, hy + 1, 16, 14); rect('#6c6c86', hx + 1, hy + 1, 16, 1);
    rect('#1a1020', hx + 2, hy + 3, 14, 10);
    const scr = b.state === 'stun' ? '#24305a' : enr ? '#3a0a1a' : '#0b1033';
    rect(scr, hx + 3, hy + 4, 12, 8);
    const ec = enr ? '#ff3b3b' : '#ff5ab4';
    if (b.state === 'stun' || b.state === 'dying') {
      [[hx + 4, hy + 5], [hx + 10, hy + 5]].forEach(([ex, ey]) => { rect('#ffd23f', ex, ey, 1, 1); rect('#ffd23f', ex + 2, ey, 1, 1); rect('#ffd23f', ex + 1, ey + 1, 1, 1); rect('#ffd23f', ex, ey + 2, 1, 1); rect('#ffd23f', ex + 2, ey + 2, 1, 1); });
    } else {
      rect(ec, hx + 4, hy + 6, 3, 2); rect(ec, hx + 11, hy + 6, 3, 2);
      rect(ec, hx + 4, hy + 5, 1, 1); rect(ec, hx + 13, hy + 5, 1, 1);
      if (b.state === 'mouth' || b.state === 'tele') rect('#ffffff', hx + 6, hy + 9, 6, 2); else rect(ec, hx + 6, hy + 10, 6, 1);
    }
    rect('#1a1020', hx + 8, hy - 6, 1, 6);
    rect((G.t >> 3) % 2 ? '#ff3b3b' : '#ffd23f', hx + 7, hy - 8, 3, 3);
    if (b.state === 'stun') for (let i = 0; i < 3; i++) {
      const a = G.t * 0.12 + i * 2.1;
      rect('#ffd23f', hx + 8 + Math.cos(a) * 12, hy - 4 + Math.sin(a) * 4, 2, 2);
    }
  }

  function drawShots() {
    for (const s of G.shots) {
      if (s.kind === 'disc') img(ITEM.disc[(s.t >> 1) % 4], s.x, s.y);
      else if (s.kind === 'orb') img(ITEM.orb[(s.t >> 2) & 1], s.x, s.y);
      else if (s.kind === 'wave') {
        for (let i = 0; i < 4; i++) {
          const h = 4 + ((s.t + i * 3) % 8);
          rect(i % 2 ? '#ff5ab4' : '#2fe0ff', s.x + i * 3, s.y + 12 - h, 3, h);
        }
      }
    }
  }

  function drawParts() {
    for (const q of G.parts) {
      if (q.type === 'debris') { rect('#1a1020', q.x - 1, q.y - 1, 6, 6); rect(q.color, q.x, q.y, 4, 4); }
      else if (q.type === 'coin') img(ITEM.coin[(q.life >> 1) % 4], q.x, q.y);
      else if (q.type === 'dust') { const r = q.life > 8 ? 2 : 1; rect('#f4f6ff', q.x - r, q.y - r, r * 2, r * 2); }
      else if (q.type === 'spark' || q.type === 'confetti') rect(q.color, q.x, q.y, q.type === 'confetti' ? 3 : 2, 2);
      else if (q.type === 'boom') {
        ctx.fillStyle = q.life > 12 ? '#ffffff' : q.life > 6 ? '#ffd23f' : '#ff5a1f';
        ctx.beginPath(); ctx.arc(R(q.x), R(q.y), q.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const s of G.pops) text(s.txt, R(s.x), R(s.y), { color: s.color, size: 8 });
  }

  function drawHUD() {
    text('MATHEUS', 12, 8, { color: '#ffd23f' });
    text(pad0(G.score, 6), 12, 18);
    ctx.drawImage(ITEM.coin[[0, 1, 2, 3, 2, 1][(G.t >> 3) % 6]], 104, 12);
    text('x' + pad0(G.coins, 2), 120, 18);
    ctx.drawImage(ITEM.heartSmall, 164, 18);
    text('x' + G.lives, 174, 18);
    text('FASE', 228, 8, { color: '#ffd23f' });
    text(LEVELS.labels[G.levelIdx], 228, 18);
    text('TEMPO', 316, 8, { color: '#ffd23f' });
    text(pad0(G.time, 3), 324, 18, { color: G.hurry && (G.t >> 4) % 2 ? '#ff3b3b' : '#ffffff' });
    const b = G.boss;
    if (b && b.landed && b.state !== 'intro') {
      const bw = 120, bx = W / 2 - bw / 2, by = 34;
      text('BUGSOFT', W / 2, by - 1, { color: '#ff5ab4', align: 'center' });
      rect('#1a1020', bx - 1, by + 10, bw + 2, 7); rect('#3a1a4a', bx, by + 11, bw, 5);
      rect(b.hp <= b.maxHp / 2 ? '#ff3b3b' : '#ff5ab4', bx, by + 11, Math.round((bw * b.hp) / b.maxHp), 5);
      rect('#ffffff', bx, by + 11, Math.round((bw * b.hp) / b.maxHp), 1);
    }
  }

  function drawWorld() {
    ART.background(G.L.theme, W, H).draw(ctx, G.cam, G.t);
    ctx.save();
    const sx = G.shake ? Math.round((Math.random() - 0.5) * 4) : 0, sy = G.shake ? Math.round((Math.random() - 0.5) * 4) : 0;
    ctx.translate(-R(G.cam) + sx, sy);
    drawItems(true);
    drawTiles();
    for (const e of G.ents) if (!e.enemy && !e.dying && e.kind !== 'boss' && e.kind !== 'fb') drawObject(e);
    drawItems(false);
    for (const e of G.ents) if ((e.enemy || e.dying) && e.active) drawEnemy(e);
    if (G.boss && !G.boss.gone) drawBoss(G.boss);
    drawPlayer();
    for (const e of G.ents) if (e.kind === 'fb') drawObject(e);
    drawShots();
    drawParts();
    ctx.restore();
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash / 20})`; ctx.fillRect(0, 0, W, H); }
    drawHUD();
    const b = G.boss;
    if (b && b.state === 'intro' && b.landed) {
      rect('rgba(10,3,24,0.7)', 0, 74, W, 52);
      text('CHEFÃO', W / 2, 82, { color: '#ffd23f', align: 'center' });
      text('BUGSOFT', W / 2, 96, { color: '#ff5ab4', size: 16, align: 'center', outline: '#1a1020' });
      text('O BUG SUPREMO', W / 2, 115, { color: '#ffffff', align: 'center' });
    }
  }

  function drawMenu(items, y0, gap) {
    G.menuRects = [];
    items.forEach((it, i) => {
      const y = y0 + i * gap, sel = i === G.menuSel;
      const w = it.label.length * 8 + 24;
      G.menuRects.push({ x: W / 2 - w / 2, y: y - 4, w, h: 16 });
      if (sel) { rect('rgba(11,16,51,0.75)', W / 2 - w / 2, y - 4, w, 16); text('>', W / 2 - w / 2 + 4 + ((G.stateT >> 4) % 2), y, { color: '#ffd23f' }); }
      text(it.label, W / 2 + 6, y, { color: sel ? '#ffd23f' : '#ffffff', align: 'center' });
    });
  }

  function drawTitle() {
    ART.background('title', W, H).draw(ctx, G.t * 1.2, G.t);
    const ts = ART.tiles('tropical');
    const off = -R(G.t * 1.2) % 16;
    for (let x = off; x < W; x += 16) { ctx.drawImage(ts.groundTop, x, H - 32); ctx.drawImage(ts.ground, x, H - 16); }
    const run = HERO.n.s[Math.floor(G.t / 6) % 2 ? 'walkA' : 'walkB'].r;
    ctx.drawImage(run, 64, H - 48);
    const bx = W - ((G.t * 0.6) % (W + 40));
    ctx.drawImage(ENEMY.bug[(G.t >> 3) & 1].r, R(bx), H - 48);
    ctx.drawImage(ENEMY.cart[(G.t >> 3) & 1].r, R(bx + 22), H - 48);
    ctx.drawImage(ENEMY.ball[3 - ((G.t >> 2) % 4)], R(bx + 44), H - 48);
    // avatar
    const ax = W / 2 - 26, ay = 10;
    rect('#1a1020', ax - 2, ay - 2, 56, 56); rect('#ffd23f', ax - 1, ay - 1, 54, 54); rect('#e8402e', ax, ay, 52, 52);
    if (avatar) ctx.drawImage(avatar, ax + 2, ay + 2);
    text('MATHEUS', W / 2, 70, { color: '#2f7bff', size: 16, align: 'center', outline: '#ffd23f' });
    text('TOP', W / 2 - 52, 92, { color: '#e8402e', size: 16, align: 'center', outline: '#1a1020' });
    text('GAMER', W / 2 + 28, 92, { color: '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
    text('A AVENTURA 100% GAMER', W / 2, 114, { color: '#ff8fd8', align: 'center', outline: '#1a1020' });
    drawMenu(titleItems(), 134, 15);
    const hint = isTouch ? 'TOQUE NA OPÇÃO OU USE A/B' : 'SETAS: MOVER  Z: PULAR  X: CORRER/CD';
    text(hint, W / 2, H - 13, { color: '#ffffff', align: 'center', outline: '#1a1020' });
    if (save.best) text('RECORDE ' + pad0(save.best, 6), W - 6, 6, { color: '#ffffff', align: 'right', size: 8, outline: '#1a1020' });
  }

  function drawIntro() {
    rect('#0b1033', 0, 0, W, H);
    const rnd = ART.rng(42);
    for (let i = 0; i < 50; i++) rect(i % 3 ? '#4a58b0' : '#ffd23f', Math.floor(rnd() * W), Math.floor(rnd() * H), 1, 1);
    const boss = G.L.boss;
    text(boss ? 'CHEFÃO!' : 'FASE ' + (G.levelIdx + 1), W / 2, 44, { color: boss ? '#ff3b3b' : '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
    text(G.L.name, W / 2, 70, { color: '#ffffff', align: 'center' });
    const s = HERO.n.s.idle.r;
    ctx.drawImage(s, W / 2 - 30, 100);
    text('x ' + G.lives, W / 2 - 8, 106, { color: '#ffffff' });
    const words = G.L.intro.split(' ');
    const lines = []; let line = '';
    for (const w of words) { if ((line + ' ' + w).trim().length > 34) { lines.push(line.trim()); line = w; } else line += ' ' + w; }
    lines.push(line.trim());
    lines.forEach((l, i) => text(l, W / 2, 140 + i * 14, { color: '#ff8fd8', align: 'center' }));
    if (G.stateT > 40 && (G.stateT >> 4) % 2) text(isTouch ? 'TOQUE EM A' : 'APERTE Z OU ENTER', W / 2, 196, { color: '#aab3e6', align: 'center' });
  }

  function drawEnding() {
    ART.background('title', W, H).draw(ctx, G.t * 0.6, G.t);
    rect('rgba(11,16,51,0.72)', 16, 10, W - 32, H - 20);
    text('PARABÉNS!', W / 2, 20, { color: '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
    if (avatar) { rect('#ffd23f', W / 2 - 26, 42, 52, 52); ctx.drawImage(avatar, W / 2 - 24, 44); }
    const jump = Math.abs(Math.sin(G.t * 0.08)) * 10;
    ctx.drawImage(HERO.n.b.jump.r, W / 2 - 70, 70 - R(jump));
    ctx.drawImage(HERO.n.b.jump.l, W / 2 + 54, 70 - R(jump));
    text('O BUGSOFT FOI DERROTADO', W / 2, 104, { align: 'center' });
    text('E O UNIVERSO 100% GAMER', W / 2, 118, { align: 'center' });
    text('ESTÁ SALVO!', W / 2, 132, { align: 'center' });
    text('PONTOS ' + pad0(G.score, 6), W / 2, 150, { color: '#ffd23f', align: 'center' });
    text('INSCREVA-SE NO CANAL!', W / 2, 166, { color: '#ff8fd8', align: 'center' });
    text('@MT-TOP-GAMER.2006', W / 2, 180, { color: '#ffffff', align: 'center' });
    drawParts();
  }

  function render() {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    switch (G.state) {
      case 'title': drawTitle(); break;
      case 'intro': drawIntro(); break;
      case 'ending': drawEnding(); break;
      case 'gameover':
        rect('#0b1033', 0, 0, W, H);
        text('GAME OVER', W / 2, 60, { color: '#ff3b3b', size: 16, align: 'center', outline: '#1a1020' });
        text('PONTOS ' + pad0(G.score, 6), W / 2, 92, { align: 'center' });
        text('NUNCA DESISTA, GAMER!', W / 2, 108, { color: '#ff8fd8', align: 'center' });
        if (G.stateT > 60) drawMenu(overItems, 140, 18);
        break;
      default:
        drawWorld();
        if (G.state === 'pause') {
          rect('rgba(11,16,51,0.7)', 0, 0, W, H);
          text('PAUSA', W / 2, 70, { color: '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
          drawMenu(pauseItems, 110, 20);
        }
        if (G.state === 'clear' && P.hidden) {
          text('FASE CONCLUÍDA!', W / 2, 74, { color: '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
          text('BÔNUS DE TEMPO', W / 2, 100, { align: 'center', outline: '#1a1020' });
        }
        if (G.state === 'victory') {
          text('VITÓRIA!', W / 2, 74, { color: '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
          text('VOCÊ VENCEU O BUGSOFT!', W / 2, 100, { align: 'center', outline: '#1a1020' });
        }
    }
  }

  // ------------------------------------------------------------ OVERLAY HTML
  const overlay = document.getElementById('overlay');
  function showOverlay(on) { if (overlay) overlay.hidden = !on; }
  const again = document.getElementById('btn-again');
  if (again) again.addEventListener('click', () => { toState('title'); AUDIO.music('title'); });

  // ------------------------------------------------------------ PAUSA AUTOMÁTICA
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (G.state === 'play') { toState('pause'); AUDIO.stopMusic(); }
      AUDIO.suspend();
    } else AUDIO.resume();
  });

  // ------------------------------------------------------------ LOOP
  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  function loop(now) {
    acc += Math.min(100, now - last); last = now;
    let n = 0;
    while (acc >= STEP && n < 5) { update(); acc -= STEP; n++; }
    if (n === 5) acc = 0;
    render();
    requestAnimationFrame(loop);
  }
  resize();
  const fontReady = document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
  Promise.race([fontReady, new Promise((r) => setTimeout(r, 1500))]).then(() => requestAnimationFrame(loop));

  // para testes
  window.__MTGAME = { G, get P() { return P; }, loadLevel, newGame, toState, step(n = 1) { for (let i = 0; i < n; i++) update(); render(); } };
})();
