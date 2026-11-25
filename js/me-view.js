// Profile, Progress Dashboard, Streak Badges, Companion Catalog & Demo/Reset Tools
import { GARDEN_ITEMS } from './garden-catalog.js';
import { store, todayISO } from './state.js';

export function renderMeView(container, { showToast }) {
  const state = store.state;
  const stats = store.getStats();
  const canGrace = store.canUseGraceCard(todayISO());

  const badges = [
    { days: 7,   icon: '🌱', title: '初熟嫩芽', desc: '連續讀經 7 天' },
    { days: 30,  icon: '🌳', title: '扎根青樹', desc: '連續讀經 30 天' },
    { days: 100, icon: '🏆', title: '百日精兵', desc: '連續讀經 100 天' },
    { days: 365, icon: '👑', title: '完讀冠冕', desc: '走完整本聖經' }
  ];

  container.innerHTML = `
    <div class="me-wrap">
      <!-- Profile & Settings -->
      <section class="card profile-card">
        <div class="card-head-row">
          <h3>⭐ 我的讀經檔案</h3>
          <span class="pill-tag pill-mint">誠實讀經制</span>
        </div>

        <div class="profile-grid">
          <div class="form-field">
            <label for="me-nickname">旅人暱稱</label>
            <input id="me-nickname" type="text" maxlength="20" value="${state.nickname}" placeholder="例如：銘福">
          </div>
          <div class="form-field">
            <label for="me-church">教會／小組名稱</label>
            <input id="me-church" type="text" maxlength="24" value="${state.churchName}" placeholder="安平靈糧堂">
          </div>
          <div class="form-field">
            <label for="me-start">一年讀經起始日</label>
            <input id="me-start" type="date" value="${state.startDate}">
          </div>
        </div>
        <button class="btn-soft-sm" data-act="save-profile">儲存設定</button>
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
          <div class="stat-num">${stats.chaptersRead} / 1189</div>
          <div class="stat-label">🗺️ 已驅散迷霧章節</div>
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

      <!-- Companion & Garden Item Encyclopedia -->
      <section class="card catalog-card">
        <div class="card-head-row">
          <div>
            <h3>📚 夥伴與花園收藏圖鑑</h3>
            <p class="muted-sm">已拔起 ${state.pluckedCount} 位花苗夥伴 · 已解鎖 ${stats.unlockedItemIds.size}/${GARDEN_ITEMS.length} 件花園插畫物件</p>
          </div>
        </div>
        <div class="catalog-mini-grid">
          ${GARDEN_ITEMS.map(item => {
            const unlocked = stats.unlockedItemIds.has(item.id);
            return `
              <div class="catalog-mini-item ${unlocked ? '' : 'locked'}">
                <img src="${item.spriteAwake}" alt="${item.name}">
                <div class="cat-mini-name">${item.name}</div>
                <div class="cat-mini-tag">${unlocked ? '已收藏' : '待解鎖'}</div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- About & Demo / Test Tools -->
      <section class="card demo-card">
        <h3>🧪 活動示範與測試工具</h3>
        <p class="muted-sm">
          本原型為教會推動「一年整本聖經閱讀」所設計，結合皮可敏式步數探索地圖、花苗孵化、以及隨現實時間自動變換四時段光影（早晨／中午／黃昏／夜晚）的自由擺放花園。所有進度均儲存在本機瀏覽器。
        </p>
        <div class="demo-btn-row">
          <button class="btn-primary-sm" data-act="load-demo">✨ 一鍵體驗第 100 天進度（解鎖全花園）</button>
          <button class="btn-danger-sm" data-act="reset-all">🗑️ 重設全部進度</button>
        </div>
      </section>
    </div>
  `;

  container.querySelector('[data-act="save-profile"]')?.addEventListener('click', () => {
    const nickname = container.querySelector('#me-nickname').value;
    const churchName = container.querySelector('#me-church').value;
    const startDate = container.querySelector('#me-start').value;
    store.updateProfile({ nickname, churchName, startDate });
    showToast('⭐ 個人檔案設定已儲存！');
  });

  container.querySelector('[data-act="load-demo"]')?.addEventListener('click', () => {
    store.loadDemoProgress();
    showToast('🎉 已載入第 100 天示範進度！所有花園物件與探索地圖已解鎖，快去花園切換「夜晚」試試看！');
  });

  container.querySelector('[data-act="reset-all"]')?.addEventListener('click', () => {
    if (confirm('確定要重設所有讀經進度、日記與花園擺設嗎？')) {
      store.resetAll();
      showToast('已重設全部進度，重新出發！');
    }
  });
}
