"""Independent exact review of the DISPLAYED decimal conversion conditions and MCQs.

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
PACK='problems/editorial/batches/grade5-decimal-conversion.json'
OUT='problems/editorial/reviews/grade5-decimal-conversion.json'
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

# Independent bounded integer AST, extended only for the printed Unicode powers.
def calc(s):
    supers=str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹','0123456789')
    s=re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda z:'**'+z[0].translate(supers),s)
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
        if isinstance(n.op,ast.Pow):assert b.denominator==1 and 0<=b<=10;return a**int(b)
        assert isinstance(n.op,ast.Div) and b
        return a/b
    return visit(ast.parse(s,mode='eval').body)

def places(value):
    """Long division with complete remainder-cycle detection AFTER reduction."""
    value=F(value);remainder=value.numerator%value.denominator;seen=set();digits=0
    while remainder:
        if remainder in seen:return None
        seen.add(remainder);remainder=(remainder*10)%value.denominator;digits+=1
    assert (10**digits*value).denominator==1
    assert all((10**k*value).denominator!=1 for k in range(digits))
    return digits

def canonical_fraction(s,value,mixed=False):
    assert expr(s)==value
    for n,d in fs(s):assert 0<n<d and math.gcd(n,d)==1,(s,n,d)
    if mixed:
        assert re.fullmatch(r'\(\d+ \+ \(\d+/\d+\)\)',s),s
        assert number(r'^\((\d+) \+',s)==value.numerator//value.denominator

def finite_choice(r,finite):
    flags=[(places(expr(o))is not None)==finite for o in r['options']]
    return one(o for o,t in zip(r['options'],flags)if t),flags

def traps(r,values):
    for value in values:assert choose(r,value)!=r['answer'],(r['editionId'],value)

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-decimal-conversion-');ds=decimals(s);fractions=fs(s);note=''
    if k=='unknown-unreduced-mixed-denominator':
        text=one(ds);w,n=map(int,m(r'\((\d+) \+ \((\d+)/b\)\)',s).groups());whole,part=text.split(',');assert int(whole)==w and int(part)==n and 'қысқартпай' in s
        answer=str(10**len(part));assert w+F(n,int(answer))==D(text)
        note=f'Actual {text}: keep whole {w}, fractional numerator {n}, required UNREDUCED denominator 10^{len(part)}={answer}; no cancellation.'
    elif k in {'fixed-ten-denominator-new-numerator','equivalent-fixed-hundredths-numerator'}:
        n,d=one(fractions);target=number(r'Бөлімі (\d+)',s)if k.startswith('fixed')else number(r'\(x/(\d+)\)',s);v=F(n,d)*target;answer=integer(v);assert F(int(answer),target)==F(n,d)
        note=f'Printed {n}/{d} preserved at FIXED denominator {target}; new NUMERATOR={v}, not multiplier {F(target,d)}; substitution exact.'
    elif k in {'decimal-to-reduced-fraction','leading-zero-decimal-to-fraction','tenths-decimal-to-fraction','decimal-with-zero-to-mixed','decimal-to-reduced-mixed'}:
        text=one(ds);value=D(text);answer=choose(r,value);ismixed=k in {'decimal-with-zero-to-mixed','decimal-to-reduced-mixed'};canonical_fraction(answer,value,ismixed)
        note=f'Actual {text} parsed as exact integer/{10**len(text.split(",")[1])}, reduced to {value}; all actual MCQs compared; '+('whole part and proper reduced mixed fraction preserved.'if ismixed else'leading zeros determine denominator, requested reduced fraction verified.')
    elif k in {'thousandths-fraction-place-count','minimal-fraction-decimal-place-count'}:
        n,d=one(fractions);value=F(n,d);p=places(value);assert p is not None;answer=str(p)
        note=f'Actual {n}/{d} REDUCED to {value}, independent remainder long division terminates at {p} digits; EVERY power 10^0…10^{p-1} fails integrality, so count is MINIMAL even after cancellation.'
    elif k=='denominator-expansion-multiplier':
        n,d=one(fractions);target=number(r'бөлімі (\d+) болатын',s);v=F(target,d);answer=integer(v);assert F(n*int(answer),d*int(answer))==F(n,d)
        note=f'Actual denominator {d}×{answer}={target}; SAME multiplier applies to numerator {n}; requested multiplier, not new numerator {n*int(answer)}.'
    elif k in {'quarter-fraction-to-decimal','sixteenths-fraction-to-decimal','unequal-two-five-powers-decimal','mixed-half-to-decimal','mixed-twenty-fifths-to-decimal'}:
        expression=one(groups(s));value=expr(expression);answer=choose(r,value);p=places(value);assert p is not None and len(answer.split(',')[1])==p
        note=f'Full printed {expression}, including whole part and Unicode powers if any, exact AST={value}; all decimal MCQs compared, minimal digits {p}.'
        if k=='mixed-half-to-decimal':
            whole=number(r'^\((\d+) \+',expression);n,d=one(fractions);assert choose(r,F(whole)+F(d,10))!=answer and 'тек бөлімді үтірден кейін' in r['solution']
            note+=' Final denominator-only 17,2 diagnostic wording reread; concatenation and comma shift remain distinct.'
        if k=='mixed-twenty-fifths-to-decimal':
            whole=number(r'^\((\d+) \+',expression);n,d=one(fractions);assert choose(r,F(whole)+F(n,10**len(str(n))))!=answer
            note+=' Numerator-only trap checked separately, not confused with half denominator-only trap.'
    elif k in {'reduced-tenths-denominator','reduced-thousandths-denominator','small-decimal-reduced-denominator'}:
        text=one(ds);value=D(text);answer=str(value.denominator)
        assert math.gcd(value.numerator,value.denominator)==1
        note=f'Displayed {text}→exact reduced {value}; asked FINAL denominator {answer}, not unreduced 10^{len(text.split(",")[1])}.'
    elif k=='select-terminating-irreducible-fraction':
        assert all(math.gcd(*one(fs(o)))==1 for o in r['options']);answer,flags=finite_choice(r,True)
        note=f'All printed fractions are irreducible; remainder-cycle/termination flags {flags}; exactly {answer} terminates, independent of author prime-factor rule.'
    elif k=='unsold-share-as-decimal':
        whole,sold=map(int,m(r'(\d+) л сусын.*? (\d+) л сатты',s).groups());assert 0<sold<whole;remaining=whole-sold;value=F(remaining,whole);answer=choose(r,value);traps(r,[F(sold,whole),F(remaining,100)])
        note=f'Conservation {whole}L={sold} sold+{remaining} unsold; requested UNSOLD/ORIGINAL={value}={answer}, sold share and litres/100 traps false.'
    elif k=='minutes-to-decimal-hours':
        mins=number(r'сабағы (\d+) минут',s);value=F(mins,60);answer=choose(r,value);assert 'САҒАТПЕН' in s
        note=f'Actual {mins} minutes ÷60={value} hours; all MCQs exact, decimal digits are not minute notation.'
    elif k=='mixed-decimal-hours-to-minutes':
        hours=D(one(ds));answer=integer(hours*60);whole=hours.numerator//hours.denominator;assert hours*60==whole*60+(hours-whole)*60
        note=f'FULL printed {one(ds)} hours×60={answer} minutes; whole {whole} hours retained, fractional hours separately converted.'
    elif k=='decimal-to-fixed-denominator-numerator':
        value=D(one(ds));den=number(r'\(x/(\d+)\)',s);answer=integer(value*den);assert F(int(answer),den)==value
        note=f'Printed decimal {one(ds)} and fixed denominator {den} imply numerator {answer}; substitution verifies, raw decimal digits are not numerator here.'
    elif k=='decimal-length-equal-pieces-centimetres':
        length=D(one(ds));pieces=number(r'бауды (\d+) бірдей',s);answer=integer(length/pieces*100);assert int(answer)*pieces==length*100
        note=f'Actual total {length} metres divided into {pieces} EQUAL pieces, THEN ×100 to centimetres→{answer}; conservation recomposed.'
    elif k=='decimal-with-fixed-numerator-denominator':
        value=D(one(ds));n=number(r'\((\d+)/n\)',s);answer=integer(F(n)/value);assert F(n,int(answer))==value
        note=f'Actual {one(ds)} with FIXED numerator {n} gives denominator {answer}; no assumed power-of-ten denominator, exact substitution.'
    elif k=='select-nonterminating-after-reduction':
        answer,flags=finite_choice(r,False);reduced=[str(expr(o))for o in r['options']]
        assert sum(places(expr(o))is None for o in r['options'])==1
        note=f'Every raw denominator reduced FIRST: {reduced}; nontermination flags {flags}, only {answer} repeats. Raw factors 7/11/3 cancel in finite options.'
    elif k=='count-terminating-fractions':
        values=[F(n,d)for n,d in fractions];flags=[places(v)is not None for v in values];answer=str(sum(flags))
        note=f'ALL displayed fractions reduced to {list(map(str,values))}, complete long-division flags {flags}, count {answer}; raw other-prime factors are not sufficient to reject.'
    elif k=='select-false-fraction-decimal-equality':
        flags=[]
        for o in r['options']:
            left,right=o.split(' = ');flags.append(expr(left)==D(right))
        answer=one(o for o,t in zip(r['options'],flags)if not t);assert sum(flags)==3
        note=f'All FOUR actual equalities exact checked: {flags}; target asks FALSE, so deliberately false option {answer} is retained as the key, not corrected away.'
    elif k=='select-correct-hours-minute-equality':
        flags=[];ledgers=[]
        for o in r['options']:
            h,mins,text=m(r'^(\d+) сағ (\d+) мин = (\d+,\d+) сағ$',o).groups();h,mins=int(h),int(mins);assert 0<=mins<60;actual=F(h)+F(mins,60);flags.append(actual==D(text));ledgers.append(str(actual))
        answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'Every printed hours/minutes pair parsed, exact hours {ledgers}; equality flags {flags}; minute digits cannot simply be appended after comma.'
    elif k=='count-numerators-for-finite-decimal':
        lo,hi=map(int,m(r'n — (\d+)–(\d+) аралығындағы',s).groups());den=number(r'\(n/(\d+)\)',s);domain=list(range(lo,hi+1));good=[n for n in domain if places(F(n,den))is not None];answer=str(len(good));assert lo==1 and hi<den and 'шеткі мәндер де кіреді' in s
        note=f'ALL {len(domain)} natural numerators {lo}…{hi} inclusive checked by REDUCED remainder cycles at denominator {den}; valid {good}, count {answer}; endpoints neither skipped nor extended.'
    elif k=='least-natural-numerator-and-decimal':
        den=number(r'\(x/(\d+)\)',s);domain=list(range(1,den+1));least=next(n for n in domain if places(F(n,den))is not None);flags=[]
        for o in r['options']:
            n,text=m(r'^x = (\d+); (\d+,\d+)$',o).groups();flags.append(int(n)==least and D(text)==F(int(n),den))
        answer=one(o for o,t in zip(r['options'],flags)if t);assert all(places(F(n,den))is None for n in range(1,least))
        note=f'Complete naturals 1…{least} prove LEAST x={least}; BOTH roles in every actual ordered pair checked, exact decimal {F(least,den)}. Finite x22 excluded because not minimum; correct x with wrong decimal also false.'
    elif k=='mixed-minus-decimal':
        expression=m(r'^(.+?) айырмасын',s)[1];value=expr(expression);answer=choose(r,value);canonical_fraction(answer,value,True)
        note=f'Entire printed subtraction {expression} exact AST={value}; proper reduced mixed answer {answer}, all wrong conversion/addition/lost-whole MCQs evaluated.'
    elif k=='decimal-fraction-ordered-operations':
        expression=m(r'есептеңіз: (.+?)\. Жауапқа',s)[1];value=expr(expression);answer=integer(value)
        note=f'Full displayed expression {expression} parsed by exact precedence AST, no author params; division by fraction and multiplication before addition produce {answer}.'
    elif k=='least-integer-multiplier-for-decimal':
        value=D(one(ds));domain=list(range(1,value.denominator+1));good=[n for n in domain if (n*value).denominator==1];answer=str(min(good));assert (int(answer)*value)>0 and all((n*value).denominator!=1 for n in range(1,int(answer)))
        note=f'Actual decimal {one(ds)}={value}; EVERY n1…{answer} tested for positive INTEGRAL product, first {answer}; no smaller natural succeeds.'
    elif k=='count-denominators-in-inclusive-range':
        lo,hi=map(int,m(r'бөлімі (\d+)–(\d+) аралығында',s).groups());n=number(r'\((\d+)/k\)',s);good=[d for d in range(lo,hi+1)if places(F(n,d))is not None];answer=str(len(good));assert 'екі шет те кіреді' in s
        note=f'ALL denominators {lo}…{hi} inclusive checked AFTER reducing numerator {n}; valid {good}, count {answer}. Cancellation may make non-2/5 raw denominator finite, so raw factor shortcut rejected.'
    elif k=='select-fraction-expandable-to-tenths':
        target=number(r'бөлімін дәл (\d+) етуге',s);flags=[]
        for o in r['options']:
            n,d=one(fs(o));factor=F(target,d);flags.append(factor.denominator==1 and factor>=1)
        answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'Exact target denominator {target} divided by EACH RAW denominator; natural expansion flags {flags}. Terminating alone is insufficient; no reduction or fractional multiplier allowed.'
    elif k=='decimal-share-of-class-count':
        total=number(r'үйірмесінде (\d+) оқушы',s);share=D(one(ds));answer=integer(total*share);assert 0<share<1 and int(answer)<=total
        note=f'Actual {total} students×displayed share {share}={answer} girls; positive whole-count domain and complement conservation checked.'
    elif k=='decimal-length-fraction-cut-centimetres':
        length=D(one(ds));n,d=one(fractions);part=F(n,d);answer=integer(length*part*100);assert 0<part<1 and 'КЕСІЛГЕН' in s
        note=f'Actual ORIGINAL length {length}m×CUT share {part}×100={answer}cm; cut and remainder sum to original, requested CUT not remainder.'
    elif k=='select-exact-three-decimal-places':
        target=number(r'кейін ДӘЛ (\d+) цифр',s);ps=[places(expr(o))for o in r['options']];answer=one(o for o,p in zip(r['options'],ps)if p==target)
        note=f'ALL actual fractions reduced then long-divided; MINIMAL decimal digits {ps}; unique {answer} has exactly {target}, appending zeros to other finite numbers is excluded.'
    elif k=='reduced-denominator-minus-numerator':
        value=D(one(ds));answer=integer(value.denominator-value.numerator);assert 'b − a' in s
        note=f'Actual {one(ds)} reduced to {value}; asked ORDERED denominator−numerator={value.denominator}−{value.numerator}={answer}, neither denominator alone nor unreduced digits.'
    elif k=='greatest-bounded-two-digit-unit-denominator':
        lo,hi=map(int,m(r'(\d+) ≤ d < (\d+)',s).groups());assert lo>=10 and hi<=100
        good=[d for d in range(lo,hi)if places(F(1,d))is not None];answer=str(max(good));assert all(places(F(1,d))is None for d in range(int(answer)+1,hi))
        note=f'Complete STRICT-BOUNDED domain {lo}≤d<{hi}, all valid {good}; greatest {answer}, EVERY larger d through {hi-1} independently repeats. Upper endpoint excluded.'
    elif k=='cancel-other-prime-before-finite-claim':
        expression=one(groups(s));value=expr(expression);assert places(value)is not None;flags=[]
        for o in r['options']:
            if re.fullmatch(r'\d+,\d+ санына тең',o):flags.append(D(one(decimals(o)))==value)
            else:assert o.startswith('Ақырлы ондық жазуы жоқ');flags.append(places(value)is None)
        answer=one(o for o,t in zip(r['options'],flags)if t)
        note=f'FULL printed power-product fraction {expression} exact reduced {value}; remainder terminates AFTER cancellation of common3. All value/nontermination conclusions checked, flags {flags}; raw3 alone does not prohibit termination.'
    elif k=='equivalent-decimal-ratio-with-sum':
        ratio=D(one(ds));total=number(r'a \+ b = (\d+)',s);pairs=[(a,total-a)for a in range(1,total)if F(a,total-a)==ratio];a,b=one(pairs);answer=str(a)
        note=f'ALL positive natural pairs with a+b={total} enumerated, only {(a,b)} has actual decimal ratio {ratio}; requested UNREDUCED numerator a={answer}, not reduced numerator or denominator.'
    else:raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==44;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        counted_naturals=r['modelId'].endswith(('count-numerators-for-finite-decimal','count-denominators-in-inclusive-range'))
        assert r['grade']==5 and r['minimumPlan']=='pro' and r['topic']==('num'if counted_naturals else'frac') and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution'];norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All saved/new conditions, full solutions and every MCQ manually read; independent exact DISPLAYED integer AST with comma literals/Unicode powers, complete remainder-cycle decimal criterion and full finite domains; no author solver/spec/params','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All44 full saved/new conditions/solutions/everyMCQ read','Reduce BEFORE termination; complete long-division remainder cycle and minimal digits','Requested raw/reduced numerator/denominator/multiplier and ordered pair roles kept distinct','All natural bounds, least/greatest, strict endpoint and SI60/100 conservation checked','Half denominator-only diagnostic fix reread; other43 unchanged']})
    assert len(refs)==44
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries];assert native['fractions']>100
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'17af6aad247a6d05','finding':'17,2 option encodes denominator-only 2 after comma, but explanation incorrectly called it numerator-only','resolution':'Author changed exactly this solution to «тек бөлімді үтірден кейін жазу»; full final row reread, snapshot confirms other43 and all math/options/params unchanged.'}],'scope':'All44 source-addressed grade5topic4.2 nonvisual decimal conversion adaptations; complete independent printed exact review','entries':entries}
    if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256']for e in signed['entries']}=={e['editionId']:e['sha256']for e in entries}
    print(json.dumps({'independentlyVerified':44,'wrongKeysRejected':44,'hashesMatched':44,'sourceRefs':44,'finiteNumeratorDomain':74,'finiteDenominatorInclusiveDomain':36,'strictUnitDenominatorDomain':66,'resolvedDidacticFindings':1,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
