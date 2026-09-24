# Cervantes Vivo — progreso

Fuente de verdad. Inicio: 2026-09-24. Cada hito se verifica antes del siguiente.

- [x] M0 Reconocimiento y rama. Repositorio vacío, main sin commits, origin git@github.com:GonzaloBarcelo/cervantes.git. Rama feat/cervantes-vivo creada; estado inicial limpio.
- [x] M1 Contratos, configuración, arranque y HTTP 200. Evidencia: reports/m1.txt; source env.sh && ./run.sh instala, compila y arranca (puerto requiere permiso del sandbox).
- [x] M2 Proveedores mock, contratos y conversación WebSocket. reports/m2.txt: 4 pruebas aprobadas; primer audio mock < 2,5 s.
- [x] M3 Visemas españoles y retrato animado. reports/m3-unit.txt: 6 pruebas; Playwright 1/1; m3-portrait-idle.png y m3-mouth-{aa,O,PP}.png revisadas visualmente.
- [x] M4 Busto 3D procedural con morph targets ARKit, parpadeo, respiración y mirada. Playwright bust.spec.ts 1/1; reports/m4-bust-desktop.png revisada visualmente; cambio de vuelta a retrato verificado.
- [x] M5 Anthropic streaming con cliente inyectable y persona española. reports/m5.txt: 14 pruebas aprobadas, parser comprobado con cortes de 1, 2, 7 y 1000 caracteres.
- [x] M6 ElevenLabs streaming PCM con alineación y cliente HTTP inyectable. reports/m6.txt: 20 pruebas; JSON fragmentado, tiempos por petición/chunk, error HTTP y claves ausentes verificados.
- [x] M7 Voz, estados e interrupción E2E: flow.spec.ts 3/3. contracts.spec.ts 1/1 cubre ambas caras y ambos STT; espera por fotograma corrige carrera en prueba WebGL. reports/m7-backend.txt: 25 pruebas; permisos de micrófono/cámara denegados y reconocimiento con objeto del navegador simulado. Cámara física pendiente de usuario.
- [x] M8 gallery.spec.ts 9/9: ambas rutas y caras a 1440/390 px, cambios de proveedores/voz y recuperación sin claves. Capturas móviles revisadas; reports/index.html generado con fichas de los 10 hitos.
- [x] M9 Documentación y auditoría completas. Verificación final: 26 pytest + 26 Playwright aprobadas; 29 capturas. Minimalismo solicitado verificado en escritorio/móvil. reports/delivery-checks.txt confirma env vacío/ignorado y ejemplo ejecutado; smoke sin claves sale 2 sin llamadas. AUDIT.md detalla aceptación condicionada a prueba real con credenciales.

Próxima acción del usuario: probar el botón en localhost; validar voz, micrófono/cámara y latencia reales con sus credenciales mediante scripts/smoke_live.sh. Entrega publicada en origin/feat/cervantes-vivo; servidor final disponible en localhost:8000 y HTTP 200 comprobado.

## Validación con credenciales del usuario (24-09-2026)

- Claves cargadas desde env.sh sin mostrarlas; servidor reiniciado con Anthropic, ElevenLabs y STT browser reales.
- Gabo devolvió HTTP 402 / paid_plan_required. Se volvió a comprobar tras añadirla el usuario a una colección; la restricción continúa.
- La ejecución actual utiliza temporalmente George mediante TTS_VOICE; env.sh conserva la voz elegida por el usuario y no se ha modificado.
- Smoke real aprobado: 101 paquetes de audio, primer audio 1300,6 ms. WebSocket real adicional aprobado: 11/11 paquetes con alineación, primer audio 1153,9 ms.
- Se corrigió la alineación anticipada de ElevenLabs: retención y recorte por fragmento PCM, con offset de caracteres para subtítulos. 27 pruebas Python aprobadas, compilación TypeScript/Vite y contrato frontend aprobados.
- Prueba lista en http://127.0.0.1:8000/?reset=1. El parámetro descarta selecciones mock antiguas del laboratorio en esa sesión. El control de navegador del entorno no está disponible; se entrega el enlace para abrirlo manualmente.
