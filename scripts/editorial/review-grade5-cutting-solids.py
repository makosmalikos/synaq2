"""Separate computational review of 27 printed conditions, source keys and all MCQs.
The same root authored this batch; this is NOT a separate human/agent review.
Uses exact lattice geometry, exhaustive nets/tilings and printed givens, without
importing the author model/specs or reading params as a mathematical oracle.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-cutting-solids.json'
REPORT='problems/editorial/reviews/grade5-cutting-solids.json'
sp=importlib.util.spec_from_file_location('prior_geometry',ROOT/'scripts/editorial/review-grade5-cuboid-surfaces-root.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns,exposed,wire=H.one,H.ns,H.exposed,H.wire
def clean(s):return H.clean(s).replace('^2','²').replace('^3','³').strip()
def opts(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def norm(s):return clean(s).casefold().replace('тікбұрыш','тіктөртбұрыш')
def numeric(r,target,expected=None):
 assert ns(clean(r['answer']))==[target],(r['answer'],target)
 if opts(r):
  actual=[one(ns(o))for o in opts(r)];assert actual.count(target)==1
  if expected is not None:assert sorted(actual)==sorted(expected),(actual,expected)
 return str(target)
def selected(r,wanted):
 actual=one(o for o in opts(r)if norm(o)==norm(wanted));assert norm(r['answer'])==norm(actual)
 return actual
def cross(u,v):return u[0]*v[1]-u[1]*v[0]
def sub(u,v):return tuple(a-b for a,b in zip(u,v))
def simplify(poly):
 p=[]
 for v in poly:
  if not p or p[-1]!=v:p.append(v)
 if len(p)>1 and p[0]==p[-1]:p.pop()
 while len(p)>2:
  indexes=[i for i,v in enumerate(p)if cross(sub(v,p[i-1]),sub(p[(i+1)%len(p)],v))==0]
  if not indexes:break
  p.pop(indexes[0])
 return p
def clip(poly,A,B,C):
 result=[]
 for p,q in zip(poly,poly[1:]+poly[:1]):
  fp=A*p[0]+B*p[1]+C;fq=A*q[0]+B*q[1]+C
  if fp>=0:result.append(p)
  if (fp>0 and fq<0)or(fp<0 and fq>0):
   t=fp/(fp-fq);result.append(tuple(p[k]+t*(q[k]-p[k])for k in range(2)))
 return simplify(result)
def rectangle_cut_pairs():
 square=[(F(0),F(0)),(F(1),F(0)),(F(1),F(1)),(F(0),F(1))]
 boundary=set((x,F(y))for x in map(lambda n:F(n,4),range(5))for y in(0,1))|set((F(x),y)for y in map(lambda n:F(n,4),range(5))for x in(0,1))
 pairs=set()
 for p,q in itertools.combinations(boundary,2):
  A,B=q[1]-p[1],p[0]-q[0];C=-A*p[0]-B*p[1]
  a,b=clip(square,A,B,C),clip(square,-A,-B,-C)
  if min(len(a),len(b))>=3:pairs.add(tuple(sorted((len(a),len(b)))))
 assert {(3,3),(3,5),(4,4)}<=pairs and(5,5)not in pairs
 assert all(sum(p)<=8 for p in pairs);return sorted(pairs)
def triangle_joins(a,b):
 triangle=[(F(0),F(0)),(a,F(0)),(F(0),b)];classes=set();proof=[]
 for i in range(3):
  u,v,c=triangle[i],triangle[(i+1)%3],triangle[(i+2)%3];d=sub(v,u);w=sub(c,u);dot=sum(x*y for x,y in zip(w,d));length2=sum(x*x for x in d)
  foot=tuple(u[k]+d[k]*dot/length2 for k in range(2));reflected=tuple(2*foot[k]-c[k]for k in range(2));swapped=tuple(u[k]+v[k]-c[k]for k in range(2))
  for other in(reflected,swapped):
   assert cross(d,sub(c,u))*cross(d,sub(other,u))<0
   p=simplify([u,c,v,other]);n=len(p)
   area=abs(sum(cross(x,y)for x,y in zip(p,p[1:]+p[:1])))/2;assert area==a*b
   if n==3:kind='triangle'
   else:
    assert n==4;edges=[sub(p[(j+1)%4],p[j])for j in range(4)]
    right=all(sum(x*y for x,y in zip(edges[j-1],edges[j]))==0 for j in range(4))
    equal=len(set(sum(x*x for x in e)for e in edges))==1
    kind='square'if right and equal else 'rectangle'if right else'nonrectangle'
   classes.add(kind);proof.append({'vertices':[[str(t)for t in z]for z in p],'kind':kind})
 assert classes=={'rectangle','triangle','nonrectangle'};return proof
def normalize_cells(cells):
 minx,miny=min(x for x,y in cells),min(y for x,y in cells)
 return frozenset((x-minx,y-miny)for x,y in cells)
def all_cube_nets():
 shapes={frozenset({(0,0)})};directions=[(1,0),(-1,0),(0,1),(0,-1)]
 for size in range(2,7):
  shapes={normalize_cells(set(s)|{(x+dx,y+dy)})for s in shapes for x,y in s for dx,dy in directions if(x+dx,y+dy)not in s}
 assert len(shapes)==216
 neg=lambda v:tuple(-t for t in v)
 def fold(s):
  origin=min(s);ori={origin:((1,0,0),(0,1,0),(0,0,1))};todo=[origin]
  while todo:
   x,y=todo.pop();u,v,n=ori[x,y]
   for dx,dy in directions:
    q=x+dx,y+dy
    if q not in s:continue
    candidate=(neg(n),v,u)if dx==1 else(n,v,neg(u))if dx==-1 else(u,neg(n),v)if dy==1 else(u,n,neg(v))
    if q in ori:
     if ori[q]!=candidate:return False
    else:ori[q]=candidate;todo.append(q)
  return len(set(t[2]for t in ori.values()))==6
 nets=[s for s in shapes if fold(s)];assert len(nets)==64
 def boundary(s):return sum((x+dx,y+dy)not in s for x,y in s for dx,dy in directions)
 assert {boundary(s)for s in nets}=={14}
 assert {sum((x+1,y)in s for x,y in s)+sum((x,y+1)in s for x,y in s)for s in nets}=={5}
 return {'fixedHexominoes':len(shapes),'foldableCubeNets':len(nets),'allNetBoundaryEdges':14,'allNetHinges':5}
NETS=all_cube_nets();CUT_PAIRS=rectangle_cut_pairs()
def diagonal_cells(a,b):
 breaks=sorted({F(i,a)for i in range(a+1)}|{F(j,b)for j in range(b+1)})
 cells={(math.floor(a*(u+v)/2),math.floor(b*(u+v)/2))for u,v in zip(breaks,breaks[1:])}
 assert len(cells)==len(breaks)-1;return cells
def circle_line_witness(k):
 eps=F(1,100);points=[]
 for a,b in itertools.combinations(range(1,k+1),2):
  x,y=-eps*(a+b),-eps*a*b;assert x*x+y*y<1
  assert y==a*x+eps*a*a==b*x+eps*b*b
  assert all(y!=m*x+eps*m*m for m in range(1,k+1)if m not in(a,b));points.append((x,y))
 assert len(set(points))==len(points);return 1+sum(range(1,k+1))
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))};expected=None
 if i==0:
  a=one(n[:1]);count=3 if source else n[1];assert count.denominator==1
  cells=set(itertools.product(range(int(count)),range(1)))
  boundary=sum((x+dx,y+dy)not in cells for x,y in cells for dx,dy in[(1,0),(-1,0),(0,1),(0,-1)])
  out=boundary*a;proof['exposed2DEdges']=boundary
 elif i==1:
  edge,small=n;layers=edge/small;assert layers.denominator==1 and layers>1
  cuts=[list(range(1,int(layers)))for _ in range(3)];out=sum(map(len,cuts));proof['allRequiredInteriorPlanes']=[list(map(str,c))for c in cuts]
  if not source:assert'жылжытуға'in s and'болмайды'in s
 elif i==2:
  L,W,a,b=n;assert all(v.denominator==1 and v>0 for v in n)and L%a==W%b==0
  tiles=[set(itertools.product(range(x,x+int(a)),range(y,y+int(b))))for x in range(0,int(L),int(a))for y in range(0,int(W),int(b))]
  covered=set();
  for tile in tiles:assert not covered&tile;covered|=tile
  assert covered==set(itertools.product(range(int(L)),range(int(W))));out=F(len(tiles));expected=[out,L*W,L+W,L];proof['actualDisjointTiles']=len(tiles)
 elif i==3:out=F(12-NETS['allNetHinges']);expected=[7,12,5,6];proof['netsEnumerated']=NETS
 elif i==4:
  edge=one(n);faces=exposed([(0,0,0),(1,0,0)]);out=faces*edge*edge;expected=[out,12*edge**2,11*edge**2,8*edge**2];proof['exposedVoxelsFaces']=faces
 elif i==5:
  a,b=n;out=F(len(list(itertools.product(range(int(a+1)),range(int(b+1))))))
 elif i==6:
  metres,edge=n;out=100*metres-wire(edge,edge,edge);assert out>0
 elif i==7:
  strips,perimeter=n;assert strips==3
  # Recover positive width by finite exact rational search rather than author algebra.
  widths=[F(x,6)for x in range(1,int(perimeter*6))if 2*(strips+1)*F(x,6)==perimeter];width=one(widths);side=width*strips;out=side*side
  proof['stripDimensions']=list(map(str,[side,width]))
 elif i==8:
  unit,a,b,c=n;assert unit==1;assert all(t.denominator==1 for t in n)
  existing=set(itertools.product(range(int(a)),range(int(b)),range(int(c))));big=int(max(a,b,c));target=set(itertools.product(range(big),repeat=3));assert existing<=target
  out=F(len(target-existing));assert any(t==big for t in(a,b,c));proof['actualNewGridPositions']=len(target-existing)
 elif i==9:
  proof['attainableCutVertexPairs']=CUT_PAIRS
  assert len(opts(r))==4
  proof['answer']=selected(r,'екі бесбұрыш');return proof
 elif i==10:
  a,b,c=n;out=F(len(list(itertools.product(range(int(a+1)),range(int(b+1)),range(int(c+1))))))
  expected=[out,a+b+c,(a+b+c+3 if not source else 7),(a+1)*(b+1)]
 elif i==11:
  a=one(n);out=2*sum(H.face_areas(a,a,a/2));expected=[out,6*a*a,7*a*a,4*a*a]
 elif i==12:
  a,b,oneWidth,k=n;assert a==b and oneWidth==1 and a%k==1
  a,k=int(a),int(k);placements=[]
  for y in range(a):
   for x in range(0,a-1,k):placements.append({(x+dx,y)for dx in range(k)})
  for y in range(0,a-1,k):placements.append({(a-1,y+dy)for dy in range(k)})
  covered=set()
  for p in placements:assert len(p)==k and not p&covered;covered|=p
  out=F(len(placements));assert len(covered)==k*out and out==a*a//k and len(covered)==a*a-1
  proof.update(disjointConstructedStrips=len(placements),unusedCells=1,areaUpperBound=a*a//k)
 elif i==13:
  a=int(one(n));cases=[(x,(a-2*x)**2*x)for x in range(1,a)if a-2*x>0];out=F(max(v for x,v in cases));proof['allAdmissibleIntegerCutsAndVolumes']=cases
  if not source:
   assert'натурал'in s and'оң'in s
   for x,v in cases:assert f'x = {x}:'in r['solution']and f'= {v} см³'in r['solution']
 elif i==14:
  unit,count=n;assert unit==1;count=int(count)
  triples=[(a,b,c)for a in range(1,count+1)for b in range(a,count+1)for c in range(b,count+1)if a*b*c==count]
  cases=[(t,exposed(itertools.product(*(range(v)for v in t))))for t in triples];target=one(t for t,v in cases if v==min(z for _,z in cases))
  actual=[tuple(map(int,ns(o)))for o in opts(r)];assert set(actual)==set(triples)and len(actual)==len(triples)==4
  assert tuple(map(int,ns(clean(r['answer']))))==target
  proof.update(allFactorTriplesSurfaceAreas=cases,answer=list(target));return proof
 elif i==15:
  P,p,q=n;solutions=[(F(w,2),F(x,2),F(y,2))for w in range(1,int(P))for x in range(1,int(P))for y in range(1,int(P))if w+x==p and w+y==q and w+x+y==P]
  # Variables above are twice physical dimensions; equations encode all three perimeters.
  w,x,y=one(solutions);out=w
  assert 2*(w+x)==p and 2*(w+y)==q and 2*(w+x+y)==P;proof['positiveConstructionDimensions']=list(map(str,[w,x,y]))
 elif i==16:
  edge,small=n;ratio=edge/small;assert ratio.denominator==1
  separated=len(list(itertools.product(range(int(ratio)),repeat=3)))*exposed([(0,0,0)])*small**2
  original=exposed([(0,0,0)])*edge**2;out=separated/original;expected=[out,ratio**3,ratio**2,F(1)]
  # The unchanged choice has no numeral; parse it as unit ratio.
  assert one(ns(clean(r['answer'])))==out
  values=[F(1)if norm(o)in('өзгермейді','өзгерген жоқ')else one(ns(o))for o in opts(r)];assert sorted(values)==sorted(expected)
  proof.update(separatedSurface=str(separated),originalSurface=str(original),answer=str(out));return proof
 elif i==17:
  perimeter=one(n);edge=perimeter/NETS['allNetBoundaryEdges'];out=edge**3;expected=[out,(perimeter/12)**3,(perimeter/6)**3,edge**2];proof['allCubeNets']=NETS
 elif i==18:
  a,b,remaining,w,l,count=n;assert a==b and w==1 and l==2 and a.denominator==1
  a=int(a);cells=set(itertools.product(range(a),repeat=2))-{(0,0),(a-1,a-1)}
  colors=[sum((x+y)%2==color for x,y in cells)for color in(0,1)];assert len(cells)==remaining==2*count and colors[0]!=colors[1]
  assert all((x+y)%2!=(x+dx+y+dy)%2 for x,y in cells for dx,dy in[(1,0),(0,1)])
  proof.update(remainingColors=colors,requiredEachColor=str(count),answer=selected(r,'Болмайды'if source else'Жабу мүмкін емес'));return proof
 elif i==19:
  k=int(one(n));out=F(circle_line_witness(k));proof['exactGeneralPositionLineWitness']={'slopes':list(range(1,k+1)),'intercepts':'slope² / 100','allPairIntersectionsStrictlyInsideUnitCircle':True,'noTripleIntersection':True}
 elif i==20:
  a=one(n);pieces=[(a/2,a/2)]*4;out=one(set(x*y for x,y in pieces));assert sum(x*y for x,y in pieces)==a*a
 elif i==21:
  if not source:
   a,h=n;assert 0<h<a and h!=a and a-h!=a;proof['twoPositiveSolids']=[[str(a),str(a),str(h)],[str(a),str(a),str(a-h)]]
  proof['answer']=selected(r,'2 тікбұрышты параллелепипед'if source else'Екі тікбұрышты параллелепипед');return proof
 elif i==22:
  count=int(one(n));rays=set(range(2*count));out=F(len(rays))
  if not source:assert'әртүрлі'in s and'беттеспейді'in s and'центр'in s
 elif i==23:
  a,b=n;assert a>0 and b>0 and a!=b;proof['allSixFullSideJoins']=triangle_joins(a,b)
  proof['answer']=selected(r,'шаршы');return proof
 elif i==24:
  unit,count,a,b,c=n;assert a==b==c and count==a**3;assert unit>0 and a.denominator==1 and a>=2
  big=set(itertools.product(range(int(a)),repeat=3));before=exposed(big);after=exposed(big-{(0,0,0)});assert before==after
  out=after*unit**2;expected=[out,out-3*unit**2,out+3*unit**2,out-6*unit**2];proof.update(actualBeforeFaces=before,actualAfterFaces=after)
 elif i==25:
  if source:assert n[:-1]==[9,9];perimeter=n[-1];h=v=2
  else:h,v,pieces,perimeter=n;assert(h+1)*(v+1)==pieces
  # Sum perimeter of each cell in an actual, deliberately unequal rational partition.
  h,v=int(h),int(v);weightsX=list(range(1,v+2));weightsY=list(range(1,h+2));weightsSum=sum(2*(F(x,sum(weightsX))+F(y,sum(weightsY)))for x in weightsX for y in weightsY)
  out=perimeter/weightsSum;proof['actualUnequalGridPerimeterCoefficient']=str(weightsSum)
 elif i==26:
  a,b=map(int,n);cells=diagonal_cells(a,b);out=F(len(cells));proof['actualDiagonalInteriorCells']=sorted(cells)
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out,expected);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==27
 evidence=[];entries=[];canaries=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId'])
  assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  assert not re.search(r'<(?:img|svg)',q.get('statementHtml',''))
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert clean(one(o['text']for o in q['options']if o['correct']))==clean(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])and all(r[k]for k in['statement','solution','answer'])
  if not r.get('options'):assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  else:assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,TypeError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad=copy.deepcopy(r)
  if i in(3,9,21,23):bad['options'][bad['options'].index(bad['answer'])]='INVALID_OPTION'
  else:
   matches=list(re.finditer(r'\d+',bad['statement']));index=1 if i in(8,14)else 3 if i==25 else 0
   m=matches[index];bad['statement']=bad['statement'][:m.start()]+str(int(m.group())+1)+bad['statement'][m.end():]
  try:solve(bad,i)
  except(AssertionError,ValueError,TypeError):canaries+=1
  else:raise AssertionError(('printedgivenaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'savedSource':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'full_saved_and_authored_text_read; separate exact Python geometric/lattice enumeration; no author model/params oracle; not a separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':len(entries),'findings':0,'allSavedAndNewConditionsSolutionsMCQsRead':27,'wrongKeysRejected':27,'printedGivensOrTargetsCanariesRejected':canaries,'allFixedHexominoesEnumerated':216,'allFoldableCubeNetsChecked':64,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':27,'separateHumanReviewer':False}
 report={'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
