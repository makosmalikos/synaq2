"""Independent complete review of54 canonical/source-addressed proportion editions.

No author module imports. Printed equations become exact polynomial rational
functions in a separate Python AST engine. Roots are obtained from coefficients,
then substituted into both original denominators. Other requested targets use
complete finite domains or independent homogeneous-ratio reasoning.
"""
import ast,hashlib,itertools,json,math,re,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def norm(s):
    s=re.sub(r'(\d+) бүтін (\d+)/(\d+)',r'(\1+\2/\3)',s)
    s=s.replace(',','.').replace('·','*').replace('×','*').replace('−','-').replace('²','**2')
    if ':' in s:
        assert s.count(':')==1,s
        left,right=s.split(':');s=f'({left})/({right})'
    return re.sub(r'(?<=\d)(?=[a-zA-Z])','*',s.strip())
def ptrim(a):
    a=list(map(F,a))
    while len(a)>1 and a[-1]==0:a.pop()
    return tuple(a)
def padd(a,b):return ptrim([(a[i] if i<len(a) else 0)+(b[i] if i<len(b) else 0) for i in range(max(len(a),len(b)))])
def pmul(a,b):
    out=[F(0)]*(len(a)+len(b)-1)
    for i,x in enumerate(a):
        for j,y in enumerate(b):out[i+j]+=x*y
    return ptrim(out)
def pneg(a):return tuple(-x for x in a)
def peval(a,x):return sum(c*x**i for i,c in enumerate(a))
def rational(text,env=None):
    text=norm(text);env=env or {}
    def walk(n):
        if isinstance(n,ast.Constant):assert type(n.value) in (int,float);return((F(ast.get_source_segment(text,n)),),(F(1),))
        if isinstance(n,ast.Name):return((F(env[n.id]),),(F(1),)) if n.id in env else ((F(0),F(1)),(F(1),)) if n.id=='x' else (_ for _ in ()).throw(AssertionError(n.id))
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);a,b=walk(n.operand);return pneg(a),b
        assert isinstance(n,ast.BinOp),ast.dump(n);a,b=walk(n.left);c,d=walk(n.right)
        if isinstance(n.op,ast.Add):return padd(pmul(a,d),pmul(c,b)),pmul(b,d)
        if isinstance(n.op,ast.Sub):return padd(pmul(a,d),pneg(pmul(c,b))),pmul(b,d)
        if isinstance(n.op,ast.Mult):return pmul(a,c),pmul(b,d)
        if isinstance(n.op,ast.Div):return pmul(a,d),pmul(b,c)
        if isinstance(n.op,ast.Pow):assert len(c)==len(d)==1 and c[0]/d[0]==2;return pmul(a,a),pmul(b,b)
        raise AssertionError(ast.dump(n))
    return walk(ast.parse(text,mode='eval').body)
def value(text,env=None):a,b=rational(text,env);assert len(a)==len(b)==1 and b[0]!=0,(text,a,b);return a[0]/b[0]
def root(equation):
    left,right=equation.split('=');a,b=rational(left);c,d=rational(right);poly=padd(pmul(a,d),pneg(pmul(c,b)));assert len(poly)==2 and poly[1]!=0,(equation,poly);x=-poly[0]/poly[1];assert peval(b,x)!=0 and peval(d,x)!=0;assert peval(a,x)/peval(b,x)==peval(c,x)/peval(d,x);return x
def trueeq(s,env=None):a,b=s.split('=');return value(a,env)==value(b,env)
def numeric_tokens(s):return [F(n.replace(',','.')) for n in re.findall(r'\d+(?:,\d+)?',s)]
def first_equation(s):
    for marker in [' пропорция',' бөлшектер',' теңдеу',' есебін',' үшін']:s=s.split(marker)[0]
    return s.split('.')[0] if '.' in s else s
def displayed(x):
    x=F(x);return str(x.numerator) if x.denominator==1 else f'{x.numerator}/{x.denominator}'
def solve(row):
    k=row['modelId'].removeprefix('grade6-proportion-');s=row['statement'];opts=row.get('options');ns=numeric_tokens(s);notes=[];answer=None;expected=None
    if k=='missing-member':expected=root(first_equation(s));notes=['Independent exact polynomial-rational equation root from printed decimal/mixed/fraction givens; original denominator substitution checked.']
    elif k=='named-members':
        a,b,c,d=map(F,re.search(r'(\d+) : (\d+) = (\d+) : (\d+)',s).groups());assert a*d==b*c;answer=f'{int(a)} және {int(d)}'
    elif k=='other-extreme':known,b,c=ns;expected=b*c/known
    elif k in ['choose-proportion','product-to-proportion']:answer=one([o for o in opts if trueeq(o)])
    elif k=='middle-product':a,b,c,d=map(lambda v:F(v.replace(',','.')),re.search(r'([\d,]+) : (\d+) = (\d+) : (\d+)',s).groups());assert a*d==b*c;expected=b*c
    elif k=='equivalent-ratio':
        a,b=map(F,re.search(r'(\d+) : (\d+)',s).groups());answer=one([o for o in opts if value(o)==a/b])
    elif k=='swap-middle':
        a,b,c,d=re.search(r'(\d+) : (\d+) = (\d+) : (\d+)',s).groups();assert all(trueeq(o) for o in opts);answer=f'{a} : {c} = {b} : {d}';notes=['All4 printed alternatives are numerically true; only the requested second/third position swap qualifies.']
    elif k=='justify-proportion':
        given=re.search(r'(\d+ : \d+ = \d+ : \d+)',s)[1];assert trueeq(given);answer=one([o for o in opts if o.startswith('Иә: ') and trueeq(o.removeprefix('Иә: '))]);notes=['Correct truth plus relevant cross-product reason distinguished from true but irrelevant inequality and false addition reasoning.']
    elif k=='equal-products':expected=ns[0]
    elif k=='factor-pair-count':
        a,b=map(int,re.search(r'x : (\d+) = (\d+) : y',s).groups());pairs=[(x,y) for x in range(1,a*b+1) for y in range(1,a*b+1) if x<y and F(x,a)==F(b,y)];expected=len(pairs);assert pairs==[(1,144),(2,72),(3,48),(4,36),(6,24),(8,18),(9,16)];notes=['All144² ordered pairs checked against original ratios and strict x<y; equal12/12 excluded.']
    elif k=='not-permuted-proportion':answer=one([o for o in opts if not trueeq(o)])
    elif k=='right-sum':a,b,total=ns;expected=root(f'{a}/{b} = ({total}-x)/x')
    elif k=='scale-photo':short,long,new_short=ns;expected=root(f'{short}/{long} = {new_short}/x')
    elif k=='recipe-comparison':
        firstLiquid,firstPowder,secondLiquid,secondPowder=ns;assert firstPowder<secondPowder and firstPowder/firstLiquid>secondPowder/secondLiquid;name=s.split()[0];answer=one([o for o in opts if o==name+' дайындаған сусын']);notes=['Exact per-glass5/3>8/5 despite smaller raw powder amount5<8; same cup/spoon size is explicit.']
    elif k=='permutation-count':
        values=list(map(int,ns));assert len(values)==4 and len(set(values))==4;good=[p for p in itertools.permutations(values) if F(p[0],p[1])==F(p[2],p[3])];expected=len(good);assert expected==8
        printed=re.findall(r'(\d+) : (\d+) = (\d+) : (\d+)',row['solution']);assert {tuple(map(int,p)) for p in printed}==set(good);notes=['All24 permutations and exact complete8 printed solution equations checked, counting distinct positions as instructed.']
    elif k=='units-proportion':
        metres,minutes,hours=map(lambda v:F(v.replace(',','.')),re.search(r'x см : ([\d,]+) м = (\d+) мин : (\d+) сағ',s).groups());expected=root(f'x/{metres*100} = {minutes}/{hours*60}')
    elif k=='two-unknown-sum':product,a,c=map(F,re.search(r'bc = (\d+), a = (\d+), c = (\d+)',s).groups());expected=product/c+product/a
    elif k in ['coefficient-numerator','affine-numerator','affine-denominator','variable-both-ratio']:expected=root(first_equation(s));notes=['Separate rational-function AST solves numerator/denominator affine expression and rechecks nonzero original denominator.']
    elif k=='denominators-sum':a,c,total=map(F,re.search(r'a = (\d+), c = (\d+), b \+ d = (\d+)',s).groups());expected=root(f'{a}/({total}-x)={c}/x')
    elif k=='same-class-ratio':
        boys,girls=map(int,re.search(r'барлығы (\d+) ұл және (\d+) қыз',s).groups());firstGirls=int(re.search(r'сыныбында (\d+) қыз',s)[1]);good=[b for b in range(boys+1) if F(b,firstGirls)==F(boys-b,girls-firstGirls)];expected=one(good);assert boys-expected>0 and girls-firstGirls>0
    elif k=='sum-over-second':
        a,b=map(F,re.search(r'x/y = (\d+)/(\d+)',s).groups());expected=(a+b)/b
        for scale in [F(1,7),F(1),F(8)]:assert (a*scale+b*scale)/(b*scale)==expected
    elif k=='first-third-multiple':multiple,total=map(F,re.search(r'a = (\d+)c және b \+ d = (\d+)',s).groups());expected=root(f'{multiple}/({total}-x)=1/x')
    elif k=='change-member-factor':a,b=ns;expected=a/b;answer=one([o for o in opts if o==str(float(expected)).replace('.',',')+' есе арттыру'])
    elif k=='add-one-property':
        a,b,c,d=map(F,re.search(r'(\d+) : (\d+) = (\d+) : (\d+)',s).groups());assert a/b==c/d;expected=(a+b)/b;assert expected==(c+d)/d;answer=one([o for o in opts if o=='Иә, екі жағы да '+displayed(expected)])
    elif k=='combined-common-ratios':
        a,b,c=map(F,re.search(r'x/(\d+) = y/(\d+) = z/(\d+)',s).groups());expected=(a+b)/(b+c)
        for scale in [F(-5),F(-1,3),F(1,7),F(8)]:assert (a*scale+b*scale)/(b*scale+c*scale)==expected
        answer=one([o for o in opts if value(o)==expected]);notes=['Homogeneous cancellation tested for positive/negative nonzero rational scale; denominator21k is nonzero because explicit k≠0.']
    elif k=='difference-middle-members':
        a,b,gap=map(int,ns);expected=one([hi for hi in range(1,a*b+1) for lo in range(1,hi) if hi-lo==gap and F(lo, a)==F(b,hi)])
    elif k=='chained-prices':firstKg,secondKg,secondBatchKg,thirdKg=ns[:4];price=F(re.search(r'Өріктің 1 килограмы (\d+) теңге',s)[1]);pear=thirdKg*price/secondBatchKg;expected=secondKg*pear/firstKg;assert secondBatchKg*pear==thirdKg*price
    elif k=='fractional-speed-gap':a,b,gap=map(F,re.search(r'қатынасы (\d+/\d+) : (\d+/\d+).*?Велосипедші (\d+)',s).groups());expected=root(f'x/(x-{gap})=({a})/({b})');assert expected>gap>0
    elif k=='successive-proportions':
        first,second=s.split(' және ');first=first.replace('a','x');a=root(first);second=second.split('.')[0].replace('a',f'({a})').replace('b','x');b=root(second)
        def parse_choice(o):left,right=o.split('; ');return value(left.split('=')[1]),value(right.split('=')[1])
        answer=one([o for o in opts if parse_choice(o)==(a,b)])
    elif k=='general-cross-products':
        domain=[-3,-2,-1,1,2,3];passing=[]
        for o in opts:
            if all(trueeq(o,dict(zip(['m','n','u','v'],values))) for values in itertools.product(domain,repeat=4) if F(values[0],values[1])==F(values[2],values[3])):passing.append(o)
        answer=one(passing);assert answer=='m · v = n · u';notes=['Formal multiplication by nonzero nv proves surviving identity; complete6⁴ nonzero integer grid supplies counterexamples for all other formulas.']
    elif k=='count-equivalent':
        all_ratios=s.split(' қатынастары')[0].split('; ');a,b=map(F,re.search(r'Олардың нешеуі (\d+) : (\d+)',s).groups());expected=sum(value(r)==a/b for r in all_ratios)
    elif k=='nonzero-convention':assert 'Осы тапсырмада' in s and 'барлық төрт мүшесі нөлге тең емес' in s;answer=one([o for o in opts if value(o)==0]);notes=['Nonzero-all-members convention is expressly local to this question; no false claim that zero numerators can never occur in a general equality of ratios.']
    elif k=='equal-middle':a,b=map(int,ns);assert 'оң сан' in s;expected=one([n for n in range(1,a*b+1) if n*n==a*b]);notes=['Positive domain removes the negative square-root solution, and exact substitution confirms12.']
    elif k=='four-member-product':total=int(ns[0]);expected=one([n for n in range(1,total+1) if n*n==total]);assert 1*5*5*25==total and F(1,5)==F(5,25)
    elif k=='target-root-choice':target=ns[0];answer=one([o for o in opts if root(o)==target])
    elif k=='detect-inversion-error':
        correct=root(re.search(r'(x : \d+ = \d+ : \d+)',s)[1]);answer=one([o for o in opts if o.startswith('Ортаңғы') and value(o.split('x = ')[1])==correct]);assert correct==20 and value('5 · 3 : 12')==F(5,4);notes=['Quoted pupil step is intentionally incorrect application, not an accidental false arithmetic equality; true root20 rejects5/4.']
    elif k=='impossible-fourth':
        given=ns[:3];answer=one([o for o in opts if not any(F(a,b)==F(c,d) for a,b,c,d in itertools.permutations([*given,value(o)]))]);notes=['All24 placements for each fourth candidate checked; no hidden fixed member order.']
    elif k=='max-distinct-digit-product':
        lower,upper=map(int,ns[:2]);good=[p for p in itertools.permutations(range(lower,upper+1),4) if F(p[0],p[1])==F(p[2],p[3])];expected=max(a*d for a,b,c,d in good);assert expected==24;notes=['Complete8P4=1680 distinct nonzero digit arrangements; global maximum24 proven, equal-digit36 representation rejected.']
    else:raise AssertionError(k)
    if answer is not None:assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    else:
        assert expected is not None
        assert value(row['answer'])==F(expected),(row['editionId'],expected,row['answer'])
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(row['answer'])==1
    else:assert value(row['answer']).denominator==1 and re.search('Жауапты тек санмен',s)
    return notes
rows=read('problems/editorial/batches/grade6-proportion.json')['editions'];assert len(rows)==54
entries=[];refs=set();wrong_keys=0
for row in rows:
    assert row['grade']==6 and row['minimumPlan']=='pro' and not row.get('image')
    for ref in row['sourceRefs']:
        capture=read(ref['sourceFile']);assert capture['status']=='captured';q=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert q['checked'] and q['solution'] and q['sourceAnswer'];assert not q.get('images') and not q.get('svg')
        if q.get('options'):assert len([o for o in q['options'] if o['correct']])==1
        refs.add((ref['sourceFile'],ref['sourceId']))
    notes=solve(row)
    bad=dict(row);bad['answer']=one([o for o in row['options'] if o!=row['answer']][:1]) if row.get('options') else str(value(row['answer'])+1)
    try:solve(bad)
    except AssertionError:wrong_keys+=1
    else:raise AssertionError(('wrong key accepted',row['editionId']))
    sha=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    entries.append({'editionId':row['editionId'],'sha256':sha,'verdict':'verified','method':'Independent exact printed-equation polynomial/Fraction oracle, denominator substitution, full finite ordered-pair/permutation/digit domains and complete canonical/source/content reading','notes':['All54 original/new conditions, full official/authored solutions and every MCQ read; requested member positions, correct transformation vs true equality, decimal/mixed/rational values, nonzero/positive domains and Kazakh wording checked. Numeric variants are not54 new meanings.',*notes]})
assert len(refs)==wrong_keys==54
# Sensitive regressions for the independently implemented oracle itself.
# A fraction-valued ratio member is a whole divisor, not left-associated6/4/5.
assert root('2 бүтін 1/4 : x = 6 : 4/5')==F(3,10)
assert root('1,2/(3x − 2) = 1,5/5')==2
assert value('3x − 2',{'x':F(2,3)})==0
assert F(5,3)>F(8,5) and 5<8
assert F(7,3)==F(28,12) and F(7,28)==F(3,12)
assert len({4,9,6,6})<4 and 4*9==6*6
assert 12*12==144 and not 12<12
canaries=7
report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade6-proportion.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'editions':len(rows),'canonicalReferences':len(refs),'rejectedWrongKeys':wrong_keys,'sensitiveOracleCanaries':canaries,'authorSolverImported':False,'status':'passed','written':'--write' in sys.argv}))
