"""Fourfull frozen/new conditions, full official/new solutions/all4MCQsets
and2archived source rasters read. Nativegauges both343px visually inspected.
SourceR23rasterpointer approximate; official8/12intention verified as intended,
not claimed exactbitmap geometry. Same root author separate computation, not
separatehumanreviewer. SourceE4quotientdomainmissing repaired as yneq0.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-algebra-gauge-remainders';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):sp=importlib.util.spec_from_file_location(n,ROOT/p);m=importlib.util.module_from_spec(sp);sp.loader.exec_module(m);return m
P=module('arith2to5','scripts/editorial/review-collection-arithmetic2to5-remainder.py');K=P.K;E=K.E;H=E.H;one=H.one;plain=K.plain;opts=K.opts

def gauge(r,data=None):
 data=data if data is not None else(ROOT/('frontend/public'+r['image'])).read_bytes();assert hashlib.sha256(data).hexdigest()==r['figureSha256'];s=data.decode();assert not re.search(r'<(?:image|script|foreignObject)|href=|data:image|\son\w+=',s);svg=ET.fromstring(s);assert svg.attrib['viewBox']=='0 0 360 238';ids={e.attrib['id']:e for e in svg.iter()if'id'in e.attrib};cx,cy=[float(ids['hub'].attrib[k])for k in['cx','cy']];assert[cx,cy]==[180,180];ticks={int(k[5:]):v for k,v in ids.items()if k.startswith('tick-')};count=len(ticks)-1;assert count>=4 and set(ticks)==set(range(count+1));assert ids['zero'].text=='0'and ids['one'].text=='1'and float(ids['zero'].attrib['x'])<cx<float(ids['one'].attrib['x']);radii=[]
 for i in range(count+1):
  e=ticks[i].attrib;ax,ay,bx,by=[float(e[k])for k in['x1','y1','x2','y2']];angles=[];rs=[]
  for x,y in[(ax,ay),(bx,by)]:
   angle=math.atan2(cy-y,x-cx);assert abs(angle-math.pi*(1-i/count))<0.000002;angles.append(angle);rs.append(math.hypot(x-cx,cy-y))
  assert abs(rs[0]-125)<0.0001 and abs(rs[1]-139)<0.0001;radii.append(rs)
 assert ids['arc'].attrib['d']=='M 50 180 A 130 130 0 0 1 310 180';e=ids['pointer'].attrib;x1,y1,x2,y2=[float(e[k])for k in['x1','y1','x2','y2']];assert[x1,y1]==[cx,cy]and 90<math.hypot(x2-cx,cy-y2)<120;theta=math.atan2(cy-y2,x2-cx);assert 0<=theta<=math.pi;position=(1-theta/math.pi)*count;half=round(2*position);assert abs(position-half/2)<0.00001;step=F(half,2);out=step/count
 if int(one(r['sourceRefs'])['sourceId'])==23:assert step.denominator==1
 else:assert step.denominator==2
 return out,{'actualEqualIntervalCount':count,'actualPointerIntervalsFromZero':str(step),'actualPointerFraction':str(out),'actualPointerDegreesFromRight':theta*180/math.pi,'allTickAnglesAndRadiiChecked':True,'zeroAndOneEndpointsAndHubChecked':True,'originalNativeSVGNoRasterScriptsLinks':True}

def solve(r,w,i,src=False):
 parts=H.math_parts(r['statement'],src);parse=E.calc;proof={}
 if w=='S':
  equations=E.system(r['statement'],src);rows=[]
  for eq in equations:
   l,right=plain(eq).split('=');coefs,b=E.affine('('+l+')-('+right+')',('x','y'));rows.append(coefs+[-b])
  (a,b,c),(d,e,f)=rows;det=a*e-b*d;assert det;out=((c*e-b*f)/det,(a*f-c*d)/det);parse=K.pair
  for eq in equations:
   l,right=plain(eq).split('=');assert E.calc(l,{'x':out[0],'y':out[1]})==E.calc(right,{'x':out[0],'y':out[1]})
  proof={'nonzeroSystemDeterminant':str(det),'uniqueOrderedXY':list(map(str,out)),'bothOriginalFractionEquationsChecked':True}
 elif w=='E':
  equation,target=parts;converted,steps=P.constant_abs(equation);l,right=plain(converted).split('=');[a,b],constant=E.affine('('+l+')-('+right+')',('x','y'));assert a and b and constant==0;out=-b/a;assert E.expr(target).equals(E.expr('(x/y)'));difference=E.expr(l)-E.expr(right);assert(E.expr('x')-E.expr('y')*E.number(out)).equals(difference/E.number(a));proof={'constantABSsteps':steps,'homogeneousEquationXCoefficient':str(a),'homogeneousEquationYCoefficient':str(b),'ratioTargetForNonzeroY':str(out),'universalIdentityNoVariableDivisionUntilNonzeroYRequired':True,'sourceYNonzeroDomainOmitted':src}
  if not src:assert r['statement'].startswith('y нөлден өзгеше')
 else:
  if src:
   sol=plain(r['solution']);fractions=re.findall(r'\(\(([0-9.]+)\)/\(([0-9.]+)\)\)',sol);a,b=one(fractions[:1]);step,count=F(a),F(b);out=step/count;sourceAssets={23:('3bd660864dda2dbfd76af6d1','76a1e48a1e096856dd0f43964dc6d28e98443c4ce7549161e484df53a8154db8'),24:('c921d46776670ab2277f09d4','19f9bd05d41c86ae7274ddafae6ef48148ed41f9528e2de7519a2eef899cbe1b')};asset,sha=sourceAssets[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{asset}.png').read_bytes()).hexdigest()==sha;proof={'officialIntendedIntervals':str(step),'officialIntendedWholeIntervals':str(count),'intendedFractionCrossChecked':str(out),'sourceRasterInspected':True,'sourceRasterPointerNotClaimedMathematicallyExact':True,'archivedPNGsha256':sha}
  else:out,proof=gauge(r)
 assert parse(r['answer'])==out,(w,i,src,proof,r['answer']);proof['answerChecked']=True
 values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4;matches=[j for j,v in enumerate(values)if v==out];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['allFourAlternativesEvaluated']=True
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
 if w=='R'and i==24:assert values==[out,F(math.ceil(step),count)if src else F(math.ceil(F(proof['actualPointerIntervalsFromZero'])),proof['actualEqualIntervalCount']),2*out,out-(1/count if src else F(1,proof['actualEqualIntervalCount']))]
 return proof

def mutation(r,w,i):
 if w=='S':a,b='= 8','= 9'
 elif w=='E':a,b='(7/9)','(8/9)'
 else:
  # Actual valid pointer rotation changes mathematical data with updated hash.
  data=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(data);ns={'s':'http://www.w3.org/2000/svg'};e=svg.find("s:line[@id='pointer']",ns);count=len([v for v in svg.iter()if v.attrib.get('id','').startswith('tick-')])-1;out,proof=gauge(r);newPosition=F(proof['actualPointerIntervalsFromZero'])+1;theta=math.pi*(1-float(newPosition/count));e.set('x2',str(round(180+104*math.cos(theta),4)));e.set('y2',str(round(180-104*math.sin(theta),4)));changed=ET.tostring(svg);q=copy.deepcopy(r);q['figureSha256']=hashlib.sha256(changed).hexdigest();newOut,_=gauge(q,changed);assert newOut!=out and newOut==out+F(1,count);return newOut
 assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[];missing=mcqs=equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);w=r['params']['work'];i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution'];assert (not q['images']) or (w=='R'and len(q['images'])==1);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();missing+=q['sourceAnswer']is None;mcqs+=bool(opts(q))
  try:src=solve({**q,'answer':answer},w,i,True);proof=solve(r,w,i)
  except Exception as e:raise AssertionError(('source/new',w,i))from e
  if r.get('image'):
   changed=mutation(r,w,i);assert changed!=E.calc(r['answer']);proof['actualPointerSemanticCanaryWithUpdatedHashRejected']=True
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and (not r.get('image') or(w=='R'))and not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'}]+([]if w=='R'else[mutation(r,w,i)]):
   try:solve(bad,w,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('canary accepted',w,i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and (before[-1]==':' or before[-1].isascii()and before[-1].isalpha()):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('solution equality',w,i,match[0]);equalities+=len(sides)-1
  entry={'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fourremaining full source/newconditions and full official/newsolutions/everyMCQset and2source rasters read. Unique rational linearsystem, universal nonzeroquotient and actualnativegauge allmarkangles/pointer readings checked. SourceE4missingdomain and sourceR23approximatebitmapintention explicit, not overclaimed. Same root author no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'ActualXMLalltick/endpoints/hub/pointer angles and interval counts decoded; changedvalidpointer withupdatedhash changesanswer. SourcePNG inspected nativeSVG343px visuallychecked, no raster/script/links.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':4,'fullSourceNewConditionsAndSolutionsRead':4,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':4,'printedSemanticCanariesRejected':4,'nativeFractions':native['fractions'],'nativeFigures':2,'updatedHashActualGeometryCanariesRejected':2,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':4,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
