"""Author-only printed Fraction/domain checks. No external self-signature."""
import ast,copy,calendar,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];FILE='problems/editorial/batches/collection-word3-wave18.json'
def nums(s):return [F(x.replace(',','.')) for x in re.findall(r'\d+(?:,\d+)?',s)]
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def calc(s):
 s=s.replace('−','-').replace('×','*').replace(',','.');tree=ast.parse(s,mode='eval')
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):return F(str(t.value))
  if isinstance(t,ast.UnaryOp):return -ev(t.operand) if isinstance(t.op,ast.USub) else ev(t.operand)
  assert isinstance(t,ast.BinOp);a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return a+b
  if isinstance(t.op,ast.Sub):return a-b
  if isinstance(t.op,ast.Mult):return a*b
  assert isinstance(t.op,ast.Div);return a/b
 return ev(tree)
def pair(s):return tuple(map(calc,s.split('; ')))
def selected(r,target,predicate):
 assert pair(r['answer'])==target
 assert pair(one([o for o in r['options'] if predicate(*pair(o))]))==target
 return target
def numeric(r,a):
 assert calc(r['answer'])==a,(r['answer'],a)
 assert sum(calc(o)==a for o in r['options'])==1
 return a
def minutes(s):
 ns=nums(s);return ns[0]*60+ns[1] if 'сағ' in s else one(ns)
def solve(r,i):
 s=r['statement'];n=nums(s)
 if i==0:
  initial,removed,added,final=n;x=(final*removed+added)/(final*initial-1);first=initial*x
  assert first-removed>0 and final*(first-removed)==x+added and 'БАСТАПҚЫДА' in s
  return numeric(r,first)
 if i==1:
  t1,t2,total,gap=n;b=(total-t1*gap)/(t1+t2);a=b+gap
  assert 'САҒАТТЫҚ' in s;return selected(r,(a,b),lambda x,y:x-y==gap and t1*x+t2*y==total)
 if i==2:
  total,p2,p3=n;first=total*100/(100+p2+p3);second=first*p2/100;third=first*p3/100
  assert first+second+third==total and third>max(first,second)
  return numeric(r,max(first,second,third))
 if i==3:
  dist,H,M,upHours=n;downTime=H+M/60;down=dist/downTime;up=dist/upHours;own=(down+up)/2;current=(down-up)/2
  assert '(Қайықтың МЕНШІКТІ жылдамдығы; ағыс жылдамдығы)' in s
  return selected(r,(own,current),lambda v,c:v>c>0 and (v+c)*downTime==dist and (v-c)*upHours==dist)
 if i==4:
  first,second,left=n;whole=left/((1-first/100)*(1-second/100));assert 'ҚАЛҒАН' in s
  assert whole*(1-first/100)*(1-second/100)==left;return numeric(r,whole)
 if i==5:
  down,up,wind=n;own=wind*(down+up)/(up-down);dist=(own+wind)*down;assert (own-wind)*up==dist
  return numeric(r,dist)
 if i==6:
  cycleTime,walkTime,dist,gap=n;v=(dist+walkTime*gap)/(cycleTime+walkTime);assert v-gap>0 and v*cycleTime+(v-gap)*walkTime==dist
  return numeric(r,v)
 if i==7:
  fastH,slowH,slowM,gap=n;slowTime=slowH+slowM/60;fast=slowTime*gap/(slowTime-fastH);dist=fastH*fast
  assert slowTime*(fast-gap)==dist;return numeric(r,dist)
 if i==8:
  combined,t1,t2,total=n;rate1=(total-t2*combined)/(t1-t2);rate2=combined-rate1
  assert 'ТОЛЫҚ' in s;return selected(r,(rate1*t1,rate2*t2),lambda a,b:a+b==total and a/t1+b/t2==combined)
 if i==9:
  P,ratio=n;width=P/(2*(1+ratio));length=ratio*width;assert 2*(length+width)==P
  return numeric(r,length*width)
 if i==10:
  distance,v1,v2,flight=n;time=distance/(v1+v2);assert 'Бұрылуға уақыт жұмсамайды' in s
  return numeric(r,time*flight)
 if i==11:
  workers,a,b=n;count=(a+b)/workers;assert count.denominator==1 and 'БАРЛЫҚ белгіше саны бірдей' in s
  return numeric(r,count)
 if i==12:
  total,factor=n;small=total/(1+factor);large=small*factor;assert small.denominator==large.denominator==1
  return selected(r,(small,large),lambda a,b:a+b==total and b==factor*a)
 if i==13:
  gap,adult,factor=n;child=adult-gap;t=(factor*child-adult)/(factor-1);assert 0<t<child
  return numeric(r,t)
 if i==14:
  budget,a,b,c,d=n;left=budget*(1-a/b)*(1-c/d);assert 'ҚАЛҒАН' in s
  assert left==180 and left!=budget*(1-a/b-c/d);return numeric(r,left)
 if i==15:
  total,gap1,gap2=n;first=(total-2*gap1-gap2)/3;second=first+gap1;third=second+gap2
  assert '(БІРІНШІ; ЕКІНШІ; ҮШІНШІ)' in s
  return selected(r,(first,second,third),lambda a,b,c:a+b+c==total and b-a==gap1 and c-b==gap2)
 if i==16:
  first,second=n;answer=second/(first+second);assert 'ЕКІНШІ' in s
  return numeric(r,answer)
 if i==17:
  edition,age=n;assert 'үзіліссіз жыл сайын бір рет' in s and 'бір күнтізбелік күні' in s
  return numeric(r,age+edition-1)
 if i==18:
  count,before,after=n;return numeric(r,count*before-(count-1)*after)
 if i==19:
  weeks=one(n);assert 'сәуір' in s;days=calendar.monthrange(2026,4)[1];assert days==30;value=(days-weeks*7)*24
  assert calc(r['answer'])==value and sum(calc(o)==value for o in r['options'])==1
  assert r['answer']==f'({days} − 7 × {weeks}) × 24';return value
 if i==20:
  own,current,distance=n;assert own>current
  return numeric(r,distance/(own+current)+distance/(own-current))
 if i==21:
  length,_,denominator=n;return numeric(r,length*length/denominator)
 if i==22:
  speed,meters=n;time=meters/1000/speed;assert 'МЕТР' in s and 'САҒАТ' in s
  assert time*3600==18;return numeric(r,time)
 if i==23:
  speed,factor,distance=n;time=distance/(speed/factor);target=time*60
  assert minutes(r['answer'])==target and sum(minutes(o)==target for o in r['options'])==1
  assert nums(r['answer'])[1]<60;return time
 raise AssertionError(i)
def main():
 rows=json.loads((ROOT/FILE).read_text())['editions'];assert len(rows)==24
 expected=[F(90),(F(27),F(21)),F(70),(F(27),F(9)),F(50),F(210),F(14),F(840),(F(36),F(42)),F(648,25),F(90),F(8),(F(48),F(60)),F(14),F(180),(F(112),F(130),F(159)),F(9,16),F(33),F(29),F(384),F(6),F(144),F(1,200),F(7,4)]
 for i,r in enumerate(rows):
  assert solve(r,i)==expected[i],i
  wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY'
  try:solve(wrong,i)
  except (ValueError,SyntaxError,AssertionError,IndexError):pass
  else:raise AssertionError(('Badkey accepted',i))
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in cap['questions'] if str(q['number'])==ref['sourceId']]);assert cap['sourceReviewCaptured'] and q['solution'] and not q['images'] and not q['svg'];assert one([o['text'] for o in q['options'] if o['correct']])==q['sourceAnswer'];assert q['statement']!=r['statement']
 # Complete integer ledgers check the current rate/shift and decimal-ratio count constraints.
 rates=0
 for a in range(1,101):
  for b in range(1,101):
   rates+=1
   if 3*a+5*b==186 and a-b==6:assert (a,b)==(27,21)
   if a+b==16 and 4*a+6*b==78:assert (a*4,b*6)==(36,42)
 counts=0
 for a in range(1,108):
  b=108-a;counts+=1
  if F(b,a)==F(5,4):assert (a,b)==(48,60)
 js="import fs from 'node:fs';import assert from 'node:assert/strict';import{verifyEdition,renderEdition}from'./scripts/editorial/collection-word3-models.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+FILE+"','utf8')).editions;let native=0,tamper=0,missing=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){native++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text')assert.doesNotMatch(n.value,/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i)}}for(const r of rs){verifyEdition(r);for(const s of[r.statement,r.solution,r.answer,...r.options]){assert.doesNotMatch(s,/[\\\\$]|NaN|Infinity/);walk(mathFragments(s))}for(const f of['statement','solution','answer','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+='changed';assert.throws(()=>verifyEdition(c));tamper++}for(const f of Object.keys(r.params)){const c=structuredClone(r);delete c.params[f];assert.throws(()=>renderEdition(c));missing++}}console.log(JSON.stringify({native,tamper,missing}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True))
 print(json.dumps({'printedFixtures':24,'wrongKeysRejected':24,'completeRatePairs':rates,'integerRatioCountCases':counts,'nativeFractionNodes':native['native'],'contentTamperRejected':native['tamper'],'missingParametersRejected':native['missing'],'status':'author_checks_passed_requires_external_review'}))
if __name__=='__main__':main()
