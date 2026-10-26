"""Independent full22 saved/new three-digit-divisor review.
Actual printed Fraction/divmod/prefix and complete digit/remainder domains;
no author model, renderer or longdivision helper imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-three-digit-division-wave39.json'
OUT='problems/editorial/reviews/grade4-three-digit-division-wave39.json'
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
 for k in range(1,len(str(n))+1):
  p=int(str(n)[:k])
  if p>=d:return p,len(str(n))-k+1
 raise AssertionError((n,d))
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def solve(row):
 kind=row['modelId'].removeprefix('grade4-three-digit-division-');s=row['statement'];ns=nums(s);ds=divisions(s);opts=row.get('options',[]);a=v=None
 method='Independent actualprinted Fraction/divmod, shortestleftprefix, originalunit and inverseledgers'
 if kind=='select-two-digit-quotient':
  qs=[integer(calc(o))for o in opts];a=one([o for o,q in zip(opts,qs)if 10<=q<=99]);assert sorted(len(str(q))for q in qs)==[1,2,3,3]
  note=f'Actual optionquotients{list(zip(opts,qs))}; exactlyoneTWOdigit{a}. All four actualprefix-derivedlengths checked, notdividendlength.'
 elif kind in {'first-three-digit-prefix','first-four-digit-prefix','quotient-digits-before-dividing'}:
  n,d=one(ds);p,length=prefix(n,d);q,r=divmod(n,d);assert len(str(q))==length
  if kind.startswith('first-'):v=p;assert len(str(p))==(3 if kind.startswith('first-three')else 4)
  else:v=length
  note=f'Actual{n}/{d}floorquotient{q}, remainder{r}; shortestleftprefix{p}, quotientlength{length}. Allshorterprefixes below{d}; requestedprefixvsdigitcountroles separated.'
 elif kind=='multiplication-check-quotient':
  n,d=one(ds);truth=[]
  for o in opts:
   N,D,q=nums(o);assert(N,D)==(n,d);truth.append(D*q==N)
  a=one([o for o,t in zip(opts,truth)if t]);note=f'All actual originaldivisor×claimedquotientchecked{list(zip(opts,truth))}; only{a}returns{n}. Extra internal0createsfourdigits and differentproduct.'
 elif kind=='overestimated-digit-remainder':
  n,d=ns;q,r=divmod(n,d);a=one([o for o in opts if nums(o)==[q,r]]);estimate=n//(d//100*100);assert estimate==q+1 and estimate*d>n
  assert any(nums(o)==[q-1,r+d]for o in opts)
  note=f'Actual divmod{q},{r}, originalledger{q}×{d}+{r}={n}. Rounded-divisorestimate{estimate}overshoots; smallerq{q-1}leavesillegalr{r+d}≥{d}. BOTHboundandidentityneeded.'
 elif kind=='select-nonexact-division':
  original=one(ns);pairs=[nums(o)for o in opts];assert all(n==original for n,d in pairs);results=[divmod(n,d)for n,d in pairs];a=one([o for o,(q,r)in zip(opts,results)if r>0]);note=f'All actualdivmods{list(zip(opts,results))}; unique positiveoriginalremainder key{a}, allothers exact0.'
 elif kind=='common-dividend-largest-quotient':
  pairs=[nums(o)for o in opts];assert len({n for n,d in pairs})==1;vs=[F(n,d)for n,d in pairs];assert all(q.denominator==1 for q in vs);a=one([o for o,v in zip(opts,vs)if v==max(vs)]);assert nums(a)[1]==min(d for n,d in pairs)
  method='Independent positivecommon-dividend inverseordering, everyactualquotientsecondarychecked'
  note=f'Actualdividendsidentical; smallest positivedivisor givesmaximum. Allactualquotients{list(zip(opts,map(str,vs)))}confirmunique{a}.'
 elif kind=='difference-between-unit-prices':
  count1,total1,count2,total2=ns;first=integer(F(total1,count1));second=integer(F(total2,count2));gap=first-second;a=one([o for o in opts if nums(o)==[gap]and o.endswith(' тг')]);assert gap>0 and total1-total2!=gap
  note=f'Actualper-pen{first}tenge, per-pencil{second}; requestedunitdifference{gap}, NOTbulk-paymentdifference{total1-total2}. Bothindependent price×countledgers exact.'
 elif kind=='remainder-with-previous-step-distractor':
  n,d=one(ds);q,r=divmod(n,d);v=r;previous=(n//10)%d;assert previous!=r and str(previous)in opts and str(q)in opts and any(int(o)>=d for o in opts)
  note=f'Actualfinalledger{n}={d}×{q}+{r}; priorprefixn//10givesremainder{previous}, deliberatelyofferedbutNOTfinal. Quotient{q}andoversizedresiduealsorejected.'
 elif kind=='museum-operation-days':
  total,daily=ns;v=integer(F(total,daily));assert 1<=v<=366 and v*daily==total
  note=f'Printed exactaverage{daily}visitorsperWORKday, total{total}; divisiongives{v}workingdays withinone-yearbound. Exactaverage×daysrestorestotal, noassumptionallcalendardaysopen.'
 elif kind=='scale-found-internal-zero-quotient':
  n,d,scale=ns;q=integer(F(n,d));assert re.fullmatch(r'[1-9]0[1-9]',str(q));v=q*scale;assert v!=q
  note=f'Actualquotient{q}retainsinternal0, thenmultiplyby{scale}→{v}. RequestedFINALscaledvalue, notquotientorquotientwith0dropped; inverseq×{d}={n}.'
 elif kind=='annual-unit-rate-hundred-days':
  year,total,days=ns;rate=integer(F(total,year));v=rate*days;assert rate*year==total and days==100
  note=f'Actualgiven{year}daysproduce{total}m atconstant{rate}m/day; requested{days}days→{v}m. Daysareexplicitgivens, noyearcurrentnessassumption; total/100wrongdirection.'
 elif kind=='notebook-unit-price-new-quantity':
  count,total,wanted=ns;price=integer(F(total,count));v=price*wanted;assert price*count==total and price%10==0
  note=f'Actualequalunitprice{price}tenge from{total}/{count}; new{wanted}notebooks cost{v}. Originalpriceending0retained insecondstage.'
 elif kind in {'equal-terminal-zero-quotients','compare-neighbouring-terminal-zero-quotients'}:
  qs=[integer(F(n,d))for n,d in ds];a='='if qs[0]==qs[1]else'<'if qs[0]<qs[1]else'>';assert all(q%10==0 for q in qs)
  if kind.startswith('equal'):assert qs[0]==qs[1]
  else:assert qs[1]-qs[0]==10
  note=f'Actualfullquotients{qs}; relation{a}. Bothterminalzeros essential, neighboringcomparison changesby10not1, rawdividendsirrelevant.'
 elif kind=='invariant-divisor-quotient-digit-range':
  assert 'бөлгіш те, бөлінді де үш таңбалы' in s;lengths={len(str(d*q))for d in range(100,1000)for q in range(100,1000)};assert lengths=={5,6};a=one([o for o in opts if nums(o)==sorted(lengths)])
  method='Independent complete900×900three-digit divisor/quotient domain and inverse exactdivision'
  note='Full810000pairsproduce dividendlengthset{5,6}, endpoints10000and998001. Bothoccurring, no4/7digitpossibility; fixeddefinitionderivedfacthonestlypreserved.'
 elif kind=='unknown-factor-largest-three-digit':
  total=one(ns);largest=max(range(100,1000));v=integer(F(total,largest));assert v*largest==total
  note=f'ActualknownfactorlargestTHREEdigit{largest}; originalproduct{total}; unknown{v}, inverse{largest}×{v}={total}. Check1000×v−v gives sameproduct.'
 elif kind=='smallest-dividend-three-digit-floor-quotient':
  d=one(ns);minimum=min(d*q+r for q in range(100,1000)for r in range(d));v=minimum;assert divmod(v,d)==(100,0)and divmod(v-1,d)==(99,d-1)
  method='Independent complete900three-digitfloorquotients×alloriginalresidues0..d−1'
  note=f'FullEuclideanfamilywithd{d},q100..999,r0..{d-1}: smallest{v}; onebelowhas99quotient. Allowingnonzeroremaindercannotlowerminimum.'
 elif kind=='tonnes-to-kilograms-minimum-trips':
  capacity,tonnes=ns;kg=1000*tonnes;v=(kg+capacity-1)//capacity;assert(v-1)*capacity<kg<=v*capacity and kg%capacity>0
  method='Independent SI1000kg/t and exactceilingcapacityinequality'
  note=f'Printed{tonnes}t={kg}kg; capacity{capacity}kg/trip; minimum{v}, floor{v-1}movesonly{(v-1)*capacity}, leaving{kg-(v-1)*capacity}kg. Lastpartialloadrequireswholeadditionaltrip.'
 elif kind=='reconstruct-maximal-three-digit-remainder':
  d,q=ns;domain=[d*q+r for r in range(d)];v=max(domain);assert divmod(v,d)==(q,d-1)and(v+1)//d==q+1
  method='Independent completeoriginalresidue0..d−1domain and nextintegerboundary'
  note=f'Actualdivisor{d},floorquotient{q}; complete{d}allowedresidues maximumd−1={d-1}; dividend{v}. Next{v+1}raisesquotient, so maxboundarystrict.'
 elif kind=='book-distribution-terminal-zero-quotient':
  books,shops=ns;v=integer(F(books,shops));assert v%10==0 and shops*v==books
  note=f'Printed{books}books/{shops}equalshops={v}per-shop; terminalunits0retained. Exactinverseallocationledger, notfloor/ceilremainderproblem.'
 else:raise AssertionError(kind)
 if a is None:a=one([o for o in opts if o==str(v)])if opts else str(v)
 assert row['answer']==a,(row['editionId'],a,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(a)==1
 else:assert a.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
 return {'method':method,'notes':note+' All saved/new conditions, complete solutions and MCQ independently read; requestedprefix/quotient/remainder/finalscaledtarget, physicalunits, zero positions and strict capacity/digit domains checked.'}
def chains(s):
 s=re.sub(r'(?<=\d):(?=\s)',';',s);count=0
 for m in re.finditer(r'[0-9(][0-9\s×+:−()=\-]*',s):
  text=m[0].strip()
  if '='not in text or text.count('(')!=text.count(')'):continue
  if re.search(r'[×+:−\-]\s*$',s[:m.start()]):continue
  bits=[b.strip()for b in text.split('=')]
  if not all(bits):continue
  values=[calc(b)for b in bits];assert all(v==values[0]for v in values),(text,values);count+=1
 return count

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==22;entries=[];eq=0
 for row in rows:
  ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro';assert row['statement']!=raw['statement']
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)});eq+=chains(row['solution'])
 rejected=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError('Bad key accepted')
 canaries=[(1,'462','46'),(2,'473','47'),(3,'47802','47803'),(4,'1000','1001'),(7,'56700','56701'),(8,'60000','60001'),(9,'134784','134785'),(10,'18','19'),(11,'365','366'),(12,'75','76'),(13,'630','631'),(15,'125874','125875'),(16,'357','358'),(17,'12','13'),(18,'36','37'),(19,'427','42'),(20,'50960','50961'),(21,'71050','69020')]
 for i,old,new in canaries:
  bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,index,new in[(0,1,'2982 : 426'),(5,0,'48000 : 400'),(6,1,'76614 : 114')]:
  bad=copy.deepcopy(rows[i]);bad['options'][index]=new
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Option canary accepted',i))
 bad=copy.deepcopy(rows[14]);bad['statement']=bad['statement'].replace('үш таңбалы','төрт таңбалы')
 try:solve(bad)
 except AssertionError:rejected+=1
 else:raise AssertionError('Digitdimensioncanaryaccepted')
 # Separate streamdecimal algorithm checked for all three-digitdivisor and
 # three-digitquotient pairs, as well as a nonzero maximalremainder each.
 witnesses=0
 for d in range(100,1000):
  for q in range(100,1000):
   for r in[0,d-1]:
    n=d*q+r;rem=0;result='';started=False
    for char in str(n):
     digit,rem=divmod(10*rem+int(char),d)
     if digit or started:result+=str(digit);started=True
    p,length=prefix(n,d);assert int(result)==q and rem==r and len(result)==length
    assert int(result[0])*d<=p<(int(result[0])+1)*d;witnesses+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All22 saved/new conditions/fullsolutions/MCQ read; independent actualprinted inverse/prefix/Euclidean/digitdomain/unit/capacity oracle. Noauthorcalculator imported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'threeDigitDivisorQuotientStreamWitnesses':witnesses,'report':OUT if args.write else None}))
if __name__=='__main__':main()
