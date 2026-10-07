/* Mahtab demo — swipe gallery: drag / arrows / keyboard, counter + bar.
   Original code. */
(function () {
  'use strict';
  var track = document.getElementById('galTrack');
  if (!track) return;
  var slides = Array.prototype.slice.call(track.children);
  var n = slides.length;
  var prev = document.getElementById('galPrev');
  var next = document.getElementById('galNext');
  var count = document.getElementById('galCount');
  var bar = document.getElementById('galBar');
  var idx = 0;

  function pad(i) { return (i < 9 ? '0' : '') + (i + 1); }
  function render() {
    track.style.transform = 'translate3d(' + (-idx * 100) + '%,0,0)';
    if (count) count.textContent = pad(idx) + ' / ' + (n < 10 ? '0' + n : n);
    if (bar) bar.style.width = ((idx + 1) / n * 100).toFixed(1) + '%';
  }
  function go(i) {
    idx = (i + n) % n;
    render();
  }
  if (prev) prev.addEventListener('click', function () { go(idx - 1); });
  if (next) next.addEventListener('click', function () { go(idx + 1); });
  document.addEventListener('keydown', function (ev) {
    var r = track.getBoundingClientRect();
    var visible = r.top < window.innerHeight && r.bottom > 0;
    if (!visible) return;
    if (ev.key === 'ArrowLeft') go(idx - 1);
    if (ev.key === 'ArrowRight') go(idx + 1);
  });

  // Drag / swipe.
  var startX = 0, curX = 0, dragging = false, basePct = 0;
  function pct() { return -idx * 100; }
  track.addEventListener('pointerdown', function (ev) {
    dragging = true; startX = ev.clientX; curX = ev.clientX; basePct = pct();
    track.classList.add('dragging');
    track.setPointerCapture(ev.pointerId);
  });
  track.addEventListener('pointermove', function (ev) {
    if (!dragging) return;
    curX = ev.clientX;
    var w = track.parentElement.clientWidth || 1;
    var dxPct = (curX - startX) / w * 100;
    track.style.transition = 'none';
    track.style.transform = 'translate3d(' + (basePct + dxPct) + '%,0,0)';
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('dragging');
    track.style.transition = '';
    var w = track.parentElement.clientWidth || 1;
    var dx = curX - startX;
    if (dx < -w * 0.12) go(idx + 1);
    else if (dx > w * 0.12) go(idx - 1);
    else render();
  }
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // Gentle auto-advance while visible (paused by Motion toggle).
  var timer = 0;
  function auto() {
    clearInterval(timer);
    var ok = (!window.MAHTAB || window.MAHTAB.motionOn()) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!ok) return;
    timer = setInterval(function () {
      if (document.hidden) return;
      var r = track.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) go(idx + 1);
    }, 6000);
  }
  document.addEventListener('mahtab:motion', auto);
  auto();
  render();
})();
