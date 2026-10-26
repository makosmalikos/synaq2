"""All50 frozen source and new conditions/full solutions/all MCQs read. Source
math recomputed including exact decimal/fraction/mixed/negative/factorial cases;
all numeric alternatives checked. Same root authored separate exact parser and
check, no separate human/agent reviewer. No JS params/specs used as answer oracle.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-expression12';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one=H.one

def plain(s):
 s=re.sub(r'\\+',lambda m:'\\',s);s=H.tex(s);s=re.sub(r'[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'^'+''.join(str('⁰¹²³⁴⁵⁶⁷⁸⁹'.index(c))for c in m[0]),s);s=re.sub(r'\^\{(\d+)\}',r'^\1',s);return s.strip()
def exact(s):
 s=plain(s);tokens=re.findall(r'\d+(?:\.\d+)?|[()+*/^!\-]',s);assert ''.join(tokens)==re.sub(r'\s+','',s),s;at=0
 def atom():
  nonlocal at
  assert at<len(tokens),s;t=tokens[at];at+=1
  if t=='(':
   value=add();assert tokens[at]==')';at+=1;return value
  assert re.fullmatch(r'\d+(?:\.\d+)?',t),t;return F(t)
 def factorial():
  nonlocal at
  value=atom()
  while at<len(tokens)and tokens[at]=='!':assert value.denominator==1 and 0<=value<=100;value=F(math.factorial(int(value)));at+=1
  return value
 def power():
  nonlocal at
  v=factorial()
  if at<len(tokens)and tokens[at]=='^':at+=1;e=unary();assert e.denominator==1 and 0<=e<=2000;v=v**int(e)
  return v
 def unary():
  nonlocal at
  if at<len(tokens)and tokens[at]in['+','-']:op=tokens[at];at+=1;v=unary();return -v if op=='-'else v
  return power()
 def multiply():
  nonlocal at
  value=unary()
  while at<len(tokens)and tokens[at]in['*','/']:
   op=tokens[at];at+=1;b=unary();value=value*b if op=='*'else value/b
  return value
 def add():
  nonlocal at
  value=multiply()
  while at<len(tokens)and tokens[at]in['+','-']:
   op=tokens[at];at+=1;b=multiply();value=value+b if op=='+'else value-b
  return value
 out=add();assert at==len(tokens),(s,tokens[at:]);return out

def solve(r,part,i,source=False):
 s=r['statement'];p=plain(s);n=list(map(int,re.findall(r'\d+',p)));proof={}
 if part=='A'and 17<=i<=19:whole,percent=n;out=F(whole*percent,100);proof={'whole':whole,'percent':percent,'part':str(out)}
 elif part=='A'and i==20:percent,share=n;out=F(share*100,percent);proof={'percent':percent,'knownPart':share,'restoredWhole':str(out)}
 elif part=='B'and i in(17,18):price,up,down=n;new=F(price)*(1+F(up,100));out=new*(1-F(down,100));proof={'afterIncrease':str(new),'afterDiscount':str(out),'discountBaseIsIncreasedPrice':True}
 elif part=='B'and i in(19,20,21):
  base,power=n;out=F(pow(base,power,10));last=1;cycle=[]
  for _ in range(4):last=last*base%10;cycle.append(last)
  assert len(set(cycle))==4 and pow(base,5,10)==cycle[0];proof={'fourDigitCycle':cycle,'exponentRemainder':power%4,'modularAnswer':int(out)}
 elif part=='B'and i==25:
  period=one(re.findall(r'0[,.]\((\d{2})\)',p));out=F(int(period),99);assert out>0 and out<1;proof={'period':period,'exactSubtractShiftIdentity':f'100x-x={int(period)}','reducedNumerator':out.numerator,'reducedDenominator':out.denominator}
 else:
  expression=H.math_parts(s,True)[-1] if source else one(H.math_parts(s,False));out=exact(expression);proof={'printedExpression':expression,'exactValue':str(out)}
 assert exact(r['answer'])==out,(part,i,out,r['answer']);proof['answer']=str(out)
 options=r.get('options',[])
 if options:
  values=[exact(o['text']if isinstance(o,dict)else o)for o in options];assert len(values)==len(set(values))==4 and values.count(out)==1
  if source:assert [j for j,o in enumerate(options)if o['correct']]==[values.index(out)]
  proof['allOptionExactValues']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
 return proof

def mutation(r,part,i):
 b=copy.deepcopy(r);s=b['statement']
 if part=='B'and i==25:s=s.replace('0,(68)','0,(67)')
 elif '«'in s:
  old=one(H.math_parts(s,False));new=re.sub(r'\d+',lambda m:str(int(m[0])+1),old,count=1);s=s.replace('«'+old+'»','«'+new+'»')
 else:s=re.sub(r'\d+',lambda m:str(int(m[0])+1),s,count=1)
 assert s!=b['statement'];b['statement']=s;return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==50;entries=[];evidence=[];equations=0;mcqs=0;missing=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);part='A'if'82e8427a'in ref['sourceFile']else'B';q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i)
  assert not q['images']and not q['svg']and q['solution'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));official=re.sub(r'^[A-D]\)\s*','',tail).strip();original={**q,'answer':q['sourceAnswer']or official};missing+=q['sourceAnswer']is None
  try:src=solve(original,part,i,True);proof=solve(r,part,i)
  except Exception as e:raise AssertionError(('source/new',part,i))from e
  assert r['minimumPlan']=='pro'and r['grade']in[5,6]and r['statement']!=q['statement']and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  assert bool(r.get('options'))==bool(q['options']);mcqs+=bool(r.get('options'))
  if not r.get('options'):assert re.fullmatch(r'-?\d+',r['answer']),r['editionId']
  # Every standalone native numeric equality is evaluated, including factorials,
  # decimal commas, nested fractions and signed factors. Symbolic equalities are
  # separately justified by the target-specific computation above.
  for block in re.findall(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹,()+−×÷^!/\s=]+',r['solution']):
   sides=[p.strip()for p in block.split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(p)for p in sides]
   except(AssertionError,ValueError,IndexError):continue
   assert len(set(values))==1,('printed equality',part,i,block,values);equations+=len(sides)-1
  # Source numeric equations also recomputed whenever a complete scalar chain
  # appears inside a saved TeX math fragment.
  for fragment in H.math_parts(q['solution'],True):
   sides=[v.strip()for v in fragment.split('=')]
   if len(sides)<2:continue
   try:values=[exact(p)for p in sides]
   except(AssertionError,ValueError,IndexError):continue
   assert len(set(values))==1,('source equality',part,i,fragment)
  for bad in({**r,'answer':'999999999999999999'},mutation(r,part,i)):
   try:solve(bad,part,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',part,i))
  entries.append({'editionId':r['editionId'],'sha256':H.hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Read all50full source/new conditions and official/new solutions/allMCQs. Separate exact Fraction recursive parser handles decimal commas, unary signs, fractions/mixed values, power precedence and factorial; every numeric option, printed scalar equation, sequential percentage base, mod10cycle and repeat-block rational identity checked from printed text. Same root author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,mixed=0,superscripts=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare native fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]]){walk(mathFragments(s));superscripts+=(s.match(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g)||[]).length;}console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,mixed,superscripts}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':50,'sourceKeysNotCaptured':missing,'allSourceNewConditionsFullSolutionsRead':50,'sourceAndNewMCQSets':mcqs,'allSourceAndNewNumericOptionsChecked':mcqs*8,'wrongKeysRejected':50,'printedSemanticCanariesRejected':50,'printedSolutionEqualitiesVerified':equations,'nativeFractions':check['fractions'],'nativeMixed':check['mixed'],'nativeSuperscripts':check['superscripts'],'pythonJavaScriptHashesMatched':50,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
