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
             "네 마리만 잡아 산을 달래거라. 그럼 당나무 제단에 바칠 공물을 보태주마."],
      ready:["산이 한결 잠잠해졌구나. 자, 공물에 보태거라."],
      reward:{ money:120, exp:25, item:{id:"cold_mist",n:8} },
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
      giver:"chonjang", story:true, prereq:"q_pet", title:"두억시니 토벌",
      desc:"깊은 숲(산 3구역)의 두억시니를 물리치기.",
      goal:{ type:"defeat", count:1, mon:"dueok" },
      start:["큰일일세! 깊은 숲에 두억시니가 나타나 마을을 노린다네.",
             "태산 같은 놈이라 '태산 압사' 같은 강한 신통력이 필요할 게야. 부디 물리쳐주게!"],
      ready:["두억시니를 잡았다고?! 자네는 이 마을의 은인일세!!"],
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
      goal:{ type:"defeat", count:3, mon:"dokkaebi_m" },
      start:["글쎄 도깨비 녀석들이 내 신당 앞에서 씨름 내기를 걸지 뭐냐!","산 입구에서 세 놈만 혼쭐을 내주렴. 분이 풀리게."],
      ready:["깔깔! 그 녀석들 코가 납작해졌겠구나. 자, 공물에 보태거라."],
      reward:{ money:130, exp:18, item:{id:"fox_orb",n:3} },
    },

    /* ---------- 요리/경영 진행 ---------- */
    s_firstcook: {
      giver:"jumo", prereq:"q_jumo", title:"메뉴를 늘려라",
      desc:"새 요리 레시피를 3가지 이상 익히기. (주모·방앗간·푸줏간·보부상에게 배움)",
      goal:{ type:"recipes", count:5 }, // 기본 2 + 3가지
      start:["메밀전 하나로는 단골이 안 늘어! 다른 음식도 배워보게.","나한테도, 방앗간·푸줏간·보부상한테도 배울 게 많지."],
      ready:["메뉴가 푸짐해졌구먼! 손님들이 좋아하겠어."],
      reward:{ money:120, exp:10, item:{id:"season",n:8} },
    },
    s_master: {
      giver:"hunjang", title:"요리 명인의 길",
      desc:"요리 숙련을 Lv.3까지 올리기. (장사로 손님을 많이 대접)",
      goal:{ type:"cooklv", count:3 },
      start:["솜씨는 갈고닦아야 느는 법. 장사로 손님을 많이 치러 숙련을 쌓거라.","경지에 이르면 같은 음식도 값을 더 받지."],
      ready:["허허, 이젠 명인 소리 듣겠구나!"],
      reward:{ money:200, exp:20 },
    },
    s_fame: {
      giver:"chonjang", prereq:"q_jumo", title:"마을의 명물",
      desc:"명성 40 달성. (장사·의뢰로 이름을 알리기)",
      goal:{ type:"fame", count:40 },
      start:["자네 주막이 제법 소문이 났더군. 마을의 명물이 되어보게!","명성 마흔이면 인근에 자자할 걸세."],
      ready:["이제 자네 모르는 이가 없네그려!"],
      reward:{ money:300, exp:25, aff:{npc:"chonjang",n:2} },
    },
    s_feast: {
      giver:"pujut", prereq:"q_smith", title:"사또의 잔칫상",
      desc:"국밥을 3그릇 대접하기. (푸줏간에서 국밥 배우고 돼지고기 준비)",
      goal:{ type:"serve", count:3, dish:"gukbap" },
      start:["사또께서 국밥 맛집을 찾으신다네! 자네가 한번 해보게.","국밥 레시피랑 돼지고기는 내가 대줄 테니."],
      ready:["국밥 솜씨가 일품이라고 사또께서 칭찬이 자자하네!"],
      reward:{ money:260, exp:20, item:{id:"pork",n:3} },
    },

    /* ---------- 장날 게스트 퀘스트 (#2, prereq 순차) ---------- */
    s_uijeok_jeon: {
      giver:"hong", title:"의적의 요기거리",
      desc:"주막에서 메밀 나물전 5개 대접하기.",
      goal:{ type:"serve", count:5, dish:"jeon" },
      start:["이 몸은 의적 홍길동! 굶주린 식솔들에게 따뜻한 전 한 장이 절실하오.","메밀 나물전 다섯이면 의기가 솟겠소!"],
      ready:["과연 인심도 솜씨도 의적단의 벗이오!"],
      reward:{ money:140, exp:14, item:{id:"bean",n:5} },
    },
    s_uijeok_bean: {
      giver:"hong", prereq:"s_uijeok_jeon", title:"의적의 비상식량",
      desc:"녹두 10개를 의적단에 납품하기.",
      goal:{ type:"deliver", item:"bean", count:10 },
      start:["산채로 숨어드는 식솔들 비상식량으로 녹두가 으뜸이오.","녹두 열 되만 모아주시오. 값은 후히 치르리다."],
      ready:["이 녹두로 한겨울은 든든하겠소. 고맙소!"],
      reward:{ money:180, exp:16, item:{id:"season",n:5} },
    },
    s_uijeok_sanjeok: {
      giver:"hong", prereq:"s_uijeok_bean", title:"의적단의 고기 파티",
      desc:"주막에서 산적 4꼬치 대접하기.",
      goal:{ type:"serve", count:4, dish:"sanjeok" },
      start:["오늘은 거사 전야! 식솔들에게 고기 한 점 먹이고 싶소.","산적 네 꼬치면 사기충천이오!"],
      ready:["하하, 이 맛이오! 의적단의 은인으로 기억하리다.","(붉은 뿔 조각을 답례로 건넨다)"],
      reward:{ money:240, exp:22, item:{id:"red_horn",n:2} },
    },
    s_daegam_ju: {
      giver:"daegam", title:"양반 대감의 주연",
      desc:"주막에서 동동주 3사발 대접하기.",
      goal:{ type:"serve", count:3, dish:"dongdongju" },
      start:["험험, 이 고을 제일의 미식가가 바로 날세.","제대로 빚은 동동주 석 잔을 맛보여 주게나."],
      ready:["크으— 이 풍류! 자네 솜씨를 인정하네."],
      reward:{ money:220, exp:18, item:{id:"nuruk",n:4} },
    },
    s_daegam_noodle: {
      giver:"daegam", prereq:"s_daegam_ju", title:"대감댁 잔치국수",
      desc:"주막에서 칼국수 4그릇 대접하기.",
      goal:{ type:"serve", count:4, dish:"kalguksu" },
      start:["대감댁 잔치에 손이 모자라다네. 잔치국수 솜씨 좀 빌리세.","칼국수 네 그릇을 부탁하네."],
      ready:["손님들이 면발을 칭찬하더군. 역시 자넬세!"],
      reward:{ money:260, exp:20, item:{id:"noodle",n:4} },
    },
    s_daegam_jogi: {
      giver:"daegam", prereq:"s_daegam_noodle", title:"대감댁 귀빈 대접",
      desc:"주막에서 조기구이 3마리 대접하기.",
      goal:{ type:"serve", count:3, dish:"jogi" },
      start:["귀한 손님이 오시네. 노릇하게 구운 조기 세 마리면 체면이 서지.","상등품으로 부탁하네!"],
      ready:["귀빈께서 흡족해하셨네! 이 산삼은 자네 몫일세."],
      reward:{ money:320, exp:24, item:{id:"sansam",n:1} },
    },
    s_sorikkun_muk: {
      giver:"sori", title:"소리꾼의 목풀기",
      desc:"주막에서 도토리묵 3접시 대접하기.",
      goal:{ type:"serve", count:3, dish:"dotorimuk" },
      start:["얼쑤! 한 가락 뽑기 전에 목을 축여야지.","쫄깃한 도토리묵 세 접시면 득음이 따로 없네!"],
      ready:["좋다— 목이 트였네! 자네 덕에 명창 소리 듣겠어."],
      reward:{ money:150, exp:14, item:{id:"dotori",n:5} },
    },
    s_sorikkun_pajeon: {
      giver:"sori", prereq:"s_sorikkun_muk", title:"소리꾼의 장터 잔치",
      desc:"주막에서 파전 4장 대접하기.",
      goal:{ type:"serve", count:4, dish:"pajeon" },
      start:["장터 한마당 신명나게 놀아보세! 비 오는 날엔 역시 파전이지.","바삭한 파전 넉 장이면 흥이 오르겠네."],
      ready:["지화자! 온 장터가 들썩였네그려!"],
      reward:{ money:200, exp:18, item:{id:"pa",n:6} },
    },
    s_namukkun_snack: {
      giver:"namu", title:"나무꾼의 든든한 새참",
      desc:"주막에서 주먹밥 4덩이 대접하기.",
      goal:{ type:"serve", count:4, dish:"jumeokbap" },
      start:["벌목 일이 고되서 말이오. 든든한 새참이 필요하오.","주먹밥 네 덩이면 한나절은 거뜬하지!"],
      ready:["크, 손에 쥐고 먹기 딱이오. 힘이 솟는구려!"],
      reward:{ money:130, exp:12, item:{id:"rice",n:6} },
    },
    s_namukkun_flour: {
      giver:"namu", prereq:"s_namukkun_snack", title:"나무꾼의 메밀가루",
      desc:"메밀가루 12개를 나무꾼에게 납품하기.",
      goal:{ type:"deliver", item:"flour", count:12 },
      start:["산막 식구들 메밀국수라도 해 먹이려는데 가루가 모자라오.","메밀가루 열두 줌만 구해주시오!"],
      ready:["이만하면 겨우내 든든하오. 큰 신세를 졌소!"],
      reward:{ money:220, exp:18, item:{id:"deulgireum",n:3} },
    },
  },

  /* ---- 초기화/저장 ---- */
  init(){ this.active=[]; this.done=[]; this.progress={}; this._talked={}; this._announced=new Set(); },
  save(){ return { active:this.active, done:this.done, progress:this.progress, talked:Object.fromEntries(Object.entries(this._talked).map(([k,v])=>[k,[...v]])) }; },
  restore(d){ if(!d){ this.init(); return; } this.active=d.active||[]; this.done=d.done||[]; this.progress=d.progress||{};
    this._talked={}; if(d.talked) for(const k in d.talked) this._talked[k]=new Set(d.talked[k]);
    this._announced=new Set(this.active.filter(id=>this.reached(id))); },

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
    if (g.type==="fame") return P.fame >= g.count;
    if (g.type==="cooklv") return Player.cookLv() >= g.count;
    if (g.type==="recipes") return P.recipes.length >= g.count;
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
    if (r.item){ Player.add(r.item.id, r.item.n); const def=DATA.INGREDIENTS[r.item.id]||DATA.GOODS[r.item.id]||DATA.DROPS[r.item.id]||DATA.HERBS[r.item.id]; lines.push(`📦 ${def?def.name:r.item.id} ×${r.item.n}`); }
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
    if (!this._announced) this._announced=new Set();
    this.active.forEach(id=>{
      const q=this.defs[id], g=q.goal;
      if (ev==="talk" && g.type==="talkAll"){
        if (g.who.includes(data) && this._talked[id]){ this._talked[id].add(data); this.progress[id]=this._talked[id].size; }
      } else if (ev==="gather" && g.type==="gather"){ this.progress[id]+= (data.count||0);
      } else if (ev==="defeat" && g.type==="defeat"){
        const c = g.mon ? (data.ids||[]).filter(x=>x===g.mon).length : (data.ids||[]).length;
        this.progress[id]+= c;
      } else if (ev==="serve" && g.type==="serve"){ if(!g.dish || g.dish===(data&&data.dish)) this.progress[id]+=1;
      } else if (ev==="sell" && g.type==="sell"){ this.progress[id]+=(data.count||0);
      }
      // 상태 기반(gold/fame/cooklv/recipes)은 reached()가 직접 판정
      if (this.reached(id) && !this._announced.has(id)){ this._announced.add(id); completedNow.push(id); }
    });
    completedNow.forEach(id=>{ Sound.sfx("quest"); toast(`📜 의뢰 조건 달성! '${this.defs[id].title}' — ${DATA.NPCS[this.defs[id].giver].name}에게 보고하자`,"gold"); });
  },

  /* 화면 추적기용 진행 요약 (활성 퀘스트) */
  trackerLines(){
    return this.active.map(id=>{
      const q=this.defs[id], g=q.goal, total=this.goalCount(g);
      const cur = g.type==="deliver"?Player.count(g.item) : g.type==="gold"?P.money
               : g.type==="fame"?P.fame : g.type==="cooklv"?Player.cookLv() : g.type==="recipes"?P.recipes.length
               : (this.progress[id]||0);
      return { title:q.title, cur:Math.min(cur,total), total, done:this.reached(id), giver:DATA.NPCS[q.giver].name };
    });
  },

  /* ---- 퀘스트 일지 (J) ---- */
  log(){
    let html="";
    if (!this.active.length && !this.done.length) html+=`<p class="note">아직 받은 의뢰가 없다. 마을 사람들과 대화해보자!</p>`;
    if (this.active.length){
      html+=`<h4 style="color:#e7c66b;margin:4px 0 8px">진행 중</h4>`;
      this.active.forEach(id=>{
        const q=this.defs[id], g=q.goal;
        let cur = g.type==="deliver"?Player.count(g.item) : g.type==="gold"?P.money
                : g.type==="fame"?P.fame : g.type==="cooklv"?Player.cookLv() : g.type==="recipes"?P.recipes.length
                : (this.progress[id]||0);
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
