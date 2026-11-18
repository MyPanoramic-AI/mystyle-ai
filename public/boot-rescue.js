/**
 * CSP-safe boot watchdog (external file — production script-src is 'self' only).
 * Injects a simple rescue panel only if React never marks boot ready.
 * Avoids a permanent max-z-index overlay (breaks paint in Cursor/Electron browsers).
 */
(function () {
  var RESCUE_MS = 8000;
  var rescueEl = null;

  function removeRescue() {
    if (rescueEl && rescueEl.parentNode) {
      rescueEl.parentNode.removeChild(rescueEl);
    }
    rescueEl = null;
  }

  function markReady() {
    document.documentElement.setAttribute('data-istyleu-boot', 'ready');
    removeRescue();
    // Nudge Electron/Cursor compositors that can stick on a blank layer.
    try {
      document.body.style.transform = 'translateZ(0)';
      void document.body.offsetHeight;
      document.body.style.transform = '';
    } catch (e) {}
  }

  window.__istyleuMarkBootReady = markReady;

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

  function openRescue() {
    if (document.documentElement.getAttribute('data-istyleu-boot') === 'ready') return;
    if (rescueEl) return;

    rescueEl = document.createElement('div');
    rescueEl.id = 'istyleu-boot-rescue';
    rescueEl.setAttribute('role', 'alertdialog');
    rescueEl.setAttribute('aria-live', 'assertive');
    rescueEl.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'right:0',
      'bottom:0',
      'z-index:10000',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:1rem',
      'background:#F6F2EC',
      'color:#242326',
      'font-family:Georgia,\"Times New Roman\",serif',
    ].join(';');

    rescueEl.innerHTML = [
      '<div style="max-width:28rem;width:100%;background:#fff;border:1px solid rgba(36,35,38,0.1);border-radius:1.5rem;padding:2rem;box-shadow:0 1px 2px rgba(36,35,38,0.06)">',
      '<div style="font-size:1.5rem">IStyleU</div>',
      '<h1 style="margin:1.5rem 0 0;font-size:1.75rem">Still checking your account</h1>',
      '<p style="margin:0.75rem 0 0;font:0.875rem/1.5 system-ui,sans-serif;color:#5C585E">The app has not finished signing you in. Reload, or clear the stuck session and continue.</p>',
      '<div style="margin-top:1.5rem;display:flex;flex-direction:column;gap:0.75rem">',
      '<button type="button" id="istyleu-boot-reload" style="appearance:none;border:0;border-radius:999px;padding:0.7rem 1.1rem;font:600 0.875rem system-ui,sans-serif;cursor:pointer;background:#9C6A61;color:#fff">Reload</button>',
      '<button type="button" id="istyleu-boot-clear" style="appearance:none;border:1px solid rgba(36,35,38,0.12);border-radius:999px;padding:0.7rem 1.1rem;font:600 0.875rem system-ui,sans-serif;cursor:pointer;background:#F6F2EC;color:#242326">Clear session and continue</button>',
      '</div></div>',
    ].join('');

    document.body.appendChild(rescueEl);

    var reloadBtn = document.getElementById('istyleu-boot-reload');
    var clearBtn = document.getElementById('istyleu-boot-clear');
    if (reloadBtn) reloadBtn.addEventListener('click', function () { window.location.reload(); });
    if (clearBtn) clearBtn.addEventListener('click', clearSiteDataAndReload);
  }

  setTimeout(openRescue, RESCUE_MS);
})();
