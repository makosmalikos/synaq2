"""Review every captured collection, computing answers only for explicit supported models."""
import json,re,sys,pathlib
from collections import Counter
import sympy as S
from zerek_math import Parser,expression,display_statement,Unsupported
ROOT=pathlib.Path(__file__).resolve().parent.parent
BASE=ROOT/'problems/sources/zerek'
X=S.Symbol('x',real=True)
def mathparts(t):return re.findall(r'\$([^$]+)\$',t)
def canonical(a):
 a=S.cancel(a)
 if a.free_symbols or a.has(S.zoo,S.nan,S.oo,-S.oo):raise Unsupported('not a finite scalar')
 return str(a)
def plainvalue(a):
 a=S.cancel(a)
 if a.is_Rational and a.q==1:return str(a.p)
 return str(a).replace('**','^')
def model(q):
 t=q['statement'];parts=mathparts(t)
 if q.get('images') or q.get('svg'):raise Unsupported('figure reconstruction and review needed')
 if '[SVG' in t or '[Image' in t:raise Unsupported('figure needed')
 if re.search(r'(соңғы цифр|соңғы цифрын)',t):
  if len(parts)!=1:raise Unsupported('last digit model')
  e=parts[0].replace(' ','');terms=re.findall(r'(\d+)\^\{?(\d+)\}?',e)
  if not terms or re.sub(r'\d+\^\{?\d+\}?','',e) not in ('','+') :raise Unsupported('last digit expression')
  a=sum(pow(int(b),int(p),10) for b,p in terms)%10
  return S.Integer(a),'num','modular powers',f'Дәрежелердің соңғы цифрларының қайталануын қолданамыз: '+ ' + '.join(str(pow(int(b),int(p),10)) for b,p in terms)+f'. Қосындының соңғы цифры — {a}.'
 if 'неше нөлмен аяқталады' in t:
  m=re.search(r'\$(\d+)!',t)
  if not m:raise Unsupported('factorial trailing zeros')
  n=int(m[1]);power=5;a=0;terms=[]
  while power<=n:terms.append(n//power);a+=n//power;power*=5
  return S.Integer(a),'num','factorial fives',f'Соңғы нөлдер 2 және 5 көбейткіштерінің жұбынан шығады. 2 жеткілікті болғандықтан, 5 көбейткіштерін санаймыз: '+ ' + '.join(map(str,terms))+f' = {a}.'
 if 'периодты бөлшегін жай бөлшек' in t:
  if len(parts)!=1:raise Unsupported('repeating decimal')
  m=re.fullmatch(r'0\{,\}(\d*)\((\d+)\)',parts[0])
  if not m:raise Unsupported('repeating decimal form')
  prefix,period=m.groups();a=S.Rational(int((prefix or '')+period)-int(prefix or 0),(10**len(period)-1)*10**len(prefix))
  return a,'frac','repeating decimal',f'Период басталғанға дейінгі цифрларды ескереміз: ({int((prefix or "")+period)} − {int(prefix or 0)}) / ({10**(len(prefix)+len(period))} − {10**len(prefix)}) = {plainvalue(a)}.'
 if ('ең кішісін' in t or 'ең үлкенін' in t) and 'Бөлшектер' in t and len(parts)>1:
  values=[expression(p) for p in parts]
  if any(v.free_symbols for v in values):raise Unsupported('symbolic comparison')
  a=(min if 'ең кішісін' in t else max)(values)
  return a,'frac','exact fraction ordering','Бөлшектерді ортақ бөлімге келтіреміз. Ортақ бөлімдегі алымдарды салыстырғанда сұралған бөлшек '+plainvalue(a)+' болады.'
 if re.match(r'^(Есептеңіз|Ыңғайлы тәсілмен есептеңіз|Өрнектің мәнін табыңыз)',t) and parts:
  # A factorial definition may precede the actual expression; no text word problems.
  e=parts[-1]
  if any(x in e for x in ['\\ldots','\\dots','\\begin']):raise Unsupported('series/system needs separate model')
  a=expression(e)
  if a.free_symbols:raise Unsupported('symbolic expression needs target/assumptions')
  if 'жүздік' in t and 'дөңгелект' in t:a=S.sign(a)*S.floor(S.Abs(a)*100+S.Rational(1,2))/100
  return a,'frac','exact expression','Амалдардың ретін сақтаймыз: алдымен жақша, дәреже, көбейту мен бөлу, кейін қосу мен азайту. '+display_statement('$'+e+'$')+' = '+plainvalue(a)+'.'
 if re.match(r'^Теңдеуді шешіңіз',t) and len(parts)==1:
  e=parts[0]
  if e.count('=')!=1:raise Unsupported('equation count')
  l,r=e.split('=');p1,p2=Parser(l),Parser(r);left,right=p1.parse(),p2.parse()
  if left.free_symbols|right.free_symbols != {X}:raise Unsupported('equation variables')
  numerator=S.cancel(left-right).as_numer_denom()[0]
  if not numerator.is_polynomial(X):raise Unsupported('non-polynomial equation needs separate model')
  p=S.Poly(numerator,X)
  if p.degree()!=1:raise Unsupported('nonlinear equation')
  a=S.cancel(-p.nth(0)/p.nth(1))
  if any(S.cancel(d.subs(X,a))==0 for d in p1.denominators+p2.denominators):raise Unsupported('excluded root')
  if S.simplify((left-right).subs(X,a))!=0:raise Unsupported('root fails substitution')
  return a,'eq','linear equation and domain',f'Ұқсас мүшелерді біріктіріп, теңдеуді {p.nth(1)}x + ({p.nth(0)}) = 0 түріне келтіреміз. x = {plainvalue(a)}. Бастапқы теңдеуге қойғанда екі жағы тең; бөлімдер нөлге тең емес.'
 if 'болғанда' in t and 'өрнегінің мәнін табыңыз' in t and len(parts)>=2:
  assigns={}
  for e in parts[:-1]:
   if e.count('=')!=1:raise Unsupported('substitution assignment')
   k,v=e.split('=')
   if k.strip() not in ('a','b','x','y'):raise Unsupported('assignment name')
   assigns[S.Symbol(k.strip(),real=True)]=expression(v)
  a=expression(parts[-1]).subs(assigns)
  if a.free_symbols:raise Unsupported('missing substitution')
  return a,'eq','exact substitution', 'Берілген мәндерді өрнекке қоямыз: '+', '.join(str(k)+' = '+plainvalue(v) for k,v in assigns.items())+'. Амалдарды орындағанда '+plainvalue(a)+' шығады.'
 if len(parts)==1 and 'теңсіздігін қанағаттандыратын' in t and ('натурал сандар неше' in t or 'ең үлкен натурал санды' in t):
  e=parts[0]
  if e.count('<')!=1:raise Unsupported('inequality form')
  l,r=e.split('<');p=S.Poly(expression(l)-expression(r),X)
  if p.degree()!=1 or p.nth(1)<=0:raise Unsupported('inequality slope')
  bound=-p.nth(0)/p.nth(1);a=S.ceiling(bound)-1
  if a<1:raise Unsupported('empty naturals')
  return a,'sys','strict upper bound on positive integers',f'Теңсіздікті шешсек, x < {plainvalue(bound)}. Натурал сандар 1-ден басталады. Осы шарттағы ең үлкен сан — {a}; 1-ден {a}-ге дейін {a} натурал сан бар.'
 raise Unsupported('individual model/solution required')

def review():
 results=[];candidates=[]
 for f in sorted((BASE/'collections').glob('*.json')):
  if f.name.endswith('.partial.json'):continue
  collection=json.loads(f.read_text());collection_id=f.stem
  for q in collection['questions']:
   record={'collection':collection_id,'number':q['number'],'sourceUrl':collection['url'],'sourceTitle':collection['title'],'school':collection['school']}
   if collection_id=='363d41e1-3dae-4060-887e-6f6dff3efe96':record.update(status='already_reviewed',note='21 imported; four numerical variants recorded in first review');results.append(record);continue
   try:
    a,topic,method,solution=model(q);canonical(a)
    options=q['options']
    if options:
     equivalent=[]
     for i,o in enumerate(options):
      oparts=mathparts(o['text'])
      if len(oparts)!=1 or re.sub(r'\$[^$]+\$','',o['text']).strip():raise Unsupported('text/compound options need individual review')
      v=expression(oparts[0])
      if S.simplify(v-a)==0:equivalent.append(i)
     if len(equivalent)!=1:raise Unsupported('answer missing or multiple equivalent options')
     rendered_options=[display_statement(o['text']) for o in options];answer=rendered_options[equivalent[0]]
     if len(set(rendered_options))!=len(rendered_options):raise Unsupported('duplicate visible options')
    else:rendered_options=None;answer=plainvalue(a)
    if collection['school']=='RFMSH' and (not a.is_Integer or a<=0):raise Unsupported('RFMSH open natural answer required')
    statement=display_statement(q['statement'])
    if '\\' in statement or '$' in statement:raise Unsupported('unsupported math presentation')
    if any('\\' in o or '$' in o for o in rendered_options or []):raise Unsupported('unsupported options presentation')
    school={'NIS':'НИШ','BIL':'БИЛ','RFMSH':'РФМШ','PREP':'РФМШ'}[collection['school']]
    if school=='РФМШ':
     if not a.is_Integer or a<=0:raise Unsupported('RFMSH integer format')
     answer=plainvalue(a);rendered_options=None
    task={'id':f'zerek_{collection_id}_{q["number"]:02d}','school':school,'subject':'math','topic':topic,'lang':'kk','statement':statement,'options':rendered_options,'answer':answer,'solution':solution,'source':f'Zerek · {collection["title"]} · №{q["number"]}; independently computed SYNAQ solution','sourceUrl':collection['url'],'sourceNumber':q['number']}
    record.update(status='computed_candidate',method=method,exactAnswer=canonical(a),taskId=task['id']);candidates.append(task)
   except (Unsupported,TypeError,ZeroDivisionError,ValueError,NotImplementedError) as e:record.update(status='needs_review',reason=str(e))
   results.append(record)
 out=ROOT/'output/zerek-import';out.mkdir(exist_ok=True,parents=True)
 (out/'computed-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2)+'\n')
 (BASE/'question-review.json').write_text(json.dumps({'date':'2026-10-22','records':results},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'capturedQuestions':len(results),'candidates':len(candidates),'statusCounts':dict(Counter(r['status'] for r in results)),'pendingReasons':dict(Counter(r.get('reason') for r in results if r['status']=='needs_review'))},ensure_ascii=False,indent=2))
if __name__=='__main__':review()
