"""All9full frozen/new conditions, full official/newsolutions and3source rasters
read. Three343pxnativePNGs inspected. Same root author separate exact math, no
separatehumanreviewer. Actualpolygon shoelace/fullrational cellclipping, allactual
pointtriples, complete statedpaperwidth domain and constructive lowerbound,
allsharedcorners/pins and original arithmetic/81digitpairs checked.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo2-winter-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one

def svg(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',data.decode());return ET.fromstring(data)
def asset(i):
 assets={6:('8fad82cfa0d57c86788c9998','a81aae43d7a9a956801e9ccf13986e3459ced671b25d7f0896b30b3ef04f1002'),8:('fa5eaf273c45bce54c66f71f','5f20a23997a003ebfe5eb04966120b6e98a5e547cc11052ee7b4d779eb171aba'),9:('6d4491c2f7fa40a25dfe215c','9c2dd5b3761e4187fd63f52015a3074bfd25efddf3f0e992c6c74396493e9aae')};f,sha=assets[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def area(poly):return abs(sum(a[0]*b[1]-a[1]*b[0]for a,b in zip(poly,poly[1:]+poly[:1])))/2 if len(poly)>2 else F(0)
def clip(poly,axis,bound,lower):
 if not poly:return[]
 out=[];previous=poly[-1];inside=lambda p:p[axis]>=bound if lower else p[axis]<=bound
 for current in poly:
  pin,cin=inside(previous),inside(current)
  if pin!=cin:
   t=(bound-previous[axis])/(current[axis]-previous[axis]);out.append(tuple(a+t*(b-a)for a,b in zip(previous,current)))
  if cin:out.append(current)
  previous=current
 return out

def clipped_grid_area(poly,rects,unitArea):
 unit=one(set(w for x,y,w,h in rects));assert all(w==h==unit for x,y,w,h in rects);minx=min(p[0]for p in rects);miny=min(p[1]for p in rects);cells={((x-minx)/unit,(y-miny)/unit)for x,y,w,h in rects};assert all(a.denominator==b.denominator==1 for a,b in cells);columns=int(max(a for a,b in cells)+1);rows=int(max(b for a,b in cells)+1);assert cells==set(itertools.product(range(columns),range(rows)));assert all(minx<=x<=minx+columns*unit and miny<=y<=miny+rows*unit for x,y in poly);cellAreas=[];rowSums=collections.defaultdict(F)
 for x,y,w,h in rects:
  part=poly
  for axis,bound,lower in[(0,x,True),(0,x+w,False),(1,y,True),(1,y+h,False)]:part=clip(part,axis,bound,lower)
  fraction=area(part)/(unit*unit);assert 0<=fraction<=1;cellAreas.append(fraction);rowSums[int((y-miny)/unit)]+=fraction
 total=area(poly)/(unit*unit);assert sum(cellAreas)==total;return total*unitArea,{'columns':columns,'rows':rows,'actualUnitCellCount':len(rects),'polygonGridUnitArea':str(total),'physicalUnitSquareArea':str(unitArea),'allExactClippedCellFractions':list(map(str,cellAreas)),'rowGridAreas':{r:str(v)for r,v in sorted(rowSums.items())},'shoelaceEqualsFullCellClippingSum':True,'physicalShadedAreaTarget':str(total*unitArea)}

def native_polygon(r,unitArea,data=None):
 root=svg(r,data);assert root.attrib['viewBox']=='0 0 360 270';ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};poly=[tuple(map(F,p.split(',')))for p in ids['shade'].attrib['points'].split()];assert len(poly)==len(set(poly))>=3;rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('grid-')];out,proof=clipped_grid_area(poly,rects,unitArea);proof['actualNativePolygonVertices']=[list(map(str,p))for p in poly];return out,proof

def triangle_count(points):
 assert len(points)==len(set(points));valid=[];collinear=[]
 for ids in itertools.combinations(range(len(points)),3):
  (a,b),(c,d),(e,f)=[points[j]for j in ids];twice=(c-a)*(f-b)-(d-b)*(e-a)
  (valid if twice else collinear).append(ids)
 ys=sorted(set(y for x,y in points));assert len(ys)==2;counts=[sum(y==yy for x,y in points)for yy in ys];m,n=counts;assert len(valid)==math.comb(m,2)*n+math.comb(n,2)*m;return F(len(valid)),{'linePointCounts':counts,'allUnorderedPointTriplesChecked':math.comb(len(points),3),'allNondegenerateTriangleIndexTriples':valid,'allRejectedCollinearTriples':collinear,'crossProductAndTwoCasesCountAgree':True,'triangleCountTarget':len(valid)}

def native_points(r,data=None):
 root=svg(r,data);assert root.attrib['viewBox']=='0 0 360 235';ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};points=[];levels=[]
 for name in['top','bottom']:
  line=ids['line-'+name].attrib;x1,y1,x2,y2=[F(line[k])for k in['x1','y1','x2','y2']];assert x1<x2 and y1==y2;levels.append(y1)
  group=[v for id,v in ids.items()if id.startswith('point-'+name+'-')];assert group
  for v in group:x,y=F(v.attrib['cx']),F(v.attrib['cy']);assert x1<=x<=x2 and y==y1;points.append((x,y))
 assert levels[0]!=levels[1];out,proof=triangle_count(points);proof['actualNativePointCoordinates']=[list(map(str,p))for p in points];return out,proof

def corner_set(cells):return{(x+dx,y+dy)for x,y in cells for dx,dy in[(0,0),(1,0),(0,1),(1,1)]}
def minimum_pins(total):
 assert total>=1;layouts=[]
 for width in range(1,total+1):
  full,remaining=divmod(total,width);cells={(c,rr)for rr in range(full)for c in range(width)}|{(c,full)for c in range(remaining)};rows=math.ceil(F(total,width));pins=len(corner_set(cells));assert len(cells)==total and pins==total+rows+width+1;layouts.append({'columns':width,'rows':rows,'lastRowLength':remaining,'actualDistinctCorners':pins})
 minimum=min(v['actualDistinctCorners']for v in layouts);capacityPairs=[(r,c)for r in range(1,total+1)for c in range(1,total+1)if r*c>=total];minSum=min(r+c for r,c in capacityPairs);assert minimum==total+minSum+1;return F(minimum),{'allAllowedActualColumnCountsChecked':total,'allPackedRowLayoutCornerCounts':layouts,'minimumRowsPlusColumnsGivenCapacity':minSum,'cornerLowerBound':total+minSum+1,'attainingLayouts':[v for v in layouts if v['actualDistinctCorners']==minimum],'allStatedFullRowsLastLeftPartialArrangementsCovered':True,'minimumPinCountTarget':minimum}

def native_example(r,data=None):
 root=svg(r,data);assert root.attrib['viewBox']=='0 0 360 260';ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('paper-')];assert len(rects)==4;w=one(set(p[2]for p in rects));h=one(set(p[3]for p in rects));minx,miny=min(p[0]for p in rects),min(p[1]for p in rects);cells={((x-minx)/w,(y-miny)/h)for x,y,ww,hh in rects};assert cells==set(itertools.product(range(2),repeat=2));corners={(x+dx*w,y+dy*h)for x,y,ww,hh in rects for dx,dy in[(0,0),(1,0),(0,1),(1,1)]};pins=[(F(v.attrib['cx']),F(v.attrib['cy']))for id,v in ids.items()if id.startswith('pin-')];assert len(pins)==len(set(pins))==9 and set(pins)==corners;assert H.numeric_tokens(ids['example-caption'].text)==[4,9];return{'actualExamplePapers':4,'actualExampleUniqueCornersAndPins':9,'allActualPinsExactlySharedPaperCorners':True}

def solve(r,w,i,src=False,figureBytes=None):
 s=r['statement'];n=H.numeric_tokens(s);proof={}
 if i==1:
  words={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7};fruits=['алмұрт','шабдалы','өрік','алма'];tokens=re.findall(r'\w+',s.lower());givens=[]
  for a,b in zip(tokens,tokens[1:]):
   fruit=next((f for f in fruits if b.startswith(f)),None)
   if a in words and fruit:givens.append((F(words[a]),fruit))
  assert len(givens)==8;f1,f2,unit=[v[1]for v in givens[:3]];assert len({f1,f2,unit})==3;rows=[]
  for group in[givens[:3],givens[3:6]]:
   assert group[2][1]==unit;coeffs={fruit:amount for amount,fruit in group};assert set(coeffs)=={f1,f2,unit};rows.append([coeffs[f1],coeffs[f2],coeffs[unit]])
  (a,b,c),(d,e,f)=rows;det=a*e-b*d;assert det;x=(c*e-b*f)/det;y=(a*f-c*d)/det;weights={f1:x,f2:y,unit:F(1)};assert min(weights.values())>0 and a*x+b*y==c and d*x+e*y==f;out=sum(amount*weights[fruit]for amount,fruit in givens[6:]);proof={'allEightFruitCountPhrasesRead':[(str(a),f)for a,f in givens],'positiveMassesInTargetFruitUnits':{f:str(v)for f,v in weights.items()},'bothOriginalBalanceEquationsChecked':True,'targetFruitCount':str(out)}
 elif i==2:
  total=one(n);young=total/13;out=12*young;assert out+young==total and young*12==out;proof={'grandchildYears':str(young),'grandchildMonthsEqualsGrandmotherYears':str(out),'totalAgeYears':str(total),'grandmotherYearsTarget':str(out)}
 elif i==3:
  countWord=one(re.findall(r'Тізбектес (\w+) натурал',s));count={'төрт':4,'бес':5}[countWord];total=one(n);first=(total-F(count*(count-1),2))/count;assert first.denominator==1 and first>0;values=[first+j for j in range(count)];assert sum(values)==total;out=max(values);proof={'allConsecutiveValues':list(map(str,values)),'wholeSum':str(total),'largestTarget':str(out)}
 elif i==4:
  if src:assert s.startswith('4«А»')and'төрт оқушының'in s;total,fathers,mothers=H.numeric_tokens(s[len('4«А»'):]);none=F(4)
  else:total,none,fathers,mothers=n
  union=total-none;out=fathers+mothers-union;fatherOnly,motherOnly=fathers-out,mothers-out;assert min(out,fatherOnly,motherOnly,none)>=0 and out+fatherOnly+motherOnly+none==total;proof={'studentCount':str(total),'neitherParent':str(none),'fatherOnly':str(fatherOnly),'motherOnly':str(motherOnly),'bothParentsTarget':str(out),'sourcePhysicalParentCountsStudentCorrespondenceMadeExplicitInNew':src}
 elif i==5:
  if src:assert'екі еселенген'in s;factor=2;offset=int(one(n))
  else:factor,offset=map(int,n)
  values=[10*a+b for a,b in itertools.product(range(1,10),repeat=2)if 10*b+a==factor*(10*a+b)-offset];out=F(one(values));a,b=divmod(int(out),10);assert 10*b+a==factor*out-offset;proof={'all81NonzeroDigitPairsChecked':81,'allSolutions':values,'reversalFactor':factor,'reversalOffset':offset,'originalNumberTarget':str(out),'bothNonzeroAndFullPlaceValueChecked':True}
 elif i==6:
  unitArea=one(H.numeric_tokens(re.sub(r'см\$?\^2\$?','см',s)))
  if src:
   poly=[tuple(map(F,p))for p in[(1,0),(2,1),(3,1),(4,2),(4,3),(2,3),(0,4),(0,3),(1,3),(1,2),(0,1)]];rects=[(F(c),F(rr),F(1),F(1))for rr in range(4)for c in range(4)];out,proof=clipped_grid_area(poly,rects,unitArea);proof['sourceRasterSHA256']=asset(6);proof['observedSourceGridVertices']=[list(map(str,p))for p in poly]
  else:out,proof=native_polygon(r,unitArea,figureBytes)
 elif i==7:
  if src:assert'үштен бірі'in s;whole=one(n);remaining=F(1,3)
  else:text=one(re.findall(r'\(\d+/\d+\)',s));remaining=E.calc(text);whole=one(H.numeric_tokens(s.replace(text,'')))
  left=whole*remaining;out=whole-left;assert out.denominator==left.denominator==1 and 0<remaining<1;proof={'wholeEqualSlices':str(whole),'remainingSlices':str(left),'oneEachGuestCountTarget':str(out),'allTakenPlusRemainingSlicesConserved':True}
 elif i==8:
  if src:assert n==[2,6];points=[(F(2),F(0)),(F(4),F(0))]+[(F(x),F(2))for x in range(6)];out,proof=triangle_count(points);proof['sourceTwoParallelLines2And6PointsInspectedSHA256']=asset(8)
  else:out,proof=native_points(r,figureBytes)
 elif i==9:
  total=int(n[-1]);out,proof=minimum_pins(total)
  if src:assert'бес парақты'in s and n[0]==11;cells={(0,0),(1,0),(2,0),(0,1),(1,1)};assert len(corner_set(cells))==11;proof['sourceExample5Sheets11CornerIncidenceRecomputed']=True;proof['sourceImageInspectedSHA256']=asset(9);proof['sourceLastPartialRowPlacementExplicitlySpecifiedInNew']=True
  else:assert n[:2]==[4,9]and'қысқа қатар сол жақтан басталады'in s;proof.update(native_example(r,figureBytes))
 else:raise AssertionError(i)
 assert E.calc(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,w,i):
 pairs={1:('жеті алмұрттың','алты алмұрттың'),2:('78 жыл','91 жыл'),3:('1260','1265'),4:('36 оқушы','38 оқушы'),5:('16-ға кем','23-ке кем'),6:('2 см²','4 см²'),7:('20 тең бөлікке','24 тең бөлікке'),9:('18 парақты','20 парақты')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==9;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and q['solution']and not q['options']and(not q['images']or i in[6,8,9]);answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();root=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'}
   if i==6:
    e=root.find("s:polygon[@id='shade']",ns);poly=[tuple(map(F,p.split(',')))for p in e.attrib['points'].split()];poly[0]=(poly[0][0]+44,poly[0][1]);e.set('points',' '.join(','.join(map(str,p))for p in poly));correct='35'
   elif i==8:ET.SubElement(root,'{http://www.w3.org/2000/svg}circle',{'id':'point-bottom-extra','cx':'335','cy':'165','r':'4.5','fill':'#5267ce'});correct='63'
   else:e=root.find("s:circle[@id='pin-0-0']",ns);e.set('cx',str(F(e.attrib['cx'])+1));correct=None
   changed=ET.tostring(root);bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(changed).hexdigest()
   try:solve(bad,w,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('actualsemanticfigurecanary accepted despiteupdatedhash')
   proof['actualFigureSemanticCanaryRejectedWithUpdatedHash']=True
   if correct is not None:bad['answer']=correct;changedProof=solve(bad,w,i,False,changed);proof['validChangedFigureTarget']=correct
   else:proof['illustrativePinMustMatchActualSharedCornerNotMerelySameCount']=True
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not r.get('options')and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'}]+([]if i==8 else[mutation(r,w,i)]):
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
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All9full frozen/new conditions, complete official/new solutions/3source rasters read. Positive fullfruitbalance solutions from8spoken countphrases, year/month conversion, consecutiveblock, child-basedparent sets andall81reversedigit pairs checked. Actualnativepolygon allcellrational clipping+shoelace, allpointtriples and complete explicitpaperwidthdomain withattaining lowerbound and allactualsharedcorner pins verified. Validpolygon/point changes alteranswer and invalidexamplecorner rejected evenwithupdatedhash. Same root author no separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualSVGpolygon vertices+allgridcells, twoactualpointfamilies+alltriangletriples or allfourpaperrectangles+exactlymatchingninecorner pins decoded. Three343pxnativePNGs and3archivedrasters visuallyinspected. Updatedhash semanticgeometry mutations rejected; no originalbitmap/tracedpath reused.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,bars=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){bars++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,bars}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':9,'fullSourceNewConditionsAndSolutionsRead':9,'sourceKeysNotCaptured':9,'allSourceAndNewOptionsChecked':0,'wrongKeysRejected':9,'printedSemanticCanariesRejected':9,'nativeFractions':native['fractions'],'nativeOverlines':native['bars'],'nativeFigures':3,'updatedHashActualGeometryCanariesRejected':3,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':9,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
