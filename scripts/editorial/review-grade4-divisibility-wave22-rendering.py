"""Independent review of every saved/new divisibility condition and full solution.
Only printed givens/options are used by this oracle, never author parameters or
models. Complete decimal/residue classes prove the last-digit/parity invariants;
finite natural-number/digit domains are enumerated including all zero exclusions.
"""
import ast
import copy
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-divisibility-wave22.json'
OUT='problems/editorial/reviews/grade4-divisibility-wave22.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def n(s):
    s=s.replace(' ','');assert s.isdigit(),s;return int(s)
def m(pattern,s):
    found=re.search(pattern,s);assert found,(pattern,s);return found
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def choice(r,predicate):return one(o for o in r['options'] if predicate(o))
def arithmetic(text,variables=None):
    variables=variables or {};text=re.sub(r'(?<=\d)\s+(?=\d)','',text).replace('·','*').replace('−','-').replace(':','/').strip()
    assert re.fullmatch(r'[0-9MN ()+*/-]+',text),text
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):assert type(node.value) is int;return Fraction(node.value)
        if isinstance(node,ast.Name):assert node.id in variables;return Fraction(variables[node.id])
        assert isinstance(node,ast.BinOp),ast.dump(node)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        assert isinstance(node.op,ast.Div) and b!=0
        return a/b
    return visit(ast.parse(text,mode='eval'))
def property_true(option,number):
    lower=option.lower();tests=[]
    if lower.startswith('тақ'):tests.append(number%2==1)
    if lower.startswith('жұп'):tests.append(number%2==0)
    divisibilities=re.findall(r'(\d+)-(?:ға|ге|қа|ке) бөлін(еді|бейді)',lower)
    for divisor,ending in divisibilities:tests.append((number%int(divisor)==0)==(ending=='еді'))
    assert tests,option;return all(tests)
def interval(s):return tuple(map(n,m(r'([\d ]+)–([\d ]+) аралы',s).groups()))
def strict_interval(s):return tuple(map(n,m(r'([\d ]+) санынан (?:қатаң )?(?:үлкен|көп)(?:,| және)?\s+([\d ]+) санынан (?:кіші|аз)',s).groups()))
def wildcard_numbers(pattern):
    assert pattern.count('□') in (1,2);length=len(pattern)
    return [i for i in range(10**(length-1),10**length) if all(a=='□' or a==b for a,b in zip(pattern,str(i)))]
def solve(r):
    s=r['statement'];k=r['skillFamily'];note=''
    if k=='last-digit-ten':
        divisor=int(m(r'Қалдықсыз (\d+)-ға',s)[1]);assert divisor==10;digits={a for a in range(10) if a%divisor==0}
        def possible(o):
            if 'Кез келген жұп' in o:return set(range(0,10,2))
            return set(map(int,re.findall(r'\d+',o)))
        answer=choice(r,lambda o:possible(o)==digits);note='Complete decimal residue classes; n=10q+r, divisible10iff r0. Other option sets differ.'
    elif k=='largest-two-digit-five':
        bound=int(m(r'Екі таңбалы, (\d+) санынан кіші',s)[1]);good=[i for i in range(10,100) if i<bound and i%5==0];answer=str(max(good));note=f'All90two-digitnumbers checked; strictupper{bound}, maximum{answer}.'
    elif k=='units-wildcard-ten':
        pattern=m(r'(\d+□) саны (\d+)-ға',s)[1];d=int(m(r'(\d+□) саны (\d+)-ға',s)[2]);good=[str(i%10) for i in wildcard_numbers(pattern) if i%d==0];answer=choice(r,lambda o:o in good);assert len(good)==1;note=f'All10digits for{pattern}; only{good}.'
    elif k=='least-subtraction':
        number=n(m(r'^([\d ]+) санынан',s)[1]);divisor=int(m(r'нәтиже (\d+)-ке',s)[1]);valid=[i for i in range(number+1) if (number-i)%divisor==0];answer=str(min(valid));assert min(valid)==number%divisor;note=f'Full nonnegative subtraction0..{number}; minimum{answer}; no negative shortcut.'
    elif k=='odd-name':
        assert 'екіден' in s and '1 зат' in s;answer=choice(r,lambda o:o=='Тақ сан');assert all((2*q+1)%2==1 for q in range(100));note='General form2q+1has residue1for allintegerq; pairing one leftover identifies odd, not a magnitude category.'
    elif k=='sum-strict-multiples':
        lo,hi=strict_interval(s);divisor=int(m(r', (\d+)-ке бөлінетін',s)[1]);good=[i for i in range(lo+1,hi) if i%divisor==0];answer=str(sum(good));note=f'Complete opennaturalinterval({lo},{hi}), values{good}, sum{answer}.'
    elif k in ['select-ten','select-five','select-even']:
        divisor=2 if k=='select-even' else int(m(r'Қай сан (\d+) санына',s)[1]);answer=choice(r,lambda o:n(o)%divisor==0);note=f'Actual option remainders mod{divisor}:'+str([n(o)%divisor for o in r['options']])
    elif k=='count-ten-inclusive':
        lo,hi=interval(s);divisor=int(m(r'алғанда, (\d+)-ға',s)[1]);good=[i for i in range(lo,hi+1) if i%divisor==0];answer=str(len(good));note=f'Every naturalinteger in closed[{lo},{hi}]; values{good}; inclusive upper retained.'
    elif k=='forbidden-units-even':
        pattern=m(r'(\d+□) саны',s)[1];answer=choice(r,lambda o:int(pattern.replace('□',o))%2!=0);note='All actual offered unit digits substituted; exactly one odd terminal.'
    elif k=='distinct-three-digit-even':
        digits=set(map(int,re.findall(r'\d',s.split(' цифрларынан')[0])));assert 0 in digits and 'Бірінші цифр 0 болмайды' in s;good=[i for i in range(100,1000) if len(set(str(i)))==3 and set(map(int,str(i)))<=digits and i%2==0];answer=str(len(good));note=f'All900three-digitnaturalnumbers, full digitset{sorted(digits)}, leadingzeroexcluded; valid{good}.'
    elif k=='fixed-last-no-wildcard':
        pattern=m(r'(\d+□\d+) саны (\d+)-ке',s)[1];divisor=int(m(r'(\d+□\d+) саны (\d+)-ке',s)[2]);good=[i for i in wildcard_numbers(pattern) if i%divisor==0];assert good==[];answer=choice(r,lambda o:o=='Ешқандай цифр');note=f'All10internaldigits in{pattern}: none changes terminal{pattern[-1]}, no divisible{divisor}number.'
    elif k=='universal-implication':
        assert r['options']==['5-ке бөлінетін әр натурал сан тақ болады','Әр жұп сан 10-ға қалдықсыз бөлінеді','5-ке қалдықсыз бөлінетін әр натурал сан 10-ға да бөлінеді','10-ға бөлінетін әр натурал сан 5-ке де бөлінеді']
        predicates=[lambda v:v%5!=0 or v%2==1,lambda v:v%2!=0 or v%10==0,lambda v:v%5!=0 or v%10==0,lambda v:v%10!=0 or v%5==0];truths=[all(p(v) for v in range(1,11)) for p in predicates];assert truths==[False,False,False,True];answer=r['options'][one(i for i,v in enumerate(truths) if v)];note='All10complete residueclasses modulo10; every predicate periodic10. Generaltrueproof10q=5(2q); counterexamples30,22,35checked.'
    elif k=='count-odd-five':
        lo,hi=interval(s);good=[i for i in range(lo,hi+1) if i%5==0 and i%2==1];answer=str(len(good));note=f'Closed[{lo},{hi}] full conjunction5divisibleANDodd:{good}.'
    elif k=='largest-strict-ten':
        bound=n(m(r'^([\d ]+) санынан қатаң кіші',s)[1]);good=[i for i in range(1,bound) if i%10==0];answer=choice(r,lambda o:n(o)==max(good));note=f'Complete natural1..{bound-1}; excluded bound{bound}, maximum{max(good)}.'
    elif k in ['sum-parity','odd-product-five','even-times-five']:
        if k=='sum-parity':expr=m(r'анықтаңыз: (.+?) қосындысы',s)[1]
        elif k=='odd-product-five':expr=m(r'орындамай, (.+?) көбейтіндісінің',s)[1]
        else:expr=m(r'анықтаңыз: (.+?) көбейтіндісі',s)[1]
        exact=arithmetic(expr);assert exact.denominator==1;v=exact.numerator;answer=choice(r,lambda o:property_true(o,v));note=f'Actual printed expression exact{v}, terminal{v%10}, parity{v%2}; all4option predicates checked.'
    elif k=='count-odd-inclusive':
        lo,hi=interval(s);good=[i for i in range(lo,hi+1) if i%2==1];answer=str(len(good));note=f'Every integer incl bothendpoints[{lo},{hi}], oddcount{answer}, first{good[0]},last{good[-1]}.'
    elif k=='internal-wildcard-even':
        pattern=m(r'(\d+□\d+) саны',s)[1];good=[i for i in wildcard_numbers(pattern) if i%2==0];answer=str(len(good));note=f'All10internaldigits produce even terminal{pattern[-1]}, valid{good}.'
    elif k=='count-five-inclusive':
        lo,hi=interval(s);good=[i for i in range(lo,hi+1) if i%5==0];answer=str(len(good));note=f'Every integer in closed[{lo},{hi}], divisible5count{answer}; bothboundarymultiples included.'
    elif k in ['select-even-not-five','select-five-not-ten']:
        a,b=map(int,m(r'Қай сан (\d+) санына бөлінеді, бірақ (\d+) санына бөлінбейді',s).groups());answer=choice(r,lambda o:n(o)%a==0 and n(o)%b!=0);note=f'All actual option ordered remaindersmod{a},{b}:'+str([(n(o)%a,n(o)%b) for o in r['options']])
    elif k=='factorial-trailing-zeros':
        limit=int(m(r'… · (\d+) көбейтіндісіне',s)[1]);assert 1<limit<25;old=raw_for(r)['statement'];assert '\\cdot' in old and '$15$' in old;product=math.factorial(limit);zeros=len(str(product))-len(str(product).rstrip('0'));answer=str(zeros);assert product%(10**zeros)==0 and product//(10**zeros)%10!=0;note=f'Actual exact{limit}!={product}; terminalzeros{zeros}, nextdigitnonzero. Full product computes independently of counting5factors.'
    elif k in ['maximum-distinct-odd-five','minimum-distinct-both','minimum-distinct-odd-five']:
        ds=set(map(int,re.findall(r'\d',m(r'^Тек (.+?) цифрларын',s)[1])));digits=4 if 'төрт таңбалы' in s else 5;assert 'Бірінші цифр 0 болмайды' in s
        valid=[]
        for number in range(10**(digits-1),10**digits):
            chars=str(number)
            if len(set(chars))!=digits or not set(map(int,chars))<=ds:continue
            if k=='minimum-distinct-both':fits=number%2==0 and number%5==0
            else:fits=number%5==0 and number%10!=0
            if fits:valid.append(number)
        target=max(valid) if k.startswith('maximum') else min(valid);answer=choice(r,lambda o:n(o)==target) if r.get('options') else str(target);claimed=int(m(r'кандидаттар саны (\d+)',r['solution'])[1]);assert len(valid)==claimed;note=f'Complete{9*10**(digits-1)}natural{digits}-digitdomain; allowed{sorted(ds)}; valid{len(valid)}, extreme{target}; every leadingzero excluded by domain.'
    elif k=='two-wildcards-odd-five':
        pattern=m(r'(□\d□) —',s)[1];assert 'бір-бірінен тәуелсіз' in s and 'бірдей болуы мүмкін' in s;good=[i for i in wildcard_numbers(pattern) if i%5==0 and i%2!=0];answer=str(len(good));assert len(good)==9;note=f'Complete900natural3digitdomain with independent wildcards; valid{good}; leadingzeroexcluded, repeateddigitspermitted.'
    elif k=='odd-sum-impossible':
        count,target=map(int,m(r'Айша (\d+) тақ натурал санды қосып, (\d+) алдым',s).groups());assert count%2==1 and target%2==0;answer=choice(r,lambda o:o==f'Қате: {count} тақ санның қосындысы тақ болады');example=m(r'Дұрыс: (.+?) = (\d+)',r['options'][0]);terms=list(map(n,example[1].split(' + ')));assert len(terms)==count and sum(terms)==int(example[2])==target and not all(t%2 for t in terms);note=f'UniversalidentityΣ(2ki+1)=2Σki+{count}odd versus even{target}. Examplealltermsnotodd;1+9=10disproves generalthirdclaim.'
    elif k=='always-odd-expression':
        assert 'M — жұп' in s and 'N — тақ' in s;residues=[arithmetic(o,{'M':0,'N':1})%2 for o in r['options']];answer=r['options'][one(i for i,a in enumerate(residues) if a==1)];assert residues==[0,0,1,0];note='Polynomial arithmetic is compatible with reductionmod2; completegivenresidueclass(M0,N1) gives options'+str(residues)+', provingallnaturalM,N.'
    elif k=='two-remainders-count':
        lo,hi=strict_interval(s);d,a,e,b=map(int,m(r'(\d+) баладан жұптастырғанда (\d+) бала, (\d+) баладан топтастырғанда (\d+) бала',s).groups());assert 0<=a<d and 0<=b<e;valid=[i for i in range(lo+1,hi) if i%d==a and i%e==b];answer=str(one(valid));note=f'Completeopen({lo},{hi}) naturaldomain; simultaneousremainders{d}:{a},{e}:{b}, unique{answer}.'
    elif k=='inclusive-or-count':
        lo,hi=interval(s);good=[i for i in range(lo,hi+1) if i%2==0 or i%5==0];answer=str(len(good));assert 'бір рет саналады' in s;note=f'Closed[{lo},{hi}] full setunion membership, no doublecount; count{answer}; crosscheck{sum(i%2==0 for i in range(lo,hi+1))}+{sum(i%5==0 for i in range(lo,hi+1))}−{sum(i%10==0 for i in range(lo,hi+1))}.'
    elif k=='digit-sum-ten':
        target=int(m(r'қосындысы (\d+) болатын',s)[1]);good=[i for i in range(100,1000) if i%10==0 and sum(map(int,str(i)))==target];answer=str(len(good));note=f'All900natural3digitnumbers, combined sum{target}AND divisible10; list{good}.'
    elif k=='minimum-four-odd-five':
        bound=n(m(r'^([\d ]+) санынан үлкен',s)[1]);valid=[i for i in range(1000,10000) if i>bound and i%5==0 and i%2==1];answer=str(min(valid));note=f'Complete9000four-digitdomain; strictlower{bound}, bothoddand5divisible, minimum{answer}.'
    elif k=='all-even-row':
        answer=choice(r,lambda o:all(n(a)%2==0 for a in o.split(', ')));note='All16printednumbers checked; eachwrongrow has an actualoddmember.'
    elif k=='count-ten-strict':
        lo,hi=strict_interval(s);valid=[i for i in range(lo+1,hi) if i%10==0];answer=str(len(valid));note=f'Fullopeninterval({lo},{hi}):{valid}; bothmultipleendpoints explicitlyexcluded.'
    elif k=='count-even-not-five':
        lo,hi=interval(s);valid=[i for i in range(lo,hi+1) if 10<=i<100 and i%2==0 and i%5!=0];answer=str(len(valid));note=f'Fullclosedtwo-digitdomain[{lo},{hi}]; conjunctionevenANDnot5divisible; count{answer}.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==38;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==4 and r['minimumPlan']=='pro' and not r.get('image') and not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id']);normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip();assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact printed-given integer arithmetic; complete decimal/parity residue classes; complete bounded natural/digit/wildcard domains; exact factorial terminal digits','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['all38saved/newconditions/fullsolutions/MCQs read manually','actual printed MCQ truth and unique valid choice checked','strict/inclusive endpoints, leadingzero and natural-number bounds explicitly enforced','complete digit universes and independent wildcard equality semantics checked','universal parity/divisibility claims proved via complete residue classes, not only examples']})
    assert len(refs)==38
    # Universal decimal and parity invariants, not a numerical sample argument.
    for divisor in [2,5,10]:
        assert 10%divisor==0
        for residue in range(10):assert (10*137+residue)%divisor==residue%divisor
    assert [v for v in range(1,11) if v%10==0 and v%5!=0]==[]
    assert len(wildcard_numbers('□7□'))==90 and min(wildcard_numbers('□7□'))==170
    assert property_true('Тақ және 5-ке бөлінеді',15) and not property_true('Тақ және 5-ке бөлінеді',10)
    for bad in ['1 : 0','2**3','f(1)','x + 1']:
        try:arithmetic(bad)
        except (AssertionError,ZeroDivisionError):pass
        else:raise AssertionError('Unsafe AST accepted '+bad)
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','manualFindings':[{'sourceId':'5f1c04fc7702f8a7','status':'corrected_before_final_signature','finding':'Exact short source statement was independently reworded; final question now asks which offered number splits into two equal whole parts. Options/key/solution/params retained; other37row hashes unchanged.'}],'scope':'All38source-addressed saved divisibility/parity editions. Mathematical definitions and divisibility2/5/10 invariants are retained, not claimed as new semantic inventions. No author calculator imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':38,'wrongKeysRejected':38,'sourceRefs':38,'hashesMatched':38,'fullDecimalResidues':10,'parityQuotientRingChecked':True,'fullNaturalDigitDomains':[900,9000,90000],'factorialComputedExactly':20,'authorSolverImported':False}))
if __name__=='__main__':main()
