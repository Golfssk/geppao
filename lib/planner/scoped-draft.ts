import {readPlannerDraft,PLANNER_DRAFT_KEY} from './draft';
import type {DraftScope} from './draft-scope';
type StorageLike=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export function plannerDraftKey(ownerId:string|null){
 if(ownerId!==null&&(!ownerId||ownerId.length>128))throw new Error('Invalid draft scope');
 return 'geppao:planner-draft:v2:'+(ownerId===null?'guest':'user:'+encodeURIComponent(ownerId));
}
export function readScopedDraft(raw:string|null,ownerId:string|null,now=Date.now()){
 try{if(!raw||raw.length>251_000)return null;const envelope=JSON.parse(raw);
  if(envelope?.version!==2||envelope.ownerId!==ownerId)return null;
  return readPlannerDraft(JSON.stringify(envelope.draft),now);
 }catch{return null}
}
// Synchronous operations, no tokens/provider data. Never fall back to an unowned
// legacy draft or another account when storage is blocked/full.
export function scopedDraftStore(scope:DraftScope,storage:()=>StorageLike){
 const key=plannerDraftKey(scope.ownerId);
 return {
  hasLegacy(){try{return Boolean(storage().getItem(PLANNER_DRAFT_KEY))}catch{return false}},
  load(){if(scope.capture()===null)return null;try{return readScopedDraft(storage().getItem(key),scope.ownerId)}catch{return null}},
  save(draft:unknown,token=scope.capture()){
   if(!scope.accepts(token))return false;
   try{const raw=JSON.stringify({version:2,ownerId:scope.ownerId,draft});if(!readScopedDraft(raw,scope.ownerId)||!scope.accepts(token))return false;storage().setItem(key,raw);return true}catch{return false}
  },
  remove(token=scope.capture()){if(!scope.accepts(token))return false;try{storage().removeItem(key);return true}catch{return false}},
  guest(){if(scope.ownerId===null||scope.capture()===null)return null;try{return readScopedDraft(storage().getItem(plannerDraftKey(null)),null)}catch{return null}},
  // Caller must show an explicit adopt/replace action. Signing in never adopts.
  adoptGuest(){
   const token=scope.capture();if(scope.ownerId===null||!scope.accepts(token))return null;
   try{
    const target=storage(),guestKey=plannerDraftKey(null),raw=target.getItem(guestKey),guest=readScopedDraft(raw,null);if(!guest)return null;
    const previous=readScopedDraft(target.getItem(key),scope.ownerId);
    const draft={...guest,saveAttempted:guest.saveAttempted===true||previous?.saveAttempted===true};
    if(!scope.accepts(token))return null;
    target.setItem(key,JSON.stringify({version:2,ownerId:scope.ownerId,draft}));
    try{if(target.getItem(guestKey)===raw)target.removeItem(guestKey)}catch{/* Own copy exists; keep source on removal failure. */}
    return draft;
   }catch{return null}
  },
 };
}
