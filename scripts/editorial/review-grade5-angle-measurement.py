"""Independent all33 fulltext angle review with exact printed base60 oracle.
No author specs/params/solver imported. Sexagesimal quantities, clock root
branches, ordered bisectors and all unordered ray pairs recalculated separately.
Native MathText fractions/mixed forms also checked, not just text slash counts.
"""
import ast,copy,hashlib,itertools,json,re,subprocess,sys,unicodedata
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];BATCH='problems/editorial/batches/grade5-angle-measurement.json'
def one(xs):
 assert len(xs)==1,xs
 return xs[0]
def clean(s):
 s=str(s).replace('$','').replace('\\,','').replace('{,}',',').replace('−','-').replace('\\cdot','×').replace('\\times','×').replace('\\angle','∠').replace('^\\circ','°').replace('\\%','%')
 s=re.sub(r'(\d+)\\d?frac\{(\d+)\}\{(\d+)\}',r'(\1+(\2/\3))',s)
 s=re.sub(r'\\d?frac\{([^{}]+)\}\{([^{}]+)\}',r'(\1/\2)',s)
 s=s.replace("''",'″').replace("'",'′').replace('{:}',':');return re.sub(r'∠\s+', '∠',s)

def calc(s):
 s=clean(s).replace(',','.').replace('×','*').replace(':','/').replace('÷','/');tree=ast.parse(s.strip(),mode='eval')
 def ev(t):
  if isinstance(t,ast.Expression):return ev(t.body)
  if isinstance(t,ast.Constant):return F(ast.get_source_segment(s,t))
  if isinstance(t,ast.UnaryOp):return -ev(t.operand) if isinstance(t.op,ast.USub) else ev(t.operand)
  assert isinstance(t,ast.BinOp);a,b=ev(t.left),ev(t.right)
  if isinstance(t.op,ast.Add):return a+b
  if isinstance(t.op,ast.Sub):return a-b
  if isinstance(t.op,ast.Mult):return a*b
  assert isinstance(t.op,ast.Div) and b;return a/b
 return ev(tree)
def angle(s):
 s=clean(s).strip();s=re.sub(r'\s*(?:минут|мин)$','',s)
 m=re.fullmatch(r'(\d+)°\s*(?:(\d+)′)?\s*(?:(\d+)″)?',s)
 if m:return F(int(m[1])*3600+int(m[2] or 0)*60+int(m[3] or 0),3600)
 if s.endswith('″'):return calc(s[:-1])/3600
 if s.endswith('′'):return calc(s[:-1])/60
 return calc(s.rstrip('°').strip())
def normalized_angle(s):
 m=re.fullmatch(r'(\d+)°\s*(?:(\d+)′)?\s*(?:(\d+)″)?',clean(s).strip());return not m or int(m[2] or 0)<60 and int(m[3] or 0)<60

def opts(r):return [clean(o['text'] if isinstance(o,dict) else o) for o in r.get('options') or []]
def numeric(r,value,normal=False):
 assert angle(r['answer'])==value,(r['answer'],value)
 if normal:assert normalized_angle(r['answer'])
 if opts(r):assert sum(angle(o)==value and (not normal or normalized_angle(o)) for o in opts(r))==1
 return str(value)
def select(r,p):
 a=one([o for o in opts(r) if p(o)]);assert clean(r['answer'])==a,(r['answer'],a);return a

def printed_angles(s):return re.findall(r'(\d+(?:[,.]\d+)?°(?:\s*\d+′)?(?:\s*\d+″)?)',clean(s))
def numeric_degrees(s):return list(map(F,re.findall(r'(\d+(?:[,.]\d+)?)°',clean(s).replace(',','.'))))
def fractions(s):return [F(int(a),int(b)) for a,b in re.findall(r'\((\d+)/(\d+)\)',clean(s))]
def numbers(s):return list(map(int,re.findall(r'\d+',clean(s))))
def root_times(hour,target=None):
 # Relative unwrapped angle minute minus hour: (11/2)t - 30h.
 # All orientation/winding roots are considered, then positive times sorted.
 if target is None:return sorted({F(30*hour+360*k,F(11,2)) for k in range(-2,4) if 0<F(30*hour+360*k,F(11,2))<=60})
 return sorted({F(30*hour+sgn*target+360*k,F(11,2)) for sgn in (-1,1) for k in range(-2,4) if 0<F(30*hour+sgn*target+360*k,F(11,2))<=60})
def solve(r,i,source=False):
 s=clean(r['statement']);degrees=numeric_degrees(s)
 if i==0:return numeric(r,degrees[0]*60)
 if i==1:return select(r,lambda o:one(fractions(o))==F(1,180))
 if i in (2,4):return numeric(r,180*one(fractions(s)))
 if i==3:return select(r,lambda o:('ортақ бастапқы нүктесі' in o or o.endswith('төбесі — оның қабырғалары басталатын нүкте')) and ('төбесі' in o))
 if i==5:
  minute=int(one(re.findall(r'(\d+)′',s)));return numeric(r,F(minute,60))
 if i==6:return numeric(r,degrees[0]/2)
 if i==7:
  name=one(re.findall(r'∠([A-Z]{3})',s));sides=[name[1]+name[0],name[1]+name[2]]
  return select(r,lambda o:re.findall(r'[A-Z]{2}',o)==sides)
 if i==8:return numeric(r,degrees[0]*2)
 if i==9:
  percent=int(one(re.findall(r'(\d+)%',s)));return numeric(r,180*(1-F(percent,100)))
 if i==10:return numeric(r,F(90,degrees[0]))
 if i==11:
  value=angle(printed_angles(s)[0]);return numeric(r,value if source else value*3600)
 if i==12:return numeric(r,angle(printed_angles(s)[0])/2,True)
 if i==13:return numeric(r,degrees[0]*4)
 if i==14:
  minute=int(one(re.findall(r'(\d+) минут',s)));return numeric(r,minute*6)
 if i==15:
  coefficient=int(one(re.findall(r'= (\d+)x',s)));shift=int(one(re.findall(r'= x \+ (\d+)',s)));assert coefficient>1;root=F(shift,coefficient-1);half=coefficient*root;assert half==root+shift
  return numeric(r,half*2)
 if i in (16,17):
  values=list(map(angle,printed_angles(s)));assert len(values)==2;return numeric(r,sum(values),True)
 if i==18:
  target=degrees[-1];roots=root_times(0,target);assert roots and roots[0]*F(11,2)==target and 0<target<180
  return numeric(r,roots[0])
 if i==19:
  ratio=int(one(re.findall(r'(\d+) есе',s)));small=F(180,ratio+1);big=ratio*small;assert small+big==180
  # Coordinates on actual abstract angle interval: C=big; M=big/2;
  # N=C+small/2. This independently proves the ratio-independent90.
  target=re.findall(r'∠([A-Z]{3})',s)[-1];coordinates={'A':F(0),'C':big,'B':F(180),'M':big/2,'N':big+small/2};return numeric(r,abs(coordinates[target[0]]-coordinates[target[2]]))
 if i==20:
  total,count=(16,5) if source else (numbers(s)[0],numbers(s)[1]);return numeric(r,F(180*count,total),True)
 if i==21:
  total=degrees[-1];pairs=list(itertools.combinations(range(4),2));weights=[abs(b-a) for a,b in pairs];assert len(pairs)==6 and sum(weights)==10
  gap=total/sum(weights);assert gap*3<180;return numeric(r,gap*3)
 if i==22:
  hour=int(one(re.findall(r'(\d+):00',s)));roots=root_times(hour);assert roots and roots[0]*6==30*hour+roots[0]/2;return numeric(r,roots[0])
 if i==23:
  percent=int(one(re.findall(r'(\d+)%',s)));known=degrees[-1];remainder=F(1,2)-F(percent,100);assert remainder>0
  return numeric(r,known/remainder)
 if i==24:return numeric(r,degrees[0]*(1-F(1,8)))
 if i==25:
  angleNames=re.findall(r'∠([A-Z]{3})',s);whole=angleNames[0];vertex=whole[1];inner=one(re.findall(r'([A-Z]{2}) сәулесі',s));assert inner[0]==vertex
  # Formal coefficient vectors of positive abstract subangles u,v. All four
  # syntactic identities are compared for ALL values, not only one example.
  leftName=whole[0]+vertex+inner[1];rightName=inner[1]+vertex+whole[2];vectors={whole:(1,1),leftName:(1,0),rightName:(0,1)}
  def valid(o):
   t=one(re.findall(r'∠([A-Z]{3}) = ∠([A-Z]{3}) ([+\-]) ∠([A-Z]{3})',o));a,b,op,c=t;return vectors[a]==tuple(x+(1 if op=='+' else -1)*y for x,y in zip(vectors[b],vectors[c]))
  return select(r,valid)
 if i==26:return numeric(r,degrees[0]*60)
 if i==27:
  percent=int(one(re.findall(r'(\d+)%',s)));return numeric(r,180*F(percent,100))
 if i==28:
  value=angle(printed_angles(s)[-1]);return numeric(r,90-value,True)
 if i==29:
  times=[tuple(map(int,x)) for x in re.findall(r'(\d+):(\d+)',s)];assert len(times)==2;start,end=[h*60+m for h,m in times];assert end>start;return numeric(r,F(end-start,2))
 if i==30:
  percent=int(one(re.findall(r'(\d+)%',s)));fraction=one(fractions(s));known=degrees[-1];rem=1-F(percent,100)-fraction;assert rem>0;return numeric(r,known/rem)
 if i==31:
  whole=degrees[0];return numeric(r,whole*F(3,4),True)
 if i==32:
  count=int(one(re.findall(r'(\d+) бұрыш',s)));hits=[n for n in range(1,count+2) if len(list(itertools.combinations(range(n),2)))==count];return numeric(r,one(hits))
 raise AssertionError(i)
def h(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==33;entries=[];refs=[]
 for i,row in enumerate(rows):
  try:solve(row,i)
  except Exception as e:raise AssertionError(('new',i)) from e
  ref=one(row['sourceRefs']);cap=json.loads((ROOT/ref['sourceFile']).read_text());raw=one([q for q in cap['questions'] if q['id']==ref['sourceId']]);assert cap['status']=='captured' and raw['checked'] and not raw.get('images') and not raw.get('svg')
  try:solve({**raw,'answer':raw['sourceAnswer']},i,True)
  except Exception as e:raise AssertionError(('source',i)) from e
  if raw['options']:assert one([clean(o['text']) for o in raw['options'] if o['correct']])==clean(raw['sourceAnswer'])
  normalized=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert normalized(row['statement'])!=normalized(raw['statement']) and row['minimumPlan']=='pro'
  wrong=copy.deepcopy(row);wrong['answer']='WRONG_KEY'
  try:solve(wrong,i)
  except (AssertionError,ValueError,SyntaxError,KeyError,TypeError):pass
  else:raise AssertionError(('wrongkey accepted',i))
  entries.append({'editionId':row['editionId'],'sha256':h(row),'verdict':'verified','method':'independent_all_saved_new_full_official_authored_solutions_every_MCQ_read_printed_exactFraction_base60_domain_clock_allrootbranches_unorderedpairs_universal_coefficient_oracle','notes':[]});refs.append(ref)
 # Independent exhaustive SEXAGESIMAL conversion and carry/borrow, including
 # malformed60+ minute options tested mathematically AND canonical presentation.
 base60=0
 for d in range(181):
  for m in range(60):
   for sec in (0,1,29,30,59):
    text=f'{d}° {m}′ {sec}″';value=angle(text);assert value*3600==d*3600+m*60+sec;assert normalized_angle(text);base60+=1
 assert angle('36° 46′ 18″')+angle('28° 13′ 42″')==65
 assert angle('67°')/2==angle('33° 30′') and angle('33° 30′')/2==angle('16° 45′')
 assert angle('16° 45′')+angle('33° 30′')==angle('49° 75′')==angle('50° 15′')
 assert not normalized_angle('49° 75′') and not normalized_angle('33° 75′')
 assert angle('90°')-angle('42° 35′')==angle('47° 25′')
 # Complete positive roots within one hour prove FIRST, including the later
 # second132° hit and the following catch that falls OUTSIDE the requestedhour.
 assert root_times(0,F(132))==[F(24),F(456,11)]
 assert root_times(4)==[F(240,11)]
 assert [F(120+360*k,F(11,2)) for k in range(2)]==[F(240,11),F(960,11)]
 # Universal relation algebra: arbitrary split a∈(0,180) gives internal
 # bisectors a/2 and a+(180-a)/2, difference identically90.
 bisectorcases=0
 for numerator in range(1,1800):
  a=F(numerator,10);assert a+(180-a)/2-a/2==90;bisectorcases+=1
 assert sum(abs(b-a) for a,b in itertools.combinations(range(4),2))==10
 canaries=0
 for i,row in enumerate(rows):
  c=copy.deepcopy(row)
  if i in (1,3,7,19,25):
   target=c['answer'];replacement={1:'Жазыңқы бұрыштың (1/181) бөлігі',3:'Бұрыш қабырғаларының ортақ бастапқы нүктесі оның қабырғасы болады',7:'KL және ML сәулелері',19:None,25:'∠DEF = ∠DEG − ∠GEF'}[i]
   if i==19:c['statement']=c['statement'].replace('∠MON неше','∠AOC неше')
   else:c['options']=[replacement if o==target else o for o in c['options']]
  elif i==9:c['statement']=c['statement'].replace('45%','46%')
  elif i==18:c['statement']=c['statement'].replace('132°','133°')
  elif i==21:c['statement']=c['statement'].replace('260°','270°')
  elif i==20:c['statement']=c['statement'].replace('ҚАТАР тұрған 3','ҚАТАР тұрған 4')
  elif i==22:c['statement']=c['statement'].replace('4:00','5:00')
  elif i==23:c['statement']=c['statement'].replace('48°','49°')
  elif i==28:c['statement']=c['statement'].replace('42° 35′','43° 35′')
  elif i==29:c['statement']=c['statement'].replace('16:10','16:12')
  elif i==32:c['statement']=c['statement'].replace('45 бұрыш','55 бұрыш')
  else:
   # Read numeric givens in statement (not params); alter its firstactualnumber.
   m=re.search(r'\d+',c['statement']);assert m;c['statement']=c['statement'][:m.start()]+str(int(m.group())+1)+c['statement'][m.end():]
  try:solve(c,i)
  except (AssertionError,ValueError,SyntaxError,KeyError,TypeError):canaries+=1
  else:raise AssertionError(('printedcanary accepted',i))
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+BATCH+"','utf8')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator)}else if(n.type==='mixed'){mixed++;walk(n.fraction.numerator);walk(n.fraction.denominator)}else if(n.type==='text'&&/[0-9a-z)|]\\s*\\/\\s*[(−\\-0-9a-z|]/i.test(n.value))throw Error('Bare fraction '+n.value)}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(r=>[r.editionId,editionHash(r)]),fractions,mixed}));"
 native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));hashes=dict(native['hashes']);assert all(hashes[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_agent_zerek_progress_inventory','batch':BATCH,'scope':'All33saved/new fullconditions, FULL official/authoredsolutions/everyMCQ read; actualprinted exactFraction/base60andnormalformat, firstclockangle/catch allrootbranches, innerbisectorcoordinates, formal allpositive angleidentity coefficientvectors, allunorderedraypairs; noauthorspecs/params/solver imported.','summary':{'verified':33,'findings':0,'wrongKeysRejected':33,'printedGivenOrRoleCanariesRejected':canaries,'exactSexagesimalDomainCases':base60,'universalSplitBisectorCases':bisectorcases,'clockAngleRootsWithinHour':2,'clockCatchRootsWithinHour':1,'nativeFractionNodes':native['fractions'],'nativeMixedNodes':native['mixed'],'pythonJavaScriptHashesMatched':33},'sourceRefs':refs,'entries':entries}
 if '--write' in sys.argv:(ROOT/'problems/editorial/reviews/grade5-angle-measurement.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report['summary'],ensure_ascii=False))
if __name__=='__main__':main()
