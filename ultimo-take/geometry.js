import * as THREE from './vendor/three.module.min.js';

export { THREE };
export const material = (color, roughness = 0.76, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness, ...extra });
export const v = (x, y, z) => new THREE.Vector3(x, y, z);

export function mesh(parent, geo, mat, x = 0, y = 0, z = 0) {
  const item = new THREE.Mesh(geo, mat);
  item.position.set(x, y, z);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}

export function box(parent, mat, width, height, depth, x, y, z) {
  return mesh(parent, new THREE.BoxGeometry(width, height, depth), mat, x, y, z);
}

export function sphere(parent, mat, sx, sy, sz, x, y, z, segments = 10) {
  const shape = mesh(parent, new THREE.SphereGeometry(1, segments, Math.max(4, segments >> 1)), mat, x, y, z);
  shape.scale.set(sx, sy, sz);
  return shape;
}

export function rod(parent, mat, a, b, radius, tip = radius, segments = 12) {
  const shape = mesh(parent, new THREE.CylinderGeometry(tip, radius, a.distanceTo(b), segments), mat);
  shape.position.copy(a).lerp(b, 0.5);
  shape.quaternion.setFromUnitVectors(v(0, 1, 0), b.clone().sub(a).normalize());
  return shape;
}
