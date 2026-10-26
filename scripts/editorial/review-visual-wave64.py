"""Independent full9 saved/new/official+new solutions/MCQ and four343px sheets read."""
import hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave64-pictured-decimal-shifts.json'
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def val(s):return F(s.replace(',','.'))
VALUES=list(map(val,['10','100','1000','0,1','0,01','0,001']))
OPS=[(symbol,v) for symbol in ['×','÷'] for v in VALUES]
def apply(a,op):return a*op[1] if op[0]=='×' else a/op[1]
def operation(s):
 symbol,v=s.split(' ');assert symbol in ['×','÷'];return symbol,val(v)
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k))
 ts=[e for e in es if tag(e)=='text'];rs=[e for e in es if tag(e)=='rect' and e.get('stroke')];ls=[e for e in es if tag(e)=='line'];paths=[e for e in es if tag(e)=='path']
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 def line(x1,y1,x2,y2):return only(e for e in ls if all(abs(n(e,k)-v)<1e-7 for k,v in zip(['x1','y1','x2','y2'],[x1,y1,x2,y2])))
 def rect(x,y,w,h,fill):
  e=only(e for e in rs if n(e,'x')==x and n(e,'y')==y);close(n(e,'width'),w);close(n(e,'height'),h);assert e.get('fill')==fill
 def numericChoice(answer):assert sum(val(o)==answer for o in r['options'])==1
 if i==0:
  ds=[at(120+80*j,189) for j in range(4)];assert ds==['0','6','8','4']
  for j in range(4):rect(80+80*j,142,80,68,'#fff')
  gray=only(e for e in paths if e.get('stroke')=='#9ca5b2');red=only(e for e in paths if e.get('stroke')=='#cd5366' and ' q ' in e.get('d',''))
  assert gray.get('d')=='M 160 213 q 3 14 -8 25' and red.get('d')=='M 320 213 q 3 14 -8 25'
  arcs=[e.get('d') for e in paths if ' C ' in e.get('d','')];assert arcs==['M 160 134 C 164 77, 232 77, 240 134','M 240 134 C 244 77, 312 77, 320 134']
  initial=F(int(''.join(ds)),1000);final=F(int(''.join(ds)),10);assert initial==F(684,1000) and final==F(684,10)
  outputs=[apply(initial,operation(o)) for o in r['options']];assert outputs==[final,initial/100,initial/100,initial*10]
  assert sum(x==final for x in outputs)==1
  return '÷ 0,01',{'actualDigits':ds,'actualGrayRedCommaX':[160,320],'twoActualArrowArcsRightward':True,'initial':str(initial),'final':str(final),'allMCQOutputs':list(map(str,outputs)),'mathematicalOperationInvariantHonest':True}
 if i in [1,4,6]:
  anchors=sorted((n(e,'x'),val(txt(e))) for e in ts if n(e,'y')==233);x0,v0=anchors[0];assert v0==0;x1,v1=anchors[1]
  ticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')<=186<=n(e,'y2'));step=ticks[1]-ticks[0]
  index1=round((x1-x0)/step);close(x1-x0,index1*step);unit=(v1-v0)/index1
  assert unit==(F(1,1000) if i==4 else F(1,100))
  for j,x in enumerate(ticks):close(x,x0+j*step)
  for x,v in anchors:close((x-x0)/step,float((v-v0)/unit))
  points={}
  for e in es:
   if tag(e)=='circle':
    x=n(e,'cx');assert n(e,'cy')==186;label=at(x,156);assert label in ['A','B'];index=round((x-x0)/step);close(x,x0+index*step);points[label]=unit*index
  assert points=={1:{'A':F(17,100)},4:{'A':F(6,1000),'B':F(23,1000)},6:{'A':F(4,100),'B':F(18,100)}}[i]
  proof={'actualPrintedAnchors':[(x,str(v)) for x,v in anchors],'allEqualPhysicalTicks':len(ticks),'actualUnitFromPrintedAnchorAndTickCount':str(unit),'actualPointValues':{k:str(v) for k,v in points.items()}}
  if i==1:
   assert '100 санына көбейтіңіз' in r['statement'];out=points['A']*100;assert out==17;return '17',dict(proof,requestedCoordinateTimes100=str(out))
  if i==4:
   gap=points['B']-points['A'];out=gap*1000;assert gap==F(17,1000) and out==17;assert 'АЙЫРМАНЫ 1000' in r['statement'];return '17',dict(proof,requestedDifference=str(gap),requestedDifferenceTimes1000=str(out),wrongBOnly=str(points['B']*1000))
  first=points['B']/F(1,1000);second=points['A']/F(1,100);ratio=first/second;assert [first,second,ratio]==[180,4,45];assert points['B']/points['A']==F(45,10)
  return '45',dict(proof,firstBQuotient=str(first),secondAQuotient=str(second),requestedFirstOverSecond=str(ratio),coordinateRatioIsNotRequested=True)
 if i in [2,3]:
  for j,fill in enumerate(['#dceeff','#fff','#fff0b8']):rect(20+176*j,153,88,62,fill)
  assert at(240,193)=='' and at(416,193)=='?';start=val(at(64,193));ops=[operation(at(x,159)) for x in [152,328]]
  for x1,x2 in [(115,189),(291,365)]:line(x1,184,x2,184);assert any(e.get('d')==f'M {x2} 184 l -8 -5 l 0 10 Z' for e in paths)
  intermediate=apply(start,ops[0]);out=apply(intermediate,ops[1])
  assert [start,intermediate,out]==([F(64,10),640,F(64,100)] if i==2 else [F(307,100),3070,30700])
  if i==2:numericChoice(out);assert out==start/10
  else:assert out==start*10000
  assert apply(out,('×',ops[1][1]))==intermediate and intermediate/ops[0][1]==start
  return ('0,64' if i==2 else '30700'),{'actualPrintedStart':str(start),'actualPrintedOperations':[(s,str(v)) for s,v in ops],'actualArrowsLeftToRight':True,'intermediate':str(intermediate),'requestedLastNode':str(out),'necessaryAppendedZero':True,'internalZeroPreserved':i==3,'bothReverseStepsVerified':True}
 if i==5:
  assert at(69,164)=='a' and at(69,222)=='b'
  for row in range(2):
   rect(42,125+58*row,54,58,'#dceeff')
   for col in range(3):rect(96+114*col,125+58*row,114,58,'#fff0b8' if row==1 and col==2 else '#fff')
  a,b,c=[val(at(x,164)) for x in [153,267,381]];A,B=[val(at(x,222)) for x in [153,267]];assert [a,b,c,A,B]==[F(56,10),F(48,100),F(23),F(56,1000),F(48,10000)];assert at(381,222)=='?'
  fitting=[op for op in OPS if apply(a,op)==A and apply(b,op)==B];assert fitting==[('×',F(1,100)),('÷',F(100))];outputs={apply(c,op) for op in fitting};assert outputs=={F(23,100)};numericChoice(F(23,100));assert 'бірдей БІР амалмен' in r['statement']
  return '0,23',{'actualPrintedKnownPairs':[(str(a),str(A)),(str(b),str(B))],'all12AllowedNamedOpsChecked':True,'bothPairsConstrainSameRule':True,'fittingNamedOps':[(s,str(v)) for s,v in fitting],'uniqueRequestedOutput':'23/100','duplicateNumericRulesDoNotProduceAmbiguousOutput':True}
 if i==7:
  values=[val(at(54+124*j,194)) for j in range(4)];assert values==[F(72,100),F(72),F(72,1000),F(72,10)]
  for j in range(4):rect(15+124*j,155,78,60,'#dceeff' if j in [0,2] else '#fff')
  for j in range(3):line(97+124*j,185,135+124*j,185);assert at(116+124*j,158)=='?'
  fitting=[[op for op in OPS if apply(values[j],op)==values[j+1]] for j in range(3)];assert list(map(len,fitting))==[2,2,2]
  tuples=[ops for ops in itertools.product(OPS,repeat=3) if all(apply(values[j],ops[j])==values[j+1] for j in range(3))];assert len(tuples)==8;assert 'бөлек таңдау саналады' in r['statement']
  return '8',{'actualAllFourNodeValues':list(map(str,values)),'actualThreeForwardArrowUnknowns':True,'all12CubedNamedOperationTuplesEvaluated':1728,'eachArrowFittingOps':[[(s,str(v)) for s,v in xs] for xs in fitting],'independentTupleCount':len(tuples),'invariantCountNotNewSemanticFamily':True}
 assert i==8
 ds=[at(104+68*j,177) for j in range(5)];assert ds==list('50683')
 for j in range(5):rect(70+68*j,131,68,67,'#fff')
 labels=[at(70+68*j,261) for j in range(6)];assert labels==list('PQRSTU')
 for j in range(6):
  line(70+68*j,200,70+68*j,224);only(e for e in es if tag(e)=='circle' and n(e,'cx')==70+68*j and n(e,'cy')==200)
 initial=only(e for e in paths if e.get('stroke')=='#203549');assert initial.get('d')=='M 274 194 q 2 13 -7 20';start=round((274-70)/68);assert labels[start]=='S'
 new=start+2-3;assert labels[start+2]=='U' and labels[new]=='R';integer=int(''.join(ds));before=F(integer,10**(5-start));after=before/F(1,100)/1000;assert before==F(50683,100) and after==F(50683,1000)
 assert r['options']==['P','R','Q','T'] and r['options'].count(labels[new])==1
 return 'R',{'actualDigitSequence':ds,'actualSlotLabels':labels,'actualInitialCommaSlot':'S','rightTwoThenLeftThreeSlots':['S','U','R'],'initialValue':str(before),'finalValue':str(after),'requestedLetterNotValue':True,'actualInternalZeroRetained':True}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==9;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=i//6+1
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full9 saved/new/official+new solutions/every MCQ read and four actual source/native343px sheets viewed; own actualSVG comma/arrow/cell/tick/slot observer, exact Fraction operation evaluation, complete12cubed named-op enumeration; no author params or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave64/visual-wave64-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave64/visual-wave64-contact-{sheet}.png','checked':['actual digit order, gray/red comma positions and two rightward arcs','all actual equal ray ticks and printed anchor unit, point position interpolation','all forward operation arrows and requested last node rather than intermediate','necessary zero padding and retained internal zero','both table pairs constrain one allowed rule, same output under equivalent named ops','all12cubed independent operation choices, separate named choices','actualsix labelled comma slots and right2thenleft3 path','all9 actual343px source/native diagrams legible']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave64.py','fullSavedAndNewRead':9,'actualSheetsViewed':4,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave64-pictured-decimal-shifts.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':9,'actualPrintedCommaShiftsRayUnitsAndNamedOps':True,'completeNamedOpTuples':1728,'hashesMatched':9,'actual343pxSheetsViewed':4}))
if __name__=='__main__':main()
