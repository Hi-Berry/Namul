/* =========================================================================
 * 전투 — 턴제 (씬: "combat")
 *  · 턴 순서 = 속도(민첩 - 무기 무게)  · 무기/마법/방어/도망
 *  · 기절·홀림·둔화 상태이상  · 패배 시: 산 입구 귀환 / 시간 -5h / 약초 50% 손실
 * ======================================================================= */
const Combat = {
  enemies:[], order:[], ptr:0, phase:"idle", // idle|menu|magic|busy|end
  log:"", busyT:0, after:null, defending:false,
  preStamina:100, onWin:null, onLose:null, btns:[],

  pStatus:{slow:0},
  begin(monIds, opts){
    opts = opts || {};
    this.enemies = monIds.map((id,i)=>{
      const m = DATA.MONSTERS[id];
      return { ...m, hp:m.hp, maxHp:m.hp, alive:true, slot:i,
        status:{stun:0,charm:0,slow:0,burn:0,atkDown:0}, taesan:0, hitT:0 };
    });
    this.pStatus = { slow:0 };
    this.preStamina = P.stamina;
    this.defending=false; this.onWin=opts.onWin; this.onLose=opts.onLose;
    this.log = `요괴 ${this.enemies.length}마리가 나타났다!`;
    this.busyT = 1.0; this.phase="busy"; this.after=()=>this._startRound();
    Time.advance(30); // 전투는 게임시간 30분
    setScene("combat");
  },

  pSpeed(){ let s = 12 + P.level*2 - Player.weaponData().weight*1.5; if (this.pStatus.slow>0) s*=0.6; return s; },
  eSpeed(e){ let s = 7 + e.atk*0.25; if (e.status.slow>0) s*=0.5; return s; },
  livingEnemies(){ return this.enemies.filter(e=>e.alive); },

  _startRound(){
    // 행동 순서: 살아있는 적 + 플레이어, 속도 내림차순
    const actors = [{ kind:"player", spd:this.pSpeed() }];
    this.livingEnemies().forEach(e=> actors.push({ kind:"enemy", e, spd:this.eSpeed(e) }));
    actors.sort((a,b)=> b.spd - a.spd);
    this.order = actors; this.ptr = 0;
    this.defending = false;
    if (this.pStatus.slow>0) this.pStatus.slow--;  // 플레이어 민첩 저하 회복
    this._processNext();
  },

  _processNext(){
    if (this._checkEnd()) return;
    if (this.ptr >= this.order.length){ this._startRound(); return; }
    const a = this.order[this.ptr];
    if (a.kind==="player"){ this.phase="menu"; this.log="무엇을 할 텐가?"; return; }
    // 적 차례
    const e = a.e;
    if (!e.alive){ this.ptr++; return this._processNext(); }
    // 화상 DoT (턴 시작 시)
    if (e.status.burn>0){
      const bd = Math.max(1, Math.round(e.maxHp*0.05));
      e.hp -= bd; e.hitT=0.3; e.status.burn--;
      if (e.hp<=0){ e.alive=false; e.hp=0; this._say(`🔥 ${e.icon}${e.name}이(가) 화상으로 쓰러졌다! (-${bd})`); return; }
    }
    if (e.status.charm>0){ e.status.charm--; this._say(`${e.icon}${e.name}은(는) 홀려서 멍하니 서 있다.`); return; }
    if (e.status.stun>0){ e.status.stun--; this._say(`💫 ${e.icon}${e.name}은(는) 기절해 움직이지 못한다.`); return; }
    if (e.status.slow>0) e.status.slow--;
    if (e.status.atkDown>0) e.status.atkDown--;

    // 두억시니: 3턴마다 '태산 찍기' (즉사급 광역)
    if (e.gimmick==="taesan"){
      e.taesan = (e.taesan||0) + 1;
      if (e.taesan % 3 === 0){
        let big = Math.round(P.maxHp * 0.6);
        if (this.defending) big = Math.round(big*0.5);
        P.hp = clamp(P.hp - big, 0, P.maxHp);
        Sound.sfx("enemyhit");
        this._say(`🗿 ${e.name}의 『태산 찍기』! 대지가 흔들린다! 체력 -${big}`, 1.3);
        return;
      }
    }
    // 명중 판정
    if (Math.random() > (e.acc!=null?e.acc:0.9)){ this._say(`${e.icon}${e.name}의 공격이 빗나갔다!`); return; }
    // 도깨비 장난: 가끔 기력을 훔침
    if (e.gimmick==="mischief" && chance(0.4)){
      const st = randInt(1,2); Player.spendStamina(st);
      this._say(`😈 ${e.name}의 『장난』! 기력 -${st}`); return;
    }
    // 일반 공격 (공격력 감소 디버프 반영)
    let atk = e.atk * (e.status.atkDown>0?0.8:1);
    let dmg = Math.round(atk) + randInt(-2,2);
    if (this.defending) dmg = Math.round(dmg*0.5);
    dmg = Math.max(1,dmg);
    P.hp = clamp(P.hp - dmg, 0, P.maxHp);
    Sound.sfx("enemyhit");
    let suf="";
    // 물귀신: 피격 시 민첩 하락
    if (e.gimmick==="agiDown"){ this.pStatus.slow = 2; suf=" 으슬… 민첩이 떨어졌다!"; }
    this._say(`${e.icon}${e.name}의 공격! 체력 -${dmg}${suf}`);
  },

  _say(msg, t){ this.log=msg; this.busyT = t||0.9; this.phase="busy"; this.after=()=>{ this.ptr++; this._processNext(); }; },

  // 플레이어 행동 ---------------------------------------
  _needTarget:false,
  attack(){
    if (this.phase!=="menu") return;
    // 가장 앞(살아있는) 적 공격
    const e = this.livingEnemies()[0]; if (!e) return;
    const w = Player.weaponData();
    // 구미호: 물리 공격 50% 회피
    if (e.gimmick==="evasion" && chance(0.5)){
      Sound.sfx("cancel");
      this._say(`${e.icon}${e.name}이(가) 환영으로 물리 공격을 흘렸다! (마법이 필요하다)`);
      return;
    }
    let dmg = w.atk + randInt(-2,3);
    e.hp -= dmg; e.hitT=0.3;
    let extra="";
    if (w.stun && chance(w.stun)){ e.status.stun = 1; extra=" 💫기절!"; }
    if (e.hp<=0){ e.alive=false; e.hp=0; extra=" 쓰러뜨렸다!"; }
    Sound.sfx("hit");
    this.swingT = 0.45;   // 낫 휘두르기 프레임
    this._say(`${w.icon}${w.name}(으)로 ${e.icon}${e.name} 공격! -${dmg}${extra}`);
  },
  defend(){
    if (this.phase!=="menu") return;
    this.defending=true;
    this._say(`방어 자세! 이번 턴 피해 감소.`);
  },
  openMagic(){
    if (this.phase!=="menu") return;
    if (!P.magic.length){ toast("배운 신통력이 없다","bad"); return; }
    this.phase="magic";
  },
  castMagic(id){
    const m = DATA.MAGIC[id];
    if (P.mp < m.mp){ toast("신력이 부족하다","bad"); this.phase="menu"; return; }
    P.mp -= m.mp;
    // 타겟: 전체 or 랜덤 2체 (마법은 구미호 환영 무시, 반드시 적중)
    let living = this.livingEnemies();
    let targets;
    if (m.target==="all") targets = living;
    else { // 랜덤 2체
      const pool = living.slice(); targets=[];
      for (let i=0;i<(m.target||2) && pool.length;i++) targets.push(pool.splice(randInt(0,pool.length-1),1)[0]);
    }
    targets.forEach(e=>{
      if (m.dmg){
        let d = m.dmg + randInt(-2,2);
        if (e.gimmick==="evasion") d = Math.round(d*1.3); // 구미호엔 추가 피해
        e.hp -= d; e.hitT=0.3; if(e.hp<=0){e.alive=false;e.hp=0;}
      }
      if (m.effect==="burn")    e.status.burn = m.eff;
      if (m.effect==="agiDown") e.status.slow = m.eff;
      if (m.effect==="stun")    e.status.stun = m.eff;
      if (m.effect==="atkDown") e.status.atkDown = m.eff;
    });
    Sound.sfx("magic");
    let txt = `${m.icon}${m.name}(${m.sub})! `;
    txt += m.target==="all" ? "적 전체를 휩쓴다!" : `적 ${targets.length}체 강타!`;
    const efl = {burn:" 🔥화상",agiDown:" ❄️민첩↓",stun:" 💫기절",atkDown:" ⛰️공격력↓"}[m.effect];
    if (efl) txt += efl;
    this.phase="menu";
    this._say(txt);
  },
  flee(){
    if (this.phase!=="menu") return;
    const p = clamp(0.45 + (P.stamina<=10?0.3:0) + P.level*0.03, 0, 0.92);
    if (chance(p)){
      this.phase="end";
      setScene("world");
      Sound.sfx("cancel");
      toast("도망쳤다!","good");
      if (this.onLose) {/* 도망은 패널티 없음 */}
    } else {
      this._say("도망치지 못했다!");
    }
  },

  _checkEnd(){
    if (P.hp<=0){ this._defeat(); return true; }
    if (this.livingEnemies().length===0){ this._victory(); return true; }
    return false;
  },

  _victory(){
    this.phase="end";
    let gold=0, exp=0;
    const ids = this.enemies.map(e=>e.id);
    this.enemies.forEach(e=>{ gold+=e.gold; exp+=e.exp; });
    P.money += gold;
    // 요괴 부산물 드롭: 잡템(80~100%) + 공물(15~20%, 장신구 보너스)
    const drops={};
    const give=(id,n)=>{ if(!id)return; Player.add(id,n); drops[id]=(drops[id]||0)+n; };
    this.enemies.forEach(e=>{
      if (e.commonDrops && e.commonDrops.length && chance(0.9)) give(choice(e.commonDrops),1);
      if (e.tribute && chance((e.tributeRate||0) + Player.dropBonus())) give(e.tribute,1);
    });
    setScene("world");
    Sound.sfx("win");
    Player.gainExp(exp);
    toast(`⚔️ 승리! +${gold}냥, 경험치 +${exp}`,"gold");
    const dtxt = Object.keys(drops).map(id=>`${DATA.DROPS[id].icon}${DATA.DROPS[id].name}×${drops[id]}`).join(" ");
    if (dtxt) toast(`🦴 부산물 획득: ${dtxt}`,"good");
    Quests.notify("defeat", { ids });
    Quests.notify("gold", {});
    if (this.onWin) this.onWin();
  },

  _defeat(){
    this.phase="end";
    // 약초 50% 손실(내림)
    let lost=0;
    Player.herbList().forEach(id=>{
      const drop = Math.floor(P.inv[id]/2);
      if (drop>0){ P.inv[id]-=drop; lost+=drop; if(P.inv[id]<=0) delete P.inv[id]; }
    });
    Time.advance(DATA.CONST.DEFEAT_TIME_LOSS); // 5시간 손실
    P.hp = 1;
    P.stamina = this.preStamina; // 전투 전 기력으로 복구
    // 산 입구(안전지대)로 귀환
    World.zone = "mtn1";
    World.placeAtSpawn();
    setScene("world");
    Sound.sfx("lose");
    UI.startDialogue("…", [
      "정신을 잃고 쓰러졌다.",
      `누군가 산 입구로 옮겨주었다. 시간이 흘렀고(−5시간), 채집한 약초의 절반(${lost}개)을 잃었다.`,
      "체력은 가까스로 1만 남았다. 무리하지 말자…"
    ]);
    if (this.onLose) this.onLose();
  },

  /* ---------------- 씬 ---------------- */
  scene:{
    enter(){},
    update(dt){
      const C=Combat;
      if (C.swingT>0) C.swingT-=dt;
      C.enemies.forEach(e=>{ if(e.hitT>0) e.hitT-=dt; });
      if (C.busyT>0){ C.busyT-=dt; if (C.busyT<=0 && C.after){ const f=C.after; C.after=null; f(); } }
    },
    render(ctx){
      const C=Combat;
      // 배경 (산속 밤)
      const g=ctx.createLinearGradient(0,0,0,G.H);
      g.addColorStop(0,"#1a2a1a"); g.addColorStop(1,"#0d160d");
      ctx.fillStyle=g; ctx.fillRect(0,0,G.W,G.H);
      // 달빛
      const cm=ctx.createRadialGradient(660,90,12,660,90,140); cm.addColorStop(0,"rgba(220,235,210,0.35)"); cm.addColorStop(1,"rgba(220,235,210,0)");
      ctx.fillStyle=cm; ctx.beginPath(); ctx.arc(660,90,140,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#dfeacd"; ctx.beginPath(); ctx.arc(660,90,30,0,Math.PI*2); ctx.fill();
      // 먼 나무 실루엣
      ctx.fillStyle="#0f1a10";
      for(let i=0;i<9;i++){ const tx=i*100+20, th=70+((i*53)%50); ctx.beginPath(); ctx.moveTo(tx-22,300); ctx.lineTo(tx,300-th); ctx.lineTo(tx+22,300); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle="#16241a"; ctx.fillRect(0,300,G.W,300);
      // 바닥 안개
      ctx.fillStyle="rgba(150,170,150,0.06)"; ctx.fillRect(0,290,G.W,26);

      // 적
      const n=C.enemies.length;
      C.enemies.forEach((e,i)=>{
        const x = G.W/2 + (i-(n-1)/2)*150;
        const y = 180 + (e.hitT>0?randInt(-4,4):0);
        ctx.globalAlpha = e.alive?1:0.25;
        ctx.font="60px serif"; ctx.textAlign="center";
        ctx.fillText(e.icon, x, y);
        ctx.globalAlpha=1;
        ctx.font="12px 'Malgun Gothic'"; ctx.fillStyle="#f3e9d2";
        ctx.fillText(e.name + (e.alive?"":" ✕"), x, y+22);
        if (e.alive){
          // HP바
          const bw=90,bx=x-bw/2,by=y+30;
          ctx.fillStyle="#2a2016"; ctx.fillRect(bx,by,bw,7);
          ctx.fillStyle="#e74c3c"; ctx.fillRect(bx,by,bw*clamp(e.hp/e.maxHp,0,1),7);
          // 상태
          let s=""; if(e.status.stun>0)s+="💫"; if(e.status.charm>0)s+="💗"; if(e.status.slow>0)s+="🐌";
          if(s){ ctx.font="14px serif"; ctx.fillText(s, x, by+22); }
        }
      });

      // 플레이어 캐릭터 (적을 향해 — b4 전투 프레임, 좌향 시트라 우향 플립)
      const swinging = (C.swingT||0) > 0;
      World.drawDallae(ctx, 150, 252, { dir:"right", frame: swinging?"b4_1":"b4_0", flip:true, scale:1.9, hold:"weapon", weaponId:P.weapon });

      // 플레이어 패널
      ctx.fillStyle="rgba(20,14,8,0.85)"; ctx.fillRect(20,360,250,90);
      ctx.strokeStyle="#6b5736"; ctx.strokeRect(20,360,250,90);
      ctx.textAlign="left"; ctx.fillStyle="#e7c66b"; ctx.font="14px 'Malgun Gothic'";
      const w=Player.weaponData();
      ctx.fillText(`나  Lv.${P.level}  ${w.icon}${w.name}(공${w.atk})`, 34, 384);
      ctx.fillStyle="#f5b0a8"; ctx.font="12px 'Malgun Gothic'";
      ctx.fillText(`체력 ${Math.ceil(P.hp)}/${P.maxHp}`, 34, 406);
      ctx.fillStyle="#9ad0ff";
      ctx.fillText(`신력 ${P.mp}/${Player.mpCap()}`, 150, 406);
      if (C.defending){ ctx.fillStyle="#58d68d"; ctx.fillText("🛡 방어중", 34, 428); }

      // 로그
      ctx.fillStyle="rgba(20,14,8,0.9)"; ctx.fillRect(20,300,G.W-40,46);
      ctx.strokeStyle="#6b5736"; ctx.strokeRect(20,300,G.W-40,46);
      ctx.fillStyle="#f3e9d2"; ctx.font="15px 'Malgun Gothic'"; ctx.textAlign="center";
      ctx.fillText(C.log, G.W/2, 329);

      // 명령 버튼
      C.btns=[];
      if (C.phase==="menu"){
        const cmds=[["⚔ 공격","atk"],["✨ 신통력","mag"],["🛡 방어","def"],["🏃 도망","flee"]];
        cmds.forEach((cm,i)=>{
          const bx=300+(i%2)*180, by=370+Math.floor(i/2)*46;
          C.btns.push({x:bx,y:by,w:160,h:38,act:cm[1],label:cm[0]});
        });
      } else if (C.phase==="magic"){
        P.magic.forEach((id,i)=>{
          const m=DATA.MAGIC[id];
          C.btns.push({x:300,y:362+i*42,w:340,h:36,act:"cast",id,label:`${m.icon} ${m.name} (신력 ${m.mp})`});
        });
        C.btns.push({x:650,y:362,w:120,h:36,act:"back",label:"← 뒤로"});
      }
      C.btns.forEach(b=>{
        const hot=G.mouse.x>=b.x&&G.mouse.x<=b.x+b.w&&G.mouse.y>=b.y&&G.mouse.y<=b.y+b.h;
        ctx.fillStyle=hot?"#6b5736":"#3a2c1a"; ctx.fillRect(b.x,b.y,b.w,b.h);
        ctx.strokeStyle="#6b5736"; ctx.strokeRect(b.x,b.y,b.w,b.h);
        ctx.fillStyle="#f3e9d2"; ctx.font="14px 'Malgun Gothic'"; ctx.textAlign="center";
        ctx.fillText(b.label, b.x+b.w/2, b.y+b.h/2+5);
      });
      ctx.textAlign="left";
    },
    click(x,y){
      const C=Combat;
      for(const b of C.btns){
        if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){
          if(b.act==="atk")C.attack();
          else if(b.act==="def")C.defend();
          else if(b.act==="mag")C.openMagic();
          else if(b.act==="flee")C.flee();
          else if(b.act==="cast")C.castMagic(b.id);
          else if(b.act==="back")C.phase="menu";
          return;
        }
      }
    },
    key(e){
      const C=Combat;
      if(C.phase==="menu"){
        if(e.key==="1")C.attack(); else if(e.key==="2")C.openMagic();
        else if(e.key==="3")C.defend(); else if(e.key==="4")C.flee();
      } else if(C.phase==="magic"){
        if(e.key==="Escape")C.phase="menu";
        else if(/^[1-9]$/.test(e.key)){ const id=P.magic[+e.key-1]; if(id)C.castMagic(id); }
      }
    },
  },
};
