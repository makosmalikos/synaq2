"""All37fullsource/newconditions official/newsolutions/all185source/newchoices
read. Onlyactualprintedconditions/options drive exactcomputation. Nested
fractions use direct AST Fraction evaluation to preserve every intermediate
denominator domain. Same root author separate computation, notanotherhuman.
"""
import ast,collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil7-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('g','scripts/editorial/review-bil4-nonvisual.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);N=G.N;B=G.B;H=G.H;E=G.E;one=G.one
def arithmetic_ast(s):return ast.parse(H.arithmetic_text(E.plain(s)).replace('^','**'),mode='eval')
def direct(s,env):
 def walk(v):
  if isinstance(v,ast.Expression):return walk(v.body)
  if isinstance(v,ast.Constant):assert type(v.value)is int;return F(v.value)
  if isinstance(v,ast.Name):return env[v.id]
  if isinstance(v,ast.UnaryOp):assert isinstance(v.op,(ast.USub,ast.UAdd));return-walk(v.operand)if isinstance(v.op,ast.USub)else walk(v.operand)
  assert isinstance(v,ast.BinOp);a,b=walk(v.left),walk(v.right)
  if isinstance(v.op,ast.Add):return a+b
  if isinstance(v.op,ast.Sub):return a-b
  if isinstance(v.op,ast.Mult):return a*b
  if isinstance(v.op,ast.Div):assert b!=0;return a/b
  assert isinstance(v.op,ast.Pow)and b.denominator==1 and 0<=b<=4;return a**int(b)
 return walk(arithmetic_ast(s))
def original_nested_domains(lhs):
 candidates=set()
 for node in ast.walk(arithmetic_ast(lhs)):
  if isinstance(node,ast.BinOp)and isinstance(node.op,ast.Div):
   denominator=E.expr(ast.unparse(node.right));assert set(denominator.n)<={(),('x',)}
   coefficient=denominator.n.get(('x',),F(0));constant=denominator.n.get((),F(0))
   if coefficient:candidates.add(-constant/coefficient)
   else:assert constant!=0
 for bad in candidates:
  try:direct(lhs,{'x':bad})
  except(AssertionError,ZeroDivisionError):pass
  else:raise AssertionError(('undefinedintermediatedenominatoraccepted',bad))
 return sorted(candidates)
def ordered(r,src):
 parts=H.math_parts(r['statement'],src);chain=one(parts);terms=chain.split('=');offsets={}
 for term in terms:
  var=one(set(re.findall(r'[A-E]',term)));co,c=E.affine(term,(var,));assert one(co)==1;offsets[var]=-c
 assert set(offsets)==set('ABCDE')and len(set(offsets.values()))==5;order=sorted(offsets,key=offsets.get);out='<'.join(order);common=1+max(abs(v)for v in offsets.values());assert min(common+v for v in offsets.values())>0
 return out,{'actualAllFiveOffsetsFromCommonValue':{k:str(v)for k,v in offsets.items()},'positiveRealFiveNumberWitness':{k:str(common+v)for k,v in offsets.items()},'strictOrderingFromAllDistinctOffsets':order}
def cryptarithm(r,src):
 eq=one(v for v in H.math_parts(r['statement'],src)if'='in v);eq=re.sub(r'\\overline\{([^}]+)\}',r'overline(\1)',eq);pats=re.findall(r'overline\(([A-Z0-9]+)\)',eq);assert len(pats)==3 and pats[:2]==['ABC','CBA'];assert src or'A, C және D нөлден өзгеше'in r['statement'];assert'әртүрлі'in r['statement'].lower();solutions=[]
 def number(pattern,env):return int(''.join(str(env[v])if v.isalpha()else v for v in pattern))
 for a,b,c,d in itertools.permutations(range(10),4):
  if not a or not c or not d:continue
  env=dict(zip('ABCD',[a,b,c,d]))
  if number(pats[0],env)+number(pats[1],env)==number(pats[2],env):solutions.append(env)
 assert solutions;out=F(one(set(v['B']for v in solutions)));w=solutions[0];return out,{'all5040DistinctDigitAssignmentsWithLeadingZeroExclusionsChecked':True,'allAdmissibleAssignmentsCount':len(solutions),'allAdmissibleBValues':sorted(set(v['B']for v in solutions)),'actualDigitAdditionWitness':{**w,'addendsAndResult':[number(p,w)for p in pats]},'actualPrintedThreeConcatenationPatterns':pats}
def prime_factors(n):
 n=int(n);assert n>1;original=n;factors={};divisor=2
 while divisor*divisor<=n:
  while n%divisor==0:factors[divisor]=factors.get(divisor,0)+1;n//=divisor
  divisor+=1
 if n>1:factors[n]=factors.get(n,0)+1
 assert math.prod(p**k for p,k in factors.items())==original;return factors
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i in[1,28,29]:
  eq=one(v for v in parts if'='in v);out,q=E.equation(eq);p.update(q)
  if i==29:
   lhs,rhs=eq.split('=');forbidden=original_nested_domains(lhs);assert out not in forbidden and direct(lhs,{'x':out})==direct(rhs,{'x':out});p['allOriginalNestedDenominatorForbiddenRoots']=list(map(str,forbidden));p['directASTEvaluationPreservesEveryIntermediateDenominator']=True
 elif i==2:
  seq=n[:-1]if src else H.numeric_tokens(one(parts));index=int(n[-1]);assert len(seq)==4 and index>=4;diff=[b-a for a,b in zip(seq,seq[1:])];second=one(set(b-a for a,b in zip(diff,diff[1:])));assert second>0
  if not src:assert n[0]==second
  out=seq[0]+(index-1)*diff[0]+second*(index-1)*(index-2)/2;p['actualFirstDifferences']=list(map(str,diff));p['constantSecondDifference']=str(second);p['askedOneBasedIndex']=index
 elif i==3:
  workers,minutes,produced,askedworkers,need=n;assert min(n)>0;rate=produced/workers/minutes;out=need/(rate*askedworkers);assert rate*workers*minutes==produced;p['perWorkerPerMinuteRate']=str(rate)
 elif i==4:
  year,*rest=n;ages=rest[:-1];goal=rest[-1];assert len(ages)==4;elapsed=(goal-sum(ages))/4;assert elapsed>0 and elapsed.denominator==1;out=year+elapsed;assert sum(v+elapsed for v in ages)==goal;p['allFourFutureAges']=list(map(str,[v+elapsed for v in ages]))
 elif i==5:
  money,rub,rr,dollars,dd,euros,need=n;assert min(n)>0;d=need*dd/euros;ru=d*rr/dollars;out=ru*money/rub;assert out/money*rub/rr*dollars/dd*euros==need;p['reverseThreeStageAmounts']=list(map(str,[d,ru,out]));p['exerciseFixedRatesNotCurrentExchangeRateClaim']=True
 elif i==6:seconds,jumps,need=n;assert min(n)>0;out=seconds*need/jumps
 elif i==8:
  each1,left1,each2,left2=n;out=(left1-left2)/(each2-each1);assert out>0 and out.denominator==1 and each1*out+left1==each2*out+left2;p['sameWholeStockBothDistributions']=str(each1*out+left1)
 elif i==10:
  expr=one(parts);lhs,rhs=expr.split('=');values=H.numeric_tokens(rhs);unit=one(set(values));assert unit>0;out=E.calc(lhs)/unit;assert out.denominator==1;p['repeatedActualAddendAndWholeCount']=[str(unit),str(out)]
 elif i in[12,32]:out=N.exact_power_arithmetic(one(parts));p['exactFullPrintedRationalArithmetic']=str(out)
 elif i==13:pages,minutes,need=n;assert min(n)>0;out=minutes*need/pages
 elif i==14:
  a,b,percent=n;assert min(n)>0;factor=1+percent/100;out=(factor**2-1)*100;assert a*b*factor**2-a*b==a*b*out/100;p['bothActualDimensionsIncreaseMultiplicatively']=True
 elif i==15:out,q=ordered(r,src);p.update(q)
 elif i==16:
  end=one(n);mid=(end+1)/2;out=(mid+1)/2;assert out>=2 and out.denominator==1 and 2*(2*out-1)-1==end;p['bothMidpointInsertionRoundsReplayed']=list(map(str,[out,mid,end]))
 elif i==21:
  eq=one(v for v in parts if v.strip().startswith('k!'));rhs=eq.split('=')[1];value=E.calc(rhs);assert value>1 and value.denominator==1;k=1;factorial=1;history=[]
  while factorial<value:k+=1;factorial*=k;history.append([k,factorial])
  assert factorial==value;out=F(k);p['allSuccessiveFactorialsThroughTarget']=history;p['actualFourFactorProduct']=str(value)
 elif i==23:
  env={}
  for part in parts[:-1]:key,val=part.split('=');env[key.strip()]=E.calc(val)
  assert set(env)=={'p','q'};coefficients,_=E.affine(parts[-1],('p','q'));assert all(coefficients);out=direct(parts[-1],env);assert out==E.expr(parts[-1]).value(env);p['actualAssignedValues']={k:str(v)for k,v in env.items()};p['bothActualVariableCoefficientsNonzero']=list(map(str,coefficients))
 elif i==24:
  a,b,c,d=n;ratio=(b-d)/(c-a);out=a*ratio+b;assert ratio>0 and out==c*ratio+d and out.denominator==1;p['firstItemPriceInSecondItemUnits']=str(ratio);p['bothEqualCostBundlesReplayed']=True
 elif i==26:
  first,second=n;assert first>second>0;exact=2*first*second/(first+second);out=F(math.floor(exact+F(1,2)));assert out-F(1,2)<=exact<out+F(1,2);p['exactEqualDistanceAverageBeforeRounding']=str(exact);p['equalDistancesNotEqualTimes']=True
 elif i==27:
  values=H.numeric_tokens(one(parts));lo,hi=int(values[0]),int(values[-1]);assert lo<hi and all(b>a for a,b in zip(values,values[1:]));assert len([1 for a,b in zip(values,values[1:])if b-a>1])==1;out=F(sum(range(lo,hi+1)));assert out==(lo+hi)*(hi-lo+1)/2;p['allConsecutiveTermsEnumeratedCount']=hi-lo+1
 elif i==30:
  percent=one(n);assert percent>0;exact=((1+percent/100)**3-1)*100;out=F(math.floor(exact*10+F(1,2)),10);p['exactVolumeIncreasePercentBeforeTenthRounding']=str(exact);p['sourceOfficialOneDecimalRoundingMadeExplicitInRewrite']=True
 elif i==31:
  heads,legs=n;rabbits=(legs-2*heads)/2;chickens=heads-rabbits;assert min(chickens,rabbits)>0 and chickens.denominator==rabbits.denominator==1;out=(chickens,rabbits);assert 2*chickens+4*rabbits==legs;p['bothHeadsAndLegsReplayed']=True
 elif i==35:total,a,b,c=n;out=total*c/(a+b+c);assert out.denominator==1 and min(n)>0
 elif i==36:
  expr=one(v for v in parts if'<'in v);lo,mid,hi=H.tex(expr).split('<');co,c=E.affine(mid);a=one(co);assert a>0;lower=(E.calc(lo)-c)/a;upper=(E.calc(hi)-c)/a;out=F(math.ceil(upper)-1);assert lower<out<upper and out+1>=upper;p['actualStrictBounds']=list(map(str,[lower,upper]));p['largestIntegerFitsAndNextIntegerFails']=True
 elif i==37:minutes,meters,hours=n;assert min(n)>0;out=meters/minutes*hours*60/1000
 elif i==38:
  dates=re.findall(r'(\d{4}) жылдың (\d+) мамырында',s);assert len(dates)==3 and len(set(day for y,day in dates))==1;births=[F(y)for y,day in dates];goal=n[-1];out=(sum(births)+goal)/3;assert out.denominator==1 and out>max(births)and sum(out-b for b in births)==goal;p['allThreeSharedBirthdayAges']=list(map(str,[out-b for b in births]));p['commonBirthdayDateFixesWholeAgeConvention']=True
 elif i==39:a,b=n;assert min(n)>0;out=4*(a+b);p['originalTwoSidesRestoredBySeparateDoublings']=list(map(str,[2*a,2*b]))
 elif i==41:
  assignments=[v for v in parts if'='in v];assert len(assignments)==2;total,product=[E.calc(v.split('=')[1])for v in assignments];assert total*total>=4*product;out=total*total-2*product;p['realPairExistsNonnegativeDiscriminant']=str(total*total-4*product);p['sumOfSquaresPolynomialIdentityUsed']=True
 elif i==42:
  if src:count=F(1000000);mass=one(n);assert'Миллион'in s
  else:count,mass=n
  assert count>0 and mass>0;out=mass*1000000/count;p['tonnesConvertedToGramsBeforePerItemDivision']=True
 elif i==43:
  factors=prime_factors(one(n));out=F(len(factors));p['allPrimeFactorsWithMultiplicities']={str(k):v for k,v in factors.items()};p['distinctPrimeFactorsNotTotalExponentCount']=True
 elif i==44:price,up,down=n;assert price>0 and up>0 and 0<down<100;intermediate=price*(1+up/100);out=intermediate*(1-down/100);p['firstChangedPriceAndActualSecondDiscount']=list(map(str,[intermediate,intermediate*down/100]))
 elif i==45:out=E.expr(one(parts));p['formalWholePolynomialIdentityCompared']=True
 elif i==46:
  expr=one(parts);op,bound=B.relation(expr);assert op=='<'and bound>1;valid=list(range(1,math.ceil(bound)));out=F(sum(valid));assert valid[-1]<bound<=valid[-1]+1;lhs,rhs=H.tex(expr).split('<');assert all(direct(lhs,{'x':F(x)})<direct(rhs,{'x':F(x)})for x in valid);assert not direct(lhs,{'x':F(valid[-1]+1)})<direct(rhs,{'x':F(valid[-1]+1)});p['allPositiveIntegerSolutions']=valid;p['strictUpperBound']=str(bound)
 elif i==47:out,q=cryptarithm(r,src);p.update(q)
 elif i==49:discount,price=n;assert 0<discount<100 and price>0;out=price/(1-discount/100);assert out*(1-discount/100)==price
 elif i==50:
  clock=one(re.findall(r'\d{1,2}:\d{2}',s));N.clock(clock);hh,mm=map(int,clock.split(':'));hour=F(hh%12*30)+F(mm,2);minute=F(mm*6);delta=abs(hour-minute);out=min(delta,360-delta);assert 0<=out<=180;p['actualHourMinuteHandAngles']=list(map(str,[hour,minute]));p['hourHandMovesDuringMinutes']=True
 else:raise AssertionError(i)
 if i!=45:p['exactTarget']=str(out)
 return out,p
def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))==5 and r['answer']in opts
 if i==15:
  assert all(set(v.replace('<',''))==set('ABCDE')and len(v.split('<'))==5 for v in opts);assert r['answer']==out;p['allFiveFullOrderPermutationsChecked']=opts
 elif i==31:
  vals=[tuple(H.numeric_tokens(v))for v in opts];assert len(set(vals))==5 and vals.count(out)==1 and tuple(H.numeric_tokens(r['answer']))==out;p['allFiveChickenRabbitPairs']=list(map(str,vals))
 elif i==45:return out,B.symbolic(r,out,[],p)
 else:p.update(B.checked_choices(r,out))
 return out,p
CHANGES={1:[('(3/8) × x','(5/8) × x')],2:[('3; 7; 13; 21','4; 8; 14; 22')],3:[('1 принтерге 30 бет','1 принтерге 40 бет')],4:[('100-ге тең','104-ке тең')],5:[('27 евро','36 евро')],6:[('42 секіріске','48 секіріске')],8:[('50 жапсырма','56 жапсырма')],10:[('180 × 2400','200 × 2400')],12:[('«5 +','«6 +')],13:[('48 бетті','60 бетті')],14:[('15%-ға','20%-ға')],16:[('25 нүкте','29 нүкте')],21:[('18 × 20','180 × 20')],23:[('p = −2','p = −3')],24:[('12 стақан','16 стақан')],26:[('55 км/сағ','60 км/сағ')],27:[('42 + 43 + 44 + … + 64 + 65 + 66','43 + 44 + 45 + … + 65 + 66 + 67')],28:[('= 9 −','= 10 −')],29:[('3 + 12/','3 + 18/')],30:[('18%-ға','20%-ға')],32:[('−3','−4')],35:[('110 адам','121 адам')],36:[('(9/10)','(11/10)')],37:[('180 м','200 м')],38:[('130 болады','133 болады')],39:[('6 см × 9 см','7 см × 9 см')],41:[('a + b = 12','a + b = 13')],42:[('180 тонна','200 тонна')],43:[('180 санының','210 санының')],44:[('480 теңге','600 теңге')],46:[('+ 5.4','+ 6.4')],47:[('overline(D2DD)','overline(D1DD)')],49:[('102000 теңге','119000 теңге')],50:[('2:40','3:40')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==15:d['statement']=d['statement'].replace('A + 6','A + 10');d['answer']='A<E<C<D<B';return d
 if i==31:
  d['statement']=d['statement'].replace('38 бас','40 бас');d['options']=[f'тауық — {a}, қоян — {b}'for a,b in[(26,14),(28,12),(30,10),(32,8),(24,16)]];d['answer']=d['options'][1];return d
 if i==45:
  d['statement']=d['statement'].replace('6.4 × e','7.4 × e');d['options']=['('+v+') + e'for v in d['options']];d['answer']='6.2 × e − 3.2';d['options'][3]=d['answer'];return d
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i);assert old!=new,(i,new);d['options']=[str(B.scalar(v)+new-old)for v in d['options']];d['answer']=str(new);return d
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==37;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and not q['svg']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);d=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'INVALID'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve(d,i)
  except Exception as e:raise AssertionError(('validchanged',i))from e
  proof['validChangedActualInputAnswer']=d['answer'];proof['oldKeyRejectedCorrectChangedInputAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and((before[-1].isascii()and before[-1].isalpha())or before[-1]in'!<>'):continue
   if r['solution'][match.end():].lstrip().startswith('!'):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All37fullsource/newconditions official/newsolutions/all185choicesread. Actualprintedmath checked exactrational/formalpolynomial identities, fixedsecond-difference/ordering/midpoint models, factorial/primefactor/productdigit/all5040cryptarithmassignments, exactfixedrateconversion/stock/age/ratio/purchase/motion/rounding replays. Nestedfractions separatelydirectASTevaluatedpreservingallintermediatezerodenominators; fulloriginalforbiddenrootsetrejectedandactualrootreplayed. Positiveintegers/strictbounds/allpairchoices andcontinuousclockhourhand checked. All37changedactualinputscanariesrejectoldkeysandacceptrecomputedanswers. Sameauthornotanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':37,'sourceOptionsRead':185,'rewrittenOptionsRead':185,'wrongKeysRejected':37,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':37,'allOriginalNestedFractionDomainsDirectlyEvaluated':True,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':37,'remainingBIL7BitmapTasks':13,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
