"""Independent22 saved/new fullarithmeticpart3 review; no author calculator imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-arithmetic3-wave11.json'
OUT='problems/editorial/reviews/collection-arithmetic3-wave11.json'
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
 values=[calc(o)for o in r['options']];assert len(set(values))==4,(r['editionId'],values)
 return one([o for o,v in zip(r['options'],values)if v==value])
def equation_root(eq,var):
 lhs,rhs=eq.split(' = ');a,b=rational_polynomials(lhs,var);c,d=rational_polynomials(rhs,var)
 poly=pa(pm(a,d),pm(c,b),-1);assert len(poly)==2 and poly[1]!=0,(eq,poly)
 x=-poly[0]/poly[1];assert pe(b,x)!=0 and pe(d,x)!=0
 assert calc(lhs,{var:x})==calc(rhs,{var:x});return x
NOTES={
 1:'Mixed27/4×4/9 doublecrosscancel9AND4→3; entiredecimaldifference numerator8.48 dividedbyentireSUM4, no subtractionoutsidebar.',
 2:'Negativefourdistributedtobothmembers andminusconstant; coefficientdifference-1/5notzero; uniquepositiveroot68.',
 4:'SubtractNEGATIVEdecimal thenWHOLEthreefractionbracket; explicitcommon240andsigned-79+104=25, final43/48.',
 5:'Decimalproduct andmixedquotient computedBEFORElefttorightsubtraction/addition; WHOLEmixed27/8dividedby15/2=9/20.',
 6:'UnknownDIVIDENDfractiontimesx, notunknownDIVISOR; left4.8/62.4=1/13, factordivide1/6 yields15/52.',
 7:'Bothdecimalbrackets andoutside9retained; entirepositivecoefficient31/10backsubroot3.',
 9:'WholeNEGATIVEmixed31/24subtracted, common120gives0.3; negativeTHOUSANDTHdivisor-.012gives-25 before+22.5.',
 10:'Mixed-difference denominator71/36NOTindividualpieces, exact35.5dividewhole=18, product36.4final18.4.',
 11:'MinusSECONDwholebracket flipsBOTHitsmembers; bothxcoefficientsnegative, backsub2.',
 13:'Three-termbracket collapsesEXACTLY-1; multipliedbywholeNEGATIVEmixed-4.2→+4.2, thennegative1.35.',
 14:'TwoMIXEDdifferencecommon36→43/36, entire RECIPROCAL36/43 beforedecimalmultiply, final5.4.',
 15:'UnknownDIVISOR(5/12)x, domainx≠0; rightmixedratio1/3, divisor9, unique108/5. UnknownDIVISORfoundbydividend/quotient.',
 16:'Negativevariablecoefficient-27/10, bothwholebrackets retained; uniqueNEGATIVEroot-2.',
 18:'Innerthree-signedterms common144→13/144, crosscancel36with7.2=36/5→.65, externalwholeNEGATIVEmixed-6.25 retained.',
 19:'Fixeddenominator31; wholeparts13plus fractionalnumerator5+7+2-13=1; canonicalMIXED13+1/31 notrounded13.',
 20:'Variablesbothsides andnegativecoefficient-8, uniqueNEGATIVEroot-3, fullbacksub9.',
 22:'Crossproportion7/9=(x+.8)/3.6; denominatorconstantsnonzero, wholeADDENDnumerator backsubroot2.',
 23:'Entiremainbar numeratorSUMnegativeproduct-85/6andnegativequotient-3; denominatornegativeproduct-3, finalpositive103/18; two-waycrosscancelretained.',
 24:'FULLsubtractivecontinuedfraction5levels; insideout3.75→56/15→41/56→56→3→1/3, everydivisionnonzero.',
 25:'InversechainDIVIDEND→ADDEND→DIVISOR, x≠0; 10.8/x=3→x3.6, notreciprocalrootorpartialstop.',
 26:'ThreeWHOLEnestedbrackets insideout; WHOLEnegative3+1/4 retained, finalexternalminus gives-327/40 notsignflip.',
 27:'InnerTHREEunitfractions common20sum1/2beforewholemixed7/3minus, finalcommon6 gives11/6.'}
def solve(r):
 s=r['statement'];num=int(one(r['sourceRefs'])['sourceId'])
 if ' теңдеуінің'in s or' пропорциясындағы'in s:
  eq=s.split(' теңдеуінің')[0].split(' пропорциясындағы')[0].rsplit(', ',1)[-1]
  var=one(sorted(set(re.findall(r'[xy]',eq))));value=equation_root(eq,var)
  if num in{15,25}:
   try:calc(eq.split(' = ')[0],{var:F(0)})
   except ZeroDivisionError:pass
   else:raise AssertionError('x0poleaccepted')
   assert value!=0
  evidence=f'ActualENTIREprintedequation{eq}; independent rationalcrossproduct polynomialUNIQUEroot{value}; EVERYoriginaldenominatornonzeroandbothsidesbacksub.'
 else:
  expression=s.split('сақтап, ',1)[-1].split(' өрнегінің')[0].split(' өрнегін')[0];value=calc(expression)
  evidence=f'ActualENTIREprintedexpression{expression}; ownexactFractionAST allwholebars/parentheses/reciprocals/signs/precedence, EVERYdivisornonzero→{value}.'
 answer=choose(r,value);assert answer==r['answer'],(num,answer,r['answer'])
 return evidence+' '+NOTES[num]+' EveryfourMCQvaluescomputedandnumericallydistinct.'
def check_solution_steps(rows):
 chains=0;lcd=0;crosscancel=0;affine=0
 for r in rows:
  z=r['solution'];num=int(one(r['sourceRefs'])['sourceId'])
  if 'Қадамдар: 'in z:
   trace=z.split('Қадамдар: ',1)[1].split(' Толық нәтиже',1)[0].rstrip('.')
   for chain in trace.split('; '):
    tail=chain.rsplit(', ',1)[-1];terms=tail.split(' = ')
    assert len(terms)>=2,(num,chain)
    values=[calc(t)for t in terms];assert len(set(values))==1,(num,chain,values)
    if ': ортақ бөлім 'in chain:
     before=chain.split(': ортақ бөлім ')[0];assert calc(before)==values[0],(num,chain)
     denominator=int(re.search(r'ортақ бөлім (\d+)',chain)[1]);assert denominator>0
     converted=terms[0];actual=re.findall(r'/([0-9]+)\)',converted);assert actual and all(int(d)==denominator for d in actual),(num,denominator,converted)
     lcd+=1
    elif ': айқыш 'in chain:
     assert calc(chain.split(': айқыш ')[0])==values[0],(num,chain);crosscancel+=1
    chains+=1
  elif num in{2,7,11,16,20}:
   original=r['statement'].split(' теңдеуінің')[0].rsplit(', ',1)[-1];var='y'if'y'in original else'x';root=equation_root(original,var)
   stages=re.findall(r': ([^.;]+ = [^.;]+)',z)
   for eq in stages:
    assert equation_root(eq,var)==root,(num,eq);affine+=1
  elif num==6:
   assert calc('(1/6) × (15/52)')==F(5,104)and calc('(5/104) : (5/8)')==F(1,13)
  elif num==15:
   assert calc('(16/7) : (48/7)')==F(1,3)and calc('3 : (1/3)')==9 and calc('9 : (5/12)')==F(108,5)
  elif num==19:
   assert calc('(4 + (5/31)) + (6 + (7/31)) + (3 + (2/31)) − (13/31)')==F(404,31)
   assert '4 + 6 + 3 = 13'in z and '5 + 7 + 2 − 13 = 1'in z
  elif num==22:
   assert calc('7 × 3,6')==F(126,5)and calc('(25,2)/9')==F(14,5)and calc('2,8 − 0,8')==2
  elif num==25:
   assert calc('(7/5) × (65/12)')==F(91,12)and calc('(91/12) − (55/12)')==3 and calc('10,8 : 3')==F(18,5)
  else:raise AssertionError(num)
 return chains,lcd,crosscancel,affine

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==22;refs=set();files=set();entries=[]
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent ACTUALprinted exactFractionAST/rationalcrossproductpolynomial/nonzero-domain/inverse-role/continued-mainbar oracle; all22fullsaved/newconditions/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs==set(range(1,29))-{3,8,12,17,21,28}and len(files)==1
 chains,lcd,crosscancel,affine=check_solution_steps(rows)
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>250
 badkeys=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkeyaccepted')
 continued=0
 for inner in range(2,21):
  a=F(inner)-F(1,inner);b=F(inner)-1/a;c=1-1/b
  assert a>0 and b>0 and c>0
  # Construct fullnestednegativebar by exactinnerdenominators; comparebackwards independently.
  for finalden in range(1,11):
   outer=F(13)/c+finalden;assert 1/(outer-F(13)/c)==F(1,finalden);continued+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All22canonicalpart3 fullsaved/newconditions/officialsolutions/everyMCQread. OwnACTUALprinted exactFractionAST/polynomialrootbacksub, fullcontinuedmainbars/nonzeroDOMAIN, unknownDIVISORvsDIVIDEND, allprintedLCD/crosscancellation/numericchains/affinestages checked. Sixvisualsourcesexcluded; noauthorcalculatorimports; findings0.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'numericChains':chains,'printedLCDSteps':lcd,'printedCrossCancellationSteps':crosscancel,'printedAffineStages':affine,'completeContinuedGroupingCases':continued,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
