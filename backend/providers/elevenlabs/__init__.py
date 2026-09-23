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
                    # HTTP timestamps normally refer to the request. Also accept
                    # chunk-local timestamps when an upstream adapter resets them.
                    offset = elapsed if starts and starts[0] >= elapsed - .025 else 0
                    alignment = Alignment(characters=raw.get('characters', []),
                        starts=[max(0, s-offset) for s in starts], ends=[max(0, e-offset) for e in ends])
                    yield AudioChunk(pcm=pcm, sample_rate=rate, alignment=alignment)
                    elapsed += len(pcm) / 2 / rate
        finally:
            if self.client is None:
                await client.aclose()
