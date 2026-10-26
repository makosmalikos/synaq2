"""External28 full saved/new arithmetic/roles/long-division review.
No author specs/models/params/solver used. Actual printed givens and options are
read using exact Fraction AST; separate streamed digit division and exhaustive
1000-number prefix domains, plus formal nonzero scaling/counterexamples.
"""
import ast,copy,hashlib,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-natural-mul-div-basic.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def clean(s):return str(s).replace('$','').replace('\\,','').replace('\\cdot','×').replace('\\times','×').replace('−','-').replace('\\square','□')
def ns(s):return list(map(int,re.findall(r'\d+',clean(s))))
def calc(s,env=None):
 s=clean(s).replace('×','*').replace(':','/').replace('÷','/');s=re.sub(r'(\d|\))\s*([a-z(])',r'\1*\2',s)
 tree=ast.parse(s.strip(),mode='eval');env=env or {}
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):assert isinstance(t.value,int);return F(t.value)
  if isinstance(t,ast.Name):return F(env[t.id])
  if isinstance(t,ast.UnaryOp):return -ev(t.operand) if isinstance(t.op,ast.USub) else ev(t.operand)
  assert isinstance(t,ast.BinOp);a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return a+b
  if isinstance(t.op,ast.Sub):return a-b
  if isinstance(t.op,ast.Mult):return a*b
  assert isinstance(t.op,ast.Div) and b;return a/b
 return ev(tree)
def opts(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def select(r,p):
 a=one([o for o in opts(r) if p(o)]);assert clean(r['answer'])==a,(r['answer'],a);return a
def numeric(r,n):
 assert calc(r['answer'])==n,(r['answer'],n)
 if opts(r):assert sum(calc(o)==n for o in opts(r))==1
 return str(n)
def equation_true(o,env=None):
 a,b=o.split('=');return calc(a,env)==calc(b,env)
def division_trace(n,d):
 digits=list(map(int,str(n)));q,r=0,0;trace=[];started=False
 for digit in digits:
  current=r*10+digit
  if not started and current<d:r=current;continue
  started=True;qd,r=divmod(current,d);q=q*10+qd;trace.append((current,d,qd,d*qd,r))
 assert q*d+r==n and 0<=r<d
 return q,r,trace
def solve(r,i,source=False):
 s=clean(r['statement']);numbers=ns(s);os=opts(r)
 if i==0:
  a,d,q,target=numbers;assert F(a,d)==q and d==target
  return select(r,lambda o:o.casefold()=='бөлгіш')
 if i in (1,15):
  lead,d=(3,6) if source and i==1 else (8,45) if source else (numbers[0],numbers[2]);lo=lead*1000;hi=(lead+1)*1000-1
  domain=[n//d for n in range(lo,hi+1) if n%d==0];assert domain and len({len(str(q)) for q in domain})==1
  length=len(str(domain[0]));assert lead<d and all(lead*10+digit>=d for digit in range(10))
  words={1:'бір',2:'екі',3:'үш',4:'төрт'}
  return select(r,lambda o:(str(length)+' цифр'==o) or (words[length]+' таңбалы'==o))
 if i==2:
  expression=one(re.findall(r'([az](?: \+ [az])+)',s));letter=expression[0];count=len(expression.split('+'));assert count== (5 if source else 6)
  # Correct option is a literal product with coefficient equal to exact summand
  # count. Every other symbolic candidate fails already at positive value2.
  good=select(r,lambda o:o.replace(' ','')==letter+'×'+str(count))
  assert calc(good,{letter:2})==count*2
  for o in os:
   if o!=good:assert calc(o,{letter:2})!=count*2
  return good
 if i==3:return numeric(r,F(numbers[0],numbers[1]))
 if i==4:return numeric(r,calc(one(re.findall(r'\d+ × \d+',s))))
 if i==5:
  d=numbers[1];assert numbers==[0,d,d,0] and d>0 and F(0,d)==0
  assert all(q*0!=d for q in range(-100,101))
  return select(r,lambda o:('анықталмаған' in o or 'ал' in o and 'мағынасы жоқ' in o) and '0 : '+str(d)+' = 0' in o)
 if i==6:
  a,d,q=numbers[:3];assert F(a,d)==q
  return select(r,lambda o:o.replace(' ','')==f'{q}×{d}')
 if i==7:return numeric(r,F(numbers[1],numbers[0]))
 if i==8:return numeric(r,numbers[0]*numbers[1])
 if i==9:return numeric(r,calc(one(re.findall(r'\d+ : \d+',s))))
 if i==10:
  a,d,q=numbers[:3];assert F(a,d)==q
  return select(r,lambda o:calc(o)==q)
 if i==11:
  assert ('натурал' in s and (source or 'ОҢ' in s and '≠ 0' in s));assert all(F(n,n)==1 for n in range(1,1001))
  return select(r,lambda o:o=='1')
 if i==12:return numeric(r,calc(one(re.findall(r'\d+ × \d+',s))))
 if i==13:return select(r,lambda o:calc(o)==numbers[0])
 if i==14:return numeric(r,calc(one(re.findall(r'\d+ : \d+',s))))
 if i==16:
  ratio=int(one(re.findall(r'a : b = (\d+)',s)));factor=int(one(re.findall(r'a × (\d+)',s)))
  assert factor>0
  assert all(F(ratio*b*factor,b*factor)==ratio for b in range(1,1001))
  return numeric(r,ratio)
 if i==17:return numeric(r,numbers[0]*numbers[1])
 if i==18:
  a,root=map(int,one(re.findall(r'(\d+) × \(x - (\d+)\) = 0',s)));assert a>0
  return select(r,lambda o:calc(o)>=root and a*(calc(o)-root)==0)
 if i==19:return numeric(r,numbers[0]*numbers[1])
 if i==20:
  d,total,newfactor=numbers;assert total%d==0;return numeric(r,F(total,d)*newfactor)
 if i==21:
  total,quotient=numbers[:2];return select(r,lambda o:calc(o)!=0 and F(total)/calc(o)==quotient)
 if i==22:return select(r,lambda o:not equation_true(o))
 if i==23:return numeric(r,calc(re.findall(r'\d+ : \d+',s)[-1]))
 if i==24:
  factor=numbers[0];assert factor>1
  return select(r,lambda o:ns(o)==[factor] and 'есе артады' in o)
 if i==25:
  target=calc(one(re.findall(r'\d+ : \d+',s)));return select(r,lambda o:calc(o)!=target)
 if i==26:
  total,perbox,boxperbasket=numbers;assert total%(perbox*boxperbasket)==0
  return numeric(r,F(total,perbox*boxperbasket))
 if i==27:
  rates=numbers[:2];total=numbers[2];assert min(rates)>0
  return numeric(r,F(total,sum(rates)))
 raise AssertionError(i)
def hashrow(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==28;entries=[];refs=[];claims=0;partialsteps=0;streamcases=0
 normalized=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip()
 for i,row in enumerate(rows):
  try:solve(row,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and not raw.get('images') and not raw.get('svg')
  try:solve({**raw,'answer':raw['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if raw['options']:assert one([clean(o['text']) for o in raw['options'] if o['correct']])==clean(raw['sourceAnswer'])
  assert normalized(row['statement'])!=normalized(raw['statement']),'Original normalized wording '+str(i)
  assert row['minimumPlan']=='pro'
  bad=copy.deepcopy(row);bad['answer']='WRONG_KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):pass
  else:raise AssertionError(('badkey accepted',i))
  # Bind complete actual printed streamed division steps, including zero quotient
  # places, not merely its final inverse product.
  printed=[tuple(map(int,m)) for m in re.findall(r'(\d+) ішінде (\d+) саны (\d+) рет:\s*(\d+) × (\d+) = (\d+), қалдық (\d+) - (\d+) = (\d+)',clean(row['solution']))]
  cases={3:(840,24),7:(2349,29),9:(540,9),14:(3255,21),20:(3570,42),21:(2268,54)}
  if i in cases:
   quotient,remainder,trace=division_trace(*cases[i]);assert remainder==0 and len(printed)==len(trace)
   for actual,expected in zip(printed,trace):
    current,d,q,product,r=expected;assert actual==(current,d,q,d,q,product,current,product,r),(i,actual,expected)
   partialsteps+=len(trace)
  else:assert not printed,(i,printed)
  if i in (1,15):
   lead,d= (4,7) if i==1 else (7,35)
   assert f'{lead} < {d}' in row['solution'] and 'толымсыз' in row['solution'] and 'жүздік' in row['solution']
   for n in range(lead*1000,(lead+1)*1000):
    q,r,trace=division_trace(n,d);assert q==n//d and r==n%d and len(str(q))==3 and trace[0][0]==int(str(n)[:2]);streamcases+=1
  if i==19:assert '125 × 8 = 1000' in row['solution'] and '56 = 8 × 7' in row['solution'] and '1000 × 7 = 7000' in row['solution']
  # Every printed all-numeric single equality (including partial products) is
  # recomputed by a separate exact AST, independent of author proof generation.
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+×:-]\s*-?\d+)*)\s*=\s*(-?\d+(?:\s*[+×:-]\s*-?\d+)*)',clean(row['solution'])):
   a,b=m.groups()
   if not re.search(r'[+×:-]',a):continue
   # These are all asserted numeric calculations, no deliberately false numeric
   # equality is used inside the explanation; the wrong equality is corrected.
   assert calc(a)==calc(b),(i,a,b);claims+=1
  entries.append({'editionId':row['editionId'],'sha256':hashrow(row),'verdict':'verified','method':'independent_full_saved_new_official_authored_solutions_every_MCQ_read_printed_Fraction_AST_streamed_digit_division_full_prefix_domains_nonzero_scaling_inverse_role_oracle','notes':[]});refs.append(ref)
 canaries=0
 for i,row in enumerate(rows):
  c=copy.deepcopy(row)
  if i in (0,2,11,22):
   if i==0:c['options']=['Бөлінгіш' if x=='Бөлгіш' else x for x in c['options']]
   elif i==2:c['statement']=c['statement'].replace('z + z + z + z + z + z','z + z + z + z + z + z + z')
   elif i==11:c['options']=['2' if x=='1' else x for x in c['options']]
   else:c['options'][0]='0 × 468 = 0'
  elif i in (1,15):
   old,new=('7 санына','3 санына') if i==1 else ('35 санына','5 санына');assert old in c['statement'];c['statement']=c['statement'].replace(old,new)
  elif i==23:c['statement']=c['statement'].replace('6250 : 25','6251 : 25')
  elif i==18:c['statement']=c['statement'].replace('x − 12','x − 13')
  else:
   m=re.search(r'\d+',c['statement']);assert m;c['statement']=c['statement'][:m.start()]+str(int(m.group())+1)+c['statement'][m.end():]
  try:solve(c,i)
  except (AssertionError,ValueError,SyntaxError,KeyError):canaries+=1
  else:raise AssertionError(('Printed canary accepted',i))
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All28 saved/new complete conditions, FULL official/authored solutions and everyMCQ read. Own actualprinted exactFraction AST/streameddivision and full1000number prefix domains, symbolic repetition versuspower, formal nonzero self/scaling roles, inverse unknowns, context targets; no author params/models/solver imported.','summary':{'verified':28,'findingsResolved':3,'wrongKeysRejected':28,'printedGivenOrRoleCanariesRejected':canaries,'printedNumericEqualities':claims,'actualPrintedLongDivisionPartialSteps':partialsteps,'fullPrefixNumberDomains':streamcases,'pythonJavaScriptHashesMatched':28},'resolvedFindings':[{'sourceIds':['21a7b1d02efab09e','9d34a5a267e12bb2'],'resolution':'First sufficient partial-dividend/hundreds skill restored before independent endpoint-domain check.'},{'sourceId':'a5c3c6fe44dc2ada','resolution':'Original efficient125×8=1000 grouping retained with new56=8×7; complete finalsolution reread.'},{'sourceId':'39f33719f3116103','resolution':'Prompt rewritten beyond case-only originalduplicate; all28 normalizedstatements differ from sources.'}],'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-natural-mul-div-basic.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
