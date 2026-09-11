/**
 * Hogwarts: Hidden Formula - Audio, Particle FX & KaTeX Engine
 * Pure Web Audio API & Canvas particles & KaTeX auto-renderer
 */

(function () {
  'use strict';

  // --- 1. Web Audio Engine ---
  let audioCtx = null;
  let ambientGain = null;
  let ambientOscillators = [];
  let isAmbiancePlaying = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Wand Swish Sound (on challenge card click)
  function playWandCast() {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  // Spell Triumph Chimes (on correct solve)
  function playSpellSuccess() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const freqs = [1046.5, 1318.5, 1567.98, 1975.53, 2093.0];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + (idx * 0.07);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.25);
      });
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  // Fizzle / Thud (on incorrect flag)
  function playSpellFailure() {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(65, now + 0.35);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.42);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  // Ambient Hogwarts Soundscape (toggleable)
  function startAmbiance() {
    const ctx = getAudioContext();
    if (isAmbiancePlaying) return;

    ambientGain = ctx.createGain();
    ambientGain.gain.setValueAtTime(0.001, ctx.currentTime);
    ambientGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2.0);
    ambientGain.connect(ctx.destination);

    const baseFreqs = [146.83, 220.0, 349.23, 523.25];
    ambientOscillators = [];

    baseFreqs.forEach(freq => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);

      osc.connect(filter);
      filter.connect(ambientGain);
      osc.start();
      ambientOscillators.push(osc);
    });

    isAmbiancePlaying = true;
    updateAmbianceBtnState(true);
    localStorage.setItem('hogwarts_ambiance', 'on');
  }

  function stopAmbiance() {
    if (!isAmbiancePlaying || !audioCtx) return;
    const now = audioCtx.currentTime;
    ambientGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
    setTimeout(() => {
      ambientOscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch (e) {}
      });
      ambientOscillators = [];
      isAmbiancePlaying = false;
      updateAmbianceBtnState(false);
      localStorage.setItem('hogwarts_ambiance', 'off');
    }, 1500);
  }

  function toggleAmbiance() {
    if (isAmbiancePlaying) {
      stopAmbiance();
    } else {
      startAmbiance();
    }
  }

  function updateAmbianceBtnState(playing) {
    const btn = document.getElementById('hogwarts-wand-audio-toggle');
    if (!btn) return;
    if (playing) {
      btn.classList.add('playing');
      btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> <span>Lumos Sound (On)</span>';
    } else {
      btn.classList.remove('playing');
      btn.innerHTML = '<i class="fas fa-wand-sparkles"></i> <span>Ambiance (Muted)</span>';
    }
  }

  // --- 2. Robust KaTeX Math Auto-Rendering ---
  function triggerKaTeX(container) {
    const el = container || document.getElementById('challenge-window') || document.querySelector('.challenge-desc') || document.body;
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code"],
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render error:', err);
      }
    } else {
      setTimeout(() => triggerKaTeX(container), 120);
    }
  }

  // --- 3. Interactive DOM Hooks ---
  function initAudioAndKaTeXInteractions() {
    // Wand sound on challenge button click
    document.addEventListener('click', function (e) {
      const target = e.target.closest('.challenge-button, .btn-hogwarts-gold, .btn-hogwarts-outline');
      if (target) {
        playWandCast();
      }
      // If clicking challenge button, trigger KaTeX on the modal
      if (e.target.closest('.challenge-button')) {
        setTimeout(() => triggerKaTeX(), 200);
        setTimeout(() => triggerKaTeX(), 500);
        setTimeout(() => triggerKaTeX(), 1000);
      }
    });

    // Observer for challenge window changes (renders KaTeX & plays triumph/fizzle sounds)
    const observer = new MutationObserver(mutations => {
      let shouldRenderMath = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldRenderMath = true;
        }
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList && (node.classList.contains('alert-success') || node.querySelector('.alert-success'))) {
              playSpellSuccess();
            } else if (node.classList && (node.classList.contains('alert-danger') || node.querySelector('.alert-danger'))) {
              playSpellFailure();
            }
          }
        });
      });

      if (shouldRenderMath) {
        setTimeout(() => triggerKaTeX(), 50);
        setTimeout(() => triggerKaTeX(), 250);
      }
    });

    const checkModalContainer = () => {
      const win = document.getElementById('challenge-window');
      if (win) {
        observer.observe(win, { childList: true, subtree: true });
        triggerKaTeX(win);
      } else {
        observer.observe(document.body, { childList: true, subtree: true });
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkModalContainer);
    } else {
      checkModalContainer();
    }

    // Modal lifecycle events
    document.addEventListener('shown.bs.modal', function (e) {
      triggerKaTeX(e.target);
      setTimeout(() => triggerKaTeX(e.target), 150);
    });

    window.addEventListener('load-challenge', () => {
      setTimeout(() => triggerKaTeX(), 150);
      setTimeout(() => triggerKaTeX(), 500);
    });

    window.addEventListener('hashchange', () => {
      setTimeout(() => triggerKaTeX(), 300);
    });

    // Wand toggle button listener
    document.addEventListener('click', function (e) {
      const toggleBtn = e.target.closest('#hogwarts-wand-audio-toggle');
      if (toggleBtn) {
        toggleAmbiance();
      }
    });
  }

  // --- 4. Magical Starfield & Golden Embers Canvas ---
  function initMagicalCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'magical-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = Math.min(55, Math.floor(width / 25));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.6,
        alpha: Math.random() * 0.7 + 0.2,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -(Math.random() * 0.6 + 0.2),
        pulseSpeed: Math.random() * 0.03 + 0.01,
        pulseVal: Math.random() * Math.PI * 2,
        color: Math.random() > 0.35 ? '#ffd768' : '#79a4ea'
      });
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.pulseVal += p.pulseSpeed;
        const currentAlpha = Math.max(0.1, p.alpha + Math.sin(p.pulseVal) * 0.35);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
      });

      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;
      requestAnimationFrame(animate);
    }

    animate();
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAudioAndKaTeXInteractions();
      initMagicalCanvas();
    });
  } else {
    initAudioAndKaTeXInteractions();
    initMagicalCanvas();
  }

  // Export for external use
  window.HogwartsAudio = {
    playWandCast,
    playSpellSuccess,
    playSpellFailure,
    toggleAmbiance
  };

  window.HogwartsRenderMath = triggerKaTeX;

})();
