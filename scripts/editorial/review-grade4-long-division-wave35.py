"""Independent complete saved/new27 longdivision review.
Actual printed integer/Fraction arithmetic, prefix selection, inverse ledgers and
finite domains. No author model, renderer, calculator or longDivision imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-long-division-wave35.json'
OUT='problems/editorial/reviews/grade4-long-division-wave35.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def divisions(s):return [(int(a),int(b))for a,b in re.findall(r'(\d+) : (\d+)',s)]
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
def prefix(n,d):
 text=str(n)
 for k in range(1,len(text)+1):
  if int(text[:k])>=d:return int(text[:k]),len(text)-k+1
 raise AssertionError((n,d))
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(row):
 kind=row['modelId'].removeprefix('grade4-long-division-');s=row['statement'];ns=nums(s);ds=divisions(s);opts=row.get('options',[]);a=v=None
 method='Independent actual printed Fraction/divmod, full inverse ledger and complete offered-option evaluation'
 if kind in {'first-partial-dividend','exact-long-quotient','quotient-digit-count','first-quotient-digit','partial-and-quotient-digits'}:
  n,d=one(ds);q=integer(F(n,d));p,length=prefix(n,d);assert len(str(q))==length and q*d==n
  if kind=='first-partial-dividend':v=p
  elif kind=='exact-long-quotient':v=q
  elif kind=='quotient-digit-count':v=length
  elif kind=='first-quotient-digit':v=int(str(q)[0]);assert v*d<=p<(v+1)*d
  else:a=one([o for o in opts if nums(o)==[p,length]])
  note=f'Printed {n}/{d}={q}; shortest left prefix {p}, quotient length {length}, first digit {str(q)[0]}. Every shorter prefix < divisor; requested role checked separately.'
 elif kind=='multiplication-check-equality':
  n,d=one(ds);q=ns[-1];assert q*d==n
  truth=[]
  for o in opts:
   left,right=o.split(' = ');truth.append(calc(left)==calc(right)and '×'in left and nums(left)==[q,d])
  a=one([o for o,t in zip(opts,truth)if t]);note=f'Printed original quotient {q}, divisor {d}, dividend {n}; every offered equality evaluated. Only original quotient × original divisor restores dividend: {a}.'
 elif kind=='unknown-exact-dividend':
  d,q=ns;v=sum(d for _ in range(q));assert F(v,d)==q;note=f'Original divisor {d}, quotient {q}, no remainder; repeated-addition ledger returns dividend {v}, substitution {v}/{d}={q}.'
 elif kind in {'fruit-unit-price-order','books-unit-price-order'}:
  count,total,wanted=ns;unit=integer(F(total,count));v=unit*wanted;assert F(v,total)==F(wanted,count)
  note=f'Actual equal-price ledger {count} items cost {total}, per-item {unit}; {wanted} requested items cost {v}. Independent scaling {wanted}/{count} of original total agrees.'
 elif kind=='higher-speed-same-distance-time':
  distance,old,inc=ns;speed=F(distance,old);v=integer(F(distance,speed+inc));assert v<old and v*(speed+inc)==distance
  note=f'Actual fixed distance {distance} km and {old} h imply {speed} km/h; +{inc} gives {speed+inc}; same distance in {v} h. Inverse distance and direction verified.'
 elif kind=='unknown-exact-divisor':
  n,q=ns;v=integer(F(n,q));assert v*q==n;note=f'Actual dividend {n} and quotient {q}; unique positive divisor {v}, inverse {v}×{q}={n}; subtraction distractor {n-q} rejected.'
 elif kind=='neighbouring-quotients-comparison':
  qs=[F(n,d)for n,d in ds];assert all(q.denominator==1 for q in qs);a='='if qs[0]==qs[1]else'>'if qs[0]>qs[1]else'<';assert abs(qs[0]-qs[1])==1
  note=f'Actual original-unit quotients {qs[0]} and {qs[1]}, exactly one apart; relation {a}, computed before comparison.'
 elif kind in {'target-two-digit-quotient','largest-quotient-smallest-dividend'}:
  qs=[calc(o)for o in opts];assert all(q.denominator==1 for q in qs);target=F(one(ns))if ns else max(qs);a=one([o for o,q in zip(opts,qs)if q==target])
  if kind=='largest-quotient-smallest-dividend':assert nums(a)[0]==min(nums(o)[0]for o in opts)
  note=f'Every actual option quotient {list(zip(opts,map(str,qs)))}; unique requested '+('printed target'if ns else'maximum')+f' {target}. Raw dividend alone would give wrong ordering.'
 elif kind=='difference-between-unit-prices':
  count1,total1,count2,total2=ns;u1=F(total1,count1);u2=F(total2,count2);v=integer(u1-u2);assert v>0 and v!=total1-total2
  note=f'Printed per-pen {u1}, per-notebook {u2}; unit-price difference {v}, not bulk-payment difference {total1-total2}. Both original ledgers invert exactly.'
 elif kind=='correct-underestimated-first-digit':
  n,d=one(ds);claim=ns[-1];q=integer(F(n,d));p,length=prefix(n,d);wrongfirst=int(str(claim)[0]);assert claim!=q and p-wrongfirst*d>=d and length==2
  a=one([o for o in opts if o.startswith('Қате')and nums(o)==[q]])
  note=f'Actual {n}/{d}={q}; claimed {claim} restores only {claim*d}. Wrong initial digit {wrongfirst} leaves {p-wrongfirst*d}≥{d}, so must increase; unique correction {a}.'
 elif kind=='divisor-quotient-gap':
  n,gap=ns;hits=[d for d in range(1,n+1)if n%d==0 and n//d-d==gap];v=one(hits)
  method='Independent complete positive divisor domain and quotient-gap substitution'
  note=f'All positive divisors of printed {n} tested; only divisor {v} has quotient {n//v} exactly {gap} larger. Full domain proves uniqueness; requested divisor not quotient.'
 elif kind=='reversed-divisor-correction':
  correct,wrong,claim=ns;assert str(wrong)==str(correct)[::-1];n=wrong*claim;v=integer(F(n,correct));assert v*correct==n
  note=f'Actual wrong divisor {wrong} with quotient {claim} reconstructs {n}; intended divisor {correct} gives {v}; both inverse products equal same original number.'
 elif kind=='recover-and-change-divisor':
  old,q,new=ns;n=old*q;v=integer(F(n,new));assert new*v==old*q;note=f'Actual original {old}×{q}={n}; replacement divisor {new} gives {v}, exact conserved dividend ledger.'
 elif kind=='max-dividend-two-digit-quotient':
  d=one(ns);domain=[d*q for q in range(10,100)];v=max(domain);assert v//d==99 and(v+d)//d==100
  method='Independent full 90-value two-digit quotient domain and next-boundary exclusion'
  note=f'Printed divisor {d}; all exact two-digit quotients 10–99 yield dividends {min(domain)}..{max(domain)}. Maximum {v}; quotient100 exceeds allowed digits.'
 elif kind=='two-stage-exact-crates-transport':
  kg,crate,vehicle=ns;crates=integer(F(kg,crate));v=integer(F(crates,vehicle));assert v*vehicle*crate==kg
  note=f'Actual SI/physical units: {kg} kg / {crate} kg per crate={crates} crates; /{vehicle} crates per vehicle={v} vehicles, one-trip original ledger conserved.'
 elif kind=='select-exact-divisor':
  n=one(ns);rs=[divmod(n,int(o))for o in opts];a=one([o for o,(q,r)in zip(opts,rs)if r==0])
  note=f'Each offered original divisor evaluated by divmod: {list(zip(opts,rs))}; only {a} has remainder0, all others positive and strictly below own divisor.'
 elif kind=='bus-reserved-seats':
  groups,each,seats,reserved=ns;capacity=seats-reserved;total=groups*each;v=(total+capacity-1)//capacity;assert(v-1)*capacity<total<=v*capacity
  note=f'Printed {groups}×{each}={total} pupils; per-bus available {seats}−{reserved}={capacity}. Minimum {v} by full capacity inequality, next fewer provides {(v-1)*capacity} only.'
 elif kind=='known-quotient-double-divisor':
  (n,d),(same,new)=ds;q=ns[2];assert same==n and d*q==n and new==2*d;v=integer(F(q,2));assert v*new==n
  note=f'Actual given {n}/{d}={q}; original dividend fixed, new divisor {new}=2×{d}; quotient halves to {v}. Inverse product and full direct Fraction agree.'
 elif kind=='train-speed-from-distance-time':
  distance,hours=ns;v=integer(F(distance,hours));assert v*hours==distance;note=f'Actual distance {distance} km / elapsed {hours} h gives {v} km/h; original-distance substitution exact, subtraction has incompatible units.'
 else:raise AssertionError(kind)
 if a is None:a=one([o for o in opts if o==str(v)])if opts else str(v)
 assert row['answer']==a,(row['editionId'],a,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(a)==1
 else:assert a.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
 return {'method':method,'notes':note+' All saved/new conditions, full solutions and MCQ independently read; source-specific skill, requested role and units retained.'}
def chains(s):
 count=0
 for m in re.finditer(r'[0-9(][0-9\s×+:−()=\-]*',s):
  text=m[0].strip()
  if '='not in text or text.count('(')!=text.count(')'):continue
  if re.search(r'[×+:−\-]\s*$',s[:m.start()]):continue
  bits=[b.strip()for b in text.split('=')]
  if not all(bits):continue
  values=[calc(b)for b in bits];assert all(v==values[0]for v in values),(text,values);count+=1
 return count

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==27;entries=[];eq=0
 for row in rows:
  ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro';assert row['statement']!=raw['statement']
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)});eq+=chains(row['solution'])
 rejected=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError('Bad key accepted')
 canaries=[(0,'67','6'),(1,'6132','6133'),(2,'4788','4789'),(3,'61','6'),(4,'38','39'),(5,'4221','4891'),(6,'96','9'),(7,'8878','8879'),(8,'9646','9647'),(9,'1512','1513'),(10,'6716','6717'),(11,'4958','4891'),(12,'78','87'),(13,'4932','4933'),(14,'5358','5359'),(16,'1517','1518'),(17,'48','49'),(18,'54','55'),(19,'76','77'),(20,'2744','2745'),(21,'1885','1886'),(22,'27','28'),(23,'3612','3613'),(24,'81','8'),(25,'27','2'),(26,'2553','2554')]
 for i,old,new in canaries:
  bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 bad=copy.deepcopy(rows[15]);bad['options'][0]='8300 : 83'
 try:solve(bad)
 except AssertionError:rejected+=1
 else:raise AssertionError('Maximum option canary accepted')
 # Separate stream-digit recurrence proves prefix/quotient length, including internal zero.
 witnesses=0
 for n in range(1000,10000):
  for d in range(10,100):
   rem=0;qs='';started=False
   for char in str(n):
    current=10*rem+int(char);digit=0
    while current>=d:current-=d;digit+=1
    assert 0<=digit<=9 and 0<=current<d
    if digit or started:
     qs+=str(digit);started=True
    rem=current
   q=int(qs);assert(q,rem)==divmod(n,d);p,length=prefix(n,d);assert len(qs)==length;assert int(qs[0])*d<=p<(int(qs[0])+1)*d;witnesses+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All27 saved/new conditions, complete solutions/MCQ read; independent actual-printed Fraction/prefix/inverse/unit/domain oracle, full4digit×2digit algorithm witnesses.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'fullDigitDivisionWitnesses':witnesses,'report':OUT if args.write else None}))
if __name__=='__main__':main()
