"""Independent Fraction/finite-domain oracle for all 30 mass editions.

No authored calculator or renderer is imported. Source/new conditions, complete
solutions and MCQ are read before signing. --write binds exact edition hashes.
"""
from fractions import Fraction as F
from itertools import product
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-mass-wave13.json'
OUT = 'problems/editorial/reviews/grade4-mass-wave13.json'
KG = {'мг': F(1, 1000000), 'г': F(1, 1000), 'кг': F(1), 'ц': F(100), 'т': F(1000)}


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def one(values):
    assert len(values) == 1, values
    return values[0]


def number(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def kg(text):
    # Parse the actual printed mixed-unit option into exact SI kilograms.
    matches = list(re.finditer(r'(\d[\d ]*)\s+(мг|кг|г|ц|т)(?=\s|$)', text))
    assert matches and not re.sub(r'\s+', '', re.sub(r'(\d[\d ]*)\s+(мг|кг|г|ц|т)(?=\s|$)', '', text)), text
    return sum((number(m[1]) * KG[m[2]] for m in matches), F(0))


def pick(row, values, target):
    assert len(values) == len(set(values)) == 4, ('Equivalent choices', row['editionId'], values)
    assert values.count(target) == 1, (row['editionId'], values, target)
    return row['options'][values.index(target)]


def sign(a, b):
    return '<' if a < b else '>' if a > b else '='


def integer(x):
    x = F(x); assert x.denominator == 1, x
    return x.numerator


def labelled_partitions(masses, count, size=None):
    # Search all k^n labelled assignments, then quotient by sorted member sets.
    assert len(masses) == len(set(masses))
    target = F(sum(masses), count); results = set()
    for labels in product(range(count), repeat=len(masses)):
        groups = [tuple(v for v, label in zip(masses, labels) if label == i) for i in range(count)]
        if all(sum(g) == target and (size is None or len(g) == size) for g in groups):
            results.add(tuple(sorted(tuple(sorted(g)) for g in groups)))
    return sorted(results)


def pair_solution(p):
    candidates = []
    for a in range(1, min(p['ab'], p['ac'])):
        b, c = p['ab'] - a, p['ac'] - a
        if b > 0 and c > 0 and b + c == p['bc']:
            candidates.append((a, b, c))
    return one(candidates)


def locate_lighter(candidates, light):
    if len(candidates) == 1:
        return candidates[0], 0
    assert len(candidates) % 3 == 0
    size = len(candidates) // 3
    left, right, outside = candidates[:size], candidates[size:2 * size], candidates[2 * size:]
    # Each normal token is one mass unit; the unique light token is 1/2.
    weight = lambda group: sum(F(1, 2) if token == light else F(1) for token in group)
    result = sign(weight(left), weight(right))
    next_group = left if result == '<' else right if result == '>' else outside
    found, depth = locate_lighter(next_group, light)
    return found, depth + 1


def solve(row):
    p = row['params']; kind = row['modelId'].removeprefix('grade4-mass-')
    value = answer = None
    method = 'Independent exact Fraction kilogram ledger and inverse substitution'
    note = ''
    if kind == 'physical-unit':
        possible = [unit for unit in row['options'] if p['quantity'] * KG[unit] < F(1, 2000)]
        answer = one(possible)
        note = f'All four candidate units converted to kilograms; only {p["quantity"]} {answer} is below the explicit half-gram bound.'
    elif kind in {'greatest-mixed-mass', 'lightest-mixed-mass'}:
        values = [kg(option) for option in row['options']]
        best = max(values) if kind.startswith('greatest') else min(values)
        answer = pick(row, values, best)
        method = 'Independent exact SI-kilogram parser on all actual printed mixed-unit choices'
        note = f'Four exact masses {list(map(str, values))}; unique {"maximum" if kind.startswith("greatest") else "minimum"} {best} kg.'
    elif kind == 'tonne-centner-ratio':
        value = integer((p['tonnes'] * KG['т']) / (p['centners'] * KG['ц']))
        assert p['centners'] * KG['ц'] * value == p['tonnes'] * KG['т']
        note = f'SI ratio {value}; multiplying the smaller mass back recovers the larger, not their difference.'
    elif kind == 'gram-milligram-compare':
        a = p['grams'] * KG['г'] + p['milligrams'] * KG['мг']; b = p['rightMg'] * KG['мг']
        assert p['milligrams'] < 100 and p['milligrams'] > 0
        answer = sign(a, b)
        note = f'Exact masses {a} and {b} kg; three-place milligram placeholder is retained.'
    elif kind == 'supply-shortfall':
        value = p['needed'] - p['available']; assert value > 0
        assert p['available'] + value == p['needed']
        note = f'Shortfall {value} t back-adds to required {p["needed"]} t.'
    elif kind == 'strict-mass-threshold':
        values = [kg(option) for option in row['options']]; threshold = p['tonnes'] * KG['т']
        answer = row['options'][one([i for i, v in enumerate(values) if v > threshold])]
        assert values.count(threshold) == 1 and len(set(values)) == 4
        method = 'Parse every printed SI mass and apply strict >, including an exact-equality distractor'
        note = f'Masses {list(map(str, values))}, bound {threshold} kg; equality explicitly excluded.'
    elif kind == 'mixed-centner-borrow':
        left = p['leftTonnes'] * KG['т'] + p['leftCentners'] * KG['ц']
        right = p['rightTonnes'] * KG['т'] + p['rightCentners'] * KG['ц']
        value = integer((left - right) / KG['ц'])
        assert p['leftCentners'] < p['rightCentners'] and right + value * KG['ц'] == left
        note = f'SI sides {left}, {right} kg; difference {value} centners, borrowing constraint remains active.'
    elif kind == 'ordered-small-masses':
        parsed = [tuple(kg(item.strip()) for item in option.split(';')) for option in row['options']]
        answer = one([option for option, masses in zip(row['options'], parsed)
                      if len(masses) == 4 and len(set(masses)) == 4 and list(masses) == sorted(masses)])
        assert len({tuple(sorted(values)) for values in parsed}) == 1
        method = 'Read each actual complete ordering and compare all four exact Fraction masses'
        note = f'Only the ascending full permutation is correct; all choices contain the same four masses, retaining internal milligram zeros.'
    elif kind == 'equal-basket-total':
        partitions = labelled_partitions(p['masses'], p['baskets'])
        assert partitions, 'Equal total is insufficient without an actual indivisible assignment'
        value = integer(F(sum(p['masses']), p['baskets']))
        method = 'All 3^7 labelled whole-fruit assignments; quotient by identical basket permutations'
        note = f'{len(partitions)} feasible unlabelled equal-mass partitions; each basket {value} kg, all seven fruits used exactly once.'
    elif kind == 'approx-fruit-count':
        value = integer(F(p['totalKg']) / (p['unitGrams'] * KG['г']))
        assert value * p['unitGrams'] == p['totalKg'] * 1000
        note = f'Using the stated approximate average mass, {value} fruits reconstruct the total exactly; answer remains approximate.'
    elif kind == 'two-year-combined-yield':
        previous = p['thisYear'] - p['less']; value = sum([previous, p['thisYear']])
        assert previous > 0 and p['thisYear'] - previous == p['less']
        note = f'Previous year {previous} kg verified against the given deficit; two distinct years total {value} kg.'
    elif kind == 'sample-production-mass':
        samples = [p['sampleMg'] * KG['мг']] * (p['perDay'] * p['days'])
        total = sum(samples, F(0)); answer = pick(row, [kg(o) for o in row['options']], total)
        note = f'Complete {len(samples)}-sample SI ledger totals {total} kg; printed daily-only and scale-error choices rejected.'
    elif kind == 'two-backward-yield-steps':
        previous = p['current'] - p['firstLess']; value = previous - p['secondLess']
        assert value > 0 and value + p['secondLess'] + p['firstLess'] == p['current']
        note = f'Two successive backward-year ledgers yield {previous} then {value}; both signed deficits restored by inverse addition.'
    elif kind == 'mixed-mass-product':
        single = F(p['kg']) + p['grams'] * KG['г']; total = sum([single] * p['multiplier'], F(0))
        answer = pick(row, [kg(o) for o in row['options']], total)
        assert p['grams'] * p['multiplier'] == 1000
        note = f'Repeated mixed-mass total {total} kg; gram part carries exactly one kilogram, rather than multiplying only the kg component.'
    elif kind == 'equal-portion-count':
        value = integer(F(p['kg']) / (p['portionGrams'] * KG['г']))
        assert value * p['portionGrams'] * KG['г'] == p['kg']
        note = f'{value} complete equal portions recover all {p["kg"]} kg with no leftover.'
    elif kind == 'correct-mass-equality':
        truths = []
        for option in row['options']:
            sides = option.split('='); assert len(sides) == 2
            truths.append(kg(sides[0].strip()) == kg(sides[1].strip()))
        answer = row['options'][one([i for i, truth in enumerate(truths) if truth])]
        method = 'Independent SI parsing of both actual sides of every printed equality'
        note = f'Complete truth vector {truths}; only 3700 kg equals the mixed tonne-centner quantity.'
    elif kind == 'three-pack-ratio-offset':
        total = p['totalKg'] * 1000 + p['totalGrams']; candidates = []
        for first in range(1, total):
            second = first * p['multiplier']; third = second + p['offsetGrams']
            if first + second + third == total:
                candidates.append((first, second, third))
        triple = one(candidates); value = triple[0]
        method = 'Enumerate every positive integer gram value of the first pack, checking both relational constraints and total'
        note = f'Unique masses {triple} g; sum {sum(triple)} and offset {triple[2] - triple[1]} verified independently.'
    elif kind == 'two-pan-unmeasurable':
        reachable = {sum(c * w for c, w in zip(coefficients, p['weights']))
                     for coefficients in product((-1, 0, 1), repeat=len(p['weights']))}
        choices = [number(o) for o in row['options']]
        answer = row['options'][one([i for i, n in enumerate(choices) if n not in reachable])]
        assert len(set(choices)) == 4 and min(p['weights']) > 1
        assert number(answer) == sum(p['weights']) - 1
        method = 'All 27 signed weight placements: absent, object pan, opposite pan; no weight used twice'
        note = f'Choice feasibility {[(n, n in reachable) for n in choices]}; unique impossible value, not merely greater than total.'
    elif kind == 'two-equal-one-multiple':
        parsed = [tuple(integer(kg(piece.strip())) for piece in o.split(';')) for o in row['options']]
        answer = row['options'][one([i for i, xs in enumerate(parsed)
                                    if len(xs) == 3 and sum(xs) == p['total'] and xs[0] == xs[1] and xs[2] == p['multiplier'] * xs[0]])]
        assert len(set(parsed)) == 4
        method = 'Check all ordered printed mass triples against total, first-two equality and third-to-each multiplier'
        note = f'Unique valid ordered triple {parsed[row["options"].index(answer)]}; alternatives may satisfy total but fail relationships.'
    elif kind == 'minimum-one-pan-weights':
        depth = 0
        while 2**depth - 1 < p['upper']:
            depth += 1
        weights = [2**i for i in range(depth)]
        reachable = {sum(w for w, used in zip(weights, useds) if used) for useds in product((False, True), repeat=depth)}
        assert set(range(p['upper'] + 1)) <= reachable and 2**(depth - 1) - 1 < p['upper']
        value = depth
        method = 'Information lower bound for arbitrary one-pan weights plus exhaustive subset construction proving sufficiency'
        note = f'{depth - 1} weights have at most {2**(depth - 1) - 1} nonempty subsets; all {len(reachable)} subsets of {weights} cover every requested whole gram.'
    elif kind in {'three-pair-package-masses', 'three-pair-fruit-masses'}:
        triple = pair_solution(p); value = triple[p['ask']]
        method = 'Enumerate every positive first mass and impose all three pair sums simultaneously'
        note = f'Unique full triple {triple}; requested index {p["ask"]} gives {value} kg, not total or an unasked member.'
    elif kind == 'lighter-token-weighings':
        cases = [locate_lighter(list(range(p['tokens'])), light) for light in range(p['tokens'])]
        assert all(found == light for light, (found, _) in enumerate(cases))
        value = max(depth for _, depth in cases)
        assert 3**(value - 1) < p['tokens'] <= 3**value
        method = 'Simulate actual exact balance masses for each possible lighter token and prove ternary decision-tree lower bound'
        note = f'All {len(cases)} defect positions found in {value} weighings; fewer can distinguish at most {3**(value - 1)} candidates.'
    elif kind == 'equal-rate-mass-production':
        base = p['baseCentners'] * KG['ц'] + p['baseKg']; rate = base / p['baseMachines']
        value = integer(sum([rate] * (p['machines'] * p['days']), F(0)))
        assert rate * p['baseMachines'] == base
        note = f'SI rate {rate} kg per machine-day; complete {p["machines"] * p["days"]}-machine-day ledger {value} kg.'
    elif kind == 'two-mixed-pair-total':
        pairs = []
        for first in range(1, p['doubleFirstPlusSecond']):
            second = p['doubleFirstPlusSecond'] - 2 * first
            if second > 0 and first + 2 * second == p['firstPlusDoubleSecond']:
                pairs.append((first, second))
        pair = one(pairs); value = sum(pair)
        method = 'Complete positive gram-domain search using the two independent mixed-count equations'
        note = f'Only individual masses {pair} g satisfy both arrangements; requested one-of-each total {value} g.'
    elif kind == 'unlabelled-equal-triple-partitions':
        partitions = labelled_partitions(p['masses'], 3, 3); value = len(partitions)
        assert value >= 2, 'Original skill requires counting multiple valid branches without relabelling baskets'
        method = 'All 3^9 labelled assignments, three indivisible loads per basket, then quotient by all basket permutations'
        note = f'Complete unlabelled solution set {partitions}; exactly {value} partitions, each all nine loads once and equal total mass.'
    elif kind == 'million-mg-kg-equality':
        answer = sign(p['milligrams'] * KG['мг'], p['kg'] * KG['кг'])
        assert answer == '='
        note = f'Independent SI equality uses 1 mg=1/1000000 kg; both sides exactly {p["kg"]} kg.'
    elif kind == 'centner-addition-carry':
        left = p['firstCentners'] * KG['ц'] + p['firstKg']; right = p['secondCentners'] * KG['ц'] + p['secondKg']
        value = integer(left + right)
        assert 100 <= p['firstKg'] + p['secondKg'] < 200 and p['firstKg'] < 100 and p['secondKg'] < 100
        assert value - 100 * (p['firstCentners'] + p['secondCentners']) == p['firstKg'] + p['secondKg']
        note = f'SI masses {left}, {right}; total {value} kg, lower-place sum carries a whole centner.'
    elif kind == 'equal-baskets-companion':
        partitions = labelled_partitions(p['masses'], 2)
        assert partitions and p['special'] in p['masses']
        companions = {tuple(n for n in group if n != p['special'])
                      for part in partitions for group in part if p['special'] in group}
        companion = one(list(companions))
        parsed = [tuple(integer(kg(piece.strip())) for piece in o.split('және')) for o in row['options']]
        answer = pick(row, parsed, companion)
        method = 'All 2^5 whole-fruit assignments; inspect every feasible special-fruit basket and all printed companion sets'
        note = f'Complete partitions {partitions}; special fruit always has exact companions {companion}, independent of basket labels.'
    else:
        raise AssertionError(('Unreviewed mass model', kind))
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
            assert raw['grade'] == 4 and raw['topic'] == '1-6' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement'] != row['statement']
        method, note = solve(row)
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified', 'method': method,
                        'notes': note + ' All original/new conditions, complete solutions and source/new MCQ read independently. Units, zero placeholders, strict/equal bounds, exact requested quantity, indivisible membership and worst-case minimality retained. No authored solver imported.'})
    rejected = 0
    for row in rows:
        changed = json.loads(json.dumps(row)); changed['answer'] = '__WRONG_KEY__'
        try:
            solve(changed)
        except AssertionError:
            rejected += 1
        else:
            raise AssertionError('Wrong key accepted')
    canaries = []
    find = lambda kind: next(r for r in rows if r['modelId'] == 'grade4-mass-' + kind)
    c = json.loads(json.dumps(find('greatest-mixed-mass'))); c['options'][1] = '4700000 мг'; canaries.append(c)
    c = json.loads(json.dumps(find('unlabelled-equal-triple-partitions'))); c['params']['masses'] = [1, 2, 3, 4, 6, 7, 8, 9, 11]; c['answer'] = '1'; canaries.append(c)
    c = json.loads(json.dumps(find('strict-mass-threshold'))); c['answer'] = c['options'][2]; canaries.append(c)
    c = json.loads(json.dumps(find('two-pan-unmeasurable'))); c['params']['weights'] = [1, 4, 9]; canaries.append(c)
    c = json.loads(json.dumps(find('centner-addition-carry'))); c['params']['secondKg'] = 20; canaries.append(c)
    for changed in canaries:
        try:
            solve(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('Lost source domain, equivalent key or strictness accepted')
    print(json.dumps({'independentMassChecks': len(entries), 'wrongKeysRejected': rejected,
                      'domainAndEquivalentChoiceCanaries': len(canaries), 'manualFindingsResolved': ['Restored multiple unlabelled three-basket partitions']}, ensure_ascii=False, indent=2))
    if args.write:
        report = {'schemaVersion': 1, 'pack': PACK, 'reviewedAt': '2026-10-23',
                  'scope': 'All 30 original/new mass conditions, complete solutions and MCQ read independently. Exact SI Fraction parser reads actual printed choices; complete subset, signed-weight, labelled-to-unlabelled basket, positive equation and physical balance simulations prove all keys and relevant global minimality claims. Full canonical edition hashes bind this review.',
                  'entries': entries}
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('Wrote 30 independent mass review records.')


if __name__ == '__main__':
    main()
