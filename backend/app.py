import asyncio
import contextlib
from urllib.parse import urlparse
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import ValidationError
from .config import ROOT, Settings, TurnRequest
from .contracts import Message
from .pipeline import conversation
from .registry import registry

app = FastAPI(title='Cervantes Vivo')

def module_status(settings):
    return {kind: [{'name': name, 'status': registry.status(kind, name, settings)} for name in factories] for kind, factories in registry.factories.items()}

@app.get('/api/health')
def health():
    settings = Settings.load()
    return {'status': 'ok', 'settings': settings.model_dump(), 'modules': module_status(settings)}

@app.websocket('/ws')
async def websocket(ws: WebSocket):
    origin = ws.headers.get('origin')
    if origin and urlparse(origin).netloc != ws.headers.get('host'):
        await ws.close(code=1008)
        return
    await ws.accept()
    settings = Settings.load()
    history: list[Message] = []
    task = None
    turn = 0

    async def cancel():
        nonlocal task
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await task
            task = None

    async def run(request, current_turn, snapshot):
        async def send(event):
            await ws.send_json({**event, 'turn': current_turn})
        try:
            async with asyncio.timeout(90):
                await conversation(request.text, snapshot, history, send, request.stt_ms)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            # Never send exception bodies: remote API messages may contain secrets.
            await send({'type': 'error', 'message': 'No ha sido posible completar la respuesta. Revisad las claves, la voz y la conexión, o elegid los módulos simulados.', 'code': type(error).__name__})

    await ws.send_json({'type': 'ready', 'settings': settings.model_dump(), 'modules': module_status(settings)})
    try:
        while True:
            try:
                request = TurnRequest.model_validate_json(await ws.receive_text())
                if request.type == 'configure':
                    allowed = {'llm_provider', 'llm_model', 'tts_provider', 'tts_voice', 'avatar_module', 'stt_module'}
                    if set(request.settings) - allowed:
                        raise ValueError('Configuración no válida.')
                    updated = Settings(**{**settings.model_dump(), **request.settings})
                    for kind, name in [('llm', updated.llm_provider), ('tts', updated.tts_provider), ('stt', updated.stt_module)]:
                        if name not in registry.factories[kind]:
                            raise ValueError('Módulo desconocido.')
                    await cancel()
                    turn += 1
                    settings = updated
                    await ws.send_json({'type': 'configured', 'settings': settings.model_dump(), 'modules': module_status(settings), 'turn': turn})
                elif request.type in ('interrupt', 'chat'):
                    await cancel()
                    turn += 1
                    await ws.send_json({'type': 'interrupted' if request.type == 'interrupt' else 'started', 'turn': turn})
                    if request.type == 'chat':
                        if not request.text.strip():
                            raise ValueError('Escribid o decid unas palabras para comenzar.')
                        task = asyncio.create_task(run(request, turn, settings.model_copy()))
                else:
                    raise ValueError('Mensaje no reconocido.')
            except (ValueError, ValidationError):
                await ws.send_json({'type': 'error', 'message': 'La petición no es válida. Usad un mensaje de hasta 2000 caracteres o revisad los módulos.'})
    except WebSocketDisconnect:
        pass
    finally:
        await cancel()

@app.get('/')
@app.get('/lab')
def index():
    return FileResponse(ROOT / 'frontend/dist/index.html')

if (ROOT / 'frontend/dist/assets').exists():
    app.mount('/assets', StaticFiles(directory=ROOT / 'frontend/dist/assets'), name='assets')
app.mount('/reports', StaticFiles(directory=ROOT / 'reports', html=True), name='reports')
