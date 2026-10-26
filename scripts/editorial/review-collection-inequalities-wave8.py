"""Independent47 canonical inequalities source/new fullsolutions/everyMCQ.
Own actual-printed exact Fraction and unit/domain conservation, no author imports.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-inequalities-wave8.json'
OUT='problems/editorial/reviews/collection-inequalities-wave8.json'
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
def choose_set(r,domain,var='x'):return one([o for o in r['options']if set_option(o,var)==domain])
def roundtrip_set(s,domain,var='x'):
 # Exact symbolicaffineness proves allreals; endpoints/interior/exterior are diagnostic checks.
 values={F(-100),F(-1),F(0),F(1),F(100)}
 if domain!=EMPTY:
  lo,hi,lc,rc=domain
  for b in[lo,hi]:
   if b is not None:values.update([b-1,b-F(1,1000),b,b+F(1,1000),b+1])
  if lo is not None and hi is not None:values.add((lo+hi)/2)
 for x in values:assert predicate(s,x,var)==member(domain,x),(s,domain,x)
 return len(values)
def comparison_of(s,k):
 s=s.split(' қос теңсіздігінің')[0].split(' теңсіздігінің')[0]
 if k=='affine-cancel-all-real':s=s.split('ықшамдап, ')[1]
 if k=='affine-listed-candidate':s=s.split('қайсысы ')[1].split(' теңсіздігін')[0]
 return s
RAY={'affine-ray','left-coefficients-cancel-ray','affine-cancel-all-real','common-numerator-affine-ray'}
DOUBLE={'positive-affine-double','zero-left-positive-affine-double','decimal-divisor-positive-affine-double','fractional-endpoint-positive-affine-double','mixed-left-positive-affine-double','mixed-right-positive-affine-double'}
def solve(r):
 k=r['skillFamily'];s=r['statement'];answer=None;probes=0
 if k in RAY or k in DOUBLE:
  comparison=comparison_of(s,k);var='y'if'y'in comparison else'x';domain,proof=solve_set(comparison,var);answer=choose_set(r,domain,var);probes=roundtrip_set(comparison,domain,var)
  if k=='left-coefficients-cancel-ray':assert linear(split_comparison(comparison)[0][0])[0]==0
  if k=='affine-cancel-all-real':assert domain==ALL and all(p[0]=='constant'for p in proof)
  note=f'Actualprinted FULLsolutionSET {domain}; independent rational-polynomial affine reduction {proof}. Signflip bynegativecoefficient and endpointstrict/inclusive exact; symbolic ASTprovesallreals, diagnostic boundary/interior/exteriorchecks{probes}.'
 elif k in{'affine-largest-integer','affine-smallest-integer','affine-natural-sum','opposite-like-terms-natural-sum'}:
  comparison=comparison_of(s,k);domain,proof=solve_set(comparison);probes=roundtrip_set(comparison,domain)
  if k in{'affine-natural-sum','opposite-like-terms-natural-sum'}:
   assert domain[1]is not None;hits=[i for i in range(1,1001)if predicate(comparison,F(i))];value=sum(hits);assert not predicate(comparison,F(1001))and domain[1]<1000
   note=f'Actualprinted affine{proof}→domain{domain}; NATURALstarts1, finitecompletehits{hits}, requestedSUM{value}notCOUNT{len(hits)}.'
  else:
   hits=[i for i in range(-1000,1001)if predicate(comparison,F(i))];value=max(hits)if k=='affine-largest-integer'else min(hits);assert value not in{-1000,1000};assert predicate(comparison,F(value))and not predicate(comparison,F(value+(1 if k=='affine-largest-integer'else-1)))
   note=f'Actualprinted affine{proof}→domain{domain}; requestedextremeINTEGER{value}, completeintegerwindowplusformalboundproof, adjacentintegerexcluded.'
  answer=one([o for o in r['options']if calc(o)==value])
 elif k in{'parameter-root-negative','parameter-root-positive'}:
  equation=s.split(' теңдеуінің')[0];m=re.fullmatch(r'\((\d+)x − (\d+)\) − \((\d+)a \+ (\d+)\) = 0',equation);assert m
  xc,b,ac,d=map(F,m.groups());assert xc>0 and ac>0;bound=-(b+d)/ac;domain=(None,bound,False,False)if k.endswith('negative')else(bound,None,False,False)
  for a in[bound-1,bound,bound+1,F(0),F(-100),F(100)]:
   x=(ac*a+b+d)/xc;assert calc(equation.split(' = ')[0],{'a':a,'x':x})==0
   assert(x<0 if k.endswith('negative')else x>0)==member(domain,a)
  answer=choose_set(r,domain,'a');note=f'Actualtwo-variableequation{xc}x−{ac}a−{b+d}=0→unique x=({ac}a+{b+d})/{xc}; signcondition exactparameterSET{domain}. Boundaryroot0excluded; backsubpositive/negativea.'
 elif k=='strict-integer-count':
  comparison=s.split(' теңсіздігінің')[0];domain,proof=solve_set(comparison);hits=[i for i in range(-1000,1001)if predicate(comparison,F(i))];assert domain[0]>-1000 and domain[1]<1000
  answer=one([o for o in r['options']if calc(o)==len(hits)]);note=f'Fullintegerdomain{domain}: completecount{len(hits)}, includesNEGATIVE/ZERO/POSITIVE, endpointsbothstrictnotcounted.'
 elif k=='proper-fraction-largest':
  fractions=re.findall(r'\(\d+/\d+\)',s);assert fractions==r['options'];qs=list(map(calc,fractions));assert all(0<q<1 for q in qs);maximum=max(qs);answer=one([o for o,q in zip(fractions,qs)if q==maximum]);note=f'Actualprintedproperfractions{qs}, exactcrossmultiplication Fraction comparison, greatest{maximum}, noindependentnumeratorcomparison.'
 elif k=='negative-interval-listed-candidate':
  comparison=s.split('сан ')[1].split(' қос теңсіздігін')[0];answer=one([o for o in r['options']if predicate(comparison,calc(o))]);note=f'Printednegativeinterval{comparison}; everycandidatebothstrictinequalitieschecked, correct{answer}; negativeordernotmagnitude.'
 elif k in{'absolute-order-inner-and-outer','absolute-order-no-last-modulus'}:
  m=re.match(r'A = (.*?), B = (.*?), C = (.*?)\.',s);assert m;values={}
  for name,e in zip('ABC',m.groups()):
   while'|'in e:
    match=re.search(r'\|([^|]+)\|',e);assert match;e=e[:match.start()]+'('+fmt(abs(calc(match.group(1))))+')'+e[match.end():]
   values[name]=calc(e)
  def valid(o):
   letters=re.split(r'\s*>\s*',o);return len(letters)==3 and all(values[a]>values[b]for a,b in zip(letters,letters[1:]))
  answer=one([o for o in r['options']if valid(o)]);note=f'Actualinner/outermoduliandoutsideMINUS evaluated separately {values}; uniqueORDER{answer}, notabssumofseparatemagnitudes.'
 elif k.startswith('equation-'):
  equation=s.split(' теңдеуінің')[0];value=root(equation);answer=one([o for o in r['options']if predicate(o,value)]);assert sum(predicate(o,value)for o in r['options'])==1
  if k=='equation-root-at-inclusive-mixed-boundary':assert value==calc(r['options'][1].split(' ≤ ')[0])and not predicate(r['options'][0],value)
  note=f'Actualprintedequation{equation}→uniqueexactroot{value}; backsubbothsides, all4 intervalpredicatesincludingmixedsignedbounds/strictvsinclusivechecked; rootbelongsONLY{answer}.'
 elif k=='affine-listed-candidate':
  comparison=comparison_of(s,k);answer=one([o for o in r['options']if predicate(comparison,calc(o))]);domain,proof=solve_set(comparison);probes=roundtrip_set(comparison,domain);note=f'Actualprintedcomparison{comparison}, formalSET{domain}; actualcandidatesbacksubbothsidesexactly, only{answer}.'
 elif k=='positive-numerator-variable-denominator-listed':
  comparison=s.split(' теңсіздігін')[0];m=re.fullmatch(r'\((\d+)/\((\d+)x − (\d+)\)\) > 0',comparison);assert m;top,a,b=map(F,m.groups());assert top>0 and a>0;pole=b/a
  answer=one([o for o in r['options']if predicate(comparison,calc(o))]);assert not predicate(comparison,pole)and fmt(pole)in r['options']
  note=f'ActualpositiveNUM{top} and variableDEN{a}x−{b}; nonzerodomain x≠{pole}, positiveiffx>{pole}. EVERYcandidateevaluated, explicitpoleofferedandexcluded, unique{answer}.'
 elif k in{'exact-closed-affine-expression-image','mixed-bracket-affine-expression-image'}:
  m=re.fullmatch(r'Егер (.*?) болса, (.*?) өрнегі қабылдайтын БАРЛЫҚ мәндердің дәл жиынын таңдаңыз\.',s);assert m;domain,_=solve_set(m[1]);a,b=linear(m[2]);assert a>0 and domain[0]is not None and domain[1]is not None
  image=(domain[0]*a+b,domain[1]*a+b,domain[2],domain[3]);answer=choose_set(r,image);assert calc(m[2],{'x':domain[0]})==image[0]and calc(m[2],{'x':domain[1]})==image[1]
  note=f'ActualinputSET{domain}, printedaffineexpression{m[2]}coefficient{a}>0→EXACTimage{image}, preservesbothendpointflags. Positiveaffinebijectiveontoimageprovesallvalues, weakersetnotaccepted.'
 else:raise AssertionError(k)
 assert answer==r['answer'],(r['editionId'],r['answer'],answer)
 return note,probes
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==47;entries=[];refs={};probes=0
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.setdefault(ref['sourceFile'],set()).add(int(ref['sourceId']));norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note,checks=solve(r);probes+=checks
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted exact Fraction/rational-polynomial AST/solution-set/domain/target oracle; all47canonicalraw/new fullconditions/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert sorted(map(len,refs.values()))==[23,24]
 for f,ids in refs.items():assert ids==set(range(1,len(ids)+1))
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native==132
 badkeys=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkey accepted')
 formal=0
 for a in range(-9,10):
  for b in range(-9,10):
   for op in['<','≤','>','≥']:
    comparison=f'{a} × x + ({b}) {op} 0';domain,_=solve_set(comparison)
    for x in[F(-7,3),F(-1),F(0),F(2,5),F(10)]:assert predicate(comparison,x)==member(domain,x);formal+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All47canonicalinequalitypart1/2 saved/new fullconditions/officialsolutions/everyMCQread. Own exactactualprinted rational-polynomialaffine AST proves complete realsets, strict/inclusive boundaries andsignflip, constantall-real cancellation, finiteinteger/naturalSUMtargets, parameterroot sign, actualmodulusgrouping, listedrootintervals, nonzerovariabledenominator andexactimage. Findings0; noauthorcalculatorimports. Repeatedequations/model forms do notclaimsemanticuniqueness.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'diagnosticBoundaryProbes':probes,'formalAffinePredicateCases':formal,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
