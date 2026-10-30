/* LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.REPLAY_CONCURRENCY
AUTHORITY: LeeWay-Standards
5WH: WHAT=Cross-tab replay reservation proof; WHY=Reject concurrent reuse of one offer; WHO=Leeway Industries; WHERE=tests/replay-concurrency.test.mjs; WHEN=2026-10-30; HOW=Serialized Web Locks contract test
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */
import assert from "node:assert/strict";
import { PeerSession } from "../src/core/peer-session.js";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value))
};
let tail = Promise.resolve();
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {
  locks: {
    request: (_name, _options, callback) => {
      const run = tail.then(callback);
      tail = run.catch(() => {});
      return run;
    }
  }
}});

const identity = {id: "lw-peer-" + "2".repeat(64)};
const hash = "b".repeat(64);
const first = new PeerSession(identity);
const second = new PeerSession(identity);
const results = await Promise.allSettled([first.reserveOffer(hash), second.reserveOffer(hash)]);
assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
assert.equal(results.filter(result => result.status === "rejected").length, 1);
assert.match(results.find(result => result.status === "rejected").reason.message, /already consumed/);
console.log("PASS: concurrent cross-tab replay reservation admits exactly one consumer");
