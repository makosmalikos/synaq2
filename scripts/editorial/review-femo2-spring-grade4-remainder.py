"""Read all six full frozen/new conditions and complete official/new solutions.
Separate exact computational review by same root author, not secondhumanreviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='femo2-spring-grade4-remainder';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
spec=importlib.util.spec_from_file_location('winter5',ROOT/'scripts/editorial/review-femo2-winter-grade5.py');W=importlib.util.module_from_spec(spec);spec.loader.exec_module(W);K=W.K;E=W.E;H=W.H;one=H.one

def exact(s):return W.exact(re.sub(r'(?<=\d)[ \u00a0]+(?=\d)', '',s))
def prime(x):return x>=2 and all(x%d for d in range(2,math.isqrt(x)+1))
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s)
 if i==1:
  if src:assert s.count('екі есе көп')==2;ratioB,ratioG,girls=F(2),F(2),one(n)
  else:ratioB,ratioG,girls=n
  mixed=girls/(2*ratioG+1);gg=ratioG*mixed;bb=ratioB*gg;assert all(v>0 and v.denominator==1 for v in[mixed,gg,bb]);out=2*bb+mixed;assert 2*gg+mixed==girls;proof={'mixedDesks':str(mixed),'girlPairDesks':str(gg),'boyPairDesks':str(bb),'allPrintedRatiosAndGirlsMatched':True,'boyCountTarget':str(out)}
 elif i==2:
  bound=100 if src else int(one(n));pairs=set();tested=[]
  for x in range(10,100):
   a,b=divmod(x,10);y=10*b+a;valid=a!=b and b!=0 and prime(x)and prime(y)and x<bound and y<bound;tested.append((x,y,valid))
   if valid:pairs.add(tuple(sorted([x,y])))
  out=F(len(pairs));proof={'allTwoDigitOriginalNumbersChecked':90,'allCandidateReversedNumbersChecked':tested,'unorderedDistinctPrimePairs':sorted(pairs),'bothNumbersStrictUpperBound':bound,'unorderedPairCountTarget':str(out),'fullSourceTwoDigitDomainExplicitlyNarrowedInNew':not src}
 elif i==4:

  if not src:assert n[2]==1;n=n[:2]+n[3:]
  sheetsPerStack,stackCm,digits=n;assert sheetsPerStack.denominator==digits.denominator==1 and min(n)>0;used=0;pages=0
  while used<digits:pages+=1;used+=len(str(pages))
  assert used==digits and pages%2==0;sheets=F(pages,2);out=sheets/sheetsPerStack*stackCm;assert sum(len(str(x))for x in range(1,pages+1))==digits;proof={'allPrintedPageNumbersEnumerated':pages,'allDigitsCounted':used,'twoNumberedFacesPerSheet':2,'sheets':str(sheets),'stackSheets':str(sheetsPerStack),'stackCm':str(stackCm),'thicknessCmTarget':str(out),'coverExcludedExplicitlyInNew':not src}
 elif i==5:
  total=int(one(n));values=[x for x in range(100,1000)if sum(map(int,str(x)))==total];byHundreds={a:sum(x//100==a for x in values)for a in range(1,10)};out=F(len(values));proof={'all900ThreeDigitNumbersChecked':900,'fullMatchingNumbers':values,'countsByNonzeroHundredsDigit':byHundreds,'digitSum':total,'numberCountTarget':str(out)}
 elif i==8:
  if src:assert'жыл соңында'in s;fullMonths=F(12);fullCash,months,partCash=n
  else:fullMonths,fullCash,months,partCash=n;assert'Әр айдың еңбекақысы бірдей'in s
  assert 0<months<fullMonths and fullCash>partCash;monthly=(fullCash-partCash)/(fullMonths-months);out=monthly*fullMonths-fullCash;assert out>0 and monthly*months==out+partCash;proof={'wholeMonths':str(fullMonths),'workedMonths':str(months),'monthlyWage':str(monthly),'itemPriceTarget':str(out),'fullContractValue':str(monthly*fullMonths),'partialContractValue':str(monthly*months),'bothOriginalContractEquationsConserved':True,'proportionalMonthlyPayExplicitInNew':not src}
 elif i==9:
  divisor,limit=map(int,n);assert divisor>0 and limit>0;parity=1 if'тақ'in s else 0;assert('тақ'in s)or('жұп'in s);ceiling=max(99,limit);groups={i:[]for i in range(4)};allTrue=[]
  for x in range(1,ceiling+1):
   truth=[10<=x<=99,x%divisor==0,x<=limit,x%2==parity]
   if sum(truth)==3:groups[truth.index(False)].append(x)
   if all(truth):allTrue.append(x)
  out=F(sum(map(len,groups.values())));proof={'allNaturalCandidatesThrough':ceiling,'aboveCeilingAtLeastTwoClaimsFalse':True,'divisor':divisor,'upperLimit':limit,'parity0Even1Odd':parity,'allExactlyOneFalseNumbersByFalseClaim':groups,'allFourTrueExcluded':allTrue,'exactlyThreeTrueCountTarget':str(out)}
 else:raise AssertionError(i)
 assert exact(r['answer'])==out,(i,src,proof,r['answer']);proof['answerChecked']=True;return proof

def mutation(r,i):
 a,b={1:('15 қыз','20 қыз'),2:('90-нан','70-тен'),4:('1332 цифр','1452 цифр'),5:('қосындысы 7','қосындысы 8'),8:('9 ай','8 ай'),9:('60-тан','50-ден')}[i];assert a in r['statement'];return{**r,'statement':r['statement'].replace(a,b)}
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==6;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['sourceAnswer']is None and not q['options']and not q['images']and q['solution'];answer=one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip()
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  for bad in[{**r,'answer':'9999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError,IndexError,TypeError):pass
   else:raise AssertionError(('semanticmutationaccepted',i))
  assert r['grade']==4 and r['minimumPlan']=='pro'and r['statement']!=q['statement']and not r.get('options')and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[exact(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedsolutionequality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Read all6full frozen/newconditions and full official/newsolutions. Actualprinteddesk ratios/children, all90two-digitprime/reversal domains withunorderedpairdedup and explicitnewbound, everyprintedpagenumberdigit plus2faces/sheet, all900digit triples, bothconstantmonthcontracts and allglobalnaturaltruth cases includingabove-domain impossibility independently checked. No separatehumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rs.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':6,'fullSourceNewConditionsAndSolutionsRead':6,'sourceKeysNotCaptured':6,'wrongKeysRejected':6,'printedSemanticCanariesRejected':6,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':6,'nativeFigures':0,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
