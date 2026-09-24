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