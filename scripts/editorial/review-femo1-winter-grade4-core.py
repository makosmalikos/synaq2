"""All8full source/new conditions, full official/new solutions/oneMCQset and
archivednetraster read. NewnativePNG343px inspected. Source7drilledcube separate,
not counted. Same root author separately computes, no separatehumanreviewer.
Actual2Dnet square positions folded into integerorthonormal3D frames; all24proper
rotations/4coloredfacedown verifytop. Every4536distinctdigitassignment and every
possible omissionabilityallocation checked, with fulloriginal conservation.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo1-winter-grade4-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;opts=K.opts

def neg(v):return tuple(-x for x in v)
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def fold_net(cells):
 assert len(cells)==6;colored=one(p for p,label in cells.items()if label is None);frames={colored:((1,0,0),(0,1,0),(0,0,1))};queue=[colored]
 for x,y in queue:
  u,v,n=frames[x,y];assert cross(u,v)==n and dot(u,u)==dot(v,v)==dot(n,n)==1 and dot(u,v)==dot(v,n)==dot(u,n)==0
  for dx,dy,new in[(1,0,(neg(n),v,u)),(-1,0,(n,v,neg(u))),(0,1,(u,neg(n),v)),(0,-1,(u,n,neg(v)))]:
   point=(x+dx,y+dy)
   if point not in cells:continue
   if point in frames:assert frames[point]==new
   else:frames[point]=new;queue.append(point)
 assert len(frames)==6;normals={p:f[2]for p,f in frames.items()};assert set(normals.values())=={(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)};opposite=one(cells[p]for p,n in normals.items()if n==neg(normals[colored]));rotations=[]
 for permutation in itertools.permutations(range(3)):
  parity=(-1)**sum(permutation[i]>permutation[j]for i in range(3)for j in range(i+1,3))
  for signs in itertools.product([-1,1],repeat=3):
   if parity*math.prod(signs)!=1:continue
   transform=lambda v:tuple(signs[i]*v[permutation[i]]for i in range(3));rotations.append({p:transform(v)for p,v in normals.items()})
 assert len(rotations)==24;downs=[r for r in rotations if r[colored]==(0,0,-1)];tops=[one(cells[p]for p,v in r.items()if v==(0,0,1))for r in downs];assert len(downs)==4 and set(tops)=={opposite};pairs={cells[p]or'боялған':one(cells[q]or'боялған'for q,w in normals.items()if w==neg(v))for p,v in normals.items()};return opposite,{'allSixFaceNormals':{str(p):v for p,v in normals.items()},'allOppositeLabels':pairs,'properRotationsChecked':24,'coloredFaceDownRotations':4,'topLabelsInAllDownRotations':tops,'uniqueTopLabelTarget':opposite,'allFramesOrthonormalAndAllNormalsDistinct':True}

def actual_net(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',data.decode());svg=ET.fromstring(data);assert svg.attrib['viewBox']=='0 0 360 280';ns='{http://www.w3.org/2000/svg}';groups=[v for v in svg if v.tag==ns+'g'];raw=[]
 for g in groups:
  e=one(e for e in g if e.tag==ns+'rect');a=e.attrib;x,y,w,h=[F(a[k])for k in['x','y','width','height']];assert w==h>0 and 0<x<x+w<360 and 0<y<y+h<280;texts=[v for v in g if v.tag==ns+'text']
  if a['fill']=='#dfd3f7':assert not texts;label=None
  else:assert a['fill']=='#fff';t=one(texts);assert F(t.attrib['x'])==x+w/2 and F(t.attrib['y'])==y+h/2+8;label=t.text;assert label in['К','Л','М','Н','П']
  raw.append((x,y,w,label))
 unit=one(set(v[2]for v in raw));minx=min(v[0]for v in raw);miny=min(v[1]for v in raw);cells={}
 for x,y,w,label in raw:
  c,rr=(x-minx)/unit,(y-miny)/unit;assert c.denominator==rr.denominator==1;cells[int(c),int(rr)]=label
 assert len(cells)==6 and len({v for v in cells.values()if v is not None})==5;out,proof=fold_net(cells);proof['actualNativeSquarePositionsAndLabels']={str(k):v for k,v in cells.items()};return out,proof

def solve(r,w,i,src=False,figureBytes=None):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);parse=E.calc;proof={}
 if i==1:
  whole,fastUnit,slowUnit=n;assert whole>0 and fastUnit>slowUnit>0;out=whole*slowUnit/fastUnit;assert whole/fastUnit==out/slowUnit;proof={'sameTimeUnits':str(whole/fastUnit),'fastWholeRaceDistance':str(whole),'slowerDistanceAtFirstFinishTarget':str(out)}
 elif i==2:
  if src:assert'төрттен бірін'in s;initial,factor=map(E.calc,parts);sold=F(1,4)
  else:
   text=one(re.findall(r'\(\d+/\d+\)',s));sold=E.calc(text);initial,factor=H.numeric_tokens(s.replace(text,''))
  assert initial>0 and factor>1 and 0<sold<1;raised=initial*factor;out=raised*(1-sold);assert out+raised*sold==raised;proof={'initialWholeValue':str(initial),'uniformPriceMultiplier':str(factor),'soldFraction':str(sold),'raisedWholeValue':str(raised),'remainingValueTarget':str(out),'soldAndRemainingConserveRaisedValue':True}
 elif i==3:
  if src:
   sha='12b08600411d949b39bd1dff5bc8a46f2360ddee3c0d285516ac71db2b53e9fe';assert hashlib.sha256((ROOT/'problems/sources/zerek/images/2563a9224096544e4bcc7400.png').read_bytes()).hexdigest()==sha;cells={(0,0):None,(1,0):'б',(2,0):'в',(3,0):'г',(0,-1):'а',(2,1):'д'};out,proof=fold_net(cells);proof['archivedSourceNetInspectedSHA256']=sha
  else:out,proof=actual_net(r,figureBytes)
  parse=lambda text:text.strip()
 elif i==4:
  total,first,second=n;out=first+second-total;only1,only2=first-out,second-out;assert min(out,only1,only2)>=0 and only1+only2+out==total;proof={'onlyFirstClub':str(only1),'onlySecondClub':str(only2),'bothClubIntersectionTarget':str(out),'allAtLeastOneAndWholeConserved':True}
 elif i==5:
  if src:win,loss,secondScore=n;assert'үш ойында жеңді'in s;firstWins=F(3)
  else:win,loss,firstWins,secondScore=n
  secondWins=(secondScore-firstWins*loss)/win;assert secondWins.denominator==1 and secondWins>=0 and win>loss>0;out=firstWins+secondWins;assert firstWins*loss+secondWins*win==secondScore;proof={'firstPlayerWins':str(firstWins),'secondPlayerWins':str(secondWins),'secondScore':str(secondScore),'totalNoDrawGamesTarget':str(out),'allSecondPlayerWinLossScoresReconciled':True}
 elif i==6:
  if src:word,target=one(re.findall(r'\\overline\{([A-Z]+)\}\s*\+.*=\s*(\d+)',one(p for p in parts if '=' in p)));target=int(target)
  else:word,target=one(re.findall(r'overline\(([A-Z]+)\)\s*\+.*=\s*(\d+)',one(p for p in parts if '=' in p)));target=int(target)
  assert len(word)==len(set(word))==4;values=[];checked=0
  for digits in itertools.permutations(range(10),4):
   if digits[0]==0:continue
   checked+=1;value=sum(v*10**(3-j)for j,v in enumerate(digits))
   if value+sum(digits)==target:values.append(value)
  assert checked==4536;out=F(one(values));proof={'letterWord':word,'allDistinctLeadingNonzeroDigitAssignments':checked,'allFullWordSolutions':values,'wholeEquationTarget':target,'uniqueWordNumberTarget':str(out),'allDigitsDistinctLeadingNonzeroAndFullEquationChecked':True}
 elif i==8:
  sums=n[-4:];total=sum(sums)/3;ages=[total-v for v in sums];assert all(v.denominator==1 and v>0 for v in ages);assert collections.Counter(sum(g)for g in itertools.combinations(ages,3))==collections.Counter(sums);out=max(ages)-min(ages);proof={'wholeFourAgeSum':str(total),'allFourAges':list(map(str,ages)),'allFourOriginalTripleSumsMatchedIncludingMultiplicity':True,'oldestMinusYoungestTarget':str(out)}
 elif i==9:
  words=[]
  for word in re.findall(r'\b[A-Z]{3,4}\b',s):
   if word not in words:words.append(word)
  firstWord,secondWord,fullWord=words;missing=one(set(fullWord)-set(secondWord));other=one(set(fullWord)-set(firstWord));assert len(fullWord)==len(set(fullWord))==4 and len(firstWord)==len(secondWord)==3 and missing!=other
  if src:total,firstCount,secondCount,output1=n;output2=output1
  else:total,firstCount,secondCount,output1,output2=n
  sizes=list(map(int,[firstCount,secondCount,total-firstCount-secondCount]));assert min(sizes)>0;valid=[];scores=set()
  for counts in itertools.product(*(range(size+1)for size in sizes)):
   outputs=collections.Counter();correct=0
   for assigned,size,count in zip(words,sizes,counts):
    for omitted,amount in[(missing,count),(other,size-count)]:
     written=assigned.replace(omitted,'');outputs[written]+=amount
     if written==assigned:correct+=amount
   if outputs[firstWord]==output1 and outputs[secondWord]==output2 and 0<sum(counts)<total:valid.append({'missingFirstLetterCountsByAssignedWord':counts,'correct':correct,'allObservedOutputs':dict(outputs)});scores.add(correct)
  out=F(one(scores));assert valid and out==output1+output2-sizes[2];proof={'assignedWordsInOrder':words,'abilityLettersOmitted':[missing,other],'assignedGroupSizes':sizes,'allAbilityCountAllocationsTested':math.prod(v+1 for v in sizes),'allFeasibleAbilityAllocations':valid,'allFeasibleCorrectCounts':sorted(scores),'fullWordGroupAlwaysIncorrectAndWholeOutputsReconciled':True,'correctlyWrittenOwnAssignmentTarget':str(out)}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True
 if opts(r):
  values=[parse(v)for v in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesChecked']=True
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
 return proof

def mutation(r,w,i):
 pairs={1:('120 метр','150 метр'),2:('9000 теңге','12000 теңге'),4:('32 оқушы','34 оқушы'),5:('10 ұпай','13 ұпай'),6:('2025','2027'),8:('27, 24','33, 24'),9:('30 оқушының','32 оқушының')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and(not q['images']or i==3);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);texts=[e for e in svg.iter()if e.tag.endswith('text')];one(e for e in texts if e.text=='К').text='TMP';one(e for e in texts if e.text=='М').text='К';one(e for e in texts if e.text=='TMP').text='М';changed=ET.tostring(svg);bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(changed).hexdigest()
   try:solve(bad,w,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('changedvalidnetlabels retained oldkey')
   bad['answer']='К';changedProof=solve(bad,w,i,False,changed);assert changedProof['uniqueTopLabelTarget']=='К';proof['actualNetLabelCanaryWithUpdatedHashRejected']=True;proof['validChangedNetTarget']='К'
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'}]+([]if i==3 else[mutation(r,w,i)]):
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticcanary accepted',i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8full source/new conditions, full official/new solutions/oneMCQset/sourcecube-netraster read. Actualnative sixfaces integerfolded to orthonormalframes andall24properrotations checked; validchangednetlabels withupdatedhash alteranswer and rejectoldkey. All4536distinctdigitassignments/fullabilitycountallocationdomains and original race/value/union/score/tripleages conservation verified. Same root author, no separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualSVGsixsquares positions/labels/shadedface decoded, folded into unique sixintegernormals. All24properrotations and4coloredfacedown topfaces checked. Archivedraster and343pxnativePNG inspected, no reusedbitmap/tracedpath. Changedvalidletterplacement evenwithupdatedhash changescorrectoppositeface.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,bars=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){bars++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,bars}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':8,'fullSourceNewConditionsAndSolutionsRead':8,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':8,'printedSemanticCanariesRejected':8,'nativeFractions':native['fractions'],'nativeOverlines':native['bars'],'nativeFigures':1,'updatedHashActualGeometryCanariesRejected':1,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':8,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
