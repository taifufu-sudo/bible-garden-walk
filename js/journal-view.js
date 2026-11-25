// Journal & LINE Share Card View (Text Copy + Canvas Postcard Image Export)
import { READING_PLAN } from './bible-data.js';
import { store, todayISO, diffDaysISO } from './state.js';

const MOODS = [
  { icon: '✨', label: '領受亮光' },
  { icon: '🙏', label: '心存感恩' },
  { icon: '🕊️', label: '得享平安' },
  { icon: '💗', label: '被愛觸動' },
  { icon: '💪', label: '重新得力' }
];

let selectedMood = '✨';

function formatLineShareText({ verse, note, mood, date }) {
  const state = store.state;
  const stats = store.getStats();
  const who = state.nickname ? `${state.nickname} 的讀經日記` : '今日讀經日記';
  const lines = [
    `${mood}【${state.churchName} · 一年讀經】`,
    `📅 ${date}｜${who}`,
    `🚶 已累積 ${stats.versesRead.toLocaleString()} 節（${stats.percent}%）｜🔥 連續 ${stats.currentStreak} 天`,
    ''
  ];
  if (verse) lines.push(`📖 ${verse}`);
  if (note) lines.push(`💬 ${note}`);
  lines.push('', '🌿 一起在聖經大地圖與恩典花園同行！');
  return lines.join('\n');
}

function downloadShareCardPNG({ verse, note, mood, date }) {
  const state = store.state;
  const stats = store.getStats();
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1120;
  const ctx = canvas.getContext('2d');

  // Warm parchment-botanical gradient background
  const grad = ctx.createLinearGradient(0, 0, 900, 1120);
  grad.addColorStop(0, '#fdf7ea');
  grad.addColorStop(0.5, '#f2f7ec');
  grad.addColorStop(1, '#e7f1ec');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 900, 1120);

  // Inner card border
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.strokeStyle = '#d8e3cf';
  ctx.lineWidth = 3;
  roundRect(ctx, 52, 52, 796, 1016, 36);
  ctx.fill();
  ctx.stroke();

  // Header badge
  ctx.fillStyle = '#4e7f5a';
  ctx.font = 'bold 28px "PingFang TC", "Noto Sans TC", sans-serif';
  ctx.fillText(`${mood} ${state.churchName} · 一年讀經旅程`, 100, 132);

  ctx.fillStyle = '#7e8f82';
  ctx.font = '24px "PingFang TC", "Noto Sans TC", sans-serif';
  ctx.fillText(`${date}   ${state.nickname || '恩典旅人'}`, 100, 178);

  // Decorative divider
  ctx.strokeStyle = '#e5ebd8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 214);
  ctx.lineTo(800, 214);
  ctx.stroke();

  // Verse box
  ctx.fillStyle = '#f7fbf2';
  roundRect(ctx, 96, 250, 708, 120, 20);
  ctx.fill();
  ctx.fillStyle = '#2d5a3b';
  ctx.font = 'bold 30px "PingFang TC", "Noto Sans TC", sans-serif';
  ctx.fillText(`📖 ${verse || '每日一節，步步同行'}`, 124, 320);

  // Reflection wrapped text
  ctx.fillStyle = '#2d3a32';
  ctx.font = '32px "PingFang TC", "Noto Sans TC", sans-serif';
  const text = note || '今天也安靜在主的話語中得著力量與平安。';
  wrapChineseText(ctx, text, 104, 448, 692, 52, 8);

  // Footer stats bar
  ctx.fillStyle = '#edf5e9';
  roundRect(ctx, 96, 892, 708, 122, 24);
  ctx.fill();
  ctx.fillStyle = '#3d6b4b';
  ctx.font = 'bold 26px "PingFang TC", "Noto Sans TC", sans-serif';
  ctx.fillText(`🚶 已走 ${stats.versesRead.toLocaleString()} 節（${stats.percent}%）`, 132, 944);
  ctx.fillText(`🔥 連續讀經 ${stats.currentStreak} 天 · 🌱 夥伴 ${state.pluckedCount} 位`, 132, 988);

  const link = document.createElement('a');
  link.download = `讀經分享卡_${date}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapChineseText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
  let line = '';
  let curY = y;
  let count = 0;
  for (const ch of text) {
    if (ch === '\n') {
      ctx.fillText(line, x, curY);
      line = '';
      curY += lineHeight;
      count++;
      if (count >= maxLines) return;
      continue;
    }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, curY);
      line = ch;
      curY += lineHeight;
      count++;
      if (count >= maxLines) return;
    } else {
      line = test;
    }
  }
  if (line && count < maxLines) ctx.fillText(line, x, curY);
}

export function renderJournalView(container, { showToast }) {
  const state = store.state;
  const today = todayISO();
  const planDay = Math.max(1, Math.min(365, diffDaysISO(state.startDate, today) + 1));
  const todayPlan = READING_PLAN[planDay - 1];
  const suggestedRange = todayPlan
    ? `${todayPlan.chapters[0].bookName} ${todayPlan.chapters[0].chapter} 章`
    : '詩篇 23:1';

  container.innerHTML = `
    <div class="journal-wrap">
      <section class="card journal-editor-card">
        <div class="card-head-row">
          <div>
            <h3>💌 寫下今天的讀經感動</h3>
            <p class="muted-sm">記下一句觸動心靈的經文，也可一鍵複製或下載圖卡分享到教會 LINE 小組</p>
          </div>
        </div>

        <div class="mood-row" role="radiogroup" aria-label="今日靈修心情">
          ${MOODS.map(m => `
            <button type="button" class="mood-pill ${selectedMood === m.icon ? 'active' : ''}" data-mood="${m.icon}">
              ${m.icon} ${m.label}
            </button>
          `).join('')}
        </div>

        <div class="form-field">
          <label for="j-verse">📖 感動經文出處</label>
          <input id="j-verse" type="text" placeholder="例如：${suggestedRange} 或 詩篇 23:1" maxlength="60">
        </div>

        <div class="form-field">
          <label for="j-note">✍️ 今天的一句亮光或禱告</label>
          <textarea id="j-note" rows="4" placeholder="今天讀經時，心裡最被觸動的一句話、一個提醒或感恩…"></textarea>
        </div>

        <div class="journal-actions">
          <button class="btn-primary-full" data-act="save-entry">💾 存進日記本</button>
          <div class="journal-share-row">
            <button class="btn-soft-full" data-act="copy-line">📋 複製 LINE 分享卡</button>
            <button class="btn-soft-full" data-act="download-card">🖼️ 下載精美圖卡</button>
          </div>
        </div>
      </section>

      <section class="card journal-list-card">
        <div class="card-head-row">
          <h3>📒 我的靈修日記本</h3>
          <span class="pill-tag pill-mint">共 ${state.journal.length} 篇</span>
        </div>

        ${state.journal.length === 0 ? `
          <div class="empty-hint">
            還沒有日記紀錄喔！寫下今天讀經時的一句亮光，為這一年留下最珍貴的恩典足跡。
          </div>
        ` : `
          <div class="journal-entries">
            ${state.journal.map(entry => `
              <article class="journal-entry">
                <div class="entry-head">
                  <span class="entry-date">${entry.mood || '✨'} ${entry.date}</span>
                  <div class="entry-btns">
                    <button class="link-btn" data-copy-id="${entry.id}">📋 複製</button>
                    <button class="link-btn danger" data-del-id="${entry.id}">刪除</button>
                  </div>
                </div>
                ${entry.verse ? `<div class="entry-verse">📖 ${entry.verse}</div>` : ''}
                <p class="entry-note">${entry.note.replace(/\n/g, '<br>')}</p>
              </article>
            `).join('')}
          </div>
        `}
      </section>
    </div>
  `;

  const verseInput = container.querySelector('#j-verse');
  const noteInput = container.querySelector('#j-note');

  container.querySelectorAll('[data-mood]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMood = btn.dataset.mood;
      container.querySelectorAll('[data-mood]').forEach(b => b.classList.toggle('active', b === btn));
    });
  });

  container.querySelector('[data-act="save-entry"]')?.addEventListener('click', () => {
    const verse = verseInput.value.trim();
    const note = noteInput.value.trim();
    if (!verse && !note) {
      showToast('請先輸入經文或今天的感動再儲存喔！');
      return;
    }
    store.addJournalEntry({ verse, note, mood: selectedMood });
    showToast('💌 已存進你的靈修日記本！');
  });

  container.querySelector('[data-act="copy-line"]')?.addEventListener('click', async () => {
    const text = formatLineShareText({
      verse: verseInput.value.trim() || suggestedRange,
      note: noteInput.value.trim() || '今日讀經完成！願神的話語成為我們腳前的燈、路上的光。',
      mood: selectedMood,
      date: today
    });
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 已複製 LINE 分享卡片！可以直接貼到小組群組囉');
    } catch {
      showToast('📋 分享文字已準備完成（瀏覽器限制剪貼簿時可手動複製）');
    }
  });

  container.querySelector('[data-act="download-card"]')?.addEventListener('click', () => {
    downloadShareCardPNG({
      verse: verseInput.value.trim() || suggestedRange,
      note: noteInput.value.trim() || '今日讀經完成！願主的話語滋潤我們的心田。',
      mood: selectedMood,
      date: today
    });
    showToast('🖼️ 精美讀經分享圖卡已下載！');
  });

  container.querySelectorAll('[data-copy-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const entry = store.state.journal.find(j => j.id === btn.dataset.copyId);
      if (!entry) return;
      try {
        await navigator.clipboard.writeText(formatLineShareText(entry));
        showToast('📋 已複製這篇日記，可以貼到 LINE 了！');
      } catch {
        showToast('無法存取剪貼簿');
      }
    });
  });

  container.querySelectorAll('[data-del-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      store.deleteJournalEntry(btn.dataset.delId);
      showToast('已刪除該篇日記');
    });
  });
}
