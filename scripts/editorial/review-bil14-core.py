"""Full38 core saved/new conditions, official/new solutions and178saved/newchoices
read. Two bitmap-based tasks31/36 handled separately. Source32 empty correct
option reconstructed as > from the full official solution, never silently trusted.
Same author separate computational verification; not a second human reviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil14-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-bil13-core.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);J=C.J;N=C.N;B=C.B;H=C.H;E=C.E;one=C.one;G=C.G;coords=C.coords;coord_text=C.coord_text;plain=C.plain;scalar=C.scalar;tup=C.tup

def point1(v):return E.calc(re.sub(r'^[A-Z]','',plain(v)))
def clean_system(s,src):return[plain(v).strip().rstrip(',. ')for v in E.system(s,True)]if src else H.math_parts(s,False)
def affine_root(eq,var):
 l,r=eq.split('=');co,c=E.affine('('+l+')-('+r+')',(var,));a=one(co);assert a;out=-c/a;assert E.expr(l).value({var:out})==E.expr(r).value({var:out});return out

def turn(a,b,c):return(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])
def mirrored_shape(pts):
 assert pts[0][0]==pts[-1][0]==0 and all(x>=0 for x,y in pts);poly=pts+[(-x,y)for x,y in reversed(pts[1:-1])];assert len(poly)==len(set(poly))
 changed=True
 while changed:
  changed=False
  for j in range(len(poly)):
   if turn(poly[j-1],poly[j],poly[(j+1)%len(poly)])==0:poly.pop(j);changed=True;break
 assert len(poly)>=3
 edges=list(zip(poly,poly[1:]+poly[:1]))
 for j,(a,b)in enumerate(edges):
  for k,(c,d)in enumerate(edges):
   if k<=j or (k-j)%len(edges)in[1,len(edges)-1]:continue
   bbox=all(max(min(a[t],b[t]),min(c[t],d[t]))<=min(max(a[t],b[t]),max(c[t],d[t]))for t in[0,1]);assert not(bbox and turn(a,b,c)*turn(a,b,d)<=0 and turn(c,d,a)*turn(c,d,b)<=0),('selfcrossing',j,k)
 turns=[turn(poly[j-1],poly[j],poly[(j+1)%len(poly)])for j in range(len(poly))];assert all(turns)
 if len(poly)==10 and all(turns[j]*turns[(j+1)%10]<0 for j in range(10)):shape='star';assert sum(v>0 for v in turns)==5
 elif len(poly)==4:
  lengths=[(b[0]-a[0])**2+(b[1]-a[1])**2 for a,b in edges];assert len(set(lengths))==1 and all((poly[j][0]-poly[j-1][0])*(poly[(j+1)%4][0]-poly[j][0])+(poly[j][1]-poly[j-1][1])*(poly[(j+1)%4][1]-poly[j][1])==0 for j in range(4));shape='square'
 else:raise AssertionError(('unclassified',poly))
 return shape,{'actualSimplifiedReflectedPolygon':[[str(x),str(y)]for x,y in poly],'allNonadjacentEdgesNonintersecting':True,'actualSignedTurns':list(map(str,turns))}

def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);opts=B.options(r);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i in[1,3]:out=N.exact_power_arithmetic(one(parts));p['wholeExpressionComputedExactly']=str(out)
 elif i==2:
  pattern=plain(one(parts)).replace('{*}','□');assert pattern.count('□')==1;divisors=[3,5];valid=[d for d in range(10)if all(int(pattern.replace('□',str(d)))%k==0 for k in divisors)];out=one(scalar(v)for v in opts if scalar(v)in valid);p['allTenDigitsExaminedValid']=valid;p['uniquenessOnlyAmongOfferedDigits']=True
 elif i==4:
  digits=list(map(int,n[:5]))if src else list(map(int,H.numeric_tokens(one(parts))));assert len(set(digits))==len(digits);valid=[v for v in itertools.product(digits,repeat=4)if v[0]];out=F(len(valid));p['allFourPlaceDigitAssignmentsExamined']=len(digits)**4;p['leadingZeroExcluded']=True
 elif i==5:
  if src:frac=E.calc(parts[0]);extra,remainingFraction,subtract=n[2:]
  else:frac=E.calc(one(parts));extra,remainingFraction,subtract=n[2:]
  out=(subtract-extra)/(frac+remainingFraction-1);travelled=frac*out+extra;remaining=remainingFraction*out-subtract;assert out>0 and min(travelled,remaining)>=0 and travelled+remaining==out;p['actualTravelledAndRemainingKilometers']=list(map(str,[travelled,remaining]))
 elif i==6:
  ratio=one(v for v in parts if':'in v);a,b=H.numeric_tokens(ratio);gap=n[-1];out=gap*(a+b)/b;assert out-gap==gap*a/b;p['actualACBCAB']=list(map(str,[out-gap,gap,out]))
 elif i in[7,8]:
  eq=one(parts);out=affine_root(eq,'y'if i==8 else'x');p['originalEquationReplayed']=True
 elif i==9:
  op,bound=C.C.C.affine_relation(one(parts));assert op=='>';out=F(math.floor(bound)+1);assert out>bound and out-1<=bound;p['strictLowerBound']=str(bound)
 elif i==10:
  eqs=clean_system(s,src);bounds=[C.C.C.affine_relation(v)for v in eqs];lower=one(b for op,b in bounds if op=='>');upper=one(b for op,b in bounds if op=='≤');valid=list(range(max(0,math.floor(lower)+1),math.floor(upper)+1));out=F(len(valid));p['allNonnegativeIntegerSolutions']=valid
 elif i in[11,12]:out=E.expr(one(parts));p['fullFormalPolynomialIdentity']=True
 elif i==13:
  pts=[point1(v)for v in parts if re.match(r'^[CD]',v.strip())];assert len(pts)==2;out=sum(pts)/2;assert abs(out-pts[0])==abs(pts[1]-out);p['bothEqualDistances']=list(map(str,[abs(out-v)for v in pts]))
 elif i==14:
  pts=C.pointparts(parts);assert len(pts)==4;rows=[C.line(pts[0],pts[2]),C.line(pts[1],pts[3])];out=G.gaussian(rows,2)
  for a,b in[(pts[0],pts[2]),(pts[1],pts[3])]:
   axis=0 if a[0]!=b[0]else 1;t=(out[axis]-a[axis])/(b[axis]-a[axis]);assert 0<t<1 and all(a[k]+t*(b[k]-a[k])==out[k]for k in[0,1])
  p['actualDiagonalIntersectionInsideBothSegments']=list(map(str,out))
 elif i==15:out=tuple(affine_root(eq,var)for eq,var in zip(parts,['x','y']));assert len(out)==2
 elif i==16:
  eqs=clean_system(s,src)if src else parts[:2];roots=G.gaussian(C.equation_rows(eqs),2);assert all(roots);asked=parts[-1];out=E.expr(asked).value(dict(zip(['x','y'],roots)));p['actualSystemRoots']=list(map(str,roots));p['nonzeroProductDomainChecked']=True
 elif i==17:
  ds=n[::2]if src else n[::2];assert len(ds)==3 and n[::2]==n[1::2];ds=list(map(int,ds));valid=[v for v in range(100,1000)if all((v-d)%d==0 for d in ds)];out=F(min(valid));assert out==math.ceil(100/math.lcm(*ds))*math.lcm(*ds);p['allAdmissibleThreeDigitNumbers']=valid
 elif i==18:
  slow,delay,fast=n;assert fast>slow>0 and delay>0;time=slow*delay/60/(fast-slow);out=fast*time;assert slow*(time+delay/60)==out;p['actualCatchHoursAfterSecondDeparture']=str(time)
 elif i==19:
  eq=plain(one(parts));left,right=eq.split('=');inside=left.strip().strip('|');co,c=E.affine(inside,('x',));a=one(co);limit=E.calc(right);assert a and limit>0;roots=[(sign*limit-c)/a for sign in[-1,1]];assert all(abs(E.expr(inside).value({'x':v}))==limit for v in roots);out=abs(sum(roots));p['bothAbsoluteEquationRoots']=list(map(str,roots))
 elif i==20:
  eq=one(v for v in parts if'='in v);l,rr=eq.split('=');co,c=E.affine('('+l+')-('+rr+')',('x','a'));cx,ca=co;assert cx>0 and ca<0;out=('≥',-c/ca);p['actualZeroRootBoundary']=str(out[1]);assert E.expr(l).value({'x':F(0),'a':out[1]})==E.expr(rr).value({'x':F(0),'a':out[1]})
 elif i==21:percent=one(n);assert 0<percent<100;out=(1/(1-percent/100)-1)*100
 elif i==22:
  a,b=H.numeric_tokens(one(v for v in parts if':'in v));perimeter=n[2];unit=perimeter/(2*(a+b));out=a*b*unit**2;p['actualRectangleSidesAndPerimeter']=list(map(str,[a*unit,b*unit,perimeter]))
 elif i==23:
  low,high,total=map(int,n);valid=[v for v in itertools.product(range(low,high+1),repeat=2)if sum(v)==total];out=F(len(valid),(high-low+1)**2);p['allFavorableOrderedDicePairs']=[list(v)for v in valid];p['allPossibleDicePairCount']=(high-low+1)**2;p['fairIndependentDiceExplicitInRewrite']=True
 elif i==24:mean,gap=n;assert gap>0;out=mean+gap/2;assert(out+out-gap)/2==mean
 elif i==25:
  values=H.numeric_tokens(one(parts));assert len(values)==6;terms=[(int(a),int(b))for a,b in zip(values[::2],values[1::2])];last=[pow(a,b,10)for a,b in terms];assert all(b>0 for a,b in terms);out=F(sum(last)%10);p['allThreeModularPowerLastDigits']=last
 elif i==26:
  total,a,b=n;out=a+b-total;witness=[out,a-out,b-out];assert min(witness)>=0 and sum(witness)==total;p['attainableDisjointThreeGroupWitness']=list(map(str,witness));p['intersectionExcludedByConditionNotAssumedAway']=True
 elif i==27:
  if src:oldMean,newMean=n;count=F(7);assert'Жеті'in s
  else:count,oldMean,newMean=n
  out=(count+1)*newMean-count*oldMean;assert out>0;p['oldAndNewGroupAgeSums']=list(map(str,[count*oldMean,(count+1)*newMean]))
 elif i==28:frac=E.calc(one(parts));assert 0<frac<1;out=F(1440)/(1+frac);assert out+out*frac==1440;p['remainingMinutes']=str(1440-out)
 elif i==29:return C.target(r,20,src)
 elif i==30:
  count=6 if'алтыбұрышты'in s else 4;assert 'төрт'in s or count==6;out=F(count);p['sameOtherCatsNotNewObjects']=True
 elif i==32:
  # A literal thousands separator is part of the printed minutes value.
  m=re.search(r'және\s*([\d ]+)\s*минут',s);assert m;other=F(m[1].replace(' ',''));first=H.numeric_tokens(s[:m.start()]);week,day,hour,minute=first;total=(week*7+day)*1440+hour*60+minute;out='>'if total>other else'<'if total<other else'=';p['bothActualQuantitiesInMinutes']=list(map(str,[total,other]));p['sourceEmptyGreaterThanOptionReconstructedFromOfficialSolution']=src
 elif i==33:
  pts=C.pointparts(parts);shape,z=mirrored_shape(pts);p.update(z);out=one(v for v in opts if('жұлдыз'in v.lower()if shape=='star'else'шаршы'in v.lower()));p['computedShapeClass']=shape
 elif i==34:first,second,time=n;out=(first+second)*F(1000,3600)*time;assert min(n)>0;p['actualRelativeMetersPerSecond']=str((first+second)*F(1000,3600))
 elif i==35:
  count=3 if src else int(one(n));assert not src or'үш рет'in s;out=F(len(list(itertools.product([0,1],repeat=count))));p['allOrderedBinarySequencesEnumerated']=int(out)
 elif i==37:
  if src:values=H.numeric_tokens(parts[1]);start,end,step=values[0],values[-1],values[0]-values[1];assert E.calc(parts[0].split('=')[0])==sum(range(int(start),int(end)-1,-int(step)))
  else:values=H.numeric_tokens(one(parts));start,end=values[0],values[-1];step=one(n[len(values):])
  assert step>0 and(start-end)%step==0;terms=list(range(int(start),int(end)-1,-int(step)));out=F(len(terms));assert terms[-1]==end;p['fullArithmeticSequenceCount']=len(terms);p['zeroIncluded']=0 in terms
 elif i==38:
  if src:values=H.numeric_tokens(one(parts));low,high=values[0],values[-1]
  else:low,high=map(E.calc,parts)
  assert low<0<high and low.denominator==high.denominator==1;out=F(sum(range(int(low),int(high)+1)));p['allInclusiveIntegerTermsEnumerated']=int(high-low+1)
 elif i==39:return C.C.target(r,35,src)
 elif i==40:
  if src:f,m,k=F(2),F(1),F(1);assert n==[F(2)]
  else:f,m,k=n
  fruit=(m+k)/(f-m);out=fruit+1;assert fruit>0 and f*fruit==m*out+k;p['bothOriginalMassEquationsReplayed']=True
 else:raise AssertionError(i)
 if i not in[11,12]:p['exactTarget']=str(out)
 return out,p

def option_value(v,i,src=False,r=None):
 if i in[11,12]:return E.expr(v)
 if i==13:return point1(v)
 if i in[14,15]:return coords(v)if';'in v else None
 if i==20:
  t=plain(v);m=re.match(r'a\s*(≥|≤|>|<|=)\s*(.+)',t);assert m;return(m[1],E.calc(m[2]))
 if i in[30]:return scalar(v)
 if i in[32,33]:return v
 if i==28:return N.clock(v)
 if i==22:return scalar(v.replace('дм²',''))
 return scalar(v)
def solve(r,i,src=False):
 out,p=target(r,i,src);opts=B.options(r);assert len(opts)==len(set(opts))in[4,5]and r['answer']in opts;values=[option_value(v,i,src,r)for v in opts]
 if i in[11,12]:assert all(not a.equals(b)for a,b in itertools.combinations(values,2));assert sum(v.equals(out)for v in values)==1 and option_value(r['answer'],i).equals(out)
 else:assert values.count(out)==1 and option_value(r['answer'],i,src,r)==out,(i,out,r['answer'],values)
 p['allActualOptionsCompared']=len(values);return out,p

CHANGES={1:[('10.5','11.5')],2:[('62□5','63□5')],3:[('22.614','22.714')],4:[('8; 9','8')],5:[('90 км','96 км')],6:[('2.7 дм','3.6 дм')],7:[('1.44','1.92')],8:[('−55.02','−55.42')],9:[('+ 9 − x','+ 11 − x')],10:[('(7 − x)','(9 − x)')],11:[('−13','−14')],12:[('(9 +','(10 +')],13:[('D(6 +','D(8 +')],14:[('C(−4; 0)','C(−4; 1)'),('M(−4; 6)','M(−4; 7)'),('P(2; 4)','P(2; 5)'),('K(2; −2)','K(2; −1)')],15:[('x = 9','x = 10')],16:[('(7/12)','(11/20)'),('(1/12)','(1/20)')],17:[('5-ті','6-ны'),('5-ке','6-ға')],18:[('45 минуттан','60 минуттан')],19:[('x + 2','x + 3')],20:[('+ 9 =','+ 12 =')],21:[('20%-ға','25%-ға')],22:[('2 дм','3 дм')],23:[('Қосынды 10','Қосынды 9')],24:[('6.35','6.85')],25:[('3011^2027','3012^2027')],26:[('680','700')],27:[('230 жыл','231 жыл')],28:[('(3/5)','(1/2)')],29:[('8 сағатта','16 сағатта')],30:[('төртбұрышты','алтыбұрышты'),('қалған үш','қалған бес')],32:[('21 857','21 859')],33:[],34:[('6 секундта','8 секундта')],35:[('4 рет','5 рет')],37:[('−118','−120')],38:[('«1205»','«1206»')],39:[('1392 цифр','1422 цифр')],40:[('1 өріктің','2 өріктің')]}
def changed(r,i):
 d=copy.deepcopy(r)
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 if i==2:d['options']=['2','1','3','5','8']
 if i==33:d['statement']='«A(0; 4)», «B(2; 4)», «C(2; 0)», «D(0; 0)» нүктелерін ретімен қосыңыз. Сызықты ординаталар осіне қатысты шағылдырып толықтырғанда қандай фигура шығады?'
 old,_=target(r,i);new,_=target(d,i)
 if i in[11,12]:assert not old.equals(new);d['options']=['('+v+') + 1'for v in d['options']];d['answer']=d['options'][r['options'].index(r['answer'])];return d
 assert old!=new,(i,old,new)
 if i in[2,32,33]:d['answer']=one(v for v in d['options']if option_value(v,i)==new)
 elif i==13:d['options']=['E('+str(point1(v)+new-old)+')'for v in d['options']];d['answer']='E('+str(new)+')'
 elif i in[14,15]:d['options']=[coord_text(tuple(x+new[j]-old[j]for j,x in enumerate(coords(v))))if';'in v else v for v in d['options']];d['answer']=coord_text(new)
 elif i==20:d['options']=['a '+op+' '+str(v+new[1]-old[1])for op,v in map(lambda v:option_value(v,i),d['options'])];d['answer']='a '+new[0]+' '+str(new[1])
 elif i==28:d['options']=[C.J.clock_string(N.clock(v)+new-old)for v in d['options']];d['answer']=C.J.clock_string(new)
 else:d['options']=[str(option_value(v,i)+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==38;entries=[];evidence=[];equalities=0;sourceCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and(not q['svg']or i==16 and all('width="0.8889em" height="0.316em"'in v for v in q['svg'])or i==19 and all('width="0.333em" height="2.4em"'in v for v in q['svg']));key=one(v['text']for v in q['options']if v['correct']);
  if i==32:
   assert key==''and q['sourceAnswer']is None and'Жауабы: >.'in q['solution'];q=copy.deepcopy(q);q['options']=[{**v,'text':v['text']or'>'}for v in q['options']];key='>'
  else:assert H.canon(key)==H.canon(q['sourceAnswer'])
  sourceCount+=len(q['options']);assert len(q['options'])==len(r['options'])
  try:src=solve({**q,'answer':key},i,True)[1];_,proof=solve(r,i);d=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'INVALID'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  try:solve(d,i)
  except Exception as e:raise AssertionError(('validchanged',i))from e
  proof['validChangedActualInputAnswer']=d['answer'];proof['oldKeyRejectedCorrectChangedInputAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for match in re.finditer(r'[0-9(),.+−×÷/^\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and((before[-1].isascii()and before[-1].isalpha())or before[-1]in'!<>:◆⊕_'):continue
   if r['solution'][match.end():].lstrip().startswith(('!',':')):continue
   sides=[v.strip().rstrip('.,')for v in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printedSolutionEquality',i,match[0]);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full saved/new conditions official/new solutions and all178saved/newchoices read. Actual input exact rational arithmetic, formal identity proofs, original-constraint replay and exhaustive finite searches. All38 changed actual inputs reject old keys and accept recomputed answers. Same author separate computation, not another human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert sourceCount==178
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':38,'sourceOptionsRead':178,'rewrittenOptionsRead':178,'wrongKeysRejected':38,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':38,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':38,'remainingBIL14Tasks':[31,36],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
