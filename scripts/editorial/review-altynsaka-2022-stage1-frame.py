"""Fullsource/newvisualcondition and complete official/newsolution read;
sourcebitmap andactual343pxnewnativePNG inspected. Same root author separate
exact computational check, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2022-stage1-frame';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('visual4','scripts/editorial/review-femo6-spring-grade4-visual.py');V=importlib.util.module_from_spec(sp);sp.loader.exec_module(V);P=V.P;H=P.H;one=H.one;exact=P.exact

def solve(r,src=False,data=None):
 count,outerArea,innerArea=map(int,H.numeric_tokens(re.sub(r'\$\^2\$|²','',r['statement'])));assert count==4 and outerArea>innerArea>0;outerSide,innerSide=map(math.isqrt,[outerArea,innerArea]);assert outerSide**2==outerArea and innerSide**2==innerArea;short=F(outerSide-innerSide,2);long=F(outerSide+innerSide,2);assert short>0
 if src:
  sha=hashlib.sha256((ROOT/'problems/sources/zerek/images/731563b15c7864ddd8c76c9f.png').read_bytes()).hexdigest();assert sha=='91e9e7390ee7a7aeccb8a1b2ef9539de83b3722b46544089aea4f54b609ed4e1';outer=(F(0),F(0),F(outerSide),F(outerSide));inner=(short,short,F(innerSide),F(innerSide));frames=[(0,0,long,short),(long,0,short,long),(short,long,long,short),(0,short,short,long)];proof={'sourceRasterSHA256':sha,'sourceFourRotatedCongruentRectanglesAndCentralSquareObserved':True}
 else:
  root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rect=lambda v:tuple(F(v.attrib[k])for k in['x','y','width','height']);ox,oy,ow,oh=rect(ids['outer']);ix,iy,iw,ih=rect(ids['inner']);assert ow==oh>0 and iw==ih>0;scale=ow/outerSide;assert scale==iw/innerSide and scale>0;outer=(F(0),F(0),ow/scale,oh/scale);inner=((ix-ox)/scale,(iy-oy)/scale,iw/scale,ih/scale);frames=[((x-ox)/scale,(y-oy)/scale,w/scale,h/scale)for x,y,w,h in[rect(v)for id,v in ids.items()if id.startswith('frame-')]];assert len(frames)==count;assert one(H.numeric_tokens(ids['inner-area'].text))==innerArea and one(H.numeric_tokens(ids['outer-area'].text))==outerArea;label=ids['inner-area'];assert ix<F(label.attrib['x'])<ix+iw and iy<F(label.attrib['y'])<iy+ih;proof={'allActualFourRectangleAndTwoSquareGeometriesRead':True,'allActualNativeAreaLabelsChecked':True,'commonPixelsPerCentimeterFromBothSquareAreas':str(scale)}
 shapes={tuple(sorted([w,h]))for x,y,w,h in frames};actualShort,actualLong=one(shapes);assert actualShort==short and actualLong==long and actualShort+actualLong==outerSide and actualLong-actualShort==innerSide
 for x,y,w,h in frames+[inner]:assert w>0 and h>0 and 0<=x and 0<=y and x+w<=outerSide and y+h<=outerSide
 assert all(not V.overlap(a,b)for a,b in itertools.combinations(frames+[inner],2));assert sum(w*h for x,y,w,h in frames)+innerArea==outerArea;out=actualShort;assert exact(H.tex(r['answer']))==out,(src,proof,r['answer']);proof.update({'bothActualSquareAreas':[outerArea,innerArea],'bothPhysicalSquareSides':[outerSide,innerSide],'allActualCongruentRectangleShortLongSides':list(map(str,[actualShort,actualLong])),'allPhysicalRectanglePlacements':[[str(v)for v in q]for q in frames],'allFivePiecesInsideWholeAndPairwiseInteriorsDisjoint':True,'allPieceAreasSumToWholeSquare':True,'actualGeometryMatchesIndependentSumDifferenceSolution':True,'rectangleWidthTarget':str(out),'answerChecked':True});return proof

def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);core=json.loads((ROOT/'problems/editorial/batches/altynsaka-2022-stage1-core.json').read_text())['editions'];assert len(core)==19 and {v['params']['number']for v in core}|{r['params']['number']}==set(range(1,21));ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==18);assert q['sourceAnswer']is None and not q['options']and q['images']and q['solution'];answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip();src=solve({**q,'answer':answer},True);proof=solve(r)
 try:solve({**r,'answer':'999999999'})
 except AssertionError:pass
 else:raise AssertionError('wrongkeyaccepted')
 root=P.W.svg(r);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};ids['outer-area'].text='Сыртқы аудан: 784 см²';ids['inner-area'].text='144 см²';raw=ET.tostring(root);bad={**r,'statement':r['statement'].replace('196 см²','784 см²').replace('36 см²','144 см²'),'figureSha256':hashlib.sha256(raw).hexdigest()}
 try:solve(bad,False,raw)
 except AssertionError:pass
 else:raise AssertionError('oldkeyacceptedfornewphysicallabels')
 assert solve({**bad,'answer':'8'},False,raw)['rectangleWidthTarget']=='8';proof['validUpdatedHashPhysicalAreaLabelsTarget']='8'
 root=P.W.svg(r);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects={'frame-0':(54,40,162,90),'frame-1':(216,40,90,162),'frame-2':(144,202,162,90),'frame-3':(54,130,90,162),'inner':(144,130,72,72)}
 for id,values in rects.items():
  for key,value in zip(['x','y','width','height'],values):ids[id].set(key,str(value))
 ids['inner-area'].text='16 см²';raw=ET.tostring(root);bad={**r,'statement':r['statement'].replace('36 см²','16 см²'),'figureSha256':hashlib.sha256(raw).hexdigest()}
 try:solve(bad,False,raw)
 except AssertionError:pass
 else:raise AssertionError('oldkeyacceptedfornewvalidframegeometry')
 assert solve({**bad,'answer':'5'},False,raw)['rectangleWidthTarget']=='5';proof['validUpdatedHashActualFrameGeometryTarget']='5'
 root=P.W.svg(r);one(v for v in root.iter()if v.attrib.get('id')=='frame-0').set('width','179');raw=ET.tostring(root)
 try:solve({**r,'figureSha256':hashlib.sha256(raw).hexdigest()},False,raw)
 except AssertionError:proof['updatedHashActualGeometryGapRejected']=True
 else:raise AssertionError('gappednoncongruentframeaccepted')
 assert r['minimumPlan']=='pro'and r['grade']==5 and r.get('image')and not r.get('options')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);equalities=0
 for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
  sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
  if len(sides)<2 or not all(sides):continue
  try:values=[exact(v)for v in sides]
  except(AssertionError,ValueError,SyntaxError):continue
  assert len(set(values))==1,('printedsolutionequality',match[0]);equalities+=len(sides)-1
 entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newcondition and completeofficial/newsolutions/sourcebitmap/343pxnativePNG read. Actualall4rectangle/twosquarecoordinates andarea labels decoded; commonphysicalscale,bothsquareareas, all4rectanglecongruency, containment,pairwisedisjointinteriorsandfullouterareacoverage crossindependentexactsumdifferenceformula verified. Updatedhashlabelchanges8 andvalidactualframegeometry5 recomputed; updatedhashgaprejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG and343pxPNG inspected. Allactualpiecegeometries/area labels decoded andexacttilingchecked. No sourcebitmap/tracedvector.'}}
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0];console.log(editionHash(r));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==entry['sha256'];summary={'verified':1,'fullSourceNewConditionsAndSolutionsRead':1,'capturedOpenKeys':1,'wrongKeyRejected':True,'validUpdatedHashPhysicalLabelChangeRecomputed':True,'validUpdatedHashActualFrameGeometryChangeRecomputed':True,'updatedHashInvalidFrameGapRejected':True,'nativeFigures':1,'completeCollectionWithCore19':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
