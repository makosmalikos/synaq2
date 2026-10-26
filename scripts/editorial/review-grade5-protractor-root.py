"""Independent root review of 25 saved and rewritten protractor tasks.
Full conditions, official and new solutions and EVERY MCQ manually read.
Uses printed text only, exact arithmetic and geometric/dependency enumeration;
no author model/spec/params/calculator is imported or used as an oracle.
"""
import ast,copy,hashlib,itertools,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade5-protractor.json'
REPORT='problems/editorial/reviews/grade5-protractor.json'
def one(xs):
 xs=list(xs);assert len(xs)==1,xs
 return xs[0]
def clean(s):
 s=unicodedata.normalize('NFKC',str(s)).replace('−','-')
 s=re.sub(r'\\+(?:d?frac)\{(\d+)\}\{(\d+)\}',r'(\1/\2)',s)
 s=re.sub(r'\\+(?:circ)', '°',s)
 return s.replace('$','').replace('^','').replace('\\cdot','×').replace('\\,','')
def ns(s):return list(map(int,re.findall(r'\d+',clean(s))))
def degrees(s):return list(map(int,re.findall(r'(\d+)\s*°',clean(s))))
def opts(r):return [clean(o['text']if isinstance(o,dict)else o)for o in r.get('options')or[]]
def calc(s):
 s=clean(s).strip().replace('°','').replace('×','*').replace(':','/')
 tree=ast.parse(s,mode='eval')
 def go(n):
  if isinstance(n,ast.Expression):return go(n.body)
  if isinstance(n,ast.Constant):assert isinstance(n.value,int);return F(n.value)
  if isinstance(n,ast.UnaryOp):assert isinstance(n.op,(ast.UAdd,ast.USub));return go(n.operand)*(-1 if isinstance(n.op,ast.USub)else 1)
  assert isinstance(n,ast.BinOp);a,b=go(n.left),go(n.right)
  if isinstance(n.op,ast.Add):return a+b
  if isinstance(n.op,ast.Sub):return a-b
  if isinstance(n.op,ast.Mult):return a*b
  assert isinstance(n.op,ast.Div)and b;return a/b
 return go(tree)
def number(r,v):
 assert calc(r['answer'])==v,(r['answer'],v)
 if opts(r):assert sum(calc(o)==v for o in opts(r))==1
 return str(v)
def select(r,predicate):
 result=one(o for o in opts(r)if predicate(o));assert clean(r['answer'])==result,(r['answer'],result)
 return result
def solve(r,i,source=False):
 s=clean(r['statement']);n=ns(s);ds=degrees(s)
 if i==0:
  tick,first,last=n;assert 0<=first<last<=180 and tick>0
  assert (last-first)%tick==0
  return number(r,F(last-first,tick))
 if i==1:return number(r,180)
 if i==2:
  first,step,third=(n[0],n[1]-n[0],n[2])if source else(n[1],n[0],n[3])
  assert first==0 and third==2*step and step>0 and 180%step==0
  return number(r,len(list(range(0,181,step))))
 if i==3:return select(r,lambda o:ns(o)==[0])
 if i==4:
  base,after=n[1:3];assert 0<=base<180 and after>0
  return number(r,base+after)
 if i==5:
  letters=one(re.findall(r'(?:∠|\\+angle\s*)([A-Z]{3})',s));assert len(set(letters))==3
  return select(r,lambda o:o.startswith(letters[1]+' нүктесіне'))
 if i==6:
  whole=ds[0];assert 0<whole<=180
  return number(r,F(whole*2,3))
 if i==7:
  minutes=n[-1];assert 0<minutes<60
  return number(r,minutes*F(360,60))
 if i==8:
  first,second=ds;assert 0<first<first+second<180
  return number(r,first+second)
 if i==9:
  a,b=ds;assert 0<a<180 and 0<b<180
  return number(r,(180-a)+(180-b))
 if i==10:
  wanted=ds[0];assert 0<wanted<180 and wanted!=90
  return select(r,lambda o:o.lower().startswith('сол')and ns(o)==[0,wanted])
 if i==11:
  outer,inner=n[-2:];assert outer+inner==180 and outer!=inner
  return number(r,inner)
 if i==12:
  bad=one(ds);assert 0<bad<180
  return number(r,180-bad)
 if i==13:
  middle,last=n[1:];assert 0<middle<last<180
  x=F(middle,2);y=F(middle+last,2)
  assert x<middle<y<last and y-x==F(last,2)
  return number(r,y-x)
 if i==14:
  step=ds[0];assert 0<step<180
  positions=[x for x in range(step,181,step)]
  assert positions[-1]<=180<positions[-1]+step
  return number(r,180-positions[-1])
 if i==15:
  hour,minute=map(int,one(re.findall(r'(\d+)\s*:\s*(\d+)',s)));assert 0<=hour<12 and 0<=minute<60
  a=30*hour+F(minute,2);b=6*minute;gap=abs(a-b)
  return number(r,min(gap,360-gap))
 if i==16:
  whole=ds[0];a,b=map(int,re.findall(r'(\d+)\s*есе',s));assert a>0 and b>0
  unit=F(whole,1+a+b);parts=[unit,a*unit,b*unit];assert min(parts)>0 and sum(parts)==whole
  return number(r,sum(parts[:2]))
 if i==17:
  wanted=ds[0];assert 0<wanted<90
  actual=180-wanted;assert wanted<actual<180
  return number(r,actual-wanted)
 if i==18:
  bad=one(ds);assert 0<bad<90
  return number(r,(180-bad)-bad)
 if i==19:
  if source:ordered=[2,4,1,3]
  else:
   stages={int(k):v for k,v in re.findall(r'(\d)\) (.*?)(?= \d\)| ДҰРЫС)',s)};assert len(stages)==4
   first=one(k for k,v in stages.items()if v.startswith('Бірінші'))
   tool=one(k for k,v in stages.items()if v.startswith('Транспортир'))
   mark=one(k for k,v in stages.items()if v.startswith('Сол қатардан'))
   final=one(k for k,v in stages.items()if v.startswith('Соңғы'))
   candidates=[p for p in itertools.permutations(stages)if p.index(first)<p.index(tool)<p.index(mark)<p.index(final)]
   ordered=list(one(candidates))
  return select(r,lambda o:ns(o)==ordered)
 if i==20:return select(r,lambda o:ns(o)==[180])
 if i==21:
  num,den=map(int,one(re.findall(r'\((\d+)/(\d+)\)',s)));assert 0<num<den
  return number(r,F(180*num,den))
 if i==22:
  readings=ds;assert len(readings)==3 and all(0<x<180 for x in readings)
  candidates=[]
  for j in range(3):
   actual=[180-x if k==j else x for k,x in enumerate(readings)]
   if min(actual)>0 and sum(actual)==180:candidates.append((readings[j],actual[j]))
  bad,good=one(candidates);assert sum(readings)!=180
  return select(r,lambda o:ns(o)==[bad,good])
 if i==23:
  a=n[-1];assert 0<a<60
  return number(r,3*a)
 if i==24:
  a,b,c=ds;assert a+c==b and 0<a<b<180
  # Fix the outer-angle first edge at zero. Enumerate both possible signs
  # for the other outer edge and the candidate interior ray. Every valid
  # mirror placement has the same interior ray.
  def gap(x,y):return min((x-y)%360,(y-x)%360)
  placements=[(p%360,q%360)for p in[a,-a]for q in[b,-b]if gap(p,q)==c]
  assert len(placements)==2
  assert all(gap(0,p)+gap(p,q)==gap(0,q)for p,q in placements)
  ray='OA'if source else'OP'
  return select(r,lambda o:o.startswith(ray+' сәулесі'))
 raise AssertionError(i)
NOTES=[
 'Printed25..83one-degreeINTERVALS58, not59marks; inverseendpointbackcheck.',
 'Explicitstandardsemicircle180 invariant; all90/360/100distractorsfalse.',
 'ExplicitCUSTOM15degreeboldticks; full0..180list13includesbothends.',
 'AskedDIRECTreadingWITHOUTsubtraction, correctzero; otherbaselinespossibleonlywithcorrection.',
 'After50seventhone-degreeTICK57, notinclusive50asfirst.',
 'AngleRST middlevertexS definesinstrumentcenter, notendpoints/midpoint.',
 'Equal126/3=42, askedSECONDinteriorcumulative84, notsingle42.',
 'MinutehandfullTURN28×6=168; start6:00irrelevant; allwrongrates5/3/10false.',
 'Fixedzeroadjacent42+73=115, not73resetreading; positiveorderedraysfit180.',
 'TWOseparateoppositerowcorrections63+38=101, notraw259/singlereversal.',
 'JointLEFTrowAND152label, wrongright152meansleft28; allrow/markMCQschecked.',
 'Innerbaselinezero fixes118, actualouter62+inner118=180, sum/differencefalse.',
 'Oppositerow137→43, backsum180; retainsrecoverTRUEangle target.',
 'Actualbisectormarks23/94→gap71; bothsubangles anduniversalouterhalfchecked.',
 'Sixcomplete28stepslast168,next196invalid; askedOTHERrow12, notcount6/inner168.',
 'Continuoushour4:30→135not120, minute180, smaller45ratherthan315.',
 'Positiveweighted1:2:4parts22/44/88, askedcumulative66notmiddle44.',
 'Wrongray125andcorrect55bothsamehalfplane→GAP70, all4actualroleschecked.',
 'TRUEreading133versuswrong47, askedEXCESS86;90based43notstraight.',
 '24permutations ofactualparsedfourinstructions, unique3,2,4,1dependencyorder.',
 'FORMALall0≤t≤180 identityt+(180−t)=180,181integer/1801tenth-degreepairs.',
 'Actualprinted7/12ofstraight180→105; 180/12=15unitthen×7; allnativefractionsread.',
 'Everyonewrongcandidatecorrected42→138/130→50/88→92, onlymiddlemakespositive180sum.',
 'SuccessiveINTERNALbisectorsorderedzero,54→108→162<180; threeadjacent54parts.',
 'Pairwisesmaller52/81/29, completeTWOmirrorplacementsfixOPinterior, notOQ/OR/impossible.',
]
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==25
 entries=[];refs=[];claims=0;canaries=0;native=0
 for i,r in enumerate(rows):
  try:solve(r,i)
  except Exception as e:raise AssertionError(('NEW',i))from e
  ref=one(r['sourceRefs']);src=json.loads((ROOT/ref['sourceFile']).read_text());raw=one(q for q in src['questions']if q['id']==ref['sourceId'])
  assert src['grade']==5 and src['status']=='captured' and raw['checked']and not raw.get('images')and not raw.get('svg')
  try:solve({**raw,'answer':raw['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  if raw.get('options'):assert clean(one(o['text']for o in raw['options']if o['correct']))==clean(raw['sourceAnswer'])
  assert r['minimumPlan']=='pro'and clean(r['statement']).casefold()!=clean(raw['statement']).casefold()
  assert not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution'])
  bad=copy.deepcopy(r);bad['answer']='WRONG_KEY'
  try:solve(bad,i)
  except (AssertionError,ValueError,SyntaxError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  changed=copy.deepcopy(r)
  # Test actual printed givens/target options, not hidden model parameters.
  replacements={0:('83 белгілерінің','84 белгілерінің'),2:('15° сайын','10° сайын'),4:('КЕЙІНГІ 7-ші','КЕЙІНГІ 8-ші'),6:('126°','129°'),7:('28 минутта','29 минутта'),8:('42°','43°'),9:('117°','118°'),10:('152°','151°'),11:('ішкі қатар 118','ішкі қатар 119'),12:('137°','138°'),13:('142 белгісінен','144 белгісінен'),14:('28°-тық','29°-тық'),15:('4:30','3:30'),16:('154°','161°'),17:('55°','56°'),18:('47°','48°'),21:('(7/12)','(8/12)'),22:('130°;','131°;'),23:('54 белгісінде','55 белгісінде'),24:('52°','53°')}
  if i in replacements:
   a,b=replacements[i];assert a in changed['statement'],(i,a);changed['statement']=changed['statement'].replace(a,b,1)
  else:
   index=one(j for j,o in enumerate(changed['options'])if o==changed['answer']);changed['options'][index]='INVALID_OPTION'
  try:solve(changed,i)
  except (AssertionError,ValueError,SyntaxError):canaries+=1
  else:raise AssertionError(('printedcanaryaccepted',i))
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:\s*[+×:-]\s*-?\d+)+)\s*=\s*(-?\d+(?:\s*[+×:-]\s*-?\d+)*)',clean(r['solution'])):
   a,b=m.groups();assert calc(a)==calc(b),(i,a,b);claims+=1
  native+=len(re.findall(r'\(\d+/\d+\)',r['statement']+r['solution']))
  entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','method':'independent_root_full_saved_new_official_solutions_every_MCQ_read_actual_printed_exact_geometry_dependency_and_domain_oracle','notes':[NOTES[i]]});refs.append(ref)
 assert all(t+(180-t)==180 for t in range(181))
 assert all(F(t,10)+(180-F(t,10))==180 for t in range(1801))
 # Check first, middle and last interior locations for every tenth-degree
 # outer angle; the printed algebraic proof covers all real locations.
 bisectorcases=0
 for total in range(2,1801):
  for m in [1,total//2,total-1]:
   if 0<m<total:
    assert (F(m,10)+F(total,10))/2-F(m,20)==F(total,20);bisectorcases+=1
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 report={'schemaVersion':1,'reviewer':'root_independent_of_protractor_author','batch':BATCH,'scope':__doc__,'summary':{'verified':25,'findings':0,'fullSavedAndNewSolutionsEveryMCQRead':25,'wrongKeysRejected':25,'printedGivenOrRoleCanariesRejected':canaries,'printedNumericClaims':claims,'nativeFractionNodes':native,'constructionPermutations':24,'oppositeScaleIntegerCases':181,'oppositeScaleTenthDegreeCases':1801,'adjacentBisectorCases':bisectorcases,'pythonJavaScriptHashesMatched':25},'sourceRefs':refs,'entries':entries}
 if '--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
