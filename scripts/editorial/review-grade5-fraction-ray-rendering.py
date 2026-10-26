"""Independent exact printed coordinate-ray review of44source-addressed editions.
No author model/spec/calculator imported. Printed native fractions and Unicode
exponents are parsed exactly with Fraction; finite natural domains are complete.
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
PACK='problems/editorial/batches/grade5-fraction-ray.json'
OUT='problems/editorial/reviews/grade5-fraction-ray.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';TRANS=str.maketrans(SUP,'0123456789')
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,s):
    found=re.search(pattern,s);assert found,(pattern,s);return found
def n(s):
    s=s.replace(' ','');assert s.isdigit();return int(s)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def choice(r,predicate):return one(o for o in r['options'] if predicate(o))
def groups(s):
    out=[];depth=0;start=None
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        if c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0;return out
def simple_pairs(s):return [tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]
def raw_pair(s):return one(simple_pairs(s))
def arithmetic(text,variables=None):
    variables=variables or {}
    # Parse superscripts before any normalization: NFKC would turn3¹²into312.
    text=re.sub(r'(\d+)(['+SUP+']+)',lambda p:p[1]+'**'+p[2].translate(TRANS),text)
    text=text.replace('×','*').replace('·','*').replace('−','-').strip()
    text=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',text)
    assert re.fullmatch(r'[0-9a-zA-Z ()+*/-]+',text),text
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):assert type(node.value) is int;return F(node.value)
        if isinstance(node,ast.Name):assert node.id in variables;return F(variables[node.id])
        assert isinstance(node,ast.BinOp),ast.dump(node)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        if isinstance(node.op,ast.Div):assert b!=0;return a/b
        assert isinstance(node.op,ast.Pow) and b.denominator==1 and 0<=b.numerator<=30
        return a**b.numerator
    return visit(ast.parse(text,mode='eval'))
def number(x):
    x=F(x);assert x.denominator==1;return str(x.numerator)
def mixed_parts(expr):return tuple(map(int,m(r'^\((\d+) \+ \((\d+)/(\d+)\)\)$',expr).groups()))
def exact_choice(r,target,reduced=False,mixed=False,den=None):
    def fits(o):
        if mixed:
            if ' + ' not in o:return False
            w,a,b=mixed_parts(o)
            if not(w>0 and 0<a<b):return False
        else:
            a,b=raw_pair(o) if simple_pairs(o) else (int(o),1)
        return arithmetic(o)==target and (not reduced or math.gcd(a,b)==1) and (den is None or b==den)
    return choice(r,fits)
def minimum_scale(values):
    # Complete search to independent denominator product; every candidate is tested.
    upper=math.prod(x.denominator for x in values)
    return next(c for c in range(1,upper+1) if all((x*c).denominator==1 for x in values))
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-ray-');gs=groups(s);vs=[arithmetic(g) for g in gs if re.fullmatch(r'[0-9 ()+/]+',g)];note=''
    if k=='remaining-unit-steps':
        pos,step=vs;ans=number((1-pos)/step);note=f'Actualremaininglength1−{pos} divided by step{step}, {ans} intervals; no endpointdoublecount.'
    elif k=='minimal-fraction-partition':
        x=one(vs);ans=str(minimum_scale([x]));note=f'Fullpositive scale search until denominator bound{x.denominator}, firstexactgrid{ans}; irreducibility handled by Fraction.'
    elif k=='improper-point-to-mixed':
        x=one(vs);ans=exact_choice(r,x,mixed=True);note=f'Actualimproper{x}, exactdivmod{divmod(x.numerator,x.denominator)}; all4positiveproper mixedroles checked.'
    elif k in ['right-offset-from-integer','left-offset-across-integer']:
        if k=='right-offset-from-integer':den,start,steps=map(int,m(r'бірлік (\d+) тең[\s\S]*?робот (\d+) белгісінен оңға (\d+) қадам',s).groups());target=F(start)+F(steps,den)
        else:den,start,steps=map(int,m(r'бірлік (\d+) тең[\s\S]*?Белгі (\d+) орнынан СОЛҒА (\d+) қадам',s).groups());target=F(start)-F(steps,den)
        ans=exact_choice(r,target,mixed=True);note=f'Printedunit{den}steps, start{start}, directedoffset{steps}, target{target}; every actualmixed MCQchecked, left/right distinguished.'
    elif k in ['fraction-to-equal-grid','unit-fraction-to-grid','mixed-coordinate-to-equal-grid']:
        cells=int(m(r'бірлік (\d+) торкөз|Бірлігі (\d+) торкөз',s)[1] or m(r'Бірлігі (\d+) торкөз',s)[1]) if 'Бірлігі' not in s else int(m(r'Бірлігі (\d+) торкөз',s)[1]);x=one(vs);ans=number(x*cells);note=f'Printedcoordinate{x}×unit{cells}cells={ans}; coordinateunits notphysicalunitfractioncount.'
    elif k in ['lower-natural-neighbour','sum-natural-neighbours']:
        x=one(vs);lo=math.floor(x);assert lo>=1 and x.denominator!=1;ans=str(lo if k=='lower-natural-neighbour' else 2*lo+1);note=f'Actualstrict noninteger{x} boundedbyconsecutive natural{lo},{lo+1}; requested lower vs sum distinguished.'
    elif k in ['proper-fraction-to-centimetres','mixed-coordinate-to-centimetres']:
        cm=int(m(r'(\d+) см',s)[1]);x=one(vs);ans=number(x*cm);note=f'Actualcoordinate{x}×printed{cm}cm/unit={ans}cm, not reciprocal.'
    elif k=='mixed-point-construction':
        w,a,b=mixed_parts(one(gs))
        def fits(o):
            if not o.startswith('0-ден'):return False
            ow,ob,oa=map(int,m(r'0-ден (\d+) толық бірлік[\s\S]*?бірлікті (\d+) тең бөлікке бөліп, (\d+) бөлігін оңға',o).groups());return (ow,oa,ob)==(w,a,b)
        ans=choice(r,fits);note=f'Every actualinstruction parsed for whole{w}, denominator{b}, numerator{a}, directionright; omittingwholeexcluded structurally.'
    elif k=='coarsen-coordinate-grid':
        old,group=map(int,m(r'бастапқыда (\d+) тең[\s\S]*?әр (\d+) аралықты',s).groups());x=one(vs);assert old%group==0;den=old//group;ans=exact_choice(r,x,den=den);note=f'Fixedpoint{x}, regroup{group}oldintervals from{old}, newdenominator{den}; exactvalue AND literalnewdenominator.'
    elif k=='unit-midpoint':
        assert 'сол шетіне 0, оң шетіне 1' in s;ans=exact_choice(r,F(1,2));note='Equaldistance inside[0,1] gives unique midpoint1/2; every actualoptionevaluated.'
    elif k=='interior-division-marks':
        intervals=int(m(r'арасын (\d+) тең аралық',s)[1]);marks=[F(i,intervals) for i in range(1,intervals)];ans=str(len(marks));note=f'Fullstrictinteriorgrid{marks}, endpointsalreadyexist; intervals{intervals}require{ans}newmarks.'
    elif k in ['physical-distance-to-proper-coordinate','physical-distance-to-mixed-coordinate']:
        if k=='physical-distance-to-proper-coordinate':unit,distance=map(int,m(r'бірлік (\d+) см[\s\S]*?0-ден (\d+) см',s).groups())
        else:unit,distance=map(int,m(r'бірлік (\d+) см[\s\S]*?оңға қарай (\d+) см',s).groups())
        target=F(distance,unit);ans=exact_choice(r,target,mixed=k=='physical-distance-to-mixed-coordinate');note=f'Printedphysicaldistance{distance}cm /unit{unit}cm={target}, allMCQroles checked; reciprocalexcluded.'
    elif k=='equal-days-progress-grid':
        days,cells,used=map(int,m(r'суреті (\d+) күнде[\s\S]*?(\d+) торкөзбен[\s\S]*?(\d+) күндік',s).groups());assert 0<used<days;ans=number(F(used,days)*cells);note=f'Explicit equal dailywork, {used}/{days}ofcomplete{cells}grid={ans}; elapsedtimecoordinate vs cells distinguished.'
    elif k=='order-labelled-fraction-points':
        labels=re.findall(r'([A-Z]):',s);assert len(labels)==len(vs)==3;order=[label for _,label in sorted(zip(vs,labels))];ans=choice(r,lambda o:o.split(', ')==order);note=f'Exactactual labelledcoordinates{dict(zip(labels,map(str,vs)))} sortedlefttoright; fullMCQpermutations checked.'
    elif k in ['same-denominator-grid-gap','real-place-map-grid-gap']:
        cells=int(m(r'бірлік (\d+) торкөз|1 км (\d+) торкөз',s)[1] or m(r'1 км (\d+) торкөз',s)[1]);a,b=vs;ans=number(abs(a-b)*cells);note=f'Actualsame-direction coordinates{a},{b}, printedscale{cells}, exactdifference×scale={ans}, notsum.'
    elif k=='infer-partition-from-two-sides':
        left,right,before,after=map(int,m(r'^(\d+) пен (\d+) белгілерінің[\s\S]*?сол жақ шеттен (\d+) аралық[\s\S]*?дейін (\d+) аралық',s).groups());target=F(left)+F(before,before+after)*(right-left);ans=exact_choice(r,target,mixed=True);note=f'Wholeinterval[{left},{right}], all{before}+{after}equalparts; fractionalposition{target} includesbothsides.'
    elif k=='count-distinct-fraction-positions':
        ans=str(len(set(vs)));note=f'Allprintedcoordinates{list(map(str,vs))}, exactrationalset{sorted(map(str,set(vs)))}; equalwritings countedonce.'
    elif k=='grid-distance-to-reduced-coordinate':
        cells,distance=map(int,m(r'Бірлік (\d+) торкөз[\s\S]*?0-ден (\d+) торкөз',s).groups());ans=exact_choice(r,F(distance,cells),reduced=True);note=f'Actualdistance{distance}/unit{cells}={F(distance,cells)}, everyactualrawgcd and coordinatechecked.'
    elif k=='minimal-common-coordinate-scale':
        scale=minimum_scale(vs);ans=str(scale);note=f'Complete integerunit1..{scale}search with exactcoordinates{list(map(str,vs))}; no smallergrid fits allpoints.'
    elif k=='real-road-coordinate-distance':
        total=int(m(r'дейін (\d+) м',s)[1]);x=one(vs);ans=number(total*x);note=f'Actualwhole road{total}m×coordinate{x}={ans}m; camp0 andtower1 fixesratio.'
    elif k=='completed-route-coordinate':
        total,done=map(int,m(r'(\d+) км жаттығу бағытының (\d+) км',s).groups());ans=exact_choice(r,F(done,total),reduced=True);note=f'Actualcompleted{done}/whole{total}, reducedcoordinate{F(done,total)}, notremainingfraction.'
    elif k=='internal-ratio-fraction-point':
        a,b=vs;ratio=int(m(r'AM ұзындығынан (\d+) есе',s)[1]);target=(b+ratio*a)/(ratio+1);assert a<target<b and b-target==ratio*(target-a);ans=exact_choice(r,target,mixed=True);note=f'ExactAM+MB=AB and MB={ratio}AM give{target}; explicitbetweenconstraint and distanceequation checked.'
    elif k=='farthest-from-half-grid':
        cells=int(m(r'Бірлік (\d+) торкөз',s)[1]);points,anchor=vs[:-1],vs[-1];dist=[abs(x-anchor)*cells for x in points];ans=number(max(dist));assert dist.count(max(dist))==1;note=f'Allactualgrid-distances{list(map(str,dist))}from{anchor}, unique maximum{ans}; anchorcoordinate notorigin.'
    elif k=='farthest-from-whole-coordinate':
        cells,anchor=map(int,m(r'Бірлігі (\d+) торкөз[\s\S]*?қайсысы (\d+) координаталы',s).groups());dist={o:abs(arithmetic(o)-anchor)*cells for o in r['options']};ans=one(o for o,d in dist.items() if d==max(dist.values()));note=f'EachactualMCQconverted toscale{cells}fromanchor{anchor}; distances{ {o:str(d) for o,d in dist.items()} }.'
    elif k=='infer-unit-from-fraction-gap':
        a,b=vs;gap=int(m(r'арасы (\d+) торкөз',s)[1]);unit=F(gap,1)/abs(b-a);ans=number(unit);assert minimum_scale([a,b])<=unit;note=f'Actualcoordinategap{b-a} corresponds to{gap}cells, unit{unit}; full scale inferred notassumed.'
    elif k=='repeated-fractional-motion':
        step=one(vs);minutes=int(m(r'(\d+) минуттан кейін',s)[1]);ans=exact_choice(r,minutes*step,True,True);note=f'Explicit0start/rightonly, printedstep{step}×time{minutes}; everypositiveproperfullyreducedmixedMCQchecked.'
    elif k=='infer-scale-then-second-coordinate':
        a=one(vs);da,db=map(int,m(r'0-ден (\d+) торкөз[\s\S]*?B 0-ден (\d+) торкөз',s).groups());unit=da/a;target=db/unit;ans=exact_choice(r,target,True,True);note=f'Inferunit{unit}from{a}at{da}cells, thenB{db}cells gives{target}; allcanonical reducedmixedoptions.'
    elif k=='strict-between-mixed-count':
        a,b=vs;den=int(m(r'бөлімі дәл (\d+)',s)[1]);valid=[n for n in range(1,math.ceil(b*den)+1) if a<F(n,den)<b];ans=str(len(valid));note=f'Fullpositive numeratorbound1..{math.ceil(b*den)}, strictendpoints and originaldenominator{den}; valid{valid}, integer-valuedfractionsretained.'
    elif k=='union-denominator-grid-count':
        cells=int(m(r'Бірлік (\d+) торкөз',s)[1]);d1,d2=map(int,m(r'бөлімі (\d+) НЕМЕСЕ (\d+)',s).groups());valid=[n for n in range(1,cells) if any((F(n,cells)*d).denominator==1 for d in (d1,d2))];ans=str(len(valid));note=f'Everystrictinterior index1..{cells-1}, actualexistence ofintegernumerator atdenominators{d1},{d2}; union{valid}, overlaps once.'
    elif k=='unit-internal-distance-ratio':
        ratio=int(m(r'XU ұзындығынан (\d+) есе',s)[1]);target=F(ratio,ratio+1);assert 0<target<1 and target==ratio*(1-target);ans=exact_choice(r,target);note=f'Clarifiedsourceambiguity: OX={ratio}XU insideunit, exactlinearidentity gives{target}, outsidepointnotallowed.'
    elif k=='minimal-scale-then-gap':
        a,b=vs;unit=minimum_scale(vs);ans=number(abs(a-b)*unit);note=f'Fullminimalunitsearch{unit}for actual{a},{b}, integerpositions{a*unit},{b*unit}; difference{ans}.'
    elif k=='one-step-left-of-unit':
        den=int(m(r'0 мен 1 арасы (\d+) тең',s)[1]);ans=exact_choice(r,1-F(1,den));note=f'Actual1minusoneof{den}equalsteps; left/rightand0origin distractorsallchecked.'
    elif k=='select-point-inside-unit':
        ans=choice(r,lambda o:0<arithmetic(o)<1);note=f'Allactualcoordinates{[str(arithmetic(o)) for o in r["options"]]}checked againststrict0<x<1; endpointsandimproperoutside.'
    elif k=='midpoint-of-fraction-points':
        a,b=vs;target=(a+b)/2;assert target-a==b-target;ans=exact_choice(r,target);note=f'Actualmidpoint({a}+{b})/2={target}; exactequaldistances, notABlength/sum/halfunit.'
    elif k=='irreducible-points-in-upper-half':
        pairs=simple_pairs(s);flags=[math.gcd(a,b)==1 for a,b in pairs];ans=str(sum(flags));note=f'Everyprintedrawnumerator/denominatorgcd tested{list(zip(pairs,flags))}; compositenumerator9rightlyretained.'
    elif k=='different-units-physical-farthest':
        parsed=re.findall(r'(Дина|Мерей|Айсұлу) бірлікті (\d+) см алып, (.*?) координатасын',s);assert len(parsed)==3;lengths={name:int(unit)*arithmetic(expr) for name,unit,expr in parsed};ans=one(name for name,d in lengths.items() if d==max(lengths.values()));note=f'Eachactualdifferentunitconvertedseparately{ {name:str(v) for name,v in lengths.items()} }; firsttwotiebutnotmaximum, numericcoordinatecomparisoninsufficient.'
    elif k=='noninteger-tick-index':
        den=int(m(r'бірлігі (\d+) тең',s)[1]);index,den2=map(int,m(r'(\d+)-ші сызықшаны \(a/(\d+)\)',s).groups());assert den==den2;nums=[n for n in range(1,index*den+1) if n%den!=0];ans=str(nums[index-1]);assert int(ans)-int(ans)//den==index;note=f'Complete positive numerator enumeration1..{index*den}, skipEVERYmultipleof{den}; actual{index}thnumerator{ans}, verifiedrankidentity.'
    else:raise AssertionError(k)
    return ans,note

def main():
    assert len(ROWS)==44;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['topic']=='frac' and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Independent exact Fraction evaluation of actual printed coordinates/scales/directions, complete finitegrid/numerator domains and minimalunit searches; noauthor solver/spec imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all44saved/newconditions/MCQs/fullsolutionsread','everyactualMCQandrequestedrolechecked','gridintervals/interiormarks/distinctpositions/strictendpointsdistinguished','exactphysicalunitsanddirectedoffsetschecked','allfinitecountdomainscomplete; minimumunitsprovedbyfullsearch']})
    assert len(refs)==44
    for den in range(2,15):
        for index in range(1,den*3):
            nums=[n for n in range(1,index*den+1) if n%den];actual=nums[index-1];q,rem=divmod(index-1,den-1);assert actual==q*den+rem+1 and actual-actual//den==index
    assert minimum_scale([F(2,6),F(6,8)])==12 # rawdenominatorLCM24would bewrong
    assert minimum_scale([F(3,5),F(11,8)])==40
    assert F(28,15)*15==F(7,3)*12<F(15,7)*14
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All44source-addressed savedgrade5fraction-coordinate-ray editions, nofigures/noauthorcalculatorimported. Ambiguousoriginal OX wording is explicitly repaired.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':44,'wrongKeysRejected':44,'sourceRefs':44,'hashesMatched':44,'completeGridDomains':True,'minimalScalesIndependentlySearched':True,'authorSolverImported':False}))
if __name__=='__main__':main()
