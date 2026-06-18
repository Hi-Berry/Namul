/* =========================================================================
 * UI — HUD / 대화 / 메뉴(상점·인벤토리) / 풀스크린(타이틀·게임오버)
 * ======================================================================= */
const UI = {
  dialogueOpen: false,
  menuOpen: false,
  _dlg: null,   // {pages, idx, choices, onChoice, onEnd, sel}

  /* ---------------- HUD ---------------- */
  refreshHUD(){
    const hud = document.getElementById("hud");
    if (G.scene === "title"){ hud.classList.add("hidden"); return; }
    hud.classList.remove("hidden");
    document.getElementById("hud-date").innerHTML =
      `<span style="color:${DATA.SEASON_COLORS[Time.season()]}">${Time.season()}</span> ${Time.dayOfSeason()}일` +
      (Time.isMarketDay() ? " 🪧" : "");
    document.getElementById("hud-clock").textContent = Time.clockStr();
    const set = (bar,num,cur,max)=>{
      document.getElementById(bar).style.width = clamp(cur/max*100,0,100) + "%";
      document.getElementById(num).textContent = `${Math.ceil(cur)}/${max}`;
    };
    set("bar-hp","hud-hp",P.hp,P.maxHp);
    set("bar-mp","hud-mp",P.mp,Player.mpCap());
    set("bar-st","hud-st",P.stamina,DATA.CONST.MAX_STAMINA);
    document.getElementById("hud-money").textContent = `💰 ${P.money} 냥`;
    document.getElementById("hud-zone").textContent =
      (G.scene==="world" ? Maps[World.zone].name : G.scene==="trade" ? "주막 장사" : "전투") +
      ` · Lv.${P.level}`;
    const bf = document.getElementById("hud-buff");
    if (bf){
      if (P.buff){ bf.classList.remove("hidden"); bf.textContent = `${P.buff.icon} ${DATA.BUFF_TAG[P.buff.kind]}`; bf.title = `${P.buff.name} — 오늘 하루 유지`; }
      else { bf.classList.add("hidden"); bf.textContent=""; }
    }
  },

  setHint(html){ document.getElementById("hint").innerHTML = html || ""; },

  /* ---------------- 대화 ---------------- */
  // pages: string | string[] ; opts: {name, choices:[{label,value}], onChoice(v), onEnd()}
  startDialogue(name, pages, opts){
    opts = opts || {};
    this._dlg = {
      name,
      pages: Array.isArray(pages) ? pages.slice() : [pages],
      idx: 0,
      choices: opts.choices || null,
      onChoice: opts.onChoice,
      onEnd: opts.onEnd,
      sel: 0,
    };
    this.dialogueOpen = true;
    document.getElementById("dialogue").classList.remove("hidden");
    this._renderDialogue();
  },

  _renderDialogue(){
    const d = this._dlg;
    document.getElementById("dlg-name").textContent = d.name || "";
    document.getElementById("dlg-text").innerHTML = d.pages[d.idx] || "";
    const lastPage = d.idx >= d.pages.length - 1;
    const choicesEl = document.getElementById("dlg-choices");
    const contEl = document.getElementById("dlg-cont");
    choicesEl.innerHTML = "";
    if (lastPage && d.choices){
      contEl.classList.add("hidden");
      d.choices.forEach((c, i) => {
        const b = document.createElement("button");
        b.className = "dlg-choice" + (i===d.sel ? " sel":"");
        b.textContent = (i+1) + ". " + c.label;
        b.onclick = () => this._pickChoice(i);
        choicesEl.appendChild(b);
      });
    } else {
      contEl.classList.remove("hidden");
    }
  },

  _advanceDialogue(){
    const d = this._dlg;
    Sound.sfx("blip");
    if (d.idx < d.pages.length - 1){ d.idx++; this._renderDialogue(); return; }
    if (d.choices) return; // 선택지 대기
    this._closeDialogue();
  },

  _pickChoice(i){
    const d = this._dlg; const c = d.choices[i];
    Sound.sfx("select");
    this._closeDialogue();
    if (d.onChoice) d.onChoice(c.value, c);
  },

  _closeDialogue(){
    const d = this._dlg;
    this.dialogueOpen = false;
    this._dlg = null;
    document.getElementById("dialogue").classList.add("hidden");
    if (d && d.onEnd) d.onEnd();
  },

  /* ---------------- 메뉴/상점 ---------------- */
  openMenu(title, html, onClick){
    this.menuOpen = true;
    document.getElementById("menu-title").textContent = title;
    document.getElementById("menu-body").innerHTML = html;
    document.getElementById("menu").classList.remove("hidden");
    this._menuClick = onClick;
    // 버튼 이벤트 위임
    const body = document.getElementById("menu-body");
    body.querySelectorAll("[data-act]").forEach(btn => {
      btn.onclick = () => { if (this._menuClick) this._menuClick(btn.dataset.act, btn.dataset.id, btn); };
    });
  },

  closeMenu(){
    this.menuOpen = false;
    document.getElementById("menu").classList.add("hidden");
    this._menuClick = null;
  },

  /* ---------------- 풀스크린 ---------------- */
  showScreen(html){
    const s = document.getElementById("screen");
    s.classList.remove("title-bg");   // 타이틀 전용 배경 해제(게임오버 등 다른 화면)
    s.innerHTML = html; s.classList.remove("hidden");
  },
  hideScreen(){ document.getElementById("screen").classList.add("hidden"); },

  /* ---------------- 키 핸들 ---------------- */
  // true 반환 시 입력 소비됨
  handleKey(e){
    if (this.dialogueOpen){
      const d = this._dlg;
      if (d.choices && d.idx >= d.pages.length-1){
        if (e.key === "ArrowDown"){ d.sel = (d.sel+1)%d.choices.length; this._renderDialogue(); return true; }
        if (e.key === "ArrowUp"){ d.sel = (d.sel-1+d.choices.length)%d.choices.length; this._renderDialogue(); return true; }
        if (/^[1-9]$/.test(e.key)){ const i=+e.key-1; if (i<d.choices.length){ this._pickChoice(i); return true; } }
        if (e.key === "Enter" || e.key === " "){ this._pickChoice(d.sel); return true; }
        if (e.key === "Escape"){ this._closeDialogue(); return true; }
        return true;
      }
      if (e.key === " " || e.key === "Enter" || e.key === "Escape"){ this._advanceDialogue(); return true; }
      return true;
    }
    if (this.menuOpen){
      if (e.key === "Escape"){ this.closeMenu(); return true; }
      return true; // 메뉴 중 월드 입력 차단
    }
    return false;
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const c = document.getElementById("menu-close");
  if (c) c.onclick = () => UI.closeMenu();
});
