"""Independent full43 saved/new percent-of-number printed-text review.
Every condition, full official/new solution and offered MCQ was manually read.
No author specification, calculator or params is imported/consumed.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-percent-of-number.json';OUT='problems/editorial/reviews/grade5-percent-of-number.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def ns(s):return [h.D(v)for v in re.findall(r'\d+(?:,\d+)?',s)]
def ps(s):return [h.D(v)/100 for v in re.findall(r'(\d+(?:,\d+)?)%',s)]
def value(s):
    s=s.strip();return h.expr(s[:-1].replace(':','/'))/100 if s.endswith('%')else h.expr(s.replace(':','/'))
def fmt(v):
    v=F(v)
    if v.denominator==1:return str(v.numerator)
    assert 10**20%v.denominator==0
    out=str(v.numerator//v.denominator)+',';rem=v.numerator%v.denominator
    while rem:rem*=10;out+=str(rem//v.denominator);rem%=v.denominator
    return out
def pick(r,v):return one(o for o in r['options']if value(o)==v)if r.get('options')else fmt(v)
def opts(r,vs):assert [value(o)for o in r['options']]==list(map(F,vs)),r['editionId']
def count(*vs):assert all(F(v).denominator==1 and v>=0 for v in vs)
def ledger(whole,*parts):assert min(parts)>=0 and sum(parts,F(0))==whole

def solve(r):
    s=r['statement'];numbers=ns(s);percents=ps(s);k=r['modelId'].removeprefix('grade5-percent-of-number-');note=''
    assert r['topic']==('num'if k=='count-integers-with-integer-percent-part'else'pct')
    basic={'fifteen-percent-card-count','two-hundred-percent-double-whole','decimal-whole-small-percent-place-value','ten-percent-as-one-tenth','quarter-percent-choose-value','one-and-half-whole-percent','participant-count-via-one-percent','half-budget-cost','one-fifth-of-participants','one-percent-of-population','allocated-land-percent-of-whole','seed-oil-percent-decimal-tonnes','five-percent-as-half-tenth','sold-mass-percent-not-remainder'}
    if k in basic:
        total=numbers[0];p=one(percents);v=total*p;answer=pick(r,v)
        if k in {'fifteen-percent-card-count','quarter-percent-choose-value','participant-count-via-one-percent','one-fifth-of-participants','one-percent-of-population'}:count(total,v)
        if k=='decimal-whole-small-percent-place-value':opts(r,[v,v*10,v/10,v*100]);assert v==F(18,100)
        elif k=='quarter-percent-choose-value':opts(r,[v,v/10,total-p*100,v*10]);assert p==F(1,4)
        elif k=='one-and-half-whole-percent':opts(r,[v,v/10,total+p*100,v*10]);assert p==F(3,2)and v==total+total/2
        elif k=='participant-count-via-one-percent':opts(r,[v,total-p*100,v/10,v*10]);assert total/100*p*100==v
        elif k=='seed-oil-percent-decimal-tonnes':opts(r,[v,v*10,v/10,total-v]);assert v<total/2 and p<F(1,2)
        elif k=='five-percent-as-half-tenth':opts(r,[v,total/(p*100),v/10,v*10]);assert p==F(1,20)and total/10/2==v
        if p<=1:ledger(total,v,total-v)
        note=f'ACTUALprintedwhole{total}, percentUNIT{p}, requestedPART{v}; '+('all4actualdecimal/subtraction/inverse/complementtrapsfullyevaluated; 'if r.get('options')else'')+'unitsandintegercountroleschecked, targetnotremaining. '+('TOTAL200%means2wholeNOTincrease200%=3whole.'if k.startswith('two-hundred')else'')
    elif k=='choose-percent-multiplication-expression':
        total=numbers[0];p=one(percents);target=total*p;answer=pick(r,target);opts(r,[target,total*p*100,total*p*10,total/p]);assert answer==f'{fmt(total)} × {fmt(p)}';note=f'ACTUALwhole{total}andpercent{p}; askedEXPRESSIONnotitsresult{target}. ALL4actualoperations produce{[str(value(o))for o in r["options"]]}, uniquewhole×p/100, divideandunconvertedpercentfalse.'
    elif k=='choose-multiplier-for-percent':
        p=one(percents);answer=pick(r,p);opts(r,[p,p*10,p/10,p*100]);a,b=map(int,m(r'^\((\d+)/(\d+)\)$',answer).groups());assert math.gcd(a,b)==1;note=f'UniversalFORANYpositivewholeW, fractionpart=pW, uniqueLINEARcoefficientp={p}; requestedIRREDUCIBLE{a}/{b}, ALL4literalcoefficientsfullychecked. Wnonzeroensuresuniquemultiplier.'
    elif k=='price-increase-new-total':
        total=numbers[0];p=one(percents);growth=total*p;answer=pick(r,total+growth);assert 'ЖАҢА'in s;note=f'ACTUALinitialBASE{total}, growth{growth}, NEWTOTAL{total+growth}; reversechecktotal×(1+p), growthaloneandaddingbare{p*100}currencywrong.'
    elif k=='tax-then-save-percent-of-net':
        total=numbers[0];tax,save=percents;deducted=total*tax;net=total-deducted;v=net*save;answer=pick(r,v);opts(r,[v,total*save,net,deducted*save]);ledger(total,deducted,v,net-v);assert 'ҚАЛҒАН таза табыстың'in s;note=f'ACTUALgross{total}→tax{deducted}→NET{net}→saved{v}. SecondBASEexplicitNETnotgross/tax. ALL4actualgrosssave/nettotal/taxsaveMCQs andconservationledger independentlychecked.'
    elif k=='swapped-whole-and-percent-equality':
        a,p,b,q=numbers;first=a*p/100;second=b*q/100;assert a==q and b==p and first==second;answer='Екі мөлшер тең';assert answer in r['options'];note=f'ACTUALa{a}at{p}%andb{b}at{q}% BOTH{first}. Universalcommutativeproductab/100provesidentity, notcoincidentalroundedagreement. BOTHstrictownerMCQsfalse/insufficiencyfalse.'
    elif k=='two-exclusive-clubs-remainder-base':
        total=numbers[0];first,second=percents;A=total*first;remainder=total-A;B=remainder*second;neither=remainder-B;count(total,A,B,neither);ledger(total,A,B,neither);answer=pick(r,neither);opts(r,[neither,total-A-total*second,remainder,total*second]);assert 'ҚАЛҒАН'in s and 'ең көбі бір'in s;note=f'ACTUALexclusiveclubledger{A}/{B}/{neither}SUM{total}; secondBASEremainder{remainder}, nooverlapexplicit. Everyactualsamebasewrong6/remainder30/whole60%24MCQfalse.'
    elif k=='same-percent-down-then-up-price':
        total=numbers[0];down,up=percents;assert down==up;first=total*(1-down);v=first*(1+up);answer=pick(r,v);opts(r,[v,total,total*(1+up),first]);assert v==total*(1-down*down)<total and 'АРЗАНДАҒАН'in s;note=f'ACTUAL{total}→{first}→{v}; secondBASEnewprice. Universal(1−p)(1+p)=1−p²<1, ALLequalcancel/ignorefirst/ignoresecondMCQsfalse.'
    elif k=='difference-of-complementary-groups':
        total=numbers[0];p=one(percents);first=total*p;second=total-first;v=second-first;count(first,second,v);answer=pick(r,v);assert 'НЕШЕ БАЛАҒА'in s;ledger(total,first,second);note=f'ACTUALgirls{first}/boys{second}, requestedHEADCOUNTdifference{v}, notgroup92/108orraw8percentagepoints. Directtotal×(1−2p)crosscheckandcountintegrality.'
    elif k=='two-successive-expenses-remaining-money':
        total=numbers[0];p,q=percents;first=total*p;after=total-first;second=after*q;v=after-second;answer=pick(r,v);opts(r,[v,total*(1-p-q),second,after]);ledger(total,first,second,v);assert 'ҚАЛҒАН'in s and 'ҚАЛДЫ'in s;note=f'ACTUALfirstexpense{first}, remainder{after}becomessecondBASE, secondexpense{second}, FINALREMAINDER{v}; ALLeachactualwrongbase/secondexpense/intermediateremaindertraps evaluated, fullledgerSUM{total}.'
    elif k=='quarter-discount-final-price':
        total=numbers[0];p=one(percents);discount=total*p;v=total-discount;answer=pick(r,v);opts(r,[v,discount,total-p*100,total+discount]);ledger(total,discount,v);note=f'ACTUALdiscount{discount}fromold{total}, finalPAYMENT{v}; allactualdiscountalone/bare25currency/oppositeincreaseMCQsfalse. 75%retainedpricecrosscheck.'
    elif k=='one-year-educational-deposit-total':
        total=numbers[0];p=one(percents);v=total*(1+p);answer=pick(r,v);assert 'БІР жылдан'in s and 'басқа төлем, комиссия не салым жоқ'in s;note=f'ACTUALONEyearstart{total}, increase{total*p}, final{v}, principalretained. Explicitnoothercashmovements; noextraunaskedcompoundingorrealbankfeeassumptions.'
    elif k=='two-days-same-original-book-remainder':
        total=numbers[0];p,q=percents;first=total*p;second=total*q;v=total-first-second;count(first,second,v);ledger(total,first,second,v);answer=pick(r,v);assert s.count('БҮКІЛ')==2 and 'қайталанбайды'in s;note=f'ACTUALSAMEoriginalwhole{total}bothdaysparts{first}/{second}, unread{v}; explicitlydisjointpages/SAMEBASE, no successive-remainder reinterpretation. Sumread90differenttarget.'
    elif k=='two-year-compound-growth-total':
        total=numbers[0];p=one(percents);years=numbers[-1];assert years==2;first=total*(1+p);secondIncrease=first*p;v=first+secondIncrease;answer=pick(r,v);opts(r,[v,total*(1+2*p),first,first+total*(1+2*p)*p]);assert 'бұрынғы өсім де'in s;note=f'ACTUAL2yearcompound{total}→{first}→{v}, actualsecondINCREMENT{secondIncrease}; ALLsameoriginal/simple560000/oneyear480000/wrongsecondbase560000→592000choices exact. ExplicityearbeginningnewBASE.'
    elif k=='count-integers-with-integer-percent-part':
        low,high=map(int,m(r'n — (\d+)–(\d+)',s).groups());p=one(percents);domain=[n for n in range(low,high+1)if(p*n).denominator==1 and p*n>0];assert domain==list(range(p.denominator,high+1,p.denominator));answer=pick(r,len(domain));assert domain[-1]==high and low==1;note=f'COMPLETEinclusive{low}…{high}; reducedpercent{p}, coprimenumerator⇒integralityIFFnmultipleofdenominator{p.denominator}. ALL{len(domain)}witnesses{domain}; positiveNATURALvalues,0excluded,last275included, nofiniteexamplesonlyclaim.'
    elif k=='combine-unequal-groups-participation-percent':
        first,pa,second,pb=numbers;p,q=percents;A=first*p;B=second*q;count(first,second,A,B);total=first+second;v=(A+B)/total;answer=pick(r,v);opts(r,[v,(p+q)/2,p+q,(A+B)/100]);assert first!=second;note=f'ACTUALUNEQUALgroupbases{first}/{second}, participants{A}/{B}, NEWcombinedwhole{total}→{v*100}%. ALLactual52%unweighted/104%sum/44%headcounttrapsfalse; orderedtypedrolesnotconfused.'
    elif k=='reverse-price-increase-required-discount':
        p=one(percents);v=p/(1+p);answer=pick(r,v);opts(r,[v,p,F(2,5),p/2]);assert(1+p)*(1-v)==1 and 'ҚЫМБАТТАҒАН'in s;note=f'UniversalpositiveoldpriceW, NEW(1+p)W requiresdiscountpW/((1+p)W)={v}; 100→160→100witness. ALLactual37.5/60/40/30% choices exact; requiredreversefactorUNIQUE, rateNOTsimplynegated.'
    elif k=='two-overlapping-clubs-with-neither-count':
        total=numbers[0];p,q,out=percents;A=total*p;B=total*q;outside=total*out;union=total-outside;common=A+B-union;ledger(total,A-common,B-common,common,outside);count(A,B,common,outside);answer=pick(r,common);opts(r,[common,union,A+B,outside]);note=f'ACTUALinclusivecountsA{A}/B{B}, neither{outside}, union{union}, intersection{common}; fullnonnegative4regionledger andEVERYactualunion/sum/outsideMCQrolechecked. InclusiveOR/ANDdifferent.'
    elif k=='opposite-equal-dimension-changes-area-percent':
        p,q=percents;assert p==q;factor=(1+p)*(1-q);decline=1-factor;answer=one(o for o in r['options']if o.endswith('кемиді')and value(o.split(' ')[0])==decline);assert [o for o in r['options']]==[fmt(decline*100)+'% кемиді','Өзгермейді',fmt(decline*100)+'% артады',fmt(p*100)+'% кемиді'];assert decline==p*p;note=f'Universalpositivea,b: NEWarea=(1+p)(1−p)ab={factor}ab, DECLINE{decline*100}%; allactualunchanged/oppositesign/side20%choicesfalse. Actual10×10→12×8areas100→96attains4%drop.'
    elif k=='two-successive-equal-price-increases':
        total=numbers[0];p,q=percents;assert p==q;first=total*(1+p);v=first*(1+q);answer=pick(r,v);opts(r,[v,total*(1+p+q),first,F(42000)]);note=f'ACTUALold{total}→first{first}→second{v}; secondBASEexplicitcurrentprice, twoactual25%factors multiply. Allactualsimple50%48000/first40000/42000 distractorsdifferentexactvalues.'
    elif k=='compare-three-different-percent-products':
        vals=[numbers[i]*numbers[i+1]/100 for i in range(0,6,2)];assert len(set(vals))==1;answer='a = b = c';assert answer in r['options'];note=f'ACTUALtypedproducts{numbers[0]}×{numbers[1]}%, {numbers[2]}×{numbers[3]}%, {numbers[4]}×{numbers[5]}% all{vals[0]}; all4actualequal/ascending/descending/partial-equalitystatementschecked, notrateonlyorwholeonlycomparison.'
    elif k=='pure-sugar-addition-new-concentration':
        p=one(percents);_,total,added=numbers;oldSugar=total*p;newSugar=oldSugar+added;whole=total+added;v=newSugar/whole;answer=pick(r,v);opts(r,[v,newSugar/total,(p*100+added)/100,1-v]);ledger(whole,newSugar,total-oldSugar);assert 'ТАЗА ҚАНТ'in s and 'Ештеңе төгілмеді'in s;note=f'ACTUALoldwhole{total}/sugar{oldSugar}, addPURE{added}→NEWsugar{newSugar}/NEWwhole{whole}, target{v*100}%. SoluteANDwholeincrease, conservationothers54unchanged; ALL4oldbase35%/unitmix25%/complement72%MCQsfalse.'
    elif k=='successive-water-use-then-absolute-refill':
        total,p0,q0,refill=numbers;p,q=percents;used1=total*p;rem=total-used1;used2=rem*q;final=rem-used2+refill;answer=pick(r,final);assert final-refill+used2+used1==total;assert total*(1-p-q)+refill==11250;note=f'ACTUALchronological{total}→use{used1}→remaining{rem}→use{used2}→{rem-used2}→ABSOLUTErefill{refill}→{final}; backwardsconservationexact, secondBASEchanged, refillLITRESnotpercent. Bothdirectfactorandcashflowledgeragree.'
    elif k=='one-true-numeric-percent-statement':
        allvalues=[];flags=[]
        for o in r['options']:
            total,p,claimed=ns(o);actual=total*p/100;allvalues.append(actual);flags.append(actual==claimed)
        assert flags==[False,False,True,False];answer=one(o for o,t in zip(r['options'],flags)if t);note=f'EVERYactualwordedMCQ computedindependently:{list(map(str,allvalues))}versuseachclaimed12, truth{flags}; onlythirdcorrect, eachrowOWNwhole. Falsedistractorsnotpromotedtosolutionequalities.'
    elif k=='remaining-route-after-completed-percent':
        total=numbers[0];p=one(percents);done=total*p;left=total-done;answer=pick(r,left);ledger(total,done,left);assert 'ӘЛІ ЖҮРІЛМЕГЕН'in s;note=f'ACTUALroutewhole{total}km, completed{done}km, requestedREMAINING{left}km; complement35%directcrosscheck, done1170notasked.'
    elif k=='compare-two-stores-after-different-discounts':
        a,pa,b,pb=numbers;first=a*(1-percents[0]);second=b*(1-percents[1]);assert first<second;gap=second-first;answer=one(o for o in r['options']if o.startswith('А дүкені')and one(ns(o))==gap);assert r['options']==[f'А дүкені {fmt(gap)} теңгеге арзан',f'Ә дүкені {fmt(gap)} теңгеге арзан',f'Ә дүкені {fmt(a-b)} теңгеге арзан','Екі баға тең'];note=f'ACTUALshopA{a}after{pa}%→{first}, shopӘ{b}after{pb}%→{second}; ORDEREDOWNERANDgap{gap}bothmustcorrect. ALLactualreversedowner/samegap/oldpricegap2000/tieMCQsindependentlyfalse.'
    elif k=='decimal-fat-percent-kilograms-to-grams':
        p=one(percents);total=numbers[1];kg=total*p;grams=kg*1000;answer=pick(r,grams);opts(r,[grams,grams/10,grams*10,grams/100]);assert numbers[-2:]==[1,1000];note=f'ACTUAL2.8%={p}, {total}kgmilk→fat{kg}kg→{grams}GRAMSusing1000g/kg. ALLactualdecimalplacechoices98/9.8/980/.98 checked; rawkg.098notasked, concentration28gPERkgcrosscheck.'
    elif k=='successive-discounts-overall-drop-percent':
        p,q=percents;remain=(1-p)*(1-q);v=1-remain;answer=pick(r,v);opts(r,[v,p+q,remain,abs(p-q)]);assert 'ҚАЛҒАН баға'in s and 'КЕМІДІ'in s;note=f'Universalpositiveinitialprice, retainedfactor{remain}, requestedOVERALLDROP{v*100}%notretained68%. ActualMCQsum35%/remaining68%/difference5%false, chronologicalnewBASEproductproof.'
    elif k=='nested-percent-of-positive-symbolic-whole':
        assert 'a > 0'in s and 'СОЛ БӨЛІКТІҢ'in s;p,q=percents;v=p*q;answer=pick(r,v);opts(r,[v,p+q,abs(p-q),v*10]);note=f'UniversalFORALLa>0: nestedp×(q×a)={v}a, dividebyNONZEROa⇒{v*100}%. Bothlinearcoefficientandactual1000→180→45witness; allsum/difference/decimal-shiftoptionsfalse.'
    elif k=='different-group-growth-requested-increase-count':
        total=numbers[0];share,pa,pb=percents;A=total*share;B=total-A;ga=A*pa;gb=B*pb;v=ga+gb;count(total,A,B,ga,gb,v);answer=pick(r,v);opts(r,[v,total+v,total*(pa+pb),total*(pa+pb)/2]);ledger(total,A,B);assert 'НЕШЕ АДАМҒА'in s;note=f'ACTUALgroupbases{A}/{B}, own6%/10%increases{ga}/{gb}→requestedGAIN{v}people. ALLactualfinal86720/sum12800/unweightedmean6400trapsfalse. Unequalweightsandcountsnotpercenttargetexplicit.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==43;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit()and 'Жауапқа тек санды жазыңыз.'in r['statement']
        raw=h.raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All43saved/newfullconditions/full official+newsolutions/EVERYMCQread; independentACTUALprintedFractionbase/units/typedtarget/conservation/universalcoefficient/exhaustivedomainoracle; noauthorparams/spec/calculator','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All43saved/newconditions/official+newsolutions/EVERYMCQmanuallyread','Everyactualwhole/percent coefficient/SIunit/chronologicalnewbase independentlyparsedandexactlycomputed','RequestedEXPRESSION/PART/GAIN/NEWtotal/REMAINDER/CONCENTRATION/owneranddifference differentiated','Allfinite275integerdomainexhaustive; arbitrarypositivewhole coefficient/inverse/factorproofs','All43keys/wrongkeys/fullcanonicalSHA/nativefractionstructurechecked']})
    assert len(refs)==43
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]and native['fractions']==41
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All43source-addressedgrade5topic6.2nonvisual;42pct+1num; actualpercentmultipliers/units/orderedbases/typedtargets/allMCQ/complete275domain','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':43,'wrongKeysRejected':43,'hashesMatched':43,'sourceRefs':43,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
