import {test,expect} from '@playwright/test';

for(const lang of ['th','en'] as const){
 test(`compact category icons and labels stay on one row ${lang}`,async({page})=>{
  await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
  for(const path of ['/', '/search']){
   await page.goto(`${path}?lang=${lang}`);
   const form=page.locator('form[action="/search"]');
   const choices=form.locator('label').filter({has:page.locator('input[type="radio"][name="type"]')});
   await expect(choices).toHaveCount(7);
   await page.evaluate(()=>document.fonts.ready);
   const boxes=await choices.evaluateAll(labels=>labels.map(label=>{
    const tile=label.querySelector('input + span')!,icon=tile.querySelector('svg')!,text=tile.querySelector('span')!;
    const a=tile.getBoundingClientRect(),b=icon.getBoundingClientRect(),c=text.getBoundingClientRect();
    return{top:a.top,height:a.height,width:a.width,iconWidth:b.width,iconRight:b.right,textLeft:c.left,centerGap:Math.abs((b.top+b.height/2)-(c.top+c.height/2))};
   }));
   for(const box of boxes){
    expect(Math.abs(box.top-boxes[0].top)).toBeLessThan(1);
    expect(box.height).toBeGreaterThanOrEqual(44);expect(box.height).toBeLessThanOrEqual(48);
    expect(box.width).toBeGreaterThan(box.height);expect(box.iconWidth).toBe(22);
    expect(box.textLeft).toBeGreaterThan(box.iconRight);expect(box.centerGap).toBeLessThan(1);
   }
   // The last chip remains reachable in the horizontal rail on touch-sized viewports.
   await choices.last().click();
   await expect(form.locator('input[value="event"]')).toBeChecked();
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
 });
}
