"""All 47 source/new simplification conditions, full solutions and every MCQ.
Exact polynomial proof, including implicit source coefficients/letter products,
and printed word-problem ledgers. Same root authored both: this is a separate
computational check, not a separate human/agent review. No JS/specs/params oracle.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-simplification.json';REPORT='problems/editorial/reviews/grade5-simplification.json'
sp=importlib.util.spec_from_file_location('exact_expression',ROOT/'scripts/editorial/review-grade5-expression-language.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,nums=H.one,H.nums
def math(s):
 s=H.clean(s)
 s=re.sub(r'(?<=[A-Za-z0-9)])(?=\()','*',s)
 s=re.sub(r'([A-Za-z])(?=[A-Za-z])',r'\1*',s)
 return s
def expr(s,bindings=None):return H.expr(math(s),bindings)
def calc(s,bindings=None):return expr(s,bindings).constant()
def options(r):return H.options(r)
def target(s,source):
 parts=H.math_parts(s,source)
 candidates=[p for p in parts if '='not in p and re.search(r'[+\-−×÷:*]|\\cdot|\d[A-Za-z]',p)]
 return one(candidates)
def symbolic(r,wanted,opposite=False):
 p=expr(wanted);values=[expr(o).equals(p)for o in options(r)];index=one(i for i,v in enumerate(values)if v!=opposite)
 answer=options(r)[index];assert math(answer)==math(r['answer'])
 assert expr(r['answer']).equals(p)!=opposite
 return {'answer':answer,'target':wanted,'allMCQIdentities':values}
def numeric(r,wanted):
 assert nums(r['answer'])==[wanted],(r['answer'],wanted)
 if options(r):assert sum(nums(o)==[wanted]for o in options(r))==1
 return str(wanted)
def coefficient(e):
 p=expr(e);assert p.d=={():F(1)}and len(p.n)==1
 monomial,value=one(p.n.items());assert len(monomial)==1;return value,monomial[0]
COEFFICIENTS={8,9,11,14,39};VALUES={1,2,15,19,20,22,33,35,41}
def solve(r,i,source=False):
 s=r['statement'];n=nums(s);env=H.assignments(s);proof={'printedNumbers':list(map(str,n))}
 if i==3:
  wanted='Өрнектің мәнін өзгертпей, амалдар саны азырақ өрнекпен алмастыру'if source else'Барлық жарамды мәнде бастапқы өрнекке тең, жазылуы қарапайым өрнекке түрлендіру'
  answer=one(o for o in options(r)if o==wanted);assert r['answer']==answer;proof['answer']=answer;return proof
 if i in{4,29}:
  truths=[];degrees=[]
  for o in options(r):
   a,b=math(o).split('=');left,right=expr(a),expr(b);truths.append(left.equals(right));degrees.append(max([len(m)for m in left.n]+[0]))
  answer=options(r)[one(i for i,t in enumerate(truths)if t)];assert math(r['answer'])==math(answer)
  proof.update(answer=answer,allMCQIdentities=truths,allLeftPolynomialDegrees=degrees);return proof
 if i==21:proof.update(symbolic(r,target(s,source),True));return proof
 if i==12:
  part=one(H.math_parts(s,source));left=part.split('=')[0];p=expr(left);assert p.d=={():F(1)}
  vars=[m for m in p.n if m];v=one(vars);assert len(v)==1 and p.n[v]==1;out=p.n.get((),F(0));proof['exactRegroupedConstant']=str(out)
 elif i in COEFFICIENTS:
  e=target(s,source);out,v=coefficient(e);proof.update(target=e,survivingVariable=v,coefficient=str(out))
 elif i in VALUES:
  e=target(s,source);out=calc(e,env);proof.update(target=e,assignments={k:str(v)for k,v in env.items()})
 elif i==16:
  masses=n[:2];v=one(re.findall(r'\b([a-z])\s*теңге',H.clean(s)));e=f'({masses[0]}+{masses[1]})*{v}';proof.update(symbolic(r,e));return proof
 elif i==17:
  first,second,value=n;v=one(env);out=(first-second)*value;assert first>second and env[v]==value;proof['independentRowDifference']={'firstPopulation':str(first*value),'secondPopulation':str(second*value),'extraRows':str(first-second)}
 elif i==28:
  heads,legs,gap=n;assert legs>heads>0;out=gap/(legs-heads);assert out.denominator==1 and out>0;proof['headLegLedger']={'heads':str(heads*out),'legs':str(legs*out),'difference':str(gap)}
 elif i==30:
  walk,bike,ratio,value=n;v=one(env);assert env[v]==value;out=walk*value+bike*ratio*value;proof['distanceLedger']={'walking':str(walk*value),'cycling':str(bike*ratio*value),'cyclingSpeed':str(ratio*value)}
 elif i==31:
  last=n[-1];assert last.denominator==1 and last>1;var='a'if source else't';e='+'.join(f'{j}*{var}'for j in range(1,int(last)+1));proof.update(symbolic(r,e));proof['allCoefficients']=list(range(1,int(last)+1));return proof
 elif i==32:
  first,second,less=n;v='x';blue=first*second;e=f'{v}+{first}*{v}+{blue}*{v}+({blue}*{v}-{less})'
  assert min(F(1),first,blue,blue-less)>0
  proof.update(symbolic(r,e));proof['positiveCountsAtMinimumNaturalInput']=['1',str(first),str(blue),str(blue-less)];return proof
 elif i==44:
  if source:first,second,total=F(4),F(2),one(n)
  else:first,second,total=n
  out=total/(first+second);assert out>0 and out.denominator==1;proof['equalGroupLegLedger']={'firstLegs':str(first*out),'secondLegs':str(second*out),'requestedFirstGroup':str(out)}
 elif i==46:
  father,grand,total=n;out=total/(1+father+father*grand);assert out>0 and out.denominator==1
  proof['threeAges']=list(map(str,[out,father*out,father*grand*out]));assert out+father*out+father*grand*out==total
 else:
  proof.update(symbolic(r,target(s,source)));return proof
 proof['answer']=numeric(r,out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def verify_solution(r):
 count=0
 for identity in re.findall(r'Демек, ([^.]+)\.',r['solution']):
  if '='not in identity:continue  # Narrative conclusion, not a printed mathematical equality.
  a,b=identity.split('=');assert expr(a).equals(expr(b)),('printed nonidentity',identity);count+=1
 # Arithmetic on the right may still be symbolic, so only capture complete numeric RHS.
 pattern=r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])'
 for m in re.finditer(pattern,r['solution']):assert calc(m[1])==F(m[2]),('printed numeric equality',m.group());count+=1
 return count
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==47;evidence=[];entries=[];canaries=0;solutionProofs=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId'])
  assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert math(one(o['text']for o in q['options']if o['correct']))==math(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution'])
  if not options(r):assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  else:assert len(options(r))==len(set(options(r)))==4 and options(r).count(r['answer'])==1
  solutionProofs+=verify_solution(r)
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad=copy.deepcopy(r)
  if i in{3,4,29}:bad['options'][bad['options'].index(bad['answer'])]='0 = 1'
  elif i==36:bad['statement']=bad['statement'].replace('u + u + u + u','u + u + u')
  elif i==28:bad['statement']=bad['statement'].replace('55','60')
  elif i==31:bad['statement']=bad['statement'].replace('24','26')
  elif i==44:bad['statement']=bad['statement'].replace('180','186')
  elif i==46:bad['statement']=bad['statement'].replace('100','110')
  else:
   m=re.search(r'\d+',bad['statement']);assert m;bad['statement']=bad['statement'][:m.start()]+str(int(m.group())+1)+bad['statement'][m.end():]
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'savedSource':sourceProof})
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'all source/new full conditions, solutions and every MCQ; separate exact rational polynomial proof and printed word ledgers; no author model/params oracle; not separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':47,'findings':0,'allSavedNewFullConditionsSolutionsMCQsRead':47,'wrongKeysRejected':47,'printedSemanticCanariesRejected':canaries,'newSolutionSymbolicAndNumericEqualitiesVerified':solutionProofs,'exactPolynomialProofs':True,'pythonJavaScriptHashesMatched':47,'nativeFractions':check['fractions'],'separateHumanReviewer':False}
 report={'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'resolvedSourceFindings':[{'sourceId':'991c7d33c095a0c5','issue':'Saved explanation attributes 13x−6 to treating the blue count as 4x, but that model actually gives x+2x+4x+(4x−6)=11x−6.','resolution':'Rewritten chained-count distractor is 8x−5, matching x+3x+2x+(2x−5); every option is separately checked against the correct full polynomial.'}],'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
