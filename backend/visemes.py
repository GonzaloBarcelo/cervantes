import unicodedata
from .contracts import Alignment, VisemeCue

class VisemeMapper:
    """Spanish grapheme approximation in the normalized Oculus 15-viseme set.

    Character timestamps are not phonemes. Digraphs and silent h/u are handled;
    anticipatory blending and temporal smoothing belong to the renderer.
    """
    def map(self, alignment: Alignment) -> list[VisemeCue]:
        chars = ''.join(alignment.characters).lower()
        normalized = ''.join(c for c in unicodedata.normalize('NFD', chars) if unicodedata.category(c) != 'Mn')
        table = dict(zip('aeiou', ['aa', 'E', 'I', 'O', 'U']))
        table.update({c: v for letters, v in [('bmpv','PP'),('f','FF'),('td','DD'),('kgjq','kk'),('s','SS'),('nl','nn'),('r','RR'),('z','TH'),('y','I'),('x','SS')] for c in letters})
        cues = []
        for i, char in enumerate(normalized):
            previous = normalized[i-1] if i else ''
            following = normalized[i+1] if i+1 < len(normalized) else ''
            v = table.get(char, 'sil')
            if char == 'c': v = 'CH' if following == 'h' else 'TH' if following in ('e', 'i') else 'kk'
            if char == 'h' and previous == 'c': v = 'CH'
            if char == 'u' and previous in ('q', 'g') and following in ('e', 'i') and chars[i] != 'ü': v = 'sil'
            if char == 'l' and (following == 'l' or previous == 'l'): v = 'I'
            cues.append(VisemeCue(viseme=v, start=alignment.starts[i], end=alignment.ends[i]))
        return cues
