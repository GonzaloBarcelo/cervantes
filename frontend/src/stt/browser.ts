import type { STTModule } from '../contracts';
import { es as t } from '../i18n';
interface ResultEvent { resultIndex: number; results: { length: number; [index: number]: { isFinal: boolean; [index: number]: { transcript: string } } } }
export interface Recognition {
 lang: string; continuous: boolean; interimResults: boolean;
 onresult: ((event: ResultEvent)=>void)|null; onerror: ((event:{error:string})=>void)|null;
 onend: (()=>void)|null; onspeechend:(()=>void)|null;
 start():void; stop():void; abort():void;
}
export class BrowserSTT implements STTModule {
 private recognition?: Recognition;
 constructor(private factory?: ()=>Recognition) {}
 start(onText:(text:string,elapsed:number)=>void,onError:(message:string)=>void,onEnd:()=>void) {
  this.dispose();
  const browser=window as unknown as {SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
  const Type=browser.SpeechRecognition??browser.webkitSpeechRecognition;
  if(!this.factory&&!Type){onError(t.micUnsupported);onEnd();return;}
  const recognition=this.factory?.()??new Type!();this.recognition=recognition;
  recognition.lang='es-ES';recognition.continuous=false;recognition.interimResults=false;
  let speechEnded=0,delivered=false;
  recognition.onspeechend=()=>{speechEnded=performance.now();};
  recognition.onresult=event=>{let text='';for(let i=event.resultIndex;i<event.results.length;i++){if(event.results[i].isFinal)text+=event.results[i][0].transcript;}if(text.trim()&&!delivered){delivered=true;onText(text.trim(),speechEnded?performance.now()-speechEnded:0);}};
  recognition.onerror=event=>{if(event.error!=='aborted')onError(event.error==='not-allowed'||event.error==='service-not-allowed'?t.micDenied:t.micError);};
  recognition.onend=onEnd;
  try{recognition.start();}catch{onError(t.micError);onEnd();}
 }
 stop(){this.recognition?.stop();}
 dispose(){if(this.recognition){this.recognition.onend=null;this.recognition.onresult=null;this.recognition.onerror=null;this.recognition.abort();this.recognition=undefined;}}
}
