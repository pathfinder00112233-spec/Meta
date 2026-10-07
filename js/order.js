/* El Pueblo #2 — order chooser: one accessible disclosure for DoorDash and Grubhub, opened from the header button and the phone action bar */
(function () {
  'use strict';
  const btn = document.getElementById('orderBtn'), menu = document.getElementById('orderMenu'), chooser = document.getElementById('orderChooser');
  if (!btn || !menu) return;
  const backdrop = document.createElement('div'); backdrop.className = 'order-backdrop'; backdrop.hidden = true; document.body.appendChild(backdrop);
  let opener = null;
  function open(from) {
    opener = from || btn; menu.hidden = false; backdrop.hidden = false; btn.setAttribute('aria-expanded', 'true'); document.documentElement.classList.add('has-order');
    const first = menu.querySelector('a'); if (first) first.focus();
  }
  function close(restore) {
    if (menu.hidden) return; menu.hidden = true; backdrop.hidden = true; btn.setAttribute('aria-expanded', 'false'); document.documentElement.classList.remove('has-order');
    if (restore !== false && opener && opener.focus) opener.focus();
  }
  btn.addEventListener('click', () => (menu.hidden ? open(btn) : close()));
  document.querySelectorAll('[data-order-open]').forEach((b) => b.addEventListener('click', () => open(b)));
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    if (e.key === 'Tab') { const items = [...menu.querySelectorAll('a')]; const i = items.indexOf(document.activeElement); if (!e.shiftKey && i === items.length - 1) close(false); if (e.shiftKey && i === 0) { e.preventDefault(); close(); } }
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) close(false); }); // the link opens in a new tab; the page keeps its place
  document.addEventListener('click', (e) => { if (!menu.hidden && !chooser.contains(e.target) && !e.target.closest('[data-order-open]')) close(false); });
})();
