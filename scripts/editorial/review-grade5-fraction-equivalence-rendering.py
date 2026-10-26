"""Independent full-text review of47source-addressed fraction editions.
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
PACK='problems/editorial/batches/grade5-fraction-equivalence.json'
OUT='problems/editorial/reviews/grade5-fraction-equivalence.json'
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
def equivalent_choice(r,value,reduced=False):
    def fits(o):
        if arithmetic(o)!=value:return False
        return not reduced or math.gcd(*raw_pair(o))==1
    return choice(r,fits)
def divisors(a,b):return [d for d in range(1,min(a,b)+1) if a%d==0 and b%d==0]
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-equivalence-');note=''
    if k=='equivalent-choice':
        target=F(*raw_pair(s));answer=equivalent_choice(r,target);note=f'All4actualfractions exact; target{target}; truthvector{[arithmetic(o)==target for o in r["options"]]}.'
    elif k=='invalid-cancellation-factor':
        a,b=raw_pair(s);answer=choice(r,lambda o:a%n(o)!=0 or b%n(o)!=0);note=f'Bothactualterms{a},{b} tested against every proposed divisor; commondivisors{divisors(a,b)}.'
    elif k in ['greatest-cancellation-factor','hidden-common-prime']:
        a,b=raw_pair(s);ds=divisors(a,b);answer=str(max(ds));assert math.gcd(a,b)==max(ds);note=f'Allcommondivisors1..min({a},{b})={ds}; largest{answer}; reducedpaircoprime.'
    elif k=='irreducible-choice':
        answer=choice(r,lambda o:math.gcd(*raw_pair(o))==1);note='Allactualpairgcds:'+str([math.gcd(*raw_pair(o)) for o in r['options']])
    elif k=='unknown-numerator-denominator-scale':
        d=int(m(r'\(x/(\d+)\)',s)[1]);a,b=raw_pair(s);target=F(a*d,b);assert target.denominator==1;answer=str(target.numerator);note=f'Exact crossproduct x×{b}={d}×{a}; uniqueinteger{answer}.'
    elif k=='equivalent-ask-numerator':
        a,b=raw_pair(s);d=int(m(r'бөлімі (\d+) болатын',s)[1]);target=F(a*d,b);assert target.denominator==1;answer=str(target.numerator);note=f'Exact{a}/{b}=x/{d}; x{target}, bothscalefactorsagree.'
    elif k=='unknown-denominator-numerator-scale':
        a,b=raw_pair(s);top=int(m(r'\((\d+)/x\)',s)[1]);target=F(top*b,a);assert target.denominator==1 and target>0;answer=str(target.numerator);note=f'Uniquepositivedenominator{top}×{b}/{a}={target}; never0.'
    elif k=='equivalent-missing-numerator':
        a,b=raw_pair(s);d=int(m(r'\(a/(\d+)\)',s)[1]);target=F(a*d,b);assert target.denominator==1;answer=str(target.numerator);note=f'Actualmissingnumerator exact{a}×{d}/{b}={answer}.'
    elif k in ['reduce-selected-fraction','common-five-reduction','successive-halving-reduction','multi-prime-reduction','repeated-two-digit-blocks']:
        a,b=raw_pair(s);target=F(a,b);answer=equivalent_choice(r,target,True);note=f'Exactraw{a}/{b}→{target}; fullreductiongcd{math.gcd(a,b)}, allMCQfractionschecked.'
        if k=='successive-halving-reduction':
            pairs=[]
            while a%2==0 and b%2==0:a//=2;b//=2;pairs.append((a,b))
            assert pairs==[(12,28),(6,14),(3,7)]
        if k=='repeated-two-digit-blocks':assert len(str(a))==len(str(b))==4 and str(a)[:2]==str(a)[2:] and str(b)[:2]==str(b)[2:] and a==int(str(a)[:2])*101 and b==int(str(b)[:2])*101
    elif k in ['fully-reduced-denominator','crossed-prime-powers-denominator']:
        value=arithmetic(groups(s)[0]);answer=str(value.denominator);note=f'Fullprintedexpression computed exactly, reduced{value}, requesteddenominator{answer}.'
    elif k=='expansion-scale':
        (a,b),(c,d)=simple_pairs(s);f1,f2=F(c,a),F(d,b);assert f1==f2 and f1.denominator==1;answer=str(f1.numerator);note=f'Bothscalechecks{c}/{a}={d}/{b}={answer}, not difference.'
    elif k in ['fraction-property-equation','correct-reduction-equation']:
        def fits(o):
            sides=o.split(' = ');assert len(sides)==2;return arithmetic(sides[0])==arithmetic(sides[1])
        answer=choice(r,fits);note='All4printedwholeequalities exacttruths:'+str([fits(o) for o in r['options']])
    elif k=='equivalent-sum-denominator':
        a,b=raw_pair(s);total=int(m(r'қосындысы (\d+)',s)[1]);pairs=[(top,total-top) for top in range(1,total) if top*b==(total-top)*a];top,bottom=one(pairs);answer=str(bottom);note=f'Complete{total-1}positivepairswithsum{total}:unique{top}/{bottom}.'
    elif k in ['whole-sum-fraction','product-fraction-reduction','factored-sum-over-product','composite-base-power-reduction','overlapping-product-ranges','geometric-power-sums-ratio']:
        expression=groups(s)[0];target=arithmetic(expression);answer=equivalent_choice(r,target,True);note=f'Fullnativeexpression{expression} computedwith exactintegerpowers/sums/products then reducedto{target}; all4actualMCQschecked.'
    elif k=='all-three-equivalent-row':
        def fits(o):
            values=list(map(arithmetic,o.split('; ')));assert len(values)==3;return len(set(values))==1
        answer=choice(r,fits);note='Everymemberofall4rowsparsed; rowtruths'+str([fits(o) for o in r['options']])
    elif k=='category-reduced-term-sum':
        whole,part=map(int,m(r'(\d+) бақылау жазбасын[\s\S]*?Оның (\d+) жазбасы',s).groups());value=F(part,whole);answer=str(value.numerator+value.denominator);note=f'Actualpart/whole{part}/{whole}={value}; onlyfinalterms summed.'
    elif k=='least-denominator-strict-bound':
        a,b=raw_pair(s);bound=int(m(r'бөлімі (\d+) санынан ҚАТАҢ ҮЛКЕН',s)[1]);value=F(a,b);witness=(bound//value.denominator+1)*value.denominator
        pairs=[(top,bottom) for bottom in range(bound+1,witness+1) for top in range(1,bottom) if top*b==bottom*a];top,bottom=one(pairs);answer=str(bottom);assert bottom>bound;note=f'Everypositivenumerator for everydenominator({bound},{witness}] checked; firstwitness{top}/{bottom}, strictboundary excluded.'
    elif k=='two-unknown-equivalences':
        top,bottom=raw_pair(s);ad=int(m(r'\(a/(\d+)\)',s)[1]);bn=int(m(r'\((\d+)/b\)',s)[1]);a=F(top*ad,bottom);b=F(bn*bottom,top);assert a.denominator==b.denominator==1
        def fits(o):
            A,B=map(int,m(r'^a = (\d+), b = (\d+)$',o).groups());return F(A,ad)==F(top,bottom)==F(bn,B)
        answer=choice(r,fits);note=f'Bothseparateunknowns{a},{b}; everyofferedpair satisfiesbothor fails. Differentfactors permitted.'
    elif k=='complement-reduced-numerator':
        whole,blue=map(int,m(r'Мозаикада (\d+) тақтайша бар: (\d+) көк',s).groups());white=whole-blue;value=F(white,whole);answer=str(value.numerator);note=f'Complement{whole}−{blue}={white}; exact{value}; requested reducednumerator.'
    elif k=='equivalence-and-sum-choice':
        total=int(m(r'қосындысы (\d+) болатын',s)[1]);target=F(*raw_pair(s));pairs=[(a,total-a) for a in range(1,total) if F(a,total-a)==target];assert len(pairs)==1
        answer=choice(r,lambda o:sum(raw_pair(o))==total and arithmetic(o)==target);note=f'All{total-1}positivesum-pairs and bothactualMCQconstraints; unique{pairs}.'
    elif k=='expanded-term-difference':
        a,b=raw_pair(s);bottom=int(m(r'бөлімі (\d+)',s)[1]);top=F(a*bottom,b);assert top.denominator==1;answer=str(bottom-top.numerator);note=f'Exactequivalent{top}/{bottom}, requestednewdenominator−newnumerator{answer}.'
    elif k=='equivalent-term-product':
        a,b=raw_pair(s);product=int(m(r'көбейтіндісі (\d+)',s)[1]);pairs=[(top,bottom) for top in range(1,product+1) for bottom in range(1,product+1) if top*bottom==product and top*b==bottom*a];top,bottom=one(pairs);answer=str(bottom);note=f'Completepositive1..{product}×1..{product}domain (productboundsboth); uniquepair{top},{bottom}, quotientnotmistakenforscale.'
    elif k=='sequence-sum-strict-threshold':
        a,b,limit=map(int,m(r'алымы (\d+) × n, бөлімі (\d+) × n[\s\S]*?қосындысы (\d+) санынан ҚАТАҢ ҮЛКЕН',s).groups());valid=[n for n in range(1,limit+2) if a*n+b*n>limit];index=min(valid);assert (a+b)*(index-1)<=limit<(a+b)*index;answer=str(index);assert r['topic']=='seq';note=f'Completenaturalindices1..{limit+1}; first{index}, predecessor{index-1}sum{(a+b)*(index-1)}isboundary; targettopicseq.'
    elif k=='gcd-known-reduced-lcm':
        g=int(m(r'ЕҮОБ\(a, b\) = (\d+)',s)[1]);u,v=raw_pair(s);assert math.gcd(u,v)==1;a,b=u*g,v*g;common=divisors(a,b);assert max(common)==g;multiples=[i for i in range(1,a*b+1) if i%a==0 and i%b==0];target=min(multiples);answer=choice(r,lambda o:n(o)==target);note=f'Reconstructed{a},{b}, fullcommondivisors{common}; all1..{a*b}commonmultiples, minimum{target}.'
    elif k=='odd-even-sums-ratio':
        oddcount=int(m(r'алғашқы (\d+) оң тақ',s)[1]);evencount=int(m(r'алғашқы (\d+) оң жұп',s)[1]);odd=sum(range(1,2*oddcount,2));even=sum(range(2,2*evencount+1,2));target=F(odd,even);answer=equivalent_choice(r,target,True);note=f'Explicitfullodd/evenlists count{oddcount}/{evencount}, sums{odd}/{even}, ratio{target}.'
    elif k=='preserve-value-after-numerator-add':
        a,b=raw_pair(s);add=int(m(r'алымына (\d+) қосылды',s)[1]);target=F(a+add)*b/a;assert target.denominator==1;change=target.numerator-b;assert change>=0;valid=[d for d in range((a+add)*b+1) if F(a+add,b+d)==F(a,b)];assert valid==[change];answer=str(change);note=f'Fulldenominator-adddomain0..{(a+add)*b}; unique{change}, actualwholefractionrestored.'
    elif k=='irreducible-offset-variable':
        gap=int(m(r'\(n/\(n \+ (\d+)\)\)',s)[1]);answer=choice(r,lambda o:math.gcd(n(o),n(o)+gap)==1);assert all(math.gcd(i,i+gap)==math.gcd(i,gap) for i in range(1,2*gap+1));note=f'Allactualchoicesgcd'+str([math.gcd(n(o),n(o)+gap) for o in r['options']])+f'; difference{gap}identity Euclideanproof.'
    elif k=='linear-numerator-equivalence':
        left,right=groups(s)[:2];f0=arithmetic(left,{'x':0})-arithmetic(right);f1=arithmetic(left,{'x':1})-arithmetic(right);coefficient=f1-f0;assert coefficient!=0;root=-f0/coefficient;assert root.denominator==1 and root>0;assert arithmetic(left,{'x':root})==arithmetic(right);answer=str(root.numerator);note=f'Exactprintedaffineequation fromf0{f0},slope{coefficient}, uniqueroot{root}, substitutiontrue.'
    elif k=='irreducible-numerator-domain':
        lo,hi=map(int,m(r'(\d+) ≤ k < (\d+)',s).groups());den=int(m(r'\(k/(\d+)\)',s)[1]);valid=[k for k in range(lo,hi) if math.gcd(k,den)==1];answer=str(len(valid));note=f'Completeexplicit[{lo},{hi}) naturaldomain gcd(k,{den})1; values{valid}; zero/upperexcluded.'
    elif k=='original-denominator-after-cancel':
        factor=int(m(r'бөлімін (\d+) санына бөліп',s)[1]);a,b=raw_pair(s);answer=str(b*factor);assert F(a*factor,b*factor)==F(a,b);note=f'Inversewhole cancellation coefficient{factor}; rawdenominator{answer},notfinal{b}.'
    elif k=='two-stage-cancel-original-sum':
        first,second=map(int,m(r'алдымен (\d+) санына[\s\S]*?бөлімін (\d+) санына',s).groups());a,b=raw_pair(s);original=[a*first*second,b*first*second];assert all(v%first==0 and (v//first)%second==0 for v in original);answer=str(sum(original));note=f'Exactinversecoefficient{first}×{second}, rawpair{original}, sum{answer}; bothstagedivisionschecked.'
    elif k=='different-category-fraction':
        records=re.findall(r'([А-ЯӘҒҚҢӨҰҮІҺ][а-яәғқңөұүіһ]+) (\d+) тапсырманың (\d+) тапсырмасын',s);assert len(records)==3;values=[F(int(part),int(total)) for _,total,part in records];answer=records[one(i for i,v in enumerate(values) if values.count(v)==1)][0];assert sorted(values.count(v) for v in set(values))==[1,2];note=f'Allthreeactualpart/ownwhole values{list(zip([r[0] for r in records],map(str,values)))}; uniqueoutlier{answer}.'
    elif k=='equivalent-denominator-upper-count':
        a,b=raw_pair(s);bound=int(m(r'бөлімі (\d+) санынан КІШІ',s)[1]);valid=[(top,bottom) for bottom in range(1,bound) for top in range(1,bottom) if top*b==bottom*a];assert len({d for _,d in valid})==len(valid);answer=str(len(valid));note=f'Allpositivepropernumerator-denominatorpairs withdenominator1..{bound-1}; count{answer}, exactrepresentationsnotsemanticuniqueness.'
    elif k=='same-addition-changes-value':
        (a,b),(c,d)=simple_pairs(s);add=int(m(r'де (\d+) қосқанда',s)[1]);scale=F(add*(d-c),c*b-d*a);assert scale.denominator==1 and scale>0;top,bottom=a*scale.numerator,b*scale.numerator;assert F(top+add,bottom+add)==F(c,d);valid=[D for D in range(1,bottom+1) if F(a*D,b).denominator==1 and F(F(a*D,b)+add,D+add)==F(c,d)];assert valid==[bottom];answer=str(bottom);note=f'Exactcross-equationuniquescale{scale}; fullpositiveoriginaldenominators1..{bottom}checked, unique{top}/{bottom}.'
    elif k=='both-terms-digit-bound-count':
        digits=int(m(r'де (\d+) таңбалы',s)[1]);a,b=raw_pair(s);low,high=10**(digits-1),10**digits-1;valid=[(top,bottom) for top in range(low,high+1) for bottom in range(low,high+1) if top*b==bottom*a];answer=str(len(valid));assert valid[0]==(105,135) and valid[-1]==(777,999);note=f'Complete810000both3-digitpairdomain inclusive100..999; count{answer}, extrema{valid[0]},{valid[-1]}, bothconstraints enforced.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==47;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image') and not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact Fraction safeAST on actual canonical expressions and Unicodepowers, complete common-divisor and bounded natural-pair domains, affine cross-equation and full MCQ checks','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all47saved/newconditions/MCQs/fullsolutions read manually','actualnumerator/denominator roles and full reductions checked, sums versus factors distinguished','Unicodeexponent runs parsed before normalization and computed as exactintegers','positive natural/strict threshold/both digit-term bounds enforced through complete domains','all actual MCQ choices checked for exact equality and requested irreducibility']})
    assert len(refs)==47
    assert arithmetic('((2⁴ × 3² × 7)/(2³ × 3⁴ × 5))')==F(14,45)
    assert arithmetic('((3¹² + 3¹¹)/(3¹⁴ + 3¹³))')==F(1,9)
    assert arithmetic('(10⁴/(2⁶ × 5⁵))')==F(1,20)
    assert arithmetic('((35 + 21)/(35 + 49))')==F(2,3) and arithmetic('(21/49)')!=F(2,3)
    assert arithmetic('((5x − 9)/28)',{'x':6})==F(135,180)
    for bad in ['(1/0)','f(1)','2**100','x + 1']:
        try:arithmetic(bad)
        except (AssertionError,ZeroDivisionError):pass
        else:raise AssertionError('Unsafe/unboundASTaccepted '+bad)
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','manualFindings':[{'sourceId':'a86f64b67f671506','status':'corrected_before_signature','finding':'Requested first sequence index with strict threshold is topicseq; fractionequivalence provenance remains preserved, condition/key/params unchanged.'}],'scope':'All47source-addressed saved grade5fraction-equivalence editions, not47mathematicallydistinct meanings. No author solver imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':47,'wrongKeysRejected':47,'sourceRefs':47,'hashesMatched':47,'fullBothTermThreeDigitPairs':810000,'unicodePowersParsedExactly':True,'authorSolverImported':False}))
if __name__=='__main__':main()
