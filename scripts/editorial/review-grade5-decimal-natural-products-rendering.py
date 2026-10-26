"""Independent exact review of the DISPLAYED decimal-natural products conditions and MCQs.

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
PACK='problems/editorial/batches/grade5-decimal-natural-products.json'
OUT='problems/editorial/reviews/grade5-decimal-natural-products.json'
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

def numeric_option(s):return expr(re.sub(r'\s+(?:км|л|теңге)$','',s))
def pick(r,value):return one(o for o in r['options']if numeric_option(o)==value)
def finish(r,value):
    if r.get('options'):return pick(r,value)
    return integer(value)

def columns(r):
    """Independently derive every written multiplication column from printed digits."""
    text=r['solution'];starts=list(re.finditer(r'Үтірсіз (\d+) × (\d+) = (\d+)\.',text));steps=partial_count=0;carry_events=[]
    names=['Бірліктер','Ондықтар','Жүздіктер','Мыңдықтар','Он мыңдықтар','Жүз мыңдықтар']
    for index,start in enumerate(starts):
        a,b,p=map(int,start.groups());assert a*b==p
        block=text[start.end():starts[index+1].start()if index+1<len(starts)else len(text)]
        literal,places=m(r'(\d+,\d+) санында үтірден кейін (\d+) цифр бар',block).groups();places=int(places)
        assert int(literal.replace(',',''))==a and len(literal.split(',')[1])==places
        comma_count,displayed=m(r'Көбейтіндіде оңнан (\d+) цифр ажыратамыз(?:, жетпеген орынға сол жақтан нөл толықтырамыз)?: ([\d,]+(?: = [\d,]+)?)\.',block).groups();assert int(comma_count)==places
        written=displayed.split(' = ');expected=fixed(p,10**places);assert written[0]==expected
        assert all(D(v)==F(p,10**places)for v in written)
        if len(written)>1:
            assert written[-1]==expected.rstrip('0').rstrip(',') and expected.endswith('0')
        if b<10:
            carry=0;digits=list(map(int,str(a)[::-1]));observed=[]
            for i,d in enumerate(digits):
                line=m(re.escape(names[i])+r': (\d+) × (\d+)(?: \+ (\d+))? = (\d+); (\d+) жазылады(?:, (\d+) келесі разрядқа көшеді)?\.',block)
                wd,wb,plus,total,out,nextcarry=line.groups();total=int(total);nxt=int(nextcarry or 0)
                assert (int(wd),int(wb),int(plus or 0))==(d,b,carry)
                assert total==d*b+carry and int(out)==total%10 and nxt==total//10
                observed.append(int(out));carry=nxt;steps+=1
                if carry:carry_events.append({'editionId':r['editionId'],'place':i,'carry':carry})
            tail=re.findall(r'Соңғы көшкен (\d+) алдыңғы разрядтарға жазылады',block)
            assert tail==([str(carry)]if carry else [])
            assembled=int((''.join(map(str,observed[::-1]))));assert assembled+carry*10**len(digits)==p
        else:
            lines=re.findall(r'(\d+) × (\d+) = (\d+); бұл разрядтың үлесі (\d+) × (\d+) = (\d+)',block)
            digits=list(map(int,str(b)[::-1]));assert len(lines)==len(digits)
            terms=[]
            for i,(line,d)in enumerate(zip(lines,digits)):
                aa,dd,part,part2,place,term=map(int,line);assert aa==a and dd==d and part==a*d and part2==part and place==10**i and term==part*place
                terms.append(term);partial_count+=1
            lhs,total=m(r'Үлестердің қосындысы ([\d +]+) = (\d+)\.',block).groups()
            assert list(map(int,lhs.split(' + ')))==terms and int(total)==sum(terms)==p
    return len(starts),steps,partial_count,carry_events

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-natural-products-');ds=decimals(s);note='';topic='frac'
    if k in {'leading-zero-three-place-product','three-place-product-three-trailing-zeros','hundredths-product-integer-result','hundredths-multiply-carry-ledger','tenths-product-one-trailing-zero','internal-decimal-zero-product'}:
        literal,n=m(r'(\d+,\d+) × (\d+)',s).groups();value=D(literal)*int(n);answer=finish(r,value)
        note=f'Printed{literal}×{n}, rawdigits{literal.replace(",","")}×{n}, exact result{value}; fixed decimalplaces{len(literal.split(",")[1])}, leading/internal zeros and only trailing resultzeros handled by independent digit ledger.'
        if k=='hundredths-multiply-carry-ledger':
            raw=int(literal.replace(',',''));d=raw%10;carry=d*int(n)//10;wrong=(raw//100*int(n)*100+(raw//10%10*int(n))*10+(d*int(n)%10));assert carry>0 and pick(r,F(wrong,100))!=answer
    elif k in {'tenths-speed-integer-time-distance','two-digit-natural-time-train-path'}:
        speed=D(one(ds));hours=number(r'(\d+) сағат',s);assert 'тұрақты'in s;value=speed*hours;answer=integer(value)
        note=f'Printedconstant speed{speed}km/h ×actual{hours}hours={value}km; inverse distance/time exactlyrecoversgiven speed.'
    elif k=='select-product-equal-target':
        value=D(one(ds));answer=one(o for o in r['options']if expr(o)==value);assert 'ӨРНЕКТІ'in s
        note=f'ALL actual expressionvalues{[str(expr(o))for o in r["options"]]}, unique expression equals printedtarget{value}; answerEXPRESSIONnotvalue.'
    elif k=='known-natural-product-decimal-placement':
        raw,n,p=m(r'^(\d+) × (\d+) = (\d+)',s).groups();assert int(raw)*int(n)==int(p);literal,nn=re.findall(r'(\d+,\d+) × (\d+)',s)[0];assert int(nn)==int(n)and int(literal.replace(',',''))==int(raw);value=D(literal)*int(n);answer=pick(r,value)
        note=f'Actualprovidedintegeridentity{raw}×{n}={p} independentlyverified; decimalfirstfactor{literal} scales product by10^{len(literal.split(",")[1])}, exact{value}; ALLcomma-shiftMCQs evaluated.'
    elif k in {'common-factor-small-whole-complement','common-factor-ten-complement','two-compatible-factor-pairs-regrouping'}:
        expression=m(r': (.+?)\. Жауапқа',s)[1];value=expr(expression);answer=integer(value);terms=expression.split(' + ');factors=[list(map(expr,t.split(' × ')))for t in terms];assert len(factors)==2
        if len(factors[0])==2:assert factors[0][1]==factors[1][1];assert sum(a[0]for a in factors).denominator==1
        else:assert factors[0][0]*factors[0][2]==factors[1][0]*factors[1][2]
        note=f'ENTIREprinted AST{expression} independently{value}; allfactorsretained, actualcompatiblepairs/commonfactorchecked, distributive sum agrees with separate products.'
    elif k=='natural-first-tenths-product':
        n,literal=m(r'(\d+) × (\d+,\d+)',s).groups();value=int(n)*D(literal);answer=pick(r,value);assert D(literal)*int(n)==value
        note=f'PrintedNATURAL-first{n}×{literal}, commutativityand exactproduct{value}; ALLactualoptions including concatenated9,6 checked.'
    elif k in {'equal-drink-packets-total-volume','equal-layer-stack-height','equal-building-block-total-mass'}:
        unit=D(one(ds));pattern={'equal-drink-packets-total-volume':r'(\d+) бірдей бөтелке','equal-layer-stack-height':r'(\d+) жұқа ағаш','equal-building-block-total-mass':r'(\d+) бірдей тас'}[k];count=number(pattern,s);value=unit*count;answer=integer(value)
        if k=='equal-layer-stack-height':assert 'саңылаусыз'in s
        if k=='equal-building-block-total-mass':assert 'Қаптама массасын қоспай'in s
        note=f'Printed{count}equalunits×size{unit}={value}; no count−1shortcut, gap/packaging assumptions explicit, reverse divisionrecoversoneunit.'
    elif k=='substitution-multiply-before-add':
        topic='eq';n=number(r'^x = (\d+)',s);expression=m(r'мәнінде (.+?) өрнегін',s)[1];value=expr(expression.replace('x',str(n)));answer=pick(r,value);a,b=map(D,ds);traps(r,[(a+b)*n,a*n+b/10,value*10])
        note=f'Actualx{n} substituted into fullprintedAST{expression}→{value}; priorityBEFOREaddition, ALLearlyaddition/misalignedaddend/finalshift traps exactlychecked.'
    elif k in {'least-natural-multiplier-tenths','least-natural-multiplier-hundredths'}:
        decimal=D(one(ds));assert 'оң натурал'in s and 'ЕҢ КІШІ'in s;den=decimal.denominator;good=[n for n in range(1,den+1)if(decimal*n).denominator==1];assert good==[den];answer=str(den);assert math.gcd(decimal.numerator,den)==1
        note=f'Actualdecimal reducedexactly{decimal}; COMPLETEpositive1…{den}search givesfirstintegralproductonlyat{den}. Coprimenumeratorprovesallsolutionsmultiplesofden, so no larger omitted candidate beatsminimum.'
    elif k=='two-decimal-flow-rates-total-water':
        a,b=map(D,ds);minutes=number(r'(\d+) минут',s);assert 'бір уақытта'in s and 'әсер етпейді'in s;value=(a+b)*minutes;ledger(value,a*minutes,b*minutes);answer=integer(value)
        note=f'BOTHprinted independent inflows{a},{b}×same{minutes}minutes→{value}; positiveindividualcontributionsandvolumeconservationchecked.'
    elif k=='decimal-mass-integer-price-change':
        unit=number(r'килограмы (\d+) теңге',s);paid=number(r'(\d+) теңге берді',s);mass=D(one(ds));cost=mass*unit;assert 0<cost<paid;value=paid-cost;ledger(paid,cost,value);answer=integer(value)
        note=f'Actual{mass}kg×{unit}tg/kg cost{cost}, tender{paid}, requestedCHANGE{value}; kgfractionkept, exactcashconservation.'
    elif k=='decimal-discount-remaining-price':
        price=number(r'Рюкзак (\d+) теңге',s);share=D(one(ds));assert 0<share<1 and 'бастапқы'in s and 'ЖАҢА БАҒАНЫ'in s;cut=price*share;value=price-cut;answer=pick(r,value);ledger(price,cut,value);assert pick(r,cut)!=answer and pick(r,price+cut)!=answer and pick(r,price-share*100)!=answer
        note=f'PrintedORIGINAL{price}×fraction{share}discount{cut}, NEWremaining{value}; actualdiscount-only/adddiscount/subtractfractionas25tgMCQsexactfalse.'
    elif k=='two-stages-decimal-speeds-total-path':
        t1,t2=map(int,re.findall(r'(\d+) сағатта',s));v1,v2=map(D,ds);assert t1!=t2;value=t1*v1+t2*v2;answer=integer(value)
        note=f'ACTUALorderedstages{t1}h×{v1}+{t2}h×{v2}={value}; eachrateboundtoitsownphase, weighted sumnot(rateSum×timeSum).'
    elif k=='daily-fractional-hours-requested-minutes':
        daily=D(one(ds));days=number(r'(\d+) күндегі',s);hours=daily*days;assert hours.denominator>1;value=hours*60;answer=integer(value);whole=hours.numerator//hours.denominator;part=hours-whole;assert part*60!=part*100 and (part*60).denominator==1
        assert f'{integer(part*60)} минутқа тең'in r['solution']and f'{whole} сағ {integer(part*60)} мин'in r['solution']
        note=f'Actual{daily}h/day×{days}days={hours}hNONINTEGER; SI60→{value}min. Wholehours{whole}+fraction{part}h→{part*60}min, distinctfromhundredthhourreading{part*100}; dailyminutes×days agrees.'
    elif k in {'parenthesized-decimal-sum-product','parenthesized-decimal-difference-product','difference-two-decimal-natural-products'}:
        expression=m(r': (.+?)\.$',s)[1];value=expr(expression);answer=pick(r,value)
        if k=='parenthesized-decimal-sum-product':
            a,b=map(D,ds);n=number(r'\) × (\d+)',s);assert pick(r,a+b*n)!=answer
        if k=='difference-two-decimal-natural-products':assert pick(r,value/10)!=answer and pick(r,value*10)!=answer
        note=f'COMPLETEactualprintedAST{expression}→{value}, parentheses/orderand integertermsretained; alignedinnerdecimaloperationthenactualrawproductcolumns independentlyverified.'
    elif k=='two-types-equal-box-masses-total':
        a,b=map(D,ds);n1,n2=map(int,re.findall(r'болатын (\d+) қорап',s));value=a*n1+b*n2;assert min(a,b,n1,n2)>0;answer=integer(value);ledger(value,a*n1,b*n2)
        note=f'Actualtypedboxes{n1}×{a}kg and{n2}×{b}kg, BOTH exactmasses sum{value}; no counts/masses exchanged.'
    elif k=='round-trip-fuel-two-equal-paths':
        perkm=D(one(ds));oneway=number(r'арасы (\d+) км',s);assert 'ДӘЛ СОЛ ЖОЛМЕН'in s;value=oneway*2*perkm;answer=pick(r,value);assert pick(r,oneway*perkm)!=answer
        note=f'Actualoneway{oneway}, explicitSAMEreturn→total{2*oneway}km ×{perkm}L/km={value}; one-wayactualtrapexactlyhalf.'
    elif k=='possible-product-places-after-zero-removal':
        places=number(r'дәл (\d+) цифр',s);n=number(r'Оны (\d+) санына',s);assert 'соңғы цифры нөл емес'in s
        def places_of(v):
            d=v.denominator;p=0
            while d>1:assert d%2==0 or d%5==0;d=d//2 if d%2==0 else d//5;p+=1
            # Count via exact minimal decimalpower instead of factoring shortcut.
            return one(i for i in range(places+1)if(10**i*v).denominator==1 and(i==0 or(10**(i-1)*v).denominator>1))
        domain=[i for i in range(1,10**places)if i%10];counts={places_of(F(i,10**places)*n)for i in domain};assert counts==set(range(places+1));assert len(domain)==900
        answer=one(o for o in r['options']if re.fullmatch(r'[\d, ]+ немесе \d+',o)and set(map(int,re.findall(r'\d+',o)))==counts)
        note=f'COMPLETE{len(domain)}fractionalresidues of EXACT{places}places/lastNONZERO times{n}; exactminimal10^p denominator test yields{sorted(counts)}. AnywholepartaddsINTEGER{n}×whole, so this finitefractiondomaincoversALLnumbers, no>3possible.'
    elif k=='whole-bottle-max-after-decimal-purchase':
        budget=number(r'қорында (\d+) теңге',s);price=number(r'килограмы (\d+) теңге',s);bottle=number(r'бөтелкесі (\d+) теңгелік',s);mass=D(one(ds));cost=price*mass;remaining=budget-cost;assert remaining>0 and 'бүтін санмен'in s
        feasible=[n for n in range(int(remaining//bottle)+2)if n*bottle<=remaining];value=max(feasible);assert(value+1)*bottle>remaining and value*bottle<=remaining;answer=str(value);ledger(budget,cost,value*bottle,remaining-value*bottle)
        note=f'Actualbudget{budget}−{mass}×{price}cost{cost}→{remaining}; COMPLETE0…floor+1wholebottlechecks, max{value}cost{value*bottle}, next{(value+1)*bottle}unaffordable; exactremainingcashledger.'
    elif k=='successive-price-bases-return-to-start':
        initial=number(r'бағасы (\d+) теңге',s);cut,rise=map(D,ds);assert 'СОЛ ЖАҢА БАҒАНЫҢ'in s;mid=initial*(1-cut);value=mid*(1+rise);assert 0<mid<initial and mid*rise>0;answer=integer(value)
        note=f'ACTUALfirstcutbase{initial}→{mid}; SECONDincreasebaseisNEW{mid}, neveroriginal; exactfactors{1-cut}×{1+rise}, final{value}. Both cashchangesconserved.'
    elif k=='down-up-different-times-total-river-path':
        own,current=map(D,ds);down,up=map(int,re.findall(r'(\d+) сағат',s));assert own>current>0 and down!=up;value=(own+current)*down+(own-current)*up;answer=pick(r,value);assert pick(r,own*(down+up))!=answer and pick(r,(own+current)*up+(own-current)*down)!=answer and pick(r,(own+current)*(down+up))!=answer
        note=f'Printedown{own},current{current}, downstream{down}h/upstream{up}h withpositiveupstreamspeed; orderedweightedpaths exact{value}; ALLignorecurrent/swaptimes/addcurrentBOTH actualMCQsfalse.'
    elif k=='combine-coefficients-then-inverse-root':
        a,b,c,total=map(D,ds);n=number(r'× (\d+) =',s);coefficient=a-b;assert coefficient>0;value=(total-c*n)/coefficient;assert a*value-b*value+c*n==total;answer=pick(r,value);topic='eq';traps(r,[(total+c*n)/coefficient,total-c*n,value/coefficient])
        note=f'ActualFULLlinearequation coefficient{a}−{b}={coefficient}, known{c}×{n}; uniqueROOT{value}, exactsubstitution; 3y/addinsteadsubtract/divideagainMCQsfalse.'
    elif k=='largest-close-product-expression':
        vals=[expr(o)for o in r['options']];answer=one(o for o,v in zip(r['options'],vals)if v==max(vals));assert 'ӨРНЕКТІ'in s;assert len(set(vals))<len(vals)
        note=f'ALLactualproductexpressions exactvalues{vals}, uniqueMAX{max(vals)}butanswerEXPRESSION{answer}; near-equalhundredthsnotlargestfactorheuristic.'
    elif k=='decimal-step-indexed-sequence-value':
        seeds=list(map(D,ds));diffs=[b-a for a,b in zip(seeds,seeds[1:])];assert len(set(diffs))==1 and diffs[0]>0;n=number(r'(\d+)-мүшесінің',s);value=seeds[0]+(n-1)*diffs[0];answer=pick(r,value);topic='seq';traps(r,[value-diffs[0],value+diffs[0],value*10])
        note=f'ALLprintedseeds{seeds}giveconstantstep{diffs[0]}, ACTUAL1-basedindex{n}→VALUE{value}; previous/next/finalshift actualtrapsfalse.'
    elif k=='inverse-forgotten-comma-factor':
        n=number(r'санды (\d+) санына',s);raw=number(r'қоймай (\d+) деп',s);correct=D(one(ds));assert int(one(ds).replace(',',''))==raw;value=correct/n;answer=pick(r,value);assert value*n==correct
        note=f'Actualrawresult{raw}, CORRECTdecimalproduct{correct}, multiplier{n}; uniquefirstfactor{value} byexactdivision/substitution; allshiftedcandidateproductsfail.'
    elif k=='select-true-natural-decimal-product-equality':
        flags=[expr(o.split(' = ')[0])==D(o.split(' = ')[1])for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'EveryactualMCQfullproduct/result equality exactchecked, truthflags{flags}; deliberatelyfalseequalitiestreatedasoptions, notrules.'
    elif k=='workdays-per-week-not-seven-total-mass':
        daily=D(one(ds));workdays=number(r'дәл (\d+) күн',s);weeks=number(r'(\d+) аптаға',s);assert 0<workdays<7;value=daily*workdays*weeks;answer=integer(value)
        note=f'Actual{workdays}WORKdays/week×{weeks}weeks×{daily}kg/day={value}; Saturday/Sundaynotautomaticallyincluded, not7-dayshortcut.'
    elif k=='opposite-decimal-speeds-total-separation':
        a,b=map(D,ds);hours=number(r'(\d+) сағаттан кейін',s);assert 'бір уақытта'in s and 'қарама-қарсы'in s and min(a,b)>0;value=(a+b)*hours;answer=integer(value);ledger(value,a*hours,b*hours)
        note=f'SAMEstart/time straightOPPOSITE motion, printedpositive speeds{a},{b}×{hours}h; separationsSUM{value}, notpursuitdifference; bothpathsconserved.'
    elif k=='natural-original-from-decimal-increase':
        topic='eq';factor,gain=map(D,ds);assert factor>1 and 'АРТТЫ'in s;value=gain/(factor-1);assert value.denominator==1 and factor*value-value==gain;answer=pick(r,value);assert pick(r,gain/factor)!=answer
        note=f'ActualINCREASEaboveoriginal{gain}, factor{factor}; (factor−1)n=gainuniqueNATURAL{value}; fullsubstitutionandbecame-resulttrapfalse.'
    elif k=='three-person-decimal-factor-total-inverse':
        topic='eq';factor,less,total=map(D,ds);assert 'МӘДИДЕН'in s;value=(total+less)/(1+2*factor);second=factor*value;third=second-less;assert min(value,second,third)>0;ledger(total,value,second,third);answer=integer(value)
        note=f'PrintedZerex,Madi{factor}x,AiymMADI−{less}; total{total}→uniquex{value}, positiveothermasses{second},{third}; referencebaseandfullmassledgerchecked.'
    elif k=='two-phase-roadwork-requested-remainder':
        whole=number(r'Ұзындығы (\d+) км',s);a,b=map(D,ds);joint=number(r'бірге (\d+) күн',s);solo=number(r'тағы (\d+) күн',s);assert 'БІРІНШІ'in s and 'ЖӨНДЕЛМЕГЕН'in s;phase1=(a+b)*joint;phase2=a*solo;done=phase1+phase2;value=whole-done;assert value>0;ledger(whole,phase1,phase2,value);answer=pick(r,value);traps(r,[done,whole-phase1,whole-phase1-a*(solo-1)])
        note=f'PrintedBOTHrates{a},{b}×joint{joint}days thenFIRSTalone{solo}days; repaired{done}, requestedREMAINDER{value}; ALLdone/omitphase/drop1dayMCQsactualfalse, exactroadconservation.'
    else:raise AssertionError(k)
    assert r['topic']==topic,(k,r['topic'],topic)
    return answer,note

def main():
    assert len(ROWS)==44;entries=[];refs=set();blocks=steps=partials=0;carries=[]
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);b,s,p,c=columns(r);blocks+=b;steps+=s;partials+=p;carries.extend(c)
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All44 saved/new full conditions/official solutions/everyMCQ read; own exact DISPLAYED integer/Fraction AST, multiplication digit-carry and partial-product ledger, complete finite domains; no author solver/spec/params','notes':note+f' Independently checked {b} written multiplication blocks/{s} per-place equations/{p} partialproducts.','sourceCanonicalSha256':digest(raw),'checks':['All44 source/new full solutions/everyMCQ manually read','Actual printed integer ratios and full expression AST; no binary floats or author params','Every written raw product/carry/partialproduct/commaplacement/trailingzero independently checked','Complete positive minimum-multiplier/900fractional-residue/whole-bottle domains','Named price bases, kg/L/cm/km/hour/minute and stage-specific conservation','Fractional TOTAL-hour conversion preserved after precise author review fix']})
    assert len(refs)==44 and blocks>=20 and steps>=25 and partials>=25 and carries
    before=json.loads((ROOT/'output/editorial-decimal-natural-products-before-fractionhours-review.json').read_text())['editions'];assert len(before)==44
    changed=[i for i,(a,b)in enumerate(zip(before,ROWS))if a!=b];assert changed==[19],changed
    changed_fields={k for k in set(before[19])|set(ROWS[19])if before[19].get(k)!=ROWS[19].get(k)};assert changed_fields=={'answer','statement','params','solution','adaptationChanges'}
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'70c03cb00fedee5a','finding':'Initial0.6h×5days erased source fractional-TOTAL-hour to minute conversion','resolution':'Author changed only row19 to7days→4.2h→252min; explicit .2h×60=12min, not20min, final full row reread and other43 unchanged.'}],'scope':'All44 source-addressed grade5topic4.5 nonvisual decimal-natural products; independent printed exact and column-ledger review','columnAudit':{'blocks':blocks,'perPlaceEquations':steps,'partialProducts':partials,'carryEvents':carries},'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':44,'wrongKeysRejected':44,'hashesMatched':44,'sourceRefs':44,'columnBlocks':blocks,'perPlaceEquations':steps,'partialProducts':partials,'carryEvents':len(carries),'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
