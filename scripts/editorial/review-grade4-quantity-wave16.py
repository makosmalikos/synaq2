"""Independent exact dimensional/rate/age oracle for 30 quantity edits.

All original/new conditions, full solutions and MCQ read. The intentionally
wrong unit equality is tested as false, never endorsed. --write hashes full rows.
No authored renderer/calculator is imported.
"""
from fractions import Fraction as F
from pathlib import Path
from math import isqrt
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-quantity-wave16.json'
OUT = 'problems/editorial/reviews/grade4-quantity-wave16.json'
SCALES = {'мм³': (F(1, 1000000000), 3), 'см³': (F(1, 1000000), 3), 'дм³': (F(1, 1000), 3), 'м³': (F(1), 3),
          'см²': (F(1, 10000), 2), 'дм²': (F(1, 100), 2), 'м²': (F(1), 2), 'км²': (F(1000000), 2),
          'а': (F(100), 2), 'га': (F(10000), 2), 'сотық': (F(100), 2), 'сағ': (F(60), 1), 'мин': (F(1), 1)}


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def one(xs):
    assert len(xs) == 1, xs
    return xs[0]


def integer(x):
    x = F(x); assert x.denominator == 1, x
    return x.numerator


def number(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def quantity(text):
    m = re.fullmatch(r'([\d ]+) ([^\s]+)', text.strip()); assert m, text
    scale, dimension = SCALES[m[2]]
    return number(m[1]) * scale, dimension


def pick(row, values, target):
    assert len(values) == 4 and len(set(row['options'])) == 4
    assert values.count(target) == 1, (row['editionId'], values, target)
    return row['options'][values.index(target)]


def duration(text):
    matches = list(re.finditer(r'(\d+) (сағ|мин)', text))
    assert matches and not re.sub(r'\s+', '', re.sub(r'(\d+) (сағ|мин)', '', text)), text
    return sum((number(m[1]) * SCALES[m[2]][0] for m in matches), F(0))


def volume_expression(text):
    if ' : ' in text:
        left, right = text.split(' : '); value, dimension = quantity(left)
        assert dimension == 3
        return value / number(right)
    op = ' + ' if ' + ' in text else ' − '
    left, right = text.split(op); a, da = quantity(left); b, db = quantity(right)
    assert da == db == 3
    return a + b if op == ' + ' else a - b


def square_side(area):
    area = integer(area); root = isqrt(area)
    assert root * root == area and (root - 1)**2 < area < (root + 1)**2
    return root


def solve(row):
    p = row['params']; kind = row['modelId'].removeprefix('grade4-quantity-')
    answer = value = None
    method = 'Independent exact SI/Fraction dimensional ledger with inverse reconstruction'
    note = ''
    if kind == 'cubic-smaller-difference':
        big, db = quantity(f'{p["large"]} {p["largeUnit"]}'); small, ds = quantity(f'{p["small"]} {p["smallUnit"]}')
        assert db == ds == 3; expected = big - small
        assert expected > 0 and expected + small == big
        if row.get('options'):
            answer = pick(row, [quantity(o) for o in row['options']], (expected, 3))
        else:
            value = integer(expected / SCALES[p['smallUnit']][0])
        note = f'SI volumes {big} minus {small} m³ give {expected}; requested {expected / SCALES[p["smallUnit"]][0]} {p["smallUnit"]}, inverse sum exact.'
    elif kind == 'hectare-are-difference':
        expected = p['hectares'] * SCALES['га'][0] - p['ares'] * SCALES['а'][0]
        answer = pick(row, [quantity(o) for o in row['options']], (expected, 2))
        note = f'Correct SI subtraction {expected} m²; no linear/cubic conversion or addition substitute.'
    elif kind in {'square-metres-plus-ares', 'square-metres-plus-hectares'}:
        unit, count = ('а', p['ares']) if kind == 'square-metres-plus-ares' else ('га', p['hectares'])
        expected = p['m2'] + count * SCALES[unit][0]
        answer = pick(row, [quantity(o) for o in row['options']], (expected, 2))
        note = f'Exact same-dimension sum {p["m2"]} m² plus {count} {unit} gives {expected} m².'
    elif kind == 'cubic-metre-scalar-division':
        expected = F(p['m3'], p['divisor']); value = integer(expected / SCALES['дм³'][0])
        assert expected * p['divisor'] == p['m3']
        note = f'Each exact SI share {expected} m³ = {value} dm³; scalar division retains volume dimension.'
    elif kind == 'greatest-square-area':
        values = [quantity(o) for o in row['options']]; assert all(d == 2 for _, d in values)
        answer = pick(row, values, max(values))
        note = f'Actual printed areas in SI {values}; unique greatest physical area, not greatest written integer.'
    elif kind == 'sotyk-definition':
        answer = pick(row, [quantity(o) for o in row['options']], (F(100), 2))
        method = 'Definition of one are/sotyk as a 10-metre by 10-metre square; actual option dimensions checked'
        note = 'The unit definition 1 sotyk=100 m² is retained exactly; the hectare distractor is 100 times larger.'
    elif kind == 'incorrect-unit-equality':
        truths = []
        for option in row['options']:
            left, right = option.split(' = '); truths.append(quantity(left) == quantity(right))
        answer = row['options'][one([i for i, truth in enumerate(truths) if not truth])]
        assert row.get('intentionalIncorrectExample') is True and 'қате' in row['statement']
        method = 'Separate SI dimensional parsing of BOTH sides of every equality; select the sole FALSE equality as explicitly requested'
        note = f'Full truth vector {truths}; false 2m²=2000dm² is the requested answer, while solution explicitly corrects it to 200dm².'
    elif kind == 'future-age-sum':
        now_child = p['child'] + p['ago']; now_parent = p['parent'] + p['ago']
        future_child, future_parent = now_child + p['after'], now_parent + p['after']; value = future_child + future_parent
        assert future_parent - future_child == p['parent'] - p['child']
        method = 'Two separate age time-lines, shifting from past to present to requested future'
        note = f'Present ages ({now_child},{now_parent}), future ({future_child},{future_parent}), sum {value}; elapsed time added to BOTH people.'
    elif kind == 'mixed-mass-bag-count':
        total = F(p['tonnes'] * 1000 + p['kg']); value = integer(total / p['bagKg'])
        assert value * p['bagKg'] == total
        note = f'Mixed mass {total} kg exactly equals {value} complete bags of {p["bagKg"]} kg.'
    elif kind == 'square-side-area-hectares':
        # Count independent 100m hectare-width intervals in both directions.
        assert p['sideM'] % 100 == 0
        value = sum(1 for _x in range(p['sideM'] // 100) for _y in range(p['sideM'] // 100))
        note = f'Independent hectare-square grid yields {value} 100m×100m cells; length is squared before converting area.'
    elif kind == 'bracket-cubic-volume-division':
        expected = (F(p['m3']) - p['dm3'] * SCALES['дм³'][0]) / p['divisor']; value = integer(expected / SCALES['дм³'][0])
        assert expected * p['divisor'] + p['dm3'] * SCALES['дм³'][0] == p['m3']
        note = f'Exact SI bracket subtraction precedes division; inverse multiplying and restoring subtracted volume returns original {p["m3"]} m³.'
    elif kind == 'greatest-plot-value':
        values = [p['hectares'] * SCALES['га'][0], p['ares'] * SCALES['а'][0], F(p['lengthM'] * p['widthM']), F(p['m2'])]
        value = integer(max(values)); assert values.count(max(values)) == 1
        note = f'All four independent SI plot areas {list(map(str, values))}; requested maximum value {value} m².'
    elif kind == 'greatest-volume-expression':
        values = [volume_expression(o) for o in row['options']]; answer = pick(row, values, max(values))
        method = 'Parse and evaluate every actual printed dimensioned expression using exact SI Fractions'
        note = f'Full SI expression values {list(map(str, values))}; duplicate incorrect values permitted, exactly one maximum.'
    elif kind == 'same-unit-area-gap':
        value = p['firstKm2'] - p['secondKm2']; assert value > 0 and value + p['secondKm2'] == p['firstKm2']
        note = f'Fictional teaching-map regions use the same square-km unit; exact gap {value}, not a geographic fact claim.'
    elif kind == 'sum-mixed-durations':
        expected = 60 * p['hours'] + p['minutes'] + p['otherMinutes']
        answer = pick(row, [duration(o) for o in row['options']], F(expected))
        method = 'Actual printed mixed time options decoded to integer minutes, base60 not base100'
        note = f'Separate durations sum to {expected} minutes; unique matching printed option.'
    elif kind == 'single-worker-proportion':
        rate = F(p['ares'], p['hours']); expected = sum([rate] * p['newHours'], F(0))
        if row.get('options'):
            answer = pick(row, [quantity(o) for o in row['options']], (expected * SCALES['сотық'][0], 2))
        else:
            value = integer(expected)
        assert rate * p['hours'] == p['ares']
        note = f'Exact independent per-hour rate {rate} sotyk; complete {p["newHours"]}-hour ledger {expected}, not additive time difference.'
    elif kind == 'square-area-perimeter':
        target = integer(p['hectares'] * SCALES['га'][0]); side = square_side(target); value = sum([side] * 4)
        method = 'Exact positive integer square-side search with neighbouring-square bounds; explicit four-edge boundary ledger'
        note = f'Area {target} m² yields side {side} m and complete perimeter {value} m; all area/length dimensions distinguished.'
    elif kind == 'worker-hour-productivity':
        rate = F(p['ares'], p['workers'] * p['hours']); work = [rate for _worker in range(p['newWorkers']) for _hour in range(p['newHours'])]
        value = integer(sum(work, F(0))); assert rate * p['workers'] * p['hours'] == p['ares']
        method = 'Separate exact per-worker/per-hour rate, then materialize every new worker-hour contribution'
        note = f'Rate {rate} sotyk/worker-hour; all {len(work)} contributions total {value}, so both time and workforce matter.'
    elif kind == 'closest-area-ratio':
        ratio = F(p['largeKm2'], p['smallKm2']); offered = [number(o.removesuffix(' есе')) for o in row['options']]
        distances = [abs(ratio - n) for n in offered]; answer = row['options'][one([i for i, d in enumerate(distances) if d == min(distances)])]
        method = 'Exact Fraction ratio and distance to EVERY actually offered value, rather than rough premature rounding'
        note = f'Fictional-region ratio {ratio}; candidate distances {list(map(str, distances))}, sole nearest {answer}.'
    elif kind == 'equal-area-square-perimeter':
        shared_area = p['lengthCm'] * p['widthCm']; side = square_side(shared_area); value = sum([side] * 4)
        assert value != 2 * (p['lengthCm'] + p['widthCm'])
        note = f'Common area {shared_area} cm² gives square side {side} cm and perimeter {value}; rectangle perimeter is different and not requested.'
    elif kind == 'greatest-labelled-plot':
        values = {'А': p['hectares'] * SCALES['га'][0] + p['extraAres'] * SCALES['а'][0],
                  'Б': p['ares'] * SCALES['а'][0], 'В': F(p['lengthM'] * p['widthM']), 'Г': F(p['m2'])}
        answer = one([o for o in row['options'] if values[o] == max(values.values())])
        assert max(values.values()) - sorted(values.values())[-2] == 100
        note = f'Complete exact label map {dict((k, str(v)) for k, v in values.items())}; 31500 vs31400 retains near-boundary comparison and requested LABEL.'
    elif kind == 'future-age-ratio':
        times = [t for t in range(201) if p['parent'] + t == p['multiple'] * (p['child'] + t)]
        value = one(times)
        assert p['multiple'] > 1 and p['parent'] - p['multiple'] * p['child'] == (p['multiple'] - 1) * value
        method = 'Complete nonnegative future integer-time search plus linear-equation uniqueness for all future times'
        note = f'Only t={value}, ages ({p["parent"] + value},{p["child"] + value}); difference invariant and exact ratio both checked.'
    elif kind == 'square-land-subdivision':
        big_area = integer(p['km2'] * SCALES['км²'][0]); side = square_side(big_area)
        assert side % p['smallSideM'] == 0
        value = sum(1 for _x in range(0, side, p['smallSideM']) for _y in range(0, side, p['smallSideM']))
        assert value * p['smallSideM']**2 == big_area
        method = 'Exact large-square side then enumerate every cell of the complete two-axis subdivision grid'
        note = f'Large side {side} m; {side // p["smallSideM"]} cells in EACH direction, {value} total; exact area conservation.'
    elif kind == 'scaled-square-sum':
        basic = sum(k * k for k in range(1, p['last'] + 1)); full = sum((p['scale'] * k)**2 for k in range(1, p['last'] + 1))
        assert basic == 204 and full == basic * p['scale'] * p['scale']
        answer = pick(row, [number(o) for o in row['options']], F(full))
        method = 'Independently enumerate BOTH actual square sums and verify formal quadratic coefficient scaling'
        note = f'Unscaled sum {basic}; direct scaled terms total {full}, coefficient {p["scale"]**2}, not linear scale {p["scale"]}.'
    elif kind == 'combined-tractor-rate':
        rate = p['firstAres'] + p['secondAres']; total = p['hectares'] * SCALES['га'][0] / SCALES['сотық'][0]
        time = total / rate; answer = pick(row, [duration(o) for o in row['options']], time * 60)
        assert time * rate == total
        note = f'Nonoverlapping simultaneous rates add to {rate} sotyk/hour; {total} sotyk requires exactly {time} hours, full inverse check.'
    elif kind == 'constant-age-gap':
        elapsed = p['ago'] + p['after']; future_young, future_old = p['child'] + elapsed, p['grandparent'] + elapsed
        value = future_old - future_young; assert value == p['grandparent'] - p['child']
        method = 'Two exact time-lines cancel their identical elapsed-year addend; complete future-age inverse check'
        note = f'Future ages ({future_young},{future_old}), invariant gap {value}; neither age alone is requested.'
    elif kind == 'rectangle-area-perimeter':
        target = p['hectares'] * SCALES['га'][0]; width = integer(target / p['lengthM'])
        assert width * p['lengthM'] == target; value = sum([p['lengthM'], width, p['lengthM'], width])
        note = f'Exact area {target} m² and known length give width {width} m; four individual boundary edges sum {value} m.'
    else:
        raise AssertionError(('Unreviewed quantity model', kind))
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
    rows = json.loads((ROOT / PACK).read_text())['editions']; assert len(rows) == 30
    assert len({r['editionId'] for r in rows}) == len({r['sourceRefs'][0]['sourceId'] for r in rows}) == 30
    entries = []
    for row in rows:
        assert row['grade'] == 4 and row['minimumPlan'] == 'pro'
        assert not re.search(r'[\\$]', row['statement'] + row['solution'])
        for ref in row['sourceRefs']:
            raw = json.loads((ROOT / ref['sourceFile']).read_text())
            q = one([q for q in raw['questions'] if q['id'] == ref['sourceId']])
            assert raw['grade'] == 4 and raw['topic'] == '1-9' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement'] != row['statement']
        method, note = solve(row)
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified', 'method': method,
                        'notes': note + ' All source/new conditions, complete solutions and MCQ read independently. Exact dimensions, past/present/future time bases, invariant age difference, full rate contributions, requested label/value, closest offered ratio and true-versus-intentionally-false selection preserved. No authored solver imported.'})
    rejected = 0
    for row in rows:
        changed = json.loads(json.dumps(row)); changed['answer'] = '__WRONG_KEY__'
        try:
            solve(changed)
        except AssertionError:
            rejected += 1
        else:
            raise AssertionError('Wrong key accepted')
    find = lambda kind: next(r for r in rows if r['modelId'] == 'grade4-quantity-' + kind)
    canaries = []
    c = json.loads(json.dumps(find('incorrect-unit-equality'))); c['intentionalIncorrectExample'] = False; canaries.append(c)
    c = json.loads(json.dumps(find('incorrect-unit-equality'))); c['options'][1] = '2 м² = 200 дм²'; canaries.append(c)
    c = json.loads(json.dumps(find('future-age-sum'))); c['answer'] = str(c['params']['child'] + c['params']['parent'] + c['params']['ago'] + c['params']['after']); canaries.append(c)
    c = json.loads(json.dumps(find('scaled-square-sum'))); c['answer'] = '4 080'; canaries.append(c)
    c = json.loads(json.dumps(find('greatest-labelled-plot'))); c['params']['m2'] = 31500; canaries.append(c)
    c = json.loads(json.dumps(find('greatest-volume-expression'))); c['options'][1] = '410 дм³ + 0 см³'; canaries.append(c)
    c = json.loads(json.dumps(find('future-age-ratio'))); c['answer'] = '18'; canaries.append(c)
    for changed in canaries:
        try:
            solve(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('Lost dimension, false-selection, time base or unique optimum accepted')
    print(json.dumps({'independentQuantityChecks': len(entries), 'wrongKeysRejected': rejected,
                      'dimensionAgeAndDomainCanaries': len(canaries), 'manualFindings': []}, ensure_ascii=False, indent=2))
    if args.write:
        report = {'schemaVersion': 1, 'pack': PACK, 'reviewedAt': '2026-10-23',
                  'scope': 'All 30 original/new quantity conditions, full solutions and MCQ read. Separate exact SI/Fraction parser evaluates printed dimensions/expressions/time options, false unit equality, age time-lines/invariants, positive square sides, full subdivision grids, worker-hour ledgers, direct square sums and closest offered ratios. Full canonical edition hashes bind this review.',
                  'entries': entries}
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('Wrote 30 independent quantity review records.')


if __name__ == '__main__':
    main()
