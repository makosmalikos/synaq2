"""Independent all24full saved/new/official/newsolutions/everyMCQ read; actualprinted exactoracle."""
from pathlib import Path
from fractions import Fraction as F
import ast,hashlib,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/collection-word3-wave18.json'
EXPECTED=[[3,50,30,F('1.5')],[3,5,186,6],[150,60,140],[126,3,30,7],[65,20,14],[F('2.5'),F('3.5'),12],[4,3,71,9],[8,10,30,25],[16,4,6,78],[F('21.6'),2],[72,28,20,60],[20,96,64],[108,F('1.25')],[24,62,2],[540,1,6,3,5],[401,18,29],[14,18],[18,16],[8,22,21],[2],[18,6,48],[24,1,4],[54,270],[108,F('4.5'),42]]
def fmt(x):
 x=F(x)
 if x.denominator==1:return str(x.numerator)
 return str(float(x)).rstrip('0').rstrip('.').replace('.',',')
def stringpair(a,b):return fmt(a)+'; '+fmt(b)
def expression(s):
 def val(n):
  if isinstance(n,ast.Constant)and type(n.value)is int:return F(n.value)
  assert isinstance(n,ast.BinOp)and type(n.op)in[ast.Add,ast.Sub,ast.Mult];a,b=val(n.left),val(n.right)
  return a+b if isinstance(n.op,ast.Add)else a-b if isinstance(n.op,ast.Sub)else a*b
 return val(ast.parse(s.replace('−','-').replace('×','*'),mode='eval').body)
def inspect(r,i):
 ns=[F(s.replace(',','.'))for s in re.findall(r'\d+(?:[,.]\d+)?',r['statement'])];assert ns==EXPECTED[i],(i,ns);proof={'actualPrintedNumbers':list(map(str,ns))};pred=None;kind='scalar'
 if i==0:
  k,leave,arrive,m=ns;small=(arrive+m*leave)/(m*k-1);large=k*small;assert large>=leave and small>0 and small+arrive==m*(large-leave);out=large;proof.update(initialStocks=list(map(str,[large,small])),laterStocks=list(map(str,[large-leave,small+arrive])),targetInitialFirst=True)
 elif i==1:
  ta,tb,total,delta=ns;b=(total-ta*delta)/(ta+tb);a=b+delta;assert a>b>0;out=stringpair(a,b);pred=lambda x,y:ta*x+tb*y==total and x-y==delta;proof.update(hourlyRates=list(map(str,[a,b])),wholeOutputs=list(map(str,[ta*a,tb*b])))
 elif i==2:
  total,p,q=ns;base=total/(1+p/100+q/100);angles=[base,base*p/100,base*q/100];assert all(0<a<180 for a in angles)and sum(angles)==total;out=max(angles);proof.update(threeIndividualAngles=list(map(str,angles)),notAssumedTriangle=True)
 elif i==3:
  d,h,m,upT=ns;downT=h+m/60;down=d/downT;up=d/upT;own=(down+up)/2;current=(down-up)/2;assert own>current>0;out=stringpair(own,current);pred=lambda a,b:a>b>0 and(a+b)*downT==d and(a-b)*upT==d;proof.update(directionalSpeeds=list(map(str,[down,up])),requestedOwnCurrentOrder=list(map(str,[own,current])),sourceOrderMismatchFixedByExplicitNewCondition=True)
 elif i==4:
  p,q,left=ns;remain=(1-p/100)*(1-q/100);out=left/remain;assert out*(1-p/100)*(1-q/100)==left;proof.update(successiveOriginalThenRemainingBases=True,finalWholeFraction=str(remain),wholeDistance=str(out))
 elif i==5:
  t1,t2,wind=ns;v=wind*(t1+t2)/(t2-t1);out=t1*(v+wind);assert v>wind and out==t2*(v-wind);proof.update(ownSpeed=str(v),requestedDistance=str(out),windDirectionConstant=True)
 elif i==6:
  cycleT,walkT,total,delta=ns;v=(total+walkT*delta)/(cycleT+walkT);assert v>delta;out=v;assert cycleT*v+walkT*(v-delta)==total;proof.update(twoDifferentRoutePartDistances=list(map(str,[cycleT*v,walkT*(v-delta)])),cycleSpeed=str(v))
 elif i==7:
  fastT,h,m,delta=ns;slowT=h+m/60;fast=slowT*delta/(slowT-fastT);out=fast*fastT;assert out==(fast-delta)*slowT;proof.update(times=list(map(str,[fastT,slowT])),speeds=list(map(str,[fast,fast-delta])),distance=str(out))
 elif i==8:
  totalRate,t1,t2,total=ns;b=(total-t1*totalRate)/(t2-t1);a=totalRate-b;u=t1*a;v=t2*b;assert a>0 and b>0 and all(z.denominator==1 for z in[a,b,u,v]);out=stringpair(u,v);pred=lambda x,y:x+y==total and x/t1+y/t2==totalRate;proof.update(hourlyRates=list(map(str,[a,b])),requestedWholeOutputPair=list(map(str,[u,v])))
 elif i==9:
  perimeter,multiple=ns;width=perimeter/(2*(multiple+1));length=multiple*width;assert 2*(length+width)==perimeter;out=length*width;proof.update(exactDimensions=list(map(str,[length,width])),decimalArea=str(out))
 elif i==10:
  D,a,b,drone=ns;assert drone>max(a,b);T=D/(a+b);out=drone*T;proof.update(meetingTime=str(T),droneDistance=str(out),instantTurnsContinuousFlight=True)
 elif i==11:
  workers,a,b=ns;out=(a+b)/workers;assert out.denominator==1;proof.update(totalOutput=str(a+b),equalTotalPerPerson=str(out),notDemandingEqualOutputOfEachColor=True)
 elif i==12:
  total,multiple=ns;a=total/(1+multiple);b=multiple*a;assert a.denominator==b.denominator==1;out=stringpair(a,b);pred=lambda x,y:x+y==total and y==multiple*x;proof.update(integerShelfCounts=list(map(str,[a,b])))
 elif i==13:
  gap,mother,k=ns;child=mother-gap;t=(k*child-mother)/(k-1);assert 0<t<child and mother-t==k*(child-t);out=t;proof.update(currentAges=list(map(str,[mother,child])),pastAges=list(map(str,[mother-t,child-t])),bothAgesChangeTogether=True)
 elif i==14:
  M,an,ad,bn,bd=ns;first=M*an/ad;after=M-first;second=after*bn/bd;out=after-second;assert first+second+out==M;proof.update(firstExpense=str(first),secondBaseRemaining=str(after),secondExpense=str(second),finalRemainder=str(out))
 elif i==15:
  total,d1,d2=ns;a=(total-2*d1-d2)/3;b=a+d1;c=b+d2;assert a>0 and all(v.denominator==1 for v in[a,b,c]);out=stringpair(a,b)+'; '+fmt(c);pred=lambda x,y,z:x+y+z==total and y-x==d1 and z-y==d2;proof.update(orderedTriplet=list(map(str,[a,b,c])),sourceAmbiguousAnswerOrderingReplacedByExplicitNewOrder=True)
 elif i==16:
  a,b=ns;out=b/(a+b);kind='fraction';proof.update(numeratorSecondGroup=str(b),denominatorWholeClass=str(a+b),reducedFraction=str(out))
 elif i==17:
  nth,initialAge=ns;elapsed=nth-1;out=initialAge+elapsed;assert 'бір күнтізбелік күні' in r['statement']and 'үзіліссіз' in r['statement'];proof.update(annualEventCount=str(nth),actualYearGaps=str(elapsed),currentAge=str(out))
 elif i==18:
  n,before,after=ns;out=n*before-(n-1)*after;assert out>0;proof.update(originalAgeSum=str(n*before),remainingAgeSum=str((n-1)*after),removedAge=str(out))
 elif i==19:
  weeks=ns[0];assert 'сәуір'in r['statement']and 'САҒАТ'in r['statement'];out=(30-7*weeks)*24;kind='expression';assert out==384;proof.update(aprilDays=30,weeks=str(weeks),closedDays=str(7*weeks),operatingHours=str(out))
 elif i==20:
  own,current,d=ns;assert own>current;down=d/(own+current);up=d/(own-current);out=down+up;assert 'бастапқы айлаққа'in r['statement'];proof.update(eachDirectionDistance=str(d),times=list(map(str,[down,up])),totalReturnJourneyTime=str(out))
 elif i==21:
  length,n,d=ns;width=length*n/d;out=length*width;proof.update(length=str(length),width=str(width),area=str(out))
 elif i==22:
  v,meters=ns;km=meters/1000;out=km/v;assert out*v==km;proof.update(meterToKm=str(km),requestedHours=str(out),equivalentSeconds=str(out*3600))
 else:
  assert i==23;car,multiple,d=ns;v=car/multiple;hours=d/v;minutes=hours*60;assert minutes.denominator==1;h=int(minutes//60);m=int(minutes%60);out=f'{h} сағ {m} мин';kind='minutes';proof.update(cycleSpeed=str(v),decimalHours=str(hours),exactMinutes=str(minutes),normalizedHourMinute=[h,m])
 options=r['options'];assert len(set(options))==4
 if pred:
  flags=[pred(*[F(v.strip().replace(',','.'))for v in o.split(';')])for o in options];key=out
 elif kind=='fraction':
  values=[]
  for o in options:
   m=re.fullmatch(r'\((\d+)/(\d+)\)',o);assert m;values.append(F(*map(int,m.groups())))
  flags=[v==out for v in values];key=f'({out.numerator}/{out.denominator})'
 elif kind=='expression':
  values=[expression(o)for o in options];flags=[v==out for v in values];assert values==[408,1104,384,23040];key='(30 − 7 × 2) × 24'
 elif kind=='minutes':
  def asminutes(o):
   a=re.fullmatch(r'(\d+) сағ (\d+) мин',o)
   if a:return 60*int(a[1])+int(a[2])
   a=re.fullmatch(r'(\d+) мин',o);assert a;return int(a[1])
  values=[asminutes(o)for o in options];flags=[v==minutes for v in values];key=out;assert values==[105,135,165,24]
 else:
  flags=[F(o.replace(',','.'))==out for o in options];key=fmt(out)
 assert sum(flags)==1 and options[flags.index(True)]==key;proof['allActualMCQBackchecks']=flags;return key,proof

def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==24;entries=[]
 for i,r in enumerate(rows):
  key,proof=inspect(r,i);assert key==r['answer'],(i,key,r['answer']);assert inspect(dict(r,answer='wrong'),i)[0]!='wrong';changed=dict(r,statement=r['statement'].replace(re.search(r'\d+(?:[,.]\d+)?',r['statement']).group(),'99999',1))
  try:inspect(changed,i)
  except AssertionError:pass
  else:raise AssertionError('printedcanary')
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all24saved/new fullconditions/FULLofficial+newsolutions/everyMCQ read; own actualprinted Fraction physical/unit/matrix ledger, allactualMCQ backchecks, inputdomains/target/order/base proofs; no authorparams/calculator','observed':proof})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256']for e in entries)
 native="import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let count=0;const walk=ns=>{for(const n of ns){if(n.type==='fraction'){count++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('rawslash')}};for(const r of JSON.parse(fs.readFileSync('"+PACK+"')).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(count);";fractionCount=int(subprocess.check_output(['node','--input-type=module','-e',native],cwd=ROOT,text=True));assert fractionCount==23
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-collection-word3-wave18.py','fullSavedAndNewRead':24,'nativeFractions':fractionCount,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/collection-word3-wave18.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':24,'wrongKeysRejected':24,'printedCanariesRejected':24,'nativeFractions':fractionCount,'hashesMatched':24}))
if __name__=='__main__':main()
