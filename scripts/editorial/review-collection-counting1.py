"""20frozen counting1 conditions/full official solutions and all new full text
read. Source answer fields absent and noMCQ, official solution conclusions read
and independently recomputed. Same author root wrote separate finite exact
computation; no separate human reviewer.20occurrences/10models not20newmeanings.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-counting1';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('count2',ROOT/'scripts/editorial/review-collection-counting2.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,calc=H.one,H.calc
ns=lambda s:list(map(int,re.findall(r'\d+',s)))
def solve(r,i,source=False):
 s=r['statement'];n=ns(s);proof={};out=None
 if 1<=i<=5:
  people=one(n);pairs=list(itertools.combinations(range(1,people+1),2));out=len(pairs);assert len(set(pairs))==out;proof['everyUnorderedPair']=pairs
 elif i in{6,7,8}:
  front,back=n;possible=[]
  for total in range(max(front,back),front+back+1):
   if total-front+1==back:possible.append(total)
  out=one(possible);proof['queuePositions']={'front':front,'back':back,'total':out,'peopleAhead':front-1,'peopleBehind':out-front}
 elif i in{9,10}:
  players=one(n);remaining=players;changes=[]
  assert 'жеңілген'in s if source else 'дәл бір ойыншы жеңіліп'in s
  assert 'ойынсыз'in s.lower()
  while remaining>1:changes.append([remaining,remaining-1]);remaining-=1
  out=len(changes);assert remaining==1;proof['allPossibleRemainingCounts']=changes;proof['invariant']='Every played match eliminates exactly one; bye eliminates nobody. Each possible count k>1 therefore has only next count k−1, independent of winner/bracket.'
 elif i in{11,12}:
  first,last=n;assert first==1 and last<100;out=len(''.join(str(k)for k in range(1,last+1)));proof['allPageNumberLengths']=[len(str(k))for k in range(1,last+1)]
 elif i in{13,14}:
  if i==13:
   if source:a,b=n;target=2;assert'түсі бірдей екеуі'in s
   else:a,b,target=n
   states=list(itertools.product(range(a+1),range(b+1)));failed=[v for v in states if max(v)<target]
  else:
   a,b,c=n;states=list(itertools.product(range(a+1),range(b+1),range(c+1)));failed=[v for v in states if v[0]==0];assert'қызыл'in s
  safe=max(map(sum,failed));out=safe+1;predicate=lambda v:max(v)>=target if i==13 else v[0]>=1
  assert all(predicate(v)for v in states if sum(v)==out)
  proof.update(allAdmissibleColorCounts=len(states),maximalFailureWitness=next(v for v in failed if sum(v)==safe),guaranteedAt=out)
 elif i in{15,16}:
  a,b,both=n;assert 0<=both<=min(a,b)
  assert'әр оқушысы'in s and('кемінде бір'in s if source else'екеуіне де баруға болады'in s)
  atoms=[a-both,b-both,both];out=sum(atoms);assert min(atoms)>=0;proof['threeDisjointAtoms']=atoms
 elif i in{17,18}:
  matches=one(n);possible=[];previous=0;counts=[]
  for people in range(1,matches+2):
   pairs=list(itertools.combinations(range(people),2));count=len(pairs);counts.append([people,count]);assert people==1 or count>previous;previous=count
   if count==matches:possible.append(people)
  out=one(possible);proof['allMonotonePairCountsThroughUpperBound']=counts
 elif i in{19,20}:
  total,parts=n;low,high=(2,4)if i==19 else(2,3)
  allocations=[(highCount,total-highCount)for highCount in range(total+1)if highCount*high+(total-highCount)*low==parts];out,other=one(allocations);proof['allIntegerAllocations']=allocations;proof['partLedger']=[out*high,other*low,parts]
 else:raise AssertionError(i)
 assert str(out)==r['answer'],(i,out,r['answer']);return{**proof,'answer':str(out)}

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutated(r,i):
 b=copy.deepcopy(r);s=b['statement']
 if i in{13,14}:
  a,c=('кемінде 2 бетбелгі','кемінде 3 бетбелгі')if i==13 else('14 сары','15 сары')
 else:
  matches=list(re.finditer(r'\d+',s));m=matches[-1]if i in{11,12}else matches[0];a=m[0];c=str(int(a)+1)
 if i in{13,14}:assert a in s;b['statement']=s.replace(a,c,1)
 else:b['statement']=s[:m.start()]+c+s[m.end():]
 return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20;entries=[];evidence=[];equalities=0;canaries=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and q['options']==[]and not q['images']and not q['svg']and q['solution']
  official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']));src=solve({**q,'answer':official},i,True);proof=solve(r,i)
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and'options'not in r and not r.get('image');assert re.fullmatch(r'\d+',r['answer'])
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert calc(m[1])==F(m[2]),('printed numerical equality',i,m.group());equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  try:solve(mutated(r,i),i)
  except(AssertionError,ValueError):canaries+=1
  else:raise AssertionError(('semanticcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'full source/new text and full official/new solutions read; missing keys/MCQ honestly retained. All actual unordered pairs and inverse uniqueness, explicit queue counts, elimination state invariant, all page strings, color distributions and integer part allocations recomputed from printed conditions. Same root, no separate human review.','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)and check['fractions']==2
 summary={'verified':20,'sourceKeysNotCaptured':20,'sourceMCQsNotPresent':20,'allSourceNewConditionsFullSolutionsRead':20,'targetSpecificModels':len(set(r['modelId']for r in rows)),'wrongKeysRejected':20,'printedSemanticCanariesRejected':canaries,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':20,'nativeFractions':check['fractions'],'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
