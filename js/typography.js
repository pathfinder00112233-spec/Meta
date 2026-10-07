/* El Pueblo #2 — living typography (M38–M40): word-by-word statement, fixed-height TextLoop, one ParticleText moment */
(function () {
  'use strict';
  const EP = window.EP;
  /* statement: contrast progression; every word stays readable (muted ink, never invisible) */
  const st = document.getElementById('statement-text');
  const nodes = [...st.childNodes]; st.textContent = '';
  const spans = [];
  nodes.forEach((n) => {
    const em = n.nodeType === 1; const words = n.textContent.split(/(\s+)/);
    words.forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) { st.appendChild(document.createTextNode(' ')); return; } const s = document.createElement('span'); s.className = 'w'; if (em) { const e = document.createElement('em'); e.textContent = w; s.appendChild(e); } else s.textContent = w; st.appendChild(s); spans.push(s); });
  });
  let lit = -1;
  EP.track(st, (p) => {
    const n = EP.reduced ? spans.length : Math.round(EP.clamp((p - 0.3) / 0.3, 0, 1) * spans.length);
    if (n === lit) return; lit = n; spans.forEach((s, i) => s.classList.toggle('is-on', i < n));
  });

  /* TextLoop: short invitations rotate inside a fixed-height window; pauses on hover/focus, offscreen, hidden tab, and with the toggle */
  const loop = document.getElementById('textLoop'), phrases = [...loop.children];
  let cur = 0, timer = null, loopVisible = false, hovered = false;
  function advance() { const a = phrases[cur]; const n = (cur + 1) % phrases.length; const b = phrases[n]; a.classList.remove('is-active'); a.classList.add('is-leaving'); setTimeout(() => a.classList.remove('is-leaving'), 800); b.classList.add('is-active'); cur = n; }
  function schedule() { clearInterval(timer); timer = null; if (loopVisible && !EP.reduced && !hovered && !document.hidden) timer = setInterval(advance, 2800); }
  new IntersectionObserver((en) => { loopVisible = en[0].isIntersecting; schedule(); }, { threshold: 0.1 }).observe(loop);
  loop.parentElement.addEventListener('pointerenter', () => { hovered = true; schedule(); });
  loop.parentElement.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  document.addEventListener('ep:motion', schedule);
  document.addEventListener('visibilitychange', schedule);

  /* ParticleText: capped particles form the wordmark, repel near the pointer, settle back; real heading underneath; suspended offscreen */
  const wrap = document.getElementById('particleWrap'), text = document.getElementById('particleText'), canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  let parts = [], W = 0, H = 0, dpr = 1, visible = false, running = false, mx = -1e4, my = -1e4, pulse = 0, pulseX = 0, pulseY = 0, built = false;
  const ink = '#171419', accent = '#8a1f2b';
  function build() {
    const r = wrap.getBoundingClientRect(); if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = Math.round(r.width); H = Math.round(r.height);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    const off = document.createElement('canvas'); const scale = 0.5; off.width = Math.round(W * scale); off.height = Math.round(H * scale);
    const o = off.getContext('2d'); const cs = getComputedStyle(text);
    o.fillStyle = '#000'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.font = cs.fontWeight + ' ' + (parseFloat(cs.fontSize) * scale) + 'px ' + cs.fontFamily;
    o.fillText(text.textContent, off.width / 2, off.height / 2);
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const gap = W > 1100 ? 2.1 : W > 700 ? 2.4 : 2.8;
    parts = [];
    for (let y = 0; y < off.height; y += gap) for (let x = 0; x < off.width; x += gap) {
      const i = (Math.round(y) * off.width + Math.round(x)) * 4 + 3;
      if (data[i] > 110) { const ox = x / scale + (Math.random() - 0.5) * 1.2, oy = y / scale + (Math.random() - 0.5) * 1.2; parts.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0, m: 0 }); }
    }
    if (parts.length > 6000) { const keep = 6000 / parts.length; parts = parts.filter(() => Math.random() < keep); }
    built = true; draw(true);
  }
  function step(dt) {
    const R = W > 700 ? 95 : 70, R2 = R * R, f = dt / 16.7;
    const px = pulse > 0 ? pulseX : mx, py = pulse > 0 ? pulseY : my, strength = pulse > 0 ? 1.6 * pulse : 1;
    let any = false;
    for (const p of parts) {
      const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy;
      if (d2 < R2) { const d = Math.sqrt(d2) || 1, k = (R - d) / R * 2.2 * strength; p.vx += dx / d * k; p.vy += dy / d * k; }
      p.vx += (p.ox - p.x) * 0.06 * f; p.vy += (p.oy - p.y) * 0.06 * f;
      p.vx *= Math.pow(0.84, f); p.vy *= Math.pow(0.84, f);
      p.x += p.vx * f; p.y += p.vy * f;
      p.m = Math.abs(p.x - p.ox) + Math.abs(p.y - p.oy);
      if (p.m > 0.2) any = true;
    }
    if (pulse > 0) pulse = Math.max(0, pulse - dt / 420);
    return any;
  }
  function draw(still) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const s = W > 700 ? 1.9 : 1.6;
    ctx.fillStyle = ink;
    for (const p of parts) if (still || !(p.m > 1.5)) ctx.fillRect(p.x, p.y, s, s);
    if (!still) { ctx.fillStyle = accent; for (const p of parts) if (p.m > 1.5) ctx.fillRect(p.x, p.y, s + 0.4, s + 0.4); }
  }
  let settled = 0;
  EP.onFrame((dt) => { if (!running) return; const moving = step(dt); draw(false); if (!moving) { settled++; if (settled > 30) stop(); } else settled = 0; });
  function start() { if (running || !built || !visible || EP.reduced) return; running = true; settled = 0; EP.busy++; EP.wake(); }
  function stop() { if (!running) return; running = false; EP.busy--; draw(true); }
  wrap.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; start(); });
  wrap.addEventListener('pointerleave', () => { mx = -1e4; my = -1e4; });
  wrap.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') return; const r = canvas.getBoundingClientRect(); pulseX = e.clientX - r.left; pulseY = e.clientY - r.top; pulse = 1; start(); }, { passive: true });
  new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (!visible) stop(); else if (!built) build(); }, { threshold: 0.05 }).observe(wrap);
  addEventListener('resize', () => { clearTimeout(wrap._rt); wrap._rt = setTimeout(() => { if (visible) build(); else built = false; }, 180); });
  document.addEventListener('ep:motion', () => { if (EP.reduced) stop(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (visible) build(); else built = false; });
})();
