import test from 'node:test';import assert from 'node:assert/strict';
import {bindMapRightDrag} from '../lib/destinations/map-right-drag.ts';
function setup(){
 const host=new EventTarget(),svg=new EventTarget(),attrs=new Map(),captures=new Set(),moves=[];
 Object.assign(svg,{ownerDocument:{defaultView:host},setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k),hasPointerCapture:id=>captures.has(id),setPointerCapture:id=>captures.add(id),releasePointerCapture:id=>captures.delete(id),getScreenCTM:()=>({inverse:()=>({a:2,b:0,c:0,d:3})})});
 const cleanup=bindMapRightDrag(svg,(x,y)=>moves.push([x,y]));
 function fire(target,type,props={}){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerType:'mouse',button:2,buttons:2,pointerId:7,clientX:10,clientY:20,...props});target.dispatchEvent(e);return e}
 return{host,svg,attrs,captures,moves,cleanup,fire};
}
test('only right mouse drag captures; move uses screen-to-SVG scale and release stops outside',()=>{
 const q=setup();const {fire,svg,host}=q;
 assert.equal(fire(svg,'pointerdown',{button:0,buttons:1}).defaultPrevented,false);
 fire(svg,'pointerdown',{pointerType:'touch'});assert.equal(q.attrs.size,0);
 assert.equal(fire(svg,'pointerdown').defaultPrevented,true);assert.ok(q.captures.has(7));
 fire(host,'pointermove',{pointerId:8,clientX:15});assert.equal(q.moves.length,0);
 fire(host,'pointermove',{clientX:15,clientY:17});assert.deepEqual(q.moves,[[10,-9]]);
 fire(host,'pointerup');assert.equal(q.attrs.size,0);assert.equal(q.captures.size,0);
 fire(host,'pointermove',{clientX:50});assert.equal(q.moves.length,1);q.cleanup();
});
test('cancel, blur, lost capture, released button and effect cleanup end the gesture',()=>{
 for(const reason of ['pointercancel','blur','lostpointercapture','buttons','cleanup']){
  const q=setup();q.fire(q.svg,'pointerdown');
  if(reason==='cleanup')q.cleanup();else if(reason==='buttons')q.fire(q.host,'pointermove',{buttons:0});else q.fire(reason==='lostpointercapture'?q.svg:q.host,reason);
  assert.equal(q.attrs.size,0,reason);assert.equal(q.captures.size,0,reason);
  q.fire(q.host,'pointermove',{clientX:30});assert.equal(q.moves.length,0,reason);q.cleanup();
 }
});
test('context menu suppression is scoped to the map and is removed during cleanup',()=>{
 const q=setup();assert.equal(q.fire(q.svg,'contextmenu').defaultPrevented,true);assert.equal(q.fire(q.host,'contextmenu').defaultPrevented,false);
 q.fire(q.svg,'pointerdown');assert.equal(q.fire(q.svg,'click').defaultPrevented,true);
 q.fire(q.host,'pointerup');assert.equal(q.fire(q.svg,'click').defaultPrevented,false);
 q.cleanup();assert.equal(q.fire(q.svg,'contextmenu').defaultPrevented,false);
 q.fire(q.svg,'pointerdown');assert.equal(q.attrs.size,0);
});
