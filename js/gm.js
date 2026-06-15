/* =========================================================================
 * GM 모드 — 개발자/테스트 콘솔 (#7)
 *  단축키 F1 또는 G 로 패널 토글. 시간/자금/아이템 치트.
 * ======================================================================= */
const GM = {
  open:false, el:null,

  init(){
    const d = document.createElement("div");
    d.id = "gm-panel"; d.className = "hidden";
    d.innerHTML = `
      <div class="gm-head">🛠 GM 콘솔 <span class="gm-x" data-gm="close">✕</span></div>
      <div class="gm-sec">⏱ 시간</div>
      <div class="gm-row">
        <button data-gm="t1">+1시간</button>
        <button data-gm="t6">+6시간</button>
        <button data-gm="morning">아침06시</button>
        <button data-gm="nextday">하루넘기기</button>
        <button data-gm="season">다음계절</button>
        <button data-gm="fast">시간가속 ⏩</button>
      </div>
      <div class="gm-sec">💰 자금 · 성장</div>
      <div class="gm-row">
        <button data-gm="m1k">+1000냥</button>
        <button data-gm="m-1k">-1000냥</button>
        <button data-gm="fame">명성+500</button>
        <button data-gm="lvup">레벨업</button>
        <button data-gm="fullstat">스탯 풀회복</button>
      </div>
      <div class="gm-sec">🎒 아이템 치트</div>
      <div class="gm-row">
        <button data-gm="herbSeason">계절약초×5</button>
        <button data-gm="herbAll">전약초×5</button>
        <button data-gm="ingAll">전재료×10</button>
        <button data-gm="dropAll">요괴드롭×30</button>
        <button data-gm="seed">메밀종자×5</button>
      </div>
      <div class="gm-sec">📜 해금</div>
      <div class="gm-row">
        <button data-gm="recipes">전레시피</button>
        <button data-gm="magic">전마법</button>
        <button data-gm="homi">호미최고급</button>
      </div>
      <div class="gm-foot">F1 / G 로 열고 닫기</div>`;
    document.body.appendChild(d);
    this.el = d;
    d.addEventListener("click", (e)=>{ const b=e.target.closest("[data-gm]"); if(b){ e.stopPropagation(); GM.action(b.dataset.gm); } });
    window.addEventListener("keydown", (e)=>{
      if (e.key==="F1" || e.key==="g" || e.key==="G"){ e.preventDefault(); GM.toggle(); }
    });
  },

  toggle(){ this.open=!this.open; this.el.classList.toggle("hidden", !this.open); if(this.open) GM._refresh(); },

  _refresh(){
    const f=this.el.querySelector('[data-gm="fast"]');
    if (f) f.textContent = (G.gmTimeMult>1) ? "시간가속 ⏩ x"+G.gmTimeMult : "시간가속 ⏩";
  },

  _added(txt){ toast("🛠 "+txt, "gold"); UI.refreshHUD(); GM._refresh(); },

  action(a){
    switch(a){
      case "close": GM.toggle(); return;
      case "t1": Time.advance(60); break;
      case "t6": Time.advance(360); break;
      case "morning": G.time.min=0; break;
      case "nextday": sleep(false); break;
      case "season": G.time.day += 30; break;
      case "fast": G.gmTimeMult = (G.gmTimeMult>1?1:8); break;
      case "m1k": P.money += 1000; break;
      case "m-1k": P.money = Math.max(0, P.money-1000); break;
      case "fame": P.fame += 500; Player.checkFameUnlocks(); break;
      case "lvup": Player.gainExp(P.level*25); break;
      case "fullstat": P.hp=P.maxHp; P.mp=Player.mpCap(); P.stamina=DATA.CONST.MAX_STAMINA; break;
      case "herbSeason": DATA.herbsBySeason(Time.season()).forEach(h=>Player.add(h.id,5)); break;
      case "herbAll": Object.values(DATA.HERBS).forEach(h=>Player.add(h.id,5)); break;
      case "ingAll": Object.values(DATA.INGREDIENTS).forEach(g=>{ if(g.id!=="namul") Player.add(g.id,10); }); break;
      case "dropAll": Object.values(DATA.DROPS).forEach(d=>Player.add(d.id,30)); break;
      case "seed": Player.add("seed",5); break;
      case "recipes": Object.keys(DATA.RECIPES).forEach(id=>Player.learnRecipe(id)); break;
      case "magic": Object.keys(DATA.MAGIC).forEach(id=>Player.learnMagic(id)); break;
      case "homi": P.homiTier=3; break;
    }
    GM._added({ t1:"+1시간", t6:"+6시간", morning:"아침 06시", nextday:"다음 날", season:"다음 계절로",
      fast:"시간 가속 토글", m1k:"+1000냥", "m-1k":"-1000냥", fame:"명성 +500", lvup:"레벨업",
      fullstat:"스탯 풀회복", herbSeason:"계절 약초 지급", herbAll:"전 약초 지급", ingAll:"전 재료 지급",
      dropAll:"요괴 드롭 지급", seed:"메밀 종자 지급", recipes:"전 레시피 해금", magic:"전 마법 해금",
      homi:"호미 최고급" }[a] || "적용");
  },
};
