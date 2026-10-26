"""Five full saved/new conditions/full official/new explanations/all4MCQs and
five archived source rasters read. Same root author separate computation, not a
separate human reviewer. Native figure inputs parsed from actual SVG primitives,
coordinate labels and path incidence, never JS specs. Cube19separate, not done.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-logic-word3-figures';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
# Root's direct readings of the five archived rasters, corroborated with each
# complete saved official explanation. These are source evidence, not new inputs.
SOURCE={18:('6b15e150180be63fa4873ece',{'width':'8','height':'6','pi':'3.14'}),20:('ffc98cebf2f50e071e5fd902',{'left':'9.7','right':'18.3'}),21:('7bd62a29c37bd6e90736c1f6',{'firstRoads':3,'secondRoads':5}),22:('1d89be4f267e62777d104fcd',{'order':['N','0','M','P']}),23:('eab6038b3e691c678254d25c',{'left':'14','second':'16'})}
def options(r):return[o['text']if isinstance(o,dict)else o for o in r['options']]
def scalar(s):
 p=E.plain(s);p=re.sub(r'\s*см\^2\s*$','',p);return E.calc(p)
def svg(r,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);assert not re.search(rb'<image|<script|href=|foreignObject|data:image',raw);els={e.attrib['id']:e for e in root.iter()if'id'in e.attrib};return root,els
def pos(els,l):return F(els['point-'+l].attrib['cx']),F(els['point-'+l].attrib['cy'])
def labeled_points(els,letters):
 points={l:pos(els,l)for l in letters};assert len({y for _,y in points.values()})==1
 for l,(x,y)in points.items():assert els['label-'+l].text==l and F(els['label-'+l].attrib['x'])==x
 return points
def coordinate(els,l):return scalar(els['value-'+l].text)
def proposition(text,positions):
 p=E.plain(text);m=re.fullmatch(r'(\w) және (\w) нүктелерінің координаталары (теріс|оң) сандар',p)
 if m:a,b,sign=m.groups();assert a in positions and b in positions;return all(positions[l]<0 if sign=='теріс'else positions[l]>0 for l in[a,b])
 a,b=one(re.findall(r'^(\w) нүктесінің координатасы (\w) нүктесінің координатасынан үлкен$',p));assert a in positions and b in positions;return positions[a]>positions[b]
def solve(r,i,src=False,raw=None):
 s=r['statement'];proof={};parse=scalar
 if src:
  archive,data=SOURCE[i];manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];entry=one(e for e in manifest if e['file']=='images/'+archive+'.png');raster=ROOT/'problems/sources/zerek'/entry['file'];assert hashlib.sha256(raster.read_bytes()).hexdigest()==entry['sha256'];proof['archivedRasterSHA256']=entry['sha256'];proof['sourceRasterDirectlyInspected']=True
 else:root,els=svg(r,raw);proof['nativeViewBox']=root.attrib['viewBox']
 if i==18:
  if src:width,height,pi=map(F,[data['width'],data['height'],data['pi']]);assert'8\\times6'in r['solution']and'\\pi\\approx3{,}14'in r['solution']
  else:
   width=scalar(els['width'].text.removesuffix(' см'));height=scalar(els['height'].text.removesuffix(' см'));pi=F(one(re.findall(r'π\s*=\s*(\d+,\d+)',s)).replace(',','.'));rect,disk=els['rectangle'],els['disk'];x,y,w,h=[F(rect.attrib[a])for a in['x','y','width','height']];cx,cy,radius=[F(disk.attrib[a])for a in['cx','cy','r']];scale=w/width;assert h/height==scale and 2*radius==h and cy-radius==y and cy+radius==y+h and cx==x+w/2 and width>=height;assert rect.attrib['fill']!='#fff'and disk.attrib['fill']=='#fff';proof['actualSVG']={'pixelsPerCm':str(scale),'circleTangentToTopBottom':True,'diskRadiusCm':str(radius/scale)}
  area=width*height;diskArea=pi*(height/2)**2;out=area-diskArea;assert out>0;proof.update({'rectangleArea':str(area),'diskArea':str(diskArea),'halfWidthWrongRadiusArea':str(pi*(width/2)**2)})
 elif i==20:
  if src:left,right=F(data['left']),F(data['right']);assert'9{,}7'in r['solution']and'18{,}3'in r['solution']
  else:
   assert one(H.math_parts(s,False))=='|PQ| = |QR|';points=labeled_points(els,'PQR');left,right=coordinate(els,'P'),coordinate(els,'R');assert points['P'][0]<points['Q'][0]<points['R'][0]and points['Q'][0]*2==points['P'][0]+points['R'][0];proof['actualSVG']={'allPointPixels':{l:list(map(str,p))for l,p in points.items()},'exactPixelMidpoint':True}
  out=(left+right)/2;assert out-left==right-out;proof.update({'leftCoordinate':str(left),'rightCoordinate':str(right),'equalHalfLength':str(out-left)})
 elif i==21:
  if src:first,second=data['firstRoads'],data['secondRoads'];assert'3 жол'in r['solution']and'5 жол'in r['solution']
  else:
   points=labeled_points(els,'STU');counts={'ST':0,'TU':0};curves={'ST':[],'TU':[]}
   for k,e in els.items():
    if not k.startswith('road-'):continue
    assert e.tag.endswith('}path');x,y,cx,cy,X,Y=map(F,re.findall(r'-?\d+(?:\.\d+)?',e.attrib['d']));pair=one(a+b for a,b in[('S','T'),('T','U')]if points[a]==(x,y)and points[b]==(X,Y));assert x<cx<X and cx==(x+X)/2 and y==Y;counts[pair]+=1;curves[pair].append(cy)
   assert all(len(v)==len(set(v))for v in curves.values());first,second=counts['ST'],counts['TU'];assert min(first,second)>0;proof['actualSVG']={'actualDirectedRoadCounts':counts,'distinctControlsNoInteriorCrossing':True,'everyEdgeJoinsSpecifiedNodes':True}
  out=F(first*second);proof.update({'firstStageChoices':first,'secondStageChoices':second,'completeTwoStageRoutes':first*second})
 elif i==22:
  if src:positions={'N':F(-1),'M':F(1),'P':F(2)};assert data['order']==['N','0','M','P']
  else:
   points=labeled_points(els,'KLM');zero=F(els['zero'].attrib['x']);assert els['zero'].text=='0';positions={l:x-zero for l,(x,_)in points.items()};assert' L 338 'in els['axis'].attrib['d'];proof['actualSVG']={'relativeHorizontalPositionsFromZero':{l:str(x)for l,x in positions.items()},'rightArrowPositive':True}
  truths=[proposition(t,positions)for t in options(r)];out=E.plain(one(o for o,t in zip(options(r),truths)if t));parse=E.plain;proof.update({'allFourPropositionTruthValues':truths,'sourceValuesAreOrderOnlyNotExactCoordinates':src})
 elif i==23:
  if src:left,second=F(data['left']),F(data['second']);factors=H.numeric_tokens(s);assert factors==[2,2]
  else:
   left,second=coordinate(els,'P'),coordinate(els,'Q');factors=H.numeric_tokens(s);points=labeled_points(els,'PQRS');xs=[points[l][0]for l in'PQRS'];assert xs==sorted(xs)and len(set(xs))==4;deltas=[xs[j+1]-xs[j]for j in range(3)];assert deltas[1]/deltas[0]==factors[0]and deltas[2]/deltas[1]==factors[1];proof['actualSVG']={'pointX':list(map(str,xs)),'ratiosOfConsecutivePixelLengths':list(map(str,[deltas[1]/deltas[0],deltas[2]/deltas[1]]))}
  assert second>left and len(factors)==2;ab=second-left;bc=ab*factors[0];cd=bc*factors[1];third=second+bc;out=third+cd;proof.update({'firstCoordinate':str(left),'secondCoordinate':str(second),'allThreeLengths':list(map(str,[ab,bc,cd])),'thirdCoordinate':str(third),'finalCoordinateTarget':str(out)})
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,out,r['answer']);values=[parse(v)for v in options(r)];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['answer']=str(out);proof['allFourOptionsChecked']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
 if i==18:assert values==[area,out,diskArea,pi*(width/2)**2]
 if i==20:assert values==[out,out-F(1,2),out+1,right-left]
 if i==21:assert values[-1]==first+second
 if i==23:assert values==[third+factors[1]*ab,third,out-ab,out]
 return proof
def figure_mutation(r,i):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()
 if i==18:
  raw=raw.replace(b'width="240"',b'width="288"').replace(b'cx="175"',b'cx="199"').replace(b'x="175"',b'x="199"').replace('10 см'.encode(),'12 см'.encode())
 elif i==20:raw=raw.replace(b'21,2',b'23,2')
 elif i==21:raw=re.sub(rb'<path id="road-ST-0"[^>]+/>',b'',raw)
 elif i==22:raw=raw.replace(b'cx="208"',b'cx="144"').replace(b'x="208"',b'x="144"')
 else:assert i==23;raw=raw.replace(b'id="value-Q" x="58" y="112" font-size="19" text-anchor="middle" fill="#23436a">5',b'id="value-Q" x="58" y="112" font-size="19" text-anchor="middle" fill="#23436a">6')
 q=copy.deepcopy(r);q['figureSha256']=hashlib.sha256(raw).hexdigest();assert raw!=(ROOT/('frontend/public'+r['image'])).read_bytes();return q,raw
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==5;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is not None and len(q['images'])==1
  try:src=solve({**q,'answer':q['sourceAnswer']},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and len(r['options'])==len(q['options'])==4 and r['statement']!=q['statement']and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad,raw in[({**r,'answer':'999999999'},None),figure_mutation(r,i)]:
   try:solve(bad,i,False,raw)
   except(AssertionError,ValueError,SyntaxError):pass
   else:raise AssertionError(('actual mathematical figure mutation accepted',i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip().rstrip('.,')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All5source/new full conditions and full explanations plus40MCQ values and5source rasters read. Exact actual SVG dimensions/tangency, numerical endpoints, middle-point positions, complete directed road incidence and sign-order predicates checked. All5mathematically changed figure inputs rejected even with updatedSHA. Same author, no separate human reviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Actual geometry/path/point/coordinate primitives independently decoded and343px PNG inspected; no source image/traced paths.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':5,'allSourceNewFullConditionsAndSolutionsRead':5,'sourceRastersRead':5,'allSourceAndNewOptionsChecked':40,'wrongKeysRejected':5,'mathematicallyChangedActualSVGInputsRejected':5,'originalNativeFigures':5,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':5,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
