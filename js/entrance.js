/* El Pueblo #2 — entrance: the approved film as a full-width muted looping hero (M01–M03, M59, M60).
   Poster first; playback starts from script so reduced motion, Save-Data and no-JS visitors keep the still. */
(function () {
  'use strict';
  const EP = window.EP, M = window.EP_MEDIA || {};
  const section = document.getElementById('entrance'), video = document.getElementById('heroVideo'), poster = document.getElementById('heroPoster'),
    btn = document.getElementById('heroPlay'), label = btn && btn.querySelector('.hero-play-label');
  section.classList.add('is-in');
  if (!video || !M.video_web_mp4) { section.dataset.media = 'still'; return; }
  const saveData = navigator.connection && navigator.connection.saveData;
  const small = innerWidth < 1100 || saveData;
  let userPaused = false, inView = true, failed = false, started = false;

  function setUI(playing) { // no visible pause control; the Motion toggle (core.js) is the pause for the film and every other decorative motion
    if (btn) { btn.setAttribute('aria-pressed', String(!playing)); btn.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film'); if (label) label.textContent = playing ? 'Pause' : 'Play'; }
    section.classList.toggle('is-playing', playing);
  }
  function showPoster(reason) { failed = true; section.classList.add('is-poster'); section.dataset.media = 'poster-' + reason; if (btn) btn.hidden = true; }
  function attach() {
    if (started) return; started = true;
    const s = document.createElement('source'); s.src = small && M.video_web_mp4_small ? M.video_web_mp4_small : M.video_web_mp4; s.type = 'video/mp4';
    video.appendChild(s); video.load();
  }
  function play() {
    attach();
    const p = video.play();
    if (p && p.then) p.then(() => setUI(true)).catch(() => { setUI(false); if (!EP.reduced && !userPaused) section.classList.add('is-poster'); });
    else setUI(true);
  }
  video.addEventListener('error', () => showPoster('error'));
  video.addEventListener('stalled', () => { if (video.readyState < 2 && !failed) section.classList.add('is-buffering'); });
  video.addEventListener('playing', () => { section.classList.remove('is-poster', 'is-buffering'); setUI(true); });
  video.addEventListener('pause', () => { if (!video.ended) setUI(false); });
  if (btn) btn.addEventListener('click', () => { if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); } });
  // M60: stop work when the hero is off screen or the tab is hidden; resume only if the visitor did not pause it
  new IntersectionObserver((en) => {
    inView = en[0].isIntersecting;
    if (!inView) { if (!video.paused) video.pause(); }
    else if (video.paused && started && !userPaused && !EP.reduced && !failed) video.play().catch(() => {});
  }, { threshold: 0.2 }).observe(section);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { if (!video.paused) video.pause(); } else if (inView && started && !userPaused && !EP.reduced && !failed) video.play().catch(() => {}); });
  document.addEventListener('ep:motion', (e) => { if (e.detail.reduced) { if (!video.paused) video.pause(); setUI(false); } else if (!userPaused && inView && !failed) play(); });

  section.dataset.media = 'film';
  if (EP.reduced) { setUI(false); }           // still frame; the Play button is available
  else play();                                // autoplay (muted, inline, loop)
})();
