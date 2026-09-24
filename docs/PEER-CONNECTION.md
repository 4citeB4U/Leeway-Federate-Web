<!--
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.DOCS.PEER_CONNECTION
AUTHORITY: LeeWay-Standards
AUTHORIZED_ROLES: Creator; Agent Lee within browser transport scope
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH:
WHAT = Manual peer capability and evidence boundary
WHY = Make the first real data-channel gate reproducible without overstating federation
WHO = Leeway Industries / Agent Lee
WHERE = docs/PEER-CONNECTION.md
WHEN = 2026-09-24
HOW = Source, protocol limits, tests, and rollback instructions
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md)
-->
# First real browser peer path

Open `peer.html` from the existing Federate Web website. This is a data-only browser capability, not a second Runtime Fabric or a VPN. Existing ecosystem links are retained; links are not proof of live Device Bridge/Agent Skills execution.

## Operator workflow

1. Open the page on two permitted devices or independent browser profiles. Exchange the **full** `lw-peer-…` IDs over a trusted channel. Two ordinary tabs in one profile share a key and are not independent peers.
2. A creates an offer; B pastes it and inspects its signature. B enters A's independently obtained ID and explicitly consents, then accepts the offer.
3. B sends the generated answer back. A enters B's trusted ID, explicitly consents, and accepts the answer.
4. When both show CONNECTED, exchange text, measure round trip, inspect transport statistics, and export receipts.
5. Disconnect. To reconnect, exchange a fresh offer and answer.

No camera, microphone, hosted API, public signaling service, STUN, or TURN is selected. This first path is intentionally direct-only. NAT, CGNAT, client isolation, and firewalls may prevent communication between devices. A shared Wi-Fi network does not guarantee reachability. The next device gate must test this instead of assuming it.

## Key and consent boundary

Native WebCrypto generates P-256 ECDSA keys. The non-extractable private key is persisted in this project's named IndexedDB database. The `lw-peer-` ID is SHA-256 of the SPKI-encoded public key. The v1 random display ID remains available through its original API; it is not silently promoted to a credential.

Offer/answer payloads bind the session ID, type, origin peer, recipient (answer), original-offer hash (answer), issuance/expiry, public key, and full SDP. The payload is signed over a fixed ordered serialization. Packages expire after ten minutes. A new connection cannot be installed without explicit consent and an exact match to a peer ID supplied by the operator.

A self-signature proves key possession, **not** real-world identity, domain ownership, or LeeWay Root-of-Trust authorization. Checking a key copied only from an untrusted package is insufficient. Same-origin malicious JavaScript can use stored signing keys even if they are non-extractable. Different GitHub Pages project paths under the same account share an origin; a dedicated origin remains a production hardening gate.

Replay rejection covers consumed offers during a page lifetime. Answer binding requires a current pending offer. This is not a network-wide or durable revocation/anti-replay system. There is no bootstrap root-key pin or native Runtime Fabric authorization in this probe.

## Data and evidence boundaries

Only text, ping, and pong frames are handled; there is no remote code execution or route installation. Text is capped at 4096 UTF-8 bytes, a frame at 8192 bytes, send buffering at 64 KiB before backpressure rejection, and incoming frame rate at 120 per second. UI transcript length is bounded. Incoming text is rendered as text, never as HTML.

Packages can include local network candidate addresses and must not be posted publicly. Exported local receipts exclude SDP, message content, and private keys. The existing receipt store is a bounded local activity log: editable browser storage, not an immutable ledger or a canonical Veritas attestation.

The measured application round trip is `performance.now()` at matched pong receipt minus the time before the ping send. It includes browser scheduling and protocol overhead. It is not one-way latency, physical latency, or evidence of Formula acceleration.

## Qualification

- `node tests/self-test.mjs` preserves the original core regression.
- `node --test tests/peer-core.test.mjs` exercises cryptography, validation, consent, identity pins, expiry, tampering, and answer binding.
- `node tests/peer-browser.test.mjs` runs real WebRTC in two isolated Chromium contexts. It requires the optional Playwright test tool, not a production dependency. `LEEWAY_PLAYWRIGHT_PATH` may identify an already authorized installation. `LEEWAY_CHROMIUM_PATH` may identify an authorized browser.
- `LEEWAY_TEST_RECEIPT` chooses the JSON result path; `LEEWAY_SCREENSHOT` optionally records the actual final UI.
- GitHub workflow `Peer transport proof` installs an explicitly pinned Playwright 1.63.0 in the temporary runner directory and executes the browser test twice. Read its artifacts to determine PASS or FAIL; a workflow file is not test evidence.

The browser test verifies consent/tampering rejection, independent context identities, persistent keys, real two-way messages, DTLS/ICE state, measured RTTs, disconnect, stale-offer rejection, and fresh manual reconnection after the local HTTP bootstrap server stops. The pages are already loaded. This does **not** establish cold-start availability, two independently owned machines, WAN connectivity, alternate meshes, relay operation, or provider-independent distributed hosting.

Local verification initially encountered `ERR_BLOCKED_BY_ADMINISTRATOR`: the managed test browser's URLBlocklist and non-proxied UDP policy prevented execution. Those controls were not modified. Core tests passed; browser qualification was moved to the authorized GitHub runner. The raw failure remains in the execution handoff, not relabeled as a success.

## Authority and rollback

Baseline: commit `90a81dc21c0025b69aff0e4c4a0f9113cd31d0fc`, deployed artifact 10824982981, SHA-256 `53b366f14bbbe27c35b599b9e0411176e87dfc17d55cd7216c8608b9a21065dd`.

Changes are limited to this repository. No host routes, radios, community infrastructure, native Device Bridge, Formula, Runtime Fabric, or Learning Ledger are modified. Formula evaluator remains UNEXPOSED; Formula execution remains NOT_EXECUTED. A normal revert of the peer-capability commit restores the previous source; redeploy and allow the service-worker update to activate. Never rewrite history or delete unrelated project caches.

## Primary references

- WebRTC API: https://www.w3.org/TR/webrtc/
- Browser data channels: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels
- WebRTC signaling: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling
- Browser CI: https://playwright.dev/docs/ci
- Pinned test release: https://github.com/microsoft/playwright/releases/tag/v1.63.0

No source from the private RTC reference was copied into this public project. Native browser APIs provide the transport; no vendor protocol implementation is renamed as LeeWay.
