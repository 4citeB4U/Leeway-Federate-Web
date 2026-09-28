/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.SELF
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Dependency-free core self-test; WHY=Catch path/topology/authority regressions; WHO=Leeway Industries; WHERE=tests/self-test.mjs; WHEN=2026-09-28; HOW=Node assertions
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
import assert from"node:assert/strict";
import{rankPaths}from"../src/core/path-score.js";
import{FederationGraph}from"../src/core/topology.js";
import{normalizeDomain,canAttach}from"../src/core/federation.js";
import{ECOSYSTEM,projectAuthorities}from"../src/config/ecosystem.js";
const ranked=rankPaths([{id:"blocked",latencyMs:1,bandwidthMbps:1000,authorized:false,healthy:true},{id:"allowed",latencyMs:10,bandwidthMbps:100,authorized:true,healthy:true}]);
assert.equal(ranked[0].id,"allowed");
assert.equal(Number.isFinite(ranked.at(-1).score),false);
const g=new FederationGraph().addDomain({id:"a"}).addDomain({id:"b"}).connect({from:"a",to:"b"});
assert.equal(g.snapshot().edges.length,1);
const d=normalizeDomain({id:"mesh-a",authenticated:true,authorized:true,policyAccepted:true});
assert.equal(canAttach(d),true);
assert.equal(d.state,"AUTHORIZED");
assert.ok(ECOSYSTEM.length>=10,"Canonical ecosystem projection should include core and flagship application surfaces");
assert.equal(ECOSYSTEM.some(x=>x.id==="recovery-20260925"),false);
assert.equal(ECOSYSTEM.find(x=>x.id==="runtime-fabric")?.repoFullName,"4citeB4U/Leeway-Runtime-Fabric");
assert.equal(ECOSYSTEM.find(x=>x.id==="formula")?.approvedCommit,"7fae63185a4cbd4dd631ba13114e4d27accba52b");
assert.throws(()=>projectAuthorities({registryId:"WRONG",authorities:[]}),/REGISTRY_ID_INVALID/);
console.log("PASS: Federate Web dependency-free core + canonical authority self-test");
