(() => {
  'use strict';

  window.mobileMovement = window.mobileMovement || { x: 0, z: 0 };

  const buttons = [...document.querySelectorAll('.dpad-button[data-code]')];
  if (!buttons.length) return;

  const activePointers = new Map();
  const activeCodes = new Set();

  function updateMovementVector() {
    let x = 0;
    let z = 0;

    if (activeCodes.has('ArrowLeft')) x -= 1;
    if (activeCodes.has('ArrowRight')) x += 1;
    if (activeCodes.has('ArrowUp')) z -= 1;
    if (activeCodes.has('ArrowDown')) z += 1;

    window.mobileMovement.x = x;
    window.mobileMovement.z = z;
  }

  function press(button, pointerId) {
    const code = button.dataset.code;
    if (!code) return;

    activePointers.set(pointerId, { button, code });
    activeCodes.add(code);
    button.classList.add('is-held');
    updateMovementVector();
    navigator.vibrate?.(8);
  }

  function release(pointerId) {
    const active = activePointers.get(pointerId);
    if (!active) return;

    active.button.classList.remove('is-held');
    activePointers.delete(pointerId);

    const codeStillHeld = [...activePointers.values()].some((item) => item.code === active.code);
    if (!codeStillHeld) activeCodes.delete(active.code);
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
    activeCodes.clear();
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
