import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {provinceData,provinceShapes,regions,filterProvinces,regionViewBox,provinceSearchHref,guideSlugs} from '../lib/destinations/thailand.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('77 unique provinces match 77 valid shapes with interior display points',()=>{
 assert.equal(provinceData.length,77);assert.equal(provinceShapes.length,77);assert.equal(new Set(provinceData.map(p=>p.id)).size,77);
 assert.deepEqual(provinceData.map(p=>p.id).sort(),provinceShapes.map(p=>p.id).sort());
 for(const p of provinceShapes){assert.match(p.d,/^M/);assert.doesNotMatch(p.d,/NaN|Infinity/);assert.ok(p.x>=p.bounds[0]&&p.x<=p.bounds[2]);assert.ok(p.y>=p.bounds[1]&&p.y<=p.bounds[3]);assert.ok(p.x>=0&&p.x<=500&&p.y>=0&&p.y<=820)}
});
test('every province has bilingual landmark and one of six regions',()=>{for(const p of provinceData){for(const key of ['name','nameEn','landmark','landmarkEn'])assert.ok(p[key].trim().length>0);assert.ok(regions.some(r=>r.id===p.region))}assert.equal(filterProvinces('all').length,77);assert.equal(regions.slice(1).reduce((n,r)=>n+filterProvinces(r.id).length,0),77)});
test('requested three landmark ideas are present without false readiness',()=>{const by=id=>provinceData.find(p=>p.id===id);assert.match(by('nakhon-ratchasima').landmark,/ปากช่อง.*เขาใหญ่/);assert.match(by('nakhon-nayok').landmark,/ขุนด่านปราการชล/);assert.match(by('kanchanaburi').landmark,/เอราวัณ/);assert.equal(guideSlugs['nakhon-ratchasima'],'pak-chong-khao-yai');assert.equal(guideSlugs['chiang-mai'],undefined)});
test('search handles Thai, English, landmark, whitespace and empty results',()=>{assert.equal(filterProvinces('all','  CHIANG MAI  ')[0].id,'chiang-mai');assert.equal(filterProvinces('all','เอราวัณ')[0].id,'kanchanaburi');assert.equal(filterProvinces('north','เอราวัณ').length,0);assert.equal(filterProvinces('all','no-such-province').length,0);assert.equal(filterProvinces('all','<script>').length,0)});
test('every regional viewport contains its province bounds',()=>{assert.equal(regionViewBox('all'),'0 0 500 820');for(const r of regions.slice(1)){const [x,y,w,h]=regionViewBox(r.id).split(' ').map(Number);assert.ok(w>0&&h>0);const ids=new Set(filterProvinces(r.id).map(p=>p.id));for(const p of provinceShapes.filter(p=>ids.has(p.id))){assert.ok(p.bounds[0]>=x&&p.bounds[1]>=y);assert.ok(p.bounds[2]<=x+w&&p.bounds[3]<=y+h)}}});
test('province CTA preserves locale and uses honest catalog text search, not fake ids',()=>{const p=provinceData.find(p=>p.id==='nakhon-nayok');const u=new URL(provinceSearchHref(p,'en'),'https://test.invalid');assert.equal(u.pathname,'/search');assert.equal(u.searchParams.get('q'),'นครนายก');assert.equal(u.searchParams.get('lang'),'en');assert.equal(u.searchParams.get('type'),'all');assert.equal(u.searchParams.has('destination'),false)});
test('map and list use same source and have non-hover alternatives',()=>{const code=read('components/destinations/ThailandExplorer.tsx');assert.match(code,/onPointerEnter/);assert.match(code,/pointerType==='mouse'/);assert.match(code,/onClick/);assert.match(code,/<select/);assert.match(code,/mode==='map'/);assert.match(code,/type="search"/);assert.match(code,/aria-pressed/);assert.doesNotMatch(code,/dangerouslySetInnerHTML|supabase|service_role|localStorage|geolocation/)});
test('geographic attribution is packaged with public derived database and no external map API',()=>{const p=JSON.parse(read('public/maps/thailand-provinces.json'));assert.equal(p.provinces.length,77);assert.equal(p.license,'ODbL-1.0');assert.equal(read('lib/destinations/thailand-shapes.json'),read('public/maps/thailand-provinces.json'));assert.match(read('public/maps/THAILAND_MAP_LICENSE.md'),/OpenStreetMap contributors/);assert.match(read('public/maps/THAILAND_MAP_LICENSE.md'),/ODbL-1.0/);assert.doesNotMatch(read('components/destinations/ThailandExplorer.tsx'),/maps\.googleapis|mapbox|api[_-]?key/i)});

test('Northeast uses the full Thai label and includes Korat, not East',()=>{
 assert.equal(regions.find(r=>r.id==='northeast').th,'ตะวันออกเฉียงเหนือ');
 assert.equal(regions.find(r=>r.id==='northeast').en,'Northeast');
 assert.ok(filterProvinces('northeast').some(p=>p.id==='nakhon-ratchasima'));
 assert.ok(!filterProvinces('east').some(p=>p.id==='nakhon-ratchasima'));
 assert.equal(filterProvinces('northeast').length,20);
});
