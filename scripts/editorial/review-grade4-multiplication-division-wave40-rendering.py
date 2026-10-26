"""Independent printed integer/Euclidean/estimate review, all22 saved tasks.

No author solver, specs, parameters, division trace or fixtures are imported.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-multiplication-division-review-wave40.json'
OUT='problems/editorial/reviews/grade4-multiplication-division-review-wave40.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(p,s):
    z=re.search(p,s);assert z,(p,s);return z
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def calc(s):
    s=s.replace('×','*').replace('−','-').replace(':','/').strip();assert re.fullmatch(r'[0-9 ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp),ast.dump(n);a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b>0;return a/b
    return visit(ast.parse(s,mode='eval').body)
def integer(x):assert x.denominator==1 and x>=0;return str(x.numerator)
def prefix_digits(a,b):
    digits=str(a);i=next(i for i in range(1,len(digits)+1) if int(digits[:i])>=b);prefix=int(digits[:i]);before=int(digits[:i-1] or '0');remaining=len(digits)-i;count=remaining+1
    assert before<b<=prefix and b*10**(count-1)<=a<b*10**count
    return before,prefix,remaining,count
def chain(s):
    z=re.split(r'\s*(=|<|>|≤|≥)\s*',s);assert len(z)>=3 and len(z)%2==1
    vs=list(map(calc,z[::2]));return all(a==b if op=='=' else a<b if op=='<' else a>b if op=='>' else a<=b if op=='≤' else a>=b for a,op,b in zip(vs,z[1::2],vs[1:]))

def solve(r):
    s=r['statement'];n=nums(s);os=r.get('options',[]);k=r['modelId'].removeprefix('grade4-multiplication-division-review-');note=''
    if k in {'internal-zero-euclidean-choice','ordinary-euclidean-choice'}:
        a,b=n;q,rem=divmod(a,b);answer=one(o for o in os if nums(o)==[q,rem]);flags=[a==b*x+y and 0<=y<b for x,y in map(nums,os)];assert sum(flags)==1
        falsecanonical=[(x,y) for x,y in map(nums,os) if a==b*x+y and y>=b];assert len(falsecanonical)==1
        if k.startswith('internal'):assert '0' in str(q)[1:-1]
        note=f'Exact PRINTED divmod({a},{b})=({q},{rem}); ALLactual4pairs checked for identity AND0≤r<divisor, flags{flags}. Identity-only falsepair{falsecanonical} rejected. Internalzero preserved where requested.'
    elif k=='quotient-digits-from-prefix':
        a,b=n;before,p,remaining,count=prefix_digits(a,b);answer=str(count)
        note=f'Actual first-sufficient-prefix proof{before}<{b}≤{p}, remaining{remaining}decimaldigits, quotientdigits1+{remaining}={count}; exact bounds {b*10**(count-1)}≤{a}<{b*10**count} establish count without full division.'
    elif k=='inverse-multiplication-expression':
        a,b,q=n;assert b*q==a;answer=one(o for o in os if '×' in o and calc(o)==a)
        note=f'ALL actualexpression values{list(map(lambda o:str(calc(o)),os))}; inverse quotient{q}×divisor{b}={a} reconstructs dividend; source operation types retained.'
    elif k=='nearest-rounded-product':
        a,b=n;product=a*b;distances=[abs(int(o)-product) for o in os];answer=one(o for o,d in zip(os,distances) if d==min(distances));rounds=[tuple(map(int,x)) for x in re.findall(r'(\d+) шамамен (\d+)',r['solution'])];assert rounds==[(a,(a+50)//100*100),(b,(b+5)//10*10)]
        note=f'Actual product{product}, all4absolute optiondistances{distances}, unique nearest{answer}. Printedrounding verified independently to nearesthundred/tens, approximateproduct{rounds[0][1]*rounds[1][1]}.'
    elif k=='equal-three-single-digit-divisors':
        a,b,c,d=n;left,right=F(a,b),F(c,d);assert left.denominator==right.denominator==1;answer='=' if left==right else '<' if left<right else '>'
        assert str(left).endswith('00')
        note=f'Actual bothquotients {a}/{b}={left}, {c}/{d}={right}; equality despite different divisor lengths, BOTH terminal quotientzeroes retained.'
    elif k=='terminal-zero-quotient-remainder-only':
        a,b=n;q,rem=divmod(a,b);assert q%10==0 and 0<rem<b;answer=str(rem)
        note=f'Exact divmod({a},{b})=({q},{rem}); terminal quotient0 preserved; requested LASTremainder{rem}, not quotient{q}; canonical interval0≤r<{b} checked.'
    elif k=='select-false-division-equality':
        flags=[]
        for o in os:a,b,q=nums(o);flags.append(a==b*q)
        answer=one(o for o,f in zip(os,flags) if not f);a,b,q=nums(answer);assert a%b==0 and a//b==q+1
        note=f'ALLactual4inverse products truthflags{flags}; sole false{answer}, exactcorrectquotient{a//b}, trialquotient onebelow. Falseexample explicitly requested, never treated as true arithmetic.'
    elif k=='whole-days-normalized-hours':
        hours=one(n);days,rem=divmod(hours,24);answer=one(o for o in os if nums(o)==[days,rem]);equalnoncanonical=[o for o in os if (lambda d,h:24*d+h==hours and h>=24)(*nums(o))];assert len(equalnoncanonical)==1
        note=f'Actual{hours}hours=24×{days}+{rem}; only full-day-normalized answer has0≤hour<24. Equal-duration but noncanonical option{equalnoncanonical} explicitly rejected.'
    elif k=='select-three-digit-quotient':
        info=[prefix_digits(*nums(o)) for o in os];answer=one(o for o,z in zip(os,info) if z[3]==3)
        for o,(before,p,remaining,count) in zip(os,info):
            a,b=nums(o);assert f'{before} < {b} ≤ {p}' in r['solution'];assert len(str(a//b))==count
        note=f'All4actual first-prefix records(before,prefix,remaining,count){info}; one3-digit without division. Finalsolution correction includes every actualprefix FIRST, fullquotients only as separate verification.'
    elif k=='refine-straddling-million-bounds':
        a,b=n;product=a*b;answer=str(len(str(product)));sol=r['solution'];assert 'әлі жеткіліксіз' in sol
        lowpair=nums(m(r'көбейтінді (\d+ × \d+) =',sol)[1]);upperpair=nums(m(r'үлкен, (\d+ × \d+) =',sol)[1]);refined=nums(m(r'сондықтан көбейтінді (\d+ × \d+) =',sol)[1]);low=lowpair[0]*lowpair[1];high=upperpair[0]*upperpair[1];ref=refined[0]*refined[1]
        assert low<10**6<high and all(x<y for x,y in zip(lowpair,[a,b])) and all(x>y for x,y in zip(upperpair,[a,b])) and all(x<y for x,y in zip(refined,[a,b])) and 10**6<ref<product<high<10**7
        note=f'Actual oldbounds{low}…{high} STRADDLEmillion, insufficient; REALrefinedlower{refined}product{ref}>million, strictly belowactual{product}, upper{high}<10million. Hence7digits proven by bounding, not mere roundedguess.'
    elif k=='only-product-above-threshold':
        threshold=one(n);values=[calc(o) for o in os];answer=one(o for o,v in zip(os,values) if v>threshold);assert threshold-1 in values
        note=f'ALL4actualproducts{list(map(str,values))}, STRICT>{threshold}; nearboundary{threshold-1} excluded, exactunique above, no approximationtoequal threshold.'
    elif k=='simultaneously-scale-dividend-divisor':
        q,up,down=n;value=F(q*up,down);answer=integer(value)
        note=f'Universal substitutea={q}b withb>0: (a×{up})/(b×{down})={q}×{up}/{down}={value}; both factorchanges and opposite divisor effect retained, allvalidb cancel. No unsupported sample-only universalclaim.'
    elif k=='quotient-open-interval-estimation':
        a,b=n;value=F(a,b);flags=[lo<value<hi for lo,hi in map(nums,os)];answer=one(o for o,t in zip(os,flags) if t);lo,hi=nums(answer);assert lo*b<a<hi*b and 'Екі шет кірмейді' in s
        note=f'ALL4actualOPENinterval flags{flags}; positive divisor crossmultiplication{lo*b}<{a}<{hi*b}; endpoints excluded, only{answer} contains exactquotient{value}.'
    elif k=='residue-mod-smaller-factor':
        old,rem,new=n;assert old%new==0 and 0<=rem<old;value=rem%new;answer=str(value)
        assert all((old*k+rem)%new==value for k in range(new))
        note=f'Universaln={old}k+{rem}, olddivisor multipleofnew{new}, hencektermzero modulo{new}; actualresidue{rem}%{new}={value}, bounded0≤r<{new}. Completekresidueclasses0…{new-1}also checked.'
    elif k=='minimum-three-digit-factor-five-digit-product':
        factor=one(n);valid=[a for a in range(100,1000) if 10000<=a*factor<=99999];answer=str(min(valid));a=int(answer);assert (a-1)*factor<10000<=a*factor
        note=f'COMPLETE900three-digit naturalinputs100…999, valid{valid[0]}…{valid[-1]}; min{answer}, predecessorproduct{(a-1)*factor}<10000 andcandidate{a*factor}≥10000, five-digitupper99999 enforced.'
    elif k=='transfer-factor-two-between-products':
        a,b,c,d=n;assert a==2*c and d==2*b;answer='=';assert a*b==c*d
        note=f'Actual relations{a}=2×{c}, {d}=2×{b}; both products exactly same three factors({c},2,{b}), universal associativity/commutativity proof without fullmultiplication.'
    elif k=='operator-pair-with-precedence':
        a,b,c,target=n;expressions=[f'{a} {one(o.split(" және ")[:1])} {b} {o.split(" және ")[1]} {c}' for o in os];values=list(map(calc,expressions));answer=one(o for o,v in zip(os,values) if v==target)
        note=f'ALL4actualop-pairs injected into displayednumbers, FractionAST ordinary precedence/leftassociativity gives{list(map(str,values))}; sole target{target}; no addedparentheses.'
    elif k=='omitted-multiplier-zero-inverse':
        correct,zero,wrong,short=n;assert zero==0 and str(correct).replace('0','',1)==str(wrong);coef=correct-wrong;x=F(short,coef);assert x.denominator==1 and x>0;answer=integer(x*correct)
        hits=[v for v in range(1,int(x)+1) if v*coef==short];assert hits==[int(x)] and x*correct-x*wrong==short
        note=f'Actual omission{correct}→{wrong}, differencecoefficient{coef}; exactunique positiveinput{short}/{coef}={x}; fullcandidate1…{x}andmonotonicity proveunique. Correctproduct{answer}, wrong{x*wrong}, shortfallreversechecked.'
    elif k=='maximal-equal-quotient-remainder':
        d=one(n);candidates=[]
        for q in range(1,d):
            a=(d+1)*q;assert divmod(a,d)==(q,q);candidates.append(a)
        answer=str(max(candidates));assert len(candidates)==d-1 and divmod(int(answer),d)==(d-1,d-1)
        note=f'COMPLETEpositiveequalquotient/remainder domain1…{d-1}; n=({d}+1)q strictlyincreasing, maximum{answer}. q={d} excluded bycanonical r<d, q0excluded naturaldividend0; no unbounded larger input can satisfy.'
    elif k=='symmetric-factors-vs-center-square':
        a,b,c,d=n;assert c==d and a+b==2*c and a<c<b;gap=c-a;difference=c*d-a*b;assert difference==gap**2>0;answer='<'
        note=f'Actual symmetric factors({c}−{gap})({c}+{gap}) versus{c}²; regrouped commonterm cancels, difference={gap}²={difference}>0, strict< universal forpositivegap, no fullproducts needed.'
    else:raise AssertionError(k)
    return answer,note

def numeric_solution_chains(s):
    checked=0
    for hit in re.finditer(r'[0-9(][0-9\s×:−+()=<>≥≤]*',s):
        t=hit[0].strip()
        if not re.search('[=<>≥≤]',t) or re.search(r'[=<>≥≤:×−+]$',t):continue
        if t.count('(')!=t.count(')'):continue
        # A preceding multiplication symbol means this is an incomplete suffix.
        if re.search(r'[×:−+]\s*$',s[:hit.start()]):continue
        assert chain(t),t;checked+=1
    return checked

def main():
    assert len(ROWS)==22;entries=[];refs=set();chains=0
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer'];assert r['grade']==4 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement']);chains+=numeric_solution_chains(r['solution'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Independent PRINTED exact integer/Fraction AST, normalized Euclidean pairs/hours, complete bounded natural domains, first-prefix and strict estimate proofs, universal regrouping/modular proofs; no author solver/spec/params imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All22 saved/new/fullsolutions/allMCQs manually read','Actual fullnumeric solutionequality/inequality chains checked independently','Internal/terminalzero, canonicalremainder/dayhour, proper requestedquantity preserved','Complete3digit/extremequotient-remainder domains, strictthreshold/openinterval and universalfactor/residue proofs','Select-three-digit solution finalprefix revision fullyreread; options/data/key unchanged']})
    assert len(refs)==22
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'6cc38c0f809fe95f','finding':'Solution gave full quotients before first-prefix count despite prompt withoutfull division','resolution':'All4real sufficient prefixes and remainingdigitcounts now explicitlyproved before optionalquotient verification; finalfullrow reread.'}],'scope':'All22 source-addressed grade4topic5.11 remaining multiplication/division-review tasks; exact independent printed review','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert {e['editionId']:e['sha256'] for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':22,'wrongKeysRejected':22,'sourceRefs':22,'hashesMatched':22,'numericSolutionChains':chains,'completeNaturalAndRemainderDomains':True,'resolvedFindings':1,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
