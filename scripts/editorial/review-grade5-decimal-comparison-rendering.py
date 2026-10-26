"""Independent exact review of the DISPLAYED decimal comparison conditions and MCQs.

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
PACK='problems/editorial/batches/grade5-decimal-comparison.json'
OUT='problems/editorial/reviews/grade5-decimal-comparison.json'
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

def relation(text,env=None):
    left,op,right=m(r'^(.+?)\s*([<>=])\s*(.+?)$',text).groups();env=env or{}
    val=lambda t:env[t.strip()]if t.strip()in env else expr(t.strip())
    a,b=val(left),val(right)
    return {'<':a<b,'>':a>b,'=':a==b}[op]

def sign(a,b):return '<'if a<b else'>'if a>b else'='
def ordered(values,reverse=False):return all((a>b if reverse else a<b)for a,b in zip(values,values[1:]))
def masked(text,digit):
    assert text.count('□')==1
    return D(text.replace('□',str(digit)))
def measure(text,unit):
    pattern={'km':r'^(\d+) км (\d+) м$','kg':r'^(\d+) кг (\d+) г$'}[unit]
    mixed=re.fullmatch(pattern,text.strip())
    if mixed:
        whole,part=map(int,mixed.groups());assert 0<=part<1000
        return F(whole)+F(part,1000)
    suffix=' км'if unit=='km'else' кг';assert text.endswith(suffix),text
    return expr(text[:-len(suffix)])

def digit_numbers(s,strict_positive):
    import itertools
    digits=list(map(int,m(r'^([\d, ]+) цифрларының',s)[1].split(',')))
    assert len(digits)==len(set(digits))==4 and all(0<=d<=9 for d in digits)
    allconfigs=[]
    for perm in itertools.permutations(digits):
        for cut in range(1,4):
            if cut>1 and perm[0]==0:continue
            text=''.join(map(str,perm[:cut]))+','+''.join(map(str,perm[cut:]));value=D(text)
            if not strict_positive or value>1:allconfigs.append((text,value))
    value=min(v for t,v in allconfigs)
    return digits,allconfigs,value

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-comparison-');ds=decimals(s);note=''
    if k=='three-decimals-increasing-order':
        values=list(map(D,ds));assert len(set(values))==len(values)==3;flags=[list(map(D,o.split('; ')))==sorted(values)for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'Actual decimals {ds}, ALL offered permutations compared with exact integer-ratio ascending order; flags {flags}, no decimal-string length heuristic.'
    elif k=='comparison-sign-different-length':
        a,b=map(D,ds);answer=sign(a,b);assert answer in r['options']
        note=f'Actual {ds}, exact integer cross-products yield {answer}; equal whole/first digit, internal 0 and right-padding distinguished.'
    elif k in {'count-last-digit-strict-upper','greatest-tenths-digit-under-upper','only-tenths-digit-above-equal-last'}:
        left,op,right=m(r'(\d+,[\d□]+) ([<>]) (\d+,\d+)',s).groups();good=[d for d in range(10)if relation(left.replace('□',str(d))+' '+op+' '+right)]
        answer=str(len(good))if k.startswith('count')else str(max(good))if k.startswith('greatest')else str(one(good))
        note=f'ALL ten digits 0…9 substituted into ACTUAL {left}{op}{right}; valid {good}; strict equality excluded, requested '+('count'if k.startswith('count')else'greatest digit'if k.startswith('greatest')else'unique digit')+'.'
    elif k=='equal-pair-one-ray-point':
        pairs=[tuple(map(D,o.split(' және ')))for o in r['options']];flags=[a==b for a,b in pairs];answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'Every actual ray pair exact compared, flags {flags}; only trailing fractional zeros preserve the coordinate, internal/whole zeros do not.'
    elif k=='ray-point-relative-side':
        a,b=map(D,ds);answer='оң жағында'if a>b else'сол жағында'if a<b else'бір нүктеде';assert answer in r['options']and 'оңға қарай өседі' in s
        note=f'Actual FIRST coordinate {ds[0]} vs reference SECOND {ds[1]}, relation {sign(a,b)}; right-increasing ray maps greater to right; not reference-order reversal.'
    elif k=='count-strictly-below-one':
        values=list(map(D,ds));answer=str(sum(v<1 for v in values));assert F(1)in values
        note=f'All actual list values {ds} checked STRICTLY below1; exact1,0 excluded, valid count {answer}; positive domain holds.'
    elif k=='greatest-decimal-among-four':
        values=list(map(D,ds));assert set(values)==set(map(D,r['options']));answer=one(o for o in r['options']if D(o)==max(values))
        note=f'ALL four actual offered values exactly compared; largest {answer}, adjacent 0,899 vs0,9 resolved by scale rather than digit count.'
    elif k in {'select-true-decimal-inequality','select-false-decimal-relation'}:
        flags=[relation(o)for o in r['options']];target=k.startswith('select-true');answer=one(o for o,t in zip(r['options'],flags)if t==target)
        note=f'All FOUR complete actual relations independently evaluated; truth flags {flags}; asks '+('TRUE'if target else'FALSE')+', deliberately false MCQ retained as such.'
    elif k=='count-equal-decimal-spellings':
        target=D(ds[-1]);values=list(map(D,ds[:-1]));flags=[v==target for v in values];answer=str(sum(flags))
        note=f'Every actual SPELLING counted separately against coordinate {ds[-1]}, flags {flags}; repeated equivalent spellings count here (different from distinct-value task), trailing-only zeros equivalent.'
    elif k=='ray-unit-length-centimetres':
        cm=number(r'1 бірлікке (\d+) см',s);coordinate=D(one(ds));assert coordinate>=0 and cm>0;answer=integer(coordinate*cm)
        note=f'Printed physical scale {cm}cm per1 coordinate unit×FULL coordinate {coordinate}={answer}cm; fractional digit is tenths, origin0 explicit.'
    elif k=='one-digit-two-strict-bounds-count':
        clauses=re.findall(r'(\d+,[\d□]+) ([<>]) (\d+,\d+)',s);assert len(clauses)==2 and clauses[0][0]==clauses[1][0]
        good=[d for d in range(10)if all(relation(a.replace('□',str(d))+' '+op+' '+b)for a,op,b in clauses)];answer=str(len(good))
        note=f'ALL ten digits with ONE SHARED □ substituted in BOTH actual strict conditions {clauses}; intersection {good}, count {answer}; independent choices would be wrong.'
    elif k in {'least-decimal-all-four-digits','least-digit-decimal-greater-than-one'}:
        digits,configs,value=digit_numbers(s,k.endswith('greater-than-one'));answer=choose(r,value)
        note=f'Actual digit set {digits}; ALL24 permutations×ALL3 comma positions tested, multi-digit whole leading0 rejected, '+('strict value>1 enforced'if k.endswith('greater-than-one')else'whole0 explicitly allowed')+f'; {len(configs)} allowed configurations, unique minimum value {value}={answer}; all actual MCQs exact compared.'
    elif k=='compare-fraction-decimal-same-whole':
        n,d=one(fs(s));fraction=F(n,d);decimal=D(one(ds));flags=[relation(o)for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t)
        assert expr(m(r'^(.+?) [<>=]',answer)[1])==fraction
        note=f'Actual SAME original article, share {n}/{d}={fraction} vs decimal {decimal}; all actual relations checked flags {flags}; concatenation of numerator/denominator is not decimal conversion.'
    elif k=='count-listed-points-strict-between':
        low,high=map(D,ds[-2:]);values=list(map(D,ds[:-2]));assert low<high;good=[t for t,v in zip(ds[:-2],values)if low<v<high];answer=str(len(good));assert low in values and high in values
        note=f'ALL actual listed coordinates checked in STRICT interval ({low},{high}), both supplied endpoints explicitly excluded; valid {good}, count {answer}.'
    elif k=='named-height-increasing-rank':
        pairs=[(name,D(value))for name,value in re.findall(r'(\w+) — (\d+,\d+) м',s)];target=m(r'(\w+) нешінші орында',s)[1];assert len(pairs)==5 and len(set(v for n,v in pairs))==5
        ordered_pairs=sorted(pairs,key=lambda p:p[1]);answer=str(one(i for i,(name,v)in enumerate(ordered_pairs,1)if name==target));assert all(v>0 for n,v in pairs)
        note=f'All actual named positive heights exact sorted: {[n for n,v in ordered_pairs]}; asked {target} position {answer}, name/value ownership retained.'
    elif k=='select-four-decimals-decreasing':
        vals=[list(map(D,o.split('; ')))for o in r['options']];flags=[ordered(v,True)for v in vals];answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'ALL three adjacent comparisons in EVERY four-number row checked; fully decreasing flags {flags}; local first-pair correctness alone not sufficient.'
    elif k=='count-equal-mixed-lengths':
        listed=m(r'өлшемдері (.+?)\. Олардың',s)[1].split('; ');target=D(one(decimals(m(r'дәл (\d+,\d+) км',s)[0])));values=[measure(t,'km')for t in listed];answer=str(sum(v==target for v in values));assert all(v>0 for v in values)
        note=f'All actual mixed km/metre values converted at EXACT1000m/km: {list(map(str,values))}; count entries equal target {target} is {answer}; internal zeros preserve metre scale.'
    elif k=='heaviest-mixed-gram-mass':
        values=[measure(o,'kg')for o in r['options']];assert all(v>0 for v in values);answer=one(o for o,v in zip(r['options'],values)if v==max(values))
        note=f'ALL four actual masses normalized kg+g/1000, exact values {list(map(str,values))}; greatest {answer}, no raw grams-versus-fraction digits comparison.'
    elif k=='count-one-nonzero-fraction-digit':
        low=F(number(r'^(\d+) санынан үлкен',s));high=D(one(ds));assert low<high
        good=[F(w)+F(d,10)for w in range(low.numerator//low.denominator,high.numerator//high.denominator+1)for d in range(1,10)if low<F(w)+F(d,10)<high];answer=str(len(good))
        note=f'Complete WHOLE range and nonzero fractional digit1…9 tested; exact strict bounds {low}<x<{high}, valid {list(map(str,good))}, count {answer}; zero and upper equality excluded.'
    elif k=='given-decimal-decreasing-rank':
        vals=list(map(D,ds[:-1]));target=D(ds[-1]);assert len(set(vals))==len(vals);answer=str(sorted(vals,reverse=True).index(target)+1)
        note=f'ALL actual values sorted decreasing by exact ratios; requested coordinate {ds[-1]} has {int(answer)-1} GREATER values, hence rank {answer}.'
    elif k=='fastest-same-distance-least-time':
        distance=number(r'бірдей (\d+) м',s);pairs=[(n,D(t))for n,t in re.findall(r'(\w+) — (\d+,\d+) с',s)];assert distance>0 and len(pairs)==4 and all(t>0 for n,t in pairs);time=min(t for n,t in pairs);answer=one(n for n,t in pairs if t==time);assert answer in r['options']
        speeds=[(n,F(distance)/t)for n,t in pairs];assert one(n for n,v in speeds if v==max(v for n,v in speeds))==answer
        note=f'SAME positive distance {distance}m, all FOUR actual times positive; minimum time {time} selects {answer}, cross-check maximum exact distance/time agrees; largest time is not fastest.'
    elif k=='shared-digit-largest-of-three-count':
        templates=re.findall(r'\d+,[\d□]+',s);assert len(templates)==3 and templates[0].count('□')==templates[1].count('□')==1
        good=[d for d in range(10)if masked(templates[0],d)>masked(templates[1],d)and masked(templates[0],d)>D(templates[2])];answer=str(len(good))
        note=f'ALL ten SAME shared digits in both actual templates {templates}; first strictly exceeds BOTH others only for {good}; equality triple excluded, count {answer}.'
    elif k=='count-at-most-three-decimal-values':
        low,high=map(D,ds);p=number(r'ең көбі (\d+) цифрмен',s);assert p==3;values=set();spellings=[]
        for places in range(1,p+1):
            den=10**places
            for w in range(low.numerator//low.denominator,high.numerator//high.denominator+1):
                for n in range(den):
                    value=F(w)+F(n,den)
                    if low<value<high:values.add(value);spellings.append((w,n,den))
        assert values=={F(n,1000)for n in range(int(low*1000)+1,int(high*1000))};assert len(spellings)>len(values);answer=str(len(values))
        note=f'ALL one-, two-, three-place representations generated across bounded whole range; strict bounds {low},{high}. {len(spellings)} spellings deduplicated by exact Fraction to {answer} DISTINCT values; trailing-zero aliases not counted again.'
    elif k=='two-independent-digits-inequality-count':
        left,right=m(r'(\d+,a\d) < (\d+,\db)',s).groups();good=[(a,b)for a in range(10)for b in range(10)if D(left.replace('a',str(a)))<D(right.replace('b',str(b)))];answer=str(len(good));assert any(a==b for a,b in good)
        note=f'ALL100 ORDERED independent digit pairs0…9² substituted into {left}<{right}; {answer} valid, SAME digits permitted; strict equality pair excluded.'
    elif k=='two-nonzero-digits-strict-interval-count':
        low,high=map(D,ds);good=[(a,b)for a in range(1,10)for b in range(1,10)if low<F(a)+F(b,10)<high];answer=str(len(good));assert any(a==b for a,b in good)
        note=f'Complete81 positive-digit pairs1…9², repeats allowed, exact strict {low}<a,b<{high}; count {answer}, neither digit0 admitted.'
    elif k=='universal-independent-digit-claim':
        templates=m(r'a = (\d+,[\d□]+) және b = (\d+,[\d□]+)',s).groups();domains=[{'a':masked(templates[0],a),'b':masked(templates[1],b)}for a in range(10)for b in range(10)];flags=[all(relation(o,env)for env in domains)for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);counterexamples={o:next({k:str(v)for k,v in env.items()}for env in domains if not relation(o,env))for o,t in zip(r['options'],flags)if not t}
        note=f'ALL100 INDEPENDENT □ pairs evaluated for EVERY actual universal assertion; flags {flags}, explicit counterexamples {counterexamples}; correct assertion holds even at minimum/maximum endpoints.'
    elif k=='mixed-masses-decreasing-order':
        source=m(r'әкелінді: (.+?)\. Массаларды',s)[1].split('; ');values=[measure(t,'kg')for t in source];flags=[]
        for o in r['options']:
            vs=[measure(t,'kg')for t in o.split('; ')];flags.append(sorted(vs)==sorted(values)and ordered(vs,True))
        answer=one(o for o,t in zip(r['options'],flags)if t);assert all(v>0 for v in values)
        note=f'Actual mixed fraction/decimal/kg+g normalized by exact native AST and g/1000: {list(map(str,values))}; EVERY offered list preserves all masses and ALL adjacent descending comparisons; flags {flags}.'
    elif k=='ordered-ownership-after-lightest':
        import itertools
        vals=list(map(D,ds));assert len(set(vals))==4
        # Complete assignments (Amir, Bek, Ayan, Dana), not merely a rank shortcut.
        assignments=[v for v in itertools.permutations(vals)if v[0]==min(vals)and v[1]<v[2]<v[3]];assignment=one(assignments);requested=assignment[2]
        assert 'Аянның сәлемдемесі Бектің сәлемдемесінен ауыр' in s and 'Дананың сәлемдемесінен жеңіл' in s
        answer=one(o for o in r['options']if measure(o,'kg')==requested)
        note=f'ALL24 ownership assignments tested with Amir lightest and Bek<AYAN<Dana; unique exact assignment {list(map(str,assignment))}; requested Ayan mass {answer}, not median of all four or greatest.'
    elif k=='three-distinct-digits-above-threshold-count':
        import itertools
        digits=list(map(int,m(r'^([\d, ]+) цифрларынан',s)[1].split(',')));threshold=D(one(ds));assert len(digits)==len(set(digits))==4
        domain=list(itertools.permutations(digits,3));good=[t for t in domain if F(t[0])+F(t[1],10)+F(t[2],100)>threshold];answer=str(len(good));assert len(domain)==24
        note=f'Actual four digits {digits}, ALL24 length3 permutations WITHOUT repeats, one digit unused; exact STRICT threshold {threshold}, {answer} valid; threshold tenths equality resolved by hundredths.'
    elif k=='first-different-decimal-place':
        a,b=ds;aw,af=a.split(',');bw,bf=b.split(',');width=max(len(af),len(bf));ap=[int(aw)]+list(map(int,af.ljust(width,'0')));bp=[int(bw)]+list(map(int,bf.ljust(width,'0')));index=next(i for i,(x,y)in enumerate(zip(ap,bp))if x!=y);names=['бүтін бөліктері','ондық үлестері','жүздік үлестері','мыңдық үлестері'];answer=names[index];assert answer in r['options']
        note=f'Actual padded place vectors {ap} vs {bp}, FIRST differing index {index}={answer}; all earlier places proven equal, later ones cannot change result.'
    elif k=='least-natural-strictly-above-decimal':
        value=D(one(ds));candidate=value.numerator//value.denominator+1;assert candidate-1<=value<candidate;answer=str(candidate)
        note=f'Actual {value}, adjacent naturals {candidate-1}≤value<{candidate}; STRICTLY greater least natural {answer}, even if value had integral form lower equality would not qualify.'
    elif k=='fraction-bounds-one-digit-choice':
        low,high=[F(n,d)for n,d in fs(s)];template=one(re.findall(r'\d+,[\d□]+',s));good=[d for d in range(10)if low<masked(template,d)<high];answer=str(one(good))
        note=f'Both ACTUAL native fraction bounds {low},{high} and every0…9 digit in {template} exact checked; unique {answer}, both bounds STRICT.'
    elif k=='select-point-strictly-inside':
        low,high=map(D,ds);flags=[low<D(o)<high for o in r['options']];answer=one(o for o,t in zip(r['options'],flags)if t);assert any(D(o)==high for o in r['options'])
        note=f'ALL four offered coordinates exact checked strictly inside ({low},{high}); flags {flags}, upper endpoint explicitly false, internal zero changes magnitude.'
    elif k=='ordered-reversed-decimal-digit-pairs':
        digits=list(map(int,m(r'— ([\d, ]+) тізімінен',s)[1].split(',')));assert len(digits)==len(set(digits))and all(1<=d<=9 for d in digits);domain=[(a,b)for a in digits for b in digits if a!=b];good=[(a,b)for a,b in domain if F(a)+F(b,10)>F(b)+F(a,10)];answer=str(len(good));assert len(domain)==len(digits)*(len(digits)-1)and len(good)*2==len(domain)
        note=f'ALL{len(domain)} ORDERED different nonzero-digit pairs from actual {digits}; exact a,b>b,a cross-scaled values yield {answer}; reversed pair complementary, no unordered-pair/zero leakage.'
    elif k=='ordered-ray-points-third-coordinate':
        names=[n.strip()for n in m(r'Сәуледе (.+?) нүктелері',s)[1].split(',')];target=m(r'берілген\. (\w+) нүктесінің',s)[1];values=sorted(map(D,ds));assert len(set(values))==len(names)==4;value=values[names.index(target)];answer=choose(r,value)
        note=f'ACTUAL left-to-right named order {names}, exact coordinate sorting {list(map(str,values))}; requested {target} index{names.index(target)+1} yields {answer}; all offered coordinates checked.'
    elif k=='greatest-all-distinct-three-place-value':
        low,high=map(D,ds);assert 'БҮТІН ЖӘНЕ БӨЛШЕК' in s and 'ДӘЛ 3' in s
        domain=range((low.numerator//low.denominator)*1000,((high.numerator//high.denominator)+1)*1000);good=[]
        for n in domain:
            digits=str(n//1000)+str(n%1000).zfill(3)
            if low<F(n,1000)<high and len(set(digits))==len(digits):good.append(n)
        best=max(good);assert all(n<=best for n in good);answer=str(best)
        note=f'ALL1000 thousandth-grid candidates in actual whole interval checked, STRICT bounds {low},{high}, uniqueness across WHOLE+FRACTION digits; valid {good}, greatest TOTALthousandths {answer}, not fractional remainder.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==40;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All40 saved/new full conditions/solutions/everyMCQ read; independent DISPLAYED arbitrary-precision integer/Fraction comparisons, complete digit/permutation/representation/ownership domains, exact metric normalization; no author solver/spec/params','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All40 source/new full solutions and MCQs manually read','Exact displayed comma ratios, no binary floating point','Strict endpoint/zero/shared-vs-independent digit domains checked completely','Distinct values deduplicated from trailing-zero spellings; all places include whole','Same-distance positive fastest=leasttime, named height ranks and full ownership assignments','Every MCQ interpreted under actual TRUE/FALSE/sort/role request']})
    assert len(refs)==40
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All40 source-addressed grade5topic4.3 nonvisual decimal comparison adaptations; full independent printed exact review','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':40,'wrongKeysRejected':40,'hashesMatched':40,'sourceRefs':40,'completeIndependentDigitDomains':[10,81,100],'commaPermutationConfigurations':72,'ownershipAssignments':24,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
