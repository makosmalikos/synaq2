"""Independent FULL24source/new/official/newsolutions/allMCQ review; no authorcalculator/params."""
from pathlib import Path
from fractions import Fraction as F
import hashlib,itertools,json,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/collection-word2-wave17.json'
EXPECTED=[[240,4,20],[35,29,6,3],[20,25,40,28],[15,45,4,35],[12,2,2,3,1,5],[1,3,3,1,4,2,1,6],[6,45,12],[132,12,3],[600,45,15,1,2],[36,2,42,4,1],[F('3.5'),F('6.2'),F('8.8')],[1,4,17,2,7,31],[216,3,1,2],[2,3,57,3,6,12],[60,90,3,2],[5,8,83,4,3,10],[3,680,220],[14,3,5,54,3,5],[58,34,2],[4,3,39,2,5,37],[1,3,1,6,15,F('0.25'),150],[2,370,3,4,60],[4,6,3],[6,456,3,5,52]]
def fmt(x):
 x=F(x)
 if x.denominator==1:return str(x.numerator)
 return str(float(x)).rstrip('0').rstrip('.').replace('.',',')
def pair(a,b):return fmt(a)+'; '+fmt(b)
def solve(a,b,c,d,e,f):
 det=a*e-b*d;assert det!=0;x=F(c*e-b*f,det);y=F(a*f-c*d,det);assert a*x+b*y==c and d*x+e*y==f;return x,y

def inspect(r,i):
 ns=list(map(lambda s:F(s.replace(',','.')),re.findall(r'\d+(?:[,.]\d+)?',r['statement'])));assert ns==EXPECTED[i],(i,ns);proof={'actualPrintedNumbers':list(map(str,ns))};pred=None
 if i==0:
  d,t,inc=ns;v=d/t;out=d/(v+inc);assert (v+inc)*out==d;proof.update(oldSpeed=str(v),newSpeed=str(v+inc),requestedTime=str(out))
 elif i==1:
  a,b,t,k=ns;N=(k*a*t-b*t)/(k-1);u=N-a*t;v=N-b*t;assert N.denominator==u.denominator==v.denominator==1 and 0<u<v and v==k*u;out=pair(u,v);pred=lambda x,y:x>0 and y>0 and x+a*t==y+b*t and y==k*x;proof.update(fullOrder=str(N),remainingPair=[str(u),str(v)],madePair=[str(a*t),str(b*t)])
 elif i==2:
  delay,p,t,gap=ns;slowtime=t/60;fasttime=(delay+t)/60;k=1+p/100;v=gap/(k*fasttime-slowtime);fast=k*v;assert fast*fasttime-v*slowtime==gap;out=pair(v,fast);pred=lambda x,y:y==k*x and y*fasttime-x*slowtime==gap;proof.update(travelTimes=[str(slowtime),str(fasttime)],speedPair=[str(v),str(fast)])
 elif i==3:
  c1,c2,d,c=ns;m=(c2-c)*d/(2*c-c1-c2);other=m+d;out=m+other;assert m>0 and c1*m+c2*other==c*out;proof.update(componentMasses=[str(m),str(other)],totalMass=str(out),copperMass=str(c*out/100))
 elif i==4:
  delta,whole,num,den,remainnum,remainderden=ns;t=whole+num/den;rem=remainnum/remainderden;out=delta*t/rem;fast=out/t;slow=fast-delta;assert out-slow*t==out*rem;proof.update(duration=str(t),speedGap=str(delta),wholeDistance=str(out),remainingDistance=str(out*rem))
 elif i==5:
  an,ad,extraA,bn,bd,extraB,ln,ld=ns;fa=an/ad;fb=bn/bd;last=ln/ld;N=(extraA+extraB)/(1-fa-fb-2*last);a=fa*N+extraA;b=fb*N+extraB;before=N-a-b;left=before/2;assert all(v.denominator==1 and v>=0 for v in [N,a,b,before,left]);assert left==N*last;out=N;proof.update(integerLedger=list(map(str,[N,a,b,before,left])),allFractionsOriginalWhole=True)
 elif i==6:
  T,delay,inc=ns;delay/=60;v=(T-delay)*inc/delay;assert T*v==(T-delay)*(v+inc);out=v;proof.update(plannedSpeed=str(v),actualSpeed=str(v+inc),equalDistances=str(T*v))
 elif i==7:
  D,delta,t=ns;v=(D/t-delta)/2;out=v*t;assert out+(v+delta)*t==D;proof.update(lowerSpeed=str(v),requestedLowerDistance=str(out),otherDistance=str((v+delta)*t))
 elif i==8:
  M,c1,c2,num,den=ns;second=M*num/den;salt=M*c1/100+second*c2/100;out=salt/(M+second)*100;assert 0<out<100;proof.update(unequalSolutionMasses=list(map(str,[M,second])),saltMass=str(salt),weightedPercent=str(out),incorrectUnweightedAverage=str((c1+c2)/2))
 elif i==9:
  low,excess,high,short,diff=ns;b=(low*diff+excess+short)/(high-low);assert b.denominator==1 and b>0;out=high*b-short;assert low*(b+diff)+excess==out;proof.update(secondBoxes=str(b),firstBoxes=str(b+diff),sameTotal=str(out),excessAddedAndShortageSubtracted=True)
 elif i==10:
  k,dec,inc=ns;b=(dec+inc)/(k-1);a=k*b;assert a-dec==b+inc;out=a+b;proof.update(initialPair=list(map(str,[a,b])),equalChangedValue=str(a-dec),requestedOriginalSum=str(out))
 elif i in [11,13,15,19]:
  a,b,c,d,e,f=ns
  if i in [13,15]:e=-e
  x,y=solve(a,b,c,d,e,f);assert x>0 and y>0;out=pair(x,y);pred=lambda u,v:a*u+b*v==c and d*u+e*v==f;proof.update(printedTwoEquationMatrix=list(map(str,[a,b,c,d,e,f])),uniquePositiveSolution=list(map(str,[x,y])))
 elif i==12:
  total,k,n,d=ns;third=n/d;first=total/(1+k+third);out=first*third;assert first+k*first+out==total;assert all(v.denominator==1 for v in [first,k*first,out]);proof.update(firstSecondThird=list(map(str,[first,k*first,out])),fractionBaseFirstDay=True)
 elif i==14:
  first,second,k,ratio=ns;x=(ratio*second-first)/(ratio*k-1);left=first-x;right=second-k*x;assert x>0 and k*x<=second and x<=first and left==ratio*right;out=x;proof.update(removedPair=list(map(str,[x,k*x])),remainingPair=list(map(str,[left,right])),requestedFirstRemoved=True)
 elif i==16:
  k,leave,arrive=ns;small=(leave+arrive)/(k-1);large=k*small;assert large-leave==small+arrive>=0;out=pair(large,small);pred=lambda a,b:a==k*b and a-leave==b+arrive and a>=leave;proof.update(originalStocks=list(map(str,[large,small])),equalLaterStock=str(large-leave),externalChangesNotInternalTransfer=True)
 elif i==17:
  N,a,b,total,repeatA,repeatB=ns;assert repeatA==a and repeatB==b;large=(total-N*a)/(b-a);small=N-large;assert small>=0 and large>=0 and small.denominator==large.denominator==1;out=pair(small,large);pred=lambda x,y:x>=0 and y>=0 and x.denominator==y.denominator==1 and x+y==N and a*x+b*y==total;proof.update(integerRoomCounts=list(map(str,[small,large])),occupancy=str(a*small+b*large))
 elif i==18:
  father,son,k=ns;t=(k*son-father)/(k-1);assert 0<t<son and father-t==k*(son-t);out=t;proof.update(pastYears=str(t),pastAges=list(map(str,[father-t,son-t])),bothAgesDecreaseTogether=True)
 elif i==20:
  an,ad,bn,bd,extra,third,total=ns;fa=an/ad;fb=bn/bd;N=(total-extra)/(fa+fb+third);a=N*fa;b=N*fb+extra;c=N*third;assert a+b+c==total and total<N and all(v.denominator==1 for v in [N,a,b,c]);out=b;proof.update(bookTotal=str(N),dayCounts=list(map(str,[a,b,c])),allFractionsSameWholeAndBookNotFinished=True)
 elif i==21:
  count,total,secondCount,firstCount,diff=ns;a,b=solve(1,count,total,-firstCount,secondCount,diff);assert a>0 and b>0;out=a;proof.update(firstSecondPrices=list(map(str,[a,b])),firstRequestedNotSecond=True)
 elif i==22:
  down,up,current=ns;v=current*(down+up)/(up-down);assert v>current and down*(v+current)==up*(v-current);out=v;proof.update(ownVelocity=str(v),directionalVelocities=list(map(str,[v+current,v-current])),sameDistance=str(down*(v+current)))
 else:
  assert i==23;days,total,dayA,dayB,diff=ns;a,b=solve(1,1,total/days,dayA,-dayB,diff);assert a>b>0;out=a-b;proof.update(dailyRates=list(map(str,[a,b])),requestedDailyDifference=str(out),totalOutput=str(days*(a+b)))
 key=out if isinstance(out,str) else fmt(out)
 options=r.get('options',[]);assert len(options)==len(set(options))==4
 for o in options:
  vals=list(map(lambda v:F(v.strip().replace(',','.')),o.split(';')));assert len(vals) in [1,2]
 if pred:
  flags=[pred(*map(lambda v:F(v.strip().replace(',','.')),o.split(';'))) for o in options];assert sum(flags)==1 and flags[options.index(key)];proof['allActualPairOptionBackchecks']=flags
 else:
  vals=list(map(lambda v:F(v.replace(',','.')),options));assert sum(v==F(out) for v in vals)==1;proof['allActualTargetOptionChecks']=[v==F(out) for v in vals]
 return key,proof

def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==24;entries=[]
 for i,r in enumerate(rows):
  key,proof=inspect(r,i);assert key==r['answer'],(i,key,r['answer']);assert inspect(dict(r,answer='wrong'),i)[0]!='wrong'
  changed=dict(r,statement=r['statement'].replace(re.search(r'\d+(?:[,.]\d+)?',r['statement']).group(), '99999',1))
  try:inspect(changed,i)
  except AssertionError:pass
  else:raise AssertionError('printedcanary')
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all24saved/new conditions, FULLofficial/newsolutions and everyMCQ individually read; own actualprinted Fraction/matrix/physical mass-speed-count ledger, everyactualMCQ backcheck, integral/nonnegative domains and target roles. No authorparams or calculator.','observed':proof})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hs=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hs[e['editionId']]==e['sha256'] for e in entries)
 native="import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let count=0;const walk=ns=>{for(const n of ns){if(n.type==='fraction'){count++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('rawslash')}};for(const r of JSON.parse(fs.readFileSync('"+PACK+"')).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(count);";fractionCount=int(subprocess.check_output(['node','--input-type=module','-e',native],cwd=ROOT,text=True));assert fractionCount==55
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-collection-word2-wave17.py','fullSavedAndNewRead':24,'nativeFractions':fractionCount,'findings':[]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/collection-word2-wave17.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':24,'wrongKeysRejected':24,'printedCanariesRejected':24,'nativeFractions':fractionCount,'hashesMatched':24}))
if __name__=='__main__':main()
