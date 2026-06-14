/* =========================================================================
 * NPC — 무당 / 대장장이 / 촌장 / 주모 + 장터 좌판 상점
 * ======================================================================= */
const NPC = {

  interact(npcId){
    Sound.sfx("blip");
    Quests.notify("talk", npcId);   // 방문 = 인사 (신고식 퀘스트)
    if (npcId === "mudang")   return NPC.mudang();
    if (npcId === "daejang")  return NPC.daejang();
    if (npcId === "chonjang") return NPC.chonjang();
    if (npcId === "jumo")     return NPC.jumo();
  },

  affLabel(npc){ const a = P.affection[npc]||0; return "♥".repeat(a) + "♡".repeat(10-a); },

  /* ---------------- 무당: 마법 해금 ---------------- */
  mudang(){
    UI.startDialogue("무당 🔮",
      ["산천의 기운이 그대에게 깃들어 있군… 신력을 다루는 법을 알려줄까?",
       `현재 나와의 정(情): ${NPC.affLabel("mudang")}`],
      { choices: Quests.npcChoices("mudang").concat([
          { label:"신통력(마법) 배우기", value:"learn" },
          { label:"산삼을 바친다 (정 +2)", value:"gift" },
          { label:"그냥 간다", value:"bye" },
        ]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="learn") NPC._mudangLearn();
          else if (v==="gift") NPC._gift("mudang","sansam",2);
        }
      });
  },

  _mudangLearn(){
    let rows = `<p class="note">정(情)이 깊을수록 강한 신통력을 전수받습니다. 현재 정: <b>${P.affection.mudang}</b></p>`;
    Object.values(DATA.MAGIC).forEach(m => {
      const owned = Player.hasMagic(m.id);
      const ok = P.affection.mudang >= m.learnAff;
      const btn = owned
        ? `<button disabled>전수받음</button>`
        : ok ? `<button class="" data-act="learn" data-id="${m.id}">전수받기</button>`
             : `<button disabled>정 ${m.learnAff} 필요</button>`;
      rows += `<div class="shop-row"><div class="item-ic" style="background:#2a1d33">${m.icon}</div>
        <div class="grow"><div class="item-name">${m.name} <span class="item-sub">(신력 ${m.mp})</span></div>
        <div class="item-sub">${m.desc}</div></div>${btn}</div>`;
    });
    UI.openMenu("무당 — 신통력 전수", rows, (act,id)=>{
      if (act==="learn"){
        Player.learnMagic(id);
        Sound.sfx("levelup");
        toast(`✨ '${DATA.MAGIC[id].name}' 신통력을 익혔다!`, "gold");
        NPC._mudangLearn();
        UI.refreshHUD();
      }
    });
  },

  /* ---------------- 대장장이: 무기/강화/호미 ---------------- */
  daejang(){
    UI.startDialogue("대장장이 🔨",
      ["쇠붙이라면 뭐든 두드려주지. 무기를 손볼 텐가?"],
      { choices: Quests.npcChoices("daejang").concat([ {label:"대장간 열기", value:"shop"}, {label:"황기를 선물 (정 +1)", value:"gift"}, {label:"나간다", value:"bye"} ]),
        onChoice(v){ if (Quests.handleChoice(v)) return; if (v==="shop") NPC._daejangShop(); else if (v==="gift") NPC._gift("daejang","hwanggi",1); }
      });
  },

  _daejangShop(){
    const w = DATA.WEAPONS;
    let rows = `<p class="note">현재 무기: <b>${w[P.weapon].name}</b> (강화 +${P.weaponLv}) · 공격력 ${Player.weaponData().atk}</p>`;
    // 무기 강화
    rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">⚒️</div>
      <div class="grow"><div class="item-name">무기 강화 (+${DATA.WEAPON_UPGRADE.atkBonus} 공격력)</div>
      <div class="item-sub">현재 무기를 더 단단하게</div></div>
      <button data-act="up" ${P.money<DATA.WEAPON_UPGRADE.cost?"disabled":""}>${DATA.WEAPON_UPGRADE.cost}냥</button></div>`;
    // 호미 등급(채집 품질)
    const homiCost = P.homiTier*45;
    rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">⛏️</div>
      <div class="grow"><div class="item-name">호미 벼리기 (채집 등급 ${P.homiTier} → ${Math.min(3,P.homiTier+1)})</div>
      <div class="item-sub">상위 등급 약초 채집 확률 상승</div></div>
      ${P.homiTier>=3?`<button disabled>최고급</button>`:`<button data-act="homi" ${P.money<homiCost?"disabled":""}>${homiCost}냥</button>`}</div>`;
    rows += `<hr style="border-color:#50412a;margin:12px 0"><p class="note">새 무기 구입</p>`;
    Object.values(w).forEach(it=>{
      const owned = P.weapon===it.id;
      rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">${it.icon}</div>
        <div class="grow"><div class="item-name">${it.name} <span class="item-sub">[${it.type}]</span></div>
        <div class="item-sub">공격력 ${it.atk} · 무게 ${it.weight} ${it.stun?`· 기절 ${Math.round(it.stun*100)}%`:""} — ${it.desc}</div></div>
        ${owned?`<button disabled>장착중</button>`:`<button data-act="buyw" data-id="${it.id}" ${P.money<50?"disabled":""}>50냥</button>`}</div>`;
    });
    UI.openMenu("대장간", rows, (act,id)=>{
      if (act==="up"){ if (Player.spendMoney(DATA.WEAPON_UPGRADE.cost)){ P.weaponLv++; Sound.sfx("confirm"); toast("무기를 강화했다! 공격력 상승","good"); NPC._daejangShop(); } else Sound.sfx("error"); }
      else if (act==="homi"){ const c=P.homiTier*45; if (Player.spendMoney(c)){ P.homiTier++; Sound.sfx("confirm"); toast(`호미 등급 ${P.homiTier}! 채집 품질 상승`,"good"); NPC._daejangShop(); } else Sound.sfx("error"); }
      else if (act==="buyw"){ if (Player.spendMoney(50)){ P.weapon=id; P.weaponLv=0; Sound.sfx("confirm"); toast(`${DATA.WEAPONS[id].name} 장착!`,"good"); NPC._daejangShop(); } else Sound.sfx("error"); }
      UI.refreshHUD();
    });
  },

  /* ---------------- 촌장: 이야기 / 의뢰 ---------------- */
  chonjang(){
    // 일일 약초 납품 의뢰
    const q = NPC._chonReq();
    const have = Player.count(q.id);
    UI.startDialogue("촌장 👴",
      [ G.flags.metChon ? "마을 살림이 빠듯하네. 자네만 믿네." :
          "오, 산 너머에서 온 약초꾼이라지? 이 마을에 정착하려거든 산물을 좀 나눠주게나.",
        `오늘의 청 — <b>${DATA.HERBS[q.id].name} ${q.need}개</b>를 가져오면 <b>${q.pay}냥</b>을 주겠네. (보유 ${have})`,
        `자네와의 정: ${NPC.affLabel("chonjang")}`
      ],
      { onEnd(){ G.flags.metChon = true; },
        choices: Quests.npcChoices("chonjang").concat([
          { label:`일일 납품 (${DATA.HERBS[q.id].name} ${q.need})`, value:"quest" },
          { label:"마을 이야기 듣기", value:"talk" },
          { label:"물러난다", value:"bye" },
        ]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="quest"){
            if (Player.count(q.id) >= q.need){
              Player.remove(q.id, q.need); P.money += q.pay; Player.addAffection("chonjang",1);
              Player.gainExp(5);
              G.flags.chonDoneDay = G.time.day;
              toast(`📜 의뢰 완수! +${q.pay}냥, 정 +1`, "gold");
            } else toast("약초가 부족하다.","bad");
          } else if (v==="talk"){
            UI.startDialogue("촌장 👴", [
              "예부터 이 산엔 도깨비와 구미호가 깃들어 함부로 오르면 화를 입었지.",
              "허나 무당님께 신통력을 배우면 능히 물리칠 수 있다네.",
              "장날(5·10일)엔 주막에서 메밀전을 팔아 큰돈을 만질 수 있으니 부지런히 준비하게."
            ]);
          }
        }
      });
  },

  // 날짜 기반 결정적 의뢰
  _chonReq(){
    const herbs = DATA.herbsBySeason(Time.season()).filter(h=>h.tier<=2);
    const h = herbs[(G.time.day) % herbs.length];
    const need = h.tier===1 ? 5 : 3;
    const pay = h.tier===1 ? 60 : 90;
    return { id:h.id, need, pay };
  },

  /* ---------------- 주모: 장사 / 나물죽 ---------------- */
  jumo(){
    const canTrade = Time.isMarketDay() && !Time.isMorning();
    const pages = [ "어서 오게! 주막은 장날 오후에 크게 연다네." ];
    const choices = [];
    if (canTrade) choices.push({ label:"🍲 주막 장사 시작! (기력 70)", value:"trade" });
    else choices.push({ label:"(장사는 장날 5·10일 오후에)", value:"noop" });
    choices.push({ label:`나물죽 끓이기 (나물 ${DATA.CONST.PORRIDGE_HERBS}개 → 체력 +${DATA.CONST.PORRIDGE_HEAL})`, value:"porridge" });
    choices.push({ label:"정담 나누기 (정 +1)", value:"talk" });
    choices.push({ label:"나간다", value:"bye" });
    UI.startDialogue("주모 🍶", pages, {
      choices: Quests.npcChoices("jumo").concat(choices),
      onChoice(v){
        if (Quests.handleChoice(v)) return;
        if (v==="trade"){
          if (!Player.hasStamina(DATA.CONST.TRADE_STAMINA)){ toast("기력이 부족해 장사를 할 수 없다 (70 필요)","bad"); return; }
          Trading.begin();
        } else if (v==="porridge"){
          const herbs = Player.herbList();
          if (Player.herbTotal() < DATA.CONST.PORRIDGE_HERBS){ toast("나물이 부족하다","bad"); return; }
          let n = DATA.CONST.PORRIDGE_HERBS;
          for (const id of herbs){ while(n>0 && P.inv[id]>0){ Player.remove(id,1); n--; } if(n<=0)break; }
          Player.heal(DATA.CONST.PORRIDGE_HEAL);
          toast(`🍲 나물죽을 먹었다. 체력 +${DATA.CONST.PORRIDGE_HEAL}`,"good");
        } else if (v==="talk"){ Player.addAffection("jumo",1); toast("주모와 정담을 나눴다. 정 +1","good"); }
      }
    });
  },

  /* ---------------- 선물 공통 ---------------- */
  _gift(npc, herbId, aff){
    if (Player.count(herbId) > 0){
      Player.remove(herbId,1); Player.addAffection(npc, aff);
      toast(`${DATA.HERBS[herbId].name}을(를) 선물했다. 정 +${aff}`, "good");
    } else {
      toast(`${DATA.HERBS[herbId].name}이(가) 없다.`, "bad");
    }
  },

  /* ---------------- 장터 좌판 상점 ---------------- */
  market(){
    if (!Maps.stallActive()){
      UI.startDialogue("장터", ["좌판은 <b>장날(5·10일) 오전</b>에만 열린다.", `다음 장날까지 기다리자. (오늘은 ${Time.season()} ${Time.dayOfSeason()}일)`]);
      return;
    }
    NPC._marketShop();
  },

  _marketShop(){
    let rows = `<p class="note">장날 오전 좌판 — 종자/양념 구입 & 약초 판매</p>`;
    // 메밀 종자
    rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">🌰</div>
      <div class="grow"><div class="item-name">메밀 종자</div><div class="item-sub">집 메밀밭에 심으면 4일 후 수확 (메밀가루)</div></div>
      <button data-act="seed" ${P.money<DATA.BUCKWHEAT.seedPrice?"disabled":""}>${DATA.BUCKWHEAT.seedPrice}냥</button></div>`;
    // 양념장
    rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">🥢</div>
      <div class="grow"><div class="item-name">양념장 <span class="item-sub">(보유 ${Player.count("season")})</span></div>
      <div class="item-sub">주막 요리 필수 재료</div></div>
      <button data-act="season" ${P.money<DATA.GOODS.season.price?"disabled":""}>${DATA.GOODS.season.price}냥</button></div>`;
    rows += `<hr style="border-color:#50412a;margin:12px 0"><p class="note">약초·나물 팔기 (전 종류)</p>`;
    const herbs = Player.herbList();
    if (!herbs.length) rows += `<p class="note">팔 약초가 없다.</p>`;
    herbs.forEach(id=>{
      const h = DATA.HERBS[id];
      rows += `<div class="shop-row"><div class="item-ic" style="background:#241a0e">${h.icon}</div>
        <div class="grow"><div class="item-name tier${h.tier}">${h.name} ×${P.inv[id]}</div>
        <div class="item-sub">개당 ${h.price}냥</div></div>
        <button class="sell" data-act="sell" data-id="${id}">팔기</button></div>`;
    });
    if (herbs.length) rows += `<div class="shop-row"><div class="grow"></div><button class="sell" data-act="sellall">전부 팔기</button></div>`;

    UI.openMenu("장터 좌판 🪧", rows, (act,id)=>{
      if (act==="seed"){ if (Player.spendMoney(DATA.BUCKWHEAT.seedPrice)){ Player.add("seed",1); Sound.sfx("confirm"); toast("메밀 종자 구입","good"); } else Sound.sfx("error"); }
      else if (act==="season"){ if (Player.spendMoney(DATA.GOODS.season.price)){ Player.add("season",1); Sound.sfx("confirm"); toast("양념장 구입","good"); } else Sound.sfx("error"); }
      else if (act==="sell"){ const h=DATA.HERBS[id]; if (Player.remove(id,1)){ P.money+=h.price; Sound.sfx("coin"); Quests.notify("sell",{count:1}); Quests.notify("gold",{}); toast(`${h.name} 판매 +${h.price}냥`,"gold"); } }
      else if (act==="sellall"){ let g=0,cnt=0; Player.herbList().forEach(hid=>{ const h=DATA.HERBS[hid]; g+=h.price*P.inv[hid]; cnt+=P.inv[hid]; delete P.inv[hid]; }); P.money+=g; Sound.sfx("money"); Quests.notify("sell",{count:cnt}); Quests.notify("gold",{}); toast(`약초 전부 판매 +${g}냥`,"gold"); }
      NPC._marketShop(); UI.refreshHUD();
    });
  },
};
