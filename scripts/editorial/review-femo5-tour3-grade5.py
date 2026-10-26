"""All9full frozen/newconditions and complete official/newsolutions/allMCQoptions
and3archivedrasters read, three343pxnativePNGs inspected. Same root author separate
exact computational review, not anotherhumanreviewer. Fourexisting modelIDs reused.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo5-tour3-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):s=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
G=module('grade4','scripts/editorial/review-femo5-tour3-grade4.py');S=module('spring5','scripts/editorial/review-femo3-spring-grade5-remainder.py');T=G.T;P=G.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def asset(i):
 f,sha={1:('4535f0e3b64b9974006ffdf9','68a3ba2229f9def673944fa0971de8d89fe2043a2e3c93b091a05b52452f5665'),8:('80cd7d65da7ceb017b3d1e28','c8098660b7b34b79090f191eb4ca0b1a51cb57d664576bdef7d4dea31b7ffff8'),9:('3bde66fc1a70511ac01577b1','b5a223dddf4adf23e71af4bf0388fd3c55430e7176aec276e2f9532b6278cea9')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def frame(r,width,innerPerimeter,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};outer=tuple(F(ids['outer'].attrib[k])for k in['x','y','width','height']);hole=tuple(F(ids['hole'].attrib[k])for k in['x','y','width','height']);x,y,w,h=outer;a,b,c,d=hole;assert min(w,h,c,d)>0;margins=[a-x,b-y,x+w-a-c,y+h-b-d];margin=one(set(margins));assert margin>0 and width>0 and innerPerimeter>0;scale=margin/width;assert 2*(c+d)/scale==innerPerimeter and one(H.numeric_tokens(ids['inner-perimeter'].text))==innerPerimeter;out=2*(w+h)/scale;assert out==innerPerimeter+8*width;return out,{'actualFourFrameMarginsPixels':list(map(str,margins)),'commonPixelsPerCm':str(scale),'innerPerimeterMatchesActualHoleAndLabel':str(innerPerimeter),'outerPerimeterFromActualGeometry':str(out),'outerMinusInnerEqualsEightWidths':True}

def purple_sample(r,data=None):
 root=P.W.svg(r,data);rects=[v for v in root.iter()if v.attrib.get('id','').startswith('cell-')];assert len(rects)==64;xy=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for v in rects];unit=one({w for x,y,w,h in xy});assert all(w==h for x,y,w,h in xy);left=min(p[0]for p in xy);top=min(p[1]for p in xy);cells={};counts=collections.Counter()
 for v,(x,y,w,h)in zip(rects,xy):
  c,rr=(x-left)/unit,(y-top)/unit;assert c.denominator==rr.denominator==1;key=int(rr),int(c);assert key not in cells;fill=v.attrib['fill'];assert fill==('#8260cf'if(max(key)+1)%2==0 else'#fff');cells[key]=fill;counts[fill]+=1
 assert set(cells)==set(itertools.product(range(8),repeat=2));return{'all64ActualSampleCellsAndFillsChecked':64,'nativePurpleCells':counts['#8260cf'],'nativeWhiteCells':counts['#fff']}

def diagonal_map(diagonals):
 result={};value=0
 for diagonal in range(1,diagonals+1):
  rows=range(1,diagonal+1)if diagonal%2==0 else range(diagonal,0,-1)
  for row in rows:value+=1;result[value]=(row,diagonal+1-row)
 return result

def diagonal_native(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for id,v in ids.items()if id.startswith('cell-')];assert len(rects)==21;unit=one({w for x,y,w,h in rects});assert all(w==h==unit for x,y,w,h in rects);minx=min(x for x,y,w,h in rects);miny=min(y for x,y,w,h in rects);coords={((y-miny)/unit+1,(x-minx)/unit+1):p for p in rects for x,y,w,h in[p]};expected=diagonal_map(6);assert set(coords)==set(expected.values());values={}
 for id,v in ids.items():
  if id.startswith('value-'):
   x,y=F(v.attrib['x']),F(v.attrib['y']);cell=one(rc for rc,(a,b,w,h)in coords.items()if a<x<a+w and b<y<b+h);value=int(v.text);assert value not in values;values[value]=tuple(map(int,cell))
 assert values==expected
 for j in range(1,7):
  row=ids[f'row-{j}'];col=ids[f'col-{j}'];assert int(row.text)==int(col.text)==j;assert miny+(j-1)*unit<F(row.attrib['y'])<miny+j*unit and minx+(j-1)*unit<F(col.attrib['x'])<minx+j*unit
 return{'all21ActualNativeValuesAndPositionsChecked':21,'allSixNativeRowAndColumnIndicesChecked':12,'everyShownDiagonalMatchesIndependentTraversal':True}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  width,inside=n;out=inside+8*width;assert min(width,inside)>0
  if src:proof={'sourceRasterSHA256':asset(1),'uniformWidth':str(width),'innerPerimeter':str(inside),'outerPerimeterTarget':str(out),'universalInnerLengthWidthIdentityNotAssumedSideLengths':True}
  else:out,proof=frame(r,width,inside,data)
 elif i==2:
  total=int(one(set(n)));assert('үшеуінің көбейтіндісі жұп'in s);out,proof=S.parity_minimum(total,3)
 elif i==3:return G.solve(r,2,src)
 elif i==4:
  labels=re.findall(r'бәрі\s*(?:—\s*)?(\w+)',s);assert len(n)==len(labels)==len(set(labels))==4;out=sum(n)/3;counts=[out-v for v in n];assert out.denominator==1 and min(counts)>0 and sum(counts)==out;assert all(out-a==b for a,b in zip(counts,n));proof={'allFourColorNamesRead':labels,'allFourAllExceptComplements':list(map(str,n)),'allPositiveColorCounts':list(map(str,counts)),'eachBeadExactlyOneListedColor':True,'wholeCountTarget':str(out)}
 elif i==5:
  if src:assert'төрттен біріне'in s and'жартысына'in s;fractions=[F(1,4),F(1,2)];totalTime=one(n)
  else:fs=re.findall(r'\(\d+/\d+\)',s);assert len(fs)==2;fractions=list(map(exact,fs));remaining=s
  if not src:
   for part in fs:remaining=remaining.replace(part,'',1)
   totalTime=one(H.numeric_tokens(remaining));assert'Жылдамдығы тұрақты'in s and'үйде тұрған уақыт есептелмейді'in s
  assert all(0<v<1 for v in fractions);factor=1+2*sum(fractions);out=totalTime/factor;legs=[2*f*out for f in fractions]+[out];assert sum(legs)==totalTime;proof={'bothFractionalOutAndBackTrips':list(map(str,fractions)),'totalFullPathEquivalent':str(factor),'threeTripTravelTimes':list(map(str,legs)),'allTravelTimeConserved':True,'directMinutesTarget':str(out),'constantSpeedAndStopsExplicitInNew':not src}
 elif i==6:return{**G.city_problem(r,src),'answerChecked':True}
 elif i==7:
  assert len(n)==len(set(n))==3;digits=list(map(str,map(int,n)));assert all(len(d)==1 for d in digits);valid=[x for x in range(100,1000)if sum(d in str(x)for d in digits)==2];pairs=[]
  def avoid(blocked):allowed=set('0123456789')-set(blocked);return len(allowed-{'0'})*len(allowed)**2
  for a,b in itertools.combinations(digits,2):
   forbidden=one(d for d in digits if d not in[a,b]);count=avoid([forbidden])-avoid([forbidden,a])-avoid([forbidden,b])+avoid([forbidden,a,b]);observed=[x for x in valid if a in str(x)and b in str(x)and forbidden not in str(x)];assert count==len(observed);pairs.append({'requiredDigits':[a,b],'forbiddenDigit':forbidden,'fullLeadingZeroAwareInclusionExclusion':count})
  out=F(len(valid));assert out==sum(p['fullLeadingZeroAwareInclusionExclusion']for p in pairs);proof={'all900ThreeDigitNumbersChecked':900,'actualLikedDigits':digits,'presenceNotOccurrenceMultiplicity':True,'allExactlyTwoFanNumbers':valid,'allPairCaseCountsIndependentInclusionExclusion':pairs,'leadingZeroAsymmetryHandled':True,'exactlyTwoFanCountTarget':str(out)}
 elif i==8:
  a,b=n;assert a==b and a.denominator==1 and a%2==0;size=int(a);dark=sum(max(rr,c)%2==0 for rr,c in itertools.product(range(1,size+1),repeat=2));light=size*size-dark;out=F(dark-light);assert out==size;proof={'allFullGridCellsChecked':size*size,'fullDarkCells':dark,'fullWhiteCells':light,'darkMinusWhiteTarget':str(out),'pairwiseLayerDifferenceEqualsDirectCount':True}
  if src:proof['sourceRasterSHA256']=asset(8);proof['sourcePixelsSameAsPriorGrade4RasterSHA256']=asset(8)=='c8098660b7b34b79090f191eb4ca0b1a51cb57d664576bdef7d4dea31b7ffff8'
  else:assert'үлкені жұп болса, тор күлгін, тақ болса, ақ'in s;proof.update(purple_sample(r,data))
 elif i==9:
  target=int(n[-1]);assert int(n[-2])==target and n[0]==1;diagonal=1
  while diagonal*(diagonal+1)//2<target:diagonal+=1
  previous=diagonal*(diagonal-1)//2;offset=target-previous;row,col=(offset,diagonal+1-offset)if diagonal%2==0 else(diagonal+1-offset,offset);direct=diagonal_map(diagonal);assert direct[target]==(row,col)and row+col==diagonal+1;optionPairs=[tuple(map(int,H.numeric_tokens(v)))for v in r['options']];assert tuple(map(int,H.numeric_tokens(r['answer'])))==(row,col);assert optionPairs==[(diagonal,1),(col,row),(row,col),(row,diagonal)];assert len(set(optionPairs))==4 and r['answer']==r['options'][2];proof={'targetNumber':target,'diagonal':diagonal,'allIndependentTraversalValuesChecked':len(direct),'previousTriangleNumber':previous,'withinDiagonalOffset':offset,'targetRowColumn':[row,col],'allFourOptionPositionsChecked':optionPairs,'bothDiagonalParityDirectionsChecked':True}
  if src:proof['sourceRasterSHA256']=asset(9);assert all(direct[n]==rc for n,rc in{1:(1,1),2:(1,2),3:(2,1),4:(3,1),5:(2,2),6:(1,3),7:(1,4),8:(2,3),9:(3,2),10:(4,1),11:(5,1),12:(4,2),13:(3,3),14:(2,4),15:(1,5)}.items());proof['all15VisibleSourceNumbersAndPositionsChecked']=True
  else:assert'Жұп нөмірлі диагональ жоғарғы жолдан төмен-солға'in s and'тақ нөмірлісі төменгі жақтан жоғары-оңға'in s;proof.update(diagonal_native(r,data))
  return{**proof,'answerChecked':True}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 if i==6:
  q=copy.deepcopy(r)
  for key in['statement','answer']:q[key]=q[key].replace('Мирас','Данияр')
  q['options']=[v.replace('Мирас','Данияр')for v in q['options']];return q
 a,b={1:('3 см','4 см'),2:('8 натурал','9 натурал'),3:('05.04.2025','04.04.2024'),4:('18 моншақтан','21 моншақтан'),5:('84 минут','90 минут'),7:('— 0,','— 2,'),8:('40 × 40','42 × 42'),9:('1450','1451')}[i];assert a in r['statement'];q={**r,'statement':r['statement'].replace(a,b)}
 if i==2:q['statement']=q['statement'].replace('Барлық 8 санның','Барлық 9 санның')
 if i==3:q['statement']=q['statement'].replace('2025 жылы','2024 жылы')
 return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==9;entries=[];evidence=[];equalities=0;optionCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and(not q['images']or i in[1,8,9]);opts=q['options']
  if opts:assert len(opts)==4;key=one(j for j,o in enumerate(opts)if o['correct']);assert q['sourceAnswer']==opts[key]['text'];options=[o['text']for o in opts];answer=options[key];optionCount+=8
  else:assert q['sourceAnswer']is None;answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();options=None
  try:src=solve({**q,'answer':answer,**({'options':options}if options else{})},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=P.W.svg(r)
   if i==1:
    outer=one(v for v in root.iter()if v.attrib.get('id')=='outer');outer.attrib.update({'x':'72','y':'10','width':'216','height':'264'});changedStatement=r['statement'].replace('3 см','4 см');expected='80'
   elif i==8:one(v for v in root.iter()if v.attrib.get('id')=='cell-0-0').set('fill','#8260cf');changedStatement=r['statement'];expected=None
   else:one(v for v in root.iter()if v.attrib.get('id')=='value-1-2').text='99';changedStatement=r['statement'];expected=None
   changed=ET.tostring(root);bad={**r,'statement':changedStatement,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:proof['updatedHashNativeSemanticMutationRejected']=True
   else:raise AssertionError('changednativeinputaccepted')
   if expected:solve({**bad,'answer':expected},i,False,changed);proof['validCombinedFrameWidthAndGeometryTarget']=expected
  for bad in[{**r,'answer':next(v for v in r['options']if v!=r['answer'])if opts else'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==5 and bool(opts)==bool(r.get('options'))and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All9full frozen/newconditions and full official/newsolutions/allMCQchoices/3rasters/3nativepreviews read. Universalframeidentity and actualuniformmargins/commonunits; everyparitycountminimalwitness, everyactualyearcalendar date, allfourcolorcomplements, fullfractionaloutandbacktriptime, all24citybijections/all8proseexclusions/initialmatch/options, all900three-digitfanpredicates crossleadingzero-aware inclusionexclusion, allwhole/samplecolors and fullindependentdiagonaltraversal with actual21nativeprefixcells/axes checked. Same root author not separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ThreeactualnativeSVGs decoded; uniformframe/hole/perimeterlabel andcommonunit,64nativecolorcells or21nativevalues plus12row/columnindices checked. Sourceimages and343pxnewPNGs inspected. Validcombinedwidth4anduniformgeometry raisesperimeter72to80; invalidcolor/valuewithupdatedhashrejected. No sourcebitmap/tracedvectors.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline')walk(n.content);else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Barefraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...(r.options||[])])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':9,'fullSourceNewConditionsAndSolutionsRead':9,'sourceKeysNotCaptured':7,'allSourceAndNewOptionsChecked':optionCount,'wrongKeysRejected':9,'printedSemanticCanariesRejected':9,'nativeFractions':native['fractions'],'nativeFigures':3,'updatedHashNativeSemanticCanariesRejected':3,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':9,'existingModelIdsReused':4,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
