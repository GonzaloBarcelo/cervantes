import {test,expect} from '@playwright/test';
test('M7 mock voice, listening, speaking, interruption, and repeat turn',async({page})=>{
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.click('#mic');await expect(page.locator('#state')).toHaveText('Os escucho…');
 await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
 await expect(page.locator('#subtitle')).toContainText('Quijote');
 await page.screenshot({path:'../reports/m7-flow-speaking.png',fullPage:true});
 await page.click('#interrupt');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.waitForTimeout(100);await expect(page.locator('#avatar')).toHaveAttribute('data-viseme','sil');
 await page.fill('#message','¿Sois una inteligencia artificial?');await page.press('#message','Enter');
 await expect(page.locator('#subtitle')).toContainText('inteligencia artificial');
 await expect(page.locator('#state')).toHaveText('A vuestra escucha',{timeout:15000});
});
test('browser permission error and camera denial are recoverable',async({page})=>{
 await page.addInitScript(()=>{
  class Recognition {lang='';continuous=false;interimResults=false;onerror?:(e:{error:string})=>void;onend?:()=>void;start(){this.onerror?.({error:'not-allowed'});this.onend?.();}stop(){}abort(){}}
  Object.defineProperty(window,'SpeechRecognition',{value:Recognition});
  Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:()=>Promise.reject(new DOMException('Denied','NotAllowedError'))});
 });
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.selectOption('#stt','browser');await expect(page.locator('#hint')).toContainText('naturalidad');
 await page.click('#mic');await expect(page.locator('#notice')).toContainText('No se ha permitido el micrófono');
 await page.click('#camera');await expect(page.locator('#notice')).toContainText('No se pudo activar el seguimiento');
 await page.screenshot({path:'../reports/m7-permission-error.png',fullPage:true});
 await page.fill('#message','Hola');await page.press('#message','Enter');await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
});
test('browser recognition sends finalized speech through the pipeline',async({page})=>{
 await page.addInitScript(()=>{
  class Recognition {lang='';continuous=false;interimResults=false;onresult?:(e:unknown)=>void;onend?:()=>void;onspeechend?:()=>void;start(){setTimeout(()=>{this.onspeechend?.();this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Háblame de Lepanto'}}]});this.onend?.();},100);}stop(){}abort(){}}
  Object.defineProperty(window,'SpeechRecognition',{value:Recognition});
 });
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.selectOption('#stt','browser');await expect(page.locator('#hint')).toContainText('naturalidad');
 await page.click('#mic');await expect(page.locator('#transcript')).toContainText('Lepanto');await expect(page.locator('#state')).toHaveText('Cervantes está hablando');
});
test('WebGL unavailable falls back to the portrait',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:any[]){if(type.startsWith('webgl'))return null;return original.apply(this,[type,...args] as any);} as any;});
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.selectOption('#face','bust3d');await expect(page.locator('#avatar svg')).toBeVisible();await expect(page.locator('#notice')).toContainText('Se ha abierto el retrato animado');
});
test('connection loss displays a recoverable Spanish error',async({page})=>{
 await page.routeWebSocket('**/ws',socket=>socket.close());
 await page.goto('/');await expect(page.locator('#notice')).toContainText('No se pudo conectar');
 await expect(page.locator('#state')).toHaveText('Conexión interrumpida');
});
