import pytest
from backend.contracts import Alignment
from backend.visemes import VisemeMapper

def alignment(text):
    return Alignment(characters=list(text),starts=[i*.1 for i in range(len(text))],ends=[(i+1)*.1 for i in range(len(text))])

def test_spanish_visemes():
    cues=VisemeMapper().map(alignment('paeiou ch que'))
    assert [v.viseme for v in cues[:6]] == ['PP','aa','E','I','O','U']
    assert cues[7].viseme == cues[8].viseme == 'CH'
    assert cues[11].viseme == 'sil'
    assert cues[-1].end == pytest.approx(1.3)

def test_alignment_validation():
    with pytest.raises(ValueError): Alignment(characters=['a'],starts=[],ends=[])
    with pytest.raises(ValueError): Alignment(characters=['a'],starts=[1],ends=[0])
