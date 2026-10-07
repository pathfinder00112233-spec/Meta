/* El Pueblo #2 — InfiniteSpiral gallery (M13–M18): one bounded cycle on a shallow upright spiral; flat swipe rail on phones and under reduced motion */
(function () {
  'use strict';
  const EP = window.EP;
  const section = document.getElementById('gallery'), track = document.getElementById('spiralTrack'), stage = document.getElementById('spiralStage'),
    list = document.getElementById('spiralItems'), items = [...list.children], N = items.length,
    prev = document.getElementById('spiralPrev'), next = document.getElementById('spiralNext'), caption = document.getElementById('spiralCaption'),
    count = document.getElementById('spiralCount'), bar = document.getElementById('spiralBar');
  const captions = items.map((li) => li.querySelector('[data-caption]').dataset.caption);
  const flatMQ = matchMedia('(max-width: 899px)');
  let flat = null, index = 0, target = 0, trackTop = 0, range = 1, dragging = false, shown = -1;

  function setFlat(v) {
    if (v === flat) return; flat = v;
    section.classList.toggle('is-flat', flat);
    items.forEach((li) => { li.style.transform = ''; li.style.opacity = ''; li.style.zIndex = ''; li.querySelector('.haze').style.opacity = ''; });
    if (flat) { list.scrollLeft = 0; updateFlat(); } else { measure(); EP.wake(); }
  }
  function measure() { const r = track.getBoundingClientRect(); trackTop = r.top + scrollY; range = Math.max(1, r.height - innerHeight); }
  function describe(i) { // M16: image, caption and index change together
    if (i === shown) return; shown = i;
    caption.textContent = captions[i];
    count.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    bar.style.transform = 'scaleX(' + ((i + 1) / N).toFixed(3) + ')';
    items.forEach((li, k) => { li.classList.toggle('is-front', k === i); li.querySelector('button').setAttribute('aria-current', k === i ? 'true' : 'false'); });
    prev.disabled = i === 0; next.disabled = i === N - 1;
  }
  function render() {
    const base = Math.min(EP.vw, 1440) / 1440;
    for (let i = 0; i < N; i++) {
      const t = i - index, a = t * 0.82, at = Math.abs(t);
      const r = (430 + at * 60) * base;
      const x = Math.sin(a) * r, y = (1 - Math.cos(a)) * r * 0.32 - at * 6, z = -at * 300 * base;
      const ry = -Math.sin(a) * 24, rz = t * 2.2;
      const li = items[i];
      li.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateY(' + ry.toFixed(2) + 'deg) rotateZ(' + rz.toFixed(2) + 'deg)';
      li.style.opacity = (at > 3.2 ? 0 : 1 - Math.min(at * 0.18, 0.72)).toFixed(3);
      li.style.zIndex = String(100 - Math.round(at * 10));
      li.querySelector('.haze').style.opacity = Math.min(at * 0.28, 0.8).toFixed(3);
    }
    describe(Math.round(EP.clamp(index, 0, N - 1)));
  }
  EP.onFrame((dt) => {
    if (flat) return;
    if (!dragging) { const p = EP.clamp((EP.ys - trackTop) / range, 0, 1); target = p * (N - 1); }
    const k = EP.reduced ? 1 : 1 - Math.pow(0.002, dt / 1000);
    index += (target - index) * k;
    if (Math.abs(target - index) < 0.0005) index = target;
    render();
  });
  function go(i) {
    i = EP.clamp(Math.round(i), 0, N - 1);
    if (flat) { items[i].scrollIntoView({ behavior: EP.reduced ? 'auto' : 'smooth', block: 'nearest', inline: 'center' }); return; }
    scrollTo({ top: trackTop + (i / (N - 1)) * range, behavior: EP.reduced ? 'auto' : 'smooth' });
  }
  function current() { return flat ? flatIndex() : Math.round(index); }
  prev.addEventListener('click', () => go(current() - 1));
  next.addEventListener('click', () => go(current() + 1));
  stage.addEventListener('keydown', (e) => {
    const map = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity };
    if (!(e.key in map)) return; e.preventDefault();
    const c = current(); go(map[e.key] === Infinity ? N - 1 : map[e.key] === -Infinity ? 0 : c + map[e.key]);
  });
  list.addEventListener('focusin', (e) => { const li = e.target.closest('.spiral-item'); if (li && !flat) { const i = items.indexOf(li); if (i !== Math.round(index)) go(i); } });
  /* M14 drag: real pointer input, captured only after an 8 px threshold so a click still opens the viewer */
  let px = 0, startTarget = 0, suppress = false;
  stage.addEventListener('pointerdown', (e) => {
    if (flat || e.button !== 0) return;
    px = e.clientX; startTarget = target; dragging = false;
    const move = (ev) => {
      const dx = ev.clientX - px;
      if (!dragging) { if (Math.abs(dx) < 8) return; dragging = true; stage.setPointerCapture(ev.pointerId); stage.style.cursor = 'grabbing'; }
      target = EP.clamp(startTarget - dx / 240, 0, N - 1); EP.wake();
    };
    const up = () => {
      stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerup', up); stage.removeEventListener('pointercancel', up);
      if (dragging) { dragging = false; stage.style.cursor = ''; suppress = true; setTimeout(() => { suppress = false; }, 50); go(target); }
    };
    stage.addEventListener('pointermove', move); stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  });
  stage.addEventListener('click', (e) => { if (suppress) { e.stopPropagation(); e.preventDefault(); } }, true);
  function flatIndex() {
    const lr = list.getBoundingClientRect(); let best = 0, bd = Infinity;
    items.forEach((li, i) => { const r = li.getBoundingClientRect(); const d = Math.abs((r.left + r.width / 2) - (lr.left + lr.width / 2)); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  let flatRaf = null;
  function updateFlat() { describe(flatIndex()); }
  list.addEventListener('scroll', () => { if (!flat || flatRaf) return; flatRaf = requestAnimationFrame(() => { flatRaf = null; updateFlat(); }); }, { passive: true });
  function decide() { setFlat(flatMQ.matches || EP.reduced); }
  flatMQ.addEventListener('change', decide);
  document.addEventListener('ep:motion', decide);
  addEventListener('resize', () => { clearTimeout(section._rt); section._rt = setTimeout(() => { if (!flat) measure(); }, 150); });
  addEventListener('load', () => { if (!flat) measure(); });
  decide();
  describe(0);
})();
