export const WORKBOOK_PAGE_SIZE=30;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function workbookQuery(raw:Record<string,string|string[]|undefined>){
 const one=(key:string)=>typeof raw[key]==='string'?raw[key] as string:'';
 const batch=one('batch'),sheet=one('sheet'),page=one('page')||'1';
 if((raw.batch!==undefined&&!batch)||(batch&&!uuid.test(batch))||sheet.length>100||Array.isArray(raw.sheet)||!/^\d{1,4}$/.test(page)||Number(page)<1||Number(page)>3334||Array.isArray(raw.page))throw new Error('Invalid workbook filter');
 return {batch:batch||null,sheet,page:Number(page)};
}
export function workbookHref(batch:string,sheet:string,page:number){const p=new URLSearchParams({batch,page:String(page)});if(sheet)p.set('sheet',sheet);return '/admin/imports/workbooks?'+p.toString();}
export function workbookMapHref(value:string|null){if(!value)return null;try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&(u.hostname==='www.google.com'||u.hostname==='maps.google.com')&&(u.pathname==='/maps'||u.pathname.startsWith('/maps/'))?u.toString():null}catch{return null}}
