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
    if (npcId === "uisang")   return NPC.uisang();
    if (npcId === "geonchuk") return NPC.geonchuk();
    if (npcId === "uiwon")    return NPC.uiwon();
    if (npcId === "yakcho")   return NPC.yakcho();
    if (npcId === "hunjang")  return NPC.hunjang();
    if (npcId === "bobu")     return NPC.bobu();
    if (npcId === "nongbu")   return NPC.nongbu();
    if (npcId === "banga")    return NPC.banga();
    if (npcId === "pujut")    return NPC.pujut();
  },

  // 재료/물품 구매 공통 행
  _buyRow(label, icon, price, act, id, sub){
    return `<div class="shop-row"><div class="item-ic" style="background:#33240f">${icon}</div>
      <div class="grow"><div class="item-name">${label}</div><div class="item-sub">${sub||""}</div></div>
      <button data-act="${act}" data-id="${id}" ${P.money<price?"disabled":""}>${price}냥</button></div>`;
  },
  _buy(id, price, n){ if(Player.spendMoney(price)){ Player.add(id,n||1); Sound.sfx("confirm"); toast(`${(DATA.INGREDIENTS[id]||DATA.GOODS[id]||{name:id}).name} 구입`,"good"); return true;} Sound.sfx("error"); return false; },

  affLabel(npc){ const a = P.affection[npc]||0; return "♥".repeat(a) + "♡".repeat(10-a); },

  /* ---------------- 무당: 설화/조언 (마법은 당산나무에서) ---------------- */
  mudang(){
    const learned = P.magic.length;
    UI.startDialogue("무당 🔮",
      ["산천의 기운이 네게 깃들어 있구나… 헌데 신통력은 내가 주는 게 아니란다.",
       "<b>산 입구의 당나무 제단</b>에 요괴의 공물을 바치거라. 신령이 직접 신통력을 내려줄 게야.",
       `지금 익힌 신통력: ${learned}/4종`,
       `너와의 정(情): ${NPC.affLabel("mudang")}`],
      { choices: Quests.npcChoices("mudang").concat([
          { label:"산삼을 바친다 (정 +2)", value:"gift" },
          { label:"신령의 이야기 듣기", value:"lore" },
          { label:"그냥 간다", value:"bye" },
        ]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="gift") NPC._gift("mudang","sansam",2);
          else if (v==="lore") UI.startDialogue("무당 🔮", [
            "산은 네 구역이란다 — 입구의 도깨비, 중턱의 물귀신, 깊은 숲의 구미호와 두억시니, 그리고 고요한 정상.",
            "도깨비의 불·서늘한 물안개·여우 구슬·붉은 뿔 조각 — 그 공물들이 당나무에 신통력을 깨운단다.",
            "도깨비불(화염)·한기 서림(빙결)·현혹의 춤(매혹)·태산 압사(대지). 네 신통력을 모두 모으거라."
          ]);
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
    choices.push({ label:"📜 새 요리 배우기", value:"learn" });
    choices.push({ label:`나물죽 끓이기 (나물 ${DATA.CONST.PORRIDGE_HERBS}개 → 체력 +${DATA.CONST.PORRIDGE_HEAL})`, value:"porridge" });
    choices.push({ label:"🥘 가마솥 보양식 (하루 1회 · 종일 버프)", value:"cauldron" });
    choices.push({ label:"정담 나누기 (정 +1)", value:"talk" });
    choices.push({ label:"나간다", value:"bye" });
    UI.startDialogue("주모 🍶", pages, {
      choices: Quests.npcChoices("jumo").concat(choices),
      onChoice(v){
        if (Quests.handleChoice(v)) return;
        if (v==="trade"){
          if (!Player.hasStamina(DATA.CONST.TRADE_STAMINA)){ toast("기력이 부족해 장사를 할 수 없다 (70 필요)","bad"); return; }
          Trading.begin();
        } else if (v==="learn"){ NPC.recipeShop("jumo");
        } else if (v==="porridge"){
          const herbs = Player.herbList();
          if (Player.herbTotal() < DATA.CONST.PORRIDGE_HERBS){ toast("나물이 부족하다","bad"); return; }
          let n = DATA.CONST.PORRIDGE_HERBS;
          for (const id of herbs){ while(n>0 && P.inv[id]>0){ Player.remove(id,1); n--; } if(n<=0)break; }
          Player.heal(DATA.CONST.PORRIDGE_HEAL);
          toast(`🍲 나물죽을 먹었다. 체력 +${DATA.CONST.PORRIDGE_HEAL}`,"good");
        } else if (v==="cauldron"){ NPC._cauldronMenu();
        } else if (v==="talk"){ Player.addAffection("jumo",1); toast("주모와 정담을 나눴다. 정 +1","good"); }
      }
    });
  },

  /* 가마솥 보양식: 재료를 넣어 하루 동안 유지되는 버프를 얻는다(일일 1회) */
  _needCounts(steps){ const m={}; steps.forEach(s=> m[s]=(m[s]||0)+1); return m; },
  _canCook(steps){
    const need=NPC._needCounts(steps);
    for (const id in need){
      const have = id==="namul" ? Player.herbTotal() : Player.count(id);
      if (have < need[id]) return false;
    }
    return true;
  },
  _consumeSteps(steps){
    const need=NPC._needCounts(steps);
    for (const id in need){
      let n=need[id];
      if (id==="namul"){ for (const h of Player.herbList()){ while(n>0 && P.inv[h]>0){ Player.remove(h,1); n--; } if(n<=0)break; } }
      else Player.remove(id, n);
    }
  },
  _cauldronMenu(){
    const used = Player.buffUsedToday();
    let rows = `<p class="note">가마솥에 재료를 넣어 <b>하루 동안 유지되는 보양 효과</b>를 얻는다. 하루 한 번만 끓일 수 있다.`;
    rows += P.buff ? ` 현재 효과: <b>${P.buff.icon} ${P.buff.name}</b> (${DATA.BUFF_TAG[P.buff.kind]})</p>` : ` (현재 효과 없음)</p>`;
    if (used) rows += `<p class="note" style="color:#e7a">오늘은 이미 가마솥을 썼다. 내일 다시 끓일 수 있다.</p>`;
    Object.values(DATA.BUFF_FOODS).forEach(f=>{
      const recipe = f.steps.map(s=> (DATA.INGREDIENTS[s]||{icon:"?",name:s}).icon).join(" ");
      const can = !used && NPC._canCook(f.steps);
      const btn = `<button data-act="cook" data-id="${f.id}" ${can?"":"disabled"}>끓이기</button>`;
      rows += `<div class="shop-row"><div class="item-ic" style="background:#3a2410">${f.icon}</div>
        <div class="grow"><div class="item-name">${f.name} <span class="item-sub">${recipe}</span></div>
        <div class="item-sub">${f.desc}</div></div>${btn}</div>`;
    });
    UI.openMenu("가마솥 보양식 🥘", rows, (act,id)=>{
      if (act!=="cook") return;
      if (Player.buffUsedToday()){ Sound.sfx("error"); toast("오늘은 이미 가마솥을 썼다","bad"); return; }
      const f=DATA.BUFF_FOODS[id];
      if (!NPC._canCook(f.steps)){ Sound.sfx("error"); toast("재료가 부족하다","bad"); return; }
      NPC._consumeSteps(f.steps);
      Player.eatBuffFood(f);
      Sound.sfx("confirm");
      toast(`${f.icon} ${f.name}을(를) 먹었다! ${DATA.BUFF_TAG[f.kind]} (하루 유지)`,"gold");
      UI.refreshHUD();
      NPC._cauldronMenu();
    });
  },

  /* ---------------- 의상점: 한복(코스튬) ---------------- */
  uisang(){
    UI.startDialogue("의상점 주인 🧵",
      ["고운 한복 한 벌 어떠신가? 입는 옷에 따라 몸놀림이 달라진다오."],
      { choices: Quests.npcChoices("uisang").concat([ {label:"옷 구경하기", value:"shop"}, {label:"나간다", value:"bye"} ]),
        onChoice(v){ if (Quests.handleChoice(v)) return; if (v==="shop") NPC._uisangShop(); }
      });
  },
  _uisangShop(){
    let rows = `<p class="note">현재 의상: <b>${Player.costumeData().name}</b> (기력소모 ×${Player.staminaMult()}, 이동 ×${Player.speedMult()})</p>`;
    Object.values(DATA.COSTUMES).forEach(c=>{
      const worn = P.costume===c.id;
      const btn = worn ? `<button disabled>착용중</button>`
        : `<button data-act="buy" data-id="${c.id}" ${P.money<c.price?"disabled":""}>${c.price?c.price+"냥":"착용"}</button>`;
      rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">${c.icon}</div>
        <div class="grow"><div class="item-name">${c.name}</div><div class="item-sub">${c.desc}</div></div>${btn}</div>`;
    });
    UI.openMenu("의상점 🧵", rows, (act,id)=>{
      if (act==="buy"){ const c=DATA.COSTUMES[id];
        if (P.money>=c.price){ Player.spendMoney(c.price); P.costume=id; Sound.sfx("confirm"); toast(`${c.name} 착용!`,"good"); NPC._uisangShop(); UI.refreshHUD(); }
        else Sound.sfx("error");
      }
    });
  },

  /* ---------------- 방물점: 장신구 ---------------- */
  geonchuk(){
    UI.startDialogue("방물장수 🪡",
      ["노리개에 부적이라… 몸에 지니면 신력이 오르고, 요괴 부산물도 잘 챙긴다오."],
      { choices: Quests.npcChoices("geonchuk").concat([ {label:"장신구 구경", value:"shop"}, {label:"나간다", value:"bye"} ]),
        onChoice(v){ if (Quests.handleChoice(v)) return; if (v==="shop") NPC._geonchukShop(); }
      });
  },
  _geonchukShop(){
    let rows = `<p class="note">현재 장신구: <b>${Player.accessoryData().name}</b> (최대 신력 +${Player.accessoryData().mpBonus}, 드롭 +${Math.round(Player.dropBonus()*100)}%)</p>`;
    Object.values(DATA.ACCESSORIES).forEach(a=>{
      const worn = P.accessory===a.id;
      const btn = worn ? `<button disabled>착용중</button>`
        : `<button data-act="buy" data-id="${a.id}" ${P.money<a.price?"disabled":""}>${a.price?a.price+"냥":"해제"}</button>`;
      rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">${a.icon}</div>
        <div class="grow"><div class="item-name">${a.name}</div><div class="item-sub">${a.desc}</div></div>${btn}</div>`;
    });
    UI.openMenu("방물점 🪡", rows, (act,id)=>{
      if (act==="buy"){ const a=DATA.ACCESSORIES[id];
        if (P.money>=a.price){ Player.spendMoney(a.price); P.accessory=id; P.mp=clamp(P.mp,0,Player.mpCap()); Sound.sfx("confirm"); toast(`${a.name} 착용!`,"good"); NPC._geonchukShop(); UI.refreshHUD(); }
        else Sound.sfx("error");
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
    // 일반 식재료 (쌀·파·녹두·누룩)
    rows += `<p class="note" style="margin-top:8px">요리 재료</p>`;
    ["rice","pa","bean","nuruk"].forEach(id=>{ const g=DATA.INGREDIENTS[id];
      rows += NPC._buyRow(`${g.name} <span class="item-sub">(보유 ${Player.count(id)})</span>`, g.icon, g.buy, "buying", id, g.src);
    });
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
    // 요괴 잡템(공물 외 부산물) 팔기
    const junk = Player.dropList().filter(id=>DATA.DROPS[id].common);
    if (junk.length){
      rows += `<hr style="border-color:#50412a;margin:12px 0"><p class="note">요괴 잡템 팔기</p>`;
      junk.forEach(id=>{ const d=DATA.DROPS[id];
        rows += `<div class="shop-row"><div class="item-ic" style="background:#1f2a1f">${d.icon}</div>
          <div class="grow"><div class="item-name">${d.name} ×${P.inv[id]}</div><div class="item-sub">개당 ${d.price}냥</div></div>
          <button class="sell" data-act="selljunk" data-id="${id}">팔기</button></div>`;
      });
    }

    UI.openMenu("장터 좌판 🪧", rows, (act,id)=>{
      if (act==="seed"){ if (Player.spendMoney(DATA.BUCKWHEAT.seedPrice)){ Player.add("seed",1); Sound.sfx("confirm"); toast("메밀 종자 구입","good"); } else Sound.sfx("error"); }
      else if (act==="season"){ if (Player.spendMoney(DATA.GOODS.season.price)){ Player.add("season",1); Sound.sfx("confirm"); toast("양념장 구입","good"); } else Sound.sfx("error"); }
      else if (act==="buying"){ NPC._buy(id, DATA.INGREDIENTS[id].buy); }
      else if (act==="sell"){ const h=DATA.HERBS[id]; if (Player.remove(id,1)){ P.money+=h.price; Sound.sfx("coin"); Quests.notify("sell",{count:1}); Quests.notify("gold",{}); toast(`${h.name} 판매 +${h.price}냥`,"gold"); } }
      else if (act==="sellall"){ let g=0,cnt=0; Player.herbList().forEach(hid=>{ const h=DATA.HERBS[hid]; g+=h.price*P.inv[hid]; cnt+=P.inv[hid]; delete P.inv[hid]; }); P.money+=g; Sound.sfx("money"); Quests.notify("sell",{count:cnt}); Quests.notify("gold",{}); toast(`약초 전부 판매 +${g}냥`,"gold"); }
      else if (act==="selljunk"){ const d=DATA.DROPS[id]; if (Player.remove(id,1)){ P.money+=d.price; Sound.sfx("coin"); Quests.notify("gold",{}); toast(`${d.name} 판매 +${d.price}냥`,"gold"); } }
      NPC._marketShop(); UI.refreshHUD();
    });
  },

  /* ---------------- 레시피 학습 (주모/방앗간/푸줏간) ---------------- */
  recipeShop(by){
    let rows = `<p class="note">배울 수 있는 요리 (요리 숙련 Lv.${Player.cookLv()} · 명성 ${P.fame})</p>`;
    const byName = ({jumo:"주모",banga:"방앗간",pujut:"푸줏간"})[by];
    const learnable = Object.values(DATA.RECIPES).filter(r=>!r.unlock && r.by===byName);
    if (!learnable.length) rows += `<p class="note">여기서 배울 요리가 없다.</p>`;
    learnable.forEach(r=>{
      const has=Player.hasRecipe(r.id);
      const steps=r.steps.map(s=>DATA.INGREDIENTS[s].icon).join(" → ");
      const btn = has?`<button disabled>배움</button>`:`<button data-act="learn" data-id="${r.id}" ${P.money<r.learn?"disabled":""}>${r.learn}냥</button>`;
      rows += `<div class="shop-row"><div class="item-ic" style="background:#33240f">${r.icon}</div>
        <div class="grow"><div class="item-name">${r.name} <span class="item-sub">(음식값 ${r.price})</span></div>
        <div class="item-sub">${steps}</div></div>${btn}</div>`;
    });
    UI.openMenu(`${DATA.NPCS[by].icon} 요리 전수`, rows, (act,id)=>{
      if (act==="learn"){ const r=DATA.RECIPES[id]; if(P.money>=r.learn){ Player.spendMoney(r.learn); Player.learnRecipe(id); Sound.sfx("levelup"); toast(`📜 '${r.name}' 요리를 배웠다!`,"gold"); Quests.notify("recipe",{id}); NPC.recipeShop(by); UI.refreshHUD(); } else Sound.sfx("error"); }
    });
  },

  /* ---------------- 의원: 치료/최대치 증강 ---------------- */
  uiwon(){
    UI.startDialogue("의원 💉", ["어디 편찮으신가? 침 한 대면 거뜬하지."],
      { choices: Quests.npcChoices("uiwon").concat([
          { label:`치료 (체력·신력 완전 회복) — 30냥`, value:"heal" },
          { label:`보약 (최대 체력 +10) — 120냥`, value:"hp" },
          { label:`총명탕 (최대 신력 +5) — 120냥`, value:"mp" },
          { label:"나간다", value:"bye" }]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="heal"){ if(Player.spendMoney(30)){ P.hp=P.maxHp; P.mp=Player.mpCap(); Sound.sfx("levelup"); toast("몸이 개운하다! 완전 회복","good"); } else Sound.sfx("error"); }
          else if (v==="hp"){ if(Player.spendMoney(120)){ P.maxHp+=10; P.hp=P.maxHp; Sound.sfx("levelup"); toast("최대 체력 +10","gold"); } else Sound.sfx("error"); }
          else if (v==="mp"){ if(Player.spendMoney(120)){ P.maxMp+=5; P.mp=Player.mpCap(); Sound.sfx("levelup"); toast("최대 신력 +5","gold"); } else Sound.sfx("error"); }
          UI.refreshHUD();
        }});
  },

  /* ---------------- 약초상: 약초 고가 매입 + 양념/도토리 판매 ---------------- */
  yakcho(){
    UI.startDialogue("약초상 🌿", ["산에서 캔 약초, 내 후하게 쳐주지. 귀한 산삼은 더더욱."],
      { choices: Quests.npcChoices("yakcho").concat([ {label:"약초 팔기 (장터보다 +30%)", value:"sell"}, {label:"양념장·재료 사기", value:"buy"}, {label:"나간다", value:"bye"} ]),
        onChoice(v){ if (Quests.handleChoice(v)) return; if (v==="sell") NPC._yakchoSell(); else if (v==="buy") NPC._yakchoBuy(); }
      });
  },
  _yakchoSell(){
    let rows=`<p class="note">약초 매입가 +30% (산삼 등 명품일수록 이득)</p>`;
    const herbs=Player.herbList();
    if(!herbs.length) rows+=`<p class="note">팔 약초가 없다.</p>`;
    herbs.forEach(id=>{ const h=DATA.HERBS[id]; const pr=Math.round(h.price*1.3);
      rows+=`<div class="shop-row"><div class="item-ic" style="background:#241a0e">${h.icon}</div>
        <div class="grow"><div class="item-name tier${h.tier}">${h.name} ×${P.inv[id]}</div><div class="item-sub">개당 ${pr}냥</div></div>
        <button class="sell" data-act="s" data-id="${id}">팔기</button></div>`; });
    if(herbs.length) rows+=`<div class="shop-row"><div class="grow"></div><button class="sell" data-act="sall">전부 팔기</button></div>`;
    UI.openMenu("약초상 — 매입", rows, (act,id)=>{
      if(act==="s"){ const h=DATA.HERBS[id]; if(Player.remove(id,1)){ const pr=Math.round(h.price*1.3); P.money+=pr; Sound.sfx("coin"); Quests.notify("sell",{count:1}); Quests.notify("gold",{}); toast(`${h.name} +${pr}냥`,"gold"); NPC._yakchoSell(); UI.refreshHUD(); } }
      else if(act==="sall"){ let g=0,c=0; Player.herbList().forEach(hid=>{const h=DATA.HERBS[hid]; g+=Math.round(h.price*1.3)*P.inv[hid]; c+=P.inv[hid]; delete P.inv[hid];}); P.money+=g; Sound.sfx("money"); Quests.notify("sell",{count:c}); Quests.notify("gold",{}); toast(`약초 전부 +${g}냥`,"gold"); NPC._yakchoSell(); UI.refreshHUD(); }
    });
  },
  _yakchoBuy(){
    let rows=`<p class="note">요리·재료</p>`;
    rows += NPC._buyRow(`양념장 (보유 ${Player.count("season")})`, "🥢", 5, "b", "season");
    rows += NPC._buyRow(`도토리 (보유 ${Player.count("dotori")})`, "🌰", 6, "b", "dotori");
    UI.openMenu("약초상 — 판매", rows, (act,id)=>{ if(act==="b"){ NPC._buy(id, id==="season"?5:6); NPC._yakchoBuy(); UI.refreshHUD(); } });
  },

  /* ---------------- 훈장(서당): 요리 수련 / 전투 수련 ---------------- */
  hunjang(){
    UI.startDialogue("훈장 📜", ["배움에는 끝이 없는 법. 무엇을 닦겠느냐?"],
      { choices: Quests.npcChoices("hunjang").concat([
          { label:`요리 수련 (음식값 영구 +5%) — 150냥`, value:"cook" },
          { label:`무예 수련 (공격력 +3) — 150냥`, value:"atk" },
          { label:`글 배우기 (정 +1)`, value:"talk" },
          { label:"나간다", value:"bye" }]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="cook"){ if(Player.spendMoney(150)){ P.cookTrain=(P.cookTrain||0)+0.05; Sound.sfx("levelup"); toast("요리 솜씨가 늘었다! 음식값 +5%","gold"); } else Sound.sfx("error"); }
          else if (v==="atk"){ if(Player.spendMoney(150)){ P.weaponLv+=1; Sound.sfx("levelup"); toast("무예가 늘었다! 공격력 상승","gold"); } else Sound.sfx("error"); }
          else if (v==="talk"){ Player.addAffection("hunjang",1); Player.gainExp(4); toast("배움을 얻었다. 정 +1","good"); }
          UI.refreshHUD();
        }});
  },

  /* ---------------- 보부상: 장날 떠돌이 진귀템/레시피 ---------------- */
  bobu(){
    if (!Time.isMarketDay()){ UI.startDialogue("보부상 🎒", ["나는 장날(5·10일)에만 들른다네. 그때 보세!"]); return; }
    // 날짜 기반 결정적 진열
    const recipeIds = Object.values(DATA.RECIPES).filter(r=>!r.unlock).map(r=>r.id);
    const offer = recipeIds[(G.time.day) % recipeIds.length];
    UI.startDialogue("보부상 🎒", ["허허, 팔도를 돌며 진귀한 걸 모아왔지!"],
      { choices: Quests.npcChoices("bobu").concat([
          { label:"진귀한 물건 보기", value:"shop" },
          { label:`비전 요리책 '${DATA.RECIPES[offer].name}' — 200냥`, value:"book" },
          { label:"나간다", value:"bye" }]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="book"){ const r=DATA.RECIPES[offer]; if(Player.hasRecipe(offer)){ toast("이미 아는 요리다","bad"); return; } if(Player.spendMoney(200)){ Player.learnRecipe(offer); Sound.sfx("levelup"); toast(`📜 '${r.name}' 비법 습득!`,"gold"); } else Sound.sfx("error"); }
          else if (v==="shop") NPC._bobuShop();
          UI.refreshHUD();
        }});
  },
  _bobuShop(){
    let rows=`<p class="note">진귀한 물건 (장날 한정)</p>`;
    rows += NPC._buyRow("누룩 (동동주 재료)", "🟡", 12, "b", "nuruk");
    rows += NPC._buyRow("귀한 양념 꾸러미 ×5", "🥢", 20, "b5", "season");
    rows += NPC._buyRow("노리개", "🧿", 110, "acc", "norigae");
    UI.openMenu("보부상 봇짐 🎒", rows, (act,id)=>{
      if(act==="b") NPC._buy(id,12);
      else if(act==="b5"){ if(Player.spendMoney(20)){ Player.add("season",5); Sound.sfx("confirm"); toast("양념장 ×5","good"); } else Sound.sfx("error"); }
      else if(act==="acc"){ if(P.accessory==="norigae"){toast("이미 착용중","bad");return;} if(Player.spendMoney(110)){ P.accessory="norigae"; Sound.sfx("confirm"); toast("노리개 착용!","good"); } else Sound.sfx("error"); }
      NPC._bobuShop(); UI.refreshHUD();
    });
  },

  /* ---------------- 농부: 식재료(쌀/파/녹두) 저가 + 메밀밭 비옥화 ---------------- */
  nongbu(){
    UI.startDialogue("농부 🧑‍🌾", ["우리 밭에서 난 거라 싱싱하다네. 메밀 농사 비결도 있지."],
      { choices: Quests.npcChoices("nongbu").concat([ {label:"채소·곡물 사기", value:"shop"}, {label:`메밀밭 비옥화 (수확량 +2) — 180냥`, value:"fertile"}, {label:"나간다", value:"bye"} ]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="shop") NPC._nongbuShop();
          else if (v==="fertile"){ if(DATA.BUCKWHEAT.yield>=9){ toast("이미 충분히 비옥하다","bad"); return; } if(Player.spendMoney(180)){ DATA.BUCKWHEAT.yield+=2; Sound.sfx("levelup"); toast(`메밀 수확량 ${DATA.BUCKWHEAT.yield}로 증가!`,"gold"); } else Sound.sfx("error"); }
        }});
  },
  _nongbuShop(){
    let rows=`<p class="note">채소·곡물 (장터보다 저렴)</p>`;
    [["rice",6],["pa",4],["bean",7]].forEach(([id,pr])=>{ const g=DATA.INGREDIENTS[id];
      rows += NPC._buyRow(`${g.name} (보유 ${Player.count(id)})`, g.icon, pr, "b:"+pr, id); });
    rows += NPC._buyRow("메밀 종자", "🌰", DATA.BUCKWHEAT.seedPrice, "seed", "seed");
    UI.openMenu("농부 — 채소전", rows, (act,id)=>{
      if(act==="seed"){ NPC._buy("seed", DATA.BUCKWHEAT.seedPrice); }
      else if(act.startsWith("b:")){ NPC._buy(id, +act.slice(2)); }
      NPC._nongbuShop(); UI.refreshHUD();
    });
  },

  /* ---------------- 방앗간: 가공(국수/두부) + 누룩 + 방앗간 요리 학습 ---------------- */
  banga(){
    UI.startDialogue("방앗간지기 🌾", ["메밀을 빻아 국수를 뽑고, 콩으로 두부도 만든다네."],
      { choices: Quests.npcChoices("banga").concat([
          { label:`메밀가루→국수사리 (가루2 → 국수3) `, value:"noodle" },
          { label:`두부 사기 — 10냥`, value:"tofu" },
          { label:`누룩 사기 — 12냥`, value:"nuruk" },
          { label:"방앗간 요리 배우기", value:"learn" },
          { label:"나간다", value:"bye" }]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="noodle"){ if(Player.count("flour")>=2){ Player.remove("flour",2); Player.add("noodle",3); Sound.sfx("confirm"); toast("국수사리 ×3","good"); } else { Sound.sfx("error"); toast("메밀가루가 부족하다(2 필요)","bad"); } }
          else if (v==="tofu"){ NPC._buy("tofu",10); }
          else if (v==="nuruk"){ NPC._buy("nuruk",12); }
          else if (v==="learn"){ NPC.recipeShop("banga"); }
          UI.refreshHUD();
        }});
  },

  /* ---------------- 푸줏간: 고기/생선 + 고기요리 학습 ---------------- */
  pujut(){
    UI.startDialogue("푸줏간 주인 🔪", ["갓 잡은 고기와 조기일세. 국밥이며 산적이며 다 여기서 시작이지."],
      { choices: Quests.npcChoices("pujut").concat([
          { label:`돼지고기 — 18냥`, value:"pork" },
          { label:`조기(생선) — 14냥`, value:"fish" },
          { label:"고기 요리 배우기", value:"learn" },
          { label:"나간다", value:"bye" }]),
        onChoice(v){
          if (Quests.handleChoice(v)) return;
          if (v==="pork"){ NPC._buy("pork",18); }
          else if (v==="fish"){ NPC._buy("fish",14); }
          else if (v==="learn"){ NPC.recipeShop("pujut"); }
          UI.refreshHUD();
        }});
  },
};
