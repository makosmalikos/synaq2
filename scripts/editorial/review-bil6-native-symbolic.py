"""All8fullsource/newconditions official/newsolutions/all40source/newchoices,
sourcebitmaps and7native343pxPNGs read. Actualnativecontours/labels/edges/cells
drive computation. Sourcevisualgivens reviewed, notautomatedrastertracing.
Same root author separate computationalreview, notanotherhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil6-native-symbolic';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';TOL=1e-6
sp=importlib.util.spec_from_file_location('m','scripts/editorial/review-bil1-native-math.py');M=importlib.util.module_from_spec(sp);sp.loader.exec_module(M);B=M.B;H=B.H;E=B.E;one=B.one;W=M.W;ids=M.ids;points=M.points;rect=M.rect;segment=M.segment
def near(a,b):assert abs(float(a-b))<TOL,(float(a),float(b))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def simple_orthogonal_polygon(ps):
 assert len(ps)>=4 and len(ps)==len(set(ps));edges=list(zip(ps,ps[1:]+ps[:1]))
 for(a,b),(c,d)in zip(edges,edges[1:]+edges[:1]):
  u,v=sub(b,a),sub(d,c);assert (u[0]==0)!=(u[1]==0) and cross(u,v)!=0 and dot(u,v)==0
 for i,(a,b)in enumerate(edges):
  for j,(c,d)in enumerate(edges):
   if j<=i or j==i+1 or(i==0 and j==len(edges)-1):continue
   if a[0]==b[0]and c[0]==d[0]:hit=a[0]==c[0]and max(min(a[1],b[1]),min(c[1],d[1]))<=min(max(a[1],b[1]),max(c[1],d[1]))
   elif a[1]==b[1]and c[1]==d[1]:hit=a[1]==c[1]and max(min(a[0],b[0]),min(c[0],d[0]))<=min(max(a[0],b[0]),max(c[0],d[0]))
   else:
    vert=(a,b)if a[0]==b[0]else(c,d);hori=(c,d)if a[0]==b[0]else(a,b);hit=min(hori[0][0],hori[1][0])<=vert[0][0]<=max(hori[0][0],hori[1][0])and min(vert[0][1],vert[1][1])<=hori[0][1]<=max(vert[0][1],vert[1][1])
   assert not hit
 return len(ps)
def latin(given,target):
 permutations=list(itertools.permutations(range(1,6)));candidates=[[p for p in permutations if all(not value or p[c]==value for c,value in enumerate(row))]for row in given];answers=[]
 def walk(rows,remaining,used):
  if not remaining:answers.append([list(rows[j])for j in range(5)]);return
  possible={r:[p for p in candidates[r]if all(p[c]not in used[c]for c in range(5))]for r in remaining};row=min(remaining,key=lambda r:len(possible[r]))
  for p in possible[row]:walk({**rows,row:p},remaining-{row},[used[c]|{p[c]}for c in range(5)])
 walk({},set(range(5)),[set()for _ in range(5)]);assert answers;out=F(one({a[target[0]][target[1]]for a in answers}));return out,{'allLatinRowPermutationsEnumerated':120,'allCompleteLatinGridsCount':len(answers),'allCompletionValuesAtTarget':sorted(set(a[target[0]][target[1]]for a in answers)),'completeUniqueGridWitness':answers[0]if len(answers)==1 else None,'allPrintedGivens':given,'actualTargetCell':list(target)}
def addition(total):
 values=[];witness=[]
 for number in range(111,1000):
  other=total-number
  if 111<=other<=999 and '0'not in str(number)+str(other):
   values.append(sum(map(int,str(number)+str(other))));witness.append([number,other])
 out=F(one(set(values)));return out,{'allPossibleFirstThreeDigitNumbersWithSecondUniquelyDeterminedChecked':889,'allValidNonzeroDigitAdditionsCount':len(witness),'allValidDigitSums':sorted(set(values)),'positiveThreeDigitAdditionWitness':witness[0],'distinctDigitAssumptionNotIntroduced':True}
def pyramid(top,bottom,known=None):
 a=[(F(1),F(0))if str(v)=='x'else(F(0),F(v))for v in top];rows=[a]
 while len(a)>1:a=[(u[0]+v[0],u[1]+v[1])for u,v in zip(a,a[1:])];rows.append(a)
 coef,const=one(a);assert coef;out=(F(bottom)-const)/coef;computed=[[a*out+b for a,b in row]for row in rows]
 if known:
  for(row,col),value in known.items():assert computed[row][col]==value
 assert computed[-1][0]==bottom;return out,{'actualBottomAffineCoefficientConstant':[str(coef),str(const)],'allReconstructedPyramidValues':[list(map(str,row))for row in computed],'allKnownIntermediateAndBottomCellsReplayed':True}
def polygon_function(sides,inputs,outputs):
 constant=one({F(v)-a*b for a,b,v in zip(sides,inputs,outputs)if v!='?'});missing=one(j for j,v in enumerate(outputs)if v=='?');return sides[missing]*inputs[missing]+constant,{'allActualPolygonEdgeCounts':sides,'actualCommonAdditiveConstant':str(constant),'allThreeKnownFunctionOutputsReplayed':True}
def corners_rule(counts,results):
 multiplier=one({F(v)/count for count,v in zip(counts,results)if v!='?'});missing=one(j for j,v in enumerate(results)if v=='?');assert multiplier>0;return counts[missing]*multiplier,{'allActualContourVertexCounts':counts,'uniqueCommonVertexMultiplier':str(multiplier),'allContoursSimpleOrthogonalWithoutCollinearExtraVertices':True}
def circle_rule(values):
 factor=one({F(values[j+4])/F(values[j])for j in range(4)if values[j]!='?'and values[j+4]!='?'});assert factor>0;missing=one(j for j,v in enumerate(values)if v=='?');assert missing>=4;out=F(values[missing-4])*factor;return out,{'allActualClockwiseSectorValues':values,'uniqueOppositeFactor':str(factor),'actualOppositeMissingSectorIndex':missing}
def triangle_rule(values):
 matches=[j for j in range(3)if all(sum(F(v[k])for k in range(3)if k!=j)-F(v[j])==F(v[3])for v in values if v[3]!='?')];subtract=one(matches);v=one(v for v in values if v[3]=='?');out=sum(F(v[k])for k in range(3)if k!=subtract)-F(v[subtract]);return out,{'allThreePossibleSubtractOneCornerRulesEnumerated':3,'uniqueSubtractedCornerIndex':subtract,'allActualTriangleNumberTuples':values}

def target(r,i,src=False,data=None):
 s=r['statement'];p={}
 if src:
  manifest=json.loads((ROOT/'problems/sources/zerek/image-manifest.json').read_text())['files'];asset=one(v for v in manifest if v['sourceUrl']==one(r['images'])['src']);assert hashlib.sha256((ROOT/'problems/sources/zerek'/asset['file']).read_bytes()).hexdigest()==asset['sha256'];p['sourceRasterSHA256']=asset['sha256'];p['sourceGivensAndTopologyVisuallyReadNotAutomatedRasterTrace']=True
 elif i!=29:root=W.svg(r,data);d=ids(root)
 if i==11:
  if src:counts=[12,6,8];results=['24','12','?'];p['sourceH12L6T8CornerCountsReadFromCompleteContours']=True
  else:counts=[simple_orthogonal_polygon(points(d['glyph-'+str(j)]))for j in range(3)];results=[d['glyph-result-'+str(j)].text for j in range(3)]
  out,q=corners_rule(counts,results);p.update(q)
 elif i==14:
  if src:top=[8,9,10,'x'];bottom=F(75);known={(1,0):F(17)}
  else:
   top=[];known={};cells={};values={}
   for row in range(4):
    for col in range(4-row):
     key=f'{row}-{col}';x,y,w,h=rect(d['pyramid-cell-'+key]);assert w==60 and h==42;cells[row,col]=(x,y,w,h);label=d['pyramid-value-'+key];assert F(label.attrib['x'])==x+w/2 and F(label.attrib['y'])==y+28;values[row,col]=label.text or''
     if row==0:top.append(label.text)
     elif label.text:known[row,col]=F(label.text)
   assert sum(v=='x'for v in values.values())==1;bottom=known[3,0]
   for row in range(3):
    for col in range(3-row):
     below=cells[row+1,col];child=(below[0]+below[2]/2,below[1])
     for role,parent in[('left',cells[row,col]),('right',cells[row,col+1])]:assert segment(d[f'pyramid-edge-{row}-{col}-{role}'])==(parent[0]+parent[2]/2,parent[1]+parent[3],*child)
   p['allTenActualCellsAndTwelveParentEdgeEndpointsChecked']=True
  out,q=pyramid(top,bottom,known);p.update(q)
 elif i==24:
  if src:sides=[6,5,4,3];inputs=list(map(F,[7,6,5,4]));outputs=['43','31','21','?']
  else:
   sides=[];inputs=[];outputs=[]
   for j in range(4):
    ps=points(d['function-polygon-'+str(j)]);assert len(ps)==len(set(ps))>=3;center=tuple(sum(p[k]for p in ps)/len(ps)for k in range(2));radii=[dot(sub(v,center),sub(v,center))for v in ps];edges=[dot(sub(a,b),sub(a,b))for a,b in zip(ps,ps[1:]+ps[:1])]
    for v in radii:near(v,radii[0])
    for v in edges:near(v,edges[0])
    turns=[cross(sub(b,a),sub(c,b))for a,b,c in zip(ps,ps[1:]+ps[:1],ps[2:]+ps[:2])];assert all(v>0 for v in turns)or all(v<0 for v in turns);label=d['function-input-'+str(j)];near(F(label.attrib['x']),center[0]);near(F(label.attrib['y'])-7,center[1]);sides.append(len(ps));inputs.append(F(label.text));outputs.append(d['function-result-'+str(j)].text)
  out,q=polygon_function(sides,inputs,outputs);p.update(q)
 elif i==27:
  if src:nums=list(map(F,[7,8,5,6,4,3]))
  else:
   cards=[(k,rect(v))for k,v in d.items()if re.fullmatch(r'card-\d+',k)];nums=[];assert len(cards)>=2
   for k,(x,y,w,h)in cards:
    j=k.split('-')[-1];label=d['card-sum-'+j];assert w>0 and h>0 and F(label.attrib['x'])==x+w/2 and F(label.attrib['y'])>y+h;nums.append(F(label.text))
   assert len(set(v[1]for v in cards))==len(cards)
  count=len(nums);out=sum(nums)/(count-1);hidden=[out-v for v in nums];assert sum(hidden)==out and all(sum(hidden)-h==v for h,v in zip(hidden,nums));p['allActualComplementSums']=list(map(str,nums));p['allReconstructedHiddenNumbersIncludingNegatives']=list(map(str,hidden));p['allOriginalCardComplementConstraintsReplayed']=True
 elif i==29:
  if src:total=1000;assert'0-ге тең болмаса'in s
  else:
   assert'нөлден өзге цифрлар'in s and'әртүрлі емес'in s;eq=one(v for v in H.math_parts(s,False)if'='in v);assert re.fullmatch(r'overline\(abc\) \+ overline\(def\) = \d+',eq);total=int(eq.split('=')[1])
  out,q=addition(total);p.update(q)
 elif i==30:
  if src:given=[[0,2,0,5,0],[0,3,0,2,0],[1,0,0,0,4],[0,0,0,4,3],[5,0,0,0,0]];where=(4,2)
  else:
   given=[];where=[];origin=rect(d['latin-cell-0-0'])[:2];assert H.numeric_tokens(s)==[1,2,3,4,5]
   for row in range(5):
    vals=[]
    for col in range(5):
     x,y,w,h=rect(d[f'latin-cell-{row}-{col}']);assert w==h==50 and x==origin[0]+50*col and y==origin[1]+50*row;label=d[f'latin-value-{row}-{col}'];assert F(label.attrib['x'])==x+25 and F(label.attrib['y'])==y+33;value=label.text
     if value=='x':where.append((row,col));value=None
     vals.append(int(value)if value else 0);assert 0<=vals[-1]<=5
    given.append(vals)
   where=one(where)
  out,q=latin(given,where);p.update(q)
 elif i==32:
  if src:values=['7','11','16','22','28','44','64','?']
  else:
   circle=d['opposite-circle'];cx,cy,radius=[F(circle.attrib[k])for k in['cx','cy','r']];assert radius>0;labels=[d['sector-value-'+str(j)]for j in range(8)];baseline=sum(F(t.attrib['y'])for t in labels)/8-cy;near(sum(F(t.attrib['x'])for t in labels)/8,cx);values={};rayangles=[]
   for j in range(8):
    x1,y1,x2,y2=segment(d['sector-ray-'+str(j)]);assert(x1,y1)==(cx,cy);v=(x2-cx,y2-cy);near(dot(v,v),radius**2);rayangles.append((math.degrees(math.atan2(float(v[1]),float(v[0])))+90)%360)
   angles=sorted(rayangles)
   for a,b in zip(angles,angles[1:]+[angles[0]+360]):near(b-a,45)
   for label in labels:
    v=(F(label.attrib['x'])-cx,F(label.attrib['y'])-baseline-cy);near(dot(v,v),(radius*F(2,3))**2);theta=(math.degrees(math.atan2(float(v[1]),float(v[0])))+90)%360;slot=round(theta/45)%8;near(min(abs(theta-slot*45),360-abs(theta-slot*45)),0);assert slot not in values;values[slot]=label.text
   values=[values[j]for j in range(8)];p['allEightActualEqualSectorRaysAndLabelLocationsChecked']=True
  out,q=circle_rule(values);p.update(q)
 elif i==47:
  if src:values=[[8,7,4,11],[7,8,5,10],[6,6,8,'?']]
  else:
   values=[]
   for j in range(3):
    ps=points(d['triangle-'+str(j)]);assert len(ps)==3 and ps[1][1]==ps[2][1]>ps[0][1]and ps[1][0]<ps[0][0]<ps[2][0];cx=ps[0][0];v=[]
    for role in['top','left','right','middle']:
     label=d[f'triangle-{j}-{role}'];x,y=F(label.attrib['x']),F(label.attrib['y']);assert min(p[0]for p in ps)<x<max(p[0]for p in ps)and ps[0][1]<y<ps[1][1]
     if role in['top','middle']:assert x==cx
     elif role=='left':assert x<cx
     else:assert x>cx
     v.append(label.text)
    assert F(d[f'triangle-{j}-top'].attrib['y'])<F(d[f'triangle-{j}-middle'].attrib['y'])<F(d[f'triangle-{j}-left'].attrib['y']);values.append(v)
  out,q=triangle_rule(values);p.update(q)
 else:raise AssertionError(i)
 p['target']=str(out);return out,p
def solve(r,i,src=False,data=None):out,p=target(r,i,src,data);p.update(B.checked_choices(r,out));return p
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==8;entries=[];evidence=[];targets={11:F(32),14:F(16),24:F(15),27:F(12),29:F(30),30:F(1),32:F(126),47:F(9)}
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  cr=copy.deepcopy(r);root=W.svg(r)if i!=29 else None;d=ids(root)if root is not None else{}
  if i==11:d['glyph-result-0'].text='48';d['glyph-result-1'].text='24'
  elif i==14:d['pyramid-value-3-0'].text='85'
  elif i==24:
   for j in range(3):d['function-result-'+str(j)].text=str(F(d['function-result-'+str(j)].text)+1)
  elif i==27:d['card-sum-0'].text='11'
  elif i==29:cr['statement']=cr['statement'].replace('= 1100','= 1200')
  elif i==30:
   for k,v in d.items():
    if k.startswith('latin-value-')and v.text in['1','2']:v.text='2'if v.text=='1'else'1'
  elif i==32:
   for j,v in enumerate(['36','60','90'],4):d['sector-value-'+str(j)].text=v
  elif i==47:d['triangle-2-top'].text='8'
  raw=ET.tostring(root)if root is not None else None
  if raw is not None:cr['figureSha256']=hashlib.sha256(raw).hexdigest()
  new=targets[i];old=F(proof['target']);cr['options']=[str(B.scalar(v)+new-old)for v in r['options']]
  for bad,bs in[({**r,'answer':'999999'},None),({**cr,'answer':r['answer']},raw)]:
   try:solve(bad,i,False,bs)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:changed=solve({**cr,'answer':str(new)},i,False,raw)
  except Exception as e:raise AssertionError(('changedvalid',i))from e
  proof['validChangedActualGivensOrNativeGeometryTarget']=changed['target'];bad=copy.deepcopy(r);badroot=W.svg(r)if i!=29 else None;bd=ids(badroot)if badroot is not None else{}
  if i==11:
   ps=points(bd['glyph-0']);ps[0]=(ps[0][0]+1,ps[0][1]);bd['glyph-0'].set('points',' '.join(f'{float(x)},{float(y)}'for x,y in ps))
  elif i==14:bd['pyramid-edge-0-0-left'].set('x2','999')
  elif i==24:
   ps=points(bd['function-polygon-0']);ps[0]=(ps[0][0]+1,ps[0][1]);bd['function-polygon-0'].set('points',' '.join(f'{float(x)},{float(y)}'for x,y in ps))
  elif i==27:bd['card-0'].set('x','31')
  elif i==29:bad['statement']=bad['statement'].replace('= 1100','= 100')
  elif i==30:bd['latin-value-0-1'].text='1'
  elif i==32:bd['sector-value-0'].set('x',str(F(bd['sector-value-0'].attrib['x'])+1))
  elif i==47:bd['triangle-2-top'].set('y','150')
  bs=ET.tostring(badroot)if badroot is not None else None
  if bs is not None:bad['figureSha256']=hashlib.sha256(bs).hexdigest()
  try:solve(bad,i,False,bs)
  except(AssertionError,ValueError,IndexError):proof['malformedActualGeometryOrUnsatisfiableGivensRejected']=True
  else:raise AssertionError(('malformedaccepted',i))
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All8fullsource/newconditions official/newsolutions/all40source/newchoices/sourcebitmaps and7native343pxPNGsread. Actualcontours simpleorthogonalvertices/noncollinear/rulecalibrations; all10pyramidcells/12parentedges/affineconstraintreplay; actualregularpolygons/inputlabels/commonfunctionconstant; allcardcomplementnumbers/negativehiddenwitness; all889first3digitvaluesanduniquelydeterminednonzerosecondaddend; all120Latinrowpermutations/allcompletegrids/targetuniqueness; all8actualsectorrays/labels/oppositefactor; all3subtract-one-cornerfamilies checked. Changedactualgivens/nativeSVGcanaries recomputed; malformedgeometry/unsatisfiablegivensreject. Sameauthornotanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]}
  if r.get('image'):entry['figureReview']={'status':'verified','sha256':r['figureSha256'],'method':'OwnnativeSVG actualallcontours/edges/cells/labels checked;343pxPNGinspected;nosourcebitmap/tracing.'}
  entries.append(entry);evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':8,'sourceOptionsRead':40,'rewrittenOptionsRead':40,'nativeFigures':7,'nativeOverlineEquations':1,'validChangedActualInputsRecomputed':8,'malformedActualGeometryOrUnsatisfiableGivensRejected':8,'pythonJavaScriptHashesMatched':8,'remainingBIL6SourceVisualTasks':[5,6,8,9,36,50],'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
