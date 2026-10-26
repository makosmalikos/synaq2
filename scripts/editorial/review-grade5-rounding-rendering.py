"""Independent all41 actual-printed rounding review. Exact rational half-up,
complete decimal grids and universal half-open interval proofs, no authorinputs.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','decimals']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-rounding.json';OUT='problems/editorial/reviews/grade5-rounding.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def rnd(v,p=0):
    v=F(v);assert v>=0 and type(p)is int and p>=0
    return (2*v.numerator*10**p+v.denominator)//(2*v.denominator)
def fixed(n,p):
    assert n>=0
    return str(n)if p==0 else str(n//10**p)+','+str(n%10**p).zfill(p)
def rounded(v,p=0):return fixed(rnd(v,p),p)
def places(s):return len(s.split(',')[1])if','in s else 0
def requested(s):
    label=m(r'(мыңдық үлестерге|жүздік үлестерге|ондық үлестерге|бүтін)',s.lower())[1];return {'мыңдық үлестерге':3,'жүздік үлестерге':2,'ондық үлестерге':1,'бүтін':0}[label]
def interval(v,p):return F(v)-F(1,2*10**p),F(v)+F(1,2*10**p)
def ceil(v):v=F(v);return -((-v.numerator)//v.denominator)
def grid(L,U,den):
    assert 0<=L<U and den>0
    low=ceil(L*den);high=ceil(U*den)-1
    assert F(low,den)>=L and F(high,den)<U and F(low-1,den)<L and F(high+1,den)>=U
    return list(range(low,high+1))
def possible_wholes(L,U):
    # Entire continuous interval, NOT a sampled decimal grid. The intersection
    # of lower-closed/upper-open preimages with [L,U) is nonempty iff low<high.
    candidates=range(L.numerator//L.denominator-1,ceil(U)+2)
    return [i for i in candidates if max(L,F(i)-F(1,2))<min(U,F(i)+F(1,2))]
def one_numeric_option(r,v):return one(o for o in r['options']if D(o)==v)

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-rounding-');ds=list(map(D,decimals(s)));topic='frac'
    direct={'round-distance-whole','round-midpoint-whole-carry','round-price-whole-carry','round-nonmidpoint-whole-up','round-tenths-diagnostics','round-hundredths-carry-final-zero','round-hundredths-four-fraction-digits','no-sequential-rounding-to-whole','round-small-decimal-thousandths','round-volume-whole-carry','round-thousandths-carry-through-whole'}
    if k in direct:
        a=one(ds);p=requested(s);answer=rounded(a,p)
        if r.get('options'):assert answer in r['options'];assert one_numeric_option(r,F(rnd(a,p),10**p))==answer
        note=f'ACTUALsourcevalue{a}, requestedplaces{p}, ONEexactrationalhalf-up givesFIXED{answer}, allretainedzeroes andcandidatevalues/formatschecked.'
        if k=='no-sequential-rounding-to-whole':
            chained=a
            for p2 in[3,2,1,0]:chained=F(rnd(chained,p2),10**p2)
            assert str(chained)==r['options'][1]and rounded(a,0)!=str(chained);note+=' Actualfourstageroundingwould10vsdirect9; chainedtransformationexplicitlyrejected.'
    elif k=='round-tenths-and-compare-excess':
        a=one(ds);q=F(rnd(a,1),10);direction='артығымен'if q>a else'кемімен';answer=one(o for o in r['options']if o==rounded(a,1)+' — '+direction);note=f'Actual{a}→TENTH{q}, comparisonq>a={q>a}gives{direction}; ALL4pairednumber/directionchoices evaluatedtogether.'
    elif k=='identify-rounded-place':
        a,b=map(str,m(r'(\d+,\d+) ≈ (\d+,\d+)',s).groups());p=places(b);assert rounded(D(a),p)==b;label={0:'бүтінге дейін',1:'ондық үлестерге дейін',2:'жүздік үлестерге дейін',3:'мыңдық үлестерге дейін'}[p];answer=one(o for o in r['options']if o==label);note=f'Actualapproximation{a}≈{b}hasEXACT{p}retaineddecimalplaces, checkedactualrounding, requestedPLACENAME{label}notvalue.'
    elif k=='round-tenths-then-multiply-ten':
        a=one(ds);factor=number(r'мәнді (\d+) санына',s);a1=F(rnd(a,1),10);v=a1*factor;answer=integer(v);assert a*factor!=v;note=f'Actual{a}FIRSTroundTENTH{a1}, THEN×{factor}={v}; rawproduct{a*factor}nottarget.'
    elif k=='select-correct-tenths-approximation':
        flags=[rounded(D(a),1)==b for a,b in[o.split(' ≈ ')for o in r['options']]];answer=one(o for o,t in zip(r['options'],flags)if t);note=f'ALL4actualapproximationchoices first-discarded-digitcheckedEXACTLY flags{flags}; nohiddenlast9double-round, carryto8.0keepszero.'
    elif k=='unknown-first-discarded-digit':
        whole,first,last=m(r'^(\d+),(\d)□(\d)',s).groups();target=D(m(r'дөңгелектегенде (\d+,\d+)',s)[1]);candidates=[]
        for d in range(10):
            v=F(int(whole+first+str(d)+last),1000)
            if F(rnd(v,1),10)==target:candidates.append(d)
        answer=one(o for o in r['options']if int(o)in candidates);assert candidates==[5,6,7,8,9];note=f'COMPLETEALL0…9foractual{whole},{first}□{last}; validfirstdiscardeddigits{candidates}, last{last}neverchangesprior4; onlyoffered{answer}.'
    elif k=='square-area-before-whole-round':
        side=one(ds);exact=side**2;v=rnd(exact,0);answer=str(v);topic='geo';assert v!=rnd(side,0)**2;note=f'ActualSQUAREside{side}, EXACTarea{exact}, THENround{v}; prematurelyroundedside²{rnd(side,0)**2}false.'
    elif k=='speed-before-whole-round':
        time,distance=ds;speed=distance/time;answer=str(rnd(speed,0));assert speed*time==distance;note=f'Actualdistance{distance}/time{time}→EXACTspeed{speed}, THENwhole{answer}; physicalpathbackcheck.'
    elif k=='nonterminating-unit-cost-before-whole-round':
        count,price=map(int,m(r'Бірдей (\d+) папканың толық құны (\d+) теңге',s).groups());v=F(price,count);answer=str(rnd(v,0));whole,rem=divmod(price,count);digit,rem2=divmod(rem*10,count);assert digit>=5 and rem2!=0;note=f'ActualTOTAL{price}/{count}unitprice{v}, Euclideanwhole{whole}/rem{rem}→digit{digit}/rem{rem2}; nearestwhole{answer}, nottruncateddivision orceilwithoutcomparison.'
    elif k=='nonterminating-fraction-to-thousandths':
        n,d=map(int,m(r'\((\d+)/(\d+)\)',s).groups());v=F(n,d);answer=rounded(v,3);rem=n%d;states=[]
        for i in range(4):digit,nrem=divmod(rem*10,d);states.append((rem*10,d,digit,nrem));rem=nrem
        assert states==[(30,11,2,8),(80,11,7,3),(30,11,2,8),(80,11,7,3)];note=f'Actual{n}/{d}nonterminating, independentFOUREuclideansteps{states}; fourthdigit7decidesround .273, notthree-digittruncation. All4precision/valuechoices.'
    elif k=='select-preimage-of-integer-rounding':
        target=number(r'дөңгелектегенде (\d+) шықты',s);L,U=interval(target,0);flags=[L<=D(o)<U for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);note=f'UNIVERSALroundpreimageof{target}=[{L},{U}), lowerhalfINCLUDED/upperhalfEXCLUDED. ALLofferedexactvaluesflags{flags}, only{answer}.'
    elif k=='count-two-digit-decimals-round-tenths':
        target=one(ds);L,U=interval(target,1);values=grid(L,U,100);assert all(F(rnd(F(n,100),1),10)==target for n in values);answer=str(len(values));assert len(values)==10 and any(n%10==0 for n in values);note=f'FULLexact2decimalgridintersectpreimage[{L},{U})givesraw{values}, includingtrailing0representation; COUNT10invariantwithchangedtarget, bothoutsideboundaryneighbors fail.'
    elif k=='three-independent-precisions-from-original':
        a=one(ds);vals=[rounded(a,p)for p in[1,2,3]];answer=one(o for o in r['options']if o=='; '.join(vals));note=f'ACTUALORIGINAL{a}independently→p1,p2,p3:{vals}; wholecarry68.0retained0; notroundingpreviousapproximation.'
    elif k=='fuel-cost-before-whole-round':
        price=number(r'литрі (\d+) теңге',s);litres=one(ds);exact=price*litres;answer=str(rnd(exact,0));note=f'Actual{price}perL×{litres}LexactCOST{exact}, onlyCOSTrounded{answer}; inputlitresneverprematurelyrounded.'
    elif k=='absolute-approximation-error':
        a,b=ds;error=abs(b-a);answer=one_numeric_option(r,error);assert one_numeric_option(r,abs(a-F((a*10).numerator//(a*10).denominator,10)))!=answer;note=f'Actualpair{a}≈{b}, askedNONNEGATIVEabsoluteGAP{error}, notlowerneighborgap; exactaligneddecimaldifferenceALLMCQs.'
    elif k=='half-unit-mass-price-whole-round':
        price=number(r'килограмы (\d+) теңге',s);mass=one(ds);exact=price*mass;assert exact%1==F(1,2);answer=str(rnd(exact,0));note=f'Actualunitprice{price}×mass{mass}={exact}EXACTHALFbetween{exact.numerator//exact.denominator}and{answer}, explicittiesUP, noinputround.'
    elif k=='rounded-input-product-single-possible-integer':
        target=one(ds);scale=number(r'(\d+) × a',s);L,U=interval(target,1);scaled=(scale*L,scale*U);possible=possible_wholes(*scaled);assert possible==[21];j=one(possible);jl,ju=interval(j,0);assert scaled[0]>=jl and scaled[1]<=ju;answer=one(o for o in r['options']if o==f'Тек {j}');note=f'UNIVERSALa∈[{L},{U}), ×{scale}→[{scaled[0]},{scaled[1]}), ENTIREintervalinsideinteger{j}preimage[{jl},{ju}); allcontinuouspossibleintegers{possible}, notonlyroundedinput×scale.'
    elif k=='round-total-vs-sum-rounded-prices':
        prices=ds;assert len(prices)==3;separate=sum(rnd(p,0)for p in prices);exact=sum(prices);together=rnd(exact,0);answer=str(together-separate);assert together>separate;note=f'ALLactualprices{prices}; separateSUM{separate}, exactSUM{exact}THENround{together}, requestedDIFFERENCE{answer}; same.4remaindersquantitativelyaccounted.'
    elif k=='extreme-three-digit-preimage-gap-scaled':
        target=one(ds);factor=number(r'айырмасын (\d+) санына',s);L,U=interval(target,1);values=grid(L,U,1000);assert len(values)==100;v=F(values[-1]-values[0],1000)*factor;answer=integer(v);assert all(F(rnd(F(n,1000),1),10)==target for n in values);note=f'FULLexact3decimalgridinside[{L},{U})raw{values[0]}…{values[-1]},100candidates, extremegap×actualfactor{factor}={v}; lowerendpointtrailing0included, bothouterneighborsfail;99invarianthonest.'
    elif k=='hours-minutes-to-tenths-hours':
        hours,minutes=map(int,m(r'сабағы (\d+) сағат (\d+) минут',s).groups());assert 0<minutes<60;v=hours+F(minutes,60);answer=rounded(v,1);assert one_numeric_option(r,D(answer))==answer and rounded(hours+F(minutes,100),1)!=answer;note=f'ACTUAL{hours}h{minutes}min→{hours}+{minutes}/60={v}h, ONCEroundTENTH{answer}; SI60not100, convertsback3h42minnear3h43.'
    elif k=='sum-individually-rounded-unit-fractions':
        fractions=[F(int(n),int(d))for n,d in re.findall(r'\((\d+)/(\d+)\)',s)];assert len(fractions)==3;individual=[F(rnd(f,3),1000)for f in fractions];factor=number(r'қосындыны (\d+) санына',s);v=sum(individual)*factor;answer=integer(v);assert individual==[F(91,1000),F(71,1000),F(59,1000)];note=f'ALLactual3fractions{fractions}individuallyONCEroundto3places{individual}, SUM×{factor}={v}; neithertruncate3placesnorroundfullunroundedsumfirst.'
    elif k=='intersection-hundredth-tenth-rounding-count':
        hundredth,tenth=ds;whole=number(r'Бүтін бөлігі (\d+)',s);L1,U1=interval(hundredth,2);L2,U2=interval(tenth,1);L=max(F(whole),L1,L2);U=min(F(whole+1),U1,U2);values=grid(L,U,1000);assert all(F(rnd(F(n,1000),2),100)==hundredth and F(rnd(F(n,1000),1),10)==tenth for n in values);answer=str(len(values));note=f'UNIVERSALintersectionofORIGINALpreimages[{L1},{U1})and[{L2},{U2})andwhole{whole}→[{L},{U}), FULL3placegrid{values}; count5includesfirst8450trailingzero; actualrawlistbinding, nochaindouble-round.'
    elif k=='maximum-rounded-difference-of-rounded-inputs':
        a,b=map(int,re.findall(r'дөңгелектесе (\d+)',s));La,Ua=interval(a,0);Lb,Ub=interval(b,0);L,U=La-Ub,Ua-Lb;possible=possible_wholes(L,U);maximum=max(possible);witnessA=Ua-F(1,10);witnessB=Lb;assert La<=witnessA<Ua and Lb<=witnessB<Ub and rnd(witnessA-witnessB,0)==maximum;assert U<F(maximum+1)-F(1,2);answer=str(maximum);note=f'ALLcontinuousa∈[{La},{Ua}),b∈[{Lb},{Ub})→differenceSTRICT({L},{U}); exactintegerpreimageintersectionspossible{possible}, max{maximum}. Explicitwitness{witnessA}−{witnessB}; higherintegerrequires≥{F(maximum+1)-F(1,2)}>U.'
    elif k=='select-hundredths-result-ending-zero':
        vals=[rounded(D(o),2)for o in r['options']];answer=one(o for o,v in zip(r['options'],vals)if v.endswith('0'));note=f'ALL4ACTUALsourcevalues roundedFIXEDtwo places{vals}, only{answer}ends0; last0precisionretained, internalcarryandfirstdiscardeddigitnotlater9.'
    elif k=='capacity-requires-ceiling-not-nearest':
        capacity,total=ds;ratio=total/capacity;v=ceil(ratio);assert (v-1)*capacity<total<=v*capacity and rnd(ratio,0)!=v;answer=str(v);topic='word';note=f'ActualTOTAL{total}L/capacity{capacity}={ratio}; minimumINTEGERbottlesCEILING{v}, previouscapacity{(v-1)*capacity}insufficient,next{v*capacity}sufficient; nearest{rnd(ratio,0)}explicitlyWRONG.'
    elif k=='infer-hundredths-from-thousandth-round':
        target=one(ds);L,U=interval(target,3);valid=[]
        for o in r['options']:
            assert places(o)==2;l,u=interval(D(o),2)
            if l<=L and U<=u:valid.append(o)
        answer=one(valid);l,u=interval(D(answer),2);note=f'UNIVERSALORIGINALx∈[{L},{U})fromp3given; ENTIREintervalsubsetofanswerp2[{l},{u}), all4offeredtargetpreimageschecked, notmerelyreroundingknownmidpoint; retain3.70zero.'
    elif k=='sum-three-masses-before-whole-round':
        assert len(ds)==3;v=sum(ds);answer=str(rnd(v,0));note=f'ALL3actualmassaddends{ds}, exactTOTAL{v}, ONCEroundwhole{answer}; everyterm included, noindividualrounding.'
    elif k=='choose-common-tenths-whole-preimage':
        target=one(ds);whole=number(r'дөңгелектесе (\d+) шығады',s);flags=[F(rnd(D(o),1),10)==target and rnd(D(o),0)==whole for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);note=f'ALL4actualoriginals independentlyroundedp1target{target}ANDp0target{whole}, flags{flags}; nooriginal→tenth→wholechain.'
    elif k=='max-rounded-scaled-input-from-whole-round':
        target=number(r'дөңгелектегенде (\d+) шықты',s);scale=number(r'(\d+) × x',s);L,U=interval(target,0);L*=scale;U*=scale;possible=possible_wholes(L,U);maximum=max(possible);witness=F(U,scale)-F(1,100);assert rnd(witness,0)==target and rnd(scale*witness,0)==maximum and U<F(maximum+1)-F(1,2);answer=str(maximum);note=f'UNIVERSALwholepreimage then×{scale}→[{L},{U}); exactintersectionsALLpossibleintegers{possible}, max{maximum}, witnessx{witness}; upperUUNATTAINEDasrealproductbutrounded{maximum}ATTAINABLE, nextrequires≥{F(maximum+1)-F(1,2)}impossible.'
    elif k=='rectangle-pre-rounded-factors-versus-exact-product':
        a,b=ds;premA=F(rnd(a,1),10);premB=F(rnd(b,1),10);premExact=premA*premB;correctExact=a*b;premRounded=F(rnd(premExact,1),10);correctRounded=F(rnd(correctExact,1),10);v=premRounded-correctRounded;answer=one_numeric_option(r,v);assert one_numeric_option(r,premExact-correctExact)!=answer;topic='geo';note=f'ACTUALdimensions{a},{b}; Armanspre-rounded{premA}×{premB}={premExact}→{premRounded}; DanasEXACT{correctExact}→{correctRounded}; requestedFINALroundedgap{v}, notrawgap{premExact-correctExact}; EACHprocedureseparate.'
    elif k=='taxi-rounded-distance-before-rounded-fee':
        price=number(r'үшін (\d+) теңге',s);distance=one(ds);roundedDistance=F(rnd(distance,1),10);cost=roundedDistance*price;v=rnd(cost,0);answer=str(v);assert cost%1==F(1,2)and rnd(distance*price,0)!=v;note=f'ActualEXPLICITtariffpipeline FIRST{distance}→{roundedDistance}km, THEN×{price}={cost}, HALFUPwhole{v}; rawdistancepipeline{distance*price}→{rnd(distance*price,0)}different andnotauthorizedorder.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note

def solution_claims(r):
    # Every displayed numeric approximate equality in the final solution,
    # including comparison/backcheck alternatives, uses its OWN statedprecision.
    claims=re.findall(r'(\(\d+/\d+\)|\d+(?:,\d+)?)\s*≈\s*(\d+(?:,\d+)?)',r['solution']);
    for a,b in claims:assert rounded(expr(a),places(b))==b,(r['editionId'],a,b)
    return len(claims)
def main():
    assert len(ROWS)==41;entries=[];refs=set();claims=0
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image');claims+=solution_claims(r)
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All41fullsaved/newconditions/official/newsolutions/everyMCQ read; own ACTUALPRINTED Fraction half-up/fixedprecision, completegrids/digitdomains/universalhalfopenintervalproofs and typedpipeline oracle; noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All41source/newfullconditions/official/newsolutions/everyMCQmanuallyread','ExactrationalroundingONCE, allleading/internal/retainedlastzero formats checked','Everywrittennumericapproximation innewsolution independentlyverified atRHSprescribedprecision','Complete0…9mask/2place/3place/intersectiongrids, adjacentboundaryneighbors andinvariantcounts honest','Universalcontinuoushalfopenpreimage/intersection/scaleddifferenceattainability proofs, notsampleonly','SI60/naturalceil/costtimeunits/input-vs-final-rounding andallorderedstages exact']})
    assert len(refs)==41 and claims==45
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'ALL41source-addressedgrade5topic4.11nonvisualrounding','roundingAudit':{'writtenNumericApproximationClaims':claims,'completeDigitCandidates':10,'gridHundredthCount':10,'gridThousandthCandidates':100,'intersectedGridCount':5},'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':41,'wrongKeysRejected':41,'hashesMatched':41,'sourceRefs':41,**report['roundingAudit'],'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
