# Auditoría de Cervantes Vivo — 24-09-2026

La misión adjunta se ha releído íntegramente. También se aplica la modificación posterior del usuario: pantalla principal con solo rostro y botón. Los requisitos originales de textos, navegación, subtítulos y escena decorada en / quedan sustituidos por esa instrucción; se mantienen las herramientas en /lab.

## Alcance y límites explícitos

Implementación completa de v0 verificable sin claves: dos caras, todos los proveedores, laboratorio, conversación por frases, cancelación, subtítulos y evidencias. Las llamadas reales a Anthropic/ElevenLabs, la voz elegida, su latencia y el hardware de micrófono/cámara no se han comprobado con credenciales o dispositivos reales. No se afirma lo contrario.

El retrato 2D original es predeterminado. Busto 3D procedural con subconjunto ARKit funcional; no se entrega un GLB histórico ni rig de 52 expresiones. La alternativa está permitida por la misión y justificada en DECISIONS.md/CREDITS.md. El audio mock es sintético y no habla inteligible.

## Requisitos y evidencia

| Requisito | Comprobación |
|---|---|
| Repositorio respetado, sin git init | Repositorio inicial vacío; reports/m0.txt; rama feat/cervantes-vivo; commits por hitos |
| Plan y progreso recuperable | PROGRESS.md actualizado por cada hito; decisiones y fuentes separadas |
| Arranque único Python 3.12 / FastAPI / Vite TS | source env.sh && ./run.sh ejecutado; reports/m1.txt; scripts/test.sh vuelve a compilar |
| Protocols, Pydantic y registro | backend/contracts.py, registry.py; contratos de todas las implementaciones |
| Config YAML y sobrescrituras | Settings.load; tests/test_pipeline.py; selecciones en vivo por conexión |
| Persona española, límites de citas e identidad IA | personas/cervantes.yaml; E2E pregunta explícita sobre IA |
| LLM Anthropic + mock, stream y emociones | tests/test_anthropic.py: cliente simulado y etiquetas cortadas en cada carácter |
| TTS ElevenLabs + mock, stream y tiempos | tests/test_elevenlabs.py: transporte fragmentado, PCM, timestamps, fallos HTTP |
| STT browser + mock y contrato backend | tests/test_mock.py; frontend contracts.spec.ts y flow.spec.ts |
| Visemas independientes y españoles | tests/test_visemes.py; screenshots m3-mouth-* |
| Dos caras y comportamiento vivo | portrait2d / bust3d; mismo contrato; parpadeo, respiración, mirada, energía y emociones |
| Cámara opcional y fallback | MediaPipe solo tras pulsación, liberación de pistas; error de permisos E2E; hardware real pendiente |
| Primera frase sin esperar respuesta completa | test_first_sentence_audio_precedes_llm_completion fuerza al LLM a esperar el primer audio |
| Target 2,5 s | Prueba mock de primer audio <2500 ms; latencias visibles; servicios reales pendientes |
| Estados e interrupción | Pruebas WebSocket y Playwright; audio y tareas cancelados, eventos tardíos por número de turno |
| Interfaz mínima y responsive | / contiene solo rostro y un botón; minimal.spec.ts comprueba un único control, sin textos/navegación/formularios visibles. Estados accesibles y cambio de icono. /lab conserva i18n.ts, subtítulos y diagnóstico; 1440/390 px |
| Laboratorio y cambios en vivo | gallery.spec.ts; voces warm/bright y campos modelo/voz; estado de todos los módulos |
| Intercambio de proveedores sin claves | test_provider_swap_uses_real_adapters_with_mocked_transports: 4 combinaciones Anthropic/mock × ElevenLabs/mock |
| Evidencia offline | scripts/gallery.py genera reports/index.html y fichas de hitos; Playwright guarda capturas |
| Documentación y extensión | README.md, docs/ADDING_MODULES.md (ejemplos completos), docs/ARCHITECTURE.md, CREDITS.md |
| Claves fuera del repositorio | env.sh ignorado; env.sh.example vacío; escaneo de entrega en reports/delivery-checks.txt |
| Prueba real lista | scripts/smoke_live.sh valida claves antes de cualquier llamada; sin claves sale con código 2 |

## Aceptación final

1. Arranque sin pasos ocultos: implementado y ejecutado, sujeto a los requisitos de Node/Python y red inicial documentados.
2. Voz real con Claude + ElevenLabs: adaptadores listos y probados con clientes simulados; aceptación perceptiva real pendiente de claves del usuario.
3. MOCK=1 sin claves: circuito completo automatizado.
4. Cambio modular: YAML/variables y /lab; dos caras; combinación de proveedores probada con mocks.
5. /, /lab y galería offline: presentes y capturados.
6. Sin claves reales: placeholders vacíos, exclusión Git y escaneo antes de entrega.

No hay aprobaciones funcionales pendientes. Las limitaciones de servicios reales se entregan de forma explícita, con un smoke reproducible para comprobarlas.

## Resultado consolidado

- `./scripts/test.sh`: **26 pruebas pytest aprobadas** (1,17 s) y **26 pruebas Playwright aprobadas** (47,6 s), con servidor aislado sin claves. Evidencias: reports/backend-tests.txt, reports/browser-tests.txt y reports/playwright/index.html.
- TypeScript y Vite compilados sin errores: reports/build.txt. Advertencia no bloqueante: FastAPI/Starlette avisa de futura migración de httpx a httpx2 en el cliente de pruebas; no afecta a las pruebas actuales.
- **29 capturas** y 10 fichas documentales en la galería. Capturas finales de la pantalla mínima revisadas visualmente a 1440×1000 y 390×844; solo rostro y botón, sin scroll vertical ni horizontal.
- `python -m scripts.verify_delivery`: archivos de entrega revisados sin patrones de claves; env.sh no versionado, ignorado e idéntico al ejemplo vacío; matriz de capturas presente; ejemplo LLM de ADDING_MODULES ejecutado.
- `./scripts/smoke_live.sh` sin credenciales: salida 2 con mensaje español; no realizó peticiones. Las APIs reales permanecen expresamente sin verificar.
- Configuración personal de Full access escrita y vuelta a leer mediante tomllib: approval_policy=never y sandbox_mode=danger-full-access. El resto del archivo global se conservó; copia previa temporal en /private/tmp/cervantes-codex-config.before.toml. No se modifican por ello los permisos impuestos al turno activo.
- Cambios agrupados en commits sobre feat/cervantes-vivo; no se ha usado force push ni se ha creado otro repositorio.

## Primera comprobación recomendada

Abrir http://127.0.0.1:8000 y pulsar el único botón: escuchar los tonos mock y observar labios; pulsarlo otra vez detiene la respuesta. Después, rellenar localmente env.sh y ejecutar source env.sh, MOCK=0 ./run.sh y scripts/smoke_live.sh. Usar /lab para seleccionar voz/modelo, ver errores y contrastar latencias. Las claves no deben pegarse en conversaciones ni commits.
