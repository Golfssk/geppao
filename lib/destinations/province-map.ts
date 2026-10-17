/** Local Web Mercator coordinates keep district outlines and terrain tiles aligned. */
export type District = { id:string; name:string; nameEn:string; d:string; x:number; y:number };
export type MapPlace = { id:string; name:string; nameEn:string; kind:string; lon:number; lat:number; x:number; y:number; coordinateType:'node'|'area-center'; source:string; locationNote?:string; locationNoteEn?:string };
export type ProvinceMapData = { id:string; year:number; sourceBoundaryId:string; projection:string; origin:[number,number]; unit:number; viewBox:[number,number,number,number]; districts:District[]; places:MapPlace[]; osmSnapshot:string };
export type TerrainTile = { id:string; url:string; x:number; y:number; size:number };
export const terrainSource='https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer';
export function terrainTiles(data:ProvinceMapData):TerrainTile[]{
 const [vx,vy,vw,vh]=data.viewBox;
 const left=data.origin[0]+vx*data.unit,top=data.origin[1]+vy*data.unit;
 const right=left+vw*data.unit,bottom=top+vh*data.unit;
 // Fixed fit-level tile set: bounded requests; zooming does not fetch an unbounded pyramid.
 let z=Math.min(11,Math.max(6,Math.floor(Math.log2(850/(256*Math.max(right-left,bottom-top))))));
 const range=(z:number)=>{const n=2**z;return [Math.floor(left*n),Math.floor(top*n),Math.floor(right*n),Math.floor(bottom*n)]};
 while(z>4){const [a,b,c,d]=range(z);if((c-a+1)*(d-b+1)<=20)break;z--}
 const [a,b,c,d]=range(z),n=2**z,result:TerrainTile[]=[];
 for(let x=a;x<=c;x++)for(let y=b;y<=d;y++)result.push({id:`${z}/${y}/${x}`,url:`${terrainSource}/tile/${z}/${y}/${x}`,x:(x/n-data.origin[0])/data.unit,y:(y/n-data.origin[1])/data.unit,size:1/n/data.unit});
 return result;
}
export function zoomViewBox(base:[number,number,number,number],zoom:number,center?:[number,number],panGutter=0):[number,number,number,number]{
 const z=Math.max(1,Math.min(4,zoom));const [x,y,w,h]=base,cx=center?.[0]??x+w/2,cy=center?.[1]??y+h/2;
 const width=w/z,height=h/z;
 const px=width*panGutter,py=height*panGutter;
 return [Math.max(x-px,Math.min(x+w-width+px,cx-width/2)),Math.max(y-py,Math.min(y+h-height+py,cy-height/2)),width,height];
}
export function placeKind(kind:string,en:boolean){
 const labels:Record<string,[string,string]>={waterfall:['น้ำตก','Waterfall'],spring:['บ่อน้ำผุดธรรมชาติ','Natural spring'],dam:['เขื่อน','Dam'],museum:['พิพิธภัณฑ์','Museum'],viewpoint:['จุดชมวิว','Viewpoint'],visitor:['ศูนย์บริการนักท่องเที่ยว','Visitor centre'],park:['อุทยาน','Park'],attraction:['สถานที่น่าสนใจ','Point of interest']};
 return (labels[kind]??labels.attraction)[en?1:0];
}
/** Avoid colliding labels at fit level; all districts remain selectable. */
export function districtLabels(data:ProvinceMapData,view:number[],size:{width:number;height:number},en:boolean,selected=''){
 const unit=Math.max(view[2]/size.width,view[3]/size.height),accepted:{d:District;width:number}[]=[];
 for(const d of [...data.districts].sort((a,b)=>Number(b.id===selected)-Number(a.id===selected))){
  const width=((en?d.nameEn:d.name).length*6+12)*unit;
  if(d.x<view[0]+width/2||d.x>view[0]+view[2]-width/2||d.y<view[1]+18*unit||d.y>view[1]+view[3]-30*unit)continue;
  if(d.id!==selected&&(accepted.some(p=>Math.abs(p.d.x-d.x)<(p.width+width)/2&&Math.abs(p.d.y-d.y)<17*unit)||data.places.some(p=>Math.abs(p.x-d.x)<width/2+12*unit&&Math.abs(p.y-d.y)<17*unit)))continue;
  accepted.push({d,width});
 }
 return accepted.map(p=>p.d);
}
/** Separate nearby numbered markers in screen space; leaders retain the exact geographic anchor. */
export function layoutPlacePins(places:MapPlace[],unit:number){
 const placed:{x:number;y:number}[]=[];
 return places.map(p=>{
  let x=p.x,y=p.y;
  for(let ring=0;ring<=places.length;ring++){
   let found=false;
   for(let step=0;step<(ring?12:1);step++){
    const angle=step*Math.PI/6,r=ring*28*unit;
    const nx=p.x+Math.cos(angle)*r,ny=p.y+Math.sin(angle)*r;
    if(placed.every(q=>Math.hypot(q.x-nx,q.y-ny)>=27.9*unit)){x=nx;y=ny;found=true;break}
   }
   if(found)break;
  }
  placed.push({x,y});return {place:p,x,y};
 });
}
