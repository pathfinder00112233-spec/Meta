/* Qaenat demo — statement: words light up one by one as the line
   scrolls through the viewport. Original code. */
(function () {
  'use strict';
  var el = document.getElementById('statementText');
  var vp = document.getElementById('viewImg');
  if (!el) return;

  // Split into word spans (keep it simple: plain text node expected).
  var text = el.textContent.trim().replace(/\s+/g, ' ');
  el.textContent = '';
  var spans = [];
  text.split(' ').forEach(function (w, i) {
    var s = document.createElement('span');
    s.className = 'w';
    s.textContent = w;
    el.appendChild(s);
    el.appendChild(document.createTextNode(' '));
    spans.push(s);
  });

  var lit = -1;
  function update() {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress: 0 when the line's top hits viewport bottom, 1 when fully past top third
    var start = vh * 0.95, end = vh * 0.25;
    var t = (start - r.top) / (start - end);
    t = Math.min(1, Math.max(0, t));
    var n = Math.round(t * spans.length);
    if (n === lit) return;
    lit = n;
    for (var i = 0; i < spans.length; i++) {
      spans[i].classList.toggle('lit', i < n);
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); }
  }, { passive: true });
  window.addEventListener('resize', update);
  document.addEventListener('qaenat:motion', update);
  update();

  /* ---- viewpoints switcher ---- */
  var img = document.getElementById('viewImg');
  var cap = document.getElementById('viewCaption');
  var btns = Array.prototype.slice.call(document.querySelectorAll('.viewpoint'));
  if (img && cap && btns.length) {
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        var pre = new Image();
        pre.src = b.getAttribute('data-img');
        pre.onload = function () {
          img.style.opacity = '0';
          setTimeout(function () {
            img.src = b.getAttribute('data-img');
            img.alt = b.querySelector('b').textContent;
            cap.textContent = b.getAttribute('data-cap');
            img.style.opacity = '1';
          }, 180);
        };
        img.style.transition = 'opacity 0.25s ease';
        // Fallback if cached/instant:
        setTimeout(function () {
          if (img.getAttribute('src') !== b.getAttribute('data-img')) {
            img.src = b.getAttribute('data-img');
            cap.textContent = b.getAttribute('data-cap');
            img.style.opacity = '1';
          }
        }, 600);
      });
    });
  }
})();
