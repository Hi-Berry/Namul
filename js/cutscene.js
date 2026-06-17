/* =========================================================================
 * 오프닝 컷씬 (#15) — 전체화면 이미지 + 하단 대사 + 건너뛰기
 *  종료 시 콜백(onDone) 실행 → 월드 복귀 + 첫 메인 퀘스트 자동 수락
 * ======================================================================= */
const Cutscene = {
  scenes:[
    { img:"assets/cut1.png", lines:[
      "내 이름은 달래. 올해로 열다섯 살이다! 오늘부로 그 지긋지긋한 무당집이랑은 절교다!",
      "우리 양엄마는 신기라곤 눈 씻고 찾아봐도 없는 가짜 무당인데, 내가 '엄마, 저기 사람 서 있어' 하고 알려줄 때만 겨우 점을 쳤다." ] },
    { img:"assets/cut1_1.png", lines:[
      "그래놓고 정작 나한테는 복덩이는커녕 식충이라며 맨날 밥도 굶기고 구박만 하니, 내가 치사해서 나온다 나와!" ] },
    { img:"assets/cut2.png", lines:[
      "당장 갈 곳은 없지만, 다행히 산자락 밑에 아무도 안 사는 버려진 주막을 발견했다.",
      "대충 먼지만 털고 잠들었는데… 꿈속에서 또 이상한 걸 보았다.",
      "가끔 꿈에 나타나는, 눈이 부실 정도로 고귀하고 화려한 옷을 입은 사람들의 모습… 내 출생에 무슨 비밀이라도 있는 걸까? 에이, 생각 말자. 당장 내일 먹고살 걱정이나 해야지!" ] },
    { img:"assets/cut3.png", lines:[
      "가출은 했는데 가진 거라곤 이 호미 한 자루랑 그동안 산에서 익힌 나물 지식뿐이네.",
      "그래도 남들보다 눈썰미 하나는 타고났으니 어떻게든 굶어 죽진 않겠지!",
      "이 버려진 주막을 멋지게 고쳐서 맛있는 나물 요리도 팔고, 보란 듯이 떵떵거리며 잘 살아주겠어!" ] },
  ],
  si:0, li:0, onDone:null, el:null, _keyHandler:null,

  play(onDone){
    this.onDone = onDone; this.si = 0; this.li = 0;
    if (this.el) this.el.remove();
    const d = document.createElement("div");
    d.id = "cutscene";
    d.innerHTML = `
      <img id="cs-img" alt="컷씬"/>
      <div id="cs-vig"></div>
      <button id="cs-skip">건너뛰기 ⏭</button>
      <div id="cs-box"><div id="cs-text"></div><div id="cs-cont">▼ 클릭 / 스페이스</div></div>`;
    document.body.appendChild(d);
    this.el = d;
    d.querySelector("#cs-img").onerror = ()=>{ d.querySelector("#cs-img").style.opacity = "0"; }; // 이미지 누락 시 검은 배경
    d.addEventListener("click", (e)=>{ if (e.target.id==="cs-skip"){ Cutscene._finish(); } else { Cutscene._next(); } });
    this._keyHandler = (e)=>{ if (e.key===" "||e.key==="Enter"){ e.preventDefault(); Cutscene._next(); } else if (e.key==="Escape"){ Cutscene._finish(); } };
    window.addEventListener("keydown", this._keyHandler, true);
    this._render();
  },

  _render(){
    const sc = this.scenes[this.si]; if (!sc) return;
    const img = this.el.querySelector("#cs-img");
    const enc = encodeURI(sc.img);
    if (img.getAttribute("data-src") !== enc){ img.style.opacity="1"; img.src = enc; img.setAttribute("data-src", enc); }
    this.el.querySelector("#cs-text").textContent = sc.lines[this.li] || "";
  },

  _next(){
    Sound.sfx("blip");
    const sc = this.scenes[this.si];
    if (this.li < sc.lines.length-1){ this.li++; this._render(); return; }
    if (this.si < this.scenes.length-1){ this.si++; this.li=0; this._render(); return; }
    this._finish();
  },

  _finish(){
    if (this._keyHandler){ window.removeEventListener("keydown", this._keyHandler, true); this._keyHandler=null; }
    if (this.el){ this.el.classList.add("fade-out"); const el=this.el; this.el=null; setTimeout(()=>el.remove(), 450); }
    const cb = this.onDone; this.onDone=null; if (cb) cb();
  },
};
