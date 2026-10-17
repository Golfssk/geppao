// Ordering snapshots cover membership, rank and locks, not private notes or prices.
export type StopRank = {id:string; position:number; is_locked?:boolean};
export function orderSnapshot(day:any) {
 return {dayId:day.id,items:[...(day.trip_items??[])].sort((a:StopRank,b:StopRank)=>a.position-b.position||a.id.localeCompare(b.id)).map((i:StopRank)=>({id:i.id,position:i.position,locked:!!i.is_locked}))};
}
export function arrangeRequest(days:any[],itemId:string,targetDayId:string,beforeItemId:string|null) {
 const source=days.find(d=>d.trip_items?.some((i:StopRank)=>i.id===itemId)),target=days.find(d=>d.id===targetDayId);
 if(!source||!target)return null;
 return {itemId,sourceDayId:source.id,targetDayId,beforeItemId,snapshots:(source.id===target.id?[source]:[source,target]).map(orderSnapshot)};
}
export function neighborTarget(items:StopRank[],index:number,direction:-1|1):string|null|undefined {
 const target=index+direction;if(target<0||target>=items.length||items[index]?.is_locked||items[target]?.is_locked)return undefined;
 return direction===-1?items[target].id:items[target+1]?.id??null;
}
