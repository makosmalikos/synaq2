"""All5full source/newMCQconditions and complete official/newsolutions/all20source
and20newoptions read. Source6longsideapproximationiswrong; correctoriginal
answer independentlyprovenbywholeboundarytileedgecounts. Newimpossiblechoice
has exactlongsidegreaterthancontainerdiagonal certificate. Same root author
separate exact computation, not anotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2023-stage2-mcq';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('stage2open','scripts/editorial/review-altynsaka-2023-stage2-open.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;E=P.E;H=P.H;one=H.one;exact=P.exact
opts=lambda r:[o['text']if isinstance(o,dict)else o for o in r['options']]
scalar=lambda s:exact(H.tex(s))

def crypt(r,src):
 s=r['statement'];words=re.findall(r'\\overline\{\\text\{([^}]+)\}\}',s)if src else re.findall(r'overline\(([A-Z]+)\)',s);left,right,targetNum,targetDen=words;assert len(left)==len(targetNum)==len(targetDen)==3 and len(right)==4;A,B=left[:2];C,D=right[0],right[2];assert len({A,B,C,D})==4 and left==A+B+A and right==C+A+D+A and targetNum==B+A+B and targetDen==left;given=F(*map(int,H.numeric_tokens(s)));letters=[A,B,C,D];solutions=[]
 def value(word,env):return int(''.join(str(env[v])for v in word))
 for ds in itertools.permutations(range(10),4):
  env=dict(zip(letters,ds))
  if any(env[word[0]]==0 for word in words):continue
  l,rr,tn,td=[value(word,env)for word in words]
  if F(l,rr)==given:solutions.append((env,l,rr,tn,td))
 env,leftValue,rightValue,num,den=one(solutions);out=F(num,den);alternatives=list(map(scalar,opts(r)));digitRatio=F(env[B],env[A]);assert alternatives==[given,out,1/out,digitRatio]and len(set(alternatives))==4;assert scalar(r['answer'])==out;return out,{'actualFourRepeatedLetterWords':words,'actualGivenReducedRatio':str(given),'all5040FourDistinctDigitAssignmentsChecked':math.perm(10,4),'allWordLeadingDigitsNonzero':True,'allMatchingDigitAssignments':[env],'uniqueKnownAndTargetUnreducedPairs':[[leftValue,rightValue],[num,den]],'allFourOriginalGivenCorrectReciprocalDigitRatioOptionRolesPreserved':True,'reversedTripleRatioTarget':str(out)}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  expression=one(H.math_parts(s,src));out=exact(H.tex(expression));values=list(map(scalar,opts(r)));assert values==[out-F(2,5),out,out+F(6,5),out+F(18,5)]and scalar(r['answer'])==out;proof={'actualFullSixTermExpression':expression,'exactFractionArithmeticWithoutBinaryFloats':True,'allFourOriginalOptionOffsetsPreserved':True,'fullExpressionTarget':str(out)}
 elif i==2:
  rank=one(v for word,v in[('Төртінші',4),('Үшінші',3)]if word in s)
  if src:body=one(H.math_parts(s,True));texts=body.split(';')
  else:texts=one(s.split('Сандар:')[1:]).strip().rstrip('.').split(',')
  values=[scalar(v)for v in texts];assert len(values)==len(set(values))==5;ordered=sorted(values);out=ordered[rank-1];alternatives=list(map(scalar,opts(r)));assert[ordered.index(v)+1 for v in alternatives]==[3,2,1,4]and scalar(r['answer'])==out;proof={'actualFiveInputValues':list(map(str,values)),'allExactSortedValues':list(map(str,ordered)),'actualRequestedOneBasedRank':rank,'allFourOriginalAnswerOptionRanks':[3,2,1,4],'askedOrderStatisticTarget':str(out)}
 elif i==6:
  if src:width,height,count=n
  else:width,height=n;count=F(6);assert'алты бірдей'in s
  assert width>height>0 and count==6;ratios=list(map(scalar,opts(r)));assert len(set(ratios))==4;area=width*height/count;grids=[]
  for cols in range(1,int(count)+1):
   if count%cols==0:
    rows=count/cols;a,b=width/cols,height/rows;grids.append({'cols':cols,'rows':int(rows),'smallWidth':str(a),'smallHeight':str(b),'longShortRatio':str(max(a,b)/min(a,b))})
  expected=[(width/2)/(height/3),max(width/3,height/2)/min(width/3,height/2),height/(width/6)];assert ratios[:3]==expected and all(any(F(g['longShortRatio'])==v for g in grids)for v in ratios[:3]);bad=ratios[3];longSquared=area*bad;shortSquared=area/bad;proof={'actualBigWidthHeightAndTileCount':list(map(str,[width,height,count])),'eachCongruentTileArea':str(area),'allFourRectangularGridTilings':grids,'allFirstThreeOptionsHaveCompleteSixTileGridWitnesses':True,'impossibleOptionLongAndShortSquared':list(map(str,[longSquared,shortSquared]))}
  if src:
   assert(width,height,bad)==(5,2,F(15,2))and(longSquared,shortSquared)==(F(25,2),F(2,9));assert longSquared<width**2
   # A finite rectangular partition covers the bottom boundary by whole tile
   # edges. Each of the six tiles contributes at most one edge there. Its
   # lengths are (5/2)*sqrt(2) and (1/3)*sqrt(2), independent of tile rotation.
   # Test every possible nonnegative pair of boundary edge counts exactly.
   possible=[(a,b)for a in range(7)for b in range(7-a)if a+b and 2*(F(5*a,2)+F(b,3))**2==width**2];assert not possible;proof.update({'originalOfficialLongSideApproximationIncorrect':True,'actualLongSideSquaredIs25Over2NotGreaterThan25':True,'wholeBottomBoundaryMustBeSumOfAtMostSixCompleteTileEdges':True,'allNonnegativeBoundaryEdgeCountsThroughSixTested':sum(1 for a in range(7)for b in range(7-a)if a+b),'allPossibleSqrtTwoBoundaryEdgeLengthSumsRejectedExactly':True,'impossibilityDoesNotAssumeInteriorTilesAxisParallel':True})
  else:diagonalSquared=width**2+height**2;assert longSquared>diagonalSquared;proof.update({'containerDiagonalSquared':str(diagonalSquared),'longSideExceedsEveryPossibleContainerSegmentLength':True,'impossibleEvenIfRotatingSmallRectangles':True})
  out=bad;assert scalar(r['answer'])==out;proof['impossibleRatioTarget']=str(out)
 elif i==11:
  equation=one(H.math_parts(s,src));out,details=E.equation(H.tex(equation));l,rhs=H.tex(equation).split('=');assert out!=0;reciprocal=1/out;whole=reciprocal.numerator//reciprocal.denominator;part=reciprocal-whole;assert part>0;values=list(map(scalar,opts(r)));assert values==[reciprocal,1/part,out,part]and scalar(r['answer'])==out;proof={'actualWholeEquation':equation,'uniqueCrossMultipliedRootProof':details,'actualReciprocalAsImproperFraction':str(reciprocal),'actualFractionalPartOfReciprocal':str(part),'allFourOriginalReciprocalFractionalPartOptionRolesPreserved':True,'originalNonzeroUnknownDomainPreserved':True,'equationRootTarget':str(out)}
 elif i==20:out,proof=crypt(r,src)
 else:raise AssertionError(i)
 proof['allFourOptionsChecked']=True;proof['answerChecked']=True;return proof

def mutation(r,i):
 d=copy.deepcopy(r);s=d['statement']
 if i==1:d['statement']=s.replace('× 20','× 24');d['options']=['53.6','54','55.2','57.6']
 elif i==2:d['statement']=s.replace('Төртінші','Үшінші')
 elif i==6:d['statement']=s.replace('7 : 3','8 : 3');d['options']=['4 : 1','16 : 9','9 : 4','24 : 1']
 elif i==11:d['statement']=s.replace('− 3.5','− 4.5');d['options']=['(71/8)','(8/7)','(8/71)','(7/8)']
 elif i==20:d['statement']=s.replace('(1/3)','(3/13)');d['options']=['(3/13)','(22/15)','(15/22)','(8/5)']
 assert d['statement']!=s;return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==5 and{r['params']['number']for r in rows}=={1,2,6,11,20};openRows=json.loads((ROOT/'problems/editorial/batches/altynsaka-2023-stage2-open.json').read_text())['editions'];assert len(openRows)==15 and len({r['params']['number']for r in rows+openRows})==20;entries=[];evidence=[];equalities=0;changedAnswers={1:'54',2:'(90/151)',6:'24 : 1',11:'(8/71)',20:'(22/15)'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and len(q['options'])==4 and not q['images'];answer=one(o['text']for o in q['options']if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError,ZeroDivisionError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('validchangedmath',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and len(r['options'])==4 and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All5full source/newconditions and fullofficial/newsolutions/all20source+20newoptions read. Exactfractiondecimalfullsum andoffsetroles, allrationalranks, all4sixrectanglegridtilings andsourceirrationalboundaryedgecountcertificatecorrectingwronglongsideapproximation/newexactcontainerdiagonalcertificate, uniqueoriginal-domainreciprocalequationandall4rolevalues, all5040fourletterdigitassignments withallleadingdigitsnonzero andallgiven/correct/inverse/digit-ratiooptions checked. Everyvalidchangedinputrejectsoldkeyandacceptsrecomputedkey. Completes15openquestions. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,overlines=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){overlines++;walk(n.content)}else if(n.type==='mixed'){mixed++;walk([n.fraction])}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,overlines,mixed}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':5,'fullSourceNewConditionsAndSolutionsRead':5,'capturedMCQKeys':5,'sourceOptionsRead':20,'rewrittenOptionsRead':20,'wrongKeysRejected':5,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':5,'nativeFractions':native['fractions'],'nativeOverlines':native['overlines'],'nativeMixedNumbers':native['mixed'],'source6WrongApproximationCorrectedByIndependentProof':True,'completeCollectionWithOpen15':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':5,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
