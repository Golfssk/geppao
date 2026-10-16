import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('home is map-led with one main and preserves all sections after the removed opening',()=>{
 const p=read('app/page.tsx'),e=read('components/destinations/ThailandExplorer.tsx');
 assert.match(p,/<ThailandExplorer\/>/);assert.equal((p.match(/<main>/g)||[]).length,1);assert.doesNotMatch(e,/<main\b/);
 for(const removed of ['Latest stories','EditorialCard','HomeCategoryCarousel','mapPlace','Travel by mood','home-destinations','เลือกจุดหมาย แล้ววางแผนทริป'])assert.ok(!p.includes(removed),removed);
 assert.ok(p.indexOf('<ThailandExplorer/>')<p.indexOf('<HomePlannerCTA/>'));
 for(const retained of ['<TravelTrustBand/>','<HostCTA/>','<HomePlannerCTA/>'])assert.ok(p.includes(retained),retained);
 assert.doesNotMatch(p,/from\('places'\)/);assert.match(p,/canonical:'https:\/\/geppao.vercel.app'/);
});
test('old explorer entry redirects to home while destination guides remain untouched',()=>{
 const p=read('app/go/page.tsx');assert.match(p,/permanentRedirect/);assert.match(p,/lang==='en'\|\|lang==='th'/);assert.match(p,/`\/\?lang=\$\{lang\}`:'\/'/);
 assert.match(read('next.config.ts'),/source:'\/go',destination:'\/',permanent:true/);assert.ok(read('app/go/[slug]/page.tsx').length>0);assert.doesNotMatch(read('app/sitemap.ts'),/url:`\$\{base\}\/go`/);
});
test('homepage search uses unified catalog types and preserves language',()=>{
 const p=read('components/destinations/ThailandExplorer.tsx');assert.match(p,/<form action="\/search" method="get"/);assert.match(p,/name="lang" value=\{locale\}/);assert.match(p,/name="q" type="search"/);
 for(const type of ['all','accommodation','restaurant','cafe','attraction','activity'])assert.ok(p.includes(`option value="${type}"`));assert.doesNotMatch(p,/option value="stay"/);
});
test('navigation has no duplicate go tab and treats destination guides as home discovery',()=>{
 const p=read('components/navigation/SiteChrome.tsx');assert.doesNotMatch(p,/\['\/go',/);assert.doesNotMatch(p,/href="\/stories"|\['\/stories',/);assert.match(p,/pathname.startsWith\('\/go\/'\)/);assert.match(p,/<Link href="\/">\{en\?'Destinations'/);
});
