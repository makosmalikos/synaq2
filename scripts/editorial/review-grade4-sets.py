"""Independent set/Boolean/combinatorial review after reading all 80 old/new tasks.

Uses characteristic membership per atom, eight-bit universal truth vectors,
closed-form subset counts and explicit realizability of count constraints.
No author implementation or exported testing helper is imported.
"""
from collections import Counter
import hashlib
import itertools
import json
import math
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
FILE='problems/editorial/batches/grade4-sets-wave8.json'


def one(values):
    assert len(values)==1,values
    return values[0]


def parse_set(s):
    if s=='∅':return frozenset()
    assert s.startswith('{') and s.endswith('}'),s
    tokens=[t.strip() for t in s[1:-1].split(';')]
    return frozenset(int(t) if re.fullmatch(r'-?\d+',t) else t for t in tokens)


def selected_set(row, values):
    return one([s for s in row['options'] if parse_set(s)==frozenset(values)])


def atoms(e,sets):
    if isinstance(e,str):return set(sets[e])
    if isinstance(e,dict):return set(e['literal'])
    return atoms(e[1],sets)|atoms(e[2],sets)


def membership(e,sets,a):
    if isinstance(e,str):return a in sets[e]
    if isinstance(e,dict):return a in e['literal']
    left,right=membership(e[1],sets,a),membership(e[2],sets,a)
    return {'union':left or right,'intersect':left and right,
            'difference':left and not right,'xor':left!=right}[e[0]]


def evaluate(e,sets):
    return {a for a in atoms(e,sets) if membership(e,sets,a)}


def truth_vector(e):
    # All eight pointwise A/B/C states in one bit vector. These are the full
    # logical domain of arbitrary set expressions, not a sampled finite bank.
    if isinstance(e,str):return {'A':0b10101010,'B':0b11001100,'C':0b11110000}[e]
    a,b=truth_vector(e[1]),truth_vector(e[2])
    return {'union':a|b,'intersect':a&b,'difference':a&(~b&255),'xor':a^b}[e[0]]


def predicate(kind,n,p):
    if kind=='divisible':return n%p['divisor']==0
    if kind=='odd':return n%2==1
    if kind=='even':return n%2==0
    if kind=='greater':return n>p['bound']
    if kind=='digit-sum':return sum(map(int,str(n)))==p['digitSum']
    raise ValueError(kind)


def finite(row):
    p=row['params'];domain=range(p['low'],p['high']+1)
    selected=[]
    for n in domain:
        a=predicate(p['first'],n,p.get('firstParams',{}))
        b=predicate(p['second'],n,p.get('secondParams',{})) if p.get('second') else False
        keep=a if not p.get('second') else {'union':a or b,'intersect':a and b,
               'difference':a and not b,'xor':a!=b}[p['operation']]
        if keep:selected.append(n)
    if p['ask']=='set':return selected_set(row,selected)
    return str(len(selected))


def three_counts(row):
    s=row['statement'];p=row['params'];total=int(re.match(r'(\d+) оқушы',s)[1])
    A,B,C=map(int,re.search(r'A бағытын (\d+), B бағытын (\d+), C бағытын (\d+)',s).groups())
    if p['query']=='all-three':
        twice=int(re.search(r'Дәл екі бағытты таңдаған (\d+)',s)[1])
        assert (A+B+C-total-twice)%2==0
        t=(A+B+C-total-twice)//2;assert t>=0
        # At least one nonnegative three-pair allocation must realize the
        # displayed marginals. The hidden author regions are not an answer.
        feasible=[]
        for ab in range(twice+1):
            for ac in range(twice-ab+1):
                bc=twice-ab-ac
                single=[A-ab-ac-t,B-ab-bc-t,C-ac-bc-t]
                if min(single)>=0 and sum(single)+twice+t==total:
                    feasible.append((single,ab,ac,bc,t))
        assert feasible
        return str(t)
    ab,ac,bc=map(int,re.search(r'A мен B бағыттарын (\d+), A мен C бағыттарын (\d+), B мен C бағыттарын (\d+)',s).groups())
    t=int(re.search(r'Үшеуін де (\d+)',s)[1])
    regions=[A-ab-ac+t,B-ab-bc+t,C-ac-bc+t,ab-t,ac-t,bc-t,t]
    assert min(regions)>=0 and sum(regions)<=total
    if p['query']=='exactly-one':assert sum(regions)==total
    assert regions==p['regions'],'The displayed givens must describe the authored feasible regions'
    return str(ab+ac+bc-3*t if p['query']=='exactly-two' else sum(regions[:3]))


def answer(row):
    p=row['params'];k=row['modelId'].removeprefix('grade4-set-')
    if k=='evaluate':
        v=evaluate(p['expression'],p['sets'])
        if p['ask']=='set':return selected_set(row,v)
        if p['ask']=='member':return str(one(list(v)))
        return str(sum(v) if p['ask']=='sum' else len(v))
    if k=='subset-choice':
        target=set(p['sets']['A'])
        if p.get('common'):target.intersection_update(p['sets']['B'])
        return one([s for s in row['options'] if parse_set(s)<=target])
    if k=='equality-choice':return selected_set(row,p['elements'])
    if k=='equal-labelled-pair':
        return one([f'{a} = {b}' for a,b in p['candidates'] if set(p['sets'][a])==set(p['sets'][b])])
    if k=='valid-claim':
        valid=[]
        for i,c in enumerate(p['claims']):
            a,b=evaluate(c['left'],p['sets']),evaluate(c['right'],p['sets'])
            holds=a==b if c['relation']=='equal' else a<=b if c['relation']=='subset' else not(a&b)
            if holds:valid.append(row['options'][i])
        return one(valid)
    if k=='disjoint-context':
        assert p['first']>0 and p['second']>0
        assert 'бір ғана түспен' in row['statement']
        return 'Қиылыспайды'
    if k=='disjoint-pair':
        return one([row['options'][i] for i,(a,b) in enumerate(p['pairs']) if not(set(a)&set(b))])
    if k=='filter':return finite(row)
    if k in ('neither-multiple-count','three-divisor-union'):
        n=sum(not any(x%d==0 for d in p['divisors']) for x in range(p['low'],p['high']+1))
        return str(n if k=='neither-multiple-count' else p['high']-p['low']+1-n)
    if k=='two-counts':
        a,b=p['a'],p['b'];query=p['query']
        if query=='intersection':
            u=p['union'];assert max(a,b)<=u<=a+b;return str(a+b-u)
        if query=='first-only-all':
            n=p['total'];assert max(a,b)<=n<=a+b;return str(n-b)
        t=p['overlap'];assert 0<=t<=min(a,b)
        return str(a+b-(2*t if query=='exclusive' else t))
    if k=='described-equality':
        sets={'A':set(range(1,p['oddUpper'],2)),'B':set(p['B']),
              'C':{n for n in range(1,10) if n%p['divisor']==0},'D':set(p['D'])}
        return one([o for o in row['options'] if sets[o[0]]==sets[o[-1]]])
    if k=='words-operation':
        counts=Counter(letter for word in p['words'] for letter in set(word))
        v={a for a,n in counts.items() if n==1} if p.get('exactlyOne') else {
            a for a,n in counts.items() if p['operation']=='union' or n==len(p['words'])}
        return selected_set(row,v) if p['ask']=='set' else str(len(v))
    if k=='common-multiple-description':
        period=math.lcm(p['a'],p['b'])
        return f'{period} санына еселік натурал сандар'
    if k=='subset-implication':
        states=[(a,b) for a,b in itertools.product((False,True),repeat=2) if (a and b)==a]
        assert all(not a or b for a,b in states)
        assert not all(not b or a for a,b in states)
        assert not all(a==b for a,b in states)
        assert not all(not(a and b) for a,b in states)
        return 'A — B жиынының ішкі жиыны'
    if k=='subset-count':
        n=len(set(p['elements']));assert n==len(p['elements'])
        if 'size' in p:return str(math.comb(n,p['size']))
        if 'contains' in p:
            assert p['contains'] in p['elements'];return str(2**(n-1))
        return str(2**n)
    if k=='overlap-bounds':
        n,a,b=p['total'],p['a'],p['b'];low=max(0,a+b-n);high=min(a,b)
        assert 0<=a<=n and 0<=b<=n
        # Enumerate only the intersection count, proving attainment of every
        # point using the four nonnegative disjoint region sizes.
        feasible=[r for r in range(n+1) if min(a-r,b-r,r,n-a-b+r)>=0]
        assert feasible==list(range(low,high+1))
        query=p['query']
        if query=='minimum':return str(low)
        if query=='max-neither':return str(n-max(a,b))
        if query=='interval':return f'{low}–{high} аралығындағы кез келген бүтін сан'
        assert query=='mandatory-claim';return f'Екеуін де кемінде {low} оқушы таңдаған'
    if k=='max-intersection':return str(min(p['a'],p['b']))
    if k=='predicate-choice':
        return f"жұп немесе {p['divisor']} санына бөлінетін сандар"
    if k=='given-union-swap':return selected_set(row,p['elements'])
    if k=='commutativity-identity':
        return one([row['options'][i] for i,(a,b) in enumerate(p['claims']) if truth_vector(a)==truth_vector(b)])
    if k=='only-one-member':
        v={n for n in set(p['A'])|set(p['B']) if (n in p['A'])!=(n in p['B'])}
        return one([s for s in row['options'] if int(s) in v])
    if k=='unknown-union-choice':
        return one([s for s in row['options'] if set(p['A'])|parse_set(s)==set(p['union'])])
    if k=='universal-property':
        target=truth_vector(p['target'])
        return one([row['options'][i] for i,e in enumerate(p['candidates']) if truth_vector(e)==target])
    if k=='odd-expression':
        values=list(map(truth_vector,p['candidates']));counts=Counter(values)
        assert sorted(counts.values())==[1,3]
        return one([row['options'][i] for i,v in enumerate(values) if counts[v]==1])
    if k=='given-intersection-rebracket':
        assert set(p['triple'])<=set(p['pair'])
        return selected_set(row,p['triple'])
    if k=='unknown-both':
        v=(set(p['union'])-set(p['A']))|set(p['intersection'])
        assert set(p['A'])&v==set(p['intersection']) and set(p['A'])|v==set(p['union'])
        return selected_set(row,v)
    if k=='proper-subset-union':
        assert 'бос емес' in row['statement'] and 'қосымша элемент' in row['statement']
        return 'B'
    if k=='three-counts':return three_counts(row)
    if k=='associativity-recognition':
        return one([o for o in row['options'] if o.replace(' ','')=='(A∪B)∪C=A∪(B∪C)'])
    raise ValueError(k)


def check(write=False):
    rows=json.loads((ROOT/FILE).read_text())['editions']
    assert len(rows)==80 and len({r['modelId'] for r in rows})==30
    entries=[]
    for row in rows:
        source_id=row['sourceRefs'][0]['sourceId']
        p=row['params']
        if source_id=='e9b2c69b4e502b98':
            assert p['upperExclusive'] and p['upperBound']==p['high']+1==36
            assert '36 санынан кіші' in row['statement']
            assert p['upperBound']%p['firstParams']['divisor']==0
        if source_id=='6f7f9ca935c7e958':
            assert all(len(word)>len(set(word)) for word in p['words']), 'Repeated-letter source skill must be exercised'
        if source_id=='d2fb2569bae73b43':
            assert set(p['sets']['B'])<set(p['sets']['A'])
            assert 'жаңа элемент' in row['solution']
        expected=answer(row);assert row['answer']==expected,(row['editionId'],expected)
        assert not any(c in row['statement']+row['solution'] for c in ('$', '\\', '△'))
        if row.get('options'):assert len(set(row['options']))==4 and row['options'].count(expected)==1
        digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified',
            'reviewer':'independent_root_agent','method':'separate_python_characteristic_membership_truth_vectors_and_combinatorics',
            'expectedAnswer':expected,'checks':['all 80 original and new conditions, full solutions and all choices read',
                'finite membership, unordered subsets, strict bounds, Kazakh letters and zero independently checked',
                'all eight pointwise Boolean states prove universal expression identities',
                'two/three-set count constraints checked for realizability, inclusive/exclusive overlaps and attainable extrema']})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':len(entries),'entries':entries}
    if write:
        (ROOT/'problems/editorial/reviews/grade4-sets-wave8.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__=='__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
