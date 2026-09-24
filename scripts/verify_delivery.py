"""Verify repository packaging without printing matching secret material."""
from pathlib import Path
import ast
import asyncio
import re
import subprocess
from backend.config import Settings
from backend.contracts import LLMProvider, Message

ROOT=Path(__file__).resolve().parent.parent
files=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
issues=[]
for name in set(files):
    path=ROOT/name
    if not name or not path.is_file() or path.suffix in {'.png','.zip','.jpg'}:continue
    text=path.read_text(errors='ignore')
    if re.search(r'sk-ant-[A-Za-z0-9_-]{20,}|sk-[A-Za-z0-9]{40,}',text):issues.append(name)
assert not issues, 'Posibles secretos en: '+', '.join(issues)
assert not subprocess.check_output(['git','ls-files','env.sh'],cwd=ROOT).strip()
assert subprocess.run(['git','check-ignore','-q','env.sh'],cwd=ROOT).returncode==0
assert re.findall(r'^export (\w+)="(.*)"$',(ROOT/'env.sh.example').read_text(),re.M)==[('ANTHROPIC_API_KEY',''),('ELEVENLABS_API_KEY',''),('ELEVENLABS_VOICE_ID','')]
assert (ROOT/'reports/index.html').exists()
for face in ['portrait2d','bust3d']:
    for route in ['salon','lab']:
        for size in ['desktop','mobile']:
            assert (ROOT/f'reports/m8-{route}-{face}-{size}.png').exists()
# Run the complete minimal LLM example exactly as documented.
doc=(ROOT/'docs/ADDING_MODULES.md').read_text()
code=re.findall(r'```python\n(.*?)```',doc,re.S)[0]
namespace={};exec(compile(ast.parse(code),'<documented SaludoLLM>','exec'),namespace)
provider=namespace['SaludoLLM']()
assert isinstance(provider,LLMProvider)
async def verify_example():
    chunks=[c async for c in provider.stream([Message(role='user',content='Hola')],Settings().persona_data())]
    assert len(chunks)==2 and chunks[0].startswith('[mood:warm]')
asyncio.run(verify_example())
print(f'OK: {len(set(files))} archivos de entrega revisados sin patrones de claves.')
print('OK: env.sh ignorado y no versionado; ejemplo con tres valores vacíos.')
print('OK: galería y matriz de capturas / y /lab, ambas caras, escritorio y móvil.')
print('OK: ejemplo mínimo LLM de ADDING_MODULES.md ejecutado.')
