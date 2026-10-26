"""Fullsource/newcondition completeofficial/newsolution/all5source/newoptions
read; sourcebitmap/actual343pxnativePNG inspected. Same root author separate
computation, not anotherhumanreviewer. Irrational drawingvertices use tight
normalized tolerance; angleansweralgebra is exact from displayed degrees.
"""
import hashlib,importlib.util,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil2-native-angle';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;E=B.E;H=B.H;one=B.one;W=M.W;ids=M.ids;points=M.points;segment=M.segment
def vector(a,b):return tuple(float(x-y)for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def angle(a,b,c):u,v=vector(a,b),vector(c,b);return math.degrees(math.atan2(abs(cross(u,v)),dot(u,v)))
def actual(root):
 d=ids(root);left,right=points(d['left-triangle']),points(d['right-triangle']);assert len(left)==len(right)==3;A,Bb,C=left;C2,D,Ee=right;assert C==C2;vertices=dict(zip('ABCDE',[A,Bb,C,D,Ee]));norm=lambda v:math.hypot(*v)
 for key in['AB','BC','AC','CD','DE','CE']:assert segment(d['edge-'+key])==(*vertices[key[0]],*vertices[key[1]])
 for a,b,c in[(A,C,D),(Bb,C,Ee)]:u,v=vector(a,b),vector(c,b);assert abs(cross(u,v))/(norm(u)*norm(v))<1e-9 and dot(u,v)<0
 assert math.isclose(norm(vector(D,C)),norm(vector(Ee,C)),rel_tol=1e-9)and math.isclose(angle(A,Bb,C),90,abs_tol=1e-7);base=B.scalar(d['base-angle'].text);assert 45<base<90 and math.isclose(angle(C,Ee,D),float(base),abs_tol=1e-7)and math.isclose(angle(C,D,Ee),float(base),abs_tol=1e-7);out=2*base-90;assert math.isclose(angle(Bb,A,C),float(out),abs_tol=1e-7)
 for key,p in vertices.items():label=d['label-'+key];assert label.text==key and norm(vector((F(label.attrib['x']),F(label.attrib['y'])),p))<35
 q,s,r=points(d['right-angle']);assert all(norm(vector(v,Bb))<15 for v in[q,s,r]);assert abs(dot(vector(q,s),vector(r,s)))<1e-6;assert d['asked-angle'].text=='x';return out,{'allActualBothTriangleVerticesAndSixEdgesChecked':True,'bothActualCollinearOppositeRayPairsVerified':True,'actualCDandCEEqualAndBIsRightAngle':True,'actualEandDBaseAnglesMatchDisplayedDegrees':str(base),'actualBRightAngleMarkerAndAllFiveLetterAttachmentsChecked':True,'irrationalDrawingNormalizedTolerance':1e-9,'measuredDrawingAnglesAgreeWithExactLabelAlgebra':True,'exactDegreeTarget':str(out)}
def solve(r,src=False,data=None):
 if src:sha='31ce5923b047ea1f825b85fb578f92ce6c6356ba41313ad1a31aa6166ef632aa';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/69d683a044beee461206f5e3.png').read_bytes()).hexdigest()==sha;out=F(2*70-90);proof={'sourceRasterSHA256':sha,'sourceObservedBaseAngleDegrees':70,'sourceObservedEqualCDCEAndRightBAndVerticalAngles':True,'sourcePrintedAngleAlgebraRecomputed':True,'exactDegreeTarget':str(out)}
 else:out,proof=actual(W.svg(r,data))
 parse=lambda t:E.calc(H.tex(t).replace('^\\circ','').replace('°',''));values=list(map(parse,B.options(r)));assert values==[out,90-out,out/2,180-out/2,out-15]and len(set(values))==5 and parse(r['answer'])==out;proof['allFiveActualDegreeOptions']=list(map(str,values));proof['answerChecked']=True;return proof
def changed(r):
 root=W.svg(r);d=ids(root);theta=math.radians(48);u=(math.cos(theta),math.sin(theta));A=(55.,150.);C=(175.,150.);D=(315.,150.);Ee=(C[0]+140*u[0],C[1]+140*u[1]);Bb=(C[0]-120*u[0]**2,C[1]-120*u[0]*u[1]);v=dict(zip('ABCDE',[A,Bb,C,D,Ee]));fmt=lambda p:','.join(f'{x:.10f}'for x in p)
 d['left-triangle'].set('points',' '.join(map(fmt,[A,Bb,C])));d['right-triangle'].set('points',' '.join(map(fmt,[C,D,Ee])))
 for key in['AB','BC','AC','CD','DE','CE']:
  for attr,value in zip(['x1','y1','x2','y2'],v[key[0]]+v[key[1]]):d['edge-'+key].set(attr,f'{value:.10f}')
 va,vb=vector(A,Bb),vector(C,Bb);la,lb=math.hypot(*va),math.hypot(*vb);q=tuple(Bb[j]+9*va[j]/la for j in range(2));p=tuple(Bb[j]+9*vb[j]/lb for j in range(2));corner=tuple(q[j]+p[j]-Bb[j]for j in range(2));d['right-angle'].set('points',' '.join(map(fmt,[q,corner,p])));d['base-angle'].text='66°'
 for key,(x,y)in v.items():d['label-'+key].set('x',str(x));d['label-'+key].set('y',str(y-12))
 raw=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(raw).hexdigest(),'options':['42°','48°','21°','159°','27°']};return bad,raw
def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==11);assert q['images']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=solve({**q,'answer':key},True);proof=solve(r);bad,raw=changed(r)
 for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
  try:solve(changedRow,False,changedBytes)
  except(AssertionError,ValueError,IndexError):pass
  else:raise AssertionError('oldKeyAccepted')
 solve({**bad,'answer':'42°'},False,raw);proof['validUpdatedHashBase66ActualGeometryTarget']='42';proof['oldKeyRejectedAndCorrectChangedAngleAccepted']=True;root=W.svg(r);d=ids(root);ps=points(d['right-triangle']);ps[-1]=(ps[-1][0]+1,ps[-1][1]);d['right-triangle'].set('points',' '.join(','.join(map(str,p))for p in ps));malformed=ET.tostring(root)
 try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},False,malformed)
 except AssertionError:proof['updatedHashMalformedGeometryRejected']=True
 else:raise AssertionError('malformedTriangleAccepted')
 assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];equalities=0
 for match in re.finditer(r'[0-9°(),.+−×÷/\s=]+',r['solution']):
  sides=[v.strip().rstrip('.,').replace('°','')for v in match[0].split('=')]
  if len(sides)<2 or not all(sides):continue
  try:vals=[E.calc(v)for v in sides]
  except(AssertionError,ValueError,SyntaxError):continue
  assert len(set(vals))==1;equalities+=len(sides)-1
 entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Actualtrianglepolygons/sixedges/equalCDCE/rightB/oppositecollinearraypairs/anglelabel andletterattachments checkedwithtightnormalizedtrigonometricdrawingtolerance; answerexactfromdisplayeddegrees. Sourcebitmap/343pxnativePNG inspected. No sourcebitmap/tracedvector.'}};js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0];console.log(editionHash(r));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==entry['sha256'];summary={'verified':1,'fullSourceNewConditionsAndSolutionsRead':1,'sourceOptionsRead':5,'rewrittenOptionsRead':5,'wrongKeyRejected':True,'validUpdatedHashBaseAngleGeometryRecomputed':True,'updatedHashMalformedGeometryRejected':True,'nativeFigures':1,'remainingBIL2Visuals':[22,40,41,48],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
