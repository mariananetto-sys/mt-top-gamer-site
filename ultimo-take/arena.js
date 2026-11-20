import { THREE as T, box, mesh, material } from './geometry.js';
import { prop, surface } from './assets.js';

export const limit = 13.8;
// Shared by scenery, actor collision, projectile collision and navigation.
const cover = [
  ['cargo_A', -9.8, -1.5, 2.8, 1.76, 2.6],
  ['cargo_B_stacked', -5.1, 4.9, 2.7, 2.25, 2.5],
  ['cargo_A', 6.1, 2.5, 2.35, 1.5, 2.2],
  ['basemodule_C', 9.2, 7.2, 3.4, 2.85, 3.2],
  ['cargo_B_stacked', -4.0, -8.2, 2.55, 2.62, 2.0],
  ['cargo_A', 4.4, -5.4, 2.65, 1.78, 2.15],
  ['containers_C', -10.7, -10.9, 2.2, 0.79, 1.75],
  ['structure_low', 10.2, -11.1, 2.8, 1.09, 1.72],
];
export function blocked(x, z, r = 0.35, y = 0) {
  return (
    Math.abs(x) > limit - r ||
    Math.abs(z) > limit - r ||
    cover.some(
      ([, cx, cz, w, h, d]) => Math.abs(x - cx) < w / 2 + r && Math.abs(z - cz) < d / 2 + r && y < h + 0.06,
    )
  );
}
export function move(p, dx, dz) {
  if (!blocked(p.x + dx, p.z)) p.x += dx;
  if (!blocked(p.x, p.z + dz)) p.z += dz;
}
export function clearLine(a, b, height = 1.24, radius = 0.08) {
  const n = Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / 0.33);
  for (let i = 1; i < n; i++) {
    const f = i / n;
    if (blocked(a.x + (b.x - a.x) * f, a.z + (b.z - a.z) * f, radius, height)) return false;
  }
  return true;
}

const cells = 27,
  gridSize = cells * cells,
  blockedCells = new Uint8Array(gridSize),
  queue = new Int16Array(gridSize);
const center = (i) => i - 13;
for (let y = 0; y < cells; y++)
  for (let x = 0; x < cells; x++) blockedCells[y * cells + x] = Number(blocked(center(x), center(y), 0.49));
const flowCache = new Map();
function field(goal) {
  if (flowCache.has(goal)) return flowCache.get(goal);
  if (flowCache.size >= 12) flowCache.delete(flowCache.keys().next().value);
  const next = new Int16Array(gridSize);
  next.fill(-1);
  let front = 0,
    end = 1;
  queue[0] = goal;
  next[goal] = goal;
  while (front < end) {
    const cell = queue[front++],
      x = cell % cells,
      z = Math.floor(cell / cells);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        j = nz * cells + nx;
      if (nx < 0 || nx >= cells || nz < 0 || nz >= cells || blockedCells[j] || next[j] !== -1) continue;
      next[j] = cell;
      queue[end++] = j;
    }
  }
  flowCache.set(goal, next);
  return next;
}
function openCell(p) {
  const x = Math.round(Math.max(-13, Math.min(13, p.x))) + 13,
    z = Math.round(Math.max(-13, Math.min(13, p.z))) + 13;
  if (!blockedCells[z * cells + x]) return z * cells + x;
  let best = -1,
    dd = Infinity;
  for (let dz = -2; dz <= 2; dz++)
    for (let dx = -2; dx <= 2; dx++) {
      const nx = x + dx,
        nz = z + dz,
        i = nz * cells + nx;
      if (nx < 0 || nx >= cells || nz < 0 || nz >= cells || blockedCells[i]) continue;
      const d = (center(nx) - p.x) ** 2 + (center(nz) - p.z) ** 2;
      if (d < dd) {
        best = i;
        dd = d;
      }
    }
  return best;
}
export function follow(entity, target, distance, stop) {
  const p = entity.position;
  if (Math.hypot(target.x - p.x, target.z - p.z) < stop) return;
  let x = target.x,
    z = target.z;
  if (!clearLine(p, target, 0, 0.44)) {
    const from = openCell(p),
      to = openCell(target);
    if (from >= 0 && to >= 0) {
      const next = field(to)[from];
      if (next >= 0 && next !== from) {
        x = center(next % cells);
        z = center(Math.floor(next / cells));
      }
    }
  }
  const angle = Math.atan2(x - p.x, z - p.z);
  for (const offset of [0, 0.62, -0.62, 1.18, -1.18]) {
    const a = angle + offset,
      dx = Math.sin(a),
      dz = Math.cos(a);
    if (!blocked(p.x + dx * 0.48, p.z + dz * 0.48)) {
      move(p, dx * distance, dz * distance);
      entity.rotation.y = a;
      return;
    }
  }
}
function panel(g, title, caption, x, y, z, width, rotation = 0, accent = '#e6a55d') {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#101a22';
  ctx.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 1024; i += 8) {
    ctx.fillStyle = i % 32 ? '#12202b' : '#162936';
    ctx.fillRect(i, 0, 1, 256);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(40, 34, 8, 190);
  ctx.font = 'bold 86px sans-serif';
  ctx.fillStyle = '#f2e7d2';
  ctx.fillText(title, 67, 125, 883);
  ctx.font = 'bold 28px monospace';
  ctx.fillStyle = accent;
  ctx.fillText(caption, 69, 190, 883);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  const board = mesh(
    g,
    new T.PlaneGeometry(width, width / 4),
    new T.MeshBasicMaterial({ map, side: T.DoubleSide }),
    x,
    y,
    z,
  );
  board.rotation.y = rotation;
}
function floor(g) {
  const c = document.createElement('canvas');
  c.width = c.height = 1536;
  const ctx = c.getContext('2d'),
    { concrete, concreteNormal } = surface();
  const size = 1536,
    tile = 256;
  for (let x = 0; x < size; x += tile)
    for (let y = 0; y < size; y += tile) ctx.drawImage(concrete, x, y, tile, tile);
  ctx.fillStyle = '#43596885';
  ctx.fillRect(0, 0, size, size);
  const zones = [
    [185, 112, 1166, 331, 'PALCO', '#c28e57'],
    [82, 540, 301, 833, 'DEPÓSITO', '#bb8b61'],
    [1153, 563, 303, 796, 'EDIÇÃO', '#68aeb3'],
    [446, 1172, 640, 214, 'RECEPÇÃO', '#c4ac81'],
  ];
  for (const [x, y, w, h, name, color] of zones) {
    ctx.fillStyle = color + '22';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.font = '700 52px sans-serif';
    ctx.fillStyle = color + 'bc';
    ctx.fillText(name, x + 22, y + h - 28, w - 44);
  }
  ctx.strokeStyle = '#b59d719b';
  ctx.lineWidth = 5;
  ctx.setLineDash([19, 23]);
  ctx.strokeRect(490, 520, 556, 599);
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(768, 815, 111, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = 'italic 900 106px sans-serif';
  ctx.fillStyle = '#d7b98b9c';
  ctx.fillText('MT', 768, 854);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  const normal = new T.Texture(concreteNormal);
  normal.wrapS = normal.wrapT = T.RepeatWrapping;
  normal.repeat.set(6, 6);
  normal.needsUpdate = true;
  const plane = mesh(
    g,
    new T.PlaneGeometry(30, 30),
    material('#eff4f1', 0.94, { map, normalMap: normal, normalScale: new T.Vector2(0.55, 0.55) }),
  );
  plane.rotation.x = -Math.PI / 2;
}
const wall = material('#293944'),
  frame = material('#17282f', 0.52, { metalness: 0.29 });
const orange = new T.MeshBasicMaterial({ color: '#f3b170' }),
  ice = new T.MeshBasicMaterial({ color: '#58c5cb' });
export function studio() {
  const g = new T.Group();
  floor(g);
  box(g, wall, 30, 3.6, 0.4, 0, 1.8, -14.35);
  box(g, wall, 30, 3.25, 0.4, 0, 1.625, 14.35);
  for (const s of [-1, 1]) {
    box(g, wall, 0.4, 4, 29, s * 14.35, 2, 0);
    box(g, frame, 0.44, 0.23, 29, s * 14.2, 0.21, 0);
    box(g, s === 1 ? ice : orange, 0.04, 0.065, 28, s * 14.1, 0.83, 0);
    for (let i = -12; i <= 12; i += 4) {
      box(g, frame, 0.41, 3.95, 0.3, s * 14.1, 1.96, i);
      if (i % 8 === 0) g.add(prop('lights', s * 13.52, 0, i, 0.75, 3.75, 0.74));
    }
    g.add(prop('basemodule_A', s * 10.05, 0, -15.4, 5.6, 4.9, 3.4, s * Math.PI * 0.5));
    g.add(prop('roofmodule_solarpanels', s * 10.15, 4.73, -15.4, 4, 1.02, 3.6, s * Math.PI * 0.5));
    g.add(prop('basemodule_C', s * 17.5, 0, -2, 3.9, 4.6, 8, Math.PI * 0.5));
  }
  for (const [name, x, z, w, h, d] of cover) g.add(prop(name, x, 0, z, w, h, d));
  for (const x of [-9, -3, 3, 9]) {
    g.add(prop('tunnel_straight_A', x, 4.36, -11.45, 6, 1.45, 2.3));
    box(g, frame, 1.66, 0.41, 0.88, x, 4.16, -11.1);
    box(g, x < 0 ? ice : orange, 1.49, 0.27, 0.05, x, 4.17, -10.64);
  }
  g.add(prop('basemodule_garage', 0, 0, -17, 11, 5.6, 5.7, Math.PI));
  g.add(prop('spacetruck', -12.7, 0, 14, 2.4, 2.15, 4.63, Math.PI * 0.5));
  g.add(prop('solarpanel', 4.3, 0.07, -16, 3.9, 4.6, 3.2, Math.PI * 0.36));
  g.add(prop('lander_A', 7.6, 0, -20.5, 3.8, 4.2, 4, Math.PI * 0.25));
  box(g, frame, 13.8, 3.54, 0.35, 0, 3.22, -13.72);
  panel(g, 'ÚLTIMO TAKE', 'MT  /  CENTRAL DE TRANSMISSÃO', 0, 3.25, -13.52, 13.28);
  panel(g, 'DEPÓSITO', '02  /  LOGÍSTICA', -14.1, 2.85, 2.4, 5.8, Math.PI / 2);
  panel(g, 'EDIÇÃO', '03  /  CONTROLE DE SINAL', 14.1, 2.87, 2.4, 5.8, -Math.PI / 2, '#7bdddb');
  panel(g, 'RECEPÇÃO', '01  /  ACESSO AO ESTÚDIO', 0, 2.42, 14.13, 6.6, Math.PI);
  for (let i = 0; i < 23; i++) {
    const x = -48 + i * 4.4,
      h = 6 + ((i * 37) % 83) / 5,
      z = -25.9 - (i % 4) * 4.8;
    box(g, material(i % 3 ? '#31425a' : '#485973'), 3.71, h, 3.7, x, h / 2, z);
    for (let y = 2.2; y < h - 0.4; y += 1.65)
      for (let j = -1; j <= 1; j++)
        if ((i + j + Math.floor(y)) % 4 === 0)
          box(g, i % 3 ? orange : ice, 0.37, 0.38, 0.05, x + j * 0.94, y, z + 1.86);
  }
  return g;
}
export function robot() {
  const model = prop('lander_A', 0, 0.83, 0, 1.21, 0.82, 1.15, Math.PI);
  const visor = material('#243844', 0.42);
  box(model, visor, 0.71, 0.27, 0.21, 0, 0.63, -0.32);
  // Positive Z is the actor's forward axis.
  const g = new T.Group();
  g.add(model);
  box(g, frame, 0.63, 0.18, 0.19, 0, 1.32, 0.43);
  for (const x of [-0.19, 0.19])
    box(g, new T.MeshBasicMaterial({ color: '#ff6051' }), 0.13, 0.076, 0.035, x, 1.33, 0.539);
  return g;
}
