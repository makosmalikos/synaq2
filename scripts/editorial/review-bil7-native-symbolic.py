"""All5fullsource/newconditions official/newsolutions/all25source/newchoices,
sourcebitmaps and4native343pxPNGs read. Actualprintedfigure/tablegivens and
explicitfinitepatternfamilies checked. Sameauthor separate computation,
notanotherhumanreviewer. Noautomatedsourcebitmaptracingclaim.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil7-native-symbolic';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;one=B.one;W=M.W;ids=M.ids
def near(a,b):assert abs(float(a-b))<1e-6
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def regular(el):
 ps=M.points(el);assert len(ps)==len(set(ps))>=3;center=tuple(sum(p[j]for p in ps)/len(ps)for j in range(2));radii=[dot(sub(v,center),sub(v,center))for v in ps];edges=[dot(sub(a,b),sub(a,b))for a,b in zip(ps,ps[1:]+ps[:1])];assert min(edges)>0
 for v in radii:near(v,radii[0])
 for v in edges:near(v,edges[0])
 turns=[cross(sub(b,a),sub(c,b))for a,b,c in zip(ps,ps[1:]+ps[:1],ps[2:]+ps[:2])];assert all(v>0 for v in turns)or all(v<0 for v in turns);return len(ps),center
def power_rule(values):
 bases=[sum(F(x)for x in row[:3])for row in values];assert min(bases)>1;known=[(a,F(v[3]))for a,v in zip(bases,values)if v[3]!='?'];limit=max(v for a,v in known);powers=[];k=1
 while min(a**k for a,v in known)<=limit:
  if all(a**k==v for a,v in known):powers.append(k)
  k+=1
 exponent=one(powers);unknown=one(j for j,v in enumerate(values)if v[3]=='?');out=bases[unknown]**exponent;return out,{'allActualOuterSums':list(map(str,bases)),'uniqueCommonNaturalExponent':exponent,'allNaturalExponentsThroughMonotoneUpperBoundChecked':k-1}
def table_rule(rows):
 subtract=one(j for j in range(3)if all(F(v[3])==math.prod(F(v[k])for k in range(3)if k!=j)-F(v[j])for v in rows if v[3]!='?'));unknown=one(v for v in rows if v[3]=='?');out=math.prod(F(unknown[k])for k in range(3)if k!=subtract)-F(unknown[subtract]);return out,{'allThreeMultiplyTwoSubtractOnePositionRulesChecked':3,'uniqueSubtractedInputPosition':subtract,'allActualTableRows':rows}
def difference_rule(rows):
 computed=[list(map(F,rows[-1]))]
 while len(computed[0])>1:computed.insert(0,[a-b for a,b in zip(computed[0],computed[0][1:])])
 unknown=[]
 for row,vals in enumerate(rows):
  assert len(vals)==row+1
  for col,v in enumerate(vals):
   if v=='?':unknown.append((row,col))
   else:assert F(v)==computed[row][col]
 row,col=one(unknown);return computed[row][col],{'allActualDifferencePyramidRows':[list(map(str,v))for v in computed],'actualUniqueMissingCell':[row,col],'allKnownCellsAndEveryAdjacentDifferenceReplayed':True}
def diagonal_rule(rows):
 def eval(v,j):a,b,c,d=map(F,v[:4]);return abs(a-d)*(b+c)if j==0 else abs(b-c)*(a+d)
 selected=one(j for j in[0,1]if all(eval(v,j)==F(v[4])for v in rows if v[4]!='?'));last=one(v for v in rows if v[4]=='?');return eval(last,selected),{'bothDiagonalDifferenceSumAssignmentsEnumerated':2,'uniqueDiagonalAssignmentIndex':selected,'allActualFourCornerNumbersAndResults':rows}
def weighted_rule(rows,outputs):
 operations=[lambda v,n:v*n,lambda v,n:v/n,lambda v,n:n/v];selected=one(j for j,fn in enumerate(operations)if all(sum(fn(v,n)for n,v in row)==F(out)for row,out in zip(rows,outputs)if out!='?'));missing=one(j for j,v in enumerate(outputs)if v=='?');out=sum(operations[selected](v,n)for n,v in rows[missing]);return out,{'allMultiplyOrTwoDirectedDivisionRulesChecked':3,'uniquePolygonValueRuleIndex':selected,'allActualPolygonSideCountsAndInternalValues':[[[n,str(v)]for n,v in row]for row in rows]}
def target(r,i,src=False,data=None):
 p={}
 if src:
  manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(r['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p['sourceRasterSHA256']=asset['sha256'];p['sourceGivensAndTopologyVisuallyReadNotRasterTrace']=True
 elif i!=9:root=W.svg(r,data);d=ids(root)
 if i==7:
  if src:values=[[3,1,2,36],[2,3,3,64],[3,3,4,'?']]
  else:
   values=[]
   for j in range(3):
    ps=M.points(d['triangle-'+str(j)]);assert len(ps)==3 and ps[1][1]==ps[2][1]>ps[0][1]and ps[1][0]<ps[0][0]<ps[2][0];cx=ps[0][0];cy=F(d['middle-circle-'+str(j)].attrib['cy']);assert F(d['middle-circle-'+str(j)].attrib['cx'])==cx and F(d['middle-circle-'+str(j)].attrib['r'])>0;v=[]
    for role in['left','right','base','middle']:
     label=d[f'triangle-{j}-{role}'];x,y=F(label.attrib['x']),F(label.attrib['y'])
     if role=='left':assert x<cx and ps[0][1]<y<cy
     elif role=='right':assert x>cx and ps[0][1]<y<cy
     elif role=='base':assert x==cx and y>ps[1][1]
     else:assert x==cx and y==cy+6
     v.append(label.text)
    values.append(v)
  out,q=power_rule(values);p.update(q)
 elif i==9:
  if src:rows=[[4,3,7,5],[5,4,6,14],[3,6,12,6],[5,4,9,'?']]
  else:
   lines=[v for v in r['statement'].splitlines()if v.startswith('|')];cells=[[v.strip()for v in line.strip('|').split('|')]for line in lines];assert len(cells)==6 and cells[0]==['1-сан','2-сан','3-сан','Нәтиже']and cells[1]==['---']*4 and all(len(v)==4 for v in cells);rows=cells[2:];p['accessibleNativeTableCells']=cells
  out,q=table_rule(rows);p.update(q)
 elif i==22:
  if src:rows=[['5'],['7','2'],['13','?','4'],['30','17','11','7']]
  else:
   rows=[];cells={}
   for row in range(4):
    values=[]
    for col in range(row+1):
     x,y,w,h=M.rect(d[f'difference-cell-{row}-{col}']);assert w==60 and h==40;cells[row,col]=(x,y,w,h);label=d[f'difference-value-{row}-{col}'];assert F(label.attrib['x'])==x+30 and F(label.attrib['y'])==y+27;values.append(label.text)
    rows.append(values)
   for row in range(3):
    for col in range(row+1):
     child=cells[row,col];end=(child[0]+30,child[1]+40)
     for role,parent in[('left',cells[row+1,col]),('right',cells[row+1,col+1])]:assert M.segment(d[f'difference-edge-{row}-{col}-{role}'])==(parent[0]+30,parent[1],*end)
   p['allTenActualCellsAndTwelveDifferenceParentEdgesChecked']=True
  out,q=difference_rule(rows);p.update(q)
 elif i==25:
  if src:rows=[[5,8,4,7,24],[9,6,2,5,32],[4,5,6,7,'?']]
  else:
   rows=[]
   for j in range(3):
    c=d['diagonal-circle-'+str(j)];cx,cy,rr=[F(c.attrib[k])for k in['cx','cy','r']];assert rr>0;values=[]
    for role in['ul','ur','ll','lr','middle']:
     label=d[f'diagonal-{j}-{role}'];x,y=F(label.attrib['x']),F(label.attrib['y']);assert (x<cx if role.endswith('l') else x>cx)if role!='middle'else x==cx;assert (y<cy if role.startswith('u') else y>cy)if role!='middle'else y==cy+7;values.append(label.text)
    rows.append(values)
  out,q=diagonal_rule(rows);p.update(q)
 elif i==33:
  if src:rows=[[(3,F(2)),(4,F(3))],[(5,F(6)),(3,F(5))],[(5,F(7)),(3,F(6)),(4,F(5))]];outputs=['18','45','?']
  else:
   rows=[];outputs=[]
   for row in range(3):
    shapes=sorted((k,v)for k,v in d.items()if re.fullmatch(f'weighted-{row}-[0-9]+',k));assert len(shapes)==(3 if row==2 else 2);values=[]
    for j,(key,el)in enumerate(shapes):
     sides,center=regular(el);label=d[f'weighted-value-{row}-{j}'];near(F(label.attrib['x']),center[0]);near(F(label.attrib['y'])-6,center[1]);value=F(label.text);assert value>0;values.append((sides,value))
     if j+1<len(shapes):assert d[f'plus-{row}-{j}'].text=='+'
    assert d['equals-'+str(row)].text=='=';rows.append(values);outputs.append(d['weighted-result-'+str(row)].text)
  out,q=weighted_rule(rows,outputs);p.update(q)
 else:raise AssertionError(i)
 p['target']=str(out);return out,p
def solve(r,i,src=False,data=None):out,p=target(r,i,src,data);p.update(B.checked_choices(r,out));return p
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==5;entries=[];evidence=[];targets={7:F(169),9:F(17),22:F(8),25:F(65),33:F(79)}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  cr=copy.deepcopy(r);root=W.svg(r)if i!=9 else None;d=ids(root)if root is not None else{}
  if i==7:d['triangle-2-base'].text='5'
  elif i==9:cr['statement']=cr['statement'].replace('| 6 | 5 | 12 | ? |','| 6 | 5 | 13 | ? |')
  elif i==22:
   for key,value in{'3-2':'15','2-2':'7','1-0':'9','1-1':'1','0-0':'8'}.items():d['difference-value-'+key].text=value
  elif i==25:d['diagonal-2-ul'].text='4'
  elif i==33:d['weighted-value-2-2'].text='5'
  raw=ET.tostring(root)if root is not None else None
  if raw is not None:cr['figureSha256']=hashlib.sha256(raw).hexdigest()
  new=targets[i];old=F(proof['target']);cr['options']=[str(B.scalar(v)+new-old)for v in cr['options']]
  for bad,bs in[({**r,'answer':'99999'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,False,bs)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:proof['validChangedActualGivensTarget']=solve({**cr,'answer':str(new)},i,False,raw)['target']
  except Exception as e:raise AssertionError(('changedvalid',i))from e
  bad=copy.deepcopy(r);br=W.svg(r)if i!=9 else None;bd=ids(br)if br is not None else{}
  if i==7:bd['triangle-2-base'].set('y','200')
  elif i==9:bad['statement']=bad['statement'].replace('| 6 | 4 | 9 | 15 |','| 6 | 4 | 9 | 16 |')
  elif i==22:bd['difference-edge-0-0-left'].set('x2','999')
  elif i==25:bd['diagonal-0-middle'].text='29'
  elif i==33:
   ps=M.points(bd['weighted-0-0']);ps[0]=(ps[0][0]+1,ps[0][1]);bd['weighted-0-0'].set('points',' '.join(f'{float(x)},{float(y)}'for x,y in ps))
  bs=ET.tostring(br)if br is not None else None
  if bs is not None:bad['figureSha256']=hashlib.sha256(bs).hexdigest()
  try:solve(bad,i,False,bs)
  except(AssertionError,ValueError):proof['malformedActualGeometryOrInconsistentGivensRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All5fullsource/newconditions official/newsolutions/all25source/newchoices/sourcebitmaps/4native343pxPNGsread. Actualallnumbers/relativepositions/circlecenters/pyramidcells/12edges/regularpolygons/values/operators andaccessibleMDtablecells parsed. Explicitfinitepatternfamilies: naturalexponentsuntilmonotonebound, 3product-minus-subtractpositions, alldifferencecells, 2diagonalassignments, multiply/twodirecteddivisions weighedbyactualpolygonsides. ChangedactualgivensnativeSVG/tablecanariesrejectoldkeyandacceptrecomputedtarget; malformedgeometry/inconsistentexamplesreject. Noarbitrarypatternuniquenessclaim. Sameauthornotanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'OwnnativeSVG actualallcells/edges/polygons/labels checked;343pxPNGinspected;nosourcebitmap/tracing.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':5,'sourceOptionsRead':25,'rewrittenOptionsRead':25,'nativeFigures':4,'accessibleNativeTables':1,'validChangedActualInputsRecomputed':5,'malformedActualGeometryOrGivensRejected':5,'pythonJavaScriptHashesMatched':5,'remainingBIL7SourceVisualTasks':[11,17,18,19,20,34,40,48],'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
