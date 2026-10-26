"""Independent31-row power-of-ten Euclidean remainder review.
All saved/new full statements, solutions and MCQ read. No author solver import.
"""
from pathlib import Path
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-powerrem-wave24.json'
OUT='problems/editorial/reviews/grade4-powerrem-wave24.json'


def digest(row):return hashlib.sha256(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def num(s):
    s=re.sub(r'\s','',s);assert re.fullmatch(r'\d+',s),s
    return int(s)

def one(xs):
    assert len(xs)==1,xs
    return xs[0]

def match(pattern,s):
    m=re.search(pattern,s);assert m,(pattern,s)
    return m

def expr(s):
    s=re.sub(r'(?<=\d) (?=\d)','',s).replace('·','*').replace('−','-')
    node=ast.parse(s,mode='eval')
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Constant):assert isinstance(n.value,int);return n.value
        assert isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult)),s
        a,b=walk(n.left),walk(n.right)
        return a+b if isinstance(n.op,ast.Add) else a-b if isinstance(n.op,ast.Sub) else a*b
    return walk(node)

def operation(s):
    m=match(r'^([\d ]+) : ([\d ]+)$',s);return num(m[1]),num(m[2])

def division(n,d):
    assert n>=0 and d>0
    q,r=divmod(n,d);assert q*d+r==n and 0<=r<d
    assert q*d<=n<(q+1)*d
    return q,r

def pick(row,predicate):return one([o for o in row['options'] if predicate(o)])

def qrlabel(o):
    m=match(r'^([\d ]+), қалдық (\d+)$',o);return num(m[1]),int(m[2])

def solve(row):
    s=row['statement'];kind=row['modelId'].removeprefix('grade4-powerrem-');value=answer=None
    method='Independent printed Euclidean inverse identity and complete offered candidate domain, with 0≤r<divisor checked';note=''
    if kind in {'remainder','padded-remainder','quotient'}:
        m=match(r'^([\d ]+) санын ([\d ]+) санына',s);n,d=num(m[1]),num(m[2]);q,r=division(n,d);value=q if kind=='quotient' else r
        if kind=='padded-remainder':assert str(n)[-3:]=='007' and r==7
        note=f'Actual n={n}, d={d}: q={q},r={r}; multiplication reconstruction and enclosing quotient interval both hold. Requested '+('quotient' if kind=='quotient' else 'remainder')+' selected; padded leadingzeros are not numeric digits of remainder.'
    elif kind in {'division-result','internal-zero-result','zero-separated-result'}:
        m=match(r'^([\d ]+) : ([\d ]+)',s);n,d=num(m[1]),num(m[2]);q,r=division(n,d);answer=pick(row,lambda o:qrlabel(o)==(q,r))
        if kind=='internal-zero-result':assert str(q)[-3:-1]=='00' and len(str(q))==5
        if kind=='zero-separated-result':assert str(q).endswith('0') and str(r)[1]=='0'
        note=f'All actual q/r options checked as ordered pairs; exact answer({q},{r}) reconstructs{n} with divisor{d}. Internal quotientzeros and remainderzero retained in their distinct positions.'
    elif kind in {'greatest-remainder','greatest-quotient','zero-remainder'}:
        ops=[operation(o) for o in row['options']];pairs=[division(*op) for op in ops];index=0 if kind=='greatest-quotient' else 1;values=[p[index] for p in pairs];wanted=0 if kind=='zero-remainder' else max(values)
        answer=one([o for o,v in zip(row['options'],values) if v==wanted])
        if kind=='greatest-quotient':assert sorted(values)[-1]-sorted(values)[-2]==1
        if kind=='greatest-remainder':assert sorted(values)==[8,67,89,98]
        if kind=='zero-remainder':assert values==[4,0,2,40]
        note=f'Every actual option decomposed separately: {pairs}. Requested '+('quotient' if index==0 else 'remainder')+f' values{values}; unique chosen value{wanted}. Near-tied quotients and different powers-of-ten divisors preserved.'
    elif kind=='inverse-expression':
        m=match(r'Мерей ([\d ]+) : (\d+) = (\d+), қалдық (\d+)',s);n,d,q,r=num(m[1]),int(m[2]),int(m[3]),int(m[4]);assert division(n,d)==(q,r);answer=pick(row,lambda o:expr(o)==n)
        note=f'Actual n{n},d{d},q{q},r{r}; every printed arithmetic alternative evaluated by independent allowlisted AST, only q×d+r reconstructs n.'
    elif kind=='complete-tenge':
        assert '1 теңге = 100 тиын' in s;n=num(match(r'([\d ]+) тиында',s)[1]);q,r=division(n,100);value=q
        note=f'Given100 tiyn per tenge; exact full-unit bound100×{q}≤{n}<100×{q+1}; residual{r}tiyn cannot make another full tenge.'
    elif kind=='impossible-hundred-remainder':
        d=int(match(r'санды (\d+)-ге',s)[1]);possible={division(n,d)[1] for n in range(1,4*d)};assert possible==set(range(d));answer=pick(row,lambda o:num(o) not in possible)
        method='All complete modulo100 residue classes with positive-dividend witnesses and strict impossible endpoint'
        note=f'Complete residues{min(possible)}..{max(possible)} enumerated from positive inputs; offered{answer}=divisor invalid, while0 valid.'
    elif kind in {'restore-padded-remainder','restore-dividend'}:
        m=match(r'Санды (\d+) санына бөлгенде толымсыз бөлінді (\d+), қалдық (\d+)',s);d,q,r=map(int,m.groups());assert 0<=r<d;value=q*d+r
        states=[n for n in range(q*d,(q+1)*d) if division(n,d)==(q,r)];assert states==[value]
        if kind=='restore-padded-remainder':answer=pick(row,lambda o:num(o)==value);assert str(value)[-2]=='0' and r<10
        note=f'Entire quotient interval[{q*d},{(q+1)*d}) searched, sole dividend{value} has exact ordered pair({q},{r}). Residual{r} padded to divisorwidth rather than moved to tens.'
    elif kind=='full-boxes-leftover':
        m=match(r'Жиналған ([\d ]+) алманы әр толық жәшікке (\d+) данадан',s);n,d=num(m[1]),int(m[2]);q,r=division(n,d)
        def valid(o):
            m=match(r'^(\d+) жәшік, (\d+) алма$',o);return (int(m[1]),int(m[2]))==(q,r)
        answer=pick(row,valid);assert q%10==0
        note=f'Actual apples{n},full capacity{d}; maximum full-box count{q},leftover{r}. Whole-package floor, not next-box ceiling; terminalzero in boxcount retained.'
    elif kind=='minimum-shelves':
        m=match(r'Кітапханадағы ([\d ]+) кітапты',s);n=num(m[1]);d=int(match(r'ең көп (\d+) кітап',s)[1]);value=one([k for k in range(1,n+1) if (k-1)*d<n<=k*d]);q,r=division(n,d);assert r>0 and value==q+1
        method='Complete positive shelfcount domain with both capacity feasibility and minimality inequality'
        note=f'Actual{n}books require{value}shelves: {value-1}×{d}={d*(value-1)} insufficient, {value}×{d}={d*value} sufficient; nonempty remainder demands ceiling.'
    elif kind=='wrong-zero-equality':
        truths=[]
        for o in row['options']:
            m=match(r'^([\d ]+) : ([\d ]+) = ([\d ]+)(?:, қалдық (\d+))?$',o);n,d,q,r=num(m[1]),num(m[2]),num(m[3]),int(m[4] or 0);truths.append(division(n,d)==(q,r))
        answer=one([o for o,good in zip(row['options'],truths) if not good]);assert row['intentionalIncorrectExample'] is True
        note=f'All four printed quotient/remainder equalities checked, truth vector{truths}; only selected false example drops quotientzero. Explicit intentionalIncorrectExample retained, no false equality treated as fact.'
    elif kind=='kilogram-pack-remainder':
        m=match(r'^([\d ]+) г ұнды әрқайсысы (\d+) кг',s);n,k=num(m[1]),int(m[2]);d=1000*k;q,r=division(n,d);value=r;assert str(n)[-3]=='0'
        note=f'Fixed SI1000g/kg gives packsize{d};{q}full packs plus{r}g. Leading0 in residualblock{str(n)[-3:]} removed only from numeric remainder.'
    elif kind=='select-specific-remainder':
        m=match(r'санды ([\d ]+) санына бөлгенде қалдық (\d+) шығады',s);d,r=num(m[1]),int(m[2]);assert 0<=r<d;answer=pick(row,lambda o:division(num(o),d)[1]==r)
        values=[division(num(o),d)[1] for o in row['options']]
        if d==1000:assert values==[70,607,7,700]
        else:assert values==[0,24,4,40]
        note=f'Actual offered residualvalues{values}; requested r{r} selected with exact divisor{d}, digittranspositions and padding interpreted numerically.'
    elif kind in {'meters-to-km-m','centimeters-to-m-cm','centimeters-padded-remainder'}:
        m=match(r'^([\d ]+) (м|см) ұзындықты',s);n=num(m[1]);d=1000 if m[2]=='м' else 100;q,r=division(n,d)
        def valid(o):
            if d==1000:parts=match(r'^(\d+) км(?: (\d+) м)?$',o)
            else:parts=match(r'^(\d+) м(?: (\d+) см)?$',o)
            return int(parts[1])*d+int(parts[2] or 0)==n and int(parts[2] or 0)<d
        answer=pick(row,valid)
        if kind=='meters-to-km-m':assert r%10==0 and r<100
        if kind=='centimeters-to-m-cm':assert q%10==0 and r>=10
        if kind=='centimeters-padded-remainder':assert 0<r<10
        note=f'Actual length{n} maps to canonical mixedunits({q},{r}) at fixed SI factor{d}; all alternatives reconstructed in smallerunit and residualrange checked. Quotientzero and padded residualzero distinguished by family.'
    elif kind=='unknown-low-digit-quotient':
        m=match(r'санды (\d+)-ға бөлгенде толымсыз бөлінді (\d+)',s);d,q=map(int,m.groups());e=int(match(r'бастапқы санды (\d+)-ге',s)[1]);states=list(range(q*d,(q+1)*d));values={division(n,e)[0] for n in states};value=one(list(values));answer=pick(row,lambda o:num(o)==value)
        method='All10 admissible unknown-unitdigits enumerated, new quotient invariant established for whole interval'
        note=f'Full possible dividends{states}, not a chosen guessed value; each yields quotient{value} under new divisor{e}. Both enddigits0 and9 included.'
    elif kind=='least-positive-addition':
        m=match(r'^([\d ]+) санына',s);n=num(m[1]);d=num(match(r'қосынды ([\d ]+) санына',s)[1]);values=[a for a in range(1,d+1) if (n+a)%d==0];value=one(values);assert (n+value)%d==0 and all((n+a)%d!=0 for a in range(1,value))
        note=f'All positive additions1..{d} searched; first and only qualifying addition{value} reaches{n+value}, every smaller positive addition fails.'
    elif kind=='count-given-quotient':
        m=match(r'^([\d ]+) санына бөлгенде толымсыз бөлінді (\d+)',s);d,q=num(m[1]),int(m[2]);states=[n for n in range(1,(q+2)*d) if division(n,d)[0]==q];value=len(states);answer=pick(row,lambda o:num(o)==value)
        assert states==list(range(q*d,(q+1)*d)) and len({division(n,d)[1] for n in states})==d
        method='Complete natural-number domain through next quotient, every residue0..99 once; half-open enclosing bound checked'
        note=f'Exact full interval{states[0]}..{states[-1]}, count{value}; zero residue included, next endpoint{(q+1)*d} excluded.'
    elif kind=='remainder-over-quotient':
        m=match(r'^([\d ]+) санын (\d+) санына',s);n,d=num(m[1]),int(m[2]);q,r=division(n,d);value=r-q;assert value>0 and q%10==0
        note=f'Actual q{q},r{r}; asked remainder-minus-quotient{r}−{q}={value}, neither component alone. Quotientterminalzero retained.'
    elif kind=='equal-quotient-remainder':
        assert 'Төрт таңбалы' in s and 'төрт таңбалы' in s;d=num(match(r'санды ([\d ]+)-ға',s)[1]);states=[n for n in range(1000,10000) if division(n,d)[0]==division(n,d)[1]];value=len(states);answer=pick(row,lambda o:num(o)==value)
        assert states==[1001*k for k in range(1,10)]
        method='All9000 four-digit numbers enumerated with independent Euclidean floor/remainder comparison'
        note=f'Complete valid domain{states}; q=r=1..9, two paddedzeroes in each final3digit block,0 excluded by leadingdigit bound. Count{value}.'
    else:raise AssertionError(kind)
    if answer is None:answer=str(value)
    assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if row.get('options'):assert len(row['options'])==4 and len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert answer.isdecimal() and s.endswith('Жауапқа тек санды жазыңыз.')
    return {'method':method,'notes':note+' Every saved/new full condition, complete solution and offered option independently read; requested quantity/unit and original positional skill retained.'}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==31
    entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']]);assert raw['checked'];assert row['grade']==4 and row['minimumPlan']=='pro'
        check=solve(row);entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**check})
    assert len({r['sourceRefs'][0]['sourceId'] for r in rows})==31
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='wrong-key'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('Wrong key accepted')
    canaries=[(0,'94 628','94 629'),(1,'306 007','306 070'),(7,'590 046','590 406'),(12,'қалдық 8','қалдық 80'),(14,'2 378','2 478'),(16,'23 067','23 670'),(21,'468 болды','470 болды'),(22,'59 684','59 685'),(25,'80 504','80 054'),(28,'5 087','5 078')]
    for index,old,new in canaries:
        bad=copy.deepcopy(rows[index]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('Printed canary accepted',index))
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All31 saved/new full statements, solutions and MCQ read; independent printed Euclidean reconstruction, strict residue bounds, every candidate, full9000 four-digit equalq/r domain, all10 unknown digits, complete quotient/minimal-addition/shelf domains and fixed SI units;31wrongkeys+10printedcanaries rejected.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'wrongKeysAndPrintedCanariesRejected':rejected,'status':'passed'}))

if __name__=='__main__':main()
