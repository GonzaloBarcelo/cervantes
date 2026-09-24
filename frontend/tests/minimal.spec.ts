import {test,expect} from '@playwright/test';
for(const width of [1440,390]){
 test(`minimal face and one voice button at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width===390?844:1000});
  await page.goto('/');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.locator('header,footer,nav,form,h1,h2,input,select')).toHaveCount(0);
  await expect(page.locator('#avatar svg')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await page.screenshot({path:`../reports/m9-minimal-${width}.png`,fullPage:true});
  await page.click('#mic');await expect(page.locator('#state')).toHaveText('Os escucho…');
  await expect(page.getByRole('button',{name:'Interrumpir',exact:true})).toBeVisible();
  await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
  await page.click('#mic');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 });
}
