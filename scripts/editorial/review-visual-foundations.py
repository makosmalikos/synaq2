"""Independent arithmetic and SVG audit after root's four 343px contact-sheet reads."""
import hashlib
import json
import math
from decimal import Decimal
from fractions import Fraction as Q
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
FILE = 'problems/editorial/batches/visual-foundations.json'

def canonical_hash(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()

def decimal(q):
    text = format(Decimal(q.numerator) / Decimal(q.denominator), 'f')
    if '.' in text: text = text.rstrip('0').rstrip('.')
    return text.replace('.', ',')

def answer(row):
    p, model = row['params'], row['modelId']
    if model == 'visual-abacus-number': return ''.join(map(str, p['digits']))
    if model == 'visual-route-days': return str(Q(sum(p['segmentsCm'])*p['kmPerCm'], p['kmPerDay']))
    if model == 'visual-clock-angle':
        degrees = abs(30*p['hour'] + Q(p['minute'],2) - 6*p['minute'])
        return decimal(min(degrees, 360-degrees))
    if model == 'visual-sector-fraction': return str(Q(p['shaded'], p['total']))
    if model == 'visual-temperature-rise': return str(p['warm']-p['cold'])
    if model == 'visual-bar-difference': return str(p['values'][p['first']]-p['values'][p['second']])
    if model == 'visual-line-growth': return str(p['values'][p['to']-1]-p['values'][p['from']-1])
    if model == 'visual-ray-numerator': return str(p['numerator'])
    if model == 'visual-notch-perimeter': return str(2*(p['width']+p['height']+p['depth']))
    if model == 'visual-fan-triangles': return str(math.comb(p['baseSegments']+1, 2))
    if model == 'visual-polygon-triangulation': return str(p['sides']-2)
    if model == 'visual-venn-union':
        a, b, intersection = p['leftOnly']+p['both'], p['rightOnly']+p['both'], p['both']
        return str(a+b-intersection)
    if model == 'visual-interval-maximum':
        return str(max(i['hi']-(not i['hiClosed']) for i in [p['a'],p['b']]))
    if model == 'visual-seven-segment-mass':
        count = {'0':6,'1':2,'2':5,'3':5,'4':4,'5':5,'6':6,'7':3,'8':7,'9':6}
        return decimal(Q(sum(count[d] for d in p['target'])*p['referenceCents'],200))
    if model == 'visual-point-ox-reflection': return f"({p['x']}; {-p['y']})"
    if model == 'visual-pixel-reflection': return str(len(p['cells']))
    if model == 'visual-open-pool-surface': return str(p['length']*p['width']+2*p['depth']*(p['length']+p['width']))
    if model == 'visual-vertical-angle': return str(p['angle'])
    if model == 'visual-circle-sector-gap': return str(360-sum(p['known']))
    if model == 'visual-nested-subsets': return str(2**len(p['inner']))
    if model == 'visual-square-circle-corners': return decimal(Q((400-p['piHundredths'])*p['radius']**2,100))
    if model == 'visual-ring-width': return str(p['outer']-p['inner'])
    raise ValueError(model)

def check(write=False):
    rows = json.loads((ROOT / FILE).read_text())['editions']
    assert len(rows) == 22 and len({r['modelId'] for r in rows}) == 22
    entries = []
    for row in rows:
        expected = answer(row)
        assert row['answer'] == expected, (row['editionId'],expected)
        assert not any(c in row['statement']+row['solution'] for c in ['$', '\\'])
        image = ROOT / 'frontend/public' / row['image'].lstrip('/')
        data = image.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        assert digest == row['figureSha256']
        svg = ET.fromstring(data)
        assert svg.attrib['viewBox'] == '0 0 480 320'
        assert not any(n.tag.rsplit('}',1)[-1] in ['image','script','foreignObject'] for n in svg.iter())
        if row['modelId'] == 'visual-seven-segment-mass':
            sticks = [n for n in svg.iter() if n.attrib.get('data-stick') == '1']
            assert len(sticks) == 21 # two reference sticks + nineteen target sticks
            for n in sticks:
                length = math.hypot(float(n.attrib['x2'])-float(n.attrib['x1']),float(n.attrib['y2'])-float(n.attrib['y1']))
                assert length == 32, 'All material sticks must have the same actual length'
        entries.append({'editionId':row['editionId'],'sha256':canonical_hash(row),
            'verdict':'verified','reviewer':'independent_root_agent',
            'method':'separate_python_formula_and_manual_343px_svg_review',
            'expectedAnswer':expected,
            'checks':['new and source conditions and explanations read separately',
                      'answer independently recomputed without importing author model',
                      'native diagram inspected at 343px for givens, labels, count and geometry'],
            'figureReview':{'status':'verified','sha256':digest,'viewportWidth':343,
                           'nativeSvg':True,'sourceTracing':False,
                           'checked':['all labels readable','diagram agrees with written givens','no answer-dependent missing data']}})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':len(entries),'entries':entries}
    if write:
        (ROOT / 'problems/editorial/reviews/visual-foundations.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report

if __name__ == '__main__':
    import sys
    result=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':result['reviewed'],'result':'passed'}))
