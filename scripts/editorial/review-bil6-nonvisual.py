"""All36fullsource/newconditions official/newsolutions andall180source/newchoices
read. Actualprintedmath only drives separate exact computation. Same root
author, notanotherhumanreviewer. Fourteenbitmapquestions remain separate.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil6-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('g','scripts/editorial/review-bil4-nonvisual.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);N=G.N;B=G.B;H=G.H;E=G.E;R=E.R;one=G.one
def roots(s):return tuple(sorted(H.numeric_tokens(s)))
def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i==1:
  num,den,first,second,a,b=n;assert 0<num<den and min(first,second,a,b)>0;spent=first*b/a+second;remaining=spent*(den-num)/num;out=F(math.floor(remaining));assert out<=remaining<out+1;p.update({'spentInSecondItemPriceUnits':str(spent),'remainingInSecondItemPriceUnits':str(remaining),'maximumWholePurchaseAndNextUnaffordableProved':True})
 elif i in[2,3,18,37,39,48]:
  expr=one(parts).split('=')[0];out=N.exact_power_arithmetic(expr);p['exactFullPrintedExpressionValue']=str(out)
  if i==39:
   v=[F(a)for a in re.findall(r'(\d+)\^2',H.tex(expr))];assert len(v)==3 and out==(v[0]-v[1])*(v[0]+v[1])+v[2]**2;p['directSquaresAgreeWithDifferenceOfSquares']=True
 elif i==4:distance,base,scale=n;assert base==1 and distance>0 and scale>0;out=distance*100000/scale;p['kilometersConvertedToCentimetersBeforeScale']=True
 elif i==7:a,b,c,total=n;assert min(n)>0;out=total*b/(a+b+c);assert total*a/(a+b+c)+out+total*c/(a+b+c)==total
 elif i in[10,20,45,49]:out,q=E.equation(one(v for v in parts if '='in v));p.update(q)
 elif i==12:
  env={}
  for eq in parts[:-1]:k,val=eq.split('=');env[k.strip()]=E.calc(val)
  assert set(env)==set('abc');out=E.expr(parts[-1]).value(env);assert out==sum(env.values());p['allActualThreeAssignedValuesAndFullAskedExpressionReplayed']={k:str(v)for k,v in env.items()}
 elif i in[13,17]:
  expr=one(parts);out=E.expr(expr);domain=['m']if i==13 else['a','b'];assert src or'нөлден өзгеше'in s
  env={v:F(j+2)for j,v in enumerate(sorted(set(k for mon in out.n for k in mon)|set(k for mon in out.d for k in mon)))}
  for v in domain:
   bad={**env,v:F(0)}
   try:E.expr(expr).value(bad)
   except ZeroDivisionError:pass
   else:raise AssertionError(('originaldenominatorzeroaccepted',i,v))
  p['actualOriginalDenominatorExcludedVariables']=domain
 elif i==15:red,blue=n;assert min(n)>0;out=100*blue/(red+blue);p['allEquallyLikelyIndividualOutcomesCounted']=str(red+blue)
 elif i==16:
  count=int(one(n));pairs=list(itertools.combinations(range(count),2));out=F(len(pairs));assert out==count*(count-1)/2;p['allUnorderedDistinctPlayerPairsEnumerated']=len(pairs)
 elif i==19:out=B.relation(one(parts));p['actualStrictHalflineRelation']=[out[0],str(out[1])]
 elif i==21:
  formula=parts[0].replace('\\triangle','△');lhs,rhs=formula.split('=');assert re.sub(r'\s','',lhs)=='b△a';values=[]
  for part in parts[1:]:bb,aa=H.numeric_tokens(part);values.append(E.expr(rhs).value({'b':bb,'a':aa}))
  assert len(values)==2;out=values[0]-values[1];p['actualOrderedOperationValues']=list(map(str,values));p['leftOperandIsBRightOperandIsA']=True
 elif i==22:
  whole,subdiv=n;assert whole.denominator==1 and subdiv==4;edge=math.isqrt(int(whole));assert edge*edge==whole;out=F(4*edge);p['wholeSquarePerimeterUnaffectedByInternalSubdivision']=True
 elif i==23:
  lhs,rhs=parts[:2];left,c=E.affine(lhs,('x',));right,d=E.affine(rhs,('y',));a,b=one(left),one(right);assert a==b>0;gap=n[-2];asked=parts[2];co,offset=E.affine(asked,('x',));assert one(co)==1 and gap>0 and offset<0;diff=(c-d+gap)/a;out=diff-offset;p['actualInvariantYminusX']=str(diff);p['actualAskedShiftConstant']=str(offset);assert a*F(1)+c==(a*(1+diff)+d)-gap
 elif i==25:
  eq=one(v for v in parts if '='in v);lhs,rhs=eq.split('=');left,right=E.expr(lhs),E.expr(rhs);assert all(mon.count('X')<=1 for mon in right.n);co=R({tuple(v for v in mon if v!='X'):value for mon,value in right.n.items()if'X'in mon},right.d);constant=R({mon:value for mon,value in right.n.items()if'X'not in mon},right.d);out=(left-constant)/co;assert src or'Q нөлден өзгеше'in s;p['nonzeroOriginalCoefficientDomain']='Q ≠ 0';p['actualFormulaIsolatedSymbol']='X'
 elif i==26:
  number,mult,digit=map(int,n);product=number*mult;out=F(str(product).count(str(digit)));p['actualExactWholeProduct']=str(product);p['allActualProductDigitFrequencies']=dict(collections.Counter(str(product)))
 elif i==28:
  eq=parts[0];lhs,rhs=eq.split('=');assert set(re.sub(r'[+\s]','',lhs))=={'n'};count=lhs.count('n');value=E.calc(rhs)/count;assert value>0 and value.denominator==1;asked=parts[1].split('=')[0];assert re.fullmatch(r'\d+\s*\^\s*n',asked.strip());out=N.exact_power_arithmetic(asked.replace('n',str(value)));p['actualRepeatedNCount']=count;p['exactSolvedN']=str(value)
 elif i==31:
  extra=one(n);assert'төрттен бірінен'in s;out=extra/F(3,4);assert out>0 and out-out/4==extra;p['bothWholeAndOwnQuarterDifferenceReplayed']=True
 elif i==33:
  clock=one(re.findall(r'\d{1,2}:\d{2}',s));N.clock(clock);slow,late,fast,early=H.numeric_tokens(s.replace(clock,''));assert 0<slow<fast and min(late,early)>0;distance=(late+early)/60/(1/slow-1/fast);deadline=distance/slow-late/60;assert deadline>0 and deadline==distance/fast+early/60;out=distance/deadline;p['sameRouteDistanceKm']=str(distance);p['exactAvailableOnTimeHours']=str(deadline);p['bothLateEarlyArrivalConstraintsReplayed']=True
 elif i==34:
  students,teachers,gap=n;groups=gap/(students-teachers);assert students>teachers>0 and groups>0 and groups.denominator==1;out=students*groups;assert out-teachers*groups==gap;p['wholeGroupCount']=str(groups)
 elif i==35:
  a,ap,b,bp,na,nb=map(int,n);assert min(n)>0;ca,cb=math.ceil(F(na,a)),math.ceil(F(nb,b));out=F(ca*ap+cb*bp);assert(ca-1)*a<na<=ca*a and(cb-1)*b<nb<=cb*b;allcosts=[x*ap+y*bp for x in range(ca+2)for y in range(cb+2)if x*a>=na and y*b>=nb];assert min(allcosts)==out;p['actualMinimumWholePackCounts']=[ca,cb];p['oneFewerPackFailsEachRequirement']=True
 elif i==38:price,paid=n;assert price>0 and 0<paid<100;out=price*(1-paid/100);assert out+price*paid/100==price
 elif i==40:
  first,second,mult=n;assert mult>1;out=(first+second)/(mult+1);other=[first-out,second-out];assert min(other)>0 and sum(other)+out==mult*out;p['overlappingSharedGroupCountedTwice']=True;p['positiveOtherGroupStocks']=list(map(str,other))
 elif i==41:total,girls=n;out=total*(1-girls/100);assert total>0 and 0<girls<100 and out.denominator==1
 elif i==42:
  eq=one(parts);norm=eq.replace('|−x|','x').replace('|-x|','x');root,_=E.equation(norm);assert root>0;out=(-root,root)
  for value in out:
   lhs,rhs=eq.replace('|−x|','('+str(abs(value))+')').replace('|-x|','('+str(abs(value))+')').split('=');assert E.calc(lhs)==E.calc(rhs)
  p['bothFullOriginalModulusRootsReplayed']=list(map(str,out));p['nonnegativeModulusSubstitutionHasUniquePositiveSolution']=str(root)
 elif i==43:
  father,child=n[:2];factor=F(3)if src else n[-1]
  if src:assert'үш есе'in s
  out=(father-factor*child)/(factor-1);assert father>child>0 and factor>1 and out>0 and father+out==factor*(child+out);p['bothAgesAdvanceBySamePositiveElapsedYears']=str(out)
 elif i==44:
  eq=one(v for v in parts if'='in v and'?'not in v);lhs,rhs=eq.split('=');co,c=E.affine('('+lhs+')-('+rhs+')',('x','y'));a,b=co;total=-c;assert min(a,b,total)>0 and all(v.denominator==1 for v in[a,b,total]);solutions=[(x,y)for x in range(1,int(total/a)+1)for y in range(1,int(total/b)+1)if a*x+b*y==total];x,y=one(solutions);out=F(x*y);p['allAdmissiblePositiveIntegerSolutions']=[list(v)for v in solutions];p['zeroExcludedByPositiveNaturalDomain']=True
 elif i==46:
  equations=[]
  for part in parts:
   if'?'in part:continue
   part=part.replace('\\triangle','t').replace('\\blacksquare','q').replace('○','t').replace('□','q');lhs,rhs=part.split('=');co,c=E.affine('('+lhs+')-('+rhs+')',('t','q'));equations.append(co+[-c])
  assert len(equations)==2;triangle,square=G.gaussian(equations,2);out=square;p['allActualTwoSymbolValues']={'first':str(triangle),'square':str(square)}
 else:raise AssertionError(i)
 if i not in[13,17,25]:p['exactTarget']=str(out)
 return out,p
def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))==5 and r['answer']in opts
 if i in[13,17,25]:return out,B.symbolic(r,out,p.get('actualOriginalDenominatorExcludedVariables',['Q']),p)
 if i==19:
  values=list(map(B.relation,opts));assert len(set(values))==5 and values.count(out)==1 and B.relation(r['answer'])==out;p['allFiveActualHalflineRelations']=[[a,str(b)]for a,b in values]
 elif i==42:
  values=list(map(roots,opts));assert len(set(values))==5 and all(len(v)==2 for v in values)and values.count(out)==1 and roots(r['answer'])==out;p['allFiveFullRootPairs']=[list(map(str,v))for v in values]
 else:p.update(B.checked_choices(r,out))
 return out,p
CHANGES={1:[('10 қалам алды','14 қалам алды')],2:[('«12 +','«13 +')],3:[('−4.2','−5.2')],4:[('270 км','300 км')],7:[('180 тонна','225 тонна')],10:[('= −23','= −43')],12:[('a = (4/7)','a = (5/7)')],15:[('11 көк','21 көк')],16:[('8 ойыншы','9 ойыншы')],18:[('999 −','1008 −')],20:[('= 4','= 9')],21:[('«7 △ 9»','«8 △ 9»')],22:[('196 см²','256 см²')],23:[('5-ке кем','10-ға кем')],26:[('876543219','876543210')],28:[('= 24','= 30')],31:[('4.5 кг','6 кг')],33:[('30 км/сағ','45 км/сағ')],34:[('60-қа көп','72-ге көп')],35:[('20 қарындаш','25 қарындаш')],37:[('4^5','4^6')],38:[('7200000','8000000')],39:[('+ 4^2','+ 5^2')],40:[('21000','27000')],41:[('680 оқушы','720 оқушы')],43:[('42 жаста','44 жаста')],44:[('= 31','= 36')],45:[('5.6/x','7/x')],46:[('= 9','= 11')],48:[('3 × 0','3 × 2')],49:[('12321','24642')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i in[13,17]:
  if i==13:d['statement']=d['statement'].replace('6 × m^2','9 × m^2');factor='(3/2)';d['answer']='(3 × m × n)/5'
  else:d['statement']=d['statement'].replace('15 × a^3','20 × a^3');factor='(4/3)';d['answer']='4 × a^2'
  d['options']=[factor+' × ('+v+')'for v in d['options']];d['options'][0]=d['answer'];return d
 if i==25:
  d['statement']=d['statement'].replace('Q)/6','Q)/8');d['options']=[v.replace('6','8')for v in d['options']];d['answer']=d['options'][-1];return d
 if i==19:
  d['statement']=d['statement'].replace('< 18','< 20');d['options']=['x < 6','x > 6','x < 7','x > 7','x > 5'];d['answer']='x > 7';return d
 if i==42:
  d['statement']=d['statement'].replace('− 8','− 10');d['options']=['−6; 6','−5; 5','−15; 15','−4; 4','−10; 10'];d['answer']='−5; 5';return d
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i);assert new!=old,(i,new);d['options']=[str(B.scalar(v)+new-old)for v in d['options']];d['answer']=str(new);return d
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==36;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert not q['images']and not q['svg']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);d=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'INVALID'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:new,p2=solve(d,i)
  except Exception as e:raise AssertionError(('validchanged',i))from e
  proof['validChangedActualInputAnswer']=d['answer'];proof['oldKeyRejectedCorrectChangedInputAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and ((before[-1].isascii()and before[-1].isalpha())or before[-1]in'△○□'):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All36fullsource/newconditions official/newsolutions/all180source/newchoicesread. Actualprintedmath independentlyparsed exactrationals/formalpolynomialidentities withoriginaldenominatorexclusions, allstrictrelationandbothmodulusroots, allunorderedplayerpairs/positiveDiophantinepairs/productdigits, wholepurchasefloor/packceilbounds, exactmotionlateearlyreplays/symbolrank2/ageandstockinvariants. All36validchangedactualinputscanaries rejectoldkeysandacceptrecomputedanswers. Sameauthornotanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':36,'sourceOptionsRead':180,'rewrittenOptionsRead':180,'wrongKeysRejected':36,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':36,'symbolicMCQSets':3,'fullModulusRootPairSets':1,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':36,'remainingBIL6BitmapTasks':14,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
