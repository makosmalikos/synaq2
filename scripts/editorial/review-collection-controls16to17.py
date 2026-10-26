"""All14full frozen/new conditions and official/new solutions/sevenMCQsets read,
plus original rectangle raster inspected. Source repeated-subtraction display is
ambiguous and original masspercent/litres lacks density: explicitly repaired in
new statements, not claimed reliable as printed. Same root author separates
exact computation; no separate human review. Actual new SVG geometry verified.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-controls16to17';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one;plain=K.plain;scalar=lambda t:K.scalar(re.sub(r'\s*л\s*$','',t));opts=K.opts

def geometry(r,percent,data=None):
 data=data if data is not None else (ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];s=data.decode();assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',s);svg=ET.fromstring(s);assert svg.attrib['viewBox']=='0 0 360 220';ids={e.attrib['id']:e for e in svg.iter()if'id'in e.attrib};a=ids['outline'].attrib;x,y,L,W=[F(a[k])for k in['x','y','width','height']];assert min(L,W)>0;line=ids['midline'].attrib;assert[F(line[k])for k in['x1','y1','x2','y2']]==[x+L/2,y,x+L/2,y+W];half=ids['half-fill'].attrib;assert[F(half[k])for k in['x','y','width','height']]==[x,y,L/2,W];expected={'A':x,'E':x+L/2,'B':x+L,'D':x,'F':x+L/2,'C':x+L}
 for label,pos in expected.items():
  e=ids[label];assert e.text==label and F(e.attrib['x'])==pos;assert 0<F(e.attrib['y'])<220 and(F(e.attrib['y'])<y if label in'AEB'else F(e.attrib['y'])>y+W)
 assert W/(2*(L+W))==percent/100;ratio=L/(2*(L/2+W));return ratio,{'actualSVGLength':str(L),'actualSVGWidth':str(W),'bothMidpointsAndAllSixLabelsChecked':True,'actualSVGWidthPercentOfWholePerimeter':str(percent),'actualSVGRatioTarget':str(ratio),'forbiddenRasterScriptLinksAbsent':True}

def formula_tuple(s):
 parts=[re.sub(r'^\s*[abc]\)\s*','',p)for p in s.split(';')];parts=[p for p in parts if '=' in p];assert len(parts)==3;out=[]
 for p in parts:
  left,right=plain(p).split('=');assert left.strip()=='y';out.append(E.expr(right))
 return tuple(out)
def solve(r,w,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);parse=scalar;proof={}
 if(w,i)==('W16',1):
  if src:part,whole=parts
  else:whole,part=one(re.findall(r'Қорапта (\w) дәптер бар, оның (\w) данасы',s))
  out=E.expr('100*'+part+'/'+whole);parse=lambda t:E.expr(plain(t).replace('%','').replace(chr(92),''));proof={'partVariable':part,'wholeVariable':whole,'percentageCoefficientNumerator':{str(k):str(v)for k,v in out.n.items()},'percentageCoefficientDenominator':{str(k):str(v)for k,v in out.d.items()},'universalRationalIdentityAndNonzeroWhole':True}
 elif(w,i)==('W16',2):
  one1,scale1,length,one2,scale2=n;assert one1==one2==1 and min(scale1,scale2,length)>0;real=length*scale1;out=real/scale2;assert out*scale2==length*scale1;proof={'sameRealDistanceCm':str(real),'firstMapCm':str(length),'secondMapCmTarget':str(out)}
 elif(w,i)==('W16',3):
  a,b,c,total=n;times=[a,b,c];rates=[1/t for t in times];out=tuple(total*v/sum(rates)for v in rates);parse=lambda t:tuple(H.numeric_tokens(t));assert sum(out)==total and len(set(t*v for t,v in zip(times,out)))==1;proof={'times':list(map(str,times)),'orderedPaymentsTarget':list(map(str,out)),'conservedTotal':str(total),'allPayTimesProductsEqual':True}
 elif(w,i)==('W16',4):
  if src:
   terms=[(int(b),int(e))for b,e in re.findall(r'(\d+)\^\{(\d+)\}',one(parts))];assert len(terms)==10;upper,lower=terms[:5],terms[5:];assert len(set(upper))==len(set(lower))==1;count=5
  else:
   terms=[(int(b),int(e))for b,e in re.findall(r'(\d+)\^(\d+)',plain(s))];assert len(terms)==2 and s.count('алты рет')==2;upper=[terms[0]]*6;lower=[terms[1]]*6;count=6
  base,top=upper[0];bottomBase,bottom=lower[0];assert base==bottomBase>0 and top==bottom+1;num=sum(b**e for b,e in upper);den=sum(b**e for b,e in lower);assert den>0 and num==base*den;out=F(num,den);proof={'samePositiveBase':base,'numeratorExponent':top,'denominatorExponent':bottom,'sameTermCountBothSides':count,'exactBigIntegerDivisionTarget':str(out),'positiveDenominator':True}
 elif(w,i)==('W16',5):
  a,b=map(F,re.findall(r'(\d+)%',s));fraction=a*b/10000;assert 0<fraction<1;out=100/fraction;proof={'subcategoryFractionOfWhole':str(fraction),'wholeComparedToSubcategoryPercentTarget':str(out),'reverseBaseNotDirectPercent':True}
 elif(w,i)==('W16',6):
  percent=F(one(re.findall(r'(\d+)%',s)));final=F(one(re.findall(r'Қазір(?: оның)? биіктігі ([0-9,]+) см',s if not src else s.replace('Қазір оның бойы','Қазір оның биіктігі'))).replace(',','.'));years=int(n[0])if src else 3;assert years==3;factor=1+percent/100;out=final/factor**years;stages=[out*factor**k for k in range(years+1)];assert stages[-1]==final;proof={'annualMultiplier':str(factor),'threeCompoundFactorsNotAdditive':True,'allHeightStages':list(map(str,stages)),'initialHeightTarget':str(out)}
 elif(w,i)==('W16',7):
  parts=[p for p in parts if '=' in p];assert len(parts)==3;out=[]
  for eq in parts:
   l,right=plain(eq).split('=');[a,b],c=E.affine('('+l+')-('+right+')',('x','y'));assert b;out.append(E.expr('x')*E.number(-a/b)+E.number(-c/b))
  out=tuple(out);parse=formula_tuple;proof={'universalYasXNumerators':[{str(k):str(v)for k,v in p.n.items()}for p in out],'allThreeEquationsAndEveryRealXCheckedAlgebraically':True}
 elif(w,i)==('W17',1):
  if src:
   groups=re.findall(r'\\underbrace\{(.*?)\}_\{(\d+)\\text\{ рет\}\}',one(parts));assert len(groups)==3;vals=[];counts=[]
   for body,count in groups:
    fs=[F(int(a),int(b))for a,b in re.findall(r'\\dfrac\{(\d+)\}\{(\d+)\}',body)];assert len(set(fs))==1;vals.append(one(set(fs)));counts.append(int(count))
  else:
   fracs=re.findall(r'\(\d+/\d+\)',s);assert len(fracs)==3;vals=list(map(E.calc,fracs));bare=s
   for p in fracs:bare=bare.replace(p,'')
   counts=list(map(int,H.numeric_tokens(bare)))
  a,b,c=vals;k,l,m=counts;left=sum([a]*k)-sum([b]*l);right=sum([c]*m);out=left*right;assert out==(k*a-l*b)*(m*c);proof={'repeatedFractions':list(map(str,vals)),'threeRepeatCounts':counts,'firstBracket':str(left),'secondBracket':str(right),'productTarget':str(out),'sourceUnderbraceAmbiguityNotClaimedValidAsPrinted':src}
 elif(w,i)==('W17',2):
  eq=plain(one(parts));inside=one(re.findall(r'\|([^|]+)\|',eq));[a],b=E.affine(inside,('x',));numeric=eq.replace('|'+inside+'|','z');l,right=numeric.split('=');[scale],offset=E.affine(l,('z',));assert offset==0 and scale;radius=E.calc(right)/scale;assert radius>0;out=tuple(sorted([(radius-b)/a,(-radius-b)/a]));parse=K.roots
  for x in out:
   v=abs(E.calc(inside,{'x':x}));assert E.calc(l,{'z':v})==E.calc(right)
  proof={'positiveModulusRadius':str(radius),'allRealRoots':list(map(str,out)),'originalNestedNumericDenominatorsAndBothRootsChecked':True}
 elif(w,i)==('W17',3):
  percent=F(one(re.findall(r'(\d+)%',s)));width=percent/100;length=F(1,2)-width;assert 0<width<length;smallP=length+2*width;out=length/smallP
  if not src:geoOut,g=geometry(r,percent);assert geoOut==out;proof.update(g)
  proof.update({'widthFractionWholePerimeter':str(width),'lengthFractionWholePerimeter':str(length),'halfRectanglePerimeterFraction':str(smallP),'targetLengthOverSmallPerimeter':str(out)})
 elif(w,i)==('W17',4):
  down,up=n;current=(1/down-1/up)/2;assert 0<current<(1/down+1/up)/2;out=1/current;proof={'normalizedCurrentSpeed':str(current),'raftTravelTimeTarget':str(out),'raftOwnSpeedZero':True}
 elif(w,i)==('W17',5):
  a,b,diff=n;sideA=a/100;sideB=sideA*b/100;coefficient=1-sideA-2*sideB;assert coefficient>0;P=diff/coefficient;AB=sideA*P;BC=sideB*P;AC=BC+diff;assert AB+BC+AC==P and all(u+v>z for u,v,z in[(AB,BC,AC),(AB,AC,BC),(BC,AC,AB)]);out=BC;proof={'perimeter':str(P),'AB':str(AB),'BCtarget':str(BC),'AC':str(AC),'allThreeStrictTriangleInequalities':True}
 elif(w,i)==('W17',6):
  if src:hours,remaining,initial,diff=n
  else:initial,hours,remaining,diff=n
  sumSpeed=(initial-remaining)/hours;slow=(sumSpeed-diff)/2;fast=slow+diff;assert 0<slow<fast and hours*(slow+fast)+remaining==initial;out=(slow,fast);parse=lambda text:tuple(H.numeric_tokens(text));proof={'totalClosingSpeed':str(sumSpeed),'orderedSpeedsTarget':list(map(str,out)),'traveledPlusRemaining':str(initial)}
 elif(w,i)==('W17',7):
  if src:startPercent,mass,endPercent=n
  else:mass,startPercent,endPercent=n
  assert mass>0 and startPercent>endPercent>0;salt=mass*startPercent/100;final=salt/(endPercent/100);out=final-mass;assert salt/(mass+out)==endPercent/100;proof={'initialMassOrSourceAssumedUnitVolume':str(mass),'saltMass':str(salt),'finalMass':str(final),'pureWaterAddedTarget':str(out),'sourceLitresMassPercentNeedsDensityAssumption':src,'newMassUnitsConsistent':not src}
 else:raise AssertionError((w,i))
 def equal(a,b):
  if isinstance(a,E.R):return a.equals(b)
  if isinstance(a,tuple)and a and isinstance(a[0],E.R):return len(a)==len(b)and all(x.equals(y)for x,y in zip(a,b))
  return a==b
 assert equal(parse(r['answer']),out),(w,i,src,proof,r['answer']);proof['answerChecked']=True
 if opts(r):
  values=[parse(o)for o in opts(r)];assert len(values)==4 and all(not equal(a,b)for a,b in itertools.combinations(values,2));matches=[j for j,v in enumerate(values)if equal(v,out)];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesEvaluated']=True
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
  if(w,i)==('W17',2):lo,hi=out;assert values==[(lo,),(-hi,-lo),out,(hi,)]
  if(w,i)==('W17',3):assert values==[length/F(1,2),out,width/smallP,2*out]
  if(w,i)==('W17',5):assert values==[AB,AC,P,BC]
 return proof

def mutation(r,w,i):
 pairs={('W16',1):('p данасы','r данасы'),('W16',2):('4,5 см','6 см'),('W16',3):('48000 теңге','60000 теңге'),('W16',4):('7²⁰²⁸','7²⁰²⁹'),('W16',5):('32%','40%'),('W16',6):('138,915 см','277,83 см'),('W16',7):('4 × y','5 × y'),('W17',1):('120 рет','125 рет'),('W17',2):('960,5','984,5'),('W17',3):('15%','16%'),('W17',4):('10 сағат','12 сағат'),('W17',5):('3,6 см','4,5 см'),('W17',6):('456 км','480 км'),('W17',7):('24 кг','36 кг')};a,b=pairs[w,i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==14;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution'];assert (not q['images']) or (w=='W17'and i==3 and len(q['images'])==1);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  if r.get('image'):
   png=(ROOT/'problems/sources/zerek/images/03c06b229e5aeb59891a16ee.png').read_bytes();assert hashlib.sha256(png).hexdigest()=='55560468ed9b4f2036ee1db0654db9ef4f7e8eed74409d8e168da9c29735962e';src['archivedRasterInspected']={'sixLabels':'A,E,B above and D,F,C below','rectangularOppositeEdgesParallel':True,'EFlinksTwoMidpoints':True,'sourcePNGsha256':'55560468ed9b4f2036ee1db0654db9ef4f7e8eed74409d8e168da9c29735962e'}
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();badMidline=raw.replace(b'x1="180"',b'x1="190"');assert badMidline!=raw
   bad=copy.deepcopy(r);bad['figureSha256']=hashlib.sha256(badMidline).hexdigest()
   try:geometry(bad,F(15),badMidline)
   except AssertionError:pass
   else:raise AssertionError('wrong actual midpoint accepted')
   taller=raw.replace(b'height="120"',b'height="140"').replace(b'y2="170"',b'y2="190"');bad['figureSha256']=hashlib.sha256(taller).hexdigest();changedPercent=F(100*140,2*(280+140));newRatio,_=geometry(bad,changedPercent,taller);assert newRatio==F(1,2)and newRatio!=scalar(r['answer']);proof['updatedHashActualGeometryCanariesRejected']=2;proof['changedActualGeometryRatio']='1/2'
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and (not r.get('image') or(w=='W17'and i==3))and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
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
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All14full source/new conditions, full official/new solutions and7completeMCQsets plus originalsource raster read. Exact symbolic percentage/dependent-variable identities, map scale, payment/compound/powers/repeated sums, fullnestedmodulus roots, actualnativeSVG geometry, rectangle/triangle/flow/train/salt conservation checked. Sourceunderbrace and masspercent/litre ambiguities explicitly repaired. Same author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualXMLrectangle dimensions, exactmidline/endpoints, allsixlabels, percent and targetratio; forbiddenraster/links/scripts absent. SourcePNG inspected, nativeSVG343pxpreview visually checked.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':14,'fullSourceNewConditionsAndSolutionsRead':14,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':14,'printedSemanticCanariesRejected':14,'nativeFractions':native['fractions'],'nativeFigures':1,'updatedHashActualGeometryCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':14,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
