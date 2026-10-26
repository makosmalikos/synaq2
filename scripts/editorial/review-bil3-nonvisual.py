"""All39 full saved/new nonvisual conditions, full official/new solutions and
all195source/newchoices read. Same author separate exact computation, not a
separate human reviewer. Eleven visualsourcequestions remain separate.
"""
import ast,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil3-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('b','scripts/editorial/review-bil1-nonvisual.py');B=importlib.util.module_from_spec(sp);sp.loader.exec_module(B);H=B.H;E=B.E;one=B.one

def exact_power_arithmetic(s):
 normalized=re.sub(r'\^\{(\d+)\}',r'^\1',E.plain(s)).replace('\\div','/');tree=ast.parse(H.arithmetic_text(normalized).replace('^','**'),mode='eval')
 def go(n):
  if isinstance(n,ast.Expression):return go(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return-go(n.operand)if isinstance(n.op,ast.USub)else go(n.operand)
  assert isinstance(n,ast.BinOp);a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):assert b;return a/b
  assert isinstance(n.op,ast.Pow)and b.denominator==1 and 0<=b<=3000;v=a**int(b);assert v.numerator.bit_length()<15000 and v.denominator.bit_length()<15000;return v
 return go(tree)
def clock(s):
 m=re.fullmatch(r'(\d{1,2}):(\d{2})',s);assert m;h,m=map(int,m.groups());assert 0<=h<24 and 0<=m<60;return F(60*h+m)
def clock_text(v):assert v.denominator==1;return f'{int(v)//60:02}:{int(v)%60:02}'
def fractions(s,src):
 return[E.calc(p)for p in H.math_parts(s,True)]if src else[F(int(a),int(b))for a,b in re.findall(r'\((\d+)/(\d+)\)',s)]
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);proof={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))};out=None
 if i==1:
  vals=list(map(B.scalar,B.options(r)));out=min(vals);assert sum(v<F(1,2)for v in vals)==1 and out<F(1,2);proof['twiceNumeratorVsDenominatorForEveryOption']=[2*v.numerator-v.denominator for v in vals]
 elif i==2:
  digits=5 if'бес таңбалы'in s else 7 if'жеті таңбалы'in s else 9 if'тоғыз таңбалы'in s else 0;assert digits and'екі таңбалы'in s and'бір таңбалы'in s;start=10**digits-1;sub=99;end=9;out=F(start-end,sub);assert out.denominator==1 and start-sub*out==end;proof['actualMaximumStartSubtrahendRemainder']=[start,sub,end]
 elif i==4:
  a,p,d,z=n;share=p/d;assert 0<share<1 and a>z;contents=(a-z)/share;out=(a-contents)*1000;assert out>0 and contents>0 and (1-share)*contents+out/1000==z;proof.update({'wholeContentMass':str(contents),'bothWeighingsReplayed':True})
 elif i==5:
  first,second,together=n;offset=first+second-together;out=second-offset;assert first-offset>0 and out>0 and first-offset+out+offset==together;proof['sameAdditiveScaleError']=str(offset)
 elif i==6:
  t=H.tex(one(parts));inner,bound=one(re.findall(r'\|(.+?)\|\s*≤\s*(\d+)',t));coef,c=E.affine(inner);a=one(coef);bound=F(bound);assert a>0;lo=(-bound-c)/a;hi=(bound-c)/a;sol=list(range(math.ceil(lo),math.floor(hi)+1));assert sol;assert all(abs(E.expr(inner).value({'x':F(v)}))<=bound for v in sol);assert all(abs(E.expr(inner).value({'x':F(v)}))>bound for v in[sol[0]-1,sol[-1]+1]);out=F(sum(sol));proof.update({'allExactIntegerSolutions':sol,'exactClosedBounds':[str(lo),str(hi)],'bothNextExteriorIntegersRejected':True})
 elif i==8:
  area,a,b=H.numeric_tokens(s.replace('см²','см'));assert area>0 and min(a,b)>0;out=area*b/(a+b);proof['commonAltitudeExactAreaRatio']=str(out/area)
 elif i==9:
  if src:gap,year=n;ratio=F(3);assert'үш есе'in s
  else:gap,year,ratio=n
  young=gap/(ratio-1);old=young*ratio;out=year-old;assert young>0 and young.denominator==out.denominator==1 and old-young==gap;proof['bothCityAgesInStatedYear']=list(map(str,[young,old]))
 elif i==11:
  eq=one(p for p in parts if'='in p);t=H.tex(eq);t=re.sub(r'\\overline\{([^}]+)\}',r'\1',t);m=re.fullmatch(r'\s*(\d)A\s*\*\s*(\d+)\s*=\s*(\d+)\s*\*\s*A(\d)\s*',t);assert m;d,k,l,e=map(int,m.groups());assert d==e and d>0;sol=[a for a in range(1,10)if(10*d+a)*k==l*(10*a+d)];out=F(one(sol));proof['allNineNonzeroDigitAssignmentsChecked']=9;proof['bothExactFullProducts']=str((10*d+int(out))*k)
 elif i==13:
  a,b,p,q=n;out=(a-b)/(p-q);assert out>0 and out.denominator==1;left=a-p*out;assert left==b-q*out>=0;proof['bothPositiveRemainingStocks']=str(left)
 elif i==14:
  value=int(one(n));pairs=[]
  for b in range(1,value.bit_length()):
   low,high=1,value
   while low<=high:
    a=(low+high)//2;p=a**b
    if p<value:low=a+1
    elif p>value:high=a-1
    else:pairs.append((a,b));break
  assert pairs;out=F(sum(b for a,b in pairs));proof['allPositiveIntegerBaseExponentPairs']=[list(p)for p in pairs];proof['allExponentValuesThroughBinaryBitBoundChecked']=value.bit_length()-1
 elif i in[15,28]:
  definition=one(p for p in parts if'='in p).split('=')[1];formula=E.expr(definition);expected=E.expr('(a+b)^2'if i==15 else'a^2-b');assert formula.equals(expected);asked=parts[-1];nums=H.numeric_tokens(asked)
  if i==15:
   a,b,c=nums;first=formula.value({'a':a,'b':b});out=formula.value({'a':first,'b':c});proof['nestedInnerValue']=str(first)
  else:a,b=nums;out=formula.value({'a':a,'b':b})
  proof['actualDefinedFormulaFormallyCheckedBeforeSubstitution']=True
 elif i in[16,19,31,35,42]:
  expr=one(parts).split('=')[0].strip();out=exact_power_arithmetic(expr);proof['allActualArithmeticEvaluatedExactlyIncludingOriginalNonzeroDenominators']=True
  if i==16:
   pp=[tuple(map(int,p))for p in re.findall(r'(\d+)\^\{?(\d+)\}?',E.plain(expr))];assert len(pp)==4 and len({a for a,b in pp})==1;base=pp[0][0];a,b,c,d=[b for a,b in pp];assert a-b==c-d>0 and b-d>=0;assert out==base**(b-d);proof['commonFactorCancellationCrossChecksFullBigIntegerArithmetic']=True
  elif i==19:
   nums=H.numeric_tokens(expr);assert len(nums)==12;top=[nums[j]/nums[j+1]for j in range(0,6,2)];bottom=[nums[j]/nums[j+1]for j in range(6,12,2)];factor=one({b/a for a,b in zip(top,bottom)});assert out==1/factor;proof['allThreeTermwiseScaleFactorsEqual']=str(factor)
  elif i==35:
   powers=[int(a)for a,b in re.findall(r'(\d+)\^(\d+)',E.plain(expr))if b=='2'];assert len(powers)==2 and out==(powers[0]-powers[1])**2;proof['differenceSquareCrossChecksExpandedArithmetic']=True
  elif i==42:
   pp=[tuple(map(int,p))for p in re.findall(r'(\d+)\^\{?(\d+)\}?',E.plain(expr))];base,exp=pp[0];assert all(a==base and b==exp-1 for a,b in pp[1:]);assert out==F(base,len(pp)-1);proof['actualRepeatedDenominatorPowerCount']=len(pp)-1
 elif i==18:
  raw=s.replace('$','').replace('{:}',':');starts=re.findall(r'\d{1,2}:\d{2}',raw);start=clock(one(starts));remaining=H.numeric_tokens(raw.replace(one(starts),''));walk,h,m=remaining;out=start+2*walk+60*h+m;assert out<1440;proof['bothEqualWalkDurationsAndFullStayMinutes']=list(map(str,[walk,walk,60*h+m]))
 elif i==20:
  eq=one(p for p in parts if'='in p);x,eqproof=E.equation(eq);value=parts[-1];out=E.expr(value).value({'x':x});proof.update(eqproof);proof['uniqueEquationRootSubstitutedInEntireProduct']=True
 elif i==21:
  t=H.tex(s);seed=F(one(re.findall(r'[ST](?:_1|₁)\s*=\s*(\d+)',t)));base=F(one(re.findall(r'\((\d+)\s*\+\s*n\)\^n',t)));assert'S_3'in s or'T₃'in s;states=[seed]
  for k in[2,3]:states.append(states[-1]+(base+k)**k)
  out=states[-1];proof['allSuccessiveRecurrenceStates']=list(map(str,states))
 elif i==24:
  a,b=fractions(s,src);assert a>0 and b>0 and a+b<1;out=1-a-b;proof['threeSharesSumToOne']=a+b+out==1
 elif i==25:
  expr=one(parts);ns=H.numeric_tokens(expr);start=ns[0];shown=list(zip(ns[1::2],ns[2::2]));assert all(b==a+1 for a,b in shown);assert[a for a,b in shown[:-1]]==list(range(1,len(shown)));last=int(shown[-1][0]);out=start;states=[out]
  for k in range(1,last+1):out/=F(k,k+1);states.append(out)
  assert out==start*(last+1);proof.update({'allSuccessiveDivisionValues':list(map(str,states)),'consecutiveShownFractionsAndFullUnshownRangeChecked':True})
 elif i==27:
  monthly,annual=n;out=12*monthly-annual;assert out>0
 elif i==29:
  if src:assert'үштен екісін'in s and'үштен бірін'in s;a,b=F(2,3),F(1,3);remaining=one(n)
  else:a,b=fractions(s,False);remaining=n[-1]
  assert 0<a<1 and 0<b<1;out=remaining/(1-a)/(1-b);assert out*(1-a)*(1-b)==remaining;proof['bothForwardRemainingBalances']=list(map(str,[out*(1-a),remaining]))
 elif i==30:index=one(n);out=2*index-1;assert index>0 and index.denominator==1 and out%2==1
 elif i==32:
  expr=one(parts);ns=H.numeric_tokens(expr);triples=[ns[j:j+3]for j in range(0,len(ns),3)];assert all(a==b==1 for a,b,c in triples);shown=[int(c)for a,b,c in triples];assert shown[:-1]==list(range(shown[0],shown[0]+len(shown)-1));start,last=shown[0],shown[-1];out=F(1)
  for k in range(start,last+1):out*=1+F(1,k)
  assert out==F(last+1,start);proof['fullConsecutiveProductRange']=list(range(start,last+1))
 elif i==33:
  lines=[]
  for p in parts:
   lhs,rhs=p.split('=');ab,c=E.affine(lhs,('x','y'));assert c==0 and min(ab)>0;lines.append((*ab,E.calc(rhs)))
  a,b,c=lines[0];d,e,f=lines[1];assert a*e==b*d;areas=[z*z/(2*x*y)for x,y,z in lines];out=abs(areas[1]-areas[0]);proof['bothAxisInterceptTriangleAreas']=list(map(str,areas))
 elif i==34:
  starts=re.findall(r'\d{1,2}:\d{2}',s);assert len(set(map(clock,starts)))==1;start=clock(starts[0]);distance=n[0]
  if src:vel=[F(v)for v in re.findall(r'(\d+) км/сағ',s)]
  else:vel=list(map(F,one(re.findall(r'жылдамдықтары (\d+) және (\d+) км/сағ',s))))
  assert len(vel)==2 and min(vel)>0;time=distance/sum(vel);out=start+60*time;assert out.denominator==1 and out<1440;proof['bothDistancesUntilMeeting']=list(map(str,[time*v for v in vel]));assert sum(time*v for v in vel)==distance
 elif i==36:out=360-sum(n);assert len(n)==3 and all(0<v<180 for v in n+[out])
 elif i==37:
  days,cash,worked=n;assert 0<worked<days;out=cash*worked/(days-worked);assert out/worked==(cash+out)/days;proof['sameDailyWageBothPaymentPeriods']=str(out/worked)
 elif i==40:
  volume=one(n);a=one(v for v in range(1,int(volume)+1)if v**3==volume);out=F(6*a*a);proof['uniquePositiveCubeEdge']=a
 elif i==41:base,first,second=n;out=base*first*second/10000
 elif i==43:
  if src:a,b=fractions(s,True);capacity=n[-1]
  else:capacity=n[0];a,b=fractions(s,False)
  assert 0<=b<a<=1 and capacity>0;out=capacity*(a-b);proof['beforeAndAfterPhysicalVolumes']=list(map(str,[capacity*a,capacity*b]))
 elif i==44:
  glasses,cups=map(int,n);possible=[]
  for fullCup in range(cups+1):
   for emptyGlass in range(glasses+1):
    if fullCup==emptyGlass:possible.append(emptyGlass+cups-fullCup)
  out=F(one(set(possible)));proof['allFeasibleCupGlassCountAssignmentsEnumerated']=len(possible)
 elif i==45:
  length,tunnel,speed=n;out=(length+tunnel)/speed;assert min(n)>0;proof['leadingEndCompleteTravelDistance']=str(length+tunnel)
 elif i==46:
  a,b,total=n;pace=60*a+b;seconds=60*total;out=F(math.floor(seconds/pace));assert out*pace<=seconds<(out+1)*pace;proof['wholeAndNextKilometerTimeSeconds']=list(map(str,[out*pace,(out+1)*pace,seconds]))
 elif i==47:
  initial,after=n;assert initial>after>0;out=100*(initial-after)/initial
 elif i==48:
  a,b,c,future=n;elapsed=future-a;assert elapsed>0;ages=[v+elapsed for v in[a,b,c]];out=sum(ages)/3;assert ages[0]==future and ages[0]-ages[1]==a-b and ages[1]-ages[2]==b-c;proof['allFutureAges']=list(map(str,ages))
 elif i==50:
  total,product=map(int,n);pairs=[(a,total-a)for a in range(1,total)if a<=total-a and a*(total-a)==product];a,b=one(pairs);out=F(b-a);assert out>0;proof['uniqueUnorderedPositiveAgePair']=[a,b]
 else:raise AssertionError(i)
 assert isinstance(out,F)or type(out)is int;out=F(out);proof['exactTarget']=str(out);return out,proof

def solve(r,i,src=False,check=True):
 out,proof=target(r,i,src)
 if check:
  if i in[18,34]:
   vals=[clock(v)for v in B.options(r)];assert len(vals)==len(set(vals))==5 and vals.count(out)==1 and clock(r['answer'])==out;proof['allFiveClockChoicesMinutes']=list(map(str,vals));proof['clockTimeTarget']=clock_text(out)
  else:proof.update(B.checked_choices(r,out))
 return out,proof
CHANGES={2:[('жеті таңбалы','тоғыз таңбалы')],4:[('2.85 кг','3.05 кг'),('0.85 кг','1.05 кг')],5:[('4.3 кг','4.5 кг')],6:[('≤ 11','≤ 15')],8:[('84 см²','98 см²')],9:[('2008 жылы','2012 жылы')],11:[('6300','5460'),('4788','4704')],13:[('170 жапсырма','174 жапсырма')],14:[('6561','729')],15:[('⊙ 4»','⊙ 5»')],16:[('5^','7^')],18:[('09:38','09:43')],19:[('(7/','(9/')],20:[('= 16','= 19')],21:[('T₁ = 6','T₁ = 7')],24:[('(3/8)','(1/4)')],25:[('«2 ÷','«3 ÷')],27:[('650 теңге','700 теңге')],28:[('14 ▽ 14','15 ▽ 15')],29:[('1500 теңгесі','1800 теңгесі')],30:[('52-шісін','53-шісін')],31:[('(2 − 11)','(3 − 11)')],32:[('26','29')],33:[('= 28','= 32')],34:[('540 км','600 км')],35:[('2031','2032')],36:[('113°','114°')],37:[('252000','270000')],40:[('1728','2197')],41:[('240','280')],42:[('30^','35^')],43:[('90 литр','108 литр')],44:[('7 кесе','8 кесе')],45:[('4140 м','5040 м')],46:[('50 минутта','60 минутта')],47:[('17400','18000')],48:[('36 жасқа','39 жасқа')],50:[('31,','33,'),('228','266')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==1:d['options'][0]='(2/7)';d['options'][1]='(9/16)';d['answer']='(2/7)';return d
 for a,b in CHANGES[i]:assert a in d['statement'];d['statement']=d['statement'].replace(a,b)
 old,_=solve(r,i);new,_=solve(d,i,False,False);assert new!=old;delta=new-old
 if i in[18,34]:d['options']=[clock_text(clock(v)+delta)for v in B.options(r)];d['answer']=clock_text(new)
 else:d['options']=[str(B.scalar(v)+delta)for v in B.options(r)];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==39;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert not q['images']and not q['svg']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];out,proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  try:d=changed(r,i)
  except Exception as e:raise AssertionError(('changedCondition',i))from e
  for cr in[{**r,'answer':'999999999'},{**d,'answer':r['answer']}]:
   try:solve(cr,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  new,p=solve(d,i);proof['validChangedActualInputTarget']=str(new);proof['oldKeyRejectedAndCorrectChangedInputAccepted']=True
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and (before[-1]in'⊙▽'or before[-1].isascii()and before[-1].isalpha()):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full39source/newconditions fullofficial/newsolutions/all195source/newchoices read. Checker recomputes onlyactualprintedfractions/equations/numericaldata/customformulas/clocktimes/powerexpressions/recurrenceandtelescopingendpoints. Exactrationalandboundedbig-integer arithmetic crosscheckedbycancellation; allnonzerodenominators/wholeages/digits/absoluteinequalitybounds/completeintegerpowers/feasibleemptycontainercounts/wholekilometerfloor andfullmotion/paymentreplays. Everyvalidchangedcondition rejectsoldkey andaccepts recomputedanswer. Knownroles preserved; unknownsourceerrorintentnotinvented. Same author notseparatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':39,'fullSourceNewConditionsAndSolutionsRead':39,'sourceOptionsRead':195,'rewrittenOptionsRead':195,'wrongKeysRejected':39,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':39,'printedSolutionEqualitiesVerified':equalities,'nativeFigures':0,'remainingVisualSourceTasks':11,'pythonJavaScriptHashesMatched':39,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
