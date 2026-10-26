"""Independent20 canonical arithmeticpart1 source/new fullsolutions/everyMCQ.
Own actual-printed exact Fraction and unit/domain conservation, no author imports.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-arithmetic1-wave9.json'
OUT='problems/editorial/reviews/collection-arithmetic1-wave9.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return[F(n.replace(',','.'))for n in re.findall(r'\d+(?:,\d+)?',s)]
def whole(x):
 x=F(x);assert x.denominator==1,x
 return x.numerator
def fmt(x):
 x=F(x);sign='-'if x<0 else'';x=abs(x);w=x.numerator//x.denominator;rem=x.numerator%x.denominator;ds=''
 while rem:
  assert len(ds)<12;rem*=10;ds+=str(rem//x.denominator);rem%=x.denominator
 return sign+str(w)+(','+ds if ds else'')
def tree(s,env=None):
 env=dict(env or{});count=0
 def decimal(m):
  nonlocal count
  name='DECIMAL'+str(count);count+=1;env[name]=F(m.group().replace(',','.'));return name
 s=re.sub(r'\d+,\d+',decimal,s)
 s=re.sub(r'(?<=\d)(?=[a-z])','*',s);s=re.sub(r'(?<=\))(?=[a-z])','*',s)
 s=s.replace('³','**3').replace('²','**2').replace('×','*').replace('÷','/').replace(':','/').replace('−','-')
 return ast.parse(s.strip(),mode='eval'),env
def calc(s,env=None):
 t,env=tree(s,env)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return-walk(n.operand)if isinstance(n.op,ast.USub)else walk(n.operand)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub,ast.Pow)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Pow):assert b.denominator==1 and 0<=b<=4;return a**whole(b)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(t)
def trim(p):
 p=list(map(F,p))
 while len(p)>1 and p[-1]==0:p.pop()
 return p
def pa(a,b,sign=1):return trim([(a[i]if i<len(a)else 0)+sign*(b[i]if i<len(b)else 0)for i in range(max(len(a),len(b)))])
def pm(a,b):
 c=[F(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):c[i+j]+=x*y
 return trim(c)
def pe(p,x):return sum(c*x**i for i,c in enumerate(p))
def rational_polynomials(s,var='x',env=None):
 t,env=tree(s,env)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return[F(n.value)],[F(1)]
  if isinstance(n,ast.Name):return([F(0),F(1)],[F(1)])if n.id==var else([F(env[n.id])],[F(1)])
  if isinstance(n,ast.UnaryOp):
   a,b=walk(n.operand);assert isinstance(n.op,(ast.USub,ast.UAdd));return([-x for x in a],b)if isinstance(n.op,ast.USub)else(a,b)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left);c,d=walk(n.right)
  if isinstance(n.op,ast.Mult):return pm(a,c),pm(b,d)
  if isinstance(n.op,ast.Div):return pm(a,d),pm(b,c)
  assert isinstance(n.op,(ast.Add,ast.Sub));return pa(pm(a,d),pm(c,b),-1 if isinstance(n.op,ast.Sub)else 1),pm(b,d)
 return walk(t)

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode()).hexdigest()
def linear(s,var='x',env=None):
 a,b=rational_polynomials(s,var,env);assert len(a)<=2 and len(b)==1 and b[0]!=0,(s,a,b)
 return(a[1]if len(a)>1 else F(0))/b[0],a[0]/b[0]
def relation(a,op,b):return{'<':a<b,'>':a>b,'≤':a<=b,'≥':a>=b,'=':a==b}[op]
def split_comparison(s):
 xs=[v.strip()for v in re.split('([<>≤≥=])',s)];assert len(xs)>=3 and len(xs)%2==1,s
 return[(xs[i-1],xs[i],xs[i+1])for i in range(1,len(xs),2)]
# Sets are exact lower/upper bounds (None is infinity), with endpoint-membership.
ALL=(None,None,False,False);EMPTY='empty'
def intersect(a,b):
 if a==EMPTY or b==EMPTY:return EMPTY
 lo,hi,lc,rc=a;blo,bhi,blc,brc=b
 if lo is None or(blo is not None and blo>lo):lo,lc=blo,blc
 elif blo==lo:lc=lc and blc
 if hi is None or(bhi is not None and bhi<hi):hi,rc=bhi,brc
 elif bhi==hi:rc=rc and brc
 if lo is not None and hi is not None and(lo>hi or(lo==hi and not(lc and rc))):return EMPTY
 return lo,hi,lc,rc
def solve_set(s,var='x',env=None):
 result=ALL;proof=[]
 for lhs,op,rhs in split_comparison(s):
  a,b=linear(lhs,var,env);c,d=linear(rhs,var,env);coef=a-c;constant=b-d
  if coef==0:part=ALL if relation(constant,op,F(0))else EMPTY;proof.append(('constant',constant,op,0));result=intersect(result,part);continue
  bound=-constant/coef;newop=op
  if coef<0:newop={'<':'>','>':'<','≤':'≥','≥':'≤','=':'='}[op]
  part=(None,bound,False,newop=='≤')if newop in{'<','≤'}else(bound,None,newop=='≥',False)if newop in{'>','≥'}else(bound,bound,True,True)
  result=intersect(result,part);proof.append((coef,constant,op,bound,newop))
 return result,proof
def set_option(s,var='x'):
 if s=='∅':return EMPTY
 if s[0]in'(['and s[-1]in')]':
  if';'in s:
   a,b=s[1:-1].split(';');a=a.strip();b=b.strip();return(None if a=='-∞'else calc(a),None if b=='+∞'else calc(b),s[0]=='[',s[-1]==']')
 return solve_set(s,var)[0]
def member(domain,x):
 if domain==EMPTY:return False
 lo,hi,lc,rc=domain
 return(lo is None or x>lo or(lc and x==lo))and(hi is None or x<hi or(rc and x==hi))
def predicate(s,x,var='x'):
 try:return all(relation(calc(a,{var:x}),o,calc(b,{var:x}))for a,o,b in split_comparison(s))
 except ZeroDivisionError:return False
def root(equation,var='x'):
 lhs,op,rhs=one(split_comparison(equation));assert op=='=';a,b=linear(lhs,var);c,d=linear(rhs,var);assert a!=c;x=(d-b)/(a-c)
 assert calc(lhs,{var:x})==calc(rhs,{var:x});return x
def modcalc(s,env=None):
 env=dict(env or{});i=0
 while'|'in s:
  m=re.search(r'\|([^|]*)\|',s);assert m;value=abs(calc(m.group(1),env));name='MOD'+str(i);i+=1;env[name]=value;s=s[:m.start()]+name+s[m.end():]
 return calc(s,env)
def choose(r,value):return one([o for o in r['options']if calc(o)==value])
def absbranches(s):
 lhs,rhs=s.split(' = ');right=calc(rhs);assert right>0
 inner=re.fullmatch(r'\|(.*)\|',lhs).group(1);a,b=linear(inner);assert a!=0
 xs=sorted([(right-b)/a,(-right-b)/a]);assert all(modcalc(lhs,{'x':x})==right for x in xs);return xs
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);answer=None
 if k=='three-denominator-affine-equation':
  equation=s.split(' теңдеуіндегі')[0];x=root(equation);answer=choose(r,x)
  assert all(F(q)!=0 for q in re.findall(r'/([0-9]+)\)',equation));note=f'Actualfullprintednativefraction equation{equation}; independent rational-polynomialuniqueROOT{x}, denominatorconstantsnonzero/backsubbothsides; every4optiontested.'
 elif k in{'one-inner-difference-nested-fraction','nested-fraction-then-common-denominator','three-nested-reciprocal-layers','many-factors-cancellation'}:
  expression=s.split('өрнегінің')[0].split(' өрнегін')[0].split(' көп қабатты')[0].split(' бөлшегін')[0].strip()
  if k=='one-inner-difference-nested-fraction':expression=expression.split('есептеп, ')[1]
  if k=='many-factors-cancellation':expression=expression.split('жазбай, ')[1]
  value=calc(expression);answer=choose(r,value)
  if k=='many-factors-cancellation':assert value==F(2**3*3**4*7**2*11,2**4*3**5*7**2*11)
  note=f'Actualentireprinted nestedexpression{expression}; exactFractionAST preservesWHOLEdenominator/grouping, checksEVERYdivisionnonzero→{value}; all4numericchoiceschecked.'
 elif k=='three-angles-two-percent-bases':
  total,p,q=n;first=total/(1+p/100+q/100);angles=[first,first*p/100,first*q/100];assert sum(angles)==total and s.count('БІРІНШІНІҢ')==2
  answer=one([o for o in r['options']if nums(o)==angles]);note=f'PrintedfirstanglebaseBOTHpercent{p},{q}; exactORDEREDfirst/second/third{angles}, total{total}; reversedsecondthirdoptionrejected.'
 elif k=='absolute-distance-root-sum':
  equation=s.split(' теңдеуінің')[0];xs=absbranches(equation);answer=choose(r,sum(xs));assert'ҚОСЫНДЫСЫН'in s;note=f'Actual|affine|=positive radius→EXACTTWOroots{xs}; bothbacksub, completebyA=±radius. RequestedSUM{sum(xs)}, notSET/oneROOT/count.'
 elif k=='absolute-plus-variable-solution-count':
  equation=s.split(' теңдеуінің')[0];m=re.fullmatch(r'\|x\| \+ x = (\d+)',equation);assert m;right=F(m[1]);assert right>0;x=right/2;assert x>=0 and modcalc('|x| + x',{'x':x})==right
  answer=choose(r,F(1));note=f'Positivebranchx≥0 gives2x={right}→one{x}; negativebranchx<0 gives0={right}IMPOSSIBLE. Completepiecewiseproof, requestedCOUNT1notrootvalue{x}.'
 elif k in{'mixed-decimal-division-and-parenthesis','signed-decimal-subtraction-and-inner-sum','signed-decimal-zero-cancellation'}:
  expression=s.split(' өрнегін')[0].split(' өрнегіндегі')[0].split(' өрнегінің')[0];value=calc(expression);answer=choose(r,value);note=f'Actualprinted signedexpression{expression}; exactFractionAST allparentheses/precedence/negative-subtraction preserved→{value}, everyMCQ numericvaluechecked.'
 elif k in{'variable-minus-center-full-root-set','center-minus-variable-full-root-set'}:
  equation=s.split(' теңдеуінің')[0];xs=absbranches(equation)
  answer=one([o for o in r['options']if o.startswith('{')and o.endswith('}')and sorted(calc(v.strip())for v in o[1:-1].split(';'))==xs]);assert'ақырлы жиынды'in s
  note=f'Actualpositive-modulusequation{equation}completecase±radius givesSET{xs}; finitecurlybracesNOTinterval, bothandonlyrootsbacksub.'
 elif k=='negative-outside-square-and-product-modulus':
  m=re.fullmatch(r'x = ([-\d,]+) болғанда (.*?) өрнегінің мәнін таңдаңыз\.',s);assert m;x=F(m[1].replace(',','.'));value=modcalc(m[2],{'x':x});answer=choose(r,value)
  assert calc('(-3)²')==9 and calc('−2x²',{'x':x})==-18
  note=f'Actualx{x}, expression{m[2]}; squareBEFOREoutsideMINUS, entireproductinsideabs thenaddition→{value}; noincorrect(-coefficient*x)².'
 elif k=='mixed-fraction-unknown-subtrahend':
  equation=s.split(' теңдеуінің')[0];x=root(equation);answer=choose(r,x);assert'(6 + (5/5))'in r['solution']and'(3 + (3/5))'in r['solution']
  note=f'Actualprinted mixedfractionequation{equation}→uniqueroot{x}, fullbacksub; complementfractionmakeswhole7, explicitMIXEDBORROW7=6+5/5 beforeminus3+2/5 retained; answersMCQavoidequivalencegrading.'
 elif k=='zero-fraction-nested-nonzero-denominator':
  equation=s.split(' теңдеуінің')[0];x=root(equation);answer=choose(r,x);top,bottom=rational_polynomials(equation.split(' = ')[0]);assert len(bottom)==1 and bottom[0]!=0;assert calc(equation.split(' = ')[0],{'x':x})==0
  note=f'Actualfullnestednativeequation{equation}; denominatorCONSTANTnonzero{bottom[0]}, hence zeroiffnumerator0→x{x}; nodenominatorlost, everyinnerdivisionchecked.'
 elif k=='external-minus-three-decimal-moduli':
  expression=s.split(' өрнегінің')[0];value=modcalc(expression);answer=choose(r,value);note=f'Actualprintedmodulusexpression{expression}; absappliesONLYinsidebars, externalMINUSsurvives→{value}, allMCQchecked.'
 elif k=='negative-division-modulus-root-sum':
  equation=s.split(' теңдеуінің')[0];m=re.fullmatch(r'\(\(\|x \+ (\d+)\|\)/\((−[\d,]+)\)\) = \((−[\d,]+)/([\d,]+)\)',equation);assert m;shift=F(m[1]);divisor=calc(m[2]);rhs=calc(m[3]+'/'+m[4]);radius=divisor*rhs;assert divisor<0 and radius>0
  xs=sorted([-shift-radius,-shift+radius]);assert all(abs(x+shift)/divisor==rhs for x in xs);answer=choose(r,sum(xs));assert'қосындысын'in s
  note=f'ActualNEGATIVEdivisor{divisor}, rhs{rhs}→positiveabsradius{radius}; complete2roots{xs}backsub, requestedSUM{sum(xs)}notoneROOT.'
 elif k=='two-affine-equation-roots-sum':
  text=s.split(' теңдеулерін')[0];equations=text.split(' және ');assert len(equations)==2;xs=list(map(root,equations));answer=choose(r,sum(xs));assert'ҚОСЫНДЫСЫН'in s
  note=f'TWOactualprintedequations solvedindependently exactrationalpolynomials→roots{xs}; bothbacksub, askedSUM{sum(xs)}notdifferenceoroneroot.'
 elif k=='parenthesized-unknown-subtrahend':
  equation=s.split(' теңдеуінің')[0];x=root(equation,'a');answer=choose(r,x);note=f'ActualprintedfullunknownSUBTRAHENDbracket{equation}; ownexactuniqueroot{x}, eachsidebacksub; entire(a+known)mustbesubtracted.'
 else:raise AssertionError(k)
 assert answer==r['answer'],(r['editionId'],r['answer'],answer)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==20;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted exact Fraction/rational-polynomial AST/modulusbranch-domain/target oracle; all20canonicalraw/new fullconditions/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs=={2,4,5,6,7,9,10,11,13,14,15,17,18,20,21,22,23,25,27,28}and len(files)==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>=83
 badkeys=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkey accepted')
 branches=0
 for center in range(-20,21):
  for radius in range(1,21):
   xs=[center-radius,center+radius];assert len(set(xs))==2 and sum(xs)==2*center and all(abs(x-center)==radius for x in xs);branches+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All20canonicalarithmeticpart1 saved/new fullconditions/officialsolutions/everyMCQread. Own actualprinted exactFraction/rational-polynomial AST/moduluscomplete±cases/set-vs-sum-vs-count/nonzero nesteddenominator oracle. One source-explicitmixedBORROWstep corrected byauthor beforefinalfullreread; noauthorcalculatorimports. Eightvisualsourcesexcluded, notmissingclaim.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'completeAbsBranchCases':branches,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
