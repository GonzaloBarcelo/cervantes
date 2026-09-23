import type { AvatarModule, Mood, Speech, Viseme } from '../contracts';
export interface Frame { open: number; round: number; wide: number; blink: number; time: number; x: number; y: number; energy: number; mood: Mood; viseme: Viseme }
export const shapes: Record<Viseme, [number,number,number]> = { sil:[0,0,0], PP:[.02,0,0], FF:[.13,0,.4], TH:[.22,0,.2], DD:[.3,0,.3], kk:[.4,0,.15], CH:[.25,.35,.1], SS:[.12,0,.7], nn:[.2,0,.2], RR:[.3,.1,.4], aa:[.95,0,.25], E:[.48,0,.8], I:[.22,0,1], O:[.68,.85,0], U:[.32,1,0] };
export abstract class AnimatedAvatar implements AvatarModule {
  protected container!: HTMLElement;
  private frameId = 0;
  private queue: Speech[] = [];
  private mood: Mood = 'warm';
  private target = {x:0,y:0};
  private current = {open:0,round:0,wide:0,x:0,y:0};
  mount(container: HTMLElement) { this.container = container; this.create(); this.tick(performance.now()); }
  protected abstract create(): void;
  protected abstract draw(frame: Frame): void;
  protected cleanup() {}
  speak(audio: Speech) { this.queue.push(audio); }
  setMood(mood: Mood) { this.mood = mood; }
  lookAt(x: number, y: number) { this.target = {x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))}; }
  interrupt() { this.queue = []; }
  dispose() { cancelAnimationFrame(this.frameId); this.interrupt(); this.cleanup(); this.container.replaceChildren(); }
  private tick = (ms: number) => {
    const t = ms / 1000;
    this.queue = this.queue.filter(s => s.clock.currentTime <= s.start+s.duration+.08);
    const speech = this.queue.find(s => s.clock.currentTime >= s.start && s.clock.currentTime < s.start+s.duration);
    let target = [0,0,0], energy = 0, viseme: Viseme = 'sil';
    if (speech) {
      this.mood = speech.mood;
      const pos = speech.clock.currentTime-speech.start;
      // 40 ms anticipation and adjacent cue blending provide coarticulation.
      const cue = speech.visemes.find(v => pos+.025 >= v.start && pos < v.end);
      if (cue) {
        viseme = cue.viseme;
        target = [...shapes[viseme]];
        const next = speech.visemes[speech.visemes.indexOf(cue)+1];
        const mix = next ? Math.max(0,1-(cue.end-pos)/.04)*.4 : 0;
        if (next) target = target.map((v,i)=> v*(1-mix)+shapes[next.viseme][i]*mix);
      }
      const start = Math.floor(pos*speech.sampleRate);
      for (let i=start;i<Math.min(start+128,speech.samples.length);i++) energy += speech.samples[i]**2;
      energy = Math.min(1,Math.sqrt(energy/128)*8);
    }
    this.current.open += (target[0]-this.current.open)*.32;
    this.current.round += (target[1]-this.current.round)*.32;
    this.current.wide += (target[2]-this.current.wide)*.32;
    this.current.x += (this.target.x-this.current.x)*.04;
    this.current.y += (this.target.y-this.current.y)*.04;
    const phase = t%4.7;
    const blink = phase < .16 ? Math.sin(phase/.16*Math.PI) : 0;
    this.container.dataset.viseme = viseme;
    this.draw({...this.current,blink,time:t,energy,mood:this.mood,viseme});
    this.frameId = requestAnimationFrame(this.tick);
  };
}
