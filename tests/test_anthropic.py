from types import SimpleNamespace
from unittest.mock import Mock
import pytest
from backend.config import Settings
from backend.contracts import LLMProvider, Message
from backend.providers.anthropic import AnthropicLLM
from backend.providers.mock import MockLLM
from backend.streaming import SentenceParser

class FakeStream:
    async def __aenter__(self): return self
    async def __aexit__(self, *args): return False
    @property
    def text_stream(self):
        async def tokens():
            for t in ['[moo','d:ironic] Hola, ','vuestra merced.',' Una buena historia.']:
                yield t
        return tokens()

@pytest.mark.parametrize('implementation', ['mock','anthropic'])
async def test_all_llm_contracts(implementation):
    settings=Settings()
    factory=Mock(return_value=FakeStream())
    llm=MockLLM() if implementation=='mock' else AnthropicLLM(settings,SimpleNamespace(messages=SimpleNamespace(stream=factory)))
    assert isinstance(llm,LLMProvider)
    chunks=[t async for t in llm.stream([Message(role='user',content='Hola')], settings.persona_data())]
    assert len(chunks)>1 and all(isinstance(t,str) for t in chunks)
    if implementation=='anthropic':
        assert factory.call_args.kwargs['model']==settings.llm_model
        assert 'castellano' in factory.call_args.kwargs['system']
        assert factory.call_args.kwargs['messages']==[{'role':'user','content':'Hola'}]

@pytest.mark.parametrize('width', [1,2,7,1000])
def test_parser_all_boundaries(width):
    text='[mood:ironic] Hola. [mood:serious] ¿Qué tal? Sin punto'
    parser=SentenceParser();out=[]
    for i in range(0,len(text),width):out.extend(parser.feed(text[i:i+width]))
    out.extend(parser.feed('',final=True))
    assert [s.text for s in out]==['Hola.','¿Qué tal?','Sin punto']
    assert [s.mood for s in out]==['ironic','serious','serious']

def test_parser_unknown_and_incomplete_tags():
    p=SentenceParser()
    assert p.feed('[mood:unknown] Hola.')[0].mood=='warm'
    assert p.feed('[mood:ir',final=True)==[]

async def test_no_key(monkeypatch):
    monkeypatch.delenv('ANTHROPIC_API_KEY',raising=False)
    with pytest.raises(ValueError,match='ANTHROPIC'):
        _=[t async for t in AnthropicLLM(Settings()).stream([],Settings().persona_data())]
