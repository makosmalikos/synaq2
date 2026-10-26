"""Full-text and exact computational review of 47 expression adaptations.
Same root is author and checker author: no separate human/agent review claimed.
The checker reads printed conditions, all source/new MCQs and source solutions;
it uses Fraction arithmetic and exact multivariable rational-function identities,
not the author's JS parser, specs, params or numerical answer oracle.
"""
import ast,copy,hashlib,itertools,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-expression-language.json'
REPORT='problems/editorial/reviews/grade5-expression-language.json'
def one(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def clean(s):
 s=str(s).replace('$','').replace('\\cdot','*').replace('\\times','*').replace('\\,','').replace('−','-').replace('×','*').replace('÷','/').replace(':','/').replace('{,}',',')
 s=re.sub(r'(?<=\d)(?=[A-Za-z])','*',s)
 return s.strip()
def nums(s):return [F(x)for x in re.findall(r'\d+',str(s))]
def polynomial(p):return{k:F(v)for k,v in p.items()if v}
def add(a,b):
 out=dict(a)
 for k,v in b.items():out[k]=out.get(k,F(0))+v
 return polynomial(out)
def neg(a):return{k:-v for k,v in a.items()}
def mul(a,b):
 out={}
 for k,v in a.items():
  for l,w in b.items():
   m=tuple(sorted(k+l));out[m]=out.get(m,F(0))+v*w
 return polynomial(out)
class Rational:
 def __init__(self,n,d=None):
  self.n=polynomial(n);self.d=polynomial({():1}if d is None else d)
  if not self.d:raise ZeroDivisionError('identically zero divisor')
 def __add__(self,b):return Rational(add(mul(self.n,b.d),mul(b.n,self.d)),mul(self.d,b.d))
 def __neg__(self):return Rational(neg(self.n),self.d)
 def __sub__(self,b):return self+-b
 def __mul__(self,b):return Rational(mul(self.n,b.n),mul(self.d,b.d))
 def __truediv__(self,b):return Rational(mul(self.n,b.d),mul(self.d,b.n))
 def equals(self,b):return mul(self.n,b.d)==mul(b.n,self.d)
 def value(self,env=None):
  env=env or{}
  def at(p):
   out=F(0)
   for monomial,c in p.items():
    for v in monomial:c*=F(env[v])
    out+=c
   return out
  den=at(self.d)
  if not den:raise ZeroDivisionError('zero divisor at given value')
  return at(self.n)/den
 def constant(self):
  # Every numerator coefficient must be the same scalar times denominator.
  first=next(iter(self.d));k=self.n.get(first,F(0))/self.d[first]
  assert self.n==polynomial({m:c*k for m,c in self.d.items()}),'expression depends on unspecified variable'
  return k
def number(n):return Rational({():F(n)})
def expr(s,bindings=None):
 bindings=bindings or{};s=clean(s);tree=ast.parse(s,mode='eval')
 def go(n):
  if isinstance(n,ast.Expression):return go(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return number(n.value)
  if isinstance(n,ast.Name):
   value=bindings.get(n.id)
   return value if isinstance(value,Rational)else number(value)if value is not None else Rational({(n.id,):1})
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.UAdd,ast.USub));return-go(n.operand)if isinstance(n.op,ast.USub)else go(n.operand)
  assert isinstance(n,ast.BinOp);a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  assert isinstance(n.op,ast.Div);return a/b
 return go(tree)
def variables(s):return sorted({n.id for n in ast.walk(ast.parse(clean(s),mode='eval'))if isinstance(n,ast.Name)})
def calc(s,env=None):return expr(s,env).constant()
def math_parts(s,source):return re.findall(r'\$([^$]+)\$',s)if source else re.findall('«([^»]+)»',s)
def assignments(s):return{v:F(n)for v,n in re.findall(r'\b([a-z])\s*=\s*(\d+)',clean(s))}
def options(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def numeric(r,wanted):
 assert nums(r['answer'])==[wanted],(r['answer'],wanted)
 if options(r):assert sum(nums(o)==[wanted]for o in options(r))==1
 return str(wanted)
def symbolic(r,wanted):
 target=expr(wanted);candidates=[o for o in options(r)if expr(o).equals(target)];answer=one(candidates)
 assert expr(r['answer']).equals(target)and clean(answer)==clean(r['answer'])
 return {'answer':answer,'exactIdentity':wanted,'allMCQEquivalent': [expr(o).equals(target)for o in options(r)]}
def sole_undefined(r,env):
 values=[]
 for o in options(r):
  try:values.append(str(calc(o,env)))
  except ZeroDivisionError:values.append(None)
 answer=options(r)[one(i for i,v in enumerate(values)if v is None)];assert clean(r['answer'])==clean(answer)
 return {'answer':answer,'everyMCQValue':values}
def printed_expression(s,source,exclude_assignments=True):
 parts=math_parts(s,source)
 parts=[p for p in parts if not exclude_assignments or'='not in p]
 # A complete expression has operators; lone variable mentions are not targets.
 return one(p for p in parts if re.search(r'[+\-−×÷:*]|\\cdot',p))
def source_calc(s,i):
 env=assignments(s)
 if i==16:
  less,factor,value=nums(s);v=one(env);return f'({v}-{less})*{factor}',env
 if i==21:return '2*(a+b)',env
 return printed_expression(s,True),env
def new_calc(s,i):
 env=assignments(s)
 if i==16:
  less,factor,value=nums(s);v=one(env);return f'({v}-{less})*{factor}',env
 if i==21:return '2*(l+w)',env
 return one(math_parts(s,False)),env
def known(s,i,source):
 normalized=clean(s);match=re.search(r'\b([a-z])\s*([+-])\s*([a-z])\s*=\s*(\d+)',normalized);assert match
 u,op,v,total=match.groups();total=F(total)
 if source:
  candidates=[p for p in math_parts(s,True)if '='not in p and re.search(r'\\cdot|\d[a-z]|[×*]',p)]
  target=one(candidates)
 else:target=one(math_parts(s,False))
 replacement=expr(f'{total}-{u}'if op=='+'else f'{u}-{total}')
 rational=expr(target,{v:replacement});out=rational.constant()
 return out,{'knownRelation':[u,op,v,str(total)],'target':target,'exactConstantIdentity':str(out)}
def solve(r,i,source=False):
 s=r['statement'];n=nums(s);env=assignments(s);proof={'printedNumbers':list(map(str,n))}
 calc_indices={0,5,6,9,10,11,12,16,17,21,23,38,39,42}
 if i in calc_indices:
  target,env=source_calc(s,i)if source else new_calc(s,i);out=calc(target,env);proof.update(target=target,assignments={v:str(k)for v,k in env.items()})
 elif i in{1,2,7,8,15,18,19,20,27,33,40,43}:
  if i==1:
   v='x'if source else't';amount=n[0];target=f'{v}+{amount}'
  elif i==2:
   v='k'if source else'd';target=f'{n[0]}/{v}'
  elif i==7:
   v='a'if source else'r';target=f'{v}*{n[0]}'
  elif i==8:
   v='b'if source else't';target=f'{v}/{n[0]}'
  elif i==15:
   a,b=n;u,v=('a','b')if source else('p','q');target=f'{a}*{u}+{b}*{v}'
  elif i==18:
   cash,count=n[:2];target=f'{cash}-{count}*c'
  elif i==19:
   speed,time=n[:2];target=f'{speed}*t+{time}*v'
  elif i==20:
   boxes,groups=n[:2];target=f'{boxes}*k/{groups}'
  elif i==27:
   addend,divisor=n;v='x'if source else't';target=f'({v}+{addend})/{divisor}'
  elif i==33:
   ratio=n[0];children=n[1]if source else F(4);assert source or'Екі ересек пен төрт бала'in s
   v='x'if source else'q';target=f'2*({ratio}*{v})+{children}*{v}'
  elif i==40:
   divisor,addend=n;v='c'if source else'z';target=f'{v}/{divisor}+{addend}'
  else:
   count,pen,cash=n[:3];target=f'{cash}-({count}*x+{pen})'
  proof.update(symbolic(r,target));return proof
 elif i in{3,14}:
  wantLiteral=i==14;answer=one(o for o in options(r)if bool(variables(o))==wantLiteral)
  assert clean(r['answer'])==clean(answer);proof.update(answer=answer,everyMCQVariables=[variables(o)for o in options(r)]);return proof
 elif i in{4,22,24,46}:
  target=printed_expression(s,source);tree=ast.parse(clean(target),mode='eval').body;assert isinstance(tree,ast.BinOp)and isinstance(tree.op,ast.Div)
  denominator=ast.unparse(tree.right);var=one(variables(denominator));d=expr(denominator)
  assert d.d=={():F(1)}and set(d.n)<={(),(var,)}and d.n.get((var,),0)>0
  out=-d.n.get((),F(0))/d.n[(var,)];assert out>0 and out.denominator==1
  assert expr(denominator,{var:out}).constant()==0
  try:calc(target,{var:out})
  except ZeroDivisionError:pass
  else:raise AssertionError('root still defined')
  if options(r):
   outcomes=[]
   for o in options(r):
    x=one(nums(o))
    try:outcomes.append(str(calc(target,{var:x})))
    except ZeroDivisionError:outcomes.append(None)
   assert sum(x is None for x in outcomes)==1;proof['allMCQSubstitutionValues']=outcomes
  proof.update(target=target,denominator=denominator,uniquePositiveRoot=str(out))
 elif i in{13,35,41}:proof.update(sole_undefined(r,env));return proof
 elif i in{25,26}:
  if source:
   parts=math_parts(s,True)
   if i==25:
    left=one(p.split('=',1)[1]for p in parts if p.strip().startswith('A ='));right=one(p.split('=',1)[1]for p in parts if p.strip().startswith('B ='))
   else:
    # x/y value segments are excluded; the remaining two expressions are ordered targets.
    left,right=[p for p in parts if '='not in p]
  else:left,right=math_parts(s,False)
  a,b=calc(left,env),calc(right,env);out=a-b;assert out>0;proof.update(leftValue=str(a),rightValue=str(b),requestedGap=str(out))
  if i==25:
   wanted=one(o for o in options(r)if re.search('A\\s*>\\s*B',o)and nums(o)==[out])
   assert clean(r['answer'])==clean(wanted);proof['answer']=wanted;return proof
 elif i in{28,32,34,44,45}:
  out,identity=known(s,i,source);proof.update(identity)
 elif i==29:
  total=one(n);assert total.denominator==1 and total>=2;cases=[(a,int(total)-a,a*(int(total)-a))for a in range(1,int(total))];out=F(max(z for a,b,z in cases));proof['allPositiveIntegerPairs']=cases
 elif i==30:
  target=printed_expression(s,source);proof.update(symbolic(r,target));proof['universalPolynomialIdentity']=True;return proof
 elif i==31:
  target=n[-1];values=[]
  for o in options(r):
   try:values.append(calc(o))
   except ZeroDivisionError:values.append(None)
  wanted=options(r)[one(i for i,v in enumerate(values)if v==target)];assert clean(r['answer'])==clean(wanted)
  # The order of numeric operands/operators outside parentheses must be identical.
  original=printed_expression(s,source)
  flat=lambda e:re.sub(r'[()\s]','',clean(e))
  assert all(flat(o)==flat(original)for o in options(r));proof.update(answer=wanted,target=str(target),allMCQValues=[str(v)if v is not None else None for v in values]);return proof
 elif i==36:
  target=printed_expression(s,source);var=one(variables(target));values=[x for x in range(1,501)if calc(target,{var:x})>0 and calc(target,{var:x}).denominator==1]
  # Prove the finite enumeration bound: this is decreasing linear, and at 500 already nonpositive.
  rational=expr(target);assert rational.d=={():F(1)}and set(rational.n)<={(),(var,)}and rational.n[(var,)]<0 and calc(target,{var:500})<=0
  out=F(len(values));proof['allAdmissibleNaturalValues']=values
 elif i==37:
  target=printed_expression(s,source);var=one(variables(target));tree=ast.parse(clean(target),mode='eval').body;assert isinstance(tree.op,ast.Div)
  d=expr(ast.unparse(tree.right));limit=d.n[()];assert d.n[(var,)]==-1 and limit.denominator==1
  printedLimit=one(F(x)for x in re.findall(r'\bx\s*<\s*(\d+)',clean(s)));assert printedLimit==limit
  values=[x for x in range(1,int(limit))if calc(target,{var:x})>0 and calc(target,{var:x}).denominator==1];out=F(len(values));proof['allAdmissibleNaturalValues']=values
 else:raise AssertionError(i)
 proof['answer']=numeric(r,out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==47;evidence=[];entries=[];canaries=0;equalities=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId'])
  assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert clean(one(o['text']for o in q['options']if o['correct']))==clean(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('image')
  assert not re.search(r'[\\$]',r['statement']+r['solution'])
  if not options(r):assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  else:assert len(options(r))==len(set(options(r)))==4 and options(r).count(r['answer'])==1
  # Verify every directly printed numeric equality chain in the new solution.
  pattern=r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])'
  for m in re.finditer(pattern,r['solution']):
   assert calc(m[1])==F(m[2]),('solution arithmetic',i,m.group());equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad=copy.deepcopy(r)
  # Select semantic-changing canaries, not irrelevant prices/numerators or coincidentally unchanged counts.
  if i in{3,13,14,35,41}:bad['options'][bad['options'].index(bad['answer'])]='999'
  elif i in{4,22,24,46}:
   quoted=one(math_parts(bad['statement'],False));m=list(re.finditer(r'\d+',quoted))[-1];altered=quoted[:m.start()]+str(int(m.group())+1)+quoted[m.end():];bad['statement']=bad['statement'].replace(quoted,altered,1)
  elif i==33:bad['statement']=bad['statement'].replace('төрт бала','бес бала')
  elif i==26:bad['statement']=bad['statement'].replace('y = 5','y = 6')
  elif i==36:bad['statement']=bad['statement'].replace('121','129')
  elif i==37:bad['statement']=bad['statement'].replace('60','61')
  elif i==39:bad['statement']=bad['statement'].replace('n = 8','n = 9')
  elif i==31:bad['statement']=bad['statement'].replace('мәні 32','мәні 33')
  elif i==45:bad['statement']=bad['statement'].replace('= 32','= 33')
  else:
   m=re.search(r'\d+',bad['statement']);assert m;bad['statement']=bad['statement'][:m.start()]+str(int(m.group())+1)+bad['statement'][m.end():]
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'savedSource':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'complete source/new conditions, solutions and every MCQ read; independent exact Fraction/AST/rational polynomial calculations from printed givens, no author JS/params; not separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare division')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':47,'findings':0,'allSavedNewConditionsSolutionsMCQsRead':47,'wrongKeysRejected':47,'printedSemanticCanariesRejected':canaries,'newSolutionNumericEqualitiesVerified':equalities,'exactRationalSymbolicProofs':True,'pythonJavaScriptHashesMatched':47,'nativeFractions':check['fractions'],'separateHumanReviewer':False}
 report={'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
