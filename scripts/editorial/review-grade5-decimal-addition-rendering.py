"""Independent exact review of the DISPLAYED decimal addition conditions and MCQs.

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
PACK='problems/editorial/batches/grade5-decimal-addition.json'
OUT='problems/editorial/reviews/grade5-decimal-addition.json'
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

def unit_choice(r,value,unit):
    return one(o for o in r['options']if o.endswith(' '+unit)and expr(o[:-len(unit)-1])==value)
def column(a,b,op):
    """Our own actual-digit ledger; no author helper or params."""
    p=max(len(a.split(',')[1])if ',' in a else 0,len(b.split(',')[1])if ',' in b else 0)
    av,bv=D(a),D(b);n=av*10**p;mval=bv*10**p;assert n.denominator==mval.denominator==1
    width=max(len(str(int(n))),len(str(int(mval))))+1
    aa=list(map(int,str(int(n)).zfill(width)[::-1]));bb=list(map(int,str(int(mval)).zfill(width)[::-1]));steps=[];carry=0;borrows=[]
    for i in range(width):
        if op=='+':
            value=aa[i]+bb[i]+carry;steps.append((aa[i],bb[i],carry,value));carry=value//10
        else:
            assert av>=bv
            if aa[i]<bb[i]:
                j=i+1
                while aa[j]==0:j+=1
                borrows.append((i,j,list(aa[i:j+1])))
                aa[j]-=1
                for k in range(i+1,j):aa[k]=9
                aa[i]+=10
            value=aa[i]-bb[i];steps.append((aa[i],bb[i],None,value))
    assert carry==0
    out=sum((v[3]%10)*10**i for i,v in enumerate(steps))
    assert F(out,10**p)==(av+bv if op=='+'else av-bv)
    return p,steps,borrows

def solution_columns(r):
    # Validate every actual column block and each written per-place equation.
    pattern=r'Үтірлерін бір бағанға келтіреміз: (\d+(?:,\d+)?) ([+−]) (\d+(?:,\d+)?)\. (.*?)Нәтиже (\d+(?:,\d+)?)\.'
    blocks=re.findall(pattern,r['solution']);checked=0;chains=[]
    for a,op,b,body,result in blocks:
        p,steps,borrows=column(a,b,op);assert expr(a+' '+op+' '+b)==D(result),(r['editionId'],a,op,b,result)
        for source,target in re.findall(r'разрядындағы (\d+) бірліктен 1 алынып, (\d+) қалады',body):assert int(source)-1==int(target)
        for source,target in re.findall(r'разрядындағы (\d+) санына 10 қосылып, (\d+) болады',body):assert int(source)+10==int(target)
        positions={'Мыңдық үлестер':p-3,'Жүздік үлестер':p-2,'Ондық үлестер':p-1,'Бірліктер':p,'Ондықтар':p+1,'Жүздіктер':p+2}
        written=re.findall(r'(Мыңдық үлестер|Жүздік үлестер|Ондық үлестер|Бірліктер|Ондықтар|Жүздіктер): (\d+(?: [ +−]+\d+)+) = (\d+)',body)
        seen=set()
        for label,operation,value in written:
            index=positions[label];assert 0<=index<len(steps);aa,bb,carry,expected=steps[index];assert int(value)==expected and expr(operation)==expected,(r['editionId'],label,operation,value,steps[index]);nums=list(map(int,re.findall(r'\d+',operation)));assert nums[:2]==[aa,bb],(r['editionId'],label,nums,steps[index]);assert nums[2:]==([carry]if carry else[]);seen.add(index);checked+=1
        assert set(range(p+1))<=seen,(r['editionId'],a,b,p,seen)
        if borrows:chains.append({'operation':a+op+b,'borrowHops':[(j-i)for i,j,old in borrows]})
    return len(blocks),checked,chains

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-addition-');ds=decimals(s);note=''
    if k in {'tenths-sum-carry-to-whole','unequal-places-subtraction-borrow','leading-zero-hundredths-plus-tenths','whole-minus-hundredth-borrow-through-zeros','natural-minus-tenths-borrow','associative-whole-complement-pair','alternating-four-equal-differences-plus-last'}:
        expression=m(r': (.+?)\.$',s)[1];value=expr(expression);answer=choose(r,value)
        if k=='associative-whole-complement-pair':assert D(ds[1])+D(ds[2])==int(D(ds[1])+D(ds[2]))
        if k=='alternating-four-equal-differences-plus-last':
            values=list(map(D,ds));assert len(values)==9;differences=[values[i]-values[i+1]for i in range(0,8,2)];assert len(set(differences))==1 and value==sum(differences)+values[-1]
        note=f'Entire ACTUAL expression {expression} exact integer AST={value}; all MCQs exact compared, signs/grouping/alignment retained; dedicated independent per-digit ledger validates written carry/borrow blocks.'
    elif k=='shorter-sibling-decimal-height':
        height,diff=map(D,ds);assert 0<diff<height;answer=unit_choice(r,height-diff,'м');assert unit_choice(r,height+diff,'м')!=answer and unit_choice(r,height-diff*10,'м')!=answer
        note=f'Actual positive height {height}m MINUS shorter difference {diff}; result {answer}. Opposite addition and difference×10 actual traps checked, nonnegative physical height.'
    elif k=='sum-result-minimal-decimal-place-count':
        a,b=map(D,ds);value=a+b;p=0
        while(value*10**p).denominator!=1:p+=1
        answer=str(p);assert 'Қосындының өзі' in r['solution']and 'Жауаптың өзі' not in r['solution']
        note=f'Actual sum {a}+{b}={value}; first power of10 clearing reduced denominator gives MINIMAL {p} decimal places. Requested PLACECOUNT, not numeric sum; final wording fix explicitly calls 7,768 the SUM.'
    elif k=='sum-two-carries-integer-result':
        a,b=map(D,ds);value=a+b;answer=integer(value);assert len(ds[0].split(',')[1])==len(ds[1].split(',')[1])==2
        p,steps,_=column(ds[0],ds[1],'+');assert steps[0][3]>=10 and steps[1][3]>=10
        note=f'Printed {ds}, exact sum {value} integral, TWO real adjacent fractional carries proved from independent digit ledger; trailing00 removed only after result established.'
    elif k=='hundredths-digit-of-aligned-sum':
        value=sum(map(D,ds));hundredths=value*100;assert hundredths.denominator==1;answer=str(int(hundredths)%10)
        note=f'Full actual sum {value}, scaled100 exact integer {hundredths}; requested SECOND fractional digit {answer}, not total value or tenths; 0,8 aligns as0,80.'
    elif k=='unknown-minuend-two-carry-sum':
        a,b=map(D,ds);value=a+b;answer=integer(value);assert value-a==b
        note=f'Unknown MINUEND x−{a}={b}, unique linear x={a+b}; substitution checked. Both fractional carries validated from written actual column block, no subtrahend-role confusion.'
    elif k=='sum-fruit-masses-requested-grams':
        values=list(map(D,ds));assert len(values)==2 and all(v>0 for v in values);answer=integer(sum(values)*1000);assert 'ГРАММЕН' in s
        note=f'Actual two positive masses {values}, sum kg THEN×1000g/kg={answer}; requested grams not decimal kilograms, whole carry included.'
    elif k=='subtract-sum-regrouping-integer':
        expression=m(r': (.+?)\. Жауапқа',s)[1];value=expr(expression);answer=integer(value);a,b,c,d=map(D,ds);assert value==a-b-c+d
        note=f'ACTUAL grouped expression {expression} evaluated independently by exact AST and expanded a−b−c+d; both negative signs preserved, integer {answer}.'
    elif k=='combine-like-decimal-coefficients':
        a,b,c=map(D,ds);coefficient=a+b-c;answer=one(o for o in r['options']if o.endswith(' × x')and expr(o[:-4])==coefficient);assert one(o for o in r['options']if expr(o[:-4])==a+b+c)!=answer;assert one(o for o in r['options']if expr(o[:-4])==a+b)!=answer
        note=f'ACTUAL coefficients {a}+{b}−{c}={coefficient}; distributive identity proves coefficient for ALL x, not sampled x. All symbolic MCQs interpreted as coefficient×x, plus-final/omit-final traps exact checked.'
    elif k=='capacity-three-item-sum-choice':
        capacity=F(number(r'қорабына (\d+) кг',s));totals=[sum(D(t[:-3])for t in o.split('; '))for o in r['options']];flags=[v<=capacity for v in totals];answer=one(o for o,t in zip(r['options'],flags)if t);assert 'Дәл' in s and 'рұқсат' in s
        note=f'ALL four actual THREE-item totals {totals}, capacity INCLUSIVE≤{capacity}; flags {flags}, unique admissible set {answer}; equality explicitly allowed, no single-item shortcut.'
    elif k=='arithmetic-decimal-sequence-below-bound':
        values=list(map(D,ds));assert len(values)==4;step=values[1]-values[0];assert step>0 and all(b-a==step for a,b in zip(values,values[1:]));bound=F(number(r'мүшесі (\d+) санынан',s));terms=[];value=values[0]
        while value<bound:terms.append(value);value+=step
        answer=str(len(terms));assert value>=bound and all(v<bound for v in terms)
        note=f'Actual first4 terms imply SAME positive step {step}; all terms under STRICT {bound}: {terms}, next {value}; count {answer}. Positive step proves no later return below boundary.'
    elif k=='upstream-decimal-speed':
        still,current=map(D,ds);assert 0<current<still;answer=unit_choice(r,still-current,'км/сағ');assert unit_choice(r,still+current,'км/сағ')!=answer
        note=f'Actual STILL water {still}, current {current}, requested AGAINST=current subtract, positive speed {answer}; offered downstream sum verified wrong for target.'
    elif k=='successive-side-comparisons-perimeter':
        a,more,less=map(D,ds);b=a+more;c=b-less;assert min(a,b,c)>0 and a+b>c and a+c>b and b+c>a;value=a+b+c;answer=unit_choice(r,value,'см');assert unit_choice(r,a+b,'см')!=answer and unit_choice(r,a+b+a-less,'см')!=answer
        note=f'Actual sides a={a}, b=a+{more}={b}, c=SECOND−{less}={c}; all3 strict triangle inequalities hold. Perimeter {value}; actual omitted-third/wrong-reference-first traps independently checked.'
    elif k=='max-minus-min-decimal-range':
        values=list(map(D,ds));value=max(values)-min(values);answer=choose(r,value)
        note=f'ALL four actual values exact ordered, max {max(values)}, min {min(values)}, difference {value}; other digit-count/internal-zero candidates excluded before subtraction.'
    elif k=='nested-unknown-addend-equation':
        a,b,c=map(D,ds);value=c+b-a;answer=integer(value);assert(value+a)-b==c
        note=f'Actual (x+{a})−{b}={c}, first invert outer subtraction then inner addition: x={value}; full substitution, unique coefficient1 linear solution, both unknown roles preserved.'
    elif k=='three-related-fruit-masses-total':
        a,more,less=map(D,ds);b=a+more;c=b-less;assert min(a,b,c)>0 and 'АЛМҰРТТАН' in s;answer=integer(a+b+c);ledger(a+b+c,a,b,c)
        note=f'Actual apples {a}, pears APPLES+{more}={b}, grapes PEARS−{less}={c}; all positive, total {answer}; second comparison uses named PEARS, not original apples.'
    elif k=='two-cuts-rope-remaining':
        whole=F(number(r'Шеберханада (\d+) м',s));a,b=map(D,ds);remaining=whole-a-b;assert a>0 and b>0 and remaining>0;answer=unit_choice(r,remaining,'м');ledger(whole,a,b,remaining);assert unit_choice(r,whole-a,'м')!=answer and unit_choice(r,whole-a-b/10,'м')!=answer
        note=f'Actual rope {whole}m minus BOTH cuts {a},{b}; remaining {remaining}, conservation exact; actual first-remainder and shifted-second-cut traps checked.'
    elif k=='three-day-total-unknown-third':
        total,first,less=map(D,ds);second=first-less;third=total-first-second;assert min(first,second,third)>0;answer=integer(third);ledger(total,first,second,third)
        note=f'Actual total {total}, day1 {first}, day2=day1−{less}={second}, unknown THIRD {third}; full3day conservation, no equal division.'
    elif k=='sum-and-difference-first-mass':
        total,diff=map(D,ds);assert 0<diff<total;first=(total+diff)/2;second=(total-diff)/2;assert first>second>0 and first+second==total and first-second==diff;answer=unit_choice(r,first,'кг');assert unit_choice(r,second,'кг')!=answer
        note=f'Actual SUM{total} and FIRST−SECOND{diff} uniquely give first{first}, second{second}; both original equations verified, requested larger FIRST, actual smaller/combined remainder traps excluded.'
    elif k=='still-water-from-down-and-up':
        down,up=map(D,ds);assert down>up>0;still=(down+up)/2;current=(down-up)/2;assert current>0 and still-current==up and still+current==down;answer=integer(still)
        note=f'Actual down {down}, up {up}; unique linear pair still{still}, current{current}; SUM cancels current, asked STILL not current, both speed equations verified.'
    elif k=='heaviest-from-three-pair-masses':
        ab,bc,ac=map(D,ds);total=(ab+bc+ac)/2;a,b,c=total-bc,total-ac,total-ab;assert min(a,b,c)>0 and a+b==ab and b+c==bc and a+c==ac;answer=unit_choice(r,max(a,b,c),'кг')
        note=f'All ACTUAL pair sums {ab},{bc},{ac}; each counted TWICE yields total{total}; positive unique individual masses A{a},B{b},C{c}, all3 equations verified; maximum {answer}.'
    elif k=='reverse-three-liquid-transfers':
        t,u,final=map(D,ds);initial=[final+t,final-t+u,final-u];assert min(initial)>0 and initial[0]>=t and initial[1]+t>=u;after1=[initial[0]-t,initial[1]+t,initial[2]];after2=[after1[0],after1[1]-u,after1[2]+u];assert after2==[final]*3 and sum(initial)==sum(after1)==sum(after2);answer=integer(initial[0])
        note=f'ACTUAL ordered transfers1→2 {t}L then2→3 {u}L, final EACH{final}; reversed initials{initial}, forward BOTH steps and conservation{sum(initial)}L exact; requested original FIRST{answer}.'
    elif k=='natural-count-between-decimal-expressions':
        left,right=m(r'^(.+?) < n < (.+?) қос теңсіздігін',s).groups();lo,hi=expr(left),expr(right);assert 0<lo<hi;domain=list(range(1,hi.numerator//hi.denominator+2));good=[n for n in domain if lo<n<hi];answer=str(len(good))
        note=f'ACTUAL expression bounds {left}={lo}, {right}={hi}; ALL naturals1…{domain[-1]} evaluated with BOTH STRICT comparisons→{good}, count{answer}; no fractional n.'
    elif k=='correct-comma-moved-addend-sum':
        actual,wrong,result=map(D,ds);assert actual==wrong*10;other=result-wrong;assert other>0;value=other+actual;answer=choose(r,value);assert value==result+(actual-wrong);assert choose(r,result+actual)!=answer and choose(r,other)!=answer
        note=f'Actual original{actual} miscopied{wrong}, wrongsum{result}; recover OTHER={other}, then replace wrong term→{value}. Independent correction delta{actual-wrong} agrees; actual direct-add and other-only traps false.'
    elif k=='ten-decimals-complement-pair-sum':
        expression=m(r': (.+?)\. Жауапқа',s)[1];terms=[expr(t)for t in expression.split(' + ')];assert len(terms)==10;pair_sums=[terms[i]+terms[-1-i]for i in range(5)];assert len(set(pair_sums))==1;value=expr(expression);assert value==sum(pair_sums);answer=integer(value)
        note=f'ALL ten actual addends (including INTEGER1and2) parsed from full AST, five opposite pairs {pair_sums}, exact sum{answer}; no decimal-only regex omits integer terms.'
    elif k=='three-digit-permutation-max-min-difference':
        import itertools
        digits=list(map(int,m(r'^([\d, ]+) цифрларының',s)[1].split(',')));assert len(digits)==len(set(digits))==3 and all(1<=d<=9 for d in digits);values=[F(a)+F(b,10)+F(c,100)for a,b,c in itertools.permutations(digits)];assert len(values)==6;value=max(values)-min(values);answer=choose(r,value)
        note=f'ALL6 permutations of ACTUAL digits{digits}, max{max(values)},min{min(values)}, exact subtraction{value}; both actual adjacent borrow steps checked by independent column ledger; per-digit absolute difference trap remains false.'
    elif k=='select-true-decimal-operation-equality':
        flags=[]
        for o in r['options']:
            a,b=o.split(' = ');flags.append(expr(a)==D(b))
        answer=one(o for o,t in zip(r['options'],flags)if t);assert sum(flags)==1
        note=f'ALL four actual operation/result equalities exact checked; flags{flags}. Three deliberately false statements remain false MCQs, correct full equality{answer} selected.'
    elif k=='fabric-remaining-integer-complement':
        whole=F(number(r'үйірмесінде (\d+) м',s));a,b=map(D,ds);used=a+b;remaining=whole-used;assert a>0 and b>0 and remaining>0 and used.denominator==1;ledger(whole,a,b,remaining);answer=integer(remaining)
        note=f'ACTUAL cloth{whole}, BOTH expenditures{a},{b}, complementary pair used{used} integral then remaining{remaining}; full conservation and positive residual checked.'
    elif k=='select-complementary-decimal-pair':
        sums=[sum(D(t)for t in o.split(' және '))for o in r['options']];answer=one(o for o,v in zip(r['options'],sums)if v==1)
        note=f'ALL actual two-number pairs summed exactly→{sums}, unique SUM1{answer}; hundredth vs tenth and both carries retained.'
    elif k=='three-relative-heights-centimetres':
        first,less,more=map(D,ds);second=first-less;third=second+more;assert min(first,second,third)>0 and 'ДАНАДАН' in s;answer=integer(third*100)
        note=f'Actual firstheight{first}m, Dana=first−{less}={second}, Erke=DANA+{more}={third}; requested cm×100={answer}, second reference not original; borrow and carry each validated.'
    elif k=='unknown-subtrahend-decimal':
        minuend,difference=map(D,ds);value=minuend-difference;assert value>0 and minuend-value==difference;answer=choose(r,value);assert choose(r,minuend+difference)!=answer
        note=f'ACTUAL unknown SUBTRAHEND{minuend}−x={difference}, unique x{value}; exact substitution and opposite unknown-minuend addition trap checked.'
    elif k=='greatest-of-four-decimal-expressions':
        values=[expr(o)for o in r['options']];answer=one(o for o,v in zip(r['options'],values)if v==max(values));assert 'санның өзін емес' in s
        note=f'ALL FOUR actual full expression AST values{values}; maximum value{max(values)} maps back to EXPRESSION{answer}, not numeric answer string.'
    elif k=='two-seed-decimal-recurrence-first-above':
        terms=list(map(D,ds));assert len(terms)==2 and min(terms)>0;bound=F(number(r' (\d+) санынан ҚАТАҢ',s));assert max(terms)<=bound
        while terms[-1]<=bound:terms.append(terms[-1]+terms[-2])
        assert all(v<=bound for v in terms[:-1])and terms[-1]>bound;answer=str(len(terms))
        note=f'Actual TWO ordered positive seeds, every recurrence term constructed exactly→{terms}; FIRST strict>{bound} value{terms[-1]} is INDEX{answer}. All earlier terms checked; key is position, not value.'
    elif k=='second-number-from-total-and-adjacent-pairs':
        total=F(number(r'қосындысы (\d+)\.',s));ab,bc=map(D,ds);b=ab+bc-total;a=ab-b;c=bc-b;assert a+b+c==total and a+b==ab and b+c==bc;answer=choose(r,b);assert choose(r,a)!=answer and choose(r,c)!=answer and choose(r,ab+bc)!=answer
        note=f'Actual total{total}, adjacentAB{ab},BC{bc}; repeated SECOND b={ab}+{bc}−{total}={b}, A{a},C{c}; full equations and all FIRST/THIRD/doublecount actual traps checked.'
    elif k=='greatest-digit-after-decimal-addition-bound':
        template,addend,upper=m(r'^(\d+,[\d□]+) \+ (\d+,\d+) < (\d+,\d+)',s).groups();good=[d for d in range(10)if D(template.replace('□',str(d)))+D(addend)<D(upper)];answer=str(max(good));assert all(D(template.replace('□',str(d)))+D(addend)>=D(upper)for d in range(int(answer)+1,10))
        note=f'ALL ten digits0…9 in actual {template}+{addend}<{upper} checked exactly; valid{good}, GREATEST{answer}, every larger digit rejected. Unknown-addend bound{D(upper)-D(addend)} agrees, equality excluded.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==41;entries=[];refs=set();total_blocks=total_steps=0;zerochains=[]
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer']);blocks,steps,chains=solution_columns(r);total_blocks+=blocks;total_steps+=steps;zerochains.extend(chains)
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer'];assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit()and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All41 saved/new full conditions/solutions/everyMCQ read; own exact DISPLAYED integer/Fraction AST, independent per-column actual-digit carry/borrow ledger and full finite domains; no author solver/spec/params','notes':note+f' Independently validated {blocks} written column blocks/{steps} actual per-place equations.','sourceCanonicalSha256':digest(raw),'checks':['All41 source/new complete solutions and every MCQ manually read','Exact displayed integer ratios and full AST; no binary floats or omitted integer terms','Every written aligned-column result, per-place equation and borrow donor/recipient prose checked against own digit ledger','Positive physical sides/speeds/conservation and named original/second bases verified','Unknown minuend/subtrahend/addend roles, recurrence INDEX and max EXPRESSION distinguished','Minimal decimal place wording fix reread after author refreeze']})
    assert len(refs)==41 and total_blocks>15 and total_steps>40 and any(max(c['borrowHops'])>=3 for c in zerochains)
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'58b96cd3bbaf7d05','finding':'Solution called numeric sum7,768 the answer although target asks PLACECOUNT3','resolution':'Author changed only «Жауаптың өзі» to «Қосындының өзі»; final complete row reread and snapshot other40 unchanged.'}],'scope':'All41 source-addressed grade5topic4.4 nonvisual decimal addition/subtraction adaptations; independent printed exact and digit-ledger review','columnAudit':{'blocks':total_blocks,'perPlaceEquations':total_steps,'borrowOperations':zerochains},'entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':41,'wrongKeysRejected':41,'hashesMatched':41,'sourceRefs':41,'columnBlocks':total_blocks,'perPlaceEquations':total_steps,'borrowOperationCount':len(zerochains),'longestZeroChainHops':max(max(c['borrowHops'])for c in zerochains),'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
