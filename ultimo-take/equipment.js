import { THREE as T, mesh, box, material } from './geometry.js';
import { prop } from './assets.js';
export const magazine = [12, 18, 5];
export const reloadSeconds = [1.05, 1.3, 1.55];
const rail = material('#30424f', 0.62, { metalness: 0.2 });
const ember = new T.MeshBasicMaterial({ color: '#fbad66' });
const blue = new T.MeshBasicMaterial({ color: '#5ad6cf' });
function indicator(g, sx, sy, sz, x, y, z, c = blue) {
  return box(g, c, sx, sy, sz, x, y, z);
}
export function station(mission, index) {
  const g = new T.Group();
  if (mission === 1) {
    g.add(prop('lights', 0, 0, 0, 0.73, 1.52, 0.72, Math.PI / 2));
    indicator(g, 0.38, 0.17, 0.04, 0, 1.39, 0.275, ember);
  } else if ((mission === 2 || mission === 4) && index === 0) {
    g.add(prop('containers_C', 0, 0, 0, 1.02, 0.49, 0.7));
    for (const x of [-0.25, 0, 0.25]) indicator(g, 0.086, 0.075, 0.02, x, 0.39, 0.36, ember);
  } else if (mission === 3 || (mission === 0 && index < 2)) {
    g.add(prop('basemodule_A', 0, 0, 0, 1.22, 0.78, 0.86, Math.PI / 2));
    g.add(prop('solarpanel', 0, 0.74, 0.04, 0.85, 1.04, 0.68, Math.PI * 0.16));
    indicator(g, 0.37, 0.083, 0.05, 0, 0.58, 0.44);
  } else {
    g.add(prop('structure_low', 0, 0, 0, 1.41, 0.86, 0.9, Math.PI));
    const screen = box(g, rail, 1.1, 0.57, 0.11, 0, 1.22, -0.15);
    screen.rotation.x = -0.085;
    indicator(g, 0.93, 0.43, 0.026, 0, 1.215, -0.08);
    const progress = indicator(g, 0.82, 0.08, 0.02, 0, 1.16, -0.06, ember);
    progress.name = 'exportProgress';
    progress.visible = false;
  }
  return g;
}
