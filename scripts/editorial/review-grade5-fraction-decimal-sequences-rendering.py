"""Independent exact ACTUALPRINTED sequence review, all44 archived/new rows.
No author specs, model, solver or params are read. Domains use exact rational
arithmetic and exhaustive finite bounds / algebraic monotonicity where needed.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','decimals']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-fraction-decimal-sequences.json';OUT='problems/editorial/reviews/grade5-fraction-decimal-sequences.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def groups(s):
    out=[]
    for g in h.groups(s):
        try:out.append(expr(g))
        except(AssertionError,SyntaxError,ZeroDivisionError):pass
    return out
def pick(r,v):return one(o for o in r['options']if expr(o)==v)
def finish(r,v):return pick(r,v)if r.get('options')else integer(v)
def pair(r,vs):return one(o for o in r['options']if [expr(t)for t in o.split('; ')]==vs)
def progression(vs):
    assert len(vs)>=3;step=vs[1]-vs[0];assert all(b-a==step for a,b in zip(vs,vs[1:]));return step
def geometric(vs):
    assert all(v>0 for v in vs);factor=vs[1]/vs[0];assert all(b/a==factor for a,b in zip(vs,vs[1:]));return factor
def formula(s,n):
    # Bounded visible grammar only. Insert the ACTUAL index into every n,
    # retaining grouping of both sides of the fraction bar.
    s=re.sub(r'(\d|\))n',r'\1*n',s);s=re.sub(r'\bn\b','('+str(n)+')',s);return expr(s)
def rounded(v,p):
    n=(2*v.numerator*10**p+v.denominator)//(2*v.denominator)
    return str(n)if not p else str(n//10**p)+','+str(n%10**p).zfill(p)
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-fraction-decimal-sequences-');ds=list(map(D,decimals(s)));gs=groups(s);topic='seq'
    if k=='descending-decimal-nth':
        first,step=ds;n=number(r'(\d+)-мүшенің',s);v=first-(n-1)*step;answer=pick(r,v);assert [expr(o)for o in r['options'][1:]]==[v+step,v-step,first+(n-1)*step];note=f'Actualfirst{first}, decrement{step}, index{n}→NminusONE{n-1}steps, ALLprevious/next/reversed-signtraps checked.'
    elif k=='unit-reciprocal-nonmember':
        assert 'a(n) = (1/n)'in s;indices=[1/expr(o)for o in r['options']];answer=one(o for o,n in zip(r['options'],indices)if n.denominator!=1 or n<1);assert indices[:3]==[15,80,1];note=f'ALLactualofferedvalues uniquelyinverttoindices{indices}; only{answer}requiresnonnaturalindex. Universaliffreducednumerator1, includesmember1.'
    elif k=='rational-affine-formula-evaluate':
        f=m(r'b\(n\) = (.+)\. b\((\d+)\)',s);v=formula(f[1],int(f[2]));answer=integer(v);assert v==8;note=f'ACTUALwholefraction{f[1]}substitute{f[2]}inNUMERATORandDENOMINATOR, value{v}; bothbarroleschecked.'
    elif k=='descending-listed-next':
        vs=ds;step=progression(vs);assert step<0;answer=pick(r,vs[-1]+step);assert expr(r['options'][1])==vs[-1]+2*step and expr(r['options'][2])==vs[-2];note=f'ALLfourprinteddecimals{vs}, exactequalnegativegaps{step}, next{vs[-1]+step}; skip/reversal/different-stepMCQs.'
    elif k=='fraction-arithmetic-nth':
        vs=gs;step=progression(vs);assert len(vs)==4 and step==vs[0];n=number(r'(\d+)-мүшесін',s);answer=integer(vs[0]+(n-1)*step);note=f'ALLfouractualproper/mixedinputs{vs}, genuinecommondenominatorfractiondifferences{step}; index{n}has{n-1}increments, target{answer}.'
    elif k=='mixed-arithmetic-next-carry':
        vs=gs;step=progression(vs);v=vs[-1]+step;answer=pick(r,v);assert vs[-1]%1+step%1>=1;assert[expr(o)-vs[-1]for o in r['options'][1:]]==[F(3,8),F(7,8),F(1)];note=f'ALLactualmixedvalues{vs}, step{step}, finalfractionalpartsCARRY{vs[-1]%1}+{step%1}≥1→{v}; actualthreeincorrectincrements checked.'
    elif k=='fixed-denominator-member-index':
        d=int(m(r'\(1/(\d+)\)',s)[1]);target=number(r'мүше (\d+) санына',s);n=d*target;answer=str(n);assert F(n,d)==target;note=f'Actualconstantdenominator{d}, targetVALUE{target}; uniqueINDEXn={n}, backsubstitution, notvaluereport.'
    elif k=='decimal-affine-formula-evaluate':
        f=m(r'a\(n\) = (.+), n = 1, 2, … \. a\((\d+)\)',s);v=formula(f[1],int(f[2]));answer=integer(v);note=f'Actualaffineformula{f[1]}atn{f[2]}→{v}; multiplicationonlyncoefficient, constnotmultiplied.'
    elif k=='fraction-geometric-nth':
        first=one(gs);factor=number(r'алдыңғысын (\d+) санына',s);n=number(r'(\d+)-мүшені',s);vs=[first]
        for _ in range(n-1):vs.append(vs[-1]*factor)
        answer=integer(vs[-1]);note=f'Actualfirst{first},factor{factor},index{n}; FULLexactchain{vs}, {n-1}multiplicationsratherthanN.'
    elif k=='decimal-tenfold-nth':
        vs=ds;factor=geometric(vs);n=number(r'(\d+)-мүшесін',s);v=vs[0]*factor**(n-1);answer=integer(v);note=f'ALLactualthreeleadingzerooperands{vs}, ratio{factor}, total{n-1}decimalshifts fromfirst→{v}; fullpadding/accounting.'
    elif k=='fixed-denominator-previous':
        vs=gs;step=progression(vs);v=vs[0]-step;answer=pick(r,v);assert[expr(o)for o in r['options'][1:]]==[F(6,17),F(1,17),F(4,14)];note=f'Actualfourfractions{vs}, constantstep{step}; PREVIOUSsubtractstep{v}, notnext. Allnumminus1/twosteps/denominatorchangedtraps checked.'
    elif k=='fraction-arithmetic-missing-mixed':
        segment=s.split(': ',1)[1].split('. □',1)[0];slots=segment.split('; ');slots[-1]=slots[-1].rstrip('.');assert slots[3]=='□';known=[None if t=='□'else expr(t)for t in slots];step=known[1]-known[0];v=known[2]+step;filled=[v if a is None else a for a in known];assert progression(filled)==step;answer=pick(r,v);note=f'COMPLETEsixACTUALslots{filled}, fillposition4 viaexactstep{step}; allFIVEadjacentgapsincludingbothneighborschecked, mixedanswer{v}.'
    elif k=='decimal-proportional-member-index':
        coefficient,target=ds;n=target/coefficient;answer=integer(n);assert coefficient*n==target;note=f'Actual{coefficient}n={target}, naturaluniqueINDEX{n}, equalbothmembercommashift andbackmultiply.'
    elif k=='fixed-denominator-initial-sum':
        d=int(m(r'\(1/(\d+)\)',s)[1]);n=number(r'АЛҒАШҚЫ (\d+) мүшесін',s);values=[F(i,d)for i in range(1,n+1)];v=sum(values);answer=integer(v);assert v==F(n*(n+1),2*d);note=f'ALL{n}actualn/{d}members explicitlyenumerated, pairedsum{n*(n+1)//2}/{d}={v}; initialandlastincluded.'
    elif k=='mixed-arithmetic-next-two':
        vs=gs;step=progression(vs);assert len(vs)==4;v1=vs[-1]+step;v2=v1+step;answer=pair(r,[v1,v2]);assert len(set(v.denominator for v in vs))>1,'Preserve source requiredmixed-denominatorconversion';assert vs[-1]%1+step%1>=1 or v1%1+step%1>=1
        actual=[expr(t)for t in r['options'][1].split('; ')];wrongStep=actual[0]-vs[-1];assert actual[1]-actual[0]==wrongStep and 0<wrongStep<step
        assert[expr(t)for t in r['options'][3].split('; ')]==[vs[-1]+2*step,vs[-1]+4*step]
        note=f'ALL4actualmixedinputs{vs}haveDIFFERENTreduceddenominators, exactcommonstep{step}; explicitdenominatorconversion/carryandorderedTWOanswers{v1},{v2}. Actualnumerator-only/switch-secondstep/skippedtermsMCQschecked.'
    elif k=='fixed-denominator-index-then-round':
        d=number(r'a\(n\) = \(n/(\d+)\)',s);n=number(r'(\d+)-мүшені',s);v=F(n,d);answer=one(o for o in r['options']if o==rounded(v,2));assert expr(r['options'][1])==F((v*100).numerator//(v*100).denominator,100) and r['options'][2]==rounded(v,1)and expr(r['options'][3])==v;note=f'FIRSTactualindex{n}/{d}={v}, THENfixedhundredthHALFUP{answer}; truncation/tenth/unroundedthreeformattraps actualchecked.'
    elif k=='decimal-arithmetic-initial-sum':
        vs=ds;step=progression(vs);assert step==vs[0];n=number(r'АЛҒАШҚЫ (\d+) мүшенің',s);allvs=[vs[0]+i*step for i in range(n)];v=sum(allvs);answer=integer(v);assert len(allvs)%2==0 and all(allvs[i]+allvs[-1-i]==allvs[0]+allvs[-1]for i in range(n//2));note=f'ALLprintedvalues{vs}, complete{n}terms{allvs}, {n//2}equalendpairs; exactsum{v}.'
    elif k in {'numerator-denominator-offset-formula','mixed-n-over-next-formula'}:
        vs=gs;assert len(vs)==4;flags=[[formula(o,n)for n in range(1,5)]==vs for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);assert sum(flags)==1
        if k=='numerator-denominator-offset-formula':assert formula(r['options'][3],1)==vs[0]and formula(r['options'][3],2)!=vs[1]
        else:assert formula(r['options'][1],1)==vs[0]and formula(r['options'][1],2)!=vs[1]
        note=f'AllFOURACTUALformulaoptions substitutedatALL4declaredindices intoWHOLEfractionbar; flags{flags}; first-member-matchingwrongformulaexplicitlyrejectsatSECOND. Actualtarget{vs}.'
    elif k=='sum-two-previous-fractions':
        first,second=gs;n=number(r'(\d+)-мүшені',s);values=[first,second]
        for _ in range(2,n):values.append(sum(values[-2:]))
        answer=integer(values[-1]);note=f'ACTUALfirsttwo{first},{second}, all{n}members exacttwo-previous recurrence{values}; nooneprevious/additionalstepconfusion.'
    elif k=='alternating-reciprocal-power-pair':
        segment=s.split(': ',1)[1].split('; …',1)[0];vs=[expr(v)for v in segment.split('; ')];odd=vs[::2];even=vs[1::2];a=geometric(odd);b=geometric(even);assert a*b==1 and all(x*y==1 for x,y in zip(odd,even));pairvs=[odd[-1]*a,even[-1]*b];answer=pair(r,pairvs);assert [expr(t)for t in r['options'][1].split('; ')]==pairvs[::-1];note=f'ALL6actualvalues splitODD{odd}/EVEN{even}, respectivefactors{a}/{b}; orderednextpair{pairvs}, reversed/falseadditivedenominator/falseadditiveeven traps.'
    elif k=='listed-decimal-term-count':
        first,third,fourth,last=ds;step=(third-first)/2;assert fourth-third==step and '1;'in s;count=(last-first)/step+1;answer=integer(count);assert first+(count-1)*step==last;note=f'Printedfirst{first},integerSECOND1,third{third},fourth{fourth},last{last}; completeinclusivecount{count}, STEPS{count-1}, endpointsbound.'
    elif k=='index-of-n-over-offset':
        c=number(r'a\(n\) = \(n/\(n \+ (\d+)\)\)',s);target=one(gs);n=c*target/(1-target);answer=integer(n);assert F(n,n+c)==target;note=f'ACTUALn/(n+{c})=target{target}; crossmultiplypositivecoeff1−target yieldsUNIQUEindex{n}, natural/backsub. FractionVALUEnotINDEX.'
    elif k=='daily-run-target-day':
        first,step,target=ds;n=(target-first)/step+1;answer=integer(n);assert first+(n-1)*step==target and first+(n-2)*step<target;note=f'ActualDAY1{first},daily+{step},targetDAILY{target}, {n-1}increments→DAY{n}; previousdaybelow, notsumofdays.'
    elif k=='evaporation-initial-time-not-first-index':
        whole,rate=ds;hours=number(r'(\d+) толық сағат өткеннен',s);removed=rate*hours;remaining=whole-removed;assert remaining>0;answer=pick(r,remaining);assert[expr(o)for o in r['options'][1:]]==[whole-rate*(hours-1),whole+removed,removed];topic='word';note=f'ActualTIMEZERO{whole}, {hours}FULLhourlosses{rate}, removed{removed}/remaining{remaining}; conservationandallone-less/sign/removed-roletraps.'
    elif k=='geometric-two-internal-missing':
        first,second,third,last=ds;factor=geometric([first,second,third]);a=third*factor;b=a*factor;assert b*factor==last;answer=pair(r,[a,b]);note=f'ALLprinted3prefix+LAST{last}, factor{factor}, bothinternalgaps[{a},{b}], NEXTbackcheckbindslast. Orderedpair/fullrule notadditiveorchangingfactor.'
    elif k=='decimal-affine-member-index':
        a,b,target=ds;n=(target-b)/a;answer=integer(n);assert a*n+b==target;note=f'Actualaffine{a}n+{b}={target}inverseuniquepositivecoefficient→naturalINDEX{n}; backsubstitution.'
    elif k=='same-index-two-affines-common-VALUE':
        a,b,c,d=ds;n=(b+d)/(c-a);assert n.denominator==1 and n>0;va=a*n+b;vb=c*n-d;assert va==vb;answer=pick(r,va);assert[expr(o)for o in r['options'][1:]]==[n,a*(n+1)+b,a*(n-1)+b];note=f'Actualtwoaffines{a}n+{b}and{c}n−{d}; SAMEindex{n}, askedCOMMONVALUE{va}, notn; ALLneighbor/indexroleMCQs.'
    elif k=='shifted-telescoping-product':
        f=m(r'a\(n\) = (.+), n = 1',s)[1];n=number(r'Алғашқы (\d+) мүшенің',s);product=F(1);terms=[]
        for i in range(1,n+1):term=formula(f,i);terms.append(term);product*=term
        answer=pick(r,product);assert product==F(n+2,2)and expr(r['options'][1])==F(n+1,2)and expr(r['options'][2])==F(n+3,2)and expr(r['options'][3])==1/product;note=f'ACTUALformula{f}, completeproductALL{n}terms{terms}={product}. UniversalpartialproductP(k)=(k+2)/2 viaP1=3/2 andP(k)*((k+3)/(k+2))=(k+3)/2; bothuncancelledendpointsretained.'
    elif k=='odd-length-decimal-sum-pair-and-middle':
        step,last,declaredstep,firstshown,secondshown,penultimate,againlast=ds;assert step==declaredstep==firstshown and secondshown==2*step and last==againlast and last-penultimate==step;N=last/step;assert N.denominator==1 and N%2==1;vs=[step*i for i in range(1,int(N)+1)];middle=vs[len(vs)//2];pairs=(len(vs)-1)//2;v=sum(vs);answer=integer(v);assert v==pairs*(vs[0]+vs[-1])+middle and middle==(vs[0]+vs[-1])/2;note=f'FULL{len(vs)}inclusiveactualdecimalmembers, ODD{pairs}endpairsplusONEunpairedmiddle{middle}; sum{v}, neitheromitnordoublemiddle.'
    elif k=='natural-members-of-decimal-proportional-sequence':
        coefficient=one(ds);N=number(r'АЛҒАШҚЫ (\d+) мүшенің',s);a,b=coefficient.numerator,coefficient.denominator;assert math.gcd(a,b)==1;valid=[n for n in range(1,N+1)if(coefficient*n).denominator==1];assert valid==list(range(b,N+1,b));answer=str(len(valid));note=f'UNIVERSALcoprime{a}/{b}nintegerIFF{b}|n, FULL1…{N}domain{valid}; valuespositive, count{answer}, endpointincluded.'
    elif k=='all-natural-members-reciprocal-square-numerator':
        value=number(r'a\(n\) = \((\d+)/n\)',s);valid=[n for n in range(1,value+1)if value%n==0];root=math.isqrt(value);assert root*root==value;assert valid.count(root)==1;answer=str(len(valid));note=f'FULLnaturalINDEX1…{value}divisorlist{valid}; alln>{value}give0<a(n)<1andimpossible. SQUAREroot{root}countedONCE; allinfinitelymanyexcludedbyinequality.'
    elif k=='first-proper-ratio-above-strict-threshold':
        target=one(ds);boundary=target/(1-target);assert boundary.denominator==1;N=int(boundary)+1;valid=[n for n in range(1,N+1)if F(n,n+1)>target];assert valid==[N]and F(N-1,N)==target;answer=str(N);note=f'UNIVERSALn/(n+1)>actual{target}IFFn>{boundary}; strictpreviousEQUALITY{F(N-1,N)}, firstnatural{N}; completedomain1…{N}, monotone gap1/(n+1)decreases.'
    elif k=='alternating-descending-decimal-pair-sum':
        first,last,step,*_=ds;steps=(first-last)/step;assert steps.denominator==1;N=int(steps)+1;assert N%2==0;vs=[first-i*step for i in range(N)];v=sum(a if i%2==0 else-a for i,a in enumerate(vs));answer=integer(v);assert v==N//2*step and vs[-1]==last;note=f'COMPLETE{N}descendingactualmagnitudes withALLalternatingsigns, {N//2}pairdifferences{step}; first/lastincluded, noleftoverunpairedterm, sum{v}.'
    elif k=='daily-run-initial-odd-sum':
        first,step=ds;N=number(r'Алғашқы (\d+) күндегі',s);vs=[first+i*step for i in range(N)];assert N%2==1;mid=vs[N//2];v=sum(vs);assert v==(N//2)*(vs[0]+vs[-1])+mid;answer=integer(v);note=f'ALL{N}actualDAY1indexedlengths{vs}, final{vs[-1]}, {N//2}pairsandONEmiddle{mid}; requestedTOTAL{v}notlastday.'
    elif k=='reciprocal-of-one-plus-previous':
        initial=one(gs);N=number(r'(\d+)-мүшені',s);vs=[initial]
        for _ in range(N):vs.append(1/(1+vs[-1]))
        answer=pick(r,vs[N-1]);assert expr(r['options'][1])==vs[N-2]and expr(r['options'][2])==vs[N];assert '(1/(1 + u))'in s;note=f'ACTUALinitial{initial}, WHOLEdenominator1+u; exactchain{vs}, requestedINDEX{N}, preceding/followingactualtraps; universala/b→b/(a+b), no1/1+u precedenceerror.'
    elif k=='identify-geometric-decrease-rule':
        vs=ds;f=geometric(vs);assert f<1;flags=[]
        for o in r['options']:
            operand=D(m(r'(\d+(?:,\d+)?)',o)[1]);fn=(lambda x:x/operand)if'бөлу'in o else(lambda x:x*operand)if'көбейту'in o else(lambda x:x-operand)
            flags.append(all(fn(a)==b for a,b in zip(vs,vs[1:])))
        answer=one(o for o,ok in zip(r['options'],flags)if ok);note=f'ALLactual4values{vs}, exactratio{f}; EVERYoneof4writtenrules testedonALL3gaps, flags{flags}, nonconstantdifferencesrejectsingle-pairguess.'
    elif k=='doubling-decimal-target-index':
        first,target=ds;factor=number(r'алдыңғысының (\d+) есесі',s);vs=[first]
        while vs[-1]<target:vs.append(vs[-1]*factor)
        assert vs[-1]==target;answer=str(len(vs));note=f'ACTUALfirst{first},factor{factor},target{target}; fullmonotonechain{vs}, {len(vs)-1}multiplications→INDEX{len(vs)}.'
    elif k=='first-descending-member-strictly-below':
        vs=ds;step=progression(vs);threshold=number(r'рет (\d+) санынан',s);assert step<0;values=[vs[0]]
        while values[-1]>=threshold:values.append(values[-1]+step)
        assert values[-2]==threshold and all(v>=threshold for v in values[:-1]);answer=str(len(values));note=f'ALLactualprefixvalues{vs}, strictthreshold{threshold}, completedownwardchainuntilFIRSTbelow{values}; previousEQUALITYexcluded, STEPS{len(values)-1}vsINDEX{len(values)}.'
    elif k=='second-difference-decimal-next':
        vs=ds;gaps=[b-a for a,b in zip(vs,vs[1:])];second=progression(gaps);nextgap=gaps[-1]+second;answer=pick(r,vs[-1]+nextgap);assert expr(r['options'][1])==vs[-1]*2 and expr(r['options'][2])==vs[-1]+gaps[-1]and expr(r['options'][3])==vs[-1]+gaps[-2];note=f'ALLactualFIRSTdifferences{gaps}, constantSECONDdifference{second}, nextgap{nextgap}; next{answer}, double/lastgap/previousgaptraps actualverified.'
    elif k=='select-all-consecutive-fraction-differences':
        target=one(gs);candidates=[[expr(t)for t in o.split('; ')]for o in r['options']];gaps=[[b-a for a,b in zip(vs,vs[1:])]for vs in candidates];flags=[all(g==target for g in gap)for gap in gaps];answer=one(o for o,ok in zip(r['options'],flags)if ok);assert flags==[False,True,False,False];note=f'ALL16actualfractionMCQmembers, EVERY12adjacentgap:{gaps}; onlyrow2allTHREEgaps={target}, firstgaponlywouldalsoacceptrows1/4andisrejected.'
    elif k=='fraction-group-raw-representation-index':
        num,den=map(int,m(r'\((\d+)/(\d+)\) ЖАЗБАСЫНЫҢ',s).groups());assert 0<num<den;writings=[(n,d)for d in range(2,den+1)for n in range(1,d)];index=writings.index((num,den))+1;answer=str(index);assert writings.count((1,2))==1 and(2,4)in writings;assert sum(d-1 for d in range(2,den))+num==index;note=f'COMPLETEorderedRAW(n,d)writes throughden{den}, exacttarget({num},{den})index{index}; noFractiondedup, equal1/2and2/4remainTWOpositions.'
    elif k=='adjacent-proper-ratio-given-difference':
        target=one(gs);flags=[];gaps=[]
        for o in r['options']:
            a,b=map(int,m(r'(\d+)-мүше мен (\d+)-мүше',o).groups());assert b==a+1;gap=F(b,b+1)-F(a,a+1);gaps.append(gap);flags.append(gap==target)
        answer=one(o for o,ok in zip(r['options'],flags)if ok);assert flags==[True,False,False,False];assert target.numerator==1;den=target.denominator;valid=[n for n in range(1,den)if(n+1)*(n+2)==den];assert valid==[6];note=f'ALL4ACTUALorderedneighborpairs/gaps{gaps}. Universaldifference=[(n+1)^2−n(n+2)]/((n+1)(n+2))=1/((n+1)(n+2)); positiveproductincreasing, completeboundn<den{den}, unique{valid}.'
    elif k=='first-geometric-decimal-above-strict-threshold':
        first,factor=ds;threshold=number(r'Мәні (\d+) санынан',s);assert factor>1;values=[first]
        while values[-1]<=threshold:values.append(values[-1]*factor)
        answer=str(len(values));assert values[-2]<threshold<values[-1];note=f'ACTUALfirst{first},factor{factor},strictthreshold{threshold}, FULLexactunroundedchain{values}; allprior≤threshold, firstindex{len(values)}, notroundintermediate2.985984to3.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note
def main():
    assert len(ROWS)==44;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'ALL44saved/newfullconditions/official/newsolutions/everyMCQ manuallyread; ownACTUALPRINTED exactFraction sequence/domain/monotonicity/recurrence/fullenumeration oracle; noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['Fullsource/newconditions/official/newsolutions/everyMCQread','ACTUALprinteddata exactrational NminusONE/orderedpair/valuevsindex/count/strictendpointroles','ALLnaturalvalue/indexfinitebounds plusuniversalexcludedtails/monotonicity/coprimecriterion','EveryofferedformulaatALL4givenindices, everyconsecutivegap andchanged-distractorroles checked','Nativeproper/mixed/wholefractionbar syntax plusallrowSHA matchesJS']})
    assert len(refs)==44
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'301eecfb01c476f7','finding':'Preserve genuine mixed-denominator comparison/conversion/carry AND fourth wrong pair taking TWO steps on BOTH jumps (a6,a8), not only firstskip.','resolution':'Author changed ONLY row14; firstsnapshot/deepdiff6fields, secondsnapshotONLYsolution/options; other43identical. Finalcommon10 conversion, key3+7/10;4+1/10 andwrong4+1/10;4+9/10 independentlyreread/recalculated.'}],'scope':'ALL44source-addressedgrade5topic4.12nonvisualfractiondecimalsequences','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':44,'wrongKeysRejected':44,'hashesMatched':44,'sourceRefs':44,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
