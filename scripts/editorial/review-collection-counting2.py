"""Full saved/new conditions and FULL official/new solutions read for20 counting
occurrences. Source MCQs empty and sourceAnswer null; no source key fabricated.
Separate printed-input exact/combinatorial computation by same root author,
no separate human/agent reviewer. Numeric variants not new semantic stories.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-counting2';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9check',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,calc=H.one,H.calc
def ns(s):return list(map(int,re.findall(r'\d+',s)))
def solve(r,i,source=False):
 s=r['statement'];n=ns(s);proof={};out=None
 if i==1:
  heads,legs=n;pairs=[(a,heads-a)for a in range(heads+1)if a*4+(heads-a)*2==legs];answer,other=one(pairs);out=answer;proof['allHeadLegSolutions']=pairs
 elif i in{2,3,4}:
  up,down,height=n;assert up>down>0 and height>up;level=0;log=[]
  for day in range(1,height+1):
   peak=level+up;log.append({'day':day,'morning':level,'peakWithoutCap':peak,'reachesSummit':peak>=height})
   if peak>=height:out=day;break
   level=peak-down
  assert out and all(not d['reachesSummit']for d in log[:-1]);proof['everyDayNightState']=log
 elif i in{5,6}:
  first,last=n;assert first==1;digits=''.join(str(k)for k in range(first,last+1));out=len(digits);proof['pageStringDigitCounts']={str(width):sum(len(str(k))for k in range(first,last+1)if len(str(k))==width)for width in range(1,len(str(last))+1)}
 elif i in{7,8,15,16}:
  counts=n[:3];target=n[3]if i in{7,8}else None;assert len(n)==(4 if target else 3)
  states=[a for a in itertools.product(*(range(c+1)for c in counts))]
  fail=lambda a:max(a)<target if target else min(a)==0
  bad=[a for a in states if fail(a)];safe=max(map(sum,bad));out=safe+1;witness=one([next(a for a in bad if sum(a)==safe)])
  assert all(not fail(a)for a in states if sum(a)==out)
  proof.update(allPossibleColorCounts=len(states),maxFailureWitness=witness,guaranteeAt=out,analyzedPredicate='some color reaches target'if target else'every color present')
 elif i in{9,10}:
  total,a,b,ab=n;assert 0<=ab<=min(a,b);onlyA=a-ab;onlyB=b-ab;out=total-onlyA-onlyB-ab;assert out>=0;proof['fourDisjointAtoms']=[onlyA,onlyB,ab,out];assert sum(proof['fourDisjointAtoms'])==total
 elif i in{11,18}:
  people=n[0];assert people>=2 and n==[people,1,2,people]
  exact='дәл k'in s if not source else'дәл'in s
  assert exact if i==11 else(not exact and'кемінде'in s)
  valid=[];assignments=0
  for liars in itertools.product((False,True),repeat=people):
   assignments+=1;count=sum(liars);claims=[count==k if exact else count>=k for k in range(1,people+1)]
   if all(claim!=liar for claim,liar in zip(claims,liars)):valid.append(liars)
  assignment=one(valid);out=sum(assignment);proof.update(allTruthLiarAssignments=assignments,uniqueConsistentLiarPositions=[k+1 for k,v in enumerate(assignment)if v])
 elif i==12:
  front,back,gap=n;assert 'алдырақ'in s or 'бұрын'in s
  valid=[]
  for total in range(max(front,back),front+back+gap+3):
   second=total-back+1
   if front<second and second-front-1==gap:valid.append(total)
  out=one(valid);proof['explicitQueuePositions']={'first':front,'second':out-back+1,'between':gap,'secondFromBack':back,'total':out}
 elif i in{13,14}:
  first,total=n;assert first==1;digits=0;out=None
  for page in range(1,total+2):
   digits+=len(str(page))
   if digits==total:out=page;break
   if digits>total:break
  assert out is not None;assert len(''.join(map(str,range(1,out+1))))==total;proof['exactInversePageStringLength']=total
 elif i==17:
  total,a,b,c,ab,ac,bc,abc=n
  atoms={'111':abc,'110':ab-abc,'101':ac-abc,'011':bc-abc,'100':a-ab-ac+abc,'010':b-ab-bc+abc,'001':c-ac-bc+abc};assert min(atoms.values())>=0
  union=sum(atoms.values());out=total-union;assert out>=0;atoms['000']=out
  assert sum(atoms.values())==total
  for mask,count in[('100',a),('010',b),('001',c),('110',ab),('101',ac),('011',bc),('111',abc)]:assert sum(v for k,v in atoms.items()if all(x=='0'or k[j]=='1'for j,x in enumerate(mask)))==count
  proof['allEightDisjointVennAtoms']=atoms
 elif i in{19,20}:
  teams,win,draw,loss,total=n;pairs=list(itertools.combinations(range(teams),2));assert len(pairs)==teams*(teams-1)//2
  # Enumerate every possible draw count, then construct a concrete valid
  # match ledger. A decisive match awards win to lower-index team, loss to other.
  candidates=[d for d in range(len(pairs)+1)if d*2*draw+(len(pairs)-d)*(win+loss)==total];out=one(candidates);scores=[0]*teams;ledger=[]
  for j,(a,b)in enumerate(pairs):
   x,y=(draw,draw)if j<out else(win,loss);scores[a]+=x;scores[b]+=y;ledger.append([a+1,b+1,x,y])
  assert sum(scores)==total;proof.update(allUniqueMatchPairs=pairs,concreteMatchPoints=ledger,teamScoreLedger=scores)
 else:raise AssertionError(i)
 assert str(out)==r['answer'],(i,out,r['answer']);return{**proof,'answer':str(out)}

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('102 аяқ','104 аяқ'),2:('32 м','37 м'),3:('30 м','34 м'),4:('31 м','36 м'),5:('426','427'),6:('354','355'),7:('кемінде 4 текше','кемінде 5 текше'),8:('кемінде 6 текше','кемінде 7 текше'),9:('36 бала','37 бала'),10:('34 бала','35 бала'),11:('13 адамның','14 адамның'),12:('дәл 5 адам','дәл 6 адам'),13:('564 цифр','567 цифр'),14:('1359 цифр','1362 цифр'),15:('14 көк','15 көк'),16:('17 күлгін','18 күлгін'),17:('43 оқушы','44 оқушы'),18:('10 адамның','12 адамның'),19:('37 болды','38 болды'),20:('51 болды','52 болды')};a,c=pairs[i];assert a in s;b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20;entries=[];evidence=[];equations=0;canaries=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and q['options']==[]and not q['images']and not q['svg']and q['solution']
  # The captured official solution contains the explicitly stated conclusion,
  # but no captured sourceAnswer field. Recompute, then compare that conclusion.
  official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']));sourceProof=solve({**q,'answer':official},i,True)
  proof=solve(r,i);assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and'options'not in r and not r.get('image')and re.fullmatch(r'\d+',r['answer'])
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert calc(m[1])==F(m[2]),('printed numerical equality',i,m.group());equations+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrong key accepted',i))
  try:solve(mutation(r,i),i)
  except(AssertionError,ValueError):canaries+=1
  else:raise AssertionError(('changed given accepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':sourceProof,'rewritten':proof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'read full source/new conditions and solutions, sourceAnswer absent honestly retained; exact printed-input whole state simulation, all color distributions and truth/lie assignments, actual page strings, disjoint Venn atoms, explicit pairwise match ledgers; same root, no separate human reviewer','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(r.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':20,'sourceKeysNotCaptured':20,'sourceMCQsNotPresent':20,'allSourceNewConditionsFullSolutionsRead':20,'targetSpecificModels':len(set(r['modelId']for r in rows)),'wrongKeysRejected':20,'printedSemanticCanariesRejected':canaries,'printedSolutionEqualitiesVerified':equations,'pythonJavaScriptHashesMatched':20,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
