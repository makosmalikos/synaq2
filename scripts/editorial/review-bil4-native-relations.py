"""All3fullsource/newconditions fullofficial/newsolutions/all15source/newchoices
and3sourcebitmaps read. Nativeaccessibletables andorderedchains replace bitmaps.
Same root author separate computationalreview, notanotherhumanreviewer.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil4-native-relations';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('s','scripts/editorial/review-bil4-native-symbolic.py');S=importlib.util.module_from_spec(sp);sp.loader.exec_module(S);B=S.B;H=S.H;E=S.E;one=S.one
ASSETS={4:('52e5919c400ccebf93f4697c','058e4e6e336ea8e682bc5f214f9be6f30e1122ce8998a4d0fab59d811a4de56e'),10:('ddc88d8b71a403c6b13390c3','3d04c6115621e4981833bace7fcdec4b1979297160b0d22132280466c7cb09bb'),13:('c9414e58836adab22703f72c','e14b936c582dbb9f7f34c00273d6554770fe1fa80b88444e33ac7f81a8b84b83')}
def asset(i):
 f,s=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==s;return s
def solve(r,i,src=False,check=True):
 p={};s=r['statement']
 if src:p['sourceRasterSHA256']=asset(i)
 if i==4:
  if src:pair1,pair2,pair3=map(F,[310,240,150])
  else:
   t=one(S.tables(s));assert t[0]==['Жұп','Толық биіктік, см']and[t[j][0]for j in[1,2,3]]==['Мұнара + робот','Мұнара + жәшік','Робот + жәшік'];pair1,pair2,pair3=[F(t[j][1])for j in[1,2,3]]
  out=(pair1+pair2-pair3)/2;second=pair1-out;third=pair2-out;assert min(out,second,third)>0 and second+third==pair3;p.update({'allThreeActualPairHeights':list(map(str,[pair1,pair2,pair3])),'allThreePositiveReconstructedHeights':list(map(str,[out,second,third])),'allThreeStackedPairsReplayed':True})
 elif i==10:
  if src:a=list(map(F,[21,25,24,0,27,29,30,31,33,33]));a[3]='X';b=list(map(F,[0,3,7,15,31,63,127,255]));b[0]='Y'
  else:
   pp=H.math_parts(s,False);assert len(pp)==3 and pp[-1]=='X + Y';a,b=[[F(v)if re.fullmatch(r'\d+',v.strip())else v.strip()for v in value.split(';')]for value in pp[:2]]
  assert len(a)==10 and a.count('X')==1 and a[3]=='X'and len(b)==8 and b[0]=='Y';odd=a[::2];assert len(set(v-u for u,v in zip(odd,odd[1:])))==1;even=a[1::2];step=(even[-1]-even[0])/4;known=[even[0]+j*step for j in range(5)];assert all(v=='X'or v==known[j]for j,v in enumerate(even));x=known[even.index('X')];alpha=(b[3]-b[2])/(b[2]-b[1]);beta=b[2]-alpha*b[1];assert alpha>1;assert all(v==u*alpha+beta for u,v in zip(b[1:],b[2:]));y=(b[1]-beta)/alpha;assert y*alpha+beta==b[1];out=x+y;p.update({'allActualOrderedFirstChain':list(map(str,a)),'actualOddSubsequence':list(map(str,odd)),'allReconstructedEvenSubsequence':list(map(str,known)),'allActualOrderedSecondChain':list(map(str,b)),'uniqueActualAffineMultiplierAndConstant':list(map(str,[alpha,beta])),'bothMissingValues':list(map(str,[x,y])),'allKnownChainTermsReplayed':True})
 else:
  if src:grids=[[[9,10],[3,4]],[[6,4],[7,5]],[[5,'?'],[2,3]]]
  else:
   raw=re.findall(r'(^\|[^\n]+\|\n\|[^\n]+\|\n\|[^\n]+\|)',s,re.M);assert len(raw)==3;grids=[]
   for block in raw:
    rows=[[v.strip()for v in row.strip('|').split('|')]for row in block.splitlines()];assert rows[1]==['---','---']and all(len(row)==2 and all(row)for row in rows);grids.append([rows[0],rows[2]])
  values=[]
  for g in grids:values.append([[F(v)if v!='?'else v for v in row]for row in g])
  for g in values[:2]:assert g[0][0]+g[1][1]==g[0][1]+g[1][0]
  a,b,c,d=values[-1][0]+values[-1][1];assert b=='?';out=a+d-c;assert out>0 and out+c==a+d;p['allActualThreeOppositeCornerGrids']=[[[str(v)for v in row]for row in g]for g in values];p['allThreeOppositeCornerSumsReplayed']=True
 p['target']=str(out)
 if check:p.update(B.checked_choices(r,out))
 return out,p

def changed(r,i):
 d=copy.deepcopy(r)
 if i==4:d['statement']=d['statement'].replace('| 380 |','| 400 |')
 elif i==10:d['statement']=d['statement'].replace('18; 22; 22; X; 26; 28; 30; 31; 34; 34','19; 23; 23; X; 27; 29; 31; 32; 35; 35')
 else:d['statement']=d['statement'].replace('| 9 | ? |','| 11 | ? |')
 old,_=solve(r,i);new,_=solve(d,i,False,False);assert old!=new;d['options']=[str(B.scalar(v)+new-old)for v in r['options']];d['answer']=str(new);return d

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==3;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);_,src=solve({**q,'answer':key},i,True);_,proof=solve(r,i);d=changed(r,i)
  for bad in[{**r,'answer':'99999'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError,IndexError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  new,_=solve(d,i);proof['validChangedActualInputTarget']=str(new);assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'All3fullsource/newconditions solutions/all15source/newchoices/three sourcebitmaps read. Actualnativepairedheighttablelabels/threepositiveindividualheights/allthreepairreplays, fullordered10termchain/allknownodd-evenarithmeticpositions andfull8termchain/uniqueaffinecoefficients/Y, allthree2×2tables/oppositecornerrelations checked. Changedactualcells/sequenceacceptrecomputedanswers andrejectold. Sameauthor notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':3,'sourceOptionsRead':15,'rewrittenOptionsRead':15,'nativeAccessibleTables':4,'fullOrderedChains':2,'wrongKeysRejected':3,'validChangedActualInputsRecomputed':3,'remainingBIL4SourceTasks':8,'pythonJavaScriptHashesMatched':3,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
