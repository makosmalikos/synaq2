"""All24 frozen/new full conditions official/new solutions and24source rasters
read. All24 own SVGs inspected at343px after widening top-group separation.
Actual cells, geometric placement, pyramid adjacency and semantic positions
independently recomputed. Source art not traced/reused. Same author computation,
not a second human. Open responses retained, localStandard+ only.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='logic-figures';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('a','scripts/editorial/review-logic-rings.py');A=importlib.util.module_from_spec(sp);sp.loader.exec_module(A);W=A.W;ids=A.ids;one=A.one;B=A.B;H=A.H;E=A.E;N=A.N;M=A.A.M;points=A.A.points;segment=A.A.segment;close=A.close
# Clockwise/corner/limb inventories read from original rasters; only values and
# semantic topology are recorded here. New native geometry is unrelated.
SOURCE={
(1,10):('pyramid','add',[[12,7,7,1],[8,3,1,7]],None),(1,11):('pyramid','add',[[1,6,10,11],[3,9,11,11]],None),(1,12):('pyramid','add',[[6,2,2,7],[11,9,3,5]],None),
(1,13):('star','sum',[[2,10,10,5,2,8],[7,9,6,12,5,11],[11,11,7,6,2,12]],[37,50,None]),(1,14):('star','sum',[[3,10,8,12,11,1],[6,4,8,4,6,9],[6,11,9,12,10,1]],[45,37,None]),(1,15):('star','sum',[[8,4,8,10,12,3],[6,1,3,10,1,10],[9,12,1,3,11,12]],[45,31,None]),(1,16):('star','sum',[[3,6,3,12,3,5],[11,3,10,7,10,12],[12,5,9,4,1,11]],[32,53,None]),
(1,20):('circle','vertical-product-plus-sides',[[2,7,2,8],[5,3,8,9],[5,6,1,6]],[24,32,None]),
(2,1):('circle','opposite-sums-product',[[9,5,8,3],[4,5,5,7],[6,8,6,6]],[154,108,None]),(2,2):('circle','opposite-sums-product',[[9,9,2,6],[4,9,8,2],[5,1,3,4]],[144,130,None]),
(2,5):('triangle','bottom-sum-times-top',[[8,7,4],[8,9,1],[7,6,9]],[88,80,None]),(2,6):('triangle','sum',[[8,7,7],[4,9,8],[6,8,3]],[22,21,None]),(2,7):('triangle','top-times-left-plus-right',[[4,6,3],[6,7,7],[6,9,5]],[27,49,None]),(2,8):('triangle','sum',[[9,4,1],[6,7,2],[7,1,3]],[14,15,None]),
(2,9):('square','sum',[[4,4,8,3],[3,4,1,9],[4,6,4,9]],[19,17,None]),(2,10):('square','side-sums-product',[[3,7,2,6],[7,5,1,9],[3,4,9,4]],[65,112,None]),
(2,11):('star','sum',[[1,1,10,1,1,4],[12,8,4,3,4,7],[3,8,3,7,None,5]],[18,38,30]),(2,12):('star','sum',[[10,4,8,6,4,11],[11,12,7,6,5,1],[7,9,6,8,8,None]],[43,42,39]),
(2,13):('triangle','product',[[1,7,5],[3,8,4],[3,2,6]],[35,96,None]),(2,14):('triangle','product',[[7,1,1],[8,4,8],[8,1,5]],[7,256,None]),
(2,15):('square','top-sum-times-bottom-difference',[[1,8,5,4],[5,7,6,4],[2,6,5,1]],[9,24,None]),(2,16):('butterfly','diagonal-products-sum',[[3,7,5,5],[5,4,7,5],[7,1,9,2]],[50,53,None]),(2,17):('robot','hands-product-plus-feet',[[4,9,8,8],[1,2,7,8],[6,3,2,6]],[52,17,None]),(2,18):('pyramid','multiply',[[4,4,4],[4,3,4]],None)}

def apply(k,a):
 if k=='sum':return sum(a)
 if k=='product':return math.prod(a)
 if k in['vertical-product-plus-sides','hands-product-plus-feet']:return a[0]*a[1]+a[2]+a[3]
 if k=='opposite-sums-product':return(a[0]+a[1])*(a[2]+a[3])
 if k=='bottom-sum-times-top':return a[0]*(a[1]+a[2])
 if k=='top-times-left-plus-right':return a[0]*a[1]+a[2]
 if k=='side-sums-product':return(a[0]+a[2])*(a[1]+a[3])
 if k=='top-sum-times-bottom-difference':return(a[0]+a[1])*(a[2]-a[3])
 if k=='diagonal-products-sum':return a[0]*a[3]+a[1]*a[2]
 raise AssertionError(k)
def pyramid(base,k):
 rows=[base]
 while len(rows[-1])>1:rows.append([(a+b if k=='add'else a*b)for a,b in zip(rows[-1],rows[-1][1:])])
 return rows

def match(a,b):assert len(a)==len(b)and all(close(x,y)for x,y in zip(a,b)),(a,b)
def coords(el,baseline=6):return F(el.attrib['x']),F(el.attrib['y'])-baseline
def center(el):return tuple(F(el.attrib[k])for k in['cx','cy'])
def polar(x,y,r,a):return(float(x)+r*math.cos(a),float(y)+r*math.sin(a))
def readnum(el):return None if el.text=='?'else F(el.text)
def kind_from_statement(s):
 if'кірпіштегі'in s:return'add'if'қосындысына'in s else'multiply'
 if'барлық сыртқы'in s:return'sum'
 if'үш сыртқы'in s:return'product'
 if'көбейтіндісіне сол'in s:return'vertical-product-plus-sides'
 if'жоғарғы мен төменгі сандар қосындысын'in s:return'opposite-sums-product'
 if'төменгі екі санның қосындысын'in s:return'bottom-sum-times-top'
 if'жоғарғы санды сол'in s:return'top-times-left-plus-right'
 if'сол жақ екі санның қосындысын'in s:return'side-sums-product'
 if'жоғарғы екі санның қосындысын'in s:return'top-sum-times-bottom-difference'
 if'диагональ'in s:return'diagonal-products-sum'
 if'Робот'in s:return'hands-product-plus-feet'
 raise AssertionError(s)

def decode(r,data=None):
 root=W.svg(r,data);d=ids(root);kind=kind_from_statement(r['statement']);p={'allActualLabelPositionsAndSemanticRolesChecked':True};groups=[];outputs=[]
 if'brick-0-0-0'in d:
  shape='pyramid';allLevels=[]
  for g in range(2):
   keys=[(int(m[1]),int(m[2]),el)for key,el in d.items()if(m:=re.fullmatch(r'brick-'+str(g)+r'-(\d+)-(\d+)',key))];n=sum(l==0 for l,j,el in keys);assert n in[3,4];levels=[];geometry=[]
   for l in range(n):
    row=[];rects=[]
    for j in range(n-l):
     el=d[f'brick-{g}-{l}-{j}'];x,y,w,h=M.rect(el);assert w==60 and h==40;label=d[f'brick-value-{g}-{l}-{j}'];match(coords(label,7),(x+w/2,y+h/2));row.append(readnum(label));rects.append((x,y,w,h))
    if l==0:assert all(rects[j+1][0]==rects[j][0]+60 and rects[j+1][1]==rects[j][1]for j in range(n-1))
    else:
     below=geometry[-1]
     for j,(x,y,w,h)in enumerate(rects):assert x==below[j][0]+30 and y==below[j][1]-40 and below[j+1][0]==below[j][0]+60
    geometry.append(rects);levels.append(row)
   assert len(keys)==sum(range(1,n+1));assert all(v is not None for row in levels[:-1]for v in row);allLevels.append(levels)
  p['allActualNativePyramidLevels']=[[[str(v)if v is not None else'?'for v in row]for row in levels]for levels in allLevels];p['allPyramidCellCentersAndAboveTwoBelowAdjacenciesChecked']=True;return root,shape,kind,allLevels,None,p
 for g in range(3):
  out=d['output-'+str(g)];oc=d['output-cell-'+str(g)];C=center(oc);assert F(oc.attrib['r'])in[22,25];match(coords(out,7),C);outputs.append(readnum(out));positions=[]
  if'shape-'+str(g)in d:
   el=d['shape-'+str(g)];tag=el.tag.split('}')[-1]
   if tag=='polygon':
    ps=points(el)
    if len(ps)==12:
     shape='star';x,y=C;rs=[math.hypot(float(a-x),float(b-y))for a,b in ps];assert all(close(v,68 if j%2==0 else 36)for j,v in enumerate(rs));angles=[-math.pi/2+j*math.pi/6 for j in range(12)]
     for j,point in enumerate(ps):match(point,polar(x,y,68 if j%2==0 else 36,angles[j]))
     positions=[polar(x,y,83,-math.pi/2+j*math.pi/3)for j in range(6)]
    else:
     shape='triangle';assert len(ps)==3;T,L,R=ps;assert L[1]==R[1]and L[0]<T[0]<R[0]and L[0]+R[0]==2*T[0];height=L[1]-T[1];width=R[0]-L[0];assert min(height,width)>0;match(C,((T[0]+L[0]+R[0])/3,(T[1]+L[1]+R[1])/3));positions=[(T[0],T[1]+height*F(29,120)),(L[0]+width*F(27,136),L[1]-height*F(18,120)),(R[0]-width*F(27,136),R[1]-height*F(18,120))]
   elif tag=='rect':
    shape='square';x,y,w,h=M.rect(el);assert w==h>0;match(C,(x+w/2,y+h/2));positions=[(x+w/6,y+h/6),(x+5*w/6,y+h/6),(x+w/6,y+5*h/6),(x+5*w/6,y+5*h/6)]
   else:
    shape='circle';assert tag=='circle';match(center(el),C);radius=F(el.attrib['r']);assert radius>F(oc.attrib['r']);x,y=C
    for j in range(4):a,b,c,e=segment(d[f'ray-{g}-{j}']);match((a,b),C);match((c,e),polar(x,y,float(radius),-3*math.pi/4+j*math.pi/2))
    dist=radius*F(47,70);positions=[(x,y-dist),(x,y+dist),(x-dist,y),(x+dist,y)]
  elif'wing-'+str(g)+'-0'in d:
   shape='butterfly';x,y=C
   for j,(sx,sy)in enumerate([(-1,-1),(1,-1),(-1,1),(1,1)]):ps=points(d[f'wing-{g}-{j}']);assert len(ps)==3;match(ps[0],C);match(ps[1],(x+sx*70,y+sy*57));match(ps[2],(x+sx*70,y+sy*14));positions.append((x+sx*56,y+sy*42))
  else:
   shape='robot';bx,by,w,h=M.rect(d['body-'+str(g)]);assert w==44 and h==48;x=bx+w/2;y=by+25;match(C,(x,y-52));assert F(oc.attrib['r'])==22;match(segment(d['neck-'+str(g)]),(x,y-30,x,by));starts=[(bx,by+9),(bx+w,by+9),(bx+12,by+h),(bx+32,by+h)]
   for j in range(4):a,b,c,e=segment(d[f'limb-{g}-{j}']);match((a,b),starts[j]);cell=d[f'limb-cell-{g}-{j}'];match(center(cell),(c,e));assert F(cell.attrib['r'])==16;positions.append((c,e))
   assert positions[0][0]<bx and positions[1][0]>bx+w and by<positions[0][1]<by+h and positions[0][1]==positions[1][1];assert positions[2][0]<x<positions[3][0]and positions[2][1]==positions[3][1]>by+h
  row=[]
  for j,pos in enumerate(positions):el=d[f'value-{g}-{j}'];match(coords(el),pos);row.append(readnum(el))
  assert sum(key.startswith('value-'+str(g)+'-')for key in d)==len(positions);groups.append(row)
 p['actualNativeSemanticInputGroups']=[[str(v)if v is not None else'?'for v in row]for row in groups];p['actualNativeOutputLabels']=[str(v)if v is not None else'?'for v in outputs];return root,shape,kind,groups,outputs,p

def calculate(shape,kind,groups,outputs):
 p={}
 if shape=='pyramid':
  full=[]
  for g,levels in enumerate(groups):
   rebuilt=pyramid(levels[0],kind);assert len(rebuilt)==len(levels)and all(len(a)==len(b)and all(v is None or v==expected for v,expected in zip(a,b))for a,b in zip(levels,rebuilt));assert sum(v is None for row in levels for v in row)==int(g==1)and(g==0 or levels[-1]==[None]);full.append(rebuilt)
  out=full[1][-1][0];p['allRecomputedFullPyramids']=[[[str(v)for v in row]for row in levels]for levels in full];return out,p,full
 full=[];targets=[]
 for g,(row,output)in enumerate(zip(groups,outputs)):
  holes=[j for j,v in enumerate(row)if v is None]
  if holes:
   assert g==2 and shape=='star'and kind=='sum'and output is not None;j=one(holes);row=row[:];row[j]=output-sum(v for v in row if v is not None);assert row[j]>0;targets.append(row[j]);p['unknownTipIndexAndReconstructedValue']=[j,str(row[j])]
  else:assert all(v>0 for v in row)
  expected=apply(kind,row)
  if output is None:assert g==2 and not holes;targets.append(expected)
  else:assert expected==output
  full.append((row,expected))
 out=one(targets);p['allRecomputedCompleteExamples']=[[[str(v)for v in row],str(out)]for row,out in full];return out,p,full

def solve(r,data=None):
 root,shape,kind,groups,outputs,p=decode(r,data);out,z,full=calculate(shape,kind,groups,outputs);p.update(z);assert E.calc(r['answer'])==out and not r.get('options');p['actualShape']=shape;p['actualRule']=kind;p['target']=str(out)
 if shape=='pyramid':
  printed=re.findall(r'\d-пирамида, төменнен жоғары: ([0-9; →]+)',r['solution']);assert len(printed)==2
  for text,levels in zip(printed,full):assert[[E.calc(v)for v in row.strip().split(';')]for row in text.strip().split('→')]==levels
 else:printed=[([E.calc(v)for v in xs.split(';')],E.calc(y))for xs,y in re.findall(r'фигура: \(([^()]+)\) → (\d+)',r['solution'])];assert printed==full,('printedExamples',shape,printed,full)
 return p

def source(q,part,i):
 manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(q['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];shape,kind,raw,outputs=SOURCE[part,i];groups=[[F(v)if v is not None else None for v in row]for row in raw]
 if shape=='pyramid':
  levels=[pyramid(v,kind)for v in groups];assert levels[0][-1][0]=={(1,10):55,(1,11):60,(1,12):25,(2,18):256}[part,i];levels[1][-1]=[None];groups=levels
 out,p,full=calculate(shape,kind,groups,[F(v)if v is not None else None for v in outputs]if outputs else None);assert E.calc(q['answer'])==out;p['target']=str(out);p['sourceRasterSHA256']=asset['sha256'];p['sourceAllPositionsAdjacencyAndNumericalGivensVisuallyReadNotTraced']=True;return p

def changed(r):
 cr=copy.deepcopy(r);root,shape,kind,groups,outputs,_=decode(r);d=ids(root);old=calculate(shape,kind,groups,outputs)[0]
 if shape=='pyramid':
  base=groups[1][0][:];base[0]+=1;rebuilt=pyramid(base,kind)
  for l,row in enumerate(rebuilt[:-1]):
   for j,v in enumerate(row):d[f'brick-value-1-{l}-{j}'].text=str(v)
 else:el=d['value-2-0'];assert el.text!='?';el.text=str(F(el.text)+1)
 raw=ET.tostring(root);cr['figureSha256']=hashlib.sha256(raw).hexdigest();_,_,_,ng,no,_=decode(cr,raw);new,p,full=calculate(shape,kind,ng,no);assert new!=old;cr['answer']=str(new)
 if shape=='pyramid':cr['solution']='. '.join(str(g+1)+'-пирамида, төменнен жоғары: '+' → '.join('; '.join(map(str,row))for row in levels)for g,levels in enumerate(full))+'.'
 else:cr['solution']='. '.join(str(g+1)+'-фигура: ('+'; '.join(map(str,row))+') → '+str(v)for g,(row,v)in enumerate(full))+'.'
 return cr,raw

def malformed_geometry(r):
 root,shape,kind,groups,outputs,p=decode(r);d=ids(root)
 if shape=='pyramid':el=d['brick-0-0-0'];el.set('x',str(F(el.attrib['x'])+1))
 elif shape in['star','triangle','butterfly']:
  el=d['wing-0-0']if shape=='butterfly'else d['shape-0'];ps=points(el);ps[0]=(ps[0][0]+1,ps[0][1]);el.set('points',' '.join(','.join(str(float(x))for x in v)for v in ps))
 elif shape=='circle':el=d['shape-0'];el.set('cx',str(F(el.attrib['cx'])+1))
 elif shape=='square':el=d['shape-0'];el.set('width',str(F(el.attrib['width'])+1))
 else:el=d['limb-0-0'];el.set('x2',str(F(el.attrib['x2'])+1))
 return A.changed_hash(r,root)
def malformed_value(r):
 root,shape,kind,groups,outputs,p=decode(r);d=ids(root);el=d['brick-value-0-0-0']if shape=='pyramid'else d['output-0'];el.text=str(F(el.text)+1);return A.changed_hash(r,root)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==24;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);part=int(r['editionId'].split('-')[-2]);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['images'])==1 and not q['svg']and not q['options'];key=one(re.findall(r'Жауабы:\s*(.*)',q['solution']))
  try:src=source({**q,'answer':key},part,i);proof=solve(r);cr,raw=changed(r)
  except Exception as e:raise AssertionError(('source/new/changed',part,i))from e
  for bad,data in[({**r,'answer':'999999999'},None),({**cr,'answer':r['answer']},raw),malformed_geometry(r),malformed_value(r)]:
   try:solve(bad,data)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badrowaccepted',part,i))
  proof['validChangedActualInputAnswer']=solve(cr,raw)['target'];proof['updatedHashMalformedGeometryAndInconsistentKnownValueRejected']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(values))==1,('sourceOfficialArithmetic',part,i,expr);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All24full saved/new conditions official/new solutions24source rasters read. Actual native pyramid brick extents/centers/two-below adjacency; regular concave six-tip star vertices and positioned values; triangle barycentres and vertex roles; square corners; circle rays/opposite roles; four-wing diagonals; robot head/body/limb attachments and labels independently decoded. All exact known and completed examples and full printed solutions replayed. All24 changed actual inputs reject old keys and accept new answers; malformed updated-hash geometry and inconsistent known labels rejected. Same author computation.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native SVG actual topology/positions/values independently recomputed;343px PNG inspected after increased top-example separation. Source art not traced/reused.'},'notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':24,'nativeFigures':24,'sourceOptionsRead':0,'rewrittenOptionsRead':0,'openResponseTasks':24,'validChangedActualInputsRecomputed':24,'malformedActualGeometryRejected':24,'inconsistentActualKnownValuesRejected':24,'officialSourceArithmeticEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':24,'bothCircularCollectionsCompleteTogetherWithRingsBatch':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
