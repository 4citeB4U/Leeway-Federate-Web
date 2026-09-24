/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.PEER.CONTROLLER
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee within approved browser transport scope
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Manual peer connection proof surface
WHY = Exercise real browser data transport with explicit peer consent
WHO = Leeway Industries / Agent Lee System Engineer
WHERE = src/peer.js
WHEN = 2026-09-24
HOW = Native browser WebRTC and WebCrypto; no hosted signaling or ICE services
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */

import {getPeerIdentity} from './core/identity.js';
import {inspectPairing} from './core/pairing.js';
import {PeerSession} from './core/peer-session.js';
import {emitReceipt,exportReceipts} from './core/receipts.js';
const $=id=>document.getElementById(id);let peer,busy=false;const events=[];
function error(e){$('error').hidden=false;$('error').textContent=e.message||String(e);}
function controls(){
  $('connection-state').textContent=peer?.state||'INITIALIZING';
  for(const id of ['create-offer','inspect','accept','copy-id'])$(id).disabled=!peer||busy;
  for(const id of ['send','ping'])$(id).disabled=busy||peer?.state!=='CONNECTED';
  $('disconnect').disabled=busy||!peer?.pc;$('stats').disabled=busy||!peer?.pc;
  $('copy-package').disabled=busy||!$('outgoing').value;
}
async function action(fn){
  if(busy)return;busy=true;$('error').hidden=true;controls();
  try{await fn()}catch(e){error(e)}finally{busy=false;controls()}
}
function message(direction,text){
  const item=document.createElement('li');item.textContent=direction+': '+text;$('messages').append(item);
  while($('messages').children.length>100)$('messages').firstChild.remove();
}
function observe(e){
  const {text,...safe}=e;
  if(e.event==='TEXT_RECEIVED')message('Received',text);
  events.push(safe);if(events.length>40)events.shift();$('events').textContent=JSON.stringify(events.slice(-8),null,2);
  try{emitReceipt(e.event,{...safe,formulaExecuted:false,runtimeFabricExecuted:false,canonicalVeritas:false},'OBSERVED')}catch(err){error(new Error('Receipt persistence failed: '+err.message))}
  controls();
}
$('create-offer').onclick=()=>action(async()=>{
  $('outgoing').value=await peer.offer();$('incoming').value='';$('consent').checked=false;
  $('pairing-instructions').textContent='Send this offer to your partner; inspect and accept their returned answer here.';
});
$('inspect').onclick=()=>action(async()=>{
  const v=await inspectPairing($('incoming').value);
  $('inspection').textContent='Signature valid. '+v.payload.type.toUpperCase()+' from '+v.payload.from+'. Check against your independently obtained peer ID before accepting. No connection installed.';
});
$('accept').onclick=()=>action(async()=>{
  try{
    const answer=await peer.accept($('incoming').value,$('expected-peer').value,$('consent').checked);
    if(answer){$('outgoing').value=answer;$('pairing-instructions').textContent='Send this answer back to the participant who created the offer.';}
    else $('pairing-instructions').textContent='Answer accepted. Waiting for a direct WebRTC data channel.';
    $('consent').checked=false;
  }catch(e){observe({event:'PAIRING_REJECTED',at:new Date().toISOString(),state:peer.state,reason:e.message});throw e;}
});
$('send').onclick=()=>action(async()=>{peer.sendText($('message').value);message('Sent',$('message').value);$('message').value='';});
$('ping').onclick=()=>action(async()=>{const ms=await peer.ping();$('round-trip').textContent='Application round trip: '+ms.toFixed(3)+' ms (not one-way latency).';});
$('stats').onclick=()=>action(async()=>{const stats=await peer.stats();$('transport-stats').textContent=JSON.stringify(stats,null,2);observe({event:'RTC_STATS_OBSERVED',at:new Date().toISOString(),...stats});});
$('disconnect').onclick=()=>action(async()=>{peer.close();$('outgoing').value='';$('consent').checked=false;$('pairing-instructions').textContent='Disconnected. Create a fresh offer to reconnect.';});
$('copy-id').onclick=()=>action(()=>navigator.clipboard.writeText($('peer-id').value));
$('copy-package').onclick=()=>action(()=>navigator.clipboard.writeText($('outgoing').value));
$('export').onclick=()=>action(async()=>exportReceipts());
window.addEventListener('pagehide',()=>peer?.close('page-hidden-or-unloaded'));
try{
  const identity=await getPeerIdentity();$('peer-id').value=identity.id;$('identity-storage').textContent='Key storage: '+identity.persistence;
  peer=new PeerSession(identity,observe);controls();
}catch(e){$('connection-state').textContent='BLOCKED';error(e);}
