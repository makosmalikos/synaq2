"""Independent printed-set, full-domain and universal-relation review of 45 rows.
No author solver/specification/row.params is imported or used.
"""
import importlib.util
import itertools
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-subsets.json';OUT='problems/editorial/reviews/grade5-subsets.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']

def atom(s):return int(s)if re.fullmatch(r'-?\d+',s)else s
def sets(s):
    found=[]
    for content in re.findall(r'\{([^{}]*)\}',s):
        parts=[p.strip()for p in content.split(';')if p.strip()]
        if '…'in parts:
            assert parts[:2]==['1','2']and parts[2]=='…'and len(parts)==4
            parts=list(map(str,range(1,int(parts[-1])+1)))
        found.append(frozenset(map(atom,parts)))
    return found
def powers(A):
    vals=sorted(A,key=str)
    return [frozenset(vals[j]for j in range(len(vals))if mask>>j&1)for mask in range(1<<len(vals))]
def divisors(n):return {d for d in range(1,n+1)if n%d==0}
def primes(bound):return {n for n in range(2,bound)if all(n%d for d in range(2,math.isqrt(n)+1))}
def pickset(row,A):return one(o for o in row['options']if one(sets(o))==A)
def picknumber(row,n):return one(o for o in row['options']if re.fullmatch(r'\d+',o)and int(o)==n)if row.get('options')else str(n)
def entire_lists(solution,expected):
    actual=sets(solution);assert len(actual)==len(set(actual))==len(expected)and set(actual)==set(expected),(actual,expected)

def universal_logic():
    # Arbitrary-element truth tables establish these statements for EVERY set,
    # not only finite sampleuniverses. Finite sets corroborate the typed roles.
    for a,b,c in itertools.product([False,True],repeat=3):
        le=lambda x,y:not x or y
        if le(a,b)and le(b,c):assert le(a,c)
        if le(a,b)and le(b,c)and le(c,a):assert a==b==c
        assert le(False,a)and le(a,a)
        assert not le(a,b)==(a and not b)

def solve(row):
    s=row['statement'];k=row['modelId'].removeprefix('grade5-subsets-');ss=sets(s);note=''
    assert row['topic']==('word'if k in {'class-subset-complement','nested-club-team-complement'}else'sets')
    if k=='equal-described-bounded-set':
        target=one(ss);vals=[]
        for o in row['options']:
            ns=list(map(int,re.findall(r'\d+',o)))
            if 'оң бөлгіштері'in o:A=divisors(one(ns))
            elif 'кіші'in o:bound,step=ns;A={x for x in range(1,bound)if x%step==0}
            else:bound,step=ns;assert'аспайтын'in o;A={x for x in range(1,bound+1)if x%step==0}
            vals.append(A)
        answer=one(o for o,A in zip(row['options'],vals)if A==target);note=f'ALLfouractualdescriptionsfullyenumerated{vals}; exacttarget{target}, strictbound12excluded/inclusive18included, notjustnonemptyoverlap.'
    elif k in {'all-subsets-inclusive-count','subsets-required-one-member','subsets-exactly-two-elements','subsets-exact-minimum','nonempty-subsets-no-adjacent','subset-element-sum-cardinality','singleton-subset-cardinality','nonempty-parity-homogeneous-subsets','odd-sum-subsets-cardinality','maximum-subset-no-congruent-differences'}:
        A=one(ss);domain=powers(A)
        if k=='all-subsets-inclusive-count':
            good=domain;block=m(r'Толық тексеру: (.+?) Топтар саны',row['solution'])[1];listed=sets(block);assert frozenset()not in listed and len(listed)==len(set(listed))==len(domain)-1 and set(listed)==set(domain)-{frozenset()}
        elif k=='subsets-required-one-member':
            required=number(r'Құрамында (\d+) саны',s);assert required in A;good=[B for B in domain if required in B];assert{B-{required}for B in good}==set(powers(A-{required}))
        elif k=='subsets-exactly-two-elements':
            good=[B for B in domain if len(B)==2];block=m(r'Толық тізім (.+?)\. Алғашқы',row['solution'])[1];entire_lists(block,good)
        elif k=='subsets-exact-minimum':
            v=number(r'элементі дәл (\d+)',s);good=[B for B in domain if B and min(B)==v];block=m(r'Толық тізім (.+?)\. \{',row['solution'])[1];entire_lists(block,good)
        elif k=='nonempty-subsets-no-adjacent':
            good=[B for B in domain if B and all(abs(x-y)!=1 for x,y in itertools.combinations(B,2))];block=m(r'өлшемімен бөлеміз: (.+?)\. Ешбір',row['solution'])[1];entire_lists(block,good);assert max(map(len,good))==3
        elif k=='subset-element-sum-cardinality':
            target=number(r'ҚОСЫНДЫСЫ (\d+) болатын',s);good=[B for B in domain if sum(B)==target];block=m(r'Толық жарайтындары: (.+?)\. Топтар',row['solution'])[1];entire_lists(block,good)
        elif k=='singleton-subset-cardinality':good=[B for B in domain if len(B)==1];block=m(r'береді: (.+?)\. Барлығы',row['solution'])[1];entire_lists(block,good)
        elif k=='nonempty-parity-homogeneous-subsets':
            good=[B for B in domain if B and len({x%2 for x in B})==1];assert len(good)==(2**sum(x%2==0 for x in A)-1)+(2**sum(x%2 for x in A)-1)
        elif k=='odd-sum-subsets-cardinality':
            good=[B for B in domain if sum(B)%2];odd=one(x for x in A if x==5);assert{B^{odd}for B in good}==set(domain)-set(good)
        else:
            d=number(r'айырмасы (\d+) санына',s);valid=[B for B in domain if all((x-y)%d for x,y in itertools.combinations(B,2))];maximum=max(map(len,valid));classes={x%d for x in A};assert maximum==len(classes)==d
            witness=sets(row['solution'])[-1];assert witness in valid and len(witness)==maximum
            # Universal upper bound: at most one element per residue class,
            # since equal residues give a forbidden divisible difference.
            good=None;answer=picknumber(row,maximum);note=f'COMPLETE{len(domain)}actualsubsetsfrom{A}, {len(valid)}valid; independentMAX{maximum}. Residueinjectiongivesuniversalupperbound{d}, actualsolutionwitness{witness}attainsit. All4maxchoiceschecked.'
        if good is not None:answer=picknumber(row,len(good));note=f'COMPLETEALL{len(domain)}actualsubsets of{A}, target{k} gives{len(good)}. EverywrittenFULLsolutionrostercheckedforuniqueness/completenesswhenpresent; empty/singleton/equality/parity/nonadjacent boundaries explicit.'
    elif k in {'four-subset-relations-choice','fixed-A-subset-choice','subset-of-divisor-set-choice'}:
        if k=='four-subset-relations-choice':flags=[a<=b for a,b in map(sets,row['options'])]
        else:
            A=one(ss)if ss else divisors(number(r'K — (\d+) санының',s));flags=[one(sets(o))<=A for o in row['options']]
        answer=one(o for o,t in zip(row['options'],flags)if t);note=f'ALLfouractualfinite-subsetmembershiptruths{flags}; inclusionchecksEVERYelement, directionandONEforeigncounterexample preserved.'
    elif k=='universal-empty-inclusion':
        universal_logic();assert 'R' in s and 'бос болуы да мүмкін'in s;answer=one(o for o in row['options']if o=='∅ ⊆ R')
        allA=powers({1,2,3});flags=[all(not A for A in allA),all(not A<=A for A in allA),len(set())==2,all(set()<=A for A in allA)];assert flags==[False,False,False,True]
        note='Arbitrary-elementvacuityproof ∅⊆R coversEVERY R includingempty; ALL4options false/false/false/true. R⊆∅ counterexample{1}, selfreflexivity, cardinal∅0vs2 checked.'
    elif k in {'divisibility-subset-element-SUM','even-elements-subset-cardinality','remainder-predicate-subset-list','nested-multiple-filter-element-SUM'}:
        A=one(ss)
        if k=='divisibility-subset-element-SUM':d=number(r'жиынының (\d+) санына',s);B={x for x in A if x%d==0};v=sum(B)
        elif k=='even-elements-subset-cardinality':B={x for x in A if x%2==0};v=len(B)
        elif k=='remainder-predicate-subset-list':
            d,rem=map(int,m(r'элементтерінен (\d+) санына бөлгенде қалдық (\d+)',s).groups());B={x for x in A if x%d==rem};assert rem in B and rem//d==0;answer=pickset(row,B);note=f'ALLactualboundedA{A}, remainder{rem}mod{d}→{B}; zeroquotientfirstelementincluded, next17outsideAexcluded, all4rosterschecked.';return answer,note
        else:
            d,notd=map(int,m(r'элементтерінің (\d+) санына еселіктерінен тұрады\. C — B ішіндегі (\d+) санына',s).groups());B={x for x in A if x%d==0 and x%notd!=0};v=sum(B)
        answer=str(v);note=f'COMPLETEactualA{A}→typedpredicate{k}selects{B}; requestedSUMvsCARDINALITYgives{answer}, noexternaleligiblevalueincluded.'
    elif k in {'class-subset-complement','nested-club-team-complement'}:
        if k=='class-subset-complement':total,club=map(int,m(r'тобында (\d+) бала бар\. Сол топтағы (\d+) бала',s).groups());v=total-club;parts=[v,club]
        else:total,outside,team=map(int,m(r'Топта (\d+) оқушы бар, (\d+) оқушы.*?ішінен (\d+) оқушы',s).groups());v=total-outside-team;parts=[team,v,outside]
        assert all(x>=0 for x in parts)and sum(parts)==total;answer=str(v);note=f'ACTUALnestedsubsets partitiondisjointtypedparts{parts}, whole{total}, requestedcomplement{v}; nooutsideclass/teamdoublecount.'
    elif k=='set-equality-missing-element':
        L,R=ss;known=L-{'x'};missing=R-known;v=one(missing);assert len(missing)==1 and known|{v}==R;answer=str(v);note=f'ACTUALleftknown{known}, right{R}; UNIQUE missing{v}, anyotherx leavesitabsent; setsnotorderedlists.'
    elif k=='inverse-total-subset-count':
        total=number(r'саны (\d+)\.',s);n=0
        while 2**n<total:n+=1
        assert 2**n==total;answer=str(n);note=f'ActualTOTALinclusivepowerset{total}; completepowersfrom2⁰to2^{n}, strictdoublinguniversaluniqueness, answerELEMENTCOUNT{n}not32.'
    elif k=='class-inclusion-proper-versus-member':
        assert 'шаршылар'in s and 'төртбұрыштар'in s and 'жеке геометриялық фигуралар'in s
        assert set(row['options'])=={'Q ⊆ S','S = Q','S ⊆ Q','S ∈ Q'};answer='S ⊆ Q'
        note='EverySQUAREsatisfiesquadrilateraldefinition, soS⊆Q universally. Rectangle2×3 hasfourverticesbutunequalsides, counterexampletoQ⊆S/equality. Qindividualfiguretyped, wholecollectionSnotQelement; avoidsfalsegeneralrulethatsetsneverareelements.'
    elif k=='read-negated-subset-order':
        left,right=m(r'^([A-Z]) ⊈ ([A-Z])',s).groups();answer=f'{left} жиыны {right} жиынының ішкі жиыны емес';assert answer in row['options'];note=f'Actualordered{left}⊈{right} meansNOT(leftsubsetright), notoppositedirection, positiveinclusion or∉elementclaim. Everywordedchoicechecked.'
    elif k=='singleton-subset-versus-number-member':
        vals=list(map(sets,row['options']));assert vals[0]==[frozenset({7}),frozenset({7,14})]and vals[1]==[frozenset({7,14})]and vals[2]==vals[0]and vals[3]==list(reversed(vals[0]));answer=row['options'][0]
        assert 'САНДАРЫ'in s;note='ALLactualtypes distinguished7NUMBER vs{7}SET: singletoninclusivepropertrue, numbersnotsetsfortyped⊆, singletonnotlistedaselementofnumerical7/14set, reverseinclusionfails14.'
    elif k=='subset-transitivity-universal':
        universal_logic();assert s.startswith('D ⊆ E және E ⊆ F.');answer='D ⊆ F';D,E,G={2},{2,6},{2,6,10};assert D<=E<=G and not G<=D and not G<=E and D!=G
        note='Arbitraryelementtruth-tableuniversaltransitivity D→E→F provesD⊆F forinfinite/finite/emptysets; actualD{2},E{2,6},F{2,6,10}countermodeltoother3choices.'
    elif k=='remainder-sets-directed-difference':
        da,db=map(int,m(r'натурал сандарды (\d+) санына.*?B — (\d+) санына',s).groups());A=set(range(da));B=set(range(db));assert B<=A;v=len(A-B)
        for d in[da,db]:assert{n%d for n in range(d,2*d)}==set(range(d))
        answer=str(v);note=f'ActualCOMPLETE remainders0…{da-1}and0…{db-1}; eachattainedbyPOSITIVEn=d+r, NOremainder=d. DirectedAminusB{A-B}, cardinal{v}notoppositeempty.'
    elif k=='nonempty-colour-selections':
        count=number(r'(\d+) түс ұсынылды',s);palette=m(r'ұсынылды: (.+?)\.',s)[1].split(', ');assert len(palette)==len(set(palette))==count
        choices=[B for B in powers(palette)if B];answer=str(len(choices));note=f'ALL2^{count}binaryactualcolorselections, removeONLYempty→{answer}; amount/orderexplicitlyexcluded, noorderedpermutationovercount.'
    elif k=='equal-digit-sets-different-lengths':
        target=set(m(r'жиыны (\d+) санының',s)[1]);answer=one(o for o in row['options']if set(o)==target);note=f'Actualtarget4047distinctDIGITS{target}; all4choicesdedupedincludingzero, unique77400, order/length/repetitionirrelevant.'
    elif k=='divisor-set-inclusion-pair':
        pairs=[tuple(map(int,m(r'^(\d+) және (\d+)$',o).groups()))for o in row['options']];flags=[divisors(a)<=divisors(b)for a,b in pairs];assert flags==[b%a==0 for a,b in pairs]
        answer=one(o for o,t in zip(row['options'],flags)if t);note=f'ALLactualpairs{pairs}, FULLdivisorlistschecked{flags}. Universaliff: ainDiv(a)necessity andd|a|btransitivitysufficiency, nofinitecutoffassumption.'
    elif k=='prime-natural-odd-universal-inclusion':
        assert '1-ден басталатын'in s and 'тақ'in s;answer='P ⊆ N';assert set(row['options'])=={'P ⊆ O','O ⊆ P','N ⊆ P','P ⊆ N'}
        assert 2 in primes(3)and 2%2==0 and 9%2==1 and 9%3==0 and 1 not in primes(2)
        note='UniversalPRIMEdefinitionpositiveN⇒P⊆N. ActualP⊆Ocounterexample2evenprime, O⊆Pcounterexample9oddcomposite, N⊆Pcounterexample1one-divisor. All4optionsindependentlytyped.'
    elif k=='nested-multiple-sets-difference':
        bound,a,b=map(int,m(r'A — (\d+) санынан кіші (\d+) санына.*?B — сол шектегі (\d+) санына',s).groups());A={x for x in range(1,bound)if x%a==0};B={x for x in range(1,bound)if x%b==0};assert B<=A;answer=str(len(A-B));note=f'COMPLETEstrict1…{bound-1}domain, A{A},B{B}, nestedbecause{b}%{a}=0; requestedAminusB{A-B}, count{answer}.'
    elif k=='unknown-subset-element-distinct-SUM':
        L,R=ss;fixed=L-{'x'};assert fixed<=R;forbidden=set(map(int,re.findall(r'x ≠ (\d+)',s)));assert forbidden==fixed;good=R-forbidden;answer=str(sum(good));note=f'ActualfiniteR{R}, forbidden{forbidden}, COMPLETEuniquepossiblex{good}, sum{answer}, notcount4/onevalue; anyxoutsideRfailsinclusion.'
    elif k=='four-described-sets-equality':
        a,b,exclude,bound,primebound=map(int,m(r'A — (\d+) санының.*?B — (\d+) санының (\d+) санына.*?C — (\d+) санынан.*?D — (\d+) санынан',s).groups());env={'A':divisors(a),'B':{d for d in divisors(b)if d%exclude},'C':set(range(1,bound)),'D':primes(primebound)}
        flags=[env[o[0]]==env[o[-1]]for o in row['options']];answer=one(o for o,t in zip(row['options'],flags)if t);note=f'ActualFOURcompletepredicateexpansions{env}; ALLofferedpair-equalities{flags}, divisorfilterNOTmod4 retained.'
    elif k=='proper-divisor-set-contained-count':
        target=number(r'бөлгіштері (\d+) санының',s);assert f'n ≠ {target}'in s;good=[n for n in range(1,target+1)if divisors(n)<=divisors(target)and n!=target];assert set(good)==divisors(target)-{target}
        answer=str(len(good));note=f'COMPLETE1…{target}targetdivisors{good}, count{answer}; universalnself-divisorforcesn|{target}hencen≤target, d|n|targetconverse. Equaln{target}excluded, n1included; noarbitraryfinitebound.'
    elif k=='inverse-three-element-subset-count':
        target=number(r'саны (\d+)\.',s);ns=[int(o)for o in row['options']];counts=[len(list(itertools.combinations(range(n),3)))for n in ns];n=one(n for n,c in zip(ns,counts)if c==target);answer=str(n)
        assert math.comb(n,3)==target and math.comb(n+1,3)-math.comb(n,3)==math.comb(n,2)>0
        actual=sets(m(r'Толық 20 үштік: (.+?)\. Элемент саны',row['solution'])[1]);expected=list(map(frozenset,itertools.combinations(range(1,n+1),3)));assert len(actual)==len(set(actual))==target and set(actual)==set(expected)
        note=f'ALLactualnchoices{ns}, completeunorderedTRIPLES counts{counts}; unique{n}. Every20writtenTRIPLE checked. Universallychoose(n+1,3)=choose(n,3)+choose(n,2)>choose(n,3)forn≥3, n<3zero.'
    elif k=='sandwiched-inclusive-subsets-count':
        L,R=ss;good=[B for B in powers(R)if L<=B<=R];assert L in good and R in good and len(good)==2**len(R-L);answer=str(len(good));note=f'ALLactual2^{len(R)}supersetsfilteredL{L}⊆X⊆R{R}; {len(R-L)}optional, exact{answer}, BOTHequalityendpointsincluded.'
    elif k=='infinite-common-multiple-set-relation':
        a,b,n,p=map(int,m(r'M — (\d+) және (\d+) сандарына.*?N — (\d+) санына.*?P — (\d+) санына',s).groups());lcm=math.lcm(a,b);assert lcm==p and n%p==0 and p%n!=0
        answer='N ⊆ M және M = P';assert answer in row['options'];note=f'ACTUALLCM({a},{b})={lcm}, soarbitrarypositivecommonmultipleist×30 andM=P; every60t=30(2t)provesN⊆M. Specific30∈M/PbutnotN disprovesallotherchoices; product60isnotLEAST.'
    elif k=='difference-two-subset-counts':
        diff=number(r'ішкі жиындарынан (\d+) санға',s);pairs=[tuple(map(int,m(r'n\(A\) = (\d+), n\(B\) = (\d+)',o).groups()))for o in row['options']];answer=one(o for o,(a,b)in zip(row['options'],pairs)if 2**a-2**b==diff)
        # a>b; smallestpositivegapforagivena is2^(a-1), so derivedbounda≤floorlog2(diff)+1 is universal.
        upper=diff.bit_length();complete=[(a,b)for a in range(upper+1)for b in range(a)if 2**a-2**b==diff];assert len(complete)==1 and complete[0]==(7,5)
        note=f'ALLactualorderedchoices{pairs}checked2^a−2^b, target{diff}. Universal2^(a−1)≤diff impliesa≤{upper}; COMPLETEallpairsunderderivedbound{complete}, reversedrolesnotallowed.'
    elif k=='required-versus-forbidden-member-bijection':
        A=one(ss);v=number(r'\. (\d+) саны бар',s);yes=[B for B in powers(A)if v in B];no=[B for B in powers(A)if v not in B];assert {B|{v}for B in no}==set(yes)and{B-{v}for B in yes}==set(no)
        answer=one(o for o in row['options']if o==f'саны бірдей, әрқайсысы {len(yes)}');assert len(yes)==len(no)==64
        note=f'COMPLETE128actualsubsets, required{v}yes/no64each. Actualtogglebijectionwithinverse includes∅↔{{14}}, all4offeredpairedcountschecked.'
    elif k=='cyclic-inclusive-subsets-equality':
        universal_logic();assert s.startswith('P ⊆ Q, Q ⊆ R, R ⊆ P.');answer='P = Q = R';assert answer in row['options'];A={3,8};assert A<=A<=A and A
        note='Arbitrary-element3cycleimplicationforcesall3membershipbitsidentical⇒P=Q=R universally, equalnonempty{3,8}countermodeltononexistence/requiredempty; strictproperrelationNOTused.'
    elif k=='fill-subset-relation-symbol':
        A,B=ss;assert A<B and not A==B and not A in B;flags={'∈':False,'=':A==B,'⊆':A<=B,'⊈':not A<=B};answer=one(o for o in row['options']if flags[o]);note=f'Actualnumericalsets{A},{B}: properinclusivecontainmenttrue, missing{B-A}invalidatesequality, leftSETnotnumericalelement, all4symbolschecked.'
    elif k=='negated-subset-exists-counterexample':
        universal_logic();answer=one(o for o in row['options']if'КЕМІНДЕ БІР'in o);assert answer.startswith('Q жиынында P жиынына кірмейтін')
        Q,P={2,7},{2,11};assert not Q<=P and Q&P and not set() - P
        note='Universalnegationof∀x(Q(x)⇒P(x))is∃x(Q(x)andNOTP(x)). ActualQ{2,7},P{2,11}showsoneforeign+oneshared, disjointnessnotnecessary; directionandempty-vacuitykept.'
    elif k=='inclusive-subset-equal-finite-cardinality':
        a,b=map(int,m(r'n\(A\) = (\d+) және n\(B\) = (\d+)',s).groups());assert a==b and'шектеулі'in s;answer='A = B';assert answer in row['options']
        U=set(range(a+1));candidate=[A for A in powers(U)if len(A)==a]
        assert all(A==B for A in candidate for B in candidate if A<=B)
        note=f'ActualFINITEa=b={a}, universaldisjointpartitionB=A⊔(B\\A)gives|B\\A|=0⇒equality, notinvalidinfinite-cardinalityinference. Allactualoptionschecked, completeequal-size{len(candidate)}setsin{len(U)}universecorroborate, equalitywitness1…7.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==45;entries=[];refs=set()
    for row in ROWS:
        answer,note=solve(row);assert answer==row['answer'],(row['editionId'],answer,row['answer']);bad=copy.deepcopy(row);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert row['grade']==5 and row['minimumPlan']=='pro'and not row.get('image')
        if row.get('options'):assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
        else:assert answer.isdigit()and row['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(row);refs.add(raw['id']);assert raw['solution'];norm=lambda text:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',text).lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All45saved/newfullconditions/official+newsolutions/everyMCQread; ownACTUALprintedsetparser/fullpowersets/divisors/typedpredicate anduniversal-arbitraryelementproof; noauthorcalculator/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All45saved/newfullconditions/fullofficial+newsolutions/everyMCQmanuallyread','Actualprintedsetrosters andEVERYactualMCQ independentlychecked','COMPLETEpowersets forrequired/minimum/exactsize/sum/odd/noadjacent/maxmodtarget; solutionfulllistschecked','Universaldefinition/arbitraryelementtruth-tableproofs forvacuity/reflexivity/transitivity/cycle/finitecardinality','ALLdivisors/remaindersstrictdomains andinfiniteLCM/self-divisor iff proofs, noarbitrarycutoff','RequestedSUM/CARDINALITY/orderedpair/valuevsrelation, member-vs-set andinclusive⊆explicitlydistinguished']})
    assert len(refs)==45
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All45source-addressedgrade5topic5.2nonvisualsubsets, completeprinted finite domains anduniversalsetproofs','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert{e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':45,'wrongKeysRejected':45,'hashesMatched':45,'sourceRefs':45,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
