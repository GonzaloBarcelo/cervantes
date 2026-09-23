import asyncio
import base64
from collections.abc import Awaitable, Callable
from time import perf_counter
from .config import Settings
from .contracts import Message
from .registry import registry
from .streaming import SentenceParser
from .visemes import VisemeMapper

async def conversation(text: str, settings: Settings, history: list[Message], send: Callable[[dict], Awaitable[None]], stt_ms=0):
    started = perf_counter()
    latency = {'stt_ms': stt_ms, 'llm_first_token_ms': None, 'tts_first_audio_ms': None, 'first_audio_ms': None}
    llm = registry.create('llm', settings.llm_provider, settings)
    tts = registry.create('tts', settings.tts_provider, settings)
    stt = registry.create('stt', settings.stt_module, settings)
    text = await stt.transcribe(text)
    messages = [*history[-settings.max_history:], Message(role='user', content=text)]
    queue = asyncio.Queue(maxsize=8)
    parser = SentenceParser()
    answer = []
    await send({'type': 'state', 'state': 'thinking'})

    async def produce():
        async for token in llm.stream(messages, settings.persona_data()):
            if latency['llm_first_token_ms'] is None:
                latency['llm_first_token_ms'] = round((perf_counter() - started) * 1000, 1)
            for sentence in parser.feed(token):
                await queue.put(sentence)
        for sentence in parser.feed('', final=True):
            await queue.put(sentence)
        await queue.put(None)

    async def consume():
        sequence = 0
        while (sentence := await queue.get()) is not None:
            answer.append(sentence.text)
            await send({'type': 'sentence', 'text': sentence.text, 'mood': sentence.mood, 'sequence': sequence})
            tts_started = perf_counter()
            async for audio in tts.stream(sentence.text):
                if latency['first_audio_ms'] is None:
                    latency['first_audio_ms'] = round((perf_counter() - started) * 1000, 1)
                    latency['tts_first_audio_ms'] = round((perf_counter() - tts_started) * 1000, 1)
                await send({'type': 'audio', 'sequence': sequence, 'mood': sentence.mood, 'text': sentence.text,
                    'pcm': base64.b64encode(audio.pcm).decode(), 'sample_rate': audio.sample_rate,
                    'alignment': audio.alignment.model_dump(),
                    'visemes': [v.model_dump() for v in VisemeMapper().map(audio.alignment)]})
            sequence += 1
    async with asyncio.TaskGroup() as group:
        group.create_task(produce())
        group.create_task(consume())
    if not answer:
        raise ValueError('No se ha recibido una respuesta. Intentad de nuevo.')
    history.extend([Message(role='user', content=text), Message(role='assistant', content=' '.join(answer))])
    del history[:-settings.max_history]
    latency['total_ms'] = round((perf_counter() - started) * 1000, 1)
    await send({'type': 'done', 'latency': latency})
