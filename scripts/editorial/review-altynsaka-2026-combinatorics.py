"""All7full source/newconditions and complete official/newsolutions for14..20
read. First13sourceMCQs remain separate editorialwork. Same root author
separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2026-combinatorics';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('school2023','scripts/editorial/review-altynsaka-2023-school.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;H=P.H;one=H.one;exact=P.exact

def partitions(count,total):
 def dfs(start,k,left):
  if k==0:return[()]if left==0 else[]
  if k*start+k*(k-1)//2>left:return[]
  out=[]
  for first in range(start,left//k+1):
   if k*first+k*(k-1)//2>left:break
   out.extend((first,)+tail for tail in dfs(first+1,k-1,left-first))
  return out
 return dfs(1,count,total)

def domino(cols):
 size=2*cols;full=(1<<size)-1
 def fill(mask,tiles):
  if mask==full:return[tuple(sorted(tiles))]
  first=next(j for j in range(size)if not(mask>>j)&1);r,c=divmod(first,cols);out=[]
  for second in([first+1]if c+1<cols else[])+([first+cols]if r==0 else[]):
   if not(mask>>second)&1:out.extend(fill(mask|(1<<first)|(1<<second),tiles+[(first,second)]))
  return out
 tilings=fill(0,[]);assert len(tilings)==len(set(tilings))and all(len(t)==cols for t in tilings)
 for tiles in tilings:
  assert sorted(v for pair in tiles for v in pair)==list(range(size))
  for a,b in tiles:assert(abs(a-b)==1 and a//cols==b//cols)or b-a==cols
 terms=[1,1]
 for width in range(2,cols+1):terms.append(terms[-1]+terms[-2])
 assert len(tilings)==terms[cols];return F(len(tilings)),{'actualBoardRowsCols':[2,cols],'allPhysicalDominoPlacementTilingsEnumerated':len(tilings),'allTilingsHaveNoOverlapAndCoverEachCellOnce':True,'allDistinctTilingsCanonicalizedWithoutTileLabels':True,'independentWidthRecurrenceFromEmptyBoard':terms,'tilingCountTarget':str(len(tilings))}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==14:
  count=one(v for word,v in[('жеті',7),('сегіз',8),('тоғыз',9)]if word+' натурал'in s);total=int(one(n));valid=partitions(count,total);assert valid;differences={v[-1]-v[0]for v in valid};out=F(one(differences));assert all(len(v)==count and len(set(v))==count and min(v)>0 and sum(v)==total for v in valid);proof={'actualDistinctNaturalCount':count,'actualGivenTotal':total,'minimumPossibleDistinctNaturalSum':count*(count+1)//2,'allFeasibleStrictlyIncreasingNaturalSets':valid,'allValidSetRanges':sorted(differences),'prunedSearchUsesNecessaryStrictRemainingSumLowerBound':True,'largestMinusSmallestTarget':str(out)}
 elif i==15:
  red,blue=map(int,n[:2]);assert src and n[2:]==[2,2]or not src and'Екі қызыл және екі көк'in s;rp=list(itertools.combinations(range(red),2));bp=list(itertools.combinations(range(blue),2));choices=list(itertools.product(rp,bp));assert len(choices)==len(set(choices));out=F(len(choices));assert out==math.comb(red,2)*math.comb(blue,2);proof={'actualRedBlueStocks':[red,blue],'allUnorderedRedPairs':len(rp),'allUnorderedBluePairs':len(bp),'allDistinctColorPairProductsEnumerated':len(choices),'itemsDistinguishableSelectionOrderExcluded':True,'combinedSelectionCountTarget':str(out)}
 elif i==16:
  rows,cols,tileR,tileC=map(int,n);assert(rows,tileR,tileC)==(2,1,2);out,proof=domino(cols)
 elif i==17:
  a,b=map(int,n);divisors=[d for d in range(1,min(a,b)+1)if a%d==b%d==0];gcd=math.gcd(a,b);assert divisors==[d for d in range(1,gcd+1)if gcd%d==0];out=F(sum(divisors));proof={'actualBothNumbers':[a,b],'allPositivePotentialCommonDivisorsChecked':min(a,b),'actualGreatestCommonDivisor':gcd,'allCommonPositiveDivisors':divisors,'directDivisibilityListEqualsGCDDivisorList':True,'commonDivisorSumTarget':str(out)}
 elif i==18:
  count=int(one(n));triples=list(itertools.combinations(range(count),3));points=[(F(1-t*t,1+t*t),F(2*t,1+t*t))for t in range(count)];assert len(set(points))==count and all(x*x+y*y==1 for x,y in points)
  for i1,i2,i3 in triples:a,b,c=points[i1],points[i2],points[i3];assert(b[0]-a[0])*(c[1]-a[1])!=(b[1]-a[1])*(c[0]-a[0])
  out=F(len(triples));assert out==math.comb(count,3);proof={'actualDistinctCirclePointCount':count,'universalLineCircleQuadraticHasAtMostTwoIntersections':True,'exactRationalUnitCircleWitnessAllPointsDistinct':True,'everyWitnessThreePointDeterminantNonzero':True,'allUnorderedPointTriplesEnumerated':len(triples),'triangleCountTarget':str(out)}
 elif i==19:
  pairs=int(one(n));possible=[k for k in range(1,pairs+2)if math.comb(k,2)==pairs];count=one(possible);pairList=list(itertools.combinations(range(count),2));tripleList=list(itertools.combinations(range(count),3));assert len(pairList)==pairs;out=F(len(tripleList));proof={'actualGivenUnorderedPairCount':pairs,'allFeasibleGroupSizes':possible,'allConcretePairsRecounted':len(pairList),'allConcreteTriplesEnumerated':len(tripleList),'uniquePositiveGroupSizeFromStrictlyIncreasingPairCounts':True,'tripleSelectionCountTarget':str(out)}
 elif i==20:
  a,b,c=map(int,n[:3]);assert src and n[3:]==[2]or not src and'әртүрлі екі қаламды'in s;colors=[0]*a+[1]*b+[2]*c;valid=[(i1,i2)for i1,i2 in itertools.combinations(range(len(colors)),2)if colors[i1]!=colors[i2]];out=F(len(valid));assert out==a*b+a*c+b*c==math.comb(a+b+c,2)-sum(math.comb(v,2)for v in[a,b,c]);proof={'actualThreeColorStocks':[a,b,c],'allUnorderedDistinctItemPairsChecked':math.comb(len(colors),2),'allDifferentColorPairsEnumerated':len(valid),'colorPairCaseCounts':[a*b,a*c,b*c],'caseSumEqualsFullPairEnumerationAndComplement':True,'twoDifferentColorSelectionCountTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 if i==14:return{**r,'statement':r['statement'].replace('сегіз натурал','тоғыз натурал').replace('қосындысы 37','қосындысы 46')}
 a,b={15:('5 қызыл','6 қызыл'),16:('2 × 7','2 × 8'),17:('48 және','36 және'),18:('9 әртүрлі','10 әртүрлі'),19:('28 тәсілі','36 тәсілі'),20:('5 жасыл','6 жасыл')}[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==7 and {r['params']['number']for r in rows}==set(range(14,21));entries=[];evidence=[];equalities=0;changedAnswers={14:'9',15:'225',16:'34',17:'91',18:'120',19:'84',20:'54'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and not q['images']and q['solution'];answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('validchangedinput',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('options')and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All7full source/newconditions and completeofficial/newsolutions read. Completeprunedstrictnaturalpartitions, everyredpair×bluepair, actualallbitboarddomino placementswith nooverlapfullcoverage crossindependentrecurrence, allpositivecommondivisorscrossGCD, everyunorderedcircletriple andexactrationalunitcirclewitnessdeterminants, uniquegroupsizeandfullpair/tripleenumeration, everyunorderedcoloreditempair crosscolorcases/complement checked. Allvalidchangedinputsrejectoldkeyandacceptrecomputedkey. First13sourceMCQsremainseparate. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':7,'fullSourceNewConditionsAndSolutionsRead':7,'capturedOpenKeys':7,'wrongKeysRejected':7,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':7,'nativeFigures':0,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':7,'sourceMCQs1to13StillSeparate':True,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
