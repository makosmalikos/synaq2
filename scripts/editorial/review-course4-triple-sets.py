"""All13 saved and rewritten conditions solutions and20 choices read.
13 archived source pictures inspected.13 original SVGs previewed343px.
Set operators and all disjoint regions recomputed from actual printed inputs.
Same author separate computational checker; no second human or browser QA.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-triple-sets';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-shifts-sets.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;E=C.E;N=C.N;one=C.one
LABELS=[[],[],['Барлығы','A барлығы','B барлығы'],['Барлығы','A барлығы','B барлығы'],['Барлығы','A барлығы','B барлығы','A және B'],['Барлығы','A барлығы','B барлығы','Ешқайсысы'],['Барлығы','A барлығы','B барлығы','C барлығы','A және B','A және C','B және C','Үшеуі'],['Барлығы','A барлығы','B барлығы','C барлығы','A және B','A және C','B және C','Үшеуі','Ешқайсысы'],['Барлығы','Екеуі'],['Барлығы','Үшеуі','A және B','A және C','B және C'],['Барлығы','A барлығы','B барлығы','C барлығы','A және B','A және C','B және C'],['Барлығы','A барлығы','B барлығы','C барлығы','A және B','A және C','B және C','Үшеуі'],['Барлығы','A барлығы','B барлығы','A және B']]
def parse(r,i,src=False):
 if i<2:
  if src:parts=H.math_parts(r['statement'],True)[:3];return[list(map(int,re.findall(r'\d+',s)))for s in parts]
  return[list(map(int,re.findall(r'\d+',s)))for s in re.findall(r'[ABC]\s*=\s*\{([^}]+)\}',r['statement'])]
 return[int(E.calc(x))for x in H.math_parts(r['statement'],src)if re.fullmatch(r'[\d\s]+',x)]
def representation(s,i):return set(map(int,re.findall(r'\d+',s)))if i==0 else int(E.calc(s.strip('$ ')))
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':v}
 def two(total,a,b,t,none):
  cells=[a-t,b-t,t,none];assert min(cells)>=0 and sum(cells)==total;p['disjointRegions']=cells;return cells
 def three(total,a,b,c,ab,ac,bc,t,none):
  cells=[a-ab-ac+t,b-ab-bc+t,c-ac-bc+t,ab-t,ac-t,bc-t,t,none];assert min(cells)>=0 and sum(cells)==total;p['disjointRegions']=cells;return cells
 if i<2:
  assert len(v)==3 and all(len(set(x))==len(x)for x in v);a,b,c=map(set,v);out=a&b&c if i==0 else len((a&b)|c);p['operationResult']=sorted(out)if i==0 else sorted((a&b)|c)
 elif i in[2,3]:total,a,b=v;t=a+b-total;cells=two(total,a,b,t,0);out=cells[0]if i==2 else t
 elif i in[4,12]:total,a,b,t=v;out=total-a-b+t;two(total,a,b,t,out)
 elif i==5:total,a,b,none=v;out=a+b-total+none;two(total,a,b,out,none)
 elif i==6:total,a,b,c,ab,ac,bc,t=v;out=total-a-b-c+ab+ac+bc-t;three(total,a,b,c,ab,ac,bc,t,out)
 elif i==7:total,a,b,c,ab,ac,bc,t,none=v;cells=three(total,a,b,c,ab,ac,bc,t,none);out=cells[0]
 elif i==8:
  total,t=v;assert 'жартысы'in r['statement'].lower()and'үштен бір'in r['statement'].lower()and total%6==0;a,b=total//2,total//3;out=total-a-b+t;two(total,a,b,t,out)
 elif i==9:
  total,t,ab,ac,bc=v;paironly=[ab-t,ac-t,bc-t];assert min(paironly)>=0;out=total-sum(paironly)-t;assert out>=0;p['pairOnlyRegions']=paironly;p['allFeasibleSingletonCounts']=[[a,b,out-a-b]for a in range(out+1)for b in range(out-a+1)]
 elif i==10:total,a,b,c,ab,ac,bc=v;out=total-a-b-c+ab+ac+bc;three(total,a,b,c,ab,ac,bc,out,0)
 elif i==11:total,a,b,c,ab,ac,bc,t=v;cells=three(total,a,b,c,ab,ac,bc,t,0);out=sum(cells[:3])
 else:raise AssertionError(i)
 p['calculatedAnswer']=sorted(out)if isinstance(out,set)else out;return out,p

def figure(r,i,v,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());assert json.loads(ids['actual-inputs'].text)==v
 def txt(id):return''.join(ids[id].itertext())
 for j,x in enumerate(v):assert txt('input-'+str(j))==('ABC'[j]+' = {'+'; '.join(map(str,x))+'}'if i<2 else LABELS[i][j]+': '+str(x))
 n=3 if i in[0,1,6,7,9,10,11]else 2;circles=[]
 for j in range(n):
  el=ids['set-'+str(j)];assert el.tag.endswith('circle');x,y,rad=map(F,[el.get(k)for k in['cx','cy','r']]);assert 15<=x-rad and x+rad<=345 and 15<=y-rad and y+rad<=273;circles.append((x,y,rad));assert txt('set-label-'+str(j))=='ABC'[j]
 for x,y,rad in circles:
  assert (x-180)**2+(y-(135 if n==3 else 135))**2<rad**2
 for a in range(n):
  for b in range(a):
   x,y,rad=circles[a];u,w,s=circles[b];assert(rad-s)**2<(x-u)**2+(y-w)**2<(rad+s)**2
 return True

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out);opts=C.C.choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and sum(x==out for x in vals)==1 and len({str(sorted(x)if isinstance(x,set)else x)for x in vals})==4;p['allActualOptions']=[sorted(x)if isinstance(x,set)else x for x in vals]
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+',r['solution']):assert len({E.calc(s.replace('−','-'))for s in chain.split('=')})==1,chain
 return p

def changed(r,i):
 cr=copy.deepcopy(r);cr.pop('options',None);cr['solution']='Жаңа тексерілген нәтиже.'
 if i==0:cr['statement']=cr['statement'].replace('12','13')
 elif i==1:cr['statement']=cr['statement'].replace('84; 98','84; 98; 112')
 elif i in[7,11]:
  parts=H.math_parts(cr['statement'],False)
  for j in[0,1]:cr['statement']=cr['statement'].replace('«'+parts[j]+'»','«'+str(int(parts[j])+1)+'»',1)
 else:
  parts=H.math_parts(cr['statement'],False);cr['statement']=cr['statement'].replace('«'+parts[0]+'»','«'+str(int(parts[0])+(6 if i==8 else 1))+'»',1)
 out,_=compute(cr,i);cr['answer']='{'+ '; '.join(map(str,sorted(out)))+'}'if isinstance(out,set)else str(out);assert representation(r['answer'],i)!=out;return cr

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==13;entries=[];evidence=[];choices=0;exact=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])and q['solution']
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('staleKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes()
  for kind in['input','geometry']:
   tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')}
   if kind=='input':ids['input-0'].text='999'
   else:ids['set-1'].set('cx','500')
   wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
   try:figure(bad,i,parse(r,i),wrong)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('rehashedCorruptionAccepted',i,kind))
  for expr in H.math_parts(q['solution'],True):
   if '='not in expr:continue
   try:vals=[N.exact_power_arithmetic(s)for s in expr.split('=')]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(vals))==1,('sourceArithmetic',i,expr);exact+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'13 own SVGs rendered343px inspected; source13 inspected; visible sets and numbers, pairwise and triple overlap, containment checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==20
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':13,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':13,'nativeSVGs':13,'actualInputMutationsChecked':13,'updatedHashWrongVisibleInputsRejected':13,'rehashedInvalidVennGeometryRejected':13,'sourceExactArithmeticEqualities':exact,'pythonJavaScriptHashesMatched':13,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
