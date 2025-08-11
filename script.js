(function(){
  'use strict';

  // Elements
  const lockOverlay = document.getElementById('lockOverlay');
  const passInput = document.getElementById('passInput');
  const passSubmit = document.getElementById('passSubmit');
  const passHint = document.getElementById('passHint');

  const gameRoot = document.getElementById('game');
  const scoreEl = document.getElementById('score');
  const perClickEl = document.getElementById('perClick');
  // auto-per-sec removed

  const clickButton = document.getElementById('clickButton');
  const playArea = document.getElementById('playArea');

  const buyClickBtn = document.getElementById('buyClick');
  const costClickEl = document.getElementById('costClick');
  const lvlClickEl = document.getElementById('lvlClick');

  // auto upgrade elements removed

  const shatterOverlay = document.getElementById('shatterOverlay');
  const loveScene = document.getElementById('loveScene');
  const lyricsEl = document.getElementById('lyrics');
  const bgm = document.getElementById('bgm');
  const videoOverlay = document.getElementById('videoOverlay');
  const loveVideo = document.getElementById('loveVideo');

  const bgCanvas = document.getElementById('bgParticles');
  const ctx = bgCanvas.getContext('2d');

  // State
  const PASSWORD = '0509';
  const TARGET_SCORE = 509;
  const state = {
    score: 0,
    perClick: 1,
    lvlClick: 0,
    costClick: 10,
    unlocked: false,
    finaleStarted: false,
  };

  // Utils
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const fmt = (n) => new Intl.NumberFormat().format(n);

  function updateHUD(){
    scoreEl.textContent = fmt(state.score);
    perClickEl.textContent = fmt(state.perClick);
    lvlClickEl.textContent = state.lvlClick;
    costClickEl.textContent = fmt(state.costClick);

    // Enable/disable buy buttons
    toggleBuyState(buyClickBtn, state.score >= state.costClick);
  }

  function toggleBuyState(button, enabled){
    if(enabled){
      button.classList.add('enabled');
    } else {
      button.classList.remove('enabled');
    }
  }

  function addScore(amount){
    state.score += amount;
    updateHUD();
    if(!state.finaleStarted && state.score >= TARGET_SCORE){
      state.finaleStarted = true;
      startFinale();
    }
  }

  function tryBuyClick(){
    if(state.score < state.costClick) return;
    state.score -= state.costClick;
    state.lvlClick += 1;
    // Increase per click: base + floor(lvl/2)
    state.perClick = 1 + Math.floor(state.lvlClick * 0.5) + state.lvlClick;
    // Cost scaling
    state.costClick = Math.ceil(state.costClick * 1.65);
    updateHUD();
    pulseButton(buyClickBtn);
  }

  function tryBuyAuto(){ /* removed */ }

  function pulseButton(el){
    el.animate([
      { transform:'scale(1)' },
      { transform:'scale(1.06)' },
      { transform:'scale(1)' }
    ], { duration:220, easing:'ease-out' });
  }

  // Click FX
  function showClickBurst(x, y, amount){
    const span = document.createElement('span');
    span.className = 'click-plus';
    span.textContent = `+${amount}`;
    span.style.left = x + 'px';
    span.style.top = y + 'px';
    span.style.opacity = '0';
    playArea.appendChild(span);

    const dx = (Math.random() - 0.5) * 80;
    const dy = -60 - Math.random() * 40;
    span.animate([
      { transform:`translate(-50%,-50%) translate(0,0)`, opacity:0 },
      { transform:`translate(-50%,-50%) translate(${dx/2}px, ${dy/2}px)`, opacity:1, offset:0.2 },
      { transform:`translate(-50%,-50%) translate(${dx}px, ${dy}px)`, opacity:0 }
    ], { duration:700, easing:'cubic-bezier(.2,.7,.2,1)' }).addEventListener('finish', ()=>{
      span.remove();
    });

    // confetti-like particles
    for(let i=0;i<6;i++){
      spawnConfetti(x, y);
    }
  }

  function spawnConfetti(x, y){
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random()*6;
    p.style.width = p.style.height = size + 'px';
    p.style.left = (x - size/2) + 'px';
    p.style.top = (y - size/2) + 'px';
    p.style.background = `radial-gradient(circle at 40% 40%, ${randAccent()}, transparent 65%)`;
    document.body.appendChild(p);
    const tx = (Math.random()-0.5) * 200;
    const ty = -80 - Math.random() * 120;
    const rot = (Math.random()-0.5) * 360 + 'deg';
    p.animate([
      { transform:'translate(0,0) rotate(0deg)', opacity:1 },
      { transform:`translate(${tx}px, ${ty}px) rotate(${rot})`, opacity:0 }
    ], { duration:900 + Math.random()*400, easing:'cubic-bezier(.2,.8,.2,1)' }).addEventListener('finish', ()=>{
      p.remove();
    });
  }

  function randAccent(){
    const colors = ['#60a5fa', '#f472b6', '#a78bfa', '#34d399', '#f87171'];
    return colors[(Math.random()*colors.length)|0];
  }

  // Background canvas particles
  let stars = [];
  function resizeCanvas(){
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    bgCanvas.width = Math.floor(window.innerWidth * dpr);
    bgCanvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }
  function initStars(){
    const count = Math.floor(window.innerWidth * window.innerHeight / 12000);
    stars = new Array(count).fill(0).map(()=>({
      x: Math.random()*window.innerWidth,
      y: Math.random()*window.innerHeight,
      r: Math.random()*1.6 + 0.2,
      a: Math.random()*0.6 + 0.2,
      t: Math.random()*Math.PI*2,
      sp: 0.5 + Math.random()*1.5,
    }));
  }
  function tickStars(ts){
    ctx.clearRect(0,0,window.innerWidth, window.innerHeight);
    for(const s of stars){
      s.t += 0.005 * s.sp;
      const tw = (Math.sin(s.t) + 1) * 0.5;
      ctx.globalAlpha = clamp(s.a * (0.6 + tw*0.8), 0, 1);
      ctx.fillStyle = '#c7d2fe';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.6 + tw*0.6), 0, Math.PI*2);
      ctx.fill();
    }
  }
  function rafLoop(){
    tickStars();
    requestAnimationFrame(rafLoop);
  }

  // Password gate
  function unlock(){
    state.unlocked = true;
    lockOverlay.classList.remove('visible');
    gameRoot.classList.remove('hidden');
    updateHUD();
    tryPlayAudio();
  }

  function tryPlayAudio(){
    if(!bgm) return;
    bgm.volume = 0.5;
    const p = bgm.play();
    if(p && p.catch){ p.catch(()=>{}); }
  }

  passSubmit.addEventListener('click', ()=>{
    if(passInput.value.trim() === PASSWORD){ unlock(); }
    else showPassError();
  });
  passInput.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      if(passInput.value.trim() === PASSWORD){ unlock(); }
      else showPassError();
    }
  });

  function showPassError(){
    passHint.textContent = 'Wrong password. Try again ♡';
    passHint.style.color = 'var(--danger)';
    passInput.animate([
      { transform:'translateX(0)' },
      { transform:'translateX(-6px)' },
      { transform:'translateX(6px)' },
      { transform:'translateX(0)' },
    ], { duration:220, easing:'ease-in-out' });
  }

  // Game interactions
  clickButton.addEventListener('click', (ev)=>{
    if(!state.unlocked || state.finaleStarted) return;
    addScore(state.perClick);
    const rect = playArea.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    showClickBurst(x, y, state.perClick);
  });

  buyClickBtn.addEventListener('click', ()=>{
    if(!state.unlocked || state.finaleStarted) return;
    tryBuyClick();
  });
  // removed auto upgrade binding

  // removed auto income

  // Finale sequence
  function startFinale(){
    // Disable interaction
    gameRoot.style.pointerEvents = 'none';
    // Shatter, then show love scene
    shatterScreen({ onDone: showLoveScene });
  }

  function shatterScreen({ onDone }){
    shatterOverlay.classList.add('visible');
    // camera zoom for more drama
    document.body.classList.add('camera-zoom');
    // Flash
    const flash = document.createElement('div');
    flash.className = 'flash';
    document.body.appendChild(flash);
    flash.addEventListener('animationend', ()=>flash.remove());
    // Shockwave
    const shock = document.createElement('div');
    shock.className = 'shockwave';
    document.body.appendChild(shock);
    setTimeout(()=>shock.remove(), 2200);
    // Create shards across viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cols = 12, rows = 7; // aesthetic grid
    const cellW = vw / cols;
    const cellH = vh / rows;
    const centerX = vw/2, centerY = vh/2;
    const shards = [];

    for(let r=0; r<rows; r++){
      for(let c=0; c<cols; c++){
        const x = c * cellW;
        const y = r * cellH;
        // Split into two triangles
        const polys = Math.random() < 0.5
          ? [
              // diag tl->br
              [[x,y],[x+cellW,y],[x,y+cellH]],
              [[x+cellW,y],[x+cellW,y+cellH],[x,y+cellH]]
            ]
          : [
              // diag bl->tr
              [[x,y],[x+cellW,y],[x+cellW,y+cellH]],
              [[x,y],[x+cellW,y+cellH],[x,y+cellH]]
            ];
        for(const tri of polys){
          const div = document.createElement('div');
          div.className = 'shard';
          const polyStr = tri.map(p=>`${p[0]}px ${p[1]}px`).join(',');
          div.style.setProperty('--poly', polyStr);
          // Move vector from center
          const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
          const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
          const dx = cx - centerX;
          const dy = cy - centerY;
          const dist = Math.hypot(dx, dy) + 1;
          const n = { x: dx / dist, y: dy / dist };
          const magnitude = 80 + Math.random()*220 + dist*0.25;
          const tx = n.x * magnitude + (Math.random()-0.5)*60;
          const ty = n.y * magnitude + (Math.random()-0.5)*60;
          const rot = ((Math.random()-0.5)*80) + 'deg';
          div.style.setProperty('--tx', `${tx}px`);
          div.style.setProperty('--ty', `${ty}px`);
          div.style.setProperty('--rot', rot);
          div.style.setProperty('--ox', `${cx}px`);
          div.style.setProperty('--oy', `${cy}px`);
          shards.push(div);
        }
      }
    }

    // Mount shards
    for(const s of shards){ shatterOverlay.appendChild(s); }

    // When animations end (roughly), proceed (longer)
    setTimeout(()=>{
      document.body.classList.remove('camera-zoom');
      shatterOverlay.classList.remove('visible');
      shatterOverlay.innerHTML = '';
      onDone && onDone();
    }, 2300);
  }

  async function showLoveScene(){
    loveScene.classList.add('visible');
    // Lyrics
    try{
      const res = await fetch('./assets/lyrics.txt');
      if(res.ok){
        const text = await res.text();
        renderLyrics(text);
      } else {
        renderLyrics('Add your lyrics in assets/lyrics.txt');
      }
    } catch(err){
      renderLyrics('Add your lyrics in assets/lyrics.txt');
    }
    // Local video playback overlay
    if(videoOverlay && loveVideo){
      videoOverlay.addEventListener('click', ()=>{
        try{ loveVideo.play(); }catch(_){/* ignore */}
        videoOverlay.classList.add('hidden');
      }, { once:true });
    }
  }

  function renderLyrics(text){
    lyricsEl.innerHTML = '';
    const lines = text.split(/\r?\n/).filter(Boolean);
    let i = 0;
    function step(){
      if(i >= lines.length) return;
      const p = document.createElement('p');
      p.textContent = lines[i++];
      p.style.opacity = '0';
      lyricsEl.appendChild(p);
      p.animate([
        { transform:'translateY(6px)', opacity:0 },
        { transform:'translateY(0)', opacity:1 }
      ], { duration:420, easing:'ease-out' });
      // Auto scroll
      lyricsEl.scrollTo({ top: lyricsEl.scrollHeight, behavior:'smooth' });
      setTimeout(step, 1200);
    }
    step();
  }

  // Init particles backdrop and a few ambient floaters
  function spawnAmbientParticles(){
    for(let i=0;i<16;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 6 + Math.random()*14;
      p.style.width = p.style.height = size + 'px';
      p.style.left = Math.random()*window.innerWidth + 'px';
      p.style.top = Math.random()*window.innerHeight + 'px';
      p.style.animationDuration = 10 + Math.random()*10 + 's';
      document.body.appendChild(p);
    }
  }

  // Boot
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  requestAnimationFrame(rafLoop);
  spawnAmbientParticles();

  // Removed YouTube API path; using local video instead

  // Glitter burst when love scene appears
  const loveObserver = new MutationObserver(()=>{
    if(loveScene.classList.contains('visible')){
      burstGlitter(window.innerWidth/2, window.innerHeight*0.45, 80);
      loveObserver.disconnect();
    }
  });
  loveObserver.observe(loveScene, { attributes:true, attributeFilter:['class'] });

  function burstGlitter(cx, cy, count){
    for(let i=0;i<count;i++){
      const g = document.createElement('div');
      g.className = 'glitter';
      const ang = Math.random()*Math.PI*2;
      const dist = 80 + Math.random()*220;
      const tx = Math.cos(ang)*dist;
      const ty = Math.sin(ang)*dist;
      g.style.setProperty('--gtx', tx+'px');
      g.style.setProperty('--gty', ty+'px');
      g.style.left = (cx + (Math.random()-0.5)*20) + 'px';
      g.style.top = (cy + (Math.random()-0.5)*20) + 'px';
      document.body.appendChild(g);
      setTimeout(()=>g.remove(), 1700);
    }
  }

})();


