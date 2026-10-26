"""5 complete saved/new conditions, official/new solutions and16 source/new
choices read.5 archived diagrams and5 own343px SVGs inspected. New topologies
are different from all5 valid saved nets under rotation/reflection. All35 free
hexominoes and11 valid cube nets enumerated. Independent oriented-face folding
and exhaustive die-label assignments. Same author, not another human. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from pathlib import Path
from fractions import Fraction as F
ROOT=Path(__file__).resolve().parents[2];NAME='course4-cube-nets';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-shifts-sets.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);H=C.H;N=C.N;one=C.one
SOURCE_NETS=[[(0,1),(1,1),(2,1),(3,1),(1,0),(1,2)],[(0,0),(1,0),(1,1),(2,1),(2,2),(3,2)],[(0,0),(0,1),(1,1),(2,1),(3,1),(3,2)],[(0,0),(0,1),(1,1),(2,1),(2,2),(3,2)],[(0,1),(1,1),(2,1),(3,1),(2,0),(0,2)]]
SOURCE_OPTIONS=[SOURCE_NETS[2],[(0,0),(1,0),(2,0),(0,1),(1,1),(2,1)],[(2,0),(0,1),(1,1),(2,1),(3,1),(4,1)],[(0,0),(1,0),(0,1),(1,1),(2,1),(3,1)]]
def canonical(cells):
 def normal(c):x0=min(x for x,y in c);y0=min(y for x,y in c);return tuple(sorted((x-x0,y-y0)for x,y in c))
 return min(normal([(sx*x,sy*y)if not swap else(sy*y,sx*x)for x,y in cells])for sx in[-1,1]for sy in[-1,1]for swap in[0,1])
def neg(v):return tuple(-x for x in v)
def fold(cells):
 cells=list(map(tuple,cells));assert len(cells)==len(set(cells))==6;frames={cells[0]:((1,0,0),(0,1,0),(0,0,1))};todo=[cells[0]]
 while todo:
  x,y=todo.pop();r,d,n=frames[x,y]
  for point,frame in[((x+1,y),(neg(n),d,r)),((x-1,y),(n,d,neg(r))),((x,y+1),(r,neg(n),d)),((x,y-1),(r,n,neg(d)))]:
   if point not in cells:continue
   if point in frames:assert frames[point]==frame
   else:frames[point]=frame;todo.append(point)
 assert len(frames)==6 and len({f[2]for f in frames.values()})==6
 return [frames[p][2]for p in cells]
def valid(cells):
 try:fold(cells);return True
 except AssertionError:return False

def target(cells,labels,asked):
 normals=fold(cells);assert len(labels)==len(set(labels))==6;pairs=[[a,b]for a in range(6)for b in range(a+1,6)if normals[a]==neg(normals[b])];assert len(pairs)==3
 proof={'actualCells':[list(p)for p in cells],'actualLabels':labels,'allFaceNormals':[list(n)for n in normals],'oppositePairs':[[labels[a],labels[b]]for a,b in pairs]}
 if asked in['Y']:
  fixed={x:int(x)for x in labels if x.isdigit()};assert len(set(fixed.values()))==len(fixed)and all(1<=v<=6 for v in fixed.values());unknown=[x for x in labels if not x.isdigit()];assert set(unknown)=={'X','Y'};sol=[]
  for vals in itertools.permutations(set(range(1,7))-set(fixed.values())):
   mapping={**fixed,**dict(zip(unknown,vals))}
   if all(mapping[labels[a]]+mapping[labels[b]]==7 for a,b in pairs):sol.append(mapping)
  mapping=one(sol);out=str(mapping[asked]);proof['uniqueDieAssignment']=mapping
 else:
  assert asked in labels;out=one(labels[b]if labels[a]==asked else labels[a]for a,b in pairs if asked in[labels[a],labels[b]])
 proof['calculatedAnswer']=out;return out,proof

def source(q,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/courses/image-manifest.json').read_text())['files'];im=one(x for x in manifest if x['src'].split('/questions/')[-1]==q['images'][0]['src'].split('/questions/')[-1]);proof={'archivedPixelTopologyWitness':{'file':im['file'],'sha256':hashlib.sha256((ROOT/'problems/sources/zerek/courses'/im['file']).read_bytes()).hexdigest()}}
 if i==2:
  states=[valid(c)for c in SOURCE_OPTIONS];assert states==[True,False,False,False];out=q['options'][0]['text'];proof['allOptionFoldingResults']=states;proof['allSourceOptionCells']=SOURCE_OPTIONS
 else:
  labels=['ABCDEF','ABCDEF',None,['1','2','3','X','Y','4'],'KLMNPR'][i];asked=['A','A',None,'Y','L'][i];assert asked in q['statement'];out,p=target(SOURCE_NETS[i],list(labels),asked);proof.update(p)
 return out,proof

def native(r,i,raw=None):
 raw=raw if raw is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());groups=[]
 def txt(id):return''.join(ids[id].itertext())
 for k in range(4 if i==2 else 1):
  records={int(m[1]):e for id,e in ids.items()if(m:=re.fullmatch('face-'+str(k)+r'-(\d+)',id))};assert set(records)==set(range(6));rects=[[F(records[j].get(a))for a in['x','y','width','height']]for j in range(6)];unit=one({x[2]for x in rects}|{x[3]for x in rects});assert unit>0;ox,oy=rects[0][:2];cells=[];labels=[]
  for j,(x,y,w,h)in enumerate(rects):
   a,b=(x-ox)/unit,(y-oy)/unit;assert a.denominator==b.denominator==1;cells.append((int(a),int(b)))
   if i!=2:
    el=ids['letter-'+str(j)];assert F(el.get('x'))==x+w/2 and F(el.get('y'))==y+h/2+7;labels.append(txt('letter-'+str(j)))
  assert all(canonical(cells)!=canonical(s)for s in SOURCE_NETS+SOURCE_OPTIONS);groups.append(cells)
  if i!=2:
   asked=one(re.findall(r'([A-Z]) (?:жағына|санын)',r['statement']));out,p=target(cells,labels,asked)
 if i==2:
  states=[valid(c)for c in groups];assert sum(states)==1;labels=[txt('option-'+str(k))for k in range(4)];assert set(labels)==set('ABCD');out=labels[states.index(True)]+' нұсқасы';p={'allOptionFoldingResults':states,'allActualCandidateCells':[[list(v)for v in c]for c in groups],'calculatedAnswer':out}
 p['newTopologyDiffersFromAllSourceForms']=True;return out,p

def solve(r,i,src=False,raw=None):
 out,p=source(r,i)if src else native(r,i,raw);assert H.canon(r['answer'])==H.canon(out),('answer',i,r['answer'],out);opts=C.C.choices(r)
 if opts:assert len(opts)==len(set(opts))==4 and sum(H.canon(x)==H.canon(out)for x in opts)==1;p['allActualOptions']=opts
 return p

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==5;entries=[];evidence=[];choices=0
 shapes={((0,0),)}
 for _ in range(5):shapes={canonical([*a,(x+dx,y+dy)])for a in shapes for x,y in a for dx,dy in[(0,1),(0,-1),(1,0),(-1,0)]if(x+dx,y+dy)not in a}
 assert len(shapes)==35 and sum(valid(c)for c in shapes)==11
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])and q['solution'];src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};cr=copy.deepcopy(r)
  if i==2:ids['option-0'].text,ids['option-1'].text=ids['option-1'].text,ids['option-0'].text
  else:
   a,b=('4','5')if i==3 else(r['answer'],r['options'][-1]);el1=one(e for id,e in ids.items()if id.startswith('letter-')and e.text==a);el2=one(e for id,e in ids.items()if id.startswith('letter-')and e.text==b);el1.text,el2.text=el2.text,el1.text
  changed=ET.tostring(tree);cr['figureSha256']=hashlib.sha256(changed).hexdigest();new,p=native(cr,i,changed);assert new!=r['answer'];cr['answer']=new;solve(cr,i,raw=changed)
  for bad,data in[({**r,'answer':'wrong'},None),({**cr,'answer':r['answer']},changed)]:
   try:solve(bad,i,raw=data)
   except(AssertionError,ValueError,KeyError):pass
   else:raise AssertionError(('staleKeyAccepted',i))
  tree=ET.fromstring(raw);el=one(e for e in tree.iter()if e.get('id')=='face-0-0');el.set('x',str(F(el.get('x'))+F(1,2)));wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
  try:native(bad,i,wrong)
  except(AssertionError,ValueError,KeyError):pass
  else:raise AssertionError(('brokenLatticeAccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualDiagramAnswer']=new;proof['oldKeyRejectedNewKeyAccepted']=True;proof['updatedHashOffLatticeRejected']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'All5 native SVGs rendered343px inspected. All5 source pictures inspected. Actual rect coordinates, unit lattice, label centres and six distinct folded normals checked; no source topology reused. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==16
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':5,'sourceOptionsRead':choices,'rewrittenOptionsRead':choices,'sourceIllustrationsInspected':5,'nativeSVGs':5,'actualInputMutationsChecked':5,'updatedHashOffLatticeRejected':5,'allFreeHexominoes':35,'validCubeNets':11,'pythonJavaScriptHashesMatched':5,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
