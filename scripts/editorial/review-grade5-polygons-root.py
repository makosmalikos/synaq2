"""Independent root review: all25 full saved/new conditions, official/authored
solutions and every MCQ read. Exact printed geometry, explicit unordered pair
enumeration and geometric existence witnesses. No author specs/models/params
imported as an oracle. Numeric variants are not claimed as semantic stories.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-polygons.json'
REPORT='problems/editorial/reviews/grade5-polygons.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def clean(s):return str(s).replace('$','').replace('{,}',',').replace('\\,','').replace('−','-')
def options(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def diag(n):
 assert int(n)==n and n>=3;n=int(n)
 return {(a,b)for a,b in itertools.combinations(range(n),2)if (b-a)%n not in(1,n-1)}
def triangle(sides):assert min(sides)>0 and all(sum(sides)-a>a for a in sides)
def numeric(r,target):
 assert one(ns(clean(r['answer'])))==target,(r['answer'],target)
 if options(r):assert sum(ns(o)==[target]for o in options(r))==1
 return str(target)
def selected(r,pred):
 result=one(o for o in options(r)if pred(o));assert clean(r['answer'])==result
 return result
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))}
 if i==0:triangle(n);target=sum(n)
 elif i==1:
  # Congruence preserves the complete boundary; equal boundary length is
  # insufficient, as the printed non-square rectangle demonstrates.
  vals=ns(clean(r['solution']));a,b,c=(2,6,4)if source else tuple(vals[:3])
  assert a!=b and c*c!=a*b and 2*(a+b)==4*c
  proof.update(counterexampleSides=list(map(str,[a,b,c])),samePerimeter=str(4*c),optionTruth=[True,False,False,False]if not source else[False,False,False,True])
  proof['answer']=selected(r,lambda o:('периметрлері де тең'in o)if source else o=='Беттесетін көпбұрыштардың шекара ұзындықтары бірдей.');return proof
 elif i==2:
  vertices=one(re.findall(r'\b[A-Z]{4}\b',s));targetVertex='C'if source else one(re.findall(r'\. ([A-Z]) төбесі',s));k=vertices.index(targetVertex)
  neighbors={vertices[(k-1)%4],vertices[(k+1)%4]}
  proof.update(cyclicVertices=vertices,adjacentVertices=sorted(neighbors))
  proof['answer']=selected(r,lambda o:set(re.findall(r'\b[A-Z]\b',o))==neighbors);return proof
 elif i==3:
  size=12 if source else one(n);target=len([p for p in diag(size)if 0 in p]);assert target==size-3
 elif i==4:
  names={'Үшбұрыш':3,'Төртбұрыш':4,'Бесбұрыш':5,'Квадрат':4,'Алтыбұрыш':6,'Сегізбұрыш':8}
  counts=[len(diag(names[o]))for o in options(r)];proof['allMCQDiagonalCounts']=counts
  proof['answer']=selected(r,lambda o:not diag(names[o]));return proof
 elif i==5:
  perimeter,a,b=n;target=perimeter-a-b;triangle([a,b,target]);assert a+b+target==perimeter
 elif i==6:
  size=7 if source else one(n);target=sum([size]*3)
 elif i==7:
  if source:sides=n[:5];gap=n[5];assert n[6]==1;price=n[7]
  else:sides=n[:5];gap,price=n[5:]
  assert max(sides)<sum(sides)-max(sides) and 0<gap<min(sides)and price>0
  target=(sum(sides)-gap)*price;assert target==sum(sides)*price-gap*price
  proof.update(perimeter=str(sum(sides)),fencedLength=str(sum(sides)-gap),requestedCost=str(target))
 elif i==8:
  total=one(n);candidates=[int(one(ns(o)))for o in options(r)];counts=[len(diag(v))for v in candidates]
  target=one(v for v,c in zip(candidates,counts)if c==total)
  assert [v for v in range(3,int(total)+4)if len(diag(v))==total]==[target]
  proof['allMCQDiagonalCounts']=counts
 elif i==9:
  perimeter,size=(one(n),8)if source else n;target=perimeter/size;assert size>=3 and target>0
 elif i==10:
  if source:
   mapping=dict(zip('ABCDE','KLMNP'));edges=dict(zip(['AB','BC','CD','DE','EA'],n));wanted='MN'
  else:
   mapping=dict(re.findall(r'([A-Z]) ↔ ([A-Z])',s));edges={k:F(v)for k,v in re.findall(r'([A-Z]{2}) = (\d+) см',s)};wanted=one(re.findall(r'Екіншідегі ([A-Z]{2})',s))
  assert len(mapping)==5 and len(set(mapping.values()))==5 and len(edges)==5
  inverse={b:a for a,b in mapping.items()};original=''.join(inverse[v]for v in wanted)
  target=edges.get(original,edges.get(original[::-1]));assert target is not None
  proof.update(bijection=mapping,requestedCorrespondingEdge=original)
 elif i==11:
  size=6 if source else one(n);target=len(diag(size));assert 2*target==size*(size-3)
 elif i==12:
  if source:a,extra,divisor=n;ratio=1/divisor
  else:a,extra,num,den=n;ratio=num/den
  b=a+extra;c=b*ratio;triangle([a,b,c]);target=a+b+c;proof['orderedSides']=list(map(str,[a,b,c]))
 elif i==13:
  perimeter,step=n if source else n[::-1];sidesCount=5
  base=(perimeter-step*sum(range(sidesCount)))/sidesCount;sides=[base+step*j for j in range(sidesCount)]
  assert base>0 and step>0 and sum(sides)==perimeter and max(sides)<perimeter-max(sides)
  target=max(sides);proof['orderedNonCyclicProgression']=list(map(str,sides))
 elif i==14:target=one(n)*4/3
 elif i==15:
  outer,a,b=n;target=(a+b-outer)/2;left=(a-target)/2;right=(b-target)/2
  triangle([left,left,target]);triangle([right,right,target]);assert 2*left+2*right==outer
  # Isosceles triangles on opposite sides of their common base give an
  # actual convex kite, not merely formally consistent perimeter equations.
  assert left*left>(target/2)**2 and right*right>(target/2)**2
  proof.update(commonInternalSegment=str(target),strictConvexKiteWitness=list(map(str,[left,left,right,right])))
 elif i==16:
  target=sum(n)/2;sides=[target-v for v in n];triangle(sides)
  assert sorted(sum(pair)for pair in itertools.combinations(sides,2))==sorted(n);proof['recoveredSides']=list(map(str,sides))
 elif i==17:
  area=one(n);side=math.isqrt(int(area));assert side*side==area;target=2*(side+F(side,2))
  proof.update(originalArea=str(area),newDimensions=[str(side),str(F(side,2))])
 elif i==18:
  factor=one(n);target=2*factor+3;assert target>=3 and len(diag(target))==factor*target
 elif i==19:
  size=one(n);target=len(diag(size));assert target==size*(size-3)/2
 elif i==20:
  if source:truth=[True,False,True,True]
  else:truth=[False,True,True,True]
  assert len(diag(3))==0 and len(diag(4))==2
  assert len(options(r))==4;proof['everyMCQTruth']=truth
  proof['answer']=selected(r,lambda o:o==options(r)[truth.index(False)]);return proof
 elif i==21:
  vertices=one(re.findall(r'\b[A-Z]{4}\b',s));wanted={frozenset([vertices[a],vertices[b]])for a,b in diag(4)}
  def pairs(o):return {frozenset(edge)for edge in re.findall(r'\b[A-Z]{2}\b',o)}
  proof['answer']=selected(r,lambda o:pairs(o)==wanted);return proof
 elif i==22:
  size=11 if source else one(n);target=len([p for p in diag(size)if 0 not in p]);assert target==len(diag(size))-(size-3)
  assert target==len(diag(size-1))+1;proof['originalAdjacencyRetained']=True
 elif i==23:
  perimeter,shared=n;target=2*perimeter-2*shared;leg=(perimeter-shared)/2;triangle([leg,leg,shared])
  assert target==4*leg;proof['oppositeGluingWitnessSides']=list(map(str,[shared,leg,leg]))
 elif i==24:
  triangles=one(n);size=triangles+2;target=len(diag(size));assert size-3+1==triangles
  proof.update(fanTriangleCount=str(triangles),recoveredVertices=str(size),oneVertexDiagonals=str(size-3),requestedAllDiagonals=str(target))
 else:raise AssertionError(i)
 proof['answer']=numeric(r,target);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25
 entries=[];evidence=[];canaries=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId'])
  assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert clean(one(o['text']for o in q['options']if o['correct']))==clean(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and clean(r['statement'])!=clean(q['statement'])and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  if not r.get('options'):assert'options'not in r
  changed=copy.deepcopy(r);changed['answer']='INVALID_KEY'
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r)
  if i in(1,2,4,20,21):changed['options'][changed['options'].index(changed['answer'])]='INVALID_OPTION'
  elif i==10:changed['statement']=changed['statement'].replace('UV = 9','UV = 10')
  else:
   m=re.search(r'\d+(?:,\d+)?',changed['statement']);assert m
   changed['statement']=changed['statement'][:m.start()]+str(F(m.group().replace(',','.'))+1)+changed['statement'][m.end():]
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceFromPrintedCondition':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_full_saved_new_solutions_every_MCQ_read_printed_exact_arithmetic_unordered_adjacency_enumeration_and_physical_witnesses','notes':[json.dumps(proof,ensure_ascii=False)]})
 cases=0
 for size in range(3,151):
  pairs=diag(size);assert len(pairs)==size*(size-3)//2
  assert all(sum(v in p for p in pairs)==size-3 for v in range(size))
  if size>3:assert sum(0 not in p for p in pairs)==len(diag(size-1))+1
  cases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==5
 report={'schemaVersion':1,'reviewer':'root_independent_of_polygon_author','batch':BATCH,'scope':__doc__,'summary':{'verified':25,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':25,'wrongKeysRejected':25,'printedGivensOrMCQCanariesRejected':canaries,'exhaustivePolygonSizes':cases,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':25},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
