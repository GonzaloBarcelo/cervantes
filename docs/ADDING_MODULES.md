# Añadir módulos sin tocar el circuito

Los contratos v1 son backend/contracts.py y frontend/src/contracts.ts. Crear una carpeta, registrar una fábrica y seleccionar el nombre: no se modifica pipeline.py, WebSocket, AudioPlayer ni VisemeMapper. Los selectores del laboratorio incorporan automáticamente los nombres registrados. Todo texto de interfaz nuevo va a frontend/src/i18n.ts.

## Ejemplo completo: un nuevo LLM local

1. Crear `backend/providers/saludo/__init__.py`:

```python
from collections.abc import AsyncIterator
from backend.contracts import Message, Persona

class SaludoLLM:
    async def stream(self, history: list[Message], persona: Persona) -> AsyncIterator[str]:
        yield '[mood:warm] Bienvenida sea vuestra merced.'
        yield ' Toda conversación merece empezar con curiosidad.'
```

2. Añadir a `backend/registry.py`:

```python
from .providers.saludo import SaludoLLM
registry.register('llm', 'saludo', lambda settings: SaludoLLM(), mock=True)
```

3. Cambiar una línea de `config/modules.yaml` a `llm_provider: saludo`. Para evitar el modo automático que fuerza los mocks sin claves:

```bash
MOCK=0 TTS_PROVIDER=mock STT_MODULE=mock ./run.sh
```

Tras registrar código nuevo se recompila/reinicia una vez. Después se puede elegir `saludo` en /lab sin reiniciar. Cambiar el proveedor activo en el laboratorio no recarga código nuevo del disco.

4. Prueba completa, `tests/test_saludo.py`:

```python
from backend.config import Settings
from backend.contracts import LLMProvider, Message
from backend.registry import registry

async def test_saludo_contract():
    provider = registry.create('llm', 'saludo', Settings())
    assert isinstance(provider, LLMProvider)
    chunks = [chunk async for chunk in provider.stream(
        [Message(role='user', content='Hola')], Settings().persona_data())]
    assert len(chunks) == 2
    assert chunks[0].startswith('[mood:warm]')
```

Ejecutar `.venv/bin/python -m pytest tests/test_saludo.py`. Este ejemplo es un módulo determinista funcional; un proveedor remoto conserva la misma firma y produce texto incremental. Declarar sus secretos opcionales como placeholders vacíos en env.sh y env.sh.example; registrarlo con `required_env=('NUEVO_API_KEY',)` sin activarlo en v0.

## Otro TTS

Crear una carpeta con una clase cuyo `stream(text)` sea un generador asíncrono de `AudioChunk`. Cada chunk contiene PCM16 little endian mono (sin cabecera WAV), `sample_rate`, y `Alignment(characters, starts, ends)` en segundos relativos al comienzo **de ese chunk**. Los tres arrays tienen igual longitud. No devolver bytes MP3 como si fueran PCM. Convertirlos o cambiar la implementación interna del módulo para solicitar PCM.

Registrar `registry.register('tts', 'nombre', lambda settings: NuevoTTS(settings), required_env=('NUEVA_CLAVE',))`. El TTS no conoce rostros ni visemas: backend/visemes.py hace esa transformación. El cliente debe ser inyectable, como ElevenLabsTTS, para ejecutar el contrato sin claves. Comprobar audio no vacío, formato, frecuencia, tiempos y error/cancelación, usando tests/test_elevenlabs.py como referencia.

## Otro rostro

Crear `frontend/src/avatars/nuevo/index.ts` que implemente `AvatarModule`, o extienda `AnimatedAvatar` si se quiere reutilizar reloj, parpadeo, coarticulación y suavizado. Ejemplo completo de rostro de tinta:

```typescript
import { AnimatedAvatar, type Frame } from '../base';

export class InkFace extends AnimatedAvatar {
  private canvas!: HTMLCanvasElement;
  protected create() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = 400;
    this.container.replaceChildren(this.canvas);
  }
  protected draw(f: Frame) {
    const ctx = this.canvas.getContext('2d')!;
    ctx.fillStyle = '#e4d4af'; ctx.fillRect(0, 0, 400, 400);
    ctx.strokeStyle = '#302b20'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(200, 200, 110, 145, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#302b20';
    for (const x of [160, 240]) {
      ctx.beginPath(); ctx.ellipse(x + f.x * 5, 170 + f.y * 4, 8, Math.max(1, 8 * (1 - f.blink)), 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.ellipse(200, 255, 30 - f.round * 15, 2 + f.open * 25, 0, 0, Math.PI * 2); ctx.fill();
  }
}
```

Registrar en `frontend/src/avatars/registry.ts`:

```typescript
import { InkFace } from './nuevo';
avatars.ink = () => new InkFace();
```

Elegir `avatar_module: ink` en YAML o `ink` en /lab tras compilar. Los métodos de base implementan mount, speak, setMood, lookAt, interrupt y dispose. Para recursos WebGL, sobrescribir cleanup y liberar geometrías, materiales, texturas, observers y contexto. La prueba frontend/tests/contracts.spec.ts itera automáticamente todos los rostros registrados.

## Otro STT

Frontend: implementar STTModule.start(onText, onError, onEnd), stop y dispose; registrar en stt/registry.ts. Solo invocar onText para una transcripción final; onError devuelve texto de i18n.ts. dispose debe liberar micrófono, temporizadores y callbacks. Backend: registrar un STTProvider del mismo nombre. Para reconocimiento exclusivamente en el navegador se puede registrar BrowserSTT, que recibe y valida texto final; para reconocimiento de audio remoto habría que ampliar el protocolo de entrada en una nueva versión documentada.

STTProvider.transcribe(payload, language='es-ES') devuelve texto normalizado. v1 transporta texto, no audio de micrófono al backend. El contrato existe y las dos implementaciones v0 se prueban. La incorporación futura de Scribe debe definir también el transporte de audio, no fingir que v1 ya lo ofrece.

## Compatibilidad

No filtrar nombres del proveedor, claves o rig a otros módulos. Las emociones normalizadas son warm, ironic, serious, thoughtful y joyful. Visemas: sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U. Las extensiones pueden mapear este conjunto a ARKit, VRM, SVG o canvas internamente. Las claves de metadatos `mock`, `required_env` y `required_settings` del registro controlan la disponibilidad mostrada en el laboratorio.
