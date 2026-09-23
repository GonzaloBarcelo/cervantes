from collections.abc import Callable
from typing import Any
from .config import Settings

class Registry:
    def __init__(self):
        self.metadata: dict[tuple[str, str], dict] = {}
        self.factories: dict[str, dict[str, Callable[[Settings], Any]]] = {'llm': {}, 'tts': {}, 'stt': {}}

    def register(self, kind: str, name: str, factory: Callable[[Settings], Any], *, mock=False, required_env=(), required_settings=()):
        self.factories[kind][name] = factory
        self.metadata[kind, name] = {'mock': mock, 'env': required_env, 'settings': required_settings}

    def status(self, kind: str, name: str, settings: Settings):
        import os
        meta = self.metadata.get((kind, name), {})
        if meta.get('mock'):
            return 'mock'
        missing = any(not os.getenv(key) for key in meta.get('env', ())) or any(not getattr(settings, key) for key in meta.get('settings', ()))
        return 'missing_key' if missing else 'active'

    def create(self, kind: str, name: str, settings: Settings):
        if name not in self.factories[kind]:
            raise ValueError(f'Módulo desconocido: {kind}/{name}')
        return self.factories[kind][name](settings)

registry = Registry()

from .providers.mock import MockLLM, MockTTS, MockSTT
from .providers.browser import BrowserSTT
registry.register('llm', 'mock', lambda s: MockLLM(), mock=True)
registry.register('tts', 'mock', lambda s: MockTTS(s.sample_rate, s.tts_voice), mock=True)
registry.register('stt', 'mock', lambda s: MockSTT(), mock=True)
registry.register('stt', 'browser', lambda s: BrowserSTT())
from .providers.anthropic import AnthropicLLM
registry.register('llm', 'anthropic', AnthropicLLM, required_env=('ANTHROPIC_API_KEY',))
from .providers.elevenlabs import ElevenLabsTTS
registry.register('tts', 'elevenlabs', ElevenLabsTTS, required_env=('ELEVENLABS_API_KEY',), required_settings=('tts_voice',))
