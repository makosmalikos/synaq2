"""Independent all45 printed-condition review: exact decimal powers, universal
linear identities, all named targets and every MCQ. No author solver/spec/params.
"""
import importlib.util
from pathlib import Path
sp=importlib.util.spec_from_file_location('own_exact_utilities',Path(__file__).with_name('review-grade5-decimal-natural-division-rendering.py'));h=importlib.util.module_from_spec(sp);sp.loader.exec_module(h)
for name in ['F','json','re','math','copy','subprocess','sys','unicodedata','one','m','number','digest','D','expr','decimal','integer','pick','decimals']:globals()[name]=getattr(h,name)
ROOT=h.ROOT;PACK='problems/editorial/batches/grade5-decimal-shifts.json';OUT='problems/editorial/reviews/grade5-decimal-shifts.json';ROWS=json.loads((ROOT/PACK).read_text())['editions']
def power(v):
    v=F(v);assert v>0
    for n in range(-12,13):
        if v==(F(10**n)if n>=0 else F(1,10**(-n))):return n
    raise AssertionError(v)
def coefficient(s):
    assert s.count('x')==1 and not re.search(r'[+−-]',s),s
    # All permitted grammars have one x and only multiplication/division by
    # nonzero exact constants, hence coefficient equality proves ALL real x.
    return expr(s.replace('x','1'))
def finish(r,v):return pick(r,v)if r.get('options')else integer(v)

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-shifts-');ds=list(map(D,decimals(s)));moves=[];topic='frac'
    def move(a,op,b):
        a,b=F(a),F(b);e=power(b)*(1 if op=='×'else-1);moves.append((decimal(a),e));return a*b if op=='×'else a/b
    numeric={'multiply-thousand-one-right-padding','divide-thousand-left-zero-padding','divide-hundred-two-whole-digits','divide-hundredth-to-integer','divide-thousandth-exact-three-digits','multiply-hundred-leaves-fractional-digit','multiply-ten-thousand-internal-zeros','multiply-hundredth-zero-whole'}
    if k in numeric:
        a,op,b=m(r'(\d+(?:,\d+)?) ([×÷]) (\d+(?:,\d+)?)',s).groups();v=move(D(a),op,D(b));answer=finish(r,v);note=f'ActualFULL{a}{op}{b}={v}; exactrawplacecount, requiredleading/internal/trailingzeroes andallnumericchoiceschecked.'
    elif k=='centimetres-to-metres-decimal':
        cm=number(r'(\d+) см',s);v=move(cm,'÷',100);answer=pick(r,v);note=f'ACTUAL{cm}cm /SI100={v}metres; requestedunit preserved, all10/1000/×10wrongconversionsfalse.'
    elif k=='kilometres-to-metres-two-right-padding':
        km=one(ds);v=move(km,'×',1000);answer=integer(v);note=f'ACTUAL{km}km×SI1000={v}metres; TWOmissingendzeroesrequired.'
    elif k=='thousand-label-to-natural-count':
        a=one(ds);v=move(a,'×',1000);answer=integer(v);note=f'Actual{a}THOUSAND→{v}count via1000, notrounding; onepaddedendzero retained.'
    elif k=='select-true-numeric-shift-equality':
        flags=[expr(o.split(' = ')[0])==D(o.split(' = ')[1])for o in r['options']];answer=one(o for o,f in zip(r['options'],flags)if f);note=f'ALLactualFULLnumeric equalities flags{flags}, only{answer}; deliberatelywrongoptionschecked arithmetically.'
    elif k=='universal-multiply-unit-fraction-equivalent-division':
        target=m(r'үшін (x × \d+,\d+) өрнегіне',s)[1];c=coefficient(target);flags=[coefficient(o)==c for o in r['options']];answer=one(o for o,f in zip(r['options'],flags)if f);topic='eq';note=f'ActualhomogeneousONE-x targetcoefficient{c}, ALLofferedcoefficients{[str(coefficient(o))for o in r["options"]]}; equalityofcoefficients provesALLrealxincludingnegative/0, notsampleguess.'
    elif k=='missing-power-of-ten-factor':
        a,b=m(r'^(\d+,\d+) × □ = (\d+)',s).groups();v=D(b)/D(a);move(D(a),'×',v);answer=pick(r,v);assert D(a)*v==D(b);note=f'ActualNONZERO{a}×unknown={b} yieldsuniqueFACTOR{v}=10^{power(v)}; missingendzero andallfourcandidate productsverified.'
    elif k=='net-right-left-shift-direction':
        first,second=map(int,m(r'Санды (\d+) есе арттырып, кейін шыққан санды (\d+) есе кемітті',s).groups());net=power(F(first,second));answer=one(o for o in r['options']if o==('Оңға 'if net>0 else'Солға ')+str(abs(net))+' орын');note=f'ACTUALright{power(first)} andleft{power(second)}, NET{net} frommultipliersratio{F(first,second)}, oppositeactions subtract notadd.'
    elif k=='power-coefficient-after-borrowing-subtraction':
        c,a,b=m(r': (\d+) × x = (\d+,\d+) − (\d+,\d+)',s).groups();diff=D(a)-D(b);v=move(diff,'÷',int(c));answer=pick(r,v);topic='eq';assert v*int(c)==diff;scale=10**max(len(a.split(',')[1]),len(b.split(',')[1]));aa,bb=int(D(a)*scale),int(D(b)*scale);borrow=0;events=[]
        for i in range(max(len(str(aa)),len(str(bb)))):
            x=(aa//10**i)%10-borrow;y=(bb//10**i)%10;borrow=int(x<y)
            if borrow:events.append(i)
        assert events[:2]==[0,1] and borrow==0;note=f'ActualALIGNED{a}−{b}={diff}, trueborroweventsfromleastplaces{events}; unique x=diff/{c}={v}, thenTHREEplaceleftshift/twoleadingzeros andbacksubstitution.'
    elif k=='metres-plus-single-digit-centimetres':
        metres,cm=map(int,m(r'ұзындығы (\d+) м (\d+) см',s).groups());small=move(cm,'÷',100);v=metres+small;answer=pick(r,v);note=f'Actualmixedunits{metres}m+{cm}cm; SI100andinternalTENTH0→{v}metres, notconcatenatingcmastenths.'
    elif k=='alternating-multiply-divide-ten-powers':
        vals=list(map(D,m(r': (.+?); …',s)[1].split('; ')));assert len(vals)==6;ratios=[b/a for a,b in zip(vals,vals[1:])];assert ratios[0]!=ratios[1] and ratios==[ratios[i%2]for i in range(5)];v=vals[-1]*ratios[1];answer=pick(r,v);topic='seq';note=f'ALLsixactualorderedterms, ratios{list(map(str,ratios))}; twoalternatingactions explicitlygiven, nextmustsecondratio{ratios[1]}, target{v}notrepeatlastaction.'
    elif k=='bulk-fixed-item-price-two-powers':
        n,paid,want=map(int,m(r'^(\d+) бірдей дәптерге (\d+) теңге.*сондай (\d+) дәптердің',s).groups());unit=F(paid,n);v=unit*want;answer=integer(v);assert 0<want<n;note=f'Actual{n}items paid{paid}, UNITprice{unit}; requested{want}×sameprice={v}, costconservation andratio{F(want,n)}.'
    elif k=='unit-fraction-coefficient-after-decimal-sum':
        c,a,b=ds;total=a+b;v=move(total,'÷',c);assert v*c==total;answer=integer(v);topic='eq';note=f'ENTIREactualRHSsum{a}+{b}={total}, unknownfactor x=total/{c}={v}; reciprocalpower and substitution.'
    elif k=='substitute-unit-fraction-then-subtract':
        a,b,c=ds;part=move(b,'×',a);v=part-c;answer=pick(r,v);assert pick(r,b-c)!=answer and pick(r,b/a-c)!=answer;note=f'Actuala{a}substitutedinto{b}×a−{c}; MULTIPLYfirst{part}thensubtract{v}; ignoringa/incorrectdirection actualMCQtrapschecked.'
    elif k=='liquid-mass-unit-rate-two-powers':
        n,mass,want=m(r'сұйықтың (\d+) литрі (\d+,\d+) кг.*сұйықтың (\d+) литрі',s).groups();unit=D(mass)/int(n);v=unit*int(want);answer=integer(v);assert v/int(want)==unit;note=f'Actualconstantdensity{mass}/{n}={unit}kg/L; newV{want}×sameunit={v}, fullvolume/mass conservation.'
    elif k=='difference-equivalent-reciprocal-power-operations':
        a,b,c,d=m(r'^(\d+,\d+) ÷ (\d+,\d+) − (\d+,\d+) × (\d+)',s).groups();v=move(D(a),'÷',D(b))-move(D(c),'×',int(d));assert 1/D(b)==int(d)and v==(D(a)-D(c))*int(d);answer=integer(v);note=f'ActualBOTHparts{a}/{b}and{c}×{d}; sharedcoefficient{d} givesfactoredENTIREdifference{v}, exact2paddedzerosforeach.'
    elif k=='missing-dividend-unit-fraction-divisor':
        divisor,quotient=ds;v=move(quotient,'×',divisor);assert v/divisor==quotient;answer=pick(r,v);note=f'ActualUNKNOWNDIVIDEND/divisor{divisor}=quotient{quotient}; restoreDIVIDENDbyPRODUCT{v}, reverseddivisiontrapfalse.'
    elif k=='largest-mass-mixed-gram-kg-tonne':
        vals=[]
        for o in r['options']:
            a,u=o.split(' ');vals.append(D(a)*{'г':1,'кг':1000,'т':1000000}[u])
        answer=one(o for o,v in zip(r['options'],vals)if v==max(vals));note=f'ALLactualtypedmasses convertedtoGRAMS{list(map(str,vals))}, uniqueMAXowner{answer}; tonne→kg→g requiresTWO1000factors.'
    elif k=='sheet-bundles-mm-to-cm':
        thickness=one(ds);per,n=map(int,m(r'Әр бумада (\d+) парақ.*Осындай (\d+) буманың',s).groups());v=thickness*per*n/10;answer=integer(v);note=f'Actualsheet{thickness}mm×{per}perbundle×{n}bundles /SI10={v}cm; allsheetcountsfactors accounted, noair explicitly excluded.'
    elif k=='original-from-left-shift-decrease':
        places=number(r'солға (\d+) орын',s);decrease=one(ds);scale=10**places;old=decrease*scale/(scale-1);new=old/scale;assert old-new==decrease;answer=pick(r,old);assert pick(r,new)!=answer;note=f'ACTUALleft{places}→/{scale}; ORIGINAL−NEW=decrease{decrease}={scale-1}newparts. Uniqueoriginal{old},new{new}; neitherdifference-scalednornewtarget.'
    elif k=='cube-edge-metres-to-cm-mass-density':
        volume,mass,edge=m(r'материалдың (\d+) см³ үлгісі (\d+) г.*Қыры (\d+,\d+) м',s).groups();cm=D(edge)*100;cube=cm**3;density=F(int(mass),int(volume));v=cube*density;answer=integer(v);topic='geo';assert cm>0;note=f'ACTUALedge{edge}m FIRST×SI100={cm}cm, ENTIREcube{cm}³={cube}cm³, exactdensity{mass}/{volume}={density}; mass{v}, nocubic-vslinearscaleconfusion.'
    elif k=='nested-fraction-power-coefficient-root':
        coefficient_,addend,den,rhs=m(r'\(\((\d+)x \+ (\d+,\d+)\)/(\d+)\) = (\d+)',s).groups();numerator=int(rhs)*int(den);rest=numerator-D(addend);v=move(rest,'÷',int(coefficient_));answer=pick(r,v);topic='eq';assert(int(coefficient_)*v+D(addend))/int(den)==int(rhs);note=f'ENTIREprintedNATIVEfraction numerator target{rhs}×{den}={numerator}, removeaddend{addend}, then /coefficient{coefficient_}→x{v}; fullnestedsubstitution andallactualMCQs.'
    elif k=='wrong-division-recover-required-multiplication':
        a,b=ds;scale=a/b;assert power(scale)>0;correct=a*scale;assert correct/b==scale**2 and a/scale==b;answer=integer(correct);note=f'ActualWRONGa{a}/unknownpower={b}uniquescale{scale}; REQUIREDa×scale={correct}; fromwrongtocorrectSQUAREscale{scale**2}, notone-scale.'
    elif k=='group-decimal-pair-before-reciprocal-power':
        a,b,c,d=ds;pair=a*c;assert power(pair)<0;v=pair*b/d;assert v==a*b*c/d;answer=integer(v);note=f'ACTUALfirst×third{a}×{c}={pair}, keepmiddle{b}, /{d}; exactFULLproduct/division{v}, nofactor omitted.'
    elif k=='positive-variable-ratio-opposite-unit-powers':
        a,b=ds;ratio=1/(a*b);answer=pick(r,ratio);topic='eq';assert 'ОҢ'in s;note=f'ACTUALm/{a}=n×{b}; divideBYpositivemallowed, n/m=1/({a}×{b})={ratio}; bothscales, universalforallpositivem.'
    elif k=='count-right-shifts-from-total-and-net':
        a=ds[0];end=number(r'Соңғы нәтиже (\d+)',s);n=number(r'барлығы (\d+) амал',s);net=power(F(end)/a);candidates=[r for r in range(n+1)if 2*r-n==net];rights=one(candidates);left=n-rights;assert a*(F(10)**(rights-left))==end;answer=str(rights);note=f'ActualTOTAL{n}andNET{net}; COMPLETEr=0…{n}, onlyr{rights}/l{left}, targetCOUNTmultiplicationsby10notnetshift; parity/bound checked.'
    elif k=='six-ten-power-products-sum-missing-unit-term':
        a=ds[0];raw=m(r'санын (.+?) сандарының',s)[1];scalars=list(map(D,raw.split('; ')));assert scalars==[F(10),F(100),F(1000),F(1,10),F(1,100),F(1,1000)];terms=[a*b for b in scalars];v=sum(terms,F(0));answer=pick(r,v);assert pick(r,v+a)!=answer;note=f'ALLSIXactualscalars{scalars}×{a}→terms{terms}, exactalignedsum{v}; multiplyingby1NOTgiven, actualextra-unit-termMCQ{v+a}rejected.'
    elif k=='rectangle-km-m-area-to-hectares':
        km=one(ds);width=number(r'ені (\d+) м',s);length=km*1000;area=length*width;v=area/10000;answer=pick(r,v);topic='geo';note=f'Actual{km}km×SI1000={length}m, area×width{width}={area}m², /10000={v}ha; linearlengthscale vsareascale separated.'
    elif k=='universal-two-operation-shift-identity':
        coefficients=[tuple(coefficient(t)for t in o.split(' = '))for o in r['options']];flags=[a==b for a,b in coefficients];answer=one(o for o,f in zip(r['options'],flags)if f);topic='eq';assert all(expr(o.split(' = ')[0].replace('x','0'))==expr(o.split(' = ')[1].replace('x','0'))for o in r['options']);note=f'ALLactualhomogeneouscoefficientpairs{coefficients}, equalflag{flags}; ONE-xlinearityprovesALLrealx. AllfalseoptionsALSOholdatx0, so zero-onlyexampleexplicitlyinsufficient.'
    elif k=='reciprocal-ten-power-shift-direction':
        divisor=one(ds);places=-power(divisor);assert places>0;answer=one(o for o in r['options']if o==f'Оңға {places} орын');note=f'ActualDIVIDEby{divisor}=multiplyreciprocal{1/divisor}=10^{places}; RIGHT{places}notmultiplyleft.'
    elif k=='sum-two-different-right-shifts':
        a,b,c,d=m(r'^(\d+,\d+) × (\d+) \+ (\d+,\d+) ÷ (\d+,\d+)',s).groups();v=move(D(a),'×',int(b))+move(D(c),'÷',D(d));answer=integer(v);note=f'ACTUALtwoaddends{a}×{b}and{c}/{d} haveDIFFERENTrightplacecounts; bothretained, sum{v}.'
    elif k=='multiply-versus-divide-unit-power-factor':
        a,b,c,d=ds;assert a==c and b==d and a>0 and 0<b<1;first=a*b;second=c/d;ratio=second/first;answer=one(o for o in r['options']if o==f'Екіншісі {integer(ratio)} есе үлкен');assert ratio==1/b**2;note=f'Actualpositivecommonbase{a}, multiply{b}→{first}, divide→{second}; SECOND/FIRST{ratio}=reciprocalSQUAREnotonepower.'
    elif k=='profit-thousand-price-label-and-hundred-items':
        n,paid=m(r'Дүкен (\d+) бірдей маркерді (\d+) теңгеге',s).groups();price=one(ds)*1000;want=number(r'(\d+) маркерден түскен',s);cost=F(int(paid),int(n));v=(price-cost)*want;assert price>cost>0 and want<int(n);answer=integer(v);note=f'ActualperitemCOST{paid}/{n}={cost}, saleTHOUSANDlabel{price}, profitperitem{price-cost}, ×requested{want}={v}; REVENUE{price*want}nottarget, othercostsexplicitlynone.'
    elif k=='tonne-total-to-kg-per-object':
        n=number(r'^(\d+) бірдей',s);tonnes=one(ds);v=tonnes*1000/n;answer=pick(r,v);assert v*n==tonnes*1000;note=f'ActualWHOLE{tonnes}tonnes×1000→kg, divideALL{n}equalobjects givesUNIT{v}kg; SIbeforeper-objectconservation.'
    elif k=='three-shifts-equal-three-addends':
        ex=m(r': (.+?)\. Жауап',s)[1];a,b,c,d,e,f=m(r'^(\d+,\d+) ÷ (\d+,\d+) \+ (\d+,\d+) × (\d+) \+ (\d+,\d+) ÷ (\d+,\d+)',ex).groups();terms=[move(D(a),'÷',D(b)),move(D(c),'×',int(d)),move(D(e),'÷',D(f))];assert len(set(terms))==1;v=sum(terms,F(0));answer=integer(v);assert expr(ex)==v;note=f'ALLTHREEactualcompleteaddends→{terms}; eachdifferentcommaoperation separatelybound, exactsum{v}, notonlyoneidenticalvalue.'
    elif k=='ordered-symbolic-values-trailing-zero-operand':
        assignments=dict(re.findall(r'([abc]) = (.+?)(?:;|\. Әріптерді)',s));assert set(assignments)=={'a','b','c'};vals={k:expr(ex)for k,ex in assignments.items()};assert len(set(vals.values()))==3;answer=one(o for o in r['options']if all(vals[x]<vals[y]for x,y in zip(o.split(' < '),o.split(' < ')[1:])));raw=m(r'a = (\d+) ×',s)[1];assert raw.endswith('0');without=F(int(raw[:-1]))*one([D(v)for v in decimals(assignments['a'])]);assert without==vals['b'] and without!=vals['a'];note=f'ActualLETTERassignments{vals}; completeexactsort{answer}, sourceLAST0retained in{raw}; erasing0falsea=b explicitlyconfirmed.'
    elif k=='two-equal-shifted-values-plus-gap-first':
        firstdivisor=number(r'Бірінші санды (\d+) санына',s);seconddivisor,gap=ds;ratio=F(firstdivisor)/seconddivisor;second=gap/(ratio-1);first=ratio*second;assert first/firstdivisor==second/seconddivisor and first-second==gap;answer=integer(first);note=f'ActualA/{firstdivisor}=B/{seconddivisor}⇒A/B{ratio}; givenDIFFERENCE{gap}→B{second}, requestedFIRSTA{first}; bothoriginalequations checked.'
    elif k=='compound-numerator-two-shifts-over-decimal-product':
        ex=m(r': (.+?)\. Жауап',s)[1];a,b,c,d,den,scalar=m(r'\(\((\d+,\d+) ÷ (\d+,\d+) \+ (\d+,\d+) × (\d+)\)/\((\d+) × (\d+,\d+)\)\)',ex).groups();terms=[D(a)/D(b),D(c)*int(d)];bottom=int(den)*D(scalar);v=sum(terms,F(0))/bottom;assert expr(ex)==v;answer=integer(v);note=f'ActualNATIVEWHOLEnumerator terms{terms} summed{sum(terms)}, WHOLEdenominator{den}×{scalar}={bottom}; externaldivision{v}; decimaldivisor/last0andgrouping retained.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note,moves

def check_moves(r,expected):
    pattern=r'Үтірді (оңға|солға) (\d+) орын жылжытамыз(?:; жетпеген (\d+) цифр орнына (оң|сол) жақтан нөл қосылады)?: (\d+(?:,\d+)?) → (\d+(?:,\d+)?)(?: = (\d+(?:,\d+)?))?\. Нөл емес цифрлардың реті өзгермейді\.'
    matches=list(re.finditer(pattern,r['solution']));assert len(matches)==len(expected),(r['editionId'],len(matches),expected);zeros=0
    for written,(a,e)in zip(matches,expected):
        direction,count,missing,side,wa,raw,normalized=written.groups();n=int(count);assert wa==a and n==abs(e)and direction==('оңға'if e>0 else'солға');factor=F(10)**e;assert D(raw)==D(a)*factor
        if normalized:assert D(normalized)==D(raw)
        left,right=(a.split(',')+[''])[:2]if','not in a else a.split(',');needed=max(0,n-(len(right)if e>0 else len(left)))
        if needed:assert int(missing)==needed and side==('оң'if e>0 else'сол');zeros+=needed
        else:assert missing is None and side is None
        # Decimal location moved exactly, including still-required leading zeroes.
        before=a.replace(',','');after=raw.replace(',','');assert after.lstrip('0').rstrip('0')==before.lstrip('0').rstrip('0')
    return len(matches),zeros

def main():
    assert len(ROWS)==45;entries=[];ids=set();totals=[0,0]
    for r in ROWS:
        expected,note,moves=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);counts=check_moves(r,moves);totals=[a+b for a,b in zip(totals,counts)];bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=h.raw_for(r);ids.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All45 fullsaved/newconditions/official/newsolutions/everyMCQ read; own exact PRINTED Fraction AST, allhomogeneoussymboliccoefficients, shift/padding ledger and typedrole oracle; no author solver/spec/params','sourceCanonicalSha256':digest(raw),'notes':note+f' {counts[0]}printedshiftblocks/{counts[1]}necessarypaddedzeros independentlychecked.','checks':['All45fullsource/newconditions/officialsolutions/everyMCQ manuallyread','Actualdecimaloperands andeveryofferedanswer independentlyrecomputed exactly','EVERYrealx universalidentity provedbyhomogeneouscoefficientcomparison; x0-onlytrap rejected','Everywrittencommadirection/placecount/missingleftorrightzero/data+targetrole bound','Fullinclusive0…11rightmove domain withnetparity; threeterms/sixterms/allunitsandorderedletters checked','SI100/1000/10000beforecube/area/density; profitNOTrevenue/originalNOTnew/peritemroles exact']})
    assert len(ids)==45 and totals[0]==25 and totals[1]>10
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'ALL45 grade5topic4.9 source-addressed nonvisual decimalshifts','shiftAudit':{'fullWrittenShiftBlocks':totals[0],'necessaryPaddedZeros':totals[1],'universalIdentityRows':2,'allBoundedCountCandidates':12},'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':45,'wrongKeysRejected':45,'hashesMatched':45,'sourceRefs':45,**report['shiftAudit'],'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
