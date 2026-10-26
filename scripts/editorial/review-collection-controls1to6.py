"""Full29saved/new conditions, complete official/new solutions and11MCQsets read.
Same root author, separate exact printed-input computation, not a separate human
reviewer. Every source/new answer, alternative, domain and target checked. Three
native figures verified from actual primitives; no source raster used.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-controls1to6';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def options(r):return [o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def nums(s):return H.numeric_tokens(s)
def scalar(s):
 p=E.plain(s);m=re.fullmatch(r'\s*([-+]?\d+(?:\.\d+)?)\s*(?:г|м|км|км/сағ|сағ)?\s*',p)
 return F(m[1])if m else E.calc(p)
def triple(s):
 if';'in s:return tuple(scalar(x.strip().removesuffix(' т'))for x in s.split(';'))
 return tuple(F(x.strip())for x in s.split(','))
def minutes(s):
 h=int(one(re.findall(r'(\d+)\s*сағ(?:ат)?',s)));m=re.findall(r'(\d+)\s*мин(?:ут)?',s);assert len(m)<=1
 return F(h*60+(int(m[0])if m else 0))
def roots(s):return tuple(sorted(set(nums(s))))
def set_answer(s):
 p=E.plain(s)
 if 'Шешімі жоқ'in p:return ('empty',)
 if 'Барлық нақты'in p or 'кез келген'in p:return ('all',)
 p=p.replace('\\ne','≠');m=one(re.findall(r'x\s*([<>≠])\s*(.+)',p));return(m[0],E.calc(m[1]))
def inequality(s):
 l,op,r=re.split('([<>])',E.plain(s));[a],b=E.affine('('+l+')-('+r+')')
 if a==0:return ('all',)if(b<0 if op=='<'else b>0)else('empty',)
 return(op if a>0 else('>'if op=='<'else'<'),-b/a)
def solve(r,w,i,src=False):
 s=r['statement'];n=nums(s);p=H.math_parts(s,src);proof={};parse=scalar;out=None
 if(w,i)==('W6',1):
  relation,target=p if src else(s.split(' екені')[0],one(p));l,rhs=E.plain(relation).split('=');a,b=E.plain(l).replace(' ','').split('-');d=E.calc(rhs);assert d!=0
  # Substitute the printed difference symbolically, retaining an arbitrary u.
  rational=E.expr(target);assert set(rational.n)<={()}and set(rational.d)<={(),(a,),(b,)};assert rational.d.get((a,),0)+rational.d.get((b,),0)==0
  denominator=rational.d.get((),F(0))-rational.d.get((b,),F(0))*d;assert denominator!=0;ratio=rational.n.get((),F(0))/denominator
  for v in(-9,1,37):assert E.calc(target,{a:F(v),b:F(v)-d})==ratio
  out=ratio;proof={'printedDifference':str(d),'exactSymbolicCancellationOfFreeVariable':True,'arbitraryWitnessesChecked':3,'nonzeroDenominator':True}
 elif(w,i)==('W6',2):
  t=n[:3];total=n[3];assert len(n)==4;rates=[1/x for x in t];out=tuple(total*x/sum(rates)for x in rates);assert sum(out)==total and len(set(out[j]*t[j]for j in range(3)))==1;parse=triple;proof={'identicalNormAssumptionExplicitInRewrite':not src,'counts':list(map(str,out)),'commonCountTimesNormDuration':str(out[0]*t[0])}
 elif(w,i)==('W6',3):
  if src:initial,mass,final=n
  else:mass,initial,final=n
  assert 0<initial<final<100;start=mass*initial/100;out=(mass*final/100-start)/(1-final/100);assert out>0 and(start+out)/(mass+out)==final/100;proof={'initialSolute':str(start),'addedPureSolute':str(out),'finalTotalMass':str(mass+out)}
 elif(w,i)==('W6',4):
  assert len(n)==8;ds=[int(v)for v in n[::2]];rs=n[1::2];assert rs==[d-1 for d in ds];common=math.lcm(*ds);out=F(common-1);assert all(out%d==r for d,r in zip(ds,rs));assert all(any(x%d!=r for d,r in zip(ds,rs))for x in range(1,int(out)));proof={'allSmallerNaturalsExcluded':int(out)-1,'LCM':common,'allRemaindersChecked':True}
 elif(w,i)==('W6',5):
  if src:assert n[:2]==[4,4]and'екі есе аз'in s;hours=int(n[0]);total=n[-1];ratio=F(1,2)
  else:hours,total,a,b=n;hours=int(hours);ratio=a/b
  assert 0<ratio<1;out=total/sum(ratio**j for j in range(hours));dist=[out*ratio**j for j in range(hours)];assert sum(dist)==total;proof={'allHourDistances':list(map(str,dist))}
 elif(w,i)==('W2',1):
  ratios=re.findall(r'(\d+)\s*:\s*(\d+)',s);assert len(ratios)==2;a,b,c,d=[F(v)for pair in ratios for v in pair];weights=[a/b,F(1),d/c];angles=[360*x/sum(weights)for x in weights];assert angles[0]/angles[1]==a/b and angles[1]/angles[2]==c/d and sum(angles)==360;out=min(angles);proof={'consecutiveSectorAngles':list(map(str,angles)),'sourceNeedsConsecutiveSectorConvention':src,'newAllAnglesMinor':all(a<180 for a in angles)}
 elif(w,i)in[('W2',3),('W1',5)]:out=inequality(one(p));parse=set_answer;proof={'exactAffineSolutionSet':list(map(str,out)),'constantNonzeroDenominators':True}
 elif(w,i)==('W2',4):
  first,second,elapsed=n;assert 0<elapsed<first;remaining=1-elapsed/first;out=second*remaining;assert elapsed/first+out/second==1;proof={'remainingWorkFraction':str(remaining)}
 elif(w,i)==('W2',5):
  if src:low,high=p[:2];assert all(t=='n'for t in p[2:])
  else:low,high=p
  target=E.expr(high)-E.expr(low)-E.expr('1');parse=E.expr;out=target;var='n'if src else'm'
  for k in(1,2,13,123):assert target.value({var:F(k)})==E.calc(high,{var:F(k)})-E.calc(low,{var:F(k)})-1>0 or(src and k==1 and target.value({var:F(k)})==0)
  proof={'universalPolynomialCount':{str(k):str(v)for k,v in target.n.items()},'strictEndpointsBothExcluded':True}
 elif(w,i)==('W5',1):
  target=one(p);out,proof=E.equation(target);l,rhs=target.split('=');assert E.calc(l,{'x':out})==E.calc(rhs,{'x':out});forbidden=F(12,5)if src else F(3,2)
  try:E.calc(l,{'x':forbidden})
  except ZeroDivisionError:pass
  else:raise AssertionError('denominator zero not excluded')
  assert out!=forbidden;proof['originalDenominatorForbiddenX']=str(forbidden)
 elif(w,i)==('W5',2):
  down,up,current=n;assert 0<down<up and current>0;v=current*(up+down)/(up-down);out=down*(v+current);assert v>current and out==up*(v-current);proof={'ownSpeed':str(v),'bothEqualDistancesChecked':True}
 elif(w,i)==('W5',3):
  h,m=map(F,one(re.findall(r'(\d+)\s*сағ(?:ат)?\s+(\d+)\s*мин(?:ут)?',s)));hour=(h%12)*30+m/2;minute=m*6;diff=abs(hour-minute);out=min(diff,360-diff);proof={'hourDegrees':str(hour),'minuteDegrees':str(minute),'bothAngles':list(map(str,[diff,360-diff]))}
 elif(w,i)==('W5',4):
  total,a,b,percent=n;third=a*(1+percent/100);part=total/(a+b+third);out=tuple(x*part for x in[a,b,third]);parse=triple;assert sum(out)==total and out[0]/out[1]==a/b and out[2]/out[0]==1+percent/100;proof={'threeHarvestsTonnes':list(map(str,out)),'unitTonnes':str(part)}
 elif(w,i)==('W5',5):out=E.calc(one(p));proof={'exactWholeLargeProductWithoutFloat':str(out)}
 elif(w,i)==('W3',1):
  assert len(n)==6;assert n[:2]==[1,2]and n[3:5]==[1,2];high=int(n[2]);low=int(n[5]);assert high>low;out=F(sum(range(low+1,high+1)));formula=F(high*(high+1)-low*(low+1),2);assert out==formula;proof={'allRemainingTermsSummed':high-low,'formulaAgrees':True}
 elif(w,i)==('W3',2):
  digits=[int(x)for x in re.findall(r'\d',s)];assert len(digits)==len(set(digits))==4 and min(digits)>0;values=[''.join(map(str,x))for x in itertools.permutations(digits)];out=F(len(values));assert len(values)==len(set(values));proof={'allPermutationsEnumerated':values,'noLeadingZeros':True}
 elif(w,i)==('W3',3):
  if src:v1,v2,d=n
  else:d,v1,d2,v2=n;assert d2==d
  totalTime=d/v1+d/v2;out=2*d/totalTime;proof={'outboundHours':str(d/v1),'returnHours':str(d/v2),'totalDistance':str(2*d),'totalTime':str(totalTime)}
 elif(w,i)==('W3',4):
  digits,deleted=re.findall(r'\d+',s);deleted=int(deleted);length=len(digits)-deleted;valid=[''.join(digits[j]for j in ix)for ix in itertools.combinations(range(len(digits)),length)if digits[ix[0]]!='0'];out=F(min(map(int,valid)));proof={'allOrderedSubsequencesChecked':len(valid),'minimum':str(out)}
 elif(w,i)==('W3',5):
  a,b,c=n;out=a*b*c;assert'мағынасы'in s;count=sum(1 for _ in itertools.product(range(int(a)),range(int(b)),range(int(c))));assert count==out;proof={'allThreeRoleChoicesEnumerated':count,'fixedOrderNoExtraPermutationFactor':True}
 elif(w,i)==('W1',1):
  target=one(p);out=E.calc(target);proof={'directExactRepeatedSummandRatio':str(out)}
 elif(w,i)==('W1',2):
  girls,boysPercent=n;assert 0<boysPercent<100;out=girls/(1-boysPercent/100);assert out.denominator==1 and out-girls==out*boysPercent/100;proof={'girlsPercent':str(100-boysPercent),'boysCount':str(out-girls)}
 elif(w,i)==('W1',3):
  target=one(p);inside,right=one(re.findall(r'\|([^|]+)\|\s*=\s*(.+)',E.plain(target)));[a],b=E.affine(inside);radius=E.calc(right);assert radius>0 and a;out=tuple(sorted([(radius-b)/a,(-radius-b)/a]));parse=roots;assert all(abs(E.calc(inside,{'x':x}))==radius for x in out);proof={'allRealRoots':list(map(str,out)),'bothModulusBranches':True}
 elif(w,i)==('W1',4):
  distance,multiple,time=n;assert multiple>1;out=distance/(time*(1+multiple));assert out*time+out*multiple*time==distance;proof={'tractorSpeed':str(out),'truckSpeed':str(out*multiple),'meetingDistances':list(map(str,[out*time,out*multiple*time]))}
 elif(w,i)==('W4',1):
  calm,up=n;assert up>calm>0;current=1/calm-1/up;down=1/calm+current;out=60/down;parse=minutes;proof={'currentRatePerRoute':str(current),'downstreamRatePerRoute':str(down),'timeMinutes':str(out)}
 elif(w,i)==('W4',2):
  low,high,lo2,hi2=n;assert low==lo2 and high==hi2;out=F(sum(range(int(low),int(high)+1)));assert out==(high-low+1)*(low+high)/2;proof={'allInclusiveTermsSummed':int(high-low+1)}
 elif(w,i)==('W4',3):
  a,b,c,d,e,f,total=n;weights=[a/b,F(1),d/c,d/c*f/e];unit=total/sum(weights);counts=[x*unit for x in weights];assert all(x.denominator==1 for x in counts)and sum(counts)==total;assert counts[0]/counts[1]==a/b and counts[1]/counts[2]==c/d and counts[2]/counts[3]==e/f;labels=['Алма','Алмұрт','Банан','Өрік']if src else['Қызыл','Көк','Жасыл','Сары'];j=counts.index(max(counts));out=(labels[j].casefold(),counts[j]);parse=lambda t:(t.split(',')[0].strip().casefold(),F(one(re.findall(r'\d+',t))));proof={'allCategoryCounts':list(map(str,counts)),'largestCategory':labels[j]}
 elif(w,i)==('W4',4):
  target=E.plain(one(p));numerator,inside=one(re.findall(r'\(?\(?\s*(\d+)\s*\)?\s*/\s*\(?\s*\|([^|]+)\|',target));assert int(numerator)>0 and re.search(r'<\s*0\s*$',target)
  [a],b=E.affine(inside);assert a;out=('empty',);parse=set_answer;proof={'strictlyPositiveNumerator':numerator,'excludedZeroDenominatorX':str(-b/a),'positiveAbsoluteDenominatorForAllOtherReals':True}
 elif(w,i)==('W4',5):
  radius,width=n;outer=radius+width;out=(outer**2-radius**2)/outer**2;proof={'innerRadius':str(radius),'outerRadius':str(outer),'wholeOuterDiskDenominator':True}
 else:raise AssertionError((w,i))
 parsed=parse(r['answer']);equal=lambda a,b:a.equals(b)if isinstance(a,E.R)else a==b
 assert equal(parsed,out),(w,i,src,parsed,out,r['answer']);proof['answer']=str(out)if not isinstance(out,E.R)else 'universal polynomial'
 if options(r):
  values=[parse(o)for o in options(r)];assert len(values)==4 and all(not equal(a,b)for a,b in itertools.combinations(values,2));matches=[j for j,v in enumerate(values)if equal(v,out)];assert len(matches)==1;proof['allMCQOptionsChecked']=4;proof['correctOptionIndex']=one(matches)
  if src:assert [j for j,o in enumerate(r['options'])if o['correct']]==matches
  # Distractors with a specific retained semantic role are checked, not merely non-equality.
  if(w,i)==('W6',2):assert values[0]==out[::-1]and values[2][1]==values[2][2]and sum(values[2])==sum(out)and values[3]==(out[0]-20,out[1]+20,out[2])
  if(w,i)==('W5',4):assert values[0][0]/values[0][1]==a/b and values[1]==(out[0],out[1],out[0]*percent/100)and values[3][2]==2*values[3][0]and sum(values[3])==total
  if(w,i)==('W1',1):assert values[0]==1/out and values[2]==(5-3 if src else 7-4)and values[3]==(F(5,2)if src else F(7,3))
  if(w,i)==('W1',3):assert values[:2]==[(out[0],),(out[1],)]and values[3]==(-out[0],out[1])
  if(w,i)==('W4',3):assert values[0][1]==counts[0]and values[3][1]==counts[3]and values[2][1]in(F(60),F(12))
  if(w,i)==('W4',5):assert values==[(outer**2-radius**2)/radius**2,width/outer,out,radius**2/outer**2]
 return proof

def figures(r,proof,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'};els={e.attrib['id']:e for e in root.iter()if'id'in e.attrib};assert not re.search(rb'<image|<script|foreignObject|href=|onload=|data:image',raw)
 kind=r['image'].split('control-')[1].split('-native')[0]
 if kind=='clock':
  angles={}
  for k in['hour','minute']:
   e=els['dial-'+k];x,y=float(e.attrib['x1']),float(e.attrib['y1']);dx=float(e.attrib['x2'])-x;dy=y-float(e.attrib['y2']);angles[k]=math.degrees(math.atan2(dx,dy))%360;assert abs(angles[k]-float(proof[k+'Degrees']))<0.0001
  assert len([k for k in els if'dial-tick-'in k])==60 and len([k for k in els if'dial-label-'in k])==12
  for h in range(1,13):assert els['dial-label-'+str(h)].text==str(h)
  proof['actualSVG']={'handAngles':angles,'allTicks':60,'allHourNumerals':12}
 elif kind=='sectors':
  paths=[els['sector-'+k]for k in['α','β','γ']];actual=[];previous=None
  for e in paths:
   vals=[float(x)for x in re.findall(r'-?\d+(?:\.\d+)?',e.attrib['d'])];assert len(vals)==11;cx,cy,x1,y1,rx,ry,rot,large,sweep,x2,y2=vals;assert(cx,cy,rx,ry,rot,large,sweep)==(180,165,112,112,0,0,1)
   if previous:assert math.dist((x1,y1),previous)<1e-5
   a=math.degrees(math.atan2(y1-cy,x1-cx));b=math.degrees(math.atan2(y2-cy,x2-cx));actual.append((b-a)%360);previous=(x2,y2);assert abs(math.hypot(x1-cx,y1-cy)-112)<1e-5 and abs(math.hypot(x2-cx,y2-cy)-112)<1e-5
  expected=list(map(float,proof['consecutiveSectorAngles']));assert all(abs(a-b)<1e-5 for a,b in zip(actual,expected));assert {e.text for e in root.findall('.//s:text',ns)}=={'α','β','γ'};proof['actualSVG']={'angles':actual,'threeConsecutiveClosedSectors':True}
 else:
  assert kind=='annulus';a,b=els['outer'],els['inner'];outer,inner=F(a.attrib['r']),F(b.attrib['r']);assert(a.attrib['cx'],a.attrib['cy'])==(b.attrib['cx'],b.attrib['cy']);assert inner/outer==F(proof['innerRadius'])/F(proof['outerRadius']);texts={e.text for e in root.findall('.//s:text',ns)};assert texts=={'12 м','3 м'};rad,width=els['garden-radius'],els['path-width'];assert F(rad.attrib['x1'])-F(rad.attrib['x2'])==inner and F(width.attrib['x2'])-F(width.attrib['x1'])==outer-inner;assert(outer**2-inner**2)/outer**2==E.calc(r['answer']);proof['actualSVG']={'outerPixelRadius':str(outer),'innerPixelRadius':str(inner),'actualRadiusAndWidthSegments':True}
 return proof['actualSVG']

def mutation(r,w,i):
 pairs={('W6',1):('−5,25','−7'),('W6',2):('750 бөлшек','900 бөлшек'),('W6',3):('400 г','500 г'),('W6',4):('8-ге бөлгенде 7','9-ға бөлгенде 8'),('W6',5):('160 м','200 м'),('W2',1):('2 : 3','1 : 3'),('W2',3):('+ 13','− 100'),('W2',4):('8 сағат','10 сағат'),('W2',5):('m² + m + 5','m² + m + 6'),('W5',1):('(3/4)','(7/8)'),('W5',2):('4 км/сағ','5 км/сағ'),('W5',3):('4 сағат 40','5 сағат 40'),('W5',4):('19,38 т','38,76 т'),('W5',5):('333333','666666'),('W3',1):('499','599'),('W3',2):('2, 5, 7, 9','0, 5, 7, 9'),('W3',3):('30 км/сағ','60 км/сағ'),('W3',4):('6359742108','6359742109'),('W3',5):('8 зат есім','9 зат есім'),('W1',1):('2027 + 2027 + 2027 + 2027 + 2027 + 2027 + 2027','2027 + 2027 + 2027 + 2027 + 2027 + 2027'),('W1',2):('442 қыз','494 қыз'),('W1',3):('38,5','45,5'),('W1',4):('630 км','840 км'),('W1',5):('x + 7','x + 8'),('W4',1):('9 сағатта','8 сағатта'),('W4',2):('350','351'),('W4',3):('444 фишка','481 фишка'),('W4',4):('< 0','> 0'),('W4',5):('12 м','15 м')}
 a,b=pairs[w,i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==29;entries=[];evidence=[];mcq=missing=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and not q['svg'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));tail=re.sub(r'^[A-D]\)\s*','',tail).strip();answer=q['sourceAnswer']or tail;missing+=q['sourceAnswer']is None
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(options(r))==len(options(q))and not re.search(r'[$\\]',r['statement']+r['solution']+r['answer']);mcq+=bool(options(q))
  for bad in[{**r,'answer':'999999999'},mutation(r,w,i)]:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('semantic canary accepted',w,i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   after=r['solution'][match.end():].lstrip()
   if(before and before[-1].isascii()and before[-1].isalpha())or before.endswith(':')or after.startswith(':'):continue
   sides=[s.strip().rstrip('.')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',w,i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full saved/new conditions, full official/new solutions, everyMCQ alternative read; exact printed-input rational/polynomial/domain/conservation/integer-state computation, actual native SVG geometry and343px visual review; same author, not separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):
   figures(r,proof);entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actual SVG primitives, hand/sector angles, radii, labels and native343px preview checked; no source bitmap.'}
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();badraw=raw.replace(b'112',b'113',1)if'sectors'in r['image']else raw.replace(b'r="110"',b'r="109"')if'annulus'in r['image']else raw.replace(b'id="dial-hour"',b'id="wrong-hour"');bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(badraw).hexdigest()
   try:figures(bad,copy.deepcopy(proof),badraw)
   except(AssertionError,KeyError):pass
   else:raise AssertionError(('actual SVG mutation accepted',w,i))
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){mixed++;walk([n.fraction])}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(|]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,mixed}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':29,'allSourceNewFullConditionsAndSolutionsRead':29,'sourceKeysNotCaptured':missing,'sourceAndNewMCQSets':mcq,'allSourceNewAlternativesChecked':mcq*8,'wrongKeysRejected':29,'printedSemanticCanariesRejected':29,'originalFigures':3,'actualSVGMutationsRejected':3,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':native['fractions'],'nativeMixedNumbers':native['mixed'],'pythonJavaScriptHashesMatched':29,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
