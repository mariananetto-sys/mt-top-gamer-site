import { THREE as T } from './geometry.js';
import { detail, sculpt, piping } from './face.js';

function limb(g, c, a, b, sections) {
  const start = new T.Vector3(...a),
    end = new T.Vector3(...b),
    d = end.sub(start);
  const part = sculpt(
    g,
    c,
    sections.map(([fraction, w, h]) => [fraction * d.length(), w, h]),
    14,
  );
  part.position.copy(start);
  part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
}
function legs(pants, skin) {
  const result = [];
  for (const s of [-1, 1]) {
    const g = new T.Group();
    result.push(g);
    const x = s * 0.146,
      z = s * 0.06;
    limb(
      g,
      skin,
      [x, 0.97, 0],
      [x + s * 0.032, 0.149, z],
      [
        [0, 0.12, 0.137],
        [0.2, 0.122, 0.134],
        [0.46, 0.1, 0.102],
        [0.53, 0.106, 0.109],
        [0.77, 0.091, 0.088],
        [1, 0.071, 0.078],
      ],
    );
    limb(
      g,
      pants,
      [x, 0.98, 0],
      [x + s * 0.019, 0.52, z * 0.5],
      [
        [0, 0.132, 0.139],
        [0.28, 0.133, 0.147],
        [1, 0.122, 0.124],
      ],
    );
    const boot = sculpt(
      g,
      '#343b42',
      [
        [0.031, 0.096, 0.169, 0, 0.045],
        [0.066, 0.103, 0.177, 0, 0.052],
        [0.107, 0.1, 0.155, 0, 0.042],
        [0.135, 0.087, 0.112],
        [0.198, 0.079, 0.085, 0, -0.005],
      ],
      18,
    );
    boot.position.set(x + s * 0.032, 0, z);
    detail(g, '#b9aa97', boot.position.x, 0.031, z + 0.052, 0.105, 0.023, 0.178);
    const accent = '#59696f';
    piping(
      g,
      accent,
      [
        [boot.position.x + s * 0.097, 0.078, z + 0.14],
        [boot.position.x + s * 0.097, 0.083, z + 0.03],
        [boot.position.x + s * 0.078, 0.088, z - 0.069],
      ],
      0.007,
    );
    for (let j = 0; j < 3; j++)
      piping(
        g,
        '#82908f',
        [
          [boot.position.x - 0.054, 0.115 + j * 0.008, z + 0.142 - j * 0.026],
          [boot.position.x + 0.049, 0.118 + j * 0.008, z + 0.127 - j * 0.026],
        ],
        0.005,
      );
  }
  return result;
}
function hand(g, skin, x, y, z, s) {
  detail(g, skin, x, y, z, 0.063, 0.052, 0.079);
  for (let i = 0; i < 4; i++)
    detail(g, skin, x + s * 0.032, y - 0.034 + i * 0.017, z + 0.053 - i * 0.012, 0.031, 0.01, 0.026, 10);
  detail(g, skin, x - s * 0.04, y + 0.014, z + 0.029, 0.023, 0.033, 0.044);
}
export function jackson(g) {
  const pants = '#37599a',
    skin = '#eb91ab',
    trim = '#78c3d4';
  const legsForOutfit = legs(pants, skin);
  // Jackson's pink, round silhouette and blue shorts come from the channel game.
  detail(g, skin, 0, 1.3, 0, 0.455, 0.657, 0.365, 24);
  sculpt(
    g,
    pants,
    [
      [0.83, 0.317, 0.263],
      [0.91, 0.384, 0.305],
      [1.055, 0.435, 0.335],
      [1.108, 0.443, 0.347],
    ],
    24,
  );
  for (const s of [-1, 1]) {
    detail(g, '#fff3e6', s * 0.121, 1.65, 0.272, 0.066, 0.087, 0.042);
    detail(g, '#252b41', s * 0.119, 1.65, 0.31, 0.029, 0.055, 0.019);
    detail(g, '#ffffff', s * 0.125, 1.675, 0.327, 0.008, 0.009, 0.005);
    detail(g, '#df7d9a', s * 0.235, 1.52, 0.265, 0.067, 0.031, 0.014);
    const wrist = s === 1 ? [0.145, 1.16, 0.368] : [-0.022, 1.11, 0.473];
    limb(g, skin, [s * 0.34, 1.36, 0.042], wrist, [
      [0, 0.128, 0.123],
      [0.4, 0.111, 0.124],
      [1, 0.068, 0.072],
    ]);
    hand(g, skin, ...wrist, s);
  }
  piping(
    g,
    '#9e526d',
    [
      [-0.093, 1.473, 0.337],
      [0, 1.447, 0.349],
      [0.093, 1.472, 0.337],
    ],
    0.011,
  );
  piping(
    g,
    trim,
    [
      [-0.28, 1.66, 0.07],
      [-0.23, 1.885, -0.016],
      [0, 1.974, -0.026],
      [0.23, 1.885, -0.016],
      [0.28, 1.66, 0.07],
    ],
    0.023,
  );
  for (const s of [-1, 1]) detail(g, '#394651', s * 0.31, 1.64, 0.04, 0.069, 0.109, 0.086);
  return legsForOutfit;
}
