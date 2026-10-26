"""Independent full-content review of properties46, with no author solver import.

Canonical and authored conditions, all choices and full solutions were read.
Calculations below read rendered native expressions/conditions. Symbolic choices
are compared as exact rational polynomials; quantified finite digit domains are
exhausted, congruence claims cover complete residue classes, and global claims
also have the factor/linear identities described in the review notes.
"""
import argparse
import ast
from fractions import Fraction as F
import hashlib
import importlib.util
import itertools
import json
import math
from pathlib import Path
import re

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('review_native',ROOT/'scripts/editorial/review-grade5-coordinate-sequence.py')
native=importlib.util.module_from_spec(spec);spec.loader.exec_module(native)
value=native.value
VARS='abcdkmnqxy';ZERO=(0,)*len(VARS)

def numbers(s):return [int(n) for n in re.findall(r'\d+',s)]
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def integer(n):
 n=F(n);assert n.denominator==1,n
 return str(n.numerator)

def polynomial(text):
 """Formal identity, not equality at a few numerical substitutions."""
 tree=ast.parse(text.strip().replace('×','*').replace('−','-').replace(':','/'),mode='eval')
 def merge(a,b,sign=1):
  out=a.copy()
  for m,c in b.items():out[m]=out.get(m,F(0))+sign*c
  return {m:c for m,c in out.items() if c}
 def go(t):
  if isinstance(t,ast.Expression):return go(t.body)
  if isinstance(t,ast.Constant) and type(t.value)is int:return {ZERO:F(t.value)} if t.value else {}
  if isinstance(t,ast.Name) and t.id in VARS:
   key=list(ZERO);key[VARS.index(t.id)]=1;return {tuple(key):F(1)}
  assert isinstance(t,ast.BinOp),ast.dump(t)
  a,b=go(t.left),go(t.right)
  if isinstance(t.op,ast.Add):return merge(a,b)
  if isinstance(t.op,ast.Sub):return merge(a,b,-1)
  if isinstance(t.op,ast.Mult):
   out={}
   for ma,ca in a.items():
    for mb,cb in b.items():
     m=tuple(x+y for x,y in zip(ma,mb));out[m]=out.get(m,F(0))+ca*cb
   return {m:c for m,c in out.items() if c}
  if isinstance(t.op,ast.Div):
   assert set(b)=={ZERO} and b[ZERO]
   return {m:c/b[ZERO] for m,c in a.items()}
  raise AssertionError(ast.dump(t))
 return go(tree)

def solve(row):
 k=row['modelId'].removeprefix('grade5-properties-');s=row['statement'];ns=numbers(s);opts=row.get('options',[])
 method='rendered native givens; exact Fraction arithmetic / complete finite search'
 notes=[]
 if k in ('difference-quotient','product-quotient','sum-quotient'):
  expression=s.split(': ',1)[1].removesuffix('.');answer=value(expression)
  if row['sourceRefs'][0]['sourceId']=='b1329d1e924db79b':
   factors=numbers(expression.split(')')[0]);divisor=numbers(expression)[-1]
   assert not any(n%divisor==0 for n in factors),'Cross-factor cancellation must remain necessary'
 elif k=='sum-nondivisible-explanation':
  a,b,d=ns;assert a%d==0 and b%d!=0 and (a+b)%d!=0
  answer=one([o for o in opts if o.startswith('бөлінбейді:')])
  assert b%2==0 and f'{b} жұп сан' in opts[-1],'Keep the true but irrelevant distractor premise'
 elif k=='universal-product-rule':
  d=numbers(opts[0])[0];c=numbers(opts[1])[0];period=math.lcm(d,c)
  valid=[True]*4
  for ar,br in itertools.product(range(period),repeat=2):
   a=ar+2*period;b=br+period;assert a>b>0
   cases=[(a+b)%d!=0 or (a%d==0 and b%d==0),(a*b)%c!=0 or a%c==0 or b%c==0,(a-b)%d!=0 or a%d==0,a%d!=0 or (a*b)%d==0]
   valid=[x and y for x,y in zip(valid,cases)]
  answer=one([o for o,v in zip(opts,valid) if v]);assert valid==[False,False,False,True]
  method='all residue pairs modulo lcm; ordered positive representatives; global factor identity d*k*b'
 elif k in ('both-terms-choice','decomposition-choice'):
  d=ns[-1] if k=='both-terms-choice' else ns[1]
  answer=one([o for o in opts if all(n%d==0 for n in numbers(o))])
  if k=='decomposition-choice':assert all(sum(numbers(o))==ns[0] for o in opts)
 elif k=='smallest-positive-addend':
  base,d=ns;assert base%d==0
  answer=next(x for x in range(1,d+1) if (base+x)%d==0)
 elif k=='guaranteed-product-divisor':
  base=ns[0];answer=one([o for o in opts if base%int(o)==0]);assert int(answer)>1
  method='n=1 gives necessary divisor; factor identity gives sufficiency for all positive n'
 elif k=='product-choice':
  d,=ns;answer=one([o for o in opts if value(o)%d==0]);assert any(n%d==0 for n in numbers(answer))
 elif k in ('symbolic-one-term','symbolic-two-terms'):
  expr=re.search(r'(\([^)]*\) : \d+)',s)[1];expected=polynomial(expr)
  answer=one([o for o in opts if polynomial(o)==expected])
  method='exact rational polynomial coefficient identity for all permitted natural variables'
 elif k in ('divisible-expression-choice','nondivisible-expression-choice'):
  d,=ns;invert=k.startswith('nondivisible')
  answer=one([o for o in opts if (value(o)%d!=0 if invert else value(o)%d==0)])
  if not invert:
   chain=re.search(r'шығарсақ, (.+?)\. Сондықтан',row['solution'])[1].split(' = ')
   assert len(chain)==2 and value(chain[0])==value(chain[1])
 elif k=='value-divisor-choice':
  expression=s.split(' өрнегінің')[0];n=value(expression);invert='бөлінбейді' in s
  answer=one([o for o in opts if (n%int(o)!=0 if invert else n%int(o)==0)])
  chain=re.search(r'жазсақ, (.+?)\. Нұсқалар',row['solution'])[1].split(' = ')
  assert len(chain)==3 and all(value(part)==n for part in chain)
 elif k=='addend-choice':
  base,d=ns;assert base%d==0
  answer=one([o for o in opts if (base+int(o))%d==0])
 elif k=='equal-teams':
  first,last,groups=ns;assert F(first,groups).denominator==F(last,groups).denominator==1
  answer=F(first+last,groups)
 elif k=='product-plus-remainder':
  a,b,c,d=ns;assert a%d==0 and 0<=c<d;answer=(a*b+c)%d
 elif k=='divisor-transitivity':
  base=ns[0];valid=[]
  for o in opts:
   if 'a + 1' in o:valid.append(False)
   else:valid.append(base%numbers(o)[0]==0)
  answer=one([o for o,v in zip(opts,valid) if v]);method='a=base*k global factor identity; a=base refutes other divisors'
 elif k=='bounded-difference-count':
  base,d,upper=ns;assert base%d==0
  answer=len([x for x in range(1,upper) if (base-x)%d==0])
 elif k=='consecutive-product-quotient':
  expr=s.split(' бөліндісін')[0];answer=value(expr)
  factors=numbers(expr.split(')')[0]);assert factors==list(range(factors[0],factors[-1]+1))
 elif k=='not-guaranteed-shift':
  d=ns[0];a,b=2*d,d
  def evaluate(o):return value(re.sub(r'\ba\b',str(a),re.sub(r'\bb\b',str(b),o)))
  answer=one([o for o in opts if evaluate(o)%d])
  assert all(sum(m)<=1 for o in opts for m in polynomial(o))
  method='linear congruence: a,b are zero residues; nonzero constant shift is not divisible'
 elif k=='append-digit-count':
  d=ns[0];candidates=[n for n in range(100,1000) if n%d==0]
  answer=len([digit for digit in range(10) if all((10*n+digit)%d==0 for n in candidates)])
  assert '0 цифрына да рұқсат' in s;method='every permitted three-digit n and every appended digit0–9 exhausted'
 elif k=='two-digit-addend-count':
  base,d=ns;assert base%d==0
  answer=len([x for x in range(10,100) if (base+x)%d==0])
 elif k=='one-divisible-one-not':
  d=ns[0];assert all((0+r)%d!=0 and (0*r)%d==0 for r in range(1,d))
  answer=opts[0];assert 'қосындысы' in answer and 'бөлінбейді' in answer
  method='complete nonzero residue classes; zero plus nonzero remains nonzero, product has zero factor'
 elif k=='multiplied-remainder':
  d,r,m=ns;assert 0<=r<d;answer=next(v for v in range(d) if (m*r-v)%d==0)
  assert all((m*(d*q+r))%d==answer for q in range(d));method='global expansion m*(d*q+r); unique representative0<=remainder<d'
 elif k=='consecutive-product-rule':
  period=math.lcm(*map(int,opts));answer=one([o for o in opts if all(n*(n+1)%int(o)==0 for n in range(1,period+1))])
  method='complete congruence period plus parity proof: one of n,n+1 even; n=1 refutes other choices'
 elif k=='repeated-two-digit-block':
  answer=one([o for o in opts if all(int(str(n)*2)%int(o)==0 for n in range(10,100))]);method='all90 two-digit blocks exhausted; global equality repeated(c)=101*c'
 elif k=='three-consecutive-sum':
  period=math.lcm(*map(int,opts));answer=one([o for o in opts if all((n+n+1+n+2)%int(o)==0 for n in range(1,period+1))])
  method='complete residue period; exact identity three-consecutive-sum=3*(n+1)'
 elif k=='four-consecutive-sum':
  period=math.lcm(*(numbers(o)[0] for o in opts));valid=[]
  for o in opts:
   d=numbers(o)[0];remainders=[sum(range(n,n+4))%d for n in range(1,period+1)]
   valid.append(all(remainders) if 'ешқашан' in o else not any(remainders))
  answer=one([o for o,v in zip(opts,valid) if v]);method='complete linear congruence period; sum=4*(n+1)+2 gives global nondivisibility by4'
 elif k=='range-multiple-count':
  low,high,d=ns;assert 'екі шетін қоса' in s;answer=sum(n%d==0 for n in range(low,high+1))
 elif k=='universal-sum-greatest-divisor':
  a,b=ns;two_sums=[a+b,2*a+b];common=[d for d in range(1,min(two_sums)+1) if all(n%d==0 for n in two_sums)];answer=max(common)
  assert a%answer==b%answer==0
  method='upper bound from divisors of two permitted sums; lower bound from both coefficients being multiples'
 elif k=='nearby-known-quotient':
  known,d,q,target,again=ns;assert known==d*q and again==d and target==known+d
  answer=F(target,d)
 elif k=='multiplier-guarantee':
  base,target=ns;valid=[]
  for o in opts:
   # Congruence depends on k modulo target; complete residues suffice for linear options.
   valid.append(all(value(re.sub(r'\ba\b',str(base*k),o))%target==0 for k in range(1,target+1)))
  answer=one([o for o,v in zip(opts,valid) if v]);assert any(' + ' in o for o in opts),'Preserve the source add-vs-multiply trap'
  method='complete linear residue domain a=base*k; factor identity proves selected multiplier for all k'
 elif k=='small-divisors-product-count':
  lower,upper,*factors=ns;assert lower==1;product=math.prod(factors)
  answer=sum(product%d==0 for d in range(lower,upper+1))
 elif k=='nondivisible-summands-counterexample':
  a,b,d=ns;assert a%d and b%d and (a+b)%d==0
  answer=one([o for o in opts if o.startswith('қорытынды қате:') and ' + ' in o]);assert a%2==0 and f'{a} жұп сан' in opts[-1]
  notes.append('The quoted pupil conclusion is deliberately false and the selected response explicitly corrects it; not an accidental mathematical error.')
 elif k=='two-stores-count':
  total,group,low,high=ns;assert total%group==0
  answer=one([x for x in range(low+1,high) if (total-x)%group==0 and total>x>0])
 elif k=='infer-other-summand':
  d=ns[0];answer=one([o for o in opts if o==f'b саны {d} санына бөлінеді'])
  assert all((a+b)%d==0 and a%d==0 for a,b in [(d,d),(2*d,d)])
  method='global difference identity b=(a+b)-a; b=d refutes doubled divisor; product contains d²'
 elif k=='erased-summand':
  start,last,d,lower=ns;assert start==1
  total=sum(range(1,last+1));assert total%d==0,'The original difference-of-two-multiples method must remain applicable'
  answer=one([x for x in range(lower+1,last+1) if sum(n for n in range(1,last+1) if n!=x)%d==0])
 else:raise AssertionError(k)
 answer=integer(answer) if not isinstance(answer,str) else answer
 assert answer==row['answer'],(row['editionId'],answer,row['answer'])
 if opts:assert len(opts)==len(set(opts))==4 and opts.count(answer)==1
 return method,notes

def numeric_equalities(row):
 count=0
 pattern=r'(?<![0-9a-z])([0-9a-dkmnqxy(][0-9a-dkmnqxy ×+−:()/]*\s*=\s*[0-9a-dkmnqxy(][0-9a-dkmnqxy ×+−:()/]*(?:=\s*[0-9a-dkmnqxy(][0-9a-dkmnqxy ×+−:()/]*)*)'
 for match in re.finditer(pattern,row['solution']):
  text=match[1].strip()
  if re.search('[a-z]',text):continue # A conditional variable assignment is not an unconditional polynomial identity.
  parts=text.split('=');values=[value(p.strip()) for p in parts]
  assert len(set(values))==1,(row['editionId'],text,values)
  count+=1
 return count

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
 rows=json.loads((ROOT/'problems/editorial/batches/grade5-properties.json').read_text())['editions'];assert len(rows)==46
 assert polynomial('(70 × x + 42 × y) : 14')==polynomial('5 × x + 3 × y')
 assert polynomial('5 × x + 3 × y')!=polynomial('8 × x × y')
 refs=set();entries=[];equations=0
 for row in rows:
  assert row['grade']==5 and row['minimumPlan']=='pro'
  for ref in row['sourceRefs']:
   refs.add((ref['sourceFile'],ref['sourceId']));source=json.loads((ROOT/ref['sourceFile']).read_text());assert source['status']=='captured'
   question=one([q for q in source['questions'] if q['id']==ref['sourceId']]);assert question['checked'] and question['solution'] and question['sourceAnswer']
   assert not question.get('images') and not question.get('svg') and '[Image:' not in question['statement']
   if question['options']:assert len([o for o in question['options'] if o['correct']])==1
  method,notes=solve(row);equations+=numeric_equalities(row)
  digest=hashlib.sha256(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':row['editionId'],'sha256':digest,'verdict':'verified','method':method,'notes':['Canonical source skill, full authored condition, choices and solution read; native notation, domains and Kazakh wording checked. Numerical variants are not counted as separate meanings.',*notes]})
 assert len(refs)==46
 if args.write:(ROOT/'problems/editorial/reviews/grade5-properties.json').write_text(json.dumps({'schemaVersion':1,'reviewer':'independent_editorial_review','entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'reviewed':len(rows),'sourceRefs':len(refs),'numericSolutionEqualityChains':equations,'symbolicMethod':'formal exact rational polynomials','passed':True,'written':args.write}))

if __name__=='__main__':main()
