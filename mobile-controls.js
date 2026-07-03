(() => {
  'use strict';

  // Offline caching previously caused iPhone/iPad to keep an obsolete interface.
  // Remove old service workers and caches so classroom devices always receive updates.
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
  }
  if ('caches' in window) {
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('jumping-high-2-')).map((key) => caches.delete(key))))
      .catch(() => {});
  }

  const touchDevice = navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  const body = document.body;
  const startScreen = document.querySelector('#start-screen');
  const endScreen = document.querySelector('#end-screen');
  const controls = document.querySelector('#mobile-controls');
  const joystick = document.querySelector('#touch-joystick');
  const knob = document.querySelector('#joystick-knob');
  const jumpButton = document.querySelector('#touch-jump');
  const kickButton = document.querySelector('#touch-kick');
  const fullscreenButton = document.querySelector('#fullscreen-button');
  const mobileMessage = document.querySelector('#mobile-message');
  const canvas = document.querySelector('#game-canvas');
  const progress = document.querySelector('#progress');

  if (!touchDevice || !controls || !joystick || !knob || !jumpButton || !kickButton || !canvas) return;

  body.classList.add('touch-device');

  const pressedCodes = new Set();
  let joystickPointerId = null;
  let messageTimer = null;

  const keyNames = {
    ArrowLeft: 'ArrowLeft',
    ArrowRight: 'ArrowRight',
    ArrowUp: 'ArrowUp',
    ArrowDown: 'ArrowDown',
    Space: ' ',
  };

  function dispatchKey(type, code) {
    window.dispatchEvent(new KeyboardEvent(type, {
      key: keyNames[code] || code,
      code,
      bubbles: true,
      cancelable: true,
    }));
  }

  function setPressedCodes(nextCodes) {
    for (const code of pressedCodes) {
      if (!nextCodes.has(code)) {
        dispatchKey('keyup', code);
        pressedCodes.delete(code);
      }
    }

    for (const code of nextCodes) {
      if (!pressedCodes.has(code)) {
        dispatchKey('keydown', code);
        pressedCodes.add(code);
      }
    }
  }

  function resetJoystick() {
    setPressedCodes(new Set());
    knob.style.transform = 'translate(-50%, -50%)';
    joystickPointerId = null;
  }

  function updateJoystick(clientX, clientY) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rawX = clientX - centerX;
    const rawY = clientY - centerY;
    const maxTravel = rect.width * 0.28;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > maxTravel ? maxTravel / distance : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    const normalizedX = x / maxTravel;
    const normalizedY = y / maxTravel;

    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;

    const nextCodes = new Set();
    const threshold = 0.28;
    if (normalizedX < -threshold) nextCodes.add('ArrowLeft');
    if (normalizedX > threshold) nextCodes.add('ArrowRight');
    if (normalizedY < -threshold) nextCodes.add('ArrowUp');
    if (normalizedY > threshold) nextCodes.add('ArrowDown');
    setPressedCodes(nextCodes);
  }

  joystick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    joystickPointerId = event.pointerId;
    joystick.setPointerCapture?.(event.pointerId);
    updateJoystick(event.clientX, event.clientY);
    navigator.vibrate?.(10);
  }, { passive: false });

  joystick.addEventListener('pointermove', (event) => {
    if (event.pointerId !== joystickPointerId) return;
    event.preventDefault();
    updateJoystick(event.clientX, event.clientY);
  }, { passive: false });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((eventName) => {
    joystick.addEventListener(eventName, (event) => {
      if (joystickPointerId !== null && event.pointerId !== joystickPointerId && eventName !== 'lostpointercapture') return;
      event.preventDefault();
      resetJoystick();
    }, { passive: false });
  });

  jumpButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    jumpButton.classList.add('pressed');
    navigator.vibrate?.(18);
    dispatchKey('keydown', 'Space');
    window.setTimeout(() => dispatchKey('keyup', 'Space'), 70);
  }, { passive: false });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
    jumpButton.addEventListener(eventName, () => jumpButton.classList.remove('pressed'));
  });

  kickButton.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    kickButton.classList.add('pressed');
    navigator.vibrate?.([18, 30, 18]);
    autoKickVisibleTool();
  }, { passive: false });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach((eventName) => {
    kickButton.addEventListener(eventName, () => kickButton.classList.remove('pressed'));
  });

  function autoKickVisibleTool() {
    const rect = canvas.getBoundingClientRect();
    const questionNumber = Number.parseInt(progress?.textContent || '1', 10) || 1;
    const preferredX = questionNumber % 2 === 1
      ? [0.84, 0.76, 0.92]
      : [0.16, 0.24, 0.08];
    const oppositeX = questionNumber % 2 === 1
      ? [0.16, 0.24]
      : [0.84, 0.76];
    const xRatios = [...preferredX, ...oppositeX, 0.5, 0.34, 0.66];
    const yRatios = [0.48, 0.58, 0.38, 0.68, 0.78, 0.28];
    const PointerCtor = window.PointerEvent || window.MouseEvent;

    showMobileMessage('✨ 正在尋找附近的問號道具……');

    for (const xRatio of xRatios) {
      for (const yRatio of yRatios) {
        canvas.dispatchEvent(new PointerCtor('pointerdown', {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + rect.width * xRatio,
          clientY: rect.top + rect.height * yRatio,
          pointerType: 'touch',
          isPrimary: true,
        }));
      }
    }

    window.setTimeout(() => {
      showMobileMessage('如未踢中，請先走近紫色「?」道具，再按一次「踢道具」。');
    }, 650);
  }

  fullscreenButton?.addEventListener('pointerdown', async (event) => {
    event.preventDefault();
    const target = document.documentElement;
    const requestFullscreen = target.requestFullscreen || target.webkitRequestFullscreen;

    if (!requestFullscreen) {
      showMobileMessage('iPhone Safari：按「分享」→「加入主畫面」，即可用接近全螢幕方式遊玩。');
      return;
    }

    try {
      await requestFullscreen.call(target);
    } catch {
      showMobileMessage('未能進入全螢幕。可在 Safari 按「分享」→「加入主畫面」。');
    }
  }, { passive: false });

  function showMobileMessage(message) {
    if (!mobileMessage) return;
    window.clearTimeout(messageTimer);
    mobileMessage.textContent = message;
    mobileMessage.classList.add('show');
    messageTimer = window.setTimeout(() => mobileMessage.classList.remove('show'), 2500);
  }

  function syncGameState() {
    const running = !startScreen?.classList.contains('active') && !endScreen?.classList.contains('active');
    body.classList.toggle('game-running', running);
    controls.classList.toggle('hidden', !running);
    fullscreenButton?.classList.toggle('hidden', !running);

    if (running) {
      document.activeElement?.blur?.();
      window.scrollTo(0, 0);
    } else {
      resetJoystick();
    }
  }

  const observer = new MutationObserver(syncGameState);
  if (startScreen) observer.observe(startScreen, { attributes: true, attributeFilter: ['class'] });
  if (endScreen) observer.observe(endScreen, { attributes: true, attributeFilter: ['class'] });

  window.addEventListener('blur', resetJoystick);
  window.addEventListener('pagehide', resetJoystick);
  window.addEventListener('orientationchange', () => {
    resetJoystick();
    window.setTimeout(() => window.scrollTo(0, 0), 180);
  });

  document.addEventListener('contextmenu', (event) => {
    if (body.classList.contains('game-running')) event.preventDefault();
  });

  syncGameState();
})();
