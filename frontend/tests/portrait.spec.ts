import {test,expect} from '@playwright/test';
test('M3 portrait frames follow scheduled audio',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.screenshot({path:'../reports/m3-portrait-idle.png',fullPage:true});
 await page.getByRole('button',{name:'Hablar con Cervantes',exact:true}).click();
 await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
 for(const v of ['aa','O','PP']){
  await page.waitForFunction(v=>document.querySelector('#avatar')?.getAttribute('data-viseme')===v,v);
  await page.screenshot({path:`../reports/m3-mouth-${v}.png`});
 }
 await page.getByRole('button',{name:'Interrumpir',exact:true}).click();
 await expect(page.locator('#state')).toHaveText('A vuestra escucha');
});
