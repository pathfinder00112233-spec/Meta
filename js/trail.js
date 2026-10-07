/* El Pueblo #2 — food-image trail in the brand scene: a pooled set of images spawned every ~85 px of pointer travel (60 px on touch),
   animated with transforms/opacity only (Web Animations API), clipped to the section, never over the text. Static arrangement for reduced motion. */
(function () {
  'use strict';
  const EP = window.EP;
  const section = document.getElementById('brand'), stage = document.getElementById('trailStage'), dataEl = document.getElementById('trailData');
  if (!section || !stage || !dataEl) return;
  const images = JSON.parse(dataEl.textContent);
  const coarse = matchMedia('(pointer: coarse)').matches;
  const POOL = coarse ? 3 : 7, STEP = coarse ? 60 : 85, IDLE_MS = 2600;
  let pool = [], k = 0, order = [], oi = 0, last = null, lx = -1e4, ly = -1e4, acc = 0, idleT = null, visible = false, preloaded = false, active = false;
  function shuffle() { // shuffled sequence, never the same photo back-to-back across reshuffles
    const a = images.map((_, i) => i); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    if (a[0] === last && a.length > 1) [a[0], a[1]] = [a[1], a[0]];
    order = a; oi = 0;
  }
  function next() { if (oi >= order.length) shuffle(); last = order[oi++]; return images[last]; }
  function build() {
    if (pool.length) return;
    for (let i = 0; i < POOL; i++) { const img = document.createElement('img'); img.className = 'ftrail-img'; img.alt = ''; img.decoding = 'async'; img.draggable = false; stage.appendChild(img); pool.push({ img, anim: null }); }
    shuffle();
  }
  function preload() { if (preloaded) return; preloaded = true; images.forEach((im) => { const i = new Image(); i.decoding = 'async'; i.src = im.src; }); }
  function spawn(x, y) {
    if (EP.reduced) return;
    const slot = pool[k++ % pool.length]; const im = next();
    if (slot.anim) { slot.anim.cancel(); slot.anim = null; }
    slot.img.src = im.src; slot.img.width = im.w; slot.img.height = im.h;
    slot.img.style.left = x + 'px'; slot.img.style.top = y + 'px';
    const rot = (Math.random() - 0.5) * 16, drift = 28 + Math.random() * 26, dx = (Math.random() - 0.5) * 24;
    slot.anim = slot.img.animate([
      { opacity: 0, transform: 'translate(-50%,-50%) scale(.6) rotate(' + (rot - 4) + 'deg)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(' + rot + 'deg)', offset: 0.18 },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1) rotate(' + rot + 'deg)', offset: 0.6 },
      { opacity: 0, transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% - ' + drift + 'px)) scale(1.04) rotate(' + (rot + 2) + 'deg)' },
    ], { duration: 2300, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' });
    slot.anim.onfinish = () => { if (slot.anim) { slot.anim.cancel(); slot.anim = null; } }; // back to the base style (hidden); nothing retained
    setActive(true);
  }
  function setActive(on) {
    if (on) { section.classList.add('is-active'); clearTimeout(idleT); idleT = setTimeout(() => { section.classList.remove('is-active'); }, IDLE_MS); }
    else { clearTimeout(idleT); section.classList.remove('is-active'); }
  }
  function local(e) { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function onMove(e) {
    if (!visible || EP.reduced) return;
    if (e.pointerType === 'mouse' && coarse) return;
    const [x, y] = local(e);
    if (lx < -1e3) { lx = x; ly = y; return; }
    acc += Math.hypot(x - lx, y - ly); lx = x; ly = y;
    if (acc >= STEP) { acc = 0; spawn(x, y); }
  }
  function onLeave() { lx = -1e4; ly = -1e4; acc = 0; }
  function onDown(e) { if (!visible || EP.reduced || e.pointerType === 'mouse') return; const [x, y] = local(e); spawn(x, y); lx = x; ly = y; acc = 0; }
  // pointermove covers mouse and gentle touch movement; listeners are passive so vertical scrolling is never blocked (no touch-action change, no preventDefault)
  section.addEventListener('pointermove', onMove, { passive: true });
  section.addEventListener('pointerdown', onDown, { passive: true });
  section.addEventListener('pointerleave', onLeave, { passive: true });
  section.addEventListener('pointercancel', onLeave, { passive: true });
  function teardown() { pool.forEach((s) => { if (s.anim) { s.anim.cancel(); s.anim = null; } s.img.style.opacity = ''; }); setActive(false); onLeave(); }
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) { build(); preload(); } else teardown(); }, { threshold: 0.05, rootMargin: '200px 0px' }).observe(section);
  document.addEventListener('ep:motion', (e) => { if (e.detail.reduced) teardown(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) teardown(); });
  window.EP_trail = { pool: () => pool.length, visibleCount: () => pool.filter((s) => s.anim && s.anim.playState === 'running').length, images: images.length };
})();
