/* =========================================================================
 * 오디오 — Web Audio 합성 (BGM + 효과음, 외부 파일 불필요)
 *  국악풍 5음계(궁상각치우) 멜로디로 귀엽고 정겨운 분위기
 * ======================================================================= */
const Sound = {
  ctx:null, master:null, musicGain:null, sfxGain:null,
  muted:false, started:false,
  _cur:null, _timer:null, _next:0, _step:0, _song:null,

  // 실제 BGM 파일(mp3) — 씬/구역별
  BGM_SRC: {
    morning: "assets/Sound/Bgm/The_Morning_Harvest.mp3",   // 시작·마을·기본
    copper:  "assets/Sound/Bgm/Copper_Gong_Strikes.mp3",   // 전투
    final:   "assets/Sound/Bgm/The_Final_Gong_Strike.mp3", // 깊은 숲(mtn3)
  },
  bgm: { cur:null, els:{}, vol:0.5 }, _bgmInit:false,

  // 음이름 → 주파수
  NF: (()=>{ const m={}; const names=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    for(let o=2;o<=6;o++) for(let i=0;i<12;i++){ m[names[i]+o]=440*Math.pow(2,((o-4)*12+i-9)/12); }
    m["-"]=0; return m; })(),

  init(){
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext||window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.6; this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.32; this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.5; this.sfxGain.connect(this.master);
    } catch(e){}
  },
  resume(){ this.init(); if (this.ctx && this.ctx.state==="suspended") this.ctx.resume(); this.started=true; },

  toggleMute(){
    this.muted=!this.muted;
    if (this.master) this.master.gain.value = this.muted?0:0.6;
    const e = this.bgm.cur ? this.bgm.els[this.bgm.cur] : null;
    if (e) e.volume = this.muted?0:this.bgm.vol;
    toast(this.muted?"🔇 음소거":"🔊 소리 켜짐","");
    return this.muted;
  },

  /* ---- 실제 BGM(mp3) 재생기 ---- */
  initBgm(){
    if (this._bgmInit) return; this._bgmInit=true;
    for (const k in this.BGM_SRC){
      const a = new Audio(this.BGM_SRC[k]);
      a.loop = true; a.preload = "auto"; a.volume = 0;
      this.bgm.els[k] = a;
    }
  },
  playBgm(key){
    this.initBgm();
    const el = this.bgm.els[key]; if (!el) return;
    if (this.bgm.cur===key && !el.paused) return;   // 이미 재생 중이면 유지
    for (const k in this.bgm.els){ if (k!==key){ const o=this.bgm.els[k]; o.pause(); } }
    this.bgm.cur = key;
    el.volume = this.muted ? 0 : this.bgm.vol;
    const p = el.play(); if (p && p.catch) p.catch(()=>{});   // 자동재생 정책 차단 무시(다음 입력 때 재시도)
  },
  stopBgm(){ for (const k in this.bgm.els) this.bgm.els[k].pause(); this.bgm.cur=null; },

  /* ---- 한 음 ---- */
  tone(freq, dur, type, gain, when, dest){
    if (!this.ctx || freq<=0) return;
    const t = when||this.ctx.currentTime;
    const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = type||"square"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain||0.2, t+0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
    o.connect(g); g.connect(dest||this.sfxGain);
    o.start(t); o.stop(t+dur+0.02);
  },
  noise(dur, gain, when){
    if (!this.ctx) return;
    const t=when||this.ctx.currentTime;
    const n=Math.floor(this.ctx.sampleRate*dur);
    const buf=this.ctx.createBuffer(1,n,this.ctx.sampleRate); const d=buf.getChannelData(0);
    for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=this.ctx.createBufferSource(); s.buffer=buf;
    const g=this.ctx.createGain(); g.gain.value=gain||0.2;
    s.connect(g); g.connect(this.sfxGain); s.start(t);
  },

  /* ---- 효과음 ---- */
  sfx(name){
    if (!this.ctx || this.muted) return;
    const T=this.ctx.currentTime, NF=this.NF;
    switch(name){
      case "blip":   this.tone(660,0.05,"square",0.12); break;
      case "select": this.tone(880,0.06,"square",0.16); break;
      case "confirm":this.tone(NF["E5"],0.07,"square",0.18); this.tone(NF["A5"],0.1,"square",0.16,T+0.07); break;
      case "cancel": this.tone(330,0.09,"square",0.16); break;
      case "error":  this.tone(160,0.18,"sawtooth",0.18); break;
      case "step":   this.tone(120,0.04,"triangle",0.10); break;
      case "gather": [0,0.06,0.12].forEach((d,i)=>this.tone(NF["C5"]*Math.pow(1.12,i),0.1,"triangle",0.16,T+d)); break;
      case "coin":   this.tone(NF["B5"],0.07,"square",0.18); this.tone(NF["E6"],0.12,"square",0.16,T+0.06); break;
      case "money":  [NF["C5"],NF["E5"],NF["G5"],NF["C6"]].forEach((f,i)=>this.tone(f,0.1,"square",0.16,T+i*0.05)); break;
      case "hit":    this.tone(200,0.1,"square",0.2); this.noise(0.12,0.18); break;
      case "enemyhit":this.noise(0.16,0.2); this.tone(90,0.16,"sawtooth",0.18); break;
      case "magic":  { const o=this.ctx.createOscillator(),g=this.ctx.createGain();
                       o.type="sine"; o.frequency.setValueAtTime(300,T); o.frequency.exponentialRampToValueAtTime(1400,T+0.4);
                       g.gain.setValueAtTime(0.22,T); g.gain.exponentialRampToValueAtTime(0.001,T+0.5);
                       o.connect(g); g.connect(this.sfxGain); o.start(T); o.stop(T+0.55); } break;
      case "cook":   this.tone(520,0.05,"square",0.14); this.tone(700,0.05,"square",0.14,T+0.05); break;
      case "levelup":[NF["C5"],NF["E5"],NF["G5"],NF["C6"],NF["E6"]].forEach((f,i)=>this.tone(f,0.14,"square",0.18,T+i*0.07)); break;
      case "quest":  [NF["G4"],NF["C5"],NF["E5"],NF["G5"]].forEach((f,i)=>this.tone(f,0.16,"triangle",0.2,T+i*0.08)); break;
      case "fanfare":[NF["C5"],NF["C5"],NF["C5"],NF["E5"],NF["G5"]].forEach((f,i)=>this.tone(f,0.2,"square",0.2,T+i*0.12)); break;
      case "sleep":  this.tone(NF["A4"],0.25,"sine",0.16); this.tone(NF["E4"],0.4,"sine",0.14,T+0.2); break;
      case "win":    [NF["C5"],NF["E5"],NF["G5"],NF["C6"]].forEach((f,i)=>this.tone(f,0.18,"square",0.2,T+i*0.09)); break;
      case "lose":   [NF["C5"],NF["A4"],NF["F4"],NF["C4"]].forEach((f,i)=>this.tone(f,0.26,"triangle",0.18,T+i*0.14)); break;
      case "pet":    this.tone(NF["E5"],0.08,"sine",0.16); this.tone(NF["A5"],0.1,"sine",0.16,T+0.07); break;
    }
  },

  /* ---- BGM (5음계 루프) ---- */
  SONGS: {
    title:    { bpm:96,  mel:["E5","-","G5","E5","D5","E5","A4","-","C5","D5","E5","-","D5","C5","A4","-"], bass:["A2","A2","E2","E2","D2","D2","E2","E2"], wave:"triangle" },
    house:    { bpm:80,  mel:["C5","E5","G5","E5","A5","G5","E5","-","D5","E5","C5","-","-","-","-","-"], bass:["C2","-","G2","-","A2","-","G2","-"], wave:"sine" },
    village:  { bpm:118, mel:["G4","A4","C5","D5","E5","D5","C5","A4","G4","A4","C5","A4","G4","-","-","-"], bass:["C2","G2","C2","G2","D2","A2","C2","G2"], wave:"triangle" },
    mountain: { bpm:74,  mel:["A4","-","C5","-","D5","-","E5","-","D5","C5","A4","-","G4","-","A4","-"], bass:["A2","-","-","-","E2","-","-","-"], wave:"sine" },
    combat:   { bpm:150, mel:["A4","A4","C5","A4","E5","D5","C5","A4","A4","A4","D5","C5","A4","G4","A4","-"], bass:["A1","A1","A1","A1","D2","D2","E2","E2"], wave:"square" },
    trade:    { bpm:132, mel:["C5","E5","G5","C6","G5","E5","C5","E5","D5","F5","A5","F5","D5","E5","G5","-"], bass:["C2","C2","F2","F2","G2","G2","C2","C2"], wave:"square" },
  },

  playMusic(name){
    this.init();
    if (this._cur===name) return;
    this._cur=name; this._song=this.SONGS[name];
    if (!this._song) { this.stopMusic(); return; }
    this._step=0;
    if (!this.ctx) return;
    this._next=this.ctx.currentTime+0.05;
    if (!this._timer) this._timer=setInterval(()=>this._sched(),25);
  },
  stopMusic(){ this._cur=null; this._song=null; },

  _sched(){
    if (!this.ctx || !this._song || this.muted) return;
    const s=this._song, spb=60/s.bpm/2; // 8분음표 기준
    while (this._next < this.ctx.currentTime+0.15){
      const mi=this._step % s.mel.length;
      const f=this.NF[s.mel[mi]];
      if (f) this.tone(f, spb*0.9, s.wave, 0.18, this._next, this.musicGain);
      // 베이스 (4분음표)
      if (this._step%2===0){ const bi=(this._step/2)%s.bass.length; const bf=this.NF[s.bass[bi]];
        if (bf) this.tone(bf, spb*1.8, "triangle", 0.14, this._next, this.musicGain); }
      this._next += spb; this._step++;
    }
  },

  // 씬/구역에 맞는 BGM(mp3) 자동 선택
  forScene(){
    this.stopMusic();  // 절차적 합성 BGM 끔 (실제 mp3 사용)
    if (G.scene==="combat") return this.playBgm("copper");            // 전투
    if (G.scene==="world" && World.zone==="mtn3") return this.playBgm("final"); // 깊은 숲
    return this.playBgm("morning");  // 시작(타이틀)·마을·집·기타 구역·주막 기본
  },
};
