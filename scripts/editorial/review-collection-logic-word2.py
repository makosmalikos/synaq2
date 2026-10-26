"""All23full saved/new conditions, complete official/new explanations and all4
MCQ alternatives read. Same root author separate exact printed-input computation,
not separate human reviewer. Source8needs positive-integer variable convention,
7disjoint club assumption and17same-prefix mean clarified explicitly in rewrite.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-logic-word2';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def options(r):return[o['text']if isinstance(o,dict)else o for o in r['options']]
def scalar(s):
 p=E.plain(s).replace('^\\circ','').replace('°','');m=re.fullmatch(r'\s*(-?\d+(?:\.\d+)?)\s*(?:л|қорап)?\s*',p)
 return F(m[1])if m else E.calc(p)
def ratio(s):
 vals=[int(v.strip())for v in s.replace('$','').split(':')];assert len(vals)==3;g=math.gcd(*vals);return tuple(F(v,g)for v in vals)
def pair(s):return tuple(F(v.strip())for v in s.replace('$','').split(';'if';'in s else','))
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);parse=scalar;proof={}
 if i in(1,12):
  lower,upper=n;values=list(range(math.floor(lower)+1,math.ceil(upper)));out=F(sum(values));assert values and all(lower<v<upper for v in values);proof={'allIntegerValues':values,'negativeAndZeroIncluded':any(v<0 for v in values)and 0 in values}
 elif i==2:
  a,b=n;out=a*b;assert sum(1 for _ in itertools.product(range(int(a)),range(int(b))))==out;proof={'firstChoiceCount':str(a),'secondChoiceCount':str(b)}
 elif i==3:
  count,duration,single=n;assert single==1;out=duration;proof={'simultaneousItems':str(count),'fixedIndividualProcessingMinutes':str(duration),'notDividedByItemCount':True}
 elif i==4:
  count=int(one(n));pairs=list(itertools.combinations(range(count),2));out=F(len(pairs));assert out==F(count*(count-1),2);proof={'allUnorderedPlayerPairsCounted':len(pairs),'players':count}
 elif i==5:
  if src:template,divisor=p[0],int(one(H.numeric_tokens(s.replace('$'+p[0]+'$',''))))
  else:template=one(p);divisor=int(one(H.numeric_tokens(s.replace('«'+template+'»',''))))
  assert divisor==15 and len(template)==5 and template.count('*')==2;valid=[]
  for digits in itertools.product(range(10),repeat=2):
   it=iter(digits);number=int(''.join(str(next(it))if c=='*'else c for c in template))
   if number%divisor==0:valid.append((digits,number))
  possible=sorted(set(sum(ds)for ds,_ in valid));offered=[scalar(v)for v in options(r)];out=one(v for v in offered if v in possible);proof={'all100WildcardAssignmentsChecked':100,'allValidAssignments':valid,'allFeasibleHiddenDigitSums':possible,'onlyOneOFFEREDAnswerIsFeasible':True,'notClaimingOneDigitAssignment':True}
 elif i==6:
  angle=one(n);assert 0<angle<180;out=180-angle;proof={'straightAngleDegrees':180,'givenAngle':str(angle),'supplement':str(out)}
 elif i==7:
  total,a,b=n;c=total-a-b;assert min(a,b,c)>0;values=[int(v)for v in[a,b,c]];g=math.gcd(*values);out=tuple(F(v,g)for v in values);parse=ratio;proof={'clubCounts':values,'commonGCD':g,'orderedReducedRatio':list(map(str,out)),'disjointClubsExplicitInRewrite':not src}
 elif i==8:
  if src:low,high=p[:2];assert p[2:]==['n']
  else:low,high=p
  out=E.expr(high)-E.expr(low)-E.expr('1');parse=E.expr;var='n'if src else'k'
  for value in[1,2,7,19]:
   l,h=E.calc(low,{var:F(value)}),E.calc(high,{var:F(value)});assert l.denominator==h.denominator==1 and h>l;assert out.value({var:F(value)})==h-l-1
  proof={'universalExpandedPolynomial':{str(k):str(v)for k,v in out.n.items()},'positiveIntegerDomainExplicitInRewrite':not src,'sourceOfficialAnswerUsesPositiveIntegerConvention':src,'strictEndpointsExcluded':True}
 elif i==9:
  vals=H.numeric_tokens(one(p));assert len(vals)==5;out=sum(vals)/len(vals);proof={'fiveValues':list(map(str,vals)),'sum':str(sum(vals)),'count':len(vals)}
 elif i==10:
  if src:calibration,ml,hours=n;assert'екі тамшы'in s;perSecond=F(2)
  else:perSecond,calibration,ml,hours=n
  seconds=hours*3600;drops=seconds*perSecond;milliliters=drops/calibration*ml;out=milliliters/1000;proof={'seconds':str(seconds),'totalDrops':str(drops),'milliliters':str(milliliters),'liters':str(out)}
 elif i==11:
  lower,upper,perFriend=n;valid=[v for v in range(int(lower)+1,int(upper))if v%perFriend==0];total=one(valid);out=F(total)/perFriend;assert out.denominator==1;proof={'allDivisibleTotalsInOpenRange':valid,'equalWholeShare':str(perFriend),'friendsTarget':str(out)}
 elif i==13:
  divisor=int(one(n));multiples=[x for x in range(10,100)if x%divisor==0];out=F(min(multiples)+max(multiples));proof={'allTwoDigitMultiples':multiples,'targetAddsExtremesNotCount':True}
 elif i==14:
  a,b,c,edge=n;dims=[v/edge for v in[a,b,c]];assert all(v.denominator==1 and v>=1 for v in dims);dims=list(map(int,dims));hist={}
  for cell in itertools.product(*(range(d)for d in dims)):
   faces=sum(int(v==0)+int(v==d-1)for v,d in zip(cell,dims));hist[faces]=hist.get(faces,0)+1
  out=F(hist.get(1,0));formula=2*sum(max(0,dims[a]-2)*max(0,dims[b]-2)for a,b in[(0,1),(0,2),(1,2)]);assert out==formula;proof={'cubeCountsByAxis':dims,'allSmallCubesEnumerated':math.prod(dims),'histogramByPaintedFaces':hist,'targetIsExactlyONEFace':True}
 elif i==15:
  if src:coefficient,divisor,upper=n
  else:upper,coefficient,divisor=n
  assert E.expr(p[0]).equals(E.expr(str(coefficient)+'*'+('m'if src else't')));valid=[v for v in range(1,int(upper))if(coefficient*v)%divisor!=0];out=F(sum(valid));excluded=[v for v in range(1,int(upper))if(coefficient*v)%divisor==0];g=math.gcd(int(coefficient),int(divisor));assert excluded==[v for v in range(1,int(upper))if v%(int(divisor)//g)==0];proof={'allValidMultipliers':valid,'allExcludedDivisibleMultipliers':excluded,'requiredMultiplierFactor':int(divisor)//g,'askedSumNotCount':True}
 elif i==16:
  if src:portion,people,pack=n
  else:people,portion,pack=n
  total=people*portion;out=F(math.ceil(total/pack));assert(out-1)*pack<total<=out*pack;proof={'gramsRequired':str(total),'packGrams':str(pack),'previousWholePackCountInsufficient':True,'minimumSufficientWholePacks':str(out)}
 elif i==17:
  firstMean,secondMean=n
  if src:assert s.startswith('Үш санның')and'төрт санның'in s and'Төртінші санды'in s;a,b=3,4
  else:assert s.startswith('Төрт санның')and'бесінші сан'in s and'бес санның'in s;a,b=4,5
  out=b*secondMean-a*firstMean;assert(a*firstMean+out)/b==secondMean;proof={'oldCount':a,'newCount':b,'oldSum':str(a*firstMean),'newSum':str(b*secondMean),'addedNumberTarget':str(out),'samePrefixExplicitInRewrite':not src}
 elif i==18:
  known=list(map(int,H.numeric_tokens(one(p))));roots=[math.isqrt(v)for v in known];assert len(known)==5 and all(a*a==b for a,b in zip(roots,known))and roots==list(range(roots[0],roots[0]+5));nextValues=[v*v for v in range(roots[-1]+1,roots[-1]+4)];out=F(sum(nextValues));proof={'knownConsecutiveSquareRoots':roots,'nextTHREEValues':nextValues,'askedSumNotOneNextTerm':True}
 elif i==19:
  if src:digit,lower,upper=n
  else:lower,upper,digit,*repeated=n;assert all(v==digit for v in repeated)
  occurrences={str(v):str(v).count(str(int(digit)))for v in range(int(lower),int(upper)+1)if str(int(digit))in str(v)};out=F(sum(occurrences.values()));proof={'everyNumberWithOccurrenceMultiplicity':occurrences,'numberCount':len(occurrences),'DIGITOccurrenceCountTarget':str(out),'doubleOccurrenceCountedTwice':True}
 elif i==20:
  start=F(one(re.findall(r'(\d+)-(?:ші\s*)?қабаттан',s)));moves=re.findall(r'(\d+) қабат (төмен|жоғары)',s);assert len(moves)==4;path=[start]
  for amount,direction in moves:path.append(path[-1]+int(amount)*(1 if direction=='жоғары'else-1))
  out=path[-1];proof={'allFloorLevels':list(map(str,path)),'groundAndBasementNumberingExplicitInRewrite':not src}
 elif i==21:
  known=H.numeric_tokens(one(p));assert len(known)==5;first,second,third,lastButOne,last=known;d=second-first;step=third-2*second+first;assert step==1;full=[first+d*j+step*j*(j-1)/2 for j in range(7)];assert [full[j]for j in[0,1,2,5,6]]==known;out=(full[3],full[4]);parse=pair;proof={'allSevenTerms':list(map(str,full)),'firstDifferences':list(map(str,[full[j+1]-full[j]for j in range(6)])),'twoMissingTermsInOrder':list(map(str,out))}
 elif i==22:
  number=int(one(n));divisors=[v for v in range(1,number+1)if number%v==0];out=F(sum(divisors));proof={'allDivisors':divisors}
 elif i==23:
  length,piece=n;pieces=length/piece;assert pieces.denominator==1 and pieces>1;out=pieces-1;proof={'wholePieceCount':str(pieces),'cutsOneLessThanPieceCount':str(out)}
 else:raise AssertionError(i)
 equal=lambda a,b:a.equals(b)if isinstance(a,E.R)else a==b;answer=parse(r['answer']);assert equal(answer,out),(i,src,out,answer);vals=[parse(o)for o in options(r)];assert len(vals)==4 and all(not equal(a,b)for a,b in itertools.combinations(vals,2));matches=[j for j,v in enumerate(vals)if equal(v,out)];assert len(matches)==1;proof['correctOptionIndex']=one(matches);proof['everyOptionValue']=list(map(str,vals));proof['answer']='universal polynomial'if isinstance(out,E.R)else str(out)
 if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==matches
 if i==2:assert vals==[b,a+b,b*b,a*b]
 if i==7:assert vals==[out,(out[1],out[0],out[2]),out[::-1],(out[0],out[2],out[1])]
 if i==9:
  inputValues=[F(v)for v in proof['fiveValues']];assert vals==[out,inputValues[2],sum(inputValues),sum(inputValues)-inputValues[0]]
 if i==17:assert vals==[out/2,out,2*out,3*out]
 if i==23:assert vals==[out-3,pieces,out,pieces+1]
 return proof
def mutation(r,i):
 pairs={1:('−11,3','−12,3'),2:('7 түрлі','8 түрлі'),3:('6 минутта','7 минутта'),4:('9 ойыншы','10 ойыншы'),5:('2*46*','4*46*'),6:('138°','128°'),7:('36 оқушының','39 оқушының'),8:('3 × k + 2','4 × k + 2'),9:('«8;','«18;'),10:('9 сағатта','10 сағатта'),11:('27-ден көп, 33-тен аз','32-ден көп, 38-тен аз'),12:('−25,7','−26,7'),13:('17-ге','19-ға'),14:('6 см','9 см'),15:('13-тен','14-тен'),16:('95 оқушы','105 оқушы'),17:('22 болды','24 болды'),18:('4; 9; 16; 25; 36','9; 16; 25; 36; 49'),19:('99-ға','89-ға'),20:('11 қабат төмен','12 қабат төмен'),21:('28; 30; 33; ?; ?; 48; 55','29; 31; 34; ?; ?; 49; 56'),22:('21 санының','22 санының'),23:('1440 см','1530 см')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==23;entries=[];evidence=[];equalities=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and q['sourceAnswer']is not None and not q['images']and not q['svg']
  try:src=solve({**q,'answer':q['sourceAnswer']},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and len(r['options'])==len(q['options'])==4 and not r.get('image')and r['statement']!=q['statement']and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip();after=r['solution'][match.end():].lstrip()
   if(before and before[-1].isascii()and before[-1].isalpha())or before.endswith(':')or after.startswith(':'):continue
   sides=[s.strip().rstrip('.')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All23source/new conditions and complete official/new solutions with every92source+92new MCQ alternative read. Exact full finite sets, wildcard assignments, affine polynomial identities, unit/ceiling/mean ledgers, all colored cubes and signed floor path checked from printed text. Same author, no separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':23,'fullSourceNewConditionsAndSolutionsRead':23,'allSourceAndNewOptionsChecked':184,'wrongKeysRejected':23,'printedSemanticCanariesRejected':23,'printedSolutionEqualitiesVerified':equalities,'nativeFractions':native['fractions'],'pythonJavaScriptHashesMatched':23,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
