"""All4fullsource/newconditions completeofficial/newsolutions/all20source/new
options read; all4sourcebitmaps/all343pxnativePNGs inspected. Same root author
separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-native-plane';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('math','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;ids=M.ids;rect=M.rect;points=M.points;segment=M.segment
ASSETS={20:('0e9a5c9c03c9ff87a01f477b','dfab138534caebf95612669fe2a7ed04c7d70c05da0d2cee4768013230d5d560'),25:('de6cf95734c1a33256effff5','d7ed22c875e7f286fa311bab9476b222996e658c115fd36846301eb388ec97b2'),33:('5d26775b2c6ccfe6c8e8251e','031aa9c08c239fecd15b8223ef70b4b2b53fb2e921844b2b9a2983bbe8afbca1'),34:('8b29473cee280a7f3b3523c7','cc9a81e624a774f6a73cb79ac0dcb2fa791ae4bb62ca0bc4ad60f9d9bbf58130')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def area(ps):return abs(sum(a[0]*b[1]-b[0]*a[1]for a,b in zip(ps,ps[1:]+ps[:1])))/2
def polygon(rectangle):x,y,w,h=rectangle;return[(x,y),(x+w,y),(x+w,y+h),(x,y+h)]
def disjoint(a,b):
 for shape in[a,b]:
  for p,q in zip(shape,shape[1:]+shape[:1]):
   axis=(p[1]-q[1],q[0]-p[0]);oneD=lambda s:[x*axis[0]+y*axis[1]for x,y in s];pa,pb=oneD(a),oneD(b)
   if max(pa)<=min(pb)or max(pb)<=min(pa):return True
 return False
def abstract_grid(root):
 d=ids(root);ox,oy,w,h=rect(d['whole']);assert w==h>0;corners=[]
 for corner in range(4):
  for r,c in itertools.product(range(2),repeat=2):
   node=d[f'corner-{corner}-{r}-{c}'];x,y,a,b=rect(node);assert a==b==24;right=corner%2;bottom=corner>=2;assert x==(ox+w-(c+1)*a if right else ox+c*a)and y==(oy+h-(r+1)*a if bottom else oy+r*a);assert node.attrib['fill']==('#cadffa'if r==0 or c==0 else'white');corners.append(node)
 assert len(corners)==16 and d['unknown-side'].text=='n';dots=[v for id,v in d.items()if id.startswith('ellipsis-')];assert len(dots)==12 and all(v.tag.endswith('circle')for v in dots);return{'nativeAbstractCornerCellsAndAll12OmissionDotsChecked':True,'unknownSideNotInferredFromPixelsOrDisplayedCellCount':True}
def quarter(root):
 d=ids(root);x,y,w,h=rect(d['square']);assert w==h>0 and d['square'].attrib['fill']=='#b9c9f2';path=d['quarter'];raw=re.findall(r'[A-Za-z]|-?\d+(?:\.\d+)?',path.attrib['d']);assert raw[0]=='M'and raw[3]=='L'and raw[6]=='A'and raw[-1]=='Z';nums=list(map(F,raw[1:3]+raw[4:6]+raw[7:-1]));assert nums==[x,y+h,x,y,w,w,0,0,1,x+w,y+h]and path.attrib['fill']=='white';assert d['center'].text=='C'and d['radius-bottom'].text==d['radius-left'].text=='r';return{'actualSquareAndQuarterCirclePathEndpointsRadiiSweepChecked':True,'whiteSectorIsExactlyOneQuarterOfRadiusSideDisc':True,'actualCenterIsSquareCornerAndBothRadiusLabelsAgree':True}
def ratio(root,m,n):
 d=ids(root);x,y,w,h=rect(d['whole']);p=points(d['upper-triangle']);assert len(p)==3 and p[0]==(x,y)and p[1]==(x+w,y)and p[2][0]==x+w and y<p[2][1]<y+h;upper,whole=area(p),w*h;assert upper/(whole-upper)==m/n;assert F(d['upper-area'].text)==m and F(d['lower-area'].text)==n;u=p[2][1]-y;l=y+h-p[2][1];a,b=segment(d['upper-bracket']),segment(d['lower-bracket']);assert a[0]==a[2]==b[0]==b[2]and a[1]==y and a[3]==b[1]==p[2][1]and b[3]==y+h;assert d['upper-length'].text=='a'and d['lower-length'].text=='b';out=u/l;assert out==2*m/(n-m);return out,{'allActualRectangleTriangleVerticesAndAreaLabelsChecked':True,'actualTriangleAreaAndComplementRatio':str(upper/(whole-upper)),'actualUpperLowerSideRatio':str(out),'bothActualSideLengthBracketEndpointsChecked':True,'shoelaceAreaRatioEqualsIndependentComplementFormula':True}
def white_parts(root,side,gap):
 d=ids(root);x,y,w,h=rect(d['whole']);assert w==h>0;unit=w/side;u=(side-gap)/2;assert 0<gap<side and B.scalar(d['outer-side'].text)==side and B.scalar(d['central-gap'].text)==gap;actualSquares=[rect(v)for id,v in d.items()if id.startswith('white-square-')];expectedSquares={(x+c*unit,y+r*unit,u*unit,u*unit)for c,r in[(0,0),(side-u,0),(side-u,side-u),(0,side-u)]};assert len(actualSquares)==4 and set(actualSquares)==expectedSquares;triangles=[points(v)for id,v in d.items()if id.startswith('white-triangle-')];expected=[[(u,0),(side-u,0),(side/2,gap/2)],[(side,u),(side,side-u),(side-gap/2,side/2)],[(side-u,side),(u,side),(side/2,side-gap/2)],[(0,side-u),(0,u),(gap/2,side/2)]];expected=[frozenset((x+a*unit,y+b*unit)for a,b in p)for p in expected];assert len(triangles)==4 and set(map(frozenset,triangles))==set(expected);shapes=list(map(polygon,actualSquares))+triangles
 for p in triangles:
  base,apex=p[:2],p[2];a,b=[(v[0]-apex[0],v[1]-apex[1])for v in base];assert a[0]*b[0]+a[1]*b[1]==0 and sum(v*v for v in a)==sum(v*v for v in b)
 vertices={'A':(x,y+h),'B':(x+w,y+h),'C':(x+w,y),'D':(x,y),'E':(x+u*unit,y),'F':(x+(side-u)*unit,y)}
 for key,(vx,vy)in vertices.items():label=d['label-'+key];assert label.text==key and(F(label.attrib['x'])-vx)**2+(F(label.attrib['y'])-vy)**2<30**2
 assert all(x<=a<=x+w and y<=b<=y+h for p in shapes for a,b in p)and all(disjoint(a,b)for a,b in itertools.combinations(shapes,2));areas=[area(p)/unit**2 for p in shapes];out=side**2-sum(areas);assert out==side**2-4*u*u-gap*gap==2*gap*(side-gap);return out,{'allFourCornerSquareAndFourTriangleActualVerticesChecked':True,'allActualTrianglesRightAndIsoscelesByExactDotProducts':True,'allEightWhitePiecesInsideWholeAndPairwiseInteriorsDisjointSAT':True,'allEightWhitePhysicalAreas':list(map(str,areas)),'actualComplementEqualsIndependentClosedForm':True,'actualShadedAreaTarget':str(out)}
def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(re.sub(r'\$\^2\$|²','',s));proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data);expected=None
 if i==20:
  boundary=one(n);side=(boundary+4)/4;assert side.denominator==1 and side>=2;count=sum(x in[0,side-1]or y in[0,side-1]for x,y in itertools.product(range(int(side)),repeat=2));assert count==boundary;out=side*side
  if not src:assert'орта бөлігі қысқартылып'in s;proof.update(abstract_grid(root))
  expected=[out-1,(side-1)**2,out,(side+1)**2,out+1];proof['actualBoundaryCellCount']=str(boundary);proof['recoveredWholeSideCellCount']=str(side);proof['wholeCellCountTarget']=str(out)
 elif i==25:
  pi=one(n);assert 3<pi<4;den,rectArea,variable=(2,F(2),'R')if src else(4,F(1),'r');coeff=rectArea-pi/den
  if not src:proof.update(quarter(root));assert'r оң сан'in s
  target=E.expr('('+str(coeff)+')*'+variable+'^2');opts=list(map(E.expr,B.options(r)));expectedExpr=[target,E.expr('2')*target,E.expr('('+str(coeff+F(143,100))+')*'+variable+'^2'),E.expr('('+str(pi/den)+')*'+variable+'^2'),E.expr('('+str(pi)+')*'+variable+'^2')];assert all(a.equals(b)for a,b in zip(opts,expectedExpr));assert E.expr(r['answer']).equals(target)and all(not a.equals(b)for a,b in itertools.combinations(opts,2));proof.update({'actualPiApproximation':str(pi),'whiteDiscFractionDenominator':den,'actualSquareOrRectangleAreaCoefficient':str(rectArea),'shadedRSquaredCoefficientTarget':str(coeff),'allFiveOptionsComparedAsExactPolynomialIdentities':True,'positiveRadiusDomainExplicit':src or'r оң сан'in s,'answerChecked':True});return proof
 elif i==33:
  m,n=n;assert 0<m<n
  if src:out=2*m/(n-m);proof['sourceObservedUpperRightTriangleAndComplementarySideSplit']=True
  else:out,proof=ratio(root,m,n)
  expected=[2*m/n,(m+2)/(m+n),out,2*m/(m+2),2*m/(m+n)];proof['sideRatioTarget']=str(out)
 elif i==34:
  side,gap=n;assert 0<gap<side
  if src:u=(side-gap)/2;out=side**2-4*u*u-gap*gap;proof['sourceObservedFourCornerSquaresAndFourDiagonalParallelIsoscelesRightTriangles']=True;proof['actualShadedAreaTarget']=str(out)
  else:out,proof=white_parts(root,side,gap)
  expected=[out+10,out-6,out,out+4,out-2]
 else:raise AssertionError(i)
 proof.update(B.checked_choices(r,out,expected));proof['answerChecked']=True;return proof
def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root)
 if i==20:d['statement']=d['statement'].replace('саны 32','саны 36');target='100';d['options']=['99','81','100','121','101']
 elif i==25:d['statement']=d['statement'].replace('3.14','3.2');target='0.2 × r²';d['options']=['0.2 × r²','0.4 × r²','1.63 × r²','0.8 × r²','3.2 × r²']
 elif i==33:
  d['statement']=d['statement'].replace('3 : 10','3 : 11');v['whole'].set('height','280');v['lower-area'].text='11';v['lower-bracket'].set('y2','310');v['lower-length'].set('y','236');target='(3/4)';d['options']=['(6/11)','(5/14)','(3/4)','(6/5)','(3/7)']
 else:
  # Create a real alternative native figure using an independently specified
  # gap-six geometry; no answer values are read from the JS authoring specs.
  d['statement']=d['statement'].replace('8 см','6 см');x,y,u,gap=F(60),F(40),F(3),F(6);unit=F(20);side=F(12)
  for j,(c,r)in enumerate([(0,0),(side-u,0),(side-u,side-u),(0,side-u)]):
   for k,val in zip(['x','y','width','height'],[x+c*unit,y+r*unit,u*unit,u*unit]):v['white-square-'+str(j)].set(k,str(val))
  ts=[[(u,0),(side-u,0),(side/2,gap/2)],[(side,u),(side,side-u),(side-gap/2,side/2)],[(side-u,side),(u,side),(side/2,side-gap/2)],[(0,side-u),(0,u),(gap/2,side/2)]]
  for j,p in enumerate(ts):v['white-triangle-'+str(j)].set('points',' '.join(f'{x+a*unit},{y+b*unit}'for a,b in p))
  v['central-gap'].text='6 см';v['label-E'].set('x','120');v['label-F'].set('x','240');target='72 см²';d['options']=['82 см²','66 см²','72 см²','76 см²','70 см²']
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,target
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  bad,raw,target=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashGeometryOrPhysicalInputTarget']=target;proof['oldKeyRejectedAndCorrectChangedInputAccepted']=True;root=W.svg(r);v=ids(root)
  if i==20:v['corner-0-0-0'].set('width','23')
  elif i==25:v['quarter'].set('d',v['quarter'].attrib['d'].replace('200 200','199 200'))
  elif i==33:v['upper-triangle'].set('points','50,30 290,30 289,150')
  else:v['white-square-0'].set('width','39')
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedActualFigureAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[x.strip().rstrip('.,')for x in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:vals=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vals))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All4fullsource/newconditions completeofficial/newsolutions/all20source/newoptions/sourcebitmaps/343pxnativePNGs read. Actualabstractcornercells/omissiondots verifiedwithoutclaimingunknownsidefrompixels. Actualsquare/quartercirclepathcenter/radii/sweep andall5symbolicareaidentities checked. Actualrectangle/trianglevertices/shoelacearea labels/sidebrackets crossindependentcomplementratio. Actualall4corner-squares/4trianglevertices/right-angleequallegs/containment/pairwiseSATinteriordisjointness/physicalareas crossclosedform checked. Updatedhashgeometryorphysicalinputtargets100/0.2r²/3:4/72 recomputedandmalformedgeometry rejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'FouroriginalnativeSVG actualillustrationcorners/sectorpath/rectangletriangle/whitepiecevertices decoded; allsourcebitmaps/343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':4,'fullSourceNewConditionsAndSolutionsRead':4,'sourceOptionsRead':20,'rewrittenOptionsRead':20,'wrongKeysRejected':4,'validUpdatedHashGeometryOrPhysicalInputChangesRecomputed':4,'updatedHashMalformedActualGeometryRejected':4,'nativeFigures':4,'abstractDiagramNotAnAnswerOracle':True,'remainingBIL2Visuals':8,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':4,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
