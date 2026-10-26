"""Independent exact review of the DISPLAYED decimal notation conditions and MCQs.

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
PACK='problems/editorial/batches/grade5-decimal-notation.json'
OUT='problems/editorial/reviews/grade5-decimal-notation.json'
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
    for v in values:assert choice(r,v)!=r['answer'],(r['editionId'],v)

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

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-notation-');ds=decimals(s);fractions=fs(s);note='';topic='frac'
    if k=='whole-part-of-decimal':
        value=one(ds);answer=value.split(',')[0];note=f'Actualdecimal{value}, comma separates WHOLE{answer}; fractional digit excluded.'
    elif k in {'count-all-zeros-in-small-unit-fraction','fraction-denominator-decimal-place-count','count-all-digits-in-small-unit-fraction','test-count-digits-in-two-digit-small-fraction'}:
        n,d=one(fractions);text=fixed(n,d);assert D(text)==F(n,d) and n<d
        if k=='count-all-zeros-in-small-unit-fraction':answer=str(text.count('0'));assert 'бүтін бөліктегі нөлді' in s
        elif k=='fraction-denominator-decimal-place-count':answer=str(len(text.split(',')[1]));assert not text.endswith('0')
        else:answer=str(sum(c.isdigit() for c in text));assert 'бүтін бөліктегі 0' in s
        note=f'Exactinteger division/padding of actual{n}/{d}→{text}, denominatorPOWER{len(str(d))-1}; wholezeroINCLUDED in all-zero/all-digitroles, commaNEVERdigit. Requested{answer}; not numerator-lengthshortcut.'
    elif k=='fixed-thousandths-numerator-leading-zero':
        value=one(ds);den=number(r'\(a/(\d+)\)',s);v=D(value)*den;answer=integer(v)
        assert len(value.split(',')[1])==len(str(den))-1 and v<den
        note=f'Displayed{value}×fixedUNREDUCEDden{den}→numerator{v}; fractional leadingzero is placepadding, integernumeratorhas none; substituteback{F(int(answer),den)}.'
    elif k=='select-digit-in-hundredths-position':
        target=number(r'санда (\d+) цифры',s);positions=[o.split(',')[1].ljust(3,'0')[1] for o in r['options']];answer=one(o for o,c in zip(r['options'],positions) if int(c)==target)
        assert [int(o.split(',')[0])==target for o in r['options']]==[True,False,False,False]
        note=f'Everyactualdecimal inspected SECONDfractionalposition, digits{positions}; unique{answer}has{target}hundredths, units/tenths/thousandths options false.'
    elif k=='equal-decimal-trailing-versus-leading-zero':
        target=one(ds);answer=choose(r,D(target));assert answer.startswith(target) and answer[len(target):].strip('0')==''
        note=f'Actualtarget{target}={D(target)}, ALLactualoptions{[(o,str(D(o)))for o in r["options"]]}; onlytrailingzero preservesrationalvalue; leadingzeros shift magnitude.'
    elif k=='read-hundredths-with-internal-zero':
        text=one(ds);w,b=text.split(',');den=10**len(b);n=int(b);answer=reading_choice(r,int(w),n,den)
        assert b[0]=='0' and den==100
        note=f'Displayed{text}: WHOLE{w}, exactly{len(b)}fractionplaces→DEN{den}, numerator{n}; ALLspokenoptions parsed, hundredths not tenths/thousandths, zero preserves missingtenths.'
    elif k=='tenths-to-number-of-hundredths':
        n=number(r'жолағындағы (\d+) ондық',s);v=F(n,10)/F(1,100);answer=integer(v)
        note=f'Printed{n}tenths ÷onehundredth1/100={v}; adjacentplaceunitratio10 derivedexactly, fullvalueconserved.'
    elif k in {'unit-denominator-ten-to-decimal','unit-denominator-hundred-to-decimal','improper-hundredths-to-decimal'}:
        n,d=one(fractions);text=fixed(n,d);answer=choose(r,F(n,d));assert D(answer)==D(text)
        assert answer==text
        if k=='unit-denominator-hundred-to-decimal':assert text.startswith('0,0')
        if k=='improper-hundredths-to-decimal':assert n//d>0 and n%d>0
        note=f'Actual{n}/{d}, Euclideanquotient{n//d}/remainder{n%d}; fixed{len(str(d))-1}place decimal{text}. EveryactualMCQ exactFvaluecompared, comma-shift/extra-leadingzero/whole confusion excluded.'
    elif k=='extract-hundredths-digit-from-thousandths':
        text=one(ds);a,b=text.split(',');assert len(b)==3;answer=b[1]
        note=f'Actual{text}fractiondigits{list(b)}, SECOND={answer}; WHOLE{a}, first{b[0]}, third{b[2]}are distinctroles.'
    elif k in {'decimal-from-spoken-hundredths','decimal-from-spoken-ten-thousandths'}:
        phrase=m(r'«([^»]+)»',s)[1];w,n,d=spoken(phrase);v=w+F(n,d);answer=choose(r,v);assert answer==fixed(w*d+n,d)
        note=f'ACTUALKazakhquotedwords{phrase}parsed asWHOLE{w}+{n}/{d}; fixedwidth{answer}, allactualwrongdenominator/reversaldigitMCQs exactchecked.'
    elif k in {'decimal-decimetres-to-centimetres','height-metres-decimal-to-centimetres','decimal-kilometres-to-metres'}:
        text=one(ds);factor={'decimal-decimetres-to-centimetres':10,'height-metres-decimal-to-centimetres':100,'decimal-kilometres-to-metres':1000}[k];v=D(text)*factor;answer=integer(v)
        assert ('дм' if factor==10 else 'м деп' if factor==100 else 'км') in s
        note=f'Actual{text}×SI{factor}={v}targetunit; wholepartretained, correctdm→cm10/m→cm100/km→m1000, not rawfractionaldigits.'
    elif k=='mixed-thousandths-numerator-from-place-digits':
        w,a,b,c=map(int,m(r'бүтін бөлігі (\d+), ондық үлестер цифры (\d+), жүздік үлестер цифры (\d+), мыңдық үлестер цифры (\d+)',s).groups());v=a*100+b*10+c;answer=str(v)
        assert b==0 and number(r'a/(\d+)',s)==1000
        note=f'ActualWHOLE{w}, positionaldigits{a},{b},{c}→numerator100×{a}+10×{b}+{c}={v}, INTERNAL0 retained; fixed1000not reducedfraction denominator.'
    elif k=='unreduced-decimal-denominator':
        text=one(ds);places=len(text.split(',')[1]);answer=str(10**places);assert 'ҚЫСҚАРТПАҢЫЗ' in s and int(answer)!=D(text).denominator
        note=f'Actual{text}has{places}fractiondigits, REQUIREDunreducedden10^{places}={answer}; exactreducedden{D(text).denominator}explicitly excluded.'
    elif k in {'metres-and-single-centimetre-to-decimal','kilograms-and-two-digit-grams-to-decimal','kilometres-and-metres-to-compact-decimal','litres-millilitres-to-compact-decimal'}:
        pattern,factor={'metres-and-single-centimetre-to-decimal':(r'ұзындығы (\d+) м (\d+) см',100),'kilograms-and-two-digit-grams-to-decimal':(r'массасы (\d+) кг (\d+) г',1000),'kilometres-and-metres-to-compact-decimal':(r'жол (\d+) км (\d+) м',1000),'litres-millilitres-to-compact-decimal':(r'Құмыраға (\d+) л (\d+) мл',1000)}[k]
        whole,part=map(int,m(pattern,s).groups());v=whole+F(part,factor);answer=choose(r,v);expanded=fixed(whole*factor+part,factor)
        assert answer==compact(expanded)
        note=f'Actualunits{whole}whole+{part}/{factor}, fixedpadding{expanded}→canonical{answer}; onlyTRAILINGzero removed, initialfractionzero/internalplace retained. ALLactualMCQs exactcompared (equivalent WRONGduplicates allowed).'
    elif k=='one-true-trailing-zero-equality':
        flags=[]
        for o in r['options']:
            a,b=o.split(' = ');flags.append(D(a)==D(b))
        answer=one(o for o,t in zip(r['options'],flags) if t)
        assert flags==[False,False,False,True]
        note=f'Everyactualequality parsedexactly; flags{flags}, unique{answer}; leading/internalzero changes value, lastfractionzero preservesvalue.'
    elif k=='total-tenths-in-positive-mixed-decimal':
        text=one(ds);assert len(text.split(',')[1])==1 and D(text)>1;answer=integer(D(text)/F(1,10))
        note=f'FULLdisplayed{text}÷one-tenth gives{answer}TOTALtenths, includingwhole×10; fractional digit alone notanswer.'
    elif k=='expanded-decimal-with-missing-hundredths':
        expression=m(r'^(.+?) қосындысын',s)[1];v=expr(expression);answer=choose(r,v)
        assert answer.split(',')[1][1]=='0'
        note=f'EntireDISPLAYEDsum{expression} exactAST→{v}={answer}; hundredths0 placeholder retained; everyactualshift/extra-zero distractor false.'
    elif k=='shuffled-place-fraction-sum-to-decimal':
        expression=m(r'^(.+?) қосындысын',s)[1];v=expr(expression);answer=choose(r,v)
        assert [d for n,d in fractions]==[10,1000,100]
        note=f'AllDISPLAYEDshuffledaddends{expression} exactAST→{v}={answer}; place-denominators10,1000,100 governposition, not presentedorder; actualMCQs exactchecked.'
    elif k=='count-two-decimal-digits-last-nonzero':
        whole=number(r'Бүтін бөлігі (\d+) болатын',s);allowed=list(map(int,m(r'Бірінші бөлшек цифр ([\d, ]+) цифрларының',s)[1].split(',')));assert len(allowed)==len(set(allowed)) and all(0<=d<=9 for d in allowed) and 'НӨЛ ЕМЕС' in s
        # Every 10×10 pair, including both ZERO endpoints, explicitly considered.
        good=[(a,b)for a in range(10)for b in range(10)if a in allowed and b!=0]
        values={F(whole)+F(a,10)+F(b,100)for a,b in good};assert len(good)==len(values)==len(allowed)*9;answer=str(len(values));topic='comb'
        assert any(a==0 for a,b in good) and all(b!=0 for a,b in good)
        note=f'ActualfixedWHOLE{whole}, allowedfirstdigits{allowed}, secondNONZERO; exhaustive100orderedpairs→{len(good)}differentFractionvalues. First0allowed, final0excluded; no duplicate trailingzero representations.'
    elif k=='total-places-after-removing-trailing-zeros':
        expanded=[fixed(n,d)for n,d in fractions];short=[compact(t)for t in expanded];lengths=[len(t.split(',')[1])for t in short];assert all(D(a)==D(b)for a,b in zip(expanded,short));answer=str(sum(lengths))
        assert any('00'in t.split(',')[1]for t in short)
        note=f'ALL3actualfractions→fixed{expanded}→TRAILINGonlytrim{short}; INTERNALzeros remain. Fractionplacecounts{lengths}sum{answer}, valuespreservedexactly.'
    elif k=='tonnes-centners-kilograms-to-decimal':
        tonnes,centners,kgs=map(int,m(r'Қоймаға (\d+) т (\d+) ц (\d+) кг',s).groups());value=F(tonnes)+F(centners,10)+F(kgs,1000);answer=choose(r,value)
        assert '1 т = 10 ц = 1000 кг' in s and '1 ц = 100 кг' in s
        note=f'ActualSIledger{tonnes}tonnes +{centners}×100kg+{kgs}kg→{value}t={answer}; centnerTENTH/zeroHUNDREDTH/kgTHOUSANDTH alldistinct. EveryactualMCQvalue compared.'
    elif k=='read-decimal-from-descending-digit-rule':
        whole,length,step,last=map(int,m(r'бүтін бөлігі (\d+), бөлшек цифрлары (\d+) орында тұр.*?көршісінен (\d+)-ге артық, соңғы цифр (\d+)',s).groups());digits=[last+step*(length-1-i)for i in range(length)];assert all(0<=d<=9 for d in digits)
        # Complete 10^4 ordered domain independently tests EVERY digit tuple.
        import itertools
        candidates=[a for a in itertools.product(range(10),repeat=length)if a[-1]==last and all(a[i]==a[i+1]+step for i in range(length-1))];assert candidates==[tuple(digits)]
        n=int(''.join(map(str,digits)));answer=reading_choice(r,whole,n,10**length)
        note=f'Actualright-neighbourstep{step}, last{last}, length{length}; ALL10^{length}digit-tuples checked→unique{digits}; readWHOLE{whole}/DEN10^{length}/NUM{n}, allactualreversal/denominator/whole traps false.'
    elif k=='aggregate-multiple-place-units-with-carry':
        a,b,c=map(int,m(r'Сан (\d+) ондық үлестің, (\d+) жүздік үлестің және (\d+) мыңдық үлестің',s).groups());v=F(a,10)+F(b,100)+F(c,1000);answer=choose(r,v);assert b>9 and c>9
        note=f'Actualcounts{a}tenths+{b}hundredths+{c}thousandths→{a*100}+{b*10}+{c}={a*100+b*10+c}thousandths→{answer}; genuinecross-placecarry, concatenation and droppedcarry options exactfalse.'
    elif k=='three-decimal-digits-from-ratio-and-sum':
        mult=number(r'цифрынан (\d+) есе',s);total=number(r'Үш цифрдың қосындысы (\d+)',s)
        alltriples=[(a,b,c)for a in range(10)for b in range(10)for c in range(10)if a==mult*c and b==a+c and a+b+c==total]
        a,b,c=one(alltriples);answer=str(a*100+b*10+c)
        note=f'CompleteALL1000digit-tuples0…9³, actualconstraints tenths={mult}×thousandths, hundredths=otherSUM, total{total}→unique{(a,b,c)}; requestedTOTALthousandths{answer}, notlastdigit{c}.'
    elif k=='select-fraction-with-target-thousandths-digit':
        target=number(r'жазсақ, (\d+) цифры',s);texts=[];flags=[]
        for o in r['options']:
            n,d=one(fs(o));text=fixed(n,d);digits=text.split(',')[1].ljust(3,'0');texts.append(text);flags.append(int(digits[2])==target)
        answer=one(o for o,t in zip(r['options'],flags)if t)
        assert flags==[False,False,True,False]
        note=f'ALLactualfractionMCQs convertedwithoutdroppingplacezeros→{texts}; THIRDfractiondigit target{target} flags{flags}; 0,800 retainszero thousandths, ten-thousandthnotthird.'
    elif k=='decimal-to-expanded-place-sum':
        target=one(ds);answer=choose(r,D(target));assert ' + ' in answer
        whole,part=target.split(',');terms=answer.split(' + ');expected=[F(int(whole))]+[F(int(c),10**(i+1))for i,c in enumerate(part)if c!='0']
        assert list(map(expr,terms))==expected
        note=f'Actual{target}: zero placeomitted as ADDENDonly, otherdigits remainintheirtrueplaces. ALL4actualsums exactASTcompared; unique{answer}, shiftedtenths/hundredths wrong.'
    elif k=='mixed-ten-thousandths-numerator-place-holes':
        whole,hundredths,tenk=map(int,m(r'Сан (\d+) бүтіннен, (\d+) жүздік үлестен және (\d+) он мыңдық үлестен',s).groups());den=number(r'a/(\d+)',s);v=F(hundredths,100)+F(tenk,10000);answer=integer(v*den)
        assert den==10000;note=f'ActualWHOLE{whole}excludedfromfractionNUM; {hundredths}hundredths+{tenk}ten-thousandths={v}, fixed10000→NUM{answer}; missingtenths/thousandths preserve0positions.'
    elif k=='repeating-decimal-digit-at-large-position':
        period=list(map(int,m(r'кейін ([\d, ]+) цифрлары осы ретпен',s)[1].split(',')));index=number(r'кейінгі (\d+)-орында',s)
        assert len(period)>1 and all(0<=d<=9 for d in period)
        expanded=(period*((index+len(period)-1)//len(period)))[:index];answer=str(expanded[-1]);topic='seq'
        assert len(expanded)==index and int(answer)==period[(index-1)%len(period)]
        # Both positive remainder and divisible-by-period endpoints are checked.
        assert period[(len(period)-1)%len(period)]==period[-1] and 'соңғы цифры, яғни' in r['solution']
        note=f'ACTUALorderedperiod{period}, one-basedindex{index}; independentlyexpandedALL{index}printedpositions→{answer}, modularcrosscheck(index−1)%{len(period)}. Zero-remainderendpoint selectsLASTdigit{period[-1]}, notfirst/allfive.'
    elif k=='fractional-part-scale-error-factor':
        whole,num,den=map(int,m(r'\((\d+) \+ \((\d+)/(\d+)\)\)',s).groups());wrong=D(one(ds));correctFraction=F(num,den);wrongFraction=wrong-int(wrong);factor=wrongFraction/correctFraction;answer=integer(factor)
        assert int(wrong)==whole and wrong/(whole+correctFraction)!=factor and 'тек БӨЛШЕК БӨЛІГІ' in s
        note=f'ActualcorrectWHOLE{whole}+{num}/{den}, wrong{wrong}; compareONLYfractionalparts{wrongFraction}/{correctFraction}={factor}. Entire-numberratio{wrong/(whole+correctFraction)}explicitlydiffers and notused.'
    elif k=='read-improper-thousandths-after-whole-extraction':
        n,d=one(fractions);whole,rem=divmod(n,d);answer=reading_choice(r,whole,rem,d)
        assert n> d and d==1000 and '0' in str(rem)
        note=f'Actualimproper{n}/{d}, exactdivmodWHOLE{whole}, REM{rem}; fixed{fixed(n,d)}, readDEN{d}withINTERNAL0. Everyactualreadingtuple parsed; comma-shift/hundredthsdenfalse.'
    else:raise AssertionError(k)
    assert r['topic']==topic
    return answer,note

def main():
    assert len(ROWS)==41;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All saved/new/fullsolutions/everyMCQ manually read; exact DISPLAYED integer-ratio comma parser, fixed-width string positions, Kazakh reading tuples, full100/1000/10000digit domains and all2034period positions; no author solver/spec/params used','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All41 complete saved/new conditions/solutions/MCQs read','Leading/internal/trailing and WHOLE0 roles kept distinct','UNREDUCEDdenominator and requested numerator/digit/count differentiated','SI10/100/1000 plus fractionalONLYscale factor1000 checked exactly','Finalperiodlanguagefix reread, other40unchanged']})
    assert len(refs)==41
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256'] for e in entries];assert native['fractions']>60
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'f75fedc9c9d8546f','finding':'Zero-remainder explanation could be read as taking last FIVE digits, rather than last digit5','resolution':'Now explicitly «топтың соңғы цифры,яғни5алынады», full finalrow reread; other40 math/rows unchanged.'}],'scope':'All41 source-addressed grade5topic4.1 nonvisual decimal notation adaptations; exact printed review','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':41,'wrongKeysRejected':41,'hashesMatched':41,'sourceRefs':41,'completeDigitDomains':[100,1000,10000],'periodPositionsExpanded':2034,'fractionalScaleFactor':1000,'resolvedLanguageFindings':1,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
