import type { STTModule } from '../contracts';
import { BrowserSTT } from './browser';
import { MockSTT } from './mock';
export const sttModules:Record<string,()=>STTModule>={browser:()=>new BrowserSTT(),mock:()=>new MockSTT()};
