"""22frozen nonvisual calendar/clock occurrences. Full saved and new conditions,
full official and new solutions and every MCQ read. Exact independent printed-input
computation by same root author; no separate human/agent reviewer claimed.
Weekday steps/month enumeration/date objects/time tick timelines/Fraction clock
rates used, not author JS specs/params as answer oracle. Numerical variants not
semantic uniqueness. Source18/19/23 images are handled in the separate figure batch.
"""
import calendar,copy,datetime,hashlib,importlib.util,json,re,subprocess,sys
from fractions import Fraction as F
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];NAME='collection-calendar';BATCH=f'problems/editorial/batches/{NAME}.json';REPORT=f'problems/editorial/reviews/{NAME}.json'
sp=importlib.util.spec_from_file_location('bil9check',ROOT/'scripts/editorial/review-collection-bil9-nonvisual.py');H=importlib.util.module_from_spec(sp);sp.loader.exec_module(H)
one=H.one;W=['Дүйсенбі','Сейсенбі','Сәрсенбі','Бейсенбі','Жұма','Сенбі','Жексенбі'];pattern='|'.join(w.lower()for w in W)
ns=lambda s:list(map(int,re.findall(r'\d+',s)))
def day(s):return W.index(one(re.findall(pattern,s.lower())).capitalize())
def anchor(s):return W.index(re.search(pattern,s.lower())[0].capitalize())
def clock_minutes(s):return[60*int(h)+int(m)for h,m in re.findall(r'(\d{1,2}):(\d{2})',s)]
def clock(n):assert F(n).denominator==1;h,m=divmod(int(n)%1440,60);return f'{h:02d}:{m:02d}'
def step_week(start,delta):
 d=start
 for _ in range(abs(delta)):d=(d+(1 if delta>=0 else-1))%7
 return W[d]
def pick(r,out):
 os=[o['text']if isinstance(o,dict)else o for o in r.get('options')or[]]
 assert str(out)==r['answer'],(out,r['answer'])
 if os:assert os.count(str(out))==1
 return str(out)
def rate(s):return int(re.search(r'(?:әр сағат сайын|әр 60 минутында)\s*\$?(\d+)',s)[1])
def solve(r,i,source=False):
 s=r['statement'];numbers=ns(s);clocks=clock_minutes(s);proof={};out=None
 if i in{1,2,11}:
  days=one(numbers);direction=-1 if'бұрын'in s else 1;assert direction==(-1 if i==11 else 1);out=step_week(anchor(s),direction*days);proof['walkedCalendarDays']=direction*days
 elif i in{3,4}:
  first,target=numbers;assert first==1;out=step_week(anchor(s),target-first);proof['elapsedNotInclusiveDateDifference']=target-first
 elif i in{5,6}:
  a,b=numbers;overlaps=[k for k in range(1,a*b+1)if k%a==0 and k%b==0];out=str(overlaps[0]);proof['allCommonDaysThroughProductBound']=overlaps
 elif i in{7,8}:
  start=one(clocks);lesson,pause,count=ns(re.sub(r'\d{1,2}:\d{2}','',s));cursor=start;timeline=[]
  for k in range(count):
   end=cursor+lesson;timeline.append(['lesson',k+1,clock(cursor),clock(end)]);cursor=end
   if k<count-1:timeline.append(['break',k+1,clock(cursor),clock(cursor+pause)]);cursor+=pause
  out=clock(cursor);assert len([x for x in timeline if x[0]=='break'])==count-1;proof['everyLessonAndBetweenLessonBreak']=timeline
 elif i in{9,10}:
  start,end=clocks;assert'келесі'in s
  departure=datetime.datetime(2024,1,1)+datetime.timedelta(minutes=start);arrival=datetime.datetime(2024,1,2)+datetime.timedelta(minutes=end);out=str(int((arrival-departure).total_seconds()//60));proof['datetimeElapsedMinutes']=out
 elif i in{12,13}:
  phrase=one(re.findall('«([^»]+)»',s));back=len(re.findall('кешегі',phrase.lower()));forward=len(re.findall('ертеңгі',phrase.lower()));assert(back,forward)==((2,0)if i==12 else(1,2));out=step_week(anchor(s),forward-back);proof['parsedRelativeDaySteps']={'back':back,'forward':forward}
 elif i==14:
  period,repeated,count=numbers;assert period==repeated;dates=[k*period for k in range(count)];out=step_week(anchor(s),dates[-1]);proof['allDutyOffsets']=dates
 elif i in{15,16}:
  per_hour=rate(s);start,target=clocks;sign=-1 if 'қалып'in s else 1;elapsed=target-start;assert elapsed>=0;shown=F(start)
  for _ in range(elapsed):shown+=F(60+sign*per_hour,60)
  out=clock(shown);proof.update(actualElapsedMinutes=elapsed,exactShownMinutes=str(shown),ratePerTrueMinute=str(F(60+sign*per_hour,60)))
  if source:proof['sourceQualification']='Official solution interprets each hour as one true hour; rewrite explicitly defines per60actualminutes.'
 elif i==17:
  mins=one(clocks);h,m=divmod(mins,60);minuteTurn=F(m,60);hourTurn=F((h%12)*60+m,720);diff=abs(minuteTurn-hourTurn);small=min(diff,1-diff);degrees=small*360;assert degrees.denominator==1;out=str(int(degrees));proof['exactFullCircleTurns']={'minute':str(minuteTurn),'hour':str(hourTurn),'smallerDifference':str(small)}
 elif i==20:
  offset=numbers[0];depart=clocks[-1];clean=s.replace('$','');hours,minutes=map(int,one(re.findall(r'(\d+)\s*сағат\s*(\d+)\s*минут',clean)));elapsed=hours*60+minutes
  assert'алда'in s;localBdeparture=depart-offset*60;out=clock(localBdeparture+elapsed);proof['sameInstantLocalTimeline']={'Adepart':clock(depart),'Bdepart':clock(localBdeparture),'Barrival':out,'flightMinutes':elapsed}
 elif i==21:
  target=one(numbers);wanted=anchor(s);possibilities=[]
  for monthLength in range(28,32):
   for firstWeekday in range(7):
    dates=[d for d in range(1,monthLength+1)if(firstWeekday+d-1)%7==wanted]
    if sum(d%2==0 for d in dates)==3:possibilities.append({'monthLength':monthLength,'firstWeekday':firstWeekday,'specifiedWeekdayDates':dates,'targetWeekday':W[(firstWeekday+target-1)%7]})
  out=one(set(p['targetWeekday']for p in possibilities));proof['all28MonthConfigurationsChecked']=True;proof['allCompatibleMonthConfigurations']=possibilities
 elif i==22:
  per_hour=rate(s);start,shown=clocks;elapsed=shown-start;assert elapsed>0
  candidates=[t for t in range(1440-start)if F(t*(60+per_hour),60)==elapsed];true_elapsed=one(candidates);out=clock(start+true_elapsed);proof['onlySameDayExactClockRateSolution']={'actualElapsedMinutes':true_elapsed,'shownElapsedMinutes':elapsed,'ratePerRealMinute':str(F(60+per_hour,60))}
  if source:proof['sourceQualification']='Official solution assumes first same-day reading; no date or wrap count in source. Rewrite explicitly says same day evening.'
 elif i in{24,25}:
  leap='Кібісе емес'not in s;start=anchor(s);year=next(y for y in range(2000,2400)if calendar.isleap(y)==leap and datetime.date(y,1,1).weekday()==start);first=datetime.date(year,1,1);last=datetime.date(year,12,31);out=W[last.weekday()];proof['wholeGregorianYearWitness']={'year':year,'leap':leap,'elapsedDays':(last-first).days,'first':W[first.weekday()],'last':out}
 else:raise AssertionError(i)
 proof['answer']=pick(r,out);return proof

def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def mutation(r,i):
 b=copy.deepcopy(r);s=b['statement'];pairs={1:('19 күн','20 күн'),2:('31 күн','32 күн'),3:('18 нөмірлі','19 нөмірлі'),4:('23 нөмірлі','24 нөмірлі'),5:('әр 8 күн','әр 10 күн'),6:('әр 7 күн','әр 8 күн'),7:('09:20','09:21'),8:('11:15','11:16'),9:('19:45','19:46'),10:('21:10','21:11'),11:('158 күн','159 күн'),12:('сейсенбі','сәрсенбі'),13:('жұма','сенбі'),14:('әр 5 күн','әр 6 күн'),15:('3 минутқа','4 минутқа'),16:('4 минутқа','5 минутқа'),17:('07:20','07:22'),20:('3 сағат алда','4 сағат алда'),21:('13 нөмірлі','14 нөмірлі'),22:('18:44','18:45'),24:('дүйсенбі','сейсенбі'),25:('сенбі','жексенбі')};a,c=pairs[i];assert a in s;b['statement']=s.replace(a,c,1);return b

def main():
 rows=json.loads((ROOT/BATCH).read_text())['editions'];assert len(rows)==22;entries=[];evidence=[];canaries=0;equalities=0;missing=0
 for r in rows:
  ref=one(r['sourceRefs']);i=int(ref['sourceId']);q=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions']if q['number']==i);assert i not in{18,19,23}and not q['images']and not q['svg']and q['solution']
  if q['sourceAnswer']is None:missing+=1;assert not q['options'];official=one(re.findall(r'Жауабы:\s*(\d+)',q['solution']))
  else:official=q['sourceAnswer'];assert one(o['text']for o in q['options']if o['correct'])==official and len(q['options'])==4
  try:original=solve({**q,'answer':official},i,True)
  except Exception as e:raise AssertionError(('SOURCE',i))from e
  try:proof=solve(r,i)
  except Exception as e:raise AssertionError(('REWRITE',i))from e
  assert r['minimumPlan']=='pro'and r['grade']==5 and r['statement']!=q['statement']and not r.get('image')and not re.search(r'[\\$]',r['statement']+r['solution'])
  if q['options']:assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(r['answer'])==1
  else:assert'options'not in r and re.fullmatch(r'\d+',r['answer'])
  for m in re.finditer(r'(?<![A-Za-z0-9])(-?\d+(?:[,.]\d+)?(?:\s*[+−×÷]\s*-?\d+(?:[,.]\d+)?)+)\s*=\s*(-?\d+(?:[,.]\d+)?)(?!\d|\s*[+−×÷*/A-Za-z])',r['solution']):
   before=r['solution'][:m.start()].rstrip()
   if before and(before[-1]in'0123456789()+−×÷*/-'or before[-1].isascii()and before[-1].isalpha()):continue
   assert H.calc(m[1])==F(m[2].replace(',','.')),('numeric solution equality',i,m.group());equalities+=1
  if i in{12,13}:
   equation=one(re.findall(r'Жалпы ығысу ([^.]+)\.',r['solution']));left,right=equation.split('=');assert H.calc(left)==H.calc(right);equalities+=1
  bad=copy.deepcopy(r);bad['answer']='INVALID_KEY'
  try:solve(bad,i)
  except(AssertionError,ValueError):pass
  else:raise AssertionError(('wrongkeyaccepted',i))
  try:solve(mutation(r,i),i)
  except(AssertionError,ValueError):canaries+=1
  else:raise AssertionError(('semanticcanaryaccepted',i))
  evidence.append({'editionId':r['editionId'],'savedSource':original,'rewritten':proof});entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'root_separate_computational_check_same_author','method':'read complete source/new conditions, full solutions and allMCQs; exact day walks, date differences, full duty/lesson/break timelines, datetime overnight and Gregorian-year witnesses, exhaustive all28month configurations, Fraction real-time clock ticks/inverse uniqueness and exact circle turns; same author, no separate human review','notes':[json.dumps(proof,ensure_ascii=False)]})
 js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';const rows=JSON.parse(fs.readFileSync('"+BATCH+"')).editions;console.log(JSON.stringify(rows.map(r=>[r.editionId,editionHash(r)])));"
 hashes=dict(json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True)));assert all(hashes[e['editionId']]==e['sha256']for e in entries)
 summary={'verified':22,'sourceKeysNotCaptured':missing,'allSourceNewConditionsFullSolutionsEveryMCQRead':22,'targetSpecificModels':len(set(r['modelId']for r in rows)),'wrongKeysRejected':22,'printedSemanticCanariesRejected':canaries,'printedSolutionEqualitiesVerified':equalities,'pythonJavaScriptHashesMatched':22,'separateHumanReviewer':False}
 if'--write'in sys.argv:(ROOT/REPORT).write_text(json.dumps({'schemaVersion':1,'reviewer':'root_separate_computational_check_same_author','scope':__doc__,'summary':summary,'evidence':evidence,'entries':entries},ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(summary))
if __name__=='__main__':main()
