import asyncio
import math
import struct
from ...contracts import Alignment, AudioChunk, Message, Persona

class MockLLM:
    async def stream(self, history: list[Message], persona: Persona):
        question = history[-1].content.lower()
        if any(w in question for w in ('inteligencia', 'artificial', 'eres una ia')):
            answer = '[mood:warm] Soy una recreación hecha con inteligencia artificial, buen amigo. Mi voz es nueva, pero mi curiosidad por lo humano tiene ya unos siglos.'
        elif any(w in question for w in ('lepanto', 'argel', 'vida')):
            answer = '[mood:serious] En Lepanto perdí el uso de la mano izquierda, mas no el deseo de contar historias. Los años de cautiverio en Argel me enseñaron cuánto vale la libertad.'
        elif any(w in question for w in ('quijote', 'molino', 'locura')):
            answer = '[mood:ironic] Mi don Quijote vio gigantes donde otros veían molinos. Tal vez todos necesitamos un poco de su locura, siempre que llevemos un Sancho cerca.'
        else:
            answer = '[mood:warm] Acercaos, vuestra merced; siempre queda sitio para una buena conversación. Decidme qué os inquieta, que hasta las dudas hacen compañía junto al fuego.'
        for i in range(0, len(answer), 9):
            await asyncio.sleep(0.004)
            yield answer[i:i + 9]

class MockTTS:
    def __init__(self, sample_rate=24000, voice=''):
        self.sample_rate = sample_rate
        self.frequency = 132 if voice != 'bright' else 196

    async def stream(self, text: str):
        # Each chunk is independently timed PCM; no external speech engine needed.
        seconds = 0.047
        for offset in range(0, len(text), 12):
            chars = list(text[offset:offset + 12])
            audio = bytearray()
            for char in chars:
                count = int(self.sample_rate * seconds)
                frequency = self.frequency + (ord(char) % 7) * 12
                for i in range(count):
                    t = i / self.sample_rate
                    envelope = math.sin(math.pi * i / count) ** 2
                    sample = 0 if not char.isalpha() else int(2100 * envelope * (math.sin(2 * math.pi * frequency * t) + .25 * math.sin(4 * math.pi * frequency * t)))
                    audio.extend(struct.pack('<h', sample))
            await asyncio.sleep(0.006)
            yield AudioChunk(pcm=bytes(audio), sample_rate=self.sample_rate,
                alignment=Alignment(offset=offset, characters=chars, starts=[i * seconds for i in range(len(chars))], ends=[(i + 1) * seconds for i in range(len(chars))]))

class MockSTT:
    async def transcribe(self, payload: str, language: str = 'es-ES') -> str:
        return payload.strip() or '¿Qué nos enseña don Quijote?'
