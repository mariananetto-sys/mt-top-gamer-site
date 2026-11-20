export function controls(canvas, { active, action, pause, turn }) {
  const keys = new Set(),
    stick = { x: 0, y: 0 };
  const pad = document.getElementById('stick'),
    thumb = pad.firstElementChild;
  let drag = null,
    firing = false;
  const isTouch = matchMedia('(pointer:coarse)').matches;
  const bindings = { KeyE: 'use', KeyQ: 'skill', KeyC: 'camera', KeyR: 'reload' };
  function lock() {
    if (!isTouch) canvas.requestPointerLock?.()?.catch?.(() => {});
  }
  function resetStick() {
    stick.x = stick.y = 0;
    thumb.style.transform = '';
  }
  function reset() {
    keys.clear();
    firing = false;
    drag = null;
    resetStick();
  }
  window.addEventListener('keydown', (e) => {
    if (!active()) return;
    keys.add(e.code);
    if (e.repeat) return;
    if (e.code === 'Escape') pause();
    else if (bindings[e.code]) action(bindings[e.code]);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', reset);
  canvas.onpointerdown = (e) => {
    if (!active() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (document.pointerLockElement !== canvas) canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'mouse') {
      lock();
      firing = true;
    } else drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  window.addEventListener('pointermove', (e) => {
    if (!active()) return;
    if (e.pointerType === 'mouse' && (document.pointerLockElement === canvas || e.buttons === 1))
      turn(e.movementX, e.movementY);
    else if (drag?.id === e.pointerId && e.target === canvas) {
      turn(e.clientX - drag.x, e.clientY - drag.y);
      drag.x = e.clientX;
      drag.y = e.clientY;
    }
  });
  canvas.onpointerup = canvas.onpointercancel = () => {
    firing = false;
    drag = null;
  };
  function joystick(e) {
    const r = pad.getBoundingClientRect(),
      x = (e.clientX - r.left - r.width / 2) / 35,
      y = (e.clientY - r.top - r.height / 2) / 35,
      n = Math.max(1, Math.hypot(x, y));
    stick.x = x / n;
    stick.y = y / n;
    thumb.style.transform = 'translate(' + stick.x * 25 + 'px,' + stick.y * 25 + 'px)';
  }
  pad.onpointerdown = (e) => {
    pad.setPointerCapture(e.pointerId);
    joystick(e);
  };
  pad.onpointermove = (e) => {
    if (pad.hasPointerCapture(e.pointerId)) joystick(e);
  };
  pad.onpointerup = pad.onpointercancel = resetStick;
  document.querySelectorAll('[data-action]').forEach((button) => {
    button.onpointerdown = (e) => {
      if (!active()) return;
      button.setPointerCapture(e.pointerId);
      if (button.dataset.action === 'fire') firing = true;
      else action(button.dataset.action);
    };
    button.onpointerup = button.onpointercancel = () => {
      if (button.dataset.action === 'fire') firing = false;
    };
  });
  return {
    lock,
    reset,
    isTouch,
    get firing() {
      return firing;
    },
    get forward() {
      return Number(keys.has('KeyW')) - Number(keys.has('KeyS')) - stick.y;
    },
    get right() {
      return Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + stick.x;
    },
  };
}
