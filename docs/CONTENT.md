# 조선 나물전기 — 콘텐츠 편집 가이드 (기획자용)

> 이 문서는 **게임에 실제로 구현된 모든 콘텐츠**와 **어디를 고치면 무엇이 바뀌는지**를 정리한 것입니다.
> 대부분의 콘텐츠는 `js/data.js`의 **데이터 테이블**로 분리돼 있어, 코드를 몰라도 값만 바꾸면 게임이 바뀝니다.
> 값을 수정한 뒤에는 `index.html` 맨 아래 `?v=숫자`를 +1 올려야 브라우저 캐시가 갱신됩니다.
> 기획 원문 사양은 [design-spec-snapshot.md](design-spec-snapshot.md) 참고.

---

## 0. 빠른 시작 — "이걸 바꾸고 싶다"

| 바꾸고 싶은 것 | 파일 / 테이블 |
|---|---|
| 새 요리(메뉴) 추가·가격·재료 순서 | `data.js` › `DATA.RECIPES` |
| 요리 재료 추가·가격 | `data.js` › `DATA.INGREDIENTS` |
| 손님 종류·인내심·지불 배율 | `data.js` › `DATA.CUSTOMERS` |
| NPC 추가 | `data.js` › `DATA.NPCS` + `js/npc.js`에 기능 함수 |
| 건물(내부 진입) 추가 | `data.js` › `DATA.BUILDINGS` + `js/maps.js` 마을 `objects` |
| 약초 종류·계절·가격 | `data.js` › `DATA.HERBS` |
| 몬스터 능력치·드롭·기믹 | `data.js` › `DATA.MONSTERS` |
| 산 구역(존) 분위기·출현 | `data.js` › `DATA.MOUNTAIN_ZONES` |
| 마법·해금 공물 수량 | `data.js` › `DATA.MAGIC` |
| 무기·의상·장신구 | `data.js` › `DATA.WEAPONS` / `COSTUMES` / `ACCESSORIES` |
| 퀘스트 추가·보상 | `js/quests.js` › `Quests.defs` |
| 밸런스 상수(시작 돈·기력 등) | `data.js` › `DATA.CONST` |
| 캐릭터 스프라이트 교체 | `assets/` 이미지 + `assets/slice.py` 재실행 |

---

## 1. 요리 타이쿤 (핵심 수익 루프)

장날(매월 5·10일) **오후**에 주막(주모)에서 시작. 기력 70 소모.
손님이 **특정 음식**을 주문 → 플레이어가 **재료를 순서대로** 넣어 `완성`.

### 1-1. 레시피 `DATA.RECIPES` (`data.js`)
```js
jeon: { id:"jeon", name:"메밀전", icon:"🫓",
        steps:["flour","namul","season"],  // ← 넣어야 하는 '순서'
        price:30,        // 기본 음식값(보수)
        unlock:true,     // true면 시작부터 보유. 없으면 배워야 함
        learn:80,        // 배우는 비용(냥)
        by:"주모",       // 배우는 곳: "주모"|"방앗간"|"푸줏간" (보부상은 자동 랜덤 판매)
        meat:true, drink:true }  // 선택: 고기요리/술 표시(스님=고기X 등 손님 조건)
```
- **새 음식 추가**: 위 형식으로 한 줄 추가. `steps`의 재료 id는 모두 `DATA.INGREDIENTS`에 있어야 함.
- `by` 값에 따라 해당 NPC 대화의 "요리 배우기"에 자동 등장.
- 보수 계산 = `price × 빠른서빙배율 × 손님payMult × 요리숙련보너스 + 팁`.

### 1-2. 재료 `DATA.INGREDIENTS` (`data.js`)
```js
rice: { id:"rice", name:"쌀", icon:"🍚", buy:8, src:"장터/농부" }
```
- `buy>0`이면 장터/상점에서 살 수 있음(연결은 `npc.js`).
- 특수 재료: `namul`(= 보유 약초 아무거나), `flour`(메밀밭 수확), `dotori`(가을 산), `noodle`(방앗간 가공), `tofu/nuruk`(방앗간), `pork/fish`(푸줏간).
- **재료 획득처를 바꾸려면** 해당 NPC 함수(`npc.js`)의 판매 목록도 같이 수정.

### 1-3. 손님 `DATA.CUSTOMERS` (`data.js`)
```js
{ name:"양반 도령", icon:"🎩", patience:10, payMult:1.5, tip:10,
  wants:"kalguksu",  // (선택) 특정 음식만 주문
  veggie:true }      // (선택) 고기요리 주문 안 함
```
- `patience`(초)가 0이 되면 손님이 떠남(0냥).
- 손님 수는 요리 숙련·명성에 비례(코드: `trading.js` `begin()`), 8~18명.

### 1-4. 요리 숙련/명성 (성장)
- 손님 대접마다 `cookXp`(+3), `fame`(+1) 상승 (`DATA.CONST`).
- 숙련 레벨 = `DATA.cookLevel(xp)`, 보수 배율 = `DATA.cookPayBonus(xp)` (레벨당 +8%). **곡선 조절은 이 두 함수.**
- 서당(훈장)에서 `cookTrain`(영구 음식값 +5%) 구매 가능.

---

## 2. NPC (12종) — `DATA.NPCS` + `js/npc.js`

| id | 이름 | 기능(건물) |
|---|---|---|
| jumo | 주모 | 주막 장사 시작, 요리 배우기, 나물죽(회복) |
| daejang | 대장장이 | 무기 강화/구매, 호미 등급 |
| mudang | 무당 | 당나무/신통력 안내, 설화, 산삼 선물 |
| chonjang | 촌장 | 메인 퀘스트, 일일 약초 납품, 마을 이야기 |
| uisang | 의상점 주인 | 의상(한복) 구매 |
| uiwon | 의원 | 완전 회복, 최대 체력/신력 증강 |
| yakcho | 약초상 | 약초 +30% 매입, 양념·도토리 판매 |
| hunjang | 훈장(서당) | 요리 수련(+5%), 무예 수련(공격력), 글(경험치) |
| bobu | 보부상 | 장날 한정 진귀템·비전 요리책 |
| nongbu | 농부 | 채소·곡물 저가, 메밀밭 비옥화(수확량↑) |
| banga | 방앗간지기 | 메밀가루→국수 가공, 두부/누룩, 방앗간 요리 |
| pujut | 푸줏간 주인 | 돼지고기/조기, 고기요리 |
| geonchuk | 방물장수 | 장신구(노리개/부적) |

- **NPC 추가**: `DATA.NPCS`에 `{id,name,icon,color}` 추가 → `npc.js` `interact()`에 분기 + 기능 함수 작성.
- NPC 대화에는 진행 가능한 퀘스트가 자동으로 끼어듦(`Quests.npcChoices`).

---

## 3. 건물 & 내부 — `DATA.BUILDINGS` + `js/maps.js` + `js/interior.js`

- 마을(`maps.js` `village.objects`)의 `{type:"bldg", tx,ty, bldg:"<건물id>", action:"enter"}`가 외부 문.
- 문에서 Space → `interior.js`가 `DATA.BUILDINGS[id]`로 실내(바닥색·주인 NPC) 구성 → 실내 진입.
- 실내에서 주인과 대화 = 그 건물의 기능. 아래 "나가기" 문으로 복귀.
```js
DATA.BUILDINGS.uiwon = { name:"의원", npc:"uiwon", floor:"#3a4a3a", sign:"#2e8b57" }
```
- **건물 추가**: `DATA.BUILDINGS`에 정의 + `maps.js` `village.objects`에 `bldg` 오브젝트(빈 자리에 `tx,ty` 배치, 폭 3·높이 2 권장).
- 현재 마을: 윗줄 5채(무당/의원/의상점/약초방/서당), 아랫줄 5채(대장간/푸줏간/방앗간/촌장댁/주막), 가운데 장터 좌판 + 노점 3인(방물장수·농부·보부상).

---

## 4. 맵 / 산 4구역 — `js/maps.js` + `DATA.MOUNTAIN_ZONES`

- 구역: `house`(집·메밀밭) → `village`(마을) → `mtn1~mtn4`(산) → `interior`(건물 내부).
- 타일: `.`풀 `,`길 `T`나무 `W`물 `R`바위 `F`마루 `#`벽. (grid는 20×15 고정)
- 산 구역 분위기/출현:
```js
{ key:"mtn2", name:"산 중턱", tint:"rgba(18,22,66,0.34)", fog:false,
  tier:2,                  // 채집 약초 등급
  monsters:["mulgwisin"],  // 출현 몬스터
  count:[3,4] }            // 한 번에 등장 수 범위
```
- 구역 전환은 각 맵의 `exits:[{tx,ty,to,sx,sy}]` (가장자리 타일을 밟으면 이동).

---

## 5. 채집 약초 — `DATA.HERBS`
```js
doraji: { id:"doraji", name:"도라지", tier:2, season:"봄", icon:"🌱", price:22, heal:14 }
```
- `tier` 1/2/3(흔함/희귀/명품), `season` 봄/여름/가을/겨울. 산에서 빛나는 표식으로 채집.
- 요리에서 `namul` 재료 = 보유한 약초 아무거나 1개.

---

## 6. 전투 — `DATA.MONSTERS` / `DATA.MAGIC` / `DATA.WEAPONS`

### 몬스터
```js
mulgwisin: { name:"물귀신", hp:36, atk:9, acc:0.9, exp:14, gold:26,
             zone:"mtn2", detect:5, speed:1.0,   // 필드: 감지반경(타일)·추격속도
             gimmick:"agiDown",                   // 전투 기믹
             commonDrops:["wet_cloth","sea_mustard"], // 잡템(판매)
             tribute:"cold_mist", tributeRate:0.18 }   // 공물(마법 해금)
```
- 기믹: `mischief`(기력훔침)·`agiDown`(민첩↓)·`evasion`(물리회피50%)·`taesan`(3턴마다 즉사급). 새 기믹은 `combat.js`에 로직 추가 필요.

### 마법 (당나무 제단에서 공물로 해금)
```js
hangi: { name:"한기 서림", sub:"빙결", mp:10, dmg:10, target:"all",
         effect:"agiDown", eff:2,            // 효과·지속
         tribute:"cold_mist", need:25 }      // 필요 공물·수량
```
- `target`: `"all"`(전체) 또는 숫자(랜덤 N체). `effect`: burn/agiDown/stun/atkDown.

### 무기 / 의상 / 장신구
- `DATA.WEAPONS`(공격력·무게·기절), `DATA.COSTUMES`(기력효율·이동속도·저고리색), `DATA.ACCESSORIES`(최대신력·드롭률).

---

## 7. 퀘스트 — `js/quests.js` › `Quests.defs`
```js
s_feast: {
  giver:"pujut",            // 의뢰/보고 NPC
  prereq:"q_smith",         // (선택) 선행 퀘스트
  story:true,               // (선택) 메인 스토리 표시
  title:"사또의 잔칫상",
  desc:"국밥을 3그릇 대접하기.",
  goal:{ type:"serve", count:3, dish:"gukbap" },
  start:["..."], ready:["..."],   // 수락/완료 대사
  reward:{ money:260, exp:20, item:{id:"pork",n:3} },
}
```
- **goal.type**: `gather`(약초채집수) · `defeat`(처치수, `mon:`으로 특정) · `serve`(대접수, `dish:`로 특정 음식) · `sell`(약초판매수) · `gold`(보유 냥) · `fame`(명성) · `cooklv`(요리레벨) · `recipes`(아는 요리수) · `deliver`(아이템 납품) · `talkAll`(여러 NPC 인사).
- **reward**: money/exp/item/aff/weaponUpgrade/magic/pet 조합.
- 현재 라인: 신고식→텃밭→주모손맛→(무쇠/요괴/산삼/펫/두억시니 토벌) + 사이드(한밑천·보부상·도깨비내기·메뉴늘리기·요리명인·마을명물·사또잔치).

---

## 8. 진행/분량 설계 메모 (≈2시간 목표)

- **하루 18분(실시간)**, 장날은 5·10일 → 한 계절(30일) 안에 6번 장사. 초반엔 약초 판매+소규모 장사, 중반 레시피 확장+숙련, 후반 비싼 요리(국밥·동동주)와 보스(두억시니).
- **돈 소비처**(롱런 동기): 레시피 학습, 의상/장신구, 무기 강화, 의원 최대치 증강, 훈장 수련, 메밀밭 비옥화, 공물 모으기(시간).
- **밸런스 손잡이**: `DATA.RECIPES.price/learn`, `DATA.cookPayBonus`, `DATA.MONSTERS.*`, `DATA.MAGIC.need`(공물 요구량 — 현재 다소 그라인디, 낮추면 빨라짐), `DATA.CONST`.

---

## 9. 스프라이트 교체

- 원본 시트: `assets/image-*.webp`. 슬라이서: `assets/slice.py` (Pillow+numpy+scipy).
- `python slice.py` → `assets/frames/*.png` 생성(배경 투명). 매핑: `b0_x` idle, `b1_x·b2_x` 걷기, `b4_0/b4_1` 전투(낫), `b3_2·b3_3` 농사, `b4_2·b4_3` 요리.
- 게임 로드/렌더: `js/sprites.js`. 프레임 이름↔용도 매핑은 `Sprites.DIR` / `Sprites.frameFor`.
- 새 시트로 교체 시 격자가 다르면 `slice.py`의 검출 파라미터(`min_run/gap/thresh`)만 조정.
