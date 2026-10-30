/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.SERVICE_WORKER.CLIENT
AUTHORITY: LeeWay-Standards
5WH: WHAT=Existing-client update boundary; WHY=Ensure security repairs reach open connection pages; WHO=Leeway Industries; WHERE=src/service-worker-client.js; WHEN=2026-10-30; HOW=Controller-change reload plus scoped registration
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY */
if("serviceWorker"in navigator){const hadController=Boolean(navigator.serviceWorker.controller);let reloaded=false;if(hadController)navigator.serviceWorker.addEventListener("controllerchange",()=>{if(reloaded)return;reloaded=true;window.location.reload()});navigator.serviceWorker.register("./service-worker.js").catch(()=>{})}
