"""Fullsource/newcondition, full official/newsolution, all5source/newchoices,
sourcebitmap and343pxnativePNG read. Savedsourceoccurrences/absence visually
reviewed with officialexplanation; noexactrasterboundarytrace orautomatedsource
pathproof claimed. ActualnewSVGgeometry independentlycomputed. Same author,
notanotherhumanreviewer.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-skyline';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('l','scripts/editorial/review-bil1-native-logic.py');L=importlib.util.module_from_spec(sp);sp.loader.exec_module(L);B=L.B;H=L.H;one=L.one;W=L.W;ids=L.ids;points=L.points

def scaled(a,b):
 if L.cross(a,b)!=0 or sum(x*y for x,y in zip(a,b))<=0:return None
 ratios={x/y for x,y in zip(a,b)if y};return one(ratios)if ratios else None
def matches(profile,q):
 assert len(q)in[3,4];results=[];m=len(q)
 for k in range(len(profile)-m+1):
  p=profile[k:k+m]
  if m==3:
   a=scaled(L.subtract(p[1],p[0]),L.subtract(q[1],q[0]));b=scaled(L.subtract(p[2],p[1]),L.subtract(q[2],q[1]))
   if a is None or b is None:continue
   scale=min(a,b)/2
  else:
   scale=scaled(L.subtract(p[2],p[1]),L.subtract(q[2],q[1]))
   if scale is None:continue
  offset=tuple(p[1][j]-scale*q[1][j]for j in range(2));mapped=[tuple(offset[j]+scale*v[j]for j in range(2))for v in q]
  if any(mapped[j]!=p[j]for j in range(1,m-1)):continue
  if not L.on(mapped[0],p[0],p[1])or not L.on(mapped[-1],p[-2],p[-1]):continue
  if any(L.cross(L.subtract(mapped[j+1],mapped[j]),L.subtract(p[j+1],p[j]))!=0 or sum(x*y for x,y in zip(L.subtract(mapped[j+1],mapped[j]),L.subtract(p[j+1],p[j])))<=0 for j in range(m-1)):continue
  results.append({'actualBoundaryCornerWindowStart':k,'exactPositiveUniformScale':str(scale),'exactTranslation':list(map(str,offset)),'allActualMappedFragmentPoints':[[str(x)for x in p]for p in mapped]})
 return results

def solve(r,src=False,data=None):
 if src:
  sha='f11107888ef7aa85f3d3593381745207631badbcef1fb1c68f1bcdf51a6ec321';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/28e0ab0a1521b01ec192a389.png').read_bytes()).hexdigest()==sha;assert r['answer']=='E'and B.options(r)==list('ABCDE')and all(k in r['solution']for k in['A','B','C','D','E']);return{'sourceRasterSHA256':sha,'sourceAllFiveFragmentsVisuallyReadWithOfficialExplanation':True,'sourceObservedManualOccurrences':{'A':'vertical-drop then rising roof at right-of-tower buildings','B':'horizontal edge then pointed roof to right of tower','C':'narrow V between two buildings','D':'vertical edge then broken angled roof'},'sourceOfficialVisuallyReviewedAbsentFragment':'E','exactSourceRasterBoundaryTraceNotClaimed':True,'sourceVisualAuditNotClaimedSeparateHumanOrAutomatedPixelProof':True}
 root=W.svg(r,data);d=ids(root);profile=points(d['skyline-boundary']);assert len(profile)>10 and all(a[0]<=b[0]for a,b in zip(profile,profile[1:]))and all(a!=b for a,b in zip(profile,profile[1:]));assert all(L.cross(L.subtract(b,a),L.subtract(c,b))for a,b,c in zip(profile,profile[1:],profile[2:]));fill=points(d['city-fill']);assert fill[:-2]==profile and fill[-2][0]==profile[-1][0]and fill[-1][0]==profile[0][0]and fill[-2][1]==fill[-1][1]>max(y for x,y in profile);proofs={}
 for key in'ABCDE':
  query=points(d['fragment-'+key]);assert all(a!=b for a,b in zip(query,query[1:]));assert all(L.cross(L.subtract(b,a),L.subtract(c,b))for a,b,c in zip(query,query[1:],query[2:]));label=d['label-'+key];assert label.text==key and F(label.attrib['x'])==(min(x for x,y in query)+max(x for x,y in query))/2 and 0<F(label.attrib['y'])-max(y for x,y in query)<60;proofs[key]=matches(profile,query)
 absent=one(key for key,value in proofs.items()if not value);assert r['answer']==absent and B.options(r)==list('ABCDE');return{'allActualTopBoundaryPoints':[[str(v)for v in p]for p in profile],'actualFillTopBoundaryMatchesExplicitProfile':True,'allFiveActualFragmentFitWitnesses':proofs,'allPossibleOrderedCornerWindowsChecked':True,'queryEndpointsMayCropWithinActualBoundarySegments':True,'onlyTranslationAndPositiveUniformScaleNoRotationReflectionOrReversal':True,'uniqueAbsentFragment':absent}
def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);ref=one(r['sourceRefs']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==16);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer'];src=solve({**q,'answer':key},True);proof=solve(r);root=W.svg(r);d=ids(root);a,b=points(d['fragment-A']),points(d['fragment-B']);d['fragment-A'].set('points',' '.join(f'{x-170},{y}'for x,y in b));d['fragment-B'].set('points',' '.join(f'{x+170},{y}'for x,y in a));raw=ET.tostring(root);changed={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
 for cr,cb in[({**r,'answer':'ZZ'},None),(changed,raw)]:
  try:solve(cr,False,cb)
  except(AssertionError,ValueError,IndexError):pass
  else:raise AssertionError('wrongkeyaccepted')
 solve({**changed,'answer':'A'},False,raw);proof['validUpdatedHashActualFragmentSwapTarget']='A';root=W.svg(r);a=points(ids(root)['fragment-A']);a[0]=(a[0][0]+1,a[0][1]);ids(root)['fragment-A'].set('points',' '.join(f'{x},{y}'for x,y in a));bad=ET.tostring(root)
 try:solve({**r,'figureSha256':hashlib.sha256(bad).hexdigest()},False,bad)
 except(AssertionError,ValueError,IndexError):proof['updatedHashMultipleAbsentFragmentDiagramRejected']=True
 else:raise AssertionError('ambiguousmultimissingdiagramaccepted')
 assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(editionHash(JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0]));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==sha;entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newcondition solutions/all5source/newchoices/sourcebitmap/343pxPNG read. SavedsourceA-Doccurrences/Eabsence visuallyreviewedwithofficialexplanation; noexactsourceboundarytrace orautomatedpixelproof claimed. Actualnewtopboundary/fill andallfivequeryvertices decoded; exhaustiveorderedcornerwindowmatching undertranslation/positiveuniformscale andactualcroppedendpoints provesonlyBabsent. RealA/Bquerygeometryswap makesonlyAabsent; updatedhashdiagramwithtwoabsentfragments rejected. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG owncityboundaryandfivefragmentpolylines checked;343pxPNG inspected. No sourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]};summary={'verified':1,'sourceOptionsRead':5,'rewrittenOptionsRead':5,'nativeFigures':1,'newAbsentFragment':'B','validUpdatedHashActualFragmentSwapTarget':'A','updatedHashMultipleAbsentFragmentDiagramRejected':True,'sourceReviewExplicitlyVisualNotAutomatedRasterGeometry':True,'lastBIL4SourceTask':18,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
