/* =========================================================================
 * main — 부트스트랩 / 타이틀 / 새 게임·이어하기 / 씬 등록
 * ======================================================================= */
const Game = {
  newGame(){
    Sound.resume();
    Player.init();
    Farming.init();
    Quests.init();
    G.time = { day:1, min:0 };
    G.flags = {};
    World.start();
    UI.hideScreen();
    // 오프닝 컷씬 → 월드 복귀 + 첫 메인 퀘스트 자동 수락 (#15)
    Cutscene.play(()=>{
      setScene("world");
      Quests.accept("q_naengi");
      setTimeout(()=>toast("🌿 산 입구로 가서 나물을 캐 보자! (이동: WASD · 채집: Space 연타)","gold"), 350);
    });
  },

  continueGame(){
    Sound.resume();
    if (!Save.load()){ toast("저장된 기록이 없다","bad"); return; }
    Farming.onNewDay();
    World.mtn={};
    World.placeAtSpawn();
    if (P.pet) World.initPet();
    UI.hideScreen();
    setScene("world");
    toast("📂 불러왔다 — " + Time.season() + " " + Time.dayOfSeason() + "일", "good");
  },

  showTitle(){
    setScene("title");
    const hasSave = Save.exists();
    // MAIN.png(제목·버튼 포함 일러스트)를 배경으로 + 그림 속 버튼 위에 투명 클릭 영역
    UI.showScreen(`
      <button class="title-hot" id="btn-new" aria-label="새로 시작"></button>
      <button class="title-hot" id="btn-cont" aria-label="이어하기"></button>
    `);
    document.getElementById("screen").classList.add("title-bg");
    document.getElementById("btn-new").onclick = ()=>{
      if (hasSave && !confirm("새로 시작하면 기존 기록이 사라집니다. 계속할까요?")) return;
      Game.newGame();
    };
    document.getElementById("btn-cont").onclick = ()=> Game.continueGame();
  },

  titleScene:{
    enter(){},
    update(dt){},
    render(ctx){
      const t = performance.now()/1000;
      // 밤하늘 그라데이션
      const g=ctx.createLinearGradient(0,0,0,G.H);
      g.addColorStop(0,"#16213d"); g.addColorStop(0.55,"#243049"); g.addColorStop(1,"#2b1d2f");
      ctx.fillStyle=g; ctx.fillRect(0,0,G.W,G.H);
      // 별 (반짝임)
      for(let i=0;i<60;i++){ const sx=(i*173)%G.W, sy=(i*97)%300;
        const tw=0.35+0.6*Math.abs(Math.sin(t*1.5+i)); ctx.fillStyle=`rgba(255,250,220,${tw*0.7})`; ctx.fillRect(sx,sy,1.6,1.6); }
      // 달 + 달무리
      const mx=648,my=120;
      const mg=ctx.createRadialGradient(mx,my,10,mx,my,120); mg.addColorStop(0,"rgba(245,233,192,0.5)"); mg.addColorStop(1,"rgba(245,233,192,0)");
      ctx.fillStyle=mg; ctx.beginPath(); ctx.arc(mx,my,120,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#f5e9c0"; ctx.beginPath(); ctx.arc(mx,my,46,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#243049"; ctx.beginPath(); ctx.arc(mx+22,my-12,40,0,Math.PI*2); ctx.fill();
      // 흐르는 구름
      ctx.fillStyle="rgba(40,48,73,0.5)";
      for(let i=0;i<4;i++){ const cw=170+i*40, cx=((t*(8+i*4)+i*320)%(G.W+cw))-cw; const cy=78+i*40;
        ctx.beginPath(); ctx.ellipse(cx,cy,cw/2,17,0,0,Math.PI*2); ctx.fill(); }
      // 먼 산 + 옅은 안개
      const hills=[["#33405e",420],["#2a3450",480],["#222a3e",540]];
      hills.forEach(([col,base],hi)=>{
        ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,G.H);
        for(let x=0;x<=G.W;x+=40){ ctx.lineTo(x, base - Math.sin(x*0.01+hi)*40 - ((x*7)%60)); }
        ctx.lineTo(G.W,G.H); ctx.closePath(); ctx.fill();
        ctx.fillStyle=`rgba(180,190,210,${0.05+hi*0.02})`; ctx.fillRect(0, base-8, G.W, 22);
      });
      // 반딧불
      for(let i=0;i<10;i++){ const fx=(i*131%G.W)+Math.sin(t*0.6+i)*26, fy=380+(i*53%180)+Math.cos(t*0.5+i)*16;
        const a=0.4+0.4*Math.sin(t*2+i); ctx.fillStyle=`rgba(200,255,160,${Math.max(0,a)*0.6})`;
        ctx.beginPath(); ctx.arc(fx,fy,1.8,0,Math.PI*2); ctx.fill(); }
      // 비네트
      const vg=ctx.createRadialGradient(G.W/2,G.H/2,G.H*0.4,G.W/2,G.H/2,G.H*0.82);
      vg.addColorStop(0,"rgba(0,0,0,0)"); vg.addColorStop(1,"rgba(0,0,0,0.42)"); ctx.fillStyle=vg; ctx.fillRect(0,0,G.W,G.H);
    },
  },
};

window.addEventListener("load", ()=>{
  G.canvas = document.getElementById("game");
  G.ctx = G.canvas.getContext("2d");
  // 고해상도(레티나) 대응 — 캔버스 글자/그래픽 선명도 개선
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.canvas.width = G.W * dpr;
  G.canvas.height = G.H * dpr;
  G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  G.ctx.imageSmoothingEnabled = false;

  G.scenes = {
    title:   Game.titleScene,
    world:   World.scene,
    trade:   Trading.scene,
    combat:  Combat.scene,
  };

  Sprites.load();
  Player.init();
  Farming.init();
  Quests.init();
  bindInput();
  GM.init();
  MainMenu.init();
  Game.showTitle();

  // 브라우저 자동재생 정책: 첫 입력 시 오디오 시작
  const kick = ()=>{ Sound.resume(); Sound.forScene(); window.removeEventListener("pointerdown",kick); window.removeEventListener("keydown",kick); };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("keydown", kick);

  requestAnimationFrame(loop);
});
