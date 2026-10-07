/* El Pueblo #2 — section-two title: scroll-linked entrance (clipped mask, 45 px up, .96 → 1, fade in) and a distinct exit
   (30 px up, 1 → 1.025, fade out) that starts only once the section leaves the viewport; both reverse with scroll. Reduced motion / Motion off: static. */
(function () {
  'use strict';
  const EP = window.EP;
  const section = document.getElementById('brand'), title = document.getElementById('brandTitle');
  if (!section || !title) return;
  const lines = [...title.querySelectorAll('.line-inner')];
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  let lastKey = '';
  function apply() {
    if (EP.reduced) { if (lastKey !== 'static') { lastKey = 'static'; lines.forEach((l) => { l.style.transform = ''; l.style.opacity = ''; }); title.classList.remove('is-exiting'); } return; }
    const r = section.getBoundingClientRect(), vh = EP.vh, small = EP.vw < 900;
    const enterIn = EP.clamp((vh - r.top) / (vh * 0.42), 0, 1);           // 0 when the section top meets the viewport bottom, 1 once it has risen 42 % of the viewport
    const exitIn = EP.clamp(-r.top / (r.height * 0.45), 0, 1);             // 0 until the section top passes the viewport top, 1 after 45 % of the section has gone
    const key = enterIn.toFixed(3) + '/' + exitIn.toFixed(3);
    if (key === lastKey) return; lastKey = key;
    const dEnter = small ? 28 : 45, dExit = small ? 18 : 30;
    lines.forEach((l, i) => {
      const e = ease(EP.clamp((enterIn - i * 0.12) / (1 - i * 0.12), 0, 1)); // slight stagger: the second line trails the first and still lands at 1
      const x = ease(exitIn);
      const y = (1 - e) * dEnter - x * dExit;
      const sc = 0.96 + 0.04 * e + 0.025 * x;
      const op = Math.min(e, 1 - x);
      l.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0) scale(' + sc.toFixed(4) + ')';
      l.style.opacity = op.toFixed(3);
    });
    title.classList.toggle('is-exiting', exitIn > 0);
  }
  EP.onFrame(apply);
  document.addEventListener('ep:motion', () => { lastKey = ''; apply(); EP.wake(); });
  apply();
})();
