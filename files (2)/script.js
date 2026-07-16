/* ==========================================================
   Birthday site — vanilla JS
   Sections: 1) Canvas night sky  2) Preloader  3) Reveal on scroll
             4) Open Letter interaction + typewriter  5) Ambient music
   ========================================================== */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----------------------------------------------------------
     1. CANVAS NIGHT SKY
     A single canvas draws: stars, drifting particles, slow clouds,
     random shooting stars, falling sakura petals, glowing butterflies,
     and a breathing moon. Mouse position adds gentle parallax.
     ---------------------------------------------------------- */
  const canvas = document.getElementById('sky-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, DPR;

  let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let calm = false; // becomes true once user reaches the final section

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / W - 0.5) * 2;
    mouse.targetY = (e.clientY / H - 0.5) * 2;
  });

  // ---- Stars ----
  const STAR_COUNT = Math.floor((W * H) / 6000);
  const stars = Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.3 + 0.3,
    baseAlpha: Math.random() * 0.6 + 0.3,
    twinkleSpeed: Math.random() * 0.02 + 0.005,
    phase: Math.random() * Math.PI * 2,
    depth: Math.random() * 0.6 + 0.2 // parallax depth
  }));

  // ---- Floating glow particles ----
  const PARTICLE_COUNT = 26;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 2.5 + 1,
    vy: -(Math.random() * 0.15 + 0.05),
    vx: (Math.random() - 0.5) * 0.08,
    alpha: Math.random() * 0.4 + 0.15,
    hue: Math.random() > 0.5 ? '199,184,255' : '247,168,196'
  }));

  // ---- Clouds (soft blurred ellipses drifting) ----
  const CLOUD_COUNT = 4;
  const clouds = Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    x: Math.random() * W,
    y: H * (0.1 + Math.random() * 0.3),
    w: 260 + Math.random() * 220,
    h: 50 + Math.random() * 30,
    speed: 0.03 + Math.random() * 0.03,
    alpha: 0.05 + Math.random() * 0.05
  }));

  // ---- Sakura petals ----
  const PETAL_COUNT = 18;
  const petals = Array.from({ length: PETAL_COUNT }, () => makePetal());
  function makePetal() {
    return {
      x: Math.random() * W,
      y: Math.random() * -H,
      size: Math.random() * 8 + 6,
      vy: Math.random() * 0.4 + 0.25,
      vx: Math.random() * 0.3 - 0.15,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.02,
      sway: Math.random() * Math.PI * 2
    };
  }

  // ---- Butterflies ----
  const BUTTERFLY_COUNT = 3;
  const butterflies = Array.from({ length: BUTTERFLY_COUNT }, (_, i) => ({
    x: Math.random() * W,
    y: H * 0.4 + Math.random() * H * 0.4,
    baseY: 0,
    angle: Math.random() * Math.PI * 2,
    speed: 0.25 + Math.random() * 0.15,
    wing: 0,
    radius: 40 + Math.random() * 40
  }));
  butterflies.forEach(b => (b.baseY = b.y));

  // ---- Shooting stars ----
  let shootingStars = [];
  function spawnShootingStar() {
    if (calm) return;
    shootingStars.push({
      x: Math.random() * W * 0.7 + W * 0.15,
      y: Math.random() * H * 0.25,
      len: 120 + Math.random() * 80,
      speed: 8 + Math.random() * 4,
      angle: Math.PI / 4,
      life: 1
    });
  }
  function scheduleShootingStar() {
    const delay = 4000 + Math.random() * 6000;
    setTimeout(() => { spawnShootingStar(); scheduleShootingStar(); }, delay);
  }
  scheduleShootingStar();

  // ---- Moon ----
  const moon = { x: 0, y: 0, r: 46 };
  function positionMoon() { moon.x = W * 0.82; moon.y = H * 0.18; }
  positionMoon();
  window.addEventListener('resize', positionMoon);

  let t = 0;

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    // gentle parallax easing
    mouse.x += (mouse.targetX - mouse.x) * 0.03;
    mouse.y += (mouse.targetY - mouse.y) * 0.03;

    drawClouds();
    drawStars();
    drawMoon();
    drawParticles();
    if (!calm) drawPetals();
    if (!calm) drawButterflies();
    drawShootingStars();

    requestAnimationFrame(draw);
  }

  function drawClouds() {
    clouds.forEach(c => {
      c.x += c.speed;
      if (c.x - c.w > W) c.x = -c.w;
      const px = c.x + mouse.x * 6;
      const grad = ctx.createRadialGradient(px, c.y, 0, px, c.y, c.w);
      grad.addColorStop(0, `rgba(199,184,255,${c.alpha})`);
      grad.addColorStop(1, 'rgba(199,184,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(px, c.y, c.w, c.h, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawStars() {
    stars.forEach(s => {
      s.phase += s.twinkleSpeed;
      const alpha = s.baseAlpha + Math.sin(s.phase) * 0.3 * (calm ? 0.5 : 1);
      const px = s.x + mouse.x * 14 * s.depth;
      const py = s.y + mouse.y * 14 * s.depth;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, alpha)})`;
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawMoon() {
    const pulse = 1 + Math.sin(t * 0.01) * 0.04;
    const px = moon.x + mouse.x * 8;
    const py = moon.y + mouse.y * 8;
    const glowR = moon.r * 3.2 * pulse;
    const glow = ctx.createRadialGradient(px, py, moon.r * 0.4, px, py, glowR);
    glow.addColorStop(0, 'rgba(247,240,255,0.55)');
    glow.addColorStop(0.4, 'rgba(199,184,255,0.22)');
    glow.addColorStop(1, 'rgba(199,184,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(px, py, glowR, 0, Math.PI * 2);
    ctx.fill();

    const moonGrad = ctx.createRadialGradient(px - moon.r * 0.3, py - moon.r * 0.3, moon.r * 0.1, px, py, moon.r * pulse);
    moonGrad.addColorStop(0, '#ffffff');
    moonGrad.addColorStop(0.6, '#F1EAFF');
    moonGrad.addColorStop(1, '#C7B8FF');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(px, py, moon.r * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue},${p.alpha * (calm ? 0.6 : 1)})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawPetals() {
    petals.forEach(p => {
      p.y += p.vy;
      p.sway += 0.02;
      p.x += p.vx + Math.sin(p.sway) * 0.3;
      p.rot += p.vr;
      if (p.y > H + 20) Object.assign(p, makePetal(), { y: -20 });
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = 'rgba(247,168,196,0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawButterflies() {
    butterflies.forEach(b => {
      b.angle += b.speed * 0.01;
      b.wing += 0.3;
      b.x = W * 0.5 + Math.cos(b.angle) * b.radius * 3 + Math.sin(t * 0.003 + b.angle) * 40;
      b.y = b.baseY + Math.sin(b.angle * 2) * b.radius * 0.4;
      const wingSpread = Math.abs(Math.sin(b.wing)) * 6 + 3;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = 'rgba(199,184,255,0.7)';
      ctx.shadowColor = 'rgba(199,184,255,0.9)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(-wingSpread, 0, wingSpread, wingSpread * 0.7, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(wingSpread, 0, wingSpread, wingSpread * 0.7, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawShootingStars() {
    shootingStars.forEach(s => {
      const dx = Math.cos(s.angle) * s.speed;
      const dy = Math.sin(s.angle) * s.speed;
      s.x += dx; s.y += dy; s.life -= 0.012;
      const tailX = s.x - Math.cos(s.angle) * s.len;
      const tailY = s.y - Math.sin(s.angle) * s.len;
      const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255,255,255,${Math.max(0, s.life)})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    });
    shootingStars = shootingStars.filter(s => s.life > 0 && s.y < H + 50);
  }

  requestAnimationFrame(draw);

  /* ----------------------------------------------------------
     2. PRELOADER
     ---------------------------------------------------------- */
  window.addEventListener('load', () => {
    const pre = document.getElementById('preloader');
    setTimeout(() => pre.classList.add('hidden'), 900);
  });

  /* ----------------------------------------------------------
     3. REVEAL ON SCROLL
     ---------------------------------------------------------- */
  const revealTargets = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.3 });
  revealTargets.forEach(el => io.observe(el));

  // Final section triggers "calm" mode for the canvas + name fade-in
  const finalSection = document.getElementById('final-section');
  const finalName = document.getElementById('final-name');
  const photoFrame = document.querySelector('.photo-frame');
  const finalIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        calm = true;
        photoFrame.classList.add('visible');
        setTimeout(() => finalName.classList.add('visible'), 3200);
      }
    });
  }, { threshold: 0.45 });
  finalIO.observe(finalSection);

  /* ----------------------------------------------------------
     4. OPEN LETTER + TYPEWRITER
     ---------------------------------------------------------- */
  const openBtn = document.getElementById('open-letter-btn');
  const mainEl = document.querySelector('main');
  const letterSection = document.getElementById('letter-section');
  const glassLetter = document.getElementById('glass-letter');
  const letterTextEl = document.getElementById('letter-text');

  const letterParagraphs = [
    "Dear Ain Alisha,",
    "Somewhere between the fading blue of dusk and the hush of midnight, tonight the sky seems to pause just for you.",
    "May this new year hold more laughter than tears, more calm mornings than restless nights, and more moments that remind you how remarkable it is simply to be you.",
    "May your heart find peace in small things \u2014 warm light through a window, the sound of rain, a song that fits your mood exactly.",
    "May your health stay steady, your friendships stay true, and your dreams find gentle, patient ground to grow in.",
    "May you wander into adventures you never planned for, and may every one of them teach you something worth keeping.",
    "And on the days that feel heavy, may you remember: you are allowed to rest, you are allowed to begin again, and you are always, always worth celebrating.",
    "Happy Birthday. May this year treat you kindly."
  ];

  let letterTyped = false;

  function typewriteLetter() {
    if (letterTyped) return;
    letterTyped = true;
    letterTextEl.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    let pIndex = 0;
    function typeParagraph() {
      if (pIndex >= letterParagraphs.length) {
        cursor.remove();
        return;
      }
      const p = document.createElement('p');
      p.style.margin = pIndex === 0 ? '0 0 18px' : '0 0 16px';
      letterTextEl.appendChild(p);
      letterTextEl.appendChild(cursor);
      const text = letterParagraphs[pIndex];
      let cIndex = 0;
      const speed = reduceMotion ? 0 : 18;

      function typeChar() {
        if (cIndex < text.length) {
          p.textContent += text[cIndex];
          cIndex++;
          setTimeout(typeChar, speed + Math.random() * 14);
        } else {
          pIndex++;
          setTimeout(typeParagraph, 380);
        }
      }
      typeChar();
    }
    typeParagraph();
  }

  const musicBtn = document.getElementById('music-toggle');

  openBtn.addEventListener('click', () => {
    mainEl.classList.add('zooming');
    musicBtn.classList.add('shown');

    setTimeout(() => {
      letterSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, 500);

    setTimeout(() => {
      glassLetter.classList.add('visible');
      setTimeout(typewriteLetter, 700);
    }, 1100);
  });

  /* ----------------------------------------------------------
     5. AMBIENT MUSIC (synthesized piano-like pad, fully original —
        generated in-browser via Web Audio API so no external file
        or licensing is required, and nothing autoplays).
     ---------------------------------------------------------- */
  let audioCtx = null;
  let musicNodes = [];
  let playing = false;

  const chord = [261.63, 329.63, 392.0, 466.16]; // C, E, G, Bb — soft, open voicing

  function startMusic() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);
    master.gain.linearRampToValueAtTime(0.06, audioCtx.currentTime + 2);

    chord.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.08 + i * 0.02;
      const lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 3;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const noteGain = audioCtx.createGain();
      noteGain.gain.value = 0.5 / (i + 1.5);

      osc.connect(noteGain);
      noteGain.connect(master);
      osc.start();

      musicNodes.push(osc, lfo, noteGain);
    });

    musicNodes.push(master);
    playing = true;
  }

  function stopMusic() {
    if (!audioCtx) return;
    const master = musicNodes[musicNodes.length - 1];
    master.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
    setTimeout(() => {
      musicNodes.forEach(n => { try { n.stop && n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
      musicNodes = [];
    }, 1100);
    playing = false;
  }

  musicBtn.addEventListener('click', () => {
    if (!playing) {
      startMusic();
      musicBtn.setAttribute('aria-pressed', 'true');
      musicBtn.setAttribute('aria-label', 'Pause ambient music');
    } else {
      stopMusic();
      musicBtn.setAttribute('aria-pressed', 'false');
      musicBtn.setAttribute('aria-label', 'Play ambient music');
    }
  });

})();
