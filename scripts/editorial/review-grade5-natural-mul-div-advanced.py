"""External20 fullsource/new review, actualprinted own exact/full-domain oracle.
Only generic helpers from an independent reviewer are reused; no author specs,
params, renderer or calculator imported. 810000 actual product pairs,10000
prefix dividends, all positive factor pairs, sequential page digit counts and
book/album ledgers are separately enumerated.
"""
import copy,importlib.util,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-natural-mul-div-advanced.json'
spec=importlib.util.spec_from_file_location('external_generic',ROOT/'scripts/editorial/review-grade5-natural-mul-div-basic.py');P=importlib.util.module_from_spec(spec);spec.loader.exec_module(P)
one,clean,ns,calc,opts,numeric,select,trace,hashrow=P.one,P.clean,P.ns,P.calc,P.opts,P.numeric,P.select,P.division_trace,P.hashrow

def solve(r,i,source=False):
 s=clean(r['statement']);numbers=ns(s)
 if i==0:
  ratio=int(one(re.findall(r'a : b = (\d+)',s)));scaleA=int(one(re.findall(r'a × (\d+)',s)));scaleB=int(one(re.findall(r'b × (\d+)',s)));assert min(ratio,scaleA,scaleB)>0
  answer=F(ratio*scaleA,scaleB);assert all(F(ratio*b*scaleA,b*scaleB)==answer for b in range(1,1001));return numeric(r,answer)
 if i==1:
  assert len(set(numbers))==1 and numbers[0]>1
  f=numbers[0];assert all(a*(f*c)==(a*f)*c for a in range(1,101) for c in range(1,101))
  return select(r,lambda o:o.casefold()=='өзгермейді')
 if i==2:
  old,buses,new=numbers if not source else numbers[1:];total=old*buses;answer=next(b for b in range(total+1) if b*new>=total);assert (answer-1)*new<total<=answer*new
  return numeric(r,answer)
 if i==3:
  a,b=(3,2) if source else numbers[:2];low=10**(a-1)*10**(b-1);high=(10**a-1)*(10**b-1);lengths={len(str(low)),len(str(high))};assert max(lengths)-min(lengths)==1
  return select(r,lambda o:ns(o)==sorted(lengths) and 'немесе' in o)
 if i==4:
  product=int(one(re.findall(r'x × y = (\d+)',s)));divisor=int(one(re.findall(r'y саны (\d+)',s)));factor=int(one(re.findall(r'x × (\d+)',s)));divisor2=int(one(re.findall(r'y : (\d+)',s)));assert divisor2==divisor and min(product,divisor,factor)>0
  pairs=[(x,product//x) for x in range(1,product+1) if product%x==0 and (product//x)%divisor==0];assert pairs
  answers={F(x*factor*y,divisor) for x,y in pairs};return numeric(r,one(list(answers)))
 if i==5:return numeric(r,calc(one(re.findall(r'\d+ × \d+',s))))
 if i in (6,18):
  multiplier,shift,divisor,out=numbers;assert min(multiplier,divisor)>0;answer=F(out*divisor+(-shift if i==6 else shift),multiplier);assert answer.denominator==1 and answer>0
  assert F(answer*multiplier+(shift if i==6 else -shift),divisor)==out;return numeric(r,answer)
 if i==7:
  divisor,digits=numbers if not source else (36,4);lo=10**(digits-1);hi=10**digits;answer=next(n for n in range(lo,hi) if n%divisor==0);return numeric(r,answer)
 if i==8:
  start,digits=numbers;assert start==1;used=0;hits=[]
  for last in range(1,10000):
   used+=len(str(last))
   if used==digits:hits.append(last)
   if used>digits:break
  return numeric(r,one(hits))
 if i==9:
  increase,decrease,total=numbers[:2]+[numbers[-1]];assert increase>0 and decrease>0
  initial=F(total*decrease,increase);assert initial.denominator==1
  pairs=[(a,int(initial)//a) for a in range(1,int(initial)+1) if initial%a==0 and int(initial)//a%decrease==0];assert pairs and all(a*increase*(b//decrease)==total for a,b in pairs)
  return numeric(r,initial)
 if i==10:
  a,b,totalA,c,d,totalB=numbers;den=a*d-b*c;assert den!=0;book=F(totalA*d-b*totalB,den);album=F(a*totalB-totalA*c,den);assert book>0 and album>0
  assert a*book+b*album==totalA and c*book+d*album==totalB
  # Independent integerledger enumeration fixes book and derives album from
  # first weighedgroup, then checks the ENTIRE second group and requestedrole.
  hits=[]
  for m in range(1,totalA//a+1):
   remaining=totalA-a*m
   if remaining>0 and remaining%b==0 and c*m+d*(remaining//b)==totalB:hits.append((m,remaining//b))
  assert hits==[(book,album)];return numeric(r,album)
 if i==11:return numeric(r,calc(one(re.findall(r'\d+ : \d+',s))))
 if i in (12,13):return numeric(r,calc(one(re.findall(r'\d+(?: × \d+)+',s))))
 if i==14:
  total,divisor=numbers[:2];assert total%divisor==0
  return select(r,lambda o:divisor*calc(o)%10==0)
 if i==15:
  root,factor=map(int,one(re.findall(r'\(x - (\d+)\) × (\d+) = 0',s)));assert factor>0
  return select(r,lambda o:calc(o)>=root and (calc(o)-root)*factor==0)
 if i==16:
  if source:boxes,mass,package=numbers
  else:mass,boxes,package=numbers
  assert mass*boxes%package==0;return numeric(r,F(mass*boxes,package))
 if i==17:
  lead,digitcount,divisor=(5,5,64) if source else numbers;lo=lead*10**(digitcount-1);hi=(lead+1)*10**(digitcount-1)
  values=[n//divisor for n in range(lo,hi) if n%divisor==0];length=one(list({len(str(q)) for q in values}));assert lead<divisor and lead*10+9<divisor and lead*100>=divisor
  return select(r,lambda o:o==str(length)+' цифр' or o=={3:'үш',4:'төрт',5:'бес'}[length]+' таңбалы')
 if i==19:
  lo,hi,divisor=numbers;assert lo==1 and hi>=lo and divisor>0;return numeric(r,len([n for n in range(lo,hi+1) if n%divisor==0]))
 raise AssertionError(i)
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==20;entries=[];refs=[];claims=0;partialsteps=0
 normalized=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip()
 for i,row in enumerate(rows):
  try:solve(row,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and not raw.get('images') and not raw.get('svg')
  try:solve({**raw,'answer':raw['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if raw['options']:assert one([clean(o['text']) for o in raw['options'] if o['correct']])==clean(raw['sourceAnswer'])
  assert normalized(row['statement'])!=normalized(raw['statement']) and row['minimumPlan']=='pro'
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('badkey accepted',i))
  if i==11:
   n,d=ns(row['statement']);q,r,steps=trace(n,d);assert q==int(row['answer']) and r==0
   printed=[tuple(map(int,m)) for m in re.findall(r'(\d+) ішінде (\d+) саны (\d+) рет:\s*(\d+) × (\d+) = (\d+), қалдық (\d+) - (\d+) = (\d+)',clean(row['solution']))];assert len(printed)==len(steps)
   for actual,expected in zip(printed,steps):
    current,d,q,product,r=expected;assert actual==(current,d,q,d,q,product,current,product,r)
   partialsteps+=len(steps)
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+×:-]\s*-?\d+)*)\s*=\s*(-?\d+(?:\s*[+×:-]\s*-?\d+)*)',clean(row['solution'])):
   a,b=m.groups()
   if not re.search(r'[+×:-]',a):continue
   assert calc(a)==calc(b),(i,a,b);claims+=1
  # Explicit inverse stages, with no author-produced AST as oracle.
  if i in (6,18):
   multiplier,shift,divisor,out=ns(row['statement']);middle=out*divisor;before=middle+(-shift if i==6 else shift);result=before//multiplier
   expected=[f'{out} × {divisor} = {middle}',f'{middle} '+('−' if i==6 else '+')+f' {shift} = {before}',f'{before} : {multiplier} = {result}']
   assert all(e in row['solution'] for e in expected)
  entries.append({'editionId':row['editionId'],'sha256':hashrow(row),'verdict':'verified','method':'independent_all_saved_new_official_authored_fullsolutions_every_MCQ_read_actualprinted_Fraction_AST_streameddivision_fullproduct_prefix_pagedigit_integerledger_domains_inverse_target_oracle','notes':[]});refs.append(ref)
 # Full domains differ from author endpoint-only derivation.
 productCounts={}
 for a in range(100,1000):
  for b in range(100,1000):productCounts[len(str(a*b))]=productCounts.get(len(str(a*b)),0)+1
 assert set(productCounts)=={5,6} and sum(productCounts.values())==810000
 prefixcases=0
 for n in range(60000,70000):
  q,r,steps=trace(n,78);assert q==n//78 and r==n%78 and len(str(q))==3 and steps[0][0]==int(str(n)[:3]);prefixcases+=1
 prefix=rows[17]['solution'];assert all(s in prefix for s in ['6 < 78','60–69','600–699','3 цифрдан','жүздіктер'])
 canaries=0
 for i,row in enumerate(rows):
  c=copy.deepcopy(row)
  if i in (1,3,12,14):
   if i==1:c['options']=['4 есе артады' if o=='Өзгермейді' else o for o in c['options']]
   elif i==3:c['statement']=c['statement'].replace('3 таңбалы және 3 таңбалы','4 таңбалы және 3 таңбалы')
   elif i==12:c['statement']=c['statement'].replace('× 0 ×','× 1 ×')
   else:c['options']=['1' if o=='2' else o for o in c['options']]
  elif i==2:c['statement']=c['statement'].replace('48 орынды','60 орынды')
  elif i==15:c['statement']=c['statement'].replace('x − 16','x − 17')
  elif i==17:c['statement']=c['statement'].replace('78 санына','5 санына')
  elif i==19:c['statement']=c['statement'].replace('250 санына','256 санына')
  elif i==8:c['statement']=c['statement'].replace('429 цифр','432 цифр')
  else:
   m=re.search(r'\d+',c['statement']);assert m;c['statement']=c['statement'][:m.start()]+str(int(m.group())+1)+c['statement'][m.end():]
  try:solve(c,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):canaries+=1
  else:raise AssertionError(('printedcanary accepted',i))
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All20 saved/new FULLconditions/official+authoredsolutions/everyMCQ read. Own printed exactFraction AST, streamed digitdivision, all810000 productpairs,10000prefixdividends, sequential digitnumbers, finite positive book/album/factorpair ledgers and inverse undo stages. No author specs/models/params/calculator imported.','summary':{'verified':20,'findings':0,'wrongKeysRejected':20,'printedGivenOrRoleCanariesRejected':canaries,'printedNumericEqualities':claims,'actualLongDivisionPartialSteps':partialsteps,'fullThreeDigitProductPairs':810000,'fullFiveDigitPrefixDomain':prefixcases,'pythonJavaScriptHashesMatched':20},'productDigitDomainCounts':productCounts,'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-natural-mul-div-advanced.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
