"""All30 saved/new full conditions official/new solutions and all120saved/new
choices read. Actual printed givens independently recomputed by exact rational
arithmetic, formal systems and complete integer enumeration. Same author
separate computation, not another human reviewer. Four choices preserved.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil15-core';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-bil14-core.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);J=C.J;N=C.N;B=C.B;H=C.H;E=C.E;one=C.one;G=C.G;coords=C.coords;coord_text=C.coord_text;plain=C.plain;scalar=C.scalar;tup=C.tup

def target(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);parts=H.math_parts(s,src);p={'actualPrintedMathFragments':parts,'actualNumericTokens':list(map(str,n))}
 if i==1:
  total,a,b,neither=n;out=a+b-total+neither;witness=[a-out,b-out,out,neither];assert all(v>=0 and v.denominator==1 for v in witness)and sum(witness)==total;p['actualFirstOnlySecondOnlyBothNeither']=list(map(str,witness))
 elif i==2:total=one(n);out=total/2;assert out>0 and out.denominator==1
 elif i==3:a,b,total=n;assert min(n)>0;out=total*a/(a+b);assert out+total*b/(a+b)==total
 elif i==4:total,factor=n;out=total/(factor+1);assert out>0 and out*(factor+1)==total
 elif i==5:total,gap=n;out=(total-gap)/2;assert out>0 and out.denominator==1 and out+out+gap==total;p['actualBothAnimalCounts']=list(map(str,[out,out+gap]))
 elif i==6:perimeter,gap=n;out=(perimeter/2-gap)/2;assert out>0 and 2*(out+out+gap)==perimeter;p['actualWidthAndLength']=list(map(str,[out,out+gap]))
 elif i==7:
  total=n[0];fraction=F(1,4)if src else E.calc(one(parts));assert not src or'төрттен бір'in s;out=total*(1-fraction);assert out>=0 and out.denominator==1;p['actualWrittenAndBlankPages']=list(map(str,[total*fraction,out]))
 elif i in[8,20,22,27]:out=N.exact_power_arithmetic(one(parts));p['fullPrintedArithmeticComputedExactly']=str(out)
 elif i==9:
  if src:unit1,a,unit2,b,time=n;assert unit1==unit2==1
  else:a,b,time=n
  assert min(a,b,time)>0;out=(a+b)*time;p['bothWorkersSeparateOutput']=list(map(str,[a*time,b*time]))
 elif i==10:
  if src:length,count=n;fraction=F(1,2);assert'жартысына'in s
  else:length=n[0];count=n[-1];fraction=E.calc(one(parts))
  width=length*fraction;out=length*width*count;assert min(length,width,count)>0;p['actualEachGlassWidthAreaAndCount']=list(map(str,[width,length*width,count]))
 elif i==11:radius=one(n);assert radius>0;out=(2*radius,radius**2);p['exactPiCoefficientsCircumferenceArea']=list(map(str,out))
 elif i==12:value,percent=n;out=value*percent/100
 elif i==13:boat,downTime,upTime,current=n;assert boat>current>0;down=(boat+current)*downTime;up=(boat-current)*upTime;out=down+up;p['actualDownstreamUpstreamDistances']=list(map(str,[down,up]))
 elif i==14:
  eqs=[re.sub(r'^\[2mm\]\s*','',v)for v in C.clean_system(s,src)];rows=C.C.equation_rows(eqs);out=G.gaussian(rows,2);assert all(E.expr(eq.split('=')[0]).value(dict(zip(['x','y'],out)))==E.calc(eq.split('=')[1])for eq in eqs);p['bothOriginalSystemEquationsReplayed']=True;p['actualSystemRoots']=list(map(str,out))
 elif i==15:days,hour,minute,other=n;total=days*1440+hour*60+minute;out='>'if total>other else'<'if total<other else'=';p['actualBothQuantitiesInMinutes']=list(map(str,[total,other]))
 elif i==16:hours,distance,first=n;assert 0<first<=hours;out=distance/hours*first;p['actualConstantSpeed']=str(distance/hours)
 elif i==17:percent=one(n);out=1+percent/100
 elif i==18:workers,days,newWorkers=n;assert min(n)>0;out=workers*days/newWorkers;assert out*newWorkers==workers*days;p['actualPersonDayWork']=str(workers*days)
 elif i==19:slow,fast,time=n;assert fast>slow>0 and time>0;out=(fast-slow)*time
 elif i==21:
  f=[E.calc(v)for v in parts];assert len(f)==4;a=f[0]*f[1];b=f[2]*f[3];out='>'if a>b else'<'if a<b else'=';p['actualBothFractionProducts']=list(map(str,[a,b]))
 elif i==23:ratio,delay,laterRatio=n;child=delay*(laterRatio-1)/(ratio-laterRatio);out=ratio*child;assert min(child,out)>0 and child.denominator==out.denominator==1 and out+delay==laterRatio*(child+delay);p['actualCurrentChildFatherAges']=list(map(str,[child,out]))
 elif i==24:
  expr=plain(one(parts));left,right=expr.split('≤');before,inside,after=left.split('|');assert not before.strip();co,c=E.affine(inside,('m',));a=one(co);assert a;radius=E.calc(right)-E.calc(after);assert radius>=0;ends=sorted([(radius-c)/a,(-radius-c)/a]);values=list(range(math.ceil(ends[0]),math.floor(ends[1])+1));assert all(abs(E.expr(inside).value({'m':F(v)}))+E.calc(after)<=E.calc(right)for v in values);out=F(sum(values));p['allIntegerAbsoluteInequalitySolutions']=values;p['actualRealClosedBounds']=list(map(str,ends))
 elif i==25:a,b=n;out=((1+a/100)*(1+b/100)-1)*100
 elif i==26:value,a,b=n;out=value*(1+a/100)*(1+b/100);p['actualIntermediatePrice']=str(value*(1+a/100))
 elif i==28:
  if src:fractions=[F(1,2),F(1,3),F(1,4)];assert'жартысын, үштен бірін және төрттен бірін'in s;total=one(n)
  else:fractions=[E.calc(v)for v in parts];total=n[-1]
  assert len(fractions)==3 and all(0<v<1 for v in fractions);out=total/(1+sum(fractions));assert out>0 and out.denominator==1 and out+sum(out*v for v in fractions)==total;p['actualCurrentAgeAndThreeExtraDurations']=list(map(str,[out]+[out*v for v in fractions]))
 elif i==29:
  if src:days,worked,left=n;workers=F(10);assert'Он жұмысшы'in s
  else:workers,days,worked,left=n
  assert days>worked>=0 and workers>0 and left>0;remaining=workers*(days-worked);required=remaining/left;out=required-workers;assert out>0 and out.denominator==1 and(workers+out)*left+workers*worked==workers*days;p['actualRemainingWorkTotalNeededAdditional']=list(map(str,[remaining,required,out]))
 elif i==30:
  times=n[1:]if src else n;assert len(times)==4 and min(times)>0;rates=[1/v for v in times];out=sum(rates);p['allFourActualDailyWorkRates']=list(map(str,rates));p['askedDailyRateNotFullCompletionTime']=True
 else:raise AssertionError(i)
 p['exactTarget']=str(out);return out,p

def option_value(v,i):
 if i==11:return tuple(H.numeric_tokens(v))
 if i==14:return coords(v)
 if i in[15,21]:return plain(v)
 return scalar(v)
def solve(r,i,src=False):
 out,p=target(r,i,src);opts=B.options(r);assert len(opts)==len(set(opts))==4 and r['answer']in opts;values=[option_value(v,i)for v in opts];assert len(set(values))==4 and values.count(out)==1 and option_value(r['answer'],i)==out,(i,out,r['answer'],values);p['allActualOptionsCompared']=4;return out,p

CHANGES={1:[('36 оқушы','38 оқушы')],2:[('156 жапсырма','180 жапсырма')],3:[('480 г','560 г')],4:[('7200 теңге','8400 теңге')],5:[('54 ешкі','60 ешкі')],6:[('64 см','72 см')],7:[('40 бет','50 бет')],8:[('× 24','× 48')],9:[('3 сағат','4 сағат')],10:[('12 шынының','15 шынының')],11:[('9 см','10 см')],12:[('35%-ын','40%-ын')],13:[('18 км/сағ','20 км/сағ')],14:[('= 2','= 3')],15:[('3077 минут','3078 минут')],16:[('576 км','640 км')],17:[('150%-ға','175%-ға')],18:[('8 жұмысшы','9 жұмысшы')],19:[('5 сағаттан','6 сағаттан')],20:[('(3 + (3/7))','(4 + (3/7))')],21:[('(45/56)','(50/56)')],22:[('(2 + (80/81))','(3 + (80/81))')],23:[('18 жылдан','24 жылдан')],24:[('m − 3','m − 4')],25:[('12%-ға','20%-ға')],26:[('240 теңге','300 теңге')],27:[('2 + 1/','3 + 1/')],28:[('125 жасқа','150 жасқа')],29:[('4 күнде','3 күнде')],30:[('20, 30, 24','15, 30, 24')]}
def changed(r,i):
 d=copy.deepcopy(r)
 for a,b in CHANGES[i]:assert a in d['statement'],(i,a);d['statement']=d['statement'].replace(a,b)
 old,_=target(r,i);new,_=target(d,i);assert old!=new,(i,old,new)
 if i in[15,21]:d['answer']=new
 elif i==11:d['options']=[str(v[0]+new[0]-old[0])+'π және '+str(v[1]+new[1]-old[1])+'π'for v in map(lambda v:option_value(v,i),d['options'])];d['answer']=str(new[0])+'π және '+str(new[1])+'π'
 elif i==14:d['options']=[coord_text(tuple(v[j]+new[j]-old[j]for j in[0,1]))for v in map(coords,d['options'])];d['answer']=coord_text(new)
 else:d['options']=[str(scalar(v)+new-old)for v in d['options']];d['answer']=str(new)
 return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==30;entries=[];evidence=[];equalities=0;sourceCount=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and(not q['svg']or i==14 and all('width="0.8889em" height="0.316em"'in v for v in q['svg']));key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);sourceCount+=len(q['options']);assert len(q['options'])==len(r['options'])
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
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full saved/new conditions official/new solutions and all120saved/newchoices read. Actual input exact rational arithmetic, formal identity proofs, original-constraint replay and exhaustive finite searches. All30 changed actual inputs reject old keys and accept recomputed answers. Same author separate computation, not another human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert sourceCount==120
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':30,'sourceOptionsRead':120,'rewrittenOptionsRead':120,'wrongKeysRejected':30,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':30,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':30,'remainingBIL15Tasks':[],'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
