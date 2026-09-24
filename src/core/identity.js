/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.IDENTITY
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Browser-local node identity; WHY=Decouple identity from IP address; WHO=Leeway Industries; WHERE=src/core/identity.js; WHEN=2026-09-24; HOW=Persistent random local ID
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
const KEY="leeway-federate-node-id-v1";export function getNodeIdentity(){let id=localStorage.getItem(KEY);if(!id){id="lw-web-"+crypto.randomUUID();localStorage.setItem(KEY,id)}return{id,class:"LW-WEB",persistence:"browser-local",proof:"UNVERIFIED_CRYPTOGRAPHIC_IDENTITY"}}export function rotateNodeIdentity(){localStorage.removeItem(KEY);return getNodeIdentity()}

/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.IDENTITY.CRYPTO
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee under Creator-approved scope
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Add peer signing keys while retaining the v1 display identity API
WHY = Prove the bounded browser-to-browser transport gate without duplicating Runtime Fabric
WHO = Leeway Industries / Agent Lee System Engineer
WHERE = src/core/identity.js
WHEN = 2026-09-24
HOW = Native WebCrypto P-256; non-extractable private key in namespaced IndexedDB
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md)
*/

export function toBase64URL(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
export function fromBase64URL(text) {
  if (typeof text !== 'string' || text.length > 256 || !/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('Invalid key/signature encoding');
  return Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}
export async function sha256Hex(bytes) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
}
export async function createSigningRecord() {
  return crypto.subtle.generateKey({name:'ECDSA', namedCurve:'P-256'}, false, ['sign','verify']);
}
export async function identityFromRecord(record, persistence='session-only') {
  const publicBytes = await crypto.subtle.exportKey('spki', record.publicKey);
  return Object.freeze({
    id: 'lw-peer-' + await sha256Hex(publicBytes), publicKey:toBase64URL(publicBytes), persistence,
    sign: async bytes => toBase64URL(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},record.privateKey,bytes))
  });
}
let peerIdentityPromise;
export function getPeerIdentity() {
  // The v1 UUID is a display ID, not a cryptographic credential. Do not reinterpret it.
  if (!peerIdentityPromise) peerIdentityPromise = loadPeerIdentity().catch(error => {peerIdentityPromise=null;throw error;});
  return peerIdentityPromise;
}
async function loadPeerIdentity() {
  if (!globalThis.isSecureContext || !globalThis.indexedDB || !crypto.subtle) throw new Error('HTTPS/localhost, IndexedDB and WebCrypto are required');
  const db = await new Promise((resolve,reject) => {
    const r=indexedDB.open('leeway-federate-peer-v1',1);
    r.onupgradeneeded=()=>r.result.createObjectStore('keys');
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
    r.onblocked=()=>reject(new Error('Peer identity database blocked by another tab'));
  });
  try {
    const existing=await new Promise((resolve,reject)=>{
      const r=db.transaction('keys','readonly').objectStore('keys').get('identity');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    let record=existing;
    if (!record) {
      const generated=await createSigningRecord();
      // Serialize first creation so concurrent tabs cannot overwrite each other's identity.
      record=await new Promise((resolve,reject)=>{
        const tx=db.transaction('keys','readwrite'),store=tx.objectStore('keys');
        let selected;const r=store.get('identity');
        r.onsuccess=()=>{selected=r.result||generated;if(!r.result)store.put(selected,'identity');};
        tx.oncomplete=()=>resolve(selected);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Identity storage aborted'));
      });
    }
    return await identityFromRecord(record,'indexeddb-nonextractable-private-key');
  } finally { db.close(); }
}
