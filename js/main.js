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
    setScene("world");
    UI.startDialogue("조선 나물전기", [
      "산 너머에서 약초를 캐며 떠돌던 그대는, 작은 마을 어귀의 빈 초가집에 짐을 풀었다.",
      "낮엔 <b>산에서 약초를 캐고</b>, 밭엔 <b>메밀</b>을 기르며,",
      "<b>장날(5·10일)</b>엔 주막에서 <b>메밀전</b>을 팔아 살림을 꾸려보자.",
      "먼저 오른쪽 <b>마을</b>로 나가 사람들을 만나보는 게 좋겠다. (이동: 방향키/WASD)"
    ]);
  },

  continueGame(){
    Sound.resume();
    if (!Save.load()){ toast("저장된 기록이 없다","bad"); return; }
    Farming.onNewDay();
    World.placeAtSpawn();
    World.spawnMountain();
    if (P.pet) World.initPet();
    UI.hideScreen();
    setScene("world");
    toast("📂 불러왔다 — " + Time.season() + " " + Time.dayOfSeason() + "일", "good");
  },

  showTitle(){
    setScene("title");
    const hasSave = Save.exists();
    UI.showScreen(`
      <h1>조선 나물전기</h1>
      <div class="sub">朝鮮 나물傳記 — 약초 경영 RPG</div>
      <button class="big-btn" id="btn-new">🌱 새로 시작</button>
      ${hasSave?'<button class="big-btn alt" id="btn-cont">📂 이어하기</button>':''}
      <p class="tip">
        방향키/WASD 이동 · Space/E 상호작용 · I 봇짐 · 마을의 NPC와 대화하세요.<br>
        하루는 06:00~24:00(실시간 18분), 30일마다 계절이 바뀝니다. 장날은 5·10일!<br>
        산에서 약초를 캐고 요괴와 싸우며, 주막 장사로 큰돈을 벌어보세요.
      </p>
    `);
    document.getElementById("btn-new").onclick = ()=>{
      if (hasSave && !confirm("새로 시작하면 기존 기록이 사라집니다. 계속할까요?")) return;
      Game.newGame();
    };
    const c=document.getElementById("btn-cont");
    if (c) c.onclick = ()=> Game.continueGame();
  },

  titleScene:{
    enter(){},
    update(dt){},
    render(ctx){
      // 밤 산 배경
      const g=ctx.createLinearGradient(0,0,0,G.H);
      g.addColorStop(0,"#1b2740"); g.addColorStop(1,"#2b1d2f");
      ctx.fillStyle=g; ctx.fillRect(0,0,G.W,G.H);
      ctx.fillStyle="#f5e9c0"; ctx.beginPath(); ctx.arc(640,120,46,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#1b2740"; ctx.beginPath(); ctx.arc(660,108,40,0,Math.PI*2); ctx.fill();
      // 먼 산
      const hills=[["#3a3a52",420],["#2f2f44",480],["#262636",540]];
      hills.forEach(([col,base])=>{
        ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(0,G.H);
        for(let x=0;x<=G.W;x+=40){ ctx.lineTo(x, base - Math.sin(x*0.01)*40 - ((x*7)%60)); }
        ctx.lineTo(G.W,G.H); ctx.closePath(); ctx.fill();
      });
    },
  },
};

window.addEventListener("load", ()=>{
  G.canvas = document.getElementById("game");
  G.ctx = G.canvas.getContext("2d");
  G.ctx.imageSmoothingEnabled = false;

  G.scenes = {
    title:   Game.titleScene,
    world:   World.scene,
    trade:   Trading.scene,
    combat:  Combat.scene,
  };

  Player.init();
  Farming.init();
  Quests.init();
  bindInput();
  Game.showTitle();

  // 브라우저 자동재생 정책: 첫 입력 시 오디오 시작
  const kick = ()=>{ Sound.resume(); Sound.forScene(); window.removeEventListener("pointerdown",kick); window.removeEventListener("keydown",kick); };
  window.addEventListener("pointerdown", kick);
  window.addEventListener("keydown", kick);

  requestAnimationFrame(loop);
});
