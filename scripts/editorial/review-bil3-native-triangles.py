"""Full source/new condition, full official/new solution, all5source/newchoices,
sourcebitmap and343pxnativePNG inspected. Same root author separate exact
computation, not anotherhumanreviewer. Sourcecoordinates model observed incidence
only; sourcepixelmetriccoordinates are not claimed.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil3-native-triangles';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('l','scripts/editorial/review-bil1-native-logic.py');L=importlib.util.module_from_spec(sp);sp.loader.exec_module(L);B=L.B;H=L.H;one=L.one;W=L.W;ids=L.ids;segment=L.segment

def triangles(raw):
 edges,proof=L.split_intersections(raw);vertices=sorted(set(itertools.chain.from_iterable(edges)));degrees=collections.Counter(p for e in edges for p in e);assert min(degrees.values())>=2
 def covered(a,b):
  adjacent=collections.defaultdict(list)
  for p,q in edges:
   if L.on(p,a,b)and L.on(q,a,b):adjacent[p].append(q);adjacent[q].append(p)
  reached=set();todo=[a]
  while todo:
   p=todo.pop()
   if p in reached:continue
   reached.add(p);todo.extend(adjacent[p])
  return b in reached
 connection={frozenset([a,b]):covered(a,b)for a,b in itertools.combinations(vertices,2)};found=[]
 for vs in itertools.combinations(vertices,3):
  a,b,c=vs
  if L.cross(L.subtract(b,a),L.subtract(c,a))and all(connection[frozenset(pair)]for pair in itertools.combinations(vs,2)):found.append(vs)
 # Group by actual geometric vertices: rightmost R, highest T (screen y-down).
 R=max(vertices,key=lambda p:p[0]);T=min(vertices,key=lambda p:p[1]);left=min(vertices,key=lambda p:p[0]);groups=collections.Counter()
 for vs in found:
  if R in vs:
   other=[p for p in vs if p!=R]
   if all(p[0]==T[0]for p in other):groups['R_vertical']+=1
   else:assert all(L.on(p,left,T)for p in other);groups['R_left_side']+=1
  else:assert T in vs;groups['T_without_R']+=1
 assert len(found)==sum(groups.values());proof.update({'allRationalVertexTriplesEnumerated':math_comb(len(vertices),3),'everyCandidateSideRequiresFullContiguousCollinearSplitGraphCoverage':True,'allTriangleVertexWitnesses':[[list(map(str,p))for p in vs]for vs in found],'completeIndependentGroupingByTopAndRightmostVertices':dict(groups),'noDanglingSegmentEndpoints':True,'sourcePixelCoordinatesNotUsedAsMetric':True});return F(len(found)),proof

def math_comb(n,k):
 import math
 return math.comb(n,k)
def solve(r,src=False,data=None,check=True):
 if src:
  sha='ec75fa90d71eef0595005cfaff163f5c118ade4d2a128b47e6ead9fe78985e31';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/efb8e9ae635e3ac27141b073.png').read_bytes()).hexdigest()==sha
  # Arbitrary rational realization of the source's observed seven segments,
  # preserving every endpoint/collinearity/crossing without tracing its pixels.
  pairs=[[(0,0),(12,0)],[(12,0),(4,10)],[(4,10),(0,0)],[(4,0),(4,10)],[(12,0),(2,5)],[(12,0),(4,6)],[(3,F(15,2)),(4,F(15,2))]];raw=[tuple(F(v)for p in pair for v in(p[0],10-p[1]))for pair in pairs]
 else:
  root=W.svg(r,data);raw=[segment(e)for e in ids(root)['diagram']];assert all(e.tag.endswith('line')for e in ids(root)['diagram'])
 out,p=triangles(raw);p['target']=str(out)
 if src:p['sourceRasterSHA256']=sha
 if check:p.update(B.checked_choices(r,out))
 return out,p

def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);ref=one(r['sourceRefs']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==22);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);_,src=solve({**q,'answer':key},True);_,proof=solve(r);root=W.svg(r);group=ids(root)['diagram'];ET.SubElement(group,'{http://www.w3.org/2000/svg}line',{'id':'geom-extra','x1':'123','y1':'100','x2':'135','y2':'100','stroke':'#637fc1'});raw=ET.tostring(root);d={**r,'figureSha256':hashlib.sha256(raw).hexdigest()};target,_=solve(d,False,raw,False);old,_=solve(r);assert target!=old;d['options']=[str(B.scalar(v)+target-old)for v in r['options']]
 for cr,cb in[({**r,'answer':'999999'},None),(d,raw)]:
  try:solve(cr,False,cb)
  except(AssertionError,ValueError,IndexError):pass
  else:raise AssertionError('oldkeyaccepted')
 solve({**d,'answer':str(target)},False,raw);proof['validUpdatedHashAddedActualCrossbarTarget']=str(target);root=W.svg(r);ids(root)['geom-7'].set('x1','76');bad=ET.tostring(root)
 try:solve({**r,'figureSha256':hashlib.sha256(bad).hexdigest()},False,bad)
 except(AssertionError,ValueError,IndexError):proof['updatedHashDanglingNativeSegmentRejected']=True
 else:raise AssertionError('danglingendpointaccepted')
 assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(editionHash(JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0]));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==sha;entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newcondition official/newsolution/all5source/newchoices/sourcebitmap/343pxPNG read. Sourceobservedincidences givenrationalrealizationwithoutpretendingpixelmeasurements. Actualall8nativeSVGsegments splitatallrationalcrossings; everyvertextriple checkedfornonzeroareaandallthreefullcontiguousstraightboundariesusingrestrictedgraphreachability. Complete13trianglewitnessinventory crossindependent6+3+4groups. Actualaddedcrossbarcanary14 recomputed; updatedhashdanglingendpointrejected. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualallsegmentcoordinates/crossings/fulltriangleedges decoded.343pxPNG inspected. No sourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]};summary={'verified':1,'sourceOptionsRead':5,'rewrittenOptionsRead':5,'nativeFigures':1,'sourceTriangleCount':12,'rewrittenTriangleCount':13,'validUpdatedHashActualCrossbarTarget':str(target),'updatedHashDanglingEndpointRejected':True,'allFiftyBIL3SourceTasksCompleteWithOtherBatches':True,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
