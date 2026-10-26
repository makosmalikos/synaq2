"""Allthreefull frozen/newconditions completeofficial/newsolutions andall15
source/newMCQoptions/sourcebitmaps read. Threeactual343pxnewnativePNGs inspected.
Same root author separate exact computation, not anotherhumanreviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil1-native-logic';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('native','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;segment=M.segment;ids=M.ids;points=M.points
ASSETS={8:('59859fe8b43ffbab8767bd8e','00adaf31d442927f6f8eea2d1eef59fe7330656914175307f2667d8cf83d61e1'),42:('f1a21646f71c922c836e5db8','329f12207637af7872ec06d941c8d2091f1905c9bd2566c2e98101cc8f7fbea8'),47:('6acfcc87cad01b2db391c03c','1d710f6da205aa25a616d6fe11ac8d0f0e0b63a9df22aa68534f29917eb80be9')}
def asset(i):
 file,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{file}.png').read_bytes()).hexdigest()==sha;return sha
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def subtract(a,b):return(a[0]-b[0],a[1]-b[1])
def on(p,a,b):return cross(subtract(p,a),subtract(b,a))==0 and min(a[0],b[0])<=p[0]<=max(a[0],b[0])and min(a[1],b[1])<=p[1]<=max(a[1],b[1])
def split_intersections(raw):
 segments=[((a,b),(c,d))for a,b,c,d in raw];vertices={p for pair in segments for p in pair};assert len(segments)==len({tuple(sorted(pair))for pair in segments})
 for(a,b),(c,d)in itertools.combinations(segments,2):
  u,v=subtract(b,a),subtract(d,c);det=cross(u,v)
  if det:
   delta=subtract(c,a);t=cross(delta,v)/det;s=cross(delta,u)/det
   if 0<=t<=1 and 0<=s<=1:vertices.add((a[0]+t*u[0],a[1]+t*u[1]))
  elif cross(subtract(c,a),u)==0:
   common=[p for p in[a,b,c,d]if on(p,a,b)and on(p,c,d)];assert len(set(common))<=1,'Overlapping collinear graph lines'
 edges=[]
 for a,b in segments:
  assert a!=b;ordered=sorted([p for p in vertices if on(p,a,b)],key=lambda p:(p[0]-a[0])**2+(p[1]-a[1])**2);assert ordered[0]==a and ordered[-1]==b;edges.extend(zip(ordered,ordered[1:]))
 return edges,{'allActualLineSegments':len(raw),'allExactCrossingsSplitIntoVertices':True,'actualSplitEdgeCount':len(edges),'actualVertexCount':len(vertices)}
def euler(edges):
 adjacency=collections.defaultdict(list)
 for j,(a,b)in enumerate(edges):assert a!=b;adjacency[a].append((b,j));adjacency[b].append((a,j))
 reached=set();todo=[next(iter(adjacency))]
 while todo:
  v=todo.pop()
  if v in reached:continue
  reached.add(v);todo.extend(u for u,j in adjacency[v])
 assert reached==set(adjacency);odd=[v for v,e in adjacency.items()if len(e)%2];drawable=len(odd)in[0,2];witness=[]
 if drawable:
  stack=[odd[0]if odd else next(iter(adjacency))];used=set()
  while stack:
   v=stack[-1];unused=next(((u,j)for u,j in adjacency[v]if j not in used),None)
   if unused is None:witness.append(stack.pop())
   else:u,j=unused;used.add(j);stack.append(u)
  witness.reverse();assert len(used)==len(edges)and len(witness)==len(edges)+1;inventory=collections.Counter(tuple(sorted(pair))for pair in edges);assert inventory==collections.Counter(tuple(sorted(pair))for pair in zip(witness,witness[1:]))
 return drawable,{'connectedGraphVerified':True,'allActualVertexDegrees':sorted(len(v)for v in adjacency.values()),'oddVertexCount':len(odd),'drawableExactlyOnce':drawable,'fullActualEulerWalkUsesEverySplitEdgeExactlyOnce':drawable,'walkVertexCount':len(witness)}
def graphs(root=None):
 result={}
 if root is None:
  cycle=lambda n:[(j,(j+1)%n)for j in range(n)];cases={'A':cycle(4)*2,'B':cycle(4),'C':cycle(4)+[(0,2)],'D':cycle(4)+[(0,4),(4,2),(1,4),(4,3)],'E':[(0,1),(1,2),(2,3),(3,4),(4,0),(0,3),(1,3)]}
  for k,edges in cases.items():draw,p=euler(edges);result[k]=p
 else:
  d=ids(root)
  for k in'ABCDE':
   raw=[segment(v)for id,v in d.items()if id.startswith('graph-'+k+'-')];edges,p=split_intersections(raw);draw,q=euler(edges);p.update(q);assert d['label-'+k].text==k;result[k]=p
 bad=[k for k,v in result.items()if not v['drawableExactlyOnce']];answer=one(bad);return answer,{'allFiveActualGraphs':result,'uniqueNonEulerChoice':answer,'allDrawableAlternativesHaveActualFullWalkWitnesses':True}
GLYPHS={'T':frozenset([(-1,-1),(1,-1)]),'B':frozenset([(-1,1),(1,1)]),'L':frozenset([(-1,-1),(-1,1)]),'R':frozenset([(1,-1),(1,1)]),'U':frozenset([(-1,1),(1,-1)]),'D':frozenset([(-1,-1),(1,1)])}
def glyph(d,key):
 frame=d['frame-'+key];x,y,w,h=M.rect(frame);assert w==h>20;u=(w-20)/2;cx=x+w/2;cy=y+h/2;keys=[]
 for id,v in d.items():
  if not id.startswith('glyph-'+key+'-'):continue
  x1,y1,x2,y2=segment(v);raw=frozenset([((x1-cx)/u,(y1-cy)/u),((x2-cx)/u,(y2-cy)/u)]);keys.append(one(k for k,v in GLYPHS.items()if raw==v))
 assert len(keys)==len(set(keys));return set(keys)
def xor(root=None):
 if root is None:rows=[[{'B','U'},{'L','U'},{'L','B'}],[{'T','R','B'},{'T','R','B','L','U'},{'L','U'}],[{'T','R','U'},{'T','R','B'},None]];choices={'A':{'T','R','B'},'B':{'R','B','D'},'C':{'L','U'},'D':{'B','U'},'E':{'T','R','U'}}
 else:
  d=ids(root);rows=[[glyph(d,f'row-{r}-{c}')if(r,c)!=(2,2)else None for c in range(3)]for r in range(3)];assert not glyph(d,'row-2-2')and d['missing'].text=='?';choices={k:glyph(d,'choice-'+k)for k in'ABCDE'}
 assert all(a^b==c for a,b,c in rows[:2]);target=rows[2][0]^rows[2][1];assert len({tuple(sorted(v))for v in choices.values()})==5;answer=one(k for k,v in choices.items()if v==target);return answer,{'allActualMatrixGlyphSegments':[[sorted(v)if v is not None else None for v in row]for row in rows],'allFiveActualOptionGlyphSegments':{k:sorted(v)for k,v in choices.items()},'bothCompleteExampleRowsSatisfyExactSymmetricDifference':True,'lastRowExactXORTargetSegments':sorted(target),'uniqueMatchingChoice':answer}
def digits(count):
 solutions=[]
 for square,triangle,circle in itertools.permutations(range(10),3):
  if square==0 or circle==0:continue
  if 11*square+count*triangle==111*circle:solutions.append((square,triangle,circle))
 square,triangle,circle=one(solutions);ones=square+count*triangle;carry1=ones//10;tens=square+carry1;carry2=tens//10;assert ones%10==tens%10==carry2==circle;return F(triangle),{'all720DistinctDigitAssignmentsChecked':720,'allLeadingNonzeroThreeDigitSolutions':[list(v)for v in solutions],'actualSingleTriangleAddendCount':count,'bothActualColumnCarries':[carry1,carry2],'wholeNumberEqualityAndColumnByColumnAdditionAgree':True,'triangleDigitTarget':str(triangle)}
def digit_figure(root):
 d=ids(root);items=[]
 for id,v in d.items():
  if not(id.startswith('summand-')or id.startswith('result-')):continue
  tag=v.tag.split('}')[-1]
  if tag=='rect':x,y,w,h=M.rect(v);assert w==h==34;center=(x+w/2,y+h/2);kind='square'
  elif tag=='circle':center=(F(v.attrib['cx']),F(v.attrib['cy']));assert F(v.attrib['r'])==18;kind='circle'
  else:
   assert tag=='polygon';p=points(v);assert len(p)==3;top=one(v for v in p if v[1]==min(y for x,y in p));base=sorted(v for v in p if v!=top);assert base[0][1]==base[1][1]and base[1][0]-base[0][0]==38 and base[0][1]-top[1]==36 and 2*top[0]==base[0][0]+base[1][0];center=(top[0],top[1]+19);kind='triangle'
  items.append((kind,center))
 circles=sorted(p for k,p in items if k=='circle');squares=sorted(p for k,p in items if k=='square');triangles=sorted(p for k,p in items if k=='triangle');assert len(circles)==3 and len(squares)==2 and triangles;assert len({y for x,y in circles})==len({y for x,y in squares})==1;xs=[x for x,y in circles];assert xs[1]-xs[0]==xs[2]-xs[1]>38;assert[x for x,y in squares]==xs[1:];assert all(x==xs[-1]and squares[0][1]<y<circles[0][1]for x,y in triangles);assert len(triangles)==len(set(triangles));assert all(b[1]-a[1]>38 for a,b in zip(triangles,triangles[1:]));assert d['plus'].text=='+';x1,y1,x2,y2=segment(d['sum-line']);assert y1==y2 and max(y for x,y in squares+triangles)<y1<circles[0][1]and x1<xs[0]<xs[-1]<x2;out,p=digits(len(triangles));p['allActualShapeGeometriesColumnsPlaceValuesAndRowsChecked']=True;return out,p
def solve(r,i,src=False,data=None):
 proof={'sourceRasterSHA256':asset(i)}if src else{};root=None if src else W.svg(r,data)
 if i in[8,42]:
  answer,p=(graphs(root)if i==8 else xor(root));proof.update(p);assert B.options(r)==list('ABCDE')and r['answer']==answer;proof['answerChecked']=True;return proof
 if i==47:
  out,p=digits(2)if src else digit_figure(root);proof.update(p);proof.update(B.checked_choices(r,out,[out-4,out-2,out,out+2,out+3]));proof['answerChecked']=True;return proof
 raise AssertionError(i)

def changed(r,i):
 d=copy.deepcopy(r);root=W.svg(r);v=ids(root);ns='{http://www.w3.org/2000/svg}'
 if i==8:
  extra=copy.deepcopy(v['graph-D-6']);extra.set('id','graph-C-extra');x1,y1,x2,y2=segment(extra)
  for key,value in zip(['x1','y1','x2','y2'],[x1-170,y1,x2-170,y2]):extra.set(key,str(value))
  root.append(extra);v['graph-D-6'].set('x1','265');v['graph-D-6'].set('y1','200');answer='C'
 elif i==42:
  c=[x for id,x in v.items()if id.startswith('glyph-choice-C-')];e=[x for id,x in v.items()if id.startswith('glyph-choice-D-')];assert len(c)==len(e)==2;oldc=list(map(segment,c));olde=list(map(segment,e))
  for nodes,raw,dx in[(c,olde,-67),(e,oldc,67)]:
   for node,(x1,y1,x2,y2)in zip(nodes,raw):
    for key,value in zip(['x1','y1','x2','y2'],[x1+dx,y1,x2+dx,y2]):node.set(key,str(value))
  answer='C'
 else:root.remove(v['summand-single-2']);answer='6';d['options']=['2','4','6','8','9']
 raw=ET.tostring(root);d['figureSha256']=hashlib.sha256(raw).hexdigest();return d,raw,answer
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['images']and q['solution']and len(q['options'])==5;answer=one(v['text']for v in q['options']if v['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer']);src=solve({**q,'answer':answer},i,True);proof=solve(r,i);bad,raw,target=changed(r,i)
  for changedRow,changedBytes in[({**r,'answer':'999999999'},None),(bad,raw)]:
   try:solve(changedRow,i,False,changedBytes)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve({**bad,'answer':target},i,False,raw)
  except Exception as e:raise AssertionError(('validChangedActualFigure',i))from e
  proof['validUpdatedHashActualFigureTarget']=target;proof['oldKeyRejectedAndCorrectChangedActualFigureAnswerAccepted']=True
  root=W.svg(r);v=ids(root)
  if i==8:
   # An extra disconnected segment must fail connectivity, even with a fresh asset hash.
   ET.SubElement(root,'{http://www.w3.org/2000/svg}line',{'id':'graph-A-disconnected','x1':'5','y1':'5','x2':'15','y2':'5'})
  elif i==42:v['glyph-choice-D-0'].set('x1','227')
  else:v['summand-single-0'].set('points','170,93 151,129 189,129')
  malformed=ET.tostring(root)
  try:solve({**r,'figureSha256':hashlib.sha256(malformed).hexdigest()},i,False,malformed)
  except(AssertionError,ValueError,IndexError):proof['updatedHashMalformedActualGeometryRejected']=True
  else:raise AssertionError(('malformedactualfigureaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Allthreefullsource/newconditions completeofficial/newsolutions/all15source/newoptions/sourcebitmaps/343pxnativePNGs read. Allactualsegmentcrossings splitexactly, connectivity/allvertexdegrees/fullEulerwalks verifiedforfivealternatives. Actualglyphsegmentgeometriesnormalized/allXORrows/allchoices checked. Actualshapetags/columns/rows decoded, all720distinctdigittriples/leadingnonzero/columncarries verified. ActualupdatedhashgraphandglyphchoicesC,trianglecountdigit6 recomputed; malformedgeometry/connectivity rejected. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG actualsegments/crossings/glyphs/shapevertices/placevaluecolumns decoded. Sourcebitmaps/all343pxPNGs inspected. No sourcebitmap/tracedvector.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'fullSourceNewConditionsAndSolutionsRead':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'wrongKeysRejected':3,'validUpdatedHashActualFigureChangesRecomputed':3,'updatedHashMalformedActualGeometryRejected':3,'nativeFigures':3,'visualQuestionsStillSeparate':[11,27,32,44,50],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
