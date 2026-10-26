"""Independent11 saved/new full systemdefinition/orderedpair/domain review."""
from pathlib import Path
from fractions import Fraction as F
import argparse,copy,hashlib,importlib.util,json,re,subprocess,unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade6-system-basics.json'
OUT='problems/editorial/reviews/grade6-system-basics.json'
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
# Reuse only MY independently authored parsers, never a producer/model calculator.
SYS=load('own_system_oracle','scripts/editorial/review-collection-systems-wave14.py')
EXPR=load('own_expression_oracle','scripts/editorial/review-collection-expressions-wave15.py')
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def num(s):return F(s.replace('−','-').replace(',','.'))
def numbers(s):return list(map(int,re.findall(r'(?<!\w)-?\d+',s)))
def pair(s):
 m=re.search(r'\((-?\d+); (-?\d+)\)',s);assert m,s
 return tuple(map(F,m.groups()))
def equations(s):
 out=[e.strip().rstrip('.')for e in s.split(';')];assert len(out)==2 and all('='in e for e in out),s
 return out
def holds(eq,x,y):
 lhs,rhs=eq.split('=');return EXPR.calc(lhs,{'x':x,'y':y})==EXPR.calc(rhs,{'x':x,'y':y})
def mask(eqs,x,y):return[holds(eq,x,y)for eq in eqs]
def numeric_answer(r,value):
 if r.get('options'):return one([o for o in r['options']if num(o)==value])
 assert F(value).denominator==1;return str(int(value))
ID=['d738271f7752a18e','6542067a4c638578','db840f620c94dd12','f9eabe6caeaafab2','365d3648c7eac480','24010abfd3c435bd','7e58d2d3deaa9ae9','cbda651b9001b481','46d33ea22fe60c69','8ab36446ac48624a','0ebaabb859d9c302']
def solve(r):
 ref=one(r['sourceRefs']);n=ID.index(ref['sourceId']);s=r['statement'];note=''
 if n==0:
  m=re.search(r'x \+ y = (\d+).*?x − y = (\d+)',s);total,diff=map(int,m.groups());assert'ОҢ натурал'in s and'0 алынбайды'in s
  candidates=[(x,y)for x in range(1,total)for y in range(1,total)if x+y==total];assert len(candidates)==total-1
  x,y=one([(x,y)for x,y in candidates if x-y==diff]);assert(x,y)==(6,3);answer=numeric_answer(r,x*y)
  printed=[tuple(map(int,m.groups()))for m in re.finditer(r'\((\d+); (\d+)\)',r['solution'])];assert printed[:len(candidates)]==candidates
  note=f'ALLpositiveintegerpairs enumerated, domain1..{total-1} completebecausex+y{total}, excludes0; unique({x};{y})diff{diff}, targetPRODUCT{x*y}notpair.'
 elif n==1:
  eqs=equations(re.search(r'екі теңдеуі: (.*?)\. Оның',s)[1]);x=num(re.search(r'x = (-?\d+)',s)[1]);a,b,c=SYS.equation(eqs[0]);assert b!=0;y=(c-a*x)/b;assert all(mask(eqs,x,y));assert SYS.solve_equations(eqs)[:2]==(x,y);answer=numeric_answer(r,y)
  note=f'Actualgivenx{x}, firstequationyieldsy{y}, BOTHoriginalprinted{eqs}checked; uniquepairbydeterminant, targetSECONDcoordinate.'
 elif n==2:
  x,y=pair(s);eqs=equations(re.search(r'жұбы (.*?) жүйесінің',s)[1]);truths=mask(eqs,x,y);assert truths==[True,True];answer=one([o for o in r['options']if o.startswith('Иә,')and'екі теңдеуді де'in o])
  note=f'GivenORDEREDpair({x};{y})backsubbothprinted{eqs}, truthmask{truths}; falseonlyfirst/onlysecond/neitherchoicesexcluded.'
 elif n==3:
  x,y=pair(s);m=re.search(r'жұбы (.*?) = a; (.*?) = b жүйесінің',s);first,second=m.groups();a,b=EXPR.calc(first,{'x':x,'y':y}),EXPR.calc(second,{'x':x,'y':y});assert(a,b)==(16,15);answer=numeric_answer(r,a+b)
  note=f'Actualordered{x},{y}; RHSconstantsa={first}→{a},b={second}→{b}; targeta+b{a+b}, notx+y/coordinate/singleRHS.'
 elif n==4:
  first,second,total,gap=numbers(s);assert'ҚЫМБАТ'in s and'x — дәптер, y — маркер'in s
  expected=[(F(first),F(second),F(total)),(F(-1),F(1),F(gap))]
  transformed=[[SYS.equation(eq)for eq in equations(o)]for o in r['options']];answer=one([o for o,eqs in zip(r['options'],transformed)if eqs==expected])
  eqs=equations(answer);x,y,det=SYS.solve_equations(eqs);assert(x,y)==(160,340)and x.denominator==y.denominator==1 and x>0 and y>0
  assert y-x==gap and first*x+second*y==total
  assert all(not all(mask(equations(o),x,y))for o in r['options']if o!=answer)
  assert f'x = {x}, y = {y}'in r['solution'];note=f'Independentwordroles matrix{expected}, countsNOTswapped/differenceMARKERminusnotebook, actualpositiveintegerprices{x},{y}; exactbothcostequations. Wrongoptionsfailattheseprices; uniquecontextsystem.'
 elif n==5:
  eqs=equations(re.search(r'Бір мезгілде (.*?) орындалуы',s)[1]);a,b=map(SYS.equation,eqs);assert a[:2]==b[:2]and a[2]!=b[2]
  answer=one([o for o in r['options']if o=='Шешімі жоқ']);assert'0 = 3 деген жалған теңдік'in r['solution']
  note=f'Formalrankcontradiction sameleftcoefficients{a[:2]}butRHS{a[2]}vs{b[2]}, subtractgives0={b[2]-a[2]}FALSE; NOREALpairglobally, notboundedsearch.'
 elif n==6:
  x,y=pair(s);truths=[mask(equations(o),x,y)for o in r['options']];assert truths==[[True,False],[True,False],[True,False],[True,True]],truths
  answer=one([o for o,t in zip(r['options'],truths)if all(t)]);note=f'ActualSIGNEDorderedpair{x},{y}, EVERYequationinEVERYoptionchecked; masks{truths}, allfirstequationsTRUEsosecondisessential.'
 elif n==7:
  x,y=pair(s);parts=re.split('[①②③④]',s)[1:];assert len(parts)==4;eqs=[equations(t.strip().split('. ')[0])for t in parts];truths=[mask(es,x,y)for es in eqs];assert truths==[[True,True],[False,True],[True,True],[True,False]],truths
  answer=numeric_answer(r,sum(all(t)for t in truths));note=f'ALLFOURprintedSYSTEMSwithorderedpair{x},{y}, masks{truths}; BOTHconditionsrequired, total2not4equations/anyonecondition.'
 elif n==8:
  eqs=equations(re.search(r'Қай жұп (.*?) жүйесінің',s)[1]);truths=[mask(eqs,*pair(o))for o in r['options']];assert truths==[[False,False],[True,True],[True,False],[True,False]],truths
  answer=one([o for o,t in zip(r['options'],truths)if all(t)]);assert SYS.solve_equations(eqs)[:2]==pair(answer);note=f'All4ORDEREDpairs BOTHactualequations{eqs}, masks{truths}; twoonlyfirstdistractorsandSWAPPEDpairpreserved; unique{answer}.'
 elif n==9:
  total,ratio=numbers(s);assert'x — ақ, y — қоңыр'in s;xs=[(total-y,y)for y in range(1,total)if total-y==ratio*y];x,y=one(xs);assert(x,y)==(40,8);answer=numeric_answer(r,x)
  note=f'CompletePOSITIVEintegercountdomain1..{total-1}; actualTOTAL{total}, firstlarger{ratio}timessecond, unique{x},{y}; requestedWHITEx{x}, notsmallery{y}.'
 elif n==10:
  answer=one([o for o in r['options']if o.startswith('Барлық ортақ шешім жұптарын')and'жоқ екенін дәлелдеу'in o]);assert'БАРЛЫҒЫН'in r['solution'];note='DefinitiontargetALLCOMMONorderedpairs simultaneouslysatisfyingALL equations, orproofnone. Formalexamples: identicalequationsx+y=1admitinfinite(1-t,t), incompatiblex+y=1/2none, independentx+y=1/x-y=1uniquepair(1,0); onecoordinate/oneequation/splitpairsnotcomplete.'
 else:raise AssertionError(n)
 assert answer==r['answer'],(n,answer,r['answer']);return note

def finite_canaries():
 count=0
 for x in range(-20,21):
  for y in range(-20,21):
   assert not(holds('x+y=5',x,y)and holds('x+y=8',x,y));count+=1
 # Fourchoices contain firstequationonly and BOTH regimes; no samplesign claim.
 for total in range(2,30):
  ps=[(x,total-x)for x in range(1,total)]
  assert len(ps)==total-1 and all(x>0 and y>0 and x+y==total for x,y in ps)
  for difference in range(-total+2,total-1):
   candidates=[(x,y)for x,y in ps if x-y==difference]
   assert len(candidates)<=1;count+=len(ps)
 for t in range(-20,21):assert holds('x+y=1',1-t,t);count+=1
 return count

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--write',action='store_true');args=ap.parse_args();rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==11;entries=[];refs=set()
 for row in rows:
  ref=one(row['sourceRefs']);rawfile=json.loads((ROOT/ref['sourceFile']).read_text());assert rawfile['status']=='captured';raw=one([q for q in rawfile['questions']if q['id']==ref['sourceId']]);assert raw['solution']and not raw.get('svg')and not raw.get('images');refs.add(ref['sourceId']);norm=lambda s:unicodedata.normalize('NFKC',s).lower().split();assert norm(raw['statement'])!=norm(row['statement']);note=solve(row)
  assert row['grade']==6 and row['minimumPlan']=='pro'
  if row.get('options'):assert len(set(row['options']))==4 and row['options'].count(row['answer'])==1
  else:assert re.fullmatch(r'\d+',row['answer'])and'Жауапқа тек санды жазыңыз.'in row['statement']
  entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified','method':'Independent ACTUALprinted exactFraction bivariateequation/domain/ALLoption BOTH-equation oracle; formalrankcontradiction/ALLcommonsolutionsdefinition, word-rolematrix/positiveintegerpricewitness, completepositiveintegerenumeration. All11saved/new/fullofficial/newsolutions/everyMCQread; noauthorcalculatorimports.','notes':note})
 assert refs==set(ID);canaries=finite_canaries()
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1])).editions.map(r=>[r.editionId,editionHash(r)])))"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js,PACK],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 badkeys=0
 for row in rows:
  bad=copy.deepcopy(row);bad['answer']='WRONG'
  try:solve(bad)
  except AssertionError:badkeys+=1
  else:raise AssertionError('wrongkeyaccepted')
 report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All11canonical nonvisual saved/new conditions, FULLofficial/newsolutions/everyMCQread. Independent actualprinted Fraction/bivariateequation and fullpositiveintegercountdomains, EVERYequationforEVERYpair/systemoption, requestedPRODUCT/y/SUM/RHSconstants/WHITElargerquantity, word-to-systemcountandpriceDIFFERENCEroleswithactualpositiveintegerpricewitness160/340, formalNOREALsolutionrankcontradiction andALLcommonsolutionsdefinition. Fivevisualsourcesexcluded; findings0, noauthorcalculatorimports.','entries':entries}
 if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'verified':len(entries),'badkeysRejected':badkeys,'JSHashes':len(hashes),'finiteCountAndSystemCanaries':canaries,'report':OUT if args.write else None}))
if __name__=='__main__':main()
