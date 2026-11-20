import { THREE as T, box, sphere, mesh, rod, v, material } from './geometry.js';
import { sculpt, detail, piping, cloth } from './face.js';
import { outfit } from './outfits.js';
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
// Oval cross-sections along the forward axis form a continuous blaster shell.
function housing(g, color, profiles, x = 0, y = 0) {
  const part = sculpt(g, color, profiles, 12);
  part.rotation.x = Math.PI / 2;
  part.position.set(x, y, 0);
  return part;
}
export function weapon(id = 0, held = false) {
  const g = new T.Group(),
    glow = [teal, amber, '#bc9dff'][id];
  const finish = ['#405966', '#62594c', '#4e506d'][id],
    w = [0.09, 0.1, 0.134][id];
  housing(g, finish, [
    [-0.27, w * 0.55, 0.077],
    [-0.225, w * 0.89, 0.093],
    [-0.145, w, 0.101],
    [0.09, w, 0.088],
    [0.179, w * 0.86, 0.074],
    [0.22, w * 0.65, 0.055],
  ]);
  housing(
    g,
    ink,
    [
      [-0.223, 0.047, 0.019],
      [-0.14, 0.06, 0.032],
      [0.1, 0.055, 0.03],
      [0.17, 0.037, 0.018],
    ],
    0,
    0.085,
  );
  for (const side of [-1, 1]) {
    piping(
      g,
      glow,
      [
        [side * w * 0.91, 0.03, -0.175],
        [side * (w + 0.004), 0.035, -0.09],
        [side * (w + 0.005), 0.023, 0.07],
        [side * w * 0.8, 0.016, 0.158],
      ],
      0.008,
    );
    for (let j = 0; j < 3; j++)
      piping(
        g,
        ink,
        [
          [side * w, 0.008, 0.028 + j * 0.034],
          [side * w * 0.94, -0.032, 0.045 + j * 0.034],
        ],
        0.006,
      );
  }
  const ports = id === 1 ? [-0.047, 0.047] : [0];
  for (const x of ports) {
    const r = id === 2 ? 0.085 : id === 1 ? 0.037 : 0.058;
    housing(
      g,
      ink,
      [
        [0.13, r * 0.82, r * 0.82],
        [0.18, r, r],
        [0.27, r * 0.85, r * 0.85],
        [0.3, r, r],
        [0.327, r * 0.97, r * 0.97],
      ],
      x,
      0.004,
    );
    housing(
      g,
      glow,
      [
        [0.321, r * 0.68, r * 0.68],
        [0.333, r * 0.68, r * 0.68],
      ],
      x,
      0.004,
    );
  }
  if (id === 2) {
    for (let j = 0; j < 3; j++)
      housing(g, glow, [
        [0.074 + j * 0.036, 0.108, 0.097],
        [0.081 + j * 0.036, 0.108, 0.097],
      ]);
  }
  const grip = sculpt(
    g,
    '#28373b',
    [
      [-0.183, 0.045, 0.055],
      [-0.15, 0.055, 0.06],
      [-0.042, 0.049, 0.069],
      [0, 0.051, 0.065],
    ],
    12,
  );
  grip.position.z = -0.111;
  grip.rotation.x = -0.22;
  for (let j = 0; j < 3; j++)
    piping(
      g,
      '#4c5960',
      [
        [-0.046, -0.087 - j * 0.025, -0.081],
        [0, -0.09 - j * 0.025, -0.06],
        [0.046, -0.087 - j * 0.025, -0.081],
      ],
      0.005,
    );
  piping(
    g,
    ink,
    [
      [-0.004, -0.063, -0.07],
      [-0.004, -0.118, -0.047],
      [-0.004, -0.115, 0.044],
      [-0.004, -0.061, 0.059],
    ],
    0.011,
  );
  for (const s of [-1, 1]) block(g, ink, 0.012, 0.041, 0.026, s * 0.04, 0.12, -0.15);
  block(g, glow, 0.025, 0.012, 0.018, 0, 0.116, 0.13);
  if (held) {
    detail(g, '#333d43', 0.072, -0.105, -0.137, 0.063, 0.07, 0.094, 16);
    for (let j = 0; j < 3; j++)
      detail(g, '#50595a', 0.016, -0.095 - j * 0.024, -0.058 - j * 0.005, 0.054, 0.016, 0.023, 12);
    detail(g, '#28313a', 0.087, -0.136, -0.249, 0.086, 0.082, 0.136, 16);
  }
  return batch(g);
}
export function person(id, gun = 0) {
  const g = new T.Group();
  const legs = outfit(g, id);
  const tool = weapon(gun);
  tool.position.set(id === 4 ? 0.13 : 0.087, id === 4 ? 1.18 : 1.35, 0.481);
  g.add(tool);
  const body = batch(g);
  legs.forEach((leg, index) => {
    // Rebase each rigid leg around the hip so animation cannot open a gap at the waist.
    const hip = new T.Group();
    hip.position.set(index === 0 ? -0.146 : 0.146, 0.96, 0);
    hip.name = index === 0 ? 'leftLeg' : 'rightLeg';
    leg.position.copy(hip.position).negate();
    hip.add(batch(leg));
    body.add(hip);
  });
  return body;
}
export function drone() {
  const g = new T.Group();
  sculpt(
    g,
    '#985849',
    [
      [0.91, 0.16, 0.17],
      [0.96, 0.31, 0.26],
      [1.07, 0.414, 0.34],
      [1.29, 0.433, 0.35],
      [1.39, 0.361, 0.285],
      [1.46, 0.205, 0.177],
    ],
    22,
  );
  detail(g, '#37464c', 0, 1.24, 0.28, 0.284, 0.136, 0.133, 20);
  for (const s of [-1, 1]) {
    detail(g, '#f57756', s * 0.116, 1.25, 0.39, 0.077, 0.051, 0.026);
    detail(g, '#ffddb0', s * 0.116, 1.26, 0.412, 0.031, 0.022, 0.009);
    beam(g, steel, [s * 0.3, 1.22, 0], [s * 0.61, 1.29, 0], 0.072);
    const nacelle = mesh(g, new T.TorusGeometry(0.202, 0.052, 8, 20), cloth('#4a5559'), s * 0.63, 1.28, 0);
    nacelle.rotation.x = Math.PI / 2;
    for (let j = 0; j < 3; j++) {
      const blade = detail(g, '#b98967', s * 0.63, 1.278, 0, 0.173, 0.012, 0.029, 10);
      blade.rotation.y = (j * Math.PI) / 3;
    }
    detail(g, '#263940', s * 0.63, 1.273, 0, 0.063, 0.086, 0.062);
    piping(
      g,
      ink,
      [
        [s * 0.22, 1.02, 0.13],
        [s * 0.27, 0.865, 0.1],
        [s * 0.27, 0.849, -0.124],
      ],
      0.024,
    );
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
// Texture dimensions map to the playable 30 m square. All graphics are painted
// into the studio surface, including markings that never obstruct movement.
function floorArt(g) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d'),
    size = 1024,
    step = size / 15;
  let state = 361;
  const random = () => (state = (Math.imul(state, 1664525) + 1013904223) >>> 0) / 4294967296;
  x.fillStyle = '#3b5059';
  x.fillRect(0, 0, size, size);
  const zones = [
    ['#55545b', 163, 37, 697, 290, 'PALCO', 196, 291],
    ['#575249', 37, 344, 194, 570, 'DEPÓSITO', 53, 863],
    ['#3b5d62', 779, 365, 205, 546, 'EDIÇÃO', 795, 862],
    ['#504d48', 300, 765, 428, 210, 'RECEPÇÃO', 354, 932],
  ];
  for (const [color, left, top, w, h, name, tx, ty] of zones) {
    x.fillStyle = color;
    x.fillRect(left, top, w, h);
    x.strokeStyle = '#bba879';
    x.lineWidth = 3;
    x.strokeRect(left + 5, top + 5, w - 10, h - 10);
    x.fillStyle = '#b8af9b';
    x.font = 'bold 31px Arial';
    x.fillText(name, tx, ty);
    x.fillStyle = '#bea16c';
    for (const px of [left + 17, left + w - 55])
      for (let k = 0; k < 3; k++) x.fillRect(px + 11 * k, top + 17, 7, 24);
  }
  for (let i = 1; i < 15; i++) {
    x.fillStyle = '#24363b55';
    x.fillRect(i * step, 0, 1.3, size);
    x.fillRect(0, i * step, size, 1.3);
    x.fillStyle = '#a7c4be21';
    x.fillRect(i * step + 1.4, 0, 1, size);
    x.fillRect(0, i * step + 1.4, size, 1);
  }
  for (let i = 0; i < 12000; i++) {
    x.fillStyle = i % 2 ? '#a9c8c220' : '#1f2d3455';
    x.fillRect(random() * size, random() * size, 1 + random() * 4, 1 + random());
  }
  x.strokeStyle = '#dba85d';
  x.lineWidth = 2;
  x.setLineDash([15, 19]);
  x.strokeRect(258, 347, 494, 377);
  x.setLineDash([]);
  x.strokeStyle = '#b4cfcd77';
  x.lineWidth = 3;
  x.beginPath();
  x.arc(512, 537, 65, 0, 2 * Math.PI);
  x.stroke();
  x.fillStyle = '#b4cfcd77';
  x.font = 'italic 900 53px Arial';
  x.fillText('MT', 467, 555);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  map.anisotropy = 4;
  const plane = mesh(g, new T.PlaneGeometry(30, 30), new T.MeshBasicMaterial({ map }), 0, 0, 0);
  plane.rotation.x = -Math.PI / 2;
}

function stageScreen(g) {
  const c = document.createElement('canvas');
  c.width = 960;
  c.height = 240;
  const x = c.getContext('2d'),
    grad = x.createLinearGradient(0, 0, 960, 240);
  grad.addColorStop(0, '#10292e');
  grad.addColorStop(0.46, '#15363d');
  grad.addColorStop(1, '#30464a');
  x.fillStyle = grad;
  x.fillRect(0, 0, 960, 240);
  for (let px = 0; px < 960; px += 16)
    for (let y = 0; y < 240; y += 16) {
      x.fillStyle = (px + y) % 48 ? '#5ac7c226' : '#5ac7c24e';
      x.fillRect(px, y, 2, 2);
    }
  for (let k = 0; k < 4; k++) {
    x.beginPath();
    x.moveTo(0, 110);
    for (let px = 0; px <= 960; px += 8)
      x.lineTo(px, 98 + k * 18 + Math.sin(px * 0.024 + k) * Math.sin(px * 0.007 + k) * 32);
    x.strokeStyle = k % 2 ? '#55bac072' : '#e2b16a78';
    x.lineWidth = 2;
    x.stroke();
  }
  x.fillStyle = '#153439';
  x.fillRect(160, 37, 640, 155);
  x.strokeStyle = '#79a6a1';
  x.lineWidth = 2;
  x.strokeRect(160, 37, 640, 155);
  x.fillStyle = '#f1cd95';
  x.font = 'italic 900 100px Arial';
  x.textAlign = 'center';
  x.fillText('MT  /  AO VIVO', 480, 147, 595);
  x.fillStyle = '#ff865c';
  x.fillRect(798, 37, 9, 155);
  const map = new T.CanvasTexture(c);
  map.colorSpace = T.SRGBColorSpace;
  block(g, '#1e2932', 14.36, 3.47, 0.19, 0, 3.45, -13.7);
  mesh(g, new T.PlaneGeometry(14, 3.15), new T.MeshBasicMaterial({ map }), 0, 3.45, -13.59);
}

export function studio() {
  const g = new T.Group();
  floorArt(g);
  for (const x of [-14.5, 14.5]) block(g, '#34515a', 0.7, 3.8, 29, x, 1.89, 0);
  block(g, '#314951', 29, 4, 0.5, 0, 2, -14.4);
  block(g, '#38565b', 29, 3, 0.5, 0, 1.5, 14.4);
  for (let x = -13; x <= 13; x += 2) {
    block(g, '#253940', 1.72, 3.25, 0.28, x, 2, -14.0);
    block(g, x % 4 === 1 ? amber : teal, 0.07, 3.1, 0.32, x + 0.72, 2, -13.82);
  }
  stageScreen(g);
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
    for (const side of [-1, 1]) {
      const face = z + side * (d / 2 + 0.064);
      block(g, '#342e30', 0.46, 0.17, 0.046, x, 1.005, face);
      block(g, '#a9afb0', 0.31, 0.038, 0.029, x, 0.991, face + side * 0.021);
      for (const corner of [-1, 1]) {
        block(g, '#35444c', 0.21, 0.17, 0.042, x + corner * (w / 2 - 0.126), 0.23, face);
        block(g, '#c9bf9f', 0.04, 0.04, 0.029, x + corner * (w / 2 - 0.126), 0.23, face + side * 0.024);
      }
    }
    for (let i = 0; i < 4; i++) {
      const stripe = block(
        g,
        i % 2 ? '#383d3c' : '#ce9b58',
        0.127,
        0.014,
        0.285,
        x + (i - 1.5) * 0.125,
        1.382,
        z + d / 2 - 0.25,
      );
      stripe.rotation.y = -0.38;
    }
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
  sign(g, 'NO AR', 1.28, 0.48, 0, 5.38, -13.66, '#9b352b', '#fff0b8');
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
