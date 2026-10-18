export const PLANNER_DRAFT_KEY='geppao:planner-draft:v1';
export function readPlannerDraft(raw:string|null,now=Date.now()):any|null {
 try {if(!raw||raw.length>250_000)return null;const d=JSON.parse(raw);if(d.version!==1||!Number.isFinite(d.savedAt)||now-d.savedAt>86400000||d.savedAt>now+60000)return null;
 if(d.saveAttempted!==undefined&&typeof d.saveAttempted!=='boolean')return null;
 if(typeof d.input!=='string'||d.input.length>1000||!Array.isArray(d.vibes)||!['day_trip','overnight'].includes(d.tripMode))return null;
 if(d.plan&&(!Array.isArray(d.plan.days)||!Array.isArray(d.plan.items)||d.plan.items.length>100||d.plan.days.some((day:any)=>!day||!Array.isArray(day.items)||day.items.some((item:any)=>!item||typeof item.id!=='string'))||d.plan.itinerary!=null&&!Array.isArray(d.plan.itinerary)))return null;
 return d;}catch{return null}
}
