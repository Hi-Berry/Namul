/* =========================================================================
 * 연애 NPC 시스템 (#24, 코어) — 4종 NPC / 시간대 순찰 / 호감도 3단계 /
 *  동백실 가락지(증표)로 연인 확정 + 전용 버프 / 고백 컷씬
 *  (마을 2.5배 확장·2년차 엔딩 타임라인은 후속 단계)
 * ======================================================================= */
const Romance = {
  NPCS: {
    musa:   { name:"허름한 사내", buff:"guard",  buffName:"호위무사의 가호", buffDesc:"기력 소모 -20%",
              cut:"assets/love/cut1-musa.png",
              patrol:[{h:8,at:[16,9]},{h:13,at:[2,9]},{h:18,at:[9,10]}],
              lines:["…뭘 그리 보나. 그저 떠도는 무사일 뿐이다.","(말수는 적지만 눈빛이 깊다.)"] },
    spirit: { name:"젊은 선비", buff:"spirit", buffName:"산신의 비호", buffDesc:"최대 신력 +20",
              cut:"assets/love/cut2-miho.png",
              patrol:[{h:8,at:[9,3]},{h:12,at:[9,8]},{h:17,at:[12,10]}],
              lines:["허허, 산 향기가 나는 낭자로군.","(어딘가 사람 같지 않은 신비로운 분위기가 감돈다.)"] },
    prince: { name:"위장 유생", buff:"prince", buffName:"한양 상단 연줄", buffDesc:"주막 요리 판매가 +10%",
              cut:"assets/love/cut1-prince.png",
              patrol:[{h:8,at:[6,3]},{h:14,at:[11,8]},{h:19,at:[3,10]}],
              lines:["과거를 준비하는 유생이오… 험험.","(행색은 수수하나 기품이 배어난다.)"] },
    rival:  { name:"백세루 후계자", buff:"rival", buffName:"경쟁 비책 입수", buffDesc:"경쟁 주막 레시피 1종 전수",
              cut:null, rivalRecipe:"kalguksu",
              patrol:[{h:8,at:[9,6]},{h:11,at:[15,8]},{h:16,at:[16,10]}],
              lines:["흥, 그쪽 주막이 요즘 제법 잘 나간다지?","(앙숙이라면서도 묘하게 신경이 쓰인다.)"] },
  },
  CONFESS_AT: 80,  // 2단계 MAX 근접(호감) — 증표 전달 가능 임계

  pts(id){ return (P.romance && P.romance[id]) || 0; },
  stageName(id){ if (P.lover===id) return "연인 ♥"; const p=this.pts(id); return p>=this.CONFESS_AT?"각별한 사이" : p>=40?"호감" : p>=15?"안면" : "초면"; },
  hasBuff(key){ return P.lover && Romance.NPCS[P.lover] && Romance.NPCS[P.lover].buff===key; },

  // 시간대 순찰: 마을에서 현재 시각에 맞는 좌표로 NPC 배치
  update(){
    if (World.zone!=="village") return;
    const h = Math.floor((G.DAY_START_MIN + G.time.min)/60);
    Maps.village.objects.forEach(o=>{
      if (o.type!=="person" || !o.romance) return;
      const W = Romance.NPCS[o.npc].patrol;
      let at = W[0].at; for (let i=W.length-1;i>=0;i--){ if (h>=W[i].h){ at=W[i].at; break; } }
      o.tx = at[0]; o.ty = at[1];
    });
  },

  talk(id){
    const r = Romance.NPCS[id]; const nm = DATA.NPCS[id];
    const pts = Romance.pts(id);
    const head = `${nm.icon} ${r.name}`;
    if (P.lover===id){
      UI.startDialogue(head, ["오늘도 무사한 얼굴이라 다행이오. (연인 — "+r.buffName+")"], {
        choices:[{label:"정담을 나눈다",value:"talk"},{label:"나간다",value:"bye"}],
        onChoice(v){ if(v==="talk") Romance._talk(id); } });
      return;
    }
    if (P.lover){ UI.startDialogue(head, ["…그대에겐 이미 정인이 있지 않소. 난 그저 지나가는 사람이오."]); return; }
    const pages = r.lines.concat([`(호감: ${pts}/100 · ${Romance.stageName(id)})`]);
    const choices = [ {label:"정담을 나눈다 (호감 ▲)",value:"talk"}, {label:"선물한다 (나물)",value:"gift"} ];
    if (pts>=Romance.CONFESS_AT) choices.push({label:"💍 동백실 가락지를 건넨다",value:"ring"});
    choices.push({label:"나간다",value:"bye"});
    UI.startDialogue(head, pages, { onChoice(v){
      if (v==="talk") Romance._talk(id);
      else if (v==="gift") Romance._gift(id);
      else if (v==="ring") Romance._confess(id);
    }});
  },

  _add(id,n){ if(!P.romance) P.romance={}; P.romance[id]=clamp((P.romance[id]||0)+n,0,P.lover===id?100:99); },

  _talk(id){
    const key="rtalk_"+id;
    if (G.flags[key]===G.time.day){ toast("오늘은 이미 정담을 나눴다 (내일 다시)","bad"); return; }
    G.flags[key]=G.time.day; Romance._add(id,4); Sound.sfx("blip");
    toast(`${Romance.NPCS[id].name}와 정담을 나눴다. 호감 +4`,"good");
  },
  _gift(id){
    const herbs=Player.herbList();
    if (!herbs.length){ toast("선물할 나물이 없다","bad"); return; }
    // 가장 높은 등급 나물을 선물(정성)
    const best=herbs.slice().sort((a,b)=>DATA.HERBS[b].tier-DATA.HERBS[a].tier)[0];
    const t=DATA.HERBS[best].tier; const inc=[0,5,9,16][t]||5;
    Player.remove(best,1); Romance._add(id,inc); Sound.sfx("confirm");
    toast(`${DATA.HERBS[best].name}을(를) 선물했다. 호감 +${inc}`,"gold"); UI.refreshHUD();
  },
  _confess(id){
    if (P.lover){ toast("이미 정인이 있다","bad"); return; }
    if (Romance.pts(id) < Romance.CONFESS_AT){ toast("아직 그럴 사이가 아니다","bad"); return; }
    if (P.fame < 1500){ UI.startDialogue("💍","아직 그대의 이름이 세상에 덜 알려졌다. (명성 1500 필요)"); return; }
    if (!G.flags.hasRing){ UI.startDialogue("💍","동백실 가락지가 없다. 방물점에서 마련해 오자."); return; }
    // 연인 확정
    G.flags.hasRing=false; P.lover=id; P.romance[id]=100;
    const r=Romance.NPCS[id];
    if (id==="rival") Player.learnRecipe(r.rivalRecipe);
    P.mp=clamp(P.mp,0,Player.mpCap());
    Sound.sfx("fanfare");
    const onEnd=()=>{ if(window.Sound) Sound.forScene(); toast(`💕 ${r.name}와 연인이 되었다! (${r.buffName}: ${r.buffDesc})`,"gold"); UI.refreshHUD(); };
    if (r.cut && window.Cutscene){
      // 고백 컷씬 (러브 일러스트) — 오프닝 scenes를 임시 교체 후 복원
      const saved = Cutscene.scenes;
      Cutscene.scenes = [{ img:r.cut, lines:[
        `달래가 동백실 가락지를 내밀자, ${r.name}의 눈빛이 흔들린다.`,
        "「…이 마음, 받아주겠소?」 두 사람의 거리가 한 뼘 가까워졌다." ] }];
      Cutscene.play(()=>{ Cutscene.scenes = saved; onEnd(); });
    } else { onEnd(); }
  },
};
