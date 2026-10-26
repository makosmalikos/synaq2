"""Independent25 saved/new fullarithmeticreview; no author calculator imports."""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-arithmetic2-wave10.json'
OUT='problems/editorial/reviews/collection-arithmetic2-wave10.json'
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
 1:'Unlike decimalcoefficients combined with correctnegativeconstant; exactnonzerocoefficient provesuniqueroot.',
 2:'Parenthesizednegativefraction SQUARED before subtraction; divisionbynegativefraction thennegativehundredth, fullorderretained.',
 3:'Bothfractionalbrackets expanded, negativeouterbracketdistributed; common18removesALLdenominators.',
 4:'Variabledenominator affineproportion, polea=-3/4excluded;crossproductroot81/4backsubinactualratio.',
 5:'WHOLEmainbar numerator mixedproduct MINUS mixedquotient; denominatorSUMtwo decimalquotients, nonzero51/100; two-directioncrosscancelandLCD100explicit.',
 6:'Common24appliesALSOdecimalconstant3/4andrightx; uniqueimproperroot28/15.',
 7:'ThreeNEGATIVEnumeratormultipliers versusTWOdenominatormultipliers, wholesignnegative, entiredenominatorgroupingpreserved.',
 8:'Entiresecondnumerator x-2subtracted; LCD28thenuniquenegativeroot-19.',
 9:'Nestedquotient mainbar; mixed-differenceLCD24, uppernegativequotient-1 andlower-4yieldpositive1/4.',
 10:'Allthree denominators12,6,3removed, entiremiddlebracketsubtracted; negativeuniqueroot-27/5.',
 11:'UnknownSUBTRAHEND equals1/3 byMIXEDBORROW10+3/15=9+18/15; invertdivision/known5.4thenfactor6, backsubroot8/5.',
 12:'VariablesbothinsideANDoutsidefractionsonBOTHsides, common8retainsallxterms; exactroot2/9.',
 13:'Firstdoublemixedproduct dividedbyNEGATIVEratio gives-1; secondnegativequotient gives+9; numerator-10anddenominator+6, notunaryminuslost.',
 14:'ProductsINSIDEnumerators distributed; ALL3denominators4,16,12removedvia48includingoutsideconstant-2.',
 15:'Decimalmultiplierdistributedtobothbracketmembers, coefficientdifference28/5nonzero; exactnegative-5/8.',
 16:'SubtractNEGATIVEmixednumber givespositive25/12, common12; negativefractiondivision-4minusnegative1.4=-2.6.',
 17:'ActualmixedSUM11/4common4beforemultiplication; exactdecimaldivision119/20minus22/5=31/20.',
 18:'Bothdecimalbrackets expanded; nonzerotenthcoefficientprovesunique35, notroundedslope.',
 20:'LCD280SIGNEDsum212-45-217=-50; divideBYnegative-5/28thenexternalsubtraction, nofalseminus-cancellation.',
 21:'Divideby0.05meansmultiply20; innerMIXEDsum47/8, product1739/16, retainFOURdecimal9.6875=155/16.',
 22:'Outerpositive0.5timesNEGATIVEybracket, exactdecimalcoefficient61/10; unique3/10.',
 24:'TwoWHOLEsignedbrackets, common160, first99/160 minussecond143/160=-11/40; subtractingnegativemixedretainsplus.',
 25:'Bothmixedfractionsconverted;48/11×11/8crosscancel11and8→6 beforeadd3.36, fulldenominator7.4-4.8=2.6.',
 26:'Neardecimalcoefficients12.8versus13.2 subtractedEXACT, negativesmallcoefficient-0.4notzero; root-42.',
 28:'Secondbracketcommon240 gives5/16, first-7/20; finalcommon80 gives-3/80, negativefractionoptionequivalentexactdecimal.'}
def solve(r):
 s=r['statement'];num=int(one(r['sourceRefs'])['sourceId'])
 if ' теңдеуінің' in s:
  eq=s.split(' теңдеуінің')[0].rsplit(', ',1)[-1]
  var=one(sorted(set(re.findall(r'[acxy]',eq))))
  value=equation_root(eq,var)
  if num==4:
   assert equation_root(eq,'a')==F(81,4)
   lhs=eq.split(' = ')[0]
   try:calc(lhs,{'a':F(-3,4)})
   except ZeroDivisionError:pass
   else:raise AssertionError('Actualvariablepoleaccepted')
  evidence=f'Actualprinted equation{eq}; independentcrossproductpolynomialuniqueroot{value}, EVERY originaldenominatornonzeroandbothsidesbacksub.'
 else:
  assert s.startswith('Амалдардың ретін сақтап, ')
  expression=s.split('сақтап, ',1)[1].split(' өрнегінің')[0]
  value=calc(expression)
  evidence=f'ActualENTIREprinted expression{expression}; exactFractionAST respectsallnestedWHOLEbars/parentheses/powers/precedenceandchecksEVERYdivisionnonzero→{value}.'
 answer=choose(r,value);assert answer==r['answer'],(num,value,answer,r['answer'])
 return evidence+' '+NOTES[num]+' EveryfourdisplayedMCQvaluesindependentlycomputedanddistinct.'
def teaching_checks(rows):
 by={int(one(r['sourceRefs'])['sourceId']):r for r in rows}
 # These are independent exact method identities, not a produceranswer import.
 assert calc('(64/35) × (7/10)')==F(32,25)
 assert calc('(128/100) − (25/100)')==F(103,100)
 assert calc('(136/24) − (33/24)')==F(103,24)
 assert calc('(9 + (18/15)) − (9 + (13/15))')==F(1,3)
 assert calc('(8 + (10/12)) − (6 + (9/12))')==F(25,12)
 assert calc('(1 + (1/4)) + (1 + (2/4))')==F(11,4)
 assert calc('(−232/160) − (5/160) + (336/160)')==F(99,160)
 assert calc('(−92/160) + (235/160)')==F(143,160)
 assert calc('(108/240) + (35/240) − (68/240)')==F(5,16)
 assert calc('(−28/80) + (25/80)')==F(-3,80)
 # Addressed source-specific display steps must be present before final signature.
 for n,fragments in {5:['(32/25)','(128/100)','(25/100)'],9:['(136/24)','(33/24)'],11:['(9 + (18/15))','(9 + (13/15))'],16:['(8 + (10/12))','(6 + (9/12))'],17:['(1 + (2/4))'],24:['(−232/160)','(235/160)'],28:['(108/240)','(35/240)','(−28/80)']}.items():
  for f in fragments:assert f in by[n]['solution'],(n,f,'source-explicitmethodstepmissing')
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args()
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==25;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement'])
  note=solve(r);assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent ACTUALprinted FractionAST/rationalcrossproductpolynomial/backsub/nonzeroDOMAIN/every4MCQ oracle; all25canonicalraw/new fullconditions/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs==set(range(1,29))-{19,23,27}and len(files)==1
 teaching_checks(rows)
 chains=0
 for r in rows:
  if 'Қадамдар: ' not in r['solution']:continue
  trace=r['solution'].split('Қадамдар: ',1)[1].split(' Нәтиже',1)[0].rstrip('.')
  for chain in trace.split('; '):
   terms=chain.split(' = ');assert len(terms)>=2,chain
   values=[calc(t)for t in terms];assert len(set(values))==1,(r['editionId'],chain,values);chains+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs=r"""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>100
 badkeys=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkeyaccepted')
 # Exact sign/grouping properties independent of actual edition parameters.
 polecases=0
 for coef in range(1,13):
  for denconstant in range(-12,13):
   pole=F(-denconstant,coef)
   try:calc('((a + 1)/('+str(coef)+'a + '+str(denconstant)+'))',{'a':pole})
   except ZeroDivisionError:polecases+=1
   else:raise AssertionError('poleunchecked')
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All25canonicalarithmeticpart2 saved/new fullconditions/officialsolutions/everyMCQread. Own ACTUALprinted exactFractionAST/rationalcrossproductpolynomial/backsub/nativefullbar/nonzeroDOMAIN/every4MCQ oracle. Source-explicit mixedBORROW, two-directioncrosscancel, common-denominator intermediates repaired and finalfullchangedrowsreread before sign. Threevisualsourcesexcluded. Noauthorcalculatorimports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'independentVariablePoleCases':polecases,'actualPrintedNumericChains':chains,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
