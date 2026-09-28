/*
LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.WEB.MAIN
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federate Web browser controller; WHY=Bind identity ecosystem lab and receipts; WHO=Leeway Industries; WHERE=src/main.js; WHEN=2026-09-28; HOW=ES module composition with Standards-owned ecosystem discovery
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
import{getNodeIdentity,rotateNodeIdentity}from"./core/identity.js";
import{rankPaths}from"./core/path-score.js";
import{emitReceipt,readReceipts,exportReceipts}from"./core/receipts.js";
import{loadEcosystem}from"./config/ecosystem.js";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function renderNode(){const n=getNodeIdentity();$("#node-state").innerHTML=`<dt>ID</dt><dd>${esc(n.id)}</dd><dt>Class</dt><dd>${esc(n.class)}</dd><dt>Persistence</dt><dd>${esc(n.persistence)}</dd><dt>Identity proof</dt><dd>${esc(n.proof)}</dd>`}
function ecosystemCard(x){const commit=x.approvedCommit?`<p class="state">commit ${esc(x.approvedCommit.slice(0,12))}</p>`:"";return`<article class="card"><h3>${esc(x.name)}</h3><p>${esc(x.role)}</p><p class="state">${esc(x.state)}</p>${commit}<a href="${esc(x.repo)}" target="_blank" rel="noreferrer">Repository</a>${x.pages?` · <a href="${esc(x.pages)}" target="_blank" rel="noreferrer">Web surface</a>`:""}</article>`}
async function renderEcosystem(){const host=$("#ecosystem");host.innerHTML='<article class="card"><h3>Discovering LeeWay authorities…</h3><p>Reading the canonical LeeWay Standards ecosystem registry.</p></article>';const result=await loadEcosystem();host.innerHTML=result.entries.map(ecosystemCard).join("");emitReceipt("ECOSYSTEM_AUTHORITY_DISCOVERY",{source:result.source,registryId:result.registryId||result.snapshot?.registryId||null,entries:result.entries.length,formulaExecuted:false},"OBSERVED")}
function renderReceipts(){const r=readReceipts();$("#receipt-count").textContent=`${r.length} local receipts`;$("#receipt-preview").textContent=JSON.stringify(r.slice(-3),null,2)}
function runLab(){const paths=[{id:"direct-local",latencyMs:8,jitterMs:2,lossPct:.1,queueMs:3,utilizationPct:32,bandwidthMbps:180,authorized:true,healthy:true},{id:"community-mesh",latencyMs:18,jitterMs:5,lossPct:.4,queueMs:5,utilizationPct:45,bandwidthMbps:90,authorized:true,healthy:true},{id:"relay-fallback",latencyMs:42,jitterMs:7,lossPct:.2,queueMs:4,utilizationPct:20,bandwidthMbps:120,authorized:true,healthy:true},{id:"unauthorized-fast-path",latencyMs:1,jitterMs:0,lossPct:0,queueMs:0,utilizationPct:1,bandwidthMbps:1000,authorized:false,healthy:true}];const ranked=rankPaths(paths);$("#lab-results").innerHTML=ranked.map((p,i)=>`<div class="route ${i===0?"winner":""}"><span>${p.id}</span><strong>${Number.isFinite(p.score)?p.score.toFixed(2):"BLOCKED"}</strong></div>`).join("");emitReceipt("FEDERATION_LAB_RUN",{input:"synthetic",winner:ranked[0].id,formulaExecuted:false,baselineScorer:true},"OBSERVED");renderReceipts()}
$("#rotate-id").addEventListener("click",()=>{const n=rotateNodeIdentity();emitReceipt("NODE_IDENTITY_ROTATED",{id:n.id},"OBSERVED");renderNode();renderReceipts()});
$("#run-lab").addEventListener("click",runLab);
$("#export-receipts").addEventListener("click",exportReceipts);
renderNode();
renderEcosystem().then(renderReceipts).catch(()=>renderReceipts());
if("serviceWorker"in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
