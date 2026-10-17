import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {loadBindings, transform} from 'next/dist/build/swc/index.js';
const require = createRequire(import.meta.url);
await loadBindings();
export async function sourceModule(path, mocks = {}, globals = {}) {
  const source = await fs.readFile(new URL('../' + path, import.meta.url), 'utf8');
  const {code} = await transform(source, {filename:path, jsc:{parser:{syntax:'typescript',tsx:path.endsWith('.tsx')},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}});
  const module = {exports:{}};
  vm.runInNewContext(code, {module,exports:module.exports,require:name=>Object.hasOwn(mocks,name)?mocks[name]:require(name),console,Request,Response,URL,URLSearchParams,FormData,fetch,AbortSignal,Buffer,setTimeout,clearTimeout,...globals}, {filename:path});
  return module.exports;
}
export const jsonResponse = {NextResponse:{json:(body, options)=>Response.json(body,options)}};
export const candidateId = '11111111-1111-4111-8111-111111111111';
export const placeId = '22222222-2222-4222-8222-222222222222';
export function dbFixture(row, error = null) {
  const calls=[];
  const filters=[];
  const query={select(value){calls.push(['select',value]);return this;},eq(key,value){filters.push([key,value]);return this;},is(key,value){filters.push([key,value]);return this;},async maybeSingle(){return{data:filters.every(([key,value])=>row?.[key]===value)?row:null,error};}};
  return {calls,from(name){calls.push(['from',name]);return query;}};
}
