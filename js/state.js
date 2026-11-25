// Application State Manager with localStorage persistence
import {
  BIBLE_BOOKS,
  ALL_CHAPTERS,
  READING_PLAN,
  TOTAL_VERSES,
  TOTAL_CHAPTERS,
  FRUIT_STAGES
} from './bible-data.js';
import {
  GARDEN_ITEMS,
  STARTER_LAYOUT,
  SHOWCASE_LAYOUT,
  detectRealTimePhase
} from './garden-catalog.js';

const STORAGE_KEY = 'bible_garden_walk_v1';

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
  // Monday-based ISO week start date string
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
    readChapters: {},     // { "1:1": "2026-11-25" }
    graceDays: {},        // { "2026-11-24": "weekKey" }
    pluckedCount: 0,      // Pikmin-style plucked seedlings (1 per 100 verses)
    pluckedLog: [],       // [{ id, species, name, date }]
    gardenItems: structuredClone(STARTER_LAYOUT),
    timeMode: 'auto',     // 'auto' | 'morning' | 'noon' | 'dusk' | 'night'
    readerFontSize: 'md', // 'sm' | 'md' | 'lg'
    journal: []           // [{ id, date, verse, note, mood }]
  };
}

class AppStore {
  constructor() {
    this.state = this._load();
    this.listeners = new Set();
    this.activeTab = 'garden'; // Will switch to 'today' after onboarding, or user clicks
    this.selectedDate = todayISO();
  }

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return { ...defaultState(), ...parsed };
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

  // Toggle chapter read status
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

  // Use weekly grace card on a specific date
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

  // Computed metrics
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

    // Check which day indices (1..365) are completed
    const completedPlanDays = new Set();
    for (const d of READING_PLAN) {
      if (d.chapters.every(c => this.state.readChapters[c.key])) {
        completedPlanDays.add(d.day);
      }
    }

    // Streak calculation relative to startDate up to today
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
    // Current streak: count backwards from today (or yesterday if today not finished yet)
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

    // Pikmin-style Seedling / Companion math (1 seedling blooms every 100 verses!)
    const totalEarnedSeedlings = Math.floor(versesRead / 100);
    const readyToPluck = Math.max(0, totalEarnedSeedlings - this.state.pluckedCount);
    const nextSeedlingProgress = versesRead % 100;

    // Unlocked fruit stages
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

    // Unlocked garden items
    const unlockedItemIds = new Set();
    for (const item of GARDEN_ITEMS) {
      if (item.starter) {
        unlockedItemIds.add(item.id);
      } else if (item.unlockVerses && versesRead >= item.unlockVerses) {
        unlockedItemIds.add(item.id);
      }
    }
    if (this.state.pluckedCount >= 1) unlockedItemIds.add('dove');
    if (booksCompleted >= 1) unlockedItemIds.add('fountain');

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
      readyToPluck,
      nextSeedlingProgress,
      unlockedFruits,
      unlockedItemIds,
      todayPlanDay
    };
  }

  // Pluck a ready seedling (Pikmin Bloom style!)
  pluckSeedling() {
    const stats = this.getStats();
    if (stats.readyToPluck <= 0) return null;
    const speciesPool = [
      { id: 'lamb', name: '青草地小羊', emoji: '🐑' },
      { id: 'dove', name: '平安白鴿', emoji: '🕊️' },
      { id: 'camel', name: '曠野小駱駝', emoji: '🐪' }
    ];
    const picked = speciesPool[this.state.pluckedCount % speciesPool.length];
    this.state.pluckedCount += 1;
    const entry = {
      id: `pal-${this.state.pluckedCount}`,
      num: this.state.pluckedCount,
      species: picked.id,
      name: `${picked.name} #${this.state.pluckedCount}`,
      emoji: picked.emoji,
      date: todayISO()
    };
    this.state.pluckedLog.unshift(entry);
    this.notify();
    return entry;
  }

  // Garden manipulation (free-form x/y placement!)
  addGardenItem(itemId, xPct = 50, yPct = 70) {
    const uid = `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const placed = {
      uid,
      itemId,
      xPct: Math.max(8, Math.min(92, xPct)),
      yPct: Math.max(36, Math.min(91, yPct)),
      scaleMult: 1.0,
      flipX: false
    };
    this.state.gardenItems.push(placed);
    this.notify();
    return placed;
  }

  updateGardenItem(uid, patch) {
    const target = this.state.gardenItems.find(i => i.uid === uid);
    if (!target) return;
    Object.assign(target, patch);
    target.xPct = Math.max(6, Math.min(94, target.xPct));
    target.yPct = Math.max(34, Math.min(92, target.yPct));
    target.scaleMult = Math.max(0.65, Math.min(1.45, target.scaleMult || 1.0));
    this.notify();
  }

  removeGardenItem(uid) {
    this.state.gardenItems = this.state.gardenItems.filter(i => i.uid !== uid);
    this.notify();
  }

  applyShowcaseLayout() {
    const stats = this.getStats();
    // Place all unlocked items from showcase layout
    this.state.gardenItems = SHOWCASE_LAYOUT
      .filter(i => stats.unlockedItemIds.has(i.itemId))
      .map(i => ({ ...i, uid: `sc-${i.uid}-${Date.now().toString(36).slice(-3)}` }));
    this.notify();
  }

  clearGarden() {
    this.state.gardenItems = [];
    this.notify();
  }

  // Journal
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

  // Demo Mode: Populate 100 days of reading, companions, showcase garden, and sample journal!
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
    this.state.pluckedCount = 82; // Leaves ~3 ready to pluck so user can try the pluck animation!
    this.state.pluckedLog = [
      { id: 'pal-82', num: 82, species: 'lamb', name: '青草地小羊 #82', emoji: '🐑', date: todayISO() },
      { id: 'pal-81', num: 81, species: 'camel', name: '曠野小駱駝 #81', emoji: '🐪', date: addDaysISO(todayISO(), -1) },
      { id: 'pal-80', num: 80, species: 'dove', name: '平安白鴿 #80', emoji: '🕊️', date: addDaysISO(todayISO(), -2) }
    ];
    this.state.gardenItems = structuredClone(SHOWCASE_LAYOUT);
    if (this.state.journal.length === 0) {
      this.state.journal.push({
        id: 'j-demo-1',
        date: todayISO(),
        verse: '詩篇 23:1-2',
        note: '今天走完第 100 天讀經！看見花園裡的小羊在月光下安穩睡著，心裡也跟著平靜下來。',
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
