/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.PATH_SCORE
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Deterministic baseline path scorer; WHY=Transparent baseline before Formula integration; WHO=Leeway Industries; WHERE=src/core/path-score.js; WHEN=2026-09-24; HOW=Weighted normalized cost
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
export const DEFAULT_WEIGHTS=Object.freeze({latency:.30,jitter:.10,loss:.20,queue:.15,utilization:.10,inverseBandwidth:.15});
export function scorePath(path,weights=DEFAULT_WEIGHTS){if(!path.authorized||!path.healthy)return Number.POSITIVE_INFINITY;const b=Math.max(Number(path.bandwidthMbps)||0,.001);return weights.latency*Number(path.latencyMs||0)+weights.jitter*Number(path.jitterMs||0)+weights.loss*Number(path.lossPct||0)*10+weights.queue*Number(path.queueMs||0)+weights.utilization*Number(path.utilizationPct||0)/10+weights.inverseBandwidth*(100/b)}
export function rankPaths(paths,weights){return paths.map(path=>({...path,score:scorePath(path,weights)})).sort((a,b)=>a.score-b.score)}