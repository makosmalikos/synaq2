"""Author-only independent printed Fraction ledgers; not an external review."""
import copy,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];FILE='problems/editorial/batches/collection-word2-wave17.json'
def nums(s):return [F(x.replace(',','.')) for x in re.findall(r'\d+(?:,\d+)?',s)]
def pair(s):return tuple(F(x) for x in s.split('; '))
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def system(a,b,c,d,e,f):
 det=a*e-b*d;assert det
 return ((c*e-b*f)/det,(a*f-c*d)/det)
def numeric(r,a):
 assert F(r['answer'].replace(',','.'))==a,(r['answer'],a)
 assert sum(F(o.replace(',','.'))==a for o in r['options'])==1
 return a
def selected(r,target,predicate=None):
 assert pair(r['answer'])==target,(r['answer'],target)
 if predicate:assert pair(one([o for o in r['options'] if predicate(*pair(o))]))==target
 return target

def solve(r,i):
 s=r['statement'];ns=nums(s)
 if i==0:
  distance,hours,increase=ns;return numeric(r,distance/(distance/hours+increase))
 if i==1:
  a,b,t,k=ns;N=(k*a*t-b*t)/(k-1);left=(N-a*t,N-b*t);assert min(left)>0 and all(v.denominator==1 for v in left)
  return selected(r,left,lambda x,y:x+a*t==y+b*t and y==k*x)
 if i==2:
  lead,pct,later,gap=ns;factor=1+pct/100;v=gap/(factor*(lead+later)/60-later/60)
  return selected(r,(v,factor*v),lambda x,y:y==factor*x and y*(lead+later)/60-x*later/60==gap)
 if i==3:
  a,b,gap,pct=ns;m=(b-pct)*gap/(2*pct-a-b);assert m>0
  return numeric(r,2*m+gap)
 if i==4:
  delta,h,n,d,num,den=ns;time=h+n/d;fraction=num/den;distance=delta*time/fraction;assert distance/time-delta>0
  return numeric(r,distance)
 if i==5:
  fractions=[F(int(a),int(b)) for a,b in re.findall(r'\((\d+)/(\d+)\)',s)];first,second,final=fractions
  extras=[F(x) for x in re.findall(r'тағы (\d+)',s)];assert len(extras)==2
  N=sum(extras)/(1-first-second-2*final);stages=(N,N*first+extras[0],N*second+extras[1],N*final)
  assert all(v.denominator==1 and v>0 for v in stages);assert (N-stages[1]-stages[2])/2==stages[3]
  assert s.count('БАРЛЫҚ')==1 and 'қалғанының жартысын' in s
  return numeric(r,N)
 if i==6:
  planned,minutes,increase=ns;delay=minutes/60;actual=planned-delay;speed=actual*increase/delay;assert actual>0
  assert planned*speed==actual*(speed+increase)
  assert 'ЖОСПАРЛЫ' in s;return numeric(r,speed)
 if i==7:
  distance,gap,time=ns;slow=(distance/time-gap)/2;assert slow>0
  return numeric(r,slow*time)
 if i==8:
  mass,p1,p2,_,factor=ns;other=mass/factor;salt=mass*p1/100+other*p2/100;percent=salt/(mass+other)*100
  assert percent!=(p1+p2)/2;return numeric(r,percent)
 if i==9:
  low,extra,high,missing,diff=ns;b=(low*diff+extra+missing)/(high-low);N=high*b-missing
  assert b.denominator==1 and low*(b+diff)+extra==N and 0<missing<high
  return numeric(r,N)
 if i==10:
  factor,removed,added=ns;b=(removed+added)/(factor-1);a=factor*b;assert a-removed==b+added
  return numeric(r,a+b)
 if i in (11,19):
  a,b,c,d,e,f=ns;target=system(a,b,c,d,e,f);assert min(target)>0
  return selected(r,target,lambda x,y:a*x+b*y==c and d*x+e*y==f)
 if i==12:
  total,factor,n,d=ns;x=total/(1+factor+n/d);third=n/d*x;assert all(v.denominator==1 for v in [x,factor*x,third])
  assert 'ҮШІНШІ' in s;return numeric(r,third)
 if i==13:
  a,b,total,c,d,gap=ns;target=system(a,b,total,c,-d,gap)
  return selected(r,target,lambda x,y:a*x+b*y==total and c*x-d*y==gap)
 if i==14:
  first,second,withdrawal,remaining=ns;x=(remaining*second-first)/(remaining*withdrawal-1)
  assert first-x==remaining*(second-withdrawal*x) and first-x>0 and second-withdrawal*x>0
  return numeric(r,x)
 if i==15:
  a,b,total,c,d,gap=ns;target=system(a,b,total,c,-d,gap)
  return selected(r,target,lambda x,y:a*x+b*y==total and c*x-d*y==gap)
 if i==16:
  factor,removed,added=ns;b=(removed+added)/(factor-1);a=factor*b;assert a-removed==b+added>0
  assert 'басқа жерден' in s;return selected(r,(a,b),lambda x,y:x==factor*y and x-removed==y+added)
 if i==17:
  rooms,small,large,people=ns[:4];b=(people-small*rooms)/(large-small);a=rooms-b
  assert min(a,b)>0 and a.denominator==b.denominator==1
  return selected(r,(a,b),lambda x,y:x+y==rooms and small*x+large*y==people)
 if i==18:
  adult,child,factor=ns;t=(factor*child-adult)/(factor-1);assert t>0 and child-t>0
  assert adult-t==factor*(child-t);return numeric(r,t)
 if i==20:
  _,d1,_,d2,extra,third,total=ns;coef=1/d1+1/d2+third;N=(total-extra)/coef;day=N/d2+extra
  assert N>=total and all(v.denominator==1 for v in [N,N/d1,day,N*third]);assert N/d1+day+N*third==total
  assert 'ЕКІНШІ' in s;return numeric(r,day)
 if i==21:
  count,total,secondCount,firstCount,gap=ns;b=(gap+firstCount*total)/(secondCount+firstCount*count);a=total-count*b
  assert secondCount*b-firstCount*a==gap and min(a,b)>0 and 'АҚ' in s
  return numeric(r,a)
 if i==22:
  down,up,current=ns;v=current*(down+up)/(up-down);assert v>current and down*(v+current)==up*(v-current)
  assert 'МЕНШІКТІ' in s;return numeric(r,v)
 if i==23:
  days,total,d1,d2,gap=ns;rateSum=total/days;b=(d1*rateSum-gap)/(d1+d2);a=rateSum-b
  assert d1*a-d2*b==gap and a>b>0;return numeric(r,a-b)
 raise AssertionError(i)

def main():
 rows=json.loads((ROOT/FILE).read_text())['editions'];assert len(rows)==24
 expected=[F(3),(F(18),F(54)),(F(48),F(60)),F(12),F(160),F(60),F(84),F(48),F(35),F(290),F(27),(F(5),F(3)),F(24),(F(18),F(7)),F(24),(F(7),F(6)),(F(1350),F(450)),(F(8),F(6)),F(10),(F(6),F(5)),F(45),F(90),F(15),F(32)]
 for i,r in enumerate(rows):
  assert solve(r,i)==expected[i]
  wrong=copy.deepcopy(r);wrong['answer']='WRONG_KEY'
  try:solve(wrong,i)
  except ValueError:pass
  else:raise AssertionError(('badkey accepted',i))
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one([q for q in cap['questions'] if str(q['number'])==ref['sourceId']]);assert cap['sourceReviewCaptured'] and not q['images'] and not q['svg'];assert one([o['text'] for o in q['options'] if o['correct']])==q['sourceAnswer'];assert q['statement']!=r['statement']
 # Full integer pair domains independently confirm the current system ledgers.
 equations=[(1,4,17,2,7,31),(2,3,57,3,-6,12),(5,8,83,4,-3,10),(4,3,39,2,5,37)]
 pairCases=0
 for a,b,c,d,e,f in equations:
  hits=[]
  for x in range(1,101):
   for y in range(1,101):
    pairCases+=1
    if a*x+b*y==c and d*x+e*y==f:hits.append((F(x),F(y)))
  assert one(hits)==system(a,b,c,d,e,f)
 integerAppleCases=0
 for N in range(1,1001):
  if N%12:continue
  first=F(N,3)+3;second=F(N,4)+2;left=N-first-second;integerAppleCases+=1
  if left>0 and left/2==F(N,6):assert N==60
 js="import fs from 'node:fs';import assert from 'node:assert/strict';import{verifyEdition,renderEdition}from'./scripts/editorial/collection-word2-models.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+FILE+"','utf8')).editions;let native=0,tamper=0,missing=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){native++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text')assert.doesNotMatch(n.value,/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i)}}for(const r of rs){verifyEdition(r);for(const s of[r.statement,r.solution,r.answer,...r.options]){assert.doesNotMatch(s,/[\\\\$]|NaN|Infinity/);walk(mathFragments(s))}for(const f of['statement','solution','answer','options']){const c=structuredClone(r);if(f==='options')c.options=c.options.slice().reverse();else c[f]+='changed';assert.throws(()=>verifyEdition(c));tamper++}for(const f of Object.keys(r.params)){const c=structuredClone(r);delete c.params[f];assert.throws(()=>renderEdition(c));missing++}}console.log(JSON.stringify({native,tamper,missing}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True))
 print(json.dumps({'printedFixtures':24,'wrongKeysRejected':24,'completeIntegerPairCases':pairCases,'wholeFractionDomains':integerAppleCases,'nativeFractionNodes':native['native'],'contentTamperRejected':native['tamper'],'missingParametersRejected':native['missing'],'status':'author_checks_passed_requires_external_review'}))
if __name__=='__main__':main()
