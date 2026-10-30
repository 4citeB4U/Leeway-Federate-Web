/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.SERVICE_WORKER
AUTHORITY: LeeWay-Standards
5WH: WHAT=Offline LeeWay web shell; WHY=Cache human and advanced connection surfaces; WHO=Leeway Industries; WHERE=service-worker.js; WHEN=2026-09-24; HOW=Scoped versioned cache
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY */
const CACHE='leeway-federate-web-v4-reviewed-pairing';
const SHELL=['./','./index.html','./connect.html','./peer.html','./assets/styles.css','./assets/connect.css','./assets/peer.css','./src/main.js','./src/service-worker-client.js','./src/connect.js','./src/peer.js','./src/core/identity.js','./src/core/pairing.js','./src/core/peer-session.js','./src/core/path-score.js','./src/core/receipts.js','./src/config/ecosystem.js','./bootstrap.json','./ecosystem.manifest.json'];
const scope=new URL(self.registration.scope);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const name of await caches.keys())if(name.startsWith('leeway-federate-web-')&&name!==CACHE)await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const request=event.request.mode==='navigate'||['.js','.html'].some(ext=>url.pathname.endsWith(ext))?new Request(event.request,{cache:'no-store'}):event.request;
      const response=await fetch(request);
      if(response.ok)await cache.put(event.request,response.clone());
      return await cache.match(event.request)||response;
    }catch(error){
      const old=await cache.match(event.request);
      if(old)return old;
      throw error;
    }
  })());
});
