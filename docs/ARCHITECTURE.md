/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.DOCS.ARCHITECTURE
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federate Web architecture specification; WHY=Define one federation plane above independent networks; WHO=Leeway Industries; WHERE=docs/ARCHITECTURE.md; WHEN=2026-09-24; HOW=Layered architecture and boundaries
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
# Architecture

LeeWay Federate Web is a **federation capability**, not a new sovereign brain.

## Node classes
- **LW-WEB** — browser/PWA participant; no privileged OS-routing claims.
- **LW-EDGE** — persistent authorized machine adapter with local networking capability.
- **LW-FED** — governed gateway importing/exporting permitted routes or services from another domain.

## Federation model
Each external network remains a separate domain `G_i`. LeeWay imports only a governed summary `D_i = Φ(G_i)`. The federation graph is `F=(D,E_F)`. LeeWay MUST NOT collapse all participants into one unrestricted Layer-2 broadcast domain.

## Authority path
Human Authority → LeeWay Standards → Runtime Fabric → Veritas pre-gate → Federate capability → authorized adapter → execution → Veritas post-gate → receipt.

## Bootstrap
GitHub Pages, Hostinger, and community nodes may distribute bootstrap descriptors. None of them becomes authority.

## Resource contribution
Future persistent peers must expose signed, revocable resource offers describing bandwidth, storage, relay, compute, policy, quotas, expiry, and health evidence.