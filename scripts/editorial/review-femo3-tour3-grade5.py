"""All10full frozen/new conditions, complete official/newsolutions, allsource/new
MCQoptions and sourcewindmillraster plus343pxnativePNG inspected. Same root
separate exact computational review, not anotherhumanreviewer.
"""
import collections,copy,datetime,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo3-tour3-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('spring4',ROOT/'scripts/editorial/review-femo2-spring-grade4-remainder.py');P=importlib.util.module_from_spec(sp);sp.loader.exec_module(P);K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def source_text(s):return re.sub(r'\$([^$]*)\$',r'\1',s).strip()
def valid_date(s):d,m,y=map(int,s.split('.'));return datetime.date(y,m,d)
def date_digits(d):return f'{d.day:02}{d.month:02}{d.year:04}'
def next_distinct_date(start):
 assert len(set(date_digits(start)))==8;d=start;checked=0
 while True:
  d+=datetime.timedelta(days=1);checked+=1
  if len(set(date_digits(d)))==8:return d,checked

def windmill(r,delta,data=None):
 root=P.W.svg(r,data);rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for v in root.iter()if v.attrib.get('id','').startswith('piece-')];assert len(rects)==6 and len(set(rects))==6 and all(w>0 and h>0 for x,y,w,h in rects);left=min(x for x,y,w,h in rects);top=min(y for x,y,w,h in rects);right=max(x+w for x,y,w,h in rects);bottom=max(y+h for x,y,w,h in rects);side=right-left;assert side==bottom-top
 xs=sorted({v for x,y,w,h in rects for v in[x,x+w]});ys=sorted({v for x,y,w,h in rects for v in[y,y+h]});covered=0
 for x1,x2 in zip(xs,xs[1:]):
  for y1,y2 in zip(ys,ys[1:]):
   x,y=(x1+x2)/2,(y1+y2)/2;assert sum(a<x<a+w and b<y<b+h for a,b,w,h in rects)==1;covered+=(x2-x1)*(y2-y1)
 assert covered==side*side;perimeters={2*(w+h)for x,y,w,h in rects};common=one(perimeters);outer=[p for p in rects if p[0]==left or p[1]==top or p[0]+p[2]==right or p[1]+p[3]==bottom];inner=[p for p in rects if p not in outer];assert len(outer)==4 and len(inner)==2;outerDims=one({tuple(sorted([w,h]))for x,y,w,h in outer});innerDims=one({tuple(sorted([w,h]))for x,y,w,h in inner});unit=outerDims[0];assert side==6*unit and outerDims==(unit,5*unit)and innerDims==(2*unit,4*unit)and common==2*side;outerArea=math.prod(outerDims);innerArea=math.prod(innerDims);ratio=side*side/(innerArea-outerArea);assert ratio==12 and delta>0;out=ratio*delta;return out,{'actualSixRectangleDimensions':[[str(v)for v in p[2:]]for p in rects],'wholeSquareExactlyCoveredOnce':True,'allSixEqualPerimeterPixels':str(common),'fourOuterRectanglesCongruent':True,'twoInnerRectanglesCongruent':True,'outerDimensionsInCommonUnit':list(map(str,[p/unit for p in outerDims])),'innerDimensionsInCommonUnit':list(map(str,[p/unit for p in innerDims])),'squareSideInCommonUnit':str(side/unit),'wholeAreaToDifferenceRatio':str(ratio),'givenAreaDifference':str(delta),'wholeSquareAreaTarget':str(out)}

def digit_block(count,digits):
 assert count>0 and digits>0;ceilMean=math.ceil(F(digits,count));limit=10**(ceilMean-1);assert limit<=100000;lengths=[len(str(i))for i in range(1,limit+count)];pref=[0]
 for v in lengths:pref.append(pref[-1]+v)
 starts=[i for i in range(1,limit)if pref[i+count-1]-pref[i-1]==digits];start=one(starts);last=start+count-1;assert sum(len(str(i))for i in range(start,last+1))==digits;return F(last),{'allPositiveStartValuesBelowGlobalBoundChecked':limit-1,'atOrAboveGlobalBoundTooManyDigits':True,'uniqueStart':start,'consecutiveCount':count,'fullDigitLengthHistogram':dict(collections.Counter(len(str(i))for i in range(start,last+1))),'totalDigits':digits,'largestTarget':last}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  digit='0'if src else one(re.findall(r'«(\d)» цифры',s));assert'дәл үш'in s;times=[f'{h:02}:{m:02}'for h in range(24)for m in range(60)if(f'{h:02}{m:02}').count(digit)==3];out=F(len(times));proof={'all1440MinuteDisplaysChecked':1440,'leadingZerosPreserved':True,'specifiedDigit':digit,'allMatchingDisplays':times,'exactlyThreeDigitMinutesTarget':str(out)}
 elif i==2:count,digits=map(int,n);out,proof=digit_block(count,digits)
 elif i==3:
  names={'екітаңбалы':2,'үштаңбалы':3,'төрттаңбалы':4};sq=names[one(re.findall(r'[Кк]вадраты (\w+) болатын',s))];cube=names[one(re.findall(r'кубы (\w+) болатын',s))];squareCandidates=[x for x in range(1,10**math.ceil(F(sq,2)))if len(str(x*x))==sq];cubeCandidates=[x for x in range(1,10**math.ceil(F(cube,3)))if len(str(x*x*x))==cube];a,b=max(squareCandidates),min(cubeCandidates);assert len(str((a+1)**2))>sq and len(str((b-1)**3))<cube;out=F(a+b);proof={'squareDigitLength':sq,'cubeDigitLength':cube,'allSquareCandidates':squareCandidates,'allCubeCandidates':cubeCandidates,'largestSquareInput':a,'smallestCubeInput':b,'integerBoundaryNeighborsChecked':True,'sumTarget':str(out)}
 elif i==4:
  if src:assert'жартысы'in s and'үштен екісі'in s and'төртеуі'in s;on,late,absent=F(1,2),F(2,3),F(4)
  else:fs=re.findall(r'\(\d+/\d+\)',s);assert len(fs)==2;on,late=map(exact,fs);remaining=s
  if not src:
   for part in fs:remaining=remaining.replace(part,'',1)
   absent=one(H.numeric_tokens(remaining))
  assert 0<on<1 and 0<late<1 and absent>0;whole=absent/((1-on)*(1-late));onCount=on*whole;lateCount=(1-on)*late*whole;out=whole-absent;assert all(v.denominator==1 for v in[whole,onCount,lateCount,absent])and onCount+lateCount==out;proof={'allInvited':str(whole),'onTime':str(onCount),'late':str(lateCount),'absent':str(absent),'allPeopleConserved':onCount+lateCount+absent==whole,'arrivedTarget':str(out)}
 elif i==5:
  target=int(n[0]);assert n==[target]if src else n==[target,1];allValues=[x for x in range(100,1000)if len(set(str(x)))==3];assert target in allValues;out=F(allValues.index(target)+1);assert len([x for x in allValues if x<=target])==out;proof={'all900ThreeDigitNumbersChecked':900,'totalDistinctDigitNumbers':len(allValues),'rankedNumber':target,'immediatePredecessor':allValues[int(out)-2],'oneBasedRankTarget':str(out)}
 elif i==6:
  date=one(re.findall(r'\d{2}\.\d{2}\.\d{4}',s));start=valid_date(date);nextDate,checked=next_distinct_date(start);targetDay=not src and'күні қандай'in s;out=f'{nextDate.day:02}'if targetDay else f'{nextDate.month:02}';options=r['options'];roles=[f'{nextDate.day:02}',f'{nextDate.month:02}',f'{nextDate.year:04}'[:2],f'{nextDate.month%12+1:02}'];assert options==roles and len(set(options))==4;assert r['answer']==out and one(j for j,v in enumerate(options)if v==out)>=0;proof={'sourceDate':start.isoformat(),'allConsecutiveValidGregorianDatesChecked':checked,'firstFollowingDistinctDigitDate':nextDate.isoformat(),'eightExactDateDigits':date_digits(nextDate),'actualTargetComponent':'day'if targetDay else'month','allFourOptionRoles':dict(zip(['day','month','yearPrefix','followingMonth'],options)),'allOptionCorrectness':[v==out for v in options],'targetTwoDigits':out}
 elif i==7:
  delta=one(n)
  if src:
   sha='b742aa8c13dafcbe2b6746475d2e49b1c67ca0c5435b05d77def4296ea6ea30d';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/4e21ba3887f58c67f0187c1e.png').read_bytes()).hexdigest()==sha;unitSquared=delta/3;out=36*unitSquared;proof={'sourceRasterSHA256':sha,'originalCongruentFourOuterAndTwoInnerIntentReadFromDiagram':True,'equalPerimetersImplySideSixShortWidths':True,'outerArea5wSquaredInner8wSquared':True,'shortWidthSquared':str(unitSquared),'wholeSquareAreaTarget':str(out),'congruenceAssumptionExplicitlyStatedInNew':True}
  else:assert'Шеткі төрт тіктөртбұрыш өзара тең'in s and'ортадағы екеуі де өзара тең'in s;out,proof=windmill(r,delta,data)
 elif i==8:
  claimA,claimB=n;cases=[]
  for speaker,neighbor in itertools.product([0,1],repeat=2):
   truth=speaker!=neighbor;claim=neighbor if truth else 1-neighbor;assert claim==1-speaker;cases.append({'speaker':speaker,'neighbor':neighbor,'mustTellTruth':truth,'claimedGroup':claim})
  out=(claimB,claimA);optionPairs=[tuple(H.numeric_tokens(v))for v in r['options']];matches=[j for j,p in enumerate(optionPairs)if p==out];key=one(matches);assert r['answer']==r['options'][key];proof={'allFourSpeakerNeighborTruthCases':cases,'claimIndependentOfNeighbor':True,'eachChildExactlyOneClaim':True,'allSourceNewOptionCounts':[list(map(str,p))for p in optionPairs],'correctGroupCounts':list(map(str,out)),'correctChoiceIndex':key}
 elif i==9:
  if src:assert'үш қақпадан'in s and'төрттен бірін'in s;count=3;fee=F(1,4);final=one(n)
  else:assert'төрт бекеттен'in s;count=4;part=one(re.findall(r'\(\d+/\d+\)',s));fee=exact(part);final=one(H.numeric_tokens(s.replace(part,'')))
  assert 0<fee<1;out=final/(1-fee)**count;balances=[out]
  for j in range(count):assert(balances[-1]*fee).denominator==1;balances.append(balances[-1]*(1-fee))
  assert balances[-1]==final and all(v.denominator==1 for v in balances);proof={'tollCount':count,'feeFraction':str(fee),'allWholeCoinBalancesForward':list(map(str,balances)),'everyTollTakenFromCurrentBalance':True,'initialCoinsTarget':str(out)}
 elif i==10:
  fast,slow,minutes,fastLength=n;assert fast>slow>0 and minutes>0 and fastLength>0;relMeters=(fast-slow)*(minutes/60)*1000;out=relMeters-fastLength;assert out>0 and fastLength+out==relMeters;proof={'speedDifferenceKmh':str(fast-slow),'fullOvertakeMinutes':str(minutes),'relativeMeters':str(relMeters),'bothTrainLengthsSum':str(fastLength+out),'slowTrainLengthTarget':str(out),'eventEndpointsExplicitInNew':not src}
 else:raise AssertionError(i)
 if i not in[6,8]:assert exact(r['answer'])==out,(i,src,proof,r['answer'])
 proof['answerChecked']=True;return proof

def mutation(r,i):
 pairs={1:('«2» цифры','«3» цифры'),2:('320 цифр','328 цифр'),3:('кубы төрттаңбалы','кубы үштаңбалы'),4:('6 дос','8 дос'),5:('864 саны','865 саны'),6:('датаның айы қандай','датаның күні қандай'),7:('75 см²','108 см²'),9:('128 тиыны','144 тиыны'),10:('3 минут','4 минут')}
 if i==8:s=r['statement'].replace('11 рет','@ рет').replace('12 рет','11 рет').replace('@ рет','12 рет');return{**r,'statement':s}
 a,b=pairs[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];equalities=0;optionsChecked=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and(not q['images']or i==7);options=q['options']
  if options:
   assert len(options)==4;key=one(j for j,o in enumerate(options)if o['correct']);assert q['sourceAnswer']==options[key]['text'];sourceOptions=[source_text(o['text'])for o in options];answer=sourceOptions[key];optionsChecked+=len(options)+len(r['options']);assert r['answer']in r['options']
  else:assert q['sourceAnswer']is None;answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();sourceOptions=None
  try:src=solve({**q,'answer':answer,**({'options':sourceOptions}if sourceOptions else{})},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=P.W.svg(r);one(v for v in root.iter()if v.attrib.get('id')=='piece-top').set('width','171');changed=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:proof['actualPartitionOverlapCanaryRejectedWithUpdatedHash']=True
   else:raise AssertionError('brokenactualsixpiecepartitionaccepted')
  for bad in[{**r,'answer':r['options'][0]if options else'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['grade']==5 and r['minimumPlan']=='pro'and r['statement']!=q['statement']and bool(options)==bool(r.get('options'));assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All10fullsource/newconditions and full official/newsolutions/allMCQoptions/raster read. EveryHHMMdisplay, allgloballyboundedconsecutiveintegerstarts, fullsquare/cubeintegerdigitbounds, allattendancecounts, all900distinctdigitranks, eachrealGregoriandate aftervalidstart untilfirstmatch, actualsixpiecepartition/perimeters/congruence/arearatio, all4speakerneighbortruthcases, everywholecoinbalance and fulltrainovertakeendpoint distance independentlychecked. Same root author separatemath, not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actualsixnative rectangles decoded, allcoordinatepartitions coveredexactlyonce, commonperimeter/congruence/allarearatios checked; sourcebitmap and343pxnewnativePNG viewed. Updatedhashrectwidthchange introducesoverlap andfails. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':8,'allSourceAndNewOptionsChecked':optionsChecked,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFractions':native['fractions'],'nativeFigures':1,'updatedHashActualGeometryCanariesRejected':1,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
