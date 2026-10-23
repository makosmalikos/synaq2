"""Prepare all captured collections with explicit per-question dispositions.
Source key + displayed solution are retained as provenance, not labelled independent proof.
Optional exact computation cross-checks supported numeric tasks.
"""
import sys,json,re,pathlib,unicodedata
from collections import Counter
from zerek_math import expression,display_statement,plain_tex,Unsupported
from review_zerek import model,canonical,plainvalue,mathparts
import sympy as S
ROOT=pathlib.Path(__file__).resolve().parent.parent;BASE=ROOT/'problems/sources/zerek'
def normalize(t):return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',t).lower()).strip()
def compact(t):return re.sub(r'[\s(){}$\\]+','',normalize(t)).replace('−','-').replace('·','*').replace('×','*')
def condition_key(text,image=None):return compact(text)+('|figure:'+image if image else '')
def source_key(q):
 if q.get('sourceAnswer'):return q['sourceAnswer']
 m=re.search(r'Дұрыс жауап:\s*(.+)',q.get('openAnswerText') or '')
 return m[1].strip() if m else None

def ratio_chain_checks(tex,prefix):
 """Check explicitly named numeric ratio tuples, never unlabelled division."""
 if not re.search(r'\b(?:қатынас(?:ы)?|отношени[еяию]|пропорционал(?:дық|ды|ьность|ьности|ьно))\s*[:—–-]?\s*$',prefix,re.I):return None
 parts=[]
 for side in tex.split('='):
  # A colon inside a fraction or parentheses belongs to that component.
  cells=[];start=0;depth=0
  for i,char in enumerate(side):
   if char in '({':depth+=1
   elif char in ')}':depth-=1
   elif char==':' and depth==0:cells.append(side[start:i]);start=i+1
  cells.append(side[start:]);parts.append(cells)
 if not any(len(cells)>=3 for cells in parts):return None
 if not 2<=len(parts)<=8 or any(len(cells)!=len(parts[0]) for cells in parts):return 0,[tex]
 try:
  values=[[expression(cell) for cell in cells] for cells in parts]
  # A zero/unknown component cannot supply an unambiguous finite coefficient.
  if any(v.free_symbols or v.is_real is not True or v.is_finite is not True or v.is_zero is not False for row in values for v in row):return 0,[tex]
 except (ValueError,TypeError,ZeroDivisionError,NotImplementedError):return 0,[tex]
 checked=0;contradictions=[]
 for left,right in zip(values,values[1:]):
  coefficient=S.simplify(left[0]/right[0])
  if all(S.simplify(a-coefficient*b)==0 for a,b in zip(left,right)):checked+=1
  else:contradictions.append(tex)
 return checked,contradictions

def solution_checks(solution,false_option=None,pi_approx=False):
 checked=0;contradictions=[]
 for match in re.finditer(r'\$([^$]+)\$',solution):
  tex=match[1]
  if false_option and compact(tex)==compact(false_option.strip('$')):continue
  parts=tex.split('=')
  if len(parts)<2 or len(parts)>8:continue
  ratio=ratio_chain_checks(tex,solution[:match.start()])
  if ratio is not None:
   checked+=ratio[0];contradictions.extend(ratio[1]);continue
  vals=[]
  for p in parts:
   try:
    v=expression(p)
    if pi_approx:v=v.subs(S.pi,S.Rational(str(pi_approx)))
    vals.append(v if not v.free_symbols else None)
   except (ValueError,TypeError,ZeroDivisionError,NotImplementedError):vals.append(None)
  for a,b in zip(vals,vals[1:]):
   if a is not None and b is not None:
    if S.simplify(a-b)!=0:contradictions.append(tex)
    else:checked+=1
 return checked,contradictions

def presentation_checks(q):
 count=0
 for text in [q['statement'],q.get('solution','')]+[o['text'] for o in q.get('options',[])]:
  for tex in mathparts(text):
   if len(tex)>250:continue
   try:
    before=expression(tex);after=expression(plain_tex(tex).replace(',','.'))
    if S.simplify(before-after)!=0:raise RuntimeError(f'mathematical presentation changes the value: {tex!r}: {before} -> {plain_tex(tex)!r}: {after}')
    count+=1
   except (ValueError,TypeError,ZeroDivisionError,NotImplementedError):pass
 return count

def build():
 old=json.loads((ROOT/'output/zerek-import/existing-bank.json').read_text())
 exact={condition_key(q['statement'],q.get('image')):q['id'] for q in old};seen=dict(exact)
 vectors={v['sourceUrl']:v for v in json.loads((BASE/'vector-manifest.json').read_text())['files']}
 tasks=[];records=[]
 for f in sorted((BASE/'collections').glob('*.json')):
  if '.partial.' in f.name:continue
  col=json.loads(f.read_text())
  for q in col['questions']:
   rec={'collection':f.stem,'number':q['number'],'sourceUrl':col['url'],'sourceTitle':col['title']}
   if f.stem=='363d41e1-3dae-4060-887e-6f6dff3efe96' and q['number'] not in (2,6,12,14):rec.update(status='previous_batch',note='21 tasks already active in first reviewed batch');records.append(rec);continue
   try:
    q=dict(q)
    if (f.stem,q['number'])==('df69ba92-b698-4cbe-a587-6468e21aeeb6',11):
     q['statement']=q['statement'].replace(':3x',':(3x)');rec['editorialChanges']=['Parenthesised the full divisor 3x; confirmed by source solution']
    if (f.stem,q['number'])==('52cb4a68-1feb-4e9d-af12-f086e89fe06c',34):
     q['solution']=q['solution'].replace('34\\,459\\,425','43\\,648\\,605');rec['editorialChanges']=['Corrected optional product check to 43648605; final digit remains 5']
    if (f.stem,q['number'])==('610373a9-a497-4f63-aef0-29ad2099fc49',2):
     total=11
     for add in range(7,15):
      q['solution']=q['solution'].replace(f'$+ {add} = {total+add}$',f'${total} + {add} = {total+add}$');total+=add
     rec['editorialChanges']=['Expanded cumulative addition shorthand into full equalities']
    if (f.stem,q['number'])==('8a0157c9-733b-4358-96f9-7679b92eb8d1',38):
     for pct in (85,15):q['solution']=q['solution'].replace(f'{pct}\\% = {pct} \\cdot 60\\,000',f'6\\,000\\,000 \\cdot \\frac{{{pct}}}{{100}} = {pct} \\cdot 60\\,000')
     rec['editorialChanges']=['Expressed percentages of 6000000 explicitly instead of equating a percentage to a currency amount']
    if (f.stem,q['number'])==('7d1f8732-e93b-4174-9f7c-8f167a7a117b',41):
     q['solution']=q['solution'].replace('«\\»','«╲»');rec['editorialChanges']=['Displayed diagonal orientation as Unicode without changing orientation']
    if (f.stem,q['number'])==('d9016273-d4b8-4762-87e3-cced63404826',9):
     q['solution']=q['solution'].replace('100 : 10 = 10\\%', '100\\% : 10 = 10\\%').replace('8\\cdot 10 = 80\\%', '8\\cdot 10\\% = 80\\%');rec['editorialChanges']=['Kept percent units on both sides of the explanatory equalities']
    if (f.stem,q['number'])==('29fc4bd4-c0f4-467a-b21f-fb2b0f07f1ed',6):
     # Source's optional 6.1 estimate was wrong. Boundary lengths give an exact obstruction.
     q['solution']=r"""Үлкен тіктөртбұрышты $5 \times 2$ деп аламыз. Әр бөліктің ауданы $10:6=\frac{5}{3}$.
$2 \times 3$ торға бөлгенде $15:4$ және $5:3$ қатынастары шығады. $1 \times 6$ торға бөлгенде $12:5$ қатынасы да мүмкін.
Ал $15:2$ қатынасы мүмкін емес. Кіші бөліктің қабырғалары $15k$ және $2k$ болса, $30k^2=\frac{5}{3}$, яғни $k^2=\frac{1}{18}$.
Үлкен тіктөртбұрыштың ұзындығы $5$ болатын шекарасы кіші бөліктердің толық қабырғаларынан тұрады. Онда кейбір теріс емес бүтін $m,n$ үшін $5=(15m+2n)k$ болуы керек.
Квадраттасақ, $(15m+2n)^2=450$. Бірақ $21^2=441<450<484=22^2$, сондықтан 450 бүтін санның квадраты емес. Қайшылық.
Жауабы: D) $15:2$."""
     rec['editorialChanges']=['Replaced incorrect 6.1 length estimate and fit argument with an exact integer boundary-length proof']
    if (f.stem,q['number'])==('a6618083-9ac6-4f01-a8c9-f99928e33caf',9):
     q['statement']=q['statement'].replace('Әрбір $4$ жыл сайын $366$ күндік кібісе жыл келеді. Келесі кібісе жыл — $2024$ жыл.', '$2024$ жыл — $366$ күндік кібісе жыл.');rec['editorialChanges']=['Stated 2024 as a historical given instead of calling it the next leap year']
    if f.stem=='77690ed0-6d1e-49d5-b254-07c874bd8690' and q['number'] in (29,30,31):
     q['statement']=re.sub(r'\$\\begin\{array\}.*?\\end\{array\}\$', 'Фигуралар: 1, 2, 3, 4.\nТаяқшалар саны: 3, 7, 10, 14.', q['statement'],flags=re.S);rec['editorialChanges']=['Rendered the source table as two readable labelled rows']
    if not col.get('sourceReviewCaptured'):raise Unsupported('source solution not captured yet')
    image=None
    if q.get('images'):
     if len(q['images'])!=1:raise Unsupported('multiple diagrams need layout review')
     vector=vectors.get(q['images'][0]['src'])
     if not vector or not (ROOT/'frontend/public'/vector['image'].lstrip('/')).exists():raise Unsupported('figure requires reconstruction/review')
     image=vector['image'];rec['figureMethod']=vector['method']
     q['statement']=re.sub(r'\[Image:[^\]]*\]','',q['statement']).strip()
    if '[SVG diagram]' in q['statement'] or any('[SVG diagram]' in o['text'] for o in q.get('options',[])):raise Unsupported('figure placeholder')
    if (f.stem,q['number'])==('519d9601-52f3-4921-a641-97727807c89a',32):
     # The source's selected option was empty, but its solution unambiguously gives >.
     q['sourceAnswer']='>';q['options']=[dict(o,text='>' if o.get('correct') else o['text']) for o in q['options']]
     rec['editorialChanges']=['Restored missing greater-than glyph; independently verified 14726 > 14725']
    presentation= presentation_checks(q)
    st=display_statement(q['statement']);sol=display_statement(q.get('solution',''))
    key=source_key(q)
    if not key:raise Unsupported('missing source key')
    if len(sol)<30:raise Unsupported('missing detailed source solution')
    options=[display_statement(o['text']) for o in q.get('options',[])] or None
    answer=display_statement(key)
    tail=re.split(r'Жауабы\s*:',q['solution'])[-1] if re.search(r'Жауабы\s*:',q['solution']) else None
    if tail:
     labelled=re.match(r'\s*\$?([A-EАВСДЕ])\)',tail)
     correct_label=next((o.get('label','')[:1] for o in q.get('options',[]) if o.get('correct')),None)
     if labelled and correct_label and labelled[1].translate(str.maketrans('АВСДЕ','ABCDE'))!=correct_label.translate(str.maketrans('АВСДЕ','ABCDE')):raise Unsupported('source final answer label disagrees with key')
    if options and (options.count(answer)!=1 or len(set(options))!=len(options)):raise Unsupported('invalid choices/key')
    if any('\\' in v or '$' in v for v in [st,sol,answer]+(options or [])):raise Unsupported('math notation needs presentation review')
    if any(x in st for x in ['[SVG','[Image']):raise Unsupported('figure placeholder')
    if len(st)<15:raise Unsupported('incomplete condition')
    ck=condition_key(st,image)
    if ck in seen:
     rec.update(status='duplicate',duplicateOf=seen[ck]);records.append(rec);continue
    pi_given=re.search(r'\\pi\s*=\s*(3(?:[.,]\d+)?)',q['statement'])
    pi_value=pi_given[1].replace(',','.') if pi_given else '3.14' if '\\pi' in q['statement'] and 'жүздік' in q['statement'] else None
    checked,contradictions=solution_checks(q['solution'],key if 'қате' in q['statement'] else None,pi_value)
    if '* b' in q['statement'] and 'амалы' in q['statement']:contradictions=[t for t in contradictions if '*' not in t]
    if (f.stem,q['number']) in [('8f79c857-eb91-4aa3-a241-d7d724177d05',7),('ce7fe94f-f247-4af4-9701-725e04eac1ba',8)]:contradictions=[t for t in contradictions if t not in ('0 = 6','-6=1','-x + x = 6')]
    # Source explicitly describes a remainder / factorial count: write floor division accurately.
    quotient_fixes={('29fc4bd4-c0f4-467a-b21f-fb2b0f07f1ed',3):['999 : 54 = 18'],('eb1f6d1f-d715-4be5-b241-f3a8e3459746',9):['400510 : 10\\,000 = 40','510 : 100 = 5'],('f7d9e838-1461-4a96-a022-1e6c267c7511',19):['64 : 5 = 12'],('f7d9e838-1461-4a96-a022-1e6c267c7511',20):['109 : 5 = 21']}
    fixes=quotient_fixes.get((f.stem,q['number']),[])
    for eq in fixes:
     if eq in contradictions:
      l,r=eq.split('=');sol=sol.replace(display_statement('$'+eq+'$'),'⌊'+display_statement('$'+l.strip()+'$')+'⌋ = '+r.strip());contradictions.remove(eq)
    if fixes:rec['editorialNote']='Explicit floor notation for the integer quotient used in source remainder/factorial counting'
    if 'қалдық' in q['solution'] or 'нөлмен' in q['statement']:
     for eq in list(contradictions):
      terms=eq.split('=')
      if len(terms)==2:
       try:
        lhs,rhs=expression(terms[0]),expression(terms[1])
        if not lhs.free_symbols and rhs.is_Integer and S.floor(lhs)==rhs:
         sol=sol.replace(display_statement('$'+eq+'$'),'⌊'+display_statement('$'+terms[0].strip()+'$')+'⌋ = '+terms[1].strip());contradictions.remove(eq);rec.setdefault('editorialChanges',[]).append('Clarified integer quotient with floor notation in source remainder counting')
       except (ValueError,TypeError,ZeroDivisionError,NotImplementedError):pass
    if contradictions:rec.update(contradictions=contradictions);raise Unsupported('source solution arithmetic conflict')
    method='source key and detailed solution; machine-checked explicit arithmetic where supported'
    independently=False
    try:
     a,topic,_,computed_solution=model(q)
     kp=mathparts(key)
     assignment=re.fullmatch(r'[A-Za-z]\s*=\s*([1-9]\d*)',answer)
     if assignment:ka=S.Integer(assignment[1])
     elif len(kp)==1 and not re.sub(r'\$[^$]+\$','',key).strip():ka=expression(kp[0])
     elif re.fullmatch(r'-?\d+(?:[.,]\d+)?(?:/\d+)?',answer):ka=expression(answer.replace(',','.'))
     else:ka=None
     if ka is not None:
      if S.simplify(a-ka)!=0:rec.update(computed=canonical(a),sourceKey=key);raise RuntimeError('source answer disagrees with exact computation')
      independently=True;method='independent exact computation matches source key; source detailed solution retained'
    except (Unsupported,ValueError,TypeError,ZeroDivisionError,NotImplementedError):pass
    if independently and options:
     equivalent=0
     for option in q['options']:
      parts=mathparts(option['text'])
      try:
       value=expression(parts[0]) if len(parts)==1 and not re.sub(r'\$[^$]+\$','',option['text']).strip() else expression(option['text'].replace(',','.')) if re.fullmatch(r'-?\d+(?:[.,]\d+)?(?:/\d+)?',option['text']) else None
       if value is not None and S.simplify(value-a)==0:equivalent+=1
      except (ValueError,TypeError,ZeroDivisionError,NotImplementedError):pass
     if equivalent>1:raise Unsupported('multiple mathematically equivalent choices')
    school={'NIS':'НИШ','BIL':'БИЛ','RFMSH':'РФМШ','PREP':'РФМШ'}[col['school']]
    practice_only=False
    if school=='РФМШ':
     # Both grade 4/5 olympiad and prep tasks can train the same prerequisite topics;
     # they are attributed to their source and never called official RFMSH exam tasks.
     ap=mathparts(key)
     try:
      assignment=re.fullmatch(r'[A-Za-z]\s*=\s*([1-9]\d*)',answer)
      v=S.Integer(assignment[1]) if assignment else expression(ap[0]) if len(ap)==1 else expression(answer) if re.fullmatch(r'[1-9]\d*',answer) else None
      if v is None or not v.is_Integer or v<=0:raise Unsupported('practice format')
      answer=str(v);options=None
     except (Unsupported,ValueError,TypeError,ZeroDivisionError,NotImplementedError):
      # Preserve source choices for olympiad practice; do not change what is asked
      # merely to force fractions, times or symbolic answers into a mock exam.
      practice_only=True
      if not options:raise Unsupported('open nonnumeric answer needs grading adaptation')
    subject='logic' if col['school']=='BIL' and re.search(r'Сан тізбектері|фигурадағы|Кестедегі|Фигуралар|Крипт|Ерекше|Кеңістіктік|Санау және ойлау',col['title']) else 'math'
    task={'id':f'zerek_{f.stem}_{q["number"]:02d}','school':school,'subject':subject,'lang':'kk','statement':st,'answer':answer,'options':options,'solution':sol,'source':f'Zerek · {col["title"]} · №{q["number"]}; source key/solution reviewed','sourceUrl':col['url'],'sourceNumber':q['number']}
    if image:task['image']=image
    if practice_only:task['practiceOnly']=True;rec['practiceOnly']=True
    if subject=='logic':task['topic']='seq' if 'Сан тізбектері' in col['title'] else 'mtx'
    tasks.append(task);seen[ck]=task['id']
    rec.update(status='ready',id=task['id'],method=method,independentlyComputed=independently,explicitArithmeticChecks=checked,presentationChecks=presentation)
   except RuntimeError as e:rec.update(status='needs_review',reason=str(e))
   except (Unsupported,ValueError,TypeError,ZeroDivisionError,NotImplementedError) as e:rec.update(status='needs_review',reason=str(e))
   records.append(rec)
 out=ROOT/'output/zerek-import';(out/'ready-tasks.json').write_text(json.dumps(tasks,ensure_ascii=False,indent=2)+'\n')
 (BASE/'import-dispositions.json').write_text(json.dumps({'date':'2026-10-22','records':records},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'questions':len(records),'ready':len(tasks),'independent':sum(r.get('independentlyComputed',False) for r in records),'statusCounts':dict(Counter(r['status'] for r in records)),'reasons':dict(Counter(r.get('reason') for r in records if r['status']=='needs_review'))},ensure_ascii=False,indent=2))
if __name__=='__main__':build()
