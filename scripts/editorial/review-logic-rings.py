"""Full16 saved/new conditions, official/new solutions, all16 frozen source
rasters and all8source/newMCQ choices read. Sixteen original native SVGs inspected
as343px PNGs. Source art not reused/traced. Actual arcs, radial geometry, label
positions, same-sector pairs/opposites and printed unreduced fractions checked.
Same author computation, not a separate human. Numerical variants retained.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='logic-rings';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
def module(n,p):
 s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
A=module('a','scripts/editorial/review-bil12-final.py');S=module('s','scripts/editorial/review-logic-sequences.py');W=A.W;ids=A.ids;one=A.one;B=A.B;H=A.H;E=A.E;N=S.N
# Manual clockwise value inventories read from the saved source rasters; no
# pixel coordinates/vector contours are reused in new drawings.
SOURCES={
(1,1):('seq-gp',[4,8,16,None,64,2]),(1,2):('seq-gp',[16,32,1,2,None,8]),(1,3):('seq-ap',[22,30,None,46,6,14]),(1,4):('seq-ap',[17,None,23,8,11,14]),(1,5):('seq-gp',[24,48,96,3,6,None]),
(1,6):('pair-scale',([2,7,8,10,4,9],[8,28,32,40,None,36])),(1,7):('pair-offset',([11,3,10,8],[20,None,19,17])),(1,8):('pair-offset',([4,5,1,10],[16,None,13,22])),(1,9):('pair-offset',([2,11,12,4,1,9],[8,17,18,10,None,15])),
(1,17):('opposite-square',[2,None,6,7,4,9,36,49]),(1,18):('opposite-difference',[28,31,24,5,8,11,4,None]),(1,19):('opposite-square',[4,7,None,64,16,49,81,8]),
(2,3):('pair-square',([10,4,2,6],[100,None,4,36])),(2,4):('pair-square',([5,2,10,8,7,3],[25,4,100,None,49,9])),
(2,19):('fraction-ap',[(7,9),(9,11),None,(1,3),(3,5),(5,7)]),(2,20):('fraction-ap',[(3,4),(4,5),(5,6),None,(7,8),(8,9)])}

def arithmetic(kind,data):
 p={}
 if kind.startswith('pair-'):
  inside,outside=data;known=[(a,b)for a,b in zip(inside,outside)if b is not None];j=one(j for j,v in enumerate(outside)if v is None)
  if kind=='pair-scale':factor=one({b/a for a,b in known});assert factor>0;op=lambda x:x*factor;p['actualSharedMultiplier']=str(factor)
  elif kind=='pair-offset':offset=one({b-a for a,b in known});op=lambda x:x+offset;p['actualSharedOffset']=str(offset)
  else:assert all(b==a*a for a,b in known);op=lambda x:x*x
  out=op(inside[j]);full=[op(v)for v in inside];assert all(b is None or full[k]==b for k,b in enumerate(outside));p['allCompletedSameSectorPairs']=[[str(a),str(b)]for a,b in zip(inside,full)];return out,p
 j=one(j for j,v in enumerate(data)if v is None)
 if kind.startswith('seq-'):
  full,z=S.fit(kind[4:],data);out=full[j];p.update(z);p['actualCompleteClockwiseSequence']=list(map(str,full))
 elif kind=='fraction-ap':
  nums=[v[0]if v else None for v in data];dens=[v[1]if v else None for v in data];a,ap=S.fit('ap',nums);b,bp=S.fit('ap',dens);assert all(v>0 for v in b);out=a[j]/b[j];p['actualCompleteClockwiseFractions']=[[str(x),str(y)]for x,y in zip(a,b)];p['nextNumeratorAndDenominator']=list(map(str,[a[j],b[j]]))
 else:
  assert len(data)==8;known=[(data[k],data[k+4])for k in range(4)if data[k]is not None and data[k+4]is not None];other=data[(j+4)%8];assert other>0;p['allKnownActualOppositePairs']=[[str(a),str(b)]for a,b in known]
  if kind=='opposite-square':
   assert all(min(a,b)**2==max(a,b)for a,b in known);candidates=[other**2]
   try:candidates.append(S.exact_root(other,2))
   except AssertionError:pass
   out=min(candidates);p['allNaturalUnknownCandidates']=list(map(str,sorted(set(candidates))))
  else:delta=one({abs(a-b)for a,b in known});candidates=[other+v for v in[-delta,delta]if other+v>0 and(other+v).denominator==1];out=one(candidates);p['actualAbsoluteOppositeDifference']=str(delta);p['allPositiveNaturalUnknownCandidates']=list(map(str,candidates))
 p['actualUnknownSectorIndex']=j;return out,p

def close(a,b):return abs(float(a)-float(b))<1e-6
def coordinates(el,dx=0,dy=0):return F(el.attrib['x'])-dx,F(el.attrib['y'])-dy
def native(r,data=None):
 root=W.svg(r,data);d=ids(root);s=r['statement'];kind='fraction-ap'if'Бөлшектерді'in s else'opposite-square'if'қарама-қарсы жұпта'in s else'opposite-difference'if'Қарама-қарсы'in s else'pair-square'if'сыртқы сан ішкі санның квадраты'in s else'pair-scale'if'сыртқы сан ішкі санға бірдей тұрақты көбейткіш'in s else'pair-offset'if'сыртқы сан ішкі санға бірдей тұрақты сан'in s else'seq-gp'if'қатынасы тұрақты'in s else'seq-ap';sectors=sorted((int(k.split('-')[1]),v)for k,v in d.items()if re.fullmatch(r'sector-\d+',k));count=len(sectors);assert count in[4,6,8]and [v[0]for v in sectors]==list(range(count));raw=[]
 for j,el in sectors:
  assert re.findall('[A-Za-z]',el.attrib['d'])==['M','L','A','Z'];v=list(map(F,re.findall(r'-?\d+(?:\.\d+)?',el.attrib['d'])));assert len(v)==11 and v[4]==v[5]>0 and v[6:9]==[0,0,1];raw.append(v)
 center=tuple(raw[0][:2]);radius=raw[0][4];assert all(tuple(v[:2])==center and v[4]==v[5]==radius for v in raw);cx,cy=center;start=math.atan2(float(raw[0][3]-cy),float(raw[0][2]-cx));step=2*math.pi/count
 def pt(rad,a):return float(cx)+float(rad)*math.cos(a),float(cy)+float(rad)*math.sin(a)
 def match(actual,expected):assert all(close(a,b)for a,b in zip(actual,expected)),(actual,expected)
 for j,v in enumerate(raw):match(v[2:4],pt(radius,start+j*step));match(v[9:11],pt(radius,start+(j+1)*step));match(v[9:11],raw[(j+1)%count][2:4])
 pair=kind.startswith('pair-');inside=[];outside=[];values=[]
 if pair:
  circle=d['inner-ring'];assert tuple(F(circle.attrib[k])for k in['cx','cy'])==center;innerR=F(circle.attrib['r']);assert 0<innerR<radius
 for j in range(count):
  mid=start+(j+.5)*step
  if pair:
   ray=d['inner-ray-'+str(j)];assert tuple(F(ray.attrib[k])for k in['x1','y1'])==center;match([F(ray.attrib[k])for k in['x2','y2']],pt(innerR,start+j*step));a=d['inner-value-'+str(j)];b=d['outer-value-'+str(j)];match(coordinates(a,dy=6),pt(F(45),mid));match(coordinates(b,dy=6),pt(F(111),mid));inside.append(F(a.text));outside.append(None if b.text=='?'else F(b.text));assert 45<innerR<111<radius
  elif kind=='fraction-ap'and'value-'+str(j)not in d:
   num=d['numerator-'+str(j)];den=d['denominator-'+str(j)];bar=d['fraction-bar-'+str(j)];match(coordinates(num,dy=-5),pt(F(103),mid));match(coordinates(den,dy=23),pt(F(103),mid));vx,vy=pt(F(103),mid);match([F(bar.attrib[k])for k in['x1','y1','x2','y2']],[vx-15,vy+2,vx+15,vy+2]);values.append((F(num.text),F(den.text)))
  else:
   el=d['value-'+str(j)];match(coordinates(el,dy=7),pt(F(103),mid));values.append(None if el.text=='?'else F(el.text))
 if kind.startswith('seq-')or kind=='fraction-ap':assert d['start-marker'].text=='Бастау'and sectors[0][1].attrib['fill']=='#c6d8ff'and sum(v.attrib.get('fill')=='#c6d8ff'for j,v in sectors)==1;match(pt(F(103),start+step/2),[float(cx),float(cy)-103])
 p={'actualNativeSectorCount':count,'allActualArcEndpointsRadiiSweepAndRadialCoverageChecked':True,'allActualLabelPositionsWithinCorrectSectorAndRingChecked':True}
 if kind=='opposite-difference':assert'Барлық сандар натурал'in s
 if kind=='opposite-square':assert'ең кіші натурал'in s
 return root,kind,(inside,outside)if pair else values,p

def solve(r,data=None):
 root,kind,values,p=native(r,data);out,z=arithmetic(kind,values);p.update(z);opts=r.get('options',[])
 if opts:vals=list(map(E.calc,opts));assert len(opts)==len(set(opts))==4 and len(set(vals))==4 and vals.count(out)==1 and r['answer']in opts;p['allActualOptionValues']=list(map(str,vals))
 assert E.calc(r['answer'])==out;p['target']=str(out)
 if kind.startswith('pair-'):printed=[list(map(F,v))for v in re.findall(r'Ішкі (\d+) → сыртқы (\d+)',r['solution'])];assert printed==[[F(a),F(b)]for a,b in p['allCompletedSameSectorPairs']]
 elif kind.startswith('seq-'):printed=one(re.findall(r'толық қатар: (.*?)\.',r['solution']));assert [E.calc(v)for v in printed.split(';')]==list(map(F,p['actualCompleteClockwiseSequence']))
 elif kind=='fraction-ap':printed=one(re.findall(r'толық қатар: (.*?)\.',r['solution']));assert [E.calc(v)for v in printed.split(';')]==[F(a)/F(b)for a,b in p['actualCompleteClockwiseFractions']]
 return p

def source(q,part,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];kind,raw=SOURCES[part,i]
 if kind.startswith('pair-'):data=([F(v)for v in raw[0]],[F(v)if v is not None else None for v in raw[1]])
 else:
  data=[tuple(map(F,v))if isinstance(v,tuple)else F(v)if v is not None else None for v in raw]
  if kind.startswith('seq-')or kind=='fraction-ap':start=min((j for j,v in enumerate(data)if v is not None),key=lambda j:F(*data[j])if isinstance(data[j],tuple)else data[j]);data=data[start:]+data[:start]
 out,p=arithmetic(kind,data);assert E.calc(q['answer'])==out
 if q['options']:assert sum(E.calc(v)==out for v in B.options(q))==1
 p['sourceRasterSha256']=asset['sha256'];p['sourceClockwiseOrderAndSameOppositeSectorTopologyReadFromRaster']=True;p['sourceRuleFamily']=kind;p['target']=str(out)
 if kind=='opposite-difference':p['sourceNaturalNumberAssumptionExplicitInNewCondition']=True
 return p

def changed(r):
 cr=copy.deepcopy(r);root,kind,values,p=native(r);d=ids(root);old=arithmetic(kind,values)[0]
 if kind.startswith('pair-'):j=one(j for j,v in enumerate(values[1])if v is None);el=d['inner-value-'+str(j)];el.text=str(F(el.text)+1)
 elif kind.startswith('seq-'):
  for j,v in enumerate(values):
   if v is not None:d['value-'+str(j)].text=str(v*2)
 elif kind=='fraction-ap':
  for j,v in enumerate(values):
   if v is not None:d['numerator-'+str(j)].text=str(v[0]+1);d['denominator-'+str(j)].text=str(v[1]+1)
 else:
  j=one(j for j,v in enumerate(values)if v is None);other=(j+4)%8;v=values[other];new=(S.exact_root(v,2)+1)**2 if kind=='opposite-square'else v+1;d['value-'+str(other)].text=str(new)
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();_,_,newValues,_=native(cr,raw);new,proof=arithmetic(kind,newValues);assert new!=old
 if cr.get('options'):cr['options']=[str(E.calc(v)+new-old)for v in cr['options']]
 cr['answer']=str(new)
 if kind.startswith('pair-'):cr['solution']='; '.join('Ішкі '+a+' → сыртқы '+b for a,b in proof['allCompletedSameSectorPairs'])+'.'
 elif kind.startswith('seq-'):cr['solution']='толық қатар: '+'; '.join(proof['actualCompleteClockwiseSequence'])+'.'
 elif kind=='fraction-ap':cr['solution']='толық қатар: '+'; '.join('('+a+'/'+b+')'for a,b in proof['actualCompleteClockwiseFractions'])+'.'
 else:cr['solution']='Барлық натурал мүмкіндіктерді тексергендегі жауап '+str(new)+'.'
 return cr,raw

def changed_hash(r,root):
 raw=ET.tostring(root);return{**r,'figureSha256':hashlib.sha256(raw).hexdigest()},raw

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==16;entries=[];evidence=[];equalities=0;choiceCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);part=int(r['editionId'].split('-')[-2]);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['images'])==1 and not q['svg'];choiceCount+=len(q['options']);assert len(q['options'])==len(r.get('options',[]));key=one(v['text']for v in q['options']if v['correct'])if q['options']else one(re.findall(r'Жауабы:\s*(.*)',q['solution']))
  if q['options']:assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=source({**q,'answer':key},part,i);proof=solve(r);cr,raw=changed(r)
  except Exception as e:raise AssertionError(('source/new/changed',part,i))from e
  for bad,data in[({**r,'answer':'999999999'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,data)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('oldkeyaccepted',part,i))
  proof['validChangedActualInputAnswer']=solve(cr,raw)['target']
  root,kind,values,_=native(r);d=ids(root);el=d['sector-0'];el.set('d',re.sub(r' L ([\d.]+) ([\d.]+)',lambda m:' L '+str(F(m[1])+1)+' '+m[2],el.attrib['d'],count=1));bad,bs=changed_hash(r,root)
  try:solve(bad,bs)
  except(AssertionError,ValueError):proof['updatedHashMalformedActualArcRejected']=True
  else:raise AssertionError(('badArcAccepted',part,i))
  root,kind,values,_=native(r);d=ids(root);el=d['inner-value-0']if kind.startswith('pair-')else d['numerator-0']if kind=='fraction-ap'else d['value-0'];el.text=str(F(el.text)+1);bad,bs=changed_hash(r,root)
  try:solve(bad,bs)
  except(AssertionError,ValueError):proof['updatedHashInconsistentActualKnownValueRejected']=True
  else:raise AssertionError(('badValueAccepted',part,i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(values))==1,('sourceOfficialArithmetic',part,i,expr);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All16full source/new conditions official/new solutions16source rasters all8source/newchoices read. Actual SVG arcs/radii/sweep/radial coverage, positioned same-ring labels, explicit start, opposite topology and unreduced numerator/denominator lines decoded. Exact full rule replay, changed actual input old-key rejection and new-key acceptance, malformed updated-hash arc and inconsistent known label rejection. Same author computation, not another human.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG actual geometry/positions/values independently checked;343px PNG inspected. Source art not reused or traced.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choiceCount==8
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':16,'nativeFigures':16,'sourceOptionsRead':8,'rewrittenOptionsRead':8,'openResponseTasks':14,'wrongKeysRejected':16,'validChangedActualInputsRecomputed':16,'malformedActualArcsRejected':16,'inconsistentActualKnownValuesRejected':16,'officialSourceArithmeticEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':16,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
