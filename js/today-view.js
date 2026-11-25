// Today View — Daily Reading Schedule, Weekly Grace Card, and Accessible Anti-Skim Bible Reader
import {
  READING_PLAN,
  getBookById,
  fetchChapterVerses
} from './bible-data.js';
import {
  store,
  todayISO,
  addDaysISO,
  diffDaysISO
} from './state.js';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function formatDateTW(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${y}年${m}月${d}日 ${WEEKDAYS[dt.getDay()]}`;
}

export function renderTodayView(container, { showToast, openReader }) {
  const state = store.state;
  const stats = store.getStats();
  const selDate = store.selectedDate;
  const today = todayISO();

  const planDayNum = diffDaysISO(state.startDate, selDate) + 1;
  const clampedDay = Math.max(1, Math.min(365, planDayNum));
  const isOutOfRange = planDayNum < 1 || planDayNum > 365;
  const dayPlan = READING_PLAN[clampedDay - 1];

  const readChCount = dayPlan.chapters.filter(c => store.isChapterRead(c.bookId, c.chapter)).length;
  const readVCount = dayPlan.chapters
    .filter(c => store.isChapterRead(c.bookId, c.chapter))
    .reduce((a, c) => a + c.verseCount, 0);
  const allDone = readChCount === dayPlan.chapterCount;
  const pct = dayPlan.verseCount > 0 ? Math.round((readVCount / dayPlan.verseCount) * 100) : 0;

  const isToday = selDate === today;
  const graceUsedOnDay = Boolean(state.graceDays[selDate]);
  const canGrace = store.canUseGraceCard(selDate);

  // Determine caught-up status
  const todayPlanNum = Math.max(1, Math.min(365, diffDaysISO(state.startDate, today) + 1));
  let expectedVersesByToday = 0;
  for (let d = 0; d < todayPlanNum; d++) expectedVersesByToday += READING_PLAN[d].verseCount;
  const isCaughtUp = stats.versesRead >= expectedVersesByToday || allDone;

  // Seedling status strip
  const seedlingPct = stats.nextSeedlingProgress;
  const versesLeftForSeed = 100 - seedlingPct;

  container.innerHTML = `
    <div class="today-wrap">
      <!-- Date & Day Navigator Card -->
      <section class="card date-hero">
        <div class="date-nav-row">
          <button class="icon-circle-btn" data-act="prev-day" aria-label="前一天">◀</button>
          <div class="date-center">
            <div class="date-title">${formatDateTW(selDate)}</div>
            <div class="date-sub">
              第 <strong>${clampedDay}</strong> / 365 天
              ${isToday ? '<span class="pill-tag pill-mint">今天</span>' : ''}
              ${isOutOfRange ? '<span class="pill-tag pill-amber">超出計畫區間</span>' : ''}
            </div>
          </div>
          <button class="icon-circle-btn" data-act="next-day" aria-label="後一天">▶</button>
        </div>

        <div class="date-picker-row">
          <label class="date-input-pill">
            <span>📅 選擇日期</span>
            <input type="date" id="today-date-picker" value="${selDate}">
          </label>
          ${!isToday ? `<button class="btn-soft-sm" data-act="jump-today">回到今天</button>` : ''}
        </div>

        <div class="progress-summary">
          <div class="progress-meta">
            <span>今日進度：<strong>${readVCount} / ${dayPlan.verseCount} 節</strong>（${readChCount} / ${dayPlan.chapterCount} 章）</span>
            <span class="status-chip ${allDone || isCaughtUp ? 'chip-ok' : 'chip-behind'}">
              ${allDone ? '✨ 今日完成' : (graceUsedOnDay ? '💛 已用恩典卡' : (isCaughtUp ? '進度跟上了' : '尚待閱讀'))}
            </span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </section>

      <!-- Pikmin-Style Seedling Energy Mini-Banner -->
      <section class="card seedling-mini-card">
        <div class="seedling-mini-left">
          <div class="seedling-pot-icon ${stats.readyToPluck > 0 ? 'bounce-ready' : ''}">🌱</div>
          <div>
            <div class="seedling-mini-title">
              ${stats.readyToPluck > 0
                ? `有 <strong>${stats.readyToPluck} 株靈糧花苗</strong> 長大了！`
                : `靈糧花盆成長中（再讀 ${versesLeftForSeed} 節發芽）`}
            </div>
            <div class="bar-track bar-thin">
              <div class="bar-fill bar-mint" style="width:${stats.readyToPluck > 0 ? 100 : seedlingPct}%"></div>
            </div>
          </div>
        </div>
        ${stats.readyToPluck > 0
          ? `<button class="btn-primary-sm" data-act="go-pluck">去花園拔起！</button>`
          : `<span class="seedling-mini-num">${seedlingPct}/100 節</span>`}
      </section>

      <!-- Today's Chapters List -->
      <section class="card chapters-card">
        <div class="card-head-row">
          <h3>📖 本日讀經份量</h3>
          <span class="muted-sm">讀完滑到最後一節即可勾選</span>
        </div>

        <div class="chapter-list">
          ${dayPlan.chapters.map(ch => {
            const book = getBookById(ch.bookId);
            const done = store.isChapterRead(ch.bookId, ch.chapter);
            return `
              <button class="chapter-card-btn ${done ? 'is-done' : ''}" data-act="open-ch" data-book="${ch.bookId}" data-ch="${ch.chapter}">
                <span class="ch-check-box ${done ? 'checked' : ''}" aria-hidden="true">${done ? '✓' : ''}</span>
                <div class="ch-info">
                  <div class="ch-name">${ch.bookName} ${ch.chapter} 章</div>
                  <div class="ch-meta">${ch.verseCount} 節 · ${book.emoji} ${book.place}</div>
                </div>
                <span class="ch-pill-tag ${done ? 'done' : ''}">${done ? '已讀完' : '開始讀 ›'}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div class="chapter-footer-actions">
          ${allDone
            ? `<button class="btn-done-full" disabled>✨ 今天的份已經讀完了！去地圖與花園看看成果吧</button>`
            : `<button class="btn-primary-full" data-act="read-next-unread">📖 打開下一章開始閱讀</button>`}
        </div>
      </section>

      <!-- Weekly Grace Card -->
      <section class="card grace-card">
        <div class="grace-head">
          <div>
            <h4>💛 每週恩典卡</h4>
            <p class="muted-sm">忙碌錯過了一天嗎？每週可使用一次恩典卡，守護你的連續讀經天數不斷掉，章節仍可日後補讀。</p>
          </div>
          <button
            class="btn-grace"
            data-act="use-grace"
            ${(!canGrace || graceUsedOnDay || allDone) ? 'disabled' : ''}>
            ${graceUsedOnDay ? '本日已使用' : (allDone ? '今日已完讀' : (canGrace ? '使用本週恩典卡' : '本週已使用'))}
          </button>
        </div>
      </section>
    </div>
  `;

  // Bind Events
  container.querySelector('[data-act="prev-day"]')?.addEventListener('click', () => {
    store.selectedDate = addDaysISO(store.selectedDate, -1);
    renderTodayView(container, { showToast, openReader });
  });
  container.querySelector('[data-act="next-day"]')?.addEventListener('click', () => {
    store.selectedDate = addDaysISO(store.selectedDate, 1);
    renderTodayView(container, { showToast, openReader });
  });
  container.querySelector('[data-act="jump-today"]')?.addEventListener('click', () => {
    store.selectedDate = todayISO();
    renderTodayView(container, { showToast, openReader });
  });
  container.querySelector('#today-date-picker')?.addEventListener('change', e => {
    if (e.target.value) {
      store.selectedDate = e.target.value;
      renderTodayView(container, { showToast, openReader });
    }
  });

  container.querySelectorAll('[data-act="open-ch"]').forEach(btn => {
    btn.addEventListener('click', () => {
      openReader(Number(btn.dataset.book), Number(btn.dataset.ch));
    });
  });

  container.querySelector('[data-act="read-next-unread"]')?.addEventListener('click', () => {
    const nextUnread = dayPlan.chapters.find(c => !store.isChapterRead(c.bookId, c.chapter));
    if (nextUnread) {
      openReader(nextUnread.bookId, nextUnread.chapter);
    }
  });

  container.querySelector('[data-act="use-grace"]')?.addEventListener('click', () => {
    if (store.useGraceCard(selDate)) {
      showToast('💛 已使用本週恩典卡，連續天數已為你守護！');
    }
  });

  container.querySelector('[data-act="go-pluck"]')?.addEventListener('click', () => {
    document.querySelector('[data-tab="garden"]')?.click();
  });
}

// Accessible Full-Screen Anti-Skim Bible Reader Overlay
export function createBibleReader({ showToast }) {
  const modal = document.getElementById('reader-modal');
  const titleEl = document.getElementById('reader-title');
  const subEl = document.getElementById('reader-sub');
  const bodyEl = document.getElementById('reader-body');
  const markBtn = document.getElementById('reader-mark-btn');
  const uncheckBtn = document.getElementById('reader-uncheck-btn');
  const closeBtn = document.getElementById('reader-close-btn');
  const fontBtns = modal.querySelectorAll('[data-font-size]');

  let activeBookId = 1;
  let activeChapter = 1;
  let reachedEnd = false;
  let observer = null;

  function applyFontSize(sz) {
    bodyEl.classList.remove('font-sm', 'font-md', 'font-lg', 'font-xl');
    bodyEl.classList.add(`font-${sz}`);
    fontBtns.forEach(b => b.classList.toggle('active', b.dataset.fontSize === sz));
  }

  fontBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const sz = btn.dataset.fontSize;
      store.setReaderFontSize(sz);
      applyFontSize(sz);
    });
  });

  function updateFooterButtons() {
    const alreadyDone = store.isChapterRead(activeBookId, activeChapter);
    if (alreadyDone) {
      markBtn.disabled = true;
      markBtn.textContent = '已讀完這章 ✓';
      markBtn.classList.add('is-done');
      uncheckBtn.hidden = false;
    } else if (reachedEnd) {
      markBtn.disabled = false;
      markBtn.textContent = '讀完了 ✓（累積步數）';
      markBtn.classList.remove('is-done');
      uncheckBtn.hidden = true;
    } else {
      markBtn.disabled = true;
      markBtn.textContent = '請向下滑動讀到最後一節 ↓';
      markBtn.classList.remove('is-done');
      uncheckBtn.hidden = true;
    }
  }

  function close() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', e => {
    if (e.target === modal) close();
  });

  markBtn.addEventListener('click', () => {
    if (markBtn.disabled) return;
    const book = getBookById(activeBookId);
    const vCount = book.verses[activeChapter - 1];
    store.markChapterRead(activeBookId, activeChapter, true);
    updateFooterButtons();
    showToast(`✨ 已完成 ${book.name} 第 ${activeChapter} 章！前進 +${vCount} 步`);
    setTimeout(close, 550);
  });

  uncheckBtn.addEventListener('click', () => {
    store.markChapterRead(activeBookId, activeChapter, false);
    reachedEnd = true;
    updateFooterButtons();
    showToast('已取消勾選這一章');
  });

  async function open(bookId, chapter) {
    activeBookId = bookId;
    activeChapter = chapter;
    reachedEnd = false;

    const book = getBookById(bookId);
    const vCount = book.verses[chapter - 1];
    titleEl.textContent = `${book.emoji} ${book.name} 第 ${chapter} 章`;
    subEl.textContent = `${book.place} · 共 ${vCount} 節 · 1919 和合本`;
    applyFontSize(store.state.readerFontSize || 'md');

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    bodyEl.scrollTop = 0;
    bodyEl.innerHTML = `<div class="reader-loading">正在打開經文卷軸…</div>`;
    updateFooterButtons();

    const result = await fetchChapterVerses(bookId, chapter);

    const sourceBadge = result.source === 'offline-guide'
      ? `<div class="reader-offline-banner">📖 目前為離線靈修模式，可搭配您的紙本聖經閱讀本章完整經文。</div>`
      : `<div class="reader-source-badge">公有領域 1919 年中文和合本（CUV）</div>`;

    const versesHtml = result.verses.map((v, i) => `
      <p class="verse-line" ${i === result.verses.length - 1 ? 'id="reader-last-verse"' : ''}>
        <span class="verse-num">${v.num}</span>
        <span class="verse-text">${v.text}</span>
      </p>
    `).join('');

    bodyEl.innerHTML = `
      ${sourceBadge}
      <div class="verses-container">${versesHtml}</div>
      <div class="reader-end-marker" id="reader-sentinel">
        <span>🌿 本章經文結束 · 願主的話光照你的腳步</span>
      </div>
    `;

    // Observe the end sentinel so the mark-read button unlocks only when user reads to the end
    const sentinel = document.getElementById('reader-sentinel');
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) {
        reachedEnd = true;
        updateFooterButtons();
      }
    }, { root: bodyEl, threshold: 0.25 });
    if (sentinel) observer.observe(sentinel);

    // Also handle short chapters that fit completely without scrolling
    requestAnimationFrame(() => {
      if (bodyEl.scrollHeight <= bodyEl.clientHeight + 24) {
        reachedEnd = true;
        updateFooterButtons();
      }
    });
  }

  return { open, close };
}
