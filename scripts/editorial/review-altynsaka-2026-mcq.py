"""All13full source/newMCQconditions, complete official/newsolutions and all58
source/all58newoptions read. Exact scalar and rational-polynomial alternatives,
with irreducibility separate from numerical equality. Same root author
separate computational review, not anotherhumanreviewer.
"""
import ast,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='altynsaka-2026-mcq';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('school2023','scripts/editorial/review-altynsaka-2023-school.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;E=P.E;H=P.H;one=H.one;exact=P.exact
opts=lambda r:[o['text']if isinstance(o,dict)else o for o in r['options']]
scalar=lambda s:exact(H.tex(s))

def circle_polygon(count):
 vertices={3:[(1,0),(F(-3,5),F(4,5)),(F(-3,5),F(-4,5))],4:[(1,0),(0,1),(-1,0),(0,-1)],5:[(1,0),(F(3,5),F(4,5)),(F(-3,5),F(4,5)),(F(-3,5),F(-4,5)),(F(3,5),F(-4,5))]}[count];vertices=[tuple(map(F,p))for p in vertices];radius2=F(9,10);checks=[]
 for a,b in zip(vertices,vertices[1:]+vertices[:1]):
  vx,vy=b[0]-a[0],b[1]-a[1];A=vx*vx+vy*vy;B=2*(a[0]*vx+a[1]*vy);C=a[0]**2+a[1]**2-radius2;t=-B/(2*A);minimum=A*t*t+B*t+C;assert A>0 and C>0 and A+B+C>0 and 0<t<1 and minimum<0 and B*B-4*A*C>0
  sides=[vx*(c[1]-a[1])-vy*(c[0]-a[0])for c in vertices if c not in[a,b]];assert all(v>0 for v in sides);checks.append({'closestSegmentParameter':str(t),'minimumCircleQuadratic':str(minimum)})
 return{'universalLineCircleQuadraticAtMostTwoRoots':True,'exactConvexCyclicRationalVertexWitness':[[str(x),str(y)]for x,y in vertices],'circleRadiusSquared':str(radius2),'everyEdgeTwoStrictInteriorCircleIntersections':checks,'noCircleIntersectionAtPolygonVertexOrSharedEdgePoint':True,'attainableIntersectionCount':2*count}

def time_minutes(s):
 plain=H.tex(s);hours=one(re.findall(r'(\d+)\s*сағ',plain));minutes=re.findall(r'(\d+)\s*мин',plain);return F(int(hours)*60+(int(one(minutes))if minutes else 0))

def pick_numeric(r,out):
 values=list(map(scalar,opts(r)));assert values.count(out)==1 and scalar(r['answer'])==out;return values

def custom_expression(s,k):
 tree=ast.parse(s.replace('◇','@').replace('*','@'),mode='eval')
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Name):return E.expr(n.id)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,ast.MatMult);return walk(n.left)+E.expr(str(k))*walk(n.right)
 return walk(tree)

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);values=None;symbolic=False
 if i==1:
  whole,pct=n;out=whole*pct/100;values=pick_numeric(r,out);assert values==[out-10,out,out+10,out-20];proof={'actualWholeAndPercent':list(map(str,n)),'allFourOriginalOffsetRolesPreserved':True,'percentValueTarget':str(out)}
 elif i==2:
  count=3 if src else(4 if'шаршы'in s else 5 if'бесбұрыш'in s else None);assert count;out=F(2*count);values=pick_numeric(r,out);assert values==[count,count+1,2*count,2*count+2];proof=circle_polygon(count);proof['maximumIntersectionCountTarget']=str(out)
 elif i==3:
  oneScale,scale,cm,speed=n;assert oneScale==1;km=cm*scale/100000;hours=km/speed;minutes=hours*60;assert minutes.denominator==1;whole=hours.numerator//hours.denominator;fraction=hours-whole;assert(10*fraction).denominator==1;values=list(map(time_minutes,opts(r)));assert values==[whole*60+10*fraction,minutes,math.ceil(hours)*60,hours*600]and values.count(minutes)==1 and time_minutes(r['answer'])==minutes;proof={'actualScaleDenominatorMapCmSpeed':list(map(str,[scale,cm,speed])),'truePhysicalDistanceKm':str(km),'exactHours':str(hours),'actualAllOptionMinutes':list(map(str,values)),'decimalDigitsMistakenForMinutesCeilingAndTenfoldHourRolesPreserved':True,'trueWholeMinutesTarget':str(minutes)};out=minutes
 elif i==4:
  total,pct,target=n;assert target==50;girls=total*pct/100;boys=total-girls;out=boys-girls;assert girls.denominator==boys.denominator==out.denominator==1 and out>0 and(girls+out)/(total+out)==F(1,2);values=pick_numeric(r,out);assert values==[out/2,out-1,out,out+2];proof={'actualTotalInitialGirlPercentFinalGirlPercent':list(map(str,n)),'initialGirlsAndUnchangedBoys':list(map(str,[girls,boys])),'allFourOriginalHalfMinusOneCorrectPlusTwoRolesPreserved':True,'addedGirlsTarget':str(out)}
 elif i==5:
  number=int(one(n));divisors=[d for d in range(1,number+1)if number%d==0];left=number;prime=2;exponents={}
  while prime*prime<=left:
   while left%prime==0:exponents[prime]=exponents.get(prime,0)+1;left//=prime
   prime+=1
  if left>1:exponents[left]=exponents.get(left,0)+1
  assert math.prod(p**e for p,e in exponents.items())==number;out=F(len(divisors));assert out==math.prod(e+1 for e in exponents.values());values=pick_numeric(r,out);assert values==[out-6,out-4,out,out+6];proof={'actualWholeNumber':number,'allPositiveDivisors':divisors,'completePrimeExponentFactorization':exponents,'directAllDivisorsEqualsIndependentExponentProduct':True,'positiveDivisorCountTarget':str(out)}
 elif i==6:
  parts=H.math_parts(s,src);equation,target=parts[:2];left,alias=map(str.strip,H.tex(equation).split('='));assert re.fullmatch('[ab]',alias);c=((E.expr('x')-E.expr(left))*E.expr('x')).constant();assert c>0;actualTarget=E.expr(target);expectedTarget=E.expr('x^2')+E.expr(str(c*c)+'/x^2');assert actualTarget.equals(expectedTarget)
  actualOptions=[E.expr(o)for o in opts(r)];roles=[E.expr(alias+'^2'+offset)for offset in['','+'+str(2*c),'-'+str(2*c),'+'+str(c)]];assert all(a.equals(b)for a,b in zip(actualOptions,roles));substituted=[E.expr(E.plain(o).replace(alias,'('+left+')'))for o in opts(r)];matches=[j for j,v in enumerate(substituted)if v.equals(actualTarget)];assert matches==[1]and E.expr(r['answer']).equals(actualOptions[1]);symbolic=True;proof={'actualReciprocalNumerator':str(c),'actualAlias':alias,'exactSquareCrossTerm':str(-2*c),'exactRationalPolynomialIdentityCheckedWithoutSamples':True,'allFourOriginalSymbolicOptionRolesPreserved':True,'allOptionIdentitiesAfterAliasSubstitution':[v.equals(actualTarget)for v in substituted],'originalNonzeroXDomainPreserved':True}
 elif i==7:
  start,bound=map(int,n);assert start==1;odd=[]
  for v in range(1,bound+1):
   divisors={d for d in range(1,math.isqrt(v)+1)if v%d==0};full=divisors|{v//d for d in divisors}
   if len(full)%2:odd.append(v)
  assert odd==[k*k for k in range(1,math.isqrt(bound)+1)];out=F(len(odd));values=pick_numeric(r,out);assert values==[out,out+1,out-1,F(bound,2)];proof={'actualInclusiveBound':bound,'everyIntegerDivisorParityChecked':bound,'allOddDivisorCountIntegers':odd,'divisorPairingEqualsAllPerfectSquares':True,'oddDivisorCountIntegerCountTarget':str(out)}
 elif i==8:
  decimal=one(n);pairs=[tuple(map(int,H.numeric_tokens(o)))for o in opts(r)];assert all(len(pair)==2 for pair in pairs);fvals=[F(a,b)for a,b in pairs];reduced=[math.gcd(a,b)==1 for a,b in pairs];matches=[j for j,v in enumerate(fvals)if v==decimal and reduced[j]];assert matches==[1];a,b=pairs[1];assert pairs[0]==(int(decimal*1000),1000)and pairs[2]==(5*a,5*b)and pairs[3]==(a,5)and pairs[4]==(a+4,b);assert fvals[:3]==[decimal]*3 and not reduced[0]and not reduced[2]and fvals[3]!=decimal and fvals[4]!=decimal;assert scalar(r['answer'])==decimal and H.numeric_tokens(r['answer'])==list(pairs[1]);proof={'actualDecimal':str(decimal),'allFiveActualUnreducedNumeratorDenominatorPairs':[list(p)for p in pairs],'allFiveExactOptionValues':list(map(str,fvals)),'allFiveOptionIrreducibility':reduced,'onlyCorrectValueAndCoprimeNumeratorDenominatorOption':1,'equalButReducibleFractionsExplicitlyRejected':True,'irreducibleFractionTarget':str(decimal)};out=decimal
 elif i==9:
  parts=H.math_parts(s,src);assert len(parts)==5;workers,time,quantity,newWorkers,newTime=parts;rate=E.expr(quantity)/E.expr(workers)/E.expr(time);target=rate*E.expr(newWorkers)*E.expr(newTime);k=F(1)if src else(E.expr(newTime)/E.expr(newWorkers)).constant();a,b,c,d=[E.plain(v)for v in[workers,time,quantity,newWorkers]];assert all(re.fullmatch('[a-z]',v)for v in[a,b,c,d])and len(set([a,b,c,d]))==4;roles=[f'({k}*{c}*{d}^2)/({a}*{b})',f'({a}*{b})/({k}*{c}*{d}^2)',f'({k}*{a}*{d}^2)/({b}*{c})',f'({k}*{c}*{d})/({a}*{b})',f'({k}*{a}*{b}*{d}^2)/{c}'];alternatives=[E.expr(o)for o in opts(r)];assert all(v.equals(E.expr(role))for v,role in zip(alternatives,roles));matches=[j for j,v in enumerate(alternatives)if v.equals(target)];assert matches==[0]and E.expr(r['answer']).equals(target);symbolic=True;proof={'actualWorkerTimeQuantityNewWorkersNewTime':parts,'actualNewTimeMultiplierOfNewWorkers':str(k),'exactPerPrinterPerHourRateDerivedFromPrintedInputs':True,'allFiveOriginalRateErrorFormsCheckedAsRationalPolynomialIdentities':True,'allOptionMatchesDerivedRateTarget':[v.equals(target)for v in alternatives],'allPositiveVariableDenominatorsStayNonzero':True}
 elif i==10:
  eq1,eq2,target=H.math_parts(s,src);l1,v1=map(str.strip,H.tex(eq1).split('='));l2,v2=map(str.strip,H.tex(eq2).split('='));assert E.expr(l1).equals(E.expr('x+y'))and E.expr(l2).equals(E.expr('x-y'));total,diff=exact(v1),exact(v2);x,y=(total+diff)/2,(total-diff)/2;assert x+y==total and x-y==diff;out=E.expr(target).value({'x':x,'y':y});values=pick_numeric(r,out);assert values==[out-8,out-4,out,out+4,out+8];proof={'actualUniqueXAndY':list(map(str,[x,y])),'bothPrintedEquationsRechecked':True,'actualWeightedTargetExpression':target,'allFiveOriginalOffsetRolesPreserved':True,'weightedExpressionTarget':str(out)}
 elif i==11:
  diameter,meters,pi=n;circum=diameter*pi;out=meters*100/circum;assert out.denominator==1;values=pick_numeric(r,out);assert[v/out for v in values]==[F(2,3),F(1),F(2),F(157,50),F(47,75)];proof={'actualDiameterCmDistanceMPi':list(map(str,n)),'oneRotationCircumferenceCentimeters':str(circum),'wholeDistanceCentimeters':str(meters*100),'allOriginalOptionRatiosToCorrectRotationCountPreserved':True,'wholeRotationCountTarget':str(out)}
 elif i==12:
  equation,target=H.math_parts(s,src);left,right=H.tex(equation).split('=');op='*'if src else'◇';assert re.sub(r'\s+','',left)=='x'+op+'y';k=((E.expr(right)-E.expr('x'))/E.expr('y')).constant();assert k>0;targetValue=custom_expression(target,k);var=one(set(re.findall(r'[a-z]',target)));coefs=[1+2*k,1+k*k,k+k*k,1+k+k*k,(1+k)**2];alternatives=[E.expr(o)for o in opts(r)];assert all(v.equals(E.expr(str(c)+'*'+var))for v,c in zip(alternatives,coefs));matches=[j for j,v in enumerate(alternatives)if v.equals(targetValue)];assert matches==[3]and E.expr(r['answer']).equals(targetValue);symbolic=True;proof={'actualCustomRightMultiplier':str(k),'actualNestedCustomExpression':target,'parsedNestedAssociationRatherThanOrdinaryMultiplication':True,'allFiveOriginalErrorPolynomialCoefficients':list(map(str,coefs)),'allOptionMatchesExactNestedPolynomial':[v.equals(targetValue)for v in alternatives],'exactRationalPolynomialEqualityNoSampling':True}
 elif i==13:
  count=int(one(n));regionCounts=[1]
  for j in range(1,count+1):regionCounts.append(regionCounts[-1]+j)
  intersections=[(F(-(a+b)),F(-a*b))for a,b in itertools.combinations(range(1,count+1),2)];assert len(set(intersections))==math.comb(count,2)and all(-2*count-2<x<2 and-count*count-1<y<count*count+1 for x,y in intersections);out=F(regionCounts[-1]);assert out==1+count+math.comb(count,2);values=pick_numeric(r,out);assert values==[out-5,out-1,out,out+4,out+9];proof={'actualLineCount':count,'allIncrementalRegionCounts':regionCounts,'exactGeneralPositionWitnessLinesYEqualsMtimesXPlusMSquared':True,'allPairwiseIntersectionsStrictlyInsideConstructedRectangle':len(intersections),'allPairwiseIntersectionsDistinctSoNoTripleConcurrency':True,'regionCountTarget':str(out)}
 else:raise AssertionError(i)
 if not symbolic and i not in[3,8]:assert scalar(r['answer'])==out
 proof['allActualOptionCount']=len(opts(r));proof['answerChecked']=True;return proof

def mutation(r,i):
 d=copy.deepcopy(r);s=d['statement']
 if i==1:d['statement']=s.replace('840','880');d['options']=['298','308','318','288']
 elif i==2:d['statement']=s.replace('шаршының','бесбұрыштың');d['options']=['5','6','10','12']
 elif i==3:d['statement']=s.replace('7.2 см','8.1 см');d['options']=['2 сағ 7 мин','2 сағ 42 мин','3 сағ','27 сағ']
 elif i==4:d['statement']=s.replace('40 оқушы','60 оқушы');d['options']=['9','17','18','20']
 elif i==5:d['statement']=s.replace('840','1260');d['options']=['30','32','36','42']
 elif i==6:d['statement']=s.replace('(3/x)','(4/x)').replace('(9/x²)','(16/x²)');d['options']=['b²','b² + 8','b² − 8','b² + 4']
 elif i==7:d['statement']=s.replace('300-ге','400-ге');d['options']=['20','21','19','200']
 elif i==8:d['statement']=s.replace('0.875','0.125');d['options']=['(125/1000)','(1/8)','(5/40)','(1/5)','(5/8)']
 elif i==9:d['statement']=s.replace('«2 × s»','«3 × s»');d['options']=[o.replace('2 ×','3 ×')for o in d['options']]
 elif i==10:d['statement']=s.replace('= 28','= 30');d['options']=['64','68','72','76','80']
 elif i==11:d['statement']=s.replace('659.4 м','1318.8 м');d['options']=['400','600','1200','1884','376']
 elif i==12:d['statement']=s.replace('+ 4 × y','+ 5 × y');d['options']=['11 × t','26 × t','30 × t','31 × t','36 × t']
 elif i==13:d['statement']=s.replace('6 түзу','7 түзу');d['options']=['24','28','29','33','38']
 assert d['statement']!=s;return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==13 and{r['params']['number']for r in rows}==set(range(1,14));openRows=json.loads((ROOT/'problems/editorial/batches/altynsaka-2026-combinatorics.json').read_text())['editions'];assert{r['params']['number']for r in openRows}==set(range(14,21));entries=[];evidence=[];equalities=0;changedAnswers={1:'308',2:'10',3:'2 сағ 42 мин',4:'18',5:'36',6:'b² + 8',7:'20',8:'(1/8)',9:'((3 × r × s²)/(p × q))',10:'72',11:'600',12:'31 × t',13:'29'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['options']and not q['images'];answer=one(o['text']for o in q['options']if o['correct']);assert H.canon(answer)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,KeyError,ZeroDivisionError):pass
   else:raise AssertionError(('wrongoroldkeyaccepted',i))
  try:cp=solve({**mutation(r,i),'answer':changedAnswers[i]},i)
  except Exception as e:raise AssertionError(('validchangedmath',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==(6 if i in[6,9,12]else 5)and len(r['options'])==len(q['options'])and not r.get('image')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All13fullsource/newconditions and fullsolutions/all58source+58newoptions read. Everyoriginalscalaroffset/timeerror/polygonbound/primecount/rootneighbor/weightedcount/irreducibility/rateidentity/nestedpolynomial/wheelratio/linecountrole checked. Exactconvexrationalpolygonwitnessproves2nintersectionattainability; exactrationalpolynomialaliases/rates/customoperators usefullidentities notsamples. Equalnumericalfractionsareacceptedonlywhenoriginalrawnumerator/denominatorcoprime. Everyvalidchangedinputrejectsoldkeyandacceptsrecomputedkey. Completesother7openquestions. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':13,'fullSourceNewConditionsAndSolutionsRead':13,'capturedMCQKeys':13,'sourceOptionsRead':sum(len(question['options'])for question in json.loads((ROOT/'problems/sources/zerek/collections/37fe70f6-f90a-49ef-bb0a-f88858e186ce.json').read_text())['questions'][:13]),'rewrittenOptionsRead':sum(len(r['options'])for r in rows),'wrongKeysRejected':13,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':13,'nativeFractions':native['fractions'],'nativeFigures':0,'symbolicIdentitiesWithoutSampling':3,'completeCollectionWithOpen7':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':13,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
