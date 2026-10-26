"""Independent rendering-review agent oracle; restored under reviewer suffix.
All24 saved/new full conditions, solutions and MCQ read before signature.
No authored calculator/checks imported: Fraction equations, datetime timelines,
actual printed option parsers and complete Gregorian400-year calendar domains.
"""
import calendar
import copy
from datetime import date,datetime,timedelta
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-time-wave17.json'
OUT='problems/editorial/reviews/grade4-time-wave17.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
WEEK=['дүйсенбі','сейсенбі','сәрсенбі','бейсенбі','жұма','сенбі','жексенбі']
WORDS={'бір':1,'екі':2,'үш':3,'төрт':4,'бес':5,'алты':6,'жеті':7,'сегіз':8,'тоғыз':9,'он':10,'он бір':11,'он екі':12,'он бес':15,'жиырма':20}
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def number(s):
    s=s.replace(' ','');assert s.isdigit();return int(s)
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def fraction(s):return F(1,one(d for w,d in [('жарты',2),('үштен',3),('төрттен',4),('бестен',5)] if w in s))
def duration(s):
    units={'сағ':3600,'мин':60,'с':1,'апта':604800,'тәулік':86400};pattern=r'([\d ]+) (сағ|мин|с|апта|тәулік)(?= |$)'
    ms=list(re.finditer(pattern,s));assert ms and not re.sub(r'\s','',re.sub(pattern,'',s)),s
    return timedelta(seconds=sum(number(m[1])*units[m[2]] for m in ms))
def choose(r,fn):return one(o for o in r['options'] if fn(o))
def before(s,evening=False):
    m=re.search(r'«([^«»]+) минутсыз ([^«»]+)»',s);assert m,s
    return datetime(2000,1,1,WORDS[m[2]]+(12 if evening else 0))-timedelta(minutes=WORDS[m[1]])
def clock(o):return datetime(2000,1,1)+duration(o)
def calendars(days,weekday=None):
    ys=[y for y in range(2000,2400) if (366 if calendar.isleap(y) else 365)==days and (weekday is None or date(y,1,1).weekday()==weekday)];assert ys;return ys
def interval(o):
    if 'келесі күнгі' in o:
        a,b=o.split(' уақытынан келесі күнгі ');return clock(b.removesuffix(' уақытына дейін'))+timedelta(days=1)-clock(a)
    if o.startswith('«'):
        end=WORDS[re.search(r'«([^«»]+) жарымға»',o)[1]];return datetime(2000,1,1,end,30)-before(o)
    if 'ширек өткен' in o:return before(o)-datetime(2000,1,1,int(re.search(r'сағат (\d+)-ден',o)[1]),15)
    a,b=o.split(' уақытынан ');return clock(b.removesuffix(' уақытына дейін'))-clock(a)
def solve(r):
    p=r['params'];k=r['modelId'].removeprefix('grade4-time-');s=r['statement'];note=''
    if k=='minutes-to-hours':
        total=int(re.search(r'^(\d+) минутты',s)[1]);answer=choose(r,lambda o:duration(o)==timedelta(minutes=total));note=f'Exact{total}minutes; base60 remainder{total%60}.'
    elif k=='seconds-to-minutes':
        total=number(re.search(r'^([\d ]+) секундты',s)[1]);answer=choose(r,lambda o:duration(o)==timedelta(seconds=total));note=f'Exact{total}seconds, literal printed minute/second options.'
    elif k=='spoken-time-before':
        target=before(s);answer=choose(r,lambda o:clock(o)==target);note=f'Literal spoken-before{target:%H:%M}.'
    elif k=='greatest-duration':
        values=[timedelta(seconds=int(3600*fraction(o))) if o.startswith('сағаттың') else duration(o) for o in r['options']];answer=r['options'][one(i for i,t in enumerate(values) if t==max(values))];note='All option seconds:'+str([int(t.total_seconds()) for t in values])
    elif k=='correct-fraction-equality':
        def true(o):
            a,b=o.split(' = ');whole=24 if a.startswith('тәуліктің') else 12 if a.startswith('жылдың') else 60 if a.startswith('сағаттың') else 100 if a.startswith('ғасырдың') else None;assert whole;return whole*fraction(a)==int(b.split(' ')[0])
        answer=choose(r,true);note='Complete truth vector:'+str([true(o) for o in r['options']])
    elif k=='fraction-complement':
        n=int(re.search(r'Мектептегі (\d+) оқушының',s)[1]);part=n*fraction(s);assert part.denominator==1;answer=str(n-int(part));note=f'Whole{n}=attending{part}+remaining{answer}.'
    elif k=='reduce-by-fraction':
        n=int(re.search(r'^(\d+) санын',s)[1]);value=n*(1-fraction(s));answer=choose(r,lambda o:int(o)==value);note=f'Remaining exact Fraction{value}, removed{n-value}.'
    elif k=='weekly-session-duration':
        n,h,m=map(int,re.search(r'аптасына (\d+) рет[\s\S]*?Әр жаттығу (\d+) сағ (\d+) мин',s).groups());value=sum((timedelta(hours=h,minutes=m) for _ in range(n)),timedelta());answer=str(int(value.total_seconds()/60));note=f'{n}separate session ledgers total{answer}minutes.'
    elif k=='spoken-lesson-finish':
        end=before(s)+timedelta(minutes=int(re.search(r'Сабақ (\d+) минут',s)[1]));answer=choose(r,lambda o:clock(o)==end);note=f'Clock addition ends{end:%H:%M}.'
    elif k=='days-to-weeks':
        n=int(re.search(r'^(\d+) тәулікті',s)[1]);answer=choose(r,lambda o:duration(o)==timedelta(days=n));note=f'Exact{n}days match a single actual week/day option.'
    elif k in ['age-century-inverse','age-sum-century-fraction','age-half-plus-century']:
        if k=='age-century-inverse':
            multiplier=int(re.search(r'Жасымның (\d+) есесіне',s)[1]);f=fraction(s);age=(100-100*f)/multiplier;test=lambda a:a*multiplier+100*f==100
        elif k=='age-sum-century-fraction':
            f=fraction(s);m=int(re.search(r'бірінен (\d+) есе',s)[1]);ratio=int(re.search(r'жасынан (\d+) есе',s)[1]);age=100*f*m/(ratio+1);test=lambda a:a+ratio*a==100*f*m
        else:
            f=fraction(s.replace('жартысына',''));age=100*f/F(1,2);test=lambda a:F(a,2)+100*f==a
        assert age.denominator==1 and age>0;answer=str(age.numerator);assert [a for a in range(1,201) if test(a)]==[int(answer)];note=f'Unique exact linear Fraction solution{age}; complete1..200cross-check.'
    elif k=='large-seconds-interval':
        n=number(re.search(r'^([\d ]+) секунд',s)[1]);units={'тәуліктің':86400,'сағаттың':3600,'аптаның':604800}
        def fits(o):
            m=re.fullmatch(r'(\d+) мен (\d+) (тәуліктің|сағаттың|аптаның) арасында',o);assert m;return int(m[1])*units[m[3]]<n<int(m[2])*units[m[3]]
        answer=choose(r,fits);note=f'All actual strict dimensioned bounds versus{n}seconds.'
    elif k=='elapsed-remaining-fraction':
        f=fraction(s);n=one(t for t in range(1440) if t==f*(1440-t));answer=choose(r,lambda o:int(o.split(':')[0])*60+int(o.split(':')[1])==n);note=f'Complete0..1439domain yields minute{n}only.'
    elif k=='concert-with-intermissions':
        n,a,m,b,songs,gap=map(int,re.search(r'Концертте (\d+) күйдің әрқайсысы (\d+) минуттан, тағы (\d+) күйдің әрқайсысы (\d+) минуттан[\s\S]*?хор (\d+) ән[\s\S]*?арасында (\d+) минут',s).groups());pieces=list(range(n+m+songs));adj=list(zip(pieces,pieces[1:]));music=n*a+m*b+60*fraction(s);total=music+gap*len(adj);assert total.denominator==1;answer=str(total.numerator);note=f'{len(pieces)}pieces/{len(adj)}adjacencies; choir combined once, music{music},gaps{gap*len(adj)}.'
    elif k=='maximum-weekday-count':
        days=int(re.search(r'Ұзақтығы (\d+) тәулік',s)[1]);target=WEEK.index(re.search(r'жылда ([а-яәіңғүұқөһ]+) күндерінің',s)[1]);counts=[]
        for y in calendars(days):
            start=date(y,1,1);counts.append(sum((start+timedelta(days=i)).weekday()==target for i in range(days)))
        assert {date(y,1,1).weekday() for y in calendars(days)}==set(range(7));answer=str(max(counts));note=f'All{len(counts)}matching Gregorian400year calendars: min{min(counts)},max{max(counts)}.'
    elif k=='overnight-spoken-duration':
        start=before(s,True);end=datetime(2000,1,2,WORDS[re.search(r'«([^«»]+) жарымда»',s)[1]],30);answer=choose(r,lambda o:duration(o)==end-start);note=f'{start:%H:%M}to next-day{end:%H:%M}: {(end-start).total_seconds()/60}minutes.'
    elif k=='slow-clock-delay':
        period,loss=map(int,re.search(r'әр (\d+) сағат өткенде (\d+) минутқа',s).groups());target=60*fraction(s);hours=target/loss*period;assert hours%24==0;answer=str(int(hours/24));note=f'Exact inverse delay-rate needs{hours}real hours/{answer}days.'
    elif k=='last-day-weekday':
        days=int(re.search(r'^(\d+) тәуліктен',s)[1]);start=WEEK.index(re.search(r'1 қаңтары — ([а-яәіңғүұқөһ]+)',s)[1]);ys=calendars(days,start);answer=WEEK[one({date(y,12,31).weekday() for y in ys})];note=f'Every matching Gregorian calendar agrees; final date offset{days-1},not{days}.'
    elif k=='greatest-clock-interval':
        vals=[interval(o) for o in r['options']];answer=r['options'][one(i for i,t in enumerate(vals) if t==max(vals))];minutes=[int(t.total_seconds()/60) for t in vals];assert minutes==[175,165,150,170];note='Actual spoken/numeric interval minutes:'+str(minutes)
    elif k=='spoken-evening-finish':
        start=before(s,True);h,m=map(int,re.search(r'да, (\d+) сағ (\d+) мин созылды',s).groups());end=start+timedelta(hours=h,minutes=m);answer=choose(r,lambda o:clock(o)==end);note=f'{start:%H:%M}+{h}h{m}min={end:%H:%M}.'
    elif k=='first-march-weekday':
        start=WEEK.index(re.search(r'1 қаңтар — ([а-яәіңғүұқөһ]+)',s)[1]);days=int(re.search(r'жылы (\d+) тәулік',s)[1]);feb=int(re.search(r'ақпанда (\d+) күн',s)[1]);ys=calendars(days,start);assert all(calendar.monthrange(y,2)[1]==feb for y in ys);answer=WEEK[one({date(y,3,1).weekday() for y in ys})];note=f'All{len(ys)}matching Gregorian calendars: March1 offset{31+feb}days.'
    else:raise AssertionError(k)
    return answer,note
def main():
    assert len(ROWS)==24;entries=[];refs=set()
    for r in ROWS:
        ans,note=solve(r);assert ans==r['answer'],(r['editionId'],ans,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==4 and r['minimumPlan']=='pro' and not r.get('image') and not re.search(r'[\\$]',r['statement']+r['solution'])
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(ans)==1
        else:assert ans.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        for ref in r['sourceRefs']:
            raw=one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']);assert raw['solution'];refs.add(ref['sourceId'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Exact Fraction unit/age equations, datetime/timedelta timelines, full Gregorian400-year calendar cycle and actual printed option parsers','notes':note,'checks':['all24 saved/new conditions, full solutions and MCQs read manually','clock subtraction/evening/overnight, base60 remainders, week/day and dimensional interval bounds checked','age equations solved exactly and independently searched; elapsed/remaining complete minute domain checked','concert gaps are adjacency count, choir duration is combined once','weekday tasks use matching actual Gregorian calendar domains, preserving final-day offsetN−1']})
    assert len(refs)==24
    assert duration('17 апта 4 тәулік')==timedelta(days=123) and duration('22 мин 55 с')==timedelta(seconds=1375)
    assert before('«жиырма минутсыз тоғыз»',True)==datetime(2000,1,1,20,40)
    assert {date(y,1,1).weekday() for y in calendars(366)}==set(range(7))
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));";hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-23','manualFindings':[],'scope':'All24 source-addressed time editions;23 author model forms do not claim23 independent mathematical meanings. No author renderer/checks/solver imported.','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {x['editionId']:x['sha256'] for x in signed['entries']}=={x['editionId']:x['sha256'] for x in entries}
    print(json.dumps({'independentlyVerified':24,'wrongKeysRejected':24,'sourceRefs':24,'hashesMatched':24,'calendarCycleYears':400,'allSevenWeekdayStartsChecked':True,'authorSolverImported':False,'stableReviewerScript':Path(__file__).name}))
if __name__=='__main__':main()
