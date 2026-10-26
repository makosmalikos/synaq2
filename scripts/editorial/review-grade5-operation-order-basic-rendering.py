"""Independent actual printed priority/AST/value/unit/choice review, all27 rows.
Every saved/new condition, full official/new solution and everyMCQ manually read.
No author specifications, params or evaluator are imported or consumed.
"""
import ast,copy,hashlib,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-operation-order-basic.json'
OUT='problems/editorial/reviews/grade5-operation-order-basic.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
NAMES={'+':'қосу','−':'азайту','×':'көбейту',':':'бөлу'}
def one(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(p,s):
 r=re.search(p,s);assert r,(p,s);return r
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def calc(a,op,b):
 if op=='+':return a+b
 if op=='−':return a-b
 if op=='×':return a*b
 assert op==':'and b!=0;return a/b
def ast_value(ex):
 tree=ast.parse(ex.strip().replace('×','*').replace('−','-').replace(':','/'),mode='eval').body
 def ev(n):
  if isinstance(n,ast.Constant):assert isinstance(n.value,int);return F(n.value)
  assert isinstance(n,ast.BinOp)
  return calc(ev(n.left),{ast.Add:'+',ast.Sub:'−',ast.Mult:'×',ast.Div:':'}[type(n.op)],ev(n.right))
 return ev(tree)
def priority_trace(ex):
 # This is NOT ASTpostorder. At current deepest parenthesis level, finish
 # ALL×/: left-to-right, THEN all+/− left-to-right across ASTsiblings.
 # Separate equallydeep parenthesisgroups finish left-to-right.
 tokens=re.findall(r'\d+|[()+−×:]',ex);assert ''.join(tokens)==re.sub(r'\s+','',ex),ex
 ts=[F(t)if t.isdigit()else t for t in tokens];out=[]
 while len(ts)>1:
  changed=True
  while changed:
   changed=False
   for i in range(len(ts)-2):
    if ts[i]=='('and isinstance(ts[i+1],F)and ts[i+2]==')':ts[i:i+3]=[ts[i+1]];changed=True;break
  if len(ts)==1:break
  depth=0;ops=[];stack=[]
  for i,t in enumerate(ts):
   if t=='(':depth+=1;stack.append(i)
   elif t==')':depth-=1;assert depth>=0;stack.pop()
   elif isinstance(t,str):assert t in NAMES;ops.append((depth,2 if t in'×:'else 1,i,stack[-1]if stack else -1))
  assert depth==0 and ops
  deepest=max(d for d,p,i,g in ops);group=min(g for d,p,i,g in ops if d==deepest);priority=max(p for d,p,i,g in ops if d==deepest and g==group);index=min(i for d,p,i,g in ops if d==deepest and g==group and p==priority)
  a,op,b=ts[index-1:index+2];assert isinstance(a,F)and isinstance(b,F),(ex,ts,index)
  result=calc(a,op,b);out.append((a,op,b,result,NAMES[op]));ts[index-1:index+2]=[result]
 assert isinstance(ts[0],F);assert ts[0]==ast_value(ex),(ex,ts[0],ast_value(ex))
 return ts[0],out
def first_expression(s):
 candidates=re.findall(r'\(?\d[\d ()+−×:]*',s)
 return one(c.strip()for c in candidates if any(op in c for op in NAMES))
def displayed_groups(sol):
 matches=list(re.finditer(r'(\d+)\)\s+(-?\d+)\s*([+−×:])\s*(-?\d+)\s*=\s*(-?\d+)\s*—\s*(қосу|азайту|көбейту|бөлу)\.',sol));groups=[]
 for a in matches:
  index,left,op,right,value,name=a.groups();index=int(index);item=(F(left),op,F(right),F(value),name)
  assert calc(item[0],op,item[2])==item[3]and NAMES[op]==name
  if index==1:groups.append([])
  assert groups and index==len(groups[-1])+1;groups[-1].append(item)
 return groups
def check_trace(r,expressions):
 expected=[priority_trace(ex)[1]for ex in expressions];actual=displayed_groups(r['solution']);assert actual==expected,(r['editionId'],actual,expected)
 return [ast_value(ex)for ex in expressions]
def numeric(r,v):
 assert v.denominator==1
 return one(o for o in r['options']if ast_value(o)==v)if r.get('options')else str(v.numerator)
def opts(r,vs):assert list(map(ast_value,r['options']))==list(map(F,vs))

def solve(r):
 s=r['statement'];sol=r['solution'];k=r['modelId'].removeprefix('grade5-operation-order-basic-');assert r['topic']=='num';note=''
 ordinary={'quotient-before-subtract','parenthesized-sum-product','near-round-minus-quotient','divide-by-parenthesized-product','unparenthesized-sum-product','division-multiplication-left-to-right','subtraction-addition-left-to-right','bracket-then-equal-priority','seven-stage-nested-expression','six-stage-nested-expression','round-pair-and-independent-quotient'}
 if k in ordinary:
  ex=first_expression(s);v=one(check_trace(r,[ex]));answer=numeric(r,v);trace=priority_trace(ex)[1]
  if k=='division-multiplication-left-to-right':assert [t[1]for t in trace]==[':','×'];assert ast_value('120 : (5 × 3)')==8!=v
  elif k=='subtraction-addition-left-to-right':assert [t[1]for t in trace]==['−','+'];assert ast_value('730 − (240 + 68)')==422!=v
  elif k=='bracket-then-equal-priority':assert [t[1]for t in trace]==['+',':','×'];assert ast_value('4320 : ((42 + 30) × 4)')==15!=v
  elif k=='seven-stage-nested-expression':assert [t[1]for t in trace]==[':','−','×','−','+',':','+']and [t[3]for t in trace]==[12,32,288,232,260,65,103]
  elif k=='six-stage-nested-expression':assert trace[0][:4]==(2140,'−',1684,456)and trace[1][:4]==(32,'×',18,576);assert [t[3]for t in trace]==[456,576,2736,3312,138,78]
  elif k=='round-pair-and-independent-quotient':assert '125 × 8 = 1000'in sol and [t[1]for t in trace]==['×',':','−'];assert v==974
  note=f'ACTUALprintedexpression{ex!r}, independentlytoken-reducedpriority trace{[(str(a),op,str(b),str(v),name)for a,op,b,v,name in trace]}; secondaryFractionASTagreesvalue{v}. FullnumberedPRIMARYmethod matchesdeepestbracket/ALL×÷before+/−/equalpriorityleft-right, notASTpostorder.'
 elif k=='choose-first-subtraction':
  values=check_trace(r,r['options']);first=[priority_trace(o)[1][0][4]for o in r['options']];assert first==['көбейту','қосу','бөлу','азайту'];answer=one(o for o,f in zip(r['options'],first)if f=='азайту');assert values==[24,85,19,216]
  note='ALL4actualexpressionMCQs evaluated withfullmethodtraces. FIRSToperationsmultiply/add/divide/subtract uniquelyselect(72−18)×4; requestedEXPRESSIONwhosefirstSUBTRACT notsmallest/greatestvalue.'
 elif k=='complete-operation-order':
  ex=first_expression(s);v=one(check_trace(r,[ex]));trace=priority_trace(ex)[1];answer=', '.join(t[4]for t in trace);assert answer=='көбейту, бөлу, азайту, қосу'and v==78
  assert r['options']==['азайту, көбейту, қосу, бөлу','көбейту, азайту, бөлу, қосу','бөлу, көбейту, қосу, азайту',answer]
  note='Actual168−24×4+54÷9 GLOBALmethodmustcompute24×4THEN54÷9BEFORE168−96, then+6. Fullprintedtrace96/6/72/78 matches; ALL4orderMCQs checked, notvalue78asanswer. OrdinaryASTpostordermul/sub/div/add wouldbeWRONGteachingtrace.'
 elif k in {'name-first-multiplication','name-last-addition'}:
  ex=first_expression(s);check_trace(r,[ex]);trace=priority_trace(ex)[1];answer=trace[0 if k.startswith('name-first')else -1][4]
  assert answer==('көбейту'if k.startswith('name-first')else'қосу')
  assert r['options']==(['азайту','көбейту','екі амал бір мезгілде орындалады','қай амалдан бастау маңызды емес']if k.startswith('name-first')else['азайту','бөлу','қосу','барлық амал бір мезгілде орындалады'])
  note=f'ACTUAL{ex} orderedtraces{[t[4]for t in trace]}, requestedFIRST/LASTcategoricalname{answer}; allsimultaneous/arbitrary/orderconfusionsMCQfalse, numericvalueisnotasked.'
 elif k=='first-stage-definition':
  answer='қосу және азайту';assert r['options']==['көбейту және бөлу','қосу және көбейту',answer,'азайту және бөлу'];assert 'Басқыш нөмірі амалдың есептеуде нешінші орындалатынын білдірмейді'in sol
  assert priority_trace('(42 + 7) × 6')[1][0][4]=='қосу'and priority_trace('42 + 7 × 6')[1][0][4]=='көбейту'
  note='ActualcategoricalFIRSTSTAGEmeans+/−group, notfirstEXECUTEDoperation. Everycrossstage/multiplydivideoptionfalse; explicitparenthesisprioritycounterexamplechecked, immutabledefinitionhonestlyretained.'
 elif k=='greatest-expression':
  values=check_trace(r,r['options']);assert values==[78,46,88,38];greatest=max(values);answer=one(o for o,v in zip(r['options'],values)if v==greatest);assert answer=='8 × (5 + 6)'
  note='ALL4printedMCQs fullnumberedmethodandASTvalue78/46/88/38 recomputed; uniquemax88, askedCORRESPONDINGEXPRESSIONnotliteral88. Parenthesesaffectbothadditionandmultiplication.'
 elif k=='repair-student-addition-first':
  ex=m(r'Оқушы ([\d +−]+) өрнегінде',s)[1];assert ex=='70 − 18 + 9';v=one(check_trace(r,[ex]));opts(r,[43,v,97,79]);assert v==61 and ast_value('70 − (18 + 9)')==43;assert 'әдейі берілген қате тәсіл'in sol;answer=numeric(r,v)
  note='Actualwrongstudent18+9=27and70−27=43 arearithmeticallyTRUEbutchangegrouping; correctleftsub52thenadd9=61. Wrong43intentionallyexplained, notflaggedasbadnumericexample; every43/61/97/79MCQchecked.'
 elif k=='bracket-quotient-subtraction-mcq':
  ex=first_expression(s);a,b,c,d=map(int,re.findall(r'\d+',ex));variants=[ex,f'({a} − ({b} + {c})) : {d}',f'{a} − {b} + {c} : {d}',f'({a} − {b} + {c}) : {d}'];values=check_trace(r,variants);assert values==[1100,100,810,160];opts(r,[100,810,1100,160]);answer=numeric(r,values[0])
  note='Actual1200−(420+180)÷6: bracket600,divide100,subtract1100. ALL3actualwrongparenthesizations independentlytraced100/810/160andMCQroleschecked, correctsolutionnotaccidentallyusingleft-to-rightalloperations.'
 elif k=='verbal-product-plus-quotient':
  a,b,c,d=map(int,m(r'^(\d+) мен (\d+) сандарының көбейтіндісіне (\d+) пен (\d+) сандарының бөліндісін қосыңыз',s).groups());ex=f'{a} × {b} + {c} : {d}';v=one(check_trace(r,[ex]));assert a*b==4032 and F(c,d)==35 and v==4067;assert '35 × 348 = 12180'in sol
  answer=numeric(r,v);note='ActualverbalrolesPRODUCT112×36andQUOTIENT12180÷348, joinedADD→4067. All3primarytrace4032/35/4067andreverse35×348=12180checked; textconstructionnotmerelyexecutinganalreadygivenexpression.'
 elif k=='class-ticket-total-cost':
  g5,g6,p5,p6,price=map(int,m(r'бесінші сыныптардың (\d+) тобы және алтыншы сыныптардың (\d+) тобы.*?тобында (\d+) оқушы, әр алтыншы сынып тобында (\d+) оқушы.*?билеті (\d+) теңге',s).groups());ex=f'({g5} × {p5} + {g6} × {p6}) × {price}';v=one(check_trace(r,[ex]));count=g5*p5+g6*p6;assert count==222 and v==199800 and 'Тек оқушылар'in s;answer=numeric(r,v)
  note=f'ActualtwoGRADEcohorts5×26=130and4×23=92, total222STUDENTSthen×900Tg/STUDENT→199800Tg. BothmultiplicationsbeforeinnerADD, finalCOSTnotCOUNTandnoextraadulttickets; all4numberedprimarymethodstepschecked.'
 elif k=='compare-subtraction-brackets':
  A,B=m(r'^A = (.*?), B = (.*?)\.',s).groups();values=check_trace(r,[A,B]);assert values==[400,660];answer='A '+('>'if values[0]>values[1]else'<'if values[0]<values[1]else'=')+' B';assert r['options']==['A > B','A = B','A < B','берілгендер салыстыруға жеткіліксіз'];assert values[1]-values[0]==260
  note='ACTUALA800−270−130=400vsB800−(270−130)=660; exacttypedownerrelationA<Bnotabsdifference. Bothactualfullprimarytraceschecked; algebraB−A=2×130=260, all4categoricaloptionsfalseexceptA<B.'
 elif k=='choose-remaining-mass-expression':
  per,count,sold=map(int,m(r'әрқайсысы (\d+) кг болатын (\d+) қап.*?Оның (\d+) килограмы сатылды',s).groups());total=count*per;left=total-sold;assert 0<sold<total and 'Қалған күріш массасын'in s;intended=f'{count} × {per} − {sold}';assert intended in r['options'];assert list(map(ast_value,r['options']))==[110,6,432,146]
  answer=intended;assert f'{count} × {per} = {total} кг'in sol and f'{total} − {sold} = {left} кг'in sol
  node=ast.parse(intended.replace('×','*').replace('−','-'),mode='eval').body;assert isinstance(node.op,ast.Sub)and isinstance(node.left.op,ast.Mult)
  note='ACTUAL8sacks×16kg/sack=128kg, SOLD18kgmustSUBTRACT→remaining110kg; requestedEXPRESSION8×16−18. All4actualMCQtypedmeaningandvalues110/6/432/146 checked; count+kgandaddsoldfalse. Noillegaladdingdifferentunitsinnewcorrectexpression.'
 elif k=='choose-difference-with-quotient':
  a,b,c=map(int,m(r'Азайғышы (\d+) болатын, ал азайтқышы (\d+) пен (\d+) сандарының бөліндісіне',s).groups());intended=f'{a} − {b} : {c}';v=one(check_trace(r,[intended]));assert v==680;assert list(map(ast_value,r['options']))==[20,680,-680,-420]
  answer=intended;tree=ast.parse(intended.replace('−','-').replace(':','/'),mode='eval').body;assert isinstance(tree.op,ast.Sub)and tree.left.value==a and isinstance(tree.right.op,ast.Div)and tree.right.left.value==b and tree.right.right.value==c
  note='ACTUALminuend720minusQUOTIENT480÷12, exactAST720−(480÷12)→680; requestedEXPRESSIONnotvalue. Every20/(−680)/(−420)otheroption computedandwrongstructure(minusallthen÷/reversedowners/wrongdividend)checked.'
 elif k=='both-precedence-traps':
  ex=first_expression(s);a,b,c,d=map(int,re.findall(r'\d+',ex));variants=[ex,f'({a} − {b}) : {c} × {d}',f'{a} − {b} : ({c} × {d})',f'({a} − {b}) : ({c} × {d})'];values=check_trace(r,variants);assert values==[126,54,142,6];opts(r,values);answer=numeric(r,values[0])
  note='All4actualpaths144−36÷6×3 and3diagnosticregroupings independentlyprioritytraced; correct÷then×then−→126, earlysubtract54, multiply-beforedivide142, BOTHerrors6. Everyprintedwrongtracehasequalmathbutwrongexpression, intentionallylabeled.'
 elif k=='division-multiplication-undo':
  ex=first_expression(s);a,b,c,d=map(int,re.findall(r'\d+',ex));assert a==b and c==d and c>0;v=one(check_trace(r,[ex]));assert v==0;opts(r,[a-F(b,c*d),a-F(b,c),F(b,c),0]);answer=numeric(r,v)
  assert ast_value(f'{a} − {b} : ({c} × {d})')==192 and a-F(b,c)==168 and F(b,c)==28
  note='ACTUAL196−196÷7×7, primary÷28then×7returns196then−gives0. Universalnonzero7inversepairretainsbothoperations; ALLactual192earlymultiply/168omitmultiply/28firstresultMCQ rolescheckedandintentionalwrongexpressiononlyinexplanation.'
 elif k=='choose-parenthesis-placement':
  target=int(m(r'өрнектің мәнін (\d+) санына тең',s)[1]);values=check_trace(r,r['options']);assert values==[60,60,4,40];answer=one(o for o,v in zip(r['options'],values)if v==target)
  note='ACTUALtarget40, ALL4parenthesisplacements fullprioritytrace+FractionASTvalues60/60/4/40; unique(120÷10−2)×4. DuplicateWRONGnumericvalues60arenotduplicatewrittenMCQs; alloptionsstructurallydistinct.'
 else:raise AssertionError(k)
 if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
 return answer,note

def main():
 assert len(ROWS)==27;entries=[];refs=set()
 for r in ROWS:
  answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
  ref=one(r['sourceRefs']);raw=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);refs.add(raw['id']);assert raw['solution']
  assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image');norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
  if not r.get('options'):assert 'options'not in r and answer.isdigit()and 'Жауапқа тек санды жазыңыз.'in r['statement']
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All27saved/newfullconditions/fullofficial+newsolutions/EVERYMCQread; ownACTUALprintedtokenpriorityreductionandsecondaryFractionAST/fullnumberedmethodtrace/typedunitsandtarget; noauthorparams/spec/evaluator','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All27saved/newfullconditions/official+newsolutions/everyMCQmanuallyread','Actualdeepestparentheses FIRST, thenALL×/:left-rightBEFORE+/−left-right atsamelevel, independentofASTpostorder','EVERYprintednumberedPRIMARYmethodstep operands/operator/result/name/order checkedincludingintentionalwrongalternativeexpressions','RequestedORDER/FIRST/LAST/EXPRESSION/MAXEXPRESSION/RELATION/REMAININGMASS/TOTALCOST distinguishedfromVALUE','All27keys/wrongkeys/4prioritymethodcanaries/canonicalwholecontenthashes/nativepresentationverified']})
 assert len(refs)==27
 # Four method mutants keep the final numeric answer unchanged; every one
 # must still fail because this lesson assesses ORDER, not just arithmetic.
 for index,mutate in [(4,lambda s:s.replace('1) 24 × 4 = 96 — көбейту.\n2) 54 : 9 = 6 — бөлу.','1) 54 : 9 = 6 — бөлу.\n2) 24 × 4 = 96 — көбейту.')),(21,lambda s:s.replace('1) 2140 − 1684 = 456 — азайту.\n2) 32 × 18 = 576 — көбейту.','1) 32 × 18 = 576 — көбейту.\n2) 2140 − 1684 = 456 — азайту.')),(13,lambda s:s.replace('3) 9 + 5 = 14 — қосу.','')),(0,lambda s:s.replace('72 : 8 = 9','72 : 8 = 10'))]:
  bad=copy.deepcopy(ROWS[index]);old=bad['solution'];bad['solution']=mutate(old);assert old!=bad['solution']
  try:solve(bad)
  except AssertionError:pass
  else:raise AssertionError('Primarymethodcanaryaccepted')
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]and native['fractions']==0
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'type':'publication_contract','resolution':'Removed options:[] ONLYfrom13open rows. Allotherfieldsincludingactualmath/words/solutions/metadataand14MCQ rows unchanged. Independentold27reviewSHA matchedcanonicalbeforepayload; reconstructednewplusoptions:[] matchsoldSHA exactly.','evidence':'output/editorial-operation-order-basic-options-external-diff.json','changedIndices':[0,1,2,5,7,10,12,15,16,17,20,21,22]}],'scope':'All27saved nonvisualGRADE5topic1.7levels1/2 (14+13), actualprioritymethodsandalltargets/contexts/MCQs','entries':entries}
 if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 else:assert {e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
 print(json.dumps({'independentlyVerified':27,'wrongKeysRejected':27,'priorityMethodCanariesRejected':4,'hashesMatched':27,'sourceRefs':27,'nativeFractions':0,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
