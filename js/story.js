/* Qaenat demo — pinned story: on wide screens one viewport of scroll
   scrubs the headline sideways while the photo settles 1.07 -> 1.0.
   Static layout on phones / reduced motion. Original code. */
(function () {
  'use strict';
  var section = document.getElementById('story');
  var track = document.getElementById('storyTrack');
  var img = document.getElementById('storyImg');
  if (!section || !track) return;

  var pinMQ = window.matchMedia('(min-width: 900px)');
  var pinned = false;

  function motionOk() {
    return (!window.QAENAT || window.QAENAT.motionOn()) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function applyMode() {
    pinned = pinMQ.matches && motionOk();
    section.classList.toggle('is-pinned', pinned);
    if (!pinned) { track.style.transform = ''; if (img) img.style.transform = ''; }
  }
  pinMQ.addEventListener ? pinMQ.addEventListener('change', applyMode) : pinMQ.addListener(applyMode);
  document.addEventListener('qaenat:motion', applyMode);
  applyMode();

  var ticking = false;
  function update() {
    ticking = false;
    if (!pinned) return;
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight;
    var range = Math.max(1, r.height - vh);
    var t = Math.min(1, Math.max(0, -r.top / range));
    var textW = track.scrollWidth;
    var vw = window.innerWidth;
    var from = vw * 0.06;
    var to = -(textW - vw * 0.94);
    var x = from + (to - from) * t;
    track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    if (img) img.style.transform = 'scale(' + (1.07 - 0.07 * t).toFixed(3) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
