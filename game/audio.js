'use strict';
// =====================================================================
//  SOM — efeitos e músicas chiptune originais, gerados com WebAudio.
// =====================================================================
window.AUDIO = (() => {
  let ctx = null, master, musicGain, sfxGain, pulse12, pulse25, noiseBuf;
  let muted = false;

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(name) {
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return null;
    return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  }
  const freq = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function root(chord) {
    const m = /^([A-G])([#b]?)/.exec(chord);
    return NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.34; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    const pulse = (duty) => {
      const n = 48, real = new Float32Array(n), imag = new Float32Array(n);
      for (let i = 1; i < n; i++) real[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      return ctx.createPeriodicWave(real, imag);
    };
    pulse12 = pulse(0.125); pulse25 = pulse(0.25);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); }

  function tone(f, t, d, o = {}) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    if (o.wave === 'p12') osc.setPeriodicWave(pulse12);
    else if (o.wave === 'p25') osc.setPeriodicWave(pulse25);
    else osc.type = o.wave || 'square';
    osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + d);
    const g = ctx.createGain();
    const v = o.vol == null ? 0.2 : o.vol;
    const rel = Math.min(o.rel == null ? 0.03 : o.rel, d * 0.5);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + 0.004);
    g.gain.setValueAtTime(v, t + d - rel);
    g.gain.linearRampToValueAtTime(0.0001, t + d);
    osc.connect(g); g.connect(o.dest || sfxGain);
    osc.start(t); osc.stop(t + d + 0.02);
  }
  function noise(t, d, o = {}) {
    if (!ctx) return;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.value = o.freq || 2000;
    if (o.sweep) f.frequency.exponentialRampToValueAtTime(o.sweep, t + d);
    const g = ctx.createGain(); const v = o.vol == null ? 0.2 : o.vol;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxGain);
    src.start(t, Math.random() * 0.5); src.stop(t + d + 0.02);
  }
  const seq = (notes, step, o) => { const t0 = ctx.currentTime; notes.forEach((n, i) => { if (n) tone(freq(midi(n)), t0 + i * step, step * (o.len || 1), o); }); };

  const SFX = {
    jump() { const t = ctx.currentTime; tone(330, t, 0.13, { wave: 'p25', slide: 760, vol: 0.13 }); },
    jumpBig() { const t = ctx.currentTime; tone(250, t, 0.15, { wave: 'p25', slide: 600, vol: 0.14 }); },
    coin() { const t = ctx.currentTime; tone(988, t, 0.06, { wave: 'p25', vol: 0.12 }); tone(1319, t + 0.06, 0.28, { wave: 'p25', vol: 0.12, rel: 0.2 }); },
    stomp() { const t = ctx.currentTime; tone(520, t, 0.1, { slide: 120, vol: 0.18 }); },
    bump() { const t = ctx.currentTime; tone(170, t, 0.08, { wave: 'triangle', slide: 90, vol: 0.35 }); },
    brick() { const t = ctx.currentTime; noise(t, 0.2, { freq: 1800, sweep: 300, vol: 0.35 }); tone(220, t, 0.12, { slide: 60, vol: 0.12 }); },
    appear() { seq(['C5', 'G5', 'C6', 'E6', 'G6'], 0.035, { wave: 'p12', vol: 0.08 }); },
    powerup() { seq(['C5', 'E5', 'G5', 'C6', 'D5', 'F#5', 'A5', 'D6', 'E5', 'G#5', 'B5', 'E6'], 0.035, { wave: 'p25', vol: 0.11 }); },
    powerdown() { seq(['A5', 'E5', 'A4', 'E5', 'A4', 'E4'], 0.06, { wave: 'p25', vol: 0.11 }); },
    oneup() { seq(['E6', 'G6', 'E7', 'C7', 'D7', 'G7'], 0.08, { wave: 'p25', vol: 0.1 }); },
    swim() { const t = ctx.currentTime; tone(420, t, 0.09, { wave: 'p12', slide: 620, vol: 0.07 }); },
    kick() { const t = ctx.currentTime; tone(700, t, 0.06, { slide: 300, vol: 0.15 }); },
    cd() { const t = ctx.currentTime; tone(1400, t, 0.07, { wave: 'p12', slide: 500, vol: 0.12 }); },
    spring() { const t = ctx.currentTime; tone(180, t, 0.25, { wave: 'p12', slide: 1100, vol: 0.13 }); },
    check() { seq(['G5', 'C6', 'E6', 'G6'], 0.07, { wave: 'p25', vol: 0.11 }); },
    tick() { const t = ctx.currentTime; tone(1760, t, 0.025, { wave: 'p12', vol: 0.06 }); },
    hurry() { seq(['E6', null, 'E6', null, 'E6'], 0.07, { wave: 'p25', vol: 0.1 }); },
    pause() { seq(['E6', 'C6', 'E6', 'C6'], 0.06, { wave: 'p25', vol: 0.09 }); },
    select() { const t = ctx.currentTime; tone(880, t, 0.05, { wave: 'p25', vol: 0.09 }); },
    start() { seq(['C6', 'G5', 'C6', 'E6', 'G6'], 0.05, { wave: 'p25', vol: 0.1 }); },
    thud() { const t = ctx.currentTime; tone(110, t, 0.3, { wave: 'triangle', slide: 40, vol: 0.5 }); noise(t, 0.25, { freq: 600, vol: 0.3 }); },
    dash() { const t = ctx.currentTime; noise(t, 0.4, { type: 'bandpass', freq: 600, sweep: 2400, vol: 0.25 }); },
    orb() { const t = ctx.currentTime; tone(900, t, 0.18, { wave: 'p12', slide: 200, vol: 0.1 }); },
    bossHit() { const t = ctx.currentTime; noise(t, 0.15, { freq: 3000, vol: 0.3 }); tone(300, t, 0.2, { slide: 70, vol: 0.18 }); },
    boom() { const t = ctx.currentTime; noise(t, 0.5, { freq: 1200, sweep: 80, vol: 0.45 }); },
    die() {
      const t = ctx.currentTime, s = 0.11;
      ['B5', 'F6', null, 'F6', 'F6', 'E6', 'D6', 'C6', null, 'E5', null, 'C5'].forEach((n, i) => { if (n) tone(freq(midi(n)), t + 0.25 + i * s, s, { wave: 'p25', vol: 0.11 }); });
      ['G3', null, null, 'G3', 'G3', 'A3', 'B3', 'C4', null, 'G3', null, 'C3'].forEach((n, i) => { if (n) tone(freq(midi(n)), t + 0.25 + i * s, s, { wave: 'triangle', vol: 0.25 }); });
    },
    clear() {
      const t = ctx.currentTime, s = 0.12;
      ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'E6', null, 'Ab5', 'C6', 'Eb6', 'Ab6', 'Eb6', null, 'Bb5', 'D6', 'F6', 'Bb6', 'Bb6', 'Bb6', 'C7'].forEach((n, i) => { if (n) tone(freq(midi(n)), t + i * s, i === 20 ? 0.8 : s, { wave: 'p25', vol: 0.11 }); });
      ['C3', null, 'G3', null, 'C4', null, 'G3', null, 'Ab2', null, 'Eb3', null, 'Ab3', null, 'Bb2', null, 'F3', null, 'Bb3', null, 'C4'].forEach((n, i) => { if (n) tone(freq(midi(n)), t + i * s, i === 20 ? 0.8 : s * 2, { wave: 'triangle', vol: 0.25 }); });
    },
    gameover() {
      const t = ctx.currentTime, s = 0.18;
      ['C5', null, 'G4', null, 'E4', 'A4', 'B4', 'A4', 'Ab4', 'Bb4', 'Ab4', 'G4'].forEach((n, i) => { if (n) tone(freq(midi(n)), t + i * s, s, { wave: 'p25', vol: 0.1 }); });
    },
  };
  function sfx(name) { if (!ctx || muted) return; try { SFX[name] && SFX[name](); } catch (e) { /* ignora */ } }

  // ---------------------------------------------------------------- MÚSICA
  // Cada música: compassos com 8 colcheias. "-" sustenta, "." pausa.
  const SONGS = {
    title: { bpm: 112, wave: 'p25', bass: [0, null, 7, null, 12, null, 7, null], drums: 'k.h.s.h.',
      chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
      lead: ['C5 - E5 - G5 - E5 G5', 'B4 - D5 - G5 - - .', 'A4 - C5 - E5 - A5 G5', 'F5 - - - A5 - - .', 'G5 - E5 - C5 - E5 G5', 'D5 - B4 - G4 - B4 D5', 'C5 - F5 - A5 - G5 F5', 'E5 - C5 - - - . .'] },
    grass: { bpm: 140, wave: 'p25', bass: [0, 12, 7, 12, 0, 12, 7, 12], drums: 'khshkhsh',
      chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'F G', 'C'],
      lead: ['E5 G5 C6 G5 E5 - D5 E5', 'C5 - A4 C5 E5 - D5 C5', 'F5 A5 C6 A5 F5 - E5 F5', 'G5 - - B5 D6 - B5 G5', 'E5 G5 C6 G5 E5 - G5 A5', 'C6 - B5 A5 E5 - C5 E5', 'F5 - A5 F5 G5 - B5 D6', 'C6 - G5 E5 C5 - . .'] },
    cave: { bpm: 118, wave: 'p12', bass: [0, null, 0, 7, null, 7, 12, null], drums: 'k...s..h',
      chords: ['Am', 'Am', 'F', 'E', 'Am', 'Am', 'Dm', 'E'],
      lead: ['A4 . C5 . E5 . A5 .', 'G5 - E5 - C5 - D5 E5', 'F5 . A5 . C6 - A5 F5', 'E5 - G#5 - B5 - G#5 E5', 'A5 . E5 . C5 . A4 .', 'B4 C5 E5 - A5 - G5 E5', 'F5 - D5 - A4 - D5 F5', 'E5 - - - G#4 - B4 E5'] },
    sky: { bpm: 150, wave: 'p25', bass: [0, 7, 12, 7, 0, 7, 12, 7], drums: 'k.h.s.hh',
      chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'],
      lead: ['A5 - C6 - F5 - A5 C6', 'G5 - E5 - C5 - E5 G5', 'F5 - D5 - A4 - D5 F5', 'D5 - F5 - Bb5 - A5 G5', 'A5 - C6 - F6 - E6 D6', 'C6 - G5 - E5 - G5 C6', 'Bb5 - A5 - G5 - F5 D5', 'E5 - G5 - C6 - . .'] },
    castle: { bpm: 132, wave: 'p12', bass: [0, 0, 12, 0, 0, 0, 12, 7], drums: 'k.k.s.kh',
      chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'A', 'A'],
      lead: ['D5 D5 F5 D5 A5 - G5 F5', 'E5 F5 D5 - C5 - D5 .', 'F5 - D5 - Bb4 - D5 F5', 'E5 - C#5 - A4 - C#5 E5', 'D6 - A5 - F5 - D5 F5', 'G5 - Bb5 - D6 - Bb5 G5', 'A5 G5 F5 E5 F5 E5 D5 C#5', 'E5 - - - A4 - . .'] },
    boss: { bpm: 168, wave: 'p25', bass: [0, 0, 12, 0, 0, 12, 0, 7], drums: 'khskkhsh',
      chords: ['Em', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'B'],
      lead: ['E5 . E5 G5 . E5 B5 A5', 'G5 F#5 E5 . D5 E5 . .', 'E5 . C6 B5 . G5 E5 G5', 'F#5 . D5 . A5 . F#5 D5', 'E5 E6 B5 G5 E5 E6 B5 G5', 'D6 B5 G5 E5 D5 E5 G5 B5', 'C6 - B5 - A5 - G5 -', 'F#5 - D#5 - B4 - D#5 F#5'] },
    beach: { bpm: 126, wave: 'p25', bass: [0, null, 7, 12, null, 7, 0, null], drums: 'k.hsk.hs',
      chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'],
      lead: ['E5 . G5 E5 . C5 D5 .', 'F5 . A5 F5 . C5 D5 .', 'G5 - B5 - D6 . B5 G5', 'E5 - C5 - . . G4 C5', 'A4 C5 E5 A5 - G5 E5 C5', 'F5 . A5 . C6 . A5 F5', 'G5 - F5 - E5 - D5 -', 'C5 - - - . . . .'] },
    fair: { bpm: 152, wave: 'p25', bass: [0, 12, 0, 12, 7, 19, 7, 19], drums: 'khshkhsh',
      chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'C', 'C'],
      lead: ['D5 F5 A5 D6 - A5 F5 A5', 'Bb5 - A5 - F5 - D5 F5', 'G5 - E5 - C5 - E5 G5', 'A5 - C#6 - E6 - C#6 A5', 'D6 C6 A5 F5 D5 F5 A5 C6', 'D6 - Bb5 - F5 - Bb5 D6', 'C6 - G5 - E5 - G5 -', 'C6 - - - E6 - . .'] },
    sea: { bpm: 92, wave: 'p12', bass: [0, null, null, 7, null, null, 12, null], drums: 'k.....h.',
      chords: ['Fmaj', 'Em', 'Dm', 'C', 'F', 'Em', 'Dm', 'G'],
      lead: ['A5 - - C6 - - E6 -', 'G5 - - B5 - - E6 -', 'F5 - - A5 - - D6 -', 'E5 - G5 - C6 - - -', 'A5 - C6 - F6 - E6 -', 'D6 - B5 - G5 - E5 -', 'F5 - A5 - D6 - C6 -', 'B5 - - - G5 - - -'] },
    edit: { bpm: 142, wave: 'p25', bass: [0, 0, 12, 0, 0, 0, 12, 10], drums: 'k.s.k.sh',
      chords: ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'F', 'E'],
      lead: ['A5 . A5 . C6 . A5 E5', 'G5 . A5 . . . E5 .', 'F5 . F5 . A5 . C6 A5', 'G5 . B5 . D6 . B5 G5', 'A5 C6 E6 C6 A5 C6 E6 C6', 'A5 . G5 . E5 . C5 .', 'F5 - A5 - C6 - F6 -', 'E6 - D6 - B5 - G#5 -'] },
    boss2: { bpm: 176, wave: 'p25', bass: [0, 12, 0, 12, 0, 12, 1, 13], drums: 'kskskhsk',
      chords: ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Cm', 'Ab', 'G'],
      lead: ['C5 . C5 Eb5 . C5 G5 F5', 'Eb5 D5 C5 . Bb4 C5 . .', 'C5 . Ab5 G5 . Eb5 C5 Eb5', 'D5 . B4 . G5 . D5 B4', 'C6 G5 Eb5 C5 C6 G5 Eb5 C5', 'Bb5 G5 Eb5 C5 Bb4 C5 Eb5 G5', 'Ab5 - G5 - F5 - Eb5 -', 'D5 - B4 - G4 - B4 D5'] },
    star: { bpm: 180, wave: 'p25', bass: [0, 12, 0, 12, 0, 12, 0, 12], drums: 'khkhkhkh',
      chords: ['C', 'Dm', 'Em', 'F G'],
      lead: ['C5 E5 G5 C6 G5 E5 C5 E5', 'D5 F5 A5 D6 A5 F5 D5 F5', 'E5 G5 B5 E6 B5 G5 E5 G5', 'F5 A5 C6 F6 G5 B5 D6 G6'] },
    ending: { bpm: 128, wave: 'p25', bass: [0, 12, 7, 12, 0, 12, 7, 12], drums: 'k.hsk.hs',
      chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'],
      lead: ['C5 E5 G5 C6 - G5 E5 G5', 'B4 D5 G5 B5 - G5 D5 B4', 'A4 C5 E5 A5 - E5 C5 E5', 'F5 - A5 - C6 - A5 .', 'G5 - E5 - C5 - E5 G5', 'D5 - G5 - B5 - D6 -', 'C6 - A5 - F5 - A5 C6', 'C6 - - - . . . .'] },
  };
  for (const s of Object.values(SONGS)) s.tokens = s.lead.join(' ').split(/\s+/);

  let song = null, songName = '', step = 0, nextTime = 0, timer = null, tempo = 1;

  function playStep(i, t, spb) {
    const toks = song.tokens, tok = toks[i];
    if (tok !== '.' && tok !== '-') {
      let n = 1; while (toks[(i + n) % toks.length] === '-' && n < 8) n++;
      const m = midi(tok);
      if (m != null) {
        tone(freq(m), t, n * spb * 0.92, { wave: song.wave, vol: 0.12, dest: musicGain, rel: 0.04 });
        tone(freq(m), t + spb * 0.75, Math.min(n * spb, spb * 1.2) * 0.8, { wave: 'p12', vol: 0.035, dest: musicGain });
      }
    }
    const bar = Math.floor(i / 8) % song.chords.length, pos = i % 8;
    const parts = song.chords[bar].split(' ');
    const chord = parts.length > 1 ? parts[pos < 4 ? 0 : 1] : parts[0];
    const off = song.bass[pos];
    if (off != null) tone(freq(36 + root(chord) + off), t, spb * 0.85, { wave: 'triangle', vol: 0.26, dest: musicGain });
    const dr = song.drums[pos];
    if (dr === 'k') tone(150, t, 0.11, { wave: 'sine', slide: 45, vol: 0.55, dest: musicGain });
    else if (dr === 's') noise(t, 0.1, { type: 'bandpass', freq: 1800, vol: 0.22, dest: musicGain });
    else if (dr === 'h') noise(t, 0.03, { type: 'highpass', freq: 7000, vol: 0.07, dest: musicGain });
  }
  function schedule() {
    if (!ctx || !song) return;
    const spb = 60 / (song.bpm * tempo) / 2;
    while (nextTime < ctx.currentTime + 0.15) {
      playStep(step, nextTime, spb);
      nextTime += spb;
      step = (step + 1) % song.tokens.length;
    }
  }
  function music(name) {
    if (!ctx) return;
    if (songName === name && timer) return;
    stopMusic();
    song = SONGS[name]; songName = name; step = 0; tempo = 1;
    if (!song) return;
    nextTime = ctx.currentTime + 0.08;
    timer = setInterval(schedule, 25);
    schedule();
  }
  function stopMusic() {
    if (timer) clearInterval(timer);
    timer = null; songName = '';
  }
  function setTempo(f) { tempo = f; }
  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02);
  }

  return { init, resume, suspend, sfx, music, stopMusic, setTempo, setMuted, get muted() { return muted; }, get current() { return songName; } };
})();
