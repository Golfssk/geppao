/** Only metadata that does not require rebuilding the trip's dates/days. */
export function tripMetadata(body:Record<string,unknown>):Record<string,unknown>|null {
 const allowed=['expectedVersion','title','status','travelers','budgetTotal'];
 if(Object.keys(body).some(key=>!allowed.includes(key)))return null;
 const patch:Record<string,unknown>={};
 if('title' in body){if(typeof body.title!=='string'||!body.title.trim()||body.title.trim().length>160)return null;patch.title=body.title.trim()}
 if('status' in body){if(typeof body.status!=='string'||!['draft','planned','active','completed','archived'].includes(body.status))return null;patch.status=body.status}
 if('travelers' in body){if(typeof body.travelers!=='number'||!Number.isSafeInteger(body.travelers)||body.travelers<1||body.travelers>100)return null;patch.travelers=body.travelers}
 if('budgetTotal' in body){const n=body.budgetTotal;if(n!==null&&(typeof n!=='number'||!Number.isFinite(n)||n<0||n>100000000||Number(n.toFixed(2))!==n))return null;patch.budget_total=n}
 return Object.keys(patch).length?patch:null;
}
