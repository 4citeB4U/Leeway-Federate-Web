/* LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.REPLAY_PERSISTENCE
AUTHORITY: LeeWay-Standards
5WH: WHAT=Bounded browser-local replay reservation proof; WHY=Preserve offer-consumption state across reloads/tabs; WHO=Leeway Industries; WHERE=tests/replay-persistence.test.mjs; WHEN=2026-10-30; HOW=In-memory localStorage contract test
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY */
import assert from "node:assert/strict";
import { PeerSession } from "../src/core/peer-session.js";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value))
};
Object.defineProperty(globalThis, "navigator", {configurable: true, value: {
  locks: {request: async (_name, _options, callback) => callback()}
}});

const identity = {id: "lw-peer-" + "1".repeat(64)};
const hash = "a".repeat(64);
const first = new PeerSession(identity);
await first.reserveOffer(hash);
const second = new PeerSession(identity);
assert.equal(second.usedOffers.has(hash), true);
assert.equal(JSON.parse(values.get("leeway-federate-used-offers-v1")).length, 1);
console.log("PASS: consumed offer reservation survives a new PeerSession instance");
