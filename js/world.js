/* =========================================================================
 * 월드 — 오버월드 (씬: "world")
 *  이동/충돌 · 구역 전환 · 산 약초노드 & 몬스터 심볼 · 상호작용 · 인벤토리
 * ======================================================================= */
const World = {
  zone:"house",
  nodes:[],     // 산 채집 노드
  symbols:[],   // 산 몬스터 심볼
  near:null,    // 현재 상호작용 가능한 대상
  hoe:null,     // 진행 중인 호미질 {kind,target,need,hits}
  cam:{x:0,y:0},// 카메라(확장 맵에서 플레이어 추적)
  HALF:12,
  pet:{ x:0, y:0, animT:0, blinkT:0 },
  particles:[],
  _stepT:0, _blinkT:3,

  mtn:{},       // 산 구역별 컨텐츠 캐시 { mtnN:{nodes,symbols,day} }

  start(){
    World.zone="house";
    World.mtn={};
    World.placeAtSpawn();
    World.particles=[];
    if (P.pet) World.initPet();
  },

  initPet(){ World.pet.x=P.x; World.pet.y=P.y; },

  placeAtSpawn(){
    if (!Maps[World.zone]) World.zone="house"; // 구버전 세이브 방어
    const sp = Maps[World.zone].spawn;
    P.x = sp.tx*TILE + TILE/2; P.y = sp.ty*TILE + TILE/2;
    World._bindZoneContent();
  },

  changeZone(to, sx, sy){
    World.zone = to;
    P.x = sx*TILE + TILE/2; P.y = sy*TILE + TILE/2;
    World._bindZoneContent();
    toast("➡ " + Maps[to].name, "");
    Sound.forScene();
    UI.refreshHUD();
  },

  onNewDay(){ World.mtn={}; World._bindZoneContent(); },

  // 현재 구역이 산이면 컨텐츠 보장 후 nodes/symbols 연결
  _bindZoneContent(){
    const z=World.zone;
    if (DATA.isMtn(z)){
      if (!World.mtn[z] || World.mtn[z].day!==G.time.day) World._spawnZone(z);
      World.nodes = World.mtn[z].nodes;
      World.symbols = World.mtn[z].symbols;
    } else { World.nodes=[]; World.symbols=[]; }
  },

  // 산 한 구역의 채집 노드/몬스터 생성
  _spawnZone(z){
    const meta = DATA.zoneMeta(z); const grid = Maps[z].grid;
    const cols=Maps.colsOf(z), rows=Maps.rowsOf(z);
    const walk=[];
    for(let y=1;y<rows-1;y++) for(let x=1;x<cols-1;x++){
      if(!Maps.isSolidTile(z,x,y) && grid[y][x]===".") walk.push([x,y]);
    }
    const pick=()=>{ const i=randInt(0,walk.length-1); return walk.splice(i,1)[0]; };
    const nodes=[], symbols=[];
    if (meta.tier>0){
      const nNodes=randInt(9,12);   // 맵 1.5배 확장에 맞춰 채집 노드 증가
      for(let i=0;i<nNodes && walk.length;i++){
        const t=pick(); let tier=meta.tier; if(chance(0.3)) tier=clamp(tier+choice([-1,1]),1,3);
        nodes.push({ x:t[0]*TILE+TILE/2, y:t[1]*TILE+TILE/2, tier });
      }
    }
    // 요괴 스폰 1.5배 상향
    const [lo,hi]=meta.count;
    const nSym=Math.round(randInt(lo,hi)*1.5);
    for(let i=0;i<nSym && walk.length;i++){
      const t=pick();
      let mid=choice(meta.monsters);
      if (z==="mtn3" && mid==="dueok" && !chance(0.35)) mid="gumiho"; // 두억시니는 드물게
      const m=DATA.MONSTERS[mid]; const grp=[mid];
      if (mid!=="dueok" && chance(0.3)) grp.push(mid);
      symbols.push({ x:t[0]*TILE+TILE/2, y:t[1]*TILE+TILE/2, grp, mid, ic:m.icon,
        detect:m.detect, spd:18*(m.speed||1), aggro:!!m.aggro,
        vx:choice([-1,1])*14, vy:choice([-1,1])*14, cool:0, shake:0 });
    }
    World.mtn[z]={ nodes, symbols, day:G.time.day };
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
      // 호미질 중 이동하면 중단
      if (World.hoe && (P.moving || blocked)) World._cancelHoe();
      if (P.moving){
        if (dx&&dy){ dx*=0.707; dy*=0.707; }
        if (Math.abs(dx)>Math.abs(dy)) P.dir = dx<0?"left":"right";
        else P.dir = dy<0?"up":"down";
        let sp = P.speed * (Player.isSlow()?0.5:1) * Player.speedMult();
        const nx = P.x + dx*sp*dt, ny = P.y + dy*sp*dt;
        if (!Maps.blocked(z, nx, P.y, World.HALF, World.HALF)) P.x=nx;
        if (!Maps.blocked(z, P.x, ny, World.HALF, World.HALF)) P.y=ny;
        P.animT += dt*8;
        World._stepT -= dt;
        if (World._stepT<=0){ Sound.sfx("step"); World._stepT = Player.isSlow()?0.5:0.32; }
      }
      // 가시풀 함정: 새 가시 타일에 들어서면 HP -5
      if (DATA.isMtn(z) && !blocked){
        const ptx=Math.floor(P.x/TILE), pty=Math.floor(P.y/TILE);
        if (Maps.isThornTile(z,ptx,pty)){
          if (World._thornTile !== ptx+","+pty){
            World._thornTile = ptx+","+pty;
            P.hp = Math.max(1, P.hp-5); Sound.sfx("hit");
            toast("🌵 가시풀에 찔렸다! 체력 -5","bad");
          }
        } else World._thornTile = null;
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

      // 몬스터 심볼: 감지 추격 / 접촉 전투
      if (DATA.isMtn(z) && !blocked){
        World.symbols.forEach(s=>{
          if (s.cool>0) s.cool-=dt;
          const dist=Math.hypot(s.x-P.x, s.y-P.y);
          const detected = s.cool<=0 && dist <= s.detect*TILE;
          if (detected){
            const dx=P.x-s.x, dy=P.y-s.y, d=dist||1;
            const nx=s.x+dx/d*s.spd*1.35*dt, ny=s.y+dy/d*s.spd*1.35*dt;
            if(!Maps.blocked(z,nx,s.y,10,10)) s.x=nx;
            if(!Maps.blocked(z,s.x,ny,10,10)) s.y=ny;
            s.shake = (s.mid==="dueok") ? 1 : 0;  // 두억시니: 다가올 때 진동
          } else {
            s.x+=s.vx*dt; s.y+=s.vy*dt;
            if (Maps.blocked(z,s.x,s.y,10,10)){ s.x-=s.vx*dt; s.y-=s.vy*dt; if(chance(0.5))s.vx*=-1; else s.vy*=-1; }
            if (chance(0.01)){ s.vx=choice([-1,1])*14; s.vy=choice([-1,1])*14; }
            s.shake=0;
          }
        });
        for(let i=World.symbols.length-1;i>=0;i--){
          const s=World.symbols[i];
          if (Math.hypot(s.x-P.x, s.y-P.y) < 22){
            // 비공격형이고 기력 낮으면 회피 가능 (구미호 등 aggro는 불가)
            if (!s.aggro && Player.isSlow() && chance(0.5)){ toast("기력이 낮아 살금살금 피했다…",""); s.cool=2.5; s.x+=s.vx>0?-50:50; continue; }
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
        if (keyPressed(" ") || keyPressed("e")){ if (World.hoe) World._hoeHit(); else World._interact(); }
        if (keyPressed("i")){ Sound.sfx("blip"); World.openInventory(); }
        if (keyPressed("j")){ Sound.sfx("blip"); Quests.log(); }
      }
    },

    render(ctx){
      const z=World.zone;
      const isMtn = DATA.isMtn(z);
      World._updateCamera();
      const cam = World.cam;
      ctx.save();
      ctx.translate(-Math.round(cam.x), -Math.round(cam.y));   // 카메라 추적
      Maps.drawTiles(ctx,z);
      // 채집 노드
      if (isMtn){
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
      if (isMtn){
        World.symbols.forEach(s=>{
          const jx = s.shake ? randInt(-2,2) : 0, jy = s.shake ? randInt(-2,2) : 0;
          ctx.fillStyle="rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(s.x,s.y+12,12,5,0,0,Math.PI*2); ctx.fill();
          ctx.font="26px serif"; ctx.textAlign="center"; ctx.fillText(s.ic, s.x+jx, s.y+8+jy);
        });
      }
      World._drawPet(ctx);
      World._drawPlayer(ctx);
      World._drawParticles(ctx);
      ctx.restore();   // 카메라 해제 → 이하 화면 고정 UI

      // 구역 분위기 (틴트 / 안개) — 화면 전체
      const meta = DATA.zoneMeta(z);
      if (meta){
        if (meta.tint){ ctx.fillStyle=meta.tint; ctx.fillRect(0,0,G.W,G.H); }
        if (meta.fog){ World._drawFog(ctx); }
      }

      // 상호작용 하이라이트 (카메라 보정)
      if (World.near && !World.hoe){
        const t=World.near;
        ctx.save();
        ctx.fillStyle="#fff7c0"; ctx.font="bold 16px 'Malgun Gothic'"; ctx.textAlign="center";
        ctx.shadowColor="#000"; ctx.shadowBlur=4;
        ctx.fillText("▼", t.hx-cam.x, t.hy-12-cam.y);
        ctx.restore();
      }
      // 호미질 진행 표시 (카메라 보정)
      if (World.hoe){
        const h=World.hoe;
        const tx=(h.target.x!=null?h.target.x:P.x)-cam.x, ty=(h.target.y!=null?h.target.y:P.y)-cam.y;
        const bw=54, bx=tx-bw/2, by=ty-30;
        ctx.save(); ctx.textAlign="center";
        ctx.fillStyle="#000a"; ctx.fillRect(bx-2,by-14,bw+4,22);
        ctx.fillStyle="#3a2c1a"; ctx.fillRect(bx,by,bw,7);
        ctx.fillStyle="#e7c66b"; ctx.fillRect(bx,by,bw*clamp(h.hits/h.need,0,1),7);
        ctx.fillStyle="#fff7c0"; ctx.font="bold 11px 'Malgun Gothic'"; ctx.fillText(`⛏️ ${h.hits}/${h.need}`, tx, by-3);
        ctx.restore();
      }
      World._drawQuestTracker(ctx);
      // 힌트 바
      World._hint();
    },

    key(e){},
    click(x,y){
      // 대화/메뉴 중에는 무시 (닫는 클릭이 상호작용을 다시 열지 않도록)
      if (UI.dialogueOpen || UI.menuOpen) return;
      // 클릭으로도 가까운 대상 상호작용
      if (World.near){ World._interact(); }
    },
  },

  _drawPlayer(ctx){
    const action = World.hoe ? "gather" : null;   // 호미질 중엔 채집 애니메이션
    World.drawDallae(ctx, P.x, P.y, { dir:P.dir, moving:P.moving, action, blink:P._blink>0, hold: action?"none":"basket", scale:0.76 });
  },

  // 달래 렌더 — 기획서 스프라이트 시트 우선, 미로드 시 벡터 폴백
  //  o: { dir, moving, blink, hold, weaponId, scale, frame }
  drawDallae(ctx, x, y, o){
    o = o || {}; const dir = o.dir || "down";
    if (Sprites.ready){
      // 그림자
      const sc = o.scale || 1;
      ctx.fillStyle="rgba(0,0,0,0.26)"; ctx.beginPath(); ctx.ellipse(x, y+15, 12*sc, 5*sc, 0,0,Math.PI*2); ctx.fill();
      const nm = o.frame || (o.action ? Sprites.frameForAction(o.action, dir, o.moving, P.animT) : Sprites.frameFor(dir, o.moving, P.animT));
      const targetH = 54 * sc;
      const footY = y + 19*sc;
      if (Sprites.drawFrame(ctx, nm, x, footY, targetH, !!o.flip)) return;
    }
    World._drawDallaeVector(ctx, x, y, o);
  },

  // (폴백) 벡터 드로잉
  _drawDallaeVector(ctx, x, y, o){
    o = o || {}; const dir = o.dir || "down";
    const s = o.scale || 1;
    const t = performance.now();
    const bob = o.moving ? Math.abs(Math.sin(P.animT))*2.5*s : Math.sin(t/600)*0.8*s;
    const yy = y - bob;
    const top = Player.costumeData().color || "#f2c531";                    // 저고리(노랑 기본)
    const skirtCol = P.costume==="silk" ? "#c0577e" : P.costume==="ramie" ? "#6fae54" : "#d23b35"; // 치마(빨강 기본)
    const HAIR="#6e4a2a", SKIN="#fbe0bd";
    const legSwing = o.moving ? Math.sin(P.animT)*2 : 0;
    ctx.save();
    if (s!==1){ ctx.translate(x,yy); ctx.scale(s,s); ctx.translate(-x,-yy); }

    // 그림자
    ctx.fillStyle="rgba(0,0,0,0.28)"; ctx.beginPath(); ctx.ellipse(x,y+15,12,5,0,0,Math.PI*2); ctx.fill();
    // 등 뒤로 흘러내린 긴 머리 (몸보다 먼저)
    ctx.fillStyle=HAIR;
    if (dir==="up") ctx.fillRect(x-5, yy-6, 10, 21);
    else ctx.fillRect(x-3, yy-3, 6, 13);
    // 버선 발
    ctx.fillStyle="#f3efe6"; ctx.fillRect(x-5+legSwing*0.4, yy+15, 4, 4); ctx.fillRect(x+1-legSwing*0.4, yy+15, 4, 4);
    // 치마(빨강)
    ctx.fillStyle=skirtCol; ctx.beginPath();
    ctx.moveTo(x-7, yy+7); ctx.lineTo(x+7, yy+7); ctx.lineTo(x+11, yy+16); ctx.lineTo(x-11, yy+16); ctx.closePath(); ctx.fill();
    ctx.fillStyle="rgba(0,0,0,0.10)"; ctx.fillRect(x-1, yy+8, 2, 8);
    // 저고리(노랑)
    ctx.fillStyle=top; ctx.beginPath(); ctx.roundRect?ctx.roundRect(x-9,yy+1,18,9,5):ctx.rect(x-9,yy+1,18,9); ctx.fill();
    // 깃·고름(빨강)
    ctx.fillStyle="#c0392b"; ctx.fillRect(x-1, yy+2, 2, 8);
    ctx.fillStyle="#e0503a"; ctx.fillRect(x-3, yy+3, 6, 2);
    // 소매(노랑) + 흰 끝동
    ctx.fillStyle=top; ctx.fillRect(x-11, yy+2, 4, 6); ctx.fillRect(x+7, yy+2, 4, 6);
    ctx.fillStyle="#f3efe6"; ctx.fillRect(x-11, yy+7, 4, 2); ctx.fillRect(x+7, yy+7, 4, 2);

    // ===== 머리 (갈색, 중앙 가르마) =====
    ctx.fillStyle=HAIR; ctx.beginPath(); ctx.arc(x, yy-8, 10, 0, Math.PI*2); ctx.fill();
    const blink=o.blink, eyeY=yy-5;
    const eye=(ex)=>{ ctx.fillStyle="#3a2418"; if(blink){ ctx.fillRect(ex-1.5,eyeY,3,1.2);} else { ctx.beginPath(); ctx.arc(ex,eyeY,1.9,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.fillRect(ex-0.5,eyeY-1,1.1,1.1);} };
    const cheek=(cx2)=>{ ctx.fillStyle="#f5a9a0"; ctx.beginPath(); ctx.arc(cx2,yy-2,1.7,0,Math.PI*2); ctx.fill(); };

    if (dir==="up"){
      // 뒤통수: 머리 바탕만 (얼굴 없음)
    } else if (dir==="left" || dir==="right"){
      const sgn = dir==="left"?-1:1;
      ctx.fillStyle=SKIN; ctx.beginPath(); ctx.ellipse(x+sgn*2, yy-5, 8, 8, 0, 0, Math.PI*2); ctx.fill();
      // 옆 가르마 + 앞쪽 옆머리 한 갈래
      ctx.fillStyle=HAIR; ctx.beginPath(); ctx.arc(x, yy-8, 10, Math.PI*1.05, Math.PI*1.95); ctx.fill();
      ctx.fillRect(x-2, yy-10, 4, 4);
      ctx.fillRect(x+sgn*7, yy-7, 3, 11);
      eye(x+sgn*4); cheek(x+sgn*6);
    } else {
      // 정면: 얼굴 + 중앙 가르마 앞머리(좌/우 두 덩이) + 양옆 머리 갈래
      ctx.fillStyle=SKIN; ctx.beginPath(); ctx.ellipse(x, yy-5, 8.5, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle=HAIR;
      ctx.beginPath(); ctx.moveTo(x-10,yy-9); ctx.quadraticCurveTo(x-1,yy-12,x-0.6,yy-7); ctx.quadraticCurveTo(x-6,yy-8,x-10,yy-4.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x+10,yy-9); ctx.quadraticCurveTo(x+1,yy-12,x+0.6,yy-7); ctx.quadraticCurveTo(x+6,yy-8,x+10,yy-4.5); ctx.closePath(); ctx.fill();
      ctx.fillRect(x-10, yy-7, 3, 11); ctx.fillRect(x+7, yy-7, 3, 11);   // 양옆 머리(얼굴 감싸기)
      eye(x-4); eye(x+4); cheek(x-6); cheek(x+6);
      ctx.strokeStyle="#c0392b"; ctx.lineWidth=1.1; ctx.beginPath(); ctx.arc(x,yy-1.5,1.6,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
    }

    // ===== 손에 든 것 =====
    if (o.hold === "basket"){
      const bx = x + (dir==="left"?-7:dir==="right"?7:0), by = yy+9;
      ctx.fillStyle="#4a8a3a"; ctx.beginPath(); ctx.ellipse(bx-3,by-2,3,4,-0.4,0,Math.PI*2); ctx.ellipse(bx+3,by-2,3,4,0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#6fbf4a"; ctx.beginPath(); ctx.ellipse(bx,by-4,3,4,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#a9742f"; ctx.beginPath(); ctx.moveTo(bx-8,by); ctx.lineTo(bx+8,by); ctx.lineTo(bx+6,by+7); ctx.lineTo(bx-6,by+7); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="#7c531f"; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(bx-7,by+2); ctx.lineTo(bx+7,by+2); ctx.moveTo(bx-7,by+4.5); ctx.lineTo(bx+7,by+4.5); ctx.stroke();
      ctx.fillStyle="#c08a3e"; ctx.fillRect(bx-9,by-1,18,2);
      ctx.strokeStyle="#7c531f"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(bx,by, 8, Math.PI*1.08, Math.PI*1.92); ctx.stroke();
    } else if (o.hold === "weapon"){
      const wid = o.weaponId || P.weapon;
      const hand = dir==="left" ? {hx:x-11, hy:yy+4} : dir==="right" ? {hx:x+11, hy:yy+4}
                 : dir==="up" ? {hx:x-10, hy:yy+3} : {hx:x+10, hy:yy+5};
      ctx.fillStyle=SKIN; ctx.beginPath(); ctx.arc(hand.hx, hand.hy, 2.3, 0, Math.PI*2); ctx.fill();
      if (wid==="natt") World._drawSickle(ctx, hand.hx, hand.hy);
      else { ctx.font="16px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(DATA.WEAPONS[wid].icon, hand.hx+(dir==="left"?-6:dir==="right"?6:0), hand.hy-6); ctx.textBaseline="alphabetic"; }
    }
    ctx.restore();
  },

  // 낫(sickle) — 자루 + 곡선 날 (어깨 위로 든 모습)
  _drawSickle(ctx, hx, hy){
    ctx.save();
    ctx.lineCap="round";
    ctx.strokeStyle="#8a5a2a"; ctx.lineWidth=2.4;                 // 나무 자루
    ctx.beginPath(); ctx.moveTo(hx, hy+2); ctx.lineTo(hx, hy-15); ctx.stroke();
    ctx.strokeStyle="#cfd3d6"; ctx.lineWidth=2.8;                 // 쇠 날(곡선)
    ctx.beginPath(); ctx.arc(hx-6, hy-15, 7, -0.25, Math.PI*0.95); ctx.stroke();
    ctx.strokeStyle="#eef1f3"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(hx-6, hy-15, 7, -0.1, Math.PI*0.6); ctx.stroke();
    ctx.restore();
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

  /* 화면 좌상단 임무 추적기 (현재 진행 중 의뢰) */
  _drawQuestTracker(ctx){
    const lines = Quests.trackerLines();
    if (!lines.length) return;
    const show = lines.slice(0,4);
    ctx.save();
    ctx.font = "12px 'Malgun Gothic'";
    let w = 150;
    show.forEach(l=>{ const s=`${l.title}  ${l.cur}/${l.total}`; w=Math.max(w, ctx.measureText(s).width+22); });
    const x=10, y=72, h=18*show.length+24;
    ctx.fillStyle="rgba(20,14,8,0.78)"; ctx.fillRect(x,y,w,h);
    ctx.fillStyle="#6b5736"; ctx.fillRect(x,y,w,18);
    ctx.fillStyle="#e7c66b"; ctx.textAlign="left"; ctx.font="bold 12px 'Malgun Gothic'";
    ctx.fillText("📜 의뢰 (J: 일지)", x+8, y+13);
    show.forEach((l,i)=>{
      const ly=y+24+i*18;
      ctx.font="12px 'Malgun Gothic'";
      ctx.fillStyle = l.done ? "#8fe0a0" : "#f3e9d2";
      const mark = l.done ? "✓ " : "• ";
      ctx.fillText(`${mark}${l.title}`, x+8, ly+9);
      ctx.fillStyle = l.done ? "#8fe0a0" : "#cbb892";
      ctx.textAlign="right"; ctx.fillText(`${l.cur}/${l.total}`, x+w-8, ly+9); ctx.textAlign="left";
    });
    if (lines.length>4){ ctx.fillStyle="#9c8a68"; ctx.fillText(`…외 ${lines.length-4}건`, x+8, y+h-4); }
    ctx.restore();
  },

  /* 깊은 숲 안개 — 떠다니는 반투명 덩어리로 시야 방해 */
  _drawFog(ctx){
    const t=performance.now()/1000;
    ctx.save();
    for(let i=0;i<6;i++){
      const x=((i*167 + t*18*(i%2?1:-1))% (G.W+200))-100;
      const y=60 + (i*97 % (G.H-120));
      const r=80+ (i%3)*30;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,"rgba(210,225,220,0.16)"); g.addColorStop(1,"rgba(210,225,220,0)");
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  },

  /* 가까운 상호작용 대상 찾기 (오브젝트/노드/출구) */
  _findNear(){
    const z=World.zone; const R=TILE*1.35;
    let best=null, bestD=R;
    // 오브젝트 — 사각형과의 최단거리(큰 건물도 문 앞에서 인식)
    for(const o of Maps[z].objects){
      if (!o.action && o.type !== "plot") continue;
      if (o.marketOnly && !Time.isMarketDay()) continue;  // 장날 게스트는 장날에만 상호작용
      const ox=o.tx*TILE, oy=o.ty*TILE, ow=(o.w||1)*TILE, oh=(o.h||1)*TILE;
      const dx=Math.max(ox-P.x, 0, P.x-(ox+ow));
      const dy=Math.max(oy-P.y, 0, P.y-(oy+oh));
      const d=Math.hypot(dx,dy);
      if (d<bestD){ bestD=d; best={ kind:"obj", o, hx:ox+ow/2, hy:(o.type==="bldg"?oy+oh:oy),
        hint: World._objHint(o) }; }
    }
    // 채집 노드
    if (DATA.isMtn(z)){
      for(const nd of World.nodes){
        const d=Math.hypot(nd.x-P.x, nd.y-P.y);
        if (d<bestD){ bestD=d;
          const need=Farming.hoeHitsFor(nd.tier);
          const hint = need===null
            ? `🌿 명품 약초 — 호미 부족 (대장간에서 벼리기)`
            : `🌿 호미질 ${need}회 채집 (등급${nd.tier}·기력${Farming.staminaFor(nd.tier)})`;
          best={ kind:"node", nd, hx:nd.x, hy:nd.y, hint }; }
      }
    }
    return best;
  },

  _objHint(o){
    if (o.action==="sleep") return "🏠 집 (잠자기/저장)";
    if (o.action==="enter"){ const b=DATA.BUILDINGS[o.bldg]; return `🚪 ${b?b.name:"건물"} 들어가기`; }
    if (o.action==="exit_interior") return "🚪 나가기";
    if (o.action==="npc") return `${DATA.NPCS[o.npc].icon} ${DATA.NPCS[o.npc].name}와 대화`;
    if (o.action==="market") return Maps.stallActive()?"🪧 장터 좌판":"🪧 장터(장날 오전만)";
    if (o.action==="sign_house"||o.action==="sign_mtn") return "📖 안내판 읽기";
    if (o.action==="shrine") return "🌳 당나무 제단 (신통력 해금)";
    if (o.action==="altar") return "⛩️ 산정 제단 살펴보기";
    if (o.type==="plot"){ const p=Farming.plotState(o.plot);
      return p.state==="empty"?"🌰 메밀 심기":p.state==="ready"?`🌾 메밀 수확 (호미질 ${Farming.harvestHits()}회)`:"🌱 자라는 중"; }
    return "조사";
  },

  _interact(){
    const t=World.near; if(!t) return;
    if (t.kind==="node"){
      const need = Farming.hoeHitsFor(t.nd.tier);
      if (need===null){ Sound.sfx("error"); toast("이 명품 약초는 기본 호미로 캘 수 없다. 대장간에서 호미를 벼리자!","bad"); return; }
      const cost = Farming.staminaFor(t.nd.tier);
      if (!Player.hasStamina(cost)){ toast(`기력이 부족하다 (${cost} 필요)`,"bad"); return; }
      World._startHoe("gather", t.nd, need);
      return;
    }
    const o=t.o;
    switch(o.action){
      case "sleep": World._sleepMenu(); break;
      case "enter": Interior.enter(o.bldg, Math.floor(P.x/TILE), Math.floor(P.y/TILE)); break;
      case "exit_interior": Interior.exit(); break;
      case "npc": NPC.interact(o.npc); break;
      case "market": NPC.market(); break;
      case "sign_house": UI.startDialogue("📖 안내판",[
        "여기는 내 집. 문 앞에서 잠을 자면 다음 날이 되고 기력이 회복된다.",
        "마당의 밭에 <b>메밀 종자</b>를 심으면 4일 뒤 수확할 수 있다.",
        "오른쪽으로 나가면 <b>마을</b>이다."]); break;
      case "sign_mtn": UI.startDialogue("📖 산 표석",[
        "산은 네 구역으로 나뉜다 — <b>입구(도깨비) → 중턱(물귀신) → 깊은 숲(구미호·두억시니) → 정상</b>.",
        "안쪽으로 갈수록 약초 등급도, 요괴도 강해진다. 요괴는 멀리서도 너를 감지해 쫓아온다!",
        "패하면 약초 절반과 시간을 잃으니 조심. 요괴 부산물(공물)은 <b>당나무 제단</b>에 바쳐 신통력을 얻어라."]); break;
      case "shrine": Shrine.open(); break;
      case "altar":
        if (Quests.isActive("q_truth") && !G.flags.altarSeen){
          G.flags.altarSeen = true;
          Sound.sfx("fanfare");
          UI.startDialogue("⛩️ 산정 제단 — 환영", [
            "제단에 손을 얹자, 차가운 바람이 휘몰아치며 눈앞이 하얘진다…",
            "환영 속 — 고귀한 무당과 임금의 모습이 스친다. 「달래야… 너는 영(靈)을 보는 아이.」",
            "버려졌던 핏덩이, 달래꽃 머리핀에 깃든 <b>신내림의 운명</b>이 비로소 깨어난다.",
            "(가슴 깊은 곳에서 신력이 차오른다. 무당에게 돌아가 이야기를 듣자.)"
          ], { onEnd(){ Quests.notify("altar",{}); } });
        } else if (G.flags.altarSeen){
          UI.startDialogue("⛩️ 산정 제단", ["고요한 제단. 달래는 자신의 신력이 한층 깊어진 것을 느낀다."]);
        } else {
          UI.startDialogue("⛩️ 산정 제단",[
            "산 정상의 오래된 제단. 차가운 바람이 분다.",
            "달래는 까닭 모를 익숙함을 느낀다… 마치 누군가 자신을 부르는 듯한.",
            "(두억시니를 물리치고 무당의 의뢰를 받으면, 잠든 비밀이 깨어날지도.)"]);
        }
        break;
      default:
        if (o.type==="plot"){
          const p=Farming.plotState(o.plot);
          if (p.state==="ready"){
            if (!Player.hasStamina(DATA.BUCKWHEAT.harvestStamina)){ toast("기력이 부족하다","bad"); return; }
            World._startHoe("harvest", o, Farming.harvestHits());
          } else {
            Farming.interactPlot(o.plot);  // 빈 밭=심기 / 성장중=안내
          }
        }
    }
  },

  /* ---- 호미질(다단계 입력) #9/#10 ---- */
  _startHoe(kind, target, need){
    World.hoe = { kind, target, need, hits:0 };
    World._hoeHit();   // 시작 입력이 곧 첫 호미질
  },
  _hoeHit(){
    const h=World.hoe; if(!h) return;
    h.hits++;
    Sound.sfx("gather");
    if (h.hits >= h.need) World._finishHoe();
  },
  _finishHoe(){
    const h=World.hoe; World.hoe=null;
    if (h.kind==="gather"){
      if (Farming.gather(h.target)){ const i=World.nodes.indexOf(h.target); if(i>=0)World.nodes.splice(i,1); }
    } else if (h.kind==="harvest"){
      Farming.interactPlot(h.target.plot);
    }
  },
  _cancelHoe(){ if(!World.hoe) return; World.hoe=null; toast("호미질을 멈췄다",""); },

  // 카메라: 플레이어 중심, 맵 경계로 클램프(맵이 화면보다 작으면 중앙 고정)
  _updateCamera(){
    const z=World.zone;
    const mapW=Maps.colsOf(z)*TILE, mapH=Maps.rowsOf(z)*TILE;
    let cx=P.x-G.W/2, cy=P.y-G.H/2;
    World.cam.x = mapW<=G.W ? (mapW-G.W)/2 : clamp(cx,0,mapW-G.W);
    World.cam.y = mapH<=G.H ? (mapH-G.H)/2 : clamp(cy,0,mapH-G.H);
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
    const w=Player.weaponData(), cs=Player.costumeData(), ac=Player.accessoryData();
    let html = `<p class="note">Lv.${P.level} (경험치 ${P.exp}/${P.level*25}) · 체력 ${Math.ceil(P.hp)}/${P.maxHp} · 신력 ${P.mp}/${Player.mpCap()} · 기력 ${Math.ceil(P.stamina)}/100</p>`;
    html += `<p class="note">🗡 무기 ${w.icon}${w.name}(공${w.atk}, 강화+${P.weaponLv}) · 👘 의상 ${cs.icon}${cs.name} · 🧿 장신구 ${ac.icon}${ac.name} · 호미 등급 ${P.homiTier}</p>`;
    html += `<p class="note">✨ 신통력 ${P.magic.length?P.magic.map(id=>DATA.MAGIC[id].name).join(", "):"없음 (당나무 제단에서 공물로 해금)"}</p>`;
    html += `<p class="note">🍲 요리 숙련 Lv.${Player.cookLv()} (xp ${P.cookXp}) · 🏅 명성 ${P.fame} · 아는 요리 ${P.recipes.length}가지</p>`;
    html += `<hr style="border-color:#50412a;margin:10px 0">`;

    // 요리책
    const recipeCards = P.recipes.map(id=>{ const r=DATA.RECIPES[id]; if(!r)return"";
      const steps=r.steps.map(s=>DATA.INGREDIENTS[s].icon).join("→");
      return `<div class="item-card"><div class="item-ic" style="background:#33240f">${r.icon}</div>
        <div class="item-meta"><div class="item-name">${r.name} <span class="item-sub">${r.price}냥</span></div>
        <div class="item-sub">${steps}</div></div></div>`; }).join("");
    html += `<h4 style="color:#e7c66b;margin:6px 0">🍲 요리책 (${P.recipes.length})</h4><div class="grid">${recipeCards}</div>`;

    // 재료 (전 종류)
    const mats=[];
    Object.values(DATA.INGREDIENTS).forEach(g=>{ if(g.id==="namul")return; if(Player.count(g.id)>0)
      mats.push(`<div class="item-card"><div class="item-ic" style="background:#33240f">${g.icon}</div><div class="item-meta"><div class="item-name">${g.name}</div><div class="item-sub">×${Player.count(g.id)}</div></div></div>`); });
    if(Player.count("seed")) mats.push(`<div class="item-card"><div class="item-ic" style="background:#33240f">🌰</div><div class="item-meta"><div class="item-name">메밀 종자</div><div class="item-sub">×${Player.count("seed")}</div></div></div>`);
    // 약초
    const herbCards = Player.herbList().map(id=>{ const h=DATA.HERBS[id];
      return `<div class="item-card"><div class="item-ic" style="background:#241a0e">${h.icon}</div>
        <div class="item-meta"><div class="item-name tier${h.tier}">${h.name}</div>
        <div class="item-sub">×${P.inv[id]} · ${h.price}냥 · 등급${h.tier}</div></div></div>`; });

    // 요괴 부산물
    const dropCards = Player.dropList().map(id=>{ const d=DATA.DROPS[id];
      return `<div class="item-card"><div class="item-ic" style="background:#1f2a1f">${d.icon}</div>
        <div class="item-meta"><div class="item-name">${d.name}</div>
        <div class="item-sub">×${P.inv[id]} · 정기 ${d.pts}</div></div></div>`; });

    html += `<h4 style="color:#e7c66b;margin:6px 0">📦 재료</h4><div class="grid">${mats.join("")||'<p class="note">없음</p>'}</div>`;
    html += `<h4 style="color:#e7c66b;margin:12px 0 6px">🌿 약초·나물 (${Player.herbTotal()})</h4><div class="grid">${herbCards.join("")||'<p class="note">없음</p>'}</div>`;
    html += `<h4 style="color:#e7c66b;margin:12px 0 6px">🦴 요괴 부산물 (당산나무 헌납용)</h4><div class="grid">${dropCards.join("")||'<p class="note">없음</p>'}</div>`;
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
