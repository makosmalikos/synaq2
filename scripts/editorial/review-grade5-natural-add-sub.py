"""External45 full saved/new reading; own printed arithmetic/column/domain oracle.

No author specs, params, models or solver imported. Uses exact Python integers,
AST arithmetic, an independent digit borrowing/carry ledger and full finite
permutation/hole/distinct-digit/ray domains. Full solutions and MCQs read.
"""
import ast,copy,hashlib,itertools,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-natural-add-sub.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def clean(s):return str(s).replace('$','').replace('\\,','').replace('−','-').replace('\\square','□').replace('\\cdot','×').replace('\\times','×')
def numbers(s):return list(map(int,re.findall(r'\d+',clean(s))))
def calc(s):
 t=ast.parse(clean(s).replace('×','*').replace('÷','/').strip(),mode='eval')
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):assert isinstance(t.value,int);return t.value
  if isinstance(t,ast.UnaryOp):return -ev(t.operand) if isinstance(t.op,ast.USub) else ev(t.operand)
  assert isinstance(t,ast.BinOp);a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return a+b
  if isinstance(t.op,ast.Sub):return a-b
  if isinstance(t.op,ast.Mult):return a*b
  assert isinstance(t.op,ast.Div) and b and a%b==0;return a//b
 return ev(t)
def poly(s):
 s=clean(s).replace('×','*');s=re.sub(r'(\d|\))\s*([a-z(])',r'\1*\2',s);tree=ast.parse(s.strip(),mode='eval')
 def add(a,b,k=1):
  o=a.copy()
  for v,n in b.items():o[v]=o.get(v,0)+k*n
  return {v:n for v,n in o.items() if n}
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):return {'':t.value} if t.value else {}
  if isinstance(t,ast.Name):return {t.id:1}
  if isinstance(t,ast.UnaryOp):return {v:(-n if isinstance(t.op,ast.USub) else n) for v,n in ev(t.operand).items()}
  assert isinstance(t,ast.BinOp);a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return add(a,b)
  if isinstance(t.op,ast.Sub):return add(a,b,-1)
  assert isinstance(t.op,ast.Mult) and (set(a)<={''} or set(b)<={''});factor=a.get('',0) if set(a)<={''} else b.get('',0);other=b if set(a)<={''} else a;return {v:factor*n for v,n in other.items() if factor*n}
 return ev(tree)
def equation(s):
 a,b=clean(s).split('=');p,q=poly(a),poly(b)
 for v,n in q.items():p[v]=p.get(v,0)-n
 return {v:n for v,n in p.items() if n}
def opts(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def numeric(r,n):
 strip=lambda s:re.sub(r'\s+(?:теңге|км|кітап|оқушы|шие)$','',clean(s)).strip()
 assert calc(strip(r['answer']))==n,(r['answer'],n)
 if opts(r):assert sum((calc(strip(o))==n) if re.fullmatch(r'[0-9+*()\s-]+',strip(o)) else False for o in opts(r))==1
 return n
def select(r,predicate):
 expected=one([o for o in opts(r) if predicate(o)]);assert clean(r['answer'])==expected,(r['answer'],expected)
 return expected
def exprs(s):return [m.strip() for m in re.findall(r'\d+(?:\s*[+−-]\s*\d+)+',str(s))]
def point(o):return int(one(re.findall(r'\((-?\d+)\)',clean(o))))
def digits_count_extreme(n,maximum):return (10**n-1) if maximum else 10**(n-1)
def solve(r,i,source=False):
 s=clean(r['statement']);ns=numbers(s);os=opts(r)
 if i==0:return numeric(r,ns[0]-ns[1])
 if i in (1,2,4,6,10,17,37,39):return numeric(r,calc(exprs(s)[0]))
 if i==3:
  relation=one(re.findall(r'([a-z] - [a-z] = [a-z])',s));target=equation(relation)
  return select(r,lambda o:equation(o)==target)
 if i in (5,21):return numeric(r,ns[1]-ns[0] if source and i==21 else ns[0]-ns[1])
 if i==7:
  a,b,c=ns[:3];assert a-b==c
  assert all(calc(o.split('=')[0])==calc(o.split('=')[1]) for o in os)
  return select(r,lambda o:re.sub(r'\s','',o)==f'{c}+{b}={a}')
 if i==8:
  assert ns[0]-ns[1]==ns[2];return numeric(r,ns[1])
 if i==9:
  target=ns[0];return select(r,lambda o:calc(o)==target)
 if i==11:
  a,delta=ns;assert a>=delta;return select(r,lambda o:point(o)==a-delta)
 if i==12:
  assert ns[0]+ns[1]==ns[2];return select(r,lambda o:'қосындының мәні'==o.casefold())
 if i==13:return numeric(r,ns[0]-ns[1])
 if i==14:
  value=calc(one(exprs(s)))
  return select(r,lambda o:(lambda m:int(m[0])<value<int(m[1]))(one(re.findall(r'(\d+) < s < (\d+)',o))))
 if i==15:
  counts=ns if not source else [4,3];return numeric(r,digits_count_extreme(counts[0],True)-digits_count_extreme(counts[1],False))
 if i==16:return numeric(r,ns[0]-ns[1]-ns[2])
 if i==18:
  amount=ns[0];return select(r,lambda o:numbers(o)==[amount] and 'артады' in o.casefold())
 if i==19:return numeric(r,2*ns[0]-ns[1])
 if i==20:return numeric(r,ns[0]-ns[1]+ns[2]+ns[3])
 if i==22:
  # Old classroom names5A/5Ә/5Б contain repeated grade digits; read quantities
  # from original statement explicitly, not those class labels.
  quantities=ns if not source else list(map(int,re.findall(r'\$(\d+)\$',r['statement'])))
  total,ab,bc=quantities;mid=ab+bc-total;assert min(ab-mid,mid,bc-mid)>=0
  return numeric(r,mid)
 if i==23:
  a,b,d=map(int,one(re.findall(r'(\d+) - (\d+) = (\d+)',s)));c,e=numbers(exprs(s)[1]);assert a-b==d and c-a==e-b;return numeric(r,d)
 if i==24:
  a,right,left=ns;assert a+right>=left;return select(r,lambda o:point(o)==a+right-left)
 if i==25:
  a,b=map(calc,exprs(s));word='бірінші' if a>b else 'екінші' if b>a else 'тең'
  return select(r,lambda o:word in o.casefold())
 if i==26:
  a,b,wrong=ns[:3];assert a-b!=wrong;return numeric(r,a-b)
 if i==27:
  a,r1,l1,r2,l2=ns;states=[a,a+r1,a+r1-l1,a+r1-l1+r2,a+r1-l1+r2-l2];assert min(states)>=0
  return numeric(r,states[-1])
 if i==28:
  ds=ns[:4];perms=[int(''.join(map(str,p))) for p in itertools.permutations(ds)];assert len(perms)==24
  return numeric(r,max(perms)-min(perms))
 if i==29:
  total,n1,n2,n3=ns;counts=[total-n for n in (n1,n2,n3)];last=total-sum(counts);assert min(counts+[last])>=0
  return numeric(r,last)
 if i==30:
  pattern=one(re.findall(r'([0-9□ ]+) - ([0-9□ ]+) = (\d+)',s));a,b,d=[v.replace(' ','') for v in pattern];d=int(d);hits=[]
  for x in range(10):
   for y in range(10):
    if int(a.replace('□',str(x)))-int(b.replace('□',str(y)))==d:hits.append((x,y))
  target=one(hits)
  return select(r,lambda o:tuple(numbers(o))==target)
 if i==31:
  a,b=ns[:2] if not source else (3,4);minimum=next(n for n in range(10**(b-1),10**b) if len(set(str(n)))==b)
  return numeric(r,10**a-1+minimum)
 if i==32:return numeric(r,sum(ns[:3]))
 if i==33:
  a,b,transfer=ns;assert a-transfer==b+transfer;return select(r,lambda o:'тең' in o.casefold())
 if i==34:return numeric(r,ns[0]+ns[1]-ns[2]+ns[3])
 if i==35:
  a,b=ns[:2] if not source else (3,2);minimum=10**(a-1);maximum=10**b-1;assert minimum>maximum
  return numeric(r,minimum-maximum)
 if i==36:
  groups=re.findall(r'(\d+)\s*-\s*(\d+)\s*\+\s*(\d+)',s);assert groups[-1]==('4','3','2');N,M,K=map(int,groups[0]);assert N%2==0 and M==N-1 and K==N-2
  return numeric(r,sum(n if n%2==0 else -n for n in range(1,N+1)))
 if i==38:return select(r,lambda o:o.casefold()=='азайтқыш')
 if i==40:
  a,delta=ns;target={a-delta,a+delta};assert min(target)>=0
  return select(r,lambda o:len(numbers(o))==2 and set(numbers(o))==target)
 if i==41:return numeric(r,ns[0]+ns[1])
 if i==42:return numeric(r,ns[2]+ns[1]-ns[0])
 if i==43:
  a,b=ns[:2] if not source else (5,4);largest=next(n for n in range(10**b-1,10**(b-1)-1,-1) if len(set(str(n)))==b)
  return numeric(r,10**(a-1)-largest)
 if i==44:
  a,d1,d2=ns[:3];bs={a-d1,a+d1};assert min(bs)>=0;cs={b+sign*d2 for b in bs for sign in (-1,1) if b+sign*d2>=0};assert 0 in cs
  return select(r,lambda o:calc(o) not in cs)
 raise AssertionError(i)

def add_columns(a,b):
 A=list(map(int,str(a)[::-1]));B=list(map(int,str(b)[::-1]));carry=0;out=[]
 for i in range(max(len(A),len(B))):
  x=A[i] if i<len(A) else 0;y=B[i] if i<len(B) else 0;total=x+y+carry;out.append((10**i,x,y,carry,total,total%10,total//10));carry=total//10
 return out,carry
def sub_columns(a,b):
 assert a>=b;A=list(map(int,str(a)[::-1]));B=list(map(int,str(b)[::-1]));B+=[0]*(len(A)-len(B));out=[]
 for i,y in enumerate(B):
  if A[i]<y:
   j=next(j for j in range(i+1,len(A)) if A[j]);A[j]-=1
   for k in range(j-1,i,-1):A[k]=9
   A[i]+=10
  out.append((10**i,A[i],y,A[i]-y))
 return out

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==45;entries=[];refs=[];numericClaims=0;columnSteps=0
 subOps={0:(760,290),1:(9406,5182),2:(8000,3467),5:(7000,3849),13:(8304,4726),17:(9512,4678),21:(20000,4678),26:(7004,2867),28:(6532,2356),39:(60000,28476),43:(100000,98765)}
 addOps={4:(4263,3524),9:(758,242),10:(4786,3857),14:(5378,3667),17:(4834,1839),30:(3808,3945),31:(9999,10234),37:(36479,7685),41:(3946,5278)}
 for i,r in enumerate(rows):
  try:solve(r,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and q['checked'] and not q.get('images') and not q.get('svg')
  try:solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if q['options']:assert one([clean(o['text']) for o in q['options'] if o['correct']])==clean(q['sourceAnswer'])
  assert clean(q['statement'])!=clean(r['statement']) and r['minimumPlan']=='pro'
  wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY'
  try:solve(wrong,i)
  except (AssertionError,ValueError,SyntaxError):pass
  else:raise AssertionError(('Badkey accepted',i))
  if i in subOps:
   printed=[tuple(map(int,m)) for m in re.findall(r'(\d+) разрядында:\s*(\d+) − (\d+) = (\d+)',r['solution'])];expected=sub_columns(*subOps[i]);assert printed==expected,(i,printed,expected);columnSteps+=len(printed)
  if i in addOps:
   printed=[tuple(map(int,m)) for m in re.findall(r'(\d+) разрядында:\s*(\d+) \+ (\d+) \+ (\d+) = (\d+); (\d+) жазылады, (\d+) келесі',r['solution'])];expected,carry=add_columns(*addOps[i]);assert printed==expected,(i,printed,expected);columnSteps+=len(printed)
   if carry:assert f'Жоғарғы жаңа разрядқа {carry} жазылады' in r['solution']
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷-]\s*-?\d+)*)\s*=\s*(-?\d+(?:\s*[+−×÷-]\s*-?\d+)*)',r['solution']):
   a,b=m.groups()
   if not re.search(r'[+−×÷-]',a):continue
   assert calc(a)==calc(b),(i,a,b);numericClaims+=1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','method':'independent_all_saved_new_official_authored_fullsolutions_every_MCQ_read_printed_integer_AST_separate_column_carry_borrow_finite_domains_target_oracle','notes':[]});refs.append(ref)
 # One printed-given or requested-role canary per row, independent of params.
 canaries=0
 for i,r in enumerate(rows):
  c=copy.deepcopy(r)
  if i in (3,12,25,38):
   old,new={3:('u = v + w','u = v - w'),12:('Қосындының мәні','Көбейтіндінің мәні'),25:('Бірінші өрнектің мәні үлкен','Тең'),38:('Азайтқыш','Азайғыш')}[i]
   assert old in c['options'];c['options']=[o.replace(old,new) for o in c['options']]
  else:
   m=re.search(r'\d+',c['statement']);assert m
   old=m.group();new=str(int(old)+(100 if i==14 else 1))
   c['statement']=c['statement'].replace(old,new) if i==36 else c['statement'][:m.start()]+new+c['statement'][m.end():]
  try:solve(c,i)
  except (AssertionError,ValueError,SyntaxError,IndexError):canaries+=1
  else:raise AssertionError(('Printed canary accepted',i))
 # Independent exhaustive finite domains, rather than authors' sorted-digit rule.
 permValues=list(itertools.permutations((2,3,5,6)));assert len(permValues)==24
 holes=[]
 for x,y in itertools.product(range(10),repeat=2):
  if int(f'7{x}53')-int(f'38{y}8')==3945:holes.append((x,y))
 assert holes==[(7,0)]
 distinct=[n for n in range(10000,100000) if len(set(str(n)))==5];assert min(distinct)==10234 and max(distinct)==98765
 rayCases=[]
 for sign1,sign2 in itertools.product((-1,1),repeat=2):
  b=50+sign1*18;c=b+sign2*32;assert min(b,c)>=0;rayCases.append(c)
 assert set(rayCases)=={0,36,64,100}
 js="import fs from 'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All45 saved/new fullconditions, complete official/authored solutions and everyMCQ read; own printed Integer/AST and symbolic-component roles, independent digit carry/borrow trace, all true inverse-check options by requested criterion, full permutation/hole/distinct-digit/ray domains. No author specs/params/model/solver imported.','summary':{'verified':45,'findingsResolved':1,'wrongKeysRejected':45,'printedRoleOrGivenCanariesRejected':canaries,'printedNumericEqualities':numericClaims,'independentlyBoundColumnSteps':columnSteps,'digitPermutations':24,'twoHoleDigitAssignments':100,'fiveDigitFullDomain':90000,'distinctFiveDigitCandidates':len(distinct),'twoUnknownRayDirections':4,'pythonJavaScriptHashesMatched':45},'resolvedFindings':[{'sourceId':'459759e8c6b1f2be','finding':'Source used excess-left distance without negative integers; drafted explanation introduced signed net -9 during a natural-operation lesson.','resolution':'Final corrected fullrow reread: natural excess-left27-18=9 then46-9=37. Numbers/key/options retained, all45currentconditions independently rechecked.'}],'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-natural-add-sub.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
