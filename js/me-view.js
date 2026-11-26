// Profile, Cloud Account Card, Zone Leader Admin Entry, Stats, Streak Badges, Personal Journal & Catalog
import { GARDEN_ITEMS } from './garden-catalog.js';
import { api } from './api.js';
import { openAdminDashboard } from './admin-view.js';
import { store, todayISO } from './state.js';

export function renderMeView(container, { showToast }) {
  const state = store.state;
  const stats = store.getStats();
  const canGrace = store.canUseGraceCard(todayISO());
  const user = store.cloudUser;
  const isLoggedIn = store.isCloudLoggedIn();
  const isAdmin = user?.role === 'admin';
  const groups = store.cloudGroups || [];

  const badges = [
    { days: 7,   icon: '🌱', title: '初熟嫩芽', desc: '連續讀經 7 天' },
    { days: 30,  icon: '🌳', title: '扎根青樹', desc: '連續讀經 30 天' },
    { days: 100, icon: '🏆', title: '百日精兵', desc: '連續讀經 100 天' },
    { days: 365, icon: '👑', title: '完讀冠冕', desc: '走完整本聖經' }
  ];

  container.innerHTML = `
    <div class="me-wrap">
      <!-- Zone Leader Admin Banner (Visible ONLY when role === 'admin') -->
      ${isAdmin ? `
        <section class="card admin-entry-card">
          <div class="card-head-row" style="margin-bottom:8px;">
            <div>
              <h3>👑 區長管理後台</h3>
              <p class="muted-sm">查看 7+ 個小組讀經率、牧養關心名單、新增／改名小組與匯出報表</p>
            </div>
          </div>
          <button class="btn-primary-full" data-act="open-admin">📊 開啟區長管理後台</button>
        </section>
      ` : ''}

      <!-- Cloud Account Status Card -->
      <section class="card account-banner-card">
        ${isLoggedIn ? `
          <div class="card-head-row">
            <div>
              <h3>☁️ 牧區雲端帳號（已同步）</h3>
              <p class="muted-sm">
                <strong>${user.nickname}</strong> · <span class="pill-tag pill-mint">${user.groupName}小組</span> · 手機 ${user.phoneMasked}
              </p>
            </div>
            <button class="btn-soft-sm" data-act="logout-cloud">登出</button>
          </div>
        ` : `
          <div class="card-head-row">
            <div>
              <h3>📱 尚未登入牧區雲端帳號</h3>
              <p class="muted-sm">使用手機號碼＋生日四碼登入，即可跨手機同步進度、逛小組花園與互相澆水！</p>
            </div>
          </div>
          <button class="btn-primary-full" data-act="open-auth">🚀 立即登入／註冊牧區帳號</button>
        `}
      </section>

      <!-- Profile & Settings -->
      <section class="card profile-card">
        <div class="card-head-row">
          <h3>⭐ 我的讀經檔案</h3>
          <span class="pill-tag pill-mint">誠實讀經制</span>
        </div>

        <div class="profile-grid">
          <div class="form-field">
            <label for="me-nickname">姓名／暱稱</label>
            <input id="me-nickname" type="text" maxlength="20" value="${state.nickname}" placeholder="例如：銘福">
          </div>
          ${isLoggedIn && groups.length > 0 ? `
            <div class="form-field">
              <label for="me-group">所屬小組</label>
              <select id="me-group" class="styled-select">
                ${groups.map(g => `<option value="${g.id}" ${g.id === user.groupId ? 'selected' : ''}>${g.name}小組</option>`).join('')}
              </select>
            </div>
          ` : ''}
          <div class="form-field">
            <label for="me-start">一年讀經起始日</label>
            <input id="me-start" type="date" value="${state.startDate}">
          </div>
        </div>
        <button class="btn-soft-sm" data-act="save-profile">💾 儲存設定</button>
      </section>

      <!-- 4 Key Stats Cards -->
      <section class="stats-4-grid">
        <div class="stat-tile">
          <div class="stat-num">${stats.versesRead.toLocaleString()}</div>
          <div class="stat-label">👣 讀經步數（節）</div>
        </div>
        <div class="stat-tile">
          <div class="stat-num">${stats.percent}%</div>
          <div class="stat-label">📖 整本聖經進度</div>
        </div>
        <div class="stat-tile">
          <div class="stat-num">${stats.booksCompleted} / 66</div>
          <div class="stat-label">📚 已完讀書卷</div>
        </div>
        <div class="stat-tile">
          <div class="stat-num">${stats.waterEnergy}</div>
          <div class="stat-label">💧 小組澆水祝福能量</div>
        </div>
      </section>

      <!-- Streak Badges -->
      <section class="card badges-card">
        <div class="card-head-row">
          <div>
            <h3>🔥 連續讀經徽章</h3>
            <p class="muted-sm">目前連續 <strong>${stats.currentStreak} 天</strong> · 最長紀錄 ${stats.longestStreak} 天 · 本週恩典卡：${canGrace ? '尚未使用 💛' : '本週已使用'}</p>
          </div>
        </div>

        <div class="badges-grid">
          ${badges.map(b => {
            const unlocked = b.days === 365
              ? stats.booksCompleted === 66
              : stats.longestStreak >= b.days || stats.currentStreak >= b.days;
            return `
              <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
                <div class="badge-icon">${unlocked ? b.icon : '🌫️'}</div>
                <div class="badge-title">${b.title}</div>
                <div class="badge-desc">${b.desc}</div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Personal Devotional Archive -->
      <section class="card">
        <div class="card-head-row">
          <h3>📒 我的靈修日記本</h3>
          <span class="pill-tag pill-mint">共 ${state.journal.length} 篇</span>
        </div>
        ${state.journal.length === 0 ? `
          <div class="empty-hint">還沒有日記喔！可以到「🤝 小組 → 💌 感動牆」寫下今天的亮光並選擇是否分享給小組！</div>
        ` : `
          <div class="journal-entries">
            ${state.journal.slice(0, 10).map(entry => `
              <article class="journal-entry">
                <div class="entry-head">
                  <span class="entry-date">${entry.mood || '✨'} ${entry.date} ${entry.isShared ? '· 已分享至小組' : '· 私人日記'}</span>
                </div>
                ${entry.verse ? `<div class="entry-verse">📖 ${entry.verse}</div>` : ''}
                <p class="entry-note">${entry.note.replace(/\n/g, '<br>')}</p>
              </article>
            `).join('')}
          </div>
        `}
      </section>

      <!-- Companion & Garden Item Encyclopedia -->
      <section class="card catalog-card">
        <div class="card-head-row">
          <div>
            <h3>📚 花園物件收藏圖鑑（每 100 節 +1 件）</h3>
            <p class="muted-sm">已解鎖 ${stats.unlockedItemIds.size} / ${GARDEN_ITEMS.length} 種風格 B 粉彩物件 · 累計擁有 ${stats.totalOwnedObjects} 件</p>
          </div>
        </div>
        <div class="catalog-mini-grid">
          ${GARDEN_ITEMS.map(item => {
            const qty = stats.inventoryStock.get(item.id) || 0;
            const unlocked = qty > 0;
            return `
              <div class="catalog-mini-item ${unlocked ? '' : 'locked'}">
                <img src="${item.spriteAwake}" alt="${item.name}">
                <div class="cat-mini-name">${item.name}</div>
                <div class="cat-mini-tag">${unlocked ? `擁有 ×${qty}` : '待解鎖'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Zone Leader Activation & Test Tools -->
      <section class="card demo-card">
        <h3>⚙️ 系統與區長設定</h3>
        <div class="demo-btn-row">
          ${isLoggedIn && !isAdmin ? `<button class="btn-soft-sm" data-act="claim-admin">🔑 區長啟用後台</button>` : ''}
          ${!isLoggedIn ? `<button class="btn-primary-sm" data-act="load-demo">✨ 單機體驗第 100 天進度</button>` : ''}
          <button class="btn-danger-sm" data-act="reset-all">🗑️ 重設本機暫存</button>
        </div>
      </section>
    </div>
  `;

  container.querySelector('[data-act="open-admin"]')?.addEventListener('click', () => {
    openAdminDashboard({ showToast });
  });

  container.querySelector('[data-act="open-auth"]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  });

  container.querySelector('[data-act="logout-cloud"]')?.addEventListener('click', async () => {
    if (!confirm('確定要登出目前帳號嗎？（您的進度都已安全保存在雲端）')) return;
    await store.logoutCloud();
    showToast('已登出帳號');
  });

  container.querySelector('[data-act="save-profile"]')?.addEventListener('click', async () => {
    const nickname = container.querySelector('#me-nickname').value;
    const startDate = container.querySelector('#me-start').value;
    const groupSel = container.querySelector('#me-group');
    const groupId = groupSel ? Number(groupSel.value) : undefined;
    try {
      await store.updateProfile({ nickname, startDate, groupId });
      showToast('⭐ 個人檔案設定已儲存並同步！');
    } catch (err) {
      showToast(err.message);
    }
  });

  container.querySelector('[data-act="claim-admin"]')?.addEventListener('click', async () => {
    const code = prompt('請輸入區長專屬啟用碼：');
    if (!code) return;
    try {
      const res = await api.claimAdmin(code.trim());
      await store.refreshFromCloud();
      showToast(res.message);
      openAdminDashboard({ showToast });
    } catch (err) {
      showToast(err.message);
    }
  });

  container.querySelector('[data-act="load-demo"]')?.addEventListener('click', () => {
    store.loadDemoProgress();
    showToast('🎉 已載入第 100 天單機示範進度！');
  });

  container.querySelector('[data-act="reset-all"]')?.addEventListener('click', () => {
    if (confirm('確定要清除本機瀏覽器的暫存紀錄嗎？')) {
      store.resetAll();
      showToast('已清除本機暫存');
    }
  });
}
