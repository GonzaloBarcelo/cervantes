from collections.abc import Callable
from typing import Any
from .config import Settings

class Registry:
    def __init__(self):
        self.factories: dict[str, dict[str, Callable[[Settings], Any]]] = {'llm': {}, 'tts': {}, 'stt': {}}

    def register(self, kind: str, name: str, factory: Callable[[Settings], Any]):
        self.factories[kind][name] = factory

    def create(self, kind: str, name: str, settings: Settings):
        if name not in self.factories[kind]:
            raise ValueError(f'Módulo desconocido: {kind}/{name}')
        return self.factories[kind][name](settings)

registry = Registry()
