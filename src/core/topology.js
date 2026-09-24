/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TOPOLOGY
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Federation graph; WHY=Represent domains without Layer-2 collapse; WHO=Leeway Industries; WHERE=src/core/topology.js; WHEN=2026-09-24; HOW=Domain and edge graph
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
export class FederationGraph{constructor(){this.domains=new Map();this.edges=[]}addDomain(d){if(!d?.id)throw new Error("domain.id required");this.domains.set(d.id,{...d});return this}connect(e){if(!this.domains.has(e.from)||!this.domains.has(e.to))throw new Error("edge endpoints must exist");this.edges.push({...e});return this}snapshot(){return{domains:[...this.domains.values()],edges:this.edges.map(e=>({...e}))}}}