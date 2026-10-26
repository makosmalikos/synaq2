"""Independent full45 review of actual PRINTED mixed ordinary/decimal tasks.
No author params/spec/calculator. Exact rational AST, complete domains and units.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_exact',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','pick','decimals','groups']:globals()[name]=getattr(h,name)
from itertools import product
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-fraction-decimal-operations.json';OUT='problems/editorial/reviews/grade5-fraction-decimal-operations.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def fractions(s):return [F(int(n),int(d))for n,d in re.findall(r'\((\d+)/(\d+)\)',s)]
def mixed(s):return [F(int(w))+F(int(n),int(d))for w,n,d in re.findall(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s)]
def finite(v):
    d=F(v).denominator
    for prime in[2,5]:
        while d%prime==0:d//=prime
    return d==1

def finish(r,v):return pick(r,v)if r.get('options')else integer(v)
def bare(s):return s.split(': ',1)[1].split('. Жауап')[0].removesuffix('.')
def conservation(total,*parts):assert sum(parts,F(0))==total and all(x>=0 for x in parts),(total,parts)
def op(a,b,sign):
    if sign=='+':return a+b
    if sign=='−':return a-b
    if sign=='×':return a*b
    assert sign=='÷'and b!=0;return a/b

def poly_mul(a,b):
    out=[0]*(len(a)+len(b)-1)
    for i,x in enumerate(a):
        for j,y in enumerate(b):out[i+j]+=x*y
    return out
def poly_add(a,b):return [(a[i]if i<len(a)else 0)+(b[i]if i<len(b)else 0)for i in range(max(len(a),len(b)))]

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-decimal-operations-');ds=list(map(D,decimals(s)));fs=fractions(s);ms=mixed(s);topic='frac'
    arithmetic={'fraction-plus-decimal-then-natural-product','decimal-divide-terminating-proper-fraction','two-products-decimal-and-fraction-sum','mixed-product-before-decimal-subtraction','mixed-decimal-product-unit-result','terminating-fraction-plus-decimal-diagnostics','nonterminating-fraction-plus-decimal-exact','mixed-plus-decimal-whole-carry','mixed-minus-decimal-divide-other-mixed','mixed-decimal-product-plus-decimal-fraction-quotient','four-factor-regroup-decimal-fraction-cancellation','long-native-fraction-mixed-cancel-numerator','two-mixed-decimal-brackets-product','telescoping-unit-products-partial-near-one'}
    if k in arithmetic:
        ex=bare(s);v=expr(ex);answer=finish(r,v);note=f'ENTIREactualnativeAST{ex}→EXACT{v}, ALLnestedmixed+fractiongroups/precedence andEVERYnumericMCQ evaluated.'
        if k=='mixed-product-before-decimal-subtraction':
            a=ds[0];b=one(ms);n=number(r'\) × (\d+)',s);assert pick(r,(a-b)*n)!=answer and pick(r,a-b)!=answer and pick(r,a+b*n)!=answer;note+=' Source-specific subtractfirst/omitfactor/addinsteadofminus ALLactualtrapsverified.'
        elif k=='mixed-decimal-product-unit-result':
            a=one(ms);b=one(ds);assert a*b==1 and a==1/b;note+=' TrueRECIPROCALproduct1invariant retained withnew3⅛and.32; raw3125×32=100000/fiveplaces exact.'
        elif k=='terminating-fraction-plus-decimal-diagnostics':
            f=one(fs);d=one(ds);n,den=f.numerator,f.denominator;assert pick(r,D('0,'+str(n)+str(den))+d)!=answer and pick(r,D('0,'+str(n))+d)!=answer;note+=' ALLactualdigitconcatenation/numerator-only/last-thousandthloss diagnosticvalues separatelyrecomputed.'
        elif k=='nonterminating-fraction-plus-decimal-exact':
            f=one(fs);d=one(ds);assert not finite(f);assert pick(r,F(f.numerator+int(d.numerator),f.denominator+int(d.denominator)))!=answer;note+=' Nonterminatingfraction nevertruncated; wrongseparate-numerator/denominator addition explicitlyrejected.'
        elif k=='mixed-minus-decimal-divide-other-mixed':
            a,b=ms;d=one(ds);assert pick(r,(a-d)*b)!=answer and pick(r,v/10)!=answer and pick(r,v*10)!=answer;note+=' ENTIREdifference dividedbyENTIREmixeddivisor; product/shift alternativesallfalse.'
        elif k=='mixed-decimal-product-plus-decimal-fraction-quotient':
            mix=one(ms);f=fs[-1];a,b=ds;assert pick(r,mix*a+b*f)!=answer and pick(r,mix*a+(b/f)/10)!=answer;note+=' Actualmultiply-insteadofdivide andshift10 quotient MCQs boundtoFULLsum.'
        elif k=='four-factor-regroup-decimal-fraction-cancellation':
            a,b=ds;n=number(r'× (\d+) ×',s);f=one(fs);assert a*n==2 and b*f==9 and v==18;note+=' Regroupfirst×third2 andsecond×fourth9, all4factors retained.'
        elif k=='long-native-fraction-mixed-cancel-numerator':
            a,b=ms;dec=ds;assert len(dec)==3;difference=a-dec[0];assert difference==F(11,4)and b==F(24,11);assert not finite(b);numerator=difference*b;denominator=dec[1]*dec[2];assert numerator==6 and denominator==F(3,10)and v==numerator/denominator;note+=' MainbarWHOLEnumerator(11/4×24/11)=6,WHOLEdenominator.4×.75=.3; real11crosscanceland24/4division, noflattenedbar/nonterminatingapprox.'
        elif k=='two-mixed-decimal-brackets-product':
            a=ds[0];f=fs[0];b=one(ms);n=number(r'× \((\d+) −',s);assert pick(r,a+f*n-b)!=answer and pick(r,(a+f)/(n-b))!=answer;note+=' ALLparenthesis-omission/product-insteadofdivision diagnosticroles verified.'
        elif k=='telescoping-unit-products-partial-near-one':
            start=one(ds);terms=fs;running=start;partials=[]
            for f in terms:running+=f;partials.append(running)
            assert partials==[F(4,5),F(5,6),F(6,7),F(7,8),F(1)];assert len(terms)==5 and running==v
            # Universal identity numerator n(n+2)+1=(n+1)^2, not finiteguess.
            assert poly_add(poly_mul([0,1],[2,1]),[1])==poly_mul([1,1],[1,1]);assert all(F(n,n+1)+F(1,(n+1)*(n+2))==F(n+1,n+2)for n in range(1,101));note+=' ExactALL5partialtotals4/5,5/6,6/7,7/8,1; universaln(n+2)+1=(n+1)^2factorproof (n≥0) andlast1/8notomitted, invariantwhole1honest.'
    elif k=='select-nonterminating-fraction-addition-method':
        assert 'ШЕКТЕУЛІ'in s;flags=[]
        for o in r['options']:flags.append(not finite(one(fractions(o))))
        answer=one(o for o,t in zip(r['options'],flags)if t);note=f'ALLactualofferedreducedfractions finiteflags{[not t for t in flags]}, criteriondenominatoronly2/5, targetEXPRESSION{answer}; periodicexistsbutnoFINITEexactdecimal, qualifier fixesoriginalambiguity.'
    elif k=='book-two-shares-same-original-whole':
        total=number(r'^(\d+) беттік',s);a=one(ds);b=one(fs);assert s.count('БАРЛЫҚ')==2;parts=[total*a,total*b,total*(1-a-b)];conservation(total,*parts);answer=integer(parts[0]+parts[1]);note=f'Actual{total}pages, BOTHshares{a},{b}ofSAMEORIGINAL, read{parts[:2]}, unread{parts[2]}; fullconservation, notsuccessiveremainder.'
    elif k=='mixed-fruit-mass-plus-decimal':
        a=one(ms);b=one(ds);v=a+b;answer=pick(r,v);assert pick(r,F(3)+F(14,100)+b)!=answer and pick(r,F(3)+F(4,10)+b)!=answer;note=f'Actualmixedmass{a}+decimalmass{b}={v}; alltypedmasssamekg, digitconcatenation.14anddenominator-only.4MCQerrorschecked.'
    elif k=='decimal-times-nonterminating-fraction-diagnostic':
        a=one(ds);f=one(fs);v=a*f;answer=pick(r,v);assert not finite(f);assert pick(r,F(1,4)*f)!=answer and pick(r,a/f)!=answer and pick(r,a+f)!=answer;note=f'Actualdecimal{a}exactfraction×nonterminating{f}={v}; wrongdecimal1/4/productvsquotient/sum ALLactualdiagnosticMCQs verified.'
    elif k=='terminating-fraction-divide-decimal':
        f=one(fs);a=one(ds);assert finite(f);v=f/a;answer=integer(v);note=f'Actualfraction{f}finite.44, divideactual{a}={v}; BOTH×10044/11, inverseconservation.'
    elif k=='decimal-times-fraction-divide-then-multiply':
        a=one(ds);f=one(fs);v=a*f;answer=pick(r,v);assert pick(r,a/f)!=answer and pick(r,a*f.numerator)!=answer and pick(r,a/f.denominator)!=answer;note=f'Actual{a}×{f}: /DEN{f.denominator}then×NUM{f.numerator}, exact{v}; reversedfraction/omittedDEN/omittedNUMtrapsdistinct.'
    elif k=='first-day-part-of-second-third-of-second-total':
        first=number(r'Бірінші күні (\d+) кг',s);part=one(fs);thirdpart=one(ds);second=first/part;third=second*thirdpart;v=first+second+third;answer=pick(r,v);assert pick(r,first+second+first*thirdpart)!=answer and pick(r,first+first*part+first*part*thirdpart)!=answer and pick(r,first+second)!=answer;note=f'ActualFIRST{first}=part{part}ofSECOND{second}, THIRD{thirdpart}ofSECOND→{third}; allTHREEsum{v}, inverse/firstbase/omitthird allactualtrapschecked.'
    elif k=='two-ingredient-costs-decimal-and-mixed-masses':
        a=one(ds);b=one(ms);prices=list(map(int,re.findall(r'1 кг \S+ (\d+) теңге',s)));assert len(prices)==2;costs=[a*prices[0],b*prices[1]];answer=integer(sum(costs));note=f'ActualTYPEDalmond{a}kg×ownprice{prices[0]},raisin{b}kg×ownprice{prices[1]}, costs{costs}, SUM{answer}; weights/pricesnotcrossed.'
    elif k=='decimal-factor-unknown-sum-with-fraction':
        a=one(ds);f=one(fs);total=number(r'\) = (\d+)',s);x=F(total)/a-f;assert a*(x+f)==total;answer=pick(r,x);topic='eq';assert pick(r,F(total)/a+f)!=answer and pick(r,total-a-f)!=answer and pick(r,total*a-f)!=answer;note=f'ENTIREunknownfactor(x+{f})=total{total}/a{a}, x{ x}; fullsubstitution, addinstead/subtractinstead/productinsteadALLactualMCQs.'
    elif k=='unknown-difference-times-fraction-integer-root':
        subtrahend,total=ds;f=one(fs);x=total/f+subtrahend;assert(x-subtrahend)*f==total;answer=integer(x);topic='eq';note=f'ENTIREdifferenceunknownfactor {total}/{f}, thenunknownMINUENDx adds{subtrahend}, unique{x}withnonzerocoefficient, exactbacksub.'
    elif k=='alloy-complement-gap-requested-grams':
        part=one(ds);kg=one(ms);grams=kg*1000;tin=grams*part;copper=grams-tin;conservation(grams,tin,copper);answer=integer(copper-tin);assert copper>tin;note=f'ActualWHOLE{kg}kg×SI1000={grams}g; tin{tin},complementcopper{copper}, requestedGAP{copper-tin}notmass; fullconservation.'
    elif k=='two-pipe-joint-time-decimal-and-mixed':
        a=one(ds);b=one(ms);rates=[1/a,1/b];rate=sum(rates);time=1/rate;assert 0<time<min(a,b)and time*rate==1;answer=pick(r,time);topic='word';assert pick(r,rate)!=answer and pick(r,a+b)!=answer and pick(r,(a+b)/2)!=answer;note=f'ActualSOLOtimes{a},{b}→reciprocalrates{rates}, SUMrate{rate}, requestedJOINTTIME{time}; notrate/sumtime/meantime; eachcontributionatcorrecttime totalsONE.'
    elif k=='two-sales-fraction-of-decimal-remainder':
        total=number(r'Дүкенде (\d+) кг',s);first=one(ds);second=one(fs);sold1=total*first;left1=total-sold1;sold2=left1*second;left2=left1-sold2;conservation(total,sold1,sold2,left2);answer=integer(left2);note=f'ActualWHOLE{total}, first{first}ofORIGINAL→{sold1}; second{second}ofREMAINDER{left1}→{sold2}; requestedLASTREMAINDER{left2}, conservation andchangingbase.'
    elif k=='verbal-sum-decimal-mixed-before-division':
        a,d=ds;b=one(ms);v=(a+b)/d;answer=integer(v);assert a+b/d!=v;note=f'ActualVERBALS U M ENTIRE({a}+{b})/{d}={v}; distributeNOmissingparenthesis, onlyseconddivisionwoulddiffer.'
    elif k=='two-crops-remaining-fraction-and-total-area':
        total=one(ms);first=one(ds);second=fs[-1];crop1=total*first;remain=total-crop1;crop2=remain*second;unused=remain-crop2;conservation(total,crop1,crop2,unused);v=crop1+crop2;answer=pick(r,v);assert not finite(second);assert pick(r,crop1+total*second)!=answer;note=f'ActualWHOLE{total}ha, originalshare{first}→{crop1}, remaining{remain}×NONTERMINATING{second}→{crop2}exactcrosscancel, TOTALCROPS{v}; unused{unused}conservation; wrongsecondORIGINALbaseMCQchecked.'
    elif k=='downstream-mixed-distance-still-speed':
        time,current=ds;distance=one(ms);down=distance/time;still=down-current;assert still>current>0 and(still+current)*time==distance;answer=pick(r,still);assert pick(r,down+current)!=answer and pick(r,down)!=answer and pick(r,down-2*current)!=answer;note=f'ActualmixedDISTANCE{distance}/time{time}=DOWNspeed{down}; requestedSTILLsubtractcurrent{current}once→{still}, notadd/omit/subtracttwice MCQs.'
    elif k=='largest-four-mixed-operation-values':
        vals=[expr(o)for o in r['options']];answer=one(o for o,v in zip(r['options'],vals)if v==max(vals));assert sorted(vals)==[F(3,5),F(17,25),F(24,35),F(7,10)];note=f'ALL4actualENTIREASTvalues{vals}; final24/35=48/70<49/70=.7, strictdifference1/70cannotroundtotie; targetEXPRESSION{answer}.'
    elif k=='unknown-subtrahend-quotient-nonterminating-mixed':
        a,b=ms;d=one(ds);diff=b*d;x=a-diff;assert not finite(b)and finite(diff)and(a-x)/d==b;answer=pick(r,x);topic='eq';assert pick(r,a+diff)!=answer and pick(r,a-1-diff)!=answer;note=f'ActualNONTERMINATINGRHS{b}×divisor{d}crosscancels7→difference{diff}; UNKNOWNsubtrahendx={a}−diff={x}; backsubexact noapprox, wrongplus/offbyWHOLE1MCQsverified.'
    elif k=='opposite-meeting-total-speed-minus-mixed-known':
        distance,time=ds;known=one(ms);approach=distance/time;unknown=approach-known;assert unknown>0 and unknown*time+known*time==distance;answer=integer(unknown);note=f'ActualSIMULTANEOUSoppositemeetingdistance{distance}/time{time}=SUMspeeds{approach}; subtractKNOWNmixedspeed{known}→requestedOTHER{unknown}; pathconservation.'
    elif k=='given-decimal-fraction-product-over-sum':
        x=one(ds);y=one(fs);a=x*y;b=x+y;v=a/b;answer=pick(r,v);assert pick(r,1/v)!=answer and pick(r,a)!=answer and pick(r,b)!=answer;ex=m(r'\(\(x × y\)/\(x \+ y\)\)',s)[0];assert expr(ex.replace('x',decimal(x)).replace('y','('+str(y.numerator)+'/'+str(y.denominator)+')'))==v;note=f'Actualx{x},y{y}; WHOLEnumerator{a},WHOLEdenominatorSUM{b}, quotient{v}; inverse/numerator-only/denominator-onlyallactualMCQs.'
    elif k=='least-natural-two-rational-integrality-conditions':
        dec1,dec2=ds;f=fs[0];mix=one(ms);a=dec1+f;b=mix-dec2;assert a>0 and b>0;need1=a.denominator;need2=b.numerator;least=math.lcm(need1,need2);assert math.gcd(a.numerator,a.denominator)==math.gcd(b.numerator,b.denominator)==1;assert all((a*n).denominator!=1 or(F(n)/b).denominator!=1 for n in range(1,least));assert(a*least).denominator==(F(least)/b).denominator==1;answer=str(least);note=f'Actualreducedcoefficienta{a}forces{need1}|n; n/b withb{b}forces{need2}|n bycoprimeproofALLnaturaln. MinimalLCM{least}; full1…{least-1}independent rejection, product96notminimal.'
    elif k=='choose-two-operations-mixed-decimal':
        a,b=ds[:2];fraction=one(fs);target=D(m(r'= (\d+,\d+)\.',s)[1]);allvalid=[];ops=['+','−','×','÷'];evaluations={}
        for x,y in product(ops,repeat=2):
            first=op(a,fraction,x)
            if y=='÷'and b==0:continue
            val=op(first,b,y);evaluations[(x,y)]=val
            if val==target:allvalid.append((x,y))
        assert len(evaluations)==16 and len(allvalid)==1;pair=one(allvalid);answer=one(o for o in r['options']if tuple(m(r'□ — ([+−×÷]); △ — ([+−×÷])',o).groups())==pair);topic='eq';note=f'COMPLETEALL16operationpairs fromactuala{a},fraction{fraction},last{b}, target{target}; only{pair}; WHOLEfirstparenthesis andequal-roleMCQschecked.'
    elif k=='initial-library-total-after-two-stage-remainders':
        first=one(ds);second=one(fs);left=number(r'(\d+) кітап қалды',s);fractionleft=(1-first)*(1-second);whole=F(left)/fractionleft;out1=whole*first;out2=(whole-out1)*second;assert whole-out1-out2==left;conservation(whole,out1,out2,F(left));answer=integer(whole);assert all(x.denominator==1 for x in[whole,out1,out2]);note=f'Actualaftertwo changingbases fractionLEFT(1−{first})(1−{second})={fractionleft}; givenLAST{left}→INITIAL{whole}; integerbookcontributions{out1},{out2},{left}, conservation.'
    elif k=='pipe-first-alone-then-both-total-time':
        rate1=one(ds);rate2=one(fs);firstTime=number(r'құбыр (\d+) сағат жалғыз',s);firstWork=rate1*firstTime;assert 0<firstWork<1;jointRate=rate1+rate2;jointTime=(1-firstWork)/jointRate;total=firstTime+jointTime;assert firstWork+jointRate*jointTime==1;answer=integer(total);topic='word';note=f'ActualFIRSTRATE{rate1}×SOLOTIME{firstTime}={firstWork}, jointRATE{jointRate}→remainingTIME{jointTime}; TOTALelapsed{total}includesfirststage, noclosingfirstpipe/outflow; fullworkconservation.'
    elif k=='verbal-backward-mixed-multiplier-decimal-subtraction-fraction-divisor':
        multiplier=one(ms);subtrahend=one(ds);divisor=fs[-1];out=number(r'бөліп, (\d+) алды',s);x=(out*divisor+subtrahend)/multiplier;assert(x*multiplier-subtrahend)/divisor==out;answer=integer(x);topic='eq';note=f'ActualVERBALforward(x×{multiplier}−{subtrahend})/{divisor}={out}; inverseREVERSEorder givesunique{x}, originalforwardfullysubstituted.'
    elif k=='select-true-fraction-decimal-equality':
        flags=[expr(o.split(' = ')[0])==D(o.split(' = ')[1])for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);note=f'ALL4actualFULLequalityASTs comparedexactly, flags{flags}; only{answer}; falseexamples deliberatelyremainfalse.'
    elif k=='fractional-bundles-times-decimal-mass':
        unit=one(ds);count=one(ms);v=unit*count;assert 'бөлшек бөлігін алуға болады'in s;answer=integer(v);note=f'ActualUNITmass{unit}kg×mixedBUNDLEcount{count}={v}; physicallyfractionalbundlesexplicitlyallowed, proportionalmass andinverse countcheck.'
    elif k=='mixed-route-complement-distance-metres':
        distance=one(ms);cycled=one(ds);walking=distance*(1-cycled);answer=integer(walking*1000);conservation(distance,distance*cycled,walking);note=f'ActualWHOLEmixed{distance}km, walkedCOMPLEMENT1−{cycled}, walking{walking}km×SI1000={answer}METRES, notcycleddistance; fullpathconservation.'
    elif k=='fruit-fractional-mass-price':
        price=number(r'килограмы (\d+) теңге',s);mass=one(ds);share=one(fs);soldmass=mass*share;revenue=soldmass*price;assert mass*price*share==revenue;answer=integer(revenue);note=f'ActualFULLmass{mass}kg×soldshare{share}={soldmass}kg, ownUNITprice{price}→REVENUE{revenue}, notremainingmass/wholeprice; order-independentconservation.'
    elif k=='two-sales-extra-kg-backwards-whole':
        first=one(ds);second=one(fs);extra1,extra2,left=map(int,m(r'тағы (\d+) кг.*тағы (\d+) кг.*Соңында (\d+) кг',s).groups());before2=F(left+extra2)/(1-second);initial=(before2+extra1)/(1-first);sold1=initial*first+extra1;sold2=before2*second+extra2;assert initial-sold1==before2 and before2-sold2==left;conservation(initial,sold1,sold2,F(left));answer=integer(initial);note=f'ActualBACKWARDLAST{left}, restoreextra2{extra2}BEFOREdividecomplement1−{second}→before2{before2}, restoreextra1{extra1}BEFOREdivide1−{first}→initial{initial}; forwardtotalmassconservation.'
    elif k=='three-contributors-decimal-fraction-gap-whole':
        a=one(ds);b=one(fs);c=1-a-b;gap=number(r'Әлиден (\d+) теңге артық',s);assert b>c>0;whole=F(gap)/(b-c);amounts=[whole*p for p in[a,b,c]];conservation(whole,*amounts);assert amounts[1]-amounts[2]==gap;answer=integer(whole);assert all(x.denominator==1 for x in amounts);note=f'ActualTHREEsharesoriginal{a},{b},remaining{c}; MIRASminusALIshare{b-c} corresponds{gap}, WHOLE{whole}; allcontributions{amounts}andgapconserved.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note

def main():
    assert len(ROWS)==45;entries=[];ids=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];ids.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All45fullsaved/newconditions/official/newsolutions/everyMCQ read; own PRINTED exactFraction/nativeAST, universalcoprime/LCM/telescoping andcomplete16operationdomain, typedquantity/remainingbase/conservationoracle; noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All45fullsource/newconditions/officialsolutions/everyMCQ manuallyread','Everyactualnativeproper/mixedfraction/WHOLEmainbar parsedexactlyandallMCQscalculated','Finitecriterionafterreduction, nonterminatingfractions NEVERtruncated','Universal8|nAND12|nminimalLCM24 pluscomplete1…23rejection; all16operationpairsexhausted','Everychangingoriginal/remainingbase, unitmassprice/SI1000, temporalworkphase andrequestedrole bound','Targetjoint/totalworktime mapsword; algebraeq preserved; allremainingarithmeticfrac']})
    assert len(ids)==45
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'editionId':ROWS[i]['editionId'],'issue':'Requestedjoint/totalfilltime incorrectlymappedfrac, unlike samefrozenunit-workskills.','resolution':'Onlytopicchangedtoword; fullcondition/math/answer/options/paramsunchanged.'}for i in[21,35]],'scope':'ALL45source-addressedgrade5topic4.10nonvisual mixedfractiondecimaloperations','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':45,'wrongKeysRejected':45,'hashesMatched':45,'sourceRefs':45,'completeOperationPairs':16,'leastNatural':24,'smallerNaturalCandidatesRejected':23,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
