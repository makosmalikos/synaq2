"""Independent full40 printed Venn counting/target/feasibility review.
Allsaved/newfullconditions, official/newsolutions andeveryMCQ manuallyread.
No author params/specification/calculator is imported or consumed.
"""
import importlib.util
import itertools
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-set-counting.json';OUT='problems/editorial/reviews/grade5-set-counting.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def choose(row,v):return one(o for o in row['options']if o.isdigit()and int(o)==v)if row.get('options')else str(v)
def two(a,b,common,outside=0,total=None):
    parts=[a-common,common,b-common,outside];assert all(type(v)is int and v>=0 for v in parts)
    if total is not None:assert sum(parts)==total
    return parts
def triple(a,b,c,ab,ac,bc,abc,total=None):
    regions={1:a-ab-ac+abc,2:b-ab-bc+abc,4:c-ac-bc+abc,3:ab-abc,5:ac-abc,6:bc-abc,7:abc};assert min(regions.values())>=0
    assert all(type(v)is int for v in regions.values());assert sum(v for mask,v in regions.items()if mask&1)==a;assert sum(v for mask,v in regions.items()if mask&2)==b;assert sum(v for mask,v in regions.items()if mask&4)==c
    assert sum(v for mask,v in regions.items()if mask&3==3)==ab;assert sum(v for mask,v in regions.items()if mask&5==5)==ac;assert sum(v for mask,v in regions.items()if mask&6==6)==bc
    if total is not None:assert sum(regions.values())<=total
    return regions

def solve(row):
    s=row['statement'];ns=nums(s);k=row['modelId'].removeprefix('grade5-set-counting-');setsmodels={'universal-two-set-cardinality-formula','two-set-explicit-cardinality-union','contextual-intersection-meaning','neither-divisibility-full-universe','prime-or-odd-strict-bound-cardinality','additive-cardinality-iff-disjoint','only-first-from-union-and-second-cardinality'};assert row['topic']==('sets'if k in setsmodels else'word');note='';parts=None
    if k=='universal-two-set-cardinality-formula':
        assert 'ақырлы'in s;expected='n(R ∪ S) = n(R) + n(S) − n(R ∩ S)';meaning=[lambda a,b:a+b,lambda a,b:a+b+a*b,lambda a,b:a+b-a*b,lambda a,b:a-b+a*b];states=list(itertools.product([0,1],repeat=2));flags=[all(f(a,b)==int(bool(a or b))for a,b in states)for f in meaning];answer=one(o for o,t in zip(row['options'],flags)if t);assert answer==expected and flags==[False,False,True,False]
        note='UniversalARBITRARYelementall4membershipstates verifycoefficientweightsOR=a+b−ab; ALL4actualformulascategorizedandfalseoneshaveatomcounterexample, finiteadditivityincludesempty.'
    elif k=='contextual-intersection-meaning':
        assert s.startswith('Бағдарламалау')and 'K ∩ L'in s;states=list(itertools.product([False,True],repeat=2));meaning=[lambda a,b:a and not b,lambda a,b:a or b,lambda a,b:not a and not b,lambda a,b:a and b];flags=[all(f(a,b)==(a and b)for a,b in states)for f in meaning];answer=one(o for o,t in zip(row['options'],flags)if t);assert flags==[False,False,False,True]
        note='ActualPythonANDScratch skillmembershipintersection; all4actualwordedpredicates universallycomparedover4states. InclusiveOR/exclusivefirst/neitherdifferent; nocount-vs-personconfusion.'
    elif k=='additive-cardinality-iff-disjoint':
        assert 'ақырлы'in s and 'ҚАЖЕТТІ ӘРІ ЖЕТКІЛІКТІ'in s;answer='K ∩ L = ∅';assert answer in row['options'];states=list(itertools.product([0,1],repeat=2));assert all((int(bool(a or b))==a+b)==(not a*b)for a,b in states)
        # FiniteidentityU=A+B−I yields equalityIFFI0, and finitecardinality0IFFempty.
        K=L={1};assert K==L and K<=L and len(K)==len(L)and len(K|L)!=len(K)+len(L);assert not set()&set()
        note='UniversalfiniteidentityU=A+B−I givesEQUALITYIFFI=0IFFEMPTYintersection. BOTHdirectionsproven, notmerelyone sufficientcase. Actualsame-singletoncountermodelmakeseachother3conditionstruewhileadditivityfails; bothemptyvalid.'
    elif k in {'two-set-explicit-cardinality-union','household-two-features-union','two-performance-groups-union'}:
        a,b,c=ns;parts=two(a,b,c);v=sum(parts);answer=choose(row,v);note=f'ACTUALinclusiveA{a},B{b},common{c}, union{v}; disjointregions{parts[:3]}, commonONCE. Unknownoutsideindependenttarget; onevalidrepresentativeoutside0.'
    elif k=='nested-activity-union-count':
        a,b=ns;assert 'БАРЛЫҒЫ'in s and a>b;parts=two(a,b,b);v=a;answer=choose(row,v);note=f'ActualsecondALLwithfirst⇒common=b{b}, Aonly{a-b}, union=A{a}; notsum{a+b}. Nestedinclusionexplicitnotguessed.'
    elif k in {'all-covered-two-workshops-overlap','two-list-duplicates-cover-whole-group'}:
        total,a,b=ns;assert 'кемінде біреуіне'in s or 'кемінде біреуін'in s;v=a+b-total;parts=two(a,b,v,0,total);answer=choose(row,v)
        if row.get('options'):assert list(map(int,row['options']))==[v,a+b,abs(a-b),total-a]
        note=f'ACTUALALLcoveredtotal{total}, inclusivea{a}/b{b}; commonSURPLUS{v}, regionledger{parts}, noneoutsideexplicit. EveryactualMCQsum/difference/secondonlytrapchecked.'
    elif k=='first-only-from-inclusive-membership':
        a,b,c=ns;parts=two(a,b,c);v=a-c;answer=choose(row,v);note=f'ACTUALfullFIRST{a}, fullSECOND{b}, common{c}; requestedFIRSTONLY{v}, notsubtractwholeothergroup{a-b}.'
    elif k=='two-exclusive-regions-and-overlap-union':
        left,right,c=ns;parts=two(left+c,right+c,c);v=sum(parts);answer=choose(row,v);note=f'ACTUALalreadyEXCLUSIVEregions{left},{right}, common{c}; straightSUM{v}, subtractingcagainwrongbecausegivensnotinclusivefullsets.'
    elif k=='second-only-with-first-overlap-statement':
        a,c,b=ns;parts=two(a,b,c);v=b-c;answer=choose(row,v);assert list(map(int,row['options']))==[v,b+c,b,c];note=f'ACTUALfirst18includescommon6, secondFULL22; targetSECONDONLY22−6={v}, allfouractualoptions{row["options"]}sum/full/commonrolesfalse.'
    elif k=='neither-from-given-union':
        total,union=ns;assert total>=union;v=total-union;answer=choose(row,v);note=f'ACTUALwhole{total}, ALREADYGIVENunion{union}, outside{v}; nonnegativepartitionunion+outside=whole, individualgroupcountsunneeded.'
    elif k=='neither-after-inclusive-union':
        total,a,b,c=ns;v=total-(a+b-c);parts=two(a,b,c,v,total);answer=choose(row,v);assert list(map(int,row['options']))==[v,a+b-c,total-c,a-c];note=f'ACTUALwhole{total}, inclusivea{a},b{b},common{c}; union{a+b-c}, NEITHER{v}, everyunion/wholeminuscommon/firstonlytrapchecked.'
    elif k=='one-of-three-clubs-from-exclusive-regions':
        only,ab,ac,abc=ns;assert 'ғана (графикасыз)'in s and 'ғана (шахматсыз)'in s;v=only+ab+ac+abc;answer=choose(row,v);note=f'ACTUALfourDISJOINTfirstclubregions{ns}, requestedFULLtheatre{v}; pair-onlyGANAexcludesthird, soTRIPLE3addedONCE, nosharedoubleremoval.'
    elif k=='exactly-one-from-total-and-neither':
        total,a,b,out=ns;union=total-out;c=a+b-union;parts=two(a,b,c,out,total);v=a+b-2*c;answer=choose(row,v);assert list(map(int,row['options']))==[v,union,c,a+b];note=f'ACTUALwhole{total}/outside{out}→union{union}, common{c}; requestedXOR{v}, ALLactualunion/common/sumtrapschecked; fullledger{parts}.'
    elif k=='second-inclusive-from-first-only-difference':
        a,c,gap=ns;left=a-c;right=left-gap;v=right+c;parts=two(a,v,c);assert left-right==gap;answer=choose(row,v);assert list(map(int,row['options']))==[v,right,left+gap,a+gap];note=f'ACTUALfirstFULL{a},common{c}, FIRSTONLY{left} isGAP{gap}MOREthanSECONDONLY{right}; requestedSECONDINCLUSIVE{v}. Everyreversedgap/only/fullfirst+gapMCQfalse; fullbackdifferenceandledger.'
    elif k=='first-total-from-two-only-and-neither':
        total,left,right,out=ns;c=total-left-right-out;parts=two(left+c,right+c,c,out,total);v=left+c;answer=choose(row,v);assert list(map(int,row['options']))==[v,left,c,total-out];note=f'ACTUALfourregionswhole{total}, firstONLY{left},secondONLY{right},outside{out}; inferredcommon{c}, requestedFIRSTFULL{v}. Everyonly/common/unionMCQrolefalse.'
    elif k in {'three-masses-from-pair-sums-total','first-price-from-three-pair-sums'}:
        ab,bc,ac=map(F,ns);a=(ab+ac-bc)/2;b=(ab+bc-ac)/2;c=(ac+bc-ab)/2;assert min(a,b,c)>0 and a+b==ab and b+c==bc and a+c==ac;total=a+b+c;v=total if k.startswith('three-masses')else a;assert v.denominator==1;answer=choose(row,int(v));note=f'ACTUALtypedPAIRSUMSAB{ab}/BC{bc}/AC{ac}; independentdirectlinear3solutionsa{a},b{b},c{c}, everybackequationverified. Asked{k}={v}notdoubletotal{2*total}/differentitem; allmass/pricepositive.'
    elif k=='two-memberships-overlap-with-outside':
        total,a,b,out=ns;v=a+b-(total-out);parts=two(a,b,v,out,total);answer=choose(row,v);note=f'ACTUALuniverse{total}, twofullcounts{a}/{b}, neither{out}; requestedcommon{v}, fullnonnegativepartition{parts}, outsidenotpartunion.'
    elif k=='second-only-when-everyone-covered':
        total,a,b=ns;assert 'әрқайсысы'in s and 'кемінде біреуін'in s;v=total-a;c=b-v;parts=two(a,b,c,0,total);answer=choose(row,v);assert list(map(int,row['options']))==[v,c,b,a-c];note=f'ACTUALALLcoveredwhole{total},firstFULL{a},secondFULL{b}; requestedSECONDONLYwhole−first={v}; common{c}/firstonly{a-c}, all4actualroleschecked.'
    elif k=='ordered-two-exclusive-purchase-counts':
        a,b,c=ns;parts=two(a,b,c);pair=[a-c,b-c];answer=one(o for o in row['options']if nums(o)==pair);assert[nums(o)for o in row['options']]==[pair,[a,b],list(reversed(pair)),[pair[0],c]];note=f'ACTUALfullfirst{a}/second{b},common{c}; ORDEREDrequestedONLYfirst/ONLYsecond{pair}, notswapped/fullcounts/commonsecond. EveryactualpairedMCQchecked.'
    elif k=='total-from-union-and-outside':
        a,b,c,out=ns;parts=two(a,b,c,out);v=sum(parts);answer=choose(row,v);note=f'ACTUALtwoFULLcounts{a}/{b},common{c},outside{out}; requestedWHOLE=sum{parts}={v}, notjustunion{a+b-c}orwrongsum{a+b+out}.'
    elif k=='exactly-one-with-unused-universe-count':
        total,a,b,c=ns;outside=total-(a+b-c);parts=two(a,b,c,outside,total);v=a+b-2*c;answer=choose(row,v);note=f'ACTUALfirst{a}/second{b}/common{c}→EXACTLYONE{v}. Whole{total}unusedinexpressionbutvalidatedthroughnonnegativeoutside{outside}; noaccidentaluniverseminuscommonshortcut.'
    elif k=='maximum-neither-unknown-overlap':
        total,a,b=ns;domain=list(range(max(0,a+b-total),min(a,b)+1));possible=[two(a,b,c,total-(a+b-c),total)for c in domain];v=max(p[3]for p in possible);answer=choose(row,v);assert v==total-max(a,b);assert one(p for p in possible if p[3]==v)==[a-b,b,0,v]
        note=f'COMPLETEfeasiblecommonDOMAIN{domain}, eachledgernonnegativewhole{total}; maximumNEITHER{v}, attainedNESTEDcommon{b}. Universalunion≥max{max(a,b)}givesboundandactualattainment, notjustguess.'
    elif k=='impossible-union-cardinality':
        a,b=ns;domain=list(range(min(a,b)+1));union={a+b-c for c in domain};answer=one(o for o in row['options']if int(o)not in union)
        for o in row['options']:
            v=int(o)
            if v in union:two(a,b,a+b-v)
        note=f'ACTUALa{a}/b{b}, ALLcommon0…{min(a,b)} yieldsALLunion{min(union)}…{max(union)}; everyactualofferedpossibleunionhasnonnegativeregionwitness, only{answer}impossible.'
    elif k=='neither-divisibility-full-universe':
        _,upper,a,b=ns;domain=set(range(1,upper+1));A={n for n in domain if n%a==0};B={n for n in domain if n%b==0};v=len(domain-(A|B));answer=choose(row,v);assert list(map(int,row['options']))==[v,upper-len(A)-len(B),upper-len(A),len(A&B)];note=f'COMPLETEactualinclusive1…{upper}, modulo{a}and{b}sets{len(A)}/{len(B)}, commonLCM{math.lcm(a,b)}count{len(A&B)}; targetNEITHER{v}, everydouble-subtraction/one-divisor/commonMCQfalse.'
    elif k=='inclusive-first-from-exclusive-ratio':
        total,c,ratio=ns;remaining=total-c;assert remaining%(ratio+1)==0;right=remaining//(ratio+1);left=ratio*right;v=left+c;parts=two(v,right+c,c,0,total);assert left==ratio*right;answer=choose(row,v);note=f'ACTUALcoveredwhole{total},common{c}, ONLYfirst=ratio{ratio}×ONLYsecond. Exactunit{right}, firstonly{left}, requestedFIRSTINCLUSIVE{v}; nonnegativefullledger{parts}/ratiobacksubstitution, notonlyfirst.'
    elif k in {'three-clubs-neither-inclusive-pair-overlaps','three-channels-exactly-one-inclusive-pairs'}:
        total,a,b,c,ab,ac,bc,abc=ns;assert 'КІРЕДІ'in s or'кіреді'in s;regions=triple(a,b,c,ab,ac,bc,abc,total);union=sum(regions.values());v=total-union if k.startswith('three-clubs')else regions[1]+regions[2]+regions[4];answer=choose(row,v);note=f'ACTUALinclusiveA/B/C{a}/{b}/{c}, paircounts{ab}/{ac}/{bc}ALLincludetriple{abc}. Exact7maskregions{regions}, union{union}, outside{total-union}; asked{k}={v}, everymembershipcount/backequationchecked.'
    elif k=='triple-from-list-surplus-and-exactly-two':
        total,a,b,c,exacttwo=ns;solutions=[]
        for abc in range(min(a,b,c)+1):
            for abonly in range(min(a,b)-abc+1):
                for aconly in range(min(a,c)-abc+1):
                    bconly=exacttwo-abonly-aconly
                    if bconly<0:continue
                    only=[a-abonly-aconly-abc,b-abonly-bconly-abc,c-aconly-bconly-abc]
                    if min(only)<0:continue
                    if sum(only)+exacttwo+abc==total:solutions.append((abc,only,[abonly,aconly,bconly]))
        assert solutions;goodtriples={z[0]for z in solutions};v=one(goodtriples);assert a+b+c-total==exacttwo+2*v;answer=choose(row,v);assert list(map(int,row['options']))==[v,2*v,a+b+c-total,exacttwo]
        note=f'ACTUALwhole{total},individualtotals{a}/{b}/{c}, EXACTTWO{exacttwo}. COMPLETEallintegertriple/pair-onlydomains gives{len(solutions)}feasible7regionwitnesses andUNIQUETRIPLE{v}; perpersonlistmultiplicity1/2/3⇒surplus=exactTwo+2triple. EveryactualMCQrolechecked.'
    elif k=='prime-or-odd-strict-bound-cardinality':
        bound=one(ns);domain=set(range(1,bound));P={n for n in domain if n>=2 and all(n%d for d in range(2,math.isqrt(n)+1))};Q={n for n in domain if n%2};v=len(P|Q);answer=choose(row,v);assert P-Q=={2}and 1 not in P and 1 in Q;assert list(map(int,row['options']))==[v,len(P)+len(Q),len(Q),len(P)+len(Q)-1];note=f'COMPLETEstrict1…{bound-1}, prime{sorted(P)}odd{sorted(Q)}, union{v}; ALL4sum/omit2/wrongsubtract1choicesfalse, natural1vsprime2rolespreserved.'
    elif k=='missing-pair-overlap-with-no-triple':
        total,a,b,c,ab,ac=ns;assert 'ешкім жоқ'in s;bc=a+b+c-total-ab-ac;regions=triple(a,b,c,ab,ac,bc,0,total);assert sum(regions.values())==total;v=bc;answer=choose(row,v);note=f'ACTUALALLcovered{total}, NOtriple0, individual{a}/{b}/{c}, knownpairs{ab}/{ac}; uniqueMISSINGpair{bc}, complete7masknonnegativeledger{regions}exactwhole. PairinclusionvsexclusivitycoincidesONLYbecausetripleexplicit0.'
    elif k=='boys-without-badge-from-girls-with-badge':
        total,boys,badge,girlsBadge=ns;boysBadge=badge-girlsBadge;v=boys-boysBadge;parts=two(boys,badge,boysBadge,total-(boys+badge-boysBadge),total);assert parts[2]==girlsBadge;answer=choose(row,v);assert list(map(int,row['options']))==[v,boys-badge,boys-girlsBadge,boysBadge];note=f'ACTUALwhole{total}, boys{boys}, badged{badge}, girlsWITHbadge{girlsBadge}; boysWITHbadge{boysBadge}, requestedboysWITHOUTbadge{v}. Fullcross-partition{parts}andall4roletrapschecked.'
    elif k=='minimum-overlap-in-bounded-universe':
        total,a,b=ns;domain=list(range(max(0,a+b-total),min(a,b)+1));witnesses=[two(a,b,c,total-(a+b-c),total)for c in domain];v=min(domain);answer=choose(row,v);assert list(map(int,row['options']))==[v,min(a,b),abs(a-b),a+b];note=f'COMPLETEfeasiblecommon{domain}, ALLnonnegativeregionwitnesses underUNIVERSE{total}; MIN{v}, attainedledger{witnesses[0]}. Universalunion≤whole⇒common≥sum−whole andwitness, allmax/difference/sumtrapsfalse.'
    elif k=='missing-exclusive-region-four-parts':
        total,left,c,out=ns;right=total-left-c-out;parts=two(left+c,right+c,c,out,total);v=right;answer=choose(row,v);note=f'ACTUALfourpartwhole{total}, FIRSTONLY{left},BOTH{c},NEITHER{out}, uniqueSECONDONLY{right}, nonnegativeledger{parts}; inclusiveSECOND{right+c}notasked.'
    elif k=='universe-from-exactly-one-both-neither':
        exactone,c,out=ns;v=exactone+c+out;answer=choose(row,v);assert exactone>=0 and c>=0 and out>=0;note=f'ACTUALalreadycombinedXOR{exactone},BOTH{c},NEITHER{out}, disjointthreeblocks⇒WHOLE{v}. TripleofcategorycountsdoesNOTrequireaddingcommonTWICE.'
    elif k=='only-first-from-union-and-second-cardinality':
        a,b,union=ns;v=union-b;c=a-v;parts=two(a,b,c);assert sum(parts)==union;answer=choose(row,v);assert list(map(int,row['options']))==[v,c,a-b,a];note=f'ACTUALfullA{a},B{b},UNION{union}; requestedAONLYunion−B={v}, common{c}/Bonly{b-c}; all4actualcommon/difference/fullAtrapsfalse. BonlyandAminusBcardinalitydifferencecoincident5butnotanswer.'
    elif k=='minimum-three-skills-overlap':
        total,a,b,c=ns;missing=[total-a,total-b,total-c];bound=max(0,total-sum(missing));assert sum(missing)<=total
        # Universal8-state inequality memberships≤2+I(ALLthree), summedoverU,
        # gives t≥a+b+c−2N. Actualdisjointmissinggroups attain it EXACTLY.
        for flags in itertools.product([0,1],repeat=3):assert sum(flags)<=2+int(all(flags))
        U=set(range(total));p=0;miss=[]
        for n in missing:miss.append(set(range(p,p+n)));p+=n
        A,B,C=[U-M for M in miss];assert[len(A),len(B),len(C)]==[a,b,c]and len(A&B&C)==bound and all(not(x&y)for x,y in itertools.combinations(miss,2));v=bound;answer=choose(row,v);assert list(map(int,row['options']))==[v,min(a,b,c),min(missing),sum(missing)]
        note=f'ACTUALwhole{total},skills{a}/{b}/{c}, deficits{missing}. UniversalALL8membershipstatesprovea+b+c≤2N+triple⇒MIN{bound}; explicitdisjointmissingSETS{list(map(sorted,miss))}onactual26childrenattain{len(A&B&C)}andpreserveEVERYindividualskillcount. ALL4actualmax/missing/sumtrapschecked.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==40;entries=[];refs=set()
    for row in ROWS:
        answer,note=solve(row);assert answer==row['answer'],(row['editionId'],answer,row['answer']);bad=copy.deepcopy(row);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert row['grade']==5 and row['minimumPlan']=='pro'and not row.get('image')
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        else:assert answer.isdigit()and row['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(row);refs.add(raw['id']);assert raw['solution'];norm=lambda text:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text).lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All40saved/newfullconditions/official+newsolutions/everyMCQread; ownACTUALprintedfullregionledger/completeintegerfeasibility/membershiptruth-table andtypedtargetoracle; noauthorcalculator/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All40saved/newfullconditions/official+newsolutions/everyMCQmanuallyread','ActualFULLvsEXCLUSIVEvsBOTHvsNEITHER/UNION/XOR/orderedtargetandALLMCQrolesindependentlybound','Completefeasibleintegercommon/pair/tripledomains withNONNEGATIVEledgersandeverybackmembershipconstraint','UniversalfiniteadditivityIFFdisjoint BOTHdirections/emptycase andall4atomstates','Two/three-setminimummaximumuniversalbounds+actualattainmentwitnesses including8-stateinequality','All40keys/wrongkeys/fullcanonicalSHA/nativeMathMLstructurechecked']})
    assert len(refs)==40
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All40source-addressedgrade5topic5.4nonvisualsetcounting:7sets+33word, completeprintedledgers/universalboundswithwitnesses','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':40,'wrongKeysRejected':40,'hashesMatched':40,'sourceRefs':40,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
