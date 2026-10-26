"""Independent24 saved/new fullarithmeticpart5 review; no author calculator imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-arithmetic5-wave13.json'
OUT='problems/editorial/reviews/collection-arithmetic5-wave13.json'
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
 lhs,rhs=equation.split(' = ')
 if '|'not in lhs:lhs,rhs=rhs,lhs
 inner=re.search(r'\|([^|]*)\|',lhs)[1];a,b=linear(inner);assert a!=0
 # Normalizeabsoutofanyconstantdenominatorusingmodulusvalue1.
 coef=calc(re.sub(r'\|[^|]*\|','1',lhs));radius=calc(rhs)/coef;assert radius>0
 xs=[(radius-b)/a,(-radius-b)/a];assert len(set(xs))==2 and all(modcalc(lhs,{'x':x})==calc(rhs)for x in xs);return xs
NOTES={
 1:'WHOLEmainbar: numerator15-8.4=6.6, denominator(.36/.04)THEN×7/3-20.4=.6, result11; truelefttorightdivisionmultiplication.',
 2:'ExplicitmixedBORROWcommon18:5+4/18→4+22/18 minus2+11/18=47/18; divide9.4→3.6 then+.284 andNEGATIVE×4.5.',
 3:'Threefractiondenominators4/3/12 ALLtermsLCD12includinglastnumerator, secondbracketsubtractedWHOLE, root12backsub-17/12.',
 4:'Mainbaruppermixed-differencecommon35→153/35; explicitTWOcrosscancels51AND7gives-.6; lower16div-40/9=-3.6, overallpositive1/6.',
 5:'ALLREALidentity, linearpolynomialcoefficientANDconstantidentical(-10/11,-2/5) bothsides; alloriginaldenominatorsconstantnonzero, no0division.',
 6:'FIRSTwholemixedNEGATIVE plusTWOmore subtractive terms; sharedLCD30acrossALLTHREEgives-459/30; numerator-79.5denominator1/4lefttoright→-318.',
 7:'Threepositiveabsvalues, butEXTERNALfirstandlastMINUSremain→-513/100.',
 8:'Actualnegativegivensx-7.2,y=-4.6+(-1.8)=-6.4, distinct|-x|/|y|mean68/10 notSUM13.6.',
 9:'Wholemixedproduct47/9×9/4crosscancel9→11.75; numerator5.88, fulldenominatorSUM4.2, result1.4.',
 10:'Twoexpandedbrackets, outsideNEGATIVE8distributestoBOTH; exactsmallnegativecoefficient-7/10 root90, no rounding.',
 12:'WholefirstTHREEsignedterms common300→-18/300, secondnegative-subtraction.24, final+.18.',
 13:'FunctionNEGATIVEargument-2 substitutedEVERYx includingvariableDENOMINATORx-3; nonzeroden-5, pole3excluded, f(-2)=-17/5.',
 14:'Multiply2.4×40/3→32; divide47/9by.94→50/9; explicitfinalBORROW93+9/45→92+54/45 minus5+25/45→87+29/45.',
 15:'NegativecoefficientsontwoSIDES, rightminus5timesminus8gives+40, uniqueNEGATIVEroot-80backsub160.',
 16:'NumeratortwoABSsum74.4divpositiveABS6.2, wholeparenthesesfirst, ratio12.',
 17:'InnerSUMtwoNEGATIVEfractionscommon120→-109/120; outerminusgives34/120, NEGATIVE×6then+.65→-21/20.',
 18:'Actualfunction3x+(-7/(6x-2)), NEGATIVEargument-2inBOTHterms; den-14givespositive1/2; pole1/3excluded, f=-11/2.',
 19:'Innernegativefraction-2/5thenmixed×13/9÷13/6LEFTTORIGHT→-4/15; explicitfinalwholeBORROW3=2+15/15, result2+11/15.',
 20:'SubtractSECONDwholebracket: minus3×minus4=+12, exactcoefficient6 root-7/2 backsub-54.',
 22:'ALLTHREEtermsLCD60→17/60; divideNEGATIVEunitfraction-1/15 THENmultiply9/17, -9/4; no combineddenominator.',
 23:'AskedSTRICTinterval containingactualroot-7/2, notrootvalue; -4<root<-3, neitherendpointincluded.',
 24:'Givensxpositive6.6,ynegative-4.8; BOTHnegatedBEFOREabs, mean57/10notdifference/SUM.',
 25:'FOURprovidedorderedoperationPATTERNS inFIXEDparentheses; PythonASTstandard×/:before±, resulting9,-1/6,15/2,45, exactlyoneprovidedoptiontarget9.',
 26:'MODULUSonRIGHTwholefractionnumerator, negativeconstantdivisor-1.6; leftratio-4 givesradius6.4, FULLroots1.4and-11.4,SUM-10.'}
def solve(r):
 s=r['statement'];n=int(one(r['sourceRefs'])['sourceId']);note=NOTES[n]
 if n==5:
  eq=s.split(' теңдеуінің')[0];lhs,rhs=eq.split(' = ');a,b=linear(lhs,'y');c,d=linear(rhs,'y');assert a==c and b==d
  assert a==F(-10,11)and b==F(-2,5)
  answer=one([o for o in r['options']if o=='Кез келген нақты сан']);note+=f' Actualeq{eq} formalLINEARIDENTITYforallREALy, notsampleproof; owncoefficients{a},{b}.'
 elif n in{7,16}:
  expression=s.split(' өрнегінің')[0];value=modcalc(expression);answer=choose(r,value);note+=f' Actualprinted{expression}, exactcompleteexternaloperatorsafterabs→{value}.'
 elif n in{8,24}:
  givens=s.split(' берілген')[0].split(' болса')[0];m=re.fullmatch(r'x = (.*?), y = (.*?)(?:,)?',givens);assert m,(n,givens)
  x=calc(m[1]);y=calc(m[2]);value=(abs(-x)+abs(y if n==8 else -y))/2;answer=choose(r,value);note+=f' Actualgivens x{x},y{y}; meanofTWOabsvalues→{value}, notsum.'
 elif n in{13,18}:
  m=re.fullmatch(r'f\(x\) = (.*?) формуласы берілген\. f\((.*?)\) мәнін таңдаңыз\.',s);assert m;formula=m[1];arg=calc(m[2]);value=calc(formula,{'x':arg});answer=choose(r,value)
  pole=F(3)if n==13 else F(1,3)
  try:calc(formula,{'x':pole})
  except ZeroDivisionError:pass
  else:raise AssertionError('functionpoleaccepted')
  assert arg!=pole;note+=f' ActualFORMULA{formula}, argument{arg}inEVERYoccurrence→{value}, forbiddenpole{pole}checked.'
 elif n==23:
  eq=s.split(' теңдеуінің')[0];x=equation_root(eq,'x');valid=[]
  for o in r['options']:
   lo,mid,hi=o.split(' < ');assert mid=='x'
   if calc(lo)<x<calc(hi):valid.append(o)
  answer=one(valid);note+=f' Actualequation{eq} exactroot{x}, all4displayedSTRICTintervalschecked.'
 elif n==25:
  template,target=s.split(' теңдігі')[0].split(' = ');target=calc(target);results=[]
  for o in r['options']:
   ops=o.split(', ');assert len(ops)==4;expr=template
   for op in ops:assert op in{'−','+',':','×'};expr=expr.replace('□',op,1)
   assert'□'not in expr;results.append(calc(expr))
  assert results==[9,F(-1,6),F(15,2),45];answer=one([o for o,v in zip(r['options'],results)if v==target]);note+=f' Actualtemplate{template}, target{target}, EACHprovidedpatternfullASTresults{results}; notclaimingglobalall256uniqueness.'
 elif n==26:
  eq=s.split(' теңдеуінің')[0];xs=roots_abs(eq);answer=choose(r,sum(xs));assert'қосындысын'in s;note+=f' Actualequation{eq} normalizedRIGHTmodulus, complete±roots{xs}bothbacksub, SUM{sum(xs)}.'
 elif ' теңдеу'in s:
  eq=s.split(' теңдеу')[0];var='y'if'y'in eq else'x';x=equation_root(eq,var);answer=choose(r,x);note+=f' Actualeq{eq} ownpolynomialunique{x}, EVERYoriginaldenominatornonzero/bothsidesbacksub.'
 else:
  expr=s.split('сақтап, ',1)[-1].split(' өрнегінің')[0];value=calc(expr);answer=choose(r,value);note+=f' ActualWHOLEprintedexpression{expr}; ownexactFractionAST/ALLoriginaldivisorsnonzero→{value}.'
 assert answer==r['answer'],(n,answer,r['answer']);return note

def solution_steps(rows):
 chains=0;lcd=0;crosscancel=0;by={int(one(r['sourceRefs'])['sourceId']):r for r in rows}
 for r in rows:
  n=int(one(r['sourceRefs'])['sourceId']);z=r['solution']
  if 'Қадамдар: 'not in z:continue
  trace=z.split('Қадамдар: ',1)[1].split(' Толық нәтиже',1)[0].split(' Нәтиже',1)[0].rstrip('.')
  for chain in trace.split('; '):
   tail=chain.rsplit(', ',1)[-1];terms=tail.split(' = ');assert len(terms)>=2,(n,chain);values=[calc(t)for t in terms];assert len(set(values))==1,(n,chain,values)
   if ': ортақ бөлім 'in chain:
    assert calc(chain.split(': ортақ бөлім ')[0])==values[0]
    denominator=int(re.search(r'ортақ бөлім (\d+)',chain)[1]);actual=re.findall(r'/([0-9]+)\)',terms[0]);assert actual and all(int(d)==denominator for d in actual);lcd+=1
   elif ': айқыш 'in chain:assert calc(chain.split(': айқыш ')[0])==values[0];crosscancel+=1
   chains+=1
 for n,text in {2:'(4 + (22/18))',14:'(92 + (54/45))',19:'(2 + (15/15))'}.items():assert text in by[n]['solution']
 assert calc('(4 + (22/18)) − (2 + (11/18))')==F(47,18)
 assert calc('(92 + (54/45)) − (5 + (25/45))')==F(3944,45)
 assert calc('(2 + (15/15)) − (4/15)')==F(41,15)
 for n,expr,val in[(6,'(-220/30) − (104/30) − (135/30)',F(-153,10)),(12,'(205/300) + (44/300) − (267/300)',F(-3,50)),(22,'(-24/60) + (51/60) − (10/60)',F(17,60))]:
  assert calc(expr)==val
  for f in re.findall(r'\([^()]+/[0-9]+\)',expr):assert f in by[n]['solution'].replace('−','-'),(n,f)
 assert'51 және 7'in by[4]['solution']and calc('(153/35) × (-7/51)')==F(-3,5)
 return chains,lcd,crosscancel

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==24;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg');refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent ACTUALprinted exactFractionAST/polynomialidentity/rootbacksub/functionnegativeargumentandpole/fullabsbranches/strictinterval/standardprecedencepattern oracle; all24canonicalfullsaved/new/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs==set(range(1,27))-{11,21}and len(files)==1
 chains,lcd,crosscancel=solution_steps(rows)
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>=455
 badkeys=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkeyaccepted')
 identities=0
 for n in range(-100,101):
  for d in range(1,11):
   y=F(n,d);assert calc('(y/11) - (y + (2/5))',{'y':y})==calc('(1/10) - ((10y/11) + 0,5)',{'y':y});identities+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All24canonicalpart5 fullsaved/new/officialsolutions/everyMCQread. OwnACTUALprinted exactFractionAST/polynomialALLREALidentity, functionsnegativeargumentinEVERYoccurrenceandforbiddenpoles, strictintervaltarget, providedoperationpatternswithtrueprecedence, fullmodulus±branchesSUM, threeexplicitBORROWs/sharedTHREEtermLCD/doublecrosscancel. EveryprintedLCD/crosscancelnumericchainverified. TwoSVGsourcesexcluded. Noauthorcalculatorimports; findings0.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'numericChains':chains,'printedLCDSteps':lcd,'printedCrossCancellationSteps':crosscancel,'identityRationalCanaries':identities,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
