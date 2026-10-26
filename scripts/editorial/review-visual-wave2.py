"""Independent integer-angle and actual SVG audit, after all five 343px sheet reads.

The author uses unit vectors. This reviewer instead uses integer circular
distances, linear bisectors, weighted sorted sums and a strict sliding window.
No author calculator or renderer is imported.
"""
import bisect
import hashlib
import json
import math
from fractions import Fraction
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
FILE = 'problems/editorial/batches/visual-wave2-protractors.json'


def canonical_hash(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def circular_distance(a, b):
    delta = abs(a - b) % 360
    return min(delta, 360 - delta)


def angle_name(a, b):
    return '∠' + a + 'O' + b


def answer(row):
    p = row['params']
    kind = row['modelId'].removeprefix('visual-wave2-')
    marks = {r['label']: r['mark'] for r in p['rays']}
    assert len(marks) == len(p['rays']) == len(set(marks.values()))
    assert all(0 <= m <= 180 for m in marks.values()) or kind == 'external-supplement'
    d = lambda a, b: circular_distance(marks[a], marks[b])
    if 'future' in p:
        assert p['future'] not in marks, 'A requested construction must not be pre-drawn'
    if kind == 'baseline-reading':
        assert marks[p['base']] == (180 if p['scale'] == 'outer' else 0)
        return str(d(p['base'], p['target']))
    if kind in ('named-target-reading', 'nonzero-reading', 'difference-rays',
                'named-ray-difference', 'mixed-scale-reading'):
        return str(d(p['base'], p['target']))
    if kind == 'construction-point':
        matches = [r['label'] for r in p['rays'] if r.get('pointOnly') and
                   circular_distance(marks[p['base']], r['mark']) == p['goal']]
        assert len(matches) == 1
        return matches[0]
    if kind == 'external-supplement':
        assert d(p['visible'], p['opposite']) == 180
        return str(d(p['base'], p['opposite']))
    if kind == 'bisector-check':
        a, b = d(p['base'], p['middle']), d(p['middle'], p['target'])
        assert a + b == d(p['base'], p['target'])
        return ('Иә: ' if a == b else 'Жоқ: ') + f'{a}° және {b}°'
    if kind == 'baseline-supplement':
        assert d(p['baselineLeft'], p['baselineRight']) == 180
        return str(d(p['target'], p['baselineLeft']))
    if kind in ('construct-bisector', 'bisector-crossscale'):
        middle = Fraction(marks[p['base']] + marks[p['target']], 2)
        assert middle.denominator == 1
        return str(middle)
    if kind == 'adjacent-difference':
        a, b = d(p['first'], p['middle']), d(p['middle'], p['last'])
        assert a + b == d(p['first'], p['last']) and b > a
        return str(b - a)
    if kind == 'bisector-offset':
        middle = Fraction(marks[p['first']] + marks[p['last']], 2)
        expected = abs(marks[p['middle']] - middle)
        assert expected.denominator == 1
        return str(expected)
    if kind == 'equal-angle':
        matches = [angle_name(a, b) for a, b in p['candidates']
                   if d(a, b) == d(p['base'], p['target'])]
        assert len(matches) == 1
        return matches[0]
    if kind == 'pair-sum':
        ordered = sorted(marks.values())
        # Each position contributes positively in i pairs and negatively in
        # n-1-i pairs. This is independent of the author's pair enumeration.
        return str(sum((2*i - len(ordered) + 1)*a for i, a in enumerate(ordered)))
    if kind == 'identify-ray':
        matches = [label for label in marks if label != p['base'] and
                   d(p['base'], label) == p['goal']]
        assert len(matches) == 1
        return 'O' + matches[0]
    if kind == 'twice-angle':
        expected = d(p['base'], p['target'])*2
        assert marks[p['base']] == 0 and 0 < expected < 180
        return str(expected)
    if kind == 'supplement-difference':
        assert d(p['left'], p['right']) == 180
        return str(d(p['target'], p['right']) - d(p['left'], p['target']))
    if kind == 'acute-count':
        ordered = sorted(marks.values())
        # Strictly before a+90: a right angle is not counted as acute.
        return str(sum(bisect.bisect_left(ordered, a+90, i+1) - i - 1
                       for i, a in enumerate(ordered)))
    raise ValueError(kind)


def check_svg(row):
    raw = (ROOT / 'frontend/public' / row['image'].lstrip('/')).read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    assert digest == row['figureSha256']
    svg = ET.fromstring(raw)
    assert svg.attrib['viewBox'] == '0 0 480 360'
    assert not any(n.tag.rsplit('}', 1)[-1] in ('image', 'script', 'foreignObject')
                   for n in svg.iter())
    p = row['params']
    group = next(n for n in svg.iter() if 'data-instrument-rotation' in n.attrib)
    assert group.attrib['transform'] == f"rotate({p['rotation']} 240 236)"
    assert int(group.attrib['data-instrument-rotation']) == p['rotation']
    ticks = {int(n.attrib['data-tick']): n for n in svg.iter() if 'data-tick' in n.attrib}
    assert set(ticks) == set(range(181))
    lines = {n.attrib['data-ray']: n for n in svg.iter() if 'data-ray' in n.attrib}
    assert set(lines) == {r['label'] for r in p['rays'] if not r.get('pointOnly')}
    for r in p['rays']:
        if r.get('pointOnly'):
            expected_x = 240 + 180*math.cos(math.radians(r['mark']))
            expected_y = 236 - 180*math.sin(math.radians(r['mark']))
            matches = [n for n in svg.iter() if n.tag.endswith('circle') and
                       n.attrib.get('r') == '3.7' and
                       math.isclose(float(n.attrib['cx']), expected_x, abs_tol=.001) and
                       math.isclose(float(n.attrib['cy']), expected_y, abs_tol=.001)]
            assert len(matches) == 1
        else:
            node = lines[r['label']]
            assert (float(node.attrib['x1']), float(node.attrib['y1'])) == (240, 236)
            actual = math.degrees(math.atan2(236-float(node.attrib['y2']),
                                            float(node.attrib['x2'])-240)) % 360
            assert circular_distance(actual, r['mark']) < .001
    for degree, tick in ticks.items():
        actual = math.degrees(math.atan2(236-float(tick.attrib['y1']),
                                        float(tick.attrib['x1'])-240)) % 360
        assert circular_distance(actual, degree) < .001
    for scale in ('inner', 'outer'):
        labels = {int(n.attrib['data-direction']): n for n in svg.iter()
                  if n.attrib.get('data-scale') == scale}
        assert set(labels) == set(range(0, 181, 20))
        for degree, label in labels.items():
            assert label.text == str(degree if scale == 'inner' else 180-degree)
    return digest


def check(write=False):
    rows = json.loads((ROOT / FILE).read_text())['editions']
    assert len(rows) == 29
    assert len({r['modelId'] for r in rows}) == 20
    entries = []
    for row in rows:
        expected = answer(row)
        assert row['answer'] == expected, (row['editionId'], expected)
        assert not any(c in row['statement'] + row['solution'] for c in ('$', '\\'))
        if row.get('options'):
            assert len(set(row['options'])) == len(row['options'])
            assert row['options'].count(expected) == 1
        digest = check_svg(row)
        entries.append({'editionId': row['editionId'], 'sha256': canonical_hash(row),
            'verdict': 'verified', 'reviewer': 'independent_root_agent',
            'method': 'separate_python_integer_angle_and_actual_svg_geometry_audit',
            'expectedAnswer': expected,
            'checks': ['all 29 source conditions and complete explanations read',
                       'all new conditions, solutions and options read separately',
                       'independent integer-angle, midpoint, weighted-sum and sliding-window answers',
                       'actual SVG ray endpoints, degree ticks and both scale labels recomputed'],
            'figureReview': {'status': 'verified', 'sha256': digest, 'viewportWidth': 343,
                'nativeSvg': True, 'sourceTracing': False,
                'checked': ['all five contact sheets inspected at 343px',
                            'givens and point labels agree with the condition',
                            'unknown construction rays not pre-drawn',
                            'rotated instruments and below-instrument ray remain visible']}})
    report = {'schemaVersion': 1, 'date': '2026-10-23', 'batchFile': FILE,
              'reviewed': len(entries), 'entries': entries}
    if write:
        (ROOT / 'problems/editorial/reviews/visual-wave2-protractors.json').write_text(
            json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    return report


if __name__ == '__main__':
    import sys
    result = check('--write-review' in sys.argv)
    print(json.dumps({'reviewed': result['reviewed'], 'result': 'passed'}))
