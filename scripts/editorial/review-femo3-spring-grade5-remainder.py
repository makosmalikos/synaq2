"""All8full pending frozen/new conditions and full official/newsolutions plus
sourcearea raster and343pxnewnativeSVG read. Same root author separate exact
computation, not a separatehumanreviewer. Three existing modelIDs retained.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo3-spring-grade5-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
spec=importlib.util.spec_from_file_location('spring4',ROOT/'scripts/editorial/review-femo2-spring-grade4-remainder.py');P=importlib.util.module_from_spec(spec);spec.loader.exec_module(P);K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def svg(r,data=None):return P.W.svg(r,data)
def actual_areas(r,data=None):
 root=svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('cell-')];assert len(rects)==4 and all(w>0 and h>0 for x,y,w,h in rects);xs=sorted({x for x,y,w,h in rects}|{x+w for x,y,w,h in rects});ys=sorted({y for x,y,w,h in rects}|{y+h for x,y,w,h in rects});assert len(xs)==len(ys)==3;expected={(xs[c],ys[rr],xs[c+1]-xs[c],ys[rr+1]-ys[rr])for rr in range(2)for c in range(2)};assert set(rects)==expected;known={};unknown=[];labelCells=set()
 for id,v in ids.items():
  if id.startswith('area-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);rect=one(rect for rect in rects if rect[0]<x<rect[0]+rect[2]and rect[1]<y<rect[1]+rect[3]);assert rect not in labelCells;labelCells.add(rect);cell=(ys.index(rect[1]),xs.index(rect[0]));value=v.text
   if value=='?':unknown.append((rect,cell))
   else:known[cell]=(F(value),rect);assert F(value)>0
 assert len(labelCells)==4 and len(known)==3;rect,cell=one(unknown);scales={w*h/value for value,(x,y,w,h)in known.values()};scale=one(scales);out=rect[2]*rect[3]/scale;opposite=(1-cell[0],1-cell[1]);others=[v[0]for c,v in known.items()if c!=opposite];formula=math.prod(others)/known[opposite][0];assert formula==out;return out,{'actualKnownCells':{str(k):str(v[0])for k,v in known.items()},'actualUnknownRowColumn':list(cell),'allFourRectanglesExactlyFillTwoByTwoGrid':True,'oneCommonPixelsSquaredPerCmSquared':str(scale),'oppositeProductsAgreeWithActualGeometry':True,'targetArea':str(out)}

def circle(n):
 assert n>=3;mask=(1<<n)-1;valid=[]
 for bits in range(1,1<<n):
  left=((bits<<1)&mask)|(bits>>(n-1));right=(bits>>1)|((bits&1)<<(n-1));truth=left^right
  if truth==bits:valid.append(bits)
 counts=sorted({b.bit_count()for b in valid});out=one(counts);assert n%3==0 and out==2*n//3;assert len(valid)==3
 return F(out),{'allLabeledCircularAssignmentsChecked':1<<n,'allLiarAssignmentExplicitlyExcluded':True,'allConsistentNonzeroKnightBitmasks':valid,'everySpeakerTruthEqualsActualKnightStatus':True,'uniqueKnightCounts':counts,'knightCountTarget':out}

def parity_minimum(total,k):
 assert 1<k<=total;cases=[]
 for odd in range(1,k,2):
  evens=total-odd;values=list(range(1,2*odd,2))+list(range(2,2*evens+1,2));assert len(values)==len(set(values))==total and sum(values)%2==1;assert odd<k;assert all(any(v%2==0 for v in group)for group in itertools.combinations(values,k));cases.append({'oddCount':odd,'evenCount':evens,'minimalDistinctPositiveValues':values,'sum':sum(values),'allKProductsEven':True})
 out=min(c['sum']for c in cases);return F(out),{'allPossibleOddCountsForOddSum':list(range(1,k,2)),'anyKProductEvenForcesFewerThanKOdds':True,'everyParityCountLowerBoundAttained':cases,'componentwiseDistinctPositiveParityLowerBounds':True,'minimumSumTarget':out}

def gaussian(rows,variables):
 a=[list(map(F,row))for row in rows];pivots=[];at=0
 for c in range(variables):
  p=next((j for j in range(at,len(a))if a[j][c]),None)
  if p is None:continue
  a[at],a[p]=a[p],a[at];v=a[at][c];a[at]=[x/v for x in a[at]]
  for j in range(len(a)):
   if j!=at and a[j][c]:v=a[j][c];a[j]=[x-v*y for x,y in zip(a[j],a[at])]
  pivots.append(c);at+=1
 assert all(any(row[:variables])or row[-1]==0 for row in a);assert len(pivots)==variables;result=[F(0)]*variables
 for j,c in enumerate(pivots):result[c]=a[j][-1]
 assert all(sum(row[j]*result[j]for j in range(variables))==row[-1]for row in rows);return result,len(pivots)

def read_magic(s,src):
 if src:
  content=one(re.findall(r'\\begin\{array\}\{[^\n]*?\}(.*?)\\end\{array\}',s,re.S));lines=re.split(r'\\\\',content);table=[]
  for line in lines:
   line=line.replace('\\hline','').strip()
   if not line:continue
   cells=[]
   for value in line.split('&'):
    value=re.sub(r'\\phantom\{[^}]*\}','?',value).strip();cells.append(value)
   table.append(cells)
 else:table=[[v.strip()for v in line.strip()[1:-1].split('|')]for line in s.splitlines()if line.strip().startswith('|')and'---'not in line]
 assert len(table)==3 and all(len(row)==3 for row in table);return table

def magic(s,src):
 table=read_magic(s,src);flat=sum(table,[]);target=one(j for j,v in enumerate(flat)if v=='F');givens={j:F(v)for j,v in enumerate(flat)if v not in['F','?']};assert len(givens)==3;lines=[[3*r+c for c in range(3)]for r in range(3)]+[[3*r+c for r in range(3)]for c in range(3)]+[[0,4,8],[2,4,6]];equations=[]
 for line in lines:
  row=[F(j in line)for j in range(9)]+[F(-1),F(0)];equations.append(row)
 for j,v in givens.items():row=[F(i==j)for i in range(10)]+[v];equations.append(row)
 solution,rank=gaussian(equations,10);assert all(sum(solution[j]for j in line)==solution[9]for line in lines);assert all(solution[j]==v for j,v in givens.items());out=solution[target];return out,{'allElevenFullLinearConstraints':len(equations),'rankForNineCellsAndCommonSum':rank,'uniqueFullMagicGrid':[[str(solution[3*r+c])for c in range(3)]for r in range(3)],'allEightRowColumnDiagonalSums':[str(sum(solution[j]for j in line))for line in lines],'actualPrintedKnownCells':{str(j):str(v)for j,v in givens.items()},'targetF':str(out)}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  lower=100 if src else int(one(n));candidates=[x for x in range(100,1000)if 100<=math.prod(map(int,str(x)))<=999 and math.prod(map(int,str(x)))>=lower];out=F(min(candidates));proof={'all900ThreeDigitNumbersChecked':900,'digitProductLowerBound':lower,'smallestTarget':str(out),'digitProductAtMinimum':math.prod(map(int,str(int(out)))),'numberOfValidCandidates':len(candidates),'repeatedDigitsRemainAllowed':True}
 elif i==2:
  if src:
   assert n==[4,42,45,63];out=F(42*45,63);sha='200825069afa94fb4544838f205ae477ac8126d7f5cb7eb93441ee1b66e2aa96';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/3262c3cec9776ec339ebdad8.png').read_bytes()).hexdigest()==sha;proof={'observedKnownAreasTLBLBR':[42,63,45],'observedUnknownTopRight':True,'oppositeProductInvariant':42*45==63*out,'sourceRasterSHA256':sha,'targetArea':str(out)}
  else:out,proof=actual_areas(r,data)
 elif i==3:
  assert len(n)==4;total=sum(n)/3;ages=[total-v for v in n];assert min(ages)>0 and all(v.denominator==1 for v in ages);assert sorted(sum(group)for group in itertools.combinations(ages,3))==sorted(n);out=max(ages)-min(ages);proof={'allFourThreePersonSumsRead':list(map(str,n)),'wholeAgeSum':str(total),'allFourAges':list(map(str,ages)),'allFourTripleSumsMatchedWithMultiplicity':True,'extremeDifferenceTarget':str(out)}
 elif i==5:
  if src:assert'үштен екісі'in s and'жартысы'in s and'Төрт оқушы'in s;fractionA,fractionB,both=F(2,3),F(1,2),F(4)
  else:
   fs=re.findall(r'\(\d+/\d+\)',s);assert len(fs)==2;fractionA,fractionB=map(exact,fs);remaining=s
   for part in fs:remaining=remaining.replace(part,'',1)
   both=one(H.numeric_tokens(remaining))
  assert 0<fractionA<1 and 0<fractionB<1;intersectionFraction=fractionA+fractionB-1;assert 0<intersectionFraction<=min(fractionA,fractionB);out=both/intersectionFraction;clubA,clubB=out*fractionA,out*fractionB;assert all(v.denominator==1 for v in[out,clubA,clubB,both])and clubA+clubB-both==out;proof={'wholeCoveredByTwoClubs':True,'fractions':list(map(str,[fractionA,fractionB])),'knownIntersection':str(both),'clubCounts':list(map(str,[clubA,clubB])),'intersectionFraction':str(intersectionFraction),'wholeGroupTarget':str(out)}
 elif i==6:out,proof=circle(int(one(n)))
 elif i==7:
  if src:values=list(map(int,n[:-1]));mean=n[-1];assert values==list(range(1,11))and'үш түрлі сан'in s
  else:low,high,mean=n;assert low.denominator==high.denominator==1;values=list(range(int(low),int(high)+1));assert'Шеткі мәндерді де таңдауға болады'in s
  alltriples=list(itertools.combinations(values,3));valid=[v for v in alltriples if sum(v)==3*mean];out=F(len(valid));proof={'allAvailableIntegers':values,'allUnorderedDistinctTriplesChecked':len(alltriples),'allMatchingTriples':valid,'mean':str(mean),'targetTripleCount':str(out)}
 elif i==8:
  assert len(set(n))==1;total=int(one(set(n)));k=5 if src else 6;assert('бесеуінің'in s)if src else('алтауының'in s);out,proof=parity_minimum(total,k)
 elif i==9:
  out,proof=magic(s,src)
  if not src:
   solutionTable=read_magic(r['solution'],False);assert solutionTable==proof['uniqueFullMagicGrid'];proof['printedFullSolutionGridAllEightLinesChecked']=True
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('150-ден','170-тен'),3:('34, 31','40, 31'),5:('15 бала','10 бала'),6:('18 тұрғын','12 тұрғын'),7:('ортасы 7','ортасы 6'),8:('11 натурал','12 натурал'),9:('| ? | 5 | 16 |','| ? | 5 | 19 |')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==8:q['statement']=q['statement'].replace('барлық 11 санның','барлық 12 санның')
 if i==9:q['solution']=q['solution'].replace('| 4 | 15 | 11 |','| 7 | 21 | 11 |').replace('| 17 | 10 | 3 |','| 17 | 13 | 9 |').replace('| 9 | 5 | 16 |','| 15 | 5 | 19 |')
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution']and(not q['images']or i==2);answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  bads=[{**r,'answer':'9999999'}]
  if i==2:
   root=svg(r)
   for v in root.iter():
    if v.attrib.get('id','').startswith('area-')and v.text!='?':v.text=str(F(v.text)*F(5,4))
   changed=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('updatedhash actualfigure semanticchange accepted')
   solve({**bad,'answer':'60'},i,False,changed);proof['validUpdatedHashFigureAreaChangeTarget']='60';proof['allActualAreaLabelsScaleCanaryRejected']=True
   broken=svg(r);one(v for v in broken.iter()if v.attrib.get('id')=='cell-tl').set('width','73');broken=ET.tostring(broken)
   try:solve({**r,'figureSha256':hashlib.sha256(broken).hexdigest()},i,False,broken)
   except AssertionError:proof['nonRectangularSplitSemanticCanaryRejectedWithUpdatedHash']=True
   else:raise AssertionError('actualgeometrygap accepted')
  else:bads.append(mutation(r,i))
  for bad in bads:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==5 and not r.get('options')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8full frozen/newconditions and complete official/newsolutions plus archivedraster/nativepreview read. All900digitproducts, actualfourarea rectangles/labels with commonscaleand oppositeproduct, alltripleage sums, fractionalclubunion, every circulartruthassignment, allunordered3choices, every possibleoddcount withallKproductwitnesses and unique rank10solution of11magicmatrixconstraints independentlychecked. Three existingmathmodelIDs reused; same root author not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Nativeactualfourrectanglegrid/labelpositions/allknownareaand commonphysicalunits decoded. Archivedsource and343pxnewPNG viewed. Updatedhash labels×5/4 changesanswer48to60; actualrectwidthchange breaksgrid andisrejected. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,tables=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='table'){tables++;for(const row of n.rows)for(const cell of row)walk(cell)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,tables}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceKeysNotCaptured':8,'wrongKeysRejected':8,'printedSemanticCanariesRejected':8,'nativeFractions':native['fractions'],'nativeTables':native['tables'],'nativeFigures':1,'updatedHashFigureSemanticCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'existingModelIdsReused':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
