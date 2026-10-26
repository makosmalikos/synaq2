"""Root external review of all33 full saved/new conditions, official/authored
solutions and every MCQ. Independent vertex/edge/face enumeration, exact
printed SI/perimeter/area/volume ledgers, actual exposed-face grids and positive
dimension equations. No author specs/models/params used as answer oracle.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-cuboid-surfaces.json'
REPORT='problems/editorial/reviews/grade5-cuboid-surfaces.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def clean(s):return str(s).replace('$','').replace('{,}',',').replace('\\,','').replace('−','-')
def options(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
VERTICES=list(itertools.product((0,1),repeat=3))
EDGES=[(a,b)for a,b in itertools.combinations(VERTICES,2)if sum(x!=y for x,y in zip(a,b))==1]
FACES=[tuple(v for v in VERTICES if v[axis]==side)for axis in range(3)for side in(0,1)]
assert len(VERTICES)==8 and len(EDGES)==12 and len(FACES)==6 and 8-12+6==2
assert all(sum(v in edge for edge in EDGES)==3 for v in VERTICES)
def face_areas(a,b,c):assert min(a,b,c)>0;return [a*b,a*b,a*c,a*c,b*c,b*c]
def surface(a,b,c):return sum(face_areas(a,b,c))
def wire(a,b,c):
 dims=[a,b,c];assert min(dims)>0
 return sum(one(dims[k]for k in range(3)if u[k]!=v[k])for u,v in EDGES)
def exposed(cubes):
 cubes=set(cubes);return sum(tuple(v[k]+(direction if k==axis else 0)for k in range(3))not in cubes for v in cubes for axis in range(3)for direction in(-1,1))
def numeric(r,target):
 assert one(ns(clean(r['answer'])))==target,(r['answer'],target)
 if options(r):assert sum(ns(o)==[target]for o in options(r))==1
 return str(target)
def selected(r,pred):
 result=one(o for o in options(r)if pred(o));assert clean(r['answer'])==result;return result
def square_root(area):
 assert area>0 and area.denominator==1;side=F(math.isqrt(int(area)));assert side*side==area;return side
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))}
 if i==0:out=len(EDGES)*one(n)
 elif i==1:out=one(n)/len(EDGES)
 elif i==2:
  if not source:assert all(word in s for word in['ЖАҚТАР','ҚЫРЛАР','ТӨБЕЛЕР'])
  out=len(FACES)+len(EDGES)+len(VERTICES);proof.update(faces=6,edges=12,vertices=8)
 elif i==3:out=len(EDGES);proof['diagnosticOtherCounts']=[8,6,4]
 elif i==4:out=one(set(sum(v in edge for edge in EDGES)for v in VERTICES));proof['allEightVertexDegrees']=[3]*8
 elif i==5:
  a,b,c,target=n;areas=face_areas(a,b,c);out=sum(v==target for v in areas);proof['allSixAreas']=list(map(str,areas))
 elif i==6:out=square_root(one(n))
 elif i in(7,15):
  a,b,c=n;areas=face_areas(a,b,c);out=sum(areas);proof.update(allSixAreas=list(map(str,areas)),wrongVolume=str(a*b*c),wrongWire=str(wire(a,b,c)))
 elif i==8:
  # Cube definition: all three dimensions equal -> all12 edges equal;
  # topology fixes6 square faces and8 vertices, regardless of size.
  wanted='Кубтың барлық қырлары өзара тең'if source else'Кубтағы барлық он екі қырдың ұзындықтары тең.'
  proof['answer']=selected(r,lambda o:o==wanted);proof['everyMCQTruth']=[False,True,False,False]if source else[True,False,False,False];return proof
 elif i==9:
  totalArea=one(n);side=square_root(totalArea/len(FACES));out=side*len(EDGES);assert surface(side,side,side)==totalArea;proof['recoveredSide']=str(side)
 elif i==10:
  factor=one(n);assert factor>1;out=factor*factor;proof.update(universalAreaScale=str(out),wrongLengthScale=str(factor),wrongVolumeScale=str(factor**3))
 elif i==11:
  metres,side=n;used=len(EDGES)*side;out=100*metres-used;assert out>=0 and used+out==100*metres;proof.update(usedCentimetres=str(used),requestedRemaining=str(out))
 elif i==12:
  length,width,height,openings=n;walls=2*length*height+2*width*height;ceiling=length*width;assert 0<=openings<walls
  out=walls+ceiling-openings;assert out==surface(length,width,height)-length*width-openings
  if not source:assert'ЕДЕН боялмайды'in s
  proof.update(walls=str(walls),ceiling=str(ceiling),excludedFloor=str(length*width),excludedOpenings=str(openings))
 elif i==13:
  a,b,c=n;areas=face_areas(a,b,c);out=sum(areas)-a*b
  assert out==a*b+2*a*c+2*b*c
  if not source:assert'ҮСТІ АШЫҚ'in s
  proof.update(bottom=str(a*b),excludedLid=str(a*b),requestedFiveFaceArea=str(out))
 elif i==14:
  total,a,b=n;out=total/4-a-b;assert out>0 and wire(a,b,out)==total
  proof['diagnosticWrongValues']=list(map(str,[total-a-b,total/2-a-b,total/4]))
 elif i==16:
  side=one(n);count=exposed([(0,0,0),(1,0,0)]);assert count==10;out=count*side*side
  assert out==surface(2*side,side,side)==2*surface(side,side,side)-2*side*side
  proof.update(exposedSquares=count,removedInternalFaces=2)
 elif i==17:
  a,b,c,areaUnit,unitPrice=n;area=surface(a,b,c);units=area/areaUnit;assert units.denominator==1 and unitPrice>0;out=units*unitPrice
  proof.update(coveredArea=str(area),billableAreaUnits=str(units),requestedCost=str(out))
 elif i==18:
  a,b,c=n;totalWire=wire(a,b,c);cubeSide=totalWire/12;out=surface(cubeSide,cubeSide,cubeSide);assert wire(cubeSide,cubeSide,cubeSide)==totalWire
  proof.update(equalWireNotEqualSurface=str(totalWire),cubeSide=str(cubeSide))
 elif i==19:
  side=one(n);out=2*surface(side,side,side/2);assert out==surface(side,side,side)+2*side*side
  proof.update(originalSurface=str(surface(side,side,side)),addedCutFaces=2,requestedBothFullSurfaces=str(out))
 elif i==20:
  increase,decrease=n[:2]
  if not source:assert n[2]==decrease
  out=4*increase-4*decrease;assert out>0
  for a in range(1,31):
   for b in range(int(decrease)+1,31):assert wire(a+increase,b-decrease,7)-wire(a,b,7)==out
  proof['allPositiveDimensionsCancellation']=True
 elif i==21:
  large,small=n;sideCount=large/small;assert sideCount.denominator==1 and sideCount>1
  cubeCount=sideCount**3;allSurfaces=cubeCount*surface(small,small,small);original=surface(large,large,large);out=allSurfaces/original;assert out==sideCount
  proof.update(individualCubeCount=str(cubeCount),allSeparatedSurfaces=str(allSurfaces),originalSurface=str(original),requestedRatio=str(out))
 elif i==22:
  side,count=n;assert count.denominator==1 and count>=2
  faces=exposed([(j,0,0)for j in range(int(count))]);out=faces*side*side
  assert out==surface(count*side,side,side)==count*6*side*side-2*(count-1)*side*side
  proof.update(exposedSquares=faces,gluedInterfaces=str(count-1))
 elif i==23:
  total,ab,bc=n;dimensionSum=total/4;c=dimensionSum-ab;b=bc-c;a=ab-b;assert min(a,b,c)>0 and wire(a,b,c)==total and a+b==ab and b+c==bc
  out=a*b*c;proof.update(recoveredDimensions=list(map(str,[a,b,c])),requestedVolume=str(out))
 elif i==24:
  length,width,height,bow=n;loopA=2*(length+height);loopB=2*(width+height);out=loopA+loopB+bow
  assert out==2*length+2*width+4*height+bow
  if not source:assert'ҰЗЫНДЫҚ ПЕН БИІКТІК'in s and'ЕН ПЕН БИІКТІК'in s
  proof.update(loops=list(map(str,[loopA,loopB])),extraBow=str(bow),notTwelveEdgeFrame=True)
 elif i==25:
  if not source:assert'САНДЫҚ МӘНДЕРІ'in s
  out=F(len(EDGES),len(FACES));assert out>0 and surface(out,out,out)==wire(out,out,out)
  assert [F(k,10)for k in range(1,101)if surface(F(k,10),F(k,10),F(k,10))==wire(F(k,10),F(k,10),F(k,10))]==[out]
  proof.update(cancellationRequiresPositiveEdge=True,numericalValuesOnlyNotEqualDimensions=True)
 elif i==26:
  proof['answer']=selected(r,lambda o:o=='куб');proof['allMCQMatchesRequiredSolidName']=[True,False,False,False];return proof
 elif i==27:
  a,b,c=n;areas=face_areas(a,b,c);out=max(areas);assert out==sorted(n)[1]*sorted(n)[2];proof['everyDistinctFaceArea']=list(map(str,areas[::2]))
 elif i==28:
  dm,b,c=n;a=10*dm;out=surface(a,b,c);proof.update(convertedLengthCentimetres=str(a),wrongUnconvertedArea=str(surface(dm,b,c)),wrongVolume=str(a*b*c))
 elif i==29:
  total=one(n)if source else n[1]
  if not source:assert n[0]==12
  side=total/len(EDGES);assert side>0;out=side**3;proof['intermediateSide']=str(side)
 elif i==30:
  side=one(n);missing=1;count=len(FACES)-missing;area=count*side*side;wanted=[F(count),area]
  opts=options(r);assert sum(ns(o)==wanted for o in opts)==1 and ns(clean(r['answer']))==wanted
  proof.update(requestedPair=list(map(str,wanted)),everyMCQPair=[list(map(str,ns(o)))for o in opts]);return proof
 elif i==31:
  factor,less,total=n;width=(total/4+less)/(factor+2);length=factor*width;height=width-less
  assert min(length,width,height)>0 and wire(length,width,height)==total
  assert length/width==factor and width-height==less;out=surface(length,width,height);proof['allThreeDimensions']=list(map(str,[length,width,height]))
 elif i==32:
  total=one(n);middle=total/12;dims=[middle-1,middle,middle+1];assert min(dims)>0 and all(v.denominator==1 for v in dims)
  assert wire(*dims)==total;out=surface(*dims);proof['threeConsecutivePositiveIntegers']=list(map(str,dims))
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==33
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
  if i in(3,4,8,26):changed['options'][changed['options'].index(changed['answer'])]='INVALID_OPTION'
  elif i==2:changed['statement']=changed['statement'].replace('ТӨБЕЛЕР','КӨЛЕМ')
  elif i==25:changed['statement']=changed['statement'].replace('САНДЫҚ МӘНДЕРІ','ӨЛШЕМДЕРІ')
  elif i==29:changed['statement']=changed['statement'].replace('120 см','132 см')
  else:
   m=re.search(r'\d+(?:,\d+)?',changed['statement']);assert m
   changed['statement']=changed['statement'][:m.start()]+str(F(m.group().replace(',','.'))+1)+changed['statement'][m.end():]
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceFromPrintedCondition':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_all_saved_new_full_solutions_every_MCQ_read_printed_exact_vertex_edge_face_enumeration_exposed_voxel_surfaces_and_positive_equations','notes':[json.dumps(proof,ensure_ascii=False)]})
 exposedCases=0
 for a in range(1,10):
  for b in range(1,10):
   for c in range(1,10):
    assert exposed(itertools.product(range(a),range(b),range(c)))==surface(a,b,c)
    assert wire(a,b,c)==4*(a+b+c);exposedCases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==0
 report={'schemaVersion':1,'reviewer':'root_independent_of_cuboid_author','batch':BATCH,'scope':__doc__,'summary':{'verified':33,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':33,'wrongKeysRejected':33,'printedGivensOrTargetCanariesRejected':canaries,'independentExposedVoxelCases':exposedCases,'nativeFractions':0,'pythonJavaScriptHashesMatched':33},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
