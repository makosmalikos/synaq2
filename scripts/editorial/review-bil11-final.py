"""Last5 BIL11 tasks: full frozen/new conditions official/new solutions all20
source/new choices, four source rasters and four own343px native PNGs read.
Actual native geometry and native table cells drive recomputation. Source art
not reused or traced. Same author separate computation, not another human reviewer.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil11-final';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,path):
 s=importlib.util.spec_from_file_location(n,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-bil7-native-plane.py');J=module('j','scripts/editorial/review-bil8-nonvisual.py');M=A.M;B=A.B;H=A.H;E=A.E;one=A.one;W=A.W;ids=A.ids;points=A.points;segment=A.segment;P=A.P;sub=A.sub;dot=A.dot;cross=A.cross;near=A.near;G=J.J.G

def table_cells(s,src=False):
 if src:
  body=one(re.findall(r'\\begin\{array\}\{[^}]+\}(.*?)\\end\{array\}',s,re.S));body=re.sub(r'\\hline|\\phantom\{\d+\}','',body);rows=[v.strip()for v in re.split(r'\\\\',body)if v.strip()];cells=[[v.strip()for v in row.split('&')]for row in rows]
 else:
  lines=[v for v in s.splitlines()if v.startswith('|')];assert len(lines)==8;cells=[[v.strip()for v in line.strip().strip('|').split('|')]for line in lines[2:]]
 assert len(cells)==6 and all(len(row)==6 for row in cells);return cells

def table_target(s,src=False):
 cells=table_cells(s,src);start=F(cells[0][0]);missing=[];reconstructed=[]
 for rr,row in enumerate(cells):
  expected=['']*6;offset=rr%2
  for j in range(5):expected[offset+j]=str(start+5*rr+j)
  for cc,value in enumerate(row):
   if value=='?':assert expected[cc];missing.append((rr,cc,F(expected[cc])))
   elif value:assert expected[cc]and F(value)==F(expected[cc])
  assert all(not v for cc,v in enumerate(row)if not expected[cc]);reconstructed.append(expected)
 rr,cc,out=one(missing);return out,{'allActualNativeOrSourceTableCells':cells,'allSixReconstructedConsecutiveOffsetRows':reconstructed,'actualQuestionMarkRowColumnOneBased':[rr+1,cc+1]}

def regular(ps):
 assert len(ps)>=3 and len(set(ps))==len(ps);center=tuple(sum(v[k]for v in ps)/len(ps)for k in range(2));radii=[dot(sub(v,center),sub(v,center))for v in ps];edges=[dot(sub(a,b),sub(a,b))for a,b in zip(ps,ps[1:]+ps[:1])]
 for v in radii:near(v,radii[0])
 for v in edges:near(v,edges[0])
 turns=[cross(sub(b,a),sub(c,b))for a,b,c in zip(ps,ps[1:]+ps[:1],ps[2:]+ps[:2])];assert all(v>0 for v in turns)or all(v<0 for v in turns);return center

def polygon_majority(root):
 d=ids(root);counts=[]
 for j in range(5):
  outer=points(d[f'outer-{j}']);inner=points(d[f'inner-{j}']);a,b=regular(outer),regular(inner);near(a[0],b[0]);near(a[1],b[1]);edges=list(zip(outer,outer[1:]+outer[:1]));sign=1 if cross(sub(edges[0][1],edges[0][0]),sub(a,edges[0][0]))>0 else -1;assert all(sign*cross(sub(v,u),sub(p,u))>0 for u,v in edges for p in inner);assert d[f'figure-label-{j}'].text==str(j+1);counts.append((len(outer),len(inner)))
 diffs=[a-b for a,b in counts];mode,count=collections.Counter(diffs).most_common(1)[0];assert count==4;out=F(one(j+1 for j,v in enumerate(diffs)if v!=mode));return out,{'allActualNestedRegularPolygonSideCounts':[list(v)for v in counts],'allActualInnerVerticesStrictlyContained':True,'uniqueFourOfFiveMajoritySideDifference':mode}

def graph_target(r,root):
 d=ids(root);ys=[];xs=[]
 for j in range(7):
  a,b,c,e=segment(d[f'grid-y-{j}']);label=d[f'value-y-{j}'];assert b==e and F(label.attrib['y'])==b+5;ys.append((F(label.text),b,a,c))
 for j in range(6):
  a,b,c,e=segment(d[f'grid-x-{j}']);label=d[f'value-x-{j}'];assert a==c and F(label.attrib['x'])==a;xs.append((F(label.text),a,b,e))
 xorigin=xs[0][1];torigin=xs[0][0];ybase=one(v[1]for v in ys if v[0]==0);ux=one({(x-xorigin)/(t-torigin)for t,x,b,e in xs if t!=torigin});uy=one({(ybase-y)/v for v,y,a,c in ys if v});assert ux>0 and uy>0
 assert all(x==xorigin+(t-torigin)*ux and b==ys[-1][1]and e==ybase for t,x,b,e in xs);assert all(y==ybase-v*uy and a==xs[0][1]and c==xs[-1][1]for v,y,a,c in ys);ps=points(d['distance-graph']);assert len(ps)==6;actual=[]
 for j,(x,y)in enumerate(ps):
  node=d[f'graph-node-{j}'];assert F(node.attrib['cx'])==x and F(node.attrib['cy'])==y;actual.append((torigin+(x-xorigin)/ux,(ybase-y)/uy))
 assert all(a[0]<b[0]and a[1]<=b[1]for a,b in zip(actual,actual[1:]));clocks=re.findall(r'\d{1,2}:\d{2}',r['statement']);assert len(clocks)==2;start,end=[J.N.clock(v)/60 for v in clocks];assert start<end;lo=one(s for t,s in actual if t==start);hi=one(s for t,s in actual if t==end);out=(hi-lo)/(end-start);return out,{'allActualCalibratedTimeDistanceNodes':[list(map(str,v))for v in actual],'bothAxesCommonScaleAndAllGridlinesVerified':True,'actualAskedTimeEndpoints':list(map(str,[start,end])),'actualDistanceDifferenceAndHours':list(map(str,[hi-lo,end-start]))}

def exact_cube_root(value):
 assert value>0 and value.denominator==1;candidate=1
 while candidate**3<value:candidate+=1
 assert candidate**3==value;return F(candidate)

def sector_target(r,root):
 d=ids(root);O=tuple(F(d['outer-circle'].attrib[k])for k in['cx','cy']);radius=F(d['outer-circle'].attrib['r']);assert radius==140;labels=[];centers=[];framed=[]
 for j in range(4):
  a,b,c,e=segment(d[f'diameter-{j}']);assert(a+c,b+e)==tuple(2*v for v in O);theta=math.radians(-90+45*j);near(a,O[0]+140*math.cos(theta));near(b,O[1]+140*math.sin(theta));near((a-O[0])**2+(b-O[1])**2,radius**2)
 for j in range(8):
  el=d[f'sector-value-{j}'];x,y=F(el.attrib['x']),F(el.attrib['y'])-6;theta=math.radians(-67.5+45*j);near(x,O[0]+95*math.cos(theta));near(y,O[1]+95*math.sin(theta));centers.append((x,y));labels.append(el.text);framed.append(f'output-frame-{j}'in d)
  if framed[-1]:a,b,w,h=M.rect(d[f'output-frame-{j}']);assert w==54 and h==36;near(a+w/2,x);near(b+h/2,y)
 known=[];unknown=[]
 for j in range(4):
  near(centers[j][0]+centers[j+4][0],2*O[0]);near(centers[j][1]+centers[j+4][1],2*O[1]);assert framed[j]!=framed[j+4];output,input=(labels[j],labels[j+4])if framed[j]else(labels[j+4],labels[j]);value=F(output)
  if re.fullmatch(r'\d+',input):known.append((F(input),value))
  else:unknown.append((input,value))
 constant=one({b-a**3 for a,b in known});assert len(known)==len(unknown)==2;rows=[]
 for expr,value in unknown:
  rootvalue=exact_cube_root(value-constant);co,c=E.affine(expr,('x','y'));rows.append([*co,rootvalue-c])
 x,y=G.gaussian(rows,2);assert x>0 and y>0 and x.denominator==y.denominator==1;env={'x':x,'y':y};assert all(E.expr(expr).value(env)**3+constant==v for expr,v in unknown);asked=one(H.math_parts(r['statement'],False));out=E.expr(asked).value(env);return out,{'allActualClockwiseSectorValues':labels,'allActualFramedOutputFlags':framed,'allEightPositionsAndFourOppositeDiameterPairsChecked':True,'actualUniqueCommonCubeAddend':str(constant),'positiveIntegerXY':list(map(str,[x,y])),'allFourOppositeRulesReplayed':True}

def solve(r,i,data=None):
 if i==35:out,p=table_target(r['statement'])
 else:
  root=W.svg(r,data);d=ids(root)
  if i==14:out,p=graph_target(r,root)
  elif i==29:out,p=polygon_majority(root)
  elif i==38:
   x,y,xx,yy=segment(d['horizontal-0']);unit=(xx-x)/9;assert y==yy and unit>0
   for j in range(10):assert segment(d[f'vertical-{j}'])==(x+j*unit,y,x+j*unit,y+9*unit)and segment(d[f'horizontal-{j}'])==(x,y+j*unit,x+9*unit,y+j*unit)
   ps=points(d['shaded']);grid=[((a-x)/unit,9-(b-y)/unit)for a,b in ps];assert len(grid)==4 and all(a.denominator==b.denominator==1 and 0<a<9 and 0<b<9 for a,b in grid);A,Bp,C,D=grid;assert A[1]==Bp[1]and Bp[0]==C[0]and A[0]<D[0]<Bp[0]and A[1]<D[1]<C[1];side=one(H.numeric_tokens(r['statement']));assert side>0;out=P.area(grid)*side**2;triangle=(D[0]-A[0])*(D[1]-A[1])/2;trap=(Bp[0]-D[0])*((D[1]-A[1])+(C[1]-Bp[1]))/2;assert out==(triangle+trap)*side**2
   for label,point in zip('ABCD',ps):el=d['label-'+label];assert el.text==label and(F(el.attrib['x'])-point[0])**2+(F(el.attrib['y'])-point[1])**2<30**2
   p={'allTwentyGridLinesAndFourLatticeVerticesChecked':True,'actualLatticeVertices':[list(map(str,v))for v in grid],'actualTriangleAndTrapezoidUnitAreas':list(map(str,[triangle,trap])),'shoelaceEqualsIndependentTwoPieceArea':True}
  else:out,p=sector_target(r,root)
 opts=B.options(r);vals=list(map(B.scalar,opts));assert len(opts)==len(set(opts))==4 and len(set(vals))==4 and vals.count(out)==1 and B.scalar(r['answer'])==out and r['answer']in opts;p['allFourActualOptionValues']=list(map(str,vals));p['target']=str(out);return p

def source(q,i):
 if i==35:out,p=table_target(q['statement'],True)
 else:
  manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p={'sourceRasterSHA256':asset['sha256'],'sourceAllGivensAndTopologyVisuallyReadNotTraced':True}
  if i==14:
   nodes=[[10,0],[11,4],[12,10],[13,12],[14,13],[15,16]];out=F(nodes[3][1]-nodes[0][1],nodes[3][0]-nodes[0][0]);p['sourceCalibratedNodes']=nodes
  elif i==29:counts=[[5,4],[7,6],[6,5],[7,5],[4,3]];diffs=[a-b for a,b in counts];out=F(one(j+1 for j,v in enumerate(diffs)if v!=1));p['sourceOuterInnerSideCounts']=counts
  elif i==38:
   ps=[(F(0),F(0)),(F(6),F(0)),(F(6),F(6)),(F(2),F(4))];out=P.area(ps);assert out==2*4/2+(4+6)*4/2;p['sourceRelativeLatticeVertices']=[list(map(str,v))for v in ps]
  else:
   constant=one({28-3**3,65-4**3});y=exact_cube_root(F(9-constant));sumxy=exact_cube_root(F(126-constant));x=sumxy-y;out=E.expr(one(H.math_parts(q['statement'],True))).value({'x':x,'y':y});p['sourceOfficialInputOutputRoleConvention']={'knownPairs':[[3,28],[4,65]],'constant':constant,'x':str(x),'y':str(y),'rewriteExplicitFramesClarifyUnknownInputVersusOutputRoles':True}
 vals=[B.scalar(v)for v in B.options(q)];assert vals.count(out)==1 and B.scalar(q['answer'])==out;p['target']=str(out);p['allFourSourceOptionValues']=list(map(str,vals));return p

def changed(r,i):
 cr=copy.deepcopy(r)
 if i==35:
  lines=cr['statement'].splitlines();seen=0
  for j,line in enumerate(lines):
   if not line.startswith('|'):continue
   seen+=1
   if seen>2:lines[j]=re.sub(r'\d+',lambda m:str(int(m[0])+1),line)
  cr['statement']='\n'.join(lines).replace('жол 3 санынан','жол 4 санынан');new=F(31);raw=None
 else:
  root=W.svg(r);d=ids(root)
  if i==14:cr['statement']=cr['statement'].replace('9:00','10:00').replace('12:00','13:00');new=F(4)
  elif i==29:
   for j,sides in[(2,8),(3,6)]:
    ps=points(d[f'outer-{j}']);center=tuple(sum(v[k]for v in ps)/len(ps)for k in range(2));radius=math.hypot(*map(float,sub(ps[0],center)));newps=[(float(center[0])+radius*math.cos(math.radians(-90+360*k/sides)),float(center[1])+radius*math.sin(math.radians(-90+360*k/sides)))for k in range(sides)];d[f'outer-{j}'].set('points',' '.join(f'{x:.9f},{y:.9f}'for x,y in newps))
   new=F(4)
  elif i==38:cr['statement']=cr['statement'].replace('қабырғасы 1 см','қабырғасы 2 см');new=F(104)
  else:d['sector-value-4'].text='66';new=F(8)
  raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest()
 old=B.scalar(r['answer']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']];return cr,raw,str(new)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==5;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==4;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},i);proof=solve(r,i);cr,raw,new=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/change',i))from e
  for bad,data in[({**r,'answer':'INVALID'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,data)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  try:proof['validChangedActualGeometryGivensOrCellsTarget']=solve({**cr,'answer':new},i,raw)['target']
  except Exception as e:raise AssertionError(('validchange',i))from e
  if i==35:
   bad=copy.deepcopy(r);bad['statement']=bad['statement'].replace('| 3 | 4 | 5 | 6 | 7 |','| 3 | 4 | 6 | 6 | 7 |')
   try:solve(bad,i)
   except(AssertionError,ValueError):proof['malformedActualTableCellRejected']=True
   else:raise AssertionError('malformedtableaccepted')
  else:
   root=W.svg(r);d=ids(root)
   if i==14:d['value-y-4'].text='17'
   elif i==29:ps=points(d['inner-2']);ps[0]=(ps[0][0]+1,ps[0][1]);d['inner-2'].set('points',' '.join(f'{x},{y}'for x,y in ps))
   elif i==38:ps=points(d['shaded']);ps[1]=(ps[1][0]+1,ps[1][1]);d['shaded'].set('points',' '.join(f'{x},{y}'for x,y in ps))
   else:d['output-frame-2'].set('x',str(F(d['output-frame-2'].attrib['x'])+1))
   bs=ET.tostring(root)
   try:solve({**r,'figureSha256':hashlib.sha256(bs).hexdigest()},i,bs)
   except(AssertionError,ValueError):proof['updatedHashMalformedActualGeometryRejected']=True
   else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions official/new solutions all20source/newchoices read. Own actual calibrated graph axes/gridlines/nodes/time endpoints, all five nested regular polygon edge counts/strict containment/unique majority, all native and source table cells/reconstructed alternating offsets, lattice polygon and independent triangle-trapezoid area, eight sector positions/framed output roles/opposite pairs/common cube increment and both unknowns independently recomputed. Valid changed actual inputs and malformed geometry/table rejected. Same author computation.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG decoded and checked,343px PNG inspected; no source art reused.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':5,'sourceOptionsRead':20,'rewrittenOptionsRead':20,'nativeFigures':4,'nativeTables':1,'validChangedActualInputsRecomputed':5,'malformedActualGeometryOrTableRejected':5,'pythonJavaScriptHashesMatched':5,'allFortyBIL11TasksCompleteWithOtherBatch':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
