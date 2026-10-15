import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStayQuery, stayQueryParams, stayRpcArgs, stayNights, bangkokToday, StayValidationError} from '../lib/stays/query.ts';
import {firstRelated, safeHttpsUrl, safePhone} from '../lib/stays/presentation.ts';
const parse = (value='') => parseStayQuery(new URLSearchParams(value),'2026-10-14');
test('defaults are bounded and do not claim confirmed capacity',()=>{
  const q=parse();assert.equal(q.page,1);assert.equal(q.guests,2);assert.equal(stayRpcArgs(q).p_guests,null);assert.equal(stayNights(q),null);
});
test('dates, locale, literal punctuation and zero budget round-trip',()=>{
  const q=parse('q=%25%27%2C&checkIn=2026-10-20&checkOut=2026-10-22&guests=4&capacity=1&maxPrice=0&lang=en&pet=1&sort=price_asc');
  assert.deepEqual(parse(stayQueryParams(q).toString()),q);assert.equal(stayNights(q),2);assert.equal(stayRpcArgs(q).p_guests,4);assert.equal(q.maxPrice,0);
});
for(const value of ['page=0','page=501','page=1.1','guests=31','guests=-1','maxPrice=NaN','maxPrice=-1','maxPrice=1000001','maxPrice=1.234','sort=random','lang=jp','pet=true','destination=a%27%2Cor%3Dtrue','q='+('a'.repeat(101)),'page=1&page=2']) {
  test(`reject malformed input: ${value.slice(0,45)}`,()=>assert.throws(()=>parse(value),StayValidationError));
}
for(const value of ['checkIn=2026-10-20','checkIn=2026-02-30&checkOut=2026-03-02','checkIn=2026-10-20&checkOut=2026-10-20','checkIn=2026-10-20&checkOut=2026-11-21','checkIn=2026-10-13&checkOut=2026-10-20']){
  test(`reject bad planning dates: ${value}`,()=>assert.throws(()=>parse(value),StayValidationError));
}
test('Bangkok calendar day is independent of server timezone',()=>assert.equal(bangkokToday(new Date('2026-10-13T18:00:00Z')),'2026-10-14'));
test('one-to-one relations accept PostgREST object and legacy array shape',()=>{const row={check_in_time:'14:00:00'};assert.equal(firstRelated(row),row);assert.equal(firstRelated([row]),row);assert.equal(firstRelated([]),null);assert.equal(firstRelated(null),null);});
test('external links reject active schemes, credentials and malformed phone numbers',()=>{assert.equal(safeHttpsUrl('javascript:alert(1)'),null);assert.equal(safeHttpsUrl('https://user:pass@example.com'),null);assert.equal(safeHttpsUrl('https://example.com'),'https://example.com/');assert.equal(safePhone('+66 (81) 234-5678'),'tel:+66812345678');assert.equal(safePhone('javascript:alert(1)'),null);});
