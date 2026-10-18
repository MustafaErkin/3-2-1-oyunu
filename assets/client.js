/* Keep the existing UI; replace only its local HTTP transport with a worker. */
(function () {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  let worker, fatal, serial = 0, theme = 'dark';
  const pending = new Map();
  try {theme = localStorage.getItem('321-theme') === 'light' ? 'light' : 'dark';} catch (_) {}
  document.documentElement.dataset.theme = theme;
  function fail(message) {
    fatal = new Error(message);
    for (const request of pending.values()) request.reject(fatal);
    pending.clear();
  }
  try {
    if (location.protocol === 'file:') throw new Error('Web sürümünü yayımlanan site bağlantısından açın. İnternetsiz Windows kullanımı için EXE paketini kullanabilirsiniz.');
    worker = new Worker(new URL('worker.js', base));
    worker.onmessage = ({data}) => {
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      data.error ? request.reject(new Error(data.error)) : request.resolve(data.value);
    };
    worker.onerror = () => {fail('Arama motoru başlatılamadı. Güncel bir tarayıcıyla sayfayı yenileyin.'); worker.terminate();};
    worker.onmessageerror = () => fail('Arama yanıtı okunamadı. Sayfayı yeniden yükleyin.');
  } catch (error) {fail(error.message);}
  globalThis.kesisimWebApi = async (address, method = 'GET', body, signal) => {
    if (signal?.aborted) throw new DOMException('Arama iptal edildi.', 'AbortError');
    const url = new URL(address, location.origin);
    if (url.pathname === '/api/ayarlar') {
      if (method === 'PUT') {
        if (!['light', 'dark'].includes(body?.theme)) throw new Error('Geçersiz tema.');
        theme = body.theme;
        try {localStorage.setItem('321-theme', theme);} catch (_) {} // Private browsing may disallow persistence.
      }
      return {theme};
    }
    if (fatal) throw fatal;
    if (method !== 'GET') throw new Error('Web sürümü salt okunur veri paketi kullanır.');
    const id = ++serial;
    const value = await new Promise((resolve, reject) => {
      const abort = () => {pending.delete(id); finish(reject, new DOMException('Arama iptal edildi.', 'AbortError'));};
      const timer = setTimeout(() => {pending.delete(id); finish(reject, new Error('Veriler zamanında yüklenemedi. Bağlantınızı kontrol edip sayfayı yenileyin.'));}, 120000);
      const finish = (callback, result) => {clearTimeout(timer); signal?.removeEventListener('abort', abort); callback(result);};
      pending.set(id, {resolve: result => finish(resolve, result), reject: error => finish(reject, error)});
      signal?.addEventListener('abort', abort, {once: true});
      try {worker.postMessage({id, path: url.pathname, params: Object.fromEntries(url.searchParams)});}
      catch (error) {pending.delete(id); finish(reject, error);}
    });
    return url.pathname === '/api/veri/durum' ? {...value, settings: {theme}} : value;
  };
})();
