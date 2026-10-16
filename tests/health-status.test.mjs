import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHealthCheck} from '../lib/health/status.ts';
const ready = {status:'ok',checks:{environment:true,database:true}};
const unavailable = {status:'degraded',checks:{environment:true,database:false},code:'DEPENDENCY_UNAVAILABLE'};
test('missing environment never queries the database',async()=>{
 let calls=0;const run=createHealthCheck({isConfigured:()=>false,probe:async()=>{calls++;return true;}});
 assert.deepEqual(await run(),{status:'error',checks:{environment:false,database:false},code:'NOT_CONFIGURED'});assert.equal(calls,0);
});
test('healthy public probe exposes only stable availability fields',async()=>{
 assert.deepEqual(await createHealthCheck({isConfigured:()=>true,probe:async()=>true})(),ready);
});
test('dependency failure returns a generic machine-readable code',async()=>{
 assert.deepEqual(await createHealthCheck({isConfigured:()=>true,probe:async()=>false})(),unavailable);
});
test('thrown errors and non-Error values cannot leak details',async()=>{
 for(const secret of [new Error('postgres://private:secret@internal/table'),{message:'secret jwt'},'private schema']){
  const result=await createHealthCheck({isConfigured:()=>true,probe:async()=>{throw secret;}})();assert.deepEqual(result,unavailable);assert.doesNotMatch(JSON.stringify(result),/secret|postgres|internal|schema/);
 }
});
test('non-boolean dependency results fail closed',async()=>{
 for(const value of [undefined,null,'true',1,{}])assert.deepEqual(await createHealthCheck({isConfigured:()=>true,probe:async()=>value})(),unavailable);
});
test('timeout bounds a hung probe and aborts its signal',async()=>{
 let signal;const run=createHealthCheck({isConfigured:()=>true,timeoutMs:10,probe:s=>{signal=s;return new Promise(()=>{});}});
 assert.deepEqual(await run(),unavailable);assert.equal(signal.aborted,true);
});
test('concurrent probes are coalesced per process',async()=>{
 let calls=0,finish;const run=createHealthCheck({isConfigured:()=>true,probe:()=>{calls++;return new Promise(r=>{finish=r;});}});
 const work=Array.from({length:30},()=>run());await Promise.resolve();finish(true);assert.deepEqual(await Promise.all(work),Array(30).fill(ready));assert.equal(calls,1);
});
test('success cache expires after ten seconds and rechecks',async()=>{
 let time=0,calls=0;const run=createHealthCheck({isConfigured:()=>true,now:()=>time,probe:async()=>{calls++;return true;}});
 await run();time=9999;await run();assert.equal(calls,1);time=10000;await run();assert.equal(calls,2);
});
test('failure cache expires after two seconds and allows recovery',async()=>{
 let time=0,calls=0;const run=createHealthCheck({isConfigured:()=>true,now:()=>time,probe:async()=>++calls>1});
 assert.deepEqual(await run(),unavailable);time=1999;assert.deepEqual(await run(),unavailable);time=2000;assert.deepEqual(await run(),ready);assert.equal(calls,2);
});
test('configuration loss cannot reuse a healthy cached result',async()=>{
 let configured=true;const run=createHealthCheck({isConfigured:()=>configured,probe:async()=>true});await run();configured=false;assert.equal((await run()).code,'NOT_CONFIGURED');
});
test('route is anonymous, bounded, no-store and does not count or expose raw errors',()=>{
 const code=readFileSync('app/api/health/route.ts','utf8');assert.match(code,/from '@supabase\/supabase-js'/);assert.doesNotMatch(code,/supabase\/server|cookies\(|count:|\.message|console\.|SERVICE_ROLE/);assert.equal((code.match(/limit\(1\)\.abortSignal\(signal\)/g)||[]).length,3);assert.equal((code.match(/eq\('publication_status', 'published'\)/g)||[]).length,2);assert.match(code,/status: body.status === 'ok' \? 200 : 503/);assert.match(code,/'Cache-Control': 'private, no-store'/);
});
