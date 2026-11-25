// Main Application Bootstrapper
import { TIME_PHASES } from './garden-catalog.js';
import { store, todayISO } from './state.js';
import { renderTodayView, createBibleReader } from './today-view.js';
import { renderMapView } from './map-view.js';
import { renderGardenView } from './garden-view.js';
import { renderJournalView } from './journal-view.js';
import { renderMeView } from './me-view.js';

const mainEl = document.getElementById('app-main');
const onboardModal = document.getElementById('onboard-modal');
const toastEl = document.getElementById('toast');

// HUD elements
const hudChurch = document.getElementById('hud-church');
const hudVerses = document.getElementById('hud-verses');
const hudStreak = document.getElementById('hud-streak');
const hudTimeBadge = document.getElementById('hud-time-badge');
const yearBarFill = document.getElementById('year-bar-fill');
const yearBarLabel = document.getElementById('year-bar-label');

let toastTimer = null;
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3200);
}

const reader = createBibleReader({ showToast });

function syncAmbientTheme() {
  const phaseKey = store.getActiveTimePhase();
  const phase = TIME_PHASES[phaseKey];
  document.body.dataset.timePhase = phaseKey;
  if (hudTimeBadge) {
    hudTimeBadge.textContent = `${phase.emoji} ${phase.label}`;
    hudTimeBadge.title = `目前花園光影：${phase.label}（${phase.hours}）`;
  }
}

function renderHeader() {
  const state = store.state;
  const stats = store.getStats();
  hudChurch.textContent = `${state.churchName} · 一年讀經旅程`;
  hudVerses.textContent = `${stats.versesRead.toLocaleString()} 節`;
  hudStreak.textContent = `連續 ${stats.currentStreak} 天`;
  yearBarFill.style.width = `${Math.max(0.8, stats.percent)}%`;
  yearBarLabel.textContent = `${stats.percent}%`;
  syncAmbientTheme();

  // Garden tab badge if seedlings are ready to pluck
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
  } else if (tab === 'journal') {
    renderJournalView(mainEl, { showToast });
  } else if (tab === 'me') {
    renderMeView(mainEl, { showToast });
  }
}

function syncOnboarding() {
  if (!store.state.onboarded) {
    onboardModal.classList.add('show');
    onboardModal.setAttribute('aria-hidden', 'false');
    const dateInput = document.getElementById('onboard-date');
    if (dateInput && !dateInput.value) dateInput.value = todayISO();
  } else {
    onboardModal.classList.remove('show');
    onboardModal.setAttribute('aria-hidden', 'true');
  }
}

// Navigation Tab Listeners
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    store.activeTab = btn.dataset.tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderActiveTab();
  });
});

// Header Time Badge quick-jump to Garden
hudTimeBadge?.addEventListener('click', () => {
  store.activeTab = 'garden';
  renderActiveTab();
});

// Onboarding Buttons
document.getElementById('onboard-start-btn')?.addEventListener('click', () => {
  const dateVal = document.getElementById('onboard-date').value || todayISO();
  const nameVal = document.getElementById('onboard-name').value || '';
  const churchVal = document.getElementById('onboard-church').value || '安平靈糧堂';
  store.completeOnboarding(dateVal, nameVal, churchVal);
  store.activeTab = 'today';
  syncOnboarding();
  renderActiveTab();
  showToast('🌱 歡迎出發！從今天開始，一起走完一年整本聖經！');
});

document.getElementById('onboard-demo-btn')?.addEventListener('click', () => {
  store.loadDemoProgress();
  store.activeTab = 'garden';
  syncOnboarding();
  renderActiveTab();
  showToast('✨ 已進入第 100 天示範模式！試著切換早晨／中午／黃昏／晚上光影吧！');
});

// Re-render whenever state changes
store.subscribe(() => {
  syncOnboarding();
  renderActiveTab();
});

// Periodically refresh real-time lighting when in 'auto' mode (every 60s)
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

// Initial Boot
store.activeTab = store.state.onboarded ? 'garden' : 'today';
syncOnboarding();
renderActiveTab();
