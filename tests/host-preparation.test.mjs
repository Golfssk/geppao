import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {HOST_PREPARATION_ITEMS,preparationCount,hostEntryHref} from '../lib/host/preparation.ts';
import {hostCopy} from '../components/host/hostCopy.ts';
test('preparation counts only known, distinct checklist items',()=>{assert.equal(preparationCount([]),0);assert.equal(preparationCount(['identity','identity','unknown']),1);assert.equal(preparationCount(HOST_PREPARATION_ITEMS),8)});
test('host CTAs stay in the existing authenticated Business workflow',()=>{for(const locale of ['th','en'])for(const target of ['onboarding','places']){const u=new URL(hostEntryHref(locale,target),'https://example.test');assert.equal(u.pathname,'/host/login');assert.equal(u.searchParams.get('next'),'/business/'+target);assert.equal(u.searchParams.get('lang'),locale);assert.equal(u.origin,'https://example.test')}});
test('checklist and preparation steps have complete TH/EN labels',()=>{for(const locale of ['th','en']){assert.deepEqual(Object.keys(hostCopy[locale].checklist),[...HOST_PREPARATION_ITEMS]);assert.equal(hostCopy[locale].prepSteps.length,3);assert.equal(hostCopy[locale].faq.length,5);assert.ok(hostCopy[locale].sessionNote);assert.ok(hostCopy[locale].noBooking)}});
test('public preparation does not save drafts, import data or persist choices',()=>{const code=readFileSync(new URL('../components/host/HostPreparation.tsx',import.meta.url),'utf8');assert.doesNotMatch(code,/fetch\s*\(|localStorage|sessionStorage|createBrowserClient|supabase|\/api\//);assert.match(code,/aria-current/);assert.match(code,/hostEntryHref/)});
