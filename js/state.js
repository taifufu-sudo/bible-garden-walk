// Application State Manager — Cloud-Synced Pastoral Zone Multiplayer + Local Fallback
import {
  BIBLE_BOOKS,
  READING_PLAN,
  TOTAL_VERSES,
  TOTAL_CHAPTERS,
  FRUIT_STAGES
} from './bible-data.js';
import {
  GARDEN_ITEMS,
  STARTER_LAYOUT,
  SHOWCASE_LAYOUT,
  computeInventoryStock,
  getRewardForPluckIndex,
  detectRealTimePhase
} from './garden-catalog.js';
import { api, getAuthToken, setAuthToken } from './api.js';

const STORAGE_KEY = 'bible_garden_walk_v2';
const LEGACY_KEY = 'bible_garden_walk_v1';

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDaysISO(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return todayISO(dt);
}

export function diffDaysISO(startIso, targetIso) {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ty, tm, td] = targetIso.split('-').map(Number);
  const a = new Date(sy, sm - 1, sd);
  const b = new Date(ty, tm - 1, td);
  return Math.round((b - a) / 86400000);
}

export function getWeekKey(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayOfWeek = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dayOfWeek);
  return todayISO(dt);
}

function defaultState() {
  return {
    onboarded: false,
    nickname: '',
    churchName: '安平靈糧堂',
    startDate: todayISO(),
    readChapters: {},
    graceDays: {},
    pluckedCount: 0,
    pluckedLog: [],
    waterEnergy: 0,       // Bonus seedling energy from groupmates watering & weekly group goals!
    gardenItems: structuredClone(STARTER_LAYOUT),
    timeMode: 'auto',
    readerFontSize: 'md',
    journal: []
  };
}

class AppStore {
  constructor() {
    this.state = this._load();
    this.listeners = new Set();
    this.activeTab = 'today';
    this.selectedDate = todayISO();

    // Cloud Multiplayer Session State
    this.cloudUser = null;
    this.cloudInbox = [];
    this.cloudGroups = [];
    this.syncTimer = null;
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...defaultState(), ...JSON.parse(raw) };
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const old = JSON.parse(legacy);
        return {
          ...defaultState(),
          onboarded: Boolean(old.onboarded),
          nickname: old.nickname || '',
          churchName: old.churchName || '安平靈糧堂',
          startDate: old.startDate || todayISO(),
          readChapters: old.readChapters || {},
          graceDays: old.graceDays || {},
          pluckedCount: old.pluckedCount || 0,
          readerFontSize: old.readerFontSize || 'md',
          journal: Array.isArray(old.journal) ? old.journal : [],
          gardenItems: []
        };
      }
      return defaultState();
    } catch {
      return defaultState();
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {}
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify({ skipCloudSync = false } = {}) {
    this._save();
    if (!skipCloudSync && this.isCloudLoggedIn()) {
      this._scheduleCloudSync();
    }
    for (const fn of this.listeners) fn(this.state);
  }

  isCloudLoggedIn() {
    return Boolean(getAuthToken() && this.cloudUser);
  }

  applyCloudUserPayload(user, inbox = null, journalRows = null) {
    this.cloudUser = user;
    if (Array.isArray(inbox)) this.cloudInbox = inbox;
    this.state.onboarded = true;
    this.state.nickname = user.nickname || this.state.nickname;
    this.state.churchName = user.churchName || this.state.churchName;
    this.state.startDate = user.startDate || this.state.startDate;
    this.state.readChapters = user.readChapters || {};
    this.state.graceDays = user.graceDays || {};
    this.state.gardenItems = Array.isArray(user.gardenItems) ? user.gardenItems : [];
    this.state.pluckedCount = user.pluckedCount || 0;
    this.state.waterEnergy = user.waterEnergy || 0;
    if (Array.isArray(journalRows)) {
      this.state.journal = journalRows.map(r => ({
        id: String(r.id),
        date: r.date_iso,
        mood: r.mood || '✨',
        verse: r.verse || '',
        note: r.note || '',
        isShared: Boolean(r.is_shared)
      }));
    }
    this.notify({ skipCloudSync: true });
  }

  async hydrateCloudSession() {
    try {
      const grpRes = await api.getGroups();
      this.cloudGroups = grpRes.groups || [];
    } catch {
      // Offline fallback groups
      this.cloudGroups = [
        { id: 1, name: '迦南' }, { id: 2, name: '讚美' }, { id: 3, name: '宇光' },
        { id: 4, name: '何其美' }, { id: 5, name: '橄欖樹' }, { id: 6, name: '跨越' }, { id: 7, name: '五餅二魚' }
      ];
    }

    if (!getAuthToken()) return false;
    try {
      const res = await api.getMe();
      this.applyCloudUserPayload(res.user, res.inbox, res.journal);
      return true;
    } catch (err) {
      if (err.status === 401) {
        setAuthToken('');
        this.cloudUser = null;
      }
      return false;
    }
  }

  async refreshFromCloud() {
    if (!getAuthToken()) return;
    try {
      const res = await api.getMe();
      this.applyCloudUserPayload(res.user, res.inbox, res.journal);
    } catch {}
  }

  async logoutCloud() {
    try { await api.logout(); } catch {}
    setAuthToken('');
    this.cloudUser = null;
    this.cloudInbox = [];
    this.state = defaultState();
    this.notify({ skipCloudSync: true });
  }

  _scheduleCloudSync() {
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => this.syncNow(), 550);
  }

  async syncNow() {
    if (!this.isCloudLoggedIn()) return;
    const stats = this.getStats();
    try {
      await api.syncMe({
        readChapters: this.state.readChapters,
        graceDays: this.state.graceDays,
        gardenItems: this.state.gardenItems,
        pluckedCount: this.state.pluckedCount,
        versesRead: stats.versesRead,
        chaptersRead: stats.chaptersRead,
        booksCompleted: stats.booksCompleted,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak
      });
    } catch {
      // Quietly retry on next action if briefly offline
    }
  }

  getActiveTimePhase() {
    if (this.state.timeMode === 'auto') return detectRealTimePhase();
    return this.state.timeMode;
  }

  setTimeMode(mode) {
    this.state.timeMode = mode;
    this.notify({ skipCloudSync: true });
  }

  completeOnboarding(startDate, nickname, churchName) {
    this.state.onboarded = true;
    this.state.startDate = startDate || todayISO();
    if (nickname !== undefined) this.state.nickname = nickname.trim().slice(0, 20);
    if (churchName !== undefined && churchName.trim()) {
      this.state.churchName = churchName.trim().slice(0, 24);
    }
    this.selectedDate = todayISO();
    this.notify();
  }

  async updateProfile({ nickname, churchName, startDate, groupId }) {
    if (nickname !== undefined) this.state.nickname = nickname.trim().slice(0, 20);
    if (churchName !== undefined && churchName.trim()) {
      this.state.churchName = churchName.trim().slice(0, 24);
    }
    if (startDate) this.state.startDate = startDate;
    if (this.isCloudLoggedIn()) {
      const res = await api.updateProfile({
        nickname: this.state.nickname,
        churchName: this.state.churchName,
        startDate: this.state.startDate,
        groupId
      });
      this.cloudUser = res.user;
    }
    this.notify({ skipCloudSync: true });
  }

  setReaderFontSize(sz) {
    this.state.readerFontSize = sz;
    this.notify({ skipCloudSync: true });
  }

  markChapterRead(bookId, chapter, read = true) {
    const key = `${bookId}:${chapter}`;
    if (read) this.state.readChapters[key] = todayISO();
    else delete this.state.readChapters[key];
    this.notify();
  }

  isChapterRead(bookId, chapter) {
    return Boolean(this.state.readChapters[`${bookId}:${chapter}`]);
  }

  canUseGraceCard(dateIso = todayISO()) {
    const wk = getWeekKey(dateIso);
    return !Object.values(this.state.graceDays).includes(wk);
  }

  useGraceCard(dateIso) {
    const wk = getWeekKey(dateIso);
    if (Object.values(this.state.graceDays).includes(wk)) return false;
    this.state.graceDays[dateIso] = wk;
    this.notify();
    return true;
  }

  getStats() {
    let versesRead = 0;
    let chaptersRead = 0;
    let booksCompleted = 0;
    const bookProgress = new Map();

    for (const book of BIBLE_BOOKS) {
      let bCh = 0;
      let bVer = 0;
      for (let c = 1; c <= book.chapterCount; c++) {
        if (this.state.readChapters[`${book.id}:${c}`]) {
          bCh++;
          bVer += book.verses[c - 1];
        }
      }
      chaptersRead += bCh;
      versesRead += bVer;
      if (bCh === book.chapterCount) booksCompleted++;
      bookProgress.set(book.id, {
        readChapters: bCh,
        totalChapters: book.chapterCount,
        readVerses: bVer,
        totalVerses: book.verseCount,
        completed: bCh === book.chapterCount
      });
    }

    const completedPlanDays = new Set();
    for (const d of READING_PLAN) {
      if (d.chapters.every(c => this.state.readChapters[c.key])) {
        completedPlanDays.add(d.day);
      }
    }

    const today = todayISO();
    const todayPlanDay = diffDaysISO(this.state.startDate, today) + 1;
    let currentStreak = 0;
    let longestStreak = 0;
    let running = 0;

    const maxCheckDay = Math.min(365, Math.max(0, todayPlanDay));
    for (let day = 1; day <= maxCheckDay; day++) {
      const iso = addDaysISO(this.state.startDate, day - 1);
      const done = completedPlanDays.has(day) || Boolean(this.state.graceDays[iso]);
      if (done) {
        running++;
        if (running > longestStreak) longestStreak = running;
      } else if (day < maxCheckDay) {
        running = 0;
      }
    }
    if (maxCheckDay >= 1) {
      let d = maxCheckDay;
      const todayIso = addDaysISO(this.state.startDate, d - 1);
      const todayDone = completedPlanDays.has(d) || Boolean(this.state.graceDays[todayIso]);
      if (!todayDone) d--;
      while (d >= 1) {
        const iso = addDaysISO(this.state.startDate, d - 1);
        if (completedPlanDays.has(d) || Boolean(this.state.graceDays[iso])) {
          currentStreak++;
          d--;
        } else {
          break;
        }
      }
    }

    // Seedling Energy = Honest Bible Verses + Group Watering / Weekly Bonus Energy!
    const waterEnergy = this.state.waterEnergy || 0;
    const totalSeedlingEnergy = versesRead + waterEnergy;
    const totalEarnedSeedlings = Math.floor(totalSeedlingEnergy / 100);
    const effectivePlucked = Math.min(this.state.pluckedCount, totalEarnedSeedlings);
    const readyToPluck = Math.max(0, totalEarnedSeedlings - effectivePlucked);
    const nextSeedlingProgress = totalSeedlingEnergy % 100;

    const inventoryStock = computeInventoryStock(effectivePlucked);
    const unlockedItemIds = new Set();
    let totalOwnedObjects = 0;
    for (const [itemId, qty] of inventoryStock.entries()) {
      if (qty > 0) {
        unlockedItemIds.add(itemId);
        totalOwnedObjects += qty;
      }
    }

    const unlockedFruits = FRUIT_STAGES.map(stage => {
      let totalCh = 0;
      let readCh = 0;
      for (let d = stage.startDay; d <= stage.endDay; d++) {
        const plan = READING_PLAN[d - 1];
        if (!plan) continue;
        for (const ch of plan.chapters) {
          totalCh++;
          if (this.state.readChapters[ch.key]) readCh++;
        }
      }
      return {
        ...stage,
        totalCh,
        readCh,
        completed: totalCh > 0 && readCh === totalCh,
        pct: totalCh > 0 ? Math.round((readCh / totalCh) * 100) : 0
      };
    });

    return {
      versesRead,
      waterEnergy,
      totalVerses: TOTAL_VERSES,
      percent: Number(((versesRead / TOTAL_VERSES) * 100).toFixed(1)),
      chaptersRead,
      totalChapters: TOTAL_CHAPTERS,
      booksCompleted,
      bookProgress,
      completedPlanDays,
      currentStreak,
      longestStreak,
      totalEarnedSeedlings,
      effectivePlucked,
      readyToPluck,
      nextSeedlingProgress,
      inventoryStock,
      totalOwnedObjects,
      unlockedFruits,
      unlockedItemIds,
      todayPlanDay
    };
  }

  pluckSeedling() {
    const stats = this.getStats();
    if (stats.readyToPluck <= 0) return null;
    const nextIndex = stats.effectivePlucked + 1;
    const rewardItem = getRewardForPluckIndex(nextIndex);
    const prevQty = stats.inventoryStock.get(rewardItem.id) || 0;

    this.state.pluckedCount = nextIndex;
    const entry = {
      id: `unlock-${nextIndex}`,
      num: nextIndex,
      itemId: rewardItem.id,
      name: rewardItem.name,
      isNewSpecies: prevQty === 0,
      newQty: prevQty + 1,
      date: todayISO()
    };
    this.state.pluckedLog.unshift(entry);
    if (this.state.pluckedLog.length > 60) this.state.pluckedLog.length = 60;
    this.notify();
    return entry;
  }

  pluckAllSeedlings() {
    const stats = this.getStats();
    if (stats.readyToPluck <= 0) return 0;
    const count = stats.readyToPluck;
    let current = stats.effectivePlucked;
    for (let k = 0; k < count; k++) {
      current += 1;
      const item = getRewardForPluckIndex(current);
      this.state.pluckedLog.unshift({
        id: `unlock-${current}`,
        num: current,
        itemId: item.id,
        name: item.name,
        date: todayISO()
      });
    }
    this.state.pluckedCount = current;
    if (this.state.pluckedLog.length > 60) this.state.pluckedLog.length = 60;
    this.notify();
    return count;
  }

  addGardenItem(itemId, xPct = 55, yPct = 68) {
    const stats = this.getStats();
    const owned = stats.inventoryStock.get(itemId) || 0;
    const placed = this.state.gardenItems.filter(g => g.itemId === itemId).length;
    if (placed >= owned) return null;

    const uid = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const item = {
      uid,
      itemId,
      xPct: Math.max(6, Math.min(94, xPct)),
      yPct: Math.max(36, Math.min(94, yPct)),
      scaleMult: 1.0,
      flipX: false
    };
    this.state.gardenItems.push(item);
    this.notify();
    return item;
  }

  updateGardenItem(uid, patch) {
    const target = this.state.gardenItems.find(i => i.uid === uid);
    if (!target) return;
    Object.assign(target, patch);
    target.xPct = Math.max(6, Math.min(94, target.xPct));
    target.yPct = Math.max(36, Math.min(94, target.yPct));
    target.scaleMult = Math.max(0.55, Math.min(1.45, target.scaleMult || 1.0));
    this.notify();
  }

  removeGardenItem(uid) {
    this.state.gardenItems = this.state.gardenItems.filter(i => i.uid !== uid);
    this.notify();
  }

  applyShowcaseLayout() {
    const stats = this.getStats();
    const used = new Map();
    const next = [];
    for (const sc of SHOWCASE_LAYOUT) {
      const owned = stats.inventoryStock.get(sc.itemId) || 0;
      const count = used.get(sc.itemId) || 0;
      if (count < owned) {
        used.set(sc.itemId, count + 1);
        next.push({ ...sc, uid: `sc-${sc.uid}-${Date.now().toString(36).slice(-3)}` });
      }
    }
    this.state.gardenItems = next;
    this.notify();
  }

  clearGarden() {
    this.state.gardenItems = [];
    this.notify();
  }

  addJournalEntry({ verse, note, mood }) {
    const entry = {
      id: `j-${Date.now()}`,
      date: todayISO(),
      verse: verse.trim(),
      note: note.trim(),
      mood: mood || '✨'
    };
    this.state.journal.unshift(entry);
    this.notify({ skipCloudSync: true });
    return entry;
  }

  deleteJournalEntry(id) {
    this.state.journal = this.state.journal.filter(j => j.id !== id);
    this.notify({ skipCloudSync: true });
  }

  loadDemoProgress() {
    const start = addDaysISO(todayISO(), -99);
    this.state.onboarded = true;
    this.state.startDate = start;
    if (!this.state.nickname) this.state.nickname = '恩典旅人';
    this.state.readChapters = {};
    for (let d = 0; d < 100; d++) {
      const plan = READING_PLAN[d];
      const dt = addDaysISO(start, d);
      for (const ch of plan.chapters) {
        this.state.readChapters[ch.key] = dt;
      }
    }
    this.state.graceDays = {};
    this.state.pluckedCount = 82;
    this.state.gardenItems = structuredClone(SHOWCASE_LAYOUT);
    this.selectedDate = todayISO();
    this.notify();
  }

  resetAll() {
    this.state = defaultState();
    this.selectedDate = todayISO();
    this.notify({ skipCloudSync: true });
  }
}

export const store = new AppStore();
