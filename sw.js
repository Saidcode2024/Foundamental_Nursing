/* Nursing Academy service worker: makes the whole site work offline.
   - Installs: caches the app shell (html/css/js/icons) + data/lectures.js.
   - Then reads data/lectures.js and caches EVERY lecture page, its image, and the local
     files each lecture page uses (css, js, images, fonts...). Pages you add later are
     picked up automatically the next time the app is opened online.
   - Change CACHE_VERSION only if you want to wipe everything and start fresh. */
const CACHE_VERSION = 'v1';
const CACHE = 'nursing-academy-' + CACHE_VERSION;
const CORE = ['./', 'index.html', 'css/style.css', 'data/lectures.js', 'manifest.webmanifest',
  'js/app.js', 'js/img.js', 'js/storage.js', 'js/progress.js', 'js/lectures.js', 'js/quiz.js', 'js/lecture-tools.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.svg'];
const abs = (u, base) => new URL(u, base || self.registration.scope).href;

async function put(cache, url) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    if (r && r.ok) { await cache.put(url, r.clone()); return r; }
  } catch (e) { /* offline or missing file: ignore */ }
  return null;
}

function refsOf(text, baseUrl, isCss) {
  const out = new Set(), add = (v) => {
    v = (v || '').trim().replace(/^['"]|['"]$/g, '');
    if (!v || /^(data:|mailto:|tel:|javascript:|#)/i.test(v)) return;
    try { const u = new URL(v, baseUrl); u.hash = ''; if (u.origin === self.location.origin) out.add(u.href); } catch (e) { /* skip */ }
  };
  let m;
  if (!isCss) { const re = /(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi; while ((m = re.exec(text))) add(m[1]); }
  const re2 = /url\(([^)]+)\)/gi; while ((m = re2.exec(text))) add(m[1]);
  const re3 = /@import\s+["']([^"']+)["']/gi; while ((m = re3.exec(text))) add(m[1]);
  return out;
}

async function cacheAssetsOf(cache, pageUrl, text, seen, isCss) {
  for (const u of refsOf(text, pageUrl, isCss)) {
    if (seen.has(u) || /\.html?$/i.test(new URL(u).pathname)) continue;   // don't follow links to other pages
    seen.add(u);
    const r = await put(cache, u);
    if (r && /\.css$/i.test(new URL(u).pathname)) { try { await cacheAssetsOf(cache, u, await r.clone().text(), seen, true); } catch (e) {} }
  }
}

async function precacheLectures(cache) {
  let text = '';
  const r = await put(cache, abs('data/lectures.js'));
  try { text = r ? await r.clone().text() : await (await cache.match(abs('data/lectures.js'))).text(); } catch (e) { return 0; }
  let list = [];
  try { const w = {}; new Function('window', text)(w); list = (w.LECTURES && w.LECTURES.lectures) || []; } catch (e) { return 0; }
  const seen = new Set();
  let n = 0;
  await Promise.all(list.map(async (l) => {
    if (l.image) for (const ext of IMG_EXT) { if (await put(cache, abs(l.image + ext))) break; }
    if (!l.content) return;
    const pageUrl = abs(l.content);
    const pr = await put(cache, pageUrl);
    if (pr) { n++; try { await cacheAssetsOf(cache, pageUrl, await pr.clone().text(), seen, false); } catch (e) {} }
  }));
  return n;
}

async function precacheAll() {
  const cache = await caches.open(CACHE);
  await Promise.all(CORE.map((u) => put(cache, abs(u))));
  const pages = await precacheLectures(cache);
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'precached', pages }));
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE.map((u) => abs(u)));   // app shell must be complete
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('nursing-academy-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
    await precacheAll();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'sync') e.waitUntil(precacheAll());
});

const OFFLINE_PAGE = () => new Response(
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title>' +
  '<body style="font-family:system-ui,sans-serif;text-align:center;padding:40px 20px;color:#142D4E"><h2>This page is not saved offline yet</h2>' +
  '<p>Open the app once while online and it will be saved.</p><p><a href="' + abs('index.html') + '">Back to Nursing Academy</a></p></body>',
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const r = await Promise.race([fetch(req), timeout(4000)]);
    if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone());
    return r;
  } catch (err) {
    const c = await cache.match(req, { ignoreSearch: true });
    if (c) return c;
    if (req.mode === 'navigate') return OFFLINE_PAGE();
    return Response.error();
  }
}

function staleWhileRevalidate(e) {
  const req = e.request;
  const p = (async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const net = fetch(req).then((r) => { if (r && (r.ok || r.type === 'opaque')) cache.put(req, r.clone()); return r; }).catch(() => null);
    e.waitUntil(net);
    return cached || (await net) || Response.error();
  })();
  return p;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (['image', 'font', 'audio', 'video'].includes(req.destination)) e.respondWith(staleWhileRevalidate(e));
  else e.respondWith(networkFirst(req));
});
