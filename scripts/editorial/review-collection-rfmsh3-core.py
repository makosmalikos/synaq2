"""25full frozen text-only RFMSh3 conditions and official/new solutions read.
Same root author, separate printed-input exact computation, not separate human
review. All finite digit/set/box/truth assignment states and target units checked.
The four visual/KaTeX-heavy occurrences remain pending outside this batch.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-rfmsh3-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def primes(count):
 out=[];n=2
 while len(out)<count:
  if all(n%d for d in range(2,math.isqrt(n)+1)):out.append(n)
  n+=1
 return out
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);proof={}
 if i==1:
  if src:w,multiple,divisor=n
  else:w,multiple=n;assert'жартысына'in s;divisor=F(2)
  length=w*multiple;height=length/divisor;out=w*length*height;proof={'widthLengthHeight':list(map(str,[w,length,height]))}
 elif i==2:
  workers,days,target=n;out=workers*days/target;assert out.denominator==1 and out*target==workers*days;proof={'fixedWorkerDays':str(workers*days)}
 elif i==3:
  now,years,later,repeatedYears=n;assert years==repeatedYears and now>later>1;child=years*(later-1)/(now-later);elder=now*child;out=elder+years;assert out==later*(child+years)and child>0;proof={'currentChildAge':str(child),'currentElderAge':str(elder),'futureChildAge':str(child+years),'futureElderAgeTarget':str(out)}
 elif i==4:
  total,a,b,c,d=n;assert b==c;weights=[a,b,d];unit=total/sum(weights);out=b*unit;values=[v*unit for v in weights];assert sum(values)==total and values[0]/values[1]==a/b and values[1]/values[2]==c/d;proof={'allThreeValues':list(map(str,values)),'targetMiddleQuantity':True}
 elif i==5:
  count,avg,newCount,newAvg=n[:4];assert newCount==count+1 and avg==newAvg;out=newCount*newAvg-count*avg;proof={'oldSum':str(count*avg),'newSum':str(newCount*newAvg),'newNumber':str(out)}
 elif i==6:out=E.calc(one(p));proof={'exactMixedDecimalFractionValue':str(out)}
 elif i==7:
  circumference,pi=n;radius=circumference/(2*pi);out=pi*radius**2;assert 2*pi*radius==circumference;proof={'piGiven':str(pi),'radius':str(radius),'area':str(out)}
 elif i==8:
  perFirst,extra,perSecond,short=n;assert perSecond>perFirst;out=(extra+short)/(perSecond-perFirst);stock=perFirst*out+extra;assert stock==perSecond*out-short and out.denominator==1;proof={'sameStock':str(stock),'children':str(out)}
 elif i==9:
  assert len(n)==2;a,b=n
  if src:assert s.startswith('Бес санның')and'басқа үш санның'in s and'сегіз санның'in s;counts=[5,3]
  else:assert s.startswith('Төрт санның')and'басқа алты санның'in s and'он санның'in s;counts=[4,6]
  total=a*counts[0]+b*counts[1];out=total/sum(counts);proof={'groupCounts':counts,'groupSums':list(map(str,[a*counts[0],b*counts[1]])),'weightedWholeMean':str(out)}
 elif i in(10,14):
  if i==10:a,b,both,neither=n;whole=a+b-both+neither;out=whole
  else:whole,a,b,neither=n;both=a+b-(whole-neither);out=both
  disjoint=[a-both,b-both,both,neither];assert min(disjoint)>=0 and sum(disjoint)==whole;proof={'fourDisjointRegionCounts':list(map(str,disjoint)),'whole':str(whole),'target':'whole'if i==10 else'intersection'}
 elif i==11:
  yellow,blue,draw=n;assert 0<draw<=yellow+blue;states=[b for b in range(int(blue)+1)if 0<=draw-b<=yellow];out=F(min(states));assert out==max(0,draw-yellow);proof={'allFeasibleBlueCounts':states,'minimumAttainedWithYellow':str(draw-out)}
 elif i==13:
  total,quotient,remainder=n;small=(total-remainder)/(quotient+1);out=total-small;assert small.denominator==1 and 0<=remainder<small and out==quotient*small+remainder;proof={'smallNumber':str(small),'largeNumberTarget':str(out),'remainderLessThanDivisor':True}
 elif i==15:
  prefix=one(re.findall(r'\d{6}',s));assert re.search(r'45-ке',s);valid=[]
  for a,b in itertools.product(range(10),repeat=2):
   num=int(prefix+str(a)+str(b))
   if num%45==0:valid.append([a,b,num])
  assert valid;out=F(max(a+b for a,b,_ in valid));proof={'all100SuffixesChecked':100,'allDivisible45Assignments':valid,'maximumHiddenDigitSum':str(out)}
 elif i==16:
  formula,target=p;rhs=E.plain(formula).split('=')[1];poly=E.expr(rhs);assert set(poly.d)=={()}and set(poly.n)=={('a','b'),('b',)};k=poly.n[('a','b')]/poly.d[()];ell=-poly.n[('b',)]/poly.d[()];outer,inner,total=map(F,one(re.findall(r'(\d+)\s*(?:\\circ|◦)\s*\(\s*(\d+)\s*(?:\\circ|◦)\s*x\s*\)\s*=\s*(\d+)',target)));factor=(k*outer-ell)*(k*inner-ell);assert factor;out=total/factor;inside=E.calc(rhs,{'a':inner,'b':out});assert E.calc(rhs,{'a':outer,'b':inside})==total;proof={'operationPolynomial':{'ab':str(k),'b':str(-ell)},'nonzeroComposedLinearCoefficient':str(factor),'innerResult':str(inside),'outerResult':str(total)}
 elif i==17:
  fracs=p if src else re.findall(r'\(\d+/\d+\)',s);assert len(fracs)==3;first,second,remaining=map(E.calc,fracs);bare=s
  for f in fracs:bare=bare.replace(f,'')
  sold=one(H.numeric_tokens(bare));afterFractions=(1-first)*(1-second);assert 0<remaining<afterFractions<1;out=sold/(afterFractions-remaining);afterFirst=out*(1-first);afterSecond=afterFirst*(1-second);final=afterSecond-sold;assert final==remaining*out;assert all(x.denominator==1 for x in[out,afterFirst,afterSecond,final]);proof={'stockAfterFirstSale':str(afterFirst),'stockAfterSecondSale':str(afterSecond),'finalStock':str(final),'allInventoryCountsWhole':True}
 elif i==18:
  lo,hi=map(int,n[:2]);assert lo==1;states={v:[d for d in range(1,v+1)if v%d==0]for v in range(lo,hi+1)};odd=[v for v,ds in states.items()if len(ds)%2];squares=[v*v for v in range(1,math.isqrt(hi)+1)];assert odd==squares;out=F(len(odd));proof={'allDivisorCounts':{str(v):len(ds)for v,ds in states.items()},'exactOddDivisorNumbers':odd}
 elif i==19:
  population,*yes=n;assert len(yes)==4 and all(0<=y<=population for y in yes);liars=(sum(yes)-population)/2;truth=population-liars;assert liars.denominator==truth.denominator==1 and min(liars,truth)>=0
  # Existence under each of the four printed response totals, not just their sum.
  liarPreferences=[max(F(0),liars-y)for y in yes];slack=liars-sum(liarPreferences);assert slack>=0;liarPreferences[0]+=slack;truthPreferences=[y-liars+l for y,l in zip(yes,liarPreferences)];assert min(truthPreferences)>=0 and sum(truthPreferences)==truth and sum(liarPreferences)==liars;assert all(t+liars-l==y for t,l,y in zip(truthPreferences,liarPreferences,yes));out=liars;proof={'fourYesTotals':list(map(str,yes)),'liarFavoriteCountsWitness':list(map(str,liarPreferences)),'truthFavoriteCountsWitness':list(map(str,truthPreferences)),'allFourQuestionsIndividuallyRealizable':True}
 elif i==20:
  chunks=re.findall(r'\b\d{3}\b',s);assert len(chunks)==7;known={j:int(v)for j,v in zip([0,1,2,3,4,5,7],chunks)};valid=[]
  for start in range(10,89):
   stream=''.join(str(v)for v in range(start,start+12));groups=[int(stream[j:j+3])for j in range(0,24,3)]
   if all(groups[j]==v for j,v in known.items()):valid.append((start,groups))
  start,groups=one(valid);out=F(groups[6]);proof={'allPossibleTwoDigitStartsChecked':79,'uniqueStart':start,'allEightChunks':groups,'patternFamilyExplicitInRewrite':not src}
 elif i==23:
  total,v,c=n;assert v>c>0;out=total/(1/(v+c)+1/(v-c));assert out/(v+c)+out/(v-c)==total;proof={'downstreamHours':str(out/(v+c)),'upstreamHours':str(out/(v-c)),'totalHours':str(total)}
 elif i==24:
  a,b,total=map(int,n);states=[(x,y)for x in range(1,total//a+1)for y in range(1,total//b+1)if a*x+b*y==total];x,y=one(states);out=F(x+y);proof={'allPositiveBoxSolutions':[list(p)for p in states],'separateTypeCounts':[x,y],'totalBoxesTarget':str(out)}
 elif i==25:
  if src:less,more,total=n
  else:total,less,more=n
  cloudy=(total-more+less)/3;rain=cloudy-less;out=cloudy+more;assert min(cloudy,rain,out)>=0 and all(x.denominator==1 for x in[cloudy,rain,out]);assert cloudy+rain+out==total;proof={'cloudy':str(cloudy),'precipitation':str(rain),'sunnyTarget':str(out),'disjointCategoryAssumptionExplicitInRewrite':not src}
 elif i==26:
  word='бес'if src else'алты'if'алты'in s else'жеті';count={'бес':5,'алты':6,'жеті':7}[word];assert s.count(word)==3;A=set(primes(count));B=set(range(0,2*count,2));C=set(range(1,2*count,2));target=(B|C)&A;out=F(sum(target));proof={'primes':sorted(A),'nonnegativeEvens':sorted(B),'positiveOdds':sorted(C),'unionThenIntersection':sorted(target)}
 elif i==27:
  vals=[int(v)for v in re.findall(r'(?<!\d)\d(?!\d)',s)];assert len(vals)==len(set(vals))==5;pattern=p[-1]if src else one(p);ops=re.findall('[<>]',pattern);assert len(ops)==4;valid=[v for v in itertools.permutations(vals)if all(v[j]>v[j+1]if op=='>'else v[j]<v[j+1]for j,op in enumerate(ops))];out=F(len(valid));proof={'all120PermutationsChecked':120,'allValidArrangements':valid,'printedComparisonSigns':ops}
 elif i==28:
  price,sales,revenue=n;salesFactor=1+sales/100;revenueFactor=1+revenue/100;newPrice=price*revenueFactor/salesFactor;out=price-newPrice;assert 0<newPrice<price and newPrice*salesFactor==price*revenueFactor;proof={'salesFactor':str(salesFactor),'revenueFactor':str(revenueFactor),'newUnitPrice':str(newPrice),'priceCutTarget':str(out)}
 else:raise AssertionError(i)
 assert out.denominator==1 and out>0 and E.calc(r['answer'])==out,(i,src,out,r['answer']);proof['answer']=str(out);return proof
def mutation(r,i):
 pairs={1:('6 см','8 см'),2:('32 күнде','40 күнде'),3:('6 жылдан','8 жылдан'),4:('126','140'),5:('8','9'),6:('(2 + (2/3))','(3 + (2/3))'),7:('251,2','314'),8:('11 жапсырма','13 жапсырма'),9:('27','32'),10:('24 оқушы','25 оқушы'),11:('23 фишка','24 фишка'),13:('286','311'),14:('160 оқушы','170 оқушы'),15:('583461','583462'),16:('126','140'),17:('54 дәптер','55 дәптер'),18:('26-ға','36-ға'),19:('30, 35','32, 35'),20:('313;','323;'),23:('3 км/сағ','7 км/сағ'),24:('194','206'),25:('18-ге','21-ге'),26:('алты','жеті'),27:('□ > □ > □ < □ < □','□ > □ > □ > □ > □'),28:('50%-ға','80%-ға')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is None and not q['options']and not q['images']and not q['svg'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('options')and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip();after=r['solution'][match.end():].lstrip()
   if(before and before[-1].isascii()and before[-1].isalpha())or before.endswith(':')or after.startswith(':'):continue
   sides=[s.strip().rstrip('.')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'25full saved/new conditions and official/new explanations read, exact printed-input fractions, ledger conservation, all100suffixes, all79two-digit starts, complete positive box solutions, all120digit permutations, every divisor/set and four-question truth feasibility checked. Same author, not separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){mixed++;walk([n.fraction])}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,mixed}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':25,'fullSourceNewConditionsAndSolutionsRead':25,'sourceKeysNotCaptured':25,'MCQSets':0,'wrongKeysRejected':25,'printedSemanticCanariesRejected':25,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':native['fractions'],'nativeMixedNumbers':native['mixed'],'allSuffixAssignmentsPerCondition':100,'allTwoDigitSequenceStartsCheckedPerCondition':79,'allValleyPermutationsPerCondition':120,'allFourTruthQuestionTotalsRealizable':True,'pythonJavaScriptHashesMatched':25,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
