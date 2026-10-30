/* LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.HUMAN_CONNECT
AUTHORITY: LeeWay-Standards
5WH: WHAT=Human connection browser proof; WHY=Prove simple UX drives real transport; WHO=Leeway Industries; WHERE=tests/human-connect.test.mjs; WHEN=2026-09-24; HOW=Playwright isolated contexts and mobile assertions
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.LEEWAY_PLAYWRIGHT_PATH || "playwright");
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
let server;
let browser;

try {
  server = http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://x").pathname);
      const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      const data = await fs.readFile(file);
      res.writeHead(200, {"Content-Type": {".html": "text/html", ".js": "text/javascript", ".css": "text/css"}[path.extname(file)] || "text/plain", "Cache-Control": "no-store"}).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch({headless: true, args: ["--no-sandbox"]});
  const a = await browser.newContext({viewport: {width: 390, height: 844}});
  const b = await browser.newContext({viewport: {width: 1280, height: 900}});
  const pa = await a.newPage();
  const pb = await b.newPage();
  await Promise.all([pa.goto(base + "/connect.html"), pb.goto(base + "/connect.html")]);
  for (const page of [pa, pb]) await page.waitForFunction(() => document.querySelector("#advanced-id").textContent.startsWith("lw-peer-"));
  const idA = await pa.locator("#advanced-id").textContent();
  const idB = await pb.locator("#advanced-id").textContent();

  assert.equal(await pa.locator("h1").textContent(), "Bring another device into LeeWay.");
  assert.equal(await pa.getByText("Peer ID").count(), 0);
  assert.equal(await pa.getByText("SDP").count(), 0);
  assert.equal(await pa.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);

  await pa.locator("#start").click();
  await pa.waitForFunction(() => document.querySelector("#notice").textContent.includes("Invite ready"));
  await pa.evaluate(() => { navigator.clipboard.writeText = async text => { window.__copied = text; }; });
  await pa.locator("#copy-invite").click();
  const offer = await pa.evaluate(() => window.__copied);
  assert.ok(offer.includes("signature"));

  await pb.locator("#receive").click();
  await pb.locator("#invite-input").fill(offer);
  await pb.locator("#check-invite").click();
  await pb.locator("#allow").click();
  await pb.waitForFunction(() => !document.querySelector("#error").hidden);
  assert.match(await pb.locator("#error").textContent(), /Trusted device ID/);
  await pb.locator("#trusted-peer").fill(idA);
  await pb.locator("#allow").click();
  await pb.waitForFunction(() => !document.querySelector("#return-approval").hidden);
  await pb.evaluate(() => { navigator.clipboard.writeText = async text => { window.__copied = text; }; });
  await pb.locator("#copy-approval").click();
  const answer = await pb.evaluate(() => window.__copied);
  const codeB = await pb.locator("#invite-code").textContent();
  assert.match(codeB, /^\d{3} \d{3} \d{3}$/);

  await pa.locator("#approval-input").fill(answer);
  await pa.locator("#check-approval").click();
  const codeA = await pa.locator("#approval-code").textContent();
  assert.equal(codeA, codeB);
  assert.equal(await pa.locator("#finish").isDisabled(), true);
  await pa.locator("#approval-match").check();
  await pa.locator("#finish").click();
  await pa.waitForFunction(() => !document.querySelector("#error").hidden);
  assert.match(await pa.locator("#error").textContent(), /Trusted approving device ID/);
  await pa.locator("#trusted-answer-peer").fill(idB);

  await pa.locator("#approval-input").fill(answer + " ");
  await pa.locator("#finish").click();
  await pa.waitForFunction(() => document.querySelector("#error").textContent.includes("changed after review"));
  assert.equal(await pa.locator("#advanced-state").textContent(), "OFFER_READY");

  await pa.locator("#approval-input").fill(answer);
  await pa.locator("#check-approval").click();
  await pa.locator("#approval-match").check();
  await pa.locator("#trusted-answer-peer").fill(idB);
  await pa.locator("#finish").click();
  await Promise.all([
    pa.waitForFunction(() => !document.querySelector("#connected").hidden, null, {timeout: 20000}),
    pb.waitForFunction(() => !document.querySelector("#connected").hidden, null, {timeout: 20000})
  ]);
  await pa.locator("#send-test").click();
  await pb.waitForFunction(() => document.querySelector("#message-status").textContent.includes("Message received"));
  assert.equal(await pa.locator("#advanced-state").textContent(), "CONNECTED");
  await pa.locator("details.advanced summary").focus();
  assert.equal(await pa.evaluate(() => document.activeElement === document.querySelector("details.advanced summary")), true);

  await pb.close();
  await pa.waitForFunction(() => document.querySelector("#connected").hidden && !document.querySelector("#choice").hidden, null, {timeout: 20000});
  assert.equal(await pa.locator("#advanced-state").textContent(), "CLOSED");
  assert.equal(await pa.locator("#notice").textContent(), "Connection ended. Start a fresh invite to reconnect.");
  if (process.env.LEEWAY_HUMAN_SCREENSHOT) await pa.screenshot({path: process.env.LEEWAY_HUMAN_SCREENSHOT, fullPage: true});
  console.log("PASS: human connection UI drives real transport; trusted IDs, altered approval, mobile layout, and remote-close recovery passed");
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
