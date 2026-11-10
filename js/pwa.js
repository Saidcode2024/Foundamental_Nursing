(function () {
  'use strict';
  var btn = document.getElementById('install'), deferred = null;
  function toast(t) {
    var e = document.createElement('div'); e.className = 'toast'; e.textContent = t;
    document.body.appendChild(e); setTimeout(function () { e.remove(); }, 3000);
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; if (btn) btn.hidden = false;
  });
  if (btn) btn.addEventListener('click', function () {
    if (!deferred) return;
    deferred.prompt(); deferred.userChoice.then(function () { deferred = null; btn.hidden = true; });
  });
  window.addEventListener('appinstalled', function () { if (btn) btn.hidden = true; });
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'precached') {
      var seen = false;
      try { seen = localStorage.getItem('na.offlineReady') === '1'; localStorage.setItem('na.offlineReady', '1'); } catch (x) {}
      if (!seen) toast('Ready to use offline');
    }
  });
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      // each time the app is opened online, refresh the offline copy (picks up new/edited lectures)
      return navigator.serviceWorker.ready.then(function (r) { if (navigator.onLine && r.active) r.active.postMessage('sync'); });
    }).catch(function () { /* file:// or http: without localhost: the site still works, just not offline */ });
  });
})();
