"""Independent exact printed mixed-number review of48source-addressed editions.
No author model/spec/calculator imported. Printed native fractions and Unicode
exponents are parsed exactly with Fraction; finite natural domains are complete.
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
PACK='problems/editorial/batches/grade5-mixed-numbers.json'
OUT='problems/editorial/reviews/grade5-mixed-numbers.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
SUP='⁰¹²³⁴⁵⁶⁷⁸⁹';TRANS=str.maketrans(SUP,'0123456789')
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,s):
    found=re.search(pattern,s);assert found,(pattern,s);return found
def n(s):
    s=s.replace(' ','');assert s.isdigit();return int(s)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def choice(r,predicate):return one(o for o in r['options'] if predicate(o))
def groups(s):
    out=[];depth=0;start=None
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        if c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0;return out
def simple_pairs(s):return [tuple(map(int,p)) for p in re.findall(r'\((\d+)/(\d+)\)',s)]
def raw_pair(s):return one(simple_pairs(s))
def arithmetic(text,variables=None):
    variables=variables or {}
    # Parse superscripts before any normalization: NFKC would turn3¹²into312.
    text=re.sub(r'(\d+)(['+SUP+']+)',lambda p:p[1]+'**'+p[2].translate(TRANS),text)
    text=text.replace('×','*').replace('·','*').replace('−','-').strip()
    text=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',text)
    assert re.fullmatch(r'[0-9a-zA-Z ()+*/-]+',text),text
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):assert type(node.value) is int;return F(node.value)
        if isinstance(node,ast.Name):assert node.id in variables;return F(variables[node.id])
        assert isinstance(node,ast.BinOp),ast.dump(node)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        if isinstance(node.op,ast.Div):assert b!=0;return a/b
        assert isinstance(node.op,ast.Pow) and b.denominator==1 and 0<=b.numerator<=30
        return a**b.numerator
    return visit(ast.parse(text,mode='eval'))
def linear_coefficients(expression,names):
    # Only a linear polynomial is admitted, so coefficient checks are a proof,
    # not polynomial interpolation passed off as a universal claim.
    expression=re.sub(r'(?<=\d)(?=[a-zA-Z])','*',expression.replace('×','*').replace('−','-'))
    def visit(node):
        if isinstance(node,ast.Constant):assert type(node.value) is int;return [F(node.value)]+[F(0)]*len(names)
        if isinstance(node,ast.Name):assert node.id in names;return [F(0)]+[F(int(name==node.id)) for name in names]
        assert isinstance(node,ast.BinOp)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return [x+y for x,y in zip(a,b)]
        if isinstance(node.op,ast.Sub):return [x-y for x,y in zip(a,b)]
        assert isinstance(node.op,ast.Mult)
        assert all(v==0 for v in a[1:]) or all(v==0 for v in b[1:]),'Nonlinear universal proof rejected'
        if all(v==0 for v in a[1:]):return [a[0]*v for v in b]
        return [b[0]*v for v in a]
    return visit(ast.parse(expression,mode='eval').body)
def mixed(expr):return tuple(map(int,m(r'^\((\d+) \+ \((\d+)/(\d+)\)\)$',expr).groups()))
def canonical(parts,reduced=False):
    w,a,b=parts;return w>0 and 0<a<b and (not reduced or math.gcd(a,b)==1)
def mixed_choice(r,value,reduced=False,denominator=None):
    def fits(option):
        expressions=groups(option)
        if not expressions or ' + ' not in expressions[0]:return False
        expr=expressions[0];parts=mixed(expr)
        return canonical(parts,reduced) and (denominator is None or parts[2]==denominator) and arithmetic(expr)==value
    return choice(r,fits)
def simple_fraction_choice(r,value,reduced=False):return choice(r,lambda o:arithmetic(o)==value and (not reduced or math.gcd(*raw_pair(o))==1))
def list_choice(r,ns):return choice(r,lambda o:list(map(int,re.findall(r'\d+',o)))==ns)
KAZAKH={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10,'жиырма':20,'отыз':30,'қырық':40,'елу':50,'алпыс':60,'жетпіс':70,'сексен':80,'тоқсан':90}
def word_number(s):
    words=s.lower().strip().split();assert all(w in KAZAKH for w in words),words;return sum(KAZAKH[w] for w in words)
def spoken_mixed(s):
    if ' бүтін ' not in s:return None
    whole,rest=s.split(' бүтін ');terms=rest.split();numerator=word_number(terms[-1]);denwords=' '.join(terms[:-1]);denwords=re.sub(r'(дан|ден|тан|тен|нан|нен)$','',denwords);return word_number(whole),numerator,word_number(denwords)
def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-mixed-numbers-');note=''
    if k=='greatest-converted-numerator':
        whole,den=map(int,m(r'бүтін бөлігі (\d+), бөлшек бөлігінің бөлімі (\d+)',s).groups());valid=[whole*den+a for a in range(1,den)];answer=str(max(valid));note=f'All positiveproper fractionnumerators1..{den-1}, originaldenominator kept, rawconvertednumerators{valid}; maximum{answer}.'
    elif k in ['count-unit-shares','unit-mass-package-count']:
        expr=groups(s)[0];w,a,b=mixed(expr);unit=F(*simple_pairs(s)[-1]);assert unit==F(1,b);value=arithmetic(expr)/unit;assert value.denominator==1;answer=str(value.numerator);note=f'Actualwhole+fraction{expr}dividedby actualunitshare{unit}; count{answer}, not justwholepart.'
    elif k=='spoken-to-mixed':
        speech=m(r'«([^»]+)»',s)[1];parts=spoken_mixed(speech);assert canonical(parts);answer=choice(r,lambda o:mixed(o)==parts);note=f'Independent Kazakh word parser giveswhole/numerator/denominator{parts}; all4actualstructuralpartschecked, not bare expressionequivalence.'
    elif k in ['ask-mixed-whole','ask-fractional-remainder']:
        a,b=raw_pair(s);w,rem=divmod(a,b);assert w>0 and 0<rem<b;answer=str(w if k=='ask-mixed-whole' else rem);note=f'Exact Euclidean divmod ofactual{a}/{b}→quotient{w}, remainder{rem}; requestedrole{k}, originaldenominator retained.'
    elif k in ['mixed-to-improper-choice','mixed-to-numerator','reduce-part-then-convert']:
        expr=groups(s)[0];w,a,b=mixed(expr);assert canonical((w,a,b));target=arithmetic(expr)
        answer=str(w*b+a) if k=='mixed-to-numerator' else simple_fraction_choice(r,target,k=='reduce-part-then-convert');note=f'Actualcanonicalparts{w,a,b}; raw numerator{w*b+a}at originaldenominator{b}, exactvalue{target}; reductiononlywhenrequested.'
    elif k in ['improper-to-mixed-choice','reduce-improper-to-mixed','large-near-multiple-mixed']:
        a,b=raw_pair(s);value=F(a,b);w,rem=divmod(a,b);assert rem>0;answer=mixed_choice(r,value,k=='reduce-improper-to-mixed');note=f'Actual{a}/{b}exactdivmod{w,rem}; every MCQchecked for positiveproper fractionalpart and exactsamevalue, reductionrequested={k=="reduce-improper-to-mixed"}.'
    elif k=='recognize-canonical-mixed':
        def fits(o):
            if ' + ' not in o:return False
            return canonical(mixed(o))
        answer=choice(r,fits);note='Every actual writing inspected structurally: wholepositive plus propernonzerofraction; an equal-valued sum with improper fractionalpart is not already canonicalmixednotation.'
    elif k=='motion-mixed-whole':
        seconds,metres=map(int,m(r'(\d+) секундта (\d+) м',s).groups());value=F(metres,seconds);answer=str(value.numerator//value.denominator);note=f'Actual average{metres}/{seconds}={value}m/s, floorwholepart{answer}, not remainder/fullspeed.'
    elif k=='integer-fraction-numerator':
        whole,den=map(int,m(r'^(\d+) бүтін санын бөлімі (\d+)',s).groups());answer=str(whole*den);note=f'Exactwhole{whole}at supplieddenominator{den}requires numerator{answer}, not additiveorconcatenateddigits.'
    elif k=='division-as-mixed-equality':
        a,b,w,rem=map(int,m(r'^(\d+) : (\d+) = (\d+), қалдық (\d+)',s).groups());assert divmod(a,b)==(w,rem) and 0<rem<b
        def fits(o):
            left,right=o.split(' = ');return raw_pair(left)==(a,b) and mixed(right)==(w,rem,b) and canonical(mixed(right)) and arithmetic(left)==arithmetic(right)
        answer=choice(r,fits);note=f'All4actualequalities checked for GIVENdividend/divisor and canonical quotient/remainder roles{a,b,w,rem}; one distractor is numericallytrue at another denominator but is not canonicalmixed or the givendata.'
    elif k=='mixed-component-description':
        parts=mixed(groups(s)[0]);w,a,b=parts
        def fits(o):
            whole=int(m(r'^Бүтін бөлігі (\d+)',o)[1]);return whole==w and raw_pair(o)==(a,b)
        answer=choice(r,fits);note=f'Actualpartswhole{w}, completefraction{a}/{b}; alloptionschecksbothroles, reciprocalfractionexcluded.'
    elif k=='hours-minutes-as-mixed':
        hours,minutes=map(int,m(r'(\d+) сағат (\d+) минут',s).groups());value=F(hours)+F(minutes,60);answer=mixed_choice(r,value,True);assert all(o.endswith(' сағ') for o in r['options']);note=f'SI60minutes/hour, actual{hours}h{minutes}m exactvalue{value}; positiveproperfullyreducedMCQfractionandunits checked.'
    elif k=='digit-sum-fractional-numerator':
        whole,den=map(int,m(r'бүтін бөлігі (\d+), бөлшек бөлігінің бөлімі (\d+)',s).groups());num=sum(map(int,str(whole)));assert 0<num<den;value=F(whole)+F(num,den);answer=simple_fraction_choice(r,value);note=f'Actualwhole{whole}digit-sum{num}, properagainstdenominator{den}; exactmixedvalue{value}, allrawoptionschecked.'
    elif k=='expand-mixed-fractional-part':
        expr=groups(s)[0];w,a,b=mixed(expr);den=int(m(r'бөлшек бөлігінің бөлімі (\d+) болатын',s)[1]);value=arithmetic(expr);answer=mixed_choice(r,value,False,den);num=F(a*den,b);assert num.denominator==1;note=f'Whole{w}unchanged, actualpart{a}/{b}expandedto supplieddenominator{den}→numerator{num}; bothvalueandrawdenominator requirements checked.'
    elif k in ['blank-mixed-numerator','inverse-fractional-numerator']:
        if k=='blank-mixed-numerator':
            w,d,a,b=map(int,m(r'^\((\d+) \+ \(□/(\d+)\)\) = \((\d+)/(\d+)\)',s).groups());assert d==b
        else:w,b,a=map(int,m(r'Бүтін бөлігі (\d+), бөлшек бөлігінің бөлімі (\d+)[\s\S]*?алым (\d+) шықты',s).groups())
        valid=[num for num in range(1,b) if F(w)+F(num,b)==F(a,b)];answer=str(one(valid));note=f'Completepositivepropernumerator1..{b-1}domain, recovered{answer}; exact numerator−whole×denominator, roleof□checked.'
    elif k=='square-side-mixed':
        perimeter=int(m(r'периметрі (\d+) см',s)[1]);value=F(perimeter,4);answer=mixed_choice(r,value,True);assert all(o.endswith(' см') for o in r['options']);note=f'Actualsquareperimeter{perimeter}/4={value}cm; allactual MCQs includeproper/reducedfraction requirement and sameunit.'
    elif k in ['noninteger-quotient-count','count-fixed-whole-denominator']:
        if k=='noninteger-quotient-count':den=int(m(r'\(n/(\d+)\)',s)[1]);whole=int(m(r'бүтіні (\d+)',s)[1])
        else:whole,den=map(int,m(r'Бүтін бөлігі (\d+), бөлшек бөлігінің бөлімі (\d+)',s).groups())
        numerators=[n for n in range(1,(whole+1)*den+1) if n//den==whole and 0<n%den<den];answer=str(len(numerators));note=f'Completepositive1..{(whole+1)*den}numeratordomain, whole{whole}/den{den}and nonzeropart, valid{numerators}; equalityintegerexcludedandlaterwholesgrow.'
    elif k=='metres-centimetres-as-mixed':
        metres,cm=map(int,m(r'(\d+) м (\d+) см',s).groups());value=F(metres)+F(cm,100);answer=mixed_choice(r,value,True);assert all(o.endswith(' м') for o in r['options']);note=f'Exact100cm/m, actual{metres}m{cm}cm={value}m; fullpartreduction and everyactualMCQunit checked.'
    elif k=='mixed-hours-to-minutes':
        value=arithmetic(groups(s)[0])*60;assert value.denominator==1;answer=str(value.numerator);note=f'Actualwhole+fractionhours×60={answer}minutes, exactallpartsconversion notdecimaldigits.'
    elif k=='boat-mixed-rate':
        hours,km=map(int,m(r'(\d+) сағатта (\d+) км',s).groups());value=F(km,hours);answer=mixed_choice(r,value,True);assert all(o.endswith(' км/сағ') for o in r['options']);note=f'Actualaveragespeed{km}/{hours}={value}km/h; quotient/remainderfullyreduced, unitsandall4MCQschecked.'
    elif k=='normalize-improper-fractional-part':
        expr=groups(s)[0];w,a,b=mixed(expr);assert a>=b;value=arithmetic(expr);answer=str(value.numerator//value.denominator);note=f'ExplicitSUMmeaning retained for noncanonicalpart{w,a,b}, exactvalue{value}, normalizedfloor{answer}; originalwholenotmistakenforfinalwhole.'
    elif k=='recover-dividend-from-mixed':
        den=int(m(r'x санын (\d+) санына бөлгенде',s)[1]);value=arithmetic(groups(s)[0]);target=den*value;assert target.denominator==1;answer=str(target.numerator);note=f'Actualdivisor{den}×exactquotient{value}={target}; recoverdividend not denominator/remainder.'
    elif k=='count-symbolic-mixed-products':
        rem,target=map(int,m(r'бөлшек бөлігі \((\d+)/b\)[\s\S]*?\((\d+)/b\)',s).groups());product=target-rem;valid=[(a,b) for a in range(1,product+1) for b in range(1,product+1) if a*b==product and 0<rem<b];answer=str(len(valid));note=f'Completepositive1..{product}²factorpairsforab={product}, canonicalpart{rem}/b restrictsb>{rem}; valid{valid}.'
    elif k=='three-distinct-digit-mixed-count':
        digits=list(map(int,m(r'^([\d, ]+) цифрларының',s)[1].replace(',','').split()));assert len(digits)==len(set(digits))==4 and all(1<=i<=9 for i in digits)
        valid=[(w,a,b) for w in digits for a in digits for b in digits if len({w,a,b})==3 and canonical((w,a,b))];answer=str(len(valid));assert len({F(w)+F(a,b) for w,a,b in valid})==len(valid);note=f'All4³digitassignmentswith3distinctroles tested, properpartonly; fullvalid{valid}, count{answer}, distinctnumericvaluesalsoindependentlychecked.'
    elif k=='irreducible-remainder-dividend-list':
        den=int(m(r'\(x/(\d+)\)',s)[1]);whole=int(m(r'бүтін бөлігі (\d+) болатын',s)[1]);valid=[a for a in range(1,(whole+1)*den+1) if a//den==whole and a%den>0 and math.gcd(a%den,den)==1];answer=list_choice(r,valid);note=f'Completepositivenumeratorbound{(whole+1)*den}, originaldenominator{den}; nonzeroremainder AND rawcoprime tested, fullxlist{valid}.'
    elif k=='incorrect-conversion-numerator-gap':
        exprs=groups(s);assert len(exprs)==2;w,a,b=mixed(exprs[0]);wrong_expr=exprs[1];wrong_value=arithmetic(wrong_expr);wrong_numerator=wrong_value*b;assert wrong_numerator.denominator==1;correct=w*b+a;gap=correct-int(wrong_numerator);assert gap>0;answer=str(gap);note=f'Explicitincorrectexample evaluated aswritten{wrong_expr}; rawwrongnumerator{wrong_numerator}, correct{correct}, requested rawgap{gap}, notfractionvaluedifference.'
    elif k=='recover-then-new-divisor':
        first,second=map(int,m(r'x санын (\d+) санына бөлгенде[\s\S]*?Сол x санын (\d+) санына',s).groups());original=arithmetic(groups(s)[0])*first;assert original.denominator==1;target=original/second;answer=mixed_choice(r,target);note=f'Actualoriginaldividend{original}fromfirstexactquotient/divisor{first}; seconddivisionby{second}={target}, everycanonicalMCQ checked.'
    elif k=='irreducible-mixed-fixed-sum':
        whole=int(m(r'бүтін (\d+) болды',s)[1]);total=int(m(r'a \+ b = (\d+)',s)[1]);allpairs=[(a,total-a) for a in range(1,total) if a//(total-a)==whole and a%(total-a)>0];valid=[(a,b) for a,b in allpairs if math.gcd(a,b)==1];a,b=one(valid);answer=mixed_choice(r,F(a,b),True);note=f'All{total-1}positivefixed-sumorderedpairs, correctwholenonzeropart{allpairs}; rawgcd1leaves{valid}, no acceptanceof reducedvaluefromwrongrawsum.'
    elif k=='equal-whole-remainder-largest-numerator':
        den=int(m(r'\(n/(\d+)\)',s)[1]);valid=[a for a in range(1,den*den) if a//den==a%den and a%den>0];answer=str(max(valid));assert den-1==int(answer)//den;note=f'Quotient=remainder<den bounds quotient1..{den-1}and n≤den²−1; completefinite n1..{den*den-1}list{valid}, maximum{answer}.'
    elif k=='false-mixed-equality':
        def fits(o):left,right=o.split(' = ');return arithmetic(left)!=arithmetic(right)
        answer=choice(r,fits);assert r.get('intentionalIncorrectExample') is True;note='Everyactual equality exactlyevaluated, falsevector'+str([fits(o) for o in r['options']])+'; deliberatefalseexample clearlyasked, correct230/17remainder9not7.'
    elif k=='mixed-duration-arrival-clock':
        h,minute=map(int,m(r'(\d{2}):(\d{2})',s).groups());duration=arithmetic(groups(s)[0])*60;assert duration.denominator==1;arrival=h*60+minute+int(duration);assert 0<=arrival<24*60;expected=f'{arrival//60:02d}:{arrival%60:02d}';answer=choice(r,lambda o:o==expected);note=f'Actualdeparture{h:02d}:{minute:02d}, exactduration{duration}minutes; carryover counted, same-daycondition verified, arrival{expected}.'
    elif k=='consecutive-mixed-components':
        target=int(m(r'алым (\d+) болды',s)[1]);valid=[w for w in range(1,target+1) if w*(w+2)+(w+1)==target];answer=str(one(valid));assert all((w+1)*(w+3)+(w+2)>w*(w+2)+(w+1) for w in range(1,target+1));note=f'Completepositivewhole1..{target}domain withrawroles(w,w+1,w+2), unique{answer}; monotonepolynomial excludesanylargerroot.'
    elif k=='mixed-to-spoken':
        parts=mixed(groups(s)[0]);answer=choice(r,lambda o:spoken_mixed(o)==parts);note=f'IndependentKazakhword-role parser testsallactualwordanswers againstrawcanonicalparts{parts}; denominatorinflection parsedbefore numerator, nonmixedoutlierexcluded.'
    elif k=='specific-fractional-part-choice':
        target=F(*raw_pair(s));answer=choice(r,lambda o:arithmetic(o)-math.floor(arithmetic(o))==target);note=f'Everyactualimpropervalue exactfractionalpart afterfloor, requestedvalue{target}notjustmatchingremainderdigit.'
    elif k=='invariant-numerator-remainder-gap':
        den=int(m(r'\(a/(\d+)\)',s)[1]);whole=int(m(r'\((\d+) \+ \(b/',s)[1]);valid=[whole*den+b-b for b in range(1,den)];assert len(set(valid))==1;answer=str(one(set(valid)));note=f'Completepositiveb1..{den-1}domain and universal cancellation a=whole×den+b gives a−b={answer}, invariantnotonearbitrarysample.'
    elif k=='select-given-improper-numerator':
        target=int(m(r'алым (\d+) болады',s)[1]);answer=choice(r,lambda o:(lambda p:p[0]*p[2]+p[1])(mixed(o))==target);note=f'Actualgiven-denominator rawconvertednumerators{[(lambda p:p[0]*p[2]+p[1])(mixed(o)) for o in r["options"]]}, target{target}; no simplificationbefore comparison.'
    elif k=='largest-remainder-with-divisibility':
        w,den=map(int,m(r'^\((\d+) \+ \(x/(\d+)\)\)',s).groups());divisor=int(m(r'алым (\d+) санына',s)[1]);valid=[a for a in range(1,den) if (w*den+a)%divisor==0];answer=str(max(valid));note=f'Everypositiveproperremainder1..{den-1}checked againstrawnumerator{w}×{den}+x divisibleby{divisor}; valid{valid}, maximum{answer}.'
    elif k=='sum-denominators-fixed-whole':
        top=int(m(r'\((\d+)/b\)',s)[1]);whole=int(m(r'бүтін (\d+) және',s)[1]);valid=[b for b in range(1,top+1) if top//b==whole and top%b>0];answer=str(sum(valid));note=f'Completepositivedenominator1..{top}, whole{whole}andnonzeropart; valid{valid}, sum{answer}; largerdenominatorsgivevalue<1andcannotqualify.'
    elif k=='mixed-sequence-converted-numerator':
        coefficient,offset,query=map(int,m(r'бүтін бөлігі (\d+)n[\s\S]*?бөлімі n \+ (\d+)[\s\S]*?(\d+)-мүшені',s).groups());assert [mixed(g) for g in groups(s)]==[(coefficient*n,n,n+offset) for n in range(1,5)];w,a,b=coefficient*query,query,query+offset;assert canonical((w,a,b));answer=str(w*b+a);assert r['topic']=='seq';note=f'Explicitgivencomponents andall4printedexamples matchnrule; query{query}gives{w,a,b}, rawgiven-denominatornumerator{answer}, not a reducednumerator or guessedsequence.'
    elif k=='symbolic-euclidean-mixed':
        coefficient,rem,den=map(int,m(r'\(\((\d+)n \+ (\d+)\)/(\d+)\)',s).groups());assert coefficient==den and 0<rem<den
        def fits(o):
            whole,part=m(r'^Бүтін бөлігі ([^,]+), бөлшек бөлігі (.+)$',o).groups();a,b=raw_pair(part);return linear_coefficients(whole,['n'])==[0,1] and F(a,b)==F(rem,den) and 0<a<b
        answer=choice(r,fits);note=f'Universal exactEuclideandivision{den}n+{rem}by{den}: affinewholecoefficient1andpositiveproperremainder{rem}; everyactualsymbolicMCQpartchecked structurallyandbyFraction.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==48;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        topic='geo' if r['modelId'].endswith('square-side-mixed') else 'seq' if r['modelId'].endswith('mixed-sequence-converted-numerator') else 'frac';assert r['grade']==5 and r['topic']==topic and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact printed Fraction/Euclidean roles plus canonical mixed structure; fullfactor/digit/sum/denominator domains, actual Kazakhspoken roles, exacttime/units and symbolic affine identity','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all48saved/newconditions/MCQs/fullsolutions read manually','whole/remainder/denominator roles and positiveproper fractionalparts checked structurally','originaldenominator kept whenrequested; reductiononlywhenrequested; intentionallyincorrect examples separated','allfinite naturalfactor/digit/fixedsum/denominator/remainder domains checked completely','allactualMCQequations/wordroles/units inspected; algebraicequivalence alone doesnotprove canonicalmixed form']})
    assert len(refs)==48
    assert arithmetic('(52/5)')==arithmetic('(9 + (7/5))') and not canonical(mixed('(9 + (7/5))'))
    assert spoken_mixed('алты бүтін он үштен жеті')==(6,7,13) and spoken_mixed('алты бүтін оннан үш')==(6,3,10)
    assert mixed('(2 + (9/12))')==(2,9,12) and 2*12+9==33 and arithmetic('(2 + (9/12))').numerator==11
    assert F(130,15)==8+F(2,3) and F(130,16)==8+F(1,8)
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All48source-addressed saved grade5mixed-number editions; noauthorcalculator/spec imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':48,'wrongKeysRejected':48,'sourceRefs':48,'hashesMatched':48,'canonicalMixedRolesChecked':True,'kazakhSpokenRolesParsed':True,'authorSolverImported':False}))
if __name__=='__main__':main()
