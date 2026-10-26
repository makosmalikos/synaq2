"""Last4full source/new RFMSh3 conditions/official/new solutions read, both saved
source rasters inspected. Same author separate exact computation and native343px
visual review, not separate human reviewer. No source raster or traced paths used.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[2];NAME='collection-rfmsh3-final';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def solve(r,i,src=False):
 s=r['statement'];p=H.math_parts(s,src);proof={}
 if i==12:
  text=E.plain(s);assign={v:F(n)for v,n in re.findall(r'([abcd])\s*=\s*(\d+)',text)};assert set(assign)==set('abcd')
  bare=re.sub(r'[abcd]\s*=\s*\d+','',text).replace('см^2','см²');unpainted=one(H.numeric_tokens(bare));a,b,c,d=[assign[v]for v in'abcd'];first=a*b;second=c*d;shared=first-unpainted;assert 0<shared<min(first,second)and shared<=min(a,d)*min(b,c);out=second-shared;proof={'dimensions':{v:str(x)for v,x in assign.items()},'firstArea':str(first),'secondArea':str(second),'sharedArea':str(shared),'firstUnpaintedArea':str(unpainted),'secondUnpaintedTarget':str(out)}
 elif i==21:
  if src:
   raw=one(p).replace('\\leqslant','≤').replace('\\leq','≤');body=one(re.findall(r'\\begin\{cases\}(.*?)\\end\{cases\}',raw,re.S));conditions=re.split(r'\\\\(?:\[[^\]]+\])?',body)
  else:conditions=p
  assert len(conditions)==2;bounds=[]
  for condition in conditions:
   l,op,rhs=re.split('([<≤])',E.plain(condition));[a],b=E.affine('('+l+')-('+rhs+')');assert a;bounds.append((op,-b/a,a>0))
  (loOp,lower,loPositive),(hiOp,upper,hiPositive)=bounds;assert(loOp,hiOp,loPositive,hiPositive)==('<','≤',False,True)
  first=max(1,math.floor(lower)+1);last=math.floor(upper);values=list(range(first,last+1));assert values;out=F(sum(values))
  def valid(x):
   for condition in conditions:
    l,op,rhs=re.split('([<≤])',E.plain(condition));a,b=E.calc(l,{'x':F(x)}),E.calc(rhs,{'x':F(x)})
    if not(a<b if op=='<'else a<=b):return False
   return True
  assert all(valid(x)for x in values)and not valid(last+1);proof={'strictLowerBound':str(lower),'inclusiveUpperBound':str(upper),'allNaturalSolutions':values,'zeroNotNatural':True,'askedSumNotCount':True}
 elif i==22:
  square,triangle=H.numeric_tokens(s);assert'үш'in s;side=square/4;assert triangle>2*side;out=side+3*(triangle-side);assert out==square+3*triangle-6*side;proof={'squarePerimeter':str(square),'squareSide':str(side),'eachTrianglePerimeter':str(triangle),'threeSharedEdgesCancelledTwice':True,'unionOuterPerimeter':str(out)}
 elif i==29:
  assert all(t=='x'for t in p[1:]);target=E.plain(p[0]).replace('\\big','').replace(' ','');inner,center,radius=one(re.findall(r'\|\|(.+)\|-(\d+)\|>(\d+)',target));center,radius=F(center),F(radius);[a],b=E.affine(inner);assert a>0 and center>radius>0
  low,high=center-radius,center+radius;intervals=[((-high-b)/a,(-low-b)/a),((low-b)/a,(high-b)/a)];values=[x for lo,hi in intervals for x in range(math.ceil(lo),math.floor(hi)+1)];assert values==sorted(set(values));fails=lambda x:abs(abs(a*x+b)-center)<=radius;assert all(fails(x)for x in values)
  for x in range(values[0]-1,values[-1]+2):assert fails(x)==(x in values)
  out=F(sum(values));proof={'complementInclusiveModulusBand':[str(low),str(high)],'exactClosedIntervals':[[str(v)for v in pair]for pair in intervals],'allIntegersFailingOriginalStrictInequality':values,'negativeAndZeroIncluded':any(x<0 for x in values)and 0 in values,'originalStrictBoundaryExcludedFromSolutionIncludedInComplement':True}
 else:raise AssertionError(i)
 assert E.calc(r['answer'])==out,(i,src,out,r['answer']);proof['answer']=str(out);return proof
def figure(r,proof,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);els={e.attrib['id']:e for e in root.iter()if'id'in e.attrib};assert not re.search(rb'<image|<script|href=|foreignObject|data:image',raw)
 if r['params']['number']==12:
  boxes={}
  for k in['first','second','shared']:boxes[k]=[F(els[k].attrib[a])for a in['x','y','width','height']]
  x,y,w,h=boxes['first'];X,Y,W,Hh=boxes['second'];expected=[max(x,X),max(y,Y),min(x+w,X+W)-max(x,X),min(y+h,Y+Hh)-max(y,Y)];assert boxes['shared']==expected;scale=w/F(proof['dimensions']['b']);assert h/scale==F(proof['dimensions']['a'])and W/scale==F(proof['dimensions']['c'])and Hh/scale==F(proof['dimensions']['d']);assert expected[2]*expected[3]/scale**2==F(proof['sharedArea']);texts={e.text for e in root.iter()if e.tag.endswith('}text')};assert texts==set('abcd');proof['actualSVG']={'pixelsPerCentimeter':str(scale),'exactIntersectionRectangle':list(map(str,expected)),'areaMatchesPrintedGiven':True}
 else:
  square=els['square'];x,y,w,h=[F(square.attrib[a])for a in['x','y','width','height']];assert w==h;scale=w/F(proof['squareSide']);squarePoints=[(x,y),(x+w,y),(x+w,y+h),(x,y+h)];polygons=[squarePoints];lengths=[]
  for k in['top','right','bottom']:
   points=[tuple(F(v)for v in p.split(','))for p in els[k].attrib['points'].split()];assert len(points)==3;polygons.append(points);squared=[(a[0]-b[0])**2+(a[1]-b[1])**2 for a,b in zip(points,points[1:]+points[:1])];sides=[]
   for v in squared:
    z=math.isqrt(v.numerator);assert v.denominator==1 and z*z==v;sides.append(F(z))
   lengths.append(sorted(sides));assert sum(sides)/scale==F(proof['eachTrianglePerimeter'])and w in sides
  assert lengths[0]==lengths[1]==lengths[2];edges=Counter()
  for points in polygons:
   for a,b in zip(points,points[1:]+points[:1]):edges[tuple(sorted([a,b]))]+=1
  assert sorted(edges.values())==[1]*7+[2]*3;outer=F(0)
  for(a,b),count in edges.items():
   if count==1:outer+=math.isqrt(int((a[0]-b[0])**2+(a[1]-b[1])**2))
  assert outer/scale==E.calc(r['answer']);top,right,bottom=polygons[1:];assert max(v[1]for v in top)<=min(v[1]for v in right)and max(v[1]for v in right)<=min(v[1]for v in bottom);proof['actualSVG']={'pixelsPerCentimeter':str(scale),'trianglePixelSides':list(map(str,lengths[0])),'sameCongruentTriangles':3,'cancelledSharedEdges':3,'outerBoundarySegments':7,'actualOuterPerimeter':str(outer/scale)}
 return proof['actualSVG']
def mutation(r,i):
 pairs={12:('46 см²','47 см²'),21:('≤ 5','≤ 6'),22:('20 см','21 см'),29:('3 × x − 18','3 × x − 21')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is None and not q['options'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('options')and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip().rstrip('.')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:vs=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vs))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full4source/new conditions and complete explanations plus2saved source rasters read; exact region conservation, full natural system solution sum, complete integer complement intervals and actual native congruent-edge cancellation checked;343px previews inspected. Same author, not separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):
   figure(r,proof);entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actual scaled native rectangle intersections or congruent triangle edge multiplicities verified, mobile343px preview read.'};raw=(ROOT/('frontend/public'+r['image'])).read_bytes();badraw=raw.replace(b'width="140"',b'width="141"')if i==12 else raw.replace(b'266,16',b'266,17');bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(badraw).hexdigest()
   try:figure(bad,copy.deepcopy(proof),badraw)
   except AssertionError:pass
   else:raise AssertionError(('actual figure canary accepted',i))
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':4,'fullSourceNewConditionsAndSolutionsRead':4,'sourceKeysNotCaptured':4,'originalFigures':2,'sourceRasterPreviewsRead':2,'wrongKeysRejected':4,'printedSemanticCanariesRejected':4,'actualSVGMutationsRejected':2,'nativeFractions':native['fractions'],'printedSolutionEqualitiesVerified':equalities,'allIntegerAndNaturalIntervalsComplete':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
