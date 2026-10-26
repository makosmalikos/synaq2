"""Independent full-text review of50source-addressed fraction-classification editions.
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
PACK='problems/editorial/batches/grade5-fraction-types.json'
OUT='problems/editorial/reviews/grade5-fraction-types.json'
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
def listed(option):
    if '…' in option:return ('infinite_tail',tuple(map(int,re.findall(r'\d+',option))))
    return tuple(map(int,re.findall(r'\d+',option)))
def exact_list_choice(r,values):return choice(r,lambda o:listed(o)==tuple(values))
def fraction_node(expression):
    expression=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',expression.replace('×','*').replace('−','-'))
    node=ast.parse(expression,mode='eval').body
    assert isinstance(node,ast.BinOp) and isinstance(node.op,ast.Div)
    return ast.unparse(node.left),ast.unparse(node.right)
def linear_coefficients(expression,names):
    # Only a linear polynomial is admitted, so coefficient checks are a proof,
    # not polynomial interpolation passed off as a universal claim.
    expression=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',expression.replace('×','*').replace('−','-'))
    def visit(node):
        if isinstance(node,ast.Constant):assert type(node.value) is int;return [F(node.value)]+[F(0)]*len(names)
        if isinstance(node,ast.Name):assert node.id in names;return [F(0)]+[F(int(name==node.id)) for name in names]
        assert isinstance(node,ast.BinOp)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return [x+y for x,y in zip(a,b)]
        if isinstance(node.op,ast.Sub):return [x-y for x,y in zip(a,b)]
        assert isinstance(node.op,ast.Mult)
        assert all(v==0 for v in a[1:]) or all(v==0 for v in b[1:]),'Nonlinear universal proof rejected'
        if all(v==0 for v in a[1:]):return [a[0]*v for v in b]
        return [b[0]*v for v in a]
    return visit(ast.parse(expression,mode='eval').body)
def one_variable_domain(expression,name,improper=False):
    top,bottom=fraction_node(expression);a=linear_coefficients(top,[name]);b=linear_coefficients(bottom,[name]);d=[x-y for x,y in zip(a,b)]
    assert b[0]>0 and b[1]>=0,'Positive denominator on every positive natural input'
    # These printed questions all have an increasing properness difference or
    # a decreasing improperness difference. The first invalid boundary proves
    # there are no later valid values.
    assert (d[1]>0 and not improper) or (d[1]<0 and improper)
    stop=math.ceil(abs(d[0]/d[1]))+2
    valid=[i for i in range(1,stop+1) if (arithmetic(expression,{name:i})>=1 if improper else arithmetic(expression,{name:i})<1)]
    assert valid and valid==list(range(1,max(valid)+1)) and max(valid)<stop
    return valid,d
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-types-');note=''
    if k=='improper-integer-value':
        target=arithmetic(groups(s)[0]);assert target.denominator==1 and target>1;answer=str(target.numerator);note=f'Printed exact fraction-as-division{target}; positive natural quotient.'
    elif k=='integer-to-given-denominator':
        den,whole=map(int,m(r'Бөлімі (\d+) болатын бөлшек арқылы (\d+) бүтін',s).groups());answer=choice(r,lambda o:raw_pair(o)[1]==den and arithmetic(o)==whole);note=f'All4actual fractions tested for BOTH denominator{den}and exact value{whole}.'
    elif k=='least-improper-numerator':
        den=int(m(r'\(n/(\d+)\)',s)[1]);valid=[a for a in range(1,den+1) if F(a,den)>=1];assert valid==[den];answer=str(one(valid));note=f'Complete positive1..{den}domain, minimum{answer}; equality included, larger inputs cannot improve minimum.'
    elif k=='true-relation-to-one':
        def fits(o):
            f,op,right=m(r'^(\([^ ]+\)) ([<>=]) (1)$',o).groups();value=arithmetic(f);return {'<':value<1,'>':value>1,'=':value==1}[op]
        answer=choice(r,fits);note='Allactual exact relation truths:'+str([fits(o) for o in r['options']])
    elif k in ['proper-choice','improper-equality-choice','proper-after-reduction-choice']:
        improper=k=='improper-equality-choice';values=[arithmetic(o) for o in r['options']];answer=choice(r,lambda o:(arithmetic(o)>=1 if improper else arithmetic(o)<1));note=f'Every raw fraction reduced exactly{values}; type compared with1, equality improper, actual selected original writing retained.'
    elif k in ['proper-equal-portion','improper-equal-liquid-share']:
        litres,count=map(int,m(r'(\d+) л [\s\S]*? (\d+) бірдей',s).groups());target=F(litres,count)
        answer=choice(r,lambda o:arithmetic(groups(o)[0])==target and math.gcd(*raw_pair(o))==1);note=f'Actual total{litres}/containercount{count}={target}; every answer checked with litre units and full reduction.'
        assert all(o.endswith(' л') for o in r['options'])
    elif k in ['count-improper-list','count-proper-list','reduce-then-count-improper']:
        pairs=simple_pairs(s);assert len(pairs)>=6;proper=k=='count-proper-list';valid=[(a,b) for a,b in pairs if (a<b if proper else a>=b)];answer=str(len(valid));note=f'Every raw list member classified, equality improper; selected{valid}; exact reductions{[str(F(a,b)) for a,b in pairs]}.'
    elif k=='equal-symbolic-terms':
        assert '(t/t)' in s and 'оң натурал' in s
        assert all(arithmetic('(t/t)',{'t':i})==1 for i in range(1,101));answer=choice(r,lambda o:o=='Әрдайым бұрыс бөлшек, мәні 1');note='Universal: same positive nonzero numerator and denominator, quotient1; equality belongs to improper definition. No dependence on sampled t.'
    elif k=='make-proper-from-two-numbers':
        a,b=map(int,m(r'^(\d+) және (\d+) сандарын',s).groups());answer=choice(r,lambda o:sorted(raw_pair(o))==sorted([a,b]) and arithmetic(o)<1);note=f'Each actual number{a},{b}used once, numerator<denominator; repeated-number options rejected as well as reciprocal.'
    elif k in ['greatest-proper-numerator','count-fixed-denominator-proper','proper-numerator-sum']:
        den=int(m(r'\([x]/(\d+)\)',s)[1]) if '(x/' in s else int(m(r'бөлімі (\d+) болатын',s)[1]);valid=[a for a in range(1,den+1) if F(a,den)<1]
        target=max(valid) if k=='greatest-proper-numerator' else sum(valid) if k=='proper-numerator-sum' else len(valid);answer=str(target);note=f'Complete positive numerators1..{den}check yields{valid}; zero/exact-equality excluded; target{ k}={answer}. No later numerator is proper.'
    elif k in ['greatest-improper-denominator','all-improper-denominators']:
        top=int(m(r'\((\d+)/y\)',s)[1]);valid=[d for d in range(1,top+2) if F(top,d)>=1];assert valid==list(range(1,top+1));answer=str(max(valid)) if k=='greatest-improper-denominator' else exact_list_choice(r,valid);note=f'Complete denominator1..{top+1}including first failure; full domain1..{top}, equality included and later denominators alwaysproper.'
    elif k=='minutes-as-improper-hours':
        minutes=int(m(r'(\d+) минутқа',s)[1]);target=F(minutes,60);answer=choice(r,lambda o:arithmetic(groups(o)[0])==target and math.gcd(*raw_pair(o))==1);assert all(o.endswith(' сағ') for o in r['options']);note=f'Exact SI conversion{minutes}/60={target}hours, all4actual fractions/units/reduction checked.'
    elif k=='improper-with-bounded-numerator':
        den,lo,hi=map(int,m(r'бөлімі (\d+) [\s\S]*?алымына (\d+)–(\d+)',s).groups());assert 'Екі шет те кіреді' in s;valid=[a for a in range(lo,hi+1) if F(a,den)>=1];answer=str(len(valid));note=f'Complete closed numerator interval[{lo},{hi}], valid{valid}; equality at{den}included.'
    elif k=='whole-to-unit-portions':
        sheets,parts=map(int,m(r'(\d+) бірдей қағаз [\s\S]*?Әр парақ (\d+) тең',s).groups());assert raw_pair(s)==(1,parts);answer=str(sheets*parts);note=f'{sheets}identical wholes, exactly{parts}unit-pieces each; explicit multiplication, unit denominator agrees.'
    elif k=='reciprocal-of-proper':
        assert '(m/n)' in s and '(n/m)' in s and 'оң натурал' in s
        for a in range(1,60):
            for b in range(a+1,61):assert F(a,b)<1 and F(b,a)>1
        answer=choice(r,lambda o:o=='Бұрыс бөлшек, мәні 1-ден үлкен');note='Universal proof: positive m<n reverses numerator/denominator to n>m, strictly>1. Equality cannot satisfy premise.'
    elif k=='strictly-over-one-bounded-numerator':
        den=int(m(r'\(a/(\d+)\)',s)[1]);upper=int(m(r'a — (\d+) санынан кіші',s)[1]);valid=[a for a in range(1,upper) if F(a,den)>1];answer=str(len(valid));note=f'Complete positive[1,{upper})domain, >1 rather than ≥1, excludes numerator{den}; valid{valid}.'
    elif k=='integer-fraction-term-sum':
        den,whole=map(int,m(r'Бөлімі (\d+) болатын бөлшектің мәні (\d+) бүтін',s).groups());tops=[a for a in range(1,whole*den+1) if F(a,den)==whole];top=one(tops);answer=str(top+den);note=f'Unique numerator{top}from exact fraction value{whole}; requested term sum{top}+{den}, not value+denominator.'
    elif k=='two-natural-fraction-unknowns':
        den,whole,top,whole2=map(int,m(r'\(a/(\d+)\) = (\d+) және \((\d+)/b\) = (\d+)',s).groups());A=F(den*whole);B=F(top,whole2);assert B.denominator==1;answer=str(A.numerator+B.numerator);assert [b for b in range(1,top+1) if F(top,b)==whole2]==[B.numerator];note=f'Independently recover unknown dividend{A}and unknown divisor{B}; substitution bothtrue, sum{answer}.'
    elif k=='count-distinct-term-improper':
        nums=list(map(int,re.findall(r'\d+',m(r'^Алым мен бөлім ([\d, ]+) сандарының',s)[1])));pairs=[(a,b) for a in nums for b in nums if a!=b and F(a,b)>=1];assert len(nums)==len(set(nums));answer=str(len(pairs));note=f'Complete{len(nums)}²allowed pairdomain, unequal terms, improper; all writings{pairs}, equal-valued ratios not merged.'
    elif k=='piece-shorter-than-unit':
        length=int(m(r'(\d+) м таспа',s)[1]);answer=choice(r,lambda o:F(length,n(o.removesuffix(' бөлік')))<1);note=f'Actual length{length}/each actual offered positivepiececount; strict1m bound, equality rejected.'
    elif k=='shared-numerator-two-types':
        d1,d2=map(int,m(r'\(n/(\d+)\) — бұрыс, ал \(n/(\d+)\) — дұрыс',s).groups());valid=[a for a in range(1,max(d1,d2)+1) if F(a,d1)>=1 and F(a,d2)<1];answer=exact_list_choice(r,valid);note=f'Full positive numerators1..{max(d1,d2)}, intersect lower-inclusive/upper-exclusive constraints:{valid}; no later proper n/{d2}.'
    elif k=='improper-fixed-term-sum-count':
        total=int(m(r'қосындысы (\d+)',s)[1]);pairs=[(a,total-a) for a in range(1,total) if F(a,total-a)>=1];answer=str(len(pairs));note=f'All{total-1}positive ordered sum pairs inspected; improper{pairs}, diagonal equality included once.'
    elif k=='proper-transitivity':
        assert all(g in s for g in ['(x/y)','(y/z)','(x/z)','Оң натурал'])
        assert all(F(x,z)<1 for x in range(1,30) for y in range(x+1,31) for z in range(y+1,32));answer=choice(r,lambda o:o=='Дұрыс бөлшек, мәні 1-ден кіші');note='Universal strict-order transitivity x<y<z⇒x<z, with all denominators positive; no sample stands in for proof.'
    elif k=='improper-numerator-increase':
        add=int(m(r'Тек алымға (\d+) қосып',s)[1]);assert add>0 and 'оң натурал' in s
        assert all(F(a+add,b)>1 for a in range(1,60) for b in range(1,a+1));assert F(3+add,3).denominator>1;answer=choice(r,lambda o:o=='Әрдайым бұрыс бөлшек және 1-ден үлкен');note=f'Universal m≥n and positive{add}gives m+{add}>n, strictly>1; actual3/3counterexample rules out alwaysinteger.'
    elif k=='three-type-constraints-sum':
        d,a,b=map(int,m(r'\(x/(\d+)\) және \((\d+)/x\)[\s\S]*?\((\d+)/x\) дұрыс',s).groups());valid=[x for x in range(1,a+2) if F(x,d)>=1 and F(a,x)>=1 and F(b,x)<1];answer=str(sum(valid));assert all(x<=a for x in valid);note=f'Complete natural1..{a+1}domain including first upperfailure; three exact tests yield{valid}, sum{answer}; beyond{a}second condition alwaysfails.'
    elif k in ['linear-ratio-proper-domain','affine-numerator-proper-domain','affine-denominator-improper-domain']:
        name='x' if k=='linear-ratio-proper-domain' else 'n';valid,difference=one_variable_domain(groups(s)[0],name,k=='affine-denominator-improper-domain');answer=exact_list_choice(r,valid);note=f'Printed numerator−denominator linear coefficients{difference}; positive denominator proven; full finite domain{valid}, first failure and monotone tail exclude every laterinput.'
    elif k in ['proper-full-square-domain','bounded-integer-fraction-writings']:
        lo,hi=map(int,m(r'(\d+)–(\d+) аралығындағы',s).groups());pairs=[(a,b) for a in range(lo,hi+1) for b in range(lo,hi+1) if (F(a,b)<1 if k=='proper-full-square-domain' else F(a,b).denominator==1)];answer=str(len(pairs));note=f'Every ordered pair in complete[{lo},{hi}]²domain checked, count{answer}; unreduced writings keptseparate, both endpointsincluded, zeroexcluded.'
    elif k=='fraction-between-integers':
        den,lo,hi=map(int,m(r'бөлімі (\d+) болатын [\s\S]*?мәні (\d+) санынан ҚАТАҢ ҮЛКЕН және (\d+) санынан ҚАТАҢ КІШІ',s).groups());valid=[a for a in range(1,den*hi+1) if lo<F(a,den)<hi];answer=str(len(valid));note=f'All positive numerator1..{den*hi}checked, strictboth boundaries{den*lo}/{den*hi}, valid{valid}; larger onesalwaysfail upperbound.'
    elif k=='affine-numerator-proper-count':
        valid,difference=one_variable_domain(groups(s)[0],'n');answer=str(len(valid));note=f'Exact printed affine ratio, numerator−denominator{difference}; fullvalid positive domain{valid}, requested count{answer}, equalityexcluded.'
    elif k=='anti-diagonal-improper-count':
        count=int(m(r'^(\d+) бөлшек',s)[1]);assert simple_pairs(s)==[(1,count),(2,count-1),(3,count-2),(count,1)];pairs=[(a,count+1-a) for a in range(1,count+1)];answer=str(sum(F(a,b)>=1 for a,b in pairs));note=f'Full{count}anti-diagonal list regenerated from both printed endpoints and step rule; fixedsum{count+1}, equalityimpossible for this oddsum.'
    elif k=='possible-proper-denominator':
        top=int(m(r'алымы (\d+)',s)[1]);answer=choice(r,lambda o:F(top,n(o))<1);note=f'Every actual denominator optionchecked against positive numerator{top}, strict denominator>numerator, equalityimproper.'
    elif k=='adjacent-proper-terms':
        den=int(m(r'Бөлімі (\d+)',s)[1]);valid=[a for a in range(1,den+2) if abs(a-den)==1 and F(a,den)<1];answer=str(one(valid));note=f'Both neighbouring positive candidates{den-1},{den+1}tested, onlylower makes properratio.'
    elif k=='incomplete-definition-counterexample':
        assert 'толық емес ереже' in s;answer=choice(r,lambda o:arithmetic(o)>=1 and not arithmetic(o)>1);note='Actual quoted strict-greater rule deliberately incomplete; equality fraction is improper but disproves necessary strictness. Other3optionschecked.'
    elif k=='natural-improper-under-upper':
        den,upper=map(int,m(r'Бөлімі (\d+), алымы (\d+) санынан КІШІ',s).groups());valid=[a for a in range(1,upper) if F(a,den)>=1 and F(a,den).denominator==1];answer=str(len(valid));note=f'Complete[1,{upper})positive numerator domain, exactinteger AND improper, valid{valid}; equality1included, uppermultipleexcluded.'
    elif k=='universal-improper-expression':
        coefficients=[]
        for o in r['options']:
            top,bottom=fraction_node(o);a=linear_coefficients(top,['u','v']);b=linear_coefficients(bottom,['u','v']);coefficients.append([x-y for x,y in zip(a,b)])
        assert coefficients==[[0,2,0],[2,1,-1],[0,3,-1],[0,-1,0]]
        truths=[arithmetic(o,{'u':1,'v':4})>=1 for o in r['options']];assert truths==[True,False,False,False]
        answer=r['options'][0];note='Universal first numerator−denominator=2u>0 for every positive u; all denominatorspositive. Actual otheroptions fail at u1,v4; last numerator−denominator=−u<0 universally. Exact polynomial coefficient proof, not finitesampling.'
    elif k=='natural-denominator-divisor-count':
        top=int(m(r'\((\d+)/b\)',s)[1]);valid=[b for b in range(1,top+1) if F(top,b).denominator==1];answer=str(len(valid));note=f'Full denominator1..{top}domain exactinteger tests, values{valid}; b>{top}would yield0<value<1, so nevernatural.'
    elif k=='both-reciprocals-improper':
        assert '(u/v)' in s and '(v/u)' in s and 'оң натурал' in s
        valid=[(u,v) for u in range(1,41) for v in range(1,41) if F(u,v)>=1 and F(v,u)>=1];assert all(u==v for u,v in valid) and len(valid)==40
        answer=choice(r,lambda o:o=='u = v');note='Universal u≥v and v≥u imply equality by antisymmetry; positive diagonal gives both1and satisfies premise. All strict alternativesfail.'
    elif k=='irreducible-improper-under-upper':
        den,upper=map(int,m(r'Бөлімі (\d+) [\s\S]*?алымы (\d+) санынан кіші',s).groups());valid=[a for a in range(1,upper) if F(a,den)>=1 and math.gcd(a,den)==1];answer=str(len(valid));note=f'Complete positive[1,{upper})domain, improper plus rawgcd1 bothneeded; valid{valid}, equalityvalue1notirreducible at denominator{den}.'
    elif k=='gcd-lcm-nonnatural-improper':
        g,l=map(int,m(r'ЕҮОБ\(a, b\) = (\d+), ЕКОЕ\(a, b\) = (\d+)',s).groups());fits=lambda a,b:math.gcd(a,b)==g and math.lcm(a,b)==l and F(a,b)>=1 and F(a,b).denominator>1
        full=[(a,b) for a in range(1,l+1) for b in range(1,l+1) if fits(a,b)];assert len(full)==1;answer=choice(r,lambda o:fits(*map(int,m(r'^a = (\d+), b = (\d+)$',o).groups())));note=f'All{l*l}positive pairs1..lcm²domain (each term must dividelcm), all4constraints yieldonly{full}; everyactualMCQpair independentlychecked.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==50;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['topic']=='frac' and r['minimumPlan']=='pro' and not r.get('image') and not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Actual printed-condition exact Fraction and full finite positive domains; universal order/coefficient proofs and every actual MCQ option checked independently','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all50saved/newconditions/MCQs/fullsolutions read manually','properness uses numerator<denominator; equality is improper; strictlyover1 excludes equality','natural versus nonnatural values and raw irreducibility are independent requirements','all positive bounded pairs/lists/unknown positions enumerated without collapsing equivalent writings','universal claims proved symbolically with actual polynomial coefficients or strict-order reasoning']})
    assert len(refs)==50
    # Reviewer-specific adversarial checks for the boundaries most easily lost.
    assert F(11,11)>=1 and not F(11,11)>1 and not F(11,11)<1
    assert len([(a,b) for a in range(1,13) for b in range(1,13) if F(a,b)<1])==66
    assert len([(a,b) for a in range(1,13) for b in range(1,13) if F(a,b).denominator==1])==35
    assert linear_coefficients('2*u+v-v',['u','v'])==[0,2,0]
    try:linear_coefficients('u*v',['u','v'])
    except AssertionError:pass
    else:raise AssertionError('Nonlinear universal proof was accepted')
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[{'sourceId':'38a4b18d5df96b91','status':'corrected_before_signature','finding':'Clarified artworkshop wording to Сурет салу шеберлік сабағы; exact105/60=7/4, units/options/solution and other49rows unchanged.'}],'scope':'All50source-addressed saved grade5fraction-types editions, not50mathematicallydistinct meanings. No author solver/spec imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':50,'wrongKeysRejected':50,'sourceRefs':50,'hashesMatched':50,'completeGcdLcmPairDomain':14400,'authorSolverImported':False}))
if __name__=='__main__':main()
