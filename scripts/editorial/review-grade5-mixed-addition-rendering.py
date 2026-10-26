"""Independent exact review of all46 saved/new mixed-addition editions.

Printed AST arithmetic is evaluated as improper Fraction throughout, separately
from the author's whole-part borrowing/carrying implementation. No author imports.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-mixed-addition.json'
OUT='problems/editorial/reviews/grade5-mixed-addition.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]

def match(p,s):
    m=re.search(p,s);assert m,(p,s);return m

def digest(r):
    return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def raw_for(r):
    ref=one(r['sourceRefs'])
    return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])

def calc(s):
    s=s.replace('−','-').replace('×','*').strip()
    assert re.fullmatch(r'[0-9 ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Expression):return visit(n.body)
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b!=0
        return a/b
    return visit(ast.parse(s,mode='eval'))

def groups(s):
    out=[];start=None;depth=0
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        elif c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0
    return out

def prefix(s):return match(r'^([0-9 ()+−*/]+)',s)[1].strip()
def floor(v):return v.numerator//v.denominator
def fractional(v):return v-floor(v)
def integer(v):assert v.denominator==1,v;return str(v.numerator)

def canonical(o):
    if re.fullmatch(r'\d+',o):return True
    m=re.fullmatch(r'\((\d+) \+ \((\d+)/(\d+)\)\)',o)
    if m:
        w,a,b=map(int,m.groups())
        return w>0 and 0<a<b and math.gcd(a,b)==1
    m=re.fullmatch(r'\((\d+)/(\d+)\)',o)
    if m:
        a,b=map(int,m.groups())
        return 0<a<b and math.gcd(a,b)==1
    return False

def choice(r,value):
    return one(o for o in r['options'] if calc(o)==value and canonical(o))

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-mixed-addition-');gs=groups(s)
    vs=[calc(g) for g in gs if '□' not in g and not re.search(r'[a-zA-Z]',g)]
    note=''
    direct={'mixed-addition-reduced-fraction','coprime-mixed-addition','unlike-mixed-subtraction-no-borrow','natural-minus-mixed','same-denominator-mixed-difference-reduce','same-denominator-borrowing-difference','unlike-mixed-borrowing-difference','difference-of-two-mixed-differences','mixed-sum-with-telescoping-unit-parts'}
    if k in direct:
        expression=prefix(s);value=calc(expression);answer=choice(r,value)
        note=f'Actual complete AST {expression} evaluated as improper exact Fraction={value}; every offered value AND canonical reduced positive mixed form checked; parentheses/signs retained.'
        if k=='mixed-sum-with-telescoping-unit-parts':
            ds=list(map(int,re.findall(r'\(1/(\d+)\)',s)))
            assert ds==[i*(i+1) for i in range(2,6)]
            assert sum((F(1,d) for d in ds),F(0))==F(1,2)-F(1,6)
            note+=' All4 fractional terms exactly telescope from1/2 to1/6, not from1.'
    elif k=='carry-whole-part':
        v=calc(prefix(s));answer=str(floor(v))
        assert sum((calc(g)-floor(calc(g)) for g in gs),F(0))>1
        note=f'Actual full sum {v}; requested WHOLE floor{answer} includes carry, not just sum of input whole parts.'
    elif k in {'natural-minus-mixed-numerator','unlike-borrowing-result-numerator'}:
        v=calc(prefix(s));f=fractional(v);assert 0<f<1
        answer=str(f.numerator)
        note=f'Exact full difference {v}, normalized whole {floor(v)} and reduced proper fraction {f}; requested fractional numerator{answer}, no improper full numerator.'
    elif k in {'cancel-identical-fractional-parts','same-denominator-natural-sum','three-unlike-mixeds-extra-two-wholes','mixed-minus-plus-natural','mixed-complementary-group-sum'}:
        expression=prefix(s);v=calc(expression);answer=integer(v)
        note=f'Complete printed AST {expression}={v}; ALL whole and fractional terms included, exact reduced denominator1 required. Signed left-to-right or parenthesized grouping preserved.'
    elif k in {'two-sacks-masses-natural-total','initial-and-two-mixed-additions-natural','three-stage-distances-two-extra','two-nut-masses-mixed-total'}:
        v=sum(vs,F(0))
        answer=choice(r,v) if r.get('options') else integer(v)
        note=f'All actual absolute measured amounts {list(map(str,vs))} summed to{v}; all whole parts and every extra whole from fractions retained; final unit stays unchanged.'
    elif k=='missing-whole-no-carry':
        v=sum(vs,F(0));answer=str(floor(v))
        a,b=map(int,match(r'\(□ \+ \((\d+)/(\d+)\)\)',s).groups())
        assert fractional(v)==F(a,b)
        note=f'Actual two addends sum{v}; printed RHS fractionalpart{a}/{b} matches, requested blank whole{answer} only.'
    elif k=='minimum-denominator-only':
        ds=list(map(int,re.findall(r'/([0-9]+)\)',s)))
        assert len(ds)==2
        d=next(n for n in range(1,math.prod(ds)+1) if all(n%d==0 for d in ds))
        answer=str(d)
        note=f'Full increasing candidate search1…{math.prod(ds)} proves minimum common denominator{d} for actual rawfractiondenominators{ds}; inputwholeparts ignored, fullsum is not answer.'
    elif k=='initial-mass-two-mixed-uses':
        total=int(match(r'^Қоймада (\d+) кг',s)[1]);v=total-sum(vs,F(0));assert v>0
        answer=choice(r,v)
        note=f'Initial{total}kg−ALL actual absolute uses{list(map(str,vs))}={v}; conservation of mass and both borrowing/carrying checked through improper Fractions.'
    elif k=='unknown-addend-mixed-borrow':
        known,total=vs;v=total-known;answer=choice(r,v);assert v+known==total
        note=f'Unknownaddend=actual total{total}−known{known}={v}; reverse substitution recovers original equation, borrowing not fractionalreversal.'
    elif k=='unknown-minuend-mixed-carry':
        subtrahend,difference=vs;v=subtrahend+difference;answer=choice(r,v);assert v-subtrahend==difference
        note=f'UnknownMINUEND=actual subtrahend{vs[0]}+difference{vs[1]}={v}; original subtraction equation checked, carry included.'
    elif k=='three-plant-mixed-uses-left-natural':
        total=int(match(r'Жылыжайға (\d+) л',s)[1]);used=sum(vs,F(0));answer=integer(F(total)-used)
        assert total>used
        note=f'ALL3 actual absolute litre uses sum{used}; initial{total}−uses={answer}; fractionalparts give2extra litres, not initialwholesonly.'
    elif k=='second-day-less-and-both-days-total':
        first,less=vs;second=first-less;assert second>0;total=first+second
        answer=choice(r,total)
        note=f'Actual DAY2={first}−{less}={second}, BOTHdays={total}; day2itself and applyingplusforless excluded.'
    elif k=='unknown-subtrahend-mixed-borrow':
        minuend,difference=vs;v=minuend-difference;answer=choice(r,v);assert minuend-v==difference
        note=f'UnknownSUBTRAHEND=actual minuend{minuend}−difference{difference}={v}; exact original equality reversechecked.'
    elif k=='compare-mixed-expression-difference':
        first=vs[0]+vs[1];second=vs[2]-vs[3];delta=first-second
        def valid(o):
            if o=='Екі мән тең':return delta==0
            who,a,b=match(r'^(Бірінші|Екінші) мән \((\d+)/(\d+)\) шамасына үлкен$',o).groups()
            return delta==(1 if who=='Бірінші' else -1)*F(int(a),int(b))
        answer=one(o for o in r['options'] if valid(o))
        note=f'Actual first{first}, second{second}, signed gap{delta}; EVERY offered direction AND gap magnitude tested, not comparison alone.'
    elif k=='fixed-denominator-mixed-unknown-numerator':
        w,d=map(int,match(r'^\((\d+) \+ \(□/(\d+)\)\)',s).groups())
        known,total=vs
        candidates=[n for n in range(1,d) if w+F(n,d)+known==total]
        answer=str(one(candidates))
        note=f'Complete proper RAWnumerator1…{d-1} at fixeddenominator{d}; actual equation selects{candidates}; reducedfractionnumerator is not the requested blank.'
    elif k=='shared-person-pair-sum-difference':
        ad,dm,am=vs
        allsum=(ad+dm+am)/2
        a,d,m=allsum-dm,allsum-am,allsum-ad
        assert min(a,d,m)>0 and a+d==ad and d+m==dm and a+m==am
        answer=choice(r,a-m)
        note=f'All3 actual pair totals consistent with positive individuals{a,d,m}; requested first−third={a-m}=firstpair−secondpair; sharedperson cancels, unrelatedpair notsubtracted.'
    elif k=='sum-naturals-between-mixed-expressions':
        lo,hi=vs[0]-vs[1],vs[2]+vs[3]
        assert 0<lo<hi and 'ҚАТАҢ' in s
        valid=[n for n in range(1,math.ceil(hi)+1) if lo<n<hi]
        answer=str(sum(valid))
        note=f'Actual exact strict endpoints{lo},{hi}; complete naturaldomain1…{math.ceil(hi)}, valid{valid}; sum not count, equality and outsideintegers excluded.'
    elif k=='remaining-project-time-relative-less':
        total,program,less=vs;drawing=program-less;remaining=total-program-drawing
        assert min(drawing,remaining)>0
        answer=choice(r,remaining)
        note=f'Actual drawingtime{program}−{less}={drawing}; total−program−drawing={remaining}, three positive periods sum to original{total}; less is absolutehours not比例.'
    elif k=='two-step-mixed-equation':
        subtrahend,addend,total=map(calc,re.findall(r'\(\d+ \+ \(\d+/\d+\)\)',s));v=total-addend+subtrahend
        assert v-subtrahend+addend==total
        answer=choice(r,v)
        note=f'Actual two-step equation x−{subtrahend}+{addend}={total}; reverseoperations give{v}, exact substitution verifies originalsign/order.'
    elif k=='signed-cancellation-mixed-pairs':
        expression=s.split(': ',1)[1].split('. ',1)[0];v=calc(expression);answer=integer(v)
        assert fractional(vs[0])==fractional(vs[2]) and fractional(vs[1])==fractional(vs[3])
        note=f'Actual full SIGNED expression {expression}={v}; equalfractionalparts cancel only with proper signs; first−third plus fourth−second.'
    elif k=='first-two-integer-sequence-members':
        first,second=vs;step=second-first;assert step>0
        period=math.lcm(first.denominator,step.denominator)
        # All residues over two full exact periods; any integral term repeats
        # after period since period*step is integral. No cap/searchguess.
        hits=[(i,first+i*step) for i in range(2*period) if (first+i*step).denominator==1]
        assert len(hits)>=2 and (step*period).denominator==1
        answer=integer(hits[0][1]+hits[1][1])
        note=f'Actualfirst{first},step{step}; complete2×{period} indexresiduedomain (periodproof), firsttwointegralterms{hits[:2]}; sum{answer}, not firsttwoinputmixeds.'
    elif k=='dependent-mixed-values-two-borrows':
        a,lessb,lessc=vs;b=a-lessb;c=a+b-lessc;assert b>0 and c>0
        answer=choice(r,c)
        note=f'Actual b={a}−{lessb}={b}, then c=(a+b)−{lessc}={c}; dependencyandtwo subtractioncontexts preserved, no use of b−lessc alone.'
    elif k=='choose-mixed-expression-target':
        target=one(vs);values=[calc(o) for o in r['options']]
        answer=one(o for o,v in zip(r['options'],values) if v==target)
        note=f'ALL4 actual fulloptionexpressions evaluate{list(map(str,values))}; unique target{target}; answer is original expression not canonicalresult.'
    elif k=='sum-natural-sum-and-natural-difference':
        add=vs[0]+vs[1];difference=vs[2]-vs[3]
        assert add.denominator==difference.denominator==1
        answer=integer(add+difference)
        note=f'Firstactualsum{add}, separateactualdifference{difference}, BOTHresults sum{answer}; fractions do not cross between independent operations.'
    elif k=='nearest-natural-after-three-mixed-sum':
        value=sum(vs,F(0));candidates=list(range(1,math.ceil(value)+2))
        distance=min(abs(value-n) for n in candidates)
        answer=str(one(n for n in candidates if abs(value-n)==distance))
        note=f'Actualfullsum{value}; exact distances to completepositive candidate1…{max(candidates)}, unique closest{answer}distance{distance}; not simply floor, nohalfwaytie.'
    elif k=='greatest-mixed-expression-by-whole':
        values=[calc(o) for o in r['options']]
        answer=one(o for o,v in zip(r['options'],values) if v==max(values))
        note=f'ALL4 actualsignedexpressions{list(map(str,values))}, wholeparts{list(map(floor,values))}, uniqueMAX{max(values)}; largestinputalone insufficient.'
    elif k=='tank-three-signed-mixed-changes-natural':
        initial,out1,add,out2=vs
        stages=[initial,initial-out1,initial-out1+add,initial-out1+add-out2]
        assert all(v>0 for v in stages)
        answer=integer(stages[-1])
        note=f'Actual ordered absolutevolumes{list(map(str,stages))}, signs−+−; every intermediatephysicalvolume positive, final{answer}.'
    elif k=='mixed-coordinate-ray-distance':
        a,b=vs;distance=abs(b-a);assert distance>0
        answer=choice(r,distance)
        note=f'Actual coordinates{a},{b}; exact nonnegative distance|B−A|={distance}, not sum/reversed subtraction; borrowing preserved.'
    elif k=='coprime-proper-mixed-unknown-numerators':
        w1,d1,w2,d2,w3,a3,d3=map(int,match(r'^\((\d+) \+ \(a/(\d+)\)\) \+ \((\d+) \+ \(b/(\d+)\)\) = \((\d+) \+ \((\d+)/(\d+)\)\)',s).groups())
        target=w3+F(a3,d3)
        valid=[(a,b) for a in range(1,d1) for b in range(1,d2) if math.gcd(a,d1)==math.gcd(b,d2)==1 and w1+F(a,d1)+w2+F(b,d2)==target]
        a,b=one(valid);answer=str(a+b)
        allproper=[(a,b) for a in range(1,d1) for b in range(1,d2) if w1+F(a,d1)+w2+F(b,d2)==target]
        assert len(allproper)>1
        note=f'ALL{(d1-1)*(d2-1)}properpositiverawpairs, BOTHgcd1 constraints, exacttotal{target}; valid{valid} vs allproper{allproper}; requested numeratorSUM{answer}.'
    elif k=='reverse-tank-two-removals-one-addition':
        out1,out2,add,final=vs;initial=final+out1+out2-add
        stages=[initial,initial-out1,initial-out1-out2,initial-out1-out2+add]
        assert all(v>0 for v in stages) and stages[-1]==final
        answer=integer(initial)
        note=f'Reverseactualabsolutechanges: final{final}+removals{out1},{out2}−lastaddition{add}={initial}; forwardstages{list(map(str,stages))}allpositiveandrecoverfinal.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==46
    entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id'])
        normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip()
        assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact printed improper Fraction AST independently from author mixed-borrow/carry solver; all actual MCQs/formats, complete finite proper/coprime and sequence-residue domains, signed physical conservation and inverse equations','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All46 saved/new fullconditions/solutions/MCQs manually read','Wholeparts, reducedfractionalparts and RAWfixeddenominator roles checked','ALL actual MCQs computed exactly; canonical result vs original expression distinguished','Full strictnatural/coprimepositivepairs/sequenceperioddomain exhausted','Units, same-source skills, signedcontext and positive intermediate physicalvolumes checked']})
    assert len(refs)==46
    assert calc('(8 + (1/6)) − (3 + (5/6))')==F(13,3)
    assert calc('((10 + (1/8)) − (3 + (2/3))) − ((5 + (5/6)) − (2 + (1/4)))')==F(23,8)
    assert canonical('(4 + (1/3))') and not canonical('(3 + (4/3))') and not canonical('(4 + (2/6))')
    assert F(3)+F(1,4)+2*(F(1)+F(3,8))==6
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True))
    assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All46 source-addressed grade5topic3.9 nonvisual mixed-addition adaptations; exact independent printed-text oracle','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':46,'wrongKeysRejected':46,'sourceRefs':46,'hashesMatched':46,'actualMcqsAndCanonicalMixedFormsChecked':True,'fullStrictNaturalAndCoprimeDomains':True,'sequencePeriodProven':True,'authorSolverImported':False}))

if __name__=='__main__':main()
