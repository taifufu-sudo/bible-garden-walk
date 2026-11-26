// Zone Leader Admin Dashboard (區長專屬管理後台)
// Features: Zone KPIs, 7+ Groups live table (add/rename groups!), Pastoral Care List (3d/7d idle),
// Member assistance (move group, reset 4-digit birthday PIN), and UTF-8 CSV Export!

import { api } from './api.js';

export function getOrCreateAdminModal() {
  let el = document.getElementById('admin-dashboard-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'admin-dashboard-modal';
    el.className = 'modal-backdrop admin-backdrop';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', '區長牧區讀經管理後台');
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

export async function openAdminDashboard({ showToast }) {
  const modal = getOrCreateAdminModal();
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  modal.innerHTML = `<div class="admin-sheet"><div class="reader-loading">📊 正在載入牧區總覽數據…</div></div>`;

  const reload = () => openAdminDashboard({ showToast });
  const close = () => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  };

  try {
    const data = await api.getAdminDashboard();
    const { kpis, groups, careList, members, today } = data;

    modal.innerHTML = `
      <div class="admin-sheet">
        <header class="admin-header">
          <div>
            <h2>👑 區長管理後台</h2>
            <div class="reader-sub">統計日期：${today} · 牧區即時雲端數據</div>
          </div>
          <div class="admin-head-btns">
            <button class="btn-soft-sm" data-adm="export-csv">📥 匯出 CSV</button>
            <button class="icon-circle-btn" data-adm="close" aria-label="關閉後台">✕</button>
          </div>
        </header>

        <div class="admin-body">
          <!-- 4 Zone KPI Cards -->
          <section class="stats-4-grid">
            <div class="stat-tile">
              <div class="stat-num">${kpis.totalMembers}</div>
              <div class="stat-label">👥 總報名人數</div>
            </div>
            <div class="stat-tile">
              <div class="stat-num">${kpis.totalReadToday} <small>(${kpis.readTodayPct}%)</small></div>
              <div class="stat-label">☀️ 今日已讀經</div>
            </div>
            <div class="stat-tile">
              <div class="stat-num">${kpis.weeklyActiveCount}</div>
              <div class="stat-label">🔥 本週活躍人數</div>
            </div>
            <div class="stat-tile">
              <div class="stat-num">${kpis.totalChaptersAll.toLocaleString()}</div>
              <div class="stat-label">📖 牧區累積總章數</div>
            </div>
          </section>

          <!-- Groups Progress & Dynamic Group Manager (Add / Rename!) -->
          <section class="card">
            <div class="card-head-row">
              <div>
                <h3>🏘️ 各小組讀經進度與名稱管理（目前 ${groups.length} 組）</h3>
                <p class="muted-sm">隨時可修改小組名稱或新增第 8 組以上，會即時同步到註冊選單</p>
              </div>
            </div>

            <div class="admin-groups-list">
              ${groups.map(g => `
                <div class="admin-group-row">
                  <div class="ag-top">
                    <div class="ag-name-block">
                      <strong>${g.name}小組</strong>
                      <span class="pill-tag pill-mint">${g.memberCount} 人</span>
                      <span class="ag-meta">今日 ${g.readTodayCount}/${g.memberCount} (${g.readTodayPct}%) · 累計 ${g.totalVerses.toLocaleString()} 節</span>
                    </div>
                    <button class="btn-soft-sm" data-rename-group="${g.id}" data-cur-name="${g.name}">✏️ 改名</button>
                  </div>
                  <div class="ag-bar-row">
                    <span>本週同心目標 ${g.weeklyVerses.toLocaleString()}/${g.weeklyTarget.toLocaleString()} 節</span>
                    <strong>${g.weeklyPct}%</strong>
                  </div>
                  <div class="bar-track bar-xs"><div class="bar-fill bar-mint" style="width:${g.weeklyPct}%"></div></div>
                </div>
              `).join('')}
            </div>

            <div class="admin-add-group-row">
              <input id="admin-new-group-name" type="text" maxlength="20" placeholder="輸入新小組名稱（例如第 8 組名稱）">
              <button class="btn-primary-sm" data-adm="add-group">＋ 新增小組</button>
            </div>
          </section>

          <!-- Pastoral Care List (Only visible to Zone Leader!) -->
          <section class="card">
            <div class="card-head-row">
              <div>
                <h3>💛 牧養關心名單（超過 3 天未讀經）</h3>
                <p class="muted-sm">僅區長後台可見，絕不公開給組員，方便您私下關心打氣</p>
              </div>
              <span class="pill-tag pill-amber">${careList.length} 位待關心</span>
            </div>
            ${careList.length === 0 ? `<div class="empty-hint">🎉 太棒了！所有組員近期都很穩定讀經！</div>` : `
              <div class="admin-member-table">
                ${careList.map(u => `
                  <div class="admin-member-row">
                    <div>
                      <strong>${u.nickname}</strong> <span class="pill-tag pill-mint">${u.groupName}</span>
                      <div class="muted-sm">
                        ${u.daysIdle === null ? '尚未開始第一天讀經' : `已 ${u.daysIdle} 天未讀經（最後：${u.lastReadDate}）`} · 累計 ${u.versesRead.toLocaleString()} 節
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </section>

          <!-- Member Assistance (Reset PIN / Change Group) -->
          <section class="card">
            <div class="card-head-row">
              <div>
                <h3>🛠️ 組員帳號協助（改小組／重設生日四碼）</h3>
                <p class="muted-sm">若長輩輸入錯生日或換小組，可直接從這裡協助調整</p>
              </div>
            </div>
            ${members.length === 0 ? `<div class="empty-hint">目前尚無組員報名。</div>` : `
              <div class="admin-member-table">
                ${members.map(u => `
                  <div class="admin-member-row">
                    <div>
                      <strong>${u.nickname}</strong> <small class="muted-sm">(${u.phoneMasked})</small>
                      <div class="muted-sm">${u.groupName}組 · ${u.versesRead.toLocaleString()} 節 · 🔥 ${u.currentStreak} 天</div>
                    </div>
                    <div class="admin-user-acts">
                      <select class="admin-group-select" data-move-user="${u.id}">
                        ${groups.map(g => `<option value="${g.id}" ${g.id === u.groupId ? 'selected' : ''}>${g.name}</option>`).join('')}
                      </select>
                      <button class="btn-soft-sm" data-reset-pin="${u.id}" data-user-name="${u.nickname}">🔑 重設生日碼</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </section>
        </div>
      </div>
    `;

    modal.querySelector('[data-adm="close"]')?.addEventListener('click', close);
    modal.onclick = e => { if (e.target === modal) close(); };

    modal.querySelector('[data-adm="export-csv"]')?.addEventListener('click', async () => {
      try {
        await api.downloadAdminCsv();
        showToast('📥 牧區讀經報表 CSV 已下載！');
      } catch (err) {
        showToast(err.message);
      }
    });

    modal.querySelector('[data-adm="add-group"]')?.addEventListener('click', async () => {
      const inp = modal.querySelector('#admin-new-group-name');
      const name = inp.value.trim();
      if (!name) return showToast('請先輸入新小組名稱');
      try {
        await api.adminCreateGroup(name);
        showToast(`✅ 已新增「${name}小組」！`);
        reload();
      } catch (err) {
        showToast(err.message);
      }
    });

    modal.querySelectorAll('[data-rename-group]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = Number(btn.dataset.renameGroup);
        const oldName = btn.dataset.curName;
        const nextName = prompt('請輸入新的小組名稱：', oldName);
        if (!nextName || nextName.trim() === oldName) return;
        try {
          await api.adminRenameGroup(id, nextName.trim());
          showToast(`✏️ 已更名為「${nextName.trim()}小組」！`);
          reload();
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    modal.querySelectorAll('[data-move-user]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const uid = Number(sel.dataset.moveUser);
        try {
          await api.adminUpdateUser(uid, { groupId: Number(sel.value) });
          showToast('✅ 已更新組員所屬小組！');
          reload();
        } catch (err) {
          showToast(err.message);
        }
      });
    });

    modal.querySelectorAll('[data-reset-pin]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = Number(btn.dataset.resetPin);
        const name = btn.dataset.userName;
        const newPin = prompt(`請為「${name}」輸入新的 4 碼生日數字（例如 0520）：`);
        if (!newPin) return;
        try {
          await api.adminUpdateUser(uid, { newPin: newPin.trim() });
          showToast(`🔑 已重設「${name}」的生日四碼！`);
        } catch (err) {
          showToast(err.message);
        }
      });
    });
  } catch (err) {
    modal.innerHTML = `
      <div class="admin-sheet" style="padding:24px;text-align:center;">
        <p class="muted-sm">載入後台失敗：${err.message}</p>
        <button class="btn-soft-sm" data-adm="close" style="margin-top:12px;">關閉</button>
      </div>
    `;
    modal.querySelector('[data-adm="close"]')?.addEventListener('click', close);
  }
}
