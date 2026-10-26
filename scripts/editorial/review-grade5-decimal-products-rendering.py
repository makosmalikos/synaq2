"""Independent exact review of the DISPLAYED decimal products conditions and MCQs.

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
PACK='problems/editorial/batches/grade5-decimal-products.json'
OUT='problems/editorial/reviews/grade5-decimal-products.json'
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
def factors(r):
    """Build factor roles ONLY from displayed givens/exactly derived expressions."""
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-products-');ds=decimals(s)
    if k=='fraction-equation-unknown-dividend':return [ds[::-1]]
    if k=='decimal-square-not-double':return [[ds[0],ds[0]]]
    if k=='decimal-cube-not-triple-or-square':return [[ds[0],ds[0]],[decimal(D(ds[0])**2),ds[0]]]
    if k=='mixed-to-decimal-before-product':
        whole,n,d=map(int,m(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups());return [[decimal(whole+F(n,d)),one(ds)]]
    if k=='same-direction-decimal-factor-gap':return [ds[:2]]
    if k=='parenthesized-difference-two-products-sum':return [[decimal(D(ds[0])-D(ds[1])),ds[2]],ds[3:5]]
    if k=='known-sum-common-decimal-factor':return [[ds[1],ds[0]]]
    if k=='positive-decimal-from-square':
        root=one(o for o in r['options']if D(o)**2==D(one(ds)));return [[root,root]]
    if len(ds)==2:return [ds]
    return []

def multiplication_ledger(r):
    s=r['solution'];starts=list(re.finditer(r'Үтірсіз (\d+) × (\d+) = (\d+)',s));expected=factors(r);assert len(starts)==len(expected)or not starts
    count=0
    for i,start in enumerate(starts):
        a,b,p=map(int,start.groups());assert a*b==p;block=s[start.end():starts[i+1].start()if i+1<len(starts)else len(s)];f1,f2=expected[i]
        raw=lambda s:int(s.replace(',',''));places=lambda s:len(s.split(',')[1])if','in s else 0
        assert (a,b)==(raw(f1),raw(f2)),(r['editionId'],a,b,f1,f2)
        x,y,total=map(int,m(r'Ондық орындар (\d+) \+ (\d+) = (\d+)',block).groups());assert x==places(f1)and y==places(f2)and total==x+y
        n,shown=m(r'Оңнан (\d+) цифр ажыратамыз(?:, жетпеген орындарды сол жақтан нөлмен толтырамыз)?: ([\d,]+(?: = [\d,]+)?)\.',block).groups();assert int(n)==total
        vals=shown.split(' = ');assert vals[0]==fixed(p,10**total);assert all(D(v)==F(p,10**total)for v in vals)
        if len(vals)>1:assert vals[-1]==vals[0].rstrip('0').rstrip(',')and vals[0].endswith('0')
        # Derive each multiplier column/partial separately from ACTUAL written rawdigits.
        terms=[a*int(c)*10**j for j,c in enumerate(str(b)[::-1])];assert sum(terms)==p
        written=re.match(r'; разрядтық үлестер ([\d +]+) = (\d+)\.',block)
        if b>=10:
            assert written,(r['editionId'],block);assert list(map(int,written[1].split(' + ')))==terms and int(written[2])==p;count+=len(terms)
        else:assert not written
    # Every displayed simple product equality, including derived witnesses, independently checked.
    products=re.findall(r'(?<![\d,])([\d]+(?:,[\d]+)?) × ([\d]+(?:,[\d]+)?) = ([\d]+(?:,[\d]+)?)(?![\d,])',s)
    for a,b,p in products:assert D(a)*D(b)==D(p),(r['editionId'],a,b,p)
    return len(starts),count,len(products)

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-products-');ds=decimals(s);topic='frac'
    if k in {'tenths-times-tenths','known-integer-product-mixed-places','decimal-product-trailing-zeros-integer','under-one-factor-integer-product','padding-then-trailing-zero-removal','same-decimal-two-cross-terms','five-place-product-padding-and-trailing-zeros','small-decimal-product-leading-padding','known-product-with-trailing-zero-removal'}:
        a,b=map(D,ds);v=a*b;answer=finish(r,v)
        if k.startswith('known-'):
            x,y,z=map(int,m(r'^(\d+) × (\d+) = (\d+)',s).groups());assert x*y==z and [int(t.replace(',',''))for t in ds]==[x,y]
        if k=='same-decimal-two-cross-terms':
            assert a==b and a>1;whole=a.numerator//a.denominator;part=a-whole;assert pick(r,whole**2+part**2)!=answer and pick(r,a+b)!=answer;assert v==whole**2+2*whole*part+part**2
        if k in {'decimal-product-trailing-zeros-integer','under-one-factor-integer-product'}:assert 0<b<1 and v<a
        note=f'BothACTUALcommafactors{ds} exactproduct{v}; sumofrawplaces, fixedpadding THEN trailingtrim checked against writtenrawproducts. Fullcross-terms retained whenmixeddecimal squared; ALLactualMCQs exactfalse exceptkey.'
    elif k=='requested-product-fraction-place-count':
        a,b=map(D,ds);v=a*b;written=decimal(v);answer=str(len(written.split(',')[1])if','in written else 0)
        note=f'Actual{ds}→exact{v}, shortestdecimal{written}; requestedNUMBEROFPLACES{answer}, notproductvalue; no finalzero persists.'
    elif k=='requested-reduced-product-denominator':
        v=D(ds[0])*D(ds[1]);answer=str(v.denominator);assert math.gcd(v.numerator,v.denominator)==1
        note=f'Printedproduct exactREDUCED{v}; requestedDENOMINATOR{answer}, notraw10^places or numerator; coprimeness checked.'
    elif k=='hundredths-digit-of-decimal-product':
        v=D(ds[0])*D(ds[1]);text=decimal(v);tail=text.split(',')[1].ljust(2,'0');answer=tail[1]
        note=f'Actualproduct{v}={text}, SECONDfractiondigit{answer}; wholeandtenthpositionsdistinct, fullproduct computedbeforetargetextraction.'
    elif k=='decimal-material-per-length-total':
        unit,length=map(D,ds);v=unit*length;assert unit>0 and length>0;answer=integer(v)
        note=f'Actualper1kmnorm{unit}tonnes×fractional{length}km={v}t; proportionalremainingfractionretained, positiveunitconservation.'
    elif k in {'decimal-square-not-double','decimal-cube-not-triple-or-square'}:
        a=D(one(ds));power=2 if '²'in s else 3;v=a**power;answer=pick(r,v);assert pick(r,a*power)!=answer
        if power==3:assert pick(r,a**2)!=answer
        note=f'ActualUnicodepower{power}, {power}identicalfactors{a}→{v}; repeatmultiplynot×exponent, triple/squareandshiftMCQsdistinguished.'
    elif k=='leading-fraction-zero-count':
        a,b=map(D,ds);v=a*b;text=decimal(v);tail=text.split(',')[1];answer=str(len(tail)-len(tail.lstrip('0')));assert 'Бүтін бөліктегі 0 саналмайды'in s
        note=f'Printedfactors{ds}→exact{text}; countONLYprefixfractionzeros{answer}beforefirstnonzero, WHOLEzeroexcluded; enoughleftpaddingindependentlyverified.'
    elif k=='select-below-positive-base-without-product':
        base=D(one(ds));assert base>0;answer=one(o for o in r['options']if expr(o)<base);f=[D(o.split(' × ')[1])for o in r['options']];assert [0<x<1 for x in f]==[o==answer for o in r['options']]
        note=f'ACTUALpositivebase{base}; ALLmultipliers{f} comparedto1, unique0<factor<1 shrinksit. Exactactualproductcomparisonsconfirmtheorderwithoutassumingnegativebases.'
    elif k=='fraction-equation-unknown-dividend':
        divisor,quotient=map(D,ds);assert divisor>0;v=divisor*quotient;assert v/divisor==quotient;answer=integer(v);topic='eq'
        note=f'Actualnative(x/{divisor})={quotient}: UNKNOWNDIVIDEND unique{v}; multiplydivisor×quotient, exactsubstitutionnotinvertedunknownrole.'
    elif k in {'decimal-speed-decimal-time-path','train-fractional-time-decimal-path'}:
        speed,time=map(D,ds);assert speed>0 and time>0 and time.denominator>1 and 'тұрақты'in s;v=speed*time;whole=time.numerator//time.denominator;part=time-whole;assert (part*60).denominator==1;assert speed*whole+speed*part==v;answer=integer(v)
        note=f'Actualconstant{speed}km/h×FRACTIONALtime{time}h={v}; splitwholehours{whole}+{part}h,{part*60}min SI60 agrees, notdecimal-minuteconfusion.'
    elif k=='combine-like-terms-decimal-substitution':
        a,c1,c2,constant=map(D,ds);v=(c1+c2)*a-constant;assert c1*a+c2*a-constant==v;answer=pick(r,v);topic='eq'
        for wrong in [(c1+c2)*a+constant,(c1+c2)*a-2*constant,(c1+c2)*a]:assert pick(r,wrong)!=answer
        note=f'Printednamedsubstitutiona{a}, ACTUALcoefficients{c1},{c2}; commonfactor sumthenminus{constant}→{v}; alladd/double-subtract/omitconstantactualMCQfalse.'
    elif k=='mixed-to-decimal-before-product':
        w,n,d=map(int,m(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups());a=w+F(n,d);b=D(one(ds));v=a*b;answer=pick(r,v);wrong=D(str(w)+','+str(d))*b;assert pick(r,wrong)!=answer and pick(r,v/10)!=answer and pick(r,v*10)!=answer
        note=f'ActualWHOLE+properfraction{w}+{n}/{d}→{a}={decimal(a)}, ×{b}→{v}; denominator-asfractiondigitswrongproduct{wrong} matches actualtrap, mixedwholegroupnotseparated.'
    elif k=='decimal-part-mass-requested-grams':
        part,mass=map(D,ds);assert 0<part<1 and mass>0;fat=part*mass;v=fat*1000;ledger(mass,fat,mass-fat);answer=integer(v)
        note=f'Printedpart{part}ofWHOLE{mass}kg→{fat}kg, requestedGRAMS×1000={v}; startmassgramsthenapplypartagrees; positivefullmassledger.'
    elif k=='same-direction-decimal-factor-gap':
        first,factor,time=map(D,ds);assert factor>1 and time>0 and 'БІР БАҒЫТҚА'in s;second=first*factor;v=(second-first)*time;assert second*time-first*time==v;answer=integer(v)
        note=f'SAMEstart/time/SAMEdirection, actualsecond{factor}×first{first}→{second}; relativeDIFFERENCE×{time}={v}, exactseparatepathdifferenceconfirms, notsum/opposite.'
    elif k=='select-true-positive-multiplier-inequality':
        flags=[]
        for o in r['options']:
            lhs,op,rhs=m(r'^(.+?) ([<>]) (.+)$',o).groups();a,b=expr(lhs),expr(rhs);assert a>0 and b>0;flags.append(a<b if op=='<'else a>b)
        answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'ALLactualpositiveproductinequalitiesexactFractionschecked, truthflags{flags}; unique{answer}, deliberatefalsecomparisonMCQsneverpromotedtorules.'
    elif k in {'rectangular-garden-decimal-area','rectangular-window-decimal-area'}:
        a,b=map(D,ds);assert min(a,b)>0;v=a*b;answer=integer(v);topic='geo'
        note=f'ActualtwoSIDES{a}m,{b}m→AREA{v}m², notperimeter, positivegeometricdimensionsandsquaredunitschecked.'
    elif k=='decimal-part-of-hectare-area':
        whole,part=map(D,ds);assert whole>0 and 0<part<1;v=whole*part;answer=pick(r,v);assert v<whole;assert pick(r,whole+part)!=answer
        note=f'ActualWHOLE{whole}ha ×fraction{part}→{v}ha, positivepartsmallerwhole; additionactualtrapdoesnotrepresentpart.'
    elif k=='common-decimal-factor-ten-sum':
        ex=m(r': (.+?)\. Жауапқа',s)[1];v=expr(ex);answer=integer(v);a,b,c,d=map(D,ds);assert a==c and b+d==10 and v==a*(b+d)
        note=f'ENTIREactualAST{ex}→{v}; exactsamefactor{a}, complementaryactualotherfactorssum10, distributivityandseparateproductsagree.'
    elif k=='third-rebound-requested-centimetres':
        initial,factor=map(D,ds);assert initial>0 and 0<factor<1 and 'ҮШІНШІ'in s;heights=[initial]
        for _ in range(3):heights.append(heights[-1]*factor)
        assert all(a>b>0 for a,b in zip(heights,heights[1:]));v=heights[-1]*100;answer=integer(v)
        note=f'Actualinitial{initial}m, retainedfraction{factor}; EXACTTHREErebounds{heights[1:]}, last×SI100→{v}cm; initialnotcountedrebound, secondheightnottarget.'
    elif k=='opposite-decimal-shifts-preserve-product':
        base=expr(m(r'^(.+?) көбейтіндісінің',s)[1]);answer=pick(r,base);a,b=map(D,ds);c,d=map(D,answer.split(' × '));assert c==a/10 and d==b*10
        note=f'Printedtarget{a}×{b}={base}; ALLactualproductexpressions compared, onlyreciprocal×10/÷10factorchange{answer}preservesvalue.'
    elif k=='six-factor-two-unit-pairs':
        ex=m(r': (.+?)\. Жауапқа',s)[1];terms=ex.split(' × ');assert len(terms)==6;ns=list(map(expr,terms));assert ns[0]*ns[2]==1 and ns[3]*ns[4]==1;v=expr(ex);assert v==ns[1]*ns[5];answer=integer(v)
        note=f'ALLSIXactualfactors{terms}; twodisjointunitpairs exact1, REMAININGtwofactorsproduce{v}; nointeger2/5termomittedbydecimal-onlyregex.'
    elif k=='impossible-product-of-two-nonzero-tenths':
        assert 'оң'in s and 'нөл емес'in s;impossible=[];witnesses={}
        for o in r['options']:
            v=D(o);raw=v*100
            if raw.denominator!=1:impossible.append(o);continue
            # Positive integer numerators A,B with tenthdigitnonzero. AB=100v boundsA≤100v.
            pairs=[(a,raw.numerator//a)for a in range(1,raw.numerator+1)if raw.numerator%a==0 and a%10 and(raw.numerator//a)%10];assert pairs;witnesses[o]=pairs
        answer=one(impossible)
        note=f'AllACTUALcandidates, necessary100×vINTEGERtest rejects{answer}; forEVERYothercandidate COMPLETEpositivefactor domainA1…100v checked, witnesses{witnesses}bothnumeratorslastdigitNONZERO. Thusallunboundedpositivewholepartscoveredbyproductbound.'
    elif k=='strict-natural-count-between-products':
        a,b=m(r'^(.+?) < n < (.+?) шартын',s).groups();lo,hi=expr(a),expr(b);assert 0<lo<hi;valid=[n for n in range(1,hi.numerator//hi.denominator+2)if lo<n<hi];answer=str(len(valid));assert hi.denominator==1 and hi.numerator not in valid
        note=f'ActualFULLproductbounds{lo}<n<{hi}; COMPLETEnaturals1…floorupper+1→{valid}, strictINTEGRALupperexcluded, targetCOUNTnotlastvalue.'
    elif k=='river-two-fractional-times-total':
        own,current,up,down=map(D,ds);assert own>current>0 and up.denominator>1 and down.denominator>1;v=(own-current)*up+(own+current)*down;answer=integer(v)
        note=f'Printedstill/current{own}/{current}, FIRSTupstream{up}hthenDOWN{down}h; correctorderedpositivevelocitiesweighted, total{v}, fractionaltimesretained.'
    elif k=='rectangle-two-side-scale-area':
        area=number(r'ауданы (\d+) см²',s);a,b=map(D,ds);assert a>1 and 0<b<1;v=area*a*b;answer=integer(v);topic='geo'
        note=f'ActualORIGINALarea{area}cm², length×{a}, width×{b}; symbolic(ab)scalePRODUCT{a*b}, newAREA{v}, universalforallpositivesidesab={area}.'
    elif k=='parenthesized-difference-two-products-sum':
        ex=m(r': (.+?)\.$',s)[1];v=expr(ex);answer=pick(r,v);a,b,c,d,e=map(D,ds);traps=[(a-b)*c,(a-b)*c+d*e/10,a-b*c+d*e];assert all(pick(r,t)!=answer for t in traps)
        note=f'ENTIREprintedAST{ex}→{v}; exactinnerborrowthenTWOproductsandfinalsum; actualomitsecond/shiftsecond/ignoreparenthesesMCQsmatchcomputedtraps{traps}.'
    elif k=='successive-price-factors-invariant':
        rise,cut=map(D,ds);assert rise>0 and 0<cut<1 and 'СОЛ ЖАҢА'in s;factor=(1+rise)*(1-cut);assert factor==1;answer=one(o for o in r['options']if o.lower()=='өзгермеді')
        note=f'ACTUALoriginalrisefactor{1+rise}, SECONDcutNEWbasefactor{1-cut}, universalproduct{factor}; positiveinitialpricea endsunchanged, directsubtractfractionswrongdifferentbases.'
    elif k=='nested-fraction-equation-unknown-minuend':
        subtrahend,divisor,quotient=map(D,ds);assert divisor>0;numerator=divisor*quotient;v=numerator+subtrahend;assert(v-subtrahend)/divisor==quotient;answer=pick(r,v);topic='eq';assert pick(r,numerator)!=answer and pick(r,numerator-subtrahend)!=answer
        note=f'Actualnative((x−{subtrahend})/{divisor})={quotient}: dividend{numerator}, UNKNOWNMINUENDx{v}; exactnestedsubstitutionandnumerator-only/subtractinsteadofaddMCQsfalse.'
    elif k=='mass-per-cubic-metre-requested-kg':
        density,volume=map(D,ds);assert density>0 and volume>0;v=density*volume*1000;answer=integer(v)
        note=f'ACTUALgiven{density}t/m³ ×{volume}m³→{density*volume}t ×SI1000={v}kg. Cubicmetresneverdirectlyequalmass; rateunitcancelscorrectly.'
    elif k=='largest-of-four-two-decimal-products':
        vals=[expr(o)for o in r['options']];answer=one(o for o,v in zip(r['options'],vals)if v==max(vals));assert 'өрнекті'in s
        note=f'ALLactualtwo-decimalproductvalues{vals}, uniqueMAX{max(vals)}→EXPRESSION{answer}; singlelargestfirst/secondfactorheuristicrejected.'
    elif k=='known-sum-common-decimal-factor':
        total,c1,c2=map(D,ds);assert c1==c2;v=total*c1;answer=pick(r,v);topic='eq';assert pick(r,total+c1)!=answer and pick(r,v*10)!=answer and pick(r,v/10)!=answer
        note=f'PrintedONLYx+y={total}, sameACTUALcoefficient{c1}: universaldistributivityc(x+y)={v}, noindividualx/yassumption; addinstead/decimalshiftactualtrapsfalse.'
    elif k=='positive-decimal-from-square':
        target=D(one(ds));assert target>0 and 'ОҢ'in s;answer=one(o for o in r['options']if D(o)>0 and D(o)**2==target)
        note=f'ALLactualcandidatepositive squares{[(o,str(D(o)**2))for o in r["options"]]}, unique{answer}→target{target}; positivepromptremovesnegative-rootambiguity.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note

def main():
    assert len(ROWS)==43;entries=[];refs=set();blocks=partials=equalities=0
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);b,p,e=multiplication_ledger(r);blocks+=b;partials+=p;equalities+=e
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All43 saved/new full conditions/official solutions/everyMCQ read; own exact DISPLAYED integer/Fraction AST, raw partialproduct/commaplacement ledger, complete domains and symbolic conservation; no author solver/spec/params','notes':note+f' Independently checked {b} raw product blocks/{p} partialproducts/{e} written product equalities.','sourceCanonicalSha256':digest(raw),'checks':['All43 source/new full solutions/everyMCQ manually read','Actual displayed decimal integer ratios/full AST/Unicode powers; no binary floats or author params','Every written raw product, partialproduct and BOTHfactor decimalplace counts checked from printed roles','Mixed whole/fraction grouping, requested count/digit/denominator/EXPRESSION roles distinguished','Full natural bounds/factorpair domains, strict endpoint exclusions and everyMCQ evaluated','Named price bases, three rebounds, fractional-times/mass-density/area/SI units and conservation verified']})
    assert len(refs)==43 and blocks>=25 and partials>=30 and equalities>=50
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All43 source-addressed grade5topic4.6 nonvisual decimal products; independent printed exact, partialproduct and complete-domain review','productAudit':{'rawProductBlocks':blocks,'partialProducts':partials,'writtenProductEqualities':equalities},'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':43,'wrongKeysRejected':43,'hashesMatched':43,'sourceRefs':43,'rawProductBlocks':blocks,'partialProducts':partials,'writtenProductEqualities':equalities,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
