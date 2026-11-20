import { THREE as T } from './geometry.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { clone as cloneSkeleton } from './vendor/SkeletonUtils.js';
import { detail, head, piping } from './face.js';
import { jackson } from './outfits.js';

const loader = new GLTFLoader();
const rigNames = ['Rogue_Hooded', 'Knight', 'Mage', 'Barbarian', null, 'Rogue'];
const weaponNames = ['blaster-b', 'blaster-f', 'blaster-r'];
const catalog = new Map();
let concrete, concreteNormal;

function image(name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Imagem indisponível: ' + name));
    img.src = new URL('./assets/' + name, import.meta.url).href;
  });
}

export async function loadArt() {
  await Promise.all([
    loader.loadAsync(new URL('./assets/models/kit.glb', import.meta.url).href).then(({ scene }) => {
      for (const model of scene.children) catalog.set(model.name, { scene: model });
    }),
    ...rigNames.filter(Boolean).map(async (name) => {
      const asset = await loader.loadAsync(new URL('./assets/cast/' + name + '.glb', import.meta.url).href);
      catalog.set(name, asset);
    }),
    image('surface/concrete.jpg').then((img) => {
      concrete = img;
    }),
    image('surface/concrete-normal.jpg').then((img) => {
      concreteNormal = img;
    }),
  ]);
}

export function surface() {
  return { concrete, concreteNormal };
}

const kitMaterials = new WeakMap();
function recolor(source, kind, accent = null) {
  if (!source.map) return source;
  let variants = kitMaterials.get(source);
  if (!variants) {
    variants = new Map();
    kitMaterials.set(source, variants);
  }
  const key = kind + ':' + accent;
  if (variants.has(key)) return variants.get(key);
  const image = source.map.image,
    canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height),
    data = imageData.data;
  const palette = accent ? new T.Color(accent).getRGB({}, T.SRGBColorSpace) : null;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2],
      l = r * 0.24 + g * 0.62 + b * 0.14;
    const saturated = Math.max(r, g, b) - Math.min(r, g, b) > 40;
    if (kind === 'weapon') {
      const amount = saturated ? 0.47 + l / 700 : 0;
      data[i] = saturated ? 255 * palette.r * amount : 24 + l * 0.29;
      data[i + 1] = saturated ? 255 * palette.g * amount : 35 + l * 0.33;
      data[i + 2] = saturated ? 255 * palette.b * amount : 44 + l * 0.37;
    } else if (saturated) {
      // Keep the warning panels and lamps distinct from matte structural material.
      data[i] = r * 0.61 + l * 0.21;
      data[i + 1] = g * 0.67 + l * 0.19;
      data[i + 2] = b * 0.74 + l * 0.16;
    } else {
      data[i] = 16 + l * 0.68;
      data[i + 1] = 28 + l * 0.68;
      data[i + 2] = 39 + l * 0.68;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.flipY = source.map.flipY;
  map.offset.copy(source.map.offset);
  map.repeat.copy(source.map.repeat);
  map.rotation = source.map.rotation;
  map.center.copy(source.map.center);
  map.wrapS = source.map.wrapS;
  map.wrapT = source.map.wrapT;
  const copy = source.clone();
  copy.map = map;
  copy.roughness = kind === 'weapon' ? 0.46 : 0.8;
  copy.metalness = 0.17;
  variants.set(key, copy);
  return copy;
}

export function prop(name, x = 0, y = 0, z = 0, width = null, height = null, depth = null, turn = 0) {
  const object = catalog.get(name).scene.clone(true);
  object.traverse((part) => {
    if (part.isMesh) part.material = recolor(part.material, 'architecture');
  });
  const bounds = new T.Box3().setFromObject(object),
    size = bounds.getSize(new T.Vector3()),
    center = bounds.getCenter(new T.Vector3());
  const base = new T.Group(),
    k = width ? width / size.x : 1;
  object.position.sub(center);
  object.position.y += size.y / 2;
  base.add(object);
  base.scale.set(k, height ? height / size.y : k, depth ? depth / size.z : k);
  base.rotation.y = turn;
  base.position.set(x, y, z);
  return base;
}

export function blaster(id, firstPerson = false) {
  const model = catalog.get(weaponNames[id]).scene.clone(true);
  model.traverse((part) => {
    if (part.isMesh) part.material = recolor(part.material, 'weapon', ['#64dfd4', '#ffa561', '#c0a8ff'][id]);
  });
  const bounds = new T.Box3().setFromObject(model),
    size = bounds.getSize(new T.Vector3());
  const scale = [0.5, 0.73, 0.7][id] / size.z;
  const shell = new T.Group();
  model.scale.setScalar(scale);
  // Kenney's forward axis faces -Z. Align the trigger near the actor's palm.
  model.rotation.y = Math.PI;
  model.position.set(0, firstPerson ? 0.025 : 0, firstPerson ? 0.075 : 0.12);
  shell.add(model);
  if (firstPerson) {
    const handY = [-0.131, -0.112, -0.123][id];
    detail(shell, '#34404a', 0.052, handY, -0.017, 0.064, 0.07, 0.093, 14);
    detail(shell, '#243342', 0.087, handY - 0.048, -0.102, 0.072, 0.071, 0.127, 14);
    for (let i = 0; i < 3; i++) {
      piping(
        shell,
        '#495762',
        [
          [0.066, handY - 0.035 + i * 0.025, 0.032],
          [0.021, handY - 0.033 + i * 0.025, 0.048],
          [-0.022, handY - 0.03 + i * 0.025, 0.031],
        ],
        0.013,
      );
    }
  }
  return shell;
}

const paints = [
  ['#2d343e', '#4d8da7', '#e17d42'],
  ['#3a5267', '#81bbe8', '#ececdb'],
  ['#534061', '#b37ae0', '#d7a455'],
  ['#53443a', '#e6a360', '#74bda8'],
  null,
  ['#253d45', '#46a09b', '#85cbd7'],
];
const suitMaps = new Map();
function suitMaterial(source, id, arms) {
  const key = id + ':' + arms;
  if (suitMaps.has(key)) return suitMaps.get(key);
  const sourceImage = source.map.image;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(sourceImage, 0, 0, 256, 256);
  const im = ctx.getImageData(0, 0, 256, 256);
  const colors = paints[id].map((hex) => new T.Color(hex).getRGB({}, T.SRGBColorSpace));
  for (let i = 0; i < im.data.length; i += 4) {
    const r = im.data[i],
      g = im.data[i + 1],
      b = im.data[i + 2],
      hi = Math.max(r, g, b),
      lo = Math.min(r, g, b);
    // Keep glove and face tones on exposed hands. Re-dye cloth and armor.
    if (arms && r > g * 1.18 && g > b * 1.14 && g > 88 && r > 131) continue;
    let colorIndex = hi - lo > 43 ? 1 : hi > 130 ? 2 : 0;
    if (id === 0 || id === 5) {
      colorIndex = hi - lo > 75 && g > b * 1.46 && r > g * 1.55 ? 2 : b > r * 1.28 && g > b * 1.04 ? 1 : 0;
    }
    const color = colors[colorIndex],
      light = 0.42 + hi / 300;
    im.data[i] = Math.min(255, color.r * 255 * light);
    im.data[i + 1] = Math.min(255, color.g * 255 * light);
    im.data[i + 2] = Math.min(255, color.b * 255 * light);
  }
  ctx.putImageData(im, 0, 0);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.flipY = false;
  const material = new T.MeshStandardMaterial({ map, roughness: 0.74, metalness: id === 1 ? 0.17 : 0.04 });
  suitMaps.set(key, material);
  return material;
}

export function createActor(id, gun) {
  const root = new T.Group(),
    weapon = blaster(gun);
  if (id === 4) {
    const legs = jackson(root);
    const hips = legs.map((leg, i) => {
      const h = new T.Group();
      h.position.set(i === 0 ? -0.146 : 0.146, 0.96, 0);
      leg.position.copy(h.position).negate();
      h.add(leg);
      root.add(h);
      return h;
    });
    weapon.position.set(0.13, 1.17, 0.5);
    root.add(weapon);
    let phase = 0;
    return {
      root,
      animate(dt, pace) {
        phase += dt * 11;
        const angle = Math.sin(phase) * 0.31 * pace;
        hips[0].rotation.x = angle;
        hips[1].rotation.x = -angle;
      },
      fire() {},
    };
  }
  const body = cloneSkeleton(catalog.get(rigNames[id]).scene);
  body.scale.set(1.065, 1.23, 1.07);
  root.add(body);
  body.traverse((o) => {
    if (o.isSkinnedMesh) {
      o.material = suitMaterial(o.material, id, /Arm/.test(o.name));
      o.frustumCulled = false;
    }
  });
  body.updateMatrixWorld(true);
  // Replace the stock head with the game's own likeness at the imported rig's neck.
  const skull = body.getObjectByName('head');
  const likeness = new T.Group();
  head(likeness, id);
  const face = likeness.children[0];
  face.position.set(0, 0.168, 0.018);
  face.scale.setScalar(1.02);
  skull.add(face);
  const left = body.getObjectByName('handl'),
    right = body.getObjectByName('handr');
  const leftPoint = new T.Vector3(),
    rightPoint = new T.Vector3(),
    axis = new T.Vector3(0, 0, 1),
    direction = new T.Vector3();
  root.add(weapon);
  weapon.scale.setScalar(1.02);
  function attachWeapon(pace) {
    root.updateMatrixWorld(true);
    root.worldToLocal(left.getWorldPosition(leftPoint));
    root.worldToLocal(right.getWorldPosition(rightPoint));
    // Aim the imported blaster between the hands in the ranged pose.
    // During locomotion it follows the right hand instead of cutting across the chest.
    weapon.position.copy(rightPoint);
    if (pace < 0.18) {
      weapon.position.lerp(leftPoint, 0.53);
      weapon.position.y += 0.038;
      direction.subVectors(leftPoint, rightPoint).normalize();
    } else {
      weapon.position.x += 0.023;
      weapon.position.y += 0.07;
      direction.set(0.12, 0.31, 0.94).normalize();
    }
    weapon.quaternion.setFromUnitVectors(axis, direction);
  }
  const mixer = new T.AnimationMixer(body),
    clips = catalog.get('Rogue_Hooded').animations;
  const clip = (name) => mixer.clipAction(T.AnimationClip.findByName(clips, name));
  const idle = clip('2H_Ranged_Aiming'),
    walk = clip('Walking_A'),
    run = clip('Running_A'),
    fire = clip('2H_Ranged_Shoot');
  idle.play();
  walk.play();
  run.play();
  let walkWeight = 0,
    runWeight = 0,
    shotTime = 0;
  function apply() {
    idle.setEffectiveWeight(Math.max(0, 1 - walkWeight - runWeight - shotTime));
    walk.setEffectiveWeight(walkWeight);
    run.setEffectiveWeight(runWeight);
    fire.setEffectiveWeight(shotTime);
  }
  apply();
  mixer.update(0);
  attachWeapon(0);
  return {
    root,
    animate(dt, pace) {
      const blend = Math.min(1, dt * 10),
        desiredWalk = pace > 0 && pace < 0.8 ? 1 : 0,
        desiredRun = pace >= 0.8 ? 1 : 0;
      walkWeight += (desiredWalk - walkWeight) * blend;
      runWeight += (desiredRun - runWeight) * blend;
      shotTime = Math.max(0, shotTime - dt * 5);
      apply();
      mixer.update(dt);
      attachWeapon(walkWeight + runWeight);
    },
    fire() {
      if (walkWeight + runWeight < 0.25) {
        shotTime = 0.9;
        fire.reset().play();
      }
    },
  };
}
