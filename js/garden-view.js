// Living 4-Time-of-Day Free-Form Interactive Garden (Morning / Noon / Dusk / Night)
// Features:
// - Pixel-aligned cross-fade backdrops for Morning, Noon, Dusk, Night (Auto real-time OR manual preview)
// - Nighttime behavior: Animals curl up & sleep with Zzz bubbles; Lamps/Lanterns glow & cast warm pools of light!
// - Free-form drag-and-drop placement anywhere on the lawn with automatic perspective depth scaling & Y-sorted z-index
// - Pikmin-style Seedling Planter (pluck a new companion every 100 verses!)

import {
  TIME_PHASES,
  GARDEN_ITEMS,
  getItemDef,
  detectRealTimePhase
} from './garden-catalog.js';
import { store } from './state.js';

let selectedUid = null;
let trayCategory = 'all'; // 'all' | 'animal' | 'light' | 'plant' | 'structure'

// Perspective scale factor based on vertical Y position (farther back near cottage = smaller, foreground = larger)
function computeDepthScale(yPct) {
  const norm = Math.max(0, Math.min(1, (yPct - 35) / 57));
  return 0.58 + norm * 0.62; // 0.58x in back -> 1.20x in foreground
}

// Generate deterministic fireflies / sun-motes positions
const FIREFLIES = [
  { x: 14, y: 62, delay: 0.0, dur: 4.2 },
  { x: 24, y: 54, delay: 1.1, dur: 5.0 },
  { x: 18, y: 74, delay: 2.3, dur: 4.7 },
  { x: 38, y: 66, delay: 0.7, dur: 5.5 },
  { x: 64, y: 58, delay: 1.8, dur: 4.5 },
  { x: 78, y: 68, delay: 0.4, dur: 5.2 },
  { x: 86, y: 52, delay: 2.6, dur: 4.8 },
  { x: 52, y: 79, delay: 1.5, dur: 5.8 },
  { x: 31, y: 84, delay: 2.0, dur: 4.4 }
];

const STARS = [
  { x: 12, y: 8, d: 0.2 }, { x: 26, y: 14, d: 1.1 }, { x: 41, y: 7, d: 0.6 },
  { x: 55, y: 12, d: 1.7 }, { x: 67, y: 6, d: 0.4 }, { x: 74, y: 18, d: 2.1 },
  { x: 88, y: 9, d: 0.9 }, { x: 34, y: 20, d: 1.4 }, { x: 61, y: 22, d: 0.3 }
];

export function renderGardenView(container, { showToast }) {
  const state = store.state;
  const stats = store.getStats();
  const activePhaseKey = store.getActiveTimePhase();
  const phase = TIME_PHASES[activePhaseKey];
  const realPhase = TIME_PHASES[detectRealTimePhase()];

  // Ensure selectedUid still exists
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

  container.innerHTML = `
    <div class="garden-wrap">
      <!-- Pikmin-Style Seedling Planter Bar -->
      <section class="card planter-card">
        <div class="planter-top">
          <div class="planter-left">
            <div class="planter-pot ${stats.readyToPluck > 0 ? 'is-ready' : ''}">
              <span>${stats.readyToPluck > 0 ? '🌷' : '🌱'}</span>
            </div>
            <div>
              <div class="planter-title">
                靈糧花盆 · 已陪伴夥伴 <strong>${state.pluckedCount}</strong> 位
              </div>
              <div class="planter-sub">
                ${stats.readyToPluck > 0
                  ? `🎉 有 <strong>${stats.readyToPluck}</strong> 株花苗已經成熟，快把它拔起來加入花園！`
                  : `每讀滿 100 節長出一株花苗（目前 ${stats.nextSeedlingProgress} / 100 節）`}
              </div>
            </div>
          </div>
          ${stats.readyToPluck > 0
            ? `<button class="btn-pluck" data-act="pluck-seedling">🌱 拔起來！(${stats.readyToPluck})</button>`
            : `<span class="pill-tag pill-mint">還差 ${100 - stats.nextSeedlingProgress} 節</span>`}
        </div>
        <div class="bar-track bar-thin">
          <div class="bar-fill bar-mint" style="width:${stats.readyToPluck > 0 ? 100 : stats.nextSeedlingProgress}%"></div>
        </div>
      </section>

      <!-- Main Living Garden Card -->
      <section class="card garden-stage-card">
        <!-- Time-of-Day Lighting Header & Switcher -->
        <div class="garden-header">
          <div>
            <h3>🏡 我的恩典花園</h3>
            <p class="garden-ambient-msg">${phase.emoji} ${phase.greeting}</p>
          </div>
          <div class="garden-quick-btns">
            <button class="btn-soft-sm" data-act="showcase-layout" title="套用精美示範擺設">✨ 推薦擺設</button>
            <button class="btn-soft-sm" data-act="clear-garden" title="清空花園物件">🧹 清空</button>
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

        <!-- 4-Time Crossfading Interactive Free-Form Stage -->
        <div class="garden-stage phase-${phase.id}" id="garden-stage" data-phase="${phase.id}">
          <!-- Pixel-aligned 4 Time-of-Day Backdrops -->
          <img class="garden-bg ${phase.id === 'morning' ? 'active' : ''}" src="assets/garden/garden_morning.jpg" alt="早晨花園" draggable="false">
          <img class="garden-bg ${phase.id === 'noon' ? 'active' : ''}"    src="assets/garden/garden_noon.jpg"    alt="中午花園" draggable="false">
          <img class="garden-bg ${phase.id === 'dusk' ? 'active' : ''}"    src="assets/garden/garden_dusk.jpg"    alt="黃昏花園" draggable="false">
          <img class="garden-bg ${phase.id === 'night' ? 'active' : ''}"   src="assets/garden/garden_night.jpg"   alt="夜晚花園" draggable="false">

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

              // Light sources stay warmly illuminated at dusk/night instead of being darkened!
              const imgFilter = isLit
                ? (phase.id === 'night' ? 'brightness(1.15) saturate(1.22) drop-shadow(0 0 12px rgba(255,204,92,0.85))' : 'brightness(1.08) saturate(1.12) drop-shadow(0 0 8px rgba(255,196,86,0.55))')
                : phase.itemFilter;

              return `
                <div class="placed-item ${isSelected ? 'is-selected' : ''} ${isSleeping ? 'is-sleeping' : ''} ${isLit ? 'is-lit' : ''} cat-${def.category}"
                     data-uid="${placed.uid}"
                     style="left:${placed.xPct}%; top:${placed.yPct}%; width:${finalWidthPct.toFixed(2)}%; z-index:${zIdx};">

                  <!-- Dynamic Warm Light Pool on Grass for Lamps at Dusk & Night -->
                  ${isLit ? `
                    <div class="lamp-ground-glow ${phase.id === 'night' ? 'glow-strong' : 'glow-soft'}"></div>
                    <div class="lamp-halo"></div>
                  ` : ''}

                  <!-- Soft Perspective Ground Shadow -->
                  <div class="item-ground-shadow" style="opacity:${phase.shadowOpacity}; transform:translateX(-50%) ${phase.shadowSkew};"></div>

                  <!-- Illustrated Transparent Sprite -->
                  <img class="placed-sprite"
                       src="${spriteSrc}"
                       alt="${def.name}${isSleeping ? '（夜間安歇中）' : ''}"
                       draggable="false"
                       style="filter:${imgFilter}; transform:${placed.flipX ? 'scaleX(-1)' : 'none'};">

                  <!-- Nighttime Sleeping Zzz Bubbles for Resting Animals -->
                  ${isSleeping ? `
                    <div class="sleep-zzz" aria-hidden="true">
                      <span class="z1">z</span><span class="z2">Z</span><span class="z3">z</span>
                    </div>
                  ` : ''}

                  <!-- Selection Controls Popover -->
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

          <!-- Live Status Pill in Garden Corner -->
          <div class="garden-corner-badge">
            <span>${phase.emoji} ${phase.label}</span>
            <span class="sep">·</span>
            <span>${phase.animalsSleep ? '💤 動物安歇中' : (phase.lightsOn ? '🏮 燈火已點亮' : '✨ 自由拖曳擺放')}</span>
          </div>
        </div>

        <div class="garden-tip-bar">
          💡 <strong>操作小提示：</strong>點選下方收藏放入花園，<strong>按住即可拖曳到草地上任意位置</strong>（越遠越小、越近越大！）。點擊已放置物件可翻轉、縮放或收回。
        </div>
      </section>

      <!-- Garden Item Inventory Tray -->
      <section class="card tray-card">
        <div class="card-head-row">
          <div>
            <h3>🎒 花園收藏庫（自由擺放）</h3>
            <p class="muted-sm">已解鎖 ${stats.unlockedItemIds.size} / ${GARDEN_ITEMS.length} 種聖經主題物件 · 可重複放置多組</p>
          </div>
        </div>

        <div class="filter-pills">
          <button class="filter-pill ${trayCategory === 'all' ? 'active' : ''}" data-tray-cat="all">全部 (${GARDEN_ITEMS.length})</button>
          <button class="filter-pill ${trayCategory === 'animal' ? 'active' : ''}" data-tray-cat="animal">🐑 動物夥伴</button>
          <button class="filter-pill ${trayCategory === 'light' ? 'active' : ''}" data-tray-cat="light">🏮 光影明燈</button>
          <button class="filter-pill ${trayCategory === 'plant' ? 'active' : ''}" data-tray-cat="plant">🌿 花卉樹木</button>
          <button class="filter-pill ${trayCategory === 'structure' ? 'active' : ''}" data-tray-cat="structure">🏡 聖經建築</button>
        </div>

        <div class="tray-grid">
          ${filteredCatalog.map(item => {
            const unlocked = stats.unlockedItemIds.has(item.id);
            const countInGarden = placedCountByItem.get(item.id) || 0;
            return `
              <button class="tray-item-card ${unlocked ? 'is-unlocked' : 'is-locked'}"
                      data-place-item="${item.id}"
                      data-unlocked="${unlocked ? '1' : '0'}">
                <div class="tray-thumb-wrap">
                  <img src="${item.spriteAwake}" alt="${item.name}" loading="lazy">
                  ${!unlocked ? '<span class="lock-overlay">🔒</span>' : ''}
                  ${countInGarden > 0 ? `<span class="placed-count-pill">已放 ×${countInGarden}</span>` : ''}
                  ${item.isLight ? `<span class="feature-dot" title="黃昏與夜晚會發光">💡</span>` : ''}
                  ${item.category === 'animal' ? `<span class="feature-dot" title="夜晚會蜷縮睡覺">🌙</span>` : ''}
                </div>
                <div class="tray-item-name">${item.name}</div>
                <div class="tray-item-sub">${unlocked ? '點選加入花園' : item.unlockText}</div>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    </div>
  `;

  // === BIND EVENTS ===

  // 1. Pluck Seedling (Pikmin Bloom style!)
  container.querySelector('[data-act="pluck-seedling"]')?.addEventListener('click', () => {
    const pal = store.pluckSeedling();
    if (pal) {
      showToast(`🎉 拔出來了！歡迎新夥伴「${pal.emoji} ${pal.name}」加入你的讀經旅途！`);
    }
  });

  // 2. Time-of-Day Switcher
  container.querySelectorAll('[data-time-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.timeMode;
      store.setTimeMode(mode);
      const targetPhase = TIME_PHASES[store.getActiveTimePhase()];
      if (mode === 'auto') {
        showToast(`🕒 已切換為自動光影（目前時段：${targetPhase.emoji} ${targetPhase.label}）`);
      } else if (mode === 'night') {
        showToast('🌙 夜幕降臨：小動物們已蜷縮入睡，明燈也點亮了！');
      } else if (mode === 'dusk') {
        showToast('🌇 黃昏時刻：小屋窗燈與花園明燈柔和亮起');
      } else {
        showToast(`${targetPhase.emoji} 已切換至「${targetPhase.label}」光影`);
      }
    });
  });

  // 3. Showcase & Clear buttons
  container.querySelector('[data-act="showcase-layout"]')?.addEventListener('click', () => {
    selectedUid = null;
    store.applyShowcaseLayout();
    showToast('✨ 已為您套用精選花園佈置，仍可自由拖曳微調！');
  });

  container.querySelector('[data-act="clear-garden"]')?.addEventListener('click', () => {
    if (store.state.gardenItems.length === 0) return;
    selectedUid = null;
    store.clearGarden();
    showToast('🧹 花園已清空，歡迎重新自由佈置');
  });

  // 4. Tray Category Filter
  container.querySelectorAll('[data-tray-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      trayCategory = btn.dataset.trayCat;
      renderGardenView(container, { showToast });
    });
  });

  // 5. Place Item from Tray
  container.querySelectorAll('[data-place-item]').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.placeItem;
      const unlocked = btn.dataset.unlocked === '1';
      const def = getItemDef(itemId);
      if (!unlocked) {
        showToast(`🔒 尚未解鎖「${def.name}」：${def.unlockText}`);
        return;
      }
      // Pick a pleasant non-overlapping spot in the lawn center area
      const randX = 28 + Math.round(Math.random() * 46);
      const randY = 54 + Math.round(Math.random() * 28);
      const placed = store.addGardenItem(itemId, randX, randY);
      selectedUid = placed.uid;
      renderGardenView(container, { showToast });
      showToast(`✨ 已將「${def.name}」放入花園！按住拖曳可移動到任意位置`);
      document.getElementById('garden-stage')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // 6. Free-Form Pointer Drag & Drop + Selection inside Garden Stage
  const stageEl = container.querySelector('#garden-stage');
  if (stageEl) {
    // Clicking empty lawn deselects current item
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

      // Mini toolbar actions (flip / shrink / grow / remove)
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

      // Pointer drag handler (smooth 60fps live movement without full re-render until pointerup)
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
          latestY = Math.max(34, Math.min(92, origYPct + (dy / rect.height) * 100));

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
            // Simple tap: toggle selection & show biblical verse or nighttime sleep whisper!
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
