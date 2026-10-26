"""All4 fullsource/newconditions official/newsolutions/all20source/newchoices
and3sourcebitmaps read. Source36 underbrace-minus ambiguity explicitly recorded;
source condition unchanged, literal43/5 vs official-intended1 are distinguished.
Same root author separate computation, notanotherhumanreviewer. Native tables
andmathtext, no bitmap/nativePNG orlivebrowser QA claims.
"""
import copy,hashlib,importlib.util,itertools,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-symbolic';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('t','scripts/editorial/review-bil3-native-tables.py');T=importlib.util.module_from_spec(sp);sp.loader.exec_module(T);B=T.B;H=T.H;E=B.E;one=T.one
ASSETS={2:('d29e0107ffd14e8218ed9c34','1895e1e0bff028a8dc0f8eb536e3d7afd001a62cc71e32d5467c97aedab8a7c8'),7:('797c35deb5d1ff9a7019c048','674fc3dc68641da72ac018e9ec4b39d445f765b28f3a53809699966cb9b41a23'),11:('dc3fdd56592331fdcce0fd89','44be89b1849f94ae1c4eaf9927a02bea59cf13002ca91e451ef71bfaa8cd5904')}
def asset(i):
 f,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;return sha
def tables(s):
 groups=[];current=[]
 for line in s.splitlines()+['']:
  if line.startswith('|'):current.append(line)
  elif current:groups.append(T.table('\n'.join(current)));current=[]
 return groups

def codes(locks,keys):
 chars=sorted(set(''.join(locks)));digits=sorted(set(''.join(keys)));assert len(chars)==len(digits)==5 and len(locks)==len(set(locks))==5 and len(keys)==len(set(keys))==4;outcomes=[]
 for perm in itertools.permutations(digits):
  mapping=dict(zip(chars,perm));values={word:''.join(mapping[c]for c in word)for word in locks}
  if set(keys)<=set(values.values()):missing=one(k for k,v in values.items()if v not in keys);outcomes.append((missing,mapping,values[missing]))
 assert outcomes;target=one({v[0]for v in outcomes});return target,{'all120BijectiveFiveLetterDigitAssignmentsChecked':120,'consistentFullSubstitutionCount':len(outcomes),'allUniqueMissingLockCandidates':sorted({v[0]for v in outcomes}),'oneFullActualLetterDigitAssignment':outcomes[0][1],'actualMissingKeyDigits':outcomes[0][2]}
def braces(s,start):
 assert s[start]=='{';depth=0
 for j in range(start,len(s)):
  if s[j]=='{':depth+=1
  elif s[j]=='}':
   depth-=1
   if depth==0:return s[start+1:j],j+1
 raise AssertionError('unclosed brace')
def source_repeat(q):
 s=q['statement'];groups=[];pos=0
 while True:
  j=s.find('\\underbrace',pos)
  if j<0:break
  body,end=braces(s,j+len('\\underbrace'));assert s[end:end+1]=='_';label,pos=braces(s,end+1);fractions=re.findall(r'\\tfrac\{1\}\{(\d+)\}',body);assert len(fractions)==3 and len(set(fractions))==1;count=int(one(re.findall(r'\d+',label)));groups.append((F(1,int(fractions[0])),count,body))
 assert len(groups)==3;assert'+'in groups[0][2]and'-'in groups[1][2]and'+'in groups[2][2];a,na,_=groups[0];b,nb,_=groups[1];c,nc,_=groups[2];official=(na*a-nb*b)*(nc*c);literal=(na*a-(b-(nb-1)*b))*(nc*c);assert official==1 and literal==F(43,5)and str(official)==q['answer'];return official,{'allThreeActualUnderbraceFractionAndRepeatCounts':[[str(a),na],[str(b),nb],[str(c),nc]],'sourceLiteralNestedMinusReading':str(literal),'sourceOfficialIntendedRepeatedSubtractionReading':str(official),'sourceUnderbraceMinusAmbiguityExplicitlyRepaired':True,'sourceConditionNotSilentlyChanged':True}
def solve(r,i,src=False,check=True):
 s=r['statement'];parts=H.math_parts(s,src);p={}
 if src and i!=36:p['sourceRasterSHA256']=asset(i)
 if i==2:
  if src:arrays=[[[3,8,9],[8,'x',4],[7,7,6]],[[2,9,9],[9,8,3],[5,9,'y']]]
  else:
   ts=tables(s);assert len(ts)==2 and all(t[0]==['Сол жақ','Орта','Оң жақ']and len(t)==4 for t in ts);arrays=[[[F(v)if v not in'xy'else v for v in row]for row in t[1:]]for t in ts]
  totals={sum(F(v)for v in row)for a in arrays for row in a if all(v not in['x','y']for v in row)};total=one(totals);roots={}
  for a in arrays:
   for row in a:
    variables=[v for v in row if v in['x','y']]
    if variables:var=one(variables);assert var not in roots;roots[var]=total-sum(F(v)for v in row if v not in['x','y'])
  assert set(roots)=={'x','y'}and all(v>0 and v.denominator==1 for v in roots.values());out=roots['x']+roots['y'];p.update({'allActualTwoThreeByThreeTables':[[list(map(str,row))for row in a]for a in arrays],'allSixActualRowSumsReconstructed':str(total),'actualBothUnknowns':{k:str(v)for k,v in roots.items()}})
 elif i==7:
  if src:locks=['AKT','NTK','TAN','MKT','NKA'];keys=['645','634','143','543']
  else:locks=one(re.findall(r'Құлыптар: ([A-Z, ]+)\.',s)).split(', ');keys=one(re.findall(r'Кілттер: (\d+, \d+, \d+, \d+) және',s)).split(', ')
  out,proof=codes(locks,keys);p.update(proof);assert set(B.options(r))==set(locks)
 elif i==11:
  if src:eqs=['overline(AAAA)+overline(AAA)=6110','overline(BB)-overline(AB)=20'];variables=['A','B']
  else:eqs=[v for v in parts if'='in v];variables=['P','Q'];assert len(eqs)==2
  def concat(m):return'('+ '+'.join(f'{10**j}*{c}'for j,c in enumerate(reversed(m[1])))+')'
  eqs=[re.sub(r'overline\(([A-Z]+)\)',concat,v)for v in eqs];solutions=[]
  for a,b in itertools.product(range(1,10),repeat=2):
   env=dict(zip(variables,map(F,[a,b])))
   if all(E.expr(eq.split('=')[0]).value(env)==E.expr(eq.split('=')[1]).value(env)for eq in eqs):solutions.append(env)
  env=one(solutions);out=sum(env.values());p['all81PositiveDigitAssignmentsChecked']=81;p['actualUniqueDigitAssignment']={k:str(v)for k,v in env.items()};p['bothCompleteConcatenationEquationsReplayed']=True
 else:
  if src:out,proof=source_repeat(r);p.update(proof)
  else:
   matches=re.findall(r'([ABC]) қосындысында \((\d+)/(\d+)\) саны (\d+) рет',s);assert len(matches)==3;values={key:F(int(a),int(b))*int(count)for key,a,b,count in matches};assert set(values)=={'A','B','C'};expr=one(parts);out=E.expr(expr).value(values);assert E.expr(expr).equals(E.expr('(A-B)*C'));p.update({'allActualPrintedFractionRepeatPairs':[[key,a,b,count]for key,a,b,count in matches],'allThreeActualRepeatedSums':{k:str(v)for k,v in values.items()},'explicitTargetExpressionRemovesSourceNestedMinusAmbiguity':True})
 p['target']=str(out)
 if check:
  if i==7:assert r['answer']==out and B.options(r).count(out)==1
  else:p.update(B.checked_choices(r,out))
 return out,p

def changed(r,i):
 d=copy.deepcopy(r)
 if i==2:d['statement']=d['statement'].replace('| 9 | x | 5 |','| 7 | x | 5 |')
 elif i==7:d['statement']=d['statement'].replace('528, 572','785, 572')
 elif i==11:d['statement']=d['statement'].replace('4888','6110')
 else:d['statement']=d['statement'].replace('(1/10) саны 20 рет','(1/10) саны 30 рет')
 old,_=solve(r,i);new,_=solve(d,i,False,False);assert new!=old
 if i!=7:d['options']=[str(B.scalar(v)+new-old)for v in r['options']]
 d['answer']=str(new);return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==4;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer'])
  try:_,src=solve({**q,'answer':key},i,True);_,proof=solve(r,i);d=changed(r,i)
  except Exception as e:raise AssertionError(('source/new/changed',i))from e
  for bad in[{**r,'answer':'999999999'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,SyntaxError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  new,_=solve(d,i);proof['validChangedActualInputTarget']=str(new);assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All4fullsource/newconditions solutions/all20source/newchoices/three sourcebitmaps read. Actualall18tablecells/fullsixrows/unknowns, all120fiveletter-digitbijections/allfourkeys/oneabsentlock, all81positiveP/Qdigits/bothentireconcatenationequations, actualfractioncounts/targetformula checked. Source36literalunderbrace-minus43/5 differofficialintended1; bothrecorded, originalsourceuntouched, nativeexplicitrewrittencondition removesambiguity/newanswer2. Validchangedactualinputrejectoldkeyandacceptrecomputedanswer. Sameauthor notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':4,'sourceOptionsRead':20,'rewrittenOptionsRead':20,'nativeAccessibleTables':2,'sourceBitmapTasksReplacedByNativeText':3,'sourceKaTeXLayoutArtifactsRemoved':1,'sourceUnderbraceAmbiguitiesExplicitlyRepaired':1,'wrongKeysRejected':4,'validChangedActualInputsRecomputed':4,'remainingBIL4SourceTasks':11,'pythonJavaScriptHashesMatched':4,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
