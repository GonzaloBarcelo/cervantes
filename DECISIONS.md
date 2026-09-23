# Decisiones

- Repositorio inicialmente vacío y sin commits; no hay archivos ajenos que modificar. Se conserva origin.
- Modo automático sin claves: mock explícito y visible. Nunca se silencian fallos de un proveedor real mediante un cambio oculto a mock.
- Python 3.12 se instala localmente con uv si no está disponible. run.sh instala dependencias y compila la interfaz en el primer arranque.
- Retrato 2D original como cara predeterminada. La búsqueda de GLB libres con ARKit encontró Summer-Chan CC0 (https://booth.pm/en/items/6344155), incompatible estéticamente con Cervantes sin trabajo de autoría considerable, y proyectos que no distribuyen su GLB. Para v0 se usa un busto procedural original, con morph targets ARKit de boca y párpados; no se atribuye a un modelo histórico auténtico.
- La voz mock es audio sintético alineado, no habla inteligible. Permite comprobar tiempos y labios sin claves. La interfaz lo indica.
- Claude Haiku 4.5 (claude-haiku-4-5-20251001) prioriza latencia; ID comprobado en documentación oficial. ElevenLabs eleven_flash_v2_5 admite español y streaming con marcas temporales.
