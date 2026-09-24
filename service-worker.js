/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.SERVICE_WORKER
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee within approved browser transport scope
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Manual peer connection proof surface
WHY = Exercise real browser data transport with explicit peer consent
WHO = Leeway Industries / Agent Lee System Engineer
WHERE = service-worker.js
WHEN = 2026-09-24
HOW = Native browser WebRTC and WebCrypto; no hosted signaling or ICE services
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */

const CACHE='leeway-federate-web-v2-peer';
const SHELL=['./','./index.html','./peer.html','./assets/styles.css','./assets/peer.css','./src/main.js','./src/peer.js','./src/core/identity.js','./src/core/pairing.js','./src/core/peer-session.js','./src/core/path-score.js','./src/core/receipts.js','./src/config/ecosystem.js','./bootstrap.json','./ecosystem.manifest.json'];
const scope=new URL(self.registration.scope);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('leeway-federate-web-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));
});
