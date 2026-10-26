"""All15full saved/newconditions, complete official/newsolutions and all source/new
MCQoptions read. Both saved rasters and both343pxnewnativePNGs inspected.
Separate exact computational check by same author, not another human reviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo6-spring-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('visual4','scripts/editorial/review-femo6-spring-grade4-visual.py');V=importlib.util.module_from_spec(sp);sp.loader.exec_module(V);P=V.P;K=P.K;H=P.H;one=H.one;exact=P.exact

def area(poly):return abs(sum(a[0]*b[1]-a[1]*b[0]for a,b in zip(poly,poly[1:]+poly[:1])))/2

def midpoint_polygon(r,src=False,data=None):
 if src:
  side=one(H.numeric_tokens(r['statement'])[:1]);assert side==8
  poly=[(F(x),F(y))for x,y in[(0,8),(8,6),(6,4),(8,2),(2,0),(4,2),(2,4)]]
  sha=hashlib.sha256((ROOT/'problems/sources/zerek/images/8b3a6990399f83cdb43f61be.png').read_bytes()).hexdigest();assert sha=='db73a516c177231d6115465c9ca2e9e9644c03bf83bad5fd1f0365bb02a97c3e';proof={'sourceRasterSHA256':sha,'allSevenSourcePolygonVerticesRead':True}
 else:
  root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};side=one(H.numeric_tokens(r['statement']));label=one(H.numeric_tokens(ids['whole-side'].text));assert side==label and side>0
  w=ids['whole'];x,y,width,height=[F(w.attrib[k])for k in['x','y','width','height']];assert width==height>0 and w.attrib['fill']=='white';scale=width/side
  def pt(a,b):return((a-x)/scale,(y+height-b)/scale)
  def line(id):return tuple(pt(F(ids[id].attrib['x'+j]),F(ids[id].attrib['y'+j]))for j in['1','2'])
  assert set(line('split-v'))=={(side/2,0),(side/2,side)}and set(line('split-h'))=={(0,side/2),(side,side/2)}
  actual=[pt(F(v.attrib['cx']),F(v.attrib['cy']))for id,v in ids.items()if id.startswith('midpoint-')];expected=set()
  for rr,c in itertools.product(range(2),repeat=2):
   xx,yy=c*side/2,rr*side/2;expected.update([(xx+side/4,yy),(xx+side/4,yy+side/2),(xx,yy+side/4),(xx+side/2,yy+side/4)])
  assert len(actual)==len(set(actual))==12 and set(actual)==expected
  e=ids['colored'];assert e.attrib['fill']=='#cadffa';raw=[tuple(F(v)for v in pair.split(','))for pair in e.attrib['points'].split()];poly=[pt(a,b)for a,b in raw];assert len(poly)==len(set(poly))==7;assert all(0<=a<=side and 0<=b<=side for a,b in poly)
  corners={(F(0),F(0)),(F(0),side),(side,F(0)),(side,side)};assert len(set(poly)&corners)==1 and set(poly)<=expected|corners
  for name,corner in zip('KLMN',[(x,y),(x+width,y),(x+width,y+height),(x,y+height)]):
   label=ids['corner-'+name];assert label.text==name and(F(label.attrib['x'])-corner[0])**2+(F(label.attrib['y'])-corner[1])**2<35**2
  proof={'actualWholeSide':str(side),'commonPixelsPerCm':str(scale),'fourEqualSubdivisionVerifiedFromActualLines':True,'all12MidpointsVerifiedFromActualMarkers':True,'allSevenActualPolygonVerticesRead':True}
 # Exact segment intersection including collinear contact: a simple polygon may
 # have concave vertices, but non-neighbor edges must never touch/cross.
 cross=lambda a,b,c:(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 edges=list(zip(poly,poly[1:]+poly[:1]));assert all(a!=b for a,b in edges)
 for j,(a,b)in enumerate(edges):
  for k,(c,d)in enumerate(edges):
   if k<=j or k==j+1 or(j==0 and k==len(edges)-1):continue
   ac,ad,ca,cb=cross(a,b,c),cross(a,b,d),cross(c,d,a),cross(c,d,b)
   if ac*ad<=0 and ca*cb<=0:
    assert max(min(a[0],b[0]),min(c[0],d[0]))>min(max(a[0],b[0]),max(c[0],d[0]))or max(min(a[1],b[1]),min(c[1],d[1]))>min(max(a[1],b[1]),max(c[1],d[1])),'Self-intersection'
 # Independent exact vertical-slab integration for concavity; collect all
 # edge intersections at each slab midpoint. No guessed complement symmetry.
 out=area(poly);xs=sorted(set(a for a,b in poly));integrated=F(0)
 for left,right in zip(xs,xs[1:]):
  middle=(left+right)/2;ys=[]
  for a,b in edges:
   if min(a[0],b[0])<middle<max(a[0],b[0]):ys.append(a[1]+(b[1]-a[1])*(middle-a[0])/(b[0]-a[0]))
  ys.sort();assert len(ys)%2==0;integrated+=(right-left)*sum(ys[j+1]-ys[j]for j in range(0,len(ys),2))
 assert out==integrated and 0<out<side**2;proof.update({'actualPhysicalVertices':[[str(a),str(b)]for a,b in poly],'simpleConcavePolygonNonneighborEdgesChecked':True,'shoelaceEqualsExactVerticalSlabIntegral':True,'actualWholeArea':str(side**2),'coloredPolygonAreaTarget':str(out)});return out,proof

def clock_angles(hours):
 delta=F(hours*30)%360;assert 0<delta<180
 angle=lambda t:min(t%360,360-t%360)
 difference=lambda t:angle(t)-angle(t-delta)
 breaks=sorted({F(0),F(360),F(180),delta,(delta+180)%360});roots=set()
 for a,b in zip(breaks,breaks[1:]):
  fa,fb=difference(a),difference(b)
  if fa==0:roots.add(a)
  if fb==0:roots.add(b)
  if fa!=fb:
   t=a-fa*(b-a)/(fb-fa)
   if a<=t<=b and difference(t)==0:roots.add(t)
  else:assert fa!=0,'Nonisolated angular solutions'
 candidates={angle(t)for t in roots};assert candidates=={delta/2,180-delta/2};acute={x for x in candidates if 0<x<90};return one(acute),{'relativeHourHandShiftDegrees':str(delta),'allPiecewiseLinearCircularAngleEquationRoots':list(map(str,sorted(roots))),'allEqualMinorAngles':list(map(str,sorted(candidates))),'acuteSelectionRequired':True,'continuousClockRelativeAngleReachesEveryDirection':True}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  if src:bounds=[int(n[0]),int(n[-1])]
  else:bounds=list(map(int,n))
  low,high=bounds;assert low==-high and high>=3;values=list(range(low,high+1));products=[(math.prod(c),c)for c in itertools.combinations(values,3)];out=F(min(a for a,c in products));best=[list(c)for a,c in products if a==out];assert out==-high**2*(high-1)
  opts=[H.scalar(o['text']if isinstance(o,dict)else o)for o in r['options']];roles=[-high*(high-1)*(high-2),-high**2*(high-1),-high**3,0];assert opts==roles and len(set(opts))==4;assert sum(v==out for v in opts)==1;proof={'allDistinctUnorderedTriplesChecked':len(products),'allMinimizingTriples':best,'allFourMCQDistractorRolesPreserved':True,'repeatedLargestFactorForbidden':True,'minimumProductTarget':str(out)}
 elif i==2:
  fraction=F(1,5)if src else F(1,4);assert('бестен бір'in s)if src else('төрттен бір'in s);delay=one(n);direct=delay/(2*fraction);out=direct+delay;assert out==(1+2*fraction)*direct;proof={'actualTurnaroundFraction':str(fraction),'extraOutAndBackFraction':str(2*fraction),'delayMinutes':str(delay),'directTripMinutes':str(direct),'actualTotalTripMinutesTarget':str(out)}
 elif i==3:
  a,b,total=map(int,n);assert 0<a<b and total>0;lo=0 if src else 1;pairs=[(x,y)for x in range(lo,total//a+1)for y in range(lo,total//b+1)if a*x+b*y==total];x,y=one(pairs);out=F(x+y);assert min(x,y)>0;proof={'bothActualCapacitiesAndTotalLiters':[a,b,total],'allFeasibleNonnegativeOrPositivePairsChecked':(total//a+1-lo)*(total//b+1-lo),'allSolutions':pairs,'uniqueIntegerContainerCountsVerified':True,'totalContainerCountTarget':str(out)}
 elif i==4:
  total,extra,a,b=n;ratio=a/b;assert 0<ratio<1;third=(total-extra)/(1+2*ratio);second=ratio*third;first=second+extra;assert min(first,second,third)>0 and all(v.denominator==1 for v in[first,second,third]);assert first+second+third==total and second/third==ratio and first-second==extra;out=second;proof={'actualBudgetTotalExtraRatio':list(map(str,[total,extra,ratio])),'allThreeWholeMoneyAmounts':list(map(str,[first,second,third])),'allThreePrintedBudgetConstraintsRechecked':True,'secondPersonMoneyTarget':str(out)}
 elif i==5:
  low,high=map(int,n[:2]);assert all(v==high for v in n[2:]);numbers=[x for x in range(low,high+1)if x%2==0];digits=[len(str(x))for x in numbers];out=F(sum(digits));groups={size:sum(d==size for d in digits)for size in set(digits)};assert out==sum(a*b for a,b in groups.items());proof={'actualInclusiveEndpoints':[low,high],'allWrittenEvenNumbersChecked':len(numbers),'numbersByDigitLength':groups,'directConcatenatedLength':len(''.join(map(str,numbers))),'writtenDigitCountTarget':str(out)};assert out==proof['directConcatenatedLength']
 elif i==6:
  if src:
   parts=H.math_parts(s,True);assert len(parts)==7;total,k,left,k2,right,total2=map(exact,parts[:6]);mean=exact(H.tex(parts[-1]))
  else:
   total,k,left,k2,right,total2,whole,a,b=n;mean=whole+a/b
  assert total==total2==2*k-1 and k==k2;out=k*left+k*right-total*mean
  witness=[(k*left-out)/(k-1)]*int(k-1)+[out]+[(k*right-out)/(k-1)]*int(k-1);assert len(witness)==total and sum(witness[:int(k)])/k==left and sum(witness[-int(k):])/k==right and sum(witness)/total==mean;proof={'totalCount':str(total),'eachOverlappingGroupCount':str(k),'prefixSuffixTotalMeans':list(map(str,[left,right,mean])),'groupSumsAndTotal':list(map(str,[k*left,k*right,total*mean])),'concreteWitnessRechecksAllThreeMeans':list(map(str,witness)),'onlyOneSharedMiddleCountedTwice':True,'middleElementTarget':str(out)}
 elif i==7:
  start,high,a,b=map(int,n[:4]);assert start==1 and all(v==high for v in n[4:]);hits=[x for x in range(1,high+1)if x%a==0 or x%b==0];both=[x for x in hits if x%a==x%b==0];out=F(len(hits));assert out==high//a+high//b-high//math.lcm(a,b);proof={'actualEndpointDivisors':[high,a,b],'allPositiveIntegersChecked':high,'inclusiveOrNotExclusive':True,'twoDivisibleCounts':[high//a,high//b],'intersectionCount':len(both),'directEnumerationEqualsLCMInclusionExclusion':True,'divisibleEitherCountTarget':str(out)}
 elif i==8:
  if src:assert'үш сағат'in s;hours=3
  else:hours=one(v for word,v in[('екі',2),('төрт',4)]if word+' сағат'in s)
  out,proof=clock_angles(hours);proof['acuteAngleTarget']=str(out)
 elif i==9:
  bound=1000 if src else int(one(n));prime=lambda x:x>1 and all(x%d for d in range(2,math.isqrt(x)+1));digits=[d for d in range(10)if prime(d)];allCandidates=[100*a+10*b+c for a,b,c in itertools.permutations(digits,3)];allPrime=sorted(v for v in allCandidates if prime(v));hits=[v for v in allPrime if v<bound];direct=[x for x in range(100,min(bound,1000))if len(set(str(x)))==3 and all(prime(int(d))for d in str(x))and prime(x)];assert hits==direct;out=F(len(hits));proof={'allPrimeDigits':digits,'allDistinctPrimeDigitPermutationsChecked':len(allCandidates),'allThreeDigitPrimesWithDistinctPrimeDigits':allPrime,'strictUpperBound':bound,'allMatchingPrimes':hits,'fullTrialDivisorPrimalityCheckedThroughIntegerSquareRoot':True,'matchingPrimeCountTarget':str(out)}
 elif i==10:
  if src:
   sha=hashlib.sha256((ROOT/'problems/sources/zerek/images/a0d8f3e6e6509ff486c40e5c.png').read_bytes()).hexdigest();assert sha=='dc8eff7b95960706b459724305f3c3296ba3fce026cec6a8811ce5bf03576239';proof=V.solve(r,12,True);out=F(proof['actualBlueAreaTarget']);proof['actualThisCollectionRasterSHA256']=sha
  else:out,proof=V.native_staircase(r,n,data)
 elif i==11:
  a,b,c=map(int,n);assert min(a,b,c)>0;choices=list(itertools.product(range(a+1),range(b+1),range(1,c+1)));out=F(len(choices));assert out==(a+1)*(b+1)*c;proof={'actualOptionalOptionalRequiredVarieties':[a,b,c],'absenceAllowedOnlyForFirstTwoCategories':True,'allConcreteChoiceTriplesChecked':len(choices),'multiplicationRuleRecheckedByEnumeration':True,'kitCountTarget':str(out)}
 elif i==12:
  a,b,pay=n;each=(a+b)/3;firstGift=a-each;secondGift=b-each;assert min(firstGift,secondGift)>0 and firstGift+secondGift==each;unit=pay/each;out=firstGift*unit;second=secondGift*unit;assert out+second==pay and out/second==firstGift/secondGift;proof={'allThreeEatEqualFood':str(each),'actualThirdPersonFoodContributions':list(map(str,[firstGift,secondGift])),'pricePerFoodUnit':str(unit),'bothMoneyShares':list(map(str,[out,second])),'paymentSplitByTransferredFoodNotOriginalStocks':True,'firstPersonPaymentTarget':str(out)}
 elif i==13:
  high=int(max(n));assert min(n)==1 and high>=3;valid=[list(v)for v in itertools.combinations(range(1,high+1),3)if 2*v[1]==v[0]+v[2]];even=high//2;odd=high-even;out=F(len(valid));assert out==math.comb(even,2)+math.comb(odd,2);proof={'actualInclusiveUpperBound':high,'allUnorderedThreeNumberSubsetsChecked':math.comb(high,3),'allValidArithmeticProgressionTriples':valid,'evenOddEndpointCounts':[even,odd],'endpointPairBijectionRecheckedByFullTripleEnumeration':True,'threeNumberSelectionCountTarget':str(out)}
 elif i==14:
  terms=list(map(int,re.findall(r'(\d+)!',s)));start,end=terms[0],terms[-1];assert 1<=start<=4 and end>=5 and terms[:-1]==list(range(start,start+len(terms)-1));full=sum(math.factorial(x)for x in range(start,end+1));tail=[x for x in range(max(5,start),end+1)];assert all(math.factorial(x)%10==0 for x in tail);out=F(full%10);head=sum(math.factorial(x)for x in range(start,5));assert out==head%10;proof={'actualFactorialBounds':[start,end],'everyActualFactorialDirectBigIntegerComputed':end-start+1,'allTailTermsVerifiedDivisibleBy10':tail,'nonzeroTailIndependentHeadSum':head,'fullExactFactorialSum':str(full),'lastDigitTarget':str(out)}
 elif i==15:out,proof=midpoint_polygon(r,src,data)
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('−12-ден 12-ге','−13-тен 13-ке'),2:('12 минут','16 минут'),3:('178 литр','162 литр'),4:('15800 теңге','16500 теңге'),5:('320','340'),6:('ортасы 6,','ортасы 7,'),7:('1200','1300'),8:('төрт сағат','екі сағат'),9:('500-ден','600-ден'),10:('3, 4, 5 және 6','6, 8, 10 және 12'),11:('5 түрлі','6 түрлі'),12:('1200 теңге','1600 теңге'),13:('24-ке','26-ға'),14:('2! + 3! + 4!','3! + 4! + 5!'),15:('16 см','20 см')}[i];assert a in r['statement'];bad={**r,'statement':r['statement'].replace(a,b)};data=None
 if i in[10,15]:
  root=P.W.svg(r)
  if i==10:
   for v in root.iter():
    if v.attrib.get('id','').startswith('side-'):v.text=str(int(v.text)*2)
  else:one(v for v in root.iter()if v.attrib.get('id')=='whole-side').text='20 см'
  data=ET.tostring(root);bad['figureSha256']=hashlib.sha256(data).hexdigest()
 return bad,data

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15 and {r['params']['number']for r in rows}==set(range(1,16));entries=[];evidence=[];equalities=0;nativeChanges=0
 changedAnswers={1:'−2028',2:'48',3:'9',4:'4200',5:'399',6:'10',7:'309',8:'30',9:'2',10:'476',11:'224',12:'1200',13:'156',14:'0',15:'(375/2)'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution'];opts=q['options']
  if opts:answer=one(o['text']for o in opts if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer'])
  else:answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip();assert q['sourceAnswer']is None
  try:sourceProof=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  try:solve({**r,'answer':'999999999'},i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad,data=mutation(r,i)
  if i==1:bad['options']=['−1716','−2028','−2197','0']
  try:solve(bad,i,False,data)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('oldkeyacceptedforvalidchangedmath',i))
  try:changedProof=solve({**bad,'answer':changedAnswers[i]},i,False,data)
  except Exception as e:raise AssertionError(('validchangedanswer',i,changedAnswers[i]))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedKeyAccepted']=True
  if data:nativeChanges+=1;proof['updatedHashChangedActualNativeLabels']=True
  if i==15:
   root=P.W.svg(r);poly=one(v for v in root.iter()if v.attrib.get('id')=='colored');vertices=poly.attrib['points'].split();assert vertices[2]=='180,104';vertices[2]='120,164';poly.set('points',' '.join(vertices));raw=ET.tostring(root);changed={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
   try:solve(changed,i,False,raw)
   except AssertionError:pass
   else:raise AssertionError('oldKeyAcceptedAfterRealConcaveVertexChange')
   actualChange=solve({**changed,'answer':'104'},i,False,raw);assert actualChange['coloredPolygonAreaTarget']=='104';proof['validChangedActualConcavePolygonTarget']='104';proof['validDifferentMidpointVertexGeometryRecomputed']=True
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement'];assert len(r.get('options',[]))==len(q['options']);assert bool(r.get('image'))==bool(q['images']);assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15 full source/newconditions and full official/newsolutions/options read. Exhaustive integer triples andMCQroles, extra-tripdistance, uniqueintegercapacitypairs, everybudgetconstraint, everyevennumberdigit, constructive overlappingmeanwitness, fullintegerdivisibility, exactpiecewisecircularclockangles, all24primedigitpermutations withfulltrialdivisors, actualwhite/blueareas, fulloptional/requiredchoiceproduct, transferredfoodpayment, allAPtriples, fullbigintfactorials and actualsimpleconcavepolygonvertices via shoelace and independentslabintegration checked. Everyvalidchangedmathinput rejects oldkeyand accepts recomputedkey. Same root author not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Both source rasters andactual343pxnativePNGs inspected. Actualwhite/bluerectangles, allside/cornerlabels, all12midpoints, bothsubdivisionlines and all7coloredpolygonvertices read fromnewSVGs. Exactareas independentlycrosschecked. Validupdatedhashphysical-labelchanges recompute476 and375/2. No originalbitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':sourceProof,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options??[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'capturedMCQKeys':1,'capturedOpenKeys':14,'wrongKeysRejected':15,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':15,'updatedHashActualNativeInputChanges':nativeChanges,'allFourMCQDistractorRolesPreserved':True,'nativeFractions':native['fractions'],'nativeFigures':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'knownModelIdsReused':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
