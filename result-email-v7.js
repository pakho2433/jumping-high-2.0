(() => {
  'use strict';

  const ENDPOINT = 'https://formsubmit.co/ajax/yuetki1999@gmail.com';
  const endScreen = document.querySelector('#end-screen');
  const endTitle = document.querySelector('#end-title');
  const endMessage = document.querySelector('#end-message');
  const playerName = document.querySelector('#hud-name');
  const resultScore = document.querySelector('#result-score');
  const lives = document.querySelector('#lives');

  if (!endScreen || !playerName || !resultScore) return;

  const status = document.createElement('p');
  status.id = 'email-result-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.style.margin = '10px 0 16px';
  status.style.fontSize = '.82rem';
  status.style.lineHeight = '1.45';
  status.style.color = '#d8d1ff';

  const resultRow = endScreen.querySelector('.result-row');
  if (resultRow) resultRow.insertAdjacentElement('afterend', status);

  let sent = false;
  let sending = false;
  let retryCount = 0;

  function remainingLives() {
    const text = lives?.textContent || '';
    return (text.match(/❤️/g) || []).length;
  }

  function buildPayload() {
    const name = playerName.textContent.trim() || '未有姓名';
    const score = resultScore.textContent.trim() || '0 / 10';
    const title = endTitle?.textContent.trim() || '遊戲完成';
    const message = endMessage?.textContent.trim() || '';
    const completedAt = new Intl.DateTimeFormat('zh-HK', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'Asia/Hong_Kong',
    }).format(new Date());

    return {
      _subject: `Jumping High 2.0 學生結果：${name}`,
      _template: 'table',
      遊戲: 'Jumping High 2.0 — 熊抱青春記閱讀挑戰',
      學生姓名: name,
      成績: score,
      完成狀態: title,
      剩餘生命: `${remainingLives()} / 5`,
      完成時間: completedAt,
      詳細訊息: message,
    };
  }

  async function sendResult() {
    if (sent || sending) return;
    sending = true;
    status.textContent = '📨 正在把結果傳送給老師……';

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(buildPayload()),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      sent = true;
      status.textContent = '✅ 結果已提交到老師電郵。首次使用時，老師需先在 Gmail 按確認連結。';
    } catch (error) {
      console.error('Result email failed:', error);
      sending = false;

      if (retryCount < 1) {
        retryCount += 1;
        status.textContent = '📨 網絡不穩，正在重新傳送結果……';
        window.setTimeout(sendResult, 3500);
        return;
      }

      status.textContent = '⚠️ 結果未能傳送，請檢查網絡後重新完成遊戲。';
    } finally {
      if (sent) sending = false;
    }
  }

  function checkEndScreen() {
    if (endScreen.classList.contains('active')) sendResult();
  }

  const observer = new MutationObserver(checkEndScreen);
  observer.observe(endScreen, { attributes: true, attributeFilter: ['class'] });
  checkEndScreen();
})();
