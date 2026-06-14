/* =========================================================================
 * 건물 내부 — 마을 건물에 들어가면 실내(interior 구역)로 전환
 *  실내엔 주인 NPC + 나가기 문. NPC와 대화하면 그 건물의 기능(상점/서비스).
 * ======================================================================= */
const Interior = {
  ret: { zone:"village", tx:10, ty:9 },

  enter(bldgId, fromTx, fromTy){
    const b = DATA.BUILDINGS[bldgId];
    if (!b){ return; }
    const I = Maps.interior;
    I.floorColor = b.floor;
    I.name = b.name;
    I.objects = [
      { type:"npc_in", tx:9, ty:3, w:2, h:2, solid:true, npc:b.npc, action:"npc" },
      // 문은 '밟으면 나가는' 출구 타일(아래 exits)로 처리 — 상호작용 대상에서 제외해 ▼가 안 뜨게
      { type:"door_out", tx:9, ty:13, w:2, h:1 },
    ];
    // 바닥 소품(장식) — 건물 분위기
    I.props = b;
    Interior.ret = { zone:"village", tx:fromTx, ty:fromTy };
    I.exits = [
      { tx:9,  ty:13, to:"village", sx:fromTx, sy:fromTy },
      { tx:10, ty:13, to:"village", sx:fromTx, sy:fromTy },
    ];
    Sound.sfx("blip");
    World.changeZone("interior", 10, 11);
  },

  exit(){
    World.changeZone(Interior.ret.zone, Interior.ret.tx, Interior.ret.ty);
  },
};
