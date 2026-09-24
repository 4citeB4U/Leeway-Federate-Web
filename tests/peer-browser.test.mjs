/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.BROWSER_PEER
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee; bounded local/CI browser test runner
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Real browser WebRTC integration proof and failure/reconnect tests
WHY = Distinguish socket execution from a simulated networking demo
WHO = Leeway Industries / Agent Lee
WHERE = tests/peer-browser.test.mjs
WHEN = 2026-09-24
HOW = Two isolated Chromium contexts, manual offer/answer, DTLS stats and HTTP shutdown
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md)
*/
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.LEEWAY_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
const checks=[],externalRequests=[];
const evidence={schema:'leeway.browser-peer-test.v1',status:'RUNNING',startedAt:new Date().toISOString(),
  scope:'Two isolated browser contexts on one test machine; not independent devices, WAN, CGNAT, community mesh, or canonical Runtime Fabric',
  formulaExecuted:false,canonicalVeritas:false,learningLedgerUpdated:false,checks,externalRequests};
const check=(name,details={})=>{checks.push({name,status:'PASS',...details});console.log('PASS',name)};
let browser,server;let serverUp=false;
try {
  server=http.createServer(async(req,res)=>{
    try{
      const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
      if(!file.startsWith(root+path.sep)||file.includes('/.git/')){res.writeHead(403).end();return;}
      const data=await fs.readFile(file);const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'}[path.extname(file)]||'text/plain';
      res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'}).end(data);
    }catch{res.writeHead(404).end('Not found');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));serverUp=true;
  const base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.LEEWAY_CHROMIUM_PATH?{executablePath:process.env.LEEWAY_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
  evidence.browser=browser.version();evidence.node=process.version;evidence.platform=process.platform;
  const c1=await browser.newContext(),c2=await browser.newContext();
  for(const c of [c1,c2])await c.route('**/*',r=>{
    if(new URL(r.request().url()).origin!==base){externalRequests.push(r.request().url());return r.abort();}return r.continue();
  });
  const a=await c1.newPage(),b=await c2.newPage();
  const pageErrors=[];for(const p of [a,b])p.on('pageerror',e=>pageErrors.push(e.message));
  await Promise.all([a.goto(base+'/peer.html'),b.goto(base+'/peer.html')]);
  for(const p of [a,b])await p.waitForFunction(()=>document.querySelector('#peer-id').value.startsWith('lw-peer-'));
  const aid=await a.locator('#peer-id').inputValue(),bid=await b.locator('#peer-id').inputValue();assert.notEqual(aid,bid);check('Separate context signing identities');
  await a.reload();await a.waitForFunction(()=>document.querySelector('#peer-id').value.startsWith('lw-peer-'));
  assert.equal(await a.locator('#peer-id').inputValue(),aid);check('Signing identity survives reload');
  assert.equal(await a.locator('#send').isDisabled(),true);check('Sending disabled before pairing');
  await a.locator('#expected-peer').fill(bid);await b.locator('#expected-peer').fill(aid);
  async function createOffer(){await a.locator('#create-offer').click();await a.waitForFunction(()=>document.querySelector('#outgoing').value.includes('signature'));return a.locator('#outgoing').inputValue();}
  async function accept(page,text){await page.locator('#incoming').fill(text);await page.locator('#consent').check();await page.locator('#accept').click();}
  async function connected(){for(const p of [a,b])await p.waitForFunction(()=>document.querySelector('#connection-state').textContent==='CONNECTED',null,{timeout:20000});}
  const offer=await createOffer();
  await b.locator('#incoming').fill(offer);await b.locator('#inspect').click();await b.waitForFunction(()=>document.querySelector('#inspection').textContent.startsWith('Signature valid'));
  assert.equal(await b.locator('#connection-state').textContent(),'IDLE');check('Inspection does not attach a peer');
  await b.locator('#accept').click();await b.waitForFunction(()=>document.querySelector('#error').textContent.includes('consent'));
  assert.equal(await b.locator('#connection-state').textContent(),'IDLE');check('No-consent attach rejected');
  const altered=JSON.parse(offer);altered.payload.sdp+='a=ice-ufrag:tampered\r\n';
  await accept(b,JSON.stringify(altered));await b.waitForFunction(()=>document.querySelector('#error').textContent.includes('signature'));
  assert.equal(await b.locator('#connection-state').textContent(),'IDLE');check('Tampered package rejected before attachment');
  await b.locator('#expected-peer').fill(bid);await accept(b,offer);await b.waitForFunction(()=>document.querySelector('#error').textContent.includes('does not match'));
  await b.locator('#expected-peer').fill(aid);check('Wrong trusted peer ID rejected');
  await accept(b,offer);await b.waitForFunction(()=>document.querySelector('#outgoing').value.includes('signature'));
  const answer=await b.locator('#outgoing').inputValue();
  const wrongSession=await b.evaluate(async text=>{
    const {getPeerIdentity}=await import('./src/core/identity.js');const {signPairing}=await import('./src/core/pairing.js');
    const {payload}=JSON.parse(text);return (await signPairing(await getPeerIdentity(),{...payload,session:crypto.randomUUID()})).text;
  },answer);
  await accept(a,wrongSession);await a.waitForFunction(()=>document.querySelector('#error').textContent.includes('pending offer'));check('Correctly signed wrong-session answer rejected');
  await accept(a,answer);await connected();check('Real WebRTC data channel opens in both contexts');
  async function send(page,other,text){await page.locator('#message').fill(text);await page.locator('#send').click();await other.waitForFunction(t=>document.querySelector('#messages').textContent.includes('Received: '+t),text);}
  await send(a,b,'LeeWay A-to-B live payload');await send(b,a,'LeeWay B-to-A live payload');check('Bidirectional application data transferred');
  await send(a,b,'<img src=x onerror="window.injected=1">');assert.equal(await b.evaluate(()=>window.injected),undefined);check('Remote text rendered without HTML execution');
  for(let i=0;i<5;i++){await a.locator('#ping').click();await a.waitForFunction(()=>!document.querySelector('#ping').disabled);}
  await a.locator('#stats').click();await a.waitForFunction(()=>document.querySelector('#transport-stats').textContent.includes('dtlsState'));
  evidence.firstTransport=JSON.parse(await a.locator('#transport-stats').textContent());
  assert.equal(evidence.firstTransport.dtlsState,'connected');assert.equal(evidence.firstTransport.selectedCandidatePair.state,'succeeded');
  assert.ok(evidence.firstTransport.bytesSent>0&&evidence.firstTransport.bytesReceived>0);check('DTLS and selected ICE candidate pair observed',evidence.firstTransport);
  const log=await a.evaluate(async()=>{const {readReceipts}=await import('./src/core/receipts.js');return readReceipts()});
  evidence.roundTripsMs=log.filter(r=>r.event==='ROUND_TRIP').map(r=>r.payload.applicationRoundTripMs);
  assert.equal(evidence.roundTripsMs.length,5);assert.ok(evidence.roundTripsMs.every(x=>Number.isFinite(x)&&x>=0));check('Five real application round-trip samples', {samples:evidence.roundTripsMs});
  const peerLog=await b.evaluate(async()=>{const {readReceipts}=await import('./src/core/receipts.js');return readReceipts()});
  assert.ok(!JSON.stringify(peerLog).includes('onerror'));assert.ok(!JSON.stringify(peerLog).includes('a=ice-ufrag'));check('Local receipts exclude payload and SDP contents');
  await a.locator('#disconnect').click();await b.waitForFunction(()=>['CLOSED','DISCONNECTED','FAILED'].includes(document.querySelector('#connection-state').textContent),null,{timeout:10000});
  assert.equal(await a.locator('#send').isDisabled(),true);check('Disconnect detected and subsequent sends disabled');
  await new Promise(resolve=>{server.close(resolve);server.closeAllConnections()});serverUp=false;evidence.bootstrapHttpServerStopped=true;
  await accept(b,offer);await b.waitForFunction(()=>document.querySelector('#error').textContent.includes('already consumed'));check('Consumed offer replay rejected in same page lifetime');
  const next=await createOffer();assert.notEqual(JSON.parse(next).payload.session,JSON.parse(offer).payload.session);
  await accept(b,next);await b.waitForFunction(old=>document.querySelector('#outgoing').value!==old,answer);
  await accept(a,await b.locator('#outgoing').inputValue());await connected();
  await send(a,b,'Fresh connection after HTTP bootstrap shutdown');
  await a.locator('#ping').click();await a.waitForFunction(()=>!document.querySelector('#ping').disabled);check('Fresh manual reconnect and data after HTTP server shutdown (already-loaded pages)');
  assert.deepEqual(externalRequests,[]);assert.deepEqual(pageErrors,[]);check('No external HTTP requests or uncaught page errors');
  const screenshot=process.env.LEEWAY_SCREENSHOT;if(screenshot)await a.screenshot({path:screenshot,fullPage:true});
  evidence.codeHashes={};
  for(const file of ['peer.html','src/peer.js','src/core/identity.js','src/core/pairing.js','src/core/peer-session.js','tests/peer-core.test.mjs','tests/peer-browser.test.mjs'])evidence.codeHashes[file]=createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');
  evidence.status='PASS';
}catch(error){evidence.status='FAIL';evidence.error=error.stack;console.error(error);process.exitCode=1;}
finally{
  if(browser)await browser.close();if(serverUp)await new Promise(r=>{server.close(r);server.closeAllConnections()});
  evidence.finishedAt=new Date().toISOString();
  const dest=process.env.LEEWAY_TEST_RECEIPT||'/tmp/leeway-peer-test.json';await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,JSON.stringify(evidence,null,2)+'\n');console.log('Evidence:',dest,evidence.status);
}
