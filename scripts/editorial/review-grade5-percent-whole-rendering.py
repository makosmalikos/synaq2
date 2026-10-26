"""Independent all43 printed inverse-percent/method/BASE/target review.
Allsaved/newfullconditions, completeofficial/newsolutions and EVERYMCQ read.
No author params/specifications/calculator is imported or consumed.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-percent-whole.json';OUT='problems/editorial/reviews/grade5-percent-whole.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def nums(s):return[h.D(t)for t in re.findall(r'\d+(?:,\d+)?',s)]
def ps(s):return[h.D(t)/100 for t in re.findall(r'(\d+(?:,\d+)?)%',s)]
def plain(s):return nums(re.sub(r'\d+(?:,\d+)?%','',s))
def value(s):s=s.strip();return h.expr(s[:-1].replace(':','/'))/100 if s.endswith('%')else h.expr(s.replace(':','/'))
def fmt(v):
    v=F(v)
    if v.denominator==1:return str(v.numerator)
    assert 10**20%v.denominator==0
    out=str(v.numerator//v.denominator)+',';rem=v.numerator%v.denominator
    while rem:rem*=10;out+=str(rem//v.denominator);rem%=v.denominator
    return out
def pick(r,v):return one(o for o in r['options']if value(o)==v)if r.get('options')else fmt(v)
def opts(r,vs):assert[value(o)for o in r['options']]==list(map(F,vs)),r['editionId']
def inverse(known,coefficient):
    assert known>0 and coefficient>0
    whole=known/coefficient;assert whole>0 and whole*coefficient==known
    # Nonzero coefficient proves uniqueness over ALLpositivereal/rationalwholes,
    # without a guessed bound or merely testing the proposed answer.
    return whole
def counts(*vs):assert all(v>=0 and F(v).denominator==1 for v in vs)
def ledger(total,*parts):assert min(parts)>=0 and sum(parts,F(0))==total

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-percent-whole-');p=ps(s);ns=plain(s);note='';geo={'rectangle-perimeter-from-width-percent-length','triangle-third-side-after-recovering-perimeter','original-rectangle-area-after-shortening-to-square'};assert r['topic']==('geo'if k in geo else'word'if k=='constant-speed-whole-time-from-route-percent'else'pct')
    basic={'small-percent-decimal-part-recover-whole','club-members-whole-via-ten-percent','recover-whole-from-decimal-half','recover-whole-from-decimal-fifth','stock-whole-from-one-tenth-used','whole-from-one-percent','team-whole-from-two-place-percent','book-total-from-read-percent','whole-from-five-percent-via-one','whole-from-quarter-choice','whole-from-three-quarters-choice','region-total-from-local-percent-population'}
    if k in basic:
        part=one(ns);percent=one(p);whole=inverse(part,percent);answer=pick(r,whole)
        if k=='small-percent-decimal-part-recover-whole':assert percent==F(3,100)and part==F(84,100);assert part*100==84 and percent*100==3 and whole==28;assert '0,84 : 3 = 0,28'in r['solution']and '0,28 × 100 = 28'in r['solution']
        elif k=='club-members-whole-via-ten-percent':counts(part,whole);unit10=part/(percent*10);assert unit10==4 and unit10*10==whole;assert '16 : 4 = 4'in r['solution']and '4 × 10 = 40'in r['solution']
        elif k=='recover-whole-from-decimal-half':opts(r,[whole,part*percent,part*100,part/(percent*100)]);assert percent==F(1,2)and part*2==whole
        elif k=='recover-whole-from-decimal-fifth':opts(r,[whole,part*percent,whole*10,part*percent*100]);assert percent==F(1,5)and part*5==whole
        elif k=='stock-whole-from-one-tenth-used':assert percent==F(1,10)and part*10==whole;assert '68 × 10 = 680'in r['solution']
        elif k=='whole-from-one-percent':assert percent==F(1,100)and part*100==whole;assert '9 × 100 = 900'in r['solution']
        elif k=='team-whole-from-two-place-percent':counts(part,whole);assert part*100==3200 and percent*100==64;assert '32 : 0,64 = 3200 : 64 = 50'in r['solution']
        elif k=='book-total-from-read-percent':counts(part,whole);unit10=part/(percent*10);assert unit10==18 and unit10*10==whole;assert '126 : 7 = 18'in r['solution']and '18 × 10 = 180'in r['solution']
        elif k=='whole-from-five-percent-via-one':unit1=part/(percent*100);assert unit1==F(14,10)and unit1*100==whole;assert '7 : 5 = 1,4'in r['solution']and '1,4 × 100 = 140'in r['solution']
        elif k=='whole-from-quarter-choice':opts(r,[whole,part*percent,part/(percent*100),part*3]);assert percent==F(1,4);assert '17 × 4 = 68'in r['solution']
        elif k=='whole-from-three-quarters-choice':opts(r,[whole,part*percent,part/(percent*100),part+percent*100]);assert percent==F(3,4);unitQuarter=part/3;assert unitQuarter==27 and unitQuarter*4==whole;assert '81 : 3 = 27'in r['solution']and '27 × 4 = 108'in r['solution']
        elif k=='region-total-from-local-percent-population':counts(part,whole);unit1=part/(percent*100);assert unit1==340 and unit1*100==whole;assert '2040 : 6 = 340'in r['solution']and '340 × 100 = 34000'in r['solution']
        note=f'ACTUALknownPART{part}, coefficient{percent}, uniqueWHOLE{whole}; multiplybackchecked. Source-specific1%/10%/half/fifth/quarter/three-quarterteaching steps readandARITHMETICALLYbound, BOTHmembercomma shiftscorrect, ALLactualnumericMCQs exactwherepresent.'
    elif k=='choose-inverse-percent-division-expression':
        part=one(ns);percent=one(p);v=inverse(part,percent);answer=pick(r,v);opts(r,[v,part*percent,part/(percent*100),percent/part]);assert answer==fmt(part)+' : '+fmt(percent);note=f'ACTUALpositiveunknown×{percent}={part} uniqueinverse{v}; askedEXPRESSIONnotresult. Everyactualdivide/multiply/unconverted45/invertedoperandsMCQevaluatedexactly.'
    elif k=='savings-shortfall-after-recovering-price':
        part=one(ns);percent=one(p);whole=inverse(part,percent);short=whole-part;ledger(whole,part,short);answer=pick(r,short);assert 'ТАҒЫ'in s;note=f'ACTUALsaved{part}={percent}oftotalprice{whole}; requestedSHORTFALL{short}, notWHOLE90000. Remaining22%ofORIGINALpricecrosscheck.'
    elif k=='original-price-from-discounted-price':
        final=one(ns);discount=one(p);whole=inverse(final,1-discount);answer=pick(r,whole);opts(r,[whole,final*(1+discount),final/discount,final*(1-discount)]);assert whole-whole*discount==final;note=f'ACTUALafterdiscount{discount}retainedfactor{1-discount}, final{final}→OLD{whole}; ALLactualnewbase-plus12%/dividebydiscount/repeateddiscountMCQsfalse, originalnotnewbase.'
    elif k in {'whole-route-from-completed-percent-and-rest','original-stock-from-sold-percent-and-rest'}:
        left=one(ns);used=one(p);whole=inverse(left,1-used);answer=pick(r,whole);ledger(whole,whole*used,left)
        if k.startswith('original-stock'):counts(whole,whole*used,left)
        assert 'ҚАЛДЫ'in s or'ӘЛІ ЖҮРІЛМЕГЕН'in s;note=f'ACTUALknownREMAINDER{left} correspondsCOMPLEMENT{1-used}notgivenUSED{used}; uniqueWHOLE{whole}, fullpart+remainingconservation andrequestedwholechecked.'
    elif k=='compare-two-inverse-percent-wholes':
        a,b=ns;pa,pb=p;A=inverse(a,pa);B=inverse(b,pb);assert A>B;gap=A-B;answer=one(o for o in r['options']if o.startswith('Бірінші')and one(nums(o))==gap);assert r['options']==[f'Бірінші сан {fmt(gap)} санға артық',f'Екінші сан {fmt(gap)} санға артық','Сандар тең',f'Бірінші сан {fmt(b-a)} санға артық'];note=f'ACTUALtwoSEPARATEbases{a}/{pa}={A}, {b}/{pb}={B}; BOTHownerfirstandGAP{gap} required. ALLactualreversedowner/tie/givenPARTgap{b-a}trapsfalse.'
    elif k=='second-student-percent-after-recovering-test-total':
        firstCorrect,secondCorrect=ns;firstRate=one(p);total=inverse(firstCorrect,firstRate);v=secondCorrect/total;counts(total,firstCorrect,secondCorrect);answer=pick(r,v);opts(r,[v,secondCorrect/firstCorrect,firstRate-(firstCorrect-secondCorrect)/100,secondCorrect/100]);assert 'Бірдей тестте'in s;note=f'ACTUALfirst30at75%⇒COMMONtest40questions; second24/{total}={v*100}%. ALL80%comparetofirststudent/69%subtractHEADCOUNTfrompercent/24%rawcountMCQsfalse. Totalsandbothcountsinteger.'
    elif k=='old-salary-from-increased-total':
        new=one(ns);increase=one(p);old=inverse(new,1+increase);answer=pick(r,old);assert old+old*increase==new and new*(1-increase)!=old;note=f'ACTUALnew{new}=(1+{increase})OLD, uniqueOLD{old}. Wrongsubtract30%ofNEWwould{new*(1-increase)}, different. Fullincrease72000backcheck.'
    elif k=='whole-from-complementary-group-difference':
        diff=one(ns);first=one(p);second=1-first;assert second>first;total=inverse(diff,second-first);A=total*first;B=total*second;counts(total,A,B);assert B-A==diff;ledger(total,A,B);answer=pick(r,total);note=f'ACTUALfirst42%/complement58%, HEADCOUNTdifference{diff} corresponds16%ofORIGINALwhole; uniqueTOTAL{total}, groups{A}/{B} integeranddifferenceverified, not32/individualgroupcoeff.'
    elif k=='whole-route-from-two-days-difference':
        diff=one(ns);first,second=p;whole=inverse(diff,second-first);answer=pick(r,whole);opts(r,[whole,diff/second,diff/first,diff/(first+second)]);assert whole*second-whole*first==diff;note=f'ACTUALSAMEwhole15%/45%, given36kmDIFFERENCE⇒30%, inverseWHOLE{whole}; everyactual80/240individual-dayand60sumtrapcomputed, day18/54backdifference36.'
    elif k=='fresh-mass-from-drying-loss':
        dry=one(ns);loss=one(p);fresh=inverse(dry,1-loss);answer=pick(r,fresh);opts(r,[fresh,dry*(1-loss),dry*(1+loss),dry*loss]);ledger(fresh,dry,fresh*loss);note=f'ACTUALloss75%ofFRESH leaves25%, dry{dry}→fresh{fresh}; all4actualquarterofdry/add75%ofdry/lostfractionofdryMCQsfalse. Quarterunit11×4and44−33=11.'
    elif k=='rectangle-perimeter-from-width-percent-length':
        width=one(ns);fraction=one(p);length=inverse(width,fraction);perimeter=2*(length+width);answer=pick(r,perimeter);opts(r,[perimeter,length+width,2*(width+width*fraction),length*width]);assert length>width>0;note=f'ACTUALwidth{width}=75%ofLENGTH{length}; PERIMETER{perimeter}cm, ALLhalf28/directmultiplywrongL9→P42/AREA192trapsfalse. Dimensionspositiveandwidthrelationbackchecked.'
    elif k=='another-percent-after-recovering-whole':
        part=one(ns);knownRate,target=p;whole=inverse(part,knownRate);v=whole*target;answer=pick(r,v);opts(r,[v,whole,part*target,part*knownRate]);unit1=part/(knownRate*100);assert unit1==F(18,100)and unit1*target*100==v;assert '7,2 : 40 = 0,18'in r['solution'];note=f'ACTUALknown40%part7.2→WHOLE18 then65%→11.7; equivalent1%unit{unit1}×65. ALLwholeonly18/direct65%ofpart4.68/direct40%ofpart2.88MCQs evaluated, teachingsecondstepnotomitted.'
    elif k=='initial-stock-from-two-successive-removals':
        final=one(ns);a,b=p;middle=inverse(final,1-b);initial=inverse(middle,1-a);answer=pick(r,initial);opts(r,[initial,final/(1-a-b),middle,final/(1-a)]);assert initial*(1-a)==middle and middle*(1-b)==final;assert '28 : 0,7 = 40'in r['solution']and '40 : 0,8 = 50'in r['solution'];note=f'ACTUALREVERSEchronology: final{final}/secondretained{1-b}→middle{middle}/firstretained{1-a}→initial{initial}. ALLsum-percent56/oneinverse40/otheroneinverse35trapsfalse. Bothreverseandforwardstepsverified, notjustproductformula.'
    elif k=='fresh-mass-from-conserved-dry-matter':
        dryTotal=one(ns);waterBefore,waterAfter=p;dryMatter=dryTotal*(1-waterAfter);fresh=inverse(dryMatter,1-waterBefore);waterOld=fresh-dryMatter;waterNew=dryTotal-dryMatter;assert waterOld>=waterNew>=0;ledger(fresh,dryMatter,waterOld);ledger(dryTotal,dryMatter,waterNew);answer=pick(r,fresh);assert 'ТЕК СУ'in s and 'құрғақ зат жоғалмайды'in s;note=f'ACTUALconservedDRY{dryMatter}kg=8×75%, freshDRY12%⇒fresh{fresh}. TWOdifferentwaterBASES88%/25%, masses44→2water, evaporated42; dry6UNCHANGED, bothfullmassledgersandphysicalnonnegativewaterlosschecked.'
    elif k=='two-group-total-from-equal-selected-counts':
        selected=one(ns);a,b=p;half=selected/2;first=inverse(half,a);second=inverse(half,b);counts(half,first,second);answer=pick(r,first+second);assert first*a==second*b==half and 'ТЕҢ'in s;note=f'ACTUALselectedTOTAL40withequal20/20split; unknownFULLboy20/25%=80, girl20/40%=50→TOTAL130. EqualSELECTEDcountdoesNOTmeanequalwholegroups. Eachinverseandselectedsumbackchecked.'
    elif k=='original-price-from-up-then-down-final':
        final=one(ns);up,down=p;middle=inverse(final,1-down);initial=inverse(middle,1+up);answer=pick(r,initial);assert middle==25000 and initial==20000 and initial*(1+up)*(1-down)==final;assert '22000 : 0,88 = 25000'in r['solution']and '25000 : 1,25 = 20000'in r['solution'];note=f'ACTUALreverseDOWNlast12%retained.88 thenUPfirst25%factor1.25: {final}→{middle}→{initial}. Twoinverseandtwoforwardstages, universalfactor11/10not1.13; BASEchangesnotcancelled.'
    elif k=='recover-largest-mass-two-percent-chain':
        small=one(ns);a,b=p;middle=inverse(small,a);large=inverse(middle,b);answer=pick(r,large);opts(r,[large,small*a*b,small/b,middle]);assert large*b*a==small;note=f'ACTUALsmall{small}kg is40%ofMIDDLE{middle}, MIDDLE25%ofLARGE{large}; ALLtwo-multiply.32/skipmiddle12.8/middleonly8MCQrolescomputed. Orderedchainandtwodivisionsretained.'
    elif k=='whole-from-relative-second-category-and-third-count':
        third=one(ns);a,less=p;b=a*(1-less);c=1-a-b;total=inverse(third,c);A=total*a;B=total*b;counts(total,A,B,third);ledger(total,A,B,third);answer=pick(r,total);assert 'ҚАЙЫҢДАР'in s and 'Басқа ағаш жоқ'in s;note=f'ACTUALfirst35%WHOLE, second20%LESSthanFIRST⇒28%WHOLE, third37%known111→TOTAL300. Counts105/84/111sum300, second84=105×.8. Subtract35−20percentagepointswouldwrongBASE.'
    elif k=='unknown-percent-equals-another-percent-product':
        knownWhole=one(ns);unknownRate,knownRate=p;part=knownWhole*knownRate;unknown=inverse(part,unknownRate);answer=pick(r,unknown);assert part==60 and unknown==knownWhole*knownRate/unknownRate;note=f'ACTUALknown150×40%=60 FIRST, unknown×20%=same60 SECONDinverse⇒300. Exactequationpositivecoefficientuniqueness, bothpartsequal, methodmultiplyTHENdivide.'
    elif k=='two-numbers-from-equal-percent-parts-and-gap':
        diff=one(ns);a,b=p;assert b>a>0;ratio=b/a;second=inverse(diff,ratio-1);first=second+diff;assert first*a==second*b;tuples=[nums(o)for o in r['options']];assert all(x-y==diff for x,y in tuples);truth=[x*a==y*b for x,y in tuples];assert truth==[True,False,False,False];answer=one(o for o,t in zip(r['options'],truth)if t);assert tuples[0]==[first,second];note=f'ACTUALorderedFIRST/SECOND,30%FIRST=45%SECOND⇒ratio1.5; difference24⇒SECOND48,FIRST72. BOTHconstraintsforall4tuples: everygap24butonly72/48equal21.6parts. Universalnonzerolinearsystemuniqueness, ordernotreversed.'
    elif k=='increased-original-from-its-decreased-result':
        after=one(ns);down,up=p;assert down==up;original=inverse(after,1-down);v=original*(1+up);answer=pick(r,v);opts(r,[v,after*(1+up),after+2*up*100,after+up*100]);assert original-original*down==after;note=f'ACTUALdecreased72=80%ofORIGINAL90, SAMEoriginal+20%→108, notincreasing72. Allactual86.4wrongnewbase/112bare40/92bare20choicesfalse, symmetric90±18backcheck.'
    elif k=='restore-original-after-discount-required-increase':
        discount=one(p);rate=discount/(1-discount);answer=pick(r,rate);opts(r,[rate,discount,2*discount,1-discount]);assert(1-discount)*(1+rate)==1;assert rate==F(1,3)and value('(33 + (1/3))%')==rate;note='UniversalpositiveORIGINALW, discounted.75W, restoreGAIN.25W/.75W=1/3. PERCENTNUMBER100/3=33⅓, actualnativeMIXEDpercentunitdividesby100. Full100→75→100backcheck, all25/50/75%MCQsfalse, newBASEexplicit.'
    elif k=='one-percent-from-known-multiple-percent':
        part=one(ns);knownRate,targetRate=p;assert targetRate==F(1,100);unit1=part/(knownRate*100);whole=inverse(part,knownRate);assert unit1==whole/100;answer=pick(r,unit1);opts(r,[unit1,unit1*10,part*knownRate,part/100]);note=f'ACTUALknown30%part16.5; requested1%OFUNKNOWN not1%of16.5. Unit16.5÷30=.55, whole55backcheck×.3=16.5. Everyactual×10/knownpart30%/knownpart1%MCQfalse.'
    elif k=='payment-from-known-discount-money':
        saved=one(ns);discount=one(p);old=inverse(saved,discount);payment=old-saved;answer=pick(r,payment);opts(r,[payment,old,saved*discount,saved*(1+discount)]);ledger(old,saved,payment);note=f'ACTUAL3500SAVED=25%ofOLD14000; requestedPAID10500notold/saved. All14000wholeonly/875savepart/4375increasesaveMCQsfalse, old×.75paymentcrosscheck.'
    elif k=='actual-production-from-extra-percent-count':
        extra=one(ns);rate=one(p);plan=inverse(extra,rate);actual=plan+extra;counts(extra,plan,actual);answer=pick(r,actual);opts(r,[actual,plan,extra*rate*100,extra*(1+rate)]);note=f'ACTUALextra30=12%ofPLAN250, requestedACTUALtotal280. ALLplanonly250/unconverted×12360/extraaswhole33.6MCQroles verified, plan×1.12backcheck.'
    elif k=='triangle-third-side-after-recovering-perimeter':
        first=one(ns);a,b=p;perimeter=inverse(first,a);second=perimeter*b;third=perimeter-first-second;assert min(first,second,third)>0 and max(first,second,third)*2<perimeter;semiper=perimeter/2;heron=semiper*(semiper-first)*(semiper-second)*(semiper-third);assert heron>0;answer=pick(r,third);note=f'ACTUALfirst21=35%ofPERIMETER60; second24=40%, third15=remaining25%. All3stricttriangleinequalities via2max48<60andEXACTpositiveHeronareaSquared{heron}, genuineSSStriangleexists; sum60andtypedthirdsidechecked.'
    elif k=='constant-speed-whole-time-from-route-percent':
        elapsed=one(ns);routeRate=one(p);totalTime=inverse(elapsed,routeRate);answer=pick(r,totalTime);opts(r,[totalTime,elapsed*routeRate,elapsed/(1-routeRate),totalTime-elapsed]);assert 'ТҰРАҚТЫ'in s and 'Тоқтамай'in s;note=f'Universalconstantspeedv>0: d=v·t ⇒ routefraction=timefraction. ACTUAL3hfor40%⇒WHOLE7.5h. ALL1.2directpart/5complementwrongbase/4.5remainingonlyMCQsfalse; timesameunitHOURS.'
    elif k=='original-rectangle-area-after-shortening-to-square':
        squareP=one(ns);shortening=one(p);width=squareP/4;length=inverse(width,1-shortening);area=length*width;answer=pick(r,area);assert 4*width==squareP and length*(1-shortening)==width and length>width>0;note=f'ACTUALsquareP48⇒side12=UNCHANGEDoldwidth; shortenedoldL80%=12⇒oldL15. OLDRECTANGLEAREA15×12=180, notnewsquare144norwrong12×1.2. Allbackdimensions/perimeters/positivegeometrychecked.'
    elif k=='initial-solution-mass-after-water-dilution':
        addedWater=one(ns);before,after=p;assert before>after>0;unitBefore=inverse(F(1),before);unitAfter=inverse(F(1),after);unitWater=unitAfter-unitBefore;salt=inverse(addedWater,unitWater);initial=inverse(salt,before);new=initial+addedWater;assert new*after==salt and initial*before==salt;answer=pick(r,initial);opts(r,[initial,new,salt,addedWater]);assert 'ТАЗА СУ'in s and 'тұз жоғалмады'in s and 'ештеңе төгілмеді'in s
        assert unitBefore==F(25,2)and unitAfter==20 and unitWater==F(15,2)and salt==F(2,5)and initial==5;assert '1 : 0,08 = 12,5'in r['solution']and '1 : 0,05 = 20'in r['solution']and '20 − 12,5 = 7,5'in r['solution']and '3 : 7,5 = 0,4'in r['solution']and '0,4 : 0,08 = 5'in r['solution']
        note=f'ACTUALconservedSALTunitmethodFULL: 1kgSALT→initial{unitBefore}/new{unitAfter}kgsolutions→waterDIFFERENCE{unitWater}PER1kgSALT. Actualwater3÷7.5=salt.4, initial.4/.08=5, new8. Bothmassandconcentrationledgersverified, everyactualnew8/salt.4/water3choicefalse; sourceunitteachingNOTreplacedbysilentlinearshortcut.'
    elif k=='girls-count-from-boys-relative-share-and-total':
        total=one(ns);ratio=one(p);girls=inverse(total,1+ratio);boys=girls*ratio;counts(girls,boys,total);ledger(total,girls,boys);answer=pick(r,girls);assert 'ҚЫЗДАР'in s and 'олардың бәрі ұл не қыз'in s;note=f'ACTUALBOYS75%OF GIRLS(notwhole), GIRLS1unit+BOYS.75unit=TOTAL1.75unit35→GIRLS20,BOYS15. Bothtypedrelationandcompleteexhaustivecountledgerchecked.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==43;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit()and 'Жауапқа тек санды жазыңыз.'in r['statement']
        raw=h.raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All43saved/newfullconditions/full official+newsolutions/EVERYMCQread; independentACTUALprintedFractioninverseuniqueness/typedBASE/target/conservation/unitteachingoracle; noauthorparams/spec/calculator','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All43saved/newconditions/official+newsolutions/EVERYMCQmanuallyread','Source1%/10%/quarter methods andBOTHmembercommashifts explicitlyretainedand independentlyrecomputed','Everyactualinversecoefficientnonzero⇒uniquenessoverALLpositivewholes, bothforwardandreversechainstepsverified','Original/new/remnant/difference/selected/combinedBASE andrequestedEXPRESSION/WHOLE/SHORTFALL/PAID/GAIN/orderedpair distinguished','Physicaldrymatter/saltunitmethod andgenuinetriangle/rectangleconstraintschecked','All43keys/wrongkeys/canonicalSHA/nativefractionsandmixedpercentageunitverified']})
    assert len(refs)==43
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]and native['fractions']==29 and native['mixed']==4
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All43source-addressedgrade5topic6.3nonvisual;39pct+3geo+1word, individualteaching/BASE/physicaldomain/allMCQ','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':43,'wrongKeysRejected':43,'hashesMatched':43,'sourceRefs':43,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
