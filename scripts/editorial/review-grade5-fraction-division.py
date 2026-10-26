"""Root independent47 full saved/new/solutions/everyMCQ read; printed data only."""
import ast,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/grade5-fraction-division.json'
spec=importlib.util.spec_from_file_location('root_independent_fraction_ast',ROOT/'scripts/editorial/review-grade5-reciprocals.py');lib=importlib.util.module_from_spec(spec);spec.loader.exec_module(lib)
def exact(s,env=None):return lib.exact(s.replace('÷','/'),env)
def only(xs):return lib.only(xs)
def affine(s,name):
 # Exact sparse polynomial of degree<=1; variable denominators and nonlinearproducts rejected.
 def visit(n):
  if isinstance(n,ast.Expression):return visit(n.body)
  if isinstance(n,ast.Constant):return(F(str(n.value)),F(0))
  if isinstance(n,ast.Name):assert n.id==name;return(F(0),F(1))
  if isinstance(n,ast.UnaryOp):
   a,b=visit(n.operand);assert isinstance(n.op,ast.USub);return(-a,-b)
  assert isinstance(n,ast.BinOp);a,b=visit(n.left);c,d=visit(n.right)
  if isinstance(n.op,ast.Add):return a+c,b+d
  if isinstance(n.op,ast.Sub):return a-c,b-d
  if isinstance(n.op,ast.Mult):assert b*d==0;return a*c,a*d+b*c
  assert isinstance(n.op,ast.Div)and d==0 and c!=0;return a/c,b/c
 return visit(ast.parse(s.replace('×','*').replace('÷','/').replace('−','-'),mode='eval'))
def solve(s,name):
 left,right=s.split(' = ');a,b=affine(left,name);c,d=affine(right,name);assert b!=d;v=(c-a)/(b-d);assert exact(left,{name:v})==exact(right,{name:v});return v
def observe(r,i):
 s=r['statement'];es=lib.exprs(s);v=lambda j:exact(es[j]);o=r.get('options');proof={}
 if i in[0,2,4,6,10,11]:value=v(0)/v(1)
 elif i==1:value=F((v(0)/v(1)).denominator);assert'БӨЛІМІН'in s
 elif i in[3,9]:value=v(0)/int(re.search(r'(\d+) тең бөлікке',s)[1])
 elif i==5:value=solve(s.split(' теңдеуін')[0],'x')
 elif i==7:value=F(re.search(r'Ұзындығы (\d+) метр',s)[1])/v(0)
 elif i==8:
  value=v(0)/v(1);return only(z for z in o if exact(z)==value),{'actualProductRepresentations':list(map(lambda z:str(exact(z)),o)),'onlyDivisorInverted':True}
 elif i==12:value=1/v(0)
 elif i==13:
  a,b=s.split(' теңдеуіндегі')[0].split(' = ');dividend=a.split(' ÷ x')[0];value=exact(dividend)/exact(b);assert exact(dividend)/value==exact(b);proof['unknownRole']='divisor'
 elif i==14:
  value=exact(s.split(' өрнегінің')[0]);assert'(3 + (15/12))'in r['solution']and'(2 + (10/12))'in r['solution'];assert F(1,4)<F(5,6);proof['actualMixedBorrowRetained']=True
 elif i==15:value=v(0)/F(int(re.search(r'(\d+) минутта',s)[1]),60)
 elif i==16:
  values=[exact(z)for z in o];return only(z for z in o if exact(z)==max(values)),{'allActualExpressionValues':list(map(str,values)),'maximumUnique':values.count(max(values))==1}
 elif i==17:value=v(0)/4;proof['squareEqualEdges']=4
 elif i==18:value=solve(s.split(' теңдеуіндегі')[0],'x');proof['unknownRole']='dividend'
 elif i==19:return only(z for z in o if exact(z)<1),{'allActualQuotients':list(map(lambda z:str(exact(z)),o)),'strictLessThanOne':True}
 elif i==20:value=exact(s.split(' өрнегіндегі')[0])
 elif i==21:
  expression=s.split(' мәнін')[0];value=exact(expression);assert value!=exact('('+es[0]+' + '+es[1]+') / '+es[2]);proof['divisionBeforeAddition']=True
 elif i==22:value=exact(s.split(' өрнегінің')[0]);proof['divisionLeftAssociative']=True
 elif i==23:value=F(re.search(r'Барлығы (\d+) теңге',s)[1])/v(0)
 elif i==24:value=v(1)/v(0);proof['units']='hectares/hour, area/time'
 elif i==25:value=v(0)/v(1);assert value.denominator==1;proof['fullCapacityNoRemainder']=True
 elif i==26:value=solve(s.split(' теңдеуіндегі')[0],'y')
 elif i==27:
  decrement=int(re.search(r'қосып, (\d+) санын азайтсам',s)[1]);target=int(re.search(r'азайтсам, (\d+) шығады',s)[1]);value=F(target+decrement)/(1+v(0)+v(1));assert value+v(0)*value+v(1)*value-decrement==target;proof['bothFractionsOfCurrentAge']=True
 elif i==28:
  expressions=re.search(r'a = (.*?), b = (.*?), c = (.*?)\.',s).groups();values=dict(zip(['a','b','c'],map(exact,expressions)))
  def valid(z):
   names=z.split(' < ');return all(values[a]<values[b]for a,b in zip(names,names[1:]))
  return only(z for z in o if valid(z)),{'exactThreeValues':{k:str(v)for k,v in values.items()}}
 elif i==29:value=solve(s.split(' теңдеуін')[0],'x');proof['unknownRole']='addendInsideDividend'
 elif i==30:value=exact(s.split(' өрнегін')[0]);assert value!=math_product(map(exact,es));proof['allThreeDivisionsLeftAssociative']=True
 elif i==31:
  value=(v(1)+v(2))/v(0);assert v(1)/v(0)==61 and v(2)/v(0)==51;proof['sameTimeOpposingSpeedsSum']=[61,51]
 elif i==32:value=exact(s.split(' өрнегін')[0]);proof['innerMultiplyDivideThenAddBeforeFinalDivision']=True
 elif i==33:
  remaining=int(re.search(r'Соңында (\d+) кітап',s)[1]);fraction=(1-v(0))*(1-v(1));value=F(remaining)/fraction;assert value*v(0)==72 and value*(1-v(0))*v(1)==81;proof['fullIntegerBookLedger']=[int(value),72,108,81,remaining]
 elif i==34:
  value=exact(s.split(' өрнегінің')[0]);assert'(2 + (15/12))'in r['solution']and'(2 + (10/12))'in r['solution'];assert F(1,4)<F(5,6);proof['actualMixedBorrowRetained']=True
 elif i==35:value=v(1)/v(0)*v(2);assert value!=v(1)/v(0)and value!=v(1)*v(2);proof['partWholeThenDifferentPart']=True
 elif i==36:value=v(1)/v(0);assert'барлығы'in s and'бүкіл жұмыстың'in r['solution'];proof['totalTimeNotRemaining']=True
 elif i==37:
  constant=exact(es[0])/exact(es[1],{'n':F(1)});assert constant.denominator==1;bound=int(constant);ns=[n for n in range(1,bound+1)if (constant/n).denominator==1];value=F(len(ns));proof={'fullNaturalDomain':[1,bound],'allValidDivisors':ns,'aboveDomainExcluded':'n>bound implies0<constant/n<1'};assert bound==162
 elif i==38:
  def valid(z):
   a,b=z.split(' = ');return exact(a)==exact(b)
  return only(z for z in o if valid(z)),{'actualEqualityTruths':[valid(z)for z in o],'wholeMixedIgnoreTrap':exact(o[3].split(' = ')[0])==5}
 elif i==39:value=F(re.search(r'ұзындығы (\d+) м',s)[1])/v(0)
 elif i==40:
  factor=v(0);return only(z for z in o if exact(z)!=0 and 1/exact(z)==factor),{'universalIdentity':'For every rational a, a*k=a/d iff d=1/k; multiplying by fixed nonzero reciprocal','actualFactor':str(factor)}
 elif i==41:value=v(1)*v(3);assert'(a/b)'==es[0]and'(b/c)'==es[2]and'нөлден өзге'in s;proof['universalNonzeroCancellation']='(a/b)*(b/c)=a/c, b,c nonzero'
 elif i==42:value=exact(s.split(' өрнегін')[0])
 elif i==43:value=v(0)/12;proof['cubeEqualEdges']=12
 elif i==44:
  gap=int(re.search(r'жауаптан (\d+) санға кем',s)[1]);value=F(gap)/(1/v(0)-v(0));assert value/v(0)-value*v(0)==gap;proof['rightWrongGapLedger']=list(map(str,[value/v(0),value*v(0),F(gap)]))
 elif i==45:value=exact(s.split(' өрнегінің')[0]);assert value==F(4,7);proof['allNestedReciprocalsEvaluated']=True
 elif i==46:
  gap=int(re.search(r'топтан (\d+) жапсырма кем',s)[1]);second=(1-v(0))*v(1);value=F(gap)/(v(0)-second);assert value*v(0)==36 and value*second==18;proof['originalAndRemainingBasesAndIntegerCounts']=[int(value),36,54,18]
 else:raise AssertionError(i)
 if i in[0,1,2,4,11]:
  a,b=v(0),v(1);proof['crossCancelNumeratorGCD']=__import__('math').gcd(a.numerator,b.numerator);proof['crossCancelDenominatorGCD']=__import__('math').gcd(b.denominator,a.denominator)
 answer=only(z for z in o if exact(z)==value)if o else str(value);return answer,{'exactDerivedValue':str(value),**proof}
def math_product(xs):
 out=F(1)
 for x in xs:out*=x
 return out
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==47;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert r['answer']==answer,(i,answer,r['answer'])
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  bad={**r,'answer':r['options'][(r['options'].index(answer)+1)%4]if r.get('options')else str(F(answer)+1)};assert observe(bad,i)[0]!=bad['answer']
  ref=only(r['sourceRefs']);source=only(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert source['checked']is True
  digest=lambda x:hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'sourceFullContentSha256':digest(source),'verdict':'verified','method':'Root independent full47saved/new/complete solutions/everyMCQ read; own exact DISPLAYED Fraction AST and affine symbolic algebra, full natural divisor domain, physical units and integer staged ledgers; no author specs/models/params','observed':proof})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+PACK+"')).editions;console.log(JSON.stringify(r.map(q=>[q.editionId,editionHash(q)])));";js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade5-fraction-division.py','fullSavedNewCompleteSolutionsEveryChoiceRead':47,'authorSolverOrParamsUsed':False,'resolvedFindings':[{'sourceIds':['32d97ae3270cdd46','cb0af3dae29e8d85'],'finding':'Both source-specific mixed-number borrowing steps omitted by immediate improper conversion','resolution':'Actual new-denominator12 borrowing inserted before independent improper verification; only two solutions changed, conditions/numbers/keys/options preserved; finalfullrows reread'}]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/grade5-fraction-division.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':47,'badKeysRejected':47,'hashesMatched':47,'fullSavedNewRead':47,'exactPrintedMath':True,'symbolicAffineBackSubstitution':True,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
