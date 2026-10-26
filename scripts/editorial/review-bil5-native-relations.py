"""All3fullsource/newconditions official/newsolutions/all15choices/sourcebitmaps
and343pxnativePNGs read. ActualSVGgraphs/markercoordinates checked, sameauthor
separate computationalreview, notanotherhumanreviewer. Sourcegraphs/patterns
visually reviewed without claiming automated exact raster geometry extraction.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil5-native-relations';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';TOL=1e-6
sp=importlib.util.spec_from_file_location('g','scripts/editorial/review-bil4-nonvisual.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);B=G.B;H=G.H;one=G.one
mp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(mp);mp.loader.exec_module(M);W=M.W;ids=M.ids
def near(a,b):assert abs(float(a-b))<TOL,(float(a),float(b))
def node(v):return tuple(F(v.attrib[k])for k in['cx','cy'])
def native_graph(root,nodeprefix,edgeprefix):
 d=ids(root);nodes={k.removeprefix(nodeprefix):node(v)for k,v in d.items()if k.startswith(nodeprefix)};assert len(set(nodes.values()))==len(nodes);coords={v:k for k,v in nodes.items()};edges=[]
 for k,v in d.items():
  if k.startswith(edgeprefix) and v.tag.endswith('line'):
   a,b,c,e=M.segment(v);assert(a,b)in coords and(c,e)in coords and(a,b)!=(c,e);edges.append((coords[(a,b)],coords[(c,e)]))
 assert len(set(tuple(sorted(e))for e in edges))==len(edges);return nodes,edges
def road_paths(nodes,edges,pairs):
 adjacency={v:[]for v in nodes}
 for j,(a,b)in enumerate(edges):adjacency[a].append((b,j));adjacency[b].append((a,j))
 assert len(edges)==len(nodes)-1 and all(len(adjacency[k])==1 for k in'ABCDE')
 reached=set();todo=[next(iter(nodes))]
 while todo:
  k=todo.pop()
  if k in reached:continue
  reached.add(k);todo.extend(a for a,j in adjacency[k]if a not in reached)
 assert reached==set(nodes)
 def path(start,end):
  def dfs(here,prev):
   if here==end:return []
   for nxt,j in adjacency[here]:
    if nxt==prev:continue
    answer=dfs(nxt,here)
    if answer is not None:return[j,*answer]
   return None
  result=dfs(start,None);assert result is not None;return result
 allpaths=[path(a,b)for a,b,value in pairs];frequencies=collections.Counter(j for p in allpaths for j in p);assert set(frequencies)==set(range(len(edges)))and set(frequencies.values())=={2}
 # A positive feasible edge-weight witness is found from the five actual
 # distance equations. The two backbone free weights are deliberately chosen
 # independently of author parameters. All original distances are replayed.
 internal={k for k,v in adjacency.items()if len(v)>1};fixed={j:max(v for a,b,v in pairs)/4 for j,(a,b)in enumerate(edges)if a in internal and b in internal};free=[j for j in range(len(edges))if j not in fixed];assert len(free)==5;matrix=[]
 for p,(_,_,value)in zip(allpaths,pairs):matrix.append([F(j in p)for j in free]+[value-sum(v for j,v in fixed.items()if j in p)])
 solved=G.gaussian(matrix,5);weights={**fixed,**dict(zip(free,solved))};assert min(weights.values())>0
 for p,(_,_,value)in zip(allpaths,pairs):assert sum(weights[j]for j in p)==value
 out=sum(v for a,b,v in pairs)/2;assert sum(weights.values())==out;return out,{'allActualRouteEdgeIndexLists':allpaths,'allActualEdgeRouteMultiplicities':[frequencies[j]for j in range(len(edges))],'positiveFeasibleWeightsFromActualDistanceEquations':{str(j):str(v)for j,v in weights.items()},'allFiveDistancesReplayedByPositiveWeightWitness':True,'allSevenTreeEdgesCountedExactlyTwice':True}
def marker(root,key):
 d=ids(root);frame=d[key+'-frame'];cx,cy=node(frame);rad=F(frame.attrib['r']);assert rad>0;filled=d[key+'-filled'];blue=node(filled);ps=M.points(d[key+'-outline']);assert len(ps)==4;white=tuple(sum(p[j]for p in ps)/4 for j in range(2));assert filled.attrib['fill']=='#3978d1' and d[key+'-outline'].attrib['fill']=='#fff';assert F(filled.attrib['r'])>0
 expected=[(white[0],white[1]-5),(white[0]+5,white[1]),(white[0],white[1]+5),(white[0]-5,white[1])]
 for a,b in zip(ps,expected):near(a[0],b[0]);near(a[1],b[1])
 result=[]
 for role,p in[('filled',blue),('outline',white)]:
  ray=M.segment(d[key+'-ray-'+role]);near(ray[0],cx);near(ray[1],cy);near(ray[2],p[0]);near(ray[3],p[1]);near(math.dist((cx,cy),p),float(rad)*0.9);angle=(math.degrees(math.atan2(float(p[1]-cy),float(p[0]-cx)))+90)%360;idx=round(angle/45)%8;near(min(abs(angle-idx*45),360-abs(angle-idx*45)),0);result.append(idx)
 assert result[0]!=result[1];return tuple(result),(cx,cy)
def matrix_target(cells,choices):
 blue=set();white=set()
 for row in cells:
  assert len(row)in[2,3]
  for a,b in zip(row,row[1:]):blue.add((b[0]-a[0])%8);white.add((b[1]-a[1])%8)
 bs,ws=one(blue),one(white);assert bs==7 and ws==1;last=cells[2][-1];wanted=((last[0]+bs)%8,(last[1]+ws)%8);out=one(k for k,v in choices.items()if v==wanted);assert len(set(choices.values()))==5;return out,{'allActualKnownMarkerDirectionPairs':cells,'allFiveActualOptionDirectionPairs':choices,'uniqueCommonBlueWhiteDirectionStepsModulo8':[bs,ws],'requiredNextBlueWhiteDirections':wanted}
def solve(r,i,src=False,data=None):
 s=r['statement'];p={}
 if src:
  manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(r['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p['sourceRasterSHA256']=asset['sha256'];p['sourceIncidencesAndMarkerLocationsVisuallyReadNotAutomatedRasterExtraction']=True
 else:root=W.svg(r,data);d=ids(root)
 if i==33:
  volume=one(H.numeric_tokens(s));assert volume>0
  if src:out=volume*F(3,4);p['sourceFourEqualTerminalStreamsThreeToY']=True
  else:
   nodes,edges=native_graph(root,'flow-node-','flow-edge-');indeg=collections.Counter(b for a,b in edges);children=collections.defaultdict(list)
   for a,b in edges:assert nodes[b][1]>nodes[a][1];children[a].append(b)
   start=one(k for k in nodes if indeg[k]==0);assert all(indeg[k]==1 for k in nodes if k!=start);assert all(len(v)==2 for v in children.values());flows={start:F(1)};todo=[start]
   while todo:
    k=todo.pop()
    if k in children:
     for nxt in children[k]:assert nxt not in flows;flows[nxt]=flows[k]/2;todo.append(nxt)
   assert set(flows)==set(nodes);leaves=[k for k in nodes if k not in children];assert len(leaves)==8;totals=collections.defaultdict(F);destinations={}
   for k in leaves:
    label=d['destination-'+k];dest=label.text;assert dest in['X','Y']and F(label.attrib['x'])==nodes[k][0]and F(label.attrib['y'])>nodes[k][1];totals[dest]+=flows[k];destinations[k]=dest
   assert sum(totals.values())==1 and all(flows[k]==F(1,8)for k in leaves);out=volume*totals['Y'];p.update({'actualAllLeafFlows':{k:str(flows[k])for k in leaves},'actualAllLeafDestinations':destinations,'actualBothBucketFractions':{k:str(v)for k,v in totals.items()},'allActualBinaryEdgesDirectedAndMassConserved':True})
 elif i==45:
  if src:
   pairs=[(a,b,F(v))for a,b,v in re.findall(r'([A-E]) үйінен ([A-E]) үйіне дейін[^\d]*?(\d+) м',s)];nodes=set('ABCDEUVW');edges=[('A','U'),('U','V'),('V','W'),('W','E'),('U','B'),('V','C'),('W','D')]
  else:
   pairs=[(a,b,F(v))for a,b,v in re.findall(r'([A-E])–([A-E]) — (\d+) м',s)];nodes,edges=native_graph(root,'road-node-','road-')
   for k in'ABCDE':assert d['road-label-'+k].text==k
  assert len(pairs)==5 and len(nodes)==8 and len(edges)==7;out,proof=road_paths(nodes,edges,pairs);p.update(proof)
 elif i==48:
  if src:cells=[[(2,4),(1,5),(0,6)],[(7,0),(6,1),(5,2)],[(4,3),(3,4)]];choices={'A':(4,3),'B':(2,5),'C':(2,3),'D':(5,2),'E':(4,2)}
  else:
   assert H.numeric_tokens(s)==[45,45];cells=[[marker(root,f'cell-{a}-{b}')[0]for b in range(2 if a==2 else 3)]for a in range(3)];choices={k:marker(root,k)[0]for k in'ABCDE'}
   for k in'ABCDE':center=marker(root,k)[1];label=d['option-label-'+k];assert label.text==k and F(label.attrib['x'])==center[0]and F(label.attrib['y'])>center[1]
  out,proof=matrix_target(cells,choices);p.update(proof)
 else:raise AssertionError(i)
 p['target']=str(out)
 if i==48:assert B.options(r)==list('ABCDE')and r['answer']==out
 else:p.update(B.checked_choices(r,out))
 return p

def shift(el,dx,dy):
 for k in['cx','x1','x2']:
  if k in el.attrib:el.set(k,str(float(F(el.attrib[k])+dx)))
 for k in['cy','y1','y2']:
  if k in el.attrib:el.set(k,str(float(F(el.attrib[k])+dy)))
 if'points'in el.attrib:el.set('points',' '.join(f'{float(x+dx)},{float(y+dy)}'for x,y in M.points(el)))
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer']
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  cr=copy.deepcopy(r);root=W.svg(r);d=ids(root)
  if i==33:d['destination-8'].text='X';new='200'
  elif i==45:cr['statement']=cr['statement'].replace('A–B — 45 м','A–B — 55 м');new='250'
  else:
   ga,gb=d['option-D'],d['option-E'];a,b=copy.deepcopy(list(ga)),copy.deepcopy(list(gb));ac=node(d['D-frame']);bc=node(d['E-frame'])
   for dest,original,dx,dy in[(ga,b,ac[0]-bc[0],ac[1]-bc[1]),(gb,a,bc[0]-ac[0],bc[1]-ac[1])]:
    for de,old in zip(list(dest),original):
     ident=de.attrib['id'];de.attrib.clear();de.attrib.update(old.attrib);de.set('id',ident);shift(de,dx,dy)
   new='E'
  raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest()
  if i!=48:delta=F(new)-F(proof['target']);cr['options']=[str(B.scalar(v)+delta)for v in cr['options']]
  for bad,bs in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,False,bs)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  changed=solve({**cr,'answer':new},i,False,raw);proof['validUpdatedHashActualRelationOrDistanceTarget']=changed['target'];badroot=W.svg(r);dd=ids(badroot)
  if i==33:el=dd['flow-edge-0-1'];el.set('x2',str(F(el.attrib['x2'])+1))
  elif i==45:el=dd['road-A-U'];el.set('x2',str(F(el.attrib['x2'])+1))
  else:el=dd['D-filled'];el.set('cx',str(F(el.attrib['cx'])+1))
  bs=ET.tostring(badroot)
  try:solve({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,False,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedActualRelationRejected']=True
  else:raise AssertionError(('malformedrelationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newconditions solutions/all15source/newchoices/sourcebitmaps/343pxPNGs read. ActualSVGflowedges/nodecoordinates/leaflabels decoded withbinaryDAG/fractionmassconservation; roadtreepaths yield2eachactualedge andactual5distanceequationsyieldpositivefeasible7weightwitness; actualall26tokenpositions/rays decode8directions andcommonrowincrements. Updatedhashchangedactualleafdestination/distance/candidategeometryswap rejectoldkeysandacceptrecomputedtargets. Malformededge/markerendpointsrejectevenupdatedhash. Sourcevisualauditnotautomatedrastergeometryclaim. Sameauthornotanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OwnnativeSVGactualgraphs/markercoordinateschecked;343pxPNGinspected;nosourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'nativeFigures':3,'validUpdatedHashActualRelationsOrInputTargetsRecomputed':3,'updatedHashMalformedRelationsRejected':3,'allActualMarkerTokenPositionsDecoded':26,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
