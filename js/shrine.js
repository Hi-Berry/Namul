/* =========================================================================
 * 당산나무 신당 — 요괴 부산물을 헌납해 정기를 모으고 신통력(마법) 해금
 *  기획서: 산 입구의 당산나무. 몬스터 드롭 누적 헌납 → 임계치마다 마법 1종.
 * ======================================================================= */
const Shrine = {
  pendingPts(){ return Player.dropList().reduce((s,id)=> s + DATA.DROPS[id].pts * P.inv[id], 0); },

  open(){
    Sound.sfx("blip");
    UI.startDialogue("🌳 당산나무", [
      "산을 지키는 늙은 당산나무다. 요괴의 부산물을 바치면 깃든 신령이 신통력을 내려준다.",
      `지금까지 모은 정기(精氣): <b>${P.shrinePoints}</b>`
    ], {
      choices:[
        { label:"부산물 헌납하기", value:"offer" },
        { label:"신통력 목록 보기", value:"list" },
        { label:"물러난다", value:"bye" },
      ],
      onChoice(v){ if (v==="offer") Shrine._menu(); else if (v==="list") Shrine._menu(); }
    });
  },

  _menu(){
    const drops = Player.dropList();
    const pend = Shrine.pendingPts();
    let html = `<p class="note">누적 정기: <b>${P.shrinePoints}</b> · 헌납 대기 부산물: <b>+${pend}</b></p>`;

    // 보유 부산물
    html += `<h4 style="color:#e7c66b;margin:6px 0">🦴 요괴 부산물</h4>`;
    if (!drops.length) html += `<p class="note">바칠 부산물이 없다. 산에서 요괴를 처치하면 얻는다.</p>`;
    drops.forEach(id=>{ const d=DATA.DROPS[id];
      html += `<div class="shop-row"><div class="item-ic" style="background:#1f2a1f">${d.icon}</div>
        <div class="grow"><div class="item-name">${d.name} ×${P.inv[id]}</div>
        <div class="item-sub">개당 정기 ${d.pts}</div></div></div>`;
    });
    if (drops.length) html += `<div class="shop-row"><div class="grow"></div><button data-act="offer">전부 헌납 (+${pend} 정기)</button></div>`;

    // 신통력 목록
    html += `<hr style="border-color:#50412a;margin:12px 0"><h4 style="color:#e7c66b;margin:6px 0">✨ 신통력</h4>`;
    Object.values(DATA.MAGIC).sort((a,b)=>a.shrinePts-b.shrinePts).forEach(m=>{
      const owned = Player.hasMagic(m.id);
      const ok = P.shrinePoints >= m.shrinePts;
      const status = owned ? `<span style="color:#58d68d">해금됨</span>`
                   : ok ? `<span style="color:#e7c66b">정기 충족! 다음 헌납 때 해금</span>`
                   : `<span style="color:#9c8a68">정기 ${m.shrinePts} 필요 (${P.shrinePoints}/${m.shrinePts})</span>`;
      html += `<div class="shop-row"><div class="item-ic" style="background:#2a1d33">${m.icon}</div>
        <div class="grow"><div class="item-name">${m.name} <span class="item-sub">(신력 ${m.mp})</span></div>
        <div class="item-sub">${m.desc}</div><div class="item-sub">${status}</div></div></div>`;
    });

    UI.openMenu("🌳 당산나무 신당", html, (act)=>{
      if (act==="offer"){
        const gained = Shrine.pendingPts();
        if (gained<=0){ Sound.sfx("error"); return; }
        Player.dropList().forEach(id=> delete P.inv[id]);
        P.shrinePoints += gained;
        Sound.sfx("magic");
        toast(`🌳 부산물을 바쳐 정기 +${gained} (누적 ${P.shrinePoints})`,"gold");
        Shrine.checkUnlock();
        Shrine._menu(); UI.refreshHUD();
      }
    });
  },

  // 정기 임계 도달한 마법 자동 해금
  checkUnlock(){
    Object.values(DATA.MAGIC).forEach(m=>{
      if (!Player.hasMagic(m.id) && P.shrinePoints >= m.shrinePts){
        Player.learnMagic(m.id);
        Sound.sfx("levelup");
        toast(`✨ 당산나무가 '${m.name}' 신통력을 내렸다!`,"gold");
      }
    });
  },
};
