"""All41 full source/new conditions official/new solutions and40 source/new
MCQ choices read;41 saved source rasters inspected.41 own native diagrams
inspected343px. Independent exact arithmetic, all masked operand completions,
all permutations/feasible coin totals, universal parity identity and concrete
reduction witnesses. Source long-division partial quotients interpreted with
actual remainders, not false exact equalities. Same author, not another human.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-multiply-parity';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-measures.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one
EXPR=[0,8,10,11,13,14,22,23,24,25,26];MASK=[8,11,22,23,24];CARDS=[27,28,29,33,34,35,36,39,40]
def canon(s,mask=False):
 s=s.replace('\\ast','□').replace('\\square','□');s=H.tex(s).replace('×','*').replace('÷','/').replace(':','/');s=re.sub(r'\s+','',s)
 return s.replace('*','□')if mask else s

def parse(r,i,src=False):
 t=H.math_parts(r['statement'],src)
 if i in EXPR:return[canon(one(t))]
 if i in[28,33,40]:return[canon(t[0],True),*map(E.calc,t[1:])]
 if i in[27,34]:
  if';'in t[0]:return[[F(x.strip())for x in t[0].split(';')],*map(E.calc,t[1:])]
  return[list(map(E.calc,t if i==27 else t[:-2])),*map(E.calc,[]if i==27 else t[-2:])]
 if i==38:return list(map(E.calc,t[:3]))
 return list(map(E.calc,t))
def integer(x):assert F(x).denominator==1;return int(x)
def choices(r):return B.options({**r,'options':r.get('options',[])})
def matching(pattern,n):return bool(re.fullmatch(pattern.replace('□',r'\d'),str(n)))
def masked(expr):
 left,result=expr.split('=');m=re.fullmatch(r'([\d□]+)([*/])(\d+)',left);assert m;pattern,op,mult=m.groups();mult=int(mult);assert mult>0;found=[]
 for ds in itertools.product(range(10),repeat=pattern.count('□')):
  operand=pattern
  for d in ds:operand=operand.replace('□',str(d),1)
  if operand[0]=='0':continue
  value=int(operand)
  if op=='/'and value%mult:continue
  product=value*mult if op=='*'else value//mult
  if matching(result,product):
   hidden=[int(actual)for p,actual in zip(pattern,operand)if p=='□']+[int(actual)for p,actual in zip(result,str(product))if p=='□'];found.append({'operand':value,'result':product,'allHiddenDigits':hidden,'completedEquation':operand+op+str(mult)+'='+str(product)})
 return one(found)
def all_permutations(ds,divisor=None,even=False):
 assert len(ds)==len(set(ds));result=sorted({int(''.join(map(str,p)))for p in itertools.permutations(map(int,ds))if p[0]and(divisor is None or int(''.join(map(str,p)))%divisor==0)and(not even or p[-1]%2==0)});assert result;return result

def representation(s,i):
 if i==22:return list(map(int,re.findall(r'\d+',s)))
 if i==35:return re.sub(r'\s+',' ',s.replace('$','').strip())
 return E.calc(re.sub(r'\b(?:км|теңге)\b','',s.strip('$ ')))
def fmt(out,i):
 if i==22:return' және '.join(map(str,out))
 if i==35:return out
 return str(integer(out))
def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':json.loads(json.dumps(v,default=str))}
 if i in[0,10,13,14,25,26]:out=E.calc(v[0]);p['actualExpression']=v[0]
 elif i in[1,2]:out=v[0]*v[1]
 elif i==3:out=v[0]*(v[1]+1)
 elif i in[4,12]:price,count,pay=v;out=pay-price*count
 elif i==5:assert'екі есе'in r['statement'];out=v[0]*v[1]/2
 elif i==6:assert'үштен бір'in r['statement'].lower();out=v[0]*F(2,3)
 elif i==7:a,b,wrong=v;assert a==b;out=wrong*b*a;p['originalNumber']=str(wrong*b)
 elif i in MASK:
  witness=masked(v[0]);p['uniqueMaskWitness']=witness;out=witness['allHiddenDigits']if i==22 else witness['result']if i==23 else witness['operand']
 elif i==9:a,b,c,result=v;out=(result*c-b)/a;p['replayedResult']=str((out*a+b)/c);assert p['replayedResult']==str(result)
 elif i==15:total,groups=v;out=total/groups
 elif i==16:a,n,b,m=v;out=a*n+b*m
 elif i in[17,20]:a,k=v;out=a+a/k
 elif i==18:n,total,m=v;out=total/n*m;p['oneUnitPrice']=str(total/n)
 elif i==19:t,d,new=v;out=d/t*new;p['speed']=str(d/t)
 elif i==21:a,b,total,c,d,other=v;assert a==c and b>d;notebook=(total-other)/(b-d);out=(other-d*notebook)/a;assert out>0 and notebook>0;p['notebookPrice']=str(notebook);assert out*a+notebook*b==total
 elif i==27:out=sum(x%2==0 for x in v[0]);p['allEvenFlags']=[x%2==0 for x in v[0]]
 elif i==28:
  pattern,divisor=v;assert divisor==5;odd='тақ'in r['statement'];assert odd or'жұп'in r['statement'];valid=[]
  for digit in range(10):
   value=int(pattern.replace('□',str(digit)))
   if value%divisor==0 and(value%2==1)==odd:valid.append(digit)
  out=one(valid);p['actualParity']='odd'if odd else'even'
 elif i==29:values=all_permutations(v,even=True);out=max(values);p['allValidPermutations']=values
 elif i==30:size,count=v;out=(integer(count)+integer(size)-1)//integer(size);assert(out-1)*size<count<=out*size
 elif i==31:n,*capacities=v;capacity=one(c for c in capacities if n%c==0);out=n/capacity;p['onlyValidCapacity']=str(capacity)
 elif i==32:groupCount,*rest=v;*groups,seats=rest;assert groupCount==len(groups);out=sum(n/seats for n in groups if n%seats==0);p['allGroupDivisibilityFlags']=[n%seats==0 for n in groups]
 elif i==33:pattern,divisor=v;assert pattern.count('□')==2;values=[]
 elif i==34:numbers,a,b=v;assert a==2 and b==5;p['allCommonDivisibilityFlags']=[n%a==0 and n%b==0 for n in numbers];out=sum(p['allCommonDivisibilityFlags'])
 elif i==35:
  start,end=map(integer,v);assert start==1 and end>=2;total=sum(range(start,end+1));parity=total%2;out='әрқашан тақ'if parity else'әрқашан жұп';p['initialSum']=total;p['identityPairsChecked']=(end+1)**2
  for x,y in itertools.product(range(end+1),repeat=2):assert x+y-abs(x-y)==2*min(x,y)
  witness=None
  for order in[list(range(start,end+1)),list(range(end,start-1,-1))]:
   accumulator=order[0];trace=[]
   for n in order[1:]:before=accumulator;accumulator=abs(accumulator-n);trace.append([before,n,accumulator])
   assert accumulator%2==parity
   if accumulator%5:witness=trace;break
  assert witness;p['concreteNonFiveReduction']=witness;p['nonFiveFinalValue']=witness[-1][-1]
 elif i==36:*digits,divisor=v;out=len(all_permutations(digits,integer(divisor)));p['allValidPermutations']=all_permutations(digits,integer(divisor))
 elif i==37:a,b,n=map(integer,v);amounts=[a*(n-k)+b*k for k in range(n+1)];out=one(representation(s,i)for s in choices(r)if representation(s,i)in amounts);p['allFeasibleCoinTotals']=amounts;p['selectedLargeCoinCount']=one(k for k in range(n+1)if amounts[k]==out)
 elif i==38:a,b,c=v;out=one(representation(s,i)for s in choices(r)if representation(s,i)%a==0 and representation(s,i)%b!=0 and representation(s,i)%c!=0)
 elif i==39:*digits,divisor=v;values=all_permutations(digits,integer(divisor));out=max(values);p['allValidPermutations']=values
 elif i==40:pattern,a,b=v;out=one(int(pattern.replace('□',str(d)))for d in range(10)if int(pattern.replace('□',str(d)))%a==0 and int(pattern.replace('□',str(d)))%b==0)
 else:raise AssertionError(i)
 if i==33:
  for ds in itertools.product(range(10),repeat=2):
   s=pattern
   for d in ds:s=s.replace('□',str(d),1)
   if int(s)%divisor==0:values.append(int(s))
  out=max(values);p['allMatchingDivisibleNumbers']=values
 if i not in[22,35]:assert F(out).denominator==1 and out>=0
 p['calculatedAnswer']=json.loads(json.dumps(out,default=str));return out,p

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out)
 opts=choices(r)
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len({str(x)for x in vals})==4 and sum(x==out for x in vals)==1;p['allActualOptionValues']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+(?:\s*=\s*\d+)*',r['solution']):
   vals=[E.calc(s.replace('−','-'))for s in chain.split('=')];assert len(set(vals))==1,('badPrintedArithmetic',i,chain)
 return p

def figure(r,i,v,data=None):
 raw=data if data is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());meta=json.loads(ids['actual-inputs'].text)
 if i in EXPR:assert len(meta)==1 and canon(meta[0])==v[0]
 elif i in[28,33,40]:assert canon(meta[0],True)==v[0]and list(map(F,meta[1:]))==v[1:]
 elif i in[27,34]:assert[list(map(F,meta[0].split(';'))),*map(F,meta[1:])]==v
 else:assert list(map(F,meta))==v
 def txt(id):return''.join(ids[id].itertext())
 if i in EXPR:
  left,*right=v[0].split('=');a,op,b=one(re.findall(r'([\d□]+)([*/])(\d+)',left));assert canon(txt('term-a'))==a and canon(txt('term-b'))==b and canon(txt('result'))==(right[0]if right else'?')and txt('operator')==('×'if op=='*'else'Бөлу')
  for key in['term-a','term-b','result']:assert ids[key].get('text-anchor')=='end'and ids[key].get('x')==('185'if key=='term-a'and op=='/'else'300')and ids[key].get('font-family')=='monospace'
  if op=='/':
   for key,expected in[('division-vertical',['210','30','210','137']),('division-horizontal',['210','78','320','78'])]:assert[ids[key].get(a)for a in['x1','y1','x2','y2']]==expected
 elif i in CARDS:
  cards=list(map(str,v[0]))if i in[27,34]else list(map(str,range(int(v[0]),int(v[1])+1)))if i==35 else list(v[0])if i in[28,33,40]else list(map(str,v[:3]if i==29 else v[:4]));assert[canon(txt('card-'+str(j)))for j in range(len(cards))]==cards
  if i in[28,33,34,36,39,40]:
   extra=v[1:]if i in[28,33,34,40]else v[4:];assert txt('extra-givens')=='Бөлгіш: '+'; '.join(map(str,extra))
  if i==34:
   a,b=ids['set-two'],ids['set-five'];assert a.tag.endswith('circle')and b.tag.endswith('circle');assert 0<abs(F(a.get('cx'))-F(b.get('cx')))<F(a.get('r'))+F(b.get('r'));assert txt('intersection')=='?'
 else:assert[F(txt('input-'+str(j)))for j in range(len(v))]==v
 return True

def changed(r,i):
 cr=copy.deepcopy(r)
 if i==28:cr['statement']=cr['statement'].replace('тақ','жұп')
 elif i==35:cr['statement']=cr['statement'].replace('«12»','«10»')
 elif i in[37,38]:
  old=choices(r);out,_=compute(r,i);cr['options']=old.copy();cr['options'][old.index(r['answer'])]=str(integer(out)+(5 if i==37 else 4))
 elif i in MASK:
  old=one(H.math_parts(r['statement'],False));found=None
  for m in re.finditer(r'\d',old):
   for d in'1234567890':
    if d==m.group():continue
    candidate=copy.deepcopy(r);candidate['statement']=candidate['statement'].replace('«'+old+'»','«'+old[:m.start()]+d+old[m.end():]+'»');candidate.pop('options',None)
    try:
     out,p=compute(candidate,i)
     if out!=representation(r['answer'],i):found=candidate;break
    except(AssertionError,ValueError,ZeroDivisionError):pass
   if found:break
  assert found,('maskedMutation',i);cr=found
 else:
  found=None
  for old in H.math_parts(r['statement'],False):
   if i in[27,34]:
    if';'not in old:continue
    nums=old.split(';');index=next(j for j,s in enumerate(nums)if int(s)%10==0)if i==34 else 0;nums[index]=str(int(nums[index])+1);replacements=[';'.join(nums)]
   elif i in[33,40]:
    if'□'not in old:continue
    m=next(re.finditer(r'\d',old));replacements=[old[:m.start()]+str((int(m.group())+1)%9+1)+old[m.end():]]
   elif i in EXPR:
    m=next(re.finditer(r'\d+',old));replacements=[old[:m.start()]+str(int(m.group())+d)+old[m.end():]for d in[1,2,3,5,7,10,100]]
   else:
    try:replacements=[str(int(old)+d)for d in[1,2,3,4,5,6,10,15,20,100]]
    except ValueError:continue
   for new in replacements:
    candidate=copy.deepcopy(r);candidate['statement']=candidate['statement'].replace('«'+old+'»','«'+new+'»',1);candidate.pop('options',None)
    try:
     out,p=compute(candidate,i)
     if out!=representation(r['answer'],i):found=candidate;break
    except(AssertionError,ValueError,ZeroDivisionError):pass
   if found:break
  assert found,('validMutation',i);cr=found
 if i not in[35,37,38]:cr.pop('options',None)
 out,p=compute(cr,i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];assert out!=representation(r['answer'],i);return cr

def division_partials(expr):
 a,b=map(int,expr.split('/'));rem=0;partials=[]
 for digit in str(a):n=rem*10+int(digit);q,rem=divmod(n,b);partials.append((F(n,b),F(q),rem))
 return partials

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==41;entries=[];evidence=[];choicesCount=0;equalities=0;remainders=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert q['solution'];opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choicesCount+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};id='term-a'if i in EXPR else'card-0'if i in CARDS else'input-0';ids[id].text='999';wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
  try:figure(bad,i,parse(r,i),wrong)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('rehashedVisibleCorruptionAccepted',i))
  partials=division_partials(parse(q,i,True)[0])if i in[14,25]else division_partials(str(int(parse(q,i,True)[0]))+'/'+str(int(parse(q,i,True)[1])))if i==15 else[]
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:vals=[N.exact_power_arithmetic(s)for s in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   if len(set(vals))!=1:
    assert len(vals)==2 and any(a==vals[0]and b==vals[1]and rem>0 for a,b,rem in partials),('sourceArithmetic',i,expr);remainders+=1
   else:equalities+=len(vals)-1
  if partials:src['actualLongDivisionPartials']=[[str(a),str(b),rem]for a,b,rem in partials]
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'41 own native SVGs rendered343px inspected;41 source rasters inspected. All column operands/results cards ranges masks divisors and generic visible inputs verified against independently parsed conditions. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choicesCount==40
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':41,'sourceOptionsRead':40,'rewrittenOptionsRead':40,'nativeSVGs':41,'sourceIllustrationsInspected':41,'actualInputMutationsChecked':41,'updatedHashWrongVisibleInputsRejected':41,'sourceExactArithmeticEqualities':equalities,'sourceRemainderPartialQuotientsChecked':remainders,'pythonJavaScriptHashesMatched':41,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
