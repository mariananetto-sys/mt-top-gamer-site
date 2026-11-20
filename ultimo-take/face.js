import { THREE as T, mesh, sphere, material, v } from './geometry.js';

const colors = new Map();
export function cloth(color) {
  if (!colors.has(color)) colors.set(color, material(color, 0.82));
  return colors.get(color);
}
// Cross-sections run upwards. Optional offsets shape the jaw, shoulders and ankles.
export function sculpt(parent, color, rows, segments = 20) {
  const verts = [],
    faces = [];
  for (const [y, rx, rz, x = 0, z = 0] of rows) {
    for (let i = 0; i < segments; i++) {
      const a = (i * 2 * Math.PI) / segments;
      verts.push(x + rx * Math.sin(a), y, z + rz * Math.cos(a));
    }
  }
  for (let row = 1; row < rows.length; row++)
    for (let i = 0; i < segments; i++) {
      const b = row * segments + i,
        c = row * segments + ((i + 1) % segments);
      faces.push(b - segments, c - segments, b, c - segments, c, b);
    }
  const last = (rows.length - 1) * segments;
  for (let i = 1; i < segments - 1; i++) faces.push(0, i + 1, i, last, last + i, last + i + 1);
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geo.setIndex(faces);
  geo.computeVertexNormals();
  return mesh(parent, geo, cloth(color));
}
export function detail(g, color, x, y, z, rx, ry, rz, n = 14) {
  return sphere(g, cloth(color), rx, ry, rz, x, y, z, n);
}
export function piping(g, color, points, radius) {
  const curve = new T.CatmullRomCurve3(points.map((p) => v(...p)));
  return mesh(g, new T.TubeGeometry(curve, points.length * 2, radius, 5, false), cloth(color));
}
function lock(g, color, x, y, z, width, height, bend, depth) {
  return sculpt(
    g,
    color,
    [
      [0, 0.004, 0.003, bend, depth],
      [height * 0.3, width * 0.52, width * 0.39, bend * 0.6, depth * 0.6],
      [height * 0.68, width, width * 0.6, 0, 0],
      [height, width * 0.23, width * 0.24, -bend * 0.15, -0.018],
    ],
    10,
  ).position.set(x, y, z);
}
const portrait = new T.MeshBasicMaterial({ color: '#b78464' });
const photo = new Image();
photo.onload = () => {
  const surface = document.createElement('canvas');
  surface.width = 512;
  surface.height = 494;
  surface.getContext('2d').drawImage(photo, 0, 0, surface.width, surface.height);
  portrait.map = new T.CanvasTexture(surface);
  portrait.map.colorSpace = T.SRGBColorSpace;
  portrait.color.set('#ffffff');
  portrait.needsUpdate = true;
};
photo.src = new URL('./matheus-referencia.png', import.meta.url).href;
function matheus(g) {
  // Each row follows the outline in the supplied portrait. The nose, cheeks and
  // brow project out in profile, keeping the likeness when viewed from the side.
  const rows = [
    [642, 501, 45, 0.08],
    [610, 505, 132, 0.155],
    [560, 513, 199, 0.181],
    [510, 516, 232, 0.184],
    [453, 520, 254, 0.191],
    [416, 524, 266, 0.203],
    [371, 532, 271, 0.187],
    [343, 532, 276, 0.184],
    [297, 537, 276, 0.197],
    [238, 546, 281, 0.199],
    [189, 548, 292, 0.202],
    [151, 554, 301, 0.204],
    [105, 556, 274, 0.185],
    [61, 563, 211, 0.142],
    [26, 565, 132, 0.093],
    [9, 566, 42, 0.043],
  ];
  const verts = [],
    uv = [],
    idx = [],
    n = 28;
  for (const [py, cx, width, depth] of rows) {
    for (let i = 0; i <= n; i++) {
      const a = (i / n - 0.5) * Math.PI,
        x = Math.sin(a),
        front = Math.cos(a);
      const nose =
        Math.exp(-Math.pow(x / 0.185, 2)) *
        (0.068 * Math.exp(-Math.pow((py - 422) / 32, 2)) + 0.029 * Math.exp(-Math.pow((py - 375) / 60, 2)));
      verts.push(x * width * 0.00077, (642 - py) * 0.00079 - 0.224, depth * front + nose - 0.018);
      uv.push((cx + width * x) / 1024, 1 - py / 987);
    }
  }
  for (let j = 1; j < rows.length; j++)
    for (let i = 0; i < n; i++) {
      const a = (j - 1) * (n + 1) + i,
        b = a + n + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  mesh(g, geo, portrait);
  for (const [start, end, color] of [
    [0, 9, '#bc8864'],
    [9, rows.length - 1, '#30241e'],
  ]) {
    const back = [],
      tri = [];
    for (let j = start; j <= end; j++) {
      const [py, , width, depth] = rows[j];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI / 2 + (i * Math.PI) / 16;
        back.push(
          Math.sin(a) * width * 0.00077,
          (642 - py) * 0.00079 - 0.224,
          -0.018 + Math.cos(a) * depth * 1.14,
        );
      }
    }
    for (let j = 1; j <= end - start; j++)
      for (let i = 0; i < 16; i++) {
        const a = (j - 1) * 17 + i;
        tri.push(a, a + 1, a + 17, a + 1, a + 18, a + 17);
      }
    const shell = new T.BufferGeometry();
    shell.setAttribute('position', new T.Float32BufferAttribute(back, 3));
    shell.setIndex(tri);
    shell.computeVertexNormals();
    mesh(g, shell, cloth(color));
  }
  for (const s of [-1, 1]) detail(g, '#bd8966', s * 0.209, -0.03, -0.007, 0.036, 0.062, 0.03);
}
const looks = [
  null,
  ['#d9a37e', '#e1ba69', '#c39757', '#55736c'],
  ['#e6b290', '#b65526', '#e08238', '#456e52'],
  ['#cb926e', '#402c23', '#604332', '#553c2b'],
  null,
  ['#a2d8dd', '#152c35', '#28434c', '#263b4b'],
];
export function head(g, id) {
  const face = new T.Group();
  g.add(face);
  face.position.y = id === 0 ? 1.924 : 1.89;
  if (id === 0) {
    matheus(face);
    return;
  }
  const [skin, hair, shine, iris] = looks[id],
    sam = id === 5;
  sculpt(
    face,
    skin,
    [
      [-0.222, 0.049, 0.057, 0, 0.026],
      [-0.197, 0.111, 0.103, 0, 0.026],
      [-0.153, 0.149, 0.13, 0, 0.018],
      [-0.068, 0.175, 0.155],
      [0.018, 0.186, 0.162],
      [0.12, 0.181, 0.157],
      [0.193, 0.15, 0.135],
      [0.224, 0.08, 0.085],
    ],
    24,
  );
  for (const s of [-1, 1]) {
    detail(face, skin, s * 0.177, -0.017, -0.002, 0.035, 0.054, 0.028);
    const x = s * 0.076,
      eye = sam ? 0.058 : 0.047;
    detail(face, '#e9e9df', x, 0.016, 0.143, eye, sam ? 0.037 : 0.023, 0.026);
    detail(face, iris, x, 0.016, 0.166, sam ? 0.024 : 0.018, sam ? 0.031 : 0.019, 0.008);
    detail(face, '#20252b', x, 0.017, 0.171, 0.011, 0.016, 0.005);
    detail(face, '#fff9e8', x - 0.005, 0.024, 0.177, 0.004, 0.005, 0.003, 8);
    piping(
      face,
      hair,
      [
        [x - s * 0.042, 0.06, 0.153],
        [x, 0.072, 0.155],
        [x + s * 0.039, 0.06, 0.133],
      ],
      0.009,
    );
    if (sam) {
      mesh(face, new T.TorusGeometry(0.067, 0.006, 6, 24), cloth('#426675'), s * 0.078, 0.01, 0.181);
      piping(
        face,
        '#426675',
        [
          [s * 0.143, 0.021, 0.164],
          [s * 0.169, 0.021, 0.086],
          [s * 0.177, 0.018, -0.01],
        ],
        0.005,
      );
    }
  }
  detail(face, skin, 0, -0.018, 0.154, 0.024, 0.057, 0.028);
  detail(face, skin, 0, -0.053, 0.178, 0.03, 0.022, 0.023);
  if (id === 3) detail(face, '#ddcfba', 0, -0.107, 0.146, 0.037, 0.009, 0.009, 10);
  piping(
    face,
    sam ? '#648d94' : '#975d50',
    [
      [-0.05, -0.105, 0.137],
      [0, -0.113, 0.148],
      [0.05, -0.102, 0.138],
    ],
    0.006,
  );
  if (sam)
    piping(
      face,
      '#426675',
      [
        [-0.013, 0.022, 0.182],
        [0, 0.03, 0.188],
        [0.013, 0.022, 0.182],
      ],
      0.005,
    );
  detail(face, hair, 0, 0.183, -0.029, 0.198, 0.102, 0.175, 24);
  if (id !== 3) {
    for (let i = -3; i <= 3; i++) {
      const x = i * 0.044,
        y = 0.117 + (i > 0 ? i * 0.013 : Math.abs(i) * 0.003);
      const fringe = detail(
        face,
        i % 3 === 0 ? shine : hair,
        x,
        y + 0.057,
        0.137 - x * x * 1.35,
        0.057,
        0.098,
        0.044,
        12,
      );
      fringe.rotation.z = id === 2 ? -0.96 : sam ? -0.61 : -0.29;
      if (id === 1) {
        fringe.scale.y *= 0.72;
        fringe.position.y -= 0.013;
      }
      if (id === 2) {
        fringe.position.x -= 0.025;
        fringe.position.y -= 0.03 - i * 0.007;
        fringe.scale.y *= i < 0 ? 1.02 : 0.81;
      }
    }
  }
  for (let i = 0; i < 13; i++) {
    const a = (i * 2 * Math.PI) / 13,
      x = 0.157 * Math.sin(a),
      z = -0.021 + 0.132 * Math.cos(a),
      front = Math.cos(a) > 0.4;
    if (sam) {
      const tuft = new T.Group();
      face.add(tuft);
      tuft.position.set(x, 0.18, z);
      tuft.rotation.z = -Math.sin(a) * 0.56 - 0.19;
      tuft.rotation.x = Math.cos(a) * 0.4;
      sculpt(
        tuft,
        i % 4 === 0 ? shine : hair,
        [
          [0, 0.066, 0.052],
          [0.074, 0.053, 0.044, 0.014],
          [0.145, 0.027, 0.022, 0.034],
          [0.18 + (i % 3) * 0.018, 0.001, 0.001, 0.054],
        ],
        9,
      );
    } else if (id === 3) {
      const bottom = front ? 0.088 : -0.18;
      for (let j = 0; j < 3; j++)
        detail(
          face,
          (i + j) % 4 === 0 ? shine : hair,
          x + 0.009 * Math.sin(j * 2 + i),
          bottom + j * 0.055,
          z,
          0.052,
          0.061,
          0.048,
          10,
        );
    } else {
      const bottom = front ? 0.065 + (i % 3) * 0.019 : -0.21 - (i % 3) * 0.03;
      lock(
        face,
        i % 4 === 0 ? shine : hair,
        x,
        bottom,
        z,
        0.059,
        0.188 - bottom,
        0.03 * Math.sin(a) - 0.025,
        0.028 * Math.cos(a),
      );
    }
  }
}
