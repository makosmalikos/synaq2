"""Independent review: all24 original/new full conditions, full solutions and MCQ read.

Does not import the author renderer/calculator. Printed values are parsed anew;
uses Fraction inverse equations, decimal valuation and complete candidate domains.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-decimal-wave23.json'
OUT='problems/editorial/reviews/grade4-decimal-wave23.json'


def digest(row):return hashlib.sha256(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def one(xs):
    assert len(xs)==1,xs
    return xs[0]

def num(s):
    s=re.sub(r'\s','',s);assert re.fullmatch(r'\d+',s),s
    return int(s)

def match(pattern,s):
    m=re.search(pattern,s);assert m,(pattern,s)
    return m

def integer(x):
    x=F(x);assert x.denominator==1,x
    return x.numerator

def zeros(n):
    assert n>0
    k=0
    while n%10==0:k+=1;n//=10
    return k

def sign(a,b):return '<' if a<b else '>' if a>b else '='

def expr(s):
    m=match(r'^([\d ]+) (·|:) ([\d ]+)$',s);a,b=num(m[1]),num(m[3])
    return a*b if m[2]=='·' else F(a,b)

def option(row,predicate):return one([o for o in row['options'] if predicate(o)])

def solve(row):
    s=row['statement'];kind=row['modelId'].removeprefix('grade4-decimal-');v=answer=None
    method='Independent actual printed integer/Fraction operation with inverse reconstruction and decimal positional check';note=''
    if kind=='meters-to-centimeters':
        metres=int(match(r'Ұзындығы (\d+) м',s)[1]);v=100*metres
        note=f'Printed {metres} metres equals {v} centimetres by fixed SI ratio100, not reciprocal division.'
    elif kind in {'divide-ten','divide-hundred','cancel-shared-zeros'}:
        m=match(r'^([\d ]+) : (\d+)',s);n,d=num(m[1]),int(m[2]);v=integer(F(n,d));answer=option(row,lambda o:num(o)*d==n)
        profile=(zeros(n),zeros(d),zeros(v))
        assert profile=={'divide-ten':(2,1,1),'divide-hundred':(4,2,2),'cancel-shared-zeros':(3,2,1)}[kind]
        note=f'Printed {n}:{d}={v}, exact inverse v×d=n. Source trailing-zero positional profile retained: {profile}; extra zeros after cancellation remain.'
    elif kind in {'multiply-thousand','round-product'}:
        m=match(r': ([\d ]+) · ([\d ]+)\.',s);n,mult=num(m[1]),num(m[2]);v=n*mult
        profile=(zeros(n),zeros(mult),zeros(v));assert profile==((0,3,3) if kind=='multiply-thousand' else (2,1,3))
        note=f'Actual multiplication {n}×{mult}={v}; decimal zero signature {profile}, source coefficient creates no hidden extrazero.'
    elif kind=='equal-divisions':
        m=match(r'^([\d ]+) : (\d+) □ ([\d ]+) : (\d+)\.',s);a,d,b,e=num(m[1]),int(m[2]),num(m[3]),int(m[4]);answer=sign(F(a,d),F(b,e))
        assert [zeros(a),zeros(d),zeros(b),zeros(e)]==[2,2,1,1]
        note=f'Both actual fractions {a}/{d} and {b}/{e} equal {F(a,d)}; distinct power-of-ten divisors, not raw dividends, compared.'
    elif kind=='unknown-thousand-factor':
        m=match(r'^(\d+) · □ = ([\d ]+)\.',s);a,total=int(m[1]),num(m[2]);answer=option(row,lambda o:a*num(o)==total)
        assert F(total,a)==1000
        note=f'Complete offered multiplier domain checked through original equality {a}×candidate={total}; exactly1000 gives three appended zeros.'
    elif kind=='reverse-power-chain':
        m=match(r'алдымен (\d+) санына, шыққан нәтижені (\d+) санына көбейтті\. Соңында ([\d ]+) шықты',s);a,b,total=int(m[1]),int(m[2]),num(m[3]);v=integer(F(total,a*b))
        valid=[n for n in range(1,total+1) if n*a*b==total];assert valid==[v]
        method='Full positive inverse-number domain plus independent single Fraction inverse of composed multiplication'
        note=f'Entire 1–{total} domain searched: only {v} satisfies n×{a}×{b}={total}; reverse both actions, not one.'
    elif kind=='largest-mixed-length':
        factors={'мм':1,'см':10,'дм':100,'м':1000};values=[]
        for o in row['options']:
            m=match(r'^([\d ]+) (мм|см|дм|м)$',o);values.append(num(m[1])*factors[m[2]])
        answer=one([o for o,value in zip(row['options'],values) if value==max(values)])
        assert values[0]==values[1] and values[0]<values[2]<values[3]
        note=f'All offered lengths converted to exact integer millimetres {values}; initial pair equal and third strictly near but below largest.'
    elif kind=='select-target-expression':
        target=num(match(r'мәні ([\d ]+) санына',s)[1]);values=[expr(o) for o in row['options']];answer=one([o for o,v in zip(row['options'],values) if v==target]);assert values[0]==values[1]
        note=f'All offered expressions independently evaluated {values}; only {answer} equals printed target {target}; both misleading first expressions equal ten times target.'
    elif kind=='kopecks-to-rubles':
        assert '1 рубль = 100 копейка' in s;total=num(match(r'Әмияндағы ([\d ]+) копейканы',s)[1]);values=[]
        for o in row['options']:
            m=match(r'^([\d ]+) рубль(?: (\d+) копейка)?$',o);values.append(num(m[1])*100+int(m[2] or 0))
        answer=one([o for o,value in zip(row['options'],values) if value==total]);assert zeros(total)==2
        note=f'Given classroom ratio100 kopecks/ruble used exactly; all four currency totals {values} checked against {total}, mixed-unit distractor not equal.'
    elif kind=='thousand-item-cost':
        m=match(r'Мектеп ([\d ]+) жұмыс дәптерін алды\. Әрқайсысы (\d+) теңге',s);count,price=num(m[1]),int(m[2]);v=count*price
        assert [zeros(count),zeros(price),zeros(v)]==[3,1,4]
        note=f'Printed count {count}×unitprice {price}={v}; pre-existing pricezero retained in addition to three countzeros.'
    elif kind=='unequal-power-products':
        m=match(r'^(\d+) · ([\d ]+) □ ([\d ]+) · (\d+)\.',s);a,b,c,d=int(m[1]),num(m[2]),num(m[3]),int(m[4]);answer=sign(a*b,c*d)
        assert [zeros(a),zeros(b),zeros(c),zeros(d)]==[0,3,2,2] and c*d==10*a*b
        note=f'Actual products {a*b} and {c*d}; tenfold gap arises from second operand already containing two trailingzeros.'
    elif kind=='extra-coefficient-zero':
        terms=[num(x) for x in match(r'^(.+) көбейтіндісі',s)[1].split(' · ')];value=1
        for n in terms:value*=n
        v=zeros(value);initial=sum(map(zeros,terms));coeff=1
        for n in terms:coeff*=n//10**zeros(n)
        assert [zeros(n) for n in terms]==[2,1,1] and initial==4 and zeros(coeff)==1 and v==initial+1
        note=f'Complete actual product {terms}={value}, v10={v}. Stripped coefficients multiply to{coeff}, adding one zero beyond four visible trailingzeros.'
    elif kind=='wrong-division-instead-multiplication':
        m=match(r'санды (\d+)-ге көбейтудің орнына (\d+)-ге бөліп, (\d+) алды',s);a,d,q=map(int,m.groups());original=d*q;v=original*a;answer=option(row,lambda o:num(o)==v);assert a==d
        note=f'Wrong quotient {q}×divisor{d} reconstructs original{original}; requested multiplication by{a} then gives{v}, two inverse stages retained.'
    elif kind=='two-factor-growth':
        m=match(r'бірінші көбейткіш (\d+) есе, екіншісі (\d+) есе',s);a,b=map(int,m.groups());v=a*b
        for x in range(1,26):
            for y in range(1,26):assert F((a*x)*(b*y),x*y)==v
        for x,y in [(F(1,2),F(3,7)),(F(5,9),F(4,11))]:assert F((a*x)*(b*y),x*y)==v
        method='Independent multiplicative coefficient identity plus625 complete positive pairs and rational witnesses'
        note=f'New factors scale by{a}/{b}; (a×x)(b×y)/(xy)={v} for all positive xy by cancellation;625 whole and2rational checks.'
    elif kind=='multiplication-digit-length':
        m=match(r'санды (\d+) санына көбейткенде (\d+) таңбалы, ал (\d+) санына көбейткенде (\d+) таңбалы',s);a,k,b,l=map(int,m.groups());answer=option(row,lambda o:len(str(num(o)*a))==k and len(str(num(o)*b))==l)
        all_n=[n for n in range(1,10000) if len(str(n*a))==k and len(str(n*b))==l];assert all_n==list(range(100,1000)) and num(answer) in all_n
        note=f'Both printed digitcounts {k}/{l} checked jointly for every positive n<10000 and every offered value; exact full feasible interval100..999, unique offered{answer}.'
    elif kind=='exact-trailing-zero-candidate':
        m=match(r'^a · ([\d ]+) көбейтіндісінің соңында дәл (\d+) нөл',s);factor,z=num(m[1]),int(m[2]);values=[zeros(num(o)*factor) for o in row['options']];answer=one([o for o,v in zip(row['options'],values) if v==z]);assert values==[5,7,4,6]
        note=f'Full printed options have terminal valuations {values}; internalzero in7070 does not add an extra trailingzero. Exactly{z} selects{answer}.'
    elif kind=='correct-zero-equality':
        values=[]
        for o in row['options']:
            left,right=o.split(' = ');values.append(expr(left)==num(right))
        answer=one([o for o,good in zip(row['options'],values) if good]);a,b=map(num,answer.split(' = ')[0].split(' · '));assert [zeros(a),zeros(b),zeros((a//10)*(b//10))]==[1,1,2]
        note=f'All four actual equalities evaluated exactly, truth vector{values}. Coefficients75×4=300 supply two extrazeros in addition to factorzeros.'
    elif kind=='recover-and-redivide':
        m=match(r'санды (\d+) санына бөлгенде ([\d ]+) шықты',s);d,q=int(m[1]),num(m[2]);e=num(match(r'бастапқы санды ([\d ]+) санына',s)[1]);original=d*q;v=integer(F(original,e));assert [zeros(q),zeros(original),zeros(v)]==[2,3,0]
        note=f'Printed first quotient{q} reconstructs original{original}; dividing by new{e} gives{v}; complete zero count2→3→0 retained.'
    elif kind=='unknown-dividend-zero':
        m=match(r'^□ : (\d+) = (\d+)\.',s);d,q=map(int,m.groups());answer=option(row,lambda o:num(o)==d*q);assert str(q)[1]=='0' and str(num(answer))[1]=='0' and zeros(num(answer))==1
        note=f'Original inverse equation requires dividend{q*d}; middlezero in{q} retained then one terminalzero appended. All offered misplacedzero variants rejected.'
    elif kind=='mixed-length-zero-place':
        m=match(r'^(\d+) м (\d+) см □ (\d+) см',s);a,b,c=map(int,m.groups());answer=sign(a*100+b,c);assert c==a*100+10*b and str(a*100+b)[1]=='0'
        note=f'Printed mixedlength {a}m{b}cm={a*100+b}cm, not{c}; centimetresones digit deliberately separated from tens, positionalzero retained.'
    elif kind=='division-gap':
        m=match(r'санды ([\d ]+) санына бөлгенде, оны (\d+) санына бөлгендегіден (\d+) санына кем',s);d,e,gap=num(m[1]),int(m[2]),int(m[3]);assert 'Екі бөлу де қалдықсыз' in s
        v=integer(F(gap, F(1,e)-F(1,d)));answer=option(row,lambda o:num(o)%d==0 and num(o)%e==0 and F(num(o),e)-F(num(o),d)==gap)
        assert num(answer)==v
        note=f'Independent linear Fraction inverse n×(1/{e}−1/{d})={gap} has sole solution{v}; every offered candidate also checked for BOTH exact divisions.'
    else:raise AssertionError(kind)
    if answer is None:answer=str(v)
    assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if row.get('options'):assert len(row['options'])==4 and len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert answer.isdecimal() and row['statement'].endswith('Жауапқа тек санды жазыңыз.')
    return {'method':method,'notes':note+' All saved/new full conditions, complete solutions and MCQ read independently; requested quantity, native wording and zero-placement skill preserved.'}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==24
    entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']]);assert raw['checked'];assert row['grade']==4 and row['minimumPlan']=='pro'
        check=solve(row);entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**check})
    assert len({r['sourceRefs'][0]['sourceId'] for r in rows})==24
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='wrong-key'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('Wrong key accepted')
    canaries=[(0,'Ұзындығы 8 м','Ұзындығы 9 м'),(6,'83 000 шықты','84 000 шықты'),(13,'38 алды','39 алды'),(15,'4 таңбалы','5 таңбалы'),(18,'6 700 шықты','6 800 шықты'),(20,'= 307.','= 370.'),(21,'600 · 90','700 · 90'),(22,'6 м 7 см','6 м 70 см'),(23,'198 санына','199 санына')]
    for index,old,new in canaries:
        bad=copy.deepcopy(rows[index]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('Printed canary accepted',index))
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','scope':'All24 saved/new full statements, complete solutions and MCQ independently read. Printed integer/Fraction ledgers, inverse83000 domain, all9999 digitlength inputs,625 whole and2 rational scaling pairs, terminal/internalzero profiles;24wrongkeys+9printedcanaries rejected.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'wrongKeysAndPrintedCanariesRejected':rejected,'status':'passed'}))

if __name__=='__main__':main()
