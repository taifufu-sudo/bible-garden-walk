// Style B (Korean Pastel Gouache & Colored Pencil) Garden Catalog — 22 Distinct Items
// Includes 5 sleeping-at-night animals, 3 Dusk/Night glowing light sources, 7 plants/trees, & 7 structures/decor.
// Supports 100-verse continuous unlocks across the entire 31,102-verse Bible (311 total item drops!).

export const TIME_PHASES = {
  morning: {
    id: 'morning',
    label: '早晨',
    emoji: '🌅',
    hours: '05:00–10:59',
    greeting: '每早晨，這都是新的！晨光輕灑在寬敞的粉彩草地上',
    backdrop: 'assets/garden/garden_morning.jpg',
    itemFilter: 'brightness(1.03) saturate(1.05) sepia(0.08)',
    shadowOpacity: 0.24,
    shadowSkew: 'skewX(-16deg)',
    animalsSleep: false,
    lightsOn: false
  },
  noon: {
    id: 'noon',
    label: '中午',
    emoji: '☀️',
    hours: '11:00–15:59',
    greeting: '正午微風明朗，在寬敞的恩典草地上自由佈置你的花園吧',
    backdrop: 'assets/garden/garden_noon.jpg',
    itemFilter: 'brightness(1.01) saturate(1.02)',
    shadowOpacity: 0.26,
    shadowSkew: 'skewX(-3deg)',
    animalsSleep: false,
    lightsOn: false
  },
  dusk: {
    id: 'dusk',
    label: '黃昏',
    emoji: '🌇',
    hours: '16:00–19:59',
    greeting: '夕陽染上蜜桃與薰衣草色，小屋窗燈與花園明燈漸漸亮起',
    backdrop: 'assets/garden/garden_dusk.jpg',
    itemFilter: 'brightness(0.95) saturate(1.08) sepia(0.20) hue-rotate(-8deg)',
    shadowOpacity: 0.30,
    shadowSkew: 'skewX(20deg)',
    animalsSleep: false,
    lightsOn: true
  },
  night: {
    id: 'night',
    label: '晚上',
    emoji: '🌙',
    hours: '20:00–04:59',
    greeting: '月光與星斗守護花園，小動物們都蜷縮入睡，燈火正溫暖發亮',
    backdrop: 'assets/garden/garden_night.jpg',
    itemFilter: 'brightness(0.76) contrast(1.02) saturate(0.86) hue-rotate(10deg)',
    shadowOpacity: 0.36,
    shadowSkew: 'skewX(6deg)',
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

// 22 Distinct Style B Items (Unlock Order: 2 starter gifts in inventory + 1 new item every 100 verses, then repeating bonus copies!)
export const GARDEN_ITEMS = [
  // === STARTER GIFTS (Available in inventory immediately; lawn starts wide-open & empty!) ===
  {
    id: 'lamb',
    name: '青草地小羊',
    category: 'animal',
    categoryLabel: '動物夥伴',
    spriteAwake: 'assets/items/lamb_awake.png',
    spriteSleep: 'assets/items/lamb_sleep.png',
    baseWidthPct: 13.5,
    isLight: false,
    starter: true,
    unlockOrder: 0,
    unlockText: '初始迎新禮（已放入收藏庫）',
    verse: '耶和華是我的牧者，我必不致缺乏。（詩 23:1）',
    sleepNote: '小羊蜷縮在青草地上安穩睡著了…「他使我躺臥在青草地上」'
  },
  {
    id: 'lantern',
    name: '腳前明燈',
    category: 'light',
    categoryLabel: '光影燈飾',
    spriteAwake: 'assets/items/lantern.png',
    baseWidthPct: 8.8,
    isLight: true,
    glowScale: 1.0,
    starter: true,
    unlockOrder: 0,
    unlockText: '初始迎新禮（黃昏與夜晚會發光）',
    verse: '你的話是我腳前的燈，是我路上的光。（詩 119:105）',
    sleepNote: '明燈在夜裡散發暖黃微光，照亮整片粉彩草地'
  },

  // === 100-VERSE MILESTONE UNLOCKS (100 -> 2,000 verses unlock all 22 unique species, then continue accumulating copies!) ===
  {
    id: 'lilies',
    name: '谷中百合花',
    category: 'plant',
    categoryLabel: '花木植栽',
    spriteAwake: 'assets/items/lilies.png',
    baseWidthPct: 12.5,
    isLight: false,
    unlockOrder: 1,
    unlockVerses: 100,
    unlockText: '讀滿 100 節解鎖',
    verse: '你想野地裡的百合花怎麼長起來。（太 6:28）'
  },
  {
    id: 'dove',
    name: '平安白鴿',
    category: 'animal',
    categoryLabel: '動物夥伴',
    spriteAwake: 'assets/items/dove_awake.png',
    spriteSleep: 'assets/items/dove_sleep.png',
    baseWidthPct: 11.5,
    isLight: false,
    unlockOrder: 2,
    unlockVerses: 200,
    unlockText: '讀滿 200 節解鎖（夜晚會睡覺）',
    verse: '嘴裡叼著一個新擰下來的橄欖葉子。（創 8:11）',
    sleepNote: '白鴿收起翅膀安心入夢…「我將我的平安賜給你們」'
  },
  {
    id: 'bench',
    name: '安歇木長椅',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/bench.png',
    baseWidthPct: 16.5,
    isLight: false,
    unlockOrder: 3,
    unlockVerses: 300,
    unlockText: '讀滿 300 節解鎖',
    verse: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。（太 11:28）'
  },
  {
    id: 'olive_tree',
    name: '青橄欖盆栽',
    category: 'plant',
    categoryLabel: '花木植栽',
    spriteAwake: 'assets/items/olive_tree.png',
    baseWidthPct: 14,
    isLight: false,
    unlockOrder: 4,
    unlockVerses: 400,
    unlockText: '讀滿 400 節解鎖',
    verse: '至於我，就像神殿中的青橄欖樹。（詩 52:8）'
  },
  {
    id: 'bunny',
    name: '恩典小白兔',
    category: 'animal',
    categoryLabel: '動物夥伴',
    spriteAwake: 'assets/items/bunny_awake.png',
    spriteSleep: 'assets/items/bunny_sleep.png',
    baseWidthPct: 10.5,
    isLight: false,
    unlockOrder: 5,
    unlockVerses: 500,
    unlockText: '讀滿 500 節解鎖（夜晚會睡覺）',
    verse: '耶和華善待萬民；他的慈悲覆庇他一切所造的。（詩 145:9）',
    sleepNote: '小白兔團成一顆軟綿綿的毛球睡著了…'
  },
  {
    id: 'rose_arch',
    name: '恩典花拱門',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/rose_arch.png',
    baseWidthPct: 18,
    isLight: false,
    unlockOrder: 6,
    unlockVerses: 600,
    unlockText: '讀滿 600 節解鎖',
    verse: '當稱謝進入他的門，當讚美進入他的院。（詩 100:4）'
  },
  {
    id: 'sunflower',
    name: '向陽葵花叢',
    category: 'plant',
    categoryLabel: '花木植栽',
    spriteAwake: 'assets/items/sunflower.png',
    baseWidthPct: 14.5,
    isLight: false,
    unlockOrder: 7,
    unlockVerses: 700,
    unlockText: '讀滿 700 節解鎖',
    verse: '耶和華神是日頭，是盾牌，要賜下恩惠和榮耀。（詩 84:11）'
  },
  {
    id: 'fountain',
    name: '活水噴泉',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/fountain.png',
    baseWidthPct: 16.5,
    isLight: false,
    unlockOrder: 8,
    unlockVerses: 800,
    unlockText: '讀滿 800 節解鎖',
    verse: '人若喝我所賜的水就永遠不渴，要在他裡頭成為泉源。（約 4:14）'
  },
  {
    id: 'stone_lamp',
    name: '庭園小石燈',
    category: 'light',
    categoryLabel: '光影燈飾',
    spriteAwake: 'assets/items/stone_lamp.png',
    baseWidthPct: 10.5,
    isLight: true,
    glowScale: 1.05,
    unlockOrder: 9,
    unlockVerses: 900,
    unlockText: '讀滿 900 節解鎖（黃昏夜晚發光）',
    verse: '耶和華是我的亮光，是我的拯救。（詩 27:1）',
    sleepNote: '石燈裡的小燭火柔和搖曳，溫柔守望花園'
  },
  {
    id: 'camel',
    name: '曠野小駱駝',
    category: 'animal',
    categoryLabel: '動物夥伴',
    spriteAwake: 'assets/items/camel_awake.png',
    spriteSleep: 'assets/items/camel_sleep.png',
    baseWidthPct: 15,
    isLight: false,
    unlockOrder: 10,
    unlockVerses: 1000,
    unlockText: '讀滿 1,000 節解鎖（夜晚會睡覺）',
    verse: '忍耐也當成功，使你們成全、完備。（雅 1:4）',
    sleepNote: '小駱駝趴下來安靜歇息，為明天的旅途養足精神…'
  },
  {
    id: 'picnic_blanket',
    name: '團契野餐墊',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/picnic_blanket.png',
    baseWidthPct: 22,
    isLight: false,
    unlockOrder: 11,
    unlockVerses: 1100,
    unlockText: '讀滿 1,100 節解鎖',
    verse: '看哪，弟兄和睦同居是何等地善，何等地美！（詩 133:1）'
  },
  {
    id: 'hydrangea',
    name: '恩慈繡球花',
    category: 'plant',
    categoryLabel: '花木植栽',
    spriteAwake: 'assets/items/hydrangea.png',
    baseWidthPct: 15,
    isLight: false,
    unlockOrder: 12,
    unlockVerses: 1200,
    unlockText: '讀滿 1,200 節解鎖',
    verse: '他的恩典乃是一生之久。（詩 30:5）'
  },
  {
    id: 'noah_ark',
    name: '挪亞方舟',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/noah_ark.png',
    baseWidthPct: 17,
    isLight: false,
    unlockOrder: 13,
    unlockVerses: 1300,
    unlockText: '讀滿 1,300 節解鎖',
    verse: '我把虹放在雲彩中，這就可作我與地立約的記號了。（創 9:13）'
  },
  {
    id: 'birdhouse',
    name: '喜樂小鳥屋',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/birdhouse.png',
    baseWidthPct: 11,
    isLight: false,
    unlockOrder: 14,
    unlockVerses: 1400,
    unlockText: '讀滿 1,400 節解鎖',
    verse: '萬軍之耶和華啊，連麻雀也找著房屋，燕子也為自己找著菢雛之窩。（詩 84:3）'
  },
  {
    id: 'deer',
    name: '溪水小鹿',
    category: 'animal',
    categoryLabel: '動物夥伴',
    spriteAwake: 'assets/items/deer_awake.png',
    spriteSleep: 'assets/items/deer_sleep.png',
    baseWidthPct: 14,
    isLight: false,
    unlockOrder: 15,
    unlockVerses: 1500,
    unlockText: '讀滿 1,500 節解鎖（夜晚會睡覺）',
    verse: '神啊，我的心切慕你，如鹿切慕溪水。（詩 42:1）',
    sleepNote: '小鹿在月光下安靜蜷臥著，夢見清澈的溪水…'
  },
  {
    id: 'jacob_well',
    name: '雅各活水井',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/jacob_well.png',
    baseWidthPct: 16,
    isLight: false,
    unlockOrder: 16,
    unlockVerses: 1600,
    unlockText: '讀滿 1,600 節解鎖',
    verse: '所以，你們必從救恩的泉源歡然取水。（賽 12:3）'
  },
  {
    id: 'fig_tree',
    name: '無花果小樹',
    category: 'plant',
    categoryLabel: '花木植栽',
    spriteAwake: 'assets/items/fig_tree.png',
    baseWidthPct: 16.5,
    isLight: false,
    unlockOrder: 17,
    unlockVerses: 1700,
    unlockText: '讀滿 1,700 節解鎖',
    verse: '人人都要坐在自己葡萄樹下和無花果樹下，無人驚嚇。（彌 4:4）'
  },
  {
    id: 'string_lights',
    name: '星空串燈',
    category: 'light',
    categoryLabel: '光影燈飾',
    spriteAwake: 'assets/items/string_lights.png',
    baseWidthPct: 16,
    isLight: true,
    glowScale: 1.25,
    unlockOrder: 18,
    unlockVerses: 1800,
    unlockText: '讀滿 1,800 節解鎖（黃昏夜晚發光）',
    verse: '你們是世上的光。城造在山上是不能隱藏的。（太 5:14）',
    sleepNote: '一串暖黃小燈泡在星夜裡閃閃發亮，像把星星掛進花園裡'
  },
  {
    id: 'grapevine',
    name: '真葡萄樹棚架',
    category: 'plant',
    categoryLabel: '花木植栽',
    spriteAwake: 'assets/items/grapevine.png',
    baseWidthPct: 17,
    isLight: false,
    unlockOrder: 19,
    unlockVerses: 1900,
    unlockText: '讀滿 1,900 節解鎖',
    verse: '我是葡萄樹，你們是枝子。常在我裡面的，這人就多結果子。（約 15:5）'
  },
  {
    id: 'gazebo',
    name: '靜謐禱告涼亭',
    category: 'structure',
    categoryLabel: '建築擺飾',
    spriteAwake: 'assets/items/gazebo.png',
    baseWidthPct: 18.5,
    isLight: false,
    unlockOrder: 20,
    unlockVerses: 2000,
    unlockText: '讀滿 2,000 節解鎖',
    verse: '住在至高者隱密處的，必住在全能者的蔭下。（詩 91:1）'
  }
];

export const UNLOCK_SEQUENCE = GARDEN_ITEMS.filter(i => !i.starter).sort((a, b) => a.unlockOrder - b.unlockOrder);

export function getItemDef(id) {
  return GARDEN_ITEMS.find(i => i.id === id);
}

// Given N plucked 100-verse rewards (plus starter gifts), compute exact owned stock per itemId!
// First 20 plucks unlock every single one of the 20 non-starter items in order (100..2000 verses),
// then plucks 21..311 continuously award bonus copies cycling across all 22 items so the whole year stays rewarding!
export function computeInventoryStock(pluckedCount) {
  const stock = new Map();
  for (const item of GARDEN_ITEMS) {
    stock.set(item.id, item.starter ? 1 : 0);
  }
  for (let i = 0; i < pluckedCount; i++) {
    let targetItem;
    if (i < UNLOCK_SEQUENCE.length) {
      targetItem = UNLOCK_SEQUENCE[i];
    } else {
      targetItem = GARDEN_ITEMS[(i - UNLOCK_SEQUENCE.length) % GARDEN_ITEMS.length];
    }
    stock.set(targetItem.id, (stock.get(targetItem.id) || 0) + 1);
  }
  return stock;
}

// Predict what item the N-th pluck (1-based) yields
export function getRewardForPluckIndex(oneBasedIdx) {
  const i = oneBasedIdx - 1;
  if (i < UNLOCK_SEQUENCE.length) return UNLOCK_SEQUENCE[i];
  return GARDEN_ITEMS[(i - UNLOCK_SEQUENCE.length) % GARDEN_ITEMS.length];
}

// Initial garden starts WIDE-OPEN & EMPTY so users have full space to decorate freely!
export const STARTER_LAYOUT = [];

// Optional curated showcase layout (for Demo Mode or clicking "✨ 推薦擺設") — leaves plenty of breathing room!
export const SHOWCASE_LAYOUT = [
  { uid: 'demo-1',  itemId: 'gazebo',         xPct: 82, yPct: 47, scaleMult: 1.0,  flipX: false },
  { uid: 'demo-2',  itemId: 'fig_tree',       xPct: 62, yPct: 44, scaleMult: 0.95, flipX: false },
  { uid: 'demo-3',  itemId: 'rose_arch',      xPct: 47, yPct: 51, scaleMult: 0.96, flipX: false },
  { uid: 'demo-4',  itemId: 'dove',           xPct: 47, yPct: 37, scaleMult: 0.72, flipX: false },
  { uid: 'demo-5',  itemId: 'fountain',       xPct: 68, yPct: 58, scaleMult: 0.95, flipX: false },
  { uid: 'demo-6',  itemId: 'string_lights',  xPct: 81, yPct: 61, scaleMult: 0.96, flipX: false },
  { uid: 'demo-7',  itemId: 'olive_tree',     xPct: 34, yPct: 54, scaleMult: 0.92, flipX: false },
  { uid: 'demo-8',  itemId: 'bench',          xPct: 80, yPct: 73, scaleMult: 0.95, flipX: false },
  { uid: 'demo-9',  itemId: 'picnic_blanket', xPct: 55, yPct: 74, scaleMult: 0.95, flipX: false },
  { uid: 'demo-10', itemId: 'lantern',        xPct: 42, yPct: 68, scaleMult: 0.95, flipX: false },
  { uid: 'demo-11', itemId: 'stone_lamp',     xPct: 26, yPct: 64, scaleMult: 0.92, flipX: false },
  { uid: 'demo-12', itemId: 'lamb',           xPct: 44, yPct: 84, scaleMult: 1.0,  flipX: false },
  { uid: 'demo-13', itemId: 'bunny',          xPct: 64, yPct: 86, scaleMult: 0.95, flipX: false },
  { uid: 'demo-14', itemId: 'deer',           xPct: 77, yPct: 84, scaleMult: 0.96, flipX: true  },
  { uid: 'demo-15', itemId: 'lilies',         xPct: 33, yPct: 78, scaleMult: 0.95, flipX: false },
  { uid: 'demo-16', itemId: 'hydrangea',      xPct: 90, yPct: 64, scaleMult: 0.92, flipX: false }
];
