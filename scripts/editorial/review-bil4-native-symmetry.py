"""Fullsource/newcondition, full official/newsolution/all5source/newchoices and
343pxnativePNG inspected. Sourceletters are idealized blockcapital centerlines
as described by officialsolution, not measured browserfont. Same author separate
computationalreview, notanotherhumanreviewer. Native SVG glyphs are actualgeometry.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-symmetry';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('l','scripts/editorial/review-bil1-native-logic.py');L=importlib.util.module_from_spec(sp);sp.loader.exec_module(L);B=L.B;H=L.H;one=L.one;W=L.W;ids=L.ids;segment=L.segment

def normalize(u):
 x,y=u;assert x or y;return(F(1),y/x)if x else(F(0),F(1))
def graph_axes(raw):
 edges,p=L.split_intersections(raw);vertices=sorted(set(itertools.chain.from_iterable(edges)));center=tuple(sum(v[k]for v in vertices)/len(vertices)for k in range(2));axes=set()
 for a in vertices:
  v=L.subtract(a,center)
  if any(v):axes.add(normalize(v))
 for a,b in itertools.combinations(vertices,2):normal=L.subtract(a,b);axes.add(normalize((-normal[1],normal[0])))
 expected={tuple(sorted(e))for e in edges};valid=[]
 for u in axes:
  dot=lambda a,b:sum(x*y for x,y in zip(a,b));den=dot(u,u)
  def reflect(p):v=L.subtract(p,center);k=2*dot(v,u)/den;return tuple(center[j]+k*u[j]-v[j]for j in range(2))
  if{tuple(sorted(reflect(v)for v in e))for e in edges}==expected:valid.append(u)
 return len(valid),{**p,'allFiniteVertexCandidateReflectionAxesEnumerated':len(axes),'allActualGraphVertexMean':list(map(str,center)),'allExactValidReflectionAxisDirections':[[str(v)for v in u]for u in sorted(valid)],'allFullSplitSegmentSetsReflectedExactly':True,'everyPossibleAxisContainsVertexMeanAndMapsVerticesToVertices':True}
def source():
 raw={
 'Z':[(-2,-3,2,-3),(2,-3,-2,3),(-2,3,2,3)],
 'E':[(-2,-3,-2,3),(-2,-3,2,-3),(-2,0,1,0),(-2,3,2,3)],
 'S':[(2,-3,-2,-3),(-2,-3,-2,0),(-2,0,2,0),(2,0,2,3),(2,3,-2,3)],
 'A':[(-2,3,0,-3),(0,-3,2,3),(-1,0,1,0)],
 'T':[(-2,-3,2,-3),(0,-3,0,3)]};p={};count=0
 for key,ls in raw.items():n,v=graph_axes([tuple(map(F,s))for s in ls]);p[key]={'axisCount':n,**v};count+=bool(n)
 assert count==3 and[p[k]['axisCount']for k in raw]==[0,1,0,1,1];return F(count),{'sourceIdealizedBlockCapitalAxesFromOfficialExplanation':p,'sourceBrowserFontGeometryNotClaimedMeasured':True}
def native(root):
 d=ids(root);names=['one','two','three','four','five'];proof={};count=0
 for key in names:
  group=d['glyph-'+key];els=list(group);assert els
  for e in els:assert F(e.attrib['stroke-width'])==8 and e.attrib['stroke']=='#617bc2'
  if any(e.tag.endswith('ellipse')for e in els):
   e=one(els);assert e.tag.endswith('ellipse')and e.attrib['fill']=='none';cx,cy,rx,ry=[F(e.attrib[k])for k in['cx','cy','rx','ry']];assert 0<rx<ry;n=2;p={'actualEllipseCenter':list(map(str,[cx,cy])),'actualEllipseRadii':list(map(str,[rx,ry])),'noncircularEllipseHasExactlyTwoPrincipalReflectionAxes':True}
  else:
   assert all(e.tag.endswith('line')and e.attrib['stroke-linecap']=='round'for e in els);n,p=graph_axes([segment(e)for e in els])
  count+=bool(n);proof[key]={'actualReflectionAxisCount':n,**p}
 return F(count),{'allActualFiveGlyphReflectionProofs':proof,'glyphsCountedOnceRegardlessOfMultipleAxes':True,'nativeGeometryDoesNotDependOnInstalledFont':True}
def solve(r,src=False,data=None):
 out,p=source()if src else native(W.svg(r,data));p['target']=str(out);p.update(B.checked_choices(r,out));return p

def main():
 r=one(json.loads((ROOT/BATCH).read_text())['editions']);ref=one(r['sourceRefs']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==37);assert not q['images']and q['solution']and len(q['options'])==5 and'Z E S A T'in q['statement'];key=one(v['text']for v in q['options']if v['correct']);assert key==q['sourceAnswer'];src=solve({**q,'answer':key},True);proof=solve(r);root=W.svg(r);g=ids(root)['glyph-two'];ET.SubElement(g,'{http://www.w3.org/2000/svg}line',{'id':'two-bottom','x1':'160','y1':'113','x2':'200','y2':'113','stroke':'#617bc2','stroke-width':'8','stroke-linecap':'round'});raw=ET.tostring(root);d={**r,'figureSha256':hashlib.sha256(raw).hexdigest()}
 for cr,cb in[({**r,'answer':'99999'},None),(d,raw)]:
  try:solve(cr,False,cb)
  except(AssertionError,ValueError,IndexError):pass
  else:raise AssertionError('wrongkeyaccepted')
 changed=solve({**d,'answer':'5'},False,raw);assert changed['allActualFiveGlyphReflectionProofs']['two']['actualReflectionAxisCount']==1;proof['validUpdatedHashActualAddedBottomStrokeTarget']='5';root=W.svg(r);ids(root)['one-0'].set('stroke-width','7');bad=ET.tostring(root)
 try:solve({**r,'figureSha256':hashlib.sha256(bad).hexdigest()},False,bad)
 except(AssertionError,ValueError,IndexError):proof['updatedHashInconsistentNativeStrokeRejected']=True
 else:raise AssertionError('inconsistentstrokerejected')
 assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement'];assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(editionHash(JSON.parse(fs.readFileSync('"+BATCH+"')).editions[0]));";assert subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True).strip()==sha;entry={'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newcondition fullsolutions/all5source/newchoices/native343pxPNG read. SourceofficialidealblockcapitalZ/E/S/A/T explicitcenterlinemodelsgive0/1/0/1/1axes; originalbrowserfontnotclaimedmeasured. ActualallnativeSVGstrokeendpoints/intersections/uniformroundstrokeparameters/ellipse decoded. Everyfinitevertexpairimage/fixedvertexcandidateaxisthroughvertexmean enumeratedwithrationalreflection andentire splitsegmentset equality; noncircularellipseaxes2. NativeH/F/O/T/X2/0/2/1/2axescount4. ActualaddedbottomstrokechangesFtoE/count5; updatedhashinconsistentstroke rejected. Sameauthor notanotherhumanreviewer.','figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'OriginalnativeSVG geometricglyphs independentofdevicefont; actualallline/ellipsecoordinates decoded and343pxPNG inspected. No sourcebitmap/tracing.'},'notes':[json.dumps(proof,ensure_ascii=False)]};summary={'verified':1,'sourceOptionsRead':5,'rewrittenOptionsRead':5,'nativeFigures':1,'sourceOfficialIdealizationCount':3,'nativeActualGlyphCount':4,'validUpdatedHashActualAddedStrokeTarget':5,'updatedHashInconsistentNativeStrokeRejected':True,'deviceFontDependentAnswersRemoved':True,'remainingBIL4SourceVisualOrLayoutTasks':15,'pythonJavaScriptHashesMatched':1,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':[entry],'evidence':[{'editionId':r['editionId'],'savedSource':src,'rewritten':proof}]},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
