"""Ten full frozen/new conditions, complete official/new solutions, every MCQ
choice and both archived rasters read. Native square and shelf diagrams inspected
at343px. Same root author separate computational check, not second human review.
"""
import ast,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo2-winter-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):s=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
K=module('control1314','scripts/editorial/review-collection-controls13to14.py');E=K.E;H=E.H;one=H.one

def exact(s):
 s=K.plain(s).replace('^','**')
 def calc(n):
  if isinstance(n,ast.Constant):return F(str(n.value))
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));v=calc(n.operand);return -v if isinstance(n.op,ast.USub)else v
  assert isinstance(n,ast.BinOp),ast.dump(n);a,b=calc(n.left),calc(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  assert isinstance(n.op,ast.Pow)and b.denominator==1 and abs(b)<1000;return a**int(b)
 return calc(ast.parse(s,mode='eval').body)

def svg(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',data.decode());return ET.fromstring(data)
def asset(i):
 f,sha={5:('1393f1525507b38ce7df7b26','e4fe3801cf193fda9813238f5048a7c7876ee19e1e420e9ed681b1b133ad13a0'),9:('6941837520892b59867e2a3d','0c9b22f00ea04d6130d5b96481b281682be8a20d88a41af3b688b55dfb0f2d97')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def square_figure(r,perimeters,data=None):
 root=svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('square-')];assert len(rects)==4 and all(w==h and w>0 for x,y,w,h in rects);labeled={}
 for id,v in ids.items():
  if id.startswith('label-'):
   label=v.text;assert label not in labeled;x,y=F(v.attrib['x']),F(v.attrib['y']);inside=[b for b in rects if b[0]<x<b[0]+b[2]and b[1]<y<b[1]+b[3]];labeled[label]=one(inside)
 assert set(labeled)=={'I','II','III','IV'};assert set(labeled.values())==set(rects)
 for a,b in itertools.combinations(rects,2):assert min(a[0]+a[2],b[0]+b[2])<=max(a[0],b[0])or min(a[1]+a[3],b[1]+b[3])<=max(a[1],b[1])
 scales=[labeled[label][2]/(p/4)for label,p in zip(['I','II'],perimeters)];scale=one(set(scales));assert scale>0;givens=H.numeric_tokens(ids['given-perimeters'].text);assert givens==perimeters
 contacts=[]
 for la,lb in itertools.combinations(labeled,2):
  a,b=labeled[la],labeled[lb];vertical=(a[0]+a[2]==b[0]or b[0]+b[2]==a[0])and min(a[1]+a[3],b[1]+b[3])>max(a[1],b[1]);horizontal=(a[1]+a[3]==b[1]or b[1]+b[3]==a[1])and min(a[0]+a[2],b[0]+b[2])>max(a[0],b[0]);
  if vertical or horizontal:contacts.append([la,lb])
 assert len(contacts)==5
 sides={label:b[2]/scale for label,b in labeled.items()};return 4*sides['IV'],{'actualLabeledSquareSides':{k:str(v)for k,v in sides.items()},'oneCommonPixelsPerCm':str(scale),'allSquareInteriorsDisjoint':True,'actualSharedBoundaryPairs':contacts,'targetIVPerimeter':str(4*sides['IV'])}

def book_order(r,data=None):
 root=svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('spine-')];assert len(rects)==2;ordered=sorted(rects);a,b=ordered;assert a[0]+a[2]==b[0]and a[1]==b[1]and a[3]==b[3];labels={}
 for id,v in ids.items():
  if id.startswith('volume-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);labels[v.text]=one(j for j,rect in enumerate(ordered)if rect[0]<x<rect[0]+rect[2]and rect[1]<y<rect[1]+rect[3])
 assert set(labels)=={'I','II'}and set(labels.values())=={0,1};assert'арқасы бізге қарап тұр'in ids['orientation'].text;return sorted(labels,key=labels.get)

def book_path(cover,sheetMM,pages,order):
 assert cover>0 and sheetMM>0 and all(p>0 and p.denominator==1 and p%2==0 for p in pages);thickness={label:(p/2)*sheetMM/10 for label,p in zip(['I','II'],pages)};segments=[];starts={};ends={};x=F(0)
 for label in order:
  segments.append((x,x+cover,label+'-back-cover'));x+=cover;ends[label]=x
  segments.append((x,x+thickness[label],label+'-pages'));x+=thickness[label];starts[label]=x
  segments.append((x,x+cover,label+'-front-cover'));x+=cover
 start,end=starts['I'],ends['II'];lo,hi=sorted([start,end]);crossed=[(label,min(b,hi)-max(a,lo))for a,b,label in segments if min(b,hi)>max(a,lo)];distance=hi-lo;assert sum(length for label,length in crossed)==distance;return distance,{'leftToRightVolumeOrder':order,'pageBlockThicknessCm':{k:str(v)for k,v in thickness.items()},'startIAtFirstPageCoordinate':str(start),'endIIAtLastPageCoordinate':str(end),'allCrossedPhysicalSegments':[(k,str(v))for k,v in crossed],'straightPathLengthCmTarget':str(distance),'pagesPerSheet':2}

def compositions(steps,target):
 assert len(steps)==len(set(steps))==3 and min(steps)>0 and target>0;dp=[1]+[0]*target
 for j in range(1,target+1):dp[j]=sum(dp[j-k]for k in steps if k<=j)
 def all_paths(left):return [()]if left==0 else[(k,)+tail for k in steps if k<=left for tail in all_paths(left-k)]
 paths=all_paths(target);assert len(paths)==len(set(paths))==dp[-1]and all(sum(p)==target for p in paths);return F(dp[-1]),{'allowedOrderedSteps':steps,'targetDistance':target,'dynamicCountsIncludingEmptyStart':dp,'allOrderedValidJumpSequences':[list(p)for p in paths],'recursiveEnumerationEqualsDP':True,'orderedSequenceCountTarget':dp[-1]}

def primes_below(bound):return[p for p in range(2,bound)if all(p%d for d in range(2,math.isqrt(p)+1))]
def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s);proof={}
 if i==1:
  divisor,add,mult,subtract=n;assert divisor>0 and mult>0 and mult!=1/divisor;out=(add+subtract)/(mult-1/divisor);left=out/divisor+add;right=out*mult-subtract;assert left==right;proof={'allPrintedOperationsRead':list(map(str,n)),'intendedResult':str(left),'mistakenResult':str(right),'originalNumberTarget':str(out)}
 elif i==2:
  p,q,total=map(int,n);assert p>0 and q>0 and total>0;allpairs=[(a,b)for a in range(1,total//p+1)for b in range(1,total//q+1)if p*a+q*b==total];a,b=one(allpairs);out=F(a+b);proof={'allPositiveIntegerSolutions':allpairs,'capacitiesAndTotal':[p,q,total],'exhaustiveCapacityBoundPairsChecked':(total//p)*(total//q),'wholeContainerCountTarget':str(out)}
 elif i==3:
  a,b=n;assert min(a,b)>0;rate=1/a+1/b;out=1/rate;assert out/a+out/b==1;proof={'constantTimes':list(map(str,n)),'bothCompletedFractions':[str(out/a),str(out/b)],'wholeWorkConserved':True,'jointMinutesTarget':str(out)}
 elif i==4:
  bound=int(one(n));primes=primes_below(bound);assert primes;last=1
  for p in primes:last=(last*p)%10
  out=F(last);proof={'strictPrimeUpperBound':bound,'primeCount':len(primes),'allPrimeFactors':primes,'containsBoth2And5':2 in primes and 5 in primes,'lastDigitFromCompleteModularProduct':last}
 elif i==5:
  assert len(n)==2 and min(n)>0
  if src:
   a,b=[p/4 for p in n];c=a+b;d=b+c;out=4*d;proof={'observedOriginalIAndIIAboveIIIAndIIAboveIIIAlongIV':True,'sourceRasterSHA256':asset(5),'sourceSides':list(map(str,[a,b,c,d])),'targetIVPerimeter':str(out)}
  else:out,proof=square_figure(r,n,data)
 elif i==6:
  if src:
   expression=H.math_parts(s,True)[-1];assert expression=='2^{2^2}';base,innerBase,innerPower=map(int,re.findall(r'\d+',expression))
  else:
   innerBase,innerPower=map(int,one(re.findall(r'алдымен (\d+)\^([0-9]+)',E.plain(s))));base=int(one(re.findall(r'содан кейін (\d+) санын',s)))
  exponent=innerBase**innerPower;assert 0<exponent<1000;out=F(base**exponent);wrong=(base**innerBase)**innerPower;proof={'outerBase':base,'innerBase':innerBase,'innerPower':innerPower,'innerExponentFirst':exponent,'allRepeatedOuterFactors':exponent,'rightAssociatedPowerTarget':str(out),'leftAssociatedValue':str(wrong),'associationDistinguishedByNewNumbers':not src};assert src or out!=wrong
 elif i==7:
  if src:side,side2,initial,length,width,factor=n;assert side==side2==width and length==side*initial
  else:side,initial,factor=n
  assert side>0 and initial.denominator==1 and initial>0 and factor>1;old=2*side*(initial+1);new=old*factor;total=new/(2*side)-1;out=total-initial;assert total.denominator==out.denominator==1 and out>0 and 2*(side*total+side)==new;proof={'initialSquares':str(initial),'unitSquareSide':str(side),'oldPerimeter':str(old),'newPerimeter':str(new),'totalSquaresAfter':str(total),'additionalSquaresTarget':str(out)}
 elif i==8:
  a,b,c,target=map(int,n);out,proof=compositions([a,b,c],target)
 elif i==9:
  cover,sheetMM,p1,p2=n;order=['I','II']if src else book_order(r,data);out,proof=book_path(cover,sheetMM,[p1,p2],order)
  if src:proof['sourceSpineOrderInspectedSHA256']=asset(9)
 elif i==10:
  if src:hours,up,flat,down,distance=n
  else:up,flat,down,distance,hours=n
  assert 0<up<flat<down and distance>0;mountRate=1/up+1/down;flatRate=2/flat;assert mountRate!=flatRate;out=(hours-distance*mountRate)/(flatRate-mountRate);mount=distance-out;assert 0<out<distance;mountTime=mount*mountRate;flatTime=out*flatRate;assert mountTime+flatTime==hours;proof={'oneWayDistance':str(distance),'speedsUpFlatDown':list(map(str,[up,flat,down])),'roundtripHours':str(hours),'roundtripMountainHoursPerKm':str(mountRate),'roundtripFlatHoursPerKm':str(flatRate),'mountainDistance':str(mount),'flatDistanceTarget':str(out),'mountainRoundtripHours':str(mountTime),'flatRoundtripHours':str(flatTime),'bothDirectionsTimeConserved':True}
 else:raise AssertionError(i)
 if r.get('options'):
  options=[K.scalar(o)for o in r['options']];correct=[j for j,o in enumerate(options)if o==out];assert K.scalar(r['answer'])==out and len(correct)==1;assert options==list(map(F,[5,0,2,9]));proof['allOptionValuesChecked']=list(map(str,options));proof['exactlyOneCorrectOption']=chr(65+one(correct))
 else:assert exact(r['answer'])==out,(i,src,proof,r['answer'])
 proof['answerChecked']=True;return proof

def mutation(r,i):
 pairs={1:('24','36'),2:('324 л','336 л'),3:('8 минутта','12 минутта'),4:('2050','5'),5:('20 см','24 см'),6:('кейін 3 санын','кейін 2 санын'),7:('5 есе','6 есе'),8:('7 м жүруі','8 м жүруі'),9:('0,3 см','0,4 см'),10:('23,5 сағат','23 сағат')};a,b=pairs[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];equalities=0;optionCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and(not q['images']or i in[5,9]);opts=q['options']
  if opts:
   assert len(opts)==4;correct=one(j for j,o in enumerate(opts)if o['correct']);assert q['sourceAnswer']==opts[correct]['text'];answer=str(K.scalar(opts[correct]['text']));sourceOptions=[o['text']for o in opts];optionCount+=len(opts)+len(r['options'])
  else:assert q['sourceAnswer']is None;answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();sourceOptions=None
  try:src=solve({**q,'answer':answer,**({'options':sourceOptions}if sourceOptions else{})},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=svg(r);ns={'s':'http://www.w3.org/2000/svg'}
   a,b=('label-III','label-IV')if i==5 else('volume-I','volume-II');va,vb=[one(v for v in root.iter()if v.attrib.get('id')==id)for id in[a,b]];va.text,vb.text=vb.text,va.text;changed=ET.tostring(root);bad={**r,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:pass
   else:raise AssertionError('actualfigurelabelchangeaccepted')
   correct='52'if i==5 else'4.2';changedProof=solve({**bad,'answer':correct},i,False,changed);proof['actualFigureLabelMutationRejectedWithUpdatedHash']=True;proof['validChangedFigureTarget']=correct
  for bad in[{**r,'answer':'5'if opts else'99999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['grade']==5 and r['minimumPlan']=='pro'and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer']);assert bool(r.get('options'))==bool(opts)
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Read all10full frozen/new conditions and full official/newsolutions, all4source/newoptions and2source rasters. Exactprintedoperation equation, allboundedpositiveinteger containerpairs, constant rates, fullprime modularproduct, actualnative squarelabels/contacts/commonunits, orderedpowinnerfirst, expandedrowperimeter, allorderedrobotpaths plusDP, actualbookspineorder with complete physicalcover/page intervalintersection and roundtripdistance/time conservation. Same root author separatemath, not second human.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualSVGsquare rectangles/labelpositions/contact topology or touchingbookspines/order decoded. Source rasters and343pxnativePNGs viewed. Validlabelswaps change mathematicalanswers52/4.2 and rejectoldkeys despiteupdatedhash. No sourcebitmap/tracedpaths reused.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':9,'allSourceAndNewOptionsChecked':optionCount,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFractions':native['fractions'],'nativeFigures':2,'updatedHashActualGeometryCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
