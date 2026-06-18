/* =========================================================================
 * 스프라이트 — 기획서 시트(assets/frames/*.png)를 로드해 캐릭터 렌더
 *  b0_x: idle(정면/뒤/오른/왼)  b1_x·b2_x: 걷기 프레임  b4_0/b4_1: 전투(낫)
 *  b3_2·b3_3: 농사  b4_2·b4_3: 요리
 * ======================================================================= */
const Sprites = {
  frames:{}, total:0, loaded:0, ready:false,

  NAMES:["b0_0","b0_1","b0_2","b0_3","b1_0","b1_1","b1_2","b1_3",
         "b2_0","b2_1","b2_2","b2_3","b3_2","b3_3","b4_0","b4_1","b4_2","b4_3"],
  // 방향 → idle/walkA/walkB 프레임
  DIR:{ down:["b0_0","b1_0","b2_0"], up:["b0_1","b1_1","b2_1"],
        right:["b0_2","b1_2","b2_2"], left:["b0_3","b1_3","b2_3"] },
  // 상태별 애니메이션 프레임 세트 (#6) — 채집/요리/공격
  ACT:{ gather:["b3_2","b3_3"], cook:["b4_2","b4_3"], attack:["b4_0","b4_1"] },

  // 요괴 이미지 (id → 파일명)
  MON_SRC: { dokkaebi_m:"도깨비", mulgwisin:"물귀신", gumiho:"구미호", dueok:"두억시니" },
  mon:{},

  load(){
    this.total = this.NAMES.length;
    this.NAMES.forEach(nm=>{
      const img = new Image();
      img.onload = ()=>{ this.loaded++; if (this.loaded>=this.total) this.ready=true; };
      img.onerror = ()=>{ this.loaded++; }; // 누락돼도 진행(폴백)
      img.src = "assets/frames/" + nm + ".png?v=6";  // 이미지 캐시 무력화(재슬라이스 시 +1)
      this.frames[nm] = img;
    });
    // 요괴 이미지 프리로드 (#21)
    for (const k in this.MON_SRC){
      const img = new Image(); img.src = encodeURI("assets/monster/" + this.MON_SRC[k] + ".png");
      this.mon[k] = img;
    }
  },
  // 로드된 요괴 이미지 반환(없으면 null)
  monImg(id){ const i=this.mon[id]; return (i && i.complete && i.naturalWidth>0) ? i : null; },

  has(nm){ const i=this.frames[nm]; return i && i.complete && i.naturalWidth>0; },

  // 바닥(footY) 기준 중앙 정렬로 그리기. flip: 좌우반전
  drawFrame(ctx, nm, cx, footY, targetH, flip){
    const img = this.frames[nm];
    if (!this.has(nm)) return false;
    const h = Math.round(targetH);
    const w = Math.round(img.naturalWidth * h / img.naturalHeight);
    ctx.save();
    if (flip){ ctx.translate(cx,0); ctx.scale(-1,1); ctx.translate(-cx,0); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(cx - w/2), Math.round(footY - h), w, h);
    ctx.restore();
    return true;
  },

  // 방향/이동에 맞는 프레임명 — 걷기 4단계(walkA·idle·walkB·idle)로 부드럽게
  frameFor(dir, moving, animT){
    const set = this.DIR[dir] || this.DIR.down;
    if (!moving) return set[0];
    const ph = Math.floor(animT/1.5)%4;
    return [set[1], set[0], set[2], set[0]][ph];
  },

  // 상태 애니메이션 프레임명 (gather/cook/attack은 실시간 타이머로 깜빡)
  frameForAction(action, dir, moving, animT){
    const a = this.ACT[action];
    if (a){ return a[Math.floor(performance.now()/180)%a.length]; }
    return this.frameFor(dir, moving, animT);
  },
};
