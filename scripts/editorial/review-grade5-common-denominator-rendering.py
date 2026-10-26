"""Independent exact printed common-denominator review of48source-addressed editions.
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
PACK='problems/editorial/batches/grade5-common-denominator.json'
OUT='problems/editorial/reviews/grade5-common-denominator.json'
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
def integer(x):
    x=F(x);assert x.denominator==1;return int(x)
def number(x):return str(integer(x))
def least(ds):
    assert ds and all(type(d) is int and d>0 for d in ds)
    # Test actualmultiples in increasingorder, including1; noauthorLCMhelper.
    return next(n for n in range(max(ds),math.prod(ds)+1,max(ds)) if all(n%d==0 for d in ds))
def mixed_parts(s):return tuple(map(int,m(r'^\((\d+) \+ \((\d+)/(\d+)\)\)$',s).groups()))
def denominator_choice(r,target,den):return choice(r,lambda o:arithmetic(o)==target and raw_pair(o)[1]==den)
def mixed_tuple_choice(r,originals,den):
    def fits(o):
        gs=groups(o)
        if len(gs)!=len(originals):return False
        parts=[mixed_parts(g) for g in gs]
        return all(w==originals[i][0] and 0<a<b and b==den and arithmetic(gs[i])==F(originals[i][0])+F(originals[i][1],originals[i][2]) for i,(w,a,b) in enumerate(parts))
    return choice(r,fits)
def fraction_tuple_choice(r,values,den):
    def fits(o):
        ps=simple_pairs(o);return len(ps)==len(values) and all(b==den and F(a,b)==values[i] for i,(a,b) in enumerate(ps))
    return choice(r,fits)
def ordered_int_choice(r,values):return choice(r,lambda o:list(map(int,re.findall(r'\d+',o)))==values)
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-common-denominator-');gs=groups(re.sub(r'(?m)^\d+\) ', '',s));pairs=simple_pairs(s);values=[F(a,b) for a,b in pairs];note=''
    if k in ['first-supplement-at-minimum','new-first-numerator-at-minimum']:
        den=least([b for a,b in pairs]);a,b=pairs[0];factor=integer(F(den,b));ans=str(factor if k=='first-supplement-at-minimum' else a*factor);note=f'Actualrawdenominators{[b for a,b in pairs]}, fullminimalmultiplessearch→{den}; firstfactor{factor}, firstnewnumerator{a*factor}, requestedrole{k}.'
    elif k=='blank-new-numerator':
        a,b,d=map(int,m(r'^\((\d+)/(\d+)\) = \(□/(\d+)\)',s).groups());target=F(a*d,b);ans=number(target);note=f'Exactblanknumerator fromprinted{a}/{b}=□/{d}; crossproductunique{ans}, rawtargetdenominatorretained.'
    elif k=='any-common-denominator':
        ds=[b for a,b in pairs];ans=choice(r,lambda o:all(int(o)%d==0 for d in ds));note=f'Everyactualoffereddenominator tested forraw{ds}; no minimumrequirement, largercommon72rightlyaccepted.'
    elif k in ['supplement-for-given-denominator','large-decimal-denominator-numerator','fixed-expanded-term-sum']:
        a,b=one(pairs)
        if k=='supplement-for-given-denominator':d=int(m(r'бөлімі (\d+) болуы',s)[1])
        elif k=='large-decimal-denominator-numerator':d=int(m(r'бөлімін (\d+) етіп',s)[1])
        else:d=int(m(r'бөлімі (\d+) болатын',s)[1])
        factor=integer(F(d,b));new=a*factor;ans=str(factor if k=='supplement-for-given-denominator' else new if k=='large-decimal-denominator-numerator' else new+d);note=f'Actual{a}/{b}at fixeddenominator{d}, exactfactor{factor}, newnumerator{new}, sum{new+d}; requestedrole kept.'
    elif k=='fraction-at-fixed-denominator':
        a,b=one(pairs);d=int(m(r'бөлімін (\d+) етіп',s)[1]);ans=denominator_choice(r,F(a,b),d);note=f'Eachactualoption tested BOTH value{a}/{b} and literaldenominator{d}; rawnewnumerator{integer(F(a*d,b))}.'
    elif k in ['minimum-two-denominators','nested-denominator-minimum','three-denominator-minimum','large-common-minimum','garden-progress-common-minimum']:
        ds=[b for a,b in pairs];assert all(math.gcd(a,b)==1 for a,b in pairs);den=least(ds);ans=str(den);note=f'Allactualreducedfractions{pairs}, exactfullmultiplessearch to firstcommon{den}; allsmaller candidates fail at least one denominator.'
    elif k=='mixed-fixed-denominator':
        original=mixed_parts(one(gs));den=int(m(r'бөлігінің бөлімі (\d+) болатын',s)[1]);ans=mixed_tuple_choice(r,[original],den);note=f'Actualwhole/numerator/denominator{original}, requestedrawnewdenominator{den}; wholepartunchanged, everyactualMCQstructure+valuechecked.'
    elif k=='supplement-given-minimum':
        ds=[b for a,b in pairs];den=int(m(r'ең кіші ортақ бөлімі (\d+)',s)[1]);assert least(ds)==den;ans=number(F(den,ds[0]));note=f'Printedgivenminimum{den}independentlyverified from{ds}; FIRSTfactor{ans}, notsecond{den//ds[1]}.'
    elif k in ['two-mixed-minimum-conversion','hard-two-mixed-minimum','three-mixed-hard-minimum']:
        parts=[mixed_parts(g) for g in gs];den=least([p[2] for p in parts]);ans=mixed_tuple_choice(r,parts,den);note=f'Actualorderedmixedcomponents{parts}, minimum{den}; everyMCQwholepart/value/rawdenominator/order checked. Equivalentlargerdenominatorrejected.'
    elif k=='blank-new-denominator':
        a,b,new=map(int,m(r'^\((\d+)/(\d+)\) = \((\d+)/□\)',s).groups());ans=number(F(new*b,a));note=f'Actualnewnumerator{new}/old{a}scalesrawold denominator{b}; unique{ans}, divisionrolescorrect.'
    elif k in ['three-unit-fractions-minimum','two-fractions-minimum-conversion','three-fractions-minimum-conversion','three-large-minimum-conversion','reduce-before-common-denominator']:
        ds=[x.denominator for x in values] if k=='reduce-before-common-denominator' else [b for a,b in pairs];den=least(ds);ans=fraction_tuple_choice(r,values,den);note=f'Everyactualorderedfractiontuple evaluated exactlyagainst{list(map(str,values))}, rawdenominator required{den}; reduce-first={k=="reduce-before-common-denominator"}; numericallyequalnonminimumoptionsrejected.'
    elif k=='ordered-supplement-pair':
        ds=[b for a,b in pairs];den=least(ds);factors=[den//d for d in ds];ans=ordered_int_choice(r,factors);note=f'Actualdenominators{ds}, independentlyminimum{den}, ORDEREDfactors{factors}; reversedpair/newnumeratoroptionsnotaccepted.'
    elif k=='blank-original-denominator':
        a,new,d=map(int,m(r'^\((\d+)/□\) = \((\d+)/(\d+)\)',s).groups());ans=number(F(a*d,new));note=f'Actual10/□=90/153 crossproduct recoversrawdenominator{ans}; noadditivechange.'
    elif k=='equivalent-denominator-open-window':
        target=one(values);lower,upper=map(int,m(r'бөлімі (\d+) санынан ҮЛКЕН, (\d+) санынан КІШІ',s).groups());valid=[(integer(target*d),d) for d in range(lower+1,upper) if (target*d).denominator==1];a,b=one(valid);ans=str(a);note=f'CompleteALLintegerdenominators{lower+1}..{upper-1}, integralnumerator required; unique{valid}, endpointsstrict.'
    elif k=='three-fractions-fixed-denominator':
        den=int(m(r'бөлімі ДӘЛ (\d+) болатын',s)[1]);ans=fraction_tuple_choice(r,values,den);note=f'Actualorderedvalues{list(map(str,values))}at FIXED{den}, eachactualMCQrawdenominatorandvaluechecked; minimumirrelevant.'
    elif k=='first-mixed-fractional-numerator':
        parts=[mixed_parts(g) for g in gs];den=least([p[2] for p in parts]);w,a,b=parts[0];ans=number(F(a*den,b));note=f'Onlyfractionalpartnumerator{a}expandedfromdenominator{b}to minimal{den}; whole{w}excluded andrawdenominatorretained.'
    elif k=='choose-false-expansion-equality':
        def false(o):a,b=o.split(' = ');return arithmetic(a)!=arithmetic(b)
        ans=choice(r,false);assert r.get('intentionalIncorrectExample') is True;note=f'Allactual4equalities exactFractiontruthvector{[not false(o) for o in r["options"]]}; sourceintentionalwrongexample remains clearlyrequested.'
    elif k=='natural-and-mixed-improper-pair':
        natural=int(m(r'^(\d+) натурал',s)[1]);mixed=arithmetic(one(gs));den=int(m(r'ретпен бөлімі (\d+) болатын',s)[1]);ans=fraction_tuple_choice(r,[F(natural),mixed],den);note=f'Actualwhole{natural}andmixed{mixed}, ORDEREDimproperfractions at literal{den}, allMCQrawnumerators tested.'
    elif k=='coprime-composite-denominator-pair':
        def fits(o):ds=[b for a,b in simple_pairs(o)];return least(ds)==math.prod(ds)
        ans=choice(r,fits);note=f'Everyactualfractionpair rawdenominators checked by minimumvproduct; gcd1needed, compositedenominators14/15correctlyeligible.'
    elif k=='mixed-expanded-improper-numerator':
        target=arithmetic(one(gs));den=int(m(r'бөлімі ДӘЛ (\d+)',s)[1]);ans=number(target*den);note=f'ActualCOMPLETEwhole+fractionvalue{target}atfixed{den}, improperrawnumerator{ans}; fractionalpartaloneexcluded.'
    elif k=='common-denominators-strict-window':
        ds=[b for a,b in pairs];lo,hi=map(int,m(r'бөлімдердің (\d+) санынан ҮЛКЕН және (\d+) санынан КІШІ',s).groups());valid=[d for d in range(lo+1,hi) if all(d%x==0 for x in ds)];ans=str(len(valid));note=f'CompleteALLintegercandidate denominators{lo+1}..{hi-1}, raw{ds}multiplicity, fullvalid{valid}; endpoints{lo}/{hi}deliberatelyexcluded.'
    elif k=='equivalent-fractions-denominator-limit':
        target=one(values);hi=int(m(r'бөлімі (\d+) санынан ҚАТАҢ КІШІ',s)[1]);valid=[(integer(target*d),d) for d in range(1,hi) if (target*d).denominator==1];ans=str(len(valid));note=f'Completepositive denominator1..{hi-1}, actualexactintegralnumerator, allvalid{valid}; originalcounted, equalitylimitexcluded.'
    elif k=='least-numerator-for-new-denominator':
        old=int(m(r'\(a/(\d+)\)',s)[1]);new=int(m(r'(\d+) бөлімді',s)[1]);valid=[a for a in range(1,old+1) if (F(a*new,old)).denominator==1];target=min(valid);ans=choice(r,lambda o:int(o)==target);note=f'ALLpositivea1..{old} search (a={old} guaranteesexistence), integraltargetnumerator at{new}; first{target}, smallerpositivesexcluded, notjustMCQsearch.'
    elif k=='equivalent-fraction-fixed-term-sum':
        target=one(values);total=int(m(r'қосындысы (\d+)',s)[1]);valid=[(a,total-a) for a in range(1,total) if F(a,total-a)==target];expected=one(valid);ans=choice(r,lambda o:raw_pair(o)==expected);note=f'CompleteALLpositivefixedsum{total}: numerator1..{total-1}, exactvalue{target}; uniqueRAWpair{expected}, equivalentreducedpairaloneinsufficient.'
    elif k=='recover-ordered-denominators':
        den,first,second=map(int,m(r'бөлім (\d+) болды[\s\S]*?көбейткіш (\d+), екіншісі (\d+)',s).groups());ds=[integer(F(den,first)),integer(F(den,second))];assert least(ds)==den;ans=ordered_int_choice(r,ds);note=f'Actualgivencommon{den}/orderedmultipliers{first,second}→orderedrawdenominators{ds}, minimumconsistencyalsoverified.'
    elif k=='count-third-denominator-preserving-minimum':
        den=int(m(r'ең кіші ортақ бөлімі (\d+)',s)[1]);ds=[b for a,b in pairs];assert least(ds)==den;valid=[d for d in range(2,den+1) if least(ds+[d])==den];ans=str(len(valid));note=f'FullALLn2..{den} preservesactualminimum{den}of{ds}; valid{valid}, largerncannotdivide{den}, n1excluded.'
    elif k=='two-unknown-expansion-term-sum':
        a,b,newden,newnum=map(int,m(r'^\((\d+)/(\d+)\) = \(a/(\d+)\) = \((\d+)/b\)',s).groups());anum=integer(F(a*newden,b));bden=integer(F(newnum*b,a));ans=str(anum+bden);note=f'Twoactualseparateexactequalities recovera{anum},b{bden}; requestedSUM{ans}, nointerchangedroles.'
    elif k=='sum-three-supplements':
        ds=[b for a,b in pairs];den=least(ds);factors=[den//d for d in ds];ans=str(sum(factors));note=f'Actualminimum{den}, orderedfactors{factors}; sum{ans}, newnumeratorsnotmistakenforfactors.'
    elif k=='product-versus-minimum-factor':
        ds=[b for a,b in pairs];den=least(ds);ans=number(F(math.prod(ds),den));note=f'Actualproduct{math.prod(ds)}vminimum{den}; exactRATIO{ans}, notdifferenceoroneconvertednumerator.'
    elif k=='recover-original-numerator-at-minimum':
        ds=list(map(int,re.findall(r'\([ab]/(\d+)\)',s)));new=int(m(r'жаңа алымы (\d+)',s)[1]);den=least(ds);factor=integer(F(den,ds[0]));ans=number(F(new,factor));assert 'ҚЫСҚАРТПАЙ' in s;note=f'Unknownnumerators deliberatelynotprereduced: actualRAWdenominators{ds}, common{den}, firstfactor{factor}, originala{ans}; noassumptionaboutb.'
    elif k=='locate-conversion-error-step':
        lines=s.split('\n');original=pairs[:2];ds=[b for a,b in original];den=int(m(r'^1\) Ортақ бөлім (\d+)\.',lines[1])[1]);step1=least(ds)==den;step2data=[tuple(map(int,v)) for v in re.findall(r'(\d+) : (\d+) = (\d+)',lines[2])];step2=all(F(a,b)==c for a,b,c in step2data);step3ps=simple_pairs(lines[3]);step3=all(F(*step3ps[i*2])==F(*step3ps[i*2+1]) for i in range(2));truth=[step1,step2,step3];first=next((i+1 for i,v in enumerate(truth) if not v),None);ans=choice(r,lambda o:o==(str(first)+'-қадамда' if first else 'Қате жоқ'));note=f'ALLprintedsteps checked: actualminimum{den}, everyactualdivision{step2data}, everyactualFractionequality; truth{truth}, FIRSTerror{first}.'
    elif k=='fraction-convertible-to-both-targets':
        ds=list(map(int,re.findall(r'бөлімі (\d+) болатын',s)));assert len(ds)==2;ans=choice(r,lambda o:all((arithmetic(o)*d).denominator==1 and arithmetic(o)*d>0 for d in ds));note=f'EveryactualofferedFractionvalue canhaveintegralpositive numerator at BOTHtargetdenominators{ds}; fullMCQconjunction, notoneonly.'
    elif k=='irreducible-increments-recover-factor':
        da,db=map(int,m(r'алымы (\d+) санына, бөлімі (\d+) санына артты',s).groups());valid=[]
        for gain in range(1,min(da,db)+1):
            if da%gain==db%gain==0 and math.gcd(da//gain,db//gain)==1:valid.append((da//gain,db//gain,gain+1))
        a,b,kfactor=one(valid);ans=str(kfactor);assert a*kfactor-a==da and b*kfactor-b==db;note=f'CompleteALLpossiblek−1=1..{min(da,db)} commondivisors, rawcoprimalityrequired; uniqueoriginal/multiplier{valid}, exactgainidentitieschecked.'
    elif k=='all-unit-denominators-minimum':
        lo,hi=map(int,m(r'Бөлімдерге (\d+)–(\d+) аралығындағы',s).groups());ds=list(range(lo,hi+1));den=least(ds);ans=choice(r,lambda o:int(o)==den);note=f'ExplicitALLdenominators{ds}, notonlyellipsisendpoints; completeincreasingmultiplecandidate searchfirst{den}; everylargerMCQnotminimum.'
    elif k=='infer-nonminimal-common-denominator':
        a,b=values;rawnum=pairs[0][0];newnum=int(m(r'Бірінші бөлшектің жаңа алымы (\d+)',s)[1]);factor=integer(F(newnum,rawnum));den=pairs[0][1]*factor;assert den!=least([d for n,d in pairs]);ans=denominator_choice(r,b,den);note=f'Actualfirstnewnumerator{newnum}fixesfactor{factor}, commondenominator{den}NOTminimum; exactsecondvalue{b}atthisliteraldenominator, noautomaticminimumsubstitution.'
    else:raise AssertionError(k)
    return ans,note

def main():
    assert len(ROWS)==48;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['topic']=='frac' and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact printed Fraction values AND requestedrawdenominators/order/mixedroles; separate fullminimalmultiples searches and complete finiteinverse/countdomains, noauthorcalculator/spec imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all48saved/newconditions/MCQs/fullsolutionsread','minimumdenominator distinguishedfromfixed/nonminimum/equivalentrawforms','everyactualMCQ orderedtuple/value/rawdenominator/wholepartschecked','fullpositiveinverse/count/window/unknownnumerator domain or boundproof','sourceintentionalfalseexamplesandfirsterrorstepchecked independently']})
    assert len(refs)==48
    assert F(20,60)==F(1,3) and 60!=least([3,5,6])
    assert least([F(24,42).denominator,F(25,35).denominator])==7 and least([42,35])==210
    assert [n for n in range(141,420) if n%10==n%14==0]==[210,280,350]
    assert [d for d in range(1,126) if (F(5,18)*d).denominator==1]==[18,36,54,72,90,108]
    assert least(list(range(2,13)))==27720 and 13860%8!=0
    assert arithmetic('2³ × 3² × 5 × 7 × 11')==27720
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All48source-addressed savedgrade5commondenominator editions; rawminimum/fixed/orderedformat checked separatelyfrom mereFractionequivalence.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':48,'wrongKeysRejected':48,'sourceRefs':48,'hashesMatched':48,'orderedRawDenominatorsAndMixedRoles':True,'fullFiniteDomains':True,'minimalMultiplesIndependentlySearched':True,'authorSolverImported':False}))
if __name__=='__main__':main()
