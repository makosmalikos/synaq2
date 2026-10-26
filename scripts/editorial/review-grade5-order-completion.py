"""Last20 full source/new conditions, solutions and every MCQ read.
Exact Fraction arithmetic; exhaustive contiguous one-pair intervals and binary
division trees, digit counts, operator positions and money ledgers. Same root
authored both; separate computational check, not separate human/agent review.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-order-completion.json';REPORT='problems/editorial/reviews/grade5-order-completion.json'
sp=importlib.util.spec_from_file_location('equation_check',ROOT/'scripts/editorial/review-grade5-equations.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,expr,calc=H.one,H.expr,H.calc
def clean(s):return H.H.math(s).replace('\\;','').replace('\\square','□')
def nums(s):return H.nums(clean(s))
def options(r):return H.options(r)
def part(s,source):return H.parts(s,source)[0]
def numeric(r,out):
 assert nums(r['answer'])==[out],(r['answer'],out)
 if options(r):assert sum(nums(o)==[out]for o in options(r))==1
 return str(out)
def chosen(r,predicate):
 selected=one(o for o in options(r)if predicate(o));assert clean(r['answer'])==clean(selected);return selected
def one_pair(e):
 e=clean(e);tokens=re.findall(r'\d+|[+*]',e);assert''.join(tokens)==re.sub(r'\s','',e);cases=[]
 for i in range(0,len(tokens),2):
  for j in range(i,len(tokens),2):
   q=''.join(tokens[:i])+ '('+''.join(tokens[i:j+1])+')'+''.join(tokens[j+1:]);cases.append((q,calc(q)))
 assert len(cases)==15;return cases
def trees(numbers):
 if len(numbers)==1:return[(str(numbers[0]),numbers[0])]
 out=[]
 for split in range(1,len(numbers)):
  for a,x in trees(numbers[:split]):
   for b,y in trees(numbers[split:]):assert y;out.append(('('+a+'/'+b+')',x/y))
 return out
def solve(r,i,source=False):
 s=r['statement'];n=nums(s);proof={'printedNumbers':list(map(str,n))}
 if i==1:
  last=n[0];assert last%2==0;terms=[F(k if k%2==0 else -k)for k in range(int(last),0,-1)];out=sum(terms);assert len(terms)==last;proof['everyAlternatingTerm']=list(map(str,terms))
 elif i in{3,16}:
  target=n[-1];e=part(s,source).split('=')[0];flat=lambda t:re.sub(r'[()\s]','',clean(t))
  assert all(flat(o)==flat(e)for o in options(r));values=[calc(o)for o in options(r)];proof.update(answer=chosen(r,lambda o:calc(o)==target),everyMCQValue=list(map(str,values)),target=str(target));return proof
 elif i==5:
  e=part(s,source);cases=one_pair(e);out=max(v for _,v in cases);proof['everyOnePairInterval']=[{'expression':e,'value':str(v)}for e,v in cases]
 elif i in{6,19}:
  if i==6:
   a,b,c,d,target=n;template=f'{a} OP {b}+{c}*{d}'
   def fill(o):return template.replace('OP',clean(o))
  else:
   a,b,c,target=n;template=f'{a} OP1 {b} OP2 {c}'
   def fill(o):
    x,y=clean(o).split('және');return template.replace('OP1',x).replace('OP2',y)
  proof.update(answer=chosen(r,lambda o:calc(fill(o))==target),everyMCQValue=[str(calc(fill(o)))for o in options(r)]);return proof
 elif i==7:
  price,count,markers,cash,change=n;spent=cash-change;out=(spent-price*count)/markers;assert out>0 and out.denominator==1 and price*count+markers*out+change==cash;proof['moneyLedger']=list(map(str,[price*count,markers*out,change,cash]))
 elif i==8:
  digit,target=n;digit=str(digit);assert len(digit)==1
  for o in options(r):assert re.findall(r'\d',clean(o))==[digit]*5
  proof.update(answer=chosen(r,lambda o:calc(o)==target),everyMCQValue=[str(calc(o))for o in options(r)],exactDigitCount=5);return proof
 elif i==9:
  numbers=n;assert len(numbers)==4;cases=trees(numbers);assert len(cases)==5;out=F(len({v for _,v in cases}));proof['everyFullBinaryDivisionTree']=[{'expression':e,'value':str(v)}for e,v in cases]
 elif i==10:
  if source:expressions=dict(p.split('=',1)for p in H.parts(s,True))
  else:expressions=dict(zip(['A','B','C'],H.parts(s,False)))
  values={k.strip():calc(e)for k,e in expressions.items()};assert len(set(values.values()))==3
  expected=' < '.join(sorted(values,key=values.get));proof.update(answer=chosen(r,lambda o:clean(o).replace(' ','')==expected.replace(' ','')),everyValue={k:str(v)for k,v in values.items()});return proof
 elif i==18:
  cash,count1,amount1,count2,amount2,share=n;given=count1*amount1+count2*amount2;out=(cash-given)/share;assert out>0 and out.denominator==1 and out*share+given==cash;proof['completeCashLedger']=list(map(str,[cash,count1*amount1,count2*amount2,share*out]))
 else:
  e=part(s,source);out=calc(e);proof['printedExpression']=e
  if i==4:
   a,b,c,d=n;assert sorted(one(nums(o))for o in options(r))==sorted([out,a/(b/c*d),a/b/(c*d),a/(b/c)*d])
  if i==13:
   a,b,c=n;assert sorted(one(nums(o))for o in options(r))==sorted([out,(a+b)/c,a+b,b/c])
 proof['answer']=numeric(r,out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20;evidence=[];entries=[];canaries=0;equalities=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId']);assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert clean(one(o['text']for o in q['options']if o['correct']))==clean(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution'])
  if not options(r):assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  else:assert len(options(r))==len(set(options(r)))==4 and options(r).count(r['answer'])==1
  pattern=r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])'
  for m in re.finditer(pattern,r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert calc(m[1])==F(m[2]),('printed solution arithmetic',i,m.group());equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad=copy.deepcopy(r)
  if i==9:bad['statement']=bad['statement'].replace('÷ 6','÷ 1')
  elif i==10:bad['statement']=bad['statement'].replace('C = «4 ×','C = «40 ×')
  elif i in{6,19}:bad['options'][bad['options'].index(bad['answer'])]='+'if i==6 else'+ және +'
  elif i in{3,8,16}:bad['statement']=bad['statement'].replace('12 мәнін','13 мәнін')if i==3 else bad['statement'].replace('177','178')if i==8 else bad['statement'].replace('6 мәнін','7 мәнін')
  elif i==1:bad['statement']=bad['statement'].replace('120','122')
  else:
   m=re.search(r'\d+',bad['statement']);assert m;bad['statement']=bad['statement'][:m.start()]+str(int(m.group())+1)+bad['statement'][m.end():]
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError,ZeroDivisionError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'savedSource':sourceProof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'full source/new text/solutions/allMCQs; exact printed Fraction arithmetic, all15 contiguous bracket intervals, all5 binary division trees, exact digits/operators/ledgers; not separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':20,'findings':0,'allSourceNewConditionsSolutionsMCQsRead':20,'wrongKeysRejected':20,'printedSemanticCanariesRejected':canaries,'newSolutionNumericEqualitiesVerified':equalities,'all15OnePairIntervalsChecked':True,'all5BinaryDivisionTreesChecked':True,'pythonJavaScriptHashesMatched':20,'nativeFractions':check['fractions'],'separateHumanReviewer':False}
 report={'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'retainedVerifiedDuplicate':{'sourceId':'0d0d7f87bc97c986','editionId':'grade4-arithmetic-0d0d7f87bc97c986','source':'50 ×17 ×2','edition':'50 ×29 ×2','sameTarget':'efficient grouping 50×2 first','addedAgain':False},'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
