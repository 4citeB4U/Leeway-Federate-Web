#!/usr/bin/env node
import assert from "node:assert/strict";
import { AUTHORITY_REGISTRY_URL, ECOSYSTEM, projectAuthorities } from "../src/config/ecosystem.js";
import { SNAPSHOT_META } from "../src/config/ecosystem-authority.snapshot.js";

const immutableUrl =
  "https://raw.githubusercontent.com/" +
  SNAPSHOT_META.sourceRepo +
  "/" +
  SNAPSHOT_META.sourceMergeCommit +
  "/" +
  SNAPSHOT_META.sourcePath;

const response = await fetch(immutableUrl, { cache: "no-store" });
assert.equal(response.ok, true, "Immutable Standards registry source must be reachable during federation qualification");

const registry = await response.json();
assert.equal(registry.registryId, "LEEWAY_ECOSYSTEM_AUTHORITY_V1");
const projected = projectAuthorities(registry);
assert.deepEqual(projected, ECOSYSTEM, "Federate snapshot drifted from its immutable Standards source");

assert.ok(projected.some((x) => x.id === "runtime-fabric" && x.repoFullName === "4citeB4U/Leeway-Runtime-Fabric"));
assert.ok(projected.some((x) => x.id === "leeway-os" && x.repoFullName === "4citeB4U/leeway-ecosystemv2.14"));
assert.ok(!projected.some((x) => x.id === "recovery-20260925"), "Recovery evidence must not project as a public executable authority");

let liveMainFresh = null;
let liveMainError = null;
try {
  const live = await fetch(AUTHORITY_REGISTRY_URL + "?qualification=" + Date.now(), { cache: "no-store" });
  if (live.ok) {
    const liveRegistry = await live.json();
    liveMainFresh =
      liveRegistry.registryId === registry.registryId &&
      JSON.stringify(projectAuthorities(liveRegistry)) === JSON.stringify(projected);
  } else {
    liveMainError = "HTTP_" + live.status;
  }
} catch (error) {
  liveMainError = String(error?.message || error);
}

console.log(JSON.stringify({
  state: "PASS_CANONICAL_ECOSYSTEM_DISCOVERY",
  registryId: registry.registryId,
  immutableSourceCommit: SNAPSHOT_META.sourceMergeCommit,
  immutableSourceBlob: SNAPSHOT_META.sourceBlobSha,
  projectedAuthorities: projected.length,
  runtime: "4citeB4U/Leeway-Runtime-Fabric",
  os: "4citeB4U/leeway-ecosystemv2.14",
  liveMainFresh,
  liveMainError,
  truthBoundary: "Immutable snapshot qualification is authoritative; moving main discovery may be temporarily CDN-stale."
}, null, 2));
