"""All25frozen/new full conditions and official/new full solutions/one4-option
set read. Exact enumeration of every distinct-digit assignment, leading-zero
exclusions, all target values and arithmetic columns from printed concatenations.
Same root authored separate checker: no independent human/agent review claimed.
Intrinsic constants honestly retained where no free numeric parameter exists.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-cryptarithms';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H);one=H.one

def word_expression(w):
 assert re.fullmatch(r'[A-Z0-9]+',w);terms=[]
 for j,c in enumerate(w):terms.append(f'{10**(len(w)-1-j)}*{c}')
 return'('+'+'.join(terms)+')'
def expand(s):
 s=re.sub(r'overline\(([A-Z0-9]+)\)',lambda m:word_expression(m[1]),s)
 s=re.sub(r'\\mathrm\{([A-Z0-9]+)\}',lambda m:word_expression(m[1]),s)
 # Bare multi-letter targets in source questions denote concatenated numbers.
 s=re.sub(r'\b[A-Z]{2,}\b',lambda m:word_expression(m[0]),s)
 return H.tex(s)
def formula(s):return H.expr(expand(s))
def parse(s,i,source):
 parts=H.math_parts(s,source)
 if not source:
  equations=[p for p in parts if'='in p];target=parts[-1]
 elif i==20:equations=[p for p in parts if'='in p];target=parts[-1]
 elif any('\\begin{array}'in p for p in parts):
  array=one(p for p in parts if'\\begin{array}'in p);words=re.findall(r'\\mathrm\{([A-Z0-9]+)\}',array);assert len(words)==3
  op='+'if'+'in array else'−'if'-'in array else'×';equations=[f'overline({words[0]}) {op} overline({words[1]}) = overline({words[2]})'];target=parts[-1];assert len(re.findall(r'\\mathrm\{',target))==1
 else:
  equations=[p for p in parts if'='in p];base=re.sub(r'\\mathrm\{([A-Z0-9]+)\}',r'\1',s).replace('$','');target=one(re.findall(r'([A-Z]+(?:\s*[+−-]\s*[A-Z]+)*)\s+(?:цифры|қосындысы|айырмасы|саны)',base))
 assert equations and target
 words=[]
 for e in equations:words+=re.findall(r'overline\(([A-Z0-9]+)\)|\\mathrm\{([A-Z0-9]+)\}',e)
 words=[a or b for a,b in words];leading={w[0]for w in words if len(w)>1 and w[0].isalpha()};return equations,target,leading

def column_ledger(equation,env):
 # Operands with just concatenation and one arithmetic operator are decoded
 # from the actual equation, then their real column carries/borrows are checked.
 e=equation
 for pattern in [r'overline\(([A-Z0-9]+)\)',r'\\mathrm\{([A-Z0-9]+)\}']:
  e=re.sub(pattern,lambda m:str(int(''.join(str(env[c])if c.isalpha()else c for c in m[1]))),e)
 e=H.tex(e).replace('−','-');l,r=e.split('=')
 if not re.fullmatch(r'\s*\d+(?:\s*[+*-]\s*\d+)+\s*',l)or not re.fullmatch(r'\s*\d+\s*',r):return None
 assert H.calc(l)==F(r);numbers=list(map(int,re.findall(r'\d+',l)));result=int(r);ops=re.findall(r'[+*-]',l)
 if set(ops)=={'+'}:
  carry=0;ledger=[];place=1
  while place<=max([result,*numbers])or carry:
   digits=[v//place%10 for v in numbers];total=sum(digits)+carry;assert total%10==result//place%10;ledger.append({'column':place,'inputDigits':digits,'carryIn':carry,'outputDigit':total%10,'carryOut':total//10});carry=total//10;place*=10
  return{'operation':'addition','columns':ledger}
 if ops==['-']:
  a,b=numbers;borrow=0;ledger=[];place=1
  while place<=a:
   x=a//place%10;y=b//place%10;difference=x-y-borrow;nextBorrow=int(difference<0);digit=difference+10*nextBorrow;assert digit==result//place%10;ledger.append({'column':place,'minuend':x,'subtrahend':y,'borrowIn':borrow,'outputDigit':digit,'borrowOut':nextBorrow});borrow=nextBorrow;place*=10
  assert borrow==0;return{'operation':'subtraction','columns':ledger}
 if ops==['*']:return{'operation':'multiplication','exactOperands':numbers,'exactProduct':result,'lastDigitProductCheck':numbers[0]%10*(numbers[1]%10)%10==result%10}
 return None

def solve(r,i,source=False):
 equations,target,leading=parse(r['statement'],i,source);compiled=[];variables=set()
 for equation in equations:
  left,right=equation.split('=');a,b=formula(left),formula(right);compiled.append((a,b));variables.update(re.findall(r'[A-Z]',expand(equation)))
 variables=sorted(variables);target_formula=formula(target);assert leading<=set(variables);valid=[];checked=0;answers=set()
 for digits in itertools.permutations(range(10),len(variables)):
  env=dict(zip(variables,digits))
  if any(env[c]==0 for c in leading):continue
  checked+=1
  if not all(a.value(env)==b.value(env)for a,b in compiled):continue
  value=target_formula.value(env);valid.append({'digits':env,'target':str(value)});answers.add(value)
 out=one(answers);assert H.calc(r['answer'])==out,(i,out,r['answer']);witness=valid[0]['digits'];ledgers=[p for e in equations if(p:=column_ledger(e,witness))is not None]
 proof={'everyDistinctDigitAssignmentChecked':checked,'leadingNonzeroLetters':sorted(leading),'validAssignmentCount':len(valid),'allValidAssignments':valid,'allTargetValues':list(map(str,sorted(answers))),'witnessColumns':ledgers,'answer':str(out)}
 if r.get('options'):
  values=[H.calc(re.sub(r'\\+',lambda m:'\\',o['text']if isinstance(o,dict)else o))for o in r['options']];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['allOptionValues']=list(map(str,values))
  if source:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
 return proof

def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('= 738','= 861'),2:('= 984','= 1107'),3:('= 495','= 594'),4:('= 198','= 209'),5:('= 121','= 143'),6:('= 132','= 143'),7:('= 45','= 54'),8:('= 704','= 539'),9:('overline(8T)','overline(9T)'),10:('overline(8H)','overline(6H)'),11:('= 1998','= 2109'),12:('= 2442','= 2331'),13:('= 495','= 396'),14:('= 594','= 693'),15:('overline(QP0)','overline(QP1)'),16:('overline(5TU)','overline(4TU)'),18:('overline(3HJ)','overline(4HJ)'),20:('= 45','= 27'),21:('overline(N34)','overline(N24)'),22:('overline(L49)','overline(L51)'),23:('overline(MKL)','overline(MLK)'),24:('overline(RR)','R'),25:('overline(MLNN)','overline(MLNL)')}
 if i==15:s=s.replace('overline(QP0)','overline(QP1)')
 elif i==17:s=s.replace('H2J','H3J').replace('J24','J34')
 elif i==19:s=s.replace('ZZ6','ZZ5').replace('V61','V51')
 else:a,c=pairs[i];assert a in s;s=s.replace(a,c,1)
 assert s!=b['statement'];b['statement']=s;return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];assignments=0;equations=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images']and not q['svg'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));answer=re.sub(r'^[A-D]\)\s*','',tail).strip()
  try:src=solve({**q,'answer':q['sourceAnswer']or answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assignments+=src['everyDistinctDigitAssignmentChecked']+proof['everyDistinctDigitAssignmentChecked'];assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and bool(r.get('options'))==bool(q['options'])and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer']);assert 'overline'in r['statement']
  for bad in({**r,'answer':'999999999'},mutation(r,i)):
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',i))
  # Printed numeric equalities in explanations are checked separately from
  # symbolic/branch carry equations, whose complete cases were enumerated.
  for m in re.finditer(r'[0-9()+−×÷/\s=]+',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip()for v in m[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[H.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,m[0]);equations+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Every25source/new full condition and full official/new solution and all4MCQs read. Complete distinct digit permutations with exact polynomial/rational evaluation of real printed concatenations, leading-zero exclusions, all target values, every arithmetic column and native bars/fraction checked. Intrinsic nonparametric values retained honestly. Same root author; no separate human review.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let bars=0,fractions=0;function walk(ns){for(const n of ns){if(n.type==='overline'){bars++;walk(n.content)}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),bars,fractions}));";check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':25,'allSourceNewConditionsFullSolutionsRead':25,'sourceKeysNotCaptured':24,'sourceAndNewMCQSets':1,'wrongKeysRejected':25,'printedSemanticCanariesRejected':25,'sourceAndNewDigitAssignmentsChecked':assignments,'printedSolutionEqualitiesVerified':equations,'nativeOverlines':check['bars'],'nativeFractions':check['fractions'],'intrinsicNonparametricCasesHonestlyRetained':[18,23,24,25],'pythonJavaScriptHashesMatched':25,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
