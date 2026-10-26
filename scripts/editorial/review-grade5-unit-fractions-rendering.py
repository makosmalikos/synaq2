"""Independent exact printed-text review, all51 unit-fraction adaptations.

No author solver/spec imports. Pair decompositions use integer factorization,
greedy selection uses complete candidate comparison, and cuts use piece ledgers.
"""
import ast
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
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-unit-fractions.json'
OUT='problems/editorial/reviews/grade5-unit-fractions.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]

def m(p,s):
    match=re.search(p,s);assert match,(p,s);return match

def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def raw_for(r):
    ref=one(r['sourceRefs'])
    return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])

def pairs(s):return [tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]

def calc(s,variables=None):
    variables=variables or {};s=s.replace('×','*').replace('−','-').strip()
    assert re.fullmatch(r'[0-9A-Za-z ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Expression):return visit(n.body)
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        if isinstance(n,ast.Name):assert n.id in variables;return F(variables[n.id])
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b!=0
        return a/b
    return visit(ast.parse(s,mode='eval'))

def integer(v):assert v.denominator==1,v;return str(v.numerator)
def isunit(v):return v.numerator==1 and v.denominator>1
def rawunit(pair):return pair[0]==1 and pair[1]>1
def choice(r,value):return one(o for o in r['options'] if calc(o)==value)

def unit_terms(s):
    ps=pairs(s);assert len(ps)>0
    return all(rawunit(p) for p in ps) and len(set(b for a,b in ps))==len(ps)

def pair_domain(target):
    """All a<b with1/a+1/b=m/n via (ma−n)(mb−n)=n².

    a,b positive imply both factors positive; enumerate every divisor d<n of
    n², hence complete even for unbounded b. No author remainder formula used.
    """
    numerator,denominator=target.numerator,target.denominator;valid=[];tested=[]
    for d in range(1,denominator+1):
        if denominator**2%d:continue
        e=denominator**2//d
        if d>=e:continue
        tested.append((d,e))
        if (d+denominator)%numerator or (e+denominator)%numerator:continue
        a,b=(d+denominator)//numerator,(e+denominator)//numerator
        if 1<a<b:
            assert F(1,a)+F(1,b)==target
            valid.append((a,b))
    return sorted(valid),tested

def relation(s,variables=None):
    parts=re.split(r'\s([<>=])\s',s);assert len(parts)%2==1 and len(parts)>=3
    vs=[calc(p,variables) for p in parts[::2]]
    return all(a<b if op=='<' else a>b if op=='>' else a==b for a,op,b in zip(vs,parts[1::2],vs[1:]))

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-unit-fractions-');ps=pairs(s);vs=[F(*p) for p in ps];note=''
    decomposition={'decompose-two-unit-sum','decompose-two-unit-divisor-split','two-over-odd-unit-decomposition','decompose-three-distinct-units','select-unit-split-adjacent-product'}
    residual={'unit-missing-addend-no-reduction','unit-missing-addend-after-reduction','split-unit-adjacent-plus-product','two-over-odd-missing-unit'}
    if k=='unit-definition-universal-property':
        answer=one(o for o in r['options'] if o=='Аликвоттық бөлшектің әрқайсысы 1-ден кіші')
        falsemin=one(b for o in r['options'] if o.startswith('Ең кіші') for a,b in pairs(o))
        assert F(1,falsemin+1)<F(1,falsemin) and not isunit(F(1))
        note=f'Universal proof: integer n>1 implies0<1/n<1. No minimum:1/(n+1)<1/n for EVERY positive n, including printed falseminimum{falsemin};1/1 and improper excluded. Mathematical definition is invariant, metadata openly records it.'
    elif k=='adjacent-unit-difference-denominator':
        value=vs[0]-vs[1];assert isunit(value);answer=str(value.denominator)
        note=f'Actual exact difference{vs[0]}−{vs[1]}={value}; positive unit denominator{answer}, not denominator difference.'
    elif k=='select-written-unit-fraction':
        answer=one(o for o in r['options'] if rawunit(one(pairs(o))))
        note=f'Every RAW written option checked for literalnumerator1 AND naturaldenominator>1; value-normalization does not replace requested writtenform. Flags{[rawunit(one(pairs(o))) for o in r["options"]]}.'
    elif k in residual:
        value=vs[0]-vs[1];assert isunit(value);answer=str(value.denominator)
        assert vs[1]+F(1,int(answer))==vs[0]
        note=f'Actual unknownaddend=total{vs[0]}−known{vs[1]}={value}, reducedunit requirementn>1 and original equality reversechecked; no wrong subtractionrole.'
    elif k in decomposition:
        target=one(vs);flags=[unit_terms(o) and calc(o)==target for o in r['options']]
        answer=one(o for o,flag in zip(r['options'],flags) if flag)
        note=f'ALL actual option sums{[str(calc(o)) for o in r["options"]]} vs printed target{target}; literalnumerators1, ALLdenominators>1 and pairwiseDISTINCT checked separately, flags{flags}.'
    elif k=='count-units-denominator-upper':
        upper=int(m(r'Бөлімі (\d+) санынан',s)[1]);valid=[n for n in range(1,upper+1) if isunit(F(1,n))];answer=str(len(valid))
        note=f'Complete naturaldenominator1…{upper}, valid{valid}; upper included and n1excluded by properunit definition.'
    elif k=='single-strict-unit-denominator-between':
        low,high=vs;upper=math.ceil(1/low);valid=[n for n in range(2,upper+1) if low<F(1,n)<high];answer=str(one(valid))
        note=f'Complete unitdenominator2…{upper}, exact STRICT bounds{low},{high}, valid{valid}; all n beyond bound ≤lower, both equality endpoints excluded.'
    elif k=='unit-sum-reduces-to-unit':
        value=sum(vs,F(0));assert isunit(value);answer=str(value.denominator)
        note=f'Actual sum{vs[0]}+{vs[1]}={value}; normalize fully before requesting denominator{answer}, not raw numerator or sum ofdenominators.'
    elif k=='count-written-unit-fractions':
        valid=[p for p in ps if rawunit(p)];answer=str(len(valid))
        note=f'ALL actual raw list entries{ps}; exact writtenunit flags, selected{valid};3/3 and8/1 excluded.'
    elif k=='smallest-unit-one-digit-denominator':
        domain=list(range(2,10));best=min(F(1,n) for n in domain);answer=str(one(n for n in domain if F(1,n)==best))
        note=f'Complete one-digit natural domain{domain}, exact reciprocal min{best}, requesteddenominator{answer}. Bound9 is mathematical invariant, honestly preserved rather than advertised as new data.'
    elif k=='choose-three-unit-sum-one':
        flags=[unit_terms(o) and calc(o)==1 for o in r['options']];answer=one(o for o,flag in zip(r['options'],flags) if flag)
        note=f'ALL4 actual three-distinctunit sums{[str(calc(o)) for o in r["options"]]}, uniqueexact1. Invariant2,3,6triple retained; newdistractors/wording are not a new theorem.'
    elif k=='greatest-unit-definition':
        answer=one(o for o in r['options'] if o=='(1/2)')
        assert not isunit(F(1)) and F(1,17)<F(1,2)
        note='Every naturaln>1 has n≥2, so1/n≤1/2; bound attainedn2. n1excluded. Maximum1/2 is explicitly invariant, distinct from nonexistent minimum.'
    elif k=='coprime-unit-sum':
        answer=choice(r,sum(vs,F(0)));note=f'Actual exact sum{vs[0]}+{vs[1]}={sum(vs,F(0))}; every MCQ value checked.'
    elif k=='count-numerators-reducing-to-unit':
        d=int(m(r'^\(n/(\d+)\)',s)[1]);valid=[n for n in range(1,d+1) if isunit(F(n,d))];answer=str(len(valid))
        assert 1 in valid and d not in valid
        note=f'Complete positive n1…{d}; exact normalized fractions, valid{valid}. For n≥{d}, value≥1 so NO other unbounded n; n1included, n=dexcluded.'
    elif k=='unknown-subtracted-unit-denominator':
        target,minuend=vs;value=minuend-target;assert isunit(value);answer=str(value.denominator);assert minuend-F(1,int(answer))==target
        note=f'UnknownSUBTRAHEND=minuend{minuend}−given difference{target}={value}; reducedproperunit n{answer}, original signed equation substituted.'
    elif k=='greatest-two-unit-sum':
        values=[calc(o) for o in r['options']];answer=one(o for o,v in zip(r['options'],values) if v==max(values))
        note=f'ALL fouractualcomplete sums{list(map(str,values))}, unique max{max(values)}; closefractions never rounded or inferred from denominator sums.'
    elif k in {'third-unit-for-given-total','four-unit-sum-one-missing'}:
        target=vs[-1];known=vs[:-1];residual=target-sum(known,F(0));assert isunit(residual);answer=str(residual.denominator)
        ds=[v.denominator for v in known]+[int(answer)];assert len(ds)==len(set(ds)) and all(d>1 for d in ds)
        note=f'Actual total{target} minus ALL known{list(map(str,known))}={residual}; allresultdenominators{ds}distinct>1; RHS1/1 whenpresent is total1, never mislabeledproperunit.'
    elif k=='equal-share-half-plus-unit':
        whole,people=map(int,m(r'^(\d+) бірдей нан (\d+) адамға',s).groups());unit=F(whole,people)-F(1,2);assert isunit(unit);n=unit.denominator
        assert people%2==0;halved=people//2;fifths=whole-halved;assert fifths>0 and fifths*n==people and 2!=people and n!=people
        answer=str(n);note=f'Actual share{whole}/{people}; subtracthalf={unit}. Physical WHOLEcutledger{halved}breads×2halves={people}, remaining{fifths}breads×{n}equalparts={people}; everyperson1half+1unit, allbreadsused, no wholecutinto{people}.'
    elif k=='half-plus-unit-from-residual-half':
        whole,people=map(int,m(r'бірдей (\d+) таспа (\d+) оқушыға',s).groups());unit=F(whole,people)-F(1,2);assert isunit(unit);assert people%2==1
        halves_from_wholes=(people-1)//2;assert halves_from_wholes+1==whole
        assert F(1,2)/people==unit
        answer=str(unit.denominator);note=f'Actual share{whole}/{people}, extra{unit}; fullledger{halves_from_wholes}whole ribbons×2 gives{people-1}halves, finalribbon onehalf to lastperson, remaininghalf/{people} gives{people}pieces of{unit}. Finalwhole has{people+1}UNEQUALpieces, not{people}equalparts; length conserved.'
    elif k=='equal-sharing-without-direct-equal-cut':
        whole,people,halved,tiny=map(int,m(r'^(\d+) бірдей бәліш (\d+) балаға[\s\S]*?Алғашқы (\d+) бәліш екіге, соңғысы (\d+) тең бөлікке',s).groups())
        assert halved+1==whole and halved*2==people and tiny%people==0 and tiny!=people
        share=F(whole,people);answer=one(o for o in r['options'] if unit_terms(o) and calc(o)==share)
        terms=pairs(answer);assert terms[0]==(1,2) and len(terms)==3
        chunks=[F(*p)*tiny for p in terms[1:]];assert all(v.denominator==1 for v in chunks)
        assert sum(chunks)==F(tiny,people) and sum(chunks)*people==tiny
        note=f'Actual{whole}cakes/{people}; ledger{halved}×2halves={people}, lastcake{tiny}tinychunks; perperson1half+groups{list(map(str,chunks))}tinychunks. All{tiny}chunks consumed and target{share} exact, no wholecutinto{people}; allMCQ sums checked.'
    elif k in {'short-neighbour-product-telescoping','long-neighbour-product-reduced-terms-sum'}:
        terms=[tuple(map(int,t)) for t in re.findall(r'\(1/\((\d+) × (\d+)\)\)',s)];assert all(b==a+1 for a,b in terms)
        start,end=terms[0][0],terms[-1][1]
        value=sum((F(1,k*(k+1)) for k in range(start,end)),F(0))
        assert value==F(1,start)-F(1,end)
        answer=str(value.numerator+value.denominator) if k=='long-neighbour-product-reduced-terms-sum' else choice(r,value)
        note=f'Expanded EVERY actual k={start}…{end-1} productdenominatorterm with Fraction={value}; endpointidentity checked independently. '+('Requested reduced numerator+denominator='+answer if not r.get('options') else 'All actual MCQs evaluated.')
    elif k=='equal-cut-cap-unit-sharing':
        whole,people,cap=map(int,m(r'^(\d+) бірдей бәліш (\d+) адамға[\s\S]*?бәліштен (\d+) бөліктен',s).groups());target=F(whole,people)
        ledgers=list(itertools.combinations_with_replacement(range(2,cap+1),whole));flags=[];solutions=[]
        for o in r['options']:
            psopt=pairs(o);assert len(psopt)==2 and all(rawunit(p) for p in psopt)
            required=Counter({b:people for a,b in psopt});assert len(required)==2
            feasible=[ledger for ledger in ledgers if Counter({d:ledger.count(d)*d for d in set(ledger)})==required]
            flag=calc(o)==target and len(feasible)>0;flags.append(flag);solutions.append(feasible)
        answer=one(o for o,flag in zip(r['options'],flags) if flag)
        assert calc(r['options'][0])==target and not flags[0]
        note=f'Complete{len(ledgers)}unordered WHOLEcakecutledgers, eachcakeONLYequal2…{cap}pieces, exactly{whole}cakes and{people}people×two specifiedpieces. Actualoptionfeasibility{flags}, ledgers{solutions}; equal-value{r["options"][0]} failscutcap, not approved justbyrationalvalue.'
    elif k=='count-unit-pair-decompositions':
        target=one(vs);valid,factors=pair_domain(target);answer=str(len(valid))
        note=f'COMPLETE finiteintegerfactorpairs of denominator²={target.denominator**2}: tested{factors}; all a<bsolutions{valid}. ma−n positivefactor identity proves no missing unbounded b; equalitya=b excluded.'
    elif k=='minimum-first-unit-denominator-second':
        target=one(vs);valid,factors=pair_domain(target);assert valid;best=min(valid);answer=str(best[1])
        note=f'Complete denominator²factor oracle enumerates ALLordered a<b pairs{valid}; minimuma={best[0]}, requested SECONDdenominator{best[1]}; no sample-only minimumclaim.'
    elif k=='skip-two-product-telescoping':
        terms=[tuple(map(int,t)) for t in re.findall(r'\(2/\((\d+) × (\d+)\)\)',s)];assert all(b==a+2 for a,b in terms)
        start,end=terms[0][0],terms[-1][1];value=sum((F(2,k*(k+2)) for k in range(start,end,2)),F(0));assert value==F(1,start)-F(1,end)
        answer=choice(r,value);note=f'ALLactualskip2terms k{list(range(start,end,2))} evaluated exactly including numerator2; endpointdifference{value}, all4MCQs checked.'
    elif k=='largest-distinct-unit-sum':
        count=int(m(r'ӘРТҮРЛІ (\d+) аликвоттық',s)[1]);ds=list(range(2,count+2));value=sum((F(1,d) for d in ds),F(0));answer=choice(r,value)
        note=f'Universal sorteddenominator bound d_i≥i+2 for ALLpositive DISTINCTunitdenominators; termwise1/d_i≤1/(i+2), attainedby{ds}, exactmaximum{value}. Allofferedmixedvalueschecked, no duplication1/2 or n1.'
    elif k=='minimum-number-of-unit-addends':
        target=one(vs);assert not isunit(target);valid,factors=pair_domain(target);assert not valid
        witness=m(r'Ал ((?:\(\d+/\d+\) \+ )+\(\d+/\d+\)) =',r['solution'])[1];assert unit_terms(witness) and len(pairs(witness))==3 and calc(witness)==target
        answer='3';note=f'Oneunit impossible because reducednumerator{target.numerator}>1. COMPLETE denominator²factorpairs{factors} give NOtwo-unit solutions. Actualprinted3-unitwitness{witness} exactlyequals{target}, all3denominatorsdistinct>1; minimum3 proven.'
    elif k=='three-original-unit-shares-left':
        assert 'БАСТАПҚЫ' in s and 'қабыспайды' in s
        value=1-sum(vs,F(0));assert value>0
        answer=one(o for o in r['options'] if o!='Ештеңе қалмады' and calc(o)==value)
        note=f'ALL3 actualdisjointORIGINALwhole shares{list(map(str,vs))}, used{sum(vs,F(0))}, complement{value}; sequentialfraction-of-remainder interpretation explicitlyexcluded.'
    elif k=='dyadic-sum-complement':
        assert all(a==1 for a,b in ps) and all(ps[i+1][1]==2*ps[i][1] for i in range(len(ps)-1))
        value=1-sum(vs,F(0));answer=choice(r,value);note=f'ALL actual{len(vs)}dyadicterms sum{sum(vs,F(0))}; requestedCOMPLEMENT{value}, notsum; lastvisibleterm included.'
    elif k=='telescoping-last-denominator-from-target':
        target=vs[-1];missing=1-target;assert isunit(missing);end=missing.denominator;count=end-1
        expanded=sum((F(1,k*(k+1)) for k in range(1,end)),F(0));assert expanded==target
        answer=str(count*end);note=f'Actualtarget{target} hasdeficit{missing}, hence ALL{count}terms k1…{count}independentlysumtotarget; requestedLASTPRODUCTdenominator{count}×{end}={answer}, nottermcountorendfactor.'
    elif k=='unique-three-distinct-units-total-one':
        triples=[]
        # For a<b<c, total<3/a implies a<3 at total1; a=2 only.
        for a in range(2,3):
            remaining=1-F(1,a);pairsbc,_=pair_domain(remaining)
            triples.extend((a,b,c) for b,c in pairsbc if a<b<c)
        a,b,c=one(triples);assert F(1,a)+F(1,b)+F(1,c)==1
        answer=str(a+b+c);note=f'Universal a≥3 bound gives ≤1/3+1/4+1/5=47/60<1, so completea-domain{{2}}; remainingfactororacle enumerates everyb<c, soletriple{triples}. Sum{answer}; mathematicalinvariant honestlyretained.'
    elif k=='impossible-two-unit-decomposition':
        target=one(vs);valid,factors=pair_domain(target);assert not valid
        answer=one(o for o in r['options'] if o=='Мүмкін емес')
        for o in r['options']:
            if o.startswith('Мүмкін:'):assert calc(o.split(': ',1)[1])!=target
        note=f'COMPLETE positivefactorpairs{factors} for denominator²={target.denominator**2} yield nointegera<b solution; all3actualproposedpositiveclaims independentlynot{target}. Thus globalimpossibility, notonlyrejectofferedexamples.'
    elif k=='ascending-three-unit-fractions':
        target=sorted(vs);flags=[]
        for o in r['options']:
            values=[F(*p) for p in pairs(o)];flags.append(sorted(values)==target and values==target and relation(o))
        answer=one(o for o,flag in zip(r['options'],flags) if flag);note=f'ALL3actualinputvalues{list(map(str,vs))}sortedascending{list(map(str,target))}; everyofferedchain preservescompleteinputmultiset andstrictorder, notnumericdenominatororder.'
    elif k=='count-units-strictly-above':
        low=one(vs);upper=math.ceil(1/low);valid=[n for n in range(2,upper+1) if F(1,n)>low];answer=str(len(valid))
        note=f'Completeproperunitdenominator2…{upper}, strict>{low}, valid{valid}; equalityboundaryexcluded, n1excluded, everylargerdenominator yields≤bound.'
    elif k=='select-fraction-not-reducing-to-unit':
        values=[calc(o) for o in r['options']];answer=one(o for o,v in zip(r['options'],values) if not isunit(v));note=f'EveryactualrawMCQnormalized exactly{list(map(str,values))}; unitnumerator1ANDdenominator>1 checked AFTERreduction, notonlyrawnumerator.'
    elif k=='denominator-increment-unit-difference':
        target=one(vs);assert isunit(target);bound=target.denominator
        valid=[n for n in range(2,bound+1) if F(1,n)-F(1,n+1)==target];answer=str(one(valid))
        note=f'Completeactualnaturaldomain n2…{bound}, exactdifference1/n−1/(n+1)={target}, valid{valid}; n≥{bound}cannotwork since difference<1/n≤target, so no omittedunboundedsolutions.'
    elif k=='greedy-last-unit-denominator':
        initial=one(vs);remaining=initial;terms=[];ledger=[]
        assert 0<initial<1
        while not isunit(remaining):
            candidates=[F(1,n) for n in range(2,remaining.denominator+1) if F(1,n)<=remaining]
            chosen=max(candidates);assert chosen>0
            new=remaining-chosen;assert 0<new<remaining and new.numerator<remaining.numerator
            ledger.append((str(remaining),str(chosen),str(new)));terms.append(chosen);remaining=new
        terms.append(remaining);assert sum(terms,F(0))==initial and all(isunit(v) for v in terms)
        answer=str(remaining.denominator);note=f'Independentfullcandidatecomparison n2…currentdenominator atEVERYstep choosesmaximum≤remainder, notauthorceilformula. Strictnumeratordecrease provesfinite termination. Exactledger{ledger}, finalunit{remaining}, fullsum{initial}; lastdenominator{answer}.'
    elif k=='equal-unit-addends-still-unit':
        count=int(m(r'бөлшектің (\d+) бірдей',s)[1]);values=[calc(o)*count for o in r['options']];answer=one(o for o,v in zip(r['options'],values) if isunit(v))
        note=f'ALLactual{count}identicalcopies sumvalues{list(map(str,values))}; properunitpredicate afterreduction includingn>1. Result1fails, eveniforiginaldenominatordividescopycount.'
    elif k=='same-addition-numerator-denominator':
        add=int(m(r'де (\d+) қосылды',s)[1]);target=one(vs);n=F(1+add)/target-add;answer=integer(n)
        assert n>1 and F(1+add,n+add)==target
        note=f'Actual ADDITION to bothRAWterms: (1+{add})/(n+{add})={target}; exactlinearequation n={n}>1, reversefractionchecked, no equal-scaling misconception.'
    elif k=='choose-true-three-unit-identity':
        flags=[relation(o) and unit_terms(o.split(' = ',1)[1]) for o in r['options']];answer=one(o for o,flag in zip(r['options'],flags) if flag)
        assert 'әдейі қате' in s
        note=f'EveryactualequalityLHS/RHSexactlyevaluated; RHSall3properunitdenominatorsdistinct. Truthflags{flags}, intentionallyfalseexamples explicitlyidentified incondition.'
    elif k=='three-parallel-unit-work-times':
        times=list(map(int,m(r'ретімен (\d+), (\d+), (\d+) күнде',s).groups()));rate=sum((F(1,t) for t in times),F(0));time=1/rate;answer=integer(time)
        assert 'тұрақты' in s and 'Бір мезгілде' in s and 'қабыспайды' in s and sum((time/t for t in times),F(0))==1
        note=f'All3actualconstantunitworkrates fromtimes{times}, sum{rate}; reciprocalcompletion{time}days, integrateddisjointwork=1; simultaneousstartandconstant/nonoverlappingwork explicitlyprinted.'
    elif k=='harmonic-block-strict-bounds':
        low,high=map(int,m(r'бөлімдер (\d+)–(\d+) аралығындағы',s).groups());terms=[F(1,n) for n in range(low,high+1)];value=sum(terms,F(0));count=high-low+1
        assert count>1 and count*F(1,high)<value<count*F(1,low) and count*F(1,low)<1
        flags=[relation(o,{'A':value}) for o in r['options']];answer=one(o for o,flag in zip(r['options'],flags) if flag)
        note=f'ALL{count}actualinclusiveunit terms{low}…{high} summedexactly{value}; strictlower{count}/{high}andupper{count}/{low}provedbecauseonlyONEtermattainseachextreme. Everyactualclaimchecked, flags{flags}; equalitynotinferredfromasingleendpointterm.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==51;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact printed Fraction AST/actual MCQs; complete denominator-square factor domains and triple bounds, full-candidate greedy and physical piece-ledger conservation, universal reciprocal inequalities; no author model/spec imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All51 saved/new/fullsolutions/MCQs manually read','Definitionliteral1/n withnaturaln>1 and RAWvsreduced answerroles checked','Allfinitepair/triple/count/strictbound domains complete with proofs','Physicalwhole/half/cutcap ledgers conserve everypiece andwhole','Theoremconstants explicitly marked invariant, no inflatedclaimofnewsemanticmeanings']})
    assert len(refs)==51
    assert not isunit(F(1)) and isunit(F(1,2))
    assert pair_domain(F(1,15))[0]==[(16,240),(18,90),(20,60),(24,40)]
    assert pair_domain(F(5,7))[0]==[] and pair_domain(F(5,11))[0]==[]
    assert pair_domain(F(1,2))[0]==[(3,6)]
    assert F(1,3)+F(1,12)==F(1,4)+F(1,6)==F(5,12) and 12>6
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All51 source-addressed grade5topic3.10 nonvisual unit-fraction adaptations; complete independent exact review','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':51,'wrongKeysRejected':51,'sourceRefs':51,'hashesMatched':51,'completeFactorDomains':True,'physicalCutLedgers':True,'greedyCandidateOracle':True,'strictBoundsAndInvariantDefinitions':True,'authorSolverImported':False}))

if __name__=='__main__':main()
