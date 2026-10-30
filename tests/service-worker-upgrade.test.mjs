/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.TESTS.SERVICE_WORKER_UPGRADE
AUTHORITY: LeeWay-Standards
5WH: WHAT=Service-worker upgrade delivery contract proof; WHY=Refresh legacy open pages onto reviewed code; WHO=Leeway Industries; WHERE=tests/service-worker-upgrade.test.mjs; WHEN=2026-10-30; HOW=Static source contract test
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");
assert.match(source, /clients\.claim\(\)/);
assert.doesNotMatch(source, /\.navigate\(/);
assert.match(source, /leeway-federate-web-v4-reviewed-pairing/);
assert.match(await readFile(new URL("../src/service-worker-client.js", import.meta.url), "utf8"), /next navigation/);
assert.match(await readFile(new URL("../index.html", import.meta.url), "utf8"), /service-worker-client\.js/);

const listeners = {};
let claimed = false;
let deleted = false;
let navigated = false;
const context = vm.createContext({
  URL,
  self: {
    registration: {scope: "https://example.test/Leeway-Federate-Web/"},
    addEventListener: (name, handler) => {listeners[name] = handler},
    clients: {
      claim: async () => {claimed = true},
      matchAll: async () => [{navigate: () => {navigated = true}}]
    }
  },
  caches: {
    keys: async () => ["leeway-federate-web-v3-human-connect"],
    delete: async () => {deleted = true},
    open: async () => ({addAll: async () => {}})
  },
  setTimeout,
  fetch: async () => new Response("ok")
});
vm.runInContext(source, context);
const activation = {promise: null, waitUntil(promise) {this.promise = promise}};
listeners.activate(activation);
await activation.promise;
assert.equal(claimed, true);
assert.equal(deleted, true);
assert.equal(navigated, false);
console.log("PASS: service-worker activation preserves active pages and claims the repaired worker");
