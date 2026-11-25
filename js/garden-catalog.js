// Garden Item Catalog — 12 Storybook Illustrated Assets
// Supports awake/sleeping night variants for animals, warm night illumination for lanterns,
// perspective scaling, and Pikmin-style unlock progression.

export const TIME_PHASES = {
  morning: {
    id: 'morning',
    label: '早晨',
    emoji: '🌅',
    hours: '05:00–10:59',
    greeting: '每早晨，這都是新的！願神的話成為今日的力量',
    backdrop: 'assets/garden/garden_morning.jpg',
    itemFilter: 'brightness(1.03) saturate(1.06) sepia(0.10)',
    shadowOpacity: 0.30,
    shadowSkew: 'skewX(-18deg)',
    animalsSleep: false,
    lightsOn: false
  },
  noon: {
    id: 'noon',
    label: '中午',
    emoji: '☀️',
    hours: '11:00–15:59',
    greeting: '正午陽光普照，在青草地上歇息片刻讀段經文吧',
    backdrop: 'assets/garden/garden_noon.jpg',
    itemFilter: 'brightness(1.02) saturate(1.03)',
    shadowOpacity: 0.34,
    shadowSkew: 'skewX(-4deg)',
    animalsSleep: false,
    lightsOn: false
  },
  dusk: {
    id: 'dusk',
    label: '黃昏',
    emoji: '🌇',
    hours: '16:00–19:59',
    greeting: '夕陽西下，小屋窗燈漸亮，數算今天主所賜的恩典',
    backdrop: 'assets/garden/garden_dusk.jpg',
    itemFilter: 'brightness(0.92) saturate(1.12) sepia(0.24) hue-rotate(-8deg)',
    shadowOpacity: 0.38,
    shadowSkew: 'skewX(22deg)',
    animalsSleep: false,
    lightsOn: true
  },
  night: {
    id: 'night',
    label: '晚上',
    emoji: '🌙',
    hours: '20:00–04:59',
    greeting: '夜深星光照耀，小動物安歇入睡，明燈為你守護花園',
    backdrop: 'assets/garden/garden_night.jpg',
    itemFilter: 'brightness(0.64) contrast(1.06) saturate(0.82) hue-rotate(12deg)',
    shadowOpacity: 0.45,
    shadowSkew: 'skewX(8deg)',
    animalsSleep: true,
    lightsOn: true
  }
};

export function detectRealTimePhase(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'noon';
  if (h >= 16 && h < 20) return 'dusk';
  return 'night';
}

export const GARDEN_ITEMS = [
  // === ANIMALS (Rest & curl up to sleep at Night!) ===
  {
    id: 'lamb',
    name: '青草地小羊',
    category: 'animal',
    categoryLabel: '夥伴動物',
    spriteAwake: 'assets/items/lamb_awake.png',
    spriteSleep: 'assets/items/lamb_sleep.png',
    baseWidthPct: 16,
    isLight: false,
    starter: true,
    unlockText: '初始夥伴（開始讀經即同行）',
    verse: '耶和華是我的牧者，我必不致缺乏。（詩 23:1）',
    sleepNote: '小羊蜷縮在青草地上安穩睡著了…「他使我躺臥在青草地上」'
  },
  {
    id: 'dove',
    name: '平安白鴿',
    category: 'animal',
    categoryLabel: '夥伴動物',
    spriteAwake: 'assets/items/dove_awake.png',
    spriteSleep: 'assets/items/dove_sleep.png',
    baseWidthPct: 13.5,
    isLight: false,
    starter: false,
    unlockVerses: 100,
    unlockText: '讀滿 100 節（或拔出第 1 株花苗）解鎖',
    verse: '嘴裡叼著一個新擰下來的橄欖葉子。（創 8:11）',
    sleepNote: '白鴿收起翅膀安心入夢…「我將我的平安賜給你們」'
  },
  {
    id: 'camel',
    name: '曠野小駱駝',
    category: 'animal',
    categoryLabel: '夥伴動物',
    spriteAwake: 'assets/items/camel_awake.png',
    spriteSleep: 'assets/items/camel_sleep.png',
    baseWidthPct: 17.5,
    isLight: false,
    starter: false,
    unlockVerses: 400,
    unlockText: '讀滿 400 節（或歷史書探險）解鎖',
    verse: '忍耐也當成功，使你們成全、完備。（雅 1:4）',
    sleepNote: '小駱駝趴下來安靜歇息，為明天的旅途養足精神…'
  },

  // === LIGHT SOURCE (Lights up with warm golden glow at Dusk & Night!) ===
  {
    id: 'lantern',
    name: '腳前明燈',
    category: 'light',
    categoryLabel: '光影燈飾',
    spriteAwake: 'assets/items/lantern.png',
    baseWidthPct: 11,
    isLight: true,
    glowColor: 'rgba(255, 206, 108, 0.78)',
    starter: true,
    unlockText: '初始贈禮（黃昏與夜晚自動點亮！）',
    verse: '你的話是我腳前的燈，是我路上的光。（詩 119:105）',
    sleepNote: '明燈在夜裡散發溫暖微光，照亮花園裡的小徑'
  },

  // === PLANTS ===
  {
    id: 'lilies',
    name: '谷中百合花',
    category: 'plant',
    categoryLabel: '花卉植物',
    spriteAwake: 'assets/items/lilies.png',
    baseWidthPct: 17.5,
    isLight: false,
    starter: true,
    unlockText: '初始贈禮（讓花園綻放第一叢花）',
    verse: '你想野地裡的百合花怎麼長起來。（太 6:28）'
  },
  {
    id: 'olive_tree',
    name: '青橄欖盆栽',
    category: 'plant',
    categoryLabel: '花卉植物',
    spriteAwake: 'assets/items/olive_tree.png',
    baseWidthPct: 17,
    isLight: false,
    starter: false,
    unlockVerses: 80,
    unlockText: '完成第 1 天讀經（80 節）解鎖',
    verse: '至於我，就像神殿中的青橄欖樹。（詩 52:8）'
  },

  // === STRUCTURES & DECORATIONS ===
  {
    id: 'bench',
    name: '安歇木長椅',
    category: 'structure',
    categoryLabel: '花園建築',
    spriteAwake: 'assets/items/bench.png',
    baseWidthPct: 22,
    isLight: false,
    starter: true,
    unlockText: '初始贈禮（坐下靜心靈修）',
    verse: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。（太 11:28）'
  },
  {
    id: 'rose_arch',
    name: '恩典花拱門',
    category: 'structure',
    categoryLabel: '花園建築',
    spriteAwake: 'assets/items/rose_arch.png',
    baseWidthPct: 25,
    isLight: false,
    starter: false,
    unlockVerses: 250,
    unlockText: '讀滿 250 節解鎖',
    verse: '當稱謝進入他的門，當讚美進入他的院。（詩 100:4）'
  },
  {
    id: 'fountain',
    name: '活水噴泉',
    category: 'structure',
    categoryLabel: '花園建築',
    spriteAwake: 'assets/items/fountain.png',
    baseWidthPct: 21,
    isLight: false,
    starter: false,
    unlockVerses: 600,
    unlockText: '讀滿 600 節（或完成 1 卷書）解鎖',
    verse: '人若喝我所賜的水就永遠不渴，要在他裡頭成為泉源。（約 4:14）'
  },
  {
    id: 'noah_ark',
    name: '挪亞方舟',
    category: 'structure',
    categoryLabel: '花園建築',
    spriteAwake: 'assets/items/noah_ark.png',
    baseWidthPct: 20,
    isLight: false,
    starter: false,
    unlockVerses: 1000,
    unlockText: '讀滿 1,000 節（創世記旅途）解鎖',
    verse: '我把虹放在雲彩中，這就可作我與地立約的記號了。（創 9:13）'
  },
  {
    id: 'jacob_well',
    name: '雅各活水井',
    category: 'structure',
    categoryLabel: '花園建築',
    spriteAwake: 'assets/items/jacob_well.png',
    baseWidthPct: 19,
    isLight: false,
    starter: false,
    unlockVerses: 1500,
    unlockText: '讀滿 1,500 節（完成創世記）解鎖',
    verse: '所以，你們必從救恩的泉源歡然取水。（賽 12:3）'
  },
  {
    id: 'gazebo',
    name: '靜謐禱告涼亭',
    category: 'structure',
    categoryLabel: '花園建築',
    spriteAwake: 'assets/items/gazebo.png',
    baseWidthPct: 25,
    isLight: false,
    starter: false,
    unlockVerses: 2500,
    unlockText: '讀滿 2,500 節（30 天里程碑）解鎖',
    verse: '住在至高者隱密處的，必住在全能者的蔭下。（詩 91:1）'
  }
];

export function getItemDef(id) {
  return GARDEN_ITEMS.find(i => i.id === id);
}

// Beautiful starter arrangement (used on initial launch so the garden feels alive immediately)
export const STARTER_LAYOUT = [
  { uid: 'init-1', itemId: 'bench',   xPct: 77, yPct: 60, scaleMult: 1.0, flipX: false },
  { uid: 'init-2', itemId: 'lantern', xPct: 45, yPct: 68, scaleMult: 1.0, flipX: false },
  { uid: 'init-3', itemId: 'lamb',    xPct: 60, yPct: 80, scaleMult: 1.0, flipX: false },
  { uid: 'init-4', itemId: 'lilies',  xPct: 20, yPct: 81, scaleMult: 1.0, flipX: false }
];

// Full curated storybook arrangement matching the user's Gemini showcase image!
export const SHOWCASE_LAYOUT = [
  { uid: 'demo-1',  itemId: 'olive_tree', xPct: 39, yPct: 45, scaleMult: 0.92, flipX: false },
  { uid: 'demo-2',  itemId: 'gazebo',     xPct: 73, yPct: 45, scaleMult: 1.05, flipX: false },
  { uid: 'demo-3',  itemId: 'fountain',   xPct: 31, yPct: 55, scaleMult: 1.02, flipX: false },
  { uid: 'demo-4',  itemId: 'rose_arch',  xPct: 56, yPct: 56, scaleMult: 1.12, flipX: false },
  { uid: 'demo-5',  itemId: 'dove',       xPct: 56, yPct: 39, scaleMult: 0.72, flipX: false },
  { uid: 'demo-6',  itemId: 'bench',      xPct: 84, yPct: 61, scaleMult: 1.02, flipX: false },
  { uid: 'demo-7',  itemId: 'lantern',    xPct: 45, yPct: 70, scaleMult: 0.95, flipX: false },
  { uid: 'demo-8',  itemId: 'lantern',    xPct: 72, yPct: 52, scaleMult: 0.80, flipX: false },
  { uid: 'demo-9',  itemId: 'lamb',       xPct: 61, yPct: 80, scaleMult: 1.05, flipX: false },
  { uid: 'demo-10', itemId: 'lilies',     xPct: 20, yPct: 82, scaleMult: 1.06, flipX: false },
  { uid: 'demo-11', itemId: 'camel',      xPct: 82, yPct: 78, scaleMult: 0.96, flipX: true },
  { uid: 'demo-12', itemId: 'jacob_well', xPct: 18, yPct: 54, scaleMult: 0.88, flipX: false }
];
