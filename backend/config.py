import os
from pathlib import Path
import yaml
from pydantic import BaseModel, Field
from .contracts import Persona

ROOT = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    llm_provider: str = 'anthropic'
    llm_model: str = 'claude-haiku-4-5-20251001'
    tts_provider: str = 'elevenlabs'
    tts_model: str = 'eleven_flash_v2_5'
    tts_voice: str = ''
    avatar_module: str = 'portrait2d'
    stt_module: str = 'browser'
    persona: str = 'personas/cervantes.yaml'
    host: str = '127.0.0.1'
    port: int = 8000
    sample_rate: int = 24000
    max_history: int = 20
    max_input_chars: int = 2000

    @classmethod
    def load(cls):
        data = yaml.safe_load((ROOT / 'config/modules.yaml').read_text())
        for field in ('llm_provider', 'llm_model', 'tts_provider', 'tts_voice', 'avatar_module', 'stt_module'):
            if field.upper() in os.environ:
                data[field] = os.environ[field.upper()]
        if not data.get('tts_voice'):
            data['tts_voice'] = os.getenv('ELEVENLABS_VOICE_ID', '') or yaml.safe_load((ROOT / data['persona']).read_text()).get('voice', '')
        explicit_mock = os.getenv('MOCK') == '1'
        auto_mock = os.getenv('MOCK') != '0' and not os.getenv('ANTHROPIC_API_KEY') and not os.getenv('ELEVENLABS_API_KEY')
        if explicit_mock or auto_mock:
            data.update(llm_provider='mock', tts_provider='mock', stt_module='mock')
        return cls(**data)

    def persona_data(self):
        return Persona(**yaml.safe_load((ROOT / self.persona).read_text()))

class TurnRequest(BaseModel):
    type: str
    text: str = Field(default='', max_length=2000)
    stt_ms: float = Field(default=0, ge=0, le=600000)
    settings: dict[str, str] = Field(default_factory=dict)
