/* Mahtab demo — hero: poster first, faststart film fades in when ready.
   Picks 720p/1080p by viewport; poster-only for reduced motion / Save-Data.
   Particle canvas drifts over the film. Original code. */
(function () {
  'use strict';
  var video = document.getElementById('heroVideo');
  var poster = document.getElementById('heroPoster');
  var canvas = document.getElementById('particles');
  if (!video || !poster) return;

  var BASE = (function () {
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/js\/hero\.js.*$/, '');
    return '';
  })();

  var saveData = navigator.connection && navigator.connection.saveData;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide = window.innerWidth >= 1100;
  var src = wide ? 'media/video/mahtab-hero_1080.mp4' : 'media/video/mahtab-hero_720.mp4';

  function motionAllowed() {
    return window.MAHTAB && window.MAHTAB.motionOn() && !reduced && !saveData;
  }

  function tryPlay() {
    if (!motionAllowed()) return;
    video.src = BASE + src;
    video.load();
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
  }

  video.addEventListener('playing', function () {
    video.classList.add('playing');
    if (poster) poster.style.opacity = '0';
  });

  // Start the film ASAP. Do NOT wait for window 'load': on slow networks
  // the load event can take minutes (large images), which would leave the
  // hero stuck on the poster. Defer scripts run after DOM parse, so the
  // video element is ready now.
  var started = false;
  function start() {
    if (started) return;
    started = true;
    tryPlay();
  }
  start();
  // Backup: retry once shortly after, in case motion state wasn't ready
  // on the first attempt (e.g. core.js still initializing).
  setTimeout(function () {
    if (video.paused && motionAllowed()) { started = false; start(); }
  }, 2500);
  // Final fallback: if the page 'load' event was what the old code waited
  // for, retry then too — harmless if already playing.
  if (document.readyState !== 'complete') {
    window.addEventListener('load', function () {
      if (video.paused && motionAllowed()) { started = false; start(); }
    });
  }

  document.addEventListener('mahtab:motion', function (e) {
    if (!e.detail.on) {
      video.pause();
      video.classList.remove('playing');
      if (poster) poster.style.opacity = '1';
    } else {
      started = false;
      start();
    }
  });

  /* ---- particles: slow gold dust drifting upward ---- */
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0, parts = [], running = false, raf = 0;

  function size() {
    var r = canvas.parentElement.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.floor(r.width));
    H = canvas.height = Math.max(1, Math.floor(r.height));
  }
  function seed() {
    parts = [];
    var n = Math.min(70, Math.floor((W * H) / 26000));
    for (var i = 0; i < n; i++) {
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        vy: 0.12 + Math.random() * 0.35,
        vx: (Math.random() - 0.5) * 0.18,
        a: 0.12 + Math.random() * 0.4,
        ph: Math.random() * Math.PI * 2
      });
    }
  }
  function tick(t) {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      p.y -= p.vy; p.x += p.vx + Math.sin(t / 1600 + p.ph) * 0.12;
      if (p.y < -8) { p.y = H + 8; p.x = Math.random() * W; }
      if (p.x < -8) p.x = W + 8; else if (p.x > W + 8) p.x = -8;
      var tw = 0.6 + 0.4 * Math.sin(t / 900 + p.ph);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242, 217, 140,' + (p.a * tw).toFixed(3) + ')';
      ctx.fill();
    }
    raf = requestAnimationFrame(tick);
  }
  function setRunning(on) {
    on = on && motionAllowed();
    if (on === running) return;
    running = on;
    if (on) { size(); seed(); raf = requestAnimationFrame(tick); }
    else { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); }
  }

  size();
  window.addEventListener('resize', function () { if (running) { size(); seed(); } });
  setRunning(true);
  document.addEventListener('mahtab:motion', function (e) { setRunning(e.detail.on); });
  document.addEventListener('visibilitychange', function () {
    setRunning(!document.hidden && (!window.MAHTAB || window.MAHTAB.motionOn()));
  });
})();
