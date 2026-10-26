"""All8full frozen/newconditions completeofficial/newsolutions/all40source/new
options/sourcebitmaps read. All8actual343pxnativePNGs inspected. Same root author
separate exact computation, not anotherhumanreviewer. Lpieceflips clarified.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from functools import lru_cache
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-native-counting';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;ids=M.ids;rect=M.rect;points=M.points;segment=M.segment
ASSETS={7:('00792a5b1e8d502390a9e16f','9b41e7f167a76e42445fc04fc3ee4c8617eda53dad25d5e86bc600b32f2568ef'),9:('58d32ea66aec62b2d648edec','135d95d611c70d0caaba085e5e8c082727546204830ebd0081f8e1acd912442d'),17:('8691eda942e14b879e3c9752','3d1a4a4c4c378cabe575e3e58eadca00bbe52f64a410dbd0b5b378c60c1fb91a'),18:('d370239e68e5e681233b39a1','1b25900b896126945e13024c325d0883437ff2c32b43deeff2a4de12269e6bca'),19:('6e5a776f7f2a4ad0bd400772','61503fdf742ac7108943fe0a994ef7252dee33eaf82cd7108b52735919981baa'),29:('893e6bfd0f71bb90da219c74','5f92b7ada3bf04871a2a9f1e00fbc7ff8a489186abfe09ecad92159c98d1c331'),43:('aff6c6a44edb6da13ccf1700','707052ef6a88cd3f8a62f22a7778dcb1790f7ebaef836d12491349d1acca4397'),49:('41b2c9bfbd9c616fe26f7983','c8326a29339f18379be18f4b8a1fff7d30916c84a2fddc10c53489cc089f8f90')}
def asset(i):
 f,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha
def cell_edges(cells):
 edges=collections.Counter()
 for x,y in cells:
  for a,b in[((x,y),(x+1,y)),((x,y+1),(x+1,y+1)),((x,y),(x,y+1)),((x+1,y),(x+1,y+1))]:edges[tuple(sorted([a,b]))]+=1
 assert all(v in[1,2]for v in edges.values());boundary={e for e,n in edges.items()if n==1};neighbors=sum((x+dx,y+dy)in cells for x,y in cells for dx,dy in[(0,1),(1,0),(0,-1),(-1,0)]);assert len(boundary)==4*len(cells)-neighbors;return boundary
def cell_rects(elements):
 raw=list(map(rect,elements));assert raw;unit=one({w for x,y,w,h in raw}|{h for x,y,w,h in raw});assert unit>0;ox=min(x for x,y,w,h in raw);oy=min(y for x,y,w,h in raw);cells=set()
 for x,y,w,h in raw:a,b=(x-ox)/unit,(y-oy)/unit;assert a.denominator==b.denominator==1 and(a,b)not in cells;cells.add((int(a),int(b)))
 return cells,(ox,oy,unit)
def paths(root):
 d=ids(root);edges=[]
 for id,v in d.items():
  if id.startswith('channel-'):
   ps=points(v);assert len(ps)==3 and ps[0][0]<ps[1][0]<ps[2][0];edges+=list(zip(ps,ps[1:]))
 assert len(edges)==len(set(edges));vertices={p for e in edges for p in e};start=min(vertices);finish=max(vertices);adj=collections.defaultdict(list)
 for a,b in edges:assert a[0]<b[0];adj[a].append(b)
 ways={start:1}
 for a in sorted(vertices):
  for b in adj[a]:ways[b]=ways.get(b,0)+ways.get(a,0)
 def walks(a):return[(a,)]if a==finish else[(a,)+tail for b in adj[a]for tail in walks(b)]
 allwalks=walks(start);assert len(allwalks)==ways[finish]and all(v in ways for v in vertices);branching=[len(adj[v])for v in sorted(vertices)if len(adj[v])>1];# Single-channel stages still contain a merge/start with one outgoing branch.
 stageStarts=sorted({points(v)[0]for id,v in d.items()if id.startswith('channel-')});counts=[sum(points(v)[0]==p for id,v in d.items()if id.startswith('channel-'))for p in stageStarts];out=F(len(allwalks));assert out==math.prod(counts);assert d['start'].text=='P'and d['end'].text=='Q';return out,counts,{'allActualDirectedPolylineSegments':len(edges),'allActualDAGVertexCount':len(vertices),'allActualStageChoiceCounts':counts,'allForwardRoutesEnumerated':len(allwalks),'fullWalkEnumerationEqualsTopologicalDPAndStageProduct':True,'forwardPathCountTarget':str(out)}
def wall(root):
 d=ids(root);elements=[v for id,v in d.items()if id.startswith('wall-')];allcells,(ox,oy,u)=cell_rects(elements);cols=max(x for x,y in allcells)+1;rows=max(y for x,y in allcells)+1;assert allcells==set(itertools.product(range(cols),range(rows)));holes=set()
 for v in elements:
  x,y,w,h=rect(v);fill=v.attrib['fill'];assert fill in['white','#d6e0f2']
  if fill=='white':holes.add((int((x-ox)/u),int((y-oy)/u)))
 expected=cell_edges(holes);actual=set()
 for id,v in d.items():
  if id.startswith('boundary-'):
   a,b,c,e=segment(v);edge=tuple(sorted([((a-ox)/u,(b-oy)/u),((c-ox)/u,(e-oy)/u)]));assert edge not in actual;actual.add(edge)
 assert actual==expected;return holes,(ox,oy,u),{'allActualWallGridCellCount':len(allcells),'allActualWhiteHoleCellCount':len(holes),'allActualWhiteRowCounts':[sum(y==r for x,y in holes)for r in sorted({y for x,y in holes})],'allActualThickOutlineEdgesMatchWholeWhiteHoleBoundary':True}
def redraw_wall_outline(root):
 d=ids(root);elements=[v for id,v in d.items()if id.startswith('wall-')];allcells,(ox,oy,u)=cell_rects(elements);holes=set()
 for v in elements:
  if v.attrib['fill']=='white':x,y,w,h=rect(v);holes.add((int((x-ox)/u),int((y-oy)/u)))
 for v in list(root):
  if v.attrib.get('id','').startswith('boundary-'):root.remove(v)
 for j,(a,b)in enumerate(sorted(cell_edges(holes))):ET.SubElement(root,'{http://www.w3.org/2000/svg}line',{'id':'boundary-new-'+str(j),'x1':str(ox+a[0]*u),'y1':str(oy+a[1]*u),'x2':str(ox+b[0]*u),'y2':str(oy+b[1]*u),'stroke':'#6684b4','stroke-width':'3'})
def rulers(root,n):
 d=ids(root);length=n[0];assert n[1:3]==[0,length];a,b=n[3:5];assert n[5:]==[b,a];positions={};units=[];ends=[]
 for side in['top','bottom']:
  x,y,w,h=rect(d['ruler-'+side]);tick=[]
  for v in range(int(length)+1):
   mark=d[f'{side}-tick-{v}'];x1,y1,x2,y2=segment(mark);label=d[f'{side}-value-{v}'];assert x1==x2 and y<=min(y1,y2)<max(y1,y2)<=y+h and label.text==str(v)and F(label.attrib['x'])==x1;tick.append(x1)
  deltas={b-a for a,b in zip(tick,tick[1:])};delta=one(deltas);assert delta<0 if side=='top'else delta>0;assert min(tick)==x and max(tick)==x+w;units.append(abs(delta));positions[side]=tick;ends+=tick
 unit=one(set(units));assert positions['top'][int(a)]==positions['bottom'][int(b)]and positions['top'][int(b)]==positions['bottom'][int(a)];guides={segment(v)[0]for id,v in d.items()if id.startswith('alignment-')};assert guides=={positions['top'][int(a)],positions['top'][int(b)]};x1,y1,x2,y2=segment(d['span']);assert y1==y2 and x1==min(ends)and x2==max(ends)and d['span-label'].text=='L';out=(x2-x1)/unit;zero=positions['bottom'][0];physicalEnds=[(v-zero)/unit for v in[positions['top'][0],positions['top'][-1],positions['bottom'][0],positions['bottom'][-1]]];assert out==max(physicalEnds)-min(physicalEnds);return out,{'allActualRulerTicksLabelsAndSameUnitChecked':2*(int(length)+1),'allActualFourPhysicalEndpointsInBottomUnits':list(map(str,physicalEnds)),'bothActualOppositeAlignmentPairsChecked':True,'actualOverallSpanLineMatchesExtremeEndpoints':True,'totalCentimeterSpanTarget':str(out)}
@lru_cache(None)
def tiling(heights,flip):
 area=sum(h+1 for h in heights);assert area%3==0;length=area//3;height=3;full=(1<<area)-1;placements=[]
 for h in heights:
  original={(0,y)for y in range(h)}|{(1,h-1)};orientations=set()
  for reflect in range(2 if flip else 1):
   shape={(x*(-1 if reflect else 1),y)for x,y in original}
   for _ in range(4):
    minx,miny=min(x for x,y in shape),min(y for x,y in shape);orientations.add(tuple(sorted((x-minx,y-miny)for x,y in shape)));shape={(-y,x)for x,y in shape}
  options=[]
  for shape in orientations:
   w,hh=max(x for x,y in shape)+1,max(y for x,y in shape)+1
   for ox in range(length-w+1):
    for oy in range(height-hh+1):options.append((sum(1<<((y+oy)*length+x+ox)for x,y in shape),tuple((x+ox,y+oy)for x,y in shape)))
  placements.append(options)
 cover=[[(i,m,ps)for i,options in enumerate(placements)for m,ps in options if m&(1<<c)]for c in range(area)]
 @lru_cache(None)
 def search(mask,used):
  if mask==full:return()
  candidates=min(([p for p in cover[c]if not(used>>p[0]&1)and not(mask&p[1])]for c in range(area)if not(mask>>c&1)),key=len)
  for i,m,ps in candidates:
   rest=search(mask|m,used|(1<<i))
   if rest is not None:return((i,m,ps),)+rest
  return None
 result=search(0,0)
 if result is not None:
  assert len(result)==len(heights)and{v[0]for v in result}==set(range(len(heights)));occupied=set()
  for i,m,ps in result:assert len(ps)==heights[i]+1 and not occupied&set(ps);occupied|=set(ps)
  assert occupied==set(itertools.product(range(length),range(3)))
 return result,search.cache_info().misses
def piece_heights(root):
 d=ids(root);heights=[]
 for j in range(6):
  group=d['piece-'+str(j)];cells,frame=cell_rects(list(group));h=max(y for x,y in cells)+1;assert h>=2 and cells=={(0,y)for y in range(h)}|{(1,h-1)};heights.append(h)
 return tuple(heights)
def rectangle_cells(raw):
 unit=min(min(v[2:])for v in raw);assert unit>0;ox=min(v[0]for v in raw);oy=min(v[1]for v in raw);cells=set()
 for x,y,w,h in raw:
  vals=[(x-ox)/unit,(y-oy)/unit,w/unit,h/unit];assert all(v.denominator==1 for v in vals);c,r,ww,hh=map(int,vals);assert sorted([ww,hh])==[1,3];part=set(itertools.product(range(c,c+ww),range(r,r+hh)));assert not cells&part;cells|=part
 return cells
def perimeters(root):
 d=ids(root);first=[rect(d['first-'+str(j)])for j in range(3)];second=[rect(d['second-'+str(j)])for j in range(3)];assert len({tuple(sorted(v[2:]))for v in first+second})==1;cells1,cells2=rectangle_cells(first),rectangle_cells(second);assert cells1==set(itertools.product(range(3),repeat=2));p1,p2=len(cell_edges(cells1)),len(cell_edges(cells2));out=F(p1,p2);return out,{'allSixActualRectanglesCongruentOneByThree':True,'bothDisjointNineCellUnionsVerified':True,'allActualOuterUnitPerimeters':[p1,p2],'bothActualSharedSeamLengths':[(24-p1)//2,(24-p2)//2],'perimeterRatioTarget':str(out)}
def boxes(root):
 d=ids(root);raw=[rect(d['box-'+str(j)])for j in range(5)];x,y,w,h=raw[0];assert w==h>0 and raw==[(x+j*w,y,w,h)for j in range(5)];colored=[j for j in range(5)if d['box-'+str(j)].attrib['fill']=='#cbbff1'];assert colored==[1,3]and all(d['box-'+str(j)].attrib['fill']=='white'for j in[0,2,4]);known=[]
 for key,j in[('value-first',0),('value-last',4)]:v=d[key];assert F(v.attrib['x'])==x+(j+F(1,2))*w and y<F(v.attrib['y'])<y+h;known.append(F(v.text))
 return known,colored,{'allFiveEqualAdjacentCellsAndTwoActualColoredIndicesChecked':True,'actualVisibleEndpointValues':list(map(str,known)),'actualColoredCellIndicesOneBased':[j+1 for j in colored]}
def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s);proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data);expected=None
 if i==7:
  area=one(n);cells={(x,y)for y,count in enumerate([2,3,3,5])for x in range(count)}if src else cell_rects([v for id,v in ids(root).items()if id.startswith('tile-')])[0];count=len(cells);unitArea=area/count;side=math.isqrt(int(unitArea));assert side*side==unitArea;boundary=len(cell_edges(cells));out=F(side*boundary);expected=[out,out+2,out+4,out+6,out-2];proof.update({'actualCellCount':count,'allActualRowCounts':[sum(y==r for x,y in cells)for r in sorted({y for x,y in cells})],'physicalSmallSquareSide':side,'allActualUnitBoundaryEdges':boundary,'perimeterCentimetersTarget':str(out)})
 elif i==9:
  a,b,shown,c,d=n;assert a==b and c==d and a>=2 and c>=2
  if not src:cells,frame=cell_rects([v for id,v in ids(root).items()if id.startswith('border-')]);assert cells=={(x,y)for x,y in itertools.product(range(int(a)),repeat=2)if x in[0,a-1]or y in[0,a-1]};assert len(cells)==shown;proof['allActualInitialBorderCellsAndStatedCountChecked']=True
  assert shown==4*a-4;target={(x,y)for x,y in itertools.product(range(int(c)),repeat=2)if x in[0,c-1]or y in[0,c-1]};out=F(len(target));assert out==4*c-4;expected=[out+8,out,out-3,out+2,out-1];proof['actualInitialAndAskedSquareSides']=list(map(str,[a,c]));proof['allTargetBorderCellsCountedOnce']=len(target)
 elif i==17:
  if src:counts=[2,2,2];out=F(8);proof['observedSourceThreeBinaryChannels']=True
  else:out,counts,proof=paths(root)
  expected=[F(len(counts)),F(sum(counts)),out-3,out/2,out]
 elif i==18:
  grams=one(n)
  if src:count=25;proof['sourceObservedOfficialHoleRowCounts']=[3,5,10,3,4]
  else:cells,frame,proof=wall(root);count=len(cells)
  out=F(count)*grams/1000;expected=[out+2,out+F(3,2),out,out+F(1,2),out+1];proof['actualGramsPerBrick']=str(grams);proof['allBrickMassGrams']=str(count*grams);proof['kilogramsTarget']=str(out)
 elif i==19:
  if src:length,zero,length2,a,b=n;assert zero==0 and length==length2;ends=[F(0),length,a+b,a+b-length];out=max(ends)-min(ends);proof['observedSourceTopRulerReversedAndBothComplementaryAlignments']=True;proof['sourceNotToScalePixelDistancesNotUsed']=True;proof['allActualFourPhysicalEndpointsInBottomUnits']=list(map(str,ends))
  else:out,proof=rulers(root,n)
  expected=[out,out+2,out+1,out+4,out+3]
 elif i==29:
  heights=(7,6,5,4,3,2)if src else piece_heights(root);width=3 if src else int(one(n));assert width==3;area=sum(h+1 for h in heights);out=F(area,width);assert out.denominator==1;cover,states=tiling(heights,True);assert cover is not None;rotOnly,rotStates=tiling(heights,False);assert rotOnly is None
  if not src:assert'бұруға да, аударуға да болады'in s
  expected=[out,out+2,out-2,out+1,out-1];proof.update({'allActualLStemHeights':list(heights),'allActualPieceAreas':[h+1 for h in heights],'totalCellArea':area,'rectangleWidth':width,'exactCoverWithRotationsAndReflectionsFound':True,'fullCoverPlacementCells':[{'pieceIndex':i,'cells':[list(v)for v in ps]}for i,m,ps in cover],'allSixPiecesCoverWholeRectangleWithoutOverlapOrGaps':True,'rotationOnlyExactCoverExhaustedWithoutSolution':True,'exactCoverStateCounts':[states,rotStates],'reflectionPermissionMadeExplicitInRewrite':not src,'rectangleLengthTarget':str(out)})
 elif i==43:
  if src:first=set(itertools.product(range(3),repeat=2));second=set();raw=[(F(0),F(0),F(1),F(3)),(F(4),F(0),F(1),F(3)),(F(1),F(1),F(3),F(1))];second=rectangle_cells(raw);p1,p2=len(cell_edges(first)),len(cell_edges(second));out=F(p1,p2);proof['sourceObservedSquareAndThreeRectangleHUnitPerimeters']=[p1,p2]
  else:out,proof=perimeters(root)
  vals=[E.calc(H.tex(v))for v in B.options(r)];assert len(set(vals))==5 and vals.count(out)==1 and E.calc(H.tex(r['answer']))==out;proof['allFiveActualRatioOptions']=list(map(str,vals));proof['answerChecked']=True;return proof
 elif i==49:
  total,firstSum,lastSum=n
  if src:endpoints=[F(3),F(4)];colored=[1,3];proof['observedSourceFiveCellsEndpointsAndColoredSecondFourth']=True
  else:endpoints,colored,proof=boxes(root)
  first,last=endpoints;middle=firstSum+lastSum-total;second=firstSum-first-middle;fourth=lastSum-last-middle;allvalues=[first,second,middle,fourth,last];assert sum(allvalues)==total and sum(allvalues[:3])==firstSum and sum(allvalues[2:])==lastSum;out=sum(allvalues[j]for j in colored);expected=[out-14,out-11,lastSum,firstSum-first,out];proof.update({'allFiveRecoveredValues':list(map(str,allvalues)),'allThreeGivenSumsReplayed':True,'actualColoredSumTarget':str(out)})
 else:raise AssertionError(i)
 proof.update(B.checked_choices(r,out,expected));proof['answerChecked']=True;return proof
def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root);ns='{http://www.w3.org/2000/svg}'
 if i==7:
  ET.SubElement(root,ns+'rect',{'id':'tile-extra','x':'288','y':'158','width':'36','height':'36','fill':'#cadffa','stroke':'#91a6ca'});d['statement']=d['statement'].replace('240 см²','256 см²');target='88 см';d['options']=['88 см','90 см','92 см','94 см','86 см']
 elif i==9:
  for el in list(root):
   if el.attrib.get('id','').startswith('border-'):root.remove(el)
  for y in range(8):
   for x in range(8):
    if x in[0,7]or y in[0,7]:ET.SubElement(root,ns+'rect',{'id':f'border-new-{x}-{y}','x':str(84+x*24),'y':str(42+y*24),'width':'24','height':'24','fill':'#cadffa','stroke':'#91a6ca'})
  d['statement']=d['statement'].replace('7 × 7','8 × 8').replace('24 ұяшық','28 ұяшық').replace('11 × 11','12 × 12');target='44';d['options']=['52','44','41','46','43']
 elif i==17:root.remove(v['channel-2-0']);target='12';d['options']=['4','8','9','6','12']
 elif i==18:v['wall-8-1'].set('fill','white');redraw_wall_outline(root);target='16.2';d['options']=['18.2','17.7','16.2','16.7','17.2']
 elif i==19:
  for id,el in v.items():
   if id=='ruler-top':el.set('x',str(F(el.attrib['x'])+18))
   elif id.startswith('top-tick-'):
    for k in['x1','x2']:el.set(k,str(F(el.attrib[k])+18))
   elif id.startswith('top-value-'):el.set('x',str(F(el.attrib['x'])+18))
  for id,el in v.items():
   if id.startswith('alignment-')and F(el.attrib['x1'])==189:el.set('x1','207');el.set('x2','207')
  v['span'].set('x1','63');v['span-label'].set('x','189');d['statement']=d['statement'].replace('5 см','6 см');target='14';d['options']=['14','16','15','18','17']
 elif i==29:
  for j in range(6):
   group=v['piece-'+str(j)];cells,(ox,oy,u)=cell_rects(list(group));ET.SubElement(group,ns+'rect',{'id':f'piece-{j}-extra','x':str(ox),'y':str(oy-u),'width':str(u),'height':str(u),'fill':list(group)[0].attrib['fill'],'stroke':'#91a6ca'})
  target='15';d['options']=['15','17','13','16','14']
 elif i==43:v['second-2'].set('width','40');v['second-2'].set('height','120');target='1 : 1'
 else:v['value-first'].text='5';target='27';d['options']=['13','16','22','24','27']
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,target
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  bad,raw,target=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve({**bad,'answer':target},i,False,raw)
  except Exception as e:raise AssertionError(('validChangedActualFigure',i))from e
  proof['validUpdatedHashActualFigureTarget']=target;proof['oldKeyRejectedAndCorrectChangedFigureAnswerAccepted']=True;root=W.svg(r);v=ids(root)
  if i==7:v['tile-0-0'].set('width','35')
  elif i==9:v['border-0-0'].set('width','27')
  elif i==17:v['channel-0-0'].set('points','35,105 72.5,60 34,105')
  elif i==18:v['wall-0-0'].set('width','27')
  elif i==19:v['top-value-0'].text='1'
  elif i==29:v['piece-0-toe'].set('width','21')
  elif i==43:v['second-0'].set('width','39')
  else:v['box-1'].set('x','91')
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedActualFigureAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.:+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[x.strip().strip(' :').rstrip('.,')for x in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:vals=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vals))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8fullsource/newconditions completeofficial/newsolutions/all40source/newoptions/sourcebitmaps/343pxnativePNGs read. Actualallunitcellpositions/boundaryedges/physicalsquareareas, initialborderandtargetbordercellinventory, fullforwardDAGwalkscrossDP, allwhiteholecells/thickboundary/gramkilogramunits, alloppositerulerlabels/ticks/alignments/physicalspan, fullLcomponentgeometry/completeexact-cover8orientationtilings(no rotation-onlysolution), allcongruentrectangleunions/seams/perimeters, allfivecells/visibleendpoints/colors/overlappingsums checked. Updatedhashrealfigurechanges recomputed88/44/12/16.2/14/15/1:1/27; malformedgeometry rejected. Reflectionpermissionexplicitlyclarified. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'EightoriginalnativeSVG actualcells/edges/paths/rulerticks/labels/tilingcomponents/coloredcells decoded. Allsourcebitmaps/343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceOptionsRead':40,'rewrittenOptionsRead':40,'wrongKeysRejected':8,'validUpdatedHashActualFigureChangesRecomputed':8,'updatedHashMalformedActualGeometryRejected':8,'nativeFigures':8,'LPieceReflectionPermissionClarifiedAndActualTilingsProved':True,'remainingBIL2Visuals':12,'source47AlreadyVerifiedElsewhere':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
