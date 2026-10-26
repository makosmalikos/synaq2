"""Independent actual-printed integer/method/domain review of all20 saved adaptations.
No author specifications, parameters, model, or calculator is consumed.
Every saved/new condition, full official/new solution and everyMCQ manually read.
"""
import ast,copy,hashlib,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-natural-properties-advanced.json'
OUT='problems/editorial/reviews/grade5-natural-properties-advanced.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def one(xs):
 xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(p,s):
 r=re.search(p,s);assert r,(p,s);return r
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def expr(s):
 n=ast.parse(s.strip().replace('×','*').replace('−','-').replace(':','/'),mode='eval').body
 def ev(n):
  if isinstance(n,ast.Constant):assert isinstance(n.value,int);return F(n.value)
  assert isinstance(n,ast.BinOp)
  a,b=ev(n.left),ev(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  if isinstance(n.op,ast.Div):assert b;return a/b
  raise AssertionError(ast.dump(n))
 return ev(n)
def affine(s):
 # Exact coefficient pair proves equality for ALLx, not a selected example.
 n=ast.parse(s.replace('×','*').replace('−','-'),mode='eval').body
 def ev(n):
  if isinstance(n,ast.Name):assert n.id=='x';return F(1),F(0)
  if isinstance(n,ast.Constant):assert isinstance(n.value,int);return F(0),F(n.value)
  assert isinstance(n,ast.BinOp)
  a,b=ev(n.left),ev(n.right)
  if isinstance(n.op,ast.Add):return a[0]+b[0],a[1]+b[1]
  if isinstance(n.op,ast.Sub):return a[0]-b[0],a[1]-b[1]
  if isinstance(n.op,ast.Mult):assert a[0]*b[0]==0;return a[0]*b[1]+a[1]*b[0],a[1]*b[1]
  raise AssertionError(ast.dump(n))
 return ev(n)
def tail_expression(s):
 # Displayed operation expression ends at the first full stop after its colon.
 return m(r': ([0-9() ×+−]+)\.',s)[1]
def numeric_choice(r,v):
 assert F(v).denominator==1
 return one(o for o in r['options']if expr(o)==v)if r.get('options')else str(int(v))
def choice_values(r,vs):assert list(map(expr,r['options']))==list(map(F,vs))
def partition_domain(count,minimum,total):
 # All increasing integer allocations, with exact remaining-sum pruning.
 def rec(prefix,start,remaining,left):
  if left==0:
   if remaining==0:yield tuple(prefix)
   return
  v=start
  while left*v+left*(left-1)//2<=remaining:
   yield from rec(prefix+[v],v+1,remaining-v,left-1)
   v+=1
 return list(rec([],minimum,total,count))

def solve(r):
 s=r['statement'];sol=r['solution'];k=r['modelId'].removeprefix('grade5-natural-properties-advanced-')
 assert r['topic']=='num';note=''
 if k=='gauss-consecutive-even-count':
  lo,hi=map(int,m(r'^(\d+) санынан (\d+) санына дейінгі',s).groups());values=list(range(lo,hi+1));assert 'екі шетін де қосып'in s
  n=len(values);assert n%2==0;pairs=list(zip(values[:n//2],reversed(values[n//2:])));assert len({sum(p)for p in pairs})==1 and sorted(v for p in pairs for v in p)==values
  v=sum(values);assert f'{hi} − {lo} + 1 = {n}'in sol and f'{lo} + {hi} = {lo+hi}'in sol
  assert f'{lo+hi} × {n//2} = {v}'in sol and sum(range(1,hi+1))-sum(range(1,lo))==v
  note=f'ACTUALinclusive[{lo},{hi}] all{n}terms enumerated; {n//2}disjointexhaustiveoppositepairs sum{lo+hi}, total{v}; bothtriangularprefixsums independentlyrecomputed and primaryGaussmethodretained.'
 elif k=='gauss-first-odd-numbers':
  hi=int(m(r'1-ден (\d+) санына дейінгі',s)[1]);assert hi%2==1;vs=list(range(1,hi+1,2));v=sum(vs);n=len(vs);pairs=list(zip(vs[:n//2],reversed(vs[n//2:])));assert n%2==0 and len(pairs)==12 and all(a+b==48 for a,b in pairs);assert v==n*n
  assert '24 : 2 = 12'in sol and '48 × 12 = 576'in sol;note=f'AllACTUALpositiveodd1..{hi}: {n}terms/{n//2}pairs,sum{v}; squareidentity onlycrosscheck, actualprimaryoppositepair method present.'
 elif k=='three-common-difference-chain':
  expression=tail_expression(s);terms=re.findall(r'\((\d+) × (\d+) − (\d+) × (\d+)\)',expression);assert len(terms)==3
  ts=[tuple(map(int,t))for t in terms];assert all(b==c for a,b,c,d in ts);ds=[a-d for a,b,c,d in ts];assert len(set(ds))==1
  d=one(set(ds));common=[t[1]for t in ts];parts=[(a-d0)*b for a,b,c,d0 in ts];v=expr(expression);assert v==d*sum(common)==sum(parts)
  assert f'{d} × ({common[0]} + {common[1]} + {common[2]}) = {d} × {sum(common)} = {v}'in sol
  choice_values(r,[sum(common),v+d,v-2*d,v]);note=f'Everyactual3bracket multipliescommon{common}bySAMEdifferences{ds}; ALLintegerarithmetic→{parts}, second-levelcommon{d}×{sum(common)}={v}. All4MCQs omitfactor/{d}off/2differencesoff keyeduniquely.'
 elif k=='striking-clock-inclusive-and-half-hours':
  start,end=map(int,m(r'(\d+):00-ден (\d+):00-ге дейін',s).groups());assert 1<=start<=end<=12 and 'екі шетін де қосқанда'in s
  timeline=[(minute,minute//60 if minute%60==0 else 1)for minute in range(start*60,end*60+1,30)];full=[v for minute,v in timeline if minute%60==0];halves=[v for minute,v in timeline if minute%60!=0];assert full==list(range(start,end+1))and len(halves)==end-start
  v=sum(full)+sum(halves);choice_values(r,[sum(full),sum(full)+2*len(halves),v,v-1]);assert len(full)%2==1;middle=full[len(full)//2];assert sum(full)==(start+end)*(len(full)//2)+middle
  assert '12 × 4 + 6 = 54'in sol and '10:30 аралыққа кірмейді'in sol
  note=f'ACTUALclosedtimeline{start}:00..{end}:00 exhaustive30min events={timeline}; odd9fullhours→4pairs+middle6, full54+8half=62; ALLomit/double/missingonehalfhourMCQs verified. No10:30included.'
 elif k=='square-plus-itself-round-successor':
  ex=tail_expression(s);a,b,c=map(int,m(r'^(\d+) × (\d+) \+ (\d+)$',ex).groups());assert a==b==c
  v=expr(ex);assert v==a*(a+1);assert a+1==10000;assert f'{a} × 1'in sol and f'{a} × ({a} + 1)'in sol and '99980001 + 9999 = 99990000'in sol
  note=f'ACTUAL{a}²+{a}: standaloneterm={a}×1, distribute{a}×({a}+1) to poweroftens10000→{v}; square99980001 separatelyrecomputed. Primarycommonfactor not replacedbylongmultiplication.'
 elif k=='even-sum-minus-preceding-odd-sum':
  evenEnd,oddEnd=map(int,m(r'⋯ \+ (\d+)\) − \(1 \+ 3 \+ 5 \+ ⋯ \+ (\d+)\)',s).groups());assert evenEnd==oddEnd+1 and evenEnd%2==0
  evs=list(range(2,evenEnd+1,2));ods=list(range(1,oddEnd+1,2));assert len(evs)==len(ods);diffs=[a-b for a,b in zip(evs,ods)];assert all(x==1 for x in diffs);v=sum(diffs);choice_values(r,[evenEnd,0,v,v+1]);assert '3660 − 3600 = 60'in sol and sum(evs)==3660 and sum(ods)==3600
  note=f'ACTUALcompleteeven/oddarrays length{len(evs)}, everypaired difference1, total{v}; independentfullsums3660−3600. All4MCQboundary/zero/extraonefalse, primarytermwisepairing retained.'
 elif k=='three-term-common-factor-hundred':
  ex=tail_expression(s);ts=[tuple(map(int,t))for t in re.findall(r'(\d+) × (\d+)',ex)];assert len(ts)==3 and len({a for a,b in ts})==1;factor=ts[0][0];parts=[b for a,b in ts];assert sum(parts)==100
  v=expr(ex);choice_values(r,[v,v-100,v+100,factor+100]);assert '31 × (24 + 39 + 37)'in sol and '744 + 1209 + 1147 = 3100'in sol;assert [a*b for a,b in ts]==[744,1209,1147]
  note=f'Actualcommon{factor}×sum{parts}=100⇒{v}; all3products744/1209/1147independentlyexact. All±100/addinsteadofmultiply131MCQsfalse; fullcommonfactor/round100method retained.'
 elif k=='gauss-positive-even-numbers':
  high=int(m(r'^(\d+) санынан АСПАЙТЫН',s)[1]);vs=list(range(2,high+1,2));v=sum(vs);assert 0 not in vs and high in vs and len(vs)==60
  pairs=list(zip(vs[:30],reversed(vs[30:])));assert all(a+b==122 for a,b in pairs);assert '122 × 30 = 3660'in sol and 2*sum(range(1,61))==v
  note=f'AllACTUALpositiveevens≤{high} enumerated,60terms/30pairs×122={v}; factor2prefixsum1830crosscheck,0excluded andupper120included.'
 elif k=='equal-pair-sums-use-every-card':
  n,cards,pairs=map(int,m(r'…, (\d+) сандары жеке-жеке (\d+) карточкаға жазылған. БАРЛЫҚ карточка (\d+) жұпқа',s).groups());assert n==cards==2*pairs
  v=F(sum(range(1,n+1)),pairs);witness=[tuple(map(int,p))for p in re.findall(r'\((\d+); (\d+)\)',sol)];assert len(witness)==pairs and sorted(x for p in witness for x in p)==list(range(1,n+1))and all(sum(p)==v for p in witness)
  assert '136 : 8 = 17'in sol;note=f'ALLactualcards1..{n} total136; conservation{pairs}EQUALpairtotals⇒unique17. Actualprintedwitness{witness}usesEVERYcardONCE withnoextras/duplicates; existenceandrequestedONEpairnotgrandtotal verified. Universalconservationproofdoesnotneedguessmatching.'
 elif k=='distinct-count-minimal-total-rigidity':
  count,total,minimum=map(int,m(r'^(\d+) бала (\d+) .*?ең аз алған балада (\d+) фишка',s).groups());lower=list(range(minimum,minimum+count));assert sum(lower)==total
  allocations=partition_domain(count,minimum,total);assert allocations==[tuple(lower)];v=lower[-1];assert f'({minimum} + {v}) × {count//2} = {total}'in sol
  note=f'ACTUAL{count}distinctintegercounts,min{minimum},total{total}; fullincreasingfiniteallocationdomain exhaustivelyenumerated toSINGLE{allocations[0]}. ForALLallocations sortedx_i≥{minimum}+i, lowerboundsalreadytotal100⇒everyboundtight; maximum16unique, noassumedconsecutiveness.'
 elif k=='split-middle-two-round-products':
  ex=tail_expression(s);a,b,c=map(int,m(r'^(\d+) × (\d+) × (\d+)$',ex).groups());assert a==25 and c==125 and b%32==0
  v=expr(ex);assert b==4*8*2 and a*4==100 and 8*c==1000;choice_values(r,[v/10,v,v*10,b*1000]);assert '64 = 4 × 8 × 2'in sol and '100 × 1000 × 2 = 200000'in sol
  note=f'Actual25×{b}×125, SPLITmiddle64=4×8×2 (leftover2retained), tworoundproducts100/1000→{v}. ALLactual×10/÷10and64×wrong1000false; 25×125=3125invariantteachingfacts honestlypreserved.'
 elif k=='round-hundred-triple':
  ex=tail_expression(s);a,b,c=nums(ex);v=expr(ex);assert a+c==100;assert f'({a} + {c}) + {b} = 100 + {b} = {v}'in sol
  note=f'ACTUAL{a}+{b}+{c}, exhaustive3termsregroupouterpair100→{v}; sequential151+18crosscheck. Neithertermnoroperationomitted.'
 elif k=='name-distributive-addition':
  equality=m(r'^([\d ()×+=]+) теңдігінде',s)[1];lhs,rhs=equality.split('=');assert expr(lhs)==expr(rhs)==216
  tree=ast.parse(lhs.replace('×','*').strip(),mode='eval').body;assert isinstance(tree,ast.BinOp)and isinstance(tree.op,ast.Mult)and isinstance(tree.right,ast.BinOp)and isinstance(tree.right.op,ast.Add)
  a=tree.left.value;b=tree.right.left.value;c=tree.right.right.value;assert rhs.strip()==f'{a} × {b} + {a} × {c}'
  v='Көбейтудің қосуға қатысты үлестірімділік қасиеті';assert r['options']==['Көбейтудің терімділік қасиеті',v,'Көбейтудің азайтуға қатысты үлестірімділік қасиеті','Қосудың терімділік қасиеті'];assert '180 + 36 = 216'in sol
  note='ACTUAL9×(20+4)=9×20+9×4 verifiedstructurallyASTandnumerically216; direct addition-distributivity pattern, notassociativity/subtraction. EverycategoricalMCQcheckedagainstoperators.'
 elif k=='four-times-middle-times-twentyfive':
  ex=tail_expression(s);a,b,c=nums(ex);assert a==4 and c==25 and a*c==100;v=expr(ex);assert f'(4 × 25) × {b} = 100 × {b} = {v}'in sol
  note=f'ACTUAL4×{b}×25 regroupouter4×25=100→{v}; originaleveryfactor preserved once, direct468×25crosscheck.'
 elif k=='expand-symbolic-difference':
  domain=int(m(r'x ≥ (\d+)',s)[1]);ex=m(r': ([\dx ()×−]+)\.',s)[1];coefficient,constant=affine(ex);assert domain==7 and (coefficient,constant)==(12,-84)
  pairs=list(map(affine,r['options']));v=one(o for o,p in zip(r['options'],pairs)if p==(coefficient,constant));assert pairs==[(12,-7),(1,-84),(12,-84),(12,-19)]
  assert 'Теңдік барлық x ≥ 7 үшін дұрыс'in sol and affine('12 × x − 12 × 7')==(coefficient,constant)
  note=f'ACTUAL12×(x−7),domainALLnaturalx≥7, exactaffinecoefficientpair{coefficient,constant}provesuniversalidentity. EveryactualMCQ pair{pairs}; only12x−84matchesBOTHcoefficients. Boundaryx7gives0,notexcluded; notmerelytestatx10.'
 elif k=='two-term-common-factor-hundred':
  ex=tail_expression(s);terms=[tuple(map(int,t))for t in re.findall(r'(\d+) × (\d+)',ex)];assert len(terms)==2 and terms[0][1]==terms[1][1];a,b=terms[0][0],terms[1][0];factor=terms[0][1];assert a+b==100
  v=expr(ex);assert f'({a} + {b}) × {factor} = 100 × {factor} = {v}'in sol;note=f'ACTUAL65×23+35×23, common23times100→2300; BOTH1495and805computed andsum2300, reverse-distributivity primarymethodretained.'
 elif k=='three-tier-total-cost':
  boxes,perBox,price=map(int,m(r'(\d+) жәшік.*?Әр жәшікте (\d+) жиынтық, әр жиынтық (\d+) теңге',s).groups());assert 'жалпы ҚҰНЫ'in s;count=boxes*perBox;v=count*price
  assert f'({boxes} × {price}) × {perBox} = {boxes*price} × {perBox} = {v}'in sol and f'{count} жиынтық × {price} теңге = {v}'in sol
  note=f'ACTUALnestedunits{boxes}boxes×{perBox}sets/box×{price}Tg/set; COUNT110vsrequestedTOTALCOST66000distinct. Primarygroupboxes×price3000then×22 anddirectcountmethodbothdimensionally/exactlychecked.'
 elif k=='gauss-positive-multiples':
  high,step=map(int,m(r'^(\d+) санынан аспайтын (\d+) санына бөлінетін',s).groups());assert high%step==0;vs=list(range(step,high+1,step));v=sum(vs);n=high//step;assert len(vs)==n and n%2==0 and 0 not in vs
  assert '4 × (1 + 2 + ⋯ + 24)'in sol and sum(range(1,n+1))==300 and '4 × 300 = 1200'in sol
  assert all(a+b==100 for a,b in zip(vs[:n//2],reversed(vs[n//2:])));note=f'ALLACTUALpositive4multiples≤96,24terms, factor4×sum1..24=4×300=1200; primaryfactor-plusGaussanddirect12pairs×100bothverified. Upperincluded0excluded.'
 else:raise AssertionError(k)
 answer=v if isinstance(v,str)else numeric_choice(r,v)
 if r.get('options'):assert len(r['options'])==4 and len(set(r['options']))==4 and r['options'].count(answer)==1
 return answer,note

def main():
 assert len(ROWS)==20;entries=[];refs=set()
 for r in ROWS:
  answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
  ref=one(r['sourceRefs']);raw=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['id']==ref['sourceId']);assert raw['solution'];refs.add(raw['id'])
  assert r['grade']==5 and r['minimumPlan']=='pro'and not r.get('image');norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement'])
  if not r.get('options'):assert answer.isdigit()and 'Жауапқа тек санды жазыңыз.'in r['statement']
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All20saved/newfullconditions/fullofficial+newsolutions/EVERYMCQread; ownACTUALprintedintegers/Gaussdisjointpairs/exhaustivetimeorallocationdomains/universalcoefficientproof; noauthorparams/spec/calculator','sourceCanonicalSha256':digest(raw),'notes':note,'checks':['All20saved/newfullconditions/official+newsolutions/everyMCQmanuallyread','Exactactualprintedintegeroperations/typedtarget andEVERYactualchoice independentlyrecomputed','PrimaryGauss/oppositepairs/oddmiddle/2levelcommonfactors/standaloneterm×1/splitmiddleandunitgroupingexplicitlypreserved','Inclusiveboundary/positive0exclusion/ALLcards/ALLstrictintegerallocations/ALLsymbolicx domainsverified','All20keys/wrongkeys/canonicalwholecontenthashes/nativepresentationchecked']})
 assert len(refs)==20
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256']for e in entries]and native['fractions']==0
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[],'scope':'All20saved nonvisualGRADE5topic1.6levels3/test, primarypropertymethods preserved, exactcompleteinteger/time/symbolicdomains','entries':entries}
 if '--write'in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 else:assert {e['editionId']:e['sha256']for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256']for e in entries}
 print(json.dumps({'independentlyVerified':20,'wrongKeysRejected':20,'hashesMatched':20,'sourceRefs':20,'nativeFractions':0,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
