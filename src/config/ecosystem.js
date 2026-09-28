/*
LEEWAY HEADER — DO NOT REMOVE
REGION: DATA
TAG: DATA.FEDERATE.ECOSYSTEM
AUTHORITY: LeeWay-Standards
WHAT = Standards-owned LeeWay ecosystem discovery client
WHY = Project canonical authorities without maintaining a competing hand-written registry
WHO = Leeway Industries
WHERE = src/config/ecosystem.js
WHEN = 2026-09-28
HOW = Fetch canonical Standards registry; fall back to a generated snapshot only when discovery is unavailable
*/
import{ECOSYSTEM_SNAPSHOT,SNAPSHOT_META}from"./ecosystem-authority.snapshot.js";
export const AUTHORITY_REGISTRY_URL="https://raw.githubusercontent.com/4citeB4U/LeeWay-Standards/main/standards/leeway-ecosystem-authority.v1.json";
function stateFor(a){
 if(a.visibility==="private")return"PRIVATE_RUNTIME_AUTHORITY";
 if(a.pages)return"WEB_SURFACE_DECLARED_NOT_RUNTIME_PROOF";
 return"REPOSITORY_AUTHORITY";
}
export function projectAuthorities(registry){
 if(!registry||registry.registryId!=="LEEWAY_ECOSYSTEM_AUTHORITY_V1")throw new Error("LEEWAY_ECOSYSTEM_REGISTRY_ID_INVALID");
 const required=registry.requiredCoreIds||[];
 const ids=new Set((registry.authorities||[]).map(x=>x.id));
 for(const id of required)if(!ids.has(id))throw new Error("LEEWAY_ECOSYSTEM_REQUIRED_AUTHORITY_MISSING:"+id);
 return registry.authorities
  .filter(a=>a.authorityClass!=="EVIDENCE_ONLY")
  .map(a=>({
    id:a.id,
    name:a.name,
    role:a.role,
    authorityClass:a.authorityClass,
    repo:`https://github.com/${a.repo}`,
    repoFullName:a.repo,
    pages:a.pages||null,
    visibility:a.visibility,
    approvedCommit:a.approvedCommit||null,
    state:stateFor(a)
  }));
}
export async function loadEcosystem(fetchImpl=globalThis.fetch){
 if(typeof fetchImpl!=="function")return{entries:ECOSYSTEM_SNAPSHOT,source:"PINNED_SNAPSHOT_FALLBACK",snapshot:SNAPSHOT_META,error:"FETCH_UNAVAILABLE"};
 try{
  const response=await fetchImpl(AUTHORITY_REGISTRY_URL,{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP_"+response.status);
  const registry=await response.json();
  return{entries:projectAuthorities(registry),source:"LIVE_STANDARDS_REGISTRY",registryId:registry.registryId,registryUrl:AUTHORITY_REGISTRY_URL};
 }catch(error){
  return{entries:ECOSYSTEM_SNAPSHOT,source:"PINNED_SNAPSHOT_FALLBACK",snapshot:SNAPSHOT_META,error:String(error?.message||error)};
 }
}
export const ECOSYSTEM=ECOSYSTEM_SNAPSHOT;
