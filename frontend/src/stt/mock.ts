import type { STTModule } from '../contracts';
import { es as t } from '../i18n';
export class MockSTT implements STTModule {
 private timer?:ReturnType<typeof setTimeout>;
 private end?:()=>void;
 start(onText:(text:string,elapsed:number)=>void,_onError:(message:string)=>void,onEnd:()=>void){this.dispose();this.end=onEnd;this.timer=setTimeout(()=>{onText(t.mockQuestion,12);onEnd();this.timer=undefined;},350);}
 stop(){this.dispose();this.end?.();}
 dispose(){clearTimeout(this.timer);this.timer=undefined;}
}
