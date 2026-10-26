"""All10 frozen FEMO4winter grade4 full source/new conditions/full official/new
solutions read, no source MCQs and sourceAnswer null. Source partial-fence raster
viewed and new343px original native corner preview inspected. Separate exact
printed-input enumeration/dynamic programming by same root author; no separate
human/agent reviewer. Numeric adaptations not semantic uniqueness counts.
"""
import collections,copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo4-winter-grade4';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
sp=importlib.util.spec_from_file_location('bil9check',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one=H.one;ns=lambda s:list(map(int,re.findall(r'\d+',s)))

def ring_states(size,ll_target):
 by_truths=collections.Counter();states=0
 for first,second in itertools.product((0,1),repeat=2):
  dp={(first,second,int(first==second==0),first+second):1}
  for length in range(2,size):
   nxt=collections.Counter()
   for(a,b,ll,truths),ways in dp.items():
    for c in(0,1):
     if bool(b)!=(not a and not c):continue
     llnew=ll+int(b==c==0)
     if llnew<=ll_target:nxt[b,c,llnew,truths+c]+=ways
   states+=len(nxt);dp=nxt
  for(a,b,ll,truths),ways in dp.items():
   if bool(b)!=(not a and not first)or bool(first)!=(not b and not second):continue
   if ll+int(b==first==0)==ll_target:by_truths[truths]+=ways
 return by_truths,states

def solve(r,i,source=False):
 s=r['statement'];n=ns(s);proof={};out=None
 if i==1:
  digits=one(re.findall(r'(?<!\d)\d{13}(?!\d)',s));cases=[]
  for four in range(4):
   lengths=[4 if j==four else 3 for j in range(4)];position=0;parts=[]
   for length in lengths:parts.append(digits[position:position+length]);position+=length
   assert position==len(digits);cases.append({'fourDigitPosition':four+1,'parts':parts,'valid':all(p[0]!='0'for p in parts)})
  valid=one(c for c in cases if c['valid']);out=int(valid['parts'][valid['fourDigitPosition']-1]);proof['allFourLengthPartitions']=cases
 elif i==2:
  if source:assert'он жетінші'in s and'он төртінші'in s;front,back=17,14
  else:front,back=n
  totals=[total for total in range(max(front,back),front+back+1)if total-front+1==back];out=one(totals);proof['sameCarriageFrontBackCheck']=[front,back,out]
 elif i==3:
  if source:assert'үш жылдан'in s.lower();years=3;gap=one(n)
  else:years,gap=n
  boys=one(k for k in range(1,gap+2)if k*years-years==gap);out=boys+1;ages=list(range(1,boys+1));girl=sum(ages);assert sum(a+years for a in ages)-(girl+years)==gap;proof['consistentAgesWitness']={'brothers':ages,'girl':girl,'yearsLater':years,'sumGap':gap,'allChildren':out}
 elif i==4:
  if source:assert'тоғызыншы'in s and'үш есе'in s;weekly=one(n);weeks=9;factor=3
  else:weekly,weeks,factor=n
  transactions=[('gift',1)]+[('deposit',k)for k in range(2,weeks+1)];added=sum(weekly for k,week in transactions if k=='deposit');gift=F(added,factor-1);assert gift>0 and gift.denominator==1;out=int(gift*factor);assert gift+added==out;proof['everySavingsWeek']={'transactions':transactions,'weekly':weekly,'gift':int(gift),'deposits':added,'finalBalance':out}
 elif i==5:
  if source:formula=one(p for p in H.math_parts(s,True)if'='in p);plain=re.sub(r'\\mathrm\{([A-Z]+)\}',r'\1',s.replace('$',''))
  else:formula=s.split('Мұнда')[0];plain=s
  words=re.findall(r'[A-Z]+',formula.split('=')[0]);assert len(words)==4 and len(words[0])==4 and len(set(words[0]))==4 and words[1]==words[0][:2]and words[2:]==list(words[0][2:]);total=one(n);target=one(re.findall(r'([A-Z])\s*(?:әрпінің орнында|орнына)',plain));assert target in words[0];matches=[];checked=0
  for digits in itertools.permutations(range(10),4):
   if digits[0]==0:continue
   checked+=1;mapping=dict(zip(words[0],digits));values=[int(''.join(str(mapping[c])for c in word))for word in words]
   if sum(values)==total:matches.append({'digits':mapping,'summands':values})
  assignment=one(matches);out=assignment['digits'][target];assert checked==4536;proof['everyDistinctDigitAssignmentCount']=checked;proof['allValidAssignments']=matches;proof['askedLetter']=target
 elif i==6:
  count=one(n);valid=[]
  for width in range(3,count+2):
   full={(x,y)for x in range(width)for y in range(width)};border={(x,y)for x,y in full if x in{0,width-1}or y in{0,width-1}};inside=full-border
   if len(border)==count:valid.append((width,border,inside))
  width,border,inside=one(valid);out=len(inside);assert len(inside)+len(border)==width*width;proof['wholeSquareCellLedger']={'outerSide':width,'borderCount':len(border),'interiorCount':len(inside),'fullCount':width*width}
 elif i==7:
  prices=list(map(int,re.findall(r'(\d+)\s*теңге',s.replace('$',''))));a,b=prices;firstPrice=F(2*b-a,3);secondPrice=F(2*a-b,3);assert min(firstPrice,secondPrice)>0 and firstPrice.denominator==secondPrice.denominator==1;assert firstPrice+2*secondPrice==a and 2*firstPrice+secondPrice==b;out=int(firstPrice+secondPrice);proof['unitAndBundlePrices']=list(map(str,[firstPrice,secondPrice,a,b,out]))
 elif i==8:
  first,last=n;valid=[]
  for value in range(1000,10000):
   ds=list(map(int,str(value)))
   if sum(ds[:3])==first and sum(ds[1:])==last:valid.append(value)
  out=len(valid);proof['all9000FourDigitNumbersChecked']=True;proof['allAdmissibleNumbers']=valid
 elif i==9:
  size,ll=n;counts,states=ring_states(size,ll);truths=one(counts);out=truths;witness=[]
  for block in range(truths):witness +=[1,0,0]if block<ll else[1,0]
  assert len(witness)==size and sum(witness)==out;assert all(bool(witness[k])==(not witness[k-1]and not witness[(k+1)%size])for k in range(size));assert sum(witness[k]==witness[(k+1)%size]==0 for k in range(size))==ll
  proof['allClosedRingTruthCounts']={str(k):v for k,v in sorted(counts.items())};proof['dynamicStatesChecked']=states;proof['consistentSeatWitness']=witness
 elif i==10:
  plain=s.replace('$','');speeds=list(map(F,re.findall(r'(\d+)\s*км/сағ',plain)));v1,v2,dog=speeds;distance=F(one(re.findall(r'(\d+)\s*км(?!/)',plain)));assert dog>max(v1,v2)>0;T=distance/(v1+v2);out=dog*T;assert out.denominator==1;out=int(out);t=F(0);position=F(0);legs=[]
  for leg in range(4):
   if leg%2==0:dt=(distance-v2*t-position)/(dog+v2);position+=dog*dt
   else:dt=(position-v1*t)/(dog+v1);position-=dog*dt
   assert dt>0;t+=dt;assert t<T;assert position==(distance-v2*t if leg%2==0 else v1*t);legs.append({'time':str(t),'position':str(position),'legDistance':str(dog*dt)})
  ratio=(dog-v1)*(dog-v2)/((dog+v1)*(dog+v2));assert 0<ratio<1 and T-t==T*ratio*ratio;proof['exactContinuousPath']={'meetingTime':str(T),'dogDistance':out,'firstFourBounces':legs,'remainingTimeRatioPerTwoBounces':str(ratio)}
 else:raise AssertionError(i)
 assert str(out)==r['answer'],(i,out,r['answer']);return{**proof,'answer':str(out)}

def geometry(r,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 360 250';assert'сурет толық қоршауды көрсетпейді'in one(root.findall('s:desc',NS)).text;assert'тек бір бұрышы'in r['statement'];assert not re.search(rb'<image|<script|<foreignObject|href=|data:|onload=',raw)
 def project(p):x,y,z=map(F,p);return(180+26*x-26*y,60+12*x+12*y-28*z)
 expected={};cells=[(0,0),(0,1),(1,0),(0,2),(2,0),(0,3),(3,0)]
 for x,y in cells:
  parts={'right':[(x+1,y,0),(x+1,y+1,0),(x+1,y+1,1),(x+1,y,1)],'front':[(x,y+1,0),(x+1,y+1,0),(x+1,y+1,1),(x,y+1,1)],'top':[(x,y,1),(x+1,y,1),(x+1,y+1,1),(x,y+1,1)]}
  for face,ps in parts.items():expected[f'cube-{x}-{y}-{face}']=[project(p)for p in ps]
 actual={e.attrib['id']:[tuple(map(F,p.split(',')))for p in e.attrib['points'].split()]for e in root.findall('.//s:polygon',NS)};assert actual==expected
 return{'sha256':hashlib.sha256(raw).hexdigest(),'visibleIllustrativeCubes':len(cells),'actualFaceCount':len(actual),'actualProjectedVertices':sum(map(len,actual.values())),'illustrativePartialCornerNotFullBorder':True}
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('7184060235674','7184061235674'),2:('18 нөмірлі','19 нөмірлі'),3:('20 жасқа','24 жасқа'),4:('400 теңгеден','500 теңгеден'),5:('= 3732','= 3734'),6:('44 текшеден','48 текшеден'),7:('740 теңге','770 теңге'),8:('қосындысы 5,','қосындысы 6,'),9:('дәл 6 жұп','дәл 8 жұп'),10:('16 км','24 км')};a,c=pairs[i];assert a in s;b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];equalities=0;canaries=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution'];official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']))
  try:src=solve({**q,'answer':official},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('REWRITE',i))from e
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and'options'not in r and re.fullmatch(r'\d+',r['answer'])and not re.search(r'[\\$]',r['statement']+r['solution'])
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert H.calc(m[1])==F(m[2]),('printed equality',i,m.group());equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  try:solve(mutation(r,i),i)
  except(AssertionError,ValueError):canaries+=1
  else:raise AssertionError(('semanticcanaryaccepted',i))
  entry={'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'read all10full source/new conditions and full solutions, source keys absent. All4length partitions,4536distinct digit assignments,9000four-digit numbers, complete circular local-truth DP states, exact savings/cohort/bundle/whole-square and continuous moving-endpoint ledgers checked. Same root author, no separate human review.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if i==6:
   sourceRaster=ROOT/'problems/sources/zerek/images/bdd885378c7300d2267ab91e.png';assert len(q['images'])==1 and hashlib.sha256(sourceRaster.read_bytes()).hexdigest()=='2058511251034bab8a14d3c587d693b5acd98b6a5a8c8800dd83038f75a68b75';g=geometry(r);proof['figure']=g;entry['figureReview']={'status':'verified','sha256':g['sha256'],'method':'Actual21unit-cube faces/84projected corners checked; diagram explicitly illustrative partial corner, full44cube border separately enumerated. Archived source raster and new343px preview inspected. No tracing/source image.'}
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();node=ET.fromstring(raw);face=node.findall('.//s:polygon',NS)[0];ps=face.attrib['points'].split();x,y=ps[0].split(',');ps[0]=str(int(x)+1)+','+y;face.set('points',' '.join(ps))
   try:geometry(r,ET.tostring(node))
   except AssertionError:pass
   else:raise AssertionError('Actual projected corner mutation accepted')
  else:assert not q['images']and not q['svg']
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let bars=0;for(const r of rows)for(const s of[r.statement,r.solution,r.answer])for(const n of mathFragments(s))if(n.type==='overline')bars++;console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),overlines:bars}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)and check['overlines']==2
 summary={'verified':10,'sourceKeysNotCaptured':10,'allSourceNewConditionsFullSolutionsRead':10,'wrongKeysRejected':10,'printedSemanticCanariesRejected':canaries,'printedSolutionEqualitiesVerified':equalities,'distinctDigitAssignmentsCheckedPerCryptarithm':4536,'fourDigitNumbersChecked':9000,'allClosedRingStatesChecked':True,'nativeOverlines':check['overlines'],'originalFigures':1,'actualFigureCornerMutationRejected':True,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
