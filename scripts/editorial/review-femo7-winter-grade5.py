"""Every15frozen/new full condition/full official/new solution read. Source
25cell FEMO table independently decoded, own21cell OYLA SVG/343px preview viewed.
All target quantities checked by exact finite enumeration/DP/strings and ledgers
from printed inputs. Same root author; no separate human/agent reviewer claimed.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo7-winter-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
sp=importlib.util.spec_from_file_location('bil9',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H);one=H.one
nums=lambda s:list(map(int,re.findall(r'-?\d+',H.tex(s))))

def geometry(r,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 340 340'and not re.search(rb'<image|<script|<foreignObject|href=|data:|onload=',raw);board={};expected={(x,y)for y in range(5)for x in range(5)if abs(x-2)+abs(y-2)<=3};groups=root.findall('s:g',NS);assert len(groups)==len(expected)==21
 for group in groups:
  rect=one(group.findall('s:rect',NS));label=one(group.findall('s:text',NS));x=F(rect.attrib['x']);y=F(rect.attrib['y']);col=(x-28)/58;row=(y-28)/58;assert col.denominator==row.denominator==1;col,row=int(col),int(row);assert(col,row)in expected and(col,row)not in board;d=abs(col-2)+abs(row-2);letter='OYLA'[d];assert label.text==letter and rect.attrib['width']==rect.attrib['height']=='52'and rect.attrib['rx']=='10';assert F(label.attrib['x'])==54+58*col and F(label.attrib['y'])==63+58*row and label.attrib['font-size']=='27'and label.attrib['text-anchor']=='middle';assert rect.attrib['fill']=={'O':'#3269e8','Y':'#ece5ff','L':'#e3efff','A':'#def4ed'}[letter];assert label.attrib['fill']==('#ffffff'if d==0 else'#26466a');board[col,row]=letter
 assert set(board)==expected;return board,{'sha256':hashlib.sha256(raw).hexdigest(),'actualCells':21,'letterCounts':dict(collections.Counter(board.values())),'allRectanglesLettersCoordinatesColorsChecked':True}

def word_paths(board,word):
 states=[(p,)for p,c in board.items()if c==word[0]]
 for letter in word[1:]:
  nxt=[]
  for path in states:
   x,y=path[-1]
   for target in((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
    if board.get(target)==letter:nxt.append(path+(target,))
  states=nxt
 assert all(all(abs(x1-x2)+abs(y1-y2)==1 for(x1,y1),(x2,y2)in zip(path,path[1:]))for path in states);return states

def solve(r,i,source=False):
 s=r['statement'];n=nums(s);proof={}
 if i==1:
  target=one(H.math_parts(s,source));values=nums(target);assert all(str(v)=='9'*(j+1)for j,v in enumerate(values));out=sum(values);roundsum=sum(10**(j+1)for j in range(len(values)));assert out==roundsum-len(values);proof={'allActualSummands':values,'roundSum':roundsum,'subtractedOnes':len(values)}
 elif i==2:
  t1,d1,t2,d2,T1=map(F,n);distance=T1*d1/t1;T2=distance*t2/d2;assert T1/t1>0 and distance>0 and T2*d2/t2==distance;out=T2;proof={'actualCommonDistance':str(distance),'firstTimeBatches':str(T1/t1),'secondTimeBatches':str(T2/t2),'secondTime':str(T2)}
 elif i==3:
  counts,target=n[:-1],n[-1];assert len(counts)==5 and max(counts)>=target>0;safe=[min(c,target-1)for c in counts];bound=sum(safe);out=bound+1;assert all(c<target for c in safe)and all(c<=available for c,available in zip(safe,counts));remaining=[k for k,(a,b)in enumerate(zip(counts,safe))if a>b];assert remaining and all(safe[k]+1>=target for k in remaining);states=list(itertools.product(*(range(c+1)for c in counts)));safeStates=[v for v in states if max(v)<target];assert max(map(sum,safeStates))==bound;proof={'allInventoryDrawCountsEnumerated':len(states),'maximumSafeColorCounts':safe,'maximumSafeDrawSize':bound,'colorsRemainingAfterSafeDraw':remaining}
 elif i==4:
  if source:assert all(v in s for v in('үшінші','он сегізінші','сегіз орындық','он бір орындық'));front,back,left,right=3,18,8,11
  else:front,back,left,right=n
  rows=front+back-1;seats=left+right+1;out=rows*seats;assert rows-front+1==back and seats-left-1==right;proof={'rowCount':rows,'seatsEachRow':seats,'bothRanksAndOwnSeatCounted':True}
 elif i==5:
  *sizes,remainder=n;assert len(sizes)==3 and 0<=remainder<min(sizes);multiple=math.lcm(*sizes);candidate=multiple+remainder;valid=[value for value in range(1,candidate+1)if all(value%d==remainder and value//d>=1 for d in sizes)];out=one(valid);proof={'allCandidatesThroughFirstValidChecked':candidate,'positiveLCM':multiple,'atLeastOneWholeBundleEach':True,'remainders':[out%d for d in sizes]}
 elif i==6:
  word=one(re.findall(r'\b[A-Z]{8,}\b',s));target=one(re.findall(r'([A-Z])\$?\s*әрпі',s));counts=collections.Counter(word);assert len(word)==11 and len(counts)==10 and counts[target]==2 and sorted(counts.values())==[1]*9+[2];total=one(n);out=total-sum(range(10));assert 0<=out<=9 and target!=word[0];mapping={target:out};available=[v for v in range(10)if v!=out];lead=next(v for v in available if v);mapping[word[0]]=lead;available.remove(lead)
  for letter in dict.fromkeys(word):
   if letter not in mapping:mapping[letter]=available.pop(0)
  assert set(mapping.values())==set(range(10));encoded=''.join(str(mapping[c])for c in word);assert encoded[0]!='0'and sum(map(int,encoded))==total;proof={'actualLetterCounts':dict(counts),'allTenDigitsSum':45,'consistentLeadingNonzeroAssignment':mapping,'encodedWitness':encoded}
 elif i==7:
  total,bound=n;assert bound==1000;valid=[value for value in range(1,bound)if int(str(value)[0])+int(str(value)[-1])==total];out=len(valid);proof={'all999NaturalNumbersChecked':True,'allMatchingNumbers':valid,'countsByDigitLength':dict(collections.Counter(len(str(v))for v in valid))}
 elif i==8:
  if source:assert'жүз натурал'in s and'елу тақ'in s;N,M=100,50
  else:N=int(one(re.findall(r'алғашқы (\d+) натурал',s)));M=int(one(re.findall(r'алғашқы (\d+) тақ',s)))
  naturals=list(range(1,N+1));odds=list(range(1,2*M,2));out=sum(naturals)-sum(odds);assert len(odds)==M;proof={'firstNaturalSum':sum(naturals),'firstOddSum':sum(odds),'actualOddCount':M,'exactDifference':out}
 elif i==9:
  values=nums(one(H.math_parts(s,source)));assert len(values)==5;differences=[b-a for a,b in zip(values,values[1:])];assert min(differences)>0;ratios=[F(b,a)for a,b in zip(differences,differences[1:])];factor=one(set(ratios));assert factor.denominator==1 and factor>0;delta=differences[-1]*factor;out=values[-1]+delta;proof={'allFirstDifferences':differences,'constantDifferenceMultiplier':str(factor),'nextDifference':str(delta)}
 elif i==10:
  if source:full,remaining=map(F,n);fraction=F(2,3);assert'үштен екісін'in s
  else:full,a,b,remaining=map(F,n);fraction=a/b
  sold=full-remaining;content=sold/fraction;empty=full-content;assert min(sold,content,empty)>0 and empty+(1-fraction)*content==remaining;out=empty;proof={'initialContentsKg':str(content),'removedContentsKg':str(sold),'emptyCrateKg':str(empty),'remainingWeighingVerified':True}
 elif i==11:
  if source:
   block=one(re.findall(r'\\begin\{array\}\{c+\}(.*?)\\end\{array\}',s,re.S));rows=[[c.strip()for c in row.split('&')]for row in re.split(r'\\\\',block)];assert len(rows)==7 and all(len(row)==7 for row in rows);board={(x,y):c for y,row in enumerate(rows)for x,c in enumerate(row)if c};word='FEMO';assert len(board)==25
  else:board,fig=geometry(r);word=one(re.findall(r'([A-Z]{4}) сөзін',s));proof['figure']=fig;assert'Диагональға өтуге болмайды'in s
  paths=word_paths(board,word);out=len(paths);proof.update(actualBoardCellCount=len(board),word=word,allOrthogonalPaths=paths,pathLength=len(word)-1)
 elif i==12:
  last,decrease=n;prefix=F(decrease-last,9);assert 0<=last<=9 and prefix.denominator==1 and prefix>0;out=int(prefix)*10+last;assert int(str(out)[:-1])==prefix and int(str(out)[-1])==last and out-prefix==decrease;proof={'prefixAfterDeletion':str(prefix),'lastDigit':last,'actualNumber':out,'actualDeletionDifference':str(out-prefix)}
 elif i==13:
  assert len(n)==4;total=F(sum(n),3);money=[total-v for v in n];assert all(v>0 for v in money)and sum(money)==total;assert all(sum(money)-money[j]==n[j]for j in range(4));out=money[-1];proof={'totalMoney':str(total),'allFourIndividualAmounts':list(map(str,money)),'allFourComplementSumsChecked':True}
 elif i==14:
  threshold=one(n);digits=6 if source else 5;assert ('алтытаңбалы'if source else'бестаңбалы')in s;dp={0:1}
  for pos in range(digits):
   nxt=collections.Counter()
   for total,ways in dp.items():
    for digit in range(1 if pos==0 else 0,10):nxt[total+digit]+=ways
   dp=nxt
  out=sum(ways for total,ways in dp.items()if total>=threshold);deficit=9*digits-threshold;assert 0<=deficit<=3;valid=[]
  for ds in itertools.product(range(deficit+1),repeat=digits):
   if sum(ds)<=deficit and ds[0]<9:valid.append(int(''.join(str(9-d)for d in ds)))
  assert len(valid)==out and all(sum(map(int,str(v)))>=threshold for v in valid);proof={'fullDigitDPCountsBySum':dict(dp),'allNearMaximumNumbers':sorted(valid),'maximumAllowedDeficit':deficit}
 elif i==15:
  if source:assert'бестіктің'in s;needle='555'
  else:needle=one(re.findall(r'«(\d)\1\1»',s))*3
  end=int(needle);parts=[str(k)for k in range(1,end+1)];sequence=''.join(parts);index=sequence.index(needle);out=index+1;position=0
  for value,piece in enumerate(parts,1):
   if position+len(piece)>index:origin=value;offset=index-position;break
   position+=len(piece)
  assert sum(len(str(k))for k in range(1,origin))+offset+1==out and sequence[:index].find(needle)==-1;proof={'allEarlierConcatenatedCharactersChecked':index,'firstOccurrencePositionOneBased':out,'startingNaturalNumber':origin,'offsetWithinStartingNumber':offset,'firstSubstringContext':sequence[max(0,index-4):index+7]}
 else:raise AssertionError(i)
 assert H.calc(r['answer'])==out,(i,out,r['answer']);proof['answer']=str(out);return proof

def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:(' + 9999999',' + 9999999 + 99999999'),2:('70 минутта','105 минутта'),3:('кемінде 6 фишка','кемінде 7 фишка'),4:('9, оң','10, оң'),5:('дәл 3 гүл','дәл 4 гүл'),6:('қосындысы 53','қосындысы 54'),7:('14 санына','12 санына'),8:('алғашқы 120 натурал','алғашқы 124 натурал'),9:('333;','334;'),10:('массасы 32 кг','массасы 35 кг'),11:('OYLA сөзін','OYLY сөзін'),12:('2437 санына','2446 санына'),13:('5100 теңге','5400 теңге'),14:('кемінде 43','кемінде 42'),15:('«777»','«888»')};a,c=pairs[i];assert a in s,(i,a);b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is None and not q['options']and not q['images']and not q['svg'];answer=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']))
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and'options'not in r and re.fullmatch(r'\d+',r['answer'])and not re.search(r'[\\$]',r['statement']+r['solution'])
  for bad in({**r,'answer':'999999999'},mutation(r,i)):
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',i))
  for m in re.finditer(r'[0-9()+−×÷/\s=]+',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   ss=[s.strip()for s in m[0].split('=')]
   if len(ss)<2 or not all(ss):continue
   try:vs=[H.calc(v)for v in ss]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vs))==1,('printed equality',i,m[0]);equalities+=len(vs)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All15source/new full conditions and full solutions read. Exact finite color states/999digit numbers/LCMfirst candidate/bijective digit cipher/all sums/constant difference ratio/weights/complements/full digit-sum DP and independent deficit vectors/first substring positions checked. Source7x7array and actual new21cellSVG all orthogonal paths enumerated;343px preview viewed. Same root author, not separate human review.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if i==11:
   g=proof['figure'];entry['figureReview']={'status':'verified','sha256':g['sha256'],'method':'Actual21rectangles and letters/color/coordinates, full OYLArook-path enumeration and343px preview inspected; source25cell TeX array separately decoded. Fresh native board, no raster/tracing.'};raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);one(svg.findall("s:g[@id='cell-1-0']/s:text",NS)).text='Y'
   try:geometry(r,ET.tostring(svg))
   except AssertionError:pass
   else:raise AssertionError('Actual SVG letter mutation accepted')
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':15,'allSourceNewConditionsFullSolutionsRead':15,'sourceKeysNotCaptured':15,'wrongKeysRejected':15,'printedSemanticCanariesRejected':15,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':check['fractions'],'originalFigures':1,'sourceAndNativeWordPathsChecked':[28,24],'fullDigitDPAndDeficitEnumerationAgreed':True,'allEarlierConcatenationPositionsChecked':True,'actualSVGLetterMutationRejected':True,'pythonJavaScriptHashesMatched':15,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
