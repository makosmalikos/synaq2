"""All14full saved/new conditions, complete official/new solutions and7MCQsets
read; one saved clock raster and both343px native previews inspected. Same root
author separate exact printed-input computation, not separate human reviewer.
Universal proportional-expression domains and real halfline intersections, full
integer inventories, first positive clock encounters and every MCQ checked.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-controls9to10';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(name,path):
 sp=importlib.util.spec_from_file_location(name,ROOT/path);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
E=module('equations','scripts/editorial/review-collection-equations12.py');A=module('arithmetic','scripts/editorial/review-collection-expression12.py');H=E.H;one=H.one
def plain(s):return E.plain(s.replace('\\div','÷').replace('\\ge','≥'))
def options(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def scalar(s):
 p=plain(s);m=re.fullmatch(r'\s*(-?\d+(?:\.\d+)?)\s*(?:км/сағ|км|сағат|сағ)?\s*',p);return F(m[1])if m else E.calc(p)
def minutes(s):return E.calc(re.sub(r'\s*(?:минут|мин)\s*$','',plain(s)))
def time_pair(s):return tuple(minutes(t)for t in s.split(';'))
def factor_pair(s):
 n=H.numeric_tokens(s);assert len(n)==2;return tuple(n)
def ratio(s):
 parts=s.replace('$','').split(':');assert len(parts)==2;return E.calc(parts[0])/E.calc(parts[1])
def upper_set(s):
 p=plain(s).replace(' ','');m=re.fullmatch(r'[yz]([≤≥])(.+)',p)
 if m:return('upper'if m[1]=='≤'else'lower',E.calc(m[2]),True)
 lo,hi=one(re.findall(r'^(.+)≤[yz]≤(.+)$',p));return('closedInterval',E.calc(lo),E.calc(hi))
DIVISIBILITY={'3-кеде,9-ғадабөлінеді':(True,True),'3-кеде,9-ғадабөлінбейді':(False,False),'3-кебөлінбейді,9-ғабөлінеді':(False,True),'3-кебөлінеді,9-ғабөлінбейді':(True,False)}
def divisibility(s):
 p=plain(s).replace(' ','');assert p in DIVISIBILITY;return DIVISIBILITY[p]
def proportion(equation,target,variables):
 a,b=variables;l,r=plain(equation).split('=');difference=E.expr(l)-E.expr(r);assert set(difference.n)<={(a,),(b,)};ca,cb=difference.n.get((a,),F(0)),difference.n.get((b,),F(0));assert ca and cb;relation=-cb/ca;assert relation!=0
 target=plain(target);f=E.expr(target);assert set(f.n)<={(a,),(b,)}and set(f.d)<={(a,),(b,)};num=f.n.get((a,),F(0))*relation+f.n.get((b,),F(0));den=f.d.get((a,),F(0))*relation+f.d.get((b,),F(0));assert den;out=num/den
 for value in[F(-7),F(1),F(13)]:
  env={a:relation*value,b:value};assert E.calc(l,env)==E.calc(r,env)and E.calc(target,env)==out
 for variable in variables:
  env={a:F(1),b:F(1)};env[variable]=F(0);invalid=False
  for side in[l,r]:
   try:E.calc(side,env)
   except ZeroDivisionError:invalid=True
  assert invalid
 return out,{'firstVariable':a,'secondVariable':b,'ratioFirstOverSecond':str(relation),'exactHomogeneousFreeScaleCancellation':True,'targetDenominatorCoefficient':str(den),'bothOriginalZeroVariableHolesExcluded':True,'targetDenominatorNonzeroForEveryAllowedScale':True}
def clock_times(s):
 return[(int(h),int(m))for h,m in re.findall(r'(\d+)\s*сағ(?:ат)?\s+(\d+)\s*мин(?:ут)?',s)]
def catch_up(h,m):
 gap=(F(h%12)*30-F(11,2)*m)%360;gap=gap or F(360);t=gap/F(11,2);future=h*60+m+t;assert(future*F(1,2))%360==(future*6)%360 and t>0;return t,{'initialHourDegrees':str((h%12)*30+F(m,2)),'initialMinuteDegrees':str(m*6),'firstPositiveRelativeGap':str(gap),'relativeDegreesPerMinute':'11/2','firstFutureWaitMinutes':str(t),'noEarlierPositiveEncounterByModuloPhase':True}
def solve(r,w,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);parse=scalar;proof={}
 if(w,i)in[('W9',1),('W10',3)]:
  assert len(p)==2;out,proof=proportion(*p,('x','y')if src else('a','b'))
 elif(w,i)==('W9',2):
  totalText,smallText=p;total,small=A.exact(totalText),A.exact(smallText);assert total.denominator==small.denominator==1;out=F(math.gcd(int(total),int(small)));terms=plain(totalText).split('+');values=[A.exact(t)for t in terms];assert sum(values)==total and all(v%small==0 for v in values)and out==small;proof={'everyFactorialValue':list(map(str,values)),'wholeSum':str(total),'commonFactor':str(small),'sumDividedBySmallest':str(total/small)}
 elif(w,i)in[('W9',3),('W10',7)]:
  times=clock_times(s);assert len(times)==(2 if w=='W9'else 1);results=[catch_up(h,m)for h,m in times];out=tuple(x[0]for x in results)if w=='W9'else one(results)[0];parse=time_pair if w=='W9'else minutes;proof={'givenTimes':[list(v)for v in times],'everyFirstEncounter':[x[1]for x in results]}
 elif(w,i)==('W9',4):
  down,up,current=n;assert 0<down<up and current>0;out=current*(up+down)/(up-down);assert out>current and down*(out+current)==up*(out-current);proof={'ownSpeedTarget':str(out),'equalDistance':str(down*(out+current))}
 elif(w,i)==('W9',5):
  first,second,drain=n;net=1/first+1/second-1/drain;assert net>0;out=1/net;assert out/first+out/second-out/drain==1;proof={'firstInflowPerHour':str(1/first),'secondInflowPerHour':str(1/second),'outflowPerHour':str(1/drain),'netRatePerHour':str(net),'fullTimeHours':str(out)}
 elif(w,i)==('W9',6):
  k=one(n);assert k>1;out=(k,k*k);parse=factor_pair;proof={'radiusScale':str(k),'linearCircumferenceScale':str(k),'quadraticAreaScale':str(k*k),'validForEveryPositiveRadius':True}
 elif(w,i)==('W9',7):
  a,b=n;assert min(a,b)>0;out=(a/b)**2;parse=ratio;proof={'circumferenceAndRadiusRatio':str(a/b),'areaRatioSquared':str(out),'orderPreserved':True}
 elif(w,i)==('W10',1):out=E.calc(one(p));proof={'wholeExactExpressionValue':str(out)}
 elif(w,i)==('W10',2):
  if src:body=one(re.findall(r'\\begin\{cases\}(.*?)\\end\{cases\}',one(p),re.S));equations=re.split(r'\\\\(?:\[[^\]]+\])?',body);variable='y'
  else:equations=p;variable='z'
  assert len(equations)==2;bounds=[]
  for equation in equations:
   l,op,rhs=re.split('([≤≥])',plain(equation));[a],b=E.affine('('+l+')-('+rhs+')',(variable,));assert a and((a<0 and op=='≥')or(a>0 and op=='≤'));bounds.append(-b/a)
  out=('upper',min(bounds),True);parse=upper_set;proof={'allInclusiveUpperBounds':list(map(str,bounds)),'intersectionUpperInclusive':str(min(bounds)),'validForAllRealsNotIntegerSamplesOnly':True}
 elif(w,i)==('W10',4):
  fracText=p if src else re.findall(r'\(\d+/\d+\)',s);bare=s
  for f in fracText:bare=bare.replace(f,'')
  fractions=list(map(E.calc,fracText));offsets=H.numeric_tokens(bare)
  if src:assert'жартысын'in s and len(fractions)==3;fractions=[F(1,2)]+fractions
  assert len(fractions)==4 and len(offsets)==3;stages=fractions[:3];final=fractions[3];a,b=F(1),F(0)
  for part,offset in zip(stages,offsets):assert 0<part<1 and offset>=0;a=a*(1-part);b=b*(1-part)-offset
  assert a!=final;out=-b/(a-final);assert out.denominator==1 and out>0;stock=out;ledger=[]
  for part,offset in zip(stages,offsets):
   fractionTaken=stock*part;totalTaken=fractionTaken+offset;stock=stock-totalTaken;assert fractionTaken.denominator==stock.denominator==1 and min(fractionTaken,stock)>=0;ledger.append({'fractionTaken':str(fractionTaken),'extraTaken':str(offset),'left':str(stock)})
  assert stock==out*final;proof={'uniqueAffineFinalCoefficient':str(a-final),'allThreeIntegerInventoryStages':ledger,'finalStock':str(stock),'initialWholeTarget':str(out),'finalFraction':str(final)}
 elif(w,i)==('W10',5):
  speed,delay,increase=n;assert min(speed,delay,increase)>0;after=speed+increase;half=delay/(1/speed-1/after);out=2*half;planned=out/speed;actual=half/speed+delay+half/after;assert planned==actual;proof={'halfDistance':str(half),'wholeDistanceTarget':str(out),'plannedHours':str(planned),'actualHours':str(actual),'includesStationaryDelay':True}
 elif(w,i)==('W10',6):
  expression=plain(one(p)).replace('{','').replace('}','').replace(' ','');exponent,extra=map(int,one(re.findall(r'^10\^(\d+)\+(\d+)$',expression)));assert exponent>=2 and 0<=extra<10**exponent;value=10**exponent+extra;digitSum=sum(map(int,str(value)));out=(value%3==0,value%9==0);assert out==(digitSum%3==0,digitSum%9==0);parse=divisibility;proof={'exponent':exponent,'addend':extra,'wholeInteger':str(value),'digitSum':digitSum,'directRemainders':[value%3,value%9],'bothDigitSumAndWholeIntegerChecked':True}
 else:raise AssertionError((w,i))
 assert parse(r['answer'])==out,(w,i,src,out,r['answer']);proof['answer']=str(out)
 if options(r):
  values=[parse(o)for o in options(r)];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['everyOptionValue']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
  if(w,i)==('W9',3):assert values==[(out[0],F(times[1][0]%12)*5),(F(times[0][1]),out[1]),(out[0],out[1]-F(10,11)),out]
  if(w,i)==('W9',6):assert values==[(k,k),(k,2*k),out,(2*k,k*k)]
  if(w,i)==('W9',7):assert values==[out,a/b,1/out,b/a]
  if(w,i)==('W10',3):assert values[0]==out and values[1]==1/out and values[3]==-out
  if(w,i)==('W10',7):
   h,m=one(times);gap=F(proof['everyFirstEncounter'][0]['firstPositiveRelativeGap']);assert values==[F(60-m),out,gap/6,((h%12+1)*30-m*6)/F(11,2)]
 return proof
def clock_figure(r,proof,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];assert not re.search(rb'<image|<script|href=|foreignObject|data:image',raw);root=ET.fromstring(raw);els={e.attrib['id']:e for e in root.iter()if'id'in e.attrib};expected=proof['everyFirstEncounter'][0];angles={}
 for key in['hour','minute']:
  e=els['dial-'+key];dx=F(e.attrib['x2'])-F(e.attrib['x1']);dy=F(e.attrib['y1'])-F(e.attrib['y2']);angle=math.degrees(math.atan2(float(dx),float(dy)))%360;assert abs(angle-float(F(expected['initial'+key.title()+'Degrees'])))<0.0002;angles[key]=angle
 assert len([k for k in els if k.startswith('dial-tick-')])==60 and len([k for k in els if k.startswith('dial-label-')])==12
 for h in range(1,13):assert els['dial-label-'+str(h)].text==str(h)
 return{'actualHandAngles':angles,'all60TicksAnd12NumeralsPresent':True,'firstTimeMatchesActualHands':True}
def mutation(r,w,i):
 pairs={('W9',1):('(2 + (1/2))','(3 + (1/2))'),('W9',2):('мен «6!»','мен «5!»'),('W9',3):('11 сағат 35','11 сағат 40'),('W9',4):('3 км/сағ','6 км/сағ'),('W9',5):('24 сағат','12 сағат'),('W9',6):('4 есе','5 есе'),('W9',7):('7 : 9','8 : 9'),('W10',1):('30 −','31 −'),('W10',2):('(1/2)','(3/2)'),('W10',3):('2 × a − 3 × b','2 × a − 2 × b'),('W10',4):('тағы 4 фишканы','тағы 8 фишканы'),('W10',5):('1,5 сағатқа','2 сағатқа'),('W10',6):('+ 26','+ 25'),('W10',7):('10 сағат 15','10 сағат 20')};a,b=pairs[w,i];assert a in r['statement'],(w,i,a);q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14;entries=[];evidence=[];equalities=mcqs=missing=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution'];assert len(q['images'])==(1 if(w,i)==('W9',3)else 0);assert len(q['svg'])==(2 if(w,i)==('W10',2)else 0);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(options(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(options(r))==len(options(q))and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,w,i)]:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('semantic canary accepted',w,i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip();after=r['solution'][match.end():].lstrip()
   if(before and before[-1].isascii()and before[-1].isalpha())or before.endswith(':')or after.startswith(':'):continue
   sides=[s.strip().rstrip('.,')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',w,i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All14source/new full conditions and complete official/new solutions plus7MCQsets read. Exact homogeneous proportional domains for EVERYnonzero scale, factorial GCD, first positive clock phase, real inclusive intersection, complete integer inventories, recovered journey time and whole-integer/digit-sum divisibility checked. Same author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):
   proof['actualSVG']=clock_figure(r,proof);entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Native continuous hands decoded from actual endpoints,60ticks/12numerals checked,343px PNG read. No source raster/traced path.'};raw=(ROOT/('frontend/public'+r['image'])).read_bytes();badroot=ET.fromstring(raw);hour=one(e for e in badroot.iter()if e.attrib.get('id')=='dial-hour');hour.attrib['x2']=str(float(F(hour.attrib['x2'])+1));badraw=ET.tostring(badroot);bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(badraw).hexdigest()
   try:clock_figure(bad,proof,badraw)
   except(AssertionError,KeyError):pass
   else:raise AssertionError('actual hand marker mutation accepted')
  if(w,i)==('W9',3):
   manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];a=one(a for a in manifest if a['file']=='images/bbf51950407a1683fd1f8b45.png');assert a['sourceUrl']==one(q['images'])['src']and hashlib.sha256((ROOT/'problems/sources/zerek'/a['file']).read_bytes()).hexdigest()==a['sha256'];src['archivedClockRasterSHA256']=a['sha256'];src['sourceRasterReadAnd11h25Corroborated']=True
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){mixed++;walk([n.fraction])}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,mixed}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'fullSourceNewConditionsAndSolutionsRead':14,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':14,'printedSemanticCanariesRejected':14,'nativeFractions':native['fractions'],'nativeMixedNumbers':native['mixed'],'originalNativeClockFigures':2,'sourceClockRasterRead':1,'actualHandMutationsRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':14,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
