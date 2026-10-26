"""All60 source/new conditions and full official/new solutions read, all32
saved/new MCQ choices read. Open-response format preserved. Independent exact
sequence replay and reconstruction from actual printed values, never JS model
parameters. Explicit new family removes unconstrained finite-sequence ambiguity.
Same author computational review, not another human reviewer. Variants are not
60 different semantic stories. Source raster/vector art not present or reused.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='logic-sequences';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-bil15-core.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;G=C.G;one=C.one
HINTS={
'ap':'Көрші мүшелердің айырмасы тұрақты.', 'gp':'Көрші мүшелердің қатынасы тұрақты.', 'diff-ap':'Көрші мүшелердің айырмалары бірдей тұрақты шамаға өзгеріп отырады.',
'square':'Қатарлас натурал сандардың квадраттары берілген.','cube':'Қатарлас натурал сандардың кубтары берілген.',
'alt-mul-add':'Алдымен бір тұрақты санға көбейту, кейін бір тұрақты сан қосу не азайту кезектеседі.','alt-add-mul':'Алдымен бір тұрақты сан қосу, кейін бір тұрақты санға көбейту кезектеседі.',
'affine':'Әр қадамда бірдей тұрақты санға көбейтіп, содан кейін бірдей тұрақты сан қосады не азайтады.',
'fibo':'Үшінші мүшеден бастап әр мүше алдыңғы екі мүшенің қосындысы.',
'square-offset':'Мүшелер қатарлас натурал сандардың квадраттарына бірдей тұрақты сан қосу арқылы алынған.',
'diff-gp':'Көрші мүшелердің айырмаларының қатынасы тұрақты.',
'wrong-square':'Қатарлас натурал сандардың квадраттары берілуі тиіс, бірақ бір мүшеде қате бар.',
'interleave-ap-gp':'Тақ орындарда айырмасы тұрақты тізбек, жұп орындарда қатынасы тұрақты тізбек орналасқан.',
'interleave-ap-ap':'Тақ және жұп орындарда айырмалары тұрақты екі бөлек тізбек орналасқан.',
'fraction-square-ap':'Алымдар қатарлас натурал сандардың квадраттары, бөлімдердің айырмасы тұрақты.',
'fraction-ap-gp':'Алымдардың айырмасы тұрақты, бөлімдердің қатынасы тұрақты.',
'wrong-diff-ap':'Көрші мүшелердің айырмалары бірдей тұрақты шамаға өзгеруі тиіс, бірақ бір мүшеде қате бар.',
'wrong-fibo':'Үшінші мүшеден бастап әр мүше алдыңғы екі мүшенің қосындысы болуы тиіс, бірақ бір мүшеде қате бар.',
'increasing-ratio':'Көрші мүшелердің қатынастары бірдей тұрақты шамаға өсіп отырады.',
 'tribo':'Төртінші мүшеден бастап әр мүше алдыңғы үш мүшенің қосындысы.'}
def source_kind(part,i):
 if part==1:return'ap'if i<=9 else'gp'if i<=16 else'diff-ap'
 if part==2:return'square'if i in[1,2,4]else'cube'if i==3 else'alt-add-mul'if i==6 else'alt-mul-add'if i<=8 else'affine'if i<=12 or i==20 else'fibo'if i<=16 else'square-offset'
 return {1:'ap',2:'affine',3:'fibo',4:'diff-gp',5:'diff-gp',6:'diff-gp',7:'wrong-square',8:'wrong-square',9:'interleave-ap-gp',10:'interleave-ap-ap',11:'interleave-ap-gp',12:'fraction-square-ap',13:'fraction-square-ap',14:'fraction-square-ap',15:'fraction-ap-gp',16:'wrong-diff-ap',17:'wrong-fibo',18:'increasing-ratio',19:'increasing-ratio',20:'tribo'}[i]
def exact_root(x,power):
 assert x>=0 and x.denominator==1
 if power==2:k=math.isqrt(x.numerator)
 else:
  lo,hi=0,1
  while hi**power<x:hi*=2
  while lo+1<hi:
   mid=(lo+hi)//2
   if mid**power<=x:lo=mid
   else:hi=mid
  k=hi if hi**power==x else lo
 assert k**power==x;return F(k)
def fit(kind,values):
 known=[(j,v)for j,v in enumerate(values)if v is not None];size=len(values);meta={}
 if kind in['ap','diff-ap']:
  degree=1 if kind=='ap'else 2;first=known[:degree+1];assert len(first)==degree+1;co=G.gaussian([[F(j)**p for p in range(degree+1)]+[v]for j,v in first],degree+1);out=[sum(v*F(j)**p for p,v in enumerate(co))for j in range(size)];meta['actualPolynomialCoefficients']=list(map(str,co))
 elif kind=='gp':
  ratios=[values[j+1]/values[j]for j in range(size-1)if values[j]is not None and values[j+1]is not None and values[j]];ratio=one(set(ratios));assert known[0][0]==0;out=[values[0]*ratio**j for j in range(size)];meta['actualCommonRatio']=str(ratio)
 elif kind in['square','cube']:
  power=2 if kind=='square'else 3;starts=[]
  for j,v in known:
   try:starts.append(exact_root(v,power)-j)
   except AssertionError:raise AssertionError(('non-perfect-power',j,v))
  start=one(set(starts));assert start>0;out=[(start+j)**power for j in range(size)];meta['allActualPowerBases']=[str(start+j)for j in range(size)]
 elif kind=='square-offset':
  assert values[0]is not None and values[1]is not None;start=(values[1]-values[0]-1)/2;assert start>0 and start.denominator==1;offset=values[0]-start**2;out=[(start+j)**2+offset for j in range(size)];meta['actualStartBaseAndOffset']=list(map(str,[start,offset]))
 elif kind=='affine':
  triple=one([values[j],values[j+1],values[j+2]]for j in range(size-2)if all(values[k]is not None for k in range(j,j+3))and values[j+1]!=values[j])if sum(all(values[k]is not None for k in range(j,j+3))and values[j+1]!=values[j]for j in range(size-2))==1 else next([values[j],values[j+1],values[j+2]]for j in range(size-2)if all(values[k]is not None for k in range(j,j+3))and values[j+1]!=values[j]);a,b,c=triple;factor=(c-b)/(b-a);offset=b-factor*a;assert values[0]is not None;out=[values[0]]
  for j in range(1,size):out.append(out[-1]*factor+offset)
  meta['actualAffineFactorOffset']=list(map(str,[factor,offset]))
 elif kind in['fibo','tribo']:
  order=2 if kind=='fibo'else 3;holes=[j for j,v in enumerate(values)if v is None];assert len(holes)<=1;out=values[:]
  if holes:
   z=one(holes);candidates=[]
   for j in range(order,size):
    coef=F(j==z)-sum(F(k==z)for k in range(j-order,j));constant=(values[j]or F(0))-sum(values[k]or F(0)for k in range(j-order,j))
    if coef:candidates.append(-constant/coef)
    else:assert constant==0
   out[z]=one(set(candidates))
  assert all(out[j]==sum(out[j-order:j])for j in range(order,size));meta['allSumRecurrenceEquationsReplayed']=size-order
 elif kind in['alt-mul-add','alt-add-mul']:
  groups=[[(values[j],values[j+1])for j in range(size-1)if j%2==parity and values[j]is not None and values[j+1]is not None]for parity in[0,1]];mulParity=0 if kind=='alt-mul-add'else 1;ratio=one({b/a for a,b in groups[mulParity]});offset=one({b-a for a,b in groups[1-mulParity]});out=[values[0]]
  for j in range(size-1):out.append(out[-1]*ratio if j%2==mulParity else out[-1]+offset)
  meta['actualAlternatingFactorOffset']=list(map(str,[ratio,offset]))
 elif kind=='diff-gp':
  a,b,c=values[:3];diff=b-a;assert diff;ratio=(c-b)/diff;out=[a]
  for j in range(1,size):out.append(out[-1]+diff*ratio**(j-1))
  meta['actualFirstDifferenceAndRatio']=list(map(str,[diff,ratio]))
 elif kind.startswith('interleave'):
  odd,op=fit('ap',values[::2]);even,ep=fit('gp'if kind.endswith('-gp')else'ap',values[1::2]);out=[even[j//2]if j%2 else odd[j//2]for j in range(size)];meta['actualOddAndEvenSubsequenceProofs']=[op,ep]
 elif kind=='increasing-ratio':
  a,b,c=values[:3];assert a and b;first=b/a;increment=c/b-first;out=[a]
  for j in range(1,size):out.append(out[-1]*(first+(j-1)*increment))
  meta['actualFirstMultiplierAndIncrement']=list(map(str,[first,increment]))
 else:raise AssertionError(kind)
 assert all(v is None or out[j]==v for j,v in enumerate(values)),('recurrence mismatch',kind,values,out);return out,meta

def parse(s,src,kind):
 body=s.rsplit('\n\n',1)[-1]
 if kind.startswith('fraction'):
  pattern=r'\\dfrac\{(\d+)\}\{(\d+)\}'if src else r'\((\d+)/(\d+)\)';cells=[tuple(map(F,v))for v in re.findall(pattern,body)];assert len(cells)==5 and'?'in body;return cells+[None]
 tokens=re.findall(r'[−-]?\d+(?:\.\d+)?|\?',body);return [None if v=='?'else F(v.replace('−','-'))for v in tokens]

def evaluate(kind,values):
 if kind.startswith('fraction'):
  num=[v[0]if v else None for v in values];den=[v[1]if v else None for v in values];a,ap=fit('square'if kind=='fraction-square-ap'else'ap',num);b,bp=fit('ap'if kind=='fraction-square-ap'else'gp',den);assert all(v>0 for v in b);j=one(i for i,v in enumerate(values)if v is None);out=a[j]/b[j];return out,{'actualNumeratorProof':ap,'actualDenominatorProof':bp,'exactNextNumeratorDenominator':list(map(str,[a[j],b[j]]))},list(zip(a,b))
 if kind.startswith('wrong-'):
  candidates=[]
  for j in range(len(values)):
   trial=values[:];trial[j]=None
   try:full,proof=fit(kind[6:],trial)
   except(AssertionError,ValueError,ZeroDivisionError,StopIteration):continue
   if full[j]!=values[j]:candidates.append((j,full,proof))
  j,full,p=one(candidates);p['actualWrongIndexAndReplacement']=[j,str(values[j]),str(full[j])];p['everyPossibleSingleWrongPositionExamined']=len(values);return values[j],p,full
 full,p=fit(kind,values);j=one(j for j,v in enumerate(values)if v is None);p['actualMissingIndex']=j;p['allActualFilledMembers']=list(map(str,full));return full[j],p,full

def solve(r,part,i,src=False):
 kind=source_kind(part,i)if src else one(k for k,h in HINTS.items()if r['statement'].startswith(h));assert kind==source_kind(part,i);values=parse(r['statement'],src,kind);out,p,full=evaluate(kind,values);p['actualFamily']=kind;p['allOriginalPrintedMembersReplayed']=True;p['exactTarget']=str(out)
 opts=B.options({**r,'options':r.get('options',[])})
 if opts:vals=[E.calc(v)for v in opts];assert len(opts)==len(set(opts))==4 and len(set(vals))==4 and vals.count(out)==1 and E.calc(r['answer'])==out and r['answer']in opts;p['allFourActualOptionValues']=list(map(str,vals))
 else:assert E.calc(r['answer'])==out
 if not src:
  if kind.startswith('wrong-'):assert H.numeric_tokens(r['solution'])[:2]==[F(p['actualWrongIndexAndReplacement'][2]),out]
  elif kind.startswith('fraction'):assert H.numeric_tokens(r['solution'])[:2]==list(map(F,p['exactNextNumeratorDenominator']))
  else:printed=one(re.findall(r'Толық тізбек: (.*?)\. (?:Келесі мүше|Бос орында)',r['solution']));assert [E.calc(v)for v in printed.split(';')]==full;p['allPrintedSolutionMembersEqualReconstruction']=True
 return out,p

def changed(r,part,i):
 d=copy.deepcopy(r);kind=one(k for k,h in HINTS.items()if r['statement'].startswith(h));v=parse(r['statement'],False,kind);old,proof,filled=evaluate(kind,v)
 if kind.startswith('fraction'):newValues=[((exact_root(a,2)+1)**2,b)for a,b in v[:-1]]if kind=='fraction-square-ap'else[(a+2,b)for a,b in v[:-1]];newValues.append(None)
 elif kind in['square','cube','wrong-square']:
  power=3 if kind=='cube'else 2;newValues=[None if x is None else(exact_root(filled[j],power)+1)**power+(x-filled[j])for j,x in enumerate(v)]
 elif kind=='square-offset':newValues=[None if x is None else x+1 for x in v]
 else:newValues=[None if x is None else x*2 for x in v]
 new,p,full=evaluate(kind,newValues);assert new!=old
 def text(x):return'?'if x is None else'('+str(x[0])+'/'+str(x[1])+')'if isinstance(x,tuple)else str(x)
 prefix=d['statement'].rsplit('\n\n',1)[0];d['statement']=prefix+'\n\n«'+'; '.join(map(text,newValues))+'».'
 if d.get('options'):d['options']=[str(E.calc(v)+new-old)for v in d['options']]
 d['answer']=str(new)
 # Changed-row solutions are intentionally recomputed from changed conditions,
 # rather than reusing the old explanation as proof.
 if kind.startswith('wrong-'):d['solution']=f"Осы орында {p['actualWrongIndexAndReplacement'][2]} тұруы керек. Берілген {new} ережені бұзады."
 elif kind.startswith('fraction'):a,b=p['exactNextNumeratorDenominator'];d['solution']=f'Келесі алым {a}, бөлім {b}. Жауап {new}.'
 else:d['solution']='Толық тізбек: '+'; '.join(map(str,full))+'. '+('Бос орында 'if p['actualMissingIndex']<len(full)-1 else'Келесі мүше ')+str(new)+'.'
 return d

def malformed(r):
 d=copy.deepcopy(r);kind=one(k for k,h in HINTS.items()if d['statement'].startswith(h));values=parse(d['statement'],False,kind)
 if kind.startswith('fraction'):a,b=values[0];values[0]=(a+2,b)
 else:values[0]+=101
 def text(v):return'?'if v is None else'('+str(v[0])+'/'+str(v[1])+')'if isinstance(v,tuple)else str(v)
 d['statement']=d['statement'].rsplit('\n\n',1)[0]+'\n\n«'+'; '.join(map(text,values))+'».';return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==60;entries=[];evidence=[];equalities=0;sourceOptions=0;mcq=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);part=int(r['editionId'].split('-')[-2]);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and not q['svg'];opts=B.options(q);sourceOptions+=len(opts);assert len(opts)==len(r.get('options',[]));key=one(v['text']for v in q['options']if v['correct'])if opts else one(re.findall(r'Жауабы:\s*(.*)',q['solution']));mcq+=bool(opts)
  if opts:assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:src=solve({**q,'answer':key},part,i,True)[1];_,proof=solve(r,part,i);d=changed(r,part,i)
  except Exception as e:raise AssertionError(('source/new/change',part,i))from e
  for bad in[{**r,'answer':'999999999'},{**d,'answer':r['answer']},malformed(r)]:
   try:solve(bad,part,i)
   except(AssertionError,ValueError,SyntaxError,IndexError,ZeroDivisionError,StopIteration):pass
   else:raise AssertionError(('badrowaccepted',part,i))
  solve(d,part,i);proof['validChangedActualInputsAnswer']=d['answer'];proof['oldKeyRejectedNewKeyAcceptedAndInconsistentPrintedMemberRejected']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for parttext in H.math_parts(q['solution'],True):
   sides=parttext.split('=')
   if len(sides)<2:continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(values))==1,('sourceOfficialEquality',part,i,parttext);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full saved/new conditions and official/new solutions all32source/newchoices read. Actual printed recurrence family and all known terms independently reconstructed with exact arithmetic, affine/quadratic interpolation, positional powers, independent alternating/interleaved rules, formal missing-term constraints, every single-error candidate and unreduced numerator/denominator patterns. All60 changed actual inputs reject old keys and accept recomputed answers; inconsistent printed members rejected. Same author computation, not another human. Numerical variants not distinct semantic stories.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert sourceOptions==32 and mcq==8
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':60,'sourceOptionsRead':32,'rewrittenOptionsRead':32,'openResponseTasks':52,'multipleChoiceTasks':8,'recurrenceFamilies':len({r['modelId']for r in rows}),'wrongKeysRejected':60,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':60,'inconsistentActualMembersRejected':60,'officialSourceArithmeticEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':60,'numericalVariantsNotSemanticUniqueStories':True,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
