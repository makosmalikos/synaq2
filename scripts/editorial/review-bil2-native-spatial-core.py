"""Bothfullsource/newconditions completeofficial/newsolutions/all10source/new
choices read; bothsourcebitmaps/all343pxnativePNGs inspected. Same root author
separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from functools import lru_cache
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-native-spatial-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids;points=M.points;rect=M.rect
sp=importlib.util.spec_from_file_location('cube','scripts/editorial/review-collection-logic-word3-cube.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C)
ASSETS={40:('487c888fca01526237c62acc','2c7fd42164d369e4bc001b819f959951d797d17c38a13f4bf40d10adfaf83311'),48:('78836ad8c5222c2da33442bf','ec528177d668841b2ff68c970cc7e0a3287599c48d94933d6ceb08f9231d2a5f')}
COLORS={'#79b7ea':'B','#b8a5e9':'V','#f4d57d':'Y'}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def colored_group(group):
 raw=[(rect(v),COLORS[v.attrib['fill']])for v in group];unit=one({w for(x,y,w,h),c in raw}|{h for(x,y,w,h),c in raw});assert unit>0;ox=min(r[0]for r,c in raw);oy=min(r[1]for r,c in raw);result={}
 for(x,y,w,h),color in raw:a,b=(x-ox)/unit,(y-oy)/unit;assert a.denominator==b.denominator==1 and(a,b)not in result;result[int(a),int(b)]=color
 return result
def rotations(piece):
 result=[];p=piece.copy()
 for _ in range(4):
  ox,oy=min(x for x,y in p),min(y for x,y in p);p={(x-ox,y-oy):v for(x,y),v in p.items()};result.append(p);p={(-y,x):v for(x,y),v in p.items()}
 return result
def all_colored_boards(left,square):
 assert set(left)=={(0,0),(0,1),(0,2),(1,2),(2,2)}and set(square)==set(itertools.product(range(2),repeat=2));valid={};attempts=0
 for ra,a in enumerate(rotations(left)):
  for rb,b in enumerate(rotations(square)):
   for ax,ay,bx,by in itertools.product(range(3),repeat=4):
    attempts+=1;aa={(x+ax,y+ay):v for(x,y),v in a.items()};bb={(x+bx,y+by):v for(x,y),v in b.items()}
    if aa.keys()&bb.keys()or aa.keys()|bb.keys()!=set(itertools.product(range(3),repeat=2)):continue
    board=''.join((aa|bb)[x,y]for y in range(3)for x in range(3));valid[board]={'LQuarterTurns':ra,'squareQuarterTurns':rb,'LShift':[ax,ay],'squareShift':[bx,by],'allColoredLPlacements':[[x,y,v]for(x,y),v in sorted(aa.items())],'allColoredSquarePlacements':[[x,y,v]for(x,y),v in sorted(bb.items())]}
 assert attempts==4*4*3**4;return valid,attempts
def pieces(root=None):
 if root is None:left={(0,0):'G',(0,1):'W',(0,2):'K',(1,2):'G',(2,2):'K'};square={(0,0):'K',(1,0):'W',(0,1):'W',(1,1):'G'};choices=dict(zip('ABCD',['GWKKWGGWK','KWGGGWKWK','KWGWWKKGG','KGKGWWKWG']))
 else:
  d=ids(root);left=colored_group(d['piece-L']);square=colored_group(d['piece-square']);choices={}
  for key in'ABCD':
   board=colored_group(d['choice-'+key]);assert set(board)==set(itertools.product(range(3),repeat=2));choices[key]=''.join(board[x,y]for y in range(3)for x in range(3))
  assert d['none-label'].text=='E — Ешқайсысы'
 valid,attempts=all_colored_boards(left,square);possible=[k for k,v in choices.items()if v in valid];answer=one(possible)if possible else'E';proof={'allActualPieceColoredCells':{'L':[[x,y,v]for(x,y),v in sorted(left.items())],'square':[[x,y,v]for(x,y),v in sorted(square.items())]},'allActualFourCandidateBoards':choices,'allRotationTranslationPairsChecked':attempts,'allDistinctValidColoredBoards':sorted(valid),'allCandidateCoverPossibilities':{k:v in valid for k,v in choices.items()},'reflectionsNotUsed':True,'uniqueAssembledBoardChoice':answer}
 if answer!='E':proof['fullExactColoredCoverWitness']=valid[choices[answer]]
 return answer,proof
def cube_views(root):
 d=ids(root);views=[];frames=[]
 for j in range(3):
  top,left,right=[points(d[f'view-{j}-{side}'])for side in['top','left','right']];assert all(len(p)==4 for p in[top,left,right]);u=C.sub(top[1],top[0]);v=C.sub(top[3],top[0]);down=C.sub(left[2],left[1]);assert top[2]==C.add(top[0],C.add(u,v))and down[0]==0 and down[1]>0 and u[0]>0>v[0]and u[1]>0 and v[1]>0;assert left==[top[3],top[2],C.add(top[2],down),C.add(top[3],down)]and right==[top[2],top[1],C.add(top[1],down),C.add(top[2],down)];frames.append((u,v,down));letters=[]
  for side,p in zip(['top','left','right'],[top,left,right]):
   label=d[f'value-{j}-{side}'];cx,cy=tuple(sum(v[k]for v in p)/4 for k in range(2));assert F(label.attrib['x'])==cx and 0<F(label.attrib['y'])-cy<10;assert re.fullmatch('[A-Z]',label.text);letters.append(label.text)
  assert len(set(letters))==3;views.append(''.join(letters))
 assert len(set(frames))==1;return tuple(views)
@lru_cache(None)
def opposite(views,asked):
 axes=[C.X,C.Y,C.Z,C.neg(C.X),C.neg(C.Y),C.neg(C.Z)];rs=C.rotations();allowed={tuple(C.rotate(r,v)for v in[C.Z,C.Y,C.X])for r in rs};assert len(allowed)==24;assert all(((t,l,r)in allowed)==(C.cross(t,l)==C.neg(r))for t,l,r in itertools.product(axes,repeat=3));labels=sorted(set(''.join(views)));assert len(labels)==6 and asked in labels;survivors=[]
 for assignment in itertools.permutations(axes):
  faces=dict(zip(labels,assignment))
  if all(tuple(faces[v]for v in view)in allowed for view in views):survivors.append(faces)
 assert survivors;possible={one(k for k,v in faces.items()if v==C.neg(faces[asked]))for faces in survivors};answer=one(possible);proof={'allActualThreeOrientedTopLeftRightViews':list(views),'actualAskedLetter':asked,'all720FaceLabelAssignmentsEnumerated':720,'all24ProperViewRotationsEnumerated':24,'properRotationViewsEqualIndependentCrossProductChiralityTest':True,'consistentFullCubeAssignmentCount':len(survivors),'oneFullConsistentCubeAssignment':{k:list(v)for k,v in survivors[0].items()},'allPossibleOppositeLetters':sorted(possible),'uniqueOppositeLetterTarget':answer};return answer,proof
def solve(r,i,src=False,data=None):
 proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data)
 if i==40:
  answer,p=pieces(root);assert B.options(r)==list('ABCDE')
  if not src:assert'тек бұрып, аудармай'in r['statement']
 elif i==48:
  views=('OUK','OMP','KIM')if src else cube_views(root);asked=one(re.findall(r'([A-Z]) әрпіне',r['statement']));answer,p=opposite(views,asked);assert set(B.options(r))==set(''.join(views))-{asked}and len(set(B.options(r)))==5
  if not src:p['allNineActualCubeFacePolygonsAndLetterAttachmentsChecked']=True
 else:raise AssertionError(i)
 proof.update(p);assert r['answer']==answer;proof['answerChecked']=True;return proof
def changed(r,i):
 root=W.svg(r);d=ids(root)
 if i==40:
  a=list(d['choice-A']);c=list(d['choice-C']);oldA=[v.attrib['fill']for v in a];oldC=[v.attrib['fill']for v in c]
  for els,colors in[(a,oldC),(c,oldA)]:
   for el,color in zip(els,colors):el.set('fill',color)
  target='A'
 else:
  for id,el in d.items():
   if id.startswith('value-')and el.text in['A','Y']:el.text={'A':'Y','Y':'A'}[el.text]
  target='S'
 raw=ET.tostring(root);return{**r,'figureSha256':hashlib.sha256(raw).hexdigest()},raw,target
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=solve({**q,'answer':key},i,True);proof=solve(r,i);bad,raw,target=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  solve({**bad,'answer':target},i,False,raw);proof['validUpdatedHashActualFigureTarget']=target;proof['oldKeyRejectedAndCorrectChangedFigureAnswerAccepted']=True;root=W.svg(r);d=ids(root)
  if i==40:d['choice-A-cell-0'].set('x',str(F(d['choice-A-cell-0'].attrib['x'])+1))
  else:d['value-0-right'].text='N'
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryOrViewRejected']=True
  else:raise AssertionError(('malformedSpatialFigureAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Bothfullsource/newconditions completeofficial/newsolutions/all10source/newoptions/sourcebitmaps/343pxnativePNGs read. Actualallcoloredpiece/boardrectangles normalized; all1296rotation/translationpairs enumerateall16coloredcompletecoverswithoutreflections andallfourcandidateboards. Actualallninecube-facepolygons/commonprojectionandletterplacements decoded; all720labelassignments/all24properrotations crossindependentchiralitycondition proveuniqueopposite. ActualupdatedhashboardA/lettersS recomputed; malformedgrid/viewlabels rejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'TwooriginalnativeSVG actualcoloredcellcoordinates/fills andprojectedcube-facepolygons/letterpositions decoded; bothsourcebitmaps/all343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'fullSourceNewConditionsAndSolutionsRead':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'wrongKeysRejected':2,'validUpdatedHashActualFiguresRecomputed':2,'updatedHashMalformedActualFiguresRejected':2,'nativeFigures':2,'properCubeRotations':24,'allCubeLabelAssignments':720,'allColoredRotationTranslationPairs':1296,'remainingBIL2Visuals':[22,41],'pythonJavaScriptHashesMatched':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
