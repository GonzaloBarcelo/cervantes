import re
from dataclasses import dataclass
from .contracts import Mood

MOODS = {'warm', 'ironic', 'serious', 'thoughtful', 'joyful'}

@dataclass
class Sentence:
    text: str
    mood: Mood

class SentenceParser:
    """Incremental parser: tags can cross any token boundary, never reach TTS."""
    def __init__(self):
        self.buffer = ''
        self.text = ''
        self.mood: Mood = 'warm'

    def feed(self, token: str, final=False) -> list[Sentence]:
        self.buffer += token
        result = []
        while self.buffer:
            if self.buffer[0] == '[':
                end = self.buffer.find(']')
                if end < 0:
                    if final:
                        self.buffer = ''
                    break
                tag = self.buffer[1:end]
                if tag.startswith('mood:') and tag[5:] in MOODS:
                    if self.text.strip():
                        result.append(Sentence(self.text.strip(), self.mood))
                        self.text = ''
                    self.mood = tag[5:]
                self.buffer = self.buffer[end + 1:]
                continue
            char, self.buffer = self.buffer[0], self.buffer[1:]
            self.text += char
            if char in '.!?…':
                result.append(Sentence(self.text.strip(), self.mood))
                self.text = ''
        if final and self.text.strip():
            result.append(Sentence(self.text.strip(), self.mood))
            self.text = ''
        return result
