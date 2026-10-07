/* El Pueblo #2 — food spotlight (M19–M24) and the full menu utility (M25–M30). Data: the inline display-safe payload only. */
(function () {
  'use strict';
  const EP = window.EP;
  const data = JSON.parse(document.getElementById('menuData').textContent);
  const byId = {}; data.items.forEach((i) => { byId[i.id] = i; });
  const catById = {}; data.categories.forEach((c) => { catById[c.id] = c; });
  const photographed = data.items.filter((i) => i.img);
  const BASE = data.base || '';
  function railScroll(rail, el, center) { // horizontal-only scroll inside a strip, so the document never jumps
    const r = rail.getBoundingClientRect(), b = el.getBoundingClientRect();
    let left = rail.scrollLeft;
    if (center) left += (b.left + b.width / 2) - (r.left + r.width / 2);
    else if (b.left < r.left + 12) left += b.left - r.left - 12;
    else if (b.right > r.right - 12) left += b.right - r.right + 12;
    else return;
    rail.scrollTo({ left, behavior: EP.reduced ? 'auto' : 'smooth' });
  }
  const fold = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* ---------- Spotlight ---------- */
  const spot = document.getElementById('spot'), frame = document.getElementById('spotFrame'), imgs = [document.getElementById('spotImgA'), document.getElementById('spotImgB')],
    nameEl = document.getElementById('spotName'), catEl = document.getElementById('spotCat'), idxEl = document.getElementById('spotIndex'),
    thumbs = [...document.querySelectorAll('.spot-thumb')], sPrev = document.getElementById('spotPrev'), sNext = document.getElementById('spotNext'), view = document.getElementById('spotView');
  let cur = 0, front = 0, switching = null;
  function show(k, opts) {
    k = (k + photographed.length) % photographed.length;
    const item = photographed[k], same = k === cur && !(opts && opts.force);
    cur = k;
    thumbs.forEach((b, i) => { b.classList.toggle('is-active', i === k); b.setAttribute('aria-pressed', String(i === k)); });
    idxEl.textContent = (k + 1) + ' of ' + photographed.length;
    if (same) return;
    const out = imgs[front], inn = imgs[1 - front]; front = 1 - front;
    inn.src = BASE + 'media/menu/' + item.img + '_800.jpg'; inn.alt = item.name; inn.removeAttribute('aria-hidden');
    out.setAttribute('aria-hidden', 'true');
    const swap = () => { // M19: one timeline — outgoing shifts, incoming lands, text settles, thumb updates
      out.classList.remove('is-active'); out.classList.add('is-leaving'); inn.classList.remove('is-leaving'); inn.classList.add('is-active');
      setTimeout(() => out.classList.remove('is-leaving'), 700);
    };
    if (inn.complete && inn.naturalWidth) swap(); else inn.addEventListener('load', swap, { once: true });
    clearTimeout(switching); spot.classList.add('is-switching');
    switching = setTimeout(() => { nameEl.textContent = item.name; catEl.textContent = catById[item.cat].en; spot.classList.remove('is-switching'); }, EP.reduced ? 0 : 220);
    const nxt = photographed[(k + 1) % photographed.length]; if (nxt) { const pre = new Image(); pre.src = BASE + 'media/menu/' + nxt.img + '_800.jpg'; } // preload the next stage image only
    if (!(opts && opts.quiet)) railScroll(thumbs[k].parentElement.parentElement, thumbs[k], true);
  }
  thumbs.forEach((b, i) => b.addEventListener('click', () => show(i)));
  sPrev.addEventListener('click', () => show(cur - 1));
  sNext.addEventListener('click', () => show(cur + 1));
  document.getElementById('spotThumbs').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); thumbs[cur].focus(); } if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); thumbs[cur].focus(); } });
  view.addEventListener('click', () => { const item = photographed[cur]; EP.openLightbox(BASE + 'media/menu/' + item.img + '_800.jpg', item.name + ' — ' + catById[item.cat].en, imgs[front], view); });
  /* M22 local plate lighting: a highlight inside the frame only; the food pixels are untouched */
  frame.addEventListener('pointermove', (e) => { if (EP.reduced || e.pointerType !== 'mouse') return; const r = frame.getBoundingClientRect(); frame.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); frame.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%'); frame.classList.add('is-hover'); });
  frame.addEventListener('pointerleave', () => frame.classList.remove('is-hover'));
  /* Menu rows with a photo send that dish to the spotlight (M21: exact stable id) */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.menu-item-photo'); if (!b) return;
    const k = photographed.findIndex((i) => i.id === b.dataset.spot); if (k < 0) return;
    show(k); document.getElementById('food').scrollIntoView({ behavior: EP.reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => thumbs[k].focus({ preventScroll: true }), EP.reduced ? 0 : 600);
  });

  /* ---------- Full menu: one category at a time, search across all 113, deep links and history ---------- */
  const rail = document.getElementById('catRail'), pill = document.getElementById('catPill'), cats = [...rail.querySelectorAll('.cat')],
    sections = [...document.querySelectorAll('.menu-cat')], tools = document.getElementById('menuTools'),
    input = document.getElementById('menuQuery'), clear = document.getElementById('menuClear'), status = document.getElementById('menuStatus'), empty = document.getElementById('menuEmpty'), reset = document.getElementById('menuReset');
  const DEFAULT_CAT = 'pupusas';
  let activeCat = DEFAULT_CAT, query = '';
  function movePill() { // one background glides between chips; hit areas never change
    const a = cats.find((c) => c.classList.contains('is-active')); if (!a) { pill.classList.remove('is-on'); return; }
    pill.style.width = a.offsetWidth + 'px'; pill.style.transform = 'translate(' + a.offsetLeft + 'px,' + a.offsetTop + 'px)'; pill.classList.add('is-on');
    railScroll(rail, a);
  }
  function highlight(el, q) { // keep the displayed spelling; mark the folded match position
    const text = el.textContent, f = fold(text); const at = f.indexOf(q); if (at < 0 || f.length !== text.length) { el.textContent = text; return; }
    el.textContent = ''; el.append(text.slice(0, at)); const m = document.createElement('mark'); m.textContent = text.slice(at, at + q.length); el.append(m, text.slice(at + q.length));
  }
  function apply(announce) {
    const q = fold(query.trim()); const searching = q.length > 0;
    let shown = 0, secs = 0;
    sections.forEach((sec) => {
      let n = 0;
      sec.querySelectorAll('.menu-item').forEach((row) => {
        const hit = searching ? row.dataset.search.includes(q) : sec.dataset.cat === activeCat;
        row.hidden = !hit; if (hit) n++;
        const nameEl = row.querySelector('.menu-item-name');
        if (hit && searching) highlight(nameEl, q); else if (nameEl.querySelector('mark')) nameEl.textContent = nameEl.textContent;
      });
      sec.hidden = n === 0; if (n) secs++;
      sec.querySelector('[data-count]').textContent = n;
      shown += n;
    });
    empty.hidden = shown > 0;
    rail.classList.toggle('is-searching', searching);
    status.textContent = searching
      ? shown + (shown === 1 ? ' dish matches “' : ' dishes match “') + query.trim() + '”' + (secs > 1 ? ' in ' + secs + ' categories' : '')
      : (announce ? catById[activeCat].es + ' · ' + shown + ' entries' : '');
    clear.hidden = !query;
    EP.measure();
  }
  function toolsBottom() { const r = tools.getBoundingClientRect(); return r.top + r.height; }
  function setCat(id, opts) {
    opts = opts || {};
    if (!catById[id]) id = DEFAULT_CAT;
    activeCat = id;
    cats.forEach((c) => { const on = c.dataset.cat === id; c.classList.toggle('is-active', on); if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current'); });
    movePill(); apply(!opts.silent);
    if (!opts.noHistory) { const h = '#' + id; if (location.hash !== h) history.pushState({ epCat: id }, '', h + location.search); }
    if (opts.focus) { // controls stay in view (they are sticky); the category heading lands just under them and takes focus
      const sec = document.getElementById('menu-' + id); const h3 = sec && sec.querySelector('h3');
      if (sec) { const y = sec.getBoundingClientRect().top + scrollY - toolsBottom() - 12; scrollTo({ top: Math.max(0, y), behavior: EP.reduced ? 'auto' : 'smooth' }); }
      if (h3) setTimeout(() => h3.focus({ preventScroll: true }), EP.reduced ? 0 : 350);
    }
  }
  rail.addEventListener('click', (e) => { const a = e.target.closest('.cat'); if (!a) return; e.preventDefault(); if (query) { input.value = ''; query = ''; } setCat(a.dataset.cat, { focus: true }); });
  rail.addEventListener('keydown', (e) => { // arrow keys move between chips
    const i = cats.indexOf(document.activeElement); if (i < 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); cats[(i + (e.key === 'ArrowRight' ? 1 : cats.length - 1)) % cats.length].focus(); }
  });
  let t = null;
  function setQuery(v, announce) { query = v; clearTimeout(t); t = setTimeout(() => { apply(announce); const u = new URL(location.href); if (query.trim()) u.searchParams.set('q', query.trim()); else u.searchParams.delete('q'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); }, 140); }
  input.addEventListener('input', () => setQuery(input.value, true));
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape' && input.value) { input.value = ''; setQuery('', true); } });
  clear.addEventListener('click', () => { input.value = ''; setQuery('', true); input.focus(); });
  reset.addEventListener('click', () => { input.value = ''; setQuery('', true); input.focus(); });
  function fromHash(opts) {
    opts = opts || {};
    let h = location.hash.replace('#', ''); if (h.startsWith('menu-')) h = h.slice(5);
    if (catById[h]) setCat(h, { noHistory: true, silent: opts.initial, focus: !opts.initial && !opts.pop });
    else if (byId[h]) { // item deep link: its category, the row in view, and the spotlight when photographed
      setCat(byId[h].cat, { noHistory: true, silent: true });
      const k = photographed.findIndex((i) => i.id === h); if (k >= 0) show(k, { quiet: true });
      const row = document.getElementById(h); if (row) setTimeout(() => { row.scrollIntoView({ block: 'center', behavior: 'auto' }); row.classList.add('is-linked'); }, 60);
    } else if (opts.initial) setCat(DEFAULT_CAT, { noHistory: true, silent: true });
  }
  addEventListener('popstate', () => fromHash({ pop: true }));
  addEventListener('resize', () => { clearTimeout(rail._rt); rail._rt = setTimeout(movePill, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);
  const q0 = new URLSearchParams(location.search).get('q'); if (q0) { input.value = q0; query = q0; }
  fromHash({ initial: true });
  if (query) apply(true);
})();
