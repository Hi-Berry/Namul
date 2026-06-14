/* =========================================================================
 * 맵 — 집 / 마을 / 산 (타일 지형 + 상호작용 오브젝트)
 *  타일: . 풀  , 흙길  T 나무(고체)  W 물(고체)  R 바위(고체)  ~ 모래
 * ======================================================================= */
const TILE = 40, COLS = 20, ROWS = 15;

const Maps = {
  zones: {},

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
      "T...........WWW....T",
      "T...........WWW....T",
      ",,,,,,,,,,,,,,,,,,,,",  // 좌측 집 출구
      "T...,,,,,,,,,,,,,...T",
      "T...,............,.T",
      "T...,............,.T",
      "T...,,,,,,,,,,,,,,,,,",  // 우측 산 출구
      "T...,............,.T",
      "T...,............,.T",
      "T...,,,,,,,,,,,,,...T",
      "T..................T",
      "T..................T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
    objects: [
      { type:"bldg", tx:2,  ty:5, w:3, h:2, solid:true, color:"#8e44ad", label:"무당집",  npc:"mudang",  action:"npc" },
      { type:"bldg", tx:15, ty:5, w:3, h:2, solid:true, color:"#7f5539", label:"대장간",  npc:"daejang", action:"npc" },
      { type:"bldg", tx:2,  ty:10,w:3, h:2, solid:true, color:"#2c3e50", label:"촌장댁",  npc:"chonjang",action:"npc" },
      { type:"bldg", tx:15, ty:10,w:3, h:2, solid:true, color:"#c0392b", label:"주막",    npc:"jumo",    action:"npc" },
      { type:"bldg", tx:3,  ty:1, w:3, h:2, solid:true, color:"#b5651d", label:"의상점",  npc:"uisang",  action:"npc" },
      { type:"bldg", tx:14, ty:1, w:3, h:2, solid:true, color:"#27708a", label:"방물점",  npc:"geonchuk",action:"npc" },
      { type:"stall", tx:9, ty:7, solid:true, label:"장터 좌판", action:"market" },
    ],
    exits: [
      { tx:0,  ty:4, to:"house", sx:18, sy:7 },
      { tx:19, ty:8, to:"mountain", sx:1, sy:7 },
    ],
    spawn: { tx:9, ty:9 },
  },

  /* 산 — 약초 채집 / 몬스터 심볼 인카운터 */
  mountain: {
    name: "산", danger: true,
    grid: [
      "TTTTTTTTTTTTTTTTTTTT",
      "T...R...TT....R....T",
      "T.......TT.........T",
      "T..RR.........RR...T",
      ",,,,,,,......,,,,,,T",  // 좌측 마을 출구
      "T....,...RR...,....T",
      "T....,........,....T",
      "T....,,,,..,,,,...RT",
      "T.......,..,.......T",
      "T..RR...,..,...RR..T",
      "T.......,..,.......T",
      "T....TT.,..,.TT....T",
      "T.......,..,.......T",
      "T.......,..,.......T",
      "TTTTTTTTTTTTTTTTTTTT",
    ],
    objects: [
      { type:"sign", tx:3, ty:5, solid:true, label:"산 입구 표석", action:"sign_mtn" },
      { type:"shrine", tx:6, ty:2, w:2, h:2, solid:true, label:"당산나무", action:"shrine" },
    ],
    exits: [ { tx:0, ty:4, to:"village", sx:18, sy:8 } ],
    spawn: { tx:2, ty:4 },
    // 채집 노드 / 몬스터는 동적 생성 (world.js)
  },

  /* ---- 고체 판정 ---- */
  isSolidTile(zone, tx, ty){
    const z = Maps[zone];
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
    const c = z.grid[ty][tx];
    return c === "T" || c === "W" || c === "R";
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
    for (let y=0;y<ROWS;y++){
      for (let x=0;x<COLS;x++){
        const c = z.grid[y][x];
        const px = x*TILE, py = y*TILE;
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
        }
      }
    }
  },

  drawObjects(ctx, zone){
    for (const o of Maps[zone].objects){
      const px = o.tx*TILE, py=o.ty*TILE, ow=(o.w||1)*TILE, oh=(o.h||1)*TILE;
      if (o.type === "house"){
        ctx.fillStyle = "#c9a86a"; ctx.fillRect(px, py+oh*0.45, ow, oh*0.55);   // 벽
        ctx.fillStyle = "#6b4f2a"; // 초가지붕
        ctx.beginPath(); ctx.moveTo(px-6, py+oh*0.5); ctx.lineTo(px+ow/2, py-4); ctx.lineTo(px+ow+6, py+oh*0.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#3a2410"; ctx.fillRect(px+ow/2-9, py+oh-26, 18, 26);   // 문
      } else if (o.type === "bldg"){
        ctx.fillStyle = "#caa56e"; ctx.fillRect(px, py+8, ow, oh-8);
        ctx.fillStyle = o.color; // 지붕(기와색)
        ctx.beginPath(); ctx.moveTo(px-4, py+12); ctx.lineTo(px+ow/2, py-6); ctx.lineTo(px+ow+4, py+12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#3a2410"; ctx.fillRect(px+ow/2-8, py+oh-22, 16, 22);
        // 간판
        Maps._label(ctx, o.label, px+ow/2, py-10);
        // NPC 아이콘
        const npc = DATA.NPCS[o.npc];
        if (npc){ ctx.font="20px serif"; ctx.textAlign="center"; ctx.fillText(npc.icon, px+ow/2, py+oh-26); }
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
        Maps._label(ctx, "당산나무", cx, py-6);
      }
    }
  },

  _label(ctx, text, cx, cy){
    ctx.font = "11px 'Malgun Gothic', monospace"; ctx.textAlign="center";
    const w = ctx.measureText(text).width + 10;
    ctx.fillStyle = "rgba(20,14,8,0.8)"; ctx.fillRect(cx-w/2, cy-11, w, 15);
    ctx.fillStyle = "#e7c66b"; ctx.fillText(text, cx, cy);
  },

  // 장터 좌판은 장날 오전에만 활성
  stallActive(){ return Time.isMarketDay() && Time.isMorning(); },
};

// zones 참조 등록
Maps.zones = { house: Maps.house, village: Maps.village, mountain: Maps.mountain };
