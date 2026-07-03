# Jumping High 2.0 — 熊抱青春記閱讀挑戰

一款以夢幻夜空為舞台的 3D 閱讀理解平台遊戲。玩家操控小男孩跳上正確答案星星，完成 10 題後飛往天空中的書本城堡。

## 遊戲功能

- 3D 卡通、星空、月亮、雲層及書本城堡場景
- 開始前輸入學生姓名
- 10 條《熊抱青春記》故事理解題，每題 3 個答案星星
- 5 條生命；答錯會跌落並扣 1 條生命
- 檢查點系統：不會回到遊戲起點，只回到最近答對的星星
- 電腦操作：方向鍵移動、空白鍵跳躍、滑鼠點擊道具
- iPhone／iPad 操作：左下虛擬搖桿、右下跳躍及踢道具按鈕
- 三種 60 秒隨機效果：魔法翅膀、巨人、小貓
- 答對後自動向上彈跳，鏡頭持續跟隨上升
- 完成全部題目後飛進天空書本城堡
- 支援加入 iPhone／iPad 主畫面及接近全螢幕模式
- 首次成功載入後會快取主要遊戲檔案

## iPhone／iPad 遊玩方法

1. 先在 GitHub Pages 發布遊戲。
2. 使用 iPhone 或 iPad 的 **Safari** 開啟 GitHub Pages 遊戲網址。
3. 把裝置轉為橫向。
4. 輸入學生姓名並按「開始星空冒險」。
5. 使用左下搖桿移動，右下「跳」按鈕跳躍。
6. 走近紫色問號道具後，按「踢道具」取得隨機效果。

### 加入主畫面

在 Safari 開啟遊戲後：

1. 按 Safari 的「分享」按鈕。
2. 選擇「加入主畫面」。
3. 按「加入」。
4. 之後由主畫面開啟 `Jumping High`，可獲得較接近全螢幕的遊戲畫面。

> iPhone Safari 一般網頁不能強制真正全螢幕；加入主畫面後的顯示效果最好。

## 電腦本機開啟方法

本專案是純靜態網頁，不需要安裝套件。

1. 下載或 clone repository。
2. 使用 VS Code Live Server，或在資料夾內執行：

```bash
python -m http.server 8000
```

3. 在瀏覽器開啟 `http://localhost:8000`。

> 因為遊戲使用 ES Module 載入 Three.js，請不要直接雙擊 `index.html` 以 `file://` 開啟。

## GitHub Pages

在 repository 的 **Settings → Pages**：

1. `Source` 選擇 **Deploy from a branch**。
2. Branch 選擇 **main**。
3. Folder 選擇 **/ (root)**。
4. 按 **Save**。

發布後網址通常為：

```text
https://pakho2433.github.io/jumping-high-2.0/
```

## 修改題目

打開 `game.js`，在最上方的 `QUESTIONS` 陣列修改：

```js
{
  question: '你的題目',
  answers: ['答案 A', '答案 B', '答案 C'],
  correct: 0, // 0=A、1=B、2=C
}
```

## 教學使用提醒

目前題目根據《熊抱青春記》的公開故事核心情節設計。不同出版社或中文版故事書可能有刪節或用詞差異；正式課堂使用前，教師應按手上的指定版本核對角色譯名及細節。

## 技術

- HTML5
- CSS3
- JavaScript ES Modules
- Three.js（CDN）
- Web App Manifest
- Service Worker
- Pointer Events／Touch Controls
