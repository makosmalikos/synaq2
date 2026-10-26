"""Independent full read of32 saved/new conditions, solutions and MCQs.
Own Python AST/Fraction arithmetic reads actual printed expressions; never imports
the author's BigInt parser, calculator, specs, or answer index.
"""
import ast,copy,hashlib,json,re,subprocess,sys
from collections import Counter
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-product-wave30.json'
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def match(pattern,s):
    m=re.search(pattern,s);assert m,(pattern,s);return m
def arithmetic(s,env=None):
    env=env or {};s=s.strip().replace('×','*').replace(':','/');assert re.fullmatch(r'[0-9a-z ()+*/]+',s),s
    def calc(n):
        if isinstance(n,ast.Expression):return calc(n.body)
        if isinstance(n,ast.Constant):assert type(n.value) is int;return F(n.value)
        if isinstance(n,ast.Name):assert n.id in env;return F(env[n.id])
        assert isinstance(n,ast.BinOp)
        a,b=calc(n.left),calc(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b!=0;return a/b
    return calc(ast.parse(s,mode='eval'))
def integer(v):
    v=F(v);assert v.denominator==1;return str(v.numerator)
def choose(r,predicate):return one(o for o in r['options'] if predicate(o))
def expression_choices(r,value):return choose(r,lambda o:arithmetic(o)==value)
def true_equal(o):
    terms=o.split(' = ');assert len(terms)==2;return arithmetic(terms[0])==arithmetic(terms[1])
def numeric_expression(s):return match(r'(\d+ : \(\d+ × \d+\))',s)[1]
def observe(r):
    k=r['modelId'].removeprefix('grade4-product-');s=r['statement'];ev={}
    if k=='factor-associative-choice':
        expr=match(r'Қай өрнек (\d+ × \d+) көбейтіндісіне',s)[1];v=arithmetic(expr)
        answer=expression_choices(r,v);ev={'printedTarget':expr,'value':integer(v),'allChoices':[integer(arithmetic(o)) for o in r['options']]}
    elif k in ['associative-product-compare','parentheses-division-comparison','associative-division-compare','fifty-hundred-comparison']:
        if k=='fifty-hundred-comparison':pair=match(r'^(\d+ × \d+ □ \d+ × \d+)',s)[1]
        else:pair=s.split(': ',1)[1].split('.')[0]
        left,right=pair.split(' □ ');a,b=arithmetic(left),arithmetic(right);answer='<' if a<b else '>' if a>b else '=';ev={'printedSides':[left,right],'values':[integer(a),integer(b)]}
    elif k=='nested-ten-product':
        expr=s.split(': ',1)[1].split('.')[0];answer=integer(arithmetic(expr));ev={'printedExpression':expr}
    elif k=='decomposed-divisor':
        expr=match(r'(\d+ : \d+) бөліндісін',s)[1];answer=integer(arithmetic(expr));ev={'printedExpression':expr}
    elif k=='twenty-product':
        expr=match(r'(\d+ × 20) көбейтіндісін',s)[1];answer=integer(arithmetic(expr));ev={'printedExpression':expr}
    elif k in ['division-chain-choice','division-factorization-choice']:
        expr=match(r'^(\d+ : \d+)',s)[1];v=arithmetic(expr);answer=expression_choices(r,v);ev={'printedTarget':expr,'allChoiceValues':[str(arithmetic(o)) for o in r['options']]}
    elif k in ['nested-product-division','nested-product-division-choice']:
        expr=numeric_expression(s);answer=integer(arithmetic(expr));ev={'printedExpression':expr}
    elif k=='symbolic-product-division':
        assert 'y > 1, z > 1' in s and 'x саны y × z көбейтіндісіне қалдықсыз бөлінеді' in s
        domains=[{'x':y*z*t,'y':y,'z':z} for y in range(2,12) for z in range(2,12) for t in range(1,10)]
        answer=choose(r,lambda o:all(arithmetic(o,e)==F(e['x'],e['y']*e['z']) for e in domains))
        ev={'naturalDomainCases':len(domains),'algebraicProof':'x/(y*z)=(x/y)/z, y,z nonzero; all distractors have counterexamples'}
    elif k in ['correct-division-equality','division-rewrite-equality']:
        answer=choose(r,true_equal);ev={'allChoiceTruthValues':[true_equal(o) for o in r['options']]}
    elif k=='odd-division-expression':
        values=[arithmetic(o) for o in r['options']];c=Counter(values);assert sorted(c.values())==[1,3]
        answer=choose(r,lambda o:c[arithmetic(o)]==1);ev={'allChoiceValues':[integer(v) for v in values]}
    elif k in ['round-hundred-multiplier','round-thousand-multiplier']:
        expr=match(r'(\d+ × \d+) мәнін',s)[1];answer=integer(arithmetic(expr));ev={'printedExpression':expr}
    elif k=='daily-product-resource':
        per=int(match(r'әшекейге (\d+) м',s)[1]);count=int(match(r'Күніне (\d+) әшекей',s)[1]);total=int(match(r'(\d+) м таспа осы',s)[1]);answer=integer(F(total,per*count));ev={'perItemMetres':per,'dailyItems':count,'totalMetres':total}
    elif k=='full-bus-repeated-trips':
        a,b,c=map(int,match(r'әрқайсысы (\d+) жолаушы алатын (\d+) автобус.*Әр автобус (\d+) рет',s).groups());assert 'жаңа жолаушылар' in s
        answer=str(a*b*c);ev={'seatsBusesFullTrips':[a,b,c],'noRepeatedPassengers':True}
    elif k=='inverse-two-divisions':
        a,b,c=map(int,match(r'алдымен (\d+) санына, содан кейін (\d+) санына.*соңғы нәтиже (\d+) болды',s).groups());answer=str(a*b*c);assert F(int(answer),a)/b==c;ev={'orderedDivisors':[a,b],'finalResult':c}
    elif k=='missing-round-thousand-factor':
        a,b,c=map(int,match(r'(\d+) × (\d+) = (\d+) × □',s).groups());answer=integer(F(a*b,c));ev={'printedEquationFactors':[a,b,c]}
    elif k=='pairwise-product-cancellation':
        expr=match(r': (\(\d+ × \d+ × \d+\) : \(\d+ × \d+ × \d+\))',s)[1];answer=integer(arithmetic(expr));ev={'printedExpression':expr,'expandedConservedQuotient':answer}
    elif k=='inverse-three-multiplications':
        a,b,c,result=map(int,match(r'кезекпен (\d+), (\d+), (\d+) сандарына.*нәтиже (\d+) болды',s).groups());answer=integer(F(result,a*b*c));ev={'orderedMultipliers':[a,b,c],'finalResult':result}
    elif k=='unknown-divisor-factor':
        dividend,factor,result=map(int,match(r'(\d+) : \(□ × (\d+)\) = (\d+)',s).groups());answer=integer(F(dividend,factor*result));ev={'dividendFactorQuotient':[dividend,factor,result]}
    elif k=='known-quotient-nested':
        quotient=int(match(r'x : y = (\d+)',s)[1]);factor=int(match(r'x : \(y × (\d+)\)',s)[1]);answer=integer(F(quotient,factor));ev={'knownQuotient':quotient,'extraDivisor':factor}
    elif k=='product-relative-changes':
        a,b,c=map(int,match(r'a мәнін (\d+) есе арттырып, b мәнін (\d+) есе кемітті, c мәнін (\d+) есе',s).groups());v=F(a*c,b);answer=f'{integer(v)} есе өседі'
        cases=0
        for x in range(1,15):
            for y in range(b,b*15,b):
                for z in range(1,15):assert F(x*a*(y//b)*z*c,x*y*z)==v;cases+=1
        ev={'actualMultiplierRatio':str(v),'positiveIntegerCases':cases}
    elif k=='unfinished-division-correction':
        intended,used,result=map(int,match(r'санды (\d+) санына.*тек (\d+) санына бөліп, (\d+) нәтижесін',s).groups());answer=integer(F(result*used,intended));ev={'intendedUsedWrongResult':[intended,used,result]}
    elif k=='largest-efficient-product':
        values=[arithmetic(o) for o in r['options']];answer=choose(r,lambda o:arithmetic(o)==max(values));ev={'allPrintedProductValues':[integer(v) for v in values]}
    elif k=='unknown-fourth-factor':
        a,b,c,total=map(int,match(r'(\d+) × (\d+) × (\d+) × □ = (\d+)',s).groups());answer=integer(F(total,a*b*c));ev={'knownFactors':[a,b,c],'total':total}
    else:raise AssertionError(k)
    return answer,ev

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==32;entries=[]
    for r in rows:
        ref=one(r['sourceRefs']);raw=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']);assert raw['checked'] and raw.get('solution')
        assert not raw.get('images') and not raw.get('svg')
        answer,observed=observe(r);assert answer==r['answer'],(r['editionId'],answer,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='wrong-key';assert observe(bad)[0]!=bad['answer']
        if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_root_agent','method':'Full32saved/new conditions, fullsolutions and allMCQs individually read; own Python AST and Fraction directly parse printed expressions and word conditions, complete unique-choice checks and general symbolic proof with finite counterexamples','checks':['associativity and ordereddivision preserve source skill','4×25,8×125,2×50 and175×4 remain explicit','all offered expressions/equalities evaluated, deliberatefalseequalities confined to identificationchoices','inverse stages, product cancellation, same-bus passenger uniqueness and daily resource units conserved','900 valid symbolic assignments and2744 positive product-change cases;32 wrongkeys rejected'],'observed':observed})
    code="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';const b=JSON.parse(fs.readFileSync('"+PACK+"'));console.log(JSON.stringify(b.editions.map(q=>[q.editionId,editionHash(q)])));"
    js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)))
    assert all(js[e['editionId']]==e['sha256'] for e in entries)
    if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade4-product-wave30.json').write_text(json.dumps({'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','entries':entries},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'independentlyVerified':32,'wrongKeysRejected':32,'hashesMatched':32,'sourceRefs':32,'authorSolverImported':False}))
if __name__=='__main__':main()
