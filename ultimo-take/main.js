import { THREE as T, v } from './geometry.js';
import { cast, guns, missions, progress, weaponLimit, complete } from './campaign.js';
import { studio, station, person, drone, weapon, obstacles } from './art.js';
import { createDisplay } from './display.js';
const $ = (id) => document.getElementById(id);
const { canvas, renderer } = createDisplay($('world'));
const scene = new T.Scene(),
  cam = new T.PerspectiveCamera(62, 1, 0.06, 105);
scene.background = new T.Color(0xc5b9a9);
scene.fog = new T.FogExp2(0xbac2bb, 0.019);
scene.add(new T.HemisphereLight(0xffe8bd, 0x718b9c, 2.1), cam);
const sun = new T.DirectionalLight(0xffdfb2, 2.55);
sun.position.set(-6, 11, 8);
scene.add(sun);
const rim = new T.DirectionalLight(0x71dcff, 1.4);
rim.position.set(7, 5, -8);
scene.add(rim);
const sky = new T.Mesh(
  new T.SphereGeometry(85, 28, 14),
  new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    vertexShader:
      'varying vec3 skyDir;void main(){skyDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:
      'varying vec3 skyDir;void main(){vec3 d=normalize(skyDir);float h=smoothstep(-0.10,.72,d.y);vec3 c=mix(vec3(.94,.72,.51),vec3(.27,.55,.65),h);float s=distance(d,normalize(vec3(-.49,.34,-1.)));c+=vec3(.20,.15,.09)*(1.-smoothstep(.045,.053,s));gl_FragColor=vec4(c,1.);}',
  }),
);
sky.renderOrder = -5;
scene.add(sky, studio());
// Models are rigid low-poly sculptures. Reuse their meshes and shapes across runs.
const models = new Map();
function model(id, gun) {
  const key = id + '-' + gun;
  if (!models.has(key)) models.set(key, person(id, gun));
  return models.get(key).clone();
}
const botTemplate = drone();
const markRing = new T.Mesh(
  new T.TorusGeometry(0.44, 0.035, 5, 18),
  new T.MeshBasicMaterial({ color: 0xffcc49 }),
);
markRing.position.y = 1.92;
markRing.rotation.x = Math.PI / 2;
markRing.name = 'mark';
markRing.visible = false;
botTemplate.add(markRing);
const hands = guns.map((_, i) => weapon(i));
hands.forEach((g) => {
  g.rotation.y = Math.PI;
  g.position.set(0.236, -0.208, -0.58);
  g.scale.setScalar(0.76);
  g.rotation.z = -0.055;
  cam.add(g);
});
const pedestal = new T.Mesh(
  new T.CylinderGeometry(1.35, 1.55, 0.17, 12),
  new T.MeshStandardMaterial({ color: 0x33474c }),
);
pedestal.position.set(0, 0.09, 6);
scene.add(pedestal);
const marker = new T.Group();
const halo = new T.Mesh(
  new T.TorusGeometry(0.73, 0.055, 6, 32),
  new T.MeshBasicMaterial({ color: 0xffb958 }),
);
halo.rotation.x = Math.PI / 2;
marker.add(halo);
const gem = new T.Mesh(new T.OctahedronGeometry(0.23), new T.MeshBasicMaterial({ color: 0xffc871 }));
gem.position.y = 1.75;
marker.add(gem);
scene.add(marker);
const shotGeo = new T.SphereGeometry(1, 7, 5),
  shotMats = ['#9cf5ff', '#ffc077', '#c397ff', '#ff7059'].map((color) => new T.MeshBasicMaterial({ color }));
const keys = new Set(),
  stick = { x: 0, y: 0 },
  touch = matchMedia('(pointer:coarse)').matches;
const modes = ['Primeira pessoa', 'Sobre o ombro', 'Vista de cima'];
let phase = 'lobby',
  done = progress(),
  selected = 0,
  mission = 0,
  ally = -1,
  gun = 0,
  hero,
  friend,
  preview;
let hp,
  partnerHP,
  yaw,
  pitch,
  view,
  step,
  hold,
  timer,
  spawnTime,
  fireTime,
  skillTime,
  allyTime,
  allySkill,
  shield,
  speed,
  marked,
  burst,
  burstTime,
  alarm;
const stations = new Map();
let activeStation;
let recoil = 0,
  bots = [],
  shots = [],
  firing = false,
  noticeTime = 0,
  clock = 0,
  last = performance.now(),
  audio;
const look = new T.Vector3(),
  direction = new T.Vector3(),
  pos = new T.Vector3(),
  ray = new T.Raycaster();
function tone(freq, end, length = 0.12, type = 'sine') {
  if (!audio) return;
  const o = audio.createOscillator(),
    g = audio.createGain(),
    now = audio.currentTime;
  o.type = type;
  o.frequency.setValueAtTime(freq, now);
  o.frequency.exponentialRampToValueAtTime(end, now + length);
  g.gain.setValueAtTime(0.055, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + length);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(now + length);
}
function message(s) {
  $('notice').textContent = s;
  noticeTime = 2.2;
}
function option(el, value, label, locked = false) {
  const o = new Option(label, value);
  o.disabled = locked;
  el.add(o);
}
function options() {
  const m = $('mission'),
    h = $('hero'),
    a = $('ally'),
    g = $('gun');
  for (const el of [m, h, a, g]) el.replaceChildren();
  missions.forEach(([name], i) => option(m, i, i + 1 + ' · ' + name + (i > done ? ' 🔒' : ''), i > done));
  cast.forEach(([name], i) => option(h, i, name + (i > done ? ' 🔒' : ''), i > done));
  option(a, -1, 'Solo');
  cast.forEach(([name], i) => {
    if (i <= done && i !== selected) option(a, i, name);
  });
  guns.forEach((s, i) => option(g, i, s + (i > weaponLimit(done) ? ' 🔒' : ''), i > weaponLimit(done)));
  if (ally === selected || ally > done) ally = -1;
  m.value = mission;
  h.value = selected;
  a.value = ally;
  g.value = gun;
  $('summary').textContent = missions[mission][1];
  $('role').textContent = cast[selected][1].toUpperCase();
  $('name').textContent = cast[selected][0];
  $('skill').textContent = cast[selected][2];
  $('portrait').hidden = selected !== 5;
  if (preview) scene.remove(preview);
  preview = model(selected, gun);
  preview.position.set(0, 0.18, 6);
  preview.rotation.y = 0.35;
  scene.add(preview);
}
$('mission').onchange = (e) => {
  mission = +e.target.value;
  options();
};
$('hero').onchange = (e) => {
  selected = +e.target.value;
  options();
};
$('ally').onchange = (e) => (ally = +e.target.value);
$('gun').onchange = (e) => {
  gun = +e.target.value;
  options();
};
function clearRun() {
  for (const o of [hero, friend, ...bots.map((b) => b.mesh), ...shots.map((s) => s.mesh)])
    if (o) scene.remove(o);
  bots = [];
  shots = [];
  friend = null;
}
function inputsOff() {
  keys.clear();
  firing = false;
  stick.x = stick.y = 0;
  $('stick').firstElementChild.style.transform = '';
}
function lock() {
  if (!touch) {
    const p = canvas.requestPointerLock?.();
    p?.catch?.(() => {});
  }
}
function start() {
  audio ??= new (window.AudioContext || window.webkitAudioContext)();
  audio.resume().catch(() => {});
  clearRun();
  inputsOff();
  phase = 'play';
  hero = model(selected, gun);
  hero.position.set(0, 0, 10);
  scene.add(hero);
  if (ally >= 0) {
    friend = model(ally, 0);
    friend.position.set(1.7, 0, 10);
    scene.add(friend);
  }
  hp = partnerHP = 100;
  yaw =
    pitch =
    view =
    step =
    hold =
    spawnTime =
    fireTime =
    skillTime =
    allyTime =
    allySkill =
    shield =
    speed =
    marked =
    burst =
    burstTime =
      0;
  timer = 0;
  alarm = 100;
  marker.visible = true;
  preview.visible = pedestal.visible = false;
  $('lobby').hidden = true;
  $('hud').hidden = false;
  message(cast[selected][0] + ' em missão');
  placeMarker();
  camera();
  tone(270, 510);
  lock();
}
function lobby() {
  document.exitPointerLock?.();
  phase = 'lobby';
  clearRun();
  inputsOff();
  marker.visible = false;
  pedestal.visible = true;
  hands.forEach((g) => (g.visible = false));
  $('panel').close();
  $('lobby').hidden = false;
  $('hud').hidden = true;
  options();
}
function panel(title, body, paused) {
  phase = paused ? 'pause' : 'result';
  inputsOff();
  document.exitPointerLock?.();
  $('panel').querySelector('h2').textContent = title;
  $('panel').querySelector('p').textContent = body;
  $('resume').hidden = !paused;
  $('panel').showModal();
}
function finish(win) {
  if (phase !== 'play') return;
  let msg = 'Volte à seleção para tentar novamente.';
  if (win) {
    const first = mission >= done;
    done = Math.max(done, complete(mission));
    msg = first
      ? 'Desbloqueado: ' +
        cast[mission + 1][0] +
        ([1, 3].includes(mission) ? ' e ' + guns[mission === 1 ? 1 : 2] : '') +
        '.'
      : 'Missão concluída pela equipe.';
    mission = Math.min(4, mission + 1);
    tone(420, 900, 0.35);
  }
  panel(win ? 'Missão concluída' : 'Missão encerrada', msg, false);
}
function pause() {
  if (phase === 'play') panel('Jogo pausado', missions[mission][0], true);
}
function resume() {
  if (phase !== 'pause') return;
  $('panel').close();
  phase = 'play';
  lock();
}
$('start').onclick = start;
$('pauseBtn').onclick = pause;
$('back').onclick = lobby;
$('resume').onclick = resume;
$('panel').oncancel = (e) => {
  e.preventDefault();
  if (phase === 'pause') resume();
};
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pause();
});
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && !touch) pause();
});
function blocked(x, z, r = 0.35) {
  return (
    Math.abs(x) > 13.8 - r ||
    Math.abs(z) > 13.8 - r ||
    obstacles.some(([a, b, w, d]) => Math.abs(x - a) < w / 2 + r && Math.abs(z - b) < d / 2 + r)
  );
}
function move(p, dx, dz) {
  if (!blocked(p.x + dx, p.z)) p.x += dx;
  if (!blocked(p.x, p.z + dz)) p.z += dz;
}
function clearLine(a, b) {
  const dist = a.distanceTo(b),
    n = Math.ceil(dist / 0.38);
  for (let i = 1; i < n; i++) {
    const k = i / n;
    if (blocked(a.x + (b.x - a.x) * k, a.z + (b.z - a.z) * k, 0.06)) return false;
  }
  return true;
}
function follow(entity, target, amount, stop) {
  const p = entity.position,
    dx = target.x - p.x,
    dz = target.z - p.z,
    d = Math.hypot(dx, dz);
  if (d < stop) return;
  const angle = Math.atan2(dx, dz);
  for (const offset of [0, 0.65, -0.65, 1.3, -1.3, 1.58, -1.58]) {
    const a = angle + offset,
      x = Math.sin(a),
      z = Math.cos(a);
    if (!blocked(p.x + x * 0.65, p.z + z * 0.65)) {
      move(p, x * amount, z * amount);
      entity.rotation.y = a;
      break;
    }
  }
}
function aim() {
  return direction.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
}
function camera() {
  cam.up.set(0, 1, 0);
  const p = hero.position;
  hero.visible = view !== 0;
  hands.forEach((g, i) => (g.visible = view === 0 && gun === i));
  if (view === 0) {
    cam.position.copy(p);
    cam.position.y = 1.94;
    cam.lookAt(look.copy(cam.position).add(aim()));
  }
  if (view === 1) {
    const back = v(Math.sin(yaw), 0, Math.cos(yaw)),
      right = v(Math.cos(yaw), 0, -Math.sin(yaw));
    cam.position.copy(p).addScaledVector(back, 3.4).addScaledVector(right, 0.75);
    cam.position.y = 2.65;
    cam.position.x = T.MathUtils.clamp(cam.position.x, -13.9, 13.9);
    cam.position.z = T.MathUtils.clamp(cam.position.z, -13.9, 13.9);
    cam.lookAt(
      look
        .copy(p)
        .add(v(0, 1.65, 0))
        .addScaledVector(aim(), 14),
    );
  }
  if (view === 2) {
    cam.position.copy(p).add(v(Math.sin(yaw) * 4.8, 10.8, Math.cos(yaw) * 4.8));
    cam.lookAt(look.copy(p).add(v(-Math.sin(yaw) * 4, 1, -Math.cos(yaw) * 4)));
  }
}
function shoot(origin, dir, type, enemy = false) {
  const mesh = new T.Mesh(shotGeo, shotMats[enemy ? 3 : type]);
  mesh.scale.setScalar(enemy ? 0.15 : type === 2 ? 0.23 : 0.11);
  mesh.position.copy(origin);
  scene.add(mesh);
  shots.push({ mesh, dir: dir.clone().normalize(), enemy, type, life: enemy ? 4 : 1.5 });
}
function fire() {
  recoil = 0.1;
  camera();
  cam.updateMatrixWorld();
  const origin = hero.position.clone().add(v(0, 1.37, 0));
  ray.setFromCamera({ x: 0, y: 0 }, cam);
  const target = ray.ray.at(30, new T.Vector3());
  if (view === 2) {
    ray.ray.intersectPlane(new T.Plane(v(0, 1, 0), -1.25), target);
  } else {
    let nearest = Infinity;
    for (const b of bots) {
      const hit = ray.ray.intersectSphere(
        new T.Sphere(b.mesh.position.clone().add(v(0, 1.25, 0)), 0.61),
        new T.Vector3(),
      );
      if (hit && cam.position.distanceTo(hit) < nearest) {
        target.copy(hit);
        nearest = cam.position.distanceTo(hit);
      }
    }
  }
  shoot(origin, target.sub(origin), gun);
  tone([490, 700, 175][gun], [160, 280, 58][gun], 0.11, gun === 2 ? 'triangle' : 'square');
}
function damageBot(b, damage) {
  b.hp -= damage * (marked > 0 ? 1.6 : 1);
  if (b.hp <= 0) {
    scene.remove(b.mesh);
    bots.splice(bots.indexOf(b), 1);
  }
  tone(135, 74, 0.06);
}
function ability(id, actor) {
  if (id === 0) {
    for (const b of [...bots]) if (actor.position.distanceTo(b.mesh.position) < 6) damageBot(b, 40);
  }
  if (id === 1) shield = 5;
  if (id === 2) {
    hp = Math.min(100, hp + 35);
    partnerHP = Math.min(100, partnerHP + 35);
  }
  if (id === 3) speed = 5;
  if (id === 4) {
    for (const s of shots.filter((s) => s.enemy)) scene.remove(s.mesh);
    shots = shots.filter((s) => !s.enemy);
  }
  if (id === 5) marked = 6;
  message(id === 4 ? 'Jackson: Zubba lorpi!' : cast[id][0] + ' · ' + cast[id][2]);
  tone(380, 730, 0.22);
}
function action(s) {
  if (phase !== 'play') return;
  if (s === 'camera') {
    view = (view + 1) % 3;
    pitch = 0;
    camera();
  }
  if (s === 'skill' && skillTime <= 0) {
    ability(selected, hero);
    skillTime = 10;
  }
  if (s === 'use') use();
}
const objectives = () => missions[mission][2];
function placeMarker() {
  const [, x, z] = objectives()[step],
    key = mission + '-' + step;
  if (activeStation) marker.remove(activeStation);
  if (!stations.has(key)) stations.set(key, station(mission, step));
  activeStation = stations.get(key);
  const meter = activeStation.getObjectByName('exportProgress');
  if (meter) meter.visible = false;
  marker.add(activeStation);
  marker.position.set(x, 0.08, z);
}
function use() {
  if (hold > 0) return;
  if (hero.position.distanceTo(marker.position) > 2.3) {
    message('Aproxime-se do marcador');
    return;
  }
  tone(420, 650);
  if (step + 1 === objectives().length) {
    if (mission >= 3) {
      hold = mission === 4 ? 20 : 13;
      alarm = 100;
    } else finish(true);
  } else {
    step++;
    placeMarker();
    if (mission === 2) timer = 24;
  }
}
function spawn() {
  const points = [
      [-11, -10],
      [11, -11],
      [-12, 8],
      [12, 9],
      [1, -12],
    ],
    choices = points.filter(([x, z]) => Math.hypot(hero.position.x - x, hero.position.z - z) > 6);
  const [x, z] = choices[Math.floor(Math.random() * choices.length)];
  const mesh = botTemplate.clone();
  mesh.position.set(x, 0, z);
  scene.add(mesh);
  bots.push({ mesh, hp: mission > 2 ? 55 : 42, cd: 1.6 });
}
function tick(dt) {
  const p = hero.position,
    forward = Number(keys.has('KeyW')) - Number(keys.has('KeyS')) - stick.y,
    right = Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + stick.x;
  const amount = ((speed > 0 ? 7.3 : 4.65) * dt) / Math.max(1, Math.hypot(forward, right));
  move(
    p,
    (right * Math.cos(yaw) - forward * Math.sin(yaw)) * amount,
    (-forward * Math.cos(yaw) - right * Math.sin(yaw)) * amount,
  );
  hero.rotation.y = Math.PI + yaw;
  hero.position.y = forward || right ? 0.032 * Math.abs(Math.sin(clock * 11)) : 0;
  recoil = Math.max(0, recoil - dt);
  hands[gun].position.z = -0.58 + recoil * 0.54;
  hands[gun].rotation.x = -recoil * 0.55;
  camera();
  skillTime -= dt;
  shield -= dt;
  speed -= dt;
  marked -= dt;
  fireTime -= dt;
  burstTime -= dt;
  spawnTime -= dt;
  allyTime -= dt;
  allySkill -= dt;
  noticeTime -= dt;
  if (noticeTime <= 0) $('notice').textContent = '';
  if (firing && fireTime <= 0) {
    fireTime = [0.28, 0.55, 0.7][gun];
    burst = gun === 1 ? 3 : 1;
    burstTime = 0;
  }
  if (burst && burstTime <= 0) {
    fire();
    burst--;
    burstTime = 0.085;
  }
  if (spawnTime <= 0 && bots.length < 5) {
    spawn();
    spawnTime = hold > 0 ? 3 : 5;
  }
  if (friend && partnerHP > 0) {
    follow(friend, p, dt * 4.3, 1.85);
    const target = bots
      .filter((b) => clearLine(friend.position, b.mesh.position))
      .sort(
        (a, b) =>
          friend.position.distanceToSquared(a.mesh.position) -
          friend.position.distanceToSquared(b.mesh.position),
      )[0];
    if (target && allyTime <= 0) {
      const from = friend.position.clone().add(v(0, 1.27, 0)),
        dir = target.mesh.position
          .clone()
          .add(v(0, 1.24, 0))
          .sub(from);
      friend.rotation.y = Math.atan2(dir.x, dir.z);
      shoot(from, dir, 0);
      allyTime = 1.35;
    }
    if (target && allySkill <= 0 && (ally !== 2 || Math.min(hp, partnerHP) < 82)) {
      ability(ally, friend);
      allySkill = 14;
    }
  }
  for (const b of bots) {
    const target =
      hold > 0
        ? marker.position
        : friend &&
            partnerHP > 0 &&
            friend.position.distanceTo(b.mesh.position) < p.distanceTo(b.mesh.position)
          ? friend.position
          : p;
    follow(b.mesh, target, dt * 1.35, 4);
    b.mesh.rotation.y = Math.atan2(target.x - b.mesh.position.x, target.z - b.mesh.position.z);
    b.mesh.position.y = 0.06 * Math.sin(clock * 3 + b.mesh.id);
    b.mesh.getObjectByName('mark').visible = marked > 0;
    b.cd -= dt;
    if (b.cd <= 0 && b.mesh.position.distanceTo(target) < 14 && clearLine(b.mesh.position, target)) {
      const from = b.mesh.position.clone().add(v(0, 1.2, 0));
      shoot(
        from,
        target
          .clone()
          .add(v(0, 1.18, 0))
          .sub(from),
        0,
        true,
      );
      b.cd = 2.5;
    }
  }
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i],
      at = s.mesh.position;
    s.life -= dt;
    const dist = dt * (s.enemy ? 5.1 : 24),
      n = Math.ceil(dist / 0.22);
    for (let k = 0; k < n && s.life > 0; k++) {
      at.addScaledVector(s.dir, dist / n);
      if (
        at.y < 0 ||
        at.y > 7 ||
        (blocked(at.x, at.z, 0.05) && at.y < 1.5) ||
        Math.abs(at.x) > 14 ||
        Math.abs(at.z) > 14
      ) {
        s.life = 0;
        break;
      }
      if (s.enemy) {
        if (hold > 0 && at.distanceTo(pos.copy(marker.position).add(v(0, 1.18, 0))) < 0.8) {
          alarm -= 8;
          s.life = 0;
        } else if (at.distanceTo(pos.copy(p).add(v(0, 1.2, 0))) < 0.55) {
          if (shield <= 0) hp -= 8;
          s.life = 0;
        } else if (
          friend &&
          partnerHP > 0 &&
          at.distanceTo(pos.copy(friend.position).add(v(0, 1.2, 0))) < 0.55
        ) {
          if (shield <= 0) partnerHP -= 7;
          if (partnerHP <= 0) friend.visible = false;
          s.life = 0;
        }
      } else {
        const b = bots.find((b) => at.distanceTo(pos.copy(b.mesh.position).add(v(0, 1.23, 0))) < 0.66);
        if (b) {
          const center = b.mesh.position.clone();
          damageBot(b, [23, 13, 47][s.type]);
          if (s.type === 2)
            for (const other of [...bots])
              if (other !== b && other.mesh.position.distanceTo(center) < 2.7) damageBot(other, 25);
          s.life = 0;
        }
      }
    }
    if (s.life <= 0) {
      scene.remove(s.mesh);
      shots.splice(i, 1);
    }
  }
  if (hp <= 0 || alarm <= 0) {
    finish(false);
    return;
  }
  if (timer > 0 && (timer -= dt) <= 0) {
    finish(false);
    return;
  }
  if (hold > 0 && (hold -= dt) <= 0) {
    finish(true);
    return;
  }
  if (hold > 0) gem.scale.setScalar(0.65 + 0.2 * Math.sin(clock * 5));
  else gem.scale.setScalar(1);
  gem.rotation.y = clock * 2;
  gem.position.y = 1.75 + Math.sin(clock * 3) * 0.11;
  const d = p.distanceTo(marker.position),
    bearing = Math.atan2(marker.position.x - p.x, -(marker.position.z - p.z)) + yaw;
  $('chapter').textContent = 'MISSÃO ' + (mission + 1) + ' / ' + missions[mission][0];
  $('target').textContent =
    hold > 0
      ? (mission === 4 ? 'Proteja a exportação' : 'Proteja a transmissão') + ' · ' + Math.ceil(hold) + ' s'
      : objectives()[step][0];
  $('distance').textContent =
    hold > 0
      ? 'Integridade ' + Math.max(0, alarm) + '%'
      : (d < 2.3
          ? 'E / Usar'
          : ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'][(Math.round(bearing / (Math.PI / 4)) + 8) % 8] +
            ' ' +
            Math.round(d) +
            ' m') + (timer > 0 ? ' · ' + Math.ceil(timer) + ' s' : '');
  if (mission === 3 && !hold)
    $('distance').textContent += ' · Sinal ' + Math.round(100 / (1 + d * 0.12)) + '%';
  if (mission === 4 && hold > 0) {
    const fraction = 1 - hold / 20,
      meter = activeStation.getObjectByName('exportProgress');
    meter.visible = true;
    meter.scale.x = fraction;
    meter.position.x = -0.36 + 0.36 * fraction;
    $('distance').textContent += ' · Exportação ' + Math.floor(100 * fraction) + '%';
  }
  $('health').textContent =
    cast[selected][0] +
    ' · ' +
    Math.ceil(hp) +
    ' HP' +
    (friend ? '  |  ' + cast[ally][0] + ' ' + Math.max(0, Math.ceil(partnerHP)) + ' HP' : '');
  $('ability').textContent =
    'Q · ' + cast[selected][2] + (skillTime > 0 ? ' · ' + Math.ceil(skillTime) + ' s' : ' ✓');
  $('cameraLabel').textContent = 'C · ' + modes[view];
}
window.addEventListener('keydown', (e) => {
  if (phase !== 'play') return;
  keys.add(e.code);
  if (!e.repeat) {
    if (e.code === 'Escape') pause();
    action({ KeyE: 'use', KeyQ: 'skill', KeyC: 'camera' }[e.code]);
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
let drag = null;
canvas.onpointerdown = (e) => {
  if (phase !== 'play') return;
  if (document.pointerLockElement !== canvas) canvas.setPointerCapture(e.pointerId);
  if (e.pointerType === 'mouse') {
    lock();
    firing = true;
  } else drag = [e.clientX, e.clientY];
};
function turn(dx, dy) {
  yaw = (yaw - dx * 0.003) % (Math.PI * 2);
  pitch = T.MathUtils.clamp(pitch - dy * 0.003, -0.95, 0.9);
}
window.addEventListener('pointermove', (e) => {
  if (phase !== 'play') return;
  if (e.pointerType === 'mouse' && (document.pointerLockElement === canvas || e.buttons === 1))
    turn(e.movementX, e.movementY);
  else if (drag && e.target === canvas) {
    turn(e.clientX - drag[0], e.clientY - drag[1]);
    drag = [e.clientX, e.clientY];
  }
});
canvas.onpointerup = canvas.onpointercancel = () => {
  firing = false;
  drag = null;
};
const pad = $('stick');
function joystick(e) {
  const r = pad.getBoundingClientRect(),
    x = (e.clientX - r.left - r.width / 2) / 35,
    y = (e.clientY - r.top - r.height / 2) / 35,
    n = Math.max(1, Math.hypot(x, y));
  stick.x = x / n;
  stick.y = y / n;
  pad.firstElementChild.style.transform = 'translate(' + stick.x * 25 + 'px,' + stick.y * 25 + 'px)';
}
pad.onpointerdown = (e) => {
  pad.setPointerCapture(e.pointerId);
  joystick(e);
};
pad.onpointermove = (e) => {
  if (pad.hasPointerCapture(e.pointerId)) joystick(e);
};
pad.onpointerup = pad.onpointercancel = () => {
  stick.x = stick.y = 0;
  pad.firstElementChild.style.transform = '';
};
document.querySelectorAll('[data-action]').forEach((b) => {
  b.onpointerdown = (e) => {
    b.setPointerCapture(e.pointerId);
    if (b.dataset.action === 'fire') firing = true;
    else action(b.dataset.action);
  };
  b.onpointerup = b.onpointercancel = () => {
    if (b.dataset.action === 'fire') firing = false;
  };
});
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  cam.aspect = innerWidth / innerHeight;
  cam.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();
lobby();
$('start').textContent = 'INICIAR MISSÃO  →';
$('start').disabled = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  clock += dt;
  if (phase === 'play') tick(dt);
  if (phase === 'lobby') {
    cam.position.set(1.15, 1.56, 9.19);
    cam.lookAt(0, 1.37, 6);
    cam.setViewOffset(
      innerWidth,
      innerHeight,
      -innerWidth * (innerWidth < 650 ? 0.25 : 0.18),
      0,
      innerWidth,
      innerHeight,
    );
    preview.rotation.y = 0.4 + Math.sin(clock * 0.37) * 0.14;
  } else if (cam.view?.enabled) cam.clearViewOffset();
  renderer.render(scene, cam);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
