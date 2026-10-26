"""Both fullsource/newconditions fullsolutions all10source/newchoices andtwo
sourcebitmaps read. Accessible native tables, not images. Same root author
separate computation, not anotherhumanreviewer. No livebrowser QA claimed.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil3-native-tables';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('b','scripts/editorial/review-bil1-nonvisual.py');B=importlib.util.module_from_spec(sp);sp.loader.exec_module(B);H=B.H;one=B.one
ASSETS={3:('0006f5d6c3bf34101c2e1311','e8499947b79964731018421c6ba1de84dda67cb7f7e2a561210e4c93330e21f3'),49:('f976593ee72dbc145e282f33','d6e3ee99da12b270463888468ce17e0165f0deceff419c82889a4c9d5c4345d9')}
def table(s):
 lines=[v for v in s.splitlines()if v.startswith('|')];assert len(lines)>=4;cells=[[v.strip()for v in line.strip('|').split('|')]for line in lines];width=len(cells[0]);assert all(len(r)==width and all(r)for r in cells);assert all(re.fullmatch('-{3,}',v)for v in cells[1]);return[cells[0],*cells[2:]]
def solve(r,i,src=False):
 if src:
  f,sha=ASSETS[i];assert hashlib.sha256((ROOT/f'problems/sources/zerek/images/{f}.png').read_bytes()).hexdigest()==sha;proof={'sourceRasterSHA256':sha}
 else:rows=table(r['statement']);proof={'allActualTableCells':rows,'nativeAccessibleTextTableNotRaster':True}
 if i==3:
  if src:a,c,b,d=F(1),F(2),F(5),F(6);assert'жартысы'in r['statement']and'үштен бірі'in r['statement']
  else:
   assert rows[0]==['Деңгей','4-сынып','5-сынып','6-сынып']and rows[1][0]=='Бастаушы'and rows[2][0]=='Тәжірибелі'and rows[1][2]==rows[2][2]=='?';a,b=F(rows[1][1]),F(rows[1][3]);c,d=F(rows[2][1]),F(rows[2][3]);assert'жартысы 6-сыныпта'in r['statement']and'үштен бірі 5-сыныпта'in r['statement']
  total=2*(b+d);middle=(a+b)/2;experts=total-a-b-middle;middleExpert=experts-c-d;assert min(a,b,c,d,middle,middleExpert)>0 and all(v.denominator==1 for v in[a,b,c,d,middle,middleExpert]);assert middle==(a+b+middle)/3 and a+c+middle+middleExpert+b+d==total;out=experts/total;proof.update({'allSixReconstructedPositiveIntegerCounts':list(map(str,[a,middle,b,c,middleExpert,d])),'wholeClubMembers':str(total),'allExperts':str(experts),'bothActualGivenFractionsReplayed':True})
 else:
  if src:labels=['Пицца','Манты','Плов','Спагетти','Лагман'];counts=list(map(F,[132,112,88,44,24]));asked='Спагетти';assert'спагетти'in r['statement']
  else:
   assert rows[0]==['Тағам','Тапсырыс саны']and len(rows)==6;labels=[r[0]for r in rows[1:]];counts=[F(r[1])for r in rows[1:]];asked='Күріш';assert'күріш тағамына'in r['statement'];assert len(set(labels))==5
  assert all(v>0 and v.denominator==1 for v in counts);total=sum(counts);target=counts[labels.index(asked)];out=100*target/total;proof.update({'allFiveCounts':list(map(str,counts)),'wholeTableFrequency':str(total),'askedCategory':asked,'actualAskedCategoryCount':str(target)})
 proof['target']=str(out);proof.update(B.checked_choices(r,out));return proof

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==2;entries=[];evidence=[]
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=solve({**q,'answer':key},i,True);proof=solve(r,i);d=copy.deepcopy(r)
  if i==3:d['statement']=d['statement'].replace('| 3 | ? | 8 |','| 3 | ? | 10 |');new=F(5,8)
  else:d['statement']=d['statement'].replace('| Күріш | 75 |','| Күріш | 100 |');new=F(400,21)
  old=F(proof['target']);d['options']=[str(B.scalar(v)+new-old)for v in r['options']]
  for cr in[{**r,'answer':'99999'},{**d,'answer':r['answer']}]:
   try:solve(cr,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('wrongkeyaccepted',i))
  changed=solve({**d,'answer':str(new)},i);proof['validChangedActualTableTarget']=changed['target'];proof['oldKeyRejectedAndCorrectChangedCellsAccepted']=True;assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);entries.append({'editionId':r['editionId'],'sha256':hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Fullsource/newconditions solutions/all10source/newchoices/twosourcebitmaps read. ActualallnativeMarkdowncells/header/separator/unknownlocation checked. Fullsixpositiveintegerclubcounts reconstructedwithhalf-finalgrade/third-middle-beginnersreplay; actualallfivefrequencycategories/total/askedcategoryfraction checked. Changedactualtablecells rejectoldkey andacceptrecomputedanswer. Same root author notanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'nativeAccessibleTables':2,'wrongKeysRejected':2,'validChangedActualTableCellsRecomputed':2,'sourceBitmapsReused':0,'pythonJavaScriptHashesMatched':2,'remainingBIL3VisualTasks':9,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
