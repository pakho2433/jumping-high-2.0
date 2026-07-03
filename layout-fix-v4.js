(() => {
  'use strict';

  const panel = document.querySelector('#question-panel');
  const chip = document.querySelector('#question-number');
  const title = document.querySelector('#question-text');
  const subtitle = panel?.querySelector('p');

  if (!panel || !chip || !title) return;

  const setImportant = (element, property, value) => {
    element.style.setProperty(property, value, 'important');
  };

  function applyCompactQuestionLayout() {
    const landscape = window.innerWidth > window.innerHeight;
    const shortScreen = window.innerHeight <= 820;

    if (!landscape || !shortScreen) return;

    const veryShort = window.innerHeight <= 430;
    const availableWidth = Math.max(280, window.innerWidth - (veryShort ? 390 : 300));
    const targetWidth = Math.min(veryShort ? 470 : 560, Math.max(280, availableWidth * 0.62));

    setImportant(panel, 'top', veryShort ? '42px' : '54px');
    setImportant(panel, 'left', '50%');
    setImportant(panel, 'right', 'auto');
    setImportant(panel, 'bottom', 'auto');
    setImportant(panel, 'display', 'grid');
    setImportant(panel, 'grid-template-columns', 'auto minmax(0, 1fr)');
    setImportant(panel, 'align-items', 'center');
    setImportant(panel, 'gap', veryShort ? '7px' : '9px');
    setImportant(panel, 'width', `${Math.round(targetWidth)}px`);
    setImportant(panel, 'max-width', 'calc(100vw - 280px)');
    setImportant(panel, 'min-width', veryShort ? '250px' : '280px');
    setImportant(panel, 'height', veryShort ? '44px' : '52px');
    setImportant(panel, 'min-height', '0');
    setImportant(panel, 'max-height', veryShort ? '44px' : '52px');
    setImportant(panel, 'padding', veryShort ? '4px 9px' : '5px 11px');
    setImportant(panel, 'border-radius', '12px');
    setImportant(panel, 'overflow', 'hidden');
    setImportant(panel, 'transform', 'translateX(-50%)');
    setImportant(panel, 'text-align', 'left');
    setImportant(panel, 'background', 'linear-gradient(135deg, rgba(42,23,103,.86), rgba(18,10,52,.78))');
    setImportant(panel, 'box-shadow', '0 8px 22px rgba(0,0,0,.22)');
    setImportant(panel, 'backdrop-filter', 'blur(8px)');

    setImportant(chip, 'display', 'inline-flex');
    setImportant(chip, 'align-items', 'center');
    setImportant(chip, 'justify-content', 'center');
    setImportant(chip, 'margin', '0');
    setImportant(chip, 'padding', veryShort ? '3px 7px' : '4px 8px');
    setImportant(chip, 'font-size', veryShort ? '.5rem' : '.57rem');
    setImportant(chip, 'line-height', '1');
    setImportant(chip, 'white-space', 'nowrap');

    setImportant(title, 'display', 'block');
    setImportant(title, 'margin', '0');
    setImportant(title, 'min-width', '0');
    setImportant(title, 'overflow', 'hidden');
    setImportant(title, 'white-space', 'nowrap');
    setImportant(title, 'text-overflow', 'ellipsis');
    setImportant(title, 'font-size', veryShort ? '.78rem' : '.94rem');
    setImportant(title, 'line-height', '1.1');

    if (subtitle) setImportant(subtitle, 'display', 'none');
  }

  const observer = new MutationObserver(applyCompactQuestionLayout);
  observer.observe(panel, { attributes: true, childList: true, subtree: true });

  window.addEventListener('resize', applyCompactQuestionLayout, { passive: true });
  window.addEventListener('orientationchange', () => {
    window.setTimeout(applyCompactQuestionLayout, 100);
    window.setTimeout(applyCompactQuestionLayout, 450);
  });

  applyCompactQuestionLayout();
  window.setTimeout(applyCompactQuestionLayout, 50);
  window.setTimeout(applyCompactQuestionLayout, 500);
})();
