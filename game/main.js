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
  let save = { unlocked: 1, best: 0, muted: false, done: [], sec: [] };
  try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = { ...save, ...s }; } catch (e) { /* sem storage */ }
  if (!Array.isArray(save.done)) save.done = [];
  if (!Array.isArray(save.sec)) save.sec = [];
  save.unlocked = Math.min(LEVELS.list.length, Math.max(1, Number.isInteger(save.unlocked) ? save.unlocked : 1));
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* sem storage */ } }
  AUDIO.setMuted(!!save.muted);

  // ------------------------------------------------------------ ENTRADA
  const KMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    Space: 'jump', KeyZ: 'jump', KeyK: 'jump', KeyX: 'run', KeyJ: 'run', ShiftLeft: 'run', ShiftRight: 'run',
    Enter: 'start', Escape: 'start', KeyP: 'start',
  };
  const kb = {}, touch = {}, pad = {}, presses = {};
  const I = {}, prev = {};
  const BTN = ['left', 'right', 'up', 'down', 'jump', 'run', 'start'];
  let audioReady = false;
  function wakeAudio() {
    if (!audioReady) { AUDIO.init(); audioReady = true; }
    AUDIO.resume();
    if (typeof liveKick === 'function') liveKick();
  }
  window.addEventListener('keydown', (e) => {
    wakeAudio();
    if (e.code === 'KeyM') { if (!e.repeat) toggleMute(); return; }
    const k = KMAP[e.code];
    if (k) { if (!e.repeat) presses[k] = true; kb[k] = true; e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => { const k = KMAP[e.code]; if (k) { kb[k] = false; e.preventDefault(); } });
  window.addEventListener('blur', () => { for (const k in kb) kb[k] = false; for (const k of BTN) { presses[k] = false; touch[k] = false; } fingers.clear(); syncTouch(); });

  // controles de toque: cada dedo vale pelo botão que está embaixo dele, então dá pra
  // arrastar o polegar entre os botões (do B pro A) ou apertar os dois juntos
  const touchZone = document.querySelector('.touch');
  const dpad = document.getElementById('dpad');
  const fingers = new Map();
  function keysAt(x, y) {
    if (dpad) {
      const r = dpad.getBoundingClientRect(), m = 28;
      if (x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m) {
        const rx = (x - r.left) / r.width;
        return rx < 0.45 ? ['left'] : rx > 0.55 ? ['right'] : [];
      }
    }
    const out = [];
    document.querySelectorAll('.touch [data-k]').forEach((el) => {
      const r = el.getBoundingClientRect(), m = el.dataset.k === 'start' ? 4 : 16;
      if (x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m) out.push(el.dataset.k);
    });
    return out;
  }
  function syncTouch() {
    const held = new Set();
    for (const ks of fingers.values()) ks.forEach((k) => held.add(k));
    for (const k of BTN) {
      const v = held.has(k);
      if (v && !touch[k]) {
        presses[k] = true;
        if (navigator.vibrate) { try { navigator.vibrate(8); } catch (err) { /* ok */ } }
      }
      touch[k] = v;
    }
    document.querySelectorAll('.touch [data-k]').forEach((el) => el.classList.toggle('on', held.has(el.dataset.k)));
    if (dpad) dpad.dataset.dir = held.has('left') ? 'l' : held.has('right') ? 'r' : '';
  }
  if (touchZone) {
    const down = (e) => { e.preventDefault(); wakeAudio(); try { touchZone.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } fingers.set(e.pointerId, keysAt(e.clientX, e.clientY)); syncTouch(); };
    const move = (e) => { if (!fingers.has(e.pointerId)) return; e.preventDefault(); fingers.set(e.pointerId, keysAt(e.clientX, e.clientY)); syncTouch(); };
    const up = (e) => { fingers.delete(e.pointerId); syncTouch(); };
    touchZone.addEventListener('pointerdown', down);
    touchZone.addEventListener('pointermove', move);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => touchZone.addEventListener(t, up));
    touchZone.addEventListener('contextmenu', (e) => e.preventDefault());
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
      I[k + 'P'] = (v && !prev[k]) || !!presses[k];
      presses[k] = false;
      I[k] = v;
      prev[k] = v;
    }
    I.selP = I.jumpP || I.startP;
  }

  function dialogAdvance() {
    return I.selP || (click && click.x >= 10 && click.x <= W - 10 && click.y >= 34 && click.y <= 88);
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
    boss: null, goal: null, tallyDone: false, tallyT: 0, flash: 0, mapSel: 0, secrets: 0, secretTotal: 0, dialog: null, nearShop: false,
  };
  let P = null;

  const SOLID = new Set(['#', 'B', 'M', 'X', '[', ']', '?', '1', '*', 'E', 'F', '<', '>']);
  const FLYERS = new Set(['f', 'p', 'n', 'h', 'm']);
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
    const base = { t: 0, vx: 0, vy: 0, dir: -1, active: false, zone: zoneAt(bx) };
    switch (d.type) {
      case 'guard': case 'g': return { ...base, kind: 'g', guard: d.type === 'guard', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true };
      case 'hay': return { ...base, kind: 'hay', active: true, x: bx, y: by - 10, w: 32, h: 10 };
      case 'venue': return { ...base, kind: 'venue', active: true, x: bx, y: by - 67, w: 112, h: 67 };
      case 's': return { ...base, kind: 's', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true };
      case 'b': return { ...base, kind: 'b', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true, roll: 0, stun: 0 };
      case 'B': return { ...base, kind: 'b', turbo: true, x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true, roll: 0, stun: 0 };
      case 'c': return { ...base, kind: 'c', x: bx + 1, y: by - 12, w: 14, h: 12, enemy: true };
      case 'w': return { ...base, kind: 'w', x: bx + 1, y: by - 14, w: 14, h: 14, enemy: true, roll: 0 };
      case 'p': return { ...base, kind: 'p', x: bx + 1, y: by - 10, w: 14, h: 10, enemy: true, baseY: by - 10 };
      case 'n': return { ...base, kind: 'n', x: bx + 2, y: by - 14, w: 12, h: 14, enemy: true, baseY: by - 14 };
      case 'h': return { ...base, kind: 'h', x: bx, y: by - 12, w: 16, h: 12, enemy: true, baseY: by - 12 };
      case 'crowd': return { ...base, kind: 'crowd', plat: true, active: true, x: bx, y: by - 16, w: 16, h: 16, look: d.x % 4, dx: 0, dy: 0 };
      case 'cut': return { ...base, kind: 'cut', plat: true, active: true, x: bx, y: d.y * T, w: 32, h: 8, off: d.off || 0, period: 200, dx: 0, dy: 0, ghost: false };
      case 'npc': return { ...base, kind: 'npc', active: true, who: d.who, say: d.say, lines: d.lines, x: bx, y: by - 16, w: 16, h: 16, met: 0, done: false, face: -1 };
      case 'martbuz': return { ...base, kind: 'martbuz', active: true, x: bx, y: by - 16, w: 16, h: 16, phase: 'wait' };
      case 'kiss': return { ...base, kind: 'kiss', active: true, x: bx, y: by - 16, w: 16, h: 16, phase: 'wait', bx: bx, mx: bx + 40 };
      case 'boss2': return { ...base, kind: 'boss', b2: true, active: true, x: bx - 12, y: -60, w: 40, h: 40, hp: 12, maxHp: 12, state: 'intro', face: -1, inv: 0, landed: false, last: '', baseY: 52 };
      case 'k': return { ...base, kind: 'k', x: bx + 1, y: by - 15, w: 14, h: 15, enemy: true, state: 'walk', shellT: 0, kickT: 0 };
      case 'f': return { ...base, kind: 'f', x: bx + 1, y: by - 12, w: 14, h: 12, enemy: true, baseY: by - 12 };
      case 'm': return { ...base, kind: 'm', x: bx + 1, y: by - 10, w: 14, h: 10, enemy: true, baseY: by - 10 };
      case 'dash': return { ...base, kind: 'dash', active: true, x: bx, y: by - 3, w: 16, h: 3, cool: 0 };
      case 'tram': case 'mph': return { ...base, kind: 'mp', tram: d.type === 'tram', plat: true, active: true, axis: 'x', x: bx, y: d.y * T, w: 48, h: 8, a: bx, b: bx + d.range * T, dir: 1, speed: 0.8, dx: 0, dy: 0 };
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
    G.secrets = 0; G.secretTotal = def.ents.filter((d) => d.type === 'npc' && d.who === 'discord').length;
    let start = def.start;
    if (fromCheck && G.check && G.check.level === idx) {
      start = { x: G.check.x, y: G.check.y };
      for (const e of G.ents) if (e.kind === 'K' && e.tx <= G.check.x) e.on = true;
    } else if (G.check && G.check.level !== idx) G.check = null;
    P = { x: start.x * T + 2, y: (start.y + 1) * T - 15, w: 12, h: 15, vx: 0, vy: 0, face: 1, onGround: false, power: 0, inv: 0, star: 0,
      coyote: 0, jumpBuf: 0, anim: 0, combo: 0, dead: false, pit: false, onPlat: null, cdCool: 0, prevBottom: 0, hidden: false, skid: false };
    setPower(G.power);
    G.time = def.time; G.timeAcc = 0; G.hurry = false; G.freeze = 0; G.shake = 0; G.flash = 0;
    G.tallyDone = false; G.look = 0; G.zone = null; G.zoneBanner = null;
    G.dialog = null; G.nearShop = false; G.scene = null;
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
    G.kissSeen = false;
    G.score = 0; G.coins = 0; G.lives = 5; G.power = 0; G.check = null;
    loadLevel(idx, false);
    toState('intro');
    AUDIO.stopMusic(); AUDIO.sfx('start');
  }
  // ---------- Tropa da Martbuz (Rafael e Scott) e o Jackson
  function martbuzScene(e) {
    e.t++;
    updateParts();
    P.vx = 0; P.vy = Math.min(P.vy + 0.42, 6); { const pb = P.y + P.h; P.y += P.vy; collideY(P, pb); }
    const advance = G.dialog && dialogAdvance();
    if (e.phase === 'intro') {
      const stopR = P.x + 70, stopS = P.x + 114;
      if (e.rx > stopR) e.rx -= 1.6;
      if (e.sx > stopS) e.sx -= 1.6;
      if (advance && G.dialog.who === 'rafael') e.t = 201;
      else if (advance && G.dialog.who === 'scott') e.t = 321;
      if (e.t > 50 && e.t <= 200) G.dialog = { who: 'rafael', name: 'RAFAEL', txt: 'Somos da tropa da Martbuz e vamos acabar com voce!!', advance: true };
      else if (e.t > 200) G.dialog = { who: 'scott', name: 'SCOTT', txt: 'E isso ai. Prepara, Matheus...', advance: true };
      if (e.t > 320) {
        G.dialog = null; G.scene = null; e.phase = 'fight';
        const mk = (who, x) => ({ kind: 'rival', who, x, y: 192 - 16, w: 14, h: 16, vx: 0, vy: 0, dir: -1, t: who === 'scott' ? 45 : 0, active: true, enemy: true, hp: 3, inv: 0 });
        G.ents.push(mk('rafael', stopR), mk('scott', stopS));
        toState('play');
      }
    } else if (e.phase === 'jackson') {
      if (e.jdir < 0) {
        if (e.jx > P.x + 50) e.jx -= 2.6;
        else if (!e.talk) { e.talk = e.t; }
        if (e.talk) {
          if (advance) e.t = e.talk + (G.dialog.next ? 130 : 221);
          const first = e.t - e.talk < 130;
          G.dialog = { who: 'jackson', name: 'JACKSON', txt: first ? 'Zubba lorpi Martbuz?! Kranka fuu bli-bli, Matheus zonk-zonk!' : 'Oh-no-no... PIPPO NUNGA! Waaah!', advance: true, next: first };
          if ((e.t - e.talk) % 6 === 0) AUDIO.sfx('blip');
          if (e.t - e.talk > 220) { e.jdir = 1; G.dialog = null; for (let i = 0; i < 3; i++) G.parts.push({ type: 'tear', x: e.jx + 12, y: e.y + 2, vx: 0.5 + i * 0.3, vy: -1.2, life: 26 }); }
        }
      } else {
        e.jx += 3.4;
        if (e.t % 6 === 0) G.parts.push({ type: 'dust', x: e.jx + 2, y: e.y + 14, vx: -0.4, vy: -0.2, life: 14 });
        if (e.jx > G.cam + W + 20) { e.phase = 'done'; G.scene = null; G.dialog = null; toState('play'); }
      }
    }
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
      if (p.star === 0) AUDIO.music(levelSong());
    }
    if (p.cdCool > 0) p.cdCool--;
    if (p.onPlat && p.onPlat.ghost) p.onPlat = null;
    if (p.onPlat) { p.x += p.onPlat.dx; p.y = p.onPlat.y - p.h; }
    const water = !!G.L.water;

    const jumpHeld = I.jump || I.up, jumpPressed = I.jumpP || I.upP;
    // no celular o Matheus corre sozinho ao segurar a direção (o B fica pro CD)
    const run = I.run || touch.left || touch.right;
    const max = water ? (run ? 1.7 : 1.2) : run ? 2.6 : 1.45;
    const ice = p.onGround && (G.L.ice || G.L.zones?.[G.zone]?.[4]);
    const acc = (p.onGround ? (run ? 0.1 : 0.08) : 0.07) * (ice ? 0.45 : 1);
    let dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    if (G.glitch && G.glitch.kind === 'invert') dir = -dir;
    p.skid = false;
    if (dir !== 0) {
      p.face = dir;
      if (p.onGround && Math.sign(p.vx) === -dir && Math.abs(p.vx) > 0.8) {
        p.vx += dir * (ice ? 0.07 : 0.2); p.skid = true;
        if (G.t % 4 === 0) G.parts.push({ type: 'dust', x: p.x + p.w / 2, y: p.y + p.h - 2, vx: -dir * 0.3, vy: -0.3, life: 14 });
      } else if (p.vx * dir < max) p.vx = dir > 0 ? Math.min(p.vx + acc, max) : Math.max(p.vx - acc, -max);
    } else {
      const fr = p.onGround ? (ice ? 0.015 : 0.1) : 0.02;
      p.vx = Math.abs(p.vx) <= fr ? 0 : p.vx - Math.sign(p.vx) * fr;
    }
    if (Math.abs(p.vx) > max) p.vx -= Math.sign(p.vx) * Math.min(0.06, Math.abs(p.vx) - max);

    if (water) {
      // embaixo d'água: pular = dar uma braçada
      if (jumpPressed) { p.vy = -2.6; p.onGround = false; p.onPlat = null; AUDIO.sfx('swim'); for (let i = 0; i < 2; i++) G.parts.push({ type: 'bubble', x: p.x + p.w / 2, y: p.y + 4, vx: (Math.random() - 0.5) * 0.4, vy: -0.6, life: 50 }); }
      p.vy += 0.09; if (p.vy > 1.6) p.vy = 1.6; if (p.vy < -3) p.vy = -3;
      if (G.t % 50 === 0) G.parts.push({ type: 'bubble', x: p.x + p.w / 2 + p.face * 4, y: p.y + 6, vx: 0, vy: -0.5, life: 60 });
    } else {
    if (jumpPressed) p.jumpBuf = 7; else if (p.jumpBuf > 0) p.jumpBuf--;
    if (p.onGround) p.coyote = 6; else if (p.coyote > 0) p.coyote--;
    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = Math.min(p.vy, -(5.7 + Math.abs(p.vx) * 0.25));
      p.onGround = false; p.coyote = 0; p.jumpBuf = 0; p.onPlat = null;
      AUDIO.sfx(p.power ? 'jumpBig' : 'jump');
    }
    p.vy += (p.vy < 0 && jumpHeld ? 0.2 : 0.42) * (G.glitch && G.glitch.kind === 'lowgrav' ? 0.45 : 1);
    if (p.vy > 6.5) p.vy = 6.5;
    }

    if (p.power === 2 && I.runP && !G.nearShop && p.cdCool === 0 && G.shots.filter((s) => s.kind === 'disc').length < 2) {
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
        if (!pl.plat || pl.gone || pl.ghost) continue;
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
    if (water && p.y < 4) { p.y = 4; if (p.vy < 0) p.vy = 0; }
    // esteira rolante
    if (p.onGround) {
      const under = tileAt(Math.floor((p.x + p.w / 2) / T), Math.floor((p.y + p.h + 1) / T));
      if (under === '>' || under === '<') { const push = under === '>' ? 0.7 : -0.7; const ovx = p.vx; p.vx = push; p.x += push; collideX(p); p.vx = ovx; }
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
      if (c === 'w') p.vx += Math.sin(G.t * 0.02) * 0.045;
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
      if (!P.dead && overlap(it, P) && it.rise <= 0) {
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
    if (e.kind === 'rival') {
      if (stomp) {
        p.y = e.y - p.h; stompBounce();
        if (e.inv === 0) { e.hp--; e.inv = 40; AUDIO.sfx('stomp'); addScore(500, e.x, e.y); if (e.hp <= 0) { flipKill(e); addScore(2000, e.x, e.y - 10); } }
      } else if (e.inv < 20) hurtPlayer();
      return;
    }
    if (e.kind === 'c' && e.up && stomp) { hurtPlayer(); return; }
    if (e.kind === 'w' && stomp && !e.load) { hurtPlayer(); return; }
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
    const playerInZone = e.zone == null || e.zone === G.zone;
    if (e.kind === 'g') walker(e, e.guard ? 0.68 : 0.5, e.guard);
    else if (e.kind === 's') walker(e, 0.55, false);
    else if (e.kind === 'rival') {
      if (e.inv > 0) e.inv--;
      if (e.t % 50 === 0) e.dir = P.x < e.x ? -1 : 1;
      walker(e, e.who === 'scott' ? 0.9 : 0.7, false);
      if (e.who === 'scott' && e.onGround && e.t % 100 === 0) e.vy = -5.2;
      if (e.who === 'rafael' && e.t % 110 === 60 && Math.abs(P.x - e.x) < 220) G.shots.push({ kind: 'msg', x: e.x + 2, y: e.y + 2, w: 10, h: 8, vx: clamp((P.x - e.x) / 45, -2.6, 2.6), vy: -2.8, t: 0 });
    }
    else if (e.kind === 'c') { walker(e, 0.4, true); e.up = (e.t % 140) < 70; }
    else if (e.kind === 'w') {
      e.load = (e.t % 160) >= 100;
      if (e.load) { e.vx = 0; e.vy = Math.min(e.vy + 0.35, 6); const pb = e.y + e.h; e.y += e.vy; collideY(e, pb); }
      else { if (playerInZone && e.t % 160 === 1) e.dir = P.x < e.x ? -1 : 1; walker(e, 1.2, false); e.roll += e.vx; }
    } else if (e.kind === 'p') {
      e.x += e.dir * 0.5; e.y = e.baseY + Math.sin(e.t * 0.04) * 12;
    } else if (e.kind === 'n') {
      e.y = e.baseY + Math.sin(e.t * 0.05) * 3;
      if (e.t % 130 === 60 && Math.abs(P.x - e.x) < 150) { G.shots.push({ kind: 'drop', x: e.x + 2, y: e.y + e.h, w: 8, h: 8, vx: 0, vy: 1.2, t: 0 }); AUDIO.sfx('select'); }
    } else if (e.kind === 'h') {
      if (e.t > 1500) { e.y -= 1; if (e.y < -30) e.gone = true; }
      else {
        const tx = P.x + 24;
        if (Math.abs(P.x - e.x) < 240) e.x += Math.sign(tx - e.x) * Math.min(0.55, Math.abs(tx - e.x));
        e.y = e.baseY + Math.sin(e.t * 0.04) * 8;
        e.dir = P.x < e.x ? -1 : 1;
        if (e.t % 170 === 90 && Math.abs(P.x - e.x) < 200) G.shots.push({ kind: 'msg', x: e.x + 3, y: e.y + 4, w: 10, h: 8, vx: clamp((P.x - e.x) / 45, -2.6, 2.6), vy: -2.6, t: 0 });
      }
    }
    else if (e.kind === 'b') {
      if (e.stun > 0) { e.stun--; e.vx = 0; e.vy = Math.min(e.vy + 0.35, 6); const pb = e.y + e.h; e.y += e.vy; collideY(e, pb); }
      else {
        if (playerInZone && e.t % 40 === 0) e.dir = P.x < e.x ? -1 : 1;
        walker(e, e.turbo ? 1.6 : 1.05, false);
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
      e.x += e.dir * 0.45;
      e.y = e.baseY + Math.sin(e.t * 0.045) * 18;
    } else if (e.kind === 'm') {
      // morcego: voa em zigue-zague indo atrás do jogador
      const dir = playerInZone ? Math.sign(P.x - e.x) : e.dir;
      e.x += dir * 0.6;
      if (dir) e.dir = dir;
      e.y = e.baseY + Math.sin(e.t * 0.08) * 14;
    }
  }

  function keepEnemyInZone(e) {
    if (e.zone == null) return;
    const min = G.L.zones[e.zone][0] * T;
    const max = (G.L.zones[e.zone + 1]?.[0] ?? G.mw) * T - e.w;
    if (e.x >= min && e.x <= max) return;
    e.dir = e.x < min ? 1 : -1;
    e.x = clamp(e.x, min, max);
    e.vx = 0;
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
      else if (!FLYERS.has(a.kind) && !FLYERS.has(b.kind)) {
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
    else if (e.kind === 'cut') { const ph = (G.t + e.off) % e.period; e.ghost = ph >= e.period * 0.65; e.blink = !e.ghost && ph >= e.period * 0.5; }
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
    } else if (e.kind === 'dash') {
      if (e.cool > 0) e.cool--;
      if (P.onGround && P.x + P.w > e.x && P.x < e.x + e.w && Math.abs(P.y + P.h - (e.y + e.h)) < 4 && P.vx > -1) {
        P.vx = Math.max(P.vx, 5.6); P.face = 1;
        if (e.cool === 0) { AUDIO.sfx('boost'); e.cool = 20; for (let i = 0; i < 6; i++) G.parts.push({ type: 'spark', x: e.x + 8, y: e.y, vx: -1 - Math.random() * 2, vy: -Math.random() * 1.5, life: 18, color: '#ffb02e' }); }
      }
    } else if (e.kind === 'G') {
      if (G.state === 'play' && P.x + P.w > e.x + 6 && P.y + P.h > e.y) levelClear();
    } else if (e.kind === 'martbuz') {
      if (e.phase === 'wait' && P.onGround && P.x > e.x) {
        e.phase = 'intro'; e.t = 0; e.rx = G.cam + W + 20; e.sx = G.cam + W + 64; G.scene = e; P.vx = 0; P.face = 1; toState('scene'); AUDIO.sfx('rival');
      } else if (e.phase === 'fight' && !G.ents.some((r) => r.kind === 'rival' && !r.dying)) {
        e.phase = 'jackson'; e.t = 0; e.jx = G.cam + W + 10; e.jdir = -1; G.scene = e; P.vx = 0; toState('scene');
      }
    } else if (e.kind === 'kiss') {
      if (e.phase === 'wait' && !G.kissSeen && P.onGround && P.x + P.w > e.x - 70 && P.x < e.x) {
        e.phase = 'run'; e.t = 0; G.scene = e; G.kissSeen = true; P.vx = 0; P.face = 1; toState('scene');
      }
      if (e.phase === 'done' && G.t % 40 === 0) G.parts.push({ type: 'heart', x: (e.bx + e.mx) / 2 + 8, y: e.y - 2, vx: 0, vy: -0.4, life: 50 });
    } else if (e.kind === 'npc') {
      e.vy = Math.min(e.vy + 0.35, 6); const pb = e.y + e.h; e.y += e.vy; collideY(e, pb);
      e.face = P.x < e.x ? -1 : 1;
      const near = !P.dead && Math.abs(P.x + P.w / 2 - (e.x + 8)) < 28 && Math.abs(P.y + P.h - (e.y + e.h)) < 40;
      if (!near) { e.dialogDismissed = false; e.dialogPage = 0; e.dialogText = null; }
      return near;
    } else if (e.kind === 'fb') {
      e.ang += e.speed;
      if (P.dead) return;
      for (let i = 1; i < e.len; i++) {
        const bx = e.cx + Math.cos(e.ang) * i * 8, by = e.cy + Math.sin(e.ang) * i * 8;
        if (bx + 3 > P.x + 2 && bx - 3 < P.x + P.w - 2 && by + 3 > P.y + 2 && by - 3 < P.y + P.h - 1) { hurtPlayer(); break; }
      }
    }
  }

  const NPC_NAME = { axo: 'AXOLOTE', ps2: 'PS2 GORDO', discord: 'GALERA DO DISCORD', babs: 'BABS MARY', inscrito: 'INSCRITO 500', miguel: 'MIGUEL', rafael: 'RAFAEL', scott: 'SCOTT', jackson: 'JACKSON' };
  function showNpcDialog(e, who, txt) {
    if (e.dialogText !== txt) { e.dialogText = txt; e.dialogPage = 0; e.dialogDismissed = false; }
    if (!e.dialogDismissed) G.dialog = { who, name: NPC_NAME[who], txt, lines: wrap(txt, 38), npc: e, page: e.dialogPage };
  }
  function npcTalk(e) {
    if (e.who === 'couple') {
      // casal ajudante: a Babs chama, o Miguel dá um presente
      const step = e.met < 100 ? 0 : e.met < 230 ? 1 : 2;
      if (step >= 1 && !e.done) {
        e.done = true;
        const kind = P.power === 0 ? 'turbo' : P.power === 1 ? 'cd' : 'star';
        G.items.push({ kind, x: e.x + 1, y: e.y - 18, w: 14, h: 14, vx: 0, vy: -3, dir: P.x < e.x ? -1 : 1, rise: 0, t: 0 });
        AUDIO.sfx('appear');
        for (let i = 0; i < 4; i++) G.parts.push({ type: 'heart', x: e.x + 8, y: e.y - 4, vx: (Math.random() - 0.5) * 0.8, vy: -0.6, life: 50 });
      }
      const lines = e.lines || [['babs', 'Amor, olha o Matheus!'], ['miguel', 'Salve, Matheus! Toma um presente da gente!'], ['babs', 'Boa sorte! A gente ta torcendo por voce <3']];
      showNpcDialog(e, lines[step][0], lines[step][1]);
      return;
    }
    let txt = e.say || '';
    if (e.who === 'axo' && !txt) txt = 'Oi, Matheus! Eu sou o Axolote. Fica de olho nas casinhas: algumas tem porta secreta!';
    else if (e.who === 'inscrito' && !txt) txt = 'Eu fui o inscrito 500! Bora, Matheus, o canal vai longe!';
    else if (e.who === 'discord') {
      txt = 'Salve, Matheus! Sou da galera do Discord. Toma uma vida pra ajudar!';
      if (!e.done) { e.done = true; G.secrets++; oneUp(e.x, e.y - 10); pop('SEGREDO!', e.x - 16, e.y - 22, '#ffd23f'); }
    } else if (e.who === 'babs' && !e.say) {
      if (e.met < 110 && !e.done) txt = 'MATHEUS!! O BUGSOFT VOLTOU E TA BEM ATRAS DE VOCE!!';
      else {
        txt = 'E brincadeira, Matheus! Kkkkk' + (e.gift ? '' : ' Toma 10 fichas!');
        if (!e.done) { e.done = true; e.gift = false; G.coins += 10; AUDIO.sfx('coin'); pop('+10', e.x, e.y - 10, '#ffd23f'); if (G.coins >= 100) { G.coins -= 100; oneUp(e.x, e.y - 20); } }
        if (e.met > 300) e.gift = true;
      }
    } else if (e.who === 'ps2') {
      const offer = P.power === 0 ? ['turbo', 20, 'CONTROLE TURBO'] : P.power === 1 ? ['cd', 30, 'DISCO'] : ['life', 40, 'UMA VIDA'];
      if (e.msgT > 0) { e.msgT--; txt = e.msg; }
      else txt = 'Bora negociar? ' + offer[2] + ' por ' + offer[1] + ' fichas. Aperte B (X) pra comprar!';
      if (I.runP) {
        if (G.coins >= offer[1]) {
          G.coins -= offer[1];
          if (offer[0] === 'life') oneUp(e.x, e.y - 10); else powerUp(offer[0] === 'turbo' ? 1 : 2, e.x, e.y - 10);
          e.msg = 'Valeu, Matheus! Negocio fechado. Volte sempre!'; e.msgT = 120;
        } else { e.msg = 'Faltam fichas, parceiro! Junte ' + offer[1] + ' e volta aqui.'; e.msgT = 100; AUDIO.sfx('bump'); }
        txt = e.msg;
        e.dialogDismissed = false;
      }
    }
    showNpcDialog(e, e.who, txt);
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
          if (e.kind === 'boss' && G.boss && !['intro', 'dying', 'lag'].includes(e.state) && overlap(s, e)) { s.gone = true; poof(s.x + 4, s.y + 4); if (e.inv === 0) bossDamage(e, 1, 20); break; }
        }
        for (const o of G.shots) if ((o.kind === 'orb' || o.kind === 'drop' || o.kind === 'msg') && !o.gone && overlap(s, o)) { o.gone = true; s.gone = true; poof(o.x + 5, o.y + 5); }
      } else if (s.kind === 'orb') {
        if (!s.nograv) s.vy += 0.15;
        s.x += s.vx; s.y += s.vy;
        if (solidAt(Math.floor((s.x + 5) / T), Math.floor((s.y + 8) / T)) && s.vy > 0) { s.gone = true; poof(s.x + 5, s.y + 5); continue; }
        if (s.y > H + 10 || s.y < -20 || s.x < -20 || s.x > G.mw * T + 20 || s.t > 360) s.gone = true;
        if (!P.dead && overlap(s, P)) hurtPlayer();
      } else if (s.kind === 'drop' || s.kind === 'msg') {
        if (s.kind === 'msg') s.vy += 0.12;
        s.x += s.vx; s.y += s.vy;
        if (solidAt(Math.floor((s.x + s.w / 2) / T), Math.floor((s.y + s.h) / T))) { s.gone = true; poof(s.x + 4, s.y + 4); continue; }
        if (s.y > H + 10 || s.t > 400) s.gone = true;
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
  function bossDying(b) {
    b.vx = 0; G.shake = 3;
    if (b.t % 7 === 0) { G.parts.push({ type: 'boom', x: b.x + Math.random() * b.w, y: b.y + Math.random() * b.h, r: 0, life: 22 }); if (b.t % 14 === 0) AUDIO.sfx('boom'); }
    if (b.t === 150) {
      b.gone = true; G.flash = 20; AUDIO.sfx('boom'); addScore(10000, b.x + 10, b.y);
      for (let i = 0; i < 30; i++) G.parts.push({ type: 'spark', x: b.x + b.w / 2, y: b.y + b.h / 2, vx: (Math.random() - 0.5) * 7, vy: (Math.random() - 0.5) * 7, life: 40, color: ['#ff5ab4', '#2fe0ff', '#ffd23f'][i % 3] });
      toState('victory'); AUDIO.sfx('clear');
    }
  }
  function updateBoss2(b) {
    const p = P, enr = b.hp <= b.maxHp / 2;
    if (b.state === 'dying') { bossDying(b); return; }
    if (b.state === 'intro') {
      b.y = Math.min(b.y + 2, b.baseY);
      if (b.y >= b.baseY && !b.landed) { b.landed = true; b.t = 0; G.shake = 16; AUDIO.sfx('thud'); }
      if (b.landed && b.t > 110) { bossState(b, 'float'); AUDIO.music('boss2'); }
      return;
    }
    const minX = T + 4, maxX = (G.mw - 1) * T - b.w - 4;
    switch (b.state) {
      case 'float': {
        const tx = clamp(p.x + p.w / 2 - b.w / 2, minX, maxX);
        b.x += (tx - b.x) * (enr ? 0.03 : 0.02);
        b.y = b.baseY + Math.sin(b.t * 0.05) * 10;
        if (b.t > (enr ? 80 : 120)) { const opts = ['spin', 'slam', 'lag'].filter((o) => o !== b.last); const pick = opts[Math.floor(Math.random() * opts.length)]; b.last = pick; bossState(b, pick); }
        break;
      }
      case 'spin':
        if (b.t === 40) {
          const n = enr ? 12 : 8;
          for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; G.shots.push({ kind: 'orb', x: b.x + b.w / 2 - 5, y: b.y + b.h / 2 - 5, w: 10, h: 10, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, t: 0, nograv: true }); }
          AUDIO.sfx('orb');
        }
        if (b.t > 75) bossState(b, 'float');
        break;
      case 'slam':
        if (b.t < 20) b.y -= 0.6;
        else {
          b.vy = Math.min((b.vy || 0) + 0.6, 8); const pb = b.y + b.h; b.y += b.vy; collideY(b, pb);
          if (b.onGround) {
            G.shake = 18; AUDIO.sfx('thud'); b.vy = 0;
            const sp = enr ? 3 : 2.4;
            G.shots.push({ kind: 'wave', x: b.x - 12, y: b.y + b.h - 12, w: 12, h: 12, vx: -sp, vy: 0, t: 0 });
            G.shots.push({ kind: 'wave', x: b.x + b.w, y: b.y + b.h - 12, w: 12, h: 12, vx: sp, vy: 0, t: 0 });
            bossState(b, 'dazed');
          }
        }
        break;
      case 'dazed':
        if (b.t > (enr ? 80 : 105)) bossState(b, 'rise');
        break;
      case 'rise':
        b.y -= 1.5;
        if (b.y <= b.baseY) { b.y = b.baseY; bossState(b, 'float'); }
        break;
      case 'lag':
        if (b.t === 45) { b.x = clamp(p.x + p.w / 2 - b.w / 2, minX, maxX); pop('LAG!', b.x + 4, b.y - 10, '#ff5ab4'); AUDIO.sfx('dash'); }
        if (b.t > 70) bossState(b, 'float');
        break;
      default: break;
    }
    if (!p.dead && overlap(p, b) && b.state !== 'lag') {
      const stomp = p.vy > 0 && p.prevBottom <= b.y + 12;
      if (stomp) { p.y = b.y - p.h; p.vy = -6.6; p.onGround = false; if (b.inv === 0) bossDamage(b, b.state === 'dazed' ? 3 : 1); else AUDIO.sfx('stomp'); }
      else if (p.star > 0) { if (b.inv === 0) bossDamage(b, 1); }
      else hurtPlayer();
    }
  }
  function updateBoss(b) {
    b.t++;
    if (b.inv > 0) b.inv--;
    if (b.b2) { updateBoss2(b); return; }
    const p = P, enr = b.hp <= b.maxHp / 2;
    const face = p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1;
    if (b.state === 'dying') { bossDying(b); return; }
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
  function finishLevel() {
    const i = G.levelIdx;
    save.done[i] = 1; save.sec[i] = Math.max(save.sec[i] || 0, G.secrets);
    save.unlocked = Math.max(save.unlocked, Math.min(i + 2, LEVELS.list.length));
    save.best = Math.max(save.best, G.score); persist();
    G.power = P.power; G.check = null;
    if (i + 1 >= LEVELS.list.length) {
      toState('ending'); AUDIO.music('ending');
      for (let k = 0; k < 70; k++) G.parts.push({ type: 'confetti', x: Math.random() * W, y: Math.random() * H - H, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random(), life: 400, color: ['#ffd23f', '#e8402e', '#2f7bff', '#3bd16f', '#ff5ab4'][k % 5] });
      return;
    }
    openMap(i + 1);
  }
  function openMap(sel) { toState('map'); G.mapSel = clamp(sel, 0, save.unlocked - 1); AUDIO.music('title'); }
  function enterLevel(i) { G.check = null; loadLevel(i, false); toState('intro'); AUDIO.stopMusic(); AUDIO.sfx('start'); }
  // posições dos pontos no mapa, uma linha por mundo
  const MAP_PTS = [[60, 58], [118, 46], [176, 60], [234, 46], [312, 54], [60, 108], [118, 96], [176, 110], [234, 96], [312, 104], [118, 152], [196, 146], [274, 154]];
  function updateMap() {
    const n = LEVELS.list.length;
    const mv = (d) => { let k = G.mapSel + d; if (k < 0 || k >= n || k >= save.unlocked) return; G.mapSel = k; AUDIO.sfx('select'); };
    if (I.leftP || I.upP) mv(-1);
    if (I.rightP || I.downP) mv(1);
    if (click) {
      const k = MAP_PTS.findIndex(([x, y]) => Math.abs(click.x - x) < 16 && Math.abs(click.y - y) < 16);
      if (k >= 0 && k < save.unlocked) { if (k === G.mapSel) { enterLevel(k); return; } G.mapSel = k; AUDIO.sfx('select'); }
    }
    if (I.jumpP) { enterLevel(G.mapSel); return; }
    if (I.startP) { toState('title'); AUDIO.music('title'); }
  }

  // ------------------------------------------------------------ PARTÍCULAS
  function updateParts() {
    for (const q of G.parts) {
      q.life--;
      if (q.type === 'debris') { q.vy += 0.3; q.x += q.vx; q.y += q.vy; }
      else if (q.type === 'coin') { q.vy += 0.35; q.y += q.vy; if (q.life === 1) pop(200, q.x, q.y); }
      else if (q.type === 'boom') q.r += 1.2;
      else if (q.type === 'tear') { q.vy += 0.15; q.x += q.vx; q.y += q.vy; }
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
  // ---------- bugs da live do Jackson (eventos aleatórios que atrapalham)
  const GLITCHES = {
    invert: 'CONTROLES INVERTIDOS!', lowgrav: 'GRAVIDADE BUGADA!', lag: 'LAG NA LIVE!', vanish: 'CHAO SUMIU (SO NA TELA)!', shake: 'TELA TREMENDO!',
  };
  function updateGlitch() {
    if (!G.L.live) { G.glitch = null; return false; }
    if (!G.glitch) G.glitch = { kind: null, t: 0, next: 180, n: 0 };
    const g = G.glitch;
    if (!g.kind) {
      if (--g.next <= 0) {
        const ks = Object.keys(GLITCHES); g.kind = ks[Math.floor(Math.random() * ks.length)];
        g.t = 100 + Math.floor(Math.random() * 80); AUDIO.sfx('bossHit'); G.shake = 6;
      }
    } else if (--g.t <= 0) { g.kind = null; g.next = 200 + Math.floor(Math.random() * 220); }
    if (g.kind === 'shake') G.shake = Math.max(G.shake, 2);
    // lag: o jogo trava 2 de cada 3 quadros
    if (g.kind === 'lag') { g.n++; if (g.n % 3) return true; }
    return false;
  }
  function updateZones() {
    if (!G.L.zones) return;
    const k = zoneAt(P.x + P.w / 2);
    if (k !== G.zone) {
      const previous = G.L.zones[G.zone], [, , song, name] = G.L.zones[k];
      G.zone = k;
      if (previous) {
        if (previous[3] !== name) G.zoneBanner = { txt: name, t: 150 };
        if (P.star <= 0) AUDIO.music(song);
      }
    }
    if (G.zoneBanner && --G.zoneBanner.t <= 0) G.zoneBanner = null;
  }
  function updateWorld() {
    if (G.freeze > 0) { G.freeze--; return; }
    if (updateGlitch()) return;
    updateZones();
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
    G.dialog = null; G.nearShop = false;
    let nearestNpc = null, nearestDistance = Infinity;
    for (const e of G.ents) {
      if (!e.active || e.gone || e.plat) continue;
      if (e.kind === 'boss') updateBoss(e);
      else if (e.enemy || e.dying) {
        updateEnemy(e);
        keepEnemyInZone(e);
        if (e.enemy && !e.gone) touchPlayer(e);
      } else if (updateObject(e)) {
        if (e.who === 'ps2') G.nearShop = true;
        const distance = Math.abs(P.x + P.w / 2 - (e.x + 8));
        if ((!e.dialogDismissed || (e.who === 'ps2' && I.runP)) && distance < nearestDistance) {
          nearestNpc = e; nearestDistance = distance;
        }
      }
      if (e.enemy && e.x < G.cam - W * 1.5) e.gone = true;
    }
    if (nearestNpc && G.state === 'play' && !P.dead) { nearestNpc.met++; npcTalk(nearestNpc); }
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
    if (save.unlocked > 1) items.push({ label: 'CONTINUAR (MAPA)', act: () => { G.score = 0; G.coins = 0; G.lives = 5; G.power = 0; openMap(save.unlocked - 1); } });
    items.push({ label: 'SOM: ' + (save.muted ? 'DESLIGADO' : 'LIGADO'), act: () => { toggleMute(); AUDIO.sfx('select'); } });
    return items;
  }
  const pauseItems = [
    { label: 'CONTINUAR', act: () => { toState('play'); AUDIO.music(P.star > 0 ? 'star' : G.boss ? (G.boss.state === 'intro' ? '' : G.boss.b2 ? 'boss2' : 'boss') : levelSong()); } },
    { label: 'MAPA', act: () => openMap(G.levelIdx) },
    { label: 'SAIR PARA O MENU', act: () => { toState('title'); AUDIO.music('title'); } },
  ];
  const overItems = [
    { label: 'TENTAR DE NOVO', act: () => { G.lives = 5; G.score = 0; G.coins = 0; G.power = 0; G.check = null; loadLevel(G.levelIdx, false); toState('intro'); AUDIO.sfx('start'); } },
    { label: 'MAPA', act: () => { G.lives = 5; G.score = 0; G.coins = 0; G.power = 0; openMap(G.levelIdx); } },
    { label: 'MENU', act: () => { toState('title'); AUDIO.music('title'); } },
  ];

  // ------------------------------------------------------------ UPDATE
  function update() {
    pollInput();
    syncLive();
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
          if (!G.L.boss) AUDIO.music(levelSong());
        }
        break;
      case 'play':
        if (G.dialog?.npc && !(G.dialog.npc.who === 'ps2' && I.runP)) {
          if (!dialogAdvance()) break;
          AUDIO.sfx('select');
          const { npc, lines, page } = G.dialog;
          if ((page + 1) * 3 < lines.length) {
            G.dialog.page = ++npc.dialogPage;
            break;
          }
          if (npc.who === 'couple' && npc.met < 230) npc.met = npc.met < 100 ? 100 : 230;
          else if (npc.who === 'babs' && !npc.say && !npc.done) npc.met = 110;
          else npc.dialogDismissed = true;
          G.dialog = null;
          break;
        }
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
        if (G.tallyDone && G.stateT - G.tallyT > 80) finishLevel();
        updateCamera();
        break;
      }
      case 'victory':
        G.t++;
        updateParts();
        if (G.stateT > 260) finishLevel();
        break;
      case 'gameover':
        if (G.stateT > 60) menu(overItems);
        break;
      case 'map':
        G.t++;
        updateMap();
        break;
      case 'scene': {
        if (G.scene && G.scene.kind === 'martbuz') { G.t++; martbuzScene(G.scene); break; }
        G.t++;
        const e = G.scene; e.t++;
        updateParts();
        P.vx = 0; P.vy = Math.min(P.vy + 0.42, 6); { const pb = P.y + P.h; P.y += P.vy; collideY(P, pb); }
        if (e.t > 50 && e.t <= 85) { e.bx = Math.min(e.bx + 0.35, e.x + 12); e.mx = Math.max(e.mx - 0.35, e.x + 26); }
        if (e.t > 85 && e.t <= 92) { e.bx = Math.min(e.bx + 0.4, e.x + 14); e.mx = Math.max(e.mx - 0.6, e.x + 22); } // o beijo: rostos encostados
        if (e.t === 92) pop('SMACK!', e.x + 2, e.y - 20, '#ff5ab4');
        if (e.t === 88) { AUDIO.sfx('kiss'); for (let i = 0; i < 6; i++) G.parts.push({ type: 'heart', x: (e.bx + e.mx) / 2 + 8 + (Math.random() - 0.5) * 16, y: e.y + 2, vx: (Math.random() - 0.5) * 0.6, vy: -0.5 - Math.random() * 0.5, life: 70 }); }
        if (e.t > 88 && e.t < 150 && e.t % 10 === 0) G.parts.push({ type: 'heart', x: (e.bx + e.mx) / 2 + 8, y: e.y, vx: (Math.random() - 0.5) * 0.4, vy: -0.6, life: 60 });
        if (e.t === 160) AUDIO.sfx('cry');
        if (e.t > 160 && e.t % 5 === 0) G.parts.push({ type: 'tear', x: P.x + P.w / 2 + (e.t % 10 ? 4 : -2), y: P.y + P.h - 9, vx: (e.t % 10 ? 0.6 : -0.6), vy: -0.6, life: 26 });
        const advance = G.dialog && (dialogAdvance() || I.runP);
        G.dialog = e.t > 165 ? { who: 'matheus', name: 'MATHEUS', txt: 'Eu sou carente... :(', advance: true } : null;
        if (e.t > 340 || advance) { e.phase = 'done'; e.bx = e.x + 14; e.mx = e.x + 22; G.scene = null; G.dialog = null; toState('play'); }
        break;
      }
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
    if (G.state === 'scene' && G.scene && G.scene.t > 155) {
      const fy = p.y + p.h - s.height + (p.power > 0 ? 9 : 7), drip = (G.t >> 2) % 3;
      rect('#5ec8ff', p.x + 6, fy + drip, 1, 2); rect('#5ec8ff', p.x + 10, fy + drip, 1, 2);
    }
  }

  // enfeites pequenos em cima do chão (não atrapalham o jogo)
  function drawDeco(theme, tx, ty) {
    const h = ((tx * 73856093) ^ (ty * 19349663)) >>> 0, k = h % 9;
    if (k > 4) return;
    const x = tx * T + 3 + (h % 9), y = ty * T;
    const px = (col, dx, dy, w = 1, hh = 1) => { ctx.fillStyle = col; ctx.fillRect(x + dx, y + dy, w, hh); };
    const sway = Math.round(Math.sin(G.t * 0.05 + tx) * 1);
    switch (theme) {
      case 'tropical': case 'grass': case 'sky':
        if (k === 0 || k === 4) { px('#1f7a2a', 0, -4, 1, 4); px('#1f7a2a', 2 + sway, -6, 1, 6); px('#1f7a2a', 4, -4, 1, 4); px('#8ef06a', 2 + sway, -6, 1, 1); }
        else if (k === 1) { px('#2a9a3a', 1, -4, 1, 4); px(['#ffffff', '#ffd23f', '#ff8fd8'][h % 3], 0, -6, 3, 2); px('#ffd23f', 1, -6, 1, 1); }
        else if (k === 2) { px('#8a8fa8', 0, -2, 4, 2); px('#c8ccd8', 1, -2, 2, 1); }
        break;
      case 'cave':
        if (k <= 1) { px('#5fd6ff', 1, -5, 1, 5); px('#5fd6ff', 0, -3, 3, 3); px('#ffffff', 1, -4, 1, 1); }
        else if (k === 2) { px('#26335f', 0, -2, 4, 2); }
        break;
      case 'beach':
        if (k === 0) { px('#ffc0d8', 0, -3, 4, 3); px('#ff8fb0', 1, -3, 1, 3); px('#ff8fb0', 3, -2, 1, 2); }
        else if (k === 1) { px('#ff9f1c', 1, -4, 1, 4); px('#ff9f1c', 0, -2, 3, 1); }
        else if (k === 2) { px('#fff0c0', 0, -1, 3, 1); }
        break;
      case 'sea':
        if (k <= 1) { for (let i = 0; i < 6; i++) px('#2fbf6a', Math.round(Math.sin(G.t * 0.06 + i * 0.7 + tx) * 1.5), -1 - i, 2, 1); }
        else if (k === 2) { px('#ff7aa8', 0, -3, 1, 3); px('#ff7aa8', 2, -4, 1, 4); px('#ff7aa8', 0, -3, 3, 1); }
        break;
      case 'castle':
        if (k === 0) { px('#5c5c74', 0, -2, 3, 2); px('#9a9ab8', 0, -2, 1, 1); }
        else if (k === 1) { px('#ff7a2a', 1 + sway, -3, 1, 2); px('#ffcf3a', 1, -2, 1, 1); px('#5a2418', 0, -1, 3, 1); }
        break;
      case 'roofs':
        if (k === 0) { px('#712f32', 0, -5, 4, 5); px('#ed9659', 1, -5, 2, 1); }
        else if (k === 1) { px('#785046', 0, -2, 5, 2); px('#ffcf84', 1, -2, 3, 1); }
        break;
      case 'snowCity':
      case 'snow':
        if (k === 0) { px('#ffffff', 0, -2, 5, 2); px('#e0f0ff', 1, -3, 3, 1); }
        else if (k === 1) { px('#4a3020', 2, -2, 1, 2); px('#1f4a3a', 0, -6, 5, 4); px('#1f4a3a', 1, -8, 3, 2); px('#ffffff', 1, -8, 3, 1); }
        else if (k === 2) { px('#bfe6ff', 0, -3, 1, 3); px('#bfe6ff', 2, -4, 1, 4); }
        break;
      case 'city':
        if (k <= 1) { px('#3a3458', 0, -3, 4, 3); px(['#2fe0ff', '#ff5ab4'][h % 2], 1, -2, 2, 1); }
        break;
      case 'desert':
        if (k === 0) { px('#2f7a3e', 1, -6, 2, 6); px('#2f7a3e', 0, -4, 1, 2); px('#2f7a3e', 3, -5, 1, 2); }
        else if (k === 1) { px('#c8a06a', 0, -2, 4, 2); px('#e8c890', 1, -2, 2, 1); }
        else if (k === 2) { px('#f0e0c0', 0, -1, 3, 1); px('#f0e0c0', 1, -2, 1, 1); }
        break;
      case 'fair':
        if (k <= 1) { px(['#2fe0ff', '#ff5ab4', '#ffd23f'][(h + (G.t >> 4)) % 3], 1, -1, 2, 1); }
        break;
      case 'edit':
        if (k === 0) { px('#ffd23f', 1, -3, 1, 1); px('#ffd23f', 0, -2, 3, 1); px('#ffd23f', 1, -1, 1, 1); }
        break;
      default: break;
    }
  }
  function drawTiles() {
    let ts = ART.tiles(G.L.theme);
    const qf = [0, 0, 0, 0, 1, 2, 1, 0][(G.t >> 3) % 8];
    const lf = (G.t >> 3) % 4;
    const x0 = Math.max(0, Math.floor(G.cam / T) - 1), x1 = Math.min(G.mw - 1, x0 + W / T + 2);
    for (let ty = 0; ty < 14; ty++) for (let tx = x0; tx <= x1; tx++) {
      const c = G.map[ty][tx];
      if (c === '.') continue;
      if (G.L.zones) ts = ART.tiles(themeAt(tx * T));
      let im = null, oy = 0;
      for (const b of G.bumps) if (b.tx === tx && b.ty === ty) oy = -Math.round(Math.sin((b.t / 10) * Math.PI) * 5);
      switch (c) {
        case '#': im = tileAt(tx, ty - 1) === '#' ? ts.ground : ts.groundTop; if (G.glitch && G.glitch.kind === 'vanish' && ((tx * 7 + ty * 3 + (G.t >> 3)) % 4) === 0) im = null; break;
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
        case 'o': im = ITEM.coin[[0, 1, 2, 3, 2, 1][(G.t >> 3) % 6]]; if ((G.t + tx * 13) % 90 < 8) { ctx.drawImage(im, tx * T, ty * T); im = null; ctx.fillStyle = '#ffffff'; ctx.fillRect(tx * T + 10, ty * T + 3, 1, 3); ctx.fillRect(tx * T + 9, ty * T + 4, 3, 1); } break;
        case '>': im = ts.conv[(G.t >> 2) % 4]; break;
        case '<': im = ts.conv[3 - ((G.t >> 2) % 4)]; break;
        case 'w': im = ts.water[(G.t >> 4) % 2]; break;
        case 'W': im = ts.hard; if ((G.t + tx * 7) % 180 < 6) { ctx.drawImage(im, tx * T, ty * T); im = null; ctx.fillStyle = '#ffffff'; ctx.fillRect(tx * T + 4, ty * T + 4, 1, 1); } break;
        default: break;
      }
      if (im) ctx.drawImage(im, tx * T, ty * T + oy);
      if (c === '#' || c === 'X' || c === '[' || c === ']') {
        const th = ART.THEMES[G.L.zones ? themeAt(tx * T) : G.L.theme], edge = th.mo || '#1a1020';
        if (!SOLID.has(tileAt(tx - 1, ty)) && tx > 0) { ctx.fillStyle = edge; ctx.fillRect(tx * T, ty * T, 1, T); }
        if (!SOLID.has(tileAt(tx + 1, ty)) && tx < G.mw - 1) { ctx.fillStyle = edge; ctx.fillRect(tx * T + T - 1, ty * T, 1, T); }
        if (c === '#' && tileAt(tx, ty - 1) === '.') drawDeco(G.L.zones ? themeAt(tx * T) : G.L.theme, tx, ty);
      }
    }
  }

  function drawEnemy(e) {
    const flipY = e.dying === 'flip';
    const dx = e.x - 1, by = e.y + e.h;
    const face = (pair) => (e.dir > 0 ? pair.l : pair.r);
    if (e.kind === 'g') {
      if (e.dying === 'flat') {
        if (e.guard) {
          rect('#41292c', dx + 1, by - 3, 14, 3);
          rect('#ba9360', dx + 3, by - 3, 9, 1);
        } else img(ENEMY.bugFlat.r, dx, by - 16);
        return;
      }
      const frames = e.guard ? ENEMY.guard : ENEMY.bug;
      img(face(frames[(e.t >> 3) & 1]), dx, by - 16, flipY);
    } else if (e.kind === 'k') {
      if (e.state === 'walk' && !flipY) img(face(ENEMY.cart[(e.t >> 3) & 1]), dx, by - 16);
      else { const shake = e.state === 'shell' && e.shellT > 290 ? ((e.t >> 1) % 2 ? 1 : -1) : 0; img(ENEMY.shell.r, dx + shake, by - 16, flipY); }
    } else if (e.kind === 'm') {
      const up = (e.t >> 2) & 1, x = R(dx), y = R(e.y);
      rect('#1a1020', x + 4, y + 2, 7, 6); rect('#3a2a5a', x + 5, y + 3, 5, 4);
      rect('#1a1020', x + 5, y + 1, 1, 2); rect('#1a1020', x + 9, y + 1, 1, 2);
      if (!flipY) { rect('#ff3b3b', x + 6, y + 4, 1, 1); rect('#ff3b3b', x + 8, y + 4, 1, 1); }
      rect('#1a1020', x - 1, y + 2 - up * 2, 6, 3); rect('#4a3a6a', x, y + 3 - up * 2, 4, 1);
      rect('#1a1020', x + 10, y + 2 - up * 2, 6, 3); rect('#4a3a6a', x + 11, y + 3 - up * 2, 4, 1);
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
      if (e.turbo && !flipY && e.stun === 0) { rect('rgba(255,90,40,0.35)', dx - e.dir * 6, by - 12, 6, 8); rect('rgba(255,90,40,0.2)', dx - e.dir * 12, by - 10, 6, 4); }
      img(fr, dx + shake, by - 16, flipY);
      if (!flipY) {
        const ex = R(dx + 5 + e.dir * 2 + shake), ey = R(by - 11);
        rect('#1a1020', ex, ey, 6, 6); rect(e.stun > 0 ? '#6b7190' : '#ff3b3b', ex + 1, ey + 1, 4, 4);
        if (e.stun > 0) rect('#1a1020', ex + 1, ey + 3, 4, 1); else rect('#ffffff', ex + 1, ey + 1, 1, 1);
        if (e.stun > 0) for (let i = 0; i < 2; i++) { const a = e.t * 0.15 + i * 3.1; rect('#ffd23f', dx + 7 + Math.cos(a) * 7, by - 19 + Math.sin(a) * 2, 2, 2); }
      }
    } else if (e.kind === 'rival') {
      if (e.inv > 0 && (e.t >> 1) % 2 && !flipY) return;
      img(face(ART.NPC[e.who]), dx, by - 16, flipY);
      if (!flipY) { text(e.who === 'rafael' ? 'RAFAEL' : 'SCOTT', R(dx + 8), R(by - 25), { size: 6, align: 'center', color: '#ff3b3b' }); for (let i = 0; i < e.hp; i++) rect('#ff3b3b', dx + 3 + i * 4, by - 18, 3, 2); }
    } else if (e.kind === 'c') {
      img(face(ENEMY.crab[e.up && !flipY ? 1 : 0]), dx, by - 16, flipY);
    } else if (e.kind === 'p') {
      const fl = (e.t >> 3) & 1;
      rect('#1a1020', dx + 13, e.y + 1 + fl, 5, 6); rect('#ff5ab4', dx + 14, e.y + 2 + fl, 3, 4);
      img(ENEMY.fish.r, dx, e.y - 2, flipY);
    } else if (e.kind === 'w') {
      const cx = dx + 8, cy = by - 8;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + (e.load ? 0 : e.roll * 0.12);
        const lit = e.load ? ((i - (e.t >> 3)) % 8 + 8) % 8 : i;
        rect('#1a1020', cx + Math.cos(a) * 5 - 2, cy + Math.sin(a) * 5 - 2, 4, 4);
        rect(lit === 0 ? '#ffffff' : lit < 3 ? '#c8ccd8' : '#6b7190', cx + Math.cos(a) * 5 - 1, cy + Math.sin(a) * 5 - 1, 2, 2);
      }
      if (!flipY) { rect(e.load ? '#ffd23f' : '#ff3b3b', cx - 3, cy - 1, 2, 2); rect(e.load ? '#ffd23f' : '#ff3b3b', cx + 1, cy - 1, 2, 2); }
      if (e.load && !flipY) text('...', cx - 8, by - 26, { color: '#ffffff', size: 8 });
    } else if (e.kind === 'n') {
      const sw = Math.round(Math.sin(e.t * 0.2) * 1);
      rect('#1a1020', dx + 2 + sw, e.y, 10, 12); rect('#ffd23f', dx + 3 + sw, e.y + 1, 8, 10); rect('#fff3b0', dx + 4 + sw, e.y + 2, 2, 6);
      rect('#1a1020', dx + 1 + sw, e.y + 10, 12, 3); rect('#d99a00', dx + 2 + sw, e.y + 11, 10, 1);
      rect('#1a1020', dx + 6 + sw, e.y + 13, 2, 2); rect('#1a1020', dx + 6 + sw, e.y - 2, 2, 2);
      rect('#e8402e', dx + 9 + sw, e.y - 1, 4, 4);
      if (!flipY) { rect('#1a1020', dx + 5 + sw, e.y + 5, 1, 2); rect('#1a1020', dx + 8 + sw, e.y + 5, 1, 2); }
    } else if (e.kind === 'h') {
      const x = R(dx), y = R(e.y);
      rect('#1a1020', x + 1, y + 2, 16, 10); rect('#1a1020', x + 4, y - 1, 10, 4);
      rect('#8a8fa8', x + 2, y + 3, 14, 8); rect('#8a8fa8', x + 5, y, 8, 4); rect('#b8bcd0', x + 5, y, 6, 2);
      if (!flipY) {
        rect('#1a1020', x + 5, y + 4, 3, 1); rect('#1a1020', x + 10, y + 4, 3, 1);
        rect('#ff3b3b', x + 6, y + 5, 2, 2); rect('#ff3b3b', x + 10, y + 5, 2, 2);
        rect('#1a1020', x + 7, y + 9, 4, 1); rect('#1a1020', x + 6, y + 10, 1, 1); rect('#1a1020', x + 11, y + 10, 1, 1);
      }
    } else if (e.kind === 's') {
      const glitch = (e.t % 50) < 5;
      img(glitch ? ENEMY.spikyGlitch.r : ((e.t >> 4) & 1 ? ENEMY.spiky.l : ENEMY.spiky.r), dx + (glitch ? 2 : 0), by - 16, flipY);
    }
  }

  function drawObject(e) {
    if (e.kind === 'dash') {
      const x = R(e.x), y = R(e.y);
      const lit = (G.t >> 2) % 3;
      rect('#1a1020', x - 1, y - 4, 18, 7);
      rect('#3b2942', x, y - 3, 16, 5);
      rect('#ff9d2b', x, y + 2, 16, 1);
      for (let i = 0; i < 3; i++) {
        const color = i === lit || e.cool > 0 ? '#fff3a0' : '#ffb02e';
        const ax = x + 1 + i * 5;
        rect(color, ax, y - 3, 2, 1);
        rect(color, ax + 1, y - 2, 2, 1);
        rect(color, ax + 2, y - 1, 2, 1);
        rect(color, ax + 1, y, 2, 1);
        rect(color, ax, y + 1, 2, 1);
      }
    } else if (e.kind === 'hay') img(ART.props.hay, e.x, e.y);
    else if (e.kind === 'venue') img(ART.props.venue, e.x, e.y);
    else if (e.tram) img(ART.props.tram, e.x, e.y);
    else if (e.kind === 'mp') {
      const ts = ART.tiles(themeAt(e.x));
      for (let i = 0; i < 3; i++) ctx.drawImage(ts.semi, R(e.x) + i * 16, R(e.y));
    }
    else if (e.kind === 'crowd') {
      const s2 = ART.NPC.crowd[e.look][((G.t >> 5) + e.look) % 2 ? 'r' : 'l'];
      img(s2, e.x, e.y + (((G.t >> 4) + e.look) % 2));
    } else if (e.kind === 'cut') {
      if (e.ghost || (e.blink && (G.t >> 2) % 2)) {
        if (e.ghost) { ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.strokeRect(R(e.x) + 0.5, R(e.y) + 0.5, 31, 8); }
        return;
      }
      const x = R(e.x), y = R(e.y);
      rect('#1a1020', x, y, 32, 10); rect('#9b4dff', x + 1, y + 1, 30, 8); rect('#c8a0ff', x + 1, y + 1, 30, 1);
      for (let i = 3; i < 30; i += 5) { rect('#1a1020', x + i, y + 2, 2, 1); rect('#1a1020', x + i, y + 7, 2, 1); }
    } else if (e.kind === 'martbuz') {
      if (e.phase === 'intro') {
        img(ART.NPC.rafael.r, e.rx, e.y); img(ART.NPC.scott.r, e.sx, e.y);
        text('RAFAEL', R(e.rx + 8), R(e.y - 9), { size: 6, align: 'center', color: '#ff3b3b' });
        text('SCOTT', R(e.sx + 8), R(e.y - 9), { size: 6, align: 'center', color: '#ff3b3b' });
      } else if (e.phase === 'jackson') {
        const bob = (G.t >> 2) % 2;
        img(e.jdir < 0 ? ART.NPC.jackson.r : ART.NPC.jackson.l, e.jx, e.y - bob);
        text('JACKSON', R(e.jx + 8), R(e.y - 9 - bob), { size: 6, align: 'center', color: '#ff9ab0' });
        if (e.jdir > 0) { rect('#5ec8ff', e.jx + 2, e.y + 1, 2, 3); rect('#5ec8ff', e.jx + 12, e.y - 1, 2, 3); }
      }
    } else if (e.kind === 'kiss') {
      img(ART.NPC.babs.r, e.bx, e.y);
      img(ART.NPC.miguel.l, e.mx, e.y);
      if (e.phase !== 'wait' && (e.phase === 'done' || e.t > 90)) {
        // coraçãozinho entre os dois durante o beijo
        const hx = R((e.bx + e.mx) / 2 + 8), hy = R(e.y - 6 - (e.phase === 'done' ? 0 : Math.min(6, (e.t - 90) * 0.3)));
        const big = e.phase === 'done' ? 0 : 1;
        rect('#1a1020', hx - 4 - big, hy - 1, 9 + big * 2, 7 + big);
        rect('#ff5ab4', hx - 3 - big, hy, 3 + big, 2); rect('#ff5ab4', hx + 1, hy, 3 + big, 2); rect('#ff5ab4', hx - 3 - big, hy + 2, 7 + big * 2, 2); rect('#ff5ab4', hx - 2, hy + 4, 5, 1); rect('#ff5ab4', hx, hy + 5, 1, 1); rect('#ffffff', hx - 2, hy, 1, 1);
      }
      if (e.phase !== 'wait') {
        text('BABS MARY', R(e.bx + 6), R(e.y - 9), { size: 6, align: 'right', color: '#ff8fd8' });
        text('MIGUEL', R(e.mx + 11), R(e.y - 9), { size: 6, color: '#7cf0ff' });
      }
    } else if (e.kind === 'npc' && e.who === 'couple') {
      img(ART.NPC.babs.r, e.x - 7, e.y);
      img(ART.NPC.miguel.l, e.x + 7, e.y);
      rect('#f2b27c', e.x + 6, e.y + 11, 4, 2);
      if ((G.t >> 5) % 3 === 0) { const hy = R(e.y - 6 - ((G.t >> 2) % 4)); rect('#ff5ab4', e.x + 6, hy, 2, 2); rect('#ff5ab4', e.x + 9, hy, 2, 2); rect('#ff5ab4', e.x + 6, hy + 1, 5, 2); rect('#ff5ab4', e.x + 7, hy + 3, 3, 1); }
      text('BABS MARY', R(e.x + 4), R(e.y - 16), { size: 6, align: 'right', color: '#ff8fd8' });
      text('MIGUEL', R(e.x + 13), R(e.y - 16), { size: 6, color: '#7cf0ff' });
    } else if (e.kind === 'npc') {
      const spr = ART.NPC[e.who][e.face > 0 ? 'l' : 'r'];
      img(spr, e.x, e.y + (e.who === 'axo' ? Math.round(Math.sin(G.t * 0.1)) : 0));
      if (e.who === 'inscrito') { rect('#1a1020', e.x - 4, e.y - 14, 24, 12); rect('#ffffff', e.x - 3, e.y - 13, 22, 10); text('500', e.x + 8, e.y - 12, { color: '#e8402e', align: 'center', shadow: false }); }
      if (e.who === 'discord' && !e.done && (G.t >> 4) % 2) text('?', e.x + 8, e.y - 12, { color: '#ffd23f', align: 'center' });
      if (e.who === 'ps2') text('LOJA', e.x + 8, e.y - 12, { color: '#2fe0ff', align: 'center' });
    }
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

  function drawBoss2(b) {
    if (b.inv > 0 && (G.t >> 1) % 2 && b.state !== 'dying') return;
    if (b.state === 'lag' && (G.t >> 1) % 2) return;
    const enr = b.hp <= b.maxHp / 2;
    const cx = R(b.x + b.w / 2), cy = R(b.y + b.h / 2);
    const spin = b.state === 'spin' ? b.t * 0.4 : G.t * 0.08;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const k = ((i - Math.floor(spin)) % 10 + 10) % 10;
      const col = k === 0 ? '#ffffff' : k < 3 ? (enr ? '#ff9aa8' : '#d0d4e4') : k < 6 ? (enr ? '#c0405a' : '#8a8fa8') : (enr ? '#6a1a2a' : '#4a4e66');
      rect('#1a1020', cx + Math.cos(a) * 17 - 4, cy + Math.sin(a) * 17 - 4, 8, 8);
      rect(col, cx + Math.cos(a) * 17 - 3, cy + Math.sin(a) * 17 - 3, 6, 6);
    }
    rect('#1a1020', cx - 9, cy - 9, 18, 18); rect(enr ? '#3a0a14' : '#22222c', cx - 8, cy - 8, 16, 16);
    const ec = enr ? '#ff3b3b' : '#ffffff';
    if (b.state === 'dazed' || b.state === 'dying') {
      [[cx - 6, cy - 4], [cx + 2, cy - 4]].forEach(([ex, ey]) => { rect('#ffd23f', ex, ey, 1, 1); rect('#ffd23f', ex + 2, ey, 1, 1); rect('#ffd23f', ex + 1, ey + 1, 1, 1); rect('#ffd23f', ex, ey + 2, 1, 1); rect('#ffd23f', ex + 2, ey + 2, 1, 1); });
      for (let i = 0; i < 3; i++) { const a = G.t * 0.12 + i * 2.1; rect('#ffd23f', cx + Math.cos(a) * 14, cy - 22 + Math.sin(a) * 3, 2, 2); }
    } else {
      rect(ec, cx - 6, cy - 3, 4, 3); rect(ec, cx + 2, cy - 3, 4, 3);
      rect('#1a1020', cx - 6, cy - 5, 4, 1); rect('#1a1020', cx + 2, cy - 5, 4, 1);
      rect(ec, cx - 4, cy + 3, 8, 1);
    }
  }
  function drawBoss(b) {
    if (b.b2) { drawBoss2(b); return; }
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
      else if (s.kind === 'drop') {
        rect('#1a1020', s.x, s.y, 8, 8); rect('#ffd23f', s.x + 1, s.y + 1, 6, 5); rect('#d99a00', s.x + 1, s.y + 6, 6, 1); rect('#1a1020', s.x + 3, s.y + 7, 2, 1);
      } else if (s.kind === 'msg') {
        rect('#1a1020', s.x, s.y, 12, 9); rect('#ffffff', s.x + 1, s.y + 1, 10, 7); rect('#ffffff', s.x + 2, s.y + 8, 2, 2);
        rect('#ff3b3b', s.x + 3, s.y + 4, 1, 1); rect('#ff3b3b', s.x + 6, s.y + 4, 1, 1); rect('#ff3b3b', s.x + 9, s.y + 4, 1, 1);
      }
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
      else if (q.type === 'heart') { const x = R(q.x), y = R(q.y); rect('#ff5ab4', x - 2, y, 2, 2); rect('#ff5ab4', x + 1, y, 2, 2); rect('#ff5ab4', x - 2, y + 1, 5, 2); rect('#ff5ab4', x - 1, y + 3, 3, 1); rect('#ff5ab4', x, y + 4, 1, 1); rect('#ffffff', x - 1, y, 1, 1); }
      else if (q.type === 'tear') { rect('#5ec8ff', q.x, q.y, 2, 2); }
      else if (q.type === 'bubble') { rect('rgba(220,240,255,0.85)', q.x - 1, q.y - 1, 3, 3); rect('rgba(255,255,255,0.9)', q.x - 1, q.y - 1, 1, 1); }
      else if (q.type === 'boom') {
        ctx.fillStyle = q.life > 12 ? '#ffffff' : q.life > 6 ? '#ffd23f' : '#ff5a1f';
        ctx.beginPath(); ctx.arc(R(q.x), R(q.y), q.r, 0, Math.PI * 2); ctx.fill();
      }
    }
    for (const s of G.pops) text(s.txt, R(s.x), R(s.y), { color: s.color, size: 8 });
  }

  function drawZoneBanner() {
    const b = G.zoneBanner; if (!b) return;
    const a = Math.min(1, b.t / 30, (150 - b.t) / 15);
    ctx.globalAlpha = Math.max(0, a);
    rect('rgba(11,16,51,0.8)', W / 2 - 100, 92, 200, 24); rect('#ffd23f', W / 2 - 100, 92, 200, 1); rect('#ffd23f', W / 2 - 100, 115, 200, 1);
    text(b.txt, W / 2, 100, { color: '#ffd23f', align: 'center', outline: '#1a1020' });
    ctx.globalAlpha = 1;
  }
  function drawHUD() {
    drawZoneBanner();
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
      text(G.L.bossName || 'BUGSOFT', W / 2, by - 1, { color: '#ff5ab4', align: 'center' });
      rect('#1a1020', bx - 1, by + 10, bw + 2, 7); rect('#3a1a4a', bx, by + 11, bw, 5);
      rect(b.hp <= b.maxHp / 2 ? '#ff3b3b' : '#ff5ab4', bx, by + 11, Math.round((bw * b.hp) / b.maxHp), 5);
      rect('#ffffff', bx, by + 11, Math.round((bw * b.hp) / b.maxHp), 1);
    }
  }

  function zoneAt(px) {
    const z = G.L.zones; if (!z) return null;
    let k = 0; for (let i = 0; i < z.length; i++) if (px >= z[i][0] * T) k = i;
    return k;
  }
  function themeAt(px) { const k = zoneAt(px); return k == null ? G.L.theme : G.L.zones[k][1]; }
  function levelSong() { return G.L.zones?.[zoneAt(P.x + P.w / 2)]?.[2] ?? G.L.song; }
  function drawWorld() {
    const cx = G.cam + W / 2, zk = zoneAt(cx);
    if (zk == null) ART.background(G.L.theme, W, H).draw(ctx, G.cam, G.t);
    else {
      ART.background(G.L.zones[zk][1], W, H).draw(ctx, G.cam, G.t);
      const nx = G.L.zones[zk + 1];
      if (nx) { const d = nx[0] * T - cx; if (d < 60) { ctx.globalAlpha = Math.max(0, Math.min(1, 1 - d / 60)); ART.background(nx[1], W, H).draw(ctx, G.cam, G.t); ctx.globalAlpha = 1; } }
    }
    ctx.save();
    const sx = G.shake ? Math.round((Math.random() - 0.5) * 4) : 0, sy = G.shake ? Math.round((Math.random() - 0.5) * 4) : 0;
    ctx.translate(-R(G.cam) + sx, sy);
    drawItems(true);
    drawTiles();
    for (const e of G.ents) if (!e.enemy && !e.dying && e.kind !== 'boss' && e.kind !== 'fb') drawObject(e);
    drawItems(false);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (const e of G.ents) if (e.enemy && e.active && !e.dying && e.onGround && !FLYERS.has(e.kind)) ctx.fillRect(R(e.x + 1), R(e.y + e.h - 1), e.w - 2, 2);
    if (!P.hidden && !P.dead && P.onGround) ctx.fillRect(R(P.x), R(P.y + P.h - 1), P.w, 2);
    for (const e of G.ents) if ((e.enemy || e.dying) && e.active) drawEnemy(e);
    if (G.boss && !G.boss.gone) drawBoss(G.boss);
    drawPlayer();
    for (const e of G.ents) if (e.kind === 'fb') drawObject(e);
    drawShots();
    drawParts();
    ctx.restore();
    if (!drawWorld.vig) {
      const c = ART.mk(W, H), x = c.getContext('2d');
      const g = x.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, W * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
      x.fillStyle = g; x.fillRect(0, 0, W, H); drawWorld.vig = c;
    }
    ctx.drawImage(drawWorld.vig, 0, 0);
    if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash / 20})`; ctx.fillRect(0, 0, W, H); }
    drawHUD();
    if (G.dialog && (G.state === 'play' || G.state === 'scene')) drawDialog(G.dialog);
    const b = G.boss;
    if (b && b.state === 'intro' && b.landed) {
      rect('rgba(10,3,24,0.7)', 0, 74, W, 52);
      text('CHEFÃO', W / 2, 82, { color: '#ffd23f', align: 'center' });
      text(G.L.bossName || 'BUGSOFT', W / 2, 96, { color: '#ff5ab4', size: 16, align: 'center', outline: '#1a1020' });
      text(G.L.bossSub || 'O BUG SUPREMO', W / 2, 115, { color: '#ffffff', align: 'center' });
    }
  }

  function wrap(txt, n) {
    const out = []; let line = '';
    for (const w of plain(txt).split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line.trim()); line = w; } else line += ' ' + w; }
    out.push(line.trim());
    return out;
  }
  function drawDialog(d) {
    const x = 10, y = 34, w = W - 20, h = 54;
    rect('#1a1020', x - 2, y - 2, w + 4, h + 4); rect('#0b1033', x, y, w, h); rect('#ffd23f', x, y, w, 1);
    rect('#ffd23f', x + 4, y + 4, 36, 36); rect('#5ec8ff', x + 5, y + 5, 34, 34);
    ctx.drawImage(d.who === 'matheus' ? HERO.n.s.idle.r : ART.NPC[d.who].r, x + 6, y + 6, 32, 32);
    text(d.name, x + 46, y + 5, { color: '#ffd23f' });
    const lines = d.lines || wrap(d.txt, 38), firstLine = (d.page || 0) * 3;
    lines.slice(firstLine, firstLine + 3).forEach((l, i) => text(l, x + 46, y + 16 + i * 9, { color: '#ffffff', size: 8 }));
    if (d.npc || d.advance) {
      const hint = isTouch ? 'TOQUE AQUI' : 'Z / ENTER';
      text(hint + (firstLine + 3 < lines.length || d.advance ? ' >' : ''), x + w - 6, y + h - 7, { color: '#ffd23f', size: 6, align: 'right' });
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
    text(boss ? 'CHEFÃO!' : 'FASE ' + LEVELS.labels[G.levelIdx], W / 2, 44, { color: boss ? '#ff3b3b' : '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
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

  const LV_INFO = {};
  function drawMap() {
    ART.background('title', W, H).draw(ctx, G.t * 0.4, G.t);
    rect('rgba(11,16,51,0.78)', 0, 0, W, H);
    text('MAPA DOS MUNDOS', W / 2, 10, { color: '#ffd23f', align: 'center', outline: '#1a1020' });
    text('MUNDO 1', 8, 28, { color: '#ff8fd8', size: 6 });
    text('MUNDO 2', 8, 80, { color: '#2fe0ff', size: 6 });
    text('MUNDO 3', 8, 130, { color: '#a6ff5a', size: 6 });
    ctx.fillStyle = '#4a58b0';
    for (let i = 0; i < MAP_PTS.length - 1; i++) {
      if (i === 4 || i === 9) continue;
      const [ax, ay] = MAP_PTS[i], [bx, by] = MAP_PTS[i + 1];
      for (let k = 0; k <= 10; k++) ctx.fillRect(R(ax + (bx - ax) * k / 10) - 1, R(ay + (by - ay) * k / 10) - 1, 2, 2);
    }
    MAP_PTS.forEach(([x, y], i) => {
      const open = i < save.unlocked, done = save.done[i], sel = i === G.mapSel, boss = i === 4 || i === 9;
      rect('#1a1020', x - 9, y - 9, 18, 18);
      rect(!open ? '#3a3f52' : done ? '#ffd23f' : boss ? '#e8402e' : '#2f7bff', x - 8, y - 8, 16, 16);
      text(boss ? '!' : LEVELS.labels[i], x + 1, y - 4, { color: open ? '#ffffff' : '#6b7190', align: 'center' });
      if (sel) { const bob = (G.t >> 3) % 2; ctx.drawImage(HERO.n.s.idle.r, x - 8, y - 26 - bob); }
    });
    const i = G.mapSel, L = (LV_INFO[i] = LV_INFO[i] || LEVELS.list[i]());
    rect('rgba(0,0,0,0.55)', 0, H - 38, W, 38);
    text((L.boss ? 'CHEFAO: ' : 'FASE ' + LEVELS.labels[i] + ': ') + L.name, W / 2, H - 34, { color: '#ffffff', align: 'center' });
    const tot = L.ents.filter((d) => d.type === 'npc' && d.who === 'discord').length;
    const info = (save.done[i] ? 'ZERADA' : 'NOVA') + (tot ? '   SEGREDOS ' + (save.sec[i] || 0) + '/' + tot : '');
    text(info, W / 2, H - 22, { color: save.done[i] ? '#ffd23f' : '#aab3e6', align: 'center' });
    if ((G.t >> 4) % 2) text(isTouch ? 'A: JOGAR' : 'Z: JOGAR   ENTER: MENU', W / 2, H - 10, { color: '#aab3e6', align: 'center', size: 8 });
  }

  function drawEnding() {
    ART.background('title', W, H).draw(ctx, G.t * 0.6, G.t);
    rect('rgba(11,16,51,0.72)', 16, 10, W - 32, H - 20);
    text('PARABÉNS!', W / 2, 20, { color: '#ffd23f', size: 16, align: 'center', outline: '#1a1020' });
    if (avatar) { rect('#ffd23f', W / 2 - 26, 42, 52, 52); ctx.drawImage(avatar, W / 2 - 24, 44); }
    const jump = Math.abs(Math.sin(G.t * 0.08)) * 10;
    ctx.drawImage(HERO.n.b.jump.r, W / 2 - 70, 70 - R(jump));
    ctx.drawImage(HERO.n.b.jump.l, W / 2 + 54, 70 - R(jump));
    text('BUGSOFT E BUFFERAO DERROTADOS!', W / 2, 102, { align: 'center' });
    text('O UNIVERSO 100% GAMER ESTA SALVO!', W / 2, 114, { align: 'center' });
    text('PONTOS ' + pad0(G.score, 6), W / 2, 128, { color: '#ffd23f', align: 'center' });
    text('LUCAS: "VALEU POR JOGAR MEU JOGO!"', W / 2, 144, { color: '#7cf0ff', align: 'center' });
    text('FEITO POR: LUCAS', W / 2, 156, { color: '#ffffff', align: 'center' });
    text('INSCREVA-SE: @MT-TOP-GAMER.2006', W / 2, 170, { color: '#ff8fd8', align: 'center' });
    ctx.drawImage(ART.NPC.inscrito.r, 22, 150); ctx.drawImage(ART.NPC.axo.r, 22, 170); ctx.drawImage(ART.NPC.babs.l, W - 38, 150); ctx.drawImage(ART.NPC.miguel.l, W - 38, 170);
    drawParts();
  }

  function render() {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    switch (G.state) {
      case 'title': drawTitle(); break;
      case 'intro': drawIntro(); break;
      case 'ending': drawEnding(); break;
      case 'map': drawMap(); break;
      case 'gameover':
        rect('#0b1033', 0, 0, W, H);
        text('GAME OVER', W / 2, 60, { color: '#ff3b3b', size: 16, align: 'center', outline: '#1a1020' });
        text('PONTOS ' + pad0(G.score, 6), W / 2, 92, { align: 'center' });
        text('NUNCA DESISTA, GAMER!', W / 2, 108, { color: '#ff8fd8', align: 'center' });
        if (G.stateT > 60) drawMenu(overItems, 140, 18);
        break;
      default:
        drawWorld();
        if (G.L && G.L.live) drawGlitchFx();
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
          text('VOCÊ VENCEU O ' + (G.L.bossName || 'BUGSOFT') + '!', W / 2, 100, { align: 'center', outline: '#1a1020' });
        }
    }
  }

  function drawGlitchFx() {
    const g = G.glitch, strong = g && g.kind;
    // fatias da tela deslocadas
    if (Math.random() < (strong ? 0.6 : 0.22)) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      const n = strong ? 4 : 1 + ((Math.random() * 2) | 0);
      for (let i = 0; i < n; i++) {
        const y = Math.floor(Math.random() * cv.height), h = Math.floor((2 + Math.random() * 16) * S), dx = Math.floor((Math.random() - 0.5) * 22 * S);
        ctx.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h);
      }
      ctx.restore();
    }
    // faixas coloridas e chuvisco
    if (Math.random() < (strong ? 0.5 : 0.15)) { rect(Math.random() < 0.5 ? 'rgba(255,40,200,0.22)' : 'rgba(40,240,255,0.22)', 0, Math.random() * H, W, 2 + Math.random() * 10); }
    for (let i = 0; i < (strong ? 60 : 18); i++) rect(['#ff3bd6', '#2fe0ff', '#ffffff', '#1a1020'][i % 4], Math.random() * W, Math.random() * H, 2, 1);
    // aviso do bug
    if (strong) {
      const blink = (G.t >> 2) % 2;
      rect('rgba(10,0,24,0.75)', W / 2 - 110, 40, 220, 26);
      text('BUG!', W / 2 + (blink ? 1 : -1), 44, { color: blink ? '#ff3bd6' : '#2fe0ff', align: 'center' });
      text(GLITCHES[g.kind], W / 2, 55, { color: '#ffffff', align: 'center', size: 6 });
    }
  }

  // ---------- vídeo da live de fundo (YouTube), só enquanto o jogador está nessa fase
  const liveBox = document.getElementById('live');
  let liveFrame = null, liveCmd = '', liveMuted = false;
  function liveSend(func) {
    if (!liveFrame || liveCmd === func) return;
    liveCmd = func;
    try { liveFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*'); } catch (e) { /* ok */ }
  }
  function liveKick() { if (liveFrame && G.state === 'play') { liveCmd = ''; liveSend('playVideo'); } }
  function syncLive() {
    if (!liveBox) return;
    if (liveFrame && G.state === 'play' && G.stateT % 120 === 30) liveCmd = '';
    const want = G.L && G.L.live && ['play', 'pause', 'dying', 'clear', 'scene'].includes(G.state);
    if (want && !liveFrame) {
      const v = G.L.live;
      liveFrame = document.createElement('iframe');
      liveFrame.src = `https://www.youtube.com/embed/${v.id}?start=${v.start}&autoplay=1&controls=0&rel=0&playsinline=1&enablejsapi=1&modestbranding=1&iv_load_policy=3${save.muted ? '&mute=1' : ''}`; liveMuted = !!save.muted;
      liveFrame.allow = 'autoplay; encrypted-media';
      liveFrame.title = 'Live do Jackson';
      liveFrame.addEventListener('load', () => { liveCmd = ''; });
      liveBox.appendChild(liveFrame); liveBox.hidden = false; liveCmd = 'playVideo';
      document.body.classList.add('live-on');
    } else if (!want && liveFrame) {
      liveFrame.remove(); liveFrame = null; liveBox.hidden = true; liveCmd = '';
      document.body.classList.remove('live-on');
    }
    if (liveFrame) {
      liveSend(G.state === 'pause' || document.hidden ? 'pauseVideo' : 'playVideo');
      if (liveMuted !== !!save.muted) { liveMuted = !!save.muted; try { liveFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: liveMuted ? 'mute' : 'unMute', args: [] }), '*'); } catch (e) { /* ok */ } }
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
  // atalho de teste (só no localhost): jogo.html?fase=11 abre direto na fase
  { const f = new URLSearchParams(location.search).get('fase');
    if (f && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) { const i = LEVELS.labels.indexOf(f.toUpperCase()); if (i >= 0) newGame(i); } }
  const fontReady = document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve();
  Promise.race([fontReady, new Promise((r) => setTimeout(r, 1500))]).then(() => requestAnimationFrame(loop));

  // para testes
  window.__MTGAME = { G, get P() { return P; }, loadLevel, newGame, toState, openMap, step(n = 1) { for (let i = 0; i < n; i++) update(); render(); } };
})();
