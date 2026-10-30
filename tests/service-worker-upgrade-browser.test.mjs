/* LEEWAY HEADER — DO NOT REMOVE
REGION: UI
TAG: UI.FEDERATE.TESTS.SERVICE_WORKER_UPGRADE_BROWSER
AUTHORITY: LeeWay-Standards
5WH: WHAT=Legacy service-worker handoff browser proof; WHY=Preserve active WebRTC pages while delivering v4 on later navigation; WHO=Leeway Industries; WHERE=tests/service-worker-upgrade-browser.test.mjs; WHEN=2026-10-30; HOW=Chromium legacy-worker update harness
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY (see LICENSE.md) */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.LEEWAY_PLAYWRIGHT_PATH || "playwright");
const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const currentWorker = await fs.readFile(path.join(root, "service-worker.js"), "utf8");
const currentClient = await fs.readFile(path.join(root, "src/service-worker-client.js"), "utf8");
const legacyClient = `if("serviceWorker" in navigator){window.__clientVersion='legacy';const hadController=Boolean(navigator.serviceWorker.controller);let reloaded=false;if(hadController)navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloaded)return;reloaded=true;window.location.reload()});navigator.serviceWorker.register('./service-worker.js').catch(()=>{})}`;
const legacyWorker = `const CACHE='leeway-federate-web-v3-human-connect';self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));self.addEventListener('message',event=>{if(event.data?.type==='LEEWAY_TEST_VERSION'&&event.ports[0])event.ports[0].postMessage({version:3})});`;
let version = 3;
let v4Requested = false;
let server;
let browser;
let navigations = 0;

try {
  server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, "http://x").pathname;
      if (pathname === "/service-worker.js") {
        if (version === 4) v4Requested = true;
        const source = version === 3 ? legacyWorker : `${currentWorker}\nself.addEventListener('message',event=>{if(event.data?.type==='LEEWAY_TEST_VERSION'&&event.ports[0])event.ports[0].postMessage({version:4})});`;
        return res.writeHead(200, {"Content-Type": "text/javascript", "Cache-Control": "no-store"}).end(source);
      }
      if (pathname === "/src/service-worker-client.js") {
        const source = version === 3 ? legacyClient : `${currentClient}\nwindow.__clientVersion='current';`;
        return res.writeHead(200, {"Content-Type": "text/javascript", "Cache-Control": "no-store"}).end(source);
      }
      const file = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      const data = await fs.readFile(file);
      const type = file.endsWith(".html") ? "text/html" : file.endsWith(".js") ? "text/javascript" : "text/plain";
      res.writeHead(200, {"Content-Type": type, "Cache-Control": "no-store"}).end(data);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch({headless: true, args: ["--no-sandbox"]});
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("framenavigated", frame => { if (frame === page.mainFrame()) navigations++; });
  await page.goto(base + "/connect.html");
  await page.waitForFunction(() => window.__clientVersion === "legacy");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => window.__clientVersion === "legacy");
  assert.equal(navigations, 2);

  const activeVersion = async (target = page) => target.evaluate(() => new Promise(resolve => {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (!registration?.active) return resolve(null);
      const channel = new MessageChannel();
      const timer = setTimeout(() => resolve(null), 500);
      channel.port1.onmessage = event => { clearTimeout(timer); resolve(event.data?.version ?? null); };
      registration.active.postMessage({type: "LEEWAY_TEST_VERSION"}, [channel.port2]);
    });
  }));
  assert.equal(await activeVersion(), 3);
  version = 4;
  await page.evaluate(() => navigator.serviceWorker.getRegistration().then(registration => registration.update()));
  for (let i = 0; i < 80 && !v4Requested; i++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(v4Requested, true);
  assert.equal(await activeVersion(), 3);
  assert.equal(navigations, 2);
  await page.close();
  const next = await context.newPage();
  await next.goto(base + "/connect.html");
  await next.waitForFunction(() => window.__clientVersion === "current");
  assert.equal(await activeVersion(next), 4);
  await next.close();
  console.log("PASS: active legacy client is not reloaded on v4 activation; later navigation receives v4 client");
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
