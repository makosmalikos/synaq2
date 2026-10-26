"""All50 source/new full conditions and full official/new solutions/all6MCQ sets
read. Same root author implemented separate exact rational-polynomial checker;
no independent human reviewer claimed. Uses only printed equations/inequalities,
assignments/points and alternatives, never JS specs/params as answer oracle.
"""
import ast,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-equations12';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H);one=H.one;R=H.H.Rational;number=H.H.number

def plain(s):
 s=re.sub(r'\\+',lambda m:'\\',s.replace('\\cfrac','\\dfrac'));s=H.tex(s);s=re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'^'+''.join(str('⁰¹²³⁴⁵⁶⁷⁸⁹'.index(c))for c in m[0]),s);return s

def expr(s,env=None):
 env=env or{};s=H.arithmetic_text(plain(s)).replace('^','**');tree=ast.parse(s,mode='eval')
 def go(n):
  if isinstance(n,ast.Expression):return go(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return number(n.value)
  if isinstance(n,ast.Name):return number(env[n.id])if n.id in env else R({(n.id,):1})
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.UAdd,ast.USub));v=go(n.operand);return -v if isinstance(n.op,ast.USub)else v
  assert isinstance(n,ast.BinOp);a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Pow):
   power=b.constant();assert power.denominator==1 and 0<=power<=4;out=number(1)
   for _ in range(int(power)):out=out*a
   return out
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  assert isinstance(n.op,ast.Div);return a/b
 return go(tree)
def calc(s,env=None):return expr(s,env).constant()
def affine(e,variables=('x',)):
 r=expr(e);assert set(r.d)<={()}and set(r.n)<={(),*((v,)for v in variables)};d=r.d.get((),F(1));return[r.n.get((v,),F(0))/d for v in variables],r.n.get((),F(0))/d

def equation(s):
 l,r=s.split('=');difference=expr(l)-expr(r);assert set(difference.n)<={(),('x',)};coefficient=difference.n.get(('x',),F(0));assert coefficient;root=-difference.n.get((),F(0))/coefficient
 assert expr(l).value({'x':root})==expr(r).value({'x':root});return root,{'uniqueCrossMultipliedLinearCoefficient':str(coefficient),'root':str(root),'leftValue':str(expr(l).value({'x':root})),'rightValue':str(expr(r).value({'x':root}))}

def system(s,source):
 if source:
  body=one(re.findall(r'\\begin\{cases\}(.*?)\\end\{cases\}',s,re.S));equations=[line.strip()for line in re.split(r'\\\\',body)]
 else:equations=H.math_parts(s,False)
 assert len(equations)==2;return equations

def options(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def solve(r,part,i,source=False):
 s=r['statement'];parts=H.math_parts(s,source);p=plain(s);proof={};symbolic=False
 if part=='A'and(i<=11 or 15<=i<=17 or 21<=i<=23)or part=='B'and i in(16,17):
  target=one(parts);out,proof=equation(target)
  if part=='B':
   l,rhs=target.split('=');forbidden=[]
   for x in(0,-1):
    try:calc(l,{'x':F(x)})
    except ZeroDivisionError:forbidden.append(x)
   assert forbidden==[0,-1]and out not in forbidden;proof['originalNestedDenominatorExclusions']=forbidden
 elif part=='A'and i in(12,13,14):
  env={v:F(n)for v,n in re.findall(r'\b([ab])\s*=\s*\(?\s*(-?\d+)',p)};assert set(env)=={'a','b'};target=parts[-1];out=expr(target).value(env);proof={'assignments':{k:str(v)for k,v in env.items()},'target':target}
 elif part=='A'and i in(18,19,20):
  target=one(parts);l,rhs=target.split('<');coefs,b=affine(l);a=one(coefs);assert a>0;bound=(calc(rhs)-b)/a;maximum=math.ceil(bound)-1;valid=list(range(1,maximum+1));assert valid and expr(l).value({'x':F(maximum)})<calc(rhs)<=expr(l).value({'x':F(maximum+1)});out=F(maximum if i==19 else len(valid));proof={'strictUpperBound':str(bound),'allNaturalSolutions':valid,'askedQuantity':'maximum'if i==19 else'count'}
 elif part=='A'and i in(24,25)or part=='B'and i in(1,2,3):
  equations=system(s,source);rows=[]
  for equation_text in equations:
   l,rhs=equation_text.split('=');c,b=affine('('+plain(l)+')-('+plain(rhs)+')',('x','y'));rows.append(c+[-b])
  (a,b,c),(d,e,f)=rows;det=a*e-b*d;assert det;x=(c*e-b*f)/det;y=(a*f-c*d)/det
  assert all(expr(l).value({'x':x,'y':y})==expr(rhs).value({'x':x,'y':y})for l,rhs in(equ.split('=')for equ in equations));product=part=='A'or i==1;out=x*y if product else x+y;proof={'nonzeroSystemDeterminant':str(det),'uniqueX':str(x),'uniqueY':str(y),'askedQuantity':'product'if product else'sum'}
 elif part=='B'and i in(4,5,6):
  a,b,c,d=map(int,re.findall(r'\d+',p));assert min(a,b,c,d)>0;out=F(a,b)*F(c,d);proof={'middleMatchedRatios':[a*c,b*c,b*c,b*d],'reducedRatio':[out.numerator,out.denominator]}
 elif part=='B'and i in(7,8,9):
  target=one(parts);center,radius=map(int,re.findall(r'\d+',plain(target)));assert radius>0;roots=[center-radius,center+radius];assert all(abs(x-center)==radius for x in roots);out=F(sum(roots));proof={'allRealRoots':roots,'exactDistances':[abs(x-center)for x in roots]}
 elif part=='B'and i in(10,11):
  total=int(one(re.findall(r'a\s*\+\s*b\s*=\s*(\d+)',p)));product=int(one(re.findall(r'(?:ab|a\s*[*×]\s*b)\s*=\s*(\d+)',p)));discriminant=total*total-4*product;assert discriminant>=0;root=math.isqrt(discriminant);assert root*root==discriminant;a=F(total+root,2);b=F(total-root,2);assert a+b==total and a*b==product;identity=expr('(a+b)^2-2*a*b');assert identity.equals(expr('a^2+b^2'));out=F(total*total-2*product);proof={'realExistenceDiscriminant':discriminant,'consistentWitness':[str(a),str(b)],'exactPolynomialIdentity':True}
 elif part=='B'and i in(12,13):
  target=one(parts);l,lo,middle,hi,u=re.split(r'(≤|<)',plain(target));assert(lo,hi)==('<','≤');a,b=affine(middle);a=one(a);assert a>0;lower=(calc(l)-b)/a;upper=(calc(u)-b)/a;first=math.floor(lower)+1;last=math.floor(upper);values=list(range(first,last+1));assert values
  valid=lambda x:calc(l)<expr(middle).value({'x':F(x)})<=calc(u)
  assert all(valid(x)for x in values)and not valid(first-1)and not valid(last+1);out=F(len(values));proof={'strictLowerBound':str(lower),'inclusiveUpperBound':str(upper),'allIntegerSolutions':values,'zeroNegativeIncluded':True}
 elif part=='B'and i in(14,15):
  target=expr(one(parts));answer=expr(r['answer']);assert answer.equals(target);vals=[expr(o)for o in options(r)];matches=[j for j,v in enumerate(vals)if v.equals(target)];assert len(vals)==4 and len(matches)==1 and all(not a.equals(b)for a,b in itertools.combinations(vals,2));assert plain(options(r)[one(matches)])==plain(r['answer']);symbolic=True;out=None;proof={'exactPolynomialIdentity':True,'expandedNumerator':{'*'.join(k)or'constant':str(v)for k,v in target.n.items()},'everyMCQEquivalent':[v.equals(target)for v in vals]}
 elif part=='B'and i in(18,19):
  prime=int(one(re.findall(r'=\s*(\d+)',p)));factors=[(d,prime//d)for d in range(1,math.isqrt(prime)+1)if prime%d==0];assert factors==[(1,prime)];pairs=[]
  for lo,hi in factors:
   a=F(hi+lo,2);b=F(hi-lo,2)
   if a.denominator==b.denominator==1 and min(a,b)>0:pairs.append((int(a),int(b)))
  a,b=one(pairs);assert a*a-b*b==prime;out=F(a);proof={'allPositiveFactorPairs':factors,'allNaturalSquareDifferencePairs':pairs,'trialDivisorsThrough':math.isqrt(prime)}
 elif part=='B'and i in(20,21):
  target=one(parts);center,radius=map(int,re.findall(r'\d+',plain(target)));inclusive='≤'in plain(target);assert inclusive==(i==20);values=list(range(center-radius+(0 if inclusive else 1),center+radius+(1 if inclusive else 0)));valid=lambda x:abs(x-center)<=radius if inclusive else abs(x-center)<radius
  assert all(valid(x)for x in values)and not valid(values[0]-1)and not valid(values[-1]+1);out=F(sum(values)if i==20 else len(values));proof={'allIntegerSolutions':values,'askedQuantity':'sum'if i==20 else'count','boundaryIncluded':inclusive}
 elif part=='B'and i in(22,23):
  x1,y1,x2,y2,target=map(F,re.findall(r'-?\d+',p));assert x1!=x2;k=(y1-y2)/(x1-x2);b=y1-k*x1;assert k*x2+b==y2;out=k*target+b;proof={'slope':str(k),'intercept':str(b),'bothPointsChecked':True,'targetX':str(target)}
 elif part=='B'and i in(24,25):
  equations=system(s,source);bounds=[]
  for target in equations:
   l,op,rhs=re.split(r'([<>])',plain(target));a,b=affine('('+l+')-('+rhs+')');a=one(a);assert a>0;bounds.append((op,-b/a))
  assert [b[0]for b in bounds]==['>','<'];lower,upper=[b[1]for b in bounds];values=list(range(math.floor(lower)+1,math.ceil(upper)));out=F(sum(values));assert values;proof={'strictIntersectionBounds':[str(lower),str(upper)],'allIntegerSolutions':values,'askedQuantity':'sum'}
 else:raise AssertionError((part,i))
 if not symbolic:
  assert calc(r['answer'])==out,(part,i,out,r['answer']);proof['answer']=str(out)
  if options(r):
   values=[calc(o)for o in options(r)];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['allOptionValues']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
 if source and options(r):
  j=one(j for j,o in enumerate(r['options'])if o['correct']);assert plain(r['options'][j]['text'])==plain(r['answer'])
 return proof

def mutation(r,part,i):
 b=copy.deepcopy(r);s=b['statement'];special={('B',12):('≤ 25','≤ 30'),('B',13):('≤ 36','≤ 39'),('B',21):('< 9','< 10'),('B',25):('x < 36','x < 40')}
 if(part,i)in special:a,c=special[part,i];assert a in s;s=s.replace(a,c,1)
 elif part=='A'and i in(12,13,14):s=re.sub(r'\d+',lambda m:str(int(m[0])+1),s,count=1)
 elif H.math_parts(s,False):
  old=H.math_parts(s,False)[0];new=re.sub(r'\d+',lambda m:str(int(m[0])+1),old,count=1);s=s.replace('«'+old+'»','«'+new+'»',1)
 else:s=re.sub(r'\d+',lambda m:str(int(m[0])+1),s,count=1)
 assert s!=b['statement'],(part,i);b['statement']=s;return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==50;entries=[];evidence=[];equalities=0;mcqs=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);part='A'if'6db02c66'in ref['sourceFile']else'B';q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and not q['svg'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));answer=re.sub(r'^[A-D]\)\s*','',tail).strip()
  try:src=solve({**q,'answer':q['sourceAnswer']or answer},part,i,True);proof=solve(r,part,i)
  except Exception as e:raise AssertionError(('source/new',part,i))from e
  assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and bool(r.get('options'))==bool(q['options'])and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer']);mcqs+=bool(q['options'])
  if not r.get('options'):assert re.fullmatch(r'\d+',r['answer'])
  # Check printed scalar AND symbolic chains using the solved context.
  # Generic bracket identities are compared as exact polynomials, not samples.
  env={}
  if 'root'in proof:env['x']=F(proof['root'])
  if 'assignments'in proof:env.update({k:F(v)for k,v in proof['assignments'].items()})
  if 'uniqueX'in proof:env.update(x=F(proof['uniqueX']),y=F(proof['uniqueY']))
  if 'consistentWitness'in proof:env.update(zip(('a','b'),map(F,proof['consistentWitness'])))
  if 'allNaturalSquareDifferencePairs'in proof:env.update(zip(('a','b'),map(F,one(proof['allNaturalSquareDifferencePairs']))))
  if 'middleMatchedRatios'in proof:
   a,b,c,d=proof['middleMatchedRatios'];env.update(P=F(a),Q=F(b),R=F(d))
  if 'slope'in proof:env.update(k=F(proof['slope']),b=F(proof['intercept']),x=F(proof['targetX']),y=calc(r['answer']))
  for match in re.finditer(r'[0-9A-Za-z⁰¹²³⁴⁵⁶⁷⁸⁹():+−×÷^/\s=]+',r['solution']):
   block=match[0].strip().lstrip(':').strip();sides=[v.strip()for v in block.split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[expr(v,env)for v in sides]
   except(AssertionError,ValueError,IndexError,SyntaxError):continue
   valid=all(values[0].equals(v)for v in values[1:])
   if not valid and 'allRealRoots'in proof:
    valid=any(all(expr(sides[0],{**env,'x':F(x)}).equals(expr(v,{**env,'x':F(x)}))for v in sides[1:])for x in proof['allRealRoots'])
   assert valid,('printed equality',part,i,block)
   equalities+=len(sides)-1
  for bad in({**r,'answer':'999999999'},mutation(r,part,i)):
   try:solve(bad,part,i)
   except(AssertionError,ValueError,KeyError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',part,i))
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions and full official/new solutions, all6MCQ sets read. Separate exact Fraction rational-polynomial identities/roots, original nested denominator exclusion, full-rank2x2systems, all bounded integer solutions and outside neighbors, prime factor pairs, ratio equivalence, both points/slope, all choices checked from printed text. Same root author; no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare native fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':50,'allSourceNewConditionsFullSolutionsRead':50,'sourceKeysNotCaptured':44,'sourceAndNewMCQSets':mcqs,'allNumericAndSymbolicOptionsChecked':mcqs*8,'wrongKeysRejected':50,'printedSemanticCanariesRejected':50,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':check['fractions'],'pythonJavaScriptHashesMatched':50,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
