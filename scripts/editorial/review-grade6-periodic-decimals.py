"""Independent full14 saved/new periodic-decimal review.
Uses exact rational reconstruction and denominator multiplicative order, NOT
author remainder-state code. All fullconditions/solutions/MCQs were read.
"""
import copy,hashlib,json,math,re,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-periodic-decimals.json'
REPORT='problems/editorial/reviews/grade6-periodic-decimals.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('{,}',',').replace('−','-').replace('\\,','').replace('\\ldots','…')
 return re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def norm(s):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',clean(s))).strip()
def fractions(s):return [F(int(a),int(b)) for a,b in re.findall(r'\((-?\d+)/(\d+)\)',clean(s))]
def rawfractions(s):return [(int(a),int(b)) for a,b in re.findall(r'\((-?\d+)/(\d+)\)',clean(s))]
DEC=r'-?\d+,\d*(?:\(\d+\))?'
def decimal_value(s):
 m=re.fullmatch(r'(-?)(\d+),(\d*)(?:\((\d+)\))?',clean(s).strip());assert m,s
 sign=-1 if m[1] else 1;whole=int(m[2]);prefix=m[3];repeat=m[4];assert prefix or repeat
 value=F(whole)+F(int(prefix or '0'),10**len(prefix))
 if repeat is not None:value+=F(int(repeat),(10**len(repeat)-1)*10**len(prefix))
 return sign*value
def expansion(value):
 sign='-' if value<0 else '';n,d=abs(value.numerator),value.denominator;whole=n//d;n%=d
 rest=d;twos=fives=0
 while rest%2==0:twos+=1;rest//=2
 while rest%5==0:fives+=1;rest//=5
 prefixLength=max(twos,fives)
 # Coprime residual denominator: the least exponent10^k=1 mod rest is
 # exactly the shortest recurring block length. Minimality tested directly.
 periodLength=0
 if rest>1:
  power=10%rest;periodLength=1
  while power!=1:power=power*10%rest;periodLength+=1;assert periodLength<d
 def digit(j):return (n*10**j//d)%10
 prefix=''.join(str(digit(j)) for j in range(1,prefixLength+1))
 period=''.join(str(digit(j)) for j in range(prefixLength+1,prefixLength+periodLength+1))
 text=sign+str(whole)+','+prefix+('('+period+')' if period else '')
 assert decimal_value(text)==value
 return prefix,period,text
def digit_at(value,index):assert index>0;return (abs(value.numerator)*10**index//value.denominator)%10
def option_text(r):return [o['text'] if isinstance(o,dict) else o for o in r.get('options',[]) or []]
def number(s):return int(one(re.findall(r'-?\d+',clean(s))))
def comparison(s):
 s=clean(s);m=re.fullmatch('('+DEC+r')\s*([<>=])\s*('+DEC+')',s);assert m,s
 a,b=decimal_value(m[1]),decimal_value(m[3]);return (a>b if m[2]=='>' else a<b if m[2]=='<' else a==b)
def irreducible_pairs(s):
 pairs=rawfractions(s);assert pairs and all(0<a<b and math.gcd(a,b)==1 for a,b in pairs);return pairs
def solve(row,i,source=False):
 s=clean(row['statement']);options=option_text(row);chosen=None;value=None
 if i in(0,6,9,10):
  f=one(fractions(s));f=-f if s.lstrip().startswith('-(') else f
  prefix,period,canonical=expansion(f)
  assert len(period)==1
  if i==0:assert len(prefix)==2
  if i==6:assert len(prefix)==1
  if i in(9,10):assert prefix=='' and (f<0)==(i==9)
  chosen=one([o for o in options if decimal_value(o)==f]);assert clean(chosen)==canonical
 elif i==1:
  digits=one(re.findall(r'0,(\d+)',s));assert len(digits)>=6
  periods=[digits[:k] for k in range(1,len(digits)+1) if len(digits)%k==0 and digits==digits[:k]*(len(digits)//k)]
  period=periods[0];assert len(period)==2 and period[0]!=period[1]
  if not source:
   a,b=one(re.findall(r'(\d) және (\d) цифрларынан',s));assert period==a+b
  chosen=one([o for o in options if decimal_value(o)==F(int(period),99)])
  assert clean(chosen)=='0,('+period+')'
 elif i==2:
  candidates=[]
  for o in options:
   a,b=one(irreducible_pairs(o));x=F(a,b)
   if expansion(x)[1]=='':candidates.append(o)
  chosen=one(candidates)
 elif i==3:
  decimals=re.findall(DEC,s);assert len(decimals)==6
  for d in decimals:assert expansion(decimal_value(d))[2]==d
  value=sum(re.fullmatch(r'-?\d+,\(\d+\)',d) is not None for d in decimals)
 elif i==4:
  f=one(fractions(s));stated=one(re.findall(DEC,s));assert decimal_value(stated)==f
  count=int(one(re.findall(r'алғашқы\s+(\d+)',s)));assert count>0
  digits=[digit_at(f,j) for j in range(1,count+1)];value=sum(digits)
  assert expansion(f)[0]=='' and len(expansion(f)[1])==2
 elif i==5:
  decimals=re.findall(DEC,s);assert len(decimals)==2 and '(' in decimals[0] and '(' not in decimals[1]
  assert decimal_value(decimals[0])>decimal_value(decimals[1])
  chosen=one([o for o in options if any(sign in o for sign in '<>=') and comparison(o)])
 elif i==7:
  dec=one(re.findall(DEC,s));f=decimal_value(dec);index=int(one(re.findall(r'(\d+)-цифр',s)));value=digit_at(f,index)
  assert expansion(f)[0]=='' and len(expansion(f)[1])==2
 elif i==8:
  a,b=fractions(s);given=one(re.findall(DEC,s));assert a==F(1,9) and decimal_value(given)==a
  prefix,period,_=expansion(b);assert not prefix and len(period)==1;value=int(period)
 elif i==11:
  digits=one(re.findall(r'0,(\d+)',s));tail=digits[-1];run=len(digits)-len(digits.rstrip(tail));assert run>=3
  prefix=digits[:-run];assert len(prefix)==2 and tail not in prefix
  if not source:assert one(re.findall(r'кейін тек (\d)',s))==tail
  value=int(tail)
 elif i==12:
  candidates=[]
  for o in options:
   d=number(o);periods=[expansion(F(n,d))[1] for n in range(1,d) if math.gcd(n,d)==1]
   assert periods
   if all(p=='' for p in periods):candidates.append(o)
  chosen=one(candidates)
 elif i==13:
  pairs=irreducible_pairs(s);assert len(pairs)==7;value=sum(expansion(F(a,b))[1]=='' for a,b in pairs)
 else:raise AssertionError(i)
 if chosen is not None:assert norm(row['answer'])==norm(chosen),(i,row['answer'],chosen)
 else:assert number(row['answer'])==value,(i,row['answer'],value)
 return value
def run():
 rows=read(BATCH)['editions'];assert len(rows)==14;bad=0;entries=[]
 for i,row in enumerate(rows):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']])
  assert cap['status']=='captured' and raw['checked'] and raw['solution'] and not raw.get('images')
  assert norm(raw['statement']).lower()!=norm(row['statement']).lower();solve({**raw,'answer':raw['sourceAnswer']},i,True);solve(row,i)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i)
  except(AssertionError,ValueError):bad+=1
  else:raise AssertionError(('Wrong key accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_periodic_rational_reconstruction_denominator_order_and_direct_indexed_digit_oracle','notes':['Read all14 saved/new fullconditions, complete official/authored solutions and everyMCQ; no author solver or params imported.','Independent denominator2/5 stripping and multiplicative order derive minimal preperiod/period; rational reconstruction confirms exact recurring values versus finite truncations and signs.','Direct floor(n×10^index/d) digits independently check indexed14th versus summed8digits; lexical pure/mixed, terminating every reduced numerator and complete offered distractors verified.']})
 canaries=[(0,'11/12','7/12'),(1,'727272','737373'),(2,'(7/80)','(7/81)'),(3,'0,(36)','0,3(6)'),(4,'алғашқы 8','алғашқы 10'),(5,'0,77','0,78'),(6,'5/6','1/6'),(7,'14-цифр','15-цифр'),(8,'8/9','7/9'),(9,'4/9','5/9'),(10,'5/9','4/9'),(11,'723333','724444'),(12,'160','162'),(13,'9/50','9/55')]
 rejected=0
 for i,old,new in canaries:
  row=copy.deepcopy(rows[i]);field='options' if i in(2,12) else 'statement'
  if field=='options':assert any(old in o for o in row[field]);row[field]=[o.replace(old,new) for o in row[field]]
  else:assert old in row[field];row[field]=row[field].replace(old,new)
  try:solve(row,i)
  except(AssertionError,ValueError):rejected+=1
  else:raise AssertionError(('Printed canary accepted',i))
 row=copy.deepcopy(rows[1]);row['options']=[o.replace('0,(72)','0,(7272)') for o in row['options']];row['answer']='0,(7272)'
 try:solve(row,1)
 except AssertionError:rejected+=1
 else:raise AssertionError('Nonminimal but equal period accepted')
 row=copy.deepcopy(rows[7]);row['statement']=row['statement'].replace('14-цифрды','алғашқы 14 цифрдың қосындысын')
 try:solve(row,7)
 except AssertionError:rejected+=1
 else:raise AssertionError('Digit sum substituted for indexed digit')
 witnesses=0;finite=periodic=0
 for d in range(2,101):
  for n in range(1,d):
   if math.gcd(n,d)!=1:continue
   x=F(n,d);prefix,period,text=expansion(x);assert decimal_value(text)==x
   residue=d
   for factor in(2,5):
    while residue%factor==0:residue//=factor
   assert (period=='')==(residue==1)
   if period:
    assert pow(10,len(period),residue)==1
    assert all(pow(10,k,residue)!=1 for k in range(1,len(period)))
    periodic+=1
   else:finite+=1
   # Direct nth-digit read of rational versus observed canonical recurring word.
   for j in range(1,len(prefix)+2*len(period)+5):
    expected=int(prefix[j-1]) if j<=len(prefix) else int(period[(j-len(prefix)-1)%len(period)]) if period else 0
    assert digit_at(x,j)==expected
   witnesses+=1
 evidence={'oracle':'scripts/editorial/review-grade6-periodic-decimals.py','savedConditionsChecked':14,'newConditionsChecked':14,'fullSolutionsAndAllChoicesRead':True,'wrongKeysRejected':bad,'printedGivenMinimalityAndIndexRoleCanariesRejected':rejected,'completeReducedProperFractionsDenominatorAtMost100':witnesses,'finiteCases':finite,'periodicCases':periodic,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':14,'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
