import {test,expect} from '@playwright/test';
for(const width of [1440,390])for(const face of ['portrait2d','bust3d'])for(const route of ['/','/lab']){
 test(`M8 ${route} ${face} ${width}`,async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewportSize({width,height:width===390?844:1100});
  await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
  await page.selectOption('#face',face);
  await expect(page.locator(face==='bust3d'?'#avatar canvas':'#avatar svg')).toBeVisible();
  if(route==='/'){await page.goto('/');await expect(page.locator(face==='bust3d'?'#avatar canvas':'#avatar svg')).toBeVisible();}
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`../reports/m8-${route==='/'?'salon':'lab'}-${face}-${width===390?'mobile':'desktop'}.png`,fullPage:true});
  await page.click('#mic');await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
  if(route==='/lab'){await expect(page.locator('#lat-3')).not.toHaveText('—');await page.screenshot({path:`../reports/m8-lab-${face}-${width===390?'mobile':'desktop'}-timeline.png`,fullPage:true});}
  await page.click(route==='/'?'#mic':'#interrupt');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
  expect(errors).toEqual([]);
 });
}
test('live selections, missing key, recovery and module status',async({page})=>{
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await expect(page.locator('#module-status')).toContainText('anthropic');
 await page.selectOption('#llm','anthropic');await page.fill('#model-id','claude-haiku-4-5-20251001');await page.press('#model-id','Tab');
 await page.click('#test-phrase');await expect(page.locator('#notice')).toContainText('Revisad las claves');
 await page.selectOption('#llm','mock');await page.selectOption('#tts','elevenlabs');await page.click('#test-phrase');await expect(page.locator('#notice')).toContainText('Revisad las claves');
 await page.selectOption('#tts','mock');await page.fill('#voice-id','bright');await page.press('#voice-id','Tab');
 await page.click('#test-phrase');await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
 await expect(page.locator('#voice-id')).toHaveValue('bright');
});
