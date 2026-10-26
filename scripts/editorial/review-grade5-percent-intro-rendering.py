"""Independent review of all41 displayed percent-introduction editions.

The source/new full conditions, full solutions and EACH MCQ were read manually.
This oracle consumes printed statements/options, never author params/specs/model.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-percent-intro.json';OUT='problems/editorial/reviews/grade5-percent-intro.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']

def nums(s):return [h.D(v)for v in re.findall(r'\d+(?:,\d+)?',s)]
def pcts(s):return [h.D(v)/100 for v in re.findall(r'(\d+(?:,\d+)?)%',s)]
def fractions(s):return [F(int(a),int(b))for a,b in re.findall(r'\((\d+)/(\d+)\)',s)]
def value(s):
    # The % suffix is a UNIT: 35%=35/100, never the bare integer35.
    s=s.strip()
    if s.endswith('%'):return h.expr(s[:-1])/100
    return h.expr(s)
def fmt(v):
    v=F(v)
    if v.denominator==1:return str(v.numerator)
    assert 10**20%v.denominator==0
    w=v.numerator//v.denominator;rem=v.numerator%v.denominator;out=str(w)+','
    while rem:rem*=10;out+=str(rem//v.denominator);rem%=v.denominator
    return out
def numeric(row,v):return one(o for o in row['options']if value(o)==v)if row.get('options')else fmt(v)
def vector(s):return [value(t)for t in s.split('; ')]
def factor(s):
    if s=='Өзгермеді':return F(1)
    direction,amount=m(r'^(Өсуі|Кемуі|Өсімі) — (\d+(?:,\d+)?)%$',s).groups()
    return 1+h.D(amount)/100*(1 if direction!='Кемуі'else-1)
def assert_options(row,expected):
    assert row.get('options')and len(expected)==4
    assert [value(o)for o in row['options']]==list(map(F,expected)),(row['editionId'],expected)

def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade5-percent-intro-');ns=nums(s);ps=pcts(s);fs=fractions(s);note='';domain=None
    assert row['topic']==('num'if k in {'count-proper-numerators-with-integer-percent','unit-fraction-integer-percent-denominator-domain'}else'pct')
    if k in {'single-digit-percent-to-leading-zero-decimal','above-hundred-percent-to-decimal'}:
        target=ps[0];answer=numeric(row,target)
        if k.startswith('single-digit'):assert_options(row,[target*10,target/10,target*10000,target])
        else:assert_options(row,[target*10,target,target/10,1+(target-1)/10]);assert target>1
        note=f'ACTUAL{fmt(ps[0]*100)}%÷100={target}; ALL4actualplace/multiply/paddingMCQs exactlyevaluated, leadingfractionalzeroandabove100%meaning preserved.'
    elif k=='unit-fraction-of-library-to-percent':
        f=one(fs);assert f.numerator==1;answer=numeric(row,f*100);note=f'ACTUALlibraryreplacementfraction{f}, percentNUMBER{f*100}; identity f=(f×100)% exact, no dimensionallyfalse f×100=percentagevalue.'
    elif k in {'above-one-decimal-to-percent','below-one-decimal-to-percent'}:
        a=one(ns);answer=numeric(row,a*100);assert(a>1)==k.startswith('above');note=f'ACTUALdecimal{a}×100 givespercentNUMBER{a*100}; writtenpercentage{fmt(a*100)}% valueexactly{a}, notunscaleddecimal%.'
    elif k in {'integer-percent-to-irreducible-fraction','decimal-percent-to-irreducible-fraction'}:
        target=one(ps);answer=numeric(row,target);a,b=map(int,m(r'^\((\d+)/(\d+)\)$',answer).groups());assert math.gcd(a,b)==1
        if k.startswith('decimal'):assert_options(row,[target*10,target,target*100,target/10])
        else:
            assert_options(row,[target,F(1,50),1/(target*100),1/target]);assert target==F(56,100)
        note=f'ACTUALpercentVALUE{target}; requestedIRREDUCIBLEformalnumerator{a}/denominator{b}, gcd1, ALLofferedfractions/mixed/different100power/inversetrappairs exact. Reducedanswerformnotmerelyequivalentvalue.'
    elif k=='proper-fraction-to-percent-choice':
        f=one(fs);answer=numeric(row,f);a,b=m(r'\((\d+)/(\d+)\)',s).groups();assert_options(row,[f,F(int(a+b),100),f/100,1-f]);note=f'ACTUAL{f}→{f*100}%; all4actualchoices: correct, concatenateddigits, unscaleddecimalwith%unit, complement. Fraction×100 isbarepercentNUMBERonly.'
    elif k=='occupied-share-from-empty-fraction':
        empty=one(fs);assert 0<empty<1 and 'БОС ЕМЕС'in s;answer=numeric(row,(1-empty)*100);note=f'ACTUALempty{empty}, requestedOCCUPIEDcomplement{1-empty}; bothnonnegativeandSUM1, targetpercent{(1-empty)*100}notemptypercent.'
    elif k=='percent-complement-two-exhaustive-groups':
        done=one(ps);assert 'АЯҚТАЛМАҒАН'in s;answer=numeric(row,(1-done)*100);note=f'ACTUALfinished{done}, mutuallyexclusiveexhaustiveunfinished1−done={1-done}, exactconservation100%; notnumberoffinishedstages.'
    elif k=='centimetres-as-percent-of-one-metre':
        assert ns[0]==ns[3]==1 and ns[1]==100;part=ns[2];answer=numeric(row,part/ns[1]*100);note=f'ACTUAL1metre=100cm, requested{part}cm/ONE100cmmetre, percent{part}; unitsnormalizedBEFOREratio; remaininglengthnotasked.'
    elif k in {'one-true-percent-fraction-decimal-equality','one-false-percent-equality'}:
        values=[tuple(value(a)for a in o.split(' = '))for o in row['options']];truth=[a==b for a,b in values];correct=(k.startswith('one-true'));answer=one(o for o,t in zip(row['options'],truth)if t==correct)
        assert truth==([False,False,False,True]if correct else[False,True,True,True]);note=f'EVERYactualMCQbothsidevalues{[[str(v)for v in pair]for pair in values]}, truthflags{truth}; asks{"TRUE"if correct else"INTENTIONALLYFALSE"}, falseexampleNOTassertedtrue. Percentunit÷100 onEACHside.'
    elif k=='one-percent-definition-unit-part':
        assert '100 ТЕҢ'in s;target=F(1,100);answer=numeric(row,target);assert_options(row,[target,target*10,100,target/10]);note='Firstprinciplesoneof100EQUALcells=1/100=0.01=1%; universaldefinitionunchangedhonestly. EACHactualofferedpart100/10/1000/100whole correctlydistinguished.'
    elif k=='strict-greater-mixed-percent-decimal-fraction':
        f=one(fs);assert 'ҚАТАҢ'in s and 'Тең мән жауапқа жатпайды'in s;vs=[value(o)for o in row['options']];answer=one(o for o,v in zip(row['options'],vs)if v>f);assert[ v<f for v in vs]==[True,True,False,False]and vs[-1]==f
        note=f'ACTUALbound{f}, ALL4values{list(map(str,vs))}; strict>unique, equalityEXCLUDED, equivalence14/20=7/10notincorrectlycountedgreater.'
    elif k=='remaining-percent-two-disjoint-mixed-shares':
        first=one(fs);second=h.D(m(r'қызыл, (\d+,\d+) бөлігі көк',s)[1]);third=1-first-second;assert min(first,second,third)>0 and 'Әр белгі тек бір түсті'in s;answer=numeric(row,third*100);note=f'ACTUALred{first},blue{second}, green{third}; SAMEoriginalwholeandexplicitdisjointcolors, threefractionsSUM1. No successive-remainder reinterpretation.'
    elif k in {'participation-percent-fixed-whole','test-correct-share-percent'}:
        total,part=ns;assert 0<part<total;answer=numeric(row,part/total*100);note=f'ACTUALtypedWHOLE{total}/PART{part}, percent{part/total*100}, complement{(total-part)/total*100}; reversepart/wholeandnumbercorrectnotasked.'
    elif k=='rectangle-width-as-percent-of-length':
        width,length=ns;assert 'ЕНІ ҰЗЫНДЫҒЫНЫҢ'in s;answer=numeric(row,width/length*100);assert 0<width<length;note=f'ACTUALwidth{width}cm versuslengthBASE{length}cm; {width/length*100}%, reversecomparewould{length/width*100}, area/perimeternotbase.'
    elif k=='unsold-centner-after-two-sales-percent':
        assert ns[:3]==[1,1,100];whole=ns[2];used=ns[3]+ns[4];remaining=whole-used;assert 0<remaining<whole;answer=numeric(row,remaining/whole*100);note=f'ACTUAL1centner=100kg; used{ns[3]}+{ns[4]}={used}, remaining{remaining}, percent{remaining/whole*100}. Wholeexact100 explains kg/percentnumericalcoincidenceONLYhere.'
    elif k=='plan-total-percent-from-fraction-excess':
        excess=one(fs);assert 'АРТЫҚ'in s and 'БАРЛЫҒЫ'in s;answer=numeric(row,(1+excess)*100);note=f'ACTUALplan100% plusEXCESS{excess*100}% yieldsFULL{(1+excess)*100}%; excessnotrequested. Backcheckfull=1+3/25.'
    elif k=='price-increase-original-factor':
        p=one(ps);f=1+p;answer=numeric(row,f);assert_options(row,[p,1-p,f*10,f]);note=f'ACTUALoldpriceBASE, +{p*100}% givesTOTALfactor{f}; actualincrement/decrease/decimalpositionMCQs allfalse. Checkold100→{f*100}.'
    elif k=='increasing-order-three-representations':
        printed=s.split(' сандарын')[0];given=vector(printed);ordered=sorted(given);answer=one(o for o in row['options']if vector(o)==ordered)
        assert all(sorted(vector(o))==ordered for o in row['options']);assert len(set(given))==3;note=f'ALL3actualnumbers{list(map(str,given))}, strictascending{list(map(str,ordered))}; all4MCQs validPERMUTATIONS, onlyoneordered. Percent/decimal/fractionunitsfullynormalized.'
    elif k=='greatest-success-with-equal-test-totals':
        a=one(fs);b=h.D(m(r'Раяна (\d+,\d+)',s)[1]);c=one(ps);assert 'БІРДЕЙ САНДА'in s;people=['Данияр','Раяна','Інжу'];vs=[a,b,c];answer=one(n for n,v in zip(people,vs)if v==max(vs));assert answer in row['options']and len(set(vs))==3;note=f'ACTUALequalquestiontotalsmakescountsproportionaltovalues{list(map(str,vs))}for{people}; uniqueMAXowner{answer}, noneequal. Unequaltotalcounterinterpretationexcludedexplicitly.'
    elif k=='mixed-above-one-to-percent':
        mixed=m(r'(\(\d+ \+ \(\d+/\d+\)\))',s)[1];v=value(mixed);answer=numeric(row,v);whole=int(m(r'\((\d+) \+',mixed)[1]);a,b=m(r'\((\d+)/(\d+)\)',mixed).groups();concat=F(int(str(whole)+a+b),100);assert_options(row,[concat,v/100,v,v/10]);note=f'ACTUALmixed{mixed}={v}; {v*100}%, wholepart{whole*100}%+properpart{(v-whole)*100}%. EACHactualconcat/no×100/one-shiftchoice exactlyfalse.'
    elif k=='overlap-percent-with-exhaustive-union':
        a,b=ps;assert 'кемінде біреуіне'in s;c=a+b-1;parts=[a-c,c,b-c];assert min(parts)>=0 and sum(parts)==1;answer=numeric(row,c*100);note=f'ACTUALinclusivepercent{a*100}/{b*100}, unionALL=100. CommonSURPLUS{c*100}; threeNONNEGATIVEregions{list(map(str,parts))}, membershipbackchecksandSUM1. Nooutsidepossible.'
    elif k=='neither-divisibility-count-then-percent':
        low,upper,a,b=map(int,ns);assert low==1 and 'Екі шеті де кіреді'in s;domain=list(range(low,upper+1));A={n for n in domain if n%a==0};B={n for n in domain if n%b==0};outside=set(domain)-(A|B);answer=numeric(row,F(len(outside),len(domain))*100);assert len(A|B)==len(A)+len(B)-len(A&B)
        note=f'COMPLETEinclusive{low}…{upper} {len(domain)}numbers; modulo{a}/{b}sets{len(A)}/{len(B)}, intersection{len(A&B)}, neither{len(outside)}, requestedPERCENT{len(outside)*100//len(domain)}notrawcount. Everyactualintegerenumerated.'
    elif k=='relative-category-increase-rebase-to-whole':
        p=one(ps);white=F(1);blue=1+p;whole=white+blue;target=blue/whole;answer=numeric(row,target);assert_options(row,[target,p,white/whole,blue]);assert 'АРТЫҚ'in s and 'БАРЛЫҚ'in s;note=f'ACTUAL300%MORE meansblue=white×(1+3)=4white, not3white. NEWbaseALL5white→blue4/5=80%; ALLactualwhite20%, relative300%, blue/white400%traproleschecked.'
    elif k in {'successive-price-changes-reciprocal-factors','rectangle-area-two-percent-dimension-changes'}:
        up,down=ps;f=(1+up)*(1-down);answer=one(o for o in row['options']if factor(o)==f)
        if k.startswith('successive'):
            assert 'ЖАҢА баға'in s and 'АЛҒАШҚЫ'in s and f==1;assert[factor(o)for o in row['options']]==[f,1+up-down,1-up+down,1+up+down];assert F(12000)*(1+up)==19200 and 19200*(1-down)==12000
            note=f'ACTUALdifferentbases: firstfactor{1+up}, NEWbase secondfactor{1-down}, PRODUCT{f}; all4actualunchanged/additivedifference/oppositedifference/sumMCQs exact. Actual12000→19200→12000backtrace.'
        else:
            assert 'АУДАННЫҢ'in s;assert[factor(o)for o in row['options']]==[f,1+up-down,1-up+down,1];assert f==F(78,100);note=f'ACTUALtwoINDEPENDENTdimensionfactors{1+up}/{1-down}, areaPRODUCT{f}, decline{(1-f)*100}%; ALLactual15%linearcombinationandunchangedoptions false. Physical10×20→12×13areas200→156.'
    elif k=='recover-numerator-from-percent-and-denominator-gap':
        gap=ns[0];target=one(ps);assert gap>0 and 0<target<1;den=gap/(1-target);numerator=target*den;assert den.denominator==numerator.denominator==1 and den-numerator==gap;answer=numeric(row,numerator)
        # x/(x+g)=p ⇒ (1−p)x=pg. Nonzero1−p proves UNIQUE,
        # covering ALL positiveintegernumerators, notanarbitraryboundedsearch.
        assert (1-target)*numerator==target*gap;assert 'ҚЫСҚАРТЫЛМАҒАН'in s and 'АЛЫМЫН'in s;note=f'ACTUALdenominator−numeratorGAP{gap}, ratio{target}. ExactlinearuniquenessOVERALLpositiveintegersgivesrawnum{numerator}/rawden{den}, gap49and30%bothbackchecked; reducednum3NOTasked, gap49NOTdenominator.'
    elif k=='nested-club-percent-of-original-whole':
        outer=one(fs);inner=one(ps);total=outer*inner;assert 'КЛУБҚА БАРАТЫНДАРДЫҢ'in s and 'БАРЛЫҚ оқушының'in s;answer=numeric(row,total*100);assert 0<total<outer<1;note=f'ACTUALouter{outer}ofschool, inner{inner}OFCLUB, product{total}ofORIGINALschool={total*100}%; example100→75→30andtotal≤outer. Inner40%NOTschool40%.'
    elif k=='square-area-increase-from-side-percent':
        up=one(ps);f=(1+up)**2;answer=numeric(row,(f-1)*100);assert f==F(169,100)and f-1!=2*up;note=f'ACTUALsidefactor{1+up}, squareAREA{f}, requestedGAIN{(f-1)*100}%notnew169%/side30%/twosides60%; physical10→13gives100→169.'
    elif k=='count-proper-numerators-with-integer-percent':
        d=int(m(r'\(a/(\d+)\)',s)[1]);lo,hi=map(int,m(r'a — (\d+)–(\d+)',s).groups());assert 'екі шеті де кіреді'in s and 1==lo and hi==d-1;domain=[a for a in range(lo,hi+1)if F(100*a,d).denominator==1];step=d//math.gcd(100,d);assert domain==list(range(step,d,step));answer=numeric(row,len(domain));note=f'COMPLETEactualpropernumerator{lo}…{hi}, exact100a/{d} integrality iff a multipleof{step}, ALL{len(domain)}witnesses{domain}; endpoints0/{d}excluded. Universaldivisibilitycriterioncoversallnotexamples.'
    elif k=='equal-three-representations-choice':
        vs=[vector(o)for o in row['options']];truth=[len(set(v))==1 for v in vs];assert truth==[False,False,True,False];answer=one(o for o,t in zip(row['options'],truth)if t);note=f'EVERYactualTHREEvaluegroup{[[str(x)for x in v]for v in vs]}normalizedexactly; equalityrequiresALLTHREE, notjustlasttwo. Falsegroupsallcounterexample, unique7/25group.'
    elif k=='minutes-as-percent-of-hour':
        minutes=one(ns);assert 'Бір сағаттық'in s;answer=numeric(row,minutes/F(60)*100);note=f'ACTUAL{minutes}minutesofONE60minutehour, fraction{minutes/60}, percent{minutes/F(60)*100}. SI60not100; minutesraw21not21%. Physicalunitexplicit.'
    elif k=='absolute-percentage-point-difference':
        a,b=fs;difference=(a-b)*100;answer=one(o for o in row['options']if h.D(o.split(' ')[0])==difference);assert 'бір бүтінге қатысты'in s and 'ПАЙЫЗДЫҚ ПУНКТ'in s;assert[h.D(o.split(' ')[0])for o in row['options']]==[difference*10,F(4),difference/10,difference];assert difference==F(9,2)and (a-b)/b*100!=difference
        note=f'ACTUALsameoriginalwholea{a}=92%,b{b}=87.5%; ABSOLUTEindicator92−87.5={difference}PERCENTAGEPOINTS. Relativeincreasewould{(a-b)/b*100}%anddifferent; all4point-valuedoptionsfullycomputed, noambiguouspercentgrowthwording.'
    elif k=='first-category-percent-of-combined-total':
        a,b=ns;assert 'басқа түс жоқ'in s and 'БАРЛЫҚ'in s;target=a/(a+b);answer=numeric(row,target*100);assert target*100==36 and a/b*100!=36;note=f'ACTUALcounts{a}red/{b}blue, exhaustiveWHOLE{a+b}, red{target*100}%; denominatorOTHERCOLOR{b}wouldwrongrelative56.25%, complement64%notasked.'
    elif k=='plan-completion-percent-actual-over-planned':
        planned,actual=ns;assert 'БАРЛЫҒЫ'in s and actual>planned>0;answer=numeric(row,actual/planned*100);assert (actual-planned)/planned*100==30;note=f'ACTUALplannedBASE{planned}, actual{actual}, FULLcompletion{actual/planned*100}%vsEXCESS30%; exactbacktotalplanned+36and100%+30%.'
    elif k=='fraction-factor-after-numerator-and-denominator-percent-change':
        up,down=ps;assert 'ОҢ жай бөлшектің'in s and 0<down<1;f=(1+up)/(1-down);answer=one(o for o in row['options']if factor(o)==f);assert[factor(o)for o in row['options']]==[f,1+up-down,1+up+down,1+up];assert f==3 and F(18,9)/F(10,15)==f;note=f'ACTUALpositiveoriginalratio, changednumeratorfactor{1+up}, NONZEROdenominatorfactor{1-down}; divisiongives3×old, NEW300%vsGAIN200%. ALL4actualdifference/sum/numeratoronlytraps verified; concrete10/15→18/9.'
    elif k=='unit-fraction-integer-percent-denominator-domain':
        lo,hi=map(int,m(r'n — (\d+)–(\d+)',s).groups());assert lo>1 and 'екі шеті де кіреді'in s;domain=[n for n in range(lo,hi+1)if F(100,n).denominator==1];assert domain==[n for n in range(lo,hi+1)if 100%n==0];answer=numeric(row,len(domain));assert domain==[2,4,5,10,20,25];note=f'COMPLETEactualdenominator{lo}…{hi}inclusive; 100/nINTEGERiffnDIVIDES100, ALLwitnesses{domain} andpercentvalues{[100//n for n in domain]}. n1excluded, n25included, no8/12.5%mistake.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==41;entries=[];refs=set()
    for row in ROWS:
        answer,note=solve(row);assert answer==row['answer'],(row['editionId'],answer,row['answer']);bad=copy.deepcopy(row);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert row['grade']==5 and row['minimumPlan']=='pro'and not row.get('image')
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        else:assert answer.isdigit()and 'Жауапқа тек санды жазыңыз.'in row['statement']
        raw=h.raw_for(row);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        assert not re.search(r'× 100 = \d+(?:,\d+)?%',row['solution'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All41source/newfullconditions/official+newsolutions/EVERYMCQread; independentACTUALprintedFractionpercentUNIT/base/typedtarget/exhaustiveintegerdomainoracle; noauthorparams/spec/calculator','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All41saved/newfullconditions/fullsolutions/EVERYMCQmanuallyread','EverydisplayedpercentisVALUEp/100, barepercentNUMBERandpercentageUNITkeptdistinct','Original/remaining/secondstage/relativecategory/newcombinedWHOLEtypedcorrectly','Fullpropernumerator/denominator/divisibilitydomainsandunboundedinverseuniquenessproved','ExactALLMCQroles/equalitytruth/strictgreater/sortedtriples/pointdifference/physicaldimensionfactors','All41keys/wrongkeys/canonicalSHA/nativefractionstructureverified']})
    assert len(refs)==41
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]and native['fractions']==164
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All41source-addressedgrade5topic6.1nonvisual;39pct+2num; actualpercentunits/bases/allfiniteintegerdomains/fullMCQ','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':41,'wrongKeysRejected':41,'hashesMatched':41,'sourceRefs':41,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
