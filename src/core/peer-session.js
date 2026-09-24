/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.PEER_SESSION
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee under Creator-approved scope
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Bounded data-only peer session
WHY = Prove the bounded browser-to-browser transport gate without duplicating Runtime Fabric
WHO = Leeway Industries / Agent Lee System Engineer
WHERE = src/core/peer-session.js
WHEN = 2026-09-24
HOW = Native RTCPeerConnection with no external ICE servers; explicit signed manual pairing
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md)
*/

import {signPairing,inspectPairing,authorizePairing} from './pairing.js';
const byteLength=s=>new TextEncoder().encode(s).length;
const LABEL='leeway-data-v1';
export class PeerSession {
  constructor(identity,onEvent=()=>{}) {
    this.identity=identity;this.onEvent=onEvent;this.usedOffers=new Set();this.pc=null;this.channel=null;
    this.state='IDLE';this.session=null;this.remoteId=null;this.pendingPing=null;this.bytesSent=0;this.bytesReceived=0;this.samples=[];
  }
  emit(event,detail={}) { this.onEvent({event,at:new Date().toISOString(),state:this.state,session:this.session,remoteId:this.remoteId,...detail}); }
  begin(session) {
    this.close('replaced');this.session=session;this.remoteId=null;this.offerHash=null;this.bytesSent=0;this.bytesReceived=0;this.samples=[];
    this.rateStart=performance.now();this.rateCount=0;
    const pc=new RTCPeerConnection({iceServers:[]});this.pc=pc;this.state='CONNECTING';
    pc.onconnectionstatechange=()=>{
      if(this.pc!==pc)return;
      if(['disconnected','failed','closed'].includes(pc.connectionState)){
        this.state=pc.connectionState.toUpperCase();this.emit('TRANSPORT_STATE',{connectionState:pc.connectionState});
      }
    };
    pc.oniceconnectionstatechange=()=>{if(this.pc===pc)this.emit('ICE_STATE',{iceState:pc.iceConnectionState});};
    pc.ondatachannel=e=>{if(this.pc===pc)this.bind(e.channel,pc);else e.channel.close();};
  }
  bind(channel,pc) {
    if(channel.label!==LABEL||this.channel){channel.close();return;}
    this.channel=channel;
    channel.onopen=()=>{
      if(this.pc!==pc)return;
      this.state='CONNECTED';this.emit('CHANNEL_OPEN',{transport:'WebRTC SCTP/DTLS',authorization:'manual-peer-pin-and-consent',formulaExecuted:false});
    };
    channel.onclose=()=>{if(this.pc===pc){this.state='CLOSED';this.cancelPing('Channel closed');this.emit('CHANNEL_CLOSED');}};
    channel.onerror=()=>{if(this.pc===pc){this.state='FAILED';this.emit('CHANNEL_ERROR');}};
    channel.onmessage=e=>{if(this.pc!==pc)return;try{this.receive(e.data)}catch(error){this.emit('FRAME_REJECTED',{reason:error.message});this.close('protocol-error');}};
  }
  async gather() {
    const pc=this.pc;
    if(pc.iceGatheringState==='complete')return;
    await new Promise((resolve,reject)=>{
      const finish=error=>{clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',check);error?reject(error):resolve();};
      const check=()=>{if(pc.iceGatheringState==='complete')finish();};
      const timer=setTimeout(()=>finish(new Error('ICE gathering timed out; no complete pairing package produced')),15000);
      pc.addEventListener('icegatheringstatechange',check);check();
    });
    if(this.pc!==pc)throw new Error('Session changed during ICE gathering');
  }
  async offer() {
    this.begin(crypto.randomUUID());this.bind(this.pc.createDataChannel(LABEL,{ordered:true}),this.pc);
    try {
      await this.pc.setLocalDescription(await this.pc.createOffer());await this.gather();
      const result=await signPairing(this.identity,{type:'offer',session:this.session,sdp:this.pc.localDescription.sdp});
      this.offerHash=result.hash;this.state='OFFER_READY';this.emit('OFFER_CREATED');return result.text;
    } catch(error){this.close('offer-failed');throw error;}
  }
  async accept(text,expectedPeerId,approved=false) {
    const verified=await inspectPairing(text);authorizePairing(verified,expectedPeerId,approved);const p=verified.payload;
    if(p.from===this.identity.id)throw new Error('Self-pairing is blocked; use a separate browser profile or another device');
    if(p.type==='offer') {
      if(this.usedOffers.has(verified.hash))throw new Error('Offer already consumed; request a fresh offer');
      this.begin(p.session);this.remoteId=p.from;this.offerHash=verified.hash;
      try {
        await this.pc.setRemoteDescription({type:'offer',sdp:p.sdp});await this.pc.setLocalDescription(await this.pc.createAnswer());await this.gather();
        const result=await signPairing(this.identity,{type:'answer',session:p.session,to:p.from,offerHash:verified.hash,sdp:this.pc.localDescription.sdp});
        this.usedOffers.add(verified.hash);if(this.usedOffers.size>100)this.usedOffers.delete(this.usedOffers.values().next().value);
        this.state='ANSWER_READY';this.emit('OFFER_ACCEPTED');return result.text;
      }catch(error){this.close('answer-failed');throw error;}
    }
    if(!this.pc||this.state!=='OFFER_READY'||p.to!==this.identity.id||p.session!==this.session||p.offerHash!==this.offerHash)throw new Error('Answer does not belong to this pending offer');
    this.remoteId=p.from;
    await this.pc.setRemoteDescription({type:'answer',sdp:p.sdp});this.state='CONNECTING';this.emit('ANSWER_ACCEPTED');return null;
  }
  sendFrame(frame) {
    if(this.state!=='CONNECTED'||this.channel?.readyState!=='open')throw new Error('No authorized open data channel');
    const encoded=JSON.stringify(frame);if(byteLength(encoded)>8192)throw new Error('Frame exceeds 8 KiB');
    if(this.channel.bufferedAmount>65536)throw new Error('Peer send buffer is full; retry after it drains');
    this.channel.send(encoded);this.bytesSent+=byteLength(encoded);
  }
  sendText(text) {
    if(typeof text!=='string'||byteLength(text)>4096||!text.length)throw new Error('Text must contain 1–4096 UTF-8 bytes');
    this.sendFrame({v:1,t:'text',id:crypto.randomUUID(),text});this.emit('TEXT_SENT',{bytes:byteLength(text)});
  }
  receive(raw) {
    if(typeof raw!=='string'||byteLength(raw)>8192)throw new Error('Invalid or oversized frame');
    if(performance.now()-this.rateStart>1000){this.rateStart=performance.now();this.rateCount=0;}
    if(++this.rateCount>120)throw new Error('Peer frame rate limit exceeded');
    const f=JSON.parse(raw);if(!f||f.v!==1||typeof f.id!=='string'||f.id.length>80)throw new Error('Invalid frame schema');
    this.bytesReceived+=byteLength(raw);
    if(f.t==='text'){
      if(typeof f.text!=='string'||!f.text.length||byteLength(f.text)>4096)throw new Error('Invalid text payload');
      this.emit('TEXT_RECEIVED',{text:f.text,bytes:byteLength(f.text)});
    }else if(f.t==='ping')this.sendFrame({v:1,t:'pong',id:f.id});
    else if(f.t==='pong'){
      if(this.pendingPing?.id===f.id){
        const p=this.pendingPing,ms=performance.now()-p.started;clearTimeout(p.timer);this.pendingPing=null;
        this.samples.push(ms);this.samples=this.samples.slice(-100);this.emit('ROUND_TRIP',{applicationRoundTripMs:ms});p.resolve(ms);
      }
    }else throw new Error('Unknown frame type');
  }
  ping() {
    if(this.pendingPing)throw new Error('A ping is already pending');
    return new Promise((resolve,reject)=>{
      const p={id:crypto.randomUUID(),started:performance.now(),resolve,reject};
      p.timer=setTimeout(()=>{this.pendingPing=null;reject(new Error('Peer round-trip timed out'));},5000);this.pendingPing=p;
      try{this.sendFrame({v:1,t:'ping',id:p.id})}catch(error){this.cancelPing(error.message)}
    });
  }
  cancelPing(reason) { if(this.pendingPing){clearTimeout(this.pendingPing.timer);this.pendingPing.reject(new Error(reason));this.pendingPing=null;} }
  async stats() {
    const pc=this.pc;if(!pc)return {state:this.state};const report=await pc.getStats();let pair;
    report.forEach(s=>{if(s.type==='transport'&&s.selectedCandidatePairId)pair=report.get(s.selectedCandidatePairId);});
    if(!pair)report.forEach(s=>{if(s.type==='candidate-pair'&&s.nominated&&s.state==='succeeded')pair=s;});
    const local=pair&&report.get(pair.localCandidateId),remote=pair&&report.get(pair.remoteCandidateId);
    return {state:this.state,connectionState:pc.connectionState,iceState:pc.iceConnectionState,dtlsState:pc.sctp?.transport?.state??null,
      selectedCandidatePair:pair?{state:pair.state,localType:local?.candidateType??null,remoteType:remote?.candidateType??null,protocol:local?.protocol??null}:null,
      bytesSent:this.bytesSent,bytesReceived:this.bytesReceived,applicationRoundTripMs:this.samples.at(-1)??null};
  }
  close(reason='operator') {
    const pc=this.pc;this.pc=null;this.cancelPing('Session closed');
    if(this.channel){this.channel.onclose=null;this.channel.onmessage=null;this.channel.close();this.channel=null;}
    if(pc){pc.onconnectionstatechange=null;pc.oniceconnectionstatechange=null;pc.ondatachannel=null;pc.close();this.state='CLOSED';this.emit('SESSION_CLOSED',{reason});}
    this.remoteId=null;this.session=null;this.offerHash=null;
  }
}
