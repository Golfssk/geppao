import {test,expect,type Page,type Locator} from '@playwright/test';

async function camera(map:Locator){return (await map.getAttribute('viewBox'))!.trim().split(/\s+/).map(Number)}
async function drag(page:Page,map:Locator,dx:number,dy:number){
 await map.scrollIntoViewIfNeeded();const box=(await map.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 await page.mouse.down({button:'right'});
 await expect(map).toHaveAttribute('data-map-panning','true');
 await page.mouse.move(box.x+box.width/2+dx,box.y+box.height/2+dy,{steps:8});
 await page.mouse.up({button:'right'});
 await expect(map).not.toHaveAttribute('data-map-panning');
}
for(const lang of ['en','th'])test(`right mouse drag pans country and province without activating pins ${lang}`,async({page,isMobile})=>{
 test.skip(isMobile,'Right mouse gestures target a desktop mouse; touch remains native.');
 await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());
 await page.goto(`/?lang=${lang}`);
 const country=page.locator('svg').filter({has:page.locator('[data-province]')});
 await expect(country).toBeVisible();await expect(page.locator('[data-province]')).toHaveCount(77);
 const list=page.getByRole('button',{name:lang==='en'?'List':'รายชื่อ',exact:true});
 await expect(async()=>{await list.click();await expect(list).toHaveAttribute('aria-pressed','true',{timeout:1000})}).toPass();
 await page.getByRole('button',{name:lang==='en'?'Map':'แผนที่',exact:true}).click();
 await page.evaluate(()=>{(window as any).mapContexts=[];document.addEventListener('contextmenu',e=>(window as any).mapContexts.push(e.defaultPrevented))});
 // Panning also works at fit; reset is exact and wheel zoom still works afterward.
 const fit=await camera(country);await drag(page,country,18,12);
 expect((await camera(country))[0]).toBeLessThan(fit[0]);
 await page.getByRole('button',{name:lang==='en'?'Reset zoom':'คืนขนาด',exact:true}).click();
 expect(await camera(country)).toEqual(fit);
 const initial=await camera(country);const box=(await country.boundingBox())!;
 await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,-240);
 await expect.poll(async()=>(await camera(country))[2]).toBeLessThan(initial[2]);
 const before=await camera(country);await drag(page,country,30,20);const after=await camera(country);
 expect(after[0]).toBeLessThan(before[0]);expect(after[1]).toBeLessThan(before[1]);expect(after.slice(2)).toEqual(before.slice(2));
 await expect(page.locator('[data-province-view]')).toHaveCount(0);
 expect(await page.evaluate(()=>(window as any).mapContexts)).toContain(true);
 // Normal primary click still opens the province after a completed right drag.
 await page.locator('[data-province="nakhon-ratchasima"]').click({force:true});
 const province=page.locator('[data-province-view="nakhon-ratchasima"]');await expect(province).toBeVisible();
 const map=province.locator('svg[role="img"]');await expect(map).toBeVisible();
 const provinceFit=await camera(map);await drag(page,map,18,12);
 expect((await camera(map))[0]).toBeLessThan(provinceFit[0]);
 await province.getByRole('button',{name:lang==='en'?'Fit province':'ดูทั้งจังหวัด',exact:true}).click();expect(await camera(map)).toEqual(provinceFit);
 await province.getByRole('button',{name:lang==='en'?'Zoom in':'ขยาย',exact:true}).click();
 const pbefore=await camera(map);await drag(page,map,-24,-18);const pafter=await camera(map);
 expect(pafter[0]).toBeGreaterThan(pbefore[0]);expect(pafter[1]).toBeGreaterThan(pbefore[1]);expect(pafter.slice(2)).toEqual(pbefore.slice(2));
 // Loss of focus cancels capture rather than leaving the map stuck in dragging mode.
 const pbox=(await map.boundingBox())!;await page.mouse.move(pbox.x+pbox.width/2,pbox.y+pbox.height/2);await page.mouse.down({button:'right'});
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(map).not.toHaveAttribute('data-map-panning');await page.mouse.up({button:'right'});
 const stopped=await camera(map);await page.mouse.move(pbox.x+pbox.width/2+20,pbox.y+pbox.height/2+20);expect(await camera(map)).toEqual(stopped);
 await province.getByRole('button',{name:lang==='en'?'Fit province':'ดูทั้งจังหวัด',exact:true}).click();
 expect((await camera(map))[2]).toBeGreaterThan(pafter[2]);
});
