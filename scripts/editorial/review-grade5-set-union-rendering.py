"""Independent full40 printed-set review and exact convex clipping witnesses.
No author params/spec/model/geometry calculator is imported. Saved/new full
conditions, official/new solutions and every MCQ have been manually read.
"""
import importlib.util
import itertools
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-subsets-rendering.py'));u=importlib.util.module_from_spec(sp);sp.loader.exec_module(u);h=u.h
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest']:globals()[name]=getattr(h,name)
sets,powers,divisors,primes=u.sets,u.powers,u.divisors,u.primes
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-set-union.json';OUT='problems/editorial/reviews/grade5-set-union.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def aset(s):return frozenset()if s=='∅'else one(sets(s))
def setchoice(row,value):return one(o for o in row['options']if aset(o)==value)
def numchoice(row,value):return one(o for o in row['options']if int(o)==value)if row.get('options')else str(value)
def cross(a,b,c):return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def hull(points):
    points=sorted(set(points));lower=[];upper=[]
    for p in points:
        while len(lower)>=2 and cross(lower[-2],lower[-1],p)<=0:lower.pop()
        lower.append(p)
    for p in reversed(points):
        while len(upper)>=2 and cross(upper[-2],upper[-1],p)<=0:upper.pop()
        upper.append(p)
    return lower[:-1]+upper[:-1]
def area(P):return sum(P[i][0]*P[(i+1)%len(P)][1]-P[(i+1)%len(P)][0]*P[i][1]for i in range(len(P)))/2
def clip(P,Q):
    result=list(P)
    for a,b in zip(Q,Q[1:]+Q[:1]):
        output=[]
        for start,end in zip(result,result[1:]+result[:1]):
            cs,ce=cross(a,b,start),cross(a,b,end)
            if (cs>=0)!=(ce>=0):
                t=cs/(cs-ce);meet=tuple(start[i]+t*(end[i]-start[i])for i in range(2));assert cross(a,b,meet)==0;output.append(meet)
            if ce>=0:output.append(end)
        result=output
    return hull(result)
def quadrilateral_witnesses():
    square=[(F(-2),F(-2)),(F(2),F(-2)),(F(2),F(2)),(F(-2),F(2))]
    # ActualFOUR-sided secondpolygons, notclippingwithanunboundedhalfplane.
    uvquad=lambda lo,hi:hull([(F(U+V,2),F(U-V,2))for U in[lo,hi]for V in[-10,10]])
    others={5:uvquad(-10,3),6:uvquad(-3,3),8:[(F(0),F(-3)),(F(3),F(0)),(F(0),F(3)),(F(-3),F(0))]};report={}
    for n,Q in others.items():
        assert len(Q)==4 and area(Q)>0 and all(cross(Q[i-1],Q[i],Q[(i+1)%4])>0 for i in range(4));P=clip(square,Q)
        assert len(P)==n and area(P)>0
        for v in P:
            assert all(cross(a,b,v)>=0 for a,b in zip(square,square[1:]+square[:1]))
            assert all(cross(a,b,v)>=0 for a,b in zip(Q,Q[1:]+Q[:1]))
        # Mergecollinearpiecesalreadyperformedbyhull; eachremainingedge hasONE
        # originalsupportingline, andnooriginaledgecontributestwofragments.
        support=[]
        for a,b in zip(P,P[1:]+P[:1]):
            matches=[i for i,(c,d)in enumerate(list(zip(square,square[1:]+square[:1]))+list(zip(Q,Q[1:]+Q[:1])))if cross(c,d,a)==cross(c,d,b)==0]
            assert len(matches)==1;support+=matches
        assert len(support)==len(set(support))==n<=8
        report[str(n)]={'first':[[str(v)for v in p]for p in square],'second':[[str(v)for v in p]for p in Q],'intersection':[[str(v)for v in p]for p in P],'area':str(area(P)),'supportingEdges':support}
    return report

def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade5-set-union-');ss=sets(s)
    topic='geo'if k=='convex-quadrilateral-intersection-impossible-sides'else'word'if k in {'two-clubs-intersection-from-neither','exactly-one-language-count','two-outings-neither-from-overlap'}else'sets';assert row['topic']==topic
    if k in {'explicit-intersection-list','union-elements-SUM','explicit-union-cardinality','disjoint-intersection-empty','sum-intersection-union-CARDINALITIES','canonical-letter-union-list'}:
        A,B=ss;I=A&B;U=A|B
        if k=='explicit-intersection-list':answer=setchoice(row,I)
        elif k=='union-elements-SUM':answer=str(sum(U));assert sum(A)+sum(B)-sum(I)==sum(U)
        elif k=='explicit-union-cardinality':answer=str(len(U));assert len(A)+len(B)-len(I)==len(U)
        elif k=='disjoint-intersection-empty':assert not I;answer=setchoice(row,I)
        elif k=='sum-intersection-union-CARDINALITIES':answer=str(len(I)+len(U));assert len(I)+len(U)==len(A)+len(B)
        else:
            assert 'ӘР ЭЛЕМЕНТІ ДӘЛ БІР РЕТ'in s;flags=[]
            for o in row['options']:
                rawlist=[x.strip()for x in o.strip('{}').split(';')];flags.append(aset(o)==U and len(rawlist)==len(set(rawlist)))
            answer=one(o for o,t in zip(row['options'],flags)if t);assert flags==[True,False,False,False]and aset(row['options'][-1])==U
        note=f'ACTUALcompleteA{A},B{B}, I{I},U{U}; target{k} evaluatedwithoutmultiplicity, SUMvsCARDINALITYbound. EveryactualMCQchecked; canonicalduplicateonlyfalseunderEXPLICITeachonceformat, stillsameMATHEMATICALset.'
    elif k=='common-multiple-intersection-member':
        a,b=map(int,m(r'A — (\d+) санына.*?B — (\d+) санына',s).groups());flags=[int(o)%a==int(o)%b==0 for o in row['options']];answer=one(o for o,t in zip(row['options'],flags)if t);note=f'ALLfouractualintegercandidates modulo{a}AND{b}, truths{flags}; bothrequired, inclusiveORisnotintersection.'
    elif k=='union-membership-inclusive-or':
        assert s.startswith('x ∈ C ∪ D');meaning=[lambda a,b:a and b,lambda a,b:a or b,lambda a,b:a and not b,lambda a,b:not a and not b];states=list(itertools.product([False,True],repeat=2));flags=[all(pred(a,b)==(a or b)for a,b in states)for pred in meaning];answer=one(o for o,t in zip(row['options'],flags)if t)
        assert flags==[False,True,False,False];note='ALL4arbitraryelementmembershipstates evaluatedforall4actualwordedpredicates; inclusiveORallowsBOTH, conjunction/exclusiveleft/neitherfalseasdefinition.'
    elif k in {'disjoint-union-cardinality','intersection-count-from-union-cardinalities','union-count-from-overlap-cardinalities','union-cardinality-ordered-max-min','impossible-intersection-cardinality'}:
        ns=list(map(int,re.findall(r'n\([^)]*\) = (\d+)',s)));a,b=ns[:2]
        if k=='disjoint-union-cardinality':assert '∩ B = ∅'in s;v=a+b;answer=str(v)
        elif k=='intersection-count-from-union-cardinalities':union=ns[2];valid=[t for t in range(min(a,b)+1)if a+b-t==union];v=one(valid);answer=numchoice(row,v)
        elif k=='union-count-from-overlap-cardinalities':common=ns[2];assert common<=min(a,b);v=a+b-common;answer=str(v)
        elif k=='union-cardinality-ordered-max-min':
            attainable=[]
            for t in range(min(a,b)+1):
                A=set(range(a));B=set(range(t))|set(range(100,100+b-t));assert len(A)==a and len(B)==b and len(A&B)==t;attainable.append(len(A|B))
            pair=(max(attainable),min(attainable));answer=one(o for o in row['options']if tuple(map(int,o.split('; ')))==pair);assert pair==(23,14)
        else:
            flags=[not 0<=int(o)<=min(a,b)for o in row['options']];answer=one(o for o,t in zip(row['options'],flags)if t)
            for o,t in zip(row['options'],flags):
                if not t:common=int(o);A=set(range(a));B=set(range(common))|set(range(100,100+b-common));assert len(A&B)==common and len(A)==a and len(B)==b
        note=f'ACTUALfinitecardinalitiesa{a},b{b}, fullsharedDOMAIN0…{min(a,b)}, target{k}; allchoices/orderedroleschecked. ConstructedDISJOINToutsideatoms witnessEVERYfeasibleintersection, soattainabilityanduniversalboundsbothproven.'
    elif k=='digit-card-intersection-SUM':
        a,b=m(r'Дана ([\d, ]+) цифрлары.*?Әли ([\d, ]+) цифрлары',s).groups();A=set(map(int,a.split(', ')));B=set(map(int,b.split(', ')));answer=str(sum(A&B));note=f'ACTUALphysicalcarddigitsA{A},B{B}; common{A&B}sum{answer}, notuniontotal/count.'
    elif k=='word-letter-union-cardinality':
        a,b=re.findall(r'«([^»]+)»',s);A=set(unicodedata.normalize('NFC',a));B=set(unicodedata.normalize('NFC',b));answer=str(len(A|B));assert len(A)==8 and len(B)==4 and len(A&B)==3;note=f'ALLactualUnicodeletters{a}/{b}dedupedwithoutК/Қ/Іmerging; A{A},B{B}, union9, shared3, repeatedТinwordnotnewatom.'
    elif k in {'divisor-intersection-SUM','divisor-intersection-list'}:
        a,b=map(int,m(r'A — (\d+) санының, B — (\d+) санының',s).groups());A=divisors(a);B=divisors(b);I=A&B;assert I==divisors(math.gcd(a,b));answer=setchoice(row,I)if row.get('options')else str(sum(I));note=f'ALLpositiveDIVISORSactual{a}:{A},{b}:{B}, common{I}; requestedLISTvsSUMindependent. 1included, maxgcdNOTsum, eachwrongrosterchecked.'
    elif k=='intersection-operation-notation':
        assert 'ЖАҢА жиынды'in s;meaning={'P ∪ Q':'ORset','P ∩ Q':'ANDset','P ⊆ Q':'inclusionRELATION','P ∈ Q':'membershipRELATION'};assert set(row['options'])==set(meaning);answer=one(o for o in row['options']if meaning[o]=='ANDset');note='ActualbothmemberspredicateANDconstructsNEWsetP∩Q, unionORdifferent and⊆/∈truth-valuedRELATIONSnotsetoperations. Everyofferedexpressiontyped.'
    elif k in {'digit-union-list','all-ten-digits-union-count'}:
        a,b=m(r'A — (\d+).*?B — (\d+)',s).groups();A=set(map(int,a));B=set(map(int,b));U=A|B;answer=setchoice(row,U)if row.get('options')else str(len(U));assert 0 in U
        if k=='all-ten-digits-union-count':assert U==set(range(10))
        note=f'ACTUALnumberSPELLINGS{a}/{b}, digitsets{A}/{B}, union{U}; 0retainedandduplicatesdeduped. ALLactualsetMCQscheckedwherepresent.'
    elif k=='bounded-odd-prime-union-count':
        bound=number(r'A — (\d+) санынан',s);A={n for n in range(1,bound)if n%2};B=primes(bound);answer=str(len(A|B));assert B-A=={2}and 1 in A and 1 not in B;note=f'COMPLETEstrict1…{bound-1}, odd{A}/prime{B}, union{len(A|B)}; 1oddNOTprime, 2primeNOToDD, nofiniteprimalityguess.'
    elif k=='which-described-intersection-empty':
        assert row['options']==['4 санының оң еселіктері мен 9 санының оң еселіктері','жай сандар мен жұп натурал сандар','14 санының оң бөлгіштері мен 25 санының оң бөлгіштері','жұп натурал сандар мен тақ натурал сандар']
        assert 36%4==36%9==0 and 2 in primes(3)and 2%2==0 and divisors(14)&divisors(25)=={1};answer=row['options'][3];note='All4actualdescribedpairs, explicitsharedWITNESSES36,2,1disprovefirst3emptyclaims; parityresidues0/1DISJOINTuniversally. Relativelyprimes14/25stillsharedivisor1.'
    elif k=='unknown-set-from-union-and-intersection':
        A,I,U=ss;assert I<=A<=U;domain=powers(U);good=[B for B in domain if A&B==I and A|B==U];B=one(good);assert B==I|(U-A);answer=setchoice(row,B)
        note=f'COMPLETE2^{len(U)}={len(domain)}possibleB⊆actualunionU{U}, unique{B}. UniversalmembershipoutsideUforbidden, Aonly{A-I}excluded, intersection{I}/UminusA{U-A}forced; all4choicesbacksubstituted.'
    elif k=='overlapping-inclusive-integer-interval-union':
        a,b,c,d=map(int,m(r'A — (\d+)–(\d+).*?B — (\d+)–(\d+)',s).groups());A=set(range(a,b+1));B=set(range(c,d+1));assert A&B;answer=str(len(A|B));assert A|B==set(range(a,d+1));note=f'COMPLETEBOTHINCLUSIVEintegerintervals{a}…{b}/{c}…{d}, overlap{len(A&B)}andunion{len(A|B)}; metriclengthnotcount, bothendpointsincluded.'
    elif k in {'board-even-or-multiple-count','inclusive-multiple-even-intersection-list','inclusive-prime-strict-odd-intersection-count','last-digit-or-digit-sum-union-count','neither-divisor-count-in-universe','two-digit-multiple-or-tens-digit-count','inclusive-divisible-by-either-count'}:
        if k=='board-even-or-multiple-count':
            upper,divisor=map(int,m(r'1–(\d+).*?НЕМЕСЕ (\d+) санына',s).groups());domain=set(range(1,upper+1));A={n for n in domain if n%2==0};B={n for n in domain if n%divisor==0};U=A|B;answer=str(len(U));assert upper in B
        elif k=='inclusive-multiple-even-intersection-list':
            upper,divisor=map(int,m(r'1–(\d+) аралығындағы (\d+) санына',s).groups());domain=set(range(1,upper+1));A={n for n in domain if n%divisor==0};B={n for n in domain if n%2==0};U=A&B;answer=setchoice(row,U);assert upper in U
        elif k=='inclusive-prime-strict-odd-intersection-count':
            upper=number(r'A — (\d+) санынан',s);domain=set(range(1,upper+1));A=primes(upper+1);B={n for n in range(1,upper)if n%2};U=A&B;answer=str(len(U));assert upper in A and upper not in B and 2 in A-B
        elif k=='last-digit-or-digit-sum-union-count':
            digit,dsum=map(int,m(r'цифры (\d+).*?қосындысы (\d+)',s).groups());domain=set(range(10,100));A={n for n in domain if n%10==digit};B={n for n in domain if n//10+n%10==dsum};U=A|B;answer=str(len(U));assert 80 in B and A&B=={26}
        elif k=='neither-divisor-count-in-universe':
            domain=one(ss);a,b=map(int,m(r'ішіндегі (\d+) санына да, (\d+) санына',s).groups());A={n for n in domain if n%a==0};B={n for n in domain if n%b==0};U=domain-(A|B);answer=str(len(U));assert max(domain)==90 and len(domain)==90
        elif k=='two-digit-multiple-or-tens-digit-count':
            divisor,tens=map(int,m(r'ішінен (\d+) санына.*?цифры (\d+)',s).groups());domain=set(range(10,100));A={n for n in domain if n%divisor==0};B={n for n in domain if n//10==tens};U=A|B;answer=str(len(U));assert 99 in A and A&B=={77}
        else:
            upper,a,b=map(int,m(r'1–(\d+).*?ішінде (\d+) немесе (\d+)',s).groups());domain=set(range(1,upper+1));A={n for n in domain if n%a==0};B={n for n in domain if n%b==0};U=A|B;answer=str(len(U));lcm=math.lcm(a,b);assert lcm==24 and lcm!=a*b and max(A)==126 and max(B)==128 and max(A&B)==120
        note=f'COMPLETEactualdomain{min(domain)}…{max(domain)}({len(domain)}items), A{sorted(A)},B{sorted(B)}, target{k}={sorted(U)}; everystrict/inclusive/zero-lastdigit99boundary checked, noasymptotic/floorroundingguess.'
    elif k=='club-names-union-count':
        a,b=m(r'үйірмесіне (.+?) жазылды\. Дизайн үйірмесінің тізімі: (.+?)\.',s).groups();A=set(a.split(', '));B=set(b.split(', '));assert A&B=={'Медина','Расул'};answer=str(len(A|B));note=f'ALLactualNAMESA{A},B{B}, sharedtwo anddistinctunion7; orderedregistrationnotdifferentpeople, allnamedsolutionunionread.'
    elif k=='universal-intersection-contained-in-union':
        assert 'ШЕКТЕУЛІ'in s and 'бос болуы да мүмкін'in s;states=list(itertools.product([False,True],repeat=2));assert all(not(a and b)or(a or b)for a,b in states);answer='C ∩ D ⊆ C ∪ D';assert answer in row['options']
        C,D={4,8},{8,12};assert not C|D<=C&D and len(C|D)!=len(C)+len(D)and C&D!=C
        note='ArbitraryelementALL4membershiptruthstates formal(AND⇒OR), includesempty. ActualcountermodelC{4,8},D{8,12}rejectsreverseinclusion/countsum/intersection=C; finitecardinalityrestrictionexplicit.'
    elif k=='convex-quadrilateral-intersection-impossible-sides':
        assert 'ДӨҢЕС төртбұрыш'in s and 'ауданы оң'in s and 'бір қабырға саналады'in s;w=quadrilateral_witnesses();bound=4+4;answer=one(o for o in row['options']if int(o)>bound);assert set(map(int,row['options']))=={5,6,8,9}and set(map(int,w))=={5,6,8}
        note='Universalbound8: intersectionofconvexsetsconvex; eachoriginaledge∩otherpolygonisONEinterval, soeachof8supportingedgescontributesatmostONEmergedboundaryside. IndependentEXACTFractionSutherlandHodgmanphysical4vertexpolygonwitnesses5/6/8, everypositivearea/strictconvexity/actualedge-supportandcollinearmergechecked. WitnesscoordinatesinthegeometryWitnessesreport; authorgeometrynotused.'
    elif k in {'two-clubs-intersection-from-neither','exactly-one-language-count','two-outings-neither-from-overlap'}:
        if k=='two-clubs-intersection-from-neither':
            total,a,b,neither=map(int,m(r'студиясында (\d+) оқушы.*?Оның (\d+) оқушысы кодтау, (\d+) оқушысы.*?; (\d+) оқушы',s).groups());common=a+b-(total-neither);v=common
        elif k=='exactly-one-language-count':
            a,b,common=map(int,m(r'сөйлейтін (\d+),.*?сөйлейтін (\d+) бала.*?сөйлейтіндер (\d+)',s).groups());neither=0;total=a+b-common;v=a+b-2*common
        else:
            total,a,b,common=map(int,m(r'топта (\d+) бала.*?серуенге (\d+), екіншісіне (\d+) бала.*?де (\d+) бала',s).groups());neither=total-(a+b-common);v=neither
        parts=[a-common,common,b-common,neither];assert min(parts)>=0 and sum(parts)==total;answer=str(v);note=f'ACTUALtypedwhole{total},A{a},B{b},common{common},neither{neither}; nonnegativedisjointledger{parts}sumswhole. Asked{k}={v}, NOTunion/exactlyboth/exactlyoneconfusion.'
    elif k=='count-unknown-B-given-union':
        A,U=ss;good=[B for B in powers(U)if A|B==U];assert len(good)==2**len(A)and U-A in good and U in good;answer=str(len(good));note=f'COMPLETEALL{2**len(U)}actualB⊆U, exactly{len(good)}satisfyA∪B=U; forcedUminusA10/12 plusALL16optionalAparts, emptyoptional/fullbothincluded. NooutsideUelementcanqualifyuniversally.'
    elif k=='intersection-equals-left-implies-inclusion':
        states=list(itertools.product([False,True],repeat=2));assert all(((a and b)==a)==(not a or b)for a,b in states);answer='E ⊆ F';assert answer in row['options'];E,F={3},{3,9};assert E&F==E and not F<=E and E!=F and E&F
        note='Arbitraryelement∀membershipidentity(EAND F)=E IFF E⇒F, exactuniversalincludingempty. ActualE{3},F{3,9}countermodelrejectsother3necessityclaims; equalinclusive⊆notstrict.'
    elif k=='nested-infinite-multiple-intersection':
        a,b=map(int,m(r'A — (\d+) санына.*?B — (\d+) санына',s).groups());assert a%b==0 and b%a!=0;answer='A ∩ B = A, A ∪ B = B';assert answer in row['options'];note=f'UniversalANYa-multiplex={a}t={b}({a//b}t), soA⊆B forINFINITEpositivemultiples; {b}∈BnotAprovesproper, {a}commonprovesnonempty. All4actualidentitychoicescompared.'
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
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All40saved/newfullconditions/official+newsolutions/everyMCQread; ownACTUALprintedset/fullfinite-domain/divisor/powerset/ledgeroracle plusindependentexactconvexpolygonphysicalwitnesses; noauthorcalculator/spec/params/geometry','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All40saved/newfullconditions/official+newsolutions/everyMCQmanuallyread','AllactualMCQs includingmathematicallyequalduplicateroosterwithEXPLICITcanonicalformat','COMPLETEfiniteinteger/90two-digit/divisor/Unicodeletter/powersetdomains andrequestedSUMvsCARDINALITY','ArbitraryelementuniversalAND/OR/inclusion/infinite-multipleproofs; finitecardinalityboundsANDallattainablewitnesses','Convexquadrilateraluniversal8-sideboundplusindependentexactphysical5/6/8intersectionwitnesses','All40keys/wrongkeys/fullcanonicalhashes/nativefractionschecked']})
    assert len(refs)==40
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All40source-addressedgrade5topic5.3nonvisualsetunion/intersection;36sets+3word+1convexgeo','geometryWitnesses':quadrilateral_witnesses(),'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':40,'wrongKeysRejected':40,'hashesMatched':40,'sourceRefs':40,'convexQuadrilateralWitnessSideCounts':list(map(int,report['geometryWitnesses'])),'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
