/* El Pueblo #2 — room story (M31–M35): five labelled viewpoints of real photographs; image, caption and index change as one event */
(function () {
  'use strict';
  const EP = window.EP;
  const section = document.getElementById('rooms'), views = [...document.querySelectorAll('.rooms-view')], buttons = [...document.querySelectorAll('.viewpoint')],
    caption = document.getElementById('roomsCaption'), index = document.getElementById('viewpointIndex'), prev = document.getElementById('viewPrev'), next = document.getElementById('viewNext'), viewBtn = document.getElementById('roomsView');
  const meta = [
    { label: 'Entrance', caption: 'The entrance on Janpath: the gold MAHTAB sign, warm wood panelling, and the stairway up to the roof.', full: 'media/views/view-entrance.jpg' },
    { label: 'Stage', caption: 'The stage corner: a guitarist plays while the city hums below — green walls and string lights all around.', full: 'media/views/view-stage.jpg' },
    { label: 'Cabana', caption: 'The cabana: a set table, glowing lamps, and Delhi\u2019s lights beyond the railing.', full: 'media/views/view-cabana.jpg' },
    { label: 'Green Wall', caption: 'The living wall: Mahtab\u2019s gold logo set into a vertical garden.', full: 'media/views/view-greenwall.jpg' },
    { label: 'Main Deck', caption: 'The main deck: long tables, warm lamps, and room for the whole family.', full: 'media/views/view-deck.jpg' },
  ];
  let cur = 1, timer = null;
  function set(i, focusBtn) {
    i = (i + meta.length) % meta.length; if (i === cur) return; cur = i;
    views.forEach((v, k) => v.classList.toggle('is-active', k === i));
    buttons.forEach((b, k) => { b.classList.toggle('is-active', k === i); b.setAttribute('aria-pressed', String(k === i)); });
    clearTimeout(timer); section.classList.add('is-switching');
    timer = setTimeout(() => { caption.textContent = meta[i].caption; index.textContent = String(i + 1).padStart(2, '0') + ' / 05 · ' + meta[i].label; section.classList.remove('is-switching'); }, EP.reduced ? 0 : 260);
    if (focusBtn) buttons[i].focus();
  }
  buttons.forEach((b) => b.addEventListener('click', () => set(+b.dataset.view)));
  prev.addEventListener('click', () => set(cur - 1));
  next.addEventListener('click', () => set(cur + 1));
  document.getElementById('viewpointList').addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') { e.preventDefault(); set(cur + 1, true); } if (e.key === 'ArrowLeft') { e.preventDefault(); set(cur - 1, true); } });
  viewBtn.addEventListener('click', () => EP.openLightbox(meta[cur].full, meta[cur].label + ' — ' + meta[cur].caption, views[cur], viewBtn));
  /* touch: a horizontal swipe on the photo changes the viewpoint; vertical scrolling is untouched */
  const stack = document.getElementById('roomsStack'); let sx = 0, sy = 0, tracking = false;
  stack.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true; }, { passive: true });
  stack.addEventListener('touchend', (e) => { if (!tracking) return; tracking = false; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) set(dx < 0 ? cur + 1 : cur - 1); }, { passive: true });
})();
