# Third-Party Boundary

This repository currently vendors **no third-party runtime library**.

The architecture may later integrate standards or software such as WebRTC, libp2p, WireGuard, Yggdrasil, Babel, OSPF/FRRouting, or SCION concepts. Their code, names, trademarks, and licenses remain their owners'. Any vendored dependency must preserve required notices and appear in a machine-readable dependency manifest.

LeeWay's authored layer is the governed federation, resource contribution model, topology abstraction, Formula adapter boundary, service mobility, authority gates, Veritas integration, and receipt model.

Browser qualification uses Playwright 1.63.0 as an optional development-only test tool under its upstream Apache-2.0 license. It is installed outside the repository tree on CI and is not bundled into the deployed application.
