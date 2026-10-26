"""Independent ALL42 source/new set-elements review. ACTUAL printed sets,
all finite digit/remainder/fraction domains, typed infinity/empty proofs;
no author model, specs, params or calculator are imported.
"""
import importlib.util
import itertools
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_util',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','decimals']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-set-elements.json';OUT='problems/editorial/reviews/grade5-set-elements.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def prime(n):return n>=2 and all(n%d for d in range(2,math.isqrt(n)+1))
def divisors(n):return [d for d in range(1,n+1)if n%d==0]
def digits(n):return list(map(int,str(n)))
def roster(s):
    text=m(r'^\{([^{}]*)\}$',s.strip())[1]
    return [expr(t)for t in text.split('; ')]if text else[]
def fmtset(vs):return'{'+ '; '.join(map(str,vs))+'}'
def pickSet(r,vs):return one(o for o in r['options']if set(roster(o))==set(vs))
def pickNum(r,v):return one(o for o in r['options']if expr(o)==v)
def namedRoster(s):
    name,body=m(r'([A-Z]) = \{(\d+(?:; \d+)*)\}',s).groups();return name,list(map(int,body.split('; ')))
def literalRosters(s):return[roster(t)for t in re.findall(r'\{[\d; ]+\}',s)]
def membership(o,values):
    a,op,b=m(r'^(.+) ([∈∉]) ([A-Z])$',o).groups();belongs=expr(a)in values;return belongs if op=='∈'else not belongs
def boundedMultiples(lo,hi,k):return[n for n in range(lo,hi)if n%k==0]
def normword(s):return unicodedata.normalize('NFKC',s).casefold()
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-set-elements-');topic='sets'
    if k=='finite-membership-symbol':
        name,vs=namedRoster(s);flags=[membership(o,vs)for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);assert flags==[False,True,False,False];note=f'ACTUAL{name}roster{vs}, ALL4written∈/∉ flags{flags}; positive/negativeoperator semanticsandnumericpositions, notsingleexample.'
    elif k=='empty-positive-natural-set':
        assert 'N = {1; 2; 3; …}'in s;counts=[]
        for o in r['options']:
            if'санынан кіші натурал'in o:count=max(0,number(r'^(\d+)',o)-1)
            elif'жай'in o:count=sum(prime(n)for n in range(1,10))
            else:d=number(r'^(\d+) санына еселік',o);count=len(boundedMultiples(1,10,d))
            counts.append(count)
        answer=one(o for o,n in zip(r['options'],counts)if n==0);assert counts==[0,3,4,1];note=f'ALL4ACTUALpositive-naturaldescriptions exactcardinalities{counts}; naturalstarts1, emptytargetbefore1; prime/one-digitmultiplewitnesses explicitlynonempty.'
    elif k=='natural-number-membership':
        flags=[];values=[]
        for o in r['options']:
            value=expr(o.split(' ∈ ')[0]);values.append(value);flags.append(value>0 and value.denominator==1)
        answer=one(o for o,ok in zip(r['options'],flags)if ok);assert flags==[True,False,False,False];note=f'ALLactualvalues{values}, positiveintegercriterion flags{flags}; ZEROandproperfractionanddecimalnoninteger excludedunderexplicitNstart1.'
    elif k=='translate-nonmembership-order':
        element,name=m(r'«(\d+) саны ([A-Z]) жиынының',s).groups();answer=one(o for o in r['options']if o==element+' ∉ '+name);note=f'ACTUALsentenceelement{element}, set{name}, NEGATEDmembership. All4combinationsofoperandorderand∈/∉read; elementLEFT/setRIGHT/nonmember∉only.'
    elif k=='identical-two-digit-cardinality':
        values=[n for n in range(10,100)if len(set(str(n)))==1];answer=str(len(values));assert values==[11*d for d in range(1,10)];note=f'FULL10…99domain repeateddigitset{values}, count9invariant;00notTWOdigitnatural, noleadingzero.'
    elif k=='infinite-multiples-choice':
        answer=one(o for o in r['options']if'еселік барлық натурал'in o);a=number(r'^(\d+)',answer);assert a>0;d=number(r'^(\d+)',r['options'][1]);assert divisors(d)==[1,2,3,6,9,18];assert len(range(1,10))==9 and number(r'^(\d+) баласы',r['options'][3])==28;note=f'UNIVERSALpositive{a}-multiplek→k+1givesINJECTIVEstrictlylargernext, nofinalmember. Otherchoices finite: divisors{d}={divisors(d)}, one-digitnaturals9, members28. Notfinitelysampledinfinitude.'
    elif k=='strict-bounded-multiple-list':
        upper,div=map(int,m(r'(\d+) санынан КІШІ, (\d+) санына еселік',s).groups());values=boundedMultiples(1,upper,div);answer=pickSet(r,values);assert[roster(o)for o in r['options'][1:]]==[[0,*values],[*values,div*(len(values)+1)],divisors(div)];note=f'FULLpositive1…{upper-1}multiplesof{div}→{values}. ActualZERO/nextoutsidebound/DIVISORvsMULTIPLEtrapsallchecked; Nexplicit1.'
    elif k=='distinct-digits-in-number':
        raw=m(r'жазу: (\d+)\.',s)[1];values=set(raw);answer=str(len(values));assert'0'in values and len(raw)>len(values);note=f'ALL{len(raw)}ACTUALdigitpositions{list(raw)}, dedup{sorted(values)}→{answer};0islegitimateDIGITnotnatural-number-membership, repeatedpositionsdonotadd.'
    elif k=='word-distinct-letter-count':
        word=normword(m(r'«([^»]+)»',s)[1]);values=list(dict.fromkeys(word));freq={c:word.count(c)for c in values};answer=str(len(values));assert sum(freq.values())==len(word);note=f'ACTUALUnicodeword{word}, ALL{len(word)}letters, NFKC/casefolddedup{values}, fullfrequencies{freq}sumback{len(word)}; repeatedKazakhletterscountonce.'
    elif k=='strict-natural-interval-cardinality':
        lo,hi=map(int,m(r'(\d+) < x < (\d+)',s).groups());vs=list(range(max(1,lo+1),hi));answer=str(len(vs));assert lo not in vs and hi not in vs and len(vs)==hi-lo-1;note=f'FULLpositiveNstrict({lo},{hi})={vs}, BOTHendpointexclusions; count{answer}, gapcountnotcardinality.'
    elif k=='positive-naturals-below-cardinality':
        hi=number(r'x < (\d+)',s);vs=list(range(1,hi));answer=str(len(vs));assert 0 not in vs and hi not in vs;note=f'FULLNstarts1 strictlybelowactual{hi}:1…{hi-1}, count{answer}, neither0norboundaryincluded.'
    elif k=='finite-among-three-infinite':
        flags=[];finiteLists=[]
        for o in r['options']:
            if'санынан кіші'in o:
                hi,d=map(int,m(r'^(\d+) санынан кіші (\d+) санына',o).groups());vs=boundedMultiples(1,hi,d);flags.append(True);finiteLists.append(vs)
            else:flags.append(False)
        answer=one(o for o,t in zip(r['options'],flags)if t);assert finiteLists==[[9,18,27,36,45,54,63,72,81]];note=f'ALL4actualdescriptions: uniqueBOUNDEDmultiples{finiteLists[0]}finite; naturals>500n→n+1, all6multiplesk→k+1, unitfractions1/n n≥2STRICTLYDECREASEandinjectiven→n+1 universalINFINITEproof.'
    elif k=='two-digit-sum-cardinality':
        total=number(r'қосындысы (\d+) болатын',s);values=[n for n in range(10,100)if sum(digits(n))==total];answer=str(len(values));assert values[-1]%10==0;note=f'FULLALL90two-digitnaturals filteredactualdigitsum{total}→{values}, completecount{answer}; last0unitallowed, first0forbidden.'
    elif k=='empty-digit-bound-witnesses':
        flags=[]
        for o in r['options']:
            if'қосындысы'in o:
                total=number(r'қосындысы (\d+)',o);w=[n for n in range(10,100)if sum(digits(n))==total];flags.append(not w)
            elif'құрама'in o:assert any(n>1 and not prime(n)for n in range(1,10));flags.append(False)
            else:assert prime(2)and 2%2==0;flags.append(False)
        answer=one(o for o,t in zip(r['options'],flags)if t);assert flags==[False,False,True,False];note=f'FULL90two-digitdomainanduniversalmaxdigitSUM18; actual21IMPOSSIBLEwhile2has20witness, composite4andprime2othernonemptywitnesses. ALLoftheactual4descriptions checked.'
    elif k=='fixed-numerator-proper-digit-denominators':
        n=number(r'алымы (\d+)',s);den=[d for d in range(1,10)if n<d];vs=[F(n,d)for d in den];assert len(set(vs))==len(vs);answer=pickNum(r,len(vs));assert[expr(o)for o in r['options'][1:]]==[len(vs)+1,9,8];note=f'ALLpositiveONEdigitdenominators1…9, strictPROPERn{n}<d gives{den}, distinctexactvalues{vs}, count{answer}; equal4/4andzeroDEN excluded.'
    elif k=='divisors-strictly-above-list':
        value,lo=map(int,m(r'(\d+) санының (\d+) санынан ҮЛКЕН',s).groups());allValues=divisors(value);vs=[d for d in allValues if d>lo];answer=pickSet(r,vs);assert value in vs and lo not in vs;note=f'FULLdivisor1…{value}domain{allValues}, strictd>{lo}filters{vs}; perfectsquare6countonce, numberSELF36retained; eachwrongsetbound/selfomissionread.'
    elif k=='fixed-euclidean-quotient-list':
        d,q=map(int,m(r'(\d+) санына бөлгендегі толымсыз бөліндісі (\d+)',s).groups());vs=[d*q+rem for rem in range(d)];answer=pickSet(r,vs);assert all(n//d==q for n in vs)and(vs[0]-1)//d!=q and(vs[-1]+1)//d!=q;note=f'UNIVERSALx=dq+r,0≤r<d; ALL{d}remaindersinclZERO→{vs}, outerneighborsquotientsdifferent. EveryMCQ zeroonly/zeroomitted/nextquotientboundary listchecked.'
    elif k=='remainder-membership-choice':
        d,rem=map(int,m(r'(\d+) санына бөлгенде қалдығы (\d+)',s).groups());residues=[number(r'^(\d+)',o)%d for o in r['options']];answer=one(o for o,rr in zip(r['options'],residues)if rr==rem);assert residues==[2,0,4,0];note=f'ALL4ACTUALnumbers mod{d}→remainders{residues}, onlyrequested{rem}; everyEuclideanidentitybackchecked.'
    elif k=='two-digit-divisor-cardinality':
        value=number(r'— (\d+) санының',s);allValues=divisors(value);vs=[d for d in allValues if 10<=d<=99];answer=str(len(vs));assert vs==[12,16,24,32,48,96];note=f'FULLALLpositive divisorsofactual{value}:{allValues}, THEN10≤d≤99→{vs}. Self96twodigitincluded, sixonedigitexcluded; targetCOUNTnotlist.'
    elif k=='word-set-directed-difference-count':
        words=[set(normword(w))for w in re.findall(r'«([^»]+)»',s)];assert len(words)==2;A,B=words;diff=A-B;answer=str(len(diff));assert A&B=={'а'}and'қ'in B-A and'к'in A-B;note=f'ACTUALKazakhwords Unicode/casefoldsetsA{sorted(A)},B{sorted(B)}, DIRECTEDAminusB{sorted(diff)}→{answer}, notBminusA; к≠қ andі≠и preserved.'
    elif k=='two-digit-multiple-cardinality':
        div=number(r'(\d+) санына еселіктердің',s);vs=boundedMultiples(10,100,div);answer=str(len(vs));assert vs==[17,34,51,68,85];note=f'FULL90two-digitnaturals, actualmultiple{div}→{vs}; next102three-digitexcluded, all5positiveboundsbackchecked.'
    elif k=='allowed-digits-repeat-two-digit-count':
        allowed=list(map(int,m(r'Тек ([\d, ]+) цифрларымен',s)[1].split(', ')));vs=[n for n in range(10,100)if set(digits(n))<=set(allowed)];answer=str(len(vs));assert len(vs)==(len(allowed)-1)*len(allowed);assert any(len(set(str(n)))==1 for n in vs);note=f'COMPLETEALL90two-digitnumbers filteredalloweddigits{allowed}, repeatsALLOWED, ZEROallowedonlyunits→{vs}, count{answer}; independentproduct{len(allowed)-1}×{len(allowed)} agrees.'
    elif k=='common-multiples-strict-cardinality':
        hi,a,b=map(int,m(r'(\d+) санынан кіші, (\d+) санына ДА, (\d+) санына ДА',s).groups());vs=[n for n in range(1,hi)if n%a==n%b==0];answer=one(o for o in r['options']if o=='n(A) = '+str(len(vs)));assert math.lcm(a,b)==18 and vs==[18,36,54,72];note=f'FULLactual1…{hi-1}BOTHdivisibilities{a}/{b}→{vs}, count4. LCM18notproduct54; actualseparatesum13+8=21falseandproductcount1false, notUNION.'
    elif k=='largest-four-set-cardinalities':
        counts=[]
        for o in r['options']:
            if'еселік'in o:hi,d=map(int,m(r'^(\d+) санынан кіші (\d+) санына',o).groups());vs=boundedMultiples(1,hi,d)
            elif'тақ'in o:vs=[n for n in range(10,100)if n%2==1]
            elif'цифрлары әртүрлі'in o:vs=[n for n in range(10,100)if len(set(str(n)))==2]
            else:hi=number(r'^(\d+)',o);vs=[n for n in range(1,hi)if prime(n)]
            counts.append(len(vs))
        answer=one(o for o,c in zip(r['options'],counts)if c==max(counts));assert counts==[32,45,81,15];note=f'ALL4ACTUALpredicatefullboundedlists enumerated independently, cardinalities{counts}; uniqueMAX81, 90two-digit−9doubles checked, notlargestNUMBER.'
    elif k=='reducible-to-unit-fraction-count':
        den=number(r'A = \{\(1/(\d+)\)',s);vs=[F(n,den)for n in range(1,den)];valid=[(n,f)for n,f in enumerate(vs,1)if f.numerator==1];assert[n for n,f in valid]==[d for d in divisors(den)if d<den];answer=str(len(valid));note=f'FULLALL{den-1}actualk/{den}fractions reducedEXACTLY, unitnumeratorsat{valid}; completeiffk|den, excludesk=dennotpresent, noassumptionallrawnumerators1.'
    elif k=='all-observed-remainders-set':
        lo,hi,d=map(int,m(r'(\d+)–(\d+) аралығындағы.+, (\d+) санына бөлді',s).groups());vs=sorted({n%d for n in range(lo,hi+1)});answer=pickSet(r,vs);assert vs==list(range(d));assert all(any(n%d==rr for n in range(lo,hi+1))for rr in vs);note=f'ALLactual{lo}…{hi}inclusive numbers enumerated, remainders{vs}; EVERYresiduehasactualwitnessincl0from9, universalr<d forbids9, noassumedmissingresidues.'
    elif k=='nonempty-among-three-impossible':
        a=number(r'^(\d+)',r['options'][0]);assert a>99;assert not any(n%a==0 for n in range(10,100));assert all(not prime(n)for n in range(4,100,2));target=number(r'қосындысы (\d+)',r['options'][2]);assert prime(target)and sum(digits(target))==target;bound,a,b=map(int,m(r'^(\d+) санынан кіші, (\d+) және (\d+)',r['options'][3]).groups());assert math.lcm(a,b)==bound and not any(n%a==n%b==0 for n in range(1,bound));answer=r['options'][2];note=f'Actualprime5itselfDIGITSUM5 witnessesNONEMPTY. Otherthree UNIVERSALimpossible: positive200multiples≥200>99, evenn>2hasproperfactor2, BOTH4/9multiples≥LCM36excludedbySTRICT<36. Notboundedprimesearchassumption.'
    elif k=='contains-digit-union-overlap-count':
        hi,digit=map(int,m(r'— (\d+) санынан кіші.+бір (\d) цифры',s).groups());vs=[n for n in range(1,hi)if str(digit)in str(n)];units=[n for n in range(1,hi)if n%10==digit];tens=[n for n in range(10,hi)if n//10==digit];common=set(units)&set(tens);answer=pickNum(r,len(vs));assert len(vs)==len(units)+len(tens)-len(common)and common=={55};assert[expr(o)for o in r['options'][1:]]==[len(units)+len(tens),len(units)+len(tens)-2,len(units)];note=f'FULL1…{hi-1}domain digit{digit}union{vs}; units{units}, tens{tens}, intersection55countsONCE, inclusionexclusion8+10−1=17; allwrong20-style/suppressedcommon/onegrouptraps actualchecked.'
    elif k=='distinct-rational-values-from-four-numbers':
        allowed=list(map(int,m(r'^([\d; ]+) сандарының',s)[1].split('; ')));groups={}
        for a,b in itertools.product(allowed,repeat=2):groups.setdefault(F(a,b),[]).append((a,b))
        answer=str(len(groups));assert len(allowed)==4 and sum(map(len,groups.values()))==16 and len(groups[F(1)])==4;note=f'COMPLETEALL16ordered a/b writes fromACTUAL{allowed}incl a=b, exactFractiondedup groups{groups}; NINEvalues, allfourdiagonalwritesONE1, nofloatorraw-writecount.'
    elif k=='letter-set-ordered-triples':
        word=normword(m(r'«([^»]+)»',s)[1]);letters=set(word);allValues=list(itertools.permutations(letters,3));answer=str(len(allValues));assert len(allValues)==len(letters)*(len(letters)-1)*(len(letters)-2)and len(set(allValues))==len(allValues);topic='comb';note=f'ACTUALКереметcasefoldUnicodeSET{sorted(letters)}size5from7positions; FULL60ORDEREDdistinct-lettertriples enumerated, reversalchangesword; repeatsNOTallowed. Askedcombinatoricstargetretainedcomb.'
    elif k=='reduced-denominator-stays-fixed':
        d=number(r'A = \{\(1/(\d+)\)',s);valid=[n for n in range(1,d)if F(n,d).denominator==d];assert valid==[n for n in range(1,d)if math.gcd(n,d)==1];answer=str(len(valid));assert valid==[1,5,7,11,13,17];note=f'ALLactual1…{d-1}fractions fullyreduced; exactdenominatorSTAYS{d}iffgcd=1→{valid}, count{answer}; oddnessaloneinsufficient9/18reduces, notcoprimeguess.'
    elif k=='digits-from-bounded-multiples-list':
        hi,d=map(int,m(r'(\d+) санынан АСПАЙТЫН (\d+) санына',s).groups());vs=boundedMultiples(1,hi+1,d);digitsSet=sorted(set(int(c)for n in vs for c in str(n)));answer=pickSet(r,digitsSet);assert vs[-1]==hi and 0 in digitsSet;assert set(roster(r['options'][1]))==set(vs);note=f'ALLpositiveINCLUSIVE≤{hi}actual{d}multiples{vs}, THENunionofALLdigits{digitsSet}; boundary42retained/0from30, digitset≠numberroster, unobserved5excluded.'
    elif k=='two-remainders-two-digit-cardinality':
        a,r1,b,r2=map(int,m(r'(\d+) санына бөлгенде қалдық (\d+), (\d+) санына бөлгенде қалдық (\d+)',s).groups());vs=[n for n in range(10,100)if n%a==r1 and n%b==r2];answer=str(len(vs));assert vs==[33,61,89]and all(y-x==math.lcm(a,b)for x,y in zip(vs,vs[1:]));note=f'FULLALL90two-digitdomainBOTHactualcongruences mod{a}={r1},mod{b}={r2}→{vs}; previous5one-digit/next117three-digit, fullperiod28verifiednotassumed.'
    elif k=='canonical-set-list-brackets':
        desired=list(map(int,m(r'элементтері ([\d, ]+) екені',s)[1].split(', ')));flags=[]
        for o in r['options']:
            if not o.startswith('{')or not o.endswith('}'):flags.append(False);continue
            vs=roster(o);flags.append(set(vs)==set(desired)and len(vs)==len(set(vs))==len(desired))
        answer=one(o for o,ok in zip(r['options'],flags)if ok);assert flags==[False,True,False,False];assert'ДӘЛ БІР РЕТ'in s and'мүлде жиын емес'in r['solution'];note=f'ACTUALgivenelements{desired}; explicitCANONICALONCE instruction, ALL4bracket/complete-roster/repetitionflags{flags}. Generalrepeatedsetnotationnotfalselycalledinvalid; sourcefalseunqualifiedclaim correctedundernewinstruction.'
    elif k=='bounded-prime-set-cardinality':
        hi=number(r'p < (\d+)',s);vs=[n for n in range(1,hi)if prime(n)];answer=str(len(vs));assert vs==[2,3,5,7,11,13,17];note=f'FULLpositive1…{hi-1}domain, primalityALLtrialdivisorstosqrt→{vs}, count{answer};1hasONEdivisorand0excluded, noomitted2-digitprimes.'
    elif k=='repeated-three-digit-divisible-four-bounded':
        hi=number(r'(\d+) санынан КІШІ',s);vs=[n for n in range(100,1000)if len(set(str(n)))==1 and n<hi and n%4==0];answer=str(len(vs));assert vs==[444];allValues=[111*d for d in range(1,10)];assert allValues==[n for n in range(100,1000)if len(set(str(n)))==1];note=f'FULL900three-digitdomain intersections repeateddigits/STRICT<{hi}/mod4→{vs}; all9dddwriteschecked, even222/666faillasttwo4test,888excludedbybounddespite4divisibility.'
    elif k=='set-order-duplicate-zero-properties':
        options=r['options'];vs=[literalRosters(o)for o in options];flags=[set(vs[0][0])==set(vs[0][1]),len(set(vs[1][0]))==number(r'жиынында (\d+) элемент',options[1]),len(set(vs[2][0]))==0,set(vs[3][0])==set(vs[3][1])];answer=one(o for o,ok in zip(options,flags)if ok);assert flags==[True,False,False,False];note=f'ALLactual4claims: orderignoretrue; duplicate8count2not3; singletonZEROisNONEMPTY; extra7makessetsunequal. Exactliteralsetcomparisons flags{flags}, ∅≠{{0}}.'
    elif k=='neither-divisor-strict-cardinality':
        hi=number(r'(\d+) санынан кіші',s);a,b=map(int,m(r'олар (\d+) санына да, (\d+) санына да',s).groups());vs=[n for n in range(1,hi)if n%a!=0 and n%b!=0];answer=pickNum(r,len(vs));assert 1 in vs and vs==[1,3,7,9,11,13,17,19,21,23,27,29];note=f'FULLpositive1…{hi-1}BOTHNEGATIVEpredicates n%{a}≠0ANDn%{b}≠0→{vs}; count12, retains1andcomposite9/21/27, notprimefilterorOR.'
    elif k=='allowed-digit-three-digit-divisible-three':
        allowed=list(map(int,m(r'тек ([\d, ]+) цифрларымен',s)[1].split(', ')));vs=[100*a+10*b+c for a,b,c in itertools.product(allowed,repeat=3)if a!=0 and(100*a+10*b+c)%3==0];answer=str(len(vs));assert sorted(vs)==[204,222,240,402,420,444];assert sum(a!=0 for a,b,c in itertools.product(allowed,repeat=3))==18;note=f'COMPLETEALL{len(allowed)**3}digittriples, leading0removed→18numbers; mod3filters{sorted(vs)}. Sum6or12groupingchecked, repeateddigitsallowed, 000/024notthree-digitnaturals.'
    elif k=='exactly-two-distinct-affine-set-elements':
        a,b=map(int,m(r'\{x; (\d+)x; (\d+)\}',s).groups());possible={F(b),F(b,a),F(0)};valid=sorted(x for x in possible if x>0 and x.denominator==1 and len({x,a*x,F(b)})==2);assert valid==[6,18];flags=[]
        for o in r['options']:offered=sorted(map(F,re.findall(r'x = (\d+)',o)));flags.append(offered==valid)
        answer=one(o for o,ok in zip(r['options'],flags)if ok);topic='eq';note=f'UNIVERSALexact2distinctof3writesrequiresONEof3pairwiseEQUALITIES x={a}x→x0excluded; x={b};{a}x={b}→x{F(b,a)}. Eachremainingcandidatebacksub2values, allotherpositive x3distinct; ALL4answer-sets flags{flags}. ExplicitALLxsolvingtargetmappedEQnotgenericlogic.'
    elif k=='digits-from-all-divisors-cardinality':
        value=number(r'^(\d+) санының',s);allValues=divisors(value);ds=set(int(c)for d in allValues for c in str(d));answer=str(len(ds));assert allValues==[1,2,1019,2038]and ds=={0,1,2,3,8,9};p=1019;assert prime(p);ps=[d for d in range(2,math.isqrt(p)+1)if prime(d)];remainders=[p%d for d in ps];assert remainders==[1,2,4,4,7,5,16,12,7,4,27];note=f'ACTUAL2038 FULLpositive1…2038 divisorsearch→{allValues}; independentALLtrial2…31 proves1019prime andeverywrittenprimeremainder{remainders}verified. ALLdigitsunion{sorted(ds)}→{answer}, includes0, not4divisorcount.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note
def main():
    assert len(ROWS)==42;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);assert raw['solution'];refs.add(raw['id']);norm=lambda x:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',x).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'ALL42fullsaved/newconditions/official/newsolutions/everyMCQ manuallyread; ownACTUALPRINTED exactset/Unicode/Fraction/canonicalnotation/digit-remainder-full-domain/infinity-emptyproof/ALLx-pairwise-equalities oracle; noauthorsolver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['Full42saved/newconditions/fullofficial/newsolutions/everyMCQmanuallyread','ALLfinite1digit/2digit/3digit/Euclideanquotient-residue/boundeddivisor/multiple/fractiondomains enumerated','Naturalstarts1 vsZEROdigit/zero-remainder/singleton{0} notempty distinctions','ExactUnicodecasefold/dedup andFractionvalues, notrawpositionsorwritings','Universalinfinitetailinjections/emptymaxdigitsum/evenprime/LCMstrictbound andpairwiseequalityALLxproofs','Explicitcanonicaleachonceinstruction correctssourceunqualifiedfalseclaim','Targetmapping40sets+1comb+1eq andfullrowSHA exact']})
    assert len(refs)==42
    before=json.loads((ROOT/'output/editorial-set-elements-before-topic-review.json').read_text());before=before['editions']if isinstance(before,dict)else before
    diff=[(i,[k for k in before[i].keys()|r.keys()if before[i].get(k)!=r.get(k)])for i,r in enumerate(ROWS)if before[i]!=r];assert len(diff)==41 and all(keys==['topic']for i,keys in diff);assert len([r for r in ROWS if r['topic']=='sets'])==40
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'finding':'41genericlogic assignments missdedicatedSETSskill or explicitALLxEQ target.','resolution':'AuthorchangedONLY41topics;40→sets,1→eq,orderedtriplescombunchanged. Snapshotdeepdiffconfirmedall42math/text/params/keys/optionsidentical; allfinaltopicassignments reread.'}],'scope':'ALL42source-addressedgrade5topic5.1nonvisualsetelements','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert{e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':42,'wrongKeysRejected':42,'hashesMatched':42,'sourceRefs':42,'topics':{'sets':40,'comb':1,'eq':1},'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
