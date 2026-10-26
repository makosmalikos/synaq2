"""All35 BIL11 core saved/new full conditions official/new solutions and all140
saved/new choices read. Four-choice source format retained. Actual printed data
control exact calculations and complete finite searches. Same author computation,
not another human reviewer. Four visual tasks and native table35 remain separate.
"""
import ast,collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil11-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('j','scripts/editorial/review-bil8-nonvisual.py');J=importlib.util.module_from_spec(sp);sp.loader.exec_module(J);N=J.N;B=J.B;H=J.H;E=J.E;one=J.one;G=J.J.G
def coords(s):
 s=E.plain(s);assert s[0]=='('and s[-1]==')';a,b=s[1:-1].split(';');return E.calc(a),E.calc(b)
def coord_text(pair):return '('+'; '.join(map(str,pair))+')'
def factorial_calc(s):
 def expand(m):
  n=int(m[1]);assert 0<=n<=30;return str(math.factorial(n))
 return N.exact_power_arithmetic(re.sub(r'(\d+)!',expand,E.plain(s)))
def parameter_option(s):
 t=E.plain(s).replace('\\ne','≠');a,op,b=re.split(r'([≠=<>])',t);assert a.strip()=='a';return op,E.calc(b)
def affine_relation(s):
 left,op,right=re.split(r'([<>≤≥])',E.plain(s));co,c=E.affine('('+left+')-('+right+')');a=one(co);assert a
 if a<0:op={'<':'>','>':'<','≤':'≥','≥':'≤'}[op]
 return op,-c/a
def parity(s,residue):
 tree=ast.parse(H.arithmetic_text(E.plain(s)).replace('^','**'),mode='eval')
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Name):assert n.id=='m';return residue
  if isinstance(n,ast.Constant):assert type(n.value)is int;return n.value%2
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return walk(n.operand)
  assert isinstance(n,ast.BinOp)
  if isinstance(n.op,ast.Pow):assert isinstance(n.right,ast.Constant)and type(n.right.value)is int and n.right.value>=1;return walk(n.left)
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,(ast.Add,ast.Sub)):return(a+b)%2
  assert isinstance(n.op,ast.Mult);return(a*b)%2
 return walk(tree)
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i in[1,3]:out=N.exact_power_arithmetic(one(parts))
 elif i==2:
  values=[int(v)for v in B.options(r)];divisors={v:[d for d in range(2,math.isqrt(v)+1)if v%d==0]for v in values};out=F(one(v for v in values if divisors[v]));p['allPossibleNontrivialDivisorsThroughSquareRoot']={str(k):v for k,v in divisors.items()}
 elif i==4:
  digits=[int(v)for v in n]if src else [int(v)for v in H.numeric_tokens(one(parts))];assert len(digits)==len(set(digits))and all(1<=v<=9 for v in digits);valid=list(itertools.permutations(digits,3));out=F(len(valid));assert out==len(digits)*(len(digits)-1)*(len(digits)-2);p['allThreeDigitPermutationCount']=len(valid);p['actualAllowedDigits']=digits
 elif i==5:
  decrease=one(n);assert 0<decrease<100;out=decrease/(100-decrease)*100;assert(1-decrease/100)*(1+out/100)==1
 elif i==6:up,down=n;factor=(1+up/100)*(1-down/100);assert 0<factor<1;out=(1-factor)*100
 elif i==7:
  eq=one(v for v in parts if'='in v);asked=one(v for v in parts if'='not in v);root,z=E.equation(eq);out=E.expr(asked).value({'x':root});p.update(z);p['askedQuotientNotEquationRoot']=True
 elif i==8:out,z=E.equation(one(parts));p.update(z)
 elif i==9:
  op,bound=affine_relation(one(parts));assert op=='<';out=F(math.ceil(bound)-1);assert out<bound<=out+1;p['strictUpperBound']=str(bound);p['largestIntegerAndNextInteger']=[str(out),str(out+1)]
 elif i==10:
  eqs=E.system(s,True)if src else parts;relations=[affine_relation(v.strip().rstrip(', .'))for v in eqs];assert len(relations)==2;upper=one(v for op,v in relations if op=='<');lower=one(v for op,v in relations if op=='≥');valid=list(range(math.ceil(lower),math.ceil(upper)));out=F(len(valid));assert valid and all(lower<=v<upper for v in valid);p['allIntegerSystemSolutions']=valid;p['actualInclusiveLowerStrictUpperBounds']=[str(lower),str(upper)]
 elif i in[11,12]:out=E.expr(one(parts));p['formalFullAffineExpressionIdentityChecked']=True
 elif i==13:
  values=[]
  for part in parts:
   expr=part.split('=',1)[1]if'='in part else re.sub(r'^[CD]','',E.plain(part));values.append(E.calc(expr))
  a,b=values;out=abs(b-a);p['actualBothSignedCoordinates']=list(map(str,values))
 elif i==15:
  eq=one(v for v in parts if'='in v);left,right=eq.split('=');co,c=E.affine('('+left+')-('+right+')',('x','y'));gap=n[-1];out=G.gaussian([[*co,-c],[F(1),F(-1),gap]],2);assert out[0]-out[1]==gap and E.expr(left).value(dict(zip(['x','y'],out)))==E.calc(right);p['bothCoordinateConditionsReplayed']=True
 elif i==16:
  eqs=E.system(s,True)if src else parts[:2];rows=[]
  for eq in eqs:
   left,right=eq.strip().rstrip(', .').split('=');co,c=E.affine('('+left+')-('+right+')',('x','y'));rows.append([*co,-c])
  x,y=G.gaussian(rows,2);out=x+y;p['uniqueSystemSolution']=list(map(str,[x,y]));assert all(sum(a*v for a,v in zip(row[:2],[x,y]))==row[-1]for row in rows)
 elif i==17:
  total,gap=n;valid=[(a,b)for a,b in itertools.product(range(1,10),range(10))if a+b==total and (10*b+a)-(10*a+b)==gap];a,b=one(valid);out=F(a*b);p['all90TwoDigitNumbersChecked']=True;p['uniqueDigits']=[a,b]
 elif i==18:
  hours=n[0];portion=one(J.fraction_parts(s,src));first,second=n[-2:];assert min(hours,first,second)>0 and 0<portion<1;out=hours/(portion/first+(1-portion)/second);times=[out*portion/first,out*(1-portion)/second];assert sum(times)==hours;p['bothTripPartTimes']=list(map(str,times))
 elif i==19:
  eq=one(parts);inside,right=re.fullmatch(r'\|(.+)\|\s*=\s*(.+)',E.plain(eq)).groups();co,c=E.affine(inside);a=one(co);bound=E.calc(right);assert a and bound>0;roots=[(bound-c)/a,(-bound-c)/a];assert all(abs(E.expr(inside).value({'x':v}))==bound for v in roots);out=abs(roots[1]-roots[0]);p['bothAbsoluteEquationRoots']=list(map(str,roots))
 elif i==20:
  eq=one(v for v in parts if'='in v);inside,right=re.fullmatch(r'\|(.+)\|\s*=\s*(.+)',E.plain(eq)).groups();assert E.expr(inside).equals(E.expr('0'));co,c=E.affine(right,('a',));a=one(co);assert a;root=-c/a;out=('≠',root);p['actualIdenticallyZeroInnerExpression']=inside;p['uniqueParameterForIdenticallyTrueEquation']=str(root)
 elif i==21:
  mean=one(n)if src else n[0];fraction=F(1,3)if src else one(J.fraction_parts(s,False));assert 0<fraction<1 and mean>0;large=2*mean/(1+fraction);small=large*fraction;out=small*large;assert(small+large)/2==mean;p['actualTwoPositiveNumbers']=list(map(str,[small,large]))
 elif i==22:
  if src:mean,remainingMean=n;count,remaining=6,5;assert'Алты санның'in s
  else:count,mean,remaining,remainingMean=n
  assert count==remaining+1;out=count*mean-remaining*remainingMean;p['originalAndRemainingSums']=list(map(str,[count*mean,remaining*remainingMean]))
 elif i==23:
  eq=one(v for v in parts if'='in v);pt=coords(one(v for v in parts if';'in v));left,right=eq.split('=');co,c=E.affine('('+left+')-('+right+')',('x','y'));ax,ay=co;assert ay;intercept=pt[1]+ax/ay*pt[0];out=(F(0),intercept);assert ax*pt[0]+ay*pt[1]==ay*intercept;p['parallelLineCoefficientsAndYIntercept']=list(map(str,[ax,ay,intercept]))
 elif i==24:
  eq=one(set(v for v in parts if'='in v));left,right=eq.split('=');assert left.strip()=='y';height=E.calc(right);point=coords(one(v for v in parts if';'in v));out=(point[0],height);p['verticalPerpendicularAndHorizontalIntersection']=[str(point[0]),str(height)]
 elif i==25:
  expression=E.plain(one(parts)).replace('{','').replace('}','');base,exponent=map(int,expression.split('^'));assert base>0 and exponent>0;out=F(pow(base,exponent,10));p['modularBaseExponentResult']=[base,exponent,int(out)]
 elif i==26:
  if src:boyFraction,girlFraction=F(1,4),F(1,3);singers,gap=6,2;assert'төрттен бірі'in s and'алтыға тең'in s
  else:boyFraction,girlFraction=J.fraction_parts(s,False);singers,gap=n[-2:]
  boySingers=(F(singers)-gap)/2;girlSingers=boySingers+gap;boys=boySingers/boyFraction;girls=girlSingers/girlFraction;assert min(boys,girls)>0 and boys.denominator==girls.denominator==1 and boySingers+girlSingers==singers;out=(girls,boys);p['actualBoysGirlsSingers']=list(map(str,[boySingers,girlSingers]))
 elif i==27:
  final=one(n);rounds=4;assert('төрт рет'in s)or(src and s.count('жартысын')==4);out=final*2**rounds;walk=[out/F(2**j)for j in range(rounds+1)];assert walk[-1]==final and all(v.denominator==1 for v in walk);p['allFourHalvingRoundsReplayed']=list(map(str,walk))
 elif i==28:
  if src:stock=[3,4];wear=[3,2];colors=['қызыл','көк'];assert'Бес балаға үш қызыл және төрт көк'in s
  else:stock1,stock2,wear1,wear2=map(int,n);stock=[stock1,stock2];wear=[wear1,wear2];colors=['жасыл','сары'];assert wear1+wear2==7 and'Жеті балаға'in s
  actual=[0]*wear[0]+[1]*wear[1];possible=[v for v in itertools.product(range(2),repeat=len(actual))if v.count(0)<=stock[0]and v.count(1)<=stock[1]];knowledge=[]
  for j in range(len(actual)):
   values={v[j]for v in possible if all(v[k]==actual[k]for k in range(len(actual))if k!=j)};assert values;knowledge.append(len(values)==1)
  known=[j for j,v in enumerate(knowledge)if v];counts=collections.Counter(actual[j]for j in known);p['allStockCompatibleAssignmentsEnumerated']=len(possible);p['knownColorChildIndices']=known;p['allIndividualPossibleOwnColors']=[sorted({v[j]for v in possible if all(v[k]==actual[k]for k in range(len(actual))if k!=j)})for j in range(len(actual))]
  wordnums={'екі':2,'үш':3,'төрт':4,'бес':5,'жеті':7};matches=[]
  for v in B.options(r):
   lower=v.lower()
   if lower=='ешкім':ok=not known
   elif lower.startswith('барлық'):ok=len(known)==len(actual)
   else:
    color=one(k for k,c in enumerate(colors)if c in lower);num=one(value for word,value in wordnums.items()if re.search(r'\b'+word+r'\b',lower));ok=counts=={color:num}and num==wear[color]
   if ok:matches.append(v)
  out=one(matches)
 elif i==30:
  if src:watermelons,melons,insideWater,insideMelons=map(F,[6,14,1,7]);assert'алты қарбыз'in s and'он төрт қауын'in s
  else:watermelons,pumpkin1,melons,insideWater,insideMelons=n;assert pumpkin1==1 and'Бір асқабақ'in s
  out=(melons-insideMelons)/(watermelons+insideWater);pumpkin=insideWater*out+insideMelons;assert out>0 and pumpkin>0 and watermelons*out+pumpkin==melons;p['watermelonPumpkinMassInMelonUnits']=list(map(str,[out,pumpkin]))
 elif i==31:
  seq=n if src else H.numeric_tokens(one(parts));assert len(seq)==4;mult=F(3);adds=[b-mult*a for a,b in zip(seq,seq[1:])];assert adds==[1,3,5];out=3*seq[-1]+7;p['allPriorRecurrenceIncrements']=list(map(str,adds))
 elif i==32:out=factorial_calc(parts[0]);p['wholeFactorialsExpandedWithExactIntegerArithmetic']=True
 elif i==33:
  days=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];start=one(j for j,v in enumerate(days)if re.search(r'\b'+v+r'\b',s,re.I));period,index=(5,10)if src else map(int,n);elapsed=period*(index-1);out=days[(start+elapsed)%7];p['actualElapsedDaysBetweenFirstAndAskedDuty']=elapsed
 elif i==34:
  values=[[parity(v,k)for k in range(2)]for v in B.options(r)];out=one(v for v,pair in zip(B.options(r),values)if pair==[0,0]);p['allPolynomialParitiesForBothIntegerResidueClasses']=values;p['positiveIntegerPowersPreserveBaseResidueModuloTwo']=True
 elif i==36:
  if src:meters,cm,lowmeters,lowcm=n;count=6;assert'алты ұлдың'in s
  else:count,meters,cm,lowmeters,lowcm=n
  mean=meters*100+cm;low=lowmeters*100+lowcm;assert low<mean;remaining=(count*mean-low)/(count-1);assert remaining>low and(count-1)*remaining+low==count*mean;out=remaining/100;p['allRemainingCanHaveCommonHeightCmWitness']=str(remaining)
 elif i==37:
  pairs=one(n);assert pairs>0;valid=[a for a in range(2,int(2*pairs)+2)if a*(a-1)/2==pairs];out=F(one(valid));assert int(out)*(int(out)-1)//2==pairs;p['uniquePositivePeopleCountByStrictlyIncreasingPairs']=int(out)
 elif i==39:
  if src:hours=one(n);loss=3;assert'үш минутқа'in s
  else:hours,loss=n
  assert hours==12 and loss>0;out=hours*60/loss;p['firstPositiveDisplayPeriodLossMinutes']=str(hours*60)
 else:raise AssertionError(i)
 if i not in[11,12]:p['exactTarget']=str(out)
 return out,p

def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))==4 and r['answer']in opts
 if i in[11,12]:
  vals=[E.expr(v)for v in opts];assert all(not a.equals(b)for a,b in itertools.combinations(vals,2));matches=[j for j,v in enumerate(vals)if v.equals(out)];assert len(matches)==1 and E.expr(r['answer']).equals(out);p['allFourOptionsComparedAsFormalPolynomialIdentities']=True
 elif i in[15,23,24]:vals=list(map(coords,opts));assert len(set(vals))==4 and vals.count(out)==1 and coords(r['answer'])==out;p['allFourCoordinateChoices']=[list(map(str,v))for v in vals]
 elif i==20:vals=list(map(parameter_option,opts));assert len(set(vals))==4 and vals.count(out)==1 and parameter_option(r['answer'])==out;p['allFourParameterRelations']=[[op,str(v)]for op,v in vals]
 elif i==26:vals=[tuple(H.numeric_tokens(v))for v in opts];assert len(set(vals))==4 and vals.count(out)==1 and tuple(H.numeric_tokens(r['answer']))==out;p['allFourGirlsBoysChoices']=[list(map(str,v))for v in vals]
 elif i in[28,33,34]:assert r['answer']==out
 else:
  vals=[factorial_calc(v)if i==32 else B.scalar(v)for v in opts];assert vals.count(out)==1 and (factorial_calc(r['answer'])if i==32 else B.scalar(r['answer']))==out;p['allFourActualOptionValues']=list(map(str,vals));p['uniqueCorrectOptionIndex']=vals.index(out)
 return out,p

CHANGES={1:[('× 18 ÷','× 20 ÷')],2:[],3:[('0.28','0.38')],4:[('6; 7','6; 7; 8')],5:[('20%-ға','25%-ға')],6:[('50%-ға','60%-ға')],7:[('x − 5','x − 14')],8:[('84.6','112.8')],9:[('4 + x','9 + x')],10:[('x − 4','x − 5')],11:[('− 28 +','− 29 +')],12:[('+ 89 −','+ 90 −')],13:[('D = 4 +','D = 5 +')],15:[('= 7','= 16')],16:[('= 4','= 5')],17:[('қосындысы 13','қосындысы 11')],18:[('18 сағат','20 сағат')],19:[('= (3/2)','= (9/4)')],20:[('= 7 −','= 9 −')],21:[('ортасы 15','ортасы 20')],22:[('ортасы 20','ортасы 21')],23:[('(3; 1)','(4; 1)')],24:[('y = 6','y = 7')],25:[('2027^2026','2027^2027')],26:[('Барлығы 8 әнші','Барлығы 10 әнші')],27:[('12 зат','14 зат')],28:[('Қараңғыда 4 балаға жасыл, 3 балаға сары','Қараңғыда 3 балаға жасыл, 4 балаға сары')],30:[('18 қауынмен','25 қауынмен')],31:[('3; 10; 33; 104','4; 13; 42; 131')],32:[('12!','13!'),('11!','12!'),('10!','11!')],33:[('12-кезекшілік','13-кезекшілік')],34:[],36:[('1 м 16 см','1 м 10 см')],37:[('91 қол','105 қол')],39:[('4 минутқа','5 минутқа')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==2:d['options'][-1]='187';d['answer']='187';return d
 if i==34:d['options'][1]=d['options'][1].replace('+ 6','+ 7');d['options'][-1]=d['options'][-1].replace('+ 3','+ 2');d['answer']=d['options'][-1];return d
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i)
 if i in[11,12]:
  delta='− 1'if i==11 else'+ 1';d['options']=['('+v+') '+delta for v in d['options']];d['answer']=d['options'][0 if i==11 else 1];assert not old.equals(new);return d
 assert old!=new,(i,old,new)
 if i in[15,23,24]:d['options']=[coord_text(tuple(v[j]+new[j]-old[j]for j in range(2)))for v in map(coords,d['options'])];d['answer']=coord_text(new)
 elif i==20:d['options']=[f'a {op} ({v+new[1]-old[1]})'for op,v in map(parameter_option,d['options'])];d['answer']=f'a ≠ ({new[1]})'
 elif i==25:d['answer']=str(new)
 elif i==26:d['options']=[f'{v[0]+new[0]-old[0]} қыз, {v[1]+new[1]-old[1]} ұл'for v in(tuple(H.numeric_tokens(v))for v in d['options'])];d['answer']=f'{new[0]} қыз, {new[1]} ұл'
 elif i in[28,33]:d['answer']=new
 else:d['options']=[str((factorial_calc(v)if i==32 else B.scalar(v))+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==35;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and (not q['svg']or i in[19,20]and all('width="0.333em" height="2.4em"'in v for v in q['svg']))and len(q['options'])==4;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
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
   if before and((before[-1].isascii()and before[-1].isalpha())or before[-1]in'!<>:◆⊕_'):continue
   if r['solution'][match.end():].lstrip().startswith(('!',':')):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions, official/new solutions and all140source/newchoices read. Actual printed givens independently recomputed using exact rational arithmetic, original constraints, finite digits/exponents/age/filling assignments, strict inequalities, exact rounding and time/area/volume conversions. All35 changed actual input canaries reject old keys and accept recomputed answers. Same author computational review, not another human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':35,'sourceOptionsRead':140,'rewrittenOptionsRead':140,'wrongKeysRejected':35,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':35,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':35,'remainingBIL11Tasks':[14,29,35,38,40],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
