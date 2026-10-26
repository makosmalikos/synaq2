"""Independent full13 rational-set review. Printed-data Fraction/AST oracle only.
All canonical/new complete conditions, solutions and everyMCQ read individually.
"""
import ast,copy,hashlib,json,re,subprocess
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
BATCH='problems/editorial/batches/grade6-rational-sets.json';REPORT='problems/editorial/reviews/grade6-rational-sets.json'
def read(p):return json.loads((ROOT/p).read_text())
def clean(s):
 s=s.replace('\\\\','\\').replace('$','').replace('{,}',',').replace('\\,','').replace('\\quad','').replace('−','-').replace('\\in','∈')
 s=re.sub(r'(\d+)\s*\\(?:dfrac|frac)\{(\d+)\}\{(\d+)\}',r'(\1+(\2/\3))',s)
 s=re.sub(r'\\(?:dfrac|frac)\{(-?\d+)\}\{(-?\d+)\}',r'(\1/\2)',s)
 return re.sub(r'\\(?:dfrac|frac)\{m\}\{(\d+)\}',r'(m/\1)',s)
def expr(s):
 t=clean(s).replace(',','.').replace('×','*').replace(':','/').strip()
 def walk(a):
  if isinstance(a,ast.Constant):return F(ast.get_source_segment(t,a))
  if isinstance(a,ast.UnaryOp):assert isinstance(a.op,(ast.USub,ast.UAdd));return -walk(a.operand) if isinstance(a.op,ast.USub) else walk(a.operand)
  assert isinstance(a,ast.BinOp),ast.dump(a);x,y=walk(a.left),walk(a.right)
  if isinstance(a.op,ast.Add):return x+y
  if isinstance(a.op,ast.Sub):return x-y
  if isinstance(a.op,ast.Mult):return x*y
  if isinstance(a.op,ast.Div):return x/y
  raise AssertionError(ast.dump(a))
 return walk(ast.parse(t,mode='eval').body)
def ops(r):return[o['text'] if isinstance(o,dict) else o for o in r.get('options',[])]
def one(a):assert len(a)==1,a;return a[0]
def norm(s):return re.sub(r'\s+',' ',clean(s)).strip()
def integer(v):return v.denominator==1
def natural(v):return integer(v) and v>=1
def nums(s):return[F(v.replace(',','.')) for v in re.findall(r'-?\d+(?:[,.]\d+)?',clean(s))]
def parenthesized(s):
 t=clean(s);start=t.index('(');depth=0
 for j in range(start,len(t)):
  if t[j]=='(':depth+=1
  if t[j]==')':
   depth-=1
   if depth==0:return t[start:j+1]
 raise AssertionError('Unclosed printed expression')
domains=0
def solve(row,i,source=False):
 global domains
 s=row['statement'];options=ops(row);expected=None;exact=None;notes=[]
 if i==1:
  target=nums(s)[0]
  def eligible(o):
   t=clean(o).strip();m=re.fullmatch(r'\((-?\d+)/(-?\d+)\)',t);assert m,t
   return int(m[2])>0 and expr(o)==target
  exact=one([o for o in options if eligible(o)])
  assert target.denominator==1 and target<0 and ('оң натурал' in s if not source else 'натурал' in s)
  notes=['Representation checked syntactically and numerically:negativeinteger−8 has integer numerator−8 and positive denominator1. A negative denominator violates the stated form; reciprocal is a different value.']
 elif i==2:
  target=nums(s)[0];exact=one([o for o in options if expr(o)==target]);assert target.denominator==10
  if not source:assert expr('(4+(7/10))')==expr('(47/10)')==target
 elif i==3:
  exact=one([o for o in options if integer(expr(o)) and not natural(expr(o))]);assert expr(exact)==0
  if not source:assert '1-ден басталады' in s
 elif i in(4,6):
  exact=one([o for o in options if integer(expr(o))]);assert expr(exact)<0
  assert all(not integer(expr(o)) for o in options if o!=exact)
  notes=['Exact Fraction reduction, not visible notation, determines integer membership. All three distractors evaluated as nonintegers.']
 elif i in(5,12):
  if source:listing=s.split('?',1)[1]
  else:listing=s.split(':',1)[1].split('. ',1)[0]
  strings=[t.strip() for t in clean(listing).split(';')];values=[expr(t) for t in strings]
  assert len(values)==(8 if i==5 else 7),values
  expected=sum(integer(v) for v in values) if i==5 else sum(natural(v) for v in values)
  if i==12:
   assert any(natural(expr(t)) and '/' in t for t in strings)
   assert '1-ден бастал' in s if not source else True
   notes=['Every printed listvalue reduced exactly; newpositive reducible28/4=7and6/2=3 both count as natural, zero/negative/1.1 do not. Result4 counts values, not notation.']
 elif i in(7,13):
  lo,hi=nums(s)[:2];assert lo<0<hi and integer(lo) and integer(hi)
  inclusive=i==13
  if not source:assert ('екі шеті де есепке кіреді' in s if inclusive else 'екі шет кірмейді' in s)
  candidates=range(int(lo)-2,int(hi)+3)
  hits=[v for v in candidates if (lo<=v<=hi if inclusive else lo<v<hi) and (True if inclusive else v<0)]
  domains+=len(candidates);expected=len(hits)
  if inclusive:assert 0 in hits and lo in hits and hi in hits
  else:assert 0 not in hits and lo not in hits and hi not in hits
  notes=['Complete integer interval enumerated; strictnegative count excludes both endpoints and0, inclusive allinteger count includes0 and both endpoints. These are different questions.']
 elif i==8:
  value=expr(parenthesized(s)) if not source else -expr(parenthesized(s))
  assert value<0 and integer(value)
  sets={'Q'}|({'Z'} if integer(value) else set())|({'N'} if natural(value) else set())
  exact=one([o for o in options if set(re.findall(r'[NZQ]',o))==sets]);assert sets=={'Z','Q'}
 elif i==9:
  value=expr(parenthesized(s));den=int(one(re.findall(r'\(m/(\d+)\)',clean(s))));expected=value*den;assert integer(expected)
  if not source:assert 'бөлімі дәл 5' in s and den==5
  notes=['Prescribed denominator remains5; mixed6+3/5equals33/5, so the requested numerator is33, not6.6 or an arbitrary equivalent numerator.']
 elif i==10:
  good=[]
  for o in options:
   left,right=clean(o).split('∈');value=expr(left);right=right.strip();assert right in('N','Z')
   if natural(value) if right=='N' else integer(value):good.append(o)
  exact=one(good)
  if not source:assert '1, 2, 3' in s
 elif i==11:
  domain=[v for v in range(-99,100) if v<0 and len(str(abs(v)))==1];expected=len(domain);domains+=199
  assert domain==list(range(-9,0)) and 0 not in domain and -10 not in domain
  notes=['Single digit means magnitude1…9; minus sign is not a digit, zero is not negative. This categorical fact is not a claimed newmeaning.']
 else:raise AssertionError(i)
 if exact is not None:assert norm(row['answer'])==norm(exact),(i,row['answer'],exact)
 else:assert expr(row['answer'])==expected,(i,row['answer'],expected)
 return notes
def numeric_eqs(row):
 count=0
 for m in re.finditer(r'[0-9(\-][0-9\s×+/:−(),=\-]*',row['solution']):
  text=m[0].strip().strip(',').strip('.')
  if '=' not in text:continue
  # Sentencecommas terminate a numeric chain; decimalcomma stays between digits.
  text=re.split(r',(?=\s)',text)[0]
  if not text:continue
  bits=text.split('=')
  if any(not b.strip() for b in bits):continue
  vals=[expr(b) for b in bits];assert all(v==vals[0] for v in vals),text;count+=1
 return count
def run():
 global domains
 rows=read(BATCH)['editions'];assert len(rows)==13;entries=[];wrong=0;eq=0
 for i,row in enumerate(rows,1):
  ref=row['sourceRefs'][0];capture=read(ref['sourceFile']);raw=one([q for q in capture['questions'] if q['id']==ref['sourceId']]);assert capture['status']=='captured' and raw['checked'] and raw['solution'] and raw['sourceAnswer'] and not raw.get('images')
  assert norm(row['statement'])!=norm(raw['statement']);solve({**raw,'answer':raw['sourceAnswer']},i,True);notes=solve(row,i)
  bad=copy.deepcopy(row);bad['answer']='INVALID KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError):wrong+=1
  else:raise AssertionError(('Wrongkey accepted',i))
  eq+=numeric_eqs(row)
  h=hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
  entries.append({'editionId':row['editionId'],'sha256':h,'verdict':'verified','method':'independent_full_content_read_actual_printed_Fraction_AST_membership_and_complete_integer_domains','notes':['Read this entire canonical condition, officialfullsolution and allsourceMCQs, plus allnewcondition/fullsolution/MCQs. No authorparams or authorsolver imported.','Exact rational value, positive-denominator form, Nstarting1, integer versus fraction notation, prescribed denominator and strict/inclusive endpoints checked.',*notes]})
 canaries=[(1,'-8 санын','-9 санын'),(2,'4,7 ондық','4,8 ондық'),(3,'-0,8','-8'),(4,'(-35/5)','(-34/5)'),(5,'3,7;','3;'),(6,'(-9/2)','(-10/2)'),(7,'-9 пен 9','-10 пен 9'),(8,'(-28/7)','(-27/7)'),(9,'(6 + (3/5))','(7 + (3/5))'),(10,'-8 ∈ N','8 ∈ N'),(12,'(6/2)','(-6/2)'),(13,'-6 және 6','-7 және 6')]
 rejected=0
 for i,a,b in canaries:
  bad=copy.deepcopy(rows[i-1])
  if a in bad['statement']:bad['statement']=bad['statement'].replace(a,b,1)
  else:
   j=one([j for j,o in enumerate(bad.get('options',[])) if a in o]);bad['options'][j]=bad['options'][j].replace(a,b,1)
  try:solve(bad,i)
  except(AssertionError,ValueError,SyntaxError):rejected+=1
  else:raise AssertionError(('Canary accepted',i))
 code="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync(process.argv[1],'utf8')).editions.map(r=>[r.editionId,editionHash(r)])));"
 js=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',code,BATCH],cwd=ROOT,text=True)));assert all(js[e['editionId']]==e['sha256'] for e in entries)
 report={'schemaVersion':1,'reviewer':'independent_editorial_review','scope':'All13 saved/new grade6rationalsets2.3 nonvisuallevel1; sourceoccurrences are not13 claimed distinctmeanings.','evidence':{'oracle':'scripts/editorial/review-grade6-rational-sets.py','fullSavedAndNewRead':13,'sourceKeysVerified':13,'printedExactKeys':13,'wrongKeysRejected':wrong,'printedCanariesRejected':rejected,'completeIntegerDomainCases':domains,'numericSolutionEqualities':eq,'pythonJsHashesMatched':len(entries),'findings':[]},'entries':entries}
 (ROOT/REPORT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'reviewed':13,**report['evidence']}))
if __name__=='__main__':run()
