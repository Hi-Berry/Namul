/* =========================================================================
 * 플레이어 — 스탯 / 인벤토리 / 장비 / 마법 / 호감도
 * ======================================================================= */
const P = {
  // 월드 좌표(픽셀)
  x: 0, y: 0, dir: "down", moving: false, animT: 0,
  speed: 130, // px/s

  // 스탯
  hp: 100, maxHp: 100,
  mp: 20, maxMp: 20,
  stamina: 100,
  money: 0,
  level: 1, exp: 0,

  // 장비 (무기 / 의상 / 장신구)
  weapon: "natt",   // 현재 무기 id
  weaponLv: 0,      // 대장간 강화 단계
  homiTier: 1,      // 호미 등급(채집 품질) 1~3
  costume: "plain", // 의상 id
  costumeLv: 0,     // 의상 강화 단계 (의상점)
  accessory: "none",// 장신구 id
  accLv: 0,         // 장신구 인챈트 단계 (방물점)

  magic: [],            // 보유 마법 id (당산나무에서 해금)
  shrinePoints: 0,      // 당산나무 누적 정기
  affection: { mudang:0, daejang:0, chonjang:0, jumo:0, uisang:0, geonchuk:0, uiwon:0, yakcho:0, hunjang:0, bobu:0, nongbu:0, banga:0, pujut:0 },
  pet: null,            // {id,name,icon} — 퀘스트 보상
  buff: null,           // 보양식 버프 {id,name,icon,kind,power} — 다음 취침까지 유지
  cauldronDay: 0,       // 가마솥 보양식을 끓인 날(일일 1회 제한)
  romance: {},          // 연애 NPC 호감도 {id:0~100} (#24)
  lover: null,          // 확정된 연인 id

  // 진행/성장
  cookXp: 0,            // 요리 숙련 경험치
  fame: 0,              // 마을 명성
  recipes: ["jeon","jangtteok","bindaetteok"],  // 해금한 레시피
  cookTrain: 0,         // 서당 요리 수련(추가 보수 배율)
  farmPlots: 6,         // 메밀밭 칸 수(농부에게 확장)

  // 인벤토리: { itemId: count }  (약초 / 메밀가루 등)
  inv: {},
};

const Player = {
  init(){
    P.hp = 100; P.maxHp = 100; P.mp = 20; P.maxMp = 20;
    P.stamina = DATA.CONST.MAX_STAMINA;
    P.money = DATA.CONST.START_MONEY;
    P.level = 1; P.exp = 0;
    P.weapon = "natt"; P.weaponLv = 0; P.homiTier = 1;
    P.costume = "plain"; P.costumeLv = 0; P.accessory = "none"; P.accLv = 0;
    P.magic = []; P.shrinePoints = 0;
    P.affection = { mudang:0, daejang:0, chonjang:0, jumo:0, uisang:0, geonchuk:0, uiwon:0, yakcho:0, hunjang:0, bobu:0, nongbu:0, banga:0, pujut:0 };
    P.pet = null;
    P.cookXp = 0; P.fame = 0; P.recipes = DATA.START_RECIPES.slice(); P.cookTrain = 0; P.farmPlots = 6;
    P.buff = null; P.cauldronDay = 0;
    P.romance = {}; P.lover = null;
    P.inv = {};
  },

  /* ---- 레시피 ---- */
  hasRecipe(id){ return P.recipes.includes(id); },
  learnRecipe(id){ if(!P.recipes.includes(id)){ P.recipes.push(id); return true; } return false; },
  cookLv(){ return DATA.cookLevel(P.cookXp); },
  // 명성 마일스톤(#8): 달성한 임계치의 레시피를 무료 자동 해금
  checkFameUnlocks(){
    DATA.FAME_UNLOCKS.forEach(m=>{
      if (P.fame >= m.fame){
        m.recipes.forEach(id=>{
          if (Player.learnRecipe(id)){
            toast(`📜 명성 ${m.fame} 달성! '${DATA.RECIPES[id].name}' 비법 전수!`, "gold");
            Quests.notify("recipe", { id });
          }
        });
      }
    });
  },

  /* ---- 보양식 버프 ---- */
  buffFactor(kind){ return (P.buff && P.buff.kind===kind) ? P.buff.power : 0; },
  // 가마솥 보양식 섭취: 하루 동안 한 가지 효과 유지(새로 먹으면 교체)
  eatBuffFood(food){
    P.buff = { id:food.id, name:food.name, icon:food.icon, kind:food.kind, power:food.power };
    P.cauldronDay = G.time.day;
  },
  buffUsedToday(){ return P.cauldronDay === G.time.day; },

  /* ---- 장비 파생 스탯 ---- */
  costumeData(){ return DATA.COSTUMES[P.costume] || DATA.COSTUMES.plain; },
  accessoryData(){ return DATA.ACCESSORIES[P.accessory] || DATA.ACCESSORIES.none; },
  // 의상 강화(단계당 -3% 소모, +3% 이동) + 보양식(기력효율↑)
  staminaMult(){ return Player.costumeData().staminaMult * (1 - (P.costumeLv||0)*0.03) * (1 - Player.buffFactor("stamina")) * ((window.Romance && Romance.hasBuff("guard"))?0.8:1); },
  speedMult(){ return Player.costumeData().speedMult * (1 + (P.costumeLv||0)*0.03) * (1 + Player.buffFactor("speed")); },
  // 장신구 인챈트(단계당 드롭 +3%, 신력 +5)
  dropBonus(){ return Player.accessoryData().dropBonus + (P.accLv||0)*0.03 + Player.buffFactor("drop"); },
  mpCap(){ return P.maxMp + Player.accessoryData().mpBonus + (P.accLv||0)*5 + ((window.Romance && Romance.hasBuff("spirit"))?20:0); },
  // 부산물(드롭) 목록
  dropList(){ return Object.keys(P.inv).filter(id => DATA.DROPS[id]); },

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
  // 의상에 따라 기력 소모 효율 적용
  spendStamina(n){ P.stamina = clamp(P.stamina - Math.round(n * Player.staminaMult()), 0, DATA.CONST.MAX_STAMINA); },
  hasStamina(n){ return P.stamina >= Math.round(n * Player.staminaMult()); },
  spendMoney(n){ if (P.money < n) return false; P.money -= n; return true; },
  heal(n){ P.hp = clamp(P.hp + n, 0, P.maxHp); },
  restoreMp(n){ P.mp = clamp(P.mp + n, 0, Player.mpCap()); },

  isSlow(){ return P.stamina <= 10; },

  /* ---- 무기 ---- */
  weaponData(){
    const w = Object.assign({}, DATA.WEAPONS[P.weapon]);
    w.atk += P.weaponLv * DATA.WEAPON_UPGRADE.atkBonus + (P.level-1)*2;
    // 보양식(공격력↑) 적용
    w.atk = Math.round(w.atk * (1 + Player.buffFactor("atk")));
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
      P.hp = P.maxHp; P.mp = Player.mpCap();
      toast(`⭐ 레벨 업! Lv.${P.level} (체력·신력 증가)`, "gold");
    }
  },

  /* ---- 새 날 ---- */
  onNewDay(){
    // 취침 시 체력·신력·기력 모두 최대치로 완전 회복
    P.stamina = DATA.CONST.MAX_STAMINA;
    P.mp = Player.mpCap();
    P.hp = P.maxHp;
    P.buff = null;  // 보양식 효과는 하루 동안만 유지 → 새 날에 해제
    // 펫이 밤새 종류별 수집을 해온다 (#5)
    if (P.pet){
      const bonus = P.pet.bonus || "herb";
      if (bonus==="herb" && chance(0.85)){
        const h = choice(DATA.herbsBySeason(Time.season()).filter(x=>x.tier<=2));
        Player.add(h.id,1);
        setTimeout(()=>toast(`${P.pet.icon} ${P.pet.name}이(가) ${h.icon}${h.name}을(를) 물어왔다!`,"good"), 400);
      } else if (bonus==="drop" && chance(0.7)){
        const d = choice(Object.values(DATA.DROPS).filter(x=>x.common));
        Player.add(d.id,1);
        setTimeout(()=>toast(`${P.pet.icon} ${P.pet.name}이(가) ${d.icon}${d.name}을(를) 주워왔다!`,"good"), 400);
      } else if (bonus==="gold" && chance(0.8)){
        const g = randInt(20,50); P.money += g;
        setTimeout(()=>toast(`${P.pet.icon} ${P.pet.name}이(가) ${g}냥을 물어왔다!`,"gold"), 400);
      }
    }
  },
};
