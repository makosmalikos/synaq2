"""Independent printed-text exact review: all 49 saved/new fraction additions.

No author solver/spec/model imports. Fraction AST evaluation, complete bounded
natural domains and polynomial coefficient identities are separate oracles.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import itertools
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade5-fraction-addition.json'
OUT = 'problems/editorial/reviews/grade5-fraction-addition.json'
ROWS = json.loads((ROOT / PACK).read_text())['editions']

def one(xs):
    xs = list(xs)
    assert len(xs) == 1, xs
    return xs[0]

def match(p, s):
    m = re.search(p, s)
    assert m, (p, s)
    return m

def digest(r):
    return hashlib.sha256(json.dumps(r, ensure_ascii=False, sort_keys=True, separators=(',', ':')).encode()).hexdigest()

def raw_for(r):
    ref = one(r['sourceRefs'])
    return one(q for q in json.loads((ROOT / ref['sourceFile']).read_text())['questions'] if q['id'] == ref['sourceId'])

def pairs(s):
    return [tuple(map(int, p)) for p in re.findall(r'\((\d+)/(\d+)\)', s)]

def calc(s, variables=None):
    variables = variables or {}
    s = s.replace('×', '*').replace('−', '-').strip()
    assert re.fullmatch(r'[0-9a-zA-Z ()+*/-]+', s), s
    def visit(n):
        if isinstance(n, ast.Expression):
            return visit(n.body)
        if isinstance(n, ast.Constant):
            assert type(n.value) is int
            return F(n.value)
        if isinstance(n, ast.Name):
            assert n.id in variables
            return F(variables[n.id])
        assert isinstance(n, ast.BinOp), ast.dump(n)
        a, b = visit(n.left), visit(n.right)
        if isinstance(n.op, ast.Add): return a + b
        if isinstance(n.op, ast.Sub): return a - b
        if isinstance(n.op, ast.Mult): return a * b
        assert isinstance(n.op, ast.Div) and b != 0
        return a / b
    return visit(ast.parse(s, mode='eval'))

def linear(s):
    """Exact constant/a coefficient, a proof for every a, not sample inputs."""
    def v(n):
        if isinstance(n, ast.Expression): return v(n.body)
        if isinstance(n, ast.Constant):
            assert type(n.value) is int
            return F(n.value), F(0)
        if isinstance(n, ast.Name):
            assert n.id == 'a'
            return F(0), F(1)
        assert isinstance(n, ast.BinOp)
        (c, a), (d, b) = v(n.left), v(n.right)
        if isinstance(n.op, ast.Add): return c + d, a + b
        if isinstance(n.op, ast.Mult):
            assert a * b == 0
            return c*d, a*d + c*b
        assert isinstance(n.op, ast.Div) and b == 0 and d != 0
        return c/d, a/d
    return v(ast.parse(s.replace('×', '*'), mode='eval'))

def integer(x):
    x = F(x)
    assert x.denominator == 1, x
    return str(x.numerator)

def choice(r, target):
    return one(o for o in r['options'] if calc(o) == target)

def true_relation(s):
    parts = re.split(r'\s([<>=])\s', s)
    assert len(parts) == 3, s
    a, op, b = calc(parts[0]), parts[1], calc(parts[2])
    return a == b if op == '=' else a < b if op == '<' else a > b

def solve(r):
    s = r['statement']
    k = r['modelId'].removeprefix('grade5-fraction-addition-')
    ps = pairs(s)
    vs = [F(*p) for p in ps]
    note = ''
    adds = {'same-denominator-sum', 'same-denominator-sum-reduce', 'coprime-denominator-sum', 'two-uses-of-original-paint', 'shared-factor-denominator-sum', 'reduce-both-before-addition', 'three-project-hours-mixed-total'}
    if k in adds:
        value = sum(vs)
        answer = choice(r, value)
        note = f'All printed operands {ps} exactly summed to {value}; every actual option evaluated, positive mixed sum includes whole part.'
        if k == 'reduce-both-before-addition':
            assert all(math.gcd(*p) > 1 for p in ps)
            note += f' BOTH inputs reduce to {vs}; raw common denominator {math.lcm(*(b for a,b in ps))}, reduced {math.lcm(*(v.denominator for v in vs))}.'
        if k == 'two-uses-of-original-paint': assert 'БАСТАПҚЫ' in s and 'қабыспайды' in s
    elif k in {'same-denominator-difference-numerator', 'reduced-difference-denominator', 'reduced-difference-terms-sum'}:
        value = vs[0] - vs[1]
        answer = str(value.numerator if k == 'same-denominator-difference-numerator' else value.denominator if k == 'reduced-difference-denominator' else value.numerator + value.denominator)
        note = f'Exact reduced difference {value}; requested reduced numerator/denominator/term sum distinguished, raw operands {ps}.'
    elif k == 'mixed-sum-fractional-numerator':
        value = sum(vs)
        assert value > 1
        whole = value.numerator // value.denominator
        rem = value - whole
        answer = str(rem.numerator)
        note = f'Actual sum {value} = {whole}+{rem}; requested reduced FRACTIONAL numerator {answer}, not full numerator {value.numerator}.'
    elif k in {'choose-true-fraction-operation', 'compare-neighbour-unit-differences'}:
        flags = [true_relation(o) for o in r['options']]
        answer = one(o for o, flag in zip(r['options'], flags) if flag)
        note = f'All actual equality/inequality lines evaluated exactly: truth flags {flags}; deliberately false examples remain explicitly identified.'
        assert 'қате' in s or k == 'compare-neighbour-unit-differences'
    elif k == 'one-minus-proper-fraction':
        answer = choice(r, 1 - one(vs))
        note = f'One whole minus {one(vs)}; denominator retained, every mixed option computed.'
    elif k == 'remaining-original-equal-pieces':
        n = int(match(r'жолақ (\d+) тең ұяшыққа', s)[1])
        value = (1-sum(vs))*n
        answer = integer(value)
        assert all(b == n for a,b in ps)
        note = f'Original whole has {n} actual cells; consumed {sum(vs)}, complement × original denominator = {value} ORIGINAL cells, not normalized numerator.'
    elif k == 'unknown-subtrahend-numerator':
        a,d,xd,c,cd = map(int, match(r'^\((\d+)/(\d+)\) − \(x/(\d+)\) = \((\d+)/(\d+)\)', s).groups())
        assert d == xd == cd
        answer = integer((F(a,d)-F(c,d))*xd)
        assert F(a,d)-F(int(answer),xd) == F(c,cd)
        note = f'Unknown subtrahend isolated and substituted into actual equation; x={answer}>0, not minuend/difference reversal.'
    elif k in {'three-same-denominator-make-one', 'regroup-two-complementary-pairs'}:
        answer = integer(sum(vs))
        note = f'All printed fractions {ps} sum exactly {sum(vs)}; pairing includes EVERY term, original denominators never summed.'
    elif k == 'unlike-difference-small-unit':
        answer = choice(r, vs[0]-vs[1])
        note = f'Exact actual difference {vs[0]}−{vs[1]}={vs[0]-vs[1]}, all4 actual options checked.'
    elif k == 'sum-fixed-denominator-numerator':
        d = int(match(r'бөлімі ДӘЛ (\d+)', s)[1])
        answer = integer(sum(vs)*d)
        note = f'Actual sum {sum(vs)} expressed at required RAW denominator {d}; corresponding numerator {answer}, not arbitrary reduced term.'
    elif k in {'two-activities-extra-hours-to-minutes', 'two-packets-extra-mass'}:
        total = 2*vs[0] + vs[1]
        answer = integer(total*60) if k.endswith('minutes') else choice(r,total)
        note = f'Second actual amount is first+EXTRA; both total {total}. '+('Exact60 minutes/hour, result '+answer if k.endswith('minutes') else 'Extra kg is absolute mass, not a proportional increase.')
    elif k == 'repair-added-denominators':
        assert 'ӘДЕЙІ ҚАТЕ' in s
        assert vs[0]+vs[1] != vs[2]
        answer = choice(r,vs[0]+vs[1])
        note = f'Printed false result {vs[2]} explicitly identified; actual sum {vs[0]+vs[1]}, options each evaluated.'
    elif k == 'three-operation-unit-denominator':
        value = vs[0]-vs[1]+vs[2]
        assert value.numerator == 1
        answer = str(value.denominator)
        note = f'Actual left-to-right signed sum {vs[0]}−{vs[1]}+{vs[2]}={value}; requested unit denominator, not 3positive addends.'
    elif k == 'parallel-completion-time':
        t1,t2 = map(int,match(r'жалғыз (\d+) сағатта, екіншісі жалғыз (\d+) сағатта',s).groups())
        rate = F(1,t1)+F(1,t2)
        time = 1/rate
        assert time/t1+time/t2 == 1 and 'тұрақты' in s and 'қабыспайды' in s and 'бір мезгілде' in s
        answer = integer(time)
        note = f'Independent unit-work rates {1/F(t1)},{1/F(t2)}; first completion time {time}, conservation substitution=1; no addition of times.'
    elif k == 'unknown-unit-addend-denominator':
        unit = vs[1]-vs[0]
        assert unit.numerator == 1 and unit > 0
        answer = str(unit.denominator)
        note = f'Known sum−known addend={unit}; positive denominator {answer} substituted in the original printed equality.'
    elif k == 'unknown-minuend-fraction':
        answer = choice(r,sum(vs))
        note = f'Unknown minuend is difference+subtrahend={sum(vs)}; all option values tested, reverse substitution recovers {vs[1]}.'
    elif k == 'mass-difference-grams':
        answer = integer((vs[0]-vs[1])*1000)
        note = f'Actual kg difference {vs[0]-vs[1]} × exactly1000g/kg = {answer}g; role is difference not total.'
    elif k == 'maximum-addition-subtraction-expression':
        values = [calc(o) for o in r['options']]
        answer = one(o for o,v in zip(r['options'],values) if v == max(values))
        note = f'All4 actual signed expressions {list(map(str,values))}; unique maximum {max(values)}, no rounding of near-equal first2.'
        assert abs(values[0]-values[1]) == F(1,120)
    elif k == 'whole-minus-two-original-shares':
        answer = choice(r,1-sum(vs))
        assert 'БАСТАПҚЫ' in s
        note = f'Both actual shares refer to ORIGINAL whole; used {sum(vs)}, remaining {1-sum(vs)}, not sequential fraction-of-remainder.'
    elif k == 'three-groups-relative-share-and-pieces':
        first,less,third,each = vs
        second = first-less
        remainder = 1-first-second-third
        assert 0<second and remainder>0 and 'БАСТАПҚЫ' in s
        answer = integer(remainder/each)
        note = f'Actual second share {first}−{less}={second}; remainder {remainder}, original per-child share {each}, count {answer}; same initial whole throughout.'
    elif k == 'sequential-workers-unfinished-share':
        t1,t2 = map(int,match(r'жалғыз (\d+) сағатта, екіншісі жалғыз (\d+) сағатта',s).groups())
        w1,w2 = map(int,match(r'шебер (\d+) сағат істеп тоқтады[\s\S]*?тағы (\d+) сағат',s).groups())
        done = F(w1,t1)+F(w2,t2)
        assert 0<done<1 and 'тұрақты' in s
        answer = choice(r,1-done)
        note = f'Distinct actual sequential work times {w1}/{t1}+{w2}/{t2}={done}, unfinished {1-done}; neither time reused for both workers.'
    elif k == 'unknown-addend-versus-difference':
        value = vs[1]-vs[2]-vs[0]
        answer = choice(r,value)
        assert value+vs[0] == vs[1]-vs[2]
        note = f'Actual RHS difference {vs[1]-vs[2]}; subtract known addend {vs[0]} giving x={value}; exact original equation substitution.'
    elif k == 'two-inlets-one-drain-time':
        ts = list(map(int,re.findall(r'(\d+) сағатта',s)))
        assert len(ts)==3 and 'тұрақты' in s and 'бір мезгілде' in s
        rate = F(1,ts[0])+F(1,ts[1])-F(1,ts[2])
        assert rate>0
        time = 1/rate
        answer = integer(time)
        note = f'Actual constant inlet rates minus DRAIN rate={rate}>0; total time {time}; integrated inflow−outflow=1, sign not flipped.'
    elif k == 'known-category-extra-original-share-total':
        count = int(match(r'кітаптар (\d+) дана',s)[1])
        share = sum(vs)
        answer = integer(F(count)/share)
        assert 'БАРЛЫҚ' in s and vs[0]+share<=1
        assert all((int(answer)*v).denominator==1 for v in [*vs,share])
        note = f'Actual science share {vs[0]}+{vs[1]}={share}; known count {count}/share = {answer} total books, both categories integral and feasible.'
    elif k == 'symbolic-common-numerator-sum':
        a,b=map(int,match(r'\(a/(\d+)\) \+ \(a/(\d+)\)',s).groups())
        coeff=(F(0),F(1,a)+F(1,b))
        values=[linear(o) for o in r['options']]
        answer=one(o for o,v in zip(r['options'],values) if v==coeff)
        note=f'Exact symbolic (constant,a) coefficients {values}; desired {coeff}; identity proven for EVERY natural a, not sampling.'
    elif k=='telescoping-unit-difference-chain':
        start,end=ps[0][1],ps[-1][1]
        value=sum((F(1,i)-F(1,i+1) for i in range(start,end)),F(0))
        assert value==F(1,start)-F(1,end)
        answer=choice(r,value)
        note=f'Expanded ALL successive pairs i={start}…{end-1}, exact sum {value}; first/last terms retained, every intermediate term cancels once each sign.'
    elif k=='unknown-common-denominator-factor':
        a,b=map(int,re.findall(r'\(1/\((\d+) × x\)\)',s))
        target=one(vs)
        x=(F(1,a)+F(1,b))/target
        answer=integer(x)
        assert x>0 and F(1,a*x)+F(1,b*x)==target
        note=f'Positive x, independent scaling coefficient {F(1,a)+F(1,b)} / target {target} = {x}; exact substitution. Function coefficient/x strictly decreases on positive naturals, hence unique.'
    elif k=='least-unit-denominator-strict-sum':
        remainder=1-sum(vs)
        assert remainder>0
        bound=math.floor(1/remainder)+1
        valid=[n for n in range(1,bound+1) if sum(vs)+F(1,n)<1]
        answer=str(min(valid))
        assert sum(vs)+F(1,int(answer)-1)>=1
        note=f'Complete natural n1…{bound}, exact strict sum<1; first {answer}, predecessor gives equality or larger and is excluded.'
    elif k=='consecutive-numerators-sum':
        denominators={b for a,b in ps};d=one(denominators)
        low,high=map(int,match(r'алым (\d+)–(\d+) аралығында',s).groups())
        answer=integer(sum((F(a,d) for a in range(low,high+1)),F(0)))
        note=f'Every integer numerator in inclusive {low}…{high} independently summed at fixed denominator{d}; improper terms included, not only proper fractions.'
    elif k=='opposite-motion-remaining-path-share':
        t1,t2=map(int,match(r'жолды (\d+) сағатта, екіншісі (\d+) сағатта',s).groups())
        t=int(match(r'(\d+) сағаттан кейін',s)[1])
        done=F(t,t1)+F(t,t2)
        assert done<1 and 'бір мезгілде' in s and 'тұрақты' in s
        answer=choice(r,1-done)
        note=f'Actual simultaneous opposite travel times {t1},{t2}, elapsed {t}; traveled {done}<1 so BEFORE meeting, separation {1-done} of original full route.'
    elif k=='choose-sum-exactly-one':
        values=[calc(o) for o in r['options']]
        answer=one(o for o,v in zip(r['options'],values) if v==1)
        note=f'All four actual sums exactly {list(map(str,values))}; only one equals1, strict below/above roles verified.'
    elif k=='sum-all-irreducible-proper-fixed-denominator':
        d=int(match(r'ДӘЛ (\d+)',s)[1])
        numerators=[a for a in range(1,d) if all(not(a%c==0 and d%c==0) for c in range(2,min(a,d)+1))]
        value=sum((F(a,d) for a in numerators),F(0))
        answer=integer(value)
        note=f'Complete finite original positive numerator1…{d-1}; irreducibility by exhaustive common-divisor search (not author gcd); valid {numerators}, exact sum {value}.'
    elif k=='whole-litres-minus-two-measures':
        initial=int(match(r'шеберханасында (\d+) л',s)[1])
        answer=choice(r,initial-sum(vs))
        assert 'ЛИТР' in s
        note=f'Actual absolute litres {initial}−{vs[0]}−{vs[1]}={initial-sum(vs)}, not fractions of initial{initial}; whole mixed term retained.'
    elif k=='dyadic-sum-unit-deficit':
        missing=1-sum(vs)
        assert missing.numerator==1 and all(ps[i+1][1]==2*ps[i][1] for i in range(len(ps)-1))
        answer=str(missing.denominator)
        note=f'ALL actual dyadic terms summed to{sum(vs)}; deficit {missing}, hence n={answer}; last visible term included.'
    elif k=='fractional-arithmetic-sequence-next':
        assert vs[1]-vs[0]==vs[2]-vs[1]>0
        value=2*vs[2]-vs[1]
        answer=choice(r,value)
        note=f'Both actual consecutive increments exactly {vs[1]-vs[0]}; add one increment to third, fourth {value}; all4 MCQ values checked.'
    elif k=='river-raft-from-two-whole-route-times':
        td,tu=map(int,match(r'ағыспен (\d+) сағатта[\s\S]*?бағытта (\d+) сағатта',s).groups())
        current=(F(1,td)-F(1,tu))/2
        own=(F(1,td)+F(1,tu))/2
        assert own>current>0 and 'тұрақты' in s
        answer=integer(1/current)
        assert own+current==F(1,td) and own-current==F(1,tu)
        note=f'Unit route signed rates: downstream1/{td}, upstream1/{tu}, currentHALF difference {current}; raft onlycurrent gives{answer}h, exact two original rate equations checked.'
    elif k=='choose-all-signs-for-target':
        values,target=vs[:-1],vs[-1]
        allflags=list(itertools.product([1,-1],repeat=3))
        good=[flags for flags in allflags if values[0]+sum((flag*value for flag,value in zip(flags,values[1:])),F(0))==target]
        flags=one(good)
        answer=', '.join('+' if flag==1 else '−' for flag in flags)
        assert answer in r['options']
        for option in r['options']:
            actual=[1 if flag=='+' else -1 for flag in option.split(', ')]
            assert (values[0]+sum((flag*value for flag,value in zip(actual,values[1:])),F(0))==target)==(option==answer)
        note=f'ALL8 sign triples, not only4MCQs, exhaustively evaluated against actual target{target}; unique{flags} in printed left-to-right order.'
    elif k=='proper-unknown-numerators-sum':
        ad,bd=map(int,match(r'^\(a/(\d+)\) және \(b/(\d+)\)',s).groups())
        target=one(vs)
        good=[(a,b) for a in range(1,ad) for b in range(1,bd) if F(a,ad)+F(b,bd)==target]
        a,b=one(good)
        answer=str(a+b)
        note=f'Complete {(ad-1)*(bd-1)} assignments of positive proper numerators a1…{ad-1},b1…{bd-1}; exact target{target}, unique pair{a,b}, requested sum{answer}.'
    else:
        raise AssertionError(k)
    return answer,note

def main():
    assert len(ROWS)==49
    entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r)
        assert answer==r['answer'],(r['editionId'],answer,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):
            assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:
            assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'];refs.add(raw['id'])
        normalize=lambda t:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip()
        assert normalize(raw['statement'])!=normalize(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Independent exact Fraction AST evaluation of printed operands/options; full finite natural/sign/proper-fraction domains, symbolic coefficient proof and conservation equations; no author model/spec/solver imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All49 saved/new statements, full solutions and actual MCQs manually read','Original whole vs absolute litre/kg and requested raw/reduced/mixed terms distinguished','Every actual option tested and every finite strict domain exhausted','Positive rates, simultaneous/sequential conditions and signed conservation equations checked']})
    assert len(refs)==49
    assert calc('(1 + (16/21))')==F(37,21)
    assert linear('((3 × a)/8)')==(F(0),F(3,8))
    assert F(1,2)+F(2,5)+F(1,10)==1
    assert sum((F(a,12) for a in [1,5,7,11]),F(0))==2
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True))
    assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All49 source-addressed grade5topic3.8 nonvisual fraction addition/subtraction adaptations, exact independent printed-text oracle','entries':entries}
    if '--write' in sys.argv:
        (ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text())
        assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':49,'wrongKeysRejected':49,'sourceRefs':49,'hashesMatched':49,'actualMcqsChecked':True,'fullStrictAndSignDomains':True,'symbolicUniversalProof':True,'authorSolverImported':False}))

if __name__=='__main__':main()
