import { THREE, material, mesh, sphere, rod, v } from './geometry.js';
const cream = material('#fff0ce');
const skin = material('#bb794f');
const skinLight = material('#cc9066');
const skinShade = material('#975a44');
const hair = material('#211914', 0.98, { flatShading: true });
const hairLight = material('#39271c', 0.96, { flatShading: true });
const iris = material('#3d2921', 0.41);
const pupil = material('#201716', 0.3);
const eyeWhite = material('#e1c4ae');
export function head(parent) {
  const face = new THREE.Group();
  parent.add(face);
  // Perfis esculpidos em anéis do queixo ao topo para definir maxilar e maçãs do rosto.
  const rings = [
    [-0.39, 0.11, 0.14, 0.034],
    [-0.32, 0.22, 0.215, 0.045],
    [-0.22, 0.294, 0.237, 0.022],
    [-0.07, 0.335, 0.254, 0.006],
    [0.065, 0.344, 0.255, 0],
    [0.208, 0.32, 0.239, -0.013],
    [0.337, 0.272, 0.209, -0.03],
    [0.42, 0.12, 0.13, -0.045],
  ];
  const vertices = [],
    indices = [],
    slices = 16;
  rings.forEach(([y, width, depth, shift], row) => {
    for (let i = 0; i < slices; i++) {
      const a = (i / slices) * Math.PI * 2;
      vertices.push(Math.sin(a) * width, y, Math.cos(a) * depth + shift);
      if (row > 0) {
        const j = i + row * slices,
          k = ((i + 1) % slices) + row * slices;
        indices.push(j - slices, k - slices, j, k - slices, k, j);
      }
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  mesh(face, geo, skinLight);
  for (const side of [-1, 1]) {
    sphere(face, skin, 0.076, 0.12, 0.073, side * 0.332, -0.026, -0.015, 18).rotation.z = side * -0.22;
    sphere(face, skinShade, 0.037, 0.067, 0.036, side * 0.369, -0.027, 0.016, 16);
    const socket = sphere(face, skinShade, 0.108, 0.04, 0.038, side * 0.133, 0.063, 0.223);
    socket.rotation.z = side * 0.075;
    const eye = sphere(face, eyeWhite, 0.081, 0.025, 0.021, side * 0.135, 0.061, 0.252);
    eye.rotation.z = side * 0.06;
    sphere(face, iris, 0.029, 0.024, 0.012, side * 0.133, 0.061, 0.27, 16);
    sphere(face, pupil, 0.015, 0.017, 0.007, side * 0.133, 0.061, 0.28, 16);
    sphere(face, cream, 0.006, 0.006, 0.003, side * 0.133 - 0.009, 0.068, 0.285, 12);
    rod(face, hair, v(side * 0.061, 0.115, 0.27), v(side * 0.166, 0.137, 0.253), 0.018, 0.021);
    rod(face, hair, v(side * 0.166, 0.137, 0.253), v(side * 0.236, 0.121, 0.21), 0.021, 0.008);
    sphere(face, skin, 0.034, 0.029, 0.034, side * 0.036, -0.086, 0.271, 16);
    const temple = mesh(face, new THREE.IcosahedronGeometry(1, 1), hair, side * 0.286, 0.21, -0.02);
    temple.scale.set(0.079, 0.19, 0.22);
  }
  const bridge = sphere(face, skinLight, 0.047, 0.122, 0.064, 0, -0.009, 0.258, 20);
  bridge.rotation.x = -0.16;
  sphere(face, skinLight, 0.059, 0.052, 0.068, 0, -0.079, 0.295, 20);
  const lip = sphere(face, skinShade, 0.102, 0.017, 0.026, 0, -0.192, 0.239, 24);
  lip.rotation.x = 0.12;
  sphere(face, material('#b87761'), 0.082, 0.013, 0.014, 0, -0.21, 0.246, 24);
  const hairstyle = [
    [0.02, 0.327, -0.074, 0.345, 0.202, 0.268, -0.1],
    [0.035, 0.396, 0.053, 0.33, 0.148, 0.206, 0.12],
    [-0.105, 0.36, 0.096, 0.242, 0.137, 0.175, -0.24],
    [0.074, 0.341, 0.156, 0.232, 0.109, 0.13, -0.18],
    [0.17, 0.314, 0.114, 0.159, 0.124, 0.137, -0.28],
    [-0.192, 0.31, 0.119, 0.13, 0.114, 0.102, -0.35],
  ];
  hairstyle.forEach(([x, y, z, a, b, c, twist], i) => {
    const tuft = mesh(
      face,
      new THREE.IcosahedronGeometry(1, 1),
      i === 1 || i === 3 ? hairLight : hair,
      x,
      y,
      z,
    );
    tuft.scale.set(a, b, c);
    tuft.rotation.z = twist;
  });
  return face;
}
