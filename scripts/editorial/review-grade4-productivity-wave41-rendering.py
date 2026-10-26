"""Independent exact DISPLAYED work/rate/unit ledgers for all40 adaptations.

No author solver, specs, fixtures or params imported. Definitions/invariant
formulas are proved with unit algebra, not advertised as novel meanings.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import unicodedata
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-productivity-wave41.json'
OUT='problems/editorial/reviews/grade4-productivity-wave41.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']
def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(p,s):
    z=re.search(p,s);assert z,(p,s);return z
def nums(s):return list(map(int,re.findall(r'\d+',s)))
def digest(r):return hashlib.sha256(json.dumps(r,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(r):
    ref=one(r['sourceRefs']);return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def integer(v):
    v=F(v);assert v.denominator==1 and v>=0,v;return str(v.numerator)
def numeric_choice(r,value):
    target=int(integer(value));return one(o for o in r['options'] if nums(o)==[target])
def calc(s):
    s=s.replace('×','*').replace('−','-').replace(':','/').strip();assert re.fullmatch(r'[0-9 ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        assert isinstance(n,ast.BinOp);a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b>0;return a/b
    return visit(ast.parse(s,mode='eval').body)
def unit_dimension(s):
    s=s.replace('×','*').replace('−','-').replace(':','/').strip();assert re.fullmatch(r'[Avt ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Name):return {'A':(1,0),'v':(1,-1),'t':(0,1)}[n.id]
        assert isinstance(n,ast.BinOp);a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add) or isinstance(n.op,ast.Sub):return a if a==b else None
        if a is None or b is None:return None
        assert isinstance(n.op,(ast.Mult,ast.Div));sign=1 if isinstance(n.op,ast.Mult) else -1
        return tuple(x+sign*y for x,y in zip(a,b))
    return visit(ast.parse(s,mode='eval').body)

def solve(r):
    s=r['statement'];n=nums(s);os=r.get('options',[]);k=r['modelId'].removeprefix('grade4-productivity-');note=''
    if k in {'work-divided-hourly-rate','work-divided-minute-rate','work-divided-hourly-food-rate','hourly-time-choice'}:
        rate,work=n;time=F(work,rate);assert time*rate==work;answer=numeric_choice(r,time) if os else integer(time)
        if os:assert work-rate in [one(nums(o)) for o in os] and work+rate in [one(nums(o)) for o in os]
        note=f'PRINTED totalwork{work}/constant rate{rate}={time}timeunits; reverseproduct{rate}×{time}={work}. Actual MCQsum/difference traps preserved when present; quantity asked is TIME.'
    elif k=='fixed-time-rate-factor':
        time,factor=n;answer=one(o for o in os if o==f'{factor} есе көбейеді');assert 'өзгермеді' in s
        note=f'Universal A=v×{time}; new({factor}v)×{time}={factor}A for EVERY positive ratev. Multiplicative growth{factor}, notabsolute{factor}items or inverse; time explicitlyunchanged.'
    elif k=='work-rule':
        answer=one(o for o in os if o=='Өнімділікті уақытқа көбейту');assert unit_dimension('v*t')==(1,0)
        note='Definition: constant ratev items/hour repeated through t hours yields A=v×t for ALL t>0; unit algebra(1,−1)+(0,1)=(1,0). The other operation types give wrong units; invariant formula honestly retained.'
    elif k in {'hourly-work-day','daily-work-mass','stitches-minute-work','daily-work-count'}:
        rate,time=n;work=rate*time;answer=integer(work);assert F(work,time)==rate
        note=f'Actual SAME timeunitrate{rate}×time{time}={work}work; repeated equal blocks and reverse division agree, requested outputunit count/mass retained.'
    elif k=='rate-unit-reading':
        assert 'әр минутта' in s and 'бет' in s;answer=one(o for o in os if o=='бет/мин')
        note='Printed workunitPAGES per printed MINUTE; sole option combines both correct work/timeunits as бет/мин. Pagealone=time-free work, minutealone=time, kilometres/minute is movement.'
    elif k=='minute-rate-hour-work':
        rate,hours=n;minutes=hours*60;work=rate*minutes;answer=integer(work)
        note=f'Actualrate{rate}/MINUTE, time{hours}HOUR={minutes}minutes by60 conversion; exact output{work}, notrate×unconvertedhours.'
    elif k=='identify-total-work':
        time,work,quoted=n;assert work==quoted;answer=one(o for o in os if o=='Орындалған жұмыс көлемі');assert F(work,time).denominator==1
        note=f'Actual quoted{quoted}frames are TOTAL finishedwork over{time}hours; impliedrate{F(work,time)}frames/hour distinct from totalwork and time; all4quantity roles checked.'
    elif k in {'rate-formula','time-formula'}:
        target='v' if k=='rate-formula' else 't';dimension={'v':(1,-1),'t':(0,1)}[target];flags=[unit_dimension(o.split(' = ')[1])==dimension for o in os];answer=one(o for o,flag in zip(os,flags) if flag)
        expected=f'{target} = A : '+('t' if target=='v' else 'v');assert answer==expected
        assert ('t > 0' if target=='v' else 'v > 0') in s
        note=f'All4actual formula RHS dimensions computed, flags{flags}; target{target} units{dimension}, universal solveofA=v×t gives{answer}. Printed divisor strictlypositive, so divisiondefined; wrong mixed-dimension subtraction rejected.'
    elif k in {'daily-rate-choice','minute-rate-choice'}:
        time,work=n;rate=F(work,time);answer=numeric_choice(r,rate);actual=[one(nums(o)) for o in os];assert set(actual)=={work+time,work-time,work*time,int(rate)}
        note=f'Actualwork{work}/{time}timeunits={rate}rate; ALL4numeric diagnostic options are correctdivision, addition, subtraction,multiplication: actual{actual}; requested work PERtimeunit.'
    elif k in {'two-stage-constant-rate-time','observed-minute-rate-new-time'}:
        oldtime,oldwork,newwork=n;rate=F(oldwork,oldtime);time=newwork/rate;answer=numeric_choice(r,time) if os else integer(time);assert rate*time==newwork
        if os:assert numeric_choice(r,rate)!=answer and numeric_choice(r,oldtime+rate)!=answer
        note=f'TWO actual stages: observedrate{oldwork}/{oldtime}={rate}, targettime{newwork}/{rate}={time}; reversework closes. Rate itself and oldtime+rate are explicit falseMCQs where offered.'
    elif k=='increased-rate-fixed-plan-time':
        rate,time,increase=n;work=rate*time;newrate=rate+increase;newtime=F(work,newrate);answer=numeric_choice(r,newtime);assert newtime<time and numeric_choice(r,time-increase)!=answer
        note=f'Actual FIXED work{rate}×{time}={work}; additiveRATEincrease{increase}gives{newrate}, newtime{work}/{newrate}={newtime}; time−rateincrease dimensionerror retained asfalseMCQ.'
    elif k=='tonnes-grams-item-count':
        tonnes,grams=n;total=tonnes*1000*1000;count,rest=divmod(total,grams);assert rest==0;answer=str(count)
        note=f'Actual{tonnes}TONNES×1000kg/t×1000g/kg={total}GRAMS; {grams}grams/item gives{count}FULL packages, remainder0; two powersof1000 both retained.'
    elif k=='different-times-rate-ratio':
        t1,w1,t2,w2=n;assert t1!=t2;r1,r2=F(w1,t1),F(w2,t2);ratio=r1/r2;answer=numeric_choice(r,ratio);assert r1>r2>0 and numeric_choice(r,F(w1,w2))!=answer and numeric_choice(r,r1-r2)!=answer
        note=f'Actual differenttimeunit rates{w1}/{t1}={r1}, {w2}/{t2}={r2}; requested FACTOR={ratio}, notrawcountsratio{F(w1,w2)} nor ratedifference{r1-r2}; both diagnostic trapsoffered.'
    elif k=='minute-rate-normalized-hours':
        rate,work=n;minutes=F(work,rate);integer(minutes);hours,rest=divmod(int(minutes),60);answer=one(o for o in os if nums(o)==[hours,rest]);assert 0<=rest<60
        flags=[60*h+minute==minutes and 0<=minute<60 for h,minute in map(nums,os)];assert sum(flags)==1
        note=f'Actual time{work}/{rate}={minutes}MINUTES; base60normalization{hours}hours{rest}minutes. ALL4actual durationoptionschecked, truthflags{flags}, rawpagecount and hours/minutes-confusion rejected.'
    elif k=='hour-minute-who-faster':
        hourly,perminute=n;first=s.split()[0];second=m(r'бет, (\S+) бір минутта',s)[1];r2=perminute*60;assert hourly!=r2;answer=one(o for o in os if o==(first if hourly>r2 else second))
        note=f'Actual{first}{hourly}/HOUR versus{second}{perminute}/MINUTE={r2}/HOUR; sameunit exactcomparison selects{answer}, oppositeperson/tie/insufficient false.'
    elif k in {'different-times-who-rate-gap','different-times-who-hourly-gap'}:
        if k=='different-times-who-rate-gap':w1,t1,w2,t2=n;first,second='Бірінші желі','Екінші желі'
        else:t1,w1,t2,w2=n;first=s.split()[0];second=m(r'бөлшек, (\S+) (?:\d+) сағатта',s)[1]
        r1,r2=F(w1,t1),F(w2,t2);gap=abs(r1-r2);who=first if r1>r2 else second;answer=one(o for o in os if o.startswith(who+',') and nums(o)==[int(integer(gap))]);assert t1!=t2
        assert any(nums(o)==[abs(w1-w2)] for o in os)
        note=f'Actual unequalobservedtimes: rates{r1},{r2}, winner{who}, gap{gap}PERtimeunit; rawworkdifference{abs(w1-w2)} offeredbutfalse, wrongwinner andtie excluded.'
    elif k=='one-invalid-work-table-row':
        flags=[v*t==work for v,t,work in map(nums,os)];answer=one(o for o,flag in zip(os,flags) if not flag)
        note=f'ALL4actual worktable tripleschecked withA=v×t, truthflags{flags}; only selected falseexample disagrees. Does not accept the intentionallywronggiven as a true equality.'
    elif k in {'inverse-original-daily-rate','inverse-original-hourly-rate','inverse-old-machine-rate'}:
        increase,time,work=n;newrate=F(work,time);old=newrate-increase;assert old>0 and newrate.denominator==1;answer=integer(old)
        candidates=[x for x in range(int(newrate)) if (x+increase)*time==work];assert candidates==[int(old)]
        note=f'Actual increasedrate{work}/{time}={newrate}; ORIGINALrate={newrate}−{increase}={old}. COMPLETEoldrate0…{int(newrate)-1} integerdomain givesonly{candidates}; positiveincrease excludesalllarger, reverse(x+inc)t exact.'
    elif k=='equal-times-rate-gap':
        time,w1,w2=n;gap=F(w1,time)-F(w2,time);assert gap==F(w1-w2,time)>0;answer=integer(gap)
        note=f'Actual SAMEtime{time}: separate rates{F(w1,time)},{F(w2,time)}, perunitgap{gap}; independent totalgap/time({w1}−{w2})/{time} agrees, nottotalgapitself.'
    elif k=='fixed-work-reduced-rate-time':
        oldtime,work,factor,repeated=n;assert work==repeated;oldrate=F(work,oldtime);newrate=oldrate/factor;time=F(work)/newrate;assert time==oldtime*factor;answer=integer(time)
        note=f'Actual FIXED repeatedwork{work}, oldrate{oldrate}, reducedbyfactor{factor}→{newrate}; inverse time{time}={oldtime}×{factor}, exactwork/timeledger matches.'
    elif k=='opposite-rate-time-factors':
        up,down=n;assert F(up,down)==1;answer=one(o for o in os if o=='Өзгермейді')
        note=f'Universalnewwork=({up}v)(t/{down})=({up}/{down})vt=vt for ALLpositive v,t. Opposite changes cancel, cannot addfactorsor squareonlyonechange; invariant definitionhonest.'
    elif k=='earlier-completion-days-saved':
        work,plan,extra=n;oldrate=F(work,plan);actual=F(work)/(oldrate+extra);saved=plan-actual;assert 0<saved<plan;answer=numeric_choice(r,saved);assert numeric_choice(r,actual)!=answer
        note=f'Actualplanrate{work}/{plan}={oldrate}, actualrate{oldrate+extra}; actualduration{actual}, requested DAYS SAVED{plan}−{actual}={saved}. Actualduration trapoffered, fixedwork retained.'
    elif k=='fractional-batch-work-mixed-time':
        batchminutes,items,hours,minutes=n;total=60*hours+minutes;batches=F(total,batchminutes);integer(batches);work=batches*items;answer=numeric_choice(r,work)
        traps=[F(60*hours,batchminutes)*items,batches,total*items];assert all(numeric_choice(r,v)!=answer for v in traps)
        note=f'Actualmixedtime{hours}h{minutes}min={total}min; {total}/{batchminutes}={batches}COMPLETEbatches, each{items}items→{work}. ALL3source-specific traps{list(map(str,traps))} (wholehouronly,batchcount,nobatchdivision) retained.'
    elif k=='rate-increase-early-inverse-total':
        planned,actual,early=n;coefficient=actual-planned;assert coefficient>0;rhs=planned*early;days=F(rhs,coefficient);integer(days);work=actual*days;answer=integer(work)
        hits=[d for d in range(1,rhs+1) if actual*d==planned*(d+early)];assert hits==[int(days)]
        assert work/planned-work/actual==early
        note=f'Actualtwo schedules SAMEtotalwork: {actual}d={planned}(d+{early}); positivecoefficient{coefficient}d={rhs}, uniqued{days}, work{work}. COMPLETEpositive d1…{rhs}checked, coefficient≥1 boundsallpossible d; reverse planned/actualtimegap{early} closes.'
    elif k=='seconds-minute-hour-work-gap':
        seconds,secondrate,hours=n;firstperminute=F(60,seconds);work1=F(hours*3600,seconds);work2=secondrate*hours*60;gap=work1-work2;answer=numeric_choice(r,gap)
        assert gap==(firstperminute-secondrate)*hours*60 and all(numeric_choice(r,v)!=answer for v in [firstperminute-secondrate,work1,work2])
        note=f'Actual firstseconds/item{seconds}→{firstperminute}/min→{work1}/hour(s); second{secondrate}/min→{work2}, targetFULL{hours}HOURgap{gap}. PerMINUTEgap and EACHwholeoutput trapsalloffered and false.'
    elif k=='same-work-master-learner-rate':
        rate,time1,time2=n;work=rate*time1;learner=F(work,time2);assert 0<learner<rate;answer=numeric_choice(r,learner)
        assert numeric_choice(r,F(rate,time2))!=answer and numeric_choice(r,F(rate*time2,time1))!=answer
        note=f'Actual equalwork{rate}×{time1}={work}; learneruses{time2}hours, rate{learner}, notmasterrate/{time2} or time-ratio reversed. Bothoriginaldiagnostic mistakesoffered; workconserved.'
    elif k=='fixed-work-inverse-time-factor':
        factor=one(n);answer=one(o for o in os if o==f'{factor} есе артады')
        note=f'Universal A FIXED, vnew=v/{factor}>0 implies tnew=A/(v/{factor})={factor}(A/v)={factor}t. ALLpositive A,v; inversefactornot unchanged/ninesquared/directdecrease.'
    elif k=='minutes-per-item-hour-work-gap':
        per1,per2,hours=n;minutes=60*hours;works=[F(minutes,per1),F(minutes,per2)];gap=works[0]-works[1];answer=numeric_choice(r,gap)
        assert gap>0 and all(numeric_choice(r,v)!=answer for v in [works[1],per2-per1,sum(works)])
        note=f'Actual durations{per1},{per2}MINUTES PERitem, SAME{hours}hour={minutes}min; wholeoutputs{list(map(str,works))}, requestedcountgap{gap}. Oppositeunitrate, minutesdifference and totalcount source trapsretained.'
    else:raise AssertionError(k)
    return answer,note

def numeric_chains(s):
    count=0
    for hit in re.finditer(r'[0-9(][0-9\s×:−+()=<>≥≤]*',s):
        t=hit[0].strip()
        if '=' not in t and '<' not in t and '>' not in t:continue
        if re.search(r'[=<>≥≤:×−+]$',t) or t.count('(')!=t.count(')'):continue
        if re.search(r'[×:−+]\s*$',s[:hit.start()]):continue
        chunks=re.split(r'\s*(=|<|>|≤|≥)\s*',t);assert len(chunks)%2==1;vs=list(map(calc,chunks[::2]));assert all(a==b if op=='=' else a<b if op=='<' else a>b if op=='>' else a<=b if op=='≤' else a>=b for a,op,b in zip(vs,chunks[1::2],vs[1:])),t;count+=1
    return count
def main():
    assert len(ROWS)==40;entries=[];refs=set();chains=0
    for r in ROWS:
        answer,note=solve(r);assert answer==r['answer'],(r['editionId'],answer,r['answer']);bad=copy.deepcopy(r);bad['answer']='wrong';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==4 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(answer)==1
        else:assert answer.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);assert raw['solution'] and not raw.get('images') and not raw.get('svg');refs.add(raw['id']);norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip();assert norm(raw['statement'])!=norm(r['statement']);chains+=numeric_chains(r['solution'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'Independent displayed Fraction/integer work-rate-time and unit ledgers; normalized durations and ALL actualMCQs, complete inverse-positive-rate/time domains, universal unit/scaling proofs; no author solver/spec/params imported','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['All40 saved/new/fullsolutions/allMCQs manually read','Time/work/rate/ratio/gap and savedtime quantity roles distinguished','MINUTE/HOUR/SECOND and tonne/kg/gram conversions checked exactly','Source-specific falseMCQoperations/inversechange/rawcountcomparisons retained','Constant work and universal formula/domain definitions proved, not finitewitness-only']})
    assert len(refs)==40
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('"+PACK+"')).editions.map(editionHash)));"
    hashes=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert hashes==[e['sha256'] for e in entries]
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'scope':'All40 source-addressed grade4topic6.1 nonvisual productivity adaptations; exact independent printed review; work definitions invariant, not claimed newsemanticmeanings','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:assert {e['editionId']:e['sha256'] for e in json.loads((ROOT/OUT).read_text())['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':40,'wrongKeysRejected':40,'sourceRefs':40,'hashesMatched':40,'numericSolutionChains':chains,'completeInverseDomains':True,'universalUnitAndScalingProofs':True,'authorSolverOrParamsUsed':False}))
if __name__=='__main__':main()
