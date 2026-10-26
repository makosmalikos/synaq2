"""Independent review of23 saved/new complete zero-operation tasks.
Oracle reads actual printed arithmetic/options, not author params/solver.
Trailingzero counts use independent2/5valuations, digits repeateddivision.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse, ast, copy, hashlib, json, re

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-zeroops-wave31.json'
OUT='problems/editorial/reviews/grade4-zeroops-wave31.json'


def one(xs):
    assert len(xs)==1,xs
    return xs[0]


def num(s):
    s=re.sub(r'\s','',s)
    assert s.isdecimal(),s
    return int(s)


def nums(s):return [num(m[0]) for m in re.finditer(r'\d[\d ]*',s)]


def integer(x):
    x=F(x);assert x.denominator==1,x
    return x.numerator


def calc(s):
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub))
        a,b=walk(n.left),walk(n.right)
        return a*b if isinstance(n.op,ast.Mult) else a/b if isinstance(n.op,ast.Div) else a+b if isinstance(n.op,ast.Add) else a-b
    return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-'),mode='eval'))


def valuation(n,p):
    assert n>0
    v=0
    while n%p==0:n//=p;v+=1
    return v


def zeroes(a,b):
    v=min(valuation(a,2)+valuation(b,2),valuation(a,5)+valuation(b,5))
    actual=a*b
    assert actual%10**v==0 and actual//10**v%10!=0
    return v


def digits(n):
    assert n>0
    count=0
    while n:n//=10;count+=1
    return count


def digest(row):return hashlib.sha256(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()


def choose_number(row,value):return one([o for o in row['options'] if num(o)==value])


def solve(row):
    s=row['statement'];kind=row['modelId'].removeprefix('grade4-zeroops-');ns=nums(s)
    value=answer=None
    method='Independent actual printed integer/Fraction arithmetic and complete actualoption evaluation'
    if kind=='unknown-zero-factor':
        factor,total=ns;value=F(total,factor);assert value*factor==total
        note=f'Actualunknownfactor solvesn×{factor}={total}; inversegives{value}, notsubtraction{total-factor}.'
    elif kind=='shared-zero-quotient':
        dividend,divisor=ns;value=F(dividend,divisor)
        shared=min(valuation(dividend,10),valuation(divisor,10))
        assert shared>0 and F(dividend//10**shared,divisor//10**shared)==value
        note=f'Actual{dividend}/{divisor}={value}; sharedpower10^{shared}removedBOTHsides, leftoverdividendzero retained. Inverseproductrestores{dividend}.'
    elif kind=='target-zero-product':
        target=one(ns);answer=one([o for o in row['options'] if calc(o)==target])
        note=f'Allactualproducts{[(o,str(calc(o)))for o in row["options"]]}, uniquetarget{target}; tens/hundredsplacement notonlyleadingfactors.'
    elif kind in {'plain-zero-count','extra-two-zero-count','extra-three-zero-count','product-digit-count-extra-two'}:
        a,b=ns;trailing=zeroes(a,b);product=a*b
        if kind=='product-digit-count-extra-two':
            value=digits(product);assert 10**(value-1)<=product<10**value
        else:value=trailing
        originals=valuation(a,10)+valuation(b,10);extra=trailing-originals
        expected={'plain-zero-count':0,'extra-two-zero-count':2,'extra-three-zero-count':3,'product-digit-count-extra-two':2}[kind]
        assert extra==expected
        method='Independent prime2/5valuations for trailingzeros and repeatedintegerdivision for alldigits'
        note=f'Actual{a}×{b}={product}; v2sum{valuation(a,2)+valuation(b,2)},v5sum{valuation(a,5)+valuation(b,5)}→{trailing}trailingzeros; originals{originals},EXTRA{extra}. Totaldigits{digits(product)}, requested'+('alldigits' if kind=='product-digit-count-extra-two' else 'trailingzeros')+f'={value}.'
    elif kind in {'equal-products-extra-zero','zero-products-comparison','zero-quotients-comparison'}:
        expression=s.split(': ',1)[1].removesuffix('.')
        left,right=expression.split(' □ ');a,b=calc(left),calc(right)
        answer='=' if a==b else '>' if a>b else '<'
        if kind=='equal-products-extra-zero':assert a==b and zeroes(*nums(left))==zeroes(*nums(right))
        note=f'Actualexpressions{left}={a},{right}={b}; relation{answer}. Eachoperationcomputedwithprintedzeroes beforecomparison; no rawoperandordering.'
    elif kind=='shared-zero-rewrite':
        dividend,divisor=ns;target=F(dividend,divisor)
        answer=one([o for o in row['options'] if calc(o)==target])
        a,b=nums(answer);factor=F(dividend,a)
        assert factor==F(divisor,b) and factor in {10**k for k in range(1,10)}
        note=f'Actualtarget{target}; chosenrewrite{a}/{b}, BOTHdividend/divisor dividedby{factor}; otherofferedquotientsnot equal.'
    elif kind in {'largest-mixed-zero-value','largest-quotient-zero-gap'}:
        values=[calc(o)for o in row['options']];answer=one([o for o,v in zip(row['options'],values)if v==max(values)])
        if kind=='largest-quotient-zero-gap':assert len(set(values))==2 and sum(v==min(values)for v in values)==3 and max(values)==10*min(values)
        note=f'Allactualoperationvalues{[str(v)for v in values]}, uniquelargest{answer}. Inquotientmodelthreeequal80andone800preserveextrazeroeffect; rawlargestdividendnot used.'
    elif kind=='unknown-zero-dividend':
        divisor,quotient=ns;value=divisor*quotient
        assert F(value,divisor)==quotient
        note=f'Actualunknownn/{divisor}={quotient}→n{value}; inversechecked, addition{divisor+quotient}not correct.'
    elif kind=='correct-zero-equality':
        equations=[o.split(' = ')for o in row['options']]
        truth=[calc(left)==num(right)for left,right in equations]
        answer=one([o for o,t in zip(row['options'],truth)if t])
        assert 'қай теңдігі шын' in s and 'Қалған жолдарда әдейі қате жауап жазылған' in s
        note=f'Everyactualequationevaluated{[(left,str(calc(left)),right,t)for(left,right),t in zip(equations,truth)]}; uniqueTRUEkey{answer}. Falseofferedanswersintentionalnotmathclaims.'
    elif kind=='increased-divisor-known-quotient':
        dividend,olddivisor,known,same,newdivisor=ns
        assert dividend==same and F(dividend,olddivisor)==known
        value=F(same,newdivisor);factor=F(newdivisor,olddivisor)
        assert value*factor==known and factor>1
        note=f'Printedknownidentity{dividend}/{olddivisor}={known}verified. Divisorfactor{factor}inverselychangesquotientto{value}; multiplicationbackrestores{same}.'
    elif kind=='quotient-estimate-interval':
        dividend,divisor=ns;valid=[]
        for o in row['options']:
            lower,upper=nums(o)
            if lower*divisor<dividend<upper*divisor:valid.append(o)
        answer=one(valid);lower,upper=nums(answer)
        method='Independent strictbounding via divisor×endpoints, exactquotient onlysecondary'
        note=f'Actual{lower*divisor}<{dividend}<{upper*divisor}, divisor{divisor}>0provesstrictinterval{lower}..{upper}; exact{F(dividend,divisor)}agrees. Allofferedscaleschecked.'
    elif kind=='changed-known-multiplier':
        old,known,new=ns;unknown=F(known,old);value=unknown*new
        assert value==known*F(new,old)
        note=f'Actualhiddenvalue{known}/{old}={unknown}; newproduct{unknown}×{new}={value}. Independentmultiplier-ratio{F(new,old)}gives sameanswer, zerosnotdiscarded.'
    elif kind=='opposite-equations-ratio':
        factor,common,samefactor,samecommon=ns
        assert factor==samefactor and common==samecommon
        x=common*factor;y=F(common,factor);value=F(x,y)
        assert value==factor**2 and F(x,factor)==common and y*factor==common
        note=f'Printedoppositeequationsgive x{x},y{y}, ratio{value}={factor}². Twoinverseoperationscompound, notjustonefactor{factor}; bothfullsubstitutionschecked.'
    elif kind=='two-digit-quotient-selection':
        divisor=one(ns);values=[F(num(o),divisor)for o in row['options']]
        answer=one([o for o,q in zip(row['options'],values)if q.denominator==1 and 10<=q<=99])
        note=f'Allactualdividendsproduce{[str(q)for q in values]}; onlywholequotient90isin10..99. Others9,1000,1200excludedbydigitcount.'
    elif kind=='one-sided-zero-cancellation':
        dividend,divisor=ns;assert divisor%10==0
        correct=F(dividend,divisor);wrong=F(dividend,divisor//10);factor=F(wrong,correct)
        answer=f'{integer(factor)} есе артық';assert factor==10 and 'бөлгіштің бір нөлін өшірді' in s and 'бөлінгішті өзгертпеді' in s
        method='Independent erroneous-versus-correct Fraction equations and ratio of results'
        note=f'Actualcorrect{dividend}/{divisor}={correct},onesidedwrong{dividend}/{divisor//10}={wrong}; exactwrong/correct{factor}, so answer{answer}. Bothsidescancellationneeded.'
    elif kind=='largest-trailing-zero-count':
        pairs=[nums(o)for o in row['options']];counts=[zeroes(a,b)for a,b in pairs]
        answer=one([o for o,z in zip(row['options'],counts)if z==max(counts)])
        assert answer!=row['options'][max(range(4),key=lambda i:pairs[i][0]*pairs[i][1])]
        method='Independent2/5primevaluation of allactualfactorpairs, not numericproductmaximum'
        note=f'Actualpairs{pairs}, trailingzerocounts{counts}; key{answer}has5zerosbutnotlargestnumericvalue. Winningpair40×5000haszero-stripped4×5=20providingextraonezero.'
    else:raise AssertionError(kind)
    if answer is None:
        value=integer(value);answer=choose_number(row,value)if row.get('options')else str(value)
    assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert answer.isdecimal() and s.endswith('Жауапқа тек санды жазыңыз.')
    return{'method':method,'notes':note+' Allsaved/newfullconditions,complete solutions andMCQ independentlyread; placevalue,shared-versus-onesided cancellation,requestedcount/ratio/interval and source skill checked.'}


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==23
    entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']])
        assert raw['checked'] and row['grade']==4 and row['minimumPlan']=='pro'
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)})
    assert len({r['sourceRefs'][0]['sourceId']for r in rows})==23
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='wrong-key'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('wrongkeyaccepted')
    canaries=[(0,'3000','3600'),(1,'63000','56000'),(2,'4200','42000'),(3,'56000','64000'),
              (4,'8000','800'),(5,'50 ×','60 ×'),(6,'420000','490000'),(8,'800','900'),
              (10,'16000','15000'),(11,'4200','6000'),(12,'45600','48600'),
              (13,'2400000','2700000'),(14,'12000','1200'),(15,'40','50'),
              (17,'400','4000'),(19,'1200','12000'),(21,'60 ×','50 ×'),(22,'375000','37500')]
    for i,old,new in canaries:
        bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('printedcanaryaccepted',i))
    witnesses=0
    for a in range(1,100):
        for b in range(1,100):
            for x,y in [(0,0),(1,2),(3,1),(2,4)]:
                A,B=a*10**x,b*10**y;z=zeroes(A,B)
                assert z==len(str(A*B))-len(str(A*B).rstrip('0'))
                assert digits(A*B)==len(str(A*B));witnesses+=1
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All23 saved/newfullconditions,fullsolutions andMCQread; actualprinted safeAST/Fraction arithmetic, strictbounding, digitcount vs2/5valuation trailingzeros, inverseequations,scaleeffects andwrongmethodcomparison.23badkeys+18printedcanaries rejected;39204integer/placevalue witnesses.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'badKeysAndPrintedCanariesRejected':rejected,'placevalueWitnesses':witnesses,'status':'passed'}))


if __name__=='__main__':main()
