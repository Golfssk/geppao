import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {terrainTiles,zoomViewBox,districtLabels} from '../lib/destinations/province-map.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const index=JSON.parse(read('public/maps/provinces/index.json'));
const maps=index.provinces.map(p=>JSON.parse(read('public/maps/provinces/'+p.id+'.json')));
test('all 77 provinces lazy-load complete attributed district collections',()=>{
 assert.equal(index.provinces.length,77);assert.equal(maps.reduce((n,p)=>n+p.districts.length,0),928);
 const ids=maps.flatMap(p=>p.districts.map(d=>d.id));assert.equal(new Set(ids).size,928);
 for(const p of maps){assert.equal(p.sourceBoundaryId,'THA-ADM2-78962969');assert.equal(p.year,2019);assert.equal(p.districtLicense,'CC-BY-3.0-IGO');assert.equal(p.placesLicense,'ODbL-1.0');assert.ok(p.districts.length>0);assert.ok(p.viewBox.every(Number.isFinite));assert.ok(p.unit>0);for(const d of p.districts){assert.match(d.name,/[\u0E00-\u0E7F]/);assert.ok(d.nameEn);assert.match(d.d,/^M/);assert.doesNotMatch(d.d,/NaN|Infinity/);assert.ok(Number.isFinite(d.x)&&Number.isFinite(d.y))}}
});
test('known province and Bangkok district counts are retained',()=>{for(const [id,n] of [['bangkok',50],['nakhon-ratchasima',32],['nakhon-nayok',4],['kanchanaburi',13]])assert.equal(maps.find(p=>p.id===id).districts.length,n);assert.ok(maps.find(p=>p.id==='nakhon-ratchasima').districts.some(d=>d.name==='ปากช่อง'))});
test('selected map points have finite source coordinates and distinguish area centres',()=>{for(const p of maps){assert.ok(p.places.length<=12);assert.equal(new Set(p.places.map(x=>x.name)).size,p.places.length);for(const x of p.places){assert.match(x.source,/^https:\/\/www\.openstreetmap\.org\/(node|way|relation)\/\d+$/);assert.ok(['node','area-center'].includes(x.coordinateType));assert.ok([x.lon,x.lat,x.x,x.y].every(Number.isFinite));const [a,b,w,h]=p.viewBox;assert.ok(x.x>=a&&x.x<=a+w&&x.y>=b&&x.y<=b+h)}}});
test('featured waterfall and dam use checked source element coordinates, not province pins',()=>{
 const dam=maps.find(p=>p.id==='nakhon-nayok').places.find(p=>p.name==='เขื่อนขุนด่านปราการชล');assert.equal(dam.source,'https://www.openstreetmap.org/relation/20451299');assert.equal(dam.lat,14.3076779);
 const fall=maps.find(p=>p.id==='kanchanaburi').places.find(p=>p.name==='น้ำตกเอราวัณ');assert.equal(fall.source,'https://www.openstreetmap.org/node/2509420743');assert.equal(fall.lat,14.3682867);assert.equal(fall.coordinateType,'node');
});
test('terrain tile requests are bounded and exactly aligned with the local projection',()=>{for(const p of maps){const tiles=terrainTiles(p);assert.ok(tiles.length>0&&tiles.length<=20);for(const t of tiles){assert.match(t.url,/^https:\/\/services\.arcgisonline\.com\/ArcGIS\/rest\/services\/Elevation\/World_Hillshade\/MapServer\/tile\/\d+\/\d+\/\d+$/);const [z,y,x]=t.id.split('/').map(Number);assert.ok(Math.abs((t.x*p.unit+p.origin[0])*2**z-x)<1e-7);assert.ok(Math.abs((t.y*p.unit+p.origin[1])*2**z-y)<1e-7);assert.ok(Math.abs(t.size*p.unit*2**z-1)<1e-7)}}});
test('zoom clamps to province extent and returns to fit without drifting',()=>{for(const p of maps){assert.deepEqual(zoomViewBox(p.viewBox,1),p.viewBox);for(const z of [0,2,4,10]){const [x,y,w,h]=zoomViewBox(p.viewBox,z,[1e9,-1e9]);const [bx,by,bw,bh]=p.viewBox;assert.ok(x>=bx&&y>=by&&x+w<=bx+bw+1e-9&&y+h<=by+bh+1e-9);assert.ok(w>=bw/4)}}});
test('district labels are decluttered while all districts remain selectable',()=>{const p=maps.find(p=>p.id==='bangkok');const labels=districtLabels(p,p.viewBox,{width:350,height:435},false);assert.ok(labels.length<p.districts.length);assert.equal(new Set(labels.map(d=>d.id)).size,labels.length);const code=read('components/destinations/ProvinceExplorer.tsx');assert.match(code,/data\.districts\].sort/);assert.match(code,/AbortController/);assert.match(code,/role="status"/);assert.match(code,/allTilesFailed/);assert.match(code,/setAttempt/);assert.match(code,/aria-pressed/);assert.doesNotMatch(code,/supabase|service_role|localStorage|geolocation|api[_-]?key|dangerouslySetInnerHTML/i)});
test('licenses, complete source collections and generation script are shipped',()=>{const text=read('public/maps/PROVINCE_MAP_LICENSE.md');for(const q of ['CC BY 3.0 IGO','ODbL-1.0','Esri','2019','not verified','Kongvut'])assert.ok(text.includes(q));assert.match(read('public/maps/THAI_NAMES_LICENSE.txt'),/MIT License/);assert.match(read('scripts/build-province-maps.py'),/nameAliases/);assert.equal(readdirSync(new URL('../public/maps/provinces/',import.meta.url)).filter(f=>f.endsWith('.json')).length,78)});
test('owner curated Pak Chong slots preserve precise source points and reproducible overrides',()=>{
 const p=maps.find(p=>p.id==='nakhon-ratchasima'),curated=JSON.parse(read('lib/destinations/curated-places.json'))[p.id];
 const district=p.districts.find(d=>d.name==='ปากช่อง');
 const rings=[...district.d.matchAll(/M([^Z]+)Z/g)].map(m=>m[1].split('L').map(v=>v.split(',').map(Number)));
 const inside=(x,y,r)=>{let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit};
 for(const o of curated){const q=p.places[o.slot-1];for(const [k,v] of Object.entries(o.place))assert.deepEqual(q[k],v);assert.ok(rings.some(r=>inside(q.x,q.y,r)));const mx=(q.lon+180)/360,my=(1-Math.asinh(Math.tan(q.lat*Math.PI/180))/Math.PI)/2;assert.equal(q.x,Math.round((mx-p.origin[0])/p.unit*100)/100);assert.equal(q.y,Math.round((my-p.origin[1])/p.unit*100)/100)}
 assert.equal(p.places[2].name,'อุทยานแห่งชาติเขาใหญ่');assert.equal(p.places[2].id,'node/5518427849');assert.match(p.places[2].locationNoteEn,/checkpoint/);
 assert.equal(p.places[3].name,'บ่อน้ำผุดธรรมชาติ');assert.equal(p.places[3].id,'node/2525136422');assert.equal(p.places[3].kind,'spring');
 assert.match(read('scripts/build-province-maps.py'),/Curated point outside province/);
 const provinces=JSON.parse(read('lib/destinations/provinces.json'));assert.equal(provinces.find(p=>p.id==='nakhon-ratchasima').region,'east');assert.equal(provinces.find(p=>p.id==='khon-kaen').region,'northeast');
});
test('close numbered markers separate without mutating geographic anchors',async()=>{
 const {layoutPlacePins}=await import('../lib/destinations/province-map.ts');
 const p=maps.find(p=>p.id==='nakhon-ratchasima'),before=JSON.stringify(p.places);
 for(const unit of [1,2,4]){const pins=layoutPlacePins(p.places,unit);assert.equal(pins.length,p.places.length);for(let i=0;i<pins.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(pins[i].x-pins[j].x,pins[i].y-pins[j].y)>=27.9*unit)}assert.equal(JSON.stringify(p.places),before);
});
