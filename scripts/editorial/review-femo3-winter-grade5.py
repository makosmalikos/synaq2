"""All10full saved/new FEMO3wintergrade5conditions and full official/newsolutions
read. Onearchived source raster and343pxnativePNG inspected. Same root author
separate exact computation, no separatehumanreviewer. Allactual calendar dates,
all100suffixes, allclub subsets and all2021/2047exactFibonacci terms checked.
Nativegeometry checks coordinates/dimensions/fills/squareareas and complement.
"""
import calendar,copy,datetime,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo3-winter-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;opts=K.opts

def geometry(r,bigArea,smallArea,data=None):
 raw=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];s=raw.decode();assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',s);svg=ET.fromstring(s);assert svg.attrib['viewBox']=='0 0 360 270';ids={v.attrib['id']:v for v in svg.iter()if'id'in v.attrib}
 def rect(id):return[F(ids[id].attrib[k])for k in['x','y','width','height']]
 x,y,L,L2=rect('big-square');sx,sy,R,stripH=rect('right-strip');wx,wy,W,W2=rect('small-square');assert L==L2>0 and W==W2>0 and R==W and L>W and[x+L,y]==[sx,sy]and stripH==L and[wx,wy]==[sx,y+(L-W)/2];assert rect('outline')==[x,y,L+W,L];assert ids['big-square'].attrib['fill']==ids['small-square'].attrib['fill']=='#fff'and ids['right-strip'].attrib['fill']=='#e3d7f7';assert[F(ids['divider'].attrib[k])for k in['x1','y1','x2','y2']]==[sx,y,sx,y+L];assert L*L/bigArea==W*W/smallArea;scale2=L*L/bigArea;out=(L*W-W*W)/scale2
 for label in['A','M','B','D','N','C','P','Q','R','S']:assert ids[label].text==label
 for label,pos in{'A':x,'D':x,'M':sx,'N':sx,'B':sx+W,'C':sx+W}.items():assert F(ids[label].attrib['x'])==pos
 assert F(ids['P'].attrib['y'])-6==wy and F(ids['S'].attrib['y'])-6==wy and F(ids['Q'].attrib['y'])-6==wy+W and F(ids['R'].attrib['y'])-6==wy+W
 assert all(F(ids[label].attrib['x'])<sx for label in['P','Q'])and all(F(ids[label].attrib['x'])>sx+W for label in['S','R']);proof={'actualBigSquarePixels':str(L),'actualSmallSquarePixels':str(W),'sameScaleSquared':str(scale2),'rightStripExactlySmallSquareWide':True,'bothPurpleComponentsPositive':L>W,'allTenLabelsAndWhiteRegionCoordinatesVerified':True,'actualNativeComplementArea':str(out),'originalNativeSVGNoRasterScriptsLinks':True};return out,proof

def fibonacci_count(length,modulus):
 assert length>=2 and modulus>=2;first=(1%modulus,1%modulus);a,b=first;states=[];seen=set()
 while(a,b)not in seen:
  seen.add((a,b));states.append((a,b));a,b=b,(a+b)%modulus;assert len(states)<=modulus*modulus
 assert(a,b)==first;period=len(states);remainders=[p[0]for p in states];blocks,left=divmod(length,period);periodic=blocks*remainders.count(0)+remainders[:left].count(0);a,b=1,1;zeros=[]
 for j in range(1,length+1):
  if a%modulus==0:zeros.append(j)
  assert a%modulus==remainders[(j-1)%period];a,b=b,a+b
 assert periodic==len(zeros);return F(periodic),{'statePairPeriod':period,'allPeriodRemainders':remainders,'periodZeroPositions':[j+1 for j,v in enumerate(remainders)if v==0],'fullPeriods':blocks,'remainderLength':left,'allExactIntegerTermsCrossChecked':length,'allDivisibleIndices':zeros,'pairReturnsToSameInitialState':True}

def solve(r,w,i,src=False,figureBytes=None):
 s=r['statement'];n=H.numeric_tokens(re.sub(r'см\$?\^2\$?','см',s));proof={}
 if i==1:
  if src:assert'ақшасының жартысына'in s and'қалған ақшасының үштен екі бөлігіне'in s;f1,f2=F(1,2),F(2,3);remaining=one(n)
  else:
   fracs=re.findall(r'\(\d+/\d+\)',s);assert len(fracs)==2;f1,f2=map(E.calc,fracs);bare=s
   for text in fracs:bare=bare.replace(text,'')
   remaining=one(H.numeric_tokens(bare))
  assert 0<f1<1 and 0<f2<1;remainingFraction=(1-f1)*(1-f2);out=remaining/remainingFraction;stages=[out,out*(1-f1),remaining];assert stages[1]*(1-f2)==remaining;proof={'twoSpendingFractions':[str(f1),str(f2)],'remainingFractionOfOriginal':str(remainingFraction),'allBudgetStages':list(map(str,stages)),'originalBudgetTarget':str(out)}
 elif i==2:
  front,back,left,right=n;rows=front+back-1;columns=left+right+1;out=rows*columns;assert min(rows,columns)>0;proof={'rowsIncludingSameChildOnce':str(rows),'columnsIncludingChildOnce':str(columns),'rectangularStudentCountTarget':str(out)}
 elif i==3:
  big,small=n;bigSide=math.isqrt(int(big));smallSide=math.isqrt(int(small));assert bigSide**2==big and smallSide**2==small and bigSide>smallSide>0;out=F(bigSide*smallSide)-small
  if src:
   sha='c8833c0fe5c5fa9adaa83c3cc2eddf883256567f28bce563c9db2d5c579a5e1b';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/de86f4ceee9c3665fff987d3.png').read_bytes()).hexdigest()==sha;proof['sourceWhitePQRSspansRightStripWidthRasterInspected']=True;proof['sourcePNGsha256']=sha
  else:g,gproof=geometry(r,big,small,figureBytes);assert out==g;proof.update(gproof)
  proof.update({'bigSquareSide':bigSide,'smallSquareSide':smallSide,'rightStripArea':bigSide*smallSide,'purpleComplementTarget':str(out)})
 elif i==4:
  if src:assert'бір кесе шай мен екі кесе кофе'in s and'үш кесе шай мен бір кесе кофе'in s;a,b,c,d=F(1),F(2),F(3),F(1);total1,total2=n
  else:a,b,total1,c,d,total2=n
  det=a*d-b*c;assert det;tea=(total1*d-b*total2)/det;coffee=(a*total2-total1*c)/det;assert coffee>tea>0 and a*tea+b*coffee==total1 and c*tea+d*coffee==total2;out=coffee-tea;proof={'priceTea':str(tea),'priceCoffee':str(coffee),'nonzeroPriceSystemDeterminant':str(det),'bothPurchasesConserved':True,'coffeeMinusTeaTarget':str(out)}
 elif i==5:
  if src:assert'Үш сфераның салмағы екі цилиндрдің'in s and'бес сфераның салмағы алты кубтың'in s and'Бес цилиндрдің'in s;a,b,c,d,k=map(F,[3,2,5,6,5])
  else:a,b,c,d,k=n
  assert min(a,b,c,d,k)>0;sphere=d/c;cylinder=a*sphere/b;out=k*cylinder;assert a*sphere==b*cylinder and c*sphere==d;proof={'cubeMassUnit':1,'sphereMass':str(sphere),'cylinderMass':str(cylinder),'askedCylinderCount':str(k),'equivalentCubeCountTarget':str(out),'bothWeightEqualitiesChecked':True}
 elif i==6:
  total,gapGrand,gapParent,gapSibling,fatherTimes,grandTimes=n;coefficient=2+2*fatherTimes+2*grandTimes;offset=gapSibling-gapParent-gapGrand;daughter=(total-offset)/coefficient;son=daughter+gapSibling;father=fatherTimes*daughter;mother=father-gapParent;grandfather=grandTimes*daughter;grandmother=grandfather-gapGrand;ages=[daughter,son,father,mother,grandfather,grandmother];assert sum(ages)==total and all(v.denominator==1 and v>0 for v in ages)and min(father,mother)>max(daughter,son)and min(grandfather,grandmother)>max(father,mother);out=grandfather;proof={'allSixAgesDaughterSonFatherMotherGrandfatherGrandmother':list(map(str,ages)),'wholeAgeSum':str(total),'allFiveRelationsChecked':True,'grandfatherAgeTarget':str(out)}
 elif i==7:
  year=int(n[0]);digits={str(int(v))for v in n[1:4]};assert len(digits)==3;dates=[];counts={}
  for month in range(1,13):
   for day in range(1,calendar.monthrange(year,month)[1]+1):
    text=f'{day:02d}.{month:02d}.{year:04d}';assert datetime.datetime.strptime(text,'%d.%m.%Y').date()==datetime.date(year,month,day)
    if set(text.replace('.',''))<=digits:dates.append(text);counts[month]=counts.get(month,0)+1
  out=F(len(dates));proof={'year':year,'allowedDigits':sorted(digits),'allActualCalendarDatesEnumerated':366 if calendar.isleap(year)else 365,'allQualifyingDates':dates,'monthCounts':counts,'dateCountTarget':len(dates),'leadingZeroFullYearAndRealMonthLengthsChecked':True}
 elif i==8:
  div1,div2,*digits=map(int,n);assert len(digits)==6 and digits[0]!=0;prefix=''.join(map(str,digits));suffixes=[f'{a}{b}'for a,b in itertools.product(range(10),repeat=2)if int(prefix+f'{a}{b}')%div1==int(prefix+f'{a}{b}')%div2==0];out=F(len(suffixes));assert len(set(suffixes))==len(suffixes);proof={'knownSixDigitPrefix':prefix,'all100SuffixesChecked':100,'allFeasibleTwoDigitSuffixes':suffixes,'worstCaseDistinctChecksTarget':len(suffixes)}
 elif i==9:
  if src:assert'алты үйірме'in s and'үшеуіне'in s and'екі үйірме бір уақытта'in s;total,choose=6,3;proof['sourceExactlyOneVersusAtMostOneWordingClarifiedToOfficialAtMostOne']=True
  else:total,choose=map(int,n);assert'екеуін де алмауға болады'in s
  allSubsets=list(itertools.combinations(range(total),choose));valid=[p for p in allSubsets if not({0,1}<=set(p))];invalid=[p for p in allSubsets if{0,1}<=set(p)];out=F(len(valid));assert len(allSubsets)==math.comb(total,choose)and len(invalid)==math.comb(total-2,choose-2);proof.update({'allUnorderedSubsetsChecked':len(allSubsets),'allValidClubSubsets':valid,'allInvalidClubSubsets':invalid,'validChoicesTarget':len(valid),'neitherConflictClubAlsoPermitted':True})
 elif i==10:
  assert n[:8]==[1,1,2,3,5,8,13,21];length,modulus=map(int,n[-2:]);out,proof=fibonacci_count(length,modulus);proof['divisibleTermCountTarget']=str(out)
 else:raise AssertionError(i)
 assert E.calc(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,w,i):
 pairs={1:('3000 теңге','4000 теңге'),2:('11-ші','12-ші'),3:('36 см²','49 см²'),4:('9600 теңге','10200 теңге'),5:('21 цилиндр','42 цилиндр'),6:('308','320'),7:('0, 2, 3 жиынынан','0, 1, 3 жиынынан'),8:('6, 3, 7, 0, 2, 8','6, 3, 7, 0, 2, 9'),9:('7 үйірме','8 үйірме'),10:('2047','2053')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution'];assert (not q['images']) or (i==3 and len(q['images'])==1);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  if r.get('image'):
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();bad=copy.deepcopy(r);changed=raw.replace(b'x1="220"',b'x1="221"');assert changed!=raw;bad['figureSha256']=hashlib.sha256(changed).hexdigest()
   try:geometry(bad,F(36),F(9),changed)
   except AssertionError:pass
   else:raise AssertionError('Incorrect divider accepted')
   svg=ET.fromstring(raw);ids={v.attrib['id']:v for v in svg.iter()if'id'in v.attrib};ids['right-strip'].set('width','120');ids['small-square'].set('y','75');ids['small-square'].set('width','120');ids['small-square'].set('height','120');ids['outline'].set('width','300')
   for label in['B','C']:ids[label].set('x','340')
   for label in['R','S']:ids[label].set('x','356')
   for label in['P','S']:ids[label].set('y','81')
   for label in['Q','R']:ids[label].set('y','201')
   changed=ET.tostring(svg);bad=copy.deepcopy(r);bad['statement']=bad['statement'].replace('9 см²','16 см²');bad['figureSha256']=hashlib.sha256(changed).hexdigest()
   try:solve(bad,w,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('Validchangedgeometry retained wrongoldkey')
   bad['answer']='8';changedProof=solve(bad,w,i,False,changed);assert changedProof['actualNativeComplementArea']=='8';proof['updatedHashActualGeometryCanariesRejected']=2;proof['legitimateChangedSmallSquareArea16ChangesTargetTo']='8'
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and (not r.get('image') or(i==3))and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,w,i)]:
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError):pass
   else:raise AssertionError(('canary accepted',w,i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and (before[-1]==':' or before[-1].isascii()and before[-1].isalpha()):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('solution equality',w,i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All10full frozen/new conditions and full official/new solutions plus archivedraster read. Exact originalarithmetic systems/ratios/ages, allrealcalendardates/all100code suffixes/allclub subsets/all2021and2047exactrecurrence terms and fullpairperiod checked. Nativegeometry and2updatedhash actualfigurecanaries verified. Same root author no separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualXMLbig/smallsquares and common scale, rightstrip spanningwidth/whitecentering/all10labels and coloredcomplement checked. Archivedsource and343pxnativePNG visuallyinspected;2actualfigurecanarieswithupdatedhash rejected.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFractions':native['fractions'],'nativeFigures':1,'updatedHashActualGeometryCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
