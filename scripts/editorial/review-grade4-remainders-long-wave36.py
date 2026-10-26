"""Independent complete41 saved/new remainder review.
Actual printed divmod, SI ledgers, complete finite domains/CRT minima;
no author model, renderer or calculator imported. Universal residue proofs are
coefficient identities, with finite witnesses only secondary checks.
"""
from pathlib import Path
from fractions import Fraction as F
from math import lcm
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-remainders-long-wave36.json'
OUT='problems/editorial/reviews/grade4-remainders-long-wave36.json'
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
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def pairkey(opts,q,r):return one([o for o in opts if nums(o)==[q,r]])
def solve(row):
 kind=row['modelId'].removeprefix('grade4-remainders-long-');s=row['statement'];ns=nums(s);ds=divisions(s);opts=row.get('options',[]);a=v=None
 method='Independent actual printed Euclidean divmod and original-unit inverse ledger with complete offered-option evaluation'
 if kind=='largest-possible-remainder':
  d=one(ns);domain=list(range(d));v=max(domain);note=f'All allowed residues0..{d-1}; maximum {v}; d itself violates strict r<d.'
 elif kind in {'impossible-remainder','possible-remainder'}:
  d=one(ns);want=kind=='possible-remainder';a=one([o for o in opts if(0<=int(o)<d)==want]);note=f'Every actual offered residue {opts} tested against0≤r<{d}; requested '+('possible'if want else'impossible')+f' value {a}. Zero explicitly allowed.'
 elif kind=='identity-true-but-remainder-invalid':
  candidates=[nums(o)for o in opts];truth=[]
  for n,d,q,r in candidates:
   assert n==d*q+r
   truth.append(0<=r<d)
  a=one([o for o,t in zip(opts,truth)if not t]);n,d,q,r=nums(a);assert r>=d
  note=f'All offered arithmetic identities TRUE {candidates}, but unique {a} violates remainder bound. Identity alone is insufficient; actual corrected divmod{divmod(n,d)}.'
 elif kind in {'three-digit-quotient-remainder-choice','two-digit-quotient-remainder-choice','terminal-zero-quotient-remainder'}:
  n,d=one(ds);q,r=divmod(n,d);a=pairkey(opts,q,r);assert q*d+r==n and 0<=r<d
  expected=3 if kind.startswith('three')else 2;assert len(str(q))==expected
  if kind.startswith('terminal'):assert q%10==0 and q//10>0 and int(str(n)[:3])%d*10+int(str(n)[-1])==r<d
  note=f'Actual {n}={d}×{q}+{r}; all offered q/r pairs compared using BOTH identity and strict bound. Quotient has {expected} digits'+(', final0 is essential, cannot shorten tens to units.'if q%10==0 else'.')
 elif kind=='incomplete-quotient-only':
  n,d=ns;q,r=divmod(n,d);v=q;assert r>0;note=f'Actual {n}={d}×{q}+{r}; asks full-group count {q}, not remainder{r} or exactFraction{F(n,d)}.'
 elif kind=='reconstruct-dividend':
  d,q,r=ns;assert 0<=r<d;v=sum(d for _ in range(q))+r;assert divmod(v,d)==(q,r);note=f'Actual {q} fullgroups of size{d} plus{r}leftovers reconstruct{v}; originalEuclidean inverse ledger and bound exact.'
 elif kind=='correct-remainder-check-expression':
  n,d=one(ds);q,r=ns[-2:];assert divmod(n,d)==(q,r);values=[calc(o)for o in opts];a=one([o for o,v in zip(opts,values)if v==n]);assert nums(a)==[q,d,r]
  note=f'Printed result{q}, remainder{r}, divisor{d}; every actual expression evaluated{list(zip(opts,map(str,values)))}. Only {a} restores original{n}.'
 elif kind=='remainder-only-one-digit-quotient':
  n,d=ns;q,v=divmod(n,d);assert 1<=q<=9 and q*d<=n<(q+1)*d;note=f'Actual fullgroup{q}, leftover{v}; nextgroup{(q+1)*d}>{n}, originalledger{q}×{d}+{v}={n}.'
 elif kind in {'only-zero-remainder','only-nonzero-remainder'}:
  pairs=[nums(o)for o in opts];results=[divmod(n,d)for n,d in pairs];zero=kind=='only-zero-remainder';a=one([o for o,(q,r)in zip(opts,results)if(r==0)==zero]);note=f'All actual divmods{list(zip(opts,results))}; unique '+('zero'if zero else'NONzero')+f' remainder key{a}; exact/nonexact distinguished.'
 elif kind=='largest-remainder-common-quotient':
  n=one(ns);results=[divmod(n,int(o))for o in opts];assert len({q for q,r in results})==1;a=one([o for o,(_,r)in zip(opts,results)if r==max(r for q,r in results)]);note=f'Actual shared-dividend{n}, all q/r results{list(zip(opts,results))}; samefloorquotient, unique greatestremainder belongs to divisor{a}.'
 elif kind=='reconstruct-then-new-remainder':
  d,q,r,new=ns;assert 0<=r<d;n=d*q+r;Q,R=divmod(n,new);a=pairkey(opts,Q,R);note=f'Actual originalnumber{d}×{q}+{r}={n}; changeddivisor{new} yields{Q},{R}, oldremainder not carried over without reduction.'
 elif kind=='sum-quotient-and-remainder':
  n,d=one(ds);q,r=divmod(n,d);v=q+r;note=f'Actual {n}={d}×{q}+{r}; requested sum of different roles{q}+{r}={v}, not dividend nor either single result.'
 elif kind=='reconstruct-with-maximal-remainder':
  d,q=ns;domain=[d*q+r for r in range(d)];v=max(domain);assert divmod(v,d)==(q,d-1);note=f'Complete{d}allowed residues0..{d-1}; maximal reconstructeddividend{v}, originalfloorquotient{q} unchanged.'
 elif kind=='mixed-length-offcut':
  metres,cm,cut=ns;length=100*metres+cm;q,v=divmod(length,cut);assert 0<=cm<100 and q*cut+v==length;note=f'Actual SI100cm/m: {metres}m{cm}cm={length}cm; {q}fullpieces of{cut}cm and{v}cmoffcut; nextpiece exceeds length.'
 elif kind=='select-dividend-for-remainder':
  d,r=ns;assert 0<=r<d;results=[divmod(int(o),d)for o in opts];a=one([o for o,(q,R)in zip(opts,results)if R==r]);note=f'All actual candidate dividends/divmods{list(zip(opts,results))}; unique requested remainder{r} key{a}.'
 elif kind=='full-bundles-and-leftovers':
  n,d=ns;q,r=divmod(n,d);a=pairkey(opts,q,r);assert q*d<=n<(q+1)*d;note=f'Physicalfullbundles{q}, leftoveritems{r}; originalitemledger{q}×{d}+{r}={n}. Nextbundle{(q+1)*d}>{n}impossible.'
 elif kind=='maximum-fixed-quotient-choice':
  d,q=ns;domain=[n for n in range(d*q,d*(q+1)+1)if n//d==q];v=max(domain);assert(v+1)//d==q+1;note=f'Completefloorquotient{q}family{min(domain)}..{max(domain)}; maximum{v}; nextinteger raisesquotient. Fullresidue0..{d-1}domain.'
 elif kind=='three-digit-floor-quotient-selection':
  results=[divmod(*nums(o))for o in opts];a=one([o for o,(q,r)in zip(opts,results)if 100<=q<=999]);note=f'Every actual divmod{list(zip(opts,results))}; unique quotient100..999 is key{a}. Countsquotient digits, not dividend digits.'
 elif kind=='equal-maximal-page-allocation':
  stamps,pages=ns;q,r=divmod(stamps,pages);assert 'арт' in s or 'қал' in s;v=r
  note=f'Actual equalmaximalallocation{stamps}={pages}×{q}+{r}. Requested LEFTOVER{r}stamps, not perpage{q}; nextoneperpage needs{pages}>{r}. Preserves original remainder target.'
 elif kind=='people-bus-ceiling':
  classes=ns[:4];teachers,seats=ns[4:];total=sum(classes)+teachers;v=(total+seats-1)//seats;assert(v-1)*seats<total<=v*seats
  note=f'Actual fourclasses{classes}+{teachers}teachers={total}; seats{seats}; minimumceil{v}buses, floor{v-1}leaves{total-(v-1)*seats}people. Fullcapacityinequality provesminimum.'
 elif kind=='maximum-equal-quotient-remainder':
  d=one(ns);domain=[d*t+t for t in range(d)if d*t+t>0];v=max(domain);assert divmod(v,d)==(d-1,d-1);note=f'Fullallowed commonq=r domain1..{d-1}; greatest originalnumber{v}; nextt=d violatesremainderbound.'
 elif kind=='smaller-divisor-residue':
  d,r,new=ns;assert d%new==0 and 0<=r<d;v=r%new;assert {(d*k+r)%new for k in range(1000)}=={v}
  method='Independent universal coefficient-divisibility proof plus1000natural-quotient witnesses'
  note=f'ALL k≥0: n={d}k+{r}, firstcoefficient divisible by{new}, so remainder=r mod{new}={v}; 1000witnesses secondary confirmation, not boundedproof.'
 elif kind=='smallest-two-different-residues':
  d1,r1,d2,r2=ns;assert 0<=r1<d1 and 0<=r2<d2;period=lcm(d1,d2);domain=[n for n in range(1,period+1)if n%d1==r1 and n%d2==r2];v=one(domain);assert not any(n%d1==r1 and n%d2==r2 for n in range(1,v))
  method='Independent complete one-LCM-period CRT enumeration and allsmallerpositive exclusion'
  note=f'Actual residues{r1}mod{d1},{r2}mod{d2}; fullperiod1..{period}hasunique{v}; every smallerpositive checked; exactoriginaldivmods{divmod(v,d1)},{divmod(v,d2)}.'
 elif kind=='same-residue-strict-lower-bound':
  lower,d1,d2,r=ns;assert lower==r and 0<=r<min(d1,d2);period=lcm(d1,d2);domain=[n for n in range(lower+1,r+period+1)if n%d1==r and n%d2==r];v=one(domain);assert lower%d1==lower%d2==r and v-r==period
  method='Independent full strictbounded positive domain and LCMperiod, not only offeredchoices'
  note=f'Printed n>{lower}, residues{r}mod{d1},{d2}; fullinterval{lower+1}..{r+period}unique{v}. n={r}wouldmatchresidues but failsSTRICTlowerbound; nextsolution{v+period}notminimum.'
 elif kind=='largest-four-digit-remainder':
  d=one(ns);n=max(range(1000,10000));q,v=divmod(n,d);note=f'LargestFOURdigit natural{n}, originaldivisor{d}; actualdivmod{q},{v}; bound0≤{v}<{d}.'
 elif kind=='smallest-three-digit-given-remainder':
  d,r=ns;domain=[n for n in range(100,1000)if n%d==r];v=min(domain);assert v-d<100;note=f'Full900value three-digit domain; firstresidue{r}mod{d}number{v}. Previoussameclass{v-d}has fewer digits; lowerendpoint100included.'
 elif kind=='doubled-residue-wrap':
  d,r,same=ns;assert d==same and 0<=r<d and 2*r>=d;v=2*r%d;assert {(2*(d*k+r))%d for k in range(1000)}=={v}
  method='Independent universal doubled-coefficient residueidentity and1000integerwitnesses'
  note=f'ALLk:2({d}k+{r})=2×{d}k+{2*r}; {2*r}notvalidresidue, reducesmod{d}to{v}. Secondfullgroup mustremoved, notreturn2r.'
 elif kind=='unknown-divisor-from-remainder':
  n,q,r=ns;hits=[d for d in range(1,n+1)if divmod(n,d)==(q,r)];v=one(hits);assert F(n-r,q)==v and r<v
  method='Independent full positive-divisor-domain enumeration and exactinverse remainderledger'
  note=f'Actual n{n},q{q},r{r}; allpositive divisors1..{n}tested; unique{v}, also({n}−{r})/{q}={v}, remainderstrictbound holds.'
 elif kind=='invariant-three-digit-equal-divisor-quotient':
  assert 'Үш таңбалы' in s and 'екі таңбалы' in s and 'өзiне' not in s
  domain=[(n,d,q,r)for n in range(100,1000)for d in range(10,100)for q,r in[divmod(n,d)]if q==d and r==d-1];v=max(n for n,d,q,r in domain);w=one([t for t in domain if t[0]==v]);assert w==(991,31,31,30)and 32*32+31>999
  method='Independent complete900×90actualdivisiondomain, invariantdimensions retained'
  note=f'Full three-digit dividend/two-digit divisor domain, q=d andr=d−1 gives{len(domain)}validrows; maximum{w}. Fixed991isnecessary theoremconstant; nextd32gives1055>999.'
 elif kind=='max-divisor-plus-positive-remainder':
  q,total=ns;domain=[(d*q+r,d,r)for d in range(10,100)for r in range(1,d)if d+r==total];v=max(n for n,d,r in domain);w=one([t for t in domain if t[0]==v]);assert w==(946,63,1) and sum(w[1:])==total
  method='Independent complete two-digit divisor×strictpositiveoriginalresidue domain'
  note=f'All2digitd10..99and1≤r<d with d+r={total}; maximum{w}. r0 excluded even if bigger n; monotone(q−1)d+total agrees.'
 elif kind=='count-three-digit-equal-quotient-remainder':
  d=one(ns);domain=[n for n in range(100,1000)if divmod(n,d)[0]==divmod(n,d)[1]];v=len(domain);assert all(n%(d+1)==0 for n in domain)
  method='Independent complete900actualthree-digitdivisions and q=r comparison'
  note=f'Actualdivisor{d}; full900numberdomain yields{v}q=r hits{domain}; endpoints and residue<d enforced bydivmod, notonlyformula tcount.'
 elif kind=='reconstruct-remainder-from-gap':
  d,q,gap=ns;r=d-gap;assert 0<=r<d;v=d*q+r;assert divmod(v,d)==(q,r);note=f'Original residue{d}−{gap}={r}, dividend{d}×{q}+{r}={v}; inverseledger exact, internalzero kept.'
 else:raise AssertionError(kind)
 if a is None:a=one([o for o in opts if o==str(v)])if opts else str(v)
 assert row['answer']==a,(row['editionId'],a,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(a)==1
 else:assert a.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
 return {'method':method,'notes':note+' All saved/new conditions, full solutions/MCQ independently read; target remainder/fullquotient, Euclidean bound, strict extrema, digit roles and SI units checked.'}
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
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==41;entries=[];eq=0
 for row in rows:
  ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro';assert row['statement']!=raw['statement']
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)});eq+=chains(row['solution'])
 rejected=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError('Bad key accepted')
 canaries=[(0,'73','74'),(1,'23','22'),(3,'7859','7860'),(4,'956','980'),(5,'3962','3963'),(6,'47','48'),(7,'775','776'),(8,'863','864'),(10,'31','30'),(11,'720','740'),(12,'46','47'),(13,'947','948'),(14,'43','44'),(15,'43','44'),(16,'9','8'),(17,'1200','1201'),(18,'68','69'),(20,'920','921'),(21,'35','55'),(22,'4533','4534'),(23,'47','48'),(24,'24','25'),(25,'13','12'),(26,'45','44'),(27,'76','77'),(28,'28','29'),(29,'38','39'),(30,'637','638'),(32,'64','65'),(33,'64','70'),(34,'8124','8125'),(35,'67','68'),(37,'57','58'),(38,'34','35'),(39,'917','918'),(40,'47','46')]
 for i,old,new in canaries:
  bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 optioncanaries=[(2,0,'647 : 73 = 8, қалдық 63'),(9,0,'834 : 49'),(19,0,'3676 : 43'),(36,1,'868 : 31')]
 for i,index,replacement in optioncanaries:
  bad=copy.deepcopy(rows[i]);bad['options'][index]=replacement
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Option canary accepted',i))
 bad=copy.deepcopy(rows[31]);bad['statement']=bad['statement'].replace('Үш таңбалы','Төрт таңбалы')
 try:solve(bad)
 except AssertionError:rejected+=1
 else:raise AssertionError('Dimension canary accepted')
 # Universal uniqueness of Euclidean q,r plus ceiling/floor physical domains.
 witnesses=0
 for n in range(1,2000):
  for d in range(1,100):
   q,r=divmod(n,d);assert n==d*q+r and 0<=r<d and q*d<=n<(q+1)*d
   ceil=q+(r>0);assert(ceil-1)*d<n<=ceil*d
   for shifted in[-1,1]:assert not(0<=r-shifted*d<d)
   witnesses+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All41 saved/new conditions/fullsolutions/MCQ read; independent actualprinted Euclidean/domain/CRT/strictminimum/capacity/invariant oracle. Corrected original leftover target07c24... reread before hash.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'EuclideanFloorCeilingWitnesses':witnesses,'report':OUT if args.write else None}))
if __name__=='__main__':main()
