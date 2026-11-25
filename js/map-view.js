// Pikmin-Inspired Biblical Exploration Map, 12 Fruit of the Spirit Stages, & 66-Book Fog Grid
import {
  BIBLE_BOOKS,
  MAP_ZONES,
  TOTAL_VERSES
} from './bible-data.js';
import { store } from './state.js';

let currentFilter = 'all'; // 'all' | 'OT' | 'NT' | 'active' | 'done' | zoneId

// Compute smooth SVG polyline/path points and interpolated pilgrim marker along the 10-zone trail
function buildTrailGeometry(progressRatio) {
  const pts = MAP_ZONES.map(z => ({ x: z.x * 8, y: z.y * 3.6 })); // ViewBox 800 x 360
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const cx = (prev.x + cur.x) / 2;
    d += ` Q ${cx} ${prev.y}, ${cur.x} ${cur.y}`;
  }

  // Approximate position along trail segments for pilgrim & planted flowers
  const segCount = pts.length - 1;
  const clamped = Math.max(0, Math.min(1, progressRatio));
  const scaled = clamped * segCount;
  const segIdx = Math.min(segCount - 1, Math.floor(scaled));
  const t = scaled - segIdx;
  const p0 = pts[segIdx];
  const p1 = pts[segIdx + 1];
  const cx = (p0.x + p1.x) / 2;
  const cy = p0.y;
  // Quadratic Bezier point at t
  const mt = 1 - t;
  const px = mt * mt * p0.x + 2 * mt * t * cx + t * t * p1.x;
  const py = mt * mt * p0.y + 2 * mt * t * cy + t * t * p1.y;

  // Generate planted flowers along walked portion (Pikmin flower-planting trail!)
  const flowers = [];
  const flowerColors = ['#ff8fab', '#ffd166', '#8ecae6', '#b8e0d2', '#f7b267', '#cdb4db'];
  const totalSamples = 42;
  const walkedSamples = Math.floor(clamped * totalSamples);
  for (let i = 0; i <= walkedSamples; i++) {
    const frac = i / totalSamples;
    const s = frac * segCount;
    const si = Math.min(segCount - 1, Math.floor(s));
    const lt = s - si;
    const a = pts[si];
    const b = pts[si + 1];
    const qx = (a.x + b.x) / 2;
    const qy = a.y;
    const lmt = 1 - lt;
    const fx = lmt * lmt * a.x + 2 * lmt * lt * qx + lt * lt * b.x;
    const fy = lmt * lmt * a.y + 2 * lmt * lt * qy + lt * lt * b.y;
    const offset = ((i % 2 === 0) ? 1 : -1) * (8 + (i % 3) * 4);
    flowers.push({
      x: fx + offset * 0.4,
      y: fy + offset,
      color: flowerColors[i % flowerColors.length],
      r: 3.4 + (i % 2) * 1.1
    });
  }

  return { d, pts, pilgrim: { x: px, y: py }, flowers };
}

export function renderMapView(container, { openReader, showToast }) {
  const stats = store.getStats();
  const progressRatio = stats.versesRead / TOTAL_VERSES;
  const geom = buildTrailGeometry(progressRatio);

  // Per-zone progress
  const zoneStats = MAP_ZONES.map((z, idx) => {
    const books = BIBLE_BOOKS.filter(b => b.group === z.id);
    const totalCh = books.reduce((s, b) => s + b.chapterCount, 0);
    const readCh = books.reduce((s, b) => s + (stats.bookProgress.get(b.id)?.readChapters || 0), 0);
    const pct = totalCh > 0 ? Math.round((readCh / totalCh) * 100) : 0;
    const unlocked = readCh > 0 || idx === 0;
    const completed = totalCh > 0 && readCh === totalCh;
    return { ...z, totalCh, readCh, pct, unlocked, completed, pt: geom.pts[idx] };
  });

  // Filtered books
  const filteredBooks = BIBLE_BOOKS.filter(b => {
    const p = stats.bookProgress.get(b.id);
    if (currentFilter === 'OT') return b.testament === 'OT';
    if (currentFilter === 'NT') return b.testament === 'NT';
    if (currentFilter === 'active') return p.readChapters > 0 && !p.completed;
    if (currentFilter === 'done') return p.completed;
    if (MAP_ZONES.some(z => z.id === currentFilter)) return b.group === currentFilter;
    return true;
  });

  // Group filtered books by MAP_ZONES order
  const groupedSections = MAP_ZONES
    .map(z => ({
      zone: z,
      books: filteredBooks.filter(b => b.group === z.id)
    }))
    .filter(sec => sec.books.length > 0);

  const kmWalked = (stats.versesRead * 0.012).toFixed(1); // ~373 km across whole Bible!

  container.innerHTML = `
    <div class="map-wrap">
      <!-- Pikmin-Style Scenic World Trail Map -->
      <section class="card world-map-card">
        <div class="card-head-row">
          <div>
            <h3>🗺️ 聖經探險大地圖</h3>
            <p class="muted-sm">每讀一節聖經就向前一步，沿途種下恩典花朵、驅散未知迷霧</p>
          </div>
          <div class="map-km-badge">
            <span>👣 已走 <strong>${kmWalked}</strong> 公里</span>
            <small>${stats.versesRead.toLocaleString()} / ${TOTAL_VERSES.toLocaleString()} 節</small>
          </div>
        </div>

        <div class="scenic-map-frame">
          <svg viewBox="0 0 800 360" class="scenic-map-svg" role="img" aria-label="聖經十大探索區域路線圖">
            <defs>
              <linearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#e3f3ff"/>
                <stop offset="55%" stop-color="#f5f8e8"/>
                <stop offset="100%" stop-color="#e4f0d8"/>
              </linearGradient>
              <linearGradient id="seaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#a8d8f0"/>
                <stop offset="100%" stop-color="#7ebce0"/>
              </linearGradient>
              <linearGradient id="trailWalked" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#58b368"/>
                <stop offset="50%" stop-color="#f2b84b"/>
                <stop offset="100%" stop-color="#f07d9e"/>
              </linearGradient>
              <filter id="softGlow">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <!-- Soft storybook terrain -->
            <rect width="800" height="360" rx="18" fill="url(#mapSky)"/>
            <!-- Distant rolling hills -->
            <path d="M0 175 Q140 115 280 160 T560 135 T800 165 L800 360 L0 360 Z" fill="#d9eccb" opacity="0.75"/>
            <path d="M0 245 Q190 190 380 240 T720 215 L800 235 L800 360 L0 360 Z" fill="#c7e2b5" opacity="0.8"/>
            <!-- Sea of Galilee / Mediterranean bay -->
            <ellipse cx="565" cy="182" rx="85" ry="38" fill="url(#seaGrad)" opacity="0.65"/>
            <ellipse cx="155" cy="282" rx="70" ry="24" fill="url(#seaGrad)" opacity="0.55"/>

            <!-- Dashed unexplored trail -->
            <path d="${geom.d}" fill="none" stroke="#c9bfa9" stroke-width="8" stroke-linecap="round" stroke-dasharray="10 10"/>
            <!-- Walked luminous trail -->
            <path d="${geom.d}" fill="none" stroke="url(#trailWalked)" stroke-width="8" stroke-linecap="round"
                  pathLength="100" stroke-dasharray="${Math.max(1.5, progressRatio * 100)} 100"/>

            <!-- Planted Pikmin Flowers along walked trail -->
            <g class="planted-flowers">
              ${geom.flowers.map(f => `
                <g transform="translate(${f.x.toFixed(1)}, ${f.y.toFixed(1)})">
                  <circle r="${f.r}" fill="${f.color}" opacity="0.92"/>
                  <circle r="${(f.r * 0.42).toFixed(1)}" fill="#fff8d6"/>
                </g>
              `).join('')}
            </g>

            <!-- Soft Fog of War Clouds over locked/unexplored zones -->
            <g class="map-fog-clouds">
              ${zoneStats.filter(z => !z.unlocked).map(z => `
                <g transform="translate(${z.pt.x}, ${z.pt.y})" opacity="0.78">
                  <ellipse cx="-16" cy="-4" rx="28" ry="15" fill="#ffffff"/>
                  <ellipse cx="14" cy="-6" rx="26" ry="14" fill="#f7f9fc"/>
                  <ellipse cx="0" cy="4" rx="34" ry="14" fill="#eef3f8"/>
                </g>
              `).join('')}
            </g>

            <!-- 10 Zone Landmark Pins -->
            ${zoneStats.map(z => {
              const isSelected = currentFilter === z.id;
              return `
                <g class="map-zone-pin ${z.completed ? 'is-complete' : (z.unlocked ? 'is-open' : 'is-fog')} ${isSelected ? 'is-selected' : ''}"
                   data-zone="${z.id}" transform="translate(${z.pt.x}, ${z.pt.y})" style="cursor:pointer">
                  <circle r="${isSelected ? 21 : 17}" fill="${z.completed ? z.color : (z.unlocked ? '#ffffff' : '#e8edf2')}"
                          stroke="${z.color}" stroke-width="${isSelected ? 4 : 2.5}"/>
                  <text text-anchor="middle" y="6" font-size="16">${z.unlocked ? z.emoji : '☁️'}</text>
                  <rect x="-34" y="21" width="68" height="19" rx="9" fill="rgba(255,255,255,0.92)"/>
                  <text text-anchor="middle" y="34" font-size="10.5" font-weight="700" fill="#3a453e">${z.shortName}</text>
                  ${z.unlocked ? `<text text-anchor="middle" y="-22" font-size="9.5" font-weight="700" fill="${z.color}">${z.pct}%</text>` : ''}
                </g>
              `;
            }).join('')}

            <!-- Animated Walking Pilgrim + Little Lamb Avatar at Current Frontier -->
            <g class="pilgrim-marker" transform="translate(${geom.pilgrim.x.toFixed(1)}, ${(geom.pilgrim.y - 16).toFixed(1)})" filter="url(#softGlow)">
              <circle r="15" fill="#fff7dc" stroke="#e69b3a" stroke-width="2.5"/>
              <text text-anchor="middle" y="5" font-size="16">🐑</text>
            </g>
          </svg>
        </div>
        <div class="map-legend-row">
          <span>🌸 已種下 <strong>${geom.flowers.length}</strong> 叢旅途花朵</span>
          <span>☁️ 點擊地圖地標可篩選該區書卷</span>
        </div>
      </section>

      <!-- 12 Fruit of the Spirit Stages -->
      <section class="card fruits-card">
        <div class="card-head-row">
          <div>
            <h3>🍇 聖靈的果子（12 個月里程碑）</h3>
            <p class="muted-sm">每完成約 30 天讀經，就會綻放一顆果子並獲得花園祝福</p>
          </div>
          <span class="pill-tag pill-mint">${stats.unlockedFruits.filter(f => f.completed).length} / 12 綻放</span>
        </div>

        <div class="fruits-grid">
          ${stats.unlockedFruits.map(f => `
            <button class="fruit-tile ${f.completed ? 'bloomed' : (f.readCh > 0 ? 'growing' : 'locked')}"
                    data-fruit-msg="${f.name}（第 ${f.startDay}–${f.endDay} 天 · ${f.readCh}/${f.totalCh} 章）：${f.verse}">
              <div class="fruit-icon">${f.completed ? f.emoji : (f.readCh > 0 ? '🌱' : '🫧')}</div>
              <div class="fruit-name">${f.name}</div>
              <div class="fruit-days">${f.startDay}–${f.endDay}天</div>
              <div class="fruit-mini-bar"><span style="width:${f.pct}%"></span></div>
            </button>
          `).join('')}
        </div>
      </section>

      <!-- 66-Book Chapter Fog-of-War Explorer -->
      <section class="card books-explorer-card" id="books-explorer">
        <div class="card-head-row">
          <div>
            <h3>📚 66 卷章節探索圖鑑</h3>
            <p class="muted-sm">點擊任一章節方塊可直接打開閱讀並驅散迷霧（已讀 ${stats.chaptersRead} / ${stats.totalChapters} 章）</p>
          </div>
          <span class="pill-tag pill-amber">${stats.booksCompleted} / 66 卷完讀</span>
        </div>

        <div class="filter-pills">
          <button class="filter-pill ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部 66 卷</button>
          <button class="filter-pill ${currentFilter === 'OT' ? 'active' : ''}" data-filter="OT">舊約 (39)</button>
          <button class="filter-pill ${currentFilter === 'NT' ? 'active' : ''}" data-filter="NT">新約 (27)</button>
          <button class="filter-pill ${currentFilter === 'active' ? 'active' : ''}" data-filter="active">探索中</button>
          <button class="filter-pill ${currentFilter === 'done' ? 'active' : ''}" data-filter="done">已完讀 ✨</button>
          ${MAP_ZONES.some(z => z.id === currentFilter)
            ? `<button class="filter-pill active" data-filter="all">✕ 清除地標篩選</button>`
            : ''}
        </div>

        <div class="book-groups-list">
          ${groupedSections.length === 0 ? `<div class="empty-hint">這個篩選條件下還沒有書卷喔，快從今日讀經踏出第一步吧！</div>` : ''}
          ${groupedSections.map(sec => `
            <div class="book-group-block">
              <div class="book-group-header">
                <span>${sec.zone.emoji} ${sec.zone.name}</span>
                <small>${sec.zone.landmark}</small>
              </div>
              <div class="books-grid">
                ${sec.books.map(book => {
                  const prog = stats.bookProgress.get(book.id);
                  const pct = Math.round((prog.readChapters / prog.totalChapters) * 100);
                  return `
                    <article class="book-card ${prog.completed ? 'book-done' : ''}">
                      <div class="book-card-top">
                        <div class="book-title-wrap">
                          <span class="book-emoji">${book.emoji}</span>
                          <div>
                            <div class="book-name">${book.name}</div>
                            <div class="book-place">${book.place} · ${book.verseCount.toLocaleString()} 節</div>
                          </div>
                        </div>
                        <span class="book-status-badge ${prog.completed ? 'done' : ''}">
                          ${prog.completed ? '已解鎖 ✨' : `${prog.readChapters}/${prog.totalChapters}章`}
                        </span>
                      </div>
                      <div class="bar-track bar-xs"><div class="bar-fill" style="width:${pct}%"></div></div>
                      <div class="chapter-fog-grid">
                        ${Array.from({ length: book.chapterCount }, (_, idx) => {
                          const ch = idx + 1;
                          const isRead = store.isChapterRead(book.id, ch);
                          return `<button class="fog-tile ${isRead ? 'clear' : 'fog'}"
                                          data-open-book="${book.id}" data-open-ch="${ch}"
                                          title="${book.name} 第 ${ch} 章（${book.verses[idx]} 節）">${ch}</button>`;
                        }).join('')}
                      </div>
                    </article>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;

  // Bind zone pin clicks on SVG map
  container.querySelectorAll('.map-zone-pin').forEach(pin => {
    pin.addEventListener('click', () => {
      const zid = pin.dataset.zone;
      currentFilter = (currentFilter === zid) ? 'all' : zid;
      renderMapView(container, { openReader, showToast });
      document.getElementById('books-explorer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Bind fruit milestone info toast
  container.querySelectorAll('.fruit-tile').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast(btn.dataset.fruitMsg);
    });
  });

  // Bind filter pills
  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderMapView(container, { openReader, showToast });
    });
  });

  // Bind chapter fog tiles -> jump directly to reader
  container.querySelectorAll('[data-open-book]').forEach(btn => {
    btn.addEventListener('click', () => {
      openReader(Number(btn.dataset.openBook), Number(btn.dataset.openCh));
    });
  });
}
