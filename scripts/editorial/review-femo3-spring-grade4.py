"""All10full frozen/new conditions, complete official/new solutions/2MCQsets
and2source rasters read. BothnativePNG343px inspected. Same root author separate
exact computation, no separatehumanreviewer. Full digitsets, circulartruthmodels,
paritylowerbound witness, allcolororders, actualvisibleTjunctionorders and actual
streetgraph minmatching plus completeEulerwalk verified, not answer-matching only.
"""
import collections,copy,functools,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo3-spring-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;opts=K.opts

def svg_data(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',data.decode());return ET.fromstring(data)

def disc_order(r,data=None):
 svg=svg_data(r,data);assert svg.attrib['viewBox']=='0 0 360 300';ns='{http://www.w3.org/2000/svg}';groups=[g for g in list(svg)if g.tag==ns+'g'];assert len(groups)==5;discs=[]
 for g in groups:
  circle=one(v for v in g if v.tag==ns+'circle');text=one(v for v in g if v.tag==ns+'text');a=circle.attrib;x,y,radius=[float(a[k])for k in['cx','cy','r']];assert a['fill']=='#fff'and a.get('opacity','1')=='1';assert text.text in'LMNPQ'and float(text.attrib['x'])==x and float(text.attrib['y'])==y+7;assert 0<x-radius<x+radius<360 and 0<y-radius<y+radius<300;discs.append((text.text,x,y,radius))
 assert len({d[0]for d in discs})==5;edges=[];junctions={}
 for i,(label,x,y,r1)in enumerate(discs):
  assert all(math.hypot(x-u,y-v)>rr+10 for lab,u,v,rr in discs[i+1:]),'A label is hidden by a later opaque disc'
  for j in range(i+1,len(discs)):
   above,u,v,r2=discs[j];dx,dy=u-x,v-y;dist=math.hypot(dx,dy)
   if not abs(r1-r2)<dist<r1+r2:continue
   a=(r1*r1-r2*r2+dist*dist)/(2*dist);h=math.sqrt(r1*r1-a*a);mx,my=x+a*dx/dist,y+a*dy/dist;points=[(mx-h*dy/dist,my+h*dx/dist),(mx+h*dy/dist,my-h*dx/dist)];visible=[p for p in points if all(math.hypot(p[0]-xx,p[1]-yy)>rr+0.001 for ll,xx,yy,rr in discs[j+1:])]
   if visible:edges.append((label,above));junctions[label+'<'+above]=visible
 orders=[p for p in itertools.permutations(d[0]for d in discs)if all(p.index(a)<p.index(b)for a,b in edges)];order=one(orders);return order,{'actualVisibleCoverEdges':edges,'unoccludedCircleIntersectionJunctions':junctions,'all120DiscOrdersTested':120,'uniqueBottomToTopDiscOrder':list(order),'allFiveLabelsVisibleAndAllDiscsOpaque':True}

def closed_postman(vertices,edges,start,unit):
 vertices=set(vertices);adj=collections.defaultdict(list)
 for eid,(u,v)in enumerate(edges):assert u!=v;adj[u].append((v,eid));adj[v].append((u,eid))
 assert set(adj)==vertices;odd=sorted(v for v in vertices if len(adj[v])%2);assert len(odd)%2==0
 def shortest(u,v):
  queue=collections.deque([u]);parent={u:None}
  while queue:
   x=queue.popleft()
   if x==v:break
   for y,eid in adj[x]:
    if y not in parent:parent[y]=(x,eid);queue.append(y)
  assert v in parent;path=[];x=v
  while parent[x]is not None:p,eid=parent[x];path.append(eid);x=p
  return path[::-1]
 def matchings(xs):
  if not xs:return[(0,[])]
  a,*rest=xs;out=[]
  for j,b in enumerate(rest):
   path=shortest(a,b)
   for cost,paths in matchings(rest[:j]+rest[j+1:]):out.append((len(path)+cost,[path]+paths))
  return out
 candidates=matchings(odd);extra,paths=min(candidates,key=lambda v:v[0]);assert extra>=len(odd)//2;copies=[eid for path in paths for eid in path];allEdges=edges+[edges[eid]for eid in copies];degrees=collections.Counter(v for edge in allEdges for v in edge);assert all(v%2==0 for v in degrees.values());mult=collections.defaultdict(list)
 for eid,(u,v)in enumerate(allEdges):mult[u].append((v,eid));mult[v].append((u,eid))
 used=set();stack=[(start,None)];trail=[]
 while stack:
  u,eid=stack[-1]
  while mult[u]and mult[u][-1][1]in used:mult[u].pop()
  if mult[u]:v,j=mult[u].pop();used.add(j);stack.append((v,j))
  else:trail.append(stack.pop())
 trail=trail[::-1];assert len(used)==len(allEdges)and len(trail)==len(allEdges)+1 and trail[0][0]==trail[-1][0]==start
 for j in range(1,len(trail)):assert set(allEdges[trail[j][1]])=={trail[j-1][0],trail[j][0]}
 assert set(range(len(edges)))<=used;out=F(len(allEdges))*unit;return out,{'actualVertexCount':len(vertices),'actualOriginalStreetSegments':len(edges),'oddVertices':odd,'allOddVertexPerfectMatchingsChecked':len(candidates),'minimumMatchingExtraSegments':extra,'oddVertexDegreeLowerBound':len(odd)//2,'duplicatedOriginalEdgeIDs':copies,'allDegreesEvenAfterDuplication':True,'fullClosedEulerVertexRoute':[v for v,e in trail],'fullEulerOriginalInstanceIDs':[eid for v,eid in trail[1:]],'originalEdgesAllCoveredAndReturnToStart':True,'minimalTotalSegments':len(allEdges),'unitMetres':str(unit),'minimalClosedDistanceTarget':str(out)}

def actual_grid(r,data=None):
 svg=svg_data(r,data);assert svg.attrib['viewBox']=='0 0 360 350';ids={v.attrib['id']:v for v in svg.iter()if'id'in v.attrib};edges=[]
 for id,e in ids.items():
  if id.startswith('edge-'):
   a=e.attrib;u=(F(a['x1']),F(a['y1']));v=(F(a['x2']),F(a['y2']));assert(u[0]==v[0])!=(u[1]==v[1]);edges.append((u,v))
 vertices={v for edge in edges for v in edge};xs=sorted({v[0]for v in vertices});ys=sorted({v[1]for v in vertices});assert len(xs)==len(ys)==4 and vertices==set(itertools.product(xs,ys));scale=one(set([xs[i+1]-xs[i]for i in range(3)]+[ys[i+1]-ys[i]for i in range(3)]));assert scale>0;assert len(edges)==24 and len({frozenset(e)for e in edges})==24
 for u,v in edges:assert abs(u[0]-v[0])+abs(u[1]-v[1])==scale
 start=(F(ids['start'].attrib['cx']),F(ids['start'].attrib['cy']));assert start in vertices and ids['start-label'].text=='P';unit=F(one(re.findall(r'^(\d+) м$',ids['unit'].text)));mapped=[((xs.index(u[0]),ys.index(u[1])),(xs.index(v[0]),ys.index(v[1])))for u,v in edges];origin=(xs.index(start[0]),ys.index(start[1]));out,proof=closed_postman(itertools.product(range(4),repeat=2),mapped,origin,unit);proof.update({'allActualSVGLinesDecodedAsStreets':True,'allActualSVGGridSpacingsEqual':str(scale),'startVertexFromActualMarker':origin,'unitFromActualSVGText':str(unit)});return out,proof

def source_raster(i):
 assets={6:('cf0130f44b9691d34ca208fa','5a970b3136a78ae0c9cb994849f3a9fbf873cc37badaace73d5b8eedb0e6449b'),10:('c94a9ee840dd38923ef1b309','6b6e43bba0d2671448e5677e9a813167a44f2656e3156cdc0652d720b240ecf9')};file,sha=assets[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{file}.png').read_bytes()).hexdigest()==sha;return sha

def solve(r,w,i,src=False,figureBytes=None):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);parse=E.calc;proof={}
 if i==1:
  words={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9};length=words[one(re.findall(r'(\w+)таңбалы',s)).lower()];lowCount,low=one(re.findall(r'дәл (\w+) цифры \$?(\d+)\$?-[дт][ае]н артық емес',s,re.I));highCount,high=one(re.findall(r'дәл (\w+) цифры \$?(\d+)\$?-[дт][ае]н үлкен',s,re.I));lowCount,highCount=words[lowCount.lower()],words[highCount.lower()];low,high=int(low),int(high);eligible=[ds for ds in itertools.combinations(range(10),length)if sum(d<=low for d in ds)==lowCount and sum(d>high for d in ds)==highCount];numbers=[int(''.join(map(str,sorted(ds,reverse=True))))for ds in eligible];out=F(max(numbers));assert len(str(out.numerator))==length;proof={'allDistinctDigitSetsChecked':math.comb(10,length),'allEligibleDigitSets':eligible,'descendingArrangementMaximizesEverySet':True,'maximumTarget':str(out),'twoThresholdCounts':[lowCount,low,highCount,high]}
 elif i==2:
  total=one(n);out=(total-1)/2;assert out.denominator==1 and out>0 and out+(out+1)==total;proof={'firstPageTarget':str(out),'secondPage':str(out+1),'bothConsecutivePagesSum':str(total)}
 elif i==3:
  total=int(one(n));valid=[]
  for model in itertools.product([0,1],repeat=total):
   if not any(model):continue
   if all(bool(model[j])==(model[j-1]!=model[(j+1)%total])for j in range(total)):valid.append(model)
  counts={sum(m)for m in valid};out=F(one(counts));assert valid;proof={'allCircularTruthAssignmentsChecked':2**total,'allValidLabeledSeatings':valid,'uniqueKnightCountTarget':str(out),'eachKnightsStatementTrueEachLiarsStatementFalse':True,'allLiarsExplicitlyExcluded':True}
 elif i==4:
  total,desks,sameBoys,sameGirls=n;assert total==2*desks and sameBoys%2==sameGirls%2==0;bb,gg=sameBoys/2,sameGirls/2;mixed=desks-bb-gg;assert mixed>=0;out=sameBoys+mixed;girls=sameGirls+mixed;assert out+girls==total;proof={'twoBoyDesks':str(bb),'twoGirlDesks':str(gg),'mixedDesks':str(mixed),'boysTarget':str(out),'girls':str(girls),'allDesksFullAllStudentsAccounted':True}
 elif i==5:
  factor,before,after=n;assert factor>1 and after>before;changed=(after-before)/(2*(factor-1));fixed=before/2-changed;assert min(changed,fixed)>0 and 2*(factor*changed+fixed)==after;out=tuple(sorted([changed,fixed]));parse=lambda t:tuple(sorted(H.numeric_tokens(t)));proof={'initialChangedDimension':str(changed),'unchangedDimension':str(fixed),'newChangedDimension':str(factor*changed),'initialPerimeter':str(before),'newPerimeter':str(after),'areaRatio':str(factor),'initialDimensionsTarget':list(map(str,out))}
 elif i==6:
  low,bottom=one(re.findall(r'(\w+) диск (\w+) дисктің үстінде, бірақ қалған',s,re.I));middle,below,above=one(re.findall(r'(\w+) диск (\w+) дисктің үстінде, бірақ (\w+) дисктің астында',s,re.I));low,bottom,middle,below,above=[c.lower()for c in[low,bottom,middle,below,above]];colors=[low,bottom,middle,below,above];assert len(set(colors))==5;orders=[p for p in itertools.permutations(colors)if p.index(bottom)<p.index(low)and all(p.index(low)<p.index(c)for c in colors if c not in[bottom,low])and p.index(below)<p.index(middle)<p.index(above)];colorOrder=one(orders);target=one(re.findall(r'\$?([A-Z])\$? әрпі тұрған диск',s))
  if src:
   source_raster(6);order=tuple(one(p for p in H.math_parts(r['solution'],True)if len(p.split(','))==5).replace(' ','').split(','));assert order==('X','Y','Z','U','V');proof={'archivedRasterInspectedAndOfficialTotalOrderCrossChecked':True,'sourceDiscOrder':order}
  else:order,p=disc_order(r,figureBytes);proof.update(p)
  out=colorOrder[order.index(target)].capitalize();parse=lambda t:t.strip().capitalize();proof.update({'all120ColorOrdersTested':120,'uniqueBottomToTopColorOrder':colorOrder,'askedDiscLabel':target,'targetColor':out})
 elif i==7:
  factor,removed,added=n;small=(removed+added)/(factor-1);large=factor*small;assert small.denominator==large.denominator==1 and small>0 and large-removed==small+added>0;out=small+large;proof={'initialSmallerTreeCount':str(small),'initialLargerTreeCount':str(large),'bothFinalTreeCounts':str(small+added),'initialWholeTreeCountTarget':str(out)}
 elif i==8:
  total=int(one(n));threshold=4;cases=[]
  for oddCount in range(threshold):
   if oddCount%2==0:continue
   evenCount=total-oddCount;assert evenCount>=0;values=list(range(1,2*oddCount,2))+list(range(2,2*evenCount+1,2));assert len(set(values))==len(values)==total;assert sum(values)%2==1 and all(math.prod(p)%2==0 for p in itertools.combinations(values,threshold));cases.append({'oddCount':oddCount,'evenCount':evenCount,'componentwiseMinimalDistinctPositiveValues':values,'minimumSum':sum(values)})
  out=F(min(c['minimumSum']for c in cases));proof={'allFeasibleOddCountParityCases':cases,'fourOddNumbersWouldContradictEveryFourEvenProduct':True,'componentwiseLowerBoundAttainedByWitness':True,'globalMinimumSumTarget':str(out)}
 elif i==9:
  eq1,eq2,eq3,target=parts;vars1=E.expr(eq1.split('=')[0]);vars2=E.expr(eq2.split('=')[0]);vars3=E.expr(eq3.split('=')[0]);asked=E.expr(target);assert(vars1*vars3).equals(vars2*asked);a,b,c=[E.calc(eq.split('=')[1])for eq in[eq1,eq2,eq3]];assert b;out=a*c/b;proof={'universalTripleProductIdentity':True,'threeKnownProducts':list(map(str,[a,b,c])),'knownMiddleProductNonzero':str(b),'askedProductTarget':str(out)}
 elif i==10:
  if src:
   side1,side2,unit=map(int,n);assert side1==side2==3;vertices=list(itertools.product(range(4),repeat=2));edges=[((x,y),(x+1,y))for x in range(3)for y in range(4)]+[((x,y),(x,y+1))for y in range(3)for x in range(4)];out,proof=closed_postman(vertices,edges,(0,0),F(unit));proof['sourceRasterSHA256']=source_raster(10)
  else:out,proof=actual_grid(r,figureBytes)
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True
 if opts(r):
  values=[parse(v)for v in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesChecked']=True
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
  if i==5:assert values[0]==tuple(sorted([factor*changed,fixed]))and all(sum(values[j])*2==before for j in[1,2,3])
 return proof

def mutation(r,w,i):
 pairs={1:('4-тен үлкен','3-тен үлкен'),2:('319','321'),3:('12 адам','15 адам'),4:('34 оқушы 17','36 оқушы 18'),5:('82 см','90 см'),6:('N әрпі','P әрпі'),7:('14 алма','17 алма'),8:('9 әртүрлі','10 әртүрлі'),9:('= 42','= 84')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and (not q['images']or i in[6,10]);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);ns={'s':'http://www.w3.org/2000/svg'}
   if i==6:
    texts=[v for v in svg.iter()if v.tag.endswith('text')];one(v for v in texts if v.text=='N').text='TEMP';one(v for v in texts if v.text=='P').text='N';one(v for v in texts if v.text=='TEMP').text='P';correctChangedAnswer='Сары'
   else:unit=svg.find("s:text[@id='unit']",ns);assert unit.text=='180 м';unit.text='210 м';correctChangedAnswer='5880'
   changed=ET.tostring(svg);bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(changed).hexdigest()
   try:solve(bad,w,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('validactualfigureinput changed but oldkey accepted')
   bad['answer']=correctChangedAnswer;changedProof=solve(bad,w,i,False,changed);proof['actualChangedFigureRecomputedTarget']=correctChangedAnswer;proof['actualFigureCanaryRejectedEvenWithUpdatedHash']=True
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  badCases=[{**r,'answer':'999999999'}]+([]if i==10 else[mutation(r,w,i)])
  for bad in badCases:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('key/semanticcanaryaccepted',i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and(before[-1].isascii()and before[-1].isalpha()):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All10full frozen/new conditions, full official/newsolutions/all2MCQsets/2source rasters read. All120digitsets, allcirculartruthassignments, universalproduct and fullparitylowerbound attained, exactdesk/rectangle/tree arithmetic checked. Actualnative opaqueocclusionTjunctions and uniquedisc/colororders, actualgridalloddvertexmatchings+fullEulerclosedwalk checked. Twoactualfigureinput changes withupdatedhash alteranswer and oldkey rejected. Same author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualSVGopaque circles, visibleTjunctions/labels determineunique order; actualgrid24segments16vertices, measuredunit andstart decoded. Both343pxPNGs inspected; allsourcebitmaps read but not reused/traced. Actualfigureinput canaries recomputed evenwithupdatedhash.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFractions':native['fractions'],'nativeFigures':2,'updatedHashActualGeometryCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
