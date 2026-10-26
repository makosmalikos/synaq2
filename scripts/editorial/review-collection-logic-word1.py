"""22source/new full conditions/full official/new solutions/all4MCQ options read.
Same root author separate exact printed-input computation, not separate human.
Source13has duplicate wrong mass options1t/10centners; rewritten options distinct.
Source11already explicitly dispositioned duplicate is excluded, never republished.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-logic-word1';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def options(r):return[o['text']if isinstance(o,dict)else o for o in r['options']]
def scalar(s):
 p=E.plain(s);m=re.fullmatch(r'\s*(-?\d+(?:\.\d+)?)\s*(?:м)?\s*',p)
 return F(m[1])if m else E.calc(p)
def time(s):
 p=E.plain(s);value,unit=one(re.findall(r'^\s*(-?\d+(?:\.\d+)?)\s*(күнде|сағат|мин(?:ут)?)\s*$',p));return F(value)*{'күнде':1440,'сағат':60,'мин':1,'минут':1}[unit]
def mass(s):
 value,unit=one(re.findall(r'^\s*(\d+(?:\.\d+)?)\s*(т|кг|ц)\s*$',E.plain(s)));return F(value)*{'т':1000,'кг':1,'ц':100}[unit]
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);parse=scalar;proof={}
 if i==1:
  whole,a,b,neither=n;out=a+b-(whole-neither);regions=[a-out,b-out,out,neither];assert min(regions)>=0 and sum(regions)==whole;proof={'fourDisjointRegions':list(map(str,regions))}
 elif i==2:
  expression=one(p);whole=E.calc(expression);assert whole.denominator==1;out=F(int(whole)%10);terms=E.plain(expression).split('+');residues=[int(E.calc(t))%10 for t in terms];assert sum(residues)%10==out;proof={'wholeExactProductSum':str(whole),'termFinalDigits':residues}
 elif i==3:
  values=n;assert values[:3]==[1,2,3]and len(values)==4;high=int(values[-1]);out=F(sum(range(1,high+1)));assert out==F(high*(high+1),2);proof={'allTermsSummed':high,'pairFormulaAlsoChecked':True}
 elif i==4:
  a,b,c,edge=n;dims=[v/edge for v in[a,b,c]];assert all(x.denominator==1 and x>=1 for x in dims);dims=list(map(int,dims));hist={}
  for cell in itertools.product(*(range(d)for d in dims)):
   faces=sum(int(v==0)+int(v==d-1)for v,d in zip(cell,dims));hist[faces]=hist.get(faces,0)+1
  out=F(hist.get(3,0));proof={'subdivisionCounts':dims,'allSmallCubesEnumerated':math.prod(dims),'histogramByPaintedFaces':hist}
 elif i==5:
  assert len(n)==3;unit=1440 if src else 60;times=[v*unit for v in n];out=1/sum(1/v for v in times);assert sum(out/v for v in times)==1;parse=time;proof={'soloTimesMinutes':list(map(str,times)),'jointTimeMinutes':str(out)}
 elif i==6:
  train,speed,tunnel=n;out=(train+tunnel)/speed*60;parse=time;proof={'fullDistanceKm':str(train+tunnel),'speedKilometersPerHour':str(speed),'timeMinutes':str(out)}
 elif i==7:
  if src:assert'жартысындай'in s;count,last=n;ratio=F(1,2)
  else:frac=one(re.findall(r'\(\d+/\d+\)',s));ratio=E.calc(frac);count=F(4)if'Төртінші'in s else F(3);assert'Төртінші'in s or'Үшінші'in s;last=one(H.numeric_tokens(s.replace(frac,'')))
  count=int(count);assert 0<ratio<1;out=last/ratio**count;path=[out*ratio**j for j in range(count+1)];assert path[-1]==last;proof={'allBounceHeights':list(map(str,path)),'numberOfBounces':count}
 elif i==8:
  if src:assert s=='Бір мысық бір тышқанды бір минутта жейді. Жүз мысық жүз тышқанды неше минутта жейді?';singleTime=F(1);workers=items=100
  else:singleTime,workers,items=n
  assert workers==items>0;out=singleTime;parse=time;proof={'simultaneousWorkers':str(workers),'independentOneItemPerWorker':True,'timeMinutes':str(out)}
 elif i==9:
  low,high,digit=n[:3];assert all(x==digit for x in n[3:]);values=[x for x in range(int(low),int(high)+1)if str(int(digit))in str(x)];out=F(len(values));proof={'allNumbersContainingDigit':values,'countedOnceEvenIfDigitRepeats':True}
 elif i in(10,15,19,23):
  divisor,excluded=map(int,n);allMultiples=[x for x in range(10,100)if x%divisor==0];removed=[x for x in allMultiples if x%excluded==0];valid=[x for x in allMultiples if x%excluded];out=F(len(valid));assert len(valid)+len(removed)==len(allMultiples);proof={'allTwoDigitMultiples':allMultiples,'removedIntersection':removed,'allRemainingNumbers':valid,'exclusionUsesLCM':math.lcm(divisor,excluded)}
 elif i in(12,21):
  numbers=list(map(int,n));assert len(numbers)==3;out=F(math.lcm(*numbers)if i==12 else math.gcd(*numbers));proof={'inputs':numbers,'operation':'LCM'if i==12 else'GCD'}
  if i==12:assert all(out%x==0 for x in numbers)and not any(all(z%x==0 for x in numbers)for z in range(1,int(out)))
  else:assert all(x%out==0 for x in numbers)and math.gcd(*(int(x/out)for x in numbers))==1
 elif i==13:
  count,weight=n
  if src:assert'екі үкі'in s;workers=2
  else:assert'Үш роботтың'in s;workers=3
  out=count*weight*workers;parse=mass;proof={'separateGroups':workers,'itemsPerGroup':str(count),'kilogramsPerItem':str(weight),'totalKilograms':str(out),'newGivenModelRatherThanBiologicalClaim':not src}
 elif i in(14,22):
  value=int(one(n));divisors=[d for d in range(1,value+1)if value%d==0];out=F(sum(divisors));proof={'allPositiveDivisors':divisors}
 elif i==16:
  lower,upper=n;values=list(range(math.floor(lower)+1,math.ceil(upper)));assert all(lower<x<upper for x in values);out=F(sum(values));proof={'allIntegersStrictlyBetween':values,'negativeAndZeroIncluded':any(v<0 for v in values)and 0 in values}
 elif i==17:
  first,baseAff,delta1,thirdAff,delta2,base,fourthAff,delta3=one(re.findall(r'(\w+) (\w+) (\d+) см, ал (\w+) (\d+) см ұзын\.\s+(\w+) (\w+) (\d+) см (?:кіші|аласа)',s));names=options(r)
  def stem(aff):return one(v for v in names if aff.startswith(v)and aff[len(v):]in('дан','ден','тан','тен','нан','нен'))
  assert stem(baseAff)==base;heights={base:0,first:int(delta1),stem(thirdAff):int(delta1)-int(delta2),stem(fourthAff):int(delta3)};assert set(heights)==set(names);best=max(heights.values());out=one(k for k,v in heights.items()if v==best);parse=lambda t:t.strip();proof={'heightOffsets':heights,'uniqueTallest':out}
 elif i==18:
  each,high,low=map(int,n);assert low<high;valid=[(middle,(low+high+middle)//each)for middle in range(low+1,high)if(low+high+middle)%each==0];middle,groups=one(valid);out=F(groups);proof={'strictMiddleCandidates':list(range(low+1,high)),'allFeasibleMiddleAndGroupCounts':valid,'itemsPerCompletedGroup':each}
 elif i==20:
  if src:length,piece=n;assert'бір жарым минут'in s;cut=F(3,2)
  else:length,piece,cut=n
  count=length/piece;assert count.denominator==1 and count>1;out=(count-1)*cut;parse=time;proof={'pieceCount':str(count),'cutsOneLessThanPieces':str(count-1),'minutesPerCut':str(cut),'totalMinutes':str(out)}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,out,r['answer']);values=[parse(o)for o in options(r)];assert len(values)==4 and values.count(out)==1
 if not(src and i==13):assert len(set(values))==4,(i,src,values)
 proof['answer']=str(out);proof['allOptionValues']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
 if i==3:assert values==[F(high*high,2),out,F(high*(high+2),2),F(high//2*(high//2+1))]
 if i in(5,6):assert values==([out,2*out,F(3,2)*out,out/2]if i==5 else[out/2,out,F(3,4)*out,out/4])
 if i==7:assert values==[out,last*count/ratio,last/ratio**(count-1),last/ratio]
 if i in(10,23):assert values[-1]==len(allMultiples)
 if i==21:assert values==[30*out,6*out,3*out,out]
 if i==20:assert values==[count*cut,(count+1)*cut,out,(count-2)*cut]
 return proof
def mutation(r,i):
 pairs={1:('32 оқушы','33 оқушы'),2:('2026','2025'),3:('240','242'),4:('6 см','3 см'),5:('6 сағатта','12 сағатта'),6:('80 км/сағ','60 км/сағ'),7:('2 м биіктікке','3 м биіктікке'),8:('2 минутта','3 минутта'),9:('99-ға','89-ға'),10:('11-ге','13-ке'),12:('48, 60','72, 60'),13:('1,5 кг','2 кг'),14:('18 санының','20 санының'),15:('6-ға','7-ге'),16:('−12,4','−13,4'),17:('12 см','9 см'),18:('5 бекітпе','4 бекітпе'),19:('8-ге','9-ға'),20:('2,5 минут','3 минут'),21:('84, 126, 210','96, 144, 240'),22:('30 санының','36 санының'),23:('14-ке','16-ға')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==22;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);assert i!=11;q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is not None and not q['images']and not q['svg']
  try:src=solve({**q,'answer':q['sourceAnswer']},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and len(r['options'])==len(q['options'])==4 and not r.get('image')and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip().rstrip('.')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'22full source/new conditions and complete official/new solutions with all88source+88new alternatives read. Exact printed-input finite digit/divisor/cube/height/congruence/interval enumeration, rate conservation, time/mass unit normalization checked. Source13duplicate wrong options corrected. Same author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':22,'fullSourceNewConditionsAndSolutionsRead':22,'sourceAndNewMCQSets':22,'allSourceAndNewOptionsChecked':176,'sourceDuplicateWrongUnitOptionsFixed':1,'wrongKeysRejected':22,'printedSemanticCanariesRejected':22,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':native['fractions'],'pythonJavaScriptHashesMatched':22,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
