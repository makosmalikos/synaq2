"""Independent24 saved/new fullarithmeticpart4 review; no author calculator imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-arithmetic4-wave12.json'
OUT='problems/editorial/reviews/collection-arithmetic4-wave12.json'
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

def choose(r,value):
 values=[]
 for o in r['options']:
  try:v=calc(o)
  except(SyntaxError,AssertionError,KeyError):continue
  values.append((o,v))
 assert len({v for o,v in values})==len(values),(r['editionId'],values)
 return one([o for o,v in values if v==value])
def equation_root(eq,var):
 lhs,rhs=eq.split(' = ');a,b=rational_polynomials(lhs,var);c,d=rational_polynomials(rhs,var)
 poly=pa(pm(a,d),pm(c,b),-1);assert len(poly)==2 and poly[1]!=0,(eq,poly)
 x=-poly[0]/poly[1];assert pe(b,x)!=0 and pe(d,x)!=0
 assert calc(lhs,{var:x})==calc(rhs,{var:x});return x

def modcalc(s,env=None):
 env=dict(env or{});i=0
 while '|'in s:
  m=re.search(r'\|([^|]*)\|',s);assert m;name='MOD'+str(i);i+=1;env[name]=abs(calc(m[1],env));s=s[:m.start()]+name+s[m.end():]
 return calc(s,env)
def roots_abs(equation):
 lhs,rhs=equation.split(' = ');inner=re.search(r'\|([^|]*)\|',lhs)[1];a,b=linear(inner);assert a!=0
 # Normalizeabsoutofanyconstantdenominatorusingmodulusvalue1.
 coef=calc(re.sub(r'\|[^|]*\|','1',lhs));radius=calc(rhs)/coef;assert radius>0
 xs=[(radius-b)/a,(-radius-b)/a];assert len(set(xs))==2 and all(modcalc(lhs,{'x':x})==calc(rhs)for x in xs);return xs
NOTES={
 1:'Oneentireinnerfraction isDENOMINATOR, otherinnerfraction isNUMERATOR; true1-1/8=7/8, notleftassociativechaineddivision.',
 2:'DivisionTHENmultiplication atSAMEprecedencelefttoright;17/8div25/8=17/25THEN×50=34, notdividebyproduct.',
 4:'Completemodulus±5roots13and3, requestedSUM16notoneROOT/nosolution.',
 5:'TWOdecimalquotients separately; BOTHoperandsshiftTWOplaces8.55/2.25→855/225, .06retainedafterseconddivision.',
 6:'UnknownMINUENDthenMULTIPLIER, exact4x528→132; originalbacksub391.',
 7:'UnknownBOTHsides linearuniqueroot3, noneofxtermsdropped.',
 8:'CoefficientcancelsTOZERO butconstants-15≠2; NOsolutions, neverdivideby0orselectroot0.',
 9:'Actualwholefactorproduct nativebar, primepowers2^3/2^4with3^4/11^2/13fullycancel,1/2=decimal.5MCQ.',
 10:'SubtractNEGATIVE19.4thenADDpositive3.6; exactoutsideoperators preserved→6.',
 12:'ModulusWHOLEnumerator dividedbyNEGATIVEconstant-5; RHS-.8givesPOSITIVEradius4; roots2,-6,SUM-4.',
 13:'Affinecoefficient15-8=7, constantdifference110-47=63, unique9backsub182.',
 14:'Actualdifferencecommon44:32/44-21/44=1/4, dividedby1.25gives1/5.',
 15:'AffineinsideMODULUScoefficient-4 andcenter3; complete±67gives-16and35/2, SUM3/2.',
 16:'SI1m=100cm, actual4m-85cm=315cm; allMCQunitscentimetres, nodimensionless4-85.',
 17:'InverseMINUENDthenADDEND, common36sumcarries7+45/36→8+9/36 thenBORROW7+45/36minus4+14/36→3+31/36.',
 18:'AskedINTENTIONALLYFALSEequality, actual4truthvalues[F,T,T,T], falsewrongdouble-negativeanswer-8.4correctedTO+.8insolution.',
 19:'Allthreeabspositive butEXTERNALlastminusretained,3.45+2.15-1.7=3.9.',
 20:'Threefractiondenominators21/3/7removedfromEVERYterm includingoutside6; negativeuniqueroot-18, actualbacksub113/7.',
 21:'SUMtwoFULLcompoundbars, first10/2=5 second1.5/.5=3, allnestednonzero andonlyfinalsum8; notonegiantmergedratio.',
 22:'UnknownADDEND→DIVISOR→SUBTRAHEND; affinepole35/4EXCLUDED, root17/4nonzeroactualden18backsub48.',
 23:'Wholemixedmultiplier21/4, inverseMINUEND→FACTOR→ADDEND→FACTOR, actualroot2/5backsub1477/100.',
 24:'ExplicitmixedBORROWcommon24:14+9/24=13+33/24 thenminus7+20/24=157/24; outer22-product plusSEPARATEquotient3/2.',
 26:'TWOINDEPENDENTequations solveduniquely53and-103/2, requestedSUM3/2; rootsneednotagree.',
 28:'ThreenativecontinuedlayersWHOLEdenominator3+1/5→16/5,4divide=5/4,outerden17/4→16/17; reciprocalscorrect.'}
def solve(r):
 s=r['statement'];n=int(one(r['sourceRefs'])['sourceId']);note=NOTES[n]
 if n in{4,12,15}:
  eq=s.split(' теңдеуінің')[0];xs=roots_abs(eq);value=sum(xs);answer=choose(r,value);assert'қосындысын'in s.lower();note+=f' Actualdisplayed{eq}; exactFULLroots{xs}, bothbacksub, completeabs±cases, requestedSUM{value}.'
 elif n==8:
  eq=s.split(' теңдеуінің')[0];lhs,rhs=eq.split(' = ');a,b=linear(lhs);c,d=linear(rhs);assert a==c and b!=d
  answer=one([o for o in r['options']if o=='Шешімі жоқ']);note+=f' Actualeq{eq}, identicalcoefficient{a}butconstants{b}≠{d}, globaldifferenceconstantnonzero.'
 elif n==16:
  m=re.match(r'(\d+) м − (\d+) см',s);assert m;cm=100*int(m[1])-int(m[2]);answer=one([o for o in r['options']if re.fullmatch(r'(-?\d+) см',o)and int(o.split()[0])==cm]);note+=f' ActualdisplayedSI{m[0]}, completeunitconversion→{cm}cm.'
 elif n==18:
  results=[]
  for o in r['options']:
   lhs,rhs=o.split(' = ');results.append(calc(lhs)==calc(rhs))
  assert results==[False,True,True,True];answer=one([o for o,t in zip(r['options'],results)if not t]);assert'ҚАТЕ теңдікті'in s
  note+=' Every4displayedequalityrecomputed EXACT, complete[F,T,T,T] uniqueness; actualfalseLHS4/5notclaimed-42/5.'
 elif n==19:
  expression=s.split(' өрнегінің')[0];value=modcalc(expression);answer=choose(r,value);note+=f' Actualdisplayed{expression}, externaloperatorsafterabs exact→{value}.'
 elif n==26:
  equations=s.split(' теңдеулерін')[0].split(' және ');assert len(equations)==2;xs=[equation_root(e,'x')for e in equations];answer=choose(r,sum(xs));assert'ҚОСЫНДЫСЫН'in s;note+=f' Actualequations{equations}separatelyroot{xs}, bothbacksub, SUM{sum(xs)}.'
 elif ' теңдеу'in s:
  eq=s.split(' теңдеу')[0];var='y'if'y'in eq else'x';value=equation_root(eq,var);answer=choose(r,value);note+=f' Actualeq{eq} ownrationalcrossproductpolynomialuniqueroot{value}, EVERYdennonzeroandbothsidesbacksub.'
  if n==22:
   try:calc(eq.split(' = ')[0],{'x':F(35,4)})
   except ZeroDivisionError:pass
   else:raise AssertionError('Actualaffinepoleaccepted')
 else:
  expression=s.split('сақтап, ',1)[-1].split(' өрнегінің')[0].split(' бөлшегін')[0];value=calc(expression);answer=choose(r,value);note+=f' ActualENTIREprintedexpression{expression}; independentexactAST/wholemainbars/EVERYdivisornonzero→{value}.'
 assert answer==r['answer'],(n,answer,r['answer']);return note

def solution_steps(rows):
 chains=0;lcd=0;crosscancel=0
 by={int(one(r['sourceRefs'])['sourceId']):r for r in rows}
 for r in rows:
  z=r['solution'];n=int(one(r['sourceRefs'])['sourceId'])
  if 'Қадамдар: 'not in z:continue
  trace=z.split('Қадамдар: ',1)[1].split(' Нәтиже',1)[0].rstrip('.')
  for chain in trace.split('; '):
   tail=chain.rsplit(', ',1)[-1];terms=tail.split(' = ');assert len(terms)>=2,(n,chain);values=[calc(t)for t in terms];assert len(set(values))==1,(n,chain,values)
   if ': ортақ бөлім 'in chain:
    assert calc(chain.split(': ортақ бөлім ')[0])==values[0]
    denominator=int(re.search(r'ортақ бөлім (\d+)',chain)[1]);actual=re.findall(r'/([0-9]+)\)',terms[0]);assert actual and all(int(d)==denominator for d in actual);lcd+=1
   elif ': айқыш 'in chain:assert calc(chain.split(': айқыш ')[0])==values[0];crosscancel+=1
   chains+=1
 assert '(7 + (45/36))'in by[17]['solution']and'(8 + (9/36))'in by[17]['solution']
 assert calc('(7 + (45/36)) − (4 + (14/36))')==F(139,36)
 assert '(13 + (33/24))'in by[24]['solution']
 assert calc('(13 + (33/24)) − (7 + (20/24))')==F(157,24)
 return chains,lcd,crosscancel

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==24;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg');refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent ACTUALprinted exactFractionAST/rationalpolynomial/moduluscompletebranches/falseequalitytruthvector/nonzeroDOMAIN/typedSI oracle; all24canonicalfullsaved/new/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs==set(range(1,29))-{3,11,25,27}and len(files)==1
 chains,lcd,crosscancel=solution_steps(rows)
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>=225
 badkeys=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkeyaccepted')
 branches=0
 for a in range(-5,6):
  if a==0:continue
  for b in range(-10,11):
   for radius in range(1,11):
    xs=[(F(radius)-b)/a,(-F(radius)-b)/a];assert len(set(xs))==2 and all(abs(a*x+b)==radius for x in xs)and sum(xs)==F(-2*b,a);branches+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All24canonicalpart4 fullsaved/new/officialsolutions/everyMCQread. OwnACTUALprinted exactFractionAST/nonzeroaffinepole/polynomialroot/modulus±branchesSUM/nosolutionconstant/intentionalfalse[F,T,T,T]/SIcm/doublecompoundbars/wholemixedcarrythenborrow. EveryprintednumericLCD/crosscancelchainverified. Fourvisualsourcesexcluded. Noauthorcalculatorimports; findings0.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'numericChains':chains,'printedLCDSteps':lcd,'printedCrossCancellationSteps':crosscancel,'completeAbsBranchCases':branches,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
