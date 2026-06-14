/* =========================================================================
 * 월드 — 오버월드 (씬: "world")
 *  이동/충돌 · 구역 전환 · 산 약초노드 & 몬스터 심볼 · 상호작용 · 인벤토리
 * ======================================================================= */
const World = {
  zone:"house",
  nodes:[],     // 산 채집 노드
  symbols:[],   // 산 몬스터 심볼
  near:null,    // 현재 상호작용 가능한 대상
  HALF:12,
  pet:{ x:0, y:0, animT:0, blinkT:0 },
  particles:[],
  _stepT:0, _blinkT:3,

  start(){
    World.zone="house";
    World.placeAtSpawn();
    World.spawnMountain();
    World.particles=[];
    if (P.pet) World.initPet();
  },

  initPet(){ World.pet.x=P.x; World.pet.y=P.y; },

  placeAtSpawn(){
    const sp = Maps[World.zone].spawn;
    P.x = sp.tx*TILE + TILE/2; P.y = sp.ty*TILE + TILE/2;
  },

  changeZone(to, sx, sy){
    World.zone = to;
    P.x = sx*TILE + TILE/2; P.y = sy*TILE + TILE/2;
    if (to==="mountain" && World.nodes.length===0 && World.symbols.length===0) World.spawnMountain();
    toast("➡ " + Maps[to].name, "");
    UI.refreshHUD();
  },

  onNewDay(){ World.spawnMountain(); },

  /* 산 컨텐츠 생성 (매일) */
  spawnMountain(){
    World.nodes=[]; World.symbols=[];
    // 걸을 수 있는 풀밭 타일 수집
    const walk=[];
    for(let y=1;y<ROWS-1;y++) for(let x=1;x<COLS-1;x++){
      if(!Maps.isSolidTile("mountain",x,y) && Maps.mountain.grid[y][x]==="." ) walk.push([x,y]);
    }
    const pick=()=>{ const i=randInt(0,walk.length-1); const t=walk.splice(i,1)[0]; return t; };
    // 채집 노드 7~9개 (등급 혼합)
    const nNodes = randInt(7,9);
    for(let i=0;i<nNodes && walk.length;i++){
      const t=pick(); const r=Math.random();
      const tier = r<0.55?1 : r<0.85?2 : 3;
      World.nodes.push({ x:t[0]*TILE+TILE/2, y:t[1]*TILE+TILE/2, tier });
    }
    // 몬스터 심볼 (계절 인카운터)
    const enc = DATA.encountersBySeason[Time.season()];
    const nSym = randInt(3,5);
    for(let i=0;i<nSym && walk.length;i++){
      const t=pick();
      const grp=[];
      const pickEnc = choice(enc);
      const cnt = randInt(pickEnc[1], pickEnc[2]);
      for(let k=0;k<cnt;k++) grp.push(pickEnc[0]);
      // 가끔 한 종 더
      if (chance(0.3)){ const e2=choice(enc); grp.push(e2[0]); }
      World.symbols.push({ x:t[0]*TILE+TILE/2, y:t[1]*TILE+TILE/2, grp,
        vx:choice([-1,1])*22, vy:choice([-1,1])*22, ic:DATA.MONSTERS[grp[0]].icon, cool:0 });
    }
  },

  /* ---------------- 씬 ---------------- */
  scene:{
    enter(){},
    update(dt){
      const z=World.zone;
      // 이동 입력
      let dx=0,dy=0;
      if (G.keys["arrowleft"]||G.keys["a"]) dx-=1;
      if (G.keys["arrowright"]||G.keys["d"]) dx+=1;
      if (G.keys["arrowup"]||G.keys["w"]) dy-=1;
      if (G.keys["arrowdown"]||G.keys["s"]) dy+=1;
      const blocked = UI.dialogueOpen||UI.menuOpen;
      if (blocked){ dx=0; dy=0; }
      P.moving = (dx||dy);
      if (P.moving){
        if (dx&&dy){ dx*=0.707; dy*=0.707; }
        if (Math.abs(dx)>Math.abs(dy)) P.dir = dx<0?"left":"right";
        else P.dir = dy<0?"up":"down";
        let sp = P.speed * (Player.isSlow()?0.5:1);
        const nx = P.x + dx*sp*dt, ny = P.y + dy*sp*dt;
        if (!Maps.blocked(z, nx, P.y, World.HALF, World.HALF)) P.x=nx;
        if (!Maps.blocked(z, P.x, ny, World.HALF, World.HALF)) P.y=ny;
        P.animT += dt*8;
        World._stepT -= dt;
        if (World._stepT<=0){ Sound.sfx("step"); World._stepT = Player.isSlow()?0.5:0.32; }
      }
      // 깜빡임 / 펫 / 파티클
      World._blinkT -= dt; if (World._blinkT<=0){ P._blink=0.12; World._blinkT = 2+Math.random()*3; }
      if (P._blink>0) P._blink-=dt;
      World._updatePet(dt);
      World._updateParticles(dt);

      // 출구
      if (!blocked){
        const ptx=Math.floor(P.x/TILE), pty=Math.floor(P.y/TILE);
        for(const ex of Maps[z].exits){
          if (ex.tx===ptx && ex.ty===pty){ World.changeZone(ex.to, ex.sx, ex.sy); break; }
        }
      }

      // 몬스터 심볼 이동 & 접촉
      if (z==="mountain" && !blocked){
        World.symbols.forEach(s=>{
          if (s.cool>0){ s.cool-=dt; }
          s.x+=s.vx*dt; s.y+=s.vy*dt;
          if (Maps.blocked("mountain",s.x,s.y,10,10)){
            // 되돌리고 방향 전환
            s.x-=s.vx*dt; s.y-=s.vy*dt;
            if (chance(0.5)) s.vx*=-1; else s.vy*=-1;
          }
          if (chance(0.01)){ s.vx=choice([-1,1])*22; s.vy=choice([-1,1])*22; }
        });
        for(let i=World.symbols.length-1;i>=0;i--){
          const s=World.symbols[i];
          if (Math.hypot(s.x-P.x, s.y-P.y) < 22){
            // 기력 낮으면 회피 가능
            if (Player.isSlow() && chance(0.5)){ toast("기력이 낮아 살금살금 피했다…",""); s.cool=2; s.x+=s.vx>0?-40:40; continue; }
            const grp=s.grp; World.symbols.splice(i,1);
            Combat.begin(grp);
            return;
          }
        }
      }

      // 상호작용 대상 탐색
      World.near = World._findNear();

      // 키: 상호작용 / 인벤토리 / 의뢰 / 음소거
      if (keyPressed("m")) Sound.toggleMute();
      if (!blocked){
        if (keyPressed(" ") || keyPressed("e")) World._interact();
        if (keyPressed("i")){ Sound.sfx("blip"); World.openInventory(); }
        if (keyPressed("j")){ Sound.sfx("blip"); Quests.log(); }
      }
    },

    render(ctx){
      const z=World.zone;
      Maps.drawTiles(ctx,z);
      // 채집 노드
      if (z==="mountain"){
        World.nodes.forEach(nd=>{
          const tcol = nd.tier===3?"#ffd27a":nd.tier===2?"#9ad0ff":"#bfece0";
          ctx.fillStyle="rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(nd.x,nd.y+10,14,6,0,0,Math.PI*2); ctx.fill();
          ctx.font="22px serif"; ctx.textAlign="center";
          ctx.fillText(nd.tier===3?"🌟":nd.tier===2?"✨":"🌿", nd.x, nd.y+6);
          ctx.fillStyle=tcol; ctx.font="9px monospace"; ctx.fillText("●".repeat(nd.tier), nd.x, nd.y+18);
        });
      }
      Maps.drawObjects(ctx,z);
      // 몬스터 심볼
      if (z==="mountain"){
        World.symbols.forEach(s=>{
          ctx.fillStyle="rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(s.x,s.y+12,12,5,0,0,Math.PI*2); ctx.fill();
          ctx.font="26px serif"; ctx.textAlign="center"; ctx.fillText(s.ic, s.x, s.y+8);
        });
      }
      World._drawPet(ctx);
      World._drawPlayer(ctx);
      World._drawParticles(ctx);

      // 상호작용 하이라이트 & 힌트
      if (World.near){
        const t=World.near;
        ctx.save();
        ctx.fillStyle="#fff7c0"; ctx.font="bold 16px 'Malgun Gothic'"; ctx.textAlign="center";
        ctx.shadowColor="#000"; ctx.shadowBlur=4;
        ctx.fillText("▼", t.hx, t.hy-14 + Math.sin(P.animT*0.6+performance.now()/250)*3);
        ctx.restore();
      }
      // 힌트 바
      World._hint();
    },

    key(e){},
    click(x,y){
      // 클릭으로도 가까운 대상 상호작용
      if (World.near){ World._interact(); }
    },
  },

  // 귀여운 치비 캐릭터 (큰 머리, 또렷한 눈, 발그레 볼)
  _drawPlayer(ctx){
    const x=P.x, y=P.y;
    const bob = P.moving ? Math.abs(Math.sin(P.animT))*2.5 : Math.sin(performance.now()/600)*0.8;
    const yy = y - bob;
    // 그림자
    ctx.fillStyle="rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(x,y+15,12,5,0,0,Math.PI*2); ctx.fill();
    // 다리
    const legSwing = P.moving ? Math.sin(P.animT)*3 : 0;
    ctx.fillStyle="#6b7785";
    ctx.fillRect(x-6, yy+8, 5, 8+legSwing*0.3); ctx.fillRect(x+1, yy+8, 5, 8-legSwing*0.3);
    // 신
    ctx.fillStyle="#3a2a1a"; ctx.fillRect(x-7, yy+15, 6, 3); ctx.fillRect(x+1, yy+15, 6, 3);
    // 저고리(몸) — 둥글게
    ctx.fillStyle="#eef0e6"; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x-9,yy+1,18,11,5):ctx.rect(x-9,yy+1,18,11); ctx.fill();
    // 옷고름(파랑)
    ctx.fillStyle="#5a86c8"; ctx.fillRect(x-1, yy+1, 3, 9);
    ctx.fillStyle="#d65a7a"; ctx.fillRect(x-1, yy+4, 6, 2);
    // 팔
    ctx.fillStyle="#eef0e6"; ctx.fillRect(x-11, yy+2, 4, 7); ctx.fillRect(x+7, yy+2, 4, 7);
    // 큰 머리
    ctx.fillStyle="#fbe0bd"; ctx.beginPath(); ctx.arc(x, yy-7, 10, 0, Math.PI*2); ctx.fill();
    // 머리카락 + 상투
    ctx.fillStyle="#3a2414";
    ctx.beginPath(); ctx.arc(x, yy-9, 10, Math.PI*1.05, Math.PI*1.95); ctx.fill();
    ctx.fillRect(x-10, yy-9, 20, 3);
    ctx.beginPath(); ctx.arc(x, yy-17, 3.2, 0, Math.PI*2); ctx.fill(); // 상투
    // 망건 끈
    ctx.fillStyle="#8a5a2a"; ctx.fillRect(x-10, yy-9, 20, 1.5);
    // 얼굴 (방향별)
    const blink = P._blink>0;
    ctx.fillStyle="#2a1a10";
    const eyeY = yy-6;
    function eye(ex){ if(blink){ ctx.fillRect(ex-1.5, eyeY+1, 3, 1.2); } else { ctx.beginPath(); ctx.arc(ex, eyeY, 1.8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.fillRect(ex-0.5, eyeY-1, 1,1); ctx.fillStyle="#2a1a10"; } }
    if (P.dir==="up"){
      // 뒤통수
      ctx.fillStyle="#3a2414"; ctx.beginPath(); ctx.arc(x, yy-7, 9.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle="#3a2414"; ctx.beginPath(); ctx.arc(x, yy-17, 3.2, 0, Math.PI*2); ctx.fill();
    } else if (P.dir==="left"){
      eye(x-4);
      ctx.fillStyle="#f7a8a8"; ctx.beginPath(); ctx.arc(x-6, yy-3, 2, 0, Math.PI*2); ctx.fill(); // 볼
    } else if (P.dir==="right"){
      eye(x+4);
      ctx.fillStyle="#f7a8a8"; ctx.beginPath(); ctx.arc(x+6, yy-3, 2, 0, Math.PI*2); ctx.fill();
    } else {
      eye(x-4); eye(x+4);
      // 발그레 볼
      ctx.fillStyle="#f7a8a8";
      ctx.beginPath(); ctx.arc(x-6, yy-3, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(x+6, yy-3, 2, 0, Math.PI*2); ctx.fill();
      // 입
      ctx.strokeStyle="#b5673a"; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(x, yy-3, 2, 0.15*Math.PI, 0.85*Math.PI); ctx.stroke();
    }
    // 무기 (들고 있는 느낌)
    if (P.dir!=="up"){
      ctx.font="14px serif"; ctx.textAlign="center";
      ctx.fillText(DATA.WEAPONS[P.weapon].icon, x+(P.dir==="left"?-13:13), yy+6);
    }
  },

  /* ---- 펫 ---- */
  _updatePet(dt){
    if (!P.pet) return;
    const pt=World.pet;
    const dx=P.x-pt.x, dy=P.y-pt.y, d=Math.hypot(dx,dy);
    if (d>34){ pt.x+=dx/d*Math.min(d-30, 150*dt); pt.y+=dy/d*Math.min(d-30,150*dt); pt.animT+=dt*9; }
    pt.blinkT-=dt; if(pt.blinkT<=0){ pt._blink=0.12; pt.blinkT=2+Math.random()*3; }
    if(pt._blink>0) pt._blink-=dt;
  },
  _drawPet(ctx){
    if (!P.pet) return;
    const pt=World.pet, x=pt.x, y=pt.y;
    const bob=Math.abs(Math.sin(pt.animT))*2;
    ctx.fillStyle="rgba(0,0,0,0.25)"; ctx.beginPath(); ctx.ellipse(x,y+9,7,3,0,0,Math.PI*2); ctx.fill();
    // 다람쥐 몸
    ctx.fillStyle="#b5703a"; ctx.beginPath(); ctx.arc(x, y-bob, 7, 0, Math.PI*2); ctx.fill();
    // 꼬리
    ctx.fillStyle="#cd8a4e"; ctx.beginPath(); ctx.ellipse(x-8, y-3-bob, 4, 7, 0.5, 0, Math.PI*2); ctx.fill();
    // 귀
    ctx.fillStyle="#8a5430"; ctx.beginPath(); ctx.arc(x-3,y-7-bob,2,0,Math.PI*2); ctx.arc(x+3,y-7-bob,2,0,Math.PI*2); ctx.fill();
    // 눈
    ctx.fillStyle="#1a0f08";
    if(pt._blink>0){ ctx.fillRect(x-4,y-2-bob,2,1); ctx.fillRect(x+2,y-2-bob,2,1); }
    else { ctx.beginPath(); ctx.arc(x-3,y-2-bob,1.4,0,Math.PI*2); ctx.arc(x+3,y-2-bob,1.4,0,Math.PI*2); ctx.fill(); }
    // 볼
    ctx.fillStyle="rgba(247,150,150,.7)"; ctx.beginPath(); ctx.arc(x-5,y+0-bob,1.3,0,Math.PI*2); ctx.arc(x+5,y+0-bob,1.3,0,Math.PI*2); ctx.fill();
  },

  /* ---- 계절 파티클 ---- */
  _updateParticles(dt){
    const season=Time.season();
    const max = season==="겨울"?34 : season==="봄"?26 : season==="가을"?24 : 10;
    if (World.particles.length<max && Math.random()<0.5){
      World.particles.push({ x:Math.random()*G.W, y:-10, vx:(Math.random()-0.5)*20, vy:18+Math.random()*22,
        r:2+Math.random()*3, rot:Math.random()*6, vr:(Math.random()-0.5)*3, sway:Math.random()*6 });
    }
    World.particles.forEach(p=>{ p.x+=p.vx*dt+Math.sin(p.y/30+p.sway)*8*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt; });
    World.particles = World.particles.filter(p=>p.y<G.H+12);
  },
  _drawParticles(ctx){
    const season=Time.season();
    const col = season==="겨울"?"#ffffff" : season==="봄"?"#ffc7e0" : season==="가을"?"#e08a3a" : "#cdeeae";
    World.particles.forEach(p=>{
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.globalAlpha=0.85;
      ctx.fillStyle=col;
      if (season==="겨울"){ ctx.beginPath(); ctx.arc(0,0,p.r*0.6,0,Math.PI*2); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(0,0,p.r,p.r*0.5,0,0,Math.PI*2); ctx.fill(); }
      ctx.restore();
    });
    ctx.globalAlpha=1;
  },

  /* 가까운 상호작용 대상 찾기 (오브젝트/노드/출구) */
  _findNear(){
    const z=World.zone; const R=TILE*1.1;
    let best=null, bestD=R;
    // 오브젝트
    for(const o of Maps[z].objects){
      if (!o.action) continue;
      const cx=(o.tx+ (o.w||1)/2)*TILE, cy=(o.ty+(o.h||1)/2)*TILE;
      const d=Math.hypot(cx-P.x, cy-P.y);
      if (d<bestD){ bestD=d; best={ kind:"obj", o, hx:cx, hy:o.ty*TILE,
        hint: World._objHint(o) }; }
    }
    // 채집 노드
    if (z==="mountain"){
      for(const nd of World.nodes){
        const d=Math.hypot(nd.x-P.x, nd.y-P.y);
        if (d<bestD){ bestD=d; best={ kind:"node", nd, hx:nd.x, hy:nd.y,
          hint:`🌿 채집 (등급${nd.tier} · 기력 ${Farming.staminaFor(nd.tier)})` }; }
      }
    }
    return best;
  },

  _objHint(o){
    if (o.action==="sleep") return "🏠 집 (잠자기/저장)";
    if (o.action==="npc") return `${DATA.NPCS[o.npc].icon} ${DATA.NPCS[o.npc].name}와 대화`;
    if (o.action==="market") return Maps.stallActive()?"🪧 장터 좌판":"🪧 장터(장날 오전만)";
    if (o.action==="sign_house"||o.action==="sign_mtn") return "📖 안내판 읽기";
    if (o.type==="plot"){ const p=Farming.plotState(o.plot);
      return p.state==="empty"?"🌰 메밀 심기":p.state==="ready"?"🌾 메밀 수확":"🌱 자라는 중"; }
    return "조사";
  },

  _interact(){
    const t=World.near; if(!t) return;
    if (t.kind==="node"){
      if (Farming.gather(t.nd)){ const i=World.nodes.indexOf(t.nd); if(i>=0)World.nodes.splice(i,1); }
      return;
    }
    const o=t.o;
    switch(o.action){
      case "sleep": World._sleepMenu(); break;
      case "npc": NPC.interact(o.npc); break;
      case "market": NPC.market(); break;
      case "sign_house": UI.startDialogue("📖 안내판",[
        "여기는 내 집. 문 앞에서 잠을 자면 다음 날이 되고 기력이 회복된다.",
        "마당의 밭에 <b>메밀 종자</b>를 심으면 4일 뒤 수확할 수 있다.",
        "오른쪽으로 나가면 <b>마을</b>이다."]); break;
      case "sign_mtn": UI.startDialogue("📖 산 입구 표석",[
        "산에는 계절마다 다른 약초가 돋아난다. 빛나는 표식(🌿✨🌟)에서 채집하라.",
        "요괴(심볼)와 부딪히면 전투가 벌어진다. 기력이 낮으면 살금살금 피할 수도.",
        "패하면 약초 절반과 시간을 잃으니 조심!"]); break;
      case "market": NPC.market(); break;
      default:
        if (o.type==="plot") Farming.interactPlot(o.plot);
    }
  },

  _sleepMenu(){
    const forced = false;
    UI.startDialogue("내 집 🏠", ["포근한 초가집이다. 어떻게 할까?"], {
      choices:[
        { label:"잠자기 (다음 날 아침으로)", value:"sleep" },
        { label:"저장하기", value:"save" },
        { label:"그만둔다", value:"bye" },
      ],
      onChoice(v){
        if (v==="sleep") sleep(false);
        else if (v==="save"){ const ok=Save.save(); Sound.sfx(ok?"confirm":"error"); toast(ok?"💾 저장 완료":"저장 실패", ok?"good":"bad"); }
      }
    });
  },

  /* ---------------- 인벤토리 ---------------- */
  openInventory(){
    const w=Player.weaponData();
    let html = `<p class="note">Lv.${P.level} (경험치 ${P.exp}/${P.level*25}) · 체력 ${Math.ceil(P.hp)}/${P.maxHp} · 신력 ${P.mp}/${P.maxMp} · 기력 ${Math.ceil(P.stamina)}/100</p>`;
    html += `<p class="note">무기 ${w.icon}${w.name}(공${w.atk}, 강화+${P.weaponLv}) · 호미 등급 ${P.homiTier} · 신통력 ${P.magic.map(id=>DATA.MAGIC[id].name).join(", ")}</p>`;
    html += `<p class="note">정(情) — 무당 ${P.affection.mudang}♥ · 대장장이 ${P.affection.daejang}♥ · 촌장 ${P.affection.chonjang}♥ · 주모 ${P.affection.jumo}♥</p>`;
    html += `<hr style="border-color:#50412a;margin:10px 0">`;

    // 재료
    const mats=[];
    if(Player.count("flour")) mats.push(`<div class="item-card"><div class="item-ic" style="background:#33240f">🌾</div><div class="item-meta"><div class="item-name">메밀가루</div><div class="item-sub">×${Player.count("flour")}</div></div></div>`);
    if(Player.count("season")) mats.push(`<div class="item-card"><div class="item-ic" style="background:#33240f">🥢</div><div class="item-meta"><div class="item-name">양념장</div><div class="item-sub">×${Player.count("season")}</div></div></div>`);
    if(Player.count("seed")) mats.push(`<div class="item-card"><div class="item-ic" style="background:#33240f">🌰</div><div class="item-meta"><div class="item-name">메밀 종자</div><div class="item-sub">×${Player.count("seed")}</div></div></div>`);
    // 약초
    const herbCards = Player.herbList().map(id=>{ const h=DATA.HERBS[id];
      return `<div class="item-card"><div class="item-ic" style="background:#241a0e">${h.icon}</div>
        <div class="item-meta"><div class="item-name tier${h.tier}">${h.name}</div>
        <div class="item-sub">×${P.inv[id]} · ${h.price}냥 · 등급${h.tier}</div></div></div>`; });

    html += `<h4 style="color:#e7c66b;margin:6px 0">📦 재료</h4><div class="grid">${mats.join("")||'<p class="note">없음</p>'}</div>`;
    html += `<h4 style="color:#e7c66b;margin:12px 0 6px">🌿 약초·나물 (${Player.herbTotal()})</h4><div class="grid">${herbCards.join("")||'<p class="note">없음</p>'}</div>`;
    UI.openMenu("📜 봇짐 (인벤토리)", html, null);
  },

  /* 하단 힌트 */
  _hint(){
    let h = `<b>이동</b> WASD · <b>조사</b> Space · <b>봇짐</b> I · <b>의뢰</b> J · <b>소리</b> M`;
    if (World.near) h = `<b>Space</b> ${World.near.hint} &nbsp;|&nbsp; ` + h;
    if (Player.isSlow()) h = `⚠ 기력이 낮아 느리다! · ` + h;
    UI.setHint(h);
  },
};
