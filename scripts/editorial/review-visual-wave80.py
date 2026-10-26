"""Root independent full41saved/39new condition, full official/new solutions
and every MCQ review. Seven archived41panels and seven native343px39panels
actually viewed.39 source rasters available including two retained; two missing
not compared. Actual rendered geometry, visible scales/cells/labels/legends
only: author params/models/data-* are not answer or geometric evidence.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as E
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave80-pictured-data-interpretation.json'
REPORT='problems/editorial/reviews/visual-wave80-pictured-data-interpretation.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def tag(e):return e.tag.rsplit('}',1)[-1]
def txt(e):return ''.join(e.itertext()).strip()
def num(e,k):return float(e.attrib[k])
def point(e,j):return num(e,'x'+j),num(e,'y'+j)
def close(a,b):assert abs(float(a)-float(b))<1e-6,(a,b)
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def coords(s):return list(map(float,re.findall(r'-?\d+(?:\.\d+)?(?:e[+-]?\d+)?',s,re.I)))
def exact(v):
 result=F(float(v)).limit_denominator(10000);close(result,v);return result
def numeric(s):return F(str(s).replace(',','.'))
def isnumber(s):return bool(re.fullmatch(r'-?\d+(?:[,.]\d+)?',s))
def scale(ticks):
 assert len(ticks)>=2;p0,v0=ticks[0];p1,v1=ticks[1];assert p0!=p1 and v0!=v1
 slope=(v1-v0)/(p1-p0)
 for p,v in ticks:close(v,v0+(p-p0)*slope)
 def convert(p):return exact(v0+(p-p0)*slope)
 return convert
def observe(svg,i):
 root=E.fromstring(svg);assert root.get('viewBox')=='0 0 480 360';nodes=list(root.iter())
 assert {tag(e)for e in nodes}<={'svg','title','desc','rect','g','circle','line','path','polyline','text'}
 assert not re.search(r'<(?:image|script|foreignObject)|\b(?:href|on[a-z]+)=|data:|url\(',svg,re.I)
 texts=[e for e in nodes if tag(e)=='text'];rects=[e for e in nodes if tag(e)=='rect'and e.get('x')is not None];lines=[e for e in nodes if tag(e)=='line'];paths=[e for e in nodes if tag(e)=='path'];circles=[e for e in nodes if tag(e)=='circle'];polylines=[e for e in nodes if tag(e)=='polyline']
 for e in texts:assert 0<num(e,'x')<480 and 0<num(e,'y')<360 and num(e,'font-size')*343/480>=15.7
 for e in rects:assert 0<num(e,'x')<num(e,'x')+num(e,'width')<480 and 0<num(e,'y')<num(e,'y')+num(e,'height')<360
 if i in(3,5,12,15,29,32,36,38):
  assert not lines and not paths and not circles;xs=sorted({num(e,'x')for e in rects});ys=sorted({num(e,'y')for e in rects});cells={}
  assert len(rects)==len(xs)*len(ys)
  for e in rects:
   x,y,w,h=(num(e,k)for k in('x','y','width','height'));contained=[t for t in texts if x<num(t,'x')<x+w and y<num(t,'y')<y+h]
   assert contained
   for t in contained:close(num(t,'x'),x+w/2)
   cells[(ys.index(y),xs.index(x))]=' '.join(txt(t)for t in sorted(contained,key=lambda t:num(t,'y')))
  assert sum(len(v.split())for v in cells.values())>0
  return {'kind':'table','cells':[[cells[(row,col)]for col in range(len(xs))]for row in range(len(ys))]}
 if i in(0,2,8,11,14,20,21,28,31,34):
  assert len(circles)==(2 if i==34 else 1);pie=[]
  for circle in sorted(circles,key=lambda e:num(e,'cx')):
   c=(num(circle,'cx'),num(circle,'cy'));R=num(circle,'r');assert 0<c[0]-R<c[0]+R<480 and 0<c[1]-R<c[1]+R<360
   chunks=[]
   for p in paths:
    v=coords(p.get('d'))
    if len(v)!=11 or dist(tuple(v[:2]),c)>1e-6:continue
    start,end=tuple(v[2:4]),tuple(v[-2:]);close(v[4],R);close(v[5],R);close(dist(start,c),R);close(dist(end,c),R);assert v[8]==1
    def clockwise(q):return math.degrees(math.atan2(q[0]-c[0],c[1]-q[1]))%360
    a,b=clockwise(start),clockwise(end);sweep=(b-a)%360;assert 0<sweep<360 and v[7]==int(sweep>180)
    near=[]
    for t in texts:
     loc=(num(t,'x'),num(t,'y')-8);r=dist(loc,c)
     if r>R*1.4 or r<1:continue
     angle=clockwise(loc)
     if 1e-6<(angle-a)%360<sweep-1e-6:near.append(txt(t))
    chunks.append({'start':exact(a),'angle':exact(sweep),'labels':near,'color':p.get('fill')})
   assert chunks
   if i!=34:
    close(sum(float(v['angle'])for v in chunks),360);assert len(chunks)==len(paths)
    chunks.sort(key=lambda v:v['start'])
    for j,ch in enumerate(chunks):
     gap=(float(ch['start']+ch['angle'])-float(chunks[(j+1)%len(chunks)]['start']))%360;close(min(gap,360-gap),0)
   pie.append(chunks)
  if i==34:
   wholeLabels=[txt(t)for t in texts if num(t,'y')>250];assert len(wholeLabels)==2
   return {'kind':'dualPie','pies':pie,'wholeLabels':wholeLabels}
  byName={}
  for ch in pie[0]:
   name=one(v for v in ch['labels']if re.fullmatch('[A-D]',v));assert name not in byName;byName[name]=ch
   for label in ch['labels']:
    if re.fullmatch(r'\d+(?:,\d+)?%',label):close(numeric(label[:-1])*F(36,10),ch['angle'])
    elif re.fullmatch(r'\d+(?:,\d+)?°',label):close(numeric(label[:-1]),ch['angle'])
  return {'kind':'pie','sectors':byName}
 if i in(1,13,22):
  grids=sorted({num(e,'x1')for e in lines if e.get('stroke')=='#cfd9e5'});assert len(grids)>3;step=grids[1]-grids[0]
  for a,b in zip(grids,grids[1:]):close(b-a,step)
  ticks=[(num(e,'x'),numeric(txt(e)))for e in texts if num(e,'y')==305 and isnumber(txt(e))]
  convert=scale(ticks)if i!=22 else lambda x:exact((x-grids[0])/step)
  if i==22:assert not ticks
  categories={txt(e):num(e,'y')-9 for e in texts if num(e,'x')==40};assert set(categories)==set('ABCD')
  shapes=rects or[e for e in lines if num(e,'stroke-width')>3];assert len(shapes)==4
  values={}
  for e in shapes:
   if tag(e)=='rect':base=num(e,'x');end=base+num(e,'width');y=num(e,'y')+num(e,'height')/2
   else:base,y=point(e,'1');end,y2=point(e,'2');close(y,y2)
   close(base,grids[0]);name=one(k for k,v in categories.items()if abs(v-y)<1e-6);values[name]=convert(end)
  result={'kind':'horizontal','values':values,'minorGridUnits':convert(grids[1])-convert(grids[0])}
  if i==22:result['calibration']=one(txt(t)for t in texts if '='in txt(t))
  return result
 yticks=[(num(t,'y')-7,numeric(txt(t)))for t in texts if num(t,'x')==39 and isnumber(txt(t))];yvalue=scale(yticks)
 gridYs=sorted({num(e,'y1')for e in lines if e.get('stroke')=='#cfd9e5'and abs(num(e,'y1')-num(e,'y2'))<1e-6});assert len(gridYs)>3
 for a,b in zip(gridYs,gridYs[1:]):close(b-a,gridYs[1]-gridYs[0])
 baseline=one(point(e,'1')[1]for e in lines if num(e,'stroke-width')==1.6 and abs(num(e,'y1')-num(e,'y2'))<1e-6)
 if i in(4,10,18,19,24,25,30,35):
  xticks=[(num(t,'x'),numeric(txt(t)))for t in texts if num(t,'y')==312 and isnumber(txt(t))];xvalue=scale(xticks);series=[]
  for pl in polylines:
   points=coords(pl.get('points'));assert len(points)%2==0;xy=list(zip(points[::2],points[1::2]));dots=[(num(e,'cx'),num(e,'cy'))for e in circles if e.get('fill')==pl.get('stroke')]
   assert len(xy)==len(dots)and all(any(dist(p,d)<1e-6 for d in dots)for p in xy)
   values=[(xvalue(x),yvalue(y))for x,y in xy];assert all(values[k][0]<values[k+1][0]for k in range(len(values)-1));series.append(values)
   if len(polylines)==2:
    legend=one(e for e in lines if e.get('stroke')==pl.get('stroke')and num(e,'y1')<35);label=one(t for t in texts if abs(num(t,'x')-(num(legend,'x2')+20))<1e-6 and num(t,'y')<35);assert txt(label)==('A'if len(series)==1 else'B')
  assert len(series)==(2 if i in(19,24,25)else 1)
  return {'kind':'line','series':series}
 categories={txt(t):num(t,'x')for t in texts if num(t,'y')==313};assert categories
 shapes=[e for e in rects if num(e,'y')>35]or[e for e in lines if num(e,'stroke-width')==4];values={}
 for e in shapes:
  if tag(e)=='rect':x=num(e,'x')+num(e,'width')/2;y=num(e,'y');close(y+num(e,'height'),baseline)
  else:x,y=point(e,'2');close(point(e,'1')[1],baseline)
  name=min(categories,key=lambda k:abs(categories[k]-x));assert abs(categories[name]-x)<20
  val=yvalue(y)
  if i==17:values.setdefault(name,{})[e.get('fill')]=val
  else:assert name not in values;values[name]=val
 if i==17:
  legend={}
  for e in rects:
   if num(e,'y')>=35:continue
   t=one(t for t in texts if abs(num(t,'x')-(num(e,'x')+num(e,'width')+50))<1e-6 and num(t,'y')<35);legend[e.get('fill')]=txt(t)
  assert set(legend.values())=={'Ұлдар','Қыздар'};values={k:{legend[color]:v for color,v in pairs.items()}for k,pairs in values.items()}
 if i==27:
  assert set(values)=={'5','4','2'}and set(categories)=={'5','4','3','2'};assert one(txt(t)for t in texts if abs(num(t,'x')-categories['3'])<1e-6 and num(t,'y')<300)=='?'
 if i==26:assert yvalue(baseline)==80 and len(paths)==1 and not circles
 return {'kind':'vertical','values':values,'baselineValue':yvalue(baseline)}
def diffs(vals):return [b-a for a,b in zip(vals,vals[1:])]
def series_rate(points):
 rates={(b[1]-a[1])/(b[0]-a[0])for a,b in zip(points,points[1:])};return one(rates)
def checkAnswer(r,i,o):
 proof={};n=ns(r['statement']);out=None
 def choose(predicate):
  answer=one(v for v in r['options']if predicate(v));assert r['answer']==answer;return answer
 def choose_truth(truth):
  assert len(truth)==len(r['options'])and sum(truth)==1;answer=r['options'][truth.index(True)];assert r['answer']==answer;return answer
 def single_letter(wanted):return choose(lambda v:v==wanted)
 def tuple_answer(wanted):
  assert ns(r['answer'])==wanted and sum(ns(v)==wanted for v in r['options'])==1;return list(map(str,wanted))
 values=o.get('values');sectors=o.get('sectors');cells=o.get('cells');series=o.get('series')
 if i==0:
  wanted=n[-1];actual={k:v['angle']/F(36,10)for k,v in sectors.items()};assert sorted(actual.values())==sorted(n[:3]);result=single_letter(one(k for k,v in actual.items()if v==wanted));proof['actualPercentages']=actual
 elif i==1:result=single_letter(one(k for k,v in values.items()if v==2*values['B']));proof['doubleB']=2*values['B']
 elif i==2:
  labelled=[one(ns(label))for k in('A','B')for label in sectors[k]['labels']if'%'in label];out=100-sum(labelled);assert sectors['C']['angle']==out*F(36,10)
 elif i==3:
  assert cells[0][0]=='t сағ'and cells[1][0]=='T °C';times=list(map(numeric,cells[0][1:]));out=one(set(diffs(times)));assert out>0
 elif i==4:
  p=one(series);maximum=max(y for x,y in p);time=one(x for x,y in p if y==maximum);result=choose(lambda v:ns(v)==[time]);proof.update(temperature=maximum,requestedTime=time)
 elif i==5:
  assert cells[1][0]=='h мм';threshold=one(set(n));rain=list(map(numeric,cells[1][1:]));out=sum(v>threshold for v in rain);assert threshold in rain;proof['strictlyGreaterValues']=[v for v in rain if v>threshold]
 elif i==6:
  gap=one(n)
  def valid(v):a,b=re.findall(r'\b[A-D]\b',v);return abs(values[a]-values[b])==gap
  result=choose(valid);proof['allMCQGaps']=[abs(values[a]-values[b])for a,b in[re.findall(r'\b[A-D]\b',v)for v in r['options']]]
 elif i==7:
  assert'ТӨРТ'in r['statement'];result=single_letter(one(k for k,v in values.items()if v-values['A']==4))
 elif i==8:
  out=sectors['B']['angle']/360;result=choose(lambda v:H.calc(v)==out);proof['requestedFraction']=out
 elif i==9:out=sum(values.values());assert len(values)==5
 elif i==10:
  counts=[y for x,y in one(series)];growth=diffs(counts);out=max(growth);assert out>0;proof.update(allAdjacentChanges=growth,notDailyMaximum=max(counts))
 elif i==11:
  pass
 elif i==12:
  assert cells[0]==['Команда','Жеңіс','Тең','Жеңіліс'];scores={};target={}
  for row in cells[1:]:
   w,d,l=map(numeric,row[1:]);assert all(v.denominator==1 and v>=0 for v in[w,d,l])and w+d+l==3;scores[row[0]]=3*w+d;target[row[0]]=[w,d,l]
  assert sum(v[0]for v in target.values())==sum(v[2]for v in target.values())and sum(v[1]for v in target.values())%2==0
  fixtures=list(itertools.combinations('ABCD',2));witnesses=[]
  for outcomes in itertools.product(range(3),repeat=len(fixtures)):
   ledger={k:[0,0,0]for k in'ABCD'}
   for (a,b),outcome in zip(fixtures,outcomes):
    if outcome==0:ledger[a][0]+=1;ledger[b][2]+=1
    elif outcome==1:ledger[a][1]+=1;ledger[b][1]+=1
    else:ledger[b][0]+=1;ledger[a][2]+=1
   if ledger==target:witnesses.append(outcomes)
  assert witnesses;result=single_letter(one(k for k,v in scores.items()if v==max(scores.values())));proof.update(allTeamScores=scores,actualSixMatchWitness=list(zip(fixtures,one(witnesses))))
 elif i==13:
  a,b,c,d=(values[k]for k in'ABCD');claims=[b==one(ns(r['options'][0]))*c,d-a==one(ns(r['options'][1])),a+c-d==one(ns(r['options'][2])),sum(values.values())==one(ns(r['options'][3]))]
  result=choose_truth(claims);proof.update(everyClaimTruth=claims,actualTotal=sum(values.values()),actualCombinedExcess=a+c-d)
 elif i==14:
  total=one(n);out=total*sectors['C']['angle']/360;counts=[total*v['angle']/360 for v in sectors.values()];assert all(c.denominator==1 for c in counts)and sum(counts)==total;proof['allIntegerPupilCounts']=counts
 elif i==15:
  assert cells[0][0]=='t мин'and cells[1][0]=='V л';times=list(map(numeric,cells[0][1:]));volumes=list(map(numeric,cells[1][1:]));assert times[0]==0
  rates=[(a-b)/(tb-ta)for a,b,ta,tb in zip(volumes,volumes[1:],times,times[1:])];rate=one(set(rates));assert rate>0;out=volumes[0]/rate;assert volumes[-1]/rate+times[-1]==out;proof.update(litresPerMinute=rate,requestedTimeFromStart=out)
 elif i==16:
  out=values['B']/sum(values.values())*100;proof['actualWholeCount']=sum(values.values())
 elif i==17:
  eligible={k:v for k,v in values.items()if v['Қыздар']>v['Ұлдар']};out=sum(sum(v.values())for v in eligible.values());assert set(eligible)=={'A','C'}and values['D']['Ұлдар']==values['D']['Қыздар'];proof['strictlySelectedWholeClasses']=eligible
 elif i==18:
  p=one(series);positiveRates=[];rest=F(0);travelTime=F(0)
  for (t,a),(u,b)in zip(p,p[1:]):
   assert b>=a
   if b==a:rest+=u-t
   else:positiveRates.append((b-a)/(u-t));travelTime+=u-t
  out=one(set(positiveRates));assert out==(p[-1][1]-p[0][1])/travelTime and rest>0
  proof.update(excludedRestHours=rest,actualMovingHours=travelTime,wrongIncludingRest=(p[-1][1]-p[0][1])/(p[-1][0]-p[0][0]))
 elif i==19:
  a,b=series;assert [x for x,y in a]==[x for x,y in b];gaps=[abs(by-ay)for (x,ay),(x2,by)in zip(a,b)];time=one(x for (x,y),gap in zip(a,gaps)if gap==max(gaps));result=choose(lambda v:ns(v)==[time]);proof.update(actualSameTimeGaps=gaps,requestedTime=time)
 elif i==20:out=one(n)*sectors['A']['angle']/360
 elif i==21:out=one(n)*sectors['A']['angle']/360;assert out.denominator==1
 elif i==22:
  calibration=one(ns(o['calibration']));assert calibration==one(n);unit=calibration/values['A'];out=unit*values['D'];proof.update(erasedScaleUnit=unit,actualGridLengths=values)
 elif i==23:
  gift=one(n);mass=sum(values.values());unit=gift/mass;out=unit*values['C'];assert sum(v*unit for v in values.values())==gift;proof.update(totalKilograms=mass,tengePerKilogram=unit)
 elif i==24:
  a,b=series;va=series_rate(a);vb=series_rate(b);assert a[0]==(0,0)and b[0][0]>0 and b[0][1]==0 and vb>va>0
  delay=b[0][0];ownTime=va*delay/(vb-va);t=delay+ownTime;distance=va*t;assert distance==vb*ownTime and (t,distance)in a and(t,distance)in b
  result=tuple_answer([t,distance]);proof.update(pursuerStart=delay,pursuerOwnTime=ownTime,requestedGlobalTime=t,distance=distance,noPursuerSegmentBeforeStart=True)
 elif i==25:
  a,b=series;va=series_rate(a);vb=series_rate(b);assert va>vb>0 and a[0][0]==b[0][0]==0 and b[0][1]>a[0][1]
  crossing=(b[0][1]-a[0][1])/(va-vb);out=crossing.numerator//crossing.denominator+1
  assert a[0][1]+va*out>b[0][1]+vb*out and a[0][1]+va*(out-1)<=b[0][1]+vb*(out-1)
  proof.update(equalTime=crossing,requestedFirstStrictIntegerWeek=out,lastShownWeek=a[-1][0],extrapolationOnlyBecauseConstantAdditionsExplicit=True)
 elif i==26:
  out=values['C']/values['A'];assert o['baselineValue']>0 and out!=(values['C']-o['baselineValue'])/(values['A']-o['baselineValue'])
  result=choose(lambda v:H.calc(v.replace('есе','').strip())==out);proof.update(requestedActualRatio=out,wrongVisibleHeightRatio=(values['C']-o['baselineValue'])/(values['A']-o['baselineValue']))
 elif i==27:
  pct=one(map(numeric,re.findall(r'(\d+)%',r['statement'])));total=values['4']*100/pct;out=total-sum(values.values());assert out>0 and out.denominator==1 and total.denominator==1
  proof.update(classTotal=total,missingBarNotZero=out)
 elif i==28:
  assert'ҮШ'in r['statement']
 elif i==29:
  prices=ns(one(re.findall(r'тиісінше (.*?) теңге',r['statement'])));assert len(prices)==3 and cells[0]==['Күн','A','B','C'];matrix=[[numeric(v)for v in row[1:]]for row in cells[1:]]
  assert len(matrix)==3 and any(v==0 for row in matrix for v in row);out=sum(sum(row[j]*prices[j]for j in range(3))for row in matrix)
  byColumns=sum(sum(row[j]for row in matrix)*prices[j]for j in range(3));assert out==byColumns;proof.update(allZeroCellsIncluded=True,actualColumnTotals=[sum(row[j]for row in matrix)for j in range(3)])
 elif i==30:
  p=one(series);v=dict(p);claims=[v[7]/v[4]==3,sum(v[j]for j in(6,7,8))==sum(v.values())/2,all(v[j+1]>v[j]for j in range(1,7)),v[9]==v[5]-100]
  result=choose_truth(claims);proof.update(everyClaimTruth=claims,actualAnnualTotal=sum(v.values()),summer=sum(v[j]for j in(6,7,8)))
 elif i==31:
  wanted=one(n);result=single_letter(one(k for k,v in sectors.items()if v['angle']==wanted));proof['wantedPercent']=wanted/F(36,10)
 elif i==32:
  years=list(map(numeric,cells[0][1:]));counts=list(map(numeric,cells[1][1:]));assert one(set(diffs(years)))==1;growth=diffs(counts);out=max(growth);proof['allYearlyChanges']=growth
 elif i==33:
  assert'БЕСІНШІ'in r['statement'];out=values['5']/sum(values.values())*100;proof.update(requestedMonth=5,notMaximumMonth=max(values,key=values.get),actualWhole=sum(values.values()))
 elif i==34:
  wholes=[one(ns(v))for v in o['wholeLabels']];angles=[one(p)['angle']for p in o['pies']];counts=[w*a/360 for w,a in zip(wholes,angles)];assert all(v.denominator==1 for v in counts)and counts[0]>counts[1]
  difference=counts[0]-counts[1];result=choose(lambda v:v.startswith('A сыныбында')and'оқушыға'in v and ns(v)==[difference]);proof.update(distinctClassWholes=wholes,actualPupilCounts=counts,requestedDifference=difference)
 elif i==35:
  p=one(series);distances=[y for x,y in p];out=sum(abs(v)for v in diffs(distances));assert distances[0]==distances[-1]==0 and out==2*max(distances);proof.update(requestedTravelDistance=out,notFinalDistanceFromHome=distances[-1])
 elif i==36:
  assert cells[0]==['Баға','A','B','C','D'];old=list(map(numeric,cells[1][1:]));new=list(map(numeric,cells[2][1:]));drops=[a-b for a,b in zip(old,new)];pct=[d/a*100 for d,a in zip(drops,old)]
  assert min(drops)>0;wanted=one(k for k,v in zip(cells[0][1:],pct)if v==max(pct));result=single_letter(wanted);proof.update(actualOldPriceBases=old,absoluteDrops=drops,relativeDrops=pct)
 elif i==37:out=360*values['B']/sum(values.values());proof['actualWholeCount']=sum(values.values())
 elif i==38:
  assert cells[0][0]=='t сағ'and cells[1][0]=='s км';times=list(map(numeric,cells[0][1:]));distance=list(map(numeric,cells[1][1:]));assert one(set(diffs(times)))==F(1,2)
  speeds=[d/t for d,t in zip(diffs(distance),diffs(times))];j=one(j for j,v in enumerate(speeds)if v==min(speeds));result=tuple_answer([times[j],times[j+1],speeds[j]]);proof.update(actualHalfHourDistanceChanges=diffs(distance),allIntervalSpeeds=speeds)
 else:raise AssertionError(i)
 if i==11:
  a=one(one(ns(v))for v in sectors['A']['labels']if'°'in v);b=one(one(ns(v))for v in sectors['B']['labels']if'%'in v);out=100-a/F(36,10)-b;assert sectors['C']['angle']==out*F(36,10)
 if i==28:
  a=one(one(ns(v))for v in sectors['A']['labels']if'%'in v);out=360*(100-a)/100/4;assert sectors['C']['angle']==out and sectors['B']['angle']==3*out
 if out is not None and i not in(8,26):
  assert one(ns(r['answer']))==out,(i,r['answer'],out)
  if r.get('options'):assert sum(ns(v)==[out]for v in r['options'])==1
  result=str(out)
 proof['answer']=result;return proof
def clean_source(s):
 s=s.replace('$','').replace('{,}',',').replace('\\,','')
 return re.sub(r'\\+(?:d?frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def source_recompute(q,i):
 # Manually read archived source givens/actual available diagrams, then
 # independently recompute the ORIGINAL targets. These are not new author
 # parameters and are never used as the new answer oracle.
 results=['B','C',100-40-35,12-9,14,sum(v>25 for v in[24,18,30,42,36,27]),['B','D'],'D',F(90,360),sum([40,55,35,60,50]),max(diffs([100,150,150,200,250,400,350])),100-F(1260,36)-25,'D',350+250-450,60*F(20,100),F(200,1)/F(20,5),F(28*100,24+28+22+26),12+14+11+13,F(48,5-1),14,F(24*135,360),F(72*150,360),F(36,6)*7,F(15000*60,45+30+60+15),[4,60],(1300-500)//(200-100)+1,F(160,120),F(10*100,40)-6-10-2,F((100-40)*36,10*4),6*400+3*650+6*300,'summer','C',max(diffs([840,870,910,960,1000])),F(50*100,20+25+30+50+40+35),['A',25*F(40,100)-30*F(30,100)],1600*2,'C',F(360*12,9+12+15+9),[1,F(3,2),60]]
 expected=results[i];key=clean_source(q['sourceAnswer'])
 if i in(0,1,7,12,31,36):assert key==expected
 elif i==6:assert re.findall(r'\b[A-D]\b',key)==expected
 elif i in(24,38):assert ns(key)==expected
 elif i==34:assert key.startswith('A сыныбында')and ns(key)==[expected[1]]
 elif i==30:
  v=[200,200,300,500,800,1200,1400,1300,900,500,300,200];assert sum(v[5:8])*2==sum(v)and v[6]!=v[3]*3 and v[0]==v[1]and v[8]>v[4]
  assert'Жазғы үш айдағы'in key
 elif i==8:assert H.calc(key)==expected
 elif i==26:
  whole,a,b=ns(key);assert whole+a/b==expected
 else:assert one(ns(key))==expected,(i,key,expected)
 return expected
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 batch=json.loads((ROOT/BATCH).read_text());rows=batch['editions'];assert len(rows)==39
 inventory=json.loads((ROOT/'problems/editorial/batches/visual-inventory.json').read_text())['records'];entries=[];observations=[];canaries=0;missing=[]
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId']);assert cap['grade']==5 and cap['status']=='captured'and q['checked']and q['solution']
  originalResult=source_recompute(q,i)
  if q.get('options'):assert one(v['text']for v in q['options']if v['correct'])==q['sourceAnswer']
  inv=one(v for v in inventory if v['occurrenceId']==r['sourceOccurrenceId']);assert inv['sourceSha256']==r['sourceCanonicalSha256']and inv['sourceId']==ref['sourceId']
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution'])
  if not r.get('options'):assert'options'not in r
  svg=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==r['figureSha256']
  try:o=observe(svg,i);proof=checkAnswer(r,i,o)
  except Exception as e:raise AssertionError(('NEW',i))from e
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:checkAnswer(bad,i,o)
  except(AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('badkeyaccepted',i))
  el=E.fromstring(svg);nodes=list(el.iter())
  if o['kind']in('pie','dualPie'):
   circle=one([e for e in nodes if tag(e)=='circle'][:1]);circle.set('r',str(num(circle,'r')*1.03))
  elif o['kind']=='table':
   cell=one([e for e in nodes if tag(e)=='rect'and e.get('x')is not None][:1]);cell.set('width',str(num(cell,'width')*1.03))
  elif o['kind']=='horizontal'and i==22:
   grid=one([e for e in nodes if tag(e)=='line'and e.get('stroke')=='#cfd9e5'][:1]);grid.set('x1',str(num(grid,'x1')+1))
  else:
   ticks=[e for e in nodes if tag(e)=='text'and isnumber(txt(e))and ((o['kind']=='horizontal'and num(e,'y')==305)or(o['kind']!='horizontal'and num(e,'x')==39))];tick=ticks[0];tick.text=str(numeric(txt(tick))+1)
  try:observe(E.tostring(el,encoding='unicode'),i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('physicalcanaryaccepted',i))
  available=ref['sourceId']not in{'849c012d81c60dcb','55c0d13fb23a92b2'}
  if not available:missing.append(ref['sourceId'])
  notes=['Full41saved/39newconditions/full official+newsolutions/everyMCQread.','All7archivedsourcepre sheets/7native343px sheets actually visually inspected; visible scales, cells including zeros, units, legends and labels readable.','Independent actual SVG visible-scale calibration/cell geometry/pie arc flags/point coordinates/legend colors; no authorparams/models/data-* oracle.',('Archivedrastermissing; skill preserved from explicit fullsavednumericalsolution, NOsourceimagecomparisonclaimed.'if not available else'Archivedsourceandoriginalnative343figurevisuallycomparedforpreservedcurriculumtarget, nottraced.')]
  if i==10:notes.append('Source849maxadjacentgrowthskillretainedhere. Frozeninitial51relatedSUMeditionunchanged andnotclaimedasthisspecificskillcoverage.')
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_full_source_new_solutions_every_MCQ_visible_SVG_scales_cells_legends_arcs_motion_percentage_bases_and_native343visualreview','notes':notes,'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterCompared':available,'checked':notes},'evidence':{'oracle':'scripts/editorial/review-visual-wave80.py','sourceSheet':f'output/editorial-visual-wave80/visual-wave80-source-{i//6+1}.png','nativeSheet':f'output/editorial-visual-wave80/visual-wave80-contact-{i//6+1}.png','mobileWidthPx':343,'sourceRasterAvailable':available,'sourceRasterCompared':available,'figureSha256':sha}})
  observations.append({'editionId':r['editionId'],'originalTargetIndependentResult':originalResult,'actualSvg':o,'independentNewTarget':proof})
 for retained in batch['coverage']['previousEditionsRetained']:
  q=one(q for q in json.loads((ROOT/retained['sourceFile']).read_text())['questions']if q['id']==retained['sourceId'])
  expected=11-5 if retained['editionId']=='visual-shoot-growth'else 8-3
  assert one(ns(q['sourceAnswer']))==expected
 assert len(missing)==2
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==25
 report={'schemaVersion':1,'reviewer':'root_independent_of_visual80_author','batch':BATCH,'scope':__doc__,'summary':{'verified':39,'retainedNotResigned':2,'findings':0,'fullSavedConditionsOfficialSolutionsEveryMCQRead':41,'fullNewConditionsSolutionsEveryMCQRead':39,'availableArchivedSourceRastersActuallyViewed':39,'availableNewEditionSourceRastersCompared':37,'unavailableSourceRastersNotCompared':2,'native343FiguresActuallyViewed':39,'wrongKeysRejected':39,'physicalSvgCanariesRejected':canaries,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':39},'unavailableSourceRasters':missing,'retained':batch['coverage']['previousEditionsRetained'],'actualPhysicalSvgObservations':observations,'entries':entries}
 report=json.loads(json.dumps(report,default=str,ensure_ascii=False))
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary']))
if __name__=='__main__':main()
