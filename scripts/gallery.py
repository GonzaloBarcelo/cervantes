"""Build a standalone, offline evidence gallery from actual test artifacts."""
from pathlib import Path
from html import escape
import json

ROOT=Path(__file__).resolve().parent.parent
REPORTS=ROOT/'reports'
(REPORTS/'milestones').mkdir(exist_ok=True)
labels=['Repositorio y plan','Arranque y contratos','Circuito mock','Retrato y visemas','Busto 3D','Claude y emociones','ElevenLabs y tiempos','Voz e interrupción','Interfaces y cambios en vivo','Documentación y auditoría']
sources={0:'m0.txt',1:'m1.txt',2:'m2.txt',3:'m3-unit.txt',4:'m4.txt',5:'m5.txt',6:'m6.txt',7:'m7-backend.txt',8:'m8.txt',9:'../AUDIT.md'}
style='''body{margin:0;background:#181e18;color:#e5dcc7;font:15px/1.6 system-ui,sans-serif}main{max-width:1200px;margin:auto;padding:50px 6%}h1,h2{font-family:Georgia,serif;font-weight:400}h1{font-size:44px;color:#dcc394}h2{margin-top:40px}a{color:#d7b878}p{color:#aab29e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}figure{margin:0;padding:10px;border:1px solid #a8975b44;background:#252c22}img{display:block;width:100%;height:270px;object-fit:cover;object-position:top}figcaption{font-size:11px;padding:9px 4px}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:24px;background:#222a20;border:1px solid #a8975b33;font-size:12px}small{color:#98a28c}.badge{border:1px solid #80926755;padding:6px 12px;border-radius:25px;display:inline-block;font-size:11px}.nav{display:flex;gap:20px;flex-wrap:wrap;margin:22px 0}'''
def document(title,body):
    return f'<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{escape(title)}</title><style>{style}</style><main>{body}</main></html>'
sections=[]
for milestone,label in enumerate(labels):
    source=REPORTS/sources[milestone]
    proof=source.read_text() if source.exists() else 'Evidencia pendiente de la siguiente ejecución.'
    page=document(f'M{milestone} · {label}',f'<small>CERVANTES VIVO · EVIDENCIA DOCUMENTAL</small><h1>M{milestone} · {label}</h1><p>Resumen documental del hito; no es una reconstrucción de una pantalla anterior.</p><pre>{escape(proof)}</pre><p><a href="../index.html">Volver a la galería</a></p>')
    (REPORTS/'milestones'/f'm{milestone}.html').write_text(page)
    pictures=sorted(REPORTS.glob(f'm{milestone}-*.png'))
    cards=''.join(f'<figure><a href="{p.name}"><img loading="lazy" src="{p.name}" alt="{escape(p.stem)}"></a><figcaption>{escape(p.stem)}</figcaption></figure>' for p in pictures)
    sections.append(f'<section><h2>M{milestone} / {label}</h2><p><a href="milestones/m{milestone}.html">Ver evidencia documental ↗</a></p><div class="grid">{cards}</div></section>')
body='<small>CERVANTES VIVO · CUADERNO DE PRUEBAS</small><h1>Lo que se ve.<br>Lo que se ha comprobado.</h1><p>Capturas reales de Chromium. Dos rostros, dos interfaces y dos tamaños de pantalla. Esta galería funciona sin servidor.</p><span class="badge">MODO SIMULADO · SIN CLAVES</span><nav class="nav"><a href="backend-tests.txt">Pruebas del servidor</a><a href="browser-tests.txt">Pruebas del navegador</a><a href="playwright/index.html">Informe Playwright</a><a href="../AUDIT.md">Auditoría</a></nav><p>Las integraciones de pago se verifican con clientes simulados. La voz real, el micrófono físico, la cámara física y la latencia de red necesitan comprobación local con credenciales.</p>'+''.join(sections)
(REPORTS/'index.html').write_text(document('Cervantes Vivo · Evidencias',body))
manifest={str(i):[p.name for p in sorted(REPORTS.glob(f'm{i}-*.png'))] for i in range(10)}
(REPORTS/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Galería generada: {sum(map(len,manifest.values()))} capturas y 10 fichas de hitos.')
