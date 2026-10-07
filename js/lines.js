/* El Pueblo #2 — line-mask headlines: [data-lines] headings split into measured lines, revealed from clipped masks with a stagger,
   gently shifted and faded once they leave the top of the viewport. The heading keeps its full text as an accessible name; the split spans are decorative. */
(function () {
  'use strict';
  const EP = window.EP;
  const heads = [...document.querySelectorAll('[data-lines]')];
  if (!heads.length) return;
  heads.forEach((h) => { h.dataset.text = h.textContent.trim().replace(/\s+/g, ' '); h.setAttribute('aria-label', h.dataset.text); });
  function split(h) {
    const text = h.dataset.text; h.textContent = '';
    const probe = document.createElement('span'); probe.setAttribute('aria-hidden', 'true');
    const words = text.split(' ').map((w) => { const s = document.createElement('span'); s.className = 'lw'; s.textContent = w; probe.appendChild(s); probe.appendChild(document.createTextNode(' ')); return s; });
    h.appendChild(probe);
    const lines = []; let top = null;
    words.forEach((w) => { const t = w.offsetTop; if (t !== top) { top = t; lines.push([]); } lines[lines.length - 1].push(w.textContent); });
    h.textContent = '';
    lines.forEach((ws, i) => { const ln = document.createElement('span'); ln.className = 'ln'; ln.setAttribute('aria-hidden', 'true'); const inn = document.createElement('span'); inn.className = 'ln-in'; inn.style.setProperty('--i', String(i)); inn.textContent = ws.join(' '); ln.appendChild(inn); h.appendChild(ln); });
    h.classList.add('is-split');
  }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    const h = e.target;
    if (e.isIntersecting) { h.classList.add('is-in'); h.classList.remove('is-out'); }
    else if (h.classList.contains('is-in') && e.boundingClientRect.bottom < 0) h.classList.add('is-out'); // left through the top: shift and fade
  }), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
  function build() { heads.forEach((h) => { h.classList.remove('is-in', 'is-out'); split(h); io.observe(h); }); }
  let rt = null; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const w = innerWidth; if (w === build._w) return; build._w = w; build(); }, 180); });
  const start = () => { build._w = innerWidth; build(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
