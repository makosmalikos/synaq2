"""All40 saved/new full conditions and official/new solutions read. No MCQ
choices or images in these sources. Own native Markdown tables, brackets and
full actual-cell recomputation. Source2/14 B sign ambiguity explicitly recorded;
new A/B domain positive. Same author computation, not another human reviewer.
"""
import copy,hashlib,importlib.util,itertools,json,math,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='logic-tables';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('c','scripts/editorial/review-logic-sequences.py');C=importlib.util.module_from_spec(sp);sp.loader.exec_module(C);B=C.B;H=C.H;E=C.E;N=C.N;G=C.G;one=C.one
MAP=[
[('rows','sum'),('rows','mul'),('rows','sum'),('rows','mul'),('columns','scale'),('columns','offset'),('columns','scale'),('brackets','diff'),('brackets','sum'),('brackets','mul'),('brackets','diff'),('brackets','sum'),('xy','offset'),('xy','scale'),('rows','sum3'),('rows','sum3'),('rows','sum-scale'),('rows','square-plus'),('rows','diff-scale'),('rows','product-minus')],
[('rows','product-plus'),('rows','sum-product'),('brackets','square-minus'),('brackets','sum-scale'),('brackets','product-offset'),('brackets','diff-scale'),('constant-sum','constant'),('constant-sum','constant'),('rows','product-minus'),('rows','sum-product'),('columns','affine'),('columns','square-offset'),('ab','sum-scale'),('ab','square-plus'),('brackets','digit-sum'),('brackets','divide-offset'),('rows','difference-square'),('rows','product-offset'),('column-pairs','product-offset'),('column-pairs','sum-square')]]

def cell(s):
 s=s.strip();return s if s in['?','A','B']else E.calc(s)
def table(s,src,mode):
 if src:
  body=one(re.findall(r'\\begin\{array\}\{[^}]*\}(.*?)\\end\{array\}',s,re.S));rows=[]
  for row in re.split(r'\\\\',body):
   row=re.sub(r'\\hline','',row).strip()
   if not row:continue
   cells=[re.sub(r'\\text\{([^}]+)\}',r'\1',v).strip()for v in row.split('&')]
   if cells[0]in['I','II','III','IV']and any(re.search(r'\d|\?',v)for v in cells[1:]):cells=cells[1:]
   try:rows.append([cell(v)for v in cells])
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
  if mode=='columns':assert len(rows)==3;rows=rows[1:]
 else:
  lines=[v.strip()for v in s.splitlines()if v.strip().startswith('|')];assert len(lines)>=4 and re.fullmatch(r'[|\s:-]+',lines[1]);rows=[[cell(v)for v in line.strip('|').split('|')]for line in lines[2:]]
 assert rows and len({len(v)for v in rows})==1;return rows

def parse(s,part,i,src=False):
 mode,kind=MAP[part-1][i-1]
 if mode=='brackets':rows=[[F(a),F(b),cell(v)]for a,v,b in re.findall(r'(\d+)\s*\((\d+|\?)\)\s*(\d+)',s)];assert len(rows)==3
 elif src and part==2 and i in[9,10]:rows=[[cell(x)for x in re.findall(r'\d+|\?',v)]for v in H.math_parts(s,True)if'boxed'in v];assert len(rows)==3 and all(len(v)==4 for v in rows)
 else:rows=table(s,src,mode)
 return mode,kind,rows

def apply(kind,x,k=None):
 a=x[0];b=x[1]if len(x)>1 else F(0);c=x[2]if len(x)>2 else F(0)
 if kind=='sum':return a+b
 if kind=='mul':return a*b
 if kind=='diff':return a-b
 if kind=='sum3':return a+b+c
 if kind=='sum-scale':return(a+b)*k
 if kind=='diff-scale':return(a-b)*k
 if kind=='square-plus':return a*a+b
 if kind=='product-minus':return a*b-c
 if kind=='product-plus':return a*b+c
 if kind=='sum-product':return(a+b)*c
 if kind=='square-minus':return a*a-b
 if kind=='product-offset':return a*b+k
 if kind=='digit-sum':assert a.denominator==b.denominator==1 and min(a,b)>0;return F(sum(map(int,str(a.numerator)+str(b.numerator))))
 if kind=='divide-offset':assert b;return a/b+k
 if kind=='difference-square':return(a-b)**2
 if kind=='sum-square':return(a+b)**2
 if kind=='scale':return a*k
 if kind=='offset':return a+k
 if kind=='affine':return a*k[0]+k[1]
 if kind=='square-offset':return a*a+k
 raise AssertionError(kind)
def infer(kind,cases):
 assert cases
 if kind=='affine':
  first=cases[0];second=next(v for v in cases if v[0]!=first[0]);a=(second[-1]-first[-1])/(second[0]-first[0]);return(a,first[-1]-a*first[0])
 vals=[]
 for row in cases:
  x,y=row[:-1],row[-1];a=x[0];b=x[1]if len(x)>1 else F(0)
  if kind=='sum-scale':assert a+b;v=y/(a+b)
  elif kind=='diff-scale':assert a-b;v=y/(a-b)
  elif kind=='product-offset':v=y-a*b
  elif kind=='divide-offset':assert b;v=y-a/b
  elif kind=='scale':assert a;v=y/a
  elif kind=='offset':v=y-a
  elif kind=='square-offset':v=y-a*a
  else:assert apply(kind,x)==y;continue
  vals.append(v)
 return one(set(vals))if vals else None

def target(r,part,i,src=False):
 mode,kind,rows=parse(r['statement'],part,i,src);p={'actualMode':mode,'actualRuleFamily':kind,'allActualPrintedCells':[[str(v)for v in row]for row in rows]};cases=[]
 if mode=='constant-sum':
  complete=[row for row in rows if'?'not in row];total=one({sum(v)for v in complete});last=one(row for row in rows if'?'in row);out=total-sum(v for v in last if v!='?');assert out>0;p['actualCommonRowSum']=str(total);p['actualKnownSumInUnknownRow']=str(total-out);p['exactTarget']=str(out);return out,p,[]
 if mode in['columns','column-pairs']:cases=[list(v)for v in zip(*rows)]
 else:cases=copy.deepcopy(rows)
 complete=[v for v in cases if all(isinstance(x,F)for x in v)];k=infer(kind,complete);assert all(apply(kind,v[:-1],k)==v[-1]for v in complete);p['actualInferredSharedParameter']=list(map(str,k))if isinstance(k,tuple)else str(k);solved=[];asked=[]
 for row in cases:
  new=row[:]
  if mode=='ab'and row[0]=='B':
   if kind=='sum-scale':value=row[-1]/k-row[1]
   else:
    assert kind=='square-plus';square=row[-1]-row[1];value=C.exact_root(square,2);p['bothUnrestrictedSquareInputCandidates']=[str(value),str(-value)];p['sourceOfficialPositiveBInterpretationExplicitInNewTask']=True
   assert value>0;new[0]=value;asked.append(('B',value))
  if isinstance(row[-1],str):new[-1]=apply(kind,new[:-1],k);asked.append((row[-1],new[-1]))
  assert apply(kind,new[:-1],k)==new[-1];solved.append(new)
 if mode=='xy':
  x=F(one(re.findall(r'x\s*=\s*(\d+)',r['statement'])));out=apply(kind,[x],k);solved.append([x,out])
 elif mode=='ab':
  assert sorted(v[0]for v in asked)==['A','B'];assert src or'A және B — оң сандар'in r['statement'];out=sum(v for key,v in asked);p['actualAAndB']={key:str(v)for key,v in asked}
 else:out=one(v for key,v in asked)
 assert out>0;p['allActualCompletedCases']=[[str(v)for v in row]for row in solved];p['allKnownAndCompletedCasesReplayed']=len(solved);p['exactTarget']=str(out);return out,p,solved

def solve(r,part,i,src=False):
 out,p,cases=target(r,part,i,src);assert E.calc(r['answer'])==out
 if not src:
  assert not r.get('options')
  if cases:
   printed=[([E.calc(v)for v in xs.split(';')],E.calc(y))for xs,y in re.findall(r'\(([^()]+)\) → ([0-9/]+)',r['solution'])];assert printed==[(v[:-1],v[-1])for v in cases],('solutionCells',part,i,printed,cases);p['allPrintedSolutionCasesMatchActualCells']=True
  else:assert H.numeric_tokens(r['solution'])[:3]==[F(p['actualCommonRowSum']),F(p['actualCommonRowSum']),out]
 return out,p

def rewrite_rows(r,rows,mode):
 d=copy.deepcopy(r)
 if mode=='brackets':
  prefix=d['statement'].split('\n\n')[0];d['statement']=prefix+'\n\n'+'\n\n'.join(f'«{a} ({v}) {b}»'for a,b,v in rows)
 else:
  lines=d['statement'].splitlines();first=next(j for j,v in enumerate(lines)if v.strip().startswith('|'));header=lines[first:first+2];d['statement']='\n'.join(lines[:first]+header+['| '+' | '.join(map(str,row))+' |'for row in rows])
 return d

def changed(r,part,i):
 mode,kind,rows=parse(r['statement'],part,i)
 if mode=='xy':
  old=one(re.findall(r'x = (\d+)',r['statement']));d=copy.deepcopy(r);d['statement']=d['statement'].replace('x = '+old,'x = '+str(int(old)+1))
 else:
  if mode in['columns','column-pairs']:col=one(j for j,v in enumerate(rows[-1])if v=='?');rows[0][col]+=1
  elif mode=='ab':rows[2][0]+=1
  else:row=one(v for v in rows if'?'in v);row[0]+=1
  d=rewrite_rows(r,rows,mode)
 old=target(r,part,i)[0];new,p,cases=target(d,part,i);assert new!=old;d['answer']=str(new)
 if cases:d['solution']='. '.join('('+ '; '.join(map(str,v[:-1]))+') → '+str(v[-1])for v in cases)+'.'
 else:d['solution']=p['actualCommonRowSum']+'; '+p['actualCommonRowSum']+'; '+str(new)
 return d

def malformed(r,part,i):
 mode,kind,rows=parse(r['statement'],part,i)
 if mode in['columns','column-pairs']:j=next(j for j,v in enumerate(rows[-1])if v!='?');rows[-1][j]+=1
 else:rows[0][-1]+=1
 return rewrite_rows(r,rows,mode)

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==40;entries=[];evidence=[];equalities=0;tables=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);part=int(r['editionId'].split('-')[-2]);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and not q['svg']and not q['options'];key=one(re.findall(r'Жауабы:\s*(.*)',q['solution']));tables+='|'in r['statement']
  try:src=solve({**q,'answer':key},part,i,True)[1];_,proof=solve(r,part,i);d=changed(r,part,i)
  except Exception as e:raise AssertionError(('source/new/changed',part,i))from e
  for bad in[{**r,'answer':'999999999'},{**d,'answer':r['answer']},malformed(r,part,i)]:
   try:solve(bad,part,i)
   except(AssertionError,ValueError,SyntaxError,IndexError,ZeroDivisionError,StopIteration):pass
   else:raise AssertionError(('badrowaccepted',part,i))
  solve(d,part,i);proof['validChangedActualInputsAnswer']=d['answer'];proof['oldKeyRejectedNewKeyAcceptedAndInconsistentCellRejected']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image')and not r.get('options');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution'])
  for expr in H.math_parts(q['solution'],True):
   sides=expr.split('=')
   if len(sides)<2:continue
   try:values=[N.exact_power_arithmetic(v)for v in sides]
   except(AssertionError,ValueError,SyntaxError,KeyError):continue
   assert len(set(values))==1,('sourceOfficialArithmetic',part,i,expr);equalities+=len(sides)-1
  sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Full40 saved/new conditions and official/new solutions read. All open responses retained. Actual printed native table/bracket cells, shared coefficients from complete examples, unknown cells, positive square input and all full completed solution cases independently recomputed. All40 changed actual inputs reject old answers and accept recomputed answers; inconsistent known cells rejected. Same author computation; numerical variants not semantic unique stories.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 assert tables==29
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':40,'nativeTables':29,'nativeBracketTasks':11,'openResponseTasks':40,'sourceOptionsRead':0,'rewrittenOptionsRead':0,'wrongKeysRejected':40,'validChangedActualInputsRejectOldAndAcceptRecomputedAnswers':40,'inconsistentActualCellsRejected':40,'officialSourceArithmeticEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':40,'separateHumanReviewer':False}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
