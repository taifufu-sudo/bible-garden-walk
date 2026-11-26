// Main Application Bootstrapper — Pastoral Zone Multiplayer Edition
import { TIME_PHASES } from './garden-catalog.js';
import { api, setAuthToken } from './api.js';
import { store, todayISO } from './state.js';
import { renderTodayView, createBibleReader } from './today-view.js';
import { renderMapView } from './map-view.js';
import { renderGardenView } from './garden-view.js';
import { renderGroupView } from './group-view.js';
import { renderMeView } from './me-view.js';

const mainEl = document.getElementById('app-main');
const authModal = document.getElementById('auth-modal');
const toastEl = document.getElementById('toast');

const hudChurch = document.getElementById('hud-church');
const hudVerses = document.getElementById('hud-verses');
const hudStreak = document.getElementById('hud-streak');
const yearBarFill = document.getElementById('year-bar-fill');
const yearBarLabel = document.getElementById('year-bar-label');

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3400);
}

const reader = createBibleReader({ showToast });

function syncAmbientTheme() {
  const phaseKey = store.getActiveTimePhase();
  document.body.dataset.timePhase = phaseKey;
}

function renderHeader() {
  const state = store.state;
  const stats = store.getStats();
  const groupTag = store.cloudUser?.groupName ? `${store.cloudUser.groupName}組 · ` : '';
  hudChurch.textContent = `${groupTag}${state.churchName}一年讀經`;
  hudVerses.textContent = `${stats.versesRead.toLocaleString()} 節`;
  hudStreak.textContent = `連續 ${stats.currentStreak} 天`;
  yearBarFill.style.width = `${Math.max(0.8, stats.percent)}%`;
  yearBarLabel.textContent = `${stats.percent}%`;
  syncAmbientTheme();

  const gardenNavBadge = document.getElementById('nav-garden-badge');
  if (gardenNavBadge) {
    if (stats.readyToPluck > 0) {
      gardenNavBadge.textContent = String(stats.readyToPluck);
      gardenNavBadge.hidden = false;
    } else {
      gardenNavBadge.hidden = true;
    }
  }
}

function renderActiveTab() {
  renderHeader();
  const tab = store.activeTab;

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isCurrent = btn.dataset.tab === tab;
    btn.classList.toggle('active', isCurrent);
    btn.setAttribute('aria-current', isCurrent ? 'page' : 'false');
  });

  if (tab === 'today') {
    renderTodayView(mainEl, { showToast, openReader: reader.open });
  } else if (tab === 'map') {
    renderMapView(mainEl, { showToast, openReader: reader.open });
  } else if (tab === 'garden') {
    renderGardenView(mainEl, { showToast });
  } else if (tab === 'group') {
    renderGroupView(mainEl, { showToast });
  } else if (tab === 'me') {
    renderMeView(mainEl, { showToast });
  }
}

// === SENIOR-FRIENDLY PHONE + 4-DIGIT BIRTHDAY AUTH MODAL ===
let authStep = 'credentials'; // 'credentials' | 'register'
let authSelectedGroupId = null;

function openAuthModal() {
  authStep = 'credentials';
  renderAuthModalContent();
  authModal.classList.add('show');
  authModal.setAttribute('aria-hidden', 'false');
}

function closeAuthModal() {
  authModal.classList.remove('show');
  authModal.setAttribute('aria-hidden', 'true');
}

function renderAuthModalContent(prefillPhone = '', prefillPin = '') {
  const groups = store.cloudGroups.length > 0 ? store.cloudGroups : [
    { id: 1, name: '迦南' }, { id: 2, name: '讚美' }, { id: 3, name: '宇光' },
    { id: 4, name: '何其美' }, { id: 5, name: '橄欖樹' }, { id: 6, name: '跨越' }, { id: 7, name: '五餅二魚' }
  ];
  const localStats = store.getStats();
  const hasLocalProgress = !store.isCloudLoggedIn() && (localStats.versesRead > 0 || store.state.gardenItems.length > 0);

  if (authStep === 'credentials') {
    authModal.innerHTML = `
      <div class="modal-card onboard-card">
        <div class="onboard-hero-preview">
          <img src="assets/garden/garden_morning.jpg" alt="牧區恩典花園">
          <div class="onboard-hero-chip">🤝 牧區一年讀經・小組同心同行</div>
        </div>
        <div class="onboard-content">
          <h2>🌱 牧區讀經登入／註冊</h2>
          <p class="muted-sm">只需輸入<strong>手機號碼</strong>與<strong>生日四碼</strong>，免背密碼就能同步雲端進度、逛小組花園與互相澆水！</p>

          <div class="onboard-form">
            <div class="form-field">
              <label for="auth-phone">📱 手機號碼</label>
              <input id="auth-phone" type="tel" inputmode="numeric" maxlength="12" placeholder="例如：0912345678" value="${prefillPhone}">
            </div>
            <div class="form-field">
              <label for="auth-pin">🎂 生日四碼（月日 MMDD）</label>
              <input id="auth-pin" type="password" inputmode="numeric" maxlength="4" placeholder="例如 5月20日請輸入 0520" value="${prefillPin}">
            </div>
          </div>

          <div class="onboard-actions">
            <button id="auth-continue-btn" class="btn-primary-full">🚀 下一步／立即登入</button>
            <button id="auth-guest-btn" class="btn-soft-full">先以單機訪客逛逛</button>
          </div>
        </div>
      </div>
    `;

    authModal.querySelector('#auth-continue-btn')?.addEventListener('click', async e => {
      const phone = authModal.querySelector('#auth-phone').value.trim();
      const pin = authModal.querySelector('#auth-pin').value.replace(/\D/g, '');
      if (phone.replace(/\D/g, '').length < 8) return showToast('請輸入正確的手機號碼');
      if (pin.length !== 4) return showToast('生日請輸入 4 位數字（例如 0520）');

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '連線確認中…';
      try {
        const lookup = await api.lookupPhone(phone);
        if (lookup.exists) {
          const res = await api.login(phone, pin);
          setAuthToken(res.token);
          store.applyCloudUserPayload(res.user);
          await store.refreshFromCloud();
          closeAuthModal();
          showToast(`✨ 歡迎回來，${res.user.nickname}（${res.user.groupName}小組）！`);
        } else {
          // New member -> step 2: pick nickname & group!
          authStep = 'register';
          renderAuthModalContent(phone, pin);
        }
      } catch (err) {
        showToast(err.message);
        btn.disabled = false;
        btn.textContent = '🚀 下一步／立即登入';
      }
    });

    authModal.querySelector('#auth-guest-btn')?.addEventListener('click', () => {
      store.state.onboarded = true;
      store.notify({ skipCloudSync: true });
      closeAuthModal();
    });
  } else {
    // Registration Step 2: Nickname + Big Senior-Friendly Group Buttons
    authModal.innerHTML = `
      <div class="modal-card onboard-card">
        <div class="onboard-content">
          <h2>👋 歡迎新加入！完成 2 步註冊</h2>
          <p class="muted-sm">手機 <strong>${prefillPhone}</strong> 尚未註冊，請填寫姓名並點選您的小組：</p>

          <div class="onboard-form">
            <div class="form-field">
              <label for="reg-nickname">✍️ 您的姓名或暱稱</label>
              <input id="reg-nickname" type="text" maxlength="20" placeholder="例如：銘福" value="${store.state.nickname || ''}">
            </div>

            <div class="form-field">
              <label>🏘️ 請點選您所屬的小組</label>
              <div class="group-pick-grid">
                ${groups.map(g => `
                  <button type="button" class="group-pick-btn ${authSelectedGroupId === g.id ? 'active' : ''}" data-pick-group="${g.id}">
                    ${g.name}
                  </button>
                `).join('')}
              </div>
            </div>

            ${hasLocalProgress ? `
              <label class="share-toggle-row" style="margin-top:8px;">
                <input type="checkbox" id="reg-migrate-check" checked>
                <span>同步匯入我原本在本機的讀經進度（${localStats.versesRead} 節）與花園擺設</span>
              </label>
            ` : ''}
          </div>

          <div class="onboard-actions">
            <button id="reg-submit-btn" class="btn-primary-full">✨ 完成註冊並開始讀經</button>
            <button id="reg-back-btn" class="btn-soft-full">◀ 返回修改手機號碼</button>
          </div>
        </div>
      </div>
    `;

    authModal.querySelectorAll('[data-pick-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        authSelectedGroupId = Number(btn.dataset.pickGroup);
        authModal.querySelectorAll('[data-pick-group]').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    authModal.querySelector('#reg-back-btn')?.addEventListener('click', () => {
      authStep = 'credentials';
      renderAuthModalContent(prefillPhone, prefillPin);
    });

    authModal.querySelector('#reg-submit-btn')?.addEventListener('click', async e => {
      const nickname = authModal.querySelector('#reg-nickname').value.trim();
      if (!nickname) return showToast('請填寫您的姓名或暱稱喔！');
      if (!authSelectedGroupId) return showToast('請點選您所屬的小組！');

      const migrateCheck = authModal.querySelector('#reg-migrate-check');
      const migrate = (migrateCheck && migrateCheck.checked) ? {
        readChapters: store.state.readChapters,
        graceDays: store.state.graceDays,
        gardenItems: store.state.gardenItems,
        pluckedCount: store.state.pluckedCount,
        versesRead: localStats.versesRead,
        chaptersRead: localStats.chaptersRead,
        booksCompleted: localStats.booksCompleted,
        currentStreak: localStats.currentStreak,
        longestStreak: localStats.longestStreak
      } : undefined;

      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '建立帳號中…';
      try {
        const res = await api.register({
          phone: prefillPhone,
          pin: prefillPin,
          nickname,
          groupId: authSelectedGroupId,
          startDate: store.state.startDate || todayISO(),
          churchName: store.state.churchName || '安平靈糧堂',
          migrate
        });
        setAuthToken(res.token);
        store.applyCloudUserPayload(res.user);
        closeAuthModal();
        showToast(`🎉 註冊成功！歡迎 ${res.user.nickname} 加入「${res.user.groupName}小組」！`);
      } catch (err) {
        showToast(err.message);
        btn.disabled = false;
        btn.textContent = '✨ 完成註冊並開始讀經';
      }
    });
  }
}

window.addEventListener('open-auth-modal', openAuthModal);

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    store.activeTab = btn.dataset.tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderActiveTab();
  });
});

store.subscribe(() => {
  renderActiveTab();
});

setInterval(() => {
  if (store.state.timeMode === 'auto') {
    const prev = document.body.dataset.timePhase;
    const next = store.getActiveTimePhase();
    if (prev !== next) {
      syncAmbientTheme();
      if (store.activeTab === 'garden') renderActiveTab();
    }
  }
}, 60000);

// Initial Cloud-Aware Boot
(async function boot() {
  renderActiveTab();
  const ok = await store.hydrateCloudSession();
  if (!ok && !store.state.onboarded) {
    openAuthModal();
  }
  renderActiveTab();
})();
