/* =========================================================================
 * 맵 — 집 / 마을 / 산 (타일 지형 + 상호작용 오브젝트)
 *  타일: . 풀  , 흙길  T 나무(고체)  W 물(고체)  R 바위(고체)  x 가시풀(밟으면 HP-5)
 *  맵 크기는 기본 20×15, 산 구역은 cols/rows로 확장(카메라가 플레이어를 따라감).
 * ======================================================================= */
const TILE = 40, COLS = 20, ROWS = 15;

const Maps = {
  zones: {},

  // 맵별 타일 크기(미지정 시 기본 20×15)
  colsOf(zone){ return Maps[zone].cols || COLS; },
  rowsOf(zone){ return Maps[zone].rows || ROWS; },

  /* 집(홈) — 취침/저장/인벤토리, 메밀밭 */
  house: {
    name: "내 집", danger: false,
    grid: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..............,,,,T",
      "T..............,,,,T",
      "T..............,,,,,",  // 우측 마을 출구
      "T..............,,,,T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
    objects: [
      { type:"house", tx:2, ty:2, w:4, h:3, solid:true, label:"초가집", action:"sleep" },
      // 메밀밭 6칸
      { type:"plot", tx:3, ty:8, plot:0 }, { type:"plot", tx:4, ty:8, plot:1 }, { type:"plot", tx:5, ty:8, plot:2 },
      { type:"plot", tx:3, ty:9, plot:3 }, { type:"plot", tx:4, ty:9, plot:4 }, { type:"plot", tx:5, ty:9, plot:5 },
      { type:"sign", tx:8, ty:7, solid:true, label:"안내판", action:"sign_house" },
    ],
    exits: [ { tx:19, ty:7, to:"village", sx:1, sy:7 } ],
    spawn: { tx:10, ty:7 },
  },

  /* 마을 — NPC / 장날 좌판 */
  village: {
    name: "마을", danger: false,
    grid: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      ",..................,",  // 좌(집)·우(산) 출구
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "T..................T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
    objects: [
      // 윗줄 5채 (문 아래로 향함)
      { type:"bldg", tx:1,  ty:1, w:3, h:2, solid:true, bldg:"mudang",  action:"enter" },
      { type:"bldg", tx:5,  ty:1, w:3, h:2, solid:true, bldg:"uiwon",   action:"enter" },
      { type:"bldg", tx:9,  ty:1, w:3, h:2, solid:true, bldg:"uisang",  action:"enter" },
      { type:"bldg", tx:13, ty:1, w:3, h:2, solid:true, bldg:"yakcho",  action:"enter" },
      { type:"bldg", tx:16, ty:1, w:3, h:2, solid:true, bldg:"hunjang", action:"enter" },
      // 아랫줄 5채
      { type:"bldg", tx:1,  ty:11,w:3, h:2, solid:true, bldg:"daejang", action:"enter" },
      { type:"bldg", tx:5,  ty:11,w:3, h:2, solid:true, bldg:"pujut",   action:"enter" },
      { type:"bldg", tx:9,  ty:11,w:3, h:2, solid:true, bldg:"banga",   action:"enter" },
      { type:"bldg", tx:13, ty:11,w:3, h:2, solid:true, bldg:"chonjang",action:"enter" },
      { type:"bldg", tx:16, ty:11,w:3, h:2, solid:true, bldg:"jumak",   action:"enter" },
      // 장터 좌판 + 노점 NPC(방물장수/농부/보부상)
      { type:"stall",  tx:9, ty:7, solid:true, label:"장터 좌판", action:"market" },
      { type:"person", tx:5, ty:7, npc:"geonchuk", action:"npc" },
      { type:"person", tx:14,ty:7, npc:"nongbu",   action:"npc" },
      { type:"person", tx:11,ty:5, npc:"bobu",     action:"npc" },
      // 장날 게스트 NPC (#1) — 장날에만 출현
      { type:"person", tx:3,  ty:4, npc:"hong",   action:"npc", marketOnly:true },
      { type:"person", tx:16, ty:4, npc:"sori",   action:"npc", marketOnly:true },
      { type:"person", tx:7,  ty:9, npc:"daegam", action:"npc", marketOnly:true },
      { type:"person", tx:12, ty:9, npc:"namu",   action:"npc", marketOnly:true },
    ],
    exits: [
      { tx:0,  ty:7, to:"house", sx:18, sy:7 },
      { tx:19, ty:7, to:"mtn1", sx:1, sy:10 },
    ],
    spawn: { tx:10, ty:9 },
  },

  /* ===== 산 — 4개 구역(Zone) : 30×22 확장 맵 (그리드는 _genMtnGrid로 생성) =====
   * 좌우 통로(row 10)로 구역이 연결되고, 카메라가 플레이어를 따라간다. */
  mtn1: {
    name: "산 입구", danger: true, cols:30, rows:22,
    objects: [
      { type:"sign", tx:3, ty:8, solid:true, label:"산 입구 표석", action:"sign_mtn" },
      { type:"shrine", tx:16, ty:3, w:2, h:2, solid:true, label:"당나무 제단", action:"shrine" },
    ],
    exits: [ { tx:0, ty:10, to:"village", sx:18, sy:7 }, { tx:29, ty:10, to:"mtn2", sx:1, sy:10 } ],
    spawn: { tx:2, ty:10 },
  },
  mtn2: {
    name: "산 중턱", danger: true, cols:30, rows:22,
    objects: [ { type:"sign", tx:3, ty:8, solid:true, label:"중턱 이정표", action:"sign_mtn" } ],
    exits: [ { tx:0, ty:10, to:"mtn1", sx:28, sy:10 }, { tx:29, ty:10, to:"mtn3", sx:1, sy:10 } ],
    spawn: { tx:2, ty:10 },
  },
  mtn3: {
    name: "깊은 숲", danger: true, cols:30, rows:22,
    objects: [ { type:"sign", tx:3, ty:8, solid:true, label:"안개 표석", action:"sign_mtn" } ],
    exits: [ { tx:0, ty:10, to:"mtn2", sx:28, sy:10 }, { tx:29, ty:10, to:"mtn4", sx:1, sy:10 } ],
    spawn: { tx:2, ty:10 },
  },
  mtn4: {
    name: "산 정상", danger: false, cols:30, rows:22,
    objects: [
      { type:"altar", tx:16, ty:5, w:2, h:2, solid:true, label:"산정 제단", action:"altar" },
    ],
    exits: [ { tx:0, ty:10, to:"mtn3", sx:28, sy:10 } ],
    spawn: { tx:2, ty:10 },
  },

  /* ---- 건물 내부 (Interior.enter 가 objects/floorColor/exits 채움) ---- */
  interior: {
    name:"실내", danger:false, floorColor:"#5a4632",
    grid: [
      "####################",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "#FFFFFFFFFFFFFFFFFF#",
      "####################",
    ],
    objects: [],
    exits: [],
    spawn: { tx:10, ty:11 },
  },

  /* ---- 고체 판정 ---- */
  isSolidTile(zone, tx, ty){
    const z = Maps[zone];
    if (tx < 0 || ty < 0 || tx >= Maps.colsOf(zone) || ty >= Maps.rowsOf(zone)) return true;
    const c = z.grid[ty][tx];
    return c === "T" || c === "W" || c === "R" || c === "#";  // x(가시풀)은 통행 가능
  },
  // 가시풀(함정) 타일 여부
  isThornTile(zone, tx, ty){
    if (tx < 0 || ty < 0 || tx >= Maps.colsOf(zone) || ty >= Maps.rowsOf(zone)) return false;
    return Maps[zone].grid[ty][tx] === "x";
  },

  // 픽셀 좌표가 고체와 충돌하는지 (오브젝트 포함). w,h = 캐릭터 박스
  blocked(zone, px, py, halfW, halfH){
    const corners = [
      [px - halfW, py - halfH], [px + halfW, py - halfH],
      [px - halfW, py + halfH], [px + halfW, py + halfH],
    ];
    for (const [cx, cy] of corners){
      const tx = Math.floor(cx / TILE), ty = Math.floor(cy / TILE);
      if (Maps.isSolidTile(zone, tx, ty)) return true;
    }
    // 솔리드 오브젝트
    for (const o of Maps[zone].objects){
      if (!o.solid) continue;
      const ox = o.tx*TILE, oy = o.ty*TILE, ow=(o.w||1)*TILE, oh=(o.h||1)*TILE;
      if (px+halfW > ox && px-halfW < ox+ow && py+halfH > oy && py-halfH < oy+oh) return true;
    }
    return false;
  },

  /* ---- 렌더 ---- */
  drawTiles(ctx, zone){
    const z = Maps[zone];
    const season = Time.season();
    const grassTop = season === "겨울" ? "#cdd8df" : (season==="가을" ? "#b8a55a" : "#7fae5a");
    const grassBot = season === "겨울" ? "#aebcc6" : (season==="가을" ? "#9c8a3e" : "#5e8e3e");
    const cols=Maps.colsOf(zone), rows=Maps.rowsOf(zone);
    for (let y=0;y<rows;y++){
      for (let x=0;x<cols;x++){
        const c = z.grid[y][x];
        const px = x*TILE, py = y*TILE;
        // 실내(F=마루, #=벽)
        if (c === "F" || c === "#"){
          const fc = z.floorColor || "#5a4632";
          ctx.fillStyle = ((x+y)&1) ? fc : Maps._shade(fc,-12);
          ctx.fillRect(px,py,TILE,TILE);
          if (c === "#"){ ctx.fillStyle="#2a2018"; ctx.fillRect(px,py,TILE,TILE); ctx.fillStyle="#3a2e22"; ctx.fillRect(px+2,py+2,TILE-4,6); }
          else { ctx.strokeStyle="rgba(0,0,0,0.08)"; ctx.strokeRect(px+0.5,py+0.5,TILE,TILE); }
          continue;
        }
        // 바탕 풀
        ctx.fillStyle = ((x+y)&1) ? grassTop : grassBot;
        ctx.fillRect(px,py,TILE,TILE);
        if (c === ","){ // 흙길
          ctx.fillStyle = ((x+y)&1) ? "#b08a55" : "#a07e4c";
          ctx.fillRect(px,py,TILE,TILE);
        } else if (c === "W"){ // 물
          ctx.fillStyle = "#3d7fb5"; ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle = "rgba(255,255,255,0.18)";
          ctx.fillRect(px+4, py+6+((Math.floor(G.time.min)+x)%6), TILE-12, 2);
        } else if (c === "T"){ // 나무
          ctx.fillStyle = ((x+y)&1) ? grassTop : grassBot; ctx.fillRect(px,py,TILE,TILE);
          ctx.fillStyle = "#5b3a1a"; ctx.fillRect(px+TILE/2-3, py+TILE-14, 6, 12);
          ctx.fillStyle = season==="겨울" ? "#dfe8ec" : (season==="가을"?"#c9702e":"#2f6b2f");
          ctx.beginPath(); ctx.arc(px+TILE/2, py+TILE/2-2, 13, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.beginPath(); ctx.arc(px+TILE/2-4, py+TILE/2-6, 5,0,Math.PI*2); ctx.fill();
        } else if (c === "R"){ // 바위
          ctx.fillStyle = "#8a8a8a"; ctx.beginPath();
          ctx.moveTo(px+6,py+TILE-6); ctx.lineTo(px+TILE/2,py+8); ctx.lineTo(px+TILE-6,py+TILE-6);
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = "#a8a8a8"; ctx.fillRect(px+12,py+18,8,6);
        } else if (c === "x"){ // 가시풀 함정 (밟으면 HP-5)
          ctx.strokeStyle = "#3a5a2a"; ctx.lineWidth=2;
          for(let i=0;i<5;i++){ const bx=px+5+i*7, by=py+TILE-5;
            ctx.beginPath(); ctx.moveTo(bx,by); ctx.lineTo(bx-3,by-12); ctx.moveTo(bx,by); ctx.lineTo(bx+3,by-12); ctx.moveTo(bx,by); ctx.lineTo(bx,by-15); ctx.stroke(); }
          ctx.fillStyle="#7a3030"; for(let i=0;i<3;i++) ctx.fillRect(px+8+i*9, py+10+((i*5)%8), 3,3);
        }
      }
    }
  },

  drawObjects(ctx, zone){
    for (const o of Maps[zone].objects){
      if (o.marketOnly && !Time.isMarketDay()) continue;  // 장날에만 출현
      const px = o.tx*TILE, py=o.ty*TILE, ow=(o.w||1)*TILE, oh=(o.h||1)*TILE;
      if (o.type === "house"){
        ctx.fillStyle = "#c9a86a"; ctx.fillRect(px, py+oh*0.45, ow, oh*0.55);   // 벽
        ctx.fillStyle = "#6b4f2a"; // 초가지붕
        ctx.beginPath(); ctx.moveTo(px-6, py+oh*0.5); ctx.lineTo(px+ow/2, py-4); ctx.lineTo(px+ow+6, py+oh*0.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#3a2410"; ctx.fillRect(px+ow/2-9, py+oh-26, 18, 26);   // 문
      } else if (o.type === "bldg"){
        const b = DATA.BUILDINGS[o.bldg] || {};
        const color = o.color || b.sign || "#7f5539";
        const label = o.label || b.name || "";
        ctx.fillStyle = "#caa56e"; ctx.fillRect(px, py+8, ow, oh-8);
        ctx.fillStyle = color; // 지붕(기와색)
        ctx.beginPath(); ctx.moveTo(px-4, py+12); ctx.lineTo(px+ow/2, py-6); ctx.lineTo(px+ow+4, py+12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#3a2410"; ctx.fillRect(px+ow/2-8, py+oh-22, 16, 22); // 문
        ctx.fillStyle = "#caa56e"; ctx.fillRect(px+ow/2-7, py+oh-21, 14, 4);  // 문 위 인방
        Maps._label(ctx, label, px+ow/2, py-8);
        const npc = DATA.NPCS[o.npc || b.npc];
        if (npc){ ctx.font="18px serif"; ctx.textAlign="center"; ctx.fillText(npc.icon, px+ow/2, py+oh-26); }
      } else if (o.type === "person"){
        Maps._person(ctx, px, py, DATA.NPCS[o.npc]);
      } else if (o.type === "npc_in"){
        Maps._person(ctx, px+ (ow-TILE)/2, py+8, DATA.NPCS[o.npc], true);
        Maps._label(ctx, (DATA.NPCS[o.npc]||{}).name||"", px+ow/2, py-2);
      } else if (o.type === "door_out"){
        ctx.fillStyle="#3a2410"; ctx.fillRect(px+ow/2-12, py+2, 24, oh-2);
        ctx.fillStyle="#caa56e"; ctx.fillRect(px+ow/2-12, py, 24, 5);
        Maps._label(ctx, "나가기 ▼", px+ow/2, py-4);
      } else if (o.type === "stall"){
        const active = Maps.stallActive();
        ctx.fillStyle = active ? "#caa56e" : "#6e5a3c"; ctx.fillRect(px, py+6, ow, oh-6);
        ctx.fillStyle = active ? "#c0392b" : "#5a3a3a";
        ctx.fillRect(px-3, py, ow+6, 10);
        ctx.font="18px serif"; ctx.textAlign="center";
        ctx.fillText("🪧", px+ow/2, py+oh-6);
        Maps._label(ctx, active ? "장터(영업중)" : "장터", px+ow/2, py-6);
      } else if (o.type === "plot"){
        Farming.drawPlot(ctx, o, px, py);
      } else if (o.type === "sign"){
        ctx.fillStyle="#6b4f2a"; ctx.fillRect(px+TILE/2-2, py+10, 4, TILE-14);
        ctx.fillStyle="#caa56e"; ctx.fillRect(px+6, py+8, TILE-12, 14);
        ctx.fillStyle="#3a2410"; ctx.font="9px monospace"; ctx.textAlign="center";
        ctx.fillText("?", px+TILE/2, py+19);
      } else if (o.type === "shrine"){
        const cx=px+ow/2, baseY=py+oh-4;
        // 둥치
        ctx.fillStyle="#5b3a1a"; ctx.fillRect(cx-7, baseY-30, 14, 30);
        ctx.fillStyle="#4a2f14"; ctx.fillRect(cx-2, baseY-26, 4, 26);
        // 무성한 잎 (신목)
        const season=Time.season();
        ctx.fillStyle = season==="겨울"?"#cfe0e6":(season==="가을"?"#c98a2e":"#2e7d32");
        [[-12,-34,20],[12,-34,20],[0,-46,24],[-16,-22,15],[16,-22,15]].forEach(c=>{
          ctx.beginPath(); ctx.arc(cx+c[0], baseY+c[1], c[2], 0, Math.PI*2); ctx.fill();
        });
        // 금줄(왼새끼)과 오색천
        ctx.strokeStyle="#d9c89a"; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(cx-10,baseY-14); ctx.lineTo(cx+10,baseY-14); ctx.stroke();
        ["#c0392b","#e7c66b","#2980b9","#27ae60","#ffffff"].forEach((cc,i)=>{ ctx.fillStyle=cc; ctx.fillRect(cx-9+i*4.5, baseY-14, 3, 8); });
        Maps._label(ctx, o.label||"당나무 제단", cx, py-6);
      } else if (o.type === "altar"){
        const cx=px+ow/2, baseY=py+oh-2;
        // 돌 제단
        ctx.fillStyle="#8a8a8a"; ctx.fillRect(cx-16, baseY-10, 32, 12);
        ctx.fillStyle="#a8a8a8"; ctx.fillRect(cx-13, baseY-18, 26, 10);
        ctx.fillStyle="#6e6e6e"; ctx.fillRect(cx-10, baseY-24, 20, 8);
        // 향로 불빛
        ctx.fillStyle="rgba(231,198,107,0.8)"; ctx.beginPath(); ctx.arc(cx, baseY-26, 3+Math.sin(performance.now()/300)*1, 0, Math.PI*2); ctx.fill();
        Maps._label(ctx, "산정 제단", cx, py-6);
      }
    }
  },

  _label(ctx, text, cx, cy){
    ctx.font = "11px 'Malgun Gothic', monospace"; ctx.textAlign="center";
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = "rgba(20,14,8,0.8)"; ctx.fillRect(cx-w/2, cy-11, w, 15);
    ctx.fillStyle = "#e7c66b"; ctx.fillText(text, cx, cy);
  },

  _shade(hex, d){ const m=hex.match(/\w\w/g); if(!m)return hex; return "#"+m.map(h=>clamp(parseInt(h,16)+d,0,255).toString(16).padStart(2,"0")).join(""); },

  // 간단한 마을 사람 (조선 복식) — 아이콘 머리 + 도포
  _person(ctx, px, py, npc, big){
    if (!npc) return;
    const cx=px+TILE/2, cy=py+TILE/2 + (big?2:0), bob=Math.sin(performance.now()/700 + px)*1.2;
    ctx.fillStyle="rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(cx,cy+13,9,4,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=npc.color||"#8a6a3a"; ctx.beginPath(); // 도포
    ctx.moveTo(cx-9,cy+12-bob); ctx.lineTo(cx-7,cy-2-bob); ctx.lineTo(cx+7,cy-2-bob); ctx.lineTo(cx+9,cy+12-bob); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#f0d3a8"; ctx.beginPath(); ctx.arc(cx,cy-7-bob,6,0,Math.PI*2); ctx.fill(); // 머리
    ctx.fillStyle="#2a1a0a"; ctx.fillRect(cx-6,cy-12-bob,12,3); // 머리/갓 테
    ctx.font="14px serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(npc.icon, cx, cy-7-bob); ctx.textBaseline="alphabetic";
  },

  // 장터 좌판은 장날 오전에만 활성
  stallActive(){ return Time.isMarketDay() && Time.isMorning(); },

  /* 산 구역 30×22 그리드 절차 생성 (결정적) — #11 확장/지형/함정
   * opts: { T,R,W,x } 밀도. row10 가로 통로 + col15 세로 통로로 연결 보장,
   * 오브젝트 발자국·연결로를 비워 도달 가능하게 만든다. */
  _genMtnGrid(zone, seed, opts){
    const cols=30, rows=22, EX=10;       // EX: 좌우 통로 행
    let s = seed>>>0;
    const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
    const g=[];
    for(let y=0;y<rows;y++){
      const row=[];
      for(let x=0;x<cols;x++) row.push((x===0||x===cols-1||y===0||y===rows-1)?"T":".");
      g.push(row);
    }
    // 지형 산포 (내부)
    const scatter=(ch,d)=>{ for(let y=2;y<rows-2;y++)for(let x=2;x<cols-2;x++){ if(g[y][x]==="." && rnd()<d) g[y][x]=ch; } };
    scatter("T", opts.T); scatter("R", opts.R); scatter("W", opts.W); if(opts.x) scatter("x", opts.x);
    // 통로(가로 EX행 전체 + 세로 15열) — 산포 위에 덮어써서 항상 통행
    for(let x=0;x<cols;x++) g[EX][x]=",";
    for(let y=1;y<rows-1;y++) g[y][15]=",";
    // 가지 통로 몇 개(탐색로)
    [5,9,22,25].forEach(cx=>{ const top=2+Math.floor(rnd()*5), bot=rows-3-Math.floor(rnd()*5); for(let y=Math.min(top,EX);y<=Math.max(bot,EX);y++) g[y][cx]=","; });
    // 오브젝트 발자국 비우기 + 통로까지 연결
    (Maps[zone].objects||[]).forEach(o=>{
      const w=o.w||1, h=o.h||1;
      for(let ty=o.ty-1; ty<=o.ty+h; ty++) for(let tx=o.tx-1; tx<=o.tx+w; tx++){
        if(tx>0&&tx<cols-1&&ty>0&&ty<rows-1 && !(tx>=o.tx&&tx<o.tx+w&&ty>=o.ty&&ty<o.ty+h)) g[ty][tx]=".";
      }
      // 오브젝트(솔리드)에서 가로 통로(EX)까지 세로 연결로를 비워 도달 가능하게
      const cx=clamp(o.tx,1,cols-2);
      const a=Math.min(o.ty+h, EX), b=Math.max(o.ty-1, EX);
      for(let y=a; y<=b; y++) g[y][cx]=",";
    });
    // 스폰/출구 주변 정리
    g[EX][1]=","; g[EX][2]=","; g[EX][cols-2]=",";
    return g.map(r=>r.join(""));
  },
};

// zones 참조 등록
Maps.zones = { house: Maps.house, village: Maps.village, mtn1: Maps.mtn1, mtn2: Maps.mtn2, mtn3: Maps.mtn3, mtn4: Maps.mtn4, interior: Maps.interior };

// 산 구역 그리드 생성 (결정적 시드)
Maps.mtn1.grid = Maps._genMtnGrid("mtn1", 1001, { T:0.12, R:0.06, W:0.03, x:0.05 });
Maps.mtn2.grid = Maps._genMtnGrid("mtn2", 2002, { T:0.10, R:0.08, W:0.05, x:0.06 });
Maps.mtn3.grid = Maps._genMtnGrid("mtn3", 3003, { T:0.16, R:0.07, W:0.04, x:0.07 });
Maps.mtn4.grid = Maps._genMtnGrid("mtn4", 4004, { T:0.10, R:0.06, W:0.02, x:0 });
