/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.DOCS.VERITAS_TEST_PLAN
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federate Web acceptance tests; WHY=Define evidence required before claims advance; WHO=Leeway Industries; WHERE=docs/VERITAS-TEST-PLAN.md; WHEN=2026-09-24; HOW=Gate-by-gate tests and receipts
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
# Veritas Test Plan

## Browser gate
- page loads with no framework dependency
- identity persists across reload
- identity rotation creates a new ID
- synthetic lab blocks unauthorized path
- receipts record lab runs
- service worker registers where supported

## Federation gates
1. Two independently controlled nodes exchange authenticated descriptors.
2. Three nodes maintain service reachability after one disappears.
3. One persistent relay is not LeeWay-owned.
4. Resource permission can be revoked and consumption stops.
5. Two different network domains federate without Layer-2 merge.
6. Content survives original-host shutdown.
7. GitHub/bootstrap shutdown does not terminate established service.
8. Hostinger/bootstrap shutdown does not terminate established service.

## Formula gate
No PASS until canonical Formula hash, real execution, baseline comparison, repeated measurements, and post-gate Veritas evidence exist.

## Receipt law
A receipt records only the executed event. Planned gates are not receipts.
