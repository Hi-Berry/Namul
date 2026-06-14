/* =========================================================================
 * 주막 장사 — 요리 타이쿤 미니게임 (씬: "trade")
 *  레시피: [메밀가루] → [나물(랜덤)] → [양념장] → 완성
 *  · 시작 시 기력 70 차감  · 손님 웨이브 순차 입장  · 빠른 서빙 보너스
 *  · 레시피/순서 불일치 = 재료 소모 + 보수 0  · 24:00 종료 정산
 * ======================================================================= */
const Trading = {
  active:false, queue:[], cur:null, plate:[], earnings:0, served:0, total:0,
  custT:0, custMax:0, msg:"", msgT:0, btns:[],

  begin(){
    Player.spendStamina(DATA.CONST.TRADE_STAMINA);
    // 손님 수: 날짜/레벨에 비례 (8~14명)
    this.total = clamp(8 + Math.floor(P.level*0.8) + (Time.dayOfSeason()===10?3:0), 8, 16);
    this.queue = [];
    for (let i=0;i<this.total;i++){
      const c = Object.assign({}, choice(DATA.CUSTOMERS));
      this.queue.push(c);
    }
    this.earnings=0; this.served=0; this.active=true; this.plate=[];
    this.msg=""; this.msgT=0;
    setScene("trade");
    this._next();
    toast("🍲 주막 장사 시작! 손님이 몰려온다","gold");
  },

  _next(){
    this.plate=[];
    if (this.queue.length===0){ this._finish(); return; }
    this.cur = this.queue.shift();
    this.custMax = this.cur.patience;
    this.custT = this.custMax;
  },

  _flash(t,kind){ this.msg=t; this.msgT=1.4; this.msgKind=kind; },

  addFlour(){ if (Player.count("flour")<=0){ Sound.sfx("error"); this._flash("메밀가루가 없다!","bad"); return; } Sound.sfx("cook"); this.plate.push({type:"flour",icon:"🌾"}); },
  addHerb(){
    const herbs = Player.herbList();
    if (!herbs.length){ Sound.sfx("error"); this._flash("나물이 없다!","bad"); return; }
    const id = choice(herbs);
    Sound.sfx("cook");
    this.plate.push({type:"herb", id, icon:DATA.HERBS[id].icon, tier:DATA.HERBS[id].tier});
  },
  addSeason(){ if (Player.count("season")<=0){ Sound.sfx("error"); this._flash("양념장이 없다!","bad"); return; } Sound.sfx("cook"); this.plate.push({type:"season",icon:"🥢"}); },
  clearPlate(){ this.plate=[]; },

  complete(){
    const p = this.plate;
    const ok = p.length===3 && p[0].type==="flour" && p[1].type==="herb" && p[2].type==="season";
    // 재료 소모 (성공/실패 무관 — 기획: 불일치 시에도 재료 소모)
    let usedHerb = null;
    p.forEach(it=>{
      if (it.type==="flour") Player.remove("flour",1);
      else if (it.type==="season") Player.remove("season",1);
      else if (it.type==="herb"){ Player.remove(it.id,1); usedHerb=it; }
    });
    if (ok){
      const secs = this.custMax - this.custT;
      const speed = DATA.servePayBonus(secs);
      const tierBonus = usedHerb.tier===3?1.8 : usedHerb.tier===2?1.3 : 1.0;
      const pay = Math.round(this.cur.basePay * speed * tierBonus);
      this.earnings += pay; P.money += pay; this.served++;
      Sound.sfx("money");
      Quests.notify("serve", {});
      Quests.notify("gold", {});
      this._flash(`+${pay}냥! (속도 ×${speed} · 나물 ×${tierBonus})`, "gold");
    } else {
      Sound.sfx("error");
      this._flash("주문이 틀렸다! 재료만 날렸다 (0냥)","bad");
    }
    this._next();
  },

  _leave(){ this._flash(`${this.cur.name}이(가) 화나서 떠났다 (0냥)`,"bad"); this._next(); },

  _finish(){
    this.active=false;
    const summary = [
      `오늘 장사 끝! 손님 <b>${this.served}/${this.total}</b>명 대접.`,
      `벌어들인 돈: <b>💰 ${this.earnings}냥</b>`,
      this.served>=this.total ? "완벽한 장사였어! 주모가 흐뭇해한다." : "다음 장날엔 재료를 더 넉넉히 준비하자."
    ];
    Player.gainExp(this.served*2);
    Player.addAffection("jumo", this.served>=this.total?2:1);
    // 하루를 거의 소진 — 밤이 깊었다
    G.time.min = Math.max(G.time.min, G.DAY_LEN - 30);
    setScene("world");
    UI.startDialogue("주모 🍶", summary, { onEnd(){ toast("밤이 깊었다. 집에서 자자.","gold"); } });
  },

  quit(){
    if (!this.active) return;
    this.active=false;
    setScene("world");
    UI.startDialogue("주모 🍶", [`장사를 접었다. 오늘 수입 <b>${this.earnings}냥</b>.`]);
    G.time.min = Math.max(G.time.min, G.DAY_LEN - 30);
  },

  /* ---------------- 씬 ---------------- */
  scene: {
    enter(){},
    update(dt){
      const T = Trading;
      if (!T.active) return;
      T.custT -= dt;
      if (T.msgT>0) T.msgT -= dt;
      if (T.custT <= 0) T._leave();
    },
    render(ctx){
      const T = Trading;
      // 배경
      ctx.fillStyle="#2a1c10"; ctx.fillRect(0,0,G.W,G.H);
      ctx.fillStyle="#3a2a16"; ctx.fillRect(0,120,G.W,260);
      ctx.fillStyle="#e7c66b"; ctx.font="bold 22px 'Malgun Gothic'"; ctx.textAlign="center";
      ctx.fillText("🍶 주 막 장 사", G.W/2, 50);
      ctx.font="13px 'Malgun Gothic'"; ctx.fillStyle="#cbb892";
      ctx.fillText(`벌이 💰${T.earnings}냥   ·   대접 ${T.served}/${T.total}   ·   재고 🌾${Player.count("flour")} 🥢${Player.count("season")} 🌿${Player.herbTotal()}`, G.W/2, 78);

      if (T.cur){
        // 손님
        ctx.font="64px serif"; ctx.fillText(T.cur.icon, G.W/2, 200);
        ctx.font="16px 'Malgun Gothic'"; ctx.fillStyle="#f3e9d2";
        ctx.fillText(T.cur.name, G.W/2, 230);
        // 주문 말풍선
        ctx.fillStyle="#f3e9d2"; ctx.font="14px 'Malgun Gothic'";
        ctx.fillText("\"메밀전 한 접시 주시오\"  (🌾→🌿→🥢)", G.W/2, 258);
        // 인내 바
        const bw=300, bx=G.W/2-bw/2, by=272;
        ctx.fillStyle="#2a2016"; ctx.fillRect(bx,by,bw,12);
        const r=clamp(T.custT/T.custMax,0,1);
        ctx.fillStyle = r>0.5?"#58d68d":r>0.25?"#e7c66b":"#e74c3c";
        ctx.fillRect(bx,by,bw*r,12);

        // 접시
        ctx.fillStyle="#cbb892"; ctx.font="13px 'Malgun Gothic'"; ctx.fillText("접시:", G.W/2-150, 330);
        ctx.font="30px serif"; ctx.textAlign="left";
        T.plate.forEach((it,i)=> ctx.fillText(it.icon, G.W/2-110+i*44, 340));
        ctx.textAlign="center";
      }

      // 메시지
      if (T.msgT>0){
        ctx.font="bold 18px 'Malgun Gothic'";
        ctx.fillStyle = T.msgKind==="gold"?"#ffe89a":T.msgKind==="bad"?"#f5b0a8":"#fff";
        ctx.fillText(T.msg, G.W/2, 375);
      }

      // 버튼
      T.btns = [
        { x:90,  y:430, w:120, h:56, label:"🌾 메밀가루", act:"flour", c:"#4a7a3a" },
        { x:230, y:430, w:120, h:56, label:"🌿 나물",     act:"herb",  c:"#3a6a4a" },
        { x:370, y:430, w:120, h:56, label:"🥢 양념장",   act:"season",c:"#6a5a2a" },
        { x:510, y:430, w:120, h:56, label:"✅ 완성!",    act:"done",  c:"#b5852a" },
        { x:650, y:430, w:120, h:56, label:"🗑 비우기",   act:"clear", c:"#5a3a3a" },
        { x:G.W/2-70, y:512, w:140, h:40, label:"장사 접기", act:"quit", c:"#444" },
      ];
      T.btns.forEach(b=>{
        const hot = G.mouse.x>=b.x&&G.mouse.x<=b.x+b.w&&G.mouse.y>=b.y&&G.mouse.y<=b.y+b.h;
        ctx.fillStyle = hot ? "#000" : b.c;
        ctx.fillRect(b.x-2,b.y-2,b.w+4,b.h+4);
        ctx.fillStyle = b.c; if(hot) ctx.fillStyle = Trading._lighten(b.c);
        ctx.fillRect(b.x,b.y,b.w,b.h);
        ctx.fillStyle="#fff"; ctx.font="14px 'Malgun Gothic'"; ctx.textAlign="center";
        ctx.fillText(b.label, b.x+b.w/2, b.y+b.h/2+5);
      });
      ctx.textAlign="left";
    },
    click(x,y){
      const T = Trading;
      for (const b of T.btns){
        if (x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){
          if (b.act==="flour") T.addFlour();
          else if (b.act==="herb") T.addHerb();
          else if (b.act==="season") T.addSeason();
          else if (b.act==="done") T.complete();
          else if (b.act==="clear") T.clearPlate();
          else if (b.act==="quit") T.quit();
          return;
        }
      }
    },
    key(e){
      const T = Trading;
      if (e.key==="1") T.addFlour();
      else if (e.key==="2") T.addHerb();
      else if (e.key==="3") T.addSeason();
      else if (e.key==="Enter"||e.key===" ") T.complete();
      else if (e.key==="Backspace") T.clearPlate();
      else if (e.key==="Escape") T.quit();
    },
  },

  _lighten(c){
    const m=c.match(/\w\w/g); if(!m) return c;
    return "#"+m.map(h=>clamp(parseInt(h,16)+40,0,255).toString(16).padStart(2,"0")).join("");
  },
};
