import { THREE as T } from './geometry.js';

// Use the same meshes, camera and simulation on machines without WebGL 2.
export function createDisplay(canvas) {
  let gl;
  try {
    gl = canvas.getContext('webgl2', { antialias: true, alpha: true, stencil: false });
    if (gl) {
      const renderer = new T.WebGLRenderer({ canvas, context: gl });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
      renderer.outputColorSpace = T.SRGBColorSpace;
      return { canvas, renderer };
    }
  } catch {
    // A canvas bound to a failed GL context cannot switch to a 2D context.
    const replacement = canvas.cloneNode(false);
    canvas.replaceWith(replacement);
    canvas = replacement;
  }
  return { canvas, renderer: new SoftwareDisplay(canvas) };
}

function intersection(a, b, near) {
  const f = (near - a.z) / (b.z - a.z);
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    z: near,
    u: a.u + (b.u - a.u) * f,
    v: a.v + (b.v - a.v) * f,
  };
}

class SoftwareDisplay {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.transform = new T.Matrix4();
    this.geometry = new WeakMap();
    this.vertex = new T.Vector3();
    this.textures = new WeakMap();
  }
  setSize(width, height) {
    const scale = Math.min(1, 540 / Math.max(width, height));
    this.w = this.canvas.width = Math.max(1, Math.round(width * scale));
    this.h = this.canvas.height = Math.max(1, Math.round(height * scale));
    this.frame = this.ctx.createImageData(this.w, this.h);
    this.pixels = new Uint32Array(this.frame.data.buffer);
    this.depth = new Float32Array(this.pixels.length);
  }
  texture(material) {
    const map = material.map,
      img = map?.image;
    if (!img || !img.width || !img.height) return null;
    if (!this.textures.has(map)) {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      map.updateMatrix();
      this.textures.set(map, {
        w: img.width,
        h: img.height,
        flip: map.flipY,
        uv: map.matrix.elements,
        pixels: new Uint32Array(data.data.buffer),
      });
    }
    return this.textures.get(map);
  }
  drawTriangle(a, b, c, color, texture, doubleSided) {
    const { w, h, projection: m } = this;
    const az = 1 / a.z,
      bz = 1 / b.z,
      cz = 1 / c.z;
    const ax = (m[0] * a.x * az - m[8] + 1) * w * 0.5,
      ay = (1 + m[9] - m[5] * a.y * az) * h * 0.5;
    const bx = (m[0] * b.x * bz - m[8] + 1) * w * 0.5,
      by = (1 + m[9] - m[5] * b.y * bz) * h * 0.5;
    const cx = (m[0] * c.x * cz - m[8] + 1) * w * 0.5,
      cy = (1 + m[9] - m[5] * c.y * cz) * h * 0.5;
    const dx1 = bx - ax,
      dy1 = by - ay,
      dx2 = cx - ax,
      dy2 = cy - ay,
      area = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(area) < 0.02 || (!doubleSided && area > 0)) return;
    const x0 = Math.max(0, Math.ceil(Math.min(ax, bx, cx) - 0.5)),
      x1 = Math.min(w - 1, Math.floor(Math.max(ax, bx, cx) - 0.5));
    const y0 = Math.max(0, Math.ceil(Math.min(ay, by, cy) - 0.5)),
      y1 = Math.min(h - 1, Math.floor(Math.max(ay, by, cy) - 0.5));
    if (x0 > x1 || y0 > y1) return;
    const du = dy2 / area,
      dv = -dy1 / area;
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - ay,
        dx = x0 + 0.5 - ax;
      let u = (dx * dy2 - dy * dx2) / area,
        v = (dy * dx1 - dx * dy1) / area;
      for (let x = x0, i = y * w + x; x <= x1; x++, i++, u += du, v += dv) {
        if (u < 0 || v < 0 || u + v > 1) continue;
        const t = 1 - u - v,
          z = t * az + u * bz + v * cz;
        if (z <= this.depth[i]) continue;
        this.depth[i] = z;
        if (texture) {
          const s = (t * a.u * az + u * b.u * bz + v * c.u * cz) / z;
          const r = (t * a.v * az + u * b.v * bz + v * c.v * cz) / z;
          const uv = texture.uv;
          const mapX = uv[0] * s + uv[3] * r + uv[6],
            mapY = uv[1] * s + uv[4] * r + uv[7];
          const tx = Math.max(0, Math.min(texture.w - 1, Math.floor(mapX * texture.w)));
          const ty = Math.max(
            0,
            Math.min(texture.h - 1, Math.floor((texture.flip ? 1 - mapY : mapY) * texture.h)),
          );
          this.pixels[i] = texture.pixels[ty * texture.w + tx];
        } else this.pixels[i] = color;
      }
    }
  }
  drawMesh(mesh, cam) {
    if (!mesh.isMesh || mesh.material.isShaderMaterial) return;
    const geo = mesh.geometry,
      material = mesh.material;
    const xyz = geo.attributes.position,
      uv = geo.attributes.uv,
      indices = geo.index?.array;
    let cache = this.geometry.get(geo);
    if (!cache) {
      const points = Array.from({ length: xyz.count }, (_, i) => ({
        x: 0,
        y: 0,
        z: 0,
        u: uv?.getX(i) || 0,
        v: uv?.getY(i) || 0,
      }));
      cache = { points, shades: [] };
      this.geometry.set(geo, cache);
      const normal = geo.attributes.normal;
      for (let i = 0; i < (indices?.length ?? xyz.count); i += 3) {
        const j = indices ? indices[i] : i;
        cache.shades.push(
          normal
            ? Math.round(13 + 7 * (0.45 * normal.getX(j) + 0.8 * normal.getY(j) + 0.35 * normal.getZ(j)))
            : 16,
        );
      }
    }
    const m = this.transform.multiplyMatrices(cam.matrixWorldInverse, mesh.matrixWorld).elements;
    let visible = false;
    for (let i = 0; i < xyz.count; i++) {
      const vertex = mesh.isSkinnedMesh
        ? mesh.getVertexPosition(i, this.vertex)
        : this.vertex.fromBufferAttribute(xyz, i);
      const { x, y, z } = vertex,
        p = cache.points[i];
      p.x = m[0] * x + m[4] * y + m[8] * z + m[12];
      p.y = m[1] * x + m[5] * y + m[9] * z + m[13];
      p.z = -(m[2] * x + m[6] * y + m[10] * z + m[14]);
      if (p.z >= cam.near) visible = true;
    }
    if (!visible) return;
    const hex = material.color.getHex(),
      tex = this.texture(material),
      two = material.side === T.DoubleSide;
    for (let i = 0; i < (indices?.length ?? xyz.count); i += 3) {
      const a = cache.points[indices ? indices[i] : i],
        b = cache.points[indices ? indices[i + 1] : i + 1],
        c = cache.points[indices ? indices[i + 2] : i + 2];
      if (Math.max(a.z, b.z, c.z) < cam.near || Math.min(a.z, b.z, c.z) > cam.far) continue;
      const light = material.isMeshBasicMaterial ? 1 : cache.shades[i / 3] / 17;
      const red = Math.min(255, (hex >> 16) * light) | 0,
        green = Math.min(255, ((hex >> 8) & 255) * light) | 0,
        blue = Math.min(255, (hex & 255) * light) | 0;
      const color = (0xff000000 | (blue << 16) | (green << 8) | red) >>> 0;
      if (Math.min(a.z, b.z, c.z) >= cam.near) {
        this.drawTriangle(a, b, c, color, tex, two);
        continue;
      }
      const clipped = [];
      let prev = c;
      for (const next of [a, b, c]) {
        if (prev.z >= cam.near !== next.z >= cam.near) clipped.push(intersection(prev, next, cam.near));
        if (next.z >= cam.near) clipped.push(next);
        prev = next;
      }
      for (let j = 1; j < clipped.length - 1; j++)
        this.drawTriangle(clipped[0], clipped[j], clipped[j + 1], color, tex, two);
    }
  }
  render(scene, cam) {
    scene.updateMatrixWorld();
    cam.updateMatrixWorld();
    this.projection = cam.projectionMatrix.elements;
    this.depth.fill(0);
    for (let y = 0; y < this.h; y++) {
      const k = y / this.h,
        red = Math.round(27 + 166 * k),
        green = Math.round(54 + 87 * k),
        blue = Math.round(83 + 29 * k);
      this.pixels.fill((0xff000000 | (blue << 16) | (green << 8) | red) >>> 0, y * this.w, (y + 1) * this.w);
    }
    scene.traverseVisible((mesh) => this.drawMesh(mesh, cam));
    this.ctx.putImageData(this.frame, 0, 0);
  }
}
