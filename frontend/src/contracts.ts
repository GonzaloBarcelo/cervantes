export type Mood = 'warm' | 'ironic' | 'serious' | 'thoughtful' | 'joyful';
export type Viseme = 'sil'|'PP'|'FF'|'TH'|'DD'|'kk'|'CH'|'SS'|'nn'|'RR'|'aa'|'E'|'I'|'O'|'U';
export interface VisemeCue { viseme: Viseme; start: number; end: number; weight: number }
export interface Alignment { characters: string[]; starts: number[]; ends: number[] }
export interface Speech { clock: AudioContext; start: number; duration: number; samples: Float32Array; sampleRate: number; visemes: VisemeCue[]; alignment: Alignment; mood: Mood; text: string }
export interface AvatarModule {
  mount(container: HTMLElement): void;
  speak(audio: Speech): void;
  setMood(mood: Mood): void;
  lookAt(x: number, y: number): void;
  interrupt(): void;
  dispose(): void;
}
export interface STTModule {
  start(onText: (text: string, elapsed: number) => void, onError: (message: string) => void, onEnd: () => void): void;
  stop(): void;
  dispose(): void;
}
export interface Settings { llm_provider: string; llm_model: string; tts_provider: string; tts_voice: string; avatar_module: string; stt_module: string }
