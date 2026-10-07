/* El Pueblo #2 — core: motion preference, scroll engine, parallax, reveals, navigation, palette, cursor glow, photo viewer */
(function () {
  'use strict';
  const html = document.documentElement;
  const EP = window.EP = {
    reduced: false, vw: innerWidth, vh: innerHeight, y: scrollY, ys: scrollY, items: [], frames: [], busy: 0,
    isFine: matchMedia('(pointer: fine)').matches,
    clamp: (v, a, b) => Math.min(b, Math.max(a, v)),
    lerp: (a, b, t) => a + (b - a) * t,
  };
  html.classList.toggle('has-pointer', EP.isFine);

  /* ---- M12 unified motion state: OS preference + persistent toggle, one event for every module ---- */
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('motionToggle');
  const label = toggle.querySelector('.motion-label');
  let stored = null; try { stored = localStorage.getItem('ep-motion'); } catch (e) {}
  function applyMotion() {
    const on = stored ? stored === 'on' : !mq.matches;
    EP.reduced = !on;
    html.classList.toggle('reduce-motion', !on);
    toggle.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Motion on' : 'Motion off';
    toggle.setAttribute('aria-label', on ? 'Motion on. Switch decorative motion off' : 'Motion off. Switch decorative motion on');
    document.dispatchEvent(new CustomEvent('ep:motion', { detail: { reduced: EP.reduced } }));
    EP.wake();
  }
  toggle.addEventListener('click', () => { stored = EP.reduced ? 'on' : 'off'; try { localStorage.setItem('ep-motion', stored); } catch (e) {} applyMotion(); });
  mq.addEventListener('change', applyMotion);
  document.addEventListener('visibilitychange', () => { html.classList.toggle('is-hidden', document.hidden); if (!document.hidden) EP.wake(); });

  /* ---- M60 scheduler: one rAF loop that sleeps when nothing moves ---- */
  EP.track = function (el, fn) { const it = { el, fn, top: 0, h: 0 }; EP.items.push(it); measureItem(it); return it; };
  EP.onFrame = function (fn) { EP.frames.push(fn); };
  function measureItem(it) { const r = it.el.getBoundingClientRect(); it.top = r.top + scrollY; it.h = r.height; }
  EP.measure = function () { EP.vw = innerWidth; EP.vh = innerHeight; EP.items.forEach(measureItem); EP.items.forEach((it) => { it.force = true; }); EP.wake(); };
  let idle = 0, rafId = null, last = performance.now();
  EP.wake = function () { idle = 0; if (rafId === null) { last = performance.now(); rafId = requestAnimationFrame(loop); } };
  function loop(now) {
    const dt = Math.min(50, now - last); last = now;
    EP.y = scrollY;
    const k = EP.reduced ? 1 : 1 - Math.pow(0.0025, dt / 1000);
    EP.ys += (EP.y - EP.ys) * k;
    if (Math.abs(EP.y - EP.ys) < 0.05) EP.ys = EP.y;
    for (const it of EP.items) { const p = EP.clamp((EP.ys + EP.vh - it.top) / (EP.vh + it.h), 0, 1); if (p !== it.p || it.force) { it.p = p; it.force = false; it.fn(p, it); } }
    for (const f of EP.frames) f(dt, now);
    const moving = Math.abs(EP.y - EP.ys) > 0.05 || EP.busy > 0;
    idle = moving ? 0 : idle + 1;
    if (idle > 90 && !EP.busy) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);
  }
  addEventListener('scroll', EP.wake, { passive: true });
  addEventListener('resize', () => { clearTimeout(EP._rt); EP._rt = setTimeout(EP.measure, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(EP.measure);
  addEventListener('load', EP.measure);

  /* ---- M07 three-plane parallax: [data-depth] moves by (0.5 - progress) * amplitude * depth ---- */
  document.querySelectorAll('[data-depth]').forEach((el) => {
    const depth = parseFloat(el.dataset.depth) || 0;
    const path = el.dataset.path || '';
    EP.track(el, (p) => {
      if (EP.reduced) { el.style.transform = ''; return; }
      const amp = EP.vw < 900 ? 34 : 140;
      const dy = (0.5 - p) * amp * depth * 2;
      const dx = path === 'drift-left' ? (0.5 - p) * amp * depth * 0.6 : 0;
      el.style.transform = 'translate3d(' + dx.toFixed(2) + 'px,' + dy.toFixed(2) + 'px,0)';
    });
  });
  document.querySelectorAll('.overscan').forEach((box) => {
    const imgs = box.querySelectorAll('img');
    EP.track(box, (p) => {
      const t = EP.reduced ? '' : 'translate3d(0,' + ((p - 0.5) * (EP.vw < 900 ? 10 : 24)).toFixed(2) + 'px,0) scale(1.1)';
      imgs.forEach((img) => { img.style.transform = t; });
    });
  });

  /* ---- reveals ---- */
  const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el, i) => { el.classList.add('reveal'); if (!el.style.getPropertyValue('--i')) el.style.setProperty('--i', String(i % 4)); revealIO.observe(el); });
  const inIO = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); inIO.unobserve(e.target); } }), { threshold: 0.25 });
  document.querySelectorAll('.closing, #brand').forEach((el) => inIO.observe(el));
  const ribbonIO = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle('is-in', e.isIntersecting)), { threshold: 0.01 });
  document.querySelectorAll('.ribbon').forEach((el) => ribbonIO.observe(el));

  /* ---- M49–M51 navigation: compact state, progress line, active marker, section palette, settle ---- */
  const nav = document.getElementById('nav'), progress = document.getElementById('navProgress'), marker = document.getElementById('navMarker');
  const links = [...document.querySelectorAll('.nav-links a[data-section]')];
  const entrance = document.getElementById('entrance');
  if (!entrance) nav.classList.add('is-compact');
  const palettes = {
    dawn: ['#f3dfb4', '#cfe1f6', '#f4d3d0'], noon: ['#f6e6c3', '#d9e7f5', '#f7dcd3'], afternoon: ['#f1dcb0', '#d4e4f4', '#f3d0cf'],
    warm: ['#f5dfae', '#e4e6ee', '#f2cfc6'], cool: ['#eadfc8', '#c9ddf3', '#ecd5d8'], evening: ['#edd3a4', '#cbd8ee', '#efc9c4'],
  };
  let activeSection = null;
  function setPalette(name) { const p = palettes[name]; if (!p) return; html.style.setProperty('--a1', p[0]); html.style.setProperty('--a2', p[1]); html.style.setProperty('--a3', p[2]); }
  function setActive(name) {
    if (name === activeSection) return; activeSection = name;
    links.forEach((a) => a.classList.toggle('is-active', a.dataset.section === name));
    const a = links.find((l) => l.dataset.section === name);
    if (a && a.offsetParent) { marker.style.width = a.offsetWidth + 'px'; marker.style.transform = 'translateX(' + a.offsetLeft + 'px)'; marker.classList.add('is-on'); } else marker.classList.remove('is-on');
    const sec = document.querySelector('[data-section="' + name + '"]');
    if (sec && sec.dataset.palette) setPalette(sec.dataset.palette);
    html.style.setProperty('--amp', name === 'visit' ? '0.3' : '1'); // M58 atmosphere landing
  }
  const secIO = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.dataset.section); }); }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
  document.querySelectorAll('main [data-section]').forEach((s) => secIO.observe(s));
  EP.onFrame(() => {
    const max = Math.max(1, html.scrollHeight - EP.vh);
    progress.style.transform = 'scaleX(' + (EP.y / max).toFixed(4) + ')';
    const past = entrance ? EP.y > entrance.offsetHeight - 80 : EP.y > 80;
    nav.classList.toggle('is-compact', past);
    html.classList.toggle('is-past-hero', past);
  });
  /* M52 menu drawer */
  const menuBtn = document.getElementById('navMenu'), panel = document.getElementById('navPanel');
  function setPanel(open) { panel.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.textContent = open ? 'Close' : 'Menu'; html.classList.toggle('has-panel', open); }
  menuBtn.addEventListener('click', () => setPanel(panel.hidden));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setPanel(false); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !nav.contains(e.target)) setPanel(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setPanel(false); menuBtn.focus(); } });

  /* ---- cursor glow (desktop, decorative, the system cursor stays) ---- */
  const glow = document.querySelector('.cursor-glow');
  if (EP.isFine) {
    let tx = -1000, ty = -1000, gx = tx, gy = ty, on = false;
    addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; tx = e.clientX; ty = e.clientY; if (!on) { on = true; glow.classList.add('is-on'); EP.busy++; EP.wake(); } }, { passive: true });
    document.addEventListener('pointerleave', () => { if (on) { on = false; glow.classList.remove('is-on'); EP.busy--; } });
    EP.onFrame((dt) => { if (!on) return; const k = 1 - Math.pow(0.001, dt / 1000); gx += (tx - gx) * k; gy += (ty - gy) * k; glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)'; });
  }

  /* ---- M17/M23 photo viewer: native dialog, shared-image expansion, zoom capped at the source's real pixels ---- */
  const dialog = document.getElementById('lightbox'), dImg = document.getElementById('lightboxImg'), dCap = document.getElementById('lightboxCaption'),
    dClose = document.getElementById('lightboxClose'), dZoom = document.getElementById('lightboxZoom'), scroller = document.getElementById('lightboxScroller');
  let opener = null, fullSrc = '', fullW = 0, pushed = false;
  function setZoom(on) {
    dialog.classList.toggle('is-zoomed', on); dZoom.setAttribute('aria-pressed', String(on)); dZoom.textContent = on ? 'Reset zoom' : 'Zoom in';
    if (on) { const r = dImg.getBoundingClientRect(); const target = Math.min(fullW || dImg.naturalWidth || r.width, r.width * 2); dImg.style.width = target + 'px'; dImg.style.maxWidth = 'none'; dImg.style.maxHeight = 'none';
      requestAnimationFrame(() => { scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2; scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2; }); }
    else { dImg.style.width = ''; dImg.style.maxWidth = ''; dImg.style.maxHeight = ''; }
  }
  EP.openLightbox = function (src, caption, sourceImg, trigger) {
    opener = trigger || document.activeElement;
    fullSrc = src; fullW = 0;
    dCap.textContent = caption || '';
    dImg.alt = sourceImg ? sourceImg.alt : (caption || '');
    dImg.src = sourceImg ? sourceImg.currentSrc || sourceImg.src : src;
    dImg.classList.remove('is-flipping'); dImg.style.transform = ''; dImg.style.borderRadius = '';
    setZoom(false);
    dialog.showModal();
    html.classList.add('has-dialog');
    try { history.pushState({ epLightbox: true }, '', location.href); pushed = true; } catch (e) { pushed = false; } // M18: Back closes the viewer
    const finish = () => {
      if (!sourceImg || EP.reduced) return;
      const from = sourceImg.getBoundingClientRect(), to = dImg.getBoundingClientRect();
      if (!to.width || !from.width) return;
      const sx = from.width / to.width, sy = from.height / to.height;
      dImg.style.transform = 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + sx + ',' + sy + ')';
      dImg.style.borderRadius = (14 / Math.max(sx, 0.01)) + 'px';
      requestAnimationFrame(() => requestAnimationFrame(() => { dImg.classList.add('is-flipping'); dImg.style.transform = 'none'; dImg.style.borderRadius = ''; }));
    };
    if (dImg.complete) finish(); else dImg.addEventListener('load', finish, { once: true });
    const full = new Image(); full.src = src; full.onload = () => { fullW = full.naturalWidth; if (dialog.open && fullSrc === src) dImg.src = src; };
    dClose.focus();
  };
  function closeLightbox() { if (dialog.open) dialog.close(); }
  dClose.addEventListener('click', closeLightbox);
  dZoom.addEventListener('click', () => setZoom(dZoom.getAttribute('aria-pressed') !== 'true'));
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeLightbox(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); closeLightbox(); });
  dialog.addEventListener('close', () => {
    html.classList.remove('has-dialog'); dImg.src = ''; setZoom(false);
    if (pushed && history.state && history.state.epLightbox) { pushed = false; history.back(); }
    const o = opener; if (o && o.focus) { o.focus(); setTimeout(() => { if (document.activeElement === document.body) o.focus(); }, 80); }
  });
  addEventListener('popstate', () => { if (dialog.open) { pushed = false; dialog.close(); } });
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-lightbox]'); if (!btn || e.defaultPrevented) return;
    e.preventDefault();
    const src = btn.dataset.source ? document.getElementById(btn.dataset.source) : btn.querySelector('img');
    EP.openLightbox(btn.dataset.lightbox, btn.dataset.caption, src, btn);
  });

  /* ---- M53 magnetic primary buttons: only the inner label moves (≤ 5 px); the hit area never changes ---- */
  if (EP.isFine) {
    document.querySelectorAll('.button-primary').forEach((b) => {
      const inner = document.createElement('span'); inner.className = 'button-inner'; while (b.firstChild) inner.appendChild(b.firstChild); b.appendChild(inner);
      b.addEventListener('pointermove', (e) => { if (EP.reduced || e.pointerType !== 'mouse') return; const r = b.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height; inner.style.transform = 'translate(' + (dx * 8).toFixed(1) + 'px,' + (dy * 6).toFixed(1) + 'px)'; });
      b.addEventListener('pointerleave', () => { inner.style.transform = ''; });
    });
  }
  /* ---- clip reveals for image-led figures ---- */
  const clipIO = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); clipIO.unobserve(e.target); } }), { threshold: 0.25 });
  document.querySelectorAll('[data-clip]').forEach((el) => clipIO.observe(el));

  applyMotion();
  EP.measure();
})();
