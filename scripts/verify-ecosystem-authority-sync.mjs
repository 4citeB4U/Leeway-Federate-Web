#!/usr/bin/env node
import assert from"node:assert/strict";
import{AUTHORITY_REGISTRY_URL,ECOSYSTEM,projectAuthorities}from"../src/config/ecosystem.js";
const response=await fetch(AUTHORITY_REGISTRY_URL,{cache:"no-store"});
assert.equal(response.ok,true,"Canonical Standards registry must be reachable during federation qualification");
const registry=await response.json();
assert.equal(registry.registryId,"LEEWAY_ECOSYSTEM_AUTHORITY_V1");
const projected=projectAuthorities(registry);
assert.deepEqual(projected,ECOSYSTEM,"Federate snapshot drifted from Standards registry");
assert.ok(projected.some(x=>x.id==="runtime-fabric"&&x.repoFullName==="4citeB4U/Leeway-Runtime-Fabric"));
assert.ok(projected.some(x=>x.id==="leeway-os"&&x.repoFullName==="4citeB4U/leeway-ecosystemv2.14"));
assert.ok(!projected.some(x=>x.id==="recovery-20260925"),"Recovery evidence must not project as a public executable authority");
console.log(JSON.stringify({state:"PASS_CANONICAL_ECOSYSTEM_DISCOVERY",registryId:registry.registryId,projectedAuthorities:projected.length,runtime:"4citeB4U/Leeway-Runtime-Fabric",os:"4citeB4U/leeway-ecosystemv2.14"},null,2));
