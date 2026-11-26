// Application State Manager with localStorage persistence & 100-verse continuous unlock economy
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
    readChapters: {},     // { "1:1": "2026-11-26" }
    graceDays: {},        // { "2026-11-25": "weekKey" }
    pluckedCount: 0,      // 1 garden unlock earned every 100 verses read (up to 311 across the Bible!)
    pluckedLog: [],       // [{ id, num, itemId, name, date }]
    gardenItems: structuredClone(STARTER_LAYOUT), // Starts wide-open & empty!
    timeMode: 'auto',     // 'auto' | 'morning' | 'noon' | 'dusk' | 'night'
    readerFontSize: 'md', // 'sm' | 'md' | 'lg' | 'xl'
    journal: []           // [{ id, date, verse, note, mood }]
  };
}

class AppStore {
  constructor() {
    this.state = this._load();
    this.listeners = new Set();
    this.activeTab = 'garden';
    this.selectedDate = todayISO();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...defaultState(), ...JSON.parse(raw) };
      }
      // Smoothly migrate v1 reading progress & journal while starting fresh on the new spacious Style B lawn
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
          gardenItems: [] // Fresh empty Style B lawn!
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
    } catch {
      // Storage quota fallback
    }
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    this._save();
    for (const fn of this.listeners) fn(this.state);
  }

  getActiveTimePhase() {
    if (this.state.timeMode === 'auto') return detectRealTimePhase();
    return this.state.timeMode;
  }

  setTimeMode(mode) {
    this.state.timeMode = mode;
    this.notify();
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

  updateProfile({ nickname, churchName, startDate }) {
    if (nickname !== undefined) this.state.nickname = nickname.trim().slice(0, 20);
    if (churchName !== undefined && churchName.trim()) {
      this.state.churchName = churchName.trim().slice(0, 24);
    }
    if (startDate) this.state.startDate = startDate;
    this.notify();
  }

  setReaderFontSize(sz) {
    this.state.readerFontSize = sz;
    this.notify();
  }

  markChapterRead(bookId, chapter, read = true) {
    const key = `${bookId}:${chapter}`;
    if (read) {
      this.state.readChapters[key] = todayISO();
    } else {
      delete this.state.readChapters[key];
    }
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

    // 100-Verse Continuous Garden Unlock Math (31,102 verses = 311 total item drops!)
    const totalEarnedSeedlings = Math.floor(versesRead / 100);
    const effectivePlucked = Math.min(this.state.pluckedCount, totalEarnedSeedlings);
    const readyToPluck = Math.max(0, totalEarnedSeedlings - effectivePlucked);
    const nextSeedlingProgress = versesRead % 100;

    // Exact owned stock per item based on starter gifts + plucked 100-verse rewards
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

  // Pluck 1 ready 100-verse seedling -> unlocks next new item or bonus copy!
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

  // Free-form Garden Placement (respecting earned inventory stock!)
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
    this.notify();
    return entry;
  }

  deleteJournalEntry(id) {
    this.state.journal = this.state.journal.filter(j => j.id !== id);
    this.notify();
  }

  // Demo Mode: 100 days read (8,512 verses = 85 unlocks across all 22 Style B items!), with 3 ready to pluck!
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
    this.state.pluckedCount = 82; // 85 earned -> 82 already unpacked (3-5 copies of every item!), 3 ready to pluck!
    this.state.pluckedLog = [
      { id: 'unlock-82', num: 82, itemId: 'deer', name: '溪水小鹿', date: todayISO() },
      { id: 'unlock-81', num: 81, itemId: 'string_lights', name: '星空串燈', date: addDaysISO(todayISO(), -1) },
      { id: 'unlock-80', num: 80, itemId: 'bunny', name: '恩典小白兔', date: addDaysISO(todayISO(), -2) }
    ];
    this.state.gardenItems = structuredClone(SHOWCASE_LAYOUT);
    if (this.state.journal.length === 0) {
      this.state.journal.push({
        id: 'j-demo-1',
        date: todayISO(),
        verse: '詩篇 23:1-2',
        note: '今天走完第 100 天讀經！粉彩花園裡的小羊、小鹿與小白兔在月光下安穩睡著了，明燈和星空串燈好溫暖。',
        mood: '🕊️'
      });
    }
    this.selectedDate = todayISO();
    this.notify();
  }

  resetAll() {
    this.state = defaultState();
    this.selectedDate = todayISO();
    this.notify();
  }
}

export const store = new AppStore();
