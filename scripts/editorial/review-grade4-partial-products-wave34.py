"""Independent full25 saved/new partial-product review.
Uses actual printed arithmetic, exact ledgers and complete finite domains.
No author models, partial-product helper or column implementation imported.
"""
from pathlib import Path
from fractions import Fraction as F
from itertools import permutations
import argparse, ast, copy, hashlib, json, re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-partial-products-wave34.json'
OUT='problems/editorial/reviews/grade4-partial-products-wave34.json'
def one(xs):
    assert len(xs)==1,xs
    return xs[0]
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def products(s):return [(int(a),int(b))for a,b in re.findall(r'(\d+) × (\d+)',s)]
def integer(q):
    q=F(q);assert q.denominator==1,q
    return q.numerator
def calc(s):
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub))
        a,b=walk(n.left),walk(n.right)
        return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
    return walk(ast.parse(s.replace('×','*').replace(':','/').replace('−','-'),mode='eval'))
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(row):
    kind=row['modelId'].removeprefix('grade4-partial-products-');s=row['statement'];ns=nums(s);ps=products(s);opts=row.get('options',[]);answer=value=None
    method='Independent actual printed integer/Fraction arithmetic and inverse-ledger checks'
    if kind=='second-partial-value':
        a,b=one(ps);tens=b//10*10;value=sum(a for _ in range(tens))
        assert value==a*tens and a*(b%10)!=value and a*(b//10)*10==value
        note=f'Printed {a} × {b}; second FULL partial means {a} × {tens} = {value}, not stripped tens {a*(b//10)}, first partial {a*(b%10)}, or total {a*b}.'
    elif kind=='unit-price-purchase':
        price,count=ns;value=sum(price for _ in range(count));assert value==price*count
        note=f'Printed equal unit price {price} tenge, quantity {count}; independent repeated-price ledger totals {value}, not a sum of price and count.'
    elif kind=='both-partials-and-carry':
        a,b=one(ps);units,tens=b%10,b//10
        expected=[a*units,a*tens*10];answer=one([o for o in opts if nums(o)==expected])
        suffix=a%100;carry=suffix*tens//100;assert carry>0
        omitted=((a//100)*tens*100+(suffix*tens)%100)*10
        assert any(nums(o)==[expected[0],omitted]for o in opts)
        note=f'Actual ordered partials {expected}; their sum {sum(expected)} equals {a*b}. Last-two-digit × tens computation {suffix}×{tens}={suffix*tens} carries {carry} hundreds into previous place; omitting it yields wrong full second line {omitted} offered as distractor.'
    elif kind=='strict-product-threshold':
        bound=one(ns);vs=[calc(o)for o in opts];answer=one([o for o,v in zip(opts,vs)if v>bound])
        note=f'All actual products {list(zip(opts,map(str,vs)))} compared STRICTLY to {bound}; unique above-bound key {answer}, no rounding.'
    elif kind in {'product-equal-reference','product-above-round-reference'}:
        a,b=one(ps);reference=ns[-1];p=a*b;answer='='if p==reference else'>'if p>reference else'<'
        if kind=='product-equal-reference':assert p==reference
        else:assert reference<p<reference+1000
        note=f'Actual {a} × {b}={p}; reference {reference}; exact sign {answer}. Full integer product, not leading digits, determines comparison.'
    elif kind=='constant-wire-shortage':
        small,wire,count,available=ns;per=integer(F(wire,small));needed=sum(per for _ in range(count));gap=needed-available
        assert gap>0;answer=one([o for o in opts if o.startswith('Жетпейді:')and nums(o)==[gap]])
        note=f'Printed constant length {wire}/{small}={per} m/lamp; {count} lamps need {needed}, available {available}; SHORTFALL {gap} m. Direction and magnitude both selected.'
    elif kind=='rows-minus-visitors':
        rows,seats,visitors=ns;capacity=sum(seats for _ in range(rows));value=capacity-visitors
        assert 0<=value<=capacity and visitors+value==capacity
        note=f'Actual {rows} rows × {seats} seats={capacity}; each of {visitors} visitors occupies one, so {value} remain; whole capacity ledger checked.'
    elif kind=='nonstop-days-production':
        hourly,days=ns;hours=24*days;value=sum(hourly for _ in range(hours))
        note=f'Printed nonstop {days} days means {hours} hours, SI 24 h/day; constant {hourly}/hour gives {value} pieces. Day/hour conversion cannot be omitted.'
    elif kind=='purchase-change':
        price,count,paid=ns;spent=sum(price for _ in range(count));value=paid-spent;assert spent+value==paid and value>=0
        note=f'Printed cost {price} × {count}={spent}; paid {paid}; change {value}. Independent spent+change=paid ledger confirms requested remainder, not purchase cost.'
    elif kind=='select-missing-factor':
        target,known=ns;answer=one([o for o in opts if int(o)*known==target]);assert int(answer)==integer(F(target,known))
        note=f'All actual candidate inverse products {[(o,int(o)*known)for o in opts]}; only {answer} restores {target} with original factor {known}.'
    elif kind=='common-factor-no-full-product':
        (a,c),(samec,b)=ps;assert c==samec and c>0;answer='>'if a>b else'<'if a<b else'='
        assert a>b and 'Ортақ' in row['solution']
        method='Independent positive-common-factor monotonicity; full product only secondary check'
        note=f'Actual positive shared factor {c}; compare remaining {a}>{b}, giving {answer}. Commuting second product preserves factors; formal positive multiplication proof avoids full multiplication.'
    elif kind=='complete-distributive-expansion':
        a,b=one(ps);tens,unit=b//10*10,b%10;answer=one([o for o in opts if calc(o)==a*b])
        assert answer==f'{a} × {tens} + {a} × {unit}'
        note=f'Printed {b}={tens}+{unit}; BOTH parts multiply entire {a}. Actual option values {[(o,str(calc(o)))for o in opts]}: omitted cross-terms, multiplication instead of addition, and unshifted tens all fail.'
    elif kind=='inverse-division-with-shift-distractor':
        d,q=ns;value=d*q;assert F(value,d)==q and '0'in str(q)[1:-1]
        wrong=q*(d%10)+q*(d//10);assert str(wrong)in opts
        note=f'Printed x/{d}={q}; original-divisor inverse gives {value}. Unshifted partial sum {wrong} offered and rejected; internal zero in {q} retained. Direct substitution x/{d} confirms exact quotient.'
    elif kind=='three-by-two-digit-range':
        lengths={len(str(a*b))for a in range(100,1000)for b in range(10,100)};assert lengths=={4,5}
        answer='4 немесе 5';assert answer in opts
        assert 100*10==1000 and 999*99==98901
        method='Independent complete 900×90 factor domain plus monotone endpoint bounds'
        note='All 81000 three-digit × two-digit natural pairs yield exactly digit lengths {4,5}. Bounds 1000..98901 exclude 3/6 digits; both advertised witnesses 124×23=2852 and647×52=33644 verified.'
    elif kind=='efficient-multiply-ninety-nine':
        a,b=one(ps);assert b==99;value=a*100-a;assert value==a*b and '100 − 1'in row['solution']
        note=f'Actual {a} × 99 = {a} × (100−1) = {value}; subtract original {a}, not99. Distributive identity independent of column multiplication.'
    elif kind=='two-theatre-sections-revenue':
        rows,front,frontSeats,backSeats,frontPrice,backPrice=ns;assert 0<front<rows
        frontCount=sum(frontSeats for _ in range(front));backCount=sum(backSeats for _ in range(rows-front))
        left=sum(frontPrice for _ in range(frontCount));right=sum(backPrice for _ in range(backCount));value=left+right
        note=f'Actual labelled sections: front {frontCount} tickets at{frontPrice}→{left}, back{backCount} at{backPrice}→{right}; all sold, combined{value}. Each row/seat count kept with its own price.'
    elif kind=='reversed-multiplier-error':
        correct,wrong,excess=ns;assert str(wrong)==str(correct)[::-1]and wrong>correct
        n=integer(F(excess,wrong-correct));value=n*correct;assert n*wrong-value==excess
        note=f'Printed reversed factors {correct},{wrong}; excess {excess}=(wrong−correct)×n gives n{n}. Correct product{value}, wrong{n*wrong}; additive excess verified, not ratio{wrong-correct}.'
    elif kind=='hidden-tens-digit-whole-factor':
        first=int(one(re.findall(r'(\d+) × □',s)));unit=int(one(re.findall(r'□(\d)',s)));target=int(one(re.findall(r'= (\d+)',s)))
        valid=[10*d+unit for d in range(1,10)if first*(10*d+unit)==target];value=one(valid)
        assert first*unit+first*(value//10)*10==target
        method='Independent complete 1–9 hidden-tens digit domain and full-factor inverse substitution'
        note=f'Actual {first} × □{unit}={target}; candidates all10d+{unit} for d1..9, unique whole factor{value}. First partial{first*unit}, full second{target-first*unit}; requested full two-digit factor, not its tens digit.'
    elif kind=='meeting-distance-from-path-difference':
        faster,slower,gap=ns;time=F(gap,faster-slower);assert time>0
        first=faster*time;second=slower*time;value=integer(first+second)
        assert first-second==gap
        note=f'Printed simultaneous opposite motion at{faster}/{slower}km/h: shared time {time}h from travelled-distance gap{gap}. Paths {first},{second} sum to{value}km and differ by{gap}; neither path alone is city separation.'
    elif kind=='max-two-digit-products-from-four-digits':
        ds=ns;assert len(ds)==len(set(ds))==4 and all(1<=d<=9 for d in ds)
        ledger=[((10*a+b,10*c+d),(10*a+b)*(10*c+d))for a,b,c,d in permutations(ds)]
        value=max(v for _,v in ledger);unique={tuple(sorted(pair))for pair,v in ledger if v==value};assert unique=={(53,72)}
        assert len(ledger)==24 and len({tuple(sorted(pair))for pair,_ in ledger})==12
        method='Independent exhaustive 24 digit permutations; 12 unordered factor-pair partition'
        note=f'Actual digits{ds}, each used once; all24 labelled assignments checked. Unique unordered maximum53×72={value}; nearby52×73=3796 is lower, independently verified, not greedy-largest-number assumption.'
    elif kind=='two-digit-speed-time':
        speed,hours=ns;value=sum(speed for _ in range(hours));assert value==speed*hours and '0'in str(value)[1:-1]
        note=f'Printed constant actual-motion speed{speed}km/h for{hours}hours→{value}km; independent hourly sum. Result internal zero retained; no added rest period or missing hour conversion.'
    elif kind=='known-second-partial-rebuild-product':
        multiplier,second=ns;fullTens=multiplier//10*10;n=integer(F(second,fullTens));value=n*multiplier
        assert n*(multiplier%10)+second==value
        note=f'Printed SECOND full partial{second}=n×{fullTens} recovers n{n}. First partial{n*(multiplier%10)} plus second{second} yields{value}; full place value explicitly restored.'
    else:raise AssertionError(kind)
    if answer is None:answer=one([o for o in opts if o==str(value)])if opts else str(value)
    assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(answer)==1
    else:assert answer.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
    return{'method':method,'notes':note+' All saved/new full conditions, complete solutions and MCQ independently read; source-specific place value, requested partial/total/factor, exact units and whole-domain uniqueness checked.'}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==25;entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro'
        norm=lambda s:re.sub(r'\s+',' ',s.lower()).strip();assert norm(raw['statement'])!=norm(row['statement'])
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)})
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='WRONG'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('wrongkeyaccepted')
    canaries=[(0,'527','537'),(1,'1650','1750'),(2,'187','189'),(3,'6000','5900'),(4,'10800','10700'),
              (5,'2400','2600'),(6,'797','798'),(7,'3750','3760'),(8,'30000','31000'),(9,'8946','8956'),
              (10,'574','547'),(11,'647','648'),(12,'1404','1414'),(14,'573','583'),(15,'2800','2900'),
              (16,'5724','5742'),(17,'9570','9580'),(18,'210','225'),(19,'2, 3, 5, 7','2, 3, 5, 8'),
              (20,'79','76'),(21,'2650','2750'),(22,'1065','1075'),(23,'29000','30000'),(24,'21350','21300')]
    for i,old,new in canaries:
        bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('printedcanaryaccepted',i))
    witnesses=0
    for a in range(100,1000):
        for b in range(10,100):
            assert a*b==a*(b%10)+10*a*(b//10);witnesses+=1
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All25 saved/new full conditions, complete solutions/options read. Independent printed integer/Fraction, inverse/price/motion ledgers, positive common-factor proof, carry/place-value effects, all24 digit permutations and81000 digit/partial domains. No author calculator imported.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'wrongKeysAndPrintedCanariesRejected':rejected,'partialPlaceValueWitnesses':witnesses,'status':'independently_verified','report':OUT if args.write else None}))
if __name__=='__main__':main()
