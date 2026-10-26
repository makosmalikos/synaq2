"""All8full remaining frozen/newconditions, complete official/newsolutions and
onefullMCQset read. Same root author separate exact computational review, no
secondhumanreviewer. Source7isfrozenexplicitduplicate ofprocessedgrade5speech.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo3-tour3-grade4-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('tour5',ROOT/'scripts/editorial/review-femo3-tour3-grade5.py');T=importlib.util.module_from_spec(sp);sp.loader.exec_module(T);P=T.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def time_value(s):h,m=map(int,s.replace('{:}',':').split(':'));assert 0<=h<24 and 0<=m<60;return 60*h+m
def time_text(v):return f'{v//60:02}:{v%60:02}'
def carpets(width,height,big,small):
 assert all(v.denominator==1 for v in[width,height,big,small]);width,height,big,small=map(int,[width,height,big,small]);assert min(width,height)>=max(big,small)>0;matrices=[];histograms=[]
 for corner in range(4):
  sizes=[big]*4;sizes[corner]=small;rects=[(0 if i%2==0 else width-side,0 if i//2==0 else height-side,side)for i,side in enumerate(sizes)];matrix=[[sum(x0<=F(2*x+1,2)<x0+side and y0<=F(2*y+1,2)<y0+side for x0,y0,side in rects)for x in range(width)]for y in range(height)];hist=collections.Counter(sum(matrix,[]));assert sum(hist.values())==width*height and sum(v*count for v,count in hist.items())==3*big*big+small*small;matrices.append(matrix);histograms.append(dict(hist))
 counts=[h.get(2,0)for h in histograms];assert len(set(counts))==1;return F(one(set(counts))),{'allFourSmallCarpetCornerPlacementsChecked':4,'unitSquareCoverageTopLeftSmall':matrices[0],'allCornerCoverageHistograms':histograms,'allCarpetAreaEqualsWeightedLayerArea':True,'roomDimensions':[width,height],'carpetSidesBigSmall':[big,small],'exactTwoLayerAreaTarget':counts[0]}

def factor_pairs(value):return[(a,value//a)for a in range(1,math.isqrt(value)+1)if value%a==0 and a<value//a]
def extreme_products(low,high):
 assert 0<low<high;small=factor_pairs(low);large=factor_pairs(high);sets=set();pairsChecked=[]
 for a,b in small:
  for c,d in large:
   pairsChecked.append([a,b,c,d])
   if b>c:continue
   base={a,b,c,d}
   if b==c:sets.add(tuple(sorted(base)))
   else:
    optional=list(range(b+1,c));assert len(optional)<15
    for size in range(len(optional)+1):
     for part in itertools.combinations(optional,size):sets.add(tuple(sorted(base|set(part))))
 assert sets
 for values in sets:assert len(values)>=3 and values[0]*values[1]==low and values[-2]*values[-1]==high
 sums={sum(v)for v in sets};out=F(one(sums));return out,{'allDistinctPositiveSmallFactorPairs':small,'allDistinctPositiveLargeFactorPairs':large,'allExtremePairCombinationsIncludingOverlapChecked':pairsChecked,'allFullPossibleChosenSets':[list(v)for v in sorted(sets)],'allOptionalInteriorSubsetsCovered':True,'overlappingThreeNumberCaseChecked':True,'twoNumberCaseImpossibleBecauseProductsDiffer':True,'uniqueAllNumbersSumTarget':str(out)}

def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  if src:ahead,lag,hour=n;believed=int(hour*60)
  else:clock=one(re.findall(r'\d{2}:\d{2}',s));believed=time_value(clock);ahead,lag=H.numeric_tokens(s.replace(clock,''))
  assert ahead.denominator==lag.denominator==1 and min(ahead,lag)>0;ahead,lag=map(int,[ahead,lag]);display=(believed-lag)%1440;real=(display-ahead)%1440;assert time_value(r['answer'])==real;out=time_text(real);expected=[real,(believed+ahead-lag)%1440,(believed+ahead+lag)%1440,display];options=[time_value(v)for v in r['options']];assert options==expected and len(set(options))==4;proof={'realFastMinutes':ahead,'assumedSlowMinutes':lag,'believedTime':time_text(believed),'actualDisplay':time_text(display),'allOptionRolesTrueSignErrorBothAddDisplay':[time_text(v)for v in options],'realTimeTarget':out}
 elif i==2:
  assert len(n)==8;digits=list(map(str,map(int,n[:4])));attempts=list(map(str,map(int,n[4:])));assert len(set(digits))==4 and all(len(a)==4 and sorted(a)==sorted(digits)for a in attempts);valid=[];domains=[]
  for perm in itertools.permutations(digits):
   code=''.join(perm);counts=[sum(a[j]==code[j]for a in attempts)for j in range(4)];domains.append([code,counts])
   if counts==[2]*4 and code not in attempts:valid.append(code)
  out=F(int(one(valid)));proof={'all24CodePermutationsChecked':len(domains),'allAttemptPositionsCompared':24*4*4,'everyCandidateOwnPositionHitCounts':domains,'uniqueCodeTarget':str(out),'allAttemptsRejectedAsStated':str(out)not in attempts}
 elif i==3:
  names={'біртаңбалы':1,'екітаңбалы':2,'үштаңбалы':3};patterns=re.findall(r'цифрларының қосындысы (\w+) болатын (\w+) сандардың ең (\w+)',s);assert len(patterns)==2;sets=[]
  for sumWord,inputWord,which in patterns:
   digits=names[inputWord];sumDigits=names[sumWord];values=[v for v in range(10**(digits-1),10**digits)if len(str(sum(map(int,str(v)))))==sumDigits];assert values;sets.append(min(values)if which.startswith('кіш')else max(values))
  out=F(sum(sets));proof={'bothFiniteInputAndDigitSumLengthDomainsRead':patterns,'allInputsCheckedPerDomain':[9*10**(names[p[1]]-1)for p in patterns],'smallestFirstAndLargestSecond':sets,'sumTarget':str(out)}
 elif i==4:
  width,height,big,small=n;out,proof=carpets(width,height,big,small)
  if not src:
   table=[[int(v.strip())for v in line[1:-1].split('|')]for line in r['solution'].splitlines()if line.startswith('|')and'---'not in line];assert table==proof['unitSquareCoverageTopLeftSmall'];proof['actualPrintedSolutionTableAllCellsChecked']=True
 elif i==5:
  a,b=n;assert a>0 and b>0;minutes=1/(1/a+1/b);out=60*minutes;assert minutes/a+minutes/b==1;proof={'soloMinutes':list(map(str,n)),'jointMinutes':str(minutes),'secondsPerMinute':60,'bothWorkFractionsSumOne':True,'jointSecondsTarget':str(out)}
 elif i==6:
  date=one(re.findall(r'\d{2}\.\d{2}\.\d{4}',s));start=T.valid_date(date);following,count=T.next_distinct_date(start);out=F(following.day);proof={'startDate':start.isoformat(),'allFollowingActualGregorianDatesChecked':count,'earliestEightDistinctDigitDate':following.isoformat(),'exactEightDigits':T.date_digits(following),'targetDay':str(out),'leadingZerosPreservedInDates':True}
 elif i==8:
  low,high=map(int,n);out,proof=extreme_products(low,high)
 elif i==9:
  if src:assert'Тоғыз дос'in s and'Бесеуі'in s and'екеуі'in s and'қалған екеуіне бір-бір'in s;fixed,full=n;friends,half,countFixed,nearly,left=F(9),F(5),F(2),F(2),F(1)
  else:friends,half,countFixed,fixed,nearly,full=n;left=F(1);assert'бір-бір деңгей қалды'in s
  assert friends==half+countFixed+nearly and min(half,countFixed,nearly)>0;coef=full-half/2-nearly;assert coef!=0;out=(countFixed*fixed-nearly*left)/coef;assert out.denominator==1 and out>max(left,fixed)and(out/2).denominator==1;contributions=[half*out/2,countFixed*fixed,nearly*(out-left)];assert sum(contributions)==full*out;proof={'allFriendGroupsConserved':True,'friends':str(friends),'groupSizesHalfFixedNearly':list(map(str,[half,countFixed,nearly])),'groupLevelTotals':list(map(str,contributions)),'fullRunCount':str(full),'totalLevelsPlayed':str(sum(contributions)),'gameLevelCountTarget':str(out)}
 else:raise AssertionError(i)
 if i!=1:assert exact(r['answer'])==out,(i,src,proof,r['answer'])
 proof['answerChecked']=True;return proof

def mutation(r,i):
 if i==2:
  def swap(m):return m[0].translate(str.maketrans('16','61'))
  return{**r,'statement':re.sub(r'\d+',swap,r['statement'])}
 a,b={1:('15:00','15:09'),3:('қосындысы біртаңбалы','қосындысы екітаңбалы'),4:('қабырғасы 4 м','қабырғасы 5 м'),5:('9 минутта','18 минутта'),6:('26.07.1985','24.07.1985'),8:('77.','91.'),9:('3 дос 4 деңгейден','3 дос 6 деңгейден')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==4:
  # The statement is a valid changed floor problem; recompute its displayed explanatory table too.
  vals=H.numeric_tokens(q['statement']);out,proof=carpets(*vals);lines=['| '+' | '.join(map(str,row))+' |'for row in proof['unitSquareCoverageTopLeftSmall']];lines.insert(1,'| '+' | '.join(['---']*len(proof['unitSquareCoverageTopLeftSmall'][0]))+' |');q['solution']='\n'.join(lines)
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];equalities=0;optionCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert not q['images']and q['solution'];opts=q['options']
  if opts:
   assert len(opts)==4;key=one(j for j,o in enumerate(opts)if o['correct']);assert q['sourceAnswer']==opts[key]['text'];options=[T.source_text(o['text']).replace('{:}',':')for o in opts];answer=options[key];optionCount+=8
  else:assert q['sourceAnswer']is None;answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();options=None
  try:src=solve({**q,'answer':answer,**({'options':options}if options else{})},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  wrong=next(v for v in r['options']if v!=r['answer'])if opts else'999999999'
  for bad in[{**r,'answer':wrong},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==4 and not r.get('image')and bool(opts)==bool(r.get('options'))and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Read all8remaining fullsource/newconditions and full official/newsolutions/oneMCQset. Fullclock sign/errorroles, all24codepermutations/all16attemptposition comparisons percode, complete digitlengthdomains, all4carpetcornerplacementunitcell coverage/histograms/nativefulltable, combinedrate seconds, everyactualGregorian date beforefirstvalid, allfactorpairsincludingoverlapping3-number andalloptionalinteriornumber subsets and completegamegroup conservation independentlychecked. Same root author not separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,tables=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='table'){tables++;for(const row of n.rows)for(const cell of row)walk(cell)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,tables}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceKeysNotCaptured':7,'allSourceAndNewOptionsChecked':optionCount,'wrongKeysRejected':8,'printedSemanticCanariesRejected':8,'nativeFractions':native['fractions'],'nativeTables':native['tables'],'nativeFigures':0,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
