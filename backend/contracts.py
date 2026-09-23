from collections.abc import AsyncIterator
from typing import Literal, Protocol, runtime_checkable
from pydantic import BaseModel, Field, model_validator

Mood = Literal['warm', 'ironic', 'serious', 'thoughtful', 'joyful']
Viseme = Literal['sil', 'PP', 'FF', 'TH', 'DD', 'kk', 'CH', 'SS', 'nn', 'RR', 'aa', 'E', 'I', 'O', 'U']

class Message(BaseModel):
    role: Literal['user', 'assistant']
    content: str

class Persona(BaseModel):
    name: str
    system_prompt: str
    voice: str = ''
    settings: dict[str, str] = Field(default_factory=dict)

class Alignment(BaseModel):
    characters: list[str]
    starts: list[float]
    ends: list[float]

    @model_validator(mode='after')
    def valid(self):
        if not len(self.characters) == len(self.starts) == len(self.ends):
            raise ValueError('Alignment arrays must have equal lengths')
        if any(s < 0 or e < s for s, e in zip(self.starts, self.ends)):
            raise ValueError('Invalid alignment interval')
        if self.starts != sorted(self.starts):
            raise ValueError('Alignment must be ordered')
        return self

class AudioChunk(BaseModel):
    pcm: bytes
    sample_rate: int = 24000
    alignment: Alignment

class VisemeCue(BaseModel):
    viseme: Viseme
    start: float
    end: float
    weight: float = 1.0

@runtime_checkable
class LLMProvider(Protocol):
    def stream(self, history: list[Message], persona: Persona) -> AsyncIterator[str]: ...

@runtime_checkable
class TTSProvider(Protocol):
    def stream(self, text: str) -> AsyncIterator[AudioChunk]: ...

@runtime_checkable
class STTProvider(Protocol):
    async def transcribe(self, payload: str, language: str = 'es-ES') -> str: ...
