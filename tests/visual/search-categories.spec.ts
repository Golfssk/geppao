import {test,expect} from '@playwright/test';

for(const lang of ['th','en'] as const){
 test(`icon categories preserve search form semantics ${lang}`,async({page})=>{
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.goto(`/search?lang=${lang}&q=coffee&type=cafe&pet=1`);
  const form=page.locator('form[action="/search"]');
  const radios=form.locator('input[type="radio"][name="type"]');
  await expect(radios).toHaveCount(7);
  await expect(form.locator('input[name="type"]:checked')).toHaveValue('cafe');
  await expect(form.locator('select[name="type"]')).toHaveCount(0);
  const choose=async(type:string)=>{
   await form.locator('label').filter({has:page.locator(`input[name="type"][value="${type}"]`)}).click();
   await expect(form.locator('input[name="type"]:checked')).toHaveValue(type);
  };
  // These controls start in SSR: prove the change handler has hydrated.
  await expect(async()=>{
   await choose('accommodation');
   await expect(form.locator('input[name="guests"]')).toBeEnabled({timeout:1000});
  }).toPass();
  await form.locator('input[name="guests"]').fill('4');
  await form.locator('input[name="maxPrice"]').fill('2500');
  await choose('event');
  await expect(form.locator('input[name="guests"]')).toBeDisabled();
  const fields=await form.evaluate(f=>Array.from(new FormData(f as HTMLFormElement).entries()));
  expect(fields.filter(([name])=>name==='type')).toEqual([['type','event']]);
  expect(fields).toContainEqual(['q','coffee']);expect(fields).toContainEqual(['pet','1']);expect(fields).toContainEqual(['lang',lang]);
  expect(fields.some(([name])=>['guests','maxPrice','checkIn','checkOut','sort','capacity'].includes(name))).toBe(false);
  await choose('cafe');await form.locator('input[name="type"]:checked').focus();await page.keyboard.press('ArrowRight');
  await expect(form.locator('input[name="type"]:checked')).toHaveValue('attraction');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`homepage uses the same icon choices ${lang}`,async({page})=>{
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  await page.goto(`/?lang=${lang}`);
  const form=page.locator('form[action="/search"]');await expect(form.locator('input[name="type"]')).toHaveCount(7);
  await expect(async()=>{
   await form.locator('label').filter({has:page.locator('input[value="event"]')}).click();
   await expect(form.locator('input[name="type"]:checked')).toHaveValue('event',{timeout:1000});
  }).toPass();
  await form.locator('input[name="q"]').fill('coffee');
  const fields=await form.evaluate(f=>Array.from(new FormData(f as HTMLFormElement).entries()));
  expect(fields.filter(([name])=>name==='type')).toEqual([['type','event']]);expect(fields).toContainEqual(['lang',lang]);expect(fields).toContainEqual(['q','coffee']);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
}
