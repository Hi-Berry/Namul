/* =========================================================================
 * 조선 나물전기 — 게임 데이터 정의
 * 기획서 기반: 약초 등급제 / 계절 / 레시피 / 무기 / 마법 / 몬스터 / NPC
 * ======================================================================= */
const DATA = {};

/* ---- 계절 ---- */
DATA.SEASONS = ["봄", "여름", "가을", "겨울"];
DATA.SEASON_COLORS = {
  "봄": "#9bd86f", "여름": "#5fae4a", "가을": "#d49a4a", "겨울": "#bcd0e0"
};

/* ---- 약초/나물 (채집 아이템) ----
 * tier 1: 흔함, 2: 희귀, 3: 명품
 * 각 계절별로 산에서 채집 가능한 종류가 다름.
 */
DATA.HERBS = {
  // 봄
  ssuk:     { id:"ssuk",     name:"쑥",       tier:1, season:"봄",   icon:"🌿", price:8,  heal:6  },
  dallae:   { id:"dallae",   name:"달래",     tier:1, season:"봄",   icon:"🧅", price:9,  heal:5  },
  doraji:   { id:"doraji",   name:"도라지",   tier:2, season:"봄",   icon:"🌱", price:22, heal:14 },
  sansam:   { id:"sansam",   name:"산삼",     tier:3, season:"봄",   icon:"🪷", price:120,heal:40 },
  // 여름
  gosari:   { id:"gosari",   name:"고사리",   tier:1, season:"여름", icon:"🌾", price:8,  heal:6  },
  chamna:   { id:"chamna",   name:"참나물",   tier:1, season:"여름", icon:"☘️", price:10, heal:5  },
  deodeok:  { id:"deodeok",  name:"더덕",     tier:2, season:"여름", icon:"🥔", price:24, heal:15 },
  yeongji:  { id:"yeongji",  name:"영지버섯", tier:3, season:"여름", icon:"🍄", price:110,heal:35 },
  // 가을
  dotori:   { id:"dotori",   name:"도토리",   tier:1, season:"가을", icon:"🌰", price:9,  heal:5  },
  goguma:   { id:"goguma",   name:"마",       tier:1, season:"가을", icon:"🍠", price:10, heal:6  },
  songi:    { id:"songi",    name:"송이버섯", tier:2, season:"가을", icon:"🍄", price:28, heal:16 },
  hwanggi:  { id:"hwanggi",  name:"황기",     tier:3, season:"가을", icon:"🪵", price:115,heal:38 },
  // 겨울
  museong:  { id:"museong",  name:"무청",     tier:1, season:"겨울", icon:"🥬", price:7,  heal:5  },
  gomchi:   { id:"gomchi",   name:"곰취",     tier:1, season:"겨울", icon:"🍃", price:9,  heal:6  },
  gugija:   { id:"gugija",   name:"구기자",   tier:2, season:"겨울", icon:"🔴", price:26, heal:15 },
  bokryeong:{ id:"bokryeong",name:"복령",     tier:3, season:"겨울", icon:"⚪", price:118,heal:36 },
};

/* 계절별 채집 가능 약초 id 묶음 (등급별 가중치 부여용) */
DATA.herbsBySeason = function(season){
  return Object.values(DATA.HERBS).filter(h => h.season === season);
};

/* ---- 재료(주막 요리) ---- */
DATA.GOODS = {
  flour:   { id:"flour",   name:"메밀가루",   icon:"🌾" },
  season:  { id:"season",  name:"양념장",     icon:"🥢", price:5 },
};

/* ---- 메밀밭 ---- */
DATA.BUCKWHEAT = {
  seedPrice: 15,     // 장날 종자 구매
  growDays: 4,       // 4일 후 수확 가능
  harvestStamina: 2, // 수확 기력
  yield: 5,          // 수확 시 메밀가루 수량
};

/* ---- 무기 (전투) ----
 * weight 높을수록 턴 순서 느려짐(민첩 영향). stun: 기절 확률.
 */
DATA.WEAPONS = {
  natt:    { id:"natt",    name:"낫",       icon:"🔪", atk:8,  weight:2, stun:0,    type:"베기", desc:"가볍고 빠르다. 선제공격에 유리." },
  homi:    { id:"homi",    name:"호미",     icon:"⛏️", atk:6,  weight:1, stun:0,    type:"찌르기", desc:"가장 가볍지만 공격력이 약하다." },
  jeolgu:  { id:"jeolgu",  name:"절굿공이", icon:"🪵", atk:13, weight:5, stun:0.35, type:"둔기", desc:"느리지만 강하고 적을 기절시킨다." },
  buduk:   { id:"buduk",   name:"부지깽이", icon:"🔥", atk:11, weight:4, stun:0.2,  type:"둔기", desc:"적당한 무게에 기절 효과." },
};
DATA.WEAPON_UPGRADE = { cost: 60, atkBonus: 4 }; // 대장간 강화

/* ---- 마법 (당산나무에서 요괴 부산물 헌납으로 해금) ----
 * shrinePts: 헌납 누적 정기 임계치
 */
DATA.MAGIC = {
  dokkaebi: { id:"dokkaebi", name:"도깨비불",      icon:"🔥", mp:6,  dmg:14, target:"all", effect:null,    shrinePts:8,  desc:"적 전체에 화염 피해." },
  sansin:   { id:"sansin",   name:"산신령의 호통", icon:"⛰️", mp:10, dmg:10, target:"all", effect:"slow",  shrinePts:24, desc:"적 전체 피해 + 다음 턴 행동 둔화." },
  yowoo:    { id:"yowoo",    name:"구미호의 홀림", icon:"🦊", mp:8,  dmg:4,  target:"all", effect:"charm", shrinePts:48, desc:"적 다수를 홀려 한 턴 못 움직이게 함." },
};

/* ---- 장비: 의상(코스튬) / 장신구 ---- */
DATA.COSTUMES = {
  plain: { id:"plain", name:"무명 저고리", icon:"👚", color:"#eef0e6", staminaMult:1.0, speedMult:1.0,  price:0,   desc:"기본 옷." },
  ramie: { id:"ramie", name:"모시 적삼",   icon:"🥻", color:"#dfeede", staminaMult:0.9, speedMult:1.08, price:90,  desc:"기력 소모 -10%, 이동 +8%." },
  silk:  { id:"silk",  name:"비단 한복",   icon:"👘", color:"#f3c6da", staminaMult:0.8, speedMult:1.18, price:220, desc:"기력 소모 -20%, 이동 +18%." },
};
DATA.ACCESSORIES = {
  none:    { id:"none",    name:"없음",   icon:"➖", mpBonus:0,  dropBonus:0,    price:0,   desc:"장신구 없음." },
  norigae: { id:"norigae", name:"노리개", icon:"🧿", mpBonus:10, dropBonus:0.15, price:110, desc:"최대 신력 +10, 요괴 부산물 드롭 +15%." },
  bujeok:  { id:"bujeok",  name:"부적",   icon:"🪬", mpBonus:25, dropBonus:0.05, price:180, desc:"최대 신력 +25, 드롭 +5%." },
};

/* ---- 요괴 부산물(드롭) — 당산나무 헌납 재료 ---- */
DATA.DROPS = {
  dujib_skin: { id:"dujib_skin", name:"두꺼비 진액", icon:"🟢", pts:2 },
  gumiho_fur: { id:"gumiho_fur", name:"여우 꼬리털", icon:"🟠", pts:4 },
  dokk_horn:  { id:"dokk_horn",  name:"도깨비 뿔",   icon:"🔵", pts:7 },
  beom_fang:  { id:"beom_fang",  name:"산범 송곳니", icon:"⚪", pts:14 },
};

/* ---- 몬스터 (산) — drop: 처치 시 떨구는 부산물 ---- */
DATA.MONSTERS = {
  dujib:   { id:"dujib",   name:"두꺼비 요괴", icon:"🐸", hp:20, atk:5,  exp:6,  gold:12, drop:"dujib_skin", dropRate:0.7 },
  gumiho:  { id:"gumiho",  name:"새끼 구미호", icon:"🦊", hp:32, atk:8,  exp:12, gold:25, drop:"gumiho_fur", dropRate:0.6 },
  dokk:    { id:"dokk",    name:"도깨비",      icon:"👹", hp:45, atk:11, exp:20, gold:40, drop:"dokk_horn",  dropRate:0.6 },
  beom:    { id:"beom",    name:"산범",        icon:"🐯", hp:60, atk:15, exp:32, gold:70, drop:"beom_fang",  dropRate:1.0 },
};
/* 계절별 출현 + 마릿수 범위 */
DATA.encountersBySeason = {
  "봄":   [["dujib",1,2],["gumiho",1,1]],
  "여름": [["dujib",1,2],["gumiho",1,2],["dokk",1,1]],
  "가을": [["gumiho",1,2],["dokk",1,2]],
  "겨울": [["dokk",1,2],["beom",1,1]],
};

/* ---- 주막 손님 (장사 미니게임) ----
 * 손님은 메밀가루+나물(아무거나)+양념장 = 메밀전병/나물전 을 주문.
 * patience: 인내 초, basePay: 기본 보수.
 */
DATA.CUSTOMERS = [
  { name:"보부상",     icon:"🧑‍🌾", patience:14, basePay:30 },
  { name:"양반 도령",  icon:"🎩",   patience:11, basePay:45 },
  { name:"주모 단골",  icon:"👵",   patience:16, basePay:25 },
  { name:"포졸",       icon:"👮",   patience:12, basePay:35 },
  { name:"떠돌이 화가",icon:"🎨",   patience:13, basePay:40 },
  { name:"비단 상인",  icon:"🧣",   patience:10, basePay:55 },
];

/* 빠른 서빙 보너스 배율 (서빙 소요 초 → 배율) */
DATA.servePayBonus = function(seconds){
  if (seconds <= 4) return 1.6;
  if (seconds <= 7) return 1.3;
  if (seconds <= 10) return 1.1;
  return 1.0;
};

/* ---- NPC ---- */
DATA.NPCS = {
  mudang:    { id:"mudang",    name:"무당",       icon:"🔮", color:"#8e44ad" },
  daejang:   { id:"daejang",   name:"대장장이",   icon:"🔨", color:"#7f5539" },
  chonjang:  { id:"chonjang",  name:"촌장",       icon:"👴", color:"#2c3e50" },
  jumo:      { id:"jumo",      name:"주모",       icon:"🍶", color:"#c0392b" },
  uisang:    { id:"uisang",    name:"의상점 주인",icon:"🧵", color:"#b5651d" },
  geonchuk:  { id:"geonchuk",  name:"방물장수",   icon:"🪡", color:"#27708a" },
};

/* ---- 비용/상수 ---- */
DATA.CONST = {
  START_MONEY: 100,
  MAX_STAMINA: 100,
  TRADE_STAMINA: 70,
  PORRIDGE_HEAL: 25,    // 나물죽 회복량
  PORRIDGE_HERBS: 2,    // 나물죽 재료(나물 2개)
  DEFEAT_TIME_LOSS: 300,// 패배 시 게임시간 5시간(분)
};
