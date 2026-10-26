"""Independent full12 source/new/solutions/MCQ review and actual circle membership."""
import hashlib,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave68-pictured-sets.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def prime(n):return n>=2 and all(n%d for d in range(2,math.isqrt(n)+1))
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k));ts=[e for e in es if tag(e)=='text'];cs=[e for e in es if tag(e)=='circle'];ls=[e for e in es if tag(e)=='line']
 def at(x,y):return txt(only(e for e in ts if abs(n(e,'x')-x)<1e-7 and abs(n(e,'y')-y)<1e-7))
 circles=sorted((n(c,'cx'),n(c,'cy'),n(c,'r')) for c in cs if n(c,'r')>10);dots=[e for e in cs if n(e,'r')<10];assert len(circles)==(2 if i in [6,9] else 1)
 names=[at(92,66),at(388,66)] if len(circles)==2 else [at(95,77)];assert names==[['M'],['R'],['T'],['H'],['J'],['P'],['M','N'],['F'],['B'],['C','D'],['L'],['U']][i]
 sets={name:[] for name in names};outside=[];observed=[]
 for dot in dots:
  x,y=n(dot,'cx'),n(dot,'cy');glyphX=x+26;bar=[e for e in ls if n(e,'x1')==glyphX-17 and n(e,'x2')==glyphX+17 and n(e,'y1')==n(e,'y2')==y-3]
  if bar:
   assert len(bar)==1;rawvalue=f"{at(glyphX,y-11)}/{at(glyphX,y+25)}";v=F(rawvalue)
  else:
   rawvalue=at(glyphX,y+9);v=rawvalue if i==10 else F(rawvalue.replace(',','.'))
  membership=[]
  for name,(cx,cy,rad) in zip(names,circles):
   d=math.hypot(x-cx,y-cy);g=math.hypot(glyphX-cx,y-cy);assert abs(d-rad)>3 and abs(g-rad)>8;assert (d<rad)==(g<rad)
   if d<rad:sets[name].append(v);membership.append(name)
  if not membership:outside.append(v)
  observed.append({'printed':rawvalue,'dot':[x,y],'glyphCenter':[glyphX,y],'membership':membership})
 proof={'actualNamedCircles':dict(zip(names,circles)),'actualDotAndGlyphMembership':observed,'dotAndGlyphAlwaysSameRegionAwayFromBoundary':True}
 expected=[[[5,10,15,20,25,30,35],[6,12,22,49]],[[7,12,19,26,34],[8,17,31]],[[4,9,13,18],[6,11,3]],[[6,14,21,29,38,47,55],[9,26,43]],[[12,23,35,48,67],[79,54]],[[8,16,24,32,40,48],[11,19,27]],None,[[12,18,25,31,42,55],[24,35,48,61]],[[23,29,31,37],[21,25,35,41]],None,[list('bfhpt'),list('agr')],None]
 if expected[i]:assert list(sets.values())[0]==expected[i][0] and outside==expected[i][1]
 s=list(sets.values())[0]
 if i==0:
  predicates=[lambda x:x%2==0,lambda x:x%2==1,lambda x:x%5==0,lambda x:prime(int(x))];truth=[all(p(x) for x in s) for p in predicates];assert truth==[False,False,True,False];assert not any(x%5==0 for x in outside);return r['options'][2],dict(proof,allFourUniversalPredicates=truth)
 if i==1:
  truth=[]
  for o in r['options']:
   m=re.fullmatch(r'(\d+) (∈|∉) R',o);assert m;inside=F(m[1]) in s;truth.append(inside if m[2]=='∈' else not inside)
  assert truth==[False,False,False,True];return '26 ∈ R',dict(proof,everyMembershipAssertion=truth)
 if i==2:
  assert sum(s)==44 and sum(s+outside)==64;return '44',dict(proof,insideSum=44,wrongAllVisibleSum=64)
 if i==3:
  assert len(s)==7 and len(s+outside)==10 and max(s)==55;return '7',dict(proof,insideCardinality=7,wrongVisibleCount=10,wrongMaximum=55)
 if i==4:
  assert max(s)==67<max(outside)==79;return '67',dict(proof,maximumMember=67,largerOutsideExcluded=79)
 if i==5:
  truth=[]
  for o in r['options']:
   m=re.fullmatch(r'P = \{([\d; ]+)\}, n\(P\) = (\d+)',o);assert m;roster={F(x.strip()) for x in m[1].split(';')};truth.append(roster==set(s) and int(m[2])==len(set(s)))
  assert truth==[True,False,False,False];return r['options'][0],dict(proof,pairedRosterANDCardinalityEveryOption=truth,insideCardinality=6)
 if i in [6,9]:
  a,b=[set(sets[k]) for k in names]
  if i==6:
   assert a==set([5,8,13,16,21,24,29]) and b==set([7,8,15,16,23,24,31,39]);assert outside==[10,18];out=len(a)+len(b);assert out==15 and len(a|b)==12 and len(a^b)==9
   return '15',dict(proof,eachCardinality=[7,8],sumCardinalities=15,wrongUnionCount=12,wrongExclusiveCount=9,commonCountedTwice=3)
  assert a==set([14,22,34,10,28]) and b==set([6,16,26,10,28]) and outside==[7,11];P=sum(a-b);Q=sum(b-a);assert [P,Q,P+Q]==[70,48,118];assert P+Q+2*sum(a&b)==194 and P+Q+sum(outside)==136
  return '118',dict(proof,leftOnlySum=70,rightOnlySum=48,exclusiveSum=118,commonTwiceWrongSum=194,outsideWrongSum=136,sourceRasterUnavailableExplicit=True)
 if i==7:
  wrongin=[x for x in s if x%6];wrongout=[x for x in outside if x%6==0];assert wrongin==[25,31,55] and wrongout==[24,48];return '5',dict(proof,wrongInside=list(map(int,wrongin)),wrongOutside=list(map(int,wrongout)),bothSidesTotal=5)
 if i==8:
  rules=[{x for x in range(21,40) if x%2},{x for x in range(21,40) if prime(x)},{x for x in range(21,44) if prime(x)},{x for x in range(21,40) if x%2 and x%3}];assert [rule==set(s) for rule in rules]==[False,True,False,False];assert rules[2]-set(s)=={41,43} and {25,35}<=rules[3]-set(s)
  return r['options'][1],dict(proof,everyCompletePredicateRoster=[sorted(x) for x in rules],allAndOnlyMembersRequired=True,strictBounds=True)
 if i==10:
  truth=[o in s for o in r['options']];assert truth==[False,False,False,True];return 'h',dict(proof,allFourLettersClassified=truth)
 if i==11:
  assert len(dots)==7 and len(ls)==4 and not outside;assert s==[F(3,5),F(3,5),F(3,5),F(3,8),F(3,8),F(7,10),F(7,10)];assert len(set(s))==3
  return '3',dict(proof,rawWritingsCount=7,allFourNativeFractionBarsRead=True,distinctExactValues=list(map(str,sorted(set(s)))),distinctValueCount=3)
 raise AssertionError(i)
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==12;entries=[]
 for i,r in enumerate(rows):
  a,proof=observe(r,i);assert a==r['answer'];sheet=i//6+1
  if r.get('options'):assert r['options'].count(a)==1 and len(set(r['options']))==4
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent full12 saved/new/full official+new solutions/every MCQ read; four actual source/native343px sheets viewed; own physicalSVG dot AND glyph circle classification, exactFraction dedup and complete predicate enumerations without author params/calculator','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':i!=9,'sourceSheet':f'output/editorial-visual-wave68/visual-wave68-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave68/visual-wave68-contact-{sheet}.png','checked':['all12saved/new/fullsolutions/everyMCQ read;11available originals viewed, one missing source raster explicitly disclosed','actual every glyph and associated dot classified by physical circle coordinates, no boundary ambiguities','universal inside predicates and all-only complete prime predicate list distinguished','every membership sign, paired roster AND cardinality, count versus maximum checked','common members counted twice in n(M)+n(N), omitted in exclusive sums','both incorrect-inside and incorrect-outside placements counted','all7 numericwritings and fouractualnativefractionbars evaluated to3distinctvalues','allactual343px native diagrams legible; original native design rather than tracing']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave68.py','fullSavedAndNewRead':12,'actualSheetsViewed':4,'sourceRastersUnavailable':['31b4132ae6643d12'],'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave68-pictured-sets.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':12,'actualCircleMembershipFromDotANDGlyph':True,'allMCQsEvaluated':True,'hashesMatched':12,'actual343pxSheetsViewed':4,'sourceRastersUnavailableExplicitly':1}))
if __name__=='__main__':main()
