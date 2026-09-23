from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .config import ROOT, Settings

app = FastAPI(title='Cervantes Vivo')

@app.get('/api/health')
def health():
    return {'status': 'ok', 'settings': Settings.load().model_dump()}

@app.get('/')
@app.get('/lab')
def index():
    return FileResponse(ROOT / 'frontend/dist/index.html')

if (ROOT / 'frontend/dist/assets').exists():
    app.mount('/assets', StaticFiles(directory=ROOT / 'frontend/dist/assets'), name='assets')
app.mount('/reports', StaticFiles(directory=ROOT / 'reports', html=True), name='reports')
