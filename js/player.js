/* =========================================================================
 * 플레이어 — 스탯 / 인벤토리 / 장비 / 마법 / 호감도
 * ======================================================================= */
const P = {
  // 월드 좌표(픽셀)
  x: 0, y: 0, dir: "down", moving: false, animT: 0,
  speed: 130, // px/s

  // 스탯
  hp: 50, maxHp: 50,
  mp: 20, maxMp: 20,
  stamina: 100,
  money: 0,
  level: 1, exp: 0,

  // 장비
  weapon: "natt",   // 현재 무기 id
  weaponLv: 0,      // 대장간 강화 단계
  homiTier: 1,      // 호미 등급(채집 품질) 1~3

  magic: ["dokkaebi"],  // 보유 마법 id
  affection: { mudang:0, daejang:0, chonjang:0, jumo:0 },
  pet: null,            // {id,name,icon} — 퀘스트 보상

  // 인벤토리: { itemId: count }  (약초 / 메밀가루 등)
  inv: {},
};

const Player = {
  init(){
    P.hp = 50; P.maxHp = 50; P.mp = 20; P.maxMp = 20;
    P.stamina = DATA.CONST.MAX_STAMINA;
    P.money = DATA.CONST.START_MONEY;
    P.level = 1; P.exp = 0;
    P.weapon = "natt"; P.weaponLv = 0; P.homiTier = 1;
    P.magic = ["dokkaebi"];
    P.affection = { mudang:0, daejang:0, chonjang:0, jumo:0 };
    P.pet = null;
    P.inv = {};
  },

  /* ---- 인벤토리 ---- */
  add(id, n){ P.inv[id] = (P.inv[id] || 0) + (n || 1); },
  remove(id, n){
    n = n || 1;
    if ((P.inv[id]||0) < n) return false;
    P.inv[id] -= n;
    if (P.inv[id] <= 0) delete P.inv[id];
    return true;
  },
  count(id){ return P.inv[id] || 0; },
  // 보유한 나물(약초) 전부
  herbList(){ return Object.keys(P.inv).filter(id => DATA.HERBS[id]); },
  herbTotal(){ return Player.herbList().reduce((s,id)=> s + P.inv[id], 0); },

  /* ---- 스탯 변경 ---- */
  spendStamina(n){ P.stamina = clamp(P.stamina - n, 0, DATA.CONST.MAX_STAMINA); },
  hasStamina(n){ return P.stamina >= n; },
  spendMoney(n){ if (P.money < n) return false; P.money -= n; return true; },
  heal(n){ P.hp = clamp(P.hp + n, 0, P.maxHp); },
  restoreMp(n){ P.mp = clamp(P.mp + n, 0, P.maxMp); },

  isSlow(){ return P.stamina <= 10; },

  /* ---- 무기 ---- */
  weaponData(){
    const w = Object.assign({}, DATA.WEAPONS[P.weapon]);
    w.atk += P.weaponLv * DATA.WEAPON_UPGRADE.atkBonus + (P.level-1)*2;
    return w;
  },

  /* ---- 마법 ---- */
  hasMagic(id){ return P.magic.includes(id); },
  learnMagic(id){ if (!P.magic.includes(id)){ P.magic.push(id); return true; } return false; },

  /* ---- 호감도 ---- */
  addAffection(npc, n){
    P.affection[npc] = clamp((P.affection[npc]||0) + n, 0, 10);
  },

  /* ---- 경험치/레벨 ---- */
  gainExp(n){
    P.exp += n;
    const need = () => P.level * 25;
    while (P.exp >= need()){
      P.exp -= need();
      P.level++;
      P.maxHp += 12; P.maxMp += 5;
      P.hp = P.maxHp; P.mp = P.maxMp;
      toast(`⭐ 레벨 업! Lv.${P.level} (체력·신력 증가)`, "gold");
    }
  },

  /* ---- 새 날 ---- */
  onNewDay(){
    P.stamina = DATA.CONST.MAX_STAMINA;  // 취침 시 기력 회복
    P.mp = P.maxMp;
    P.hp = clamp(P.hp + 10, 0, P.maxHp);
    // 펫이 밤새 약초를 물어온다
    if (P.pet && chance(0.8)){
      const h = choice(DATA.herbsBySeason(Time.season()).filter(x=>x.tier<=2));
      Player.add(h.id,1);
      setTimeout(()=>toast(`${P.pet.icon} ${P.pet.name}이(가) ${h.icon}${h.name}을(를) 물어왔다!`,"good"), 400);
    }
  },
};
