export type PlaceDecision='approve'|'reject'|'archive';
/** No service key and no client-side role assumption; the existing API authorizes every real action. */
export async function submitPlaceDecision({id,decision,note,demo=false,en=false}:{id:string;decision:PlaceDecision;note:string;demo?:boolean;en?:boolean},fetcher:typeof fetch=fetch){
 if(decision==='reject'&&!note.trim())throw new Error(en?'A rejection reason is required.':'กรุณาระบุเหตุผลที่ปฏิเสธ');
 // Deliberately before the request. Public Preview fixtures cannot mutate any record.
 if(demo)return {simulated:true};
 const response=await fetcher(`/api/admin/places/${encodeURIComponent(id)}/moderate`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision,note:note.trim()})});
 const result=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(result?.error||(en?'Could not complete this action.':'ดำเนินการไม่สำเร็จ'));
 return {simulated:false};
}
