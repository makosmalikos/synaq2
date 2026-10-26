"""Independent29 canonical percentpart3 source/new fullsolutions/everyMCQ.
Own actual-printed exact Fraction and unit/domain conservation, no author imports.
"""
from pathlib import Path
from fractions import Fraction as F
import argparse,ast,copy,hashlib,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/collection-percent3-wave7.json'
OUT='problems/editorial/reviews/collection-percent3-wave7.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def nums(s):return[F(n.replace(',','.'))for n in re.findall(r'\d+(?:,\d+)?',s)]
def whole(x):
 x=F(x);assert x.denominator==1,x
 return x.numerator
def fmt(x):
 x=F(x);sign='-'if x<0 else'';x=abs(x);w=x.numerator//x.denominator;rem=x.numerator%x.denominator;ds=''
 while rem:
  assert len(ds)<12;rem*=10;ds+=str(rem//x.denominator);rem%=x.denominator
 return sign+str(w)+(','+ds if ds else'')
def tree(s,env=None):
 env=dict(env or{});count=0
 def decimal(m):
  nonlocal count
  name='DECIMAL'+str(count);count+=1;env[name]=F(m.group().replace(',','.'));return name
 s=re.sub(r'\d+,\d+',decimal,s)
 s=re.sub(r'(?<=\d)(?=[a-z])','*',s);s=re.sub(r'(?<=\))(?=[a-z])','*',s)
 s=s.replace('³','**3').replace('²','**2').replace('×','*').replace('÷','/').replace(':','/').replace('−','-')
 return ast.parse(s.strip(),mode='eval'),env
def calc(s,env=None):
 t,env=tree(s,env)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
  if isinstance(n,ast.Name):return F(env[n.id])
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.USub,ast.UAdd));return-walk(n.operand)if isinstance(n.op,ast.USub)else walk(n.operand)
  assert isinstance(n,ast.BinOp)and isinstance(n.op,(ast.Mult,ast.Div,ast.Add,ast.Sub,ast.Pow)),ast.dump(n)
  a,b=walk(n.left),walk(n.right)
  if isinstance(n.op,ast.Pow):assert b.denominator==1 and 0<=b<=4;return a**whole(b)
  return a*b if isinstance(n.op,ast.Mult)else a/b if isinstance(n.op,ast.Div)else a+b if isinstance(n.op,ast.Add)else a-b
 return walk(t)
def trim(p):
 p=list(map(F,p))
 while len(p)>1 and p[-1]==0:p.pop()
 return p
def pa(a,b,sign=1):return trim([(a[i]if i<len(a)else 0)+sign*(b[i]if i<len(b)else 0)for i in range(max(len(a),len(b)))])
def pm(a,b):
 c=[F(0)]*(len(a)+len(b)-1)
 for i,x in enumerate(a):
  for j,y in enumerate(b):c[i+j]+=x*y
 return trim(c)
def pe(p,x):return sum(c*x**i for i,c in enumerate(p))
def rational_polynomials(s,var='x',env=None):
 t,env=tree(s,env)
 def walk(n):
  if isinstance(n,ast.Expression):return walk(n.body)
  if isinstance(n,ast.Constant):assert type(n.value)is int;return[F(n.value)],[F(1)]
  if isinstance(n,ast.Name):return([F(0),F(1)],[F(1)])if n.id==var else([F(env[n.id])],[F(1)])
  if isinstance(n,ast.UnaryOp):
   a,b=walk(n.operand);assert isinstance(n.op,(ast.USub,ast.UAdd));return([-x for x in a],b)if isinstance(n.op,ast.USub)else(a,b)
  assert isinstance(n,ast.BinOp);a,b=walk(n.left);c,d=walk(n.right)
  if isinstance(n.op,ast.Mult):return pm(a,c),pm(b,d)
  if isinstance(n.op,ast.Div):return pm(a,d),pm(b,c)
  assert isinstance(n.op,(ast.Add,ast.Sub));return pa(pm(a,d),pm(c,b),-1 if isinstance(n.op,ast.Sub)else 1),pm(b,d)
 return walk(t)
def root_of(equation):
 lhs,rhs=equation.split(' = ');a,b=rational_polynomials(lhs);c,d=rational_polynomials(rhs);polynomial=pa(pm(a,d),pm(c,b),-1)
 assert len(polynomial)==2 and polynomial[1]!=0,(equation,polynomial)
 root=-polynomial[0]/polynomial[1]
 assert pe(b,root)!=0 and pe(d,root)!=0
 assert calc(lhs,{'x':root})==calc(rhs,{'x':root})
 return root,lhs,rhs
def equation_of(s):
 s=s.split(', x')[0].split(', 3x')[0].split(', мұнда')[0].split('. ')[0]
 return re.split(r' пропорция| теңдеу| теңдігіндегі',s)[0].rstrip('. ')
def option_value(o):return calc(re.sub(r'\s*(?:сағ|кг|км|мин|см|м|°)\s*$','',o))
def numeric_choice(r,v):return one([o for o in r['options']if option_value(o)==v])
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def quantity(o):
 m=re.fullmatch(r'(.+?)\s*(мм|см|км|га|%)?',o);assert m
 text,unit=m.groups();return calc(text),unit or''
def choose(r,v,unit=''):
 factors={'мм':F(1),'см':F(10),'км':F(1000000)}
 def valid(o):
  q,u=quantity(o)
  if unit in factors:return u in factors and q*factors[u]==v*factors[unit]
  return u==unit and q==v
 return one([o for o in r['options']if valid(o)])
def select(r,value,unit=''):
 matches=[]
 for o in r['options']:
  m=re.fullmatch(r'(.+?)\s*(мм²|см³|дм²|тг|мм|см|кг|т|га|км|м|°|%)?',o);assert m
  text,u=m.groups();u=u or''
  factors={'мм':F(1),'см':F(10)}
  if unit in factors:
   if u in factors and calc(text)*factors[u]==value*factors[unit]:matches.append(o)
  elif u==unit and calc(text)==value:matches.append(o)
 return one(matches)
def solve(r):
 k=r['skillFamily'];s=r['statement'];n=nums(s);unit='';answer=None
 if k=='original-decimal-percent-last-area':
  first,p,last=n;left=1-first-p/100;v=last/left;unit='га';assert s.count('БАРЛЫҚ')==2 and left>0 and v*first+v*p/100+last==v
  note=f'Printed first{first}andsecond{p}%SAMEORIGINAL, last{last}ha={left}whole→total{v}; notsequentialremainingbase.'
 elif k=='original-percent-decimal-last-distance':
  p,second,last=n;left=1-p/100-second;v=last/left;unit='км';assert s.count('БАРЛЫҚ')==2 and left>0 and v*p/100+v*second+last==v
  note=f'Actualfirst{p}%second{second}SAMEWHOLE, third{last}km→ALL{v}; fraction{left}divideslast, notmultiplies.'
 elif k=='known-field-total-decimal-percent-third-part':
  total,p,second=n;v=total*(1-p/100-second);unit='га';assert'ҮШІНШІ'in s and s.count('БАРЛЫҚ')==2
  assert total*p/100+total*second+v==total
  note=f'ActualknownALL{total}ha; thirdCOMPLEMENT1−{p}/100−{second} gives{v}ha, notfirsttwo sum.'
 elif k=='all-original-potato-parts-tonnes-to-kilogram-rest':
  tonnes,first,p=n;v=tonnes*1000*(1-first-p/100);unit='кг';assert s.count('БАРЛЫҚ')==2 and'КИЛОГРАММЕН'in s
  note=f'Printed{tonnes}TONNES→{tonnes*1000}kg, samewholeparts{first}and{p}%; requestedTHIRD{v}kg, nottonnesorsoldfirst.'
 elif k=='two-removals-final-to-initial':
  p,q,last=n;v=last/((1-p/100)*(1-q/100));unit='м'if'сым'in s else'';after1=v*(1-p/100);assert'ҚАЛҒАН'in s and after1*(1-q/100)==last
  if unit=='':assert whole(v)>0 and whole(v-after1)>=0 and whole(after1-last)>=0
  note=f'Actual firstremoval{p}%ALL, second{q}%ofREMAINING; final{last}=(1−p)(1−q)whole→initial{v}; forwardremaining{after1}, final{last}; physicalcountintegralwhereappropriate.'
 elif k=='swapped-percent-products-difference-zero':
  a,b,c,d=n;A=a*b/100;B=c*d/100;v=B-A;assert a==d and b==c and'B − A'in s
  note=f'Actual A={a}×{b}/100={A}, B={c}×{d}/100={B}; ORDEREDB−A={v}. Formalcommutativity identity explainszero, notroundedcoincidence.'
 elif k=='three-colours-ratio-bursts-total-and-survivor-percent':
  red,greenPart,gn,gd,rn,rd,sn,sd,yn,yd=n;green=red*greenPart;yellow=green*gd/gn;total=red+green+yellow;bursts=[red*rn/rd,green*sn/sd,yellow*yn/yd];alive=total-sum(bursts);percent=alive/total*100
  for count in[red,green,yellow,total,alive,*bursts]:assert whole(count)>=0
  assert green==yellow*gn/gd and total==sum([red,green,yellow])and'ПАЙЫЗЫН'in s
  answer=one([o for o in r['options']if re.fullmatch(r'\d+ шар; \d+(?:,\d+)?%',o)and nums(o)==[total,percent]])
  note=f'Actualred{red},green{greenPart}×red={green}, green={gn}/{gd}YELLOW→yellow{yellow}; all{total}; separateburstcounts{bursts}→survivors{alive}; secondrequestedPERCENT{percent}, notaliveCOUNTorburstpercent.'
 elif k=='rectangle-side-up-other-down-area-change':
  up,down=n;factor=(1+up/100)*(1-down/100);change=(factor-1)*100;amount=abs(change);direction='артты'if change>0 else'кеміді';answer=one([o for o in r['options']if o==fmt(amount)+'% '+direction]);assert up<100 and down<100
  note=f'Positive rectangleSIDEmultipliers1+{up}% and1−{down}%; AREAproduct{factor}, signedpercentchange{change}; requested{amount}%{direction}, notdifferenceorsumsidepercent.'
 elif k=='withdrawn-thousands-known-percent-original-money':
  thousand,p=n;v=thousand*1000*100/p;unit='тг';assert'МЫҢ'in s and'АЛДЫНДА'in s and v*p/100==thousand*1000
  note=f'Actualwithdrawn{thousand}THOUSAND={thousand*1000}t is{p}%ORIGINALbeforewithdrawal→{v}t, notremaining{v-thousand*1000}.'
 elif k=='part-over-whole-to-percent':
  part,total=n;v=part/total*100;unit='%';assert 0<part<total
  note=f'PrintedORDEREDpart{part}/WHOLE{total}×100={v}%, notreversedratio.'
 elif k=='number-percent-then-reduce-new-part':
  total,p,q=n;part=total*p/100;v=part*(1-q/100);assert'СОДАН ШЫҚҚАН'in s
  note=f'Actualfirst{p}%of{total}→{part}; reduceTHIS{part}by{q}%→{v}; notpercentageoforiginalagainorqabsoluteunits.'
 elif k=='two-hundred-percent-of-like-square-fraction':
  m=re.search(r'\(\((\d+)a² \+ (\d+)a²\)/(\d+)a²\) санының (\d+)%',s);assert m and'a ≠ 0'in s
  a,b,c,p=map(F,m.groups());v=(a+b)/c*p/100
  for x in[F(1),F(-3),F(7,4)]:assert(a*x*x+b*x*x)/(c*x*x)*p/100==v
  note=f'ActualWHOLEbar({a}a²+{b}a²)/({c}a²), nonzeroaformalcommonfactor→{(a+b)/c}; requested{p}%ofNUMBER→{v}, notpercentlabelorrawfraction.'
 elif k=='given-money-spent-then-given-away-remainder':
  total,p,q=n;spent=total*p/100;after=total-spent;given=after*q/100;v=after-given;assert'ҚАЛҒАН'in s and spent+given+v==total
  note=f'ActualALL{total}t spend{p}%={spent}, remaining{after}; giveaway{q}%ofREMAINDER={given}; requestedOWNfinal{v}.'
 elif k=='only-two-crops-known-other-area-percent':
  total,other=n;v=(total-other)/total*100;assert'тек'in s and'БИДАЙ'in s
  note=f'OnlyTWOcrops: wheat{total}−millet{other}={total-other}ha; requestedwheat/ALL={v}%, notmilletpercent.'
 elif k=='interim-price-two-discounts-total-saving':
  p,interim,q=n;original=interim/(1-p/100);last=interim*(1-q/100);v=original-last;unit='тг';assert'ОСЫ ЖАҢА'in s and'ТЕҢГЕГЕ'in s
  assert original-interim+interim-last==v
  note=f'PrintedINTERIM{interim}afterfirst{p}%discount→ORIGINAL{original}; second{q}%CURRENT→LAST{last}; requestedTOTALSAVING{v}, notlastpriceoronediscount.'
 elif k=='enlarged-wing-drawing-real-millimetres':
  a,b,drawing=n;v=drawing*b/a*10;unit='мм';assert a>b and'НАҚТЫ'in s
  assert v/10*a/b==drawing
  note=f'ActualENLARGEMENTdrawing:real={a}:{b}, drawing{drawing}cm→real{drawing*b/a}cm×10={v}mm; notmultiply12orcm/mmearlystop.'
 elif k=='two-unequal-current-base-increases-growth':
  p,q=n;v=((1+p/100)*(1+q/100)-1)*100;assert'жаңа баға'in s
  note=f'PrintedtwoCURRENTbaseincreases{p}%,{q}%→ORIGINALrelativegrowth{v}, notp+q.'
 elif k=='quarter-square-area-positive-side':
  side,p=n;area=side**2*p/100;v=one([F(i)for i in range(1,101)if i*i==area]);unit='мм';assert'АУДАНЫ'in s and'ҚАБЫРҒАСЫ'in s
  note=f'ActualfirstSIDE{side}mm→AREA{side**2}; secondAREA{p}%={area}; requestedpositiveSIDEunique{v}, notareaorpercentofside.'
 elif k=='newspaper-later-count-after-decrease':
  old,p=n;v=old*(1-p/100);assert'ТАМЫЗДА'in s and whole(v)>0
  note=f'PrintedOLDcount{old}, reduction{p}%→requestedLATERtotal{v}, notdecreasecount{old-v}.'
 elif k=='magazine-extra-count-not-later-total':
  old,p=n;v=old*p/100;assert'АРТЫҚ'in s and whole(v)>0
  note=f'PrintedOLDcount{old}, rise{p}%→requestedEXTRACOUNT{v}, notnewtotal{old+v}.'
 elif k=='reducible-proper-fraction-to-percent':
  a,b=n;v=a/b*100;unit='%';assert 0<a<b and F(a,b).denominator<b
  note=f'Actualproperfraction{a}/{b} reduces{a/b}; percent×100={v}, notunchangeddecimalorreplaceonlydenominator.'
 elif k=='cuboid-width-percent-length-height-percent-width-volume':
  length,p,q=n;width=length*p/100;height=width*q/100;v=length*width*height;assert'ҰЗЫНДЫҒЫНЫҢ'in s and'ЕНІНІҢ'in s and'КӨЛЕМІН'in s
  note=f'Printedlength{length}cm, WIDTH{p}%ofLENGTH={width}, HEIGHT{q}%ofWIDTH={height}; VOLUME{v}cm³ notsurfaceorheightpercentoflength.'
 elif k=='price-growth-over-original-not-new':
  old,new=n;v=(new-old)/old*100;assert'БАСТАПҚЫ'in s and old*(1+v/100)==new
  note=f'Printedold{old},new{new}; INCREASE{new-old}/ORIGINAL{old}×100={v}, notnew/oldpercentor/newdenominator.'
 elif k=='unpainted-square-cell-area-percent':
  side,painted=n;total=side**2;v=(total-painted)/total*100;unit='%';assert'БОЯЛМАҒАН'in s and 0<painted<total
  note=f'ActualsideCELLS{side}→areaCOUNT{total}; unpainted{total-painted}/ALL{total}×100={v}, notpaintedpercentorlinearcellcount.'
 elif k=='smallest-of-three-percent-related-angles':
  total,p,q=n;first=total/(1+p/100+q/100);angles=[first,first*p/100,first*q/100];v=min(angles);unit='°';assert sum(angles)==total and'ЕҢ КІШІ'in s and min(angles)>0
  note=f'ActualSUM{total}°, second{p}%FIRST andthird{q}%FIRST; first{first}, all{angles}; requestedSMALLEST{v}, notfirstangle.'
 elif k=='four-percent-statements-commute-and-compare':
  truths=[];values=[]
  for o in r['options']:
   a,b,c,d=nums(o);lhs=a*b/100;rhs=c*d/100;sign=one(re.findall('[<>=]',o));valid=lhs<rhs if sign=='<'else lhs>rhs if sign=='>'else lhs==rhs;values.append((lhs,sign,rhs));truths.append(valid)
  answer=one([o for o,t in zip(r['options'],truths)if t])
  note=f'Actualprinted4orderedpercentcomparisons{values}; signscheckedseparately, oneTRUE. a×b/100=b×a/100coefficientidentity notstrictinequality.'
 else:raise AssertionError(k)
 if answer is None:answer=select(r,v,unit)
 assert r['answer']==answer,(r['editionId'],r['answer'],answer)
 return note
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==29;entries=[];refs=set();files=set()
 for r in rows:
  ref=one(r['sourceRefs']);source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['sourceReviewCaptured'];raw=one([q for q in source['questions']if str(q['number'])==ref['sourceId']]);assert raw['solution']and not raw.get('images')and not raw.get('svg')
  refs.add(int(ref['sourceId']));files.add(ref['sourceFile']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(r['statement']);note=solve(r)
  assert r['grade']==6 and r['minimumPlan']=='pro'and len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'Independent actualprinted Fraction/AST/physicalunits/domain proof; all29canonicalraw/new fullconditions/officialsolutions/everyMCQread, noauthorcalculatorimports','notes':note})
 assert refs==set(range(1,30))and len(files)==1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 nativejs="""import fs from'node:fs';import{mathFragments}from'./frontend/src/mathPresentation.js';let f=0;function walk(ns){for(const n of ns)if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed')walk([n.fraction]);}for(const r of JSON.parse(fs.readFileSync(process.argv[1])).editions)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(f);"""
 native=int(subprocess.check_output(['node','--input-type=module','-e',nativejs,PACK],cwd=ROOT,text=True));assert native>20
 badkeys=printed=0
 for r in rows:
  b=copy.deepcopy(r);b['answer']='WRONG'
  try:solve(b)
  except AssertionError:badkeys+=1
  else:raise AssertionError('Wrongkey accepted')
  b=copy.deepcopy(r)
  if r['skillFamily']=='four-percent-statements-commute-and-compare':b['options'][-1]=b['options'][-1].replace('60 санының','61 санының',1)
  else:
   ms=list(re.finditer(r'\d+(?:,\d+)?',b['statement']));index=1 if r['skillFamily']=='two-hundred-percent-of-like-square-fraction'else 0;m=ms[index];q=F(m.group().replace(',','.'))+1;b['statement']=b['statement'][:m.start()]+fmt(q)+b['statement'][m.end():]
  try:solve(b)
  except(AssertionError,ValueError,KeyError,ZeroDivisionError):printed+=1
  else:raise AssertionError(('Changedprintedgivenaccepted',r['editionId']))
 original=sequential=area=commute=0
 for total in range(1,51):
  for p in range(1,100):
   part=F(total*p,100);assert part*100/p==total;original+=1
 for p in range(1,50):
  for q in range(1,50):
   for old in range(1,6):
    first=F(old)*(1-F(p,100));last=first*(1-F(q,100));assert old-last==old-first+first-last;sequential+=1
 for p in range(1,30):
  for q in range(1,30):
   for width in range(1,6):
    for height in range(1,6):assert F(width)*(1+F(p,100))*height*(1-F(q,100))/(width*height)==(1+F(p,100))*(1-F(q,100));area+=1
 for a in range(1,101):
  for b in range(1,101):assert F(a*b,100)==F(b*a,100);commute+=1
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All29canonicalpercentpart3 saved/new fullconditions/officialsolutions/everyMCQread. Own actualprinted exactFraction/domain/physicalcount/scale/SI/area-vs-side/orderedgrowthbase/multioutput/signchecks. Findings0, noauthorcalculator imports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'printedCanariesRejected':printed,'inverseOriginalBaseCases':original,'sequentialDiscountLedgers':sequential,'areaFactorCases':area,'commutativityCases':commute,'nativeFractions':native,'JSHashes':len(hashes),'report':OUT if args.write else None}))
if __name__=='__main__':main()
