// Mobile Safari does not handle all synthetic arrow-key events consistently.
// Install a tiny input bridge before loading the original game module.
window.mobileMovement = window.mobileMovement || { x: 0, z: 0 };

const nativeSetHas = Set.prototype.has;

Set.prototype.has = function patchedSetHas(value) {
  const input = window.mobileMovement || { x: 0, z: 0 };
  const x = Number(input.x) || 0;
  const z = Number(input.z) || 0;
  const deadZone = 0.22;

  if (value === 'ArrowLeft' && x < -deadZone) return true;
  if (value === 'ArrowRight' && x > deadZone) return true;
  if (value === 'ArrowUp' && z < -deadZone) return true;
  if (value === 'ArrowDown' && z > deadZone) return true;

  return nativeSetHas.call(this, value);
};

import('./game.js?v=5').catch((error) => {
  console.error('Unable to load Jumping High 2.0:', error);
  const message = document.querySelector('#mobile-message');
  if (message) {
    message.textContent = '遊戲載入失敗，請重新整理頁面。';
    message.classList.add('show');
  }
});
