/* =========================================================================
 * 당나무 제단 — 요괴 '공물'을 바쳐 신통력(마법) 해금
 *  기획서: 마법마다 정해진 공물을 정해진 수량 모아 바치면 해금
 *  도깨비의 불×30 → 도깨비불 / 서늘한 물안개×25 → 한기 서림
 *  여우 구슬×15 → 현혹의 춤 / 붉은 뿔 조각×5 → 태산 압사
 * ======================================================================= */
const Shrine = {
  open(){
    Sound.sfx("blip");
    UI.startDialogue("🌳 당나무 제단", [
      "산을 지키는 늙은 당나무다. 요괴의 공물을 바치면 깃든 신령이 신통력을 내려준다.",
      "필요한 공물을 모아 제단에 올리거라."
    ], {
      choices:[ { label:"공물 바치기 / 신통력 보기", value:"menu" }, { label:"물러난다", value:"bye" } ],
      onChoice(v){ if (v==="menu") Shrine._menu(); }
    });
  },

  _menu(){
    let html = `<p class="note">마법마다 정해진 <b>공물</b>을 모아 바치면 해금됩니다.</p>`;
    Object.values(DATA.MAGIC).forEach(m=>{
      const trib = DATA.DROPS[m.tribute];
      const have = Player.count(m.tribute);
      const owned = Player.hasMagic(m.id);
      const ready = have >= m.need;
      const status = owned ? `<button disabled>해금됨</button>`
        : ready ? `<button data-act="unlock" data-id="${m.id}">헌납하여 해금</button>`
                : `<button disabled>${have}/${m.need}</button>`;
      html += `<div class="shop-row"><div class="item-ic" style="background:#2a1d33">${m.icon}</div>
        <div class="grow">
          <div class="item-name">${m.name} <span class="item-sub">(${m.sub} · 신력 ${m.mp})</span></div>
          <div class="item-sub">${m.desc}</div>
          <div class="item-sub">공물: ${trib.icon}${trib.name} <b>${have}/${m.need}</b></div>
        </div>${status}</div>`;
    });
    UI.openMenu("🌳 당나무 제단", html, (act,id)=>{
      if (act==="unlock"){
        const m=DATA.MAGIC[id];
        if (Player.count(m.tribute) >= m.need && !Player.hasMagic(m.id)){
          Player.remove(m.tribute, m.need);
          Player.learnMagic(m.id);
          Sound.sfx("levelup");
          toast(`✨ 신령이 '${m.name}(${m.sub})' 신통력을 내렸다!`,"gold");
          Shrine._menu(); UI.refreshHUD();
        } else Sound.sfx("error");
      }
    });
  },
};
