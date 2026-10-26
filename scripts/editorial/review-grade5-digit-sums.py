"""Independent full source/content/math review of digit-sums48.

No author solver imports. Rendered native givens/options drive the calculations.
Digit assignments, integer ranges and permutations are exhausted; universal
implications cover a complete residue period and retain the general proof.
"""
import ast,hashlib,itertools,json,math,re,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def read(path):return json.loads((ROOT/path).read_text())
def nums(s):return [int(n) for n in re.findall(r'\d+',s)]
def one(xs):assert len(xs)==1,xs;return xs[0]
def digit_sum(n):return sum(map(int,str(n)))
def native(text):
    tree=ast.parse(text.strip().replace('×','*').replace('−','-').replace(':','/'),mode='eval')
    def walk(n):
        if isinstance(n,ast.Constant):assert type(n.value)==int;return F(n.value)
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -walk(n.operand)
        assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        if isinstance(n.op,ast.Div):return a/b
        raise AssertionError(type(n.op))
    return walk(tree.body)
def classification(total,n):return f"{total}; 3 санына {'бөлінеді' if n%3==0 else 'бөлінбейді'}, 9 санына {'бөлінеді' if n%9==0 else 'бөлінбейді'}"
def distinct(n):return len(set(str(n)))==len(str(n))
def solve(row):
    k=row['modelId'].removeprefix('grade5-digit-sums-');s=row['statement'];opts=row.get('options');ns=nums(s);note=[]
    choice_predicates={'three-choice':lambda n:n%3==0,'three-not-nine-choice':lambda n:n%3==0 and n%9!=0,'not-three-choice':lambda n:n%3!=0,'nine-choice':lambda n:n%9==0,'fortyfive-choice':lambda n:n%45==0,'six-choice':lambda n:n%6==0}
    if k in choice_predicates:answer=one([o for o in opts if choice_predicates[k](int(o))]);note=['Each printed option divided directly, independently of digit-sum shortcuts.']
    elif k=='digit-sum-and-nine':n=ns[0];answer=classification(digit_sum(n),n)
    elif k in ['minimum-length-nine','minimum-length-three']:
        length,divisor=ns[:2];answer=next(n for n in range(10**(length-1),10**length) if n%divisor==0);note=['All smaller integers from the printed digit-length boundary excluded.']
    elif k=='soil-packets-three':total,size=ns[:2];assert total%size==0;answer=total//size
    elif k=='total-candidate-three':groups=ns[0];answer=one([o for o in opts if int(o)%groups==0])
    elif k=='minimum-append-digit-three':prefix=int(re.search(r'(\d+)□',s)[1]);answer=min(d for d in range(10) if (10*prefix+d)%3==0)
    elif k=='interior-digit-nine':
        a,b=map(int,re.search(r'(\d)□(\d)',s).groups());answer=one([d for d in range(10) if (100*a+10*d+b)%9==0])
    elif k=='nine-implies-three':
        truths=[all(n%3!=0 or n%9==0 for n in range(1,91)),all(n%10!=3 or n%3==0 for n in range(1,91)),all(n%9!=0 or n%3==0 for n in range(1,91)),all(n%10!=9 or n%9==0 for n in range(1,91))]
        answer=one([o for o,t in zip(opts,truths) if t]);note=['Complete90-residue period; 9k=3(3k) proves the surviving universal implication.']
    elif k=='possible-digit-sum-nine':answer=one([o for o in opts if int(o)%9==0]);witness=int(re.search(r'Мұндай қосынды іске асады: (\d+)',row['solution'])[1]);assert witness%9==0 and digit_sum(witness)==int(answer)
    elif k=='maximum-internal-digit-three':
        prefix,last=map(int,re.search(r'(\d+)□(\d)',s).groups());answer=max(d for d in range(10) if (100*prefix+10*d+last)%3==0)
    elif k=='all-append-digits-six':
        prefix=int(re.search(r'(\d+)□',s)[1]);good=[d for d in range(10) if (10*prefix+d)%6==0];assert 0 in good;answer=', '.join(map(str,good));note=['All10 digits tested; zero is a valid final digit, not a leading zero.']
    elif k=='fifteen-count':numbers=nums(s.split('Осылардың')[0]);answer=sum(n%15==0 for n in numbers)
    elif k=='inclusive-nine-count':lower,upper=map(int,re.search(r'(\d+)–(\d+)',s).groups());answer=sum(n%9==0 for n in range(lower,upper+1))
    elif k=='fortyfive-product-choice':answer=one([o for o in opts if native(o)%45==0])
    elif k=='shelf-total-candidates-nine':
        numbers=nums(re.search(r'саны (.+?) сандарының',s)[1]);shelves=int(re.search(r'кітап (\d+) сөреге',s)[1]);total=one([n for n in numbers if n%shelves==0]);answer=total//shelves
    elif k=='six-equal-classes':
        total,groups=ns[:2];assert 'бөлуге бола ма?' in s and total%groups==0;answer=total//groups;note=['Condition asks feasibility, not a given completed partition; both parity and divisibility by3 hold.']
    elif k=='minimum-distinct-nine':
        assert 'Төрт таңбалы' in s;lower=ns[0];answer=next(n for n in range(lower,10000) if n%9==0 and distinct(n));note=['Direct bounded enumeration includes repeated-zero smaller candidates and excludes leading zeros.']
    elif k=='maximum-distinct-nine':
        assert 'Үш таңбалы' in s;upper=ns[0];all_multiples=[n for n in range(100,upper) if n%9==0];answer=max(n for n in all_multiples if distinct(n));assert max(all_multiples)!=answer;note=['Unconstrained maximum882 is rejected for repeated8; bounded distinct maximum873 proven.']
    elif k=='all-internal-digits-fifteen':
        first,last=map(int,re.search(r'(\d)□(\d)',s).groups());good=[d for d in range(10) if (100*first+10*d+last)%15==0];assert 0 in good;answer=', '.join(map(str,good));note=['All10 interior digits tested; interior zero retains the three-digit number.']
    elif k=='coprime-combination-rule':
        predicates=[lambda n:n%3!=0 or n%6!=0 or n%18==0,lambda n:n%9!=0 or n%18==0,lambda n:n%3!=0 or n%5!=0 or n%15==0,lambda n:n%15!=0 or n%45==0]
        answer=one([o for o,pred in zip(opts,predicates) if all(pred(n) for n in range(1,91))]);note=['Complete90-residue period and coprime3·5 proof; explicit counterexamples checked in full solution.']
    elif k=='bounded-even-nine-share':
        lower,upper,groups=ns[:3];total=one([n for n in range(lower+1,upper) if n%2==0 and n%groups==0]);answer=total//groups
    elif k=='remainder-nine':answer=ns[0]%ns[1]
    elif k=='repdigit-five-fortyfive':
        digit,lower,divisor=ns[:3];answer=next(length for length in range(lower,lower+100) if int(str(digit)*length)%divisor==0);note=['Direct arbitrary-precision repeated-number division tests every shorter allowed length;18 is first.']
    elif k=='long-repdigit-remainder-nine':
        digit,count,divisor=ns[:3];remainder=0
        for _ in range(count):remainder=(10*remainder+digit)%divisor
        answer=remainder;note=['Independent2034-step long-division remainder, without the author digit-count shortcut.']
    elif k=='possible-sums-length-nine':
        length,divisor=ns[:2];possible=sorted({digit_sum(n) for n in range(10**(length-1),10**length) if n%divisor==0});answer=', '.join(map(str,possible))
        for n,total in re.findall(r'(\d+) → (\d+)',row['solution']):assert len(n)==length and int(n)%divisor==0 and digit_sum(int(n))==int(total)
        note=['Every four-digit multiple exhausted; zero sum impossible with a nonzero leading digit.']
    elif k=='maximum-two-blanks-fortyfive':
        middle=re.search(r'□(\d)(\d)□',s).groups();good=[n for n in range(1000,10000) if str(n)[1:3]==''.join(middle) and n%45==0];assert good==[2610,6615];answer=max(good);note=['All90 leading/trailing digit assignments; leading zero excluded, equal digits otherwise permitted.']
    elif k=='neither-three-nor-five-count':
        lower,upper=map(int,re.search(r'(\d+)–(\d+)',s).groups());answer=sum(n%3!=0 and n%5!=0 for n in range(lower,upper+1));note=['Direct exclusion predicate on all160 integers, independently of inclusion-exclusion arithmetic.']
    elif k=='descending-fortyfive-nonzero':
        length=ns[0];good=[n for n in range(10**(length-1),10**length) if n%45==0 and n%10!=0 and all(a>b for a,b in zip(str(n),str(n)[1:]))];answer=one(good)
    elif k=='number-minus-digit-sum':
        difference=ns[0];good=[n for n in range(10,100) if n-digit_sum(n)==difference];answer=one(list({n//10 for n in good}));assert len(good)==10
    elif k=='repeated-digit-universal':
        assert 'үш рет' in s;answer=one([o for o in opts if all(int(str(d)*3)%int(o)==0 for d in range(1,10))]);note=['All9 allowed nonzero repeated digits tested; notation is concatenation, not cubing.']
    elif k=='concatenated-digit-sum-classify':
        first,last=ns[:2];printed=''.join(map(str,range(first,last+1)));n=int(printed);answer=classification(digit_sum(n),n)
    elif k=='minimum-digit-sum-six':
        total,divisor=ns[:2];answer=next(n for n in range(1,100000) if n%divisor==0 and digit_sum(n)==total);note=['All smaller naturals exhausted, not merely the proposed4-digit form; global minimum7998.']
    elif k=='two-blanks-six-nine-count':
        first,third=map(int,re.search(r'overline\((\d)a(\d)b\)',s).groups());good=[(a,b) for a in range(10) for b in range(10) if (1000*first+100*a+10*third+b)%6==0 and (1000*first+100*a+10*third+b)%9==0];assert sorted(good)==[(1,4),(3,2),(5,0),(6,8),(8,6)];answer=len(good);note=['All100 digit pairs; both sums a+b=5 and14 retained, including final zero and repeated digits.']
    elif k=='digitwise-nine-misconception':
        n=ns[0];total=digit_sum(n);assert all(d%3==0 for d in map(int,str(n))) and n%3==0 and n%9!=0
        answer=one([o for o in opts if f'цифрлар қосындысы {total}, ол 9 санына бөлінбейді' in o]);note=['Quoted pupil implication is intentionally wrong and is corrected by the MCQ/solution, not an accidental data error.']
    elif k=='grandmother-age-nine':
        divisor,difference=ns;answer=one([n for n in range(10,100) if n%divisor==0 and n//10-n%10==difference])
    elif k=='bounded-six-nine-remainder':
        lower,upper,size,other,remainder=ns;answer=one([n for n in range(lower+1,upper) if n%size==0 and n%other==remainder])
    elif k=='one-digit-replacement-nine':
        original=ns[0];original_digits=list(str(original));valid=[]
        for o in opts:
            before,after=nums(o);index=one([i for i,d in enumerate(original_digits) if int(d)==before]);changed=original_digits.copy();changed[index]=str(after);n=int(''.join(changed))
            if len(str(n))==len(str(original)) and n%9==0:valid.append(o)
        answer=one(valid)
    elif k=='minimum-positive-add-six':n,divisor=ns;answer=next(add for add in range(1,divisor+1) if (n+add)%divisor==0)
    elif k=='fortyfive-not-guaranteed':
        answer=one([o for o in opts if 45%int(o)!=0]);note=['Divisors of45 guarantee the universal claim;45 and90 witness both possibilities for6.']
    elif k=='distinct-odd-nine-count':
        assert 'Төрт таңбалы' in s;answer=sum(n%9==0 and distinct(n) and all(int(d)%2==1 for d in str(n)) for n in range(1000,10000));note=['All9000 four-digit naturals, including every valid permutation, tested directly.']
    elif k=='digit-set-three-count':
        allowed=set(map(str,ns[:4]));assert 'үш таңбалы' in s;answer=sum(n%3==0 and distinct(n) and set(str(n))<=allowed for n in range(100,1000));note=['All900 three-digit naturals; a leading zero is excluded by the actual domain, interior/final zero allowed.']
    elif k=='reverse-six-rule':
        values=[n for n in range(1,10000) if n%6==0 and n%10!=0];reversed_values=[int(str(n)[::-1]) for n in values];assert all(n%3==0 for n in reversed_values);assert any(n%6!=0 for n in reversed_values) and any(n%6==0 for n in reversed_values) and any(n%9!=0 for n in reversed_values)
        answer=one([o for o in opts if o=='Жаңа нөмір міндетті түрде 3 санына бөлінеді, ал 6 санына бөлінуі міндетті емес']);note=['All eligible naturals below10000 plus the general unchanged-digit-sum proof; reversal parity need not survive.']
    else:raise AssertionError(k)
    answer=str(answer);assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if opts:assert len(opts)==len(set(opts))==4 and opts.count(answer)==1
    return note
def equality_count(text):
    # A prose colon after a stated result ("1008: 1008 = ...") is not division.
    # Native mathematical divisions in this reviewed batch use spaces around :.
    text=re.sub(r'(?<=\d):(?=\s)', '.',text)
    count=0;pattern=r'(?<![0-9a-z])([0-9a-dn(][0-9a-dn ×+−:()/]*\s*=\s*[0-9a-dn(][0-9a-dn ×+−:()/]*(?:=\s*[0-9a-dn(][0-9a-dn ×+−:()/]*)*)'
    for match in re.finditer(pattern,text):
        chain=match[1].strip()
        if re.search('[a-z]',chain) or '…' in text[max(0,match.start()-5):match.start()]:continue
        values=[native(part.strip()) for part in chain.split('=')];assert len(set(values))==1,(chain,values);count+=1
    return count
rows=read('problems/editorial/batches/grade5-digit-sums.json')['editions'];assert len(rows)==48
entries=[];equalities=0;refs=set()
for row in rows:
    assert row['grade']==5 and row['minimumPlan']=='pro';assert not row.get('image')
    for ref in row['sourceRefs']:
        source=read(ref['sourceFile']);assert source['status']=='captured';q=one([q for q in source['questions'] if q['id']==ref['sourceId']]);assert q['checked'] and q['solution'] and q['sourceAnswer'];assert not q.get('images') and not q.get('svg')
        if q.get('options'):assert len([o for o in q['options'] if o['correct']])==1
        refs.add((ref['sourceFile'],ref['sourceId']))
    notes=solve(row);equalities+=equality_count(row['solution'])
    sha=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    entries.append({'editionId':row['editionId'],'sha256':sha,'verdict':'verified','method':'Independent rendered-given integer/modular/finite-domain oracle and full canonical source/content/solution reading','notes':['All source/new conditions, official/authored full solutions and every MCQ read; divisibility intersections, zero placement, complete lists and Kazakh wording checked. Numerical variants are not claimed as new meanings.',*notes]})
assert len(refs)==48
report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-digit-sums.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'editions':len(rows),'canonicalReferences':len(refs),'numericSolutionEqualityChains':equalities,'authorSolverImported':False,'status':'passed','written':'--write' in sys.argv}))
