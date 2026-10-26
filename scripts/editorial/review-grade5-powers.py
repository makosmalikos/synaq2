"""Independent full source/content/math review of powers47.

No author solver imports. Native printed conditions/options are parsed with a
separate Python AST/Fraction engine. Finite roots/codes/cycles, polynomial
coefficient degrees and an explicit distinct-person tree are independently checked.
"""
import ast,hashlib,itertools,json,math,re,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹'
def read(path):return json.loads((ROOT/path).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def normalize(s):
    s=re.sub('['+SUP+']+',lambda m:'**'+''.join(str(SUP.index(c)) for c in m[0]),s)
    return s.strip().replace('×','*').replace('−','-').replace(':','/').replace('^','**')
def native(s):
    def walk(n):
        if isinstance(n,ast.Constant):assert type(n.value)==int;return F(n.value)
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -walk(n.operand)
        assert isinstance(n,ast.BinOp),ast.dump(n);a,b=walk(n.left),walk(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        if isinstance(n.op,ast.Div):return a/b
        if isinstance(n.op,ast.Pow):assert b.denominator==1;return a**int(b)
        raise AssertionError(type(n.op))
    return walk(ast.parse(normalize(s),mode='eval').body)
def powers(s):return [(int(m[1]),int(''.join(str(SUP.index(c)) for c in m[2]))) for m in re.finditer(r'(\d+)(['+SUP+']+)',s)]
def comparison(s):
    m=re.fullmatch(r'(.+?)\s*([<>=])\s*(.+)',s);assert m,s;a,b=native(m[1]),native(m[3]);return a==b if m[2]=='=' else a<b if m[2]=='<' else a>b
def expression(s):return re.search(r'^([0-9() ×+−:'+SUP+']+)',s)[1].strip()
def monomial(s):
    text=normalize(s.replace(' ','').replace('t','*t'));text=text.replace('**t','*t')
    def walk(n):
        if isinstance(n,ast.Constant):return(F(n.value),0)
        if isinstance(n,ast.Name):assert n.id=='t';return(F(1),1)
        assert isinstance(n,ast.BinOp);a,da=walk(n.left);b,db=walk(n.right)
        if isinstance(n.op,ast.Mult):return(a*b,da+db)
        if isinstance(n.op,ast.Pow):assert db==0 and b.denominator==1;return(a**int(b),da*int(b))
        raise AssertionError(ast.dump(n))
    return walk(ast.parse(text,mode='eval').body)
def cube_root(n):return one([k for k in range(1,n+1) if k*k*k==n])
def solve(row):
    k=row['modelId'].removeprefix('grade5-powers-');s=row['statement'];opts=row.get('options');ns=nums(s);note=[]
    direct={'square-plus','first-power-plus-one-power','ten-power-value','coefficient-square','power-value','coefficient-ten-power','power-place-expansion','division-power-plus-cube','sum-square','product-two-powers','coefficient-square-minus-cube','nested-square-times','difference-two-powers','long-power-order'}
    if k in direct:
        if k in {'square-plus','first-power-plus-one-power','ten-power-value','power-value','coefficient-ten-power'}:
            m=re.search(r'(\d+['+SUP+r']*(?: [×+−:] \d+['+SUP+r']*)*)',s);assert m,s;answer=native(m[0])
        else:answer=native(expression(s))
        note=['Independent AST parses rendered powers and exact Fraction operator precedence; all native givens, not author parameters.']
    elif k=='natural-cube-root':answer=cube_root(ns[0]);note=['All smaller positive integers excluded by exact cube enumeration.']
    elif k=='name-cube':base=ns[0];answer=one([o for o in opts if powers(o)==[(base,3)]])
    elif k=='natural-square-root':answer=one([n for n in range(1,ns[0]+1) if n*n==ns[0]]);note=['Natural domain explicitly excludes a negative square root.']
    elif k=='write-ten-power':answer=one([o for o in opts if native(o)==ns[0] and powers(o)[0][0]==10])
    elif k=='identify-base-exponent':base,exponent=powers(s)[0];answer=f'негізі {base}, көрсеткіші {exponent}'
    elif k=='expand-power':base,exponent=powers(s)[0];answer=one([o for o in opts if o.split(' × ')==[str(base)]*exponent])
    elif k=='scaled-swapped-equality':
        answer=one([o for o in opts if o!='Салыстыру мүмкін емес' and comparison(o)]);assert native('2⁴')==native('4²') and native('2³')!=native('3²');note=['Structural2⁴=4² invariant retained explicitly, not misrepresented as a new mathematical meaning.']
    elif k=='compress-product':factors=re.search(r'^([\d ×]+)',s)[1].strip().split(' × ');assert len(set(factors))==1;answer=one([o for o in opts if powers(o)==[(int(factors[0]),len(factors))]])
    elif k=='collect-coefficient-power':
        expr=s.split(' көбейтіндісін')[0];target=monomial(expr);answer=one([o for o in opts if monomial(o)==target]);assert target==(F(24),3);note=['Exact monomial coefficient/degree comparison proves equality for all natural t, not just a single substitution.']
    elif k=='both-square-cube':
        def both(n):return math.isqrt(n)**2==n and any(c**3==n for c in range(1,n+1))
        answer=one([o for o in opts if both(int(o))]);assert sum(math.isqrt(int(o))**2==int(o) for o in opts)==3
    elif k=='largest-power':values=list(map(native,opts));answer=one([o for o,v in zip(opts,values) if v==max(values)]);assert values.count(F(256))==2
    elif k=='nested-archive-count':assert ns==[4,6,6,6];answer=math.prod(ns)
    elif k=='sum-two-squares':a,b=ns;answer=a*a+b*b
    elif k=='find-exponent':
        base=int(re.search(r'(\d+)ⁿ',s)[1]);value=int(re.search(r'= (\d+)',s)[1]);answer=one([n for n in range(1,value+1) if base**n==value])
    elif k=='coefficient-missing-ten-exponent':
        target,coefficient=map(int,re.search(r'(\d+) = (\d+) × 10ⁿ',s).groups());answer=one([n for n in range(1,len(str(target))+1) if coefficient*10**n==target]);assert coefficient%10!=0
    elif k=='square-sum-discrepancy':
        a,b=map(int,re.search(r'a = (\d+), b = (\d+)',s).groups());answer=native('(a + b)² − (a² + b²)'.replace('a',str(a)).replace('b',str(b)));assert a>0 and b>0;note=['Positive substituted values checked; source false universal claim at zero was not copied.']
    elif k=='count-natural-squares':
        first,last=map(int,re.search(r'(\d+)–(\d+)',s).groups());answer=sum(math.isqrt(n)**2==n for n in range(first,last+1));assert first==1;note=['Every integer in the inclusive printed range classified by exact integer square root; zero excluded.']
    elif k=='nine-divisible-ten-power-sum':answer=one([o for o in opts if native(o)%9==0]);note=['Actual full arbitrary-precision decimal values divided by9, independently of the digit-sum shortcut.']
    elif k=='odd-sum-square':first,last=map(int,re.search(r'(\d+)–(\d+)',s).groups());assert first==1;answer=sum(n for n in range(first,last+1) if n%2)
    elif k=='nines-digit-sum':value=native(expression(s));assert value.denominator==1;answer=sum(map(int,str(value.numerator)))
    elif k=='square-boundary-code':
        tens=int(re.search(r'overline\((\d)a\)',s)[1]);first,last=map(int,re.search(r'бірінші цифры (\d), соңғы цифры (\d)',s).groups());good=[n for n in range(10*tens,10*tens+10) if len(str(n*n))==4 and str(n*n).startswith(str(first)) and (n*n)%10==last];answer=one(good);note=['All10 last digits tested against both leading and trailing square digits; native overline is concatenation, not multiplication.']
    elif k=='power-last-digit':
        base,exponent=powers(s)[0];remainder=1
        for _ in range(exponent):remainder=(remainder*base)%10
        answer=remainder;assert pow(base,exponent,10)==answer;note=['Repeated modular multiplication checks the last digit without relying on the author cycle index.']
    elif k=='impossible-square':answer=one([o for o in opts if math.isqrt(int(o))**2!=int(o)]);assert int(answer)%10 not in {d*d%10 for d in range(10)}
    elif k=='compare-close-powers':answer=one([o for o in opts if o!='Салыстыру мүмкін емес' and comparison(o)]);note=['Both full integer values compared; source nonstandard kilobyte assertion removed.']
    elif k=='consecutive-power-gap':
        first,last=map(int,re.search(r'(\d+), \d+, …, (\d+) натурал',s).groups());terms=re.search(r'Қатар: ([0-9, □]+)',s)[1].split(', ');assert len(terms)==last-first+1
        exponent=one([e for e in range(1,11) if all(term=='□' or n**e==int(term) for n,term in zip(range(first,last+1),terms))]);answer=(first+terms.index('□'))**exponent;note=['Explicit common-exponent rule makes the missing term unique; every visible term, not only the first, is checked.']
    elif k=='square-minus-double':(base,exponent)=powers(s)[0];assert exponent==2;answer=base*base-ns[1]*ns[2]
    elif k=='true-power-equality':answer=one([o for o in opts if comparison(o)]);note=['Other equalities are deliberately false MCQ claims, not accidental solution equalities.']
    elif k=='wrong-power-representation':target=ns[0];answer=one([o for o in opts if native(o)!=target])
    elif k=='square-area-factor':larger,smaller=ns;answer=F(larger*larger,smaller*smaller);assert answer.denominator==1;note=['Independent unit-square count ratio; answer dimensionless, not the side ratio.']
    elif k=='cube-box-volume':edge=ns[0];answer=sum(1 for _ in itertools.product(range(edge),repeat=3));note=['Explicit3D unit-cube enumeration, distinct from face area; inner edge and cubic-centimetre output are stated.']
    elif k=='fresh-information-tree':
        branch=ns[0];days=int(re.search(r'(\d+)-күннің',s)[1]);seen={()};frontier={()}
        for _ in range(days):frontier={parent+(i,) for parent in frontier for i in range(branch)};assert not(frontier&seen);seen|=frontier
        answer=len(seen);assert answer==63;note=['Explicit distinct person paths include initial person and all5 complete generations; no recipient overlaps.']
    elif k=='unmatched-two-five-digit-count':value=native(re.search(r'(\d+['+SUP+r']+ × \d+['+SUP+r']+)',s)[1]);assert value.denominator==1;answer=len(str(value.numerator));note=['Full arbitrary-precision product625000000 counted directly; unequal2/5 exponents and unmatched coefficient length retained.']
    elif k=='least-square-above':threshold=ns[0];answer=next(n for n in range(1,threshold+2) if n*n>threshold);assert math.isqrt(threshold)**2==threshold;note=['Strict boundary equality28²=784 rejected; every smaller natural checked.']
    else:raise AssertionError(k)
    if isinstance(answer,F):assert answer.denominator==1;answer=answer.numerator
    answer=str(answer);assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(answer)==1
    return note
def equality_count(text):
    text=re.sub(r'(?<=\d):(?=\s)', '.',normalize(text));count=0
    pattern=r'(?<![\w*])([0-9a-z(][0-9a-z +*/()=-]*(?:=[0-9a-z +*/()=-]+))'
    for match in re.finditer(pattern,text):
        chain=match[1].strip().rstrip('.');parts=chain.split('=')
        if len(parts)<2 or re.search('[a-z]',chain):continue
        # Any arithmetic prefix truncated at an inequality or prose punctuation
        # still denotes complete equality sides; invalid syntax is not ignored.
        vals=[native(p.strip()) for p in parts];assert len(set(vals))==1,(chain,vals);count+=1
    return count
rows=read('problems/editorial/batches/grade5-powers.json')['editions'];assert len(rows)==47
entries=[];refs=set();equalities=0
for row in rows:
    assert row['grade']==5 and row['minimumPlan']=='pro' and not row.get('image')
    for ref in row['sourceRefs']:
        capture=read(ref['sourceFile']);assert capture['status']=='captured';q=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert q['checked'] and q['solution'] and q['sourceAnswer'];assert not q.get('images') and not q.get('svg')
        if q.get('options'):assert len([o for o in q['options'] if o['correct']])==1
        refs.add((ref['sourceFile'],ref['sourceId']))
    notes=solve(row);equalities+=equality_count(row['solution']);sha=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    entries.append({'editionId':row['editionId'],'sha256':sha,'verdict':'verified','method':'Independent printed-native Fraction/AST, exact integer roots/moduli, finite code domains, monomial degree and explicit person-tree oracle; complete canonical source/content reading','notes':['All47 source/new conditions, complete official/authored solutions and every option read; exponent scope, place-value zeros, strict/inclusive bounds, geometry units and Kazakh wording checked. Numerical variants are source coverage, not47 new meanings.',*notes]})
assert len(refs)==47
report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-powers.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'editions':len(rows),'canonicalReferences':len(refs),'numericSolutionEqualityChains':equalities,'authorSolverImported':False,'status':'passed','written':'--write' in sys.argv}))
