# Arquitectura y protocolo v1

```
Web Speech / Mock → texto → WebSocket → STTProvider
                                      ↓
Persona YAML → LLMProvider → parser incremental → cola de frases
                                                    ↓
                                               TTSProvider
                                                    ↓
                           PCM + Alignment → VisemeMapper (Oculus 15)
                                                    ↓
Web Audio clock ← WebSocket ← audio + visemas + emoción
       ↓
AvatarModule (portrait2d / bust3d) + subtítulos + línea de tiempo
```

Python 3.12, FastAPI, Pydantic y Protocols en backend/contracts.py. Cada módulo tiene su propia carpeta. Registry contiene fábricas que reciben Settings; el orquestador no conoce implementaciones. Los clientes Anthropic/HTTP son inyectables para pruebas.

LLMProvider.stream(history, persona) produce fragmentos str, incluidas etiquetas [mood:warm|ironic|serious|thoughtful|joyful]. SentenceParser retiene etiquetas incompletas y las elimina; al llegar puntuación emite texto y emoción. Una TaskGroup ejecuta generación y TTS concurrentemente con cola acotada. Una excepción cancela ambas tareas. Cada conexión mantiene hasta 20 mensajes; cancelar no añade turnos parciales.

TTSProvider.stream(text) produce AudioChunk con PCM16 little endian mono, frecuencia y Alignment. Los tiempos del contrato están en **segundos relativos al fragmento de audio**, no al reloj del sistema. El adaptador ElevenLabs normaliza timestamps por petición; admite resets explícitos por chunk. La detección automática de origen temporal debe contrastarse con la voz real: solapamientos o normalización excepcional pueden requerir ajustar el adaptador. Las marcas pueden adelantarse a los paquetes PCM: el adaptador conserva los intervalos futuros y los recorta en cada frontera de audio. Alignment.offset identifica el carácter original aunque un intervalo se divida entre paquetes. Si no existen marcas ni intervalos pendientes, la boca queda en reposo, nunca se inventan tiempos.

VisemeMapper es una aproximación española por caracteres (h muda, ch, qu/gu, vocales acentuadas, consonantes). No es un alineador fonético. Produce los 15 visemas Oculus; el módulo facial aplica 25 ms de anticipación y mezcla de 40 ms, con suavizado. No hay nombres de proveedor en el avatar. El busto traduce a jawOpen, mouthFunnel, mouthSmileLeft/Right y eyeBlinkLeft/Right: subconjunto ARKit, no los 52 morph targets de un rig completo.

AudioPlayer agenda PCM con AudioContext.currentTime. AvatarModule.speak recibe clock, start, duration, samples, sampleRate, alignment, normalized visemes, mood, text y charOffset. Respiración, mirada y parpadeo funcionan incluso en silencio. Interrupt detiene AudioBufferSourceNodes y limpia visemas, además de cancelar la tarea del servidor. Un número de turno descarta eventos tardíos.

## WebSocket /ws

Cliente → servidor:

- `{"type":"chat","text":"Hola","stt_ms":12}`
- `{"type":"interrupt"}`
- `{"type":"configure","settings":{"llm_provider":"mock","tts_provider":"mock","avatar_module":"bust3d"}}`

Servidor → cliente:

- ready/configured: settings y módulos con estado, sin claves.
- started/interrupted: número `turn` creciente.
- state: thinking.
- sentence: texto limpio, mood y sequence.
- audio: PCM base64, sample_rate, alignment, visemes, mood, text, sequence y turn.
- done: latencias. Significa fin de generación; el frontend espera a que termine el audio antes de volver a reposo.
- error: mensaje español sin cuerpo remoto ni secretos, y tipo de error saneado.

Máximo 2000 caracteres de entrada; timeout de turno 90 s; historial solo en memoria. Se rechazan WebSockets de otro origen en navegador. Configuración por conexión, no global: cambiar un laboratorio no altera otro usuario. No hay autenticación ni límites de gasto adecuados para un servidor público.

## Datos y cámara

Web Speech API pertenece al navegador y puede enviar audio a su servicio de reconocimiento. Texto de conversaciones reales va a Anthropic y ElevenLabs; claves permanecen en Python. Seguimiento de mirada usa MediaPipe Face Landmarker localmente tras pulsar la cámara, nunca captura audio. La cámara se libera al desactivarla o abandonar la página. El vídeo no se añade al DOM ni se guarda.
