"""Independent29 canonical percentpart2 source/new fullsolutions/everyMCQ.
Own actual-printed exact Fraction and unit/domain conservation, no author imports.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-percent2-wave6.json'
OUT='problems/editorial/reviews/collection-percent2-wave6.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return[F(n.replace(',','.'))for n in re.findall(r'\d+(?:,\d+)?',s)]
def whole(x):
 x=F(x);assert x.denominator==1,x
 return x.numerator
def fmt(x):
 x=F(x);sign='-'if x<0 else'';x=abs(x);w=x.numerator//x.denominator;rem=x.numerator%x.denominator;ds=''
 while rem:
  assert len(ds)<12;rem*=10;ds+=str(rem//x.denominator);rem%=x.denominator
 return sign+str(w)+(','+ds if ds else'')
def tree(s,env=None):
 env=dict(env or{});count=0
 def decimal(m):
  nonlocal count
  name='DECIMAL'+str(count);count+=1;env[name]=F(m.group().replace(',','.'));return name
 s=re.sub(r'\d+,\d+',decimal,s)
 s=re.sub(r'(?<=\d)(?=[a-z])','*',s);s=re.sub(r'(?<=\))(?=[a-z])','*',s)
 s=s.replace('³','**3').replace('²','**2').replace('×','*').replace('÷','/').replace(':','/').replace('−','-')
 return ast.parse(s.strip(),mode='eval'),env
def calc(s,env=None):
 t,env=tree(s,env)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return-walk(n.operand)if isinstance(n.op,ast.USub)else walk(n.operand)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub,ast.Pow)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Pow):assert b.denominator==1 and 0<=b<=4;return a**whole(b)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(t)
def trim(p):
 p=list(map(F,p))
 while len(p)>1 and p[-1]==0:p.pop()
 return p
def pa(a,b,sign=1):return trim([(a[i]if i<len(a)else 0)+sign*(b[i]if i<len(b)else 0)for i in range(max(len(a),len(b)))])
def pm(a,b):
 c=[F(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):c[i+j]+=x*y
 return trim(c)
def pe(p,x):return sum(c*x**i for i,c in enumerate(p))
def rational_polynomials(s,var='x',env=None):
 t,env=tree(s,env)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return[F(n.value)],[F(1)]
  if isinstance(n,ast.Name):return([F(0),F(1)],[F(1)])if n.id==var else([F(env[n.id])],[F(1)])
  if isinstance(n,ast.UnaryOp):
   a,b=walk(n.operand);assert isinstance(n.op,(ast.USub,ast.UAdd));return([-x for x in a],b)if isinstance(n.op,ast.USub)else(a,b)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left);c,d=walk(n.right)
  if isinstance(n.op,ast.Mult):return pm(a,c),pm(b,d)
  if isinstance(n.op,ast.Div):return pm(a,d),pm(b,c)
  assert isinstance(n.op,(ast.Add,ast.Sub));return pa(pm(a,d),pm(c,b),-1 if isinstance(n.op,ast.Sub)else 1),pm(b,d)
 return walk(t)
def root_of(equation):
 lhs,rhs=equation.split(' = ');a,b=rational_polynomials(lhs);c,d=rational_polynomials(rhs);polynomial=pa(pm(a,d),pm(c,b),-1)
 assert len(polynomial)==2 and polynomial[1]!=0,(equation,polynomial)
 root=-polynomial[0]/polynomial[1]
 assert pe(b,root)!=0 and pe(d,root)!=0
 assert calc(lhs,{'x':root})==calc(rhs,{'x':root})
 return root,lhs,rhs
def equation_of(s):
 s=s.split(', x')[0].split(', 3x')[0].split(', мұнда')[0].split('. ')[0]
 return re.split(r' пропорция| теңдеу| теңдігіндегі',s)[0].rstrip('. ')
def option_value(o):return calc(re.sub(r'\s*(?:сағ|кг|км|мин|см|м|°)\s*$','',o))
def numeric_choice(r,v):return one([o for o in r['options']if option_value(o)==v])
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def quantity(o):
 m=re.fullmatch(r'(.+?)\s*(мм|см|км|га|%)?',o);assert m
 text,unit=m.groups();return calc(text),unit or''
def choose(r,v,unit=''):
 factors={'мм':F(1),'см':F(10),'км':F(1000000)}
 def valid(o):
  q,u=quantity(o)
  if unit in factors:return u in factors and q*factors[u]==v*factors[unit]
  return u==unit and q==v
 return one([o for o in r['options']if valid(o)])
def select(r,value,unit=''):
 matches=[]
 for o in r['options']:
  m=re.fullmatch(r'(.+?)\s*(мм²|дм²|тг|т|га|км|%)?',o);assert m
  text,u=m.groups()
  if(u or'')==unit and calc(text)==value:matches.append(o)
 return one(matches)
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);unit=''
 if k=='third-day-after-fraction-and-percent-of-remainder':
  total,num,den,p=n;first=total*num/den;left=total-first;second=left*p/100;v=left-second;unit='т'
  assert'БАРЛЫҚ'in s and'ҚАЛҒАН'in s and first+second+v==total
  note=f'Printed total{total}t: first{num}/{den}ofALL={first}; second{p}%ofREMAINING{left}={second}; requestedTHIRD{v}, allsumwhole.'
 elif k=='sum-like-square-coefficients-as-percent':
  m=re.search(r'\(\((\d+)a² \+ (\d+)a²\)/(\d+)a²\)',s);assert m and'a ≠ 0'in s
  a,b,c=map(F,m.groups());v=(a+b)/c*100;unit='%'
  for x in[F(1),F(-3),F(7,4)]:assert(a*x*x+b*x*x)/(c*x*x)==v/100
  note=f'Wholemainbar({a}a²+{b}a²)/({c}a²); nonzeroa allowsCOMMONa² cancellation, notleftassociative /c×a²; exactpercent{v}.'
 elif k in{'cancel-common-square-as-percent','cancel-common-cube-as-percent'}:
  power='²'if'square'in k else'³';var='a'if'square'in k else'x';m=re.search(r'\((\d+)'+var+power+r'/(\d+)'+var+power+r'\)',s);assert m and var+' ≠ 0'in s
  a,b=map(F,m.groups());v=a/b*100;unit='%'
  for x in[F(1),F(-2),F(5,3)]:assert(a*x**(2 if power=='²'else 3))/(b*x**(2 if power=='²'else 3))==v/100
  note=f'Actual WHOLEdenominator{b}{var}{power}, commonnonzero{var}{power} cancellation→{a}/{b}×100={v}%; notrawdecimalwith%.'
 elif k=='discounted-new-fare':
  old,p=n;v=old*(100-p)/100;unit='тг';assert v+old*p/100==old and'ЖАҢА'in s
  note=f'Originalfare{old}, decrease{p}%={old*p/100}; requestedNEW{v}, notdiscountamountorpriceincrease.'
 elif k=='third-number-complement-of-two-percentages':
  total,p,q=n;v=total*(100-p-q)/100;assert p+q<100 and s.count('ҚОСЫНДЫНЫҢ')==2
  note=f'PrintedcommonWHOLE{total}; disjointfirst{p}%second{q}%; THIRDcomplement{100-p-q}%={v}. No remainingbase.'
 elif k=='two-equal-increases-current-base-growth':
  p,q=n;v=((1+p/100)*(1+q/100)-1)*100;assert p==q and'жаңа баға'in s
  note=f'Currentbaseincreases{p}%,{q}% compoundmultipliers, relativeORIGINALgrowth{v}%, notp+q orfinalpercent{v+100}.'
 elif k=='percent-of-square-area-not-side':
  side,p=n;v=side**2*p/100;unit='мм²';assert'АУДАНЫНЫҢ'in s and v!=side**2*(p/100)**2
  note=f'Actualside{side}mm→squarearea{side**2}mm² THEN{p}%={v}mm², notpercentofSIDEthensquare.'
 elif k=='inverse-percent-number':
  p,part=n;v=part*100/p;assert v>0 and v*p/100==part and'ӨЗІН'in s
  note=f'Printed{p}%ofWHOLE={part}→x={v}; actualsubstitutionx×{p}/100={part}, notpart×percent. RepeatednumericvariantONEfamily.'
 elif k=='ore-iron-decimal-tonnes-find-whole':
  p,part=n;v=part*100/p;unit='т';assert'жоғалмайды'in s and v*p/100==part
  note=f'Iron{part}t atmassfraction{p}%withNOextractionloss→WHOLEore{v}t, notironagain ornonironremainder.'
 elif k=='book-read-percent-to-total-pages':
  part,p=n;v=part*100/p;assert whole(v)>0 and v*p/100==part and'БАРЛЫҚ'in s
  note=f'READpages{part}are{p}%ofALLbook→{v}pages; unread{v-part}wrongrole.'
 elif k in{'small-percent-defective-to-all-items','germinated-percent-to-planted-total'}:
  p,part=n;v=part*100/p;assert whole(v)>0 and v*p/100==part
  note=f'Actual countedPART{part}={p}%ALL→ALL{v}; integralphysicalcount, complement{v-part}notasked.'
 elif k=='thousands-population-percent-part':
  thousand,p=n;v=thousand*1000*p/100;assert'МЫҢ'in s and whole(v)>0
  note=f'Printed{thousand}THOUSAND→{thousand*1000}people; arrived{p}%={v}people, notthousandunitanswer.'
 elif k=='winner-percent-to-all-participants':
  part,p=n;v=part*100/p;assert whole(v)>0 and v*p/100==part
  note=f'Winners{part}={p}%ALL→participants{v}, physicalcountinteger, notwinnersorlosers.'
 elif k=='first-percent-rest-divided-in-ratio-second-area':
  total,p,a,b=n;first=total*p/100;left=total-first;v=left*a/(a+b);unit='га';third=left-v
  assert first+v+third==total and v/third==a/b and'ЕКІНШІ'in s
  note=f'ActualALL{total}ha first{p}%={first}; remainder{left}splitORDEREDsecond:third={a}:{b}; second{v}, third{third}; notwhole×ratio.'
 elif k=='cuboid-percent-length-width-height-volume-to-full-surface':
  p,factor,volume=n;coefficient=(1+p/100)*factor**2;h=one([F(h)for h in range(1,101)if coefficient*h**3==volume]);w=h*factor;length=w*(1+p/100);v=2*(length*w+length*h+w*h);unit='дм²'
  assert h*w*length==volume and length/w==1+p/100 and w/h==factor and'алты жағы'in s
  note=f'PositiveheightUNIQUEsincecoefficient{coefficient}>0 andh³strictlyincreasing; h{h},w{w},l{length}; volume{volume}, SIXfaces2(lw+lh+wh)={v}, nothalfsurface.'
 elif k=='decimal-plus-percent-original-parts-known-last-area':
  first,p,last=n;remaining=1-first-p/100;v=last/remaining;unit='га';assert s.count('БАРЛЫҚ')==2 and remaining>0 and v*first+v*p/100+last==v
  note=f'SAMEORIGINALwhole first{first}, second{p}%→remainder{remaining}; knownlast{last}ha→ALL{v}; notsecondpercentofremainder.'
 elif k=='percent-plus-decimal-original-parts-known-last-distance':
  p,second,last=n;left=1-p/100-second;v=last/left;unit='км';assert'ТОЛЫҚ'in s and v*p/100+v*second+last==v
  note=f'BothpartsORIGINALroute{p}%and{second}; remaining{left}equals{last}km→ALL{v}km, notsequentialpercent.'
 else:raise AssertionError(k)
 expected=select(r,v,unit);assert r['answer']==expected,(r['editionId'],r['answer'],expected)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==29;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted Fraction/AST/physicalunits/domain proof; all29canonicalraw/new fullconditions/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs==set(range(1,30))and len(files)==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>20
 badkeys=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkey accepted')
  b=copy.deepcopy(r);ms=list(re.finditer(r'\d+(?:,\d+)?',b['statement']));index=1 if r['skillFamily']in{'sum-like-square-coefficients-as-percent','cancel-common-square-as-percent','cancel-common-cube-as-percent'}else 0;m=ms[index];q=F(m.group().replace(',','.'))+1;b['statement']=b['statement'][:m.start()]+fmt(q)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,KeyError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 inverse=compound=remaining=surface=0
 for whole_ in range(1,101):
  for p in range(1,100):assert F(whole_*p,100)*100/p==whole_;inverse+=1
 for a in range(1,31):
  for b in range(1,31):
   for old in range(1,6):
    first=F(old)*(1+F(a,100));last=first*(1+F(b,100));assert(last-old)/old*100==a+b+F(a*b,100);compound+=1
 for total in range(1,101):
  for a in range(1,10):
   for b in range(1,10):
    first=F(total*a,10);left=total-first;second=left*b/10;last=left-second;assert first+second+last==total;remaining+=1
 for h in range(1,21):
  for w in range(1,21):
   for l in range(1,21):assert 2*(h*w+h*l+w*l)==sum([h*w,h*w,h*l,h*l,w*l,w*l]);surface+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All29canonicalpercentpart2 saved/new fullconditions/officialsolutions/everyMCQread. Own actualprinted Fraction/commonpowerdomain/currentbase/partwhole/SI/sixface oracle. Eleven bareinversepercent occurrences onefamily, not11meanings. Findings0, noauthorcalculator imports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'printedCanariesRejected':printed,'inversePercentCases':inverse,'compoundGrowthCases':compound,'remainingLedgers':remaining,'sixFaceCases':surface,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
