/* =========================================================================
 * 저장/불러오기 (localStorage)
 * ======================================================================= */
const Save = {
  KEY: "josun_n_save_v1",

  exists(){ return !!localStorage.getItem(Save.KEY); },

  data(){
    return {
      time: G.time,
      flags: G.flags,
      player: {
        hp: P.hp, maxHp: P.maxHp, mp: P.mp, maxMp: P.maxMp,
        stamina: P.stamina, money: P.money, level: P.level, exp: P.exp,
        weapon: P.weapon, weaponLv: P.weaponLv,
        magic: P.magic, inv: P.inv, affection: P.affection,
        homiTier: P.homiTier, pet: P.pet,
        costume: P.costume, accessory: P.accessory, shrinePoints: P.shrinePoints,
        cookXp: P.cookXp, fame: P.fame, recipes: P.recipes, cookTrain: P.cookTrain, farmPlots: P.farmPlots,
        buff: P.buff, cauldronDay: P.cauldronDay,
      },
      farm: Farming.save(),
      quests: Quests.save(),
      worldZone: World.zone,
    };
  },

  save(){
    try { localStorage.setItem(Save.KEY, JSON.stringify(Save.data())); return true; }
    catch(e){ return false; }
  },

  auto(){ Save.save(); },

  load(){
    const raw = localStorage.getItem(Save.KEY);
    if (!raw) return false;
    try {
      const d = JSON.parse(raw);
      G.time = d.time; G.flags = d.flags || {};
      Object.assign(P, d.player);
      Farming.restore(d.farm);
      Quests.restore(d.quests);
      World.zone = d.worldZone || "house";
      return true;
    } catch(e){ return false; }
  },

  wipe(){ localStorage.removeItem(Save.KEY); },
};
