import { THREE as T, v } from './geometry.js';

// The pool is reused between effects, including with Canvas rendering.
export function effects(scene) {
  const sparks = new T.OctahedronGeometry(1);
  const materials = ['#f3cb89', '#ed8250', '#6fede5', '#f7edf2'].map(
    (color) => new T.MeshBasicMaterial({ color }),
  );
  const pool = Array.from({ length: 42 }, () => {
    const mesh = new T.Mesh(sparks, materials[0]);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, velocity: v(0, 0, 0), age: 0, duration: 0, size: 0 };
  });
  let cursor = 0;
  return {
    burst(origin, count, color, spread, size) {
      for (let i = 0; i < count; i++) {
        const p = pool[cursor];
        cursor = (cursor + 1) % pool.length;
        p.age = p.duration = 0.2 + Math.random() * 0.3;
        p.size = size * (0.5 + Math.random() * 0.6);
        p.mesh.position.copy(origin);
        p.mesh.material = materials[i % 4 === 0 ? 3 : color];
        p.mesh.visible = true;
        p.mesh.scale.setScalar(p.size);
        p.mesh.rotation.set(Math.random() * 3, Math.random() * 3, 0);
        p.velocity.set(
          (Math.random() - 0.5) * spread,
          (0.33 + Math.random()) * spread,
          (Math.random() - 0.5) * spread,
        );
      }
    },
    clear() {
      for (const p of pool) {
        p.age = 0;
        p.mesh.visible = false;
      }
    },
    update(dt) {
      for (const p of pool)
        if (p.age > 0) {
          p.age -= dt;
          if (p.age <= 0) {
            p.mesh.visible = false;
            continue;
          }
          p.velocity.y -= 7.9 * dt;
          p.mesh.position.addScaledVector(p.velocity, dt);
          p.mesh.rotation.x += dt * 7;
          p.mesh.rotation.z += dt * 4;
          p.mesh.scale.setScalar(p.size * Math.sqrt(p.age / p.duration));
        }
    },
  };
}
