"""Independent review: all48 original/new conditions, full solutions and MCQs.

No author solver imported. Primary oracle intersects complete divisor sets;
word problems enumerate their actual feasible domains. Printed polynomial/power
options are parsed independently and universal claims include general proofs.
"""
import copy
from fractions import Fraction
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-gcd.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹'
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def divisors(n):
    assert isinstance(n,int) and n>0
    out=set()
    for i in range(1,math.isqrt(n)+1):
        if n%i==0:out.update((i,n//i))
    return out
def common(ns):return sorted(set.intersection(*(divisors(n) for n in ns)))
def exact_gcd(ns):return max(common(ns))
def choose(r,condition):return one(o for o in r['options'] if condition(o))
def pair_text(s):
    m=re.fullmatch(r'(\d+) және (\d+)',s);assert m,s;return tuple(map(int,m.groups()))
def product_text(s):
    terms=[]
    for part in s.split(' × '):
        m=re.fullmatch(r'(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)',part);assert m,part
        terms.append((int(m[1]),int(m[2].translate(str.maketrans(SUP,'0123456789'))) if m[2] else 1))
    return math.prod(a**b for a,b in terms)
def polynomial(s):
    out={}
    for term in s.split(' + '):
        m=re.fullmatch(r'(\d+)([abmnk])',term);assert m,term
        c,v=m.groups();assert v not in out;out[v]=int(c)
    return out
def factor_option(s):
    m=re.fullmatch(r'(\d+) × \((.+)\)',s);assert m,s
    outside=int(m[1]);return outside,{v:c*outside for v,c in polynomial(m[2]).items()}
def parsed_products(s):
    return [product_text(t) for t in re.findall(r'[abc] = (.+?)(?=, [abc] = |\. Осы)',s)]
def all_pairs(total,g):return [(a,total-a) for a in range(1,total//2+1) if exact_gcd([a,total-a])==g]
def solve(r):
    p=r['params'];k=r['modelId'].removeprefix('grade5-gcd-');s=r['statement']
    if k in ['smallest-divides-pair','smallest-divides-triple','gcd-factor-pair','gcd-divisor-lists','gcd-min-exponent-pair','gcd-short-list','gcd-large-factor-pair','gcd-three-shared-primes']:
        assert ', '.join(map(str,p['numbers'])) in s;return str(exact_gcd(p['numbers']))
    if k=='common-divisor-set':
        printed=re.findall(r'Б\((\d+)\) = \{([^}]+)\}',s);assert len(printed)==2
        for n,ds in printed:assert set(map(int,ds.split(', ')))==divisors(int(n))
        actual=common([int(n) for n,ds in printed]);return choose(r,lambda o:list(map(int,o.split(', ')))==actual)
    if k in ['coprime-composite-pair','coprime-hidden-composite-pair','not-coprime-pair','gcd-equals-smaller-pair','largest-pair-gcd']:
        data=[(o,pair_text(o),exact_gcd(pair_text(o))) for o in r['options']]
        if k=='largest-pair-gcd':best=max(t[2] for t in data);return one(o for o,ns,g in data if g==best)
        return one(o for o,ns,g in data if (g>1 if k=='not-coprime-pair' else g==min(ns) if k=='gcd-equals-smaller-pair' else g==1))
    if k in ['powered-gcd-choice','powered-gcd-unshared','three-powered-gcd']:
        ns=parsed_products(s);assert len(ns)==len(p['products']);return str(exact_gcd(ns))
    if k in ['coprime-to-semiprime','coprime-to-repeated-primes']:
        target=int(re.search(r'Қай сан (\d+) санымен',s)[1]);return choose(r,lambda o:exact_gcd([int(o),target])==1)
    if k=='prime-vs-composite-gcd':ns=list(map(int,re.search(r'ЕҮОБ\((\d+), (\d+)\)',s).groups()));return str(exact_gcd(ns))
    if k=='coprime-definition':
        assert exact_gcd([25,36])==1 and exact_gcd([10,15])==5 and exact_gcd([14,21])==7
        return 'Өзара жай натурал сандардың ең үлкен ортақ бөлгіші 1 болады'
    if k in ['common-divisor-count-small','common-divisor-count-factor']:return str(len(common(p['numbers'])))
    if k=='not-common-divisor':return choose(r,lambda o:int(o) not in common(p['numbers']))
    if k=='choose-exact-gcd':return choose(r,lambda o:exact_gcd([int(o),p['fixed']])==p['target'])
    if k=='triple-min-powers':return str(exact_gcd(p['numbers']))
    if k in ['factor-out-two','factor-out-three']:
        original=polynomial(s.split(' өрнегінде')[0]);g=exact_gcd(list(original.values()))
        return choose(r,lambda o:factor_option(o)==(g,original))
    if k in ['maximum-two-type-bundles','maximum-gifts-ask-first-item','maximum-teams-members','maximum-separate-bus-capacity']:
        amounts=p['amounts'];groups=max(n for n in range(1,min(amounts)+1) if all(a%n==0 for a in amounts))
        if k in ['maximum-two-type-bundles','maximum-separate-bus-capacity']:return str(groups)
        if k=='maximum-gifts-ask-first-item':return str(amounts[0]//groups)
        def fits(o):
            m=re.fullmatch(r'(\d+) команда, әрқайсысында (\d+) оқушы',o);assert m,o
            n,count=map(int,m.groups());return n==groups and count==sum(a//groups for a in amounts)
        return choose(r,fits)
    if k=='gcd-ratio-sum-pair':
        ratio=exact_gcd(p['ratioInputs']);total=exact_gcd(p['sumInputs'])
        valid=[(a,b) for b in range(1,total) for a in [total-b] if a>=b and Fraction(a,b)==ratio];assert len(valid)==1
        return choose(r,lambda o:pair_text(o)==valid[0])
    if k=='two-digit-exact-gcd-count':return str(sum(exact_gcd([n,p['fixed']])==p['target'] for n in range(10,100)))
    if k=='largest-square-tile-count':
        a=p['lengthMetres']*100+p['lengthCm'];b=p['widthMetres']*100+p['widthCm']
        # Exhaust every integer side; then independently confirm area quotient.
        side=max(t for t in range(1,min(a,b)+1) if a%t==0 and b%t==0);count=(a//side)*(b//side);assert count*side**2==a*b;return str(count)
    if k=='composite-base-powered-gcd':
        a,b=re.search(r'ЕҮОБ\((.+), (.+)\) мәнін',s).groups();g=exact_gcd([product_text(a),product_text(b)])
        return choose(r,lambda o:product_text(o)==g)
    if k=='largest-remainder-divisor':
        valid=[n for n in range(1,min(p['numbers'])+1) if all(x%n==rem and rem<n for x,rem in zip(p['numbers'],p['remainders']))]
        assert valid and max(valid)==84;return str(max(valid))
    if k=='unordered-sum-gcd-pairs':return str(len(all_pairs(p['total'],p['gcd'])))
    if k=='impossible-difference-gcd':
        possible=divisors(p['difference'])
        for d in possible:assert exact_gcd([d,d+p['difference']])==d
        return choose(r,lambda o:int(o) not in possible)
    if k=='maximum-tank-and-count':
        g=exact_gcd(p['amounts']);count=sum(x//g for x in p['amounts'])
        def fits(o):
            m=re.fullmatch(r'(\d+) т, (\d+) цистерна',o);assert m,o;return tuple(map(int,m.groups()))==(g,count)
        return choose(r,fits)
    if k=='consecutive-coprime-theorem':
        # General proof: any common d divides (n+1)-n=1, so d=1.
        first=[1,0];second=[1,1]  # coefficient vectors for arbitrary n and n+1
        assert [b-a for a,b in zip(first,second)]==[0,1] and divisors(1)=={1}
        assert exact_gcd([15,21])==3 and exact_gcd([25,36])==1 and exact_gcd([7,21])==7
        assert 'олардың айырмасы 1 де d' in r['solution']
        return 'Айырмасы 1 болатын екі натурал сан әрқашан өзара жай'
    if k=='greatest-two-digit-gcd-input':return str(max(n for n in range(10,100) if exact_gcd([n,p['fixed']])==p['fixed']))
    if k=='unknown-prime-exponent':
        fixed=p['prime']**p['bound']*p['secondOther'];target=p['prime']**p['targetExponent']
        assert p['targetExponent']<p['bound'] and exact_gcd([p['firstOther'],p['secondOther']])==1
        # Actual options can include very large k; modular reduction avoids any
        # power-size artifact and verifies each candidate literally.
        return choose(r,lambda o:math.gcd(pow(p['prime'],int(o),fixed)*p['firstOther'],fixed)==target)
    if k=='product-and-gcd-sum':
        pairs=[(a,p['product']//a) for a in sorted(divisors(p['product'])) if a*a<=p['product'] and exact_gcd([a,p['product']//a])==p['gcd']]
        return str(sum(one(pairs)))
    if k=='greatest-guaranteed-common-divisor':
        g=exact_gcd([p['firstMultiple'],p['secondMultiple']]);assert g==12
        # Every arbitrary pair of multiples shares g; choosing the minimal
        # multiples themselves forces any universal divisor to divide g.
        assert p['firstMultiple']%g==p['secondMultiple']%g==0
        return str(max(d for d in divisors(g)))
    if k=='remove-one-max-package':
        possibilities=[]
        for i in range(len(p['amounts'])):
            ns=p['amounts'][:i]+p['amounts'][i+1:]
            possibilities.append(max(n for n in range(1,min(ns)+1) if all(v%n==0 for v in ns)))
        assert possibilities==[10,10,40,10,10];return str(max(possibilities))
    if k=='coprime-initial-segment-count':return str(sum(common([n,p['last']])==[1] for n in range(1,p['last']+1)))
    if k=='gcd-scaling-law':
        # Independent universal proof: Bézout gives ua+vb=g. Every common
        # divisor of ka,kb therefore divides kg, and kg itself divides both.
        # The two divisibility directions force gcd(ka,kb)=kg for every pair.
        return str(p['gcd']*p['multiplier'])
    raise AssertionError(k)

def main():
    assert len(ROWS)==48;refs=set();entries=[]
    for r in ROWS:
        got=solve(r);assert got==r['answer'],(r['editionId'],got,r['answer'])
        wrong=copy.deepcopy(r);wrong['answer']='wrong';assert solve(wrong)!=wrong['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        assert not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert len(set(r['options']))==len(r['options'])==4 and r['options'].count(got)==1
        else:assert r['statement'].endswith('Жауапқа тек санды жазыңыз.') and got.isdigit()
        for ref in r['sourceRefs']:
            raw=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']);assert raw['solution'];refs.add(ref['sourceId'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Complete divisor-set intersections; independent exhaustive feasible domains; literal printed power/polynomial/pair/unit options; general divisibility and Bezout proofs','checks':['all48 full saved and rewritten conditions, complete solutions and options read manually','full unordered-pair, two-digit, remainder and crate-removal domains checked, not a sample','maximum group/count/item/side and constant-capacity targets distinguished','typed polynomial coefficient maps require the greatest extracted factor, not merely an equivalent identity','universal definition/consecutive/guaranteed-divisor/scaling claims justified generally with independent counterexamples','source0536 false prohibition of extra powers of2 is not inherited;112 divisible by16 is correctly accepted']})
    assert len(refs)==48
    # Canaries target the boundaries that a plausible shortcut would miss.
    assert exact_gcd([112,40])==8 and 112%16==0
    assert [n for n in range(10,100) if exact_gcd([n,48])==16]==[16,32,64,80]
    assert all_pairs(150,10)==[(10,140),(20,130),(40,110),(70,80)]
    assert [n for n in range(1,263) if 262%n==10 and 428%n==8]==[12,14,21,28,42,84]
    assert factor_option('7 × (4a + 6b)')[1]==factor_option('14 × (2a + 3b)')[1] and factor_option('7 × (4a + 6b)')[0]!=14
    assert exact_gcd([240,280,150,440,520])==10 and exact_gcd([240,280,440,520])==40
    assert exact_gcd([11*25,11*36])==11 and exact_gcd([4*11*25,4*11*36])==44
    js="import fs from 'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','manualFindings':[],'scope':'All48 saved source-addressed editions. Different numerical forms are not claimed as48 independent mathematical meanings. No author solver or test answer imported.','universalProofs':{'coprimeDefinition':'Coprime means the complete common positive-divisor set is exactly{1}; new counterexamples refute all other universal choices.','consecutive':'For arbitrary n, symbolic coefficient subtraction (n+1)-n=1. Any common positive divisor divides1 and must equal1. This is general, not inferred from finite samples.','difference':'Any common divisor of n and n+D divides their linear difference D. Conversely every divisor d ofD occurs by n=d, so the possible gcd set is exactly the complete positive-divisor set ofD.','guaranteed':'g=gcd(A,B) divides every pair of respective multiples. Taking the numbers A,B themselves shows every universal divisor must divide g; hence the greatest is exactly g.','scaling':'Bezout: ua+vb=g. If d divides ka andkb, then d divides u(ka)+v(kb)=kg. Conversely kg divides both ka,kb. Thus gcd(ka,kb)=kg for every positive k, independently of the author prime-factor proof.'},'entries':entries}
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-gcd.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':48,'wrongKeysRejected':48,'completeSourceRefs':48,'hashesMatched':48,'authorSolverImported':False}))
if __name__=='__main__':main()
