"""All25 frozen/new conditions official/new solutions and12source/newMCQ choices
read. Explicit new property avoids arbitrary competing odd-one-out explanations.
All printed digits, raw fraction numerators/denominators, all options and every
printed explanation metric independently recomputed. Same author computation,
not a second human reviewer. Source open/four-choice formats preserved.
"""
import collections,copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='logic-odd';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-logic-sequences.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one
KINDS=['decreasing']*3+['increasing']*2+['even']*2+['palindrome']*3+['edge-sums']*2+['first-three-sum-last']*2+['two-halves-sum']*2+['middle-equals-rest','first-three-sum-last-two','equivalent-fractions','equivalent-fractions','last-half-multiple','first-two-product','first-three-product','digit-progression','numerator-denominator-sum']
PREFIX={
'decreasing':'Цифрлар солдан оңға қарай қатаң кемуі тиіс.', 'increasing':'Цифрлар солдан оңға қарай қатаң өсуі тиіс.', 'even':'Барлық цифрлар жұп болуы тиіс.', 'palindrome':'Сан солдан оңға және оңнан солға бірдей оқылуы тиіс.',
'edge-sums':'Төрт таңбалы санның шеткі цифрларының қосындысы ортаңғы цифрларының қосындысына тең болуы тиіс.',
'first-three-sum-last':'Алғашқы үш цифрдың қосындысы соңғы цифрға тең болуы тиіс.',
 'two-halves-sum':'Алғашқы екі және соңғы екі цифрдан құралған сандардың қосындысы берілген тұрақты санға тең болуы тиіс.',
 'middle-equals-rest':'Бес таңбалы санның ортаңғы цифры қалған төрт цифрдың қосындысына тең болуы тиіс.',
 'first-three-sum-last-two':'Алғашқы үш цифрдың қосындысы соңғы екі цифрдан құралған санға тең болуы тиіс.',
 'equivalent-fractions':'Төрт бөлшектің үшеуі өзара тең.',
 'last-half-multiple':'Соңғы екі цифрдан құралған сан алғашқы екі цифрдан құралған санның берілген еселігіне тең болуы тиіс.',
 'first-two-product':'Алғашқы екі цифрдың көбейтіндісі соңғы екі цифрдан құралған санға тең болуы тиіс.',
 'first-three-product':'Алғашқы үш цифрдың көбейтіндісі соңғы екі цифрдан құралған санға тең болуы тиіс.',
 'digit-progression':'Сан ішіндегі көрші цифрлардың айырмасы тұрақты болуы тиіс, өсуге де, кемуге де болады.',
 'numerator-denominator-sum':'Бөлшектерді қысқартпай қарастырыңыз:'}

def raw(x):return'('+str(x[0])+'/'+str(x[1])+')'if isinstance(x,tuple)else str(x)
def parse(r,i,src):
 kind=KINDS[i-1]if src else one(k for k,v in PREFIX.items()if r['statement'].startswith(v));assert kind==KINDS[i-1];body=r['statement'].rsplit('\n\n',1)[-1]
 if kind in['equivalent-fractions','numerator-denominator-sum']:
  pattern=r'\\dfrac\{(\d+)\}\{(\d+)\}'if src else r'\((\d+)/(\d+)\)';values=[tuple(map(int,v))for v in re.findall(pattern,body)];assert len(values)==4 and all(min(v)>0 for v in values)
 else:values=list(map(int,re.findall(r'\d+',body)));assert len(values)in[4,5]and len(set(map(lambda x:len(str(x)),values)))==1
 assert len(values)==len(set(values));return kind,values

def scalar_property(kind,x):
 if kind=='two-halves-sum':return F(x//100+x%100)
 if kind=='last-half-multiple':return F(x%100,x//100)
 if kind=='equivalent-fractions':return F(*x)
 if kind=='numerator-denominator-sum':return F(sum(x))
 raise AssertionError(kind)
def check(kind,n,k):
 d=list(map(int,str(n)))if isinstance(n,int)else None
 if kind=='decreasing':return all(a>b for a,b in zip(d,d[1:]))
 if kind=='increasing':return all(a<b for a,b in zip(d,d[1:]))
 if kind=='even':return all(v%2==0 for v in d)
 if kind=='palindrome':return d==d[::-1]
 if kind=='edge-sums':assert len(d)==4;return d[0]+d[3]==d[1]+d[2]
 if kind=='first-three-sum-last':assert len(d)==4;return sum(d[:3])==d[3]
 if kind=='middle-equals-rest':assert len(d)==5;return d[2]==sum(d[:2]+d[3:])
 if kind=='first-three-sum-last-two':assert len(d)==5;return sum(d[:3])==n%100
 if kind=='first-two-product':assert len(d)==4;return d[0]*d[1]==n%100
 if kind=='first-three-product':assert len(d)==5;return math.prod(d[:3])==n%100
 if kind=='digit-progression':return len(set(b-a for a,b in zip(d,d[1:])))==1
 return scalar_property(kind,n)==k

def facts(kind,x,k):
 if isinstance(x,tuple):
  a,b=x
  if kind=='equivalent-fractions':f=F(a,b);return[a,b,f.numerator,f.denominator]
  return[a,b,a,b,a+b]
 d=list(map(int,str(x)))
 if kind in['decreasing','increasing']:return[x,*d]
 if kind=='even':return[x,*[v%2 for v in d]]
 if kind=='palindrome':return[x,int(''.join(map(str,d[::-1])))]
 if kind=='edge-sums':return[x,d[0]+d[3],d[1]+d[2]]
 if kind=='two-halves-sum':return[x,x//100,x%100,x//100+x%100]
 if kind=='middle-equals-rest':return[x,d[2],sum(d)-d[2]]
 if kind=='last-half-multiple':return[x,x//100,k,x//100*k,x%100]
 if kind=='digit-progression':return[x,*[b-a for a,b in zip(d,d[1:])]]
 terms=d[:2]if kind=='first-two-product'else d[:3];value=math.prod(terms)if'product'in kind else sum(terms);last=d[3]if kind=='first-three-sum-last'else x%100;return[x,*terms,value,last]

def target(r,i,src=False):
 kind,values=parse(r,i,src);p={'actualProperty':kind,'allActualPrintedValues':list(map(raw,values))};k=None
 if kind in['two-halves-sum','last-half-multiple','equivalent-fractions','numerator-denominator-sum']:
  counter=collections.Counter(scalar_property(kind,v)for v in values);assert sorted(counter.values())==[1,len(values)-1];k=one(v for v,count in counter.items()if count==len(values)-1)
  if not src and kind!='equivalent-fractions':printed=F(one(re.findall(r'(?:Тұрақты қосынды|Еселік): (\d+)',r['statement'])));assert printed==k
  p['actualMajoritySharedValue']=str(k)
 flags=[check(kind,v,k)for v in values];index=one(j for j,v in enumerate(flags)if not v);out=values[index];allfacts=[facts(kind,v,k)for v in values];p['allActualElementPropertyResults']=flags;p['allActualExplanationFacts']=[[str(x)for x in row]for row in allfacts];p['exactOddPrintedValue']=raw(out);return out,p,(kind,values,k,flags,allfacts)

def solve(r,i,src=False):
 out,p,(kind,values,k,flags,allfacts)=target(r,i,src);wanted=F(*out)if isinstance(out,tuple)else F(out);assert E.calc(r['answer'])==wanted
 opts=B.options({**r,'options':r.get('options',[])})
 if opts:assert len(opts)==len(set(opts))==4 and r['answer']in opts and sum(E.calc(v)==wanted for v in opts)==1;p['allFourActualOptionValues']=[str(E.calc(v))for v in opts]
 if not src:
  segments=r['solution'].split('. Шартты бұзатыны ')[0].split('. ');assert len(segments)==len(values)
  for text,expected,flag in zip(segments,allfacts,flags):
   assert H.numeric_tokens(text)==list(map(F,expected)),('printedFacts',i,text,expected)
   if kind in['decreasing','increasing']:assert('шарт орындалады'in text)==flag and('шарт орындалмайды'in text)!=flag
  p['everyPrintedExplanationFactIndependentlyVerified']=True
 return p

def changed(r,i):
 cr=copy.deepcopy(r);old,p,(kind,values,k,flags,allfacts)=target(r,i);j=one(j for j,v in enumerate(flags)if not v);oldRaw=raw(values[j]);v=values[j];values[j]=(v[0]+1,v[1])if isinstance(v,tuple)else v+1;assert not check(kind,values[j],k)and len(values)==len(set(values));prefix=cr['statement'].rsplit('\n\n',1)[0];cr['statement']=prefix+'\n\n«'+'; '.join(map(raw,values))+'».';cr['answer']=raw(values[j]);assert cr['answer']!=raw(old)
 if cr.get('options'):cr['options']=[cr['answer']if v==oldRaw else v for v in cr['options']]
 _,p,(_,values,k,flags,allfacts)=target(cr,i);segments=[]
 for v,flag,row in zip(values,flags,allfacts):
  text='; '.join(map(str,row))
  if kind in['decreasing','increasing']:text+=', шарт '+('орындалады'if flag else'орындалмайды')
  segments.append(text)
 cr['solution']='. '.join(segments)+'. Шартты бұзатыны '+cr['answer']+'.';return cr

def malformed(r,i):
 cr=copy.deepcopy(r);old,p,(kind,values,k,flags,allfacts)=target(r,i);j=next(j for j,v in enumerate(flags)if v);v=values[j]
 if isinstance(v,tuple):new=(v[0]+1,v[1]);assert not check(kind,new,k)
 else:
  length=len(str(v));new=next(x for x in range(10**(length-1),10**length)if x not in values and not check(kind,x,k))
 values[j]=new;cr['statement']=cr['statement'].rsplit('\n\n',1)[0]+'\n\n«'+'; '.join(map(raw,values))+'».';return cr

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];equalities=0;choices=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and not q['svg'];choices+=len(q['options']);assert len(q['options'])==len(r.get('options',[]));key=one(v['text']for v in q['options']if v['correct'])if q['options']else one(re.findall(r'Жауабы:\s*(.*)',q['solution']))
  if q['options']:assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']},malformed(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badrowaccepted',i))
  solve(cr,i);proof['validChangedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAcceptedAndSecondExceptionRejected']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(values))==1,('sourceOfficialArithmetic',i,expr);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All25 saved/new conditions full official/new solutions all12source/newMCQ choices read. Actual digits, reversals, parity, adjacent differences, digit sums/products, two-digit groups and rational vs representation-specific fraction properties independently recomputed. Every printed new explanation fact checked. All25 changed actual odd inputs reject old keys and accept recomputed values; two-exception corrupted conditions rejected. Same author computation, not another human.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==12
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':25,'sourceOptionsRead':12,'rewrittenOptionsRead':12,'openResponseTasks':22,'allPrintedNewExplanationFactsVerified':25,'validChangedActualInputsRecomputed':25,'twoExceptionCorruptedConditionsRejected':25,'officialSourceArithmeticEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':25,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
