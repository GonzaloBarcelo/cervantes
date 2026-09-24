import {test,expect} from '@playwright/test';
for(const milestone of [0,1,2,5,6,9]){
 test(`documentary evidence M${milestone}`,async({page})=>{
  await page.goto(`/reports/milestones/m${milestone}.html`);await expect(page.locator('h1')).toContainText(`M${milestone}`);
  await page.screenshot({path:`../reports/m${milestone}-documentary.png`,fullPage:true});
 });
}
test('offline gallery artifacts are navigable',async({page})=>{
 await page.goto('/reports/');await expect(page.locator('h1')).toContainText('comprobado');
 expect(await page.locator('section').count()).toBe(10);
 const broken=await page.locator('img').evaluateAll(images=>images.filter(image=>(image as HTMLImageElement).complete&&!(image as HTMLImageElement).naturalWidth).map(image=>image.getAttribute('src')));
 expect(broken).toEqual([]);
 await page.screenshot({path:'../reports/m8-gallery.png',fullPage:true});
});
