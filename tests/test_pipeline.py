import asyncio
from types import SimpleNamespace
from unittest.mock import Mock
import httpx
from fastapi.testclient import TestClient
from backend.app import app
from backend.config import Settings
from backend.contracts import Message
from backend.pipeline import conversation
from backend.providers.anthropic import AnthropicLLM
from backend.providers.elevenlabs import ElevenLabsTTS
from backend.registry import registry
from tests.test_anthropic import FakeStream
from tests.test_elevenlabs import Chunks,fixture_stream

async def test_provider_swap_uses_real_adapters_with_mocked_transports(monkeypatch):
    llm_client=SimpleNamespace(messages=SimpleNamespace(stream=Mock(return_value=FakeStream())))
    async with httpx.AsyncClient(transport=httpx.MockTransport(lambda r:httpx.Response(200,stream=Chunks(fixture_stream())))) as tts_client:
        monkeypatch.setitem(registry.factories['llm'],'anthropic',lambda s:AnthropicLLM(s,llm_client))
        monkeypatch.setitem(registry.factories['tts'],'elevenlabs',lambda s:ElevenLabsTTS(s,tts_client))
        for llm,tts in [('mock','mock'),('anthropic','mock'),('anthropic','elevenlabs'),('mock','elevenlabs')]:
            events=[]
            async def send(event):events.append(event)
            await conversation('Hola',Settings(llm_provider=llm,tts_provider=tts,tts_voice='fixture',stt_module='mock'),[],send)
            assert events[-1]['type']=='done'
            assert any(e['type']=='audio' for e in events)
            assert all('[mood:' not in e.get('text','') for e in events)

async def test_first_sentence_audio_precedes_llm_completion(monkeypatch):
    delivered=asyncio.Event()
    class SlowLLM:
        async def stream(self,history,persona):
            yield '[mood:warm] Hola.'
            await asyncio.wait_for(delivered.wait(),1)
            yield ' Segunda frase.'
    monkeypatch.setitem(registry.factories['llm'],'slow',lambda s:SlowLLM())
    async def send(event):
        if event['type']=='audio':delivered.set()
    await conversation('Hola',Settings(llm_provider='slow',tts_provider='mock',stt_module='mock'),[],send)
    assert delivered.is_set()

def test_config_interrupt_and_validation(monkeypatch):
    monkeypatch.setenv('MOCK','1')
    with TestClient(app).websocket_connect('/ws') as ws:
        ws.receive_json()
        ws.send_json({'type':'configure','settings':{'llm_model':'a-model','tts_voice':'bright','avatar_module':'bust3d'}})
        settings=ws.receive_json();assert settings['settings']['tts_voice']=='bright'
        ws.send_json({'type':'chat','text':'Hola'})
        assert ws.receive_json()['type']=='started'
        ws.send_json({'type':'interrupt'})
        while (event:=ws.receive_json())['type']!='interrupted':assert event['type']!='done'
        ws.send_json({'type':'configure','settings':{'llm_provider':'unknown'}})
        assert ws.receive_json()['type']=='error'
        ws.send_json({'type':'chat','text':'x'*2001})
        assert ws.receive_json()['type']=='error'

def test_missing_key_error_is_safe(monkeypatch):
    monkeypatch.setenv('MOCK','1');monkeypatch.delenv('ANTHROPIC_API_KEY',raising=False)
    with TestClient(app).websocket_connect('/ws') as ws:
        ws.receive_json();ws.send_json({'type':'configure','settings':{'llm_provider':'anthropic'}});ws.receive_json()
        ws.send_json({'type':'chat','text':'Hola'})
        while (event:=ws.receive_json())['type']!='error':pass
        assert 'claves' in event['message']
        assert 'api_key' not in str(event)

def test_settings_env(monkeypatch):
    monkeypatch.setenv('MOCK','0');monkeypatch.setenv('LLM_PROVIDER','mock');monkeypatch.setenv('AVATAR_MODULE','bust3d')
    assert Settings.load().llm_provider=='mock'
    assert Settings.load().avatar_module=='bust3d'
