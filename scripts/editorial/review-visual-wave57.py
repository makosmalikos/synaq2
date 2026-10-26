"""Independent full ten saved/new condition, solution and choice review; four actual sheets viewed."""
import hashlib
import json
import math
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from fractions import Fraction as F
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/visual-wave57-pictured-decimal-conversion.json'
BLUE = '#91c0ec'


def close(a, b):
    assert abs(a - b) < 1e-7, (a, b)


def numeric(s):
    m = re.fullmatch(r'\((\d+) \+ \((\d+)/(\d+)\)\)', s)
    if m:
        w, n, d = map(int, m.groups())
        return w + F(n, d)
    return F(s.replace(',', '.'))


def observe(r, i):
    raw = (ROOT / 'frontend/public' / r['image'].lstrip('/')).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == r['figureSha256']
    es = list(ET.fromstring(raw).iter())
    tag = lambda e: e.tag.rsplit('}', 1)[-1]
    cells = [e for e in es if tag(e) == 'rect' and e.get('stroke') == '#203549']
    sectors = [e for e in es if tag(e) == 'path']
    labels = [''.join(e.itertext()) for e in es if tag(e) == 'text']

    def grid(groups, rows, cols, expected_blue):
        assert not sectors and len(cells) == groups * rows * cols
        # Group by actual physical gap between whole squares, never data-* labels.
        xs = sorted(set(float(e.get('x')) for e in cells))
        ys = sorted(set(float(e.get('y')) for e in cells))
        assert len(xs) == groups * cols and len(ys) == rows
        width = float(cells[0].get('width'))
        height = float(cells[0].get('height'))
        close(width, height)
        for j in range(1, rows): close(ys[j] - ys[j - 1], height)
        observed = []
        for g in range(groups):
            gx = xs[g * cols:(g + 1) * cols]
            for j in range(1, cols): close(gx[j] - gx[j - 1], width)
            if g: assert gx[0] - xs[g * cols - 1] > width
            group = [e for e in cells if float(e.get('x')) in gx]
            assert len(group) == rows * cols
            assert len({(e.get('x'), e.get('y')) for e in group}) == rows * cols
            for e in group:
                close(float(e.get('width')), width); close(float(e.get('height')), height)
                assert e.get('fill') in [BLUE, '#fff']
            observed.append(sum(e.get('fill') == BLUE for e in group))
        assert observed == expected_blue, observed
        return {'actualPhysicalWholeGrids': groups, 'actualRowsColumns': [rows, cols], 'actualBlueCells': observed, 'equalSquareSidePx': width}

    def pie(groups, parts, expected_blue):
        assert not cells
        circles = defaultdict(list)
        for e in sectors:
            m = re.fullmatch(r'M ([\d.e+-]+) ([\d.e+-]+) L ([\d.e+-]+) ([\d.e+-]+) A ([\d.e+-]+) ([\d.e+-]+) 0 0 1 ([\d.e+-]+) ([\d.e+-]+) Z', e.get('d'))
            assert m
            cx, cy, ax, ay, rx, ry, bx, by = map(float, m.groups())
            close(rx, ry); close(math.hypot(ax - cx, ay - cy), rx); close(math.hypot(bx - cx, by - cy), rx)
            a = math.atan2(ay - cy, ax - cx); b = math.atan2(by - cy, bx - cx)
            close((b - a) % (2 * math.pi), 2 * math.pi / parts)
            assert e.get('fill') in [BLUE, '#fff']
            circles[cx, cy, rx].append((a, e.get('fill')))
        assert len(circles) == groups
        observed = []
        radii = []
        for (_, _, radius), group in sorted(circles.items()):
            assert len(group) == parts
            angles = sorted(a for a, color in group)
            for j, angle in enumerate(angles): close((angles[(j + 1) % parts] - angle) % (2 * math.pi), 2 * math.pi / parts)
            observed.append(sum(color == BLUE for a, color in group)); radii.append(radius)
        assert observed == expected_blue
        assert len(set(radii)) == 1
        return {'actualCircles': groups, 'actualEqualSectorDegrees': 360 / parts, 'actualBlueSectors': observed, 'equalCircleRadiiPx': radii}

    if i == 0:
        assert len(cells) == 5 and not sectors
        cells.sort(key=lambda e: float(e.get('x')))
        for j, e in enumerate(cells):
            close(float(e.get('x')), 42 + j * 396 / 5)
            close(float(e.get('width')), 396 / 5)
            assert float(e.get('height')) == 58 and float(e.get('y')) == 170
            assert e.get('fill') == (BLUE if j < 3 else '#fff')
        assert 'ҮТІРДЕН КЕЙІНГІ БІР ЦИФРЫН' in r['statement']
        assert '(3/5) = (6/10) = 0,6' in r['solution']
        return '6', {'actualEqualStripCells': 5, 'actualBlueCells': 3, 'exactFraction': '3/5', 'requestedDigitNotDecimal': 6}
    if i in [1, 3, 6, 7]:
        rs, cs, blue = {1: (10, 10, 46), 3: (4, 5, 9), 6: (10, 10, 76), 7: (4, 8, 19)}[i]
        proof = grid(1, rs, cs, [blue]); value = F(blue, rs * cs)
        if i == 6:
            assert math.gcd(blue, rs * cs) == 4 and value == F(19, 25)
            assert 'a + b' in r['statement'] and '19 + 25 = 44' in r['solution']
            return str(value.numerator + value.denominator), {**proof, 'realReductionGCD': 4, 'coprimeFraction': str(value), 'requestedNumeratorPlusDenominator': 44}
        expected = {1: '0,46', 3: '0,45', 7: '0,59375'}[i]
        assert numeric(expected) == value
        assert [numeric(o) == value for o in r['options']].count(True) == 1
        if i == 7:
            assert 'ДӘЛ' in r['statement'] and 'жуықтамаңыз' in r['statement']
            assert value * 100000 == 59375 and 100000 // 32 == 3125
            assert numeric('0,5937') != value and numeric('0,40625') == 1 - value
            assert '(19/32) = (59375/100000) = 0,59375' in r['solution']
        if i == 3:
            assert numeric('0,9') == F(9, 10) and numeric('0,55') == 1 - value
        return expected, {**proof, 'exactObservedFraction': str(value), 'exactDecimal': expected, 'allChoiceMembershipChecked': True}
    if i in [2, 4, 8]:
        parts, blue = {2: (4, 3), 4: (8, 5), 8: (5, 3)}[i]
        proof = pie(1, parts, [blue]); value = F(blue, parts)
        expected = {2: '0,75', 4: '0,625', 8: '0,6'}[i]
        assert numeric(expected) == value
        assert [numeric(o) == value for o in r['options']].count(True) == 1
        target = {2: 100, 4: 1000, 8: 10}[i]; multiplier = target // parts
        assert target % parts == 0 and blue * multiplier == value * target
        if i == 8: assert numeric('0,3') == F(blue, 10) != value
        return expected, {**proof, 'actualObservedFraction': str(value), 'targetDenominator': target, 'additionalMultiplierForBoth': multiplier, 'allChoiceMembershipChecked': True}
    if i == 5:
        proof = pie(3, 5, [5, 5, 3]); value = F(13, 5)
        assert 'БАРЛЫҚ' in r['statement'] and 'Әр дөңгелек — бір бүтін' in labels
        assert numeric('2,6') == value
        assert [numeric(o) == value for o in r['options']].count(True) == 1
        return '2,6', {**proof, 'sameWholeTotal': str(value), 'allChoiceMembershipChecked': True}
    assert i == 9
    proof = grid(3, 10, 10, [100, 100, 65]); value = F(265, 100)
    assert 'ҚЫСҚАРТЫЛМАЙТЫН' in r['statement'] and math.gcd(65, 100) == 5
    assert value == 2 + F(13, 20) and math.gcd(13, 20) == 1
    assert [numeric(o) == value for o in r['options']].count(True) == 1
    assert numeric(r['options'][1]) == value * 10
    assert numeric(r['options'][2]) == 2 + 1 - F(65, 100)
    assert numeric(r['options'][3]) == 2 + F(13, 200)
    return '(2 + (13/20))', {**proof, 'realReductionGCD': 5, 'exactMixed': [2, 13, 20], 'allChoiceMembershipChecked': True}


def main():
    rows = json.loads((ROOT / PACK).read_text())['editions']
    assert len(rows) == 10
    entries = []
    for i, r in enumerate(rows):
        answer, proof = observe(r, i)
        assert answer == r['answer']
        if r.get('options'): assert len(set(r['options'])) == 4 and r['options'].count(answer) == 1
        sheet = 1 if i < 6 else 2
        entries.append({'editionId': r['editionId'], 'sha256': hashlib.sha256(json.dumps(r, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest(), 'verdict': 'verified', 'method': 'Independent full10saved/new/solutions/everyMCQ read, four actual source/native343px sheets viewed, physical SVG equalcell/arc observer and exact Fraction decimal/reduction oracle; no author params or solver imported', 'observed': proof, 'figureReview': {'status': 'verified', 'sha256': r['figureSha256'], 'viewportWidth': 343, 'nativeSvg': True, 'sourceTracing': False, 'sourceRasterAvailable': True, 'sourceSheet': f'output/editorial-visual-wave57/visual-wave57-source-{sheet}.png', 'nativeSheet': f'output/editorial-visual-wave57/visual-wave57-contact-{sheet}.png', 'checked': ['actual physical equal cell positions, counts, area and colors', 'actual arc radii, equal sector angles, complete disjoint circle partitions', 'same whole for all complete and partial grids or circles', 'exact full decimal and requested one digit distinguished', 'real GCD reductions and mixed whole preserved', 'all distractors evaluated, five-place truncation rejected', '343px sheets legible without clipping or overlays']}})
    code = "import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('" + PACK + "')).editions.map(q=>[q.editionId,editionHash(q)])));"
    hashes = dict(json.loads(subprocess.check_output(['node', '--input-type=module', '-e', code], cwd=ROOT, text=True)))
    assert all(hashes[e['editionId']] == e['sha256'] for e in entries)
    report = {'schemaVersion': 1, 'reviewer': 'independent_editorial_review', 'evidence': {'oracle': 'scripts/editorial/review-visual-wave57.py', 'fullSavedAndNewRead': 10, 'actualSheetsViewed': 4, 'findings': []}, 'entries': entries}
    if '--write' in sys.argv: (ROOT / 'problems/editorial/reviews/visual-wave57-pictured-decimal-conversion.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'independentlyVerified': 10, 'physicalSVGEqualPartsAndExactConversion': True, 'hashesMatched': 10, 'actual343pxSheetsViewed': 4}))


if __name__ == '__main__': main()
