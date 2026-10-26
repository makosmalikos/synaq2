"""Independent full-source/content review of all 54 grade6 percentage edits.

Only immutable source JSON and authored batch JSON are read. No producer solver
or renderer is imported. Exact Fraction ledgers, symbolic Laurent polynomials,
integer populations, direct counting and exhaustive input searches form a second
oracle. --write records complete canonical edition hashes after manual reading.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse
import ast
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade6-percent.json'
OUT='problems/editorial/reviews/grade6-percent.json'


def digest(row):
    return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()


def one(values):
    assert len(values)==1,values
    return values[0]


def numeric(text):
    text=text.strip().replace(',','.')
    if text.startswith('(') and text.endswith(')'):text=text[1:-1]
    assert re.fullmatch(r'\d+(?:\.\d+)?(?:/\d+)?',text),text
    return F(text)


def percent(text):
    assert text.endswith('%'),text
    return numeric(text[:-1])


def choose(row,values,target):
    assert len(values)==4 and values.count(target)==1,(row['editionId'],values,target)
    return row['options'][values.index(target)]


def clean(poly):
    return {powers:coefficient for powers,coefficient in poly.items() if coefficient}


def add(a,b,sign=1):
    out=dict(a)
    for powers,coefficient in b.items():out[powers]=out.get(powers,F(0))+sign*coefficient
    return clean(out)


def multiply(a,b):
    out={}
    for left,x in a.items():
        for right,y in b.items():
            powers=tuple(u+v for u,v in zip(left,right));out[powers]=out.get(powers,F(0))+x*y
    return clean(out)


def symbolic(text,names=None):
    """Exact sparse Laurent polynomial, valid for nonzero/positive variables."""
    names=names or {'m':(1,0),'n':(0,1)}
    text=text.replace('·','*').replace('%','')
    text=re.sub(r'(\d)([a-z])',r'\1*\2',text)
    tree=ast.parse(text,mode='eval')
    def visit(node):
        if isinstance(node,ast.Expression):return visit(node.body)
        if isinstance(node,ast.Constant):
            assert isinstance(node.value,int)
            return {(0,0):F(node.value)} if node.value else {}
        if isinstance(node,ast.Name):return {names[node.id]:F(1)}
        assert isinstance(node,ast.BinOp)
        left,right=visit(node.left),visit(node.right)
        if isinstance(node.op,ast.Add):return add(left,right)
        if isinstance(node.op,ast.Sub):return add(left,right,-1)
        if isinstance(node.op,ast.Mult):return multiply(left,right)
        assert isinstance(node.op,ast.Div) and len(right)==1
        powers,coefficient=next(iter(right.items()));assert coefficient
        return {tuple(x-y for x,y in zip(k,powers)):v/coefficient for k,v in left.items()}
    return clean(visit(tree))


def solve(row):
    p=row['params'];kind=row['modelId'].removeprefix('grade6-percent-')
    value=answer=None
    method='Independent exact Fraction ledger with the stated comparison base'
    note=''
    if kind=='direct-part':
        assert p['whole']>0 and p['part']>0
        value=F(100*p['part'],p['whole'])
        if p['context']=='improper':assert value>100
        else:assert value<=100
        note=f'Stated part {p["part"]} over whole {p["whole"]}; exact percent {value}, including over-100 and finite-decimal cases.'
    elif kind=='fraction-percent':
        value=F(p['numerator'],p['denominator'])*100
        note=f'Exact fraction {p["numerator"]}/{p["denominator"]} converted to {value} percent.'
    elif kind=='minutes-hour':
        value=F(p['minutes'],60)*100
        note=f'One hour is 60 equal minute units; {p["minutes"]} of them gives {value} percent.'
    elif kind in {'decimal-ratio','decimal-length'}:
        part=F(p['partTenths'],10);value=100*part/p['whole']
        assert value*p['whole']/100==part
        note=f'Tenths represented exactly as {part}; required whole {p["whole"]}, percent {value}, inverse multiplication checks part.'
    elif kind=='general-formula':
        values=[symbolic(option) for option in row['options']]
        answer=choose(row,values,{(1,-1):F(100)})
        method='Formal sparse Laurent-polynomial identities in positive m,n; no numeric sampling'
        note='Only the printed m/n expression with coefficient 100 is identically the requested percentage; inverse/base and scale alternatives fail symbolically.'
    elif kind=='grams-kilograms':
        value=F(p['grams'],1000*p['kilograms'])*100
        note=f'Convert whole to {1000*p["kilograms"]} grams before comparing {p["grams"]} grams; exact {value} percent.'
    elif kind=='hundred-percent':
        values=[]
        for option in row['options']:
            left,relation,right=re.fullmatch(r'(.+?)\s*([<>=])\s*(.+)',option).groups()
            difference=add(symbolic(left,{'u':(1,0),'v':(1,0)}),symbolic(right,{'u':(1,0),'v':(1,0)}),-1)
            # u=v follows directly from 100/100=1; all printed strict relations have zero difference.
            if relation=='=':values.append(not difference)
            else:
                assert not difference
                values.append(False)
        answer=choose(row,values,True)
        method='Exact symbolic substitution u=(100/100)v into each printed relation'
        note='The 100-percent relation is equality; strict inequalities and multiplication by 100 are not equivalent.'
    elif kind in {'price-discount','price-growth','savings-growth'}:
        change=p['before']-p['after'] if kind=='price-discount' else p['after']-p['before']
        assert change>0
        value=F(change,p['before'])*100
        note=f'Price/balance change {change} divided by original {p["before"]}, not final amount; exact {value} percent.'
    elif kind=='inverse-decimal':
        ratio=F(p['hundredths'],100);value=100/ratio
        assert ratio*value==100
        note=f'Given exact ratio {ratio} inverted before percentage conversion; inverse is {value} percent.'
    elif kind=='ratio-share':
        assert all(x>0 for x in p['weights'])
        value=F(p['weights'][p['target']],sum(p['weights']))*100
        note=f'All ratio parts form whole {sum(p["weights"])}; requested indexed part {p["weights"][p["target"]]} gives {value} percent.'
    elif kind=='paired-defects':
        target=tuple(F(d,t)*100 for d,t in zip(p['defects'],p['totals']))
        values=[]
        for option in row['options']:
            labels=re.findall(r'(I|II):\s*([^%;]+)%',option)
            assert [label for label,_ in labels]==['I','II']
            values.append(tuple(numeric(value) for _,value in labels))
        answer=choose(row,values,target)
        note=f'Two independent production bases {p["totals"]}; ordered percentages {tuple(map(str,target))}, all full labelled options parsed.'
    elif kind in {'less-than','greater-than'}:
        base=p['large'] if kind=='less-than' else p['small']
        value=F(p['large']-p['small'],base)*100
        note=f'Same difference {p["large"]-p["small"]}, explicitly different directional base {base}; exact {value} percent.'
    elif kind=='correct-complement':
        correct=p['total']-p['wrong'];value=F(correct,p['total'])*100
        assert value+F(p['wrong'],p['total'])*100==100
        note=f'Correct count {correct}, not wrong count; complementary exact percentages add to 100.'
    elif kind=='travel-share':
        travelled=sum(p['speed'] for _ in range(p['hours']));assert 0<travelled<=p['distance']
        value=F(travelled,p['distance'])*100
        note=f'Repeated hourly distance gives {travelled} km, compared with full route {p["distance"]}; exact {value} percent.'
    elif kind=='area-share':
        rectangle=sum(p['rectangle'][0] for _ in range(p['rectangle'][1]));square=sum(p['side'] for _ in range(p['side']))
        value=F(square,rectangle)*100
        method='Count square-centimetre unit cells in each figure, then compare areas'
        note=f'Unit-cell areas {square} and {rectangle}, exact {value} percent; side lengths are not substituted for areas.'
    elif kind=='combine-salt-water':
        total=p['water']+p['salt'];value=F(p['salt'],total)*100
        note=f'New whole includes both {p["water"]} water and {p["salt"]} salt; mass {total}, percentage {value}.'
    elif kind=='salt-complement':
        salt=p['solution']-p['water'];assert salt>0;value=F(salt,p['solution'])*100
        note=f'Salt found by complement {salt}; denominator remains complete solution {p["solution"]}, exact {value} percent.'
    elif kind=='third-category':
        last=p['total']-p['first']-p['second'];assert last>0;value=F(last,p['total'])*100
        note=f'Explicit disjoint categories leave {last}; shares of all three sum to exactly 100.'
    elif kind=='drying-yield':
        assert 0<p['dried']<p['fresh'];value=F(p['dried'],p['fresh'])*100
        note=f'Retained output mass {p["dried"]} over original {p["fresh"]}; yield {value}, not lost-mass percentage.'
    elif kind=='over-plan':
        extra=p['actual']-p['planned'];assert extra>0;value=F(extra,p['planned'])*100
        note=f'Only above-plan amount {extra} compared to original plan {p["planned"]}; {value} percent rather than total fulfilment.'
    elif kind=='weighted-concentration':
        assert p['masses'][0]!=p['masses'][1] and p['rates'][0]!=p['rates'][1]
        components=[F(m*r,100) for m,r in zip(p['masses'],p['rates'])]
        total=sum(p['masses']);solute=sum(components);value=100*solute/total
        assert value!=F(sum(p['rates']),len(p['rates']))
        assert min(p['rates'])<value<max(p['rates'])
        note=f'Actual component-mass ledger {tuple(map(str,components))}; preserved solute {solute} in total mass {total}; weighted {value}, simple mean deliberately differs.'
    elif kind=='nested-attendance':
        examples=[]
        for total in range(1,1001):
            girls=F(total*p['groupPercent'],100);boys=total-girls
            first=girls*p['firstRate']/100;second=boys*p['secondRate']/100
            if all(x.denominator==1 for x in (girls,boys,first,second)) and first+second>0:
                examples.append((total,first,second,100*first/(first+second)))
        assert len(examples)>1 and len({x[3] for x in examples})==1
        value=examples[0][3]
        method='Enumerate every feasible integer class population up to 1000 and count both attendee subgroups exactly'
        note=f'All {len(examples)} feasible populations give attendee-only denominator and {value} percent girls; group-rate averages and original-class denominator rejected.'
    elif kind=='square-growth':
        original=len([(x,y) for x in range(p['before']) for y in range(p['before'])])
        final=len([(x,y) for x in range(p['after']) for y in range(p['after'])])
        value=F(final-original,original)*100
        method='Independently count both square grids and compare new unit cells with original grid'
        note=f'Areas {original}, {final}; increase {final-original} over original area gives {value} percent, not linear side growth.'
    elif kind=='return-price':
        assert p['peak']>p['initial'];drop=p['peak']-p['initial'];value=F(drop,p['peak'])*100
        note=f'Only second-stage peak {p["peak"]} is the discount base; equal-money drop {drop} gives {value} percent.'
    elif kind=='dilution':
        solute=F(p['mass']*p['rate'],100);new=p['mass']+p['water'];value=solute*100/new
        assert value<p['rate'] and F(new)*value/100==solute
        note=f'Solute mass {solute} invariant; only whole mass becomes {new}, exact diluted percentage {value}.'
    elif kind=='third-class':
        participants=F(sum(p['sizes'])*p['allRate'],100);last=participants-p['first']-p['second']
        assert participants.denominator==last.denominator==1 and 0<last<=p['sizes'][2]
        assert p['first']<=p['sizes'][0] and p['second']<=p['sizes'][1]
        value=last*100/p['sizes'][2]
        note=f'Global participants {participants}, third-class attendees {last}; final denominator is third-class size {p["sizes"][2]}, exact {value} percent.'
    elif kind=='compound-growth':
        initial,middle,final=p['values'];assert initial<middle<final
        first=F(middle-initial,initial);second=F(final-middle,middle);assert first==second
        value=F(final-initial,initial)*100;assert value>200*first
        note=f'Both annual exact rates equal {first}; complete initial-to-final change yields {value}, exceeding simple doubled annual rate.'
    elif kind=='inverse-percent':
        value=F(10000,p['givenPercent']);assert value*p['givenPercent']==10000
        note=f'Reciprocal of stated {p["givenPercent"]}/100 ratio, then multiply by 100; exact {value} percent.'
    elif kind=='chain-ratio':
        first,second=(F(x,100) for x in p['hundredths']);value=first*second*100
        note=f'Positive proportional factors {first}, {second} multiply; exact chained percentage {value}, not sum of rates.'
    elif kind=='class-changes':
        boys=F(p['total']*p['boyPercent'],100);girls=p['total']-boys
        assert boys.denominator==1 and girls>=p['leftGirls']
        newboys=boys+p['addedBoys'];newgirls=girls-p['leftGirls'];newtotal=newboys+newgirls
        assert newtotal==p['total']+p['addedBoys']-p['leftGirls'] and newtotal!=p['total']
        value=newboys*100/newtotal
        note=f'New integer subgroup ledger boys={newboys}, girls={newgirls}, whole={newtotal}; exact {value}, original denominator is no longer valid.'
    elif kind=='select-pair':
        pairs=[tuple(map(int,re.fullmatch(r'\((\d+);\s*(\d+)\)',option).groups())) for option in row['options']]
        values=[F(first,second)*100 for first,second in pairs]
        answer=choose(row,values,F(p['targetPercent']))
        note=f'Every displayed ordered pair independently parsed; first/second percentages {tuple(map(str,values))}; order retained.'
    elif kind=='fraction-complement':
        parts=[F(a,b) for a,b in p['fractions']];assert 0<sum(parts)<1;value=(1-sum(parts))*100
        note=f'Both parts explicitly of the same original whole: {tuple(map(str,parts))}; remaining {1-sum(parts)}, exact {value} percent.'
    elif kind=='grid-product':
        cells=[(x,y) for x in range(p['rows']) for y in range(p['columns'])];assert p['eaten']<len(cells)
        value=F(p['eaten'],len(cells))*100
        note=f'Enumerated all {len(cells)} equal cells; eaten {p["eaten"]}, exact {value} percent, complement differs.'
    elif kind=='speed-comparison':
        speeds=[F(distance,hours) for distance,hours in zip(p['distances'],p['hours'])];assert p['hours'][0]!=p['hours'][1]
        value=100*speeds[0]/speeds[1]
        note=f'Exact independent speeds {tuple(map(str,speeds))}; compare speeds, not distances, obtaining {value} percent.'
    elif kind=='sum-first-relative':
        second=p['sum']-p['first'];assert second>0;value=F(p['first'],second)*100
        assert value.denominator>1 and value.denominator%3==0
        note=f'Second number {second} forms the base, not given sum; exact nonterminating percentage {value}, no approximation.'
    elif kind=='second-sale-base':
        sold=F(p['total']*p['firstPercent'],100);remaining=p['total']-sold
        assert sold.denominator==1 and 0<p['second']<=remaining
        value=100*F(p['second'])/remaining
        note=f'First sale {sold}, remaining whole {remaining}; next sale {p["second"]} relative to that remaining base gives {value} percent.'
    elif kind=='rounded-wins':
        exact=F(100*p['wins'],p['games']);values=[percent(option) for option in row['options']]
        distances=[abs(v-exact) for v in values];index=one([i for i,d in enumerate(distances) if d==min(distances)])
        assert distances[index]<F(1,2) and values[index].denominator==1
        answer=row['options'][index]
        method='Exact Fraction distance to all offered integers; unique nearest whole percentage, no float rounding'
        note=f'Exact value {exact}; nearest offered whole value {values[index]}, absolute error {distances[index]}.'
    elif kind=='mixed-sales-profit':
        assert p['firstPrice']>p['costEach']>p['lastPrice'] and 0<p['firstQuantity']<p['quantity']
        gains=p['firstQuantity']*(p['firstPrice']-p['costEach'])
        losses=(p['quantity']-p['firstQuantity'])*(p['costEach']-p['lastPrice'])
        profit=gains-losses;cost=p['quantity']*p['costEach'];assert profit>0
        value=F(profit,cost)*100
        method='Per-item profit/loss ledger, independently of revenue-minus-cost producer calculation'
        note=f'Gains {gains} minus final-sale losses {losses}; compare net {profit} with purchase cost {cost}, exact {value} percent.'
    elif kind=='successes-added-total':
        values=[]
        for initial in range(1,2001):
            hits=F(initial*p['initialPercent'],100)
            if hits.denominator==1 and F(hits+p['added'],initial+p['added'])*100==p['finalPercent']:
                values.append((initial,int(hits),initial+p['added'],int(hits)+p['added']))
        initial,hits,final,finalhits=one(values);assert initial-hits==final-finalhits;value=F(final)
        method='Enumerate integer initial throw counts/hits, apply every new successful throw, substitute final percentage'
        note=f'Unique initial/final ledger {(initial,hits,final,finalhits)}; unchanged misses {initial-hits}, requested final total {final}, not a percentage.'
        assert 'Жауапқа тек лақтыру санын жазыңыз.' in row['statement']
    elif kind=='neither-divisor':
        allowed=[n for n in range(1,p['last']+1) if all(n%d for d in p['divisors'])]
        value=F(len(allowed),p['last'])*100
        method='Directly enumerate every inclusive-domain integer, test both nondivisibility predicates, then convert count to percent'
        note=f'{len(allowed)} integers of {p["last"]}, exact {value} percent; intersection correction verified without inclusion-exclusion formula.'
    else:raise AssertionError(('Unreviewed percent model',kind))
    if answer is None:
        value=F(value)
        if row.get('options'):answer=choose(row,[percent(option) for option in row['options']],value)
        else:
            assert numeric(row['answer'])==value,(row['editionId'],row['answer'],value)
            answer=row['answer']
    assert row['answer']==answer,(row['editionId'],row['answer'],answer)
    if row.get('options'):
        assert len(row['options'])==len(set(row['options']))==4 and row['options'].count(answer)==1
    else:
        assert 'Жауапқа' in row['statement'] and 'сан' in row['statement']
        # Open fractions are not safely equivalent-graded; only finite decimals or integers are used here.
        assert re.fullmatch(r'\d+(?:,\d+)?',row['answer'])
    return method,note


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==54
    sourceids={r['sourceRefs'][0]['sourceId'] for r in rows};assert len(sourceids)==len({r['editionId'] for r in rows})==54
    captured=set()
    for path in (ROOT/'problems/sources/zerek/courses').glob('6-math-1-3-*.json'):
        raw=json.loads(path.read_text())
        if raw.get('status')!='captured':continue  # Catalog metadata has no captured questions.
        assert raw['grade']==6 and raw['topic']=='1-3'
        for q in raw['questions']:
            assert q['checked'] and not q.get('images') and not q.get('svg')
            captured.add(q['id'])
    assert captured==sourceids
    entries=[]
    for row in rows:
        assert row['grade']==6 and row['topic']=='pct' and row['minimumPlan']=='pro'
        assert not re.search(r'[\\$]',row['statement']+row['solution'])
        for ref in row['sourceRefs']:
            raw=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in raw['questions'] if q['id']==ref['sourceId']])
            assert raw['grade']==6 and raw['topic']=='1-3' and q['checked'] and q['statement']!=row['statement']
        method,note=solve(row)
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':method,
                        'notes':note+' All source/new conditions, complete solutions and every source/new MCQ independently read; grade, explicit percent base, physical/count units, exact/nonterminating and rounding requirements retained. No authored solver imported.'})
    rejected=0
    for row in rows:
        changed=json.loads(json.dumps(row));changed['answer']='__WRONG_KEY__'
        try:solve(changed)
        except AssertionError:rejected+=1
        else:raise AssertionError('Wrong key accepted')
    canaries={
        'weighted-concentration':'35%',
        'nested-attendance':'18',
        'third-class':'20',
        'class-changes':'60',
        'rounded-wins':'64%',
        'mixed-sales-profit':'135',
        'successes-added-total':'20',
        'sum-first-relative':'66,67%',
    }
    for kind,wrong in canaries.items():
        row=next(r for r in rows if r['modelId']=='grade6-percent-'+kind);changed=json.loads(json.dumps(row));changed['answer']=wrong
        try:solve(changed)
        except AssertionError:pass
        else:raise AssertionError(('Base/rounding/domain canary accepted',kind))
    exact=next(r for r in rows if r['modelId']=='grade6-percent-sum-first-relative')
    changed=json.loads(json.dumps(exact));changed['options'][1]='(400/6)%'
    try:solve(changed)
    except AssertionError:pass
    else:raise AssertionError('Equivalent second correct rational MCQ accepted')
    print(json.dumps({'independentPercentChecks':len(entries),'wrongKeysRejected':rejected,'baseExactnessAndCountCanaries':len(canaries)+1,'manualFindings':[]},ensure_ascii=False,indent=2))
    if args.write:
        report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23',
                'scope':'All 54 canonical saved grade6 topic1.3 sources and authored conditions, complete solutions and MCQ independently read. JSON-only exact Fraction ledgers, symbolic Laurent identities, integer population/throw searches, grid and divisibility counts, and exact nearest-integer distances independently reproduce answers. Final throw-count instruction reread after targeted wording fix. Full edition hashes pin reviewed content.',
                'entries':entries}
        (ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print('Wrote 54 independent percent review records.')


if __name__=='__main__':main()
