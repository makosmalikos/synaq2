"""All15 frozen FEMO8winter full source/new conditions and official/new solutions
read. Source keys null, no sourceMCQs. The source number-row raster was viewed,
and replaced by a native table; neighbor-age inputs in a second native table.
Same root author wrote separate printed-input exact finite/combinatorial check;
no separate human/agent reviewer. Native table data—not JS specs/params—read.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo8-winter';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9check',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one=H.one;ns=lambda s:list(map(int,re.findall(r'\d+',s)))

def native_table(s):
 lines=[line.strip()for line in s.splitlines()if line.strip().startswith('|')];assert len(lines)>=3;cells=[[c.strip()for c in l.split('|')[1:-1]]for l in lines];assert len({len(r)for r in cells})==1 and all(c=='---'for c in cells[1]);return[cells[0],*cells[2:]]
def gauss_neighbor(sums):
 size=len(sums);a=[]
 for i,total in enumerate(sums):
  row=[F(int(j in{(i-1)%size,(i+1)%size}))for j in range(size)]+[F(total)];a.append(row)
 for col in range(size):
  pivot=next(i for i in range(col,size)if a[i][col]);a[col],a[pivot]=a[pivot],a[col];scale=a[col][col];a[col]=[x/scale for x in a[col]]
  for i in range(size):
   if i==col:continue
   scale=a[i][col];a[i]=[u-scale*v for u,v in zip(a[i],a[col])]
 ages=[row[-1]for row in a];assert all(x>0 and x.denominator==1 for x in ages)
 assert all(ages[i-1]+ages[(i+1)%size]==total for i,total in enumerate(sums));return ages

def solve(r,i,source=False):
 s=r['statement'];n=ns(s);proof={};out=None
 if i==1:
  rows,cols,pieces=n;assert rows*cols==pieces;components=1;breaks=[]
  while components<pieces:breaks.append((components,components+1));components+=1
  out=len(breaks);proof['allComponentCounts']=breaks
 elif i==2:
  guesses,errors=n[:3],n[3:];assert len(errors)==3;radius=max(errors);low=max(1,max(guesses)-radius);high=min(guesses)+radius;candidates=[age for age in range(low,high+1)if sorted(abs(age-g)for g in guesses)==sorted(errors)];out=one(candidates);proof['allBoundedAgeCandidates']=[{'age':age,'errors':[abs(age-g)for g in guesses]}for age in range(low,high+1)]
 elif i==3:
  divisor=one(n);mult=[divisor,2*divisor];odd=[];v=1
  while len(odd)<3:
   if v not in mult:odd.append(v)
   v+=2
  upper=sum(mult+odd);best=upper;winners=[];checked=0
  for odds in itertools.combinations(range(1,upper+1,2),3):
   for multiples in itertools.combinations(range(divisor,upper+1,divisor),2):
    checked+=1
    if set(odds)&set(multiples):continue
    total=sum(odds+multiples)
    if total<best:best=total;winners=[]
    if total==best:winners.append((odds,multiples))
  out=best;assert winners;proof.update(constructiveUpperBound=upper,allFiniteCandidatesChecked=checked,allMinimumAssignments=winners,positiveComponentBoundJustification='Any sum below witness has every positive term below witness; exhaustive search covers all possible improvements.')
 elif i==4:
  students=one(n);possible=[girls for girls in range(students+1)if girls<=students-girls+1];out=max(possible);boys=students-out;matrix=[[int(j<k)for j in range(boys)]for k in range(out)];degrees=[sum(row)for row in matrix];assert len(set(degrees))==out and min(degrees)>=0 and max(degrees)<=boys;proof.update(allFeasibleGirlCounts=possible,attainingBipartiteAdjacency=matrix,girlBoyFriendDegrees=degrees)
 elif i==5:
  start,m1,m2,a1,a2,d1,d2=n;cases=[{'multiply':m,'add':a,'divide':d,'exactResult':F(start*m+a,d)}for m,a,d in itertools.product((m1,m2),(a1,a2),(d1,d2))];valid=[c for c in cases if c['exactResult'].denominator==1];out=int(one(valid)['exactResult']);proof['allEightOperationPaths']=[{**c,'exactResult':str(c['exactResult'])}for c in cases]
 elif i==6:
  if source:assert'бір сағат алты жарым минут'in s;seconds=F(3600)+F(13,2)*60;per=one(n)
  else:h,m=one(re.findall(r'(\d+) сағат (\d+,\d+) минут',s));seconds=F(h)*3600+F(m.replace(',','.'))*60;per=int(one(re.findall(r'әр жолы (\d+) секунд',s)))
  merges=seconds/per;assert merges.denominator==1;out=int(merges)+1;proof['timeAndComponentLedger']={'totalSeconds':str(seconds),'secondsPerMerge':per,'merges':int(merges),'initialComponents':out,'finalComponents':1}
 elif i==7:
  total=int(one(re.findall(r'қосындысы\s*\$?(\d+)',s)));valid=[]
  for size in range(1,total+1):
   base=sum(range(1,size+1));extra=total-base
   if 1<=extra<=size:valid.append((size,extra))
  size,out=one(valid);proof['allAdmissibleRowSizeDuplicatePairs']=valid;proof['actualTicketLedger']=list(range(1,size+1))+[out];assert sum(proof['actualTicketLedger'])==total
 elif i==8:
  cups=list(map(int,re.findall(r'(\d+)\s*шыны',s.replace('$',''))))[-2:];assert len(cups)==2;valid=[]
  for packets in range(1,max(cups)+1):
   three=[c-2*packets for c in cups]
   if all(0<=t<=packets for t in three):valid.append((packets,three))
  out,three=one(valid);proof['exactPerBoxPacketLedgers']=[{'twoCupPackets':out-t,'threeCupPackets':t,'totalPackets':out,'cups':c}for t,c in zip(three,cups)];assert all(2*l['twoCupPackets']+3*l['threeCupPackets']==l['cups']for l in proof['exactPerBoxPacketLedgers'])
 elif i==9:
  players=one(n);counts=[players];matches=[]
  while players>1:matches.append(players//2);players=(players+1)//2;counts.append(players)
  out=len(matches);assert sum(matches)==n[0]-1;proof.update(everyRoundRemainingCounts=counts,matchesEachRound=matches,totalMatches=sum(matches),askedQuantity='rounds')
 elif i==10:
  target=int(one(re.findall(r'\$?(\d+)\$?\s*саны қай',s)))
  if source:
   rows=[list(range((k-1)**2+1,k*k+1))for k in range(1,6)];proof['visuallyReadSourceRows']=rows
  else:
   data=native_table(s);assert data[0]==['Қатар','Сандар'];rows=[]
   for idx,row in enumerate(data[1:],1):assert row[0]==str(idx);rows.append(list(map(int,re.findall(r'\d+',row[1]))))
  assert rows[0]==[1];sizes=[len(row)for row in rows];steps=[b-a for a,b in zip(sizes,sizes[1:])];step=one(set(steps));assert step==2 and sum(rows,[])==list(range(1,sum(sizes)+1))
  current=1;length=sizes[0];index=1;boundaries=[]
  while True:
   end=current+length-1;boundaries.append((index,current,end))
   if current<=target<=end:out=index;break
   current=end+1;length+=step;index+=1
  proof['allRowsThroughTarget']=boundaries
 elif i==11:
  if source:a,b=one(re.findall(r'(\d{3})\{\*\}(\d{4})',s))
  else:a,b=one(re.findall(r'(\d{3})□(\d{4})',s))
  candidates=[(d,int(a+str(d)+b))for d in range(10)if int(a+str(d)+b)%11==0];out,value=one(candidates);proof['all10CandidateRemainders']=[int(a+str(d)+b)%11 for d in range(10)];proof['exactDivision']=[value,11,value//11];assert 11*(value//11)==value
 elif i==12:
  if source:
   block=one(re.findall('қатысушысы — (.*?) —',s));names=[name.strip()for name in block.replace(' және ', ', ').split(',')];sums=list(map(F,n));assert len(sums)==5
  else:data=native_table(s);assert data[0]==['Қатысушы','Жас қосындысы'];names=[r[0]for r in data[1:]];sums=[F(r[1])for r in data[1:]]
  assert len(names)==len(set(names))==len(sums)==5;asked=one(re.findall(r'([А-ЯӘІҢҒҮҰҚӨҺ][а-яәіңғүұқөһ]+) неше жаста',s));assert asked in names;ages=gauss_neighbor(sums);out=int(ages[names.index(asked)]);proof['allFiveAgesFromFullRankSystem']={name:str(age)for name,age in zip(names,ages)};proof['allFiveNeighborSumChecks']=[str(ages[k-1]+ages[(k+1)%5])for k in range(5)];proof['askedPerson']=asked
 elif i==13:
  digit=one(re.findall(r'\$?(\d)\$?\s*цифры',s));low,high=100,999
  if not source:low,high=map(int,one(re.findall(r'(\d+)–(\d+)',s)))
  matching=[str(k)for k in range(low,high+1)if k%2==1];counts=[sum(v[pos]==digit for v in matching)for pos in range(3)];out=sum(counts);proof['digitOccurrencesByHundredsTensUnits']=counts;proof['matchingOddNumberCount']=len(matching)
 elif i==14:
  low,high=(100,999)if source else n;assert 100<=low<=high<=999;valid=[]
  for value in range(low,high+1):
   ds=list(map(int,str(value)))
   if sum(ds)>math.prod(ds):valid.append(value)
  out=len(valid);proof['allAdmissibleNumbers']=valid;proof['fullRangeChecked']=[low,high];proof['splitZeroNonzeroCounts']=[sum('0'in str(v)for v in valid),sum('0'not in str(v)for v in valid)]
 elif i==15:
  digits=n[:-1];target=n[-1];assert len(digits)==len(set(digits))==7 and all(0<=d<=9 for d in digits);matches=[];checked=0
  for assignment in itertools.permutations(digits):
   checked+=1
   if sum(assignment[:4])-sum(assignment[4:])==target:matches.append(assignment)
  assert checked==5040;out=len(matches);triple_counts=collections.Counter(tuple(sorted(v[4:]))for v in matches);assert all(c==144 for c in triple_counts.values());proof.update(all5040AssignmentsChecked=True,admissibleMinusTriples=[list(k)for k in sorted(triple_counts)],assignmentsEachTriple=list(triple_counts.values()))
 else:raise AssertionError(i)
 assert str(out)==r['answer'],(i,out,r['answer']);return{**proof,'answer':str(out)}

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('4 қатар мен 5 бағаннан, барлығы 20','4 қатар мен 6 бағаннан, барлығы 24'),2:('35; 39; 42','36; 40; 43'),3:('5 санына','7 санына'),4:('39 оқушы','41 оқушы'),5:('124 санынан','136 санынан'),6:('9 секунд','10 секунд'),7:('қосындысы 242','қосындысы 243'),9:('350 теннисші','513 теннисші'),10:('947 саны','962 саны'),11:('583□4076','584□4076'),12:('| Аян | 23 |','| Аян | 25 |'),13:('7 цифры','8 цифры'),14:('100 мен 899','100 мен 999'),15:('− G = 1','− G = 3')}
 if i==8:b['statement']=s.replace('53 шыны','55 шыны').replace('77 шыны','80 шыны');return b
 a,c=pairs[i];assert a in s;b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==15;entries=[];evidence=[];canaries=0;equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and q['solution'];official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']))
  try:original=solve({**q,'answer':official},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('REWRITE',i))from e
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and'options'not in r and not r.get('image')and re.fullmatch(r'\d+',r['answer'])and not re.search(r'[\\$]',r['statement']+r['solution'])
  if i==10:assert len(q['images'])==1;assert hashlib.sha256((ROOT/'problems/sources/zerek/images/410d3e9fa1702fe2bbc437b2.png').read_bytes()).hexdigest()=='6d9d8567429711cdf389dd665d7ec18e7411e762e33eebfc82730e0705bcf03d'
  else:assert not q['images']and not q['svg']
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert H.calc(m[1])==F(m[2]),('printed equality',i,m.group());equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  try:solve(mutation(r,i),i)
  except(AssertionError,ValueError):canaries+=1
  else:raise AssertionError(('semanticcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':original,'rewritten':proof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full source/new conditions and solutions read. Exact finite age/positive odd-multiple/operation/seat/packet/round/number/digit/5040assignment enumeration, actual attaining bipartite graph, full-rank Fraction neighbor system, native number-row table and source raster checked. Same root, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0,t=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='table'){t++;for(const r of n.rows)for(const c of r)walk(c)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),tables:t,fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)and check['tables']==2
 summary={'verified':15,'sourceKeysNotCaptured':15,'allSourceNewConditionsFullSolutionsRead':15,'wrongKeysRejected':15,'printedSemanticCanariesRejected':canaries,'printedSolutionEqualitiesVerified':equalities,'nativeTables':check['tables'],'nativeFractions':check['fractions'],'all5040AssignmentsChecked':True,'sourceRasterReplacedByNativeTable':True,'pythonJavaScriptHashesMatched':15,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
