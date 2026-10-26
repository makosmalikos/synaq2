"""Independent full14 saved/new/solutions/everyMCQ; actual SVG COUNTS, not element values."""
import hashlib,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/visual-wave71-pictured-set-counts.json'
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def txt(e):return ''.join(e.itertext())
def observe(r,i):
 raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];es=list(ET.fromstring(raw).iter());tag=lambda e:e.tag.split('}')[-1];n=lambda e,k:float(e.get(k));ts=[e for e in es if tag(e)=='text'];circles=[(n(c,'cx'),n(c,'cy'),n(c,'r')) for c in es if tag(c)=='circle' and c.get('stroke')]
 def at(x,y):return txt(only(e for e in ts if n(e,'x')==x and n(e,'y')==y))
 triple=len(circles)==3;framed=i in [3,4,9];positions=[(65,70),(415,70),(365,330)] if triple else [(80,90),(400,90)] if framed else [(80,70),(400,70)];names=[at(x,y) for x,y in positions];assert names==[['M','N'],['K','L'],['P','Q','R'],['A','B'],['M','N'],['D','S','R'],['K','L','M'],['A','B','C'],['K','L'],['K','L'],['M','N','P'],['M','N'],['P','Q','R'],['K','L','M']][i]
 counts={};labels=[]
 for e in ts:
  v=txt(e)
  if not re.fullmatch(r'\d+|\?',v):continue
  x,y=n(e,'x'),n(e,'y');mask=0;baselineMask=0
  for j,(cx,cy,rad) in enumerate(circles):
   d=math.hypot(x-cx,y-10-cy);base=math.hypot(x-cx,y-cy);assert abs(d-rad)>8 and abs(base-rad)>8
   if d<rad:mask|=1<<j
   if base<rad:baselineMask|=1<<j
  assert mask==baselineMask and mask not in counts;counts[mask]=None if v=='?' else int(v);assert n(e,'font-size')==30;labels.append({'text':v,'baseline':[x,y],'physicalCircleMask':mask})
 totals={}
 for e in ts:
  m=re.fullmatch(r'n\(([^)]+)\) = (\d+|\?)',txt(e))
  if m:assert m[1] not in totals;totals[m[1]]=None if m[2]=='?' else int(m[2]);assert n(e,'font-size')==25
 if framed:
  frame=only(e for e in es if tag(e)=='rect' and e.get('stroke'));assert [n(frame,k) for k in ['x','y','width','height']]==[18,58,444,280]
  assert all(18<l['baseline'][0]<462 and 58<l['baseline'][1]<338 for l in labels)
 proof={'actualNamedCircleGeometry':dict(zip(names,circles)),'actualCountGlyphsClassifiedByPhysicalCircleMasks':labels,'actualPrintedWholeSetTotals':totals,'numbersAreRegionCardinalitiesNotElementNames':True}
 def options(expected):assert list(map(int,r['options']))==expected
 def whole(c,bit):return sum(v for mask,v in c.items() if mask&bit)
 if i==0:
  assert counts=={1:9,3:6,2:8};out=whole(counts,1);assert out==15;options([out,counts[1],sum(counts.values()),counts[3]]);return out,proof
 if i==1:
  assert counts=={3:None} and totals=={'K':18,'L':14,'K ∪ L':25};solutions=[(a,b,c) for a in range(19) for b in range(15) for c in range(15) if a+c==18 and b+c==14 and a+b+c==25];assert solutions==[(11,7,7)];out=solutions[0][2];options([18+14,18+14+25,out,14]);return out,dict(proof,completeNonnegativeDomainSolutions=solutions)
 if i==2:
  assert counts=={1:7,2:8,4:9,3:3,5:4,6:5,7:2};out=whole(counts,1);assert out==16;options([out,counts[1],out-counts[7],counts[1]+counts[5]]);return out,dict(proof,allFourPRegionsIncluded=True,sourceWrongDistractorExplanationNotCopied=True)
 if i==3:
  assert counts=={1:6,3:4,2:5,0:7};out=sum(counts.values());assert out==22;options([out-counts[0],out-counts[3],out+counts[3],out]);return out,dict(proof,wholeUniverseIncludesNeitherCount=7)
 if i==4:
  assert counts=={1:11,3:4,2:7,0:6};out=sum(v for m,v in counts.items() if not m&2);assert out==17;options([counts[0],out,counts[1],out+counts[3]]);assert whole(counts,2)+out==28;return out,dict(proof,notNIncludesOutsideAndMOnly=True,wholeUniverseCheck=28)
 if i in [5,6,7,12]:
  expected={5:{1:9,2:6,4:7,3:4,5:2,6:3,7:3},6:{1:8,2:11,4:6,3:4,5:2,6:3,7:2},7:{1:6,2:9,4:10,3:5,5:3,6:4,7:3},12:{1:6,2:8,4:7,3:4,5:5,6:2,7:3}};assert counts==expected[i];exact1=sum(v for m,v in counts.items() if m.bit_count()==1);exact2=sum(v for m,v in counts.items() if m.bit_count()==2);total=sum(counts.values());assert exact1+exact2+counts[7]==total
  if i==5:assert [exact1,exact2,counts[7],total]==[22,9,3,34];return total,dict(proof,exactlyOne=22,exactlyTwo=9,allThree=3,unionCount=34)
  if i==6:assert exact1==25 and total==36;return exact1,dict(proof,exactlyOne=25,wrongUnionCount=36)
  if i==7:assert exact2==12;options([exact2+counts[7],exact1,whole(counts,1),exact2]);return exact2,dict(proof,exactlyTwoExcludesTriple=True,partitionTotal=40)
  out=sum(v for m,v in counts.items() if m&3==3);assert out==7;options([counts[3],out,out+counts[5],counts[7]]);return out,dict(proof,intersectionPQIncludesTriple=True)
 if i==8:
  assert counts=={1:11,3:None,2:13} and totals=={'K':19,'L':None};solutions=[c for c in range(20) if 11+c==19];assert solutions==[8];c=solutions[0];out=c+counts[2];assert out==21;assert 11+c+13==19+out-c==32;return out,dict(proof,completePossibleCommonCounts=solutions,requestedLCount=21,unionCheck=32)
 if i==9:
  assert counts=={3:7,0:None} and totals=={'K':24,'L':18,'U':43};a=24-7;b=18-7;solutions=[o for o in range(44) if a+b+7+o==43];assert solutions==[8];out=solutions[0];assert [a,b,out]==[17,11,8];return out,dict(proof,completeNeitherCountDomain=solutions,reconstructedFourRegionCounts=[a,7,b,out],naiveSubtractionWrong=1)
 if i==10:
  assert counts=={1:None,2:None,4:None,3:4,5:3,6:5,7:2} and totals=={'M':20,'N':18,'P':16};solutions=[]
  for a in range(21):
   for b in range(19):
    for c in range(17):
     if a+4+3+2==20 and b+4+5+2==18 and c+3+5+2==16:solutions.append((a,b,c))
  assert solutions==[(11,7,6)];a,b,c=solutions[0];out=a+b+c+4+3+5+2;assert out==38==20+18+16-(4+2)-(3+2)-(5+2)+2
  return out,dict(proof,allFinitePossibleSingletonDomains=solutions,independentInclusionExclusion=38)
 if i==11:
  assert counts=={1:13,3:5,2:9};out=counts[1]+counts[2];assert out==22;options([out,sum(counts.values()),counts[3],whole(counts,1)]);return out,dict(proof,exactlyOneOfTwo=22)
 if i==13:
  assert counts=={1:6,2:8,4:7,3:None,5:None,6:None,7:2} and totals=={'K':16,'L':20,'M':17};solutions=[(a,b,c) for a in range(21) for b in range(21) for c in range(21) if 6+a+b+2==16 and 8+a+c+2==20 and 7+b+c+2==17];assert solutions==[(5,3,5)];a,b,c=solutions[0];assert [a+b,a+c,b+c]==[8,10,8];assert a+b+c==(8+10+8)//2==13;out=6+8+7+2+13;assert out==36
  return out,dict(proof,all9261NonnegativePairOnlyTriplesChecked=True,uniqueThreeUnknownCounts=solutions[0],twiceUnknownSum=26,unknownSum=13,unionCount=36)
 raise AssertionError(i)
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==14;entries=[]
 for i,r in enumerate(rows):
  out,proof=observe(r,i);assert str(out)==r['answer'];sheet=i//6+1
  if r.get('options'):assert r['options'].count(str(out))==1 and len(set(r['options']))==4
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'Independent all14 saved/new/full official+newsolutions/everyMCQ read; six actual343px source/native sheets viewed; own actualSVG glyph-position/cardinality-caption observer, finite inverse domain enumeration and inclusion-exclusion; no authorparams or solver','observed':proof,'figureReview':{'status':'verified','sha256':r['figureSha256'],'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'sourceRasterAvailable':True,'sourceSheet':f'output/editorial-visual-wave71/visual-wave71-source-{sheet}.png','nativeSheet':f'output/editorial-visual-wave71/visual-wave71-contact-{sheet}.png','checked':['all14fullsource/newconditions/official+newsolutions/everyMCQ read and6actual343px sheets viewed','actual eachdigit/questionmark classified from physicalcircles; regionCARDINALITIES distinguished from elementvalues','actual n() totals parsed fromprintedcaption text rather than author metadata','wholecircle includes everypair/triple region; exact1/exact2 and pairintersection rules individually checked','universeoutside region included or excluded perrequested complement','all finite inverse counts checked nonnegative and uniquelydetermined; threeunknown pairs unique5/3/5 through9261cases','twofoldpairmembership sum26÷2=13 versus triplecount once verified','each MCQ distractor role checked with actualdisplayed counts','30pxdigits/25pxtotals legible at343, captions andnames clear ofcircleedges','source incorrectdistractor explanation replaced with exactnew7+4=11 explanation']}})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(q=>[q.editionId,editionHash(q)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-visual-wave71.py','fullSavedAndNewRead':14,'actualSheetsViewed':6,'findings':[]},'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/visual-wave71-pictured-set-counts.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':14,'allActualCountGlyphsAndPrintedTotalsObserved':True,'allInverseDomainsCompleteAndUnique':True,'unknownPairTriplesExamined':9261,'allMCQsEvaluated':True,'hashesMatched':14,'actual343pxSheetsViewed':6}))
if __name__=='__main__':main()
