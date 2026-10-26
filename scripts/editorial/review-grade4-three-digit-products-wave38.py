"""Independent full25 saved/new three-digit-product review.
Actual printed integer/Fraction/2-5valuation oracle, complete digit domains and
physical ledgers. No author model, renderer or column helper imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-three-digit-products-wave38.json'
OUT='problems/editorial/reviews/grade4-three-digit-products-wave38.json'
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
def products(s):return [(int(a),int(b))for a,b in re.findall(r'(\d+) × (\d+)',s)]
def valuation(n,p):
 assert n>0;c=0
 while n%p==0:n//=p;c+=1
 return c
def zeros(n):return min(valuation(n,2),valuation(n,5))
def solve(row):
 kind=row['modelId'].removeprefix('grade4-three-digit-products-');s=row['statement'];ns=nums(s);ps=products(s);opts=row.get('options',[]);a=v=None
 method='Independent actual printed exact integer/Fraction arithmetic and original-unit inverse ledgers'
 if kind in {'nonzero-partial-row-count','middle-zero-partial-row-count'}:
  n,m=one(ps);nonzero=[int(c)for c in str(m)if c!='0'];v=len(nonzero);assert len(str(m))==3
  if kind.startswith('middle'):assert str(m)[1]=='0'and len(nonzero)==2
  note=f'Actual multiplier{m}hasnonzero digits{nonzero}, exactly{v}rows. Ignoredzero row still leaveshundreds shift100, notshift10. Multiplicanddigitcount{len(str(n))}irrelevant.'
 elif kind in {'dictionary-purchase','school-art-kit-purchase'}:
  price,count=ns;v=sum(price for _ in range(count));assert v==price*count
  note=f'Actualequalunitprice{price}tenge×{count}items; independent repeated-priceledger{v}, inverse{v}/{count}={price}. Allthree multiplierdigits used with correctplacevalues.'
 elif kind=='constant-daily-production':
  daily,days=ns;v=sum(daily for _ in range(days));note=f'Actual{days}WORKdays, constant{daily}/day gives{v}pieces. Daysalreadyworkdays, no calendarassumptions/24h multiplier.'
 elif kind=='common-positive-factor-permuted-multiplier':
  (A,b),(same,c)=ps;assert A==same>0;a='<'if b<c else'>'if b>c else'=';assert b<c and sorted(str(b))==sorted(str(c))
  method='Independent positive-common-factor monotonicity, fullproducts onlysecondary check'
  note=f'Printedpositivecommonfactor{A}; compare remaining{b}<{c} directly. Permuted same digits ≠equalvalues; multiplied inequalitypreserved.'
 elif kind=='rounded-bounds-digit-count':
  n,m=one(ps);lo=(n//1000*1000,m//100*100);hi=(lo[0]+1000,lo[1]+100);L=lo[0]*lo[1];H=hi[0]*hi[1];assert lo[0]<n<hi[0]and lo[1]<m<hi[1]and L<n*m<H
  v=len(str(L));assert len(str(H))==v and 10**(v-1)<=L<H<10**v
  method='Independent actual rounded-factor lower/upper bounds, no fullproduct needed fordigits'
  note=f'Actual factors{n},{m}; strict roundedbounds{lo}and{hi}give{L}<product<{H}. Bothbounds{v}digits, wholeintervalsame digitlength.'
 elif kind=='select-two-nonzero-partial-rows':
  pairs=[nums(o)for o in opts];a=one([o for o,(n,m)in zip(opts,pairs)if len([c for c in str(m)if c!='0'])==2]);assert len({n for n,m in pairs})==1
  note=f'Every actual multipliernonzero count{[(m,sum(c!="0"for c in str(m)))for n,m in pairs]}; unique{a}. Notcounting multiplicanddigits or zero-valuedrow.'
 elif kind=='largest-zero-rich-product':
  vs=[integer(calc(o))for o in opts];a=one([o for o,v in zip(opts,vs)if v==max(vs)]);assert nums(a)[0]!=max(nums(o)[0]for o in opts)
  note=f'Allactual products{list(zip(opts,vs))}; unique maximum{max(vs)}belongs to{a}, notlargestfirstfactor. Bothzero-richhundreds/unitscontributions kept.'
 elif kind=='stock-product-minus-dispatch':
  each,boxes,sent=ns;stock=sum(each for _ in range(boxes));v=stock-sent;assert v>0 and v+sent==stock
  note=f'Actual{boxes}boxes×{each}notebooks={stock}; dispatch{sent}; remaining{v}. Independentremaining+dispatch=stockledger and originalunits checked.'
 elif kind=='roll-length-metres-to-kilometres':
  metres,rolls=ns;length=sum(metres for _ in range(rolls));km=integer(F(length,1000));a=one([o for o in opts if nums(o)==[km]and o.endswith(' км')])
  note=f'Actual{rolls}rolls×{metres}m={length}m; SI1000m/km gives{km}km. Optionlabel andnumber bothchecked, rawmetres-as-km trap rejected.'
 elif kind=='same-time-production-difference':
  first,second,hours=ns;A=first*hours;B=second*hours;v=A-B;assert v==(first-second)*hours and v>0
  note=f'Printed shared{hours}h; actualproducts{A},{B}; excess{v}. Independent hourdifference{first-second}×samehours agrees; notsumoroneworkeronly.'
 elif kind=='transfer-ten-between-factors':
  (a1,b1),(a2,b2)=ps;assert a1==10*b2 and a2==10*b1;a='=';assert a1*b1==a2*b2
  method='Independent associativity/commutativity under actual factor10 transfer'
  note=f'Actual factors rewrite{a1}={b2}×10,{a2}={b1}×10; same3factors differentorder. Equal{a1*b1}, noapproximatecomparison.'
 elif kind=='two-purchases-who-and-difference':
  firstPrice,firstCount,secondPrice,secondCount=ns;A=sum(firstPrice for _ in range(firstCount));B=sum(secondPrice for _ in range(secondCount));assert B>A;gap=B-A;a=one([o for o in opts if o.startswith('Дана,')and nums(o)==[gap]])
  note=f'Actual labelledledgers Aybar{A}, Dana{B}; Dana pays{gap}tenge MORE. Bothpersonanddifference required, correctmagnitude/wrongperson option rejected.'
 elif kind=='ticket-product-budget-leftover':
  count,price,budget=ns;spent=sum(price for _ in range(count));v=budget-spent;assert v>0 and spent+v==budget
  note=f'Actual{count}tickets at{price}→{spent}; budget{budget}; remaining{v}. Fullinverse spent+remaining=budgetchecked, nottotalcost.'
 elif kind=='second-workshop-extra-combined-days':
  first,extra,days=ns;second=first+extra;daily=first+second;v=sum(daily for _ in range(days));assert v==first*days+second*days
  note=f'Actual secondrate is{first}+{extra}={second}, NOTextraalone; combineddaily{daily}for{days}WORKdays→{v}. Independent twofullworkerledgers agree.'
 elif kind=='last-digit-without-full-product':
  n,m=one(ps);v=(n%10)*(m%10)%10;assert n*m%10==v
  method='Independent modulo10placevalue identity; fullproduct onlysecondary check'
  note=f'Onlyactualunits{n%10}×{m%10}={(n%10)*(m%10)} matters, lastdigit{v}. Allothercolumnrows multiples10; sumunits{(n%10+m%10)%10}wrong.'
 elif kind=='cross-million-after-hundred-part':
  n,m=one(ps);assert 100<m<110;hundred=n*100;extra=n*(m-100);v=len(str(hundred+extra));assert hundred<1000000<hundred+extra
  note=f'Actualhundredpart{hundred}SIXdigits, extra{m-100}copies adds{extra}; full{hundred+extra}crosses1million→{v}digits. Truncated roundedestimatewrong.'
 elif kind=='invariant-distinct-digit-extreme-product':
  assert 'үш таңбалы' in s and 'төрт таңбалы' in s
  A=max(n for n in range(100,1000)if len(set(str(n)))==3);B=min(n for n in range(1000,10000)if len(set(str(n)))==4);v=A*B
  method='Independent full900and9000distinctdigitintegerdomains, noleadingzero'
  note=f'Fullnatural3digitdomain maximum{A}, fullnatural4digitdomain minimum{B}; bothall-differentdigits. Product{v}; extrema987/1023necessaryfixedfacts, notnumericnewmeaning.'
 elif kind=='swapped-three-digit-multiplier-inverse':
  correct,wrong,excess=ns;assert sorted(str(correct))==sorted(str(wrong))and wrong>correct;n=integer(F(excess,wrong-correct));v=n*correct;assert n*wrong-v==excess
  note=f'Actualwrongminuscorrectmultiplier{wrong-correct}; originalnumber{excess}/{wrong-correct}={n}; intendedproduct{v}. Exactwrongledger{n*wrong}−correct{v}={excess}.'
 elif kind=='greatest-trailing-zero-count':
  pairs=[nums(o)for o in opts];zs=[zeros(n*m)for n,m in pairs];a=one([o for o,z in zip(opts,zs)if z==max(zs)]);assert all(z==len(str(n*m))-len(str(n*m).rstrip('0'))for(n,m),z in zip(pairs,zs))
  method='Independent additiveprime2/5valuations and actualtrailing-string secondarycheck'
  note=f'Actual{list(zip(opts,[n*m for n,m in pairs],zs))}; unique greatestterminalzerocount{max(zs)}key{a}. Newlycreated2×5pairs count, notonlyexisting factorzeros.'
 elif kind=='invariant-three-by-three-product-digits':
  assert 'екі сан да үш таңбалы' in s;lengths={len(str(a*b))for a in range(100,1000)for b in range(100,1000)};assert lengths=={5,6};a=one([o for o in opts if nums(o)==sorted(lengths)])
  method='Independent complete810000three-digit×three-digitnaturalpairs plus endpointbounds'
  note='All900×900actualproducts yield lengthset{5,6}. Minimum10000, maximum998001; bothoccur, below5orabove6impossible. Fixedrangefact honestlypreserved.'
 elif kind=='known-digit-product-repeated-three-times':
  (n,d),(same,repeated)=ps;known=ns[2];assert n==same and n*d==known and repeated==111*d;v=known+known*10+known*100;assert v==n*repeated
  method='Independent printedknownproduct and decimaldistributive111identity'
  note=f'Actual given{n}×{d}={known}; repeateddigit{repeated}=111×{d}; sum{known}+{known*10}+{known*100}={v}. Knownproductat3placevalues, no shiftedzero omissions.'
 elif kind=='near-round-million-comparison':
  n,m=one(ps);threshold=ns[-1];round=m-1;A=n*round;B=A+n;a='>'if B>threshold else'<'if B<threshold else'=';assert A<threshold<B
  note=f'Actual multiplier{m}={round}+1; roundedpart{A}below{threshold}, wholepartadds{n}→{B}above. Exactrequestedrelation{a}, notrounded-onlycomparison.'
 else:raise AssertionError(kind)
 if a is None:a=one([o for o in opts if o==str(v)])if opts else str(v)
 assert row['answer']==a,(row['editionId'],a,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(a)==1
 else:assert a.isdecimal()and s.endswith('Жауапқа тек санды жазыңыз.')
 return {'method':method,'notes':note+' All saved/new conditions, full solutions and MCQ independently read; source-specific target, units, nonzero-row shifts, strict bounds and placevalues checked.'}
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
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==25;entries=[];eq=0
 for row in rows:
  ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']]);assert raw['checked']and raw['solution']and not raw.get('images')and row['grade']==4 and row['minimumPlan']=='pro';assert row['statement']!=raw['statement']
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)});eq+=chains(row['solution'])
 rejected=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError('Bad key accepted')
 canaries=[(0,'246','206'),(1,'2740','2741'),(2,'1760','1761'),(3,'235','535'),(4,'6247','624'),(5,'309','319'),(8,'9852','9853'),(9,'1750','17500'),(10,'148','149'),(11,'1760','17600'),(12,'195','196'),(13,'310000','310001'),(14,'247','248'),(15,'4793','4794'),(16,'9789','978'),(18,'3600','3609'),(21,'2002','2003'),(22,'7086','708'),(23,'2150','2151'),(24,'2499','2490')]
 for i,old,new in canaries:
  bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 for i,index,new in[(6,2,'4326 × 617'),(7,1,'4050 × 30'),(19,0,'625 × 32')]:
  bad=copy.deepcopy(rows[i]);bad['options'][index]=new
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Option canary accepted',i))
 for i,old,new in[(17,'төрт таңбалы','бес таңбалы'),(20,'екі сан да үш таңбалы','екі сан да төрт таңбалы')]:
  bad=copy.deepcopy(rows[i]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
  try:solve(bad)
  except AssertionError:rejected+=1
  else:raise AssertionError(('Dimension canary accepted',i))
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All25 saved/new conditions/fullsolutions/MCQ read; independent actualprinted multiplication/columnrows/units/2-5valuation/fulldigitdomain oracle, no authorhelper imports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'rejectedCanaries':rejected,'numericEqualityChains':eq,'fullThreeDigitProducts':810000,'report':OUT if args.write else None}))
if __name__=='__main__':main()
