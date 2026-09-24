import base64
import json
import httpx
import pytest
from backend.config import Settings
from backend.contracts import TTSProvider
from backend.providers.elevenlabs import ElevenLabsTTS
from backend.providers.mock import MockTTS

class Chunks(httpx.AsyncByteStream):
    def __init__(self, content): self.content=content
    async def __aiter__(self):
        # Deliberately split JSON over network reads.
        for i in range(0,len(self.content),17): yield self.content[i:i+17]

def fixture_stream(origin='request'):
    pcm=base64.b64encode(b'\x01\x00'*2400).decode()
    return '\n'.join(json.dumps({'audio_base64':pcm,'alignment':{'characters':[c], 'character_start_times_seconds':[i*.1 if origin=='request' else 0], 'character_end_times_seconds':[(i+1)*.1 if origin=='request' else .1]}}) for i,c in enumerate('Hola')).encode()

@pytest.mark.parametrize('implementation', ['mock','elevenlabs'])
@pytest.mark.parametrize('origin',['request','chunk'])
async def test_all_tts_contracts(implementation,origin):
    calls=[]
    def handler(request):
        calls.append(request)
        return httpx.Response(200,stream=Chunks(fixture_stream(origin)))
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        provider=MockTTS() if implementation=='mock' else ElevenLabsTTS(Settings(tts_voice='fixture-voice'),client)
        assert isinstance(provider,TTSProvider)
        chunks=[c async for c in provider.stream('Hola')]
        assert ''.join(''.join(c.alignment.characters) for c in chunks)=='Hola'
        assert all(c.pcm and c.sample_rate==24000 for c in chunks)
        if implementation=='elevenlabs':
            assert len(chunks)==4
            assert all(c.alignment.starts[0]==pytest.approx(0) for c in chunks)
            assert all(c.alignment.ends[0]==pytest.approx(.1) for c in chunks)
            assert calls[0].url.params['output_format']=='pcm_24000'
            assert calls[0].url.path.endswith('/fixture-voice/stream/with-timestamps')
            assert json.loads(calls[0].content)['model_id']=='eleven_flash_v2_5'

async def test_http_failure():
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(401))) as client:
        with pytest.raises(httpx.HTTPStatusError):
            _=[c async for c in ElevenLabsTTS(Settings(tts_voice='fixture'),client).stream('Hola')]

async def test_missing_key(monkeypatch):
    monkeypatch.delenv('ELEVENLABS_API_KEY',raising=False)
    with pytest.raises(ValueError,match='Falta'):
        _=[c async for c in ElevenLabsTTS(Settings()).stream('Hola')]

async def test_alignment_ahead_of_audio_is_retained_across_empty_packets():
    pcm=base64.b64encode(b'\x01\x00'*2400).decode()
    packets=[{'audio_base64':pcm,'alignment':{'characters':['a','o'],'character_start_times_seconds':[0,.15],'character_end_times_seconds':[.15,.3]}}, {'audio_base64':pcm,'alignment':None}, {'audio_base64':pcm,'alignment':None}]
    content='\n'.join(json.dumps(p) for p in packets).encode()
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(200,stream=Chunks(content)))) as client:
        chunks=[c async for c in ElevenLabsTTS(Settings(tts_voice='fixture'),client).stream('ao')]
    assert [c.alignment.characters for c in chunks]==[['a'],['a','o'],['o']]
    assert [c.alignment.offset for c in chunks]==[0,0,1]
    assert all(0<=t<=.1+1e-6 for c in chunks for t in c.alignment.ends)
    assert chunks[-1].alignment.ends[0]==pytest.approx(.1)
