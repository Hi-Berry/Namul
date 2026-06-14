/* =========================================================================
 * 퀘스트 — 스토리 라인 + 사이드 퀘스트 (이벤트 기반 진행)
 *  goal.type: talkAll | gather | defeat | serve | sell | gold | deliver
 * ======================================================================= */
const Quests = {
  active:[], done:[], progress:{}, _talked:{},

  defs:{
    /* ---------- 메인 스토리 ---------- */
    q_intro: {
      giver:"chonjang", story:true, title:"마을 신고식",
      desc:"마을 사람들(무당·대장장이·주모)과 모두 인사하기.",
      goal:{ type:"talkAll", who:["mudang","daejang","jumo"] },
      start:["허허, 새 식구로구먼! 마을에 정 붙이려면 발품을 팔아야지.",
             "무당·대장장이·주모에게 가서 얼굴도장을 찍고 오게. 그래야 나도 안심이지."],
      ready:["오, 다들 만나고 왔는가? 이제 한 식구일세!"],
      reward:{ money:120, exp:10, item:{id:"seed",n:2} },
    },
    q_farm: {
      giver:"chonjang", story:true, prereq:"q_intro", title:"텃밭의 꿈",
      desc:"산에서 약초·나물 6개를 채집해 오기.",
      goal:{ type:"gather", count:6 },
      start:["약초꾼이라면 산을 알아야지. 산에 올라 나물 여섯 줌만 캐 오게.",
             "(산은 마을 오른쪽 출구 너머에 있다네)"],
      ready:["벌써 한 봇짐이구먼! 솜씨가 제법일세."],
      reward:{ money:90, exp:12, item:{id:"season",n:3} },
    },
    q_jumo: {
      giver:"jumo", story:true, prereq:"q_farm", title:"주모의 비밀 손맛",
      desc:"장날 주막에서 손님 5명에게 메밀전을 대접하기.",
      goal:{ type:"serve", count:5 },
      start:["호호, 손맛 좀 배워볼 텐가? 장날 오후에 손님 다섯만 제대로 대접해 보게!",
             "메밀가루→나물→양념장 순서, 잊지 말고!"],
      ready:["솜씨가 아주 야무지구먼! 단골이 늘겠어."],
      reward:{ money:160, exp:15, aff:{npc:"jumo",n:2} },
    },
    q_smith: {
      giver:"daejang", story:true, prereq:"q_farm", title:"무쇠보다 나물",
      desc:"대장장이에게 고사리 5개를 가져다주기 (해장이 급하다나).",
      goal:{ type:"deliver", item:"gosari", count:5 },
      start:["쿨럭… 어젯밤 과음했더니 속이 영…. 고사리국이 직빵인데 말이지.",
             "고사리 다섯 개만 구해다 주면 내 자네 연장을 단단히 벼려주지!"],
      ready:["오, 이 싱싱한 고사리 좀 보게! 자네 덕에 살았네."],
      reward:{ money:80, weaponUpgrade:1, exp:10 },
    },
    q_magic: {
      giver:"mudang", story:true, prereq:"q_jumo", title:"산신이 노하셨다",
      desc:"산을 어지럽히는 요괴 4마리를 물리치기.",
      goal:{ type:"defeat", count:4 },
      start:["요즘 산기운이 흉흉해… 요괴들이 부쩍 날뛰는구나.",
             "네 마리만 잡아 산을 달래거라. 그럼 더 강한 신통력을 내려주마."],
      ready:["산이 한결 잠잠해졌구나. 약속한 신통력을 받거라."],
      reward:{ money:120, exp:25, magic:"sansin" },
    },
    q_pet: {
      giver:"mudang", story:true, prereq:"q_magic", title:"산삼과 작은 친구",
      desc:"무당에게 영험한 산삼 1뿌리를 바치기.",
      goal:{ type:"deliver", item:"sansam", count:1 },
      start:["귀한 산삼 한 뿌리가 필요하구나. 봄철 산속 깊은 곳(🌟 명품 표식)에 돋는다네.",
             "구해 오면… 후훗, 귀여운 선물을 주마."],
      ready:["오오, 이렇게 영험한 산삼이라니! 자, 이 아이를 데려가렴."],
      reward:{ money:200, exp:20, pet:{ id:"squirrel", name:"도토리", icon:"🐿️" } },
    },
    q_boss: {
      giver:"chonjang", story:true, prereq:"q_pet", title:"산범 토벌",
      desc:"마을을 위협하는 산범(호랑이 요괴)을 물리치기. (겨울 산에 출몰)",
      goal:{ type:"defeat", count:1, mon:"beom" },
      start:["큰일일세! 겨울 산에 산범이 나타나 마을을 노린다네.",
             "자네밖에 믿을 사람이 없네. 부디 그놈을 물리쳐주게!"],
      ready:["사… 산범을 잡았다고?! 자네는 이 마을의 은인일세!!"],
      reward:{ money:400, exp:60, item:{id:"season",n:10} },
    },

    /* ---------- 사이드(유쾌) ---------- */
    s_gold: {
      giver:"jumo", title:"한밑천 잡기",
      desc:"전 재산 500냥 모으기. (주모가 곗돈 자랑을 하고 싶단다)",
      goal:{ type:"gold", count:500 },
      start:["사람이 돈맛을 알아야 부지런해지는 법! 500냥만 모아 와 자랑 좀 하게 해줘.","호호, 곗날에 으스대고 싶거든."],
      ready:["어머 어머, 부자 다 됐네! 한턱 단단히 쏘게~"],
      reward:{ money:0, exp:20, item:{id:"flour",n:10} },
    },
    s_merchant: {
      giver:"chonjang", title:"보부상의 꿈",
      desc:"장터에서 약초를 30개 팔기.",
      goal:{ type:"sell", count:30 },
      start:["장사 수완을 보고 싶구먼. 좌판에서 약초를 서른 개만 팔아보게.","박리다매가 장사의 기본이지!"],
      ready:["허허, 입담이 보부상 뺨치는구먼!"],
      reward:{ money:150, exp:15 },
    },
    s_dokkaebi: {
      giver:"mudang", prereq:"q_magic", title:"도깨비의 내기",
      desc:"도깨비 3마리를 혼쭐내기. (도깨비가 무당에게 시비를 걸었다나)",
      goal:{ type:"defeat", count:3, mon:"dokk" },
      start:["글쎄 도깨비 녀석들이 내 신당 앞에서 씨름 내기를 걸지 뭐냐!","대신 세 놈만 혼쭐을 내주렴. 분이 풀리게."],
      ready:["깔깔! 그 녀석들 코가 납작해졌겠구나. 속이 다 시원하다!"],
      reward:{ money:130, exp:18, magic:"yowoo" },
    },
  },

  /* ---- 초기화/저장 ---- */
  init(){ this.active=[]; this.done=[]; this.progress={}; this._talked={}; },
  save(){ return { active:this.active, done:this.done, progress:this.progress, talked:Object.fromEntries(Object.entries(this._talked).map(([k,v])=>[k,[...v]])) }; },
  restore(d){ if(!d){ this.init(); return; } this.active=d.active||[]; this.done=d.done||[]; this.progress=d.progress||{};
    this._talked={}; if(d.talked) for(const k in d.talked) this._talked[k]=new Set(d.talked[k]); },

  isDone(id){ return this.done.includes(id); },
  isActive(id){ return this.active.includes(id); },
  prereqOk(q){ return !q.prereq || this.done.includes(q.prereq); },

  /* 이 NPC가 지금 줄 수 있는 새 퀘스트 */
  offerable(npcId){
    return Object.keys(this.defs).filter(id=>{
      const q=this.defs[id];
      return q.giver===npcId && !this.isActive(id) && !this.isDone(id) && this.prereqOk(q);
    });
  },
  /* 이 NPC에게 보고(완료) 가능한 퀘스트 */
  reportable(npcId){
    return this.active.filter(id=> this.defs[id].giver===npcId && this.reached(id));
  },

  goalCount(g){ return g.type==="talkAll" ? g.who.length : g.count; },

  reached(id){
    const q=this.defs[id], g=q.goal;
    if (g.type==="deliver") return Player.count(g.item) >= g.count;
    if (g.type==="gold") return P.money >= g.count;
    return (this.progress[id]||0) >= this.goalCount(g);
  },

  /* NPC 대화에 끼워넣을 선택지 */
  npcChoices(npcId){
    const out=[];
    this.reportable(npcId).forEach(id=> out.push({ label:`✅ [완료] ${this.defs[id].title}`, value:"qrep:"+id }));
    this.offerable(npcId).forEach(id=> out.push({ label:`❗ [의뢰] ${this.defs[id].title}`, value:"qoff:"+id }));
    return out;
  },

  /* 선택지 처리 (true 반환 시 소비) */
  handleChoice(v){
    if (!v || typeof v!=="string") return false;
    if (v.startsWith("qoff:")){ this._showOffer(v.slice(5)); return true; }
    if (v.startsWith("qrep:")){ this._report(v.slice(5)); return true; }
    return false;
  },

  _showOffer(id){
    const q=this.defs[id];
    Sound.sfx("blip");
    UI.startDialogue(DATA.NPCS[q.giver].icon+" "+DATA.NPCS[q.giver].name, q.start.concat([`<b>의뢰: ${q.title}</b><br>${q.desc}`]), {
      choices:[{label:"맡는다!",value:"y"},{label:"다음에…",value:"n"}],
      onChoice:(c)=>{ if(c==="y") Quests.accept(id); }
    });
  },

  accept(id){
    if (this.isActive(id)||this.isDone(id)) return;
    this.active.push(id); this.progress[id]=0;
    if (this.defs[id].goal.type==="talkAll") this._talked[id]=new Set();
    if (this.defs[id].goal.type==="gold") this.progress[id]=P.money;
    Sound.sfx("quest");
    toast(`📜 새 의뢰: ${this.defs[id].title}`,"gold");
  },

  _report(id){
    const q=this.defs[id], g=q.goal;
    if (!this.reached(id)){ toast("아직 조건을 채우지 못했다","bad"); return; }
    if (g.type==="deliver") Player.remove(g.item, g.count);
    this.active=this.active.filter(x=>x!==id);
    this.done.push(id);
    const r=q.reward; let lines=[];
    if (r.money){ P.money+=r.money; lines.push(`💰 ${r.money}냥`); }
    if (r.exp){ Player.gainExp(r.exp); lines.push(`⭐ 경험치 ${r.exp}`); }
    if (r.item){ Player.add(r.item.id, r.item.n); lines.push(`📦 ${DATA.GOODS[r.item.id]?DATA.GOODS[r.item.id].name:r.item.id} ×${r.item.n}`); }
    if (r.aff){ Player.addAffection(r.aff.npc, r.aff.n); lines.push(`♥ 정 +${r.aff.n}`); }
    if (r.weaponUpgrade){ P.weaponLv+=r.weaponUpgrade; lines.push(`⚒️ 무기 강화 +${r.weaponUpgrade}`); }
    if (r.magic && Player.learnMagic(r.magic)){ lines.push(`✨ 신통력 '${DATA.MAGIC[r.magic].name}'`); }
    if (r.pet){ P.pet = Object.assign({}, r.pet); World.initPet(); lines.push(`🐾 ${r.pet.name}(${r.pet.icon})이(가) 따라다닌다!`); }
    Sound.sfx(q.story?"fanfare":"quest");
    UI.startDialogue(DATA.NPCS[q.giver].icon+" "+DATA.NPCS[q.giver].name, q.ready.concat([`<b>보상</b> — ${lines.join(", ")}`]));
    UI.refreshHUD();
  },

  /* ---- 이벤트 알림 ---- */
  notify(ev, data){
    let completedNow=[];
    this.active.forEach(id=>{
      const q=this.defs[id], g=q.goal;
      const was=this.reached(id);
      if (ev==="talk" && g.type==="talkAll"){
        if (g.who.includes(data) && this._talked[id]){ this._talked[id].add(data); this.progress[id]=this._talked[id].size; }
      } else if (ev==="gather" && g.type==="gather"){ this.progress[id]+= (data.count||0);
      } else if (ev==="defeat" && g.type==="defeat"){
        const c = g.mon ? (data.ids||[]).filter(x=>x===g.mon).length : (data.ids||[]).length;
        this.progress[id]+= c;
      } else if (ev==="serve" && g.type==="serve"){ this.progress[id]+=1;
      } else if (ev==="sell" && g.type==="sell"){ this.progress[id]+=(data.count||0);
      } else if (ev==="gold" && g.type==="gold"){ /* reached()가 P.money로 판정 */ }
      if (!was && this.reached(id)) completedNow.push(id);
    });
    completedNow.forEach(id=>{ Sound.sfx("quest"); toast(`📜 의뢰 조건 달성! '${this.defs[id].title}' — ${DATA.NPCS[this.defs[id].giver].name}에게 보고하자`,"gold"); });
  },

  /* ---- 퀘스트 일지 (J) ---- */
  log(){
    let html="";
    if (!this.active.length && !this.done.length) html+=`<p class="note">아직 받은 의뢰가 없다. 마을 사람들과 대화해보자!</p>`;
    if (this.active.length){
      html+=`<h4 style="color:#e7c66b;margin:4px 0 8px">진행 중</h4>`;
      this.active.forEach(id=>{
        const q=this.defs[id], g=q.goal;
        let cur = g.type==="deliver"?Player.count(g.item) : g.type==="gold"?P.money : (this.progress[id]||0);
        const total = this.goalCount(g);
        const done=this.reached(id);
        html+=`<div class="shop-row"><div class="item-ic" style="background:#33240f">${q.story?"📖":"📜"}</div>
          <div class="grow"><div class="item-name">${q.title} ${done?'<span style="color:#58d68d">✓ 보고 가능</span>':''}</div>
          <div class="item-sub">${q.desc}</div>
          <div class="item-sub">진행도: ${Math.min(cur,total)} / ${total} · 의뢰인: ${DATA.NPCS[q.giver].name}</div></div></div>`;
      });
    }
    if (this.done.length){
      html+=`<h4 style="color:#9c8a68;margin:14px 0 8px">완료 (${this.done.length})</h4>`;
      this.done.forEach(id=>{ const q=this.defs[id];
        html+=`<div class="shop-row" style="opacity:.6"><div class="item-ic" style="background:#241a0e">✔️</div>
          <div class="grow"><div class="item-name">${q.title}</div></div></div>`; });
    }
    UI.openMenu("📜 의뢰 일지", html, null);
  },
};
