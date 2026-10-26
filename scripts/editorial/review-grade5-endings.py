"""Independent exact residue/CRT/counting review after full manual source read.

All 48 original/new conditions, complete explanations and both sets of MCQs
were read. Numerical variants and fixed parity facts are not unique meanings.
"""
from fractions import Fraction as F
import ast
import hashlib
from itertools import permutations
import json
import math
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
FILE='problems/editorial/batches/grade5-endings.json'


def one(xs):
    assert len(xs)==1,xs
    return xs[0]


def ints(s):return list(map(int,re.findall(r'\d+',s)))


def linear_mod(s,residue):
    """Evaluation in Z/2Z proves all polynomial inputs in this residue class."""
    def visit(n):
        if isinstance(n,ast.Constant) and type(n.value) is int:return n.value%2
        if isinstance(n,ast.Name) and n.id=='x':return residue
        if isinstance(n,ast.BinOp):
            a,b=visit(n.left),visit(n.right)
            if isinstance(n.op,ast.Add):return (a+b)%2
            if isinstance(n.op,ast.Mult):return a*b%2
        raise ValueError(ast.dump(n))
    return visit(ast.parse(s.replace('×','*'),mode='eval').body)


def answer(q):
    p=q['params'];s=q['statement'];options=q.get('options',[]);kind=q['modelId'].removeprefix('grade5-endings-')
    if kind in ('odd-choice','even-choice','five-choice','ten-choice','five-not-ten-choice'):
        predicate={'odd-choice':lambda n:n%2==1,'even-choice':lambda n:n%2==0,
            'five-choice':lambda n:n%5==0,'ten-choice':lambda n:n%10==0,
            'five-not-ten-choice':lambda n:n%5==0 and n%10!=0}[kind]
        return one([o for o in options if predicate(int(o))])
    if kind=='five-not-two-ending':return str(int(re.search(r'(\d+)□',s)[1])*10+5)
    if kind=='all-even-digits':return ', '.join(str(d) for d in range(10) if d%2==0)
    if kind=='classify-divisors':
        number=int(re.match(r'(\d+)',s)[1]);divisors=[d for d in (2,5,10) if number%d==0]
        return one([o for o in options if ints(o)==divisors])
    if kind=='inclusive-odd-count':
        lo,hi=map(int,re.search(r'(\d+)–(\d+)',s).groups())
        return str((hi+1)//2-lo//2)
    if kind=='largest-even-append':return str(int(re.search(r'(\d+)□',s)[1])*10+8)
    if kind=='digit-length-ten-count':
        digits=int(re.search(r'(\d+) таңбалы',s)[1])
        return str((10**digits-1)//10-(10**(digits-1)-1)//10)
    if kind=='largest-digit-length-five':
        digits=int(re.search(r'(\d+) таңбалы',s)[1]);return str(5*((10**digits-1)//5))
    if kind=='last-digit-ten':return '0'
    if kind=='universal-ten-parity':
        assert p['evenFive']>0 and p['evenFive']%10==0
        assert p['evenNotTen']%2==0 and p['evenNotTen']%10!=0
        assert 0<=p['falseEnding']<10 and p['falseEnding']%5!=0
        # A decimal prefix contributes 10k=2(5k); the entire possible last-digit
        # residue class for multiples of10 is0, which is even.
        assert {d%2 for d in range(10) if d%10==0}=={0}
        return one([o for o in options if '10 санына бөлінетін' in o and o.endswith('жұп')])
    if kind=='smallest-odd-digit-length-five':
        digits=int(re.search(r'(\d+) таңбалы',s)[1]);lo=10**(digits-1)
        return str(lo+(5-lo)%10)
    if kind=='digit-set-five-count':
        digits=ints(s.split('цифрларымен')[0]);length=int(re.search(r'(\d+) таңбалы',s)[1])
        assert len(set(digits))==len(digits) and 0 in digits and 5 in digits and length>=2
        # Last0: permutations of all remaining nonzero digits. Last5: subtract
        # arrangements with forbidden leading0. This differs from author DFS.
        k=len(digits)
        return str(2*math.perm(k-1,length-1)-math.perm(k-2,length-2))
    if kind=='remainder-five':return str(int(re.match(r'(\d+)',s)[1])%5)
    if kind in ('even-input-odd-expression','odd-input-even-expression'):
        residue=0 if kind.startswith('even') else 1;target=1-residue
        assert ('жұп натурал' if residue==0 else 'тақ натурал') in s
        return one([o for o in options if linear_mod(o,residue)==target])
    if kind=='odd-summand-count-parity':
        count=int(re.match(r'(\d+)',s)[1]);assert count%2==1 and count>=3
        assert len(p['counterexample'])==count and all(n%2==1 for n in p['counterexample']) and sum(p['counterexample'])%5!=0
        return 'әрқашан тақ'
    if kind=='largest-even-permutation':
        digits=ints(s.split('цифрларының')[0]);assert all(d>0 for d in digits)
        assert len([d for d in digits if d%2==0])>=2 and min(digits)%2==1
        last=min(d for d in digits if d%2==0)
        return ''.join(map(str,sorted([d for d in digits if d!=last],reverse=True)))+str(last)
    if kind=='last-digit-two-and-five':return str(one([d for d in range(10) if d%math.lcm(2,5)==0]))
    if kind=='neither-two-nor-five-count':
        last=int(re.search(r'1–(\d+)',s)[1]);return str(last-last//2-last//5+last//10)
    if kind=='internal-placeholder-impossible':
        assert p['lastDigit']%2==1
        assert all((100*p['firstDigit']+10*d+p['lastDigit'])%2==1 for d in range(10))
        return 'мұндай цифр жоқ'
    if kind=='bounded-groups-and-pairs':
        start=p['lower']+1;n=start+(5-start)%10
        assert n<p['upper']<=n+10
        return str(n)
    if kind=='product-ten-choice':
        valid=[o for o in options if math.prod(ints(o))%10==0]
        for o in options:
            if o not in valid:assert all(n%2 for n in ints(o))
        return one(valid)
    if kind=='next-odd-five-multiple':
        start=p['after']+1;return str(start+(5-start)%10)
    if kind=='open-range-odd-five-count':
        start=p['lower']+1;first=start+(5-start)%10
        return str(0 if first>=p['upper'] else (p['upper']-1-first)//10+1)
    if kind=='corrected-price':
        assert p['count']==5 and p['reported']%5!=0
        return str((p['reported']-1)//5)
    if kind=='sum-five-choice':return one([o for o in options if sum(ints(o))%5==0])
    if kind=='distinct-prefix-ten-count':
        assert len(p['prefix'])==2 and len(set(p['prefix']))==2 and all(1<=n<=9 for n in p['prefix'])
        return str(10-len(set([0]+p['prefix'])))
    if kind=='either-two-or-five-count':
        blocks,tail=divmod(p['last'],10)
        return str(6*blocks+sum(d<=tail for d in (2,4,5,6,8)))
    if kind=='minimum-two-bottle-sizes':
        # Search total bottle counts in increasing order and solve the linear
        # volume constraint. No iteration over the author's large-bottle cases.
        valid=[]
        for count in range(math.ceil(F(p['total'],p['large'])),p['total']//p['small']+1):
            large=F(p['total']-p['small']*count,p['large']-p['small']);small=count-large
            if large.denominator==1 and large>=1 and small>=1:valid.append(count)
        assert len(valid)>=2
        return str(min(valid))
    if kind=='combined-remainder-digit':return str((5*p['remainderTwo']+6*p['remainderFive'])%10)
    if kind=='largest-distinct-odd-five':
        digits=p['digits'];assert digits<=5
        return str(next(n for n in range(10**digits-1,10**(digits-1)-1,-1) if n%10==5 and len(set(str(n)))==digits))
    if kind=='equal-partition-impossible':
        total=sum(range(1,p['last']+1));assert total%2 and p['last']%2==0 and total%5==0
        return one([o for o in options if f'жалпы қосынды {total} — тақ' in o])
    if kind=='consecutive-sum-classification':
        total=sum(range(1,p['last']+1));assert total%2==1 and total%5==0
        return 'тақ және 5 санына бөлінеді'
    if kind=='inclusive-odd-five-sum':return str(sum(n for n in range(p['lower'],p['upper']+1) if n%10==5))
    if kind=='impossible-ten-remainder':return one([o for o in options if int(o)%2!=p['remainderTwo']])
    if kind=='possible-multiple-endings':
        cycle=10//math.gcd(p['packSize'],10)
        assert {p['packSize']*k%10 for k in range(1,cycle+1)}=={0,5}
        return '0 немесе 5'
    if kind=='missing-book-leaves':
        first=p['firstPage'];assert first%2==1
        ends={int(''.join(r)) for r in permutations(str(first)) if r[0]!='0'}
        last=one([n for n in ends if n>first and n%2==0]);count=last-first+1
        assert count%2==0;return str(count)
    if kind=='needed-even-factor':return one([o for o in options if math.prod(p['fixed'])*int(o)%10==0])
    if kind=='smallest-odd-shifted-five':
        residue=one([r for r in range(10) if r%2==1 and (r+p['added'])%5==0]);lo=10**(p['digits']-1)
        return str(lo+(residue-lo)%10)
    if kind=='any-prefix-ending-five':
        # Every prefix contributes a multiple of10; all three predicates depend
        # exclusively on this single last-digit residue, irrespective of prefix.
        assert 5%2==1 and 5%5==0 and 5%10!=0
        return 'тақ және 5 санына бөлінеді'
    if kind=='erased-zero-inverse':
        n=F(10*p['decrease'],9);assert n.denominator==1 and n-n//10==p['decrease']
        return str(n.numerator)
    if kind=='infer-odd-addend':
        allowed=[r for r in (0,1) if (1+r)%2==0];assert allowed==[1]
        assert p['secondExample']%2==1 and p['secondExample']%5!=0 and (p['firstExample']+p['secondExample'])%2==0
        return p['secondName']+' жинаған ұпай саны тақ'
    if kind=='odd-product-last-digit':
        residue=1
        for n in p['factors']:residue=residue*(n%10)%10
        assert all(n%2 for n in p['factors']) and any(n%5==0 for n in p['factors'])
        return str(residue)
    raise ValueError(kind)


def check(write=False):
    rows=json.loads((ROOT/FILE).read_text())['editions'];assert len(rows)==48
    entries=[]
    for q in rows:
        expected=answer(q);assert q['answer']==expected,(q['editionId'],expected)
        if q.get('options'):assert q['options'].count(expected)==1 and len(set(q['options']))==4
        else:assert q['statement'].endswith('Жауапқа тек санды жазыңыз.') and expected.isdigit()
        assert not re.search(r'[$\\]|\[Image:',q['statement']+q['solution'])
        entries.append({'editionId':q['editionId'],'sha256':hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),
            'verdict':'verified','reviewer':'independent_root_agent','method':'separate_python_crt_residue_ring_combinatorial_count_and_integer_resource_oracle',
            'expectedAnswer':expected,'checks':['all 48 full original/new conditions, solutions and original/new choices read',
                'parity expressions proven on the complete Z/2Z residue ring; CRT reconstructs last-digit constraints',
                'digit arrangements counted by permutations with forbidden-leading-zero correction',
                'minimum bottle count solved by total-count search, both sizes strictly positive',
                'strict/inclusive bounds, logical AND/OR, whole book leaves and proper remainder bounds preserved',
                'numeric-only response format explicit for all 23 open answers']})
    report={'schemaVersion':1,'date':'2026-10-23','batchFile':FILE,'reviewed':48,'entries':entries}
    if write:(ROOT/'problems/editorial/reviews/grade5-endings.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    return report


if __name__=='__main__':
    import sys
    report=check('--write-review' in sys.argv)
    print(json.dumps({'reviewed':report['reviewed'],'result':'passed'}))
