"""40 complete saved/new conditions official/new solutions and48 source/new
MCQ choices read.39 source rasters inspected; source2 absent has full expression
in text.40 own native column sums route table counting scale and input panels
inspected343px. Exact units, exhaustive hidden digits/alphametic assignments,
all carries, all train alternatives and all distinct subsets checked separately.
Same author computational checker, not another human reviewer. No browser QA.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys,xml.etree.ElementTree as ET
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='course4-arithmetic-mass';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-course4-time-money.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;one=C.one

def canon(s):return re.sub(r'\s+','',H.tex(s).replace('\\square','□').replace('−','-'))
def num(s):return E.calc(s)
def ints(v):assert all(F(x).denominator==1 for x in v);return list(map(int,v))
def parse(r,i,src=False):
 t=H.math_parts(r['statement'],src)
 if i==9:
  if src:
   s=one(re.findall(r'АБВГ\s*\+\s*АБВГ\s*=\s*ВГДБГ',r['statement']));s=s.translate(str.maketrans('АБВГД','ABCDE'))
  else:s=one(t)
  return[canon(s)]
 if i in[2,3,12,15,20,21,22,26]:return[canon(one(t))]
 return list(map(num,t))

def hidden(s):
 count=s.count('□');assert 0<count<=3;valid=[]
 for ds in itertools.product(range(10),repeat=count):
  expr=s
  for d in ds:expr=expr.replace('□',str(d),1)
  left,right=expr.split('=')
  if any(len(n)>1 and n.startswith('0')for n in re.findall(r'\d+',expr)):continue
  if E.calc(left)==E.calc(right):valid.append((ds,expr))
 assert len(valid)==1,('hiddenUniqueness',s,len(valid));return valid[0]
def alphametic(s):
 left,right=s.split('=');terms=left.split('+');assert len(set(terms))==1 and len(terms[0])==4 and len(right)==5;letters=sorted(set(s)-set('+='));assert len(letters)==5;found=[]
 for ds in itertools.permutations(range(10),len(letters)):
  d=dict(zip(letters,ds))
  if d[terms[0][0]]==0 or d[right[0]]==0:continue
  def value(t):return int(''.join(str(d[c])for c in t))
  if sum(map(value,terms))==value(right):found.append((d,value(right),value(terms[0])))
 assert len(found)==1,('alphameticUniqueness',s,len(found));return one(found)

def count_carries(a,b):
 carry=0;events=[]
 for position,(x,y)in enumerate(itertools.zip_longest(reversed(str(a)),reversed(str(b)),fillvalue='0')):
  total=int(x)+int(y)+carry;events.append({'position':position,'digitA':int(x),'digitB':int(y),'incoming':carry,'total':total,'outgoing':total//10});carry=total//10
 return sum(x['outgoing']>0 for x in events),events

def units(s,kind):
 maps={'length':{'км':1000,'м':1},'mass':{'т':1000,'ц':100,'кг':1},'grams':{'кг':1000,'г':1},'milligrams':{'г':1000,'мг':1}};mapping=maps[kind];regex='|'.join(sorted(mapping,key=len,reverse=True));matches=re.findall(r'(\d+)\s*('+regex+r')\b',s.replace('$','').replace('\\,',''));assert matches,('units',s,kind);return F(sum(int(n)*mapping[u]for n,u in matches))
def representation(s,i):
 if i==17:return units(s,'length')
 if i==20:return ints(H.numeric_tokens(s))
 if i==25:return s
 if i in[28,37]:return units(s,'milligrams')
 if i==33:return units(s,'mass')
 if i==36:return units(s,'grams')
 return E.calc(re.sub(r'\b(?:кг|г|км)\b','',s.strip('$ ')))
def fmt(out,i):
 if i==17:n=int(out);return f'{n//1000} км {n%1000} м'
 if i==20:return' және '.join(map(str,out))
 if i==25:return out
 if i in[28,37]:n=int(out);return f'{n//1000} г {n%1000} мг'
 if i==33:n=int(out);return f'{n//100} ц {n%100} кг'
 if i==36:n=int(out);return f'{n//1000} кг {n%1000} г'
 return str(int(out))

def compute(r,i,src=False):
 v=parse(r,i,src);p={'actualPrintedInputs':list(map(str,v))}
 if i==0:out=sum(v)*10000
 elif i==1:out=sum(v)
 elif i in[2,3,12,15]:out=E.calc(v[0])
 elif i==4:assert v[1]-v[0]==v[2]-v[1]and v[1]>v[0];out=v[2]+v[2]-v[1]
 elif i==5:out=v[-1]-v[1]if src else v[1]-v[0]
 elif i in[6,14]:out=v[0]-v[1]
 elif i in[7,17,24]:out=v[0]-v[1]-v[2]
 elif i==8:total,ab,bc=v;out=ab+bc-total;assert min(total-ab,total-bc,out)>0;p['threePopulationWitness']=[str(total-bc),str(out),str(total-ab)]
 elif i==9:d,out,addend=alphametic(v[0]);p['uniqueDigitAssignment']=d;p['repeatedAddend']=addend
 elif i==10:minus,plus,result=v;out=result+minus-plus
 elif i==11:out=2*v[0]+v[1]
 elif i==13:a,b,c,d=v;out=a*1000+b-c*1000-d;assert 0<=b<1000 and 0<=d<1000
 elif i==16:
  assert 'екі ересек'in r['statement'].lower()and'бір бала'in r['statement'].lower();assert len(v)==16;rows=[v[j:j+4]for j in range(0,16,4)];assert all(0<=m<60 and h>0 and a>0 and c>0 for h,m,a,c in rows);times=[h*60+m for h,m,_,_ in rows];costs=[a*2+c for _,_,a,c in rows];fast=min(times);out=min(c for t,c in zip(times,costs)if t==fast);p['allTrainMinutes']=list(map(str,times));p['allFamilyCosts']=list(map(str,costs));p['selectedFastestCheapestRoute']=one(j+1 for j,(t,c)in enumerate(zip(times,costs))if t==fast and c==out)
 elif i==18:out=v[0]*1000-v[1]-v[2]
 elif i==19:out=v[0]*2+v[1]
 elif i in[20,21,26]:
  ds,expr=hidden(v[0]);p['uniqueHiddenDigits']=list(ds);p['completedActualEquation']=expr
  out=list(ds)if i==20 else E.calc(expr.split('-')[0])if i==21 else sum(ds)
 elif i==22:
  terms=v[0].split('+');assert len(terms)==2;a,b=map(int,terms);out,events=count_carries(a,b);p['allCarryEvents']=events;p['fullSum']=a+b
 elif i==23:large,small,left=v;assert 0<=left<=large+small;out=max(F(0),left-small);p['allFeasibleDepartedPairs']=[[a,int(left)-a]for a in range(int(large)+1)if 0<=left-a<=small];assert min(x[0]for x in p['allFeasibleDepartedPairs'])==out
 elif i==25:
  red,blue,left=ints(v);assert 0<=left<=red+blue;pairs=[[a,left-a]for a in range(red+1)if 0<=left-a<=blue];assert pairs;flags=[all(b>=1 for a,b in pairs),all(a>=2 for a,b in pairs),all(a>=1 for a,b in pairs),all(blue-b>=1 for a,b in pairs)];opts=B.options(r);assert len(opts)==4 and 'көк'in opts[0]and'екі қызыл'in opts[1]and'бір қызыл'in opts[2]and'қалды'in opts[3];out=one(s for s,flag in zip(opts,flags)if flag);p['allFeasibleDepartedPairs']=pairs;p['allFourUniversalStatementTruthValues']=flags
 elif i==27:out=v[0]*1000+(v[1]if src else -v[1])
 elif i==28:out=v[0]*v[1]
 elif i==29:a,b,c,d=v;out=(a+c)*100+b+d;assert 0<=b<100 and 0<=d<100
 elif i==30:kg,g,other=v;out=kg*1000+g-other
 elif i==31:c,kg,days=v;out=(c*100+kg)*days;assert 0<=kg<100
 elif i==32:t,c,kg=v;out=t*1000-c*100-kg
 elif i==33:oneBag,bags,extra=v;out=oneBag*bags+extra
 elif i==34:full,kg,g=v;out=2*(kg*1000+g)-full*1000;assert 0<out<full*1000
 elif i==35:a,b,diff=v;assert a>b and diff>0;out=b*diff/(a-b);p['pearMass']=str(out+diff);assert a*out==b*(out+diff)
 elif i==36:out=v[0]*2*1000
 elif i==37:out=v[0]*v[1]*v[2]
 elif i==38:
  subsets=[(mask,sum(v[j]for j in range(len(v))if mask>>j&1))for mask in range(1,2**len(v))];masses=sorted({n for mask,n in subsets});out=len(masses);p['allNonemptySubsetSums']=[[mask,str(n)]for mask,n in subsets];p['distinctPositiveMasses']=list(map(str,masses))
 elif i==39:t,c,a,b=v;out=t*1000+c*100-a-b
 else:raise AssertionError(i)
 if i not in[20,25]:assert F(out).denominator==1 and out>=0
 p['calculatedAnswer']=json.loads(json.dumps(out,default=str));return out,p

def solve(r,i,src=False,check_figure=True):
 out,p=compute(r,i,src);assert representation(r['answer'],i)==out,('answer',i,r['answer'],out)
 opts=B.options({**r,'options':r.get('options',[])})
 if opts:
  vals=[representation(s,i)for s in opts];assert len(vals)==4 and len({str(x)for x in vals})==4 and sum(x==out for x in vals)==1;p['allActualOptionValues']=list(map(str,vals))
 if not src:
  if check_figure:figure(r,i,parse(r,i))
  for chain in re.findall(r'(?<![\w:])\d+(?:\s*[+×÷−]\s*\d+)+\s*=\s*\d+(?:\s*=\s*\d+)*',r['solution']):
   vals=[E.calc(x.replace('−','-'))for x in chain.split('=')];assert len(set(vals))==1,('badPrintedArithmetic',i,chain)
 return p

def figure(r,i,v,data=None):
 raw=data if data is not None else(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();assert hashlib.sha256(raw).hexdigest()==r['figureSha256'];root=ET.fromstring(raw);ids={e.get('id'):e for e in root.iter()if e.get('id')};assert not any(e.tag.split('}')[-1]in['image','script','foreignObject']for e in root.iter());meta=json.loads(ids['actual-inputs'].text)
 if isinstance(v[0],str):assert len(meta)==1 and canon(meta[0])==v[0]
 else:assert list(map(F,meta))==v
 def txt(id):return''.join(ids[id].itertext())
 if i in[9,15,20,21,22,26]:
  for id,e in ids.items():
   if id.startswith('term-')or id=='result':assert e.get('text-anchor')=='end'and e.get('x')=='300'and e.get('font-family')=='monospace'
  s=v[0];parts=s.split('=');terms=re.split(r'[+-]',parts[0]);assert[canon(txt('term-'+str(j)))for j in range(len(terms))]==terms;assert canon(txt('result'))==(parts[1]if len(parts)>1 else'?');assert txt('operator')==('−'if'-'in s else'+')
 elif i==16:
  for j in range(4):assert txt('duration-'+str(j))==f'{int(v[j*4])}:{int(v[j*4+1]):02d}'and F(txt('adult-'+str(j)))==v[j*4+2]and F(txt('child-'+str(j)))==v[j*4+3]
 elif i==35:
  assert len([id for id in ids if id.startswith('fruit-0-')])==v[0]and len([id for id in ids if id.startswith('fruit-1-')])==v[1];assert txt('difference')==f'Алмұрт {int(v[2])} г ауыр'
 elif i==38:assert[units(txt('input-'+str(j)),'mass')for j in range(len(v))]==v
 else:
  for j,x in enumerate(v):assert F(txt('input-'+str(j)))==x if not isinstance(x,str)else canon(txt('input-'+str(j)))==x
 return True

def changed(r,i):
 cr=copy.deepcopy(r)
 if i==9:cr['statement']=cr['statement'].replace('BACDE','ECBDA')
 elif i==4:
  for p in H.math_parts(r['statement'],False):cr['statement']=cr['statement'].replace('«'+p+'»','«'+str(int(p)+1)+'»')
 elif i==25:cr['statement']=r['statement'].replace('«7»','«5»').replace('«5» көк','«6» көк')
 elif i in[20,21,26]:
  old=one(H.math_parts(r['statement'],False));chars=list(old);found=None
  for j,c in enumerate(chars):
   if not c.isdigit():continue
   for replacement in'1234567890':
    if c==replacement:continue
    new=old[:j]+replacement+old[j+1:];candidate=copy.deepcopy(r);candidate['statement']=candidate['statement'].replace('«'+old+'»','«'+new+'»');candidate.pop('options',None)
    try:
     out,p=compute(candidate,i)
     if out!=representation(r['answer'],i):found=candidate;break
    except(AssertionError,ValueError):pass
   if found:break
  assert found;cr=found
 else:
  parts=H.math_parts(r['statement'],False);found=None
  for j,old in enumerate(parts):
   if i in[2,3,12,15,22]:
    digits=list(re.finditer(r'\d+',old));m=digits[0];base=int(m.group());replacements=[old[:m.start()]+str(base+delta)+old[m.end():]for delta in[1,2,10,100,1000]]
   else:
    try:replacements=[str(int(old)+delta)for delta in[1,2,5,10,100,1000]]
    except ValueError:continue
   for new in replacements:
    candidate=copy.deepcopy(r);candidate['statement']=candidate['statement'].replace('«'+old+'»','«'+new+'»',1);candidate.pop('options',None)
    try:
     out,p=compute(candidate,i)
     if out!=representation(r['answer'],i):found=candidate;break
    except(AssertionError,ValueError,ZeroDivisionError):pass
   if found:break
  assert found,('validMutation',i);cr=found
 if i==25:cr['statement']=r['statement'].replace('«7»','«5»').replace('«5» көк','«6» көк')
 if i not in[25]:cr.pop('options',None)
 out,p=compute(cr,i);cr['answer']=fmt(out,i);cr['solution']='Жаңа тексерілген нәтиже: '+cr['answer'];assert out!=representation(r['answer'],i);return cr

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==40;entries=[];evidence=[];choices=0;sourceEq=0
 for i,r in enumerate(rows):
  ref=one(r['sourceRefs']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert q['solution'];opts=q.get('options',[]);key=one(x['text']for x in opts if x['correct'])if opts else q['sourceAnswer'];choices+=len(opts);assert len(opts)==len(r.get('options',[]))and H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},i,True);proof=solve(r,i);cr=changed(r,i);solve(cr,i,check_figure=False)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**cr,'answer':r['answer']}]:
   try:solve(bad,i,check_figure=False)
   except(AssertionError,ValueError,SyntaxError,KeyError):pass
   else:raise AssertionError(('badKeyAccepted',i))
  raw=(ROOT/'frontend/public'/r['image'].lstrip('/')).read_bytes();tree=ET.fromstring(raw);ids={e.get('id'):e for e in tree.iter()if e.get('id')};id='term-0'if i in[9,15,20,21,22,26]else'adult-0'if i==16 else'difference'if i==35 else'input-0';ids[id].text='999';wrong=ET.tostring(tree);bad={**r,'figureSha256':hashlib.sha256(wrong).hexdigest()}
  try:figure(bad,i,parse(r,i),wrong)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('rehashedVisibleCorruptionAccepted',i))
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:vals=[N.exact_power_arithmetic(s)for s in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   if i==10 and expr.lstrip().startswith('+'):
    assert 'ойлаған сан'in q['solution']and representation(q['sourceAnswer'],i)+vals[0]==vals[1];src['sourcePartialEqualityHasImplicitOriginalNumber']=True
   else:assert len(set(vals))==1,('sourceArithmetic',i,expr)
   sourceEq+=len(vals)-1
  assert r['minimumPlan']=='pro'and r['grade']==4 and r['statement']!=q['statement']and not re.search(r'\[Image:|\\|\$',r['statement']+r['solution']);proof['changedActualInputAnswer']=cr['answer'];proof['oldKeyRejectedNewKeyAccepted']=True
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':__doc__,'notes':[json.dumps(proof,ensure_ascii=False)],'figureReview':{'status':'verified','sha256':r['figureSha256'],'method':'40 own native diagrams rendered343px and inspected.39 source archives inspected, source2 unavailable has full expression. Column positions, actual route table, balance counts and all visible inputs independently cross-checked. No browser QA.'}});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert choices==48
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':40,'sourceOptionsRead':48,'rewrittenOptionsRead':48,'sourceIllustrationsInspected':39,'unavailableSourceIllustrationWithCompleteText':1,'nativeSVGs':40,'actualInputMutationsChecked':40,'updatedHashWrongVisibleInputsRejected':40,'sourceArithmeticEqualitiesChecked':sourceEq,'pythonJavaScriptHashesMatched':40,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
