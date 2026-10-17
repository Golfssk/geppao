import test from 'node:test';import assert from 'node:assert/strict';
import {zoomCamera,wheelFactor} from '../lib/destinations/wheel-camera.ts';
const base=[0,0,100,200];
test('wheel camera zoom keeps cursor position and aspect ratio',()=>{const c=zoomCamera(base,base,.5,[25,60]);assert.deepEqual(c,[12.5,30,50,100]);assert.equal((25-c[0])/c[2],.25);assert.equal((60-c[1])/c[3],.3)});
test('zoom is bounded through repeated extreme scrolls; reset is exact',()=>{let c=base;for(let i=0;i<100;i++)c=zoomCamera(base,c,wheelFactor(-999,0),[99,199]);assert.equal(c[2],25);assert.ok(c[0]>=0&&c[0]+c[2]<=100&&c[1]+c[3]<=200);for(let i=0;i<100;i++)c=zoomCamera(base,c,wheelFactor(999,0),[0,0]);assert.deepEqual(c,base)});
test('wheel modes normalize pixel, line and page; invalid zoom is ignored',()=>{assert.equal(wheelFactor(16,0),wheelFactor(1,1));assert.equal(wheelFactor(120,0),wheelFactor(1,2,120));assert.equal(wheelFactor(0,0),1);assert.deepEqual(zoomCamera(base,base,NaN,[20,30]),base);assert.deepEqual(zoomCamera(base,base,-1,[20,30]),base)});

test('right-drag pan follows mouse without changing zoom and clamps all edges',async()=>{
 const {panCamera}=await import('../lib/destinations/wheel-camera.ts');
 assert.deepEqual(panCamera(base,[25,50,50,100],10,-20),[15,70,50,100]);
 assert.deepEqual(panCamera(base,[25,50,50,100],999,-999),[-12.5,125,50,100]);
 assert.deepEqual(panCamera(base,[25,50,50,100],-999,999),[62.5,-25,50,100]);
 assert.deepEqual(panCamera(base,base,40,40),[-25,-40,100,200]);
 assert.deepEqual(panCamera([-100,200,100,200],[-75,250,50,100],10,20),[-85,230,50,100]);
 assert.deepEqual(panCamera(base,base,NaN,0),base);
});
