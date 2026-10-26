"""Independent full9saved/new8 review; actual nested circles, finite sets and exhaustive subsets."""
import hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave69-pictured-subsets.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def roster(o):return {int(x.strip()) for x in re.fullmatch(r'\{([\d; ]+)\}',o)[1].split(';')}
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k));ts=[e for e in es if tag(e)=='text'];cs=[e for e in es if tag(e)=='circle']
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 circles=[(n(c,'cx'),n(c,'cy'),n(c,'r')) for c in cs if n(c,'r')>10];dots=[e for e in cs if n(e,'r')<10]
 namepositions={0:[(118,72),(142,214)],1:[(167,94),(121,199),(237,233),(403,166)],2:[(118,72),(142,214)],3:[(127,75),(143,183),(277,229)],4:[(114,81),(135,155),(178,194)],5:[(118,72),(142,214)],6:[(118,72),(142,214)],7:[(130,75),(179,144),(339,212),(164,189),(217,242)]}[i];names=[at(x,y) for x,y in namepositions];assert names==[['X','Y'],['W','K','T','Z'],['G','H'],['L','M','N'],['R','S','T'],['A','B'],['A','B'],['E','F','G','H','J']][i];assert len(names)==len(circles)
 regions={name:set() for name in names};observed=[]
 for d in dots:
  x,y=n(d,'cx'),n(d,'cy');gx=x+22;v=int(at(gx,y+9));membership=[]
  for name,(cx,cy,rad) in zip(names,circles):
   dist=math.hypot(x-cx,y-cy);gd=math.hypot(gx-cx,y-cy);assert abs(dist-rad)>3 and abs(gd-rad)>6;assert (dist<rad)==(gd<rad)
   if dist<rad:regions[name].add(v);membership.append(name)
  assert membership;observed.append({'value':v,'dot':[x,y],'glyphCenter':[gx,y],'membership':membership})
 contained=[]
 for (a,(x,y,rad)),(b,(X,Y,R)) in itertools.permutations(zip(names,circles),2):
  if math.hypot(x-X,y-Y)+rad<R:contained.append((a,b))
 proof={'actualNamedCircleGeometry':dict(zip(names,circles)),'actualDotANDGlyphMembership':observed,'physicalProperContainments':contained}
 if i==0:
  assert regions=={'X':{1,4,6,7,10,12,13,16,18,24},'Y':{6,12,18,24}};assert contained==[('Y','X')];return '10',dict(proof,innerCount=4,ringCount=6,totalOuterCount=10)
 if i==1:
  assert not dots;assert set(contained)=={('K','W'),('T','W')};truth=[]
  for o in r['options']:
   a,b=o.split(' ⊂ ');truth.append((a,b) in contained)
  assert truth==[False,False,False,True];assert 'бос емес' in r['statement'];return 'T ⊂ W',dict(proof,allFourContainmentChoices=truth,nonemptyExplicit=True)
 if i==2:
  assert regions=={'G':{8,16,24,32,5,11,17,23},'H':{8,16,24,32}};assert sum(regions['H'])==80 and sum(regions['G'])==136;return '80',dict(proof,requestedInnerSum=80,wrongOuterSum=136)
 if i==3:
  assert regions=={'L':{12,24,36,18,30,6,42},'M':{12,24,36},'N':{18,30}};truth=[roster(o)<=regions['M'] for o in r['options']];assert truth==[True,False,False,False]
  return '{12; 36}',dict(proof,everyFullProposedSetTested=truth,siblingRingAndAbsentElementTraps=True)
 if i==4:
  assert regions=={'R':{1,2,3,4,6,9,12,18,36},'S':{1,2,3,6,9,18},'T':{1,3}};divisors=lambda v:{x for x in range(1,v+1) if v%x==0};assert regions['R']==divisors(36) and regions['S']==divisors(18);assert regions['S']!=divisors(9);assert 36 not in regions['S'] and 36%18==0
  return r['options'][2],dict(proof,allDivisors18=sorted(divisors(18)),allDivisors36=sorted(divisors(36)),allDivisors9=sorted(divisors(9)),multiplesDifferBy36Witness=True)
 if i==5:
  A,B=regions['A'],regions['B'];assert A=={2,3,6,7,10,11,15} and B=={3,7,11,15};pairs=list(map(set,itertools.combinations(sorted(A),2)));inside=[p for p in pairs if p<=B];wanted=[p for p in pairs if not p<=B];assert [len(pairs),len(inside),len(wanted)]==[21,6,15];cross=[p for p in wanted if len(p&B)==1];ring=[p for p in wanted if not p&B];assert [len(cross),len(ring)]==[12,3]
  return '15',dict(proof,all21UnorderedPairs=[sorted(p) for p in pairs],innerPairs=6,notWhollyInB=15,independentCrossPlusRing=[12,3])
 if i==6:
  A,B=regions['A'],regions['B'];assert A=={1,3,5,7,12,15} and B=={5,12};extra=sorted(A-B);all16=[B|{v for j,v in enumerate(extra) if mask>>j&1} for mask in range(1<<len(extra))];solutions=[x for x in all16 if sum(x)==28];assert len(all16)==16 and solutions==[{1,3,5,7,12}];options=list(map(roster,r['options']));assert all(sum(x)==28 for x in options);truth=[B<=x<=A and sum(x)==28 for x in options];assert truth==[False,True,False,False];assert B<solutions[0]<A
  return '{1; 3; 5; 7; 12}',dict(proof,all16OptionalMasks=[{'set':sorted(x),'sum':sum(x)} for x in all16],uniqueSolution=sorted(solutions[0]),everyOptionSum28ButMembershipStillRequired=truth)
 if i==7:
  assert not dots and 'бос емес' in r['statement'];assert len(list(itertools.permutations(names,2)))==20;assert set(contained)=={('F','E'),('G','E'),('H','F'),('J','F'),('H','E'),('J','E')};assert len(contained)==6
  return '6',dict(proof,all20DistinctOrderedPairsChecked=True,directRelations=4,transitiveRelations=2,nonemptyExplicit=True,selfPairsExcluded=True)
 raise AssertionError(i)
def main():
 pack=json.loads((ROOT/PACK).read_text());rows=pack['editions'];assert len(rows)==8;assert pack['coverage']['sourceVisualOccurrences']==9;retained=pack['coverage']['previousEditionsRetained'];assert len(retained)==1 and retained[0]['sourceId']=='8bbb5b3def4784ea'
 bank=json.loads((ROOT/'backend/data/synaqAdaptedQuestions.json').read_text());old=only(q for q in bank if q['id']=='synaq_adapted_visual_nested_subsets');assert old['editorialStatus']=='verified' and old['minimumPlan']=='pro' and old['answer']=='16';assert all(ref['sourceId']!=retained[0]['sourceId'] for r in rows for ref in r['sourceRefs'])
 entries=[]
 for i,r in enumerate(rows):
  a,proof=observe(r,i);assert a==r['answer'];sheet=i//6+1
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(a)==1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all9saved/all8new/full official+new solutions/every MCQ read; four actual343px source/native sheets viewed; own physical circle containment and actual dot+glyph membership observer, every finite subset/pair/optional mask enumerated; no author params or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave69/visual-wave69-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave69/visual-wave69-contact-{sheet}.png','checked':['all9savedfullconditions/officialsolutions/MCQ and all8new fullconditions/fullsolutions/MCQ read; retained verified task not duplicated','actual glyph AND dot circle memberships agree away from boundaries','physical circle containment includes transitive relations, nonempty sets explicit','outer includes inner, inner excludes outer ring; count/sum distinguished','all4roster choices require EVERY element in target, sibling/ring/absent traps checked','middle includes smallest region and complete divisor list notmultiple predicate','all21unorderedpairs minus6inner equals15, independently12cross+3ring','all16optional masks and everyMCQ sum28 with membership constraints checked','all20distinctorderedpairs checked,4direct+2transitive containments','allactual343px diagrams legible with labelT inside intendedsmallcircle']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave69.py','fullSavedRead':9,'fullNewRead':8,'actualSheetsViewed':4,'retainedVerified':1,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave69-pictured-subsets.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':8,'sourceScope':9,'retainedVerifiedNotDuplicated':1,'actualDotANDGlyphObserved':True,'all21UnorderedPairs':True,'all16OptionalMasks':True,'all20OrderedContainments':True,'hashesMatched':8}))
if __name__=='__main__':main()
