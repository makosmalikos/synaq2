"""Independent full saved/new17 systems review. No author solver imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-systems-wave14.json'
OUT='problems/editorial/reviews/collection-systems-wave14.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def tree(s):
 decimal={}
 def bind(m):
  name='DECIMAL'+str(len(decimal));decimal[name]=F(m[0].replace(',','.'));return name
 s=re.sub(r'\d+,\d+',bind,s.replace('−','-').replace('×','*'))
 s=re.sub(r'(?<=[0-9)])(?=[xy])','*',s)
 return ast.parse(s.strip(),mode='eval'),decimal
# Exact independent bivariate affine AST (x coefficient,y coefficient,constant).
# A determinant solve is different from the author's chosen elimination/substitution.
def affine(s):
 t,ds=tree(s)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return(F(0),F(0),F(n.value))
  if isinstance(n,ast.Name):
   if n.id=='x':return(F(1),F(0),F(0))
   if n.id=='y':return(F(0),F(1),F(0))
   return(F(0),F(0),ds[n.id])
  if isinstance(n,ast.UnaryOp):
   assert isinstance(n.op,(ast.USub,ast.UAdd));return tuple((-1 if isinstance(n.op,ast.USub)else 1)*x for x in walk(n.operand))
  assert isinstance(n,ast.BinOp)
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,(ast.Add,ast.Sub)):return tuple(x+(-1 if isinstance(n.op,ast.Sub)else 1)*y for x,y in zip(a,b))
  if isinstance(n.op,ast.Mult):
   assert(a[0]==a[1]==0)or(b[0]==b[1]==0),(s,a,b)
   if a[0]==a[1]==0:return tuple(a[2]*x for x in b)
   return tuple(b[2]*x for x in a)
  assert isinstance(n.op,ast.Div)and b[0]==b[1]==0 and b[2]!=0
  return tuple(x/b[2]for x in a)
 return walk(t)
def equation(s):
 lhs,rhs=s.split('=');l,r=affine(lhs),affine(rhs);return(l[0]-r[0],l[1]-r[1],r[2]-l[2])
def val(s,x,y):
 a,b,c=affine(s);return a*x+b*y+c

def solve_equations(equations):
 (a,b,c),(d,e,f)=map(equation,equations);det=a*e-b*d;assert det!=0,(equations,det)
 x,y=(c*e-b*f)/det,(a*f-c*d)/det
 for eq in equations:
  lhs,rhs=eq.split('=');assert val(lhs,x,y)==val(rhs,x,y)
 return x,y,det

def printed_equations(row):
 lines=row['statement'].splitlines();assert lines[0]=='Төмендегі екі теңдеу бір ЖҮЙЕ құрайды.'and len(lines)==4
 assert lines[1].startswith('1) ')and lines[2].startswith('2) ')
 return[lines[1][3:],lines[2][3:]],lines[3]
def pair(s):
 m=re.fullmatch(r'\(([-\d,]+);\s*([-\d,]+)\)',s);assert m,s
 return tuple(F(v.replace(',','.'))for v in m.groups())
def num(s):return F(s.replace('−','-').replace(',','.'))
def solve(row):
 equations,target=printed_equations(row);x,y,det=solve_equations(equations);number=int(one(row['sourceRefs'])['sourceId'])
 if 'РЕТТЕЛГЕН жұбын'in target:
  assert'Бірінші орын — x, екінші орын — y.'in target
  values=[pair(o)for o in row['options']];assert len(set(values))==4
  answer=one([o for o,v in zip(row['options'],values)if v==(x,y)])
  note=f'Ordered(x;y)pair({x};{y}), both ORIGINAL displayed equations exact; swapped/sign options checked separately.'
 elif 'x + y ҚОСЫНДЫСЫН'in target:
  values=list(map(num,row['options']));assert len(set(values))==4;answer=one([o for o,v in zip(row['options'],values)if v==x+y])
  note=f'RequestedSUM, noteithercoordinate: x={x},y={y}, sum{x+y}. Allfourdisplayednumericchoices evaluated.'
 else:
  expression=re.fullmatch(r'Жүйенің шешімін (.*?) өрнегіне қойып, сол өрнектің МӘНІН таңдаңыз\.',target)[1]
  value=val(expression,x,y);values=list(map(num,row['options']));assert len(set(values))==4
  answer=one([o for o,v in zip(row['options'],values)if v==value]);assert expression=='-4 × (3x + y)'and value==-44
  note=f'RequestedWHOLEweightedexpression{expression}; pair({x};{y}), outerNEGATIVEappliedtoENTIREbracket→{value}; notpair/SUM/sign-only.'
 assert answer==row['answer'],(number,answer,row['answer'])
 return f'Actualprinted equations{equations}, independent exactbivariateaffineAST and nonzero determinant{det} prove UNIQUEsolution. '+note

# Check every displayed math equality chain in the FULL written solution at the
# independently derived pair, including normalization/cancellation/substitution.
def solution_claims(row):
 eqs,target=printed_equations(row);x,y,det=solve_equations(eqs);z=row['solution'];count=0
 # A comma followed by a space is narrative separator, not a decimal comma.
 z=z.replace(', ','; ')
 for m in re.finditer(r'(?<![A-Za-z])(?:[xy0-9(]|[−-]\d)[0-9xy, +−×()=\-]*',z):
  text=m[0].strip()
  if'='not in text:continue
  text=re.sub(r'^\d+\)\s*','',text).strip().rstrip(', ')
  assert text.count('(')==text.count(')'),text
  terms=[t.strip()for t in text.split('=')];assert len(terms)>1 and all(terms),text
  values=[val(t,x,y)for t in terms];assert len(set(values))==1,(row['editionId'],text,values);count+=len(terms)-1
 assert count>=10,(row['editionId'],count)
 return count
SOURCE_PAIRS={1:(10,4),2:(-1,2),3:(0,3),5:(1,1),6:(7,5),7:(4,-3),8:(-5,3),9:(7,-2),10:(4,-4),11:(1,-2),12:(10,4),13:(2,-6),14:(3,8),15:(3,-7),16:(-6,5),17:(-3,-1),18:(1,1)}
NEW_PAIRS={1:(15,6),2:(-3,2),3:(0,4),5:(2,2),6:(10,7),7:(5,-3),8:(-7,3),9:(9,-3),10:(6,-6),11:(2,-5),12:(15,8),13:(3,-8),14:(4,9),15:(4,-9),16:(-8,6),17:(-5,-2),18:(3,2)}
def source_equations(raw):
 body=re.search(r'\\begin\{cases\}(.*?)\\end\{cases\}',raw['statement'],re.S)[1]
 eqs=[s.strip().rstrip(',.')for s in body.replace('{,}',',').split('\\\\')];assert len(eqs)==2,eqs
 return eqs

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==17;entries=[];seen=set();files=set();claims=0
 for row in rows:
  ref=one(row['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('svg')and not raw.get('images')
  n=int(ref['sourceId']);seen.add(n);files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(row['statement'])
  eqs=source_equations(raw);sx,sy,sdet=solve_equations(eqs);assert(sx,sy)==SOURCE_PAIRS[n]
  rawkey=raw['sourceAnswer'].replace('$','');assert one([o['text']for o in raw['options']if o['correct']]).replace('$','')==rawkey
  assert (pair(rawkey)==(sx,sy))if n in{1,2,3,5,6}else(num(rawkey)==(-3*(2*sx+sy)if n==18 else sx+sy))
  peqs,_=printed_equations(row);x,y,det=solve_equations(peqs);assert(x,y)==NEW_PAIRS[n];note=solve(row);claims+=solution_claims(row)
  assert row['grade']==6 and row['topic']=='eq'and row['minimumPlan']=='pro'and row['options'].count(row['answer'])==1
  z=row['solution']
  if n in{1,11,12}:assert'Әр мүшені'in z and'көбейтеміз'in z
  if n in{2,6}:assert'Оны басқа теңдеуге қоямыз'in z and'Жақшаны ашып'in z
  if n in{5,18}:assert'Коэффициенттер бастапқыдан қарама-қарсы'in z
  if n not in{2,6}:assert'ҚОССАҚ'in z and'мүшелері жойылады'in z
  # Specific signed/zero regimes read in originals, not generic 17meaningclaim.
  if n==3:assert x==0 and y>0
  if n==10:assert x>0 and y<0 and x+y==0
  if n==17:assert x<0 and y<0
  if n in{7,9,13,15}:assert x>0 and y<0
  if n in{8,16}:assert x<0 and y>0
  if n in{12,14}:assert x>0 and y>0
  note+=f' Full officialsource{n} equationpair{eqs} independentlybacksub{sx},{sy}; exact SOURCEanswer/options correct. Fullnewsolution claims verified and method/sign/zero/target regime retained.'
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':'Independent ACTUALprinted bivariateaffineFractionAST/nonzero determinant UNIQUEsolution, both ORIGINAL equations backsub, every displayed proof equality, orderedPAIRvsSUMvsweightedexpression/allMCQroles; full17canonical saved/new/official/newsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert seen==set(range(1,19))-{4}and len(files)==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 badkeys=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:badkeys+=1
  else:raise AssertionError('wrongkeyaccepted')
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True))
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All17canonical saved/new conditions, FULLofficial/newsolutions and everyMCQ read. Own ACTUALprinted exactFraction bivariateaffineAST/nonzero determinant UNIQUEsolution; everyproofequality checked atindependentsolution, bothoriginalequations backsub, decimalclearing/substitution/readyoppositecoefficients/zero/sign regimes/PAIRvsSUMvsweightedexpression preserved. Sixmethod/targetfamilies across17occurrences, not17newmeanings. SVGsource4 excluded. Findings0; noauthorcalculatorimports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'sourceSystems':len(seen),'proofEqualityClaims':claims,'JSHashes':len(hashes),'nativeFractions':native,'report':OUT if args.write else None}))
if __name__=='__main__':main()
