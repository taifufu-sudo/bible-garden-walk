// Living 4-Time-of-Day Garden View (Style B: Korean Pastel Colored-Pencil Storybook)
// Features:
// 1. Clean Thumbnail Preview Card on the main Garden tab (with live strolling animals & 4-time switcher)
// 2. Full-Screen Landscape-Ready Studio Mode (supports 90° mobile landscape rotation, zoom, collapsible drawer, free drag!)
// 3. Pure Screensaver / Ambient Showcase Mode (hides all UI, shows gentle clock + verse + living animals & night lamps!)

import {
  TIME_PHASES,
  GARDEN_ITEMS,
  getItemDef,
  getRewardForPluckIndex,
  detectRealTimePhase
} from './garden-catalog.js';
import { GardenLifeController } from './garden-life.js';
import { store } from './state.js';

let selectedUid = null;
let trayCategory = 'all';
let studioOpen = false;
let studioRotateLandscape = false; // Forces crisp 90° horizontal view on portrait phones!
let studioScreensaver = false;     // Pure zero-UI living screensaver showcase!
let studioDrawerOpen = false;      // Collapsible item tray inside full-screen studio
let studioZoom = 1.0;              // 1.0 | 1.25 | 1.5
let studioFillCover = false;       // Screensaver fit vs cover fill
let studioShowClock = true;        // Subtle floating clock + verse in screensaver

const previewLife = new GardenLifeController();
const studioLife = new GardenLifeController();
let clockTimer = null;
let lastStudioCallbacks = null;

window.addEventListener('resize', () => {
  if (studioOpen && lastStudioCallbacks) {
    renderStudioOverlay(lastStudioCallbacks);
  }
});

function computeDepthScale(yPct) {
  const norm = Math.max(0, Math.min(1, (yPct - 36) / 58));
  return 0.56 + norm * 0.52;
}

const FIREFLIES = [
  { x: 14, y: 64, delay: 0.0, dur: 4.2 },
  { x: 24, y: 58, delay: 1.1, dur: 5.0 },
  { x: 18, y: 78, delay: 2.3, dur: 4.7 },
  { x: 42, y: 66, delay: 0.7, dur: 5.5 },
  { x: 66, y: 56, delay: 1.8, dur: 4.5 },
  { x: 80, y: 68, delay: 0.4, dur: 5.2 },
  { x: 88, y: 50, delay: 2.6, dur: 4.8 },
  { x: 54, y: 82, delay: 1.5, dur: 5.8 }
];

const STARS = [
  { x: 12, y: 6, d: 0.2 }, { x: 28, y: 10, d: 1.1 }, { x: 44, y: 7, d: 0.6 },
  { x: 58, y: 11, d: 1.7 }, { x: 72, y: 6, d: 0.4 }, { x: 85, y: 10, d: 0.9 },
  { x: 36, y: 14, d: 1.4 }, { x: 64, y: 15, d: 0.3 }
];

function formatClockNow() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Shared renderer for the living garden stage (used by both the Thumbnail Preview AND Full-Screen Studio!)
function buildGardenStageInnerHtml({ phase, items, interactive, showEmptyHint }) {
  return `
    <img class="garden-bg ${phase.id === 'morning' ? 'active' : ''}" src="assets/garden/garden_morning.jpg" alt="早晨粉彩花園" draggable="false">
    <img class="garden-bg ${phase.id === 'noon' ? 'active' : ''}"    src="assets/garden/garden_noon.jpg"    alt="中午粉彩花園" draggable="false">
    <img class="garden-bg ${phase.id === 'dusk' ? 'active' : ''}"    src="assets/garden/garden_dusk.jpg"    alt="黃昏粉彩花園" draggable="false">
    <img class="garden-bg ${phase.id === 'night' ? 'active' : ''}"   src="assets/garden/garden_night.jpg"   alt="夜晚粉彩花園" draggable="false">

    <div class="garden-atmosphere" aria-hidden="true">
      <!-- Subtle living water shimmer & gentle ripples over the lower-left lotus pond -->
      <div class="pond-water-shimmer">
        <span class="water-ripple r1"></span>
        <span class="water-ripple r2"></span>
        <span class="water-glint g1"></span>
        <span class="water-glint g2"></span>
        <span class="water-glint g3"></span>
      </div>
      ${phase.id === 'morning' ? `<div class="morning-rays"></div>` : ''}
      ${phase.id === 'dusk' ? `<div class="dusk-glow"></div>` : ''}
      ${phase.id === 'night' ? `
        <div class="night-stars">
          ${STARS.map(s => `<span class="star-dot" style="left:${s.x}%;top:${s.y}%;animation-delay:${s.d}s"></span>`).join('')}
        </div>
        <div class="cottage-window-bloom"></div>
        <div class="night-fireflies">
          ${FIREFLIES.map(f => `<span class="firefly" style="left:${f.x}%;top:${f.y}%;animation-delay:${f.delay}s;animation-duration:${f.dur}s"></span>`).join('')}
        </div>
      ` : ''}
    </div>

    ${showEmptyHint && items.length === 0 ? `
      <div class="empty-lawn-hint">
        <span>🌱 寬敞的恩典草地等你佈置！</span>
        <small>${interactive ? '點下方「🎒 收藏庫」放入物件，自由拖曳擺放' : '點擊畫面進入全螢幕大空間編輯與欣賞'}</small>
      </div>
    ` : ''}

    <div class="garden-items-layer">
      ${items.map(placed => {
        const def = getItemDef(placed.itemId);
        if (!def) return '';
        const depthScale = computeDepthScale(placed.yPct);
        const finalWidthPct = def.baseWidthPct * depthScale * (placed.scaleMult || 1.0);
        const isSleeping = phase.animalsSleep && def.category === 'animal' && def.spriteSleep;
        const isLit = phase.lightsOn && def.isLight;
        const spriteSrc = isSleeping ? def.spriteSleep : def.spriteAwake;
        const zIdx = Math.round(placed.yPct);
        const isSelected = interactive && !studioScreensaver && placed.uid === selectedUid;

        const imgFilter = isLit
          ? (phase.id === 'night'
              ? 'brightness(1.16) saturate(1.18) drop-shadow(0 0 12px rgba(255,212,110,0.88))'
              : 'brightness(1.08) saturate(1.10) drop-shadow(0 0 7px rgba(255,204,96,0.52))')
          : phase.itemFilter;

        return `
          <div class="placed-item ${isSelected ? 'is-selected' : ''} ${isSleeping ? 'is-sleeping' : ''} ${isLit ? 'is-lit' : ''} cat-${def.category}"
               data-uid="${placed.uid}"
               style="left:${placed.xPct}%; top:${placed.yPct}%; width:${finalWidthPct.toFixed(2)}%; z-index:${zIdx};">

            ${isLit ? `
              <div class="lamp-ground-glow ${phase.id === 'night' ? 'glow-strong' : 'glow-soft'}"></div>
              <div class="lamp-halo"></div>
            ` : ''}

            <div class="item-ground-shadow" style="opacity:${phase.shadowOpacity}; transform:translateX(-50%) ${phase.shadowSkew};"></div>

            <img class="placed-sprite"
                 src="${spriteSrc}"
                 alt="${def.name}${isSleeping ? '（夜間安歇中）' : ''}"
                 draggable="false"
                 style="filter:${imgFilter}; transform:${placed.flipX ? 'scaleX(-1)' : 'none'};">

            ${isSleeping ? `
              <div class="sleep-zzz" aria-hidden="true">
                <span class="z1">z</span><span class="z2">Z</span><span class="z3">z</span>
              </div>
            ` : ''}

            ${isSelected ? `
              <div class="item-toolbar" data-toolbar="true">
                <button data-item-act="flip" title="水平翻轉">↔</button>
                <button data-item-act="shrink" title="縮小">−</button>
                <button data-item-act="grow" title="放大">＋</button>
                <button data-item-act="remove" class="danger" title="收回倉庫">✕</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function buildTrayItemsHtml(stats, placedCountByItem, compact = false) {
  const filteredCatalog = GARDEN_ITEMS.filter(item => {
    if (trayCategory === 'all') return true;
    return item.category === trayCategory;
  });

  return filteredCatalog.map(item => {
    const owned = stats.inventoryStock.get(item.id) || 0;
    const placed = placedCountByItem.get(item.id) || 0;
    const remaining = Math.max(0, owned - placed);
    const unlocked = owned > 0;

    return `
      <button class="tray-item-card ${compact ? 'is-compact' : ''} ${unlocked ? (remaining > 0 ? 'is-unlocked' : 'is-all-placed') : 'is-locked'}"
              data-place-item="${item.id}"
              data-owned="${owned}"
              data-remaining="${remaining}">
        <div class="tray-thumb-wrap">
          <img src="${item.spriteAwake}" alt="${item.name}" loading="lazy">
          ${!unlocked ? '<span class="lock-overlay">🔒</span>' : ''}
          ${unlocked ? `<span class="placed-count-pill ${remaining === 0 ? 'depleted' : ''}">剩 ${remaining}/${owned}</span>` : ''}
          ${item.isLight ? `<span class="feature-dot" title="黃昏與夜晚會發光">💡</span>` : ''}
          ${item.category === 'animal' ? `<span class="feature-dot" title="夜晚會蜷縮睡覺">🌙</span>` : ''}
        </div>
        <div class="tray-item-name">${item.name}</div>
        ${!compact ? `
          <div class="tray-item-sub">
            ${!unlocked ? item.unlockText : (remaining > 0 ? '點選放上草地' : `已全部擺放（×${placed}）`)}
          </div>
        ` : ''}
      </button>
    `;
  }).join('');
}

// Coordinate-accurate drag handler that works BOTH normally AND when rotated 90° clockwise on portrait phones!
function bindStageDragging({ stageEl, phase, lifeController, isRotated90, rerender, showToast }) {
  if (!stageEl) return;

  stageEl.addEventListener('pointerdown', e => {
    if (studioOpen && studioScreensaver) {
      // Tap anywhere in pure screensaver mode to exit screensaver & bring back controls!
      studioScreensaver = false;
      rerender();
      return;
    }
    if (!e.target.closest('.placed-item')) {
      if (selectedUid) {
        selectedUid = null;
        rerender();
      }
    }
  });

  stageEl.querySelectorAll('.placed-item').forEach(itemEl => {
    const uid = itemEl.dataset.uid;

    itemEl.querySelectorAll('[data-item-act]').forEach(tbtn => {
      tbtn.addEventListener('pointerdown', e => e.stopPropagation());
      tbtn.addEventListener('click', e => {
        e.stopPropagation();
        const act = tbtn.dataset.itemAct;
        const current = store.state.gardenItems.find(i => i.uid === uid);
        if (!current) return;
        if (act === 'flip') {
          store.updateGardenItem(uid, { flipX: !current.flipX });
        } else if (act === 'shrink') {
          store.updateGardenItem(uid, { scaleMult: Number(((current.scaleMult || 1) - 0.12).toFixed(2)) });
        } else if (act === 'grow') {
          store.updateGardenItem(uid, { scaleMult: Number(((current.scaleMult || 1) + 0.12).toFixed(2)) });
        } else if (act === 'remove') {
          selectedUid = null;
          store.removeGardenItem(uid);
          showToast('📦 已收回收藏庫');
        }
      });
    });

    itemEl.addEventListener('pointerdown', e => {
      if (studioOpen && studioScreensaver) {
        studioScreensaver = false;
        rerender();
        return;
      }
      if (e.target.closest('[data-toolbar]')) return;
      e.preventDefault();
      e.stopPropagation();

      const current = store.state.gardenItems.find(i => i.uid === uid);
      if (!current) return;
      const def = getItemDef(current.itemId);

      // Pause wandering smoothly right under the user's finger
      lifeController.pauseUid(uid);

      const rect = stageEl.getBoundingClientRect();
      // Read live visual position in case the animal had wandered slightly
      const startLeft = parseFloat(itemEl.style.left) || current.xPct;
      const startTop = parseFloat(itemEl.style.top) || current.yPct;

      const startClientX = e.clientX;
      const startClientY = e.clientY;
      let moved = false;
      let latestX = startLeft;
      let latestY = startTop;

      itemEl.setPointerCapture(e.pointerId);
      itemEl.classList.add('is-dragging');

      const onMove = ev => {
        const rawDx = ev.clientX - startClientX;
        const rawDy = ev.clientY - startClientY;
        if (Math.abs(rawDx) > 4 || Math.abs(rawDy) > 4) moved = true;
        if (!moved) return;

        // Transform pointer delta into stage's local % coordinates!
        // When the full-screen wrapper is rotated 90° clockwise:
        // physical +Y (down) = stage +X (right), physical -X (left) = stage +Y (down)!
        let dXPct, dYPct;
        if (isRotated90) {
          dXPct = (rawDy / rect.height) * 100;
          dYPct = (-rawDx / rect.width) * 100;
        } else {
          dXPct = (rawDx / rect.width) * 100;
          dYPct = (rawDy / rect.height) * 100;
        }

        latestX = Math.max(6, Math.min(94, startLeft + dXPct));
        latestY = Math.max(36, Math.min(94, startTop + dYPct));

        const depthScale = computeDepthScale(latestY);
        const widthPct = def.baseWidthPct * depthScale * (current.scaleMult || 1.0);

        itemEl.style.left = `${latestX.toFixed(2)}%`;
        itemEl.style.top = `${latestY.toFixed(2)}%`;
        itemEl.style.width = `${widthPct.toFixed(2)}%`;
        itemEl.style.zIndex = String(Math.round(latestY));
      };

      const onUp = ev => {
        itemEl.classList.remove('is-dragging');
        try { itemEl.releasePointerCapture(ev.pointerId); } catch {}
        itemEl.removeEventListener('pointermove', onMove);
        itemEl.removeEventListener('pointerup', onUp);
        itemEl.removeEventListener('pointercancel', onUp);

        if (moved) {
          selectedUid = uid;
          store.updateGardenItem(uid, {
            xPct: Number(latestX.toFixed(2)),
            yPct: Number(latestY.toFixed(2))
          });
        } else {
          selectedUid = (selectedUid === uid) ? null : uid;
          rerender();
          if (selectedUid === uid) {
            const msg = (phase.animalsSleep && def.sleepNote)
              ? `🌙 ${def.sleepNote}`
              : `${def.name}：${def.verse}`;
            showToast(msg);
          }
        }
      };

      itemEl.addEventListener('pointermove', onMove);
      itemEl.addEventListener('pointerup', onUp);
      itemEl.addEventListener('pointercancel', onUp);
    });
  });
}

function getOrCreateStudioModal() {
  let el = document.getElementById('garden-studio-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'garden-studio-modal';
    el.className = 'studio-backdrop';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '全螢幕恩典花園編輯與欣賞模式');
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function syncClockTicker(modal) {
  clearInterval(clockTimer);
  if (studioOpen && studioScreensaver) {
    clockTimer = setInterval(() => {
      const clk = modal.querySelector('#screensaver-clock-time');
      if (clk) clk.textContent = formatClockNow();
    }, 10000);
  }
}

export function renderGardenView(container, { showToast }) {
  const state = store.state;
  const stats = store.getStats();
  const activePhaseKey = store.getActiveTimePhase();
  const phase = TIME_PHASES[activePhaseKey];
  const realPhase = TIME_PHASES[detectRealTimePhase()];

  if (selectedUid && !state.gardenItems.some(i => i.uid === selectedUid)) {
    selectedUid = null;
  }

  const placedCountByItem = new Map();
  for (const g of state.gardenItems) {
    placedCountByItem.set(g.itemId, (placedCountByItem.get(g.itemId) || 0) + 1);
  }

  const nextUnlockPreview = getRewardForPluckIndex(stats.effectivePlucked + 1);

  // === 1. NORMAL TAB VIEW: Compact Living Thumbnail Preview + Easy Entry to Full-Screen Studio ===
  container.innerHTML = `
    <div class="garden-wrap">
      <!-- 100-Verse Pikmin Seedling Unlock Bar -->
      <section class="card planter-card">
        <div class="planter-top">
          <div class="planter-left">
            <div class="planter-pot ${stats.readyToPluck > 0 ? 'is-ready' : ''}">
              <span>${stats.readyToPluck > 0 ? '🎁' : '🌱'}</span>
            </div>
            <div>
              <div class="planter-title">
                每讀 100 節獲得 1 件收藏 · 已擁有 <strong>${stats.totalOwnedObjects}</strong> 件
              </div>
              <div class="planter-sub">
                ${stats.readyToPluck > 0
                  ? `🎉 有 <strong>${stats.readyToPluck}</strong> 份新收藏成熟了！下一份將解鎖「<strong>${nextUnlockPreview.name}</strong>」`
                  : `再讀 ${100 - stats.nextSeedlingProgress} 節即可收成「<strong>${nextUnlockPreview.name}</strong>」（${stats.nextSeedlingProgress}/100 節）`}
              </div>
            </div>
          </div>
          ${stats.readyToPluck > 0 ? `
            <div class="pluck-btn-group">
              <button class="btn-pluck" data-act="pluck-seedling">🌱 拔起收藏 (${stats.readyToPluck})</button>
              ${stats.readyToPluck > 1 ? `<button class="btn-soft-sm" data-act="pluck-all">一次全收</button>` : ''}
            </div>
          ` : `<span class="pill-tag pill-mint">還差 ${100 - stats.nextSeedlingProgress} 節</span>`}
        </div>
        <div class="bar-track bar-thin">
          <div class="bar-fill bar-mint" style="width:${stats.readyToPluck > 0 ? 100 : stats.nextSeedlingProgress}%"></div>
        </div>
      </section>

      <!-- Compact Living Thumbnail Card -->
      <section class="card garden-preview-card">
        <div class="garden-header">
          <div>
            <h3>🏡 我的粉彩恩典花園</h3>
            <p class="garden-ambient-msg">${phase.emoji} ${phase.greeting}</p>
          </div>
        </div>

        <div class="time-switcher" role="group" aria-label="花園光影時段切換">
          <button class="time-btn ${state.timeMode === 'auto' ? 'active' : ''}" data-time-mode="auto">
            🕒 自動<small>(${realPhase.label})</small>
          </button>
          ${Object.values(TIME_PHASES).map(tp => `
            <button class="time-btn ${state.timeMode === tp.id ? 'active' : ''}" data-time-mode="${tp.id}">
              ${tp.emoji} ${tp.label}
            </button>
          `).join('')}
        </div>

        <!-- Clickable Live Thumbnail Preview (tapping opens Full-Screen Studio!) -->
        <div class="garden-thumb-shell" data-act="open-studio-edit" role="button" tabindex="0" aria-label="點擊進入全螢幕花園編輯與欣賞模式">
          <div class="garden-stage garden-stage-preview phase-${phase.id}" id="garden-stage-preview">
            ${buildGardenStageInnerHtml({
              phase,
              items: state.gardenItems,
              interactive: false,
              showEmptyHint: true
            })}
            <div class="garden-corner-badge">
              <span>${phase.emoji} ${phase.label}</span>
              <span class="sep">·</span>
              <span>已擺 ${state.gardenItems.length} 件</span>
              <span class="sep">·</span>
              <span>${phase.animalsSleep ? '💤 動物安歇' : '🐾 散步中'}</span>
            </div>
            <div class="thumb-hover-cta">
              <span>⛶ 點擊展開全螢幕大空間編輯</span>
            </div>
          </div>
        </div>

        <!-- Prominent Action Buttons for Mobile & Desktop -->
        <div class="studio-launch-row">
          <button class="btn-primary-full" data-act="open-studio-edit">
            ✏️ 全螢幕編輯花園（支援橫幅大畫面）
          </button>
          <button class="btn-soft-full" data-act="open-studio-screensaver">
            🖼️ 純淨螢幕欣賞模式（當作療癒桌布）
          </button>
        </div>
      </section>

      <!-- Garden Inventory Overview Card -->
      <section class="card tray-card">
        <div class="card-head-row">
          <div>
            <h3>🎒 花園收藏庫（22 種粉彩物件）</h3>
            <p class="muted-sm">已解鎖 ${stats.unlockedItemIds.size} / ${GARDEN_ITEMS.length} 種 · 累計 ${stats.totalOwnedObjects} 件（點選可直接進入全螢幕擺放）</p>
          </div>
        </div>

        <div class="filter-pills">
          <button class="filter-pill ${trayCategory === 'all' ? 'active' : ''}" data-tray-cat="all">全部 (${GARDEN_ITEMS.length})</button>
          <button class="filter-pill ${trayCategory === 'animal' ? 'active' : ''}" data-tray-cat="animal">🐑 動物 (5)</button>
          <button class="filter-pill ${trayCategory === 'light' ? 'active' : ''}" data-tray-cat="light">🏮 燈飾 (3)</button>
          <button class="filter-pill ${trayCategory === 'plant' ? 'active' : ''}" data-tray-cat="plant">🌷 花木 (6)</button>
          <button class="filter-pill ${trayCategory === 'structure' ? 'active' : ''}" data-tray-cat="structure">🏡 建築 (8)</button>
        </div>

        <div class="tray-grid">
          ${buildTrayItemsHtml(stats, placedCountByItem, false)}
        </div>
      </section>
    </div>
  `;

  // Start gentle wandering animations on the live thumbnail preview (only when studio is closed)
  const previewStage = container.querySelector('#garden-stage-preview');
  if (!studioOpen) {
    previewLife.attach(previewStage, state.gardenItems, {
      animalsSleep: phase.animalsSleep,
      selectedUid: null
    });
  } else {
    previewLife.stopAll();
  }

  // Bind Preview Tab Events
  container.querySelector('[data-act="pluck-seedling"]')?.addEventListener('click', () => {
    const res = store.pluckSeedling();
    if (res) {
      showToast(res.isNewSpecies
        ? `🎉 解鎖全新收藏「${res.name}」！快進入全螢幕花園擺放吧！`
        : `🎁 收成「${res.name}」（共擁有 ×${res.newQty}）！`);
    }
  });

  container.querySelector('[data-act="pluck-all"]')?.addEventListener('click', () => {
    const n = store.pluckAllSeedlings();
    if (n > 0) showToast(`🎉 已一次收成 ${n} 份讀經收藏！`);
  });

  container.querySelectorAll('[data-time-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.timeMode;
      store.setTimeMode(mode);
      const tp = TIME_PHASES[store.getActiveTimePhase()];
      if (mode === 'night') showToast('🌙 夜幕降臨：動物都蜷縮睡著了，所有燈飾亮起！');
      else if (mode === 'dusk') showToast('🌇 黃昏時刻：小屋與花園明燈漸漸點亮');
      else showToast(`${tp.emoji} 已切換至「${tp.label}」光影`);
    });
  });

  const openStudio = ({ screensaver = false, autoLandscapeOnPortrait = false, openDrawer = false } = {}) => {
    studioOpen = true;
    studioScreensaver = screensaver;
    studioDrawerOpen = openDrawer;
    // Automatically enable crisp landscape rotation on narrow portrait phones for maximum space!
    const isPortraitMobile = window.innerWidth <= 560 && window.innerHeight > window.innerWidth;
    studioRotateLandscape = autoLandscapeOnPortrait && isPortraitMobile;
    studioZoom = 1.0;
    document.body.classList.add('studio-lock-scroll');
    renderStudioOverlay({ showToast, rerenderParent: () => renderGardenView(container, { showToast }) });
  };

  container.querySelectorAll('[data-act="open-studio-edit"]').forEach(el => {
    el.addEventListener('click', () => openStudio({ screensaver: false, autoLandscapeOnPortrait: true, openDrawer: false }));
  });

  container.querySelector('[data-act="open-studio-screensaver"]')?.addEventListener('click', () => {
    openStudio({ screensaver: true, autoLandscapeOnPortrait: true, openDrawer: false });
    showToast('🖼️ 已進入純淨欣賞模式，點一下畫面即可顯示控制列');
  });

  container.querySelectorAll('[data-tray-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      trayCategory = btn.dataset.trayCat;
      renderGardenView(container, { showToast });
    });
  });

  // Tapping an item in the main tab tray adds it AND immediately opens full-screen editor to place it nicely!
  container.querySelectorAll('[data-place-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.placeItem;
      const owned = Number(btn.dataset.owned);
      const remaining = Number(btn.dataset.remaining);
      const def = getItemDef(itemId);
      if (owned <= 0) {
        showToast(`🔒 尚未解鎖「${def.name}」：${def.unlockText}`);
        return;
      }
      if (remaining <= 0) {
        showToast(`📦 擁有的 ${owned} 件「${def.name}」都已擺在花園囉！`);
        return;
      }
      const randX = 34 + Math.round(Math.random() * 44);
      const randY = 50 + Math.round(Math.random() * 34);
      const placed = store.addGardenItem(itemId, randX, randY);
      if (placed) {
        selectedUid = placed.uid;
        openStudio({ screensaver: false, autoLandscapeOnPortrait: true, openDrawer: false });
        showToast(`✨ 已放入「${def.name}」，在全螢幕草地上自由拖曳到理想位置吧！`);
      }
    });
  });

  // Keep studio synced whenever store notifies while studio is open
  if (studioOpen) {
    renderStudioOverlay({ showToast, rerenderParent: () => renderGardenView(container, { showToast }) });
  } else {
    const modal = document.getElementById('garden-studio-modal');
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
      studioLife.stopAll();
      clearInterval(clockTimer);
    }
  }
}

// === 2. FULL-SCREEN LANDSCAPE STUDIO & SCREENSAVER OVERLAY ===
function renderStudioOverlay({ showToast, rerenderParent }) {
  lastStudioCallbacks = { showToast, rerenderParent };
  const modal = getOrCreateStudioModal();
  const state = store.state;
  const stats = store.getStats();
  const activePhaseKey = store.getActiveTimePhase();
  const phase = TIME_PHASES[activePhaseKey];
  const realPhase = TIME_PHASES[detectRealTimePhase()];

  const placedCountByItem = new Map();
  for (const g of state.gardenItems) {
    placedCountByItem.set(g.itemId, (placedCountByItem.get(g.itemId) || 0) + 1);
  }

  const isPortraitScreen = window.innerHeight > window.innerWidth;
  const useRotated90 = studioRotateLandscape && isPortraitScreen;

  modal.className = `studio-backdrop show ${useRotated90 ? 'is-rotated-90' : ''} ${studioScreensaver ? 'is-screensaver' : ''} phase-${phase.id}`;
  modal.setAttribute('aria-hidden', 'false');

  modal.innerHTML = `
    <!-- Soft blurred ambient fill behind the 1:1 garden canvas so landscape screens have zero harsh black bars -->
    <div class="studio-ambient-blur" style="background-image:url('${phase.backdrop}')" aria-hidden="true"></div>

    <div class="studio-surface">
      <!-- Top Floating Control Bar (Hidden in pure Screensaver mode) -->
      <header class="studio-topbar">
        <div class="studio-top-left">
          <button class="studio-pill-btn primary-exit" data-st="close">◀ 返回</button>
          ${isPortraitScreen ? `
            <button class="studio-pill-btn ${useRotated90 ? 'is-on' : ''}" data-st="toggle-rotate" title="直向手機一鍵橫幅滿版">
              🔄 ${useRotated90 ? '轉回直向' : '橫幅模式'}
            </button>
          ` : ''}
          <button class="studio-pill-btn" data-st="toggle-screensaver" title="隱藏介面純淨欣賞">
            🖼️ 純淨欣賞
          </button>
        </div>

        <div class="studio-time-pills" role="group" aria-label="光影切換">
          <button class="st-time-btn ${state.timeMode === 'auto' ? 'active' : ''}" data-st-time="auto">🕒<small>${realPhase.label}</small></button>
          ${Object.values(TIME_PHASES).map(tp => `
            <button class="st-time-btn ${state.timeMode === tp.id ? 'active' : ''}" data-st-time="${tp.id}">${tp.emoji}</button>
          `).join('')}
        </div>

        <div class="studio-top-right">
          <button class="studio-pill-btn" data-st="cycle-zoom" title="縮放草地檢視">🔍 ${Math.round(studioZoom * 100)}%</button>
          <button class="studio-pill-btn" data-st="showcase" title="一鍵參考擺設">✨ 擺設</button>
          <button class="studio-pill-btn" data-st="clear" title="全部收回">🧹</button>
        </div>
      </header>

      <!-- Main Full-Screen Canvas Viewport -->
      <div class="studio-canvas-viewport ${studioFillCover && studioScreensaver ? 'fill-cover' : ''}">
        <div class="studio-zoom-wrap" style="transform:scale(${studioZoom});">
          <div class="garden-stage garden-stage-studio phase-${phase.id}" id="garden-stage-studio">
            ${buildGardenStageInnerHtml({
              phase,
              items: state.gardenItems,
              interactive: true,
              showEmptyHint: !studioScreensaver
            })}
          </div>
        </div>
      </div>

      <!-- Subtle Floating Ambient Clock & Verse Overlay in Open Upper-Right Sky (Pure Screensaver Mode) -->
      ${studioScreensaver ? `
        ${studioShowClock ? `
          <div class="ss-clock-corner">
            <div class="ss-time-row">
              <span class="ss-phase-tag">${phase.emoji} ${phase.label}</span>
              <span id="screensaver-clock-time">${formatClockNow()}</span>
            </div>
            <div class="ss-verse">${phase.animalsSleep ? '「我必安然躺下睡覺，因為獨有你耶和華使我安然居住。」詩 4:8' : '「他使我躺臥在青草地上，領我在可安歇的水邊。」詩 23:2'}</div>
          </div>
        ` : ''}
        <div class="ss-micro-corner">
          <button class="ss-chip-btn" data-st="toggle-clock">${studioShowClock ? '隱藏時鐘' : '顯示時鐘'}</button>
          <button class="ss-chip-btn" data-st="toggle-cover">${studioFillCover ? '完整顯示' : '滿版填滿'}</button>
          <button class="ss-chip-btn" data-st="exit-screensaver">✏️ 編輯</button>
        </div>
      ` : ''}

      <!-- Bottom-Right Compact Floating Inventory FAB Icon (Opens Drawer on Tap!) -->
      ${!studioScreensaver ? `
        ${!studioDrawerOpen ? `
          <button class="studio-fab-bag" data-st="toggle-drawer" aria-label="開啟花園收藏庫" title="開啟收藏庫擺放物件">
            <span class="fab-ico">🎒</span>
            <span class="fab-badge">${Math.max(0, stats.totalOwnedObjects - state.gardenItems.length)}</span>
          </button>
        ` : `
          <div class="studio-bottom-dock is-open">
            <div class="studio-drawer-body">
              <div class="studio-drawer-head">
                <div class="filter-pills studio-filter-pills">
                  <button class="filter-pill ${trayCategory === 'all' ? 'active' : ''}" data-st-cat="all">全部</button>
                  <button class="filter-pill ${trayCategory === 'animal' ? 'active' : ''}" data-st-cat="animal">🐑 動物</button>
                  <button class="filter-pill ${trayCategory === 'light' ? 'active' : ''}" data-st-cat="light">🏮 燈飾</button>
                  <button class="filter-pill ${trayCategory === 'plant' ? 'active' : ''}" data-st-cat="plant">🌷 花木</button>
                  <button class="filter-pill ${trayCategory === 'structure' ? 'active' : ''}" data-st-cat="structure">🏡 建築</button>
                </div>
                <button class="studio-drawer-close" data-st="toggle-drawer" aria-label="收合收藏庫">✕</button>
              </div>
              <div class="studio-tray-strip">
                ${buildTrayItemsHtml(stats, placedCountByItem, true)}
              </div>
            </div>
          </div>
        `}
      ` : ''}
    </div>
  `;

  // Start living wandering animations on the full-screen stage!
  const studioStage = modal.querySelector('#garden-stage-studio');
  previewLife.stopAll();
  studioLife.attach(studioStage, state.gardenItems, {
    animalsSleep: phase.animalsSleep,
    selectedUid: studioScreensaver ? null : selectedUid
  });

  // Bind free-form drag with rotation-aware coordinates!
  bindStageDragging({
    stageEl: studioStage,
    phase,
    lifeController: studioLife,
    isRotated90: useRotated90,
    rerender: () => renderStudioOverlay({ showToast, rerenderParent }),
    showToast
  });

  syncClockTicker(modal);

  // Bind Studio Control Buttons
  const closeStudio = () => {
    studioOpen = false;
    studioScreensaver = false;
    studioDrawerOpen = false;
    studioRotateLandscape = false;
    selectedUid = null;
    studioLife.stopAll();
    clearInterval(clockTimer);
    document.body.classList.remove('studio-lock-scroll');
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    rerenderParent();
  };

  modal.querySelector('[data-st="close"]')?.addEventListener('click', closeStudio);

  modal.querySelector('[data-st="toggle-rotate"]')?.addEventListener('click', () => {
    studioRotateLandscape = !studioRotateLandscape;
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelector('[data-st="toggle-screensaver"]')?.addEventListener('click', () => {
    selectedUid = null;
    studioDrawerOpen = false;
    studioScreensaver = true;
    studioZoom = 1.0;
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelector('[data-st="exit-screensaver"]')?.addEventListener('click', e => {
    e.stopPropagation();
    studioScreensaver = false;
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelector('[data-st="toggle-clock"]')?.addEventListener('click', e => {
    e.stopPropagation();
    studioShowClock = !studioShowClock;
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelector('[data-st="toggle-cover"]')?.addEventListener('click', e => {
    e.stopPropagation();
    studioFillCover = !studioFillCover;
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelector('[data-st="cycle-zoom"]')?.addEventListener('click', () => {
    const steps = [1.0, 1.25, 1.5];
    const idx = steps.indexOf(studioZoom);
    studioZoom = steps[(idx + 1) % steps.length];
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelector('[data-st="showcase"]')?.addEventListener('click', () => {
    selectedUid = null;
    store.applyShowcaseLayout();
    showToast('✨ 已套用參考擺設，您仍可任意拖曳調整！');
  });

  modal.querySelector('[data-st="clear"]')?.addEventListener('click', () => {
    if (store.state.gardenItems.length === 0) return;
    selectedUid = null;
    store.clearGarden();
    showToast('🧹 已全部收回收藏庫');
  });

  modal.querySelector('[data-st="toggle-drawer"]')?.addEventListener('click', () => {
    studioDrawerOpen = !studioDrawerOpen;
    renderStudioOverlay({ showToast, rerenderParent });
  });

  modal.querySelectorAll('[data-st-time]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.stTime;
      store.setTimeMode(mode);
      const tp = TIME_PHASES[store.getActiveTimePhase()];
      if (mode === 'night') showToast('🌙 夜晚模式：小動物蜷縮入睡，所有明燈點亮！');
      else showToast(`${tp.emoji} 切換至「${tp.label}」光影`);
    });
  });

  modal.querySelectorAll('[data-st-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      trayCategory = btn.dataset.stCat;
      renderStudioOverlay({ showToast, rerenderParent });
    });
  });

  modal.querySelectorAll('[data-place-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.placeItem;
      const owned = Number(btn.dataset.owned);
      const remaining = Number(btn.dataset.remaining);
      const def = getItemDef(itemId);
      if (owned <= 0) {
        showToast(`🔒 尚未解鎖「${def.name}」：${def.unlockText}`);
        return;
      }
      if (remaining <= 0) {
        showToast(`📦 擁有的 ${owned} 件「${def.name}」已全部擺上草地！`);
        return;
      }
      const randX = 32 + Math.round(Math.random() * 46);
      const randY = 48 + Math.round(Math.random() * 36);
      const placed = store.addGardenItem(itemId, randX, randY);
      if (placed) {
        selectedUid = placed.uid;
        studioDrawerOpen = false; // Auto-collapse drawer so user immediately sees full lawn to drag!
        renderStudioOverlay({ showToast, rerenderParent });
        showToast(`✨ 已放上「${def.name}」，直接拖曳到想要的位置吧！`);
      }
    });
  });
}
