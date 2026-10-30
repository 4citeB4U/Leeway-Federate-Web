/* LEEWAY HEADER — DO NOT REMOVE
REGION: CORE
TAG: CORE.FEDERATE.TESTS.HUMAN_CONNECT_NEGATIVE
AUTHORITY: LeeWay-Standards
5WH: WHAT=Negative and unexpected-close browser proof; WHY=Exercise trust and recovery boundaries; WHO=Leeway Industries; WHERE=tests/human-connect-negative.test.mjs; WHEN=2026-10-30; HOW=Two isolated Chromium contexts with real WebRTC data transport
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

  await pa.locator("#start").click();
  await pa.waitForFunction(() => document.querySelector("#notice").textContent.includes("Invite ready"));
  await pa.evaluate(() => { navigator.clipboard.writeText = async text => { window.__copied = text; }; });
  await pa.locator("#copy-invite").click();
  const offer = await pa.evaluate(() => window.__copied);
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

  await pa.locator("#approval-input").fill(answer);
  await pa.locator("#check-approval").click();
  await pa.locator("#approval-match").check();
  await pa.locator("#finish").click();
  await pa.waitForFunction(() => !document.querySelector("#error").hidden);
  assert.match(await pa.locator("#error").textContent(), /Trusted approving device ID/);
  await pa.locator("#trusted-answer-peer").fill(idB);
  await pa.locator("#finish").click();
  await Promise.all([pa.waitForFunction(() => !document.querySelector("#connected").hidden, null, {timeout: 20000}), pb.waitForFunction(() => !document.querySelector("#connected").hidden, null, {timeout: 20000})]);
  assert.equal(await pa.locator("#advanced-state").textContent(), "CONNECTED");

  await pb.close();
  await pa.waitForFunction(() => document.querySelector("#connected").hidden && !document.querySelector("#choice").hidden, null, {timeout: 20000});
  assert.equal(await pa.locator("#advanced-state").textContent(), "CLOSED");
  assert.equal(await pa.locator("#notice").textContent(), "Connection ended. Start a fresh invite to reconnect.");
  console.log("PASS: missing trusted IDs rejected; remote page close recovers simple-connect UI");
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
