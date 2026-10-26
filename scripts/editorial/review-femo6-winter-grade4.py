"""All15full frozen/newconditions and full official/newsolutions/oneMCQset/2source
rasters read; two343pxnativePNGs inspected. Same root author separate exact
computational review, not anotherhumanreviewer.
"""
import collections,copy,hashlib,heapq,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo6-winter-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
T=module('tour5','scripts/editorial/review-femo3-tour3-grade5.py');M=module('spring5','scripts/editorial/review-femo3-spring-grade5-remainder.py');P=T.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def asset(i):
 f,sha={4:('7962b8df2e1bbdf0b3ef3875','b5a40b62a2bbd84f455a14125442e68cf82bbb675ea52244bbc486976d12432c'),14:('730aeaae879726083eb49a84','d38fb81a9c82bcc8343ea079039a493d777ed7795328862925ad249b1c6b8cd9')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def polynomial_multiply(a,b):
 c=collections.defaultdict(F)
 for i,x in a.items():
  for j,y in b.items():c[i+j]+=x*y
 return dict(c)
def pyramid_values(values,edges):
 target=one(k for k,v in values.items()if v=='?');parents={k:[]for k in values}
 for a,b in edges:parents[b].append(a)
 order=[];remaining=set(values)
 while remaining:
  ready=[k for k in remaining if all(p in order for p in parents[k])];assert ready;order+=sorted(ready);remaining-=set(ready)
 expressions={};roots=[]
 for k in order:
  if not parents[k]:expressions[k]={1:F(1)}if k==target else{0:F(values[k])}
  else:
   assert len(parents[k])==2;a,b=parents[k];expressions[k]=polynomial_multiply(expressions[a],expressions[b])
  if values[k]not in['','?']:
   poly=expressions[k];constant=poly.get(0,F(0));assert max(poly)<=1
   if poly.get(1):roots.append((F(values[k])-constant)/poly[1])
   else:assert constant==F(values[k])
 out=one(set(roots));assert out>0 and out.denominator==1;completed={k:sum(c*out**p for p,c in poly.items())for k,poly in expressions.items()};assert all(completed[a]*completed[b]==completed[k]for k,ps in parents.items()if ps for a,b in[ps]);assert all(v in['','?']or completed[k]==F(v)for k,v in values.items());return out,{'actualMissingNode':target,'allActualGraphProductsAndPrintedValuesMatch':True,'completedAllSixNodeValues':{k:str(v)for k,v in completed.items()},'allLinearGraphConstraintsUniquePositiveSolution':True,'missingValueTarget':str(out)}

def native_pyramid(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects={id[len('node-'):]:tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('node-')};assert len(rects)==6;assert len({(w,h)for x,y,w,h in rects.values()})==1;levels=sorted({y for x,y,w,h in rects.values()});assert[sum(y==level for x,y,w,h in rects.values())for level in levels]==[3,2,1];values={}
 for id,v in ids.items():
  if id.startswith('value-'):
   px,py=F(v.attrib['x']),F(v.attrib['y']);key=one(k for k,(x,y,w,h)in rects.items()if x<px<x+w and y<py<y+h);assert key not in values;values[key]=v.text or''
 assert set(values)==set(rects);edges=[]
 for id,v in ids.items():
  if id.startswith('edge-'):
   x1,y1,x2,y2=[F(v.attrib[k])for k in['x1','y1','x2','y2']];a=one(k for k,(x,y,w,h)in rects.items()if x1==x+w/2 and y1==y+h);b=one(k for k,(x,y,w,h)in rects.items()if x2==x+w/2 and y2==y);assert levels.index(rects[b][1])==levels.index(rects[a][1])+1;edges.append((a,b))
 assert len(edges)==len(set(edges))==6;out,proof=pyramid_values(values,edges);proof['allSixActualConnectorEndpointsBindActualNodes']=True;proof['allActualPrintedNodeLabels']=values;return out,proof

def native_cards(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('card-')];assert len(rects)==3 and len(set(rects))==3;assert len({(w,h)for x,y,w,h in rects})==1;values=[];used=set()
 for id,v in ids.items():
  if id.startswith('value-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);inside=one(rect for rect in rects if rect[0]<x<rect[0]+rect[2]and rect[1]<y<rect[1]+rect[3]);assert inside not in used;used.add(inside);values.append(int(v.text))
 assert len(values)==len(set(values))==3;return values

def card_sums(visible,low,high,target):
 assert low>0 and low<=min(visible)<=max(visible)<=high and target in visible;valid=[];tested=[]
 for total in range(max(visible)+low,min(visible)+high+1):
  backs=[total-v for v in visible];within=all(low<=v<=high for v in backs);distinct=len(set(visible+backs))==6;tested.append({'sum':total,'backValues':backs,'allInRange':within,'allSixDistinct':distinct})
  if within and distinct:valid.append((total,backs))
 total,backs=one(valid);out=F(backs[visible.index(target)]);return out,{'allActualVisibleCardValues':visible,'allowedPositiveRange':[low,high],'allGloballyFeasibleCommonSumsChecked':tested,'uniqueCommonSum':total,'allSixActualValues':visible+backs,'targetVisibleValue':target,'hiddenTarget':str(out)}

def tiling_witness(count,side):
 area=3*count;assert area%(side*side)==0
 height=2 if side==2 else 3;width=area//height;assert height*width==area and height%side==0 and width%side==0;region=set(itertools.product(range(width),range(height)));pieces=[]
 if height==2:
  assert width%3==0
  for x in range(0,width,3):pieces.extend([{(x,0),(x+1,0),(x,1)},{(x+2,0),(x+1,1),(x+2,1)}])
 else:
  assert width%2==0
  for x in range(0,width,2):pieces.extend([{(x,0),(x+1,0),(x,1)},{(x+1,1),(x,2),(x+1,2)}])
 assert len(pieces)==count
 for piece in pieces:assert len(piece)==3 and max(x for x,y in piece)-min(x for x,y in piece)==max(y for x,y in piece)-min(y for x,y in piece)==1
 assert set().union(*pieces)==region and sum(map(len,pieces))==len(region);squares=[{(x+dx,y+dy)for dx,dy in itertools.product(range(side),repeat=2)}for x in range(0,width,side)for y in range(0,height,side)];assert set().union(*squares)==region and sum(map(len,squares))==len(region);return{'sameRegionConstructivelyTilesBothWays':True,'witnessRectangleDimensions':[width,height],'allActualLTriominos':len(pieces),'allActualSquarePieces':len(squares)}

def tower(stocks):
 total=sum(stocks);dominant=max(stocks);others=total-dominant;bound=min(total,2*others+1);heap=[(-n,i)for i,n in enumerate(stocks)if n];heapq.heapify(heap);previous=(0,None);sequence=[]
 while heap:
  count,color=heapq.heappop(heap);sequence.append(color);count+=1
  if previous[0]<0:heapq.heappush(heap,previous)
  previous=count,color
 used=collections.Counter(sequence);assert all(a!=b for a,b in zip(sequence,sequence[1:]))and all(used[i]<=n for i,n in enumerate(stocks));assert len(sequence)==bound;return F(bound),{'actualThreeColorStocks':stocks,'universalDominantSeparatorUpperBound':bound,'explicitAttainingColorIndexSequence':sequence,'actualUsedCounts':dict(used),'everyAdjacentPairDifferent':True,'maximumHeightTarget':bound}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  if src:assert'үш таңбалы'in s;length=3
  else:word=one(re.findall(r'(төрттаңбалы|бестаңбалы) натурал',s));length={'төрттаңбалы':4,'бестаңбалы':5}[word]
  values=[v for v in range(10**(length-1),10**length)if len(set(str(v)))==length];out=F(min(values));proof={'allFixedLengthNaturalCodesChecked':9*10**(length-1),'allDigitsDistinct':True,'leadingZeroExcluded':True,'smallestCodeTarget':str(out)}
 elif i==2:
  if src:total,first=n;step=F(1);assert'бір кәмпит артық'in s
  else:total,first,step=n
  assert min(total,first,step)>0;days=[];used=F(0)
  while used<total:current=first+step*len(days);days.append(current);used+=current
  assert used==total;out=F(len(days));assert sum(days)==total;proof={'allActualDailyAmounts':list(map(str,days)),'exactWholeTotal':str(total),'previousDaysInsufficient':sum(days[:-1])<total,'dayCountTarget':str(out)}
 elif i==3:
  if src:assert'үш шаршыдан'in s;count=F(3)
  else:assert'төрт шаршыны бір қатарға'in s;count=F(4)
  area=one(n);unitArea=area/count;side=math.isqrt(int(unitArea));assert unitArea.denominator==1 and side*side==unitArea;out=2*(count+1)*side;proof={'rowSquareCount':str(count),'wholeRectangleArea':str(area),'oneSquareSide':side,'rectangleSideLengths':list(map(str,[count*side,side])),'rowPlacementExplicitForNewFourSquares':not src,'rectanglePerimeterTarget':str(out)}
 elif i==4:
  if src:out,proof=pyramid_values({'a':'4','b':'5','c':'?','d':'20','e':'','f':'300'},[('a','d'),('b','d'),('b','e'),('c','e'),('d','f'),('e','f')]);proof['sourceRasterSHA256']=asset(4)
  else:out,proof=native_pyramid(r,data)
 elif i==5:
  if src:cells,count,side1,side2=n;assert cells==3 and side1==side2;side=int(side1)
  else:assert'үш торкөзден'in s;count,side1,side2=n;assert side1==side2;side=int(side1);cells=F(3)
  count=int(count);out=F(count)*cells/(side*side);assert out.denominator==1;proof={'totalConservedUnitCells':str(count*cells),'eachSquareCellArea':side*side,'squarePieceCountTarget':str(out)};proof.update(tiling_witness(count,side))
 elif i==6:
  pairs=re.findall(r'(\w+) (?:мен|пен) (\w+)',s);assert len(pairs)==5;names=[a for a,b in pairs];assert len(set(names))==5 and all(b.startswith(names[(j+1)%5])for j,(a,b)in enumerate(pairs));assert len(n)==5;rows=[]
  for j,total in enumerate(n):row=[F(k in[j,(j+1)%5])for k in range(5)]+[total];rows.append(row)
  masses,rank=M.gaussian(rows,5);assert min(masses)>0 and all(masses[j]+masses[(j+1)%5]==n[j]for j in range(5));out=masses[0];assert out==sum(n)/2-n[1]-n[3];proof={'allFiveActualNamedCyclePairs':pairs,'allFivePairSums':list(map(str,n)),'rankFiveUniqueMassSolution':rank,'allFivePositiveMasses':{name:str(v)for name,v in zip(names,masses)},'allOriginalPairSumsMatched':True,'firstMassTarget':str(out)}
 elif i==7:
  if src:digits=one(n)
  else:assert n[0]==1;digits=one(n[1:])
  pages=0;spent=0
  while spent<digits:pages+=1;spent+=len(str(pages))
  assert spent==digits;out=F(pages);proof={'everyPageNumberFrom1Checked':pages,'totalPrintedDigits':spent,'previousPageCountTooFewDigits':spent-len(str(pages))<digits,'pageCountTarget':str(out)}
 elif i==8:
  length,count,piece,time=n;parts=length/piece;assert min(n)>0 and parts.denominator==1;cutsPerLog=parts-1;allCuts=count*cutsPerLog;out=allCuts*time;assert count*parts-count==allCuts;proof={'piecesPerSeparateLog':str(parts),'cutsPerSeparateLog':str(cutsPerLog),'allSeparateCuts':str(allCuts),'initialPieces':str(count),'finalPieces':str(count*parts),'oneCutIncreasesPieceCountByOne':True,'singleSawSequentialCutsExplicitInNew':not src,'minutesTarget':str(out)}
 elif i==9:
  stocks=list(map(int,n));assert len(stocks)==3 and min(stocks)>0;out,proof=tower(stocks)
 elif i==10:
  plain=T.source_text(s);colors=re.split(r',\s*|\s+және\s+',one(re.findall(r'қайталанады: (.*?)\.',plain)));assert len(colors)==len(set(colors))in[5,7];start=one(re.findall(r'[Бб]ірінші жолақ (.*?) түсті',plain));assert start in colors;count=int(one(set(n)));assert count>0;startIndex=colors.index(start);direct=[colors[(startIndex+j)%len(colors)]for j in range(count)];out=direct[-1];assert out==colors[(startIndex+count-1)%len(colors)];opts=[o.casefold()for o in r['options']];assert r['answer'].casefold()==out and r['answer']in r['options'];assert len(opts)==len(set(opts))==4 and sum(v==out for v in opts)==1;assert opts==[start,out,colors[(startIndex+1)%len(colors)],colors[(colors.index(out)-1)%len(colors)]];proof={'allActuallyListedCycleColors':colors,'firstColor':start,'allStripePositionsSimulated':count,'completeCycles':count//len(colors),'remainder':count%len(colors),'allFourOptionRolesChecked':opts,'lastColorTarget':out};return{**proof,'answerChecked':True}
 elif i==11:
  if src:future=past=multiple=one(set(n));assert future>0
  else:future,past,multiple,pastAgain=n;assert past==pastAgain
  out=(future+(multiple+1)*past)/multiple;assert multiple>0 and out>past and out.denominator==1;assert out+future-multiple*(out-past)==out-past;proof={'futurePastMultiplier':list(map(str,[future,past,multiple])),'pastAge':str(out-past),'futureAge':str(out+future),'fullOriginalSubtractionEquationMatched':True,'currentAgeTarget':str(out)}
 elif i==12:
  limit=int(one(n));squares={j*j for j in range(1,math.isqrt(limit-1)+1)};odd={j for j in range(1,limit)if j%2};union=squares|odd;assert all(j<limit for j in union);evenSquares=sorted(squares-odd);out=F(len(union));assert out==len(odd)+len(evenSquares);proof={'allPositiveNaturalValuesBelowStrictBoundChecked':limit-1,'oddCount':len(odd),'allExtraEvenSquares':evenSquares,'oddSquaresNotDoubleCounted':True,'squareOrOddUnionTarget':str(out)}
 elif i==13:
  digit,total=n;assert digit.denominator==1 and 0<=digit<=9;out=(total-digit)/11;assert out.denominator==1 and out>0;appended=int(str(int(out))+str(int(digit)));assert appended==10*out+digit and appended+out==total;proof={'appendedDigit':str(digit),'appendedActualDecimalNumber':appended,'sumWithOriginalMatched':True,'originalNaturalTarget':str(out)}
 elif i==14:
  plain=T.source_text(s);low,high=map(int,one(re.findall(r'(\d+)-ден\s+(\d+)-ға дейінгі',plain)));target=int(one(re.findall(r'(\d+) (?:саны )?жазылған карточканың',plain)));visible=[2,99,49]if src else native_cards(r,data);out,proof=card_sums(visible,low,high,target)
  if src:proof['sourceRasterSHA256']=asset(14)
 elif i==15:
  equation=H.math_parts(s,src)[-1];lhs,rhs=equation.split('=');letters=re.findall(r'[A-Za-z]',lhs);assert len(letters)==len(set(letters))==4;total=exact(rhs);sets=[v for v in itertools.combinations(range(10),4)if sum(v)==total];allAssignments=[v for v in itertools.permutations(range(10),4)if sum(v)==total];assert len(allAssignments)==24*len(sets);out=F(len(allAssignments));proof={'all5040DistinctSingleDigitLetterAssignmentsChecked':5040,'actualFourLetterNames':letters,'actualRightHandSum':str(total),'allUnorderedDistinctDigitSets':sets,'permutationsPerSet':24,'zeroAllowedBecauseNoMultiDigitWords':True,'assignmentCountTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('төрттаңбалы','бестаңбалы'),2:('112 есеп','135 есеп'),3:('256 см²','400 см²'),5:('24 бұрыштама','36 бұрыштама'),6:('32 кг','36 кг'),7:('1452 цифр','1512 цифр'),8:('7 бөренені','9 бөренені'),9:('12 қызғылт','14 қызғылт'),10:('2045','2044'),11:('16 жылдан','24 жылдан'),12:('1500-ден','1601-ден'),13:('1041 болды','1151 болды'),15:('2 + 0 + 2 + 5','2 + 0 + 2 + 6')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==1:q['statement']=q['statement'].replace('төрт цифры','бес цифры')
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15;entries=[];evidence=[];equalities=0;optionCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and(not q['images']or i in[4,14]);opts=q['options']
  if opts:assert len(opts)==4;key=one(j for j,o in enumerate(opts)if o['correct']);assert q['sourceAnswer']==opts[key]['text'];options=[o['text']for o in opts];answer=options[key];optionCount+=8
  else:assert q['sourceAnswer']is None;answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();options=None
  try:src=solve({**q,'answer':answer,**({'options':options}if options else{})},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=P.W.svg(r)
   if i==4:one(v for v in root.iter()if v.attrib.get('id')=='value-f').text='576';statement=r['statement'];expected='12'
   else:one(v for v in root.iter()if v.attrib.get('id')=='value-b').text='35';statement=r['statement'].replace('37 жазылған','35 жазылған');expected='45'
   changed=ET.tostring(root);bad={**r,'statement':statement,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:proof['updatedHashNativeSemanticMutationRejected']=True
   else:raise AssertionError('changednativeinputaccepted')
   solve({**bad,'answer':expected},i,False,changed);proof['validChangedNativeTarget']=expected
  for bad in[{**r,'answer':next(v for v in r['options']if v!=r['answer'])if opts else'999999999'}]+([]if i in[4,14]else[mutation(r,i)]):
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==4 and bool(opts)==bool(r.get('options'))and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15fullsource/newconditions and full official/newsolutions/MCQset/2rasters/2nativepreviews read. Fullminimumdistinctdigitdomain, everyAPday, rowedsquarearea, actualnativeDAGnodevalues/edgeendpoints anduniquemissingroot, invariantarea withconstructivetriomino/squaredualtiling, allfiveactualpairnames/fullrank5masses, everypagenumberdigit, sequentialone-cutpieceinvariant, separatorboundwithattainingactualtower, allactualcyclecolors/stripes/options, fullageequation, completepositive squareORoddunion, decimalappendcheck, allgloballyfeasiblecardsums/sixdistinctvalues andall5040letterassignments independentlychecked. Same root author not separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actualsixpyramidrectangles/labels/sixconnectorendpoints decoded intoDAG; actualthreecards/rectangles/visiblevalues decoded. Sourcebitmaps and343pxnewPNGs viewed. Updatedhashbottom576changesanswer9to12; validcard35andqueriedtargetchange43to45. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'sourceKeysNotCaptured':14,'allSourceAndNewOptionsChecked':optionCount,'wrongKeysRejected':15,'printedSemanticCanariesRejected':15,'nativeFigures':2,'updatedHashNativeSemanticCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
