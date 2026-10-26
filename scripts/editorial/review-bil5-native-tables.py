"""Both complete source/new conditions official/new solutions and all10 choices
read. Actual native table cells parsed, inclusive progressive billing checked.
Same root author separate computational review, not another human reviewer.
"""
import copy,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='bil5-native-tables';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('b','scripts/editorial/review-bil1-nonvisual.py');B=importlib.util.module_from_spec(sp);sp.loader.exec_module(B);H=B.H;one=B.one
def table(s):
 lines=[v for v in s.splitlines()if v.startswith('|')];assert len(lines)==4;cells=[[v.strip()for v in line.strip('|').split('|')]for line in lines];assert all(len(v)==2 and all(v)for v in cells)and cells[1]==['---','---'];return[cells[0],*cells[2:]]
def solve(r,i,src=False):
 s=r['statement'];p={}
 if src:
  limit=F(one(re.findall(r'text\{0-ден (\d+) м',s)));assert len(re.findall(r'text\{40 м',s))==1
  rates=[F(v.replace('{,}','.'))for v in re.findall(r'& (\d+\{,\}\d+) \\text',s)];assert len(rates)==2;tail=s.split('\\end{array}$')[1];amount=one(H.numeric_tokens(tail));p['capturedTableUsesOfficialProgressiveExcessOnlyInterpretation']=True
 else:
  cells=table(s);assert cells[0]==['Айлық көлемнің бөлігі','1 м³ бағасы'];limit=F(one(re.findall(r'Алғашқы (\d+) м³',cells[1][0])));assert cells[1][0]==f'Алғашқы {limit} м³ ({limit} м³ қоса)'and cells[2][0]==f'{limit} м³-ден асқан әр м³';rates=[B.scalar(v[1])for v in cells[1:]];amount=one(H.numeric_tokens(s.splitlines()[-1]));assert 'тек шектен асқан бөлігі'in s;p['allActualNativeTableCells']=cells;p['explicitInclusiveThresholdAndMarginalRateRule']=True
 a,b=rates;assert min(limit,a,b)>0 and b>a
 def bill(v):assert v>=0;return min(v,limit)*a+max(0,v-limit)*b
 if i==49:
  volume=amount;out=bill(volume);assert volume==limit;p['exactThresholdVolume']=str(volume);p['noExcessUnitsChargedAtSecondRate']=True
 else:
  payment=amount;out=payment/a if payment<=limit*a else limit+(payment-limit*a)/b;assert out>limit and out.denominator==1 and bill(out)==payment;p['bothFirstAndExcessVolume']=list(map(str,[limit,out-limit]));p['inverseVolumeReplaysFullBillExactly']=True
 assert bill(limit)==limit*a and bill(limit+1)==limit*a+b and bill(limit-1)==(limit-1)*a;p['actualThresholdRates']=list(map(str,[limit,a,b]));p['bothSidesAndExactBoundaryChecked']=True;p['target']=str(out);p.update(B.checked_choices(r,out));return p
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];entries=[];evidence=[];assert len(rows)==2
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(v for v in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if v['number']==i);assert q['solution']and not q['images']and len(q['options'])==5;key=one(v['text']for v in q['options']if v['correct']);assert H.canon(key)==H.canon(q['sourceAnswer']);src=solve({**q,'answer':key},i,True);proof=solve(r,i);d=copy.deepcopy(r)
  if i==49:d['statement']=d['statement'].replace('52.4 теңге','54.4 теңге');new=F(1632)
  else:d['statement']=d['statement'].replace('2804 теңге','3112 теңге');new=F(55)
  old=F(proof['target']);d['options']=[str(B.scalar(v)+new-old)for v in r['options']]
  for bad in[{**r,'answer':'99999'},{**d,'answer':r['answer']}]:
   try:solve(bad,i)
   except(AssertionError,ValueError):pass
   else:raise AssertionError(('oldkeyaccepted',i))
  changed=solve({**d,'answer':str(new)},i);proof['validChangedActualTableOrBudgetTarget']=changed['target'];assert r['minimumPlan']=='pro'and r['grade']==6 and r['statement']!=q['statement']and not r.get('image');assert not re.search(r'[\\$]|\[Image:',r['statement']+r['solution']);sha=hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest();entries.append({'editionId':r['editionId'],'sha256':sha,'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'Bothfullsource/newconditions official/newsolutions/all10choicesread. ActualallnativeMarkdownheaders/threshold/rates/marginalrule parsed; exactinclusiveboundary andunitbelow/above checked. Directbillatexactthreshold/inversevolume checkedexactfractions; inverseforwardbillreplayed. Changedactualrate/budgetrejectoldkeyandacceptrecomputedanswer. Sameauthornotanotherhumanreviewer.','notes':[json.dumps(proof,ensure_ascii=False)]});evidence.append({'editionId':r['editionId'],'savedSource':src,'rewritten':proof})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"')).editions.map(r=>[r.editionId,editionHash(r)])));";hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries);summary={'verified':2,'sourceOptionsRead':10,'rewrittenOptionsRead':10,'nativeAccessibleTables':2,'wrongKeysRejected':2,'validChangedActualTableOrBudgetTargetsRecomputed':2,'exactInclusiveProgressiveBoundaryChecked':2,'pythonJavaScriptHashesMatched':2,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'scope':__doc__,'reviewer':'root_separate_computational_check_same_author','summary':summary,'entries':entries,'evidence':evidence},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
