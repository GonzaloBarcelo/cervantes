import base64
import pytest
from fastapi.testclient import TestClient
from backend.app import app
from backend.config import Settings
from backend.contracts import LLMProvider, TTSProvider, STTProvider, Message
from backend.registry import registry

@pytest.mark.parametrize('name', list(registry.factories['stt']))
async def test_stt_contract(name):
    p = registry.create('stt', name, Settings())
    assert isinstance(p, STTProvider)
    assert await p.transcribe(' Hola. ') == 'Hola.'

async def test_mock_contracts():
    s = Settings()
    llm = registry.create('llm', 'mock', s)
    tts = registry.create('tts', 'mock', s)
    assert isinstance(llm, LLMProvider)
    assert isinstance(tts, TTSProvider)
    text = ''.join([t async for t in llm.stream([Message(role='user', content='Quijote')], s.persona_data())])
    assert '[mood:ironic]' in text
    chunks = [c async for c in tts.stream('Hola, amigo.')]
    assert chunks and all(c.pcm and len(c.pcm) % 2 == 0 for c in chunks)
    assert ''.join(''.join(c.alignment.characters) for c in chunks) == 'Hola, amigo.'

def test_websocket_conversation(monkeypatch):
    monkeypatch.setenv('MOCK', '1')
    with TestClient(app).websocket_connect('/ws') as ws:
        assert ws.receive_json()['type'] == 'ready'
        ws.send_json({'type': 'chat', 'text': 'Háblame del Quijote'})
        events = []
        while True:
            e = ws.receive_json()
            events.append(e)
            assert e['type'] != 'error', e
            if e['type'] == 'done': break
        audio = [e for e in events if e['type'] == 'audio']
        assert audio and base64.b64decode(audio[0]['pcm'])
        assert all('[mood:' not in e['text'] for e in audio)
        assert events[-1]['latency']['first_audio_ms'] < 2500
