/* =========================================================================
 * 농사 — 메밀밭(자동 재배) + 산 약초 채집(호미질)
 * ======================================================================= */
const Farming = {
  plots: [], // 6칸: {state:'empty'|'growing'|'ready', day}

  init(){ Farming.plots = Array.from({length:6}, ()=>({state:"empty", day:0})); },

  save(){ return { plots: Farming.plots }; },
  restore(d){ if (d && d.plots) Farming.plots = d.plots; else Farming.init(); },

  onNewDay(){
    Farming.plots.forEach(p=>{
      if (p.state==="growing" && (G.time.day - p.day) >= DATA.BUCKWHEAT.growDays) p.state="ready";
    });
  },
  onTimeAdvance(){ /* 작물은 일 단위 성장 */ },

  /* ---- 메밀밭 칸 상호작용 ---- */
  interactPlot(plotIdx){
    const p = Farming.plots[plotIdx];
    if (p.state==="empty"){
      if (Player.count("seed") <= 0){ toast("메밀 종자가 없다 (장날 좌판에서 구입)","bad"); return; }
      Player.remove("seed",1); p.state="growing"; p.day=G.time.day;
      Sound.sfx("confirm");
      toast("🌰 메밀 종자를 심었다. 4일 후 수확","good");
    } else if (p.state==="growing"){
      const left = DATA.BUCKWHEAT.growDays - (G.time.day - p.day);
      toast(`🌱 자라는 중… ${left}일 남음`);
    } else if (p.state==="ready"){
      if (!Player.hasStamina(DATA.BUCKWHEAT.harvestStamina)){ toast("기력이 부족하다","bad"); return; }
      Player.spendStamina(DATA.BUCKWHEAT.harvestStamina);
      Player.add("flour", DATA.BUCKWHEAT.yield);
      p.state="empty"; p.day=0;
      Sound.sfx("gather");
      toast(`🌾 메밀가루 ${DATA.BUCKWHEAT.yield} 수확! (기력 -${DATA.BUCKWHEAT.harvestStamina})`,"good");
    }
  },

  plotState(plotIdx){ return Farming.plots[plotIdx]; },

  drawPlot(ctx, o, px, py){
    const p = Farming.plots[o.plot];
    // 흙
    ctx.fillStyle="#6b4a28"; ctx.fillRect(px+3, py+3, TILE-6, TILE-6);
    ctx.fillStyle="#5a3d20"; for(let i=0;i<3;i++) ctx.fillRect(px+5, py+8+i*9, TILE-10, 3);
    if (p.state==="growing"){
      const prog = clamp((G.time.day - p.day)/DATA.BUCKWHEAT.growDays,0,1);
      ctx.fillStyle="#4a8a3a";
      const h = 4 + prog*16;
      ctx.fillRect(px+TILE/2-2, py+TILE-8-h, 4, h);
      if (prog>0.5){ ctx.fillRect(px+TILE/2-7, py+TILE-8-h*0.7, 4, h*0.5); ctx.fillRect(px+TILE/2+3, py+TILE-8-h*0.7, 4, h*0.5); }
    } else if (p.state==="ready"){
      ctx.font="20px serif"; ctx.textAlign="center"; ctx.fillText("🌾", px+TILE/2, py+TILE-10);
    }
  },

  /* ---- 산 약초 채집(호미질) ----
   * node.tier: 1/2/3 → 기력 6/12/18, 수확 1~3개, 호미 등급에 따라 품질 상승
   */
  staminaFor(tier){ return tier===1?6 : tier===2?12 : 18; },

  /* #9 채집 호미질 횟수: 호미 등급에 따라 필요한 스페이스 입력 수.
   * 기본 호미(1): 1단계 3회 / 2단계 6회 / 3단계 불가(null)
   * 업그레이드 호미(2+): 1단계 2회 / 2단계 5회 / 3단계 8회 */
  hoeHitsFor(tier){
    const up = P.homiTier >= 2;
    if (tier===1) return up ? 2 : 3;
    if (tier===2) return up ? 5 : 6;
    return up ? 8 : null;
  },
  /* #10 메밀 수확 호미질: 기본 2회 / 업그레이드 1회 */
  harvestHits(){ return P.homiTier >= 2 ? 1 : 2; },

  gather(node){
    const cost = Farming.staminaFor(node.tier);
    if (!Player.hasStamina(cost)){ toast(`기력이 부족하다 (${cost} 필요)`,"bad"); return false; }
    Player.spendStamina(cost);
    // 노드 등급(node.tier) 이하의 약초 티어만 획득 가능하도록 필터링
    const herbs = DATA.herbsBySeason(Time.season()).filter(h => h.tier <= node.tier);
    // 노드 등급이 높을수록 상위 약초 가중치 ↑, 호미 등급도 가산
    const boost = clamp((node.tier-1)*0.4 + (P.homiTier-1)*0.3, 0, 1);
    const n = node.tier===1 ? randInt(1,2) : node.tier===2 ? randInt(2,3) : randInt(2,3);
    const got = {};
    for (let i=0;i<n;i++){
      const h = weightedHerb(herbs, boost);
      Player.add(h.id,1); got[h.id]=(got[h.id]||0)+1;
    }
    const txt = Object.keys(got).map(id=>`${DATA.HERBS[id].icon}${DATA.HERBS[id].name}×${got[id]}`).join(" ");
    toast(`🌿 채집! ${txt} (기력 -${cost})`,"good");
    Sound.sfx("gather");
    Player.gainExp(node.tier);
    Quests.notify("gather", { count:n, ids:Object.keys(got) });
    return true;
  },
};
