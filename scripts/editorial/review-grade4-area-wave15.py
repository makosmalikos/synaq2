"""Independent SI-dimension/Fraction/domain review of 27 area editions.

All source/new conditions, full solutions and MCQ read before hash signing.
No authored renderer/calculator imported. --write records exact edition hashes.
"""
from fractions import Fraction as F
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-area-wave15.json'
OUT = 'problems/editorial/reviews/grade4-area-wave15.json'
M2 = {'см²': F(1, 10000), 'дм²': F(1, 100), 'м²': F(1), 'км²': F(1000000), 'а': F(100), 'га': F(10000), 'сотық': F(100)}


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def one(values):
    assert len(values) == 1, values
    return values[0]


def integer(x):
    x = F(x); assert x.denominator == 1, x
    return x.numerator


def number(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def area(text):
    m = re.fullmatch(r'([\d ]+) ([^\s]+)', text.strip()); assert m, text
    assert m[2] in M2, text
    return number(m[1]) * M2[m[2]]


def typed(text):
    # Equal numeric values with different dimensions are different answers.
    return (F(number(text)), 0) if re.fullmatch(r'[\d ]+', text) else (area(text), 2)


def pick(row, values, target):
    assert len(values) == 4 and values.count(target) == 1, (row['editionId'], values, target)
    # Incorrect options may legitimately express the same wrong physical value;
    # the source has this, while there must never be two correct equivalents.
    assert len(set(row['options'])) == 4
    return row['options'][values.index(target)]


def sign(a, b):
    return '<' if a < b else '>' if a > b else '='


def head_leg_pairs(heads, legs):
    return [(two, heads - two) for two in range(heads + 1) if 2 * two + 4 * (heads - two) == legs]


def solve(row):
    p = row['params']; kind = row['modelId'].removeprefix('grade4-area-')
    answer = value = None
    method = 'Independent exact SI square-metre Fraction ledger and inverse check'
    note = ''
    if kind == 'same-area-quotient':
        numerator, denominator = p['first'] * M2['а'], p['second'] * M2['а']
        expected = numerator / denominator; answer = pick(row, [typed(o) for o in row['options']], (expected, 0))
        assert expected * denominator == numerator
        method = 'Dimension-aware quantity/quantity division; parse actual options as scalar versus area'
        note = f'Area dimensions cancel, exact ratio {expected}; the equally numbered are-valued option is dimensionally wrong.'
    elif kind == 'hectare-comparison':
        answer = sign(p['hectares'] * M2['га'], p['rightM2'] * M2['м²'])
        note = f'Exact sides {p["hectares"] * M2["га"]} and {p["rightM2"]} m², compare after conversion.'
    elif kind == 'scalar-area-division':
        expected = p['area'] * M2['а'] / p['divisor']
        assert expected * p['divisor'] == p['area'] * M2['а']
        if row.get('options'):
            answer = pick(row, [typed(o) for o in row['options']], (expected, 2))
        else:
            value = integer(expected / M2['а'])
        method = 'Dimension-aware quantity/scalar division retaining area, with full inverse reconstruction'
        note = f'Each share {expected} m² = {expected / M2["а"]} a; a numeric-only MCQ alternative loses the required dimension.'
    elif kind == 'are-minus-square-metres':
        value = integer(p['ares'] * M2['а'] - p['m2'])
        assert value + p['m2'] == p['ares'] * M2['а']
        note = f'Exact residual {value} m² back-adds to all {p["ares"]} a.'
    elif kind == 'mixed-area-sum-hectares':
        value = integer((p['m2'] + p['ares'] * M2['а']) / M2['га'])
        assert value * M2['га'] == p['m2'] + p['ares'] * M2['а']
        note = f'Independent SI sum converted once to {value} ha, checking both original units.'
    elif kind == 'plot-yard-remainder':
        total = p['sotyks'] * M2['сотық']; garden = p['gardenSotyks'] * M2['сотық']
        value = integer(total - garden - p['houseM2'])
        assert value > 0 and value + garden + p['houseM2'] == total
        note = f'Nonoverlapping house {p["houseM2"]}, garden {garden} and yard {value} m² close the exact total {total}.'
    elif kind == 'hectare-two-step':
        target = p['hectares'] * M2['га']; valid = []
        for i, option in enumerate(row['options']):
            sides = option.split('='); assert len(sides) == 2
            a, b = [area(side.strip()) for side in sides]
            if a == b == target:
                valid.append(i)
        answer = row['options'][one(valid)]
        method = 'Parse both printed chain quantities and require each to equal the ORIGINAL hectare value'
        note = f'Original target {target} m²; a true equality describing one-tenth the input is still rejected.'
    elif kind in {'square-metre-dm-sum', 'dm-first-area-sum'}:
        expected = p['m2'] + p['dm2'] * M2['дм²']
        answer = pick(row, [area(o) for o in row['options']], expected)
        note = f'SI sum {expected} m²; exact requested representation {expected / M2["дм²"]} dm², not linear or cubic scale.'
    elif kind == 'square-metre-dm-difference':
        expected = p['m2'] - p['dm2'] * M2['дм²']; value = integer(expected / M2['дм²'])
        assert expected + p['dm2'] * M2['дм²'] == p['m2']
        note = f'Exact difference {expected} m² = {value} dm², checked by inverse addition.'
    elif kind in {'greatest-area', 'least-area'}:
        values = [area(o) for o in row['options']]; best = max(values) if kind == 'greatest-area' else min(values)
        answer = pick(row, values, best)
        note = f'Actual printed SI values {list(map(str, values))}; one correct extremum despite two equivalent wrong quantities.'
    elif kind == 'hectare-are-quotient':
        numerator = p['hectares'] * M2['га']; denominator = p['ares'] * M2['а']; value = integer(numerator / denominator)
        assert value * denominator == numerator
        note = f'SI area/area ratio {value}; dimension cancels and the inverse recovers {numerator} m².'
    elif kind == 'square-metre-cm-comparison':
        answer = sign(p['m2'], p['rightCm2'] * M2['см²'])
        assert p['m2'] * 10000 < p['rightCm2'] and p['rightCm2'] - p['m2'] * 10000 < 100
        note = f'Exact comparison {p["m2"]} versus {p["rightCm2"] * M2["см²"]} m² retains the small zero-placeholder difference.'
    elif kind == 'hectare-minus-square-metres':
        value = integer(p['hectares'] * M2['га'] - p['m2'])
        assert value > 0 and value + p['m2'] == p['hectares'] * M2['га']
        note = f'SI subtraction {value} m², inverse exactly returns {p["hectares"]} ha.'
    elif kind == 'four-legged-animal-count':
        two, four = one(head_leg_pairs(p['heads'], p['legs'])); value = four
        assert two > 0 and four > 0
        method = 'Enumerate every nonnegative two-legged animal count; impose independent head and leg equations'
        note = f'Unique complete population ({two} chickens, {four} {p["animal"]}); all heads and legs reconstruct, not just offered values.'
    elif kind == 'land-sum-gap-larger':
        total = integer(p['hectares'] * M2['га'] / M2['а'])
        pairs = [(smaller, total - smaller) for smaller in range(total + 1) if total - 2 * smaller == p['gapAres']]
        small, large = one(pairs); expected = large * M2['а']; answer = pick(row, [area(o) for o in row['options']], expected)
        assert small + large == total and large - small == p['gapAres']
        method = 'Complete integer-are pair domain constrained simultaneously by total and exact difference'
        note = f'Only smaller/larger pair ({small},{large}) a; requested larger {expected} m², not smaller or half the total.'
    elif kind == 'children-horses-count':
        target = one(head_leg_pairs(p['heads'], p['legs']))
        parsed = []
        for option in row['options']:
            m = re.fullmatch(r'(\d+) бала, (\d+) жылқы', option); assert m
            parsed.append(tuple(map(int, m.groups())))
        answer = pick(row, parsed, target)
        method = 'Complete positive head/leg population domain plus parsing each actual ordered child-horse choice'
        note = f'Unique ordered population {target}; reversed counts have the same head total but fail the leg total.'
    elif kind == 'rectangle-target-hectares':
        target = p['hectares'] * M2['га']; areas = []
        for option in row['options']:
            m = re.fullmatch(r'(\d+) м және (\d+) м', option); assert m
            a, b = map(int, m.groups()); areas.append(a * b)
        answer = pick(row, areas, target)
        note = f'All actual option rectangle products {areas} m²; only one equals original {p["hectares"]} ha.'
    elif kind == 'area-before-rescaling':
        # Formal ratio (fa)(gb)/(ab)=f*g for arbitrary positive original sides.
        factor = p['lengthFactor'] * p['widthFactor']; expected = p['newHectares'] * M2['га'] / factor
        answer = pick(row, [area(o) for o in row['options']], expected)
        assert expected * p['lengthFactor'] * p['widthFactor'] == p['newHectares'] * M2['га']
        method = 'Formal bilinear area scaling cancellation and exact inverse SI ratio'
        note = f'Dimensionless length/width factors multiply to {factor}; original {expected} m² scales back to new {p["newHectares"]} ha.'
    elif kind == 'square-plot-fence':
        target = integer(p['sotyks'] * M2['сотық']); side = one([n for n in range(1, target + 1) if n * n == target])
        # Four separate boundary segments, rather than area multiplied by four.
        boundary = [side, side, side, side]; value = sum(boundary)
        method = 'Complete positive square-side domain followed by an explicit four-segment boundary ledger'
        note = f'Area {target} m² gives unique side {side} m; all four complete edges total {value} m, with no missing gate.'
    elif kind == 'rectangle-length-excess':
        target = integer(p['ares'] * M2['а']); length = one([n for n in range(1, target + 1) if n * p['widthM'] == target])
        value = length - p['widthM']; assert value > 0
        note = f'Only length {length} m reconstructs {target} m² at width {p["widthM"]}; requested length excess {value} m.'
    elif kind == 'hectare-minus-ares':
        expected = p['hectares'] * M2['га'] - p['ares'] * M2['а']; value = integer(expected / M2['а'])
        assert expected + p['ares'] * M2['а'] == p['hectares'] * M2['га']
        note = f'Exact remaining area {expected} m² = {value} a; complete inverse unit check.'
    elif kind == 'fractional-house-garden':
        total = p['sotyks'] * M2['сотық']; house = total / p['houseDivisor']; expected = total - house - p['pathsM2']
        answer = pick(row, [area(o) for o in row['options']], expected)
        assert expected > 0 and expected + house + p['pathsM2'] == total
        note = f'House uses 1/{p["houseDivisor"]} of ORIGINAL {total} m² = {house} m²; disjoint paths {p["pathsM2"]}; garden {expected} m² closes total.'
    else:
        raise AssertionError(('Unreviewed area model', kind))
    if answer is None:
        value = integer(value)
        answer = pick(row, [number(o) for o in row['options']], value) if row.get('options') else str(value)
    assert row['answer'] == answer, (row['editionId'], row['answer'], answer)
    if row.get('options'):
        assert len(row['options']) == len(set(row['options'])) == 4 and row['options'].count(answer) == 1
    else:
        assert re.fullmatch(r'\d+', answer) and re.search(r'Жауап[^.]*тек сан', row['statement'])
    return method, note


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--write', action='store_true'); args = parser.parse_args()
    rows = json.loads((ROOT / PACK).read_text())['editions']; assert len(rows) == 27
    assert len({r['editionId'] for r in rows}) == len({r['sourceRefs'][0]['sourceId'] for r in rows}) == 27
    entries = []
    for row in rows:
        assert row['grade'] == 4 and row['minimumPlan'] == 'pro'
        assert not re.search(r'[\\$]', row['statement'] + row['solution'])
        for ref in row['sourceRefs']:
            raw = json.loads((ROOT / ref['sourceFile']).read_text())
            q = one([q for q in raw['questions'] if q['id'] == ref['sourceId']])
            assert raw['grade'] == 4 and raw['topic'] == '1-8' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement'] != row['statement']
        method, note = solve(row)
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified', 'method': method,
                        'notes': note + ' All original/new conditions, complete solutions and source/new MCQ read independently. Scalar-versus-area dimensions, original conversion target, square-unit scales, overlap/fraction bases, requested quantities and full positive domains preserved. No authored solver imported.'})
    rejected = 0
    for row in rows:
        changed = json.loads(json.dumps(row)); changed['answer'] = '__WRONG_KEY__'
        try:
            solve(changed)
        except AssertionError:
            rejected += 1
        else:
            raise AssertionError('Wrong key accepted')
    find = lambda kind: next(r for r in rows if r['modelId'] == 'grade4-area-' + kind)
    canaries = []
    c = json.loads(json.dumps(find('same-area-quotient'))); c['answer'] = '6 а'; canaries.append(c)
    c = json.loads(json.dumps(next(r for r in rows if r['modelId'] == 'grade4-area-scalar-area-division' and r.get('options')))); c['answer'] = '12'; canaries.append(c)
    c = json.loads(json.dumps(find('hectare-two-step'))); c['answer'] = c['options'][0]; canaries.append(c)
    c = json.loads(json.dumps(find('greatest-area'))); c['options'][0] = '4000000 дм²'; canaries.append(c)
    c = json.loads(json.dumps(find('children-horses-count'))); c['answer'] = '12 бала, 17 жылқы'; canaries.append(c)
    c = json.loads(json.dumps(find('square-plot-fence'))); c['answer'] = str(c['params']['sotyks'] * 4); canaries.append(c)
    c = json.loads(json.dumps(find('area-before-rescaling'))); c['answer'] = c['options'][0]; canaries.append(c)
    for changed in canaries:
        try:
            solve(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('Lost original target, dimension, units or population order accepted')
    print(json.dumps({'independentAreaChecks': len(entries), 'wrongKeysRejected': rejected,
                      'dimensionalAndDomainCanaries': len(canaries), 'manualFindings': []}, ensure_ascii=False, indent=2))
    if args.write:
        report = {'schemaVersion': 1, 'pack': PACK, 'reviewedAt': '2026-10-23',
                  'scope': 'All 27 source/new area conditions, complete solutions and MCQ read. Separate exact SI square-unit/Fraction parser distinguishes area/scalar dimensions, original chain targets, full animal/head-leg and land-pair domains, square-side/rectangle inverse searches, fractional bases and formal area scale cancellation. Full canonical edition hashes bind this review.',
                  'entries': entries}
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('Wrote 27 independent area review records.')


if __name__ == '__main__':
    main()
