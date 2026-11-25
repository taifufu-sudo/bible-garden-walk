// Complete 66-book Bible dataset (1,189 chapters, 31,102 verses - KJV/CUV versification)
// 10 Exploration Zones, 12 Fruit of the Spirit Stages, 365-day Sequential Plan, and Public-Domain 1919 CUV texts

export const MAP_ZONES = [
  {
    id: 'pentateuch',
    name: '律法書 · 應許起點',
    shortName: '律法書',
    emoji: '📜',
    landmark: '伊甸園與西奈山',
    color: '#5ba868',
    companion: 'lamb',
    x: 11, y: 78,
    desc: '從起初創造、挪亞方舟到出埃及過紅海，踏上信心的第一步。'
  },
  {
    id: 'history',
    name: '歷史書 · 應許之地',
    shortName: '歷史書',
    emoji: '🏰',
    landmark: '約旦河與耶路撒冷',
    color: '#d49a45',
    companion: 'camel',
    x: 24, y: 57,
    desc: '走過約書亞記、大衛王國與重建城牆，見證神在歷史中的信實。'
  },
  {
    id: 'poetry',
    name: '詩歌智慧 · 青草溪水',
    shortName: '詩歌智慧書',
    emoji: '🎶',
    landmark: '琴歌花園與溪水旁',
    color: '#4ea39e',
    companion: 'dove',
    x: 36, y: 73,
    desc: '在詩篇的讚美與箴言的智慧中，讓心靈在可安歇的水邊得力。'
  },
  {
    id: 'major_prophets',
    name: '大先知書 · 守望高山',
    shortName: '大先知書',
    emoji: '📯',
    landmark: '錫安守望台',
    color: '#8872b8',
    companion: 'dove',
    x: 47, y: 46,
    desc: '以賽亞至但以理的安慰與異象，在幽谷中仰望彌賽亞的曙光。'
  },
  {
    id: 'minor_prophets',
    name: '小先知書 · 晨光山谷',
    shortName: '小先知書',
    emoji: '🌸',
    landmark: '公義與憐憫之谷',
    color: '#d97696',
    companion: 'lamb',
    x: 56, y: 66,
    desc: '十二位先知呼喚回轉與盼望，如春雨滋潤等待甦醒的大地。'
  },
  {
    id: 'gospels',
    name: '四福音書 · 加利利海',
    shortName: '福音書',
    emoji: '✝️',
    landmark: '加利利湖畔與橄欖山',
    color: '#4f8ed6',
    companion: 'lamb',
    x: 65, y: 39,
    desc: '與耶穌同行加利利、聽登山寶訓，領受十字架與復活的恩典。'
  },
  {
    id: 'acts',
    name: '使徒行傳 · 五旬節火',
    shortName: '使徒行傳',
    emoji: '🔥',
    landmark: '馬可樓與宣教港口',
    color: '#e06c4e',
    companion: 'dove',
    x: 74, y: 57,
    desc: '聖靈降臨、福音從耶路撒冷出發，一直傳揚到地極。'
  },
  {
    id: 'paul',
    name: '保羅書信 · 愛海航道',
    shortName: '保羅書信',
    emoji: '💌',
    landmark: '地中海群島教會',
    color: '#c978b2',
    companion: 'camel',
    x: 82, y: 36,
    desc: '十三封滿載恩典與真理的書信，建造教會也堅固每一顆信心的心。'
  },
  {
    id: 'general',
    name: '普通書信 · 雲彩見證',
    shortName: '普通書信',
    emoji: '🌿',
    landmark: '信望愛燈塔',
    color: '#63a878',
    companion: 'dove',
    x: 89, y: 58,
    desc: '存心忍耐奔那擺在我們前頭的路程，在愛中彼此切實相愛。'
  },
  {
    id: 'revelation',
    name: '啟示錄 · 新耶路撒冷',
    shortName: '啟示錄',
    emoji: '🌈',
    landmark: '玻璃海與生命樹',
    color: '#e2a93b',
    companion: 'lamb',
    x: 93, y: 24,
    desc: '生命河兩岸的生命樹結十二樣果子，一切都更新了！'
  }
];

export const FRUIT_STAGES = [
  { id: 1, name: '仁愛', emoji: '💗', startDay: 1,   endDay: 30,  verse: '愛是恆久忍耐，又有恩慈。', rewardItem: 'rose_arch' },
  { id: 2, name: '喜樂', emoji: '😊', startDay: 31,  endDay: 60,  verse: '靠耶和華而得的喜樂是你們的力量。', rewardItem: 'fountain' },
  { id: 3, name: '和平', emoji: '🕊️', startDay: 61,  endDay: 90,  verse: '我將我的平安賜給你們。', rewardItem: 'dove' },
  { id: 4, name: '忍耐', emoji: '🌿', startDay: 91,  endDay: 120, verse: '凡事謙虛、溫柔、忍耐，用愛心互相寬容。', rewardItem: 'camel' },
  { id: 5, name: '恩慈', emoji: '🌸', startDay: 121, endDay: 150, verse: '要以恩慈相待，存憐憫的心。', rewardItem: 'jacob_well' },
  { id: 6, name: '良善', emoji: '🌻', startDay: 151, endDay: 180, verse: '我一生一世必有恩惠慈愛隨著我。', rewardItem: 'bench' },
  { id: 7, name: '信實', emoji: '⛰️', startDay: 181, endDay: 210, verse: '你的誠實極其廣大，每早晨都是新的。', rewardItem: 'noah_ark' },
  { id: 8, name: '溫柔', emoji: '🐑', startDay: 211, endDay: 240, verse: '溫柔的人有福了！因為他們必承受地土。', rewardItem: 'lilies' },
  { id: 9, name: '節制', emoji: '🏮', startDay: 241, endDay: 270, verse: '你的話是我腳前的燈，是我路上的光。', rewardItem: 'lantern' },
  { id: 10, name: '豐收', emoji: '🌾', startDay: 271, endDay: 300, verse: '流淚撒種的，必歡呼收割。', rewardItem: 'olive_tree' },
  { id: 11, name: '感恩', emoji: '🙏', startDay: 301, endDay: 330, verse: '凡事謝恩，因為這是神在基督耶穌裡向你們所定的旨意。', rewardItem: 'gazebo' },
  { id: 12, name: '盼望', emoji: '🌈', startDay: 331, endDay: 365, verse: '那等候耶和華的必從新得力。', rewardItem: 'lantern' }
];

// All 66 books with exact per-chapter verse counts (total = 1,189 chapters, 31,102 verses)
export const BIBLE_BOOKS = [
  // 1. Pentateuch (5)
  { id: 1, code: 'gen', name: '創世記', short: '創', place: '伊甸園', emoji: '🌳', testament: 'OT', group: 'pentateuch', keyVerse: '起初，神創造天地。（創 1:1）',
    verses: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
  { id: 2, code: 'exo', name: '出埃及記', short: '出', place: '紅海之路', emoji: '🌊', testament: 'OT', group: 'pentateuch', keyVerse: '耶和華必為你們爭戰；你們只管靜默，不要作聲。（出 14:14）',
    verses: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
  { id: 3, code: 'lev', name: '利未記', short: '利', place: '會幕火光', emoji: '🔥', testament: 'OT', group: 'pentateuch', keyVerse: '你們要聖潔，因為我耶和華你們的神是聖潔的。（利 19:2）',
    verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34] },
  { id: 4, code: 'num', name: '民數記', short: '民', place: '曠野雲柱', emoji: '☁️', testament: 'OT', group: 'pentateuch', keyVerse: '願耶和華賜福給你，保護你。願耶和華使他的臉光照你，賜恩給你。（民 6:24-25）',
    verses: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
  { id: 5, code: 'deu', name: '申命記', short: '申', place: '摩押平原', emoji: '📜', testament: 'OT', group: 'pentateuch', keyVerse: '你要盡心、盡性、盡力愛耶和華你的神。（申 6:5）',
    verses: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },

  // 2. Historical Books (12)
  { id: 6, code: 'jos', name: '約書亞記', short: '書', place: '約旦河畔', emoji: '⚔️', testament: 'OT', group: 'history', keyVerse: '你當剛強壯膽！不要懼怕，也不要驚惶；因為你無論往哪裡去，耶和華你的神必與你同在。（書 1:9）',
    verses: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
  { id: 7, code: 'jdg', name: '士師記', short: '士', place: '棕樹山谷', emoji: '🌴', testament: 'OT', group: 'history', keyVerse: '耶和華看顧他，說：你靠著你這能力去從米甸人手裡拯救以色列人。（士 6:14）',
    verses: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
  { id: 8, code: 'rut', name: '路得記', short: '得', place: '伯利恆麥田', emoji: '🌾', testament: 'OT', group: 'history', keyVerse: '你的國就是我的國，你的神就是我的神。（得 1:16）',
    verses: [22,23,18,22] },
  { id: 9, code: '1sa', name: '撒母耳記上', short: '撒上', place: '示羅聖殿', emoji: '🪔', testament: 'OT', group: 'history', keyVerse: '耶和華不像人看人：人是看外貌；耶和華是看內心。（撒上 16:7）',
    verses: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
  { id: 10, code: '2sa', name: '撒母耳記下', short: '撒下', place: '錫安大衛城', emoji: '👑', testament: 'OT', group: 'history', keyVerse: '耶和華是我的巖石，我的山寨，我的救主。（撒下 22:2）',
    verses: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
  { id: 11, code: '1ki', name: '列王紀上', short: '王上', place: '所羅門聖殿', emoji: '🏛️', testament: 'OT', group: 'history', keyVerse: '所以求你賜我智慧，可以判斷你的民，能辨別是非。（王上 3:9）',
    verses: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
  { id: 12, code: '2ki', name: '列王紀下', short: '王下', place: '迦密山嶺', emoji: '🌩️', testament: 'OT', group: 'history', keyVerse: '不要懼怕！與我們同在的比與他們同在的更多。（王下 6:16）',
    verses: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
  { id: 13, code: '1ch', name: '歷代志上', short: '代上', place: '讚美聖壇', emoji: '🎺', testament: 'OT', group: 'history', keyVerse: '耶和華啊，尊大、能力、榮耀、強勝、威嚴都是你的。（代上 29:11）',
    verses: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
  { id: 14, code: '2ch', name: '歷代志下', short: '代下', place: '榮耀聖所', emoji: '✨', testament: 'OT', group: 'history', keyVerse: '這稱為我名下的子民，若是自卑、禱告，尋求我的面，我必從天上垂聽。（代下 7:14）',
    verses: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
  { id: 15, code: 'ezr', name: '以斯拉記', short: '拉', place: '歸回大道', emoji: '🧱', testament: 'OT', group: 'history', keyVerse: '耶和華本為善，他向以色列永發慈愛。（拉 3:11）',
    verses: [11,70,13,24,17,22,28,36,15,44] },
  { id: 16, code: 'neh', name: '尼希米記', short: '尼', place: '重建城牆', emoji: '🏰', testament: 'OT', group: 'history', keyVerse: '因靠耶和華而得的喜樂是你們的力量。（尼 8:10）',
    verses: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
  { id: 17, code: 'est', name: '以斯帖記', short: '斯', place: '書珊王宮', emoji: '💎', testament: 'OT', group: 'history', keyVerse: '焉知你得了王后的位分不是為現今的機會嗎？（斯 4:14）',
    verses: [22,23,15,17,14,14,10,17,32,3] },

  // 3. Poetry & Wisdom (5)
  { id: 18, code: 'job', name: '約伯記', short: '伯', place: '烏斯星空', emoji: '🌌', testament: 'OT', group: 'poetry', keyVerse: '我從前風聞有你，現在親眼看見你。（伯 42:5）',
    verses: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
  { id: 19, code: 'psa', name: '詩篇', short: '詩', place: '琴歌花園', emoji: '🎶', testament: 'OT', group: 'poetry', keyVerse: '耶和華是我的牧者，我必不致缺乏。（詩 23:1）',
    verses: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6] },
  { id: 20, code: 'pro', name: '箴言', short: '箴', place: '智慧泉源', emoji: '💡', testament: 'OT', group: 'poetry', keyVerse: '你要專心仰賴耶和華，不可倚靠自己的聰明。（箴 3:5）',
    verses: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31] },
  { id: 21, code: 'ecc', name: '傳道書', short: '傳', place: '日光之下', emoji: '⏳', testament: 'OT', group: 'poetry', keyVerse: '神造萬物，各按其時成為美好。（傳 3:11）',
    verses: [18,26,22,16,20,12,29,17,18,20,10,14] },
  { id: 22, code: 'sng', name: '雅歌', short: '歌', place: '谷中百合園', emoji: '🌷', testament: 'OT', group: 'poetry', keyVerse: '愛情，眾水不能息滅，大水也不能淹沒。（歌 8:7）',
    verses: [17,17,11,16,16,13,13,14] },

  // 4. Major Prophets (5)
  { id: 23, code: 'isa', name: '以賽亞書', short: '賽', place: '平安預言峰', emoji: '🕊️', testament: 'OT', group: 'major_prophets', keyVerse: '但那等候耶和華的必從新得力。他們必如鷹展翅上騰。（賽 40:31）',
    verses: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24] },
  { id: 24, code: 'jer', name: '耶利米書', short: '耶', place: '窯匠之家', emoji: '🏺', testament: 'OT', group: 'major_prophets', keyVerse: '我知道我向你們所懷的意念是賜平安的意念，叫你們末後有指望。（耶 29:11）',
    verses: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34] },
  { id: 25, code: 'lam', name: '耶利米哀歌', short: '哀', place: '晨曦安慰谷', emoji: '🌅', testament: 'OT', group: 'major_prophets', keyVerse: '每早晨，這都是新的；你的誠實極其廣大！（哀 3:23）',
    verses: [22,22,66,22,22] },
  { id: 26, code: 'ezk', name: '以西結書', short: '結', place: '活水江河', emoji: '💧', testament: 'OT', group: 'major_prophets', keyVerse: '我也要賜給你們一個新心，將新靈放在你們裡面。（結 36:26）',
    verses: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35] },
  { id: 27, code: 'dan', name: '但以理書', short: '但', place: '獅子坑星光', emoji: '🦁', testament: 'OT', group: 'major_prophets', keyVerse: '智慧人必發光如同天上的光；那使多人歸義的，必發光如星，直到永永遠遠。（但 12:3）',
    verses: [21,49,30,37,31,28,28,27,27,21,45,13] },

  // 5. Minor Prophets (12)
  { id: 28, code: 'hos', name: '何西阿書', short: '何', place: '慈繩愛索谷', emoji: '💐', testament: 'OT', group: 'minor_prophets', keyVerse: '我們務要認識耶和華，竭力追求認識他。（何 6:3）',
    verses: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
  { id: 29, code: 'jol', name: '約珥書', short: '珥', place: '春雨澆灌原', emoji: '🌧️', testament: 'OT', group: 'minor_prophets', keyVerse: '以後，我要將我的靈澆灌凡有血氣的。（珥 2:28）',
    verses: [20,32,21] },
  { id: 30, code: 'amo', name: '阿摩司書', short: '摩', place: '公義江河', emoji: '⚖️', testament: 'OT', group: 'minor_prophets', keyVerse: '惟願公平如大水滾滾，使公義如江河滔滔。（摩 5:24）',
    verses: [15,16,15,13,27,14,17,14,15] },
  { id: 31, code: 'oba', name: '俄巴底亞書', short: '俄', place: '錫安高臺', emoji: '🏔️', testament: 'OT', group: 'minor_prophets', keyVerse: '國度就歸耶和華了。（俄 1:21）',
    verses: [21] },
  { id: 32, code: 'jon', name: '約拿書', short: '拿', place: '尼尼微海岸', emoji: '🐳', testament: 'OT', group: 'minor_prophets', keyVerse: '我知道你是有恩典、有憐憫的神，不輕易發怒，有豐盛的慈愛。（拿 4:2）',
    verses: [17,10,10,11] },
  { id: 33, code: 'mic', name: '彌迦書', short: '彌', place: '伯利恆小城', emoji: '⭐', testament: 'OT', group: 'minor_prophets', keyVerse: '只要你行公義，好憐憫，存謙卑的心，與你的神同行。（彌 6:8）',
    verses: [16,13,12,13,15,16,20] },
  { id: 34, code: 'nam', name: '那鴻書', short: '鴻', place: '避難所之嶺', emoji: '🛡️', testament: 'OT', group: 'minor_prophets', keyVerse: '耶和華本為善，在患難的日子為人的保障，並且認得那些投靠他的人。（鴻 1:7）',
    verses: [15,13,19] },
  { id: 35, code: 'hab', name: '哈巴谷書', short: '哈', place: '無花果山坡', emoji: '🍇', testament: 'OT', group: 'minor_prophets', keyVerse: '然而，我要因耶和華歡欣，因救我的神喜樂。（哈 3:18）',
    verses: [17,20,19] },
  { id: 36, code: 'zep', name: '西番雅書', short: '番', place: '歡呼喜樂城', emoji: '🎵', testament: 'OT', group: 'minor_prophets', keyVerse: '他在你中間必因你歡欣喜樂，默然愛你，且因你喜樂而歡呼。（番 3:17）',
    verses: [18,15,20] },
  { id: 37, code: 'hag', name: '哈該書', short: '該', place: '榮耀新殿', emoji: '🏗️', testament: 'OT', group: 'minor_prophets', keyVerse: '這殿後來的榮耀必大過先前的榮耀；在這地方我必賜平安。（該 2:9）',
    verses: [15,23] },
  { id: 38, code: 'zec', name: '撒迦利亞書', short: '亞', place: '金燈台聖園', emoji: '🕯️', testament: 'OT', group: 'minor_prophets', keyVerse: '不是倚靠勢力，不是倚靠才能，乃是倚靠我的靈方能成事。（亞 4:6）',
    verses: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
  { id: 39, code: 'mal', name: '瑪拉基書', short: '瑪', place: '公義日頭原', emoji: '☀️', testament: 'OT', group: 'minor_prophets', keyVerse: '但向你們敬畏我名的人必有公義的日頭出現，其光線有醫治之能。（瑪 4:2）',
    verses: [14,17,18,6] },

  // 6. Gospels (4)
  { id: 40, code: 'mat', name: '馬太福音', short: '太', place: '八福登山', emoji: '⛰️', testament: 'NT', group: 'gospels', keyVerse: '凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。（太 11:28）',
    verses: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20] },
  { id: 41, code: 'mrk', name: '馬可福音', short: '可', place: '服事之路', emoji: '👣', testament: 'NT', group: 'gospels', keyVerse: '因為人子來，並不是要受人的服事，乃是要服事人。（可 10:45）',
    verses: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
  { id: 42, code: 'luk', name: '路加福音', short: '路', place: '加利利漁船', emoji: '⛵', testament: 'NT', group: 'gospels', keyVerse: '在至高之處榮耀歸與神！在地上平安歸與他所喜悅的人！（路 2:14）',
    verses: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
  { id: 43, code: 'jhn', name: '約翰福音', short: '約', place: '生命活水井', emoji: '💧', testament: 'NT', group: 'gospels', keyVerse: '神愛世人，甚至將他的獨生子賜給他們，叫一切信他的，不致滅亡，反得永生。（約 3:16）',
    verses: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },

  // 7. Acts (1)
  { id: 44, code: 'act', name: '使徒行傳', short: '徒', place: '五旬節樓房', emoji: '🔥', testament: 'NT', group: 'acts', keyVerse: '但聖靈降臨在你們身上，你們就必得著能力，並要直到地極，作我的見證。（徒 1:8）',
    verses: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31] },

  // 8. Pauline Epistles (13)
  { id: 45, code: 'rom', name: '羅馬書', short: '羅', place: '恩典大道', emoji: '🛣️', testament: 'NT', group: 'paul', keyVerse: '我們曉得萬事都互相效力，叫愛神的人得益處。（羅 8:28）',
    verses: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27] },
  { id: 46, code: '1co', name: '哥林多前書', short: '林前', place: '愛的港灣', emoji: '💖', testament: 'NT', group: 'paul', keyVerse: '如今常存的有信，有望，有愛這三樣，其中最大的是愛。（林前 13:13）',
    verses: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24] },
  { id: 47, code: '2co', name: '哥林多後書', short: '林後', place: '瓦器寶貝屋', emoji: '🏺', testament: 'NT', group: 'paul', keyVerse: '我的恩典夠你用的，因為我的能力是在人的軟弱上顯得完全。（林後 12:9）',
    verses: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
  { id: 48, code: 'gal', name: '加拉太書', short: '加', place: '聖靈果子園', emoji: '🍇', testament: 'NT', group: 'paul', keyVerse: '聖靈所結的果子，就是仁愛、喜樂、和平、忍耐、恩慈、良善、信實、溫柔、節制。（加 5:22-23）',
    verses: [24,21,29,31,26,18] },
  { id: 49, code: 'eph', name: '以弗所書', short: '弗', place: '天上福氣城', emoji: '🛡️', testament: 'NT', group: 'paul', keyVerse: '你們得救是本乎恩，也因著信；這並不是出於自己，乃是神所賜的。（弗 2:8）',
    verses: [23,22,21,32,33,24] },
  { id: 50, code: 'php', name: '腓立比書', short: '腓', place: '喜樂花園', emoji: '🌼', testament: 'NT', group: 'paul', keyVerse: '我靠著那加給我力量的，凡事都能作。（腓 4:13）',
    verses: [30,30,21,23] },
  { id: 51, code: 'col', name: '歌羅西書', short: '西', place: '生根建造園', emoji: '🌱', testament: 'NT', group: 'paul', keyVerse: '無論作什麼，都要從心裡作，像是給主作的，不是給人作的。（西 3:23）',
    verses: [29,23,25,18] },
  { id: 52, code: '1th', name: '帖撒羅尼迦前書', short: '帖前', place: '常喜樂之城', emoji: '🙏', testament: 'NT', group: 'paul', keyVerse: '要常常喜樂，不住地禱告，凡事謝恩。（帖前 5:16-18）',
    verses: [10,20,13,18,28] },
  { id: 53, code: '2th', name: '帖撒羅尼迦後書', short: '帖後', place: '堅固平安堡', emoji: '🕊️', testament: 'NT', group: 'paul', keyVerse: '願賜平安的主隨時隨事親自給你們平安。（帖後 3:16）',
    verses: [12,17,18] },
  { id: 54, code: '1ti', name: '提摩太前書', short: '提前', place: '牧養小徑', emoji: '📖', testament: 'NT', group: 'paul', keyVerse: '不可叫人小看你年輕，總要在言語、行為、愛心、信心、清潔上，都作信徒的榜樣。（提前 4:12）',
    verses: [20,15,16,16,25,21] },
  { id: 55, code: '2ti', name: '提摩太後書', short: '提後', place: '剛強燈台', emoji: '🕯️', testament: 'NT', group: 'paul', keyVerse: '因為神賜給我們，不是膽怯的心，乃是剛強、仁愛、謹守的心。（提後 1:7）',
    verses: [18,26,17,22] },
  { id: 56, code: 'tit', name: '提多書', short: '多', place: '革哩底海灣', emoji: '🏝️', testament: 'NT', group: 'paul', keyVerse: '他便救了我們；並不是因我們自己所行的義，乃是照他的憐憫。（多 3:5）',
    verses: [16,15,15] },
  { id: 57, code: 'phm', name: '腓利門書', short: '門', place: '和好之家', emoji: '🤝', testament: 'NT', group: 'paul', keyVerse: '因為你的愛心，使我大有快樂，大得安慰。（門 1:7）',
    verses: [25] },

  // 9. General Epistles (8)
  { id: 58, code: 'heb', name: '希伯來書', short: '來', place: '信心雲彩峰', emoji: '☁️', testament: 'NT', group: 'general', keyVerse: '信就是所望之事的實底，是未見之事的確據。（來 11:1）',
    verses: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
  { id: 59, code: 'jas', name: '雅各書', short: '雅', place: '信心行道坡', emoji: '🌻', testament: 'NT', group: 'general', keyVerse: '你們中間若有缺少智慧的，應當求那厚賜與眾人、也不斥責人的神。（雅 1:5）',
    verses: [27,26,18,17,20] },
  { id: 60, code: '1pe', name: '彼得前書', short: '彼前', place: '活石海角', emoji: '🪨', testament: 'NT', group: 'general', keyVerse: '你們要將一切的憂慮卸給神，因為他顧念你們。（彼前 5:7）',
    verses: [25,25,22,19,14] },
  { id: 61, code: '2pe', name: '彼得後書', short: '彼後', place: '晨星海灣', emoji: '🌟', testament: 'NT', group: 'general', keyVerse: '你們卻要在我們主救主耶穌基督的恩典和知識上有長進。（彼後 3:18）',
    verses: [21,22,18] },
  { id: 62, code: '1jn', name: '約翰一書', short: '約一', place: '光明相交園', emoji: '💛', testament: 'NT', group: 'general', keyVerse: '我們愛，因為神先愛我們。（約一 4:19）',
    verses: [10,29,24,21,21] },
  { id: 63, code: '2jn', name: '約翰二書', short: '約二', place: '真理小徑', emoji: '💌', testament: 'NT', group: 'general', keyVerse: '我們若照他的命令行，這就是愛。（約二 1:6）',
    verses: [13] },
  { id: 64, code: '3jn', name: '約翰三書', short: '約三', place: '款待旅舍', emoji: '🏡', testament: 'NT', group: 'general', keyVerse: '親愛的兄弟啊，我願你凡事興盛，身體健壯，正如你的靈魂興盛一樣。（約三 1:2）',
    verses: [14] },
  { id: 65, code: 'jud', name: '猶大書', short: '猶', place: '保守燈塔', emoji: '🗼', testament: 'NT', group: 'general', keyVerse: '保守自己常在神的愛中，仰望我們主耶穌基督的憐憫。（猶 1:21）',
    verses: [25] },

  // 10. Revelation (1)
  { id: 66, code: 'rev', name: '啟示錄', short: '啟', place: '新耶路撒冷', emoji: '🌈', testament: 'NT', group: 'revelation', keyVerse: '看哪，我將一切都更新了！（啟 21:5）',
    verses: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] }
];

// Totals & flat chapter list
export const ALL_CHAPTERS = [];
export let TOTAL_VERSES = 0;
export let TOTAL_CHAPTERS = 0;

for (const book of BIBLE_BOOKS) {
  book.chapterCount = book.verses.length;
  book.verseCount = book.verses.reduce((a, b) => a + b, 0);
  TOTAL_CHAPTERS += book.chapterCount;
  TOTAL_VERSES += book.verseCount;
  for (let c = 1; c <= book.chapterCount; c++) {
    ALL_CHAPTERS.push({
      key: `${book.id}:${c}`,
      bookId: book.id,
      bookName: book.name,
      bookShort: book.short,
      chapter: c,
      verseCount: book.verses[c - 1],
      group: book.group
    });
  }
}

export function getBookById(id) {
  return BIBLE_BOOKS[id - 1];
}

// Build deterministic 365-day sequential reading plan (~85 verses/day)
export function buildReadingPlan() {
  const days = [];
  let idx = 0;
  let cumVerses = 0;
  const totalV = TOTAL_VERSES;

  for (let day = 1; day <= 365; day++) {
    const targetCum = (totalV * day) / 365;
    const chapters = [];
    let dayVerses = 0;

    while (idx < ALL_CHAPTERS.length) {
      const remainingDays = 365 - day;
      const remainingChs = ALL_CHAPTERS.length - idx;
      // Ensure at least 1 chapter per day if possible, and leave enough chapters for remaining days
      if (chapters.length > 0 && remainingChs <= remainingDays) break;

      const ch = ALL_CHAPTERS[idx];
      if (chapters.length > 0) {
        const diffWith = Math.abs((cumVerses + ch.verseCount) - targetCum);
        const diffWithout = Math.abs(cumVerses - targetCum);
        if (diffWith > diffWithout && day < 365) break;
      }
      chapters.push(ch);
      cumVerses += ch.verseCount;
      dayVerses += ch.verseCount;
      idx++;
      if (day < 365 && cumVerses >= targetCum) break;
    }

    days.push({
      day,
      chapters,
      verseCount: dayVerses,
      chapterCount: chapters.length
    });
  }
  return days;
}

export const READING_PLAN = buildReadingPlan();

// Built-in Public Domain 1919 Chinese Union Version (和合本) chapters for instant offline reading
// Other chapters fetch CUV automatically when online, or display guided chapter meditation offline.
export const BUILTIN_SCRIPTURE = {
  '1:1': [
    '起初，神創造天地。',
    '地是空虛混沌，淵面黑暗；神的靈運行在水面上。',
    '神說：「要有光」，就有了光。',
    '神看光是好的，就把光暗分開了。',
    '神稱光為「晝」，稱暗為「夜」。有晚上，有早晨，這是頭一日。',
    '神說：「諸水之間要有空氣，將水分為上下。」',
    '神就造出空氣，將空氣以下的水、空氣以上的水分開了。事就這樣成了。',
    '神稱空氣為「天」。有晚上，有早晨，是第二日。',
    '神說：「天下的水要聚在一處，使旱地露出來。」事就這樣成了。',
    '神稱旱地為「地」，稱水的聚處為「海」。神看著是好的。',
    '神說：「地要發生青草和結種子的菜蔬，並結果子的樹木，各從其類，果子都包著核。」事就這樣成了。',
    '於是地發生了青草和結種子的菜蔬，各從其類；並結果子的樹木，各從其類；果子都包著核。神看著是好的。',
    '有晚上，有早晨，是第三日。',
    '神說：「天上要有光體，可以分晝夜，作記號，定節令、日子、年歲，',
    '並要發光在天空，普照在地上。」事就這樣成了。',
    '於是神造了兩個大光，大的管晝，小的管夜，又造眾星，',
    '就把這些光擺列在天空，普照在地上，',
    '管理晝夜，分別明暗。神看著是好的。',
    '有晚上，有早晨，是第四日。',
    '神說：「水要多多滋生有生命的物；要有雀鳥飛在地面以上，天空之中。」',
    '神就造出大魚和水中所滋生各樣有生命的動物，各從其類；又造出各樣飛鳥，各從其類。神看著是好的。',
    '神就賜福給這一切，說：「滋生繁多，充滿海中的水；雀鳥也要多生在地上。」',
    '有晚上，有早晨，是第五日。',
    '神說：「地要生出活物來，各從其類；牲畜、昆蟲、野獸，各從其類。」事就這樣成了。',
    '於是神造出野獸，各從其類；牲畜，各從其類；地上一切昆蟲，各從其類。神看著是好的。',
    '神說：「我們要照著我們的形像、按著我們的樣式造人，使他們管理海裡的魚、空中的鳥、地上的牲畜，和全地，並地上所爬的一切昆蟲。」',
    '神就照著自己的形像造人，乃是照著他的形像造男造女。',
    '神就賜福給他們，又對他們說：「要生養眾多，遍滿地面，治理這地，也要管理海裡的魚、空中的鳥，和地上各樣行動的活物。」',
    '神說：「看哪，我將遍地上一切結種子的菜蔬和一切樹上所結有核的果子全賜給你們作食物。',
    '至於地上的走獸和空中的飛鳥，並各樣爬在地上有生命的物，我將青草賜給他們作食物。」事就這樣成了。',
    '神看著一切所造的都甚好。有晚上，有早晨，是第六日。'
  ],
  '1:2': [
    '天地萬物都造齊了。',
    '到第七日，神造物的工已經完畢，就在第七日歇了他一切的工，安息了。',
    '神賜福給第七日，定為聖日；因為在這日，神歇了他一切創造的工，就安息了。',
    '創造天地的來歷，在耶和華神造天地的日子，乃是這樣，',
    '野地還沒有草木，田間的菜蔬還沒有長起來；因為耶和華神還沒有降雨在地上，也沒有人耕地，',
    '但有霧氣從地上騰，滋潤遍地。',
    '耶和華神用地上的塵土造人，將生氣吹在他鼻孔裡，他就成了有靈的活人，名叫亞當。',
    '耶和華神在東方的伊甸立了一個園子，把所造的人安置在那裡。',
    '耶和華神使各樣的樹從地裡長出來，可以悅人的眼目，其上的果子好作食物。園子當中又有生命樹和分別善惡的樹。',
    '有河從伊甸流出來，滋潤那園子，從那裡分為四道：',
    '第一道名叫比遜，就是環繞哈腓拉全地的。在那裡有金子，',
    '並且那地的金子是好的；在那裡又有珍珠和紅瑪瑙。',
    '第二道河名叫基訓，就是環繞古實全地的。',
    '第三道河名叫希底結，流在亞述的東邊。第四道河就是伯拉河。',
    '耶和華神將那人安置在伊甸園，使他修理，看守。',
    '耶和華神吩咐他說：「園中各樣樹上的果子，你可以隨意吃，',
    '只是分別善惡樹上的果子，你不可吃，因為你吃的日子必定死！」',
    '耶和華神說：「那人獨居不好，我要為他造一個配偶幫助他。」',
    '耶和華神用土所造成的野地各樣走獸和空中各樣飛鳥都帶到那人面前，看他叫甚麼。那人怎樣叫各樣的活物，那就是他的名字。',
    '那人便給一切牲畜和空中飛鳥、野地走獸都起了名；只是那人沒有遇見配偶幫助他。',
    '耶和華神使他沉睡，他就睡了；於是取下他的一條肋骨，又把肉合起來。',
    '耶和華神就用那人身上所取的肋骨造成一個女人，領她到那人跟前。',
    '那人說：這是我骨中的骨，肉中的肉，可以稱她為「女人」，因為她是從「男人」身上取出來的。',
    '因此，人要離開父母，與妻子連合，二人成為一體。',
    '當時夫妻二人赤身露體，並不羞恥。'
  ],
  '1:3': [
    '耶和華神所造的，惟有蛇比田野一切的活物更狡猾。蛇對女人說：「神豈是真說不許你們吃園中所有樹上的果子嗎？」',
    '女人對蛇說：「園中樹上的果子，我們可以吃，',
    '惟有園當中那棵樹上的果子，神曾說：『你們不可吃，也不可摸，免得你們死。』」',
    '蛇對女人說：「你們不一定死；',
    '因為神知道，你們吃的日子眼睛就明亮了，你們便如神能知道善惡。」',
    '於是女人見那棵樹的果子好作食物，也悅人的眼目，且是可喜愛的，能使人有智慧，就摘下果子來吃了，又給她丈夫，她丈夫也吃了。',
    '他們二人的眼睛就明亮了，才知道自己是赤身露體，便拿無花果樹的葉子為自己編作裙子。',
    '天起了涼風，耶和華神在園中行走。那人和他妻子聽見神的聲音，就藏在園裡的樹木中，躲避耶和華神的面。',
    '耶和華神呼喚那人，對他說：「你在哪裡？」',
    '他說：「我在園中聽見你的聲音，我就害怕；因為我赤身露體，我便藏了。」',
    '耶和華說：「誰告訴你赤身露體呢？莫非你吃了我吩咐你不可吃的那樹上的果子嗎？」',
    '那人說：「你所賜給我、與我同居的女人，她把那樹上的果子給我，我就吃了。」',
    '耶和華神對女人說：「你作的是甚麼事呢？」女人說：「那蛇引誘我，我就吃了。」',
    '耶和華神對蛇說：你既作了這事，就必受咒詛，比一切的牲畜野獸更甚。你必用肚子行走，終身吃土。',
    '我又要叫你和女人彼此為仇；你的後裔和女人的後裔也彼此為仇。女人的後裔要傷你的頭；你要傷他的腳跟。',
    '又對女人說：我必多多加增你懷胎的苦楚；你生產兒女必多受苦楚。你必戀慕你丈夫；你丈夫必管轄你。',
    '又對亞當說：你既聽從妻子的話，吃了我所吩咐你不可吃的那樹上的果子，地必為你的緣故受咒詛；你必終身勞苦才能從地裡得吃的。',
    '地必給你長出荊棘和蒺藜來；你也要吃田間的菜蔬。',
    '你必汗流滿面才得糊口，直到你歸了土，因為你是從土而出的。你本是塵土，仍要歸於塵土。',
    '亞當給他妻子起名叫夏娃，因為她是眾生之母。',
    '耶和華神為亞當和他妻子用皮子作衣服給他們穿。',
    '耶和華神說：「那人已經與我們相似，能知道善惡；現在恐怕他伸手又摘生命樹的果子吃，就永遠活著。」',
    '耶和華神便打發他出伊甸園去，耕種他所自出之土。',
    '於是把他趕出去了；又在伊甸園的東邊安設基路伯和四面轉動發火焰的劍，要把守生命樹的道路。'
  ],
  '19:1': [
    '不從惡人的計謀，不站罪人的道路，不坐褻慢人的座位，',
    '惟喜愛耶和華的律法，晝夜思想，這人便為有福！',
    '他要像一棵樹栽在溪水旁，按時候結果子，葉子也不枯乾。凡他所作的盡都順利。',
    '惡人並不是這樣，乃像糠秕被風吹散。',
    '因此，當審判的時候惡人必站立不住；罪人在義人的會中也是如此。',
    '因為耶和華知道義人的道路；惡人的道路卻必滅亡。'
  ],
  '19:23': [
    '耶和華是我的牧者，我必不致缺乏。',
    '他使我躺臥在青草地上，領我在可安歇的水邊。',
    '他使我的靈魂甦醒，為自己的名引導我走義路。',
    '我雖然行過死蔭的幽谷，也不怕遭害，因為你與我同在；你的杖，你的竿，都安慰我。',
    '在我敵人面前，你為我擺設筵席；你用油膏了我的頭，使我的福杯滿溢。',
    '我一生一世必有恩惠慈愛隨著我；我且要住在耶和華的殿中，直到永遠。'
  ],
  '43:1': [
    '太初有道，道與神同在，道就是神。',
    '這道太初與神同在。',
    '萬物是藉著他造的；凡被造的，沒有一樣不是藉著他造的。',
    '生命在他裡頭，這生命就是人的光。',
    '光照在黑暗裡，黑暗卻不接受光。',
    '有一個人，是從神那裡差來的，名叫約翰。',
    '這人來，為要作見證，就是為光作見證，叫眾人因他可以信。',
    '他不是那光，乃是要為光作見證。',
    '那光是真光，照亮一切生在世上的人。',
    '他在世界，世界也是藉著他造的，世界卻不認識他。',
    '他到自己的地方來，自己的人倒不接待他。',
    '凡接待他的，就是信他名的人，他就賜他們權柄，作神的兒女。',
    '這等人不是從血氣生的，不是從情慾生的，也不是從人意生的，乃是從神生的。',
    '道成了肉身，住在我們中間，充充滿滿地有恩典有真理。我們也見過他的榮光，正是父獨生子的榮光。'
  ],
  '46:13': [
    '我若能說萬人的方言，並天使的話語，卻沒有愛，我就成了鳴的鑼，響的鈸一般。',
    '我若有先知講道之能，也明白各樣的奧秘，各樣的知識，而且有全備的信，叫我能夠移山，卻沒有愛，我就算不得甚麼。',
    '我若將所有的賙濟窮人，又捨己身叫人焚燒，卻沒有愛，仍然與我無益。',
    '愛是恆久忍耐，又有恩慈；愛是不嫉妒；愛是不自誇，不張狂，',
    '不作害羞的事，不求自己的益處，不輕易發怒，不計算人的惡，',
    '不喜歡不義，只喜歡真理；',
    '凡事包容，凡事相信，凡事盼望，凡事忍耐。',
    '愛是永不止息。先知講道之能終必歸於無有；說方言之能終必停止；知識也終必歸於無有。',
    '我們現在所知道的有限，先知所講的也有限，',
    '等那完全的來到，這有限的必歸於無有了。',
    '我作孩子的時候，話語像孩子，心思像孩子，意念像孩子，既成了人，就把孩子的事丟棄了。',
    '我們如今彷彿對著鏡子觀看，模糊不清，到那時就要面對面了。我如今所知道的有限，到那時就全知道，如同主知道我一樣。',
    '如今常存的有信，有望，有愛這三樣，其中最大的是愛。'
  ],
  '66:21': [
    '我又看見一個新天新地；因為先前的天地已經過去了，海也不再有了。',
    '我又看見聖城新耶路撒冷由神那裡從天而降，預備好了，就如新婦妝飾整齊，等候丈夫。',
    '我聽見有大聲音從寶座出來說：「看哪，神的帳幕在人間。他要與人同住，他們要作他的子民。神要親自與他們同在，作他們的神。',
    '神要擦去他們一切的眼淚；不再有死亡，也不再有悲哀、哭號、疼痛，因為以前的事都過去了。」',
    '坐寶座的說：「看哪，我將一切都更新了！」又說：「你要寫上；因這些話是可信的，是真實的。」'
  ]
};

// Fetch full CUV Traditional Chinese chapter dynamically when online, with seamless fallback
const chapterCache = new Map();

export async function fetchChapterVerses(bookId, chapter) {
  const key = `${bookId}:${chapter}`;
  if (BUILTIN_SCRIPTURE[key]) {
    return {
      source: 'built-in',
      verses: BUILTIN_SCRIPTURE[key].map((text, idx) => ({ num: idx + 1, text }))
    };
  }
  if (chapterCache.has(key)) return chapterCache.get(key);

  const book = getBookById(bookId);
  const expectedCount = book.verses[chapter - 1];

  // Try public bolls.life CUV Traditional Chinese API (CORS-friendly) with quick timeout
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://bolls.life/get-text/CUV/${bookId}/${chapter}/`, {
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const cleaned = data.map(v => ({
          num: v.verse,
          text: String(v.text || '').replace(/<[^>]+>/g, '').trim()
        }));
        const result = { source: 'cuv-online', verses: cleaned };
        chapterCache.set(key, result);
        return result;
      }
    }
  } catch {
    // Offline or blocked — fall back gracefully
  }

  // Graceful offline reading card with authentic book context & key verse
  return {
    source: 'offline-guide',
    bookKeyVerse: book.keyVerse,
    expectedCount,
    verses: [
      { num: 1, text: `【${book.name} 第 ${chapter} 章｜共 ${expectedCount} 節】` },
      { num: 2, text: `請翻開您的紙本聖經或聖經 App 閱讀「${book.name} 第 ${chapter} 章」，領受今日靈糧。` },
      { num: 3, text: `本書卷主題地標：${book.emoji} ${book.place}。` },
      { num: 4, text: `本書卷金句：${book.keyVerse}` },
      { num: 5, text: `讀完本章後，滑動至最下方即可按下「讀完了 ✓」，為您累積 ${expectedCount} 步靈程並澆灌花園花苗！` }
    ]
  };
}
