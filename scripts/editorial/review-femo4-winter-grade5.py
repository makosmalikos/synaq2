"""Full ten frozen grade5 FEMO4 winter conditions and full official/new solutions
read. Source answer fields null and no MCQs. Source six-square raster and new
343px native preview inspected. Three source stories repeat grade4: these are
practice variants, not new meanings. Separate exact checker by same root author;
no independent human reviewer claimed. All computations use printed inputs/SVG.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo4-winter-grade5';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
sp=importlib.util.spec_from_file_location('femo4base',ROOT/'scripts/editorial/review-femo4-winter-grade4.py');P=importlib.util.module_from_spec(sp);sp.loader.exec_module(P)
one=P.one;ns=P.ns

def geometry(r,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes() if raw is None else raw
 root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 360 320';assert not re.search(rb'<image|<script|<foreignObject|href=|data:|onload=',raw)
 rects={e.attrib['id']:tuple(F(e.attrib[k])for k in('x','y','width','height'))for e in root.findall('.//s:rect',NS)if'id'in e.attrib};assert len(rects)==6
 for x,y,w,h in rects.values():assert w==h and w>0
 small=rects['smallest'];scale=F(one(ns(r['statement'])))/small[2];s=small[2];x=min(a[0]for a in rects.values());y=min(a[1]for a in rects.values())
 # Exact incidence checks, not rendered pixel area alone: six nonoverlapping
 # squares completely cover a rectangle; their common edges force the solution.
 ul,ur,lr,sm,lm,ll=[rects[k]for k in('upper-left','upper-right','lower-right','smallest','lower-middle','lower-left')]
 assert ul[:2]==(x,y) and ur[:2]==(x+ul[2],y)
 assert sm[:2]==(ur[0],ur[1]+ur[3]) and lr[:2]==(sm[0]+s,sm[1])
 assert ll[:2]==(x,ul[1]+ul[3]) and lm[:2]==(ll[0]+ll[2],ll[1])
 assert lm[0]+lm[2]==lr[0] and lm[1]==sm[1]+s and lm[2]==ll[2]
 assert ul[2]==ur[2]+s and ur[2]==lr[2]+s
 w=max(a[0]+a[2]for a in rects.values())-x;h=max(a[1]+a[3]for a in rects.values())-y
 for a,b in itertools.combinations(rects.values(),2):assert max(a[0],b[0])>=min(a[0]+a[2],b[0]+b[2]) or max(a[1],b[1])>=min(a[1]+a[3],b[1]+b[3])
 assert sum(a[2]*a[3]for a in rects.values())==w*h
 # h gives d=c-s; w gives c+2d=2c+3s. Determinant -1,
 # therefore a unique c=5s,d=4s for any positive given smallest side.
 determinant=F(1)*2-F(-1)*F(-1);assert determinant==1
 c=5*s;d=4*s;assert lr[2]==c and lm[2]==ll[2]==d and w==13*s and h==11*s
 given=one(root.findall(".//s:text[@id='given']",NS)).text;label=one(root.findall(".//s:text[@id='small-label']",NS)).text
 assert ns(given)==[int(s*scale)] and label==str(int(s*scale))
 area=w*h*scale*scale;assert str(int(area))==r['answer']
 return{'sha256':hashlib.sha256(raw).hexdigest(),'sixNonoverlappingSquaresCoverRectangle':True,'uniqueIncidenceSystemDeterminant':str(determinant),'widthCm':str(w*scale),'heightCm':str(h*scale),'areaCm2':str(area),'squareSidesCm':[str(a[2]*scale)for a in rects.values()]}

def solve(r,i,source=False):
 s=r['statement'];n=ns(s);proof={}
 if i in(1,2,7):return P.solve(r,{1:5,2:3,7:9}[i],source)
 if i==3:
  divisor,a,b=n;matches=[]
  for value in range(100,1000):
   digits=list(map(int,str(value)))
   if len(set(digits))==3 and not any(d%divisor==0 for d in digits)and not(a in digits and b in digits):matches.append(value)
  out=max(matches);proof={'all900ThreeDigitNumbersChecked':True,'admissibleCount':len(matches),'maximumDigits':list(map(int,str(out)))}
 elif i==4:
  low,high,example=n;assert low<example<high
  matches=[v for v in range(low+1,high)if len(str(v))==4 and all(a<b for a,b in zip(str(v),str(v)[1:]))];out=len(matches);proof['allAdmissibleNumbers']=matches
 elif i==5:
  coefficient,outer,inner,target=n;out=(F(target-outer,coefficient)-inner)/coefficient;assert out.denominator==1;out=int(out);assert outer+coefficient*(inner+coefficient*out)==target;proof['nestedOperationSubstitution']={'coefficient':coefficient,'outer':outer,'inner':inner,'right':target,'innerResult':inner+coefficient*out}
 elif i==6:
  if source:assert n[:3]==[1,2,3]and n[4:7]==[3,2,1];first,second=n[3],n[7]
  else:first,second=map(int,re.findall(r'(\d+) теңге',s));assert 'Бір дәптер, екі қалам және үш альбом' in s and 'Үш дәптер, екі қалам және бір альбом' in s
  a=(1,2,3);b=(3,2,1);target=(1,1,1);weights=(F(1,4),F(1,4));assert all(weights[0]*u+weights[1]*v==t for u,v,t in zip(a,b,target));out=(first+second)*weights[0];assert out.denominator==1;out=int(out)
  witnesses=[]
  for x in range(1,min(first,second)+1):
   z=F(first-second+2*x,2);y=F(first-x-3*z,2)
   if min(y,z)>0 and y.denominator==z.denominator==1:witnesses.append([x,int(y),int(z)])
  assert len(witnesses)>1 and all(sum(w)==out and sum(u*v for u,v in zip(a,w))==first and sum(u*v for u,v in zip(b,w))==second for w in witnesses)
  proof={'rowSpanWeights':list(map(str,weights)),'positiveIntegralWitnesses':witnesses,'individualPricesNotUnique':True}
 elif i==8:
  if source:assert n==[0,9,0,5];top=5
  else:assert '0–9'in s;top=int(one(re.findall(r'Тек 0–(\d)',s)))
  codes=[str(k).zfill(4)for k in range(10000)];valid=[c for c in codes if any(int(d)>top for d in c)];out=len(valid);proof={'all10000CodesIncludingLeadingZeroChecked':True,'rejectedCount':10000-len(valid),'lowAlphabetMaximum':top}
 elif i==9:
  if source:distance,difference=n;assert 'жарты сағат'in s and 'екі сағат'in s;busTime=F(1,2);trainTime=F(2)
  else:distance,minutes,trainTime,difference=n;busTime=F(minutes,60);trainTime=F(trainTime)
  speed=(distance-trainTime*difference)/(busTime+trainTime);assert speed>0 and speed.denominator==1;out=int(speed);assert busTime*speed+trainTime*(speed+difference)==distance;proof={'busHours':str(busTime),'trainHours':str(trainTime),'speedDifference':difference,'busSpeed':out,'trainSpeed':out+difference,'legDistances':[str(busTime*speed),str(trainTime*(speed+difference))]}
 elif i==10:
  smallest=2 if source else one(n);assert (not source)or n[:2]==[6,2];out=143*smallest*smallest
  if source:proof={'visuallyReadSourceSquareSideRatios':[6,7,5,1,4,4],'fullRectangleSidesCm':[13*smallest,11*smallest]}
  else:proof=geometry(r)
 else:raise AssertionError(i)
 assert str(out)==r['answer'],(i,out,r['answer']);return{**proof,'answer':str(out)}

def mutation(r,i):
 pairs={1:('= 2506','= 2508'),2:('15 жасқа','20 жасқа'),3:('6 цифры да','5 цифры да'),4:('3600','3700'),5:('= 37','= 46'),6:('610 теңге','650 теңге'),7:('дәл 6 жұбында','дәл 8 жұбында'),8:('Тек 0–6','Тек 0–5'),9:('285 км','310 км'),10:('3 см','4 см')};a,b=pairs[i];assert a in r['statement'],(i,a);bad=copy.deepcopy(r);bad['statement']=bad['statement'].replace(a,b,1);return bad

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==10;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution'];official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']))
  try:src=solve({**q,'answer':official},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['grade']==5 and 'options'not in r and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution'])
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789(),.+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert P.H.calc(m[1])==F(m[2]),('printed equality',i,m.group());equalities+=1
  for bad in({**r,'answer':'WRONG'},mutation(r,i)):
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',i))
  entry={'editionId':r['editionId'],'sha256':P.digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions and full solutions read; all4536distinct digit assignments,900three-digit/interval numbers,10000codes, closed circular truth DP, row-span/positive price witnesses and exact motion checked from printed inputs. Six actual square positions and unique incidence system, area/coverage checked. Same root author; no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if i==10:
   raster=ROOT/'problems/sources/zerek/images/19c69f1f8d64431953bf1c0c.png';assert hashlib.sha256(raster.read_bytes()).hexdigest()=='41ac635afaf805fd9ab9bcf2d478bfa937c321ce875364117900e26ac7544b8c'and len(q['images'])==1
   entry['figureReview']={'status':'verified','sha256':proof['sha256'],'method':'Native mirrored six-square tiling, actual square bounds/nonoverlap/full coverage/shared edge incidence, determinant and scale checked. Source raster and343px native preview viewed; no source raster/tracing published.'}
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);e=one(svg.findall(".//s:rect[@id='smallest']",NS));e.set('width','19')
   try:geometry(r,ET.tostring(svg))
   except AssertionError:pass
   else:raise AssertionError('Actual SVG mutation accepted')
  else:assert not q['images']and not q['svg']
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let bars=0;for(const r of rs)for(const s of[r.statement,r.solution])for(const f of mathFragments(s))if(f.type==='overline')bars++;console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),overlines:bars}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)and check['overlines']==2
 summary={'verified':10,'wrongKeysRejected':10,'printedSemanticCanariesRejected':10,'allSourceNewConditionsFullSolutionsRead':10,'sourceKeysNotCaptured':10,'printedSolutionEqualitiesVerified':equalities,'originalFigures':1,'actualFigureMutationRejected':True,'nativeOverlines':2,'repeatedSourceStoriesNotNewMeanings':3,'pythonJavaScriptHashesMatched':10,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
