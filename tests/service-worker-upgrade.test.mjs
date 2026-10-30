/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.TESTS.SERVICE_WORKER_UPGRADE
AUTHORITY: LeeWay-Standards
5WH: WHAT=Service-worker upgrade delivery contract proof; WHY=Refresh legacy open pages onto reviewed code; WHO=Leeway Industries; WHERE=tests/service-worker-upgrade.test.mjs; WHEN=2026-10-30; HOW=Static source contract test
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const source = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");
assert.match(source, /includeUncontrolled:true/);
assert.match(source, /clients\.claim\(\)/);
assert.match(source, /open\[i\]\.navigate\(open\[i\]\.url\)/);
assert.match(source, /leeway-federate-web-v4-reviewed-pairing/);
assert.match(await readFile(new URL("../src/service-worker-client.js", import.meta.url), "utf8"), /LEEWAY_CHECK_CLIENT/);
assert.match(await readFile(new URL("../index.html", import.meta.url), "utf8"), /service-worker-client\.js/);
console.log("PASS: service-worker upgrade enumerates and navigates legacy open pages");
