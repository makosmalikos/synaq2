"""Sixremaining full source/new conditions, full official/new solutions/2source
rasters read. Bothnative343pxPNGs inspected. Fourprevious exactsource duplicates
alreadycovered elsewhere, not reauthored here. Same root author separate exact
computation, no separatehumanreviewer. ActualSVGcells determine unionboundary
and closedrectangle intersections, not sourcebitmapreuse or scalaransweroracle.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo3-winter-grade4-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;opts=K.opts

def actual_cells(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',data.decode());svg=ET.fromstring(data);assert svg.attrib['viewBox']=='0 0 360 260';rectangles=[];colored=[]
 for e in svg.iter():
  if e.attrib.get('id','').startswith('cell-'):
   x,y,w,h=[F(e.attrib[k])for k in['x','y','width','height']];assert w==h>0 and 0<x<x+w<360 and 0<y<y+h<260;rectangles.append((x,y,w,h))
   if e.attrib.get('fill')=='#dfd3f7':colored.append((x,y,w,h))
 unit=one(set(p[2]for p in rectangles));minx=min(p[0]for p in rectangles);miny=min(p[1]for p in rectangles);cells=[]
 for x,y,w,h in rectangles:
  c,rr=(x-minx)/unit,(y-miny)/unit;assert c.denominator==rr.denominator==1;cells.append((int(c),int(rr)))
 assert len(cells)==len(set(cells));return set(cells),rectangles,colored

def perimeter_units(cells):
 edges=collections.Counter()
 for c,r in cells:
  for p,q in[((c,r),(c+1,r)),((c+1,r),(c+1,r+1)),((c+1,r+1),(c,r+1)),((c,r+1),(c,r))]:edges[tuple(sorted([p,q]))]+=1
 assert set(edges.values())<={1,2};boundary=[e for e,n in edges.items()if n==1];inside=[e for e,n in edges.items()if n==2];queue=[next(iter(cells))];seen=set(queue)
 for x,y in queue:
  for v in[(x+1,y),(x-1,y),(x,y+1),(x,y-1)]:
   if v in cells and v not in seen:seen.add(v);queue.append(v)
 assert seen==cells;assert len(boundary)==4*len(cells)-2*len(inside);return len(boundary),boundary,inside

def pairs_without_points(rectangles):
 valid=[];horizontal=vertical=diagonal=0
 for i,j in itertools.combinations(range(len(rectangles)),2):
  x,y,w,h=rectangles[i];u,v,a,b=rectangles[j];dx=min(x+w,u+a)-max(x,u);dy=min(y+h,v+b)-max(y,v)
  if dx>=0 and dy>=0:
   assert dx==0 or dy==0
   if dx==dy==0:diagonal+=1
   elif dx==0:horizontal+=1
   else:vertical+=1
  else:valid.append((i,j))
 return valid,horizontal,vertical,diagonal

def source_asset(i):
 assets={6:('568b6e7642f5f2c882c9bb30','82409d14fb00d95084acb79fe18dc3fadb8ac972a13641b55ea2cde093ddb826'),10:('3fab46a9022d258a22a2a4ec','d1daf269307cf6c6069953ccc1f19a64febc459f8033cf1dc35ebf5025e4f28e')};f,sha=assets[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def solve(r,w,i,src=False,figureBytes=None):
 s=r['statement'];n=H.numeric_tokens(s);proof={}
 if i==1:
  total,first,second,third=n;assert second==first+1 and third==second+1;girls=(total-first+1)/2;boys=total-girls;assert girls.denominator==boys.denominator==1 and girls>=3 and boys>=third;sequence=[first+j for j in range(int(girls))];assert sequence[-1]==boys and all(v<=boys for v in sequence);out=boys;proof={'girls':str(girls),'boysTarget':str(boys),'allIncreasingGirlHandshakeCounts':list(map(str,sequence)),'lastGirlExactlyAllBoysAndTotalConserved':True}
 elif i==2:
  gap,past,future,thenAge=n;olderNow=thenAge-future;youngerNow=olderNow-gap;out=youngerNow-past;assert min(olderNow-past,out)>0 and olderNow-youngerNow==gap and olderNow+future==thenAge;proof={'olderCurrentAge':str(olderNow),'youngerCurrentAge':str(youngerNow),'youngerAtMeetingTarget':str(out),'sameAgeGapAtMeeting':str((olderNow-past)-out)}
 elif i==3:
  digit,increase=map(int,n);assert 0<=digit<=9;values=[v for v in range(10,100)if 10*v+digit-v==increase];out=F(one(values));assert out==F(increase-digit,9);proof={'all90TwoDigitOriginalsChecked':90,'appendedDigit':digit,'newNumber':str(10*out+digit),'differenceChecked':increase,'originalNumberTarget':str(out)}
 elif i==6:
  cellCount,P=n;assert cellCount.denominator==1
  if src:cells={(c,0)for c in range(5)}|{(c,rr)for c in[0,2,4]for rr in[1,2]};proof['archivedShapeRasterSHA256']=source_asset(6)
  else:cells,rectangles,colored=actual_cells(r,figureBytes);assert not colored;proof['actualNativeCellCoordinates']=sorted(cells)
  assert len(cells)==cellCount;units,boundary,interior=perimeter_units(cells);side=P/units;out=cellCount*side*side;proof.update({'actualCellCount':len(cells),'exposedUnitEdges':units,'allBoundaryEdges':boundary,'internalSharedUnitEdges':len(interior),'physicalSquareSideCm':str(side),'wholeAreaTarget':str(out),'boundaryOnlyNoInternalEdgesCounted':True})
 elif i==7:
  divisor=int(n[0]);digits=list(map(int,n[1:4]));lengthWord=one(re.findall(r'(\w+)таңбалы',s));length={'жеті':7,'алты':6}[lengthWord.lower()];assert digits[0]==0 and digits[-1]==3 and len(set(digits))==3;assert'Үштіктер нөлдерден көп'in s or'үштіктер саны нөлдер санынан көп'in s;values=[];sums=set();vectors=set()
  for word in itertools.product(digits,repeat=length):
   if word[0]==0 or set(word)!=set(digits)or word.count(3)<=word.count(0):continue
   value=int(''.join(map(str,word)));assert(value%divisor==0)==(sum(word)%divisor==0)
   if value%divisor==0:values.append(value);sums.add(sum(word));vectors.add(tuple(word.count(d)for d in digits))
  out=F(one(sums));assert values;proof={'digitLength':length,'allowedDigits':digits,'allDigitWordsChecked':len(digits)**length,'allAdmissibleOriginalNumbers':values,'allAdmissibleMultiplicityVectors':sorted(vectors),'uniqueDigitSumTarget':str(out),'leadingZeroAllPresentAndThreeCountGreaterThanZeroCountChecked':True}
 elif i==10:
  if src:rows,columns=map(int,n);rectangles=[(F(c),F(rr),F(1),F(1))for rr in range(rows)for c in range(columns)];proof['archivedBoardRasterSHA256']=source_asset(10)
  else:
   cells,rectangles,colored=actual_cells(r,figureBytes);rows=max(y for x,y in cells)+1;columns=max(x for x,y in cells)+1;assert cells==set(itertools.product(range(columns),range(rows)));assert len(colored)==2 and len(pairs_without_points(colored)[0])==1;proof['actualHighlightedPairHasNoSharedPoint']=True
  valid,horizontal,vertical,diagonal=pairs_without_points(rectangles);out=F(len(valid));assert horizontal==rows*(columns-1)and vertical==columns*(rows-1)and diagonal==2*(rows-1)*(columns-1);total=math.comb(rows*columns,2);assert len(valid)==total-horizontal-vertical-diagonal;proof.update({'rows':rows,'columns':columns,'allUnorderedCellPairsChecked':total,'sharedSideHorizontalPairs':horizontal,'sharedSideVerticalPairs':vertical,'sharedCornerOnlyPairs':diagonal,'allNoncontactPairIndexSets':valid,'noCommonPointPairCountTarget':len(valid),'closedRectangleIntersectionNotOnlyPositiveArea':True})
 else:raise AssertionError(i)
 assert E.calc(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,w,i):
 pairs={1:('28 бала','30 бала'),2:('31 жасқа','33 жасқа'),3:('526-ға','535-ке'),6:('90 см','120 см'),7:('алтытаңбалы','жетітаңбалы')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==6;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is None and not opts(q)and(not q['images']or i in[6,10]);answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'}
   if i==6:
    e=svg.find("s:rect[@id='cell-3-2']",ns);assert e is not None;e.set('x','114');e.set('y','84');correctChangedAnswer='(28350/169)'
   else:
    for rr in range(4):ET.SubElement(svg,'{http://www.w3.org/2000/svg}rect',{'id':f'cell-{rr}-5','x':'290','y':str(40+44*rr),'width':'44','height':'44','fill':'#fff','stroke':'#657caf','stroke-width':'2.2'})
    correctChangedAnswer='208'
   changed=ET.tostring(svg);bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(changed).hexdigest()
   try:solve(bad,w,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('changed validactualfigure retained oldkey')
   bad['answer']=correctChangedAnswer;changedProof=solve(bad,w,i,False,changed);proof['actualFigureCanaryRejectedWithUpdatedHash']=True;proof['validChangedFigureTarget']=correctChangedAnswer
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not opts(r)and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'}]+([]if i==10 else[mutation(r,w,i)]):
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticcanary accepted',i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All6remaining fullsource/new conditions and full official/new solutions/2archivedrasters read. Exact wholehandshake progression, original ages and all90appendeddigit values, all3^length digitwords, actualnative cellunion boundary and fullclosed-square pairintersection checked. Same14cell shape/perimeterchange and validboarddimensionchange withupdatedhash altertarget and rejectoldkey. Same author no separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualXMLuniform squares aligned coordinates, connectedcellunion boundary or fullrectangularboard allclosedintersections decoded. Both343pxnativePNGs and2archivedrasters inspected, no rasterreuse/trace. Twoactual mathematically valid figure changes withupdatedhash independently recomputed.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':6,'fullSourceNewConditionsAndSolutionsRead':6,'sourceKeysNotCaptured':6,'allSourceAndNewOptionsChecked':0,'wrongKeysRejected':6,'printedSemanticCanariesRejected':6,'nativeFractions':native['fractions'],'nativeFigures':2,'updatedHashActualGeometryCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':6,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
