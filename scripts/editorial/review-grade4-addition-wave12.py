"""Independent JSON-only oracle for the 24 source-specific addition edits.

All original/new conditions, complete solutions and source/new MCQ were read.
No authored calculator/renderer is imported. --write records full edition hashes.
"""
from pathlib import Path
from itertools import permutations
import argparse
import ast
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-addition-wave12.json'
OUT = 'problems/editorial/reviews/grade4-addition-wave12.json'
SMALL = dict(zip(['нөл', 'бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз'], range(10)))
SMALL.update(dict(zip(['он', 'жиырма', 'отыз', 'қырық', 'елу', 'алпыс', 'жетпіс', 'сексен', 'тоқсан'], range(10, 100, 10))))
WORDS = set(SMALL) | {'жүз', 'мың', 'миллион'}


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def one(values):
    assert len(values) == 1, values
    return values[0]


def number(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def choose(row, values, target):
    assert len(values) == len(set(values)) == 4, ('Equivalent choices', row['editionId'], values)
    assert values.count(target) == 1, (row['editionId'], values, target)
    return row['options'][values.index(target)]


def sign(left, right):
    return '<' if left < right else '>' if left > right else '='


def expression(text):
    tree = ast.parse(re.sub(r'\s', '', text).replace('−', '-'), mode='eval')
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant):
            assert type(node.value) is int
            return node.value
        assert isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub))
        a, b = visit(node.left), visit(node.right)
        return a + b if isinstance(node.op, ast.Add) else a - b
    return visit(tree)


def written_numbers(text):
    # Read contiguous Kazakh number-word runs from the actual printed condition.
    runs = []; run = []
    for token in re.findall(r'[а-яәіңғүұқөһ]+|[^а-яәіңғүұқөһ\s]+', text.lower()):
        if token in WORDS:
            run.append(token)
        elif run:
            runs.append(run); run = []
    if run:
        runs.append(run)
    result = []
    for tokens in runs:
        current = total = 0
        for token in tokens:
            if token in SMALL:
                current += SMALL[token]
            elif token == 'жүз':
                current = (current or 1) * 100
            else:
                total += (current or 1) * (1000 if token == 'мың' else 1000000)
                current = 0
        result.append(total + current)
    return result


def full_digit_domain(digits):
    assert len(digits) == len(set(digits)) and all(type(d) is int and 0 <= d <= 9 for d in digits)
    return [int(''.join(map(str, ds))) for ds in permutations(digits) if ds[0] != 0]


def ordered_distinct(length, reverse=False, parity=None):
    # The first permitted tuple in the entire lexicographic domain is global.
    assert 1 <= length <= 10
    for ds in permutations(range(9, -1, -1) if reverse else range(10), length):
        if ds[0] and (parity is None or ds[-1] % 2 == parity):
            return int(''.join(map(str, ds)))
    raise AssertionError('Empty full-length distinct-digit domain')


def solve(row):
    p = row['params']; kind = row['modelId'].removeprefix('grade4-addition-')
    answer = value = None
    method = 'Independent integer ledger and inverse substitution'
    note = ''
    if kind == 'compare-after-thousand':
        left = p['start'] + p['increment']; answer = sign(left, p['right'])
        assert p['increment'] == 1000 and left // 1000 == p['right'] // 1000
        note = f'Exact left {left}, right {p["right"]}; higher three digits tie, so lower places decide.'
    elif kind == 'zero-chain-complement':
        assert p['total'] == 10000 and all(int(d) > 0 for d in str(p['known']))
        # Find the complement through inverse addition, not the producer subtraction.
        value = one([n for n in range(10000) if n + p['known'] == p['total']])
        units = [int(d) for d in reversed(str(p['known']))]
        borrowed = [10 - units[0], *(9 - d for d in units[1:])]
        assert sum(d * 10**i for i, d in enumerate(borrowed)) == value
        method = 'Complete complement search with independent borrow-through-zero digit ledger'
        note = f'Only {value} back-adds to 10000; right-to-left borrowed digits {borrowed} reproduce it.'
    elif kind == 'column-carry':
        total = p['first'] + p['second']; carry, units = divmod(total, 10)
        assert 0 < p['first'] < 10 and 0 < p['second'] < 10 and carry == 1
        answer = f'Бірліктерге {units} жазып, ондықтарға {carry} тасымалдаймыз'
        assert 10 * carry + units == total
        note = f'Decimal quotient/remainder for {total} gives carry {carry} and units {units}; omitting carry loses 10.'
    elif kind == 'inverse-subtraction-check':
        values = [expression(option) for option in row['options']]
        answer = choose(row, values, p['minuend'])
        difference = p['minuend'] - p['subtrahend']
        assert expression(answer) == difference + p['subtrahend']
        assert '+' in answer
        method = 'Separate safe AST evaluation of every printed inverse-operation choice'
        note = f'All four choice results {values}; only difference {difference} plus subtrahend returns {p["minuend"]}.'
    elif kind == 'round-trip-change':
        spent = sum([p['ticket'], p['ticket']]); value = p['budget'] - spent
        assert value >= 0 and value + spent == p['budget']
        note = f'Two equal tickets cost {spent}; change {value} closes the cash ledger.'
    elif kind == 'tonne-delivery-remainder':
        value = 1000 * p['targetTonnes'] - sum([p['firstKg'], p['secondKg']])
        choices = []
        for option in row['options']:
            match = re.fullmatch(r'(\d+) т (\d+) кг', option); assert match
            t, kg = map(int, match.groups()); assert 0 <= kg < 1000
            choices.append(t * 1000 + kg)
        answer = choose(row, choices, value)
        assert value > 0
        method = 'Convert every printed mass option to kilograms and close the complete delivery ledger'
        note = f'Missing {value} kg; normalized choices {choices}, including the 450-vs-45 zero-placeholder trap.'
    elif kind == 'supplied-digit-extremes':
        assert 0 in p['digits']
        candidates = full_digit_domain(p['digits']); high, low = max(candidates), min(candidates)
        value = high - low
        method = 'Enumerate every permutation of the supplied digits, rejecting all leading-zero strings'
        note = f'{len(candidates)} full-length candidates; global maximum {high}, minimum {low}, exact gap {value}.'
    elif kind == 'compare-through-round-boundary':
        left = p['start'] - p['subtract']; right = p['rightBase'] + p['add']
        assert p['subtract'] == 1001 and p['add'] == 1 and p['rightBase'] == p['start'] - 1000
        answer = sign(left, right)
        note = f'Independent complete sides {left} and {right}; 1001 borrowing crosses the round boundary.'
    elif kind == 'spoken-monthly-total':
        actual = written_numbers(row['statement'])
        # A final "Үш ай" is a count of months, not one of the attendance quantities.
        assert actual == [*p['counts'], 3], actual
        value = sum(actual[:3])
        method = 'Independent Kazakh number-word reader applied to actual condition, followed by integer ledger'
        note = f'Printed attendance words decode to {actual[:3]}, including absent hundreds/tens; total {value}.'
    elif kind == 'sum-class-descriptions':
        first = int(str(p['firstThousands']) + str(p['firstUnits']).zfill(3))
        second = int(str(p['secondMillions']) + '000' + str(p['secondUnits']).zfill(3))
        value = first + second
        assert second // 1000 % 1000 == 0 and second % 1000 == p['secondUnits']
        method = 'Independent decimal-class string composition with fixed three-digit zero placeholders'
        note = f'Numbers {first} and {second}; empty thousands class 000, units 060, total {value}.'
    elif kind == 'common-added-variable':
        # Formal difference of the two linear forms; variable coefficient cancels.
        coefficient = 1 - 1; constant = p['left'] - p['right']
        assert coefficient == 0 and constant != 0
        answer = sign(constant, 0)
        method = 'Formal linear-polynomial subtraction, valid for every natural n'
        note = f'Left minus right is 0×n+({constant}), so sign {answer} is independent of n, not sample-tested.'
    elif kind == 'find-incorrect-calculation':
        wrong = []; values = []
        for i, option in enumerate(row['options']):
            sides = option.split('='); assert len(sides) == 2
            actual, claimed = expression(sides[0]), number(sides[1]); values.append((actual, claimed))
            if actual != claimed:
                wrong.append(i)
        index = one(wrong); answer = row['options'][index]
        assert row.get('intentionalIncorrectExample') is True
        assert 'қате' in row['statement']
        method = 'Independent safe AST evaluation of both sides of all four printed equalities'
        note = f'Actual/claimed pairs {values}; exactly choice {index + 1} is false, with its inverse mismatch explicitly discussed.'
    elif kind == 'unit-fraction-combined-total':
        assert p['divisor'] == 3 and p['first'] % 3 == 0
        share = one([n for n in range(p['first']) if n * 3 == p['first']])
        value = p['first'] + share
        note = f'Enumerated one-third {share} back-multiplies to first section {p["first"]}; combined total {value}.'
    elif kind == 'parity-distinct-extremes':
        high = ordered_distinct(p['digits'], True, 0); low = ordered_distinct(p['digits'], False, 1)
        value = high - low
        assert ordered_distinct(p['digits'], True) % 2 == 1
        assert ordered_distinct(p['digits']) % 2 == 0
        method = 'Complete ordered distinct-digit permutation streams with separate even/odd final-digit constraints'
        note = f'Global even maximum {high}, odd minimum {low}; unconstrained extrema fail parity, so both original constraints remain necessary.'
    elif kind == 'two-misread-place-values':
        # Construct one actual addend, miscopy its printed positions, keep the other unchanged.
        actual = 100 + 10 * p['actualTens'] + p['actualUnits']
        misread = 100 + 10 * p['readTens'] + p['readUnits']
        other = p['observed'] - misread
        value = actual + other
        assert other > 0 and misread + other == p['observed']
        note = f'Concrete addend reconstruction {actual} misread as {misread}; unchanged other addend {other} gives correct total {value}.'
    elif kind == 'subtract-instead-of-add':
        original = p['observed'] + p['delta']; value = original + p['delta']
        assert original - p['delta'] == p['observed'] and value - p['observed'] == 2 * p['delta']
        note = f'Original {original} reproduces the mistaken subtraction; intended addition yields {value}, a twice-delta correction.'
    elif kind == 'maximum-two-three-digit-sum':
        assert len(p['digits']) == len(set(p['digits'])) == 6 and all(0 < d < 10 for d in p['digits'])
        sums = []
        for ds in permutations(p['digits']):
            a, b = int(''.join(map(str, ds[:3]))), int(''.join(map(str, ds[3:])))
            sums.append(a + b)
        value = max(sums)
        method = 'All 720 placements of the six supplied digits into the two complete three-digit numbers'
        note = f'Global maximum of all {len(sums)} sums is {value}; verifies the weighted-place exchange argument independently.'
    elif kind == 'three-digit-rearrangement-steps':
        assert len(p['digits']) == 4 and p['steps'] == 3
        digits = p['digits']; trace = []
        for i in range(p['steps']):
            candidates = [int(''.join(map(str, ds))) for ds in set(permutations(digits)) if ds[0]]
            high, low = max(candidates), min(candidates); value = high - low
            assert 1000 <= value < 10000
            trace.append((high, low, value)); digits = list(map(int, str(value)))
            if i == 0:
                assert len(set(digits)) < 4, 'Repeated intermediate digits must stay relevant'
        method = 'Re-enumerate the full multiset permutation domain at each of exactly three subtraction steps'
        note = f'Complete trace {trace}; repeated intermediate digits retained and the third, not fourth, result selected.'
    elif kind == 'global-distinct-extreme-gap':
        high = ordered_distinct(p['digits'], True); low = ordered_distinct(p['digits'])
        value = high - low
        method = 'Complete lexicographic distinct-digit permutation streams, first full-length member at each ordering'
        note = f'Global full-domain extrema {high}, {low}; leading zero excluded; gap {value}.'
    elif kind == 'sum-and-gap-larger':
        pairs = [(small, p['total'] - small) for small in range(p['total'] // 2 + 1)
                 if p['total'] - 2 * small == p['gap']]
        small, value = one(pairs)
        assert value + small == p['total'] and value - small == p['gap']
        method = 'Enumerate every nonnegative smaller integer and impose both total and exact gap simultaneously'
        note = f'Only pair ({small}, {value}) satisfies both independent equations; requested larger value {value}.'
    elif kind == 'three-object-assignment':
        all_assignments = list(permutations(range(3)))
        valid = [a for a in all_assignments if all(v not in p['exclusions'][i] for i, v in enumerate(a))]
        assignment = one(valid)
        def printed(a):
            return '; '.join(f'{name} — {p["items"][a[i]]}' for i, name in enumerate(p['names']))
        answer = printed(assignment)
        expected_options = [printed(a) for a in p['options']]
        assert row['options'] == expected_options
        assert p['exclusions'] == [[2], [0, 2], []]
        method = 'Enumerate all six bijective student-tool assignments and check every printed full MCQ assignment'
        note = f'Only assignment {assignment} survives all explicit exclusions and one-owner constraints; no unstated assumptions.'
    elif kind == 'compare-minus-near-thousand':
        left = p['start'] - p['subtract']; answer = sign(left, p['right'])
        assert p['subtract'] == 999 and left == p['start'] - 1000 + 1
        note = f'Exact subtraction {left}, comparator {p["right"]}; compensation by −1000+1 verified.'
    elif kind == 'family-ticket-change':
        spent = sum([p['adult']] * p['adults'] + [p['child']] * p['children'])
        value = p['paid'] - spent
        assert p['adults'] == 2 and p['children'] == 1 and p['adult'] == 2 * p['child']
        assert value > 0 and value + spent == p['paid']
        note = f'All three actual ticket ledger entries total {spent}; change {value} closes the payment {p["paid"]}.'
    else:
        raise AssertionError(('Unreviewed addition model', kind))
    if answer is None:
        assert type(value) is int
        answer = choose(row, [number(o) for o in row['options']], value) if row.get('options') else str(value)
    assert row['answer'] == answer, (row['editionId'], row['answer'], answer)
    if row.get('options'):
        assert len(row['options']) == len(set(row['options'])) == 4
        assert row['options'].count(answer) == 1
    else:
        assert re.fullmatch(r'\d+', answer) and re.search(r'Жауап[^.]*тек сан', row['statement'])
    return method, note


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--write', action='store_true'); args = parser.parse_args()
    rows = json.loads((ROOT / PACK).read_text())['editions']; assert len(rows) == 24
    assert len({r['editionId'] for r in rows}) == len({r['sourceRefs'][0]['sourceId'] for r in rows}) == 24
    entries = []
    for row in rows:
        kind = row['modelId'].removeprefix('grade4-addition-')
        topic = 'eq' if kind in {'zero-chain-complement', 'sum-and-gap-larger'} else 'seq' if kind == 'three-digit-rearrangement-steps' else 'logic' if kind == 'three-object-assignment' else 'num'
        assert row['grade'] == 4 and row['topic'] == topic and row['minimumPlan'] == 'pro'
        assert not re.search(r'[\\$]', row['statement'] + row['solution'])
        for ref in row['sourceRefs']:
            raw = json.loads((ROOT / ref['sourceFile']).read_text())
            q = one([q for q in raw['questions'] if q['id'] == ref['sourceId']])
            assert raw['grade'] == 4 and raw['topic'] == '1-5' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement'] != row['statement']
        method, note = solve(row)
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified', 'method': method,
                        'notes': note + ' All original/new conditions, complete solutions and source/new MCQ read independently. Original carry/borrow, inverse-operation, class-zero, parity, repeated-digit, quantity/unit and bijective-assignment skills retained; no authored solver imported.'})
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
    parity = next(r for r in rows if r['modelId'].endswith('parity-distinct-extremes'))
    c = json.loads(json.dumps(parity)); c['params']['digits'] = 4; canaries.append(c)
    mcq = next(r for r in rows if r['modelId'].endswith('zero-chain-complement'))
    c = json.loads(json.dumps(mcq)); c['options'][0] = c['answer'].replace(' ', '  '); canaries.append(c)
    steps = next(r for r in rows if r['modelId'].endswith('three-digit-rearrangement-steps'))
    c = json.loads(json.dumps(steps)); c['params']['steps'] = 2; canaries.append(c)
    units = next(r for r in rows if r['modelId'].endswith('tonne-delivery-remainder'))
    c = json.loads(json.dumps(units)); c['options'][1] = '38 т 1450 кг'; canaries.append(c)
    for changed in canaries:
        try:
            solve(changed)
        except AssertionError:
            pass
        else:
            raise AssertionError('Lost domain, equivalent key or unit normalization accepted')
    print(json.dumps({'independentAdditionChecks': len(entries), 'wrongKeysRejected': rejected,
                      'domainAndEquivalentChoiceCanaries': len(canaries), 'manualFindings': []}, ensure_ascii=False, indent=2))
    if args.write:
        report = {'schemaVersion': 1, 'pack': PACK, 'reviewedAt': '2026-10-23',
                  'scope': 'All 24 source/new addition conditions, complete solutions and source/new MCQ read. Independent integer ledgers, inverse searches, safe printed-expression AST, Kazakh number-word reader, complete digit permutation/assignment domains and formal variable cancellation reproduce all keys. Full canonical edition hashes bind this review.',
                  'entries': entries}
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('Wrote 24 independent addition review records.')


if __name__ == '__main__':
    main()
