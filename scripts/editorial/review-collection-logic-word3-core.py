"""First17full source/new conditions/full official/new solutions/all4MCQs read.
Same root author separate exact printed-data check, no separate human reviewer.
Last6visual tasks remain pending. Source square-addition implicit nonnegative
convention, shared origin and source13five-children/four-claims mismatch fixed.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-logic-word3-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def options(r):return[o['text']if isinstance(o,dict)else o for o in r['options']]
def equation_value(s):
 l,r=E.plain(s).split('=');return E.calc(l),E.calc(r)
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);parse=E.calc;proof={}
 if i==1:
  assert n[:3]==[0,1,2]and len(n)==4;high=int(n[-1]);out=F(sum(range(high+1)));assert out==F(high*(high+1),2);proof={'lastTerm':high,'termCountIncludingZero':high+1}
 elif i==2:
  if src:assert s.startswith('Бес маймыл');firstOutput,firstTime,targetOutput,targetTime=n;workers=F(5)
  else:workers,firstTime,firstOutput,targetTime,targetOutput=n
  rate=firstOutput/(workers*firstTime);out=targetOutput/(targetTime*rate);assert out.denominator==1 and out*targetTime*rate==targetOutput;proof={'firstWorkerCount':str(workers),'perWorkerPerMinute':str(rate),'targetOutput':str(targetOutput),'targetTime':str(targetTime),'requiredWorkerCount':str(out),'continuousGivenModelExplicitInRewrite':not src}
 elif i==3:
  target=n[-1];digits=re.findall(r'\d',p[0].split('=')[0]);assert len(digits)==7 and len(set(digits))==1;digit=digits[0];allLeft=[]
  for opt in options(r):
   lhs,rhs=E.plain(opt).split('=');assert re.findall(r'\d',lhs)==[digit]*7 and E.calc(rhs)==target;allLeft.append(E.calc(lhs))
  assert allLeft.count(target)==1;out=(target,target);parse=equation_value;proof={'sameDigit':digit,'printedDigitCountInEveryLeftSide':7,'allFourLeftValues':list(map(str,allLeft)),'targetRightValue':str(target),'onlyOneOfferedEqualityTrue':True}
 elif i==4:
  numbers=list(map(int,n));assert len(numbers)==3;out=F(math.lcm(*numbers));assert all(out%v==0 for v in numbers);assert not any(all(x%v==0 for v in numbers)for x in range(1,int(out)));proof={'threeInputs':numbers,'LCM':str(out)}
 elif i==5:
  clause=one(re.findall(r'^(.*?) (?:үшеуін|төртеуін)',s));names=re.split(r',\s*|\s+(?:мен|және)\s+',clause);assert len(names)==len(set(names))and len(names)in[3,4];perms=list(itertools.permutations(names));out=F(len(perms));assert out==math.factorial(len(names));proof={'distinctPeople':names,'allRowPermutations':perms}
 elif i in(6,8):
  target=p[0];assert not p[1:]or(src and p[1:]==['*'])
  if src:leading=re.findall(r'(\d)\*',target);assert len(leading)==2;total=F(target.split('=')[1]);symbol='*'
  else:pairs=re.findall(r'overline\((\d)([ab])\)',target);assert len(pairs)==2 and pairs[0][1]==pairs[1][1];leading=[v[0]for v in pairs];total=F(target.split('=')[1]);symbol=pairs[0][1]
  valid=[x for x in range(10)if sum(10*int(a)+x for a in leading)==total];out=F(one(valid));proof={'sameUnitDigitSymbol':symbol,'allTenDigitsChecked':10,'allValidDigits':valid,'twoNumbers':[10*int(a)+int(out)for a in leading],'printedTotal':str(total)}
 elif i in(7,9):
  a,b=map(int,n);multiples=[v for v in range(10,100)if v%a==0];excluded=[v for v in multiples if v%b==0];remaining=[v for v in multiples if v%b];out=F(len(remaining));proof={'allTwoDigitMultiples':multiples,'excludedCommonMultiples':excluded,'allRemaining':remaining}
 elif i==10:
  names=options(r);relations=re.findall(r'(\w+) (\w+) (\d+) см (кіші|аласа|ұзын)',s);assert len(relations)==3;edges=[]
  def nominative(aff):return one(v for v in names if aff.startswith(v)and aff[len(v):]in('дан','ден','тан','тен','нан','нен'))
  for first,other,diff,op in relations:assert first in names;edges.append((first,nominative(other),int(diff)*(1 if op=='ұзын'else-1)))
  heights={names[0]:0}
  while len(heights)<len(names):
   before=len(heights)
   for a,b,diff in edges:
    if a in heights:heights[b]=heights[a]-diff
    elif b in heights:heights[a]=heights[b]+diff
   assert len(heights)>before
  assert all(heights[a]-heights[b]==d for a,b,d in edges);out=one(k for k,v in heights.items()if v==max(heights.values()));parse=lambda t:t.strip();proof={'allHeightOffsets':heights,'allThreeRelationsChecked':True,'uniqueTallest':out}
 elif i==11:
  start=int(one(n));root=math.isqrt(start);ceil=root+(root*root<start);out=F(ceil*ceil-start);assert out>=0 and all(math.isqrt(start+d)**2!=start+d for d in range(int(out)));proof={'base':start,'nextSquareRoot':ceil,'square':ceil*ceil,'leastNonnegativeAddition':str(out),'allSmallerNonnegativeAdditionsExcluded':True,'nonnegativeConventionExplicitInRewrite':not src,'sourceOfficialSolutionImplicitlyUsesNonnegativeConvention':src}
 elif i==12:
  lower,upper,first=n[:3];assert n[3:]==([first]if src else[]);digit=str(int(first));values=[v for v in range(int(lower)+1,int(upper))if str(v).startswith(digit)and str(v).endswith(digit)];out=F(len(values));proof={'allNumbersInOpenRangeWithBothDigits':values}
 elif i==13:
  value=int(n[0]);digits=list(map(int,str(value)));claims=re.findall(r'(\w+): «([^»]+)»',s);assert len(claims)==4 and [v[0]for v in claims]==options(r);assert'үш'in claims[0][1]and'таңбалы'in claims[0][1];assert'әртүрлі'in claims[1][1].replace(' ','');claimedSum=int(one(H.numeric_tokens(claims[2][1])));assert'қосынды'in claims[2][1]and'тақ'in claims[3][1];truths=[len(digits)==3,len(set(digits))==len(digits),sum(digits)==claimedSum,all(d%2 for d in digits)];out=one(claims[j][0]for j,v in enumerate(truths)if not v);parse=lambda t:t.strip();proof={'printedNumber':value,'allDigitPropertiesTruthValues':truths,'allFourClaimsChecked':True,'sourceFiveChildrenFourClaimsMismatchFixed':not src,'onlyFalseSpeaker':out}
 elif i==14:
  target=one(p);whole=E.calc(target);assert whole.denominator==1;out=F(int(whole)%10);termResidues=[int(E.calc(v))%10 for v in E.plain(target).split('+')];assert sum(termResidues)%10==out;proof={'wholeExactExpressionValue':str(whole),'threeTermFinalDigits':termResidues,'answer':str(out)}
 elif i==15:
  players=int(one(n));out=F(len(list(itertools.combinations(range(players),2))));assert out==F(players*(players-1),2);proof={'players':players,'allUnorderedPairsCounted':int(out)}
 elif i==16:
  a,b=map(int,n[:2]);assert src or n[2:]==[0];out=F(math.lcm(a,b));assert out>0 and out%a==out%b==0 and not any(v%a==v%b==0 for v in range(1,int(out)));proof={'oldSpacing':a,'newSpacing':b,'commonOriginExplicitInRewrite':not src,'firstPOSITIVECommonPosition':str(out),'initialZeroExcluded':True}
 elif i==17:
  records=re.findall(r'(\w+) қорап(?:қа|та) «([^»]+)»',s);assert len(records)==3;records=[(color.casefold(),text.casefold())for color,text in records];colors=[c for c,_ in records];assert set(colors)=={o.casefold()for o in options(r)[:3]};required=3 if'үшеуі'in s else 1;assert'үшеуі'in s or'біреуі'in s;truths={}
  for candidate in colors:
   row=[]
   for color,text in records:
    if'жоқ'in text:assert'мұнда'in text;v=candidate!=color
    elif'осында'in text:v=candidate==color
    else:location=one(re.findall(r'(\w+) қорапта',text));assert location in colors;v=candidate==location
    row.append(v)
   truths[candidate]=row
  valid=[c for c,t in truths.items()if sum(t)==required];out=one(valid);parse=lambda t:t.strip().casefold();proof={'everyBoxLocationTruthVector':truths,'requiredTrueLabels':required,'allFeasibleLocations':valid}
 else:raise AssertionError(i)
 answer=parse(r['answer']);assert answer==out,(i,src,out,answer);vals=[parse(v)for v in options(r)];assert len(vals)==len(set(vals))==4 and vals.count(out)==1;proof['answer']=str(out);proof['everyOptionValue']=list(map(str,vals));proof['correctOptionIndex']=vals.index(out)
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[vals.index(out)]
 if i==1:assert vals[:3]==[F(high*high,2),out,F(high*(high+10),2)]and vals[3]==int(str(int(out))[:-2]+str(int(out))[-1]+str(int(out))[-2])
 if i==2:assert vals==[out,targetOutput,firstOutput,workers*targetOutput/firstOutput]
 if i==5:count=len(names);assert vals==[count*count,2*out,out,math.factorial(count-1)]
 if i==15:assert vals==[(players-1)**2,out,F(players*(players+1),2),players**2]
 if i==16:assert vals==[a,2*out,out,a+b]
 return proof
def mutation(r,i):
 pairs={1:('120','122'),2:('90 кг','120 кг'),3:('70 нәтижесін','71 нәтижесін'),4:('150, 180','175, 180'),5:('Айша, Дана, Меруерт және Ерлан төртеуін','Айша, Дана және Ерлан үшеуін'),6:('= 128','= 126'),7:('6-ға','7-ге'),8:('= 120','= 122'),9:('7-ге','6-ға'),10:('5 см ұзын','12 см ұзын'),11:('3020','3025'),12:('650','550'),13:('416','335'),14:('5021','5022'),15:('19 ойыншы','20 ойыншы'),16:('72 м','60 м'),17:('біреуі','үшеуі')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==17;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is not None and not q['images']and not q['svg']
  try:src=solve({**q,'answer':q['sourceAnswer']},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and len(r['options'])==len(q['options'])==4 and not r.get('image')and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9⁰¹²³⁴⁵⁶⁷⁸⁹(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip().rstrip('.,')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All17source/new conditions and full official/new explanations with every68source+68new option read. Exact operation equality/7digit count, all same-unit0–9digits, all two-digit divisibility cases, named permutations, connected height constraints, all digit property truth values and every3box location checked. Same author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0,bars=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='overline'){bars++;walk(n.content)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,bars}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':17,'fullSourceNewConditionsAndSolutionsRead':17,'allSourceAndNewOptionsChecked':136,'wrongKeysRejected':17,'printedSemanticCanariesRejected':17,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':native['fractions'],'nativeOverlines':native['bars'],'pythonJavaScriptHashesMatched':17,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
