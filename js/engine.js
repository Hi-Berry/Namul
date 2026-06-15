/* =========================================================================
 * 엔진 — 전역 상태(G) / 입력 / 시간 / 씬 매니저 / 유틸
 * ======================================================================= */

const G = {
  canvas: null,
  ctx: null,
  W: 800, H: 600,

  scene: "title",        // title | world | trade | combat
  scenes: {},            // name -> {enter, update(dt), render(ctx), key(e), click(x,y)}
  paused: false,         // 메뉴/대화 중 시간 정지

  // 시간: 하루 06:00~24:00 = 1080분. min=0 → 06:00
  time: { day: 1, min: 0 },
  DAY_START_MIN: 6 * 60, // 06:00
  DAY_LEN: 18 * 60,      // 1080분
  _msAcc: 0,             // 실시간 누적(ms)
  MS_PER_MIN: 500,       // 실시간 0.5초당 게임 1분 (하루 1080분 ≈ 9분 소요)

  player: null,          // player.js 에서 생성
  flags: {},             // 진행/퀘스트 플래그

  // 입력
  keys: {},
  justKeys: {},
  mouse: { x: 0, y: 0, down: false, clicked: false },
};

/* ---------- 유틸 ---------- */
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
function randInt(a, b){ return a + Math.floor(Math.random() * (b - a + 1)); }
function choice(arr){ return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p){ return Math.random() < p; }

/* 등급 가중치 채집: tier1 흔함 / tier2 보통 / tier3 희귀 */
function weightedHerb(herbs, qualityBoost){
  // qualityBoost: 0~1, 높을수록 상위 등급 확률 증가 (호미 등급 영향)
  const w = { 1: 70, 2: 24, 3: 6 };
  if (qualityBoost){ w[1] -= 30*qualityBoost; w[2] += 12*qualityBoost; w[3] += 18*qualityBoost; }
  const pool = [];
  herbs.forEach(h => { const n = Math.max(1, Math.round(w[h.tier])); for(let i=0;i<n;i++) pool.push(h); });
  return choice(pool);
}

/* ---------- 시간 ---------- */
const Time = {
  totalMin(){ return G.time.min; },
  clockStr(){
    const t = G.DAY_START_MIN + G.time.min;
    const h = Math.floor(t / 60) % 24;
    const m = Math.floor(t % 60);
    return String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0");
  },
  season(){ return DATA.SEASONS[Math.floor((G.time.day - 1) / 30) % 4]; },
  dayOfSeason(){ return ((G.time.day - 1) % 30) + 1; },
  // 장날: 매 5일, 10일 (월=30일 기준 5,10,15,20,25,30)
  isMarketDay(){ return Time.dayOfSeason() % 5 === 0; },
  // 장날 오전(06~12) 상점 운영 / 오후(12~24) 주막 장사
  isMorning(){ return (G.DAY_START_MIN + G.time.min) < 12*60; },

  advance(min){
    if (min <= 0) return;
    G.time.min += min;
    Farming.onTimeAdvance();          // 작물 성장 체크는 일 단위라 무시되지만 안전호출
    if (G.time.min >= G.DAY_LEN){
      // 24시 강제 취침 (다음날 10시 = 240분)
      sleep(true);
    }
  },
};

/* 취침: forced=false → 다음날 06:00, forced=true(24시 초과) → 다음날 10:00 */
function sleep(forced){
  Sound.sfx("sleep");
  G.time.day += 1;
  G.time.min = forced ? (10*60 - G.DAY_START_MIN) : 0; // 10:00 → min=240
  Player.onNewDay();
  Farming.onNewDay();
  World.onNewDay();
  Save.auto();
  const head = forced ? "쓰러지듯 잠들었다…" : "잘 잤다!";
  const md = Time.isMarketDay() ? " 오늘은 <b>장날</b>입니다!" : "";
  toast(`${head} ${Time.season()} ${Time.dayOfSeason()}일 아침` , "good");
  if (md) toast("📜 오늘은 장날 — 오전 장보기 / 오후 주막 장사", "gold");
  UI.refreshHUD();
}

/* ---------- 토스트 ---------- */
let _toasts = [];
function toast(msg, kind){
  const wrap = document.getElementById("toast-wrap");
  const el = document.createElement("div");
  el.className = "toast" + (kind ? " " + kind : "");
  el.innerHTML = msg;
  wrap.appendChild(el);
  const item = { el, t: 2.6 };
  _toasts.push(item);
  if (_toasts.length > 5){ const old = _toasts.shift(); old.el.remove(); }
}
function updateToasts(dt){
  for (let i = _toasts.length - 1; i >= 0; i--){
    _toasts[i].t -= dt;
    if (_toasts[i].t <= 0){ _toasts[i].el.remove(); _toasts.splice(i,1); }
    else if (_toasts[i].t < 0.5){ _toasts[i].el.style.opacity = _toasts[i].t / 0.5; }
  }
}

/* ---------- 씬 매니저 ---------- */
function setScene(name){
  G.scene = name;
  const s = G.scenes[name];
  if (s && s.enter) s.enter();
  Sound.forScene();
  UI.refreshHUD();
}

/* ---------- 메인 루프 ---------- */
let _last = 0;
function loop(ts){
  const dt = Math.min(0.05, (ts - _last) / 1000 || 0);
  _last = ts;

  // 시간 진행: 정지/대화/메뉴 아닐 때 + 월드 씬에서만 실시간 흐름
  if (!G.paused && G.scene === "world" && !UI.dialogueOpen && !UI.menuOpen){
    G._msAcc += dt * 1000;
    while (G._msAcc >= G.MS_PER_MIN){ G._msAcc -= G.MS_PER_MIN; Time.advance(1); }
  }

  const s = G.scenes[G.scene];
  if (s && s.update) s.update(dt);

  G.ctx.clearRect(0,0,G.W,G.H);
  if (s && s.render) s.render(G.ctx);

  updateToasts(dt);
  UI.refreshHUD();

  // 입력 1프레임 플래그 리셋
  G.justKeys = {};
  G.mouse.clicked = false;

  requestAnimationFrame(loop);
}

/* ---------- 입력 바인딩 ---------- */
function keyId(key){
  if (key.length === 1) return key.toLowerCase();
  if (key.startsWith("Arrow")) return key.toLowerCase();
  return key;
}

function bindInput(){
  window.addEventListener("keydown", (e) => {
    const k = keyId(e.key);
    if (!G.keys[k]) G.justKeys[k] = true;
    G.keys[k] = true;
    // 대화/메뉴/씬별 키 핸들러
    // UI가 입력을 소비하면 같은 프레임에 월드 상호작용으로 새어 나가지 않게 플래그 제거
    // (마지막 대사를 스페이스로 닫는 순간 대화가 다시 열리는 문제 방지)
    if (UI.handleKey(e)) { G.justKeys[k] = false; e.preventDefault(); return; }
    const s = G.scenes[G.scene];
    if (s && s.key) s.key(e);
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
  });
  window.addEventListener("keyup", (e) => {
    G.keys[keyId(e.key)] = false;
  });

  const rect = () => G.canvas.getBoundingClientRect();
  G.canvas.addEventListener("mousemove", (e) => {
    const r = rect();
    G.mouse.x = (e.clientX - r.left) * (G.W / r.width);
    G.mouse.y = (e.clientY - r.top) * (G.H / r.height);
  });
  G.canvas.addEventListener("mousedown", () => { G.mouse.down = true; });
  G.canvas.addEventListener("mouseup", (e) => {
    G.mouse.down = false; G.mouse.clicked = true;
    const r = rect();
    const x = (e.clientX - r.left) * (G.W / r.width);
    const y = (e.clientY - r.top) * (G.H / r.height);
    const s = G.scenes[G.scene];
    if (s && s.click) s.click(x, y);
  });

  MobileInput.init();
}

function keyPressed(k){ return !!G.justKeys[k]; }

/* ---------- 모바일 입력 ---------- */
const MobileInput = {
  stick: null, base: null, zone: null,
  active: false,
  origin: { x: 0, y: 0 },
  maxDist: 40,
  currentKeys: [],

  init() {
    // 실제 모바일/태블릿은 브라우저마다 pointer/hover 보고가 달라 UA와 화면 크기를 함께 본다.
    const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches;
    const smallScreen = Math.min(window.innerWidth, window.innerHeight, screen.width, screen.height) <= 900;
    const isMobileUI = hasTouch && (uaMobile || (coarsePointer && smallScreen));
    if (!isMobileUI) return;

    document.body.classList.add('touch-ui');
    const controls = document.getElementById('mobile-controls');
    if (!controls) return;
    controls.classList.remove('hidden');

    this.zone = document.getElementById('joystick-zone');
    this.base = document.getElementById('joystick-base');
    this.stick = document.getElementById('joystick-stick');

    if (this.zone) {
      this.zone.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
      this.zone.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      this.zone.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
      this.zone.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
    }

    const bindBtn = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.classList.add('active');
        this.dispatchKey(key, 'keydown');
      }, { passive: false });
      const release = (e) => {
        e.preventDefault();
        btn.classList.remove('active');
        this.dispatchKey(key, 'keyup');
      };
      btn.addEventListener('touchend', release, { passive: false });
      btn.addEventListener('touchcancel', release, { passive: false });
    };

    bindBtn('m-btn-space', ' ');
    bindBtn('m-btn-i', 'i');
    bindBtn('m-btn-esc', 'Escape');
  },

  handleTouchStart(e) {
    e.preventDefault();
    this.active = true;
    this.zone.classList.add('active');

    // 조이스틱 중심점 계산
    const rect = this.base.getBoundingClientRect();
    this.origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    this.updateStick(e.changedTouches[0]);
  },

  handleTouchMove(e) {
    if (!this.active) return;
    e.preventDefault();
    this.updateStick(e.changedTouches[0]);
  },

  handleTouchEnd(e) {
    if (!this.active) return;
    e.preventDefault();
    this.active = false;
    this.zone.classList.remove('active');
    this.stick.style.transform = 'translate(-50%, -50%)';
    this.releaseKeys();
  },

  updateStick(touch) {
    const dx = touch.clientX - this.origin.x;
    const dy = touch.clientY - this.origin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let nx = dx, ny = dy;
    if (dist > this.maxDist) {
      nx = (dx / dist) * this.maxDist;
      ny = (dy / dist) * this.maxDist;
    }

    // 기본 translate(-50%, -50%) 에 더해서 이동
    this.stick.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;

    this.updateKeys(dx, dy, dist);
  },

  updateKeys(dx, dy, dist) {
    const keysToPress = [];
    const threshold = 15; // 최소 움직임

    if (dist > threshold) {
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      // 방향 판별 (8방향 지원)
      if (angle > -67.5 && angle < 67.5) keysToPress.push('arrowright');
      if (angle > 112.5 || angle < -112.5) keysToPress.push('arrowleft');
      if (angle > 22.5 && angle < 157.5) keysToPress.push('arrowdown');
      if (angle < -22.5 && angle > -157.5) keysToPress.push('arrowup');
    }

    // 변경된 키 감지
    this.currentKeys.forEach(k => {
      if (!keysToPress.includes(k)) this.dispatchKey(k, 'keyup');
    });
    keysToPress.forEach(k => {
      if (!this.currentKeys.includes(k)) this.dispatchKey(k, 'keydown');
    });

    this.currentKeys = keysToPress;
  },

  releaseKeys() {
    this.currentKeys.forEach(k => this.dispatchKey(k, 'keyup'));
    this.currentKeys = [];
  },

  dispatchKey(key, type) {
    const k = keyId(key);
    if (type === 'keydown') {
      if (!G.keys[k]) G.justKeys[k] = true;
      G.keys[k] = true;

      // UI나 씬의 key 핸들러를 수동으로 트리거 (실제 KeyboardEvent처럼 동작하도록)
      const mockEvent = { key: key, preventDefault: () => {} };
      if (UI.handleKey(mockEvent)) {
        G.justKeys[k] = false;
        return;
      }
      const s = G.scenes[G.scene];
      if (s && s.key) s.key(mockEvent);
    } else if (type === 'keyup') {
      G.keys[k] = false;
    }
  }
};
