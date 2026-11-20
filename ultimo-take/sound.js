// Short synthesized cues keep weapons distinguishable without audio downloads.
export function createSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  const ctx = new Audio(),
    mix = ctx.createDynamicsCompressor(),
    volume = ctx.createGain();
  volume.gain.value = 0.58;
  mix.connect(volume).connect(ctx.destination);
  const noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.46), ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  function tone(freq, end, length, shape, level, delay = 0) {
    const now = ctx.currentTime + delay,
      o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = shape;
    o.frequency.setValueAtTime(freq, now);
    o.frequency.exponentialRampToValueAtTime(end, now + length);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(level, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, now + length);
    o.connect(g).connect(mix);
    o.start(now);
    o.stop(now + length);
  }
  function hiss(freq, length, level, type = 'bandpass') {
    const now = ctx.currentTime,
      n = ctx.createBufferSource(),
      f = ctx.createBiquadFilter(),
      g = ctx.createGain();
    n.buffer = noise;
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = 0.85;
    g.gain.setValueAtTime(level, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + length);
    n.connect(f).connect(g).connect(mix);
    n.start(now);
    n.stop(now + length);
  }
  return {
    resume: () => ctx.resume(),
    tone: (freq, end, length = 0.12, shape = 'sine') => tone(freq, end, length, shape, 0.072),
    fire(id) {
      tone([375, 520, 220][id], [97, 168, 48][id], [0.14, 0.09, 0.27][id], 'triangle', 0.24);
      tone([145, 228, 106][id], 48, [0.16, 0.11, 0.28][id], 'sine', 0.13);
      hiss([1480, 2660, 920][id], [0.1, 0.055, 0.23][id], 0.11);
    },
    impact(destroyed) {
      hiss(destroyed ? 700 : 1860, destroyed ? 0.27 : 0.071, destroyed ? 0.19 : 0.12);
      tone(destroyed ? 175 : 462, destroyed ? 40 : 212, destroyed ? 0.28 : 0.077, 'triangle', 0.16);
    },
    hurt() {
      tone(125, 67, 0.21, 'triangle', 0.21);
      hiss(410, 0.19, 0.13, 'lowpass');
    },
    confirm(win) {
      const notes = win ? [392, 523, 659, 784] : [330, 440, 554];
      notes.forEach((note, index) => tone(note, note, 0.2, 'sine', 0.095, index * 0.073));
    },
  };
}
