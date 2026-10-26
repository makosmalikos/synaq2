"""Independent review oracle for the authored grade-5 natural-number batch.

Does not import the author's model module and never rewrites authored editions.
The reviewer read all 47 conditions, solutions, choices and canonical source
conditions/solutions. This program reproduces the independent calculations and
binds that review to the exact edition hash, rather than to a mutable ID alone.
"""
import argparse
import ast
import hashlib
import itertools
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BATCH = ROOT / 'problems/editorial/batches/grade5-natural.json'
TARGET = ROOT / 'problems/editorial/reviews/grade5-natural.json'

WORDS = {'нөл': 0, 'бір': 1, 'екі': 2, 'үш': 3, 'төрт': 4, 'бес': 5,
         'алты': 6, 'жеті': 7, 'сегіз': 8, 'тоғыз': 9, 'он': 10,
         'жиырма': 20, 'отыз': 30, 'қырық': 40, 'елу': 50, 'алпыс': 60,
         'жетпіс': 70, 'сексен': 80, 'тоқсан': 90}
SCALES = {'мың': 1000, 'миллион': 1000000, 'миллиард': 1000000000}


def parse_words(text):
    total = group = 0
    for token in text.split():
        if token in WORDS:
            group += WORDS[token]
        elif token == 'жүз':
            group = (group or 1) * 100
        else:
            assert token in SCALES, token
            total += (group or 1) * SCALES[token]
            group = 0
    return total + group


def native_value(text):
    expression = ast.parse(text.replace('×', '*').replace('−', '-').replace(' ', ''), mode='eval')

    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant):
            assert type(node.value) is int
            return node.value
        assert isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Add, ast.Sub, ast.Mult))
        left, right = visit(node.left), visit(node.right)
        return left + right if isinstance(node.op, ast.Add) else left - right if isinstance(node.op, ast.Sub) else left * right
    return visit(expression)


def frequency_prefix(limit, digit):
    """Count by complete decimal cycles, unlike the author's enumeration."""
    if limit <= 0:
        return 0
    total, unit = 0, 1
    while unit <= limit:
        higher, current, lower = limit // (unit * 10), limit // unit % 10, limit % unit
        if digit:
            total += higher * unit
            total += unit if current > digit else lower + 1 if current == digit else 0
        elif higher:
            total += (higher - 1) * unit
            total += lower + 1 if current == 0 else unit
        unit *= 10
    return total


def page_digits(last):
    return sum((min(last, 10 ** size - 1) - 10 ** (size - 1) + 1) * size
               for size in range(1, len(str(last)) + 1))


def independent_answer(row):
    p = row['params']
    kind = row['modelId'].removeprefix('grade5-natural-')
    method = 'independent integer/place-value reasoning'
    if kind == 'word-number':
        answer = parse_words(re.search('«([^»]+)»', row['statement'])[1])
    elif kind == 'read-number':
        assert parse_words(row['answer']) == p['number']
        assert sum(parse_words(option) == p['number'] for option in row['options']) == 1
        answer = row['answer']
        method = 'independent Kazakh word-to-integer parser; unique matching option'
    elif kind == 'digit-value':
        answer = int(str(p['number'])[-p['place'] - 1]) * 10 ** p['place']
        assert 'разрядында тұр' not in row['statement'], 'The condition gives away the source placement skill'
    elif kind == 'digit-at':
        answer = str(p['number'])[-p['place'] - 1]
    elif kind == 'choose-place':
        values = [v for v in p['numbers'] if str(v)[-p['place'] - 1] == str(p['digit'])]
        assert len(values) == 1
        answer = values[0]
    elif kind in ('max-digits', 'min-digits', 'extreme-sum'):
        low, high = int('1' + '0' * (p['digits'] - 1)), int('9' * p['digits'])
        answer = high if kind == 'max-digits' else low if kind == 'min-digits' else low + high
    elif kind == 'successor':
        answer = p['number'] + 1
        assert '1-ге артық' in row['statement'], 'The consecutive step must be explicit'
    elif kind == 'predecessor':
        answer = p['number'] - 1
    elif kind == 'first-natural':
        assert 1 in p['candidates'] and len(set(p['candidates'])) == len(p['candidates'])
        answer = 1
    elif kind == 'non-natural':
        values = [v for v in p['candidates'] if v < 1]
        assert values == [0]
        answer = 0
    elif kind == 'decimal-symbols':
        answer = len(set('0123456789'))
    elif kind == 'thousands-class':
        answer = int(str(p['number']).zfill(6)[-6:-3])
    elif kind == 'zero-count':
        assert parse_words(re.search('«([^»]+)»', row['statement'])[1]) == p['number']
        answer = str(p['number']).count('0')
    elif kind == 'expanded-number':
        answer = native_value(re.search(r'сан (.+) түрінде', row['statement'])[1])
    elif kind == 'extreme-distinct':
        candidates = (int(''.join(map(str, digits))) for digits in itertools.permutations(range(10), p['digits']) if digits[0])
        answer = max(candidates) if p['maximum'] else min(candidates)
        method = 'exhaustive independent permutation extremum, no leading zero'
    elif kind == 'total-tens':
        answer = int(str(p['number'])[:-1] or '0')
    elif kind == 'permutation-range':
        candidates = [int(''.join(map(str, digits))) for digits in itertools.permutations(p['digits']) if digits[0]]
        answer = max(candidates) - min(candidates)
    elif kind == 'place-ratio':
        text = str(p['number'])
        positions = [i for i, digit in enumerate(text) if digit == str(p['digit'])]
        assert len(positions) == 2
        answer = 10 ** (positions[1] - positions[0])
    elif kind == 'max-digit-sum':
        answer = max(v for v in range(10 ** (p['digits'] - 1), 10 ** p['digits']) if sum(map(int, str(v))) == p['sum'])
        method = 'exhaustive bounded extremum for the exact digit-sum constraint'
    elif kind == 'page-digits':
        answer = page_digits(p['last'])
        method = 'decimal-length block formula; both endpoints included'
    elif kind == 'expansion-choice':
        matches = [option for option in row['options'] if native_value(option) == p['number']]
        assert len(matches) == 1
        answer = matches[0]
    elif kind == 'digit-length-count':
        answer = sum(1 for v in range(10 ** p['digits']) if len(str(v)) == p['digits'])
    elif kind == 'min-digit-sum':
        answer = next(v for v in range(1, 100000) if sum(map(int, str(v))) == p['sum'])
        method = 'independent exhaustive ascending search proves minimum'
    elif kind == 'digit-frequency':
        answer = frequency_prefix(p['last'], p['digit']) - frequency_prefix(p['first'] - 1, p['digit'])
        method = 'decimal-cycle occurrence formula with leading-zero correction'
    elif kind == 'append-zero':
        candidates = [v for v in range(10, 100) if int(str(v) + '0') - v == p['increase']]
        assert len(candidates) == 1
        answer = candidates[0]
    elif kind == 'odd-digit-count':
        answer = sum(1 for digits in itertools.product(range(10), repeat=p['length']) if all(d % 2 for d in digits))
    elif kind == 'count-digit-sum':
        assert p['sum'] <= 9
        answer = math.comb(p['sum'] + p['length'] - 2, p['length'] - 1)
        method = 'stars-and-bars after removing the mandatory leading one; upper digit bound inactive'
    elif kind == 'hundreds-code':
        candidates = [v for v in range(1000, 10000) if v // 100 == p['hundreds'] and int(str(v)[2]) == p['tens'] and int(str(v)[3]) == p['tens'] + p['extra']]
        assert len(candidates) == 1
        answer = candidates[0]
    elif kind == 'page-inverse':
        candidates = [v for v in range(1, 1000) if page_digits(v) == p['digitTotal']]
        assert len(candidates) == 1
        answer = candidates[0]
    elif kind == 'repeated-class':
        full = int(str(p['block']) * 2)
        answer, remainder = divmod(full, p['block'])
        assert not remainder
    elif kind == 'digit-stream':
        position, size, start = p['position'], 1, 1
        while position > 9 * start * size:
            position -= 9 * start * size
            size += 1
            start *= 10
        number, index = start + (position - 1) // size, (position - 1) % size
        answer = str(number)[index]
        method = 'decimal block arithmetic locates the number and character; no concatenated stream'
    elif kind == 'predecessor-sum':
        answer = sum(map(int, str(p['number'] - 1)))
    elif kind == 'count-digit-product':
        answer = 0
        for digits in itertools.combinations_with_replacement(range(1, 10), p['length']):
            if math.prod(digits) == p['product']:
                answer += len(set(itertools.permutations(digits)))
        method = 'factor multisets and distinct permutations, independently of integer enumeration'
    elif kind == 'linked-digits':
        candidates = []
        for value in range(1000, 10000):
            a, b, c, d = map(int, str(value))
            if a == p['thousands'] and b == a * p['multiplier'] and c == b - a and d == p['units']:
                candidates.append(value)
        assert len(candidates) == 1
        answer = candidates[0]
    else:
        raise AssertionError(kind)
    return str(answer), method


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    batch = json.loads(BATCH.read_text())
    rows, entries, sources = batch['editions'], [], {}
    assert len(rows) == 47
    for row in rows:
        assert row['grade'] == 5
        answer, method = independent_answer(row)
        assert row['answer'] == answer, row['editionId']
        assert not re.search(r'64-ге|326-ге|499-ге|бір санға артық|<[^>]+>|\\(?:frac|cdot|times)|\$', row['statement'])
        for ref in row['sourceRefs']:
            assert not Path(ref['sourceFile']).is_absolute()
            if ref['sourceFile'] not in sources:
                sources[ref['sourceFile']] = json.loads((ROOT / ref['sourceFile']).read_text())
            capture = sources[ref['sourceFile']]
            assert capture['status'] == 'captured'
            matches = [q for q in capture['questions'] if q['id'] == ref['sourceId']]
            assert len(matches) == 1
            source = matches[0]
            assert source['checked'] and source['solution'] and source['sourceAnswer']
            assert not source.get('images') and not source.get('svg') and '[Image:' not in source['statement']
        if row.get('options'):
            assert len(set(row['options'])) == len(row['options'])
            assert row['options'].count(answer) == 1
        digest = hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
        entries.append({'editionId': row['editionId'], 'sha256': digest, 'verdict': 'verified', 'method': method,
                        'notes': 'All conditions, solutions, options and canonical source skill references read independently. New givens recomputed without importing the author model. Kazakh wording and endpoint/leading-zero conventions checked. Numeric variants are not treated as semantically unique stories.'})
    report = {'schemaVersion': 1, 'reviewer': 'independent_grade4_editor_agent', 'scope': 'Exactly these 47 authored grade-5 natural-number editions; not the entire saved bank.', 'entries': entries}
    if args.write:
        TARGET.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'reviewed': len(entries), 'verified': len(entries), 'sourceFiles': len(sources), 'reviewWritten': args.write}))


if __name__ == '__main__':
    main()
