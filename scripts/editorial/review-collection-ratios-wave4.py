"""Independent34 saved/new fullconditions, officialsolutions and everyMCQ.
Exact displayed Fraction/AST and rational-polynomial unique roots/domains.
No author calculators/specs/renderers imported.
"""
from pathlib import Path
from fractions import Fraction as F
from math import isqrt
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-ratios-wave4.json'
OUT='problems/editorial/reviews/collection-ratios-wave4.json'
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
def option_value(o):return calc(re.sub(r'\s*(?:сағ|кг|км|мин|см²|см|м|тг|г|°)\s*$','',o))
def numeric_choice(r,v):return one([o for o in r['options']if option_value(o)==v])
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def sqroot(q):
 q=F(q);assert q>0;a=isqrt(q.numerator);b=isqrt(q.denominator);assert a*a==q.numerator and b*b==q.denominator;return F(a,b)
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);v=answer=None
 if k in{'mixed-reciprocal-proportion-root-only','whole-over-x-equals-decimal-ratio','decimal-left-ratio-fraction-coefficient','nested-divisor-affine-backwards'}:
  equation=s.split(', x')[0].split(', мұнда')[0].split(' пропорция')[0];v,lhs,rhs=root_of(equation)
  actual=[]
  for o in r['options']:
   candidate=option_value(o)
   try:valid=calc(lhs,{'x':candidate})==calc(rhs,{'x':candidate})
   except ZeroDivisionError:valid=False
   if valid:actual.append(o)
  assert actual==[numeric_choice(r,v)]
  if k=='nested-divisor-affine-backwards':assert'28 − 2x ≠ 0'in s and calc('28 − 2x',{'x':v})!=0
  elif k!='decimal-left-ratio-fraction-coefficient':assert'x ≠ 0'in s and v!=0
  note=f'Actual {equation}; unique rational-polynomial root{v}, denominators nonzero, all4 candidates backsubstituted. RequestedROOTonly, notmultiple.'
 elif k=='same-mixture-component-share':
  total,copper,newtotal=n;v=copper*newtotal/total;assert 0<copper<total and v/newtotal==copper/total
  note=f'Actual SAMEcomposition copper{copper}/{total}, newtotal{newtotal}→copper{v}g; notallmixture or oldcopper.'
 elif k in{'workforce-factor-time-inverse-plain','workforce-factor-time-inverse-with-units'}:
  workers,hours,factor=n;v=hours/factor;new=workers*factor;assert new*v==workers*hours
  note=f'Actual fixed{workers*hours}person-hours, {workers}workers×{factor}→{new}, time{hours}÷{factor}={v}h. Firstworker count cancels algebraically, positive integral crew remains.'
 elif k=='two-side-ratios-all-three-triangle-lengths':
  x,y,y2,z,perimeter=n;weights=[x*y2,y*y2,y*z];sides=[perimeter*w/sum(weights)for w in weights]
  answer=one([o for o in r['options']if nums(o)==sides]);assert sum(sides)==perimeter and sides[0]/sides[1]==x/y and sides[1]/sides[2]==y2/z and 2*max(sides)<perimeter
  note=f'Actual AB/BC={x}/{y}, BC/AC={y2}/{z}, P{perimeter}→ORDEREDAB/BC/AC{sides}; all3 lengthroles, both ratios/sum/triangleinequalities and everyfullcandidate checked.'
 elif k=='circle-area-ratio-to-circumference-ratio':
  first,second=n;v=sqroot(first/second)
  assert v*v==first/second and v>0
  note=f'Actual orderedAREAratio{first}/{second}; positive radiusratio sqrt={v}; circumference linearinradius soSAME{v}, notarea ratio or reversedroots.'
 elif k=='negative-given-ratio-scaled-denominator':
  assert'b ≠ 0'in s;m=re.search(r'0, (.+) = (.+)\. (.+) өрнегін',s);assert m
  given,known,target=m.groups();q=calc(known);coefficient=calc(given,{'a':F(1),'b':F(1)});ratio=q/coefficient;v=calc(target,{'a':ratio,'b':F(1)})
  for b in[F(1),F(-2),F(5,3)]:assert calc(given,{'a':ratio*b,'b':b})==q and calc(target,{'a':ratio*b,'b':b})==v
  note=f'Actual NEGATIVEgiven{given}={q}, a/b={ratio}; target{target}={v}forALLnonzero b scales, outerdenominator4 preserved, noabs or lostnegative.'
 elif k=='verbal-improper-part-of-part':
  numerals={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10}
  denominators={'төрттен':4,'бестен':5,'оннан':10}
  pairs=re.findall(r'(төрттен|бестен|оннан) (бір|екі|үш|төрт|бес|алты|жеті|сегіз|тоғыз|он)',s);assert len(pairs)==3
  first,second,target=[F(numerals[num],denominators[den])for den,num in pairs];v=target/(first*second);assert first>1 and v*first*second==target
  note=f'Actual Kazakh verbal denominators/numerators →{first}then{second}, target{target}; x={v}; improperFIRSTpart>1 is multiplied, no reversal.'
 elif k=='rectangle-ratio-gap-to-decimal-perimeter':
  width,length,gap=n;unit=gap/(length-width);a=width*unit;b=length*unit;v=2*(a+b);assert b-a==gap and b/a==length/width
  note=f'Actual width/length{width}:{length}, GAP{gap}→sides{a}/{b}; P{v}, nothalfP{v/2}; exactdecimal unit{unit}.'
 elif k=='second-colour-fraction-of-whole':
  first,second=n;v=second/(first+second);assert'САРЫ'in s and'ғана бар'in s
  note=f'Actual ONLYtwo colours {first}:{second}; SECONDcolour/WHOLE={second}/({first}+{second})={v}, notfirstwhole orpartpart.'
 elif k=='second-food-share-of-total':
  total,first,second=n;v=total*second/(first+second);assert'ШИЕ'in s and v+total*first/(first+second)==total
  note=f'Actual total{total}, FIRSTapple/SECONDcherry{first}:{second}, requestedCHERRY{v}, other{total-v}.'
 elif k=='computed-weights-outer-ratio-denominator':
  m=re.fullmatch(r'a = (.+); b = (.+)\. (.+) өрнегінің мәнін таңдаңыз\.',s);assert m
  first,second,target=m.groups();A=calc(first);B=calc(second);v=calc(target,{'a':A,'b':B})
  assert A==F(35,2)and B==5 and v==F(130,7)and calc('0,3²')==F(9,100)
  assert v!=calc('(65/a) : b',{'a':A,'b':B})
  note=f'Actual mixed arithmetic A={A}; numerator commonfactor0.3*(2.8−1.3)=0.45 divided bySQUARE0.09→B={B}; wholeouterdenominator(a:b)={A/B}, target{target}={v}. Not(65/a):b orratioalone.'
 elif k=='constant-speed-new-time-distance':
  distance,hours,newhours=n;v=distance*newhours/hours;assert v/newhours==distance/hours
  note=f'Actual speed{distance/hours}km/h, requestedNEW{newhours}h→{v}km, nooldtotal reuse.'
 elif k=='negative-decimal-root-then-affine-expression':
  equation,target=s.split('. ',1);target=target.split(' өрнегінің')[0];root,lhs,rhs=root_of(equation);v=calc(target,{'x':root});assert root<0 and v!=root
  note=f'Actual signed proportion{equation}, unique NEGATIVEroot{root}; requested{target}={v}, neitherroot norcoefficient×root alone. Bothsides exactlybacksubstitute.'
 elif k=='both-ratio-members-same-factor':
  assert'n ≠ 0'in s;m=re.search(r'm : n = (\d+)\. ЕКІ санды да (\d+) есе',s);assert m
  given,factor=map(F,m.groups());v=given
  for base in[F(1),F(-3),F(5,2)]:assert calc(f'({whole(factor)}m) : ({whole(factor)}n)',{'m':given*base,'n':base})==v
  note=f'Formal identical nonzero scaling{factor} cancels BOTHnumerator anddenominator; givenratio{given} remains{v}forallnonzero n, not×factor or÷factor.'
 elif k=='equal-item-price-new-quantity':
  count,paid,target=n;unit=paid/count;v=unit*target;assert v/target==unit
  note=f'Actual unitprice{unit}tг each, new{target}items total{v}; old{paid}for{count}items notunitanswer.'
 elif k=='first-group-share-of-large-total':
  total,first,second=n;v=total*first/(first+second);assert'ҚЫЗДАР'in s and v/(total-v)==first/second
  note=f'Actual GIRLS:BOYS{first}:{second}, whole{total}, requestedFIRSTgirls{v}, boys{total-v}; sum/ratio both checked.'
 elif k=='mixed-same-denominator-requested-root-multiple':
  equation,target=s.split('. ',1);equation=equation.split(', x')[0];root,lhs,rhs=root_of(equation);target=target.split(' мәнін')[0];v=calc(target,{'x':root});assert root!=0 and v!=root and'x ≠ 0'in s
  note=f'Actual same5denominator mixed44/5 and11/5; unique validroot{root}, requested{target}={v}; x≠0, allfractionwholeparts retained, root notfinalchoice.'
 elif k=='sum-of-unit-ratios-symbolic-denominator-gap':
  assert'n ≠ 0'in s;m=re.search(r'\(m/n\) = (.+)\. (.+) мәнін',s);assert m
  given,target=m.groups();ratio=calc(given);assert ratio!=1;v=calc(target,{'m':ratio,'n':F(1)})
  for scale in[F(1),F(-2),F(7,3)]:assert calc(target,{'m':ratio*scale,'n':scale})==v
  note=f'Actual m/n={ratio}fromSUMunitfractions; denominator(n−m)=(1−{ratio})n≠0; target{target}={v}forallnonzero n, commonfactor cancels safely.'
 elif k.startswith('area-to-same-radius-circumference-'):
  area,pi=n;assert pi==F(314,100)and'π = 3,14'in s;radius=sqroot(area/pi);v=2*pi*radius
  assert pi*radius**2==area and'ҰЗЫНДЫҒЫН'in s
  note=f'Actual AREA{area}cm², explicitπ3.14→r²{area/pi}, POSITIVEr{radius}; requested C=2πr={v}cm, notr orr²/area.'
 elif k.startswith('diameter-fractional-arc-'):
  diameter,num,den,pi=n;assert pi==F(314,100)and'диаметрі'in s and 0<num<den
  circumference=pi*diameter;v=circumference*num/den;assert 0<v<circumference
  note=f'Actual DIAMETER{diameter}, π3.14→C{circumference}, requestedARC fraction{num}/{den} gives{v}; dnotradius, fullCnotanswer.'
 elif k=='diameter-wheel-full-turn-distance':
  diameter,turns,pi=n;assert pi==F(314,100)and'СЫРҒЫМАЙ'in s;v=pi*diameter*turns
  note=f'Actual DIAMETER{diameter}cm, no-slip{turns}FULLturns, eachπd{pi*diameter}→total{v}cm; onecircumferenceorhalfradiuserror rejected.'
 elif k.startswith('circumference-smaller-radius-area-'):
  circumference,factor,pi=n;assert pi==F(314,100)and'ЖАҢА'in s;radius=circumference/(2*pi);new=radius/factor;v=pi*new**2
  assert 2*pi*radius==circumference and v/(pi*radius**2)==1/factor**2
  note=f'Actual circumference{circumference}, π3.14→OLDr{radius}; NEWradius{new}=old/{factor}; requested NEWarea{v}cm², quadraticshrink1/{factor**2}, notlinear oroldarea.'
 elif k=='largest-inscribed-disc-square-remainder':
  side,pi=n;assert pi==F(314,100)and'ЕҢ ҮЛКЕН'in s and'Қалған'in s;radius=side/2;v=side**2-pi*radius**2
  assert 0<v<side**2
  note=f'Actual largest fittingdisc diameter=SIDЕ{side}, radius{radius}; square{side**2}−disc{pi*radius**2}={v}cm² REMAINDER, notcutdisc; anyfittingcircle diameter≤side provesmax.'
 elif k=='concentric-ring-difference-of-squares':
  outer,inner,pi=n;assert pi==F(314,100)and outer>inner>0 and'Ортақ центрлі'in s;v=pi*(outer**2-inner**2)
  assert v==pi*(outer-inner)*(outer+inner)and v!=pi*(outer-inner)**2
  note=f'Actual CONCENTRICradii{outer}/{inner}, annulusπ(R²−r²)={v}, independentfactorizationπ(R−r)(R+r), notsquareofwidth.'
 elif k=='radius-wheel-full-turn-distance':
  radius,turns,pi=n;assert pi==F(314,100)and'РАДИУСЫ'in s and'сырғымай'in s;v=2*pi*radius*turns
  note=f'Actual RADIUS{radius}m, diameter2r; no-slip{turns}fullturns×2πr={v}m. Distinct fromdiameterquestion, factor2essential.'
 else:raise AssertionError(k)
 if answer is None:answer=numeric_choice(r,v)
 assert r['answer']==answer,(r['editionId'],r['answer'],answer)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==34
 entries=[];refs=set();files={}
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add((ref['sourceFile'],ref['sourceId']));files.setdefault(ref['sourceFile'],set()).add(int(ref['sourceId']));norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement'])
  note=solve(r);assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted exact Fraction/AST, rational-polynomial uniqueness/domain and complete orderedcandidate roles; all34canonicalraw/new/fullofficialsolutions/everyMCQread, noauthorcalculator imported','notes':note})
 assert len(refs)==34 and len(files)==2 and sorted(map(len,files.values()))==[12,22]
 assert sorted(files['problems/sources/zerek/collections/b20e44ff-fb29-4273-8b42-de067aeca247.json'])==list(range(1,23))
 assert sorted(files['problems/sources/zerek/collections/7d38e769-4ebd-4583-b95e-ef208b67ea3b.json'])==list(range(1,13))
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native==95
 badkeys=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkey accepted')
  b=copy.deepcopy(r)
  if r['skillFamily']=='verbal-improper-part-of-part':b['statement']=b['statement'].replace('жеті','алты')
  else:
   ms=list(re.finditer(r'\d+(?:,\d+)?',b['statement']));index=1 if r['skillFamily']in{'negative-given-ratio-scaled-denominator','both-ratio-members-same-factor','sum-of-unit-ratios-symbolic-denominator-gap','workforce-factor-time-inverse-plain','workforce-factor-time-inverse-with-units'}else 0
   m=ms[index];q=F(m.group().replace(',','.'))+1;b['statement']=b['statement'][:m.start()]+fmt(q)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,KeyError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 circles=annuli=shrink=0
 pi=F(314,100)
 for radius in range(1,101):
  area=pi*radius**2;C=2*pi*radius;assert sqroot(area/pi)==radius and C/(2*pi)==radius;circles+=1
  for factor in range(2,11):assert (pi*F(radius,factor)**2)/(pi*radius**2)==F(1,factor**2);shrink+=1
  for inner in range(1,radius):assert pi*(radius**2-inner**2)==pi*(radius-inner)*(radius+inner)>0;annuli+=1
 work=0
 for workers in range(1,21):
  for hours in range(1,21):
   for factor in range(2,11):assert workers*factor*F(hours,factor)==workers*hours;work+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'Full34saved/newconditions/officialsolutions/everyMCQread:22ratio part4 and12circle, visual23/24 excluded. Independent actualprinted Fraction/AST/rational-polynomial domains, xversus4x, outer(a:b)denominator, negativegiven/homogeneousnonzero denominators, orderedAB/BC/ACroles, radiusversusdiameter, area-versus-length, explicitπ3.14, arcs/fullturns/NEWarea/annulus/remainingmaxdisc. Findings0. No author calculators imported.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'printedCanariesRejected':printed,'circleInverseCases':circles,'radiusShrinkCases':shrink,'annulusCases':annuli,'personHourCases':work,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
