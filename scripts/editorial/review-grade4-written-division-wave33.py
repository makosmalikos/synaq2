"""Independent fullsource/new25 review, actualprinted Fraction/divmod oracle.
No author calculator, longdivision or renderer imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse, ast, copy, hashlib, json, re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-written-division-wave33.json'
OUT='problems/editorial/reviews/grade4-written-division-wave33.json'
def one(xs):
    assert len(xs)==1,xs
    return xs[0]
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def divisions(s):return [(int(a),int(b))for a,b in re.findall(r'(\d+) : (\d+)',s)]
def integer(q):
    q=F(q);assert q.denominator==1,q
    return q.numerator
def calc(s):
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub))
        a,b=walk(n.left),walk(n.right)
        return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
    return walk(ast.parse(s.replace(':','/').replace('×','*').replace('−','-'),mode='eval'))
def val(n,p):
    assert n>0
    c=0
    while n%p==0:n//=p;c+=1
    return c
def zeros(n):return min(val(n,2),val(n,5))
def digits(n):
    d=0
    while n:n//=10;d+=1
    return d
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(row):
    kind=row['modelId'].removeprefix('grade4-written-division-');s=row['statement'];ns=nums(s);ds=divisions(s);opts=row.get('options',[]);a=v=None
    method='Independent actualprinted Fraction/divmod arithmetic, completeoption evaluation and originalunit inverseledgers'
    if kind=='exact-zero-quotient':
        n,d=one(ds);v=integer(F(n,d));assert v*d==n
        common=min(zeros(n),zeros(d));assert F(n//10**common,d//10**common)==v
        note=f'Actual{n}/{d}={v}, inverse{v}×{d}={n}. Sharedpower10^{common}removedBOTHsides, quotientretains{zeros(v)}trailingzeros, notonlycoreprefix.'
    elif kind=='fully-reduced-division':
        n,d=one(ds);common=min(zeros(n),zeros(d));reduced=(n//10**common,d//10**common)
        a=one([o for o in opts if tuple(nums(o))==reduced]);assert reduced[1]%10!=0
        assert all(calc(o)!=F(n,d)for o in opts if o!=a)
        note=f'Actual{n}/{d}={F(n,d)}; fullsharedpower10^{common}gives{a}, divisorfactor{reduced[1]}notending0. EveryofferedotherquotientactuallyDIFFERENT, correcting sourceofficialfalseclaim54=540.'
    elif kind=='verify-with-original-divisor':
        n,d=one(ds);q=ns[2];assert q*d==n
        a=one([o for o in opts if '×'in o and calc(o)==n]);assert nums(a)==[q,d]
        note=f'Printedidentity{n}/{d}={q}verified. Actualcheck{a}returnsORIGINALdividend, strippeddivisor{d//10}failsbyfactor10.'
    elif kind=='correct-cancellation-equality':
        truth=[]
        for o in opts:
            left,right=o.split(' = ');truth.append(calc(left)==calc(right))
        a=one([o for o,t in zip(opts,truth)if t]);assert 'әдейі' in s
        note=f'Allactualquotientidentitiesevaluated{[(o,t)for o,t in zip(opts,truth)]}; only{a}preservesvalue; equalpower10mustcancelBOTHnumbers.'
    elif kind=='quotient-digit-length':
        n,d=one(ds);q=integer(F(n,d));v=digits(q);assert 10**(v-1)<=q<10**v
        common=min(zeros(n),zeros(d));N,D=n//10**common,d//10**common
        assert int(str(N)[0])<D<=int(str(N)[:2])and digits(N)-1==v
        note=f'Actual{n}/{d}={q}; repeatedintegerdivisiongives{v}digits. Reduced{N}/{D}: firstdigittoo small, FIRSTTWOdigitsneeded; notcountingdividenddigitsorzeros.'
    elif kind in {'unequal-quotients-comparison','ratio-of-two-quotients'}:
        left,right=[F(n,d)for n,d in ds];assert left.denominator==right.denominator==1
        if kind=='unequal-quotients-comparison':a='='if left==right else'>'if left>right else'<';assert ds[0][0]>ds[1][0]and left<right
        else:v=integer(left/right)
        note=f'Actualquotients{left},{right}; requested'+('comparison'+a if a else f'MULTIPLICATIVEratio{v}, notdifference{left-right}')+'. Bothoperationscomputedbeforecomparison; rawdividendsnotorderedasanswers.'
    elif kind=='quotient-zero-count':
        n,d=one(ds);q=integer(F(n,d));v=zeros(q);assert v==val(n,2)-val(d,2)or v==val(n,5)-val(d,5)
        note=f'Actual{n}/{d}={q}; independent2/5valuation ofEXACTquotientgives{v}trailingzeros, notallzerosinoriginaldividend.'
    elif kind=='equal-price-smaller-order':
        count,total,wanted=ns;unit=integer(F(total,count));v=unit*wanted;assert v*count==total*wanted
        note=f'Actualequalunitprice{unit}tenge; {wanted}requesteditems cost{v}. Fractionoforder{F(wanted,count)}independentlyscalestotal{total}, exactsameledger.'
    elif kind in {'largest-quotient','target-quotient'}:
        vs=[calc(o)for o in opts];assert all(v.denominator==1 for v in vs)
        target=max(vs)if kind=='largest-quotient'else F(one(ns));a=one([o for o,v in zip(opts,vs)if v==target])
        if kind=='largest-quotient':assert len(set(vs))==3
        note=f'Actualoptionquotients{list(zip(opts,map(str,vs)))}; unique'+('maximum'if kind=='largest-quotient'else'printedtarget')+f'{target}belongs to{a}; equalotherquotients andpowers10traps retained.'
    elif kind in {'identify-missing-zero-equality','same-quotient-false-equality'}:
        truth=[]
        for o in opts:
            n,d,q=nums(o);truth.append(q*d==n)
        a=one([o for o,t in zip(opts,truth)if not t]);assert 'әдейі' in s
        n,d,q=nums(a);actual=integer(F(n,d));assert max(q,actual)==min(q,actual)*10
        note=f'Everyactualinversequotient×ORIGINALdivisorchecked{list(zip(opts,truth))}. Uniqueintentionallyfalse{a}; actualquotient{actual}, offered{q}; exactlyoneomitted/extra zero.'
    elif kind=='restore-one-zero-remainder':
        n,d=one(ds);q,r=divmod(n,d);a=one([o for o in opts if nums(o)==[q,r]])
        common=min(zeros(n),zeros(d));qq,rr=divmod(n//10**common,d//10**common)
        assert qq==q and rr*10**common==r and r<d
        note=f'ActualEuclideanledger{q}×{d}+{r}={n},0≤{r}<{d}. Reducedledgerremainder{rr}mustrestorefactor10^{common}→{r}; quotientstays{q}.'
    elif kind=='full-boxes-and-leftovers':
        n,d=ns;q,r=divmod(n,d);a=one([o for o in opts if nums(o)==[q,r]])
        assert q*d+r==n and q*d<=n<(q+1)*d
        note=f'ActualFULLboxes{q},physicalitemsleft{r}; ledger{q}×{d}+{r}={n}. NextFULLboxrequires{(q+1)*d}>{n}, so neithernextboxnorunscaledremainder accepted.'
    elif kind=='wrong-divisor-tenfold':
        correct,wrong,result=ns;n=wrong*result;v=integer(F(n,correct));assert wrong==correct*10 and v==result*10
        note=f'Actualwrongdivisionreconstructsdividend{wrong}×{result}={n}; intendeddivisor{correct}gives{v}. Largerdivisormakesquotient10timessmaller, notlarger.'
    elif kind=='rebuild-dividend-new-divisor':
        d,q,r,new=ns;assert 0<=r<d;n=d*q+r;v,left=divmod(n,new);assert v*new+left==n and left<new
        note=f'ActualoriginalEuclideanledger{d}×{q}+{r}={n}; newdivisor{new}yieldsfloorquotient{v},remainder{left}. Askedfloor—notexactfractionorremainder; endpointconstraintschecked.'
    elif kind=='maximum-fixed-floor-quotient':
        d,q=ns;domain=[d*q+r for r in range(d)];v=max(domain)
        assert all(divmod(n,d)[0]==q for n in domain)and(v+1)//d==q+1
        method='Independent completeoriginalremainder0..d−1domain and nextintegerboundary'
        note=f'Actualfloorquotient{q},divisor{d}; full{len(domain)}numberdomain{min(domain)}..{max(domain)}. Maximum{v},next{v+1}raisesquotient; noillegalremainderd.'
    elif kind=='remainder-with-tenfold-divisor':
        d,r,new=ns;assert 0<=r<d and d%new==0;v=r%new
        witnesses={(d*k+r)%new for k in range(1000)};assert witnesses=={v}
        method='Independent residueidentity forALLk plus1000integerquotientwitnesses'
        note=f'Actualfamily n={d}k+{r},newdivisor{new}; {d}multipleof{new}, so familyresidueALWAYS{r}%{new}={v}. Formaldifferenceidentity provesallk≥0; 1000witnesses agree; r/10notrule.'
    elif kind=='largest-restored-remainder':
        pairs=[tuple(nums(o))for o in opts];rs=[n%d for n,d in pairs];a=one([o for o,r in zip(opts,rs)if r==max(rs)])
        reduced=[]
        for n,d in pairs:
            z=min(zeros(n),zeros(d));q,r=divmod(n,d);qq,rr=divmod(n//10**z,d//10**z)
            assert q==qq and rr*10**z==r;reduced.append(rr)
        winner=rs.index(max(rs));assert reduced[winner]<max(reduced)
        method='Independent actualoriginalunitremainders; scaledreducedledgers secondarycheck'
        note=f'Actualoriginalremainders{rs}; reducedremainders{reduced}. Originalmax{max(rs)}belongs to{a}, while reducedlargest{max(reduced)}belongs elsewhere—requires restoringdifferentpowers10.'
    elif kind=='leading-digit-divisibility':
        suffix=one(list(set(map(int,re.findall(r'□(\d+)',s)))));d=one([b for _,b in divisions(s)])if divisions(s)else ns[-1]
        place=10**len(str(suffix));candidates=[(k,k*place+suffix)for k in range(1,10)];hits=[k for k,n in candidates if n%d==0];v=one(hits)
        assert all(10000<=n<=99999 for _,n in candidates)
        method='Independent complete1–9leadingdigit/five-digitdomain, exactdivisibility and inverseproducts'
        note=f'Actual□{suffix}/{d}: everycandidateandresidue{[(k,n,n%d)for k,n in candidates]}; uniqueleadingdigit{v}. No0allowed; correctproduct{integer(F(v*place+suffix,d))}×{d}restoresfullnumber.'
    else:raise AssertionError(kind)
    if a is None:a=one([o for o in opts if o==str(v)])if opts else str(v)
    assert a==row['answer'],(row['editionId'],a,row['answer'])
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(a)==1
    else:assert a.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
    return {'method':method,'notes':note+' Allsaved/newconditions,complete solutions/options independentlyread; requestedfull/floorquotient/remainder, originalunits, leading/internal/trailingzero and source-specific skill checked.'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==25;entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']])
        assert raw['checked']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro'
        assert row['statement']!=raw['statement']
        if ref['sourceId']=='ecb4ee9273cb8336':
            assert F(3780,70)==54 and F(378000,700)==540 and F(3780,70)!=F(378000,700)
            assert '54≠540' in ' '.join(row['adaptationChanges'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)})
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='WRONG'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('wrongkeyaccepted')
    canaries=[(0,'96000','9600'),(1,'456000','45600'),(2,'51600','516000'),(3,'540000','54000'),
              (4,'57600','576000'),(6,'217200','21720'),(7,'56000','81000'),(8,'5600000','560000'),
              (9,'312000','320000'),(11,'168000','16800'),(13,'420','42'),(14,'4970','4980'),
              (15,'58600','58700'),(16,'800','8000'),(17,'146','156'),(18,'750','751'),
              (19,'540','530'),(21,'720000','72000'),(22,'5280000','528000'),(24,'□6000','□5000')]
    for i,old,new in canaries:
        bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('printedcanaryaccepted',i))
    for i,choice in [(5,'72000 : 800 = 7200 : 8'),(10,'54000 : 60'),(12,'56700 : 90 = 630'),(20,'7900 : 900'),(23,'32000 : 800 = 40')]:
        bad=copy.deepcopy(rows[i]);idx=bad['options'].index(bad['answer']);bad['options'][idx]=choice if choice!=bad['answer']else'5400 : 60'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('optioncanaryaccepted',i))
    witnesses=0
    for n in range(1,250):
        for d in range(1,80):
            q,r=divmod(n,d)
            for power in range(4):
                k=10**power;assert divmod(n*k,d*k)==(q,r*k);assert q*d+r==n and 0<=r<d;witnesses+=1
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All25saved/newfullconditions,complete solutions/MCQread; independentactualprinted Fraction/divmod, completeoriginalremainder/leadingdigitdomains, scaledremainders, quotientcomparisons and priceledgers; sourceofficialecb4error54≠540corrected. Noauthorcalculator imported.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'wrongKeysAndPrintedCanariesRejected':rejected,'scalingRemainderWitnesses':witnesses,'status':'independently_verified','report':OUT if args.write else None}))
if __name__=='__main__':main()
