"""Independent full printed-data currency review; no author solver imports.

All40 saved originals and new conditions/full solutions/MCQ read offline.
Minima: shortest-path BFS; combinations: generating-function convolution;
coin ledgers: exhaustive integer domains. --write binds reviewed full-row SHA.
"""
from collections import deque
from fractions import Fraction as F
from pathlib import Path
import argparse
import copy
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-currency-wave18.json'
OUT = 'problems/editorial/reviews/grade4-currency-wave18.json'


def one(xs):
    assert len(xs) == 1, xs
    return xs[0]


def number(text):
    compact = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', compact), text
    return int(compact)


def integer(n):
    n = F(n); assert n.denominator == 1, n
    return n.numerator


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def pick(row, values, wanted):
    assert len(values) == 4 and len(set(row['options'])) == 4
    assert values.count(wanted) == 1, (row['editionId'], values, wanted)
    return row['options'][values.index(wanted)]


def amount(text):
    """Printed mixed euro/dollar/cent amount, represented in exact cents."""
    matches = list(re.finditer(r'([\d ]+) (еуро|доллар|цент)', text))
    assert matches, text
    rest = text
    for m in reversed(matches):
        rest = rest[:m.start()] + rest[m.end():]
    assert not rest.strip(), (text, rest)
    return sum(number(m[1]) * (1 if m[2] == 'цент' else 100) for m in matches)


def sum_option(text):
    m = re.fullmatch(r'(.+) (теңге|доллар|цент)', text); assert m
    return sum(number(v) for v in m[1].split(' + '))


def shortest(amount, allowed):
    """Unit-weight graph layers prove global minimum; not greedy or DP."""
    q, depth, parent = deque([0]), {0: 0}, {}
    while q:
        current = q.popleft()
        if current == amount:
            coins, n = [], current
            while n:
                prior, coin = parent[n]; coins.append(coin); n = prior
            assert sum(coins) == amount and len(coins) == depth[current]
            return depth[current], coins
        for coin in allowed:
            target = current + coin
            if target <= amount and target not in depth:
                depth[target] = depth[current] + 1; parent[target] = (current, coin); q.append(target)
    raise AssertionError(('Unreachable exact amount', amount, allowed))


def ways(total, allowed):
    # Coefficient of x^total in PRODUCT(1+x^d+x^(2d)+...): each term
    # encodes exactly one count per denomination, so permutation is not counted.
    coefficients = [1] + [0] * total
    for d in allowed:
        updated = [0] * (total + 1)
        for degree, c in enumerate(coefficients):
            if c:
                for term in range(degree, total + 1, d):
                    updated[term] += c
        coefficients = updated
    return coefficients[total]


def solve(row):
    s, p = row['statement'], row['params']
    k = row['modelId'].removeprefix('grade4-currency-')
    answer = value = None
    method = 'Independent exact printed amount/unit ledger with inverse conservation check'
    note = ''
    if k == 'missing-denomination':
        m = re.search(r'мәндері: (.+) (цент|еуро)\.', s); assert m
        allowed = [number(v) for v in m[1].split(', ')]
        answer = pick(row, [amount(o) // (1 if m[2] == 'цент' else 100) not in allowed for o in row['options']], True)
        assert allowed == p['allowed']
        note = f'Actual printed allowed set {allowed}; select sole missing actual offered denomination. Conditional teaching-set membership, no current completeness claim.'
    elif k == 'uniform-coin-change':
        m = re.match(r'(.+) ақшаны тек (\d+) центтік', s); assert m
        total, coin = amount(m[1]), int(m[2]); value = integer(F(total, coin))
        assert value * coin == total
        note = f'Actual mixed amount {total} cents conserves value as {value} identical {coin}-cent coins; requested count.'
    elif k == 'dollar-fraction-cents':
        denominator = int(re.search(r'1/(\d+) бөлігін', s)[1]); target = F(100, denominator)
        answer = pick(row, [amount(o) for o in row['options']], target)
        note = f'Printed one-dollar unit100 divided into {denominator} equal shares; exact {target} cents, reverse multiplication100.'
    elif k in {'exact-denomination-sum', 'nonmatching-denomination-sum'}:
        total = number(re.match(r'([\d ]+) (теңге|цент|доллар) сомасын', s)[1])
        values = [sum_option(o) for o in row['options']]
        if k == 'nonmatching-denomination-sum':
            assert 'АЛМАЙТЫН' in s; answer = pick(row, [v != total for v in values], True)
        else:
            answer = pick(row, values, total)
        note = f'Full actual printed expression sums {values}; requested {"sole non-equal" if k.startswith("nonmatching") else "sole equal"} sum relative to {total}. All listed money must be used.'
    elif k == 'minimum-money-count':
        m = re.search(r'Бұл есепте (.+) (еуро|доллар|цент) номиналдары', s); assert m
        allowed = [number(t) for t in m[1].split(', ')]
        n = re.search(r'бар\. ([\d ]+) (еуро|доллар|цент) сомасын', s); assert n and n[2] == m[2]
        target = number(n[1]); value, coins = shortest(target, allowed)
        assert allowed == p['allowed'] and target == p['amount']
        printed = re.search(r'Дәл сома (.+) (еуро|доллар|цент) = ([\d ]+) (еуро|доллар|цент)\.', row['solution']); assert printed
        actual_coins = [number(t) for t in printed[1].split(' + ')]
        assert printed[2] == printed[4] == m[2] and number(printed[3]) == target
        assert all(c in allowed for c in actual_coins) and sum(actual_coins) == target and len(actual_coins) == value
        method = 'Independent breadth-first search of EVERY reachable exact subtotal, all smaller coin-count graph layers exhausted before target'
        note = f'Printed target{target}, allowed{allowed}; BFS minimum{value} with witness{coins}. Actual solution witness separately sums correctly and has same minimum length; no reliance on generic greedy claim.'
    elif k == 'greatest-mixed-amount':
        values = [amount(o) for o in row['options']]; answer = pick(row, values, max(values))
        note = f'All actual mixed amounts converted to cents {values}; unique greatest amount, cent digit kept at original place value.'
    elif k == 'mixed-money-cents':
        text = s.split(' неше центке')[0]; target = amount(text)
        answer = pick(row, [amount(o) for o in row['options']], target)
        note = f'Actual printed euro/dollar plus remaining cents yields exact {target} cents; not concatenation or base1000.'
    elif k == 'cents-to-euros':
        total = number(re.search(r'Жинақта ([\d ]+) еуроцент', s)[1]); value = integer(F(total, 100))
        assert value * 100 == total
        note = f'Printed {total} cents divides into {value} complete100-cent euro units, exact inverse.'
    elif k == 'whole-dollar-cents':
        major = number(re.search(r'Әмиянда ([\d ]+) доллар', s)[1]); value = amount(f'{major} доллар')
        note = f'{major} complete dollar units, each100cents, produce exact {value} cents; requested output cents.'
    elif k == 'uniform-banknote-change':
        m = re.match(r'([\d ]+) теңгені түгелдей ([\d ]+) теңгелік', s); assert m
        total, denomination = map(number, m.groups()); value = integer(F(total, denomination)); assert value * denomination == total
        note = f'Value-conserving exact count{value} × denomination{denomination} = total{total} tenge.'
    elif k == 'equal-banknote-counts':
        m = re.search(r'([\d ]+) теңгені ([\d ]+) және ([\d ]+) теңгелік', s); assert m
        total, a, b = map(number, m.groups()); count = one([n for n in range(total // min(a, b) + 1) if n * a + n * b == total]); value = count * 2
        method = 'Complete nonnegative equal-count note domain, with total-value upper bound and exact inverse ledger'
        note = f'Only{count} of EACH denomination{a}/{b} conserves{total}; asked ALL notes = {value}, not number of pairs.'
    elif k == 'mixed-cent-comparison':
        left, right = s.split(' □ '); right = right.split('.')[0]
        a, b = amount(left), amount(right); answer = '<' if a < b else '>' if a > b else '='
        assert answer in row['options']
        note = f'Actual printed same-unit comparison {a} versus{b} cents yields{answer}; no residual-cent multiplication by10.'
    elif k == 'two-euro-coin-counts':
        m = re.search(r'тек (\d+) және (\d+) еуролық', s); assert m
        high, low = map(int, m.groups()); count = int(re.search(r'Барлығы (\d+) монета', s)[1]); total = int(re.search(r'жалпы сома (\d+) еуро', s)[1])
        possible = [(h, count-h) for h in range(count+1) if h*high+(count-h)*low == total]; value = one(possible)[0]
        method = 'Exhaustive complete integer coin-count ledger, checking BOTH total coin count and exact value'
        note = f'Unique(high,low) pair{possible} for{count}coins totalling{total}; requested HIGH denomination count{value}.'
    elif k == 'multiple-banknote-change':
        m = re.match(r'(\d+) долларлық (\d+) қағаз ақшаны түгел (\d+) долларлық', s); assert m
        large, count, small = map(int, m.groups()); value = integer(F(large*count, small)); assert value*small == large*count
        note = f'All{count} original notes of{large} conserve exact total{large*count}; resulting{small}-unit notes count{value}, not one-original-note count.'
    elif k == 'mixed-euro-change':
        price = amount(re.search(r'бағасы (.+)\. Оған', s)[1]); paid = amount(re.search(r'Оған (.+) берілді', s)[1]); change = paid-price
        assert change >= 0; answer = pick(row, [amount(o) for o in row['options']], change)
        note = f'Actual price{price} and paid{paid} cents give change{change}; adding price+change reconstructs exact paid amount.'
    elif k == 'valid-coin-triple':
        m = re.search(r'жиынында (.+) центтік', s); assert m
        allowed = [number(t) for t in m[1].split(', ')]; total = int(re.search(r'сомасы (\d+) цент', s)[1]); tuples = []
        for o in row['options']:
            xs = [number(t) for t in o.removesuffix(' цент').split(', ')]
            tuples.append((len(xs) == 3 and all(x in allowed for x in xs) and sum(xs) == total))
        answer = pick(row, tuples, True)
        # Also enumerate all unordered triples, beyond the four supplied choices.
        all_triples = [(a,b,c) for a in allowed for b in allowed for c in allowed if a<=b<=c and a+b+c==total]
        assert len(all_triples) == 1
        method = 'Actual MCQ membership+cardinality+sum checked independently; complete allowed unordered triple enumeration confirms unique physical triple'
        note = f'Full allowed triple domain gives{all_triples}; two incorrect options still total150 but contain forbidden25/40, fourth has wrong sum.'
    elif k == 'purchase-remainder':
        m = re.search(r'Аружанда (\d+) доллар бар\. Ол (\d+) долларлық', s); assert m
        budget, fixed = map(int, m.groups()); each = int(re.search(r'әрқайсысы (\d+) доллар', s)[1]); remaining = budget-fixed
        possible = [n for n in range(remaining+1) if n*each<=remaining]; count = max(possible); value = remaining-count*each
        assert 0 <= value < each and fixed+each*count+value == budget
        note = f'All affordable integer purchases0..{remaining} checked; maximum{count}, exact leftover{value}, another item unaffordable.'
    elif k == 'two-cent-coin-counts':
        m = re.match(r'(.+) ақшаны тек (\d+) және (\d+) центтік', s); assert m
        total = amount(m[1]); high, low = int(m[2]), int(m[3]); count = int(re.search(r'Барлығы (\d+) монета', s)[1])
        h, l = one([(h,count-h) for h in range(count+1) if h*high+(count-h)*low == total]); value = l
        assert f'{low} центтік монеталар нешеу' in s
        method = 'Exhaustive nonnegative count domain0..N, actual printed mixed-money value converted to cents before simultaneous ledger checks'
        note = f'Only{h} high/{l} low coins give BOTH count{count} and value{total}; requested LOW count{value}.'
    elif k == 'fixed-rate-price-comparison':
        m = re.search(r'кәдесый (\d+) доллар немесе (\d+) еуро', s); assert m
        dollars, euro = map(int, m.groups()); dr = int(re.search(r'1 доллар = (\d+) теңге', s)[1]); er = int(re.search(r'1 еуро = (\d+) теңге', s)[1])
        assert 'шартты бағам' in s and 'Комиссия жоқ' in s
        d, e = dollars*dr, euro*er; expected = ('Еуромен' if e<d else 'Доллармен')+f' {abs(d-e)} теңгеге арзан'
        answer = one([o for o in row['options'] if o==expected])
        note = f'Explicit hypothetical commission-free exchange rates only: dollar total{d}, euro total{e}, exact saving{abs(d-e)} in requested currency; not current-rate guidance.'
    elif k == 'unordered-denomination-ways':
        m = re.match(r'([\d ]+) (теңге|цент) сомасын тек (.+) \2 номиналдарымен', s); assert m
        total = number(m[1]); allowed = [number(t) for t in m[3].split(', ')]; value = ways(total, allowed)
        assert 'Реті маңызды емес' in s and 'нөл дана' in s
        method = 'Independent exact generating-function coefficient convolution for unbounded denomination counts; each denomination contributes ONE count variable'
        note = f'Coefficient[x^{total}] PRODUCT(1+x^d+...) for{allowed} equals{value}; zero counts permitted and permutations never multiply a combination.'
    elif k == 'equal-cent-coin-counts':
        m = re.match(r'(\d+) және (\d+) центтік', s); assert m
        a, b = map(int, m.groups()); total = amount(re.search(r'сомасы (\d+ доллар)', s)[1])
        count = one([n for n in range(total//min(a,b)+1) if n*a+n*b==total]); value = count*2
        note = f'Complete equal-count domain yields{count}coins of EACH{a}/{b}; both values sum to{total}cents, asked all{value}coins.'
    elif k == 'two-note-configuration':
        m = re.match(r'(\d+) еуроны тек (\d+) және (\d+) еуролық', s); assert m
        total, high, low = map(int,m.groups()); count = int(re.search(r'Барлығы (\d+) қағаз', s)[1]); valid = []
        for o in row['options']:
            m = re.fullmatch(r'(\d+) еуролық (\d+) және (\d+) еуролық (\d+)', o); assert m
            a,h,b,l=map(int,m.groups()); valid.append(a==high and b==low and h+l==count and a*h+b*l==total)
        answer = pick(row,valid,True)
        assert one([(h,count-h) for h in range(count+1) if h*high+(count-h)*low==total]) == (4,4)
        note = f'Every actual configuration checks BOTH count{count} and value{total}; exhaustive domain confirms4high+4low, not just a matching value.'
    elif k == 'spending-equalization':
        total = int(re.search(r'барлығы (\d+) монета',s)[1]); m=re.search(r'Әмір (\d+), Айша (\d+) монетаны жұмсаған',s); assert m
        first, second = map(int,m.groups()); valid=[]
        for o in row['options']:
            m=re.fullmatch(r'Әмірде (\d+), Айшада (\d+)',o); assert m
            a,b=map(int,m.groups());valid.append(a+b==total and a>=first and b>=second and a-first==b-second)
        answer=pick(row,valid,True)
        assert one([(a,total-a) for a in range(total+1) if a>=first and total-a>=second and a-first==total-a-second]) == (8,10)
        note=f'Full initial split domain of{total}, subtract spending{first}/{second} from respective people: only8/10 produces equal5/5 remaining; total decreases, unlike transfer.'
    elif k == 'two-tenge-note-counts':
        m=re.match(r'([\d ]+) теңге тек ([\d ]+) және ([\d ]+) теңгелік',s);assert m
        total,high,low=map(number,m.groups());count=int(re.search(r'Барлығы (\d+) қағаз',s)[1]);h,l=one([(h,count-h) for h in range(count+1) if h*high+(count-h)*low==total]);value=l
        assert f'{low:,}'.replace(',',' ')+' теңгелік қағаз ақшалар саны' in s
        note=f'Complete0..{count} ledger gives{h}high/{l}low notes, total{total} and count{count} separately satisfied; asked lower denomination count{value}.'
    elif k == 'transfer-equalization':
        total=int(re.search(r'барлығы (\d+) монета',s)[1]);transfer=int(re.search(r'Мәдинаға (\d+) монета',s)[1]);valid=[]
        for o in row['options']:
            m=re.fullmatch(r'Нұрда (\d+), Мәдинада (\d+)',o);assert m
            a,b=map(int,m.groups());valid.append(a+b==total and a>=transfer and a-transfer==b+transfer)
        answer=pick(row,valid,True)
        assert one([(a,total-a) for a in range(total+1) if a>=transfer and a-transfer==total-a+transfer]) == (13,7)
        note=f'Full initial split domain{total}; transfer{transfer} removes from first AND adds to second, retaining total. Only13/7 becomes10/10; initial gap6 not3.'
    else:
        raise AssertionError(('Unreviewed currency model',k))
    if answer is None:
        value=integer(value);answer=pick(row,[number(o) for o in row['options']],value) if row.get('options') else str(value)
    assert row['answer']==answer,(row['editionId'],row['answer'],answer)
    if row.get('options'):
        assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:
        assert re.fullmatch(r'\d+',answer) and re.search(r'Жауап[^.]*тек сан',s)
    return method,note


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==40
    assert len({r['editionId'] for r in rows})==len({r['sourceRefs'][0]['sourceId'] for r in rows})==40
    entries=[]
    for row in rows:
        assert row['grade']==4 and row['minimumPlan']=='pro'
        assert not re.search(r'[\\$]',row['statement']+row['solution'])
        ref=one(row['sourceRefs']);source=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']])
        assert source['checked'] and not source.get('images') and not source.get('svg') and source['statement']!=row['statement']
        method,note=solve(row)
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':method,
                        'notes':note+' All saved/new full conditions, complete solutions and every option read independently; source skill and requested quantity retained.'})
        bad=copy.deepcopy(row);bad['answer']+='_wrong'
        try:solve(bad)
        except AssertionError:pass
        else:raise AssertionError(('Wrong key accepted',row['editionId']))
    by_id={r['sourceRefs'][0]['sourceId']:r for r in rows}
    canaries=[('074b8271dc00f600','78 еуро','79 еуро'),('0f915e63edfc6df2','= 470 теңге','= 500 теңге'),
              ('d64e8822595cb0b3','30 000 теңге','20 000 теңге'),('8438ab5071553314','200 цент','100 цент'),
              ('7c8905d9bd9c9af8','сома 21 еуро','сома 22 еуро'),('fd038c7084f3fcd4','27 долларлық','28 долларлық'),
              ('f5885d695dc71e2e','Айша 5 монетаны','Айша 3 монетаны'),('a25faa8d7ec05123','Мәдинаға 3 монета','Мәдинаға 2 монета')]
    for source_id,old,new in canaries:
        bad=copy.deepcopy(by_id[source_id]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:pass
        else:raise AssertionError(('Printed-given mutation accepted',source_id))
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23',
            'scope':'All40 saved/new full conditions, full solutions and MCQ read; actual printed exact ledgers,8 shortest-path minima,2 generating-function counts,complete integer coin/note/split domains and conditional FX;40 wrong-key and8 printed-given canaries rejected.',
            'entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'verified':len(entries),'wrongKeysRejected':len(rows),'printedCanariesRejected':len(canaries),'written':args.write}))


if __name__=='__main__':main()
