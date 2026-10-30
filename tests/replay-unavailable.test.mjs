/* LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.REPLAY_UNAVAILABLE
AUTHORITY: LeeWay-Standards
5WH: WHAT=Fail-closed replay proof; WHY=Prevent cross-tab acceptance without durable coordination; WHO=Leeway Industries; WHERE=tests/replay-unavailable.test.mjs; WHEN=2026-10-30; HOW=Unavailable storage contract test
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */
import assert from "node:assert/strict";
import {PeerSession} from "../src/core/peer-session.js";

Object.defineProperty(globalThis, "navigator", {configurable: true, value: {locks: {request: async (_name, _options, callback) => callback()}}});
const identity = {id: "lw-peer-" + "3".repeat(64)};
const session = new PeerSession(identity);
await assert.rejects(() => session.reserveOffer("c".repeat(64)), /storage unavailable/);
console.log("PASS: replay reservation fails closed when durable storage is unavailable");
