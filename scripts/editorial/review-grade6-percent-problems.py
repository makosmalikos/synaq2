"""Independent offline full54 percent-problem editorial review.
All54 canonical and new full conditions, solutions and every choice were read.
The own Fraction/AST oracle below reads PRINTED givens, never author params/math.
"""
import ast,copy,hashlib,itertools,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-percent-problems.json'
REPORT='problems/editorial/reviews/grade6-percent-problems.json'
def read(path):return json.loads((ROOT/path).read_text())
def one(a):assert len(a)==1,a;return a[0]
def number(s):return F(str(s).replace(',','.').replace(' ',''))
N=r'(\d+(?:,\d+)?)'
def take(pattern,s):
 m=re.search(pattern,s);assert m,(pattern,s);return tuple(number(x) for x in m.groups())
def value(s,env=None):
 text=s.replace(',','.').replace('×','*').replace('·','*').replace('−','-').replace(':','/').strip();env=env or {}
 def walk(n):
  if isinstance(n,ast.Constant):return F(ast.get_source_segment(text,n))
  if isinstance(n,ast.Name):assert n.id in env,n.id;return F(env[n.id])
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -walk(n.operand)
  assert isinstance(n,ast.BinOp),ast.dump(n);a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):return a/b
  raise AssertionError(ast.dump(n))
 return walk(ast.parse(text,mode='eval').body)
def equation(s,env):left,right=s.split('=');return value(left,env)==value(right,env)
def parts(total,p):return total*p/100

def solve(row):
 s=row['statement'];k=row['modelId'].removeprefix('grade6-percent-problems-');opts=row.get('options');expected=None;answer=None;notes=[]
 if k=='proportion-value':a,b,p=take(r'\('+N+r'/x\) = \('+N+r'/'+N+r'\)',s);expected=a*p/b
 elif k=='mass-grams':a,p=take(r'Массасы '+N+r' кг[\s\S]*?үлесі '+N+r'%',s);expected=parts(a*1000,p);notes=['Mass normalized to3200grams before18.75% calculation;600g, distinct from0.6kg.']
 elif k=='books-part':a,p=take(r'кітапханасына '+N+r' жаңа кітап[\s\S]*?Оның '+N+r'%',s);expected=parts(a,p);assert expected.denominator==1
 elif k=='part-formula':
  assert '0 < r < 100' in s and 'Оң v' in s
  vs=[F(1),F(2),F(5),F(20),F(50),F(240)];rs=[F(1),F(2),F(25,2),F(25),F(50),F(199,2)]
  valid=[o for o in opts if all(equation(o,{'u':v*r/100,'v':v,'r':r}) for v,r in itertools.product(vs,rs))];answer=one(valid)
  notes=['General u/v=r/100 algebra checked with36 exact nonzero/proper-percent pairs; counterexamples eliminate reciprocal/unscaled formulas.']
 elif k=='identify-whole':
  answer=one([o for o in opts if re.search(r'қандай массаның \d+%-ы екенін',o)]);a,p=take(N+r' кг қандай массаның '+N+r'%',answer);assert a*100/p==70
  assert one([o for o in opts if 'арттыру' in o]).endswith('20%-ға арттыру');notes=['Only unknown whole corresponds to100%; other requested objects are20%part, percentage itself and120%newmass.']
 elif k=='interest-only':p,a=take(r'жылға '+N+r'%[\s\S]*?Шотқа '+N+r' теңге',s);expected=parts(a,p);assert 'жай өсім' in s and 'ӨСІМНІҢ ӨЗІ' in s;notes=['Only2700 simple-interest increment requested; starting principal36000 is excluded from answer38700.']
 elif k=='above-hundred-yield':a,p=take(r'маусымда '+N+r' кг[\s\S]*?былтырғының '+N+r'%',s);expected=parts(a,p);assert p>100 and expected>a
 elif k=='price-from-part':p,a=take(r'бағасының '+N+r'%-ы '+N+r' теңгеге',s);expected=a*100/p
 elif k=='proportion-correspondence':
  assert '(m/n) = (100/r)' in s and 'оң және r < 100' in s
  answer=one([o for o in opts if o=='m — 100%-ға сәйкес толық шама']);assert F(80,20)==F(100,25)
  notes=['Given ratio with positive0<r<100 makes m larger than n and n/m=r/100; m is the whole100% base, not r%part or difference.']
 elif k=='houses-part':a,p=take(r'Кенттегі '+N+r' үйдің '+N+r'%',s);expected=parts(a,p);assert expected.denominator==1
 elif k=='fabric-whole':a,p=take(r'орамнан '+N+r' м[\s\S]*?орамның '+N+r'%',s);expected=a*100/p
 elif k=='choose-whole-proportion':
  p,a=take(r'x санының '+N+r'%-ы '+N+r'-ге',s);x=a*100/p;answer=one([o for o in opts if equation(o,{'x':x})]);assert 'Сандар сол жақта' in s;notes=['Unknown whole x90 substituted into all four printed proportions; only x/27=100/30 holds.']
 elif k=='sub-one-percent':a,p=take(N+r' санының '+N+r'%',s);expected=parts(a,p);assert 0<p<1 and expected<a/100
 elif k=='yesterday-above-hundred':a,p=take(r'наубайхана '+N+r' тоқаш[\s\S]*?санның '+N+r'%',s);expected=a*100/p;assert p>100 and expected<a and expected.denominator==1
 elif k=='salt-whole':p,a=take(r'тұз үлесі '+N+r'%[\s\S]*?\. '+N+r' кг тұз',s);expected=a*100/p;assert 'Тұз толық сақталып, су ғана буланады' in s
 elif k=='choose-part-proportion':
  a,p=take(r'^'+N+r' санының '+N+r'%',s);x=parts(a,p);answer=one([o for o in opts if equation(o,{'x':x})]);assert 'Толық санның бөлікке қатынасы' in s
 elif k=='discount-price':a,p=take(r'Күртеше '+N+r' теңге[\s\S]*?құнының '+N+r'%',s);expected=a-parts(a,p);notes=['Requested full post-discount9840, not reduction2160 or markup14160.']
 elif k=='original-book-remainder':
  a,p,q=take(N+r' беттік[\s\S]*?БҮКІЛ кітаптың '+N+r'%-ын[\s\S]*?БҮКІЛ кітаптың '+N+r'%',s);expected=a-parts(a,p)-parts(a,q);assert s.count('БҮКІЛ')==2 and p+q<100
  assert expected.denominator==1;notes=['Both25%and40% refer to original360pages;126 left, not162 after erroneously applying40%to remainder.']
 elif k=='production-two-answers':
  a,p,b=take(r'тапсырыс '+N+r' бөлшек[\s\S]*?оның '+N+r'%-ы, екінші аптада '+N+r' бөлшек',s);percent=b/a*100;left=a-parts(a,p)-b;valid=[]
  for o in opts:
   pp,ll=take(r'^'+N+r'%; '+N+r' бөлшек$',o)
   if pp==percent and ll==left:valid.append(o)
  answer=one(valid);assert left.denominator==1;notes=['Secondweek share35% plus total remaining2520 both checked; firstweek600 is subtracted, cumulative47.5%notrequested.']
 elif k=='markup-price':a,p=take(r'килограмын '+N+r' теңгеге[\s\S]*?бағасына '+N+r'% үстеме',s);expected=a+parts(a,p)
 elif k=='norm-above-hundred':a,p=take(r'ауысымда '+N+r' бөлшек[\s\S]*?норманың '+N+r'%',s);expected=a*100/p;assert p>100 and expected.denominator==1
 elif k=='whole-from-road-remainder':p,a=take(r'сапардың '+N+r'%-ын[\s\S]*?тағы '+N+r' км',s);expected=a*100/(100-p)
 elif k=='whole-from-land-remainder':p,q,a=take(r'жерінің '+N+r'%-ына[\s\S]*?'+N+r'%-ына[\s\S]*?қалған '+N+r' гектарына',s);expected=a*100/(100-p-q);assert 'бір жерді қайталап алмайды' in s and p+q<100
 elif k=='mixture-component':p,q,a=take(r'массасының '+N+r'%-ы құм, '+N+r'%-ы цемент[\s\S]*?Ерітіндіде '+N+r' кг су',s);total=a*100/(100-p-q);expected=parts(total,p);assert 'ҚҰМНЫҢ' in s;notes=['24kgwater is20%of full120kg; asked sand55%=66kg, not total120kg.']
 elif k=='successive-route-remainders':
  p,q,left=take(r'бағыттың '+N+r'%-ын[\s\S]*?ҚАЛҒАН бағыттың '+N+r'%-ын[\s\S]*?Соңында '+N+r' км',s);factor=(1-p/100)*(1-q/100);expected=left/factor;assert expected==120 and factor==F(9,20)
  notes=['Two decreasing bases:0.75×0.60=0.45of original remains;54km→120km, not direct25+40percent sum.']
 elif k=='oil-whole':p,a=take(r'массасының '+N+r'%-ынан[\s\S]*?\. '+N+r' т жанармай',s);expected=a*100/p
 elif k=='remaining-students-part':
  a,p,q=take(r'жазылған '+N+r' оқушының '+N+r'%-ы[\s\S]*?ҚАЛҒАН оқушылардың '+N+r'%',s);left=a-parts(a,p);expected=parts(left,q);assert left.denominator==expected.denominator==1;notes=['32non-robotics children form the new100%base;62.5%gives20, not25from full40.']
 elif k=='rent-before-growth':p,a=take(r'сомасынан '+N+r'%-ға көтеріліп, '+N+r' теңгеге',s);expected=a*100/(100+p)
 elif k=='language-remainder':p,times=take(r'кітаптардың '+N+r'%-ы[\s\S]*?кітаптардан '+N+r' есе',s);expected=100-p-p*times;assert 'Әр кітап тек бір тілде жазылған' in s;assert 0<expected<100
 elif k=='swapped-percent-equality':
  a,p,b,q=take(r'^'+N+r' санының '+N+r'%-ы мен '+N+r' санының '+N+r'%',s);assert a==q and p==b and parts(a,p)==parts(b,q);answer=one([o for o in opts if o=='Екі мән тең'])
 elif k=='gender-share-gap':p,gap=take(r'балалардың '+N+r'%-ы ұлдар[\s\S]*?ұлдардан '+N+r' балаға',s);expected=gap*100/(100-2*p);boys=parts(expected,p);girls=expected-boys;assert boys.denominator==girls.denominator==1 and girls-boys==gap
 elif k=='price-before-discount':p,a=take(r'бағасына '+N+r'% жеңілдік[\s\S]*?ол '+N+r' теңге',s);expected=a*100/(100-p)
 elif k=='wrong-operation-recover-part':p,a=take(r'санның '+N+r'%-ын[\s\S]*?азайтып, '+N+r' алды',s);total=a*100/(100-p);expected=parts(total,p);assert total-expected==a
 elif k=='equal-percent-two-numbers':
  total,p,q=take(r'қосындысы '+N+r'\. Біріншінің '+N+r'%-ы екіншінің '+N+r'%',s);valid=[]
  for o in opts:
   a,b=map(value,o.split('; '))
   if a>0 and b>0 and a+b==total and parts(a,p)==parts(b,q):valid.append(o)
  answer=one(valid);domain=[a for a in range(1,int(total)) if F(a)*p==(total-a)*q];assert domain==[120]
 elif k=='three-groups-offset':
  p,extra,third=take(r'баланың '+N+r'%-ы[\s\S]*?біріншіден '+N+r' бала артық, ал үшінші топта '+N+r' бала',s);good=[]
  for total in range(1,1001):
   first=parts(F(total),p);second=first+extra
   if first.denominator==1 and first+second+third==total:good.append(total)
  expected=F(one(good));notes=['Complete1..1000integer population domain retains extra14plus third66; sole total160, with40/54/66.']
 elif k=='two-year-depreciation':
  p,a=take(r'құнының '+N+r'%-ына[\s\S]*?құны '+N+r' теңге',s);factor=(1-p/100)**2;expected=a/factor;assert parts(expected,100-p)* (1-p/100)==a
  notes=['Separate yearly current-price bases:8000000→6400000→5120000; two20%drops yield64%, not60%.']
 elif k=='conserved-dry-matter':freshWater,dryWater,dryMass=take(r'массасының '+N+r'%-ы су[\s\S]*?массасының '+N+r'%-ы су[\s\S]*?\. '+N+r' кг кепкен',s);solids=parts(dryMass,100-dryWater);expected=solids*100/(100-freshWater);assert 'құрғақ зат толық сақталады' in s and freshWater>dryWater;assert expected==42 and solids==F(21,2)
 elif k=='choir-two-bases':p,q,choir,boys=take(r'ұлдардың '+N+r'%-ы және қыздардың '+N+r'%-ы[\s\S]*?барлығы '+N+r' бала[\s\S]*?мектепте '+N+r' ұл',s);singingBoys=parts(boys,p);singingGirls=choir-singingBoys;expected=singingGirls*100/q;assert singingBoys.denominator==singingGirls.denominator==expected.denominator==1
 elif k=='symmetric-price-changes':
  assert '0 < p < 100' in s and 'ЖАҢА бағадан' in s;drop=take(r'бастапқыдан '+N+r'%-ға төмен',s)[0];valid=[o for o in opts if 100*(1+value(o)/100)*(1-value(o)/100)==100-drop];answer=one(valid);p=value(answer);assert p>0 and p*p==100*drop
  notes=['Positive real root uniqueness from(p−30)(p+30)=0and0<p<100; allfour candidates yield0.81/9/0.09/36%loss, only30matches9%.']
 elif k=='chained-relative-savings':
  up,down=take(r'Бекке қарағанда '+N+r'% артық[\s\S]*?Даниярға қарағанда '+N+r'% аз',s);ratio=(1+up/100)*(1-down/100);loss=(1-ratio)*100;answer=one([o for o in opts if 'аз' in o and take(N+r'%-ға',o)[0]==loss]);assert loss==8
 elif k=='profit-after-two-changes':
  up,down,profit=take(r'бағасына '+N+r'% үстеме[\s\S]*?бағасына '+N+r'% жеңілдік[\s\S]*?құнынан '+N+r' теңге',s);factor=(1+up/100)*(1-down/100);assert factor>1 and 'Басқа шығын жоқ' in s;expected=profit/(factor-1);assert expected*(factor-1)==profit
 elif k=='revenue-two-factors':
  down,up=take(r'бағасы '+N+r'%-ға арзандады[\s\S]*?саны бұрынғыдан '+N+r'%-ға артты',s);ratio=(1-down/100)*(1+up/100);change=(ratio-1)*100
  answer=one([o for o in opts if 'артты' in o and take(N+r'%-ға',o)[0]==change]);assert 'көбейтіндісіне тең' in s and change==5
 elif k=='relative-gender-gap':p,gap=take(r'ұлдардан '+N+r'%-ға көп[\s\S]*?айырмасы '+N+r' оқушы',s);boys=gap*100/p;girls=boys+gap;expected=boys+girls;assert boys.denominator==girls.denominator==1
 elif k=='weighted-two-classes':a,b,p,q=take(r'6«А»-да '+N+r' оқушы, 6«Ә»-де '+N+r' оқушы[\s\S]*?тиісінше '+N+r'% және '+N+r'%',s);first=parts(a,p);second=parts(b,q);expected=(first+second)/(a+b)*100;assert a!=b and first.denominator==second.denominator==1;assert expected!=(p+q)/2
 elif k=='one-percent-to-another':p,a,q=take(r'санның '+N+r'%-ы '+N+r' санына[\s\S]*?санның '+N+r'%',s);expected=a*q/p
 elif k=='time-unit-percent':h,m,p=take(r'сапары '+N+r' сағат '+N+r' минутқа[\s\S]*?уақыттың '+N+r'%',s);expected=parts(h*60+m,p);assert 0<=m<60
 elif k=='strict-percent-threshold':
  threshold=take(r'мәні '+N+r'-тан',s)[0];assert 'ҚАТАҢ ҮЛКЕН' in s;vals=[]
  for o in opts:
   a,p=take(r'^'+N+r' санының '+N+r'%-ы$',o);vals.append(parts(a,p))
  assert vals.count(threshold)==3;answer=one([o for o,v in zip(opts,vals) if v>threshold]);notes=['Three exact60boundary values are excluded,67.5alone qualifies under strict greater-than.']
 elif k=='unsolved-after-known-percent':a,p=take(r'Жанерке '+N+r' тапсырманы[\s\S]*?тапсырманың '+N+r'%',s);total=a*100/p;expected=total-a;assert total.denominator==expected.denominator==1 and 'Қалған тапсырмалардың бәрі орындалмаған' in s
 elif k=='known-part-to-another':p,a,q=take(r'санның '+N+r'%-ы '+N+r' санына[\s\S]*?санның '+N+r'%',s);expected=a*q/p
 elif k=='oxygen-room-volume':a,b,c,p=take(r'өлшемдері '+N+r' м, '+N+r' м және '+N+r' м[\s\S]*?шамамен '+N+r'%',s);expected=parts(a*b*c,p);assert 'түгел ауамен толған' in s;notes=['Three dimensions give240m³ air,21%is50.4m³; floor area80m² cannot substitute for volume.']
 elif k=='two-shop-discounts':
  a,p,b,q=take(r'дүкенде '+N+r' теңге[\s\S]*?'+N+r'% жеңілдік[\s\S]*?дүкенде '+N+r' теңге[\s\S]*?жеңілдік '+N+r'%',s);first=a-parts(a,p);second=b-parts(b,q);diff=abs(first-second);which='Бірінші' if first<second else 'Екінші';answer=one([o for o in opts if o.startswith(which) and take(r', '+N+r' теңгеге',o)[0]==diff]);assert first==19200 and second==19550
 elif k=='overlapping-readers':
  a,b,both=take(r'оқитындар '+N+r'%, ағылшынша оқитындар '+N+r'%[\s\S]*?оқитындар '+N+r' бала',s);assert 'әр бала қазақша не ағылшынша кітап оқиды' in s;share=a+b-100;assert 0<share<=min(a,b);expected=both*100/share;onlyFirst=parts(expected,a)-both;onlySecond=parts(expected,b)-both;assert onlyFirst+onlySecond+both==expected and onlyFirst>=0 and onlySecond>=0
 elif k=='alloy-conservation':
  a,b,mass,target=take(r'қорытпада мыс '+N+r'%, екіншісінде '+N+r'%[\s\S]*?массасы '+N+r' кг[\s\S]*?үлесі '+N+r'%',s);assert 'шығынсыз' in s and b<target<a
  valid=[o for o in opts if value(o)*a+mass*b==(value(o)+mass)*target];answer=one(valid);x=value(answer);assert x>0 and (parts(x,a)+parts(mass,b))*100/(x+mass)==target
 elif k=='cheaper-more-kilograms':
  p,budget,gap=take(r'килограмы '+N+r'%-ға[\s\S]*?Енді '+N+r' теңгеге бұрынғыдан '+N+r' кг',s);expected=budget*p/100/gap;old=expected/(1-p/100);assert budget/expected-budget/old==gap and 'ЖАҢА' in s and 'екі жағдайда да ақша толық жұмсалады' in s
  notes=['New1200 vs old1600unit prices independently validated by exact quantities8kg−6kg=2kg under fixed9600budget.']
 else:raise AssertionError(k)
 if answer is not None:assert row['answer']==answer,(row['editionId'],answer,row['answer'])
 elif opts:assert expected is not None and one([o for o in opts if value(o)==expected])==row['answer'],(row['editionId'],expected,row['answer'])
 else:assert expected is not None and value(row['answer'])==expected and 'Жауапты тек санмен жазыңыз.' in s,(row['editionId'],expected,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(row['answer'])==1
 return notes

rows=read(BATCH)['editions'];assert len(rows)==54
entries=[];refs=set();wrong=0
for row in rows:
 assert row['grade']==6 and row['minimumPlan']=='pro' and not row.get('image')
 for ref in row['sourceRefs']:
  capture=read(ref['sourceFile']);assert capture['status']=='captured';source=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert source['checked'] and source['sourceAnswer'] and source['solution'];assert not source.get('images') and not source.get('svg')
  if source.get('options'):
   correct=one([o for o in source['options'] if o['correct']]);normal=lambda s:re.sub(r'\s+','',s.replace('\\\\','\\'));assert normal(correct['text'])==normal(source['sourceAnswer'])
  clean=lambda s:re.sub(r'\s+',' ',s.lower()).strip();assert clean(source['statement'])!=clean(row['statement']);refs.add((ref['sourceFile'],ref['sourceId']))
 notes=solve(row);bad=copy.deepcopy(row);bad['answer']=next(o for o in row['options'] if o!=row['answer']) if row.get('options') else str(value(row['answer'])+1)
 try:solve(bad)
 except AssertionError:wrong+=1
 else:raise AssertionError(('Wrong key accepted',row['editionId']))
 digest=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
 entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','method':'Independent printed-givens Python exact Fraction and own AST, complete formula/ratio/population domains, conserved mass/weighted shares/inclusion-exclusion/staged bases, full source and new editorial reading','notes':['All54 immutable canonical original/new conditions, full official/authored solutions and every MCQ read. Percentage base, whole/part/change/new-price targets, exact units, symbolic positive domains, conservation/nonoverlap/full-union assumptions and Kazakh wording checked. Numerical variants are source coverage, not54 distinct semantic meanings.',*notes]})
assert wrong==len(refs)==54
canaries=[('a5bf356489965877','0,25%','2,5%'),('3395f3203eb27777','0 < r < 100','r > 0'),('4060e82a21046abd','ҚАЛҒАН бағыттың','БҮКІЛ бағыттың'),('dd4aadfbd2fe7557','ҚАЛҒАН оқушылардың','БҮКІЛ оқушылардың'),('d2c1829e6b421251','20%-ына','10%-ына'),('e7717664040023a7','75%-ы су','80%-ы су'),('d2e7df86d54ff3bb','30 оқушы','20 оқушы'),('e52d438865c090b6','75%','65%'),('90f598cf2268301e','шығынсыз','шығынмен'),('c269e354ad420956','ЖАҢА','БҰРЫНҒЫ'),('d1261cf2b0cf831d','ҚАТАҢ ҮЛКЕН','КІШІ ЕМЕС'),('5340cce42f365244','20 минутқа','30 минутқа')]
for qid,old,new in canaries:
 bad=copy.deepcopy(one([r for r in rows if r['editionId'].endswith(qid)]));assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
 try:solve(bad)
 except AssertionError:pass
 else:raise AssertionError(('Printed boundary canary accepted',qid))
js="import fs from 'node:fs';import {editionHash} from './scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(editionHash)));"
hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js,BATCH],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'editions':54,'sourceRefs':len(refs),'printedGivenDomains':54,'wrongKeysRejected':wrong,'printedCanariesRejected':len(canaries),'pythonJsHashMatches':len(hashes),'report':REPORT,'status':'verified'}))
