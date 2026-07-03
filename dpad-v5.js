(() => {
  'use strict';

  const buttons = [...document.querySelectorAll('.dpad-button[data-code]')];
  if (!buttons.length) return;

  const activePointers = new Map();

  const keyNames = {
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
  };

  function dispatchKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, {
      key: keyNames[code] || code,
      code,
      bubbles: true,
      cancelable: true,
    }));
  }

  function press(button, pointerId) {
    const code = button.dataset.code;
    if (!code) return;

    activePointers.set(pointerId, { button, code });
    button.classList.add('is-held');
    dispatchKey('keydown', code);
    navigator.vibrate?.(8);
  }

  function release(pointerId) {
    const active = activePointers.get(pointerId);
    if (!active) return;

    dispatchKey('keyup', active.code);
    active.button.classList.remove('is-held');
    activePointers.delete(pointerId);
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
  }

  window.addEventListener('blur', releaseAll);
  window.addEventListener('pagehide', releaseAll);
  window.addEventListener('orientationchange', releaseAll);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) releaseAll();
  });
})();
