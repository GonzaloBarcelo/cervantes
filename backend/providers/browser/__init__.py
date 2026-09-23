class BrowserSTT:
    """Browser recognizes speech; the server accepts its finalized transcript."""
    async def transcribe(self, payload: str, language: str = 'es-ES') -> str:
        if not payload.strip():
            raise ValueError('No se ha reconocido ninguna palabra. Intentad de nuevo.')
        return payload.strip()
