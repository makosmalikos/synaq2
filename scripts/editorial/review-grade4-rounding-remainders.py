"""Separate enumerations/Decimal rounding after reading all 47 source/new pairs."""
import hashlib
import itertools
import json
import math
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]

def round_school(n,u):
    return int((Decimal(n)/Decimal(u)).quantize(Decimal(1),rounding=ROUND_HALF_UP))*u

def rounded_values(target,unit):
    return [n for n in range(max(1,target-unit),target+unit+1) if round_school(n,unit)==target]

def rounding(row):
    p=row['params'];kind=row['modelId'].removeprefix('grade4-')
    if kind=='round-to-place':return round_school(p['number'],p['unit'])
    if kind=='rounding-choice':
        found=[n for n in p['candidates'] if round_school(n,p['unit'])==p['target']]
        assert len(found)==1
        return found[0]
    if kind=='rounding-inverse-extreme':
        values=rounded_values(p['target'],p['unit'])
        return max(values) if p['maximum'] else min(values)
    if kind=='distinct-code-then-round':
        values=[int(''.join(map(str,v))) for v in itertools.permutations(p['digits']) if v[0]!=0]
        return round_school(max(values),p['unit'])
    if kind=='rounding-set-difference':
        return len(set(rounded_values(p['target'],p['coarse']))-set(rounded_values(p['target'],p['fine'])))
    if kind=='two-rounding-max':
        return max(n for n in rounded_values(p['firstTarget'],p['firstUnit']) if round_school(n,p['secondUnit'])==p['secondTarget'])
    if kind=='rounding-interval-width':
        values=rounded_values(p['target'],p['unit']);return max(values)-min(values)
    if kind=='digit-bound-rounding-count':
        return sum(len(str(n))==p['digits'] for n in rounded_values(p['target'],p['unit']))
    if kind=='rounded-digit-sum-count':
        return sum(sum(map(int,str(n)))==p['sum'] for n in rounded_values(p['target'],p['unit']))
    if kind=='rounded-distinct-maximum':
        return max(n for n in rounded_values(p['target'],p['unit']) if len(str(n))==p['digits'] and len(set(str(n)))==p['digits'])
    if kind=='rounded-neighbour-gap':return abs(round_school(p['first'],p['unit'])-round_school(p['second'],p['unit']))
    if kind=='rounded-multiple-count':return sum(n%p['divisor']==0 for n in rounded_values(p['target'],p['unit']))
    if kind=='two-rounding-choice':
        values=[n for n in p['candidates'] if round_school(n,p['firstUnit'])==p['firstTarget'] and round_school(n,p['secondUnit'])==p['secondTarget']]
        assert len(values)==1;return values[0]
    raise ValueError(kind)

def remainder(row):
    p=row['params'];kind=row['modelId'].removeprefix('grade4-')
    digit_range=lambda:range(10**(p['digits']-1),10**p['digits'])
    if kind=='double-neighbour-remainders':
        return next(n for n in range(1,p['first']*p['second']) if n%p['first']==p['first']-1 and n%p['second']==p['second']-1)
    if kind=='largest-digit-remainder':return max(n for n in digit_range() if n%p['divisor']==p['remainder'])
    if kind=='shifted-remainder':
        values={(p['divisor']*q+p['remainder']+p['add'])%p['divisor'] for q in range(20)}
        assert len(values)==1;return values.pop()
    if kind=='reversed-multiply-divide':return p['mistakenQuotient']*p['factor']**2
    if kind=='complete-bundle-top-up':return next(n for n in range(p['size']) if (p['total']+n)%p['size']==0)
    if kind=='incomplete-quotient-length':return len(str(p['dividend']//p['divisor']))
    if kind=='quotient-remainder-total':return sum(divmod(p['dividend'],p['divisor']))
    if kind=='two-division-reconstruction':
        values=[n for n in range(10*p['quotient'],10*p['quotient']+10) if n%100==p['lastTwo']]
        assert len(values)==1;return values[0]
    if kind=='remainder-multiple-of-quotient':
        return max(p['divisor']*q+r for q in range(p['divisor']) for r in range(p['divisor']) if r==p['multiplier']*q and q+r>0)
    if kind=='bounded-equal-quotient-remainder':
        return min(n for n in range(p['lower']+1,p['upper']+1) if len(str(n))==4 and n//p['divisor']==n%p['divisor'])
    if kind=='fixed-thousands-and-remainder':
        return max(n for n in range(p['thousandsQuotient']*1000,(p['thousandsQuotient']+1)*1000) if n%100==p['remainder'])
    if kind=='digit-interval-remainder-count':return sum(n%p['divisor']==p['remainder'] for n in digit_range())
    if kind=='shared-decimal-remainder-minimum':return next(n for n in range(1000,10000) if all(n%d==p['remainder'] for d in [10,100,1000]))
    if kind=='largest-quotient-remainder-sum':
        return max(n for n in range(1,p['total']*p['divisor']+p['divisor']) if n%p['divisor']>0 and sum(divmod(n,p['divisor']))==p['total'])
    if kind=='largest-equal-quotient-remainder':return max(n for n in range(1,p['divisor']**2) if n//p['divisor']==n%p['divisor'])
    if kind=='reconstruct-then-new-remainder':return (p['firstDivisor']*p['firstQuotient']+p['firstRemainder'])%p['nextDivisor']
    if kind=='remainder-under-factor-divisor':
        assert p['firstDivisor']%p['nextDivisor']==0
        values={(p['firstDivisor']*q+p['remainder'])%p['nextDivisor'] for q in range(20)}
        assert len(values)==1;return values.pop()
    if kind=='largest-legal-remainder':return max(range(p['divisor']))
    if kind=='count-digit-multiples':return sum(n%p['divisor']==0 for n in digit_range())
    if kind=='smallest-digit-remainder':return next(n for n in digit_range() if n%p['divisor']==p['remainder'])
    if kind=='divisor-linked-to-quotient':
        values=[d for d in range(1,math.isqrt(p['dividend'])+1) if p['dividend']%d==0 and p['dividend']//d==p['ratio']*d]
        assert len(values)==1;return values[0]
    if kind=='smallest-two-digit-divisor':return next(d for d in range(10,100) if len(str(d*p['quotient']))==3)
    if kind=='hidden-division-digit':
        values=[]
        for d in range(10):
            text=p['template'].replace('?',str(d))
            if text[0]=='0':continue
            n=int(text)*p['scale']
            if n%p['divisor']==0:values.append((d,n//p['divisor']))
        assert len(values)==1
        return values[0][0 if p['target']=='digit' else 1]
    raise ValueError(kind)

def check(kind,write=False):
    name,count,oracle=('grade4-rounding-wave6',23,rounding) if kind=='rounding' else ('grade4-remainders-wave5',24,remainder)
    file=f'problems/editorial/batches/{name}.json'
    rows=json.loads((ROOT/file).read_text())['editions'];assert len(rows)==count
    entries=[]
    for row in rows:
        expected=str(oracle(row));assert row['answer']==expected,(row['editionId'],expected)
        if kind=='rounding':assert 'Дәл ортасында тұрған сан жоғары жаққа дөңгелектеледі.' in row['statement']
        if row.get('options'):assert len(row['options'])==len(set(row['options'])) and row['options'].count(expected)==1
        ref,=row['sourceRefs'];source=next(s for s in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if s['id']==ref['sourceId'])
        assert source['checked'] is True and row['statement']!=source['statement']
        digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','reviewer':'independent_root_agent',
            'method':'independent_decimal_or_finite_constraint_enumeration','expectedAnswer':expected,
            'checks':['complete source and new condition/solution read separately',
                      'requested min/max/count/difference distinguished explicitly',
                      'independent Python arithmetic with boundaries and uniqueness checks']})
    result={'schemaVersion':1,'date':'2026-10-23','batchFile':file,'reviewed':count,'entries':entries}
    if write:(ROOT/f'problems/editorial/reviews/{name}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return result

if __name__=='__main__':
    result=check(sys.argv[1],'--write-review' in sys.argv)
    print(json.dumps({'reviewed':result['reviewed'],'result':'passed'}))
