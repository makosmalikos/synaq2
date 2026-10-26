"""Root external review: all21 full saved/new conditions, official/new solutions
and every MCQ manually read. Own exact printed-condition arithmetic, two-way
ledgers, affine counting equations and positive finite integer domains. No
author models/specs/params/checks imported or used as the answer oracle.
"""
import ast,copy,hashlib,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/collection-word4-wave19.json'
REPORT='problems/editorial/reviews/collection-word4-wave19.json'
def one(xs):
 xs=list(xs);assert len(xs)==1,xs
 return xs[0]
def ns(s):return [F(v.replace(',','.'))for v in re.findall(r'\d+(?:[,.]\d+)?',s)]
def calc(s,env=None):
 s=s.strip().replace('−','-').replace('×','*').replace(':','/').replace(',','.');env=env or{}
 # Decimal tokens become exact integer-ratio literals before parsing.
 s=re.sub(r'\d+\.\d+',lambda m:f'({F(m.group()).numerator}/{F(m.group()).denominator})',s)
 def go(n):
  if isinstance(n,ast.Expression):return go(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.UAdd,ast.USub));return (-1 if isinstance(n.op,ast.USub)else 1)*go(n.operand)
  assert isinstance(n,ast.BinOp);a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  assert isinstance(n.op,ast.Div)and b;return a/b
 return go(ast.parse(s,mode='eval'))
def affine(s):
 b=calc(s,{'x':0});a=calc(s,{'x':1})-b
 assert all(calc(s,{'x':x})==a*x+b for x in range(2,40))
 return a,b
def duration(s):
 h=re.search(r'(\d+)\s*сағ',s);m=re.search(r'(\d+)\s*мин',s)
 assert h or m,s
 return F(int(h.group(1))if h else 0)+F(int(m.group(1))if m else 0,60)
def solve(r,i):
 n=ns(r['statement']);proof={'printedNumbers':list(map(str,n))};predicate=None;kind='number'
 if i==0:
  total,delta,bothDiff=n;both=(total+bothDiff)/2;book=total-both;case=(both-delta)/2;bag=case+delta
  assert min(book,case,bag)>0 and book+case+bag==total and bag-case==delta and bag+case-book==bothDiff
  out=[book,case,bag];predicate=lambda p:len(p)==3 and min(p)>0 and sum(p)==total and p[2]-p[1]==delta and p[2]+p[1]-p[0]==bothDiff
  proof.update(orderedPrices=list(map(str,out)),sameGroupSum=str(both));kind='tuple'
 elif i==1:
  a,b,total,c,d,total2=n;det=a*d-b*c;assert det
  large=(total*d-b*total2)/det;small=(a*total2-total*c)/det;assert large>small>0
  out=[large,small];predicate=lambda p:len(p)==2 and min(p)>0 and a*p[0]+b*p[1]==total and c*p[0]+d*p[1]==total2
  proof.update(orderedMasses=list(map(str,out)),pairedSum=str((total+total2)/(a+c)),difference=str(total-total2));kind='tuple'
 elif i==2:
  count,area=n;assert count.denominator==area.denominator==1
  side=F(math.isqrt(int(area)));assert side*side==area
  length=count*side;out=2*(length+side);assert length*side==count*area
  proof.update(side=str(side),length=str(length),outsidePerimeter=str(out),notSumOfIndividualPerimeters=str(count*4*side))
 elif i==3:
  perim,gap=n;leg=(perim-gap)/3;base=leg+gap;assert leg>0 and 0<base<2*leg and 2*leg+base==perim
  out=base;proof.update(equalLegs=str(leg),requestedBase=str(base),strictTriangleInequality=True)
 elif i==4:
  a,b,total=n;out=total/(a+b);assert out>0 and out*(a+b)==total
  proof.update(totalPackages=str(a+b),unitPrice=str(out))
 elif i==5:
  fn,fd,pct,difference=n;first=fn/fd;second=pct/100;assert 0<second<first and first+second<=1
  out=difference/(first-second);assert out*first-out*second==difference
  proof.update(firstSameWholeFraction=str(first),secondSameWholeFraction=str(second),requestedWhole=str(out),parts=list(map(str,[out*first,out*second])))
 elif i==6:
  first,extra,boxes=n;second=first+extra;total=first+second;out=total/boxes;assert out.denominator==1 and out>0 and boxes*out==total
  proof.update(secondCount=str(second),total=str(total),perEnvelope=str(out))
 elif i==7:
  mean,multiplier=n;first=2*mean/(1+multiplier);second=first*multiplier;assert second>first>0 and(first+second)/2==mean
  out=first;proof.update(first=str(first),second=str(second),requestedFirstNotMeanOrSecond=True)
 elif i==8:
  special,each,restEach,equalEach=n;assert all(x.denominator==1 and x>0 for x in n)and each<equalEach<restEach
  given=special*each;left=(1/restEach,special-given/restEach);right=(1/equalEach,F(0));den=right[0]-left[0];assert den
  total=left[1]/den;children=total/equalEach;rest=children-special
  assert total>given and rest>0 and all(v.denominator==1 for v in[total,children,rest])
  assert special*each+rest*restEach==total==children*equalEach
  good=[];observed=[]
  for o in r['options']:
   a,b=o.split('=');aa,bb=affine(a),affine(b);observed.append([list(map(str,aa)),list(map(str,bb))])
   good.append(aa==left and bb==right)
  key=one(o for o,ok in zip(r['options'],good)if ok);assert r['answer']==key
  assert 'ТЕҢДЕУДІ' in r['statement']and 'БАЛАЛАР САНЫН'in r['statement']
  proof.update(requestedEquationNotRoot=True,total=str(total),integerChildLedger=list(map(str,[special,rest,children])),actualMCQAffineSides=observed)
  return proof
 elif i==9:
  time,dist,gap=n;assert time>0 and dist/time>gap>0
  slow=(dist/time-gap)/2;fast=slow+gap;out=[slow,fast];kind='tuple'
  predicate=lambda p:len(p)==2 and min(p)>0 and (p[0]+p[1])*time==dist and p[1]-p[0]==gap
  assert 'КЕЗДЕСКЕН СӘТТЕН'in r['statement'];proof.update(timeFromMeeting=str(time),sumSpeed=str(dist/time),orderedSpeeds=list(map(str,out)))
 elif i==10:
  downT,upT,current=n;assert 0<downT<upT and current>0
  own=current*(upT+downT)/(upT-downT);assert own>current
  out=(own+current)*downT;assert out==(own-current)*upT
  proof.update(ownSpeed=str(own),directionalSpeeds=list(map(str,[own+current,own-current])),requestedDistance=str(out))
 elif i==11:
  inc,fn,fd=n;mult=(1+inc/100)*(1+fn/fd);out=100*(mult-1);assert mult>1
  assert 'НЕШЕ ПАЙЫЗҒА'in r['statement'];proof.update(newToOldArea=str(mult),requestedIncreasePercent=str(out),notNewAreaPercent=str(mult*100))
 elif i in(12,14):
  length,width,volume,fn,fd,widthLess,hpct=n;height=volume/(length*width);l2=length*fn/fd;w2=width-widthLess;h2=height*hpct/100
  assert min(height,l2,w2,h2)>0 and length*width*height==volume
  out=l2*w2*h2;proof.update(firstHeight=str(height),newDimensions=list(map(str,[l2,w2,h2])),newVolume=str(out),percentBaseFirstHeight=True)
 elif i==13:
  old,new,extra,empty=n;assert 0<new<old and 0<empty<new
  buses=(new*extra-empty)/(old-new);assert buses.denominator==1 and buses>0
  out=old*buses;newBuses=buses+extra;assert out==new*newBuses-empty
  assert (newBuses-1)*new+(new-empty)==out
  proof.update(oldBusCount=str(buses),newBusCount=str(newBuses),requestedStudents=str(out),singlePartialBusPassengers=str(new-empty))
 elif i in(15,16):
  distance,firstV,delay,secondV=n;delayHours=delay/60 if i==15 else delay
  remaining=distance-firstV*delayHours;assert remaining>0 and min(firstV,secondV)>0
  out=remaining/(firstV+secondV);assert out>0 and firstV*(out+delayHours)+secondV*out==distance
  proof.update(initialHeadStartDistance=str(firstV*delayHours),remainingDistance=str(remaining),requestedLaterTime=str(out),firstTotalTime=str(out+delayHours))
  if i==15:kind='duration'
 elif i==17:
  width,length,side=n;assert all(v>0 and v%side==0 for v in[width,length]);out=(width/side)*(length/side)
  assert out*side*side==width*length and out.denominator==1
  assert r['statement'].count('см')==3
  proof.update(dimensionsCm=list(map(str,n)),areaCm2=str(width*length),tileAreaCm2=str(side*side),count=str(out),sourceDimensionalWordingCorrection=True)
 elif i==18:
  firstT,firstV,secondT,secondV=n;assert firstT!=secondT and min(n)>0
  distance=firstT*firstV+secondT*secondV;time=firstT+secondT;out=distance/time
  assert out*time==distance and out!=(firstV+secondV)/2
  proof.update(totalDistance=str(distance),totalTime=str(time),weightedSpeed=str(out),unweightedWrong=str((firstV+secondV)/2))
 elif i==19:
  total,difference,v=n;second=(total-difference)/2;first=second+difference;assert first>second>0 and first+second==total
  out=first*v;proof.update(firstHours=str(first),secondHours=str(second),requestedFirstDistance=str(out))
 elif i==20:
  distance,time,ratio=n;cycleD=distance/(1+ratio);motorD=ratio*cycleD;assert ratio>1 and min(distance,time)>0
  out=motorD/time;assert motorD+cycleD==distance and(out+cycleD/time)*time==distance
  proof.update(cycleDistance=str(cycleD),motorDistance=str(motorD),requestedMotorSpeed=str(out),cycleSpeed=str(cycleD/time))
 else:raise AssertionError(i)
 if kind=='tuple':
  flags=[predicate([F(v.strip().replace(',','.'))for v in o.split(';')])for o in r['options']]
  answer=one(o for o,ok in zip(r['options'],flags)if ok);assert answer==r['answer'];proof['actualAllMCQTruths']=flags
 elif kind=='duration':
  values=[duration(o)for o in r['options']];assert sum(v==out for v in values)==1 and duration(r['answer'])==out;proof['actualAllMCQHours']=list(map(str,values))
 else:
  values=[calc(o)for o in r['options']];assert sum(v==out for v in values)==1 and calc(r['answer'])==out;proof['actualAllMCQValues']=list(map(str,values))
 return proof
def source_result(raw,i):
 # Independently recomputed from ALL full saved conditions read above;
 # these constants are source givens, never the rewritten author params.
 if i==0:
  group=F(140+120,2);hat=F(group-90,2);return[140-group,hat,hat+90]
 if i==1:return[F(15*4-3*13,4*4-3*3),F(4*13-15*3,4*4-3*3)]
 if i==2:return F(2*(3*4+4))
 if i==3:return F(49-7,3)+7
 if i==4:return F(5000,7+3)
 if i==5:return F(17)/(F(3,5)-F(35,100))
 if i==6:return F(48+(48+16),8)
 if i==7:return F('22.49')*2/(1+F('1.6'))
 if i==8:
  clean=lambda s:re.sub(r'\\+(?:d?frac)\{([^{}]+)\}\{([^{}]+)\}',r'((\1)/(\2))',s.replace('$','').replace('\\','\\'))
  o=clean(raw['sourceAnswer']);a,b=o.split('=');assert affine(a)==(F(1,4),F(1))and affine(b)==(F(1,3),F(0));return None
 if i==9:return[F((60/F('.5')-20)/2),F((60/F('.5')+20)/2)]
 if i==10:
  own=F(2)*(F(2)+F('2.5'))/(F('2.5')-2);assert own==18
  return 2*(own+2)
 if i==11:return((1+F(5,100))*(1+F(1,3))-1)*100
 if i==12:return(9*F(2,3))*(6-2)*(F(324,9*6)*F(75,100))
 if i==13:
  buses=F(34*2-14,40-34);assert buses==9;return 40*buses
 if i==14:return(12*F(2,3))*(9-3)*(F(648,12*9)*F(50,100))
 if i==15:return F(80-16*F(30,60),16+38)
 if i==16:return F(720-80*2,80+60)
 if i==17:return F(20*300,20*20)
 if i==18:return F(3*40+28,3+1)
 if i==19:return F(14+3,2)*4
 if i==20:return F(80)*F('1.5')/(1+F('1.5'))/2
 raise AssertionError(i)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==21
 entries=[];evidence=[];canaries=0;native=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one(q for q in cap['questions']if str(q.get('id',q.get('number')))==str(ref['sourceId']))
  assert cap['sourceReviewCaptured']and raw['sourceAnswer'] and not raw.get('images')and not raw.get('svg')
  source=source_result(raw,i)
  if i!=8:
   offered=[ns(o['text'])for o in raw['options']];key=ns(raw['sourceAnswer'])
   if i in(0,1,9):assert key==source and sum(v==source for v in offered)==1
   elif i in(15,16):
    assert duration(raw['sourceAnswer'])==source
    assert sum(duration(o['text'])==source for o in raw['options'])==1
   else:assert key[0]==source and sum(v[0]==source for v in offered)==1,(i,key,source)
  assert one(o['text']for o in raw['options']if o['correct'])==raw['sourceAnswer']
  assert r['minimumPlan']=='pro'and r['statement']!=raw['statement']and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  bad=copy.deepcopy(r);bad['answer']='WRONG_KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r);m=re.search(r'\d+(?:,\d+)?',changed['statement']);assert m
  original=F(m.group().replace(',','.'));replacement=str(float(original+1)).rstrip('0').rstrip('.').replace('.',',') if (original+1).denominator!=1 else str((original+1).numerator)
  if i in(12,14):
   old,new=('1680 см³','1800 см³')if i==12 else('1440 см³','1620 см³');assert old in changed['statement'];changed['statement']=changed['statement'].replace(old,new,1)
  else:changed['statement']=changed['statement'][:m.start()]+replacement+changed['statement'][m.end():]
  try:solve(changed,i)
  except (AssertionError,ValueError,SyntaxError,ZeroDivisionError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  native+=len(re.findall(r'\([^()=]*?/[^()=]*?\)',r['statement']+r['solution']+' '.join(r['options'])))
  evidence.append({'editionId':r['editionId'],'proof':proof,'sourceIndependentTarget':str(source),'sourceFullRead':True})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_all_saved_new_official_authored_fullsolutions_every_MCQ_read_exact_printed_two_way_affine_unit_target_and_positive_domain_oracle','notes':[json.dumps(proof,ensure_ascii=False)]})
 # Positive ordered integer domains supply separate uniqueness checks.
 prices=[];priceCases=0
 for book in range(1,259):
  for case in range(1,260-book):
   bag=260-book-case;priceCases+=1
   if bag-case==130 and bag+case-book==200:prices.append((book,case,bag))
 assert prices==[(30,50,180)]
 massPairs=[(a,b)for a in range(1,38)for b in range(1,38)if 5*a+4*b==37 and 4*a+5*b==35];assert massPairs==[(5,3)]
 clocks=0
 for a in range(1,128):
  for b in range(1,128):
   if(a+b)*F(3,4)==96 and b-a==16:assert(a,b)==(56,72);clocks+=1
 assert clocks==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'root_independent_of_word4_author','batch':BATCH,'scope':__doc__,'summary':{'verified':21,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':21,'sourceTargetsRecomputed':21,'wrongKeysRejected':21,'printedGivenCanariesRejected':canaries,'nativeFractionTextNodes':native,'positivePriceTriplesEnumerated':priceCases,'positiveWeighingPairsEnumerated':37*37,'positivePostmeetingSpeedPairsEnumerated':127*127,'pythonJavaScriptHashesMatched':21},'evidence':evidence,'entries':entries}
 nativeJs="import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let c=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){c++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){walk(n.fraction.numerator);walk(n.fraction.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare math fraction')}}for(const r of JSON.parse(fs.readFileSync('"+BATCH+"')).editions)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(c);"
 nativeCount=int(subprocess.check_output(['node','--input-type=module','-e',nativeJs],cwd=ROOT,text=True));assert nativeCount==39
 report['summary']['nativeFractionTextNodes']=nativeCount
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
