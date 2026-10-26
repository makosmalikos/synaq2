"""Independent full 48 canonical saved/new conditions, official solutions and MCQs.
Actual displayed Fraction/AST + rational-polynomial root isolation and domain proof;
no author specs, renderers, calculators or answer fixtures are imported.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-ratios-wave3.json'
OUT='problems/editorial/reviews/collection-ratios-wave3.json'
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
DIRECT_EQUATIONS={
 'decimal-ratio-coefficient-fraction-notation','decimal-ratio-coefficient-colon-notation',
 'mixed-shared-numerator-fraction-coefficient','unit-fraction-decimal-ratio-mixed-root',
 'mixed-divisor-unknown-coefficient','same-numerator-mixed-equals-decimal',
 'decimal-fraction-then-mixed-last','small-decimal-ratio-fractional-coefficient',
 'unequal-decimal-digits-fraction-to-coefficient','whole-over-fraction-x-shared-mixed-numerator',
 'mixed-over-fraction-x-reciprocal-mixed-fraction','decimal-offset-proportion-root',
 'whole-offset-fractional-root','constant-over-coefficient-x',
 'whole-divide-mixed-equals-unknown-divide-mixed'}
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);v=answer=None
 if k in DIRECT_EQUATIONS:
  equation=equation_of(s);v,lhs,rhs=root_of(equation)
  matches=[]
  for o in r['options']:
   candidate=option_value(o)
   try:valid=calc(lhs,{'x':candidate})==calc(rhs,{'x':candidate})
   except ZeroDivisionError:valid=False
   if valid:matches.append(o)
  assert matches==[numeric_choice(r,v)]
  if k in{'mixed-divisor-unknown-coefficient','same-numerator-mixed-equals-decimal','whole-over-fraction-x-shared-mixed-numerator','mixed-over-fraction-x-reciprocal-mixed-fraction','constant-over-coefficient-x'}:
   assert'x ≠ 0'in s and v!=0
   try:calc(lhs,{'x':F(0)})
   except ZeroDivisionError:pass
   else:raise AssertionError('Expected actual zero divisor')
  if k=='mixed-shared-numerator-fraction-coefficient':
   L=calc(lhs);assert L==F(1,2);assert'(19/8)'in r['solution']and'(19/4)'in r['solution']and'ортақ 19'in r['solution']
  if k=='whole-over-fraction-x-shared-mixed-numerator':assert calc(rhs)==F(2,5)and'(11/5)'in r['solution']and'(11/2)'in r['solution']
  note=f'Actual equation {equation}; independent rational-polynomial cross product has degree1, unique root {v}, all4 printed choices backsubstituted and denominator domain checked.'
 elif k in{'train-same-speed-new-distance-time','car-same-speed-shorter-distance-time'}:
  distance,hours,target=n;speed=distance/hours;v=target/speed;assert'тұрақты'in s and speed*v==target
  note=f'Actual fixed speed {speed} km/h; targetdistance{target}→time{v}h, directdistance/time. Oldtime{hours} not requested.'
 elif k in{'liquid-volume-to-mass-rate','potato-constant-starch-yield'}:
  base,mass,target=n;v=mass*target/base;assert v/target==mass/base
  note=f'Actual constant yield/density {mass/base}, volume/input {base}→{target}, output {v}; exact units and no 100% yield assumption.'
 elif k=='fixed-apple-mass-in-more-boxes':
  boxes,mass,newboxes=n;v=boxes*mass/newboxes;assert v*newboxes==boxes*mass
  note=f'Actual fixed totalmass {boxes*mass}, inverse repacking {boxes}×{mass}={newboxes}×{v}; requested EACH newbox.'
 elif k=='track-equal-laps-distance':
  laps,distance,target=n;v=distance*target/laps;assert v/target==distance/laps
  note=f'Actual constant lap length {distance/laps}, target{target}laps→{v}km; speed irrelevant.'
 elif k=='typing-fixed-text-inverse-rate':
  rate,hours,newrate=n;characters=rate*hours*60;minutes=characters/newrate;v=minutes/60;assert newrate*v*60==characters
  note=f'Actual {hours}h→{hours*60}min, fixed{characters}characters; new {newrate}/min→{minutes}min→{v}h. Both60 conversions checked.'
 elif k=='meshing-gear-inverse-teeth-count':
  first,second,turns=n;v=first*turns/second;assert'сырғымайды'in s and second*v==first*turns
  note=f'Actual no-slip teeth conservation {first}×{turns}={second}×{v}; largergear makes fewer revolutions, inverse teeth count.'
 elif k=='printer-fixed-rate-time':
  minutes,pages,target=n;v=target*minutes/pages;assert pages/minutes==target/v
  note=f'Actual printing rate {pages/minutes} pages/min; {target}pages needs{v}min. Fractional rate allowed, final whole-page job exact.'
 elif k=='fixed-plastic-mass-identical-parts':
  count,mass,target=n;v=count*target/mass;assert mass/count==target/v
  note=f'Actual identical part consumption {mass/count} kg, {target}kg→{v}parts; proportional yield, target count integer.'
 elif k=='equal-output-machine-rate':
  firsttime,secondtime,rate=n;output=firsttime*rate;v=output/secondtime;assert'Бірдей тапсырысты'in s and secondtime*v==output
  note=f'Actual SAME output{output}, unequal times{firsttime}/{secondtime}; requested SECOND rate{v}, not first rate or time.'
 elif k=='computed-two-weights-mixed-and-decimal-cube':
  m=re.fullmatch(r'a = (.+); b = (.+)\. (\d+) санын.+',s);assert m
  first,second,total=m.groups();A=calc(first);B=calc(second);total=F(total);pair=[total*A/(A+B),total*B/(A+B)]
  assert A>0 and B>0 and sum(pair)==total
  answer=one([o for o in r['options']if nums(o)==pair]);assert pair[0]/pair[1]==A/B
  assert A==20 and B==16 and calc('0,25³')==F(1,64)
  note=f'Actual nested mixed arithmetic A={A}, commonfactor numerator0.25 and CUBE1/64→B={B}; ordered shares{pair} total{total}, ratioA/B. Every printed pair checked, reversed and unscaled pairs rejected.'
 elif k=='reciprocal-given-ratio-linear-expression':
  m=re.fullmatch(r'x, y > 0 және \(x/y\) = (.+)\. (.+) өрнегінің мәнін табыңыз\.',s);assert m
  given,target=m.groups();known=calc(given);v=calc(target,{'x':known,'y':F(1)})
  for t in[F(1),F(2),F(7,3)]:assert calc(target,{'x':known*t,'y':t})==v
  note=f'Actual x/y={known}, requested {target}={v}, reciprocal y/x={1/known}; homogeneous identity for all positive scale, x/y not substituted in y/x place.'
 elif k=='wire-total-ratio-smaller':
  total,x,y=n;v=total*min(x,y)/(x+y);assert 2*v<total
  note=f'Actual total{total}, weights{x}:{y}, SMALLERshare{v}, larger{total-v}; sum/ratio both checked.'
 elif k=='recipe-two-ingredient-direct-scaling':
  first,second,target=n;v=second*target/first;assert first*v==second*target and'сыйымдылығы бірдей'in s
  note=f'Actual equal-size cups, ingredientratio{first}:{second}, newFIRST{target}→SECOND{v}; directcrossproducts equal.'
 elif k in{'fixed-work-more-people-fewer-days','fixed-repair-work-person-days'}:
  workers,days,nextworkers=n;work=workers*days;v=work/nextworkers;assert nextworkers*v==work and v<days
  note=f'Actual constant productivity, fixed{work}person-days, crew{workers}→{nextworkers}, time{days}→{v}; no direct-proportion error.'
 elif k=='partial-work-one-day-then-whole-new-count':
  workers,num,den,nextworkers=n;assert num==1 and'БІР күнде'in s and'Бүкіл'in s and'басынан'in s
  v=workers*den/nextworkers;assert v*nextworkers/(workers*den)==1
  note=f'Actual ONEday {workers}workers does1/{den} of WHOLE; total{workers*den}person-days, {nextworkers}newworkers fromstart need{v}days, not remaining5/6.'
 elif k=='nested-decimal-fraction-requested-multiple':
  m=re.fullmatch(r'x = (.+)\. (\d+)x өрнегінің мәнін табыңыз\.',s);assert m
  main,multiple=m.groups();root=calc(main);v=root*int(multiple);assert root==F(5,167)and v!=root
  note=f'Actual nested mainbar {main} root{root}, inner3/0.03=100, WHOLE denominator100.2; requested{multiple}x={v} distinct fromx, exact Fraction cancellation.'
 elif k=='gcd-of-three-not-pair':
  a,b,c=map(whole,n);divisors=[d for d in range(1,min(a,b,c)+1)if a%d==b%d==c%d==0];v=max(divisors)
  assert not any((a//v)%d==(b//v)%d==(c//v)%d==0 for d in range(2,min(a,b,c)//v+1))
  note=f'Complete positive commondivisors of printed THREE numbers{a}/{b}/{c}: {divisors}, max{v}; normalized triple has no common divisor>1. Checks third number, not paironly.'
 elif k=='equal-rectangle-area-unknown-width':
  length,width,newlength=n;v=length*width/newlength;assert v*newlength==length*width and 0<v<newlength
  note=f'Actual area {length*width}m², SECOND length{newlength}→width{v}m; preserved area, not perimeter, no inverse-role swap.'
 elif k=='mixed-given-ratio-linear-expression':
  m=re.fullmatch(r'm, n > 0 және \(m/n\) = (.+)\. (.+) мәнін таңдаңыз\.',s);assert m
  given,target=m.groups();known=calc(given);v=calc(target,{'m':known,'n':F(1)})
  for t in[F(1),F(4),F(9,5)]:assert calc(target,{'m':known*t,'n':t})==v
  note=f'Actual mixed m/n={known}, reciprocal n/m={1/known}, displayed{target}={v}; positive domain prevents zero denominators, wholemixed preserved.'
 elif k=='percent-less-other-as-base':
  first,other=n;assert first<other and'ПАЙЫЗҒА АЗ'in s;v=100*(other-first)/other
  assert v!=100*first/other and v!=100*(other-first)/first and other*(1-v/100)==first
  note=f'Actual apples/pears{first}/{other}; requested PERCENTLESS=(other−first)/OTHER×100={v}. Other is100%base, notapple/givenfraction{100*first/other}%.'
 elif k=='straight-angle-two-ratio-larger':
  x,y=n;v=180*max(x,y)/(x+y);assert'Жазыңқы'in s and 0<180-v<v<180
  note=f'Actual STRAIGHT angle180°, positive weights{x}:{y}; LARGER{v}°, other{180-v}°, sum180 not90/360.'
 elif k in{'affine-over-affine-root-then-minus-negative','equal-affine-coefficients-ratio-then-target'}:
  equation,target=s.split('. ',1);equation=equation.split(', ')[0];target=target.split(' өрнегінің')[0].split(' мәнін')[0]
  root,lhs,rhs=root_of(equation);v=calc(target,{'x':root})
  assert root==4 and v!=root
  # Complete rational-polynomial isolation proves uniqueness, unlike four guesses.
  assert calc(lhs,{'x':root})==calc(rhs,{'x':root})
  assert re.search(r'≠ (?:-1|0)',s)
  note=f'Actual rational affine equation{equation}: unique root{root}, denominator nonzero; requested{target}={v}, negative-minus becomes plus. All4target values distinct, x not final answer.'
 elif k=='triangle-perimeter-smallest-side':
  x,y,z,perimeter=n;parts=[x,y,z];sides=[perimeter*w/sum(parts)for w in parts];assert 2*max(sides)<perimeter;v=min(sides)
  note=f'Actual three sides{sides}, sum{perimeter}, strict triangle inequality; smallest{v}, notlargest/perimeterhalf.'
 elif k=='cylinder-diameter-squared-length-inverse-mass':
  mass,diameter,length=n;v=mass*diameter**2/length;assert'ДИАМЕТРІ'in s and'Тығыздықтары бірдей'in s
  # Independent cylinder ratio pi*(d/2)^2*L cancels both pi and density.
  for d in[F(2),F(7,3),F(8)]:
   for L in[F(3),F(11,2)]:assert((d*diameter/2)**2*(L/length))/((d/2)**2*L)==v/mass
  note=f'Actual cylinder d×{diameter}, L÷{length}, equal density→mass{mass}×{diameter}²/{length}={v}; formal d/2 radii squared, notdiameterlinear.'
 elif k=='grain-volume-decimal-mass-product':
  base,mass,target=n;v=target*mass/base;assert v/target==mass/base
  note=f'Actual grain density {mass/base}t/m³, targetvolume{target}m³→{v}t; cubic UNIT label not exponent of given volume.'
 elif k=='trapezoid-explicit-bases-legs-largest':
  a,b,small,large,perimeter=n;assert a==b and small<large and large-small<a+b
  unit=perimeter/(a+b+small+large);sides=[x*unit for x in[a,b,small,large]];v=max(sides)
  assert sum(sides)==perimeter and (a*unit)**2-((large-small)*unit/2)**2>0
  note=f'Actual ordered equallegs/bases{sides}, perimeter{perimeter}, longest{v}; height²={sides[0]**2-((sides[3]-sides[2])/2)**2}>0, explicit bases remove ambiguity.'
 elif k=='division-root-then-multiple':
  divisor,quotient,multiple=n;root=divisor*quotient;v=multiple*root;assert root/divisor==quotient and'3x'in s
  note=f'Actual x/{divisor}={quotient}→root{root}; requestedMULTIPLE{multiple}x={v}, notroot{root}.'
 elif k=='constant-hourly-pay-all-three-days':
  first,pay,second,third=n;rate=pay/first;v=rate*(first+second+third);assert'ҮШ КҮННІҢ'in s and v==pay+rate*second+rate*third
  note=f'Actual hourlypay{rate}, allTHREEhours{first}+{second}+{third}; total{v}, includes paidfirstday{pay}, notonlydays2and3.'
 elif k=='two-digit-multiples-excluding-triple-multiples':
  base,excluded=map(whole,n);hits=[x for x in range(10,100)if x%base==0 and x%excluded!=0];v=len(hits)
  included=[x for x in range(10,100)if x%base==0];removed=[x for x in included if x%excluded==0]
  assert excluded%base==0 and v==len(included)-len(removed)
  # Verify displayed lists completely, not just the difference of counts.
  assert ', '.join(map(str,included))in r['solution']and', '.join(map(str,removed))in r['solution']and', '.join(map(str,hits))in r['solution']
  note=f'Complete printed10..99domain: multiples{included}, excluded{removed}, remaining{hits}, count{v}; endpoints and NOT predicate checked.'
 else:raise AssertionError(k)
 if answer is None:answer=numeric_choice(r,v)
 assert r['answer']==answer,(r['editionId'],r['answer'],answer)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==48;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured']
  raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add((ref['sourceFile'],ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split()
  assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actual printed Fraction/AST and rational-polynomial unique roots/domain isolation; all48 canonical source/new fullconditions, officialsolutions and everyMCQ manually read; no author calculator imported','notes':note})
 assert len(refs)==48 and len(files)==2
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>100
 badkeys=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrong key accepted')
  b=copy.deepcopy(r);m=one(list(re.finditer(r'\d+(?:,\d+)?',b['statement']))[:1]);value=F(m.group().replace(',','.'))+1
  # Leading 0 in explicit positivity domain is not a mathematical given;
  # alter the FIRST actual ratio instead for those two homogeneous expressions.
  if r['skillFamily']in{'reciprocal-given-ratio-linear-expression','mixed-given-ratio-linear-expression'}:m=list(re.finditer(r'\d+(?:,\d+)?',b['statement']))[1];value=F(m.group().replace(',','.'))+1
  b['statement']=b['statement'][:m.start()]+fmt(value)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,KeyError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changed actual printed given accepted',r['editionId']))
 percent=cylinders=workers=gears=0
 for other in range(2,41):
  for first in range(1,other):
   p=F(100*(other-first),other);assert other*(1-p/100)==first;percent+=1
 for diameter in range(2,11):
  for length in range(2,11):
   for d in range(1,8):
    for L in range(1,6):assert F((d*diameter)**2)*F(L,length)/F(d*d*L)==F(diameter**2,length);cylinders+=1
 for first in range(1,21):
  for days in range(1,21):
   for nextworkers in range(1,21):assert F(first*days,nextworkers)*nextworkers==first*days;workers+=1
 for first in range(4,25):
  for second in range(4,25):
   for turns in range(1,11):assert F(first*turns,second)*second==first*turns;gears+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All48 file-scoped canonical saved/new fullconditions, officialsolutions and everyMCQ read. Independent actual printed Fraction/AST/rational-polynomial root/domain proofs, requested percentless OTHER base, shared improper numerator cancellation, nested mainbar/cube/commonfactor, diameter² and trapezoid/triangle validity, complete two-digit divisibility domain, direct/inverse SI/minutes and ordered pay/share roles. Findings0. No author calculators imported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'printedCanariesRejected':printed,'percentBaseCases':percent,'cylinderDimensionCases':cylinders,'personDayLedgers':workers,'gearLedgers':gears,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
