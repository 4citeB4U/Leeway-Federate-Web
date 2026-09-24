/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.DOCS.PROTOCOL
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federation protocol contract; WHY=Define safe discovery-to-attachment lifecycle; WHO=Leeway Industries; WHERE=docs/FEDERATION-PROTOCOL.md; WHEN=2026-09-24; HOW=State machine and domain descriptors
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
# Federation Protocol v0.1

## Lifecycle
```text
DISCOVERED → IDENTIFIED → AUTHENTICATED → AUTHORIZED → NEGOTIATED → ATTACHED → VERIFIED
```
A domain may transition to `DEGRADED` or `REVOKED` at any point.

## Non-negotiable rule
**Discovery never grants permission.**

## Minimum domain descriptor
- stable domain ID
- operator identity and signature
- supported transports
- exported services/routes
- policy and quotas
- expiry
- health evidence
- revocation mechanism

## Translation boundary
Adapters may normalize Babel, OSPF, BGP, Yggdrasil, WireGuard, libp2p, WebRTC, Ethernet, Wi-Fi, or future transports into LeeWay's common model, but do not transfer ownership of the underlying network.

## Namespace
LeeWay-native services may use `lee://service`. A future private `.lee` resolver may map human-readable names to service identities. Public Internet availability still requires a globally resolvable gateway/domain unless `.lee` becomes globally delegated.
