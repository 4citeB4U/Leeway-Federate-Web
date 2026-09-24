/*
LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.SERVICE_WORKER
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Offline web-shell cache; WHY=Keep static surface available after first load; WHO=Leeway Industries; WHERE=service-worker.js; WHEN=2026-09-24; HOW=Cache-first shell
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
const CACHE="leeway-federate-web-v1";const SHELL=["./","./index.html","./assets/styles.css","./src/main.js","./src/core/identity.js","./src/core/path-score.js","./src/core/receipts.js","./src/config/ecosystem.js","./bootstrap.json","./ecosystem.manifest.json"];self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})