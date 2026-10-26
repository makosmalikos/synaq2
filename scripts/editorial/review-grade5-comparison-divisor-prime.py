"""Independent content/math review of three authored grade-5 batches.

All canonical and authored conditions, choices and full solutions were read.
This program imports no author model/verifier. It reproduces the calculations
using prime-exponent divisor generation, a separate sieve, exact arithmetic,
permutation searches and bounded exhaustive proof domains. Givens were checked
against the written conditions/choices during the content read. Review hashes
bind that review to the complete edition, not merely to its ID or model params.
"""
import argparse
from fractions import Fraction as F
import hashlib
import importlib.util
import itertools
import json
import math
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('independent_native_math', ROOT / 'scripts/editorial/review-grade5-coordinate-sequence.py')
native = importlib.util.module_from_spec(spec); spec.loader.exec_module(native)
value = native.value


def one(xs):
    assert len(xs) == 1, xs
    return xs[0]


def numeric(text):
    return [int(x) for x in re.findall(r'\d+', text)]


def factors(n):
    """Prime-exponent factorization, unlike the author's full divisor scan."""
    assert type(n) is int and n >= 1
    result, d = [], 2
    while d * d <= n:
        power = 0
        while n % d == 0:
            power += 1; n //= d
        if power: result.append((d, power))
        d += 1
    if n > 1: result.append((n, 1))
    return result


def divisors(n):
    assert n >= 1
    values = [1]
    for prime, exponent in factors(n):
        values = [v * prime ** k for v in values for k in range(exponent + 1)]
    return sorted(values)


def tau(n):
    return math.prod(power + 1 for _, power in factors(n))


SIEVE = bytearray(b'\1') * 10001
SIEVE[0:2] = b'\0\0'
for d in range(2, math.isqrt(len(SIEVE) - 1) + 1):
    if SIEVE[d]:
        for n in range(d * d, len(SIEVE), d): SIEVE[n] = 0
PRIMES = [n for n, flag in enumerate(SIEVE) if flag]


def prime(n):
    assert 0 <= n < len(SIEVE), n
    return bool(SIEVE[n])


def compare(a, b):
    return '<' if a < b else '>' if a > b else '='


def relation(a, b, symbol):
    return a < b if symbol == '<' else a > b if symbol == '>' else a == b


def pattern_values(pattern):
    slots = pattern.count('?')
    values = []
    for ds in itertools.product('0123456789', repeat=slots):
        it = iter(ds); text = ''.join(next(it) if c == '?' else c for c in pattern)
        if text[0] != '0': values.append(int(text))
    return values


def comparison(row):
    p, s = row['params'], row['statement']; k = row['modelId'].removeprefix('grade5-comparison-')
    method = 'independent integer/unit comparison and full finite candidate search'
    if k == 'compare-numbers':
        a, b = numeric(s); answer = compare(a, b)
    elif k == 'correct-inequality':
        answer = one([o for o in row['options'] if relation(*numeric(o), re.search(r'[<>=]', o)[0])])
    elif k in ('maximum', 'minimum'):
        numbers = numeric(s); answer = (max if k == 'maximum' else min)(numbers)
        if k == 'minimum': assert len({len(str(n)) for n in numbers}) > 1, 'The mixed digit-length source skill must remain'
    elif k == 'only-between':
        answer = one([o for o in row['options'] if p['lower'] < int(o) < p['upper']])
    elif k == 'natural-truth':
        assert 'оң бүтін' in s
        answer = 'Натурал сандар 1-ден басталады'
    elif k == 'only-interior':
        lower, upper = numeric(s)
        answer = one(list(range(lower + 1, upper)))
    elif k == 'double-inequality':
        middle, lower, upper = numeric(s)
        answer = one([o for o in row['options'] if numeric(o) == [lower, middle, upper] and lower < middle < upper])
    elif k == 'compare-length':
        m, cm = numeric(s); answer = compare(m * 100, cm)
    elif k == 'coordinate-side':
        coordinates = re.findall(r'([A-Z])\((\d+)\)', s)
        A, a = coordinates[0]; B, b = coordinates[1]; a, b = int(a), int(b)
        assert a < b
        answer = f'{B} нүктесі {A} нүктесінің оң жағында' if p['side'] == 'right' else f'{A} нүктесі {B} нүктесінің сол жағында'
    elif k == 'min-digits':
        digits = numeric(s)[0]; answer = int('1' + '0' * (digits - 1))
    elif k == 'longest-metres':
        answer = max(1000 * km + m for km, m in p['lengths'])
    elif k == 'max-natural-below':
        answer = int(re.search(r'(\d+) санынан', s)[1]) - 1
    elif k == 'minimum-name':
        names = re.findall(r'([А-ЯӘҒҚҢӨҰҮҺІа-яәғқңөұүһі]+) — (\d+) теңге', s)
        answer = one([name for name, n in names if int(n) == min(int(x) for _, x in names)])
    elif k == 'ascending-order':
        numbers = numeric(s)
        answer = one([o for o in row['options'] if numeric(o) == sorted(numbers)])
    elif k == 'number-length-compare':
        a, b, _, = numeric(s)
        answer = compare(10 ** (a - 1), 10 ** b - 1)
    elif k == 'ordered-coordinate':
        values = numeric(s); index = values.pop()
        answer = sorted(values)[index - 1]
    elif k in ('placeholder-allowed', 'placeholder-min', 'placeholder-max'):
        pattern = re.search(r'(\d*\?\d*) (?:жазуындағы|үлгісіндегі)', s)[1]
        bound, sign = p['bound'], p['relation']
        good = [d for d in range(10) if pattern.replace('?', str(d))[0] != '0' and relation(int(pattern.replace('?', str(d))), bound, sign)]
        answer = ', '.join(map(str, good)) if k.endswith('allowed') else min(good) if k.endswith('min') else max(good)
    elif k == 'strict-count':
        answer = sum(p['lower'] < n < p['upper'] for n in range(p['upper'] + 1))
    elif k == 'three-digit-above':
        limit = int(re.search(r'(\d+) санынан', s)[1]); answer = len([n for n in range(100, 1000) if n > limit])
    elif k in ('mixed-unit-inequality', 'mixed-unit-choice', 'time-relation-choice'):
        # The final source-specific rewrite may retain the old model name.
        def unit_quantity(text):
            unit = {'км': F(1000), 'м': F(1), 'см': F(1, 100), 'т': F(1000), 'кг': F(1), 'сағ': F(3600), 'сағат': F(3600), 'мин': F(60), 'минут': F(60), 'с': F(1)}
            parts = re.findall(r'(\d+)\s*(км|см|кг|сағат|сағ|минут|мин|м|т|с)\b', text)
            assert parts, text
            return sum(F(int(number)) * unit[u] for number, u in parts)
        candidates = []
        for option in row['options']:
            match = re.fullmatch(r'(.+?)\s*([<>=])\s*(.+)', option)
            if match and relation(unit_quantity(match[1]), unit_quantity(match[3]), match[2]): candidates.append(option)
        answer = one(candidates)
        assert len({re.search(r'(?:км|см|кг|сағ|мин|м|т|с)', o)[0] for o in row['options'] if re.search(r'[<>=]', o)}) > 1, 'Mixed-unit source selection must retain varied dimensions'
    elif k == 'minutes-strict-min':
        h, m = numeric(s); answer = h * 60 + m + 1
    elif k == 'transitive-shortest':
        # Independent relation graph read from the actual tree statements.
        assert 'өрік ағашы алма ағашынан биік' in s and 'қарағай өрік ағашынан биік' in s
        candidates = [order for order in itertools.permutations(['Алма ағашы','Өрік ағашы','Қарағай']) if order.index('Алма ағашы') < order.index('Өрік ағашы') < order.index('Қарағай')]
        answer = one(candidates)[0]
    elif k == 'bounded-digit-code':
        lo, hi, tens, units = numeric(s)
        answer = one([n for n in range(lo + 1, hi) if len(str(n)) == 4 and n // 10 % 10 == tens and n % 10 == units])
    elif k == 'max-distinct-below':
        answer = max(int(''.join(ds)) for ds in itertools.permutations('0123456789', p['digits']) if ds[0] != '0' and int(''.join(ds)) < p['limit'])
    elif k == 'three-number-chain':
        answer = one([o for o in row['options'] if numeric(o) == sorted(p['numbers'])])
    elif k == 'repeated-digit-count':
        answer = sum(p['lower'] < int(str(d) * p['digits']) < p['upper'] for d in range(1, 10))
    elif k == 'boundary-truth':
        digits = p['digits']; assert 10 ** digits - int('9' * digits) == 1
        answer = one([o for o in row['options'] if '1-ге кем' in o])
    elif k == 'reverse-count':
        answer = sum(1 for a in range(1, 10) for b in range(10) if p['lower'] <= 10 * a + b <= p['upper'] and a > b)
    elif k == 'increasing-max-below':
        answer = max(100 * a + 10 * b + c for a, b, c in itertools.combinations(range(1, 10), 3) if 100 * a + 10 * b + c < p['limit'])
    elif k == 'independent-placeholders':
        signs = {compare(a, b) for a in pattern_values(p['first']) for b in pattern_values(p['second'])}
        assert signs == {'<', '>'}; answer = 'Анықтауға болмайды'
    elif k == 'permutation-min-above':
        answer = min(int(''.join(map(str, ds))) for ds in itertools.permutations(p['digits']) if ds[0] and int(''.join(map(str, ds))) > p['bound'])
    elif k == 'pattern-count-below':
        answer = sum(n < p['bound'] for n in pattern_values(p['pattern']))
    elif k == 'second-rank':
        assert 'Айбек Назым жинағаннан көп' in s and 'Елдар Назым жинағаннан аз' in s and 'Сәуле Айбек жинағаннан көп' in s
        orders = [xs for xs in itertools.permutations(row['options']) if xs.index('Сәуле') < xs.index('Айбек') < xs.index('Назым') < xs.index('Елдар')]
        answer = one(orders)[1]
    elif k == 'max-coordinate':
        answer = max(numeric(s))
    elif k == 'read-double-inequality':
        lo, mid, hi = numeric(s)
        answer = one([o for o in row['options'] if o == f'{mid} саны {lo} санынан үлкен және {hi} санынан кіші'])
    elif k == 'mass-sort':
        def kg(label):
            return sum(int(number) * (1000 if u == 'т' else 1) for number, u in re.findall(r'(\d+) (т|кг)', label))
        target = sorted((kg(item['label']), item['label']) for item in p['items'])
        assert all(kg(item['label']) == item['kg'] for item in p['items'])
        answer = one([o for o in row['options'] if o.split('; ') == [label for _, label in target]])
    elif k == 'word-order-chain':
        assert 'Көк маршрут Қызыл маршруттан ұзын' in s and 'Қызыл маршрут Жасыл маршруттан ұзын' in s
        answer = 'Жасыл < Қызыл < Көк'
    elif k == 'interval-digit-sum-count':
        answer = sum(sum(map(int, str(n))) == p['sum'] for n in range(p['lower'] + 1, p['upper']))
    elif k == 'extreme-descriptions':
        numbers = []
        for option in row['options']:
            if re.fullmatch(r'\d+', option): numbers.append(int(option)); continue
            digits = numeric(option)[0]
            numbers.append(int('9876543210'[:digits]) if 'әртүрлі' in option else 10 ** digits - 1 if 'үлкен' in option else 10 ** (digits - 1))
        answer = one([o for o, n in zip(row['options'], numbers) if n == max(numbers)])
        assert any(re.fullmatch(r'\d+', o) for o in row['options']), 'The source close numeric competitor must be preserved'
    elif k == 'decreasing-min-above':
        answer = min(n for n in range(p['limit'] + 1, 1000) if str(n)[0] > str(n)[1] > str(n)[2])
    else: raise AssertionError(k)
    return str(answer), method


def divisor(row):
    p, s = row['params'], row['statement']; k = row['modelId'].removeprefix('grade5-divisor-')
    method = 'independent prime-exponent divisor construction and exhaustive candidate-domain proof'
    if k == 'factor-partner':
        number, factor = numeric(s); answer = F(number, factor)
    elif k == 'nth-multiple':
        base, index = p['base'], p['index']; answer = sum([base] * index)
    elif k == 'sum-divisors': answer = sum(divisors(p['number']))
    elif k == 'count-multiples-below': answer = sum(n % p['base'] == 0 for n in range(1, p['limit']))
    elif k == 'count-divisors': answer = tau(p['number'])
    elif k in ('choose-multiple', 'package-multiple-choice'): answer = one([int(o) for o in row['options'] if int(o) % p['base'] == 0])
    elif k in ('first-multiple-list', 'multiple-set-notation', 'all-multiples'):
        assert 'алғашқы төрт' not in s and ('барлық' in s or 'жиыны' in s)
        answer = one([o for o in row['options'] if ('...' in o or '…' in o) and numeric(o)[:4] == [p['base'] * n for n in range(1, 5)]])
        assert any('...' not in o and '…' not in o and numeric(o)[:4] == [p['base'] * n for n in range(1, 5)] for o in row['options']), 'Finite-prefix distractor preserves the source distinction'
    elif k == 'number-from-divisors':
        values = numeric(s); answer = max(values); assert divisors(answer) == values
    elif k == 'divisor-pair-choice':
        answer = one([o for o in row['options'] if max(numeric(o)) % min(numeric(o)) == 0])
    elif k == 'all-divisors-choice':
        answer = one([o for o in row['options'] if sorted(numeric(o)) == divisors(p['number'])])
    elif k == 'quotient-truth':
        number, div, quotient = numeric(s); assert number == div * quotient
        answer = f'{div} саны {number} санының бөлгіші'
    elif k == 'extreme-divisor-sum': answer = min(divisors(p['number'])) + max(divisors(p['number']))
    elif k == 'choose-divisor': answer = one([int(o) for o in row['options'] if p['number'] % int(o) == 0])
    elif k == 'exact-divisor-count-choice': answer = one([int(o) for o in row['options'] if tau(int(o)) == p['count']])
    elif k == 'next-joint-clock':
        period = next(t for t in itertools.count(1) if all(t % d == 0 for d in p['periods']))
        minute = (p['startMinute'] + period) % 1440; answer = f'{minute//60:02d}:{minute%60:02d}'
    elif k == 'nontrivial-bundle-count': answer = sum(1 for d in divisors(p['number']) if 1 < d < p['number'])
    elif k == 'missing-largest-divisor':
        values = numeric(re.search(r'ретімен (.+?), a түрінде', s)[1])
        answer = one([n for n in range(values[-1] + 1, values[-1] ** 2 + 1) if divisors(n)[:-1] == values])
    elif k in ('lcm', 'equal-share-minimum'):
        answer = next(n for n in itertools.count(1) if all(n % d == 0 for d in p['numbers']))
    elif k == 'unordered-factor-pair-count': answer = sum(d * d <= p['number'] for d in divisors(p['number']))
    elif k == 'divisors-and-multiples':
        expected = [d for d in divisors(p['number']) if d % p['base'] == 0]; answer = one([o for o in row['options'] if numeric(o) == expected])
    elif k == 'group-size-count': answer = sum(p['lower'] < d < p['upper'] for d in divisors(p['total']))
    elif k == 'range-multiple-count': answer = sum(n % p['base'] == 0 for n in range(p['lower'], p['upper'] + 1))
    elif k == 'select-divisors':
        expected = [n for n in p['candidates'] if p['number'] % n == 0]; answer = one([o for o in row['options'] if numeric(o) == expected])
    elif k == 'two-digit-multiple-sum': answer = sum(n for n in range(10, 100) if n % p['base'] == 0)
    elif k == 'multiple-exclusion-count': answer = sum(n % p['base'] == 0 and n % p['exclude'] != 0 for n in range(p['lower'], p['upper'] + 1))
    elif k == 'unique-remainders': answer = one([n for n in range(1, p['upper']) if n % p['multiple'] == 0 and all(n % d == p['remainder'] for d in p['divisors'])])
    elif k == 'packing-remainder-min': answer = next(n for n in itertools.count(p['remainder'] + 1) if all(n % d == p['remainder'] for d in p['sizes']))
    elif k == 'odd-divisor-count-choice': answer = one([int(o) for o in row['options'] if tau(int(o)) % 2 == 1])
    elif k == 'minimum-divisor-count': answer = next(n for n in itertools.count(1) if tau(n) == p['count'])
    elif k == 'factor-equation': answer = one([x for x in range(1, p['product'] + 1) if x * (x + p['shift']) == p['product']])
    elif k == 'primes-in-interval':
        expected = [n for n in range(p['lower'] + 1, p['upper']) if tau(n) == 2]; answer = one([o for o in row['options'] if numeric(o) == expected])
    elif k == 'least-prime-largest-proper':
        answer = p['least'] * p['proper']; ds = divisors(answer); assert ds[1] == p['least'] and ds[-2] == p['proper']
    elif k == 'divisor-and-multiple-self': answer = one([n for n in range(1, p['number'] * 2) if p['number'] % n == 0 and n % p['number'] == 0])
    elif k == 'multiple-index': answer = one([n for n in range(1, p['target'] + 1) if p['base'] * n == p['target']])
    elif k == 'most-divisors':
        best = max(tau(n) for n in p['candidates']); answer = one([n for n in p['candidates'] if tau(n) == best])
    elif k == 'one-digit-divisor-exclusion': answer = one([n for n in range(1, 10) if p['number'] % n == 0 and p['other'] % n != 0])
    elif k == 'product-of-divisors-inverse':
        # n itself is a factor of the product, so n must divide the stated product.
        answer = one([n for n in divisors(p['product']) if math.prod(divisors(n)) == p['product']])
    elif k == 'union-divisor-count': answer = len(set().union(*(set(divisors(n)) for n in p['numbers'])))
    elif k == 'largest-two-digit-divisor': answer = max(d for d in divisors(p['number']) if 10 <= d <= 99)
    elif k == 'factor-pairs-divides': answer = sum(1 for a in divisors(p['number']) if a * a <= p['number'] and (p['number'] // a) % a == 0)
    elif k == 'top-two-divisor-sum': answer = one([n for n in range(2, p['sum']) if sum(divisors(n)[-2:]) == p['sum']])
    else: raise AssertionError(k)
    if isinstance(answer, F): assert answer.denominator == 1; answer = answer.numerator
    return str(answer), method


def prime_answer(row):
    p, s = row['params'], row['statement']; k = row['modelId'].removeprefix('grade5-prime-')
    method = 'independent sieve and prime-exponent divisor oracle; complete finite domain or explicit global theorem proof'
    if k == 'twin-choice':
        answer = one([o for o in row['options'] if abs(numeric(o)[0] - numeric(o)[1]) == 2 and all(prime(n) for n in numeric(o))])
        assert any(abs(a-b)==2 and not(prime(a) and prime(b)) for a,b in p['pairs']), 'Both twin criteria must be exercised by a distractor'
    elif k == 'unique-prime-between': answer = one([n for n in range(p['lower'] + 1, p['upper']) if prime(n)])
    elif k == 'one-classification': assert tau(1) == 1; answer = 'жай сан да, құрама сан да емес'
    elif k == 'composite-count': answer = sum(tau(n) > 2 for n in range(p['lower'], p['upper'] + 1))
    elif k == 'choose-prime': answer = one([int(o) for o in row['options'] if prime(int(o))])
    elif k == 'largest-prime-bounded': answer = max(n for n in range(10, p['upper'] + 1) if prime(n))
    elif k == 'prime-count-list': answer = sum(prime(n) for n in p['candidates'])
    elif k == 'composite-reason':
        assert math.prod(p['factors']) == p['number'] and tau(p['number']) > 2
        answer = one([o for o in row['options'] if numeric(o) == divisors(p['number']) and 'екіден көп' in o])
    elif k in ('smallest-prime-after', 'least-prime-above'): answer = next(n for n in itertools.count(p['lower'] + 1) if prime(n))
    elif k == 'prime-count-interval': answer = sum(prime(n) for n in range(p['lower'], p['upper'] + 1))
    elif k == 'only-even-prime':
        assert [n for n in range(2, p['upper'] + 1, 2) if prime(n)] == [2]
        answer = 'жұп жай сан тек 2 болады'
    elif k == 'minimum-composite': answer = next(n for n in range(1, p['upper'] + 1) if tau(n) > 2)
    elif k == 'select-primes':
        expected = [n for n in p['candidates'] if prime(n)]; answer = one([o for o in row['options'] if numeric(o) == expected])
    elif k == 'choose-composite': answer = one([int(o) for o in row['options'] if tau(int(o)) > 2])
    elif k == 'minimum-prime': answer = min(n for n in p['candidates'] if prime(n)); assert answer == 2
    elif k == 'hidden-composite':
        n = p['number']; a,b = p['factors']; assert n == a*b and prime(a) and prime(b) and all(n%d for d in [2,3,5]) and n%p['falseDivisor']
        answer = one([o for o in row['options'] if numeric(o) == [n,a,b] and 'құрама' in o])
    elif k == 'prime-product-below': answer = math.prod(n for n in range(2, p['limit']) if prime(n))
    elif k == 'prime-sum-choice': answer = one([o for o in row['options'] if sum(numeric(o)) == p['sum'] and all(prime(n) for n in numeric(o))])
    elif k == 'larger-prime-factor':
        ff = factors(p['number']); assert sum(power for _, power in ff) == 2; answer = max(pr for pr,_ in ff)
    elif k == 'exact-four-divisors-choice': answer = one([int(o) for o in row['options'] if tau(int(o)) == 4])
    elif k == 'odd-prime-sum-pair': answer = one([o for o in row['options'] if sum(numeric(o)) == p['sum'] and all(prime(n) for n in numeric(o))])
    elif k in ('sieve-first-new', 'sieve-new-count'):
        crossed = set().union(*(set(range(2*d, p['limit'] + 1, d)) for d in p['previous']))
        new = sorted(set(range(2*p['next'], p['limit'] + 1, p['next'])) - crossed)
        assert p['next'] not in new
        answer = min(new) if k == 'sieve-first-new' else len(new)
    elif k == 'noncomposite-remainder': answer = sum(tau(n) <= 2 for n in range(1, p['limit'] + 1))
    elif k == 'twin-pair-count': answer = sum(prime(n) and prime(n+2) for n in range(2, p['limit']-2))
    elif k == 'sieve-stop':
        # Each prime square <=N is first eliminated at that prime's step; larger squares cannot occur.
        answer = max(q for q in PRIMES if q*q <= p['limit'])
    elif k == 'prime-expression':
        answer = one([o for o in row['options'] if prime(int(value(o)))])
    elif k == 'prime-count-strict': answer = sum(prime(n) for n in range(p['lower'] + 1, p['upper']))
    elif k == 'prime-sum-interval': answer = sum(n for n in range(p['lower'] + 1, p['upper']) if prime(n))
    elif k == 'digit-sum-primes':
        expected = [n for n in range(1, 10 ** p['maxDigits']) if prime(n) and sum(map(int,str(n))) == p['sum']]
        answer = one([o for o in row['options'] if numeric(o) == expected])
    elif k == 'odd-prime-sum-product':
        pairs = [(a,b) for a,b in itertools.combinations_with_replacement([n for n in PRIMES if n<p['sum']],2) if a+b==p['sum']]
        a,b = one(pairs); answer = a*b
    elif k == 'prime-times-natural':
        assert prime(p['prime']); answer = 1
        # Global proof: x>=2 gives two explicit factors >1; x=1 gives the stated prime.
    elif k == 'three-primes-residues':
        offsets = [0] + p['offsets']; assert {x % 3 for x in offsets} == {0,1,2} and min(p['offsets']) > 3
        assert all(prime(3+x) for x in offsets); answer = 3
        # Every p>3 gives a multiple of3 among the three; shifted members cannot equal3.
    elif k == 'maximum-of-three-primes':
        triples = [xs for xs in itertools.combinations([q for q in PRIMES if q < p['sum']],3) if sum(xs)==p['sum']]
        answer = max(max(xs) for xs in triples)
    elif k == 'sufficient-composite-factor':
        n=p['number']; a,b=p['factors']; assert a*b==n and a>1 and b>1
        answer = one([o for o in row['options'] if numeric(o) == [n,a,b]])
        assert all(a*b!=n for a,b in p['wrongPairs'])
    elif k == 'prime-digit-permutations': answer = sum(prime(10*a+b) for a,b in itertools.permutations(p['digits'],2))
    elif k == 'distinct-prime-product-divisors':
        a,b=p['examplePrimes']; assert a!=b and prime(a) and prime(b); assert tau(a*b)==4; answer = 4
        # General factorization exponents1,1 give (1+1)(1+1), not a finite-example proof.
    elif k == 'three-divisors-count': answer = sum(tau(n)==3 for n in range(10**(p['digits']-1),10**p['digits']))
    elif k == 'odd-offset-prime':
        assert p['shift']%2==1 and p['shift']>0 and prime(2+p['shift']); answer = 2
        # Any odd p gives an even shifted number>2, hence cannot work globally.
    elif k == 'composite-proof-choice':
        good=[]
        for o in row['options']:
            if '×' not in o or '+' in o: continue
            n,a,b=numeric(o)
            if a*b==n==p['number'] and 1<a<n and 1<b<n: good.append(o)
        answer=one(good)
    elif k == 'nth-prime': answer=PRIMES[p['index']-1]
    elif k == 'classify-divisor-list': assert tau(p['number'])>2; answer='құрама сан'
    elif k == 'distinct-semiprime-count': answer=sum(len(factors(n))==2 and all(power==1 for _,power in factors(n)) for n in range(2,p['limit']))
    elif k == 'impossible-prime-sum':
        impossible=[]
        for option in row['options']:
            n=int(option)
            if not any(prime(a) and prime(n-a) for a in range(2,n-1)): impossible.append(n)
        answer=one(impossible)
    elif k == 'reversed-prime-count': answer=sum(prime(n) and prime(n//10+10*(n%10)) for n in range(p['lower'],p['upper']+1))
    elif k == 'prime-factor-sum':
        ff=factors(p['product']);assert sum(power for _,power in ff)==3;answer=sum(pr*power for pr,power in ff)
    elif k == 'five-prime-even-total':
        valid=[xs for xs in itertools.combinations([q for q in PRIMES if q<p['total']],5) if sum(xs)==p['total']]
        assert valid and all(2 in xs for xs in valid)
        assert len(set(p['example']))==5 and sum(p['example'])==p['total'] and all(prime(n) for n in p['example'])
        answer='бұл сандардың біреуі міндетті түрде 2'
    elif k == 'twin-sum-larger':
        a,b=one([(a,b) for a,b in itertools.combinations([q for q in PRIMES if q<p['sum']],2) if a+b==p['sum'] and b-a==2]);answer=b
    elif k == 'square-composite-rule':
        assert all(tau(n*n)>=3 for n in range(2,100)) and not prime(4) and not prime(9)
        answer='әрқашан құрама сан'
        # Global proof read in the solution: distinct positive divisors1<n<n².
    else: raise AssertionError(k)
    return str(answer),method


def review(name, oracle, write):
    rows=json.loads((ROOT/f'problems/editorial/batches/grade5-{name}.json').read_text())['editions']
    assert len(rows)=={'comparison':48,'divisor':47,'prime':52}[name]
    refs=set();entries=[]
    for row in rows:
        assert row['grade']==5 and row['minimumPlan']=='pro'
        assert len(row['sourceRefs'])==1
        ref=row['sourceRefs'][0];key=(ref['sourceFile'],ref['sourceId']);assert key not in refs;refs.add(key)
        path=ROOT/ref['sourceFile'];assert path.is_relative_to(ROOT/'problems/sources/zerek/courses')
        source=one([q for q in json.loads(path.read_text())['questions'] if q['id']==ref['sourceId']])
        assert source['statement'] and source['solution'] and source['sourceAnswer'] and not source.get('images') and not source.get('svg')
        if source.get('options'):assert [o['text'] for o in source['options'] if o.get('correct')]==[source['sourceAnswer']]
        assert source['statement']!=row['statement'] and source['solution']!=row['solution']
        assert '$' not in row['statement'] and '<img' not in row['statement']
        answer,method=oracle(row);assert answer==row['answer'],(row['editionId'],answer,row['answer'])
        if 'options' in row:assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','method':method,'notes':['Full canonical condition, official solution/key and all new conditions/solutions/choices read.','Source-specific skill and Kazakh wording reviewed; targeted skill omissions corrected before signing.','Independent Python calculations import no author solver; finite MCQ uniqueness and global proof assumptions checked. Numeric siblings are not claimed as distinct meanings.']})
    if write:
        target=ROOT/f'problems/editorial/reviews/grade5-{name}.json'
        target.write_text(json.dumps({'schemaVersion':1,'reviewer':'independent comparison/divisor/prime reviewer','scope':f'Only these {len(entries)} authored grade5 {name} editions and their exact source references; no whole-bank claim.','entries':entries},ensure_ascii=False,indent=2)+'\n')
    return {'batch':name,'reviewed':len(entries),'uniqueSourceRefs':len(refs),'written':write}


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');parser.add_argument('--batch',choices=['comparison','divisor','prime','all'],default='all');args=parser.parse_args()
    # Known edge cases independently protect the square/self-pair and 1/2 rules.
    assert divisors(1)==[1] and divisors(25)==[1,5,25] and tau(25)==3
    assert tau(24)==8 and math.prod(divisors(10))==100
    assert not prime(1) and prime(2) and not prime(4) and prime(97) and not prime(4181)
    assert pattern_values('?0')==list(range(10,100,10))
    results=[]
    for name,oracle in [('comparison',comparison),('divisor',divisor),('prime',prime_answer)]:
        if args.batch in ('all',name):results.append(review(name,oracle,args.write))
    print(json.dumps({'passed':True,'results':results},ensure_ascii=False))
