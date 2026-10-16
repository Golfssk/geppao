import {test,expect} from '@playwright/test';
import {argosScreenshot} from '@argos-ci/playwright';
const fixture={input:'Nature',destination:{id:'synthetic',name:'Khao Yai'},startDate:'2030-01-01',endDate:'2030-01-01',travelers:2,nights:0,tripMode:'day_trip',budget:null,costCoverage:'missing',totalEstimatedCost:0,routeKm:0,routeMinutes:0,preferences:{vibes:[]},items:[{id:'synthetic-place',kind:'place',slug:'synthetic',name:'Synthetic nature stop',type:'attraction',duration:90,cost:null}],days:[{day:1,items:[{id:'synthetic-place',kind:'place',slug:'synthetic',name:'Synthetic nature stop',type:'attraction',duration:90,cost:null}]}],itinerary:[{day:1,id:'synthetic-place',startTime:'09:00'}],limitations:['Synthetic test fixture — not production travel advice']};
test.beforeEach(async({page})=>{await page.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort())});
test('sidebar, accents and draft resume after sign-in boundary',async({page},info)=>{
 await page.route('**/api/planner/v2',route=>route.fulfill({json:{plan:fixture}}));
 await page.route('**/api/trips/from-plan',route=>route.fulfill({status:401,json:{error:'Sign in'}}));
 await page.goto('/planner?lang=en');
 await page.getByLabel('What does your ideal trip feel like?').fill('Nature');
 await page.getByRole('button',{name:'Day trip',exact:true}).click();
 await page.getByLabel('Start date',{exact:true}).fill('2030-01-01');
 await page.getByRole('button',{name:'Create my trip',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Synthetic nature stop'})).toBeVisible();
 await expect(page.getByText('Unknown',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Save this trip'})).toBeEnabled();
 await page.getByRole('button',{name:'Save this trip'}).click();
 await expect(page).toHaveURL(/host\/login\?next=/);
 await page.goto('/planner?lang=en&resume=1');
 await expect(page.getByRole('heading',{name:'Synthetic nature stop'})).toBeVisible();
 await expect(page.getByText('Your draft has been restored on this tab. Review it before saving.')).toBeVisible();
 await page.getByLabel('Travelers',{exact:true}).fill('4');
 await expect(page.getByRole('button',{name:'Save this trip'})).toBeDisabled();
 await expect(page.getByText('Details changed. Create a new plan before saving.')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await expect.poll(()=>page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--rust').trim())).toBe('#b75326');
 if(info.project.name==='mobile'){
  const opener=page.getByRole('button',{name:'Open navigation'});await opener.click();
  const dialog=page.getByRole('dialog',{name:'Main menu'});await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link',{name:'My trips',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();
 }else{
  await expect(page.getByRole('navigation',{name:'Primary navigation'})).toBeVisible();
  await page.getByRole('button',{name:'Collapse sidebar'}).click();await expect(page.getByRole('button',{name:'Expand sidebar'})).toBeVisible();
 }
 await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0)});
 if(info.project.name==='desktop')await page.getByRole('button',{name:'Expand sidebar'}).click();
 await argosScreenshot(page,`planner-draft-${info.project.name}`,{beforeScreenshot:async()=>{await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur();window.scrollTo(0,0)});await expect(page.getByRole('heading',{name:'Synthetic nature stop'})).toBeVisible()}});
 await page.screenshot({path:info.outputPath('planner.png'),fullPage:true});
});
test('homepage removes stories from both navigation and content',async({page})=>{
 await page.goto('/?lang=en');await expect(page.locator('[data-province]')).toHaveCount(77);
 await expect(page.locator('a[href="/stories"]')).toHaveCount(0);
 await expect(page.getByText('Latest stories',{exact:true})).toHaveCount(0);
});
