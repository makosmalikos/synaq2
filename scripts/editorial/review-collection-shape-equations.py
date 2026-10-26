"""All25source/new full conditions/full official/new solutions and both4-option
MCQ sets read. Original text equations replaced with our own25native SVGs, actual
343px previews viewed. Exact printed equations solved independently with Fraction
RREF or complete positive factor pairs; same root author, not a separate human.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-shape-equations';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json';NS={'s':'http://www.w3.org/2000/svg'}
sp=importlib.util.spec_from_file_location('eqcheck',ROOT/'scripts/editorial/review-collection-equations12.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H);one=H.one
SHAPES={'●':'c','■':'s','▲':'t','◆':'d','★':'r'};name={'c':'circle','s':'square','t':'triangle','d':'diamond','r':'star'}
def expr(s,env=None):
 for a,b in SHAPES.items():s=s.replace(a,b)
 return H.expr(s.replace('·','×'),env)
def scalar(s):return H.calc(s)
def parse(s,source):
 if source:
  lines=[line.strip()for line in s.splitlines()if '='in line and any(c in line for c in SHAPES)];target=one(re.findall(r'([●■▲◆★·:−+\s]+)\s*неге тең',s)).strip();extra=re.findall(r'[●■▲◆★]\s*>\s*[●■▲◆★]',s)
 else:
  parts=H.H.math_parts(s,False);lines=[p for p in parts if '='in p];target=parts[-1];extra=[p for p in parts if'>'in p]
 assert lines and target;return lines,target,extra

def rref(rows,size):
 a=[list(row)for row in rows];pivots=[];at=0
 for col in range(size):
  pivot=next((j for j in range(at,len(a))if a[j][col]),None)
  if pivot is None:continue
  a[at],a[pivot]=a[pivot],a[at];factor=a[at][col];a[at]=[v/factor for v in a[at]]
  for j in range(len(a)):
   if j==at:continue
   factor=a[j][col];a[j]=[u-factor*v for u,v in zip(a[j],a[at])]
  pivots.append(col);at+=1
 assert all(any(row[:-1])or row[-1]==0 for row in a);return a,pivots

def solve(r,i,source=False):
 lines,target,extra=parse(r['statement'],source);equations=[];variables=set()
 for line in lines:
  left,right=line.split('=');l=expr(left);rhs=expr(right);poly=l-rhs;variables.update(v for mon in poly.n for v in mon);equations.append((left,right,poly))
 variables=sorted(variables);valid=[];proof={}
 if i in(18,19):
  assert variables==['c','s'];product_line=one(line for line in lines if any(t in line for t in('·','×')));sum_line=one(line for line in lines if'+'in line);product=int(scalar(product_line.split('=')[1]));total=int(scalar(sum_line.split('=')[1]));pairs=[(d,product//d)for d in range(1,math.isqrt(product)+1)if product%d==0];assert len(extra)==1
  for a,b in pairs:
   if a+b==total and b>a:valid.append({'c':F(b),'s':F(a)})
  assert len(valid)==1;proof['allPositiveFactorPairs']=pairs
 else:
  rows=[]
  for left,right,poly in equations:
   assert all(len(mon)<=1 for mon in poly.n);rows.append([poly.n.get((v,),F(0))for v in variables]+[-poly.n.get((),F(0))])
  reduced,pivots=rref(rows,len(variables));free=[j for j in range(len(variables))if j not in pivots];assert len(free)<=1
  if free:
   # These two underdetermined chains have pair sums of positive integers.
   # Each variable occurs in such a pair, giving the finite strict bound.
   assert i in(21,22);totals=[int(scalar(line.split('=')[1]))for line in lines];bound=max(totals);covered=set()
   for row in rows:
    assert row[-1]>0 and all(x>=0 for x in row[:-1])
    covered.update(variables[j]for j,c in enumerate(row[:-1])if c>0)
   assert covered==set(variables);assignments=range(1,bound)
  else:assignments=[None];bound=None
  for freeValue in assignments:
   values=[F(0)]*len(variables)
   for col in free:values[col]=F(freeValue)
   for j,col in reversed(list(enumerate(pivots))):values[col]=reduced[j][-1]-sum(reduced[j][k]*values[k]for k in free)
   if all(v>0 and v.denominator==1 for v in values):valid.append(dict(zip(variables,values)))
  assert valid;proof.update(linearRank=len(pivots),variableCount=len(variables),allPositiveIntegerAssignments=[{name[k]:str(v)for k,v in row.items()}for row in valid],freeVariableStrictUpperBound=bound)
  assert (len(valid)>1)==(i in(21,22))
 values=[]
 for env in valid:
  for left,right,poly in equations:assert expr(left,env).constant()==expr(right,env).constant()
  for line in extra:l,rhs=line.split('>');assert expr(l,env).constant()>expr(rhs,env).constant()
  values.append(expr(target,env).constant())
 out=one(set(values));assert scalar(r['answer'])==out,(i,out,r['answer']);proof.update(answer=str(out),printedTarget=target,allRowsSubstituted=True,validAssignmentCount=len(valid))
 if r.get('options'):
  choices=[scalar(v['text']if isinstance(v,dict)else v)for v in r['options']];assert len(choices)==len(set(choices))==4 and choices.count(out)==1;proof['allOptionValues']=list(map(str,choices))
  if source:assert [j for j,o in enumerate(r['options'])if o['correct']]==[choices.index(out)]
 return proof

def glyph(e):
 tag=e.tag.split('}')[-1];a=e.attrib
 if tag=='circle':assert a=={'cx':'0','cy':'0','r':'10','fill':'#3269e8'};return '●'
 if tag=='rect':assert a=={'x':'-10','y':'-10','width':'20','height':'20','rx':'4','fill':'#8a66d8'};return '■'
 assert tag=='polygon';ps=[tuple(map(F,p.split(',')))for p in a['points'].split()]
 if len(ps)==3:assert ps==[(0,-12),(12,10),(-12,10)]and a['fill']=='#efad36';return '▲'
 if len(ps)==4:assert ps==[(0,-12),(12,0),(0,12),(-12,0)]and a['fill']=='#2ca48d';return '◆'
 assert len(ps)==10 and a['fill']=='#e6ad2f'
 expected=[]
 for j in range(10):angle=-math.pi/2+j*math.pi/5;r=5 if j%2 else 12;expected.append((F(f'{r*math.cos(angle):.4f}'),F(f'{r*math.sin(angle):.4f}')))
 assert ps==expected;return '★'

def geometry(r,raw=None):
 raw=(ROOT/('frontend/public'+r['image'])).read_bytes()if raw is None else raw;root=ET.fromstring(raw);assert not re.search(rb'<image|<script|<foreignObject|href=|data:|onload=',raw);lines,target,extra=parse(r['statement'],False)
 logical_rows=[re.findall(r'[●■▲◆★]|\d+|[+−×÷=>]',line)for line in lines]
 width=lambda t:26 if t in SHAPES else len(t)*12+8 if t.isdigit()else 24
 token_rows=[]
 for ts in logical_rows:
  if sum(map(width,ts))<=312:token_rows.append(ts)
  else:
   at=ts.index('=');token_rows.extend([ts[:at],ts[at:]])
 rowWidths=[sum(map(width,ts))for ts in token_rows];w=max(360,max(rowWidths)+48);h=len(token_rows)*58+40;assert list(map(int,root.attrib['viewBox'].split()))==[0,0,w,h]
 assert one(root.findall('s:desc',NS)).text=='; '.join(lines);groups={e.attrib['id']:e for e in list(root)if'id'in e.attrib and re.fullmatch(r'r\d+-t\d+',e.attrib['id'])};assert len(groups)==sum(map(len,token_rows));shapes=0;texts=0
 for j,ts in enumerate(token_rows):
  x=F(w-rowWidths[j],2);y=49+j*58
  for k,t in enumerate(ts):
   node=groups[f'r{j}-t{k}'];cw=width(t);cx=x+F(cw,2)
   if t in SHAPES:
    assert node.tag.endswith('}g')and len(node)==1;actual=one(re.findall(r'translate\((.*?)\)',node.attrib['transform']));assert tuple(map(F,actual.split()))==(cx,F(y));assert glyph(node[0])==t;shapes+=1;assert 12<=cx<=w-12 and 12<=y<=h-12
   else:assert node.tag.endswith('}text')and node.text==t and F(node.attrib['x'])==cx and F(node.attrib['y'])==y+7 and node.attrib['font-size']=='21'and node.attrib['text-anchor']=='middle';texts+=1
   x+=cw
  assert x==F(w+rowWidths[j],2)
 return{'sha256':hashlib.sha256(raw).hexdigest(),'actualShapePrimitives':shapes,'actualTextTokens':texts,'equationRows':len(lines),'displayRows':len(token_rows),'viewBox':[w,h],'smallestTextPxAt343Width':str(F(21*343,w)),'everyGlyphAndTokenGeometryChecked':True}

def mutation(r,i):
 b=copy.deepcopy(r);lines,target,extra=parse(b['statement'],False);old=lines[0]
 # In 21/22 use the first pair sum (changes invariant); in other linear cases
 # a first numeric input changes the target or destroys positive feasibility.
 # Product problems change the printed sum to avoid unchanged ordered gap.
 if i in(18,19):old=lines[1]
 if i==23:old=lines[1]
 new=re.sub(r'\d+',lambda m:str(int(m[0])+2),old,count=1);assert old!=new;b['statement']=b['statement'].replace('«'+old+'»','«'+new+'»',1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];primitives=0;tokens=0;equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and not q['svg'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));answer=re.sub(r'^[A-D]\)\s*','',tail).strip()
  try:src=solve({**q,'answer':q['sourceAnswer']or answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and bool(r.get('options'))==bool(q['options'])and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in({**r,'answer':'999999999'},mutation(r,i)):
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',i))
  witness=one(re.findall(r'Тексеру үшін мәндер: (.*?)\.',r['solution']));env={SHAPES[k]:F(v)for k,v in re.findall(r'([●■▲◆★]) = (\d+)',witness)}
  lines,target,extra=parse(r['statement'],False)
  assert env and all(expr(l,env).constant()==expr(rhs,env).constant()for l,rhs in(line.split('=')for line in lines))
  assert expr(target,env).constant()==scalar(r['answer'])
  for match in re.finditer(r'[●■▲◆★0-9()+−×÷/\s=]+',r['solution']):
   ss=[s.strip()for s in match[0].split('=')]
   if len(ss)<2 or not all(ss):continue
   try:vs=[expr(s,env).constant()for s in ss]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vs))==1,('printed scalar or shape equation',i,match[0]);equalities+=len(vs)-1
  g=geometry(r);primitives+=g['actualShapePrimitives'];tokens+=g['actualTextTokens'];proof['figure']=g
  raw=(ROOT/('frontend/public'+r['image'])).read_bytes();svg=ET.fromstring(raw);node=one(e for e in svg.findall('s:g',NS)if e.attrib['id']==next(e.attrib['id']for e in svg.findall('s:g',NS)));node.set('transform','translate(0 0)')
  try:geometry(r,ET.tostring(svg))
  except AssertionError:pass
  else:raise AssertionError(('actual SVG mutation accepted',i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All25full source/new conditions/solutions/allMCQs read. Exact Fraction RREF full-rank and all bounded positive free-variable assignments, factor pairs/ordering and every row substitution; invariant target despite nonunique individual values checked. Actual native shape primitives/text/positions/colors/layout,343px previews checked. Same root author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':g['sha256'],'method':'Every actual SVG shape primitive, equation text and position independently decoded and matched to printed conditions,343px previews inspected. No source raster or tracing.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':25,'sourceKeysNotCaptured':23,'allSourceNewConditionsFullSolutionsRead':25,'sourceAndNewMCQSets':2,'wrongKeysRejected':25,'printedSemanticCanariesRejected':25,'printedSolutionEqualitiesVerified':equalities,'originalFigures':25,'actualShapePrimitivesChecked':primitives,'actualTextTokensChecked':tokens,'actualSVGMutationsRejected':25,'underdeterminedTargetInvariantCases':2,'pythonJavaScriptHashesMatched':25,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
