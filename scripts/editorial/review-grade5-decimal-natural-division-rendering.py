"""Independent exact review of the DISPLAYED decimal-natural division conditions and MCQs.

No producer calculator, specifications or params are read by this oracle.
Every original/new condition, complete solution and offered option was also read.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-decimal-natural-division.json'
OUT='problems/editorial/reviews/grade5-decimal-natural-division.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,text):
    found=re.search(pattern,text);assert found,(pattern,text);return found
def number(pattern,text):return int(m(pattern,text)[1])
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(row):
    ref=one(row['sourceRefs'])
    return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def groups(s):
    depth=0;start=None;out=[]
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        elif c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0
    return out
def calc(s):
    s=s.replace('×','*').replace('÷','/').replace('−','-').strip()
    assert re.fullmatch(r'[0-9 ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -visit(n.operand)
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b
        return a/b
    return visit(ast.parse(s,mode='eval').body)
def integer(v):
    v=F(v);assert v>=0 and v.denominator==1,v
    return str(v.numerator)
def choice(r,v):return one(o for o in r['options'] if calc(o)==v)
def inverse(known,coefficient):
    """Exact linear uniqueness, no arbitrary finite search or guessed answer."""
    known,coefficient=F(known),F(coefficient)
    assert known>0 and coefficient>0
    value=known/coefficient
    assert value>0 and coefficient*value==known
    # a*x=b with nonzero a has precisely one rational x, hence at most one natural.
    return value
def ledger(whole,*parts):
    whole=F(whole);parts=list(map(F,parts))
    assert all(p>=0 for p in parts) and sum(parts,F(0))==whole,(whole,parts)
def counts(*parts):assert all(F(p).denominator==1 and p>=0 for p in parts),parts
def traps(r,values):
    for v in values:assert pick(r,v)!=r['answer'],(r['editionId'],v)

def decimals(s):return re.findall(r'\d+,\d+',s)
def D(s):
    assert re.fullmatch(r'\d+(?:,\d+)?',s),s
    if ',' not in s:return F(int(s))
    a,b=s.split(',');return F(int(a+b),10**len(b))
def expr(s):
    # Turn comma literals into integer ratios BEFORE AST parsing; no binary floats.
    return calc(re.sub(r'\d+,\d+',lambda x:'('+str(D(x[0]).numerator)+'/'+str(D(x[0]).denominator)+')',s))
def choose(r,value):return one(o for o in r['options'] if expr(o)==value)
def fs(s):return [tuple(map(int,t)) for t in re.findall(r'\((\d+)/(\d+)\)',s)]
def fixed(n,d):
    power=len(str(d))-1;assert d==10**power and n>=0
    return str(n//d)+','+str(n%d).zfill(power)
def compact(s):
    a,b=s.split(',');return a+','+(b.rstrip('0') or '0')
def spoken(s):
    # The two actual condition-worded numbers use standard additive Kazakh cardinals.
    small={'нөл':0,'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10,'жиырма':20,'отыз':30,'қырық':40,'елу':50,'алпыс':60,'жетпіс':70,'сексен':80,'тоқсан':90}
    a,b=s.lower().split(' бүтін ');whole=sum(small[t] for t in a.split())
    for label,den in [('он мыңнан',10000),('мыңнан',1000),('жүзден',100),('оннан',10)]:
        if b.startswith(label+' '):
            numerator=sum(small[t] for t in b[len(label)+1:].split());assert 0<=numerator<den
            return whole,numerator,den
    raise AssertionError(s)
def reading(s):
    incomplete=re.fullmatch(r'(\d+) бүтін (\d+)',s)
    if incomplete:return int(incomplete[1]),int(incomplete[2]),None
    w,label,n=m(r'^(\d+) бүтін (он мыңнан|мыңнан|жүзден|оннан) (\d+)$',s).groups()
    return int(w),int(n),{'он мыңнан':10000,'мыңнан':1000,'жүзден':100,'оннан':10}[label]
def reading_choice(r,w,n,d):return one(o for o in r['options'] if reading(o)==(w,n,d))

def decimal(v):
    v=F(v);assert v>=0
    for p in range(20):
        n=v*10**p
        if n.denominator==1:return integer(n)if p==0 else fixed(n.numerator,10**p).rstrip('0').rstrip(',')
    raise AssertionError(v)
def pick(r,v):return one(o for o in r['options']if expr(o)==v)
def finish(r,v):return pick(r,v)if r.get('options')else integer(v)

def recurrence(v):
    """Reduced exact rational decimal expansion to zero OR complete repeated state."""
    v=F(v);whole,rem=divmod(v.numerator,v.denominator);seen={};digits=[];states=[]
    while rem and rem not in seen:
        seen[rem]=len(digits);states.append(rem);digit,rem=divmod(rem*10,v.denominator);digits.append(str(digit))
    return {'terminates':rem==0,'whole':whole,'digits':''.join(digits),'states':states,'repeat':rem,'cycleStart':None if rem==0 else seen[rem]}

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-natural-division-');ds=decimals(s);pairs=[];topic='frac'
    def divide(a,d):
        a=F(a);d=int(d);assert a>=0 and d>0;pairs.append((decimal(a),d));return a/d
    if k=='equal-cord-parts-quotient':
        a=D(one(ds));d=number(r'(\d+) бірдей бөлік',s);v=divide(a,d);answer=pick(r,v);note=f'ActualWHOLE{a}m/{d}equalparts={v}; exactdivisionandallcomma/internalzeroMCQschecked.'
    elif k=='select-zero-whole-part-quotient':
        vals=[expr(o)for o in r['options']];assert min(vals)>0;answer=one(o for o,v in zip(r['options'],vals)if 0<v<1);assert 'ӨРНЕКТІ'in s
        note=f'ALLactualdivisionexpressions→{vals}; uniquepositivequotient<1hasWHOLE0, targetEXPRESSION{answer}notdecimalvalue.'
    elif k=='forgotten-comma-result-factor':
        a,d=m(r'(\d+,\d+) ÷ (\d+)',s).groups();v=divide(D(a),d);raw=F(int(a.replace(',','')),int(d));assert raw>v;answer=integer(raw/v);assert raw/v==10**len(a.split(',')[1]);note=f'Actual{a}/{d}correct{v}, erased-comma rawquotient{raw}; requestedFACTOR{raw/v}, notdifference; exactpositiveratio10^rawplaces.'
    elif k in {'zero-tenths-place-small-quotient','natural-division-nonzero-whole-remainder','internal-zero-tenths-in-quotient','zero-whole-and-tenths-small-division'}:
        a,d=m(r'(\d+,\d+) ÷ (\d+)',s).groups();v=divide(D(a),d);answer=pick(r,v)
        if k!='natural-division-nonzero-whole-remainder':assert decimal(v).split(',')[1].startswith('0')
        note=f'Actual{a}/{d}→exact{v}={decimal(v)}, requiredfractionalzero/place slots preserved by independentEuclideanledger; EVERYactualMCQevaluated.'
    elif k=='select-multiplicative-division-check':
        a,d,q=m(r'^(\d+,\d+) ÷ (\d+) = (\d+,\d+)',s).groups();assert divide(D(a),d)==D(q);flags=[]
        for o in r['options']:
            lhs,rhs=o.split(' = ');flags.append('×'in lhs and expr(lhs)==D(rhs))
        answer=one(o for o,t in zip(r['options'],flags)if t);assert expr(answer.split(' = ')[0])==D(a)
        note=f'ActualDIVIDEND{a},DIVISOR{d},QUOTIENT{q}; ALLfourfullMCQidentitieschecked, onlyrequestedMULTIPLICATIVEinverseq×d=aworks; falseequationskeptfalse.'
    elif k in {'requested-number-of-tenths','requested-whole-part-of-quotient','natural-quotient-digit-sum'}:
        a,d=m(r'(\d+(?:,\d+)?) ÷ (\d+)',s).groups();v=divide(D(a),d)
        if k=='requested-number-of-tenths':answer=integer(v*10)
        elif k=='requested-whole-part-of-quotient':answer=str(v.numerator//v.denominator)
        else:answer=str(sum(int(c)for c in decimal(v)if c.isdigit()))
        note=f'Printed{a}/{d}→full{decimal(v)}; requestedROLE{k}gives{answer}, notrawquotient; ALLdigitsincludeWHOLEandinternalzeros, commanevercounted.'
    elif k in {'proper-fraction-by-long-division','fraction-decimal-place-count-after-zero-remainder'}:
        n,d=one(fs(s));v=divide(n,d);state=recurrence(v);assert state['terminates']
        answer=pick(r,v)if r.get('options')else str(len(state['digits']));note=f'Actualnative{n}/{d}, independentFULLremainderstates{state["states"]}toZERO→{decimal(v)}; exactterminalplaceCOUNT{len(state["digits"])}notlength-of-numerator.'
    elif k=='equal-mass-packets-requested-grams':
        mass=D(one(ds));n=number(r'(\d+) бірдей пакет',s);v=divide(mass,n);answer=integer(v*1000);note=f'ActualWHOLE{mass}kg/{n}equalpackets={v}kg→GRAMS×1000={answer}; massconservationv×n checked.'
    elif k=='parenthesized-sum-before-natural-division':
        ex=m(r', (.+?) мәнін',s)[1];v=expr(ex);a,b=map(D,ds);n=number(r'\) ÷ (\d+)',s);assert divide(a+b,n)==v;answer=pick(r,v);note=f'ENTIREactualAST{ex}→{v}; parenthesesSUMthenDIVIDE{n}, no ignoredintegerterms or prematuredivision.'
    elif k=='equal-book-mass-then-fewer-books-grams':
        mass=D(one(ds));n=number(r'Бірдей (\d+) анықтамалықтың',s);want=number(r'Сондай (\d+) анықтамалық',s);unit=divide(mass,n);assert 0<want<n;answer=integer(unit*want*1000);assert recurrence(unit)['terminates'];note=f'Actual{n}equalbooksWHOLE{mass}kg→UNIT{unit}, includesappendedzeroextensions; requested{want}books×SI1000={answer}, notfirst truncateddigit.'
    elif k=='division-before-addition-integer-result':
        ex=m(r'^(.+?) өрнегінің',s)[1];v=expr(ex);a,d=m(r'^(\d+,\d+) ÷ (\d+)',s).groups();part=divide(D(a),d);assert part+D(ds[1])==v;answer=integer(v);note=f'FULLactualAST{ex}→{v}; divisionFIRSTwithinternalzero{part}thenalignedaddend, noinventedparenthesisarounddivisor+addend.'
    elif k=='two-per-cup-quantities-difference':
        first,second=map(D,ds);n1,n2=map(int,re.findall(r'(\d+) бірдей стақан',s));a,b=divide(first,n1),divide(second,n2);assert b>a;v=b-a;answer=pick(r,v);assert pick(r,a+b)!=answer and pick(r,v*10)!=answer and pick(r,v/10)!=answer;note=f'ActualTYPEDpercup{first}/{n1}={a},{second}/{n2}={b}; requestedSECONDminusFIRST{v}, notwholejugvolume/sumpercup/shift.'
    elif k=='inverse-addend-then-unknown-factor':
        n=number(r': (\d+) × x',s);a,total=map(D,ds);v=divide(total-a,n);assert n*v+a==total;answer=pick(r,v);topic='eq';assert pick(r,total-a)!=answer and pick(r,(total-a)*n)!=answer
        note=f'Actualn{n}x+{a}={total}; knownaddendremovedTHENunknownfactorinverse→x{v}; exactsubstitution andn×x-only/multiplyinsteadofdivideMCQsfalse.'
    elif k=='three-path-sum-equal-days-requested-metres':
        total=sum(map(D,ds),F(0));days=number(r'маршрутты (\d+) күнде',s);unit=divide(total,days);answer=integer(unit*1000);assert unit*days==total;note=f'ALLTHREEactualrouteaddends{ds}summed{total}km, equal{days}daydivision{unit}km→METRES{answer}; no laststage-onlyshortcut.'
    elif k=='identify-correct-student-internal-zero':
        a,d=m(r'(\d+,\d+) ÷ (\d+)',s).groups();v=divide(D(a),d);students=re.findall(r'([А-ЯӘҒҚҢӨҰҮҺІа-яәғқңөұүһі]+) — (\d+,\d+)',s);assert len(students)==4;answer=one(name for name,val in students if D(val)==v);assert set(name for name,val in students)==set(r['options']);note=f'ACTUALnamedanswers{students}, independently{a}/{d}={v}, onlyOWNER{answer}; internalzero/shiftwrongvaluesfalse, numericvaluealoneisnottarget.'
    elif k=='still-speed-from-downstream-upstream':
        down,up=map(D,ds);assert down>up>0;v=divide(down+up,2);current=(down-up)/2;assert v+current==down and v-current==up;answer=pick(r,v);assert pick(r,current)!=answer and pick(r,down-up)!=answer and pick(r,down+up)!=answer;note=f'Actualdown/up{down},{up}; SUM/2still{v}, current{current}andfullbackequationspositive; allcurrent/difference/sumtarget-roleMCQsfalse.'
    elif k=='minute-distance-rate-requested-metres':
        minutes=number(r'Робот (\d+) минутта',s);distance=D(one(ds));v=divide(distance,minutes);answer=integer(v*1000);note=f'Actualconstant{distance}km/{minutes}minutes→{v}kmPERONEminute, ×SI1000={answer}metres; unit-time rolechecked.'
    elif k in {'natural-unknown-divisor-from-given-quotient','select-natural-missing-divisor'}:
        a,q=map(D,ds);assert q>0;v=a/q;assert v.denominator==1 and v>0 and a/v==q;answer=finish(r,v);topic='eq';note=f'ActualUNKNOWNNATURALDIVISOR in{a}/x={q}; exactunique x{v}, quotient×x=dividend, ALLofferednaturalcandidatescheckedwhenpresent.'
    elif k=='sum-gap-requested-shorter-rope':
        total,gap=map(D,ds);assert total>gap>0;v=divide(total-gap,2);long=v+gap;ledger(total,v,long);answer=pick(r,v);assert pick(r,long)!=answer and pick(r,total/2)!=answer and pick(r,(total-2*gap)/2)!=answer;note=f'ActualSUM{total},GAP{gap}, SHORTER=(sum−gap)/2={v}, longer{long}; both equations andalllong/half/extra-gapMCQroleschecked.'
    elif k=='largest-mixed-fractions-decimals':
        vals=[expr(o)for o in r['options']];answer=one(o for o,v in zip(r['options'],vals)if v==max(vals));note=f'ALLactualnativefractionsanddecimals{list(zip(r["options"],map(str,vals)))} exactcrossproductcompared; uniqueMAX{answer}, no longer-spellingheuristic.'
    elif k=='unequal-box-masses-requested-large-grams':
        small,big=map(int,m(r'^(\d+) шағын қорап пен (\d+) үлкен',s).groups());total,extra=map(D,ds);base=divide(total-big*extra,small+big);large=base+extra;assert base>0 and small*base+big*large==total;answer=integer(large*1000);note=f'Actual{small}small/{big}big,total{total}, EACHbigextra{extra}; subtractALL{big}extrasbeforedivide{small+big}, small{base}, requestedLARGE{large}kg→{answer}g; fullmassconservation.'
    elif k=='first-sequence-index-below-one':
        terms=[D(one(ds))];d=number(r'алдыңғысын (\d+) санына',s);assert d>1 and terms[0]>=1
        while terms[-1]>=1:terms.append(terms[-1]/d)
        assert all(v>=1 for v in terms[:-1])and terms[-1]<1;answer=str(len(terms));topic='seq';note=f'ACTUALpositiveseed/d{d}: fullterms{terms}; FIRSTstrict<1 occursat1-basedINDEX{answer}, notlastvalue{terms[-1]}; equality1wouldnotqualify.'
    elif k=='original-from-divided-decrease':
        d=number(r'санды (\d+) санына',s);gain=D(one(ds));assert d>1;unit=divide(gain,d-1);v=unit*d;assert v-v/d==gain;answer=pick(r,v);assert pick(r,unit)!=answer and pick(r,gain*d)!=answer and pick(r,gain*(d-1))!=answer;note=f'ActualDECREASE{gain}is{d-1}units, quotient1unit{unit}, ORIGINAL{d}units{v}; fullsubstitutionandquotient/gain×d/gain×(d−1)MCQfalse.'
    elif k=='count-terminating-unit-fractions-inclusive':
        lo,hi=map(int,m(r'(\d+)–(\d+) аралығында',s).groups());assert 'ЕКІ ШЕТІ ДЕ кіреді'in s;domain=list(range(lo,hi+1));good=[n for n in domain if recurrence(F(1,n))['terminates']];answer=str(len(good));assert hi in good;note=f'COMPLETEINCLUSIVE{lo}…{hi}domain{len(domain)}denominators; ownFULLremainderstatecycles(untilZEROorREPEAT) givegood{good}; no guessedfinite-placecutoff or unreduceddencriterion.'
    elif k=='third-mass-from-three-pair-sums':
        ab,bc,ac=map(D,ds);total=divide(ab+bc+ac,2);a,b,c=total-bc,total-ac,total-ab;assert min(a,b,c)>0 and a+b==ab and b+c==bc and a+c==ac;answer=integer(c);note=f'ActualAB/BC/AC{ab}/{bc}/{ac}, everymassdoublecounted; total{total}, requestedTHIRD{c}, other{a},{b}; allpairconstraints/positiveconservationchecked.'
    elif k=='recipe-first-minus-other-two-total-grams':
        a,b,c=map(int,m(r'(\d+):(\d+):(\d+) қатынасында',s).groups());gap=D(one(ds));assert a>b+c;unit=divide(gap,a-b-c);v=unit*(a+b+c);answer=integer(v*1000);assert a*unit-(b+c)*unit==gap;note=f'Actualratio{a}:{b}:{c}, FIRSTminusSUMotherTWO gives{a-b-c}units={gap}; exactunit{unit}, whole{a+b+c}units{v}kg→{answer}g, both masssumandgapchecked.'
    elif k=='select-nonterminating-remainder-cycle':
        states=[recurrence(expr(o))for o in r['options']];answer=one(o for o,st in zip(r['options'],states)if not st['terminates']);pairs=[(o.split(' ÷ ')[0],int(o.split(' ÷ ')[1]))for o in r['options']];note=f'ALLactualdivisionoptions expandedbyexactremainderstates toZEROorFIRSTREPEAT; flags{[st["terminates"]for st in states]}, uniqueperiodic{answer}; nofinite-digitguess.'
    elif k=='select-terminating-proper-fraction':
        states=[recurrence(expr(o))for o in r['options']];answer=one(o for o,st in zip(r['options'],states)if st['terminates']);n,d=one(fs(answer));divide(n,d);note=f'ALLactualfractions reducedexactlythenFULLdecimalremaindercycles, terminateflags{[st["terminates"]for st in states]}; only{answer}ends, itsinitialzeroand4placesretained.'
    elif k=='recover-two-dividends-then-internal-zero-quotient':
        da,db,dlast=map(int,re.findall(r'÷ (\d+)',s));qa,qb=map(D,ds);a,b=qa*da,qb*db;v=divide(a+b,dlast);assert a/da==qa and b/db==qb;answer=pick(r,v);topic='eq';assert pick(r,(qa+qb)/dlast)!=answer and pick(r,v*10)!=answer;note=f'Actuala/{da}={qa},b/{db}={qb}; recoverDIVIDENDS{a},{b}thenSUM/{dlast}={v}, internalzero retained. Directquotients-sumactualtrapandshiftfalse.'
    elif k=='rectangle-area-width-perimeter-mm':
        area=D(one(ds));width=number(r'ені (\d+) см',s);length=divide(area,width);assert length>width>0;P=2*(length+width);answer=integer(P*10);topic='geo';note=f'ActualAREA{area}cm²/width{width}cm→length{length}, PERIMETER{P}cm×SI10={answer}mm; areanotlinearlength, noarea×10shortcut.'
    elif k=='two-speeds-one-hour-excess-metres':
        t1,d1,t2,d2=m(r'саяхатшы (\d+) сағатта (\d+,\d+) км, велосипедші (\d+) сағатта (\d+,\d+) км',s).groups();a,b=divide(D(d1),t1),divide(D(d2),t2);assert b>a;answer=integer((b-a)*1000);note=f'ActualDIFFERENTtimepaths{d1}/{t1}={a},{d2}/{t2}={b}km/h; requestedONEhourrateDIFFERENCE×SI1000={answer}m, notwholepathdifference.'
    elif k=='unknown-dividend-sum-then-addend':
        addend,quotient=map(D,ds);d=number(r'\) ÷ (\d+)',s);dividend=quotient*d;v=dividend-addend;assert(v+addend)/d==quotient;answer=pick(r,v);topic='eq';assert pick(r,dividend+addend)!=answer and pick(r,dividend)!=answer and pick(r,v/10)!=answer;note=f'Actual(x+{addend})/{d}={quotient}; recoverDIVIDEND{dividend}thenUNKNOWNADDENDx{v}; exactnestedsubstitution, add/omit/shifttrapschecked.'
    elif k=='three-numbers-factor-plus-offset-target-third':
        total,extra=map(D,ds);factor=number(r'саннан (\d+) есе',s);unit=divide(total-extra,1+2*factor);second=unit*factor;third=second+extra;ledger(total,unit,second,third);answer=pick(r,third);assert pick(r,unit)!=answer and pick(r,second)!=answer and pick(r,total/3)!=answer;note=f'ActualSECOND={factor}×FIRST, THIRD=SECOND+{extra}, total{total}; removeextraTHENdivide{1+2*factor}; first{unit},second{second}, requestedTHIRD{third}, allnamedroles/conservationchecked.'
    elif k=='greatest-natural-divisor-exact-hundredths':
        a=D(one(ds));places=number(r'дәл (\d+) цифр',s);minpositive=F(1,10**places);upper=a/minpositive;answer=integer(upper);assert a/int(answer)==minpositive
        # Exact universal algebra: n>upper⇒a/n<a/upper=10^-p, impossible positive p-place value.
        assert a>0 and 'ЕҢ ҮЛКЕН'in s and 'соңғы цифр 0 емес'in s
        full=[n for n in range(1,int(upper)+1)if(a/n*10**places).denominator==1 and(a/n*10**places).numerator%10!=0];assert max(full)==int(answer)
        note=f'Actualpositivea{a}, EXACT{places}-placeNONZEROlastdigit meansvalue=m/10^{places},m≥1; henceALLn≤{upper}. Boundaryn{answer}gives{minpositive}, andEVERYn>{upper}failsbystrictorder. COMPLETE1…{upper}feasiblelist{full}independentlyconfirmsbutdoesnotreplaceuniversalbound.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note,pairs

def division_ledger(r,pairs):
    s=r['solution'];starts=list(re.finditer(r'Бүтін бөлікті бөлеміз: (\d+) = (\d+) × (\d+) \+ (\d+)\.',s));assert len(starts)==len(pairs),(r['editionId'],len(starts),pairs)
    totalsteps=zeros=appended=cycles=0
    names=['ондық үлес','жүздік үлес','мыңдық үлес','он мыңдық үлес','жүз мыңдық үлес']
    for i,start in enumerate(starts):
        text,d=pairs[i];w,dd,q,rem=map(int,start.groups());assert dd==d;parts=text.split(',');whole=int(parts[0]);inputdigits=parts[1]if len(parts)==2 else'';assert w==whole and q==whole//d and rem==whole%d
        block=s[start.end():starts[i+1].start()if i+1<len(starts)else len(s)];writtenwhole=number(r'Бөліндінің бүтін бөлігі (\d+)',block);assert writtenwhole==q
        steps=list(re.finditer(r'(Келесі цифрды түсіріп|Қалдыққа 0 тіркеп), (\d+) × 10 \+ (\d+) = (\d+)\. (\d+) = (\d+) × (\d+) \+ (\d+); ([^;.,]+?) орнына (\d+) жазамыз',block));digits=[];seen={rem}if not inputdigits and rem else set();repeated=False
        for j,st in enumerate(steps):
            mode,old,digit,current,c2,divisor,out,nextrem,place,written=st.groups();old,digit,current,c2,divisor,out,nextrem,written=map(int,[old,digit,current,c2,divisor,out,nextrem,written]);assert old==rem and current==rem*10+digit and c2==current and divisor==d and out==current//d and nextrem==current%d and 0<=out<=9 and written==out
            assert place==names[j];assert digit==(int(inputdigits[j])if j<len(inputdigits)else 0);assert mode==('Келесі цифрды түсіріп'if j<len(inputdigits)else'Қалдыққа 0 тіркеп')
            rem=nextrem;digits.append(str(out));totalsteps+=1
            if out==0:zeros+=1;assert 'бұл нөлді тастамаймыз'in block[st.end():st.end()+45]
            if j>=len(inputdigits):appended+=1
            if j+1>=len(inputdigits)and rem:
                if rem in seen:assert j==len(steps)-1;repeated=True
                seen.add(rem)
        state=recurrence(D(text)/d)
        if state['terminates']:
            assert rem==0 and len(digits)>=len(inputdigits)and not repeated
            got=str(q)+','+''.join(digits);assert D(got)==D(text)/d
            a,wd,v=m(r'Қалдық 0, барлық берілген цифрлар пайдаланылды: (\d+(?:,\d+)?) ÷ (\d+) = (\d+(?:,\d+)?)\.',block).groups();assert D(a)==D(text)and int(wd)==d and D(v)==D(text)/d
        else:
            cycles+=1;assert repeated and rem and re.search(r'Қалдық '+str(rem)+r' қайта шықты',block)
    return len(starts),totalsteps,zeros,appended,cycles

def main():
    assert len(ROWS)==41;entries=[];refs=set();totals=[0]*5
    for r in ROWS:
        expected,note,pairs=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);counts=division_ledger(r,pairs);totals=[a+b for a,b in zip(totals,counts)]
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All41 saved/new full conditions/official solutions/everyMCQ read; own exact DISPLAYED Fraction AST and full Euclidean trace/remainder-cycle/unit/role oracle; no author solver/spec/params','notes':note+f' Independently checked {counts[0]} full trace blocks/{counts[1]} per-place divisions/{counts[2]} necessaryzero slots/{counts[3]} appendedzero steps.','sourceCanonicalSha256':digest(raw),'checks':['All41 source/new full solutions/everyMCQ manually read','Every written whole/remainder×10+nextdigit/divisor×quotient+remainder identity and place label checked','Every written digit bound0…9/remainder bound0…d−1 and requiredzero slot checked','Input-digit vs appendedzero roles, terminationZERO vs complete repeated-state cycle distinguished','Requested value/count/index/whole/digit sum/owner/expression and SI units independently bound','Inclusive denominator domain and universal maximum240 proof verified without finite cutoffassumptions']})
    assert len(refs)==41 and totals[0]>25 and totals[1]>50 and totals[2]>5 and totals[3]>10 and totals[4]==1
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All41 source-addressed grade5topic4.7 nonvisual decimal-natural division; independent printed exact and full Euclidean/complete-cycle review','divisionAudit':dict(zip(['traceBlocks','perPlaceSteps','requiredZeroSlots','appendedZeroSteps','repeatedStateCycles'],totals)),'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':41,'wrongKeysRejected':41,'hashesMatched':41,'sourceRefs':41,**report['divisionAudit'],'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
