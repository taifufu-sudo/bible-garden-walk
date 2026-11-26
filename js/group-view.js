// Small Group Hub — Visit Groupmates' 21:9 Gardens, Daily Watering, 1-Tap Blessings,
// Weekly Cooperative Group Goal, and Group Reflection Wall (感動牆)

import { api } from './api.js';
import { TIME_PHASES, getItemDef } from './garden-catalog.js';
import { GardenLifeController } from './garden-life.js';
import { READING_PLAN } from './bible-data.js';
import { store, todayISO, diffDaysISO } from './state.js';

let activeSubTab = 'gardens'; // 'gardens' | 'wall'
let selectedMood = '✨';
const visitLife = new GardenLifeController();

const PRESET_BLESSINGS = [
  '主賜平安 🕊️',
  '讀經加油 💪',
  '為你禱告 🙏',
  '花園好美 🌸'
];

const MOODS = [
  { icon: '✨', label: '亮光' },
  { icon: '🙏', label: '感恩' },
  { icon: '🕊️', label: '平安' },
  { icon: '💗', label: '感動' },
  { icon: '💪', label: '得力' }
];

function computeDepthScale(yPct) {
  const norm = Math.max(0, Math.min(1, (yPct - 36) / 58));
  return 0.56 + norm * 0.52;
}

function getOrCreateVisitModal() {
  let el = document.getElementById('visit-garden-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'visit-garden-modal';
    el.className = 'modal-backdrop visit-backdrop';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

async function openVisitGardenModal(hostId, { showToast, onInteracted }) {
  const modal = getOrCreateVisitModal();
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  modal.innerHTML = `<div class="modal-card visit-card"><div class="reader-loading">🚪 正在走進組員的恩典花園…</div></div>`;

  try {
    const data = await api.visitGarden(hostId);
    const host = data.host;
    const guestbook = data.guestbook || [];
    const phaseKey = store.getActiveTimePhase();
    const phase = TIME_PHASES[phaseKey];

    const stageItemsHtml = (host.gardenItems || []).map(placed => {
      const def = getItemDef(placed.itemId);
      if (!def) return '';
      const depthScale = computeDepthScale(placed.yPct);
      const finalWidthPct = def.baseWidthPct * depthScale * (placed.scaleMult || 1.0);
      const isSleeping = phase.animalsSleep && def.category === 'animal' && def.spriteSleep;
      const isLit = phase.lightsOn && def.isLight;
      const spriteSrc = isSleeping ? def.spriteSleep : def.spriteAwake;
      const zIdx = Math.round(placed.yPct);
      const imgFilter = isLit
        ? (phase.id === 'night'
            ? 'brightness(1.16) saturate(1.18) drop-shadow(0 0 12px rgba(255,212,110,0.88))'
            : 'brightness(1.08) saturate(1.10) drop-shadow(0 0 7px rgba(255,204,96,0.52))')
        : phase.itemFilter;

      return `
        <div class="placed-item ${isSleeping ? 'is-sleeping' : ''} ${isLit ? 'is-lit' : ''} cat-${def.category}"
             data-uid="${placed.uid}"
             style="left:${placed.xPct}%; top:${placed.yPct}%; width:${finalWidthPct.toFixed(2)}%; z-index:${zIdx}; pointer-events:none;">
          ${isLit ? `<div class="lamp-ground-glow ${phase.id === 'night' ? 'glow-strong' : 'glow-soft'}"></div><div class="lamp-halo"></div>` : ''}
          <div class="item-ground-shadow" style="opacity:${phase.shadowOpacity}; transform:translateX(-50%) ${phase.shadowSkew};"></div>
          <img class="placed-sprite" src="${spriteSrc}" alt="${def.name}" draggable="false"
               style="filter:${imgFilter}; transform:${placed.flipX ? 'scaleX(-1)' : 'none'};">
          ${isSleeping ? `<div class="sleep-zzz" aria-hidden="true"><span class="z1">z</span><span class="z2">Z</span><span class="z3">z</span></div>` : ''}
        </div>
      `;
    }).join('');

    modal.innerHTML = `
      <div class="modal-card visit-card">
        <div class="visit-header">
          <div>
            <h3>🏡 ${host.nickname} 的恩典花園</h3>
            <p class="muted-sm">${host.groupName}組 · 累積 ${host.versesRead.toLocaleString()} 節 · 🔥 連續 ${host.currentStreak} 天</p>
          </div>
          <button class="icon-circle-btn" data-visit-close aria-label="關閉">✕</button>
        </div>

        <div class="garden-stage visit-stage phase-${phase.id}" id="visit-garden-stage">
          <img class="garden-bg active" src="${phase.backdrop}" alt="${host.nickname} 的花園" draggable="false">
          <div class="garden-atmosphere" aria-hidden="true">
            <div class="pond-water-shimmer">
              <span class="water-ripple r1"></span>
              <span class="water-ripple r2"></span>
              <span class="water-glint g1"></span>
              <span class="water-glint g2"></span>
            </div>
          </div>
          ${(host.gardenItems || []).length === 0 ? `
            <div class="empty-lawn-hint">
              <span>🌱 ${host.nickname} 的草地正等著發芽佈置！</span>
              <small>幫他澆個水、留句祝福加油打氣吧</small>
            </div>
          ` : ''}
          <div class="garden-items-layer">${stageItemsHtml}</div>
          <div id="water-fx-layer" class="water-fx-layer" aria-hidden="true"></div>
        </div>

        ${!host.isMe ? `
          <div class="visit-actions">
            <button class="btn-water-big" data-visit-water ${host.wateredByMeToday ? 'disabled' : ''}>
              ${host.wateredByMeToday ? '💧 今天已幫他澆水囉 ✓' : '💧 幫他澆水（對方 +5 能量，你也 +2！）'}
            </button>
            <div class="blessing-label">🙏 一鍵送出代禱祝福（免打字）：</div>
            <div class="blessing-chips">
              ${PRESET_BLESSINGS.map(msg => `
                <button class="blessing-chip-btn" data-visit-bless="${msg}">${msg}</button>
              `).join('')}
            </div>
          </div>
        ` : `<div class="muted-sm" style="text-align:center;margin-top:10px;">這是您自己的花園喔！</div>`}

        <div class="visit-guestbook">
          <h4>💬 近期訪客與祝福紀錄</h4>
          ${guestbook.length === 0 ? `<p class="muted-sm">還沒有訪客留言，成為第一位送上祝福的人吧！</p>` : `
            <div class="guestbook-list">
              ${guestbook.map(g => `
                <div class="guestbook-row">
                  <span class="gb-who">${g.from_name}</span>
                  <span class="gb-msg">${g.message}</span>
                  <span class="gb-day">${g.day_iso.slice(5)}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    const visitStage = modal.querySelector('#visit-garden-stage');
    visitLife.attach(visitStage, host.gardenItems || [], { animalsSleep: phase.animalsSleep, selectedUid: null });

    const close = () => {
      visitLife.stopAll();
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    };
    modal.querySelector('[data-visit-close]')?.addEventListener('click', close);
    modal.onclick = e => { if (e.target === modal) close(); };

    modal.querySelector('[data-visit-water]')?.addEventListener('click', async btnEv => {
      const btn = btnEv.currentTarget;
      btn.disabled = true;
      try {
        const res = await api.interactGarden({ toUserId: host.id, kind: 'water' });
        btn.textContent = '💧 今天已幫他澆水囉 ✓';
        const fx = modal.querySelector('#water-fx-layer');
        if (fx) {
          fx.innerHTML = `<div class="water-splash-pop">💧✨ 澆水祝福 +${res.hostGain}！</div>`;
        }
        showToast(res.message);
        await store.refreshFromCloud();
        if (onInteracted) onInteracted();
      } catch (err) {
        showToast(err.message);
        btn.disabled = false;
      }
    });

    modal.querySelectorAll('[data-visit-bless]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const message = btn.dataset.visitBless;
        btn.disabled = true;
        try {
          const res = await api.interactGarden({ toUserId: host.id, kind: 'blessing', message });
          showToast(res.message);
          openVisitGardenModal(hostId, { showToast, onInteracted });
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    modal.innerHTML = `
      <div class="modal-card visit-card">
        <p class="muted-sm">無法載入花園：${err.message}</p>
        <button class="btn-soft-full" data-visit-close style="margin-top:12px;">關閉</button>
      </div>
    `;
    modal.querySelector('[data-visit-close]')?.addEventListener('click', () => {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    });
  }
}

export async function renderGroupView(container, { showToast }) {
  if (!store.isCloudLoggedIn()) {
    container.innerHTML = `
      <div class="card" style="text-align:center; padding:28px 18px;">
        <h3>🤝 加入牧區小組，一起讀經逛花園！</h3>
        <p class="muted-sm" style="margin:10px 0 18px;">使用「手機號碼＋生日四碼」快速登入後，就能拜訪組員的 21:9 粉彩花園、互相澆水祝福，並在小組感動牆彼此激勵！</p>
        <button class="btn-primary-full" data-act="open-login-now">📱 立即登入／註冊牧區帳號</button>
      </div>
    `;
    container.querySelector('[data-act="open-login-now"]')?.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('open-auth-modal'));
    });
    return;
  }

  container.innerHTML = `
    <div class="group-wrap">
      <div class="group-subtabs" role="tablist">
        <button class="group-subtab ${activeSubTab === 'gardens' ? 'active' : ''}" data-gsub="gardens">🏡 組員花園＆澆水</button>
        <button class="group-subtab ${activeSubTab === 'wall' ? 'active' : ''}" data-gsub="wall">💌 小組感動牆</button>
      </div>
      <div id="group-sub-body">
        <div class="card"><div class="reader-loading">載入小組資料中…</div></div>
      </div>
    </div>
  `;

  container.querySelectorAll('[data-gsub]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeSubTab = btn.dataset.gsub;
      renderGroupView(container, { showToast });
    });
  });

  const subBody = container.querySelector('#group-sub-body');

  if (activeSubTab === 'gardens') {
    await renderGroupGardensSubTab(subBody, { showToast, rerender: () => renderGroupView(container, { showToast }) });
  } else {
    await renderGroupWallSubTab(subBody, { showToast, rerender: () => renderGroupView(container, { showToast }) });
  }
}

async function renderGroupGardensSubTab(subBody, { showToast, rerender }) {
  try {
    const data = await api.getGroupOverview();
    const grp = data.group;
    const members = data.members || [];
    const inbox = store.cloudInbox || [];

    subBody.innerHTML = `
      <!-- Weekly Cooperative Group Goal Card -->
      <section class="card group-goal-card">
        <div class="card-head-row">
          <div>
            <h3>🎯 ${grp.name}小組・本週同心讀經目標</h3>
            <p class="muted-sm">全組 ${grp.memberCount} 位組員齊心累積，達標每人可得 1 株獎勵花苗！</p>
          </div>
          <span class="pill-tag ${grp.weeklyGoalReached ? 'pill-mint' : 'pill-amber'}">
            ${grp.weeklyPct}%
          </span>
        </div>
        <div class="goal-nums">
          <span>本週全組已共讀 <strong>${grp.weeklyVerses.toLocaleString()}</strong> / ${grp.weeklyTarget.toLocaleString()} 節</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill bar-mint" style="width:${grp.weeklyPct}%"></div>
        </div>
        ${grp.weeklyGoalReached ? `
          <div style="margin-top:12px;">
            <button class="btn-pluck" style="width:100%;" data-act="claim-weekly" ${grp.weeklyClaimed ? 'disabled' : ''}>
              ${grp.weeklyClaimed ? '✨ 本週同心獎勵已領取 ✓' : '🎁 恭喜達標！領取本週小組同心花苗（+100 能量）'}
            </button>
          </div>
        ` : ''}
      </section>

      <!-- Recent Incoming Watering / Blessings Inbox -->
      ${inbox.length > 0 ? `
        <section class="card inbox-card">
          <h4>🔔 最近來訪與祝福通知</h4>
          <div class="inbox-strip">
            ${inbox.slice(0, 4).map(it => `
              <div class="inbox-item">
                <strong>${it.from_name}</strong> ${it.message}
                <span class="inbox-date">${it.day_iso.slice(5)}</span>
              </div>
            `).join('')}
          </div>
        </section>
      ` : ''}

      <!-- Groupmates Garden Cards -->
      <section class="card">
        <div class="card-head-row">
          <div>
            <h3>🏡 ${grp.name}組花園街坊（${members.length} 位）</h3>
            <p class="muted-sm">點擊「逛花園」欣賞組員佈置，每天幫組員澆水可互相累積花苗能量！</p>
          </div>
        </div>

        <div class="member-list">
          ${members.map(m => `
            <div class="member-card ${m.readToday ? 'read-today' : ''}">
              <div class="member-main">
                <div class="member-avatar">${m.readToday ? '🐑' : '🌱'}</div>
                <div class="member-info">
                  <div class="member-name-row">
                    <span class="member-name">${m.nickname}</span>
                    ${m.isMe ? '<span class="pill-tag pill-mint">我自己</span>' : ''}
                    <span class="member-today-tag ${m.readToday ? 'ok' : ''}">${m.readToday ? '✨ 今日已讀' : '加油中'}</span>
                  </div>
                  <div class="member-stats-line">
                    👣 ${m.versesRead.toLocaleString()} 節 · 🔥 ${m.currentStreak} 天 · 🏡 ${m.gardenItemCount} 件擺設
                  </div>
                </div>
              </div>
              <div class="member-actions">
                <button class="btn-soft-sm" data-visit-id="${m.id}">🚪 逛花園</button>
                ${!m.isMe ? `
                  <button class="btn-water-sm ${m.wateredByMeToday ? 'done' : ''}" data-quick-water="${m.id}" ${m.wateredByMeToday ? 'disabled' : ''}>
                    ${m.wateredByMeToday ? '💧 已澆' : '💧 澆水'}
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    subBody.querySelector('[data-act="claim-weekly"]')?.addEventListener('click', async e => {
      e.currentTarget.disabled = true;
      try {
        const res = await api.claimWeeklyGoal();
        showToast(res.message);
        await store.refreshFromCloud();
        rerender();
      } catch (err) {
        showToast(err.message);
      }
    });

    subBody.querySelectorAll('[data-visit-id]').forEach(btn => {
      btn.addEventListener('click', () => {
        openVisitGardenModal(Number(btn.dataset.visitId), { showToast, onInteracted: rerender });
      });
    });

    subBody.querySelectorAll('[data-quick-water]').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          const res = await api.interactGarden({ toUserId: Number(btn.dataset.quickWater), kind: 'water' });
          btn.textContent = '💧 已澆';
          btn.classList.add('done');
          showToast(res.message);
          await store.refreshFromCloud();
        } catch (err) {
          showToast(err.message);
          btn.disabled = false;
        }
      });
    });
  } catch (err) {
    subBody.innerHTML = `<div class="card"><p class="muted-sm">載入小組資料失敗：${err.message}</p></div>`;
  }
}

async function renderGroupWallSubTab(subBody, { showToast, rerender }) {
  const today = todayISO();
  const planDay = Math.max(1, Math.min(365, diffDaysISO(store.state.startDate, today) + 1));
  const todayPlan = READING_PLAN[planDay - 1];
  const suggested = todayPlan ? `${todayPlan.chapters[0].bookName} ${todayPlan.chapters[0].chapter} 章` : '詩篇 23:1';

  try {
    const data = await api.getGroupReflections();
    const posts = data.posts || [];
    const groupName = store.cloudUser?.groupName || '小組';

    subBody.innerHTML = `
      <!-- Quick Post Reflection to Group Wall -->
      <section class="card">
        <h3>✍️ 分享今日讀經感動給 ${groupName}組</h3>
        <div class="mood-row" style="margin-top:10px;">
          ${MOODS.map(m => `
            <button type="button" class="mood-pill ${selectedMood === m.icon ? 'active' : ''}" data-wmood="${m.icon}">
              ${m.icon} ${m.label}
            </button>
          `).join('')}
        </div>
        <div class="form-field">
          <label for="wall-verse">📖 感動經文</label>
          <input id="wall-verse" type="text" placeholder="例如：${suggested}" maxlength="80">
        </div>
        <div class="form-field">
          <label for="wall-note">💬 一句領受或代禱事項</label>
          <textarea id="wall-note" rows="3" placeholder="寫下今天神對你說的話，鼓勵同組的弟兄姊妹…"></textarea>
        </div>
        <label class="share-toggle-row">
          <input type="checkbox" id="wall-share-check" checked>
          <span>同步分享到「${groupName}小組感動牆」（取消勾選則僅存於個人日記）</span>
        </label>
        <button class="btn-primary-full" data-act="post-wall" style="margin-top:10px;">💌 發布感動</button>
      </section>

      <!-- Group Reflection Feed -->
      <section class="card">
        <div class="card-head-row">
          <h3>💛 ${groupName}組感動牆</h3>
          <span class="pill-tag pill-mint">${posts.length} 篇分享</span>
        </div>

        ${posts.length === 0 ? `
          <div class="empty-hint">小組感動牆還空空的，搶先寫下第一篇讀經亮光祝福大家吧！</div>
        ` : `
          <div class="wall-feed">
            ${posts.map(p => {
              const rx = p.reactions;
              return `
                <article class="wall-post">
                  <div class="wall-post-head">
                    <div>
                      <strong class="wall-author">${p.mood || '✨'} ${p.authorName}</strong>
                      <span class="wall-date">${p.date}</span>
                    </div>
                    ${p.isMine ? `<button class="link-btn danger" data-del-post="${p.id}">刪除</button>` : ''}
                  </div>
                  ${p.verse ? `<div class="entry-verse">📖 ${p.verse}</div>` : ''}
                  <p class="entry-note">${p.note.replace(/\n/g, '<br>')}</p>
                  <div class="reaction-row">
                    <button class="rx-btn ${rx.mine.includes('amen') ? 'active' : ''}" data-rx-post="${p.id}" data-rx-type="amen">
                      🙌 阿們 <span>${rx.amen || ''}</span>
                    </button>
                    <button class="rx-btn ${rx.mine.includes('encouraged') ? 'active' : ''}" data-rx-post="${p.id}" data-rx-type="encouraged">
                      ❤️ 得激勵 <span>${rx.encouraged || ''}</span>
                    </button>
                    <button class="rx-btn ${rx.mine.includes('pray') ? 'active' : ''}" data-rx-post="${p.id}" data-rx-type="pray">
                      🙏 一起禱告 <span>${rx.pray || ''}</span>
                    </button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        `}
      </section>
    `;

    subBody.querySelectorAll('[data-wmood]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedMood = btn.dataset.wmood;
        subBody.querySelectorAll('[data-wmood]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    subBody.querySelector('[data-act="post-wall"]')?.addEventListener('click', async e => {
      const verse = subBody.querySelector('#wall-verse').value.trim();
      const note = subBody.querySelector('#wall-note').value.trim();
      const isShared = subBody.querySelector('#wall-share-check').checked;
      if (!verse && !note) {
        showToast('請輸入經文或感動內容再送出喔！');
        return;
      }
      e.currentTarget.disabled = true;
      try {
        await api.createReflection({ verse, note, mood: selectedMood, isShared, date: today });
        showToast(isShared ? '💌 已發布到小組感動牆！' : '💾 已儲存為個人靈修日記！');
        await store.refreshFromCloud();
        rerender();
      } catch (err) {
        showToast(err.message);
        e.currentTarget.disabled = false;
      }
    });

    subBody.querySelectorAll('[data-rx-post]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.rxPost);
        const type = btn.dataset.rxType;
        try {
          await api.toggleReaction(id, type);
          rerender();
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    subBody.querySelectorAll('[data-del-post]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('確定要刪除這篇分享嗎？')) return;
        try {
          await api.deleteReflection(Number(btn.dataset.delPost));
          showToast('已刪除分享');
          rerender();
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  } catch (err) {
    subBody.innerHTML = `<div class="card"><p class="muted-sm">載入感動牆失敗：${err.message}</p></div>`;
  }
}
