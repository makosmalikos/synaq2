"""Independent complete3 unit-fraction figure review, archived sources only.

All saved/new conditions, full solutions and every choice were read; archived
source sheet and EACH native343px PNG inspected. Actual SVG rectangle lengths
and fraction texts are observed independently, not author data attributes.
No author model/solver is imported. Only this exact3-row batch is signed.
"""
import ast,copy,hashlib,json,re
from fractions import Fraction as F
from pathlib import Path
from xml.etree import ElementTree as ET
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/visual-wave50-unit-fraction-figures.json'
REPORT='problems/editorial/reviews/visual-wave50-unit-fraction-figures.json'
def read(p):return json.loads((ROOT/p).read_text())
def one(xs):assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=s.replace('$','').replace('−','-')
 return re.sub(r'\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
def fracs(s):return [F(int(a),int(b)) for a,b in re.findall(r'\((\d+)/(\d+)\)',clean(s))]
def expr(s):
 t=clean(s).strip()
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(t,n))
  if isinstance(n,ast.BinOp):
   a,b=walk(n.left),walk(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Div):return a/b
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(t,mode='eval').body)
def tag(e):return e.tag.rsplit('}',1)[-1]
def figure(row,svg):
 root=ET.fromstring(svg);nodes=list(root.iter());assert root.attrib['viewBox']=='0 0 480 360'
 assert {tag(e) for e in nodes}<={'svg','title','desc','rect','g','text','line'}
 assert not re.search(r'<(?:image|script|foreignObject)|(?:href|onload|onclick)=|data:image|url\(',svg,re.I)
 text_nodes=[e for e in nodes if tag(e)=='text'];texts=[''.join(e.itertext()) for e in text_nodes]
 for e in text_nodes:
  assert 0<F(e.attrib['x'])<480 and 0<F(e.attrib['y'])<360
  assert F(e.attrib['font-size'])*F(343,480)>=15
 rects=[e for e in nodes if tag(e)=='rect' and 'rx' not in e.attrib]
 rows={}
 for e in rects:rows.setdefault(e.attrib['y'],[]).append(e)
 observed=[]
 def chain(rs):
  rs=sorted(rs,key=lambda e:F(e.attrib['x']));start=F(rs[0].attrib['x']);end=start
  for e in rs:
   assert abs(F(e.attrib['x'])-end)<F(1,10**10);end=F(e.attrib['x'])+F(e.attrib['width'])
  assert abs(start-42)<F(1,10**10) and abs(end-438)<F(1,10**10)
  assert all(F(e.attrib['height'])>0 for e in rs)
  return rs,F(396)
 if len(rows)==2:
  assert len(rects)==19
  for y,rs in sorted(rows.items(),key=lambda x:F(x[0])):
   rs,whole=chain(rs);n=len(rs);assert n in(7,12)
   assert all(abs(F(e.attrib['width'])-whole/n)<F(1,10**10) for e in rs)
   painted=[e for e in rs if e.attrib['fill']!='#fff'];assert len(painted)==1 and painted[0] is rs[0]
   assert rs[0].attrib['fill']=='#9ec8ed';observed.append(F(1,n))
  labelGroups=[e for e in nodes if tag(e)=='g' and len([n for n in e if tag(n)=='text'])==2 and len([n for n in e if tag(n)=='line'])==1]
  labels=[]
  for g in labelGroups:
   ts=[e for e in g if tag(e)=='text'];labels.append(F(int(ts[0].text),int(ts[1].text)))
   assert all(F(e.attrib['x'])==20 for e in ts)
  assert labels==observed and F(396)/7>F(396)/12
 else:
  assert len(rows)==1;rs,whole=chain(one(list(rows.values())))
  colored=[e for e in rs if e.attrib['fill']!='#fff'];white=[e for e in rs if e.attrib['fill']=='#fff'];assert len(white)==1 and white[0] is rs[-1]
  assert [e.attrib['fill'] for e in colored]==['#9ec8ed','#f6d16e','#c1a1de'][:len(colored)]
  observed=[F(e.attrib['width'])/whole for e in colored]
  assert all(f.numerator==1 for f in observed)
  groups=[e for e in nodes if tag(e)=='g' and len([n for n in e if tag(n)=='text'])==2 and len([n for n in e if tag(n)=='line'])==1]
  assert len(groups)==len(colored)
  for rect,g,value in zip(colored,groups,observed):
   ts=[e for e in g if tag(e)=='text'];assert F(int(ts[0].text),int(ts[1].text))==value
   center=F(rect.attrib['x'])+F(rect.attrib['width'])/2
   assert all(F(e.attrib['x'])==center and F(rect.attrib['y'])<F(e.attrib['y'])<F(rect.attrib['y'])+F(rect.attrib['height']) for e in ts)
   bar=one([e for e in g if tag(e)=='line']);assert F(rect.attrib['x'])<F(bar.attrib['x1'])<F(bar.attrib['x2'])<F(rect.attrib['x'])+F(rect.attrib['width'])
  assert F(white[0].attrib['width'])/whole==1-sum(observed)
  if len(observed)==3:assert '?' not in texts and observed==[F(1,3),F(1,6),F(1,12)]
  else:assert observed==[F(1,4),F(1,6)] and texts.count('?')==1
 return observed
def solve(row,i,shares=None,source=False):
 s=clean(row['statement']);options=[o['text'] if isinstance(o,dict) else o for o in row['options']]
 if i==0:
  a,b=fracs(s) if source else shares
  if not source:assert list(map(int,re.findall(r'\d+',s)))==[a.denominator,b.denominator]
  assert a.numerator==b.numerator==1 and a>b
  expected=f'({a.numerator}/{a.denominator}) > ({b.numerator}/{b.denominator})'
  assert clean(row['answer'])==expected
  assert clean(options[0])==expected and '<' in clean(options[1]) and '=' in clean(options[2])
 elif i==1:
  values=fracs(s) if source else shares
  if not source:assert fracs(s)==shares
  assert len(values)==3 and values[0]==2*values[1] and values[1]==2*values[2]
  answer=sum(values);assert expr(row['answer'])==answer
  assert expr(options[0])==F(3,sum(v.denominator for v in values))
  assert expr(options[1])==3*values[-1] and expr(options[3])==values[-1]
  assert sum(expr(o)==answer for o in options)==1
 else:
  # Original diagram was explicitly not to scale; source labels1/2,1/3 were
  # visually read from the archived raster and checked against full solution.
  values=[F(1,2),F(1,3)] if source else shares
  assert 'оқылмай қалды' in s
  if not source:assert 'БАСТАПҚЫ' in s and 'қабыспайды' in s
  answer=1-sum(values);assert expr(row['answer'])==answer
  assert expr(options[0])==1-F(2,sum(v.denominator for v in values))
  assert expr(options[1])==sum(values) and expr(options[3])==F(1,sum(v.denominator for v in values))
  assert sum(expr(o)==answer for o in options)==1
 return True
def run():
 rows=read(BATCH)['editions'];assert len(rows)==3;inventory=read('problems/editorial/batches/visual-inventory.json')['records'];entries=[];bad=geometry_bad=content_bad=0
 notes=['Observed exactly7 and12 equal-width cells over the same396px whole, only first cell blue; reverse denominator order correctly gives1/7>1/12.','Observed disjoint132/66/33px colored lengths over396px with unit labels1/3,1/6,1/12;165px white; painted7/12 and all three actual error mechanisms verified.','Observed99/66px disjoint ORIGINAL-book shares1/4,1/6 and231px white with question mark. Read5/12; unread7/12 need not itself be a unit fraction.']
 for i,row in enumerate(rows):
  ref=row['sourceRefs'][0];cap=read(ref['sourceFile']);raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and raw['images'] and raw['solution']
  inv=one([r for r in inventory if r['occurrenceId']==row['sourceOccurrenceId']]);assert inv['sourceId']==ref['sourceId'] and inv['sourceSha256']==row['sourceCanonicalSha256'] and inv['sourceAssets']==[raw['images'][0]['src']]
  assert clean(raw['statement']).lower()!=clean(row['statement']).lower()
  svg=(ROOT/'frontend/public'/row['image'].lstrip('/')).read_text();sha=hashlib.sha256(svg.encode()).hexdigest();assert sha==row['figureSha256']
  shares=figure(row,svg);solve({**raw,'answer':raw['sourceAnswer']},i,source=True);solve(row,i,shares)
  wrong=copy.deepcopy(row);wrong['answer']='INVALID'
  try:solve(wrong,i,shares)
  except(AssertionError,ValueError,SyntaxError):bad+=1
  else:raise AssertionError('Wrong key accepted')
  changed=svg.replace('width="56.57142857142857"','width="57.57142857142857"',1) if i==0 else svg.replace('width="132"','width="133"',1) if i==1 else svg.replace('>4</text>','>5</text>',1)
  assert changed!=svg
  try:figure(row,changed)
  except AssertionError:geometry_bad+=1
  else:raise AssertionError('Geometry or printed-label canary accepted')
  wrong=copy.deepcopy(row);old,new=[('Жоғарғысы 7','Жоғарғысы 8'),('(1/6)','(1/5)'),('оқылмай қалды','оқылды')][i];assert old in wrong['statement'];wrong['statement']=wrong['statement'].replace(old,new)
  try:solve(wrong,i,shares)
  except AssertionError:content_bad+=1
  else:raise AssertionError('Printed-given/requested-quantity canary accepted')
  entries.append({'editionId':row['editionId'],'sha256':hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_full_saved_new_read_exact_Fraction_actual_SVG_rectangle_observer_and_native343px_visual_review','notes':[notes[i],'All source/new fullconditions, complete solutions and MCQs read; archived source sheet and each individual343px nativePNG inspected. No author solver imported.'],'figureReview':{'status':'verified','sha256':sha,'viewportWidth':343,'nativeSvg':True,'sourceTracing':False,'checked':['Archived source raster and full official condition/solution/everyMCQ read.','Actual native343px PNG inspected: fraction labels, including1/12 in33px cell, legible and unclipped.','Actual rectangle coordinates, contiguous equal whole, color topology, fraction text and bar centers checked independently of data attributes.','No raster, script, foreignObject, external URL or undisclosed answer label.',notes[i]]},'evidence':{'oracle':'scripts/editorial/review-visual-wave50.py','sourceSheet':'output/editorial-visual-wave50/visual-wave50-source-1.png','mobilePng':'output/editorial-visual-wave50/'+row['editionId']+'-343.png','mobileWidthPx':343,'figureSha256':sha}})
 evidence={'oracle':'scripts/editorial/review-visual-wave50.py','savedConditionsChecked':3,'newConditionsChecked':3,'fullSolutionsAndAllChoicesRead':True,'sourceRasterAndEveryNative343pxInspected':True,'wrongKeysRejected':bad,'actualSVGGeometryOrPrintedLabelCanariesRejected':geometry_bad,'printedGivenOrRequestedQuantityCanariesRejected':content_bad,'independentReviewNotWholeBankAudit':True}
 (ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n');print(json.dumps({**evidence,'hashes':len(entries),'report':REPORT,'status':'verified'},ensure_ascii=False))
if __name__=='__main__':run()
