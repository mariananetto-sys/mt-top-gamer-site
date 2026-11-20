const samples = {
  fire0: ['laserRetro_002', 0.46],
  fire1: ['laserSmall_002', 0.46],
  fire2: ['laserLarge_003', 0.52],
  enemy: ['laserSmall_004', 0.16],
  impact: ['impactMetal_002', 0.3],
  destroy: ['explosionCrunch_001', 0.46],
  hurt: ['forceField_003', 0.43],
  power: ['forceField_003', 0.33],
  use: ['computerNoise_001', 0.36],
  start: ['doorOpen_001', 0.3],
  activate: ['switch2', 0.35],
  select: ['click2', 0.27],
  win: ['jingles_HIT05', 0.48],
  loss: ['jingles_HIT12', 0.43],
  step: ['stone01', 0.19],
  ambience: ['spaceEngineLow_004', 0.13],
};
export function createSound() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  const ctx = new Audio(),
    out = ctx.createDynamicsCompressor(),
    master = ctx.createGain();
  out.connect(master).connect(ctx.destination);
  const settings = 'mt.ultimoTake.audio';
  try {
    master.gain.value = localStorage.getItem(settings) === '0' ? 0 : 0.7;
  } catch {
    master.gain.value = 0.7;
  }
  const buffers = new Map();
  let engine,
    mission = false;
  const preload = Promise.allSettled(
    [...new Set(Object.values(samples).map(([file]) => file))].map(async (file) => {
      const response = await fetch(new URL('./assets/audio/' + file + '.ogg', import.meta.url));
      if (!response.ok) throw new Error('Áudio indisponível: ' + file);
      buffers.set(file, await ctx.decodeAudioData(await response.arrayBuffer()));
    }),
  );
  function play(name, pan = 0, variation = 0.05) {
    const [file, level] = samples[name],
      buffer = buffers.get(file);
    if (!buffer || ctx.state !== 'running') return null;
    const source = ctx.createBufferSource(),
      gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = name === 'ambience';
    source.playbackRate.value = 1 + (Math.random() - 0.5) * variation;
    gain.gain.value = level;
    source.connect(gain);
    if (ctx.createStereoPanner) {
      const stereo = ctx.createStereoPanner();
      stereo.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(stereo).connect(out);
    } else gain.connect(out);
    source.start();
    return source;
  }
  function syncEngine() {
    if (mission && !engine) engine = play('ambience');
    if (!mission && engine) {
      engine.stop();
      engine = null;
    }
  }
  return {
    muted: () => master.gain.value === 0,
    toggle() {
      const muted = master.gain.value !== 0;
      master.gain.value = muted ? 0 : 0.7;
      try {
        localStorage.setItem(settings, muted ? '0' : '1');
      } catch {}
      return muted;
    },
    async resume() {
      await ctx.resume();
      await preload;
      syncEngine();
    },
    mission(active) {
      mission = active;
      syncEngine();
    },
    select: () => play('select'),
    step: () => play('step', 0, 0.23),
    enemy: (pan) => play('enemy', pan),
    fire: (id) => play('fire' + id, 0, 0.12),
    impact: (destroyed, pan) => play(destroyed ? 'destroy' : 'impact', pan, 0.18),
    hurt: () => play('hurt'),
    cue(name) {
      play(name);
    },
  };
}
