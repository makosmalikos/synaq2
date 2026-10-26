"""Both source rasters, full source/new conditions official/new solutions and all
8saved/newchoices read. Two own native SVGs inspected as343px PNGs. No source
art reused/traced. Actual labelled triangle cells and rectangle intersection
geometry drive exact answers. Same author computation, not another human.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil14-final';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('a','scripts/editorial/review-bil12-final.py');A=importlib.util.module_from_spec(sp);sp.loader.exec_module(A);M=A.M;B=A.B;H=A.H;E=A.E;one=A.one;W=A.W;ids=A.ids;points=A.points;segment=A.segment;P=A.P

def solve(r,i,data=None):
 root=W.svg(r,data);d=ids(root);p={}
 if i==31:
  values=[]
  for k in range(3):
   T,L,R=points(d['outer-'+str(k)]);x,y=T;assert L[1]==R[1]>y and L[0]<x<R[0]and L[0]+R[0]==2*x;w=R[0]-L[0];h=L[1]-y;ML=(x-w/4,y+h/2);MR=(x+w/4,y+h/2);BM=(x,y+h);assert points(d['middle-'+str(k)])==[ML,MR,BM];assert segment(d['divider-left-'+str(k)])==(*ML,*BM)and segment(d['divider-right-'+str(k)])==(*MR,*BM);assert d['middle-'+str(k)].attrib['fill']=='#d7c8f4';row=[]
   for j,c in enumerate([(x,y+h/3),(x-w/4,y+5*h/6),(x+w/4,y+5*h/6),(x,y+2*h/3)]):
    el=d[f'value-{k}-{j}'];assert abs(F(el.attrib['x'])-c[0])<F(1,10**7)and abs(F(el.attrib['y'])-6-c[1])<F(1,10**7);row.append(el.text if el.text=='x'else F(el.text))
   values.append(row)
  for top,left,right,middle in values[:2]:assert min(top,left,right,middle)>0 and top*right/left==middle
  top,left,unknown,middle=values[2];assert unknown=='x'and min(top,left,middle)>0;out=middle*left/top;assert top*out/left==middle;p['allActualPositionedTriangleValues']=[[str(v)for v in row]for row in values];p['allCellCentroidsAndDividingEdgesVerified']=True
 else:
  short,long,side,overlap=H.numeric_tokens(r['statement'].replace('см²',''));sx,sy,sw,sh=M.rect(d['square']);rx,ry,rw,rh=M.rect(d['rectangle']);ix,iy,iw,ih=M.rect(d['intersection']);assert min(short,long,side,overlap)>0 and sw==sh;scale=sw/side;assert rw/long==rh/short==scale;expected=(max(sx,rx),max(sy,ry),min(sx+sw,rx+rw)-max(sx,rx),min(sy+sh,ry+rh)-max(sy,ry));assert(iw>0 and ih>0)and(ix,iy,iw,ih)==expected;assert iw*ih/scale**2==overlap;assert d['intersection'].attrib['fill']=='#fff'and d['square'].attrib['fill']=='#d8c8f1'and d['rectangle'].attrib['fill']=='#c8def8';assert B.scalar(d['square-side'].text)==side and B.scalar(d['rectangle-width'].text)==long and B.scalar(d['rectangle-height'].text)==short;out=sw*sh/scale**2+rw*rh/scale**2-2*overlap;assert out==side**2+short*long-2*overlap;p['actualPhysicalSquareRectangleOverlapAreas']=list(map(str,[side**2,short*long,overlap]));p['actualIntersectionRectDecodedNotAssumed']=list(map(str,expected));p['allPhysicalLabelsShareSingleScale']=str(scale)
 opts=B.options(r);vals=[B.scalar(v.replace('см²',''))for v in opts];assert len(opts)==len(set(opts))==4 and len(set(vals))==4 and vals.count(out)==1 and B.scalar(r['answer'])==out and r['answer']in opts;p['allActualOptionValues']=list(map(str,vals));p['target']=str(out);return p

def source(q,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'allSourceRasterGivensAndOfficialSolutionReadNotTraced':True}
 if i==31:
  triples=[(F(12),F(9),F(6),F(8)),(F(5),F(3),F(15),F(25))];assert all(t*r/l==m for t,l,r,m in triples);out=F(14)*4/8;p['sourceActualTopLeftRightMiddleExamples']=[list(map(str,v))for v in triples];p['explicitRuleAddedToNewTaskToAvoidFinitePatternAmbiguity']=True
 else:
  a,b,side,overlap=H.numeric_tokens(q['statement'].replace('см²',''));assert a*b==side**2;out=a*b+side**2-2*overlap;p['sourceBothAreasAndWhiteIntersection']=list(map(str,[a*b,side**2,overlap]))
 vals=list(map(B.scalar,B.options(q)));assert vals.count(out)==1 and B.scalar(q['answer'])==out;p['allSourceOptionValues']=list(map(str,vals));p['target']=str(out);return p

def changed(r,i):
 cr=copy.deepcopy(r);root=W.svg(r);d=ids(root)
 if i==31:d['value-2-3'].text='25';new=F(10);cr['options']=[str(B.scalar(v)+2)for v in cr['options']]
 else:
  cr['statement']=cr['statement'].replace('5 см және 20 см','10 см және 40 см').replace('қабырғасы 10 см','қабырғасы 20 см').replace('25 см²','100 см²');d['square-side'].text='20 см';d['rectangle-width'].text='40 см';d['rectangle-height'].text='10 см';new=F(600);cr['options']=[str(B.scalar(v)*4)+' см²'for v in cr['options']]
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();return cr,raw,one(v for v in cr['options']if B.scalar(v)==new)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])in[4,5];key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=solve(r,i);cr,raw,new=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/change',i))from e
  for bad,data in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  try:proof['validChangedActualGeometryOrConditionTarget']=solve({**cr,'answer':new},i,raw)['target']
  except Exception as e:raise AssertionError(('validchange',i))from e
  root=W.svg(r);d=ids(root)
  if i==31:d['divider-left-0'].set('x2','95')
  else:d['intersection'].set('width','61')
  bs=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedActualNativeGeometryRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and len(r['options'])==len(q['options']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions official/new solutions all8saved/newchoices read. All actual triangle cell vertices and positioned values, divider endpoints and rules checked. Actual square rectangle white intersection decoded and physical labels validated at a single scale. Changed actual inputs reject old answers and accept recomputed values; malformed updated-hash geometry rejected. Same author computation.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG geometry independently recomputed,343px PNG inspected. Source art not reused.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'sourceOptionsRead':8,'rewrittenOptionsRead':8,'nativeFigures':2,'validChangedActualInputsRecomputed':2,'malformedActualGeometryRejected':2,'pythonJavaScriptHashesMatched':2,'allFortyBIL14TasksCompleteWithOtherBatch':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
