import os
from anthropic import AsyncAnthropic
from ...config import Settings
from ...contracts import Message, Persona

class AnthropicLLM:
    def __init__(self, settings: Settings, client=None):
        self.settings = settings
        self.client = client

    async def stream(self, history: list[Message], persona: Persona):
        key = os.getenv('ANTHROPIC_API_KEY', '')
        if self.client is None and not key:
            raise ValueError('Falta ANTHROPIC_API_KEY.')
        client = self.client or AsyncAnthropic(api_key=key, timeout=30, max_retries=1)
        try:
            async with client.messages.stream(model=self.settings.llm_model, max_tokens=300,
                    system=persona.system_prompt,
                    messages=[m.model_dump() for m in history]) as response:
                async for text in response.text_stream:
                    yield text
        finally:
            if self.client is None:
                await client.close()
