/* =========================================================================
 * 주막 장사 — 요리 타이쿤 (씬: "trade")  [장날 오후 전용]
 *  손님이 '특정 음식'을 주문 → 레시피(재료 순서)대로 넣고 완성
 *  · 시작 시 기력 70 차감  · 손님 웨이브  · 빠른 서빙·요리 숙련 보너스
 *  · 순서/재료 불일치 = 재료 소모 + 0냥
 * ======================================================================= */
const Trading = {
  active:false, queue:[], cur:null, dish:null, plate:[], earnings:0, served:0, total:0,
  custT:0, custMax:0, msg:"", msgT:0, msgKind:"", btns:[],

  menu(){ return P.recipes.map(id=>DATA.RECIPES[id]).filter(Boolean); },
  ingredientsInMenu(){ const set=new Set(); this.menu().forEach(r=> r.steps.forEach(s=> set.add(s))); return [...set]; },

  begin(){
    if (!Player.hasStamina(DATA.CONST.TRADE_STAMINA)){ toast("기력이 부족하다 (70 필요)","bad"); return; }
    Player.spendStamina(DATA.CONST.TRADE_STAMINA);
    this.total = clamp(8 + Player.cookLv() + Math.floor(P.fame/8) + (Time.dayOfSeason()===10?2:0), 8, 18);
    this.queue = [];
    for (let i=0;i<this.total;i++) this.queue.push(Object.assign({}, choice(DATA.CUSTOMERS)));
    this.earnings=0; this.served=0; this.active=true; this.plate=[]; this.msg=""; this.msgT=0;
    setScene("trade");
    this._next();
    toast("🍲 주막 장사 시작! 손님이 몰려온다","gold");
  },

  _pickDish(c){
    const menu=this.menu(); let pool=menu;
    if (c.veggie) pool=menu.filter(r=>!r.meat);
    if (c.wants && Player.hasRecipe(c.wants)){ const w=DATA.RECIPES[c.wants]; if(!(c.veggie&&w.meat)) return w; }
    if (!pool.length) pool=menu;
    return choice(pool);
  },

  _next(){
    this.plate=[];
    if (this.queue.length===0){ this._finish(); return; }
    this.cur=this.queue.shift(); this.dish=this._pickDish(this.cur);
    this.custMax=this.cur.patience; this.custT=this.custMax;
  },

  _flash(t,kind){ this.msg=t; this.msgT=1.5; this.msgKind=kind; },
  stock(id){ return id==="namul" ? Player.herbTotal() : Player.count(id); },
  inPlate(id){ return this.plate.filter(p=>p===id).length; },

  addIng(id){
    if (this.stock(id)-this.inPlate(id) <= 0){ Sound.sfx("error"); this._flash(`${DATA.INGREDIENTS[id].name}이(가) 없다!`,"bad"); return; }
    Sound.sfx("cook"); this.plate.push(id);
  },
  clearPlate(){ this.plate=[]; },

  _consume(){ this.plate.forEach(id=>{ if(id==="namul"){ const h=Player.herbList()[0]; if(h)Player.remove(h,1);} else Player.remove(id,1); }); },

  complete(){
    if (!this.dish) return;
    const want=this.dish.steps;
    const ok = this.plate.length===want.length && want.every((s,i)=> this.plate[i]===s);
    this._consume();
    if (ok){
      const secs=this.custMax-this.custT, speed=DATA.servePayBonus(secs);
      const cookB=DATA.cookPayBonus(P.cookXp)+(P.cookTrain||0);
      const pay=Math.round(this.dish.price*speed*(this.cur.payMult||1)*cookB)+(this.cur.tip||0);
      this.earnings+=pay; P.money+=pay; this.served++;
      P.cookXp+=DATA.CONST.COOK_XP_PER_SERVE; P.fame+=DATA.CONST.FAME_PER_SERVE;
      Sound.sfx("money"); Quests.notify("serve",{dish:this.dish.id}); Quests.notify("gold",{});
      this._flash(`${this.dish.icon}${this.dish.name} +${pay}냥! (속도 ×${speed})`,"gold");
    } else { Sound.sfx("error"); this._flash(`주문(${this.dish.name})과 다르다! 재료만 날렸다 (0냥)`,"bad"); }
    this._next();
  },

  _leave(){ this._flash(`${this.cur.name}이(가) 화나서 떠났다 (0냥)`,"bad"); this._next(); },

  _finish(){
    this.active=false;
    const summary=[
      `오늘 장사 끝! 손님 <b>${this.served}/${this.total}</b>명 대접.`,
      `벌이 <b>💰 ${this.earnings}냥</b> · 요리 숙련 Lv.${Player.cookLv()} · 명성 ${P.fame}`,
      this.served>=this.total ? "완벽한 장사였어! 주모가 흐뭇해한다." : "다음 장날엔 재료를 더 넉넉히!"
    ];
    Player.gainExp(this.served*2);
    Player.addAffection("jumo", this.served>=this.total?2:1);
    G.time.min=Math.max(G.time.min, G.DAY_LEN-30);
    setScene("world");
    UI.startDialogue("주모 🍶", summary, { onEnd(){ toast("밤이 깊었다. 집에서 자자.","gold"); } });
  },

  quit(){
    if (!this.active) return;
    this.active=false; setScene("world");
    UI.startDialogue("주모 🍶", [`장사를 접었다. 오늘 수입 <b>${this.earnings}냥</b>.`]);
    G.time.min=Math.max(G.time.min, G.DAY_LEN-30);
  },

  /* ---------------- 씬 ---------------- */
  scene: {
    enter(){},
    update(dt){ const T=Trading; if(!T.active)return; T.custT-=dt; if(T.msgT>0)T.msgT-=dt; if(T.custT<=0)T._leave(); },
    render(ctx){
      const T=Trading;
      ctx.fillStyle="#2a1c10"; ctx.fillRect(0,0,G.W,G.H);
      ctx.fillStyle="#3a2a16"; ctx.fillRect(0,108,G.W,250);
      ctx.fillStyle="#e7c66b"; ctx.font="bold 21px 'Malgun Gothic'"; ctx.textAlign="center"; ctx.fillText("🍶 주 막 장 사", G.W/2, 38);
      ctx.font="12px 'Malgun Gothic'"; ctx.fillStyle="#cbb892";
      ctx.fillText(`벌이 💰${T.earnings}   ·   대접 ${T.served}/${T.total}   ·   요리Lv ${Player.cookLv()} · 명성 ${P.fame}`, G.W/2, 62);
      if (T.cur && T.dish){
        ctx.font="50px serif"; ctx.fillText(T.cur.icon, G.W/2, 144);
        ctx.font="14px 'Malgun Gothic'"; ctx.fillStyle="#f3e9d2"; ctx.fillText(T.cur.name, G.W/2, 166);
        ctx.font="15px 'Malgun Gothic'"; ctx.fillStyle="#ffe89a"; ctx.fillText(`"${T.dish.icon} ${T.dish.name} 주시오"`, G.W/2, 194);
        ctx.font="20px serif"; const steps=T.dish.steps;
        steps.forEach((s,i)=> ctx.fillText(DATA.INGREDIENTS[s].icon+(i<steps.length-1?" →":""), G.W/2-(steps.length-1)*26+i*52, 220));
        const bw=300,bx=G.W/2-bw/2,by=234; ctx.fillStyle="#2a2016"; ctx.fillRect(bx,by,bw,11);
        const r=clamp(T.custT/T.custMax,0,1); ctx.fillStyle=r>0.5?"#58d68d":r>0.25?"#e7c66b":"#e74c3c"; ctx.fillRect(bx,by,bw*r,11);
        ctx.fillStyle="#cbb892"; ctx.font="12px 'Malgun Gothic'"; ctx.textAlign="left"; ctx.fillText("접시:", G.W/2-150, 292);
        ctx.font="26px serif"; T.plate.forEach((id,i)=> ctx.fillText(DATA.INGREDIENTS[id].icon, G.W/2-110+i*40, 300)); ctx.textAlign="center";
      }
      if (T.msgT>0){ ctx.font="bold 16px 'Malgun Gothic'"; ctx.fillStyle=T.msgKind==="gold"?"#ffe89a":T.msgKind==="bad"?"#f5b0a8":"#fff"; ctx.fillText(T.msg, G.W/2, 334); }

      T.btns=[]; const ings=T.ingredientsInMenu();
      const perRow=6, bw2=118, bh=44, gap=8, startY=360;
      ings.forEach((id,i)=>{
        const col=i%perRow,row=Math.floor(i/perRow);
        const cnt=Math.min(perRow, ings.length-row*perRow);
        const totalW=cnt*(bw2+gap)-gap; const x=(G.W-totalW)/2+col*(bw2+gap), y=startY+row*(bh+gap);
        T.btns.push({x,y,w:bw2,h:bh,act:"ing",id,label:DATA.INGREDIENTS[id].icon+" "+DATA.INGREDIENTS[id].name,stock:T.stock(id)});
      });
      const ay=startY+Math.ceil(ings.length/perRow)*(bh+gap)+8;
      T.btns.push({x:G.W/2-252,y:ay,w:150,h:40,act:"done",label:"✅ 완성!",c:"#b5852a"});
      T.btns.push({x:G.W/2-92,y:ay,w:120,h:40,act:"clear",label:"🗑 비우기",c:"#5a3a3a"});
      T.btns.push({x:G.W/2+48,y:ay,w:200,h:40,act:"quit",label:"장사 접기",c:"#444"});
      T.btns.forEach(b=>{
        const hot=G.mouse.x>=b.x&&G.mouse.x<=b.x+b.w&&G.mouse.y>=b.y&&G.mouse.y<=b.y+b.h;
        const base=b.c||(b.act==="ing"?(b.stock>0?"#4a6a3a":"#3a3228"):"#3a2c1a");
        ctx.fillStyle=hot?Trading._lighten(base):base; ctx.fillRect(b.x,b.y,b.w,b.h);
        ctx.strokeStyle="#6b5736"; ctx.strokeRect(b.x,b.y,b.w,b.h);
        ctx.fillStyle=(b.act==="ing"&&b.stock<=0)?"#776":"#fff"; ctx.font="13px 'Malgun Gothic'"; ctx.textAlign="center";
        ctx.fillText(b.label, b.x+b.w/2, b.y+b.h/2+ (b.act==="ing"?-1:4));
        if (b.act==="ing"){ ctx.font="10px 'Malgun Gothic'"; ctx.fillStyle="#cbb892"; ctx.fillText("재고 "+b.stock, b.x+b.w/2, b.y+b.h-5); }
      });
      ctx.textAlign="left";
    },
    click(x,y){
      const T=Trading;
      for(const b of T.btns){ if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){
        if(b.act==="ing")T.addIng(b.id); else if(b.act==="done")T.complete();
        else if(b.act==="clear")T.clearPlate(); else if(b.act==="quit")T.quit(); return;
      }}
    },
    key(e){
      const T=Trading, ings=T.ingredientsInMenu();
      if (/^[1-9]$/.test(e.key)){ const i=+e.key-1; if(i<ings.length)T.addIng(ings[i]); }
      else if (e.key==="Enter"||e.key===" ")T.complete();
      else if (e.key==="Backspace")T.clearPlate();
      else if (e.key==="Escape")T.quit();
    },
  },

  _lighten(c){ const m=c.match(/\w\w/g); if(!m)return c; return "#"+m.map(h=>clamp(parseInt(h,16)+40,0,255).toString(16).padStart(2,"0")).join(""); },
};
