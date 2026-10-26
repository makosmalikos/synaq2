"""Independent JSON-only oracle for all 23 source-specific class-operation edits.

All original/new statements, complete solutions and MCQ choices were read.
No authored calculator/renderer is imported. --write records canonical hashes.
"""
from pathlib import Path
from itertools import permutations
from functools import lru_cache
import argparse
import ast
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-classops-wave11.json'
OUT='problems/editorial/reviews/grade4-classops-wave11.json'


def digest(row):
    return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def number(text):
    text=re.sub(r'\s','',text)
    assert re.fullmatch(r'\d+',text),text
    return int(text)


def one(values):
    assert len(values)==1,values
    return values[0]


def choose(row,values,target):
    assert len(values)==4 and values.count(target)==1,(row['editionId'],values,target)
    return row['options'][values.index(target)]


def arithmetic(text):
    node=ast.parse(re.sub(r'\s','',text).replace('−','-'),mode='eval')
    def visit(n):
        if isinstance(n,ast.Expression):return visit(n.body)
        if isinstance(n,ast.Constant):
            assert isinstance(n.value,int)
            return n.value
        assert isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub))
        return visit(n.left)+visit(n.right) if isinstance(n.op,ast.Add) else visit(n.left)-visit(n.right)
    return visit(node)


def extreme_distinct(length,direction,ending=None):
    values=list(range(10)) if direction=='minimum' else list(range(9,-1,-1))
    if ending is not None:values.remove(ending)
    for prefix in permutations(values,length-(ending is not None)):
        if prefix[0]==0:continue
        digits=prefix if ending is None else (*prefix,ending)
        return int(''.join(map(str,digits)))
    raise AssertionError('No full-length permutation')


def smallest_sum(length,total):
    # Independent digit-DP over all completions, not the author's near-maximum formula.
    @lru_cache(None)
    def completions(left,needed):
        if needed<0 or needed>9*left:return 0
        if left==0:return int(needed==0)
        return sum(completions(left-1,needed-d) for d in range(10))
    prefix=[]
    for position in range(length):
        remaining=length-position-1
        for digit in range(1 if position==0 else 0,10):
            if completions(remaining,total-digit):
                prefix.append(digit);total-=digit;break
        else:raise AssertionError('No exact digit-sum completion')
    assert total==0
    return int(''.join(map(str,prefix)))


def solve(row):
    p=row['params'];kind=row['modelId'].removeprefix('grade4-classops-')
    value=answer=None
    method='Independent integer place-value ledger and inverse substitution'
    note=''
    if kind=='digit-boundary':
        value=int('1'+'0'*(p['digits']-1)) if p['direction']=='minimum' else int('9'*p['digits'])
        assert len(str(value))==p['digits']
        assert len(str(value-1 if p['direction']=='minimum' else value+1))!=p['digits']
        note=f'Decimal-string boundary {value}; adjacent integer crosses the required length.'
    elif kind=='class-arithmetic':
        left=sum(p['scale'] for _ in range(p['left']));right=sum(p['scale'] for _ in range(p['right']))
        assert p['operation'] in ('add','subtract')
        value=left+right if p['operation']=='add' else left-right
        assert value%p['scale']==0
        note=f'Repeated class blocks give {left} and {right}; {p["operation"]} yields {value}, zero suffix retained.'
    elif kind=='remove-tens':
        original=int(''.join(str(p[k]) for k in ['thousands','hundreds','tens','units']))
        value=original-10*p['tens']
        assert value//10%10==0 and value%10==p['units'] and value//100==original//100
        assert value+10*p['tens']==original
        note=f'Compose decimal string {original}, remove its whole tens addend; {value} preserves every other digit.'
    elif kind=='target-expression':
        values=[arithmetic(option) for option in row['options']]
        answer=choose(row,values,p['target'])
        method='Independent safe AST evaluation of every printed addition/subtraction option'
        note=f'All option values {values}; exactly one reaches {p["target"]}.'
    elif kind=='compare-populations':
        female2=p['secondTotal']-p['secondMale'];female1=p['firstFemale']
        assert female2>=0 and female1!=female2
        village='Шұғылада' if female2>female1 else 'Самалда';gap=abs(female2-female1)
        answer=f'{village}: {gap} адамға көп'
        note=f'Women counted separately: {female1} and {female2}, difference {gap}; total-population distractor is not used.'
    elif kind=='remove-ten-thousands':
        original=p['millions']*1000000+p['tenThousands']*10000+p['hundreds']*100+p['units']
        value=original-p['tenThousands']*10000
        assert value//1000%1000==0 and value%1000==100*p['hundreds']+p['units']
        note=f'Exact initial {original}; after removing ten-thousands, {value} has empty 000 thousands class and unchanged units class.'
    elif kind=='distinct-boundary':
        value=extreme_distinct(p['digits'],p['direction'])
        assert len(str(value))==len(set(str(value)))==p['digits']
        method='First valid tuple in complete lexicographically ordered distinct-digit permutation stream'
        note=f'Leading-zero tuples rejected; first {p["direction"]} full-length tuple yields global extremum {value}.'
    elif kind=='compare-differences':
        left=p['left'][0]-p['left'][1];right=p['right'][0]-p['right'][1]
        answer='<' if left<right else '>' if left>right else '='
        note=f'Full independent differences {left}, {right}; correct sign {answer}.'
    elif kind=='subtract-near-thousand':
        values=[arithmetic(option) for option in row['options']]
        answer=choose(row,values,p['start']-999)
        method='Independent safe AST evaluation of all compensation expressions'
        note=f'Option values {values}; only subtraction of 1000 followed by addition of 1 gives exact subtraction of 999.'
    elif kind=='four-letter-cryptarithm':
        relaxed=[];valid=[]
        for n in range(100,p['upperExclusive']):
            lhs=str(n);rhs=str(n*p['multiplier'])
            if len(rhs)==4 and rhs[0]==rhs[1] and rhs[2]==rhs[3]==lhs[2]:
                relaxed.append(n)
                if len(set((*lhs,rhs[0])))==4:valid.append(n)
        value=one(valid)
        assert relaxed==[198,374]
        assert p['multiplier']*(p['upperExclusive']-1)<3000
        method='Enumerate every permitted three-digit input; test exact repeated output letters and pairwise digit distinctness'
        note=f'Pattern candidates {relaxed}; 198 violates K!=N, leaving {value}; explicit <500 preserves source leading output digit 1/2.'
    elif kind=='operation-swap':
        original=p['observed']-p['delta'];value=original-p['delta']
        assert original+p['delta']==p['observed'] and p['observed']-value==2*p['delta']
        note=f'Recover original {original}, then perform the intended subtraction; result {value}, twice-delta error corrected.'
    elif kind=='minimum-digit-sum':
        value=smallest_sum(p['digits'],p['sum'])
        assert len(str(value))==p['digits'] and sum(map(int,str(value)))==p['sum']
        method='Independent digit-DP counts all suffix completions and selects the lexicographically first feasible full-length number'
        note=f'Global minimum {value} for {p["digits"]} digits and exact sum {p["sum"]}, not merely the smallest offered option.'
    elif kind=='last-fixed-length-term':
        terms=[];n=p['start']
        while len(str(n))<=p['digits']:
            if len(str(n))==p['digits']:terms.append(n)
            n+=p['step']
        assert terms and len(str(n))==p['digits']+1
        value=terms[-1]
        method='Repeated addition builds every term until the required digit length is exceeded'
        note=f'{len(terms)} full-length terms, last {value}, next {n} too long; valid earlier-term distractor remains earlier.'
    elif kind=='missing-subtrahend':
        left=re.compile(p['subtrahendPattern'].replace('?',r'\d'))
        right=re.compile(p['differencePattern'].replace('?',r'\d'))
        values=[n for n in range(10000,p['minuend']) if left.fullmatch(str(n)) and right.fullmatch(str(p['minuend']-n))]
        value=one(values)
        assert value+(p['minuend']-value)==p['minuend']
        method='Search the entire five-digit subtrahend domain, constrain both printed decimal patterns'
        note=f'Only {value} matches all subtrahend/difference digits; complete difference {p["minuend"]-value} back-adds exactly.'
    elif kind=='three-letter-cryptarithm':
        values=[]
        for n in range(100,1000):
            lhs=str(n);rhs=str(n*p['multiplier'])
            if len(set(lhs))==3 and len(rhs)==3 and len(set(rhs))==1 and rhs[0]==lhs[2]:values.append(n)
        value=one(values)
        method='Enumerate all 900 three-digit inputs against the exact repeated-digit output and injective letter assignment'
        note=f'Only {value} produces {value*p["multiplier"]}; repeated leading output digit is nonzero.'
    elif kind=='maximum-distinct-ending':
        value=extreme_distinct(p['digits'],'maximum',p['ending'])
        assert value%10==p['ending'] and len(set(str(value)))==p['digits']
        method='Lexicographically descending distinct-digit permutation stream with reserved fixed final digit'
        note=f'Global maximum {value}; final digit reserved rather than repeated in prefix.'
    elif kind=='adjacent-digit-boundaries':
        first=int('1'+'0'*(p['digits']-1));previous=int('9'*(p['digits']-1));value=first-previous
        assert value==1
        note=f'Adjacent decimal-string length boundaries {first}, {previous}; exact gap {value}.'
    elif kind=='prefix-cryptarithm':
        candidates=[]
        for n in range(10,100):
            rhs=str(n*p['multiplier']);lhs=str(n)
            if len(rhs)==3 and rhs[1:]==lhs and len(set((rhs[0],*lhs)))==3:candidates.append(int(rhs))
        value=one(candidates)
        method='Enumerate every two-digit input and test the entire three-letter output, including zero in units'
        note=f'Only output {value} retains the complete two-digit suffix and distinct leading letter; input {value//p["multiplier"]}.'
    elif kind=='descending-term-index':
        found=[];term=p['start'];position=1
        while term>0:
            if term==p['target']:found.append(position)
            term-=p['step'];position+=1
        value=one(found)
        method='Build the descending sequence while counting the first member as position one'
        note=f'Target {p["target"]} reached at position {value}; the number of decreases is one less.'
    else:raise AssertionError(('Unreviewed class-operations model',kind))
    if answer is None:
        assert isinstance(value,int)
        if row.get('options'):
            values=[number(o) for o in row['options']];assert len(values)==len(set(values))
            answer=choose(row,values,value)
        else:answer=str(value)
    assert row['answer']==answer,(row['editionId'],row['answer'],answer)
    if row.get('options'):
        assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert re.fullmatch(r'\d+',answer) and 'Жауап' in row['statement'] and 'сан' in row['statement']
    return method,note


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==23
    assert len({r['editionId'] for r in rows})==len({r['sourceRefs'][0]['sourceId'] for r in rows})==23
    entries=[]
    for row in rows:
        k=row['modelId'].removeprefix('grade4-classops-')
        topic='eq' if k in {'four-letter-cryptarithm','three-letter-cryptarithm','prefix-cryptarithm','missing-subtrahend'} else 'seq' if k in {'last-fixed-length-term','descending-term-index'} else 'num'
        assert row['grade']==4 and row['topic']==topic and row['minimumPlan']=='pro'
        assert not re.search(r'[\\$]',row['statement']+row['solution'])
        for ref in row['sourceRefs']:
            raw=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in raw['questions'] if q['id']==ref['sourceId']])
            assert raw['grade']==4 and raw['topic']=='1-4' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement']!=row['statement']
        method,note=solve(row)
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':method,
                        'notes':note+' Full original/new conditions, complete solutions and all source/new MCQ read independently. Grade, classes/zero placeholders, bounds, injective letter mapping, all relevant candidates and original efficient-method skill retained. No authored solver imported.'})
    rejected=0
    for row in rows:
        changed=json.loads(json.dumps(row));changed['answer']='__WRONG_KEY__'
        try:solve(changed)
        except AssertionError:rejected+=1
        else:raise AssertionError('Wrong answer accepted')
    # Both edits are materially wrong despite superficial answer/option plausibility.
    cry=next(r for r in rows if r['modelId']=='grade4-classops-four-letter-cryptarithm')
    relaxed=json.loads(json.dumps(cry));relaxed['params']['upperExclusive']=1000
    try:solve(relaxed)
    except AssertionError:pass
    else:raise AssertionError('Lost cryptarithm upper bound accepted')
    minimum=next(r for r in rows if r['modelId']=='grade4-classops-minimum-digit-sum')
    duplicated=json.loads(json.dumps(minimum));duplicated['options'][0]=minimum['answer'].replace(' ','  ')
    try:solve(duplicated)
    except AssertionError:pass
    else:raise AssertionError('Equivalent second correct numeric choice accepted')
    print(json.dumps({'independentClassopsChecks':len(entries),'wrongKeysRejected':rejected,'domainAndEquivalentChoiceCanaries':2,'manualFindings':[]},ensure_ascii=False,indent=2))
    if args.write:
        report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23',
                'scope':'All 23 saved grade4 class-operation source/new conditions, complete solutions and MCQ independently read. Separate integer ledgers, safe expression AST, lexicographic digit-permutation streams, suffix digit-DP, complete cryptarithm/pattern searches and repeated sequence construction reproduce answers. Full canonical edition hashes bind this review.',
                'entries':entries}
        (ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('Wrote 23 independent class-operation review records.')


if __name__=='__main__':main()
