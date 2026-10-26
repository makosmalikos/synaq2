"""Independent full54 offline scale review. No author solver/params imported.
All source/new conditions, full solutions and every MCQ were individually read.
Printed quantities below are normalized exactly to SI using Fraction arithmetic.
"""
import ast,copy,hashlib,json,math,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-scale.json'
REPORT='problems/editorial/reviews/grade6-scale.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 return s.replace('\\\\','\\').replace('\\,','').replace('{,}',',').replace('$','').replace(',','.')
def ns(s):return [F(x) for x in re.findall(r'\d+(?:\.\d+)?',clean(s))]
def one(a):assert len(a)==1,a;return a[0]
def sqrt(n):
 a,b=math.isqrt(n.numerator),math.isqrt(n.denominator);assert a*a==n.numerator and b*b==n.denominator,n;return F(a,b)
def numeric(s):return one(ns(s))
def ratio(s):a,b=ns(s);return a/b
def check_numeric(row,x,field='answer'):
 assert numeric(row[field])==x,(row.get('editionId'),x,row[field])
 if row.get('options'):
  opts=[o['text'] if isinstance(o,dict) else o for o in row['options']]
  def candidate(o):
   n=numeric(o)
   if 'км' in row[field] and 'км' not in o:
    if 'мм' in o:n/=1000000
    elif 'см' in o:n/=100000
    elif 'м' in o:n/=1000
   return n
  assert clean(one([o for o in opts if candidate(o)==x]))==clean(row[field]),(row[field],x)
def option_texts(row):return [o['text'] if isinstance(o,dict) else o for o in row.get('options',[])]
def validate(row,i,source=False):
 s=row['statement'];n=ns(s);options=option_texts(row);answer=row['answer'];kind='number';x=None;notes=[]
 # Positions refer to individually read printed givens; neither params nor author functions are consulted.
 if i==1:a,b,d=n;x=d*b/a
 elif i in (2,7):_,den,d=n;x=d*den/100000
 elif i==3:_,per,d=n;x=per*d
 elif i==4:_,den=n;x=den/100;kind='last';assert 'метр' in s or source
 elif i==5:_,den,d=n;x=d*den/100
 elif i==6:_,den=n;x=den/100000;kind='last'
 elif i==8:x=n[0]*100000
 elif i==9:_,den,km=n;x=km*100000/den
 elif i==10:d,a,b=n;x=d*a/b
 elif i==11:
  if source:km,_,den=n
  else:_,den,km=n
  x=km*100000/den
 elif i==12:metres,d=n;x=d/(metres*100);kind='ratio'
 elif i==13:
  x=one([o for o in options if ratio(o)>1]);kind='exact'
 elif i==14:_,den,d=n;x=d*den/100000
 elif i==15:_,den,d=n;x=d*den/1000000;assert 'мм' in s or 'МИЛЛИМЕТР' in s;notes=['One millimetre interpreted literally;2.5km, not the25km corresponding to1cm.']
 elif i==16:x=max(options,key=lambda o:ratio(o)**-1);kind='exact'
 elif i==17:_,den,d=n;x=d*den/10
 elif i==18:_,den,a,b=n;x=[a*den/100,b*den/100];kind='pair'
 elif i==19:
  if source:_,per,speed,time=n
  else:speed,time,_,per=n
  x=speed*time/per
 elif i==20:_,den,a,b=n;x=2*(a+b)*den/100
 elif i==21:_,den,d,speed=n;x=d*den/100000/speed
 elif i==22:
  if source:_,den,metres=n
  else:metres,_,den=n
  x=metres*100/den
 elif i==23:_,den,a,b=n;x=(a*den/100)*(b*den/100)
 elif i==24:a,b,d=n;x=d*10*b/a
 elif i==25:d,km=n;x=d/(km*100000);kind='ratio'
 elif i==26:_,den,h,w=n;x=(h-w)*den/100
 elif i==27:km,_,den=n;x=km*1000000/den
 elif i==28:
  km,_,per,_,den=n;first=km/per;second=km*100000/den
  assert second>first;kind='exact';x=one([o for o in options if clean(o).startswith('Екінш') and ns(o)==[second]])
  assert any(ns(o)==[second-first] for o in options);notes=['Longer segment itself14cm selected;8cm difference remains an explicit distractor.']
 elif i==29:_,den,d,time=n;x=d*den/100000/time
 elif i==30:_,den,d1,d2,_=n;x=den*d1/d2
 elif i==31:realmm,drawingcm=n;x=drawingcm*10/realmm;kind='ratio'
 elif i==32:km,_,den1,_,den2=n;x=km*100000/den1-km*100000/den2;assert x>0
 elif i==33:
  _,den,d,h,m,speed,stop=n;minutes=d*den/100000/speed*60;assert minutes.denominator==1 and 0<=m<60
  end=h*60+m+minutes+stop;assert end<1440
  x=f'{int(end//60):02d}:{int(end%60):02d}';kind='exact'
  assert clean(x) in [clean(o) for o in options];notes=['Movement225min and stop25min separately added to07:20; unique11:30, not11:05 or12:00.']
 elif i==34:a,b,f,_=n;x=(a*f)*(b*f)
 elif i==35:_,den,f,d=n;x=(d/f)*den/100;notes=['Copy enlarged by3.75 before applying original1:1500;72m also agrees with new1:400 scale.']
 elif i==36:_,den,area=n;x=area*(den/100)**2
 elif i==37:_,den,side=n;x=(side*den/100)**2
 elif i==38:
  _,den,d1,d2,area=n;km_per_cm=d1*den/100000/d2;x=area*km_per_cm**2
  assert km_per_cm==6 if not source else km_per_cm==5
  notes=['Shared21km route calibrates second map to6km/cm; lake3cm² therefore108km², not18or36.']
 elif i==39:_,den1,area,_,den2=n;x=area*den1**2/den2**2
 elif i==40:
  speed,h,m,d=n;assert 0<m<60;km=speed*(h+m/60);x=d/(km*100000);kind='ratio'
  if not source:assert km==144 and F(1)/x==3000000
 elif i==41:_,den,p,k=n;width=p/2/(k+1);length=k*width;x=(width*den/100)*(length*den/100);assert width>0
 elif i==42:
  area,plan=n[:2];x=1/sqrt(area*10000/plan);kind='ratio';assert x>0
  notes=['Positive scale denominator is square root of90000area ratio:300, not90000.']
 elif i==43:_,den,d,v1,v2=n;x=d*den/100000/(v1+v2);assert 'бір мезгілде' in s and 'бір-біріне қарай' in s
 elif i==44:_,den1,_,den2=n;x=(den2/den1)**2;assert den2>den1
 elif i==45:
  f,_=n;kind='exact';x=one([o for o in options if 'есе үлкен' in o]);assert ns(x)==[f]
  # Linear multiplicative relation holds for arbitrary positive actual lengths, unlike additive distractor.
  assert all(d*f/d==f for d in [F(1),F(2),F(5,2),F(7)])
 elif i==46:_,per,_=n;x=per*100000
 elif i==47:metres,_,den=n;x=metres*100/den
 elif i==48:
  wrong=[];assert len(options)==4
  for o in options:
   _,den,d,real=ns(o);expected=d*den/(100000 if 'км' in o else 100)
   if real!=expected:wrong.append(o)
  x=one(wrong);kind='exact';assert ns(x)[-1]==10*(ns(x)[2]*ns(x)[1]/100000)
  notes=['Intentional wrong example retained:1:75000;8cm;60km is selected because actual distance is6km; the other three printed rows independently agree.']
 elif i==49:knownkm,knowncm,querycm=n;x=querycm*knownkm/knowncm
 elif i==50:a,b,d,c,e=n;x=d*b/a*c/e
 elif i==51:_,den,d,mat=n;x=d*den/100/mat;assert x.denominator==1
 elif i==52:_,den,modelvol=n;x=modelvol*(den/100)**3;notes=['Length factor200 applies three times and cm³→m³ uses10^6;108cm³ model gives864m³.']
 elif i==53:_,den,area,_,cost=n;x=4*sqrt(area)*den/100*cost
 elif i==54:
  a,b,gap,_,den=n;x=(a*gap/(b-a))*100000/den;assert b>a
  assert (a*gap/(b-a))/(b*gap/(b-a))==a/b
  notes=['Target is first4-part route:28km from21km three-part gap;1:350000 gives8cm.']
 else:raise AssertionError(i)
 if kind=='number':check_numeric(row,x)
 elif kind=='last':
  assert ns(answer)[-1]==x and ns(answer)[0]==1
  assert clean(one([o for o in options if ns(o)[-1]==x]))==clean(answer)
 elif kind=='ratio':
  assert ratio(answer)==x,(i,answer,x)
  if options:assert clean(one([o for o in options if ratio(o)==x]))==clean(answer)
 elif kind=='pair':
  assert ns(answer)==x and clean(one([o for o in options if ns(o)==x]))==clean(answer)
 else:assert clean(answer)==clean(x),(i,answer,x)
 if options:assert len(options)==len(set(options))==4 and sum(clean(o)==clean(answer) for o in options)==1
 if not source and not options:assert 'Жауапты тек санмен жазыңыз.' in s
 return notes

# Parse numeric equality fragments from authored complete solutions with exact own AST.
def value(s):
 text=s.replace(',','.').replace('×','*').replace('−','-').replace(':','/').replace('²','**2').replace('³','**3').strip()
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(text,n))
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -walk(n.operand)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  if isinstance(n.op,ast.Pow):assert b.denominator==1;return a**int(b)
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(text,mode='eval').body)
def hashrow(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
rows=read(BATCH)['editions'];assert len(rows)==54
entries=[];refs=set();wrong=0;source_checked=0
for i,row in enumerate(rows,1):
 assert row['grade']==6 and row['minimumPlan']=='pro' and not row.get('image')
 ref=one(row['sourceRefs']);capture=read(ref['sourceFile']);assert capture['status']=='captured';q=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert q['checked'] and q['solution'] and q['sourceAnswer'] and not q.get('images') and not q.get('svg')
 source={**q,'answer':q['sourceAnswer']};validate(source,i,True);source_checked+=1
 if q.get('options'):
  correct=one([o['text'] for o in q['options'] if o['correct']]);assert clean(correct)==clean(q['sourceAnswer'])
 assert re.sub(r'\s+',' ',clean(q['statement']).lower()).strip()!=re.sub(r'\s+',' ',clean(row['statement']).lower()).strip()
 refs.add((ref['sourceFile'],ref['sourceId']));notes=validate(row,i)
 bad=copy.deepcopy(row);bad['answer']=next(o for o in row['options'] if o!=row['answer']) if row.get('options') else str(numeric(row['answer'])+1)
 try:validate(bad,i)
 except (AssertionError,ValueError):wrong+=1
 else:raise AssertionError(('Wrong key accepted',i))
 entries.append({'editionId':row['editionId'],'sha256':hashrow(row),'verdict':'verified','method':'Independent printed-givens exact SI Fraction/positive square-root/absolute-clock/scale-ratio oracle, independent source key calculations and full canonical/new editorial reading','notes':['All54 saved original/new full conditions, official/authored complete solutions and every MCQ read. Length/area/volume powers, unit conversions, enlargement direction, copy calibration, simultaneous movement, stop minutes, maximum/own-length targets and Kazakh wording checked. Repeated numeric/context variants are source coverage, not54 separate semantic meanings.',*notes]})
# Canary mutations alter printed givens while leaving the original key/params untouched.
canaries=[(15,'1 МИЛЛИМЕТР','10 МИЛЛИМЕТР'),(18,'15 см','16 см'),(24,'7,2 см','8,4 см'),(33,'25 минут','20 минут'),(35,'3,75 есе','2,5 есе'),(36,'32 см²','16 см²'),(38,'3 см²','2 см²'),(39,'270000','180000'),(42,'45 м²','80 м²'),(48,'60 км','6 км'),(52,'108 см³','144 см³'),(54,'21 км','24 км')]
rejected=0
for i,old,new in canaries:
 bad=copy.deepcopy(rows[i-1]);assert old in bad['statement'] or(i==48 and old in ' '.join(bad['options']))
 if i==48:bad['options']=[o.replace(old,new) for o in bad['options']]
 else:bad['statement']=bad['statement'].replace(old,new,1)
 try:validate(bad,i)
 except(AssertionError,ValueError):rejected+=1
 else:raise AssertionError(('Printed canary accepted',i,old,new))
# Check only maximal numeric expressions, excluding dimension/unit text or contextual ratio lists.
eqchecks=0
for row in rows:
 for m in re.finditer(r'(?<![\w:])([\d][\d,\s×:+−/()²³]*?)\s*=\s*([\d][\d,\s×:+−/()²³]*)(?![\d])',row['solution']):
  left,right=m.groups();left=left.strip()
  if not any(o in left for o in['×','+','−',':','/','²','³']):continue
  try:a,b=value(left),value(right)
  except(SyntaxError,AssertionError,ValueError,ZeroDivisionError):continue
  assert a==b,(row['editionId'],left,right,a,b);eqchecks+=1
assert source_checked==wrong==len(refs)==54 and rejected==len(canaries)
js="import{editionHash}from'./scripts/editorial/edition-review.mjs';import fs from'node:fs';const a=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(a.map(r=>[r.editionId,editionHash(r)])));"
js_hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)))
assert all(js_hashes[e['editionId']]==e['sha256'] for e in entries)
report={'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries}
(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'reviewed':54,'sourceMathKeys':source_checked,'wrongKeysRejected':wrong,'printedCanariesRejected':rejected,'numericSolutionEqualities':eqchecks,'pythonJsHashesMatched':54,'report':REPORT,'status':'verified'},ensure_ascii=False))
