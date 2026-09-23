import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
import path from 'node:path';
test('every AvatarModule and STTModule satisfies its lifecycle contract',async({page})=>{
 const result=await build({stdin:{contents:`
 import {avatars} from './src/avatars/registry';
 import {MockSTT} from './src/stt/mock';
 import {BrowserSTT} from './src/stt/browser';
 (async()=>{
 const checks=[];
 const clock=new AudioContext();await clock.resume();
 for(const [name,factory] of Object.entries(avatars)){
  const host=document.createElement('div');host.style.cssText='width:320px;height:320px';document.body.append(host);
  const avatar=factory();avatar.mount(host);avatar.lookAt(.5,-.3);avatar.setMood('ironic');
  avatar.speak({clock,start:clock.currentTime+.02,duration:3,samples:new Float32Array(72000).fill(.1),sampleRate:24000,visemes:[{viseme:'aa',start:0,end:3,weight:1}],alignment:{characters:['a'],starts:[0],ends:[3]},mood:'ironic',text:'a'});
  const deadline=performance.now()+2000;
  while(host.dataset.viseme!=='aa'&&performance.now()<deadline)await new Promise(r=>requestAnimationFrame(r));
  if(host.dataset.viseme!=='aa')throw new Error(name+' did not animate; clock='+clock.currentTime+' state='+clock.state+' viseme='+host.dataset.viseme);
  avatar.interrupt();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
  if(host.dataset.viseme!=='sil')throw new Error(name+' did not interrupt');
  avatar.dispose();if(host.children.length)throw new Error(name+' leaked DOM');host.remove();checks.push(name);
 }
 let fake;
 for(const [name,module] of [['mock',new MockSTT()],['browser',new BrowserSTT(()=>fake={start(){setTimeout(()=>{this.onspeechend?.();this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Hola'}}]});this.onend?.();},20)},stop(){this.onend?.()},abort(){}})]]){
  const text=await new Promise((resolve,reject)=>module.start((text)=>resolve(text),reject,()=>{}));if(!text)throw new Error(name+' empty transcript');module.stop();module.dispose();checks.push(name);
 }
 await clock.close();window.contractResult={ok:true,checks};
 })().catch(e=>window.contractResult={ok:false,error:String(e)});
 `,resolveDir:process.cwd(),loader:'ts'},bundle:true,format:'iife',write:false});
 await page.goto('/lab');await expect(page.locator('#state')).toHaveText('A vuestra escucha');
 await page.addScriptTag({content:result.outputFiles[0].text});
 await page.waitForFunction(()=>Boolean((window as any).contractResult));
 expect(await page.evaluate(()=>(window as any).contractResult)).toEqual({ok:true,checks:['portrait2d','bust3d','mock','browser']});
});
