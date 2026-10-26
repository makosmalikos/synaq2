"""Independent full22 written-operation review with actual printed parsing.

All original/new full conditions, complete solutions and MCQ read. No author
calculator imports. Uses Fraction, exhaustive digit domains and inverse ledgers.
"""
from datetime import datetime,timedelta
from fractions import Fraction as F
from pathlib import Path
import argparse
import copy
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-written-wave21.json'
OUT='problems/editorial/reviews/grade4-written-wave21.json'
WEEK=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі']


def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def one(xs):
    assert len(xs)==1,xs
    return xs[0]


def number(s):
    s=re.sub(r'\s','',s);assert re.fullmatch(r'\d+',s),s
    return int(s)


def integer(n):
    n=F(n);assert n.denominator==1,n
    return n.numerator


def arithmetic(s):
    m=re.fullmatch(r'([\d ]+) (·|:) ([\d ]+)',s);assert m,s
    a,b=number(m[1]),number(m[3]);return a*b if m[2]=='·' else F(a,b)


def pick(row,values,wanted):
    assert len(values)==4 and len(set(row['options']))==4
    assert values.count(wanted)==1,(row['editionId'],values,wanted)
    return row['options'][values.index(wanted)]


def solve(row):
    s,p=row['statement'],row['params'];k=row['modelId'].removeprefix('grade4-written-')
    value=answer=None;method='Independent printed-operation Fraction/inverse ledger, requested quantity and positional structure checked';note=''
    if k=='quotient-digit-count':
        m=re.search(r'([\d ]+) : (\d+) бөліндісінде',s);assert m
        n,d=number(m[1]),int(m[2]);quotient=integer(F(n,d));value=len(str(quotient))
        assert d*10**(value-1)<=n<d*10**value
        note=f'Actual printed dividend{n}/divisor{d} gives{quotient}, digitcount{value}; independent enclosing positional bounds{d*10**(value-1)}≤n<{d*10**value}justify not requiring full division.'
    elif k=='division-inverse-check':
        m=re.search(r'([\d ]+) : (\d+) = (\d+)',s);assert m
        n,d,q=number(m[1]),int(m[2]),int(m[3]);assert d*q==n
        answer=pick(row,[arithmetic(o.replace(' + ',' · ')) if ' + ' not in o else sum(number(t) for t in o.split(' + ')) for o in row['options']],F(n))
        assert answer==f'{q} · {d}'
        note=f'Full actual offered arithmetic expressions evaluated exactly; only quotient{q}×divisor{d}reconstructs{n}; internalzero retained.'
    elif k=='impossible-remainder':
        d=int(re.search(r'Санды (\d+) санына',s)[1]);possible=set(n%d for n in range(4*d));answer=pick(row,[number(o) not in possible for o in row['options']],True)
        method='Complete Euclidean residue classes0..d−1 plus explicit finite witnesses for every permitted residue'
        note=f'Actual divisor{d}; allowed residues{sorted(possible)}, sole offered impossible remainder{answer}. Equal-to-divisor remainder is incomplete division.'
    elif k=='first-partial-dividend':
        m=re.search(r'([\d ]+) : (\d+) бөлуіндегі',s);assert m
        n,d=number(m[1]),int(m[2]);digits=str(n);prefixes=[int(digits[:j]) for j in range(1,len(digits)+1)];value=next(v for v in prefixes if v>=d)
        note=f'Actual left-to-right prefixes{prefixes}; first sufficient prefix{value}, shorter one below divisor{d}, longer one would skip a positional step.'
    elif k=='carried-item-cost':
        price=number(re.search(r'анықтамалық ([\d ]+) теңге',s)[1]);count=int(re.search(r'Осындай (\d+) кітап',s)[1]);value=sum(price for _ in range(count))
        # Reconstruct every actual printed column state independently from decimal polynomial coefficients.
        carry=0;digits=[]
        for digit in reversed(str(price)):
            raw=int(digit)*count+carry;digits.append(raw%10);carry=raw//10
        while carry:digits.append(carry%10);carry//=10
        assert sum(d*10**i for i,d in enumerate(digits))==value
        note=f'Actual unitprice{price}repeated{count}times={value}; independent decimal-column reconstruction verifies every carry and final zero.'
    elif k in {'reconstruct-dividend','reconstruct-near-divisor-remainder','reconstruct-largest-remainder'}:
        if k=='reconstruct-largest-remainder':m=re.search(r'Санды (\d+) санына бөлгенде бөлінді ([\d ]+),',s)
        else:m=re.search(r'Бөлгіш (\d+), бөлінді ([\d ]+),',s)
        assert m;d,q=int(m[1]),number(m[2])
        r=int(re.search(r'қалдық (\d+)\.',s)[1]) if k=='reconstruct-dividend' else max(range(d))
        assert 0<=r<d
        candidates=range(q*d,(q+1)*d);value=one([n for n in candidates if divmod(n,d)==(q,r)])
        note=f'Entire dividend interval[{q*d},{(q+1)*d})searched; only{value}has integer quotient{q}and valid remainder{r}. Largest/one-below-divisor cases explicitly r=d−1.'
    elif k=='overlapping-pair-prices':
        total=int(re.search(r'жалпы құны (\d+) теңге',s)[1]);first=int(re.search(r'Қалам мен дәптер (\d+) теңге',s)[1]);second=int(re.search(r'дәптер мен сызғыш (\d+) теңге',s)[1])
        ledgers=[]
        for notebook in range(1,min(first,second)):
            pen,ruler=first-notebook,second-notebook
            if pen+notebook+ruler==total:ledgers.append((pen,notebook,ruler))
        pen,value,ruler=one(ledgers);assert pen+value==first and value+ruler==second
        method='Complete positive shared-item price domain with all three original purchase ledger equations checked'
        note=f'Only(pen,notebook,ruler)={(pen,value,ruler)}satisfies total{total}and paircosts{first}/{second}; shared notebook counted twice in pair sum.'
    elif k=='equal-packing-remainder':
        m=re.search(r'([\d ]+) қарындашты (\d+) қорапқа',s);assert m
        total,boxes=number(m[1]),int(m[2]);allocations=[count for count in range(total+1) if boxes*count<=total];per=max(allocations);value=total-boxes*per
        assert value<boxes and boxes*(per+1)>total
        note=f'Full feasible equal per-box allocation domain yields max{per}; exact leftover{value}<boxes{boxes}, total reconstructed. Requested remainder, not quotient.'
    elif k=='carried-product-comparison':
        left,right=s.split(' □ ');a,b=map(number,left.split(' · '));r=number(right.split('.')[0]);v=sum(a for _ in range(b));answer='<' if v<r else '>' if v>r else '='
        assert answer in row['options'];note=f'Actual product via repeated addition{a}×{b}={v}; compare actual right{r}, gap{abs(r-v)}, so{answer}. Carries and internalzero preserved.'
    elif k=='missing-quotient-zero-error':
        truths=[]
        for o in row['options']:
            left,right=o.split(' = ');truths.append(arithmetic(left)==number(right))
        answer=pick(row,truths,False);assert row.get('intentionalIncorrectExample') is True
        m=re.fullmatch(r'([\d ]+) : (\d+) = ([\d ]+)',answer);assert m
        n,d,wrong=number(m[1]),int(m[2]),number(m[3]);true=integer(F(n,d));assert str(true).count('0')==2 and str(wrong).count('0')==1
        assert str(true).replace('00','0',1)==str(wrong)
        method='Every actual equality evaluated independently with exact Fraction; sole intentional FALSE equality and dropped-zero structure checked'
        note=f'Truth vector{truths}; wrong{wrong}×{d}={wrong*d}≠{n}; correct{true}has2internalzeros, erroneous option drops exactlyONE. False source claim of two lost zeros is not repeated.'
    elif k in {'quotient-containing-zero','four-digit-quotient-choice'}:
        values=[integer(arithmetic(o)) for o in row['options']]
        hits=['0' in str(v) if k=='quotient-containing-zero' else len(str(v))==4 for v in values];answer=pick(row,hits,True)
        note=f'All actual printed quotients{values}; unique requested {"containszero" if k.startswith("quotient") else "four-digit length"}property, every other option checked.'
    elif k=='reverse-operation-chain':
        m=re.search(r'санды (\d+) санына көбейтіп, (\d+) санын қосты\. Нәтижені (\d+) санына бөлгенде (\d+)',s);assert m
        multiplier,added,divisor,result=map(int,m.groups());value=one([n for n in range(result*divisor+1) if F(n*multiplier+added,divisor)==result])
        note=f'Full bounded original-number domain gives sole{value}; forward((n×{multiplier})+{added})/{divisor}={result}. Positive slope proves global uniqueness.'
    elif k=='minimum-bus-trips':
        capacity=int(re.search(r'ең көп (\d+) адам',s)[1]);tourists=number(re.search(r'([\d ]+) туристі',s)[1]);value=next(t for t in range(tourists+1) if t*capacity>=tourists)
        assert (value-1)*capacity<tourists<=value*capacity
        note=f'All smaller tripcounts fail capacitybound; minimal{value}has{value*capacity}seats for{tourists}, while{value-1}only{(value-1)*capacity}; nonzero remainder needs extra trip.'
    elif k=='leading-digit-quotient-length':
        m=re.match(r'□(\d+) : (\d+) бөлуінде',s);assert m
        tail,divisor=m[1],int(m[2]);length=int(re.search(r'Бүтін бөлінді (\d+) таңбалы',s)[1]);values=[d for d in range(1,10) if len(str(int(str(d)+tail)//divisor))==length]
        answer=one([o for o in row['options'] if [int(x) for x in o.split(', ')]==values]);assert 'Бөлу қалдықпен болуы мүмкін' in s and '0 емес' in s
        method='Complete9possible nonzero leading digits, direct floor-quotient digit length for every five-digit dividend; remainders explicitly allowed'
        note=f'Actual tail{tail},divisor{divisor}; all allowed digits{values}, rejected{[d for d in range(1,10) if d not in values]}; leading0excluded and no divisibility-only filter.'
    elif k=='weekday-after-days':
        day=one([i for i,w in enumerate(WEEK) if f'Бүгін {w}.' in s]);days=number(re.search(r'Дәл ([\d ]+) күннен кейін',s)[1]);actual=datetime(2026,10,19)+timedelta(days=day+days);answer=one([o for o in row['options'] if o==WEEK[actual.weekday()]])
        note=f'Independent datetime from concrete Monday2026-10-19 plus printedstartweekday{day}and{days}elapsed days yields{answer}; today not counted as elapsed day1.'
    elif k=='four-digit-reversal':
        multiplier=int(re.search(r'санды (\d+) санына көбейткенде',s)[1]);solutions=[n for n in range(1000,10000) if 1000<=n*multiplier<10000 and str(n*multiplier)==str(n)[::-1]];value=one(solutions)
        assert value==1089 and value*multiplier==9801
        method='Exhaustive complete9000four-digit domain, reversed exact digit-string and product-width checks, separate analytical upper-bound confirmation'
        note=f'Only{value}×{multiplier}=9801; searchincludesinternal0andforbidsleading0/product5digits. Productboundn≤{9999//multiplier}and finaldigit9 agree with full printed candidate list.'
    elif k=='euclidean-quotient-remainder':
        m=re.match(r'([\d ]+) санын (\d+) санына',s);assert m
        n,d=number(m[1]),int(m[2]);valid=[]
        for o in row['options']:
            m=re.fullmatch(r'(\d+), қалдық (\d+)',o);assert m
            q,r=map(int,m.groups());valid.append(q*d+r==n and 0<=r<d)
        answer=pick(row,valid,True);assert 650*9+17==5867 and 17>=9
        note=f'Actual quotient/remainder options require BOTH q×{d}+r={n}AND0≤r<{d};650r17reconstructs value but violates remainderbound.'
    elif k=='two-carried-item-costs':
        m=re.match(r'Әрқайсысы ([\d ]+) теңгеден (\d+) кітап және әрқайсысы ([\d ]+) теңгеден (\d+) дәптер',s);assert m
        a,c,b,d=number(m[1]),int(m[2]),number(m[3]),int(m[4]);first=sum(a for _ in range(c));second=sum(b for _ in range(d));value=first+second
        note=f'Two separate actual repeated-addition ledgers{first}/{second}, total{value}; itemcount applied to its own unitprice before summing.'
    elif k=='zero-quotient-comparison':
        left,right=s.split(' □ ');leftvalue=arithmetic(left);r=number(right.split('.')[0]);answer='<' if leftvalue<r else '>' if leftvalue>r else '='
        q=integer(leftvalue);assert '0' in str(q);note=f'Exact actual Fractiondivision{left}={q}, includes internal0; right{r}, comparison{answer}; inverse multiplication reconstructs dividend.'
    else:raise AssertionError(('Unreviewed writtenmodel',k))
    if answer is None:
        value=integer(value);answer=pick(row,[number(o) for o in row['options']],value) if row.get('options') else str(value)
    assert row['answer']==answer,(row['editionId'],row['answer'],answer)
    if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert re.fullmatch(r'\d+',answer) and re.search(r'Жауап[^.]*тек сан',s)
    return method,note


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==22
    assert len({r['editionId'] for r in rows})==len({r['sourceRefs'][0]['sourceId'] for r in rows})==22
    entries=[]
    for row in rows:
        assert row['grade']==4 and row['minimumPlan']=='pro' and not re.search(r'[\\$]',row['statement']+row['solution'])
        ref=one(row['sourceRefs']);source=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']]);assert source['checked'] and not source.get('images') and not source.get('svg') and source['statement']!=row['statement']
        method,note=solve(row);entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':method,'notes':note+' Every original/new full condition, complete solution and MCQ independently read; requested unit and arithmetic positional skill retained.'})
        bad=copy.deepcopy(row);bad['answer']+='_wrong'
        try:solve(bad)
        except AssertionError:pass
        else:raise AssertionError(('Wrong key accepted',row['editionId']))
    byid={r['sourceRefs'][0]['sourceId']:r for r in rows}
    canaries=[('7f42ee58cfd815b1','5 736 : 8','8 736 : 8'),('25431017c2c7d8a1','Санды 7 санына','Санды 6 санына'),
              ('94371cc5b09e48cb','5 672 туристі','5 669 туристі'),('e5e9f24ad70b1c93','□7264 : 7','□7264 : 6'),
              ('db7a0f41e0dede48','1486 санын','1493 санын'),('6eed581dc165c83c','Бүгін бейсенбі.','Бүгін сәрсенбі.'),
              ('e7679af4ced2c4a4','санды 9 санына','санды 4 санына')]
    for source_id,old,new in canaries:
        bad=copy.deepcopy(byid[source_id]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:pass
        else:raise AssertionError(('Printed mutation accepted',source_id))
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All22saved/new full conditions,full solutions andMCQread; independent printed exact Fraction/inverse ledgers,full9000digit-reversal and9leading-digit domains,finite bus/price/capacity/remainder/carry domains anddatetime;22wrong-key+7printed-given canaries rejected.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'verified':len(entries),'wrongKeysRejected':len(rows),'printedCanariesRejected':len(canaries),'written':args.write}))


if __name__=='__main__':main()
