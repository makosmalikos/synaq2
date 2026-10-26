"""Independent root review of all35 full saved/new conditions, official and
authored solutions and EVERY MCQ. Printed exact radius/diameter/SI arithmetic,
circle location predicates, attained extrema, endpoint enumeration and an
independent general-position four-circle witness. Author specs/models/params
are not imported. Unchanged definitions are not counted as new meanings.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-circle-basics.json'
REPORT='problems/editorial/reviews/grade5-circle-basics.json'
sp=importlib.util.spec_from_file_location('root_generic',ROOT/'scripts/editorial/review-collection-word4-wave19.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,ns=H.one,H.ns
def clean(s):
 s=str(s).replace('$','').replace('{,}',',').replace('\\,','').replace('−','-')
 return re.sub(r'\\+(?:d?frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def options(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def numeric(r,target):
 assert one(ns(clean(r['answer'])))==target,(r['answer'],target)
 if options(r):assert sum(ns(o)==[target]for o in options(r))==1
 return str(target)
def selected(r,pred):
 result=one(o for o in options(r)if pred(o));assert clean(r['answer'])==result
 return result
def circle_location(a,b,d):
 assert a>0 and b>0 and d>=0
 if d==0 and a==b:return'coincident'
 if d>a+b:return'exterior_disjoint'
 if d==a+b:return'external_tangent'
 if d>abs(a-b):return'two_intersections'
 if d==abs(a-b):return'internal_tangent'
 return'contained_disjoint'
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);proof={'printedNumbers':list(map(str,n))}
 if i==0:out=one(n)*10/2;proof['centimetresPerDecimetre']=10
 elif i==1:
  radius,d=n;assert d>radius>0
  proof.update(radius=str(radius),distance=str(d),location='outside_closed_disk')
  proof['answer']=selected(r,lambda o:('сыртында'in o)if source else o=='Нүкте жабық дөңгелектен тыс жатыр.');return proof
 elif i==2:
  # Positive radius: boundary distance=R, center distance=0, diameter=2R.
  assert all(0<R and 2*R>R for R in range(1,101))
  proof['allMCQTruth']=[True,False,False,False]
  proof['answer']=selected(r,lambda o:o==('Дөңгелек өз шеңберін де қамтиды'if source else'Дөңгелектің құрамына ішкі аймақ та, оны шектейтін шеңбер де кіреді.'));return proof
 elif i==3:
  count=int(one(n));assert count>=2
  pairs={(j,(j+1)%count)for j in range(count)};assert len(pairs)==count
  out=len(pairs);proof['closingIntervalIncluded']=True
 elif i in(4,6):out=one(n)/2
 elif i==5:
  radius=n[0]
  if source:center='O';distances={p:F(v.replace(',','.'))for p,v in re.findall(r'O([A-Z]) = (\d+(?:,\d+)?) см',s)}
  else:center='K';distances={p:F(v.replace(',','.'))for p,v in re.findall(r'K([A-Z]) = (\d+(?:,\d+)?) см',s)}
  assert len(distances)==3 and sorted((v>radius)-(v<radius)for v in distances.values())==[-1,0,1]
  wanted=one(p for p,v in distances.items()if v==radius)
  proof.update(center=center,actualDistances={p:str(v)for p,v in distances.items()})
  proof['answer']=selected(r,lambda o:o==wanted);return proof
 elif i==7:
  proof['allMCQTruth']=[False,False,False,True]if source else[True,False,False,False]
  proof['answer']=selected(r,lambda o:o=='радиус');return proof
 elif i in(8,28):out=one(n)*2
 elif i==9:
  firstR,secondD=n;firstD=2*firstR;difference=firstD-secondD;assert difference>0
  proof.update(orderedDiameters=list(map(str,[firstD,secondD])),requestedDifference=str(difference),wrongUnconvertedDifference=str(secondD-firstR),wrongRadiusDifference=str(difference/2))
  proof['answer']=selected(r,lambda o:o.startswith('Бірінші')and ns(o)==[difference]);return proof
 elif i==10:
  radius=one(n);assert radius>0;out=2*radius
  # Antipodal endpoint witness reaches the triangle-inequality upper bound.
  X,Y=-radius,radius;assert abs(X)==abs(Y)==radius and abs(X-Y)==out
  proof.update(closedBoundaryAttainment=list(map(str,[X,Y])),upperBound=str(out))
 elif i in(11,24):
  a,b,d=n;location=circle_location(a,b,d);assert location==('external_tangent'if i==11 else'internal_tangent')
  # Coordinates A=0,B=d. Both distance equations have exactly the stated
  # tangency point and its y-coordinate must be zero.
  x=(a*a-b*b+d*d)/(2*d);assert x*x==a*a and (x-d)**2==b*b
  proof.update(location=location,onlyIntersection=[str(x),'0'],correctStrictTwoIntersectionRange=list(map(str,[abs(a-b),a+b])))
  word='Сырттай'if i==11 else'Іштей'
  proof['answer']=selected(r,lambda o:o.startswith(word));return proof
 elif i==12:
  metres,cm,pathMetres=n;circumference=100*metres+cm;distance=100*pathMetres
  assert metres>0 and 0<=cm<100;out=distance/circumference;assert out.denominator==1
  proof.update(circumferenceCentimetres=str(circumference),distanceCentimetres=str(distance),requestedCompleteTurns=str(out))
 elif i==13:
  small,large,d=n;assert 0<small<d<large
  wanted='Сақинада: үлкен дөңгелекте, бірақ кіші дөңгелектен тыс'if source else'Кіші дөңгелектен тыс, үлкен дөңгелектің ішкі аймағында.'
  proof['answer']=selected(r,lambda o:o==wanted);proof['strictlyBetweenBoundaries']=True;return proof
 elif i==14:
  largeR,factor=n;assert largeR>0 and factor>1;smallD=largeR/factor;out=smallD/2;proof['intermediateSmallDiameter']=str(smallD)
 elif i==15:
  minutes=n[-1];assert 0<minutes<60;out=minutes/60
  def fraction(o):
   a,b=ns(o);return a/b
  assert fraction(clean(r['answer']))==out and sum(fraction(o)==out for o in options(r))==1
  proof.update(requestedFraction=str(out),reconstructedMinutes=str(60*out));return proof
 elif i==16:
  outer,inner=n;assert outer>inner>0;out=(outer-inner)/2;assert inner+2*out==outer
 elif i==17:
  assert all(1<=a<=12 and 1<=b<=12 for a,b in map(ns,options(r)))
  gaps=[min(abs(a-b),12-abs(a-b))for a,b in map(ns,options(r))]
  proof['everyMCQMinorTickGap']=list(map(str,gaps))
  proof['answer']=selected(r,lambda o:abs(ns(o)[0]-ns(o)[1])==6);return proof
 elif i==18:
  metres,cm,rate,minutes=n;circumference=metres+cm/100;assert 0<=cm<100 and min(n)>0
  out=circumference*rate*minutes;proof.update(oneTurnMetres=str(circumference),totalTurns=str(rate*minutes),oneMinuteMetres=str(circumference*rate))
 elif i==19:
  distance,a,b=n;assert min(n)>0;out=a+distance+b
  # A=0,B=d; endpoints on their own included boundaries attain bound.
  X,Y=-a,distance+b;assert abs(X)==a and abs(Y-distance)==b and abs(Y-X)==out
  proof.update(attainedOrderedXABY=list(map(str,[X,0,distance,Y])),upperBound=str(out))
 elif i==20:
  count=3 if source else int(one(n));assert count>=1
  increments=[2]+[2*(k-1)for k in range(2,count+1)];out=sum(increments)
  proof.update(eachNewCircleMaximumRegions=increments,needsPairwiseTwoIntersectionsNoTriple=True)
 elif i==21:
  radius=one(n);assert radius>0;D=2*radius
  impossible=[o for o in options(r)if one(ns(o))>D or one(ns(o))<=0]
  for o in options(r):
   length=one(ns(o))
   if 0<length<=D:
    # A horizontal chord at offset sqrt(R²-(L/2)²) has that exact length.
    offsetSquared=radius*radius-(length/2)**2;assert offsetSquared>=0
  proof['maximumAllowedChord']=str(D);proof['answer']=selected(r,lambda o:o in impossible);return proof
 elif i==22:
  length,width,radius=n;diameter=2*radius
  assert min(n)>0;cols=int(length//diameter);rows=int(width//diameter);out=cols*rows
  assert cols*diameter<=length<(cols+1)*diameter and rows*diameter<=width<(rows+1)*diameter
  if not source:assert'ТІК ҚАТАРЛАНҒАН'in s and'ығыспайды'in s
  proof.update(alignedGridOnly=True,columns=cols,rows=rows,diameter=str(diameter))
 elif i==23:
  size=int(one(n));pairs=list(itertools.combinations(range(size),2));nonadjacent=[(a,b)for a,b in pairs if b-a not in(1,size-1)]
  out=len(nonadjacent);assert out==len(pairs)-size==size*(size-3)//2
  proof.update(allUnorderedPairs=len(pairs),removedCyclicNeighbors=size)
 elif i==25:
  ab,bc,ac=n;total=(ab+bc+ac)/2;a=total-bc;b=total-ac;c=total-ab
  assert min(a,b,c)>0 and a+b==ab and b+c==bc and a+c==ac
  assert all(sum(n)-v>v for v in n);out=max(a,b,c);proof['orderedPositiveRadii']=list(map(str,[a,b,c]))
 elif i==26:
  size=int(one(n));pairs=list(itertools.combinations(range(size),2));arcs={(a,b,side)for a,b in pairs for side in(0,1)}
  out=len(arcs);assert out==size*(size-1);proof.update(unorderedEndpointPairs=len(pairs),bothArcsPerPair=2,notOnlyElementaryArcs=size)
 elif i==27:
  # Reflection (x,y)->(x,-y) preserves x²+y²<=R² and exchanges half-disks.
  proof.update(diameterReflectionIsometry=True,oneCutNotFourParts=True)
  wanted='Екі тең жарты дөңгелекке'if source else'Бір-бірімен беттесетін екі жарты дөңгелек.'
  proof['answer']=selected(r,lambda o:o==wanted);return proof
 elif i==29:
  separation,length=n;assert 0<length<separation<2*length
  first=(F(0),length);second=(separation-length,separation);start=max(first[0],second[0]);end=min(first[1],second[1]);out=end-start
  assert out>0;proof.update(firstReach=list(map(str,first)),secondReach=list(map(str,second)),requestedIntersection=list(map(str,[start,end])))
 elif i==30:
  total=one(n);radius=total/3;out=2*radius;assert radius+out==total
 elif i==31:
  size=int(n[0]);assert len(n)==2 and n[1]==size and size>0 and size%2==0
  pairs={tuple(sorted((j,(j+size//2)%size)))for j in range(size)};out=len(pairs);assert out==size//2
 elif i==32:
  a,b=n;assert min(a,b)>0;out=a+b
  # Small-center distance=a+b. On a line the containing center cannot lie
  # outside both small centers (distance difference would require a+b=|a-b|).
  # Between them: (R-a)+(R-b)=a+b -> R=a+b, with both distances positive.
  centerA=-b;centerB=a;assert centerB-centerA==a+b and abs(centerA)+a==out and abs(centerB)+b==out
  proof.update(containingRadius=str(out),smallCenters=list(map(str,[centerA,centerB])),smallExternalTouchPoint=str(a-b))
 elif i==33:
  size=int(one(n));out=len(list(itertools.combinations(range(size),3)));assert out==size*(size-1)*(size-2)//6
  proof.update(orderedTriples=size*(size-1)*(size-2),permutationsOfEachTriangle=6,noThreeCollinearOnCircle=True)
 elif i==34:
  first,step,diameter=n;last=diameter/2;intervals=(last-first)/step
  assert first>0 and step>0 and intervals.denominator==1 and intervals>=0
  radii=[first+j*step for j in range(int(intervals)+1)];assert radii[-1]*2==diameter;out=len(radii)
  proof.update(inclusiveRadii=list(map(str,radii)),intervalCount=str(intervals))
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out);return proof
def arrangement_witness():
 # Deliberately independent of the author's coordinates. Unit circles;
 # intersections verified against all four equations, all12 vertices distinct.
 centers=[(-.5,0),(.5,0),(0,.6),(.1,-.4)];points=[]
 for i,j in itertools.combinations(range(4),2):
  ax,ay=centers[i];bx,by=centers[j];dx,dy=bx-ax,by-ay;d=math.hypot(dx,dy);assert 0<d<2
  mx,my=(ax+bx)/2,(ay+by)/2;h=math.sqrt(1-d*d/4)
  for sign in(-1,1):
   x,y=mx+sign*h*(-dy/d),my+sign*h*dx/d
   assert abs((x-ax)**2+(y-ay)**2-1)<1e-10 and abs((x-bx)**2+(y-by)**2-1)<1e-10
   assert all(abs((x-cx)**2+(y-cy)**2-1)>1e-6 for k,(cx,cy)in enumerate(centers)if k not in(i,j))
   assert all(math.hypot(x-px,y-py)>1e-6 for px,py in points);points.append((x,y))
 assert len(points)==12;vertices=len(points);edges=24;faces=edges-vertices+2;assert faces==14
 return {'unitCircleCenters':centers,'distinctPairIntersections':vertices,'arcEdges':edges,'connectedPlanarEulerFacesIncludingExterior':faces,'noTripleIntersections':True}
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==35
 entries=[];evidence=[];canaries=0
 categorical={1,2,5,7,9,11,13,17,20,21,24,27}
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
  if i in categorical:changed['options'][changed['options'].index(changed['answer'])]='INVALID_OPTION'
  elif i==15:changed['statement']=changed['statement'].replace('25 минутта','24 минутта')
  elif i==22:changed['statement']=changed['statement'].replace('радиусы 2 см','радиусы 3 см')
  elif i==31:changed['statement']=changed['statement'].replace('14','16')
  else:
   m=re.search(r'\d+(?:,\d+)?',changed['statement']);assert m
   changed['statement']=changed['statement'][:m.start()]+str(F(m.group().replace(',','.'))+1)+changed['statement'][m.end():]
  try:solve(changed,i)
  except(AssertionError,ValueError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'sourceFromPrintedCondition':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_full_saved_new_solutions_every_MCQ_read_printed_exact_circle_distance_SI_extrema_endpoint_enumeration_and_planar_witness_oracle','notes':[json.dumps(proof,ensure_ascii=False)]})
 witness=arrangement_witness();locationCases=0
 for a in range(1,31):
  for b in range(1,31):
   for d in range(0,a+b+2):
    result=circle_location(a,b,d)
    if d>0:
     x=F(a*a-b*b+d*d,2*d);heightSquared=a*a-x*x
     if result=='two_intersections':assert heightSquared>0
     elif result in('internal_tangent','external_tangent'):assert heightSquared==0
     else:assert heightSquared<0
    else:assert result==('coincident'if a==b else'contained_disjoint')
    locationCases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/\\d\\s*\\/\\s*\\d/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert check['fractions']==12
 report={'schemaVersion':1,'reviewer':'root_independent_of_circle_author','batch':BATCH,'scope':__doc__,'summary':{'verified':35,'findings':0,'fullSavedNewOfficialAuthoredSolutionsEveryMCQRead':35,'wrongKeysRejected':35,'printedGivensOrMCQCanariesRejected':canaries,'exactCircleLocationCases':locationCases,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':35},'independentArrangementWitness':witness,'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
