# Decisiones

- Repositorio inicialmente vacío y sin commits; no hay archivos ajenos que modificar. Se conserva origin.
- Modo automático sin claves: mock explícito en /lab y en la descripción accesible del botón de la pantalla mínima. Nunca se silencian fallos de un proveedor real mediante un cambio oculto a mock.
- Python 3.12 se instala localmente con uv si no está disponible. run.sh instala dependencias y compila la interfaz en el primer arranque.
- Retrato 2D original como cara predeterminada. La búsqueda de GLB libres con ARKit encontró Summer-Chan CC0 (https://booth.pm/en/items/6344155), incompatible estéticamente con Cervantes sin trabajo de autoría considerable, y proyectos que no distribuyen su GLB. Para v0 se usa un busto procedural original, con morph targets ARKit de boca y párpados; no se atribuye a un modelo histórico auténtico.
- La voz mock es audio sintético alineado, no habla inteligible. Permite comprobar tiempos y labios sin claves. El laboratorio y la descripción accesible del botón lo indican.
- Claude Haiku 4.5 (claude-haiku-4-5-20251001) prioriza latencia; ID comprobado en documentación oficial. ElevenLabs eleven_flash_v2_5 admite español y streaming con marcas temporales.

## Cambio solicitado durante la revisión final

- El usuario pidió una interfaz completamente minimalista: en `/` solo se muestran el rostro y un botón para hablar. Ese mismo botón detiene la respuesta. Se eliminan cabecera, navegación, textos, temas, subtítulos y pie de la pantalla principal. Esto sustituye los requisitos visuales originales que entren en conflicto. `/lab` conserva herramientas, entrada escrita, subtítulos y seguimiento opcional; se abre mediante su URL.
- Estados, descripción del modo simulado y errores permanecen accesibles para lectores de pantalla; el botón comunica estados mediante icono/color y errores mediante su título. No hay controles adicionales ocultos en `/`.
- A petición explícita se configura el Codex local con approval_policy=never y sandbox_mode=danger-full-access. La configuración de permisos es personal, no forma parte del repositorio. El turno activo conserva su política de ejecución; la configuración persistente no se interpreta como autorización para saltársela.

- Para mantener una comparación histórica sin falsear capturas, las fichas M0/M1/M2/M5/M6/M9 son evidencias documentales claramente etiquetadas; las capturas de aplicación se regeneran con la interfaz vigente.
