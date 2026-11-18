/**
 * CSP-safe boot watchdog (script-src 'self' only — no inline script).
 * Shows a reload/clear overlay if React never marks the boot as ready.
 */
(function () {
  var RESCUE_MS = 5000;
  var opened = false;

  function markReady() {
    document.documentElement.setAttribute('data-istyleu-boot', 'ready');
    var el = document.getElementById('istyleu-boot-rescue');
    if (el) el.setAttribute('data-open', '0');
  }

  window.__istyleuMarkBootReady = markReady;

  function openRescue() {
    if (opened) return;
    if (document.documentElement.getAttribute('data-istyleu-boot') === 'ready') return;
    opened = true;
    var el = document.getElementById('istyleu-boot-rescue');
    if (el) el.setAttribute('data-open', '1');
  }

  function clearSiteDataAndReload() {
    var tasks = [];
    try { if (window.localStorage) window.localStorage.clear(); } catch (e) {}
    try { if (window.sessionStorage) window.sessionStorage.clear(); } catch (e) {}
    try {
      if (window.caches && caches.keys) {
        tasks.push(caches.keys().then(function (keys) {
          return Promise.all(keys.map(function (key) { return caches.delete(key); }));
        }));
      }
    } catch (e) {}
    try {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
        tasks.push(navigator.serviceWorker.getRegistrations().then(function (regs) {
          return Promise.all(regs.map(function (reg) { return reg.unregister(); }));
        }));
      }
    } catch (e) {}
    Promise.all(tasks).catch(function () {}).then(function () {
      var url = new URL(window.location.href);
      url.searchParams.set('boot', String(Date.now()));
      window.location.replace(url.toString());
    });
  }

  function enableFonts() {
    var links = document.querySelectorAll('link[data-istyleu-fonts="1"]');
    for (var i = 0; i < links.length; i += 1) {
      links[i].media = 'all';
    }
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    enableFonts();
    var reloadBtn = document.getElementById('istyleu-boot-reload');
    var clearBtn = document.getElementById('istyleu-boot-clear');
    if (reloadBtn) reloadBtn.addEventListener('click', function () { window.location.reload(); });
    if (clearBtn) clearBtn.addEventListener('click', clearSiteDataAndReload);
  });

  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (reg) { reg.unregister(); });
      });
    }
  } catch (e) {}

  setTimeout(openRescue, RESCUE_MS);
})();
