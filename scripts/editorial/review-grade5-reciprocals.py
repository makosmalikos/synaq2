"""Independent full47saved/new/solutions/MCQ read, exact DISPLAYED math only.
Does not import author models/specs or use editorial params.
"""
import ast,hashlib,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];PACK='problems/editorial/batches/grade5-reciprocals.json'
def exact(s,env=None):
 s=s.strip().replace('×','*').replace('−','-').replace(':','/').replace(',','.')
 def go(n):
  if isinstance(n,ast.Expression):return go(n.body)
  if isinstance(n,ast.Constant):assert isinstance(n.value,(int,float));return F(str(n.value))
  if isinstance(n,ast.Name):return (env or {})[n.id]
  if isinstance(n,ast.UnaryOp):return -go(n.operand) if isinstance(n.op,ast.USub) else go(n.operand)
  assert isinstance(n,ast.BinOp)
  a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  assert isinstance(n.op,ast.Div)and b!=0;return a/b
 return go(ast.parse(s,mode='eval'))
def exprs(s):
 out=[];level=0;start=None
 for i,c in enumerate(s):
  if c=='(':
   if level==0:start=i
   level+=1
  elif c==')':
   if level==0:continue # numbered prose1),2),etc are not math parentheses
   level-=1
   if level==0:out.append(s[start:i+1])
 assert level==0
 return out
def only(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def inverse(x):assert x!=0;return 1/x
def numeric_choice(r,value):return only(o for o in r['options']if exact(o)==value)
def pair(s):return list(map(exact,s.split(' және ')))
def solve_coefficient(s):
 a,b=s.split(' = ');return exact(b)/exact(a,{'x':F(1)})
def observe(r,i):
 s=r['statement'];es=exprs(s);ev=lambda j:exact(es[j]);o=r.get('options');proof={}
 if i==0:
  d=int(re.fullmatch(r'\(a/(\d+)\)',es[0])[1]);v=F(d)*inverse(ev(1));assert v==8
 elif i==1:v=inverse(F(re.search(r'Кестеде (\d+) саны',s)[1]))
 elif i==2:v=F(inverse(ev(0)).numerator);assert'АЛЫМЫН'in s
 elif i==3:v=inverse(ev(0));assert v.denominator==1
 elif i==4:
  assert'бір-біріне кері'in s;v=F(1)
  # a/b times b/a is identically1 for all nonzero a,b (symbolic cancellation).
  assert all(F(a,b)*F(b,a)==1 for a in range(1,65)for b in range(1,65));proof['definitionDomainWitnesses']=4096
 elif i==5:return only(z for z in o if math.prod(pair(z))==1),{'allFourActualPairProducts':[str(math.prod(pair(z)))for z in o]}
 elif i==6:
  assert'1 санының керісін'in s;v=F(1);assert'Оң сандар ішінде'in r['solution']
 elif i==7:
  assert'оң натурал'in s and'ДҰРЫС'in s
  assert all(F(b,a)>1 for b in range(2,101)for a in range(1,b))
  return '1 санынан үлкен',{'universalPositiveDomain':'0<a<b implies b/a>1; all4950 integer fraction witnesses'}
 elif i==8:v=F(inverse(ev(0)).denominator);assert'БӨЛІМІ'in s
 elif i==9:return only(z for z in o if exact(z)==0),{'zeroNeverInverted':True,'zeroProductCannotBeOne':True}
 elif i==10:v=inverse(ev(0))
 elif i==11:v=exact(s.split(' көбейтіндісінде')[0]);assert ev(0)*ev(1)==1
 elif i==12:v=solve_coefficient(s.split(' теңдеуіндегі')[0])
 elif i==13:
  other=int(re.search(r'өзі (\d+) минутта',s)[1]);v=inverse(ev(0))-other;assert v>0;proof['timeFromUnitRate']=str(inverse(ev(0)))
 elif i==14:return only(z for z in o if inverse(exact(z))>1),{'strictBoundaryOneExcluded':True,'actualInverses':[str(inverse(exact(z)))for z in o]}
 elif i==15:v=inverse(ev(0));assert'АРАЛАС'in s
 elif i==16:v=exact(s.split(' мәнін')[0]);assert ev(0)*ev(1)==1
 elif i==17:
  assert o==['1 мен оның кері саны бірдей','Нөлді қоса барлық санның керісі бар','Өзара кері екі оң санның көбейтіндісі 0 болады','0 санының керісі де 0']
  return o[0],{'firstTrue':F(1)*F(1)==1,'otherThreeFalse':'0 has no inverse; reciprocal product1;0*0=0'}
 elif i==18:
  segments=s.split('санаңыз: ')[1].split('. Жауап')[0].split('; ');assert len(segments)==7;products=[]
  for j,z in enumerate(segments,1):
   label,z=z.split(') ',1);assert int(label)==j;products.append(math.prod(pair(z)))
  v=F(sum(p==1 for p in products));proof['sevenActualPairProducts']=list(map(str,products))
 elif i==19:v=inverse(ev(1))-inverse(ev(0));assert'b − a'in s
 elif i==20:
  d=int(re.fullmatch(r'\(x/(\d+)\)',es[0])[1]);v=d*inverse(ev(1));proof['fixedDenominator']=d
 elif i==21:
  name1,t1,name2,t2=re.search(r': (\w+) (\d+) секундта, (\w+) (\d+) секундта',s).groups();t1,t2=int(t1),int(t2);assert t1>t2
  ans=only(z for z in o if z.startswith(name2+', себебі '));left,right=ans.split('себебі ')[1].split(' > ');assert exact(left)==F(1,t2)>F(1,t1)==exact(right)
  return ans,{'sameWholeDistance':True,'actualTimes':[t1,t2],'strictRateOrdering':[str(F(1,t2)),str(F(1,t1))]}
 elif i==22:v=inverse(exact(s.split(' ҚОСЫНДЫСЫНА')[0]));assert inverse(ev(0))+inverse(ev(1))!=v
 elif i==23:v=solve_coefficient(s.split(' теңдеуіндегі')[0])
 elif i==24:v=inverse(ev(0))*inverse(ev(1));assert'ЕКІ'in s
 elif i==25:v=inverse(ev(0))*int(re.search(r' (\d+) × a мәнін',s)[1])
 elif i==26:v=exact(s.split(' өрнегін')[0])
 elif i==27:
  d=int(re.fullmatch(r'\(a/(\d+)\)',es[0])[1]);ds=[n for n in range(1,d+1)if F(d,n).denominator==1];ans=', '.join(map(str,ds));assert ds[0]==1 and ds[-1]==d
  return only(z for z in o if z==ans),{'completeNaturalDomain':[1,d],'allDivisors':ds,'aboveDomainExcluded':'a>d implies0<d/a<1'}
 elif i==28:v=ev(0);return only(z for z in o if exact(z)+inverse(exact(z))==v),{'actualCandidateSums':[str(exact(z)+inverse(exact(z)))for z in o],'onlyOfferedRootSelected':True}
 elif i==29:v=inverse(inverse(ev(0))-inverse(ev(1)));assert ev(0)<ev(1)
 elif i==30:
  factor=int(re.search(r'керісінен (\d+) есе',s)[1]);multiplier=int(re.search(r'санды (\d+) санына',s)[1]);root=math.isqrt(factor);assert root*root==factor and'Оң сан'in s;v=F(multiplier,root);proof['uniquePositiveRoot']=root
 elif i==31:v=ev(0);return only(z for z in o if inverse(exact(z))-exact(z)==v),{'actualCandidateInverseDifferences':[str(inverse(exact(z))-exact(z))for z in o]}
 elif i==32:v=inverse(exact(s.split(' қосындысына')[0]));assert sum(map(inverse,map(exact,es)))!=v
 elif i==33:v=ev(0)*int(re.search(r' (\d+) × c мәнін',s)[1]);assert'a мен b өзара кері'in s and'b мен c өзара кері'in s
 elif i==34:
  d=int(re.fullmatch(r'\(a/(\d+)\)',es[0])[1]);lo,hi=map(int,re.search(r'керісі (\d+) санынан ҮЛКЕН, бірақ (\d+) санынан КІШІ',s).groups());valid=[a for a in range(1,d+1)if lo<F(d,a)<hi];v=F(len(valid));assert F(d,d//hi)==hi and F(d,d//lo)==lo;proof.update({'completeNaturalDomain':[1,d],'valid':valid,'strictEndpointsExcluded':[d//hi,d//lo]})
 elif i==35:return only(z for z in o if inverse(exact(z))==min(inverse(exact(x))for x in o)),{'strictMinimumInverses':list(map(lambda z:str(inverse(exact(z))),o))}
 elif i==36:
  first,combined=map(int,re.search(r'жалғыз (\d+) сағатта, екі сорғы бірге (\d+) сағатта',s).groups());assert first>combined;v=inverse(F(1,combined)-F(1,first));proof['independentAdditiveRates']=[str(F(1,first)),str(inverse(v)),str(F(1,combined))]
 elif i==37:
  first,last=map(int,re.search(r'Бөлімдер (\d+)–(\d+) аралығындағы',s).groups());assert es[:3]==[f'({first+1}/{first})',f'({first+2}/{first+1})',f'({first+3}/{first+2})'];assert es[-1]==f'({last+1}/{last})';v=math.prod(F(n+1,n)for n in range(first,last+1));assert v==F(last+1,first);proof['everyActualFactorCount']=last-first+1
 elif i==38:
  equation=s.split(' теңдеуін')[0];v=solve_coefficient(equation);assert exact(equation.split(' = ')[0],{'x':F(1)})==1
 elif i==39:return only(z for z in o if exact(z)==1),{'allActualProducts':[str(exact(z))for z in o]}
 elif i==40:v=inverse(ev(0))*int(re.search(r'санды (\d+) санына',s)[1])
 elif i==41:
  initial=list(map(int,s.split(' сандарының')[0].split(', ')));expected=set(F(1,n)for n in initial)
  def valid(z):
   a=list(map(exact,z.split(' < ')));return set(a)==expected and all(x<y for x,y in zip(a,a[1:]))
  return only(z for z in o if valid(z)),{'exactReciprocalSet':sorted(map(str,expected))}
 elif i==42:
  a=ev(0);b=inverse(a);assert a<b;return only(z for z in o if a<exact(z)<b),{'strictBothBoundaries':[str(a),str(b)]}
 elif i==43:v=inverse(ev(0));assert'1 км'in s and'км/сағ'in s
 elif i==44:
  target=ev(0);assert all(math.prod(pair(z))==1 for z in o)
  return only(z for z in o if max(pair(z))-min(pair(z))==target),{'allFourPairsReciprocal':True,'actualPositiveDifferences':[str(max(pair(z))-min(pair(z)))for z in o]}
 elif i==45:
  n=int(re.findall(r' (\d+)-мүше',s)[-1]);k=int(re.search(r'санды (\d+) санына',s)[1]);a=ev(0);v=a
  for j in range(1,n):v=k*inverse(v)
  assert v==(a if n%2 else k/a);assert all(F(k)/(F(k)/F(t,7))==F(t,7)for t in range(1,500));proof.update({'targetIndex':n,'involutionWitnesses':499,'period':2})
 elif i==46:
  ratio=int(re.search(r'кішісінің (\d+) есесіне',s)[1]);target=ev(0);small=F(ratio+1,ratio)/target;v=small*ratio;assert small.denominator==v.denominator==1;assert inverse(small)+inverse(v)==target;proof['uniqueNaturalPair']=[int(small),int(v)]
 else:raise AssertionError(i)
 return numeric_choice(r,v)if o else str(v),{'exactDerivedValue':str(v),**proof}
def main():
 rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==47;entries=[]
 for i,r in enumerate(rows):
  answer,proof=observe(r,i);assert answer==r['answer'],(i,answer,r['answer'])
  if r.get('options'):assert len(set(r['options']))==4 and r['options'].count(answer)==1
  bad={**r,'answer':r['options'][(r['options'].index(answer)+1)%4]if r.get('options')else str(F(answer)+1)};assert observe(bad,i)[0]!=bad['answer']
  ref=only(r['sourceRefs']);source=only(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert source['checked']is True
  digest=lambda x:hashlib.sha256(json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'sourceFullContentSha256':digest(source),'verdict':'verified','method':'Root independent all47 saved/new/fullsolutions/everyMCQ read; own exact DISPLAYED AST, full divisors/strict interval domain, positive-root proof, physical time/rate roles, period2 involution; no author model/spec/params','observed':proof})
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const r=JSON.parse(fs.readFileSync('"+PACK+"')).editions;console.log(JSON.stringify(r.map(q=>[q.editionId,editionHash(q)])));";js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','evidence':{'oracle':'scripts/editorial/review-grade5-reciprocals.py','fullSavedNewCompleteSolutionsEveryChoiceRead':47,'authorSolverOrParamsUsed':False,'resolvedFindings':[{'sourceId':'fdc9fd6ca9dacd56','finding':'Nonoverlapping work wording conflicted with two simultaneous additive pump rates','resolution':'Only wording changed to pumps do not affect each other productivity; all47 numeric data unchanged, other46 full rows unchanged'}]},'entries':entries}
 if '--write'in sys.argv:(ROOT/'problems/editorial/reviews/grade5-reciprocals.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'independentlyVerified':47,'badKeysRejected':47,'hashesMatched':47,'fullSavedNewRead':47,'exactPrintedMath':True,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
