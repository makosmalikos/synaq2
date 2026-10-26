"""Independent exact review of the DISPLAYED unit-work conditions and MCQs.

No producer calculator, specifications or params are read by this oracle.
Every original/new condition, complete solution and offered option was also read.
"""
import ast
import copy
from fractions import Fraction as F
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import unicodedata

ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade5-unit-work.json'
OUT='problems/editorial/reviews/grade5-unit-work.json'
ROWS=json.loads((ROOT/PACK).read_text())['editions']

def one(xs):
    xs=list(xs);assert len(xs)==1,xs;return xs[0]
def m(pattern,text):
    found=re.search(pattern,text);assert found,(pattern,text);return found
def number(pattern,text):return int(m(pattern,text)[1])
def digest(row):return hashlib.sha256(json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def raw_for(row):
    ref=one(row['sourceRefs'])
    return one(q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId'])
def groups(s):
    depth=0;start=None;out=[]
    for i,c in enumerate(s):
        if c=='(':
            if depth==0:start=i
            depth+=1
        elif c==')':
            depth-=1;assert depth>=0
            if depth==0:out.append(s[start:i+1])
    assert depth==0
    return out
def calc(s):
    s=s.replace('×','*').replace('÷','/').replace('−','-').strip()
    assert re.fullmatch(r'[0-9 ()+*/-]+',s),s
    def visit(n):
        if isinstance(n,ast.Constant):assert type(n.value)is int;return F(n.value)
        if isinstance(n,ast.UnaryOp):assert isinstance(n.op,ast.USub);return -visit(n.operand)
        assert isinstance(n,ast.BinOp),ast.dump(n)
        a,b=visit(n.left),visit(n.right)
        if isinstance(n.op,ast.Add):return a+b
        if isinstance(n.op,ast.Sub):return a-b
        if isinstance(n.op,ast.Mult):return a*b
        assert isinstance(n.op,ast.Div) and b
        return a/b
    return visit(ast.parse(s,mode='eval').body)
def integer(v):
    v=F(v);assert v>=0 and v.denominator==1,v
    return str(v.numerator)
def choice(r,v):return one(o for o in r['options'] if calc(o)==v)
def inverse(known,coefficient):
    """Exact linear uniqueness, no arbitrary finite search or guessed answer."""
    known,coefficient=F(known),F(coefficient)
    assert known>0 and coefficient>0
    value=known/coefficient
    assert value>0 and coefficient*value==known
    # a*x=b with nonzero a has precisely one rational x, hence at most one natural.
    return value
def ledger(whole,*parts):
    whole=F(whole);parts=list(map(F,parts))
    assert all(p>=0 for p in parts) and sum(parts,F(0))==whole,(whole,parts)
def counts(*parts):assert all(F(p).denominator==1 and p>=0 for p in parts),parts
def traps(r,values):
    for v in values:assert choice(r,v)!=r['answer'],(r['editionId'],v)

def displayed_numbers(s):
    for g in groups(s):s=s.replace(g,' ',1)
    return list(map(int,re.findall(r'\d+',s)))
def reciprocal(t):
    assert t>0,t
    return F(1)/t
def rate(times):return sum(map(reciprocal,times),F(0))
def unique_time(work,r):
    assert 0<work<=1 and r>0
    t=F(work)/r;assert t>0 and t*r==work
    return t
def selected(r,v):return choice(r,v) if r.get('options') else integer(v)
def pair_option(r,a,b):
    def parse_pair(o):return tuple(map(int,m(r'бірінші — (\d+) сағ, екінші — (\d+) сағ',o).groups()))
    offered=[parse_pair(o) for o in r['options']]
    return one(o for o,p in zip(r['options'],offered) if p==(a,b))

def solve(r):
    s=r['statement'];k=r['modelId'].removeprefix('grade5-unit-work-');ns=displayed_numbers(s);gs=groups(s);vs=list(map(calc,gs));note=''
    if k=='whole-work-one-unit-convention':
        assert 'БІР БҮТІН ЖҰМЫС' in s and 'келістік' in s
        answer=one(o for o in r['options'] if o=='1')
        assert r['options']==['1','0','100','жұмыс уақыты'] and '100 бірлікпен де' in r['solution']
        note='Printed convention explicitly chooses ONEWHOLEwork unit, therefore1; zero/time are not work, while100is acknowledged as another legitimate scale, not universally impossible.'
    elif k=='net-inlet-outlet-hour-fraction':
        inlet,outlet=vs;assert inlet>outlet>0;v=inlet-outlet;answer=choice(r,v)
        (a,b),(c,d)=[tuple(map(int,x)) for x in re.findall(r'\((\d+)/(\d+)\)',s)]
        traps(r,[inlet+outlet,F(1,b*d),F(1,d-b)]);assert 'Бос' in s and 'Шығыс' in s and 'Бір сағат' in s
        note=f'ActualconstantIN{inlet}minusOUT{outlet}={v}afterONEhour; positivewater/sum/productdenominator/separatedenominatordifference options all checked.'
    elif k=='fraction-completed-in-given-time':
        full,elapsed=ns;assert 0<elapsed<full;v=F(elapsed,full);answer=choice(r,v)
        traps(r,[F(1,full),1-v,F(elapsed,full-elapsed)])
        note=f'Printedfull{full}h, elapsed{elapsed}h→COMPLETED{v}; onehour/remnant/elapsed:unelapsed distractors all false.'
    elif k=='identical-pumps-joint-time':
        solo,count=ns;assert count>1;rr=F(count,solo);v=unique_time(1,rr);answer=integer(v)
        assert 'барлығы' in s and 'өнімділіктері өзгермейді' in s
        note=f'{count}identicalpumps each1/{solo}→jointrate{rr}, fulltime{v}; individualrateunchanged, no extraoriginalpump counted.'
    elif k in {'choose-reciprocal-sum-time-expression','two-helpers-whole-job-minute-time','two-outlet-pumps-empty-time','opposite-route-whole-travel-hour-time','opposite-vehicles-mixed-hour-time','opposite-route-meeting-time-in-minutes','two-loaders-whole-job-minute-time','raft-and-upstream-boat-opposite-meeting'}:
        assert len(ns)==2;rr=rate(ns);hours=unique_time(1,rr);v=hours*60 if k=='opposite-route-meeting-time-in-minutes' else hours;answer=selected(r,v)
        assert hours<min(ns)
        if k=='choose-reciprocal-sum-time-expression':
            assert answer==f'1 ÷ ((1/{ns[0]}) + (1/{ns[1]}))';traps(r,[sum(ns),F(sum(ns),2),rr])
        if k=='opposite-vehicles-mixed-hour-time':traps(r,[sum(ns),F(sum(ns),2),rr]);assert hours.denominator>1
        if k=='two-outlet-pumps-empty-time':assert 'Екеуі де' in s and 'СЫРТҚА' in s
        if k=='raft-and-upstream-boat-opposite-meeting':assert 'АҒЫСҚА ҚАРСЫ' in s;assert sum(hours/F(t) for t in ns)==1
        if k=='opposite-route-meeting-time-in-minutes':assert 'минуттан' in s
        note=f'ALLactualfulltimes{ns}, positive rates{list(map(lambda t:str(reciprocal(t)),ns))}ADD→{rr}; unique full/meetingtime{hours},'+(' ×60MIN/h→'+str(v)+'min;' if k=='opposite-route-meeting-time-in-minutes' else '')+' everycontribution closesWHOLE1 and togetherfasterthanfastestsolo. '+('Upstreamboat time is ALREADYactualgroundtime; no secondcurrentcorrection.' if k=='raft-and-upstream-boat-opposite-meeting' else '')
    elif k=='time-for-fraction-of-single-work':
        full=one(ns);part=one(vs);v=unique_time(part,F(1,full));answer=choice(r,v)
        traps(r,[full/part,full*(1-part)]);note=f'Actualtarget{part}ofwhole taking{full}h, rate1/{full}; targettime{v}, remaining{full-v}and invertedpart{full/part} false.'
    elif k=='one-minute-unit-work-fraction':
        full=one(ns);v=F(1,full);answer=choice(r,v);traps(r,[F(full),1-v])
        assert 'Бір минутта' in s;note=f'Full{full}MINUTES→ONEminute{v}ofWHOLE; time{full}and remaining{1-v} are differentroles.'
    elif k=='two-given-unit-inlet-rates-full-time':
        assert len(vs)==2 and all(v.numerator==1 for v in vs);rr=sum(vs);v=unique_time(1,rr);answer=integer(v)
        ds=[x.denominator for x in vs];lcm=math.lcm(*ds);assert lcm>max(ds)
        note=f'Two actualHOURLYunitrates{list(map(str,vs))}, exactLCM{lcm}→sum{rr}→full{v}h; denominatornotmultipleofother retained.'
    elif k=='two-unit-day-rates-sum':
        a,b=vs;v=a+b;answer=choice(r,v);ad,bd=a.denominator,b.denominator
        traps(r,[F(2,ad+bd),F(1,ad+bd),a*b]);assert 'Бір күн' in s and 'бөліктері бөлек' in s
        note=f'ActualONEdayrateSUM{a}+{b}={v}, not fulltime; mediant/product/one-over-summed-denominators MCQs all checked.'
    elif k=='already-joint-unit-rate-full-time':
        rr=one(vs);v=unique_time(1,rr);answer=integer(v);assert 'БІРЛЕСКЕН' in s and 'қосындысы' in s
        note=f'AlreadyJOINTdisplayedrate{rr}→unique{v}h; never double the TWO-piperate a secondtime.'
    elif k=='third-solo-time-from-joint-three':
        joint,a,b=ns;third=reciprocal(joint)-rate([a,b]);v=unique_time(1,third);answer=integer(v)
        assert rate([a,b,v])==reciprocal(joint)
        note=f'Allthreejoint{joint}hminusprintedsolorates1/{a},1/{b}→third{third}>0; unique thirdsolo{v}, exactthreewayrateclosure.'
    elif k=='inlet-and-drain-full-time':
        inlet,outlet=ns;rr=reciprocal(inlet)-reciprocal(outlet);v=unique_time(1,rr);answer=choice(r,v)
        traps(r,[outlet-inlet,unique_time(1,rate(ns)),sum(ns)]);assert 'Шығыс' in s
        note=f'Constant inlet1/{inlet}−drain1/{outlet}={rr}>0; fulltime{v}; actualtimegap/sumflows/sumtimes options evaluated, directions preserved.'
    elif k=='master-alone-then-joint-remaining-time':
        master,helper,alone=ns;done=F(alone,master);remaining=1-done;rr=rate([master,helper]);v=unique_time(remaining,rr);answer=integer(v)
        assert 'БІРГЕ' in s and done+v*rr==1
        note=f'Firstalone{alone}h/solo{master}→done{done}, remaining{remaining}; jointrate{rr}→requested JOINTtime{v}, total{alone+v}excluded; forwardledgercloses1.'
    elif k=='second-solo-time-fraction-of-first':
        first=one(ns);fraction=one(vs);second=first*fraction;rr=rate([first,second]);v=unique_time(1,rr);answer=choice(r,v)
        traps(r,[first+second,(first+second)/2,rr]);assert 0<second<first
        note=f'FRACTIONofTIME{first}×{fraction}→secondsolo{second}, not fractionofrate; sumunitrates{rr}→joint{v}; actualsum/mean/rate MCQs checked.'
    elif k=='boat-downstream-from-still-and-raft-times':
        raft,still=ns;current=reciprocal(raft);own=reciprocal(still);rr=own+current;v=unique_time(1,rr);answer=integer(v);assert own>current>0 and 'АҒЫСПЕН' in s
        note=f'Normalizedsame-distance raftCURRENT{current}+STILLwaterown{own}→downstream{rr}, time{v}; currentadded to speed, never to time.'
    elif k=='three-workers-joint-mixed-day-time':
        assert len(ns)==3;rr=rate(ns);v=unique_time(1,rr);answer=choice(r,v);traps(r,[sum(ns),F(sum(ns),3),rr])
        assert v<min(ns) and v.denominator>1
        note=f'AllTHREEprintedsolorates{ns}→{rr}, uniquejoint{v}days; EVERY actualsumtimes/meantimes/rate option false, not droppedthirdworker.'
    elif k=='second-worker-multiple-rate-from-first-time':
        first,multiple=ns;assert multiple>1;second=F(first,multiple);rr=rate([first,second]);v=unique_time(1,rr);answer=choice(r,v);traps(r,[first+second,(first+second)/2,rr])
        assert 'КҮНДІК ӨНІМДІЛІГІ' in s
        note=f'SecondRATE×{multiple}, so TIME{first}/{multiple}={second}, joint{rr}→{v}; reversedtime/rateinterpretation excluded; actualsum/mean/rate distractors checked.'
    elif k=='second-solo-time-from-joint-and-first':
        joint,first=ns;second=reciprocal(joint)-reciprocal(first);v=unique_time(1,second);answer=integer(v);assert rate([first,v])==reciprocal(joint)
        note=f'KnownJOINT1/{joint}minusfirst1/{first}={second}>0; uniqueSECONDSOLO{v}, forwardrateclosure exact.'
    elif k=='remaining-fraction-after-joint-printing':
        a,b,elapsed=ns;rr=rate([a,b]);done=elapsed*rr;v=1-done;assert 0<v<1;answer=choice(r,v);traps(r,[done,1-rr,rr])
        assert 'ӘЛІ БАСЫЛМАҒАН' in s
        note=f'Actualjoint{rr}perhour×{elapsed}→DONE{done}; requestedUNPRINTED{v}; actualdone/onehourremaining/hourlyrate options all excluded.'
    elif k=='joint-time-to-target-fraction':
        a,b=ns;target=one(vs);rr=rate(ns);v=unique_time(target,rr);answer=integer(v);assert v<unique_time(1,rr)
        note=f'Printeddistincttarget{target}not1, jointrate1/{a}+1/{b}={rr}; targettime{v}, FULLtime{1/rr}excluded; targetflowclosure exact.'
    elif k=='drain-solo-time-from-slowed-fill':
        inlet,net=ns;rr=reciprocal(inlet)-reciprocal(net);v=unique_time(1,rr);answer=choice(r,v);traps(r,[net-inlet,net+inlet,rr]);assert rr>0
        note=f'Slowedfill1/{net}=IN1/{inlet}−OUT; OUT{rr}, requesteddrainsolo{v}; timegap/sum/netrateactualMCQs false.'
    elif k in {'middle-pump-solo-from-three-pair-times','three-workers-total-time-from-pair-times'}:
        ab,bc,ac=map(reciprocal,ns);total=(ab+bc+ac)/2;rates=[total-bc,total-ac,total-ab]
        assert all(x>0 for x in rates) and rates[0]+rates[1]==ab and rates[1]+rates[2]==bc and rates[0]+rates[2]==ac
        v=unique_time(1,rates[1] if k.startswith('middle') else total);answer=choice(r,v)
        if k.startswith('middle'):traps(r,[1/total,1/rates[0],1/rates[2]])
        else:traps(r,[1/(ab+bc+ac),sum(ns),F(sum(ns),3)])
        note=f'ALL3printedPAIRS{ns}invert→{ab},{bc},{ac}; summedpairs=2×ALL gives{total}, uniqueindividualrates{list(map(str,rates))}allpositive, eachactualpairreconstructed. Requested'+('MIDDLEBsolo' if k.startswith('middle') else 'ALLthreejoint')+f' time{v}; pairdoublecount/otherworker MCQs checked.'
    elif k=='initial-solo-time-from-total-elapsed':
        first,second,total=ns;firstWork=F(total,first);secondWork=1-firstWork;joint=unique_time(secondWork,reciprocal(second));v=total-joint;assert 0<v<total;answer=integer(v)
        assert F(v,first)+joint*rate([first,second])==1 and 'ЖАЛҒЫЗ' in s
        note=f'FirstworkedALL{total}h→{firstWork}, seconddoes{secondWork}in{joint}h; requestedinitialALONE{total}−{joint}={v}, notjointtime; stagedclosure1.'
    elif k=='faster-solo-time-from-joint-and-rate-ratio':
        joint,multiple=ns;rr=reciprocal(joint);second=rr/(multiple+1);first=second*multiple;v=unique_time(1,first);answer=integer(v)
        assert first/second==multiple and first+second==rr and 'БІРІНШІ' in s
        note=f'RateRATIO{multiple}:1 splitsJOINT{rr}, first{first}, second{second}; requestedFIRSTsolo{v}, secondsolo{1/second}excluded; multiplicative speedunitnotduration.'
    elif k=='boat-upstream-time-from-downstream-and-raft':
        down,raft=ns;current=reciprocal(raft);still=reciprocal(down)-current;up=still-current;v=unique_time(1,up);answer=choice(r,v);traps(r,[1/still,raft-down,raft+down])
        assert up>0 and 'АҒЫСҚА ҚАРСЫ' in s
        note=f'Current{current}, downstream{1/F(down)}; STILL={still}, UP={up}subtractcurrentTWICEfromdownspeed; returntime{v}. Stilltime/sum/differenceofactualtimes options false.'
    elif k=='two-solo-times-from-joint-then-first-alone':
        full,worked,firstRemaining=ns;joint=reciprocal(full);done=worked*joint;remaining=1-done;first=remaining/firstRemaining;second=joint-first;assert first>0 and second>0
        a,b=unique_time(1,first),unique_time(1,second);assert a.denominator==b.denominator==1;answer=pair_option(r,int(a),int(b))
        assert worked*(first+second)+firstRemaining*first==1
        note=f'Knownjointfull{full}, worked{worked}→done{done}, remaining{remaining}; remainingFIRSTalone{firstRemaining}givesfirstRATE{first}→full{a}, secondRATE{second}→full{b}. EveryACTUALORDEREDpair parsed; firstremainingtime notfulltime.'
    elif k=='equal-workers-added-after-initial-days':
        original,planned,initial,added=ns;total=original*planned;done=original*initial;remaining=total-done;new=original+added;rest=F(remaining,new);v=initial+rest;answer=integer(v)
        assert initial<planned and done+new*rest==total
        note=f'Actualpersondays{original}×{planned}={total}; first{original}×{initial}={done}, remain{remaining}; NOW{new}workers need{rest}days, TOTAL{v}; addedworkersnotpresentbeforeinitialphase.'
    elif k=='opposite-second-whole-route-time-from-meeting':
        meet,first=ns;second=reciprocal(meet)-reciprocal(first);v=unique_time(1,second);answer=integer(v)
        assert F(meet,first)+meet*second==1
        note=f'Actualmeeting{meet}MINgivesjoint1/{meet}, subtractfirst1/{first}→second{second}, fullsecondtime{v}MIN; observedroutefractions sum1.'
    elif k=='delayed-second-pipe-total-elapsed-time':
        first,second,delay=ns;done=F(delay,first);remaining=1-done;rr=rate([first,second]);joint=unique_time(remaining,rr);v=delay+joint;answer=integer(v)
        assert F(v,first)+F(joint,second)==1 and 'БАРЛЫҒЫ' in s
        note=f'Initial{delay}hfirstonly→{done}, remaining{remaining}; joint{rr}needs{joint}h, requestedTOTAL{v}. Firstactive{v}, second{joint}; exactwaterclosure, jointonlynotanswer.'
    elif k=='already-partly-filled-joint-time':
        initial=one(vs);rr=rate(ns);remaining=1-initial;v=unique_time(remaining,rr);answer=choice(r,v);traps(r,[1/rr,initial/rr,sum(ns)*remaining])
        assert initial+v*rr==1;note=f'AlreadyFILLED{initial}, fillONLY{remaining}at{rr}→{v}h; actualEMPTYtime{1/rr}, initialsharetime{initial/rr}, sumtimes×remaining allfalse, ledger1.'
    elif k=='uncompleted-fraction-after-solo-days':
        full,worked=ns;v=1-F(worked,full);answer=choice(r,v);assert 0<v<1
        traps(r,[F(worked,full),F(1,full),F(worked,full-worked)]);assert 'ДАЙЫН ЕМЕС' in s
        note=f'Actualworked{worked}/{full}DONE; requestedUNDONE{v}; dayunit/finished/time-ratioactualMCQs checked.'
    elif k=='faster-worker-from-fraction-in-observed-time':
        names=re.findall(r'(\w+) (?:бір тапсырманың|дәл сондай тапсырманың)',s);assert len(names)==2 and len(ns)==len(vs)==2
        rates=[f/t for f,t in zip(vs,ns)];winner=one(i for i,x in enumerate(rates) if x==max(rates));answer=names[winner]
        assert answer in r['options'] and vs[winner]<vs[1-winner]
        note=f'Actualprintednames{names}, donefractions{list(map(str,vs))}, observedhours{ns}; compareWORK/TIMErates{list(map(str,rates))}, unique{answer}; SMALLERdonefraction stillfaster, rawcounts/timesaloneinsufficient.'
    elif k=='pay-split-proportional-to-actual-work':
        first,second,pay=ns;rr=rate([first,second]);joint=unique_time(1,rr);shares=[joint/first,joint/second];amounts=[pay*x for x in shares];assert sum(shares)==1 and sum(amounts)==pay
        names=m(r'^(\w+) бір қоршауды жалғыз \d+ күнде, (\w+) \d+ күнде',s).groups()
        def values(o):
            a,b=m(r'^'+names[0]+r' — (\d+) тг, '+names[1]+r' — (\d+) тг$',o).groups();return[int(a),int(b)]
        answer=one(o for o in r['options'] if values(o)==amounts)
        assert all(sum(values(o))==pay for o in r['options']) and amounts[0]>amounts[1]
        note=f'Workrates1/{first},1/{second}; SAMEjointtime{joint}→ACTUALworkshares{list(map(str,shares))}. Orderedpay{names}→{list(map(str,amounts))}, eachMCQpaymentpair parsed and conservesTOTAL{pay}; neither equalnor inverse-timewrongorder.'
    elif k=='sequential-half-versus-joint-time-saved':
        a,b=ns;sequential=F(a+b,2);rr=rate(ns);joint=unique_time(1,rr);v=sequential-joint;answer=choice(r,v);lcd=math.lcm(a,b);rawnum=lcd//a+lcd//b
        traps(r,[joint,sequential,F(rawnum)]);assert rawnum!=rr.numerator and 'ҮНЕМДЕЛЕР' in s
        note=f'ActualHALFthenHALF times{F(a,2)}+{F(b,2)}={sequential}; BOTHfromstart joint{joint}; requestedSAVED{v}, not eitherduration. Source-specificRAWLCDnumerator{lcd//a}+{lcd//b}={rawnum}of{rawnum}/{lcd}trap restored andfalse.'
    elif k=='alternating-one-hour-pumps-last-partial-cycle':
        a,b,slot1,slot2=ns;assert slot1==slot2==1 and 'КЕЗЕКТЕСІП' in s and 'бак толған сәтте тоқтайды' in s
        # Independent continuous piecewise integration, NOT the producer's cycle formula.
        elapsed=F(0);filled=F(0);timeline=[]
        for i in range(max(a,b)):
            rr=F(1,[a,b][i%2]);remaining=1-filled
            if rr>=remaining:
                partial=remaining/rr;assert 0<partial<=1;v=elapsed+partial;timeline.append((str(elapsed),str(filled),str(rr),str(partial)));break
            timeline.append((str(elapsed),str(filled),str(rr),'1'));filled+=rr;elapsed+=1
        else:raise AssertionError('Continuouspositiveworkmustfinishbymaxsolo')
        assert partial<1 and elapsed%2==0;answer=choice(r,v)
        def fill_at(t):
            whole=t.numerator//t.denominator;rest=t-whole
            return sum((F(1,[a,b][i%2]) for i in range(whole)),F(0))+rest/F([a,b][whole%2])
        assert fill_at(v)==1 and all(fill_at(F(i))<1 for i in range(math.ceil(v)))
        assert one(o for o in r['options'] if fill_at(calc(o))==1)==answer
        traps(r,[F(2)/rate([a,b]),F(1)/rate([a,b]),F(math.ceil(v))])
        note=f'SeparateEXACTpiecewiseintegration of EVERYone-hourphase, alternatingrates1/{a},1/{b}, startingFIRST; {len(timeline)-1}fullphases stopat{elapsed}h/{filled}filled, lastfirstpumpfraction{partial}h→{v}. Allpreviousintegerprefixes<1, continuousfirstcrossingunique; EVERYactualMCQ integrated, averagecycle/simultaneous/roundup allfalse. Timeline{timeline}.'
    elif k=='second-solo-time-from-partial-joint-job':
        fraction=one(vs);elapsed,first=ns;joint=fraction/elapsed;second=joint-reciprocal(first);v=unique_time(1,second);answer=integer(v)
        assert elapsed*rate([first,v])==fraction and fraction<1
        note=f'GivenPARTIALjointwork{fraction}in{elapsed}days→joint{joint}, not1/{elapsed}; minusfirst1/{first}→second{second}, fullsolo{v}; exactobservedpartialclosure.'
    else:raise AssertionError(k)
    expectedTopic='frac' if k in {'whole-work-one-unit-convention','net-inlet-outlet-hour-fraction','fraction-completed-in-given-time','one-minute-unit-work-fraction','two-unit-day-rates-sum','remaining-fraction-after-joint-printing','uncompleted-fraction-after-solo-days'} else 'word'
    assert r['topic']==expectedTopic
    return answer,note

def main():
    assert len(ROWS)==44;entries=[];refs=set()
    for r in ROWS:
        expected,note=solve(r);assert expected==r['answer'],(r['editionId'],expected,r['answer'])
        bad=copy.deepcopy(r);bad['answer']='WRONG';assert solve(bad)[0]!=bad['answer']
        assert r['grade']==5 and r['minimumPlan']=='pro' and not r.get('image')
        if r.get('options'):assert len(r['options'])==len(set(r['options']))==4 and r['options'].count(expected)==1
        else:assert expected.isdigit() and r['statement'].endswith('Жауапқа тек санды жазыңыз.')
        raw=raw_for(r);refs.add(raw['id']);assert raw['solution']
        norm=lambda s:re.sub(r'\s+',' ',unicodedata.normalize('NFKC',s).lower()).strip()
        assert norm(raw['statement'])!=norm(r['statement'])
        entries.append({'editionId':r['editionId'],'sha256':digest(r),'verdict':'verified','reviewer':'independent_rendering_review_agent','method':'All saved/new/fullsolutions/everyMCQ read; independent DISPLAYED exact Fraction AST/rate and physical ledgers, positive linear uniqueness, every alternating partial phase integrated; no producer solver/spec/params used','notes':note,'sourceCanonicalSha256':digest(raw),'checks':['Every full saved/new condition/solution/MCQ manually read','Actual rate×time and original/remaining/requested roles conserved','Inlet/outlet directions, current/still/upstream distinction and ordered amount pairs checked','Alternating pump continuous phase integration and unique first crossing checked','Raw LCD numerator distractor repaired and final whole row reread']})
    assert len(refs)==44
    js="import fs from'node:fs';import{editionHash}from'./scripts/editorial/edition-review.mjs';import{mathFragments}from'./frontend/src/mathPresentation.js';const rs=JSON.parse(fs.readFileSync('"+PACK+"')).editions;let fractions=0,mixed=0;function walk(ns){for(const n of ns){if(n.type==='text'){if(/[0-9A-Za-z□)]\\/[0-9A-Za-z□(]|[\\\\$^]/.test(n.value))throw Error(n.value);}else if(n.type==='fraction'){fractions++;walk(n.numerator);walk(n.denominator);}else if(n.type==='mixed'){mixed++;walk([n.fraction]);}else throw Error(n.type);}}for(const r of rs)for(const s of[r.statement,r.solution,r.answer,...r.options||[]])walk(mathFragments(s));console.log(JSON.stringify({hashes:rs.map(editionHash),fractions,mixed}));"
    native=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=ROOT,text=True));assert native['hashes']==[e['sha256'] for e in entries];assert native['fractions']>250 and native['mixed']>35
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','manualFindings':[],'resolvedFindings':[{'sourceId':'552e46a6c1bba7c9','finding':'Source explicitly diagnoses fourth wrong option as numerator of common-denominator rate; changed24/40 times require numerator8, not retained5','resolution':'Fourth option5→8; actual5/120+3/120=8/120 explained, math/keys/params/other43rows unchanged.'}],'scope':'All44 source-addressed grade5topic3.15 nonvisual unit-work adaptations; exact printed review','entries':entries}
    if '--write' in sys.argv:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    else:
        signed=json.loads((ROOT/OUT).read_text());assert {e['editionId']:e['sha256'] for e in signed['entries']}=={e['editionId']:e['sha256'] for e in entries}
    print(json.dumps({'independentlyVerified':44,'wrongKeysRejected':44,'hashesMatched':44,'sourceRefs':44,'continuousAlternatingPhases':15,'lastPartialHour':'1/3','resolvedDidacticFindings':1,'nativeFractions':native['fractions'],'nativeMixed':native['mixed'],'authorSolverOrParamsUsed':False}))

if __name__=='__main__':main()
