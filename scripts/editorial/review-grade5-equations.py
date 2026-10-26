"""Full saved/new conditions, official/authored solutions and all MCQs reviewed.
Exact rational-polynomial roots, denominator exclusions and explicit domains;
independent word ledgers. Same root authored both: separate computational
review only, not a separate human/agent review. No author JS/specs/params oracle.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-equations.json';REPORT='problems/editorial/reviews/grade5-equations.json'
sp=importlib.util.spec_from_file_location('polynomials',ROOT/'scripts/editorial/review-grade5-simplification.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one,expr,calc=H.one,H.expr,H.calc
def grouped(s):
 s=str(s)
 while re.search(r'\d[ \u00a0]\d{3}(?!\d)',s):s=re.sub(r'(\d)[ \u00a0](\d{3})(?!\d)',r'\1\2',s)
 return s
def nums(s):return H.nums(grouped(s))
def options(r):return H.options(r)
def parts(s,source):return H.H.math_parts(s,source)
def equation(s,source):return one(parts(s,source))if not source else next(p for p in parts(s,True)if '='in p)
def eq_sides(e,env=None):
 a,b=H.math(grouped(e)).split('=');return expr(a,env),expr(b,env)
def at(e,value,env=None):
 a,b=eq_sides(e,env);variables=set(v for p in[a.n,a.d,b.n,b.d]for monomial in p for v in monomial);var=one(variables)
 try:L,R=a.value({var:value}),b.value({var:value})
 except ZeroDivisionError:return False,None,None
 return L==R,L,R
def roots(e,env=None,positive=False):
 a,b=eq_sides(e,env);p=a-b;variables=set(v for q in[p.n,p.d]for monomial in q for v in monomial)
 if not p.n:
  assert not variables  # This batch's all-roots case has no denominator holes.
  return 'all'
 var=one(variables);assert set(p.n)<={(),(var,),(var,var)}
 c=p.n.get((),F(0));linear=p.n.get((var,),F(0));square=p.n.get((var,var),F(0));candidates=[]
 if square:
  assert linear==0;area=-c/square;assert area>0
  num,den=math.isqrt(area.numerator),math.isqrt(area.denominator);assert num*num==area.numerator and den*den==area.denominator
  candidates=[F(num,den),F(-num,den)]
 elif linear:candidates=[-c/linear]
 for x in candidates:
  # Cross-multiplication must never admit a zero of an original denominator.
  try:assert a.value({var:x})==b.value({var:x})
  except ZeroDivisionError:continue
 return [x for x in candidates if x.denominator==1 and(x>0 if positive else x>=0)and at(e,x,env)[0]]
def numeric(r,wanted):
 assert nums(r['answer'])==[wanted],(r['answer'],wanted)
 if options(r):assert sum(nums(o)==[wanted]for o in options(r))==1
 return str(wanted)
def tuple_answer(r,wanted):
 assert nums(r['answer'])==wanted,(r['answer'],wanted)
 assert sum(nums(o)==wanted for o in options(r))==1
 return list(map(str,wanted))
def choice(r,predicate):
 wanted=one(o for o in options(r)if predicate(o));assert H.math(wanted)==H.math(r['answer']);return wanted
def solve(r,i,source=False):
 s=r['statement'];n=nums(s);proof={'printedNumbers':list(map(str,n))}
 if i in{1,7,37}:
  expected={1:('Бөлінгішті бөліндіге бөлу керек','Бөлінгішті бөліндіге бөлеміз'),7:('Айырмаға азайтқышты қосу керек','Айырма мен азайтқышты қосамыз'),37:('Әріптің теңдеуді тура теңдікке айналдыратын мәні','Белгісіздің орнына қойғанда екі жақты тең ететін мәнін')}[i][0 if source else 1]
  proof['answer']=choice(r,lambda o:o==expected)
  if i!=37:proof['exampleRoot']=str(one(roots(equation(s,source))))
  return proof
 if i==5:
  def valid(o):
   if '='not in o:return False
   a,b=eq_sides(o);return bool({v for p in[a.n,a.d,b.n,b.d]for m in p for v in m})
  proof['answer']=choice(r,valid);return proof
 if i in{6,10,14}:
  value=n[0];outcomes=[]
  for o in options(r):
   yes,L,R=at(o,value);outcomes.append({'equation':o,'holds':yes,'left':str(L),'right':str(R)})
  proof.update(answer=choice(r,lambda o:at(o,value)[0]),everyMCQSubstitution=outcomes);return proof
 if i==15:
  count,fixed,total=n[:3];expected=f'{count}*x+{fixed}={total}';a,b=eq_sides(expected)
  proof['answer']=choice(r,lambda o:(lambda x,y:(x-y).equals(a-b))(*eq_sides(o)));proof['costEquation']=expected;return proof
 if i==19:
  gap,years,total=n;young=(total-gap-2*years)/2;old=young+gap;assert young>0 and young.denominator==1
  proof['answer']=tuple_answer(r,[young,old]);proof['futureAges']=list(map(str,[young+years,old+years]));assert young+old+2*years==total;return proof
 if i==22:
  original=equation(s,source);baseline=one(roots(original));
  steps=re.findall(r'([1-4])-қадам:\s*\$([^$]+)\$',s)if source else re.findall(r'([1-4])\)\s*([^;]+)',s)
  assert len(steps)==4;equivalence=[]
  for _,e in steps:
   # Last statement is followed by prose; capture only a complete arithmetic equation.
   e=re.split(r'\.\s|\.(?=$)',e)[0];equivalence.append(roots(e)==[baseline])
  first=next(j+1 for j,v in enumerate(equivalence)if not v);assert first==3
  proof.update(answer=choice(r,lambda o:nums(o)==[F(first)]),stepEquivalence=equivalence,correctRoot=str(baseline));return proof
 if i==26:
  proof.update(answer=choice(r,lambda o:roots(o)==[]),allMCQRoots=[list(map(str,roots(o)))for o in options(r)]);return proof
 if i==27:
  books,pens,notes,total,factor,discount=n[:6];base=(total+notes*discount)/(books*factor+pens+notes);notebook=base-discount;out=factor*base
  assert min(base,notebook,out)>0 and all(x.denominator==1 for x in[base,notebook,out])
  assert books*out+pens*base+notes*notebook==total;proof['priceLedger']={'basePen':str(base),'notebook':str(notebook),'requestedAlbumOrBook':str(out),'verifiedTotal':str(total)}
 elif i==28:
  mother,daughter,ratio=n;out=(mother-ratio*daughter)/(ratio-1);assert out>0 and out.denominator==1 and mother+out==ratio*(daughter+out)
  proof['futureAges']=list(map(str,[mother+out,daughter+out]))
 elif i==30:
  gap=n[0];assert source or n[1]==12;out=gap/11;assert out>0 and out.denominator==1;proof['yearMonthLedger']={'childYears':str(out),'childMonthsAndGrandparentYears':str(out*12),'differenceYears':str(gap)}
 elif i==31:
  total,transfer,ratio=n;after=total/(1+ratio);out=after+transfer;second=total-out;assert min(after,second)>0 and second+transfer==ratio*after
  proof['transferLedger']={'initialFirst':str(out),'initialSecond':str(second),'finalFirst':str(after),'finalSecond':str(second+transfer)}
 elif i==33:
  front,back=n;out=front+back-1;assert out>0;proof['queueCounts']=list(map(str,[front-1,F(1),back-1]))
 elif i==36:
  total,factor,less=n;first=(total+less)/(1+2*factor);second=factor*first;third=second-less;assert min(first,second,third)>0 and first.denominator==1 and first+second+third==total
  proof['answer']=tuple_answer(r,[first,second,third]);proof['orderedPopulationLedger']={'total':str(total),'ratio':str(factor),'less':str(less)};return proof
 elif i==42:
  factor,total=n;out=total/(1+factor);assert out>0 and out.denominator==1;proof['animalGroups']=list(map(str,[out,factor*out]))
 elif i==43:
  # The repeated grade label 5 in the source is not a population quantity.
  total,extra,factor=nums(re.sub(r'\b5\s*«','«',s));base=(total-extra)/(2+factor);out=factor*base;assert base>0 and base.denominator==1
  assert base+(base+extra)+out==total;proof['classTreeLedger']=list(map(str,[base,base+extra,out]))
 elif i==44:
  total,shift=n;after=total/2;first,second=after+shift,after-shift;assert second>0 and first.denominator==1
  proof.update(answer=tuple_answer(r,[first,second]),equalAfter=str(after));return proof
 else:
  # Read the actual printed equation, or independently construct a word equation.
  env=None
  if i==13:
   hours,extra,total=n[:3];e=f'{hours}*x+{extra}={total}'
  elif i==18:
   factor,less,total=n[:3];e=f'{factor}*x-{less}={total}'
  elif i==25:
   given,shelves,each=n[:3];e=f'x-{given}={shelves}*{each}'
  elif i==35:
   add,factor,less,result=n[:4];e=f'(x+{add})*{factor}-{less}={result}'
  else:e=equation(s,source)
  if i==29:env=H.H.assignments(s);assert set(env)=={'a'}and env['a']>0
  found=roots(e,env,positive=i in{34,45});proof.update(printedOrIndependentlyConstructedEquation=e,admissibleRoots=found if found=='all'else list(map(str,found)))
  if i==20:
   assert found==[]
   if not source:assert'нөл және оң натурал'in s
   proof['answer']=choice(r,lambda o:'түбірі жоқ'in o);return proof
  if i==32:
   assert found=='all'
   if not source:assert'нөл және оң натурал'in s
   proof['answer']=choice(r,lambda o:'Кез келген'in o);return proof
  out=one(found)
  if i==3:
   proposed=one(H.H.assignments(s).values());assert not at(e,proposed)[0]
   proof['answer']=choice(r,lambda o:o.startswith('Қате')and nums(o)==[out]);proof['rejectedProposed']=str(proposed);return proof
 proof['answer']=numeric(r,out);return proof
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==47;entries=[];evidence=[];canaries=0;arith=0
 for i,r in enumerate(rows):
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());q=one(q for q in cap['questions']if q['id']==ref['sourceId']);assert cap['grade']==5 and cap['status']=='captured'and q['checked']and not q.get('images')and not q.get('svg')
  try:sourceProof=solve({**q,'answer':q['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if q.get('options'):assert H.math(one(o['text']for o in q['options']if o['correct']))==H.math(q['sourceAnswer'])
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution'])
  if not options(r):assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  else:assert len(options(r))==len(set(options(r)))==4 and options(r).count(r['answer'])==1
  pattern=r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+−×÷]\s*\d+)+)\s*=\s*(-?\d+)(?!\d|\s*[+−×÷*/A-Za-z])'
  for m in re.finditer(pattern,r['solution']):
   before=r['solution'][:m.start()].rstrip()
   # Do not mistake the tail of (x + 9) × 6 − 54 for a standalone 6 − 54.
   # Original full equation substitutions are separately proved above.
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert calc(m[1])==F(m[2]),('solution equality',i,m.group());arith+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError,StopIteration):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  bad=copy.deepcopy(r)
  if i in{1,2,5,7,17,20,22,26,32,35,37,41}:bad['options'][bad['options'].index(bad['answer'])]='INVALID_OPTION'
  elif i in{34,45}:bad['statement']=bad['statement'].replace('109','128')if i==34 else bad['statement'].replace('= 27','= 28')
  elif i==29:bad['statement']=bad['statement'].replace('a = 2','a = 3')
  else:
   m=re.search(r'\d+',bad['statement']);assert m;bad['statement']=bad['statement'][:m.start()]+str(int(m.group())+1)+bad['statement'][m.end():]
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError,KeyError,ZeroDivisionError,StopIteration):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'rewritten':proof,'savedSource':sourceProof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'full source/new text, official/authored solutions and all MCQs; exact rational polynomial roots with original denominator checks and domains, independent printed word ledgers; not separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let f=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){f++;walk(n.numerator);walk(n.denominator)}else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction')}}for(const r of rows)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rows.map(r=>[r.editionId,editionHash(r)]),fractions:f}));"
 check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':47,'newlyCoveredSourceOccurrences':46,'previouslyDifferentSkillReferenceCorrected':1,'findings':0,'allSourceNewConditionsSolutionsMCQsRead':47,'wrongKeysRejected':47,'printedGivensOrTargetsCanariesRejected':canaries,'newSolutionNumericEqualitiesVerified':arith,'exactPolynomialRootsAndDenominatorExclusions':True,'pythonJavaScriptHashesMatched':47,'nativeFractions':check['fractions'],'separateHumanReviewer':False}
 report={'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','batch':BATCH,'scope':__doc__,'summary':summary,'resolvedSourceFindings':[{'sourceId':'4aad7a8c53b157a9','issue':'The previous linked edition core-balance-two-sides has variables on both sides, unlike the saved single unknown multiplier 14x=98.','resolution':'Added single-unknown-multiplier, retaining the old different-skill edition as additional material. This is 47 editions but only 46 newly covered occurrences.'}],'evidence':evidence,'entries':entries}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary,ensure_ascii=False))
if __name__=='__main__':main()
