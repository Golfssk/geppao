import test from 'node:test';import assert from 'node:assert/strict';
import {safeAuthNext} from '../lib/auth/redirect.ts';
test('auth destination cannot become an authority after dot-segment normalization or reparsing',()=>{
 const attacks=['/safe/..//evil.invalid','/safe/%2e%2e//evil.invalid','/safe/%252e%252e/%252f/evil.invalid','/a/b/../..//evil.invalid'];
 for(const input of attacks){const next=safeAuthNext(input);assert.equal(next,'/trips');assert.equal(new URL(next,'https://example.test').origin,'https://example.test')}
});
