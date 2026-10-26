"""Independent review of grade6 division editions using JSON and Fraction only.

No authored JS calculator/renderer is imported. --write is a reviewer operation:
all current conditions, solutions, source conditions and options must first be read.
"""
from pathlib import Path
from fractions import Fraction as F
from math import gcd, lcm
import argparse
import ast
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade6-division.json'
OUT = 'problems/editorial/reviews/grade6-division.json'


def digest(row):
    canonical = json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()


def integer(value):
    value = F(value)
    assert value.denominator == 1, value
    return str(value.numerator)


def decimal(value):
    value = F(value)
    scale = 1
    while scale <= 10**6:
        shifted = value * scale
        if shifted.denominator == 1:
            if scale == 1:
                return str(shifted.numerator)
            places = len(str(scale)) - 1
            digits = str(shifted.numerator).zfill(places + 1)
            return (digits[:-places] + ',' + digits[-places:]).rstrip('0').rstrip(',')
        scale *= 10
    raise AssertionError(('Non-terminating decimal', value))


def fraction(value):
    value = F(value)
    return integer(value) if value.denominator == 1 else f'{value.numerator}/{value.denominator}'


def ratio(value):
    value = F(value)
    return f'{value.numerator} : {value.denominator}'


def tuple_text(values):
    return '(' + '; '.join(fraction(value) for value in values) + ')'


def parse_tuple(text):
    assert text.startswith('(') and text.endswith(')'), text
    return tuple(F(part.strip().replace(',', '.')) for part in text[1:-1].split(';'))


def expression_value(text):
    """Read only elementary arithmetic nodes; never evaluate source code."""
    tree = ast.parse(text.replace(':', '/').replace('·', '*').replace('−', '-'), mode='eval')

    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant) and type(node.value) is int:
            return F(node.value)
        if isinstance(node, ast.BinOp):
            left, right = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Add):
                return left + right
            if isinstance(node.op, ast.Sub):
                return left - right
            if isinstance(node.op, ast.Mult):
                return left * right
            if isinstance(node.op, ast.Div):
                return left / right
        raise AssertionError(('Unsupported arithmetic syntax', text))

    return visit(tree)


def share(total, weights):
    weights = [F(weight) for weight in weights]
    assert total > 0 and all(weight > 0 for weight in weights)
    parts = tuple(F(total) * weight / sum(weights) for weight in weights)
    assert sum(parts) == total
    assert len({part / weight for part, weight in zip(parts, weights)}) == 1
    return parts


def solve(row):
    p = row['params']
    kind = row['modelId'].removeprefix('grade6-division-')
    semantic = None
    semantic_kind = None
    method = 'Exact Fraction calculation and inverse substitution'

    if kind in ('total-share', 'segment-share', 'total-tuple', 'total-gap', 'fractional-share'):
        parts = share(p['total'], p['weights'])
        if kind == 'total-tuple':
            answer = tuple_text(parts)
            semantic, semantic_kind = parts, 'tuple'
        elif kind == 'total-gap':
            answer = integer(max(parts) - min(parts))
        elif kind == 'fractional-share':
            semantic, semantic_kind = parts[p['target']], 'fraction'
            answer = fraction(semantic)
        else:
            answer = integer(parts[p['target']])
            if p.get('context') == 'cord':
                assert parts[p['target']] == min(parts)
            if p.get('context') in ('larger', 'prize'):
                assert parts[p['target']] == max(parts)
        note = f'Ordered parts {parts}; their sum is {p["total"]}, all quotients by the weights agree.'
    elif kind == 'straight-share':
        parts = share(180, p['weights'])
        assert all(0 < angle < 180 for angle in parts)
        answer = integer(parts[p['target']])
        note = f'Angles {parts} sum to 180 degrees; target member index {p["target"]} is explicit.'
    elif kind in ('litre-share', 'kilogram-share'):
        total = p['litresTenths'] * 100 if kind == 'litre-share' else p['kilograms'] * 1000
        parts = share(total, p['weights'])
        answer = integer(parts[p['target']])
        note = f'Convert to {total} millilitres/grams before sharing: {parts}; target {answer}.'
    elif kind == 'known-part-total':
        unit = F(p['known'], p['weights'][p['knownIndex']])
        parts = tuple(unit * weight for weight in p['weights'])
        assert parts[p['knownIndex']] == p['known']
        answer = integer(sum(parts))
        note = f'Known member index {p["knownIndex"]} is {p["known"]}, not the whole; full parts {parts}.'
    elif kind == 'unit-operation':
        semantic = F(p['total'], sum(p['weights']))
        semantic_kind = 'expression'
        answer = f'{p["total"]} : (' + ' + '.join(map(str, p['weights'])) + ')'
        assert expression_value(answer) == semantic
        note = f'One unit {semantic} multiplied by weight sum {sum(p["weights"])} recovers {p["total"]}.'
    elif kind == 'difference-larger':
        unit = F(p['gap'], max(p['weights']) - min(p['weights']))
        parts = tuple(unit * weight for weight in p['weights'])
        assert max(parts) - min(parts) == p['gap']
        answer = integer(max(parts))
        note = f'Numbers {parts} have directed gap {p["gap"]} and the required ratio.'
    elif kind == 'rectangle-perimeter-area':
        half = F(p['perimeter'], 2)
        length, width = share(half, p['weights'])
        assert 2 * (length + width) == p['perimeter']
        candidates = [(a, b) for a in range(1, p['perimeter']) for b in range(1, p['perimeter'])
                      if 2 * (a + b) == p['perimeter'] and F(a, b) == F(*p['weights'])]
        assert candidates == [(length, width)]
        answer = integer(length * width)
        method = 'Enumerate perimeter-constrained side pairs, then independently multiply the sides'
        note = f'Unique positive integer side pair {candidates[0]}; area {answer} square centimetres.'
    elif kind == 'age-sum-future':
        ages = share(p['total'], p['weights'])
        answer = integer(ages[0] + p['years'])
        assert ages[0] > ages[1] > 0
        note = f'Current ages {ages}; add {p["years"]} only after solving the current total/ratio.'
    elif kind == 'fraction-ratio-tuple':
        weights = [F(*weight) for weight in p['weights']]
        parts = share(p['total'], weights)
        semantic, semantic_kind = parts, 'tuple'
        answer = tuple_text(parts)
        note = f'Use the actual fractional weights {weights}, not their denominators; ordered lengths/counts {parts}.'
    elif kind in ('chain-matched-tuple', 'chain-unmatched-share'):
        # Normalize the middle amount to one, rather than using the authored LCM calculator.
        weights = [F(*p['first']), F(1), F(p['second'][1], p['second'][0])]
        parts = share(p['total'], weights)
        assert parts[0] / parts[1] == F(*p['first'])
        assert parts[1] / parts[2] == F(*p['second'])
        if kind == 'chain-matched-tuple':
            semantic, semantic_kind = parts, 'tuple'
            answer = tuple_text(parts)
        else:
            common = lcm(p['first'][1], p['second'][0])
            assert common > max(p['first'][1], p['second'][0]), 'Both original ratios must need scaling'
            answer = integer(parts[p['target']])
        note = f'Set middle weight to 1: weights {weights} give amounts {parts}; both adjacent ratios checked separately.'
    elif kind == 'decimal-ratio-smaller':
        parts = share(p['total'], [F(value, 10) for value in p['tenths']])
        answer = integer(min(parts))
        note = f'Exact tenth ratios produce {parts}; no rounded intermediate one-unit amount is used.'
    elif kind == 'investment-share':
        parts = share(p['profit'], p['investments'])
        answer = integer(parts[p['target']])
        note = f'Distribute only the profit {p["profit"]}: {parts}; profit/investment rate is identical for both.'
    elif kind == 'triangle-tuple':
        parts = share(p['perimeter'], p['weights'])
        assert sum(parts) - max(parts) > max(parts)
        semantic, semantic_kind = parts, 'tuple'
        answer = tuple_text(parts)
        note = f'Ordered sides {parts} satisfy both perimeter and strict triangle inequality.'
    elif kind == 'remaining-percent-share':
        assert 0 < p['removedPercent'] < 100
        remaining = F(p['total'] * (100 - p['removedPercent']), 100)
        parts = share(remaining, p['weights'])
        answer = decimal(parts[p['target']])
        note = f'Unallocated area after initial percentage {remaining}; remaining parts {parts}, not shares of the original whole.'
    elif kind == 'three-difference-total':
        unit = F(p['gap'], p['weights'][p['lastIndex']] - p['weights'][p['firstIndex']])
        parts = tuple(weight * unit for weight in p['weights'])
        assert parts[p['lastIndex']] - parts[p['firstIndex']] == p['gap']
        answer = integer(sum(parts))
        note = f'All three amounts {parts}; selected directed difference {p["gap"]}, sum {answer}.'
    elif kind == 'percent-difference-total':
        percent = F(p['percent'], 100)
        unit = F(p['gap']) / (p['weights'][1] - percent * p['weights'][0])
        first, second = [weight * unit for weight in p['weights']]
        assert second - percent * first == p['gap'] and first > 0
        answer = integer(first + second)
        note = f'Numbers {first}, {second}; subtract the stated percentage of the first, not a percentage of the difference.'
    elif kind == 'rectangle-area-perimeter':
        candidates = [(a, b) for a in range(1, p['area'] + 1) for b in range(1, p['area'] + 1)
                      if a * b == p['area'] and F(a, b) == F(*p['weights'])]
        assert len(candidates) == 1
        length, width = candidates[0]
        answer = str(2 * (length + width))
        method = 'Enumerate factor pairs of the area, retain the one with the required ordered side ratio'
        note = f'Unique factor pair {length}, {width}; area and side ratio both checked, perimeter {answer}.'
    elif kind == 'worker-days-payment':
        work = [workers * days for workers, days in zip(p['workers'], p['days'])]
        payments = share(p['payment'], work)
        answer = integer(payments[p['target']])
        assert len({payment / days for payment, days in zip(payments, work)}) == 1
        note = f'Person-days {work}, payments {payments}; one equal person-day rate and the total payment verified.'
    elif kind == 'combined-mixtures':
        first = share(p['firstGrams'], p['first'])
        second = share(p['secondKilograms'] * 1000, p['second'])
        combined = tuple(a + b for a, b in zip(first, second))
        assert sum(combined) == p['firstGrams'] + p['secondKilograms'] * 1000
        semantic, semantic_kind = combined[0] / combined[1], 'ratio'
        answer = ratio(semantic)
        note = f'Component ledgers {first} and {second}; combined salt/water {combined}, not salt/total.'
    elif kind == 'remaining-difference-total':
        unit = F(p['gap'], p['weights'][0] - p['weights'][1])
        parts = tuple(unit * weight for weight in p['weights'])
        original = sum(parts) / F(100 - p['removedPercent'], 100)
        assert parts[0] - parts[1] == p['gap']
        assert original - original * F(p['removedPercent'], 100) == sum(parts)
        answer = integer(original)
        note = f'Remaining journey parts {parts}; their difference and inverse percentage recover original {answer}.'
    elif kind == 'transfer-equal-total':
        unit = F(2 * p['moved'], p['weights'][0] - p['weights'][1])
        first, second = [unit * weight for weight in p['weights']]
        assert first - p['moved'] == second + p['moved'] > 0
        answer = integer(first + second)
        note = f'Before transfer {first}, {second}; after transfer both {first-p["moved"]}. Total conserved.'
    elif kind == 'meeting-distance':
        parts = share(p['distance'], p['weights'])
        velocities = tuple(part / p['hours'] for part in parts)
        assert sum(velocities) * p['hours'] == p['distance']
        assert velocities[0] / velocities[1] == F(*p['weights'])
        answer = integer(parts[p['target']])
        note = f'Speeds {velocities} for equal time {p["hours"]}; distances {parts}, target distance rather than speed.'
    elif kind == 'partial-sum-total':
        unit = F(p['known'], sum(p['weights'][index] for index in p['selected']))
        parts = tuple(weight * unit for weight in p['weights'])
        assert sum(parts[index] for index in p['selected']) == p['known']
        answer = integer(sum(parts))
        note = f'Four amounts {parts}; selected indices {p["selected"]} sum to {p["known"]}; all four sum to {answer}.'
    elif kind == 'add-second-component':
        first, second = share(p['total'], p['before'])
        added = first * F(p['after'][1], p['after'][0]) - second
        assert added > 0 and first / (second + added) == F(*p['after'])
        answer = integer(added)
        note = f'Initial masses {first}, {second}; keep first mass fixed and add {added} only to the second.'
    elif kind == 'equal-bundles-tuple':
        bundle_count = F(p['total'], sum(p['bundleSizes']))
        assert bundle_count.denominator == 1
        parts = tuple(size * bundle_count for size in p['bundleSizes'])
        assert sum(parts) == p['total']
        assert len({part / size for part, size in zip(parts, p['bundleSizes'])}) == 1
        semantic, semantic_kind = parts, 'tuple'
        answer = tuple_text(parts)
        note = f'Equal complete bundle count {bundle_count}; ordered individual item totals {parts}.'
    elif kind == 'ages-changing-ratio':
        pairs = [(older, younger) for older in range(1, 121) for younger in range(1, older)
                 if F(older, younger) == F(*p['before']) and
                 F(older + p['years'], younger + p['years']) == F(*p['after'])]
        assert len(pairs) == 1
        semantic, semantic_kind = tuple(map(F, pairs[0])), 'tuple'
        answer = tuple_text(semantic)
        method = 'Enumerate integer ages, then substitute both the current and future ratios'
        note = f'Unique plausible current age pair {pairs[0]}, future pair {tuple(age+p["years"] for age in pairs[0])}; age gap invariant.'
    elif kind == 'larger-whole-fraction':
        semantic, semantic_kind = F(max(p['weights']), sum(p['weights'])), 'fraction'
        assert 0 < semantic < 1
        answer = fraction(semantic)
        note = f'Longer-part weight divided by total weight gives {semantic}; complement completes one whole.'
    elif kind == 'bounded-class-size':
        assert gcd(*p['weights']) == 1
        counts = [n for n in range(p['lowerExclusive'] + 1, p['upperExclusive'])
                  if all(F(n * weight, sum(p['weights'])).denominator == 1 for weight in p['weights'])]
        assert len(counts) == 1
        answer = str(counts[0])
        method = 'Exhaustive integer count check inside both strict bounds'
        note = f'Only total {answer} gives whole-student subgroups and stays strictly within the interval.'
    elif kind == 'recover-ratio':
        last = p['total'] - p['first']
        assert last > 0
        semantic, semantic_kind = F(p['first'], last), 'ratio'
        answer = ratio(semantic)
        note = f'Other addend {last}; first/other is {semantic}, not first/total.'
    elif kind == 'limiting-mixture':
        available = [F(amount, 10) for amount in p['availableTenths']]
        limits = [amount / weight for amount, weight in zip(available, p['weights'])]
        unit = min(limits)
        used = [unit * weight for weight in p['weights']]
        assert all(amount <= stock for amount, stock in zip(used, available))
        assert any(amount == stock for amount, stock in zip(used, available))
        assert used[0] / used[1] == F(*p['weights'])
        answer = decimal(sum(used))
        method = 'Independent limiting-resource inequalities with exact tenths'
        note = f'Available {available}, used {used}; one stock exhausted and neither exceeded, so total {answer} is maximal.'
    elif kind == 'sector-proportion':
        last_angle = 360 - p['firstAngle'] - p['secondAngle']
        assert last_angle > 0
        rate = F(p['lastCount'], last_angle)
        counts = [rate * angle for angle in (p['firstAngle'], p['secondAngle'], last_angle)]
        assert all(count.denominator == 1 for count in counts)
        assert F(p['firstAngle'], 360) == counts[0] / sum(counts)
        answer = integer(counts[0])
        note = f'Remaining angle {last_angle}; exact category counts {counts} preserve the same full-circle shares.'
    elif kind == 'weighted-coins':
        candidates = [(first, last) for first in range(p['money'] // p['denominations'][0] + 1)
                      for last in range(p['money'] // p['denominations'][1] + 1)
                      if first * p['denominations'][0] + last * p['denominations'][1] == p['money']
                      and first * p['weights'][1] == last * p['weights'][0]]
        assert len(candidates) == 1
        answer = str(sum(candidates[0]))
        method = 'Enumerate denomination counts subject to both money conservation and the count ratio'
        note = f'Unique coin counts {candidates[0]}, total {answer}; the ratio concerns counts rather than monetary amounts.'
    elif kind == 'sum-difference-ratio':
        first = F(p['sumParts'] + p['differenceParts'], 2)
        last = F(p['sumParts'] - p['differenceParts'], 2)
        assert first > last > 0
        assert (first + last) / (first - last) == F(p['sumParts'], p['differenceParts'])
        semantic, semantic_kind = first / last, 'ratio'
        answer = ratio(semantic)
        note = f'Trial numbers {first}, {last}; their sum/difference ratio back-substitutes, number ratio {semantic}.'
    elif kind == 'participating-fractions':
        fractions = [F(*value) for value in p['fractions']]
        participant_units = sum(weight * part for weight, part in zip(p['weights'], fractions))
        unit = F(p['participants']) / participant_units
        groups = [weight * unit for weight in p['weights']]
        participants = [group * part for group, part in zip(groups, fractions)]
        assert sum(participants) == p['participants']
        assert all(value.denominator == 1 for value in groups + participants)
        answer = integer(sum(groups))
        note = f'Class subgroups {groups}, participating subgroups {participants}; all indivisible counts and total participants checked.'
    elif kind == 'two-division-points':
        first_position = F(p['first'][0], sum(p['first']))
        second_position = F(p['second'][0], sum(p['second']))
        length = F(p['gap']) / abs(second_position - first_position)
        first = first_position * length
        second = second_position * length
        assert 0 < first < length and 0 < second < length and abs(first - second) == p['gap']
        assert first / (length - first) == F(*p['first'])
        assert second / (length - second) == F(*p['second'])
        answer = integer(length)
        note = f'Positions {first}, {second} inside length {length}; both division ratios and the actual point gap checked.'
    elif kind == 'successive-cuts':
        first_cut = share(p['total'], p['first'])
        second_cut = share(max(first_cut), p['second'])
        lengths = (min(first_cut), *second_cut)
        assert sum(lengths) == p['total']
        answer = integer(min(lengths))
        note = f'Final three pieces {lengths}; sum conserved, minimum selected among all three after cutting only the longer original part.'
    else:
        raise AssertionError(('Unreviewed model', kind))

    assert row['answer'] == answer, (row['editionId'], row['answer'], answer)
    options = row.get('options', [])
    if options:
        assert len(options) == len(set(options)) == 4
        assert options.count(answer) == 1
        if semantic_kind == 'tuple':
            values = [parse_tuple(option) for option in options]
        elif semantic_kind == 'ratio':
            values = [F(*(int(term.strip()) for term in option.split(':'))) for option in options]
        elif semantic_kind == 'fraction':
            values = [F(option.replace(',', '.')) for option in options]
        elif semantic_kind == 'expression':
            values = [expression_value(option) for option in options]
        else:
            raise AssertionError(('Missing semantic choice proof', row['editionId']))
        assert values.count(semantic) == 1 and len(set(values)) == 4, ('Equivalent options', row['editionId'])
    else:
        assert re.fullmatch(r'\d+(?:,\d+)?', answer), ('Open non-scalar answer', row['editionId'])
    return method, note


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    rows = json.loads((ROOT / PACK).read_text())['editions']
    assert len(rows) == 54
    assert len({row['sourceRefs'][0]['sourceId'] for row in rows}) == 54
    entries = []
    for row in rows:
        assert row['grade'] == 6 and row['topic'] == 'ratio'
        assert not re.search(r'[\\$]', row['statement'] + row['solution'])
        for ref in row['sourceRefs']:
            capture = json.loads((ROOT / ref['sourceFile']).read_text())
            source = next(question for question in capture['questions'] if question['id'] == ref['sourceId'])
            assert capture['grade'] == 6 and capture['topic'] == '1-2' and source['checked']
            assert source['statement'] != row['statement']
        method, note = solve(row)
        entries.append({'editionId': row['editionId'], 'sha256': digest(row), 'verdict': 'verified',
                        'method': method, 'notes': note + ' Full new/source conditions, complete solutions, ordered quantities, units and all MCQ choices independently read. No authored calculator imported.'})
    print(json.dumps({'numericAndOptionChecks': len(entries), 'manualFindings': []}, ensure_ascii=False, indent=2))
    if args.write:
        report = {'schemaVersion': 1, 'pack': PACK, 'reviewedAt': '2026-10-23',
                  'scope': 'All 54 new/source conditions and complete solutions read. Independent Fraction ledgers, inverse substitution, constrained enumeration, dimensional checks and semantic MCQ uniqueness; complete canonical row hashes pin the review. The unmatched chain now genuinely scales both adjacent pairs through LCM.',
                  'entries': entries}
        (ROOT / OUT).parent.mkdir(parents=True, exist_ok=True)
        (ROOT / OUT).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print('Wrote 54 independent review records.')


if __name__ == '__main__':
    main()
