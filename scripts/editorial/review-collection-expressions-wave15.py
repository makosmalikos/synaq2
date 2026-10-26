"""Independent25fullsaved/newexpressions review; no author calculator imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-expressions-wave15.json'
OUT='problems/editorial/reviews/collection-expressions-wave15.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def tree(s):
 decimals={}
 def decimal(m):
  name='DECIMAL'+str(len(decimals));decimals[name]=F(m[0].replace(',','.'));return name
 s=re.sub(r'\d+,\d+',decimal,s.replace('−','-').replace('×','*').replace(':','/').replace('²','**2'))
 s=re.sub(r'(?<=[\d)])(?=[a-z])','*',s);s=re.sub(r'(?<=[a-z])(?=[a-z])','*',s);s=re.sub(r'(?<=[\da-z)])(?=\()','*',s)
 return ast.parse(s.strip(),mode='eval'),decimals

def add(A,B,sign=1):
 out=dict(A)
 for k,v in B.items():out[k]=out.get(k,F(0))+sign*v
 return{k:v for k,v in out.items()if v}
def mult(A,B):
 out={}
 for a,v in A.items():
  for b,w in B.items():
   counts={}
   for name,n in a+b:counts[name]=counts.get(name,0)+n
   key=tuple(sorted(counts.items()));out[key]=out.get(key,F(0))+v*w
 return{k:v for k,v in out.items()if v}
def constant(p):assert all(k==()for k in p),p;return p.get((),F(0))
def polynomial(s):
 t,ds=tree(s)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return{}if n.value==0 else{():F(n.value)}
  if isinstance(n,ast.Name):return{():ds[n.id]}if n.id in ds else{((n.id,1),):F(1)}
  if isinstance(n,ast.UnaryOp):
   assert isinstance(n.op,(ast.USub,ast.UAdd));return{k:v*(-1 if isinstance(n.op,ast.USub)else 1)for k,v in walk(n.operand).items()}
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,(ast.Add,ast.Sub)):return add(a,b,-1 if isinstance(n.op,ast.Sub)else 1)
  if isinstance(n.op,ast.Mult):return mult(a,b)
  if isinstance(n.op,ast.Pow):
   e=constant(b);assert e.denominator==1 and 0<=e<=3;out={():F(1)}
   for _ in range(int(e)):out=mult(out,a)
   return out
  assert isinstance(n.op,ast.Div);d=constant(b);assert d!=0;return{k:v/d for k,v in a.items()}
 return walk(t)
def calc(s,env=None):
 t,ds=tree(s);env={**ds,**dict(env or{})}
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  if isinstance(n,ast.UnaryOp):return-walk(n.operand)if isinstance(n.op,ast.USub)else walk(n.operand)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  assert isinstance(n.op,ast.Pow)and b.denominator==1 and 0<=b<=3;return a**int(b)
 return walk(t)
def modcalc(s,env):
 s=re.sub(r'\|([^|]+)\|',lambda m:'('+str(abs(calc(m[1],env)))+')',s)
 return calc(s,env)
def choose(r,value):
 values=[calc(o)for o in r['options']];assert len(set(values))==4,(r['editionId'],values)
 return one([o for o,v in zip(r['options'],values)if v==value])
# General numerator/denominator polynomial pair; preserve originalvariablepoles.
def rat(s):
 t,ds=tree(s)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):return({():F(n.value)}if n.value else{}),{():F(1)}
  if isinstance(n,ast.Name):return({():ds[n.id]}if n.id in ds else{((n.id,1),):F(1)}),{():F(1)}
  if isinstance(n,ast.UnaryOp):
   a,b=walk(n.operand);return({k:-v for k,v in a.items()}if isinstance(n.op,ast.USub)else a),b
  assert isinstance(n,ast.BinOp);a,b=walk(n.left);c,d=walk(n.right)
  if isinstance(n.op,ast.Mult):return mult(a,c),mult(b,d)
  if isinstance(n.op,ast.Div):return mult(a,d),mult(b,c)
  assert isinstance(n.op,(ast.Add,ast.Sub));return add(mult(a,d),mult(c,b),-1 if isinstance(n.op,ast.Sub)else 1),mult(b,d)
 return walk(t)
def root(eq):
 lhs,rhs=eq.split(' = ');a,b=rat(lhs);c,d=rat(rhs);p=add(mult(a,d),mult(c,b),-1)
 assert set(p)<= {(),(('x',1),)}and p.get((('x',1),),0)!=0
 x=-p.get((),F(0))/p[(('x',1),)];assert calc(lhs,{'x':x})==calc(rhs,{'x':x});return x

UNIVERSAL={1,2,5,10,11,12,13,14,15,16,17,18,19,20,23,25,26}
EXPECTED={1:{():F(5,2)},2:{(('a',1),):F(52),(('b',1),):F(24)},5:{(('n',1),):F(6),(('m',1),):F(15)},10:{(('x',1),):F(-2,5),(('y',1),):F(-5,2)},11:{(('a',1),):F(29,12),(('b',1),):F(-7,20)},12:{(('x',1),):F(-40,7),(('y',1),):F(-16,7)},13:{(('x',1),):F(4),(('y',1),):F(-3)},14:{(('a',1),):F(-57,8)},15:{():F(2,5)},16:{(('m',1),):F(-7),(('n',1),):F(48,5)},17:{(('a',1),):F(47,4),(('b',1),):F(-1,4)},18:{(('a',1),):F(3,10),(('b',1),):F(-23,10)},19:{(('a',1),):F(-237,50),():F(46,25)},20:{(('x',1),):F(6),():F(-38)},23:{(('a',1),):F(-8),(('b',1),):F(-3)},25:{(('b',1),):F(84,25)},26:{(('a',1),):F(77),(('b',1),):F(7),():F(-29)}}
def solve(r):
 n=int(one(r['sourceRefs'])['sourceId']);s=r['statement']
 if n in UNIVERSAL:
  expression=s.split(' өрнегіне айнымалылардың БАРЛЫҚ')[0];p=polynomial(expression);assert p==EXPECTED[n],(n,p,EXPECTED[n]);ps=[polynomial(o)for o in r['options']];assert len({str(sorted(p.items()))for p in ps})==4
  answer=one([o for o,p2 in zip(r['options'],ps)if p==p2]);note=f'ALLREALvalues formal multivariatecoefficientIDENTITY, actualprinted{expression}; fullcoefficientmap{p}, allfourpolynomials distinct. Notsampleat0.'
 elif n in{6,9,24}:
  expression=s.split(' бірмүшесінің')[0];p=polynomial(expression);key,value=one(list(p.items()));assert all(e==1 for v,e in key)and len(key)==(4 if n==9 else 3)
  assert value=={6:F(1,4),9:F(-3,4),24:F(27,40)}[n];answer=choose(r,value);note=f'FormalFULLmonomial{p}, numericcoefficient{value}ONLY, notfullletterexpression orsamplezero; negativefactorparity preserved.'
 elif n==3:
  m=re.fullmatch(r'x = (.*?) болғанда (.*?) өрнегінің мәнін таңдаңыз\.',s);x=calc(m[1]);expr=m[2];value=modcalc(expr,{'x':x});assert x==-3 and value==11;answer=choose(r,value)
  assert calc('−2x²',{'x':x})==-18 and calc('(−2x)²',{'x':x})==36
  note=f'Actualnegativeinput{x}, OUTSIDEminuscoefficientafterx², modulus evaluatedinsidefirst; {expr}→{value}, notsquareentirenegativecoefficient.'
 elif n==7:
  given=s.split('. Алдымен')[0];aexpr,bexpr=given.split(', b = ');aexpr=aexpr.removeprefix('a = ');a,b=calc(aexpr),calc(bexpr)
  expr=re.search(r'Алдымен a мен b мәндерін тауып, (.*?) өрнегінің',s)[1];assert expr=='(85/(a : b))'
  value=calc(expr,{'a':a,'b':b});assert a==F(45,4)and b==F(5,4)and a/b==9 and value==F(85,9)
  assert b!=0 and a/b!=0;assert value!=85/a/b;answer=choose(r,value);note=f'ActualtwoassignedWHOLEexpressions, a{a},b{b}, ratio9, MAINdenominatorENTIRE(a:b), actual{expr}→{value}; alteredlefttoright85/a/bincorrect. Mixed9+4/9 agrees.'
 elif n==8:
  eq=s.split(' орындалады.')[0];x=root(eq);assert x==4
  try:calc(eq.split(' = ')[0],{'x':F(-2)})
  except ZeroDivisionError:pass
  else:raise AssertionError('originalpoleaccepted')
  expression=re.search(r'Алдымен x тауып, (.*?) өрнегінің',s)[1];value=calc(expression,{'x':x});assert value==23;answer=choose(r,value)
  note=f'Actualproportion{eq}, exactcrosspolynomialroot{x}, ORIGINALpole-2excluded, backsubBOTHsides; requested{expression}→{value}, notroot.'
 elif n==21:
  m=re.fullmatch(r'(.*?) және (.*?) өрнектеріне СӘЙКЕСІНШЕ x = (.*?) және x = (.*?) мәндерін қойыңыз\. Осы екі нәтиженің ҚОСЫНДЫСЫН таңдаңыз\.',s);assert m
  first,second,a,b=m.groups();a,b=calc(a),calc(b);v1,v2=calc(first,{'x':a}),calc(second,{'x':b});value=v1+v2
  assert(a,b,v1,v2,value)==(7,-2,F(13,4),F(5,2),F(23,4));assert calc(second,{'x':b})!=calc(second,{'x':a})
  try:calc(second,{'x':F(-4)})
  except ZeroDivisionError:pass
  else:raise AssertionError('poleaccepted')
  answer=choose(r,value);note=f'ActualTWOdifferentassignedinputs inORDER: {first}at{a}→{v1}; {second}at{b}→{v2}; SUM{value}, notsamex; originalvariabledenominatornonzero,pole-4excluded.'
 elif n==22:
  m=re.fullmatch(r'a \+ b = (.*?), ab = (.*?) екені белгілі\. a мен b мәндерін жеке шешпей, (.*?) өрнегінің мәнін таңдаңыз\.',s);assert m;total,product,expression=m.groups();total,product=calc(total),calc(product);p=polynomial(expression)
  assert p==polynomial('6*(a+b)+12*a*b');assert total==3 and product==-2 and total*total-4*product>0
  value=6*total+12*product;assert value==-6;answer=choose(r,value)
  note=f'ExactPOLYNOMIALidentity{expression}=6(a+b)+12ab, actualknownsum{total}/product{product}→{value}; positive discriminant17ensuresrealgivenspossible, noindividualirrationalrootsrequired.'
 else:raise AssertionError(n)
 assert answer==r['answer'],(n,answer,r['answer']);return note

def proof_checks(rows):
 chains=0;lcd=0;expanded=0;by={int(one(r['sourceRefs'])['sourceId']):r for r in rows}
 for n,r in by.items():
  z=r['solution']
  if n in UNIVERSAL:
   expression=r['statement'].split(' өрнегіне')[0];p=polynomial(expression)
   expandedexpr=re.search(r'Жақшаларды ашқанда (.*?)\. Ұқсас',z)[1];assert polynomial(expandedexpr)==p,(n,expandedexpr);expanded+=1
   final=re.search(r'Толық ықшам түр (.*?)\.',z)[1];assert polynomial(final)==p
   sections=z.split('Ұқсас мүшелерді БӨЛЕК жинаймыз: ')[1].split('. Толық ықшам')[0].split('; ')
   for section in sections:
    label,trace=section.split(': ',1);before=trace
    if ', ортақ бөлім 'in trace:
     before,tail=trace.split(', ортақ бөлім ');den,trace=tail.split(': ');den=int(den);lcd+=1
     assert calc(before)==calc(trace.split(' = ')[0]);assert all(int(d)==den for d in re.findall(r'/([0-9]+)\)',trace.split(' = ')[0]))
    terms=trace.split(' = ');values=list(map(calc,terms));assert len(set(values))==1,(n,trace,values);chains+=len(terms)-1
    var=re.match(r'([a-z]) мүшесінің',label)
    coeff=values[-1];key=((var[1],1),)if var else();assert p.get(key,F(0))==coeff,(n,label,coeff,p)
  # Exactarithmetictrace for coefficientproducts and firstassignedmixedexpression.
  traces=[]
  if n in{6,9,24}:traces.append(z.split('Сандық есептеу: ')[1].split('. Коэффициент')[0])
  if n==7:traces.append(z.split('a үшін қадамдар: ')[1].split('. Демек a =')[0])
  if n==21:
   traces=[z.split('Қадамдар: ')[1].split('. Екінші')[0],z.split('Қадамдар: ')[2].split('. Айнымалысы')[0]]
  for trace in traces:
   for chain in trace.split('; '):
    tail=chain.rsplit(', ',1)[-1];terms=tail.split(' = ');assert len(terms)>1,(n,chain);values=list(map(calc,terms));assert len(set(values))==1,(n,chain,values)
    if ': ортақ бөлім 'in chain:assert calc(chain.split(': ортақ бөлім ')[0])==values[0];lcd+=1
    elif ': айқыш 'in chain:assert calc(chain.split(': айқыш ')[0])==values[0]
    chains+=len(terms)-1
 assert 'ең үлкен ортақ көбейткіші 4'in by[2]['solution']and'ең үлкен ортақ көбейткіші 3'in by[5]['solution']and'ең үлкен ортақ көбейткіші 7'in by[26]['solution']
 assert polynomial('52a+24b')==polynomial('4*(13a+6b)');assert polynomial('6n+15m')==polynomial('3*(2n+5m)');assert polynomial('77a+7b')==polynomial('7*(11a+b)')
 assert '(6 + (1/8)) = (49/8)'in by[14]['solution']and'(5 + (3/5)) = 5,6'in by[25]['solution']
 assert polynomial('(49/8)*(2/7)-(7/4)')=={}
 assert polynomial('(3/8)*5,6*a-4,2*(1/2)*a')=={}
 assert '(85/9) = (9 + (4/9))'in by[7]['solution']and calc('(85/9)')==calc('(9+(4/9))')
 return chains,lcd,expanded

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==25;entries=[];refs=set();files=set()
 for row in rows:
  ref=one(row['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('svg')and not raw.get('images');refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(row['statement'])
  note=solve(row);assert row['grade']==6 and row['minimumPlan']=='pro'and len(set(row['options']))==4 and row['options'].count(row['answer'])==1
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':'Independent ACTUALprinted exactFraction multivariatePOLYNOMIAL coefficientidentity forALLvalues, monomialcoefficient, square/modulus/signedinput, fullratio/mainbar, differentinputroles, knownSUM/PRODUCT identity and originaldenominatorpoles. All25canonical saved/new/fullofficial/newsolutions/everyMCQread; noauthorcalculatorimports.','notes':note})
 assert refs==set(range(1,27))-{4}and len(files)==1
 chains,lcd,expanded=proof_checks(rows)
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 badkeys=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:badkeys+=1
  else:raise AssertionError('wrongkeyaccepted')
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>=254
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All25canonical saved/new conditions, FULLofficial/newsolutions and everyMCQ read. Own ACTUALprinted exactFraction multivariatepolynomialAST establishes17universalcoefficientidentities forallvalues, notsampleequality; threeFULLmonomialcoefficientsandnegativeparity; fiveotherrequestedroles include outside-negativecoefficientAFTERsquare/modulus, twoassignments+fullratioMAINdenominator, proportionrootthentarget/pole, DIFFERENTinputroles, knownSUM/PRODUCTwithoutindividualsolutions. Everyprinted expansion/LCD/coefficienttrace checked. Source4SVGexcluded; variants not25claimedmeanings. Findings0; noauthorcalculatorimports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'expandedUniversalIdentities':expanded,'numericProofClaims':chains,'printedLCDSteps':lcd,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
