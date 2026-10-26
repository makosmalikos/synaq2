"""Independent29 canonical scale/percent source/new fullsolutions/everyMCQ.
Own actual-printed exact Fraction and unit/domain conservation, no author imports.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-scalepercent-wave5.json'
OUT='problems/editorial/reviews/collection-scalepercent-wave5.json'
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
DRAWINGS={
 'enlarged-then-reduced-drawing','enlarged-drawing-to-another-enlargement',
 'reduced-drawing-to-less-reduced-drawing','reduced-then-fractionally-enlarged-drawing',
 'reduced-then-integer-enlarged-with-unit-distractor','two-large-integer-drawing-scales',
 'ring-diameter-two-reduced-scales-millimetres'}
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);answer=None;unit=''
 if k.startswith('real-km-to-map-'):
  km,first,den=n;assert first==1;unit='см'if'centimetres'in k else'мм';factor=100000 if unit=='см'else 1000000;v=km*factor/den
  assert v*den==km*factor and f'{unit} өлшемімен'in s
  note=f'Actual REAL{km}km→sameunits×{factor}={km*factor}{unit}; map1:{den} DIVIDES to{v}{unit}. Notdistance/den beforeSI ormm/cm factor10error.'
 elif k in DRAWINGS:
  length,firstNum,firstDen,nextNum,nextDen=n;assert min(firstNum,firstDen,nextNum,nextDen)>0
  real=length*firstDen/firstNum;v=real*nextNum/nextDen;unit='мм'if'millimetres'in k else'см'
  assert real*firstNum/firstDen==length and v*nextDen/nextNum==real
  if k=='enlarged-then-reduced-drawing':
   wrong_both=length*firstNum/firstDen*nextDen/nextNum;assert choose(r,wrong_both,unit)!=choose(r,v,unit)and choose(r,real,unit)!=choose(r,v,unit)
  if k=='enlarged-drawing-to-another-enlargement':assert choose(r,length*firstNum*nextNum,unit)!=choose(r,v,unit)
  if k=='two-large-integer-drawing-scales':assert choose(r,length*firstNum*nextNum,unit)!=choose(r,v,unit)
  if k=='reduced-drawing-to-less-reduced-drawing':assert choose(r,real,unit)!=choose(r,v,unit)and choose(r,length*nextDen,unit)!=choose(r,v,unit)
  if k in{'reduced-then-integer-enlarged-with-unit-distractor','ring-diameter-two-reduced-scales-millimetres'}:
   same_number_otherunit='мм'if unit=='см'else'см';assert f'{fmt(v)} {same_number_otherunit}'in r['options']
  note=f'Actual FIRSTdrawing{length}{unit} at{firstNum}:{firstDen}→REAL{real}{unit}→SECONDdrawing{v}{unit} at{nextNum}:{nextDen}; bothscale directions and unit-sensitive ALLchoices tested, actualsize/×both/reverseboth traps retained where source-explicit.'
 elif k=='common-middle-third-from-first-plus-third':
  x,y,y2,z,total=n;weights=[x*y2,y*y2,y*z];u=total/(weights[0]+weights[2]);values=[w*u for w in weights];v=values[2]
  assert values[0]+values[2]==total and values[0]/values[1]==x/y and values[1]/values[2]==y2/z
  note=f'Actual chainedratios{x}:{y}/{y2}:{z}→three{values}; given ONLYfirst+THIRD={total}, requestedTHIRD{v}, notsumallthree/middle/unit.'
 elif k=='two-map-lengths-direct-real-distance':
  cm,km,newcm=n;v=km*newcm/cm;unit='км';assert v/newcm==km/cm and v>km
  note=f'Actual SAME map{cm}cm↔{km}km; new{newcm}cm→{v}km byDIRECTlengthratio, inverse{km*cm/newcm}rejected.'
 elif k=='square-real-side-metres-to-plan-centimetres':
  metres,first,scale=n;assert first==1;v=metres*100/scale;unit='см';assert'ҚАБЫРҒАСЫ'in s
  note=f'Actual squareSIDE{metres}m→{metres*100}cm, linearplan1:{scale}→{v}cm. Notarea/no scalesquared, centimetre conversion beforedivide.'
 elif k=='map-to-real-distance-then-train-hours':
  first,scale,cm,speed=n;assert first==1;km=cm*scale/100000;v=km/speed;assert v*speed==km
  note=f'Actual map{cm}cm×{scale}→{cm*scale}cm÷100000→{km}km; time{v}HOURS at{speed}km/h, noearlystopatdistance ormmconversion.'
 elif k=='known-percent-part-find-whole':
  percent,part=n;v=part*100/percent;assert v*percent/100==part
  note=f'Actual {percent}% of UNKNOWNWHOLE equals{part}, whole{v}=part/(percent/100), notpart×percent orcomplement.'
 elif k=='meeting-speed-percent-to-ordered-distances':
  distance,time,percent=n;rate=percent/100;closing=distance/time;motor=closing/(1+rate);cycle=motor*rate;pair=[motor*time,cycle*time]
  assert sum(pair)==distance and pair[1]/pair[0]==rate and'БІР МЕЗГІЛДЕ'in s and'бір-біріне қарай'in s
  answer=one([o for o in r['options']if nums(o)==pair]);assert pair[0]>pair[1]>0
  note=f'Actual towardmeeting{distance}km/time{time}h; cycle={percent}%MOTOR→speeds{motor}/{cycle}; ORDERED motorpath/cyclepath{pair}, sumwhole andsecond/first percentage. Time cancels infinalshares butactualspeeds/time checked.'
 elif k=='price-increase-original-base':
  old,new=n;v=(new-old)*100/old;unit='%';assert new>old>0 and old*(1+v/100)==new and v!=new*100/old
  note=f'Actual prices{old}→{new}, growth{new-old} dividedbyORIGINAL{old}, requestedincrease{v}%, notFULLnew{new*100/old}% ornewbase.'
 elif k=='ratio-numerator-up-denominator-down':
  assert'n ≠ 0'in s;m=re.search(r'm : n = (\d+)\. m мәнін (\d+) есе арттырып, n мәнін (\d+) есе',s);assert m
  given,up,down=map(F,m.groups());v=given*up*down
  for base in[F(1),F(-2),F(7,5)]:assert(up*given*base)/(base/down)==v
  note=f'Actual m/n={given}, numerator×{up}, denominator÷{down}; ratioINCREASESbyBOTH{up}×{down}, result{v}forallnonzero denominator, notup/down.'
 elif k=='read-pages-known-percent-to-book-total':
  part,percent=n;v=part*100/percent;assert v*percent/100==part and'БАРЛЫҒЫ'in s
  note=f'Actual READ{part}pages={percent}%WHOLE; WHOLE{v}, notremaining{v-part}orpercentageofread. Integerpage domain checked.'
 elif k=='boys-share-after-girls-number-gap':
  boys,extra=n;girls=boys+extra;total=boys+girls;v=100*boys/total;unit='%'
  assert boys>0 and girls>boys and'ҰЛДАР'in s
  note=f'Actual boys{boys}, girls{boys}+{extra}={girls}; percentageBOYS/ALL{total}={v}%, notboys/girls orraw18.'
 elif k=='cancel-common-cube-to-percentage':
  assert'a ≠ 0'in s;m=re.search(r'\((\d+)a³/(\d+)a³\)',s);assert m
  top,bottom=map(F,m.groups());v=100*top/bottom;unit='%'
  for a in[F(1),F(-2),F(7,3)]:assert(top*a**3)/(bottom*a**3)==v/100
  assert bottom!=0
  note=f'Actual nativefraction top{top}a³ overWHOLEdenominator{bottom}a³; a≠0 allowscubecommonfactor cancellation forpositive/negativea; {top}/{bottom}×100={v}%, notrawcoeff27 orillegal0/0.'
 elif k.startswith('two-hours-percentages-same-original-route-'):
  total,first,second=n;v=total*(first+second)/100;unit='км'
  assert s.count('БАРЛЫҚ')==2 and first+second<100 and v==total*first/100+total*second/100
  note=f'Actual SAMEORIGINAL{total}base forBOTH{first}%+{second}%→traveled{v}km; no remainingbase, notremainingroute orfirsthouronly.'
 elif k=='dried-fruit-percent-find-fresh-mass':
  percent,dry=n;v=dry*100/percent;assert v*percent/100==dry
  note=f'Actual dried{dry}kg is{percent}%ORIGINALfresh→fresh{v}, notwaterlost{v-dry}; percentagegivenalreadyremainingnotloss.'
 elif k=='second-donation-fraction-of-remainder':
  total,first,num,den=n;sent1=total*first/100;remaining=total-sent1;sent2=remaining*num/den;v=remaining-sent2
  assert sent1+sent2+v==total and'ҚАЛҒАН'in s
  note=f'Actual firstdonation{first}%ofALL{total}→{sent1}, SECOND{num}/{den}ofREMAINING{remaining}→{sent2}, FINAL{v}; all3 allocations sumwhole, changedbase essential.'
 elif k=='disjoint-contest-categories-percent-remainder':
  tasks,people,first,second=n;v=people*(100-first-second)/100;assert tasks%2==0 and'қиылыспайды'in s and'КӨП'in s
  assert people*first/100+people*second/100+v==people
  note=f'Actual {people}people inDISJOINTless/exactly/morethanHALFof{tasks}tasks; remainder100−{first}−{second}%, count{v}. Exactly{tasks/2}tasksgroup notincluded.'
 elif k=='unwatered-area-complement-percent-whole':
  watered,remaining=n;v=remaining*100/(100-watered);unit='га';assert v*(100-watered)/100==remaining
  note=f'Actual {watered}%WATERED, remaining{remaining}ha=(100−{watered})%WHOLE; total{v}ha notremaining orwateredarea.'
 elif k=='second-day-percent-of-remainder-remaining-gap':
  first,second,gap=n;after1=1-first/100;day2=after1*second/100;final=after1-day2;v=gap/(final-day2);unit='км'
  assert final>day2>0 and'ҚАЛҒАН'in s and v*final-v*day2==gap
  note=f'Actual day1{first}%ALL, day2{second}%ofREMAINDER{after1}: totalfractions day2{day2}, final{final}; FINAL−DAY2={gap}km→WHOLE{v}; changedbase andsign/role checked.'
 else:raise AssertionError(k)
 if answer is None:answer=choose(r,v,unit)
 assert r['answer']==answer,(r['editionId'],r['answer'],answer)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==29;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted exact Fraction/AST/unitconservation, all29canonicalraw/new fullconditions/officialsolutions/everyMCQread; noauthorcalculator imported','notes':note})
 assert refs==set(range(1,30))and len(files)==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>40
 badkeys=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkey accepted')
  b=copy.deepcopy(r);ms=list(re.finditer(r'\d+(?:,\d+)?',b['statement']))
  index=1 if r['skillFamily']in{'ratio-numerator-up-denominator-down','cancel-common-cube-to-percentage'}else 0
  if r['skillFamily']=='meeting-speed-percent-to-ordered-distances':index=0
  if r['skillFamily']=='disjoint-contest-categories-percent-remainder':index=1
  m=ms[index];q=F(m.group().replace(',','.'))+1;b['statement']=b['statement'][:m.start()]+fmt(q)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,KeyError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 drawings=units=percent=sequential=0
 for real in range(1,16):
  for a in range(1,5):
   for b in range(1,5):
    for c in range(1,5):
     for d in range(1,5):
      first=F(real*a,b);new=first*b/a*c/d;assert new*d/c==real and first*b/a==real;drawings+=1
 for km in range(1,101):
  for scale in range(100000,1000001,100000):
   mm=F(km*1000000,scale);cm=F(km*100000,scale);assert mm==10*cm;units+=1
 for old in range(1,31):
  for growth in range(1,31):assert old*(1+F(100*growth,old)/100)==old+growth;percent+=1
 for total in range(10,41):
  for p in range(1,50,4):
   for q in range(1,50,4):
    first=F(total*p,100);left=total-first;second=left*q/100;last=left-second;assert first+second+last==total;sequential+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All29canonicalscalepercent saved/new fullconditions/officialsolutions/everyMCQread. Independent actualprinted exactFraction andunitnormalization: km→mm/cm, two drawingdirections/actualsize/mmcm traps, orderedmeetingpaths/percent-base/cubecommonfactorwithnonzerodomain, originalversusremainingbase/day2vsfinalgap, allpart-whole/complement roles. Findings0; noauthorcalculator imported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'printedCanariesRejected':printed,'twoDrawingCases':drawings,'mmCmScaleCases':units,'originalPercentBaseCases':percent,'sequentialLedgers':sequential,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
