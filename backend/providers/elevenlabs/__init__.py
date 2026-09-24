import base64
import json
import os
from urllib.parse import quote
import httpx
from ...config import Settings
from ...contracts import Alignment, AudioChunk

class ElevenLabsTTS:
    """HTTP streaming PCM16 LE with character timestamps; transport injectable."""
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None):
        self.settings = settings
        self.client = client

    async def stream(self, text: str):
        key = os.getenv('ELEVENLABS_API_KEY', '')
        voice = self.settings.tts_voice or self.settings.persona_data().voice
        if self.client is None and (not key or not voice):
            raise ValueError('Falta ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID.')
        client = self.client or httpx.AsyncClient(timeout=httpx.Timeout(35, connect=10))
        rate = self.settings.sample_rate
        endpoint = f'https://api.elevenlabs.io/v1/text-to-speech/{quote(voice, safe="")}/stream/with-timestamps'
        elapsed = 0.0
        pending = []
        character_offset = 0
        try:
            async with client.stream('POST', endpoint, headers={'xi-api-key': key},
                    params={'output_format': f'pcm_{rate}'},
                    json={'text': text, 'model_id': self.settings.tts_model, 'language_code': 'es'}) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.strip():
                        continue
                    if line.startswith('data:'):
                        line = line[5:].strip()
                    if line == '[DONE]':
                        break
                    data = json.loads(line)
                    pcm = base64.b64decode(data.get('audio_base64', ''), validate=True)
                    if not pcm:
                        continue
                    if len(pcm) % 2:
                        raise ValueError('Invalid PCM16 stream')
                    raw = data.get('normalized_alignment') or data.get('alignment') or {}
                    starts = raw.get('character_start_times_seconds', [])
                    ends = raw.get('character_end_times_seconds', [])
                    # Alignment can arrive ahead of audio and be omitted on
                    # subsequent packets. Retain future cues and split intervals
                    # on PCM boundaries without losing their text positions.
                    origin = 0 if starts and starts[0] >= elapsed - .025 else elapsed
                    for char, start, end in zip(raw.get('characters', []), starts, ends):
                        pending.append((char, start + origin, end + origin, character_offset))
                        character_offset += 1
                    duration = len(pcm) / 2 / rate
                    boundary = elapsed + duration
                    current = [cue for cue in pending if cue[1] < boundary - 1e-6 and cue[2] > elapsed + 1e-6]
                    alignment = Alignment(
                        offset=current[0][3] if current else character_offset,
                        characters=[cue[0] for cue in current],
                        starts=[max(0, cue[1] - elapsed) for cue in current],
                        ends=[min(duration, cue[2] - elapsed) for cue in current])
                    yield AudioChunk(pcm=pcm, sample_rate=rate, alignment=alignment)
                    pending = [cue for cue in pending if cue[2] > boundary + 1e-6]
                    elapsed = boundary
        finally:
            if self.client is None:
                await client.aclose()
