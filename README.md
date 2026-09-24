# Cervantes Vivo

Un encuentro por voz con una recreación de Miguel de Cervantes. La pantalla principal contiene únicamente el rostro y un botón para hablar. El laboratorio separado ofrece dos rostros intercambiables, subtítulos y herramientas de diagnóstico.

## Arranque

Requisitos: macOS/Linux, Node.js **20.19+ o 22.12+** con npm; `uv` o Python 3 con pip. Internet en la primera instalación. Python **3.12** y las dependencias se preparan automáticamente en el proyecto. No hacen falta claves para la demostración.

```bash
cp env.sh.example env.sh   # solo la primera vez; no sobrescribir un archivo con claves
source env.sh
./run.sh
```

Abrir **http://127.0.0.1:8000**. Laboratorio: **/lab**. Evidencias estáticas: abrir **reports/index.html** directamente, o **/reports/** con la aplicación iniciada. Ctrl+C detiene el servidor. `env.sh` está ignorado por Git; nunca se carga desde el navegador.

El modo automático selecciona los tres módulos mock si ambas claves están vacías. El micrófono simulado envía una pregunta de prueba, y la voz simulada produce tonos alineados: **no es voz humana inteligible**. La descripción accesible del botón y el laboratorio indican el modo. En /lab también se puede escribir una pregunta.

```bash
MOCK=1 ./run.sh      # siempre sin servicios externos para texto y audio
MOCK=0 ./run.sh      # exigir los proveedores elegidos, sin fallback oculto
```

## Activar Claude y ElevenLabs

Rellenar únicamente las tres variables de `env.sh`, localmente: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`. Elegir una voz a la que vuestra cuenta tenga acceso; no se incluye una voz clonada ni se pretende reconstruir la voz histórica de Cervantes. Ejecutar otra vez `source env.sh` y `MOCK=0 ./run.sh`.

La configuración está en **config/modules.yaml**. Valores iniciales: `anthropic`, `claude-haiku-4-5-20251001`, `elevenlabs`, `eleven_flash_v2_5`, `portrait2d`, `browser`. Los modelos y endpoints se contrastaron con documentación oficial; referencias en CREDITS.md. La voz usa PCM mono de 24 kHz para reproducir fragmentos sin esperar a decodificar un archivo completo.

Conceder permiso de micrófono en Chrome, pulsar el botón y hablar en español. Cada pulsación inicia un turno. El reconocimiento se detiene al terminar la intervención. Durante la respuesta, el mismo botón cambia a detener y cancela el audio programado y las tareas pendientes. Volver a pulsar inicia otra escucha. En /lab hay además entrada escrita, botón de interrupción y cámara opcional.

```bash
source env.sh
./scripts/smoke_live.sh
```

Este smoke consume las APIs reales y verifica texto, audio y tiempos sin imprimir secretos. Sin credenciales sale con código 2 y no envía peticiones. Después, comprobar en la interfaz la calidad de voz, sincronía y latencia real. **Esas cualidades no han podido validarse con credenciales reales en esta entrega.**

## Laboratorio y configuración

En **/lab** se puede cambiar rostro, LLM, modelo, TTS, voz y reconocimiento en vivo. Los cambios cancelan el turno activo y se conservan durante esa sesión del navegador, incluso al volver al encuentro. Una sesión nueva vuelve a los valores del servidor. Las voces mock `warm` y `bright` producen tonos distintos; para ElevenLabs escribir el identificador de voz.

Los estados de proveedor indican disponible, simulado o falta de credenciales. «Disponible» significa que la configuración tiene las credenciales necesarias; no certifica saldo, permisos del proveedor o conectividad. Las capacidades de micrófono/cámara se comprueban al utilizarlas. El laboratorio muestra transcripción, subtítulos, diario, forma de onda, visemas y emociones sobre toda la respuesta. Para abrirlo se usa directamente /lab: la pantalla principal no incluye navegación ni textos visibles.

Sobrescrituras admitidas: `LLM_PROVIDER`, `LLM_MODEL`, `TTS_PROVIDER`, `TTS_VOICE`, `AVATAR_MODULE`, `STT_MODULE`. No se añaden a env.sh: ese archivo solo contiene secretos y el identificador de voz. `TTS_VOICE` tiene prioridad sobre `ELEVENLABS_VOICE_ID`. El resto de opciones, incluido puerto, frecuencia PCM y persona, está en YAML.

```bash
AVATAR_MODULE=bust3d MOCK=1 ./run.sh
```

Cambiar YAML requiere reiniciar; las seis opciones expuestas en /lab se cambian sin reinicio. Instrucciones completas para ampliar módulos: **docs/ADDING_MODULES.md**. Protocolo WebSocket: **docs/ARCHITECTURE.md**.

## Verificación reproducible

```bash
./scripts/test.sh
```

Prepara dependencias, compila TypeScript, ejecuta pytest, instala Chromium si falta, arranca un servidor aislado en el puerto 8765 **sin claves**, ejecuta Playwright y regenera reports/index.html. No necesita que la aplicación principal esté iniciada. El puerto 8765 debe estar libre. Las pruebas ejercitan todos los proveedores; los adaptadores de APIs usan clientes/transportes simulados y nunca llaman a servicios de pago. Capturan las dos caras en escritorio y móvil, el flujo de voz, los permisos denegados y el cambio en vivo. Los informes guardan los fallos si una ejecución no termina bien.

`PROGRESS.md` registra hitos y evidencias; `AUDIT.md` relaciona requisitos y comprobaciones. No se registran conversaciones del usuario en disco: el historial reside en la conexión y el diario de /lab en memoria. Los archivos reports/test-server.log solo reflejan la sesión automatizada.

## Problemas frecuentes

- **No se oye voz en mock:** son tonos de prueba intencionados; para habla inteligible, configurar ElevenLabs. Si no suena nada, pulsar de nuevo el micrófono para desbloquear Web Audio y revisar la salida del sistema.
- **Micrófono no disponible:** Web Speech API depende del navegador y puede usar un servicio remoto del propio navegador. Usar Chrome actualizado, permitir el micrófono y servir desde localhost o HTTPS. La entrada escrita sigue disponible.
- **Falta clave o voz:** revisar env.sh y volver a hacer source. Seleccionar mock en /lab permite seguir probando. No se ocultan fallos de un proveedor real con respuestas mock.
- **Sin conexión:** mantener run.sh abierto y recargar la página. Las conversaciones se reinician al recargar.
- **Sin WebGL:** se muestra el retrato 2D; el diagnóstico aparece en /lab y como descripción accesible/título del botón en la pantalla mínima. El busto es una escultura estilizada original, no un escaneo ni un GLB fotorrealista.
- **Cámara denegada o modelo sin descargar:** se conserva la mirada centrada. MediaPipe descarga el modelo y el runtime la primera vez desde Google/CDN; los fotogramas se procesan localmente y no se envían al backend. Desactivar el botón apaga todas las pistas de cámara.
- **Puerto ocupado:** cambiar `port` en config/modules.yaml. No detener otros procesos ajenos a este proyecto.
- **Primera instalación sin red:** se necesita conexión para Python, npm y Chromium. La aplicación mock funciona después con dependencias locales; las fuentes remotas usan una alternativa del sistema si no hay conexión. El seguimiento opcional necesita su descarga.
- **Latencia:** se informa STT tras fin de habla cuando el navegador ofrece ese evento (0 si no lo ofrece); primer token LLM desde recepción del texto; primer audio TTS desde envío de la primera frase; primer audio total desde recepción del texto; total de generación hasta terminar de sintetizar. No confundir generación total con duración de reproducción. El objetivo de 2,5 s no está garantizado con APIs reales, red o voces distintas.

## Próximos pasos

Contenedor Docker y despliegue HTTPS; un GLB histórico con rig ARKit completo y licencia explícita; gestos de manos; reconocimiento con ElevenLabs Scribe mediante STTProvider; fonemización española para mejorar la aproximación por grafemas; calibración de voz, emociones y sincronía con el audio real. Para publicar en Internet, añadir autenticación y límites de consumo: esta v0 escucha solo en localhost.
