# Human Connection Experience

## Product law

The ordinary user must not need to understand peer IDs, SDP, ICE, DTLS, NAT, offers, answers, routing tables, or Formula internals to connect a device.

The public workflow is:

```text
Connect another device
→ send private invite
→ other device allows
→ return approval
→ compare safety code
→ Connected
```

The underlying engineering console remains at `peer.html` under **Advanced network diagnostics**.

## Why an invite still exists

A static GitHub Pages application has no always-running signaling service. WebRTC requires signaling but does not mandate how signaling is transported. The current no-service proof therefore uses a private invite/approval exchange. This is an intentional sovereignty tradeoff, not the final discovery experience.

Future LW-EDGE/LW-FED or an authorized decentralized rendezvous layer may replace the invite exchange with automatic discovery. It must preserve explicit authorization and must not silently introduce a mandatory third-party cloud.

## Safety code

The simple UI derives a short symmetric code from both cryptographic peer IDs and the session ID. Both devices must display the same code. Comparing it out-of-band makes the user confirm that the approval belongs to the intended peer without exposing full cryptographic identifiers.

The safety code is a human verification aid, not a replacement for LeeWay Root-of-Trust authorization.

## Progressive enhancement

Native Web Share is used when supported. Clipboard is the fallback. The connection workflow itself does not depend on Web Share.

## Accessibility and responsive contract

- semantic headings, labels, status/alert regions and native controls;
- keyboard-operable without drag gestures;
- touch-sized primary actions;
- no essential meaning conveyed by color alone;
- reduced-motion preference honored;
- mobile-first reflow at narrow widths;
- advanced technical values remain available without polluting the primary task.

## Evidence boundary

A beautiful interface is not proof of transport. Playwright must prove the public workflow while the existing peer tests continue proving the underlying WebRTC channel.
