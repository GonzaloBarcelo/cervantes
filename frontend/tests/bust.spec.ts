import {test,expect} from '@playwright/test';
test('M4 bust mounts, animates, and swaps back',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.selectOption('#face','bust3d');await expect(page.locator('#avatar canvas')).toBeVisible();
 await page.waitForTimeout(400);await page.screenshot({path:'../reports/m4-bust-desktop.png',fullPage:true});
 await page.click('#test-phrase');await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
 await page.waitForFunction(()=>document.querySelector('#avatar')?.getAttribute('data-viseme')==='aa');
 await page.screenshot({path:'../reports/m4-bust-speaking.png',fullPage:true});
 await page.click('#interrupt');await page.selectOption('#face','portrait2d');await expect(page.locator('#avatar svg')).toBeVisible();
 expect(errors).toEqual([]);
});
