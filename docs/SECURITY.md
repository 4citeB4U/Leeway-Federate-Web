/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.DOCS.SECURITY
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federate Web security model; WHY=Prevent autonomous federation from becoming autonomous compromise; WHO=Leeway Industries; WHERE=docs/SECURITY.md; WHEN=2026-09-24; HOW=Threat model and deny-by-default controls
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
# Security Model

## Threats
Sybil nodes, forged telemetry, route poisoning, relay abuse, content poisoning, stale topology, bootstrap compromise, resource over-consumption, accidental private-route export, and supply-chain compromise.

## Controls
- deny attachment until authentication + authorization + policy acceptance
- signed descriptors for persistent federation
- quotas and expiry on resource offers
- revocation support
- content hash verification
- route/service allowlists
- no implicit Layer-2 federation
- separate discovery state from trust state
- receipts for executed mutations
- bootstrap source is never Root of Trust

## Browser limitations
LW-WEB cannot claim kernel routing, raw socket access, native WireGuard/BGP/OSPF, physical radio control, or 24/7 daemon persistence. Those require governed LW-EDGE/LW-FED adapters.
