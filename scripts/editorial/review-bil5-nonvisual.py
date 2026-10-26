"""All33 complete frozen and rewritten conditions, official/new solutions and
all165 options read. Separate exact computation by the same root author;
not a separate human reviewer. Calendar source assumption is recorded explicitly.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil5-nonvisual';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('n','scripts/editorial/review-bil3-nonvisual.py');N=importlib.util.module_from_spec(sp);sp.loader.exec_module(N);B=N.B;H=N.H;E=N.E;one=N.one
DAYS=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі']

def codewords(text,src):
 if src:
  codes={'A':'*##','B':'*#','C':'#*'};assert all(v in text for v in codes.values());message=one(re.findall(r'[*#]{8,}',text));new={'A':'01','B':'10','C':'011'};assert all(v in text for v in new.values())
 else:
  oldpart,newpart=text.split('Жаңа шифрда');codes=dict(re.findall(r'([ABC]) = «([*#]+)»',oldpart));new=dict(re.findall(r'([ABC]) = «([01]+)»',newpart));message=one(re.findall(r'Хабар «([*#]+)»',oldpart));assert set(codes)==set(new)==set('ABC')
 def decode(t):
  if not t:return ['']
  return [k+suffix for k,v in codes.items()if t.startswith(v)for suffix in decode(t[len(v):])]
 allwords=decode(message);word=one(allwords);assert ''.join(codes[v]for v in word)==message
 return ''.join(new[v]for v in word),{'actualOldCodes':codes,'actualNewCodes':new,'actualFullOldMessage':message,'allCompleteOldDecodings':allwords,'actualUniqueDecodedWord':word}

def positive_inequalities(r):
 results=[];coeffs=[]
 for raw in B.options(r):
  lhs,op,rhs=re.split(r'([<>])',H.tex(raw));co,c=E.affine('('+lhs+')-('+rhs+')',('a','b','c','d'));assert c==0 and co[2:]==[0,0] and co[0]==-co[1] and co[0]!=0
  results.append((co[0]>0)==(op=='>'));coeffs.append(str(co[0]))
 return one(v for v,ok in zip(B.options(r),results)if ok),{'allFiveExactCoefficientsOfPositiveDifferenceAminusB':coeffs,'allFiveActualInequalityTruthValues':results,'arbitraryThirdVariableCancelsExactly':True}

def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i==1:
  if src:
   lo,hi,left=map(int,n);assert lo==1 and 'төрт санды'in s;cards=list(range(lo,hi+1))
  else:cards=list(map(int,H.numeric_tokens(parts[0])));left=int(n[-1]);assert len(cards)==6 and len(set(cards))==6
  assert len(cards)==6 and left in cards;witness=[]
  for removed in itertools.combinations(cards,4):
   rest=set(cards)-set(removed)
   if left not in rest:continue
   for pair in itertools.combinations(removed,2):
    other=set(removed)-set(pair)
    if math.prod(pair)==math.prod(other):witness.append({'removed':list(removed),'pairs':[list(pair),sorted(other)],'lastErased':one(rest-{left})})
  out=F(one(set(v['lastErased']for v in witness)));p.update({'all15FourCardSubsetsAndAllSixPairSplitsChecked':True,'allValidEqualProductWitnesses':witness})
 elif i in[3,16,20,22,25]:
  expr=one(parts).split('=')[0].replace('\\div','/');out=E.calc(expr);p['exactFullPrintedExpressionValue']=str(out)
  if i==16:
   square,a,b=n;center=(a+b)/2;delta=(a-b)/2;assert square==center**2 and out==delta**2;p['directMultiplicationAgreesWithSymmetricDifferenceOfSquares']=True
 elif i==4:
  hours,minutes=n[:2];arrival=one(re.findall(r'\d{1,2}:\d{2}',s));elapsed=hours*60+minutes;clock=N.clock(arrival);assert 0<minutes<60 and elapsed<clock<1440;out=N.clock_text(clock-elapsed);assert N.clock(out)+elapsed==clock;p['departurePlusDurationReplaysSameDayArrival']=True
 elif i==5:minutes,hours=n;assert hours>0 and 0<minutes<hours*60;out=minutes/(60*hours)*100
 elif i==7:
  a,b,c,cc,d,e=n;assert min(n)>0;out=a/c*cc/e;p['actualSharedCRescalingRatio']=str(c/cc)
 elif i==8:
  total,avg,removedavg,last=n;removed=total-last if src else last;remaining=total-removed;assert 0<removed<total;out=(total*avg-removed*removedavg)/remaining;assert out*remaining+removed*removedavg==total*avg;p['remainingCount']=str(remaining);p['bothGroupSumsReassembleOriginalSum']=True
 elif i==9:
  assert 'a > b > 0'in s;out,q=positive_inequalities(r);p.update(q)
 elif i==10:
  a,b,delta=N.fractions(s,src)+[n[-1]];assert 0<a<1 and 0<b<1;read=a+(1-a)*b;unread=(1-a)*(1-b);out=delta/(read-unread);assert out>0 and out.denominator==1 and (out*a).denominator==1 and(out*(1-a)*b).denominator==1;assert out*read-out*unread==delta;p['exactReadUnreadFractions']=list(map(str,[read,unread]))
 elif i==12:
  vals=list(map(E.calc,B.options(r)));maximum=max(vals);out=one(v for v,x in zip(B.options(r),vals)if x==maximum);p['allFiveCompleteExpressionValues']=list(map(str,vals))
 elif i==13:
  seq=H.numeric_tokens(one(parts));diff=[b-a for a,b in zip(seq,seq[1:])];second=[b-a for a,b in zip(diff,diff[1:])];step=one(set(second));assert len(seq)==6 and step>0
  if not src:assert n[0]==step
  out=seq[-1]+diff[-1]+step;p['allFirstDifferences']=list(map(str,diff));p['uniqueConstantSecondDifference']=str(step)
 elif i==14:
  men,women,percent=n;assert 0<percent<100;out=(men+women)/(1-percent/100);assert out.denominator==1 and(out*percent/100).denominator==1
 elif i==15:
  a,b,c,cost1,cost2=n;assert min(n)>0;out=(b+c)*cost1+(a+c)*cost2;p['bothComplementGroupCounts']=list(map(str,[b+c,a+c]));p['overlappingThirdGroupPaysAtBothSeparateVenues']=True
 elif i==17:
  total=n[0];a,b=N.fractions(s,src);assert 0<a<1 and 0<b<1;out=total*(1-a)*b;assert(total*a).denominator==out.denominator==1;p['fractionAppliesToRemainderNotOriginalTotal']=True
 elif i==18:out,q=E.equation(one(parts));p.update(q)
 elif i==19:
  expr=parts[0]if not src else s
  digit=int(one(set(re.findall(r'(?:overline\(c|\\overline\{c)(\d)a',expr))));solutions=[]
  for a,b,c in itertools.permutations(range(10),3):
   if a and c and 100*a+10*b+c+100*a+10*c+b==100*c+10*digit+a:solutions.append((a,b,c))
  a,b,c=one(solutions);out=F(a+b+c);p.update({'all720DistinctDigitAssignmentsIncludingLeadingZeroExclusionChecked':True,'actualUniqueDigitTriple':[a,b,c],'actualThreeDigitAddition':[100*a+10*b+c,100*a+10*c+b,100*c+10*digit+a]})
 elif i==23:
  factor=F(2)if src else one(n);assert factor>1
  if src:assert'екі есе'in s
  valid=[v for v in range(10,100)if v//10==factor*(v%10)or v%10==factor*(v//10)];out=F(len(valid));p['all90TwoDigitNumbersChecked']=True;p['allValidTwoDigitNumbers']=valid
 elif i==24:
  day=one(j for j,v in enumerate(DAYS)if re.search(r'\b'+v+r'\b',s,re.I));clock=one(re.findall(r'\d{1,2}:\d{2}',s));hours=n[-1];assert hours>0;minutes=N.clock(clock)+hours*60;extra=int(minutes//1440);out=DAYS[(day+extra)%7];p.update({'fullElapsedDaysIncludingInitialClockMidnightCarry':extra,'finalClock':N.clock_text(minutes%1440),'actualStartWeekdayIndex':day})
 elif i==26:
  heavy,light=n;assert min(n)>1;out=heavy*light;mean=light;heavyFraction=(mean-1)/(out-1);assert 0<heavyFraction<1;assert heavyFraction*out+(1-heavyFraction)==mean;assert out/mean==heavy and mean==light;p['positiveFeasibleHeavyFractionWitness']=str(heavyFraction);p['bothUniformCounterfactualMassRatiosReplayed']=True
 elif i==27:
  group,staff=n[:2];girls=one(N.fractions(s,src));gap=n[-1];total=gap/(1-2*girls);out=total/group*staff;assert 0<girls<F(1,2) and total.denominator==out.denominator==1 and(total*girls).denominator==1 and total%group==0;p['actualBoysGirlsCounts']=list(map(str,[total*(1-girls),total*girls]))
 elif i==28:
  if src:
   assert 'үш қабатқа жоғары'in s and'жеті қабатқа төмен'in s and'бесінші қабатқа'in s;up,down,end=map(F,[3,7,5])
  else:up,down,end=n
  start=end+down-up;out=2*start-1;assert min(up,down,end,start)>0 and start+up<=out and start+up-down==end and out-start==start-1;p['originalMiddleFloor']=str(start);p['entireUpDownPathWithinBuilding']=True
 elif i==34:out,q=codewords(s,src);p.update(q)
 elif i==35:
  if not src:assert len(n)==3 and min(n)>0 and 'мөлдір емес'in s and 'сырттағы'in s
  normals=[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)];counts=[sum(sum(a*b for a,b in zip(normal,v))>0 for normal in normals)for v in itertools.product([-1,0,1],repeat=3)if any(v)];out=F(max(counts));assert out==3 and len(normals)==6;p.update({'all26NonzeroSignClassesOfExteriorViewingDirectionChecked':26,'oppositeFaceNormalsCannotBothHavePositiveDot':True,'threePositiveAxesAchieveUpperBound':True})
 elif i==36:
  if src:
   work=one(n);assert 'сенбі және жексенбі'in s;p['sourceOfficialAnswerAssumesExactFiveSeventhsCalendarFractionNotActualGregorianCalendar']=True
  else:year,work=n;assert year>0 and year%7==0 and '364 күннен' in s;p['explicitWholeWeekYearLength']=str(year);p['bothTotalAndCountedDaysReplayed']=True
  out=work*F(7,5);assert out.denominator==1
 elif i==38:a,b,c=n;assert min(n)>0;out=c/(a+b);p['denominatorIncludesOnlyTwoAppleCategories']=True
 elif i==39:
  gift,second=n[:2];factor=F(3)if src else n[-1]
  if src:assert'үш есе'in s
  prev=second/(factor-1);initial=prev-gift;out=prev+second;assert min(initial,prev)>0 and prev.denominator==out.denominator==1 and out==prev*factor;p['initialFirstDayFinalStocks']=list(map(str,[initial,prev,out]))
 elif i==40:
  if src:assert'жартысы'in s and'үштен бірі'in s;a,b=F(1,2),F(1,3)
  else:a,b=N.fractions(s,False)
  total=n[-1];c=1-a-b;assert min(a,b,c)>0;average=a+2*b+3*c;out=total/average;groups=[out*v for v in[a,b,c]];assert out.denominator==1 and all(v.denominator==1 for v in groups)and sum(v*(j+1)for j,v in enumerate(groups))==total;p['actualThreeWholeGroupCounts']=list(map(str,groups));p['allThreeGroupsAndGiftTotalReplayed']=True
 elif i==44:
  count,first,last,length,start,end=n;assert first==1 and last==count and 1<=start<end<=count;out=length/(count-1)*(end-start);p['actualNumberOfEqualGapsNotPoints']=str(count-1);p['askedIndexDifferenceGapCount']=str(end-start)
 elif i==46:
  cars,adults,kids=n[:3]
  if src:
   assert 'бір көлікке' in s and'екі велосипедке'in s and'қосымша дөңгелектерін тұрақта қалдырып'in s;gonecars,goneadults=F(1),F(2)
  else:
   definitions=s.split('Әр автокөлікте')[1].split('Кейін')[0];assert H.numeric_tokens(definitions)==[4,2,2,2];gonecars,goneadults=H.numeric_tokens(s.split('Кейін')[1]);assert'Бір бала қосымша дөңгелектерін тұрақта қалдырып'in s
  assert 0<gonecars<=cars and 0<goneadults<=adults and kids>=1;initial=4*cars+2*adults+4*kids;out=initial-4*gonecars-2*goneadults-2;forward=4*(cars-gonecars)+2*(adults-goneadults)+4*(kids-1)+2;assert out==forward;p['bothWheelInventoryMethodsAgree']=True;p['detachedTrainingWheelsRemainAtParking']=2
 elif i==47:
  young,older,mother=n;shift=mother-young-older;out=young+shift;assert shift>0 and 0<young<older and young+shift+older+shift==mother+shift;p['commonUnderstatementYears']=str(shift);p['allThreeTrueAges']=list(map(str,[out,older+shift,mother+shift]))
 else:raise AssertionError(i)
 p['exactTarget']=str(out);return out,p

def solve(r,i,src=False,check=True):
 out,p=target(r,i,src)
 if not check:return out,p
 opts=B.options(r);assert len(opts)==len(set(opts))==5 and r['answer']in opts
 if i in[4,9,12,24,34]:assert r['answer']==out;p['allFiveActualOptionsCompared']=opts
 elif i in[7,38]:
  values=[E.calc(H.tex(v))for v in opts];assert len(set(values))==5 and values.count(out)==1 and E.calc(H.tex(r['answer']))==out;p['allFiveExactRatioValues']=list(map(str,values))
 else:p.update(B.checked_choices(r,out))
 return out,p

CHANGES={3:[('(9/14)','(11/14)')],4:[('13:20','14:20')],5:[('21 минут','24 минут')],7:[('= 3 : 4 : 5','= 4 : 4 : 5')],8:[('ортасы 18.','ортасы 21.')],10:[('90 бет','120 бет')],13:[('7; 14; 23; 34; 47; 62','8; 15; 24; 35; 48; 63')],14:[('12 ер','15 ер')],15:[('2500 теңге','3000 теңге')],16:[('86 × 74','87 × 73')],17:[('42 жапсырма','63 жапсырма')],18:[('11.6 − x','12.6 − x')],19:[('overline(c3a)','overline(c5a)')],20:[('0.234','1.234')],22:[('6.4 ×','7.4 ×')],23:[('3 есе','4 есе')],24:[('1517 сағат','1541 сағат')],25:[('7 + (−8)','8 + (−8)')],26:[('4 есе көп','5 есе көп')],27:[('90-ға көп','180-ге көп')],28:[('6-қабатқа','7-қабатқа')],34:[('Хабар «*##**###*»','Хабар «*##**###**##**###*»')],36:[('30 жыл','35 жыл')],38:[('7 : 5 : 3','7 : 5 : 4')],39:[('24 белгіше','30 белгіше')],40:[('54 дәптер','72 дәптер')],44:[('24.75 м','27.5 м')],46:[('5 автокөлік','6 автокөлік')],47:[('анасының жасын 50','анасының жасын 52')]}
def changed(r,i):
 d=copy.deepcopy(r)
 if i==1:d['statement']=d['statement'].replace('2; 4; 6; 8; 10; 12','3; 6; 9; 12; 15; 18').replace('тек 8 саны','тек 12 саны')
 elif i==9:
  d['options'][0]=d['options'][0].replace(' > ',' < ');d['options'][1]=d['options'][1].replace(' < ',' > ')
 elif i==12:d['options'][3]='1 + 2 + 5 × 6'
 elif i==35:
  d['statement']=d['statement'].replace('3 см','4 см');out,p=solve(d,i);assert out==3;return d,False
 else:
  for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i);assert new!=old,(i,new)
 if i in[4,9,12,24,34]:
  if i in[4,34] and new not in d['options']:d['options'][d['options'].index(r['answer'])]=new
  d['answer']=new
 elif i in[7,38]:
  values=[E.calc(H.tex(v))for v in d['options']]
  if new in values:d['answer']=d['options'][values.index(new)]
  else:d['options'][d['options'].index(r['answer'])]=str(new.numerator)+' : '+str(new.denominator);d['answer']=str(new.numerator)+' : '+str(new.denominator)
 else:
  d['options']=[str(B.scalar(v)+new-old)for v in d['options']];d['answer']=str(new)
 return d,True

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==33;entries=[];evidence=[];canaries=0;equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert not q['images']and not q['svg']and q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);d,changesAnswer=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  bads=[{**r,'answer':'WRONG_KEY'}]
  if changesAnswer:bads.append({**d,'answer':r['answer']})
  else:
   invalid=copy.deepcopy(r);invalid['statement']=invalid['statement'].replace('3 см','0 см');bads.append(invalid)
  for bad in bads:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('badkeyorinputaccepted',i))
  new,_=solve(d,i);proof['validChangedActualInputTarget']=str(new);proof['validChangedActualInputAccepted']=True;proof['changedInputChangesAnswer']=changesAnswer;canaries+=changesAnswer
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and ((before[-1].isascii()and before[-1].isalpha())or before[-1]==':'):continue
   if r['solution'][match.end():].lstrip().startswith(':'):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newconditions official/newsolutions andall5source/newchoices read. Actualprintedconditions independently parsed using exact rational arithmetic, all15card subsets/pairs, all720distinctdigitassignments, all90two-digitnumbers, allcompletevariable-code decodings, exactaffinedifferences, fullclockweekdaycarry, wholepopulation/groupstocks andforwardconstraints, all26nonzero cuboidnormal signclasses. 32changedactualinputs changeanswer andoldkeyfails; cuboiddimensionchange preserves3 andzerodimensionfails. Calendaroriginalimplicitlyfive-sevenths, new364-day model explicit. Sameauthor computationalcheck, notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':33,'sourceOptionsRead':165,'rewrittenOptionsRead':165,'wrongKeysRejected':33,'changedActualInputsWithDifferentTarget':canaries,'validActualCuboidDimensionChangePreservesThreeVisibleFaces':True,'invalidZeroCuboidDimensionRejected':True,'printedSolutionEqualitiesVerified':equalities,'remainingBIL5Tables':2,'remainingBIL5BitmapTasks':15,'pythonJavaScriptHashesMatched':33,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
