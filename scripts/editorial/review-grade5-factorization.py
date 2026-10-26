"""Independent complete review of47 saved source-specific factorization editions.
All47 full archived conditions, solutions and choices plus all47 new complete
conditions, solutions and MCQs read manually before this review. No author model
imported; sieve/divisor domains and actual printed native products are separate.
"""
from collections import Counter
import copy
from fractions import Fraction as F
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/grade5-factorization.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
LIMIT=40000;sieve=bytearray(b'\1')*(LIMIT+1);sieve[:2]=b'\0\0'
for q in range(2,math.isqrt(LIMIT)+1):
    if sieve[q]:sieve[q*q::q]=b'\0'*len(range(q*q,LIMIT+1,q))
PRIMES=[n for n in range(2,LIMIT+1) if sieve[n]]
def prime(n):assert 0<=n<=LIMIT;return bool(sieve[n])
def one(a):a=list(a);assert len(a)==1,a;return a[0]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def divisors(n):
    ds=set()
    for q in range(1,math.isqrt(n)+1):
        if n%q==0:ds.update([q,n//q])
    return sorted(ds)
def valuation(n,p):
    c=0
    while n%p==0:c+=1;n//=p
    return c

def factor(n):
    assert 1<=n<=LIMIT
    return Counter({p:valuation(n,p) for p in divisors(n) if p>1 and prime(p)})
def expanded(n):return sorted(Counter(factor(n)).elements())
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹'
def product_text(text):
    parts=text.strip().split(' × ');terms=[]
    for part in parts:
        m=re.fullmatch(r'(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)',part);assert m,part
        terms.append((int(m[1]),int(m[2].translate(str.maketrans(SUP,'0123456789'))) if m[2] else 1))
    return terms,math.prod(b**e for b,e in terms)
def powered(terms):return math.prod(b**e for b,e in terms)
def tuple_text(s,unit=''):
    parts=s.split('; ');out=[]
    for part in parts:
        m=re.fullmatch(r'(\d+)'+re.escape(unit),part);assert m,part;out.append(int(m[1]))
    return out

def cube(n):
    lo,hi=0,n+1
    while lo+1<hi:
        mid=(lo+hi)//2
        if mid**3<=n:lo=mid
        else:hi=mid
    return lo**3==n

def choose(r,fn):return one(o for o in r['options'] if fn(o))
def solve(r):
    p=r['params'];k=r['modelId'].removeprefix('grade5-factorization-');s=r['statement']
    if k in ['largest-prime-small','largest-prime-odd']:assert str(p['number']) in s;return str(max(factor(p['number'])))
    if k in ['least-prime-basic','least-prime-long-search']:assert str(p['number']) in s;return str(min(factor(p['number'])))
    if k in ['factor-list-choice','power-factor-choice']:
        assert str(p['number']) in s
        return choose(r,lambda o:(lambda t,val:val==p['number'] and all(prime(b) for b,e in t))(*product_text(o)))
    if k=='only-prime-factors-choice':return choose(r,lambda o:all(prime(b) for b,e in product_text(o)[0]))
    if k=='cancel-listed-factors':
        a,b=re.search(r'a = (.+) және b = (.+) түрінде',s).groups();return str(product_text(a)[1]//product_text(b)[1])
    if k=='reconstruct-listed-primes':return str(math.prod(int(n) for n in re.search(r'ретімен (.+) деп',s)[1].split(', ')))
    if k=='factor-order-uniqueness':
        a,b=re.search(r'Меруерт \d+ = (.+) деп, Арсен \d+ = (.+) деп жазды',s).groups();a,av=product_text(a);b,bv=product_text(b);assert av==bv and Counter(a)==Counter(b) and all(prime(x) for x,e in a)
        return 'Екеуі де дұрыс: жай көбейткіштердің реті ғана өзгеше'
    if k=='reconstruct-powered-primes':return str(product_text(re.search(r'жіктеуі (.+) түрінде',s)[1])[1])
    if k=='prime-square-side':n=int(re.search(r'ауданы (\d+)',s)[1]);side=math.isqrt(n);assert side*side==n and prime(side);return str(side)
    if k=='smallest-odd-prime-product':count=int(re.search(r'ең кіші (\d+) тақ',s)[1]);return str(math.prod([p for p in PRIMES if p%2][:count]))
    if k=='prime-box-dimensions':return choose(r,lambda o:(lambda ns:all(prime(n) for n in ns) and math.prod(ns)==p['volume'])(tuple_text(o,' дм')))
    if k=='count-distinct-primes':return str(len(factor(p['number'])))
    if k=='sum-distinct-primes':return str(sum(factor(p['number'])))
    if k=='restricted-prime-support':return choose(r,lambda o:set(factor(int(o)))==set(p['allowed']))
    if k=='compare-prime-products':
        a,b=re.search(r'^(.+) және (.+) көбейтінділерін',s).groups();a,b=product_text(a)[1],product_text(b)[1]
        def good(o):
            m=re.fullmatch(r'(.+) ([<>=]) (.+)',o)
            if not m:return False
            x,y=product_text(m[1])[1],product_text(m[3])[1];assert (x,y)==(a,b)
            return {'<':a<b,'>':a>b,'=':a==b}[m[2]]
        return choose(r,good)
    if k=='ordered-prime-array':
        pairs=[(d,p['total']//d) for d in divisors(p['total']) if d*d<p['total'] and prime(d) and prime(p['total']//d)];return str(one(pairs)[1])
    if k=='cancel-powered-factors':a,b=re.search(r'a = (.+), b = (.+)\. a : b',s).groups();answer=F(product_text(a)[1],product_text(b)[1]);assert answer.denominator==1;return str(answer.numerator)
    if k=='specified-prime-multiplicity':return str(valuation(p['number'],p['prime']))
    if k in ['nondivisor-prime-budget','divisor-prime-budget']:
        n=product_text(re.search(r'n = (.+)\. Төмендегі',s)[1])[1]
        return choose(r,lambda o:(n%int(o)==0)==(k=='divisor-prime-budget'))
    if k=='prime-speed-time':
        def good(o):
            m=re.fullmatch(r'(\d+) км/сағ; (\d+) сағ',o);assert m;v,t=map(int,m.groups());return prime(v) and prime(t) and v>t and v*t==p['distance']
        return choose(r,good)
    if k=='not-semiprime':return choose(r,lambda o:sum(factor(int(o)).values())!=2)
    if k=='trailing-zero-pairs':
        n=product_text(s.split(' көбейтіндісінің')[0])[1];return str(len(str(n))-len(str(n).rstrip('0')))
    if k=='least-cube-multiplier':return str(next(m for m in range(1,p['number']**2+1) if cube(p['number']*m)))
    if k=='smallest-odd-prime-length':
        count=int(re.search(r'дәл (\d+) көбейткіш',s)[1]);good=[n for n in range(3,3**count+1,2) if len(expanded(n))==count];assert good[0]==3**count;return str(good[0])
    if k=='distinct-age-product':
        n=int(re.search(r'көбейтіндісі (\d+)',s)[1]);ds=[d for d in divisors(n) if d>1];triples=[t for t in itertools.combinations(ds,3) if math.prod(t)==n];return str(sum(one(triples)))
    if k=='square-factor-parity':return choose(r,lambda o:(lambda n:math.isqrt(n)**2==n)(product_text(o)[1]))
    if k=='consecutive-product-triple':
        n=p['product'];all_triples=[(a,a+1,a+2) for a in range(1,math.isqrt(n)+1) if a*(a+1)*(a+2)==n];actual=one(all_triples)
        return choose(r,lambda o:tuple(tuple_text(o))==actual)
    if k=='prime-cube-grid-dimensions':
        def good(o):
            lengths=tuple_text(o,' см');return len(lengths)==3 and all(n%p['edge']==0 and prime(n//p['edge']) for n in lengths) and math.prod(lengths)==p['count']*p['edge']**3
        return choose(r,good)
    if k=='factorial-prime-multiplicity':
        # Legendre's sum differs from author factorizing each member.
        n=p['last'];power=p['prime'];total=0
        while power<=n:total+=n//power;power*=p['prime']
        return str(total)
    if k=='count-all-divisors':
        n=product_text(re.search(r' = (.+) жіктеуін',s)[1])[1];return str(len(divisors(n)))
    if k=='largest-single-prime-power':
        n=p['prime'];a=[]
        while n<10**p['digits']:
            if n>=10**(p['digits']-1):a.append(n)
            n*=p['prime']
        return str(max(a))
    if k=='factor-guarantee':assert prime(p['prime']);assert 2*p['prime']%2==0 and 3*p['prime']%(2*p['prime'])!=0 and not prime(3*p['prime']);return str(p['prime'])+' санына бөлінеді'
    if k=='exact-prime-count-choice':return choose(r,lambda o:valuation(int(o),p['prime'])==p['count'])
    if k=='count-largest-prime-two-digits':return str(sum(max(factor(n))==p['prime'] for n in range(10,100)))
    if k=='greatest-odd-divisor':return str(max(d for d in divisors(p['number']) if d%2))
    if k=='prime-product-sum-multiple':return choose(r,lambda o:(lambda ns:all(prime(n) for n in ns) and math.prod(ns)==sum(ns)*p['multiplier'])(tuple_text(o)))
    if k=='zero-free-factor-pair':
        n=int(re.search(r'көбейтіндісі (\d+)',s)[1]);pairs=[(d,n//d) for d in divisors(n) if d*d<=n and all('0' not in str(x) for x in [d,n//d])];return str(sum(one(pairs)))
    raise AssertionError(k)

def main():
    assert len(ROWS)==47;entries=[];refs=set()
    for r in ROWS:
        assert solve(r)==r['answer'],(r['editionId'],solve(r),r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)!=bad['answer']
        assert r['minimumPlan']=='pro' and r['grade']==5 and not r.get('image');assert not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert r['options'].count(r['answer'])==1 and len(set(r['options']))==4
        else:assert r['statement'].endswith('Жауапқа тек санды жазыңыз.') and r['answer'].isdigit()
        for ref in r['sourceRefs']:refs.add(ref['sourceId'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Complete sieve/divisor domains; exact actual printed factor products, superscript powers, tuples and all candidate values; independent minima/permutation and valuation proofs','checks':['all47 full archived and rewritten conditions, complete solutions and MCQs read','equal numeric product does not certify complete prime factorization; 1 excluded','all multiplicities versus distinct counts and exact-exponent conditions distinguished','all factor pairs/triples, odd minima and maxima exhaustively checked; factorial independently checked by Legendre sum','open numeric inputs have explicit instruction; dimensions and units read in all choices']})
    assert len(refs)==47
    assert not prime(1) and product_text('4 × 11')[1]==44 and not all(prime(b) for b,e in product_text('4 × 11')[0])
    assert len(factor(1512))==3 and sum(factor(1512).values())==7
    assert valuation(375,5)==3 and 375%25==0
    assert 9*17*38==17*18*19==5814 and [9,17,38]!=[17,18,19]
    assert cube(45*75) and not any(cube(45*m) for m in range(1,75))
    assert valuation(math.factorial(12),2)==10
    assert len([n for n in range(1,243,2) if len(expanded(n))==5])==0
    # JS canonical SHA is a separate serialization contract, not the oracle.
    js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-factorization.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','manualFindings':[],'scope':'47 source-addressed editions. The41 author model forms and rewritten numerical contexts are not41 independent meanings.','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':47,'wrongKeysRejected':47,'sensitiveDomainCanaries':8,'hashesMatched':47,'authorSolverImported':False}))
if __name__=='__main__':main()
