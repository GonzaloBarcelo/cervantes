import './style.css';
import { es as t } from './i18n';
import { avatars } from './avatars/registry';
import type { AvatarModule, STTModule, Settings, Speech } from './contracts';
import { AudioPlayer, type AudioPacket } from './audio';

import { sttModules } from './stt/registry';
import { HeadTracking } from './tracking';

const lab = location.pathname === '/lab';
const micIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>`;
const feather = `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor"><path d="M8 34C18 21 17 8 34 4c-1 16-10 22-20 24M11 30L29 10M18 22l1-9M20 20l9-2" stroke-width="1.4"/></svg>`;
const controls = `<div class="speech-controls"><button id="mic" class="mic" aria-label="${t.mic}">${micIcon}</button><div><div id="state" role="status">${t.connecting}</div><p id="hint">${t.hint}</p></div><button id="interrupt" class="interrupt" disabled aria-label="${t.stop}">■ <span>${t.stop}</span></button></div><form id="chat-form"><input id="message" maxlength="2000" aria-label="${t.write}" placeholder="${t.placeholder}" autocomplete="off"/><button aria-label="${t.send}" title="${t.send}">↗</button></form>`;
const scene = `<div class="art-panel"><div class="art-top"><span>${t.artTitle}</span><span class="live-dot">${t.live}</span></div><div class="painting-frame"><div id="avatar"></div><div class="canvas-shade"></div></div><div class="art-caption"><span class="small-diamond">✦</span><div><h2>${t.portrait}</h2><p>${t.portraitSub}</p></div><span class="small-diamond">✦</span></div><div class="candle"><i></i><b></b></div></div>`;
const settingsPanel = `<section class="panel module-panel"><div class="section-label">01 / ${t.modules}</div><div class="selectors"><label>${t.face}<select id="face"><option value="portrait2d">${t.portraitOption}</option><option value="bust3d">${t.bustOption}</option></select></label><label>${t.voice}<select id="tts"><option value="mock">${t.mockOption}</option><option value="elevenlabs">ElevenLabs</option></select></label><label>${t.voiceId}<input id="voice-id" placeholder="${t.voiceId}" list="voices"/><datalist id="voices"><option value="warm"><option value="bright"></datalist></label><label>${t.model}<select id="llm"><option value="mock">${t.mockOption}</option><option value="anthropic">Anthropic · Claude</option></select></label><label>${t.modelId}<input id="model-id"/></label><label>${t.recognition}<select id="stt"><option value="mock">${t.mockOption}</option><option value="browser">${t.browserOption}</option></select></label></div><div id="module-status" class="module-status"></div></section>`;
const playbackPanel = `<section class="panel timeline-panel"><div class="section-label">02 / ${t.timeline}</div><div class="timeline-info"><span id="viseme">${t.viseme}: sil</span><span id="mood">${t.mood}: ${t.moods.warm}</span></div><canvas id="timeline" aria-label="${t.timeline}" height="160"></canvas><div id="timeline-time">0.00 s</div><p class="muted">${t.idleTimeline}</p></section><section class="panel"><div class="section-label">03 / ${t.latency}</div><div id="latencies" class="latencies">${[t.sttLatency,t.llmLatency,t.ttsLatency,t.firstAudio,t.totalLatency].map((label,i)=>`<div><span>${label}</span><strong id="lat-${i}">—</strong></div>`).join('')}</div></section><section class="panel"><div class="section-label">04 / ${t.transcript}</div><div id="transcript" class="transcript"><p class="muted">${t.emptyTranscript}</p></div></section><section class="panel"><div class="section-label">05 / ${t.logs}</div><ol id="logs" class="logs"></ol></section>`;
document.querySelector('#app')!.innerHTML = `<header class="site-header"><a class="brand" href="/">${feather}<span>${t.brand}<em>${t.brandAccent}</em></span></a><nav><a href="/" class="${lab?'':'selected'}">${t.salon}</a><a href="/lab" class="${lab?'selected':''}">${t.lab}</a><a href="/reports/">${t.evidence}<span> ↗</span></a></nav><span class="header-edition">${t.established}</span></header><main class="${lab?'lab-page':'salon-page'}">${lab?`<div class="lab-heading"><p class="eyebrow">${t.labEyebrow}</p><h1>${t.labTitle}</h1><p>${t.labIntro}</p></div><div class="lab-grid"><div class="lab-preview">${scene}<div class="preview-controls">${controls}<button class="phrase" id="test-phrase">${t.test} ↗</button></div></div><div class="lab-workbench">${settingsPanel}${playbackPanel}</div></div>`:`<div class="salon-grid"><section class="invitation"><p class="eyebrow">${t.edition}</p><h1>${t.title}<br/><em>${t.titleItalic}</em></h1><div class="flourish"><span></span>✦<span></span></div><p class="intro">${t.intro}</p><div class="topic-group"><p class="section-label">${t.topicLabel}</p>${t.topics.map((topic,i)=>`<button class="topic" data-topic="${i}"><span class="topic-number">0${i+1}</span>${topic}<span class="topic-arrow">↗</span></button>`).join('')}</div><p class="place-date">${t.eyebrow}</p></section><section class="encounter">${scene}<div class="subtitle" aria-live="polite"><span class="quote-mark">“</span><p id="subtitle">${t.invitation}<br/>${t.invitationEnd}</p><small id="quote-note">${t.quoteNote}</small></div>${controls}</section></div>`}<div class="bottom-row"><span id="mode-badge" class="mode-badge">${t.mockHint}</span><button id="camera" class="camera" title="${t.cameraNote}">◎ ${t.camera}</button></div><div id="notice" class="notice" role="alert" hidden></div></main><footer><span>${t.footer}</span><span>${t.ai}</span></footer>`;
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let avatar: AvatarModule;
let recognition: STTModule | undefined;
const tracking=new HeadTracking();
let trackingEnabled=false;
let settings: Settings;
let ws: WebSocket;
let activeTurn=0, state='connecting', generated=false, connected=false;
let speeches: Speech[]=[];
let trace: Speech[]=[];
let subtitleCursor=-1;
let subtitleText='', transcriptEmpty=true, assistantLine: HTMLParagraphElement | undefined;
const player = new AudioPlayer();
function notice(message: string) { $('notice').textContent=message; $('notice').hidden=!message; }
function log(message: string) { if(!lab)return;const item=document.createElement('li');item.textContent=`${new Date().toLocaleTimeString('es-ES')} · ${message}`;$('logs').prepend(item);while($('logs').children.length>30)$('logs').lastElementChild?.remove(); }
function setState(next: string) { state=next;$('state').textContent=({ready:t.ready,listening:t.listening,thinking:t.thinking,speaking:t.speaking,connecting:t.connecting,disconnected:t.disconnected} as Record<string,string>)[next];$('mic').dataset.state=next;($('interrupt') as HTMLButtonElement).disabled=!['thinking','speaking','listening'].includes(next); }
function mountFace(name: string) { avatar?.dispose();try{avatar=(avatars[name]??avatars.portrait2d)();avatar.mount($('avatar'));}catch{avatar?.dispose();avatar=avatars.portrait2d();avatar.mount($('avatar'));notice(t.fallback);} }
function stopLocal() { player.stop();avatar?.interrupt();speeches=[];generated=false;setState(connected?'ready':'disconnected'); }
function send(data: object) { if(ws?.readyState!==WebSocket.OPEN){notice(t.networkError);return false;}ws.send(JSON.stringify(data));return true; }
function transcript(role: string, text: string) { if(!lab)return; if(transcriptEmpty){$('transcript').replaceChildren();transcriptEmpty=false;}const p=document.createElement('p');const label=document.createElement('b');label.textContent=role+' · ';p.append(label,document.createTextNode(text));$('transcript').append(p);if(role===t.character)assistantLine=p;$('transcript').scrollTop=$('transcript').scrollHeight; }
async function ask(text: string, stt_ms=0) { if(!text.trim())return;try{await player.unlock();}catch{notice(t.audioError);return;}recognition?.dispose();stopLocal();notice('');trace=[];subtitleCursor=-1;assistantLine=undefined;activeTurn=Number.MAX_SAFE_INTEGER;if(send({type:'chat',text,stt_ms})){setState('thinking');transcript(t.self,text);$('message').textContent='';} }
function updateSettings(data: {settings:Settings;modules:Record<string,{name:string;status:string}[]>}) {
 const previous=settings;settings=data.settings;
 if(!previous||previous.avatar_module!==settings.avatar_module)mountFace(settings.avatar_module);
 if(!previous||previous.stt_module!==settings.stt_module){recognition?.dispose();recognition=(sttModules[settings.stt_module]??sttModules.browser)();}
 $('mode-badge').textContent=settings.tts_provider==='mock'?t.mockHint:t.liveHint;
 $('hint').textContent=settings.stt_module==='mock'?t.mockHint:t.hint;
 if(lab){for(const [id,names] of Object.entries({face:Object.keys(avatars),llm:data.modules.llm.map(m=>m.name),tts:data.modules.tts.map(m=>m.name),stt:Object.keys(sttModules)})){const select=$<HTMLSelectElement>(id);for(const name of names){if(![...select.options].some(o=>o.value===name))select.add(new Option(name,name));}}const ids: Record<string,keyof Settings>={face:'avatar_module',tts:'tts_provider','voice-id':'tts_voice',llm:'llm_provider','model-id':'llm_model',stt:'stt_module'};Object.entries(ids).forEach(([id,key])=>($<HTMLInputElement>(id).value=settings[key]));$('module-status').replaceChildren();Object.entries(data.modules).forEach(([kind,items])=>items.forEach(item=>{const b=document.createElement('span');b.className=`status-badge ${item.status}`;b.textContent=`${kind.toUpperCase()} ${item.name} · ${t[item.status as 'active'|'mock'|'missing_key']}`;$('module-status').append(b);}));}
}
function connect(){ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.type==='ready'||data.type==='configured'){connected=true;if(data.type==='configured'){stopLocal();sessionStorage.setItem('cervantes-modules',JSON.stringify(data.settings));}updateSettings(data);setState('ready');if(data.type==='ready'){const saved=sessionStorage.getItem('cervantes-modules');if(saved){try{const values=JSON.parse(saved);const allowed=['llm_provider','llm_model','tts_provider','tts_voice','avatar_module','stt_module'];send({type:'configure',settings:Object.fromEntries(allowed.map(k=>[k,values[k]]))});}catch{sessionStorage.removeItem('cervantes-modules');}}}log(data.type==='ready'?t.connected:t.switched);return;}if(data.type==='started'||data.type==='interrupted'){activeTurn=data.turn;if(data.type==='interrupted'){if(state!=='listening')stopLocal();log(t.interrupted);}return;}if(data.turn!==undefined&&data.turn!==activeTurn)return;
 if(data.type==='state')setState(data.state);
 if(data.type==='sentence'){if(lab){if(!assistantLine)transcript(t.character,data.text);else assistantLine.append(document.createTextNode(' '+data.text));}}
 if(data.type==='audio'){try{const speech=player.schedule(data as AudioPacket);speeches.push(speech);trace.push(speech);avatar.speak(speech);setState('speaking');}catch{notice(t.audioError);stopLocal();}}
 if(data.type==='done'){generated=true;log(`${t.firstAudio}: ${data.latency.first_audio_ms} ms`);if(lab){['stt_ms','llm_first_token_ms','tts_first_audio_ms','first_audio_ms','total_ms'].forEach((k,i)=>$(`lat-${i}`).textContent=`${data.latency[k]??'—'} ms`);}}
 if(data.type==='error'){notice(data.message);log(data.code??data.message);stopLocal();}
 };ws.onclose=()=>{connected=false;recognition?.dispose();stopLocal();notice(t.networkError);};ws.onerror=()=>notice(t.networkError);}
$('chat-form').addEventListener('submit',event=>{event.preventDefault();const input=$<HTMLInputElement>('message');void ask(input.value);input.value='';});
document.querySelectorAll<HTMLButtonElement>('[data-topic]').forEach(button=>button.onclick=()=>void ask(t.questions[Number(button.dataset.topic)]));
$('interrupt').onclick=()=>{recognition?.dispose();send({type:'interrupt'});activeTurn=Number.MAX_SAFE_INTEGER;stopLocal();};
$('mic').onclick=async()=>{
 if(!connected){notice(t.networkError);return;}
 if(state==='listening'){recognition?.stop();return;}
 try{await player.unlock();}catch{notice(t.audioError);return;}
 send({type:'interrupt'});stopLocal();notice('');setState('listening');
 recognition?.start((text,elapsed)=>void ask(text,elapsed),message=>notice(message),()=>{if(state==='listening')setState('ready');});
};
$('camera').onclick=async()=>{
 trackingEnabled=!trackingEnabled;$('camera').textContent=trackingEnabled?'◎ '+t.cameraOff:'◎ '+t.camera;
 if(!trackingEnabled){tracking.stop();avatar.lookAt(0,0);return;}
 try{await tracking.start((x,y)=>avatar.lookAt(x,y));}catch{trackingEnabled=false;$('camera').textContent='◎ '+t.camera;notice(t.cameraError);avatar.lookAt(0,0);}
};
if(lab){$('test-phrase').onclick=()=>void ask(t.mockQuestion);const ids: Record<string,keyof Settings>={face:'avatar_module',tts:'tts_provider','voice-id':'tts_voice',llm:'llm_provider','model-id':'llm_model',stt:'stt_module'};Object.entries(ids).forEach(([id,key])=>$<HTMLInputElement>(id).onchange=()=>{stopLocal();send({type:'configure',settings:{[key]:$<HTMLInputElement>(id).value}});});}
function drawTimeline(speech:Speech,pos:number){
 const canvas=$<HTMLCanvasElement>('timeline'),ctx=canvas.getContext('2d')!;
 canvas.width=canvas.clientWidth*devicePixelRatio;canvas.height=150*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);
 const w=canvas.clientWidth,origin=trace[0].start,duration=trace.at(-1)!.start+trace.at(-1)!.duration-origin,playhead=speech.start-origin+pos;
 ctx.fillStyle='#20251f';ctx.fillRect(0,0,w,150);
 for(const segment of trace){const offset=segment.start-origin,segmentWidth=segment.duration/duration*w;
  ctx.strokeStyle='#bc9860';ctx.beginPath();
  for(let x=0;x<segmentWidth;x++){const i=Math.floor(x/segmentWidth*segment.samples.length);ctx.lineTo(offset/duration*w+x,39+segment.samples[i]*150);}ctx.stroke();
  for(const cue of segment.visemes){const x=(offset+cue.start)/duration*w,width=(cue.end-cue.start)/duration*w;ctx.fillStyle=playhead>=offset+cue.start&&playhead<offset+cue.end?'#e0bf8d':'#515943';ctx.fillRect(x,74,Math.max(1,width-.5),29);if(width>15){ctx.fillStyle='#ede2cc';ctx.font='9px monospace';ctx.fillText(cue.viseme,x+2,93);}}
  const colors={warm:'#826d4a',ironic:'#626b43',serious:'#566777',thoughtful:'#6c5a70',joyful:'#937543'};
  ctx.fillStyle=colors[segment.mood];ctx.fillRect(offset/duration*w,116,segmentWidth,18);
  if(segmentWidth>55){ctx.fillStyle='#f4e5c7';ctx.fillText(t.moods[segment.mood],offset/duration*w+4,129);}
 }
 ctx.strokeStyle='#f6ecd6';ctx.beginPath();ctx.moveTo(playhead/duration*w,0);ctx.lineTo(playhead/duration*w,146);ctx.stroke();
 $('timeline-time').textContent=`${playhead.toFixed(2)} / ${duration.toFixed(2)} s`;
}
function animate(){const s=speeches.find(s=>s.clock.currentTime>=s.start&&s.clock.currentTime<s.start+s.duration);if(s){const pos=s.clock.currentTime-s.start;if(!lab){const index=s.alignment.starts.findLastIndex(start=>start<=pos);const cursor=Math.min(s.text.length,s.charOffset+Math.max(0,index)+1);if(s.text!==subtitleText||cursor!==subtitleCursor){subtitleText=s.text;subtitleCursor=cursor;const spoken=document.createElement('span'),upcoming=document.createElement('span');spoken.className='spoken';upcoming.className='upcoming';spoken.textContent=s.text.slice(0,cursor);upcoming.textContent=s.text.slice(cursor);$('subtitle').replaceChildren(spoken,upcoming);$('quote-note').textContent='';}}if(lab){drawTimeline(s,pos);$('viseme').textContent=`${t.viseme}: ${$('avatar').dataset.viseme}`;$('mood').textContent=`${t.mood}: ${t.moods[s.mood]}`;}}if(generated&&!player.pending){generated=false;setState('ready');}speeches=speeches.filter(s=>s.clock.currentTime<s.start+s.duration+.1);requestAnimationFrame(animate);}
window.addEventListener('beforeunload',()=>{avatar?.dispose();recognition?.dispose();tracking.stop();player.dispose();ws?.close();});
connect();animate();
