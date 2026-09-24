import type { Speech, Alignment, VisemeCue, Mood } from './contracts';
export interface AudioPacket { sequence: number; pcm: string; sample_rate: number; alignment: Alignment; visemes: VisemeCue[]; mood: Mood; text: string }
export class AudioPlayer {
  context?: AudioContext;
  private next = 0;
  private sequence = -1;
  private charOffset = 0;
  private sources = new Set<AudioBufferSourceNode>();
  async unlock() { this.context ??= new AudioContext(); await this.context.resume(); }
  schedule(packet: AudioPacket): Speech {
    if (!this.context) throw new Error('Audio is not unlocked');
    const raw = atob(packet.pcm);
    const bytes = Uint8Array.from(raw, c=>c.charCodeAt(0));
    const view = new DataView(bytes.buffer);
    const samples = new Float32Array(bytes.length/2);
    for(let i=0;i<samples.length;i++) samples[i]=view.getInt16(i*2,true)/32768;
    const buffer = this.context.createBuffer(1,samples.length,packet.sample_rate);
    buffer.copyToChannel(samples,0);
    const source = this.context.createBufferSource();
    source.buffer = buffer; source.connect(this.context.destination);
    const start = Math.max(this.context.currentTime+.045,this.next);
    this.next = start+buffer.duration;
    source.start(start); this.sources.add(source);
    source.onended=()=>{this.sources.delete(source);source.disconnect();};
    if(packet.sequence!==this.sequence){this.sequence=packet.sequence;this.charOffset=0;}
    const charOffset=packet.alignment.offset??this.charOffset;this.charOffset=charOffset+packet.alignment.characters.length;
    return {charOffset,clock:this.context,start,duration:buffer.duration,samples,sampleRate:packet.sample_rate,visemes:packet.visemes,alignment:packet.alignment,mood:packet.mood,text:packet.text};
  }
  get pending() { return this.sources.size>0; }
  stop() { for(const s of this.sources){s.stop();s.disconnect();} this.sources.clear();this.next=0;this.sequence=-1;this.charOffset=0; }
  dispose() { this.stop(); void this.context?.close(); }
}
