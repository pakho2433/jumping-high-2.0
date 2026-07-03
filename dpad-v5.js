(() => {
  'use strict';

  window.mobileMovement = window.mobileMovement || { x: 0, z: 0 };

  // Mobile version is now horizontal only. The player stays on the central Z lane.
  if (!window.__jumpingHighHorizontalInputBridge) {
    window.__jumpingHighHorizontalInputBridge = true;
    const nativeSetHas = Set.prototype.has;

    Set.prototype.has = function jumpingHighHorizontalSetHas(value) {
      const x = Number(window.mobileMovement?.x) || 0;
      const deadZone = 0.12;

      if (value === 'ArrowLeft' && x < -deadZone) return true;
      if (value === 'ArrowRight' && x > deadZone) return true;

      return nativeSetHas.call(this, value);
    };
  }

  const buttons = [...document.querySelectorAll('.dpad-button[data-code]')]
    .filter((button) => ['ArrowLeft', 'ArrowRight'].includes(button.dataset.code));

  if (!buttons.length) return;

  const activePointers = new Map();
  const activeCodes = Object.create(null);

  function updateMovement() {
    let x = 0;
    if (activeCodes.ArrowLeft) x -= 1;
    if (activeCodes.ArrowRight) x += 1;

    window.mobileMovement.x = x;
    window.mobileMovement.z = 0;
  }

  function press(button, pointerId) {
    const code = button.dataset.code;
    if (!code) return;

    activePointers.set(pointerId, { button, code });
    activeCodes[code] = (activeCodes[code] || 0) + 1;
    button.classList.add('is-held');
    updateMovement();
    navigator.vibrate?.(10);
  }

  function release(pointerId) {
    const active = activePointers.get(pointerId);
    if (!active) return;

    active.button.classList.remove('is-held');
    activePointers.delete(pointerId);
    activeCodes[active.code] = Math.max(0, (activeCodes[active.code] || 0) - 1);
    updateMovement();
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
    activeCodes.ArrowLeft = 0;
    activeCodes.ArrowRight = 0;
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
