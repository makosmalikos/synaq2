"""Three fullsource/newconditions official/newsolutions/all15choices, shared
sourcebitmap andown343pxPNG read. Sameauthor separate computation, notanother
humanreviewer. Counts and topology, notphysicalsticklengths, define the pattern.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil5-native-patterns';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids
def solve(r,i,src=False,data=None):
 s=r['statement'];p={}
 if src:
  sha='d2f05cef9dd7161b8f97ca8209050d5125aca91dfcfb42e74360f4169e5a9e4d';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/0a2d1861514ea0660f5186e9.png').read_bytes()).hexdigest()==sha;block=one(re.findall(r'\\text\{Таяқша\}([^\n]+)',s));counts=H.numeric_tokens(block);assert counts==[3,7,10,14];a,b=F(3),F(4);p['sourceRasterSHA256']=sha;p['sourcePatternVisuallyReadAsThreePostsAndFourRoofSticks']=True
 else:
  root=W.svg(r,data);d=ids(root);lines=[v for v in s.splitlines()if v.startswith('|')];cells=[[v.strip()for v in line.strip('|').split('|')]for line in lines];assert len(cells)==3 and cells[0]==['Фигура','1','2','3','4']and cells[1]==['---']*5 and cells[2][0]=='Таяқша саны';counts=list(map(F,cells[2][1:]));a=F(one(re.findall(r'Алғашқы фигура (\d+) тік',s)));hh,dd=one(re.findall(r'өткенде (\d+) көлденең және (\d+) қиғаш',s));hh,dd=F(hh),F(dd);b=hh+dd;assert F(one(re.findall(r'тақ нөмірлі фигураға өткенде (\d+) тік',s)))==a;assert a==4 and hh==3 and dd in[1,2];sets=[]
  for j in range(1,5):
   group=d['stage-'+str(j)];nodes=list(group);assert len(nodes)==counts[j-1] and all(v.tag.endswith('line')for v in nodes);segs=[M.segment(v)for v in nodes];assert len(set(segs))==len(segs);ox=min(x for x,y,xx,yy in segs);oy=max(y for x,y,xx,yy in segs);local={tuple(v for v in[x-ox,y-oy,xx-ox,yy-oy])for x,y,xx,yy in segs};expected=set()
   for level in range((j+1)//2):
    for col in range(4):expected.add((F(col*18),F(-level*24),F(col*18),F(-level*24-24)))
    if j>=2*(level+1):
     for col in range(3):expected.add((F(col*18),F(-level*24-24),F((col+1)*18),F(-level*24-24)))
     expected.add((F(0),F(-level*24-24),F(18),F(-level*24)))
     if dd==2:expected.add((F(36),F(-level*24),F(54),F(-level*24-24)))
   assert local==expected;assert d['label-'+str(j)].text==str(j);sets.append(local)
  assert all(u<v for u,v in zip(sets,sets[1:]));p['allFourActualStageSegmentCounts']=list(map(str,counts));p['allStageNormalizedEndpointsAndNestedGrowthChecked']=True;p['allNativeTableCells']=cells;p['noPhysicalEqualStickLengthsInferredFromSchematicPixels']=True
 assert counts==[a,a+b,2*a+b,2*(a+b)];tail=s.splitlines()[-1];n=int(one(H.numeric_tokens(tail)));step=a+b
 def count(j):return (j//2)*step+(a if j%2 else 0)
 if i in[29,30]:out=count(n);assert out>0;p['askedStageIndex']=n
 else:
  candidates=[j for j in range(1,2*n+1)if count(j)==n];out=F(one(candidates));assert count(int(out))==n;p['allPossiblePositiveStageIndicesCheckedThroughBound']=2*n;p['actualGivenStickCount']=n
 p['exactAlternatingPostRoofIncrements']=list(map(str,[a,b]));p['target']=str(out);p.update(B.checked_choices(r,out));return p
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];entries=[];evidence=[];assert len(rows)==3
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer'];src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=copy.deepcopy(r);root=W.svg(r);d=ids(root)
  if i in[29,30]:
   for j in[2,3,4]:
    group=d['stage-'+str(j)]
    for el in list(group):
     x,y,xx,yy=M.segment(el)
     if xx>x and yy<y:group.remove(el)
   cr['statement']=cr['statement'].replace('2 қиғаш','1 қиғаш').replace('| 4 | 9 | 13 | 18 |','| 4 | 8 | 12 | 16 |');new=F(20 if i==29 else 128)
  else:cr['statement']=cr['statement'].replace('958 таяқшасы','967 таяқшасы');new=F(215)
  raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();old=F(proof['target']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']]
  for bad,bs in[({**r,'answer':'999999'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,False,bs)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  changed=solve({**cr,'answer':str(new)},i,False,raw);proof['validUpdatedHashActualPatternOrInputTarget']=changed['target'];badroot=W.svg(r);group=ids(badroot)['stage-1'];group.remove(list(group)[0]);bs=ET.tostring(badroot)
  try:solve({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,False,bs)
  except(AssertionError,ValueError):proof['updatedHashActualStrokeCountMismatchRejected']=True
  else:raise AssertionError(('missingstrokeaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newconditions solutions/all15choices/sharedsourcebitmap/343pxPNG read. Actualall4SVGlinegroups/normalizedendpoints/labels/nestedsubsets andalltablecells matchprintedpost/roofincrementrule. Exactfiniteformulaandfullboundedpositiveinverseenumeration; meaningfulupdatedhashactualroofstrokeandtablechangesoractualinverseinputrecomputed, oldkeysrejected; updatedhashmissinginitialstroke fails. Noequalphysicalstickmetricclaim. Sameauthornotanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG allactualstageendpointsets/strokecounts checked;343pxPNGinspected;nosourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'distinctNativeFigures':1,'validUpdatedHashActualPatternOrInputTargetsRecomputed':3,'updatedHashActualStrokeMismatchRejected':3,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
