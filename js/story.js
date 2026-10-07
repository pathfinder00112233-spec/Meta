/* El Pueblo #2 — pinned story (desktop only): one viewport of scroll scrubs the headline across the screen while the photograph settles 1.06 → 1.0 */
(function () {
  'use strict';
  const EP = window.EP;
  const section = document.getElementById('story'), track = document.getElementById('storyTrack'), img = document.getElementById('storyImg');
  const pinMQ = matchMedia('(min-width: 900px)');
  let pinned = false, textW = 0;
  function measure() { textW = track.scrollWidth; }
  function mode() { pinned = pinMQ.matches && !EP.reduced; section.classList.toggle('is-pinned', pinned); if (!pinned) { track.style.transform = ''; img.style.transform = ''; } else measure(); EP.measure(); }
  EP.track(section, (p) => {
    if (!pinned) return;
    // progress across the section's own scroll range: 0 when its top reaches the viewport top, 1 when its bottom meets the viewport bottom
    const r = section.getBoundingClientRect(); const range = Math.max(1, r.height - EP.vh); const t = EP.clamp(-r.top / range, 0, 1);
    const from = EP.vw * 0.55, to = -(textW - EP.vw * 0.45);
    track.style.transform = 'translate3d(' + (from + (to - from) * t).toFixed(1) + 'px,0,0)';
    img.style.transform = 'scale(' + (1.06 - 0.06 * t).toFixed(4) + ')';
  });
  pinMQ.addEventListener('change', mode); document.addEventListener('ep:motion', mode);
  addEventListener('resize', () => { clearTimeout(section._rt); section._rt = setTimeout(() => { if (pinned) measure(); }, 160); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); EP.measure(); });
  mode();
})();
