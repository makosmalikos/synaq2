"""Full25source/new conditions, full official/new solutions and all14MCQ sets
read. Two source svg arrays are KaTeX radical glyphs only, not semantic figures;
not reused. Exact native arithmetic/series/roots/repeating rational values and
integer factorials checked by same root author in a separate printed-input
checker. No separate human reviewer; no JS parameter/answer oracle.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-expression3';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('expression12',ROOT/'scripts/editorial/review-collection-expression12.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H);one=H.one

def plain(s):return H.plain(s.replace('\\cfrac','\\dfrac'))
def exact(s):
 s=plain(s)
 def square(m):n=int(m[1]);r=math.isqrt(n);assert r*r==n;return str(r)
 s=re.sub(r'\\sqrt\{(\d+)\}',square,s);s=re.sub(r'√(\d+)',square,s)
 while '|'in s:
  m=re.search(r'\|([^|]+)\|',s);assert m;s=s[:m.start()]+'('+str(abs(H.exact(m[1])))+')'+s[m.end():]
 return H.exact(s)
def parts(s,source):return H.H.math_parts(s,source)

def solve(r,i,source=False):
 s=r['statement'];p=plain(s);proof={}
 if i in(1,2):
  period=one(re.findall(r'0[,.]\((\d{2})\)',p));out=F(int(period),99);proof={'repeatBlock':period,'shiftSubtractIdentity':[100,1,int(period)],'reducedNumerator':out.numerator,'reducedDenominator':out.denominator}
 elif i in(3,4):
  if source:fractions=[exact(f)for f in parts(s,True)]
  else:fractions=[F(int(a),int(b))for a,b in re.findall(r'\((\d+)/(\d+)\)',s)]
  assert len(fractions)==len(set(fractions))==4;out=min(fractions)if i==3 else max(fractions);proof={'allFourExactValues':list(map(str,fractions)),'halfComparison':[str(v-F(1,2))for v in fractions],'askedQuantity':'minimum'if i==3 else'maximum'}
 elif i in(5,6,7,8,14,15,16,25):
  target=one(parts(s,source));out=exact(target);proof={'printedExpression':target,'exactValue':str(out)}
  if i in(7,8):
   radicands=list(map(int,re.findall(r'\\sqrt\{(\d+)\}',target)))if source else list(map(int,re.findall(r'√(\d+)',target)));assert len(radicands)==3;roots=[math.isqrt(v)for v in radicands];assert all(a*a==b for a,b in zip(roots,radicands));proof['eachNonnegativePerfectRoot']=list(zip(radicands,roots))
 elif i==9:
  target=one(parts(s,source));ns=list(map(int,re.findall(r'\d+',target)));assert ns[:3]==[1,3,5]and len(ns)==4 and ns[-1]%2==1;values=list(range(1,ns[-1]+1,2));out=F(sum(values));assert len(values)**2==out;proof={'allOddSummands':values,'squareCrossCheck':len(values)**2}
 elif i==10:
  ns=list(map(int,re.findall(r'\d+',one(parts(s,source)))));first,second,third,fourth,lastTwo,lastOne=ns;assert first%2==0 and second==first-1 and third==first-2 and fourth==first-3 and(lastTwo,lastOne)==(2,1);pairs=[(a,a-1)for a in range(first,1,-2)];out=F(sum(a-b for a,b in pairs));assert all(a-b==1 for a,b in pairs);proof={'everyAlternatingPair':pairs}
 elif i in(11,12,13):
  target=one(parts(s,source));ns=list(map(int,re.findall(r'\d+',target)));assert len(ns)==9;triples=[ns[j:j+3]for j in range(0,9,3)];assert all(a==1 and c==b+1 for a,b,c in triples);a=triples[0][1];last=triples[-1][1];assert triples[1][1]==a+1 and last>a+1;terms=[F(1,k*(k+1))for k in range(a,last+1)];out=sum(terms,F(0));assert out==F(1,a)-F(1,last+1)
  for k in range(a,last+1):assert F(1,k*(k+1))==F(1,k)-F(1,k+1)
  proof={'allReciprocalProductTerms':[str(v)for v in terms],'firstK':a,'lastK':last,'telescopingBoundaryDifference':str(F(1,a)-F(1,last+1))}
 elif i in(17,18):
  target=parts(s,True)[0]if source else s;ns=list(map(int,re.findall(r'\d+',plain(target))));a,n,b,m=ns;x=pow(a,n,10);y=pow(b,m,10);out=F((x+y)%10);proof={'firstPowerLastDigit':x,'secondPowerLastDigit':y,'digitSumBeforeModulo':x+y,'independentModularExponentiation':True}
 elif i in(19,20):
  n=int(one(set(re.findall(r'(\d+)!',s))));fives=[];twos=[]
  for factor in range(1,n+1):
   v=factor;c=0
   while v%5==0:v//=5;c+=1
   fives.append(c);v=factor;c=0
   while v%2==0:v//=2;c+=1
   twos.append(c)
  factorial=str(math.factorial(n));trailing=len(factorial)-len(factorial.rstrip('0'));out=F(min(sum(fives),sum(twos)));assert out==trailing;proof={'everyFactorFiveValuation':fives,'totalTwos':sum(twos),'totalFives':sum(fives),'fullIntegerFactorialTrailingZeros':trailing,'factorialN':n}
 elif i in(21,22):
  target=one(parts(s,source));ns=list(map(int,re.findall(r'\d+',target)));assert len(ns)==9;triples=[ns[j:j+3]for j in range(0,9,3)];assert all(a==b==1 for a,b,c in triples);first,second,last=[t[2]for t in triples];assert second==first+1 and last>second;minus=i==21;terms=[F(k-1 if minus else k+1,k)for k in range(first,last+1)];out=F(1)
  for t in terms:out*=t
  boundary=F(first-1,last)if minus else F(last+1,first);assert out==boundary;proof={'everyTelescopingProductFactor':list(map(str,terms)),'firstDenominator':first,'lastDenominator':last,'boundaryResult':str(boundary)}
 elif i in(23,24):
  first,period=one(re.findall(r'0[,.](\d)\((\d)\)',p));first=int(first);period=int(period);out=F(10*first+period-first,90);proof={'nonrepeatDigit':first,'repeatDigit':period,'subtractShiftNumerator':10*first+period-first,'subtractShiftDenominator':90,'reducedNumerator':out.numerator,'reducedDenominator':out.denominator}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,out,r['answer']);proof['answer']=str(out)
 if r.get('options'):
  values=[exact(o['text']if isinstance(o,dict)else o)for o in r['options']];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['allFourOptionValues']=list(map(str,values))
  if source:assert [j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
 return proof

def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('0,(26)','0,(27)'),2:('0,(57)','0,(58)'),3:('(2/7)','(3/7)'),4:('(7/12)','(9/12)'),5:('−2 −','−3 −'),6:('−17 −','−18 −'),7:('√225','√256'),8:('√100','√121'),9:('… + 21','… + 23'),10:('52 − 51 + 50 − 49','54 − 53 + 52 − 51'),11:('17 × 18','18 × 19'),12:('8 × 9','9 × 10'),13:('12 × 13','13 × 14'),14:('3 + (1/','4 + (1/'),15:('3 + (1/','4 + (1/'),16:('2 + (1/','3 + (1/'),17:('¹⁴⁰³','¹⁴⁰⁴'),18:('¹⁶⁰¹','¹⁶⁰²'),21:('(1/18)','(1/19)'),22:('(1/32)','(1/33)'),23:('0,6(7)','0,6(8)'),24:('0,8(4)','0,8(5)'),25:('2033','2034')}
 if i in(19,20):s=s.replace('76','81')if i==19 else s.replace('119','124')
 else:a,c=pairs[i];assert a in s,(i,a);s=s.replace(a,c,1)
 assert s!=b['statement'];b['statement']=s;return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25;entries=[];evidence=[];equations=0;mcqs=0;missing=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images'];tail=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));answer=re.sub(r'^[A-D]\)\s*','',tail).strip();missing+=q['sourceAnswer']is None
  if i in(7,8):assert len(q['svg'])==8 and all('viewBox="0 0 400000 1080"'in svg and'<image'not in svg for svg in q['svg'])
  else:assert not q['svg']
  try:src=solve({**q,'answer':q['sourceAnswer']or answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and bool(r.get('options'))==bool(q['options'])and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer']);mcqs+=bool(q['options'])
  for bad in({**r,'answer':'999999999'},mutation(r,i)):
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹√|()+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   ss=[s.strip()for s in match[0].split('=')]
   if len(ss)<2 or not all(ss):continue
   try:vs=[exact(s)for s in ss]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(vs))==1,('printed equality',i,match[0]);equations+=len(vs)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All25full source/new conditions and full official/new solutions/all14MCQs read. Exact Fraction for every real series summand/product factor, all abs/perfect roots/decimal shifts/nested reciprocals/choices, modular exponentiation, per-factor2/5valuations crosschecked against full integer factorial trailing zeros; same root author, not separate human review.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";check=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(check['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':25,'allSourceNewConditionsFullSolutionsRead':25,'sourceKeysNotCaptured':missing,'sourceAndNewMCQSets':mcqs,'allSourceAndNewNumericOptionsChecked':mcqs*8,'wrongKeysRejected':25,'printedSemanticCanariesRejected':25,'printedSolutionEqualitiesVerified':equations,'nativeFractions':check['fractions'],'sourceRadicalGlyphsReplacedByNativeUnicode':2,'wholeFactorialCrossChecks':2,'everySeriesTermAndProductFactorChecked':True,'pythonJavaScriptHashesMatched':25,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
