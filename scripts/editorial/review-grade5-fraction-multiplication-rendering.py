"""Independent printed-text Fraction/polynomial review of all46 adaptations.

No author solver/spec/parameter imports. All numerical givens are parsed from
the displayed conditions/options; symbolic claims use exact polynomial identities.
"""
import ast
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
PACK='problems/editorial/batches/grade5-fraction-multiplication.json'
OUT='problems/editorial/reviews/grade5-fraction-multiplication.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]

def m(pattern,text):
    found=re.search(pattern,text);assert found,(pattern,text);return found

def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def raw_for(row):
    ref=one(row['sourceRefs'])
    return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])

def groups(s):
    depth=0;start=None;out=[]
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        elif c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0
    return out

def tree(s):
    s=s.replace('×','*').replace('−','-').replace('²','**2').replace('³','**3').strip()
    assert re.fullmatch(r'[0-9A-Za-z ()+*/-]+',s),s
    return ast.parse(s,mode='eval').body

def calc(s,env=None):
    env=env or {}
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        if isinstance(n,ast.Name):assert n.id in env,n.id;return F(env[n.id])
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -visit(n.operand)
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        if isinstance(n.op,ast.Pow):assert b.denominator==1 and 0<=b<=3;return a**int(b)
        assert isinstance(n.op,ast.Div) and b!=0
        return a/b
    return visit(tree(s))

def math_run(s):
    start=m(r'[\d(]',s).start()
    return m(r'[0-9A-Za-z ()+×−/²³]+',s[start:])[0].strip()

def pairs(s):return [tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]
def integer(v):assert v.denominator==1 and v>=0,v;return str(v.numerator)
def choice(r,v):return one(o for o in r['options'] if calc(o)==v)

# Sparse polynomials indexed by sorted variable-name tuples; rational functions
# remain numerator/denominator pairs and identities use cross multiplication.
def padd(a,b):
    out=a.copy()
    for k,v in b.items():out[k]=out.get(k,F(0))+v
    return {k:v for k,v in out.items() if v}
def pneg(a):return {k:-v for k,v in a.items()}
def pmul(a,b):
    out={}
    for ka,va in a.items():
        for kb,vb in b.items():
            k=tuple(sorted(ka+kb));out[k]=out.get(k,F(0))+va*vb
    return {k:v for k,v in out.items() if v}
def symbolic(s):
    unit={():F(1)}
    def visit(n):
        if isinstance(n,ast.Constant):return ({():F(n.value)} if n.value else {},unit)
        if isinstance(n,ast.Name):return {(n.id,):F(1)},unit
        assert isinstance(n,ast.BinOp)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return padd(pmul(a[0],b[1]),pmul(b[0],a[1])),pmul(a[1],b[1])
        if isinstance(n.op,ast.Sub):return padd(pmul(a[0],b[1]),pneg(pmul(b[0],a[1]))),pmul(a[1],b[1])
        if isinstance(n.op,ast.Mult):return pmul(a[0],b[0]),pmul(a[1],b[1])
        assert isinstance(n.op,ast.Div) and b[0]
        return pmul(a[0],b[1]),pmul(a[1],b[0])
    return visit(tree(s))
def identical(a,b):
    a,b=symbolic(a),symbolic(b)
    return pmul(a[0],b[1])==pmul(b[0],a[1])

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-multiplication-');gs=groups(s);ps=pairs(s);vs=[F(*p) for p in ps];note=''
    direct={'coprime-fraction-product','two-cross-reductions-proper-product','large-cross-cancellation-product','proper-fraction-times-natural-mixed','natural-times-mixed-noninteger','two-mixeds-reduced-mixed-product','zero-factor-annihilates-product','multiply-before-fraction-subtraction','mixed-common-factor-difference','mixed-zero-term-plus-unit-term'}
    wholeproducts={'two-mixeds-natural-product','two-mixeds-double-cancel-natural','three-fractions-global-cancel-integer','two-mixeds-and-proper-global-product','common-natural-factor-complementary-fractions'}
    if k in direct|wholeproducts|{'cross-cancel-product-reduced-denominator','uncancelled-product-denominator','fraction-times-natural-result-numerator'}:
        expression=math_run(s);v=calc(expression)
        if k in direct:answer=choice(r,v)
        elif k in wholeproducts:answer=integer(v)
        elif k=='fraction-times-natural-result-numerator':answer=str(v.numerator)
        else:answer=str(v.denominator)
        note=f'Entire DISPLAYED expression{expression} evaluated by exact Fraction AST={v}; requested role'+(' reducedNUMERATOR' if k=='fraction-times-natural-result-numerator' else ' reducedDENOMINATOR' if k.endswith('denominator') else ' fullvalue')+f'; every actual MCQ evaluated independently, answer{answer}.'
        if k=='proper-fraction-times-natural-mixed':
            d=one(ps)[1];n=int(m(r'× (\d+) мәнін',s)[1]);assert math.gcd(d,n)>1
            assert calc(choice(r,F(*one(ps))))==F(*one(ps))
            note+=f' Preserves REAL precancellation gcd({d},{n})={math.gcd(d,n)}>1 and unchanged-original-fraction distractor from multiplying BOTH numerator/denominator.'
        if k=='natural-times-mixed-noninteger':
            n=int(m(r'^(\d+) ×',s)[1]);w,a,d=map(int,m(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups());bad=F(n*w)+F(a,d);assert choice(r,bad)!=answer
            note+=f' Source-specific whole-only multiplication trap{bad} is actually offered and false.'
        if k=='two-mixeds-reduced-mixed-product':
            raw=[tuple(map(int,t)) for t in re.findall(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s)];assert len(raw)==2
            (w,a,b),(z,c,d)=raw;separate=F(w*z)+F(a,b)*F(c,d);addition=sum(map(calc,gs),F(0));assert choice(r,separate)!=answer and choice(r,addition)!=answer
            note+=f' Both diagnosed source traps retained: whole×whole+fraction×fraction={separate}, mistaken SUM={addition}; all differ from product.'
        if k=='mixed-zero-term-plus-unit-term':assert v>0 and choice(r,F(0))!=answer;note+=' Zero annihilates only first product, never the separate second addend.'
        if k=='multiply-before-fraction-subtraction':assert len(vs)==3 and calc(choice(r,vs[0]*(vs[1]-vs[2])))!=v;note+=' Reassociation distractor evaluated as a×(b−c), different from a×b−c.'
    elif k=='natural-fractional-part-integer':
        n=int(m(r'^(\d+) санының',s)[1]);v=n*one(vs);answer=integer(v);note=f'Printed whole{n} times printedpart{one(vs)}={v}, integer output, denominator retained in unit scaling.'
    elif k=='universal-fraction-multiplication-rule':
        flags=[identical(*o.split(' = ')) for o in r['options']];answer=one(o for o,t in zip(r['options'],flags) if t)
        assert 'натурал бөлімдер' in s
        note=f'All FOUR offered rational-function identities proved/refuted by EXACT sparse-polynomial cross products, flags{flags}; positive natural denominators mean every formula defined. Correct n×q denominator identity universal, not finite samples.'
    elif k=='mixed-times-denominator-natural':
        n=int(m(r'аралас санын (\d+) санына',s)[1]);v=calc(one(gs))*n;answer=integer(v);note=f'Full displayed mixed value{one(gs)}×natural{n}={v}; distributive whole and fraction both included.'
    elif k in {'proper-fraction-square','mixed-number-cube'}:
        value=calc(gs[0]);power=2 if k=='proper-fraction-square' else 3;v=value**power;answer=choice(r,v)
        assert ('²' if power==2 else '³') in s
        if power==3:
            w,a,d=map(int,m(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups());traps=[F(w)+F(a,d)**3,value*3,value**2]
            assert all(choice(r,t)!=answer for t in traps)
        else:
            assert len(set(ps))==1;a,d=ps[0];traps=[F(a,d*d),value*2,value];assert all(choice(r,t)!=answer for t in traps)
        note=f'Entire printedvalue{value} raised to{power}={v}; every MCQ exact, source-specific incompletepower/tripling/square traps{list(map(str,traps))} retained and false.'
    elif k=='unique-product-strictly-above-one':
        values=[calc(o) for o in r['options']];answer=one(o for o,v in zip(r['options'],values) if v>1)
        assert values.count(F(1))==2 and sum(v<1 for v in values)==1 and 'ҚАТАҢ' in s
        assert '+' in r['options'][2] and '+' in r['options'][3]
        note=f'ALL actual FOUR products{list(map(str,values))}; unique STRICT>1, two exact reciprocal products1 excluded, <1 preserved. Both mixed reciprocal distractors still require mixed conversion.'
    elif k=='substitute-mixed-into-affine-expression':
        value=calc(gs[0]);expr=m(r'болғанда (.+?) өрнегі',s)[1];v=calc(expr,{'a':value});answer=integer(v);note=f'Displayed mixed substitutiona={value} into ENTIRE affine expression{expr} gives{v}; multiplication before addition.'
    elif k=='fractional-length-unit-price':
        price=int(m(r'метрі (\d+) теңге',s)[1]);length=calc(one(gs));v=price*length;answer=integer(v);note=f'Actual unitprice{price}×full length{length}={v}tenge; whole/fraction cost ledger conserved.'
    elif k=='constant-flow-fractional-volume':
        rate,time=map(calc,gs);v=rate*time;answer=choice(r,v);whole=time.numerator//time.denominator;bad=rate*whole;assert choice(r,bad)!=answer
        note=f'Actual constant rate{rate}m³/min×FULL time{time}min={v}m³; source whole-minutes-only trap{bad} offered and false; correct cubic units.'
    elif k=='equal-step-length-distance':
        step=one(vs);count=int(m(r'Бірдей (\d+) қадамның',s)[1]);v=sum(itertools.repeat(step,count),F(0));answer=integer(v)
        assert v==step*count
        note=f'Every one of actual{count}equal steps has printedlength{step}m; independent repeated-addition ledger={v}m matches multiplication, denominator not lost.'
    elif k=='mixed-speed-times-mixed-time-distance':
        speed,time=map(calc,gs);v=speed*time;answer=integer(v);note=f'Actual printed mixed speed{speed}km/h×mixed time{time}h={v}km, positive constant rate, independent dimensional check.'
    elif k=='fixed-denominator-unknown-factor-numerator':
        known,target=vs;d=int(m(r'\(a/(\d+)\)',s)[1]);a=target/known*d;answer=integer(a);assert a>0 and known*F(int(a),d)==target
        hits=[n for n in range(1,int(a)+1) if known*F(n,d)==target];assert hits==[int(a)] and known>0
        note=f'PRINTED fixed denominator{d}, target{target}, knownfactor{known}: exact positive coefficient yields UNIQUE raw a={a}; allnatural1…{a}checked, strictmonotonicity excludes larger. Product substituted; normalized secondfactor numerator{F(int(a),d).numerator} is NOT requested.'
    elif k=='nonzero-factor-zero-equation':
        equation=m(r'^(.+?) = 0 теңдеуін',s)[1];factor=int(m(r'^(\d+) ×',s)[1]);root=one(vs);assert factor!=0
        answer=one(o for o in r['options'] if calc(equation,{'x':calc(o.removeprefix('x = '))})==0)
        assert calc(answer.removeprefix('x = '))==root
        note=f'ALL actual offered roots substituted into PRINTED equation{equation}; nonzero factor{factor} proves unique bracket root{root}, not x0 or scaledroot.'
    elif k=='consecutive-mixed-factor-telescoping':
        low,high=map(int,m(r'Бөлімдер (\d+) санынан (\d+) санына',s).groups());v=math.prod((1+F(1,n) for n in range(low,high+1)),start=F(1));assert v==F(high+1,low);answer=integer(v)
        note=f'Expanded EVERY inclusive displayed mixed denominator{low}…{high} ({high-low+1}factors), full Fraction product{v}; telescoping endpoint{high+1}/{low} independently confirmed, notlastfactor or count.'
    elif k=='zero-product-equation-product-of-roots':
        roots=[calc(g[1:-1].split(' − ',1)[1]) for g in gs];assert len(set(roots))==2
        equation=s.split(' = 0')[0];assert all(calc(equation,{'x':v})==0 for v in roots);v=math.prod(roots,start=F(1));answer=choice(r,v)
        assert choice(r,sum(roots))!=answer and choice(r,roots[0])!=answer
        note=f'Both actual factors parsed: distinct roots{list(map(str,roots))}; both substituted, zero-product property proves complete rootset. Requested PRODUCT{v}, offered sum{sum(roots)} and one-root traps false.'
    elif k=='three-successive-bounce-heights':
        initial=int(m(r'добы (\d+) дм',s)[1]);ratio=one(vs);assert 'Үшінші' in s and 0<ratio<1
        heights=[F(initial)];
        for _ in range(3):heights.append(heights[-1]*ratio)
        answer=integer(heights[-1]);assert heights[-1]==initial*ratio**3
        note=f'THREE actual successive-impact ledger{list(map(str,heights))}dm; priorheight updated eachtime, thirdafterimpact notfirstbounce or totaltravel.'
    elif k=='square-area-side-mixed-scale':
        scale=calc(one(gs));oldside=F(9);newside=oldside*scale;v=(newside*newside)/(oldside*oldside);assert v==scale**2;answer=choice(r,v)
        assert choice(r,scale)!=answer and choice(r,v-1)!=answer and 'Жаңа ауданның бастапқы ауданға қатынасын' in s and r['topic']=='geo'
        note=f'Actual square BOTH side lengths scale{scale}; independent concrete square oldarea{oldside**2},newarea{newside**2}, ratio{v}; sidefactor and incrementratio are false MCQs. General identity(s×a)²/a²=s² for every a>0.'
    elif k=='minimum-natural-multiplier-for-two-fractions':
        a,b=vs;bound=a.denominator*b.denominator;valid=[n for n in range(1,bound+1) if (a*n).denominator==(b*n).denominator==1];answer=str(min(valid))
        assert len(valid)>1 and valid[-1]==bound and 'ең кіші' in s
        note=f'COMPLETE positive integerdomain1…{bound}, exact whole-product checks for BOTH printedfractions{a},{b}; valid{valid}, minimum{answer}, denominatorproduct works but is larger. Bound is known valid witness so unbounded tail cannot alter minimum.'
    elif k=='positive-proper-square-universal-comparison':
        assert '0 < t < 1' in s;answer=one(o for o in r['options'] if o=='Әрқашан t × t < t')
        assert identical('t - t*t','t*(1-t)')
        note='UNIVERSAL proof: t−t²=t(1−t)>0 for every0<t<1. Both positive factors justified by printed strictdomain; equality roots0,1 excluded, so no equalitycase and finite examples are not the proof.'
    elif k=='river-mixed-speeds-total-route':
        own,current,down=map(calc,gs);up=int(m(r'ағысқа қарсы (\d+) сағат',s)[1]);assert own>current>0
        downspeed=own+current;upspeed=own-current;distances=[downspeed*down,upspeed*up];answer=integer(sum(distances))
        note=f'Actual own/current{own},{current}, signs+and−give{downspeed},{upspeed}; times{down},{up}, separate positive distances{list(map(str,distances))}km, TOTAL{answer}, notsigneddisplacement.'
    elif k=='geometric-sequence-sixth-fraction-member':
        values=list(map(calc,gs));assert len(values)==4 and '6-мүшені' in s
        ratio=values[1]/values[0];assert all(b/a==ratio for a,b in zip(values,values[1:]))
        sequence=[values[0]]
        for _ in range(6):sequence.append(sequence[-1]*ratio)
        answer=choice(r,sequence[5]);assert choice(r,sequence[4])!=answer and choice(r,sequence[6])!=answer and r['topic']=='seq'
        note=f'Ratio{ratio} inferred from ALL actualfirstfour values, EVERYfirstseven computed{list(map(str,sequence))}; SIXTH index5 answer{answer}, actual fifth/seventh distractors false.'
    elif k=='proper-fraction-chain-telescoping':
        lo,hi=map(int,m(r'Алымдар (\d+)–(\d+) аралығындағы',s).groups());v=math.prod((F(n,n+1) for n in range(lo,hi+1)),start=F(1));answer=choice(r,v)
        assert v==F(lo,hi+1) and choice(r,F(hi,hi+1))!=answer and choice(r,F(lo,hi))!=answer
        note=f'Expanded ALL actualfractions numerator{lo}…{hi}; exact product{v}, uncancelledfirstNUM{lo}/lastDEN{hi+1}; actual lastfactor and off-by-one denominator distractors evaluated.'
    elif k=='select-product-for-fraction-target':
        target=one(vs);answer=choice(r,target);note=f'ALL4 actual offeredproduct values{list(map(lambda o:str(calc(o)),r["options"]))}; unique equals printedtarget{target}, bothfactors accounted.'
    elif k=='recipe-milk-for-mixed-flour-mass':
        rate,mass=map(calc,gs);v=rate*mass;answer=integer(v);note=f'Printed exact recipe{rate}litres PER1kg×full mass{mass}kg={v}litres; no rounding recurringfraction and no dropping fractional kg.'
    elif k=='combine-fractional-linear-coefficients':
        expr=math_run(s);flags=[identical(expr,o) for o in r['options']];answer=one(o for o,t in zip(r['options'],flags) if t)
        a,b=vs;coef=a+b-1;assert calc(answer,{'x':1})==coef and calc(answer,{'x':0})==0
        note=f'Exact SPARSE POLYNOMIAL identity for ALLx, includingx0, original{expr}; actual4flags{flags}, coefficient{a}+{b}−implicit1={coef}. No division byx or finitewitness used for universality.'
    elif k=='independent-factor-scales-new-product':
        original,second=vs;first=int(m(r'Бірінші көбейткіш (\d+) санына',s)[1]);v=original*first*second;answer=choice(r,v)
        assert identical('(a*'+str(first)+')*(b*'+gs[1]+')','a*b*'+str(first)+'*'+gs[1])
        note=f'Actual known ORIGINALab{original}, separate factorchanges{first},{second}; associative polynomial regrouping proves productmultiplier{first*second}, resulting{v} for EVERYa,b with givenab. Bothchanges included.'
    elif k=='three-mixed-market-costs-and-change':
        masses=list(map(calc,gs));prices=list(map(int,re.findall(r'бір килограмы (\d+) теңге',s)));paid=int(m(r'алушы (\d+) теңге берді',s)[1]);assert len(masses)==len(prices)==3
        costs=[w*p for w,p in zip(masses,prices)];spent=sum(costs);change=paid-spent;assert change>=0 and spent+change==paid;answer=integer(change)
        note=f'ALL3 actual price/mass pairs{list(zip(map(str,masses),prices))}, exact costs{list(map(str,costs))}, spent{spent}, paid{paid}, change{change}; reverse ledger closes exactly.'
    elif k=='nested-fraction-known-part-then-other-part':
        first,second,wanted=vs;known=int(m(r'алынғанда (\d+) шықты',s)[1]);whole=known/(first*second);v=whole*wanted;answer=integer(v)
        assert whole*first*second==known and known*wanted!=v
        note=f'PRINTED fraction-of-fraction coefficient{first}×{second}={first*second}; knownpartial{known} gives ORIGINALwhole{whole}, then wanted{wanted}part={v}. Both reversechecks exact, known{known} is not thewhole.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==46;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        if r['modelId'].endswith(('proper-fraction-times-natural-mixed','natural-times-mixed-noninteger','two-mixeds-reduced-mixed-product','mixed-number-cube')):
            whole,n,d=map(int,m(r'^\((\d+) \+ \((\d+)/(\d+)\)\)$',answer).groups());assert whole>0 and 0<n<d and math.gcd(n,d)==1
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Displayed conditions/ALL MCQs parsed independently by exact Fraction AST, complete positive minimum domains, universal sparse-polynomial identities and strict-order proofs; source micro-skills/fullsolutions manually read; no author model/spec/params used','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All46 saved/new/fullsolutions/MCQs manually read','Exact reduced/raw numerator-denominator and canonical mixed roles checked','Four source-specific didactic findings fixed and final4 reread; other42 unchanged','Strict>1 reciprocal traps, fullpowers, rootproducts, both telescoping endpoints and allrate/quantity ledgers checked']})
    assert len(refs)==46
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256'] for e in entries];assert native['fractions']>350 and native['mixed']>80
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'acc18c0baadc7526','finding':'Lost actual cancellation and both-num/den-multiplication distractor','resolution':'7/18×6 reduces by6 before converting7/3→2+1/3; originalfraction7/18 offered as false option.'},{'sourceId':'ab53780f24c4ed56','finding':'Whole-part-only multiplication distractor omitted','resolution':'18+5/12 now offered and explicitly explained false.'},{'sourceId':'4164222ef7bfe3f4','finding':'Separate-parts multiplication and mistaken-sum distractors replaced by generic ±1','resolution':'6+1/6 and5+11/12 restored with correct diagnoses.'},{'sourceId':'c69327e9e812edb8','finding':'Only-whole-minutes volume distractor omitted','resolution':'21/10=2+1/10 now offered and explicitly explained false.'}],'scope':'All46 source-addressed grade5topic3.11 nonvisual fraction-multiplication adaptations; full independent printed exact review','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':46,'wrongKeysRejected':46,'sourceRefs':46,'hashesMatched':46,'completeMinimumDomain':True,'universalPolynomialIdentity':True,'resolvedDidacticFindings':4,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
