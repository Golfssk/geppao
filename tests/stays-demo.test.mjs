import test from 'node:test';
import assert from 'node:assert/strict';
import {demoEnabled,searchDemoStays,demoStays} from '../lib/demo/stays.ts';
import {parseStayQuery,STAY_PAGE_SIZE} from '../lib/stays/query.ts';
const q=s=>parseStayQuery(new URLSearchParams(s));
test('demo is allowed only in Preview/development, never production',()=>{assert.equal(demoEnabled('preview','production'),true);assert.equal(demoEnabled('production','production'),false);assert.equal(demoEnabled(undefined,'production'),false);assert.equal(demoEnabled(undefined,'development'),true);});
test('demo names are labeled and no contact/media links are fabricated',()=>{assert.ok(demoStays.every(x=>x.name.startsWith('DEMO ')&&x.description.includes('Synthetic')&&x.image_url===null));});
test('demo filters and pagination preserve real UI semantics without a DB',()=>{const a=searchDemoStays(q('')),b=searchDemoStays(q('page=2'));assert.equal(a.pageSize,STAY_PAGE_SIZE);assert.equal(a.total,18);assert.equal(a.items.length,12);assert.equal(b.items.length,6);assert.equal(new Set([...a.items,...b.items].map(x=>x.id)).size,18);assert.ok(searchDemoStays(q('pet=1&capacity=1&guests=4')).items.every(x=>x.pet_friendly===true&&x.maximum_guests>=4));});
test('demo sorts unknown prices last and supports zero-results states',()=>{const r=searchDemoStays(q('sort=price_desc&page=2'));assert.equal(r.items.at(-1).price,null);assert.equal(searchDemoStays(q('q=no-such-fixture')).total,0);assert.equal(searchDemoStays(q('maxPrice=0')).total,0);});
