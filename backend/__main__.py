import uvicorn
from .config import Settings
settings = Settings.load()
uvicorn.run('backend.app:app', host=settings.host, port=settings.port)
