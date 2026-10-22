
'use strict';
(() => {
  const progress = document.getElementById('reading-progress');
  const backTop = document.getElementById('back-top');
  let queued = false;
  function updateReading() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0})`;
    backTop.hidden = window.scrollY < window.innerHeight;
    queued = false;
  }
  function scheduleUpdate() {
    if (!queued) { queued = true; requestAnimationFrame(updateReading); }
  }
  window.addEventListener('scroll', scheduleUpdate, {passive: true});
  window.addEventListener('resize', scheduleUpdate);
  window.addEventListener('load', scheduleUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleUpdate).observe(document.body);
  updateReading();
})();
