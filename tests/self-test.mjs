/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.SELF
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Dependency-free core self-test; WHY=Catch path and topology regressions; WHO=Leeway Industries; WHERE=tests/self-test.mjs; WHEN=2026-09-24; HOW=Node assertions
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
import assert from"node:assert/strict";import{rankPaths}from"../src/core/path-score.js";import{FederationGraph}from"../src/core/topology.js";import{normalizeDomain,canAttach}from"../src/core/federation.js";
const ranked=rankPaths([{id:"blocked",latencyMs:1,bandwidthMbps:1000,authorized:false,healthy:true},{id:"allowed",latencyMs:10,bandwidthMbps:100,authorized:true,healthy:true}]);assert.equal(ranked[0].id,"allowed");assert.equal(Number.isFinite(ranked.at(-1).score),false);
const g=new FederationGraph().addDomain({id:"a"}).addDomain({id:"b"}).connect({from:"a",to:"b"});assert.equal(g.snapshot().edges.length,1);
const d=normalizeDomain({id:"mesh-a",authenticated:true,authorized:true,policyAccepted:true});assert.equal(canAttach(d),true);assert.equal(d.state,"AUTHORIZED");
console.log("PASS: Federate Web dependency-free core self-test");
