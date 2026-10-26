"""All38 full saved/new conditions official/new solutions and56 source/new
options read.37 archived source illustrations inspected; source26 missing image
has all prices in text.38 own diagrams inspected343px. Exact minute/cent math,
all offered pairs and dynamic-programming optimal change independently checked.
Same author separate computational checker, not another human. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-time-money';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-place-visual.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one
COINS=[1,2,5,10,20,50,100,200];NOTES=[50,100,200,500,1000,2000,5000]
def number(s):
 s=re.sub(r'\b(?:мин|цент|руб)\.?','',s);return E.calc(s)
def parse(r,i,src=False):
 parts=H.math_parts(r['statement'],src)
 def val(x):return list(map(int,re.findall(r'\d+',x)))if';'in x else number(x)
 if i==0:return[number(parts[0])]
 if i==1:return[number(parts[0])]
 if i==14 and src:
  assert'үш'in r['statement']and'төрт'in r['statement'];return[number(parts[0]),F(3),number(parts[1]),F(4)]
 if i==20 and src:
  assert'екі'in r['statement']and'үш'in r['statement']and'төрт'in r['statement'];return[number(parts[0]),F(2),number(parts[1]),F(3),number(parts[2]),F(4)]
 if i==25 and src:
  assert'үш'in r['statement']and'екі'in r['statement']and'алты'in r['statement'];return[number(parts[0]),F(3),number(parts[1]),F(2),number(parts[2]),F(6)]
 if i==21 and src:return[*map(number,parts),COINS]
 if i==29 and src:return[*map(number,parts),NOTES]
 if i==31 and src:return[[int(number(x))for x in parts[:-1]],number(parts[-1])]
 return list(map(val,parts))
def integer(v):assert F(v).denominator==1;return int(v)
def time(h,m):assert 0<=h<24 and 0<=m<60;return h*60+m
def clock(n):assert n.denominator==1;return f'{int(n)//60%24}:{int(n)%60:02d}'
def optimum(amount,denoms):
 amount=integer(amount);ds=list(map(integer,denoms));assert amount>=0 and ds and min(ds)>0;dp=[0]+[amount+1]*amount;prev=[None]*(amount+1)
 for n in range(1,amount+1):
  for d in ds:
   if d<=n and dp[n-d]+1<dp[n]:dp[n]=dp[n-d]+1;prev[n]=d
 assert prev[amount]is not None or amount==0
 out=[];n=amount
 while n:d=prev[n];out.append(d);n-=d
 assert len(out)==dp[amount]and sum(out)==amount
 return dp[amount],out

def pair(s):
 names=['кір жуғыш','плита','ыдыс жуғыш','тоңазытқыш','шаңсорғыш'];found=[j for j,x in enumerate(names)if x in s];assert len(found)==2;return sorted(found)
def representation(s,i):
 if i in[3,5,10]:
  s=s.strip('$ ')
  if':'in s:return F(C.clock_minutes(s))
  nums=list(map(int,re.findall(r'\d+',s)));assert len(nums)==2 and nums[1]<60;return F(nums[0]*60+nums[1])
 if i in[16,18,20,23,25]:
  parts=re.findall(r'(\d+)\s*(€|доллар|цент)',s.replace('$',''));assert parts or i==20
  if not parts:return number(s)*100
  return F(sum(int(n)*(1 if unit=='цент'else 100)for n,unit in parts))
 if i==29:return sorted(integer(number(x))for x in s.strip('$ ').split('+'))
 if i==32:return pair(s)
 return number(s.strip('$ '))
def fmt(out,i):
 if i in[3,5,10]:return clock(F(out))
 if i in[16,23,25]:n=integer(out);return f'{n//100} '+('€'if i==16 else'доллар')+f' {n%100} цент'
 if i==18:return str(integer(out))+' цент'
 if i==20:return str(integer(F(out)/100))
 if i==29:return' + '.join(map(str,sorted(out,reverse=True)))
 if i==32:
  mapping={(1,2):'плита мен ыдыс жуғыш',(0,1):'кір жуғыш пен плита',(0,2):'кір жуғыш пен ыдыс жуғыш',(3,4):'тоңазытқыш пен шаңсорғыш'};return mapping[tuple(out)]
 out=F(out);return str(out.numerator)if out.denominator==1 else f'({out.numerator}/{out.denominator})'

def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':json.loads(json.dumps(v,default=str))}
 if i in[0,11]:out=v[0]/4*(3 if i==11 else 1)
 elif i==1:out=v[0]*60
 elif i==2:n,d,b=v;assert n>=2;out=n*d+(n-1)*b;p['gapCount']=integer(n-1)
 elif i==3:h,m,dh,dm=v;assert dh>=0 and 0<=dm<60;out=(time(h,m)+dh*60+dm)%1440
 elif i in[4,12]:h,m,a,b=v;out=1440-time(h,m)+time(a,b);assert 0<out<1440
 elif i==5:h,m,d=v;out=time(h,m)-d;assert out>=0
 elif i==6:start,fraction=v;assert 0<=start<24 and 0<fraction<1;out=start+24*fraction;assert out<24
 elif i==7:assert all(0<f<1 for f in v);p['durationsMinutes']=[str(f*60)for f in v];out=sum(v)*60
 elif i==8:assert all(0<f<1 for f in v);out=(1-sum(v))*24*7;assert out>0;p['dailyFreeHours']=str((1-sum(v))*24)
 elif i==9:h,m,dh,dm=v;end=time(h,m)+dh*60+dm;assert end<1440;out=(1440-end)/1440;p['endMinutes']=integer(end)
 elif i==10:h,m,n,d,b=v;assert n>=2;duration=n*d+(n-1)*b;p['gapCount']=integer(n-1);p['durationMinutes']=str(duration);out=(time(h,m)+duration)%1440
 elif i==13:eur,cent=v;out=eur*100/cent
 elif i==14:a,n,b,m=v;out=a*n+b*m
 elif i==15:cost,pay=v;out=pay-cost
 elif i==16:out=sum(v[:-1])*100+v[-1]
 elif i==17:a,n,b,m,c,l=v;out=a*n+b*m+c*l
 elif i==18:n,eur,c=v;assert n>0 and 0<=c<100;out=(eur*100+c)/n
 elif i==19:price,n,extra,pay=v;out=pay-price*n-extra
 elif i==20:a,n,b,m,c,l=v;out=(a*n+b*m)*100+c*l;assert out%100==0
 elif i==21:eur,c,pay,ds=v;assert 0<=c<100;amount=pay*100-eur*100-c;out,witness=optimum(amount,ds);p['minimumChangeAmountCents']=str(amount);p['optimalCoinWitness']=witness;p['dpMinimumCount']=out
 elif i==22:oneDollar,rd,oneEuro,reuro,dollars,euros=v;assert oneDollar==oneEuro==1;out=rd*dollars-reuro*euros
 elif i==23:cost,c,pay=v;assert 0<=c<100;out=pay*100-cost*100-c
 elif i==24:total,denom=v;out=total/denom
 elif i==25:a,n,b,m,c,l=v;out=(a*n+b*m)*100+c*l
 elif i==26:out=sum(v)
 elif i==27:pay,cost=v;out=pay-cost
 elif i==28:price,budget=v;out=budget//price;p['remainder']=str(budget-out*price);assert (out+1)*price>budget
 elif i==29:
  pay,cost,ds=v;amount=pay-cost;count,witness=optimum(amount,ds);opts=B.options(r);admissible=[]
  for opt in opts:
   terms=representation(opt,i);assert sum(terms)==amount and all(x in ds for x in terms);admissible.append(terms)
  out=one(x for x in admissible if len(x)==count);p['allOptionNoteCounts']=list(map(len,admissible));p['optimalNoteWitness']=witness;p['dpMinimumCount']=count;p['amount']=str(amount)
 elif i in[30,36]:
  n,left,m,right=v
  assert m>n and left>right;out=(left-right)/(m-n);p['initialBudget']=str(n*out+left);assert n*out+left==m*out+right
 elif i==31:ds,amount=v;out,witness=optimum(amount,ds);p['optimalNoteWitness']=witness;p['dpMinimumCount']=out
 elif i==32:
  budget,*prices=v;opts=B.options(r);pairs=[pair(x)for x in opts];costs=[sum(prices[j]for j in p)for p in pairs];out=one(p for p,cost in zip(pairs,costs)if cost<=budget);p['allOfferedPairCosts']=list(map(str,costs))
 elif i==33:n,m,price,ratio=v;assert ratio>1;out=n*price+m*price/ratio
 elif i==34:a,b,total,c,d,other=v;assert a==c and d>b;cheap=(other-total)/(d-b);out=(total-b*cheap)/a;p['notebookPrice']=str(cheap);assert out>0 and cheap>0 and c*out+d*cheap==other
 elif i==35:ratio,n,m,total=v;assert ratio>1;cheap=total/(n*ratio+m);out=cheap*ratio;p['cupPrice']=str(cheap)
 elif i==37:total,a,b,n,ask=v;assert a>b and ask==a;out=(total-n*b)/(a-b);assert 0<=out<=n;p['smallNoteCount']=str(n-out);assert out*a+(n-out)*b==total
 else:raise AssertionError(i)
 if i not in[9,29,32]:assert F(out)>=0 and F(out).denominator==1,('notInteger',i,out)
 p['calculatedAnswer']=json.loads(json.dumps(out,default=str));return out,p

def solve(r,i,src=False,check_figure=True,data=None):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out)
 opts=B.options({**r,'options':r.get('options',[])})
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len({str(x)for x in vals})==4 and sum(x==out for x in vals)==1;p['allActualOptionValues']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i),data)
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+(?:\s*=\s*\d+)*',r['solution']):
   vals=[E.calc(x.replace('−','-'))for x in chain.split('=')];assert len(set(vals))==1,('printedArithmetic',i,chain)
 return p

def figure(r,i,v,data=None):
 raw=data if data is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());meta=json.loads(ids['actual-inputs'].text)
 def norm(x):return list(map(F,re.findall(r'\d+',x)))if isinstance(x,str)and';'in x else F(x)
 assert list(map(norm,meta))==v,('meta',i,meta,v)
 def txt(id):return''.join(ids[id].itertext())
 if i in[0,1,11]:
  assert norm(txt('input-0'))==v[0];count=int(v[0])if i==0 else v[0].denominator if i==1 else 4;parts=[e for id,e in ids.items()if id.startswith('part-')];assert len(parts)==count;assert len([e for e in parts if e.get('fill')=='#baa3ef'])==(1 if i==1 else count//4);assert len({(e.get('x'),e.get('y'))for e in parts})==count
 elif i in[2,10]:
  n,d,b=v if i==2 else v[2:];events=[e for id,e in ids.items()if id.startswith('event-')];gaps=[e for id,e in ids.items()if id.startswith('gap-')];assert len(events)==n and len(gaps)==n-1;assert abs(float(events[0].get('width'))/float(gaps[0].get('width'))-float(d/b))<1e-9;assert txt('title')==f'{integer(n)} бөлік · {integer(d)} мин'and txt('gaps')==f'Үзіліс: {integer(b)} мин'
  if i==10:assert txt('start')==f'Басталуы {integer(v[0])}:{integer(v[1]):02d}'
 else:
  for j,x in enumerate(v):assert norm(txt('input-'+str(j)))==x,('visible',i,j,txt('input-'+str(j)),x)
 return True

def changed(r,i):
 if i==32:
  cr=copy.deepcopy(r);cr['statement']=cr['statement'].replace('«26000»','«35000»').replace('«8000»','«5000»');out,p=compute(cr,i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген жұп: '+cr['answer'];assert out!=representation(r['answer'],i);return cr
 if i==29:
  cr=copy.deepcopy(r)
  cr['statement']=re.sub(r'«([^»]+)»',lambda m:'«'+'; '.join(str(int(x)*2)for x in m.group(1).split(';'))+'»'if';'in m.group(1)else'«'+str(int(m.group(1))*2)+'»',r['statement']);cr['options']=[' + '.join(str(int(x)*2)for x in s.split('+'))for s in r['options']];out,p=compute(cr,i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];assert representation(cr['answer'],i)!=representation(r['answer'],i);return cr
 parts=H.math_parts(r['statement'],False);priority={14:[1],17:[1],20:[1],25:[1],37:[0]}.get(i,list(range(len(parts))))
 for j in priority:
  old=parts[j]
  if';'in old:continue
  for delta in[1,2,5,10,20,30,50,60,100,200,300,500,1000]:
   cr=copy.deepcopy(r)
   if'/'in old:
    f=F(old.strip('()'));new=f'({f.numerator}/{f.denominator+delta})'
   else:
    try:new=str(int(old)+delta)
    except ValueError:continue
   cr['statement']=cr['statement'].replace('«'+old+'»','«'+new+'»',1)
   if i not in[32]:cr.pop('options',None)
   try:
    out,p=compute(cr,i)
    if out==representation(r['answer'],i):continue
    cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];solve(cr,i,check_figure=False);return cr
   except(AssertionError,ValueError,ZeroDivisionError):continue
 raise AssertionError(('noValidMutation',i))

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==38;entries=[];evidence=[];choices=0;sourceEq=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert q['solution'];opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};ids['title'if i in[2,10]else'input-0'].text='999';wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
  try:figure(bad,i,parse(r,i),wrong)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('updatedHashCorruptionAccepted',i))
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:vals=[N.exact_power_arithmetic(s)for s in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   if i==28 and len(vals)==2 and len(set(vals))!=1:
    price,budget=parse(q,i,True);assert vals[0]==budget/price and vals[1]==budget//price;rem=integer(budget-price*vals[1]);assert f'қалдық ${rem}$'in q['solution'];src['sourceRemainderEquationReadAsEuclideanDivision']={'quotient':str(vals[1]),'remainder':rem}
   else:assert len(set(vals))==1,('sourceArithmetic',i,expr)
   sourceEq+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'Own native diagrams input panels,37 source archives inspected, one unavailable has full textual prices;38 actual343px previews inspected. Native values cross-checked against condition; updated hashes cannot hide wrong visible inputs. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==56
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':38,'sourceOptionsRead':56,'rewrittenOptionsRead':56,'sourceIllustrationsInspected':37,'unavailableSourceIllustrationWithCompleteText':1,'nativeSVGs':38,'actualInputMutationsChecked':38,'updatedHashWrongVisibleInputsRejected':38,'sourceArithmeticEqualitiesChecked':sourceEq,'pythonJavaScriptHashesMatched':38,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
