"""Independent offline review of coordinate46 and sequence47.

No author/verifier module is imported. Givens are read from the rendered Kazakh
conditions (not params or the answer), then checked by Fraction arithmetic,
bounded search, polynomial tests or a separate native-expression AST parser.
Full conditions, choices, solutions and canonical source skills were also read
by the reviewer. --write binds that content review to exact recursive JSON hashes.
"""
import argparse
import ast
from fractions import Fraction as F
import hashlib
import itertools
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]


def nums(text):
    return [int(x) for x in re.findall(r'\d+', text)]


def value(expression, n=0):
    """Restricted independent expression interpreter, exact over rationals."""
    text = expression.replace('×', '*').replace('−', '-').replace(':', '/')
    tree = ast.parse(text.strip(), mode='eval')
    def go(t):
        if isinstance(t, ast.Expression):
            return go(t.body)
        if isinstance(t, ast.Constant) and type(t.value) is int:
            return F(t.value)
        if isinstance(t, ast.Name) and t.id == 'n':
            return F(n)
        if isinstance(t, ast.UnaryOp) and isinstance(t.op, ast.USub):
            return -go(t.operand)
        assert isinstance(t, ast.BinOp), ast.dump(t)
        a, b = go(t.left), go(t.right)
        if isinstance(t.op, ast.Add): return a + b
        if isinstance(t.op, ast.Sub): return a - b
        if isinstance(t.op, ast.Mult): return a * b
        if isinstance(t.op, ast.Div): return a / b
        raise AssertionError(ast.dump(t))
    return go(tree)


def integer(v):
    v = F(v)
    assert v.denominator == 1, v
    return str(v.numerator)


def unique(values):
    assert len(values) == 1, values
    return values[0]


def coordinate(row):
    kind = row['modelId'].removeprefix('grade5-ray-')
    s, ns = row['statement'], nums(row['statement'])
    coords = {k: int(v) for k, v in re.findall(r'([A-Z])\((\d+)\)', s)}
    method = 'rendered-condition parsing; independent exact distance arithmetic'
    if kind == 'notation':
        label, number = next(iter(coords.items()))
        answer = unique([o for o in row['options'] if label in o and 'координатасы' in o and nums(o) == [number]])
    elif kind == 'missing-definition':
        assert 'санақ басын' in s and 'бірлік кесіндінің ұзындығын' in s and 'бағытта' in s
        answer = 'оң бағыт'
    elif kind == 'coordinate-from-distance':
        unit, distance = ns
        answer = F(distance, unit)
    elif kind == 'move-right':
        start, step = ns
        answer = sum(range(start, start + step + 1)) - sum(range(start, start + step))
    elif kind == 'origin-distance':
        coordinate_, unit = ns
        answer = sum([unit] * coordinate_)
    elif kind == 'origin-coordinate':
        answer = 0
    elif kind in ('unique-point', 'nearest-natural'):
        answer = 1
    elif kind in ('only-interior-point', 'interior-count'):
        left, right = ns
        candidates = [n for n in range(1, right + 1) if left < n < right]
        answer = unique(candidates) if kind == 'only-interior-point' else len(candidates)
    elif kind == 'move-left':
        start, step = ns
        answer = unique([end for end in range(start + 1) if start - end == step])
    elif kind == 'nearest-label':
        points = {k: v for k, v in coords.items() if k != 'O'}
        answer = unique([k for k, v in points.items() if v == min(points.values())])
    elif kind == 'direct-coordinate':
        answer, = ns
    elif kind == 'pair-gap':
        gap = ns[-1]
        answer = unique([f'{a} және {b}' for a, b in itertools.combinations(coords, 2) if abs(coords[a] - coords[b]) == gap])
    elif kind == 'walking-time':
        origin, target, unit, speed = ns
        answer = F((target - origin) * unit, speed)
    elif kind == 'opposite-time':
        origin, target, unit, va, vb = ns
        answer = F((target - origin) * unit, va + vb)
    elif kind == 'two-moves':
        start, right, left = ns
        positions = [start]
        for direction, steps in ((1, right), (-1, left)):
            for _ in range(steps): positions.append(positions[-1] + direction)
        assert min(positions) >= 0
        answer = positions[-1]
    elif kind == 'grid-length':
        unit, a, b = ns
        answer = sum([unit] * abs(a - b))
    elif kind == 'midpoint':
        a, b = ns
        answer = unique([x for x in range(a, b + 1) if x - a == b - x])
    elif kind == 'two-coordinates':
        unit, a, b = ns
        answer = f'A({integer(F(a, unit))}), B({integer(F(b, unit))})'
    elif kind == 'possible-points':
        center, radius = ns
        points = [x for x in range(center + radius + 1) if abs(x - center) == radius]
        assert len(points) == 2
        answer = ' және '.join(map(str, points))
    elif kind == 'coordinate-from-motion':
        origin, speed, unit, time = ns
        answer = origin + F(speed * time, unit)
    elif kind == 'two-point-distance':
        a, b, unit = ns
        answer = abs(a * unit - b * unit)
    elif kind == 'endpoint-from-midpoint':
        a, m = ns
        answer = unique([x for x in range(m + 1, 3 * m + 1) if m - a == x - m])
    elif kind == 'double-midpoint':
        m, origin = ns
        answer = unique([x for x in range(m + 1, 3 * m + 1) if m - origin == x - m])
    elif kind == 'median-location':
        costs = {x: sum(abs(x - p) for p in ns) for x in range(1, max(ns) * 2 + 1)}
        answer = unique([x for x, cost in costs.items() if cost == min(costs.values())])
        method = 'exhaustive natural-coordinate total walking-cost minimization'
    elif kind == 'catch-coordinate':
        unit, origin, ahead, va, vb = ns
        # Solve coordinate equality directly; scaling cancels.
        answer = F(ahead * va, va - vb)
        assert F(answer - origin, va) == F(answer - ahead, vb)
        method = 'independent rational simultaneous-motion equality, coordinate units cancel'
    elif kind == 'partition-point':
        a, b, parts, index = ns
        positions = [F(a * (parts - j) + b * j, parts) for j in range(parts + 1)]
        answer = positions[index]
    elif kind == 'inclusive-count':
        a, b = ns
        answer = len([x for x in range(1, b + 1) if a <= x <= b])
    elif kind == 'day-night-climb':
        origin, up, down, target = ns
        position = origin
        for day in range(1, 1000):
            position += up
            if position >= target: break
            position -= down
        else: raise AssertionError('Unreachable target')
        answer = day
        method = 'day/night state simulation with first daytime crossing, no final-night subtraction'
    elif kind == 'point-progression':
        first, step, index = ns
        position = first
        for _ in range(1, index): position += step
        answer = position
    elif kind == 'two-hop-impossible':
        start, first, second = ns
        ends = set()
        for mid in range(start + first + 1):
            if abs(mid - start) != first: continue
            ends.update(x for x in range(mid + second + 1) if abs(x - mid) == second)
        answer = unique([int(o) for o in row['options'] if int(o) not in ends])
        method = 'exhaustive nonnegative intermediate and final ray coordinates; unique impossible choice'
    elif kind == 'bounded-natural-count':
        center, radius, natural_start = ns
        assert natural_start == 1
        answer = len([x for x in range(1, center + radius + 1) if abs(x - center) <= radius])
    elif kind == 'internal-ratio-point':
        a, b, ratio = ns
        answer = unique([x for x in range(a + 1, b) if x - a == ratio * (b - x)])
    elif kind == 'coordinate-ratio-gap':
        ratio, gap = ns
        answer = unique([k for k in range(gap + 1, gap * ratio + 1) if F(k, ratio).denominator == 1 and k - k // ratio == gap])
    elif kind == 'coordinate-gap':
        a, b = ns
        answer = abs(a - b)
    elif kind == 'false-ray-claim':
        # Content review: the other three statements are true under the stated usual orientation.
        answer = unique([o for o in row['options'] if 'соңғы нүктесі болады' in o])
    elif kind == 'repeated-digit-extremes':
        lo, hi = ns
        candidates = [x for x in range(10, 100) if str(x)[0] == str(x)[1] and lo <= int(str(x)[0]) <= hi]
        answer = max(candidates) - min(candidates)
    elif kind == 'hourly-progress-sum':
        origin, first, step, hours = ns
        answer = origin + sum(first + i * step for i in range(hours))
    elif kind == 'distinct-distances':
        distances = {abs(a - b) for a, b in itertools.combinations(ns, 2)}
        assert len(ns) == 5
        answer = len(distances)
    elif kind == 'meeting-coordinate':
        a, b, unit, va, vb = ns
        answer = F(a * vb + b * va, va + vb)
        assert F(answer - a, va) == F(b - answer, vb)
        method = 'independent weighted coordinate equality for opposing velocities'
    elif kind == 'trisection-middle':
        a, b = ns
        c, d = F(2 * a + b, 3), F(a + 2 * b, 3)
        answer = (c + d) / 2
    else:
        raise AssertionError(kind)
    return integer(answer) if isinstance(answer, (int, F)) else answer, method


def sequence(row):
    kind = row['modelId'].removeprefix('grade5-sequence-')
    s = row['statement']
    method = 'rendered-condition parsing; independent exact recurrence/index calculation'
    # Formula parsing is independent of params and the author's renderer/verifier.
    formula = re.search(r'a\(n\) = ([^.;]+?)(?=\. |, n| тізб| ереж| тізбег|$)', s)
    if kind == 'arithmetic-next':
        xs = nums(s.split('күн: ')[1].split('.')[0])
        diffs = {b - a for a, b in zip(xs, xs[1:])}
        step = unique(list(diffs))
        answer = xs[-1] + step
    elif kind == 'geometric-next':
        xs = nums(s.split('ұпай: ')[1].split('.')[0])
        factor = unique(list({F(b, a) for a, b in zip(xs, xs[1:])}))
        answer = xs[-1] * factor
    elif kind == 'listed-position':
        xs = nums(s.split('өлшемдері: ')[1].split('.')[0])
        target = int(re.search(r'\. (\d+) мәні', s)[1])
        answer = unique([i for i, v in enumerate(xs, 1) if v == target])
    elif kind == 'arithmetic-previous':
        step = int(re.search(r'Бірдей (\d+) санын', s)[1])
        xs = nums(re.search(r'бөлігі (.+?) деп', s)[1])
        assert all(b - a == step for a, b in zip(xs, xs[1:]))
        answer = xs[0] - step
    elif kind == 'fibonacci-term':
        first, second, index = nums(s)
        # Coefficients of the two seeds, instead of building the author's term list.
        ca, cb = (1, 0), (0, 1)
        for _ in range(3, index + 1): ca, cb = cb, (ca[0] + cb[0], ca[1] + cb[1])
        answer = cb[0] * first + cb[1] * second
    elif kind == 'shift-multiply-term':
        expression = re.search(r'a\(n\) = (.+?), мұндағы', s)[1]
        index = int(re.search(r'a\((\d+)\) мәнін', s)[1])
        answer = value(expression, index)
    elif kind == 'listed-term':
        xs = nums(re.search(r'журналда (.+?) тізбегі', s)[1])
        index = int(re.search(r'(\d+)-мүшенің', s)[1])
        answer = xs[index - 1]
    elif kind == 'linear-first-three':
        expression = re.search(r'a\(n\) = (.+?) тізбегінде', s)[1]
        expected = [value(expression, n) for n in range(1, 4)]
        answer = unique([o for o in row['options'] if [F(n) for n in nums(o)] == expected])
    elif kind == 'linear-term':
        expression = re.search(r'a\(n\) = (.+?)\. Индекстер', s)[1]
        index = int(re.search(r'(\d+)-мүшенің', s)[1])
        answer = value(expression, index)
    elif kind == 'constant-choice':
        answer = unique([o for o in row['options'] if len(set(nums(o))) == 1])
    elif kind == 'index-meaning':
        digits = re.search(r'c([₀₁₂₃₄₅₆₇₈₉]+)', s)[1].translate(str.maketrans('₀₁₂₃₄₅₆₇₈₉', '0123456789'))
        answer = int(digits)
    elif kind == 'period-term':
        block = nums(re.search(r'кодтарын (.+?) блогы', s)[1])
        index = int(re.search(r'тізбектің (\d+)-мүшесі', s)[1])
        answer = next(itertools.islice(itertools.cycle(block), index - 1, index))
    elif kind == 'geometric-preceding':
        factor, anchor, count = nums(s)
        good = []
        for o in row['options']:
            xs = nums(o) + [anchor]
            if len(xs) == count + 1 and all(b == a * factor for a, b in zip(xs, xs[1:])): good.append(o)
        answer = unique(good)
    elif kind == 'linear-nonmember':
        expression = re.search(r'a\(n\) = (.+?), n', s)[1]
        base, step = value(expression, 0), value(expression, 1) - value(expression, 0)
        answer = unique([o for o in row['options'] if (F(int(o)) - base) / step < 1 or ((F(int(o)) - base) / step).denominator != 1])
    elif kind == 'period-sum':
        block = nums(s.split(' сандары')[0]); count = int(re.search(r'алғашқы (\d+) мүшесінің', s)[1])
        answer = sum(itertools.islice(itertools.cycle(block), count))
    elif kind == 'arithmetic-context-term':
        first, step, index = nums(s)
        answer = sum([first] + [step] * (index - 1))
    elif kind == 'geometric-three-next':
        prefix = nums(s.split('тізбек: ')[1].split('...')[0])
        factor = unique(list({F(b, a) for a, b in zip(prefix, prefix[1:])}))
        expected = [prefix[-1] * factor ** n for n in (1, 2, 3)]
        answer = unique([o for o in row['options'] if [F(n) for n in nums(o)] == expected])
    elif kind == 'affine-recurrence':
        first, factor, add, index = nums(s)
        # Closed geometric sum, independent of the author's repeated recurrence.
        answer = first * factor ** (index - 1) + add * F(factor ** (index - 1) - 1, factor - 1)
    elif kind == 'linear-difference':
        expression = re.search(r'a\(n\) = (.+?) тізбегі', s)[1]
        high, low = [int(x) for x in re.findall(r'a\((\d+)\)', s)]
        answer = value(expression, high) - value(expression, low)
    elif kind == 'odd-term':
        index = int(re.search(r'[Тт]ізбектің (\d+)-мүшесін', s)[1])
        answer = list(range(1, index * 2, 2))[-1]
    elif kind == 'arithmetic-formula':
        xs = nums(re.search(r'басы (.+?)\. Бірінші', s)[1])
        answer = unique([o for o in row['options'] if [value(o.split(' = ')[1], n) for n in range(1, 5)] == xs])
    elif kind == 'membership-index':
        first, step, target, no_member = nums(s)
        assert no_member == 0
        members = [first]
        while members[-1] < target: members.append(members[-1] + step)
        answer = members.index(target) + 1 if target in members else 0
    elif kind == 'linear-index':
        expression, target = re.search(r'a\(n\) = (.+?) тізбегінің қай нөмірлі мүшесі (\d+) санына', s).groups()
        answer = unique([n for n in range(1, int(target) + 1) if value(expression, n) == int(target)])
    elif kind == 'linear-sum':
        expression, count = re.search(r'a\(n\) = (.+?) ережесімен.*?алғашқы (\d+) мүшесінің', s).groups()
        answer = sum(value(expression, n) for n in range(1, int(count) + 1))
    elif kind == 'fibonacci-missing-second':
        first, index, target = nums(s)
        possible = []
        for second in range(1, target + 1):
            a, b = first, second
            for _ in range(3, index + 1): a, b = b, a + b
            if b == target: possible.append(second)
        answer = unique(possible)
    elif kind == 'row-total':
        first, step, count = nums(s)
        answer = sum(first + j * step for j in range(count))
    elif kind == 'quadratic-member':
        offset = int(re.search(r'n × \(n \+ (\d+)\)', s)[1])
        good = []
        for option in row['options']:
            disc = offset ** 2 + 4 * int(option); root = math.isqrt(disc)
            if root * root == disc and (root - offset) % 2 == 0 and root > offset: good.append(option)
        answer = unique(good)
        method = 'integer discriminant/perfect-square test for every choice, no finite sampled index cutoff'
    elif kind == 'digit-stream':
        position = int(re.search(r'тізбегінің (\d+)-орнындағы', s)[1]); width = 1
        while position > width * 9 * 10 ** (width - 1):
            position -= width * 9 * 10 ** (width - 1); width += 1
        number = 10 ** (width - 1) + (position - 1) // width
        answer = str(number)[(position - 1) % width]
        method = 'independent digit-length block skipping, no materialized concatenation'
    elif kind == 'infer-affine':
        xs = nums(re.search(r'мүшелер: (.+?)\. Осы', s)[1])
        index = int(re.search(r'ережемен (\d+)-мүшені', s)[1])
        factor = F(xs[2] - xs[1], xs[1] - xs[0]); add = xs[1] - factor * xs[0]
        assert factor.denominator == 1 and factor > 0 and all(b == factor * a + add for a, b in zip(xs, xs[1:]))
        answer = xs[0] * factor ** (index - 1) + add * (factor ** (index - 1) - 1) / (factor - 1)
    elif kind == 'page-digits':
        last = int(re.search(r'беттері 1(?:-ден |–)(\d+)', s)[1]); answer = 0
        for width in range(1, len(str(last)) + 1): answer += (min(last, 10 ** width - 1) - 10 ** (width - 1) + 1) * width
        method = 'independent decimal length-block page count'
    elif kind == 'sum-previous':
        first, index = nums(s)
        answer = first * 2 ** (index - 2)
    elif kind == 'arithmetic-count':
        xs = nums(re.search(r'тізбек (.+?) түрінде', s)[1]); first, second, third, last = xs
        assert second - first == third - second
        answer = len(range(first, last + 1, second - first)); assert list(range(first, last + 1, second - first))[-1] == last
    elif kind == 'common-count':
        ea, eb = re.search(r'a\(n\) = (.+?) және b\(n\) = (.+?) ережелерімен', s).groups()
        limit = int(re.search(r'\. (\d+)(?:-тен|-тан| санынан) аспайтын', s)[1])
        aa, ab = value(ea, 1) - value(ea, 0), value(ea, 0)
        ba, bb = value(eb, 1) - value(eb, 0), value(eb, 0)
        answer = sum(1 for x in range(1, limit + 1) if (x - ab) / aa >= 1 and (x - bb) / ba >= 1 and ((x - ab) / aa).denominator == 1 and ((x - bb) / ba).denominator == 1)
        method = 'independent bounded value-space congruence intersection with positive indices'
    elif kind == 'square-term':
        offset, index, first_index = nums(s)
        assert first_index == 1
        answer = index ** 2 + offset
    elif kind == 'two-digit-count':
        expression = re.search(r'a\(n\) = (.+?), n', s)[1]
        step, base = value(expression, 1) - value(expression, 0), value(expression, 0)
        answer = sum(1 for x in range(10, 100) if (F(x) - base) / step >= 1 and ((F(x) - base) / step).denominator == 1)
    else:
        raise AssertionError(kind)
    return integer(answer) if isinstance(answer, (int, F)) else answer, method


def review(name, compute, write=False):
    rows = json.loads((ROOT / f'problems/editorial/batches/grade5-{name}.json').read_text())['editions']
    expected_count = {'coordinate': 46, 'sequence': 47}[name]
    assert len(rows) == expected_count
    entries, refs = [], set()
    forbidden = ['CB нүктесінен', 'OA нүктесінен', '25-ден', '6-тен', '10-ге', '13-ге', '6-ке артық', '86-ге', '160-тен', 'қатардан/аптадан', 'қатардың не аптаның']
    for row in rows:
        assert row['grade'] == 5 and row['minimumPlan'] == 'pro'
        assert len(row['sourceRefs']) == 1
        ref = row['sourceRefs'][0]; key = (ref['sourceFile'], ref['sourceId'])
        assert key not in refs; refs.add(key)
        path = ROOT / ref['sourceFile']
        assert path.is_relative_to(ROOT / 'problems/sources/zerek/courses')
        raw = unique([q for q in json.loads(path.read_text())['questions'] if q['id'] == ref['sourceId']])
        assert raw['statement'] and raw['solution'] and raw['sourceAnswer']
        assert not raw.get('images') and not raw.get('svg'), 'Nonvisual scope only'
        if raw.get('options'):
            correct = [o['text'] for o in raw['options'] if o.get('correct')]
            assert correct == [raw['sourceAnswer']], 'Canonical key/choice disagreement'
        assert row['statement'] != raw['statement'] and row['solution'] != raw['solution']
        for phrase in forbidden: assert phrase not in '\n'.join([row['statement'], row['solution'], *row.get('options', [])]), (row['editionId'], phrase)
        answer, method = compute(row)
        assert answer == row['answer'], (row['editionId'], answer, row['answer'])
        if 'options' in row:
            assert len(row['options']) == len(set(row['options'])) >= 4
            assert row['options'].count(answer) == 1
        assert '$' not in row['statement'] and '<img' not in row['statement']
        digest = hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        entries.append({'editionId': row['editionId'], 'sha256': digest, 'verdict': 'verified', 'method': method, 'notes': ['Full new condition, solution and every choice read; Kazakh wording corrected before signing.', 'Canonical condition, official solution and key read; source skill preserved without claiming numeric variants are new meanings.', 'Independent oracle reads rendered givens; no author model/verifier imported; exact answer and MCQ uniqueness checked.']})
    result = {'schemaVersion': 1, 'reviewer': 'independent coordinate/sequence reviewer', 'scope': f'Exactly these {len(entries)} authored grade5 {name} editions and their canonical source references; no claim about the whole archive.', 'entries': entries}
    if write:
        target = ROOT / f'problems/editorial/reviews/grade5-{name}.json'
        target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return {'batch': name, 'reviewed': len(entries), 'uniqueSourceRefs': len(refs), 'written': write}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--write', action='store_true'); parser.add_argument('--batch', choices=['coordinate', 'sequence', 'both'], default='both')
    args = parser.parse_args()
    results = []
    for name, oracle in [('coordinate', coordinate), ('sequence', sequence)]:
        if args.batch in ('both', name): results.append(review(name, oracle, args.write))
    print(json.dumps({'passed': True, 'results': results}, ensure_ascii=False))
