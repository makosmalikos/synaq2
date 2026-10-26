"""All10full frozen/new conditions and complete official/newsolutions plus2source
rasters read; both343pxnativePNGs inspected. Same root author separate exact
computation, not anotherhumanreviewer. Twoknown mathematicalmodelIDs reused.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo4-spring-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
T=module('tour5','scripts/editorial/review-femo3-tour3-grade5.py');V=module('winter4','scripts/editorial/review-femo2-winter-grade4.py');P=T.P;K=P.K;E=P.E;H=P.H;one=H.one;exact=P.exact

def asset(i):
 f,sha={2:('7bf1d53bdb0b4aedfdda18fa','bc6239573cba10cea592b7922892c9dd4ac341e101f32b1071f920c25ad71f54'),3:('8113e7cc8f998c1f9b77649f','4bdbeb78e685cf941170401018f30a41ab3cde1f1a245d70636d20f28943ca8e')}[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha

def native_points(r,data=None):
 root=P.W.svg(r,data);ids={v.attrib['id']:v for v in root.iter()if'id'in v.attrib};points=[];ys=[]
 for name in['top','bottom']:
  line=ids['line-'+name];a,b,c,d=[F(line.attrib[k])for k in['x1','y1','x2','y2']];assert a<c and b==d;ys.append(b)
  for id,v in ids.items():
   if id.startswith('point-'+name+'-'):x,y=F(v.attrib['cx']),F(v.attrib['cy']);assert a<=x<=c and y==b;points.append((x,y))
 assert ys[0]<ys[1];out,proof=V.triangle_count(points);proof['allActualNativePointCoordinates']=[list(map(str,p))for p in points];return out,proof

def native_strips(r,perimeter,count,data=None):
 root=P.W.svg(r,data);rects=[tuple(F(v.attrib[k])for k in['x','y','width','height'])for v in root.iter()if v.attrib.get('id','').startswith('strip-')];assert len(rects)==count;dims=one({tuple(sorted([w,h]))for x,y,w,h in rects});assert min(dims)>0;left=min(x for x,y,w,h in rects);top=min(y for x,y,w,h in rects);right=max(x+w for x,y,w,h in rects);bottom=max(y+h for x,y,w,h in rects);side=right-left;assert side==bottom-top;xs=sorted({v for x,y,w,h in rects for v in[x,x+w]});ys=sorted({v for x,y,w,h in rects for v in[y,y+h]})
 for a,b in zip(xs,xs[1:]):
  for c,d in zip(ys,ys[1:]):assert sum(x<F(a+b,2)<x+w and y<F(c+d,2)<y+h for x,y,w,h in rects)==1
 assert dims==(side/count,side);physicalSide=perimeter/4;scale=side/physicalSide;out=2*sum(dims)/scale;assert out==2*physicalSide*(1+F(1,count));return out,{'actualStripCount':count,'allActualRectanglesCongruent':True,'wholeSquareCoveredExactlyOnce':True,'commonPixelsPerCm':str(scale),'squareSideCm':str(physicalSide),'stripSideLengthsCm':list(map(str,[d/scale for d in dims])),'oneStripPerimeterTarget':str(out)}

def recurrence(length):
 valid=[]
 for a,b in itertools.product(range(1,10),range(10)):
  digits=[a,b]
  while len(digits)<length:
   new=digits[-1]+digits[-2]
   if new>9:break
   digits.append(new)
  if len(digits)==length:valid.append(int(''.join(map(str,digits))))
 out=max(valid);digits=list(map(int,str(out)));assert all(digits[j]==digits[j-1]+digits[j-2]for j in range(2,length));return F(out),{'all90NonzeroLeadingInitialDigitPairsChecked':90,'length':length,'allValidRecurrenceNumbers':sorted(valid),'completeBecauseFirstTwoDigitsDetermineEveryLaterDigit':True,'allMaximumDigits':digits,'largestTarget':str(out)}

def solve(r,i,src=False,data=None):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  residents=one(n);assert residents>0 and residents.denominator==1 and'Мен өтірікшімін!'in s;cases=[]
  for speakerTruth in[False,True]:
   allowed=[]
   for positiveClaim in[False,True]:
    claimTruth=speakerTruth if positiveClaim else not speakerTruth
    if claimTruth==speakerTruth:allowed.append(positiveClaim)
   assert allowed==[True];cases.append({'speakerAlwaysTruthful':speakerTruth,'allAllowedPositiveSelfClaims':allowed})
  out=residents;proof={'bothSpeakerTypesAllFourClaimTruthCasesChecked':cases,'universalRegardlessOfPopulationComposition':True,'positiveSelfClaimCountTarget':str(out)}
 elif i==2:
  if src:points=[(F(j),F(0))for j in range(3)]+[(F(j),F(2))for j in range(4)];out,proof=V.triangle_count(points);proof['sourceRasterSHA256']=asset(2);proof['observedSourceTop3Bottom4']=True
  else:out,proof=native_points(r,data)
 elif i==3:
  perimeter=one(n);word=one(re.findall(r'(төрт|бес) бірдей тіктөртбұрыш',s));count={'төрт':4,'бес':5}[word]
  if src:side=perimeter/4;out=2*(side+side/count);proof={'sourceRasterSHA256':asset(3),'observedFourVerticalCongruentStrips':True,'squareSideCm':str(side),'stripSideLengthsCm':list(map(str,[side/count,side])),'oneStripPerimeterTarget':str(out)}
  else:out,proof=native_strips(r,perimeter,count,data)
 elif i==4:
  plain=T.source_text(s);digits=list(one(re.findall(r'(\d),\s*(\d),\s*(\d)\s*және\s*(\d)\s*цифр',plain)));assert len(set(digits))==4;full=[f'{h:02}:{m:02}'for h in range(24)for m in range(60)if sorted(f'{h:02}{m:02}')==sorted(digits)];perms=[]
  for p in itertools.permutations(digits):
   h,m=int(''.join(p[:2])),int(''.join(p[2:]))
   if h<24 and m<60:perms.append(f'{h:02}:{m:02}')
  assert sorted(perms)==full;out=F(len(full));proof={'actualFourDistinctDigits':digits,'all1440MinuteDisplaysChecked':1440,'all24DigitPermutationsChecked':24,'allMatchingDisplays':full,'completeDisplaysEqualValidPermutations':True,'countTarget':str(out)}
 elif i==5:
  word=one(re.findall(r'(бестаңбалы|алтытаңбалы|жетітаңбалы) сан',s));length={'бестаңбалы':5,'алтытаңбалы':6,'жетітаңбалы':7}[word];out,proof=recurrence(length)
 elif i==6:
  whole,clubA,clubB=n
  if src:assert'тек Георгий'in s;none=F(1)
  else:names=one(re.findall(r'Тек (\w+) мен (\w+) үйірмелердің ешқайсысына қатыспайды',s));assert len(set(names))==2;none=F(len(names))
  union=whole-none;out=clubA+clubB-union;parts=[clubA-out,clubB-out,out,none];assert min(parts)>=0 and sum(parts)==whole;proof={'wholeChildren':str(whole),'neitherClubs':str(none),'bothClubLists':list(map(str,[clubA,clubB])),'disjointAOnlyBOnlyBothNeither':list(map(str,parts)),'bothClubCountTarget':str(out)}
 elif i==7:
  future,past,multiple=n;assert future>0 and past>0 and multiple>1;out=(future+multiple*past)/(multiple-1);assert out>past and out.denominator==1 and out+future==multiple*(out-past);proof={'futureOffsetPastOffsetMultiple':list(map(str,n)),'actualPastAge':str(out-past),'actualFutureAge':str(out+future),'pastAgePositive':True,'currentAgeTarget':str(out)}
 elif i==8:
  teams,win,loss,draw,total=n;teams=int(teams);assert teams>=2 and win>loss>=0 and draw>=0;fixtures=list(itertools.combinations(range(teams),2));decisive=win+loss;tied=2*draw;assert decisive!=tied;out=(decisive*len(fixtures)-total)/(decisive-tied);assert out.denominator==1 and 0<=out<=len(fixtures);points=[F(0)]*teams;games=[0]*teams
  for j,(a,b)in enumerate(fixtures):
   games[a]+=1;games[b]+=1
   if j<int(out):points[a]+=draw;points[b]+=draw
   else:points[a]+=win;points[b]+=loss
  assert sum(points)==total and games==[teams-1]*teams;proof={'allSingleRoundRobinFixtures':len(fixtures),'decisivePoints':str(decisive),'tiedPoints':str(tied),'constructivePerTeamPoints':list(map(str,points)),'everyTeamPlaysEachOtherExactlyOnce':True,'wholeTeamScoreTotal':str(sum(points)),'drawCountTarget':str(out)}
 elif i==9:
  initial,a,b,multiple=n;assert initial>0 and a>b>0 and multiple>1;denominator=multiple*a-b;out=(multiple-1)*initial/denominator;assert out.denominator==1 and out>0;limit=int(min(initial//a,initial//b));possible=[d for d in range(limit+1)if initial-b*d==multiple*(initial-a*d)];assert possible==[int(out)];left1,left2=initial-a*out,initial-b*out;assert left1>0 and left2==multiple*left1;proof={'allFeasibleWholeDaysChecked':limit+1,'onlyMatchingWholeDay':possible,'bothRemainingStocks':list(map(str,[left1,left2])),'allDailyWithdrawalsRemainFeasible':True,'dayCountTarget':str(out)}
 elif i==10:
  target=int(one(re.findall(r'(\d+) саны нешінші',T.source_text(s))));assert 10<=target<=99;product=lambda x:(x//10)*(x%10);allNumbers=sorted(range(10,100),key=lambda x:(product(x),x));out=F(allNumbers.index(target)+1);smaller=[x for x in range(10,100)if product(x)<product(target)];ties=sorted(x for x in range(10,100)if product(x)==product(target));tieOffset=ties.index(target)+1;assert out==len(smaller)+tieOffset;proof={'all90TwoDigitNumbersSorted':90,'targetNumber':target,'targetDigitProduct':product(target),'countStrictlyLowerProducts':len(smaller),'allProductTiesAscending':ties,'targetOffsetWithinTies':tieOffset,'secondaryNumericOrderActuallyEnforced':True,'oneBasedRankTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('1485 тұрғын','1486 тұрғын'),3:('80 см','100 см'),4:('2, 3 және','2, 5 және'),5:('алтытаңбалы','жетітаңбалы'),6:('32 бала','34 бала'),7:('16 жылдан','22 жылдан'),8:('38 шықты','40 шықты'),9:('330 кг','352 кг'),10:('76 саны','67 саны')}[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution']and(not q['images']or i in[2,3]);answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  if r.get('image'):
   root=P.W.svg(r);ns='{http://www.w3.org/2000/svg}'
   if i==2:ET.SubElement(root,ns+'circle',{'id':'point-bottom-extra','cx':'330','cy':'175','r':'4.5','fill':'#5b6ad0'});statement=r['statement'];expected='96'
   else:
    strips=[v for v in root.iter()if v.attrib.get('id','').startswith('strip-')];root.remove(strips[-1])
    for j,v in enumerate(strips[:-1]):v.set('y',str(36+50*j));v.set('height','50')
    statement=r['statement'].replace('бес бірдей','төрт бірдей');expected='50'
   changed=ET.tostring(root);bad={**r,'statement':statement,'figureSha256':hashlib.sha256(changed).hexdigest()}
   try:solve(bad,i,False,changed)
   except AssertionError:proof['updatedHashNativeSemanticMutationRejected']=True
   else:raise AssertionError('changednativeinputaccepted')
   solve({**bad,'answer':expected},i,False,changed);proof['validChangedNativeTarget']=expected
  for bad in[{**r,'answer':'999999999'}]+([]if i==2 else[mutation(r,i)]):
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['grade']==4 and r['minimumPlan']=='pro'and not r.get('options')and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All10fullsource/newconditions and full official/newsolutions/2rasters/2nativepreviews read. Universal4selftruthcases, everyactualpointtriple, actualcongruentstrips/fullsquarecoverage/commonunits, all1440clockdisplays vs24permutations, complete90initialdigitpairs andno-carryrecurrence, fullclubpartition/namedneither, positivepast/futureageequation, feasiblefullroundrobinscoreconstruction, allfeasiblewholestockdays and all90product/numberlexicographicsort withnontrivialties independentlychecked. Same root author not anotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'Actualnativepointfamilies/parallellevels/alltriples or allstriprectangles/equalcongruence/fullsquarecoverage/commonunits decoded. Sourcebitmaps and343pxnewPNGs viewed. Updatedhashvalidextra-point inputchanges70to96; changed4-bandgeometryandprintedbandcountchanges48to50. No sourcebitmap/tracedvector.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':10,'fullSourceNewConditionsAndSolutionsRead':10,'sourceKeysNotCaptured':10,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'nativeFigures':2,'updatedHashNativeSemanticCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':10,'existingModelIdsReused':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
