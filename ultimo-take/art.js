import { THREE as T, box, sphere, mesh, rod, v, material } from './geometry.js';
import { head } from './face.js';
import { cast } from './campaign.js';
const palette = new Map();
function mat(color) {
  if (!palette.has(color)) palette.set(color, material(color, 0.8, { flatShading: true }));
  return palette.get(color);
}
const block = (g, c, w, h, d, x, y, z) => box(g, mat(c), w, h, d, x, y, z);
const oval = (g, c, w, h, d, x, y, z) => sphere(g, mat(c), w, h, d, x, y, z, 10);
const beam = (g, c, a, b, r) => rod(g, mat(c), v(...a), v(...b), r, r, 8);
function cylinder(g, c, r, base, h, x, y, z, n = 8) {
  return mesh(g, new T.CylinderGeometry(r, base, h, n), mat(c), x, y, z);
}
const ink = '#21313a',
  steel = '#526771',
  cream = '#e9d5ac',
  amber = '#ff943e',
  teal = '#66d8d3';
function sign(g, text, w, h, x, y, z, bg = '#18373c', fg = '#ffc279', rotation = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 768, 128);
  ctx.fillStyle = fg;
  ctx.font = 'italic 900 78px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 384, 67, 720);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  const panel = mesh(
    g,
    new T.PlaneGeometry(w, h),
    new T.MeshBasicMaterial({ map, side: T.DoubleSide }),
    x,
    y,
    z,
  );
  panel.rotation.y = rotation;
}
// These props move as rigid pieces. Batch surfaces of the same material once
// so phones draw the studio by material instead of issuing a draw per bolt.
function batch(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map();
  root.traverse((part) => {
    if (!part.isMesh) return;
    const geo = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
    geo.applyMatrix4(part.matrixWorld);
    if (!buckets.has(part.material)) buckets.set(part.material, { position: [], normal: [], uv: [] });
    const data = buckets.get(part.material);
    for (const key of Object.keys(data)) {
      const a = geo.getAttribute(key);
      if (a) for (const value of a.array) data[key].push(value);
      else if (key === 'uv') for (let i = 0; i < geo.getAttribute('position').count; i++) data.uv.push(0, 0);
    }
    geo.dispose();
  });
  const result = new T.Group();
  for (const [surface, data] of buckets) {
    const geo = new T.BufferGeometry();
    for (const key of Object.keys(data))
      geo.setAttribute(key, new T.Float32BufferAttribute(data[key], key === 'uv' ? 2 : 3));
    result.add(new T.Mesh(geo, surface));
  }
  return result;
}
export function weapon(id = 0) {
  const g = new T.Group(),
    accent = [teal, amber, '#b59aff'][id];
  block(g, ink, 0.15, 0.17, 0.43, 0, 0, 0);
  block(g, '#85969b', 0.19, 0.09, 0.28, 0, 0.08, -0.01);
  block(g, accent, 0.11, 0.07, 0.14, 0, 0.02, 0.24);
  block(g, ink, 0.1, 0.2, 0.1, 0, -0.12, -0.05);
  for (const side of [-1, 1]) {
    block(g, accent, 0.012, 0.028, 0.23, side * 0.083, 0.018, 0.025);
    for (let i = 0; i < 3; i++) block(g, '#62747c', 0.026, 0.1, 0.024, side * 0.097, 0.025, 0.04 + i * 0.052);
  }
  block(g, ink, 0.13, 0.1, 0.13, 0, 0.123, -0.124);
  block(g, accent, 0.052, 0.025, 0.018, 0, 0.16, -0.199);
  const muzzle = cylinder(g, ink, 0.087, 0.105, 0.15, 0, 0.015, 0.257, 8);
  muzzle.rotation.x = Math.PI / 2;
  const lens = cylinder(g, accent, 0.054, 0.054, 0.012, 0, 0.015, 0.335, 8);
  lens.rotation.x = Math.PI / 2;
  if (id) block(g, accent, 0.22, 0.06, 0.23, 0, 0.14, 0);
  return batch(g);
}
export function person(id, gun = 0) {
  const g = new T.Group(),
    coat = id === 0 ? '#232831' : cast[id][3],
    skin = id === 5 ? '#abdce2' : '#c78e68';
  for (const side of [-1, 1]) {
    const x = side * 0.16;
    beam(g, ink, [x, 0.94, 0], [x * 1.08, 0.18, 0.035], 0.135);
    block(g, '#29363d', 0.24, 0.17, 0.36, x, 0.09, 0.07);
  }
  oval(g, coat, 0.41, 0.49, 0.245, 0, 1.25, 0);
  oval(g, ink, 0.36, 0.14, 0.22, 0, 1.58, -0.075);
  for (const side of [-1, 1]) {
    const x = side * 0.34;
    beam(g, coat, [x, 1.49, 0], [x * 1.17, 1.19, 0.09], 0.14);
    beam(g, coat, [x * 1.17, 1.19, 0.09], [side * 0.16, 1.25, 0.37], 0.105);
    oval(g, skin, 0.09, 0.09, 0.09, side * 0.16, 1.25, 0.37);
    beam(g, side === 1 ? amber : '#5185ce', [side * 0.2, 1.57, 0.18], [side * 0.2, 1.28, 0.245], 0.023);
  }
  if (id === 0) {
    const f = head(g);
    f.position.y = 1.95;
    f.scale.setScalar(0.84);
  } else {
    oval(g, skin, 0.29, 0.33, 0.26, 0, 1.92, 0.01);
    oval(g, id === 2 ? '#9f5889' : '#26323c', 0.31, 0.2, 0.26, 0, 2.09, -0.02);
    for (const side of [-1, 1]) {
      oval(g, ink, 0.034, 0.039, 0.025, side * 0.111, 1.94, 0.249);
    }
    if (id === 1) {
      cylinder(g, steel, 0.22, 0.36, 0.19, 0, 2.14, 0);
      block(g, '#c98443', 0.13, 0.25, 0.36, 0, 2.25, -0.03);
    }
    if (id === 2) {
      for (const s of [-1, 1]) oval(g, '#924e82', 0.13, 0.31, 0.16, s * 0.26, 1.91, -0.06);
    }
    if (id === 3) {
      block(g, '#e3c663', 0.58, 0.075, 0.48, 0, 2.03, 0);
      block(g, cast[id][3], 0.43, 0.08, 0.26, 0, 2.03, 0.29);
    }
    if (id === 4) {
      for (const s of [-1, 1]) oval(g, steel, 0.11, 0.14, 0.13, s * 0.29, 1.96, 0);
      beam(g, ink, [0.29, 1.93, 0.02], [0.17, 1.83, 0.29], 0.024);
    }
    if (id === 5) {
      for (const s of [-1, 1]) {
        mesh(g, new T.TorusGeometry(0.102, 0.014, 5, 12), mat('#3b5967'), s * 0.114, 1.95, 0.252);
      }
      block(g, steel, 0.06, 0.018, 0.018, 0, 1.95, 0.26);
      for (let i = -2; i <= 2; i++) {
        const tuft = mesh(
          g,
          new T.ConeGeometry(0.116, 0.29, 5),
          mat('#162c38'),
          i * 0.092,
          2.24 - Math.abs(i) * 0.024,
          -0.015,
        );
        tuft.rotation.z = -0.45 + i * 0.13;
      }
    }
  }
  const tool = weapon(gun);
  tool.position.set(0.12, 1.27, 0.51);
  g.add(tool);
  return batch(g);
}
export function drone() {
  const g = new T.Group();
  oval(g, '#ab5d51', 0.52, 0.44, 0.48, 0, 1.22, 0);
  block(g, ink, 0.68, 0.2, 0.24, 0, 1.23, 0.36);
  block(g, '#ff785d', 0.4, 0.075, 0.06, 0, 1.24, 0.5);
  for (const s of [-1, 1]) {
    block(g, steel, 0.34, 0.13, 0.3, s * 0.54, 1.24, 0);
    cylinder(g, '#ff9958', 0.16, 0.1, 0.22, s * 0.62, 1.08, 0);
  }
  return batch(g);
}
export const obstacles = [
  [-10, 0, 3, 2],
  [-6, 3, 2, 2],
  [8, 1, 2, 2],
  [10, 6, 3, 2],
  [-4, -8, 2, 1.5],
  [5, -6, 2, 1.5],
];
export function station(mission, index) {
  const g = new T.Group();
  if (mission === 2 && index === 0) {
    block(g, ink, 0.84, 0.54, 0.48, 0, 0.29, 0);
    for (const x of [-0.27, 0, 0.27]) block(g, teal, 0.15, 0.34, 0.51, x, 0.29, 0);
    beam(g, steel, [-0.24, 0.66, 0], [0.24, 0.66, 0], 0.04);
  } else if (mission === 1) {
    cylinder(g, ink, 0.39, 0.52, 0.12, 0, 0.08, 0);
    cylinder(g, steel, 0.055, 0.07, 0.85, 0, 0.55, 0);
    const lamp = cylinder(g, ink, 0.3, 0.38, 0.63, 0, 1.22, 0);
    lamp.rotation.x = 1.03;
    const lens = cylinder(g, '#ffe4a3', 0.265, 0.265, 0.035, 0, 1.4, 0.26);
    lens.rotation.x = 1.03;
  } else if (mission === 3 || (mission === 0 && index < 2)) {
    block(g, ink, 0.83, 0.67, 0.68, 0, 0.34, 0);
    for (let i = 0; i < 4; i++) block(g, teal, 0.08, 0.065, 0.03, -0.27 + i * 0.16, 0.49, 0.35);
    beam(g, steel, [0, 0.63, 0], [0, 1.42, 0], 0.045);
    const dish = oval(g, cream, 0.39, 0.1, 0.38, 0, 1.39, 0);
    dish.rotation.x = -0.58;
    beam(g, ink, [0, 1.4, 0], [0, 1.68, 0.18], 0.026);
  } else if (mission === 4 && index === 0) {
    block(g, ink, 0.72, 0.46, 0.51, 0, 0.26, 0);
    block(g, amber, 0.43, 0.12, 0.52, 0, 0.31, 0);
  } else {
    block(g, ink, 1.27, 0.85, 0.66, 0, 0.43, 0);
    block(g, steel, 1.42, 0.12, 0.78, 0, 0.91, 0);
    block(g, ink, 0.93, 0.56, 0.13, 0, 1.27, -0.13);
    block(g, teal, 0.82, 0.42, 0.025, 0, 1.27, -0.054);
    for (let i = 0; i < 5; i++) block(g, cream, 0.12, 0.035, 0.11, -0.36 + i * 0.18, 0.99, 0.18);
  }
  const result = batch(g);
  if (mission === 4 && index === 1) {
    const progress = block(result, '#254551', 0.72, 0.09, 0.02, 0, 1.24, -0.03);
    progress.name = 'exportProgress';
  }
  return result;
}
export function studio() {
  const g = new T.Group();
  block(g, '#526870', 30, 0.35, 30, 0, -0.2, 0);
  for (let i = -14; i <= 14; i += 2) {
    block(g, '#64777b', 0.025, 0.012, 28, i, 0, 0);
    block(g, '#64777b', 28, 0.012, 0.025, 0, 0, i);
  }
  for (const x of [-14.5, 14.5]) block(g, '#34515a', 0.7, 3.8, 29, x, 1.89, 0);
  block(g, '#314951', 29, 4, 0.5, 0, 2, -14.4);
  block(g, '#38565b', 29, 3, 0.5, 0, 1.5, 14.4);
  for (let x = -13; x <= 13; x += 2) {
    block(g, '#253940', 1.72, 3.25, 0.28, x, 2, -14.0);
    block(g, x % 4 === 1 ? amber : teal, 0.07, 3.1, 0.32, x + 0.72, 2, -13.82);
  }
  sign(g, 'MT  /  AO VIVO', 8, 1.35, 0, 3.2, -13.6);
  sign(g, 'ILHA DE EDIÇÃO', 4, 0.8, 13.92, 2.3, 3, ink, '#99eeeb', -Math.PI / 2);
  sign(g, 'DEPÓSITO', 4, 0.8, -13.92, 2.5, 2, ink, cream, Math.PI / 2);
  for (const x of [-12, 12]) {
    for (const z of [-12, 10]) {
      for (const dx of [-0.22, 0.22]) beam(g, steel, [x + dx, 0, z], [x + dx, 5.8, z], 0.07);
      for (let y = 0; y < 5.6; y += 0.7) beam(g, steel, [x - 0.22, y, z], [x + 0.22, y + 0.65, z], 0.045);
    }
  }
  for (const z of [-12, 10]) {
    for (const y of [5.35, 5.9]) beam(g, ink, [-12, y, z], [12, y, z], 0.08);
    for (let x = -12; x < 12; x++)
      beam(
        g,
        steel,
        [x, 5.35 + (x % 2 === 0 ? 0 : 0.55), z],
        [x + 1, 5.35 + (x % 2 === 0 ? 0.55 : 0), z],
        0.04,
      );
    for (let x = -9; x < 12; x += 6) {
      const lamp = block(g, ink, 0.8, 0.55, 0.82, x, 5.12, z);
      lamp.rotation.x = -0.27;
      block(g, '#ffddaa', 0.64, 0.34, 0.08, x, 5.06, z + 0.43);
    }
  }
  for (const [x, z, w, d] of obstacles) {
    block(g, ink, w, 1.32, d, x, 0.66, z);
    block(g, '#a37751', w - 0.1, 1.09, d + 0.02, x, 0.66, z);
    for (const s of [-1, 1]) block(g, steel, 0.13, 1.36, d + 0.06, x + s * w * 0.34, 0.68, z);
    block(g, '#b99a71', w + 0.04, 0.11, d + 0.04, x, 1.32, z);
  }
  for (let i = 0; i < 4; i++) {
    block(g, ink, 1.8, 1.13, 0.7, 13.6, 0.57, -4 + i * 2);
    block(g, teal, 1.26, 0.58, 0.07, 13.53, 1.55, -3.64 + i * 2);
  }
  // Painted stage markings, equipment bays and cameras along the studio perimeter.
  for (const x of [-12.7, 12.7]) {
    block(g, '#a3a78a', 0.09, 0.016, 24, x, 0.013, 0);
    for (let z = -11; z < 12; z += 3) block(g, '#d39a5f', 0.34, 0.018, 0.75, x, 0.015, z);
  }
  for (const x of [-10, 10]) {
    for (const s of [-1, 1]) beam(g, steel, [x, 1.36, -13], [x + s * 0.45, 0.04, -12.7], 0.055);
    beam(g, steel, [x, 1.36, -13], [x, 0.04, -13.5], 0.055);
    block(g, ink, 0.68, 0.44, 0.83, x, 1.57, -13);
    cylinder(g, steel, 0.2, 0.2, 0.26, x, 1.58, -12.55).rotation.x = Math.PI / 2;
    block(g, '#ff624e', 0.11, 0.08, 0.13, x + 0.19, 1.83, -12.85);
  }
  sign(g, 'RECEPÇÃO   /   MT', 5, 0.86, 0, 2.12, 14.05, ink, cream, Math.PI);
  sign(g, 'NO AR', 1.15, 0.45, 0, 4.25, -13.78, '#9b352b', '#fff0b8');
  for (const z of [-5, -2, 1, 4, 7]) {
    for (const y of [0.4, 1.6, 2.8]) {
      block(g, steel, 0.9, 0.09, 2.6, -13.43, y, z);
      for (const dz of [-0.6, 0.52])
        block(g, y === 1.6 ? '#a98062' : '#48616a', 0.7, 0.52, 0.85, -13.43, y + 0.31, z + dz);
    }
  }
  for (let i = 0; i < 17; i++) {
    const x = -42 + i * 5,
      h = 4 + ((i * 17) % 11);
    const z = -26 - (i % 3) * 4;
    block(g, i % 2 ? '#566c72' : '#50646f', 4, h, 4, x, h / 2, z);
    block(g, '#485a64', 2.2, 0.6, 2.4, x, h + 0.28, z);
    for (let y = 2; y < h - 0.5; y += 1.65)
      for (let k = -1; k <= 1; k++)
        block(g, (i + k) % 4 ? '#718486' : '#c4ab84', 0.53, 0.5, 0.04, x + k, y, z + 2);
  }
  return batch(g);
}
