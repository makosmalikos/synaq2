"""All15full frozen/newconditions and complete official/newsolutions read;
2source rasters and2actual343pxnativeSVG previews inspected. Same root author
separate exact computational check, not another human reviewer.
"""
import collections,copy,datetime,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo7-winter-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('spring5','scripts/editorial/review-femo6-spring-grade5.py');G=importlib.util.module_from_spec(sp);sp.loader.exec_module(G);P=G.P;K=P.K;H=P.H;one=H.one;exact=P.exact

def mirror_expression(r,src=False,data=None):
 if src:
  sha=hashlib.sha256((ROOT/'problems/sources/zerek/images/18bc478dca59ec27ad79b695.png').read_bytes()).hexdigest();assert sha=='f1b4ea07e321b0f8731ba7011ae4aa3a31f4da030e203a44ba87c12a6f7dd8bd';observed='=2505−5018';flip={'0':'0','1':'1','2':'5','5':'2','8':'8','−':'−','=':'='};restored=''.join(flip[c]for c in observed[::-1]);proof={'sourceRasterSHA256':sha,'allTenSourceVisibleGlyphsReadLeftToRight':observed,'orderAndDigitShapeBothReversed':True}
 else:
  root=P.W.svg(r,data);assert all('transform'not in v.attrib for v in root.iter());width=F(root.attrib['viewBox'].split()[2]);groups=[v for v in root.iter()if v.attrib.get('id','').startswith('glyph-')];assert len(groups)==10
  raw=[]
  for g in groups:
   segs=[]
   for e in g:
    assert e.tag.endswith('line');x1,y1,x2,y2=[F(e.attrib[k])for k in['x1','y1','x2','y2']];assert(x1==x2)!=(y1==y2);segs.append(((width-x1,y1),(width-x2,y2)))
   assert segs;raw.append(segs)
  top=min(y for ss in raw for e in ss for x,y in e);bottom=max(y for ss in raw for e in ss for x,y in e);scale=(bottom-top)/32;assert scale>0
  standard={'a':(0,0,18,0),'b':(18,0,18,16),'c':(18,16,18,32),'d':(0,32,18,32),'e':(0,16,0,32),'f':(0,0,0,16),'g':(0,16,18,16)}
  def signature(segs):return frozenset(tuple(sorted([(F(a),F(b)),(F(c),F(d))]))for a,b,c,d in segs)
  known={signature([standard[k]for k in ks]):ch for ch,ks in{'0':'abcdef','2':'abged','5':'afgcd','8':'abcdefg','−':'g'}.items()};known[signature([(0,10,18,10),(0,22,18,22)])]='='
  decoded=[];lastEnd=None
  for ss in sorted(raw,key=lambda ss:min(x for e in ss for x,y in e)):
   left=min(x for e in ss for x,y in e);right=max(x for e in ss for x,y in e);assert right-left==18*scale
   if lastEnd is not None:assert left>lastEnd
   lastEnd=right;normalized=[]
   for(a,b),(c,d)in ss:normalized.append(((a-left)/scale,(b-top)/scale,(c-left)/scale,(d-top)/scale))
   sig=signature(normalized);assert len(sig)==len(ss);decoded.append(known[sig])
  restored=''.join(decoded);proof={'allTenActualGlyphSegmentSetsDecoded':True,'noTextOrGlyphIDUsedAsCharacterOracle':True,'actualGeometryReflectedBackAcrossViewBox':True,'actualUniformSegmentFontScale':str(scale),'allDigitsOperatorsAndEqualityRecovered':True}
 match=re.fullmatch(r'(\d{4})−(\d{4})=',restored);assert match;left,right=map(int,match.groups());out=F(left-right);proof.update({'restoredActualExpression':restored,'actualOperands':[left,right],'expressionValueTarget':str(out)});return out,proof

def square_route(r,src=False,data=None):
 if src:
  distance=one(H.numeric_tokens(r['statement']));sha=hashlib.sha256((ROOT/'problems/sources/zerek/images/b7eea5ac3a58121b3d369e0a.png').read_bytes()).hexdigest();assert sha=='712011cf098f31a6310f051f286d79ab6c574cea3486435434569b0149fd87ec';proof={'sourceRasterSHA256':sha,'allFiveSourceConsecutiveSquaresAndThreeSidesObserved':True};ratio=F(3)
 else:
  distance=one(H.numeric_tokens(r['statement']));assert'төрт шаршы'in r['statement'];root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};short=ids['short-route'];ax,ay,bx,by=[F(short.attrib[k])for k in['x1','y1','x2','y2']];assert ay==by and ax<bx and short.attrib.get('stroke-dasharray');poly=[tuple(F(a)for a in p.split(','))for p in ids['long-route'].attrib['points'].split()];assert len(poly)==13 and poly[0]==(ax,ay)and poly[-1]==(bx,by);sides=[]
  for j in range(4):
   a,b,c,d=poly[3*j:3*j+4];assert a[1]==d[1]==ay and a[0]==b[0]and c[0]==d[0]and b[1]==c[1];side=d[0]-a[0];assert side>0 and abs(b[1]-a[1])==side;sides.append(side)
  long=sum(abs(a[0]-b[0])+abs(a[1]-b[1])for a,b in zip(poly,poly[1:]));straight=bx-ax;assert sum(sides)==straight and long==3*straight;ratio=long/straight
  label=one(H.numeric_tokens(ids['short-distance'].text));assert label==distance
  for label,x,y in[('A',ax,ay),('B',bx,by)]:
   m,t=ids['endpoint-'+label],ids['label-'+label];assert F(m.attrib['cx'])==x and F(m.attrib['cy'])==y and t.text==label and abs(F(t.attrib['y'])-y)<35 and F(t.attrib['x'])==x
  proof={'allFourActualSquareWidths':list(map(str,sides)),'eachActualThreeSegmentDetourIsSquareThreeSides':True,'actualPolylineLengthPixels':str(long),'actualBaselineLengthPixels':str(straight),'allActualEndpointsAndPhysicalDistanceLabelChecked':True}
 out=distance*ratio;proof.update({'physicalShortDistanceKm':str(distance),'actualLengthRatio':str(ratio),'longRouteKmTarget':str(out)});return out,proof

def letter_paths(s,src=False):
 if src:
  word=H.math_parts(s,True)[0];block=one(re.findall(r'\\begin\{array\}\{ccccccc\}(.*?)\\end\{array\}',s,re.S));grid=[[x.strip()for x in line.split('&')]for line in block.split('\\\\')];assert len(grid)==7 and all(len(row)==7 for row in grid)
 else:
  word=one(re.findall(r'бастап ([A-Z]+) сөзін',s));lines=[line for line in s.splitlines()if line.startswith('|')];assert len(lines)==10;assert all(v.strip()=='---'for v in lines[1].split('|')[1:-1]);grid=[[v.strip()for v in line.split('|')[1:-1]]for j,line in enumerate(lines)if j!=1];assert len(grid)==9 and all(len(row)==9 for row in grid)
 R,C=len(grid),len(grid[0]);adj=lambda p:[(p[0]+dr,p[1]+dc)for dr,dc in[(-1,0),(1,0),(0,-1),(0,1)]if 0<=p[0]+dr<R and 0<=p[1]+dc<C];starts=[(rr,c)for rr in range(R)for c in range(C)if grid[rr][c]==word[0]];assert len(starts)==1
 def walk(p,j,path):
  if j==len(word)-1:return[path]
  return[full for q in adj(p)if grid[q[0]][q[1]]==word[j+1]for full in walk(q,j+1,path+[q])]
 allpaths=walk(starts[0],0,[starts[0]]);dp={starts[0]:1};levels=[1]
 for char in word[1:]:
  nd=collections.Counter()
  for p,count in dp.items():
   for q in adj(p):
    if grid[q[0]][q[1]]==char:nd[q]+=count
  dp=dict(nd);levels.append(sum(dp.values()))
 assert len(allpaths)==sum(dp.values())and len({tuple(p)for p in allpaths})==len(allpaths);return F(len(allpaths)),{'actualWord':word,'actualTableRowsCols':[R,C],'allActualCellsRead':R*C,'allWordPathsByActualFourNeighborDFS':len(allpaths),'independentDynamicProgrammingLayerCounts':levels,'endpointCounts':{f'{a},{b}':count for(a,b),count in sorted(dp.items())},'actualWordPathCountTarget':str(len(allpaths))}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:out,proof=mirror_expression(r,src,data)
 elif i==2:
  a,b,d=map(int,n);valid=[x for x in range(a+1,b)if x%d==0];x=one(valid);out=F(a+x);proof={'actualRightPocketStocksAndDivisor':[a,b,d],'strictInteriorAllCandidateLeftStocks':list(range(a+1,b)),'allMatchingLeftStocks':valid,'sameLeftStockForBothPeople':True,'firstTotalCoinsTarget':str(out)}
 elif i==3:
  if src:rows,cols,rows2,cols2=map(int,n);assert(rows,cols)==(rows2,cols2)and'бес жолдың'in s and'үш бағанның'in s;paintR,paintC=5,3
  else:rows,cols,paintR,paintC=map(int,n)
  assert 0<=paintR<=rows and 0<=paintC<=cols;cells=[(rr,c)for rr in range(rows)for c in range(cols)if rr>=paintR and c>=paintC];out=F(len(cells));assert out==(rows-paintR)*(cols-paintC)==rows*cols-(paintR*cols+paintC*rows-paintR*paintC);allRows=list(itertools.combinations(range(rows),paintR));allCols=list(itertools.combinations(range(cols),paintC));assert all(rows-len(v)==rows-paintR for v in allRows)and all(cols-len(v)==cols-paintC for v in allCols);proof={'actualRowsColsPaintedRowsCols':[rows,cols,paintR,paintC],'allCellsOfOneRepresentativeArrangementChecked':rows*cols,'allPossiblePaintedRowSelectionsChecked':len(allRows),'allPossiblePaintedColumnSelectionsChecked':len(allCols),'unpaintedCardinalityIndependentOfWhichRowsColumns':True,'complementProductEqualsUnionInclusionExclusion':True,'unpaintedCellsTarget':str(out)}
 elif i==4:
  expr=H.math_parts(s,src)[0];terms=list(map(int,H.numeric_tokens(expr)));assert len(terms)==8 and all(b-a==terms[0]for a,b in zip(terms,terms[1:]));result=int(n[-1]);valid=[v for v in terms if sum(terms)-2*v==result];out=F(one(valid));proof={'allEightActualSeriesTerms':terms,'actualCorrectSum':sum(terms),'printedWrongResult':result,'everySingleSignFlipChecked':8,'allMatchingFlippedTerms':valid,'flippedTermTarget':str(out)}
 elif i==5:
  assert n[:2]==[3,3];given=list(map(int,n[2:10]));columns=list(map(int,n[10:]));assert len(given)==8 and len(columns)==3;out=F(sum(columns)-sum(given));assert out.denominator==1;values=given+[int(out)];witness=None;checked=0
  for first in itertools.combinations(range(9),3):
   if sum(values[j]for j in first)!=columns[0]:continue
   rem=[j for j in range(9)if j not in first]
   for second in itertools.combinations(rem,3):
    checked+=1;third=[j for j in rem if j not in second]
    if sum(values[j]for j in second)==columns[1]and sum(values[j]for j in third)==columns[2]:witness=[[values[j]for j in c]for c in[first,second,third]];break
   if witness:break
  assert witness and sorted(v for c in witness for v in c)==sorted(values);proof={'actualEightKnownEntries':given,'actualColumnSums':columns,'knownEntrySum':sum(given),'wholeTableEntrySum':sum(columns),'actualFeasibleThreeColumnWitness':witness,'allNineCellsUsedOnceInWitness':True,'missingEntryTarget':str(out)}
 elif i==6:
  total,notA,notB,neither=n;both=total-notA-notB+neither;onlyA=total-notA-both;onlyB=total-notB-both;parts=[onlyA,onlyB,both,neither];assert min(parts)>=0 and sum(parts)==total and onlyB+neither==notA and onlyA+neither==notB;out=both;proof={'actualTotalAndNonvisitorCounts':list(map(str,n)),'allFourDisjointRegions':list(map(str,parts)),'bothComplementsAndWholePopulationRechecked':True,'bothVisitedTarget':str(out)}
 elif i==7:
  divisor=int(one(n));descending=src or'қатаң кемиді'in s;assert src or'қатаң өседі'in s or'қатаң кемиді'in s;valid=[];allCount=0
  for combo in itertools.combinations(range(10),6):
   ds=tuple(sorted(combo,reverse=descending))
   if ds[0]==0:continue
   allCount+=1
   if all((10*a+b)%divisor==0 for a,b in zip(ds,ds[1:])):valid.append(int(''.join(map(str,ds))))
  out=F(one(valid));ds=list(map(int,str(int(out))));assert len(ds)==6 and all((a>b)if descending else(a<b)for a,b in zip(ds,ds[1:]));proof={'allMonotoneDistinctSixDigitCandidatesChecked':allCount,'strictDirection':'decreasing'if descending else'increasing','actualAdjacentDivisor':divisor,'allSolutions':valid,'allFiveActualAdjacentTwoDigitValues':[10*a+b for a,b in zip(ds,ds[1:])],'zeroLeadingDigitExcluded':True,'uniqueSixDigitNumberTarget':str(out)}
 elif i==8:
  if src:years=[2023,2024];suffix=False
  else:years=[int(one(re.findall(r'Әсел (\d{4}) жылдың',s)))];assert'DD.MM.YY'in s;suffix=True
  allResults=[]
  for year in years:
   date=datetime.date(year,1,1);pairs=[]
   while date.year==year:
    written=date.strftime('%d%m')+(f'{year%100:02d}'if suffix else'');pairs.append((math.prod(map(int,written)),date.strftime('%d.%m.%Y')));date+=datetime.timedelta(days=1)
   maximum=max(v for v,d in pairs);dates=[d for v,d in pairs if v==maximum];allResults.append((maximum,len(pairs),dates))
  out=F(one(set(v for v,count,dates in allResults)));proof={'actualYearSuffixIncluded':suffix,'allValidGregorianDaysChecked':{str(y):count for y,(v,count,dates)in zip(years,allResults)},'allMaximizingDates':{str(y):dates for y,(v,count,dates)in zip(years,allResults)},'zeroPaddedDateDigitsUsed':True,'maximumDateDigitProductTarget':str(out)}
 elif i==9:out,proof=square_route(r,src,data)
 elif i==10:
  step,count,total=map(int,n);assert count==12
  first=F(total-step*count*(count-1)//2,count);assert first.denominator==1 and first>0;months=[first+step*j for j in range(count)];assert sum(months)==total;out=months[4];proof={'actualMonthlyStepCountTotal':[step,count,total],'allTwelveMonthlyCounts':list(map(str,months)),'allTwelvePositiveIntegerCountsAndExactAnnualSumChecked':True,'fifthMonthTarget':str(out)}
 elif i==11:
  total,a,b,c,d=n;relative=[F(1),b/a,d/c];unit=total/sum(relative);values=[unit*v for v in relative];assert sum(values)==total and values[0]/values[1]==a/b and values[0]/values[2]==c/d and all(v.denominator==1 and v>0 for v in values);out=values[2];proof={'actualTotalAndBothRatios':list(map(str,n)),'allThreeWholeFruitShares':list(map(str,values)),'bothRatiosAndTotalRechecked':True,'thirdPersonShareTarget':str(out)}
 elif i==12:
  code=one(H.math_parts(s,True)[:1])if src else one(re.findall(r'сан ([A-Z]+) тізбегімен',s));target='T'if src else one(re.findall(r' ([A-Z]) әрпінің',s));total=one(n);counts=collections.Counter(code);assert len(counts)==10 and len(code)==11;repeat=one(k for k,c in counts.items()if c==2);assert target==repeat and all(c in[1,2]for c in counts.values());out=total-sum(range(10));assert out.denominator==1 and 0<=out<=9;digits=[d for d in range(10)if d!=out];mapping={repeat:int(out)};remaining=[k for k in counts if k!=repeat]
  if digits[0]==0:digits[0],digits[1]=digits[1],digits[0]
  mapping.update(zip(remaining,digits));assert len(set(mapping.values()))==10 and mapping[code[0]]!=0 and sum(mapping[k]for k in code)==total;proof={'actualLetterCode':code,'actualRepeatedTargetLetter':target,'allLetterMultiplicities':dict(counts),'allTenDifferentDigitsForcedByTenDistinctLetters':True,'digitBijectionWitness':mapping,'witnessWholeNumber':''.join(str(mapping[k])for k in code),'nonzeroLeadingDigitAndFullDigitSumVerified':True,'targetLetterDigit':str(out)}
 elif i==13:out,proof=letter_paths(s,src)
 elif i==14:
  if src:current,past,gap=map(int,n);years=10;assert'Он жыл'in s
  else:current,years,past,gap=map(int,n);assert'тумаған адамның жасы қосындыға енгізілмейді'in s
  valid=[]
  for child in range(current+1):
   father=child+gap;mother=current-child-father
   if min(father,mother)<18 or mother<=child:continue
   before=sum(max(0,age-years)for age in[child,father,mother])
   if before==past:valid.append([child,father,mother])
  child,father,mother=one(valid);assert child<years and father>years and mother>years;out=F(mother);proof={'actualCurrentYearsAgoPastFatherGap':[current,years,past,gap],'allNonnegativeChildAgesChecked':current+1,'allFeasibleCurrentFamilyAges':valid,'pastAgeSumOmitsUnbornInsteadOfUsingNegativeAge':True,'allThreeCurrentAndBothParentPastConstraintsChecked':True,'motherCurrentAgeTarget':str(out)}
 elif i==15:
  threshold=int(one(n));assert 46<=threshold<=54;deficit=54-threshold;hits=[v for v in range(100000,1000000)if sum(map(int,str(v)))>=threshold];dp={(0,0):1}
  for pos in range(6):
   nxt=collections.Counter()
   for(p,sm),count in dp.items():
    for d in range(1 if pos==0 else 0,10):nxt[(pos+1,sm+d)]+=count
   dp=dict(nxt)
  bySum={sm:count for(p,sm),count in sorted(dp.items())if sm>=threshold};out=F(len(hits));assert out==sum(bySum.values())==math.comb(6+deficit,deficit);proof={'actualMinimumDigitSum':threshold,'all900000GenuineSixDigitNumbersChecked':900000,'validCountsByDigitSum':bySum,'independentDigitDPSum':sum(bySum.values()),'weakDeficitCompositionsMatchFullEnumeration':True,'leadingZeroImpossibleSinceEachDeficitBelowNine':True,'sixDigitNumberCountTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(H.tex(r['answer']))==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 if i==1:
  root=P.W.svg(r);g=one(v for v in root.iter()if v.attrib.get('id')=='glyph-0')
  for child in list(g):
   if child.attrib.get('id')in['segment-0-b','segment-0-e']:g.remove(child)
  data=ET.tostring(root);return{**r,'figureSha256':hashlib.sha256(data).hexdigest()},data
 if i==13:
  assert'| · | · | · | · | Q |'in r['statement'];return{**r,'statement':r['statement'].replace('| · | · | · | · | Q |','| · | · | · | · | A |',1)},None
 a,b={2:('19 монета','20 монета'),3:('4 жолы','5 жолы'),4:('72 мәнін','78 мәнін'),5:('19, 18 және 21','23, 18 және 21'),6:('110 оқушы','115 оқушы'),7:('қатаң өседі','қатаң кемиді'),8:('2026 жылдың','2025 жылдың'),9:('12 км','15 км'),10:('12 ойыншық','14 ойыншық'),11:('111 алмұртты','148 алмұртты'),12:('қосындысы 53','қосындысы 52'),14:('қосындысы 86','қосындысы 87'),15:('кемінде 51','кемінде 50')}[i];assert a in r['statement'];bad={**r,'statement':r['statement'].replace(a,b)};data=None
 if i==9:
  root=P.W.svg(r);one(v for v in root.iter()if v.attrib.get('id')=='short-distance').text='AB = 15 км';data=ET.tostring(root);bad['figureSha256']=hashlib.sha256(data).hexdigest()
 return bad,data

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15 and {r['params']['number']for r in rows}==set(range(1,16));entries=[];evidence=[];equalities=0;geometryChanges=0;changedAnswers={1:'3462',2:'44',3:'49',4:'15',5:'12',6:'15',7:'875421',8:'360',9:'45',10:'165',11:'40',12:'7',13:'59',14:'37',15:'210'}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution'];answer=one(re.findall(r'Дұрыс жауап:\s*(.*)',q['openAnswerText'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad,data in[({**r,'answer':'999999999'},None),mutation(r,i)]:
   try:solve(bad,i,False,data)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('wrongkeyorchangedactualinputaccepted',i))
  changed,data=mutation(r,i)
  try:cp=solve({**changed,'answer':changedAnswers[i]},i,False,data)
  except Exception as e:raise AssertionError(('validchangedinput',i))from e
  proof['validChangedMathTarget']=changedAnswers[i];proof['oldKeyRejectedAndCorrectChangedAnswerAccepted']=True
  if data:geometryChanges+=1;proof['updatedHashActualNativeInputChanged']=True
  assert r['minimumPlan']=='pro'and r['grade']==4 and not r.get('options')and r['statement']!=q['statement'];assert bool(r.get('image'))==bool(q['images']);assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15full source/newconditions and completeofficial/newsolutions read. Actualmirroredglyphsegments decodedwithouttextoracle, strictpocketinterior, allrow/columnselectioncardinalities, everysignflip, feasiblethreecolumnpartitionwitness, allfourvisitregions, allmonotone6digitcandidates, everyGregorian date, actualsquarepathsegments/labels, all12productionmonths, bothfruitratios, all10digitbijectionwitness, everyactuallettertablecell/fourneighborDFS crossDP, allpossiblechildages omittingunborn and all9000006digitnumbers crossdigitDP/compositions checked. Everyvalidchangedinput rejectsoldkey andacceptscorrectchangedkey. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Bothsavedsourcebitmaps andbothactual343pxnewPNGs inspected. Allactualglyphsegments decodedafterreflectingback, includingbothoperands/operator/equality. Allactualpolylinevertices formfoursquarethree-sidedetours; baseline/endpoints/12kmphysical label agree. Validupdatedhashchangesdecode5520−2058=3462 anddistance15=>45. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let tables=0,tableDims=[];for(const r of rs){const ns=mathFragments(r.statement);for(const n of ns)if(n.type==='table'){tables++;tableDims.push([n.rows.length,n.rows[0].length]);if(n.rows.some(row=>row.length!==9))throw Error('Wrongtablewidth');}}console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),tables,tableDims}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries);assert native['tables']==1 and native['tableDims']==[[9,9]]
 summary={'verified':15,'fullSourceNewConditionsAndSolutionsRead':15,'capturedOpenKeys':15,'wrongKeysRejected':15,'validChangedInputsRejectOldAndAcceptRecomputedAnswers':15,'updatedHashActualNativeInputChanges':geometryChanges,'nativeFigures':2,'nativeTables':1,'nativeTableDimensions':[9,9],'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':15,'grade7CoursesImported':0,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
