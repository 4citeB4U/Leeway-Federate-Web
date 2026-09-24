/*
LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.CONNECT.CONTROLLER
AUTHORITY: LeeWay-Standards
5WH: WHAT=Plain-language device connection controller; WHY=Hide signaling mechanics behind human workflow; WHO=Leeway Industries; WHERE=src/connect.js; WHEN=2026-09-24; HOW=Verified peer engine plus progressive share/clipboard
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
import{getPeerIdentity}from'./core/identity.js';import{inspectPairing,safetyCode}from'./core/pairing.js';import{PeerSession}from'./core/peer-session.js';
const $=id=>document.getElementById(id);let identity,peer,outgoing='',verified=null,busy=false;
function show(id){$(id).hidden=false}function hide(id){$(id).hidden=true}
function notice(text){$('notice').textContent=text;$('error').hidden=true}function fail(e){$('error').textContent=e.message||String(e);show('error')}
function state(){if(!peer)return;$('advanced-state').textContent=peer.state;$('advanced-peer').textContent=peer.remoteId||'Not connected';if(peer.state==='CONNECTED'){hide('choice');hide('invite-step');hide('receive-step');show('connected');notice('Connection complete.');}}
async function act(fn){if(busy)return;busy=true;try{await fn()}catch(e){fail(e)}finally{busy=false;state()}}
async function copy(text,label){await navigator.clipboard.writeText(text);notice(label+' copied.');}
async function share(text,title){if(navigator.share){try{await navigator.share({title,text});notice(title+' shared.');return}catch(e){if(e.name==='AbortError')return}}await copy(text,title)}
async function review(text,type){const v=await inspectPairing(text);if(v.payload.type!==type)throw new Error(type==='offer'?'That is not a LeeWay invite.':'That is not a LeeWay approval.');return v}
$('start').onclick=()=>act(async()=>{hide('choice');show('invite-step');outgoing=await peer.offer();notice('Invite ready. Send it to your other device.');});
$('receive').onclick=()=>{hide('choice');show('receive-step');notice('Paste the invite from your other device.');};
$('share-invite').onclick=()=>act(()=>share(outgoing,'LeeWay invite'));$('copy-invite').onclick=()=>act(()=>copy(outgoing,'Invite'));
$('check-invite').onclick=()=>act(async()=>{verified=await review($('invite-input').value,'offer');show('invite-review');notice('Invite verified. You can choose whether to allow it.');});
$('allow').onclick=()=>act(async()=>{const p=verified.payload;outgoing=await peer.accept($('invite-input').value,p.from,true);$('invite-code').textContent=await safetyCode(identity.id,p.from,p.session);hide('invite-review');show('return-approval');notice('Connection approved. Send the approval back.');});
$('share-approval').onclick=()=>act(()=>share(outgoing,'LeeWay approval'));$('copy-approval').onclick=()=>act(()=>copy(outgoing,'Approval'));
$('check-approval').onclick=()=>act(async()=>{verified=await review($('approval-input').value,'answer');const p=verified.payload;$('approval-code').textContent=await safetyCode(identity.id,p.from,p.session);show('approval-review');notice('Approval verified. Compare the safety code on both devices.');});
$('approval-match').onchange=()=>{$('finish').disabled=!$('approval-match').checked};
$('finish').onclick=()=>act(async()=>{if(!$('approval-match').checked)throw new Error('Compare the safety code first.');const p=verified.payload;await peer.accept($('approval-input').value,p.from,true);notice('Connecting…');});
$('send-test').onclick=()=>act(async()=>{const text=$('test-message').value.trim();if(!text)throw new Error('Enter a short test message.');peer.sendText(text);$('message-status').textContent='Test sent.';});
$('disconnect').onclick=()=>act(async()=>{peer.close('user');hide('connected');show('choice');notice('Disconnected. You can connect again whenever you are ready.');});
try{identity=await getPeerIdentity();$('advanced-id').textContent=identity.id;peer=new PeerSession(identity,e=>{if(e.event==='TEXT_RECEIVED')$('message-status').textContent='Message received from your other device: “'+e.text+'”';state()});state()}catch(e){fail(e)}
