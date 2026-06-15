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
  gondre:   { id:"gondre",   name:"곤드레",   tier:2, season:"봄",   icon:"🥬", price:24, heal:14 },
  doraji:   { id:"doraji",   name:"도라지",   tier:2, season:"봄",   icon:"🌱", price:22, heal:14 },
  dureup:   { id:"dureup",   name:"두릅",     tier:3, season:"봄",   icon:"🌿", price:95, heal:30 },
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
  naengi:   { id:"naengi",   name:"냉이",     tier:1, season:"겨울", icon:"🌿", price:9,  heal:6  },
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

/* ---- 마법 (당나무 제단에서 '공물'을 바쳐 해금) ----
 * tribute: 필요한 공물(드롭) id, need: 필요 수량
 * target: 2(랜덤 2체) | "all"(전체)
 */
DATA.MAGIC = {
  dokkaebi: { id:"dokkaebi", name:"도깨비불", sub:"화염", icon:"🔥", mp:6,  dmg:14, target:2,     effect:"burn",    burnPct:0.05, eff:3, tribute:"dokkaebi_fire", need:30, desc:"적 2체 타격 + 3턴간 화상(매턴 5% DoT)." },
  hangi:    { id:"hangi",    name:"한기 서림", sub:"빙결", icon:"❄️", mp:10, dmg:10, target:"all", effect:"agiDown", eff:2, tribute:"cold_mist", need:25, desc:"적 전체 타격 + 2턴 민첩 30% 감소." },
  hyeonhok: { id:"hyeonhok", name:"현혹의 춤", sub:"매혹", icon:"🦊", mp:8,  dmg:6,  target:2,     effect:"stun",    eff:1, tribute:"fox_orb",   need:15, desc:"적 2체 타격 + 1턴 확정 기절." },
  taesan:   { id:"taesan",   name:"태산 압사", sub:"대지", icon:"⛰️", mp:12, dmg:18, target:"all", effect:"atkDown", eff:2, tribute:"red_horn",  need:5,  desc:"적 전체 강타 + 2턴 공격력 20% 감소." },
};

/* ---- 장비: 의상(코스튬) / 장신구 ---- */
DATA.COSTUMES = {
  plain: { id:"plain", name:"노랑 저고리", icon:"👚", color:"#f2c531", staminaMult:1.0, speedMult:1.0,  price:0,   desc:"달래의 기본 한복(노랑 저고리·빨강 치마)." },
  ramie: { id:"ramie", name:"모시 적삼",   icon:"🥻", color:"#dfeede", staminaMult:0.9, speedMult:1.08, price:90,  desc:"기력 소모 -10%, 이동 +8%." },
  silk:  { id:"silk",  name:"비단 한복",   icon:"👘", color:"#f3c6da", staminaMult:0.8, speedMult:1.18, price:220, desc:"기력 소모 -20%, 이동 +18%." },
};
DATA.ACCESSORIES = {
  none:    { id:"none",    name:"없음",   icon:"➖", mpBonus:0,  dropBonus:0,    price:0,   desc:"장신구 없음." },
  norigae: { id:"norigae", name:"노리개", icon:"🧿", mpBonus:10, dropBonus:0.15, price:110, desc:"최대 신력 +10, 요괴 부산물 드롭 +15%." },
  bujeok:  { id:"bujeok",  name:"부적",   icon:"🪬", mpBonus:25, dropBonus:0.05, price:180, desc:"최대 신력 +25, 드롭 +5%." },
};

/* ---- 요괴 부산물(드롭) ----
 * common: 잡템(판매용, price) / tribute: 당나무 공물(마법 해금 재료)
 */
DATA.DROPS = {
  // 도깨비
  dok_club:      { id:"dok_club",      name:"부러진 방망이", icon:"🦯", price:6,  common:true },
  dok_hide:      { id:"dok_hide",      name:"질긴 가죽",     icon:"🟫", price:8,  common:true },
  dokkaebi_fire: { id:"dokkaebi_fire", name:"도깨비의 불",   icon:"🔥", tribute:true },
  // 물귀신
  wet_cloth:     { id:"wet_cloth",     name:"젖은 무명천",   icon:"🧶", price:7,  common:true },
  sea_mustard:   { id:"sea_mustard",   name:"물미역",        icon:"🟩", price:9,  common:true },
  cold_mist:     { id:"cold_mist",     name:"서늘한 물안개", icon:"🌫️", tribute:true },
  // 구미호
  fox_meat:      { id:"fox_meat",      name:"여우 고기",     icon:"🍖", price:14, common:true },
  fox_tail:      { id:"fox_tail",      name:"부드러운 꼬리털",icon:"🟠", price:16, common:true },
  fox_orb:       { id:"fox_orb",       name:"여우 구슬",     icon:"🔮", tribute:true },
  // 두억시니
  yokai_bone:    { id:"yokai_bone",    name:"두꺼운 요괴 뼈",icon:"🦴", price:18, common:true },
  hard_blood:    { id:"hard_blood",    name:"짐승의 굳은 피",icon:"🩸", price:20, common:true },
  red_horn:      { id:"red_horn",      name:"붉은 뿔 조각",  icon:"🔺", tribute:true },
};

/* ---- 몬스터 (산) ----
 * zone: 출몰 구역, detect: 감지 반경(타일), speed: 필드 추격 속도 배율, gimmick: 전투 기믹
 * acc: 명중률, commonDrops/tribute/tributeRate: 처치 보상
 */
DATA.MONSTERS = {
  dokkaebi_m:{ id:"dokkaebi_m", name:"도깨비",   icon:"👹", hp:24,  atk:7,  acc:0.7,  exp:8,  gold:14, zone:"mtn1", detect:3,  speed:0.7, gimmick:"mischief",
               commonDrops:["dok_club","dok_hide"], tribute:"dokkaebi_fire", tributeRate:0.30, desc:"장난꾸러기. 가끔 기력을 훔친다." },
  mulgwisin: { id:"mulgwisin",  name:"물귀신",   icon:"👻", hp:36,  atk:9,  acc:0.9,  exp:14, gold:26, zone:"mtn2", detect:5,  speed:1.0, gimmick:"agiDown",
               commonDrops:["wet_cloth","sea_mustard"], tribute:"cold_mist", tributeRate:0.18, desc:"피격 시 민첩을 떨군다. 마법이 유효." },
  gumiho:    { id:"gumiho",     name:"구미호",   icon:"🦊", hp:40,  atk:12, acc:0.95, exp:22, gold:45, zone:"mtn3", detect:8,  speed:1.5, aggro:true, gimmick:"evasion",
               commonDrops:["fox_meat","fox_tail"], tribute:"fox_orb", tributeRate:0.18, desc:"물리 회피 50%. 마법은 반드시 적중." },
  dueok:     { id:"dueok",      name:"두억시니", icon:"🗿", hp:108, atk:14, acc:1.0,  exp:50, gold:90, zone:"mtn3", detect:10, speed:1.2, gimmick:"taesan",
               commonDrops:["yokai_bone","hard_blood"], tribute:"red_horn", tributeRate:0.18, desc:"태산 같은 맷집. 3턴마다 태산 찍기." },
};

/* ---- 산 4개 구역(Zone) ---- */
DATA.MOUNTAIN_ZONES = [
  { key:"mtn1", name:"산 입구", tint:null,                     fog:false, tier:1, monsters:["dokkaebi_m"],         count:[3,4] },
  { key:"mtn2", name:"산 중턱", tint:"rgba(18,22,66,0.34)",    fog:false, tier:2, monsters:["mulgwisin"],          count:[3,4] },
  { key:"mtn3", name:"깊은 숲", tint:"rgba(10,28,18,0.30)",    fog:true,  tier:3, monsters:["gumiho","dueok"],     count:[3,5] },
  { key:"mtn4", name:"산 정상", tint:"rgba(255,236,190,0.05)", fog:false, tier:0, monsters:[],                     count:[0,0] },
];
DATA.zoneMeta = function(key){ return DATA.MOUNTAIN_ZONES.find(z=>z.key===key) || null; };
DATA.isMtn = function(key){ return /^mtn/.test(key); };

/* ---- 주막 손님 (요리 타이쿤) ----
 * patience: 인내(초), payMult: 음식값 배율, tip: 고정 팁
 * wants: 특정 음식 선호(있으면 그 음식 주문, 없으면 해금 메뉴 중 랜덤)
 * 기획자 편집: 손님 추가/배율 조절은 이 배열에서.
 */
DATA.CUSTOMERS = [
  { name:"농부",        icon:"🧑‍🌾", patience:18, payMult:1.0, tip:0 },
  { name:"보부상",      icon:"🎒",   patience:15, payMult:1.1, tip:3 },
  { name:"주모 단골",   icon:"👵",   patience:20, payMult:0.9, tip:2 },
  { name:"포졸",        icon:"👮",   patience:13, payMult:1.15, tip:5 },
  { name:"떠돌이 화가", icon:"🎨",   patience:14, payMult:1.2, tip:4 },
  { name:"양반 도령",   icon:"🎩",   patience:10, payMult:1.5, tip:10 },
  { name:"비단 상인",   icon:"🧣",   patience:11, payMult:1.4, tip:8 },
  { name:"훈장님",      icon:"📜",   patience:12, payMult:1.25, tip:6, wants:"kalguksu" },
  { name:"한량",        icon:"🍶",   patience:9,  payMult:1.6, tip:12, wants:"dongdongju" },
  { name:"스님",        icon:"🧎",   patience:22, payMult:1.0, tip:0, veggie:true }, // 고기 안 먹음
  { name:"사또",        icon:"👑",   patience:8,  payMult:2.0, tip:20 },             // 큰손·급함
  { name:"아이",        icon:"🧒",   patience:24, payMult:0.7, tip:1 },
  // 장날 게스트 손님 (#1)
  { name:"의적 홍길동", icon:"🥷",   patience:14, payMult:1.3, tip:6 },
  { name:"소리꾼",      icon:"🎤",   patience:15, payMult:1.2, tip:5 },
  { name:"양반 대감",   icon:"👴",   patience:10, payMult:1.8, tip:15, wants:"dongdongju" },
  { name:"나무꾼",      icon:"🪓",   patience:18, payMult:1.0, tip:3 },
];

/* 빠른 서빙 보너스 배율 (서빙 소요 초 → 배율) */
DATA.servePayBonus = function(seconds){
  if (seconds <= 4) return 1.6;
  if (seconds <= 7) return 1.3;
  if (seconds <= 10) return 1.1;
  return 1.0;
};

/* ---- NPC (12종) ---- */
DATA.NPCS = {
  mudang:    { id:"mudang",    name:"무당",       icon:"🔮", color:"#8e44ad" },
  daejang:   { id:"daejang",   name:"대장장이",   icon:"🔨", color:"#7f5539" },
  chonjang:  { id:"chonjang",  name:"촌장",       icon:"👴", color:"#2c3e50" },
  jumo:      { id:"jumo",      name:"주모",       icon:"🍶", color:"#c0392b" },
  uisang:    { id:"uisang",    name:"의상점 주인",icon:"🧵", color:"#b5651d" },
  geonchuk:  { id:"geonchuk",  name:"방물장수",   icon:"🪡", color:"#27708a" },
  uiwon:     { id:"uiwon",     name:"의원",       icon:"💉", color:"#2e8b57" },
  yakcho:    { id:"yakcho",    name:"약초상",     icon:"🌿", color:"#4a7a3a" },
  hunjang:   { id:"hunjang",   name:"훈장",       icon:"📜", color:"#5a4a8a" },
  bobu:      { id:"bobu",      name:"보부상",     icon:"🎒", color:"#a0522d" },
  nongbu:    { id:"nongbu",    name:"농부",       icon:"🧑‍🌾", color:"#6b8e23" },
  banga:     { id:"banga",     name:"방앗간지기", icon:"🌾", color:"#9c7a3a" },
  pujut:     { id:"pujut",     name:"푸줏간 주인",icon:"🔪", color:"#a83232" },
  // 장날 게스트 NPC (#1)
  hong:      { id:"hong",      name:"의적 홍길동", icon:"🥷", color:"#2c3e50" },
  sori:      { id:"sori",      name:"소리꾼",     icon:"🎤", color:"#8e44ad" },
  daegam:    { id:"daegam",    name:"양반 대감",   icon:"👴", color:"#7a5c2e" },
  namu:      { id:"namu",      name:"나무꾼",     icon:"🪓", color:"#5a6b23" },
};

/* ---- 마을 건물 (내부 진입 가능) ----
 * 마을 외부 문 위치 + 내부 NPC + 기능(station)
 * 기획자 편집: 건물/문 위치/기능은 여기서. floor=내부 바닥색.
 */
DATA.BUILDINGS = {
  jumak:   { name:"주막",      npc:"jumo",     floor:"#6e4326", sign:"#c0392b" },
  daejang: { name:"대장간",    npc:"daejang",  floor:"#4a4036", sign:"#7f5539" },
  mudang:  { name:"무당집",    npc:"mudang",   floor:"#3a2d44", sign:"#8e44ad" },
  chonjang:{ name:"촌장댁",    npc:"chonjang", floor:"#4a4232", sign:"#2c3e50" },
  uisang:  { name:"의상점",    npc:"uisang",   floor:"#5a4636", sign:"#b5651d" },
  banga:   { name:"방앗간",    npc:"banga",    floor:"#5a4a30", sign:"#9c7a3a" },
  uiwon:   { name:"의원",      npc:"uiwon",    floor:"#3a4a3a", sign:"#2e8b57" },
  yakcho:  { name:"약초방",    npc:"yakcho",   floor:"#3f4a32", sign:"#4a7a3a" },
  hunjang: { name:"서당",      npc:"hunjang",  floor:"#46406a", sign:"#5a4a8a" },
  pujut:   { name:"푸줏간",    npc:"pujut",    floor:"#5a3636", sign:"#a83232" },
};

/* ---- 요리 재료 ----
 * src: 획득처 안내(텍스트). buy>0 이면 장터/해당 상점에서 구매 가능.
 * 기획자 편집: 재료 추가/가격은 여기서.
 */
DATA.INGREDIENTS = {
  flour:   { id:"flour",   name:"메밀가루", icon:"🌾", buy:0,  src:"집 메밀밭 수확" },
  season:  { id:"season",  name:"양념장",   icon:"🥢", buy:5,  src:"장터/약초방" },
  rice:    { id:"rice",    name:"쌀",       icon:"🍚", buy:8,  src:"장터/농부" },
  pa:      { id:"pa",      name:"파",       icon:"🧅", buy:6,  src:"장터/농부" },
  bean:    { id:"bean",    name:"녹두",     icon:"🫘", buy:9,  src:"장터/농부" },
  pork:    { id:"pork",    name:"돼지고기", icon:"🥩", buy:18, src:"푸줏간" },
  fish:    { id:"fish",    name:"조기",     icon:"🐟", buy:14, src:"푸줏간(생선)" },
  tofu:    { id:"tofu",    name:"두부",     icon:"⬜", buy:10, src:"방앗간" },
  noodle:  { id:"noodle",  name:"국수사리", icon:"🍜", buy:0,  src:"방앗간(메밀가루 가공)" },
  nuruk:   { id:"nuruk",   name:"누룩",     icon:"🟡", buy:12, src:"주모/방앗간" },
  dotori:  { id:"dotori",  name:"도토리",   icon:"🌰", buy:0,  src:"가을 산 채집" },
  namul:   { id:"namul",   name:"나물",     icon:"🌿", buy:0,  src:"산 채집(아무 나물)" },
  // 레시피 개편: 양념·육수류(구매) — 시그니처/장떡 재료
  wheat_flour:  { id:"wheat_flour",  name:"밀가루",     icon:"🌾", buy:6,  src:"방앗간/장터" },
  gochujang:    { id:"gochujang",    name:"고추장 육수", icon:"🌶️", buy:7,  src:"장터/약초방" },
  deulgireum:   { id:"deulgireum",   name:"들기름",     icon:"🍯", buy:9,  src:"방앗간" },
  dallae_season:{ id:"dallae_season",name:"달래 양념장", icon:"🥢", buy:8,  src:"약초방" },
  hot_water:    { id:"hot_water",    name:"데친 물",    icon:"♨️", buy:2,  src:"방앗간/주막" },
  chogochujang: { id:"chogochujang", name:"초고추장",   icon:"🥗", buy:8,  src:"장터/약초방" },
  rice_water:   { id:"rice_water",   name:"쌀뜨물 육수", icon:"🥛", buy:3,  src:"방앗간" },
  deulgae_flour:{ id:"deulgae_flour",name:"들깨가루",   icon:"🥜", buy:9,  src:"방앗간" },
  anchovy_soup: { id:"anchovy_soup", name:"멸치 육수",  icon:"🍲", buy:7,  src:"푸줏간/장터" },
  doenjang:     { id:"doenjang",     name:"된장",       icon:"🟫", buy:7,  src:"장터/약초방" },
  dough:        { id:"dough",        name:"반죽",       icon:"🥟", buy:5,  src:"방앗간" },
  // 시그니처 전용 나물(산 채집) — 트레이드 화면 표시용 매핑
  gondre:  { id:"gondre",  name:"곤드레",   icon:"🥬", buy:0,  src:"봄 산 채집" },
  dureup:  { id:"dureup",  name:"두릅",     icon:"🌿", buy:0,  src:"봄 산 채집(귀함)" },
  gosari:  { id:"gosari",  name:"고사리",   icon:"🌾", buy:0,  src:"여름 산 채집" },
  naengi:  { id:"naengi",  name:"냉이",     icon:"🌿", buy:0,  src:"겨울 산 채집" },
};
// 어떤 재고가 있는지 셀 때 'namul'은 보유 약초 전체를 의미
DATA.isIngredient = function(id){ return !!DATA.INGREDIENTS[id]; };

/* ---- 요리 레시피 (조선 주막 음식) ----
 * steps: 재료를 넣어야 하는 '순서'(타이쿤). price: 기본 음식값.
 * unlock: 시작 해금 여부. learn: 해금 비용(주모에게 배움). by: 해금 출처 메모.
 * 기획자 편집: 음식 추가/순서/가격/해금은 여기서.
 */
DATA.RECIPES = {
  // ── 범용 3종 (게임 시작 시 기본 해금) ──
  jeon:        { id:"jeon",        name:"메밀 나물전", icon:"🫓", steps:["flour","namul","season"],         price:32, unlock:true, by:"기본" },
  jangtteok:   { id:"jangtteok",   name:"장떡",        icon:"🟤", steps:["wheat_flour","gochujang","namul"], price:40, unlock:true, by:"기본" },
  bindaetteok: { id:"bindaetteok", name:"녹두 빈대떡", icon:"🟡", steps:["bean","namul","pork"],            price:58, unlock:true, by:"기본", meat:true },

  // ── 주모 유료 학습(냥) ── (명성 500에서 무료 자동 해금되기도 함)
  jumeokbap:   { id:"jumeokbap",   name:"주먹밥",     icon:"🍙", steps:["rice","namul","season"],   price:30, learn:60,  by:"주모" },
  pajeon:      { id:"pajeon",      name:"파전",       icon:"🥞", steps:["flour","pa","season"],     price:42, learn:80,  by:"주모" },
  dotorimuk:   { id:"dotorimuk",   name:"도토리묵",   icon:"🟫", steps:["dotori","namul","season"], price:46, learn:100, by:"주모" },

  // ── 명성 마일스톤 자동 해금(무료) ──
  kalguksu:    { id:"kalguksu",    name:"칼국수",     icon:"🍜", steps:["noodle","namul","season"], price:54, by:"명성" },
  dongdongju:  { id:"dongdongju",  name:"동동주",     icon:"🍶", steps:["rice","nuruk"],            price:84, by:"명성", drink:true },

  // ── 시그니처 4종 (고수익, 명성 마일스톤 해금) ──
  gondre_rice:   { id:"gondre_rice",   name:"곤드레 가마솥밥", icon:"🍚", steps:["rice","gondre","deulgireum","dallae_season"], price:120, by:"명성" },
  dureup_sukhoe: { id:"dureup_sukhoe", name:"두릅 숙회",       icon:"🥗", steps:["hot_water","dureup","chogochujang"],          price:104, by:"명성", drink:true },
  gosari_tang:   { id:"gosari_tang",   name:"고사리 들깨탕",   icon:"🍲", steps:["rice_water","gosari","deulgae_flour"],         price:90,  by:"명성" },
  naengi_sujebi: { id:"naengi_sujebi", name:"냉이 된장 수제비", icon:"🥣", steps:["anchovy_soup","doenjang","naengi","dough"],   price:74,  by:"명성" },

  // ── 방앗간/푸줏간: 의뢰(재료 납품) 보상으로 전수 ──
  jumeok2:   { id:"jumeok2",   name:"두부조림", icon:"⬜", steps:["tofu","pa","season"],   price:52, by:"방앗간", barter:{id:"flour", n:6} },
  injeolmi:  { id:"injeolmi",  name:"인절미",   icon:"🍡", steps:["rice","bean"],          price:40, by:"방앗간", barter:{id:"rice",  n:8} },
  gukbap:    { id:"gukbap",    name:"국밥",     icon:"🍲", steps:["rice","pork","season"], price:74, by:"푸줏간", meat:true, barter:{id:"pork", n:4} },
  sanjeok:   { id:"sanjeok",   name:"산적",     icon:"🍢", steps:["pork","pa","season"],   price:70, by:"푸줏간", meat:true, barter:{id:"pork", n:5} },
  jogi:      { id:"jogi",      name:"조기구이", icon:"🐟", steps:["fish","season"],        price:64, by:"푸줏간", barter:{id:"fish", n:4} },
};

/* 명성 마일스톤 자동 해금 (#8): 통과 시 레시피 3종씩 무료 전수, 총 9종 */
DATA.FAME_UNLOCKS = [
  { fame:500,  recipes:["jumeokbap","pajeon","dotorimuk"] },
  { fame:1000, recipes:["kalguksu","gondre_rice","gosari_tang"] },
  { fame:1500, recipes:["dongdongju","dureup_sukhoe","naengi_sujebi"] },
];

/* 나물 등급(Tier)별 보상 보정 (#13): 접시에 담긴 최고 등급 기준 */
DATA.TIER_REWARD = {
  1: { mult:1.00, fame:10 },
  2: { mult:1.30, fame:15 },
  3: { mult:1.75, fame:25 },
};

/* 시작 시 기본 해금 레시피 (범용 3종: 메밀 나물전·장떡·녹두 빈대떡) */
DATA.START_RECIPES = ["jeon","jangtteok","bindaetteok"];

/* ---- 보양식(버프 요리) — 가마솥에서 끓여 하루 동안 효과 ----
 * 나물죽(즉시 회복)과 달리, 먹으면 다음 취침까지 유지되는 '버프'를 준다.
 * steps: 필요한 재료(주막 요리와 동일 규칙, namul=보유 약초 아무거나).
 * kind: 효과 종류 / power: 효과 세기 / 한 번에 한 가지 보양 효과만 유지(새로 먹으면 교체).
 * 기획자 편집: 보양식 추가/효과/재료는 여기서.
 */
DATA.BUFF_FOODS = {
  bibimbap:  { id:"bibimbap",  name:"산나물 비빔밥", icon:"🥗", steps:["namul","namul","season"], kind:"stamina", power:0.15,
               desc:"온종일 든든해 기력 소모 -15% (하루 유지)." },
  sujebi:    { id:"sujebi",    name:"메밀 수제비",   icon:"🥣", steps:["flour","namul","season"],  kind:"speed",   power:0.12,
               desc:"발걸음이 가벼워져 이동 속도 +12% (하루 유지)." },
  yaksik:    { id:"yaksik",    name:"약초 보양밥",   icon:"🍵", steps:["rice","namul","namul"],     kind:"drop",    power:0.15,
               desc:"기운이 맑아 요괴 부산물 드롭 +15% (하루 유지)." },
  boyangguk: { id:"boyangguk", name:"돼지 보양국",   icon:"🍲", steps:["pork","namul","season"],    kind:"atk",     power:0.20,
               desc:"힘이 솟아 전투 공격력 +20% (하루 유지)." },
};
/* 버프 종류별 HUD 짧은 표기 */
DATA.BUFF_TAG = { stamina:"기력효율↑", speed:"이동↑", drop:"드롭↑", atk:"공격력↑" };

/* ---- 펫 (#5) — 밤마다 종류별 수집 보너스 ----
 * bonus: herb(약초)·drop(요괴 부산물)·gold(냥). 퀘스트/이벤트로 획득.
 */
DATA.PETS = {
  squirrel: { id:"squirrel", name:"도토리",   icon:"🐿️", bonus:"herb", desc:"밤마다 약초를 물어온다." },
  fox_pup:  { id:"fox_pup",  name:"백호 새끼", icon:"🦊", bonus:"drop", desc:"밤마다 요괴 부산물을 주워온다." },
  cat:      { id:"cat",      name:"삵",       icon:"🐱", bonus:"gold", desc:"밤마다 약간의 냥을 물어온다." },
};

/* ---- 비용/상수 ---- */
DATA.CONST = {
  START_MONEY: 100,
  MAX_STAMINA: 100,
  TRADE_STAMINA: 70,
  PORRIDGE_HEAL: 25,    // 나물죽 회복량
  PORRIDGE_HERBS: 2,    // 나물죽 재료(나물 2개)
  DEFEAT_TIME_LOSS: 300,// 패배 시 게임시간 5시간(분)
  // 진행/성장
  COOK_XP_PER_SERVE: 3, // 손님 1명 대접 시 요리 숙련 경험치
  FAME_PER_SERVE: 1,    // 명성 (메뉴/손님 해금에 사용)
};

/* 요리 숙련도: 레벨에 따른 보수 배율 & 빠른서빙 관대함 */
DATA.cookLevel = function(xp){ return Math.floor(Math.sqrt(xp/20)); }; // 0,1,2... 완만
DATA.cookPayBonus = function(xp){ return 1 + DATA.cookLevel(xp)*0.08; }; // 레벨당 +8%
