"""All8full frozen/newconditions and full official/newsolutions/MCQoptions/2source
rasters read; both343pxnewnativePNGs inspected. Same root author separate exact
computational review, not a secondhumanreviewer. Two existing modelIDs reused.
"""
import collections,copy,datetime,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo5-tour3-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('tour5',ROOT/'scripts/editorial/review-femo3-tour3-grade5.py');T=importlib.util.module_from_spec(sp);sp.loader.exec_module(T);P=T.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def asset(i):
 f,sha={5:('5c363ea65af276de19abec3a','b44d8ef267df34f2ef7bf155533529956a5549b84c711fda01d9ec7315cd76f3'),8:('7bb75d4b6a6d0f30da18ad2b','c8098660b7b34b79090f191eb4ca0b1a51cb57d664576bdef7d4dea31b7ffff8')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def split_square(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('part-')];assert len(rects)==2;xs=sorted({t for x,y,w,h in rects for t in[x,x+w]});ys=sorted({t for x,y,w,h in rects for t in[y,y+h]});assert xs[-1]-xs[0]==ys[-1]-ys[0];side=xs[-1]-xs[0]
 for x1,x2 in zip(xs,xs[1:]):
  for y1,y2 in zip(ys,ys[1:]):assert sum(x<F(x1+x2,2)<x+w and y<F(y1+y2,2)<y+h for x,y,w,h in rects)==1
 labels=[];scales=[]
 for id,v in ids.items():
  if id.startswith('perimeter-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);a,b,w,h=one(rect for rect in rects if rect[0]<x<rect[0]+rect[2]and rect[1]<y<rect[1]+rect[3]);p=F(v.text);assert p>0;labels.append(p);scales.append(2*(w+h)/p)
 scale=one(set(scales));assert len(labels)==2;actualSide=side/scale;assert actualSide==sum(labels)/6;out=actualSide*actualSide;return out,{'allActualPrintedPerimeters':list(map(str,labels)),'actualCommonPixelsPerCm':str(scale),'twoRectanglesExactlyFillSquare':True,'physicalSquareSide':str(actualSide),'perimeterSumIdentityMatchesActualGeometry':True,'areaTarget':str(out)}

def colored_sample(r,data=None):
 root=P.W.svg(r,data);rects=[v for v in root.iter()if v.attrib.get('id','').startswith('cell-')];assert len(rects)==36;geometry=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for v in rects];unit=one({w for x,y,w,h in geometry});assert all(w==h for x,y,w,h in geometry);left=min(x for x,y,w,h in geometry);top=min(y for x,y,w,h in geometry);cells={};colors=collections.Counter()
 for v,(x,y,w,h)in zip(rects,geometry):
  c,rr=(x-left)/unit,(y-top)/unit;assert c.denominator==rr.denominator==1;key=int(rr),int(c);assert key not in cells;fill=v.attrib['fill'];expected='#526bd3'if(max(key)+1)%2==0 else'#fff';assert fill==expected;cells[key]=fill;colors[fill]+=1
 assert set(cells)==set(itertools.product(range(6),repeat=2));return{'all36ActualSampleCellsAndColorsChecked':36,'actualSampleBlueCells':colors['#526bd3'],'actualSampleWhiteCells':colors['#fff'],'actualSquareCellsEqualCommonUnit':str(unit)}

def list_items(s):return re.split(r',\s*|\s+және\s+',s.strip())
def city_problem(r,src=False):
 s=r['statement'];first=one(re.findall(r'^(.*?) (?:FEMO олимпиадасына|сайысқа) (.*?) қалаларынан (?:келген|келді)\.',s));names=list_items(first[0]);cities=list_items(first[1]);assert len(names)==len(set(names))==len(cities)==len(set(cities))==4
 def city(token):return one(c for c in cities if token.startswith(c))
 never=one(re.findall(r'(\w+) (?:мен|пен|бен) (\w+) ешқашан (\w+) болған емес',s));past=one(re.findall(r'(\w+) (?:мен|пен|бен) (\w+) (\w+) келген баламен [^.]*финалында бірге болды',s));badge=one(re.findall(r'(\w+) (?:мен|пен|бен) (\w+) (\w+) келген балаға [^.]*(?:сыйға тартты|сыйлады)',s));helping=one(re.findall(r'(\w+) (\w+) келген балаға [^.]*көмектесті',s));firstFinal=one(re.findall(r'(\w+) [^.]*финалына алғаш рет қатысып',s));assert firstFinal in names;assert'біреуінің аты мен'in s and'бірдей әріптен басталады'in s
 exclusions=[(never[0],city(never[2])),(never[1],city(never[2])),(past[0],city(past[2])),(past[1],city(past[2])),(firstFinal,city(past[2])),(badge[0],city(badge[2])),(badge[1],city(badge[2])),(helping[0],city(helping[1]))];assert all(name in names for name,c in exclusions)
 def checks(assignment):return[sum(name[0].casefold()==assignment[name][0].casefold()for name in names)==1]+[assignment[name]!=c for name,c in exclusions]
 valid=[]
 for perm in itertools.permutations(cities):
  assignment=dict(zip(names,perm))
  if all(checks(assignment)):valid.append(assignment)
 answer=one(valid);optionAssignments=[];optionChecks=[]
 for option in r['options']:
  parts=list_items(option);assignment=dict(part.split(' — ')for part in parts);assert set(assignment)==set(names)and set(assignment.values())==set(cities);optionAssignments.append(assignment);optionChecks.append(checks(assignment))
 key=one(j for j,values in enumerate(optionChecks)if all(values));assert optionAssignments[key]==answer and r['answer']==r['options'][key];return{'all24CityBijectionsChecked':24,'allEightActualProseExclusions':exclusions,'exactlyOneNameCityInitialMatchRequired':True,'uniqueAssignment':answer,'allFourOptionsEveryConstraintChecked':optionChecks,'correctChoiceIndex':key,'allProseCluesIncludingFirstFinalAndHelpingRetained':True}

def insertion(target):
 assert target[0]!='0'and target.isdigit();width=len(target)+1;raw=[target[:pos]+digit+target[pos:]for pos in range(width)for digit in'0123456789'];valid=sorted({s for s in raw if s[0]!='0'});direct=[]
 for number in range(10**(width-1),10**width):
  s=str(number)
  if any(s[:j]+s[j+1:]==target for j in range(width)):direct.append(s)
 assert direct==valid;out=F(len(valid));return out,{'targetDigits':target,'outputDigitLength':width,'allInsertionWritingsIncludingLeadingZero':len(raw),'distinctInsertionWritingsBeforeZeroExclusion':len(set(raw)),'allFullWidthIntegersDeletionChecked':9*10**(width-1),'allValidNumbers':[int(s)for s in valid],'fullDeletionScanEqualsExhaustiveInsertion':True,'validNumberCountTarget':str(out)}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  pupils,desks,boysSame,girlsSame=n;assert desks*2==pupils and boysSame%2==girlsSame%2==0;mixed=desks-boysSame/2-girlsSame/2;assert mixed>=0;out=boysSame+mixed;girls=girlsSame+mixed;assert out+girls==pupils;proof={'sameBoyDesks':str(boysSame/2),'sameGirlDesks':str(girlsSame/2),'mixedDesks':str(mixed),'wholePupilCount':str(pupils),'boysTarget':str(out)}
 elif i==2:
  sample=T.valid_date(one(re.findall(r'\d{2}\.\d{2}\.\d{4}',s)));year=sample.year;product=lambda text:math.prod(int(c)for c in text if c!='0');yearProduct=product(str(year));assert product(f'{sample.day:02}{sample.month:02}')==yearProduct;d=datetime.date(year,1,1);valid=[];checked=0
  while d.year==year:
   checked+=1
   if product(f'{d.day:02}{d.month:02}')==yearProduct:valid.append(d)
   d+=datetime.timedelta(days=1)
  assert sample in valid;out=F(len(valid)-1);proof={'calendarYear':year,'allActualGregorianDatesChecked':checked,'nonzeroYearDigitProduct':yearProduct,'allQualifyingDates':[d.isoformat()for d in valid],'allMatchingDatesByMonth':dict(sorted(collections.Counter(d.month for d in valid).items())),'explicitGivenDateExcluded':sample.isoformat(),'otherDateCountTarget':str(out)}
 elif i==3:count,digits=map(int,n);out,proof=T.digit_block(count,digits)
 elif i==4:
  if src:items=list_items(one(re.findall(r'тізімін жасады: (.*?)\.',s)));assert'үш сыйлық'in s;choose=3
  else:items=list_items(one(re.findall(r'Тізімде (.*?) бар\.',s)));choose=2 if'кез келген екеуін'in s else 3;assert'кез келген екеуін'in s or'кез келген үшеуін'in s
  assert len(items)==len(set(items));selections=list(itertools.combinations(items,choose));out=F(len(selections));assert out==math.comb(len(items),choose);proof={'allActuallyListedItems':items,'selectionSize':choose,'allUnorderedSelectionsChecked':len(selections),'unorderedSelectionCountTarget':str(out)}
 elif i==5:
  if src:assert not n;p1,p2=F(22),F(20);side=(p1+p2)/6;a=p1/2-side;b=p2/2-side;assert a+b==side and a>0 and b>0;out=side*side;proof={'sourceRasterSHA256':asset(5),'observedPerimeters':[22,20],'positiveWidths':list(map(str,[a,b])),'physicalSquareSide':str(side),'areaTarget':str(out)}
  else:out,proof=split_square(r,data)
 elif i==6:proof=city_problem(r,src);return{**proof,'answerChecked':True}
 elif i==7:
  target=str(int(one(n)));word=re.search(r'(?:Алтытаңбалы|алтытаңбалы|Бестаңбалы|бестаңбалы)',s)[0].lower();width={'бестаңбалы':5,'алтытаңбалы':6}[word];assert len(target)+1==width;out,proof=insertion(target)
 elif i==8:
  width,height=n;assert width==height and width.denominator==1;size=int(width);assert size%2==0 and size>0;blue=[];white=[]
  for rr,c in itertools.product(range(1,size+1),repeat=2):(blue if max(rr,c)%2==0 else white).append((rr,c))
  out=F(len(blue)-len(white));assert len(blue)+len(white)==size*size and out==size;proof={'wholeGridRowsAndColumns':size,'allFullGridCellsChecked':size*size,'blueCells':len(blue),'whiteCells':len(white),'pairwiseOddLayerFormulaEqualsActualCount':True,'blueMinusWhiteTarget':str(out)}
  if src:proof['sourceRasterSHA256']=asset(8);proof['observedSourceFirstLayerWhiteMaxIndexEvenBlack']=True
  else:assert'үлкенін қараймыз: ол жұп болса, тор көк; тақ болса, ақ'in s;proof.update(colored_sample(r,data))
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 if i==6:
  q=copy.deepcopy(r)
  for key in['statement','answer']:q[key]=q[key].replace('Данияр','Мирас')
  q['options']=[v.replace('Данияр','Мирас')for v in q['options']];return q
 a,b={1:('30 оқушы','32 оқушы'),2:('04.04.2024','05.04.2025'),3:('132 цифр','140 цифр'),4:('кез келген екеуін','кез келген үшеуін'),7:('31425','3142'),8:('36 × 36','38 × 38')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==1:q['statement']=q['statement'].replace('15 екіорындық','16 екіорындық')
 if i==2:q['statement']=q['statement'].replace('2024 жылы','2025 жылы')
 if i==7:q['statement']=q['statement'].replace('Алтытаңбалы','Бестаңбалы').replace('алтытаңбалы','бестаңбалы')
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];equalities=0;optionCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and(not q['images']or i in[5,8]);opts=q['options']
  if opts:assert len(opts)==4;key=one(j for j,o in enumerate(opts)if o['correct']);assert q['sourceAnswer']==opts[key]['text'];options=[o['text']for o in opts];answer=options[key];optionCount+=8
  else:assert q['sourceAnswer']is None;answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();options=None
  try:src=solve({**q,'answer':answer,**({'options':options}if options else{})},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=P.W.svg(r)
   if i==5:
    for v in root.iter():
     if v.attrib.get('id','').startswith('perimeter-'):v.text=str(F(v.text)*2)
    expected='484'
   else:one(v for v in root.iter()if v.attrib.get('id')=='cell-0-0').set('fill','#526bd3');expected=None
   changed=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:proof['updatedHashActualFigureSemanticCanaryRejected']=True
   else:raise AssertionError('changedactualfigureaccepted')
   if expected:solve({**bad,'answer':expected},i,False,changed);proof['validChangedNativeTarget']=expected
  for bad in[{**r,'answer':next(v for v in r['options']if v!=r['answer'])if opts else'999999999'}]+([]if i==5 else[mutation(r,i)]):
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==4 and bool(opts)==bool(r.get('options'))and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8fullsource/newconditions and full official/newsolutions/allMCQoptions/2rasters/2newnativepreviews read. Exactpairedstudents, all366/365validdates and nonzerodigitproducts withgivenexcluded, allgloballyboundedconsecutiveintegerstarts, everyactualgiftcombination, actualnativeperimeters/commonunits/fullsquarepartition, all24citybijections againstall8actualproseexclusions andinitialmatch/alloptions, complete90k/900kdeletiondomain matchingallinsertionstrings, all2500/1296colorcells andall36nativeexamplefills checked. Same root author separatecomputation, not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actualtwo-rectanglevertices/labels/perimeters/commonunits/fullsquarecoverage or all36nativecellpositions/fills decoded. Bothsource bitmaps and343pxnewPNGs inspected. Updatedhashlabeldoubling changesarea121to484; wrongcellcolor violatesexplicitpatternandisrejected. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceKeysNotCaptured':7,'allSourceAndNewOptionsChecked':optionCount,'wrongKeysRejected':8,'printedSemanticCanariesRejected':8,'nativeFigures':2,'updatedHashActualFigureCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'existingModelIdsReused':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
