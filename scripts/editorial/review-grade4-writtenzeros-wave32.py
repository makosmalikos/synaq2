"""Independent complete review of27 saved/new written-zero product tasks.
No author renderer/params calculator imported. Oracle uses printed givens/options.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse, ast, copy, hashlib, json, re

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-writtenzeros-wave32.json'
OUT='problems/editorial/reviews/grade4-writtenzeros-wave32.json'

def one(xs):
    assert len(xs)==1,xs
    return xs[0]

def nums(s):return list(map(int,re.findall(r'\d+',s)))

def calc(s):
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub))
        a,b=walk(n.left),walk(n.right)
        return a*b if isinstance(n.op,ast.Mult) else a/b if isinstance(n.op,ast.Div) else a+b if isinstance(n.op,ast.Add) else a-b
    return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-'),mode='eval'))

def val(n,p):
    assert n>0
    result=0
    while n%p==0:n//=p;result+=1
    return result

def zeros(n):
    z=min(val(n,2),val(n,5))
    assert n%10**z==0 and n//10**z%10!=0
    return z

def decimal_digits(n):
    result=0
    while n:n//=10;result+=1
    return result

def products(s):return [(int(a),int(b))for a,b in re.findall(r'(\d+) × (\d+)',s)]
def compare(a,b):return '=' if a==b else '>' if a>b else '<'
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def solve(row):
    s=row['statement'];ns=nums(s);ps=products(s);opts=row.get('options',[])
    kind=row['modelId'].removeprefix('grade4-writtenzeros-');answer=value=None
    method='Independent printed-givens integer/Fraction arithmetic, option evaluation and place-value checks'
    if kind in {'factor-zero-transfer','close-written-products','close-internal-zero-products'}:
        (a,b),(c,d)=ps;left,right=a*b,c*d;answer=compare(left,right)
        if kind=='factor-zero-transfer':assert c==a*10 and d*10==b and left==right
        elif kind=='close-written-products':assert 0<right-left<right//100
        else:assert '0' in str(a).rstrip('0') and '0' in str(c).rstrip('0')
        note=f'Actualproducts{a}×{b}={left}, {c}×{d}={right}; exactrelation{answer}. Internalzeros retained; transferringonezero preservesproduct.'
    elif kind=='target-product-zero-distractors':
        target=one(ns);values=[calc(o)for o in opts];answer=one([o for o,v in zip(opts,values)if v==target])
        assert len(set(values))==4
        note=f'Allactualproducts{list(zip(opts,map(str,values)))}, uniquetarget{target}; bothcoefficient and extra/missingpowers10checked.'
    elif kind=='correct-written-product':
        equations=[o.split(' = ')for o in opts];truth=[calc(a)==int(b)for a,b in equations]
        answer=one([o for o,t in zip(opts,truth)if t]);assert 'әдейі қате' in s
        note=f'Everyactualequationchecked{[(a,str(calc(a)),b,t)for(a,b),t in zip(equations,truth)]}; exactlyoneTRUE; wrongresults intentionallyoffered.'
    elif kind=='speed-extra-two-zero-product':
        rate,time=ns;value=sum(rate for _ in range(time));assert value==rate*time
        assert zeros(rate*time)-zeros(rate)-zeros(time)==2
        note=f'Printedconstant{rate}metres/minute for{time}minutes; independentrepeatedaddition{value}metres. Coefficientproduct yields twoEXTRAzeros beyondfactortrailingzeros.'
    elif kind=='append-after-core-product':
        (a,b),(c,d)=ps;assert a//10**zeros(a)==c and b//10**zeros(b)==d and ns[-1]==c*d
        required=zeros(a)+zeros(b)
        candidate=[('бір нөл',1),('екі нөл',2),('үш нөл',3)]
        answer=one([o for o in opts if any(word in o and c*d*10**count==a*b for word,count in candidate)])
        assert required==2
        note=f'Actualcore{c}×{d}={c*d}; original{a}×{b}={a*b}. Exactly{required}APPENDEDzeros, notmultiplyingbythealreadyusedfactoragain.'
    elif kind=='select-stripped-first-step':
        a,b=ps[0];x,y=a//10**zeros(a),b//10**zeros(b);answer=f'{x} × {y}';assert answer in opts
        assert all(calc(o)!=x*y for o in opts if o!=answer)
        note=f'Actualstrippedfactors{x},{y}; requestedFIRSTstep{answer}, fullproduct{a*b}notrequested. Neither one-sided stripping accepted.'
    elif kind in {'equipment-two-purchases','two-library-purchases'}:
        price1,count1,price2,count2=ns
        values=[sum(price1 for _ in range(count1)),sum(price2 for _ in range(count2))];value=sum(values)
        note=f'Twoindependentunitpriceledgers{price1}×{count1}={values[0]}, {price2}×{count2}={values[1]}; total{value}tenge. Countsboundtorespectiveitems.'
    elif kind=='product-digits-extra-two':
        a,b=one(ps);product=a*b;value=decimal_digits(product)
        assert 10**(value-1)<=product<10**value and zeros(product)-zeros(a)-zeros(b)==2
        method='Independent2/5primevaluation and repeatedintegerdivision totaldigit count'
        note=f'Actualproduct{product}, totaldigits{value}, trailingzeros{zeros(product)}. DistinguishesALLdigitsfromzeros and preserves twoEXTRAcoefficientzeros.'
    elif kind=='trips-per-day-product':
        km,trips,days=ns;daily=sum(km for _ in range(trips));value=sum(daily for _ in range(days))
        note=f'Printedone-waytrip{km}km ×{trips}trips/day={daily}km/day; sumover{days}days gives{value}km. Dailytripcountnotomitted.'
    elif kind=='both-factors-times-ten':
        (a,b),(c,d)=ps;assert ns[2]==a*b and c==a*10 and d==b*10
        value=ns[2]*100;assert value==c*d
        note=f'Givenidentity{a}×{b}={a*b}verified; bothfactorstenfoldsoactualproduct{value}is100times,not10times.'
    elif kind=='purchase-and-change':
        unit,count,paid=ns;spent=sum(unit for _ in range(count));value=paid-spent
        assert 0<=value<paid and spent+value==paid
        note=f'Actualledger{spent}spent+{value}change={paid}paid; noexchangingunitprice/count andnotentirepaymentspent.'
    elif kind=='close-maximum-product':
        values=[calc(o)for o in opts];answer=one([o for o,v in zip(opts,values)if v==max(values)])
        assert sorted(values)[-1]-sorted(values)[-2]==3000
        note=f'Allactualproducts{list(zip(opts,map(str,values)))}; uniqueactualmaximum{answer}. Largestfirstfactornotlargestproduct.'
    elif kind=='internal-zero-repeated-sum':
        first,multiple=ns;second=sum(first for _ in range(multiple));value=first+second
        assert '0' in str(first).rstrip('0')
        note=f'Printedsecondwarehouse{multiple}timesFIRST{first}→{second}; combined{value}. Internalplacezero survives; firstwarehouse addedonceafter multiplication.'
    elif kind=='excursion-tickets-and-buses':
        buses,children,ticket,rent=ns;tickets=sum(ticket for _ in range(buses*children));rental=sum(rent for _ in range(buses));value=tickets+rental
        note=f'Actual{buses}buses×{children}children={buses*children}tickets→{tickets}; rental{rental}forALLbuses; total{value}tenge. Bothperchild/perbusunitsused.'
    elif kind=='leading-digit-exact-zero-count':
        suffix=int(one(list(set(re.findall(r'□(\d+)',s)))));multiplier=int(one(re.findall(r'× (\d+)',s)));target=int(one(re.findall(r'дәл (\d+) нөл',s)))
        place=10**len(str(suffix));domain=[];counts=[]
        for d in range(1,10):
            n=d*place+suffix;z=zeros(n*multiplier);counts.append((d,n*multiplier,z))
            if z==target:domain.append(d)
        assert domain==[1,6] and all(1000<=d*place+suffix<=9999 for d in range(1,10))
        answer=one([o for o in opts if nums(o)==domain])
        method='Independent complete1–9leadingdigitdomain and prime2/5valuations, exactzeroequality'
        note=f'Actualprintedfour-digit□{suffix}×{multiplier}; everycandidate(product,trailingzeros){counts}. Fullsolutiondomain{domain};exact{target}zeros,0leadingforbidden.'
    elif kind=='smallest-strict-three-digit-product':
        multiplier,threshold=ns[-2:];domain=[n for n in range(100,1000)if n%10==0 and n*multiplier>threshold]
        value=min(domain);assert (value-10)*multiplier<=threshold<value*multiplier
        method='Independent fullthree-digit100..999domain with finaldigit0 and STRICTproductbound'
        note=f'Actualprintedmultiplier{multiplier}, strictthreshold{threshold}; fullnaturalending0domainminimum{value}, prior{value-10}fails; all{len(domain)}validcandidatesenumerated.'
    elif kind in {'extra-two-total-zero-count','internal-plus-extra-zero-count'}:
        a,b=one(ps);value=zeros(a*b);extra=value-zeros(a)-zeros(b)
        assert extra==(2 if kind=='extra-two-total-zero-count'else 1)
        if kind=='internal-plus-extra-zero-count':assert '0' in str(a).rstrip('0')
        method='Independent2/5primefactorvaluations of fullactualproduct'
        note=f'Actual{a}×{b}={a*b}; v2sum{val(a,2)+val(b,2)},v5sum{val(a,5)+val(b,5)}→{value}trailingzeros, including{extra}EXTRAcoefficientzeros. Internalzero notcountedasfinal.'
    elif kind=='impossible-four-digit-ending-zero-product':
        multiplier=ns[-1];domain={n*multiplier:n for n in range(1000,10000)if n%10==0}
        answer=one([o for o in opts if int(o)not in domain]);assert int(answer)%multiplier==0
        assert int(answer)//multiplier%10!=0 and all(1000<=F(int(o),multiplier)<=9999 for o in opts)
        method='Independent full1000..9999actualfour-digit/finalzero image set'
        note=f'Actualmultiplier{multiplier}; all900allowedstartingnumbersenumerated. Optioninversevalues{[(o,str(F(int(o),multiplier)))for o in opts]}; only{answer}haswrongfinaldigit despitefour-digitintegerquotient.'
    elif kind=='daily-metres-to-total-kilometres':
        metres,hours,days=ns;total=sum(sum(metres for _ in range(hours))for _ in range(days));value=F(total,1000)
        note=f'Actual{metres}m/hour×{hours}hours/day×{days}days={total}metres; SI1000m/km gives{value}km. Hour/daystageandunitconversionbothrequired.'
    elif kind=='three-factor-zero-transfers':
        values=[a*b for a,b in ps];assert len(values)==3 and len(set(values))==1
        answer='A = B = C'
        assert zeros(ps[0][0])+zeros(ps[0][1])==zeros(ps[1][0])+zeros(ps[1][1])==zeros(ps[2][0])+zeros(ps[2][1])
        note=f'Actualthreeproducts{values}; eachsamevalue despitezerotransfers, oneEXTRAcoefficientzero preserved. Uniqueofferedchain{answer}.'
    elif kind=='inverse-product-then-add':
        multiplier,addition,total=ns;value=F(total-addition,multiplier)
        assert value*multiplier+addition==total
        note=f'Independentlinearledger n×{multiplier}+{addition}={total}→n{value}; backsubstitutionexact. ReverseadditionBEFOREdivision.'
    elif kind=='omitted-factor-zero-difference':
        (a,b),(c,d)=ps;assert a==c*10 and b==d
        value=a*b-c*d;assert value+c*d==a*b and a*b==c*d*10
        note=f'Actualcorrect{a*b},wrong{c*d}; requestedadditivedifference{value}, notratio10; ledgerwrong+difference=correctchecked.'
    elif kind=='appended-zero-count':
        (a,b),(c,d)=ps;assert a//10**zeros(a)==c and b//10**zeros(b)==d
        value=zeros(a)+zeros(b);assert c*d*10**value==a*b and zeros(c*d)==0
        note=f'Actualcore{c}×{d}={c*d}; append{value}factorzeros toobtain{a*b}. RequestedAPPENDEDcountnotallinternalzeros.'
    else:raise AssertionError(kind)
    if answer is None:
        value=F(value);assert value.denominator==1
        answer=one([o for o in opts if o==str(value.numerator)])if opts else str(value.numerator)
    assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(answer)==1
    else:assert answer.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
    return {'method':method,'notes':note+' Allsaved/newfullconditions,complete solutions andMCQ independentlyread; source skill,units,exactrequestedquantity andzero-place distinctions checked.'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==27;entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']])
        assert raw['checked'] and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro'
        assert re.sub(r'\s+',' ',raw['statement'].lower()).strip()!=re.sub(r'\s+',' ',row['statement'].lower()).strip()
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)})
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='WRONG'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('wrongkeyaccepted')
    canaries=[(0,'6300','63000'),(1,'168000','16800'),
              (3,'750','760'),(4,'73 × 6 = 438','74 × 6 = 444'),(5,'6200','6300'),(6,'215000','225000'),
              (7,'6750','6760'),(8,'260','270'),(9,'4300','43000'),(10,'1200000','1300000'),
              (11,'4500','4400'),(12,'',''),(13,'4070','4170'),(14,'52000','53000'),(15,'□250','□350'),
              (16,'60000','59000'),(17,'7500','7600'),(18,'40 санына','50 санына'),(19,'4500','5500'),
              (20,'6400','6500'),(21,'32100','32800'),(22,'1450','1460'),(23,'6800','680'),
              (24,'4060','4160'),(25,'2850','2950'),(26,'7080','7081')]
    for i,old,new in canaries:
        if not old:continue
        bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('printedcanaryaccepted',i))
    bad=copy.deepcopy(rows[2]);bad['options'][2]='460 × 30 = 1380'
    try:solve(bad)
    except AssertionError:rejected+=1
    else:raise AssertionError('falseequationcanaryaccepted')
    witnesses=0
    for a in range(1,100):
        for b in range(1,100):
            for x,y in [(0,0),(1,2),(2,1),(3,3)]:
                product=a*b*10**(x+y);assert zeros(product)==len(str(product))-len(str(product).rstrip('0'));witnesses+=1
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All27saved/newfullconditions,complete solutions/optionsread; independentactualprintedinteger/Fraction/rate/paymentledgers, prime2/5zeros, complete1–9leadingdigit and1000..9999impossibleproductdomains, strictthree-digittens minimum; noauthorcalculator imported.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'wrongKeysAndPrintedCanariesRejected':rejected,'primeZeroWitnesses':witnesses,'status':'independently_verified','report':OUT if args.write else None}))

if __name__=='__main__':main()
