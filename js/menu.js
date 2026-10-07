/* Mahtab demo — menu page: live search + category pills.
   Original code. */
(function () {
  'use strict';
  var search = document.getElementById('menuSearch');
  var pills = document.getElementById('catPills');
  var list = document.getElementById('menuList');
  var count = document.getElementById('menuCount');
  var noResults = document.getElementById('noResults');
  if (!list) return;

  var cats = Array.prototype.slice.call(list.querySelectorAll('.menu-cat'));
  var activeCat = 'All';

  // Build pills.
  function buildPills() {
    var names = ['All'].concat(cats.map(function (c) { return c.getAttribute('data-cat'); }));
    names.forEach(function (name) {
      var b = document.createElement('button');
      b.className = 'cat-pill' + (name === 'All' ? ' active' : '');
      b.textContent = name;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', name === 'All' ? 'true' : 'false');
      b.addEventListener('click', function () {
        activeCat = name;
        Array.prototype.forEach.call(pills.children, function (x) {
          x.classList.remove('active');
          x.setAttribute('aria-selected', 'false');
        });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        filter();
      });
      pills.appendChild(b);
    });
  }

  function filter() {
    var q = search ? search.value.trim().toLowerCase() : '';
    var shown = 0;
    cats.forEach(function (cat) {
      var catOk = activeCat === 'All' || cat.getAttribute('data-cat') === activeCat;
      var items = cat.querySelectorAll('.menu-item');
      var catShown = 0;
      Array.prototype.forEach.call(items, function (it) {
        var name = (it.getAttribute('data-name') || '').toLowerCase();
        var ok = catOk && (!q || name.indexOf(q) !== -1);
        it.classList.toggle('hidden', !ok);
        if (ok) { shown++; catShown++; }
      });
      cat.style.display = catShown ? '' : 'none';
    });
    if (noResults) noResults.classList.toggle('show', shown === 0);
    if (count) count.textContent = shown + (shown === 1 ? ' dish' : ' dishes') + (q ? ' matching "' + q + '"' : ' on the menu');
  }

  buildPills();
  if (search) search.addEventListener('input', filter);
  filter();
})();
