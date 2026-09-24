"""Exercise live adapters without ever printing keys, headers, or remote bodies."""
import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.config import Settings
from backend.pipeline import conversation

async def main():
    settings=Settings.load().model_copy(update={'llm_provider':'anthropic','tts_provider':'elevenlabs','stt_module':'mock'})
    packets=0
    async def receive(event):
        nonlocal packets
        if event['type']=='sentence': print('Cervantes:',event['text'])
        elif event['type']=='audio':
            packets+=1
            assert event['pcm'] and event['visemes'], 'Audio sin alineación utilizable'
        elif event['type']=='done': print('Latencias (ms):',event['latency'])
    try:
        async with asyncio.timeout(90):
            await conversation('Saludad a un lector y contadle quién sois.',settings,[],receive)
        assert packets>0
        print(f'Correcto: {packets} fragmentos de audio recibidos. Comprobad voz y sincronización perceptiva en la interfaz.')
    except Exception as error:
        print('Falló la prueba real:',type(error).__name__,'. Revisad acceso a modelos, voz, cuotas y red. No se muestran detalles sensibles.',file=sys.stderr)
        raise SystemExit(1)

asyncio.run(main())
