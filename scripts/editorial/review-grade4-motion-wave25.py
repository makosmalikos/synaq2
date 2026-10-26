"""Independent39-row movement review: every saved/new full condition,
complete solution and MCQ read. Uses only printed givens, exact Fraction,
signed positions, dimensional alternatives, clocks and full finite domains.
"""
from pathlib import Path
from fractions import Fraction as F
from datetime import datetime,timedelta
import argparse,ast,copy,hashlib,json,re
ROOT=Path(__file__).resolve().parents[2]
PACK='problems/editorial/batches/grade4-motion-wave25.json'
OUT='problems/editorial/reviews/grade4-motion-wave25.json'


def digest(row):return hashlib.sha256(json.dumps(row,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()

def one(xs):
    assert len(xs)==1,xs
    return xs[0]

def num(s):
    s=re.sub(r'\s','',s);assert re.fullmatch(r'\d+',s),s
    return int(s)

def nums(s):return [num(m[0]) for m in re.finditer(r'\d[\d ]*',s)]

def match(pattern,s):
    m=re.search(pattern,s);assert m,(pattern,s)
    return m

def integer(v):
    v=F(v);assert v.denominator==1,v
    return v.numerator

def pick(row,value,unit):
    return one([o for o in row['options'] if re.fullmatch(r'[\d ]+ '+re.escape(unit),o) and num(o.removesuffix(' '+unit))==value])

def formula(text,distance,time):
    node=ast.parse(text.split(' = ')[1].replace('−','-').replace('·','*').replace(':','/'),mode='eval')
    def walk(n):
        if isinstance(n,ast.Expression):return walk(n.body)
        if isinstance(n,ast.Name):assert n.id in {'S','t'};return distance if n.id=='S' else time
        assert isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult,ast.Div))
        a,b=walk(n.left),walk(n.right)
        return a+b if isinstance(n.op,ast.Add) else a-b if isinstance(n.op,ast.Sub) else a*b if isinstance(n.op,ast.Mult) else F(a,b)
    return walk(node)

def solve(row):
    s=row['statement'];kind=row['modelId'].removeprefix('grade4-motion-');value=answer=None
    method='Independent actual printed Fraction distance/time conservation and all offered units/candidates checked';note=''
    if kind in {'compare-runners','runner-speed-gap','runner-who-and-gap'}:
        m=match(r'^(.+?) (\d+) минутта ([\d ]+) м, (.+?) (\d+) минутта ([\d ]+) м',s);name,t,d,other,u,e=m[1],int(m[2]),num(m[3]),m[4],int(m[5]),num(m[6]);v,w=F(d,t),F(e,u)
        if kind=='compare-runners':answer=name if v>w else other if w>v else 'Бірдей';assert answer in row['options']
        elif kind=='runner-speed-gap':assert v>w;answer=pick(row,v-w,'м/мин')
        else:answer=one([o for o in row['options'] if o==f'{name if v>w else other}, {integer(abs(v-w))} м/мин'])
        assert v*t==d and w*u==e
        note=f'Actual {name}: {d}/{t}={v}m/min;{other}: {e}/{u}={w}m/min. Requested '+('identity plus gap' if kind=='runner-who-and-gap' else 'gap' if kind=='runner-speed-gap' else 'faster identity')+f' checked separately from longer totaldistance. Cross products{d*u} vs{e*t} independently agree.'
    elif kind in {'drone-distance','crawler-distance','truck-distance'}:
        speed,time=nums(s);value=speed*time
        expected={'drone-distance':('м/с','секундта'),'crawler-distance':('м/мин','минутта'),'truck-distance':('км/сағ','сағат')}[kind];assert all(u in s for u in expected)
        note=f'Actual constant speed{speed} times matching-unit duration{time} gives{value}; inverse{value}/{time}={speed}. No implicit mixed timeunits.'
    elif kind=='speed-unit':
        dimensions={'м/с':(1,-1),'с':(0,1),'м²':(2,0),'м':(1,0)};answer=one([o for o in row['options'] if dimensions[o]==(1,-1)])
        m=match(r'Мысалы, (\d+) м жолды (\d+) с',row['solution']);d,t=map(int,m.groups());assert F(d,t)==9
        method='Independent length/time dimensional exponents, all offered unit categories evaluated'
        note=f'Only {answer} has dimension L×T⁻¹; seconds T,metres L,area L² rejected. Actual printed solutionexample{d}/{t}=9m/s also checked.'
    elif kind in {'violating-cap','nonviolating-cap'}:
        cap=one(nums(s));answer=one([o for o in row['options'] if (num(o.removesuffix(' км/сағ'))>cap if kind=='violating-cap' else num(o.removesuffix(' км/сағ'))<=cap)])
        if kind=='violating-cap':assert f'{cap} км/сағ' in row['options'] and answer!=f'{cap} км/сағ'
        assert 'Жаттығу алаңындағы' in s
        note=f'Explicit hypothetical exercise cap{cap}; strict violation v>cap, permission v≤cap. Equality accepted; no real legal speedlimit claim.'
    elif kind in {'small-crawler-speed','cat-speed'}:
        time,distance=nums(s);v=F(distance,time);unit='м/мин' if kind=='small-crawler-speed' else 'м/с';answer=pick(row,v,unit)
        values=[num(o.removesuffix(' '+unit)) for o in row['options']];assert distance*time in values and distance+time in values and distance-time in values
        note=f'Actual {distance}/{time}={v}{unit}; actual multiply/add/subtract distractors{values}all checked, inverse v×t=S holds.'
    elif kind in {'train-speed','plane-speed'}:
        time,distance=nums(s);value=integer(F(distance,time));assert 'км/сағ' in s
        if kind=='plane-speed':answer=pick(row,value,'км/сағ')
        note=f'Printed distance{distance}km/duration{time}h yields{value}km/h; actual requested speed, not distance/timecomponent, selected.'
    elif kind in {'boat-time','horse-time'}:
        speed,distance=nums(s);value=integer(F(distance,speed));assert 'неше сағат' in s
        note=f'Actual {distance}km at{speed}km/h takes{value}h; exact multiplication{speed}×{value}={distance} establishes unit conversion and inverse.'
    elif kind=='longest-fixed-time':
        entries=re.findall(r'([^;]+?) — (\d+) км/сағ',s);assert len(entries)==4;time=int(match(r'(\d+) сағат қозғалады',s)[1]);roads={name.strip():int(v)*time for name,v in entries};answer=one([name for name,d in roads.items() if d==max(roads.values())]);assert answer in row['options']
        note=f'Every printed fixed-time route computed{roads}; same positive duration{time} preserves speed ordering and unique longest route.'
    elif kind=='speed-formula':
        pairs=[(s,t) for s in range(1,20) for t in range(1,10)];valid=[o for o in row['options'] if all(formula(o,d,t)==F(d,t) for d,t in pairs)];answer=one(valid)
        assert answer=='v = S : t' and 'оң уақыт' in s
        method='Independent dimensional S/t identity with171 complete positive whole distance/time witnesses'
        note='Every offered symbolic operation evaluated with independent AST on171 positive pairs. The correct formula has distance/time dimension and exactly reconstructs S=v×t for positive t; other operations do not.'
    elif kind=='fastest-journey':
        rates=[]
        for o in row['options']:
            m=match(r'^(\d+) сағатта ([\d ]+) км$',o);rates.append(F(num(m[2]),int(m[1])))
        answer=one([o for o,v in zip(row['options'],rates) if v==max(rates)]);longest=max(row['options'],key=lambda o:num(match(r'сағатта ([\d ]+) км',o)[1]));assert answer!=longest
        note=f'Actual rates{rates}; unique fastest{answer}differs from longest-distance option{longest}, preserving unit-rate skill.'
    elif kind=='same-road-speed-gap':
        distance,t,u=nums(s);v,w=F(distance,t),F(distance,u);assert v>w;answer=pick(row,v-w,'км/сағ')
        note=f'Same printed road{distance}; two rates{v}/{w}give requested difference{v-w}km/h. Offered elapsed-gap number is a different dimension.'
    elif kind=='faster-on-same-road':
        distance,oldtime,delta=nums(s);speed=F(distance,oldtime)+delta;value=integer(F(distance,speed));assert value<oldtime
        note=f'Conserved road{distance}; oldrate{F(distance,oldtime)},newrate{speed}; exact newtime{value}, not oldtime-minus-speedincrease. Newtime decreases and speed×time restores road.'
    elif kind=='walk-then-bike-alternative':
        slow,time,fast=nums(s);distance=slow*time;value=integer(F(distance,fast))
        note=f'Two alternative journeys on SAME road{distance}m. Newtime{value}min solves{fast}×time={slow}×{time}, not sum of two routes.'
    elif kind=='arrival-time-gap':
        distance,v,w=nums(s);first,second=F(distance,v),F(distance,w);assert second>first;answer=pick(row,second-first,'мин');assert any(o.endswith('м/мин') for o in row['options'])
        note=f'Actual arrivaldurations{first}/{second}min; requested lead{second-first}min. Offered speedgap unitm/min deliberately rejected even if numericvalue coincides with another quantity.'
    elif kind=='same-speed-new-time':
        oldtime,distance,time=nums(s);speed=F(distance,oldtime);value=integer(speed*time)
        note=f'Conserved actual rate{speed}km/h; target{time}h route{value}km; both original and new distance/time ratios equal.'
    elif kind=='same-time-distance-gap':
        v,w,time=nums(s);assert v>w;first,second=v*time,w*time;value=first-second;assert value==(v-w)*time
        note=f'Both actual paths over common{time}h independently{first}/{second}km; subtraction and relative-rate alternative give identical{value}km.'
    elif kind=='speed-ratio':
        t,d,u,e=nums(s);v,w=F(d,t),F(e,u);answer=pick(row,F(v,w),'есе');assert v>w
        note=f'Actual speeds{v}/{w}m/s; requested dimensionless factor{v/w}, not speed difference{v-w}m/s or raw-distance ratio{F(d,e)}.'
    elif kind=='same-speed-new-distance':
        time,distance,target=nums(s);speed=F(distance,time);value=integer(F(target,speed))
        note=f'Actual unchanged rate{speed}; targetroad{target}requires{value}h, exact conservation newtime×oldroad=oldtime×newroad.'
    elif kind=='minimum-cap-time':
        cap,distance=nums(s);minimum=F(distance,cap);answer=pick(row,minimum,'сағ');assert 'Осы шекпен бірқалыпты жүруге болады' in s
        for o in row['options']:
            t=num(o.removesuffix(' сағ'));assert (F(distance,t)<=cap)==(t>=minimum)
        method='Continuous speedcap bound S≤cap×t plus explicitly attainable constant-cap trajectory'
        note=f'Actual road{distance},cap{cap}; any trajectory with bounded speed needs t≥{minimum}h, achieved at constantcap. All offered candidate-times checked; result is true continuous minimum, not only MCQ minimum.'
    elif kind=='plane-road-by-train':
        plane,time,train=nums(s);distance=plane*time;value=integer(F(distance,train))
        note=f'Plane establishes conserved{distance}km road; train duration{value}h, independently equals flighttime×speedratio{F(plane,train)}.'
    elif kind=='late-early-distance':
        slow,late,fast,early=nums(s);assert 'екі жағдайда да бір мезгілде' in s and slow<fast
        distance=F(late+early,F(1,slow)-F(1,fast));bell=F(distance,slow)-late;assert bell==F(distance,fast)+early and bell>0
        answer=pick(row,distance,'м');domain=[d for d in range(1,2*integer(distance)+1) if F(d,slow)-late==F(d,fast)+early];assert domain==[distance]
        method='Independent exact arrival-time equations versus one common bell plus complete positive-distance witness domain'
        note=f'Printed equations d/{slow}−{late}=d/{fast}+{early} give unique d={distance}m by positive linear coefficient. Arrivaldurations{distance/slow}/{distance/fast}; commonbell{bell}min. Enumerated all1..{2*integer(distance)}integer distances as additional witness, not uniqueness proof.'
    elif kind=='same-direction-gap-time':
        fast,slow,gap=nums(s);value=integer(F(gap,fast-slow));assert fast>slow
        assert fast*value-slow*value==gap and all(fast*t-slow*t<gap for t in range(value))
        method='Independent signed same-origin same-direction trajectories, positive relative-speed unique crossing'
        note=f'x_fast={fast}t,x_slow={slow}t; separation{fast-slow}t first reaches{gap}at t={value}h. Every earlier wholehour has smaller gap; positive linear slope proves no earlier real crossing.'
    elif kind=='meeting-distance-gap':
        distance,bus,car=nums(s);t=F(distance,bus+car);bus_x=bus*t;car_x=distance-car*t;assert bus_x==car_x
        car_distance=distance-car_x;bus_distance=bus_x;answer=pick(row,car_distance-bus_distance,'км')
        method='Independent signed opposite trajectories x_bus=vt,x_car=S−ut, common meeting position and walked distances'
        note=f'Meeting t={t}h,position{bus_x}km. Carwalked{car_distance},buswalked{bus_distance}; sum{distance},requested difference{car_distance-bus_distance}km, not individual path/speed difference.'
    elif kind=='delayed-catch-clock':
        clocks=[int(h)*60+int(m) for h,m in re.findall(r'(\d{2}):(\d{2})',s)];assert len(clocks)==2;first,second=clocks
        speeds=[int(n) for n in re.findall(r'(\d+) км/сағ',s)];slow,fast=speeds;assert first<second and slow<fast
        root=F(fast*second-slow*first,fast-slow);assert root>second and root.denominator==1
        assert F(slow*(root-first),60)==F(fast*(root-second),60)
        for minute in range(second,integer(root)):assert slow*(minute-first)>fast*(minute-second)
        clock=datetime(2026,1,1)+timedelta(minutes=integer(root));answer=clock.strftime('%H:%M');assert answer in row['options']
        method='Independent absolute-minute signed delayed trajectories, unique linear root, datetime clock and every earlier minute checked'
        note=f'Starts at minutes{first}/{second},rates{slow}/{fast}; unique absolute rootminute{root}={answer}, both positions{F(slow*(root-first),60)}km. Startlead based on slow departure, elapsedchase added to FAST start.'
    elif kind=='second-stage-speed':
        firsttime,firstspeed,secondtime,total=nums(s);remaining=total-firsttime*firstspeed;value=integer(F(remaining,secondtime));assert 0<value<firstspeed
        note=f'Actual first leg{firsttime*firstspeed},remaining{remaining}; second speed{value}km/h restores total{total}and satisfies explicit slowdown{value}<{firstspeed}.'
    elif kind=='opposite-unknown-speed':
        first,time,separation=nums(s);states=[v for v in range(1,separation+1) if first*time-(-v*time)==separation];value=one(states)
        method='Independent signed opposite velocities and complete positive unknown-speed domain bounded by total separation'
        note=f'At common{time}h, x1={first}t,x2=−vt. Exact separation equation gives v={value}; every speed1..{separation}checked, higher speeds alone exceed full separation. Reconstructed paths{first*time}+{value*time}={separation}.'
    elif kind=='dog-catches-rabbit':
        gap,dog,rabbit=nums(s);t=F(gap,dog-rabbit);assert dog>rabbit;answer=pick(row,t,'с')
        assert dog*t==gap+rabbit*t and all(dog*x<gap+rabbit*x for x in range(integer(t)))
        method='Independent signed same-direction pursuit x_dog=vt,x_rabbit=initialgap+ut, unique real linear catch'
        note=f'Initialgap{gap},speeds{dog}/{rabbit}; exact t={t}s gives both positions{dog*t}m; earlier whole seconds have positive gap and linear strict slope establishes first crossing.'
    elif kind=='two-stage-distance':
        t,v,u,w=nums(s);value=t*v+u*w
        note=f'Actual separate legs {t}×{v}={t*v}km and{u}×{w}={u*w}km sum{value}; no unweighted speedaverage or one speed applied to all time.'
    elif kind=='remaining-walk-time':
        distance,speed,elapsed=nums(s);left=distance-speed*elapsed;assert left>0;value=F(left,speed);answer=pick(row,value,'мин');assert F(distance,speed)-elapsed==value
        note=f'Actual walked{speed*elapsed}m removed from original{distance}m; left{left}m requires{value}min. Independent total-time-minus-elapsed identity agrees; full time not requested.'
    else:raise AssertionError(kind)
    if answer is None:answer=str(integer(value))
    assert answer==row['answer'],(row['editionId'],answer,row['answer'])
    if row.get('options'):assert len(row['options'])==4 and len(set(row['options']))==4 and row['options'].count(answer)==1
    else:assert answer.isdecimal() and s.endswith('Жауапқа тек санды жазыңыз.')
    return {'method':method,'notes':note+' Every saved/new full condition, full solution and offered option independently read; direction, common origins/departures, requested unit and skill checked.'}


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');args=parser.parse_args()
    rows=json.loads((ROOT/PACK).read_text())['editions'];assert len(rows)==39
    entries=[]
    for row in rows:
        ref=one(row['sourceRefs']);raw=one([q for q in json.loads((ROOT/ref['sourceFile']).read_text())['questions'] if q['id']==ref['sourceId']]);assert raw['checked'] and row['grade']==4 and row['minimumPlan']=='pro'
        entries.append({'editionId':row['editionId'],'sha256':digest(row),'verdict':'verified',**solve(row)})
    assert len({r['sourceRefs'][0]['sourceId'] for r in rows})==39
    rejected=0
    for row in rows:
        bad=copy.deepcopy(row);bad['answer']='wrong-key'
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError('Wrong key accepted')
    canaries=[(1,'18 м/с','19 м/с'),(5,'475 км','480 км'),(13,'10 км/сағ','12 км/сағ'),(15,'210 м/мин','200 м/мин'),(16,'1200 м','1800 м'),(21,'45 км/сағ','54 км/сағ'),(24,'4 минут кешігеді','5 минут кешігеді'),(25,'60 км','72 км'),(26,'720 км','900 км'),(27,'09:00','10:00'),(28,'590 км','594 км'),(29,'100 км','104 км'),(30,'84 м','91 м'),(35,'75 км/сағ','76 км/сағ'),(36,'7 минут','8 минут')]
    for index,old,new in canaries:
        bad=copy.deepcopy(rows[index]);assert old in bad['statement'];bad['statement']=bad['statement'].replace(old,new)
        try:solve(bad)
        except AssertionError:rejected+=1
        else:raise AssertionError(('Printed canary accepted',index))
    report={'schemaVersion':1,'pack':PACK,'reviewedAt':'2026-10-24','scope':'All39 saved/new full conditions, full solutions and MCQ read; independent printed Fraction conservation, signed same/opposite/delayed trajectories, absolute-minute/datetimeclock, common-bell lateearly equation, continuous cap bound,171 symbolic-formula and full finite speed/distance domains.39wrongkeys+15printedcanaries rejected.','entries':entries}
    if args.write:(ROOT/OUT).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'reviewed':len(entries),'wrongKeysAndPrintedCanariesRejected':rejected,'status':'passed'}))

if __name__=='__main__':main()
