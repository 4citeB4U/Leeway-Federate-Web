/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.PAIRING
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee; CI test runner
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Pairing protocol negative and cryptographic tests
WHY = Reject invalid or unauthorized input before a real transport is installed
WHO = Leeway Industries / Agent Lee
WHERE = tests/peer-core.test.mjs
WHEN = 2026-09-24
HOW = Node native test runner and WebCrypto; SDP fixtures are not transport proof
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md)
*/
import test from 'node:test';
import assert from 'node:assert/strict';
import {createSigningRecord,identityFromRecord} from '../src/core/identity.js';
import {signPairing,inspectPairing,authorizePairing,TTL_MS} from '../src/core/pairing.js';
const record=await createSigningRecord();
const a=await identityFromRecord(record),b=await identityFromRecord(await createSigningRecord());
const fields={type:'offer',session:crypto.randomUUID(),sdp:'v=0\r\nm=application 9 UDP/DTLS/SCTP webrtc-datachannel\r\na=fingerprint:sha-256 AA:BB\r\n'};
const now=Date.now(),offer=await signPairing(a,fields,now);
test('peer IDs identify different public keys',()=>assert.notEqual(a.id,b.id));
test('private key is not exportable',async()=>{
  assert.equal(record.privateKey.extractable,false);
  await assert.rejects(crypto.subtle.exportKey('pkcs8',record.privateKey));
});
test('signed package verifies with stable payload hash',async()=>{
  const v=await inspectPairing(offer.text,now);assert.equal(v.hash,offer.hash);assert.equal(v.payload.from,a.id);
});
test('explicit consent plus expected full peer ID is required',async()=>{
  const v=await inspectPairing(offer.text,now);
  assert.throws(()=>authorizePairing(v,a.id,false),/consent/);
  assert.throws(()=>authorizePairing(v,a.id,'true'),/consent/);
  assert.throws(()=>authorizePairing(v,'',true),/full peer ID/);
  assert.throws(()=>authorizePairing(v,b.id,true),/does not match/);
  assert.equal(authorizePairing(v,a.id,true),true);
});
test('modified SDP is rejected by signature',async()=>{
  const o=JSON.parse(offer.text);o.payload.sdp+='a=ice-ufrag:tampered\r\n';
  await assert.rejects(inspectPairing(JSON.stringify(o),now),/signature/);
});
test('modified signature is rejected',async()=>{
  const o=JSON.parse(offer.text);o.signature=(o.signature[0]==='A'?'B':'A')+o.signature.slice(1);
  await assert.rejects(inspectPairing(JSON.stringify(o),now),/signature/);
});
test('unknown payload fields are rejected',async()=>{
  const o=JSON.parse(offer.text);o.payload.command='no-execution';
  await assert.rejects(inspectPairing(JSON.stringify(o),now),/fields/);
});
test('expired and future-dated signed offers are rejected',async()=>{
  const expired=await signPairing(a,fields,now-TTL_MS-1),future=await signPairing(a,fields,now+30001);
  await assert.rejects(inspectPairing(expired.text,now),/clock window/);
  await assert.rejects(inspectPairing(future.text,now),/clock window/);
});
test('payload size and malformed envelope are rejected',async()=>{
  await assert.rejects(inspectPairing('x'.repeat(65537)),/64 KiB/);
  await assert.rejects(inspectPairing('{'),/JSON/);
  await assert.rejects(inspectPairing('null'),/envelope/);
});
test('claimed peer identity must match the public key',async()=>{
  const o=JSON.parse(offer.text);o.payload.from=b.id;
  await assert.rejects(inspectPairing(JSON.stringify(o),now),/hash mismatch/);
});
test('media SDP is not permitted',async()=>{
  const o=await signPairing(a,{...fields,sdp:fields.sdp+'m=audio 9 UDP/TLS/RTP/SAVPF 111\r\n'},now);
  await assert.rejects(inspectPairing(o.text,now),/single DTLS/);
});
test('answer has target and original-offer binding',async()=>{
  const answer=await signPairing(b,{type:'answer',session:fields.session,to:a.id,offerHash:offer.hash,sdp:fields.sdp},now);
  const verified=await inspectPairing(answer.text,now);assert.equal(verified.payload.to,a.id);assert.equal(verified.payload.offerHash,offer.hash);
  const bad=await signPairing(b,{type:'answer',session:fields.session,sdp:fields.sdp},now);
  await assert.rejects(inspectPairing(bad.text,now),/answer binding/);
});
