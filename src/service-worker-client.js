/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.SERVICE_WORKER.CLIENT
AUTHORITY: LeeWay-Standards
5WH: WHAT=Versioned service-worker registration; WHY=Deliver repaired code on the next navigation without dropping active sessions; WHO=Leeway Industries; WHERE=src/service-worker-client.js; WHEN=2026-10-30; HOW=Scoped registration with non-disruptive controller updates
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY */
if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
