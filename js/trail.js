/* Qaenat demo — food-photo trail: dish photos bloom behind the pointer
   as it crosses the brand section. Pooled, clipped, never over text.
   Original code. */
(function () {
  'use strict';
  var section = document.getElementById('brand');
  var stage = document.getElementById('trailStage');
  if (!section || !stage) return;

  var PHOTOS = [
    'media/photos/dish-seekh-kebab.webp',
    'media/photos/dish-manchurian.webp',
    'media/photos/dish-chilli-mushroom.webp',
    'media/photos/dish-afghani-chicken.webp',
    'media/photos/dish-finger-chips.webp',
    'media/photos/dish-dal-special.webp'
  ];
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var POOL = coarse ? 3 : 6;
  var STEP = coarse ? 70 : 95;
  var LIFE = 1400;

  var pool = [], next = 0, order = 0, lastX = -1e5, lastY = -1e5, acc = 0, armed = false;

  function shuffled() {
    var a = PHOTOS.map(function (_, i) { return i; });
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  var seq = shuffled(), si = 0;

  for (var k = 0; k < POOL; k++) {
    var img = document.createElement('img');
    img.className = 'trail-img';
    img.alt = '';
    img.decoding = 'async';
    stage.appendChild(img);
    pool.push(img);
  }
  // Warm the cache on first approach.
  section.addEventListener('pointerenter', function warm() {
    PHOTOS.forEach(function (src) { var i = new Image(); i.src = src; });
    section.removeEventListener('pointerenter', warm);
  });

  function motionOk() {
    return (!window.QAENAT || window.QAENAT.motionOn()) &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function spawn(x, y) {
    if (!motionOk()) return;
    var r = stage.getBoundingClientRect();
    var el = pool[next];
    next = (next + 1) % POOL;
    if (si >= seq.length) { seq = shuffled(); si = 0; }
    el.src = PHOTOS[seq[si++]];
    var w = el.offsetWidth || 120, h = el.offsetHeight || 90;
    var px = Math.max(8, Math.min(r.width - w - 8, x - r.left - w / 2));
    var py = Math.max(8, Math.min(r.height - h - 8, y - r.top - h / 2));
    order++;
    el.style.zIndex = String(order);
    el.style.left = px + 'px';
    el.style.top = py + 'px';
    var rot = (Math.random() - 0.5) * 26;
    var sc = 0.7 + Math.random() * 0.5;
    try {
      el.animate([
        { opacity: 0, transform: 'scale(0.4) rotate(' + (rot - 14) + 'deg)' },
        { opacity: 1, transform: 'scale(' + sc + ') rotate(' + rot + 'deg)', offset: 0.25 },
        { opacity: 1, transform: 'scale(' + sc + ') rotate(' + rot + 'deg)', offset: 0.7 },
        { opacity: 0, transform: 'scale(' + (sc * 0.85) + ') rotate(' + (rot + 8) + 'deg)' }
      ], { duration: LIFE, easing: 'cubic-bezier(0.22,0.61,0.21,1)' }).onfinish = function () {
        el.style.opacity = '0';
      };
    } catch (e) {
      el.style.opacity = '1';
      setTimeout(function () { el.style.opacity = '0'; }, LIFE);
    }
  }

  section.addEventListener('pointermove', function (ev) {
    var dx = ev.clientX - lastX, dy = ev.clientY - lastY;
    acc += Math.sqrt(dx * dx + dy * dy);
    lastX = ev.clientX; lastY = ev.clientY;
    if (acc >= STEP) { acc = 0; spawn(ev.clientX, ev.clientY); }
  }, { passive: true });
  section.addEventListener('pointerleave', function () {
    lastX = -1e5; lastY = -1e5; acc = 0;
  });
})();
