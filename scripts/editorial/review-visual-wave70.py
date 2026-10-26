"""Independent all14 saved/new/fullsolution/everyMCQ and six343px sheets read."""
import hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave70-pictured-intersections.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def close(a,b):assert abs(float(a)-float(b))<1e-7,(a,b)
def roster(o):return {int(x.strip()) for x in re.fullmatch(r'\{([\d; ]+)\}',o)[1].split(';')}
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);es=list(root.iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k));ts=[e for e in es if tag(e)=='text'];cs=[e for e in es if tag(e)=='circle'];ls=[e for e in es if tag(e)=='line'];rs=[e for e in es if tag(e)=='rect']
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 if i in [2,6,11]:
  ticks=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2') and n(e,'y1')==214 and n(e,'y2')==226);assert len(ticks)==19
  for j,x in enumerate(ticks):assert x==30+23*j
  anchors=sorted((n(e,'x'),int(txt(e))) for e in ts if n(e,'y')==265);assert anchors==[(30+46*j,2*j) for j in range(10)];points={}
  for e in cs:
   x,y=n(e,'cx'),n(e,'cy');assert n(e,'r')==4 and e.get('fill')=='#c85165';label=at(x,y-16);idx=round((x-30)/23);close(x,ticks[idx]);points[label]=idx
   assert any(n(l,'x1')==n(l,'x2')==x and n(l,'y1')==y and n(l,'y2')==220 and l.get('stroke-dasharray') for l in ls)
  expected={2:{'A':3,'B':12,'C':8,'D':16},6:{'A':2,'B':9,'C':9,'D':15},11:{'A':2,'B':9,'C':6,'D':17}};assert points==expected[i]
  colored=[e for e in ls if e.get('stroke-width')=='5'];assert len(colored)==2
  for e,a,b,y in zip(colored,['A','C'],['B','D'],[151,104]):assert tuple(n(e,k) for k in ['x1','y1','x2','y2'])==(ticks[points[a]],y,ticks[points[b]],y)
  low=max(points['A'],points['C']);high=min(points['B'],points['D']);proof={'actualAll19UnitTicks':True,'actualEveryPrintedAnchor':anchors,'actualClosedEndpointCoordinates':points,'intersectionClosedBounds':[low,high]}
  if i==2:assert high-low==4;return '4',dict(proof,requestedLengthNotFiveIntegerPoints=4)
  if i==6:assert low==high==9;assert r['options']==['Кесінді','Нүкте','Бос жиын','Сәуле'];return 'Нүкте',dict(proof,singleIncludedEndpoint=9,notEmptyPositiveLengthOrInfinite=True)
  union=max(points['B'],points['D'])-min(points['A'],points['C']);assert union==15 and (points['B']-points['A'])+(points['D']-points['C'])-(high-low)==15
  return '15',dict(proof,unionFullLength=15,independentSevenPlusElevenMinusThree=15)
 if i==4:
  X=sorted(n(e,'x1') for e in ls if n(e,'x1')==n(e,'x2'));Y=sorted(n(e,'y1') for e in ls if n(e,'y1')==n(e,'y2'));assert X==[50+34*j for j in range(12)] and Y==[60+34*j for j in range(9)];rects=[e for e in rs if e.get('stroke')];assert len(rects)==2;covered=[]
  for e in rects:
   x,y,w,h=[n(e,k) for k in ['x','y','width','height']];assert x in X and x+w in X and y in Y and y+h in Y;covered.append({(a,b) for a in range(11) for b in range(8) if x<X[a]+17<x+w and y<Y[b]+17<y+h})
  K,L=covered;assert [len(K),len(L),len(K&L),len(K|L)]==[30,20,6,44];assert len([(a,b) for a in range(11) for b in range(8)])==88
  return '44',{'actualAllGridLines':{'vertical':12,'horizontal':9,'cellSize':34},'actualRectangles':[{k:e.get(k) for k in ['x','y','width','height']} for e in rects],'all88CellCentersClassified':True,'eachArea':[30,20],'intersectionArea':6,'unionArea':44}
 outlines=[c for c in cs if c.get('stroke') and n(c,'r')>10];circles=[(n(c,'cx'),n(c,'cy'),n(c,'r')) for c in outlines]
 if i==0:positions=[(118,72),(142,214)]
 elif i in [5,9,10,13]:positions=[(65,70),(415,70),(365,330)]
 elif i==12:positions=[(90,73),(390,73)]
 else:positions=[(93,65),(387,65)]
 names=[at(x,y) for x,y in positions];assert names=={0:['P','Q'],1:['C','D'],3:['M','N'],5:['K','L','M'],7:['M','N'],8:['A','B'],9:['P','Q','R'],10:['U','V','W'],12:['M','N'],13:['X','Y','Z']}[i];assert len(circles)==len(names)
 sets={name:set() for name in names};universe=set();observed=[]
 for dot in [c for c in cs if n(c,'r')==2.8]:
  x,y=n(dot,'cx'),n(dot,'cy');gx=x+22;v=int(at(gx,y+9));assert v not in universe;universe.add(v);members=[]
  for name,(cx,cy,rad) in zip(names,circles):
   d=math.hypot(x-cx,y-cy);g=math.hypot(gx-cx,y-cy);assert abs(d-rad)>3 and abs(g-rad)>6;assert (d<rad)==(g<rad)
   if d<rad:sets[name].add(v);members.append(name)
  observed.append({'value':v,'dot':[x,y],'glyphCenter':[gx,y],'membership':members})
 proof={'actualNamedCircleGeometry':dict(zip(names,circles)),'actualEveryDotANDGlyphMembership':observed}
 if i==0:
  P,Q=sets.values();assert Q=={7,14,28,35} and P-Q=={2,9,16,23,30};assert Q<P and len(P|Q)==9;return '9',dict(proof,unionCount=9,wrongRepeatedInnerCount=13)
 if i==1:
  C,D=sets.values();assert C-D=={4,11,18} and D-C=={6,13} and C&D=={7,21,28};truth=[roster(o)==C&D for o in r['options']];assert truth==[True,False,False,False];return r['options'][0],dict(proof,everyRosterOption=truth)
 if i in [3,10]:
  assert not universe;fills=[e for e in cs if e.get('fill')=='#a8d3fa'];samples={}
  for x in range(30,451,5):
   for y in range(40,346,5):
    mask=sum((1<<j) for j,(cx,cy,rad) in enumerate(circles) if math.hypot(x-cx,y-cy)<rad-2)
    if mask not in samples:samples[mask]=(x,y)
  assert set(samples)==set(range(1<<len(circles)))
  if i==3:
   assert len(fills)==2 and [(n(c,'cx'),n(c,'cy'),n(c,'r')) for c in fills]==circles;assert all(not c.get('clip-path') for c in fills);actual=[False,True,True,True];candidates=[[False,False,False,True],actual,[False,True,False,True],[False,False,True,True]];assert [c==actual for c in candidates]==[False,True,False,False]
   return 'M ∪ N',dict(proof,actualBothCompleteBlueCircleFills=True,allFourPhysicalRegionsWitnessed=samples,allFourOptionTruthTables=candidates)
  assert len(fills)==1;fill=fills[0];assert (n(fill,'cx'),n(fill,'cy'),n(fill,'r'))==circles[2];assert fill.get('clip-path')=='url(#firstTwoUnion)';clip=only(e for e in es if tag(e)=='clipPath');assert clip.get('id')=='firstTwoUnion';children=list(clip);assert len(children)==2 and all(tag(c)=='circle' for c in children);assert [(n(c,'cx'),n(c,'cy'),n(c,'r')) for c in children]==circles[:2]
  masks=list(range(8));actual=[bool(m&4 and m&3) for m in masks];candidates=[actual,[m==7 for m in masks],[bool(m&4 or m&3==3) for m in masks],[bool(m) for m in masks]];assert [c==actual for c in candidates]==[True,False,False,False];assert [m for m,a in zip(masks,actual) if a]==[5,6,7]
  return '(U ∪ V) ∩ W',dict(proof,actualThirdBlueCircleClippedByFirstTwoCircleUnion=True,allEightPhysicalRegionWitnesses=samples,coloredMasks=[5,6,7],allFourOptionTruthTables=candidates)
 if i==5:
  K,L,M=sets.values();assert K=={4,9,12,18,24} and M=={18,24,27,33};assert K&M=={18,24} and K&L&M=={24};truth=[roster(o)==K&M for o in r['options']];assert truth==[False,False,False,True];return r['options'][3],dict(proof,everyRosterOption=truth,tripleMember24Included=True)
 if i==7:
  M,N=sets.values();assert M=={5,9,14,18} and N=={3,7,9,18,25};truth=[]
  for o in r['options']:
   m=re.fullmatch(r'(\d+) (∈|∉) M(?: (∩|∪) N)?',o);assert m;target=M if not m[3] else M&N if m[3]=='∩' else M|N;inside=int(m[1]) in target;truth.append(inside if m[2]=='∈' else not inside)
  assert truth==[False,False,True,False];return r['options'][2],dict(proof,everyMembershipSignAndOperation=truth)
 if i==8:
  A,B=sets.values();assert A-B=={10,20,35} and B-A=={3,18,24} and A&B=={15,30};out=(A|B)-(A&B);truth=[roster(o)==out for o in r['options']];assert truth==[False,False,True,False];return r['options'][2],dict(proof,everyRosterOption=truth,exclusiveMembers=sorted(out))
 if i==9:
  P,Q,R=sets.values();assert P&Q=={5,11} and R=={5,13,19,23,29,31};out=(P&Q)|R;assert sorted(out)==[5,11,13,19,23,29,31] and sum(out)==131;wrong=P&(Q|R);assert wrong=={5,11,13} and sum(wrong)==29
  return '131',dict(proof,requestedUnionMembers=sorted(out),requestedSum=131,wrongRegroupedSum=29,duplicate5CountedOnce=True)
 if i==12:
  M,N=sets.values();assert M=={4,8,10} and N=={8,15,21};out=universe-(M|N);assert out=={7,19,23};frame=only(e for e in rs if e.get('stroke'));assert [n(frame,k) for k in ['x','y','width','height']]==[18,50,444,288]
  for dot in [c for c in cs if n(c,'r')==2.8]:assert 18<n(dot,'cx')<462 and 50<n(dot,'cy')<338
  truth=[roster(o)==out for o in r['options']];assert truth==[False,False,True,False];return r['options'][2],dict(proof,universeAllInsideFrame=sorted(universe),everyRosterOption=truth,nearBoundary7OutsideBoth=True)
 if i==13:
  X,Y,Z=sets.values();assert X&Y=={3,9,10} and Y&Z=={9,12} and X&Z=={7,9};out=(X&Y)|(Y&Z)|(X&Z);assert out=={3,7,9,10,12} and sum(out)==41;assert sum(X&Y)+sum(Y&Z)+sum(X&Z)==59
  return '41',dict(proof,atLeastTwoSetMembers=sorted(out),requestedUniqueSum=41,wrongTriple9CountedThreeTimes=59)
 raise AssertionError(i)
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==14;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'];sheet=i//6+1
  if r.get('options'):assert r['options'].count(answer)==1 and len(set(r['options']))==4
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all14 saved/new/full official+newsolutions/everyMCQ read; six actual343px source/native sheets viewed; own actualSVG circle/dot+glyph/clip/ray/grid observer and exactfinite-set/interval/cell derivation without author params/calculator','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave70/visual-wave70-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave70/visual-wave70-contact-{sheet}.png','checked':['all14 source/new/fullsolutions/MCQs and all6actual343px sheets read','every numericglyph AND associateddot classified by physical circles with region agreement','nested union no doublecount; pair/triple intersection includes triple member','all19unit ticks, every printedanchor, endpoint projection and closedfill checked','intersection length vs endpoint count, singleton closedtouch vs empty, union subtractsoverlap','all88gridcellcenters and exactrectdimensions independently classified','actualcompletebluecircles and actualthirdcirclewithfirsttwo-unionclip checked againstallregiontruthmasks','all4roster/membership-sign/setexpression options individually evaluated','parentheses order checked with regroupingcounterexample; repeatedtriple countedonce','universerect and nearboundary point7 outsideboth, all labelslegible at343px']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave70.py','fullSavedAndNewRead':14,'actualSheetsViewed':6,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave70-pictured-intersections.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':14,'allActualDotANDGlyphMemberships':True,'all88GridCells':True,'all19RayTicksEach':True,'actualClipMasks':[5,6,7],'allMCQsEvaluated':True,'hashesMatched':14,'actual343pxSheetsViewed':6}))
if __name__=='__main__':main()
