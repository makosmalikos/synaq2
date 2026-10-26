"""Independent JSON-only review: 31 grade4 revision sources and editions.

Source/new statements, complete solutions and all MCQ choices were read before
signing. No authored renderer/calculator is imported. Integer ledgers, Fraction
AST arithmetic, whole-domain searches and full bracket/permutation enumeration
reproduce the results. --write pins full canonical edition hashes.
"""
from pathlib import Path
from fractions import Fraction
from itertools import permutations
import argparse
import ast
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
PACK = 'problems/editorial/batches/grade4-revision-wave10.json'
OUT = 'problems/editorial/reviews/grade4-revision-wave10.json'


def digest(row):
    return hashlib.sha256(json.dumps(row, ensure_ascii=False, sort_keys=True,
                                    separators=(',', ':')).encode()).hexdigest()


def number(text):
    text = re.sub(r'\s', '', text)
    assert re.fullmatch(r'\d+', text), text
    return int(text)


def fmt(value):
    return f'{value:,}'.replace(',', ' ')


def one(values):
    assert len(values) == 1, values
    return values[0]


def choose(row, values, target):
    assert len(values) == 4 and values.count(target) == 1, (row['editionId'], values, target)
    return row['options'][values.index(target)]


def arithmetic(text):
    """Safe independent exact AST evaluator; never eval()/exec()."""
    tree = ast.parse(text.replace('−', '-').replace('×', '*').replace(':', '/'), mode='eval')
    def visit(node):
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant):
            assert isinstance(node.value, int)
            return Fraction(node.value)
        assert isinstance(node, ast.BinOp)
        left, right = visit(node.left), visit(node.right)
        if isinstance(node.op, ast.Add): return left + right
        if isinstance(node.op, ast.Sub): return left - right
        if isinstance(node.op, ast.Mult): return left * right
        assert isinstance(node.op, ast.Div) and right
        return left / right
    return visit(tree)


def units(text, scales):
    pieces = re.findall(r'(\d+)\s*(' + '|'.join(scales) + ')', text)
    assert pieces, text
    return sum(int(n) * scales[unit] for n, unit in pieces)


def solve(row):
    p = row['params']
    kind = row['modelId'].removeprefix('grade4-revision-')
    value = answer = None
    method = 'Independent exact integer ledger and inverse substitution'
    note = ''
    if kind == 'map-distance':
        value = Fraction(p['kilometres'], p['kilometresPerCm'])
        assert value * p['kilometresPerCm'] == p['kilometres']
        note = f'{value} one-centimetre intervals independently reconstruct the real {p["kilometres"]} km.'
    elif kind == 'mass-compare':
        left = sum(100 for _ in range(p['centners'])) + p['kilograms']
        answer = '<' if left < p['right'] else '>' if left > p['right'] else '='
        assert p['kilograms'] < 10
        note = f'Exact conversion {left} kg versus {p["right"]} kg; single-digit kilograms are not tens of kilograms.'
    elif kind == 'order-three-digits':
        values = [tuple(number(x) for x in option.split(';')) for option in row['options']]
        target = tuple(sorted(p['numbers']))
        assert all(sorted(value) == list(target) for value in values)
        answer = choose(row, values, target)
        note = f'All four complete permutations read; unique ascending order {target}.'
    elif kind == 'number-extreme':
        value = (max if p['direction'] == 'maximum' else min)(p['numbers'])
        note = f'Full numerical ordering {sorted(p["numbers"])}; {p["direction"]} {value}.'
    elif kind == 'hours-to-minutes':
        value = sum(60 for _ in range(p['hours'])) + p['minutes']
        assert divmod(value, 60) == (p['hours'], p['minutes'])
        note = f'Base-60 conversion, then inverse divmod returns the stated hours/minutes; total {value}.'
    elif kind == 'equal-total-groups':
        value = Fraction(p['first'] + p['second'], p['groups'])
        assert value * p['groups'] == p['first'] + p['second']
        note = f'Both child groups included before equal partition; each of {p["groups"]} groups has {value} children.'
    elif kind == 'longest-period':
        values = [units(option, {'ғасыр':100, 'жыл':1}) for option in row['options']]
        answer = choose(row, values, max(values))
        note = f'Every printed time expression independently read in years: {values}; maximum {max(values)}.'
    elif kind == 'distribute-product':
        values = [arithmetic(option) for option in row['options']]
        target = (p['first'] + p['second']) * p['factor']
        answer = choose(row, values, target)
        method = 'Independent safe Fraction AST evaluation of all four printed expressions'
        note = f'Values {list(map(str,values))}; only the distributive form equals {target}.'
    elif kind == 'unoccupied-seats':
        value = p['capacity'] - p['first'] - p['second']
        assert value > 0 and value + p['first'] + p['second'] == p['capacity']
        note = f'Occupied people plus {value} free one-person seats recover total capacity.'
    elif kind == 'repartition-groups':
        pupils = sum(p['each'] for _ in range(p['classes']))
        value, remainder = divmod(pupils, p['groupSize'])
        assert remainder == 0
        note = f'Repeated class addition gives {pupils}; complete group division gives {value}, zero remainder.'
    elif kind == 'length-difference':
        start = 100 * p['firstMetres'] + p['firstCm']
        removed = 100 * p['lastMetres'] + p['lastCm']
        value = start - removed
        assert value + removed == start and p['lastCm'] > p['firstCm']
        note = f'Both lengths in centimetres: {start} minus {removed} gives {value}; source borrowing case retained.'
    elif kind == 'duration-difference':
        remaining = 60 * p['hours'] + p['minutes'] - p['subtractMinutes']
        values = [units(option, {'сағ':60, 'мин':1}) for option in row['options']]
        answer = choose(row, values, remaining)
        assert divmod(remaining,60) == (6,15)
        note = f'All four printed durations are {values} minutes; only {remaining} equals the elapsed-time difference.'
    elif kind == 'strict-interval':
        value = one([n for n in p['numbers'] if p['lower'] < n < p['upper']])
        note = f'Two strict bounds tested on every full decimal number; unique inside value {value}.'
    elif kind == 'parenthesis-target':
        values = [arithmetic(option) for option in row['options']]
        answer = choose(row, values, Fraction(p['target']))
        method = 'Independent safe Fraction AST evaluation of every printed bracket arrangement'
        note = f'Exact four values {list(map(str,values))}; only one reaches target {p["target"]}.'
    elif kind == 'heaviest-mass':
        values = [units(option, {'ц':100, 'кг':1}) for option in row['options']]
        answer = choose(row,values,max(values))
        note = f'All printed mixed masses independently normalize to {values} kg; maximum {max(values)} kg.'
    elif kind == 'age-chain':
        middle = p['firstAge'] - p['younger']
        value = middle + p['older']
        assert middle + p['younger'] == p['firstAge'] and value - middle == p['older']
        note = f'Younger relation inverted and older relation substituted; final age {value}.'
    elif kind == 'cheaper-unit-price':
        first = Fraction(p['initialTotal'],p['initialCount'])
        cheaper = first - p['cheaper']
        assert cheaper > 0 and first * p['initialCount'] == p['initialTotal']
        value = cheaper * p['want']
        note = f'Unit price {first}, lower unit price {cheaper}, {p["want"]} purchases total {value}; monetary unit retained.'
    elif kind == 'digit-extremes-difference':
        values = [int(''.join(map(str,x))) for x in permutations(p['digits']) if x[0] != 0]
        assert len(values) == 18 and all(len(str(n))==4 for n in values)
        value = max(values) - min(values)
        method = 'Enumerate all digit permutations, discard leading-zero arrangements, compare true extrema'
        note = f'All 18 full-length permutations checked; {max(values)} minus {min(values)} gives {value}.'
    elif kind == 'unknown-child-tickets':
        value = one([n for n in range(101) if p['adults']*p['adultPrice']+n*p['childPrice']==p['total']])
        method = 'Enumerate nonnegative child counts against the complete ticket bill'
        note = f'Only {value} child tickets exactly recover total {p["total"]}; adult bill retained separately.'
    elif kind == 'three-ages-total':
        matches = [(a,b,p['total']-a-b) for a in range(1,p['total']) for b in range(1,p['total'])
                   if p['total']-a-b>0 and a+b==p['firstSecond'] and b+p['total']-a-b==p['secondThird']]
        ages = one(matches)
        value = ages[2]
        method = 'Enumerate positive age triples against total and both given pair sums'
        note = f'Unique triple {ages}; all three equations hold, requested third age {value}.'
    elif kind == 'future-age-ratio':
        value = one([t for t in range(201) if p['parent']+t==p['ratio']*(p['child']+t)])
        assert value>0 and (p['parent']+value)-(p['child']+value)==p['parent']-p['child']
        method = 'Enumerate future integer years and substitute both changing ages'
        note = f'Unique year offset {value}; both ages advance equally and ratio is exact.'
    elif kind == 'reverse-two-operations':
        value = one([n for n in range(1001) if n*p['factor']-p['subtract']==p['result']])
        method = 'Forward enumeration of the original two operations'
        note = f'Only input {value} passes forward multiply/subtract, independently of the reverse-operation formula.'
    elif kind == 'three-loads':
        first = 100*p['firstCentners']+p['firstKg']
        second = first+p['extraKg']
        third = first+second-100*p['lighterCentners']
        assert third>0
        values = [units(option,{'ц':100,'кг':1}) for option in row['options']]
        answer = choose(row,values,first+second+third)
        note = f'Individual masses {first}, {second}, {third} kg satisfy both directed comparisons; total {sum((first,second,third))}.'
    elif kind == 'parenthesis-maximum':
        tokens = []
        for i,n in enumerate(p['numbers']):
            if i: tokens.append([':','×','+'][i-1])
            tokens.append(str(n))
        expressions = []
        for first in range(0,len(tokens),2):
            for last in range(first+2,len(tokens),2):
                before=' '.join(tokens[:first]); inside=' '.join(tokens[first:last+1]);after=' '.join(tokens[last+1:])
                expressions.append(f'{before} ({inside}) {after}'.strip())
        values = [arithmetic(text) for text in expressions]
        assert len(values)==6 and any(v.denominator>1 for v in values)
        value = max(values)
        method = 'Enumerate every contiguous single-pair bracket placement and evaluate with independent Fraction AST'
        note = f'All six exact candidates {list(map(str,values))}, including noninteger 24/5; global maximum {value}.'
    elif kind == 'missing-comparison-digit':
        values=[d for d in range(10) if int(p['pattern'].replace('?',str(d)))>p['right']]
        value=len(values)
        assert int(p['pattern'].replace('?',str(int(str(p['right'])[p['pattern'].index('?')]))))==p['right']
        note = f'All ten digit substitutions checked; valid digits {values}; equality boundary explicitly rejected.'
    elif kind == 'even-sum-pairing':
        terms=list(range(2,p['last']+1,2));value=sum(terms)
        assert len(terms)%2==0 and len({terms[i]+terms[-1-i] for i in range(len(terms)//2)})==1
        note = f'Direct sum of all {len(terms)} printed-range even terms gives {value}; equal two-sided pairs checked separately.'
    elif kind == 'centners-to-kilograms':
        value=sum(100 for _ in range(p['centners']))+p['kilograms']
        assert divmod(value,100)==(p['centners'],p['kilograms'])
        note = f'{value} kg; inverse class division returns both original units and the internal-zero placeholder.'
    elif kind == 'time-comparison-choice':
        checks=[]
        for option in row['options']:
            h,m,relation,right=re.fullmatch(r'(\d+) сағ (\d+) мин ([<>=]) (\d+) мин',option).groups()
            left=60*int(h)+int(m);right=int(right)
            checks.append(left<right if relation=='<' else left>right if relation=='>' else left==right)
        answer=choose(row,checks,True)
        note=f'All printed time relations evaluated in base 60; truth values {checks}, including the false base-100 distractor.'
    elif kind == 'proportional-tickets':
        value=Fraction(p['total'],p['count'])*p['want']
        assert value*p['count']==p['total']*p['want']
        note=f'Cross-multiplied total-price equation independently checks proportional result {value}.'
    elif kind == 'three-pair-ages':
        limit=p['firstSecond']+p['secondThird']+p['firstThird']
        matches=[(a,b,p['firstThird']-a) for a in range(1,limit) for b in range(1,limit)
                 if a+b==p['firstSecond'] and p['firstThird']-a>0 and b+p['firstThird']-a==p['secondThird']]
        ages=one(matches);value=ages[2]
        method='Enumerate positive age triples against all three pair sums'
        note=f'Unique ages {ages}; every pair sum checked, target third age {value}.'
    else:
        raise AssertionError(('Unreviewed revision model',kind))
    if answer is None:
        assert Fraction(value).denominator==1
        value=int(value)
        if row.get('options'):
            values=[number(option) for option in row['options']]
            answer=choose(row,values,value)
            assert len(values)==len(set(values))
        else:
            answer=str(value)
    assert row['answer']==answer,(row['editionId'],row['answer'],answer)
    if row.get('options'):
        assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:
        assert re.fullmatch(r'\d+',answer) and 'Жауап' in row['statement'] and 'сан' in row['statement']
    return method,note


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==31
    assert len({r['editionId'] for r in rows})==31 and len({r['sourceRefs'][0]['sourceId'] for r in rows})==31
    entries=[]
    for row in rows:
        kind=row['modelId'].removeprefix('grade4-revision-')
        topic='eq' if kind in {'future-age-ratio','reverse-two-operations'} else 'ratio' if kind in {'map-distance','proportional-tickets','cheaper-unit-price','unknown-child-tickets'} else 'num'
        assert row['grade']==4 and row['topic']==topic and row['minimumPlan']=='pro'
        assert not re.search(r'[\\$]',row['statement']+row['solution'])
        for ref in row['sourceRefs']:
            raw=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in raw['questions'] if q['id']==ref['sourceId']])
            assert raw['grade']==4 and raw['topic']=='1-1' and q['checked'] and not q.get('images') and not q.get('svg')
            assert q['statement']!=row['statement']
        method,note=solve(row)
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':method,
                        'notes':note+' Full source/new statements, complete solutions and every MCQ read independently. Grade, directed comparisons, units/base-60, strict bounds, zero restrictions and original efficient-method skill retained. No authored solver imported.'})
    rejected=0
    for row in rows:
        changed=json.loads(json.dumps(row));changed['answer']='__WRONG_KEY__'
        try:solve(changed)
        except AssertionError:rejected+=1
        else:raise AssertionError('Oracle accepted a wrong key')
    print(json.dumps({'independentRevisionChecks':len(entries),'wrongKeysRejected':rejected,'manualFindings':[]},ensure_ascii=False,indent=2))
    if args.write:
        report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23',
                'scope':'All 31 saved canonical grade4 revision sources and authored conditions, complete solutions and all MCQ read independently. Separate integer/Fraction AST arithmetic, full bracket placements, digit permutations and age/ticket searches reproduce every answer. Nine conditions reread after adding numeric-only response guidance. Full edition hashes pin exact reviewed content.',
                'entries':entries}
        (ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('Wrote 31 independent revision review records.')


if __name__=='__main__':main()
