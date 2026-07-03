(() => {
  'use strict';

  window.mobileMovement = window.mobileMovement || { x: 0, z: 0 };

  // Bridge the direct mobile vector into the original game's keys.has(...) checks.
  // This works every animation frame and avoids unreliable synthetic ArrowUp/ArrowDown events on iOS.
  if (!window.__jumpingHighDirectInputBridge) {
    window.__jumpingHighDirectInputBridge = true;
    const nativeSetHas = Set.prototype.has;

    Set.prototype.has = function jumpingHighPatchedSetHas(value) {
      const input = window.mobileMovement || { x: 0, z: 0 };
      const x = Number(input.x) || 0;
      const z = Number(input.z) || 0;
      const deadZone = 0.18;

      if (value === 'ArrowLeft' && x < -deadZone) return true;
      if (value === 'ArrowRight' && x > deadZone) return true;
      if (value === 'ArrowUp' && z < -deadZone) return true;
      if (value === 'ArrowDown' && z > deadZone) return true;

      return nativeSetHas.call(this, value);
    };
  }

  const buttons = [...document.querySelectorAll('.dpad-button[data-code]')];
  if (!buttons.length) return;

  const activePointers = new Map();
  const activeCodes = Object.create(null);

  function updateMovementVector() {
    let x = 0;
    let z = 0;

    if (activeCodes.ArrowLeft) x -= 1;
    if (activeCodes.ArrowRight) x += 1;
    if (activeCodes.ArrowUp) z -= 1;
    if (activeCodes.ArrowDown) z += 1;

    window.mobileMovement.x = x;
    window.mobileMovement.z = z;
  }

  function press(button, pointerId) {
    const code = button.dataset.code;
    if (!code) return;

    activePointers.set(pointerId, { button, code });
    activeCodes[code] = (activeCodes[code] || 0) + 1;
    button.classList.add('is-held');
    updateMovementVector();
    navigator.vibrate?.(8);
  }

  function release(pointerId) {
    const active = activePointers.get(pointerId);
    if (!active) return;

    active.button.classList.remove('is-held');
    activePointers.delete(pointerId);

    activeCodes[active.code] = Math.max(0, (activeCodes[active.code] || 0) - 1);
    updateMovementVector();
  }

  buttons.forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.setPointerCapture?.(event.pointerId);
      press(button, event.pointerId);
    }, { passive: false });

    ['pointerup', 'pointercancel', 'lostpointercapture', 'pointerleave'].forEach((eventName) => {
      button.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
        release(event.pointerId);
      }, { passive: false });
    });
  });

  function releaseAll() {
    [...activePointers.keys()].forEach(release);
    Object.keys(activeCodes).forEach((code) => { activeCodes[code] = 0; });
    window.mobileMovement.x = 0;
    window.mobileMovement.z = 0;
  }

  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  window.addEventListener('orientationchange', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });
})();
