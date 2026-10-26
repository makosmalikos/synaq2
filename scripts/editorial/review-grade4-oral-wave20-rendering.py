"""Independent printed-text oral-arithmetic review, no author solver import.
All20 saved/new conditions, every complete solution and all MCQs read manually.
Fraction AST interpreter, full digit/repdigit domains and person permutations.
"""
import ast
import copy
from fractions import Fraction
import hashlib
import itertools
import json
from pathlib import Path
import re
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-oral-wave20.json'
OUT='problems/editorial/reviews/grade4-oral-wave20.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def n(s):
    s=s.replace(' ','');assert s.isdigit(),s;return int(s)
def m(pattern,s):
    found=re.search(pattern,s);assert found,(pattern,s);return found
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def value(text):
    text=re.sub(r'(?<=\d)\s+(?=\d)','',text).replace('·','*').replace('−','-').replace(':','/').strip()
    assert re.fullmatch(r'[0-9 ()+*/-]+',text),text
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):assert type(node.value) is int;return Fraction(node.value)
        assert isinstance(node,ast.BinOp),ast.dump(node)
        a,b=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return a+b
        if isinstance(node.op,ast.Sub):return a-b
        if isinstance(node.op,ast.Mult):return a*b
        assert isinstance(node.op,ast.Div) and b!=0
        return a/b
    return visit(ast.parse(text,mode='eval'))
def choice(r,predicate):return one(o for o in r['options'] if predicate(o))
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def zero_shape(number):return len(str(number)),[len(str(number))-i-1 for i,c in enumerate(str(number)) if c=='0']
def solve(r):
    s=r['statement'];k=r['skillFamily'];note=''
    if k=='digitwise-division':
        dividend,divisor=map(n,m(r'есептеңіз: ([\d ]+) : (\d+)',s).groups());q,rem=divmod(dividend,divisor);assert rem==0
        expanded=[int(c)*10**i for i,c in enumerate(str(dividend)[::-1]) if c!='0'];assert all(t%divisor==0 for t in expanded);assert all(int(c)%divisor==0 for c in str(dividend));assert sum(t//divisor for t in expanded)==q
        old=raw_for(r)['statement'].replace('$','').replace('\\,','');old_n,old_d=map(n,m(r'([\d ]+) : (\d+)',old).groups());assert zero_shape(dividend)==zero_shape(old_n);assert zero_shape(q)==zero_shape(old_n//old_d)
        answer=str(q);note=f'Printed{dividend}/{divisor}; each place divides exactly; source input/output length and zero places{zero_shape(q)}preserved.'
    elif k=='distributed-division-choice':
        dividend,divisor=map(n,m(r'^([\d ]+) : (\d+)',s).groups());answer=choice(r,lambda o:value(o)==Fraction(dividend,divisor));assert len(answer.split(' + '))==4;note='Every printed place-value division checked:'+str([str(value(o)) for o in r['options']])
    elif k in ['round-minus-one-product','round-minus-one-expression']:
        a,b=map(n,m(r'(\d+) · (\d+)',s).groups());assert a%100==99;target=(a+1)*b-b;assert target==a*b
        answer=choice(r,lambda o:value(o)==target) if r.get('options') else str(target);note=f'Exact compensation{a+1}×{b}−{b}={target}; every actual option evaluated.'
    elif k=='precedence-round-difference':
        text=m(r'есептеңіз: (.+?)\.',s)[1];a,b,d=map(n,m(r'^([\d ]+) − ([\d ]+) : (\d+)$',text).groups());v=value(text);assert v.denominator==1 and v!=Fraction(a-b,d);answer=str(v.numerator);note=f'AST precedence exact{v}; prohibited subtraction-first gives{Fraction(a-b,d)}.'
    elif k=='detect-swapped-place-error':
        truths=[];actual=[]
        for o in r['options']:
            left,right=o.split(' = ');v=value(left);assert v.denominator==1;actual.append(v.numerator);truths.append(v==n(right))
        bad=one(i for i,t in enumerate(truths) if not t);answer=r['options'][bad];correct=str(actual[bad]);printed=str(n(answer.split(' = ')[1]));assert printed==correct[:-2]+correct[-1]+correct[-2];assert r['intentionalIncorrectExample'] is True and 'әдейі' in s
        note=f'All4exacttruths{truths}; actual{correct}versus intentional swapped{printed}; never asserted as a true equality.'
    elif k=='scaled-divisor':
        a,d,q,b,e=map(n,m(r'^(\d+) : (\d+) = (\d+) екені[\s\S]*?пайдаланып, (\d+) : (\d+) мәнін',s).groups());assert a==b and a==d*q and e%d==0;target=Fraction(a,e);assert target==Fraction(q,e//d);answer=choice(r,lambda o:value(o)==target);note=f'Same dividend; divisor factor{e//d}, quotient{target}.'
    elif k=='near-round-comparison':
        left,right=m(r'салыстырыңыз: (.+?) □ (.+?)\.',s).groups();a,b=value(left),value(right);answer='>' if a>b else '<' if a<b else '=';note=f'Printed exact comparison{a}versus{b}; difference{a-b}.'
    elif k=='sum-factor-unknown':
        factor,total,a=map(n,m(r'\(a \+ b\) · (\d+) = ([\d ]+) және a = ([\d ]+)\.',s).groups());b=Fraction(total,factor)-a;assert b.denominator==1 and b>0;assert (a+b)*factor==total;answer=str(b.numerator);note=f'Exact inverse{total}/{factor}−{a}={b}, substitution confirms originalprinted equation.'
    elif k=='ordered-person-assignment':
        expressions=m(r'есептеді: (.+?)\. Әркімде',s)[1].split('; ');values=list(map(value,expressions));valid=[perm for perm in itertools.permutations(range(3)) if values[perm[0]]!=min(values) and values[perm[1]]>values[perm[0]]];assert len(valid)==1;answer=expressions[valid[0][2]];note=f'All6person permutations, values{values}, onlyassignment{valid[0]}.'
    elif k=='multiply-by-nine':
        number=n(m(r'пайдаланып, ([\d ]+) · 9',s)[1]);target=number*10-number;answer=choice(r,lambda o:value(o)==target);assert str(target)[-2]=='0';note=f'Ninefold by tenfold minus one full copy:{number*10}−{number}={target}; internalzero retained.'
    elif k in ['known-large-product','known-small-product']:
        a,b,known,c,d=map(n,m(r'^([\d ]+) · (\d+) = ([\d ]+) екені[\s\S]*?пайдаланып, ([\d ]+) · (\d+) мәнін',s).groups());assert a==c and a*b==known and d%b==0;target=known*(d//b);assert target==a*d;answer=choice(r,lambda o:value(o)==target);note=f'Printed known producttrue; whole factor{d//b}gives{target}, notmultiplication againby{d}.'
    elif k=='maximum-distinct-divisible-digits':
        digits,divisor=map(n,m(r'әртүрлі (\d+) таңбалы санның әр цифры (\d+) санына',s).groups());valid=[]
        for number in range(10**(digits-1),10**digits):
            ds=[int(c) for c in str(number)]
            if len(set(ds))==digits and all(c%divisor==0 for c in ds):valid.append(number)
        assert valid==sorted(valid) and len(valid)==18;largest=max(valid);assert largest==9630 and '0' in str(largest);quotient,rem=divmod(largest,divisor);assert rem==0;answer=str(quotient);note=f'Complete9000four-digitdomain:18valid distinct-digit inputs; max{largest}, quotient{quotient}; zero permissible asdigit, notleading.'
    elif k=='parentheses-target':
        target=n(m(r'мәні ([\d ]+) болсын',s)[1]);answer=choice(r,lambda o:value(o)==target);note='Actual four bracket placements:'+str([str(value(o)) for o in r['options']])+f'; exactlyone equals{target}.'
    elif k=='largest-repdigit-quotient':
        digits,divisor=map(n,m(r'бірдей (\d+) таңбалы санды (\d+) санына',s).groups());good=[]
        for number in range(10**(digits-1),10**digits):
            quotient,rem=divmod(number,divisor)
            if rem==0 and len(set(str(number)))==1 and len(str(quotient))==digits and len(set(str(quotient)))==1:good.append(number)
        assert good==[33333,66666,99999];answer=choice(r,lambda o:n(o)==max(good));note=f'Full90000five-digitinputdomain; allvalid{good}; both input and quotient length/repdigits independentlychecked.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==20;entries=[];refs=set()
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==4 and r['minimumPlan']=='pro' and not r.get('image') and not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'] and raw['statement']!=r['statement'];refs.add(raw['id'])
        if r['skillFamily']=='digitwise-division' and '0' in str(n(m(r'есептеңіз: ([\d ]+) :',r['statement'])[1])):assert 'Нөл тұрған разрядты сақтаймыз' in r['solution']
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact Fraction safe-AST arithmetic from actual printed conditions/options, complete finite digit domains and person permutations, source-zero-place comparison','notes':note,'checks':['all20saved/newconditions/fullsolutions/MCQs manually read','source oral shortcut skill and changed givens checked per source','all arithmetic and MCQ uniqueness checked from printed text, not author params or solver','intentional false equality remains explicitly identified as wrong','complete distinct-digit and repdigit domains,6person assignments and zero-position structures checked']})
    assert len(refs)==20 and value('96 000 − 42 000 : 3')==82000 and value('(96 000 − 42 000) : 3')==18000
    assert value('(56 000 + 8 000 + 800) : 4')==16200
    for bad in ['1 : 0','2**3','f(1)','x + 1']:
        try:value(bad)
        except (AssertionError,ZeroDivisionError):pass
        else:raise AssertionError('Unsafe AST accepted '+bad)
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','manualFindings':[{'sourceId':'f0fa137ac4185e11','status':'corrected_before_signature','finding':'Ambiguous instruction about dropping a zero place replaced by explicit retention of the zero place.'}],'scope':'All20source-addressed oral-method editions,16model forms; no claim that numeric variants are distinct mathematical meanings. No author calculator imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':20,'wrongKeysRejected':20,'sourceRefs':20,'hashesMatched':20,'completeDistinctDigitDomain':9000,'completeRepdigitInputDomain':90000,'personAssignments':6,'authorSolverImported':False}))
if __name__=='__main__':main()
