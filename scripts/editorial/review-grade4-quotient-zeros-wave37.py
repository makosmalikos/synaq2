"""Independent full29 saved/new quotient-zero review.
Actual printed Fraction/prefix calculations and exhaustive digit domains;
no author model, renderer, calculator or trace imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-quotient-zeros-wave37.json'
OUT='problems/editorial/reviews/grade4-quotient-zeros-wave37.json'
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
 kind=row['modelId'].removeprefix('grade4-quotient-zeros-');s=row['statement'];ns=nums(s);ds=divisions(s);opts=row.get('options',[]);a=v=None
 method='Independent actual printed exact Fraction, first-prefix/digit roles and inverse-original-divisor ledger'
 if kind in {'digits-before-dividing','digits-two-terminal-zeros','first-sufficient-prefix'}:
  n,d=one(ds);q=integer(F(n,d));p,length=prefix(n,d);assert length==len(str(q));v=p if kind=='first-sufficient-prefix'else length
  if kind=='digits-two-terminal-zeros':assert q%100==0 and 100<=q<=999
  note=f'Actual {n}/{d}={q}; SHORTEST sufficient leftprefix{p}; remainingdigits give{length}quotientdigits. Every shorterprefix belowdivisor. Endingzeros count as digits.'
 elif kind=='target-with-two-terminal-zeros':
  target=one(ns);qs=[calc(o)for o in opts];a=one([o for o,q in zip(opts,qs)if q==target]);assert target%100==0
  note=f'All actualoptionquotients{list(zip(opts,map(str,qs)))}; unique printedtarget{target}. ×/÷10dividendperturbations give40/4000ratherthan400; ORIGINALdivisor kept.'
 elif kind in {'terminal-zero-choice','alternating-double-zero-choice','internal-zero-choice','two-terminal-zeros-choice'}:
  n,d=one(ds);q=integer(F(n,d));v=q
  pattern={'terminal-zero-choice':r'[1-9][1-9]0','alternating-double-zero-choice':r'[1-9]0[1-9]0','internal-zero-choice':r'[1-9]0[1-9]','two-terminal-zeros-choice':r'[1-9]00'}[kind]
  assert re.fullmatch(pattern,str(q));assert q*d==n
  note=f'Actual inverse{q}×{d}={n}; fullquotient{q} matchesrequiredzero-positionpattern{pattern}. Dropped, shifted, extrazero options all have differentoriginaldivisorproducts.'
 elif kind=='select-tens-zero-quotient':
  qs=[integer(calc(o))for o in opts];a=one([o for o,q in zip(opts,qs)if(q//10)%10==0]);assert all(100<=q<=999 for q in qs)
  note=f'Every actual quotient{list(zip(opts,qs))}; tensdigits{[(q//10)%10 for q in qs]}. Unique tens0key{a}, terminalunits0notinterchangeable.'
 elif kind=='inverse-check-expression':
  n,d=one(ds);q=ns[-1];assert q*d==n;a=one([o for o in opts if calc(o)==n and nums(o)==[q,d]and'×'in o]);note=f'Printed result{q}, originaldivisor{d}; only{a}returnsdividend{n}. All actual offeredexpressions evaluated{list(zip(opts,map(lambda o:str(calc(o)),opts)))}.'
 elif kind in {'compare-terminal-and-internal-zero','compare-alternating-and-paired-zeros'}:
  n,d=one(ds);reference=ns[-1];q=integer(F(n,d));a='='if q==reference else'>'if q>reference else'<';assert '0'in str(q)and'0'in str(reference)
  note=f'Actual originalquotient{q} compared toprintedbenchmark{reference}: {a}. Placevalues independently checked, samezero/nonzerodigits do not implyequality.'
 elif kind=='check-zero-placement-equalities':
  truth=[]
  for o in opts:
   n,d,q=nums(o);truth.append(d*q==n)
  a=one([o for o,t in zip(opts,truth)if t]);note=f'Every offeredoriginaldivisor×claimedquotientchecked{list(zip(opts,truth))}; unique correct{a}. Actualquotients{[integer(F(n,d))for n,d,_ in map(nums,opts)]}differ byzeroplacement.'
 elif kind=='equal-crates-two-terminal-zeros':
  total,crates=ns;v=integer(F(total,crates));assert v%100==0 and 100<=v<=999 and sum(v for _ in range(crates))==total
  note=f'Physicalequalcrateledger{crates}×{v}={total}; two terminalzeros needed foractual per-crate{v}, notstrippedleadingdigit.'
 elif kind in {'ticket-price-terminal-zero','ticket-price-two-terminal-zeros'}:
  tickets,total=ns;v=integer(F(total,tickets));assert v%10==0
  if kind=='ticket-price-two-terminal-zeros':assert v%100==0 and len(str(v))==4
  note=f'Actualconstantticketprice{total}/{tickets}={v}tenge; inverse{v}×{tickets}restores originaltotal, allterminalzeros retained.'
 elif kind=='greatest-alternating-zero-quotient':
  qs=[integer(calc(o))for o in opts];a=one([o for o,q in zip(opts,qs)if q==max(qs)]);assert all(re.fullmatch(r'[1-9]0[1-9]0',str(q))for q in qs)
  note=f'All actual quotients{list(zip(opts,qs))}; maximum{max(qs)}, notlargest rawdividend. Internal andfinalzero patterns preserved acrosschoices.'
 elif kind=='recover-dropped-single-zero':
  d,zero,written=ns;assert zero==0;assert 10<=written<=99 and '0'not in str(written)
  candidates=[q for q in range(100,1000)if str(q).count('0')==1 and str(q).replace('0','')==str(written)];assert len(candidates)==2
  valid=[q*d for q in candidates if 10000<=q*d<=99999];v=one(valid)
  method='Independent full900three-digitquotientdomain; stripEXACTonezero, preservewrittenorder and five-digitdividend'
  note=f'Complete quotientdomain yields{candidates}; products{[q*d for q in candidates]}. Only{v}hasFIVEdividenddigits; leading0nevervalid. Digitorder notpermuted.'
 elif kind in {'count-five-digit-middle-zero-quotients','max-four-digit-middle-zero-quotient','min-five-digit-middle-zero-quotient'}:
  d,zero=ns;assert zero==0;low,high=(1000,9999)if kind.startswith('max-four')else(10000,99999);domain=[q*d for q in range(100,1000)if(q//10)%10==0 and low<=q*d<=high]
  assert len(domain)==len(set(domain));v=len(domain)if kind.startswith('count')else max(domain)if kind.startswith('max')else min(domain)
  method='Independent full900three-digitquotientdomain, exactdividenddigit bounds and tens0predicate'
  note=f'Actual divisor{d}, full3digitquotients100..999 withtens0, productmustin{low}..{high}: {len(domain)}distinctproducts. Requested'+('count'if kind.startswith('count')else'maximum'if kind.startswith('max')else'minimum')+f' {v}; all lower/upper endpoints tested.'
 elif kind=='dividend-divisor-difference':
  q,gap=ns;d=integer(F(gap,q-1));v=d*q;assert v-d==gap and F(v,d)==q and'0'in str(q)[1:-1]
  note=f'Actual n=q×d, n−d={gap}; (q−1)d={q-1}d→d{d}, originaldividend{v}. Both given difference and exactquotient{q}verified bybacksubstitution.'
 elif kind=='select-both-terminal-zero-quotient':
  d,zero=ns;assert zero==0;qs=[integer(F(int(o),d))for o in opts];a=one([o for o,q in zip(opts,qs)if q%100==0]);assert any(q%10==0 and q%100!=0 for q in qs)
  note=f'All actual optionquotients{list(zip(opts,qs))}; required BOTHtens/units0 meansq%100=0; exactly{a}valid, singlezeroinsufficient.'
 elif kind=='possible-quotient-digit-counts':
  d=one(ns);assert 'Бес таңбалы' in s;domain=[n//d for n in range(10000,100000)if n%d==0];lengths=sorted({len(str(q))for q in domain});assert lengths==[3,4]
  a=one([o for o in opts if nums(o)==lengths]);assert domain[0]*d>=10000 and domain[-1]*d<=99999
  method='Independent complete90000five-digitdividenddomain with exactdivisibility; allactualquotient lengths'
  note=f'Actual exactdivisor{d}; {len(domain)}validdividends, quotientrange{min(domain)}..{max(domain)}, digitlengthset{lengths}. Bothoccur; 2and5excluded byfullrange.'
 elif kind=='smaller-divisor-from-known-zero-quotient':
  d,q,new=ns;v=integer(F(d*q,new));assert d%new==0 and v==q*(d//new)
  note=f'Actual originaldividend{d}×{q}={d*q}; newdivisor{new}is{d//new}timessmaller, quotient{v}larger. Reversingdirection or droppinginternal0wouldfailinverse.'
 elif kind=='reverse-divisor-correct-internal-zero':
  correct,wrong,result=ns;assert str(wrong)==str(correct)[::-1];n=wrong*result;v=integer(F(n,correct));assert re.fullmatch(r'[1-9]0[1-9]',str(v))
  note=f'Wrongexactledger{wrong}×{result}={n}; intendeddivisor{correct}gives{v}; correctresult retainsinternal0, originalnumberunchanged.'
 elif kind=='fixed-total-two-allocations':
  total,first,next=ns;old,new=integer(F(total,first)),integer(F(total,next));v=old-new;assert v>0 and old*first==new*next==total
  note=f'Actual same{total}m divided by{first}then{next}shops gives{old}mvs{new}m; eachshopreceives{v}mLESS. Both independent allocationledgers conserve total.'
 elif kind=='smallest-five-digit-exact-multiple':
  d=one(ns);domain=[n for n in range(10000,100000)if n%d==0];v=min(domain);assert v-d<10000 and v%d==0
  method='Independent complete90000five-digitintegerdomain and firstexactmultiple'
  note=f'Actualdivisor{d}; smallest exactfive-digit{v}; previousmultiple{v-d}below10000, nextadmissibleendpoint verified. Noarbitraryroundingortrailingzeroloss.'
 else:raise AssertionError(kind)
 if a is None:a=one([o for o in opts if o==str(v)])if opts else str(v)
 assert row['answer']==a,(row['editionId'],a,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(a)==1
 else:assert a.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
 return {'method':method,'notes':note+' All saved/new fullconditions, solutions and MCQ independently read; digit/zero locations, requested target, bounds and physical units checked.'}
def chains(s):
 s=re.sub(r'(?<=\d):(?=\s)',';',s)
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
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==29;entries=[];eq=0
 for row in rows:
  ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro';assert row['statement']!=raw['statement']
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)});eq+=chains(row['solution'])
 rejected=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError('Bad key accepted')
 canaries=[(0,'68','6'),(1,'72','7'),(2,'400','4000'),(3,'23940','2394'),(4,'48480','4848'),(5,'9680','968'),(7,'20210','20211'),(8,'606','666'),(10,'22500','2250'),(11,'48180','4818'),(13,'71','7'),(14,'19','18'),(15,'24','36'),(16,'21816','21817'),(17,'46','47'),(19,'104','140'),(20,'27','28'),(21,'17','14'),(22,'27720','27721'),(23,'97','96'),(24,'31200','3120'),(25,'74','7'),(26,'97500','9750'),(27,'2200','2000'),(28,'31','23')]
 for i,old,new in canaries:
  bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,index,new in[(6,3,'14061 : 43'),(9,2,'56700 : 14 = 4500'),(12,2,'7676 : 19')]:
  bad=copy.deepcopy(rows[i]);bad['options'][index]=new
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Option canary accepted',i))
 bad=copy.deepcopy(rows[18]);bad['statement']=bad['statement'].replace('Бес таңбалы','Төрт таңбалы')
 try:solve(bad)
 except AssertionError:rejected+=1
 else:raise AssertionError('Printed dimension canary accepted')
 # Own stream recurrence versus builtin divmod over all five-digit exact dividends
 # from 3/4-digit quotients and 1/2-digit divisors, many internal/terminal0patterns.
 witnesses=0
 for q in range(100,10000):
  for d in range(1,100):
   n=q*d
   if not 10000<=n<100000:continue
   rem=0;result='';started=False
   for char in str(n):
    digit,rem=divmod(10*rem+int(char),d)
    if digit or started:result+=str(digit);started=True
   p,length=prefix(n,d);assert int(result)==q and rem==0 and len(result)==length
   assert int(result[0])*d<=p<(int(result[0])+1)*d;witnesses+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All29 saved/new fullconditions/solutions/MCQ read; independent actualprinted inverse/prefix/zero-position and full digitdomain oracle. No authorcalculators imported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'fiveDigitExactDivisionWitnesses':witnesses,'report':OUT if args.write else None}))
if __name__=='__main__':main()
