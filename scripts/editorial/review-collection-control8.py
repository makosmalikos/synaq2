"""All5full saved/new conditions/full official/new explanations and all3MCQsets
read. Same root author separate exact computation, not separate human reviewer.
Actual full lighter-coin decision tree checked, not capacity bound alone. Given
year-cycle order read from source/new text; no changing current-year reference.
"""
import copy,hashlib,importlib.util,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-control8';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('equations',ROOT/'scripts/editorial/review-collection-equations12.py');E=importlib.util.module_from_spec(sp);sp.loader.exec_module(E);H=E.H;one=H.one
def opts(r):return[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
def set_answer(s):
 p=E.plain(s).replace(' ','');m=re.fullmatch(r'([xt])([<>])(-?\d+(?:\.\d+)?)',p)
 if m:return('lower'if m[2]=='>'else'upper',F(m[3]))
 a,v,b=one(re.findall(r'^(-?\d+(?:\.\d+)?)<([xt])<(-?\d+(?:\.\d+)?)$',p));return('open',F(a),F(b))
def coin_tree(total):
 paths={}
 for fake in range(total):
  candidates=list(range(total));steps=[]
  while len(candidates)>1:
   side=math.ceil(len(candidates)/3);left=candidates[:side];right=candidates[side:2*side];outside=candidates[2*side:];assert len(left)==len(right)>0;outcome='left_lighter'if fake in left else'right_lighter'if fake in right else'balanced';nextSet=left if fake in left else right if fake in right else outside;steps.append({'left':left,'right':right,'outside':outside,'outcome':outcome});assert fake in nextSet and len(nextSet)<len(candidates);candidates=nextSet
  assert one(candidates)==fake;paths[str(fake)]=steps
 maximum=max(map(len,paths.values()));minimum=0
 while 3**minimum<total:minimum+=1
 assert maximum==minimum;return minimum,paths
def solve(r,i,src=False):
 s=r['statement'];n=H.numeric_tokens(s);p=H.math_parts(s,src);parse=E.calc;proof={}
 if i==1:
  if src:body=one(re.findall(r'\\begin\{cases\}(.*?)\\end\{cases\}',one(p),re.S));equations=re.split(r'\\\\(?:\[[^\]]+\])?',body);var='x'
  else:equations=p;var='t'
  assert len(equations)==2;bounds=[]
  for equation in equations:
   l,op,rhs=re.split('([<>])',E.plain(equation));[a],b=E.affine('('+l+')-('+rhs+')',(var,));assert a;assert(a>0 and op=='>')or(a<0 and op=='<');bounds.append(-b/a)
  out=('lower',max(bounds));parse=set_answer;proof={'allStrictLowerBounds':list(map(str,bounds)),'intersectionStrictLower':str(max(bounds)),'allRealNotJustIntegerSolution':True,'boundaryExcluded':True}
 elif i==2:
  batch,selected,total,needBatch,perBatch=n;groups=total/batch;selectedTotal=groups*selected;needGroups=selectedTotal/needBatch;out=needGroups*perBatch;assert all(v.denominator==1 for v in[groups,selectedTotal,needGroups,out])and min(groups,needGroups)>0;proof={'firstWholeGroups':str(groups),'selectedItems':str(selectedTotal),'secondWholeGroups':str(needGroups),'requiredTotal':str(out)}
 elif i==3:
  total,allowed=map(int,n);minimum,paths=coin_tree(total);possible=minimum<=allowed;values=opts(r);assert E.plain(values[0])=='Иә, болады'and E.plain(values[1])=='Жоқ, болмайды';atLeast=int(one(H.numeric_tokens(values[2])));oneWeighing=int(one(H.numeric_tokens(values[3])));truths=[possible,not possible,not possible and minimum>=atLeast,minimum<=oneWeighing];out=E.plain(one(v for v,t in zip(values,truths)if t));parse=E.plain;proof={'coinCount':total,'allowedWeighings':allowed,'optimalWorstCaseWeighings':minimum,'allFakeCoinPaths':paths,'everyFakeLocationIdentified':True,'equalPanCountsMakeOutcomesValidForAnyStrictlyLighterMass':True,'informationBoundOneFewerInsufficient':3**(minimum-1)<total,'allFourAnswerPropositionTruths':truths}
 elif i==4:
  initial,percent,target=n;assert 0<target<percent<100;solute=initial*percent/100;final=solute/(target/100);out=final-initial;assert out>0 and solute/(initial+out)==target/100;proof={'conservedSoluteGrams':str(solute),'newWholeMass':str(final),'addedWaterTarget':str(out)}
 elif i==5:
  text=r['solution']if src else s;cycle=one(re.findall(r'(?:Жыл қайыру реті:|ретімен қайталанады:)\s*([^\.\n]+)',text));cycle=[t.strip().casefold()for t in cycle.split(',')];assert len(cycle)==len(set(cycle))==12;anchorYear,anchorName=one(re.findall(r'(\d{4}) жыл\s*[–—-]\s*(\w+) жылы',s));years=list(map(int,re.findall(r'\b\d{4}\b',s)));assert len(years)==2 and years[0]==int(anchorYear);delta=years[1]-years[0];offset=delta%len(cycle);out=cycle[(cycle.index(anchorName)+offset)%len(cycle)];parse=lambda x:E.plain(x).removesuffix(' жылы').casefold();proof={'cycleOrderReadFromPrintedText':cycle,'givenAnchorYear':years[0],'givenAnchorName':anchorName,'targetYear':years[1],'difference':delta,'remainder':offset,'onlyGivenCycleUsedNotCurrentDate':True}
 else:raise AssertionError(i)
 assert parse(r['answer'])==out,(i,src,out,r['answer']);proof['answer']=str(out)
 if opts(r):
  values=[parse(o)for o in opts(r)];assert len(values)==len(set(values))==4 and values.count(out)==1;proof['everyOptionValue']=list(map(str,values));proof['correctOptionIndex']=values.index(out)
  if src:assert[j for j,o in enumerate(r['options'])if o['correct']]==[values.index(out)]
 return proof
def mutation(r,i):
 pairs={1:('(5/4)','(9/4)'),2:('360 қорап','450 қорап'),3:('2 реттен','1 реттен'),4:('180 г','200 г'),5:('2245','2246')};a,b=pairs[i];assert a in r['statement'];q=copy.deepcopy(r);q['statement']=q['statement'].replace(a,b);return q
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==5;entries=[];evidence=[];equalities=mcqs=missing=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert q['solution']and not q['images'];assert len(q['svg'])==(2 if i==1 else 0);answer=q['sourceAnswer']or one(re.findall(r'Жауабы:\s*(.*)',q['solution'])).strip();mcqs+=bool(opts(q));missing+=q['sourceAnswer']is None
  try:src=solve({**q,'answer':answer},i,True);proof=solve(r,i)
  except Exception as e:raise AssertionError(('source/new',i))from e
  assert r['minimumPlan']=='pro'and r['statement']!=q['statement']and len(opts(r))==len(opts(q))and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution']+r['answer'])
  for bad in[{**r,'answer':'999999999'},mutation(r,i)]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,ZeroDivisionError):pass
   else:raise AssertionError(('canary accepted',i))
  for match in re.finditer(r'[0-9(),.+−×÷/\s=]+',r['solution']):
   before=r['solution'][:match.start()].rstrip()
   if before and before[-1].isascii()and before[-1].isalpha():continue
   sides=[s.strip().rstrip('.,')for s in match[0].split('=')]
   if len(sides)<2 or not all(sides):continue
   try:values=[E.calc(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError):continue
   assert len(set(values))==1,('printed equality',i,match[0]);equalities+=len(sides)-1
  entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All5source/new conditions and complete official/new solutions/all3MCQsets read. Exact real strict-bound intersection, both full batch steps, full adaptive balance decision tree for EVERYcounterfeit location plus optimal information lower bound, conserved solute and printed12year cycle checked. Same author, not separate human reviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed')walk([n.fraction]);else if(n.type==='text'&&/[0-9A-Za-z)]\\s*\\/\\s*[0-9A-Za-z(]/.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions}));";native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':5,'fullSourceNewConditionsAndSolutionsRead':5,'sourceKeysNotCaptured':missing,'allSourceAndNewOptionsChecked':mcqs*8,'wrongKeysRejected':5,'printedSemanticCanariesRejected':5,'nativeFractions':native['fractions'],'allSourceAndNewCoinLocationsExhaustivelyChecked':13,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':5,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
