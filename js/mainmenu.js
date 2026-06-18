/* =========================================================================
 * 메인 메뉴 (통합 UI) (#14) — TAB/ESC 호출, 게임 일시정지
 *  좌: 캐릭터(장비·스탯) + 봇짐(격자·카테고리 필터·상세)
 *  우: 탭(지도 · 인맥 · 할 일 · 설정)
 * ======================================================================= */
const MainMenu = {
  open:false, el:null, tab:"map", filter:"all", sel:null,

  // 계절·등급별 나물 도감 그림 (assets/namul) — 시트의 약초명/계절은 참고용
  NAMUL_IMG: {
    "봄":  [{f:"spring_level1 (쑥, 달래, 냉이).png",t:1},{f:"spring_level2 (참취나물, 두릅, 명이).png",t:2},{f:"spring_level3 (산갓).png",t:3},{f:"spring_level3 (산삼).png",t:3}],
    "여름":[{f:"summer_level1 (비름나물, 깻잎, 고구마순).png",t:1}],
    "가을":[{f:"fall_level1 (도라지, 참나물, 무청).png",t:1},{f:"fall_level2 (산더덕, 참당귀, 느타리).png",t:2},{f:"fall_level3 (송이버섯, 백년도라지).png",t:3}],
    "겨울":[{f:"winter_level2 (봄동, 세발나물, 동초).png",t:2}],
  },

  init(){
    const d = document.createElement("div");
    d.id = "mainmenu"; d.className = "hidden";
    d.innerHTML = `
      <div class="mm-wrap">
        <button class="mm-close" data-mm="close">✕ 닫기 (ESC)</button>
        <div class="mm-left">
          <div class="mm-name">👧 달래 <span id="mm-lv"></span></div>
          <div class="mm-sec">장비</div>
          <div id="mm-equip" class="mm-equip"></div>
          <div class="mm-sec">스탯</div>
          <div id="mm-stats" class="mm-stats"></div>
          <div class="mm-sec">봇짐</div>
          <div id="mm-filters" class="mm-filters"></div>
          <div id="mm-grid" class="mm-grid"></div>
          <div id="mm-detail" class="mm-detail">아이템을 누르면 상세 정보가 표시됩니다.</div>
        </div>
        <div class="mm-right">
          <div id="mm-tabs" class="mm-tabs"></div>
          <div id="mm-tabbody" class="mm-tabbody"></div>
        </div>
      </div>`;
    document.body.appendChild(d);
    this.el = d;
    d.addEventListener("click", (e)=>{
      const b = e.target.closest("[data-mm]"); if(!b) return;
      const a=b.dataset.mm;
      if (a==="close") return MainMenu.close();
      if (a.startsWith("tab:")){ MainMenu.tab=a.slice(4); MainMenu._renderTabs(); MainMenu._renderTabBody(); return; }
      if (a.startsWith("filt:")){ MainMenu.filter=a.slice(5); MainMenu._renderInv(); return; }
      if (a.startsWith("item:")){ MainMenu.sel=a.slice(5); MainMenu._renderInv(); return; }
      if (a==="mute"){ Sound.toggleMute(); MainMenu._renderTabBody(); return; }
      if (a==="save"){ Save.save(); toast("💾 저장했다","good"); return; }
      if (a==="title"){ if(confirm("타이틀로 돌아갈까요? (자동 저장됨)")){ Save.save(); MainMenu.close(); Game.showTitle(); } return; }
    });
    window.addEventListener("keydown", (e)=>{
      if (e.key==="Tab"){ e.preventDefault(); if(G.scene!=="title"&&G.scene!=="combat"&&G.scene!=="trade" && !UI.dialogueOpen && !UI.menuOpen) MainMenu.toggle(); return; }
      if (e.key==="Escape" && MainMenu.open){ e.preventDefault(); MainMenu.close(); }
    }, true);
  },

  toggle(){ this.open ? this.close() : this.show(); },
  show(){ this.open=true; this.el.classList.remove("hidden"); this._renderAll(); },
  close(){ this.open=false; this.el.classList.add("hidden"); },

  _renderAll(){ this._renderLeft(); this._renderInv(); this._renderTabs(); this._renderTabBody(); },

  /* ---- 좌측: 장비 / 스탯 ---- */
  _renderLeft(){
    document.getElementById("mm-lv").textContent = `Lv.${P.level}`;
    const w=Player.weaponData(), cs=Player.costumeData(), ac=Player.accessoryData();
    const eq=[
      ["⚔️ 무기", `${w.icon}${w.name} (공${w.atk}·강화+${P.weaponLv})`],
      ["👘 의상", `${cs.icon}${cs.name} +${P.costumeLv||0}`],
      ["🧿 장신구", `${ac.icon}${ac.name} ⟡${P.accLv||0}`],
      ["⛏️ 채집도구", `호미 등급 ${P.homiTier}`],
    ];
    document.getElementById("mm-equip").innerHTML = eq.map(([k,v])=>`<div class="mm-row"><span>${k}</span><b>${v}</b></div>`).join("");
    const st=[
      ["최대 기력", DATA.CONST.MAX_STAMINA],
      ["이동 속도", `×${Player.speedMult().toFixed(2)}`],
      ["채집 숙련", `호미 ${P.homiTier}등급`],
      ["요리 숙련", `Lv.${Player.cookLv()} · 명성 ${P.fame}`],
    ];
    document.getElementById("mm-stats").innerHTML = st.map(([k,v])=>`<div class="mm-row"><span>${k}</span><b>${v}</b></div>`).join("");
  },

  /* ---- 봇짐(인벤토리) ---- */
  _itemInfo(id){
    const h=DATA.HERBS[id]; if(h) return { name:h.name, icon:h.icon, cat:"herb", grade:["-","하","중","상"][h.tier], desc:`${h.season} 약초 · 회복 ${h.heal} · 시세 ${h.price}냥` };
    const g=DATA.INGREDIENTS[id]||DATA.GOODS[id]; if(g) return { name:g.name, icon:g.icon, cat:"ing", grade:"-", desc:`요리 재료 · 획득: ${g.src||"-"}` };
    const dr=DATA.DROPS[id]; if(dr) return { name:dr.name, icon:dr.icon, cat:"etc", grade:dr.tribute?"공물":"하", desc:dr.tribute?"당나무 제단 공물(마법 해금)":`요괴 잡템 · 시세 ${dr.price}냥` };
    if(id==="seed") return { name:"메밀 종자", icon:"🌰", cat:"etc", grade:"-", desc:"메밀밭에 심으면 4일 후 수확" };
    return { name:id, icon:"📦", cat:"etc", grade:"-", desc:"" };
  },
  _renderInv(){
    const filters=[["all","전체"],["herb","나물"],["ing","식재료"],["etc","잡화"]];
    document.getElementById("mm-filters").innerHTML = filters.map(([k,n])=>
      `<button data-mm="filt:${k}" class="${MainMenu.filter===k?'on':''}">${n}</button>`).join("");
    const ids=Object.keys(P.inv).filter(id=>P.inv[id]>0 && (MainMenu.filter==="all" || MainMenu._itemInfo(id).cat===MainMenu.filter));
    const SLOTS=24, cells=[];
    for(let i=0;i<Math.max(SLOTS,ids.length);i++){
      const id=ids[i];
      if(id){ const it=MainMenu._itemInfo(id);
        cells.push(`<div class="mm-cell ${MainMenu.sel===id?'sel':''}" data-mm="item:${id}" title="${it.name}">${it.icon}<span class="mm-qty">${P.inv[id]}</span></div>`);
      } else cells.push(`<div class="mm-cell empty"></div>`);
    }
    document.getElementById("mm-grid").innerHTML = cells.join("");
    const det=document.getElementById("mm-detail");
    if (MainMenu.sel && P.inv[MainMenu.sel]>0){ const it=MainMenu._itemInfo(MainMenu.sel);
      det.innerHTML = `<div class="mm-d-name">${it.icon} ${it.name} <span class="mm-d-grade">[${it.grade}]</span> ×${P.inv[MainMenu.sel]}</div>
        <div class="mm-d-id">ID: ${MainMenu.sel}</div><div class="mm-d-desc">${it.desc}</div>`;
    } else det.textContent = "아이템을 누르면 상세 정보가 표시됩니다.";
  },

  /* ---- 우측 탭 ---- */
  _renderTabs(){
    const tabs=[["map","🗺 지도"],["npc","🤝 인맥"],["quest","📜 할 일"],["set","⚙ 설정"]];
    document.getElementById("mm-tabs").innerHTML = tabs.map(([k,n])=>
      `<button data-mm="tab:${k}" class="${MainMenu.tab===k?'on':''}">${n}</button>`).join("");
  },
  _renderTabBody(){
    const b=document.getElementById("mm-tabbody");
    if (MainMenu.tab==="map") b.innerHTML = MainMenu._mapHTML();
    else if (MainMenu.tab==="npc") b.innerHTML = MainMenu._npcHTML();
    else if (MainMenu.tab==="quest") b.innerHTML = MainMenu._questHTML();
    else b.innerHTML = MainMenu._setHTML();
  },
  _mapHTML(){
    const z=World.zone, cur=Maps[z]?Maps[z].name:z;
    let h=`<p class="mm-p">현재 위치: <b>${cur}</b> · ${Time.season()} ${Time.dayOfSeason()}일 ${Time.clockStr()}</p>`;
    h+=`<div class="mm-sec">구역</div>`;
    [["house","내 집"],["village","마을"],["mtn1","산 입구"],["mtn2","산 중턱"],["mtn3","깊은 숲"],["mtn4","산 정상"]].forEach(([k,n])=>{
      h+=`<div class="mm-row"><span>${z===k?"📍 ":""}${n}</span><b>${z===k?"현재":""}</b></div>`;
    });
    const meta=DATA.zoneMeta(z);
    if (meta){
      const herbs=DATA.herbsBySeason(Time.season()).filter(x=> meta.tier>0 && x.tier<=meta.tier);
      h+=`<div class="mm-sec">이 구역 채집 나물(${Time.season()})</div><p class="mm-p">${herbs.map(x=>x.icon+x.name).join(" ")||"없음"}</p>`;
      h+=`<div class="mm-sec">출몰 요괴</div><p class="mm-p">${(meta.monsters||[]).map(m=>DATA.MONSTERS[m].icon+DATA.MONSTERS[m].name).join(" ")||"없음(안전)"}</p>`;
    }
    // 나물 도감 (계절 그림)
    const ng = MainMenu.NAMUL_IMG[Time.season()] || [];
    if (ng.length){
      h+=`<div class="mm-sec">나물 도감 (${Time.season()})</div><div class="mm-namul">`;
      ng.forEach(o=>{ const label=(o.f.match(/\(([^)]*)\)/)||[])[1]||"";
        h+=`<figure class="nm-card"><img src="${encodeURI('assets/namul/'+o.f)}" alt="${label}" loading="lazy"><figcaption>${o.t}등급 · ${label}</figcaption></figure>`; });
      h+=`</div>`;
    }
    return h;
  },
  _npcHTML(){
    let h=`<p class="mm-p">마을 사람들과의 정(情)</p>`;
    Object.values(DATA.NPCS).forEach(n=>{
      const a=P.affection[n.id]||0;
      h+=`<div class="mm-row"><span>${n.icon} ${n.name}</span><b style="color:#e7c66b">${"♥".repeat(a)}${"♡".repeat(Math.max(0,10-a))}</b></div>`;
    });
    return h;
  },
  _questHTML(){
    const act=Quests.active, done=Quests.done;
    let h="";
    const line=(id)=>{ const q=Quests.defs[id], t=Quests.trackerLines().find(x=>x.title===q.title);
      const cur=t?t.cur:0, total=t?t.total:Quests.goalCount(q.goal);
      return `<div class="mm-row"><span>${q.story?"📖":"📜"} ${q.title} <span class="mm-d-id">(${DATA.NPCS[q.giver].name})</span></span><b>${Quests.reached(id)?'<span style="color:#58d68d">완료가능</span>':cur+"/"+total}</b></div>`; };
    h+=`<div class="mm-sec">진행 중 (${act.length})</div>`;
    h+= act.length?act.map(line).join(""):`<p class="mm-p">없음</p>`;
    h+=`<div class="mm-sec">완료 (${done.length})</div>`;
    h+= done.length?done.map(id=>`<div class="mm-row" style="opacity:.6"><span>✔️ ${Quests.defs[id].title}</span></div>`).join(""):`<p class="mm-p">없음</p>`;
    return h;
  },
  _setHTML(){
    return `<div class="mm-sec">설정</div>
      <div class="mm-row"><span>소리</span><button data-mm="mute">${Sound.muted?"🔇 음소거됨 (켜기)":"🔊 켜짐 (끄기)"}</button></div>
      <div class="mm-row"><span>저장</span><button data-mm="save">💾 지금 저장</button></div>
      <div class="mm-row"><span>타이틀</span><button data-mm="title">🏠 타이틀로</button></div>
      <p class="mm-p" style="margin-top:14px">조작: 이동 WASD/방향키 · 상호작용 Space/E · 봇짐 I · 의뢰 J · 메뉴 TAB · GM F1/G</p>`;
  },
};
