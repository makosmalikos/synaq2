"""All14full frozen/newconditions and complete official/newsolutions/2source
rasters read, two343pxnativePNGs inspected. Same root author separate exact
computational check, not a separatehumanreviewer. Known cardmodelID reused.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo6-winter-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
T=module('tour5','scripts/editorial/review-femo3-tour3-grade5.py');G=module('winter4','scripts/editorial/review-femo6-winter-grade4.py');P=T.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def asset(i):
 f,sha={6:('bb3446b9b10cefa1eb2c5ca7','9cca84c0197fc55f08fa044df8a1cca7ceae861a97e860ec231f855e4661b83a'),12:('dddca3f781bb013ae05ec3a3','d38fb81a9c82bcc8343ea079039a493d777ed7795328862925ad249b1c6b8cd9')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def sign_graph(domains,edges,target):
 nodes=set(domains)|{v for e in edges for v in e};parents={k:[]for k in nodes}
 for a,b in edges:parents[b].append(a)
 roots=sorted(domains);order=[];remaining=set(nodes)
 while remaining:
  ready=[k for k in remaining if all(p in order for p in parents[k])];assert ready;order+=sorted(ready);remaining-=set(ready)
 bottom=one(k for k in nodes if not any(a==k for a,b in edges));solutions=[];allCases=[];exponents={k:[int(j==idx)for j in range(len(roots))]for idx,k in enumerate(roots)}
 for k in order:
  if parents[k]:assert len(parents[k])==2;exponents[k]=[sum(exponents[p][j]for p in parents[k])for j in range(len(roots))]
 for assignment in itertools.product(*(domains[k]for k in roots)):
  values=dict(zip(roots,assignment))
  for k in order:
   if parents[k]:values[k]=math.prod(values[p]for p in parents[k])
  allCases.append(values[bottom]);assert values[bottom]==math.prod(v**e for v,e in zip(assignment,exponents[bottom]))
  if values[bottom]==target:solutions.append(list(assignment))
 return F(len(solutions)),{'actualTopAllowedDomains':{k:v for k,v in domains.items()},'allTopAssignmentsChecked':len(allCases),'actualBottomRootExponents':exponents[bottom],'requiredBottomValue':target,'allMatchingTopAssignments':solutions,'fullGraphEvaluationEqualsExponentProduct':True,'assignmentCountTarget':str(len(solutions))}

def native_sign_graph(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects={id[5:]:tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('node-')};assert len(rects)==10;ys=sorted({y for x,y,w,h in rects.values()});assert[sum(y==yy for x,y,w,h in rects.values())for yy in ys]==[4,3,2,1];assert len({(w,h)for x,y,w,h in rects.values()})==1;labels={}
 for id,v in ids.items():
  if id.startswith('value-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);key=one(k for k,(a,b,w,h)in rects.items()if a<x<a+w and b<y<b+h);assert key not in labels;labels[key]=v.text or''
 edges=[]
 for id,v in ids.items():
  if id.startswith('edge-'):
   x1,y1,x2,y2=[F(v.attrib[k])for k in['x1','y1','x2','y2']];a=one(k for k,(x,y,w,h)in rects.items()if x1==x+w/2 and y1==y+h);b=one(k for k,(x,y,w,h)in rects.items()if x2==x+w/2 and y2==y);assert ys.index(rects[b][1])==ys.index(rects[a][1])+1;edges.append((a,b))
 assert len(edges)==len(set(edges))==12;top=sorted((k for k,v in rects.items()if v[1]==ys[0]),key=lambda k:rects[k][0]);domains={k:[-1,1]if labels[k]=='±1'else[int(labels[k].replace('−','-'))]for k in top};assert all(set(v)<=set([-1,1])for v in domains.values());bottom=one(k for k,v in rects.items()if v[1]==ys[-1]);target=int(labels[bottom].replace('−','-'));assert target==int(one(re.findall(r'Төменгі ұяшықта (−?1) шығатындай',r['statement'])).replace('−','-'));assert all(labels[k]==''for k,v in rects.items()if v[1]not in[ys[0],ys[-1]]);out,proof=sign_graph(domains,edges,target);proof['allTenActualNodesAndTwelveConnectorEndpointsChecked']=True;return out,proof

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  value=int(one(n));assert value>1;root=math.isqrt(value-1);out=F(value-root*root);assert root>0 and out>=1 and(value-out)==root*root and(root+1)**2>=value;proof={'actualStartingInteger':value,'largestStrictlySmallerPositiveSquareRoot':root,'largestStrictlySmallerSquare':root*root,'positiveSubtractionEvenWhenBaseAlreadySquare':True,'leastSubtractionTarget':str(out)}
 elif i==2:
  if src:assert'ең кіші екі таңбалы'in s and'ең үлкен екі таңбалы'in s;length=2
  else:word=one(set(re.findall(r'(төрттаңбалы|үштаңбалы)',s)));length={'төрттаңбалы':4,'үштаңбалы':3}[word]
  domain=list(range(10**(length-1),10**length));first=min(v for v in domain if 10<=sum(map(int,str(v)))<=99);second=max(v for v in domain if sum(map(int,str(v)))<10);out=F(first+second);proof={'allFixedLengthNaturalInputsChecked':len(domain),'smallestWithTwoDigitDigitSum':first,'largestWithOneDigitDigitSum':second,'sumTarget':str(out)}
 elif i==3:
  count,digits=map(int,n);_,proof=T.digit_block(count,digits);out=F(proof['uniqueStart']);proof['smallestTarget']=str(out);proof['askedSmallestRatherThanLargest']=True
 elif i==4:
  total,others=map(int,n);assert total>1 and others==total-1;valid=[]
  for liars in range(total+1):
   knights=total-liars;knightConsistent=not knights or 2*liars>others;liarConsistent=not liars or 2*(liars-1)<=others
   if knightConsistent and liarConsistent:valid.append(liars)
  out=F(one(valid));assert 0<out<total;proof={'allPossibleLiarPopulationCountsChecked':total+1,'allMatchingLiarCounts':valid,'knightSeesAllLiars':str(out),'liarSeesOtherLiars':str(out-1),'strictMajorityOfOthersApplied':True,'allHomogeneousPopulationsRejected':True,'liarCountTarget':str(out)}
 elif i==5:
  if src:initial=one(n);insert1,insert2=1,3;assert'бір қиярдан'in s and'үш бүлдірген'in s
  else:initial,insert1,insert2=map(int,n)
  initial=int(initial);stage=['original']*initial
  def expansion(values,count,tag):return list(itertools.chain.from_iterable(([tag]*count+[v])if j else[v]for j,v in enumerate(values)))
  first=expansion(stage,insert1,'first');second=expansion(first,insert2,'second');expectedFirst=initial+(initial-1)*insert1;assert len(first)==expectedFirst;out=F(len(second));assert out==expectedFirst+(expectedFirst-1)*insert2;proof={'allOriginalItems':initial,'afterFirstActualInsertionCount':len(first),'afterSecondActualInsertionCount':len(second),'firstInsertedCount':first.count('first'),'secondInsertedCount':second.count('second'),'actualTwoStageExpansionMatchesGapFormula':True,'totalPlantsTarget':str(out)}
 elif i==6:
  if src:
   edges=[('a','d'),('b','d'),('b','e'),('c','e'),('d','f'),('e','f')];out,proof=sign_graph({k:[-1,1]for k in['a','b','c']},edges,1);proof['sourceRasterSHA256']=asset(6);proof['observedExampleTopOneMinusOneOneProducesBottomOne']=True
  else:out,proof=native_sign_graph(r,data)
 elif i==7:
  wholeDm,remainingCm=n;wholeCm=10*wholeDm;longSide=remainingCm/2;shortSide=wholeCm/2-longSide;assert longSide>shortSide>0;remainingSides=[longSide-shortSide,shortSide];assert 2*sum(remainingSides)==remainingCm and 2*(longSide+shortSide)==wholeCm;out=shortSide**2;proof={'wholePerimeterConvertedToCm':str(wholeCm),'originalLongShortSidesCm':list(map(str,[longSide,shortSide])),'remainingRectangleSidesCm':list(map(str,remainingSides)),'bothOriginalPerimetersMatched':True,'cutSquareAreaTarget':str(out)}
 elif i==8:
  labels=list(map(int,n[:6]));known=list(map(int,n[6:]));assert len(labels)==len(set(labels))==6 and len(known)==5;missing=set();witnesses=[]
  for perm in itertools.permutations(labels):
   sums=[perm[j]+perm[(j+1)%6]for j in range(6)];delta=collections.Counter(sums);delta.subtract(known)
   if min(delta.values())>=0 and sum(delta.values())==1:missing.add(one(v for v,c in delta.items()if c));witnesses.append({'sideLabels':perm,'allVertexSums':sums})
  out=F(one(missing));assert witnesses and out==2*sum(labels)-sum(known);proof={'all720CyclicEdgeOrdersChecked':720,'actualDistinctSideLabels':labels,'actualFiveKnownVertexSumsIncludingMultiplicity':known,'allPossibleMissingValues':sorted(missing),'consistentEdgeOrderCount':len(witnesses),'oneActualAttainingEdgeOrder':witnesses[0],'twiceAllSideLabelsIdentityChecked':True,'missingVertexTarget':str(out)}
 elif i==9:
  part=E.plain(H.math_parts(s,src)[0]);pairs=re.findall(r'(4|5)\^\{?(\d+)\}?',part);assert[p[0]for p in pairs]==['4','5'];a,b=[int(p[1])for p in pairs];value=4**a*5**b;decimal=str(value);twos,fives=2*a,b;zeros=min(twos,fives);mantissa=2**(twos-zeros)*5**(fives-zeros);assert value==mantissa*10**zeros;out=F(sum(map(int,decimal)));assert out==sum(map(int,str(mantissa)));proof={'actualFourExponentFiveExponent':[a,b],'directBigIntegerDecimalDigitsChecked':len(decimal),'decimalSHA256':hashlib.sha256(decimal.encode()).hexdigest(),'factoredMantissa':str(mantissa),'trailingTenFactors':zeros,'directBigIntegerAndFactorizationDigitSumsAgree':True,'digitSumTarget':str(out)}
 elif i==10:
  if src:total=one(n);multiple=F(3);assert'үш есе көп'in s
  else:total,multiple=n
  assert multiple>1;out=2*multiple*total/(3*multiple+1);young=total-out;delay=out-young;pastYoung=young-delay;assert out>young>0 and pastYoung>0 and out==multiple*pastYoung and out-delay==young and out+young==total;assert out.denominator==young.denominator==1;proof={'currentOlderYounger':list(map(str,[out,young])),'elapsedYearsToComparison':str(delay),'youngerAgeAtComparedTime':str(pastYoung),'olderPastEqualsCurrentYounger':True,'bothRelativeAgeConditionsMatched':True,'olderAgeTarget':str(out)}
 elif i==11:
  part=H.math_parts(s,src)[0];denominators=list(map(int,re.findall(r'\\dfrac\{1\}\{(\d+)\}',part)))if src else list(map(int,re.findall(r'\(1/(\d+)\)',part)));assert len(denominators)>=4 and denominators[1]==denominators[0]+1 and denominators[2]==denominators[0]+2;start,end=denominators[0],denominators[-1];assert start>0 and end>=denominators[2];out=F(1)
  for k in range(start,end+1):out*=1+F(1,k)
  assert out==F(end+1,start);proof={'actualFirstDenominator':start,'actualLastDenominator':end,'everyConsecutiveFactorMultipliedExactly':end-start+1,'telescopedNumerator':end+1,'telescopedDenominator':start,'exactProductTarget':str(out)}
 elif i==12:
  plain=T.source_text(s);low,high=map(int,one(re.findall(r'(\d+)-ден\s+(\d+)-ға дейінгі',plain)));target=int(one(re.findall(r'(\d+) (?:саны )?жазылған карточканың',plain)));visible=[2,99,49]if src else G.native_cards(r,data);out,proof=G.card_sums(visible,low,high,target)
  if src:proof['sourceRasterSHA256']=asset(12)
 elif i==13:
  if src:values=list(map(int,n[:-1]));mean=n[-1];assert values==list(range(1,8))
  else:low,high,mean=n;values=list(range(int(low),int(high)+1));assert'Кемінде біреуін алып тастап, кемінде біреуін қалдырамыз'in s
  counts=collections.Counter();allValid=[]
  for size in range(1,len(values)):
   for subset in itertools.combinations(values,size):
    if sum(subset)==mean*size:counts[size]+=1;allValid.append(subset)
  dp={(0,0):1}
  for v in values:
   nxt=collections.defaultdict(int,dp)
   for(k,total),ways in dp.items():nxt[k+1,total+v]+=ways
   dp=dict(nxt)
  assert all(counts[k]==dp.get((k,int(mean*k)),0)for k in range(1,len(values)));out=F(len(allValid));assert out==sum(counts.values());proof={'allSubsetMasksIncludingExcludedChecked':2**len(values),'allAvailableDistinctIntegers':values,'requiredMean':str(mean),'allValidNonemptyProperRemainingSubsets':allValid,'countsByRemainingSize':dict(sorted(counts.items())),'generatingFunctionSizeSumDPMatchesEveryCount':True,'emptyAndUnchangedWholeSetExcluded':True,'removalWayCountTarget':str(out)}
 elif i==14:
  year,lower,upper=map(int,n);assert lower==10 and upper==100;possibilities=[(year-age,age)for age in range(lower+1,upper)if sum(map(int,str(year-age)))==age];birth,age=one(possibilities);out=F(birth);assert lower<age<upper and year-birth==sum(map(int,str(birth)));proof={'actualReferenceYear':year,'allStrictlyEligibleIntegerAgesChecked':upper-lower-1,'actualStrictBirthYearRange':[year-(upper-1),year-(lower+1)],'allMatchingBirthYearAgePairs':possibilities,'birthdayAlreadyOccurredSoExactAgeYearDifference':True,'birthYearTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('2400 санынан','2401 санынан'),2:('төрттаңбалы','үштаңбалы'),3:('96 цифр','104 цифр'),4:('37 тұрғынның','35 тұрғынның'),5:('8 қарағай','9 қарағай'),7:('8 дм','9 дм'),8:('6, 8, 9, 10, 12','6, 8, 9, 10, 9'),9:('4¹⁷','4¹⁸'),10:('52.','65.'),11:('(1/49)','(1/59)'),13:('ортасы 5','ортасы 4'),14:('2025 жылы','2027 жылы')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==4:q['statement']=q['statement'].replace('36 тұрғынның','34 тұрғынның')
 if i==11:q['statement']=q['statement'].replace('49-ға','59-ға')
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution']and(not q['images']or i in[6,12]);answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=P.W.svg(r)
   if i==6:one(v for v in root.iter()if v.attrib.get('id')=='value-0-0').text='1';statement=r['statement'];expected='4'
   else:one(v for v in root.iter()if v.attrib.get('id')=='value-c').text='29';statement=r['statement'].replace('31 жазылған','29 жазылған');expected='41'
   changed=ET.tostring(root);bad={**r,'statement':statement,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:proof['updatedHashNativeSemanticMutationRejected']=True
   else:raise AssertionError('changednativeinputaccepted')
   solve({**bad,'answer':expected},i,False,changed);proof['validChangedNativeTarget']=expected
  for bad in[{**r,'answer':'999999999'}]+([]if i in[6,12]else[mutation(r,i)]):
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('options')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All14fullsource/newconditions and complete official/newsolutions/2rasters/2nativepreviews read. Strictpositive subtraction withperfect-squarecanary, all4digitextremums, globallyboundedintegerblock, everypossibleliarcount withstrictmajority, actualtwo-stageinsertion, actualsignDAG/topdomains/fullassignments, original/remainingrectangleunits, all720hexagonswithmultiset-knownvertices, fullbigintdecimaldigits vs2/5factorization, bothrelativeageconstraints, everytelescopingFractionfactor, allcardsums, all512subsetmasks crosssize-sumDP and everystrictlyeligiblebirthage/year checked. Same root author not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]})
  if r.get('image'):entries[-1]['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actual10nativepyramidnodes/12edges/topdomains/bottomtarget or allthreeactualcardvalues/rectangles decoded. Sourcebitmaps and343pxnewPNGs inspected. Updatedhashfixedfirstrootreduces8to4; validcard29andquerychange39to41. No sourcebitmap/tracedvectors.'}
  evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'fullSourceNewConditionsAndSolutionsRead':14,'sourceKeysNotCaptured':14,'wrongKeysRejected':14,'printedSemanticCanariesRejected':14,'nativeFractions':native['fractions'],'nativeFigures':2,'updatedHashNativeSemanticCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':14,'knownModelIdsReused':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
