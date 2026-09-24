/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.REGISTRY
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federation domain registry; WHY=Normalize external domains without claiming ownership; WHO=Leeway Industries; WHERE=src/core/federation.js; WHEN=2026-09-24; HOW=Policy-gated descriptors
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
export const STATES=Object.freeze(["DISCOVERED","AUTHENTICATED","AUTHORIZED","ATTACHED","DEGRADED","REVOKED"]);export function canAttach(d){return Boolean(d?.authenticated&&d?.authorized&&d?.policyAccepted)}export function normalizeDomain(input){return{id:String(input.id),kind:input.kind||"unknown",operator:input.operator||"unknown",authenticated:Boolean(input.authenticated),authorized:Boolean(input.authorized),policyAccepted:Boolean(input.policyAccepted),state:canAttach(input)?"AUTHORIZED":"DISCOVERED",transports:[...(input.transports||[])],exportedServices:[...(input.exportedServices||[])]}}