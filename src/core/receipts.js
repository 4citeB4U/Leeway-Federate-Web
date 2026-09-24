/*
LEEWAY HEADER — DO NOT REMOVE
REGION: DATA
TAG: DATA.FEDERATE.RECEIPTS
AUTHORITY: LeeWay-Standards
DISCOVERY_PIPELINE: Voice → Intent → Location → Vertical → Ranking → Render
5WH: WHAT=Browser receipt store; WHY=Separate observed actions from claims; WHO=Leeway Industries; WHERE=src/core/receipts.js; WHEN=2026-09-24; HOW=Append-only localStorage
CHAIN: Standards → Integrated → Runtime → Projections
LICENSE: PROPRIETARY
*/
const KEY="leeway-federate-receipts-v1";export function readReceipts(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]}}export function emitReceipt(event,payload,status="OBSERVED"){const record={id:crypto.randomUUID(),event,status,at:new Date().toISOString(),payload};const all=readReceipts();all.push(record);localStorage.setItem(KEY,JSON.stringify(all.slice(-200)));return record}export function exportReceipts(){const blob=new Blob([JSON.stringify(readReceipts(),null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="leeway-federate-browser-receipts.json";a.click();URL.revokeObjectURL(url)}