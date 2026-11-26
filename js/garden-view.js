// Living 4-Time-of-Day Free-Form Interactive Garden (Style B: Korean Pastel Colored-Pencil Storybook)
// - Wide-open empty initial canvas with generous space for year-long 100-verse collection (311 total unlocks!)
// - 4 pixel-aligned lighting scenes (Morning / Noon / Dusk / Night) with Auto real-time or manual preview
// - 5 animals curl up & sleep with Zzz bubbles at Night; 3 lamps glow with warm pools of light at Dusk & Night

import {
  TIME_PHASES,
  GARDEN_ITEMS,
  getItemDef,
  getRewardForPluckIndex,
  detectRealTimePhase
} from './garden-catalog.js';
import { store } from './state.js';

let selectedUid = null;
let trayCategory = 'all'; // 'all' | 'animal' | 'light' | 'plant' | 'structure'

// Perspective scale tuned for the wide-open Style B lawn (allows 20-40+ items cleanly!)
function computeDepthScale(yPct) {
  const norm = Math.max(0, Math.min(1, (yPct - 36) / 58));
  return 0.56 + norm * 0.56; // 0.56x near back fence -> 1.12x in foreground
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

export function renderGardenView(container, { showToast }) {
  const state = store.state;
  const stats = store.getStats();
  const activePhaseKey = store.getActiveTimePhase();
  const phase = TIME_PHASES[activePhaseKey];
  const realPhase = TIME_PHASES[detectRealTimePhase()];

  if (selectedUid && !state.gardenItems.some(i => i.uid === selectedUid)) {
    selectedUid = null;
  }

  const filteredCatalog = GARDEN_ITEMS.filter(item => {
    if (trayCategory === 'all') return true;
    return item.category === trayCategory;
  });

  const placedCountByItem = new Map();
  for (const g of state.gardenItems) {
    placedCountByItem.set(g.itemId, (placedCountByItem.get(g.itemId) || 0) + 1);
  }

  const nextUnlockPreview = getRewardForPluckIndex(stats.effectivePlucked + 1);

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

      <!-- Main Living Garden Card -->
      <section class="card garden-stage-card">
        <div class="garden-header">
          <div>
            <h3>🏡 我的粉彩恩典花園</h3>
            <p class="garden-ambient-msg">${phase.emoji} ${phase.greeting}</p>
          </div>
          <div class="garden-quick-btns">
            <button class="btn-soft-sm" data-act="showcase-layout" title="自動依目前已擁有收藏示範擺放">✨ 參考擺設</button>
            <button class="btn-soft-sm" data-act="clear-garden" title="收回所有物件，恢復寬敞空地">🧹 全部收回</button>
          </div>
        </div>

        <!-- 4 Time-of-Day Switcher -->
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

        <!-- Wide-Open 4-Time Crossfading Interactive Stage -->
        <div class="garden-stage phase-${phase.id}" id="garden-stage" data-phase="${phase.id}">
          <img class="garden-bg ${phase.id === 'morning' ? 'active' : ''}" src="assets/garden/garden_morning.jpg" alt="早晨粉彩花園" draggable="false">
          <img class="garden-bg ${phase.id === 'noon' ? 'active' : ''}"    src="assets/garden/garden_noon.jpg"    alt="中午粉彩花園" draggable="false">
          <img class="garden-bg ${phase.id === 'dusk' ? 'active' : ''}"    src="assets/garden/garden_dusk.jpg"    alt="黃昏粉彩花園" draggable="false">
          <img class="garden-bg ${phase.id === 'night' ? 'active' : ''}"   src="assets/garden/garden_night.jpg"   alt="夜晚粉彩花園" draggable="false">

          <!-- Atmospheric Light & Weather Layer -->
          <div class="garden-atmosphere" aria-hidden="true">
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

          <!-- Empty Spacious Lawn Welcome Hint -->
          ${state.gardenItems.length === 0 ? `
            <div class="empty-lawn-hint">
              <span>🌱 寬敞的恩典草地等你佈置！</span>
              <small>點擊下方收藏庫物件放入草地，可自由拖曳到任何角落</small>
            </div>
          ` : ''}

          <!-- Free-Form Placed Garden Items Layer -->
          <div class="garden-items-layer" id="garden-items-layer">
            ${state.gardenItems.map(placed => {
              const def = getItemDef(placed.itemId);
              if (!def) return '';
              const depthScale = computeDepthScale(placed.yPct);
              const finalWidthPct = def.baseWidthPct * depthScale * (placed.scaleMult || 1.0);
              const isSleeping = phase.animalsSleep && def.category === 'animal' && def.spriteSleep;
              const isLit = phase.lightsOn && def.isLight;
              const spriteSrc = isSleeping ? def.spriteSleep : def.spriteAwake;
              const zIdx = Math.round(placed.yPct);
              const isSelected = placed.uid === selectedUid;

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

          <div class="garden-corner-badge">
            <span>${phase.emoji} ${phase.label}</span>
            <span class="sep">·</span>
            <span>已擺 ${state.gardenItems.length} 件</span>
            <span class="sep">·</span>
            <span>${phase.animalsSleep ? '💤 動物安歇' : (phase.lightsOn ? '🏮 燈火亮起' : '✨ 自由拖曳')}</span>
          </div>
        </div>

        <div class="garden-tip-bar">
          💡 <strong>佈置說明：</strong>初始草地保持空曠，讓您隨一年讀經進度自由設計！每讀滿 <strong>100 節</strong> 就獲得 1 件新收藏（整本聖經共可累積 311 件），點選物件即可放上草地並自由拖曳、縮放與翻轉。
        </div>
      </section>

      <!-- Garden Inventory Tray (22 Style B Items with Live Owned Stock!) -->
      <section class="card tray-card">
        <div class="card-head-row">
          <div>
            <h3>🎒 花園收藏庫（22 種粉彩物件）</h3>
            <p class="muted-sm">已解鎖 ${stats.unlockedItemIds.size} / ${GARDEN_ITEMS.length} 種圖鑑 · 總計擁有 ${stats.totalOwnedObjects} 件（已擺放 ${state.gardenItems.length} 件）</p>
          </div>
        </div>

        <div class="filter-pills">
          <button class="filter-pill ${trayCategory === 'all' ? 'active' : ''}" data-tray-cat="all">全部 (${GARDEN_ITEMS.length})</button>
          <button class="filter-pill ${trayCategory === 'animal' ? 'active' : ''}" data-tray-cat="animal">🐑 動物夥伴 (5)</button>
          <button class="filter-pill ${trayCategory === 'light' ? 'active' : ''}" data-tray-cat="light">🏮 光影燈飾 (3)</button>
          <button class="filter-pill ${trayCategory === 'plant' ? 'active' : ''}" data-tray-cat="plant">🌷 花木植栽 (6)</button>
          <button class="filter-pill ${trayCategory === 'structure' ? 'active' : ''}" data-tray-cat="structure">🏡 建築擺飾 (8)</button>
        </div>

        <div class="tray-grid">
          ${filteredCatalog.map(item => {
            const owned = stats.inventoryStock.get(item.id) || 0;
            const placed = placedCountByItem.get(item.id) || 0;
            const remaining = Math.max(0, owned - placed);
            const unlocked = owned > 0;

            return `
              <button class="tray-item-card ${unlocked ? (remaining > 0 ? 'is-unlocked' : 'is-all-placed') : 'is-locked'}"
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
                <div class="tray-item-sub">
                  ${!unlocked ? item.unlockText : (remaining > 0 ? '點選放上草地' : `已全部擺放（×${placed}）`)}
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;

  // === BIND EVENTS ===

  container.querySelector('[data-act="pluck-seedling"]')?.addEventListener('click', () => {
    const res = store.pluckSeedling();
    if (res) {
      const msg = res.isNewSpecies
        ? `🎉 解鎖全新收藏「${res.name}」！已放入下方收藏庫，快擺上草地吧！`
        : `🎁 收成「${res.name}」（目前共擁有 ×${res.newQty}）！快去佈置更豐盛的花園吧！`;
      showToast(msg);
    }
  });

  container.querySelector('[data-act="pluck-all"]')?.addEventListener('click', () => {
    const n = store.pluckAllSeedlings();
    if (n > 0) {
      showToast(`🎉 已一次收成 ${n} 份讀經收藏，全部放入花園收藏庫囉！`);
    }
  });

  container.querySelectorAll('[data-time-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.timeMode;
      store.setTimeMode(mode);
      const targetPhase = TIME_PHASES[store.getActiveTimePhase()];
      if (mode === 'auto') {
        showToast(`🕒 已切換為自動光影（目前時段：${targetPhase.emoji} ${targetPhase.label}）`);
      } else if (mode === 'night') {
        showToast('🌙 夜幕降臨：小動物們已蜷縮入睡，所有燈飾自動點亮！');
      } else if (mode === 'dusk') {
        showToast('🌇 黃昏時刻：粉彩夕陽與暖黃燈火柔和亮起');
      } else {
        showToast(`${targetPhase.emoji} 已切換至「${targetPhase.label}」光影`);
      }
    });
  });

  container.querySelector('[data-act="showcase-layout"]')?.addEventListener('click', () => {
    selectedUid = null;
    store.applyShowcaseLayout();
    showToast('✨ 已依您目前擁有的收藏套用參考擺設，仍可自由拖曳微調！');
  });

  container.querySelector('[data-act="clear-garden"]')?.addEventListener('click', () => {
    if (store.state.gardenItems.length === 0) return;
    selectedUid = null;
    store.clearGarden();
    showToast('🧹 已將所有物件收回收藏庫，草地恢復寬敞空曠！');
  });

  container.querySelectorAll('[data-tray-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      trayCategory = btn.dataset.trayCat;
      renderGardenView(container, { showToast });
    });
  });

  container.querySelectorAll('[data-place-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.placeItem;
      const owned = Number(btn.dataset.owned);
      const remaining = Number(btn.dataset.remaining);
      const def = getItemDef(itemId);
      if (owned <= 0) {
        showToast(`🔒 尚未解鎖「${def.name}」：${def.unlockText}（每 100 節拔起花苗即可依序解鎖）`);
        return;
      }
      if (remaining <= 0) {
        showToast(`📦 您擁有的 ${owned} 件「${def.name}」都已擺在花園裡囉！繼續讀經每 100 節可再累積更多件`);
        return;
      }
      const randX = 30 + Math.round(Math.random() * 52);
      const randY = 48 + Math.round(Math.random() * 38);
      const placed = store.addGardenItem(itemId, randX, randY);
      if (placed) {
        selectedUid = placed.uid;
        renderGardenView(container, { showToast });
        showToast(`✨ 已將「${def.name}」放上草地！按住可拖曳到任意位置`);
        document.getElementById('garden-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  // Free-form Pointer Drag & Drop + Selection inside Garden Stage
  const stageEl = container.querySelector('#garden-stage');
  if (stageEl) {
    stageEl.addEventListener('pointerdown', e => {
      if (!e.target.closest('.placed-item')) {
        if (selectedUid) {
          selectedUid = null;
          renderGardenView(container, { showToast });
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
            showToast('📦 已收回收藏庫，隨時可再擺放');
          }
        });
      });

      itemEl.addEventListener('pointerdown', e => {
        if (e.target.closest('[data-toolbar]')) return;
        e.preventDefault();
        e.stopPropagation();

        const rect = stageEl.getBoundingClientRect();
        const current = store.state.gardenItems.find(i => i.uid === uid);
        if (!current) return;
        const def = getItemDef(current.itemId);

        const startX = e.clientX;
        const startY = e.clientY;
        const origXPct = current.xPct;
        const origYPct = current.yPct;
        let moved = false;
        let latestX = origXPct;
        let latestY = origYPct;

        itemEl.setPointerCapture(e.pointerId);
        itemEl.classList.add('is-dragging');

        const onMove = ev => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved = true;
          if (!moved) return;

          latestX = Math.max(6, Math.min(94, origXPct + (dx / rect.width) * 100));
          latestY = Math.max(36, Math.min(94, origYPct + (dy / rect.height) * 100));

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
            renderGardenView(container, { showToast });
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
}
