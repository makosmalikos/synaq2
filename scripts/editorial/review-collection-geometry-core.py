"""19frozen nonvisual geometry conditions, full official/new solutions and all
available MCQs read.17source keys absent; official solution conclusions recomputed.
Separate exact computation by same root author, no separate human review claimed.
π compared by exact polynomial identities, never an approximate choice oracle.
Three optional original SVGs checked in coordinates and final343px previews viewed.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-geometry-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
sp=importlib.util.spec_from_file_location('bil9check',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one=H.one

def numbers(s):
 s=re.sub(r'\$?\^2\$?|²','',s);return list(map(F,re.findall(r'\d+',s)))
def pi_expr(s):
 s=re.sub(r'см\s*(?:\$\^2\$|²|\^2)?','',s);s=H.tex(s).replace('\\pi','p').replace('π','p');return H.expr(s)
def symbolic(r,constant,pi):
 wanted=H.expr(f'{constant}+({pi})*p');os=[o['text']if isinstance(o,dict)else o for o in r['options']];expressions=[pi_expr(o)for o in os]
 assert all(not a.equals(b)for a,b in itertools.combinations(expressions,2));match=one(o for o,e in zip(os,expressions)if e.equals(wanted));assert r['answer']==match;return {'answer':match,'exactPiPolynomial':[str(constant),str(pi)],'everyMCQExactIdentity':[e.equals(wanted)for e in expressions]}
def solve(r,i,source=False):
 s=r['statement'];n=numbers(s);proof={};out=None
 if i==1:
  a,b=n;out=a+b+a+b;proof['allFourBoundaryLengths']=list(map(str,[a,b,a,b]))
 elif i==2:
  a,b=n;unit_squares=[(x,y)for x in range(int(a))for y in range(int(b))];out=F(len(unit_squares));proof['unitSquareTilingCount']=len(unit_squares)
 elif i==3:
  area=one(n);side=math.isqrt(int(area));assert side>0 and side*side==area;out=F(side*4);proof['positiveSquareSide']=side
 elif i==4:
  perimeter=one(n);side=perimeter/4;assert side>0;out=side*side;assert 4*side==perimeter;proof['sideAndArea']=list(map(str,[side,out]))
 elif i in{5,6}:
  first=one(n);assert 0<first<180;out=180-first;assert first+out==180
 elif i==7:
  a,b=n;out=180-a-b;assert min(a,b,out)>0;proof['allTriangleAngles']=list(map(str,[a,b,out]))
 elif i==8:
  area,width=n;length=area/width;assert length>0;out=2*length+2*width;assert length*width==area;proof['recoveredRectangleLengths']=list(map(str,[length,width]))
 elif i==11:
  perimeter,length=n;width=perimeter/2-length;assert width>0;out=length*width;assert length+width+length+width==perimeter;proof['recoveredRectangleLengths']=list(map(str,[length,width]))
 elif i==12:
  a,b=n;unit=F(180,a+b);angles=[unit*a,unit*b];assert sum(angles)==180 and angles[0]*b==angles[1]*a;out=max(angles);proof['exactSupplementaryAngles']=list(map(str,angles))
 elif i==13:
  base=one(n);vertex=180-base*2;assert base>0 and vertex>0;out=vertex;proof['isoscelesAngles']=list(map(str,[base,base,vertex]))
 elif i==14:
  vertex=one(n);base=(180-vertex)/2;assert base>0 and vertex>0;out=base;proof['isoscelesAngles']=list(map(str,[base,base,vertex]))
 elif i==18:
  diameter=one(n);radius=diameter/2;assert radius>0;proof.update(symbolic(r,0,radius*radius));proof['diameterRadius']=list(map(str,[diameter,radius]));return proof
 elif i in{19,23}:
  circumference,v1,v2=n;speed=v1+v2 if i==19 else abs(v2-v1);assert speed>0 and min(circumference,v1,v2)>0;out=circumference/speed
  # Relative angular displacement grows linearly from0 to one whole turn.
  # Thus no earlier positive time can produce another integer full turn.
  assert out>0 and out*speed==circumference;proof['firstPositiveRelativeTurn']={'speed':str(speed),'circumference':str(circumference),'time':str(out),'traveledDistances':[str(v1*out),str(v2*out)]}
 elif i==20:
  perimeter,diff=n;base=(perimeter-2*diff)/3;side=base+diff;assert min(base,side)>0 and 2*side>base and base+side>side;assert base+side+side==perimeter;out=base;proof['allThreeSides']=list(map(str,[base,side,side]))
 elif i==21:
  unit=F(180,sum(n));angles=[unit*x for x in n];assert len(angles)==3 and min(angles)>0 and sum(angles)==180;out=max(angles);proof['allTriangleAngles']=list(map(str,angles))
 elif i==22:
  count,perimeter=n;assert count.denominator==1 and count>1;small=perimeter/(2*(count+1));side=count*small;assert 2*(side+small)==perimeter;out=4*side;proof['actualStripLengths']=list(map(str,[side,small]));proof['actualStripPerimeter']=str(perimeter)
 elif i==25:
  side=one(n);radius=side/2;proof.update(symbolic(r,side*side,-radius*radius));proof['inscribedDiameterRadius']=list(map(str,[side,radius]));return proof
 else:raise AssertionError(i)
 assert str(out)==r['answer'],(i,out,r['answer']);proof['answer']=str(out);return proof

def geometry(r,raw=None):
 i=int(one(r['sourceRefs'])['sourceId']);raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);assert root.attrib['viewBox']=='0 0 360 320';assert not re.search(rb'<image|<script|<foreignObject|href=|data:|onload=',raw)
 e={x.attrib['id']:x for x in root.findall('.//*[@id]')};n=numbers(r['statement']);given=e['given'].text;checks=[]
 def attrs(id,keys):return tuple(F(e[id].attrib[k])for k in keys)
 if i==18:
  diameter=one(n);assert attrs('disk',['cx','cy','r'])==(180,145,100);assert attrs('diameter',['x1','y1','x2','y2'])==(80,145,280,145);assert numbers(given)==[diameter];checks=['actual line endpoints on opposite points of circle','pixel diameter200 is exactly twice radius100','printed diameter label equals condition']
 elif i==22:
  count,perimeter=n;strips={id:x for id,x in e.items()if id.startswith('strip-')};assert len(strips)==count;cells=[]
  for j in range(int(count)):
   actual=attrs('strip-'+str(j),['x','y','width','height']);expected=(70+F(220)*j/count,40,F(220)/count,220);assert actual==expected;cells.append(actual)
  assert numbers(given)==[perimeter];assert sum(c[2]*c[3]for c in cells)==220**2;checks=['all equal strip corners/widths/heights checked','no overlap or gap, exact square tiling','given each-strip perimeter matches condition']
 elif i==25:
  side=one(n);assert attrs('square',['x','y','width','height'])==(70,40,220,220);assert attrs('inscribed',['cx','cy','r'])==(180,150,110);assert numbers(given)==[side];checks=['four exact tangencies of circle with square sides','radius exactly half square side','physical side label matches condition']
 else:raise AssertionError(i)
 return{'sha256':hashlib.sha256(raw).hexdigest(),'checks':checks}
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('14 м','15 м'),2:('12 см','13 см'),3:('144 см²','169 см²'),4:('84 см','88 см'),5:('128°','129°'),6:('107°','108°'),7:('52°','53°'),8:('84 см²','91 см²'),11:('74 см','76 см'),12:('5 : 4','6 : 4'),13:('42°','43°'),14:('26°','28°'),18:('24 см','26 см'),19:('360 м','368 м'),20:('43 см','46 см'),21:('3 : 4 : 5','4 : 4 : 5'),22:('4 бірдей','5 бірдей'),23:('450 м','453 м'),25:('6 см','8 см')};a,c=pairs[i];assert a in s;b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==19;entries=[];evidence=[];missing=0;equalities=0;canaries=0;figures=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert not q['images']and not q['svg']and q['solution']
  if q['sourceAnswer']is None:missing+=1;assert not q['options'];official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']))
  else:official=q['sourceAnswer'];assert one(o['text']for o in q['options']if o['correct'])==official and len(q['options'])==4
  try:sourceProof=solve({**q,'answer':official},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('REWRITE',i))from e
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution'])
  if q['options']:assert len(r['options'])==4 and r['options'].count(r['answer'])==1
  else:assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
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
  entry={'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'full source/new conditions and solutions/allavailableMCQs; exact perimeter/tilings/positive lengths/angles/part ratios, earliest positive circular relative turn, π polynomial identities; same root author, no separate human review','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):
   g=geometry(r);figures+=1;proof['figure']=g;entry['figureReview']={'status':'verified','sha256':g['sha256'],'method':'Actual diameter line/circle or square/strip rectangles or four inscribed tangencies and printed units checked. Original native343px preview visually inspected; source had no raster for these3.'}
   raw=(ROOT/('frontend/public'+r['image'])).read_bytes();node=ET.fromstring(raw)
   if i==18:target=one(node.findall('.//s:circle[@id="disk"]',NS));target.set('r','99')
   elif i==22:target=one(node.findall('.//s:rect[@id="strip-0"]',NS));target.set('width','54')
   else:target=one(node.findall('.//s:circle[@id="inscribed"]',NS));target.set('cx','181')
   try:geometry(r,ET.tostring(node))
   except AssertionError:pass
   else:raise AssertionError(('actual figure mutation accepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':sourceProof,'rewritten':proof});entries.append(entry)
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':19,'sourceKeysNotCaptured':missing,'allSourceNewConditionsFullSolutionsEveryMCQRead':19,'wrongKeysRejected':19,'printedSemanticCanariesRejected':canaries,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':check['fractions'],'exactPiMCQs':2,'originalFigures':figures,'actualFigureMutationsRejected':figures,'pythonJavaScriptHashesMatched':19,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
