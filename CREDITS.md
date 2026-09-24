# Créditos, licencias y fuentes

## Trabajo original

Código de integración, diseño de interfaz, retrato SVG animado, busto procedural, persona y pruebas: creados para Cervantes Vivo. Licencia MIT en LICENSE. El retrato es una interpretación gráfica, no un cuadro histórico ni una reproducción de autoría atribuida a Cervantes. El busto usa geometría original de Three.js, sin malla externa descargada. No se incluye audio de una persona real.

## Bibliotecas

- Three.js — MIT — https://github.com/mrdoob/three
- Vite — MIT — https://github.com/vitejs/vite
- TypeScript — Apache-2.0 — https://github.com/microsoft/TypeScript
- Playwright — Apache-2.0 — https://github.com/microsoft/playwright
- MediaPipe Tasks Vision y Face Landmarker — Apache-2.0 — https://github.com/google-ai-edge/mediapipe ; modelo publicado por Google, descargado bajo demanda.
- FastAPI — MIT — https://github.com/fastapi/fastapi
- Pydantic — MIT — https://github.com/pydantic/pydantic
- Anthropic Python SDK — MIT — https://github.com/anthropics/anthropic-sdk-python
- HTTPX — BSD-3-Clause — https://github.com/encode/httpx
- Uvicorn — BSD-3-Clause — https://github.com/Kludex/uvicorn
- PyYAML — MIT — https://github.com/yaml/pyyaml
- pytest — MIT — https://github.com/pytest-dev/pytest
- pytest-asyncio — Apache-2.0 — https://github.com/pytest-dev/pytest-asyncio
- uv — MIT / Apache-2.0 — https://github.com/astral-sh/uv
- Cormorant Garamond (Christian Thalmann) y DM Sans (Colophon Foundry y colaboradores) — SIL Open Font License 1.1, servidas mediante Google Fonts, con fuentes del sistema como alternativa. https://github.com/google/fonts/tree/main/ofl/cormorantgaramond ; https://github.com/google/fonts/tree/main/ofl/dmsans

Las distribuciones instaladas mantienen sus archivos LICENSE originales; los lockfiles fijan las versiones efectivamente comprobadas. ElevenLabs y Anthropic son servicios externos sujetos a sus términos y a la cuenta del usuario, no componentes redistribuidos.

## Documentación oficial consultada (24-09-2026)

- Modelos Claude e identificadores: https://platform.claude.com/docs/en/models/overview y https://platform.claude.com/docs/en/claude_api_primer — se seleccionó claude-haiku-4-5-20251001 para priorizar velocidad.
- Streaming Claude: https://platform.claude.com/docs/en/build-with-claude/streaming
- Modelos ElevenLabs: https://elevenlabs.io/docs/overview/models — eleven_flash_v2_5 admite español y está orientado a baja latencia.
- Audio y timestamps: https://elevenlabs.io/docs/api-reference/text-to-speech/stream-with-timestamps
- MediaPipe en navegador: https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js

## Búsqueda de GLB

Se revisaron candidatos antes de elegir el fallback: Summer-Chan ARKit Study Model, declarado CC0 en https://booth.pm/en/items/6344155 (estética anime; no incorporado); https://github.com/riverbornai/Interactive-3D-avatar-ai-agent indica que su GLB no se distribuye. Ninguno resolvía con rapidez un Cervantes histórico con licencia y rig adecuados. Por eso el retrato 2D es el predeterminado y el busto original demuestra la intercambiabilidad sin depender de activos dudosos. No se redistribuyen esos candidatos.
