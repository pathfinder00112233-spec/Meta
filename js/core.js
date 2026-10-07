/* Qaenat demo — core: motion toggle, nav state, scroll reveals.
   Original code. */
(function () {
  'use strict';
  var root = document.documentElement;

  // Motion preference: explicit toggle wins, else OS setting.
  var stored = null;
  try { stored = localStorage.getItem('qaenat-motion'); } catch (e) {}
  var osReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motionOn = stored !== null ? stored === 'on' : !osReduced;

  function applyMotion() {
    root.classList.toggle('motion-off', !motionOn);
    var btn = document.getElementById('motionToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(!motionOn));
      btn.textContent = motionOn ? 'Motion: On' : 'Motion: Off';
    }
    try { localStorage.setItem('qaenat-motion', motionOn ? 'on' : 'off'); } catch (e) {}
    document.dispatchEvent(new CustomEvent('qaenat:motion', { detail: { on: motionOn } }));
  }

  document.addEventListener('click', function (ev) {
    if (ev.target && ev.target.id === 'motionToggle') {
      motionOn = !motionOn;
      applyMotion();
    }
  });
  applyMotion();

  window.QAENAT = window.QAENAT || {};
  window.QAENAT.motionOn = function () { return motionOn; };

  // Nav background on scroll.
  var nav = document.getElementById('siteNav');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal-on-scroll.
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }
})();
